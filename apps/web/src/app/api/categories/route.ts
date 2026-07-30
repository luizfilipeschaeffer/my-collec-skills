import { db } from "@mcs/db";

export async function GET() {
  const categories = await db.category.findMany({
    include: { subcategories: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });

  return Response.json({ categories });
}
