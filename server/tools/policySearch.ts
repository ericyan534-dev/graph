import { PolicyFilters, PolicySearchHit, PolicySectionHit } from "../types";
import {
  collectObjects,
  extractBillRecords,
  firstItem,
  unwrapCollection,
  UnknownRecord,
} from "../lib/congress";

const toStringValue = (value: unknown) => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  return undefined;
};

const CONGRESS_API_BASE =
  process.env.CONGRESS_API_BASE_URL ?? "https://api.congress.gov/v3";
const CONGRESS_API_KEY = process.env.CONGRESS_API_KEY ?? "";
const DEFAULT_PAGE_SIZE = Number.parseInt(
  process.env.CONGRESS_PAGE_SIZE ?? "50",
  10
);
const MAX_RESULTS = Number.parseInt(
  process.env.CONGRESS_MAX_RESULTS ?? "200",
  10
);
const MAX_HITS = Number.parseInt(
  process.env.POLICY_SEARCH_MAX_HITS ?? "10",
  10
);
const MIN_RELEVANCE = Number.parseFloat(
  process.env.POLICY_SEARCH_MIN_RELEVANCE ?? "0.6"
);
const MAX_PAGES = Number.parseInt(
  process.env.CONGRESS_MAX_PAGES ?? "6",
  10
);

const BILL_PATTERN = /(?:(\d{3})[a-zA-Z]{0,2}\s*)?(h\.?r\.|s\.|s\.?j\.?res\.|h\.?j\.?res\.|s\.?con\.?res\.|h\.?con\.?res\.|s\.?res\.|h\.?res\.)\s*(\d{1,4})/i;

type SearchInput = {
  query: string;
  filters?: PolicyFilters;
};

type BillLocator = {
  congress: number;
  billType: string;
  billNumber: string;
};

const parseBillId = (billId: string): BillLocator | undefined => {
  const [congress, billType, billNumber] = billId.split("-");
  if (!congress || !billType || !billNumber) return undefined;
  return {
    congress: Number.parseInt(congress, 10),
    billType,
    billNumber,
  };
};

const toBillType = (raw?: string) => {
  if (!raw) return undefined;
  const normalized = raw.replace(/\./g, "").toLowerCase();
  switch (normalized) {
    case "hr":
      return "hr";
    case "s":
      return "s";
    case "sjres":
      return "sjres";
    case "hjres":
      return "hjres";
    case "sconres":
      return "sconres";
    case "hconres":
      return "hconres";
    case "sres":
      return "sres";
    case "hres":
      return "hres";
    default:
      return normalized;
  }
};

const buildRequestUrl = (query: string, filters?: PolicyFilters) => {
  const params = new URLSearchParams();
  params.set("format", "json");
  params.set("sort", "latestActionDate:desc");
  params.set("pageSize", String(DEFAULT_PAGE_SIZE));
  const terms = [query, ...(filters?.keywords ?? [])]
    .map((term) => term?.trim())
    .filter((term): term is string => Boolean(term && term.length > 0));
  if (terms.length > 0) {
    const combined = Array.from(new Set(terms)).join(" ");
    params.set("query", combined);
    params.set("q", combined);
  }
  if (filters?.congress) {
    params.set("congress", String(filters.congress));
  }
  if (filters?.dateRange?.from) {
    params.set("fromDate", filters.dateRange.from);
  }
  if (filters?.dateRange?.to) {
    params.set("toDate", filters.dateRange.to);
  }
  return `${CONGRESS_API_BASE}/bill?${params.toString()}`;
};

const fetchWithKey = async (url: string): Promise<UnknownRecord> => {
  const headers: Record<string, string> = {};
  if (CONGRESS_API_KEY) {
    headers["X-Api-Key"] = CONGRESS_API_KEY;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(
      `Congress.gov request failed with status ${response.status}: ${await response.text()}`
    );
  }
  return (await response.json()) as UnknownRecord;
};

