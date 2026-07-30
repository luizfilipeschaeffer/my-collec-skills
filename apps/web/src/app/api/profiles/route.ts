import { apiError, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/current-user";
import { profileInputSchema } from "@/lib/schemas";
import { db, Prisma } from "@mcs/db";

const include = {
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
} as const;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const profiles = await db.profile.findMany({
    where: { ownerId: user.id },
    include,
    orderBy: { updatedAt: "desc" },
  });

  return Response.json({ profiles });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const input = profileInputSchema.parse(await request.json());

    const ownedCollections = await db.collection.count({
      where: { id: { in: input.collectionIds }, ownerId: user.id },
    });
    if (ownedCollections !== input.collectionIds.length) {
      return Response.json(
        { error: "Uma ou mais coleções não pertencem ao usuário." },
        { status: 400 },
      );
    }

    const profile = await db.profile.create({
      data: {
        ownerId: user.id,
        name: input.name,
        slug: input.slug,
        description: input.description,
        isPublic: input.isPublic,
        collections: {
          create: input.collectionIds.map((collectionId) => ({ collectionId })),
        },
        skills: { create: input.skills.map(toPrismaJson) },
        agents: { create: input.agents.map(toPrismaJson) },
        mcps: { create: input.mcps.map(toPrismaJson) },
        docs: { create: input.docs.map(toPrismaJson) },
        extensions: { create: input.extensions.map(toPrismaJson) },
      },
      include,
    });

    return Response.json({ profile }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

function toPrismaJson<T extends { metadata?: Record<string, unknown> }>(item: T) {
  return {
    ...item,
    metadata: item.metadata as Prisma.InputJsonValue | undefined,
  };
}
