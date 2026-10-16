#!/usr/bin/env node
// scripts/eval/fixes.mjs
//
// The report's last section (phase EV1d, brief A8-A10): the ranked fix
// list, the success evidence (frozen past-PR set, catch-rate target,
// change-failure baseline) and the "For `/messy`" dump. Reads the EV1 JSON
// in `docs/reports/eval/` and `git log --first-parent`; writes `fixes.json`,
// `frozen-set.json` (only when it does not exist yet, or with --refreeze)
// and the section of `docs/reports/eval/latest.md`. The pure parts live in
// `fixes-lib.mjs`.
//
//   node scripts/eval/fixes.mjs [--dry-run] [--refreeze]

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { SECTION_END, SECTION_START, catchTarget, changeFailureBaseline, frozenSet, messyThemes, rankFixes, renderFixesSection } from './fixes-lib.mjs'
import { SEED_PRS } from './miss-rates-lib.mjs'
import { spliceMarked } from './mutation-lib.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const OUT_DIR = join(ROOT, 'docs/reports/eval')

const read = (name) => (existsSync(join(OUT_DIR, name)) ? JSON.parse(readFileSync(join(OUT_DIR, name), 'utf8')) : null)
const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim()

const ledger = read('ledger.json')
const missRates = read('miss-rates.json')
if (!ledger || !missRates) throw new Error('fixes: run `node scripts/eval/escape-ledger.mjs` and `node scripts/eval/miss-rates.mjs` first')
const ev = { rates: missRates.rows, ledger, replay: read('parent-replay.json'), seeded: read('seeded.json'), mutation: read('mutation.json') }

const head = git(['rev-parse', 'HEAD'])
const stamp = { commit: head.slice(0, 8), date: git(['show', '-s', '--format=%cI', head]) }

/** First-parent landings on HEAD for the 60 days before the stamp (not the clock, so a rerun at one commit reads the same), newest first, with each PR merge's number and title. */
function landings() {
  const since = new Date(Date.parse(stamp.date) - 60 * 86400000).toISOString()
  const raw = git(['log', '--first-parent', head, `--since=${since}`,'--format=%H%x1f%cI%x1f%s%x1f%b%x1e'])
  return raw.split('\x1e').map((s) => s.trim()).filter(Boolean).map((rec) => {
    const [sha, date, subject, body] = rec.split('\x1f')
    const pr = subject.match(/^Merge pull request #(\d+)/)
    const title = pr ? (body ?? '').split('\n').find((l) => l.trim()) ?? subject : subject
    const parent = git(['rev-list', '--parents', '-n', '1', sha]).split(' ')[1]
    const files = parent ? git(['diff', '--name-only', parent, sha]).split('\n').filter(Boolean) : []
    return { sha, date, subject: title.trim(), pr: pr ? Number(pr[1]) : null, files }
  })
}

const frozenPath = join(OUT_DIR, 'frozen-set.json')
const frozen = existsSync(frozenPath) && !process.argv.includes('--refreeze')
  ? JSON.parse(readFileSync(frozenPath, 'utf8'))
  : { frozenAt: stamp.commit, ledgerStamp: ledger.stamp.commit, set: frozenSet(ledger, SEED_PRS) }

const ranked = rankFixes(ev)
const inputs = { 'miss rates': missRates.stamp.commit, ...missRates.inputs }
const report = {
  stamp, inputs, ranked, frozen,
  target: catchTarget(ev.seeded),
  baseline: changeFailureBaseline(landings(), stamp.date),
  messy: messyThemes(ev.rates, ranked),
}
const section = renderFixesSection(report)

if (process.argv.includes('--dry-run')) {
  process.stdout.write(`${section}\n`)
} else {
  if (!existsSync(frozenPath) || process.argv.includes('--refreeze')) writeFileSync(frozenPath, `${JSON.stringify(frozen, null, 2)}\n`)
  const { frozen: _f, ...data } = report
  writeFileSync(join(OUT_DIR, 'fixes.json'), `${JSON.stringify({ ...data, frozenAt: frozen.frozenAt }, null, 2)}\n`)
  const latest = join(OUT_DIR, 'latest.md')
  writeFileSync(latest, spliceMarked(readFileSync(latest, 'utf8'), section, SECTION_START, SECTION_END))
  console.log(`fixes: ${ranked.length} ranked, ${frozen.set.length} frozen, change failure ${report.baseline.failed}/${report.baseline.of} -> docs/reports/eval/latest.md`)
}
