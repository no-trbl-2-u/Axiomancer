// scripts/content-drift.test.mjs — the drift gate for the hand-synced content
// tables (phase 68, from the 2026-08-22 content-pipelines audit §2 rec 10).
//
// Each case below covers a surface the audit found drifting with NO failing
// test: the glyph table copied between two runtimes, the card-editor's
// independent keyword vocabulary, and the keyword atlas that feeds the
// `axio_keywords` MCP tool. The mechanic-kind surface is gated in TypeScript
// instead — see `CARD_SPECIAL_MECHANIC_KINDS` in axiomancer-mechanics and the
// KW-2 lint in axiomancer-mobile.
//
//   node --test scripts/content-drift.test.mjs

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  atlasKeywords, catalogGlyphTable, editorGlyphCases, editorVocabulary,
  enemyRegistryKeywords, systemGlossaryTerms,
  mobileGlyphTable, mobileRegistryKeywords, PATHS,
} from './content-drift.mjs'

const keys = (o) => Object.keys(o)

// ── The glyph table, copied mobile → catalog ─────────────────────────────────
//
// These two genuinely ARE copies of one table (same keywords, same 24x24 path
// data), duplicated because they render in different runtimes. Deduplicating
// them is a refactor; asserting they agree is what makes the duplication safe.

test('the mobile and catalog glyph tables cover the same keywords', () => {
  const mobile = mobileGlyphTable()
  const catalog = catalogGlyphTable()
  assert.deepEqual(
    [...mobile.keys()].filter((k) => !catalog.has(k)),
    [],
    `keywords in ${PATHS.mobileGlyphs} that ${PATHS.catalogGlyphs} does not draw`,
  )
  assert.deepEqual(
    [...catalog.keys()].filter((k) => !mobile.has(k)),
    [],
    `keywords in ${PATHS.catalogGlyphs} that ${PATHS.mobileGlyphs} does not draw`,
  )
})

test('the mobile and catalog glyph tables draw the same shapes', () => {
  const mobile = mobileGlyphTable()
  const catalog = catalogGlyphTable()
  const different = [...mobile.entries()]
    .filter(([k, d]) => catalog.has(k) && catalog.get(k) !== d)
    .map(([k]) => k)
  assert.deepEqual(different, [], 'same keyword, different path data')
})

test('the glyph parsers found a real table, not an empty one', () => {
  // Without this the two assertions above pass vacuously the moment either
  // file is reformatted past its extractor.
  assert.ok(mobileGlyphTable().size > 30)
  assert.ok(catalogGlyphTable().size > 30)
})

// ── The card-editor's independent display vocabulary ─────────────────────────

/**
 * Editor-local words with no registry row, and why each one is legitimate.
 * The editor's `KEYWORDS` table is a *display* vocabulary for the card face
 * and dummy sim (see the module doc in `wx.ts`); these are the generic
 * mechanical families it speaks in, not game keywords the player reads.
 *
 * Anything NOT on this list must exist in the mobile keyword registry — which
 * is what caught COMPOUND / EXECUTE / SLOW / CONFUSION / SILENCE, five
 * spec-32-v2 words the editor still offered after the mechanics behind them
 * were deleted.
 */
const EDITOR_LOCAL_LABELS = new Set([
  'DAMAGE',     // the generic direct-damage family, legal again since THE UNSHACKLING
  'DOT',        // the family name; the registry names the species (Bleed, Poison...)
  'CONTROL',    // the family name for stance/turn denial
  'BARRIER',    // merged into GUARD's registry semantics in phase 29; the editor
                // keeps the distinct authoring knob
  'REGEN',      // effect species, glossed by effect id rather than a keyword row
  'STUN',       // effect species, same
  'STRIP BUFF', // a mechanic kind (`strip_random_buff`) with no keyword badge
  'HEAL SELF',  // a rider shape, not a keyword
])

test('every editor keyword label is a live registry keyword or explicitly editor-local', () => {
  const registry = mobileRegistryKeywords()
  const strays = [...editorVocabulary().values()]
    .map((label) => label.toUpperCase())
    .filter((label) => !registry[label] && !EDITOR_LOCAL_LABELS.has(label))
  assert.deepEqual(strays, [], `dead words in ${PATHS.editorVocab}`)
})

