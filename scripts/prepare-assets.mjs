#!/usr/bin/env node
/**
 * Prepares assets that are deliberately not committed. Runs before `dev` and
 * `build`, and is safe to run repeatedly.
 *
 * 1. Clash Display Variable — free to self-host, but its licence (ITF FFL,
 *    section 02) does not allow redistributing the font file through a public
 *    repository. It is downloaded from Fontshare instead.
 * 2. detect-gpu benchmark tables — copied from node_modules so the GPU tier
 *    lookup is served from our own origin and always matches the installed
 *    library version.
 */
import { cp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FONT_PATH = path.join(root, "app", "fonts", "ClashDisplay-Variable.woff2");
const FONT_CSS_URL = "https://api.fontshare.com/v2/css?f[]=clash-display@1&display=swap";
const BENCHMARKS_DEST = path.join(root, "public", "gpu-benchmarks");
const WOFF2_MAGIC = "wOF2";
const TIMEOUT_MS = 30_000;

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function fetchOk(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      // Fontshare serves woff2 only to browsers that advertise support for it.
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    },
  });
  if (!response.ok) throw new Error(`${url} responded with HTTP ${response.status}`);
  return response;
}

async function ensureClashDisplay() {
  if (await exists(FONT_PATH)) {
    const head = (await readFile(FONT_PATH)).subarray(0, 4).toString("latin1");
    if (head === WOFF2_MAGIC) return "present";
    console.warn(
      "[assets] Existing Clash Display file is not a valid woff2; downloading again.",
    );
  }

  const css = await (await fetchOk(FONT_CSS_URL)).text();
  const match = /url\(['"]?((?:https?:)?\/\/[^'")]+\.woff2)['"]?\)/.exec(css);
  if (!match) throw new Error("Could not find a woff2 URL in the Fontshare stylesheet.");
  const fontUrl = match[1].startsWith("//") ? `https:${match[1]}` : match[1];

  const bytes = Buffer.from(await (await fetchOk(fontUrl)).arrayBuffer());
  if (bytes.subarray(0, 4).toString("latin1") !== WOFF2_MAGIC) {
    throw new Error("Downloaded Clash Display file is not a woff2 font.");
  }

  await mkdir(path.dirname(FONT_PATH), { recursive: true });
  await writeFile(FONT_PATH, bytes);
  return `downloaded (${(bytes.length / 1024).toFixed(1)} KB)`;
}

async function syncGpuBenchmarks() {
  const require = createRequire(path.join(root, "package.json"));
  const entry = require.resolve("detect-gpu");
  // The entry point lives in <package>/dist; the tables sit next to it.
  const source = path.join(path.dirname(entry), "benchmarks");
  if (!(await exists(source))) {
    throw new Error(`detect-gpu benchmarks not found at ${source}`);
  }
  await mkdir(BENCHMARKS_DEST, { recursive: true });
  await cp(source, BENCHMARKS_DEST, { recursive: true, force: true });
  return "synced";
}

const steps = [
  ["Clash Display Variable", ensureClashDisplay],
  ["GPU benchmark tables", syncGpuBenchmarks],
];

let failed = false;
for (const [label, run] of steps) {
  try {
    console.info(`[assets] ${label}: ${await run()}`);
  } catch (error) {
    failed = true;
    console.error(
      `[assets] ${label}: FAILED — ${error instanceof Error ? error.message : error}`,
    );
  }
}

if (failed) {
  console.error(
    "[assets] Some assets could not be prepared. Check the network connection and run `pnpm assets` again.",
  );
  process.exit(1);
}
