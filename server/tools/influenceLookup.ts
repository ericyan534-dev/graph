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

const toRecord = (value: unknown): UnknownRecord | undefined => {
  if (value && typeof value === "object") {
    return value as UnknownRecord;
  }
  return undefined;
};

const toArray = (value: unknown): UnknownRecord[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value as UnknownRecord[];
  if (typeof value === "object") {
    const record = value as UnknownRecord;
    const item = record.item ?? record.items ?? record.results;
    if (Array.isArray(item)) return item as UnknownRecord[];
    if (item !== undefined) return [item as UnknownRecord];
  }
  return [];
};

const pickString = (...values: unknown[]) => {
  for (const value of values) {
    if (!value) continue;
    const direct = toStringValue(value);
    if (direct) return direct;
    const record = toRecord(value);
    if (!record) continue;
    for (const key of Object.keys(record)) {
      const nested = toStringValue(record[key]);
      if (nested) return nested;
    }
  }
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

const mapLdaResults = (payload: UnknownRecord): LobbyingRecord[] => {
  const results = toArray(payload?.results ?? payload?.data ?? payload?.filings);
  if (!results.length) return [];
  const mapped: LobbyingRecord[] = [];
  for (const filing of results) {
    const issues = toArray(filing?.specific_issues ?? filing?.specificIssues);
    const primaryIssue = toRecord(issues[0]);
    const client = toRecord(filing?.client);
    const registrant = toRecord(filing?.registrant);
    const id =
      toStringValue(filing?.id) ??
      toStringValue(filing?.filing_id) ??
      toStringValue(filing?.registration_number) ??
      Math.random().toString(36).slice(2);
    const amountRaw = pickString(
      primaryIssue?.amount,
      filing?.amount,
      filing?.income_amount,
      filing?.expenses,
      filing?.income
    );
    mapped.push({
      id,
      client:
        pickString(
          filing?.client_name,
          client?.name,
          client?.client_name,
          client?.organization_name,
          filing?.client
        ) ?? "Unknown client",
      registrant:
        pickString(
          filing?.registrant_name,
          registrant?.name,
          registrant?.organization_name,
          filing?.registrant
        ) ?? "Unknown registrant",
      amount: amountRaw ? Number(amountRaw) || undefined : undefined,
      issue:
        pickString(
          filing?.specific_issue,
          primaryIssue?.issue,
          primaryIssue?.description,
          primaryIssue?.specific_issue,
          filing?.general_issue_area
        ) ?? undefined,
      period:
        pickString(
          filing?.period,
          filing?.report_period,
          filing?.effective_date,
          filing?.year
        ) ??
        (filing?.year
          ? `${toStringValue(filing?.year) ?? ""}${
              filing?.quarter ? ` Q${toStringValue(filing?.quarter) ?? ""}` : ""
            }`
          : undefined),
      sourceUrl:
        pickString(
          filing?.url,
          filing?.pdf_url,
          filing?.filing_url,
          filing?.document_url,
          toRecord(filing?.document)?.url
        ),
    });
  }
  return uniqueBy(mapped, (entry) => entry.id);
};

const fetchLdaFilings = async (input: InfluenceLookupInput) => {
  const params = new URLSearchParams({ per_page: "10" });
  if (input.keywords?.length) {
    params.set("search", input.keywords.join(" "));
  } else {
    params.set("search", input.billId.replace(/-/g, " "));
  }
  if (input.period?.from) params.set("from_date", input.period.from);
  if (input.period?.to) params.set("to_date", input.period.to);
  const url = `${LDA_BASE_URL}/filings/?${params.toString()}`;
  try {
    const payload = await fetchJson(url);
    return mapLdaResults(payload);
  } catch (error) {
    console.warn("LDA lookup failed", error);
    return [];
  }
};

const searchFecCandidate = async (name: string): Promise<UnknownRecord | undefined> => {
  const params = new URLSearchParams({
    per_page: "5",
    sort_hide_null: "false",
    sort_null_only: "false",
    sort: "-two_year_period",
    q: name,
  });
  if (FEC_API_KEY) params.set("api_key", FEC_API_KEY);
  const url = `${FEC_BASE_URL}/candidates/search/?${params.toString()}`;
  try {
    const data = await fetchJson(url);
    return (data?.results as UnknownRecord[] | undefined)?.[0];
  } catch (error) {
    console.warn(`FEC candidate search failed for ${name}`, error);
    return undefined;
  }
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
  const [lobbying, finance] = await Promise.all([
    fetchLdaFilings(input),
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
    },
  };
};
