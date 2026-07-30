import type { IdeTarget, ProfileManifest } from "my-collec-skills-manifest";

export type ApplyStatus = "applied" | "skipped" | "failed";

export type ApplyItemKind =
  | "skill"
  | "agent"
  | "mcp"
  | "doc"
  | "extension";

export interface ApplyItemResult {
  kind: ApplyItemKind;
  id: string;
  status: ApplyStatus;
  path?: string;
  message?: string;
  /** Suggested install command for extensions (never executed). */
  command?: string;
}

export interface ApplyReport {
  applied: ApplyItemResult[];
  skipped: ApplyItemResult[];
  failed: ApplyItemResult[];
  dryRun: boolean;
}

export interface ApplyOptions {
  /** Workspace root. Defaults to process.cwd(). */
  cwd?: string;
  /** Target IDE; selects workspace layout and filters extensions. Defaults to "cursor". */
  ide?: IdeTarget;
  /** Plan only — no filesystem writes. */
  dryRun?: boolean;
  /** Overwrite existing differing content. */
  force?: boolean;
}

export type { ProfileManifest };
