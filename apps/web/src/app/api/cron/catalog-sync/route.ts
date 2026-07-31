import {
  runCatalogSync,
  type CatalogSyncPhase,
} from "@/lib/catalog-sync";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const PHASES = new Set<CatalogSyncPhase>([
  "all",
  "builtin",
  "skills-sh",
  "mcp",
  "claude",
  "backfill",
]);

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    // Fail closed in production; allow local/dev without secret.
    return process.env.NODE_ENV !== "production";
  }

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const phaseParam = (url.searchParams.get("phase") ?? "all") as CatalogSyncPhase;
  const phase = PHASES.has(phaseParam) ? phaseParam : "all";

  try {
    const report = await runCatalogSync(phase);
    console.info("[catalog-sync]", JSON.stringify(report));
    return NextResponse.json({ ok: true, report });
  } catch (error) {
    console.error("[catalog-sync] failed", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
