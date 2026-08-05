import { apiError, notFound, unauthorized } from "@/lib/api";
import {
  AttachableCollectionError,
  assertAttachableCollectionIds,
} from "@/lib/catalog-usage";
import { getCurrentUser } from "@/lib/current-user";
import { profilePatchSchema } from "@/lib/schemas";
import { db, Prisma } from "@mcs/db";

const include = {
  collections: { include: { collection: true } },
  skills: true,
  agents: true,
  mcps: true,
  docs: true,
  extensions: true,
} as const;

type Context = { params: Promise<{ username: string }> };

export async function GET(_: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { username: id } = await params;
  const profile = await db.profile.findFirst({
    where: { id, ownerId: user.id },
    include,
  });
  if (!profile) return notFound("Profile");
  return Response.json({ profile });
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { username: id } = await params;
    const existing = await db.profile.findFirst({
      where: { id, ownerId: user.id },
    });
    if (!existing) return notFound("Profile");
    const input = profilePatchSchema.parse(await request.json());

    if (input.collectionIds) {
      try {
        await assertAttachableCollectionIds(user.id, input.collectionIds);
      } catch (error) {
        if (error instanceof AttachableCollectionError) {
          return Response.json(
            { error: error.message },
            { status: error.status },
          );
        }
        throw error;
      }
    }

    const profile = await db.$transaction(async (tx) => {
      await tx.profile.update({
        where: { id },
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          isPublic: input.isPublic,
        },
      });

      if (input.collectionIds) {
        await tx.profileCollection.deleteMany({ where: { profileId: id } });
        await tx.profileCollection.createMany({
          data: input.collectionIds.map((collectionId) => ({
            profileId: id,
            collectionId,
          })),
        });
      }
      if (input.skills) {
        await tx.profileSkill.deleteMany({ where: { profileId: id } });
        await tx.profileSkill.createMany({
          data: input.skills.map((item) => toCreateInput(id, item)),
        });
      }
      if (input.agents) {
        await tx.profileAgent.deleteMany({ where: { profileId: id } });
        await tx.profileAgent.createMany({
          data: input.agents.map((item) => toCreateInput(id, item)),
        });
      }
      if (input.mcps) {
        await tx.profileMcp.deleteMany({ where: { profileId: id } });
        await tx.profileMcp.createMany({
          data: input.mcps.map((item) => toCreateInput(id, item)),
        });
      }
      if (input.docs) {
        await tx.profileDoc.deleteMany({ where: { profileId: id } });
        await tx.profileDoc.createMany({
          data: input.docs.map((item) => toCreateInput(id, item)),
        });
      }
      if (input.extensions) {
        await tx.profileExtension.deleteMany({ where: { profileId: id } });
        await tx.profileExtension.createMany({
          data: input.extensions.map((item) => ({
            profileId: id,
            ...item,
            metadata: item.metadata as Prisma.InputJsonValue | undefined,
          })),
        });
      }

      return tx.profile.findUniqueOrThrow({ where: { id }, include });
    });

    return Response.json({ profile });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { username: id } = await params;
  const result = await db.profile.deleteMany({
    where: { id, ownerId: user.id },
  });
  if (result.count === 0) return notFound("Profile");
  return new Response(null, { status: 204 });
}

function toCreateInput<
  T extends {
    metadata?: Record<string, unknown>;
  },
>(profileId: string, item: T) {
  return {
    profileId,
    ...item,
    metadata: item.metadata as Prisma.InputJsonValue | undefined,
  };
}
