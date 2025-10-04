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
  const formats =
    (version?.formats as UnknownRecord[] | undefined) ??
    (version?.urls as UnknownRecord[] | undefined) ??
    [];
  if (Array.isArray(formats)) {
    const xml = formats.find((f) =>
      typeof f?.url === "string" &&
      ((toStringValue(f?.type)?.toLowerCase() ?? toStringValue(f?.format)?.toLowerCase() ?? "").includes("xml") ||
        (toStringValue(f?.fileType)?.toLowerCase() ?? "").includes("xml"))
    );
    if (xml?.url) {
      return xml.url as string;
    }
    const text = formats.find((f) =>
      typeof f?.url === "string" &&
      (toStringValue(f?.type)?.toLowerCase() ??
        toStringValue(f?.format)?.toLowerCase() ??
        toStringValue(f?.fileType)?.toLowerCase() ??
        ""
      ).includes("html")
    );
    if (text?.url) {
      return text.url as string;
    }
  }
  if (typeof version?.url === "string") {
    return version.url as string;
  }
  const download = toStringValue(version?.download) ?? toStringValue(version?.link);
  if (download) {
    return download;
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
  const actions = bill?.actions as UnknownRecord[] | undefined;
  if (!Array.isArray(actions)) return [];
  return actions.slice(0, 25).map((action) => ({
    type:
      toStringValue(action?.type) ??
      toStringValue(action?.actionType) ??
      "action",
    date:
      toStringValue(action?.date) ??
      toStringValue(action?.actionDate) ??
      toStringValue(action?.recordedAt),
    actor:
      toStringValue(action?.actor) ??
      toStringValue(action?.by) ??
      toStringValue(action?.committee) ??
      toStringValue(action?.chamber),
    description:
      toStringValue(action?.text) ??
      toStringValue(action?.description) ??
      toStringValue(action?.source),
    link:
      toStringValue(action?.link) ??
      toStringValue(action?.url) ??
      toStringValue(action?.sourceLink),
  }));
};

const buildBlameFromAmendments = (bill: UnknownRecord): PolicyBlameEntry[] => {
  const amendments =
    (bill?.amendments as UnknownRecord[] | undefined) ??
    (bill?.relatedBills as UnknownRecord[] | undefined) ??
    [];
  const blameEntries: PolicyBlameEntry[] = [];
  if (Array.isArray(amendments)) {
    amendments.slice(0, 10).forEach((amendment) => {
      const sponsor = amendment?.sponsor as UnknownRecord | undefined;
      blameEntries.push({
        sectionId:
          toStringValue(amendment?.number) ??
          toStringValue(amendment?.amendmentNumber) ??
          toStringValue(amendment?.id) ??
          "unknown",
        heading: toStringValue(amendment?.title) ?? toStringValue(amendment?.purpose),
        author:
          toStringValue(sponsor?.fullName) ??
          toStringValue(sponsor?.name) ??
          toStringValue(sponsor?.sponsorName) ??
          toStringValue(amendment?.sponsor),
        actionType:
          toStringValue(amendment?.action) ??
          toStringValue((amendment?.latestAction as UnknownRecord | undefined)?.text),
        actionDate:
          toStringValue(amendment?.submittedDate) ??
          toStringValue(amendment?.date) ??
          toStringValue((amendment?.latestAction as UnknownRecord | undefined)?.date),
        summary:
          toStringValue(amendment?.description) ??
          toStringValue(amendment?.purpose) ??
          toStringValue(amendment?.text),
        sourceUri:
          toStringValue(amendment?.url) ??
          toStringValue(amendment?.link) ??
          toStringValue(amendment?.origin) ??
          undefined,
      });
    });
  }
  return blameEntries;
};

const buildBlameFromSections = (bill: UnknownRecord): PolicyBlameEntry[] => {
  const sectionsCandidates: unknown[] = [];
  if (Array.isArray(bill?.sections)) sectionsCandidates.push(...(bill?.sections as unknown[]));
  if (Array.isArray(bill?.sectionList)) sectionsCandidates.push(...(bill?.sectionList as unknown[]));
  const sectionBySection = bill?.sectionBySection as UnknownRecord | undefined;
  if (Array.isArray(sectionBySection?.sections)) {
    sectionsCandidates.push(...(sectionBySection?.sections as unknown[]));
  }
  const flattened = sectionsCandidates.filter((candidate): candidate is UnknownRecord =>
    Boolean(candidate && typeof candidate === "object")
  );

  return flattened.slice(0, 12).map((section, idx) => ({
    sectionId:
      toStringValue(section?.sectionId) ??
      toStringValue(section?.identifier) ??
      toStringValue(section?.sectionNumber) ??
      toStringValue(section?.id) ??
      `section-${idx + 1}`,
    heading:
      toStringValue(section?.heading) ??
      toStringValue(section?.title) ??
      toStringValue(section?.sectionTitle) ??
      undefined,
    author:
      toStringValue(section?.sponsor) ??
      toStringValue(section?.author) ??
      undefined,
    actionType:
      toStringValue(section?.type) ?? toStringValue(section?.category) ?? "Section update",
    actionDate: toStringValue(section?.date) ?? toStringValue(section?.lastModified),
    summary:
      toStringValue(section?.summary) ??
      toStringValue(section?.text) ??
      toStringValue(section?.description) ??
      undefined,
    sourceUri:
      toStringValue(section?.url) ??
      toStringValue(section?.source) ??
      toStringValue(section?.citation) ??
      undefined,
  }));
};

