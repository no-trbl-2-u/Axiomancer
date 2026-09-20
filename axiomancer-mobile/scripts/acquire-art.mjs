#!/usr/bin/env node
// axiomancer-mobile/scripts/acquire-art.mjs — public-domain acquisition, with
// the licence proven before anything is written (phase V4).
//
//   node scripts/acquire-art.mjs --key caverns
//   node scripts/acquire-art.mjs --all --dry-run
//
// The recorded Doré acquisition (Wikimedia Commons -> post-process -> WebP +
// provenance) was a thing one person did once, by hand, and the licence was
// recorded because that person happened to check. Phase 71's provenance gate
// then found the cost of NOT checking: no shipped raster directory except
// `maps/` has a licence on record at all.
//
// So the licence check here is not a nicety around the download; it IS the
// script. `verifyLicence` reads Commons' own `imageinfo` extmetadata and
// refuses anything it cannot prove is public domain or CC0 — non-zero exit, no
// file written, no provenance record. `UNRESOLVED` exists to describe art that
// already shipped. It must never become the landing pad for new acquisitions.
//
// The operator chooses WHICH file and WHERE it goes. The operator never
// asserts the licence: a `--licence` flag would reproduce exactly the failure
// this script exists to prevent.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { RECIPE, mergeProvenance } from './ingest-art.mjs'

const MOBILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const IMAGES = path.join(MOBILE, 'assets', 'images')
const SOURCES = path.join(MOBILE, 'scripts', 'art-sources.json')

const API = 'https://commons.wikimedia.org/w/api.php'

/**
 * Wikimedia asks automated clients to identify themselves. Fetching in bulk
 * and anonymously from a donated service is not something to do quietly.
 */
const USER_AGENT = 'Axiomancer-art-acquire/1.0 (https://github.com/no-trbl-2-u/Axiomancer)'

/**
 * Licence strings this pipeline accepts, matched case-insensitively against
 * Commons' `LicenseShortName` / `License` / `UsageTerms`.
 *
 * Deliberately short. CC BY and CC BY-SA are *usable* with attribution, but
 * they carry obligations that have to be honoured in a shipped build, and this
 * repo has no attribution surface yet. Until it does, "we could comply in
 * principle" is not the same as "we do", so they are refused here rather than
 * accepted with a promise nobody scheduled.
 */
export const ACCEPTED_LICENCES = [
  /^public domain$/i,
  /^pd([-_].*)?$/i,
  /^cc0/i,
  /^no restrictions$/i,
]

const stripHtml = (v) => String(v ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

/**
 * Decide whether a Commons extmetadata blob proves an acceptable licence.
 * Pure — the tests exercise it against captured shapes, with no network.
 *
 * @returns {{ok: true, licence: string, artist: string} | {ok: false, why: string}}
 */
export function verifyLicence(extmetadata) {
  const em = extmetadata ?? {}
  const short = stripHtml(em.LicenseShortName?.value)
  const code = stripHtml(em.License?.value)
  const terms = stripHtml(em.UsageTerms?.value)
  const artist = stripHtml(em.Artist?.value) || 'unknown'

  const candidates = [short, code, terms].filter(Boolean)
  if (candidates.length === 0) {
    return { ok: false, why: 'the source states no licence at all — refusing' }
  }
  const accepted = candidates.find((c) => ACCEPTED_LICENCES.some((re) => re.test(c)))
  if (!accepted) {
    return {
      ok: false,
      why: `licence ${JSON.stringify(short || code || terms)} is not public domain or CC0. `
        + 'Attribution licences are refused until the build has an attribution surface — '
        + 'see ACCEPTED_LICENCES.',
    }
  }
  return { ok: true, licence: short || terms || code, artist }
}

/** Query Commons for one file's URL, size and licence metadata. */
export async function lookup(title, { fetchImpl = fetch } = {}) {
  const url = `${API}?action=query&format=json&prop=imageinfo`
    + `&iiprop=url%7Cextmetadata%7Csize&titles=${encodeURIComponent(title)}`
  const res = await fetchImpl(url, { headers: { 'user-agent': USER_AGENT } })
  if (!res.ok) throw new Error(`commons: HTTP ${res.status} for ${title}`)
  const json = await res.json()
  const page = Object.values(json?.query?.pages ?? {})[0]
  if (!page || page.missing !== undefined) throw new Error(`commons: no such file — ${title}`)
  const info = page.imageinfo?.[0]
  if (!info) throw new Error(`commons: no imageinfo for ${title}`)
  return {
    title,
    descriptionUrl: info.descriptionurl,
    fileUrl: info.url,
    width: info.width,
    height: info.height,
    extmetadata: info.extmetadata,
  }
}

export function loadSources() {
  return JSON.parse(fs.readFileSync(SOURCES, 'utf-8'))
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dry-run') out.dryRun = true
    else if (argv[i] === '--all') out.all = true
    else if (argv[i].startsWith('--')) { out[argv[i].slice(2)] = argv[i + 1]; i++ }
  }
  return out
}

