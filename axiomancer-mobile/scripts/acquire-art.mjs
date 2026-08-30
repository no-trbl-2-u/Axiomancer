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

  let webp
  let postProcessNote
  if (silhouette) {
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
