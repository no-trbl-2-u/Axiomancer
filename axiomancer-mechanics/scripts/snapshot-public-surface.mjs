#!/usr/bin/env node
/**
 * snapshot-public-surface.mjs — Phase 53 unit 1.
 *
 * Walks `dist/index.d.ts` (the post-build canonical surface) and emits
 * a deterministic-sorted JSON listing every exported name + kind. The
 * output is the contract — `scripts/public-surface.expected.json` is
 * the committed fixture, and `scripts/deploy-check.mjs` enforces that
 * the current snapshot matches the fixture.
 *
 * Shape: `{ values: string[], types: string[] }`. Both arrays are
 * sorted, deduplicated. `values` are runtime exports (functions, const,
 * enum); `types` are TS-erased exports (interface, type alias).
 *
 * Per Phase 53 D1, arity / shape hints are deferred — name + kind is
 * sufficient to catch the add / remove / rename drift this phase
 * targets. Shape drift is caught by the existing hermetic tests +
 * type-checker.
 *
 * CLI mode:
 *   node scripts/snapshot-public-surface.mjs               # print JSON to stdout
 *   node scripts/snapshot-public-surface.mjs --write       # overwrite the fixture
 *
 * Library mode (imported by deploy-check.mjs):
 *   import { snapshotPublicSurface } from './snapshot-public-surface.mjs';
 *   const surface = snapshotPublicSurface();
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST_INDEX_DTS = 'dist/index.d.ts'
const FIXTURE_PATH = 'scripts/public-surface.expected.json'

const EXPORT_LINE_RE = /^export\s+(type\s+)?\{\s*([^}]+)\s*\}\s+from\s+'[^']+'\s*;?\s*$/
const EXPORT_STAR_RE = /^export\s+(type\s+)?\*\s+from\s+'([^']+)'\s*;?\s*$/

/**
 * Recursively walk a `.d.ts` barrel, folding named exports into `values`
 * / `types`. `export { ... } from` lines are read directly; `export *
 * from './sub'` lines are resolved to `<sub>/index.d.ts` (or `<sub>.d.ts`)
 * and walked so re-exported submodule surfaces are not blind spots.
 *
 * @param {string} dtsPath absolute path to a `.d.ts` file
 * @param {Set<string>} values runtime export accumulator
 * @param {Set<string>} types type export accumulator
 * @param {Set<string>} visited resolved paths already walked (cycle guard)
 */
function collectExports(dtsPath, values, types, visited) {
  if (visited.has(dtsPath)) return
  visited.add(dtsPath)
  if (!existsSync(dtsPath)) return

  const text = readFileSync(dtsPath, 'utf8')
  const baseDir = dirname(dtsPath)

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()

    const named = line.match(EXPORT_LINE_RE)
    if (named) {
      const isTypeExport = Boolean(named[1])
      const target = isTypeExport ? types : values
      for (const name of named[2].split(',').map(n => n.trim()).filter(Boolean)) {
        target.add(name)
      }
      continue
    }

    const star = line.match(EXPORT_STAR_RE)
    if (star) {
      const spec = star[2]
      const resolvedBase = resolve(baseDir, spec)
      const candidates = resolvedBase.endsWith('.d.ts')
        ? [resolvedBase]
        : [`${resolvedBase}.d.ts`, resolve(resolvedBase, 'index.d.ts')]
      const next = candidates.find(existsSync)
      if (next) collectExports(next, values, types, visited)
    }
  }
}

export function snapshotPublicSurface(distIndexPath = DIST_INDEX_DTS) {
  if (!existsSync(distIndexPath)) {
    throw new Error(
      `[snapshot-public-surface] ${distIndexPath} not found. Run \`npm run build\` first.`
    )
  }

  const values = new Set()
  const types = new Set()
  collectExports(resolve(distIndexPath), values, types, new Set())

  return {
    values: [...values].sort(),
    types: [...types].sort(),
  }
}

// CLI entry point
const isMain = process.argv[1] === fileURLToPath(import.meta.url)
if (isMain) {
  const surface = snapshotPublicSurface()
  const json = JSON.stringify(surface, null, 2) + '\n'

  if (process.argv.includes('--write')) {
    writeFileSync(FIXTURE_PATH, json)
    console.log(
      `[snapshot-public-surface] Wrote ${surface.values.length} values + ` +
      `${surface.types.length} types to ${FIXTURE_PATH}.`
    )
  } else {
    process.stdout.write(json)
  }
}
