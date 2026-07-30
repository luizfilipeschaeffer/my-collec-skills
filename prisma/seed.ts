import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { CollectionType, IdeTarget, PrismaClient } from "../generated/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL não está definida.");

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

/** Taxonomia alinhada aos topics do skills.sh + extras MCS (MCP/docs/a11y/security). */
const taxonomy: Array<{
  slug: string;
  name: string;
  description: string;
  subcategories: Array<{ slug: string; name: string; description?: string }>;
}> = [
  {
    slug: "frontend-react",
    name: "Frontend & React",
    description:
      "Performance, padrões de componentes e ecossistema React para produção.",
    subcategories: [
      { slug: "performance", name: "Performance" },
      { slug: "composition", name: "Composition" },
      { slug: "typescript", name: "TypeScript" },
      { slug: "tailwind", name: "Tailwind" },
      { slug: "shadcn", name: "shadcn/ui" },
    ],
  },
  {
    slug: "nextjs",
    name: "Next.js",
    description:
      "App Router, Server Components, caching e padrões de deploy Vercel.",
    subcategories: [
      { slug: "app-router", name: "App Router" },
      { slug: "server-components", name: "Server Components" },
      { slug: "caching", name: "Caching" },
      { slug: "deployment", name: "Deployment" },
    ],
  },
  {
    slug: "design-ui",
    name: "Design & UI",
    description:
      "Interfaces polidas — critique, design tokens e frameworks de UI.",
    subcategories: [
      { slug: "critique", name: "Critique" },
      { slug: "design-tokens", name: "Design tokens" },
      { slug: "components", name: "Components" },
      { slug: "animation", name: "Animation" },
    ],
  },
  {
    slug: "mobile",
    name: "Mobile",
    description:
      "Expo, React Native e convenções nativas para iOS e Android.",
    subcategories: [
      { slug: "expo", name: "Expo" },
      { slug: "react-native", name: "React Native" },
      { slug: "ios", name: "iOS" },
      { slug: "android", name: "Android" },
    ],
  },
  {
    slug: "agent-workflows",
    name: "Agent workflows",
    description:
      "Como agents operam — planejar, debugar, despachar subagents e loops.",
    subcategories: [
      { slug: "planning", name: "Planning" },
      { slug: "debugging", name: "Debugging" },
      { slug: "subagents", name: "Subagents" },
      { slug: "autonomous-loops", name: "Autonomous loops" },
      { slug: "skill-authoring", name: "Skill authoring" },
    ],
  },
  {
    slug: "databases",
    name: "Databases",
    description:
      "Postgres, Supabase, Firebase, Neon, Convex — schemas, queries e migrations.",
    subcategories: [
      { slug: "postgresql", name: "PostgreSQL" },
      { slug: "supabase", name: "Supabase" },
      { slug: "prisma", name: "Prisma" },
      { slug: "drizzle", name: "Drizzle" },
      { slug: "migrations", name: "Migrations" },
      { slug: "neon", name: "Neon" },
      { slug: "convex", name: "Convex" },
    ],
  },
  {
    slug: "testing",
    name: "Testing",
    description:
      "TDD, Playwright e passes de verificação — testes significativos.",
    subcategories: [
      { slug: "tdd", name: "TDD" },
      { slug: "playwright", name: "Playwright" },
      { slug: "e2e", name: "E2E" },
      { slug: "unit", name: "Unit" },
    ],
  },
  {
    slug: "marketing",
    name: "Marketing",
    description: "SEO, copywriting, CRO e growth no contexto do agente.",
    subcategories: [
      { slug: "seo", name: "SEO" },
      { slug: "copywriting", name: "Copywriting" },
      { slug: "cro", name: "CRO" },
      { slug: "growth", name: "Growth" },
    ],
  },
  {
    slug: "accessibility",
    name: "Accessibility",
    description: "WCAG, ARIA e testes de acessibilidade.",
    subcategories: [
      { slug: "wcag", name: "WCAG" },
      { slug: "aria", name: "ARIA" },
      { slug: "testing", name: "Testing" },
    ],
  },
  {
    slug: "cybersecurity",
    name: "Cybersecurity",
    description: "OWASP, auth, secrets e auditorias de segurança.",
    subcategories: [
      { slug: "owasp", name: "OWASP" },
      { slug: "auth", name: "Auth" },
      { slug: "secrets", name: "Secrets" },
      { slug: "audits", name: "Audits" },
    ],
  },
  {
    slug: "mcp-integrations",
    name: "MCP Integrations",
    description:
      "Servidores MCP e conectores de ferramentas (filesystem, git, DB, search).",
    subcategories: [
      { slug: "filesystem", name: "Filesystem" },
      { slug: "github", name: "GitHub" },
      { slug: "database", name: "Database" },
      { slug: "search", name: "Search" },
      { slug: "deploy", name: "Deploy" },
    ],
  },
  {
    slug: "documentation",
    name: "Documentation",
    description: "Documentação oficial e specs para anexar ao profile.",
    subcategories: [
      { slug: "frameworks", name: "Frameworks" },
      { slug: "orm", name: "ORM" },
      { slug: "auth", name: "Auth" },
      { slug: "protocols", name: "Protocols" },
    ],
  },
];

