import {
  buildInstallCommand,
  listSkillsShCurated,
  listSkillsShLeaderboard,
  searchSkillsShLegacy,
  searchSkillsShV1,
  skillsShHasOidc,
  type SkillsShV1Skill,
} from "@/lib/skills-sh";

export type CatalogItemType = "skill" | "agent" | "mcp" | "doc";

export type CatalogItem = {
  type: CatalogItemType;
  source: string;
  externalId: string;
  name: string;
  description: string;
  url?: string;
  metadata?: Record<string, unknown>;
};

export const builtInCatalog: CatalogItem[] = [
  // Skills
  {
    type: "skill",
    source: "mcs-catalog",
    externalId: "nextjs-app-router",
    name: "Next.js App Router",
    description: "Padrões modernos para rotas, Server Components e APIs.",
    metadata: { tags: ["nextjs", "react", "frontend"] },
  },
  {
    type: "skill",
    source: "mcs-catalog",
    externalId: "prisma-schema-conventions",
    name: "Prisma Schema Conventions",
    description: "Relações, índices, constraints e migrations seguras.",
    metadata: { tags: ["prisma", "database"] },
  },
  {
    type: "skill",
    source: "mcs-catalog",
    externalId: "shadcn-ui-patterns",
    name: "shadcn/ui Patterns",
    description: "Composição de componentes, temas e formulários com shadcn/ui.",
    metadata: { tags: ["ui", "shadcn", "tailwind"] },
  },
  {
    type: "skill",
    source: "mcs-catalog",
    externalId: "tailwind-layout",
    name: "Tailwind Layout Systems",
    description: "Grids, spacing, responsividade e tokens de design com Tailwind.",
    metadata: { tags: ["ui", "tailwind"] },
  },
  {
    type: "skill",
    source: "mcs-catalog",
    externalId: "authjs-oauth",
    name: "Auth.js OAuth Flows",
    description: "Login GitHub/GitLab, sessões JWT e callbacks seguros.",
    metadata: { tags: ["auth", "oauth", "security"] },
  },
  {
    type: "skill",
    source: "mcs-catalog",
    externalId: "api-route-design",
    name: "API Route Design",
    description: "Contratos REST, validação Zod e erros consistentes em App Router.",
    metadata: { tags: ["api", "nextjs", "zod"] },
  },
  {
    type: "skill",
    source: "mcs-catalog",
    externalId: "postgres-indexing",
    name: "PostgreSQL Indexing",
    description: "Índices, constraints e consultas eficientes no Postgres.",
    metadata: { tags: ["database", "postgres"] },
  },
  {
    type: "skill",
    source: "mcs-catalog",
    externalId: "a11y-checklists",
    name: "Accessibility Checklists",
    description: "WCAG prático: foco, contraste, labels e navegação por teclado.",
    metadata: { tags: ["a11y", "ux"] },
  },
  {
    type: "skill",
    source: "mcs-catalog",
    externalId: "secure-secrets",
    name: "Secrets & Env Hygiene",
    description: "Gestão de .env, secrets e prevenção de vazamentos em repositórios.",
    metadata: { tags: ["security", "devops"] },
  },
  {
    type: "skill",
    source: "mcs-catalog",
    externalId: "cursor-skills-authoring",
    name: "Cursor Skills Authoring",
    description: "Como escrever SKILL.md claros, acionáveis e reutilizáveis no Cursor.",
    metadata: { tags: ["cursor", "skills"] },
  },

  // Agents
  {
    type: "agent",
    source: "mcs-catalog",
    externalId: "code-reviewer",
    name: "Code Reviewer",
    description: "Agente focado em qualidade, regressões e testes.",
    metadata: { tags: ["review", "quality"] },
  },
  {
    type: "agent",
    source: "mcs-catalog",
    externalId: "security-reviewer",
    name: "Security Reviewer",
    description: "Agente de revisão OWASP, auth e gestão de segredos.",
    metadata: { tags: ["security", "owasp"] },
  },
  {
    type: "agent",
    source: "mcs-catalog",
    externalId: "prisma-migrator",
    name: "Prisma Migrator",
    description: "Planeja e revisa migrations Prisma com impacto mínimo.",
    metadata: { tags: ["prisma", "database"] },
  },
  {
    type: "agent",
    source: "mcs-catalog",
    externalId: "ux-copy-editor",
    name: "UX Copy Editor",
    description: "Melhora microcopy, empty states e CTAs da interface.",
    metadata: { tags: ["ux", "copy"] },
  },
  {
    type: "agent",
    source: "mcs-catalog",
    externalId: "test-strategist",
    name: "Test Strategist",
    description: "Sugere cobertura unitária, integração e smoke tests priorizados.",
    metadata: { tags: ["testing", "quality"] },
  },
  {
    type: "agent",
    source: "mcs-catalog",
    externalId: "api-contract-guardian",
    name: "API Contract Guardian",
    description: "Valida breaking changes e consistência de payloads de API.",
    metadata: { tags: ["api", "contracts"] },
  },

  // Featured MCPs (também enriquecidos via MCP Registry quando online)
  {
    type: "mcp",
    source: "mcp-registry",
    externalId: "io.github.modelcontextprotocol/server-filesystem",
    name: "Filesystem MCP",
    description: "Acesso controlado ao filesystem local via Model Context Protocol.",
    url: "https://github.com/modelcontextprotocol/servers",
    metadata: { tags: ["filesystem", "local"] },
  },
  {
    type: "mcp",
    source: "mcp-registry",
    externalId: "io.github.modelcontextprotocol/server-github",
    name: "GitHub MCP",
    description: "Issues, PRs e repositórios GitHub no contexto do agente.",
    url: "https://github.com/modelcontextprotocol/servers",
    metadata: { tags: ["github", "git"] },
  },
  {
    type: "mcp",
    source: "mcp-registry",
    externalId: "io.github.modelcontextprotocol/server-postgres",
    name: "PostgreSQL MCP",
    description: "Consulta e exploração de bancos PostgreSQL via MCP.",
    url: "https://github.com/modelcontextprotocol/servers",
    metadata: { tags: ["postgres", "database"] },
  },
  {
    type: "mcp",
    source: "mcp-registry",
    externalId: "io.github.modelcontextprotocol/server-memory",
    name: "Memory MCP",
    description: "Memória persistente de conhecimento para sessões do agente.",
    url: "https://github.com/modelcontextprotocol/servers",
    metadata: { tags: ["memory", "context"] },
  },
  {
    type: "mcp",
    source: "mcp-registry",
    externalId: "io.github.modelcontextprotocol/server-brave-search",
    name: "Brave Search MCP",
    description: "Busca web via Brave Search para research no agente.",
    url: "https://github.com/modelcontextprotocol/servers",
    metadata: { tags: ["search", "web"] },
  },
  {
    type: "mcp",
    source: "mcs-catalog",
    externalId: "vercel-mcp",
    name: "Vercel MCP",
    description: "Deploys, projetos e logs Vercel no fluxo do agente.",
    url: "https://vercel.com/docs",
    metadata: { tags: ["vercel", "deploy"] },
  },
  {
    type: "mcp",
    source: "mcs-catalog",
    externalId: "prisma-mcp",
    name: "Prisma MCP",
    description: "Operações e introspecção Prisma assistidas por MCP.",
    url: "https://www.prisma.io/docs",
    metadata: { tags: ["prisma", "database"] },
  },
  {
    type: "mcp",
    source: "mcs-catalog",
    externalId: "stripe-mcp",
    name: "Stripe MCP",
    description: "Consulta de customers, payments e webhooks Stripe.",
    url: "https://docs.stripe.com",
    metadata: { tags: ["payments", "stripe"] },
  },

  // Docs
  {
    type: "doc",
    source: "official",
    externalId: "nextjs-docs",
    name: "Next.js Documentation",
    description: "Documentação oficial do Next.js.",
    url: "https://nextjs.org/docs",
    metadata: { tags: ["nextjs", "docs"] },
  },
  {
    type: "doc",
    source: "official",
    externalId: "prisma-docs",
    name: "Prisma Documentation",
    description: "Documentação oficial do Prisma ORM.",
    url: "https://www.prisma.io/docs",
    metadata: { tags: ["prisma", "docs"] },
  },
  {
    type: "doc",
    source: "official",
    externalId: "authjs-docs",
    name: "Auth.js Documentation",
    description: "Guia oficial de autenticação Auth.js / NextAuth.",
    url: "https://authjs.dev",
    metadata: { tags: ["auth", "docs"] },
  },
  {
    type: "doc",
    source: "official",
    externalId: "shadcn-docs",
    name: "shadcn/ui Documentation",
    description: "Componentes, CLI e padrões do shadcn/ui.",
    url: "https://ui.shadcn.com/docs",
    metadata: { tags: ["ui", "docs"] },
  },
  {
    type: "doc",
    source: "official",
    externalId: "mcp-spec",
    name: "Model Context Protocol Spec",
    description: "Especificação e conceitos do Model Context Protocol.",
    url: "https://modelcontextprotocol.io",
    metadata: { tags: ["mcp", "docs"] },
  },
  {
    type: "doc",
    source: "official",
    externalId: "tailwind-docs",
    name: "Tailwind CSS Documentation",
    description: "Utilitários, temas e configuração do Tailwind CSS.",
    url: "https://tailwindcss.com/docs",
    metadata: { tags: ["tailwind", "docs"] },
  },
];

