import * as esbuild from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

const watch = process.argv.includes("--watch");
const production = process.argv.includes("--production");

/** @type {import('esbuild').BuildOptions} */
const extensionOptions = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.cjs",
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  target: "node20",
  sourcemap: !production,
  logLevel: "info",
};

/** @type {import('esbuild').BuildOptions} */
const webviewOptions = {
  entryPoints: ["src/webview/main.ts"],
  bundle: true,
  outfile: "dist/webview/main.js",
  format: "iife",
  platform: "browser",
  target: "es2020",
  sourcemap: !production,
  logLevel: "info",
};

async function copyWebviewAssets() {
  await mkdir("dist/webview", { recursive: true });
  await copyFile(
    path.join("src", "webview", "styles.css"),
    path.join("dist", "webview", "styles.css"),
  );
}

async function buildOnce() {
  await esbuild.build(extensionOptions);
  await esbuild.build(webviewOptions);
  await copyWebviewAssets();
  console.log("[mcs] build complete");
}

if (watch) {
  const extCtx = await esbuild.context(extensionOptions);
  const webCtx = await esbuild.context(webviewOptions);
  await extCtx.watch();
  await webCtx.watch();
  await copyWebviewAssets();
  console.log("[mcs] watching…");
} else {
  await buildOnce();
}
