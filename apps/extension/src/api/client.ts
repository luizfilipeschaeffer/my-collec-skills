import {
  buildCatalogSearchUrl,
  buildCollectionManifestUrl,
  buildManifestUrl,
  buildMarketplaceCollectionsUrl,
  buildMarketplaceProfilesUrl,
  buildSkillDetailUrl,
} from "../url.js";

export class ApiError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string, message?: string) {
    super(message ?? `API error ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export { buildManifestUrl, buildOAuthSignInUrl } from "../url.js";

export type CatalogItemType = "skill" | "agent" | "mcp" | "doc";

export interface CatalogApiItem {
  type: CatalogItemType;
  source: string;
  externalId: string;
  name: string;
  description: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchCatalogResult {
  items: CatalogApiItem[];
  query: string;
  source: string;
  count: number;
}

export interface FetchManifestOptions {
  apiUrl: string;
  username: string;
  slug: string;
  token?: string;
  fetchImpl?: typeof fetch;
}

async function readJsonResponse(
  res: Response,
  errorLabel: string,
): Promise<unknown> {
  const body = await res.text();
  if (!res.ok) {
    throw new ApiError(res.status, body, `${errorLabel} (${res.status})`);
  }
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new ApiError(res.status, body, `${errorLabel}: response is not valid JSON`);
  }
}

/** GET /api/profiles/:username/:slug/manifest → JSON bruto. */
export async function fetchProfileManifest(
  options: FetchManifestOptions,
): Promise<unknown> {
  const url = buildManifestUrl(options.apiUrl, options.username, options.slug);
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const fetchFn = options.fetchImpl ?? fetch;
  const res = await fetchFn(url, { headers });
  return readJsonResponse(
    res,
    `Failed to fetch manifest for ${options.username}/${options.slug}`,
  );
}

export interface SearchCatalogOptions {
  apiUrl: string;
  q?: string;
  type?: CatalogItemType | "all";
  take?: number;
  fetchImpl?: typeof fetch;
}

/** GET /api/catalog?q=&type=&take= */
export async function searchCatalog(
  options: SearchCatalogOptions,
): Promise<SearchCatalogResult> {
  const url = buildCatalogSearchUrl(options.apiUrl, {
    q: options.q,
    type: options.type,
    take: options.take,
  });
  const fetchFn = options.fetchImpl ?? fetch;
  const res = await fetchFn(url, {
    headers: { Accept: "application/json" },
  });
  const data = (await readJsonResponse(res, "Failed to search catalog")) as {
    items?: CatalogApiItem[];
    query?: string;
    source?: string;
    count?: number;
  };

  const items = Array.isArray(data.items) ? data.items : [];
  return {
    items,
    query: data.query ?? options.q ?? "",
    source: data.source ?? "unknown",
    count: data.count ?? items.length,
  };
}

export interface FetchSkillMarkdownOptions {
  apiUrl: string;
  skillId: string;
  fetchImpl?: typeof fetch;
}

/**
 * GET /api/catalog/skills/[...id]
 * Returns SKILL.md contents when available, or null if unavailable.
 */
export async function fetchSkillMarkdown(
  options: FetchSkillMarkdownOptions,
): Promise<string | null> {
  const url = buildSkillDetailUrl(options.apiUrl, options.skillId);
  const fetchFn = options.fetchImpl ?? fetch;
  const res = await fetchFn(url, {
    headers: { Accept: "application/json" },
  });

  if (res.status === 503 || res.status === 404) {
    return null;
  }

  const data = (await readJsonResponse(
    res,
    `Failed to fetch skill detail for ${options.skillId}`,
  )) as { skillMarkdown?: string | null };

  const md = data.skillMarkdown;
  return typeof md === "string" && md.trim() ? md : null;
}

export interface MarketplaceProfileSummary {
  id: string;
  username: string;
  slug: string;
  name: string;
  description?: string;
  isPublic: boolean;
  isOwned: boolean;
  counts: {
    collections: number;
    skills: number;
    agents: number;
    mcps: number;
    docs: number;
  };
}

export interface MarketplaceCollectionSummary {
  id: string;
  name: string;
  description?: string;
  type: "skill" | "agent" | "mcp";
  category: string;
  subcategory: string;
  ownerUsername: string;
  isPublic: boolean;
  isOwned: boolean;
  itemCount: number;
}

function authHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function searchMarketplaceProfiles(options: {
  apiUrl: string;
  q?: string;
  take?: number;
  token?: string;
  fetchImpl?: typeof fetch;
}): Promise<{
  profiles: MarketplaceProfileSummary[];
  authenticated: boolean;
}> {
  const url = buildMarketplaceProfilesUrl(options.apiUrl, {
    q: options.q,
    take: options.take,
  });
  const fetchFn = options.fetchImpl ?? fetch;
  const res = await fetchFn(url, { headers: authHeaders(options.token) });
  const data = (await readJsonResponse(
    res,
    "Failed to search marketplace profiles",
  )) as {
    profiles?: MarketplaceProfileSummary[];
    authenticated?: boolean;
  };
  return {
    profiles: Array.isArray(data.profiles) ? data.profiles : [],
    authenticated: Boolean(data.authenticated),
  };
}

export async function searchMarketplaceCollections(options: {
  apiUrl: string;
  q?: string;
  type?: string;
  take?: number;
  token?: string;
  fetchImpl?: typeof fetch;
}): Promise<{
  collections: MarketplaceCollectionSummary[];
  authenticated: boolean;
}> {
  const url = buildMarketplaceCollectionsUrl(options.apiUrl, {
    q: options.q,
    type: options.type,
    take: options.take,
  });
  const fetchFn = options.fetchImpl ?? fetch;
  const res = await fetchFn(url, { headers: authHeaders(options.token) });
  const data = (await readJsonResponse(
    res,
    "Failed to search marketplace collections",
  )) as {
    collections?: MarketplaceCollectionSummary[];
    authenticated?: boolean;
  };
  return {
    collections: Array.isArray(data.collections) ? data.collections : [],
    authenticated: Boolean(data.authenticated),
  };
}

export async function fetchCollectionManifest(options: {
  apiUrl: string;
  collectionId: string;
  token?: string;
  fetchImpl?: typeof fetch;
}): Promise<unknown> {
  const url = buildCollectionManifestUrl(options.apiUrl, options.collectionId);
  const fetchFn = options.fetchImpl ?? fetch;
  const res = await fetchFn(url, { headers: authHeaders(options.token) });
  return readJsonResponse(
    res,
    `Failed to fetch collection manifest ${options.collectionId}`,
  );
}
