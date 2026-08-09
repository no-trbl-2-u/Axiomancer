// scripts/check-naming-law.test.mjs — witness for the Phase 44a naming-law
// lint (spec 34 §5.9 items 3-5). Every case below is either a name spec 34
// itself cites as shipped-and-clean, or a violation spec 34's own examples
// construct — so a regression here means the lint has drifted from the
// ratified spec, not from some invented fixture.
//
//   node --test scripts/check-naming-law.test.mjs

import assert from 'node:assert/strict'
import test from 'node:test'

import { lintName, checkCollision, checkFormat, checkRegister, NL8_REGISTRY, V1_WORDS } from './check-naming-law.mjs'

test('registries are non-empty and carry the NL-9 survivors as V-1 words', () => {
  assert.ok(NL8_REGISTRY.length > 0)
  assert.ok(V1_WORDS.includes('aporia'))
  assert.ok(V1_WORDS.includes('sophist'))
})

test('NL-8 — shipped clean names pass', () => {
  for (const name of ['Caltrops Under the Snow', "The Sexton's Bell", 'First Spadeful', 'Every Stone an Oath']) {
    assert.deepEqual(checkCollision(name, 'card'), [], name)
  }
})

test('NL-8 — a name beginning with a registry keyword collides', () => {
  const findings = checkCollision('Poison Needle', 'card')
  assert.equal(findings.length, 1)
  assert.match(findings[0], /NL-8/)
})

test('NL-8 — the article is stripped before checking the head word', () => {
  const findings = checkCollision('The Guard', 'enemy')
  assert.equal(findings.length, 1)
})

test('NL-8 — only applies to card/enemy/place/npc kinds, not keywords', () => {
  assert.deepEqual(checkCollision('Guard', 'keyword'), [])
})

test('NL-8 — a rank word (post-retheme) collides too', () => {
  assert.equal(checkCollision('Ash Pact', 'card').length, 1)
})

test('NL-4 — numerals are rejected', () => {
  const findings = checkFormat('The 9th Bell')
  assert.equal(findings.length, 1)
  assert.match(findings[0], /NL-4/)
})

test('NL-4 — spelled-out numbers pass', () => {
  assert.deepEqual(checkFormat('The Ninth Bell'), [])
})

test('NL-5 — colons and parentheses are rejected', () => {
  assert.equal(checkFormat('The Black Cap: Sentencing').length, 1)
  assert.equal(checkFormat('The Black Cap (Sentencing)').length, 1)
})

test('V-1 — banned philosophy jargon is rejected', () => {
  const findings = checkRegister('The Premise Engine')
  assert.equal(findings.length, 1)
  assert.match(findings[0], /V-1/)
})

test('V-1 — NL-9 allows capitalized Aporia and Sophist as proper nouns', () => {
  assert.deepEqual(checkRegister('The Aporia'), [])
  assert.deepEqual(checkRegister('The Sophist'), [])
})

test('V-1 — lowercase aporia/sophist still trips (not used as the proper noun)', () => {
  assert.equal(checkRegister('an aporia of the self').length, 1)
})

test('lintName composes all three checks', () => {
  assert.deepEqual(lintName('Caltrops Under the Snow', 'card'), [])
  const findings = lintName('Premise 2: The Reckoning', 'card')
  assert.ok(findings.some((f) => f.startsWith('NL-4')))
  assert.ok(findings.some((f) => f.startsWith('NL-5')))
  assert.ok(findings.some((f) => f.startsWith('V-1')))
})