/**
 * The PLATE-PAGE recipe (phase 103) — find the printed plate on a scanned page
 * and cut it out before grading.
 *
 * Why this exists: the best Doré sources are not always tight plate scans. The
 * Gallica scans of `London: A Pilgrimage` are, which is why phases 83 and 101
 * could use them untouched. But the Yale (YCBA) scans of the same book are
 * PAGE PHOTOGRAPHS — cream margins, the book's own dark edge, marbled
 * endpapers, sometimes the title text — and the well-named Dante series carries
 * an English caption band under every plate. Those plates were unusable, which
 * is why The Caverns and The Capital had no arena and why the fallback stayed
 * an unlicensed pixel-art placeholder.
 *
 * `maps/forest-dark.webp` shows the shape of the old answer: its provenance
 * records "plate margins + caption band cropped" by a one-off Pillow step in
 * August 2026, done by hand OUTSIDE this script. That is precisely what this
 * script exists to prevent — an asset whose transform nobody can reproduce or
 * audit. So the crop becomes a recipe, and the box it derived is written into
 * the provenance record.
 *
 * Why not `sharp.trim()`: measured, it does not work here. On a YCBA page it
 * moved a 1249px height to 1225 — the dark book edge and marbled endpaper
 * defeat a uniform-border heuristic, because they are neither uniform nor a
 * border. The plate is instead found as the LARGEST CONTIGUOUS DARK BLOCK on
 * each axis, which ignores narrow edge artifacts by construction.
 *
 * @param sharp   - the sharp module (injected, as everywhere in this file).
 * @param raw     - the downloaded source bytes.
 * @param maxEdge - longest edge of the output.
 * @param inset   - fraction of the detected block trimmed from every side, to
 *   drop the plate's own printed border rule. 0.01 by default.
 * @returns the graded WebP buffer AND the box it used, so the caller can record it.
 */
export async function buildPlatePage(sharp, raw, maxEdge, inset = 0.01) {
  const box = await detectPlateBox(sharp, raw)
  const m = await sharp(raw).metadata()
  const W = m.width ?? 0
  const H = m.height ?? 0
  const left = Math.round((box.x0 + inset) * W)
  const top = Math.round((box.y0 + inset) * H)
  const width = Math.round((box.x1 - box.x0 - inset * 2) * W)
  const height = Math.round((box.y1 - box.y0 - inset * 2) * H)

  // Guard one of the two ways detection fails: a box far SMALLER than the
  // plate. Measured on Doré's Paradiso 31 at the first-cut coverage floor, the
  // detector returned x[0.016,0.298] y[0.701,0.989] — a corner of clouds — and
  // the pipeline cheerfully shipped it. A high-key plate (light interior on a
  // light page) breaks the "plate is darker than page" premise this detector
  // rests on, so it must fail loudly rather than crop to an artifact.
  //
  // The other way — no dark block ANYWHERE, which used to come back as the
  // whole page at frac 0.96 and so was caught by nothing here — is now refused
  // upstream by `detectPlateBox` itself, which raises before this function
  // sees a box. No frac threshold could have separated the two: of the three
  // plates phase 103 shipped, two sit at frac 0.904 and 0.913, a hair from the
  // 0.96 the detector used to invent when it found nothing.
  //
  // There is deliberately NO upper guard. A box covering nearly the whole image
  // is the correct, common answer for an already-tight plate scan: the detector
  // is then trimming the hairline margin and the plate's own border rule, which
  // is exactly what `inset` is for. Refusing that case (an earlier draft did)
  // rejects the majority of good sources.
  const frac = (width / W) * (height / H)
  if (width < 32 || height < 32) {
    throw new Error(`plate-page: detected box is degenerate (${width}x${height})`)
  }
  if (frac < 0.2) {
    throw new Error(
      `plate-page: detected box covers only ${(frac * 100).toFixed(1)}% of the source `
      + `(${width}x${height} of ${W}x${H}) — the plate was not found. This source is `
      + `probably high-key (a light plate on a light page), which this detector cannot read.`,
    )
  }

  const webp = await sharp(raw)
    .extract({ left, top, width, height })
    .grayscale()
    .modulate({ brightness: RECIPE.brightness })
    .linear(RECIPE.contrast, -(128 * RECIPE.contrast) + 128)
    .resize({ width: maxEdge, height: maxEdge, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: RECIPE.quality })
    .toBuffer()

  return { webp, crop: { left, top, width, height, sourceWidth: W, sourceHeight: H, inset }, frac }
}

