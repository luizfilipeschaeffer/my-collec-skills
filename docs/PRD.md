# PRD — My Collec Skills

**Status:** aprovado (MVP)  
**Última atualização:** 2026-07-30  
**Stack técnica:** [`docs/STACK.md`](./STACK.md)  
**Kanban:** [`.devtool/features/`](../.devtool/features/)

---

## 1. Visão

**My Collec Skills** é um MVP híbrido: uma app web para montar, organizar e compartilhar **perfis completos** de ambiente AI-ready (skills, agents, MCPs, docs e extensões de IDE), e um fluxo para **aplicar** esse perfil no ambiente local — via **CLI `mcs`** ou **extensão de IDE `mcs`** (Cursor-first).

### Problema

Configurar skills, agents, MCPs, documentações e extensões de IDE do zero, a cada projeto ou máquina, é lento e difícil de padronizar. Falta um jeito leve de empacotar um “perfil” por stack/necessidade, organizar itens em coleções reutilizáveis, compartilhar e aplicar com poucos passos.

### Proposta de valor

| Capacidade | Valor |
| --- | --- |
| **Profiles** | Pacotes nomeados prontos para uma stack (ex.: “Next.js + Prisma”) |
| **Collections** | Coleções por categoria + subcategoria para skills, agents e MCPs |
| **Connectors** | Busca direta em bibliotecas externas (skills, docs, MCPs) |
| **Share + Apply** | Link público + install local sem fricção |
| **CLI `mcs`** | UX mental de package-manager install |
| **Extensão IDE** | Gerenciar e aplicar sem sair do editor |

### Personas

| Persona | Necessidade |
| --- | --- |
| **Dev individual** | Subir ambiente Cursor/VS Code rápido em projetos novos |
| **Tech lead / time** | Padronizar skills/MCPs/agents entre o time via profile compartilhado |
| **Autor de profile** | Montar e publicar coleções reutilizáveis por stack |

---

## 2. Decisões fechadas (MVP)

| Decisão | Escolha |
| --- | --- |
| Plataforma | Híbrido — web monta/compartilha + apply local |
| IDE principal | **Cursor** (skills, MCPs, agents); extensões modeladas por IDE desde o início |
| Auth | OAuth **GitHub** e **GitLab** (sem email/senha próprio) |
| UI web | **100% shadcn/ui** |
| Banco local | **Docker + PostgreSQL + Prisma** |
| Apply | CLI `mcs` + extensão IDE `mcs` (mesmo motor e manifesto) |
| Stack | Ver [`docs/STACK.md`](./STACK.md) |

### Fora do MVP

- Marketplace próprio avançado, monetização, sync multi-device
- Extensões JetBrains / Nova / Windsurf nesta fase
- SSO corporativo além de GitHub/GitLab
- Banco gerenciado em cloud nesta etapa

---

## 3. Conceitos de domínio

| Conceito | Descrição |
| --- | --- |
| **User** | Conta do desenvolvedor; `username` público usado na resolução CLI/extensão |
| **OAuthAccount** | Vínculo provider (`github` \| `gitlab`) + `providerAccountId` |
| **Profile** | Pacote nomeado (`slug`) com skills, agents, MCPs, docs, extensões e coleções anexadas |
| **Category** | Nível 1 da taxonomia (ex.: UI, Database) |
| **SubCategory** | Nível 2, pertence a uma Category (ex.: UI/Components, Database/Prisma) |
| **Collection** | Agrupamento tipado (`skill` \| `agent` \| `mcp`) com categoria + subcategoria + N itens |
| **CollectionItem** | Item selecionado via conector (`source`, `externalId`, `name`, …) |
| **Skill / MCP / Agent** | Itens de catálogo (via conectores) anexáveis a coleções ou diretamente ao profile |
| **DocSource** | Referência a documentação (URL / stack) |
| **IDE Extension** | Extensão pré-selecionada por IDE-alvo (`cursor` \| `vscode` \| …) |
| **Connector** | Integração de busca com fonte externa |
| **Profile Manifest** | Contrato JSON consumido pela CLI e pela extensão para apply local |

### Relacionamentos (resumo)

