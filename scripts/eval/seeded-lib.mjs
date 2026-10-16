// scripts/eval/seeded-lib.mjs
//
// Pure parts of the seeded replay (phase EV1c, brief A6): the four real bugs
// of 2026-10-14, which of a fix's paths are the planted defect, which tests
// each mechanical gate runs on it, the per-gate verdict and the report
// section. No I/O here; `scripts/eval/seeded-replay.mjs` plants the defects
// in a detached worktree that is never pushed.

import { isBookkeeping } from './ledger-lib.mjs'
import { isTestFile } from './parent-replay-lib.mjs'

export const SECTION_START = '<!-- eval:seeded:start -->'
export const SECTION_END = '<!-- eval:seeded:end -->'

/** The real bugs, each by the commit that fixed it. Reverting a fix's source plants its bug. */
export const SEEDS = Object.freeze([
  { id: 'D1', pr: 534, fix: '4080f4a0', bug: '`riderPairs` ignored damage riders, so A Plain Blow drew no FREE pill' },
  { id: 'D2', pr: 523, fix: 'cfadbf7a', bug: "a loose die drop refused at the SACRIFICE floor showed no VITAE ring callout (#523's own follow-up)" },
  { id: 'D3', pr: 529, fix: '9d44ca5e', bug: "the leftmost hand card's FREE pill was clipped at the screen edge (#529's final head)" },
  { id: 'D4', pr: 543, fix: '80ea6f44', bug: 'the `pr-resolve` union merge split moved queue rows' },
])

/** The mechanical gates a planted defect meets, in the order the report lists them. */
export const GATES = Object.freeze([
  { key: 'ci', label: 'CI path filters', note: 'a `verify-*` workflow triggers on the planted paths' },
  { key: 'before', label: 'verify, tests as they stood', note: "the related tests at the fix's parent, where the bug lived" },
  { key: 'after', label: 'verify, with the fix\'s tests', note: "the related tests at the fix, with its source reverted" },
])

/**
 * The paths a fix changed that carry the defect: source, not tests and not
 * loop bookkeeping.
 *
 * @param {string[]} files every path the fix commit changed.
 * @returns {string[]} the paths to revert.
 * @example plantedPaths(['a/x.ts', 'a/__tests__/x.test.ts', 'telemetry/t.md']) // ['a/x.ts']
 */
export function plantedPaths(files) {
  return files.filter((f) => !isTestFile(f) && !isBookkeeping(f))
}

const stem = (path) => path.split('/').pop().replace(/\.[^.]+$/, '')
const dirOf = (path) => path.split('/').slice(0, -1).join('/')

/**
 * The tests a verify run relates to the planted paths: a test file in the
 * same directory or its `__tests__/` whose name starts with a planted file's
 * stem, plus any extra test files named (the fix's own).
 *
 * @param {string[]} planted the planted source paths.
 * @param {string[]} tracked every tracked file at the commit the tests run on.
 * @param {string[]} [extra] test files to add when tracked there.
 * @returns {string[]} sorted repo-relative test paths.
 * @example relatedTests(['m/c/Board.tsx'], ['m/c/__tests__/Board.fan.test.tsx', 'm/c/__tests__/Other.test.tsx']) // ['m/c/__tests__/Board.fan.test.tsx']
 */
export function relatedTests(planted, tracked, extra = []) {
  const trackedSet = new Set(tracked)
  const out = new Set(extra.filter((f) => trackedSet.has(f) && isTestFile(f)))
  for (const src of planted) {
    const d = dirOf(src)
    const s = stem(src)
    for (const f of tracked) {
      if (!isTestFile(f)) continue
      const fd = dirOf(f)
      if ((fd === d || fd === `${d}/__tests__`) && f.split('/').pop().startsWith(`${s}.`)) out.add(f)
    }
  }
  return [...out].sort()
}

