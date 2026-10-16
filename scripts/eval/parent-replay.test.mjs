// scripts/eval/parent-replay.test.mjs — the pure parent-replay parts (EV1b A4):
// the parent pick for merge commits, runner ownership, new-title detection,
// runner-output parsing, the "could not fail" verdict, acceptance parsing,
// the unproven-tick list and the section splice.

import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  SECTION_END, SECTION_START, checkTicks, firstParent, isTestFile, namedTests, newTitles, parseAcceptance,
  parseJsonReport, parseTap, renderReplaySection, runnerFor, seedTickStatus, spliceSection, summarizeReplay,
  testTitles, verdictFor,
} from './parent-replay-lib.mjs'

const pass = (...titles) => ({ ok: true, cases: titles.map((title) => ({ title, status: 'passed' })), message: '' })

test('firstParent: a merge replays on its first parent, a squash on its only parent', () => {
  assert.equal(firstParent('93f05dfe 5d5fac9b 9d44ca5e\n'), '5d5fac9b')
  assert.equal(firstParent('f0b58df3 cd785c17'), 'cd785c17')
  assert.equal(firstParent('rootsha'), null)
})

test('isTestFile and runnerFor: each workspace keeps its own runner; .mjs runs on node --test', () => {
  assert.ok(isTestFile('axiomancer-mobile/components/__tests__/TitleScreen.test.tsx'))
  assert.ok(!isTestFile('axiomancer-mobile/test-utils/render.tsx'))
  assert.deepEqual(runnerFor('scripts/loop-pr.test.mjs'), { runner: 'node', cwd: '' })
  assert.deepEqual(runnerFor('axiomancer-mobile/scripts/critique-drive.test.mjs'), { runner: 'node', cwd: '' })
  assert.deepEqual(runnerFor('axiomancer-mechanics/src/Cards/card-rules.test.ts'), { runner: 'vitest', cwd: 'axiomancer-mechanics' })
  assert.deepEqual(runnerFor('axiomancer-mobile/state/presenters/__tests__/card-program.engine.test.ts'), { runner: 'jest', cwd: 'axiomancer-mobile' })
  assert.equal(runnerFor('docs/x.test.ts'), null)
  assert.equal(runnerFor('scripts/eval/ledger-lib.mjs'), null)
})

test('testTitles and newTitles: literal titles only; a new file has every title new', () => {
  const src = "describe('x', () => {\n  it('keeps \\'quotes\\'', f)\n  test.skip(\"two\", f)\n  it(`three`, f)\n  it(`dyn ${n}`, f)\n})"
  assert.deepEqual(testTitles(src), ["keeps 'quotes'", 'two', 'three'])
  assert.deepEqual([...newTitles(src, "it('two', f)")], ["keeps 'quotes'", 'three'])
  assert.deepEqual([...newTitles("it('a', f)", null)], ['a'])
})

test('parseJsonReport: jest and vitest reports key by repo-relative path; a load error has no cases', () => {
  const report = {
    testResults: [
      { name: '/tmp/wt/axiomancer-mobile/a.test.tsx', status: 'passed', assertionResults: [{ title: 'a', status: 'passed' }] },
      { name: '/tmp/wt/axiomancer-mobile/b.test.tsx', status: 'failed', message: "Cannot find module '../New'", assertionResults: [] },
    ],
  }
  const out = parseJsonReport(report, '/tmp/wt')
  assert.equal(out['axiomancer-mobile/a.test.tsx'].ok, true)
  assert.equal(out['axiomancer-mobile/b.test.tsx'].ok, false)
  assert.deepEqual(out['axiomancer-mobile/b.test.tsx'].cases, [])
  assert.match(out['axiomancer-mobile/b.test.tsx'].message, /Cannot find module/)
  assert.deepEqual(parseJsonReport(null, '/x'), {})
})

test('parseTap: ok, not ok and skips; the exit code decides the file', () => {
  const tap = 'TAP version 13\n# Subtest: a\nok 1 - a\n  ---\nnot ok 2 - b\nok 3 - c # SKIP later\n1..3\n'
  const r = parseTap(tap, 1)
  assert.equal(r.ok, false)
  assert.deepEqual(r.cases, [{ title: 'a', status: 'passed' }, { title: 'b', status: 'failed' }, { title: 'c', status: 'skipped' }])
  assert.equal(parseTap('ok 1 - a\n', 0).ok, true)
})

test('verdictFor: passing on the parent could not fail; failing there, or not loading, is proof', () => {
  const fresh = new Set(['new one', 'new two'])
  const control = pass('old', 'new one', 'new two')

  const cnf = verdictFor(control, pass('old', 'new one', 'new two'), fresh)
  assert.equal(cnf.verdict, 'could-not-fail')
  assert.deepEqual(cnf.couldNotFailCases, ['new one', 'new two'])
  assert.equal(cnf.newCases, 2)

  const mixed = verdictFor(control, { ok: false, cases: [{ title: 'old', status: 'passed' }, { title: 'new one', status: 'failed' }, { title: 'new two', status: 'passed' }] }, fresh)
  assert.equal(mixed.verdict, 'fails-on-parent')
  assert.equal(mixed.reason, 'a case fails on the parent')
  assert.deepEqual(mixed.couldNotFailCases, ['new two'])

  const load = verdictFor(control, { ok: false, cases: [], message: 'Cannot find module' }, fresh)
  assert.equal(load.verdict, 'fails-on-parent')
  assert.equal(load.reason, 'does not load on the parent')

  const esm = verdictFor(control, { ok: false, cases: [{ title: 'scripts/x.test.mjs', status: 'failed' }], message: "SyntaxError: The requested module './x.mjs' does not provide an export named 'y'" }, fresh)
  assert.equal(esm.reason, 'does not load on the parent')

  assert.equal(verdictFor({ ok: false, cases: [] }, pass('x'), fresh).verdict, 'inconclusive')
  assert.equal(verdictFor(null, pass('x'), fresh).reason, 'no result at its merge')
  assert.equal(verdictFor(control, null, fresh).verdict, 'inconclusive')
})

