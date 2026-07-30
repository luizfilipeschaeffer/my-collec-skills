---
id: "web-profile-crud-2026-07-30"
status: "done"
priority: "high"
assignee: null
dueDate: null
created: "2026-07-30T16:00:00.000Z"
modified: "2026-07-30T17:08:00.000Z"
completedAt: "2026-07-30T17:08:00.000Z"
labels: ["web", "p0"]
order: "a5"
---

# Web profile CRUD

Criar, editar, listar e excluir profiles na app web (autenticado).

## Escopo

- CRUD Profile (`name`, `slug`, `isPublic`, descrição)
- Ownership por User
- UI shadcn (forms, tables, dialogs)
- Unique `username` + `slug` para resolução pública

## Critérios de pronto

- [x] Usuário autenticado gerencia seus profiles
- [x] Slug único por usuário
- [x] Flag `isPublic` controla visibilidade no share/CLI

## Referências

- PRD: [`docs/PRD.md`](../../../docs/PRD.md) §10 RF-02
