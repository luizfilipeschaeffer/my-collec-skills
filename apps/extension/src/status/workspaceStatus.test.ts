import { describe, expect, it, vi } from "vitest";
import { ApiError, fetchProfileManifest } from "../api/client.js";
import {
  buildManifestUrl,
  buildOAuthSignInUrl,
  normalizeApiUrl,
} from "../url.js";
import {
  buildStoredProfileStatus,
  deriveProfileStatus,
  formatReportSummary,
  profileKey,
  upsertProfileStatus,
} from "../status/workspaceStatus.js";
import type { ApplyReport } from "my-collec-skills-apply-engine";
import type { ProfileManifest } from "my-collec-skills-manifest";

describe("url helpers", () => {
  it("normalizes trailing slashes", () => {
    expect(normalizeApiUrl("http://localhost:3000/")).toBe(
      "http://localhost:3000",
    );
    expect(normalizeApiUrl("")).toBe("http://localhost:3000");
  });

  it("builds manifest and oauth urls", () => {
    expect(buildManifestUrl("http://localhost:3000/", "alice", "next")).toBe(
      "http://localhost:3000/api/profiles/alice/next/manifest",
    );
    expect(buildOAuthSignInUrl("http://localhost:3000", "github")).toBe(
      "http://localhost:3000/api/auth/signin/github",
    );
  });
});

describe("workspace status", () => {
  const emptyReport = (partial: Partial<ApplyReport>): ApplyReport => ({
    applied: [],
    skipped: [],
    failed: [],
    dryRun: false,
    ...partial,
  });

  it("marks failed or blocked as pending", () => {
    expect(
      deriveProfileStatus(
        emptyReport({
          failed: [
            {
              kind: "skill",
              id: "x",
              status: "failed",
            },
          ],
        }),
      ),
    ).toBe("pending");

    expect(
      deriveProfileStatus(
        emptyReport({
          skipped: [
            {
              kind: "skill",
              id: "x",
              status: "skipped",
              message: "Exists with different content (use force to overwrite)",
            },
          ],
        }),
      ),
    ).toBe("pending");
  });

  it("marks clean apply as applied", () => {
    expect(
      deriveProfileStatus(
        emptyReport({
          applied: [{ kind: "skill", id: "a", status: "applied" }],
          skipped: [
            {
              kind: "skill",
              id: "b",
              status: "skipped",
              message: "Already up to date",
            },
          ],
        }),
      ),
    ).toBe("applied");
  });

  it("upserts profile status map", () => {
    const manifest = {
      version: 1 as const,
      username: "alice",
      slug: "next",
      name: "Next",
      collections: [],
      skills: [],
      agents: [],
      mcps: [],
      docs: [],
      extensions: [],
    } satisfies ProfileManifest;

    const entry = buildStoredProfileStatus(
      manifest,
      emptyReport({
        applied: [{ kind: "doc", id: "d", status: "applied" }],
      }),
    );
    const map = upsertProfileStatus({}, entry);
    expect(map[profileKey("alice", "next")]?.status).toBe("applied");
    expect(
      formatReportSummary(
        emptyReport({
          applied: [{ kind: "doc", id: "d", status: "applied" }],
        }),
      ),
    ).toBe("applied=1 skipped=0 failed=0");
  });
});

describe("fetchProfileManifest", () => {
  it("parses JSON on success and sends bearer token", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ version: 1 }),
    })) as unknown as typeof fetch;

    const data = await fetchProfileManifest({
      apiUrl: "http://localhost:3000",
      username: "alice",
      slug: "next",
      token: "secret",
      fetchImpl,
    });

    expect(data).toEqual({ version: 1 });
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost:3000/api/profiles/alice/next/manifest",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer secret",
        }),
      }),
    );
  });

  it("throws ApiError on HTTP failure", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 404,
      text: async () => "missing",
    })) as unknown as typeof fetch;

    await expect(
      fetchProfileManifest({
        apiUrl: "http://localhost:3000",
        username: "alice",
        slug: "missing",
        fetchImpl,
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
