import * as vscode from "vscode";
import { applyProfile, type ApplyReport } from "my-collec-skills-apply-engine";
import { parseProfileManifest, type ProfileManifest } from "my-collec-skills-manifest";
import { fetchProfileManifest } from "../api/client.js";
import type { SessionStore } from "../auth/session.js";
import {
  detectIdeTarget,
  getActiveWorkspacePath,
  getApiUrl,
} from "../config.js";
import {
  buildStoredProfileStatus,
  formatReportSummary,
  PROFILE_STATUS_STATE_KEY,
  readProfileStatuses,
  upsertProfileStatus,
  type ProfileStatusMap,
} from "../status/workspaceStatus.js";
import type { McsTreeProvider } from "../tree/mcsTreeProvider.js";

async function promptUsernameSlug(): Promise<
  { username: string; slug: string } | undefined
> {
  const username = await vscode.window.showInputBox({
    title: "MCS: Install Profile",
    prompt: "Username do dono do profile",
    placeHolder: "alice",
    ignoreFocusOut: true,
  });
  if (!username?.trim()) {
    return undefined;
  }

  const slug = await vscode.window.showInputBox({
    title: "MCS: Install Profile",
    prompt: "Slug do profile (perfil)",
    placeHolder: "nextjs-prisma",
    ignoreFocusOut: true,
  });
  if (!slug?.trim()) {
    return undefined;
  }

  return { username: username.trim(), slug: slug.trim() };
}

export async function installProfileCommand(deps: {
  session: SessionStore;
  workspaceState: vscode.Memento;
  tree: McsTreeProvider;
}): Promise<void> {
  const cwd = getActiveWorkspacePath();
  if (!cwd) {
    void vscode.window.showErrorMessage(
      "Abra uma pasta de workspace para aplicar o profile MCS.",
    );
    return;
  }

  const ids = await promptUsernameSlug();
  if (!ids) {
    return;
  }

  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `MCS: instalando ${ids.username}/${ids.slug}`,
        cancellable: false,
      },
      async () => {
        const apiUrl = getApiUrl();
        const token = await deps.session.getToken();
        const raw = await fetchProfileManifest({
          apiUrl,
          username: ids.username,
          slug: ids.slug,
          token,
        });

        const manifest: ProfileManifest = parseProfileManifest(raw);
        const report: ApplyReport = await applyProfile(manifest, {
          cwd,
          ide: detectIdeTarget(),
          dryRun: false,
          force: false,
        });

        const entry = buildStoredProfileStatus(manifest, report);
        const current = readProfileStatuses((key) =>
          deps.workspaceState.get<ProfileStatusMap>(key),
        );
        await deps.workspaceState.update(
          PROFILE_STATUS_STATE_KEY,
          upsertProfileStatus(current, entry),
        );
        deps.tree.refresh();

        const summary = formatReportSummary(report);
        if (report.failed.length > 0) {
          void vscode.window.showWarningMessage(
            `Profile ${manifest.username}/${manifest.slug} aplicado com falhas: ${summary}`,
          );
        } else {
          void vscode.window.showInformationMessage(
            `Profile ${manifest.username}/${manifest.slug} — ${entry.status}: ${summary}`,
          );
        }
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage(`MCS Install Profile: ${message}`);
  }
}
