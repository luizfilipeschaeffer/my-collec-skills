# Publicar packages (`@mcs/*`)

Pacotes públicos do monorepo (registry npm — também consumíveis via **Bun**):

| Package | Uso | Público |
| --- | --- | --- |
| `@mcs/manifest` | Schema Zod do Profile Manifest | Sim |
| `@mcs/apply-engine` | Apply local do manifesto | Sim |
| `@mcs/cli` | CLI (`mcs` / `npx @mcs/cli` / `bunx @mcs/cli`) | Sim |
| `@mcs/db` | Cliente Prisma interno | Não (`private`) |
| `web` / `mcs-extension` | Apps | Não (`private`) |

> O nome curto `mcs` no npm já está ocupado. O pacote CLI é **`@mcs/cli`**; o binário instalado continua `mcs`.

## Pré-requisitos

1. Conta no [npm](https://www.npmjs.com/) e organização/scope **`@mcs`** (criar em npm → Organizations, ou pedir acesso).
2. Login local:
   ```bash
   npm login
   # ou
   bun pm login
   ```
3. Builds limpos e checks verdes:
   ```bash
   pnpm test
   pnpm typecheck
   pnpm lint
   pnpm build:packages
   ```

O `pnpm publish` substitui automaticamente `workspace:*` pelas versões publicadas.

## Ordem de publicação

Sempre nesta ordem (dependências primeiro):

1. `@mcs/manifest`
2. `@mcs/apply-engine`
3. `@mcs/cli`

### npm / pnpm (recomendado)

```bash
# Dry-run (não envia)
pnpm --filter @mcs/manifest publish --dry-run --access public
pnpm --filter @mcs/apply-engine publish --dry-run --access public
pnpm --filter @mcs/cli publish --dry-run --access public

# Publicar de verdade
pnpm --filter @mcs/manifest publish --access public
pnpm --filter @mcs/apply-engine publish --access public
pnpm --filter @mcs/cli publish --access public
```

Atalho na raiz (após `pnpm build:packages`):

```bash
pnpm publish:packages:dry   # só dry-run
pnpm publish:packages       # publica os três
```

### Bun

Bun publica no **mesmo registry npm**. Depois do build:

```bash
cd packages/manifest && bun publish --access public
cd ../apply-engine && bun publish --access public
cd ../cli && bun publish --access public
```

Ou, com filtro via shell na raiz (após build):

```bash
bun publish --cwd packages/manifest --access public
bun publish --cwd packages/apply-engine --access public
bun publish --cwd packages/cli --access public
```

> Se o Bun não reescrever `workspace:*`, publique com **pnpm** (recomendado no monorepo) e use Bun só no consumo.

## Consumo (após publicar)

```bash
# Help (humano + IA)
npx @mcs/cli help
bunx @mcs/cli help

# npm / pnpm / yarn
npx @mcs/cli install --username alice --perfil nextjs-prisma
pnpm dlx @mcs/cli install --username alice --perfil nextjs-prisma

# Bun
bunx @mcs/cli install --username alice --perfil nextjs-prisma
```

Como dependência de biblioteca:

```bash
pnpm add @mcs/manifest @mcs/apply-engine
# ou
bun add @mcs/manifest @mcs/apply-engine
```

```ts
import { getHelpText, runInstall } from "@mcs/cli";
```

## Versionamento

Hoje: `0.1.0` nos três packages. Antes de republicar:

1. Subir `version` em `packages/*/package.json` (manter alinhados quando houver breaking change).
2. Atualizar changelog / notas do release no GitHub.
3. Tag git opcional: `v0.1.0`.

## O que não publicar

- Apps (`web`, extensão) — ficam no GitHub / VSIX / deploy
- `.env*`, `.vercel/`, tokens OIDC
- `dist/` gerado localmente (o publish empacota `files: ["dist"]` a partir do build)

## Checklist rápido

- [ ] Scope `@mcs` existe e você tem permissão de publish
- [ ] `pnpm build:packages` OK
- [ ] dry-run sem erros
- [ ] publish na ordem manifest → apply-engine → cli
- [ ] `npx @mcs/cli --help` e `bunx @mcs/cli --help` funcionam
