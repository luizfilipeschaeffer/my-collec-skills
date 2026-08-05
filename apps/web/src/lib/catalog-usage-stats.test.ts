import { describe, expect, it } from "vitest";
import {
  aggregateCatalogUsage,
  aggregateCollectionUsage,
  catalogUsageKey,
  formatCatalogUsageLabel,
  isPopularUsage,
  POPULAR_PROFILE_THRESHOLD,
} from "./catalog-usage-stats";

describe("catalogUsageKey", () => {
  it("joins source and externalId", () => {
    expect(catalogUsageKey("skills.sh", "vercel/react")).toBe(
      "skills.sh::vercel/react",
    );
  });
});

describe("aggregateCatalogUsage", () => {
  it("counts public collections and unions profile/collector hits", () => {
    const stats = aggregateCatalogUsage({
      keys: [
        { source: "mcs-catalog", externalId: "nextjs" },
        { source: "community", externalId: "prisma-review" },
      ],
      collectionMemberships: [
        { source: "mcs-catalog", externalId: "nextjs" },
        { source: "mcs-catalog", externalId: "nextjs" },
        { source: "community", externalId: "prisma-review" },
      ],
      profileHits: [
        {
          source: "mcs-catalog",
          externalId: "nextjs",
          profileId: "p1",
          ownerId: "u1",
        },
        {
          source: "mcs-catalog",
          externalId: "nextjs",
          profileId: "p2",
          ownerId: "u1",
        },
        {
          source: "mcs-catalog",
          externalId: "nextjs",
          profileId: "p1",
          ownerId: "u1",
        },
        {
          source: "community",
          externalId: "prisma-review",
          profileId: "p3",
          ownerId: "u2",
        },
      ],
    });

    expect(stats.get(catalogUsageKey("mcs-catalog", "nextjs"))).toEqual({
      collections: 2,
      profiles: 2,
      collectors: 1,
    });
    expect(stats.get(catalogUsageKey("community", "prisma-review"))).toEqual({
      collections: 1,
      profiles: 1,
      collectors: 1,
    });
  });

  it("returns zeros for unused keys", () => {
    const stats = aggregateCatalogUsage({
      keys: [{ source: "mcs-catalog", externalId: "lonely" }],
      collectionMemberships: [],
      profileHits: [],
    });
    expect(stats.get(catalogUsageKey("mcs-catalog", "lonely"))).toEqual({
      collections: 0,
      profiles: 0,
      collectors: 0,
    });
  });
});

describe("aggregateCollectionUsage", () => {
  it("counts distinct public profiles and owners", () => {
    const stats = aggregateCollectionUsage([
      { collectionId: "c1", profileId: "p1", ownerId: "u1" },
      { collectionId: "c1", profileId: "p2", ownerId: "u1" },
      { collectionId: "c1", profileId: "p3", ownerId: "u2" },
      { collectionId: "c2", profileId: "p4", ownerId: "u3" },
    ]);

    expect(stats.get("c1")).toEqual({ profiles: 3, collectors: 2 });
    expect(stats.get("c2")).toEqual({ profiles: 1, collectors: 1 });
  });
});

describe("isPopularUsage", () => {
  it("flags items with at least 100 public profiles", () => {
    expect(isPopularUsage({ collectors: 10, profiles: 99, collections: 4 })).toBe(
      false,
    );
    expect(
      isPopularUsage({
        collectors: 40,
        profiles: POPULAR_PROFILE_THRESHOLD,
        collections: 12,
      }),
    ).toBe(true);
  });
});

describe("formatCatalogUsageLabel", () => {
  it("renders the social proof line", () => {
    expect(
      formatCatalogUsageLabel({
        collectors: 42,
        collections: 18,
        profiles: 31,
      }),
    ).toBe("42 colecionadores · 18 coleções · 31 profiles");
    expect(
      formatCatalogUsageLabel({
        collectors: 0,
        collections: 0,
        profiles: 0,
      }),
    ).toBeNull();
  });
});
