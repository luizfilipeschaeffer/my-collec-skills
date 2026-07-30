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
| **CLI `mcs`** | Install sem fricção: `mcs install --username <user> --perfil <slug>` |
| **Extensão IDE `mcs`** | Painel na IDE para gerenciar skills/coleções/profiles e apply local |

### Coleções por categoria

O mesmo padrão vale para **skills**, **agents** e **MCPs**:

1. Buscar no conector  
2. Selecionar itens  
3. Escolher **categoria → subcategoria** e agrupar em uma coleção  
4. Anexar a coleção a um ou mais profiles  

**Categorias iniciais (seed):** UI · UX · Accessibility · Database · Cybersecurity  

**Subcategorias (exemplos):** UI/Components · Database/Prisma · Cybersecurity/OWASP · Accessibility/WCAG  

*(extensíveis depois; mesma árvore para skills, agents e MCPs)*

---

## Stack do MVP

| Camada | Escolha |
| --- | --- |
| App web | Híbrido (montar/compartilhar na web + apply local) |
| UI | **100% [shadcn/ui](https://ui.shadcn.com)** |
| Auth | OAuth **GitHub** e **GitLab** |
| Banco local | **Docker + PostgreSQL** |
| ORM | **Prisma** |
| IDE principal | **Cursor** (extensões modeladas por IDE desde o início) |

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
npx mcs install --username alice --perfil nextjs-prisma
pnpm dlx mcs install --username alice --perfil nextjs-prisma
bunx mcs install --username alice --perfil nextjs-prisma
yarn dlx mcs install --username alice --perfil nextjs-prisma
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

Estamos no início. Acompanhe o progresso aqui e nos commits.

| Etapa | Status |
| --- | --- |
| Planejamento / PRD | Em andamento |
| README (build in public) | Feito |
| Kanban de features (`.devtool/features/`) | Pendente |
| Docker + Postgres + Prisma (schema inicial) | Pendente |
| UI shadcn | Pendente |
| Auth GitHub / GitLab | Pendente |
| Conectores skills / docs / MCPs | Pendente |
| Coleções por categoria | Pendente |
| CLI `mcs install` | Pendente |
| Extensão IDE `mcs` | Pendente |
| Profiles + share + apply local | Pendente |

Documentação de produto (quando existir): [`docs/PRD.md`](docs/PRD.md)

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

> Em breve: `docker compose up`, `DATABASE_URL` e migrations Prisma.

Pré-requisitos previstos:

- Docker  
- Node.js  
- Conta GitHub e/ou GitLab (para auth, quando existir)

```bash
# (ainda não disponível — será preenchido no bootstrap)
# docker compose up -d
# cp .env.example .env
# npx prisma migrate dev
```

---

## Build in public

Este repositório é construído em aberto:

- decisões de produto e stack ficam documentadas  
- features entram no kanban do projeto  
- commits e PRs contam a história do MVP  

Sugestões, issues e feedback são bem-vindos.

---

## Licença

A definir.
