// scripts/check-lessons.test.mjs — witness for the lessons-ladder lint
// (Phase R11). Pins the one-line format, unique slugs, the byte cap, the
// open-lesson budget and the reflexes line cap, and runs the lint against
// the live plan/lessons.md so a malformed retro fails the root `npm test`.
//
//   node --test scripts/check-lessons.test.mjs

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { lintLessons, lintReflexes, MAX_OPEN } from './check-lessons.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ok = (slug, tail = 'open') =>
  `- **${slug}** · a trap → a rule · seen 1× · last 2026-10-12 · ${tail}`
const doc = (...lines) => ['# Lessons', '', '<!-- @domain:deploy -->', '', '## Deploy', '', ...lines, ''].join('\n')

test('a well-formed open and guarded lesson pass', () => {
  const r = lintLessons(doc(ok('one'), ok('two', 'guarded by scripts/x.test.mjs')))
  assert.deepEqual(r.findings, [])
  assert.equal(r.lessons, 2)
  assert.equal(r.open, 1)
})

test('the old numbered shape is a finding', () => {
  const r = lintLessons(doc('1. 2026-07-18 — something happened. Source: PR #1.'))
  assert.match(r.findings[0], /numbered entry/)
})

test('a bullet missing the seen count is a finding', () => {
  const r = lintLessons(doc('- **x** · trap → rule · last 2026-10-12 · open'))
  assert.match(r.findings[0], /does not match/)
})

test('a non-kebab slug is a finding', () => {
  const r = lintLessons(doc(ok('Bad_Slug')))
  assert.match(r.findings[0], /does not match/)
})

test('duplicate slugs are a finding', () => {
  const r = lintLessons(doc(ok('same'), ok('same')))
  assert.match(r.findings[0], /duplicate slug 'same'/)
})

test('a bullet over 500 bytes is a finding', () => {
  const long = `- **long** · ${'x'.repeat(480)} → rule · seen 1× · last 2026-10-12 · open`
  const r = lintLessons(doc(long))
  assert.match(r.findings[0], /bytes \(max 500\)/)
})

test(`more than ${MAX_OPEN} open lessons is a finding`, () => {
  const many = Array.from({ length: MAX_OPEN + 1 }, (_, i) => ok(`l${i}`))
  const r = lintLessons(doc(...many))
  assert.ok(r.findings.some((f) => /open lessons \(max 40\)/.test(f)))
})

test('prose outside a domain anchor is not linted', () => {
  const r = lintLessons('# Lessons\n\n- a header bullet that is not a lesson\n')
  assert.deepEqual(r.findings, [])
})

test('reflexes over 50 lines is a finding', () => {
  assert.deepEqual(lintReflexes('x\n'.repeat(50)), [])
  assert.match(lintReflexes('x\n'.repeat(51))[0], /51 lines/)
})

test('the live plan/lessons.md and plan/reflexes.md are clean', () => {
  const lessons = lintLessons(fs.readFileSync(path.join(ROOT, 'plan', 'lessons.md'), 'utf8'))
  assert.deepEqual(lessons.findings, [])
  assert.ok(lessons.lessons > 0, 'the migration kept the existing lessons')
  assert.deepEqual(lintReflexes(fs.readFileSync(path.join(ROOT, 'plan', 'reflexes.md'), 'utf8')), [])
})

test('the CLI exits 0 on the live files', () => {
  const out = execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'check-lessons.mjs')], { encoding: 'utf8' })
  assert.match(out, /format clean/)
})
