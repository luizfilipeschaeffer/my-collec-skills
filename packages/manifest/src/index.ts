import { ProfileManifestSchema, type ProfileManifest } from "./schema.js";

export {
  IdeTargetSchema,
  CollectionTypeSchema,
  CatalogItemSchema,
  McpServerConfigSchema,
  McpItemSchema,
  DocItemSchema,
  ExtensionItemSchema,
  CollectionSchema,
  ProfileManifestSchema,
} from "./schema.js";

export type {
  IdeTarget,
  CollectionType,
  CatalogItem,
  McpServerConfig,
  McpItem,
  DocItem,
  ExtensionItem,
  ManifestCollection,
  ProfileManifest,
} from "./schema.js";

export class ManifestValidationError extends Error {
  readonly issues: unknown;

  constructor(message: string, issues: unknown) {
    super(message);
    this.name = "ManifestValidationError";
    this.issues = issues;
  }
}

/** Parse and validate unknown JSON into a ProfileManifest v1. */
export function parseProfileManifest(input: unknown): ProfileManifest {
  const result = ProfileManifestSchema.safeParse(input);
  if (!result.success) {
    throw new ManifestValidationError(
      "Invalid Profile Manifest",
      result.error.flatten(),
    );
  }
  return result.data;
}

/** Type guard for ProfileManifest v1. */
export function isProfileManifest(input: unknown): input is ProfileManifest {
  return ProfileManifestSchema.safeParse(input).success;
}
