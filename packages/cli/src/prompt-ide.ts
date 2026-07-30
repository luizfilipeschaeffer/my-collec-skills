import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { IdeTarget } from "my-collec-skills-manifest";
import { InstallError } from "./install.js";

const IDE_CHOICES: ReadonlyArray<{
  value: IdeTarget;
  keys: readonly string[];
  label: string;
  hint: string;
}> = [
  {
    value: "cursor",
    keys: ["1", "cursor"],
    label: "Cursor",
    hint: ".cursor/skills · .cursor/agents · .cursor/mcp.json",
  },
  {
    value: "vscode",
    keys: ["2", "vscode", "vs code", "code"],
    label: "VS Code",
    hint: ".github/skills · .github/agents · .vscode/mcp.json",
  },
];

export function isInteractiveTerminal(
  stdin: NodeJS.ReadStream = process.stdin,
  stdout: NodeJS.WriteStream = process.stdout,
): boolean {
  return Boolean(stdin.isTTY && stdout.isTTY);
}

/**
 * Resolve which IDE receives the profile.
 * - Explicit `--ide` wins.
 * - Interactive TTY: ask the user to choose.
 * - Non-interactive (CI/agents): default to `cursor`.
 */
export async function resolveIdeTarget(
  explicit: IdeTarget | undefined,
  options: {
    interactive?: boolean;
    /** Injectable for tests. */
    prompt?: () => Promise<IdeTarget>;
  } = {},
): Promise<IdeTarget> {
  if (explicit) return explicit;

  const interactive = options.interactive ?? isInteractiveTerminal();
  if (!interactive) {
    return "cursor";
  }

  if (options.prompt) {
    return options.prompt();
  }

  return promptIdeTarget();
}

export async function promptIdeTarget(
  io: { input?: NodeJS.ReadableStream; output?: NodeJS.WritableStream } = {},
): Promise<IdeTarget> {
  const out = io.output ?? output;
  const streamIn = io.input ?? input;
  const rl = createInterface({
    input: streamIn,
    output: out,
    // Avoid TTY mode with injected streams (tests / piped answers).
    terminal: io.input === undefined && Boolean(process.stdin.isTTY),
  });

  try {
    out.write("\nQual IDE deve receber o profile e as definições?\n");
    for (const choice of IDE_CHOICES) {
      const index = choice.keys[0];
      out.write(`  ${index}) ${choice.label.padEnd(8)} → ${choice.hint}\n`);
    }
    out.write("\n");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      let raw: string;
      try {
        raw = (await rl.question("Escolha [1/2]: ")).trim().toLowerCase();
      } catch {
        throw new InstallError(
          "Seleção de IDE interrompida. Passe --ide cursor|vscode.",
          1,
        );
      }
      if (!raw) {
        out.write("Opção inválida. Digite 1 (Cursor) ou 2 (VS Code).\n");
        continue;
      }
      const match = IDE_CHOICES.find((c) => c.keys.includes(raw));
      if (match) return match.value;
      out.write("Opção inválida. Digite 1 (Cursor) ou 2 (VS Code).\n");
    }

    throw new InstallError(
      "Não foi possível selecionar a IDE. Passe --ide cursor|vscode.",
      1,
    );
  } finally {
    rl.close();
  }
}