const buildBillDetailUrl = ({
  congress,
  billType,
  billNumber,
}: BillLocator) => {
  const params = new URLSearchParams();
  params.set("format", "json");
  params.set("summaries", "true");
  params.set("sections", "true");
  return `${CONGRESS_API_BASE}/bill/${congress}/${billType}/${billNumber}?${params.toString()}`;
};

const computeConfidence = (idx: number, total: number, hasSummary: boolean) => {
  const base = 70;
  const rankBonus = Math.max(0, 20 - idx * 5);
  const coverage = hasSummary ? 8 : 0;
  const totalBonus = total > 3 ? 2 : 0;
  return Math.min(99, base + rankBonus + coverage + totalBonus);
};

export const normalizeQuery = (query: string) => {
  const match = query.match(BILL_PATTERN);
  if (!match) return query.trim();
  const [, congressGuess, billTypeRaw, billNumber] = match;
  const billType = toBillType(billTypeRaw);
  if (!billType || !billNumber) return query.trim();
  const normalized = `${billType.toUpperCase()} ${Number.parseInt(
    billNumber,
    10
  )}`;
  if (congressGuess) {
    return `${normalized} (${congressGuess}th Congress)`;
  }
  return normalized;
};

const normalizeToken = (token: string) =>
  token
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .trim();

const tokenize = (value: string | undefined) => {
  if (!value) return [] as string[];
  return value
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((piece) => normalizeToken(piece))
    .filter((piece): piece is string => Boolean(piece && piece.length > 1));
};

const extractSections = (bill: UnknownRecord): PolicySectionHit[] => {
  const snippets: PolicySectionHit[] = [];
  const summaryEntry =
    firstItem(bill.summary) ??
    firstItem(bill.summaries);
  const summaryText =
    toStringValue(summaryEntry?.text) ??
    toStringValue(summaryEntry?.summary) ??
    toStringValue(summaryEntry?.description) ??
    toStringValue(bill.summary);
  const billNumber =
    toStringValue(bill.billNumber) ??
    toStringValue(bill.number) ??
    toStringValue(bill.bill_id) ??
    "bill";
  if (summaryText) {
    snippets.push({
      id: `${billNumber}-summary`,
      heading:
        toStringValue(summaryEntry?.title) ??
        toStringValue(summaryEntry?.heading) ??
        undefined,
      snippet: summaryText.slice(0, 300),
      score: 0.82,
      sourceUri:
        toStringValue(summaryEntry?.url) ??
        toStringValue(summaryEntry?.source) ??
        toStringValue(bill.url) ??
        toStringValue(bill.source),
    });
  }
  const sectionBySection = firstItem(bill.sectionBySection);
  const sections = [
    ...unwrapCollection(bill.sections),
    ...unwrapCollection(bill.sectionList),
    ...unwrapCollection(sectionBySection?.sections),
    ...unwrapCollection(sectionBySection?.section),
  ];
  if (Array.isArray(sections)) {
    sections.slice(0, 3).forEach((section, idx: number) => {
      if (!section) return;
      const heading =
        (section.heading as string | undefined) ??
        (section.title as string | undefined) ??
        (section.sectionTitle as string | undefined);
      const text =
        (section.text as string | undefined) ??
        (section.sectionText as string | undefined) ??
        (section.summary as string | undefined) ??
        (section.snippet as string | undefined);
      if (text) {
        snippets.push({
          id:
            toStringValue(section.sectionId) ??
            toStringValue(section.identifier) ??
            toStringValue(section.sectionNumber) ??
            `${billNumber}-section-${idx}`,
          heading,
          snippet: String(text).slice(0, 280),
          score: 0.7 - idx * 0.05,
          sourceUri:
            toStringValue(section.url) ??
            toStringValue(section.citation) ??
            toStringValue(section.source) ??
            toStringValue(bill.url) ??
            undefined,
        });
      }
    });
  }
  return snippets;
};

