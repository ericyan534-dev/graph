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
import { collectObjects, firstItem, UnknownRecord } from "../lib/congress";

const CONGRESS_API_BASE =
  process.env.CONGRESS_API_BASE_URL ?? "https://api.congress.gov/v3";
const CONGRESS_API_KEY = process.env.CONGRESS_API_KEY ?? "";

const dmp = new DiffMatchPatch();

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

const resolveNextUrl = (payload: UnknownRecord): string | undefined => {
  const normalize = (value?: string) => {
    if (!value) return undefined;
    return value.startsWith("http") ? value : `${CONGRESS_API_BASE}${value}`;
  };
  const pagination = payload?.pagination as UnknownRecord | undefined;
  const next =
    normalize(toStringValue(pagination?.next)) ??
    normalize(toStringValue(pagination?.nextPage)) ??
    normalize(toStringValue(pagination?.next_url));
  if (next) return next;
  const links = payload?.links as UnknownRecord | undefined;
  return normalize(toStringValue(links?.next));
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
  const formatCandidates = collectObjects(
    version?.formats,
    version?.format,
    version?.urls,
    version?.links,
    version?.downloadUrls
  );
  for (const candidate of formatCandidates) {
    const url =
      toStringValue(candidate?.url) ??
      toStringValue(candidate?.link) ??
      toStringValue(candidate?.downloadUrl);
    if (!url) continue;
    const kind =
      toStringValue(candidate?.type)?.toLowerCase() ??
      toStringValue(candidate?.format)?.toLowerCase() ??
      toStringValue(candidate?.fileType)?.toLowerCase() ??
      "";
    if (kind.includes("xml") || kind.includes("uslm")) {
      return url;
    }
    if (kind.includes("html") || kind.includes("text")) {
      return url;
    }
  }
  const directUrl =
    toStringValue(version?.url) ??
    toStringValue(version?.link) ??
    toStringValue(version?.download);
  return directUrl;
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

const mapActions = (
  bill: UnknownRecord,
  supplied: UnknownRecord[]
): PolicyActionEvent[] => {
  const actions = supplied.length
    ? supplied
    : collectObjects(
        bill.actions,
        bill.actionList,
        bill.latestActions,
        bill.latestAction
      );
  if (!actions.length) return [];
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

const buildBlameFromAmendments = (
  bill: UnknownRecord,
  supplied: UnknownRecord[]
): PolicyBlameEntry[] => {
  const amendments = supplied.length
    ? supplied
    : collectObjects(bill.amendments, bill.relatedBills, bill.amendmentList);
  const blameEntries: PolicyBlameEntry[] = [];
  if (amendments.length) {
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

const buildBlameFromSections = (
  bill: UnknownRecord,
  supplied: UnknownRecord[]
): PolicyBlameEntry[] => {
  const sectionBySection = firstItem(bill.sectionBySection);
  const sections = [
    ...(supplied.length ? supplied : collectObjects(bill.sections, bill.sectionList)),
    ...collectObjects(sectionBySection?.sections, sectionBySection?.section),
  ];

  return sections.slice(0, 12).map((section, idx) => ({
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

const uniqueBy = <T>(items: T[], key: (item: T) => string | undefined): T[] => {
  const seen = new Set<string>();
  const results: T[] = [];
  for (const item of items) {
    const identifier = key(item) ?? Math.random().toString(36).slice(2);
    if (seen.has(identifier)) continue;
    seen.add(identifier);
    results.push(item);
  }
  return results;
};

const fetchBillCollection = async (
  locator: BillLocator,
  segment: string,
  propertyKeys: string[]
): Promise<UnknownRecord[]> => {
  const params = new URLSearchParams({ format: "json", pageSize: "250" });
  let url = `${CONGRESS_API_BASE}/bill/${locator.congress}/${locator.billType}/${locator.billNumber}/${segment}?${params.toString()}`;
  const records: UnknownRecord[] = [];
  let guard = 0;
  while (url && guard < 12) {
    let payload: UnknownRecord;
    try {
      payload = await fetchWithKey(url);
    } catch (error) {
      console.warn(`Failed to fetch ${segment} for ${locator.billType}-${locator.billNumber}`, error);
      break;
    }
    const sources = propertyKeys.length
      ? propertyKeys
          .map((key) => (payload as UnknownRecord)?.[key])
          .filter((value): value is unknown => value !== undefined)
      : [payload];
    if (!sources.length) {
      sources.push(payload);
    }
    const entries = collectObjects(...sources);
    records.push(...entries);
    const next = resolveNextUrl(payload);
    if (!next || next === url) break;
    url = next;
    guard += 1;
  }
  return records;
};

export const policyDnaTool = async (billId: string): Promise<PolicyDNAResult> => {
  const locator = parseBillId(billId);
  const billData = await fetchWithKey(buildDetailUrl(locator));
  const bill = ((billData?.bill as UnknownRecord | undefined) ?? billData) as UnknownRecord;

  const [remoteVersions, remoteActions, remoteAmendments, remoteSections] = await Promise.all([
    fetchBillCollection(locator, "versions", ["versions", "billVersions", "items"]),
    fetchBillCollection(locator, "actions", ["actions", "actionList", "items"]),
    fetchBillCollection(locator, "amendments", ["amendments", "amendmentList", "relatedBills", "items"]),
    fetchBillCollection(locator, "sections", ["sections", "sectionList", "items"]),
  ]);

  const versionCandidates = uniqueBy(
    [
      ...collectObjects(bill.versions, bill.billVersions, bill.versionList, bill.latestVersion),
      ...remoteVersions
        .map((entry) => firstItem(entry?.version) ?? entry)
        .filter((entry): entry is UnknownRecord => Boolean(entry)),
    ],
    (entry) =>
      toStringValue(entry?.versionCode)?.toLowerCase() ??
      toStringValue(entry?.versionNumber)?.toLowerCase() ??
      toStringValue(entry?.version)?.toLowerCase()
  );

  const sortedVersions = versionCandidates.sort((a, b) => {
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
  });

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

  const sponsorList = collectObjects(
    bill.sponsors,
    bill.sponsor,
    bill.cosponsors,
    bill.cosponsorList
  );
  const sponsor = sponsorList[0];
  const summaryEntry =
    firstItem(bill.summary) ??
    firstItem(bill.summaries);
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
          bioguideId:
            toStringValue(sponsor?.bioguideId) ??
            toStringValue(sponsor?.bioguide_id) ??
            toStringValue(sponsor?.bioguide),
        }
      : undefined,
    summary:
      toStringValue(summaryEntry?.text) ??
      toStringValue(summaryEntry?.summary) ??
      toStringValue(summaryEntry?.description),
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

  const actionCandidates = uniqueBy(
    [
      ...collectObjects(bill.actions, bill.actionList, bill.latestActions, bill.latestAction),
      ...remoteActions
        .map((entry) => firstItem(entry?.action) ?? entry)
        .filter((entry): entry is UnknownRecord => Boolean(entry)),
    ],
    (entry) =>
      `${
        toStringValue(entry?.date) ??
        toStringValue(entry?.actionDate) ??
        toStringValue(entry?.recordedAt) ??
        ""
      }::${
        toStringValue(entry?.text) ??
        toStringValue(entry?.description) ??
        toStringValue(entry?.title) ??
        ""
      }`
  );

  let actions = mapActions(bill, actionCandidates);
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

  const amendmentCandidates = uniqueBy(
    [
      ...collectObjects(bill.amendments, bill.relatedBills, bill.amendmentList),
      ...remoteAmendments
        .map((entry) => firstItem(entry?.amendment) ?? entry)
        .filter((entry): entry is UnknownRecord => Boolean(entry)),
    ],
    (entry) =>
      toStringValue(entry?.number) ??
      toStringValue(entry?.amendmentNumber) ??
      toStringValue(entry?.id) ??
      Math.random().toString(36)
  );

  const sectionCandidates = uniqueBy(
    [
      ...collectObjects(bill.sections, bill.sectionList),
      ...remoteSections
        .map((entry) => firstItem(entry?.section) ?? entry)
        .filter((entry): entry is UnknownRecord => Boolean(entry)),
    ],
    (entry) =>
      toStringValue(entry?.sectionId) ??
      toStringValue(entry?.identifier) ??
      toStringValue(entry?.sectionNumber) ??
      toStringValue(entry?.id) ??
      Math.random().toString(36)
  );

  const amendmentBlame = buildBlameFromAmendments(bill, amendmentCandidates);
  const sectionBlame = buildBlameFromSections(bill, sectionCandidates);
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
