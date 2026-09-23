// scripts/content-drift.mjs — extractors for the hand-synced content tables
// that the 2026-08-22 content-pipelines audit found drifting with no failing
// test. Zero dependencies; pure functions over file text so the same parsers
// serve the drift test and any future report.
//
// Why parsers and not imports: the four tables live in three different
// runtimes (React Native + TS, React DOM + TS, a Node HTML generator) across
// three npm workspaces. A test that imported them would have to run inside one
// workspace, and would then only fire on that workspace's CI path triggers —
// which is exactly how an editor-only or catalog-only edit drifts unseen.
//
// EVERY extractor here self-checks: it throws when it finds nothing. A silent
// zero would make the drift gate pass vacuously the first time someone
// reformats one of the parsed files, which is the failure class this module
// exists to close.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export const PATHS = {
  mobileGlyphs: 'axiomancer-mobile/components/combat/glyphShapes.ts',
  catalogGlyphs: 'scripts/build-catalog.mjs',
  editorFace: 'axiomancer-card-editor/src/components/CardFace.tsx',
  editorVocab: 'axiomancer-card-editor/src/theme/wx.ts',
  mobileKeywords: 'axiomancer-mobile/state/combat/keywords.ts',
  keywordAtlas: 'axiomancer-mechanics/docs/keyword-atlas.md',
  enemyKeywords: 'axiomancer-mechanics/src/Enemy/enemy-keywords.ts',
}

export const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf-8')

const nonEmpty = (value, what) => {
  const size = value instanceof Map ? value.size : Object.keys(value).length
  if (size === 0) {
    throw new Error(
      `content-drift: extracted nothing for ${what}. The parsed file changed shape — ` +
        `fix the extractor rather than letting the drift gate pass on an empty set.`,
    )
  }
  return value
}

/** Body of `{...}` starting at the first brace at/after `from`, brace-matched. */
export function braceBlock(text, from) {
  const start = text.indexOf('{', from)
  if (start < 0) return ''
  let depth = 0
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}' && --depth === 0) return text.slice(start + 1, i)
  }
  return ''
}

/**
 * A glyph table as `Map<KEYWORD, pathData>`. Both copies declare named shape
 * consts and then alias them onto keywords, so resolve the alias to the path
 * data itself — comparing keyword→const-name would pass while the two copies
 * drew different shapes under the same local name.
 */
export function glyphTable(text, { shapeRe, tableAnchor }) {
  const shapes = new Map()
  for (const m of text.matchAll(shapeRe)) shapes.set(m[1], m[2])
  nonEmpty(shapes, 'glyph shape constants')

  const body = braceBlock(text, text.indexOf(tableAnchor))
  const table = new Map()
  for (const m of body.matchAll(/([A-Z][A-Z_]*)\s*:\s*([A-Za-z_][A-Za-z0-9_]*)/g)) {
    const d = shapes.get(m[2])
    if (d) table.set(m[1], d)
  }
  return nonEmpty(table, 'glyph table entries')
}

export const mobileGlyphTable = () =>
  glyphTable(read(PATHS.mobileGlyphs), {
    shapeRe: /const ([A-Z_]+): GlyphShape = \{ d: '([^']+)'/g,
    tableAnchor: 'export const GLYPH_SHAPES',
  })

export const catalogGlyphTable = () =>
  glyphTable(read(PATHS.catalogGlyphs), {
    shapeRe: /const (SHAPE_[A-Z_]+) = \{ d: "([^"]+)"/g,
    tableAnchor: 'const GLYPH_SHAPES',
  })

/** Keys of the editor's `KEYWORDS` display vocabulary → its printed label. */
export function editorVocabulary() {
  const text = read(PATHS.editorVocab)
  const body = braceBlock(text, text.indexOf('export const KEYWORDS'))
  const out = new Map()
  for (const m of body.matchAll(/^\s{4}([a-z_]+):\s*\{[^}]*label:\s*'([^']+)'/gm)) {
    out.set(m[1], m[2])
  }
  return nonEmpty(out, 'editor KEYWORDS vocabulary')
}

