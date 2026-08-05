import type { CatalogItemType } from "@/lib/catalog";
import { z } from "zod";

export const COMMUNITY_CATALOG_SOURCE = "community";

export class CatalogContributeError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "CatalogContributeError";
    this.status = status;
  }
}

const optionalUrl = z
  .union([z.string().url(), z.literal(""), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    return value ? value : null;
  });

const mcpServerSchema = z
  .object({
    command: z.string().min(1).max(200).optional(),
    args: z.array(z.string().max(200)).max(20).optional(),
    url: z.string().url().optional(),
  })
  .refine((value) => Boolean(value.command || value.url), {
    message: "Informe command ou url do servidor MCP.",
  });

const taxonomyFields = {
  categoryId: z.string().cuid().optional(),
  newCategoryName: z.string().trim().min(2).max(80).optional(),
  subcategoryId: z.string().cuid().optional(),
  newSubcategoryName: z.string().trim().min(2).max(80).optional(),
};

function addContributeIssues(
  data: {
    type?: CatalogItemType;
    url?: string | null;
    categoryId?: string;
    newCategoryName?: string;
    subcategoryId?: string;
    newSubcategoryName?: string;
  },
  ctx: z.RefinementCtx,
  partial: boolean,
) {
  if (data.type === "doc" && (!partial ? !data.url : data.url === null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["url"],
      message: "URL é obrigatória para docs.",
    });
  }

  if (partial) return;

  if (!data.categoryId && !data.newCategoryName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["categoryId"],
      message: "Informe uma categoria existente ou um nome novo.",
    });
  }
  if (!data.subcategoryId && !data.newSubcategoryName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["subcategoryId"],
      message: "Informe uma subcategoria existente ou um nome novo.",
    });
  }
}

export const catalogContributeInputSchema = z
  .object({
    type: z.enum(["skill", "agent", "mcp", "doc"]),
    name: z.string().trim().min(2).max(150),
    description: z.string().trim().min(1).max(1000),
    url: optionalUrl,
    metadata: z
      .object({
        server: mcpServerSchema.optional(),
      })
      .optional(),
    ...taxonomyFields,
  })
  .superRefine((data, ctx) => addContributeIssues(data, ctx, false));

export const catalogContributePatchSchema = z
  .object({
    type: z.enum(["skill", "agent", "mcp", "doc"]).optional(),
    name: z.string().trim().min(2).max(150).optional(),
    description: z.string().trim().min(1).max(1000).optional(),
    url: optionalUrl,
    metadata: z
      .object({
        server: mcpServerSchema.optional(),
      })
      .optional(),
    ...taxonomyFields,
  })
  .superRefine((data, ctx) => addContributeIssues(data, ctx, true));

export function slugifyCatalogName(value: string) {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug || "item";
}

export function shouldProtectCatalogEntryFromSync(entry: {
  source: string;
  submittedById?: string | null;
}) {
  return (
    entry.source === COMMUNITY_CATALOG_SOURCE || Boolean(entry.submittedById)
  );
}

export function nextTaxonomySlug(name: string) {
  return slugifyCatalogName(name);
}
