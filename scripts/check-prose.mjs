#!/usr/bin/env node
// scripts/check-prose.mjs — the house-voice lint for shipped `.ts` content
// (phase 70). Zero dependencies.
//
//   node scripts/check-prose.mjs             # lint every content surface
//   node scripts/check-prose.mjs <files...>  # lint just these (hook mode)
//   node scripts/check-prose.mjs --list      # print the rules + surfaces
//
// THE PIPELINE LIBERATION (2026-08-22) authorized autonomous narrative
// shipping; the guardrail did not follow. `check-lexicon.mjs` scans `.md`
// only, so every player-facing string — dialogue trees, map-event prose,
// labyrinth rooms, card and enemy text, mobile copy — shipped un-linted, and
// `content-curator.md` told its own agent to "self-check your `.ts` strings
// against the registry by hand". A hand-check is not a gate.
//
// What it lints: STRING LITERALS ONLY, from an explicit file list.
//   - literals, because linting raw TypeScript would read `!==` as an
//     exclamation mark and every identifier as prose;
//   - an explicit list, because adding a content surface should be a
//     deliberate act — and a listed file that yields no strings FAILS, so a
//     moved or renamed file cannot quietly stop being checked.
//
// Exemptions (file-level, mirroring the `.md` pragma in check-lexicon.mjs):
//   // lexicon-ok: <registry-id>, <id>   — a legitimate retired-term mention
//   // prose-ok: <rule-id>, <rule-id>    — a legitimate voice-rule exception
// Both may carry ' — why' after the list; the justification is ignored.
//
// Exit codes: 0 clean; 1 findings (file:line: rule -> what to do).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadRegistry } from './check-lexicon.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/**
 * The authored content surfaces, from `.claude/agents/content-curator.md`'s
 * own "Where narrative content lives" table. Explicit, not a glob.
 */
export const CONTENT_SURFACES = [
  'axiomancer-mechanics/src/World/MapEvents/content.ts',
  'axiomancer-mechanics/src/World/Labyrinth/content/act1.content.ts',
  'axiomancer-mechanics/src/World/Labyrinth/content/act2.content.ts',
  'axiomancer-mechanics/src/World/Labyrinth/content/act3.content.ts',
  'axiomancer-mechanics/src/World/Hazard/hazard.content.ts',
  'axiomancer-mechanics/src/World/RestChoice/restchoice.content.ts',
  'axiomancer-mechanics/src/World/Blacksmith/blacksmith.content.ts',
  'axiomancer-mechanics/src/World/Continents/Coastal-Village/npcs.ts',
  'axiomancer-mechanics/src/World/Continents/Northern-Forest/npcs.ts',
  'axiomancer-mechanics/src/World/quest.library.ts',
  'axiomancer-mechanics/src/Enemy/enemy.library.ts',
  'axiomancer-mechanics/src/Cards/cards.library.ts',
  'axiomancer-mobile/state/presenters/rest.copy.ts',
  'axiomancer-mobile/state/presenters/cache.copy.ts',
]

/**
 * House voice rules. Sourced from `axiomancer-mechanics/docs/narrative/
 * LEXICON.md` ("Ban from house narration") and the voice summary in
 * `.claude/agents/content-curator.md`. Each is a claim about PLAYER-FACING
 * prose, so each is checked against string literals only.
 */
export const VOICE_RULES = [
  {
    id: 'faux-archaic',
    re: /\b(thee|thou|thy|thine|hath|doth|ye)\b/i,
    fix: 'the house voice is "cold and old", not faux-archaic — say it plainly in modern words',
    since: 'docs/narrative/LEXICON.md "Ban from house narration"',
  },
  {
    id: 'exclamation',
    re: /!/,
    fix: 'no exclamation marks in player-facing prose — let the sentence carry the weight',
    since: '.claude/agents/content-curator.md "Voice constitution"',
  },
  {
    id: 'scriptural-weather',
    re: /wrathful heavens|blood-red sky|judgmental thunder/i,
    fix: 'scriptural-weather shorthand is banned — give the scene a concrete, local detail',
    since: 'docs/narrative/LEXICON.md "Ban from house narration"',
  },
  {
    id: 'prestige-dark',
    re: /\bineffable\b|\bnameless dread\b|\bunspeakable evil\b/i,
    fix: 'prestige-dark filler is banned — name the thing, or cut the sentence',
    since: 'docs/narrative/LEXICON.md "Ban from house narration"',
  },
]

const PRAGMA_RE = /\/\/\s*(lexicon-ok|prose-ok):\s*([^\n]+)/g

