# Extensão IDE — My Collec Skills Marketplace

Extensão **Cursor / VS Code / Trae** com painel Marketplace aberto como **aba do editor**. Busque e selecione skills, agents, MCPs, docs, profiles e coleções; instale em lote no workspace.

## Hosts suportados

| Host | Layout de arquivos (auto) |
| --- | --- |
| Cursor | `.cursor/skills`, `.cursor/agents`, `.cursor/mcp.json` |
| VS Code | `.github/skills`, `.github/agents`, `.vscode/mcp.json` |
| Trae / Windsurf / outros forks | layout VS Code |

Override: `mcs.ideTarget` = `auto` \| `cursor` \| `vscode` \| `both`.

## Scripts

```bash
pnpm install
cd apps/extension
pnpm run check
pnpm run test
pnpm run build
pnpm run package   # gera .vsix
```

## Instalar localmente (Cursor)

```powershell
pnpm --filter mcs-extension package
cursor --install-extension "D:\Projetos-locais\my-collec-skills\apps\extension\mcs-extension-0.3.0.vsix" --force
```

Ou: **Extensions → … → Install from VSIX…**

Depois: **Reload Window** → Command Palette → `MCS: Open Marketplace`.

## Painel Marketplace

O comando `MCS: Open Marketplace` abre uma aba no editor com:

- navegação: Tudo / Skills / Agents / MCPs / Docs / Profiles / Coleções
- busca e cards selecionáveis (checkbox)
- carrinho multiseleção à direita
- target IDE + opção force
- **Instalar selecionados** (lote, com progresso)

Profiles e coleções **públicas** aparecem sem login. Recursos privados do usuário aparecem após `MCS: Login` com token `mcs_*`.

## Configuração

| Setting | Default | Descrição |
| --- | --- | --- |
| `mcs.apiUrl` | `https://my-collec-skills.vercel.app` | Base da API MCS |
| `mcs.ideTarget` | `auto` | Layout de apply |

## Comandos

| Comando | Uso |
| --- | --- |
| `MCS: Open Marketplace` | Abre o painel (principal) |
| `MCS: Search Catalog` | Abre o painel com foco na busca |
| `MCS: Install Profile` | Profile completo (secundário) |
| `MCS: Login` / `Logout` | Token opcional |
| `MCS: Refresh` | Atualiza a TreeView da Activity Bar |

## APIs usadas

- `GET /api/catalog`
- `GET /api/marketplace/profiles`
- `GET /api/marketplace/collections`
- `GET /api/marketplace/collections/:id/manifest`
- `GET /api/profiles/:user/:slug/manifest`
