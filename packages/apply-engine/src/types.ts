import type { IdeTarget, ProfileManifest } from "my-collec-skills-manifest";

export type ApplyStatus = "applied" | "skipped" | "failed";

export type ApplyItemKind =
  | "skill"
  | "agent"
  | "mcp"
  | "doc"
  | "extension";

/** Where to write skills/agents/MCPs: one IDE or both layouts. */
export type IdeApplyTarget = IdeTarget | "both";

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
  /**
   * Target IDE layout(s). Defaults to "cursor".
   * Use "both" to apply Cursor and VS Code layouts in one run.
   */
  ide?: IdeApplyTarget;
  /** Plan only — no filesystem writes. */
  dryRun?: boolean;
  /** Overwrite existing differing content. */
  force?: boolean;
}

export type { ProfileManifest };