const buildBillAliasTokens = (hit: PolicySearchHit) => {
  const aliases = new Set<string>();
  if (hit.billType && hit.billNumber) {
    const compact = `${hit.billType}${hit.billNumber}`.toLowerCase();
    aliases.add(compact);
    aliases.add(`${hit.billType} ${hit.billNumber}`.toLowerCase());
    aliases.add(`${hit.billType.toUpperCase()} ${hit.billNumber}`.toLowerCase());
    aliases.add(`${hit.billType.replace(/\./g, "")}${hit.billNumber}`.toLowerCase());
  }
  if (hit.congress) {
    aliases.add(`${hit.congress} ${hit.billType} ${hit.billNumber}`.toLowerCase());
  }
  return aliases;
};

const computeRelevanceScore = (
  hit: PolicySearchHit,
  queryTokens: Set<string>,
  keywordTokens: Set<string>
) => {
  const combinedTokens = new Set<string>([...queryTokens, ...keywordTokens]);
  if (combinedTokens.size === 0) {
    return hit.summary ? 0.4 : 0.2;
  }

  const haystacks: Array<[string | undefined, number]> = [
    [hit.title, 4],
    [hit.summary, 3],
    [hit.latestAction, 2],
    [hit.sections.map((section) => section.snippet).join(" "), 1.5],
    [hit.sponsor?.name, 1],
  ];

  const aliasTokens = buildBillAliasTokens(hit);
  const aliasMatches = Array.from(aliasTokens).filter((alias) =>
    alias &&
    haystacks.some(([text]) =>
      typeof text === "string" && text.toLowerCase().includes(alias)
    )
  );

  let score = aliasMatches.length > 0 ? 0.45 : 0;

  for (const [text, weight] of haystacks) {
    if (!text) continue;
    const tokens = tokenize(text);
    for (const token of tokens) {
      if (combinedTokens.has(token)) {
        score += 0.1 * weight;
      }
    }
  }

  const keywordBoost = keywordTokens.size > 0 ? 0.05 * keywordTokens.size : 0;
  score += keywordBoost;

  return Math.min(0.99, score);
};

const mapBillToSearchHit = (
  bill: UnknownRecord,
  filters?: PolicyFilters
): PolicySearchHit => {
  const congressRaw =
    toStringValue(bill?.congress) ??
    toStringValue(bill?.congressNumber) ??
    toStringValue(bill?.congress_num);
  const congress = congressRaw ? Number.parseInt(congressRaw, 10) : filters?.congress ?? 0;
  const billType =
    toStringValue(bill?.billType)?.toLowerCase() ??
    toStringValue(bill?.type)?.toLowerCase() ??
    toStringValue(bill?.bill_type)?.toLowerCase() ??
    "";
  const billNumber =
    toStringValue(bill?.billNumber) ??
    toStringValue(bill?.number) ??
    toStringValue(bill?.bill_num) ??
    toStringValue(bill?.bill_id) ??
    "";

  const billId =
    billType && billNumber
      ? `${congress || filters?.congress || 0}-${billType}-${billNumber}`
      : filters?.billId ?? `${congress || filters?.congress || 0}-${billType}-${billNumber}`;
  const summaryEntry =
    firstItem(bill.summary) ??
    firstItem(bill.summaries);
  const summaryText =
    toStringValue(summaryEntry?.text) ??
    toStringValue(summaryEntry?.summary) ??
    toStringValue(summaryEntry?.description);
  const actionEntries = collectObjects(bill.latestAction, bill.actions, bill.actionList);
  const latestActionEntry = actionEntries[0];
  const latestActionText =
    toStringValue(latestActionEntry?.text) ??
    toStringValue(latestActionEntry?.description) ??
    toStringValue(latestActionEntry?.title) ??
    toStringValue(latestActionEntry?.action); 
  const sponsors = collectObjects(
    bill.sponsors,
    bill.sponsor,
    bill.cosponsors,
    bill.cosponsorList
  );
  const firstSponsor = sponsors[0];

  return {
    billId,
    congress: congress || filters?.congress || 0,
    billType,
    billNumber,
    title:
      toStringValue(bill?.title) ??
      toStringValue(bill?.titleType) ??
      toStringValue(bill?.shortTitle) ??
      toStringValue(bill?.originChamberTitle) ??
      "Untitled bill",
    status:
      toStringValue(bill?.currentStatus) ??
      latestActionText ??
      "Unknown",
    latestAction: latestActionText,
    summary:
      summaryText ??
      toStringValue(bill?.titleDescription) ??
      latestActionText,
    jurisdiction: "federal",
    sections: extractSections(bill),
    confidence: 0,
    sponsor: sponsors.length
      ? {
          name:
            toStringValue(firstSponsor?.fullName) ??
            toStringValue(firstSponsor?.name) ??
            toStringValue(firstSponsor?.sponsorName) ??
            "",
          party: toStringValue(firstSponsor?.party),
          state: toStringValue(firstSponsor?.state),
          bioguideId:
            toStringValue(firstSponsor?.bioguideId) ??
            toStringValue(firstSponsor?.bioguide_id) ??
            toStringValue(firstSponsor?.bioguide),
        }
      : undefined,
  } satisfies PolicySearchHit;
};

