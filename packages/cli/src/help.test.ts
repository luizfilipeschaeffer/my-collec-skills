import { describe, expect, it } from "vitest";
import { getHelpText, PACKAGE_NAME } from "./help.js";

describe("getHelpText", () => {
  it("documents npx and bunx entrypoints for humans and AIs", () => {
    const help = getHelpText();
    expect(help).toContain(`npx ${PACKAGE_NAME}`);
    expect(help).toContain(`bunx ${PACKAGE_NAME}`);
    expect(help).toContain("install --username");
    expect(help).toContain("--perfil");
    expect(help).toContain("FOR AI AGENTS");
    expect(help).toContain("EXIT CODES");
    expect(help).toContain("MCS_API_URL");
    expect(help).toContain("https://my-collec-skills.vercel.app");
    expect(help).toContain("--ide");
    expect(help).toContain("you will be asked to choose");
    expect(help).toContain(".github/skills");
    expect(help).not.toContain("npx mcs install");
  });
});
