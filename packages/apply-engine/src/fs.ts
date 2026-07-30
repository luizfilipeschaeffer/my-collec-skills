import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

/** Write file atomically (temp + rename). Creates parent dirs. */
export async function writeFileAtomic(
  filePath: string,
  content: string,
): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${randomBytes(8).toString("hex")}.tmp`;
  try {
    await writeFile(tmp, content, "utf8");
    await rename(tmp, filePath);
  } catch (err) {
    try {
      const { unlink } = await import("node:fs/promises");
      await unlink(tmp);
    } catch {
      // ignore cleanup errors
    }
    throw err;
  }
}

export async function readFileIfExists(
  filePath: string,
): Promise<string | null> {
  try {
    return await readFile(filePath, "utf8");
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return null;
    throw err;
  }
}
