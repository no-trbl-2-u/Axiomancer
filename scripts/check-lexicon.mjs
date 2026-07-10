#!/usr/bin/env node
// scripts/check-lexicon.mjs — retired-terminology lint. Zero dependencies.
//
//   node scripts/check-lexicon.mjs           # scan live prose surfaces
//   node scripts/check-lexicon.mjs --list    # print the registry
//
// Enforces axiomancer-mechanics/docs/lexicon.json (the single source for
// retired game terminology; docs/LEXICON.md is the human guide) against
// every live *.md surface in the monorepo, so a retired concept cannot
// quietly re-enter the docs an agent will read as current law.
//
// Three exemption mechanisms, in order of checking:
//   zone    — dated-record paths (CHANGELOG, braindump/, devlog/, specs/,
//             plan/ except bearings.md, reports, ADRs, automation/) may
//             speak in period terms; never scanned.
//   banner  — a file whose first 40 lines carry '**Status:** HISTORICAL'
//             is a point-in-time record; skipped whole.
//   pragma  — '<!-- lexicon-ok: <id>, <id> -->' anywhere in a file
//             exempts those registry ids for that file (for legitimate
//             removal-mentions like "basePower no longer exists").
//
// Exit codes: 0 clean; 1 findings (file:line: term -> replacement).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REGISTRY_PATH = path.join(ROOT, 'axiomancer-mechanics', 'docs', 'lexicon.json')
const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'))
const RETIRED = registry.retired.map((r) => ({ ...r, re: new RegExp(r.pattern, 'g') }))

if (process.argv.includes('--list')) {
  for (const r of RETIRED) console.log(`${r.id}: /${r.pattern}/ -> ${r.replacement} (since ${r.since})`)
  process.exit(0)
}

// Dated-record zones — path fragments (forward-slash, repo-relative).
const ZONE_DIRS = [
  'node_modules/', '.git/', 'kb/', 'tmp-images/', '.claude/worktrees/',
  'devlog/', 'braindump/', 'docs/reports/', 'docs/adr/', 'automation/', 'specs/',
]
const ZONE_BASENAMES = ['CHANGELOG.md', 'RELEASES.md', 'lexicon.json']
const PLAN_LIVE = 'plan/bearings.md' // the only live plan/ surface

const isZoned = (rel) => {
  if (rel.startsWith('plan/')) return rel !== PLAN_LIVE
  if (ZONE_BASENAMES.includes(path.basename(rel))) return true
  return ZONE_DIRS.some((z) => rel.includes(z))
}

const BANNER_RE = /\*\*Status:\*\*\s+HISTORICAL/i
const PRAGMA_RE = /<!--\s*lexicon-ok:\s*([^>]+?)\s*-->/g

function* mdFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'kb') continue
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* mdFiles(p)
    else if (entry.name.endsWith('.md')) yield p
  }
}

const findings = []
let scanned = 0
for (const abs of mdFiles(ROOT)) {
  const rel = path.relative(ROOT, abs).replaceAll('\\', '/')
  if (isZoned(rel)) continue
  const text = fs.readFileSync(abs, 'utf-8')
  if (BANNER_RE.test(text.split(/\r?\n/, 40).join('\n'))) continue
  const exemptIds = new Set(
    [...text.matchAll(PRAGMA_RE)].flatMap((m) => m[1].split(',').map((s) => s.trim())),
  )
  scanned++
  const lines = text.split(/\r?\n/)
  for (const term of RETIRED) {
    if (exemptIds.has(term.id)) continue
    lines.forEach((line, i) => {
      if (line.includes('lexicon-ok')) return
      term.re.lastIndex = 0
      if (term.re.test(line)) {
        findings.push(`${rel}:${i + 1}: "${term.id}" is retired (since ${term.since}) -> ${term.replacement}`)
      }
    })
  }
}

if (findings.length) {
  console.error(`check-lexicon: ${findings.length} retired-term finding(s) across live surfaces:`)
  findings.forEach((f) => console.error(`  ${f}`))
  console.error(`\nFix the prose, or if the mention is legitimate (describing the removal),`)
  console.error(`add '<!-- lexicon-ok: <id> -->' to the file; dated records get the`)
  console.error(`'**Status:** HISTORICAL' banner instead. See axiomancer-mechanics/docs/LEXICON.md.`)
  process.exit(1)
}
console.log(`check-lexicon: ${scanned} live file(s) clean against ${RETIRED.length} retired term(s)`)
