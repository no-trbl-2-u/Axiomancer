#!/usr/bin/env node
/**
 * snapshot-public-surface.test.mjs — guard-integrity coverage for the
 * public-surface snapshot's `export *` resolution (critique-78 HIGH).
 *
 * Builds a throwaway `.d.ts` tree under the OS temp dir and asserts that
 * `snapshotPublicSurface` follows `export * from './sub'` re-exports — the
 * blind spot that let Phase 160's Rest/LootCache sim exports reach the
 * package root unguarded. Hermetic: own temp dir, cleaned up after.
 */

import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { strict as assert } from 'node:assert'

import { snapshotPublicSurface } from '../snapshot-public-surface.mjs'

function test(name, fn) {
  console.log(`Running test: ${name}`)
  try {
    fn()
    console.log(`\u2713 ${name}`)
  } catch (err) {
    console.error(`\u2717 ${name}`)
    console.error(err.message)
    process.exit(1)
  }
}

console.log('Starting snapshot-public-surface.mjs tests...\n')

const work = mkdtempSync(join(tmpdir(), 'surface-snap-'))

try {
  test('direct export { } from lines are collected', () => {
    const root = join(work, 'a')
    mkdirSync(root, { recursive: true })
    writeFileSync(
      join(root, 'index.d.ts'),
      [
        "export { foo, bar } from './impl';",
        "export type { Baz } from './impl';",
      ].join('\n')
    )
    const surface = snapshotPublicSurface(join(root, 'index.d.ts'))
    assert.deepEqual(surface.values, ['bar', 'foo'])
    assert.deepEqual(surface.types, ['Baz'])
  })

  test('export * from is followed into a submodule index.d.ts', () => {
    const root = join(work, 'b')
    mkdirSync(join(root, 'Sub'), { recursive: true })
    writeFileSync(
      join(root, 'index.d.ts'),
      [
        "export { topLevel } from './local';",
        "export * from './Sub';",
      ].join('\n')
    )
    writeFileSync(
      join(root, 'Sub', 'index.d.ts'),
      [
        "export { deepValue, anotherValue } from './deep';",
        "export type { DeepType } from './deep';",
      ].join('\n')
    )
    const surface = snapshotPublicSurface(join(root, 'index.d.ts'))
    assert.deepEqual(surface.values, ['anotherValue', 'deepValue', 'topLevel'])
    assert.deepEqual(surface.types, ['DeepType'])
  })

  test('export * resolves a sibling <name>.d.ts when no index exists', () => {
    const root = join(work, 'c')
    mkdirSync(root, { recursive: true })
    writeFileSync(join(root, 'index.d.ts'), "export * from './flat';")
    writeFileSync(join(root, 'flat.d.ts'), "export { flatValue } from './x';")
    const surface = snapshotPublicSurface(join(root, 'index.d.ts'))
    assert.deepEqual(surface.values, ['flatValue'])
  })

  test('nested export * chains are followed recursively', () => {
    const root = join(work, 'd')
    mkdirSync(join(root, 'L1', 'L2'), { recursive: true })
    writeFileSync(join(root, 'index.d.ts'), "export * from './L1';")
    writeFileSync(join(root, 'L1', 'index.d.ts'), "export * from './L2';")
    writeFileSync(
      join(root, 'L1', 'L2', 'index.d.ts'),
      "export { leaf } from './leaf';"
    )
    const surface = snapshotPublicSurface(join(root, 'index.d.ts'))
    assert.deepEqual(surface.values, ['leaf'])
  })

  test('cyclic export * chains terminate without looping', () => {
    const root = join(work, 'e')
    mkdirSync(join(root, 'X'), { recursive: true })
    writeFileSync(
      join(root, 'index.d.ts'),
      ["export { rootName } from './r';", "export * from './X';"].join('\n')
    )
    writeFileSync(
      join(root, 'X', 'index.d.ts'),
      ["export { xName } from './x';", "export * from '..';"].join('\n')
    )
    const surface = snapshotPublicSurface(join(root, 'index.d.ts'))
    assert.deepEqual(surface.values, ['rootName', 'xName'])
  })
} finally {
  rmSync(work, { recursive: true, force: true })
}

console.log('\n\u2713 All tests passed!')
