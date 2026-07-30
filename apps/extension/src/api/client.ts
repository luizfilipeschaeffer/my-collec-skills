import { buildManifestUrl } from "../url.js";

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

export interface FetchManifestOptions {
  apiUrl: string;
  username: string;
  slug: string;
  token?: string;
  fetchImpl?: typeof fetch;
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
  const body = await res.text();

  if (!res.ok) {
    throw new ApiError(
      res.status,
      body,
      `Failed to fetch manifest (${res.status}) for ${options.username}/${options.slug}`,
    );
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new ApiError(res.status, body, "Manifest response is not valid JSON");
  }
}
