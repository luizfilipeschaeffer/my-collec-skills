import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  EXIT_NETWORK,
  EXIT_OK,
  EXIT_VALIDATION,
  InstallError,
  resolveApiUrl,
  runInstall,
} from "./install.js";

const sampleManifest = {
  version: 1,
  username: "alice",
  slug: "nextjs-prisma",
  name: "Next.js + Prisma",
  collections: [],
  skills: [
    {
      source: "local",
      externalId: "demo",
      name: "Demo",
      content: "# Demo\n",
    },
  ],
  agents: [],
  mcps: [],
  docs: [],
  extensions: [],
};

describe("resolveApiUrl", () => {
  it("prefers explicit flag, then env, then localhost", () => {
    const prev = process.env.MCS_API_URL;
    try {
      delete process.env.MCS_API_URL;
      expect(resolveApiUrl()).toBe("http://localhost:3000");
      process.env.MCS_API_URL = "https://api.example.com/";
      expect(resolveApiUrl()).toBe("https://api.example.com");
      expect(resolveApiUrl("https://flag.test/")).toBe("https://flag.test");
    } finally {
      if (prev === undefined) delete process.env.MCS_API_URL;
      else process.env.MCS_API_URL = prev;
    }
  });
});

describe("runInstall", () => {
  it("fetches, validates and applies manifesto", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mcs-cli-"));
    const fetchImpl: typeof fetch = async () =>
      new Response(JSON.stringify(sampleManifest), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    const result = await runInstall({
      username: "alice",
      perfil: "nextjs-prisma",
      cwd,
      fetchImpl,
    });

    expect(result.exitCode).toBe(EXIT_OK);
    expect(result.report.applied.some((r) => r.kind === "skill")).toBe(true);
    expect(result.output).toContain("applied=");
  });

  it("supports dry-run", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "mcs-cli-dry-"));
    const fetchImpl: typeof fetch = async () =>
      new Response(JSON.stringify(sampleManifest), { status: 200 });

    const result = await runInstall({
      username: "alice",
      perfil: "nextjs-prisma",
      cwd,
      dryRun: true,
      fetchImpl,
    });

    expect(result.report.dryRun).toBe(true);
    expect(result.output).toContain("[dry-run]");
  });

  it("maps network errors to exit code", async () => {
    const fetchImpl: typeof fetch = async () => {
      throw new Error("ECONNREFUSED");
    };

    await expect(
      runInstall({
        username: "alice",
        perfil: "x",
        fetchImpl,
      }),
    ).rejects.toMatchObject({ exitCode: EXIT_NETWORK } satisfies Partial<InstallError>);
  });

  it("maps validation errors to exit code", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(JSON.stringify({ version: 99 }), { status: 200 });

    await expect(
      runInstall({
        username: "alice",
        perfil: "x",
        fetchImpl,
      }),
    ).rejects.toMatchObject({
      exitCode: EXIT_VALIDATION,
    } satisfies Partial<InstallError>);
  });
});
