import type { IdeApplyTarget } from "my-collec-skills-apply-engine";
import * as vscode from "vscode";
import {
  parseIdeTargetSetting,
  resolveIdeTarget,
  type IdeTargetSetting,
} from "./ide-target.js";
import { DEFAULT_API_URL, normalizeApiUrl } from "./url.js";

const CONFIG_SECTION = "mcs";

export type { IdeTargetSetting };

/** Base URL da Profile API (sem barra final). */
export function getApiUrl(): string {
  const raw = vscode.workspace
    .getConfiguration(CONFIG_SECTION)
    .get<string>("apiUrl", DEFAULT_API_URL);
  return normalizeApiUrl(raw);
}

/** Pasta raiz do workspace ativo, ou `undefined` se nenhum aberto. */
export function getActiveWorkspacePath(): string | undefined {
  const folder = vscode.workspace.workspaceFolders?.[0];
  return folder?.uri.fsPath;
}

export function getIdeTargetSetting(): IdeTargetSetting {
  const raw = vscode.workspace
    .getConfiguration(CONFIG_SECTION)
    .get<string>("ideTarget", "auto");
  return parseIdeTargetSetting(raw);
}

export function detectIdeTarget(
  appName: string = vscode.env.appName,
  setting: IdeTargetSetting = getIdeTargetSetting(),
): IdeApplyTarget {
  return resolveIdeTarget(appName, setting);
}