/** Remapeia coleções da taxonomia antiga (ui/ux/database) para a nova. */
const categoryRemaps: Array<{
  fromCategory: string;
  toCategory: string;
  fromSub: string;
  toSub: string;
}> = [
  {
    fromCategory: "ui",
    toCategory: "design-ui",
    fromSub: "components",
    toSub: "components",
  },
  {
    fromCategory: "ui",
    toCategory: "design-ui",
    fromSub: "design-system",
    toSub: "design-tokens",
  },
  {
    fromCategory: "ui",
    toCategory: "design-ui",
    fromSub: "animation",
    toSub: "animation",
  },
  {
    fromCategory: "ux",
    toCategory: "marketing",
    fromSub: "copy",
    toSub: "copywriting",
  },
  {
    fromCategory: "ux",
    toCategory: "agent-workflows",
    fromSub: "flows",
    toSub: "planning",
  },
  {
    fromCategory: "ux",
    toCategory: "testing",
    fromSub: "research",
    toSub: "unit",
  },
  {
    fromCategory: "database",
    toCategory: "databases",
    fromSub: "postgresql",
    toSub: "postgresql",
  },
  {
    fromCategory: "database",
    toCategory: "databases",
    fromSub: "prisma",
    toSub: "prisma",
  },
  {
    fromCategory: "database",
    toCategory: "databases",
    fromSub: "migrations",
    toSub: "migrations",
  },
];

