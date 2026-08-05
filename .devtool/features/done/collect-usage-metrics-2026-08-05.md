---
id: "collect-usage-metrics-2026-08-05"
status: "done"
priority: "high"
assignee: null
dueDate: null
created: "2026-08-05T14:10:00.000Z"
modified: "2026-08-05T14:40:00.000Z"
completedAt: "2026-08-05T14:40:00.000Z"
labels: ["web", "catalog", "collections", "social-proof"]
order: "a0"
---

# Métricas de uso e colecionar

Prova social de uso (colecionadores, profiles e coleções) no catálogo e nas galerias, com ação **Colecionar** para anexar uma coleção pública ao profile por referência.

## Escopo

- Contagens por `source + externalId` em skills/MCPs/docs/agents
- Contagens de coleção via `ProfileCollection` (profiles públicos + donos distintos)
- `POST /api/collections/[id]/collect` e `collectionIds` próprias ou públicas
- UI: métricas, badge Popular, sort `popular`, botão Colecionar

## Critérios de pronto

- [x] Cards e detalhe mostram colecionadores, coleções e profiles
- [x] Colecionar anexa a coleção original sem copiar
- [x] Sem profile: diálogo aponta para `/build?collectCollection=`
- [x] Testes das agregações e PRD/kanban atualizados
