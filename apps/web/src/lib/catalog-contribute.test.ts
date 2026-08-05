import { describe, expect, it } from "vitest";
import {
  catalogContributeInputSchema,
  catalogContributePatchSchema,
  nextTaxonomySlug,
  shouldProtectCatalogEntryFromSync,
  slugifyCatalogName,
} from "./catalog-contribute-rules";

describe("slugifyCatalogName", () => {
  it("normalizes names into kebab-case slugs", () => {
    expect(slugifyCatalogName("Prisma Schema Review")).toBe(
      "prisma-schema-review",
    );
    expect(slugifyCatalogName("Next.js / App Router")).toBe("next-js-app-router");
    expect(slugifyCatalogName("  Segurança  ")).toBe("seguranca");
  });

  it("falls back when the name has no usable characters", () => {
    expect(slugifyCatalogName("***")).toBe("item");
  });
});

describe("nextTaxonomySlug", () => {
  it("reuses the same slug rules for categories", () => {
    expect(nextTaxonomySlug("Frontend & React")).toBe("frontend-react");
  });
});

describe("catalogContributeInputSchema", () => {
  const valid = {
    type: "skill" as const,
    name: "Prisma Review",
    description: "Revisa schema Prisma.",
    categoryId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
    subcategoryId: "clyyyyyyyyyyyyyyyyyyyyyyyyy",
  };

  it("accepts a skill with existing taxonomy", () => {
    expect(catalogContributeInputSchema.parse(valid)).toMatchObject({
      type: "skill",
      name: "Prisma Review",
    });
  });

  it("requires url for docs", () => {
    const result = catalogContributeInputSchema.safeParse({
      ...valid,
      type: "doc",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a new category and subcategory by name", () => {
    const parsed = catalogContributeInputSchema.parse({
      type: "mcp",
      name: "Filesystem MCP",
      description: "Acesso local a arquivos.",
      newCategoryName: "MCP Integrations",
      newSubcategoryName: "Filesystem",
      metadata: { server: { command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem"] } },
    });
    expect(parsed.newCategoryName).toBe("MCP Integrations");
  });

  it("rejects items without taxonomy", () => {
    const result = catalogContributeInputSchema.safeParse({
      type: "skill",
      name: "Orphan skill",
      description: "Sem categoria.",
    });
    expect(result.success).toBe(false);
  });
});

describe("catalogContributePatchSchema", () => {
  it("allows name-only updates", () => {
    expect(catalogContributePatchSchema.parse({ name: "Novo nome" })).toEqual({
      name: "Novo nome",
    });
  });
});

describe("shouldProtectCatalogEntryFromSync", () => {
  it("protects community and authored entries", () => {
    expect(
      shouldProtectCatalogEntryFromSync({ source: "community" }),
    ).toBe(true);
    expect(
      shouldProtectCatalogEntryFromSync({
        source: "skills.sh",
        submittedById: "user-1",
      }),
    ).toBe(true);
    expect(
      shouldProtectCatalogEntryFromSync({ source: "skills.sh" }),
    ).toBe(false);
  });
});