/** File-level exemptions, as `{ lexicon: Set, prose: Set }`. */
export function exemptionsIn(text) {
  const out = { lexicon: new Set(), prose: new Set() }
  for (const m of text.matchAll(PRAGMA_RE)) {
    const ids = m[2].split(/\s+[—–]\s+/, 1)[0].split(',').map((s) => s.trim()).filter(Boolean)
    for (const id of ids) out[m[1] === 'lexicon-ok' ? 'lexicon' : 'prose'].add(id)
  }
  return out
}

/**
 * Every string literal in `text`, with its 1-based line.
 *
 * Deliberately simple: single-, double-, and back-quoted runs, with escapes
 * skipped. Template interpolations come through as part of the literal, which
 * is fine — a `${}` never contains prose the rules care about, and treating
 * one as text has no false-positive path for any rule here.
 */
export function stringLiterals(text) {
  const out = []
  const re = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g
  let m
  while ((m = re.exec(text)) !== null) {
    const value = m[1] ?? m[2] ?? m[3]
    if (value == null) continue
    out.push({ value, line: text.slice(0, m.index).split(/\r?\n/).length })
  }
  return out
}

/** Ids, keys, and enum values are not prose. */
const MIN_PROSE_LENGTH = 12

/** Findings for one file's text: `{ rule, line, fix, excerpt }`. */
export function scanSource(text, retiredRows) {
  const exempt = exemptionsIn(text)
  const findings = []
  for (const { value, line } of stringLiterals(text)) {
    if (value.length < MIN_PROSE_LENGTH) continue
    for (const rule of VOICE_RULES) {
      if (exempt.prose.has(rule.id)) continue
      if (rule.re.test(value)) {
        findings.push({ rule: rule.id, line, fix: rule.fix, excerpt: value.slice(0, 80) })
      }
    }
    for (const row of retiredRows) {
      if (exempt.lexicon.has(row.id)) continue
      row.re.lastIndex = 0
      if (row.re.test(value)) {
        findings.push({
          rule: `retired:${row.id}`,
          line,
          fix: row.replacement,
          excerpt: value.slice(0, 80),
        })
      }
    }
  }
  return findings
}

function main() {
  // Doctrine rows are `.md`-shaped design claims; game prose is linted against
  // the retired TERM rows, which is what a player-facing string can carry.
  const retired = loadRegistry().filter((r) => r.type === 'identifier')

  if (process.argv.includes('--list')) {
    for (const r of VOICE_RULES) console.log(`${r.id}: /${r.re.source}/ — ${r.fix} (${r.since})`)
    console.log(`\n${CONTENT_SURFACES.length} content surfaces:`)
    for (const s of CONTENT_SURFACES) console.log(`  ${s}`)
    process.exit(0)
  }

  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const targets = args.length
    ? args.map((a) => path.relative(ROOT, path.resolve(ROOT, a)).replaceAll('\\', '/'))
    : CONTENT_SURFACES

  const findings = []
  const empty = []
  let scanned = 0
  for (const rel of targets) {
    const abs = path.join(ROOT, rel)
    if (!fs.existsSync(abs)) {
      // A listed surface that moved is a lint failure, not a silent skip.
      empty.push(`${rel} (missing)`)
      continue
    }
    const text = fs.readFileSync(abs, 'utf-8')
    const literals = stringLiterals(text)
    if (args.length === 0 && literals.length === 0) empty.push(`${rel} (no string literals)`)
    scanned++
    for (const f of scanSource(text, retired)) {
      findings.push(`${rel}:${f.line}: ${f.rule} — ${f.fix}\n      ${JSON.stringify(f.excerpt)}`)
    }
  }

  if (empty.length) {
    console.error('check-prose: listed content surfaces yielded nothing to lint:')
    empty.forEach((e) => console.error(`  ${e}`))
    console.error('\nA surface that moved must be re-listed in CONTENT_SURFACES, not left')
    console.error('to pass vacuously. Fix the list.')
    process.exit(1)
  }

  if (findings.length) {
    console.error(`check-prose: ${findings.length} house-voice finding(s):`)
    findings.forEach((f) => console.error(`  ${f}`))
    console.error(`\nRewrite the line, or if the use is legitimate add a file-level`)
    console.error(`'// prose-ok: <rule>' / '// lexicon-ok: <id>' pragma with its reason.`)
    console.error(`Voice rules: axiomancer-mechanics/docs/narrative/LEXICON.md.`)
    process.exit(1)
  }
  console.log(
    `check-prose: ${scanned} content surface(s) clean against `
      + `${VOICE_RULES.length} voice rule(s) + ${retired.length} retired term(s)`,
  )
}

if (import.meta.url === `file://${process.argv[1]}`) main()