test('the editor-local list holds no label the editor stopped using', () => {
  const live = new Set([...editorVocabulary().values()].map((l) => l.toUpperCase()))
  assert.deepEqual([...EDITOR_LOCAL_LABELS].filter((l) => !live.has(l)), [])
})

test('every editor glyph case names something the project actually has', () => {
  // `KwGlyph`'s switch runs ahead of the editor's own vocabulary in places —
  // it draws CLEANSE / PIP / QUARTER / REVEAL / CONVICTION / REFRESH, which the
  // face can receive even though the authoring table has no row for them. That
  // is forward coverage, not drift. What IS drift is a case for a word that
  // exists nowhere: not an editor keyword, not a registry keyword, not a glyph
  // the mobile table draws. That is the arm this asserts away.
  const vocab = editorVocabulary()
  const registry = mobileRegistryKeywords()
  const glyphs = mobileGlyphTable()
  const orphaned = keys(editorGlyphCases()).filter((id) => {
    const upper = id.toUpperCase()
    return !vocab.has(id) && !registry[upper] && !glyphs.has(upper)
  })
  assert.deepEqual(orphaned, [], `glyph cases naming nothing in ${PATHS.editorFace}`)
})

// ── The keyword atlas vs the live registry ───────────────────────────────────

/**
 * Registry keywords with no atlas row, and why. The atlas's own row policy
 * ("a term earns a row at ~3+ cards"; one-card mechanics stay card-local)
 * makes these legitimate absences rather than drift.
 */
const REGISTRY_WITHOUT_ATLAS_ROW = new Set([
  'OATH', 'HEX',                                   // card TYPES, not keywords
  'DOOM', 'FESTER', 'REPLAY', 'REQUIEM',           // Profane Canon words below the row bar
  'IMMOLATE', 'PURGE',                             // same — curse-local verbs
])

/**
 * Atlas rows that deliberately gloss NOWHERE, and why. Each is a word the atlas
 * documents but the game does not treat as a keyword.
 */
const ATLAS_WITHOUT_REGISTRY_ROW = new Set([
  // THE BIG NUMBERS REWRITE decision D6: "Deal 24" is plain English. Keywording
  // it would spend the face-term budget on the one verb needing no explanation
  // (MTG's rule: keyword what COMPRESSES). The atlas documents it as the
  // library's primary verb; it has no gloss because it needs none.
  'DEAL',
])

test('every keyword the atlas registers has a gloss in a live registry', () => {
  // The direction that matters: the atlas feeds `axio_keywords`, which agents
  // read as current law. A row for a word the game no longer glosses publishes
  // a keyword that does not exist.
  //
  // TWO registries count. Card keywords live in mobile's `KEYWORD_GLOSS`; the
  // ENEMY keywords live in mechanics' `ENEMY_KEYWORD_GLOSS`, kept separate
  // on purpose so the mobile KW lints stay card-only.
  const registry = {
    ...mobileRegistryKeywords(), ...enemyRegistryKeywords(), ...systemGlossaryTerms(),
  }
  const orphans = keys(atlasKeywords())
    .filter((k) => !registry[k] && !ATLAS_WITHOUT_REGISTRY_ROW.has(k))
  assert.deepEqual(orphans, [], `atlas rows with no registry gloss (${PATHS.keywordAtlas})`)
})

test('the atlas exemption list holds no word the registries actually gloss', () => {
  const registry = {
    ...mobileRegistryKeywords(), ...enemyRegistryKeywords(), ...systemGlossaryTerms(),
  }
  assert.deepEqual([...ATLAS_WITHOUT_REGISTRY_ROW].filter((k) => registry[k]), [])
})

test('registry keywords missing an atlas row are all accounted for', () => {
  const atlas = atlasKeywords()
  const missing = keys(mobileRegistryKeywords())
    .filter((k) => !atlas[k] && !REGISTRY_WITHOUT_ATLAS_ROW.has(k))
  assert.deepEqual(missing, [], 'new registry keyword with no atlas row and no exemption')
})

test('the exemption list holds no keyword that left the registry', () => {
  const registry = mobileRegistryKeywords()
  assert.deepEqual([...REGISTRY_WITHOUT_ATLAS_ROW].filter((k) => !registry[k]), [])
})

test('the keyword parsers found real tables', () => {
  assert.ok(keys(mobileRegistryKeywords()).length > 30)
  assert.ok(keys(atlasKeywords()).length > 25)
  assert.ok(editorVocabulary().size > 25)
})
