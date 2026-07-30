---
id: "apply-profile-local-2026-07-30"
status: "done"
priority: "critical"
assignee: null
dueDate: null
created: "2026-07-30T16:00:00.000Z"
modified: "2026-07-30T17:08:00.000Z"
completedAt: "2026-07-30T17:08:00.000Z"
labels: ["core", "p0"]
order: "aC"
---

# Apply profile local

Motor compartilhado `@mcs/apply-engine`: manifesto validado → apply no workspace local.

## Escopo

- Pacote `@mcs/apply-engine` (sem dependência de Next.js/UI)
- Entrada: manifesto + opções (`ide`, `cwd`, `force`, `dryRun`)
- Saída: relatório aplicado / pulado / falhou
- Consumido pela CLI e pela extensão IDE

## Critérios de pronto

- [x] Aplica skills, agents, MCPs, docs refs e extensões conforme manifesto
- [x] Relatório estruturado reutilizável (CLI + extensão)
- [x] Testes unitários do fluxo feliz e dry-run

## Referências

- PRD: [`docs/PRD.md`](../../../docs/PRD.md) §11
- Stack: [`docs/STACK.md`](../../../docs/STACK.md) §11
- Usado por: `cli-mcs-install`, `ide-extension-mcs`
