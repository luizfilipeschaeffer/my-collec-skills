import {
  applyProfile,
  buildItemManifest,
  type ApplyReport,
} from "my-collec-skills-apply-engine";
import * as vscode from "vscode";
import type { CatalogApiItem } from "../api/client.js";
import { resolveItemManifestInput } from "../catalog-resolve.js";
import {
  detectIdeTarget,
  getActiveWorkspacePath,
  getApiUrl,
} from "../config.js";
import {
  buildStoredItemStatus,
  ITEM_STATUS_STATE_KEY,
  readItemStatuses,
  upsertItemStatus,
  type ItemStatusMap,
} from "../status/itemStatus.js";
import { formatReportSummary } from "../status/workspaceStatus.js";
import type { McsTreeProvider } from "../tree/mcsTreeProvider.js";

export { resolveItemManifestInput } from "../catalog-resolve.js";

export async function installCatalogItemCommand(
  deps: {
    workspaceState: vscode.Memento;
    tree: McsTreeProvider;
  },
  item: CatalogApiItem,
): Promise<void> {
  const cwd = getActiveWorkspacePath();
  if (!cwd) {
    void vscode.window.showErrorMessage(
      "Abra uma pasta de workspace para instalar itens MCS.",
    );
    return;
  }

  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `MCS: instalando ${item.type} ${item.name}`,
        cancellable: false,
      },
      async () => {
        const apiUrl = getApiUrl();
        const input = await resolveItemManifestInput(item, { apiUrl });
        const manifest = buildItemManifest(input);
        const report: ApplyReport = await applyProfile(manifest, {
          cwd,
          ide: detectIdeTarget(),
          dryRun: false,
          force: false,
        });

        const entry = buildStoredItemStatus(
          {
            type: item.type,
            source: item.source,
            externalId: item.externalId,
            name: item.name,
          },
          report,
        );
        const current = readItemStatuses((key) =>
          deps.workspaceState.get<ItemStatusMap>(key),
        );
        await deps.workspaceState.update(
          ITEM_STATUS_STATE_KEY,
          upsertItemStatus(current, entry),
        );
        deps.tree.refresh();

        const summary = formatReportSummary(report);
        if (report.failed.length > 0) {
          void vscode.window.showWarningMessage(
            `${item.type} ${item.name} aplicado com falhas: ${summary}`,
          );
        } else if (
          report.applied.length === 0 &&
          report.skipped.every((r) =>
            (r.message ?? "").toLowerCase().includes("no content"),
          )
        ) {
          void vscode.window.showWarningMessage(
            `Nada aplicado para ${item.name}: item sem content/server utilizável.`,
          );
        } else {
          void vscode.window.showInformationMessage(
            `${item.type} ${item.name} — ${entry.status}: ${summary}`,
          );
        }
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage(`MCS Install Item: ${message}`);
  }
}
