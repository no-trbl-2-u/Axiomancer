#!/usr/bin/env node
// Measurement-freshness alarm (2026-07-17): the combat deck-matrix baseline
// (`axiomancer-mechanics/docs/reports/baselines/deck-matrix-baseline.json`)
// is only as true as the mechanics tree it was measured on. This script
// compares the baseline's stamped commit(s) against the mechanics source
// history and says, loudly, whether any balance-relevant code has landed
// since the last measurement.
//
// Usage:
//   node scripts/check-baseline-freshness.mjs            # report, exit 0
//   node scripts/check-baseline-freshness.mjs --strict   # exit 1 when stale
//
// Zero-dep; degrades gracefully on shallow clones (a stamp that resolves to
// no local commit is reported as unjudgeable, never as fresh). In GitHub
// Actions a stale baseline emits a ::warning annotation (soft — the alarm
// informs, the humans decide when to re-measure).

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = join(
  ROOT, 'axiomancer-mechanics', 'docs', 'reports', 'baselines',
  'deck-matrix-baseline.json',
);
// Balance truth lives in the mechanics engine source; docs/tests churn does
// not invalidate a measurement.
const WATCH_PATH = 'axiomancer-mechanics/src';

const strict = process.argv.includes('--strict');

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
}

if (!existsSync(BASELINE)) {
  console.log('baseline:check — no deck-matrix baseline found; nothing to compare.');
  process.exit(strict ? 1 : 0);
}

const meta = JSON.parse(readFileSync(BASELINE, 'utf8')).meta ?? {};
const stampText = String(meta.commit ?? '');
const candidates = [...stampText.matchAll(/\b[0-9a-f]{7,40}\b/g)].map((m) => m[0]);
const resolved = candidates.filter((h) => {
  try {
    git(['rev-parse', '--verify', '--quiet', `${h}^{commit}`]);
    return true;
  } catch {
    return false;
  }
});

const stampLabel = `${stampText || '(unstamped)'}${meta.generatedAt ? ` · measured ${meta.generatedAt}` : ''}${meta.confidence ? ` · confidence: ${meta.confidence}` : ''}`;

if (resolved.length === 0) {
  console.log(
    `baseline:check — stamp "${stampText}" resolves to no local commit `
    + '(shallow clone or rewritten history); freshness cannot be judged here.',
  );
  process.exit(0);
}

// Mechanics-source commits reachable from HEAD but not from ANY stamped
// commit — i.e. balance-relevant changes the baseline has never seen.
const log = git([
  'log', '--oneline',
  ...resolved.map((h) => `^${h}`), 'HEAD',
  '--', WATCH_PATH,
]);
const stale = log ? log.split('\n').filter(Boolean) : [];

if (stale.length === 0) {
  console.log(`baseline:check — FRESH. Baseline ${stampLabel}; no mechanics-source commits since.`);
  process.exit(0);
}

const shown = stale.slice(0, 15);
console.log(`baseline:check — STALE by ${stale.length} mechanics-source commit${stale.length === 1 ? '' : 's'}.`);
console.log(`  baseline: ${stampLabel}`);
for (const line of shown) console.log(`  · ${line}`);
if (stale.length > shown.length) console.log(`  … and ${stale.length - shown.length} more`);
console.log('  Re-measure: npm run baseline:regen (full) or the digest\'s reduced nightly pass.');

if (process.env.GITHUB_ACTIONS) {
  console.log(
    `::warning title=Stale combat baseline::deck-matrix-baseline.json was measured at ${stampText || 'an unknown commit'} `
    + `but ${stale.length} mechanics-source commit(s) have landed since. `
    + 'Balance findings citing it describe an older engine — regenerate via npm run baseline:regen.',
  );
}
process.exit(strict ? 1 : 0);
