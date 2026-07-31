import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { applyProfile } from "./apply.js";
import { buildItemManifest } from "./item-manifest.js";

describe("buildItemManifest", () => {
  it("builds a skill manifest and applies content", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mcs-item-skill-"));
    const manifest = buildItemManifest({
      type: "skill",
      source: "mcs-catalog",
      externalId: "demo-skill",
      name: "Demo Skill",
      content: "# Demo\n",
    });

    expect(manifest.version).toBe(1);
    expect(manifest.username).toBe("catalog");
    expect(manifest.skills).toHaveLength(1);
    expect(manifest.agents).toHaveLength(0);

    const report = await applyProfile(manifest, { cwd });
    expect(report.failed).toHaveLength(0);
    expect(report.applied.some((r) => r.kind === "skill")).toBe(true);
    expect(
      await readFile(
        path.join(cwd, ".cursor", "skills", "demo-skill", "SKILL.md"),
        "utf8",
      ),
    ).toBe("# Demo\n");
  });

  it("builds an mcp manifest and applies server config", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mcs-item-mcp-"));
    const manifest = buildItemManifest({
      type: "mcp",
      source: "mcp-registry",
      externalId: "filesystem",
      name: "Filesystem",
      server: { command: "npx", args: ["-y", "server"] },
    });

    const report = await applyProfile(manifest, { cwd });
    expect(report.failed).toHaveLength(0);
    const mcp = JSON.parse(
      await readFile(path.join(cwd, ".cursor", "mcp.json"), "utf8"),
    );
    expect(mcp.mcpServers.filesystem.command).toBe("npx");
  });

  it("applies skill without content as skipped", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mcs-item-empty-"));
    const manifest = buildItemManifest({
      type: "skill",
      source: "mcs-catalog",
      externalId: "empty-skill",
      name: "Empty",
    });

    const report = await applyProfile(manifest, { cwd });
    expect(report.applied).toHaveLength(0);
    expect(report.skipped.some((r) => r.message === "No content to write")).toBe(
      true,
    );
  });

  it("sanitizes path-like skill ids for the filesystem", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mcs-item-nested-"));
    const manifest = buildItemManifest({
      type: "skill",
      source: "skills.sh",
      externalId: "owner/demo-skill",
      name: "Nested",
      content: "# Nested\n",
    });
    expect(manifest.skills[0]?.externalId).toBe("owner__demo-skill");
    expect(manifest.skills[0]?.metadata?.catalogExternalId).toBe(
      "owner/demo-skill",
    );

    const report = await applyProfile(manifest, { cwd });
    expect(report.failed).toHaveLength(0);
    expect(
      await readFile(
        path.join(cwd, ".cursor", "skills", "owner__demo-skill", "SKILL.md"),
        "utf8",
      ),
    ).toBe("# Nested\n");
  });

  it("rejects traversal externalIds", () => {
    expect(() =>
      buildItemManifest({
        type: "skill",
        source: "x",
        externalId: "../escape",
        name: "Bad",
        content: "# x\n",
      }),
    ).toThrow(/Unsafe/);
  });

  it("rejects mcp without server", () => {
    expect(() =>
      buildItemManifest({
        type: "mcp",
        source: "x",
        externalId: "fs",
        name: "FS",
      }),
    ).toThrow(/server/i);
  });

  it("builds a doc manifest", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mcs-item-doc-"));
    const manifest = buildItemManifest({
      type: "doc",
      source: "web",
      externalId: "prisma-docs",
      name: "Prisma",
      url: "https://www.prisma.io/docs",
    });

    const report = await applyProfile(manifest, { cwd });
    expect(report.failed).toHaveLength(0);
    const docs = JSON.parse(
      await readFile(path.join(cwd, ".mcs", "docs.json"), "utf8"),
    );
    expect(docs.docs).toHaveLength(1);
  });
});
