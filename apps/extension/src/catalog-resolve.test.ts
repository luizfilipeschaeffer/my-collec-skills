import { describe, expect, it, vi } from "vitest";
import { resolveItemManifestInput } from "./catalog-resolve.js";

describe("resolveItemManifestInput", () => {
  it("uses metadata.content for skills", async () => {
    const input = await resolveItemManifestInput(
      {
        type: "skill",
        source: "mcs-catalog",
        externalId: "demo",
        name: "Demo",
        description: "d",
        metadata: { content: "# Demo\n" },
      },
      { apiUrl: "https://example.com" },
    );
    expect(input.content).toBe("# Demo\n");
    expect(input.type).toBe("skill");
  });

  it("requires server for mcp", async () => {
    await expect(
      resolveItemManifestInput(
        {
          type: "mcp",
          source: "mcp-registry",
          externalId: "fs",
          name: "FS",
          description: "d",
        },
        { apiUrl: "https://example.com" },
      ),
    ).rejects.toThrow(/sem server/i);
  });

  it("fetches skills.sh markdown when content missing", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({ skillMarkdown: "# From skills.sh\n" }),
    })) as unknown as typeof fetch;

    const input = await resolveItemManifestInput(
      {
        type: "skill",
        source: "skills.sh",
        externalId: "owner/demo",
        name: "Demo",
        description: "d",
        metadata: { skillId: "owner/demo" },
      },
      { apiUrl: "https://example.com", fetchImpl },
    );
    expect(input.content).toBe("# From skills.sh\n");
    expect(fetchImpl).toHaveBeenCalled();
  });
});
