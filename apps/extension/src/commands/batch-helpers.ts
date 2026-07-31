import type { ApplyReport } from "my-collec-skills-apply-engine";

/** Collapse overlapping content keys across multiple manifests. */
export function contentFingerprint(report: ApplyReport): string[] {
  return [...report.applied, ...report.skipped, ...report.failed].map(
    (item) => `${item.kind}::${item.id}`,
  );
}
