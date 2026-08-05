import { apiError, unauthorized } from "@/lib/api";
import {
  CatalogContributeError,
  catalogContributeInputSchema,
  createCommunityCatalogEntry,
  toCatalogItem,
} from "@/lib/catalog-contribute";
import { searchCatalog } from "@/lib/catalog-server";
import { loadCatalogEntriesFromDb } from "@/lib/catalog-sync";
import { withCatalogUsage } from "@/lib/catalog-usage";
import { getCurrentUser } from "@/lib/current-user";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const type = url.searchParams.get("type");
  const category = url.searchParams.get("category");
  const subcategory = url.searchParams.get("subcategory");
  const mine = url.searchParams.get("mine") === "1";
  const sort =
    url.searchParams.get("sort") === "popular" ? "popular" : undefined;
  const takeParam = url.searchParams.get("take");
  const take = takeParam ? Number(takeParam) : undefined;

  if (mine) {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const items = await withCatalogUsage(
      await loadCatalogEntriesFromDb({
        q: query,
        type,
        category,
        subcategory,
        submittedById: user.id,
        take: Number.isFinite(take) ? take : 200,
      }),
    );
    return Response.json({
      items,
      query,
      source: "community",
      count: items.length,
    });
  }

  const { items, source } = await searchCatalog({
    q: query,
    type,
    category,
    subcategory,
    sort,
    take: Number.isFinite(take) ? take : undefined,
  });

  return Response.json({ items, query, source, count: items.length });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const input = catalogContributeInputSchema.parse(await request.json());
    const entry = await createCommunityCatalogEntry(user.id, input);
    return Response.json({ item: toCatalogItem(entry) }, { status: 201 });
  } catch (error) {
    if (error instanceof CatalogContributeError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return apiError(error);
  }
}
