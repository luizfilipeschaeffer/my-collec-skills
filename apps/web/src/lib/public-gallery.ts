import {
  loadCollectionUsage,
  type CollectionUsageStats,
} from "@/lib/catalog-usage";
import { db, type CollectionType } from "@mcs/db";

export async function listPublicProfiles(options?: {
  q?: string;
  take?: number;
}) {
  const q = options?.q?.trim();
  return db.profile.findMany({
    where: {
      isPublic: true,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
              { owner: { username: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      owner: true,
      _count: {
        select: {
          collections: true,
          skills: true,
          agents: true,
          mcps: true,
          docs: true,
          extensions: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: options?.take ?? 48,
  });
}

export async function listPublicCollections(options?: {
  q?: string;
  type?: CollectionType | "all";
  category?: string;
  subcategory?: string;
  take?: number;
  sort?: "recent" | "popular";
}) {
  const q = options?.q?.trim();
  const type =
    options?.type && options.type !== "all" ? options.type : undefined;
  const take = options?.take ?? 48;

  const collections = await db.collection.findMany({
    where: {
      isPublic: true,
      ...(type ? { type } : {}),
      ...(options?.category ? { category: { slug: options.category } } : {}),
      ...(options?.subcategory
        ? { subcategory: { slug: options.subcategory } }
        : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { owner: { username: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      owner: true,
      category: true,
      subcategory: true,
      items: true,
      _count: { select: { profiles: true, items: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: options?.sort === "popular" ? Math.max(take, 200) : take,
  });

  const usage = await loadCollectionUsage(collections.map((item) => item.id));
  const withUsage = collections.map((collection) => ({
    ...collection,
    usage: usage.get(collection.id) ?? { collectors: 0, profiles: 0 },
  }));

  if (options?.sort === "popular") {
    withUsage.sort(
      (left, right) =>
        right.usage.collectors - left.usage.collectors ||
        right.usage.profiles - left.usage.profiles,
    );
    return withUsage.slice(0, take);
  }

  return withUsage;
}

export async function getPublicCollection(id: string) {
  const collection = await db.collection.findFirst({
    where: { id, isPublic: true },
    include: {
      owner: true,
      category: true,
      subcategory: true,
      items: { orderBy: { name: "asc" } },
      profiles: {
        where: { profile: { isPublic: true } },
        include: {
          profile: {
            include: { owner: true },
          },
        },
      },
    },
  });
  if (!collection) return null;

  const usageMap = await loadCollectionUsage([collection.id]);
  return {
    ...collection,
    usage: usageMap.get(collection.id) ?? {
      collectors: 0,
      profiles: collection.profiles.length,
    } satisfies CollectionUsageStats,
  };
}

export async function listCategoriesWithCounts() {
  const categories = await db.category.findMany({
    include: {
      subcategories: { orderBy: { name: "asc" } },
      _count: {
        select: {
          collections: { where: { isPublic: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });
  return categories;
}

export function profileItemCount(counts: {
  collections: number;
  skills: number;
  agents: number;
  mcps: number;
  docs?: number;
  extensions?: number;
}) {
  return (
    counts.collections +
    counts.skills +
    counts.agents +
    counts.mcps +
    (counts.docs ?? 0) +
    (counts.extensions ?? 0)
  );
}
