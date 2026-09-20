#!/usr/bin/env node
// Re-measures the combat deck matrix and rewrites the stamped baseline
// (`axiomancer-mechanics/docs/reports/baselines/deck-matrix-baseline.json`).
// The companion of check-baseline-freshness.mjs: the check is the alarm,
// this is the reset.
//
// Usage:
//   npm run baseline:regen                       # full: runs=60, seed=1
//   npm run baseline:regen -- --runs=30 --confidence=reduced-nightly
//   node scripts/regen-deck-matrix-baseline.mjs --runs=2 --stage=early --out=/tmp/x.json  # smoke test
//
// Flags: --runs=N (default 60) · --seed=N (default 1) · --stage=<id|all>
// (default all) · --policy=<id|all> (default all) · --confidence=<label>
// (default "full"; the digest's reduced pass uses "reduced-nightly") ·
// --note="..." · --out=<path> (default the checked-in baseline).
//
// MEASUREMENT ONLY: this regenerates the stamped truth surface. Reading the
// new numbers against the doctrine curve and proposing tuning stays with
// /deck-tuning and the digest's proposals panel — never in here.
//
// PROVENANCE: the sweep reads the WORKING TREE; the stamp records
// `git rev-parse --short HEAD`. When the two disagree the stamp is a false
// claim about which engine produced the numbers — that is how the shipped
// baseline came to name `5a2158a`, a tree containing zero SUMMON, for
// numbers measured on the Phase 102 engine (burn-day audit 2026-09-19, row
// 3.6). `main` therefore refuses to measure while any freshness-relevant
// file under `WATCH_ROOT` is uncommitted, using the alarm's own definition
// of "relevant" so the guard and the alarm can never disagree. There is
// deliberately no --allow-dirty escape: a stamp is a provenance claim, and
// an opt-out is how this recurs.

import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

import { WATCH_ROOT, isFreshnessRelevantPath } from './check-baseline-freshness.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_OUT = join(
  ROOT, 'axiomancer-mechanics', 'docs', 'reports', 'baselines',
  'deck-matrix-baseline.json',
);

const flag = (argv, k, dflt) => {
  const hit = argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.slice(k.length + 3) : dflt;
};

/** Parse the CLI into the measurement's options, including the exact sweep
 *  command recorded in `meta.command`. */
export function parseOptions(argv = process.argv) {
  const runs = Number(flag(argv, 'runs', '60'));
  const seed = Number(flag(argv, 'seed', '1'));
  const stage = flag(argv, 'stage', 'all');
  const policy = flag(argv, 'policy', 'all');
  const confidence = flag(argv, 'confidence', 'full');
  const note = flag(argv, 'note', '');
  const out = flag(argv, 'out', DEFAULT_OUT);

  if (!Number.isFinite(runs) || runs < 1) throw new Error(`bad --runs '${flag(argv, 'runs', '60')}'`);

  const cliArgs = `--stage=${stage} --policy=${policy} --deck=policy-pick --runs=${runs} --seed=${seed} --cards --json`;
  return { runs, seed, stage, policy, confidence, note, out, cliArgs, command: `npm run combat-playtest -- ${cliArgs}` };
}

/** Repo-relative paths, sorted, whose uncommitted state would make this
 *  run's stamp a lie. `porcelainZ` is the raw output of
 *  `git status --porcelain=v1 -z -- <WATCH_ROOT>`: NUL-terminated `XY path`
 *  records, where a rename/copy record is followed by a second field holding
 *  the ORIGINAL path. Untracked files count — the sweep compiles the tree,
 *  so a new engine file is content the stamped commit does not contain. */
export function dirtyMeasurementSources(porcelainZ) {
  const fields = String(porcelainZ ?? '').split('\0');
  const dirty = new Set();
  for (let i = 0; i < fields.length; i += 1) {
    const record = fields[i];
    if (!record) continue;
    const [x, y] = record;
    const path = record.slice(3);
    // Consume the rename/copy source field so it is not read as a record.
    if (x === 'R' || x === 'C' || y === 'R' || y === 'C') i += 1;
    if (isFreshnessRelevantPath(path)) dirty.add(path);
  }
  return [...dirty].sort();
}

function refusal(dirty) {
  return [
    `baseline:regen — REFUSING to measure: ${WATCH_ROOT} has uncommitted changes.`,
    ...dirty.map((path) => `  · ${path}`),
    'The sweep reads the working tree, but the stamp records `git rev-parse --short HEAD`,',
    'so this run would attribute its numbers to a commit that does not contain the code',
    'that produced them. That is how deck-matrix-baseline.json came to name 5a2158a, a',
    'tree with zero SUMMON (burn-day audit 2026-09-19, row 3.6).',
    'Commit or stash the changes above, then re-run.',
  ].join('\n');
}

const defaultGitStatus = () => execSync(
  `git status --porcelain=v1 -z -- ${WATCH_ROOT}`,
  { cwd: ROOT, encoding: 'utf8' },
);

const defaultReadCommit = () => execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();

const defaultRunSweep = (options) => execSync(
  `npm run --silent --workspace axiomancer-mechanics combat-playtest -- ${options.cliArgs}`,
  { cwd: ROOT, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'] },
);

const defaultWriteOut = (path, baseline) => writeFileSync(path, JSON.stringify(baseline, null, 1) + '\n');

/** The measurement, with its four effectful edges injectable so the refusal
 *  and its ORDER can be asserted without a git fixture or a real sweep. */
export function main({
  options = parseOptions(),
  gitStatus = defaultGitStatus,
  readCommit = defaultReadCommit,
  runSweep = defaultRunSweep,
  writeOut = defaultWriteOut,
  log = console.log,
} = {}) {
  // FIRST, before the multi-minute sweep: a guard that fires afterwards is a
  // guard nobody keeps.
  const dirty = dirtyMeasurementSources(gitStatus());
  if (dirty.length > 0) throw new Error(refusal(dirty));

  log(`baseline:regen — measuring: ${options.command}`);
  log('(this sweeps the full matrix; expect minutes, not seconds)');

  const raw = runSweep(options);
  // --json prints the PlaytestReport and nothing else, but guard against any
  // tool banner by slicing to the outermost JSON object.
  const report = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));

  const commit = readCommit();
  const { confidence, note, runs, seed, out } = options;

  const baseline = {
    meta: {
      generatedAt: new Date().toISOString().slice(0, 10),
      commit,
      command: options.command,
      seeds: { baseline: seed, confirm: [] },
      runsPerCell: runs,
      confidence,
      note: note
        || (confidence === 'full'
          ? `Full re-baseline via scripts/regen-deck-matrix-baseline.mjs at ${commit}.`
          : `REDUCED (${confidence}) re-baseline via scripts/regen-deck-matrix-baseline.mjs at ${commit} — `
            + 'directionally honest, not confirmation-grade; run the full 3-seed pass before acting on close calls.'),
    },
    report,
  };

  writeOut(out, baseline);
  log(`baseline:regen — wrote ${out} (commit ${commit}, runs/cell ${runs}, confidence ${confidence})`);
  return baseline;
}

/** Same idiom as check-baseline-freshness.mjs — lets the guard's test import
 *  this module without starting a measurement. */
function isDirectRun(moduleUrl) {
  if (!process.argv[1]) return false;
  return moduleUrl === pathToFileURL(process.argv[1]).href;
}

if (isDirectRun(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
