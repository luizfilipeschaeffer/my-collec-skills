import { createHash, randomBytes } from "node:crypto";
import { db } from "@mcs/db";

export function hashApiToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createRawApiToken() {
  return `mcs_${randomBytes(32).toString("base64url")}`;
}

export async function authenticateBearer(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const rawToken = authorization.slice("Bearer ".length).trim();
  if (!rawToken.startsWith("mcs_")) return null;

  const token = await db.apiToken.findUnique({
    where: { tokenHash: hashApiToken(rawToken) },
    include: { user: true },
  });
  if (!token || (token.expiresAt && token.expiresAt <= new Date())) return null;

  await db.apiToken.update({
    where: { id: token.id },
    data: { lastUsedAt: new Date() },
  });
  return token.user;
}