/**
 * Locate the printed plate on a scanned page, as fractions of width/height.
 *
 * Exported for its own test — the plate-page cases in `scripts/art.test.mjs`,
 * which pin a blank page, a plate below the coverage floor, a plate with page
 * margins, and a tight scan that fills its page. Downsamples first (detection at ~1000px is far
 * more accurate than it needs to be, and full-resolution scanning of a 30MP
 * page is pointless), converts to luminance, then on each axis counts pixels
 * meaningfully darker than the page's own mean and takes the LONGEST
 * CONTIGUOUS RUN above a coverage floor.
 *
 * `darkPct` is the fraction of the other axis a line must be dark across to count
 * as inside the block. It is 0.15, tuned against three real sources rather than
 * guessed: at 0.35 the Doré Inferno plate 8 lost its lit horizon band (the sky
 * is part of the plate but is not dark) and Paradiso 31 collapsed to a corner;
 * at 0.05 the page background began to qualify and a page scan returned its full
 * width. 0.15 reads all three correctly.
 *
 * The threshold is relative to the image's own mean rather than absolute:
 * these scans vary from cream to grey depending on the institution and the
 * paper's age, and an absolute cut-off tuned on one library's scans silently
 * mis-crops another's.
 *
 * RAISES when no line on either axis reaches `darkPct` — a blank page, or a
 * plate too small to qualify. Returning a box it did not find is the one thing
 * this function must not do, because every downstream guard is a LOWER bound
 * and a fabricated full-page box passes them all.
 *
 * It does NOT yet raise when it finds the wrong block: longest-run still
 * prefers whichever dark block is widest, so a 600px book edge beside a 200px
 * plate crops the edge (frac 0.568, no throw). Separating those honestly needs
 * a competing-run ratio measured against the live sources the way `darkPct`
 * was, not a guessed constant.
 */
export async function detectPlateBox(sharp, raw, { darkPct = 0.15, sample = 1000 } = {}) {
  const img = sharp(raw).removeAlpha().greyscale()
  const meta = await img.metadata()
  const { data, info } = await img
    .resize({ width: Math.min(sample, meta.width ?? sample) })
    .raw()
    .toBuffer({ resolveWithObject: true })

  const W = info.width
  const H = info.height
  let sum = 0
  for (let i = 0; i < data.length; i++) sum += data[i]
  const mean = sum / data.length
  const thresh = mean * 0.82

  const colDark = new Array(W).fill(0)
  const rowDark = new Array(H).fill(0)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[y * W + x] < thresh) { colDark[x]++; rowDark[y]++ }
    }
  }

  // Longest contiguous run, NOT first/last crossing. A first/last search
  // swallows the whole page the moment a dark book edge exists — measured, it
  // returned x0=0.14,x1=1.0,y0=0,y1=1.0 on a page whose plate is ~57% x ~55%.
  //
  // `best` starts as NULL, not as the whole axis. It is only ever written when
  // a run CLOSES, so an initialiser of `[0, len - 1]` was not a default — it
  // was an answer the detector had not found, returned as though it had. On a
  // page where nothing reaches `need` that produced x[0,1] y[0,1]: the whole
  // scan, margins and book edge and caption band, at frac 0.96, which clears
  // the `frac < 0.2` floor in `buildPlatePage` without a murmur. Not finding
  // the plate must be sayable.
  const span = (arr, otherAxisLen) => {
    const need = otherAxisLen * darkPct
    let best = null
    let bestLen = -1
    let run = -1
    for (let i = 0; i <= arr.length; i++) {
      const on = i < arr.length && arr[i] >= need
      if (on && run < 0) run = i
      if (!on && run >= 0) {
        if (i - run > bestLen) { bestLen = i - run; best = [run, i - 1] }
        run = -1
      }
    }
    if (!best) return null
    return [best[0] / arr.length, (best[1] + 1) / arr.length]
  }

  const xs = span(colDark, H)
  const ys = span(rowDark, W)
  if (!xs || !ys) {
    throw new Error(
      `plate-page: no plate detected — no ${!xs ? 'column' : 'row'} is dark across `
      + `${(darkPct * 100).toFixed(0)}% of the other axis, so there is no block to crop to. `
      + `The page is probably blank, or the plate is too small to reach the coverage floor.`,
    )
  }
  const [x0, x1] = xs
  const [y0, y1] = ys
  return { x0, x1, y0, y1 }
}

