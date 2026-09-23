#!/usr/bin/env node
// axiomancer-mobile/scripts/shrink-art.mjs — bring already-shipped art down to
// the ingest recipe's size cap and quality, in place, and say so in provenance.
//
//   node scripts/shrink-art.mjs --dirs enemies,labyrinth/walls --dry-run
//   node scripts/shrink-art.mjs --dirs enemies,labyrinth/walls,labyrinth/doors,combat,portraits,cards,treasure
//
// WHY THIS EXISTS. `scripts/ingest-art.mjs` encodes the recipe every NEW asset
// goes through (longest edge <= 640px, WebP q44). Art that landed before the
// recipe existed — the 2026-07-06 temp drop, the 720x1280 labyrinth walls,
// the 1120px arena plates — never went through it, and the exported bundle
// carried ~10 MB of images. This script is the one-shot (and re-runnable)
// pass that applies the same two steps to art already in the tree, so the
// pool becomes uniform and the build has room for audio.
//
// WHAT IT DOES NOT DO. No grade (the grayscale/brightness/contrast step):
// shipped art is already graded, and grading twice would double the pull
// toward the void. No format change: `.jpg`/`.png` are left alone (registries
// `require()` them by exact name). No touch to `maps/` unless asked — the
// conventions record that directory as a standing exception to the cap, and
// `maps/__tests__/plate-crop.test.ts` binds each plate's provenance note to
// its pixel size.
//
// Every re-encoded file gets a dated note appended to the `post_process` of
// the provenance entry that covers it (`docs/asset-conventions.md` §4: the
// record must say what was done to the bytes).
//
// Flags:
//   --dirs <a,b,c>       comma-separated directories under assets/images/ (required)
//   --quality <n>        WebP quality (default 44, the ingest recipe's value)
//   --max-edge <n>       longest edge in px (default 640, the conventions cap)
//   --dry-run            report the before/after bytes, write nothing

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { RECIPE } from './ingest-art.mjs'

const MOBILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const IMAGES = path.join(MOBILE, 'assets', 'images')

/** Only lossy WebP is re-encoded; other rasters keep their bytes and names. */
const RE_ENCODABLE = new Set(['.webp'])

/**
 * Parse argv into the run's options.
 *
 * Inputs: the argv tail (everything after the script path).
 * Outputs: `{ dirs: string[], quality, maxEdge, dryRun }`.
 * Pure: no IO, throws on a flag that is missing its value.
 */
export function parseArgs(argv) {
  const out = { dirs: [], quality: RECIPE.quality, maxEdge: RECIPE.maxEdge, dryRun: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dry-run') { out.dryRun = true; continue }
    if (!a.startsWith('--')) continue
    const value = argv[i + 1]
    if (value == null || value.startsWith('--')) throw new Error(`shrink-art: ${a} needs a value`)
    if (a === '--dirs') out.dirs = value.split(',').map((d) => d.trim()).filter(Boolean)
    else if (a === '--quality') out.quality = Number(value)
    else if (a === '--max-edge') out.maxEdge = Number(value)
    i++
  }
  return out
}

/**
 * The dated sentence appended to a provenance `post_process` note.
 *
 * Inputs: the run's quality / cap and the ISO date.
 * Outputs: one sentence, e.g.
 *   "2026-09-22 build-size pass: re-encoded in place to the ingest recipe
 *    (longest edge <= 640px, WebP q44) by scripts/shrink-art.mjs"
 * Pure.
 */
export function sizePassNote({ quality, maxEdge }, date) {
  return `${date} build-size pass: re-encoded in place to the ingest recipe `
    + `(longest edge <= ${maxEdge}px, WebP q${quality}) by scripts/shrink-art.mjs`
}

/**
 * Whether a provenance entry covers any of the files this run rewrote.
 *
 * `covers` is either a list of file names or, on the oldest entries, a prose
 * catch-all ("every .webp in this directory not named by a later entry").
 * A prose catch-all is taken to cover the run; a list must intersect it.
 *
 * Inputs: one provenance entry and the set of rewritten file names.
 * Outputs: boolean. Pure.
 */
