# Stack técnica — My Collec Skills

Documento de decisão da stack do MVP. Complementa o [PRD](./PRD.md) (quando existir) e o [README](../README.md).

**Status:** aprovada  
**Última atualização:** 2026-07-30

---

## 1. Princípios

1. **Um ecossistema TypeScript** — web, CLI, extensão IDE e motor de apply compartilham tipos e runtime.
2. **Reúso do apply** — CLI e extensão consomem o mesmo `my-collec-skills-apply-engine` e o mesmo contrato `my-collec-skills-manifest`.
3. **Decisões fechadas do produto** — UI 100% shadcn/ui, auth OAuth GitHub/GitLab, Postgres local via Docker + Prisma, Cursor-first.
4. **MVP enxuto** — preferir bibliotecas oficiais/padrão do ecossistema Next.js; evitar frameworks paralelos de UI ou ORMs concorrentes.

---

## 2. Visão geral

| Camada | Escolha | Papel |
| --- | --- | --- |
| Monorepo | **pnpm workspaces** (+ Turborepo opcional) | Um repo para web, CLI, extensão e pacotes compartilhados |
| App web | **Next.js** (App Router) | Montar/compartilhar profiles; API; páginas de share com SSR |
| UI | **shadcn/ui + Tailwind CSS** | Único design system da web |
| Auth | **Auth.js** (GitHub + GitLab) | Login social sem email/senha próprio |
| API | **Route Handlers + Zod** | Endpoints tipados; validação do manifesto e do domínio |
| Banco | **Docker + PostgreSQL + Prisma** | Persistência local do domínio (User, Profile, Collection, …) |
| CLI `mcs` | **TypeScript + citty** (ou commander) | `mcs install --username --perfil`; publicável no npm |
| Extensão IDE | **VS Code Extension API** (Cursor-first) | Painel + Command Palette; apply sem sair do editor |
| Núcleo crítico | **`my-collec-skills-apply-engine`** | Manifesto → apply no workspace local |
| Tipos/contrato | **`my-collec-skills-manifest`** (Zod schemas) | Fonte de verdade do Profile Manifest |

### Linguagem e runtime

| Item | Escolha |
| --- | --- |
| Linguagem | TypeScript (strict) |
| Runtime Node | Node.js LTS (20+ ou 22+) |
| Package manager | **pnpm** (obrigatório no monorepo) |
| Módulos | ESM onde possível; extensão IDE segue o padrão do VS Code Extension API |

---

## 3. Monorepo

### Layout alvo

```text
my-collec-skills/
├── apps/
│   ├── web/                 # Next.js + shadcn + Auth.js + Prisma client
│   └── extension/           # Extensão Cursor / VS Code
├── packages/
│   ├── cli/                 # Binário `mcs` (publicável)
│   ├── apply-engine/        # my-collec-skills-apply-engine
│   ├── manifest/            # my-collec-skills-manifest (Zod + tipos)
│   └── db/                  # @mcs/db — schema Prisma + client (opcional no bootstrap)
├── docker-compose.yml       # Postgres local
├── .env.example
├── pnpm-workspace.yaml
├── package.json             # scripts raiz
└── docs/
    ├── STACK.md             # este documento
    └── PRD.md
```

### Convenções de pacotes

| Pacote | Nome npm (interno) | Consumidores |
| --- | --- | --- |
| Manifesto | `my-collec-skills-manifest` | web, cli, extension, apply-engine |
| Apply | `my-collec-skills-apply-engine` | cli, extension |
| DB | `@mcs/db` | web (API / server) |
| CLI | `mcs` (binário público) | usuários finais via `npx` / `pnpm dlx` / `bunx` |
| Web | `@mcs/web` (privado) | deploy da app |
| Extension | `@mcs/extension` (privado / VSIX) | Cursor / VS Code |

### Turborepo (opcional)

Adicionar **Turborepo** quando o monorepo tiver builds/testes cruzados suficientes para justificar cache de pipeline (`build`, `lint`, `test`, `typecheck`). No bootstrap inicial, **pnpm workspaces sozinho é suficiente**.

---

## 4. App web — Next.js

### Decisão

- **Next.js App Router** como aplicação principal.
- Server Components por padrão; Client Components só onde houver interação (forms, dialogs, sidebars).
- **Route Handlers** (`app/api/...`) para a Profile API consumida pela CLI e pela extensão.
- Páginas de **share** com SSR/SEO (`/u/[username]/[perfil]` ou equivalente).

### Por quê Next.js

- Integração natural com **shadcn/ui**.
- Auth.js bem suportado no App Router.
- API e UI no mesmo deploy no MVP (menos infra).
- Share links públicos se beneficiam de SSR.

### Não usar no MVP

- Vite SPA como app principal (share/auth/API ficam mais fragmentados).
- Backend Nest/Fastify separado (overhead cedo demais).
- Libraries de UI concorrentes (MUI, Chakra, Ant, etc.).

