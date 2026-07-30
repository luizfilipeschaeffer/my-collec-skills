import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { IdeApplyTarget } from "my-collec-skills-apply-engine";
import { InstallError } from "./install.js";

const IDE_CHOICES: ReadonlyArray<{
  value: IdeApplyTarget;
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
  {
    value: "both",
    keys: ["3", "both", "ambos", "all"],
    label: "Ambos",
    hint: "Cursor + VS Code (layouts dos dois)",
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
  explicit: IdeApplyTarget | undefined,
  options: {
    interactive?: boolean;
    /** Injectable for tests. */
    prompt?: () => Promise<IdeApplyTarget>;
  } = {},
): Promise<IdeApplyTarget> {
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
): Promise<IdeApplyTarget> {
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
        raw = (await rl.question("Escolha [1/2/3]: ")).trim().toLowerCase();
      } catch {
        throw new InstallError(
          "Seleção de IDE interrompida. Passe --ide cursor|vscode|both.",
          1,
        );
      }
      if (!raw) {
        out.write(
          "Opção inválida. Digite 1 (Cursor), 2 (VS Code) ou 3 (Ambos).\n",
        );
        continue;
      }
      const match = IDE_CHOICES.find((c) => c.keys.includes(raw));
      if (match) return match.value;
      out.write(
        "Opção inválida. Digite 1 (Cursor), 2 (VS Code) ou 3 (Ambos).\n",
      );
    }

    throw new InstallError(
      "Não foi possível selecionar a IDE. Passe --ide cursor|vscode|both.",
      1,
    );
  } finally {
    rl.close();
  }
}