/**
 * A test gate's verdict from its per-file results. A file that also fails
 * at the unplanted fix (the control) is noise, not a catch, and is dropped.
 *
 * @param {Record<string, { ok: boolean, message?: string }>} results keyed by test path.
 * @param {string[]} [noisy] files that fail at the control.
 * @returns {{ verdict: 'caught'|'missed'|'no tests', failing: string[], noisy: string[] }} caught when any related file fails that passes at the control.
 * @example testVerdict({ a: { ok: false }, b: { ok: false } }, ['b']).failing // ['a']
 */
export function testVerdict(results, noisy = []) {
  const entries = Object.entries(results).filter(([p]) => !noisy.includes(p))
  const dropped = Object.keys(results).filter((p) => noisy.includes(p))
  if (entries.length === 0) return { verdict: 'no tests', failing: [], noisy: dropped }
  const failing = entries.filter(([, r]) => !r.ok).map(([p]) => p)
  return { verdict: failing.length > 0 ? 'caught' : 'missed', failing, noisy: dropped }
}

/**
 * The CI gate's verdict: CI can only catch a defect when a `verify-*`
 * workflow triggers on its paths and the tests it runs fail.
 *
 * @param {string[]} triggered the workflows the planted paths trigger.
 * @param {{ verdict: string }} before the "tests as they stood" verdict.
 * @returns {{ verdict: 'caught'|'missed', why: string }} the verdict and its reason.
 */
export function ciVerdict(triggered, before) {
  if (triggered.length === 0) return { verdict: 'missed', why: 'no `verify-*` workflow triggers on these paths' }
  if (before.verdict === 'caught') return { verdict: 'caught', why: `${triggered.join(', ')} runs the failing tests` }
  return { verdict: 'missed', why: `${triggered.join(', ')} triggers, and its related tests pass` }
}

const cell = (s) => String(s).replace(/\|/g, '\\|')

/**
 * The seeded-replay section of `docs/reports/eval/latest.md`, markers included.
 *
 * @param {{ stamp: { commit: string, date: string }, seeds: object[] }} replay the run.
 * @returns {string} markdown.
 */
export function renderSeededSection(replay) {
  const out = [SECTION_START, '', '## Planted defects (EV1c, A6)', '']
  out.push(`Stamp: commit \`${replay.stamp.commit}\` (${replay.stamp.date}). Regenerate with \`node scripts/eval/seeded-replay.mjs\`; the data is \`docs/reports/eval/seeded.json\`.`, '')
  out.push("Each real bug of 2026-10-14 is planted again by reverting its fix's source (not its tests) in a detached worktree that is never pushed. Each mechanical gate then meets it:", '')
  for (const g of GATES) out.push(`- **${g.label}**: ${g.note}.`)
  out.push('', 'A related test that also fails at the unplanted fix (the control run) is noise and is dropped from both test gates; the JSON names it.', '', 'The related tests are the test files beside a planted file whose names start with its name, plus the files the fix itself changed. The antagonist, `/critique` and the merge gate are agent or session judges and are scored from the ledger, not replayed (brief Decisions).', '')
  out.push(`| Seed | Bug | Fix | Planted paths | ${GATES.map((g) => g.label).join(' | ')} |`, `|---|---|---|---|${GATES.map(() => '---').join('|')}|`)
  for (const s of replay.seeds) {
    const gates = GATES.map((g) => {
      const v = s.gates[g.key]
      return `${v.verdict}${v.why ? ` (${v.why})` : v.failing?.length ? ` (${v.failing.map((f) => f.split('/').pop()).join(', ')})` : ''}`
    })
    out.push(`| ${s.id} (#${s.pr}) | ${cell(s.bug)} | ${s.fix} | ${cell(s.planted.join(', '))} | ${gates.map(cell).join(' | ')} |`)
  }
  const tally = GATES.map((g) => `${g.label}: ${replay.seeds.filter((s) => s.gates[g.key].verdict === 'caught').length} of ${replay.seeds.length} caught`)
  out.push('', tally.join('; ') + '.', '', SECTION_END)
  return out.join('\n')
}
