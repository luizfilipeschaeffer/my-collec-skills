---
id: "ide-extension-mcs-2026-07-30"
status: "done"
priority: "critical"
assignee: null
dueDate: null
created: "2026-07-30T16:00:00.000Z"
modified: "2026-07-30T17:08:00.000Z"
completedAt: "2026-07-30T17:08:00.000Z"
labels: ["ide", "extension", "p0"]
order: "aB"
---

# Extensão IDE mcs

Extensão Cursor/VS Code para gerenciar skills/coleções/profiles e apply local sem sair do editor.

## Escopo

- Alvo MVP: Cursor (API VS Code)
- Login GitHub/GitLab na extensão
- Sidebar + Command Palette (`MCS: Install Profile`, `MCS: Manage Collections`)
- Apply via `my-collec-skills-apply-engine` + status aplicado vs pendente

## Critérios de pronto

- [x] Instalável no Cursor (dev/VSIX)
- [x] Listar/buscar profiles e aplicar no workspace
- [x] Mesmo manifesto/motor da CLI

## Referências

- PRD: [`docs/PRD.md`](../../../docs/PRD.md) §8
- Stack: [`docs/STACK.md`](../../../docs/STACK.md) §10
- Depende de: `domain-profile-manifest`, `apply-profile-local`