test('parseAcceptance: ticked and open lines inside the section only', () => {
  const body = '## What shipped\n- [x] A9 not acceptance\n\n## Acceptance\n- [x] A1 one\n- [ ] A2 two\n- [x] **A3** three\n\n## Verify\n- [x] A4 after\n'
  assert.deepEqual(parseAcceptance(body), [
    { id: 'A1', ticked: true, text: 'one' },
    { id: 'A2', ticked: false, text: 'two' },
    { id: 'A3', ticked: true, text: 'three' },
  ])
  assert.deepEqual(parseAcceptance('no section'), [])
})

const files = [
  { path: 'axiomancer-mobile/x/__tests__/CombatBoard.handfan.test.tsx', verdict: 'could-not-fail', couldNotFailCases: ['fans'], freshTitles: ['fans'] },
  { path: 'axiomancer-mobile/x/__tests__/CombatBoard.S1-board.test.tsx', verdict: 'fails-on-parent', couldNotFailCases: [], freshTitles: ['board'] },
  { path: 'axiomancer-mobile/x/__tests__/CombatCardFace.paid.test.tsx', verdict: 'fails-on-parent', couldNotFailCases: ['paidLedgerFit drops the reservation'], freshTitles: ['paidLedgerFit drops the reservation', 'other'] },
]

test('namedTests: a file by base name or `.suffix` shorthand, a new case by a backticked token', () => {
  assert.deepEqual(namedTests('pinned (`CombatBoard.handfan.test.tsx`)', files).map((n) => [n.kind, n.couldNotFail]), [['file', true]])
  assert.deepEqual(namedTests('(`CombatBoard.handfan.test.tsx`, `.S1-board`)', files).map((n) => n.couldNotFail), [true, false])
  const c = namedTests('`paidLedgerFit` drops the FREE reservation', files)
  assert.deepEqual(c, [{ kind: 'case', name: 'CombatCardFace.paid.test.tsx > paidLedgerFit drops the reservation', couldNotFail: true }])
  assert.deepEqual(namedTests('Jest pins both directions', files), [])
})

test('checkTicks: unproven only when every named test could not fail; open ticks are skipped', () => {
  const body = [
    '## Acceptance',
    '- [x] A1 fan (`CombatBoard.handfan.test.tsx`)',
    '- [x] A2 board (`CombatBoard.handfan.test.tsx`, `.S1-board`)',
    '- [x] A3 `paidLedgerFit` fits',
    '- [x] A4 nothing named',
    '- [ ] A5 fan (`CombatBoard.handfan.test.tsx`)',
  ].join('\n')
  const ticks = checkTicks([{ number: 521, body, files }])
  assert.deepEqual(ticks.map((t) => [t.id, t.unproven, t.named.length]), [['A1', true, 1], ['A2', false, 2], ['A3', true, 1], ['A4', false, 0]])
  const s = summarizeReplay(files.map((f) => ({ ...f, reason: '' })), ticks)
  assert.equal(s.unproven, 2)
  assert.equal(s.ticksNamingNone, 1)
  assert.equal(s.couldNotFail, 1)
  assert.equal(s.newCasesPassing, 2)
})

test('seedTickStatus: unproven, cleared, or unnamed', () => {
  assert.match(seedTickStatus(undefined), /not found/)
  assert.match(seedTickStatus({ named: [], unproven: false }), /names no replayed test/)
  assert.match(seedTickStatus({ named: [{ name: 'a/b.test.ts', couldNotFail: true }], unproven: true }), /^unproven: .*b\.test\.ts/)
  assert.match(seedTickStatus({ named: [{ name: 'a/b.test.ts', couldNotFail: false }], unproven: false }), /^cleared: b\.test\.ts/)
})

test('renderReplaySection and spliceSection: the section replaces only its own markers', () => {
  const replay = {
    stamp: { commit: 'abcd1234', date: '2026-10-16' },
    ledgerStamp: '86eea99d',
    prs: [{ number: 521, files: files.map((f) => ({ ...f, status: 'added', reason: 'r', newCases: 1 })) }],
    ticks: [{ pr: 521, id: 'A1', text: 'fan', named: [{ name: 'x/CombatBoard.handfan.test.tsx', couldNotFail: true }], unproven: true }],
    seedTicks: [{ pr: 521, id: 'A4', status: 'names no replayed test' }],
  }
  const section = renderReplaySection(replay)
  assert.ok(section.startsWith(SECTION_START) && section.endsWith(SECTION_END))
  assert.match(section, /\| Unproven ticks \| 1 \|/)
  assert.match(section, /\| #521 \| A1 \| fan \| CombatBoard\.handfan\.test\.tsx \|/)
  assert.match(section, /- #521 A4: names no replayed test/)

  const ledger = '# Report\n\n<!-- eval:ledger:start -->\nledger\n<!-- eval:ledger:end -->\n'
  const once = spliceSection(ledger, section)
  assert.ok(once.includes('ledger\n<!-- eval:ledger:end -->') && once.includes(SECTION_START))
  const twice = spliceSection(once, section.replace('abcd1234', 'ffff0000'))
  assert.equal(twice.split(SECTION_START).length, 2)
  assert.match(twice, /ffff0000/)
  assert.ok(!twice.includes('abcd1234'))
})
