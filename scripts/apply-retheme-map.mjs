#!/usr/bin/env node
// scripts/apply-retheme-map.mjs — the Phase 44a codemod (build plan item b).
//
// Applies docs/retheme-map.json's old->new pairs across explicit file globs,
// so the dark-fantasy retheme (44b-44i) is 2,000 reviewable diff lines
// instead of 2,000 independent hand edits. NOT run by 44a — that phase ships
// the map and this tool with ZERO renames applied; 44b-44i invoke it.
//
// Usage:
//   node scripts/apply-retheme-map.mjs --list                     # print every pair
//   node scripts/apply-retheme-map.mjs --applies=44b <globs...>   # dry-run report
//   node scripts/apply-retheme-map.mjs --applies=44b --write <globs...>
//   node scripts/apply-retheme-map.mjs --kind=keyword --write <globs...>
//
// Filters (combine freely; omit both to run every pair):
//   --applies=<phase>   only pairs whose "applies" field matches (e.g. 44b, 44c)
//   --kind=<kind>       only pairs whose "kind" field matches (e.g. keyword, rank)
//
// Safety: this is a MECHANICAL word-boundary replacement, not a semantic
// rename. It does not know that a card comment discussing "the premise of
// this test" is English prose, not the PREMISE keyword — that is why every
// invocation defaults to a dry-run report (file, occurrence count) and
// requires an explicit --write to touch disk, and why callers MUST pass
// explicit globs (there is no default "scan everything" mode) so a phase
// scopes its own blast radius and reviews the resulting diff before commit.
// `keep` entries in the map are never touched — they are documentation of
// what spec 34 explicitly ratified unchanged, not codemod input.
//
// Zero dependencies. Node >=22 (repo engines floor).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MAP_PATH = path.join(ROOT, 'docs', 'retheme-map.json')
const map = JSON.parse(fs.readFileSync(MAP_PATH, 'utf-8'))

const args = process.argv.slice(2)
const write = args.includes('--write')
const kindFilter = args.find((a) => a.startsWith('--kind='))?.slice('--kind='.length) ?? null
const appliesFilter = args.find((a) => a.startsWith('--applies='))?.slice('--applies='.length) ?? null
const globs = args.filter((a) => !a.startsWith('--'))

/** Every rename pair (displayNames + ids), each tagged with which list it came from. */
const allPairs = [
  ...map.displayNames.map((p) => ({ ...p, list: 'displayNames' })),
  ...map.ids.map((p) => ({ ...p, list: 'ids' })),
]

if (args.includes('--list')) {
  for (const p of allPairs) {
    console.log(`[${p.list}/${p.kind}] "${p.old}" -> "${p.new}" (${p.ruling}, applies ${p.applies ?? '?'})`)
  }
  process.exit(0)
}

const pairs = allPairs
  .filter((p) => p.old !== p.new) // skip documented no-ops (e.g. "Press Fate" -> "Press Fate")
  .filter((p) => !kindFilter || p.kind === kindFilter)
  .filter((p) => !appliesFilter || p.applies === appliesFilter)

if (pairs.length === 0) {
  console.error('apply-retheme-map: no pairs matched the given --kind/--applies filters. Nothing to do.')
  process.exit(1)
}

if (globs.length === 0) {
  console.error('apply-retheme-map: refuses to run with no file globs — pass explicit paths/globs.')
  console.error('  e.g. node scripts/apply-retheme-map.mjs --applies=44b axiomancer-mobile/state/combat/keywords.ts')
  process.exit(1)
}

/** Expand a glob-ish arg to files. No true glob syntax — accepts explicit file
 *  paths or directories (recursed). Keeps the tool dependency-free; callers
 *  needing real glob expansion can rely on shell globbing before this runs. */
function* expand(target) {
  const abs = path.resolve(ROOT, target)
  if (!fs.existsSync(abs)) return
  const stat = fs.statSync(abs)
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue
      yield* expand(path.join(target, entry.name))
    }
  } else if (/\.(ts|tsx|js|jsx|md|json)$/.test(abs)) {
    yield abs
  }
}

const files = [...new Set(globs.flatMap((g) => [...expand(g)]))]

// Word-boundary regex per pair. \b works for the alphanumeric ids/keywords
// in this registry (no leading punctuation in any "old" value).
const compiled = pairs.map((p) => ({ ...p, re: new RegExp(`\\b${p.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g') }))

let totalOccurrences = 0
const report = []
for (const file of files) {
  const rel = path.relative(ROOT, file)
  let text = fs.readFileSync(file, 'utf-8')
  let fileHits = 0
  for (const p of compiled) {
    const matches = text.match(p.re)
    if (!matches) continue
    fileHits += matches.length
    totalOccurrences += matches.length
    report.push(`  ${rel}: "${p.old}" -> "${p.new}" x${matches.length}`)
    if (write) text = text.replace(p.re, p.new)
  }
  if (write && fileHits > 0) fs.writeFileSync(file, text)
}

console.log(`apply-retheme-map: ${pairs.length} pair(s) x ${files.length} file(s) — ${totalOccurrences} occurrence(s)${write ? ' REPLACED' : ' found (dry-run; pass --write to apply)'}`)
report.forEach((line) => console.log(line))
if (!write && totalOccurrences > 0) {
  console.log('\nRe-run with --write to apply, then review the diff by hand — this is a mechanical')
  console.log('word-boundary replacement, not a semantic one.')
}
