# `@mcs/manifest`

Contrato Zod do **Profile Manifest v1** consumido pela CLI `mcs` e pela extensão IDE.

## Uso

```ts
import { parseProfileManifest, ProfileManifestSchema } from "@mcs/manifest";

const manifest = parseProfileManifest(json);
```

## Scripts

- `pnpm build` — emite `dist/`
- `pnpm test` — Vitest
- `pnpm typecheck` — `tsc --noEmit`

## Conteúdo

- Collections tipadas (`skill` | `agent` | `mcp`) com `category` + `subcategory`
- Arrays `skills`, `agents`, `mcps`, `docs`, `extensions`
