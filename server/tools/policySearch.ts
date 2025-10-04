import { PolicyFilters, PolicySearchHit, PolicySectionHit } from "../types";

type UnknownRecord = Record<string, unknown>;

const toStringValue = (value: unknown) => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  return undefined;
};

const CONGRESS_API_BASE =
  process.env.CONGRESS_API_BASE_URL ?? "https://api.congress.gov/v3";
const CONGRESS_API_KEY = process.env.CONGRESS_API_KEY ?? "";

const BILL_PATTERN = /(?:(\d{3})[a-zA-Z]{0,2}\s*)?(h\.?r\.|s\.|s\.?j\.?res\.|h\.?j\.?res\.|s\.?con\.?res\.|h\.?con\.?res\.|s\.?res\.|h\.?res\.)\s*(\d{1,4})/i;

type SearchInput = {
  query: string;
  filters?: PolicyFilters;
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
  params.set("pageSize", "5");
  if (query.trim().length > 0) {
    params.set("query", query);
    params.set("q", query);
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

const extractSections = (bill: UnknownRecord): PolicySectionHit[] => {
  const snippets: PolicySectionHit[] = [];
  const summary =
    (bill?.summary as UnknownRecord | undefined)?.text ??
    ((bill?.summaries as UnknownRecord[] | undefined)?.[0] as UnknownRecord | undefined)?.text;
  if (summary) {
    snippets.push({
      id: `${bill?.billNumber ?? bill?.number ?? bill?.bill_id}-summary`,
      heading:
        (bill?.summary as UnknownRecord | undefined)?.title ??
        ((bill?.summaries as UnknownRecord[] | undefined)?.[0] as UnknownRecord | undefined)?.title,
      snippet: summary.slice(0, 300),
      score: 0.82,
      sourceUri:
        (bill?.summary as UnknownRecord | undefined)?.url ??
        ((bill?.summaries as UnknownRecord[] | undefined)?.[0] as UnknownRecord | undefined)?.url ??
        (bill?.url as string | undefined),
    });
  }
  const sections =
    (bill?.sections as UnknownRecord[] | undefined) ??
    (bill?.sectionList as UnknownRecord[] | undefined);
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
            (section.sectionId as string | undefined) ??
            (section.identifier as string | undefined) ??
            `${bill?.billNumber ?? bill?.number}-section-${idx}`,
          heading,
          snippet: String(text).slice(0, 280),
          score: 0.7 - idx * 0.05,
          sourceUri:
            (section.url as string | undefined) ??
            (section.citation as string | undefined) ??
            (section.source as string | undefined) ??
            (bill?.url as string | undefined) ??
            undefined,
        });
      }
    });
  }
  return snippets;
};

export const policySearchTool = async ({
  query,
  filters,
}: SearchInput): Promise<PolicySearchHit[]> => {
  const url = buildRequestUrl(query, filters);
  const headers: Record<string, string> = {};
  if (CONGRESS_API_KEY) {
    headers["X-Api-Key"] = CONGRESS_API_KEY;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(
      `Congress.gov search failed with status ${response.status}: ${await response.text()}`
    );
  }

  const data = (await response.json()) as UnknownRecord;
  const bills = (data?.bills as UnknownRecord[]) ??
    (data?.results as UnknownRecord[]) ??
    (data?.data as UnknownRecord[]) ??
    [];

  return bills.slice(0, 5).map((bill: UnknownRecord, index: number) => {
    const congressRaw =
      toStringValue(bill?.congress) ??
      toStringValue(bill?.congressNumber) ??
      toStringValue(bill?.congress_num);
    const congress = congressRaw ? Number.parseInt(congressRaw, 10) : 0;
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
    const billId = `${congress || filters?.congress || 0}-${billType}-${billNumber}`;
    const sections = extractSections(bill);
    const confidence = computeConfidence(
      index,
      bills.length,
      Boolean(
        ((bill?.summary as UnknownRecord | undefined)?.text as string | undefined) ??
          (((bill?.summaries as UnknownRecord[] | undefined)?.[0] as UnknownRecord | undefined)?.text as
            string | undefined)
      )
    );
    const summaryText =
      ((bill?.summary as UnknownRecord | undefined)?.text as string | undefined) ??
      (((bill?.summaries as UnknownRecord[] | undefined)?.[0] as UnknownRecord | undefined)?.text as
        string | undefined);
    const sponsors = bill?.sponsors as UnknownRecord[] | undefined;
    const firstSponsor = sponsors?.[0] as UnknownRecord | undefined;
    return {
      billId,
      congress: congress || filters?.congress || 0,
      billType,
      billNumber: billNumber,
      title:
        toStringValue(bill?.title) ??
        toStringValue(bill?.titleType) ??
        toStringValue(bill?.shortTitle) ??
        toStringValue(bill?.originChamberTitle) ??
        "Untitled bill",
      status:
        toStringValue(bill?.currentStatus) ??
        toStringValue((bill?.latestAction as UnknownRecord | undefined)?.text) ??
        "Unknown",
      latestAction:
        toStringValue((bill?.latestAction as UnknownRecord | undefined)?.text) ??
        toStringValue(((bill?.actions as UnknownRecord[] | undefined)?.[0] as UnknownRecord | undefined)?.text),
      summary:
        summaryText ??
        toStringValue(bill?.titleDescription) ??
        toStringValue((bill?.latestAction as UnknownRecord | undefined)?.text),
      jurisdiction: "federal",
      sections,
      confidence,
      sponsor: sponsors?.length
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
  });
};