const buildBlameFromTimeline = (timeline: PolicyTimelineEntry[]): PolicyBlameEntry[] => {
  return timeline.map((entry, idx) => ({
    sectionId: entry.versionId ?? `version-${idx + 1}`,
    heading: entry.label,
    author: idx === 0 ? "Introduced version" : "Revision",
    actionType: idx === 0 ? "Introduced" : "Updated version",
    actionDate: entry.issuedOn,
    summary: entry.changeSummary
      ? `Δ +${entry.changeSummary.added} / -${entry.changeSummary.removed} words`
      : undefined,
    sourceUri: entry.sourceUri,
  }));
};

const mergeBlame = (...groups: PolicyBlameEntry[][]): PolicyBlameEntry[] => {
  const combined: PolicyBlameEntry[] = [];
  const seen = new Set<string>();
  for (const group of groups) {
    for (const entry of group) {
      const key = `${entry.sectionId}-${entry.heading ?? ""}-${entry.actionDate ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      combined.push(entry);
    }
  }
  return combined.slice(0, 20);
};

export const policyDnaTool = async (billId: string): Promise<PolicyDNAResult> => {
  const locator = parseBillId(billId);
  const billData = await fetchWithKey(buildDetailUrl(locator));
  const bill = ((billData?.bill as UnknownRecord | undefined) ?? billData) as UnknownRecord;
  const versions =
    (bill?.versions as UnknownRecord[] | undefined) ??
    (bill?.billVersions as UnknownRecord[] | undefined) ??
    [];
  const sortedVersions = Array.isArray(versions)
    ? [...versions].sort((a, b) => {
        const aDate = new Date(
          toStringValue(a?.issuedDate) ??
            toStringValue(a?.date) ??
            toStringValue(a?.updateDate) ??
            0
        ).getTime();
        const bDate = new Date(
          toStringValue(b?.issuedDate) ??
            toStringValue(b?.date) ??
            toStringValue(b?.updateDate) ??
            0
        ).getTime();
        return aDate - bDate;
      })
    : [];

  const timeline: PolicyTimelineEntry[] = [];
  let previousText = "";
  for (const version of sortedVersions) {
    const text = await downloadVersionText(extractVersionUrl(version));
    const changeSummary = calculateChange(previousText, text);
    previousText = text;
    timeline.push({
      versionId:
        toStringValue(version?.versionCode) ??
        toStringValue(version?.versionNumber) ??
        toStringValue(version?.version) ??
        toStringValue(version?.id) ??
        toStringValue(version?.versionName) ??
        `v${timeline.length}`,
      label:
        toStringValue(version?.versionName) ??
        toStringValue(version?.versionCode) ??
        toStringValue(version?.title) ??
        toStringValue(version?.label) ??
        `Version ${timeline.length + 1}`,
      issuedOn:
        toStringValue(version?.issuedDate) ??
        toStringValue(version?.date) ??
        toStringValue(version?.updateDate) ??
        undefined,
      changeSummary,
      sourceUri: extractVersionUrl(version),
    });
  }

  const sponsorList = bill?.sponsors as UnknownRecord[] | undefined;
  const sponsor = (sponsorList?.[0] as UnknownRecord | undefined) ?? (bill?.sponsor as UnknownRecord | undefined);
  const metadata = {
    title:
      toStringValue(bill?.title) ??
      toStringValue(bill?.shortTitle) ??
      toStringValue(bill?.originChamberTitle) ??
      toStringValue(bill?.officialTitle),
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
      ((bill?.summary as UnknownRecord | undefined)?.text as string | undefined) ??
      (((bill?.summaries as UnknownRecord[] | undefined)?.[0] as UnknownRecord | undefined)?.text as
        string | undefined),
    congress:
      locator.congress ??
      Number.parseInt(
        toStringValue(bill?.congress) ?? toStringValue(bill?.congressNumber) ?? "0",
        10
      ),
    billType: locator.billType,
    billNumber: locator.billNumber,
  };

  const effectiveTimeline =
    timeline.length > 0
      ? timeline
      : [
          {
            versionId: "introduced",
            label: metadata.title ? `${metadata.title} (introduced)` : "Introduced version",
            issuedOn: toStringValue(bill?.introducedDate) ?? toStringValue(bill?.introduced_on),
            changeSummary: undefined,
            sourceUri: toStringValue(bill?.url) ?? toStringValue(bill?.source),
          },
        ];

  let actions = mapActions(bill);
  if (!actions.length) {
    actions = effectiveTimeline.map((entry) => ({
      type: entry.label,
      date: entry.issuedOn,
      description:
        entry.changeSummary &&
        (entry.changeSummary.added > 0 || entry.changeSummary.removed > 0 || entry.changeSummary.modified > 0)
          ? `Version change: +${entry.changeSummary.added ?? 0} / -${entry.changeSummary.removed ?? 0}`
          : "Version recorded",
      link: entry.sourceUri,
    }));
  }

  const amendmentBlame = buildBlameFromAmendments(bill);
  const sectionBlame = buildBlameFromSections(bill);
  const timelineBlame = buildBlameFromTimeline(effectiveTimeline);
  let blame = mergeBlame(amendmentBlame, sectionBlame, timelineBlame);

  if (!blame.length && actions.length) {
    blame = mergeBlame(
      actions.slice(0, 5).map((action, idx) => ({
        sectionId: `action-${idx + 1}`,
        heading: action.type,
        author: action.actor,
        actionType: action.type,
        actionDate: action.date,
        summary: action.description,
        sourceUri: action.link,
      }))
    );
  }

  return {
    billId,
    timeline: effectiveTimeline,
    blame,
    actions,
    metadata,
  };
};
