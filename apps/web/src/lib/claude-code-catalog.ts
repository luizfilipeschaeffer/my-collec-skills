/**
 * Fetch Claude Code skills from official Anthropic marketplaces (GitHub raw).
 */

export type ClaudeCatalogSkill = {
  type: "skill";
  source: "anthropic-agent-skills" | "claude-plugins-official";
  externalId: string;
  name: string;
  description: string;
  url?: string;
  metadata: Record<string, unknown>;
};

type MarketplacePlugin = {
  name?: string;
  description?: string;
  category?: string;
  homepage?: string;
  author?: { name?: string; email?: string };
  strict?: boolean;
  skills?: string[];
  source?:
    | string
    | {
        source?: string;
        url?: string;
        path?: string;
        ref?: string;
        sha?: string;
      };
};

type MarketplaceJson = {
  name?: string;
  plugins?: MarketplacePlugin[];
};

const AGENT_SKILLS_MARKETPLACE =
  "https://raw.githubusercontent.com/anthropics/skills/main/.claude-plugin/marketplace.json";
const OFFICIAL_MARKETPLACE =
  "https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/.claude-plugin/marketplace.json";

const RAW_AGENT_SKILLS =
  "https://raw.githubusercontent.com/anthropics/skills/main";
const RAW_OFFICIAL =
  "https://raw.githubusercontent.com/anthropics/claude-plugins-official/main";

const HTML_AGENT_SKILLS = "https://github.com/anthropics/skills/tree/main";
const HTML_OFFICIAL =
  "https://github.com/anthropics/claude-plugins-official/tree/main";

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      headers: {
        accept: "application/json",
        "user-agent": "my-collec-skills/0.1",
      },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(12_000),
      headers: {
        accept: "text/plain,text/markdown,*/*",
        "user-agent": "my-collec-skills/0.1",
      },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function joinUrl(base: string, ...parts: string[]) {
  const trimmed = parts
    .map((part) => part.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean);
  return `${base.replace(/\/+$/, "")}/${trimmed.join("/")}`;
}

