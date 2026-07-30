# My Collec Skills

> Build in public — montando uma biblioteca de perfis de desenvolvimento com skills, agents, MCPs e extensões de IDE.

**My Collec Skills** é um MVP híbrido: uma app web para criar, organizar e compartilhar **perfis completos** de ambiente AI-ready, e um fluxo para **aplicar** esse perfil no ambiente local (começando pelo Cursor).

A ideia é simples: com poucos cliques, o desenvolvedor monta um pacote pronto para uma stack ou necessidade — e pode compartilhar com o time.

---

## O problema

Configurar skills, agents, MCPs, documentações e extensões de IDE do zero, a cada projeto ou máquina, é lento e difícil de padronizar.

Falta um jeito leve de:

- empacotar um “perfil” por stack/necessidade
- organizar itens em coleções reutilizáveis
- compartilhar e aplicar isso com poucos passos

## A proposta

| Capacidade | O que faz |
| --- | --- |
| **Profiles** | Pacotes nomeados (ex.: “Next.js + Prisma + Neon”) |
| **Collections** | Coleções por **categoria + subcategoria** para **skills**, **agents** e **MCPs** |
| **Connectors** | Busca direta em bibliotecas de skills, docs e registries de MCPs |
| **IDE extensions** | Extensões pré-selecionadas por IDE (Cursor / VS Code / JetBrains / Nova / windsurf) |
| **Share + Apply** | Compartilhar perfil e aplicar no ambiente local |
| **CLI `@mcs/cli`** | Install sem fricção: `npx @mcs/cli install --username <user> --perfil <slug>` |
| **Extensão IDE `mcs`** | Painel na IDE para gerenciar skills/coleções/profiles e apply local |

### Coleções por categoria

O mesmo padrão vale para **skills**, **agents** e **MCPs**:

1. Buscar no conector  
2. Selecionar itens  
3. Escolher **categoria → subcategoria** e agrupar em uma coleção  
4. Anexar a coleção a um ou mais profiles  

