import { describe, expect, it } from "vitest";
import {
  canAccessOwnedResource,
  marketplaceCollectionVisibilityWhere,
  marketplaceVisibilityWhere,
} from "./marketplace-access";

describe("marketplace visibility helpers", () => {
  it("allows public resources without auth", () => {
    expect(canAccessOwnedResource(true, "owner-1")).toBe(true);
    expect(canAccessOwnedResource(false, "owner-1")).toBe(false);
  });

  it("allows private resources only for matching owner", () => {
    expect(canAccessOwnedResource(false, "owner-1", "owner-1")).toBe(true);
    expect(canAccessOwnedResource(false, "owner-1", "other")).toBe(false);
  });

  it("builds OR filters for public + owned", () => {
    expect(marketplaceVisibilityWhere()).toEqual({
      OR: [{ isPublic: true }],
    });
    expect(marketplaceVisibilityWhere("user-1")).toEqual({
      OR: [{ isPublic: true }, { ownerId: "user-1" }],
    });
    expect(marketplaceCollectionVisibilityWhere("user-1")).toEqual({
      OR: [{ isPublic: true }, { ownerId: "user-1" }],
    });
  });
});