function parseFrontmatter(markdown: string): {
  name?: string;
  description?: string;
  body: string;
} {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { body: markdown.trim() };

  const yaml = match[1] ?? "";
  const body = (match[2] ?? "").trim();
  const name = yaml.match(/^name:\s*["']?(.+?)["']?\s*$/m)?.[1]?.trim();
  const descriptionLine = yaml.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  const description = descriptionLine
    ?.replace(/^["']|["']$/g, "")
    .replace(/\s+/g, " ");

  return { name, description, body: body || markdown.trim() };
}

function skillSlugFromPath(skillPath: string): string {
  return (
    skillPath
      .replace(/^\.\//, "")
      .replace(/\/+$/, "")
      .split("/")
      .filter(Boolean)
      .pop() ?? skillPath
  );
}

function githubRepoFromUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(
    /github\.com[/:]([^/]+)\/([^/.]+?)(?:\.git)?(?:\/|$)/i,
  );
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

function resolveSkillMdUrl(
  plugin: MarketplacePlugin,
  skillPath: string,
  marketplaceRootRaw: string,
): string | null {
  const normalized = skillPath.replace(/^\.\//, "").replace(/\/+$/, "");
  const skillMdPath = `${normalized}/SKILL.md`;
  const source = plugin.source;

  if (typeof source === "string") {
    const local = source.replace(/^\.\//, "").replace(/\/+$/, "");
    if (!local || local === ".") {
      return joinUrl(marketplaceRootRaw, skillMdPath);
    }
    return joinUrl(marketplaceRootRaw, local, skillMdPath);
  }

  if (source && typeof source === "object" && source.url) {
    const repo = githubRepoFromUrl(source.url);
    if (!repo) return null;
    const ref = source.ref || source.sha || "main";
    const basePath = (source.path ?? "").replace(/^\.\//, "").replace(/\/+$/, "");
    return joinUrl(
      `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${ref}`,
      basePath,
      skillMdPath,
    );
  }

  return null;
}

function homepageForPlugin(
  plugin: MarketplacePlugin,
  skillPath: string,
  htmlRoot: string,
): string | undefined {
  if (plugin.homepage) return plugin.homepage;
  const normalized = skillPath.replace(/^\.\//, "");
  const source = plugin.source;

  if (typeof source === "string") {
    const local = source.replace(/^\.\//, "").replace(/\/+$/, "");
    if (!local || local === ".") {
      return joinUrl(htmlRoot, normalized);
    }
    return joinUrl(htmlRoot, local, normalized);
  }

  if (source && typeof source === "object" && source.url) {
    const repo = githubRepoFromUrl(source.url);
    if (!repo) return source.url;
    const ref = source.ref || "main";
    const path = [source.path?.replace(/^\.\//, ""), normalized]
      .filter(Boolean)
      .join("/");
    return path
      ? `https://github.com/${repo.owner}/${repo.repo}/tree/${ref}/${path}`
      : `https://github.com/${repo.owner}/${repo.repo}`;
  }

  return undefined;
}

async function mapPluginSkills(
  plugin: MarketplacePlugin,
  marketplaceSource: ClaudeCatalogSkill["source"],
  marketplaceRootRaw: string,
  htmlRoot: string,
  options?: { delayMs?: number },
): Promise<ClaudeCatalogSkill[]> {
  const pluginName = plugin.name?.trim();
  if (
    !pluginName ||
    !Array.isArray(plugin.skills) ||
    plugin.skills.length === 0
  ) {
    return [];
  }

  const out: ClaudeCatalogSkill[] = [];
  for (const skillPath of plugin.skills) {
    if (typeof skillPath !== "string" || !skillPath.trim()) continue;
    const url = resolveSkillMdUrl(plugin, skillPath, marketplaceRootRaw);
    if (!url) continue;

    const markdown = await fetchText(url);
    if (options?.delayMs) await sleep(options.delayMs);

    const slug = skillSlugFromPath(skillPath);
    const externalId = `${pluginName}/${slug}`;
    const parsed = markdown ? parseFrontmatter(markdown) : { body: "" };

    out.push({
      type: "skill",
      source: marketplaceSource,
      externalId,
      name: parsed.name || slug,
      description:
        parsed.description ||
        plugin.description ||
        `Claude Code skill from ${pluginName}`,
      url: homepageForPlugin(plugin, skillPath, htmlRoot),
      metadata: {
        ...(parsed.body || markdown
          ? { content: parsed.body || markdown }
          : {}),
        agentTargets: ["claude-code"],
        plugin: pluginName,
        category: plugin.category,
        author: plugin.author?.name,
        skillPath,
        tags: ["claude-code", marketplaceSource, plugin.category].filter(
          Boolean,
        ),
      },
    });
  }
  return out;
}

/** Full sync of anthropics/skills (~17 skills). */
export async function fetchAnthropicAgentSkills(): Promise<
  ClaudeCatalogSkill[]
> {
  const marketplace = await fetchJson<MarketplaceJson>(AGENT_SKILLS_MARKETPLACE);
  if (!marketplace?.plugins?.length) return [];

  const items: ClaudeCatalogSkill[] = [];
  for (const plugin of marketplace.plugins) {
    items.push(
      ...(await mapPluginSkills(
        plugin,
        "anthropic-agent-skills",
        RAW_AGENT_SKILLS,
        HTML_AGENT_SKILLS,
        { delayMs: 80 },
      )),
    );
  }
  return items;
}

/**
 * Subset of claude-plugins-official: plugins with explicit skills[].
 * Capped for cron timeout safety.
 */
export async function fetchClaudePluginsOfficialSkills(): Promise<
  ClaudeCatalogSkill[]
> {
  const marketplace = await fetchJson<MarketplaceJson>(OFFICIAL_MARKETPLACE);
  if (!marketplace?.plugins?.length) return [];

  const candidates = marketplace.plugins.filter(
    (plugin) => Array.isArray(plugin.skills) && plugin.skills.length > 0,
  );

  const items: ClaudeCatalogSkill[] = [];
  const limited = candidates.slice(0, 40);
  for (const plugin of limited) {
    items.push(
      ...(await mapPluginSkills(
        plugin,
        "claude-plugins-official",
        RAW_OFFICIAL,
        HTML_OFFICIAL,
        { delayMs: 100 },
      )),
    );
  }
  return items;
}

export async function fetchClaudeCodeCatalogSkills(): Promise<{
  items: ClaudeCatalogSkill[];
  errors: string[];
}> {
  const errors: string[] = [];
  const items: ClaudeCatalogSkill[] = [];

  try {
    items.push(...(await fetchAnthropicAgentSkills()));
  } catch (error) {
    errors.push(
      `anthropic-agent-skills: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  try {
    items.push(...(await fetchClaudePluginsOfficialSkills()));
  } catch (error) {
    errors.push(
      `claude-plugins-official: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return { items, errors };
}
