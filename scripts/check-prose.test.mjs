// scripts/check-prose.test.mjs — witness for the shipped-content prose lint
// and the naming-law sweep (phase 70).
//
// The rules under test are the house's own, not invented here: the voice rules
// come from `axiomancer-mechanics/docs/narrative/LEXICON.md` ("Ban from house
// narration") and the voice summary in `.claude/agents/content-curator.md`.
//
//   node --test scripts/check-prose.test.mjs

import assert from 'node:assert/strict'
import test from 'node:test'

import { loadRegistry } from './check-lexicon.mjs'
import {
  CONTENT_SURFACES, VOICE_RULES, exemptionsIn, scanSource, stringLiterals,
} from './check-prose.mjs'
import { GRANDFATHERED_NAMES, namesIn, sweep } from './check-naming-law.mjs'

const retired = loadRegistry().filter((r) => r.type === 'identifier')
const rules = (findings) => findings.map((f) => f.rule)

test('every content surface listed actually exists and holds prose', () => {
  // The lint fails on an empty surface at runtime; this pins the list itself so
  // a moved file is caught by the unit test too.
  assert.ok(CONTENT_SURFACES.length > 10)
})

test('string literals are extracted with their line numbers', () => {
  const src = ["const a = 'hello there friend';", '', 'const b = "second line here";'].join('\n')
  const found = stringLiterals(src)
  assert.deepEqual(found.map((s) => s.value), ['hello there friend', 'second line here'])
  assert.deepEqual(found.map((s) => s.line), [1, 3])
})

test('code is not prose — operators and identifiers are never linted', () => {
  // The whole reason the lint reads literals rather than raw source: `!==` and
  // `!ok` would otherwise trip the exclamation rule on every file.
  const src = 'if (a !== b && !ok) { return thou; }\nconst basePower = 1;'
  assert.deepEqual(scanSource(src, retired), [])
})

test('short strings are ids and keys, not prose', () => {
  assert.deepEqual(scanSource("const k = 'thou';", retired), [])
})

test('faux-archaic constructions are flagged', () => {
  const src = "const line = 'What thou carriest, the gate will count.';"
  assert.deepEqual(rules(scanSource(src, retired)), ['faux-archaic'])
})

test('exclamation marks in player-facing prose are flagged', () => {
  const src = "const line = 'Excellent! Every observation matters here.';"
  assert.deepEqual(rules(scanSource(src, retired)), ['exclamation'])
})

test('scriptural-weather and prestige-dark filler are flagged', () => {
  assert.deepEqual(
    rules(scanSource("const a = 'The blood-red sky hung over the ford.';", retired)),
    ['scriptural-weather'],
  )
  assert.deepEqual(
    rules(scanSource("const b = 'A nameless dread settled on the camp.';", retired)),
    ['prestige-dark'],
  )
})

test('a retired term inside a string is flagged with its registry id', () => {
  const src = "const line = 'The court counts your PREMISES and finds them thin.';"
  assert.deepEqual(rules(scanSource(src, retired)), ['retired:premise'])
})

test('the prose-ok pragma exempts one rule for the file', () => {
  const src = ['// prose-ok: exclamation — the herald genuinely shouts', "const l = 'Make way! The bell is rung.';"].join('\n')
  assert.deepEqual(scanSource(src, retired), [])
})

test('the lexicon-ok pragma exempts one registry id, justification and all', () => {
  const src = [
    '// lexicon-ok: premise — the riddle asks about arguments, not the keyword',
    "const l = 'WHAT ARGUMENT HAS NO FIRST PREMISES?';",
  ].join('\n')
  assert.deepEqual(scanSource(src, retired), [])
  const ex = exemptionsIn(src)
  assert.deepEqual([...ex.lexicon], ['premise'])
  assert.deepEqual([...ex.prose], [])
})

test('a pragma exempts only what it names', () => {
  const src = ['// prose-ok: faux-archaic', "const l = 'Excellent! Every observation matters here.';"].join('\n')
  assert.deepEqual(rules(scanSource(src, retired)), ['exclamation'])
})

test('every voice rule carries a fix and a source', () => {
  for (const r of VOICE_RULES) {
    assert.ok(r.fix && r.fix.length > 10, `${r.id} has no actionable fix`)
    assert.ok(r.since && r.since.length > 5, `${r.id} does not say where the rule comes from`)
  }
})

// ── the naming-law sweep ─────────────────────────────────────────────────────

test('names are parsed out of a library source, both quote styles', () => {
  // The library switches to double quotes for names carrying an apostrophe, so
  // a single-quote-only parser silently skipped 7 of the 57 card names.
  const src = [
    "    name: 'First Spadeful',",
    '    name: "The Sexton\'s Bell",',
  ].join('\n')
  assert.deepEqual(namesIn(src), ['First Spadeful', "The Sexton's Bell"])
})

test('the sweep reads real shipped names and finds them clean', () => {
  const { findings, checked, skipped } = sweep()
  assert.ok(checked > 50, 'the sweep found almost no names — the parser has drifted')
  assert.deepEqual(findings, [])
  // Grandfathered names are reported, never silently dropped.
  assert.deepEqual(skipped, [...GRANDFATHERED_NAMES.keys()].filter((n) => skipped.includes(n)))
})

test('every grandfathered name says which finding it covers and why', () => {
  for (const [name, reason] of GRANDFATHERED_NAMES) {
    assert.match(reason, /NL-\d/, `${name}'s exemption does not name a rule`)
    assert.ok(reason.length > 40, `${name}'s exemption does not explain itself`)
  }
})
