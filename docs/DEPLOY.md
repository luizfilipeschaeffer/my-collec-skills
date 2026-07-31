# Deploy (Vercel + Neon)

## Visão geral

- App web: `apps/web` (Next.js) na **Vercel**
- Banco: **Neon** PostgreSQL (`DATABASE_URL`)
- ORM: Prisma (migrations em `prisma/migrations`)

## Segurança

- Nunca commitar `.env` / `.env.local`
- Se uma connection string vazou em chat/issue, **rotacione a senha no Neon** imediatamente
- Em produção, use variáveis do projeto Vercel (Production / Preview / Development)

## Variáveis na Vercel

No projeto Vercel (`Root Directory` = `apps/web`), configure:

| Variável | Produção |
| --- | --- |
| `DATABASE_URL` | Connection string Neon (preferir host **pooler** em serverless) |
| `AUTH_SECRET` | Segredo forte (`openssl rand -base64 32`) |
| `AUTH_URL` | URL canônica, ex. `https://seu-app.vercel.app` |
| `MCS_API_URL` | Mesma URL pública da app |
| `MCS_DEMO_MODE` | `false` |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | OAuth GitHub (callback production) |
| `AUTH_GITLAB_ID` / `AUTH_GITLAB_SECRET` | OAuth GitLab (callback production) |
| `CRON_SECRET` | Segredo para autorizar `/api/cron/catalog-sync` (`Authorization: Bearer …`) |

OIDC Federation (skills.sh): Project → Settings → OIDC → ON.

## Cron diário de catálogo

`apps/web/vercel.json` agenda `GET /api/cron/catalog-sync` às **06:00 UTC** (`0 6 * * *`).

O job:

1. Upsert em `CatalogEntry` (built-in, skills.sh, MCP Registry, Claude Code / Anthropic)
2. Backfill conservador de `metadata.content` / `metadata.server` em profiles/collections **só quando vazios**

Fases opcionais (query): `?phase=builtin|skills-sh|mcp|claude|backfill|all`

Localmente:

```bash
pnpm exec tsx --tsconfig apps/web/tsconfig.json scripts/run-catalog-sync.mts
pnpm exec tsx --tsconfig apps/web/tsconfig.json scripts/run-catalog-sync.mts --phase=claude
```

Ou:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://my-collec-skills.vercel.app/api/cron/catalog-sync?phase=all"
```

O job **não** sobrescreve conteúdo já salvo pelo usuário nem aplica layout Claude (`.claude/skills`) — só materializa o cache.

### Callbacks OAuth

Após o domínio ficar estável:

- GitHub: `https://<domínio>/api/auth/callback/github`
- GitLab: `https://<domínio>/api/auth/callback/gitlab`

## Projeto atual

- Produção: https://my-collec-skills.vercel.app
- Root Directory na Vercel: `apps/web`
- Include files outside root: **Enabled** (necessário para o monorepo pnpm + Prisma)

## CLI Vercel (local)

Link pelo **root do monorepo** (com Root Directory `apps/web` no projeto):

```bash
# na raiz do repo
npx vercel link --yes --scope luizfilipeschaeffers-projects --project my-collec-skills

npx vercel env add DATABASE_URL production
# repita para preview/development e demais vars

# deploy produção
npx vercel --prod --yes --scope luizfilipeschaeffers-projects
```

## Migrations no Neon

Na raiz do monorepo (com `DATABASE_URL` apontando ao Neon):

```bash
pnpm db:generate
pnpm exec prisma migrate deploy
pnpm db:seed   # opcional (dados demo)
```

## Build / deploy

`apps/web/vercel.json` já define install/build para monorepo pnpm + Prisma generate.

```bash
cd apps/web
npx vercel          # preview
npx vercel --prod   # production
```

Ou conecte o repositório GitHub ao projeto Vercel (deploy automático).

## Neon pooler (recomendado em produção)

No console Neon, copie a connection string **pooled** (host com `-pooler`) para `DATABASE_URL` na Vercel. Use a URL **direta** só para `prisma migrate deploy` se o pooler bloquear migrations.
