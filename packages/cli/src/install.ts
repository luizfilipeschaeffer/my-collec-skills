import type { ApplyReport, IdeApplyTarget } from "my-collec-skills-apply-engine";
import { applyProfile } from "my-collec-skills-apply-engine";
import type { ProfileManifest } from "my-collec-skills-manifest";
import {
  ManifestValidationError,
  parseProfileManifest,
} from "my-collec-skills-manifest";

export const EXIT_OK = 0;
export const EXIT_USAGE = 1;
export const EXIT_NETWORK = 2;
export const EXIT_VALIDATION = 3;
export const EXIT_APPLY = 4;

export interface InstallOptions {
  username: string;
  perfil: string;
  apiUrl?: string;
  dryRun?: boolean;
  force?: boolean;
  ide?: IdeApplyTarget;
  cwd?: string;
  /** Injectable fetch for tests. */
  fetchImpl?: typeof fetch;
}

export class InstallError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode: number) {
    super(message);
    this.name = "InstallError";
    this.exitCode = exitCode;
  }
}

export function resolveApiUrl(explicit?: string): string {
  const url = explicit ?? process.env.MCS_API_URL ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export async function fetchManifest(
  apiUrl: string,
  username: string,
  slug: string,
  fetchImpl: typeof fetch = fetch,
): Promise<unknown> {
  const url = `${apiUrl}/api/profiles/${encodeURIComponent(username)}/${encodeURIComponent(slug)}/manifest`;
  let response: Response;
  try {
    response = await fetchImpl(url, {
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    throw new InstallError(
      `Failed to reach API at ${url}: ${err instanceof Error ? err.message : String(err)}`,
      EXIT_NETWORK,
    );
  }

  if (response.status === 404) {
    throw new InstallError(
      `Profile not found: ${username}/${slug}`,
      EXIT_NETWORK,
    );
  }
  if (!response.ok) {
    throw new InstallError(
      `API error ${response.status} fetching ${url}`,
      EXIT_NETWORK,
    );
  }

  try {
    return await response.json();
  } catch {
    throw new InstallError("API returned non-JSON body", EXIT_NETWORK);
  }
}

export function validateManifest(json: unknown): ProfileManifest {
  try {
    return parseProfileManifest(json);
  } catch (err) {
    if (err instanceof ManifestValidationError) {
      throw new InstallError(
        `Invalid manifesto: ${err.message}`,
        EXIT_VALIDATION,
      );
    }
    throw err;
  }
}

export function formatReport(report: ApplyReport): string {
  const lines: string[] = [];
  if (report.dryRun) {
    lines.push("[dry-run] No files were written.");
  }
  lines.push(
    `applied=${report.applied.length} skipped=${report.skipped.length} failed=${report.failed.length}`,
  );
  for (const item of report.applied) {
    const cmd = item.command ? ` → ${item.command}` : "";
    lines.push(`  ✓ ${item.kind} ${item.id}${item.message ? ` (${item.message})` : ""}${cmd}`);
  }
  for (const item of report.skipped) {
    lines.push(`  – ${item.kind} ${item.id}${item.message ? ` (${item.message})` : ""}`);
  }
  for (const item of report.failed) {
    lines.push(`  ✗ ${item.kind} ${item.id}${item.message ? ` (${item.message})` : ""}`);
  }
  return lines.join("\n");
}

/**
 * Fetch, validate and apply a public profile manifesto.
 * Returns exit code (0 on success with no failures).
 */
export async function runInstall(options: InstallOptions): Promise<{
  exitCode: number;
  report: ApplyReport;
  manifest: ProfileManifest;
  output: string;
}> {
  if (!options.username?.trim() || !options.perfil?.trim()) {
    throw new InstallError(
      "Both --username and --perfil are required",
      EXIT_USAGE,
    );
  }

  const apiUrl = resolveApiUrl(options.apiUrl);
  const json = await fetchManifest(
    apiUrl,
    options.username.trim(),
    options.perfil.trim(),
    options.fetchImpl,
  );
  const manifest = validateManifest(json);
  const report = await applyProfile(manifest, {
    cwd: options.cwd,
    dryRun: options.dryRun,
    force: options.force,
    ide: options.ide,
  });

  const output = formatReport(report);
  const exitCode = report.failed.length > 0 ? EXIT_APPLY : EXIT_OK;
  return { exitCode, report, manifest, output };
}
