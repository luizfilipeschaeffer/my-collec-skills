import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { resolve } from "node:path";
import { PrismaClient } from "../../../generated/client";

if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production") {
  // Prefer monorepo root .env, then apps/web/.env.local when running the web app.
  config({ path: resolve(process.cwd(), "../../.env") });
  if (!process.env.DATABASE_URL) {
    config({ path: resolve(process.cwd(), ".env.local") });
  }
  if (!process.env.DATABASE_URL) {
    config({ path: resolve(process.cwd(), "../../apps/web/.env.local") });
  }
}

const globalForPrisma = globalThis as unknown as {
  mcsPrisma?: PrismaClient;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL não está definida.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const db = globalForPrisma.mcsPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.mcsPrisma = db;
}

export * from "../../../generated/client";
