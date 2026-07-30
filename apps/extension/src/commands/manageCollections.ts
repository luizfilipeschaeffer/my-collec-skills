import * as vscode from "vscode";
import { parseProfileManifest } from "my-collec-skills-manifest";
import { fetchProfileManifest } from "../api/client.js";
import type { SessionStore } from "../auth/session.js";
import { getApiUrl } from "../config.js";
import {
  PROFILE_STATUS_STATE_KEY,
  profileKey,
  readProfileStatuses,
  type ProfileStatusMap,
} from "../status/workspaceStatus.js";
import type { McsTreeProvider } from "../tree/mcsTreeProvider.js";

export async function manageCollectionsCommand(deps: {
  session: SessionStore;
  workspaceState: vscode.Memento;
  tree: McsTreeProvider;
}): Promise<void> {
  const username = await vscode.window.showInputBox({
    title: "MCS: Manage Collections",
    prompt: "Username do profile",
    placeHolder: "alice",
    ignoreFocusOut: true,
  });
  if (!username?.trim()) {
    return;
  }

  const slug = await vscode.window.showInputBox({
    title: "MCS: Manage Collections",
    prompt: "Slug do profile",
    placeHolder: "nextjs-prisma",
    ignoreFocusOut: true,
  });
  if (!slug?.trim()) {
    return;
  }

  const apiUrl = getApiUrl();
  const token = await deps.session.getToken();

  try {
    const raw = await fetchProfileManifest({
      apiUrl,
      username: username.trim(),
      slug: slug.trim(),
      token,
    });
    const manifest = parseProfileManifest(raw);
    const statuses = readProfileStatuses((key) =>
      deps.workspaceState.get<ProfileStatusMap>(key),
    );
    const stored = statuses[profileKey(manifest.username, manifest.slug)];
    const profileStatus = stored?.status ?? "pending";

    if (manifest.collections.length === 0) {
      void vscode.window.showInformationMessage(
        `Profile ${manifest.username}/${manifest.slug} não tem collections (${profileStatus}).`,
      );
      deps.tree.refresh();
      return;
    }

    const picks = manifest.collections.map((c) => ({
      label: c.name,
      description: `${c.type} · ${c.category}/${c.subcategory}`,
      detail: `Status: ${profileStatus} · ${c.items.length} item(ns)`,
    }));

    const selected = await vscode.window.showQuickPick(picks, {
      title: `Collections — ${manifest.username}/${manifest.slug} (${profileStatus})`,
      placeHolder: "Selecione uma collection para detalhes",
      matchOnDescription: true,
      matchOnDetail: true,
    });

    if (selected) {
      void vscode.window.showInformationMessage(
        `${selected.label}: ${selected.description} — ${selected.detail}`,
      );
    }

    // Garante que o profile aparece na sidebar mesmo antes do apply.
    if (!stored) {
      await deps.workspaceState.update(PROFILE_STATUS_STATE_KEY, {
        ...statuses,
        [profileKey(manifest.username, manifest.slug)]: {
          username: manifest.username,
          slug: manifest.slug,
          name: manifest.name,
          status: "pending" as const,
          lastAppliedAt: "",
          appliedCount: 0,
          skippedCount: 0,
          failedCount: 0,
          collections: manifest.collections.map((c) => ({
            type: c.type,
            category: c.category,
            subcategory: c.subcategory,
            name: c.name,
            status: "pending" as const,
          })),
        },
      });
    }

    deps.tree.refresh();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage(`MCS Manage Collections: ${message}`);
  }
}
