#!/usr/bin/env node
/**
 * diff-public-surface.mjs — Phase 53 unit 3.
 *
 * Pretty-prints the Added / Removed (+ Changed-kind) diff between the
 * public-surface fixture at two git refs. Feeds Phase 52's CHANGELOG
 * Added / Removed bullets directly.
 *
 * Usage:
 *   node scripts/diff-public-surface.mjs <ref-A> <ref-B>
 *   node scripts/diff-public-surface.mjs                  # defaults to HEAD~1..HEAD
 *   node scripts/diff-public-surface.mjs v0.10.0 HEAD     # diff a tag against current
 *
 * The fixture path is `scripts/public-surface.expected.json` (committed
 * by Unit 1; enforced by Unit 2). Both refs must contain the file.
 */

import { execSync } from 'node:child_process'

const FIXTURE_PATH = 'scripts/public-surface.expected.json'

function readFixtureAtRef(ref) {
  try {
    const out = execSync(`git show ${ref}:${FIXTURE_PATH} 2>/dev/null`, {
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
    })
    return JSON.parse(out)
  } catch (err) {
    throw new Error(
      `[diff-public-surface] Could not read ${FIXTURE_PATH} at ref "${ref}". ` +
      `Either the ref is unknown or the fixture didn't exist at that point. ` +
      `(Original error: ${err.message.split('\n')[0]})`
    )
  }
}

function buildKindMap(surface) {
  const map = new Map()
  for (const name of surface.values ?? []) map.set(name, 'value')
  for (const name of surface.types ?? []) map.set(name, 'type')
  return map
}

function diffSurfaces(before, after) {
  const beforeMap = buildKindMap(before)
  const afterMap = buildKindMap(after)
  const added = []
  const removed = []
  const changedKind = []

  for (const [name, kind] of afterMap) {
    if (!beforeMap.has(name)) {
      added.push({ name, kind })
    } else if (beforeMap.get(name) !== kind) {
      changedKind.push({ name, from: beforeMap.get(name), to: kind })
    }
  }
  for (const [name, kind] of beforeMap) {
    if (!afterMap.has(name)) {
      removed.push({ name, kind })
    }
  }

  added.sort((a, b) => a.name.localeCompare(b.name))
  removed.sort((a, b) => a.name.localeCompare(b.name))
  changedKind.sort((a, b) => a.name.localeCompare(b.name))

  return { added, removed, changedKind }
}

function formatBlock(title, entries, formatter) {
  if (entries.length === 0) return ''
  const lines = [`### ${title} (${entries.length})`, '']
  for (const entry of entries) lines.push(`- ${formatter(entry)}`)
  lines.push('')
  return lines.join('\n')
}

function main() {
  const args = process.argv.slice(2)
  const refA = args[0] ?? 'HEAD~1'
  const refB = args[1] ?? 'HEAD'

  const before = readFixtureAtRef(refA)
  const after = readFixtureAtRef(refB)
  const { added, removed, changedKind } = diffSurfaces(before, after)

  console.log(`# Public-surface diff: ${refA} → ${refB}`)
  console.log('')

  if (added.length === 0 && removed.length === 0 && changedKind.length === 0) {
    console.log('No surface drift between these refs.')
    return
  }

  process.stdout.write(formatBlock('Added', added, e => `\`${e.name}\` (${e.kind})`))
  process.stdout.write(formatBlock('Removed', removed, e => `\`${e.name}\` (${e.kind})`))
  process.stdout.write(formatBlock('Changed kind', changedKind, e => `\`${e.name}\`: ${e.from} → ${e.to}`))
}

try {
  main()
} catch (err) {
  console.error(err.message)
  process.exit(1)
}
