import type { ApplyReport, CatalogItemKind } from "my-collec-skills-apply-engine";
import {
  deriveProfileStatus,
  type ProfileApplyStatus,
} from "./workspaceStatus.js";

export interface StoredItemStatus {
  type: CatalogItemKind;
  source: string;
  externalId: string;
  name: string;
  status: ProfileApplyStatus;
  lastAppliedAt: string;
  appliedCount: number;
  skippedCount: number;
  failedCount: number;
}

const STATE_KEY = "mcs.installedItems";

export function itemKey(type: string, source: string, externalId: string): string {
  return `${type}::${source.trim()}::${externalId.trim()}`;
}

export function buildStoredItemStatus(
  item: {
    type: CatalogItemKind;
    source: string;
    externalId: string;
    name: string;
  },
  report: ApplyReport,
): StoredItemStatus {
  return {
    type: item.type,
    source: item.source,
    externalId: item.externalId,
    name: item.name,
    status: deriveProfileStatus(report),
    lastAppliedAt: new Date().toISOString(),
    appliedCount: report.applied.length,
    skippedCount: report.skipped.length,
    failedCount: report.failed.length,
  };
}

export type ItemStatusMap = Record<string, StoredItemStatus>;

export function readItemStatuses(
  get: (key: string) => ItemStatusMap | undefined,
): ItemStatusMap {
  return get(STATE_KEY) ?? {};
}

export function upsertItemStatus(
  current: ItemStatusMap,
  entry: StoredItemStatus,
): ItemStatusMap {
  return {
    ...current,
    [itemKey(entry.type, entry.source, entry.externalId)]: entry,
  };
}

export { STATE_KEY as ITEM_STATUS_STATE_KEY };