/**
 * The silhouette recipe (phase V7). Unlike the Doré dim-plate recipe, this
 * produces a TRANSPARENT cutout: the source's ink/dark marks become an alpha
 * matte over solid black, everything else (the paper) becomes transparent, so
 * the caller can `tintColor` the shape to any palette colour at render time —
 * the same contract the procedural `<Splatter>` it replaces already had
 * (`color` prop). Built for scanned ink-on-paper sources (high paper/ink
 * luminance separation); not a general background remover.
 */
export async function buildSilhouette(sharp, raw, maxEdge) {
  const trimmed = sharp(raw).grayscale().trim({ threshold: 15 })
  const { data, info } = await trimmed
    .resize({ width: maxEdge, withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true })

  const rgba = Buffer.alloc(info.width * info.height * 4)
  for (let i = 0; i < info.width * info.height; i++) {
    // Paper reads ~190-235 luminance on these plates; ink reads well below
    // that. Alpha rises as luminance falls below the paper floor, scaled so
    // mid-tone ink washes still read instead of vanishing at low opacity.
    const alpha = Math.max(0, Math.min(255, Math.round((190 - data[i]) * 2.2)))
    rgba[i * 4] = 0
    rgba[i * 4 + 1] = 0
    rgba[i * 4 + 2] = 0
    rgba[i * 4 + 3] = alpha
  }
  return sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ quality: 90 })
    .toBuffer()
}

