# Contribuindo

Obrigado por contribuir com o My Collec Skills.

## Setup

Siga a seção **Desenvolvimento local** do [README](./README.md).

## Antes de abrir um PR

```bash
pnpm test
pnpm typecheck
pnpm lint
```

## Convenções

- Preferir mudanças pequenas e focadas
- Não commitar `.env`, `.env.local`, `.vercel/` ou tokens
- Documentar decisões relevantes em `docs/` ou no kanban `.devtool/features/`
- CLI público: pacote `@mcs/cli` (binário `mcs`) — não use o pacote npm `mcs` não relacionado

## Publicar no npm / Bun

Os packages `@mcs/manifest`, `@mcs/apply-engine` e `@mcs/cli` são públicos.
Guia completo: [`docs/PUBLISH.md`](./docs/PUBLISH.md).

```bash
pnpm build:packages
pnpm publish:packages:dry   # validar
# pnpm publish:packages     # quando for a hora
```

Consumo com Bun (mesmo registry): `bunx @mcs/cli …` / `bun add @mcs/manifest`.

## Issues e feedback

Abra uma issue descrevendo o problema ou a proposta. PRs com testes e descrição clara têm prioridade.
