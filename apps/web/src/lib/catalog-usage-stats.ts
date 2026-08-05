export type CatalogUsageKey = {
  source: string;
  externalId: string;
};

export type UsageStats = {
  collectors: number;
  profiles: number;
  collections: number;
};

export type CollectionUsageStats = {
  collectors: number;
  profiles: number;
};

export type ProfileHit = CatalogUsageKey & {
  profileId: string;
  ownerId: string;
};

export const POPULAR_PROFILE_THRESHOLD = 100;

export function catalogUsageKey(source: string, externalId: string) {
  return `${source}::${externalId}`;
}

export function emptyUsage(): UsageStats {
  return { collectors: 0, profiles: 0, collections: 0 };
}

export function isPopularUsage(usage?: UsageStats | CollectionUsageStats | null) {
  return Boolean(usage && usage.profiles >= POPULAR_PROFILE_THRESHOLD);
}

export function formatCatalogUsageLabel(usage?: UsageStats | null) {
  if (!usage) return null;
  if (
    usage.collectors === 0 &&
    usage.profiles === 0 &&
    usage.collections === 0
  ) {
    return null;
  }
  return `${usage.collectors} colecionadores · ${usage.collections} coleções · ${usage.profiles} profiles`;
}

export function formatCollectionUsageLabel(usage?: CollectionUsageStats | null) {
  if (!usage) return null;
  if (usage.collectors === 0 && usage.profiles === 0) return null;
  return `${usage.collectors} colecionadores · ${usage.profiles} profiles`;
}

export function aggregateCatalogUsage(input: {
  keys: CatalogUsageKey[];
  collectionMemberships: CatalogUsageKey[];
  profileHits: ProfileHit[];
}): Map<string, UsageStats> {
  const collectionCounts = new Map<string, number>();
  for (const row of input.collectionMemberships) {
    const key = catalogUsageKey(row.source, row.externalId);
    collectionCounts.set(key, (collectionCounts.get(key) ?? 0) + 1);
  }

  const profilesByKey = new Map<string, Set<string>>();
  const collectorsByKey = new Map<string, Set<string>>();
  for (const hit of input.profileHits) {
    const key = catalogUsageKey(hit.source, hit.externalId);
    const profiles = profilesByKey.get(key) ?? new Set<string>();
    profiles.add(hit.profileId);
    profilesByKey.set(key, profiles);
    const collectors = collectorsByKey.get(key) ?? new Set<string>();
    collectors.add(hit.ownerId);
    collectorsByKey.set(key, collectors);
  }

  const result = new Map<string, UsageStats>();
  for (const item of input.keys) {
    const key = catalogUsageKey(item.source, item.externalId);
    result.set(key, {
      collections: collectionCounts.get(key) ?? 0,
      profiles: profilesByKey.get(key)?.size ?? 0,
      collectors: collectorsByKey.get(key)?.size ?? 0,
    });
  }
  return result;
}

export function aggregateCollectionUsage(
  rows: Array<{ collectionId: string; profileId: string; ownerId: string }>,
): Map<string, CollectionUsageStats> {
  const profiles = new Map<string, Set<string>>();
  const collectors = new Map<string, Set<string>>();
  for (const row of rows) {
    const profileSet = profiles.get(row.collectionId) ?? new Set<string>();
    profileSet.add(row.profileId);
    profiles.set(row.collectionId, profileSet);
    const collectorSet = collectors.get(row.collectionId) ?? new Set<string>();
    collectorSet.add(row.ownerId);
    collectors.set(row.collectionId, collectorSet);
  }

  const result = new Map<string, CollectionUsageStats>();
  for (const [collectionId, profileSet] of profiles) {
    result.set(collectionId, {
      profiles: profileSet.size,
      collectors: collectors.get(collectionId)?.size ?? 0,
    });
  }
  return result;
}
