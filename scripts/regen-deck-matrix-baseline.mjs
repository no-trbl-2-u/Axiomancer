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

import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_OUT = join(
  ROOT, 'axiomancer-mechanics', 'docs', 'reports', 'baselines',
  'deck-matrix-baseline.json',
);

const flag = (k, dflt) => {
  const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.slice(k.length + 3) : dflt;
};

const runs = Number(flag('runs', '60'));
const seed = Number(flag('seed', '1'));
const stage = flag('stage', 'all');
const policy = flag('policy', 'all');
const confidence = flag('confidence', 'full');
const note = flag('note', '');
const out = flag('out', DEFAULT_OUT);

if (!Number.isFinite(runs) || runs < 1) throw new Error(`bad --runs '${flag('runs', '60')}'`);

const cliArgs = `--stage=${stage} --policy=${policy} --deck=policy-pick --runs=${runs} --seed=${seed} --cards --json`;
const command = `npm run combat-playtest -- ${cliArgs}`;
console.log(`baseline:regen — measuring: ${command}`);
console.log('(this sweeps the full matrix; expect minutes, not seconds)');

const raw = execSync(
  `npm run --silent --workspace axiomancer-mechanics combat-playtest -- ${cliArgs}`,
  { cwd: ROOT, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'] },
);
// --json prints the PlaytestReport and nothing else, but guard against any
// tool banner by slicing to the outermost JSON object.
const report = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));

const commit = execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
const generatedAt = new Date().toISOString().slice(0, 10);

const baseline = {
  meta: {
    generatedAt,
    commit,
    command,
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

writeFileSync(out, JSON.stringify(baseline, null, 1) + '\n');
console.log(`baseline:regen — wrote ${out} (commit ${commit}, runs/cell ${runs}, confidence ${confidence})`);