/** The keyword ids the editor's `KwGlyph` switch draws a silhouette for. */
export function editorGlyphCases() {
  const text = read(PATHS.editorFace)
  const start = text.indexOf('export function KwGlyph')
  const rest = text.slice(start + 10)
  const next = rest.search(/\nexport (function|const) /)
  const body = next < 0 ? rest : rest.slice(0, next)
  const ids = new Set([...body.matchAll(/case '([a-z_]+)'/g)].map((m) => m[1]))
  return nonEmpty(ids.size ? Object.fromEntries([...ids].map((i) => [i, true])) : {}, 'editor glyph cases')
}

/** Registry keyword names (Title-Case keys of the mobile `KEYWORD_GLOSS`). */
export function mobileRegistryKeywords() {
  const text = read(PATHS.mobileKeywords)
  const body = braceBlock(text, text.indexOf('const KEYWORD_GLOSS'))
  // Keys sit at one indent level inside the object; values are strings that
  // may wrap across lines, so anchor on the key position, not the value.
  const names = new Set()
  for (const m of body.matchAll(/^ {4}('([^']+)'|([A-Za-z][A-Za-z0-9]*)):/gm)) {
    names.add((m[2] ?? m[3]).toUpperCase())
  }
  return nonEmpty(Object.fromEntries([...names].map((n) => [n, true])), 'mobile keyword registry')
}

/**
 * ENEMY keyword names from `ENEMY_KEYWORD_GLOSS`, upper-cased.
 *
 * THE BIG NUMBERS REWRITE (2026-09-02): the atlas covers TWO vocabularies now
 * — the card keywords a player's own cards print (mobile `KEYWORD_GLOSS`) and
 * the keywords a FOE carries. The enemy set is deliberately kept out of
 * `KEYWORD_GLOSS` so the mobile KW lints, which iterate card keywords, stay
 * untouched; it lives in mechanics beside the union it glosses. Both are real
 * registries, so both count when asking "does this atlas row gloss anywhere".
 */
export function enemyRegistryKeywords() {
  const text = read(PATHS.enemyKeywords)
  const body = braceBlock(text, text.indexOf('ENEMY_KEYWORD_GLOSS'))
  const names = new Set()
  for (const m of body.matchAll(/^ {4}([a-z_]+):/gm)) names.add(m[1].toUpperCase())
  return nonEmpty(Object.fromEntries([...names].map((n) => [n, true])), 'enemy keyword registry')
}

/**
 * SYSTEM terms from mobile's `SYSTEM_GLOSSARY` — the words the atlas documents
 * that are systems rather than card keywords (CONVICTION, TOLL, RESERVE,
 * GHOST, RUNGS, WILD/X). Glossed in their own table, not `KEYWORD_GLOSS`, so
 * the third registry counts too.
 */
export function systemGlossaryTerms() {
  const text = read(PATHS.mobileKeywords)
  const names = new Set()
  for (const m of text.matchAll(/\{\s*term:\s*'([^']+)'/g)) {
    // `RESERVE & PIPS` / `WILD / X` / `CONVICTION ◆` — the atlas row leads with
    // the first bare word, so index on that.
    const first = m[1].split(/[^A-Za-z]+/).filter(Boolean)[0]
    if (first) names.add(first.toUpperCase())
  }
  return nonEmpty(Object.fromEntries([...names].map((n) => [n, true])), 'system glossary')
}

/** Keyword names from the atlas's tables, normalized (`DRAW N` → `DRAW`). */
export function atlasKeywords() {
  const text = read(PATHS.keywordAtlas)
  const names = new Set()
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) continue
    const cells = line.split('|').map((c) => c.trim()).slice(1, -1)
    if (!cells.length || /^:?-+:?$/.test(cells[0])) continue
    // Hallmark rows lead with the theme; every other table leads with the keyword.
    const raw = cells.length >= 6 ? cells[1] : cells[0]
    if (/^(keyword|theme|term)$/i.test(raw)) continue
    // Strip inline code AND bold markers: the atlas prints `**DEAL N**`, and
    // a parser that only ate backticks read that as `**DEAL`, which matched
    // nothing and made every registry keyword look row-less.
    const name = raw.replace(/[`*_]/g, '').trim().split(/\s+/)[0].toUpperCase()
    if (name) names.add(name)
  }
  return nonEmpty(Object.fromEntries([...names].map((n) => [n, true])), 'keyword atlas rows')
}
