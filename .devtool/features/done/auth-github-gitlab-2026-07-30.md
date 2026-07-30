---
id: "auth-github-gitlab-2026-07-30"
status: "done"
priority: "high"
assignee: null
dueDate: null
created: "2026-07-30T16:00:00.000Z"
modified: "2026-07-30T17:08:00.000Z"
completedAt: "2026-07-30T17:08:00.000Z"
labels: ["auth", "p0"]
order: "a1"
---

# Auth GitHub e GitLab

Login OAuth via Auth.js com providers GitHub e GitLab (sem email/senha próprio no MVP).

## Escopo

- Auth.js no App Router
- Providers GitHub + GitLab
- Persistência User / OAuthAccount (Prisma adapter)
- Sessão para app web; base para extensão IDE

## Critérios de pronto

- [x] Login/logout funcionando com GitHub e GitLab
- [x] Conta ligada a `User` + `OAuthAccount`
- [x] `username` público disponível para resolução CLI

## Referências

- PRD: [`docs/PRD.md`](../../../docs/PRD.md) §4
- Stack: [`docs/STACK.md`](../../../docs/STACK.md) §6
