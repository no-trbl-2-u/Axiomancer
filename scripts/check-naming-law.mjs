#!/usr/bin/env node
// scripts/check-naming-law.mjs — the Phase 44a naming-law lint (spec 34 §5.9
// items 3-5, axiomancer-mechanics/specs/34-dark-fantasy-campaign.md).
//
// Three checks against CANDIDATE names for NEW authored content (cards,
// enemies, places, NPCs) proposed by Phases 44c/44e/44f/44g and any content
// work after them. This is NOT a scan of the existing corpus — the existing
// corpus is pre-retheme and legitimately full of the old vocabulary until
// each phase actually rewrites it. Run this over a name BEFORE it lands.
//
//   NL-8  the collision law   — a card/enemy/place/NPC name may not be, or
//         begin with, a registry keyword, a locked-system word, a card-type
//         word, a rank word, or a stance word.
//   NL-4/5 the format law     — no numerals, no colons, no parentheses in
//         any authored name.
//   V-1   the banned register — no philosophy-native jargon (spec 34 §2.2),
//         except the two NL-9 proper-noun survivors: Aporia, Sophist.
//
// Usage:
//   node scripts/check-naming-law.mjs --list                        # print the registries
//   node scripts/check-naming-law.mjs --kind=card "Caltrops Under the Snow"
//   node scripts/check-naming-law.mjs --file names.json             # [{name, kind}, ...]
//
// Exit codes: 0 clean; 1 findings (name: rule -> reason).
// Zero dependencies. Node >=22 (repo engines floor).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MAP_PATH = path.join(ROOT, 'docs', 'retheme-map.json')
const map = JSON.parse(fs.readFileSync(MAP_PATH, 'utf-8'))

// ── NL-8 registry: every word a card/enemy/place/NPC name may not be or
// begin with. Sourced from retheme-map.json (both the surviving `keep`
// words and every renamed concept's NEW word — a name must not collide with
// where the vocabulary is going, not just where it has been) plus the
// locked-system / dice-face words NL-8 names explicitly, which are not
// otherwise "keywords" in the KEYWORD_GLOSS sense. ──
const KEEP_WORDS = map.keep
  .filter((k) => ['keyword', 'locked-mechanic', 'system-term', 'stance'].includes(k.kind))
  .map((k) => k.value)
const RENAMED_NEW_WORDS = map.displayNames
  .filter((p) => ['keyword', 'die-face', 'card-type', 'system-term', 'rank'].includes(p.kind))
  .map((p) => p.new)
// NL-8's own explicit examples not otherwise captured above (dice-face
// vocabulary and card-type words that predate any rename).
const EXTRA_LOCKED_WORDS = ['CONVICTION', 'SURGE', 'DICE', 'WILD', 'GOLD', 'BLANK', 'HONE', 'TEMPER', 'ENCHANTMENT', 'DISENCHANT']

export const NL8_REGISTRY = [...new Set([...KEEP_WORDS, ...RENAMED_NEW_WORDS, ...EXTRA_LOCKED_WORDS])]

// ── V-1: the philosophy-jargon ban list (spec 34 §2.2 table). NL-9 exempts
// exactly two survivors as proper nouns — everything else is banned in any
// register, any casing. ──
export const V1_WORDS = [
  'premise', 'thesis', 'axiom', 'aporia', 'doxa', 'lemma', 'theorem',
  'fallacy', 'syllogism', 'dialectic', 'epistemology', 'sophist',
  'peroration', 'rebuttal', 'concede',
]
export const NL9_SURVIVORS = new Set(['aporia', 'sophist'])

const NL8_KINDS = new Set(['card', 'enemy', 'place', 'npc'])

/** Strip a leading "The " (case-insensitive, NL-11 article) and return the
 *  remaining head word plus the un-stripped first word — NL-8 checks both,
 *  since a card may be headed by its keyword either with or without the
 *  article ("Guard" or "The Guard" both collide with GUARD). */
function headWords(name) {
  const words = name.trim().split(/\s+/)
  if (words.length === 0) return []
  const first = words[0].replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '')
  if (/^the$/i.test(first) && words.length > 1) {
    const second = words[1].replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '')
    return [first, second]
  }
  return [first]
}

/** NL-8 — the collision law. Only meaningful for card/enemy/place/NPC names. */
export function checkCollision(name, kind) {
  if (!NL8_KINDS.has(kind)) return []
  const heads = headWords(name).map((w) => w.toUpperCase())
  const hit = NL8_REGISTRY.find((word) => heads.includes(word.toUpperCase()))
  return hit ? [`NL-8: "${name}" begins with registry word "${hit}" — a name may not be or begin with a locked/registry word`] : []
}

/** NL-4 (no numerals) + NL-5 (no colons, subtitles, parentheses) — every name. */
export function checkFormat(name) {
  const findings = []
  if (/\d/.test(name)) findings.push(`NL-4: "${name}" contains a numeral — spell it out ("The Ninth Bell", never "The 9th Bell")`)
  if (/[:()]/.test(name)) findings.push(`NL-5: "${name}" contains a colon or parenthesis — no subtitles, no parentheticals`)
  return findings
}

/** V-1 — the banned philosophy register, with the NL-9 proper-noun carve-out. */
export function checkRegister(name) {
  const findings = []
  for (const word of V1_WORDS) {
    const re = new RegExp(`\\b${word}\\b`, 'i')
    const m = re.exec(name)
    if (!m) continue
    if (NL9_SURVIVORS.has(word) && /^[A-Z]/.test(m[0])) continue // capitalized proper-noun use — allowed
    findings.push(`V-1: "${name}" uses banned philosophy-register word "${word}" (NL-9 exempts only capitalized Aporia/Sophist as proper nouns)`)
  }
  return findings
}

/** Run all three checks. `kind` is one of card/enemy/place/npc/keyword/other. */
export function lintName(name, kind = 'other') {
  return [...checkCollision(name, kind), ...checkFormat(name), ...checkRegister(name)]
}

// ── CLI ──
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)

  if (args.includes('--list')) {
    console.log(`NL-8 registry (${NL8_REGISTRY.length} words):`)
    console.log('  ' + NL8_REGISTRY.sort().join(', '))
    console.log(`\nV-1 banned register (${V1_WORDS.length} words, NL-9 allowlist: ${[...NL9_SURVIVORS].join(', ')}):`)
    console.log('  ' + V1_WORDS.sort().join(', '))
    process.exit(0)
  }

  const fileArg = args.find((a) => a.startsWith('--file='))
  const kindArg = args.find((a) => a.startsWith('--kind='))?.slice('--kind='.length) ?? 'other'
  const nameArgs = args.filter((a) => !a.startsWith('--'))

  let candidates = nameArgs.map((name) => ({ name, kind: kindArg }))
  if (fileArg) {
    const filePath = path.resolve(ROOT, fileArg.slice('--file='.length))
    candidates = candidates.concat(JSON.parse(fs.readFileSync(filePath, 'utf-8')))
  }

  if (candidates.length === 0) {
    console.error('check-naming-law: pass one or more names, --file=<names.json>, or --list.')
    process.exit(1)
  }

  const findings = candidates.flatMap(({ name, kind }) => lintName(name, kind))
  if (findings.length) {
    console.error(`check-naming-law: ${findings.length} finding(s) across ${candidates.length} candidate name(s):`)
    findings.forEach((f) => console.error(`  ${f}`))
    process.exit(1)
  }
  console.log(`check-naming-law: ${candidates.length} candidate name(s) clean.`)
}
