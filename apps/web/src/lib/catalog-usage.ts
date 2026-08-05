import "server-only";

import {
  aggregateCatalogUsage,
  aggregateCollectionUsage,
  catalogUsageKey,
  emptyUsage,
  type CatalogUsageKey,
  type CollectionUsageStats,
  type ProfileHit,
  type UsageStats,
} from "@/lib/catalog-usage-stats";
import { db, Prisma } from "@mcs/db";

export {
  catalogUsageKey,
  emptyUsage,
  formatCatalogUsageLabel,
  formatCollectionUsageLabel,
  isPopularUsage,
  POPULAR_PROFILE_THRESHOLD,
  type CollectionUsageStats,
  type UsageStats,
} from "@/lib/catalog-usage-stats";

function keySet(keys: CatalogUsageKey[]) {
  return new Set(keys.map((key) => catalogUsageKey(key.source, key.externalId)));
}

function matchesKey(
  allowed: Set<string>,
  source: string,
  externalId: string,
) {
  return allowed.has(catalogUsageKey(source, externalId));
}

async function loadProfileHits(keys: CatalogUsageKey[]): Promise<ProfileHit[]> {
  if (keys.length === 0) return [];

  const allowed = keySet(keys);
  const sources = [...new Set(keys.map((key) => key.source))];
  const externalIds = [...new Set(keys.map((key) => key.externalId))];
  const pairFilter = {
    source: { in: sources },
    externalId: { in: externalIds },
    profile: { isPublic: true },
  };

  const [skills, agents, mcps, docs] = await Promise.all([
    db.profileSkill.findMany({
      where: pairFilter,
      select: {
        source: true,
        externalId: true,
        profile: { select: { id: true, ownerId: true } },
      },
    }),
    db.profileAgent.findMany({
      where: pairFilter,
      select: {
        source: true,
        externalId: true,
        profile: { select: { id: true, ownerId: true } },
      },
    }),
    db.profileMcp.findMany({
      where: pairFilter,
      select: {
        source: true,
        externalId: true,
        profile: { select: { id: true, ownerId: true } },
      },
    }),
    db.profileDoc.findMany({
      where: pairFilter,
      select: {
        source: true,
        externalId: true,
        profile: { select: { id: true, ownerId: true } },
      },
    }),
  ]);

  const hits: ProfileHit[] = [];
  for (const row of [...skills, ...agents, ...mcps, ...docs]) {
    if (!matchesKey(allowed, row.source, row.externalId)) continue;
    hits.push({
      source: row.source,
      externalId: row.externalId,
      profileId: row.profile.id,
      ownerId: row.profile.ownerId,
    });
  }
  return hits;
}

async function loadCollectionMemberships(keys: CatalogUsageKey[]) {
  if (keys.length === 0) {
    return {
      memberships: [] as CatalogUsageKey[],
      hits: [] as ProfileHit[],
    };
  }

  const allowed = keySet(keys);
  const rows = await db.collectionItem.findMany({
    where: {
      source: { in: [...new Set(keys.map((key) => key.source))] },
      externalId: { in: [...new Set(keys.map((key) => key.externalId))] },
      collection: { isPublic: true },
    },
    select: {
      source: true,
      externalId: true,
      collectionId: true,
    },
  });

  const memberships = rows.filter((row) =>
    matchesKey(allowed, row.source, row.externalId),
  );
  const collectionIds = [...new Set(memberships.map((row) => row.collectionId))];
  if (collectionIds.length === 0) {
    return { memberships, hits: [] as ProfileHit[] };
  }

  const links = await db.profileCollection.findMany({
    where: {
      collectionId: { in: collectionIds },
      profile: { isPublic: true },
    },
    select: {
      collectionId: true,
      profile: { select: { id: true, ownerId: true } },
    },
  });

  const profilesByCollection = new Map<string, Array<{ id: string; ownerId: string }>>();
  for (const link of links) {
    const bucket = profilesByCollection.get(link.collectionId) ?? [];
    bucket.push(link.profile);
    profilesByCollection.set(link.collectionId, bucket);
  }

  const hits: ProfileHit[] = [];
  for (const row of memberships) {
    for (const profile of profilesByCollection.get(row.collectionId) ?? []) {
      hits.push({
        source: row.source,
        externalId: row.externalId,
        profileId: profile.id,
        ownerId: profile.ownerId,
      });
    }
  }

  return { memberships, hits };
}

