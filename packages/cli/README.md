# `mcs` CLI (`@mcs/cli`)

CLI pública do My Collec Skills — instala profiles AI-ready no workspace local.

> **Nota:** o pacote npm se chama `@mcs/cli` (o nome curto `mcs` no npm já está ocupado).
> O binário instalado continua sendo `mcs`.

## Help (humano + IA)

```bash
npx @mcs/cli help
bunx @mcs/cli help
npx @mcs/cli --help
# sem argumentos também mostra o help completo
npx @mcs/cli
```

O help documenta comandos, flags, exemplos `npx`/`bunx`, variáveis de ambiente, exit codes e notas para agentes de IA.

## Uso

```bash
# Após publicar no npm (mesmo registry para Bun):
npx @mcs/cli install --username alice --perfil nextjs-prisma
bunx @mcs/cli install --username alice --perfil nextjs-prisma

# Preview seguro
npx @mcs/cli install --username demo --perfil nextjs-prisma --dry-run

# Desenvolvimento local (monorepo):
pnpm --filter @mcs/cli build
node packages/cli/dist/bin.js help
node packages/cli/dist/bin.js install \
  --username demo --perfil nextjs-prisma \
  --api-url http://localhost:3000
```

Guia de release: [`docs/PUBLISH.md`](../../docs/PUBLISH.md).

## Flags (`install`)

| Flag | Descrição |
| --- | --- |
| `--username` | Dono do profile (obrigatório) |
| `--perfil` | Slug do profile (obrigatório) |
| `--api-url` | Base da API (ou `MCS_API_URL`) |
| `--dry-run` | Só valida/reporta, sem escrever |
| `--force` | Sobrescreve conteúdo diferente |
| `--ide` | `cursor` \| `vscode` (default: `cursor`) |

Fluxo: `GET /api/profiles/:username/:slug/manifest` → `@mcs/manifest` → `@mcs/apply-engine`.

## API programática

```ts
import { runInstall, getHelpText } from "@mcs/cli";

console.log(getHelpText());
await runInstall({ username: "alice", perfil: "nextjs-prisma", dryRun: true });
```

## Scripts

- `pnpm --filter @mcs/cli build`
- `pnpm --filter @mcs/cli test`
- `pnpm --filter @mcs/cli typecheck`

Binário: `mcs` → `dist/bin.js`
