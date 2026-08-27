// scripts/check-lexicon.test.mjs — witness for the lexicon lint's two row
// shapes (phase 66). The doctrine cases below are the exact drift shapes that
// bit three times in one week (MCP server 2026-08-08/12, the 9caf2a26
// reconciliation pass 2026-08-13, Phase 55 2026-08-14): a design law voided in
// the engine, prose left asserting it as current, wrapped across a markdown
// line break where a line-by-line regex cannot see it.
//
//   node --test scripts/check-lexicon.test.mjs

import assert from 'node:assert/strict'
import test from 'node:test'

import { scanText, loadRegistry, isZoned, exemptIdsIn, hasHistoricalBanner } from './check-lexicon.mjs'

const rows = loadRegistry()
const byId = (id) => {
  const row = rows.find((r) => r.id === id)
  assert.ok(row, `registry row ${id} is missing`)
  return [row]
}
const ids = (findings) => findings.map((f) => f.id)

test('the registry ships both row shapes, and identifier is the default', () => {
  assert.ok(rows.some((r) => r.type === 'doctrine'))
  assert.ok(rows.some((r) => r.type === 'identifier'))
  for (const r of rows) assert.ok(['identifier', 'doctrine'].includes(r.type), `${r.id}: ${r.type}`)
})

test('identifier rows still match line-wise, unchanged', () => {
  const findings = scanText('a line\nsomething about basePower here\n', byId('base-power'))
  assert.deepEqual(ids(findings), ['base-power'])
  assert.equal(findings[0].line, 2)
})

test('doctrine — the claim on one line is flagged with its line number', () => {
  const text = '# Doc\n\nintro\n\nStatus effects are the MAIN fun of combat.\n'
  const findings = scanText(text, byId('status-primacy-doctrine'))
  assert.deepEqual(ids(findings), ['status-primacy-doctrine'])
  assert.equal(findings[0].line, 5)
})

test('doctrine — the claim wrapped across a line break is flagged (the case a line-wise regex misses)', () => {
  const text = '# Doc\n\nstatus is the only path to 0 HP — Spec 32 v3 ("THE STRIKE\n  IS DEAD", 2026-07-08) deleted raw strike damage.\n'
  const findings = scanText(text, byId('strike-ban-doctrine'))
  assert.ok(findings.length > 0, 'wrapped doctrine claim went undetected')
  assert.equal(findings[0].line, 3)
})

test('doctrine — markdown emphasis inside the claim does not hide it', () => {
  const findings = scanText('Status effects are the **only** path to 0 HP.\n', byId('strike-ban-doctrine'))
  assert.deepEqual(ids(findings), ['strike-ban-doctrine'])
})

test('doctrine — a mention that names the law as RETIRED is not a finding', () => {
  const text = [
    'The 2026-08-08 unshackling retired the strike ban outright:',
    'direct damage is legal again, and the schema purge is all that survives.',
  ].join('\n')
  assert.deepEqual(scanText(text, byId('strike-ban-doctrine')), [])
})

test('doctrine — the file-level pragma exempts the row', () => {
  const text = '<!-- lexicon-ok: strike-ban-doctrine -->\n\nTHE STRIKE IS DEAD.\n'
  assert.deepEqual(scanText(text, byId('strike-ban-doctrine')), [])
})

test('a pragma may carry its own justification after an em dash', () => {
  assert.deepEqual(
    [...exemptIdsIn('<!-- lexicon-ok: strike-ban-doctrine — superseded record, dates itself -->')],
    ['strike-ban-doctrine'],
  )
  assert.deepEqual([...exemptIdsIn('<!-- lexicon-ok: base-power, chip-hp -->')], ['base-power', 'chip-hp'])
})

test('a HISTORICAL banner exempts the whole file, doctrine rows included', () => {
  const text = '# Old note\n\n**Status:** HISTORICAL\n\nStatus effects are the MAIN fun of combat.\n'
  assert.ok(hasHistoricalBanner(text))
  assert.deepEqual(scanText(text, rows), [])
})

test('zoning is unchanged — dated records are never scanned, bearings.md is', () => {
  assert.ok(isZoned('plan/AUDIT.md'))
  assert.ok(!isZoned('plan/bearings.md'))
  assert.ok(isZoned('axiomancer-mechanics/specs/35-objective-function-v2.md'))
  assert.ok(isZoned('devlog/entries/DIGEST_2026-08-14.md'))
  assert.ok(!isZoned('axiomancer-mechanics/CLAUDE.md'))
})

test('every registry pattern compiles and carries a replacement', () => {
  for (const r of rows) {
    assert.ok(r.replacement && r.replacement.length > 0, `${r.id} has no replacement`)
    assert.ok(r.since && r.since.length > 0, `${r.id} has no since`)
    assert.doesNotThrow(() => new RegExp(r.pattern, 'g'), `${r.id} pattern does not compile`)
  }
})
