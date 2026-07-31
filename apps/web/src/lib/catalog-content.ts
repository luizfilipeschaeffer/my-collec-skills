/**
 * Canonical apply payloads for built-in MCS catalog items.
 * Used by the web catalog and by DB/backfill scripts.
 */
export const catalogContents: Record<string, string> = {
  "nextjs-app-router": `# Next.js App Router

Use Server Components by default. Prefer Route Handlers for APIs and keep Client Components only for interactivity.

## Checklist
- Prefer \`async\` Server Components for data fetching
- Use Route Handlers for mutations and public APIs
- Colocate loading/error UI with the route segment
- Validate request/response payloads with Zod
`,
  "prisma-schema-conventions": `# Prisma Schema Conventions

Keep schemas explicit, relational, and migration-safe.

## Checklist
- Define both sides of every relation
- Prefer \`cuid()\` string IDs or autoincrement integers consistently
- Add \`createdAt\` / \`updatedAt\`
- Index frequently filtered fields
- Use \`@unique\` / \`@@unique\` for uniqueness constraints
`,
  "shadcn-ui-patterns": `# shadcn/ui Patterns

Compose UI from primitives instead of inventing parallel component systems.

## Checklist
- Prefer composition over large one-off wrappers
- Keep forms with validated controlled inputs
- Reuse theme tokens and CSS variables
- Avoid nested card clutter in hero/marketing surfaces
`,
  "tailwind-layout": `# Tailwind Layout Systems

Use spacing, grids, and responsive utilities as a single system.

## Checklist
- Prefer one spacing scale
- Use CSS grid / flex for structure, not absolute positioning by default
- Test mobile and desktop reading order
- Prefer logical properties for direction-aware layout
`,
  "authjs-oauth": `# Auth.js OAuth Flows

Configure OAuth providers with secure callbacks and session strategy.

## Checklist
- Register exact production callback URLs
- Keep \`AUTH_SECRET\` and provider secrets out of git
- Prefer JWT or database sessions intentionally
- Validate account linking and email claims
`,
  "api-route-design": `# API Route Design

Keep App Router APIs consistent and typed.

## Checklist
- Validate input with Zod
- Return stable error shapes
- Prefer REST-ish resource routes
- Document auth requirements per endpoint
`,
  "postgres-indexing": `# PostgreSQL Indexing

Index for real query patterns, not every column.

## Checklist
- Index foreign keys used in joins/filters
- Prefer composite indexes matching WHERE + ORDER BY
- Avoid redundant indexes
- Review slow queries with EXPLAIN
`,
  "a11y-checklists": `# Accessibility Checklists

Ship usable interfaces for keyboard and assistive tech.

## Checklist
- Visible focus states
- Labels for every control
- Sufficient contrast
- Keyboard operability for dialogs and menus
`,
  "secure-secrets": `# Secrets & Env Hygiene

Never commit secrets. Rotate anything exposed.

## Checklist
- Keep \`.env*\` gitignored
- Use distinct secrets per environment
- Rotate after accidental exposure
- Prefer platform secret stores in production
`,
  "cursor-skills-authoring": `# Cursor Skills Authoring

Write SKILL.md files that are actionable and scoped.

## Checklist
- Clear name and description
- Concrete steps and checklists
- Prefer examples over vague advice
- Keep one primary job per skill
`,
  "code-reviewer": `# Code Reviewer

Review for correctness, regressions, and test gaps.

## Focus
- Behavioral regressions
- Missing tests for critical paths
- Error handling and edge cases
- Unnecessary complexity
`,
  "security-reviewer": `# Security Reviewer

Review auth, secrets, and OWASP Top 10 risks.

## Focus
- Authn/authz gaps
- Secret leakage
- Injection and XSS surfaces
- Unsafe redirects and callbacks
`,
  "prisma-migrator": `# Prisma Migrator

Plan and review Prisma migrations with minimal downtime risk.

## Focus
- Additive vs destructive changes
- Backfill order
- Index creation strategy
- Rollback notes
`,
  "ux-copy-editor": `# UX Copy Editor

Improve microcopy, empty states, and CTAs.

## Focus
- Clarity over cleverness
- Action-oriented CTAs
- Helpful empty and error states
- Consistent terminology
`,
  "test-strategist": `# Test Strategist

Prioritize unit, integration, and smoke coverage.

## Focus
- Critical user journeys first
- Regression-prone modules
- Deterministic fixtures
- Fast smoke suite for CI
`,
  "api-contract-guardian": `# API Contract Guardian

Protect clients from breaking API changes.

## Focus
- Required field additions/removals
- Status code consistency
- Auth requirements
- Payload shape stability
`,
};

export const catalogMcpServers: Record<
  string,
  { command: string; args: string[] }
> = {
  "io.github.modelcontextprotocol/server-filesystem": {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "."],
  },
  "io.github.modelcontextprotocol/filesystem": {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "."],
  },
  "server-filesystem": {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "."],
  },
  "io.github.modelcontextprotocol/server-github": {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
  },
  "server-github": {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
  },
  "io.github.modelcontextprotocol/server-postgres": {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-postgres"],
  },
  "server-postgres": {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-postgres"],
  },
  "io.github.modelcontextprotocol/server-memory": {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
  },
  "server-memory": {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
  },
  "io.github.modelcontextprotocol/server-brave-search": {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-brave-search"],
  },
  "server-brave-search": {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-brave-search"],
  },
  "vercel-mcp": {
    command: "npx",
    args: ["-y", "vercel-mcp"],
  },
  "prisma-mcp": {
    command: "npx",
    args: ["-y", "@prisma/mcp-server"],
  },
  "stripe-mcp": {
    command: "npx",
    args: ["-y", "@stripe/mcp"],
  },
};
