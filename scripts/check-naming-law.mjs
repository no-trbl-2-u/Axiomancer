#!/usr/bin/env node
// scripts/check-naming-law.mjs — id hygiene guard.
//
// The Phase 44a naming law (NL-8 collision, NL-4/5 format-of-display-NAMES,
// V-1 philosophy-register ban) was repealed 2026-09-02 (big-numbers overhaul
// §3 L28, §10) along with every other content law — display names ("Caltrops
// Under the Snow") are no longer linted at all. What survives is a bug
// detector, not a style law: every content `id` (the machine key a card or
// enemy is addressed by) must be kebab-case and unique, because a malformed
// or colliding id is a real runtime bug (broken lookups, silent overwrites),
// not a taste call.
//
// Usage:
//   node scripts/check-naming-law.mjs --sweep   # walk the shipped libraries
//
// Exit codes: 0 clean; 1 findings.
// Zero dependencies. Node >=22 (repo engines floor).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Where shipped ids live. */
export const ID_SOURCES = [
  // THE BIG NUMBERS REWRITE (2026-09-02): the card library is a directory of
  // per-theme modules now; `cards.library.ts` is only the aggregator and holds
  // no `id:` of its own.
  { file: 'axiomancer-mechanics/src/Cards/library/starters.cards.ts' },
  { file: 'axiomancer-mechanics/src/Cards/library/relics.cards.ts' },
  { file: 'axiomancer-mechanics/src/Cards/library/rot.cards.ts' },
  { file: 'axiomancer-mechanics/src/Cards/library/debt.cards.ts' },
  { file: 'axiomancer-mechanics/src/Cards/library/grave.cards.ts' },
  { file: 'axiomancer-mechanics/src/Cards/library/vigil.cards.ts' },
  { file: 'axiomancer-mechanics/src/Cards/library/trial.cards.ts' },
  { file: 'axiomancer-mechanics/src/Cards/library/choir.cards.ts' },
  { file: 'axiomancer-mechanics/src/Cards/library/apocrypha.cards.ts' },
  { file: 'axiomancer-mechanics/src/Enemy/enemy.library.ts' },
]

const KEBAB_CASE = /^[a-z][a-z0-9-]*$/

/**
 * Every `id:` string in a source file, single- OR double-quoted.
 */
export function idsIn(text) {
  return [...text.matchAll(/^\s+id:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/gm)]
    .map((m) => (m[1] ?? m[2]).replace(/\\(['"])/g, '$1'))
}

/** The one surviving check: an id must be kebab-case. */
export function checkKebabCase(id) {
  return KEBAB_CASE.test(id) ? [] : [`"${id}" is not kebab-case (expected /^[a-z][a-z0-9-]*$/)`]
}

/** Sweep the shipped libraries for malformed or duplicate ids. Returns
 *  `{ findings, checked }`. */
export function sweep() {
  const findings = []
  const seen = new Map() // id -> first file it appeared in
  let checked = 0
  for (const { file } of ID_SOURCES) {
    const abs = path.resolve(ROOT, file)
    const ids = fs.existsSync(abs) ? idsIn(fs.readFileSync(abs, 'utf-8')) : []
    if (ids.length === 0) {
      findings.push(`${file}: no ids found — the sweep cannot verify this surface`)
      continue
    }
    for (const id of ids) {
      checked++
      for (const msg of checkKebabCase(id)) findings.push(`${file}: ${msg}`)
      if (seen.has(id)) {
        findings.push(`${file}: "${id}" duplicates an id first seen in ${seen.get(id)}`)
      } else {
        seen.set(id, file)
      }
    }
  }
  return { findings, checked }
}

// ── CLI ──
/**
 * True when this module is the process entry point.
 *
 * The old guard compared `import.meta.url` to `file://${process.argv[1]}`.
 * On Windows `process.argv[1]` is a backslash path (`C:\Users\...`) while
 * `import.meta.url` is `file:///C:/Users/...`, so the comparison was ALWAYS
 * false: every one of these CLIs exited 0 with no output on Windows, and the
 * `PostToolUse` lexicon hook was a silent no-op there. Normalising both sides
 * through `pathToFileURL` fixes it on every platform.
 */
function isDirectRun(moduleUrl) {
    if (!process.argv[1]) return false
    return moduleUrl === pathToFileURL(process.argv[1]).href
}

if (isDirectRun(import.meta.url)) {
  const args = process.argv.slice(2)

  if (args.includes('--sweep')) {
    const { findings, checked } = sweep()
    if (findings.length) {
      console.error(`check-naming-law: ${findings.length} finding(s) across ${checked} shipped id(s):`)
      findings.forEach((f) => console.error(`  ${f}`))
      process.exit(1)
    }
    console.log(`check-naming-law: ${checked} shipped id(s) clean.`)
    process.exit(0)
  }

  console.error('check-naming-law: pass --sweep to check every shipped id is kebab-case and unique.')
  process.exit(1)
}
