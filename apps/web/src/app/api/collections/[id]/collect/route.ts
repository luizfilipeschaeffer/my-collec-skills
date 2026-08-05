import { apiError, notFound, unauthorized } from "@/lib/api";
import {
  AttachableCollectionError,
  collectPublicCollection,
} from "@/lib/catalog-usage";
import { collectCollectionInputSchema } from "@/lib/collect-collection";
import { getCurrentUser } from "@/lib/current-user";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    if (!id) return notFound("Coleção");

    const input = collectCollectionInputSchema.parse(await request.json());
    const result = await collectPublicCollection({
      userId: user.id,
      collectionId: id,
      profileId: input.profileId,
    });

    return Response.json({
      ok: true,
      alreadyCollected: result.alreadyCollected,
      link: { id: result.link.id },
    });
  } catch (error) {
    if (error instanceof AttachableCollectionError) {
      return Response.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return apiError(error);
  }
}