```text
User ── owns ──► Profile, Collection
Category ── has ──► SubCategory
Collection ── requires ──► Category + SubCategory
Collection ── contains ──► CollectionItem[]
Profile ── includes ──► Collection[] (via ProfileCollection)
Profile ── may also contain ──► ProfileSkill | ProfileAgent | ProfileMcp | ProfileDoc | ProfileExtension
```

---

## 4. Auth — GitHub / GitLab

- Login OAuth via **Auth.js** (ver stack).
- Providers MVP: GitHub e GitLab.
- Sem email/senha próprio; sem SSO corporativo além desses providers.
- Sessão persistida com `User` + `OAuthAccount` (Prisma).
- Extensão IDE: mesmo providers no fluxo da IDE.
- CLI MVP: resolve profiles **públicos** por `username` + `perfil`; auth na CLI é P1.

**Feature:** [`auth-github-gitlab`](../.devtool/features/auth-github-gitlab-2026-07-30.md)

---

## 5. Conectores externos

Conectores diretos para buscar e selecionar itens no catálogo:

| Tipo | Fontes (MVP / documentadas) |
| --- | --- |
| Skills | Bibliotecas/repositórios públicos (Cursor & community) |
| Docs | URLs / docs oficiais por stack |
| MCPs / LLMs | [MCP Registry](https://registry.modelcontextprotocol.io/), [Cursor Marketplace](https://cursor.com/marketplace), [cursor.directory](https://cursor.directory) |

Fluxo: buscar → selecionar → (opcional) colocar em coleção → anexar ao profile.

**Feature:** [`connectors-skills-docs-mcps`](../.devtool/features/connectors-skills-docs-mcps-2026-07-30.md)

---

## 6. Coleções por categoria / subcategoria (P0)

Mesmo padrão para **skills**, **agents** e **MCPs**:

1. Buscar no conector  
2. Selecionar itens  
3. Escolher **categoria → subcategoria**  
4. Criar/atualizar coleção  
5. (Opcional) anexar a um ou mais profiles  

### Regras

- `Collection.type`: `skill` \| `agent` \| `mcp`
- Toda Collection exige `categoryId` + `subcategoryId` (subcategoria deve pertencer à categoria)
- Subcategorias são **compartilhadas** entre tipos; a Collection diferencia pelo `type`
- Coleções são reutilizáveis e anexáveis a N profiles
- Itens avulsos no Profile (`ProfileSkill` / `ProfileAgent` / `ProfileMcp`) continuam permitidos além das coleções

### Seeds iniciais

**Categorias:** `ui`, `ux`, `accessibility`, `database`, `cybersecurity`

**Subcategorias (exemplos):**

| Category | SubCategories |
| --- | --- |
| UI | Components, DesignSystem, Animation |
| UX | Flows, Research, Copy |
| Accessibility | WCAG, ARIA, Testing |
| Database | PostgreSQL, Prisma, Migrations |
| Cybersecurity | OWASP, Auth, Secrets |

**Feature:** [`collections-by-category`](../.devtool/features/collections-by-category-2026-07-30.md)

---

## 7. CLI `mcs` (P0)

Nome: **`mcs`** (My Collec Skills). Distribuição: pacote publicável; uso via `npx` / `pnpm dlx` / `bunx` / `yarn dlx` ou binário global.

### Comando principal

```bash
mcs install --username <user> --perfil <slug>
```

Equivalentes:

```bash
npx my-collec-skills install --username alice --perfil nextjs-prisma
pnpm dlx my-collec-skills install --username alice --perfil nextjs-prisma
bunx mcs install --username alice --perfil nextjs-prisma
yarn dlx mcs install --username alice --perfil nextjs-prisma
```

### Comportamento

1. Resolve profile público (ou autorizado) por `username` + `perfil` (slug)
2. Baixa e valida o manifesto (`my-collec-skills-manifest`)
3. Aplica no workspace via `my-collec-skills-apply-engine` (skills, agents, MCPs, docs refs, extensões da IDE)
4. Feedback claro no terminal

### Flags

| Fase | Flags |
| --- | --- |
| MVP | `--username` (obrigatório), `--perfil` (obrigatório) |
| P1 | `--dry-run`, `--force`, `--ide cursor\|vscode` |

A web gera o comando pronto para copiar na página de share.

**Feature:** [`cli-mcs-install`](../.devtool/features/cli-mcs-install-2026-07-30.md)

---

## 8. Extensão de IDE `mcs` (P0)

- **Alvo MVP:** Cursor (API compatível com VS Code)
- **P1:** publicar no marketplace VS Code

### Capacidades MVP

- Login / sessão (GitHub ou GitLab) dentro da extensão
- Listar e buscar profiles / coleções (categoria → subcategoria)
- Visualizar skills, agents e MCPs do profile
- **Apply** do profile no workspace (mesmo motor/manifesto da CLI)
- Status aplicado vs pendente
- UX: sidebar/TreeView + Command Palette (`MCS: Install Profile`, `MCS: Manage Collections`, …)

CLI e extensão compartilham **ApplyEngine** e o contrato do manifesto.

**Feature:** [`ide-extension-mcs`](../.devtool/features/ide-extension-mcs-2026-07-30.md)

---

## 9. User journeys MVP

### J1 — Montar profile na web

1. Login GitHub ou GitLab  
2. Buscar skills/agents/MCPs/docs nos conectores  
3. Criar coleções (categoria → subcategoria)  
4. Montar Profile (+ extensões por IDE)  
5. Marcar como público (opcional)

### J2 — Compartilhar

1. Abrir página de share (`/u/[username]/[perfil]` ou equivalente)  
2. Copiar link ou comando `mcs install …` / “Open in IDE”

### J3 — Apply via CLI

1. No workspace local: `npx my-collec-skills install --username … --perfil …`  
2. Manifesto resolvido → apply → feedback no terminal

### J4 — Apply via extensão

1. Abrir painel MCS na IDE  
2. Login (se necessário) → escolher profile → Apply  
3. Ver status aplicado vs pendente

---

## 10. Requisitos funcionais

### P0 (MVP)

| ID | Requisito | Feature |
| --- | --- | --- |
| RF-01 | Auth OAuth GitHub e GitLab | `auth-github-gitlab` |
| RF-02 | CRUD de Profile na web | `web-profile-crud` |
| RF-03 | Coleções por categoria/subcategoria (skill/agent/mcp) | `collections-by-category` |
| RF-04 | Conectores skills/docs/MCPs | `connectors-skills-docs-mcps` |
| RF-05 | Anexar MCPs e agents ao profile | `profile-mcps-agents` |
| RF-06 | Extensões de IDE no profile | `profile-ide-extensions` |
| RF-07 | Share link público do profile | `share-profile-link` |
| RF-08 | Manifesto JSON do profile | `domain-profile-manifest` |
| RF-09 | CLI `mcs install --username --perfil` | `cli-mcs-install` |
| RF-10 | Extensão IDE MCS (Cursor-first) | `ide-extension-mcs` |
| RF-11 | Motor de apply local compartilhado | `apply-profile-local` |
| RF-12 | UI web 100% shadcn/ui | `ui-shadcn` |
| RF-13 | Postgres local + schema Prisma do domínio | `db-local-docker-prisma` |
| RF-14 | Catálogo/navegação por categorias | `catalog-skills-categories` |

### P1

- Flags CLI `--dry-run`, `--force`, `--ide`
- Publicação extensão no marketplace VS Code
- Auth/token na CLI para profiles privados
- Seeds/UI de gestão de categorias custom do usuário

### Requisitos não-funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | TypeScript strict no monorepo |
| RNF-02 | Validação Zod em API e manifesto |
| RNF-03 | Feedback de apply legível (CLI stderr/stdout; extensão status) |
| RNF-04 | `.env` fora do versionamento; `.env.example` versionado |
| RNF-05 | UI web apenas via shadcn/ui (sem libs de UI concorrentes) |
| RNF-06 | Resolve profile por `User.username` + `Profile.slug` estável |

---

## 11. Arquitetura lógica

```text
Developer
   │
   ├── OAuth ──► apps/web (Next.js + shadcn + Auth.js + Route Handlers)
   │                      │
   │                      ▼
   │                 PostgreSQL (Docker) via Prisma
   │
   ├── npx/pnpm/bun/yarn ──► mcs install ──┐
   │                                       ├──► Profile API ──► Manifest
   └── Extensão IDE MCS ──────────────────┘         │
                                                     ▼
                                              my-collec-skills-apply-engine
                                                     │
                                                     ▼
                                              Cursor / workspace local
```

Detalhe de stack e monorepo: [`docs/STACK.md`](./STACK.md).

**Features relacionadas:** `domain-profile-manifest`, `apply-profile-local`, `cli-mcs-install`, `ide-extension-mcs`

---

## 12. Manifesto JSON do perfil (contrato)

Contrato consumido pela **CLI** e pela **extensão**. Validado por `my-collec-skills-manifest` (Zod).

### Shape conceitual (MVP)

```json
{
  "version": 1,
  "username": "alice",
  "slug": "nextjs-prisma",
  "name": "Next.js + Prisma",
  "collections": [
    {
      "type": "skill",
      "category": "database",
      "subcategory": "prisma",
      "name": "Prisma essentials",
      "items": [
        { "source": "cursor-community", "externalId": "prisma-migrate", "name": "Prisma Migrate" }
      ]
    }
  ],
  "skills": [],
  "agents": [],
  "mcps": [],
  "docs": [],
  "extensions": [
    { "ide": "cursor", "id": "publisher.extension", "name": "Example" }
  ]
}
```

Regras:

- Collections sempre com `category` + `subcategory` (slugs)
- Itens tipados alinhados a `skill` \| `agent` \| `mcp`
- Manifesto é a **única** entrada do ApplyEngine

**Feature:** [`domain-profile-manifest`](../.devtool/features/domain-profile-manifest-2026-07-30.md)

---

## 13. Stack e persistência local

Resumo (fonte de verdade: [`docs/STACK.md`](./STACK.md)):

| Camada | Escolha |
| --- | --- |
| Monorepo | pnpm workspaces |
| Web | Next.js App Router |
| UI | shadcn/ui + Tailwind |
| Auth | Auth.js (GitHub + GitLab) |
| API | Route Handlers + Zod |
| Banco | Docker Compose Postgres + Prisma |
| CLI | `mcs` (TypeScript + citty) |
| Extensão | VS Code Extension API (Cursor-first) |
| Núcleo | `my-collec-skills-apply-engine` + `my-collec-skills-manifest` |

### Bootstrap local (esta fase)

- `docker-compose.yml` — Postgres `5432`, volume, healthcheck
- `.env.example` — `DATABASE_URL`
- `prisma/schema.prisma` + `prisma.config.ts`
- Migration inicial do domínio mínimo

**Feature:** [`db-local-docker-prisma`](../.devtool/features/db-local-docker-prisma-2026-07-30.md)

### Models mínimos

`User`, `OAuthAccount`, `Profile`, `Category`, `SubCategory`, `Collection` (tipada), `CollectionItem`, `ProfileCollection`, `ProfileSkill`, `ProfileMcp`, `ProfileDoc`, `ProfileAgent`, `ProfileExtension`

Convenções: IDs `cuid()`, `createdAt`/`updatedAt`, índices em `slug`/`username`/`categoryId`/`subcategoryId`/`type`, `@@unique([categoryId, slug])` em SubCategory, unique `provider + providerAccountId`.

---

## 14. UI / design system

- Interface web **100% shadcn/ui**
- Componentes via registry/CLI shadcn; compor a partir dos primitives
- Tokens semânticos (`bg-background`, `text-muted-foreground`, `primary`, …)
- Sem Material / Chakra / Ant / MUI / etc.
- Extensão IDE: UI nativa (TreeView, Webview se necessário) — **não** usa shadcn

**Feature:** [`ui-shadcn`](../.devtool/features/ui-shadcn-2026-07-30.md)

---

## 15. Escopo, métricas, riscos e milestones

### Escopo MVP

PRD + kanban + banco local; depois auth, UI shadcn, CRUD, conectores, manifesto, CLI, extensão e apply — conforme features do kanban.

### Não-escopo (esta fase / MVP)

Marketplace avançado, monetização, sync multi-device, IDEs além de Cursor/VS Code, SSO extra, cloud DB gerenciado.

### Métricas de sucesso (iniciais)

- Tempo até primeiro apply bem-sucedido (web → CLI ou extensão) &lt; 10 min para usuário com Docker/Node
- Profile público resolvido por `username`+`slug` com manifesto válido
- Apply idempotente reportando aplicado vs pendente

### Riscos

| Risco | Mitigação |
| --- | --- |
| Fontes externas instáveis (conectores) | Abstrair Connector; cache/fallback de metadados |
| Diferenças Cursor vs VS Code no apply | Feature-flag `--ide`; contrato de manifesto por alvo |
| Escopo de UI crescer fora do shadcn | Gate de review: só primitives shadcn |

### Milestones

| # | Milestone | Critério |
| --- | --- | --- |
| M0 | PRD + kanban + DB local | Este documento + features + Postgres migrado |
| M1 | Web auth + shadcn + CRUD profile/collections | RF-01, RF-02, RF-03, RF-12 |
| M2 | Conectores + manifesto + share | RF-04, RF-07, RF-08 |
| M3 | Apply local (engine + CLI + extensão) | RF-09, RF-10, RF-11 |

---

## 16. Mapa PRD ↔ features (kanban)

| Feature ID | Prioridade | Seção PRD |
| --- | --- | --- |
| [`prd-documento-base`](../.devtool/features/done/prd-documento-base-2026-07-30.md) | P0 | Este documento |
| [`db-local-docker-prisma`](../.devtool/features/done/db-local-docker-prisma-2026-07-30.md) | P0 | §13 |
| [`ui-shadcn`](../.devtool/features/ui-shadcn-2026-07-30.md) | P0 | §14 |
| [`auth-github-gitlab`](../.devtool/features/auth-github-gitlab-2026-07-30.md) | P0 | §4 |
| [`connectors-skills-docs-mcps`](../.devtool/features/connectors-skills-docs-mcps-2026-07-30.md) | P0 | §5 |
| [`collections-by-category`](../.devtool/features/collections-by-category-2026-07-30.md) | P0 | §6 |
| [`domain-profile-manifest`](../.devtool/features/domain-profile-manifest-2026-07-30.md) | P0 | §12 |
| [`web-profile-crud`](../.devtool/features/web-profile-crud-2026-07-30.md) | P0 | §10 RF-02 |
| [`catalog-skills-categories`](../.devtool/features/catalog-skills-categories-2026-07-30.md) | P0 | §10 RF-14 |
| [`profile-mcps-agents`](../.devtool/features/profile-mcps-agents-2026-07-30.md) | P0 | §10 RF-05 |
| [`profile-ide-extensions`](../.devtool/features/profile-ide-extensions-2026-07-30.md) | P0 | §10 RF-06 |
| [`share-profile-link`](../.devtool/features/share-profile-link-2026-07-30.md) | P0 | §9 J2 |
| [`cli-mcs-install`](../.devtool/features/cli-mcs-install-2026-07-30.md) | P0 | §7 |
| [`ide-extension-mcs`](../.devtool/features/ide-extension-mcs-2026-07-30.md) | P0 | §8 |
| [`apply-profile-local`](../.devtool/features/apply-profile-local-2026-07-30.md) | P0 | §11 |

### Critério de pronto (M0)

- [x] PRD completo com decisões fechadas (híbrido, Cursor-first, GitHub/GitLab, conectores, coleções, CLI `mcs`, extensão IDE, Postgres/Prisma/Docker, UI 100% shadcn)
- [x] Kanban com features linkadas a este PRD
- [x] Postgres local via Docker e schema Prisma migrado com models do domínio mínimo

---

## Referências

- [`docs/STACK.md`](./STACK.md) — stack aprovada  
- [`README.md`](../README.md) — visão build in public  
- [shadcn/ui](https://ui.shadcn.com)  
- [Auth.js](https://authjs.dev)  
- [Prisma](https://www.prisma.io)  
- [MCP Registry](https://registry.modelcontextprotocol.io/)  
- [Cursor Marketplace](https://cursor.com/marketplace)  
- [cursor.directory](https://cursor.directory)
