import * as vscode from "vscode";
import { buildOAuthSignInUrl } from "../api/client.js";
import type { AuthProvider, SessionStore } from "../auth/session.js";
import { getApiUrl } from "../config.js";
import type { McsTreeProvider } from "../tree/mcsTreeProvider.js";

export async function loginCommand(deps: {
  session: SessionStore;
  tree: McsTreeProvider;
}): Promise<void> {
  const providerPick = await vscode.window.showQuickPick(
    [
      { label: "GitHub", description: "OAuth via app web", provider: "github" as const },
      { label: "GitLab", description: "OAuth via app web", provider: "gitlab" as const },
    ],
    {
      title: "MCS: Login",
      placeHolder: "Escolha o provider OAuth",
      ignoreFocusOut: true,
    },
  );

  if (!providerPick) {
    return;
  }

  const provider: AuthProvider = providerPick.provider;
  const apiUrl = getApiUrl();
  const oauthUrl = buildOAuthSignInUrl(apiUrl, provider);

  await vscode.env.openExternal(vscode.Uri.parse(oauthUrl));

  const token = await vscode.window.showInputBox({
    title: "MCS: Login",
    prompt:
      "Após autenticar no browser, cole o token/sessão opcional (SecretStorage). Deixe vazio para continuar como convidado.",
    password: true,
    ignoreFocusOut: true,
    placeHolder: "token (opcional)",
  });

  if (token?.trim()) {
    await deps.session.setToken(token.trim(), provider);
    void vscode.window.showInformationMessage(
      `MCS: sessão ${provider} salva no SecretStorage.`,
    );
  } else {
    void vscode.window.showInformationMessage(
      "MCS: login aberto no browser. Nenhum token local salvo.",
    );
  }

  deps.tree.refresh();
}

export async function logoutCommand(deps: {
  session: SessionStore;
  tree: McsTreeProvider;
}): Promise<void> {
  await deps.session.clear();
  deps.tree.refresh();
  void vscode.window.showInformationMessage("MCS: sessão removida.");
}