---

## 5. UI — shadcn/ui + Tailwind

### Regras (obrigatórias)

- Interface web **100% shadcn/ui**.
- Componentes via registry/CLI shadcn (`Button`, `Card`, `Form`, `Dialog`, `Sidebar`, `Table`, `Tabs`, etc.).
- Sem componentes custom que dupliquem primitives do shadcn — **compor** a partir deles.
- Tokens semânticos do tema (`bg-background`, `text-muted-foreground`, `primary`, …).
- Layout com utilitários Tailwind.

### Extensão IDE

A extensão **não** usa shadcn. UI nativa da IDE: TreeView, Webview (se necessário), Command Palette.

---

## 6. Auth — Auth.js

### Providers MVP

- **GitHub** OAuth
- **GitLab** OAuth

Sem email/senha próprio no MVP. Sem SSO corporativo além desses providers.

### Persistência de sessão

- Contas ligadas ao model `User` / `OAuthAccount` (Prisma).
- Adapter Auth.js + Prisma alinhado ao schema do domínio.

### Extensão e CLI

- Extensão: login/sessão OAuth dentro do fluxo da IDE (mesmo providers).
- CLI: resolve profiles **públicos** por `username` + `perfil` no MVP; auth na CLI fica para P1 se necessário (tokens / device flow).

---

## 7. API — Route Handlers + Zod

### Contrato

- Validação de entrada/saída com **Zod**.
- Schemas de domínio e do **Profile Manifest** vivem em `my-collec-skills-manifest` (e, quando fizer sentido, schemas de request em `apps/web`).
- Endpoints principais do MVP (conceituais):

| Método | Recurso | Uso |
| --- | --- | --- |
| `GET` | profile por `username` + `slug` | CLI / extensão (`mcs install`) |
| `GET` | manifesto resolvido do profile | apply local |
| `CRUD` | profiles, collections, items | app web autenticada |
| `GET` | catálogo via conectores | busca na UI |

### Estilo

- JSON + status HTTP claros.
- Erros tipados e mensagens estáveis para a CLI (exit codes + stderr legível).
- **tRPC** fica fora do MVP a menos que a tipagem end-to-end se prove necessária depois.

---

## 8. Banco — Docker + PostgreSQL + Prisma

### Local

- `docker-compose.yml` com serviço `postgres` (porta `5432`, volume, healthcheck).
- `DATABASE_URL` em `.env` (versionar só `.env.example`).
- Prisma para schema, migrations e client.

### Domínio mínimo (alinhado ao PRD)

- `User`, `OAuthAccount`, `Profile`
- `Category`, `SubCategory`, `Collection` (`type`: `skill` | `agent` | `mcp`)
- Itens de coleção e vínculos Profile ↔ Collection / Skill / MCP / Agent / Extension

### Convenções Prisma

- IDs: `cuid()`
- Timestamps: `createdAt` / `updatedAt`
- Índices em `slug`, `username`, `categoryId`, `subcategoryId`, `type`
- Relações bidirecionais com `@relation`
- Uniques: ex. `@@unique([categoryId, slug])` em `SubCategory`; `provider + providerAccountId` em OAuth

### Fora do MVP (nesta fase)

- Banco gerenciado em cloud (Neon, etc.) — pode entrar depois sem trocar o ORM.

---

## 9. CLI — `mcs`

### Distribuição

```bash
npx my-collec-skills install --username <user> --perfil <slug>
pnpm dlx my-collec-skills install --username <user> --perfil <slug>
bunx mcs install --username <user> --perfil <slug>
yarn dlx mcs install --username <user> --perfil <slug>
```

### Implementação

| Item | Escolha |
| --- | --- |
| Linguagem | TypeScript |
| Parser CLI | **citty** (preferência) ou commander |
| Empacotamento | pacote npm com `bin: { "mcs": "..." }` |
| Dependências internas | `my-collec-skills-manifest`, `my-collec-skills-apply-engine` |

### Flags

- **MVP:** `--username`, `--perfil`
- **P1:** `--dry-run`, `--force`, `--ide cursor|vscode`

### Comportamento

1. Resolve profile na API (`username` + `slug`)
2. Baixa/valida o manifesto (`my-collec-skills-manifest`)
3. Aplica no workspace via `my-collec-skills-apply-engine`
4. Feedback claro no terminal (sucesso / pendências / erros)

---

## 10. Extensão IDE — Cursor / VS Code

### Alvo

- **MVP:** Cursor (API compatível com VS Code)
- **P1:** publicar no marketplace VS Code
- Fora desta fase: JetBrains, Nova, Windsurf

### Capacidades MVP

- Login / sessão (GitHub ou GitLab)
- Listar e buscar profiles / coleções (categoria → subcategoria)
- Visualizar skills, agents e MCPs do profile
- **Apply** do profile (mesmo motor da CLI)
- Status aplicado vs pendente
- Command Palette (`MCS: Install Profile`, `MCS: Manage Collections`, …)