type RegistryServer = {
  server?: {
    name?: string;
    description?: string;
    repository?: { url?: string };
    packages?: unknown[];
  };
};

const SKILLS_SH_SEED_QUERIES = [
  "react",
  "nextjs",
  "typescript",
  "security",
] as const;

function humanizeSkillName(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function matchesQuery(item: CatalogItem, normalized: string) {
  if (!normalized) return true;
  const haystack = [
    item.name,
    item.description,
    item.externalId,
    item.source,
    ...((item.metadata?.tags as string[] | undefined) ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(normalized);
}

function dedupeItems(items: CatalogItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.type}:${item.source}:${item.externalId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mapSkillsShV1(skill: SkillsShV1Skill): CatalogItem {
  const installs = skill.installs ?? 0;
  const skillId = skill.slug;
  return {
    type: "skill",
    source: "skills.sh",
    externalId: skill.id,
    name: humanizeSkillName(skill.name || skillId),
    description: `Skill de ${skill.source} · ${installs.toLocaleString("en-US")} installs no skills.sh`,
    url: skill.url ?? `https://skills.sh/${skill.id}`,
    metadata: {
      tags: ["skills.sh", skill.source.split("/")[0] ?? "community"],
      installs,
      skillId,
      repo: skill.source,
      sourceType: skill.sourceType,
      installCommand: buildInstallCommand({
        source: skill.source,
        slug: skillId,
        installUrl: skill.installUrl,
      }),
      api: "v1",
    },
  };
}

function mapSkillsShLegacy(skill: {
  id: string;
  skillId: string;
  name: string;
  installs?: number;
  source: string;
}): CatalogItem {
  const installs = skill.installs ?? 0;
  return {
    type: "skill",
    source: "skills.sh",
    externalId: skill.id,
    name: humanizeSkillName(skill.name || skill.skillId),
    description: `Skill de ${skill.source} · ${installs.toLocaleString("en-US")} installs no skills.sh`,
    url: `https://skills.sh/${skill.id}`,
    metadata: {
      tags: ["skills.sh", skill.source.split("/")[0] ?? "community"],
      installs,
      skillId: skill.skillId,
      repo: skill.source,
      installCommand: buildInstallCommand({
        source: skill.source,
        skillId: skill.skillId,
      }),
      api: "legacy",
    },
  };
}

async function fetchSkillsShV1(query: string): Promise<CatalogItem[]> {
  if (query.trim()) {
    const results = await searchSkillsShV1(query.trim(), { limit: 50 });
    return results.map(mapSkillsShV1);
  }

  const [leaderboard, curated] = await Promise.all([
    listSkillsShLeaderboard({ view: "all-time", perPage: 80 }),
    listSkillsShCurated(),
  ]);

  return dedupeItems([...leaderboard, ...curated].map(mapSkillsShV1)).sort(
    (a, b) =>
      Number(b.metadata?.installs ?? 0) - Number(a.metadata?.installs ?? 0),
  );
}

async function fetchSkillsShLegacy(query: string): Promise<CatalogItem[]> {
  if (query.trim()) {
    const results = await searchSkillsShLegacy(query.trim(), 30);
    return results.map(mapSkillsShLegacy);
  }

  const collected: CatalogItem[] = [];
  for (const seed of SKILLS_SH_SEED_QUERIES) {
    const batch = await searchSkillsShLegacy(seed, 15);
    collected.push(...batch.map(mapSkillsShLegacy));
    if (collected.length >= 60) break;
  }

  return dedupeItems(collected).sort(
    (a, b) =>
      Number(b.metadata?.installs ?? 0) - Number(a.metadata?.installs ?? 0),
  );
}

async function fetchSkillsSh(query: string): Promise<CatalogItem[]> {
  if (await skillsShHasOidc()) {
    const v1 = await fetchSkillsShV1(query);
    if (v1.length > 0) return v1;
  }
  return fetchSkillsShLegacy(query);
}

async function fetchMcpRegistry(query: string, limit = 40): Promise<CatalogItem[]> {
  try {
    const registryUrl = new URL(
      "https://registry.modelcontextprotocol.io/v0.1/servers",
    );
    if (query) registryUrl.searchParams.set("search", query);
    registryUrl.searchParams.set("version", "latest");
    registryUrl.searchParams.set("limit", String(limit));
    const response = await fetch(registryUrl, {
      signal: AbortSignal.timeout(5_000),
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];

    const payload = (await response.json()) as { servers?: RegistryServer[] };
    return (payload.servers ?? []).flatMap(({ server }) =>
      server?.name
        ? [
            {
              type: "mcp" as const,
              source: "mcp-registry",
              externalId: server.name,
              name: server.name,
              description: server.description ?? "Servidor do MCP Registry.",
              url: server.repository?.url,
              metadata: {
                packages: server.packages ?? [],
                tags: ["mcp-registry"],
              },
            },
          ]
        : [],
    );
  } catch {
    return [];
  }
}

export async function searchCatalog(options?: {
  q?: string;
  type?: string | null;
  includeRegistry?: boolean;
  take?: number;
}): Promise<{ items: CatalogItem[]; source: string }> {
  const query = options?.q?.trim() ?? "";
  const normalized = query.toLowerCase();
  const type = options?.type;
  const includeRegistry = options?.includeRegistry ?? true;

  let items = builtInCatalog.filter(
    (item) =>
      (!type || type === "all" || item.type === type) &&
      matchesQuery(item, normalized),
  );

  const sources = new Set<string>(["mcs-catalog"]);

  const wantsMcp = !type || type === "all" || type === "mcp";
  if (includeRegistry && wantsMcp) {
    const registryItems = await fetchMcpRegistry(query || "server", 40);
    const filteredRegistry = registryItems.filter((item) =>
      matchesQuery(item, normalized),
    );
    items = dedupeItems([...items, ...filteredRegistry]);
    if (filteredRegistry.length > 0) sources.add("mcp-registry");
  }

  const wantsSkill = !type || type === "all" || type === "skill";
  if (includeRegistry && wantsSkill) {
    const skillsShItems = await fetchSkillsSh(query);
    // A busca do skills.sh já é fuzzy; não refiltrar pelo texto local.
    items = dedupeItems([...items, ...skillsShItems]);
    if (skillsShItems.length > 0) {
      const usedV1 = skillsShItems.some((item) => item.metadata?.api === "v1");
      sources.add(usedV1 ? "skills.sh-v1" : "skills.sh-legacy");
    }
  }

  if (options?.take && options.take > 0) {
    items = items.slice(0, options.take);
  }

  return {
    items,
    source: [...sources].join("+"),
  };
}

export function catalogTypeLabel(type: CatalogItemType) {
  switch (type) {
    case "skill":
      return "Skill";
    case "agent":
      return "Agent";
    case "mcp":
      return "MCP";
    case "doc":
      return "Doc";
  }
}
