import type { CatalogItemType } from "../api/client.js";
import type { IdeApplyTarget } from "my-collec-skills-apply-engine";

export type MarketplaceScope =
  | "all"
  | CatalogItemType
  | "profiles"
  | "collections";

export type CartEntryKind = "item" | "profile" | "collection";

export interface CartItemEntry {
  kind: "item";
  key: string;
  type: CatalogItemType;
  source: string;
  externalId: string;
  name: string;
  description?: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

export interface CartProfileEntry {
  kind: "profile";
  key: string;
  username: string;
  slug: string;
  name: string;
  description?: string;
}

export interface CartCollectionEntry {
  kind: "collection";
  key: string;
  id: string;
  name: string;
  type: "skill" | "agent" | "mcp";
  description?: string;
}

export type CartEntry = CartItemEntry | CartProfileEntry | CartCollectionEntry;

export type WebviewToHostMessage =
  | { type: "ready" }
  | {
      type: "search";
      scope: MarketplaceScope;
      query: string;
      take?: number;
    }
  | {
      type: "installBatch";
      entries: CartEntry[];
      ideTarget: IdeApplyTarget | "auto";
      force: boolean;
    }
  | { type: "openExternal"; url: string }
  | { type: "refreshSession" };

export type HostToWebviewMessage =
  | {
      type: "bootstrap";
      apiUrl: string;
      authenticated: boolean;
      provider?: string;
      ideTarget: IdeApplyTarget | "auto";
      focusQuery?: boolean;
    }
  | {
      type: "searchResult";
      scope: MarketplaceScope;
      query: string;
      items: CartItemEntry[];
      profiles: CartProfileEntry[];
      collections: CartCollectionEntry[];
    }
  | {
      type: "installProgress";
      current: number;
      total: number;
      label: string;
    }
  | {
      type: "installComplete";
      results: Array<{
        key: string;
        name: string;
        ok: boolean;
        summary: string;
        error?: string;
      }>;
    }
  | { type: "session"; authenticated: boolean; provider?: string }
  | { type: "error"; message: string };

export function isWebviewToHostMessage(
  value: unknown,
): value is WebviewToHostMessage {
  if (!value || typeof value !== "object") return false;
  const msg = value as { type?: unknown };
  if (typeof msg.type !== "string") return false;

  switch (msg.type) {
    case "ready":
    case "refreshSession":
      return true;
    case "search": {
      const m = value as {
        scope?: unknown;
        query?: unknown;
        take?: unknown;
      };
      return typeof m.scope === "string" && typeof m.query === "string";
    }
    case "installBatch": {
      const m = value as {
        entries?: unknown;
        ideTarget?: unknown;
        force?: unknown;
      };
      return (
        Array.isArray(m.entries) &&
        typeof m.ideTarget === "string" &&
        typeof m.force === "boolean"
      );
    }
    case "openExternal": {
      const m = value as { url?: unknown };
      return typeof m.url === "string" && /^https?:\/\//i.test(m.url);
    }
    default:
      return false;
  }
}

export function cartItemKey(
  type: string,
  source: string,
  externalId: string,
): string {
  return `item::${type}::${source}::${externalId}`;
}

export function cartProfileKey(username: string, slug: string): string {
  return `profile::${username}::${slug}`;
}

export function cartCollectionKey(id: string): string {
  return `collection::${id}`;
}

export function dedupeCartEntries(entries: CartEntry[]): CartEntry[] {
  const seen = new Set<string>();
  const out: CartEntry[] = [];
  for (const entry of entries) {
    if (seen.has(entry.key)) continue;
    seen.add(entry.key);
    out.push(entry);
  }
  return out;
}
