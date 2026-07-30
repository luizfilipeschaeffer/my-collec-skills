import type { IdeTarget } from "my-collec-skills-manifest";
import type { IdeApplyTarget } from "./types.js";

/**
 * Workspace layout for skills / agents / MCP config per IDE target.
 * Docs always live under `.mcs/` (product-owned, IDE-agnostic).
 */
export interface IdeLayout {
  /** Directory segment under cwd for skills (e.g. `.cursor/skills`). */
  skillsDir: readonly [string, ...string[]];
  /** Directory segment under cwd for agents. */
  agentsDir: readonly [string, ...string[]];
  /** Path segments for the MCP JSON file. */
  mcpFile: readonly [string, ...string[]];
  /** Human-readable label used in messages. */
  label: string;
}

const LAYOUTS: Record<IdeTarget, IdeLayout> = {
  cursor: {
    label: "Cursor",
    skillsDir: [".cursor", "skills"],
    agentsDir: [".cursor", "agents"],
    mcpFile: [".cursor", "mcp.json"],
  },
  vscode: {
    label: "VS Code",
    // Agent Skills / Copilot-compatible project skills
    skillsDir: [".github", "skills"],
    agentsDir: [".github", "agents"],
    mcpFile: [".vscode", "mcp.json"],
  },
};

export function getIdeLayout(ide: IdeTarget): IdeLayout {
  return LAYOUTS[ide];
}

/** Expand an apply choice into concrete IDE targets. */
export function expandIdeTargets(ide: IdeApplyTarget): IdeTarget[] {
  return ide === "both" ? ["cursor", "vscode"] : [ide];
}
