---
id: "domain-profile-manifest-2026-07-30"
status: "done"
priority: "high"
assignee: null
dueDate: null
created: "2026-07-30T16:00:00.000Z"
modified: "2026-07-30T17:08:00.000Z"
completedAt: "2026-07-30T17:08:00.000Z"
labels: ["domain", "contract", "p0"]
order: "a4"
---

# Domain profile manifesto

Pacote `@mcs/manifest`: contrato JSON Zod do profile consumido pela CLI e pela extensão.

## Escopo

- Schemas Zod do Profile Manifest (collections com category/subcategory, skills, agents, mcps, docs, extensions)
- Endpoint/API que resolve `username` + `slug` → manifesto
- Validação na borda da API e nos clientes de apply

## Critérios de pronto

- [x] Pacote `@mcs/manifest` com schemas e tipos exportados
- [x] Manifesto inclui collections tipadas com category + subcategory
- [x] GET manifesto por username/slug documentado

## Referências

- PRD: [`docs/PRD.md`](../../../docs/PRD.md) §12
- Stack: [`docs/STACK.md`](../../../docs/STACK.md) §11
