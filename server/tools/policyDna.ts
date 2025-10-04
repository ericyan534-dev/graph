import {
  diff_match_patch as DiffMatchPatch,
  DIFF_INSERT,
  DIFF_DELETE,
} from "diff-match-patch";
import {
  PolicyActionEvent,
  PolicyBlameEntry,
  PolicyDNAResult,
  PolicyTimelineEntry,
} from "../types";

const CONGRESS_API_BASE =
  process.env.CONGRESS_API_BASE_URL ?? "https://api.congress.gov/v3";
const CONGRESS_API_KEY = process.env.CONGRESS_API_KEY ?? "";

const dmp = new DiffMatchPatch();

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
    const items = record.item;
    if (Array.isArray(items)) return items as UnknownRecord[];
    if (items !== undefined) return [items as UnknownRecord];
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

type BillLocator = {
  congress: number;
  billType: string;
  billNumber: string;
};

const parseBillId = (billId: string): BillLocator => {
  const [congress, billType, billNumber] = billId.split("-");
  if (!congress || !billType || !billNumber) {
    throw new Error(`Invalid bill id: ${billId}`);
  }
  return {
    congress: Number.parseInt(congress, 10),
    billType,
    billNumber,
  };
};

const buildDetailUrl = ({ congress, billType, billNumber }: BillLocator) => {
  const params = new URLSearchParams({ format: "json" });
  return `${CONGRESS_API_BASE}/bill/${congress}/${billType}/${billNumber}?${params.toString()}`;
};