export async function loadCatalogUsage(
  keys: CatalogUsageKey[],
): Promise<Map<string, UsageStats>> {
  const uniqueKeys = [
    ...new Map(
      keys.map((key) => [catalogUsageKey(key.source, key.externalId), key]),
    ).values(),
  ];
  if (uniqueKeys.length === 0) return new Map();

  const [directHits, collectionData] = await Promise.all([
    loadProfileHits(uniqueKeys),
    loadCollectionMemberships(uniqueKeys),
  ]);

  return aggregateCatalogUsage({
    keys: uniqueKeys,
    collectionMemberships: collectionData.memberships,
    profileHits: [...directHits, ...collectionData.hits],
  });
}

export async function withCatalogUsage<T extends CatalogUsageKey & { usage?: UsageStats }>(
  items: T[],
): Promise<Array<T & { usage: UsageStats }>> {
  const missing = items.filter((item) => !item.usage);
  const usage = await loadCatalogUsage(missing);
  return items.map((item) => ({
    ...item,
    usage:
      item.usage ??
      usage.get(catalogUsageKey(item.source, item.externalId)) ??
      emptyUsage(),
  }));
}

export function sortCatalogItemsByUsage<T extends { usage?: UsageStats }>(
  items: T[],
) {
  return [...items].sort((left, right) => {
    const leftUsage = left.usage ?? emptyUsage();
    const rightUsage = right.usage ?? emptyUsage();
    return (
      rightUsage.collectors - leftUsage.collectors ||
      rightUsage.profiles - leftUsage.profiles ||
      rightUsage.collections - leftUsage.collections
    );
  });
}

export async function loadCollectionUsage(
  collectionIds: string[],
): Promise<Map<string, CollectionUsageStats>> {
  const uniqueIds = [...new Set(collectionIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const rows = await db.profileCollection.findMany({
    where: {
      collectionId: { in: uniqueIds },
      profile: { isPublic: true },
    },
    select: {
      collectionId: true,
      profile: { select: { id: true, ownerId: true } },
    },
  });

  const aggregated = aggregateCollectionUsage(
    rows.map((row) => ({
      collectionId: row.collectionId,
      profileId: row.profile.id,
      ownerId: row.profile.ownerId,
    })),
  );

  for (const id of uniqueIds) {
    if (!aggregated.has(id)) {
      aggregated.set(id, { collectors: 0, profiles: 0 });
    }
  }
  return aggregated;
}

export class AttachableCollectionError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "AttachableCollectionError";
  }
}

export async function assertAttachableCollectionIds(
  userId: string,
  collectionIds: string[],
) {
  const uniqueIds = [...new Set(collectionIds)];
  if (uniqueIds.length === 0) return;

  const found = await db.collection.findMany({
    where: {
      id: { in: uniqueIds },
      OR: [{ ownerId: userId }, { isPublic: true }],
    },
    select: { id: true },
  });

  if (found.length !== uniqueIds.length) {
    throw new AttachableCollectionError(
      "Uma ou mais coleções não estão disponíveis (próprias ou públicas).",
    );
  }
}

export async function collectPublicCollection(input: {
  userId: string;
  collectionId: string;
  profileId: string;
}) {
  const collection = await db.collection.findUnique({
    where: { id: input.collectionId },
    select: { id: true, isPublic: true, ownerId: true },
  });
  if (!collection) {
    throw new AttachableCollectionError("Coleção não encontrada.", 404);
  }
  if (!collection.isPublic && collection.ownerId !== input.userId) {
    throw new AttachableCollectionError(
      "Só é possível colecionar coleções públicas ou as suas.",
      403,
    );
  }

  const profile = await db.profile.findFirst({
    where: { id: input.profileId, ownerId: input.userId },
    select: { id: true },
  });
  if (!profile) {
    throw new AttachableCollectionError("Profile não encontrado.", 404);
  }

  const existing = await db.profileCollection.findUnique({
    where: {
      profileId_collectionId: {
        profileId: profile.id,
        collectionId: collection.id,
      },
    },
  });
  if (existing) {
    return { link: existing, alreadyCollected: true };
  }

  try {
    const link = await db.profileCollection.create({
      data: {
        profileId: profile.id,
        collectionId: collection.id,
      },
    });
    return { link, alreadyCollected: false };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const link = await db.profileCollection.findUniqueOrThrow({
        where: {
          profileId_collectionId: {
            profileId: profile.id,
            collectionId: collection.id,
          },
        },
      });
      return { link, alreadyCollected: true };
    }
    throw error;
  }
}
