import { apiError, unauthorized } from "@/lib/api";
import { createRawApiToken, hashApiToken } from "@/lib/api-token";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@mcs/db";
import { z } from "zod";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const tokens = await db.apiToken.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      createdAt: true,
      expiresAt: true,
      lastUsedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ tokens });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const input = z
      .object({
        name: z.string().min(2).max(80).default("Extensão MCS"),
        expiresInDays: z.number().int().min(1).max(365).default(30),
      })
      .parse(await request.json().catch(() => ({})));
    const rawToken = createRawApiToken();
    const token = await db.apiToken.create({
      data: {
        userId: user.id,
        name: input.name,
        tokenHash: hashApiToken(rawToken),
        expiresAt: new Date(Date.now() + input.expiresInDays * 86_400_000),
      },
    });
    return Response.json(
      {
        token: rawToken,
        id: token.id,
        name: token.name,
        expiresAt: token.expiresAt,
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
