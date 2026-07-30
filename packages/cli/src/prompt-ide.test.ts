import { Readable, Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { InstallError } from "./install.js";
import {
  isInteractiveTerminal,
  promptIdeTarget,
  resolveIdeTarget,
} from "./prompt-ide.js";

describe("resolveIdeTarget", () => {
  it("prefers an explicit --ide value", async () => {
    await expect(
      resolveIdeTarget("vscode", {
        interactive: true,
        prompt: async () => "cursor",
      }),
    ).resolves.toBe("vscode");
  });

  it("defaults to cursor when non-interactive", async () => {
    await expect(
      resolveIdeTarget(undefined, { interactive: false }),
    ).resolves.toBe("cursor");
  });

  it("prompts when interactive and ide is omitted", async () => {
    await expect(
      resolveIdeTarget(undefined, {
        interactive: true,
        prompt: async () => "vscode",
      }),
    ).resolves.toBe("vscode");
  });
});

describe("promptIdeTarget", () => {
  function makeIo(answers: string) {
    const readable = Readable.from(answers);
    const chunks: string[] = [];
    const writable = new Writable({
      write(chunk, _enc, cb) {
        chunks.push(String(chunk));
        cb();
      },
    });
    return { readable, writable, chunks };
  }

  it("accepts numbered and named choices", async () => {
    const cases: Array<{ input: string; expected: "cursor" | "vscode" | "both" }> = [
      { input: "1\n", expected: "cursor" },
      { input: "cursor\n", expected: "cursor" },
      { input: "2\n", expected: "vscode" },
      { input: "vscode\n", expected: "vscode" },
      { input: "3\n", expected: "both" },
      { input: "ambos\n", expected: "both" },
    ];

    for (const { input, expected } of cases) {
      const { readable, writable, chunks } = makeIo(input);
      await expect(
        promptIdeTarget({ input: readable, output: writable }),
      ).resolves.toBe(expected);
      expect(chunks.join("")).toContain("Qual IDE");
    }
  });

  it("re-prompts on invalid input then accepts a valid choice", async () => {
    const { PassThrough } = await import("node:stream");
    const readable = new PassThrough();
    const chunks: string[] = [];
    const writable = new Writable({
      write(chunk, _enc, cb) {
        chunks.push(String(chunk));
        cb();
      },
    });

    const pending = promptIdeTarget({ input: readable, output: writable });

    // Feed answers after the prompt is listening.
    queueMicrotask(() => {
      readable.write("x\n");
      queueMicrotask(() => {
        readable.write("2\n");
        readable.end();
      });
    });

    await expect(pending).resolves.toBe("vscode");
    expect(chunks.join("")).toContain("Opção inválida");
  });

  it("fails after too many invalid attempts", async () => {
    const { readable, writable } = makeIo("x\ny\nz\na\nb\n");
    await expect(
      promptIdeTarget({ input: readable, output: writable }),
    ).rejects.toBeInstanceOf(InstallError);
  });
});

describe("isInteractiveTerminal", () => {
  it("requires both stdin and stdout TTY", () => {
    expect(
      isInteractiveTerminal(
        { isTTY: true } as NodeJS.ReadStream,
        { isTTY: false } as NodeJS.WriteStream,
      ),
    ).toBe(false);
    expect(
      isInteractiveTerminal(
        { isTTY: true } as NodeJS.ReadStream,
        { isTTY: true } as NodeJS.WriteStream,
      ),
    ).toBe(true);
  });
});
