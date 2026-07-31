import { authenticateBearer } from "@/lib/api-token";
import { searchMarketplaceProfiles } from "@/lib/marketplace";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const takeParam = url.searchParams.get("take");
  const take = takeParam ? Number(takeParam) : undefined;
  const user = await authenticateBearer(request);

  const profiles = await searchMarketplaceProfiles({
    q,
    take: Number.isFinite(take) ? take : undefined,
    authorizedOwnerId: user?.id,
  });

  return Response.json({
    profiles,
    query: q,
    count: profiles.length,
    authenticated: Boolean(user),
  });
}
