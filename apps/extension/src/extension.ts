import * as vscode from "vscode";
import { createSessionStore } from "./auth/session.js";
import { installProfileCommand } from "./commands/installProfile.js";
import { loginCommand, logoutCommand } from "./commands/login.js";
import { manageCollectionsCommand } from "./commands/manageCollections.js";
import { McsTreeProvider } from "./tree/mcsTreeProvider.js";

export function activate(context: vscode.ExtensionContext): void {
  const session = createSessionStore(context.secrets, context.globalState);
  const tree = new McsTreeProvider(context.workspaceState, session);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("mcs.sidebar", tree),
    vscode.commands.registerCommand("mcs.refresh", () => tree.refresh()),
    vscode.commands.registerCommand("mcs.installProfile", () =>
      installProfileCommand({ session, workspaceState: context.workspaceState, tree }),
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
