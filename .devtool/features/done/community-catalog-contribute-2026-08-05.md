---
id: "community-catalog-contribute-2026-08-05"
status: "done"
priority: "high"
assignee: null
dueDate: null
created: "2026-08-05T13:10:00.000Z"
modified: "2026-08-05T13:25:00.000Z"
completedAt: "2026-08-05T13:25:00.000Z"
labels: ["web", "catalog", "community"]
order: "a0"
---

# Contribuição comunitária no catálogo

Usuários autenticados publicam skills, agents, MCPs e docs no catálogo global, com categoria/subcategoria existente ou nova (find-or-create global).

## Escopo

- CRUD autenticado de `CatalogEntry` com `source = community`
- Find-or-create de Category / SubCategory
- Sync não sobrescreve contribuições
- UI em `/catalog/new`, filtros no catálogo e aba Meus itens

## Critérios de pronto

- [x] Usuário autenticado publica item e ele aparece em `/catalog`
- [x] Dono edita e remove o próprio item
- [x] Nova categoria/subcategoria vira taxonomia global
- [x] Cron/sync não altera entradas community
