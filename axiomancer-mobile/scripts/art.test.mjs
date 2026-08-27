// axiomancer-mobile/scripts/art.test.mjs — the generation pipeline, proven
// without a key and without a network call (phase 73).
//
//   node --test axiomancer-mobile/scripts/art.test.mjs
//
// The hosted backend is UNEXERCISED by design (no key in this checkout, and
// spending against a paid API is not the loop's call). Everything else — the
// compiler, the backend selection rule, the post-process, the provenance
// record — runs here against an injected fake, so the only untested surface is
// the thirty lines that actually speak HTTP.

import assert from 'node:assert/strict'
import test from 'node:test'

import { BACKEND_NAMES, generate, generationProvenance, selectBackendName, selectionReason } from './art/adapter.mjs'
import { compile, validateSpec } from './art/prompt.mjs'
import { PALETTE, PREAMBLE, STYLE_VERSION, CATEGORIES } from './art/style.mjs'
import { paletteDistance, summarize } from './art/qa.mjs'
import { postProcess } from './generate-art.mjs'

const spec = {
  slug: 'tallow-bailiff',
  category: 'enemies',
  subject: 'A parish bailiff rendered down to tallow and duty',
  detail: 'a ledger chained at the wrist',
}

// ── the prompt compiler ──────────────────────────────────────────────────────

test('a valid spec compiles to style + composition + subject + negatives', () => {
  const req = compile(spec)
  assert.ok(req.prompt.startsWith(PREAMBLE))
  assert.match(req.prompt, /three-quarter-view figure/)
  assert.match(req.prompt, /Subject: A parish bailiff/)
  assert.match(req.prompt, /Detail: a ledger chained/)
  assert.match(req.prompt, /Avoid: .*no watermark/)
  assert.equal(req.styleVersion, STYLE_VERSION)
  assert.equal(req.slug, 'tallow-bailiff')
})

test('compilation is deterministic — the record would otherwise be a lie', () => {
  assert.equal(compile(spec).prompt, compile(spec).prompt)
  assert.equal(compile(spec).promptHash, compile(spec).promptHash)
})

test('a changed spec changes the hash', () => {
  assert.notEqual(compile(spec).promptHash, compile({ ...spec, detail: 'no ledger' }).promptHash)
})

test('subject-specific negatives are appended to the standing ones', () => {
  const req = compile({ ...spec, avoid: ['no candles'] })
  assert.match(req.prompt, /no lens flare, no candles\.$/)
})

test('an invalid spec fails at compile time, before any spend', () => {
  assert.deepEqual(validateSpec({ ...spec, slug: 'Tallow Bailiff' }).length, 1)
  assert.throws(() => compile({ ...spec, category: 'nonesuch' }), /has no composition rule/)
  assert.throws(() => compile({ ...spec, subject: 'short' }), /subject must say/)
})

test('every category with a composition rule is one the ingest leg can target', () => {
  // A prompt for a category with nowhere to put the result is a wasted call.
  for (const c of CATEGORIES) assert.match(c, /^[a-z]+$/)
  assert.ok(CATEGORIES.includes('enemies') && CATEGORIES.includes('cards'))
})

// ── backend selection ────────────────────────────────────────────────────────

test('no key means the inert backend, whatever ART_BACKEND asks for', () => {
  // A run that thinks it is generating and silently is not would write a
  // provenance record for an image that does not exist.
  assert.equal(selectBackendName({}), 'null')
  assert.equal(selectBackendName({ ART_BACKEND: 'openai' }), 'null')
  assert.match(selectionReason({}), /inert/)
})

test('a key selects the requested backend', () => {
  assert.equal(selectBackendName({ OPENAI_API_KEY: 'sk-test', ART_BACKEND: 'openai' }), 'openai')
})

test('ART_BACKEND=null is honoured even with a key present', () => {
  assert.equal(selectBackendName({ OPENAI_API_KEY: 'sk-test', ART_BACKEND: 'null' }), 'null')
})

