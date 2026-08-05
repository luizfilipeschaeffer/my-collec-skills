import type { CatalogItem, CatalogItemType } from "@/lib/catalog";
import {
  CatalogContributeError,
  COMMUNITY_CATALOG_SOURCE,
  catalogContributeInputSchema,
  catalogContributePatchSchema,
  slugifyCatalogName,
} from "@/lib/catalog-contribute-rules";
import { db, Prisma, type CatalogEntryType } from "@mcs/db";
import type { z } from "zod";

export {
  CatalogContributeError,
  catalogContributeInputSchema,
  catalogContributePatchSchema,
  COMMUNITY_CATALOG_SOURCE,
  slugifyCatalogName,
  shouldProtectCatalogEntryFromSync,
} from "@/lib/catalog-contribute-rules";

type ContributeInput = z.infer<typeof catalogContributeInputSchema>;
type ContributePatch = z.infer<typeof catalogContributePatchSchema>;

export function toCatalogItem(row: {
  id: string;
  type: CatalogEntryType | CatalogItemType;
  source: string;
  externalId: string;
  name: string;
  description: string | null;
  url: string | null;
  metadata: Prisma.JsonValue | null;
  submittedBy?: { username: string; name: string | null } | null;
  category?: { id: string; name: string; slug: string } | null;
  subcategory?: { id: string; name: string; slug: string } | null;
}): CatalogItem {
  return {
    id: row.id,
    type: row.type as CatalogItemType,
    source: row.source,
    externalId: row.externalId,
    name: row.name,
    description: row.description ?? "",
    url: row.url ?? undefined,
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {},
    submittedBy: row.submittedBy ?? null,
    category: row.category ?? null,
    subcategory: row.subcategory ?? null,
  };
}

export const catalogEntryInclude = {
  submittedBy: { select: { username: true, name: true } },
  category: { select: { id: true, name: true, slug: true } },
  subcategory: { select: { id: true, name: true, slug: true } },
} as const;

export async function findOrCreateCategory(name: string) {
  const slug = slugifyCatalogName(name);
  const existing = await db.category.findUnique({ where: { slug } });
  if (existing) return existing;

  try {
    return await db.category.create({
      data: { slug, name: name.trim() },
    });
  } catch {
    return db.category.findUniqueOrThrow({ where: { slug } });
  }
}

export async function findOrCreateSubcategory(categoryId: string, name: string) {
  const slug = slugifyCatalogName(name);
  const existing = await db.subCategory.findUnique({
    where: { categoryId_slug: { categoryId, slug } },
  });
  if (existing) return existing;

  try {
    return await db.subCategory.create({
      data: { slug, name: name.trim(), categoryId },
    });
  } catch {
    return db.subCategory.findUniqueOrThrow({
      where: { categoryId_slug: { categoryId, slug } },
    });
  }
}

export async function resolveContributionTaxonomy(input: {
  categoryId?: string;
  newCategoryName?: string;
  subcategoryId?: string;
  newSubcategoryName?: string;
}) {
  const category = input.categoryId
    ? await db.category.findUnique({ where: { id: input.categoryId } })
    : await findOrCreateCategory(input.newCategoryName ?? "");

  if (!category) {
    throw new CatalogContributeError("Categoria não encontrada.");
  }

  const subcategory = input.subcategoryId
    ? await db.subCategory.findFirst({
        where: { id: input.subcategoryId, categoryId: category.id },
      })
    : await findOrCreateSubcategory(category.id, input.newSubcategoryName ?? "");

  if (!subcategory) {
    throw new CatalogContributeError(
      "A subcategoria não pertence à categoria.",
    );
  }

  return { category, subcategory };
}

async function allocateCommunityExternalId(baseSlug: string) {
  let candidate = baseSlug;
  let suffix = 2;
  while (true) {
    const existing = await db.catalogEntry.findUnique({
      where: {
        source_externalId: {
          source: COMMUNITY_CATALOG_SOURCE,
          externalId: candidate,
        },
      },
      select: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${baseSlug}-${suffix}`.slice(0, 80);
    suffix += 1;
  }
}

function contributionMetadata(input: ContributeInput | ContributePatch) {
  const metadata: Record<string, unknown> = {
    tags: ["community"],
  };
  if (input.metadata?.server) {
    metadata.server = input.metadata.server;
  }
  return metadata;
}

export async function createCommunityCatalogEntry(
  userId: string,
  input: ContributeInput,
) {
  const { category, subcategory } = await resolveContributionTaxonomy(input);
  const externalId = await allocateCommunityExternalId(
    slugifyCatalogName(input.name),
  );

  return db.catalogEntry.create({
    data: {
      type: input.type,
      source: COMMUNITY_CATALOG_SOURCE,
      externalId,
      name: input.name,
      description: input.description,
      url: input.url,
      metadata: contributionMetadata(input) as Prisma.InputJsonValue,
      submittedById: userId,
      categoryId: category.id,
      subcategoryId: subcategory.id,
      fetchedAt: new Date(),
    },
    include: catalogEntryInclude,
  });
}

export async function updateCommunityCatalogEntry(
  entryId: string,
  userId: string,
  input: ContributePatch,
) {
  const existing = await db.catalogEntry.findFirst({
    where: {
      id: entryId,
      submittedById: userId,
      source: COMMUNITY_CATALOG_SOURCE,
    },
  });
  if (!existing) {
    throw new CatalogContributeError("Item não encontrado.", 404);
  }

  const nextType = input.type ?? (existing.type as CatalogItemType);
  const nextUrl = input.url === undefined ? existing.url : input.url;
  if (nextType === "doc" && !nextUrl) {
    throw new CatalogContributeError("URL é obrigatória para docs.");
  }

  const taxonomyTouched =
    input.categoryId ||
    input.newCategoryName ||
    input.subcategoryId ||
    input.newSubcategoryName;

  const taxonomy = taxonomyTouched
    ? await resolveContributionTaxonomy({
        categoryId: input.categoryId ?? existing.categoryId ?? undefined,
        newCategoryName: input.newCategoryName,
        subcategoryId: input.subcategoryId ?? existing.subcategoryId ?? undefined,
        newSubcategoryName: input.newSubcategoryName,
      })
    : null;

  const nextMetadata =
    input.metadata === undefined
      ? undefined
      : (contributionMetadata({
          ...input,
          type: nextType,
          name: input.name ?? existing.name,
          description: input.description ?? existing.description ?? "",
        }) as Prisma.InputJsonValue);

  return db.catalogEntry.update({
    where: { id: existing.id },
    data: {
      type: input.type,
      name: input.name,
      description: input.description,
      url: input.url === undefined ? undefined : input.url,
      metadata: nextMetadata,
      categoryId: taxonomy?.category.id,
      subcategoryId: taxonomy?.subcategory.id,
      fetchedAt: new Date(),
    },
    include: catalogEntryInclude,
  });
}
