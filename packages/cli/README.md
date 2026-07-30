# `mcs` CLI (`@mcs/cli`)

CLI pública do My Collec Skills.

> **Nota:** o pacote npm se chama `@mcs/cli` (o nome curto `mcs` no npm já está ocupado).
> O binário instalado continua sendo `mcs`.

## Uso

```bash
# Após publicar no npm (mesmo registry para Bun):
npx @mcs/cli install --username alice --perfil nextjs-prisma
bunx @mcs/cli install --username alice --perfil nextjs-prisma

# Desenvolvimento local (monorepo):
pnpm --filter @mcs/cli build
node packages/cli/dist/bin.js install \
  --username demo --perfil nextjs-prisma \
  --api-url http://localhost:3000
```

Guia de release: [`docs/PUBLISH.md`](../../docs/PUBLISH.md).

Flags:

- `--username` / `--perfil` (obrigatórios)
- `--api-url` ou `MCS_API_URL`
- `--dry-run` / `--force` / `--ide cursor|vscode`

Fluxo: `GET /api/profiles/:username/:slug/manifest` → `@mcs/manifest` → `@mcs/apply-engine`.

## Scripts

- `pnpm --filter @mcs/cli build`
- `pnpm --filter @mcs/cli test`
- `pnpm --filter @mcs/cli typecheck`

Binário: `mcs` → `dist/bin.js`
