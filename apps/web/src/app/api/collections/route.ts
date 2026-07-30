import { apiError, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/current-user";
import { collectionInputSchema } from "@/lib/schemas";
import { db, Prisma } from "@mcs/db";

const include = {
  category: true,
  subcategory: true,
  items: true,
  _count: { select: { profiles: true } },
} as const;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const collections = await db.collection.findMany({
    where: { ownerId: user.id },
    include,
    orderBy: { updatedAt: "desc" },
  });
  return Response.json({ collections });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const input = collectionInputSchema.parse(await request.json());

    const subcategory = await db.subCategory.findFirst({
      where: { id: input.subcategoryId, categoryId: input.categoryId },
    });
    if (!subcategory) {
      return Response.json(
        { error: "A subcategoria não pertence à categoria." },
        { status: 400 },
      );
    }

    const collection = await db.collection.create({
      data: {
        ownerId: user.id,
        name: input.name,
        description: input.description,
        type: input.type,
        categoryId: input.categoryId,
        subcategoryId: input.subcategoryId,
        isPublic: input.isPublic,
        items: {
          create: input.items.map((item) => ({
            ...item,
            metadata: item.metadata as Prisma.InputJsonValue | undefined,
          })),
        },
      },
      include,
    });
    return Response.json({ collection }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
