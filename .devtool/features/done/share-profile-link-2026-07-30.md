---
id: "share-profile-link-2026-07-30"
status: "done"
priority: "high"
assignee: null
dueDate: null
created: "2026-07-30T16:00:00.000Z"
modified: "2026-07-30T17:08:00.000Z"
completedAt: "2026-07-30T17:08:00.000Z"
labels: ["web", "share", "p0"]
order: "a9"
---

# Share profile link

Página pública de share do profile com link e comando de install pronto para copiar.

## Escopo

- Rota pública `/u/[username]/[perfil]` (ou equivalente)
- SSR/SEO básico
- Copiar comando `mcs install --username … --perfil …`
- CTA “Open in IDE” (extensão) quando aplicável

## Critérios de pronto

- [x] Profile público acessível sem login
- [x] Comando CLI gerado corretamente
- [x] Privados retornam 404/403

## Referências

- PRD: [`docs/PRD.md`](../../../docs/PRD.md) §9 J2