async function main() {
  for (const entry of taxonomy) {
    const category = await db.category.upsert({
      where: { slug: entry.slug },
      update: { name: entry.name, description: entry.description },
      create: {
        slug: entry.slug,
        name: entry.name,
        description: entry.description,
      },
    });

    for (const sub of entry.subcategories) {
      await db.subCategory.upsert({
        where: {
          categoryId_slug: {
            categoryId: category.id,
            slug: sub.slug,
          },
        },
        update: {
          name: sub.name,
          description: sub.description ?? null,
        },
        create: {
          categoryId: category.id,
          slug: sub.slug,
          name: sub.name,
          description: sub.description,
        },
      });
    }
  }

  for (const remap of categoryRemaps) {
    const fromCat = await db.category.findUnique({
      where: { slug: remap.fromCategory },
    });
    const toCat = await db.category.findUnique({
      where: { slug: remap.toCategory },
    });
    if (!fromCat || !toCat) continue;

    const fromSub = await db.subCategory.findUnique({
      where: {
        categoryId_slug: {
          categoryId: fromCat.id,
          slug: remap.fromSub,
        },
      },
    });
    const toSub = await db.subCategory.findUnique({
      where: {
        categoryId_slug: {
          categoryId: toCat.id,
          slug: remap.toSub,
        },
      },
    });
    if (!fromSub || !toSub) continue;

    await db.collection.updateMany({
      where: {
        categoryId: fromCat.id,
        subcategoryId: fromSub.id,
      },
      data: {
        categoryId: toCat.id,
        subcategoryId: toSub.id,
      },
    });
  }

  const user = await db.user.upsert({
    where: { username: "demo" },
    update: {},
    create: {
      username: "demo",
      name: "MCS Demo",
      email: "demo@mycollecskills.local",
    },
  });

  const category = await db.category.findUniqueOrThrow({
    where: { slug: "databases" },
  });
  const subcategory = await db.subCategory.findUniqueOrThrow({
    where: {
      categoryId_slug: { categoryId: category.id, slug: "prisma" },
    },
  });

  let collection = await db.collection.findFirst({
    where: { ownerId: user.id, name: "Prisma Essentials" },
  });
  collection ??= await db.collection.create({
    data: {
      ownerId: user.id,
      categoryId: category.id,
      subcategoryId: subcategory.id,
      name: "Prisma Essentials",
      description: "Skills essenciais para projetos com Prisma e PostgreSQL.",
      type: CollectionType.skill,
      isPublic: true,
    },
  });

  await db.collection.update({
    where: { id: collection.id },
    data: {
      categoryId: category.id,
      subcategoryId: subcategory.id,
    },
  });

  await db.collectionItem.upsert({
    where: {
      collectionId_source_externalId: {
        collectionId: collection.id,
        source: "mcs-catalog",
        externalId: "prisma-schema-conventions",
      },
    },
    update: {},
    create: {
      collectionId: collection.id,
      source: "mcs-catalog",
      externalId: "prisma-schema-conventions",
      name: "Prisma Schema Conventions",
      description: "Convenções de schema e relações Prisma.",
      metadata: {
        content:
          "# Prisma Schema Conventions\n\nUse relações bidirecionais, IDs cuid e timestamps.",
      },
    },
  });

  const profile = await db.profile.upsert({
    where: { ownerId_slug: { ownerId: user.id, slug: "nextjs-prisma" } },
    update: { isPublic: true },
    create: {
      ownerId: user.id,
      slug: "nextjs-prisma",
      name: "Next.js + Prisma",
      description: "Profile de demonstração para Next.js, Prisma e PostgreSQL.",
      isPublic: true,
    },
  });

  await db.profileCollection.upsert({
    where: {
      profileId_collectionId: {
        profileId: profile.id,
        collectionId: collection.id,
      },
    },
    update: {},
    create: { profileId: profile.id, collectionId: collection.id },
  });

  await db.profileDoc.upsert({
    where: {
      profileId_source_externalId: {
        profileId: profile.id,
        source: "official",
        externalId: "prisma-docs",
      },
    },
    update: {},
    create: {
      profileId: profile.id,
      source: "official",
      externalId: "prisma-docs",
      name: "Prisma Documentation",
      url: "https://www.prisma.io/docs",
    },
  });

  await db.profileExtension.upsert({
    where: {
      profileId_ide_extensionId: {
        profileId: profile.id,
        ide: IdeTarget.cursor,
        extensionId: "Prisma.prisma",
      },
    },
    update: {},
    create: {
      profileId: profile.id,
      ide: IdeTarget.cursor,
      extensionId: "Prisma.prisma",
      name: "Prisma",
    },
  });

  const securityCategory = await db.category.findUniqueOrThrow({
    where: { slug: "cybersecurity" },
  });
  const owaspSub = await db.subCategory.findUniqueOrThrow({
    where: {
      categoryId_slug: {
        categoryId: securityCategory.id,
        slug: "owasp",
      },
    },
  });
  const designUiCategory = await db.category.findUniqueOrThrow({
    where: { slug: "design-ui" },
  });
  const componentsSub = await db.subCategory.findUniqueOrThrow({
    where: {
      categoryId_slug: {
        categoryId: designUiCategory.id,
        slug: "components",
      },
    },
  });
  const mcpCategory = await db.category.findUniqueOrThrow({
    where: { slug: "mcp-integrations" },
  });
  const mcpFsSub = await db.subCategory.findUniqueOrThrow({
    where: {
      categoryId_slug: {
        categoryId: mcpCategory.id,
        slug: "filesystem",
      },
    },
  });

  let agentsCollection = await db.collection.findFirst({
    where: { ownerId: user.id, name: "Security Agents" },
  });
  agentsCollection ??= await db.collection.create({
    data: {
      ownerId: user.id,
      categoryId: securityCategory.id,
      subcategoryId: owaspSub.id,
      name: "Security Agents",
      description: "Agents para revisão de segurança e OWASP.",
      type: CollectionType.agent,
      isPublic: true,
      items: {
        create: [
          {
            source: "mcs-catalog",
            externalId: "security-reviewer",
            name: "Security Reviewer",
            description: "Agente de revisão OWASP, auth e segredos.",
            metadata: {
              content:
                "# Security Reviewer\n\nRevise auth, secrets e OWASP Top 10.",
            },
          },
        ],
      },
    },
  });

  await db.collection.update({
    where: { id: agentsCollection.id },
    data: {
      categoryId: securityCategory.id,
      subcategoryId: owaspSub.id,
    },
  });

  let mcpCollection = await db.collection.findFirst({
    where: { ownerId: user.id, name: "Auth Tooling MCPs" },
  });
  if (!mcpCollection) {
    mcpCollection = await db.collection.findFirst({
      where: { ownerId: user.id, name: "Workspace MCPs" },
    });
  }
  mcpCollection ??= await db.collection.create({
    data: {
      ownerId: user.id,
      categoryId: mcpCategory.id,
      subcategoryId: mcpFsSub.id,
      name: "Workspace MCPs",
      description: "MCPs de filesystem e tooling para o workspace do agente.",
      type: CollectionType.mcp,
      isPublic: true,
      items: {
        create: [
          {
            source: "mcp-registry",
            externalId: "io.github.modelcontextprotocol/filesystem",
            name: "Filesystem MCP",
            description: "Operações de filesystem com limites de workspace.",
            metadata: {
              server: {
                command: "npx",
                args: ["-y", "@modelcontextprotocol/server-filesystem"],
              },
            },
          },
        ],
      },
    },
  });

  await db.collection.update({
    where: { id: mcpCollection.id },
    data: {
      categoryId: mcpCategory.id,
      subcategoryId: mcpFsSub.id,
      name: "Workspace MCPs",
      description: "MCPs de filesystem e tooling para o workspace do agente.",
    },
  });

  let uiCollection = await db.collection.findFirst({
    where: { ownerId: user.id, name: "UI Component Skills" },
  });
  uiCollection ??= await db.collection.create({
    data: {
      ownerId: user.id,
      categoryId: designUiCategory.id,
      subcategoryId: componentsSub.id,
      name: "UI Component Skills",
      description: "Skills para composição de interfaces com shadcn/ui.",
      type: CollectionType.skill,
      isPublic: true,
      items: {
        create: [
          {
            source: "mcs-catalog",
            externalId: "nextjs-app-router",
            name: "Next.js App Router",
            description: "Padrões modernos para rotas e Server Components.",
            metadata: {
              content:
                "# Next.js App Router\n\nPrefira Server Components e Route Handlers.",
            },
          },
        ],
      },
    },
  });

  await db.collection.update({
    where: { id: uiCollection.id },
    data: {
      categoryId: designUiCategory.id,
      subcategoryId: componentsSub.id,
    },
  });

  const secureProfile = await db.profile.upsert({
    where: { ownerId_slug: { ownerId: user.id, slug: "secure-fullstack" } },
    update: { isPublic: true },
    create: {
      ownerId: user.id,
      slug: "secure-fullstack",
      name: "Secure Fullstack",
      description:
        "Profile com foco em auth, OWASP e skills de UI para apps Next.js.",
      isPublic: true,
    },
  });

  for (const target of [agentsCollection, mcpCollection, uiCollection]) {
    await db.profileCollection.upsert({
      where: {
        profileId_collectionId: {
          profileId: secureProfile.id,
          collectionId: target.id,
        },
      },
      update: {},
      create: {
        profileId: secureProfile.id,
        collectionId: target.id,
      },
    });
  }

  // Remove categorias legado sem coleções.
  for (const legacySlug of ["ui", "ux", "database"]) {
    const legacy = await db.category.findUnique({ where: { slug: legacySlug } });
    if (!legacy) continue;
    const stillUsed = await db.collection.count({
      where: { categoryId: legacy.id },
    });
    if (stillUsed === 0) {
      await db.category.delete({ where: { id: legacy.id } });
    }
  }
}

main()
  .then(() =>
    console.log(
      "Seed concluído: taxonomia skills.sh + extras MCS; profiles demo e coleções skill/agent/mcp.",
    ),
  )
  .finally(() => db.$disconnect());
