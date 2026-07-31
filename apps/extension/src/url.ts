/** Helpers de URL puros (sem dependência de vscode). */

export const DEFAULT_API_URL = "https://my-collec-skills.vercel.app";

export function normalizeApiUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "") || DEFAULT_API_URL;
}

export function buildManifestUrl(
  apiUrl: string,
  username: string,
  slug: string,
): string {
  const base = normalizeApiUrl(apiUrl);
  const u = encodeURIComponent(username.trim());
  const s = encodeURIComponent(slug.trim());
  return `${base}/api/profiles/${u}/${s}/manifest`;
}

export function buildCatalogSearchUrl(
  apiUrl: string,
  options: { q?: string; type?: string; take?: number } = {},
): string {
  const base = normalizeApiUrl(apiUrl);
  const params = new URLSearchParams();
  if (options.q?.trim()) params.set("q", options.q.trim());
  if (options.type && options.type !== "all") params.set("type", options.type);
  if (options.take && options.take > 0) params.set("take", String(options.take));
  const qs = params.toString();
  return qs ? `${base}/api/catalog?${qs}` : `${base}/api/catalog`;
}

/** `skillId` is `source/slug` (or nested path) as expected by the skills API. */
export function buildSkillDetailUrl(apiUrl: string, skillId: string): string {
  const base = normalizeApiUrl(apiUrl);
  const segments = skillId
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => encodeURIComponent(part));
  if (segments.length === 0) {
    throw new Error("Skill id is required");
  }
  return `${base}/api/catalog/skills/${segments.join("/")}`;
}

export function buildOAuthSignInUrl(
  apiUrl: string,
  provider: "github" | "gitlab",
): string {
  const base = normalizeApiUrl(apiUrl);
  return `${base}/api/auth/signin/${provider}`;
}

export function buildMarketplaceProfilesUrl(
  apiUrl: string,
  options: { q?: string; take?: number } = {},
): string {
  const base = normalizeApiUrl(apiUrl);
  const params = new URLSearchParams();
  if (options.q?.trim()) params.set("q", options.q.trim());
  if (options.take && options.take > 0) params.set("take", String(options.take));
  const qs = params.toString();
  return qs
    ? `${base}/api/marketplace/profiles?${qs}`
    : `${base}/api/marketplace/profiles`;
}

export function buildMarketplaceCollectionsUrl(
  apiUrl: string,
  options: { q?: string; type?: string; take?: number } = {},
): string {
  const base = normalizeApiUrl(apiUrl);
  const params = new URLSearchParams();
  if (options.q?.trim()) params.set("q", options.q.trim());
  if (options.type && options.type !== "all") params.set("type", options.type);
  if (options.take && options.take > 0) params.set("take", String(options.take));
  const qs = params.toString();
  return qs
    ? `${base}/api/marketplace/collections?${qs}`
    : `${base}/api/marketplace/collections`;
}

export function buildCollectionManifestUrl(
  apiUrl: string,
  collectionId: string,
): string {
  const base = normalizeApiUrl(apiUrl);
  return `${base}/api/marketplace/collections/${encodeURIComponent(collectionId.trim())}/manifest`;
}
