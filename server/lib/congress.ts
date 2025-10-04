export type UnknownRecord = Record<string, unknown>;

const isObjectRecord = (value: unknown): value is UnknownRecord =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

export const unwrapCollection = (value: unknown): UnknownRecord[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter(isObjectRecord) as UnknownRecord[];
  }
  if (isObjectRecord(value)) {
    const items = (value as UnknownRecord).item;
    if (Array.isArray(items)) {
      return items.filter(isObjectRecord) as UnknownRecord[];
    }
  }
  return [];
};

export const firstItem = (value: unknown): UnknownRecord | undefined => {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return value.find(isObjectRecord) as UnknownRecord | undefined;
  }
  if (isObjectRecord(value)) {
    return value as UnknownRecord;
  }
  return undefined;
};

export const extractBillRecords = (payload: UnknownRecord): UnknownRecord[] => {
  const candidates: unknown[] = [];
  if (payload?.bills !== undefined) candidates.push(payload.bills);
  if (payload?.results !== undefined) candidates.push(payload.results);
  if (payload?.data !== undefined) candidates.push(payload.data);
  if (payload?.items !== undefined) candidates.push(payload.items);

  const flattened: UnknownRecord[] = [];
  for (const candidate of candidates) {
    const entries = unwrapCollection(candidate);
    for (const entry of entries) {
      const nestedBill = firstItem((entry as UnknownRecord).bill);
      const billRecord = nestedBill ?? (isObjectRecord((entry as UnknownRecord).bill) ? ((entry as UnknownRecord).bill as UnknownRecord) : undefined);
      if (billRecord) {
        flattened.push(billRecord);
        continue;
      }
      flattened.push(entry);
    }
    if (!entries.length && isObjectRecord(candidate)) {
      const directBills = unwrapCollection((candidate as UnknownRecord).bill);
      if (directBills.length) {
        directBills.forEach((bill) => {
          flattened.push(bill);
        });
        continue;
      }
      const single = firstItem((candidate as UnknownRecord).bill);
      if (single) {
        flattened.push(single);
      }
    }
  }

  if (flattened.length === 0 && isObjectRecord(payload.bill)) {
    flattened.push(payload.bill as UnknownRecord);
  }

  return flattened;
};

export const collectObjects = (...sources: unknown[]): UnknownRecord[] => {
  const results: UnknownRecord[] = [];
  for (const source of sources) {
    if (!source) continue;
    const first = firstItem(source);
    if (first) {
      results.push(first);
    }
    const items = unwrapCollection(source);
    if (items.length) {
      results.push(...items);
    }
  }
  return results.filter((record, index, array) =>
    array.findIndex((candidate) => candidate === record) === index
  );
};
