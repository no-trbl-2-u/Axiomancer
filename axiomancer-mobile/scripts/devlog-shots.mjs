#!/usr/bin/env node
// devlog-shots.mjs
//
// Collect before/after/diff screenshots for the day's UI work into the DevLog.
//
// The committed baselines (screenshots/baseline/<screen>.png) are the source of
// truth for how each screen looks, and they move with the change that produced
// them (see smoke-screens.mjs). So the day's visual diff is simply the baseline
// PNGs that changed across the day's git range: before = the blob at <since>,
// after = the current blob, diff = a pixelmatch highlight. No browser needed.
//
// Modes:
//   node scripts/devlog-shots.mjs <since-ref> <date>
//       For every screenshots/baseline/*.png that changed in <since>..HEAD,
//       write devlog/assets/<date>/<screen>.{before,after,diff}.png and print
//       a JSON summary the /digest agent folds into the entry.
//
//   node scripts/devlog-shots.mjs --pair <screen> <before.png> <after.png> <date>
//       Build one before/after/diff trio from two explicit PNGs (manual / seed).
//
// Exit 0 always (this is a collector, not a gate); boot/dep failures exit 3.

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(__dirname, "..");
const REPO_ROOT = resolve(PKG_ROOT, "..");
const BASELINE_REL = "axiomancer-mobile/screenshots/baseline";
const ASSETS = resolve(REPO_ROOT, "devlog/assets");

// Per-pixel sensitivity — mirrors smoke-screens.mjs so "changed" means the same
// thing in both places.
const PIXELMATCH_THRESHOLD = 0.1;

async function loadDeps() {
  try {
    const { PNG } = await import("pngjs");
    const pixelmatch = (await import("pixelmatch")).default;
    return { PNG, pixelmatch };
  } catch (e) {
    console.error(
      "devlog-shots: missing deps (pngjs / pixelmatch). Run `npm ci` at the repo root.\n" + e.message
    );
    process.exit(3);
  }
}

function git(args, opts = {}) {
  return spawnSync("git", args, { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024, ...opts });
}

// Write after.png (always), before.png (if provided), and diff.png (if both
// share dimensions). Returns metadata for the entry.
function writeTrio({ PNG, pixelmatch }, screen, beforeBuf, afterBuf, outDir) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, `${screen}.after.png`), afterBuf);

  const meta = { screen, before: false, ratio: null, changed: true };
  if (!beforeBuf) return meta; // new screen — after only
  writeFileSync(join(outDir, `${screen}.before.png`), beforeBuf);
  meta.before = true;

  const a = PNG.sync.read(beforeBuf);
  const b = PNG.sync.read(afterBuf);
  if (a.width !== b.width || a.height !== b.height) {
    meta.ratio = 1; // treat a resize as a full change; skip the overlay
    return meta;
  }
  const diff = new PNG({ width: a.width, height: a.height });
  const px = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: PIXELMATCH_THRESHOLD });
  writeFileSync(join(outDir, `${screen}.diff.png`), PNG.sync.write(diff));
  meta.ratio = px / (a.width * a.height);
  return meta;
}

async function gitMode(since, date) {
  const deps = await loadDeps();
  const outDir = join(ASSETS, date);

  const res = git(["diff", "--name-only", "--diff-filter=AMR", since, "HEAD", "--", BASELINE_REL]);
  if (res.status !== 0) {
    console.error(`devlog-shots: git diff failed (is "${since}" a valid ref?)\n${res.stderr}`);
    process.exit(3);
  }
  const changed = String(res.stdout)
    .split("\n")
    .map((s) => s.trim())
    .filter((p) => p.endsWith(".png"));

  const shots = [];
  for (const relPath of changed) {
    const screen = basename(relPath, ".png");
    const absPath = resolve(REPO_ROOT, relPath);
    if (!existsSync(absPath)) continue; // deleted screen — nothing to show
    const afterBuf = readFileSync(absPath);

    const show = git(["show", `${since}:${relPath}`], { encoding: "buffer" });
    const beforeBuf = show.status === 0 ? show.stdout : null; // absent at <since> → new

    shots.push(writeTrio(deps, screen, beforeBuf, afterBuf, outDir));
  }

  emit(shots, date);
}

async function pairMode(screen, beforePath, afterPath, date) {
  const deps = await loadDeps();
  const outDir = join(ASSETS, date);
  const beforeBuf = beforePath && existsSync(beforePath) ? readFileSync(beforePath) : null;
  const afterBuf = readFileSync(afterPath);
  emit([writeTrio(deps, screen, beforeBuf, afterBuf, outDir)], date);
}

function emit(shots, date) {
  if (shots.length === 0) {
    console.log(`devlog-shots: no baseline screens changed for ${date}.`);
    console.log("SHOTS_JSON: []");
    return;
  }
  for (const s of shots) {
    const pct = s.ratio == null ? "new" : `${(s.ratio * 100).toFixed(2)}% px`;
    console.log(`  ${s.before ? "diff" : "new "}  ${s.screen.padEnd(18)} ${pct}`);
  }
  console.log(`devlog-shots: wrote ${shots.length} screen(s) → devlog/assets/${date}/`);
  // The agent folds each screen into a UI card as: **Shot:** <screen> — <caption>
  console.log("SHOTS_JSON: " + JSON.stringify(shots.map((s) => s.screen)));
}

const argv = process.argv.slice(2);
if (argv[0] === "--pair") {
  const [, screen, beforePath, afterPath, date] = argv;
  if (!screen || !afterPath || !date) {
    console.error("usage: devlog-shots.mjs --pair <screen> <before.png> <after.png> <date>");
    process.exit(3);
  }
  await pairMode(screen, beforePath, afterPath, date);
} else {
  const [since, date] = argv;
  if (!since || !date) {
    console.error("usage: devlog-shots.mjs <since-ref> <date>   (or --pair ...)");
    process.exit(3);
  }
  await gitMode(since, date);
}
