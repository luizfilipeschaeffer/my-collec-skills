import {
  applyProfile,
  buildItemManifest,
  type ApplyReport,
  type IdeApplyTarget,
} from "my-collec-skills-apply-engine";
import { parseProfileManifest } from "my-collec-skills-manifest";
import * as vscode from "vscode";
import {
  fetchCollectionManifest,
  fetchProfileManifest,
  type CatalogApiItem,
} from "../api/client.js";
import type { SessionStore } from "../auth/session.js";
import { resolveItemManifestInput } from "../catalog-resolve.js";
import {
  detectIdeTarget,
  getActiveWorkspacePath,
  getApiUrl,
} from "../config.js";
import {
  cartItemKey,
  dedupeCartEntries,
  type CartEntry,
} from "../panel/protocol.js";
import {
  buildStoredItemStatus,
  ITEM_STATUS_STATE_KEY,
  readItemStatuses,
  upsertItemStatus,
  type ItemStatusMap,
} from "../status/itemStatus.js";
import {
  buildStoredProfileStatus,
  formatReportSummary,
  PROFILE_STATUS_STATE_KEY,
  readProfileStatuses,
  upsertProfileStatus,
  type ProfileStatusMap,
} from "../status/workspaceStatus.js";
import type { McsTreeProvider } from "../tree/mcsTreeProvider.js";
import { contentFingerprint } from "./batch-helpers.js";

export { contentFingerprint } from "./batch-helpers.js";

export interface BatchInstallResult {
  key: string;
  name: string;
  ok: boolean;
  summary: string;
  error?: string;
}

export interface BatchInstallOptions {
  entries: CartEntry[];
  ideTarget: IdeApplyTarget | "auto";
  force: boolean;
  session: SessionStore;
  workspaceState: vscode.Memento;
  tree: McsTreeProvider;
  onProgress?: (current: number, total: number, label: string) => void;
}

export async function installBatch(
  options: BatchInstallOptions,
): Promise<BatchInstallResult[]> {
  const cwd = getActiveWorkspacePath();
  if (!cwd) {
    throw new Error("Abra uma pasta de workspace para instalar itens MCS.");
  }

  const entries = dedupeCartEntries(options.entries);
  const apiUrl = getApiUrl();
  const token = await options.session.getToken();
  const ide =
    options.ideTarget === "auto"
      ? detectIdeTarget()
      : options.ideTarget;

  const results: BatchInstallResult[] = [];
  const seenContent = new Set<string>();

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    options.onProgress?.(i + 1, entries.length, entry.name);

    try {
      let report: ApplyReport;
      if (entry.kind === "item") {
        const catalogItem: CatalogApiItem = {
          type: entry.type,
          source: entry.source,
          externalId: entry.externalId,
          name: entry.name,
          description: entry.description ?? "",
          url: entry.url,
          metadata: entry.metadata,
        };
        const input = await resolveItemManifestInput(catalogItem, {
          apiUrl,
        });
        const fingerprint = cartItemKey(
          entry.type,
          entry.source,
          entry.externalId,
        );
        if (seenContent.has(fingerprint)) {
          results.push({
            key: entry.key,
            name: entry.name,
            ok: true,
            summary: "skipped=1 (já coberto por outra seleção)",
          });
          continue;
        }
        const manifest = buildItemManifest(input);
        report = await applyProfile(manifest, {
          cwd,
          ide,
          force: options.force,
        });
        seenContent.add(fingerprint);

        const itemEntry = buildStoredItemStatus(
          {
            type: entry.type,
            source: entry.source,
            externalId: entry.externalId,
            name: entry.name,
          },
          report,
        );
        const currentItems = readItemStatuses((key) =>
          options.workspaceState.get<ItemStatusMap>(key),
        );
        await options.workspaceState.update(
          ITEM_STATUS_STATE_KEY,
          upsertItemStatus(currentItems, itemEntry),
        );
      } else if (entry.kind === "profile") {
        const raw = await fetchProfileManifest({
          apiUrl,
          username: entry.username,
          slug: entry.slug,
          token,
        });
        const manifest = parseProfileManifest(raw);
        report = await applyProfile(manifest, {
          cwd,
          ide,
          force: options.force,
        });
        for (const fp of contentFingerprint(report)) {
          seenContent.add(fp);
        }
        const profileEntry = buildStoredProfileStatus(manifest, report);
        const currentProfiles = readProfileStatuses((key) =>
          options.workspaceState.get<ProfileStatusMap>(key),
        );
        await options.workspaceState.update(
          PROFILE_STATUS_STATE_KEY,
          upsertProfileStatus(currentProfiles, profileEntry),
        );
      } else {
        const raw = await fetchCollectionManifest({
          apiUrl,
          collectionId: entry.id,
          token,
        });
        const manifest = parseProfileManifest(raw);
        report = await applyProfile(manifest, {
          cwd,
          ide,
          force: options.force,
        });
        for (const fp of contentFingerprint(report)) {
          seenContent.add(fp);
        }
      }

      const summary = formatReportSummary(report);
      results.push({
        key: entry.key,
        name: entry.name,
        ok: report.failed.length === 0,
        summary,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        key: entry.key,
        name: entry.name,
        ok: false,
        summary: "failed",
        error: message,
      });
    }
  }

  options.tree.refresh();
  return results;
}
