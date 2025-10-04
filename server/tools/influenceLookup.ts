import { InfluenceResult, LobbyingRecord, FinanceRecord } from "../types";

const LDA_BASE_URL = process.env.LDA_API_BASE_URL ?? "https://lda.senate.gov/api/v1";
const FEC_BASE_URL = process.env.FEC_API_BASE_URL ?? "https://api.open.fec.gov/v1";
const FEC_API_KEY = process.env.FEC_API_KEY ?? "";

type UnknownRecord = Record<string, unknown>;

const toStringValue = (value: unknown) => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  return undefined;
};

type InfluenceLookupInput = {
  billId: string;
  keywords?: string[];
  sponsors?: {
    name: string;
  }[];
  period?: {
    from?: string;
    to?: string;
  };
};

const fetchJson = async (url: string): Promise<UnknownRecord> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Influence lookup failed (${response.status}): ${await response.text()}`);
  }
  return (await response.json()) as UnknownRecord;
};

const uniqueBy = <T, K extends PropertyKey>(items: T[], key: (item: T) => K) => {
  const seen = new Set<K>();
  const result: T[] = [];
  for (const item of items) {
    const id = key(item);
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(item);
  }
  return result;
};

const deriveLdaSearchTerms = (input: InfluenceLookupInput): string[] => {
  const terms = new Set<string>();
  if (input.billId) {
    terms.add(input.billId.replace(/-/g, " "));
  }
  (input.keywords ?? []).forEach((keyword) => {
    if (!keyword) return;
    const trimmed = keyword.trim();
    if (!trimmed) return;
    terms.add(trimmed);
    if (trimmed.includes(" ")) {
      const shorter = trimmed
        .split(/\s+/)
        .slice(0, 4)
        .join(" ");
      if (shorter.length > 3) {
        terms.add(shorter);
      }
    }
  });
  const derived = Array.from(terms).slice(0, 6);
  if (derived.length === 0 && input.billId) {
    return [input.billId.replace(/-/g, " ")];
  }
  return derived;
};

const mapLdaResults = (payload: UnknownRecord): LobbyingRecord[] => {
  const results =
    (payload?.results as UnknownRecord[] | undefined) ??
    (payload?.data as UnknownRecord[] | undefined) ??
    [];
  if (!Array.isArray(results)) return [];
  const mapped: LobbyingRecord[] = [];
  for (const filing of results) {
    const specificIssues = filing?.specific_issues as UnknownRecord[] | undefined;
    mapped.push({
      id:
        toStringValue(filing?.id) ??
        toStringValue(filing?.filing_id) ??
        toStringValue(filing?.registration_number) ??
        Math.random().toString(36).slice(2),
      client: toStringValue(filing?.client_name) ?? toStringValue(filing?.client) ?? "Unknown client",
      registrant:
        toStringValue(filing?.registrant_name) ??
        toStringValue(filing?.registrant) ??
        "Unknown registrant",
      amount:
        Number(
          toStringValue(specificIssues?.[0]?.amount) ??
            toStringValue(filing?.amount) ??
            toStringValue(filing?.income_amount) ??
            "0"
        ) || undefined,
      issue:
        toStringValue(filing?.specific_issue) ??
        toStringValue(specificIssues?.[0]?.issue) ??
        toStringValue(filing?.general_issue_area),
      period: filing?.year
        ? `${toStringValue(filing?.year) ?? ""} Q${toStringValue(filing?.quarter) ?? ""}`
        : toStringValue(filing?.period),
      sourceUrl:
        toStringValue(filing?.url) ??
        toStringValue(filing?.pdf_url) ??
        toStringValue(filing?.filing_url),
    });
  }
  return uniqueBy(mapped, (entry) => entry.id);
};

const fetchLdaFilings = async (input: InfluenceLookupInput, terms?: string[]) => {
  const queries = terms ?? deriveLdaSearchTerms(input);
  const collected: LobbyingRecord[] = [];
  for (const term of queries) {
    const params = new URLSearchParams({ per_page: "50" });
    params.set("search", term);
    if (input.period?.from) params.set("from_date", input.period.from);
    if (input.period?.to) params.set("to_date", input.period.to);
    const url = `${LDA_BASE_URL}/filings/?${params.toString()}`;
    try {
      const payload = await fetchJson(url);
      const mapped = mapLdaResults(payload);
      collected.push(...mapped);
      if (collected.length >= 20) break;
    } catch (error) {
      console.warn("LDA lookup failed", error);
    }
  }
  return uniqueBy(collected.slice(0, 25), (entry) => entry.id);
};

const searchFecCandidate = async (name: string): Promise<UnknownRecord | undefined> => {
  const variants = uniqueBy(
    [
      name,
      name.replace(/,/g, " "),
      name
        .split(/\s+/)
        .slice(0, 2)
        .join(" "),
      name
        .split(/\s+/)
        .slice(-1)
        .join(" "),
    ].filter((variant) => variant.trim().length > 0),
    (variant) => variant.toLowerCase()
  );

  for (const variant of variants) {
    const params = new URLSearchParams({
      per_page: "5",
      sort_hide_null: "false",
      sort_null_only: "false",
      sort: "-two_year_period",
      q: variant,
    });
    if (FEC_API_KEY) params.set("api_key", FEC_API_KEY);
    const url = `${FEC_BASE_URL}/candidates/search/?${params.toString()}`;
    try {
      const data = await fetchJson(url);
      const result = (data?.results as UnknownRecord[] | undefined)?.[0];
      if (result) return result;
    } catch (error) {
      console.warn(`FEC candidate search failed for ${variant}`, error);
    }
  }
  return undefined;
};

const fetchCandidateTotals = async (candidateId: string): Promise<FinanceRecord | undefined> => {
  const params = new URLSearchParams({
    per_page: "1",
    sort: "-cycle",
  });
  if (FEC_API_KEY) params.set("api_key", FEC_API_KEY);
  const url = `${FEC_BASE_URL}/candidate/${candidateId}/totals/?${params.toString()}`;
  try {
    const data = await fetchJson(url);
    const record = (data?.results as UnknownRecord[] | undefined)?.[0];
    if (!record) return undefined;
    const finance: FinanceRecord = {
      candidateId,
      committeeName:
        toStringValue(record.committee_name) ??
        toStringValue(record.candidate_name) ??
        candidateId,
      totalReceipts:
        Number(toStringValue(record.receipts) ?? toStringValue(record.total_receipts) ?? "0") ||
        undefined,
      cycle: Number(toStringValue(record.cycle) ?? "0") || undefined,
      sourceUrl: `https://www.fec.gov/data/candidate/${candidateId}/?cycle=${
        toStringValue(record.cycle) ?? ""
      }`,
    };
    return finance;
  } catch (error) {
    console.warn(`FEC totals failed for ${candidateId}`, error);
    return undefined;
  }
};

const fetchFecFinance = async (input: InfluenceLookupInput) => {
  if (!input.sponsors?.length) return [];
  const finances: FinanceRecord[] = [];
  for (const sponsor of input.sponsors) {
    if (!sponsor?.name) continue;
    const candidate = await searchFecCandidate(sponsor.name);
    const candidateId =
      toStringValue(candidate?.candidate_id) ?? toStringValue(candidate?.id);
    if (!candidateId) continue;
    const totals = await fetchCandidateTotals(candidateId);
    if (totals) {
      finances.push(totals);
    }
  }
  return finances;
};

export const influenceLookupTool = async (
  input: InfluenceLookupInput
): Promise<InfluenceResult> => {
  const ldaQueries = deriveLdaSearchTerms(input);
  const [lobbying, finance] = await Promise.all([
    fetchLdaFilings(input, ldaQueries),
    fetchFecFinance(input),
  ]);

  const notes: string[] = [];
  if (!FEC_API_KEY) {
    notes.push("FEC API key not provided; finance data may be limited.");
  }
  if (!lobbying.length) {
    notes.push("No recent Senate LDA filings matched the query.");
  }
  if (!finance.length) {
    notes.push("No FEC finance totals were matched to bill sponsors.");
  }

  return {
    lobbying,
    finance,
    metadata: {
      notes,
      links: {
        lda: `${LDA_BASE_URL.replace(/\/?$/, "")}/filings/`,
        fec: "https://api.open.fec.gov/developers/#!/candidate/get_candidate__candidate_id__totals_",
      },
      searchTerms: ldaQueries,
    },
  };
};
