import { defineCommand, runMain } from "citty";
import type { IdeTarget } from "@mcs/manifest";
import { InstallError, runInstall } from "./install.js";

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

export const main = defineCommand({
  meta: {
    name: "mcs",
    description: "My Collec Skills — install AI-ready profiles locally",
    version: "0.1.0",
  },
  subCommands: {
    install: defineCommand({
      meta: {
        name: "install",
        description: "Download and apply a public profile manifesto",
      },
      args: {
        username: {
          type: "string",
          description: "Profile owner username",
          required: true,
        },
        perfil: {
          type: "string",
          description: "Profile slug",
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
          description: "Target IDE: cursor | vscode",
          default: "cursor",
        },
      },
      async run({ args }) {
        try {
          const username = String(args.username);
          const perfil = String(args.perfil);
          const apiUrl =
            args["api-url"] === undefined
              ? undefined
              : String(args["api-url"]);
          const result = await runInstall({
            username,
            perfil,
            apiUrl,
            dryRun: Boolean(args["dry-run"]),
            force: Boolean(args.force),
            ide: parseIde(
              args.ide === undefined ? undefined : String(args.ide),
            ),
          });
          console.log(
            `Installed profile ${result.manifest.username}/${result.manifest.slug}`,
          );
          console.log(result.output);
          process.exitCode = result.exitCode;
        } catch (err) {
          if (err instanceof InstallError) {
            console.error(err.message);
            process.exitCode = err.exitCode;
            return;
          }
          console.error(err instanceof Error ? err.message : String(err));
          process.exitCode = 1;
        }
      },
    }),
  },
});

export function runCli(argv?: string[]): Promise<void> {
  return runMain(main, { rawArgs: argv });
}
