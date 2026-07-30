import * as vscode from "vscode";
import { normalizeApiUrl } from "./url.js";

const CONFIG_SECTION = "mcs";

/** Base URL da Profile API (sem barra final). */
export function getApiUrl(): string {
  const raw = vscode.workspace
    .getConfiguration(CONFIG_SECTION)
    .get<string>("apiUrl", "http://localhost:3000");
  return normalizeApiUrl(raw);
}

/** Pasta raiz do workspace ativo, ou `undefined` se nenhum aberto. */
export function getActiveWorkspacePath(): string | undefined {
  const folder = vscode.workspace.workspaceFolders?.[0];
  return folder?.uri.fsPath;
}

export function detectIdeTarget(): "cursor" | "vscode" {
  const appName = vscode.env.appName.toLowerCase();
  return appName.includes("cursor") ? "cursor" : "vscode";
}
