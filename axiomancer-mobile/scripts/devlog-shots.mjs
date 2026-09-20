#!/usr/bin/env node
// devlog-shots.mjs
//
// Collect before/after/diff screenshots for the day's UI work into the DevLog.
//
// Cost/design constraints (per the DevLog owner):
//   1. No AI usage — this is a plain deterministic node script, no model calls.
//   2. Reuse the verify gate's screenshots — the committed baselines
//      (screenshots/baseline/*.png) ARE the smoke gate's approved captures; we
//      reuse them via git history and never run a browser / expo export here.
//   3. Only surface a fairly *noticeable* change — a screen is embedded only if
//      its pixel-diff ratio clears DEVLOG_SHOT_MIN_RATIO (default 2%). Tiny
//      anti-aliasing / subpixel diffs are skipped so the log stays signal.
//
// The baselines move with the change that produced them (see smoke-screens.mjs),
// so the day's visual diff is just the baseline PNGs that changed across the
// day's git range: before = the blob at <since>, after = the current blob,
// diff = a pixelmatch highlight.
//
// Modes:
//   node scripts/devlog-shots.mjs <since-ref> <date>
//       For every screenshots/baseline/*.png that changed in <since>..HEAD and
//       is noticeably different, write devlog/assets/<date>/<screen>.{before,
//       after,diff}.png and print a JSON summary the /digest agent folds in.
//
//   node scripts/devlog-shots.mjs --pair <screen> <before.png> <after.png> <date>
//       Build one before/after/diff trio from two explicit PNGs, unconditionally
//       (manual / seed use).
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

// "Fairly noticeable" gate: a changed baseline is only embedded if this share of
// pixels differ. 2% is comfortably above smoke's 0.5% flag threshold, so we skip
// the anti-aliasing/font-noise class of diffs. Override via env if needed.
const MIN_RATIO = Number(process.env.DEVLOG_SHOT_MIN_RATIO ?? 0.02);

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

// Compute the before/after/diff files + metadata for one screen. Pure: touches
// no disk. `ratio` is null for a brand-new screen (no before).
function computeTrio({ PNG, pixelmatch }, screen, beforeBuf, afterBuf) {
  const files = [[`${screen}.after.png`, afterBuf]];
  const meta = { screen, before: false, ratio: null };
  if (!beforeBuf) return { meta, files }; // new screen — after only

  meta.before = true;
  files.push([`${screen}.before.png`, beforeBuf]);

  const a = PNG.sync.read(beforeBuf);
  const b = PNG.sync.read(afterBuf);
  if (a.width !== b.width || a.height !== b.height) {
    meta.ratio = 1; // a resize is a full change; skip the (undefined) overlay
    return { meta, files };
  }
  const diff = new PNG({ width: a.width, height: a.height });
  const px = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: PIXELMATCH_THRESHOLD });
  meta.ratio = px / (a.width * a.height);
  files.push([`${screen}.diff.png`, PNG.sync.write(diff)]);
  return { meta, files };
}

function writeFiles(outDir, files) {
  mkdirSync(outDir, { recursive: true });
  for (const [name, buf] of files) writeFileSync(join(outDir, name), buf);
}

// A new screen (no before) is always noticeable; otherwise gate on MIN_RATIO.
function isNoticeable(meta) {
  return !meta.before || meta.ratio == null || meta.ratio >= MIN_RATIO;
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

  const kept = [];
  let skipped = 0;
  for (const relPath of changed) {
    const screen = basename(relPath, ".png");
    const absPath = resolve(REPO_ROOT, relPath);
    if (!existsSync(absPath)) continue; // deleted screen — nothing to show
    const afterBuf = readFileSync(absPath);

    const show = git(["show", `${since}:${relPath}`], { encoding: "buffer" });
    const beforeBuf = show.status === 0 ? show.stdout : null; // absent at <since> → new

    const { meta, files } = computeTrio(deps, screen, beforeBuf, afterBuf);
    if (!isNoticeable(meta)) { skipped++; continue; }
    writeFiles(outDir, files);
    kept.push(meta);
  }

  writeManifest(outDir, date, since, kept);
  emit(kept, date, skipped);
}

async function pairMode(screen, beforePath, afterPath, date) {
  const deps = await loadDeps();
  const outDir = join(ASSETS, date);
  const beforeBuf = beforePath && existsSync(beforePath) ? readFileSync(beforePath) : null;
  const afterBuf = readFileSync(afterPath);
  const { meta, files } = computeTrio(deps, screen, beforeBuf, afterBuf);
  writeFiles(outDir, files); // explicit pair — no threshold
  writeManifest(outDir, date, null, [meta]);
  emit([meta], date, 0);
}

/**
 * Record what "before" actually was.
 *
 * The public DevLog labels each plate in a pair ("BEFORE - 27 AUG"), and it may
 * only print a date it can prove. The before blob is the baseline as it stood
 * at <since>, so that ref's own commit date is the honest label; without this
 * manifest the site would have to guess from the neighbouring entry, and a
 * guessed date on a piece of evidence is worse than no date.
 */
function writeManifest(outDir, date, since, shots) {
  if (!shots.length) return;
  const iso = (ref) => {
    const res = git(["log", "-1", "--format=%cs", ref], { encoding: "utf-8" });
    return res.status === 0 ? String(res.stdout).trim() : "";
  };
  const manifest = {
    generated_by: "scripts/devlog-shots.mjs",
    date,
    since: since || null,
    sinceDate: since ? iso(since) : "",
    shots: shots.map((s) => ({ screen: s.screen, before: s.before, ratio: s.ratio })),
  };
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
}

function emit(shots, date, skipped) {
  const tail = skipped ? ` (${skipped} sub-threshold screen${skipped === 1 ? "" : "s"} skipped)` : "";
  if (shots.length === 0) {
    console.log(`devlog-shots: no noticeably-changed baseline screens for ${date}${tail}.`);
    console.log("SHOTS_JSON: []");
    return;
  }
  for (const s of shots) {
    const pct = s.ratio == null ? "new" : `${(s.ratio * 100).toFixed(2)}% px`;
    console.log(`  ${s.before ? "diff" : "new "}  ${s.screen.padEnd(18)} ${pct}`);
  }
  console.log(`devlog-shots: wrote ${shots.length} screen(s) → devlog/assets/${date}/${tail}`);
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
