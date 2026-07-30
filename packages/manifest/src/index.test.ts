import { describe, expect, it } from "vitest";
import {
  ManifestValidationError,
  parseProfileManifest,
  ProfileManifestSchema,
} from "./index.js";

const validMinimal = {
  version: 1 as const,
  username: "alice",
  slug: "nextjs-prisma",
  name: "Next.js + Prisma",
};

describe("ProfileManifestSchema", () => {
  it("accepts a full PRD-shaped manifesto", () => {
    const manifest = parseProfileManifest({
      ...validMinimal,
      collections: [
        {
          type: "skill",
          category: "database",
          subcategory: "prisma",
          name: "Prisma essentials",
          items: [
            {
              source: "cursor-community",
              externalId: "prisma-migrate",
              name: "Prisma Migrate",
              content: "# Prisma Migrate\n",
            },
          ],
        },
      ],
      skills: [],
      agents: [],
      mcps: [
        {
          source: "mcp-registry",
          externalId: "filesystem",
          name: "Filesystem",
          server: { command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem"] },
        },
      ],
      docs: [
        {
          source: "web",
          externalId: "prisma-docs",
          name: "Prisma Docs",
          url: "https://www.prisma.io/docs",
        },
      ],
      extensions: [
        { ide: "cursor", id: "publisher.extension", name: "Example" },
      ],
    });

    expect(manifest.version).toBe(1);
    expect(manifest.collections[0]?.category).toBe("database");
    expect(manifest.mcps).toHaveLength(1);
  });

  it("defaults empty arrays", () => {
    const manifest = parseProfileManifest(validMinimal);
    expect(manifest.skills).toEqual([]);
    expect(manifest.agents).toEqual([]);
    expect(manifest.mcps).toEqual([]);
    expect(manifest.docs).toEqual([]);
    expect(manifest.extensions).toEqual([]);
    expect(manifest.collections).toEqual([]);
  });

  it("rejects wrong version", () => {
    expect(() =>
      parseProfileManifest({ ...validMinimal, version: 2 }),
    ).toThrow(ManifestValidationError);
  });

  it("requires category and subcategory on collections", () => {
    const result = ProfileManifestSchema.safeParse({
      ...validMinimal,
      collections: [{ type: "skill", name: "x", items: [] }],
    });
    expect(result.success).toBe(false);
  });
});
