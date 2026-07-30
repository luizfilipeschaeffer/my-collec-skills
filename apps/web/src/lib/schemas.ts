import { z } from "zod";

const slug = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use um slug em kebab-case.");

export const externalItemSchema = z.object({
  source: z.string().min(1).max(100),
  externalId: z.string().min(1).max(200),
  name: z.string().min(1).max(150),
  description: z.string().max(1000).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const profileInputSchema = z.object({
  name: z.string().min(2).max(100),
  slug,
  description: z.string().max(1000).nullable().optional(),
  isPublic: z.boolean().default(false),
  collectionIds: z.array(z.string().cuid()).default([]),
  skills: z.array(externalItemSchema).default([]),
  agents: z.array(externalItemSchema).default([]),
  mcps: z.array(externalItemSchema).default([]),
  docs: z
    .array(externalItemSchema.extend({ url: z.string().url().nullable().optional() }))
    .default([]),
  extensions: z
    .array(
      z.object({
        ide: z.enum(["cursor", "vscode"]),
        extensionId: z.string().min(2).max(200),
        name: z.string().min(1).max(150),
        description: z.string().max(1000).nullable().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .default([]),
});

export const profilePatchSchema = profileInputSchema.partial();

export const collectionInputSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).nullable().optional(),
  type: z.enum(["skill", "agent", "mcp"]),
  categoryId: z.string().cuid(),
  subcategoryId: z.string().cuid(),
  isPublic: z.boolean().default(false),
  items: z.array(externalItemSchema).default([]),
});

export const collectionPatchSchema = collectionInputSchema.partial();
