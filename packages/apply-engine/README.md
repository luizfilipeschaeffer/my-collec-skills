# `my-collec-skills-apply-engine`

Aplica um **Profile Manifest** validado no workspace local (idempotente).

## Uso

```ts
import { applyProfile } from "my-collec-skills-apply-engine";
import { parseProfileManifest } from "my-collec-skills-manifest";

const manifest = parseProfileManifest(json);
const report = await applyProfile(manifest, {
  cwd: process.cwd(),
  ide: "cursor",
  dryRun: false,
  force: false,
});
```

## Efeitos

| Item | Destino |
| --- | --- |
| Skills | `.cursor/skills/<id>/SKILL.md` |
| Agents | `.cursor/agents/<id>.md` |
| MCPs | `.cursor/mcp.json` (merge seguro) |
| Docs | `.mcs/docs.json` |
| Extensions | relatório + comando sugerido (não executa) |

Proteção contra path traversal, escrita atômica e relatório `applied` / `skipped` / `failed`.

## Scripts

- `pnpm build` · `pnpm test` · `pnpm typecheck`
