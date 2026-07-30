import { notFound, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@mcs/db";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const result = await db.apiToken.deleteMany({
    where: { id, userId: user.id },
  });
  if (!result.count) return notFound("Token");
  return new Response(null, { status: 204 });
}
