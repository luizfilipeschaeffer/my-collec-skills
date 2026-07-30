# Publicar packages My Collec Skills

Pacotes públicos do monorepo (registry npm — também consumíveis via **Bun**):

| Package | Uso | Público |
| --- | --- | --- |
| `my-collec-skills-manifest` | Schema Zod do Profile Manifest | Sim |
| `my-collec-skills-apply-engine` | Apply local do manifesto | Sim |
| `my-collec-skills` | CLI (`mcs` / `npx my-collec-skills` / `bunx my-collec-skills`) | Sim |
| `@mcs/db` | Cliente Prisma interno | Não (`private`) |
| `web` / `mcs-extension` | Apps | Não (`private`) |

> O nome curto `mcs` no npm já está ocupado. O pacote CLI é **`my-collec-skills`**; o binário instalado continua `mcs`.

## Pré-requisitos

1. Conta no [npm](https://www.npmjs.com/) com permissão para publicar os nomes sem scope listados acima.
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

## Publicação em lote (recomendada)

O script da raiz usa o modo `--batch` do pnpm 11 para enviar os três
pacotes em uma única requisição ao npm. Assim, a autenticação em duas
etapas é solicitada apenas uma vez:

```bash
pnpm publish:packages:dry  # valida sem enviar
pnpm publish:packages      # publica tudo com uma autenticação 2FA
```

O `corepack` usa a versão de pnpm definida no `packageManager` da raiz.
O batch é atômico: ou todos os pacotes são publicados, ou nenhum é.

### Publicação individual (fallback)

Se o registry não suportar batch, publique na ordem das dependências:

```bash
pnpm --filter my-collec-skills-manifest publish --access public
pnpm --filter my-collec-skills-apply-engine publish --access public
pnpm --filter my-collec-skills publish --access public
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
npx my-collec-skills help
bunx my-collec-skills help

# npm / pnpm / yarn
npx my-collec-skills install --username alice --perfil nextjs-prisma
pnpm dlx my-collec-skills install --username alice --perfil nextjs-prisma

# Bun
bunx my-collec-skills install --username alice --perfil nextjs-prisma
```

Como dependência de biblioteca:

```bash
pnpm add my-collec-skills-manifest my-collec-skills-apply-engine
# ou
bun add my-collec-skills-manifest my-collec-skills-apply-engine
```

```ts
import { getHelpText, runInstall } from "my-collec-skills";
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

- [ ] Os nomes dos packages continuam disponíveis e você está autenticado no npm
- [ ] `pnpm build:packages` OK
- [ ] dry-run sem erros
- [ ] publish na ordem manifest → apply-engine → cli
- [ ] `npx my-collec-skills --help` e `bunx my-collec-skills --help` funcionam
