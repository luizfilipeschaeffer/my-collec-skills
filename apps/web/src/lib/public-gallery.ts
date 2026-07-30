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
}) {
  const q = options?.q?.trim();
  const type =
    options?.type && options.type !== "all" ? options.type : undefined;

  return db.collection.findMany({
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
    take: options?.take ?? 48,
  });
}

export async function getPublicCollection(id: string) {
  return db.collection.findFirst({
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
