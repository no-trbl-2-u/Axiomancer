// scripts/check-comments.test.mjs — witness for the comment guard: it reads
// comments only, flags history and retired terms, honours `lexicon-ok`, and
// the guarded trees are clean.
//
//   node --test scripts/check-comments.test.mjs

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { commentsIn, scanComments, guardRows } from './check-comments.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rows = guardRows()
const ids = (text, file = 'x.ts') => scanComments(text, rows, file).map((f) => f.id)

test('line, block and JSDoc comments are all read, with their start lines', () => {
  const text = 'const a = 1 // one\n/* two */\n/**\n * three\n */\nfunction f() {}\n'
  const found = commentsIn(text)
  assert.deepEqual(found.map((c) => c.line), [1, 2, 3])
})

test('a // inside a string or template literal is not a comment', () => {
  const text = "const url = 'https://x // Phase 9'\nconst t = `a ${url} // Spec 33`\n"
  assert.deepEqual(commentsIn(text), [])
  assert.deepEqual(ids(text), [])
})

test('phase, spec and decision numbers in a comment are flagged', () => {
  assert.deepEqual(ids('// Phase 31 fixed this\n'), ['phase-number'])
  assert.deepEqual(ids('// phase R7c deleted the old path\n'), ['phase-number'])
  assert.deepEqual(ids('/** Spec 33 — the tray roll */\nconst x = 1\n'), ['spec-number'])
  assert.deepEqual(ids('// befriend opens mercy (D47)\n'), ['decision-number'])
  assert.deepEqual(ids('// THE BIG NUMBERS rewrite\n'), ['big-numbers'])
})

test('a finding names the line inside a multi-line comment', () => {
  const findings = scanComments('/**\n * fine\n * Spec 26b tuning\n */\nconst x = 1\n', rows, 'x.ts')
  assert.equal(findings[0].line, 3)
})

test('retired lexicon terms in a comment are flagged; lexicon-ok on the line exempts it', () => {
  assert.deepEqual(ids('// strips RELENT from the hand\n'), ['retired-keyword'])
  assert.deepEqual(ids('// strips RELENT from old saves lexicon-ok: migration names it\n'), [])
})

test('a comment that describes the code is clean', () => {
  assert.deepEqual(ids('// Each paid play takes the best-ranked card.\nconst x = 1\n'), [])
})

test('TSX comments are read too', () => {
  const text = 'const a = <View>{/* Phase 4 */}</View>\n'
  assert.deepEqual(ids(text, 'x.tsx'), ['phase-number'])
})

test('the guarded trees are clean', () => {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'check-comments.mjs')], { stdio: 'pipe' })
})
