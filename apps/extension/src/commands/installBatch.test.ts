import { describe, expect, it } from "vitest";
import type { ApplyReport } from "my-collec-skills-apply-engine";
import { contentFingerprint } from "./batch-helpers.js";

describe("batch helpers", () => {
  it("builds content fingerprints from report items", () => {
    const report: ApplyReport = {
      applied: [{ kind: "skill", id: "a", status: "applied" }],
      skipped: [{ kind: "mcp", id: "b", status: "skipped" }],
      failed: [],
      dryRun: false,
    };
    expect(contentFingerprint(report)).toEqual(["skill::a", "mcp::b"]);
  });
});
