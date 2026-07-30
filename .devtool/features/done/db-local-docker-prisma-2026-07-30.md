---
id: "db-local-docker-prisma-2026-07-30"
status: "done"
priority: "high"
assignee: null
dueDate: null
created: "2026-07-30T16:00:00.000Z"
modified: "2026-07-30T16:23:00.000Z"
completedAt: "2026-07-30T16:23:00.000Z"
labels: ["infra", "db", "p0"]
order: "a0"
---

# DB local Docker + Prisma

Bootstrap de persistência local: Postgres via Docker Compose e schema Prisma do domínio mínimo.

## Escopo

- `docker-compose.yml` (postgres, porta 5432, volume, healthcheck)
- `.env.example` com `DATABASE_URL`
- `prisma/schema.prisma` + `prisma.config.ts`
- Migration inicial: User, OAuthAccount, Profile, Category, SubCategory, Collection tipada, itens e vínculos

## Critérios de pronto

- [x] `docker compose up -d` deixa Postgres healthy
- [x] `prisma migrate status` ok após migration
- [x] Models alinhados ao [PRD §13](../../../docs/PRD.md)

## Entregáveis

- [`docker-compose.yml`](../../../docker-compose.yml)
- [`.env.example`](../../../.env.example)
- [`prisma/schema.prisma`](../../../prisma/schema.prisma)
- [`prisma.config.ts`](../../../prisma.config.ts)
- Migration `20260730162245_init_domain_schema`

## Referências

- PRD: [`docs/PRD.md`](../../../docs/PRD.md) §13
- Stack: [`docs/STACK.md`](../../../docs/STACK.md) §8