**Categorias iniciais (seed, alinhadas a [skills.sh/topic](https://www.skills.sh/topic)):**  
Frontend & React · Next.js · Design & UI · Mobile · Agent workflows · Databases · Testing · Marketing · Accessibility · Cybersecurity · MCP Integrations · Documentation  

**Subcategorias (exemplos):** Databases/Prisma · Design & UI/Components · Cybersecurity/OWASP · MCP Integrations/Filesystem  

*(extensíveis; mesma árvore para skills, agents e MCPs)*

---

## Stack do MVP

Documentação completa: [`docs/STACK.md`](docs/STACK.md)

| Camada | Escolha |
| --- | --- |
| Monorepo | **pnpm workspaces** (+ Turborepo opcional) |
| App web | **Next.js** (App Router) + híbrido (montar/compartilhar na web + apply local) |
| UI | **100% [shadcn/ui](https://ui.shadcn.com)** + Tailwind |
| Auth | **Auth.js** — OAuth **GitHub** e **GitLab** |
| API | Route Handlers + **Zod** |
| Banco local | **Docker + PostgreSQL** |
| ORM | **Prisma** |
| CLI `mcs` | TypeScript + citty (publicável no npm) |
| Extensão IDE | VS Code Extension API (**Cursor**-first) |
| Núcleo | `@mcs/apply-engine` + `@mcs/manifest` |

### Fontes externas (conectores)

- Bibliotecas / repositórios de skills (Cursor & community)
- Documentações oficiais e de stack
- [MCP Registry](https://registry.modelcontextprotocol.io/)
- [Cursor Marketplace](https://cursor.com/marketplace)
- [cursor.directory](https://cursor.directory)

---

## Como funciona (visão)

```text
Login (GitHub / GitLab)
        │
        ▼
Buscar skills / agents / MCPs / docs
        │
        ▼
Criar coleções por categoria / subcategoria
        │
        ▼
Montar Profile (+ extensões por IDE)
        │
        ├──► Compartilhar (link / export)
        ├──► Aplicar via CLI mcs
        └──► Aplicar via extensão IDE mcs
```

### Install via CLI (`mcs`)

Mesma mentalidade de `npm` / `pnpm` / `bun` / `yarn install` — um comando e o ambiente sobe:

```bash
# Pacote npm: @mcs/cli (binário: mcs)
# Evita colisão com o pacote npm "mcs" não relacionado.
npx @mcs/cli install --username alice --perfil nextjs-prisma

# Desenvolvimento local
pnpm --filter @mcs/cli build
node packages/cli/dist/bin.js install \
  --username demo --perfil nextjs-prisma \
  --api-url http://localhost:3000 --dry-run
```

`mcs` = **My Collec Skills**. Flags MVP: `--username` e `--perfil`.

### Extensão de IDE (`mcs`)

Extensão própria (Cursor-first, compatível com VS Code) para gerenciar sem sair do editor:

- login GitHub / GitLab  
- listar profiles e coleções (categoria → subcategoria)  
- aplicar profile no workspace local  
- ver o que já está aplicado vs pendente  
- comandos na Command Palette (`MCS: Install Profile`, etc.)

CLI e extensão compartilham o mesmo motor de apply e o manifesto do profile.

---

## Status do build (público)

O MVP integrado está implementado e validado localmente.

| Etapa | Status |
| --- | --- |
| Planejamento / PRD | Feito — [`docs/PRD.md`](docs/PRD.md) |
| Stack técnica (`docs/STACK.md`) | Feito |
| README (build in public) | Feito |
| Kanban de features (`.devtool/features/`) | Feito |
| Docker + Postgres + Prisma (schema inicial) | Feito |
| UI shadcn | Feito |
| Auth GitHub / GitLab | Feito (requer credenciais OAuth) |
| Conectores skills / docs / MCPs | Feito (catálogo + MCP Registry) |
| Coleções por categoria | Feito |
| CLI `mcs install` | Feito |
| Extensão IDE `mcs` | Feito (VSIX gerável) |
| Profiles + share + apply local | Feito |

Documentação:

- Produto: [`docs/PRD.md`](docs/PRD.md)
- Stack: [`docs/STACK.md`](docs/STACK.md)
- Publicar npm/Bun: [`docs/PUBLISH.md`](docs/PUBLISH.md)
- Kanban: [`.devtool/features/`](.devtool/features/)

---

## Fora do escopo (por enquanto)

- Marketplace próprio avançado  
- Monetização  
- Sync multi-device  
- Extensões para JetBrains / Nova / Windsurf nesta fase  
- SSO corporativo além de GitHub/GitLab  
- Banco gerenciado em cloud nesta fase  

---

## Desenvolvimento local

Pré-requisitos:

- Docker  
- Node.js (LTS 20+)  
- Conta GitHub e/ou GitLab (para OAuth fora do modo demo)

```bash
# 1. Subir Postgres
docker compose up -d

# 2. Configurar env (PowerShell: Copy-Item)
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local

# 3. Instalar, migrar, gerar client e popular dados demo
pnpm install
pnpm db:migrate
pnpm db:generate
pnpm db:seed

# 4. Iniciar a aplicação
pnpm dev
```

Acesse `http://localhost:3000`. O modo demo usa `demo/nextjs-prisma`; para OAuth real, preencha `AUTH_GITHUB_*` e/ou `AUTH_GITLAB_*` em `apps/web/.env.local` e desative `MCS_DEMO_MODE`.

### Verificação

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm db:status

# CLI contra a API local
pnpm --filter @mcs/cli build
node packages/cli/dist/bin.js install \
  --username demo --perfil nextjs-prisma \
  --api-url http://localhost:3000 --dry-run

# Extensão instalável
pnpm --filter mcs-extension package
```

Detalhes: [`packages/cli`](packages/cli), [`packages/apply-engine`](packages/apply-engine), [`packages/manifest`](packages/manifest) e [`apps/extension`](apps/extension).

---

## Build in public

Este repositório é construído em aberto:

- decisões de produto e stack ficam documentadas  
- features entram no kanban do projeto  
- commits e PRs contam a história do MVP  

Sugestões, issues e feedback são bem-vindos. Veja também [`CONTRIBUTING.md`](./CONTRIBUTING.md).

---

## Licença

[MIT](./LICENSE) © 2026 My Collec Skills contributors.
