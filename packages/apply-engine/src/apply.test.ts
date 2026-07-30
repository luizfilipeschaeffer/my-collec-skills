import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { ProfileManifest } from "my-collec-skills-manifest";
import { applyProfile } from "./apply.js";
import { assertSafeId, resolveSafePath } from "./paths.js";

const tmpDirs: string[] = [];

async function makeCwd(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "mcs-apply-"));
  tmpDirs.push(dir);
  return dir;
}

function baseManifest(
  overrides: Partial<ProfileManifest> = {},
): ProfileManifest {
  return {
    version: 1,
    username: "alice",
    slug: "demo",
    name: "Demo",
    collections: [],
    skills: [],
    agents: [],
    mcps: [],
    docs: [],
    extensions: [],
    ...overrides,
  };
}

describe("applyProfile — happy path", () => {
  it("writes skills, agents, mcps, docs and reports extensions", async () => {
    const cwd = await makeCwd();
    const manifest = baseManifest({
      skills: [
        {
          source: "local",
          externalId: "prisma-migrate",
          name: "Prisma Migrate",
          content: "# Prisma Migrate\n",
        },
      ],
      agents: [
        {
          source: "local",
          externalId: "reviewer",
          name: "Reviewer",
          content: "# Reviewer\n",
        },
      ],
      mcps: [
        {
          source: "registry",
          externalId: "filesystem",
          name: "Filesystem",
          server: { command: "npx", args: ["-y", "server"] },
        },
      ],
      docs: [
        {
          source: "web",
          externalId: "prisma-docs",
          name: "Prisma",
          url: "https://www.prisma.io/docs",
        },
      ],
      extensions: [
        { ide: "cursor", id: "publisher.ext", name: "Example" },
      ],
    });

    const report = await applyProfile(manifest, { cwd });

    expect(report.failed).toHaveLength(0);
    expect(report.applied.map((r) => r.kind).sort()).toEqual(
      ["agent", "doc", "extension", "mcp", "skill"].sort(),
    );

    const skill = await readFile(
      path.join(cwd, ".cursor", "skills", "prisma-migrate", "SKILL.md"),
      "utf8",
    );
    expect(skill).toBe("# Prisma Migrate\n");

    const agent = await readFile(
      path.join(cwd, ".cursor", "agents", "reviewer.md"),
      "utf8",
    );
    expect(agent).toBe("# Reviewer\n");

    const mcp = JSON.parse(
      await readFile(path.join(cwd, ".cursor", "mcp.json"), "utf8"),
    );
    expect(mcp.mcpServers.filesystem.command).toBe("npx");

    const docs = JSON.parse(
      await readFile(path.join(cwd, ".mcs", "docs.json"), "utf8"),
    );
    expect(docs.docs).toHaveLength(1);

    const ext = report.applied.find((r) => r.kind === "extension");
    expect(ext?.command).toContain("cursor --install-extension publisher.ext");
  });

  it("writes VS Code layout when ide is vscode", async () => {
    const cwd = await makeCwd();
    const manifest = baseManifest({
      skills: [
        {
          source: "local",
          externalId: "api-design",
          name: "API Design",
          content: "# API\n",
        },
      ],
      agents: [
        {
          source: "local",
          externalId: "reviewer",
          name: "Reviewer",
          content: "# Reviewer\n",
        },
      ],
      mcps: [
        {
          source: "registry",
          externalId: "filesystem",
          name: "Filesystem",
          server: { command: "npx" },
        },
      ],
      extensions: [
        { ide: "vscode", id: "publisher.ext", name: "Example" },
        { ide: "cursor", id: "cursor.only", name: "Cursor Only" },
      ],
    });

    const report = await applyProfile(manifest, { cwd, ide: "vscode" });
    expect(report.failed).toHaveLength(0);

    expect(
      await readFile(
        path.join(cwd, ".github", "skills", "api-design", "SKILL.md"),
        "utf8",
      ),
    ).toBe("# API\n");
    expect(
      await readFile(path.join(cwd, ".github", "agents", "reviewer.md"), "utf8"),
    ).toBe("# Reviewer\n");

    const mcp = JSON.parse(
      await readFile(path.join(cwd, ".vscode", "mcp.json"), "utf8"),
    );
    expect(mcp.mcpServers.filesystem.command).toBe("npx");

    const appliedExt = report.applied.find((r) => r.kind === "extension");
    expect(appliedExt?.command).toContain("code --install-extension publisher.ext");
    expect(
      report.skipped.some(
        (r) => r.kind === "extension" && r.id === "cursor.only",
      ),
    ).toBe(true);
  });

  it("writes both Cursor and VS Code layouts when ide is both", async () => {
    const cwd = await makeCwd();
    const manifest = baseManifest({
      skills: [
        {
          source: "local",
          externalId: "shared-skill",
          name: "Shared",
          content: "# Shared\n",
        },
      ],
      mcps: [
        {
          source: "registry",
          externalId: "filesystem",
          name: "Filesystem",
          server: { command: "npx" },
        },
      ],
      docs: [
        {
          source: "web",
          externalId: "docs",
          name: "Docs",
          url: "https://example.com",
        },
      ],
      extensions: [
        { ide: "cursor", id: "cursor.ext", name: "Cursor Ext" },
        { ide: "vscode", id: "vscode.ext", name: "VS Code Ext" },
      ],
    });

    const report = await applyProfile(manifest, { cwd, ide: "both" });
    expect(report.failed).toHaveLength(0);

    expect(
      await readFile(
        path.join(cwd, ".cursor", "skills", "shared-skill", "SKILL.md"),
        "utf8",
      ),
    ).toBe("# Shared\n");
    expect(
      await readFile(
        path.join(cwd, ".github", "skills", "shared-skill", "SKILL.md"),
        "utf8",
      ),
    ).toBe("# Shared\n");

    const cursorMcp = JSON.parse(
      await readFile(path.join(cwd, ".cursor", "mcp.json"), "utf8"),
    );
    const vscodeMcp = JSON.parse(
      await readFile(path.join(cwd, ".vscode", "mcp.json"), "utf8"),
    );
    expect(cursorMcp.mcpServers.filesystem.command).toBe("npx");
    expect(vscodeMcp.mcpServers.filesystem.command).toBe("npx");

    const docs = JSON.parse(
      await readFile(path.join(cwd, ".mcs", "docs.json"), "utf8"),
    );
    expect(docs.docs).toHaveLength(1);

    const extCommands = report.applied
      .filter((r) => r.kind === "extension")
      .map((r) => r.command);
    expect(extCommands).toEqual(
      expect.arrayContaining([
        "cursor --install-extension cursor.ext",
        "code --install-extension vscode.ext",
      ]),
    );
  });
});

