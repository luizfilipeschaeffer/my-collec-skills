/** Helpers de URL puros (sem dependência de vscode). */

export function normalizeApiUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "") || "http://localhost:3000";
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

export function buildOAuthSignInUrl(
  apiUrl: string,
  provider: "github" | "gitlab",
): string {
  const base = normalizeApiUrl(apiUrl);
  return `${base}/api/auth/signin/${provider}`;
}
