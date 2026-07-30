import * as vscode from "vscode";
import type { SessionStore } from "../auth/session.js";
import {
  PROFILE_STATUS_STATE_KEY,
  readProfileStatuses,
  type ProfileStatusMap,
  type StoredProfileStatus,
} from "../status/workspaceStatus.js";

type NodeKind = "session" | "empty" | "profile" | "collection" | "hint";

export class McsTreeItem extends vscode.TreeItem {
  constructor(
    label: string,
    collapsible: vscode.TreeItemCollapsibleState,
    readonly kind: NodeKind,
    readonly profile?: StoredProfileStatus,
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
      return [sessionItem, empty, hint];
    }

    const profileItems = profiles.map((p) => {
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

    return [sessionItem, ...profileItems];
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

export { PROFILE_STATUS_STATE_KEY };
