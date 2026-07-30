# My Collec Skills (web)

App Next.js do monorepo — profiles, coleções, catálogo e APIs.

## Desenvolvimento

Na raiz do monorepo:

```bash
pnpm install
pnpm db:up
pnpm db:migrate
pnpm db:generate
pnpm db:seed
pnpm --filter web dev
```

Ou simplesmente `pnpm dev` na raiz.

## Scripts

| Comando | Descrição |
| --- | --- |
| `pnpm --filter web dev` | Dev server |
| `pnpm --filter web build` | Build de produção |
| `pnpm --filter web lint` | ESLint |
| `pnpm --filter web typecheck` | TypeScript |

Documentação do produto: [`../../README.md`](../../README.md), [`../../docs/PRD.md`](../../docs/PRD.md).
