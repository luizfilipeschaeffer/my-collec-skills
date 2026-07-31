import * as vscode from "vscode";
import { createSessionStore } from "./auth/session.js";
import { installCatalogItemCommand } from "./commands/installCatalogItem.js";
import { installProfileCommand } from "./commands/installProfile.js";
import { loginCommand, logoutCommand } from "./commands/login.js";
import { manageCollectionsCommand } from "./commands/manageCollections.js";
import type { CatalogApiItem } from "./api/client.js";
import {
  MARKETPLACE_VIEW_TYPE,
  MarketplacePanel,
} from "./panel/marketplacePanel.js";
import { McsTreeProvider } from "./tree/mcsTreeProvider.js";

export function activate(context: vscode.ExtensionContext): void {
  const session = createSessionStore(context.secrets, context.globalState);
  const tree = new McsTreeProvider(context.workspaceState, session);

  const panelDeps = {
    session,
    workspaceState: context.workspaceState,
    tree,
  };

  const openMarketplace = (focusQuery = false) =>
    MarketplacePanel.createOrShow(context, panelDeps, { focusQuery });

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("mcs.sidebar", tree),
    vscode.window.registerWebviewPanelSerializer(MARKETPLACE_VIEW_TYPE, {
      async deserializeWebviewPanel(panel) {
        MarketplacePanel.revive(panel, context, panelDeps);
      },
    }),
    vscode.commands.registerCommand("mcs.refresh", () => tree.refresh()),
    vscode.commands.registerCommand("mcs.openMarketplace", () =>
      openMarketplace(false),
    ),
    vscode.commands.registerCommand("mcs.searchCatalog", () =>
      openMarketplace(true),
    ),
    vscode.commands.registerCommand(
      "mcs.installCatalogItem",
      (item?: CatalogApiItem) => {
        if (!item) {
          return openMarketplace(true);
        }
        return installCatalogItemCommand(
          { workspaceState: context.workspaceState, tree },
          item,
        );
      },
    ),
    vscode.commands.registerCommand("mcs.installProfile", () =>
      installProfileCommand({
        session,
        workspaceState: context.workspaceState,
        tree,
      }),
    ),
    vscode.commands.registerCommand("mcs.manageCollections", () =>
      manageCollectionsCommand({
        session,
        workspaceState: context.workspaceState,
        tree,
      }),
    ),
    vscode.commands.registerCommand("mcs.login", () =>
      loginCommand({ session, tree }),
    ),
    vscode.commands.registerCommand("mcs.logout", () =>
      logoutCommand({ session, tree }),
    ),
  );
}

export function deactivate(): void {
  // noop
}
