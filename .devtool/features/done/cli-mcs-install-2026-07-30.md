---
id: "cli-mcs-install-2026-07-30"
status: "done"
priority: "critical"
assignee: null
dueDate: null
created: "2026-07-30T16:00:00.000Z"
modified: "2026-07-30T17:08:00.000Z"
completedAt: "2026-07-30T17:08:00.000Z"
labels: ["cli", "p0"]
order: "aA"
---

# CLI mcs install

CLI publicável `mcs` com `mcs install --username --perfil` (UX tipo package-manager install).

## Escopo

- Pacote npm com bin `mcs`
- Comando `install` (flags MVP: `--username`, `--perfil`)
- Resolve manifesto na API → `@mcs/apply-engine`
- Feedback claro no terminal; uso via npx/pnpm dlx/bunx/yarn dlx

## Critérios de pronto

- [x] `npx @mcs/cli install --username <u> --perfil <slug>` aplica profile público
- [x] Erros de rede/validação com exit codes estáveis
- [x] Documentado no README e na página de share

## Referências

- PRD: [`docs/PRD.md`](../../../docs/PRD.md) §7
- Stack: [`docs/STACK.md`](../../../docs/STACK.md) §9
- Depende de: `domain-profile-manifest`, `apply-profile-local`
