import { apiError, notFound, unauthorized } from "@/lib/api";
import {
  CatalogContributeError,
  COMMUNITY_CATALOG_SOURCE,
  catalogContributePatchSchema,
  catalogEntryInclude,
  toCatalogItem,
  updateCommunityCatalogEntry,
} from "@/lib/catalog-contribute";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@mcs/db";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const input = catalogContributePatchSchema.parse(await request.json());
    const entry = await updateCommunityCatalogEntry(id, user.id, input);
    return Response.json({ item: toCatalogItem(entry) });
  } catch (error) {
    if (error instanceof CatalogContributeError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return apiError(error);
  }
}

export async function DELETE(_: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const result = await db.catalogEntry.deleteMany({
    where: {
      id,
      submittedById: user.id,
      source: COMMUNITY_CATALOG_SOURCE,
    },
  });
  if (!result.count) return notFound("Item");
  return new Response(null, { status: 204 });
}

export async function GET(_: Request, { params }: Context) {
  const { id } = await params;
  const entry = await db.catalogEntry.findUnique({
    where: { id },
    include: catalogEntryInclude,
  });
  if (!entry) return notFound("Item");
  return Response.json({ item: toCatalogItem(entry) });
}
