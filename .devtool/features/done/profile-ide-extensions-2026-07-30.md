---
id: "profile-ide-extensions-2026-07-30"
status: "done"
priority: "medium"
assignee: null
dueDate: null
created: "2026-07-30T16:00:00.000Z"
modified: "2026-07-30T17:08:00.000Z"
completedAt: "2026-07-30T17:08:00.000Z"
labels: ["domain", "ide", "p0"]
order: "a8"
---

# Profile IDE extensions

Pré-selecionar extensões de IDE no profile, modeladas por IDE-alvo.

## Escopo

- ProfileExtension com `ide` (cursor | vscode | … no modelo)
- MVP foca Cursor; VS Code preparado no schema
- Inclusão no manifesto para apply

## Critérios de pronto

- [x] CRUD de extensões no profile por IDE
- [x] Manifesto inclui `extensions[]`
- [x] Apply engine consome a lista (CLI/extensão)

## Referências

- PRD: [`docs/PRD.md`](../../../docs/PRD.md) §10 RF-06