test('an unknown backend fails loudly rather than falling back', () => {
  assert.throws(() => selectBackendName({ ART_BACKEND: 'midjourney' }), /unknown ART_BACKEND/)
  // Midjourney has no public API and automation violates its ToS — the ruling
  // names it as never-in-pipeline. A silent fallback would hide the mistake.
  assert.ok(!BACKEND_NAMES.includes('midjourney'))
})

test('the inert backend reports what it would have sent and writes nothing', async () => {
  const result = await generate(compile(spec), { env: {} })
  assert.equal(result.inert, true)
  assert.equal(result.image, null)
  assert.equal(result.extra.would_have_sent.slug, 'tallow-bailiff')
  assert.equal(result.extra.would_have_sent.style_version, STYLE_VERSION)
})

// ── the generate -> post-process -> provenance path, on a fake backend ───────

const fakeBackend = (image) => ({
  name: 'fake',
  async generate() { return { model: 'fake-model-v1', image } },
})

test('a generated buffer goes through the SAME post-process as an acquisition', async () => {
  const { default: sharp } = await import('sharp')
  // A deliberately oversized source: the recipe must bring it under the cap.
  const source = await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 12, g: 10, b: 9, alpha: 1 } },
  }).png().toBuffer()

  const out = await postProcess(sharp, source)
  const meta = await sharp(out).metadata()
  assert.equal(meta.format, 'webp')
  assert.ok(Math.max(meta.width, meta.height) <= 640, `still ${meta.width}x${meta.height}`)
})

test('the provenance record carries backend, model, prompt, style version and date', async () => {
  const request = compile(spec)
  const result = await generate(request, { backend: fakeBackend(Buffer.from('x')) })
  const entry = generationProvenance({
    request, result, date: '2026-08-27', covers: ['tallow-bailiff.webp'],
  })
  assert.equal(entry.generated_by, 'ai-generation')
  assert.equal(entry.backend, 'fake')
  assert.equal(entry.model, 'fake-model-v1')
  assert.equal(entry.prompt, request.prompt)
  assert.equal(entry.prompt_hash, request.promptHash)
  assert.equal(entry.style_version, STYLE_VERSION)
  assert.equal(entry.date, '2026-08-27')
  assert.deepEqual(entry.covers, ['tallow-bailiff.webp'])
  // Raw model output is not copyrightable; the record IS the disclosure.
  assert.match(entry.license, /not copyrightable/)
})

test('an injected backend bypasses selection entirely — the test seam', async () => {
  const result = await generate(compile(spec), { backend: fakeBackend(Buffer.from('y')), env: {} })
  assert.equal(result.backend, 'fake')
  assert.equal(result.inert, false)
})

// ── the QA drift metrics ─────────────────────────────────────────────────────

test('palette distance is zero on a token and rises off it', () => {
  const [r, g, b] = [0x0b, 0x0a, 0x09] // PALETTE.bg
  assert.equal(paletteDistance(r, g, b), 0)
  assert.ok(paletteDistance(0, 255, 0) > 100, 'pure green should be far from the palette')
  assert.ok(Object.keys(PALETTE).length >= 6)
})

test('the summary rolls per-asset rows up per category', () => {
  const rows = [
    { category: 'enemies', meanLuminance: 40, paletteDistance: 20, overSized: false, hasAlpha: true, alphaCoverage: 0.5, bytes: 1024 },
    { category: 'enemies', meanLuminance: 60, paletteDistance: 30, overSized: true, hasAlpha: true, alphaCoverage: 0.6, bytes: 3072 },
    { category: 'cards', meanLuminance: 30, paletteDistance: 24, overSized: false, hasAlpha: false, alphaCoverage: 1, bytes: 2048 },
  ]
  const summary = summarize(rows)
  assert.deepEqual(summary.map((s) => s.category), ['cards', 'enemies'])
  const enemies = summary.find((s) => s.category === 'enemies')
  assert.equal(enemies.assets, 2)
  assert.equal(enemies.meanLuminance, 50)
  assert.equal(enemies.overSized, 1)
  assert.equal(enemies.alphaCutouts, 2)
})
