import { db } from "@mcs/db";

export async function resolveProfileManifest(
  username: string,
  slug: string,
  authorizedOwnerId?: string,
) {
  const profile = await db.profile.findFirst({
    where: {
      slug,
      owner: { username },
      OR: [
        { isPublic: true },
        ...(authorizedOwnerId ? [{ ownerId: authorizedOwnerId }] : []),
      ],
    },
    include: {
      owner: true,
      collections: {
        include: {
          collection: {
            include: { category: true, subcategory: true, items: true },
          },
        },
      },
      skills: true,
      agents: true,
      mcps: true,
      docs: true,
      extensions: true,
    },
  });

  if (!profile) return null;

  const mapItem = (item: {
    source: string;
    externalId: string;
    name: string;
    description: string | null;
    metadata: unknown;
  }) => {
    const metadata =
      item.metadata && typeof item.metadata === "object"
        ? (item.metadata as Record<string, unknown>)
        : undefined;
    return {
      source: item.source,
      externalId: item.externalId,
      name: item.name,
      description: item.description ?? undefined,
      content:
        typeof metadata?.content === "string" ? metadata.content : undefined,
      metadata,
    };
  };

  const mcpItems = [
    ...profile.mcps,
    ...profile.collections
      .filter(({ collection }) => collection.type === "mcp")
      .flatMap(({ collection }) => collection.items),
  ].flatMap((item) => {
    const base = mapItem(item);
    const server = resolveMcpServer(base.metadata);
    return server ? [{ ...base, server }] : [];
  });

  return {
    version: 1 as const,
    username: profile.owner.username,
    slug: profile.slug,
    name: profile.name,
    description: profile.description ?? undefined,
    collections: profile.collections.map(({ collection }) => ({
      id: collection.id,
      type: collection.type,
      category: collection.category.slug,
      subcategory: collection.subcategory.slug,
      name: collection.name,
      description: collection.description ?? undefined,
      items: collection.items.map(mapItem),
    })),
    skills: profile.skills.map(mapItem),
    agents: profile.agents.map(mapItem),
    mcps: Array.from(
      new Map(mcpItems.map((item) => [item.externalId, item])).values(),
    ),
    docs: profile.docs.map((item) => ({
      ...mapItem(item),
      url: item.url ?? undefined,
    })),
    extensions: profile.extensions.map((item) => ({
      ide: item.ide,
      id: item.extensionId,
      name: item.name,
      description: item.description ?? undefined,
      metadata:
        item.metadata && typeof item.metadata === "object"
          ? item.metadata
          : undefined,
    })),
  };
}

function resolveMcpServer(metadata?: Record<string, unknown>) {
  if (!metadata) return null;
  const explicit = metadata.server;
  if (explicit && typeof explicit === "object") {
    const value = explicit as Record<string, unknown>;
    if (typeof value.command === "string" || typeof value.url === "string") {
      return value;
    }
  }

  if (Array.isArray(metadata.packages)) {
    const packageEntry = metadata.packages.find(
      (entry): entry is Record<string, unknown> =>
        Boolean(entry && typeof entry === "object"),
    );
    if (packageEntry && typeof packageEntry.identifier === "string") {
      return {
        command:
          typeof packageEntry.runtimeHint === "string"
            ? packageEntry.runtimeHint
            : "npx",
        args: ["-y", packageEntry.identifier],
      };
    }
  }

  return null;
}
