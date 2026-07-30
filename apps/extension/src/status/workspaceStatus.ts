import type { ApplyReport } from "@mcs/apply-engine";
import type { ProfileManifest } from "@mcs/manifest";

export type ProfileApplyStatus = "applied" | "pending";

export interface StoredCollectionStatus {
  type: string;
  category: string;
  subcategory: string;
  name: string;
  status: ProfileApplyStatus;
}

export interface StoredProfileStatus {
  username: string;
  slug: string;
  name: string;
  status: ProfileApplyStatus;
  lastAppliedAt: string;
  appliedCount: number;
  skippedCount: number;
  failedCount: number;
  collections: StoredCollectionStatus[];
}

const STATE_KEY = "mcs.appliedProfiles";

export function profileKey(username: string, slug: string): string {
  return `${username.trim()}/${slug.trim()}`;
}

export function deriveProfileStatus(report: ApplyReport): ProfileApplyStatus {
  if (report.failed.length > 0) {
    return "pending";
  }
  // Itens skipped por conflito (conteúdo diferente) ainda são pendências.
  const blocked = report.skipped.filter((item) =>
    (item.message ?? "").toLowerCase().includes("different content"),
  );
  if (blocked.length > 0) {
    return "pending";
  }
  if (
    report.applied.length === 0 &&
    report.skipped.length === 0 &&
    report.failed.length === 0
  ) {
    return "pending";
  }
  return "applied";
}

export function buildStoredProfileStatus(
  manifest: ProfileManifest,
  report: ApplyReport,
): StoredProfileStatus {
  const status = deriveProfileStatus(report);
  return {
    username: manifest.username,
    slug: manifest.slug,
    name: manifest.name,
    status,
    lastAppliedAt: new Date().toISOString(),
    appliedCount: report.applied.length,
    skippedCount: report.skipped.length,
    failedCount: report.failed.length,
    collections: manifest.collections.map((c) => ({
      type: c.type,
      category: c.category,
      subcategory: c.subcategory,
      name: c.name,
      status,
    })),
  };
}

export function formatReportSummary(report: ApplyReport): string {
  return `applied=${report.applied.length} skipped=${report.skipped.length} failed=${report.failed.length}${report.dryRun ? " (dry-run)" : ""}`;
}

export type ProfileStatusMap = Record<string, StoredProfileStatus>;

export function readProfileStatuses(
  get: (key: string) => ProfileStatusMap | undefined,
): ProfileStatusMap {
  return get(STATE_KEY) ?? {};
}

export function upsertProfileStatus(
  current: ProfileStatusMap,
  entry: StoredProfileStatus,
): ProfileStatusMap {
  return {
    ...current,
    [profileKey(entry.username, entry.slug)]: entry,
  };
}

export { STATE_KEY as PROFILE_STATUS_STATE_KEY };
