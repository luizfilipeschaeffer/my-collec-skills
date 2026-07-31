import path from "node:path";

const UNSAFE_SEGMENT = /[\\/]|^\.\.?$|\.\./;

/**
 * Ensures `externalId` is a single safe path segment (no traversal).
 * Throws if the id is unsafe.
 */
export function assertSafeId(externalId: string): string {
  const id = externalId.trim();
  if (!id) {
    throw new Error("Empty externalId");
  }
  if (UNSAFE_SEGMENT.test(id) || path.isAbsolute(id) || id.includes("\0")) {
    throw new Error(`Unsafe path segment: ${externalId}`);
  }
  // Reject Windows drive-like and reserved names noise
  if (/^[a-zA-Z]:/.test(id)) {
    throw new Error(`Unsafe path segment: ${externalId}`);
  }
  return id;
}

/**
 * MCP server names are JSON keys (not filesystem segments).
 * Allow namespaced registry ids like `io.github.../server-github`.
 */
export function assertSafeMcpKey(externalId: string): string {
  const id = externalId.trim();
  if (!id) {
    throw new Error("Empty externalId");
  }
  if (
    id.includes("\0") ||
    path.isAbsolute(id) ||
    /^[a-zA-Z]:/.test(id) ||
    /(^|[\\/])\.\.([\\/]|$)/.test(id) ||
    id === "." ||
    id === ".."
  ) {
    throw new Error(`Unsafe MCP key: ${externalId}`);
  }
  return id;
}

/**
 * Resolve a path under `baseDir` and ensure the result stays inside `baseDir`.
 */
export function resolveSafePath(baseDir: string, ...segments: string[]): string {
  const base = path.resolve(baseDir);
  const target = path.resolve(base, ...segments);
  const relative = path.relative(base, target);
  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    relative.includes(`..${path.sep}`)
  ) {
    throw new Error(`Path traversal blocked: ${segments.join("/")}`);
  }
  return target;
}