const resolveNextUrl = (payload: UnknownRecord): string | undefined => {
  const pagination = payload?.pagination as UnknownRecord | undefined;
  const nextLink =
    toStringValue(pagination?.next) ??
    toStringValue(pagination?.nextPage) ??
    toStringValue(pagination?.next_url);
  if (nextLink) {
    return nextLink.startsWith("http") ? nextLink : `${CONGRESS_API_BASE}${nextLink}`;
  }
  const links = payload?.links as UnknownRecord | undefined;
  const nextHref = toStringValue(links?.next);
  if (nextHref) {
    return nextHref.startsWith("http") ? nextHref : `${CONGRESS_API_BASE}${nextHref}`;
  }
  return undefined;
};

export const policySearchTool = async ({
  query,
  filters,
}: SearchInput): Promise<PolicySearchHit[]> => {
  if (filters?.billId) {
    const locator = parseBillId(filters.billId);
    if (locator) {
      const payload = await fetchWithKey(buildBillDetailUrl(locator));
      const bill =
        firstItem((payload as UnknownRecord)["bill"]) ??
        extractBillRecords(payload)[0];
      if (bill) {
        const hit = mapBillToSearchHit(bill, filters);
        hit.confidence = computeConfidence(0, 1, Boolean(hit.summary));
        return [hit];
      }
    }
  }

  let url: string | undefined = buildRequestUrl(query, filters);
  const aggregated: PolicySearchHit[] = [];
  let page = 0;

  while (url && page < MAX_PAGES && aggregated.length < MAX_RESULTS) {
    const payload = await fetchWithKey(url);
    const bills = extractBillRecords(payload);
    bills.forEach((billRecord) => {
      if (aggregated.length >= MAX_RESULTS) return;
      const hit = mapBillToSearchHit(billRecord, filters);
      if (!hit.billType || !hit.billNumber) {
        return;
      }
      if (aggregated.some((existing) => existing.billId === hit.billId)) {
        return;
      }
      aggregated.push(hit);
    });
    page += 1;
    url = resolveNextUrl(payload);
    if (!url || bills.length === 0) {
      break;
    }
  }

  const queryTokens = new Set(tokenize(query));
  const keywordTokens = new Set(
    (filters?.keywords ?? []).flatMap((keyword) => tokenize(keyword))
  );

  const scored = aggregated
    .map((hit) => {
      const relevance = computeRelevanceScore(hit, queryTokens, keywordTokens);
      return { hit, relevance };
    })
    .filter(({ relevance }) => relevance >= MIN_RELEVANCE)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, Math.max(0, Math.min(MAX_HITS, aggregated.length)));

  return scored.map(({ hit, relevance }, index, list) => ({
    ...hit,
    confidence:
      Math.max(
        35,
        Math.round(
          Math.max(
            relevance * 100,
            computeConfidence(index, list.length, Boolean(hit.summary))
          )
        )
      ),
  }));
};
