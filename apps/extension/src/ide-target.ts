import type { IdeApplyTarget } from "my-collec-skills-apply-engine";

export type IdeTargetSetting = "auto" | IdeApplyTarget;

export function parseIdeTargetSetting(raw: string | undefined): IdeTargetSetting {
  if (raw === "cursor" || raw === "vscode" || raw === "both" || raw === "auto") {
    return raw;
  }
  return "auto";
}

/**
 * Resolve apply layout target.
 * Cursor → cursor layout; Trae / Windsurf / VS Code / other forks → vscode layout.
 */
export function resolveIdeTarget(
  appName: string,
  setting: IdeTargetSetting = "auto",
): IdeApplyTarget {
  if (setting !== "auto") {
    return setting;
  }
  const name = appName.toLowerCase();
  if (name.includes("cursor")) {
    return "cursor";
  }
  return "vscode";
}