export function entryCoversAny(entry, written) {
  const covers = entry.covers
  if (typeof covers === 'string') return true
  if (!Array.isArray(covers)) return false
  return covers.some((c) => written.has(String(c).split(/\s+/)[0]))
}

/**
 * The provenance list with the size-pass note appended to every entry that
 * covers a rewritten file. Idempotent: an entry already carrying this exact
 * note is returned unchanged, so a re-run does not stack sentences.
 *
 * Inputs: the parsed provenance (entry or list), the rewritten-file set, the note.
 * Outputs: a NEW list — the input is never mutated. Pure.
 */
export function annotateProvenance(record, written, note) {
  const list = Array.isArray(record) ? record : [record]
  return list.map((entry) => {
    if (!entryCoversAny(entry, written)) return entry
    const prior = entry.post_process ? String(entry.post_process) : ''
    if (prior.includes(note)) return entry
    return { ...entry, post_process: prior ? `${prior}; ${note}` : note }
  })
}

/**
 * Re-encode one WebP buffer: fit inside the cap (never upscaling), then WebP
 * at the given quality with alpha kept lossless-quality so matted cut-outs
 * keep their edges.
 *
 * Inputs: a sharp instance factory, the source bytes, quality and cap.
 * Outputs: a Promise of the new bytes. IO-free apart from sharp's decode.
 */
export async function reencode(sharp, bytes, { quality, maxEdge }) {
  return sharp(bytes)
    .resize({ width: maxEdge, height: maxEdge, fit: 'inside', withoutEnlargement: true })
    .webp({ quality, alphaQuality: 100 })
    .toBuffer()
}

/** Every re-encodable file directly inside one directory (no recursion). */
function filesIn(dirAbs) {
  return fs.readdirSync(dirAbs)
    .filter((f) => RE_ENCODABLE.has(path.extname(f).toLowerCase()))
    .sort()
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (opts.dirs.length === 0) {
    console.error('shrink-art: --dirs <a,b,c> is required (directories under assets/images/).')
    process.exit(1)
  }
  const { default: sharp } = await import('sharp')
  const date = new Date().toISOString().slice(0, 10)
  const note = sizePassNote(opts, date)

  let totalBefore = 0
  let totalAfter = 0
  console.log(`dir                    files   before KB    after KB   saved`)
  for (const rel of opts.dirs) {
    const dirAbs = path.join(IMAGES, rel)
    if (!fs.existsSync(dirAbs)) throw new Error(`shrink-art: no such directory assets/images/${rel}`)
    const written = new Set()
    let before = 0
    let after = 0
    for (const name of filesIn(dirAbs)) {
      const abs = path.join(dirAbs, name)
      const src = fs.readFileSync(abs)
      const out = await reencode(sharp, src, opts)
      before += src.length
      // Never grow a file: if the recipe produces more bytes (already smaller
      // than q44 would make it), the original stays.
      if (out.length >= src.length) { after += src.length; continue }
      after += out.length
      written.add(name)
      if (!opts.dryRun) fs.writeFileSync(abs, out)
    }
    totalBefore += before
    totalAfter += after
    const pct = before ? Math.round((1 - after / before) * 100) : 0
    console.log(
      `${rel.padEnd(22)} ${String(written.size).padStart(5)} ${String(Math.round(before / 1024)).padStart(11)} `
      + `${String(Math.round(after / 1024)).padStart(11)} ${String(pct).padStart(6)}%`,
    )
    const provPath = path.join(dirAbs, 'provenance.json')
    if (!opts.dryRun && written.size > 0 && fs.existsSync(provPath)) {
      const record = JSON.parse(fs.readFileSync(provPath, 'utf-8'))
      const next = annotateProvenance(record, written, note)
      fs.writeFileSync(provPath, `${JSON.stringify(next, null, 2)}\n`)
    }
  }
  const pct = totalBefore ? Math.round((1 - totalAfter / totalBefore) * 100) : 0
  console.log(
    `${'TOTAL'.padEnd(22)}       ${String(Math.round(totalBefore / 1024)).padStart(11)} `
    + `${String(Math.round(totalAfter / 1024)).padStart(11)} ${String(pct).padStart(6)}%`
    + (opts.dryRun ? '   (dry run — nothing written)' : ''),
  )
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
}
