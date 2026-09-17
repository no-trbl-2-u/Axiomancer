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
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = join(
  ROOT, 'axiomancer-mechanics', 'docs', 'reports', 'baselines',
  'deck-matrix-baseline.json',
);
// Balance truth lives in the mechanics engine source; docs/tests churn does
// not invalidate a measurement. `WATCH_ROOT` is the superset git is asked
// about; `isFreshnessRelevantPath` narrows a commit's changed files down to
// the ones that actually feed the combat deck-matrix sweep (see
// `scripts/regen-deck-matrix-baseline.mjs` → `combat-playtest`, which only
// reads Combat/Cards/Enemy/Character — never `World/`), so a commit counts
// as stale-causing only when at least one changed file survives the filter.
export const WATCH_ROOT = 'axiomancer-mechanics/src';

/** True if `rel` (repo-relative, forward-slash, e.g. `${WATCH_ROOT}/Combat/x.ts`)
 *  can affect the deck-matrix baseline's numbers. Excludes: paths outside
 *  `WATCH_ROOT`; `World/Continents/**` (map/dialogue content — confirmed by
 *  import-graph read to be disjoint from Combat/Cards/Enemy/Character, the
 *  combat-playtest sweep's actual inputs); test files (`*.test.ts(x)`, any
 *  `e2e/` directory) — a test asserting on content text is not a rule change. */
export function isFreshnessRelevantPath(rel) {
  const prefix = `${WATCH_ROOT}/`;
  if (!rel.startsWith(prefix)) return false;
  const inner = rel.slice(prefix.length);
  if (inner.startsWith('World/Continents/')) return false;
  if (/\.test\.tsx?$/.test(inner)) return false;
  if (inner.split('/').includes('e2e')) return false;
  return true;
}

const strict = process.argv.includes('--strict');

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
}

/** Comparable to `pathToFileURL` guard used by the other `scripts/check-*`
 *  CLIs — lets `isFreshnessRelevantPath` be imported by a test without
 *  running the git-backed report. */
function isDirectRun(moduleUrl) {
  if (!process.argv[1]) return false;
  return moduleUrl === pathToFileURL(process.argv[1]).href;
}

function run() {
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

  // Candidate commits reachable from HEAD but not from ANY stamped commit,
  // narrowed to the ones with at least one freshness-relevant changed file —
  // i.e. balance-relevant changes the baseline has never seen.
  const raw = git([
    'log', '--name-only', '--format=%x01%H %s',
    ...resolved.map((h) => `^${h}`), 'HEAD',
    '--', WATCH_ROOT,
  ]);
  const stale = raw
    ? raw.split('\x01').filter(Boolean).flatMap((block) => {
      const lines = block.split('\n').filter(Boolean);
      const [hash, ...subjectParts] = lines[0].split(' ');
      const files = lines.slice(1);
      return files.some(isFreshnessRelevantPath)
        ? [`${hash.slice(0, 7)} ${subjectParts.join(' ')}`]
        : [];
    })
    : [];

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
}

if (isDirectRun(import.meta.url)) {
  run();
}
