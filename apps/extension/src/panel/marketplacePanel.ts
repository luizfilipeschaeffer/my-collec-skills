import { randomBytes } from "node:crypto";
import * as vscode from "vscode";
import {
  searchCatalog,
  searchMarketplaceCollections,
  searchMarketplaceProfiles,
  type CatalogApiItem,
} from "../api/client.js";
import type { SessionStore } from "../auth/session.js";
import { installBatch } from "../commands/installBatch.js";
import { getApiUrl, getIdeTargetSetting } from "../config.js";
import type { McsTreeProvider } from "../tree/mcsTreeProvider.js";
import {
  cartCollectionKey,
  cartItemKey,
  cartProfileKey,
  isWebviewToHostMessage,
  type CartCollectionEntry,
  type CartItemEntry,
  type CartProfileEntry,
  type HostToWebviewMessage,
  type MarketplaceScope,
  type WebviewToHostMessage,
} from "./protocol.js";

export const MARKETPLACE_VIEW_TYPE = "mcs.marketplace";

function toItemEntry(item: CatalogApiItem): CartItemEntry {
  return {
    kind: "item",
    key: cartItemKey(item.type, item.source, item.externalId),
    type: item.type,
    source: item.source,
    externalId: item.externalId,
    name: item.name,
    description: item.description,
    url: item.url,
    metadata: item.metadata,
  };
}

export class MarketplacePanel {
  public static current: MarketplacePanel | undefined;

  public static createOrShow(
    context: vscode.ExtensionContext,
    deps: {
      session: SessionStore;
      workspaceState: vscode.Memento;
      tree: McsTreeProvider;
    },
    options: { focusQuery?: boolean } = {},
  ): MarketplacePanel {
    if (MarketplacePanel.current) {
      MarketplacePanel.current.panel.reveal(vscode.ViewColumn.Active);
      if (options.focusQuery) {
        void MarketplacePanel.current.sendBootstrap(true);
      }
      return MarketplacePanel.current;
    }

    const panel = vscode.window.createWebviewPanel(
      MARKETPLACE_VIEW_TYPE,
      "MCS Marketplace",
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, "dist", "webview"),
          vscode.Uri.joinPath(context.extensionUri, "media"),
        ],
        enableCommandUris: false,
      },
    );

    MarketplacePanel.current = new MarketplacePanel(panel, context, deps, options);
    return MarketplacePanel.current;
  }

  public static revive(
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
    deps: {
      session: SessionStore;
      workspaceState: vscode.Memento;
      tree: McsTreeProvider;
    },
  ): MarketplacePanel {
    MarketplacePanel.current = new MarketplacePanel(panel, context, deps);
    return MarketplacePanel.current;
  }

  private constructor(
    public readonly panel: vscode.WebviewPanel,
    private readonly context: vscode.ExtensionContext,
    private readonly deps: {
      session: SessionStore;
      workspaceState: vscode.Memento;
      tree: McsTreeProvider;
    },
    private readonly options: { focusQuery?: boolean } = {},
  ) {
    this.panel.iconPath = vscode.Uri.joinPath(
      context.extensionUri,
      "media",
      "mcs.svg",
    );
    this.panel.webview.html = this.getHtml(this.panel.webview);
    this.panel.onDidDispose(() => this.dispose(), null, context.subscriptions);
    this.panel.webview.onDidReceiveMessage(
      (message) => void this.onMessage(message),
      null,
      context.subscriptions,
    );
  }

  private dispose(): void {
    MarketplacePanel.current = undefined;
  }

  private post(message: HostToWebviewMessage): void {
    void this.panel.webview.postMessage(message);
  }

  private async sendBootstrap(focusQuery = false): Promise<void> {
    const token = await this.deps.session.getToken();
    const provider = await this.deps.session.getProvider();
    const setting = getIdeTargetSetting();
    this.post({
      type: "bootstrap",
      apiUrl: getApiUrl(),
      authenticated: Boolean(token),
      provider,
      ideTarget: setting,
      focusQuery: focusQuery || this.options.focusQuery,
    });
  }

  private async onMessage(raw: unknown): Promise<void> {
    if (!isWebviewToHostMessage(raw)) {
      this.post({ type: "error", message: "Mensagem inválida do painel." });
      return;
    }
    const message: WebviewToHostMessage = raw;

    try {
      switch (message.type) {
        case "ready":
          await this.sendBootstrap();
          break;
        case "refreshSession":
          await this.sendBootstrap();
          break;
        case "openExternal":
          await vscode.env.openExternal(vscode.Uri.parse(message.url));
          break;
        case "search":
          await this.handleSearch(message.scope, message.query, message.take);
          break;
        case "installBatch": {
          const results = await installBatch({
            entries: message.entries,
            ideTarget: message.ideTarget,
            force: message.force,
            session: this.deps.session,
            workspaceState: this.deps.workspaceState,
            tree: this.deps.tree,
            onProgress: (current, total, label) => {
              this.post({ type: "installProgress", current, total, label });
            },
          });
          this.post({ type: "installComplete", results });
          break;
        }
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error);
      this.post({ type: "error", message: text });
    }
  }

  private async handleSearch(
    scope: MarketplaceScope,
    query: string,
    take = 40,
  ): Promise<void> {
    const apiUrl = getApiUrl();
    const token = await this.deps.session.getToken();
    let items: CartItemEntry[] = [];
    let profiles: CartProfileEntry[] = [];
    let collections: CartCollectionEntry[] = [];

    const wantsItems =
      scope === "all" ||
      scope === "skill" ||
      scope === "agent" ||
      scope === "mcp" ||
      scope === "doc";
    const wantsProfiles = scope === "all" || scope === "profiles";
    const wantsCollections = scope === "all" || scope === "collections";

    if (wantsItems) {
      const catalog = await searchCatalog({
        apiUrl,
        q: query,
        type: scope === "all" ? "all" : scope,
        take,
      });
      items = catalog.items.map(toItemEntry);
    }

    if (wantsProfiles) {
      const result = await searchMarketplaceProfiles({
        apiUrl,
        q: query,
        take,
        token,
      });
      profiles = result.profiles.map((profile) => ({
        kind: "profile" as const,
        key: cartProfileKey(profile.username, profile.slug),
        username: profile.username,
        slug: profile.slug,
        name: profile.name,
        description: profile.description,
      }));
    }

    if (wantsCollections) {
      const result = await searchMarketplaceCollections({
        apiUrl,
        q: query,
        take,
        token,
      });
      collections = result.collections.map((collection) => ({
        kind: "collection" as const,
        key: cartCollectionKey(collection.id),
        id: collection.id,
        name: collection.name,
        type: collection.type,
        description: collection.description,
      }));
    }

    this.post({
      type: "searchResult",
      scope,
      query,
      items,
      profiles,
      collections,
    });
  }

  private getHtml(webview: vscode.Webview): string {
    const nonce = randomBytes(16).toString("base64");
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "dist",
        "webview",
        "main.js",
      ),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "dist",
        "webview",
        "styles.css",
      ),
    );

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data:; font-src ${webview.cspSource};" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="${styleUri}" />
  <title>MCS Marketplace</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}