async function acquireOne(sharp, entry, opts) {
  console.log(`\n── ${entry.key} (${entry.category})`)
  console.log(`   ${entry.title}`)
  console.log(`   why: ${entry.why}`)

  const meta = await lookup(entry.title)
  const verdict = verifyLicence(meta.extmetadata)
  if (!verdict.ok) {
    console.error(`   REFUSED: ${verdict.why}`)
    return { key: entry.key, refused: verdict.why }
  }
  console.log(`   licence: ${verdict.licence} — ${verdict.artist}`)
  console.log(`   source:  ${meta.width}x${meta.height}`)

  const res = await fetch(meta.fileUrl, { headers: { 'user-agent': USER_AGENT } })
  if (!res.ok) throw new Error(`download: HTTP ${res.status} for ${entry.key}`)
  const raw = Buffer.from(await res.arrayBuffer())

  const maxEdge = entry.maxEdge ?? RECIPE.maxEdge
  const silhouette = entry.recipe === 'silhouette'
  const platePage = entry.recipe === 'plate-page'

  let webp
  let postProcessNote
  let cropRecord = null
  if (platePage) {
    // The crop is DERIVED, then recorded — see buildPlatePage's docblock for why
    // a hand-cropped asset is the thing this script exists to prevent.
    const built = await buildPlatePage(sharp, raw, maxEdge, entry.inset)
    webp = built.webp
    cropRecord = built.crop
    postProcessNote = `plate detected on the scanned page and extracted to `
      + `${built.crop.width}x${built.crop.height} at (${built.crop.left},${built.crop.top}) `
      + `of ${built.crop.sourceWidth}x${built.crop.sourceHeight} (inset ${built.crop.inset}), `
      + `then grayscale, brightness ${RECIPE.brightness} / contrast ${RECIPE.contrast} `
      + `toward the void, longest edge <= ${maxEdge}px, WebP q${RECIPE.quality}`
  } else if (silhouette) {
    webp = await buildSilhouette(sharp, raw, maxEdge)
    postProcessNote = `grayscale, trimmed to content, alpha matte from inverted luminance `
      + `(paper -> transparent, ink -> opaque black for tintColor), longest edge <= ${maxEdge}px, WebP q90`
  } else {
    // The recorded Doré recipe. These are raw scanned plates, so the grade is
    // exactly what it is for: the backdrop must sit dim enough that the chart
    // layer drawn over it stays legible.
    const image = sharp(raw)
    const m = await image.metadata()
    let pipeline = image
    if (Math.max(m.width ?? 0, m.height ?? 0) > maxEdge) {
      pipeline = pipeline.resize({
        width: (m.width ?? 0) >= (m.height ?? 0) ? maxEdge : undefined,
        height: (m.height ?? 0) > (m.width ?? 0) ? maxEdge : undefined,
        withoutEnlargement: true,
      })
    }
    webp = await pipeline
      .grayscale()
      .modulate({ brightness: RECIPE.brightness })
      .linear(RECIPE.contrast, -(128 * RECIPE.contrast) + 128)
      .webp({ quality: RECIPE.quality })
      .toBuffer()
    postProcessNote = `grayscale, brightness ${RECIPE.brightness} / contrast ${RECIPE.contrast} `
      + `toward the void, longest edge <= ${maxEdge}px, WebP q${RECIPE.quality}`
  }

  const dest = path.join(IMAGES, entry.category, `${entry.key}.webp`)
  console.log(`   ${opts.dryRun ? 'would write' : 'wrote'} ${path.relative(MOBILE, dest)}`
    + ` (${(raw.length / 1024).toFixed(0)}K -> ${(webp.length / 1024).toFixed(0)}K)`)

  const record = {
    generated_by: 'public-domain-acquisition',
    date: opts.date ?? new Date().toISOString().slice(0, 10),
    tool: 'scripts/acquire-art.mjs (Commons API + sharp)',
    source: meta.descriptionUrl,
    artist: verdict.artist,
    license: verdict.licence,
    license_verified: `read from the Commons imageinfo extmetadata at acquisition, `
      + `not asserted by the operator`,
    post_process: postProcessNote,
    covers: [`${entry.key}.webp`],
    used_by: [`assets/images/${entry.category}/index.ts`],
    // Present only for the plate-page recipe: the exact box the detector chose,
    // so the transform is reproducible from the record alone.
    ...(cropRecord ? { crop: cropRecord } : {}),
  }

  if (!opts.dryRun) {
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, webp)
    const provPath = path.join(IMAGES, entry.category, 'provenance.json')
    const existing = fs.existsSync(provPath) ? JSON.parse(fs.readFileSync(provPath, 'utf-8')) : null
    fs.writeFileSync(provPath, `${JSON.stringify(mergeProvenance(existing, record), null, 2)}\n`)
  }
  return { key: entry.key, ok: true }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  const sources = loadSources()
  const wanted = opts.all
    ? sources.acquisitions
    : sources.acquisitions.filter((a) => a.key === opts.key)

  if (wanted.length === 0) {
    console.error(`acquire-art: pass --key <one of: ${sources.acquisitions.map((a) => a.key).join(', ')}> or --all`)
    process.exit(1)
  }

  const { default: sharp } = await import('sharp')
  const results = []
  for (const entry of wanted) results.push(await acquireOne(sharp, entry, opts))

  const refused = results.filter((r) => r.refused)
  console.log(`\nacquire-art: ${results.length - refused.length} acquired, ${refused.length} refused`)
  if (refused.length) {
    refused.forEach((r) => console.error(`  ${r.key}: ${r.refused}`))
    process.exit(1)
  }
  console.log('Remember the registry: add the require() literal + region rule to index.ts.')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => { console.error(String(err.message ?? err)); process.exit(1) })
}
