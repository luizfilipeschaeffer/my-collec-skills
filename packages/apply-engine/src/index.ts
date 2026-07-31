export { applyProfile } from "./apply.js";
export { buildItemManifest, toFilesystemId } from "./item-manifest.js";
export { expandIdeTargets, getIdeLayout } from "./layout.js";
export { assertSafeId, assertSafeMcpKey, resolveSafePath } from "./paths.js";
export { collectAgents, collectMcps, collectSkills } from "./collect.js";

export type { IdeLayout } from "./layout.js";
export type {
  CatalogItemKind,
  ItemManifestInput,
} from "./item-manifest.js";
export type {
  ApplyStatus,
  ApplyItemKind,
  ApplyItemResult,
  ApplyReport,
  ApplyOptions,
  IdeApplyTarget,
  ProfileManifest,
} from "./types.js";