describe("applyProfile — dry-run", () => {
  it("reports applied without writing files", async () => {
    const cwd = await makeCwd();
    const manifest = baseManifest({
      skills: [
        {
          source: "local",
          externalId: "demo-skill",
          name: "Demo",
          content: "# Demo\n",
        },
      ],
    });

    const report = await applyProfile(manifest, { cwd, dryRun: true });
    expect(report.dryRun).toBe(true);
    expect(report.applied).toHaveLength(1);
    expect(report.applied[0]?.message).toMatch(/Would create/);

    await expect(
      readFile(path.join(cwd, ".cursor", "skills", "demo-skill", "SKILL.md")),
    ).rejects.toThrow();
  });
});

describe("applyProfile — idempotency", () => {
  it("skips identical content on second apply", async () => {
    const cwd = await makeCwd();
    const manifest = baseManifest({
      skills: [
        {
          source: "local",
          externalId: "stable",
          name: "Stable",
          content: "# Stable\n",
        },
      ],
      mcps: [
        {
          source: "registry",
          externalId: "fs",
          name: "FS",
          server: { command: "npx" },
        },
      ],
    });

    const first = await applyProfile(manifest, { cwd });
    expect(first.applied.length).toBeGreaterThan(0);

    const second = await applyProfile(manifest, { cwd });
    expect(second.applied).toHaveLength(0);
    expect(second.skipped.every((r) => r.message === "Already up to date")).toBe(
      true,
    );
  });

  it("skips differing content unless force", async () => {
    const cwd = await makeCwd();
    await mkdir(path.join(cwd, ".cursor", "skills", "x"), { recursive: true });
    await writeFile(
      path.join(cwd, ".cursor", "skills", "x", "SKILL.md"),
      "# Old\n",
      "utf8",
    );

    const manifest = baseManifest({
      skills: [
        {
          source: "local",
          externalId: "x",
          name: "X",
          content: "# New\n",
        },
      ],
    });

    const withoutForce = await applyProfile(manifest, { cwd });
    expect(withoutForce.skipped[0]?.status).toBe("skipped");
    expect(await readFile(path.join(cwd, ".cursor", "skills", "x", "SKILL.md"), "utf8")).toBe(
      "# Old\n",
    );

    const withForce = await applyProfile(manifest, { cwd, force: true });
    expect(withForce.applied[0]?.status).toBe("applied");
    expect(await readFile(path.join(cwd, ".cursor", "skills", "x", "SKILL.md"), "utf8")).toBe(
      "# New\n",
    );
  });
});

describe("path traversal protection", () => {
  it("rejects unsafe externalIds", () => {
    expect(() => assertSafeId("../etc")).toThrow(/Unsafe/);
    expect(() => assertSafeId("foo/bar")).toThrow(/Unsafe/);
    expect(() => assertSafeId("..")).toThrow(/Unsafe/);
    expect(assertSafeId("safe-id")).toBe("safe-id");
  });

  it("blocks resolveSafePath escaping base", async () => {
    const base = await makeCwd();
    expect(() => resolveSafePath(base, "..", "etc", "passwd")).toThrow(
      /Path traversal/,
    );
  });

  it("marks traversal skill as failed without writing outside cwd", async () => {
    const cwd = await makeCwd();
    const outside = path.join(cwd, "..", "should-not-exist.md");
    const manifest = baseManifest({
      skills: [
        {
          source: "evil",
          externalId: "../escape",
          name: "Escape",
          content: "pwned",
        },
      ],
    });

    const report = await applyProfile(manifest, { cwd });
    expect(report.failed).toHaveLength(1);
    expect(report.failed[0]?.message).toMatch(/Unsafe|traversal/i);

    await expect(readFile(outside, "utf8")).rejects.toThrow();
  });
});

afterEach(async () => {
  // best-effort cleanup is optional in temp dirs
  tmpDirs.length = 0;
});
