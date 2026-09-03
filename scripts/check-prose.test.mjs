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
  CONTENT_SURFACES, MB1_MAX_WORDS, PROSE_FIELDS, PROSE_RULES, VOICE_RULES,
  exemptionsIn, fieldFor, scanSource, stringLiterals,
} from './check-prose.mjs'
import { idsIn, sweep } from './check-naming-law.mjs'

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

// ── MB-1, the knife law (spec 34 §2.5.1) ────────────────────────────────────

test('a literal knows which field it sits under', () => {
  const src = ["    description:", "        'a long line of prose here',", "    scene: 'inline value',"]
  assert.equal(fieldFor(src, 2), 'description')
  assert.equal(fieldFor(src, 3), 'scene')
})

test('a narration sentence past the ceiling is flagged', () => {
  const long = `word `.repeat(MB1_MAX_WORDS + 3).trim()
  const src = `    scene: '${long}.',`
  assert.deepEqual(rules(scanSource(src, retired)), ['mb1-long-sentence'])
})

test('the SAME text in rules text is not flagged', () => {
  // `paidSummary` is governed by §2.3 and the real-units law. Shortening a paid
  // line to satisfy a narration ceiling trades a mechanical guarantee for a
  // stylistic one — so MB-1 must not reach it.
  const long = `word `.repeat(MB1_MAX_WORDS + 3).trim()
  assert.deepEqual(scanSource(`    paidSummary: '${long}.',`, retired), [])
  assert.ok(!PROSE_FIELDS.has('paidSummary'))
})

test('a semicolon in narration is flagged; one in rules text is not', () => {
  assert.deepEqual(
    rules(scanSource("    narration: 'The water climbs; the stair does not.',", retired)),
    ['mb1-semicolon'],
  )
  assert.deepEqual(scanSource("    paidSummary: 'REAP ALL: 3 per Soul; SIPHON 50%.',", retired), [])
})

test('short narration sentences pass', () => {
  assert.deepEqual(scanSource("    scene: 'A cold porch of pale stone. Three doors ahead.',", retired), [])
})

test('the register rules carry a fix and cite the spec', () => {
  for (const r of PROSE_RULES) {
    assert.ok(r.fix.length > 20, `${r.id} has no actionable fix`)
    assert.match(r.since, /spec 34/, `${r.id} does not cite its ruling`)
  }
})

test('a prose-ok pragma exempts a register rule too', () => {
  const long = `word `.repeat(MB1_MAX_WORDS + 3).trim()
  const src = ['// prose-ok: mb1-long-sentence — quoted from a period document', `    scene: '${long}.',`].join('\n')
  assert.deepEqual(scanSource(src, retired), [])
})

// ── the id-hygiene sweep (naming-law repeal, 2026-09-02) ────────────────────
// The NL-8/NL-4/NL-5/V-1 display-name lint (collision, format, philosophy
// register) was repealed with the rest of the content laws (big-numbers
// overhaul §3 L28, §10). What survives is a bug detector over machine ids.

test('ids are parsed out of a library source, both quote styles', () => {
  const src = [
    "    id: 'first-spadeful',",
    '    id: "the-sextons-bell",',
  ].join('\n')
  assert.deepEqual(idsIn(src), ['first-spadeful', 'the-sextons-bell'])
})

test('the sweep reads real shipped ids and finds them clean', () => {
  const { findings, checked } = sweep()
  assert.ok(checked > 50, 'the sweep found almost no ids — the parser has drifted')
  assert.deepEqual(findings, [])
})
