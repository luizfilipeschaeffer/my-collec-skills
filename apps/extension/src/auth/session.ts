import type * as vscode from "vscode";

const TOKEN_KEY = "mcs.sessionToken";
const PROVIDER_KEY = "mcs.authProvider";

export type AuthProvider = "github" | "gitlab";

export interface SessionStore {
  getToken(): Promise<string | undefined>;
  setToken(token: string, provider: AuthProvider): Promise<void>;
  clear(): Promise<void>;
  getProvider(): Promise<AuthProvider | undefined>;
}

export function createSessionStore(
  secrets: vscode.SecretStorage,
  globalState: vscode.Memento,
): SessionStore {
  return {
    async getToken() {
      return secrets.get(TOKEN_KEY);
    },
    async setToken(token: string, provider: AuthProvider) {
      await secrets.store(TOKEN_KEY, token);
      await globalState.update(PROVIDER_KEY, provider);
    },
    async clear() {
      await secrets.delete(TOKEN_KEY);
      await globalState.update(PROVIDER_KEY, undefined);
    },
    async getProvider() {
      const value = globalState.get<string>(PROVIDER_KEY);
      if (value === "github" || value === "gitlab") {
        return value;
      }
      return undefined;
    },
  };
}
