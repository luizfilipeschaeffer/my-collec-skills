import { auth } from "@/auth";
import { db } from "@mcs/db";

export async function getCurrentUser() {
  const session = await auth();

  if (session?.user?.id) {
    return db.user.findUnique({ where: { id: session.user.id } });
  }

  if (
    process.env.MCS_DEMO_MODE === "true" &&
    process.env.NODE_ENV !== "production"
  ) {
    return db.user.findUnique({ where: { username: "demo" } });
  }

  return null;
}