const fetchWithKey = async (url: string): Promise<UnknownRecord> => {
  const headers: Record<string, string> = {};
  if (CONGRESS_API_KEY) {
    headers["X-Api-Key"] = CONGRESS_API_KEY;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Congress.gov request failed (${response.status}): ${await response.text()}`);
  }
  return (await response.json()) as UnknownRecord;
};

const extractVersionUrl = (version: UnknownRecord): string | undefined => {
  const formats = [
    ...toArray(version?.formats),
    ...toArray(version?.urls),
    ...toArray((version?.download as UnknownRecord | undefined)?.formats),
  ];
  if (formats.length) {
    const xml = formats.find((f) => {
      const type = (toStringValue(f?.type) ?? toStringValue(f?.format) ?? toStringValue(f?.fileType) ?? "").toLowerCase();
      return typeof f?.url === "string" && (type.includes("xml") || type.includes("uslm"));
    });
    if (xml?.url) {
      return xml.url as string;
    }
    const html = formats.find((f) => {
      const type = (toStringValue(f?.type) ?? toStringValue(f?.format) ?? toStringValue(f?.fileType) ?? "").toLowerCase();
      return typeof f?.url === "string" && (type.includes("html") || type.includes("txt"));
    });
    if (html?.url) {
      return html.url as string;
    }
  }
  const download =
    toStringValue(version?.download) ??
    toStringValue((version?.download as UnknownRecord | undefined)?.url) ??
    toStringValue(version?.link);
  if (download) {
    return download;
  }
  if (typeof version?.url === "string") {
    return version.url as string;
  }
  const content = toRecord(version?.content);
  if (content?.url && typeof content.url === "string") {
    return content.url as string;
  }
  return undefined;
};

const downloadVersionText = async (url?: string) => {
  if (!url) return "";
  try {
    const response = await fetch(url);
    if (!response.ok) return "";
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("xml") || contentType.includes("html")) {
      return await response.text();
    }
    if (contentType.includes("json")) {
      const json = await response.json();
      return JSON.stringify(json);
    }
    return await response.text();
  } catch (error) {
    console.warn(`Failed to download bill text from ${url}:`, error);
    return "";
  }
};

const calculateChange = (previous: string, current: string) => {
  if (!previous) {
    return { added: current.length ? 1 : 0, removed: 0, modified: 0 };
  }
  const diffs = dmp.diff_main(previous, current);
  dmp.diff_cleanupSemantic(diffs);
  let added = 0;
  let removed = 0;
  let modified = 0;
  for (const [op, text] of diffs) {
    if (op === DIFF_INSERT) {
      added += text.split(/\s+/).length;
    } else if (op === DIFF_DELETE) {
      removed += text.split(/\s+/).length;
    } else if (op === DiffMatchPatch.DIFF_EQUAL && text.trim().length > 0) {
      modified += 0;
    }
  }
  if (added > 0 && removed > 0) {
    modified += Math.min(added, removed);
  }
  return { added, removed, modified };
};

const mapActions = (bill: UnknownRecord): PolicyActionEvent[] => {
  const actions = toArray(bill?.actions);
  if (!actions.length) return [];
  return actions.slice(0, 25).map((action) => ({
    type:
      pickString(
        action?.type,
        action?.actionType,
        (toRecord(action?.type) ?? toRecord(action?.actionType))?.label
      ) ?? "action",
    date:
      pickString(action?.date, action?.actionDate, action?.recordedAt, action?.datetime) ?? undefined,
    actor:
      pickString(action?.actor, action?.by, action?.committee, action?.chamber, toRecord(action?.actor)?.name) ??
      undefined,
    description:
      pickString(action?.text, action?.description, action?.source, toRecord(action?.actionCode)?.text) ?? undefined,
    link:
      pickString(action?.link, action?.url, action?.sourceLink, toRecord(action?.source)?.url) ?? undefined,
  }));
};

const buildBlameFromAmendments = (bill: UnknownRecord): PolicyBlameEntry[] => {
  const amendments = toArray(bill?.amendments).length
    ? toArray(bill?.amendments)
    : toArray(bill?.relatedBills);
  const blameEntries: PolicyBlameEntry[] = [];
  amendments.slice(0, 10).forEach((amendment) => {
    const sponsor =
      toRecord(amendment?.sponsor) ??
      toRecord(toArray(amendment?.sponsors)[0]) ??
      toRecord((toRecord(amendment?.sponsor)?.item as UnknownRecord | undefined) ?? undefined);
    const latestAction = toRecord(amendment?.latestAction);
    blameEntries.push({
      sectionId:
        pickString(
          amendment?.number,
          amendment?.amendmentNumber,
          amendment?.id,
          amendment?.version,
          amendment?.versionName
        ) ?? `amendment-${Math.random().toString(36).slice(2)}`,
      heading: pickString(amendment?.title, amendment?.purpose, amendment?.description),
      author:
        pickString(
          sponsor?.fullName,
          sponsor?.name,
          sponsor?.sponsorName,
          amendment?.sponsor
        ) ?? undefined,
      actionType: pickString(amendment?.action, latestAction?.text, latestAction?.action),
      actionDate: pickString(amendment?.submittedDate, amendment?.date, latestAction?.date),
      summary: pickString(amendment?.description, amendment?.purpose, amendment?.text),
      sourceUri: pickString(amendment?.url, amendment?.link, amendment?.origin, latestAction?.link),
    });
  });
  return blameEntries;
};

export const policyDnaTool = async (billId: string): Promise<PolicyDNAResult> => {
  const locator = parseBillId(billId);
  const billData = await fetchWithKey(buildDetailUrl(locator));
  const bill = ((billData?.bill as UnknownRecord | undefined) ?? billData) as UnknownRecord;
  const versions = toArray(
    bill?.textVersions ?? bill?.versions ?? bill?.billVersions ?? bill?.billTextVersions
  );
  const sortedVersions = [...versions].sort((a, b) => {
    const parseDate = (record: UnknownRecord) =>
      new Date(
        pickString(
          record?.issuedDate,
          record?.date,
          record?.updateDate,
          record?.dateIssued,
          record?.dateIssuedIncludingText
        ) ?? 0
      ).getTime();
    return parseDate(a) - parseDate(b);
  });

  const timeline: PolicyTimelineEntry[] = [];
  let previousText = "";
  for (const version of sortedVersions) {
    const text = await downloadVersionText(extractVersionUrl(version));
    const changeSummary = calculateChange(previousText, text);
    previousText = text;
    timeline.push({
      versionId:
        pickString(
          version?.versionCode,
          version?.versionNumber,
          version?.version,
          version?.id,
          version?.versionName,
          toRecord(version?.type)?.code
        ) ?? `v${timeline.length}`,
      label:
        pickString(
          version?.versionName,
          version?.versionCode,
          version?.title,
          version?.label,
          toRecord(version?.type)?.type,
          toRecord(version?.type)?.description
        ) ?? `Version ${timeline.length + 1}`,
      issuedOn:
        pickString(
          version?.issuedDate,
          version?.date,
          version?.updateDate,
          version?.dateIssued,
          version?.versionDate
        ) ?? undefined,
      changeSummary,
      sourceUri: extractVersionUrl(version),
    });
  }

  const actions = mapActions(bill);
  const blame = buildBlameFromAmendments(bill);
  const sponsorList = toArray(bill?.sponsors);
  const sponsor =
    toRecord(bill?.sponsor) ?? toRecord(sponsorList[0]) ?? toRecord(toArray(bill?.sponsor)[0]);
  const summaryRecord =
    toRecord(bill?.summary) ??
    toRecord(toArray(bill?.summaries)[0]) ??
    toRecord(toArray((bill?.summaries as UnknownRecord | undefined)?.item)[0]);
  const metadata = {
    title:
      toStringValue(bill?.title) ??
      toStringValue(bill?.shortTitle) ??
      toStringValue(bill?.originChamberTitle) ??
      toStringValue(bill?.officialTitle) ??
      toStringValue(toRecord(toArray(bill?.titles)[0])?.title),
    sponsor: sponsor
      ? {
          name:
            toStringValue(sponsor?.fullName) ??
            toStringValue(sponsor?.name) ??
            toStringValue(sponsor?.sponsorName) ??
            undefined,
          party: toStringValue(sponsor?.party),
          state: toStringValue(sponsor?.state),
        }
      : undefined,
    summary:
      toStringValue(summaryRecord?.text) ??
      toStringValue(summaryRecord?.description) ??
      toStringValue(summaryRecord?.summary),
    congress:
      locator.congress ??
      Number.parseInt(
        toStringValue(bill?.congress) ?? toStringValue(bill?.congressNumber) ?? "0",
        10
      ),
    billType: locator.billType,
    billNumber: locator.billNumber,
  };

  return {
    billId,
    timeline,
    blame,
    actions,
    metadata,
  };
};
