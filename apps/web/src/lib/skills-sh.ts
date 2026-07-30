import { getVercelOidcToken } from "@vercel/oidc";

const SKILLS_SH_BASE = "https://skills.sh";
const SKILLS_SH_V1 = `${SKILLS_SH_BASE}/api/v1`;

export type SkillsShV1Skill = {
  id: string;
  slug: string;
  name: string;
  source: string;
  installs: number;
  sourceType?: "github" | "well-known" | string;
  installUrl?: string | null;
  url?: string;
  isDuplicate?: boolean;
  installsYesterday?: number;
  change?: number;
};

export type SkillsShDetail = {
  id: string;
  source: string;
  slug: string;
  installs: number;
  hash?: string | null;
  files?: Array<{ path: string; contents: string }> | null;
};

export type SkillsShAudit = {
  id: string;
  source: string;
  slug: string;
  audits: Array<{
    provider: string;
    slug: string;
    status: "pass" | "warn" | "fail" | string;
    summary: string;
    auditedAt?: string;
    riskLevel?: string;
    categories?: string[];
  }>;
};

type SkillsShCacheEntry<T> = { expiresAt: number; value: T };
const cache = new Map<string, SkillsShCacheEntry<unknown>>();
const TTL_MS = 5 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const hit = cache.get(key);
  if (!hit || hit.expiresAt <= Date.now()) return null;
  return hit.value as T;
}

function setCached<T>(key: string, value: T, ttl = TTL_MS) {
  cache.set(key, { expiresAt: Date.now() + ttl, value });
}

async function resolveOidcToken(): Promise<string | null> {
  try {
    const token = await getVercelOidcToken();
    if (token) return token;
  } catch {
    // Local sem link / fora da Vercel — tenta env estática.
  }

  return process.env.VERCEL_OIDC_TOKEN?.trim() || null;
}

export async function skillsShHasOidc(): Promise<boolean> {
  return Boolean(await resolveOidcToken());
}

async function skillsShFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  const token = await resolveOidcToken();
  if (!token) {
    return { ok: false, status: 401, message: "VERCEL_OIDC_TOKEN ausente" };
  }

  try {
    const response = await fetch(`${SKILLS_SH_V1}${path}`, {
      ...init,
      signal: init?.signal ?? AbortSignal.timeout(10_000),
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
        "user-agent": "my-collec-skills/0.1",
        ...(init?.headers ?? {}),
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      let message = response.statusText;
      try {
        const err = (await response.json()) as { message?: string };
        if (err.message) message = err.message;
      } catch {
        // ignore
      }
      return { ok: false, status: response.status, message };
    }

    return { ok: true, data: (await response.json()) as T };
  } catch (error) {
    return {
      ok: false,
      status: 503,
      message: error instanceof Error ? error.message : "skills.sh indisponível",
    };
  }
}

export async function listSkillsShLeaderboard(options?: {
  view?: "all-time" | "trending" | "hot";
  page?: number;
  perPage?: number;
}): Promise<SkillsShV1Skill[]> {
  const view = options?.view ?? "all-time";
  const page = options?.page ?? 0;
  const perPage = Math.min(options?.perPage ?? 100, 200);
  const cacheKey = `lb:${view}:${page}:${perPage}`;
  const cached = getCached<SkillsShV1Skill[]>(cacheKey);
  if (cached) return cached;

  const result = await skillsShFetch<{
    data: SkillsShV1Skill[];
  }>(`/skills?view=${view}&page=${page}&per_page=${perPage}`);

  if (!result.ok) return [];
  const items = (result.data.data ?? []).filter((item) => !item.isDuplicate);
  setCached(cacheKey, items);
  return items;
}

