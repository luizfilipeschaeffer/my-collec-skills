---
id: "collections-by-category-2026-07-30"
status: "done"
priority: "critical"
assignee: null
dueDate: null
created: "2026-07-30T16:00:00.000Z"
modified: "2026-07-30T17:08:00.000Z"
completedAt: "2026-07-30T17:08:00.000Z"
labels: ["domain", "p0"]
order: "a3"
---

# Coleções por categoria / subcategoria

Coleções tipadas (`skill` | `agent` | `mcp`) com taxonomia em dois níveis, reutilizáveis em profiles.

## Escopo

- CRUD Category / SubCategory (seeds iniciais)
- CRUD Collection com `type` + `categoryId` + `subcategoryId` obrigatórios
- CollectionItems e anexar coleção a N profiles
- Mesma árvore de categorias para os três tipos

## Critérios de pronto

- [x] Seeds: ui, ux, accessibility, database, cybersecurity + subcategorias
- [x] Validação: subcategoria pertence à categoria
- [x] UI/API para criar coleção e anexar ao profile

## Referências

- PRD: [`docs/PRD.md`](../../../docs/PRD.md) §6
