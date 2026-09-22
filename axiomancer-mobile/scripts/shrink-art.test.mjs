// axiomancer-mobile/scripts/shrink-art.test.mjs — the pure half of the
// build-size pass, proven without touching a pixel.
//
//   node --test axiomancer-mobile/scripts/shrink-art.test.mjs
//
// The IO half (read → sharp → write) is exercised by running the script; what
// must hold regardless is the provenance arithmetic: which entries get the
// note, that the note never stacks, and that nothing is mutated in place.

import assert from 'node:assert/strict'
import test from 'node:test'

import { RECIPE } from './ingest-art.mjs'
import { annotateProvenance, entryCoversAny, parseArgs, sizePassNote } from './shrink-art.mjs'

test('parseArgs defaults to the ingest recipe and reads the flags', () => {
  const defaults = parseArgs([])
  assert.equal(defaults.quality, RECIPE.quality)
  assert.equal(defaults.maxEdge, RECIPE.maxEdge)
  assert.deepEqual(defaults.dirs, [])
  assert.equal(defaults.dryRun, false)

  const set = parseArgs(['--dirs', 'enemies, labyrinth/walls', '--quality', '60', '--max-edge', '1024', '--dry-run'])
  assert.deepEqual(set.dirs, ['enemies', 'labyrinth/walls'])
  assert.equal(set.quality, 60)
  assert.equal(set.maxEdge, 1024)
  assert.equal(set.dryRun, true)
})

test('parseArgs refuses a flag without a value', () => {
  assert.throws(() => parseArgs(['--dirs']), /--dirs needs a value/)
  assert.throws(() => parseArgs(['--quality', '--dry-run']), /--quality needs a value/)
})

test('sizePassNote names the date, cap, quality and the script', () => {
  const note = sizePassNote({ quality: 44, maxEdge: 640 }, '2026-09-22')
  assert.match(note, /^2026-09-22 build-size pass/)
  assert.match(note, /longest edge <= 640px, WebP q44/)
  assert.match(note, /scripts\/shrink-art\.mjs$/)
})

test('entryCoversAny: prose catch-all covers, lists must intersect', () => {
  const written = new Set(['a.webp', 'b.webp'])
  assert.equal(entryCoversAny({ covers: 'every .webp not named by a later entry' }, written), true)
  assert.equal(entryCoversAny({ covers: ['a.webp'] }, written), true)
  assert.equal(entryCoversAny({ covers: ['a.webp (the boss plate)'] }, written), true)
  assert.equal(entryCoversAny({ covers: ['z.webp'] }, written), false)
  assert.equal(entryCoversAny({}, written), false)
})

test('annotateProvenance appends once, only to covering entries, without mutating', () => {
  const note = 'NOTE'
  const record = [
    { covers: ['a.webp'], post_process: 'graded' },
    { covers: ['z.webp'], post_process: 'graded' },
    { covers: ['b.webp'] },
  ]
  const frozen = JSON.stringify(record)
  const once = annotateProvenance(record, new Set(['a.webp', 'b.webp']), note)
  assert.equal(JSON.stringify(record), frozen, 'input must not be mutated')
  assert.equal(once[0].post_process, 'graded; NOTE')
  assert.equal(once[1].post_process, 'graded')
  assert.equal(once[2].post_process, 'NOTE')

  const twice = annotateProvenance(once, new Set(['a.webp', 'b.webp']), note)
  assert.deepEqual(twice, once, 'a re-run must not stack the note')
})

test('annotateProvenance accepts a single-entry record and returns a list', () => {
  const out = annotateProvenance({ covers: 'all of it' }, new Set(['a.webp']), 'NOTE')
  assert.ok(Array.isArray(out))
  assert.equal(out[0].post_process, 'NOTE')
})
