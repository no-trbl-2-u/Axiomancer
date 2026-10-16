// scripts/eval/fixes.test.mjs — the pure EV1d parts: the fix ranking (A8),
// the frozen past-PR set, the catch-rate target and the change-failure
// baseline (A9), and the "For `/messy`" dump (A10), from fixture data.

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { FIXES, SECTION_END, SECTION_START, catchTarget, changeFailureBaseline, frozenSet, messyThemes, rankFixes, renderFixesSection } from './fixes-lib.mjs'

const pr = (number, extra = {}) => ({ number, head: `${number}aaaaaaaa`, uncovered: [], ran: [], followUps: [], antagonist: { verdict: 'none' }, ...extra })
const seed = (id, prNo, triggered, before, planted = ['axiomancer-mobile/x.ts']) => ({ id, pr: prNo, planted, triggered, gates: { ci: { verdict: before }, before: { verdict: before } } })

const ledger = {
  rows: [
    pr(526, { uncovered: ['scripts/x.mjs'] }),
    pr(529, { ran: [{ finishedAfterMerge: true }], antagonist: { verdict: 'not-pass' } }),
    pr(530, { head: 'c95114a2bbbbbbbb' }),
    pr(531),
    pr(532, { followUps: [{ sha: 'f' }] }),
  ],
  seeds: [{ id: 'S2', evidence: ['merge c95114a2', 'repair 23f06828'] }],
}
const rates = [
  { judge: 'CI and its path filters', misses: ['D4 (#543)'], of: 2 },
  { judge: 'The antagonist', misses: ['#520 (S3)', '#526 (S4)'], of: 3 },
  { judge: '`/critique`', misses: null, of: null, note: 'no denominator. Context: 2 follow-up fix(es) in the ledger cite a critique pass.' },
  { judge: 'The merge gate', misses: ['#529'], of: 5 },
  { judge: "The builder's own `[x]`", misses: ['#534 A1', '#521 A4 (S3)'], of: 4 },
]
const seeded = { seeds: [seed('D1', 534, ['verify-mobile.yml'], 'missed'), seed('D4', 543, [], 'missed', ['scripts/pr-resolve.mjs'])] }
const replay = { ticks: [{ named: [] }, { named: [{}] }], prs: [{ files: [{ verdict: 'could-not-fail', couldNotFailCases: ['a'] }, { verdict: 'fails-on-parent', couldNotFailCases: [] }] }] }
const ev = { rates, ledger, replay, seeded, mutation: null }

test('rankFixes: misses per size point, smaller first on a tie, and "adds" never counts a miss twice', () => {
  const ranked = rankFixes(ev)
  assert.equal(ranked.length, FIXES.length)
  const by = Object.fromEntries(ranked.map((f) => [f.id, f]))
  assert.deepEqual(by.F2.prevents, ['D4 (#543)', '#526 (S4)'])
  assert.deepEqual(by.F3.prevents, ['D4 (#543)'])
  assert.deepEqual(by.F5.prevents, ['#534 A1'])
  assert.equal(by.F4.score, 1)
  // F2 (S, 2) outranks F4 (M, 2 misses, score 1), and F1 (S, 1) ties F4 on score but is smaller.
  assert.deepEqual(ranked.slice(0, 3).map((f) => f.id), ['F2', 'F1', 'F3'])
  assert.equal(by.F3.adds, 0, 'F2 already covers D4')
  assert.equal(by.F6.adds, 0, 'F4 already covers the builder misses')
  for (let i = 1; i < ranked.length; i++) assert.ok(ranked[i - 1].score >= ranked[i].score)
  assert.ok(by.F8.found && by.F9.found && !by.F1.found)
})

