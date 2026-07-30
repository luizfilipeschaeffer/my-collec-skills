# Extensão IDE — My Collec Skills (MCS)

Extensão **Cursor / VS Code** (API VS Code) para instalar e gerenciar profiles MCS no workspace ativo, reutilizando `@mcs/manifest` e `@mcs/apply-engine`.

## Requisitos

- Node.js 20+
- pnpm (workspace do monorepo)
- Pacotes `@mcs/manifest` e `@mcs/apply-engine` no monorepo

## Scripts

```bash
# na raiz do monorepo
pnpm install

# neste pacote
cd apps/extension
pnpm run check      # typecheck
pnpm run test       # vitest
pnpm run build      # bundle → dist/extension.cjs
pnpm run package    # gera .vsix (vsce)
```

## Desenvolvimento no Cursor / VS Code

### Opção A — Extension Development Host

1. Abra o monorepo no Cursor ou VS Code.
2. Em `apps/extension`:

   ```bash
   pnpm run build
   # ou: pnpm run watch
   ```

3. Crie um launch config (exemplo) em `.vscode/launch.json` na raiz ou nesta pasta:

   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Run MCS Extension",
         "type": "extensionHost",
         "request": "launch",
         "args": ["--extensionDevelopmentPath=${workspaceFolder}/apps/extension"]
       }
     ]
   }
   ```

4. Inicie **Run MCS Extension** (F5). Uma nova janela Extension Development Host abre com a extensão carregada.
5. Abra uma pasta de workspace na janela de desenvolvimento.
6. Use a Activity Bar **MCS** ou a Command Palette:
   - `MCS: Install Profile`
   - `MCS: Manage Collections`
   - `MCS: Login` / `MCS: Logout`

### Opção B — Instalar VSIX

```bash
cd apps/extension
pnpm run package
```

No Cursor / VS Code: **Extensions → … → Install from VSIX…** e selecione o `.vsix` gerado.

## Configuração

| Setting | Default | Descrição |
| --- | --- | --- |
| `mcs.apiUrl` | `http://localhost:3000` | Base URL da app web / Profile API |

Settings → procure por **My Collec Skills**.

## Fluxo Install Profile

1. Informa `username` e `slug` (input boxes).
2. `GET {mcs.apiUrl}/api/profiles/:username/:slug/manifest`
3. Valida com `parseProfileManifest` (`@mcs/manifest`)
4. Aplica com `applyProfile` (`@mcs/apply-engine`) no workspace ativo
5. Atualiza a TreeView com status **aplicado** / **pendente**

Token opcional (Bearer) lido do **SecretStorage** após `MCS: Login`.

## Login OAuth

`MCS: Login` abre a URL OAuth da web (`/api/auth/signin/github` ou `gitlab`) no browser e permite colar um token/sessão opcional no SecretStorage da IDE.

## UI

Apenas UI nativa da IDE: Activity Bar, TreeView, Command Palette, InputBox, QuickPick, notificações. Sem Webview no MVP.
