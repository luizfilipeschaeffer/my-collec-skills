/**
 * Help text for humans and AI agents using my-collec-skills.
 * Keep this file as the single source of truth for CLI usage docs.
 */

export const CLI_NAME = "mcs";
export const PACKAGE_NAME = "my-collec-skills";
export const CLI_VERSION = "0.1.0";

export function getHelpText(): string {
  return `
${PACKAGE_NAME} (${CLI_NAME}) v${CLI_VERSION}
My Collec Skills — install AI-ready profiles (skills, agents, MCPs, docs, extensions).

USAGE
  npx ${PACKAGE_NAME} <command> [options]
  bunx ${PACKAGE_NAME} <command> [options]
  pnpm dlx ${PACKAGE_NAME} <command> [options]
  ${CLI_NAME} <command> [options]          # after global/local install

COMMANDS
  install   Fetch a public profile manifesto and apply it to the current workspace
  help      Show this help (also: -h, --help)
  version   Show version (also: -v, --version)

INSTALL
  npx ${PACKAGE_NAME} install --username <user> --perfil <slug> [options]
  bunx ${PACKAGE_NAME} install --username <user> --perfil <slug> [options]

  Required:
    --username <user>   Profile owner username on My Collec Skills
    --perfil <slug>     Profile slug (URL segment), e.g. nextjs-prisma

  Options:
    --api-url <url>     API base URL (default: env MCS_API_URL or http://localhost:3000)
    --dry-run           Validate and report without writing files
    --force             Overwrite existing files when content differs
    --ide <target>      Target IDE: cursor | vscode (default: cursor)

EXAMPLES
  # Preview what would be applied (safe)
  npx ${PACKAGE_NAME} install --username demo --perfil nextjs-prisma --dry-run
  bunx ${PACKAGE_NAME} install --username demo --perfil nextjs-prisma --dry-run

  # Apply a public profile into the current workspace
  npx ${PACKAGE_NAME} install --username alice --perfil nextjs-prisma

  # Point to a remote / production API
  npx ${PACKAGE_NAME} install --username alice --perfil nextjs-prisma \\
    --api-url https://your-mcs-app.example.com

  # Force overwrite + VS Code layout
  bunx ${PACKAGE_NAME} install --username alice --perfil nextjs-prisma \\
    --force --ide vscode

WHAT IT DOES
  1. GET {api}/api/profiles/{username}/{slug}/manifest
  2. Validates Profile Manifest v1 (my-collec-skills-manifest)
  3. Applies to the workspace via my-collec-skills-apply-engine:
       skills  → .cursor/skills/<id>/SKILL.md
       agents  → .cursor/agents/<id>.md
       mcps    → .cursor/mcp.json (safe merge)
       docs    → .mcs/docs.json
       extensions → reported (not auto-installed)

ENVIRONMENT
  MCS_API_URL   Base URL of the My Collec Skills API (no trailing slash required)

EXIT CODES
  0  Success (no apply failures)
  1  Usage / invalid arguments
  2  Network / profile not found / API error
  3  Manifest validation failed
  4  Apply completed with one or more failures

FOR AI AGENTS
  - Prefer: npx ${PACKAGE_NAME} … or bunx ${PACKAGE_NAME} … (do not use bare "npx mcs";
    the npm package name "mcs" is unrelated).
  - Always pass --username and --perfil.
  - Use --dry-run first when unsure about workspace writes.
  - Default API is localhost:3000; set --api-url or MCS_API_URL for deployed apps.
  - Idempotent apply: re-running skips identical content unless --force.
  - Programmatic API: import { runInstall } from "${PACKAGE_NAME}"

MORE
  Docs: https://github.com/luizfilipeschaeffer/my-collec-skills
  Publish guide: docs/PUBLISH.md in the monorepo
`.trimStart();
}

export function printHelp(stream: NodeJS.WritableStream = process.stdout): void {
  stream.write(`${getHelpText()}\n`);
}
