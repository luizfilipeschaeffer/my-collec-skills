import { searchCatalog } from "@/lib/catalog";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const type = url.searchParams.get("type");
  const takeParam = url.searchParams.get("take");
  const take = takeParam ? Number(takeParam) : undefined;

  const { items, source } = await searchCatalog({
    q: query,
    type,
    take: Number.isFinite(take) ? take : undefined,
  });

  return Response.json({ items, query, source, count: items.length });
}
