// scripts/check-naming-law.test.mjs — witness for the id-hygiene guard.
//
// The Phase 44a naming law (NL-8/NL-4/NL-5/V-1, display-name collision +
// format + philosophy-register checks) was repealed 2026-09-02 (big-numbers
// overhaul §3 L28, §10). What remains is a bug detector: every content id is
// kebab-case and unique.
//
//   node --test scripts/check-naming-law.test.mjs

import assert from 'node:assert/strict'
import test from 'node:test'

import { idsIn, checkKebabCase, sweep } from './check-naming-law.mjs'

test('idsIn parses ids out of a library source, both quote styles', () => {
  const src = [
    "    id: 'first-spadeful',",
    '    id: "the-sextons-bell",',
  ].join('\n')
  assert.deepEqual(idsIn(src), ['first-spadeful', 'the-sextons-bell'])
})

test('checkKebabCase accepts a well-formed id', () => {
  assert.deepEqual(checkKebabCase('spoiled-poultice'), [])
  assert.deepEqual(checkKebabCase('a'), [])
  assert.deepEqual(checkKebabCase('a1-b2'), [])
})

test('checkKebabCase rejects uppercase, spaces, underscores, and a leading digit', () => {
  assert.equal(checkKebabCase('Spoiled-Poultice').length, 1)
  assert.equal(checkKebabCase('spoiled poultice').length, 1)
  assert.equal(checkKebabCase('spoiled_poultice').length, 1)
  assert.equal(checkKebabCase('1-spoiled-poultice').length, 1)
})

test('the sweep reads real shipped ids and finds them clean', () => {
  const { findings, checked } = sweep()
  assert.ok(checked > 50, 'the sweep found almost no ids — the parser has drifted')
  assert.deepEqual(findings, [])
})
