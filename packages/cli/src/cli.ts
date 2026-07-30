import { defineCommand, runMain } from "citty";
import type { IdeTarget } from "my-collec-skills-manifest";
import { CLI_NAME, CLI_VERSION, PACKAGE_NAME, printHelp } from "./help.js";
import { InstallError, runInstall } from "./install.js";
import { resolveIdeTarget } from "./prompt-ide.js";

const ideValues = new Set<IdeTarget>(["cursor", "vscode"]);

function parseIde(value: string | undefined): IdeTarget | undefined {
  if (!value) return undefined;
  if (!ideValues.has(value as IdeTarget)) {
    throw new InstallError(
      `Invalid --ide "${value}". Use cursor or vscode.`,
      1,
    );
  }
  return value as IdeTarget;
}

const installCommand = defineCommand({
  meta: {
    name: "install",
    description:
      "Download and apply a public profile manifesto (skills, agents, MCPs, docs)",
  },
  args: {
    username: {
      type: "string",
      description: "Profile owner username (required)",
      required: true,
    },
    perfil: {
      type: "string",
      description: "Profile slug, e.g. nextjs-prisma (required)",
      required: true,
    },
    "api-url": {
      type: "string",
      description: "Profile API base URL (or MCS_API_URL)",
    },
    "dry-run": {
      type: "boolean",
      description: "Validate and report without writing files",
      default: false,
    },
    force: {
      type: "boolean",
      description: "Overwrite existing differing content",
      default: false,
    },
    ide: {
      type: "string",
      description:
        "Target IDE: cursor | vscode (prompts interactively when omitted)",
    },
  },
  async run({ args }) {
    try {
      const username = String(args.username);
      const perfil = String(args.perfil);
      const apiUrl =
        args["api-url"] === undefined ? undefined : String(args["api-url"]);
      const ide = await resolveIdeTarget(
        parseIde(args.ide === undefined ? undefined : String(args.ide)),
      );

      const result = await runInstall({
        username,
        perfil,
        apiUrl,
        dryRun: Boolean(args["dry-run"]),
        force: Boolean(args.force),
        ide,
      });
      console.log(
        `Installed profile ${result.manifest.username}/${result.manifest.slug} → ${ide}`,
      );
      console.log(result.output);
      process.exitCode = result.exitCode;
    } catch (err) {
      if (err instanceof InstallError) {
        console.error(err.message);
        console.error(
          `\nTip: run \`npx ${PACKAGE_NAME} help\` or \`bunx ${PACKAGE_NAME} help\` for usage.`,
        );
        process.exitCode = err.exitCode;
        return;
      }
      console.error(err instanceof Error ? err.message : String(err));
      process.exitCode = 1;
    }
  },
});

const helpCommand = defineCommand({
  meta: {
    name: "help",
    description: "Show usage for humans and AI agents (npx / bunx)",
  },
  run() {
    printHelp();
  },
});

const versionCommand = defineCommand({
  meta: {
    name: "version",
    description: `Show ${PACKAGE_NAME} version`,
  },
  run() {
    console.log(`${PACKAGE_NAME} ${CLI_VERSION}`);
  },
});

export const main = defineCommand({
  meta: {
    name: CLI_NAME,
    description: `My Collec Skills CLI (${PACKAGE_NAME}) — install AI-ready profiles locally`,
    version: CLI_VERSION,
  },
  subCommands: {
    install: installCommand,
    help: helpCommand,
    version: versionCommand,
  },
  async run() {
    // No subcommand → full help (better DX for `npx my-collec-skills` and AIs)
    printHelp();
  },
});

export function runCli(argv?: string[]): Promise<void> {
  return runMain(main, {
    rawArgs: argv,
    showUsage: async () => {
      // Prefer our AI/human-friendly help over citty's minimal default
      printHelp();
    },
  });
}
