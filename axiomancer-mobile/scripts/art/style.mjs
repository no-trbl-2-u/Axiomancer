// scripts/art/style.mjs — the house style, as a versioned string (phase 73).
//
// The preamble prefixes EVERY compiled prompt and is versioned, because the
// version is recorded per asset in `provenance.json`: when the QA series shows
// drift, the first question is "did the style change, or did the model?", and
// only a version stamp can answer it.
//
// Sources: `plan/ideas/AI_ART_PIPELINE_OPTIONS.md` §4.1, the Mörk Borg tonal
// north star (`plan/north-star-mork-borg.md`), the palette in
// `theme/palette.ts`, and the composition rules the current temp art already
// follows (enemy = 3/4 figure on void, card = centred emblem, portrait = bust).

/** Bump when the preamble or the category rules change. Recorded per asset. */
export const STYLE_VERSION = 'style/v1'

/** The AXM palette the art must sit inside, from `theme/palette.ts`. */
export const PALETTE = {
  bg: '#0b0a09',
  deepBg: '#070509',
  parchment: '#f1e7d0',
  bone: '#9c937f',
  ash: '#46403a',
  blood: '#e01f33',
  sulfur: '#f0cb2e',
  rust: '#bd4a1e',
}

export const PREAMBLE = [
  'A cold, old woodcut-codex illustration: hand-inked engraving lines,',
  'high-contrast, single-source lighting on a near-black void background.',
  'Muted bone and parchment tones with sparing rust and sulfur accents;',
  'blood red used once, as punctuation, never as fill.',
  'Grim, plain and worn — a page torn from a chronicle, not concept art.',
  'No text, no lettering, no signature, no border, no frame, no watermark.',
  'No gloss, no chrome, no lens flare, no modern rendering.',
].join(' ')

/**
 * Per-category composition rules. The category is the destination directory
 * under `assets/images/`, so a prompt cannot be compiled for a category the
 * ingest leg has nowhere to put.
 */
export const CATEGORY_RULES = {
  enemies: 'A single three-quarter-view figure, full body, isolated on the void. '
    + 'Silhouette must read at 128px. Alpha-matted cutout: nothing behind the figure.',
  portraits: 'A bust portrait, shoulders up, facing slightly off-camera. '
    + 'Alpha-matted cutout on the void. The face carries the character, not the costume.',
  cards: 'A centred emblem or single arrested action, symmetrical, filling the frame. '
    + 'Reads as a printed device, not a scene.',
  treasure: 'A single object, centred, lit from one side, as if laid on dark cloth.',
  maps: 'A full-bleed engraved landscape plate, horizon low, no figures. '
    + 'Dim enough that a chart drawn over it stays legible.',
  labyrinth: 'A flat architectural texture — wall face or door — shot straight on, '
    + 'edge to edge, no perspective vanishing, tileable in feel if not in fact.',
  combat: 'A full-bleed arena backdrop, deep and dim, with the middle third kept '
    + 'quiet so figures placed there stay readable.',
}

export const CATEGORIES = Object.keys(CATEGORY_RULES)

/** The negative constraints every request carries, listed once. */
export const NEGATIVE = [
  'no text', 'no watermark', 'no signature', 'no border', 'no frame',
  'no photorealism', 'no anime', 'no cel shading', 'no bright saturated colour',
  'no modern clothing', 'no lens flare',
]
