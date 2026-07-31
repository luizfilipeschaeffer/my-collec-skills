import { describe, expect, it, vi } from "vitest";
import {
  ApiError,
  fetchProfileManifest,
  fetchSkillMarkdown,
  searchCatalog,
} from "../api/client.js";
import { resolveIdeTarget } from "../ide-target.js";
import {
  buildStoredItemStatus,
  itemKey,
  upsertItemStatus,
} from "../status/itemStatus.js";
import {
  buildStoredProfileStatus,
  deriveProfileStatus,
  formatReportSummary,
  profileKey,
  upsertProfileStatus,
} from "../status/workspaceStatus.js";
import {
  buildCatalogSearchUrl,
  buildManifestUrl,
  buildOAuthSignInUrl,
  buildSkillDetailUrl,
  DEFAULT_API_URL,
  normalizeApiUrl,
} from "../url.js";
import type { ApplyReport } from "my-collec-skills-apply-engine";
import type { ProfileManifest } from "my-collec-skills-manifest";

describe("url helpers", () => {
  it("normalizes trailing slashes with production default", () => {
    expect(normalizeApiUrl("http://localhost:3000/")).toBe(
      "http://localhost:3000",
    );
    expect(normalizeApiUrl("")).toBe(DEFAULT_API_URL);
    expect(DEFAULT_API_URL).toBe("https://my-collec-skills.vercel.app");
  });

  it("builds manifest, catalog, skill detail and oauth urls", () => {
    expect(buildManifestUrl("http://localhost:3000/", "alice", "next")).toBe(
      "http://localhost:3000/api/profiles/alice/next/manifest",
    );
    expect(
      buildCatalogSearchUrl("https://my-collec-skills.vercel.app", {
        q: "prisma",
        type: "skill",
        take: 10,
      }),
    ).toBe(
      "https://my-collec-skills.vercel.app/api/catalog?q=prisma&type=skill&take=10",
    );
    expect(
      buildSkillDetailUrl("https://example.com", "vercel-labs/agent-browser"),
    ).toBe(
      "https://example.com/api/catalog/skills/vercel-labs/agent-browser",
    );
    expect(buildOAuthSignInUrl("http://localhost:3000", "github")).toBe(
      "http://localhost:3000/api/auth/signin/github",
    );
  });
});

describe("resolveIdeTarget", () => {
  it("maps Cursor to cursor and Trae/VS Code forks to vscode", () => {
    expect(resolveIdeTarget("Cursor")).toBe("cursor");
    expect(resolveIdeTarget("Trae")).toBe("vscode");
    expect(resolveIdeTarget("Windsurf")).toBe("vscode");
    expect(resolveIdeTarget("Visual Studio Code")).toBe("vscode");
  });

  it("honors explicit setting over app name", () => {
    expect(resolveIdeTarget("Cursor", "vscode")).toBe("vscode");
    expect(resolveIdeTarget("Trae", "both")).toBe("both");
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

  it("upserts installed catalog item status", () => {
    const entry = buildStoredItemStatus(
      {
        type: "skill",
        source: "mcs-catalog",
        externalId: "prisma-schema-conventions",
        name: "Prisma Schema Conventions",
      },
      emptyReport({
        applied: [
          { kind: "skill", id: "prisma-schema-conventions", status: "applied" },
        ],
      }),
    );
    const map = upsertItemStatus({}, entry);
    expect(
      map[itemKey("skill", "mcs-catalog", "prisma-schema-conventions")]?.status,
    ).toBe("applied");
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

describe("searchCatalog / fetchSkillMarkdown", () => {
  it("parses catalog search results", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          items: [
            {
              type: "skill",
              source: "mcs-catalog",
              externalId: "prisma-schema-conventions",
              name: "Prisma",
              description: "x",
            },
          ],
          query: "prisma",
          source: "mcs-catalog",
          count: 1,
        }),
    })) as unknown as typeof fetch;

    const result = await searchCatalog({
      apiUrl: DEFAULT_API_URL,
      q: "prisma",
      type: "skill",
      fetchImpl,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.externalId).toBe("prisma-schema-conventions");
  });

  it("returns null for unavailable skill detail", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 503,
      text: async () => "oidc",
    })) as unknown as typeof fetch;

    await expect(
      fetchSkillMarkdown({
        apiUrl: DEFAULT_API_URL,
        skillId: "owner/skill",
        fetchImpl,
      }),
    ).resolves.toBeNull();
  });
});
