# `mcs` CLI (`my-collec-skills`)

CLI pública do My Collec Skills — instala profiles AI-ready no workspace local.

> **Nota:** o pacote npm se chama `my-collec-skills` (o nome curto `mcs` no npm já está ocupado).
> O binário instalado continua sendo `mcs`.

## Help (humano + IA)

```bash
npx my-collec-skills help
bunx my-collec-skills help
npx my-collec-skills --help
# sem argumentos também mostra o help completo
npx my-collec-skills
```

O help documenta comandos, flags, exemplos `npx`/`bunx`, variáveis de ambiente, exit codes e notas para agentes de IA.

## Uso

```bash
# Após publicar no npm (mesmo registry para Bun):
npx my-collec-skills install --username alice --perfil nextjs-prisma
bunx my-collec-skills install --username alice --perfil nextjs-prisma

# Preview seguro
npx my-collec-skills install --username demo --perfil nextjs-prisma --dry-run

# Desenvolvimento local (monorepo):
pnpm --filter my-collec-skills build
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
| `--ide` | `cursor` \| `vscode`. Se omitido em um terminal interativo, a CLI pergunta qual IDE deve receber o profile. Em CI/agentes, o padrão é `cursor`. |

Fluxo: `GET /api/profiles/:username/:slug/manifest` → `my-collec-skills-manifest` → `my-collec-skills-apply-engine`.

## API programática

```ts
import { runInstall, getHelpText } from "my-collec-skills";

console.log(getHelpText());
await runInstall({ username: "alice", perfil: "nextjs-prisma", dryRun: true });
```

## Scripts

- `pnpm --filter my-collec-skills build`
- `pnpm --filter my-collec-skills test`
- `pnpm --filter my-collec-skills typecheck`

Binário: `mcs` → `dist/bin.js`
