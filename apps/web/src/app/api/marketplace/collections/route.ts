import { authenticateBearer } from "@/lib/api-token";
import { searchMarketplaceCollections } from "@/lib/marketplace";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const type = url.searchParams.get("type");
  const takeParam = url.searchParams.get("take");
  const take = takeParam ? Number(takeParam) : undefined;
  const user = await authenticateBearer(request);

  const collections = await searchMarketplaceCollections({
    q,
    type,
    take: Number.isFinite(take) ? take : undefined,
    authorizedOwnerId: user?.id,
  });

  return Response.json({
    collections,
    query: q,
    count: collections.length,
    authenticated: Boolean(user),
  });
}