export async function searchSkillsShV1(
  query: string,
  options?: { limit?: number; owner?: string },
): Promise<SkillsShV1Skill[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const limit = Math.min(options?.limit ?? 50, 200);
  const cacheKey = `search:${q.toLowerCase()}:${limit}:${options?.owner ?? ""}`;
  const cached = getCached<SkillsShV1Skill[]>(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    q,
    limit: String(limit),
  });
  if (options?.owner) params.set("owner", options.owner);

  const result = await skillsShFetch<{ data: SkillsShV1Skill[] }>(
    `/skills/search?${params.toString()}`,
  );
  if (!result.ok) return [];

  const items = (result.data.data ?? []).filter((item) => !item.isDuplicate);
  setCached(cacheKey, items);
  return items;
}

export async function listSkillsShCurated(): Promise<SkillsShV1Skill[]> {
  const cacheKey = "curated";
  const cached = getCached<SkillsShV1Skill[]>(cacheKey);
  if (cached) return cached;

  const result = await skillsShFetch<{
    data: Array<{ skills?: SkillsShV1Skill[] }>;
  }>("/skills/curated");
  if (!result.ok) return [];

  const items = (result.data.data ?? [])
    .flatMap((owner) => owner.skills ?? [])
    .filter((item) => !item.isDuplicate);
  setCached(cacheKey, items, 10 * 60 * 1000);
  return items;
}

export async function getSkillsShDetail(
  skillId: string,
): Promise<SkillsShDetail | null> {
  const id = skillId.replace(/^\/+|\/+$/g, "");
  if (!id) return null;

  const cacheKey = `detail:${id}`;
  const cached = getCached<SkillsShDetail>(cacheKey);
  if (cached) return cached;

  const result = await skillsShFetch<SkillsShDetail>(`/skills/${id}`);
  if (!result.ok) return null;
  setCached(cacheKey, result.data, 10 * 60 * 1000);
  return result.data;
}

export async function getSkillsShAudit(
  skillId: string,
): Promise<SkillsShAudit | null> {
  const id = skillId.replace(/^\/+|\/+$/g, "");
  if (!id) return null;

  const cacheKey = `audit:${id}`;
  const cached = getCached<SkillsShAudit>(cacheKey);
  if (cached) return cached;

  const result = await skillsShFetch<SkillsShAudit>(`/skills/audit/${id}`);
  if (!result.ok) return null;
  setCached(cacheKey, result.data, 10 * 60 * 1000);
  return result.data;
}

/** Endpoint legado sem OIDC — fallback para dev local. */
export async function searchSkillsShLegacy(
  query: string,
  limit = 20,
): Promise<
  Array<{
    id: string;
    skillId: string;
    name: string;
    installs?: number;
    source: string;
  }>
> {
  const url = new URL(`${SKILLS_SH_BASE}/api/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(Math.min(limit, 30)));

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: 3600 },
      headers: {
        accept: "application/json",
        "user-agent": "my-collec-skills/0.1",
      },
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as {
      skills?: Array<{
        id: string;
        skillId: string;
        name: string;
        installs?: number;
        source: string;
      }>;
    };
    return payload.skills ?? [];
  } catch {
    return [];
  }
}

export function extractSkillSummary(markdown: string | undefined): string | null {
  if (!markdown?.trim()) return null;

  const withoutFrontmatter = markdown.replace(/^---[\s\S]*?---\s*/, "");
  const paragraphs = withoutFrontmatter
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .replace(/^#+\s+/gm, "")
        .replace(/^[-*]\s+/gm, "• ")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[*_`]/g, "")
        .trim(),
    )
    .filter(Boolean);

  const first = paragraphs[0];
  if (!first) return null;
  return first.length > 480 ? `${first.slice(0, 477)}…` : first;
}

export function buildInstallCommand(skill: {
  source: string;
  slug?: string;
  skillId?: string;
  installUrl?: string | null;
}) {
  const skillName = skill.slug || skill.skillId;
  const target =
    skill.installUrl ??
    (skill.source.includes(".") && !skill.source.includes("/")
      ? `https://${skill.source}`
      : `https://github.com/${skill.source}`);

  if (skillName) {
    return `npx skills add ${target} --skill ${skillName}`;
  }
  return `npx skills add ${target}`;
}
