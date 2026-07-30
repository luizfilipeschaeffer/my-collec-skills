import { apiError, notFound, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/current-user";
import { collectionPatchSchema } from "@/lib/schemas";
import { db, Prisma } from "@mcs/db";

type Context = { params: Promise<{ id: string }> };

const include = {
  category: true,
  subcategory: true,
  items: true,
  _count: { select: { profiles: true } },
} as const;

export async function PATCH(request: Request, { params }: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const existing = await db.collection.findFirst({
      where: { id, ownerId: user.id },
    });
    if (!existing) return notFound("Coleção");
    const input = collectionPatchSchema.parse(await request.json());
    const categoryId = input.categoryId ?? existing.categoryId;
    const subcategoryId = input.subcategoryId ?? existing.subcategoryId;

    const validTaxonomy = await db.subCategory.findFirst({
      where: { id: subcategoryId, categoryId },
    });
    if (!validTaxonomy) {
      return Response.json(
        { error: "A subcategoria não pertence à categoria." },
        { status: 400 },
      );
    }

    const collection = await db.$transaction(async (tx) => {
      await tx.collection.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
          type: input.type,
          categoryId,
          subcategoryId,
          isPublic: input.isPublic,
        },
      });
      if (input.items) {
        await tx.collectionItem.deleteMany({ where: { collectionId: id } });
        if (input.items.length) {
          await tx.collectionItem.createMany({
            data: input.items.map((item) => ({
              collectionId: id,
              ...item,
              metadata: item.metadata as Prisma.InputJsonValue | undefined,
            })),
          });
        }
      }
      return tx.collection.findUniqueOrThrow({ where: { id }, include });
    });

    return Response.json({ collection });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const result = await db.collection.deleteMany({
    where: { id, ownerId: user.id },
  });
  if (!result.count) return notFound("Coleção");
  return new Response(null, { status: 204 });
}