### UI

- Sidebar / TreeView + comandos
- Webview apenas se a UX nativa não bastar

---

## 11. `my-collec-skills-manifest` e `my-collec-skills-apply-engine`

### `my-collec-skills-manifest`

- Schemas Zod do **Profile Manifest** (JSON).
- Tipos TypeScript exportados (`z.infer`).
- Inclui collections com `category` + `subcategory`, itens tipados (`skill` | `agent` | `mcp`), refs de docs e extensões de IDE.
- Usado para validar respostas da API e arquivos locais.

### `my-collec-skills-apply-engine`

- Entrada: manifesto validado + opções (`ide`, `cwd`, `force`, `dryRun`).
- Saída: relatório do que foi aplicado / pulado / falhou.
- Efeitos locais: skills, agents, MCPs, docs refs, extensões da IDE-alvo — conforme contrato do manifesto.
- **Sem** dependência do Next.js ou da UI; só Node + FS (+ APIs da IDE quando chamado pela extensão).

```text
API ──► Manifest JSON ──► my-collec-skills-manifest (parse/validate)
                              │
                              ▼
                        my-collec-skills-apply-engine
                           /        \
                      CLI mcs    Extensão IDE
```

---

## 12. Arquitetura lógica

```text
┌─────────────┐     OAuth      ┌──────────────────┐
│  Developer  │───────────────►│  apps/web        │
│             │                │  Next.js+shadcn  │
│             │  share link    │  Auth.js         │
│             │◄───────────────│  Route Handlers  │
└──────┬──────┘                └────────┬─────────┘
       │                                │
       │ npx my-collec-skills / Open in IDE        │ Prisma
       ▼                                ▼
┌──────────────┐                 ┌──────────────┐
│ packages/cli │                 │  PostgreSQL  │
│ apps/ext.    │── GET manifest ─►│  (Docker)    │
└──────┬───────┘                 └──────────────┘
       │
       ▼
┌──────────────────┐
│ my-collec-skills-apply-engine│──► Cursor / workspace local
└──────────────────┘
```

---

## 13. Variáveis de ambiente (conceito)

| Variável | Onde | Uso |
| --- | --- | --- |
| `DATABASE_URL` | web / Prisma | Conexão Postgres |
| `AUTH_SECRET` | web | Auth.js |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | web | OAuth GitHub |
| `AUTH_GITLAB_ID` / `AUTH_GITLAB_SECRET` | web | OAuth GitLab |
| `MCS_API_URL` | cli / extension | Base URL da Profile API (dev/prod) |

Detalhes e exemplos ficam em `.env.example` no bootstrap.

---

## 14. Ordem de bootstrap técnico

1. Monorepo pnpm (`pnpm-workspace.yaml`, apps/packages vazios ou stub)
2. `docker-compose.yml` + `.env.example` + Prisma (`@mcs/db` ou `apps/web`)
3. Migration inicial do domínio mínimo
4. Scaffold `apps/web` (Next.js + Tailwind + shadcn)
5. Auth.js (GitHub + GitLab)
6. CRUD Profile/Collection + endpoint de manifesto
7. `my-collec-skills-manifest` + `my-collec-skills-apply-engine`
8. `packages/cli` (`mcs install`)
9. `apps/extension` consumindo o mesmo motor

A etapa atual do planejamento prioriza **documentação + kanban + base de dados**; UI/auth/CLI/extensão entram em seguida conforme features do kanban.

---

## 15. Alternativas consideradas (adiadas)

| Opção | Motivo para não usar agora |
| --- | --- |
| Vite + React SPA | Share/auth/API mais fragmentados |
| Nest / Fastify separado | Overhead de serviço extra no MVP |
| Drizzle | Prisma já fechado no PRD |
| Better Auth | Auth.js cobre GitHub/GitLab; reavaliar só se travar |
| tRPC | Route Handlers + Zod bastam no início |
| Go/Rust na CLI | Quebra reúso com a extensão TypeScript |
| Turborepo desde o dia 1 | Opcional até o monorepo exigir cache de pipeline |

---

## 16. Critérios de aderência

Uma mudança de stack só entra se:

1. Mantém **um** contrato de manifesto para CLI e extensão, ou
2. Reduz fricção mensurável no apply local / share, ou
3. Desbloqueia RF P0 sem aumentar superfície de UI/ORM concorrente

Qualquer troca deve atualizar este documento e o README na mesma mudança.

---

## Referências

- [README](../README.md) — visão do produto e status do build
- [PRD](./PRD.md) — decisões de produto e domínio
- [shadcn/ui](https://ui.shadcn.com)
- [Auth.js](https://authjs.dev)
- [Prisma](https://www.prisma.io)
- [MCP Registry](https://registry.modelcontextprotocol.io/)
- [Cursor Marketplace](https://cursor.com/marketplace)