test('frozenSet: escapes block, known-good PRs pass, and no head carries two verdicts', () => {
  const set = frozenSet(ledger, { S1: [529], S4: [526] })
  const verdict = Object.fromEntries(set.map((s) => [s.ref, s.expected]))
  assert.equal(verdict['#529'], 'block')
  assert.equal(verdict['#526'], 'block')
  assert.equal(verdict.c95114a2, 'block')
  assert.equal(verdict['#531'], 'pass')
  assert.equal(verdict['#530'], undefined, 'its head is an S2 merge')
  assert.equal(verdict['#532'], undefined, 'it drew a follow-up')
  assert.equal(verdict['23f06828'], undefined, 'a repair is not an escape')
  const heads = set.map((s) => s.head)
  assert.equal(new Set(heads).size, heads.length)
})

test('changeFailureBaseline: last N code merges, bookkeeping-only merges skipped, open windows counted', () => {
  const landings = [
    { sha: 'fix1aaaaaaaa', date: '2026-10-12T00:00:00Z', subject: 'fix: a again', pr: null, files: ['src/a.ts'] },
    { sha: 'rev1aaaaaaaa', date: '2026-10-11T00:00:00Z', subject: 'Revert "b"', pr: null, files: ['src/b.ts'] },
    { sha: 'm4aaaaaaaaaa', date: '2026-10-10T12:00:00Z', subject: 'plot: x', pr: 4, files: ['plan/x.md'] },
    { sha: 'm3aaaaaaaaaa', date: '2026-10-10T00:00:00Z', subject: 'feat: b', pr: 3, files: ['src/b.ts'] },
    { sha: 'm2aaaaaaaaaa', date: '2026-10-02T00:00:00Z', subject: 'feat: c', pr: 2, files: ['src/c.ts'] },
    { sha: 'm1aaaaaaaaaa', date: '2026-10-01T00:00:00Z', subject: 'feat: a', pr: 1, files: ['src/a.ts', 'plan/y.md'] },
  ]
  const b = changeFailureBaseline(landings, '2026-10-13T00:00:00Z', 3)
  assert.deepEqual(b.merges.map((m) => m.pr), [3, 2, 1])
  assert.deepEqual([b.failed, b.reverted, b.of, b.rate], [1, 1, 3, 33.3])
  assert.equal(b.merges.find((m) => m.pr === 1).followUps.length, 0, 'fix1 lands 11 days later')
  assert.equal(b.open, 1)
  assert.equal(b.finalOn, '2026-10-17')
})

test('catchTarget: today against the fixed target', () => {
  const t = catchTarget(seeded)
  assert.deepEqual(t.now, { triggered: 50, caught: 0, of: 2 })
  assert.equal(t.target.triggered, 100)
  assert.deepEqual(catchTarget(null).now, { triggered: null, caught: null, of: 0 })
})

test('messyThemes and the section: one theme per gate, every gate named once, markers kept', () => {
  const ranked = rankFixes(ev)
  const themes = messyThemes(rates, ranked)
  const gates = themes.map((t) => t.split(':')[0])
  assert.equal(new Set(gates).size, gates.length)
  for (const g of ['The merge gate', '/critique', 'Android', 'The plan queue files']) assert.ok(gates.includes(g), g)
  assert.match(themes.find((t) => t.startsWith('/critique')), /not measured/)
  assert.match(themes.find((t) => t.startsWith('The antagonist')), /No candidate fix aims at this gate/)
  const md = renderFixesSection({
    stamp: { commit: 'abcdef12', date: '2026-10-16' }, inputs: { ledger: '86eea99d' }, ranked,
    frozen: { frozenAt: 'abcdef12', set: frozenSet(ledger, { S1: [529] }) }, target: catchTarget(seeded),
    baseline: changeFailureBaseline([], '2026-10-16T00:00:00Z'), messy: themes,
  })
  assert.ok(md.startsWith(SECTION_START) && md.endsWith(SECTION_END))
  for (const h of ['### Ranked fix list (A8)', '### Success evidence (A9)', '## For `/messy`']) assert.ok(md.includes(h), h)
})
