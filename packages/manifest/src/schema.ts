import { z } from "zod";

/** IDE targets supported in the manifest. */
export const IdeTargetSchema = z.enum(["cursor", "vscode"]);
export type IdeTarget = z.infer<typeof IdeTargetSchema>;

/** Collection item types aligned with domain CollectionType. */
export const CollectionTypeSchema = z.enum(["skill", "agent", "mcp"]);
export type CollectionType = z.infer<typeof CollectionTypeSchema>;

/** Shared catalog item reference (skills, agents, collection items). */
export const CatalogItemSchema = z.object({
  source: z.string().min(1),
  externalId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  /** File body used by the apply-engine (e.g. SKILL.md / agent markdown). */
  content: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CatalogItem = z.infer<typeof CatalogItemSchema>;

/** MCP server config fragment merged into the IDE MCP JSON (`.cursor/mcp.json` or `.vscode/mcp.json`). */
export const McpServerConfigSchema = z
  .object({
    command: z.string().min(1).optional(),
    args: z.array(z.string()).optional(),
    env: z.record(z.string()).optional(),
    url: z.string().url().optional(),
  })
  .refine(
    (v) => Boolean(v.command || v.url),
    { message: "MCP server requires command or url" },
  );
export type McpServerConfig = z.infer<typeof McpServerConfigSchema>;

export const McpItemSchema = z.object({
  source: z.string().min(1),
  externalId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  server: McpServerConfigSchema,
  metadata: z.record(z.unknown()).optional(),
});
export type McpItem = z.infer<typeof McpItemSchema>;

export const DocItemSchema = z.object({
  source: z.string().min(1),
  externalId: z.string().min(1),
  name: z.string().min(1),
  url: z.string().url().optional(),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type DocItem = z.infer<typeof DocItemSchema>;

export const ExtensionItemSchema = z.object({
  ide: IdeTargetSchema,
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
});
export type ExtensionItem = z.infer<typeof ExtensionItemSchema>;

export const CollectionSchema = z.object({
  type: CollectionTypeSchema,
  category: z.string().min(1),
  subcategory: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  items: z.array(CatalogItemSchema).default([]),
});
export type ManifestCollection = z.infer<typeof CollectionSchema>;

/**
 * Profile Manifest v1 — sole input contract for `my-collec-skills-apply-engine`.
 * @see docs/PRD.md §12
 */
export const ProfileManifestSchema = z.object({
  version: z.literal(1),
  username: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  collections: z.array(CollectionSchema).default([]),
  skills: z.array(CatalogItemSchema).default([]),
  agents: z.array(CatalogItemSchema).default([]),
  mcps: z.array(McpItemSchema).default([]),
  docs: z.array(DocItemSchema).default([]),
  extensions: z.array(ExtensionItemSchema).default([]),
});
export type ProfileManifest = z.infer<typeof ProfileManifestSchema>;
