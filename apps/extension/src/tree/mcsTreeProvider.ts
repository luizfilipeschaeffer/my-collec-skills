import * as vscode from "vscode";
import type { SessionStore } from "../auth/session.js";
import {
  ITEM_STATUS_STATE_KEY,
  readItemStatuses,
  type ItemStatusMap,
  type StoredItemStatus,
} from "../status/itemStatus.js";
import {
  PROFILE_STATUS_STATE_KEY,
  readProfileStatuses,
  type ProfileStatusMap,
  type StoredProfileStatus,
} from "../status/workspaceStatus.js";

type NodeKind =
  | "session"
  | "search"
  | "section"
  | "item"
  | "empty"
  | "profile"
  | "collection"
  | "hint";

export class McsTreeItem extends vscode.TreeItem {
  constructor(
    label: string,
    collapsible: vscode.TreeItemCollapsibleState,
    readonly kind: NodeKind,
    readonly profile?: StoredProfileStatus,
    readonly installedItem?: StoredItemStatus,
  ) {
    super(label, collapsible);
  }
}

export class McsTreeProvider implements vscode.TreeDataProvider<McsTreeItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<
    McsTreeItem | undefined | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(
    private readonly workspaceState: vscode.Memento,
    private readonly session: SessionStore,
  ) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: McsTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: McsTreeItem): Promise<McsTreeItem[]> {
    if (!element) {
      return this.getRoot();
    }
    if (element.kind === "section") {
      if (element.contextValue === "mcs.section.installed") {
        return this.getInstalledItems();
      }
      if (element.contextValue === "mcs.section.profiles") {
        return this.getProfileRoots();
      }
    }
    if (element.kind === "profile" && element.profile) {
      return this.getCollections(element.profile);
    }
    return [];
  }

  private async getRoot(): Promise<McsTreeItem[]> {
    const token = await this.session.getToken();
    const provider = await this.session.getProvider();
    const sessionLabel = token
      ? `Sessão: ${provider ?? "token"}`
      : "Sessão: convidado (público)";
    const sessionItem = new McsTreeItem(
      sessionLabel,
      vscode.TreeItemCollapsibleState.None,
      "session",
    );
    sessionItem.iconPath = new vscode.ThemeIcon(token ? "verified" : "account");
    sessionItem.contextValue = "mcs.session";

    const search = new McsTreeItem(
      "Abrir Marketplace…",
      vscode.TreeItemCollapsibleState.None,
      "search",
    );
    search.iconPath = new vscode.ThemeIcon("window");
    search.contextValue = "mcs.search";
    search.command = {
      command: "mcs.openMarketplace",
      title: "MCS: Open Marketplace",
    };
    search.tooltip = "Abrir o painel MCS Marketplace como aba do editor";

    const installed = new McsTreeItem(
      "Instalados",
      vscode.TreeItemCollapsibleState.Expanded,
      "section",
    );
    installed.iconPath = new vscode.ThemeIcon("package");
    installed.contextValue = "mcs.section.installed";

    const profiles = new McsTreeItem(
      "Profiles",
      vscode.TreeItemCollapsibleState.Collapsed,
      "section",
    );
    profiles.iconPath = new vscode.ThemeIcon("folder-library");
    profiles.contextValue = "mcs.section.profiles";
    profiles.tooltip = "Profiles aplicados (fluxo secundário)";

    return [sessionItem, search, installed, profiles];
  }

  private getInstalledItems(): McsTreeItem[] {
    const statuses = readItemStatuses((key) =>
      this.workspaceState.get<ItemStatusMap>(key),
    );
    const items = Object.values(statuses).sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    if (items.length === 0) {
      const empty = new McsTreeItem(
        "Nenhum item — use Buscar no catálogo",
        vscode.TreeItemCollapsibleState.None,
        "empty",
      );
      empty.iconPath = new vscode.ThemeIcon("info");
      return [empty];
    }

    return items.map((entry) => {
      const item = new McsTreeItem(
        entry.name,
        vscode.TreeItemCollapsibleState.None,
        "item",
        undefined,
        entry,
      );
      item.description = `${entry.type} · ${entry.status}`;
      item.iconPath = new vscode.ThemeIcon(
        entry.status === "applied" ? "check" : "warning",
      );
      item.tooltip = [
        `${entry.type} · ${entry.source}/${entry.externalId}`,
        `Status: ${entry.status}`,
        `Último apply: ${entry.lastAppliedAt}`,
        `applied=${entry.appliedCount} skipped=${entry.skippedCount} failed=${entry.failedCount}`,
      ].join("\n");
      item.contextValue = "mcs.item";
      return item;
    });
  }

  private getProfileRoots(): McsTreeItem[] {
    const statuses = readProfileStatuses((key) =>
      this.workspaceState.get<ProfileStatusMap>(key),
    );
    const profiles = Object.values(statuses).sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    if (profiles.length === 0) {
      const empty = new McsTreeItem(
        "Nenhum profile — use Install Profile",
        vscode.TreeItemCollapsibleState.None,
        "empty",
      );
      empty.iconPath = new vscode.ThemeIcon("info");
      const hint = new McsTreeItem(
        "Command Palette: MCS: Install Profile",
        vscode.TreeItemCollapsibleState.None,
        "hint",
      );
      hint.iconPath = new vscode.ThemeIcon("tools");
      return [empty, hint];
    }

    return profiles.map((p) => {
      const item = new McsTreeItem(
        `${p.name} (${p.username}/${p.slug})`,
        p.collections.length > 0
          ? vscode.TreeItemCollapsibleState.Collapsed
          : vscode.TreeItemCollapsibleState.None,
        "profile",
        p,
      );
      item.description = p.status === "applied" ? "aplicado" : "pendente";
      item.iconPath = new vscode.ThemeIcon(
        p.status === "applied" ? "check" : "warning",
      );
      item.tooltip = [
        `Status: ${p.status}`,
        p.lastAppliedAt ? `Último apply: ${p.lastAppliedAt}` : "Ainda não aplicado",
        `applied=${p.appliedCount} skipped=${p.skippedCount} failed=${p.failedCount}`,
      ].join("\n");
      item.contextValue = "mcs.profile";
      return item;
    });
  }

  private getCollections(profile: StoredProfileStatus): McsTreeItem[] {
    if (profile.collections.length === 0) {
      const empty = new McsTreeItem(
        "Sem collections",
        vscode.TreeItemCollapsibleState.None,
        "empty",
      );
      return [empty];
    }

    return profile.collections.map((c) => {
      const item = new McsTreeItem(
        c.name,
        vscode.TreeItemCollapsibleState.None,
        "collection",
        profile,
      );
      item.description = `${c.type} · ${c.category}/${c.subcategory} · ${c.status}`;
      item.iconPath = new vscode.ThemeIcon(
        c.status === "applied" ? "symbol-namespace" : "circle-outline",
      );
      item.contextValue = "mcs.collection";
      return item;
    });
  }
}

export { PROFILE_STATUS_STATE_KEY, ITEM_STATUS_STATE_KEY };
