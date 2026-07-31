import { describe, expect, it } from "vitest";
import {
  cartCollectionKey,
  cartItemKey,
  cartProfileKey,
  dedupeCartEntries,
  isWebviewToHostMessage,
  type CartEntry,
} from "./protocol.js";

describe("protocol", () => {
  it("validates webview messages", () => {
    expect(isWebviewToHostMessage({ type: "ready" })).toBe(true);
    expect(
      isWebviewToHostMessage({
        type: "search",
        scope: "skill",
        query: "prisma",
      }),
    ).toBe(true);
    expect(
      isWebviewToHostMessage({
        type: "openExternal",
        url: "javascript:alert(1)",
      }),
    ).toBe(false);
    expect(
      isWebviewToHostMessage({
        type: "installBatch",
        entries: [],
        ideTarget: "auto",
        force: false,
      }),
    ).toBe(true);
  });

  it("dedupes cart entries by key", () => {
    const entries: CartEntry[] = [
      {
        kind: "item",
        key: cartItemKey("skill", "mcs", "a"),
        type: "skill",
        source: "mcs",
        externalId: "a",
        name: "A",
      },
      {
        kind: "item",
        key: cartItemKey("skill", "mcs", "a"),
        type: "skill",
        source: "mcs",
        externalId: "a",
        name: "A again",
      },
      {
        kind: "profile",
        key: cartProfileKey("demo", "nextjs-prisma"),
        username: "demo",
        slug: "nextjs-prisma",
        name: "Next",
      },
      {
        kind: "collection",
        key: cartCollectionKey("c1"),
        id: "c1",
        name: "Col",
        type: "skill",
      },
    ];
    expect(dedupeCartEntries(entries)).toHaveLength(3);
  });
});
