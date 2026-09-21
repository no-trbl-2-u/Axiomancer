#!/usr/bin/env node
// scripts/devlog-card-plate.test.mjs — the card plate, and its honesty.
//
// The publish prompt's standing warning about this renderer is that it must
// not drift into "a second, prettier truth". The proof is mechanical: the
// plate may only carry fields the ENGINE'S OWN exporter emits, and if the
// exporter stops emitting them this test fails rather than the plate quietly
// rendering blanks.

import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { CARD_FIELDS, FACE_FIELDS, PLATE, cardPlate, foePlate, stanceOf, wrap } from './devlog-card-plate.mjs'
import { readStanceColors, contrast, readThemeSpecs, THEME_IDS, NON_TEXT_CONTRAST } from './devlog-tokens.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CARD = {
    id: 'frostbitten-palisade',
    name: 'Frostbitten Palisade',
    chips: [{ k: 'Stance', v: 'body' }],
    face: { freeGlyph: '◇', freeKw: 'GUARD', freeVal: '4', paid: 'GUARD 10, then arm RIPOSTE 6 with parry 3.' },
}

test('the plate prints the card\'s own words, not a paraphrase', () => {
    const svg = cardPlate(CARD)
    assert.match(svg, /Frostbitten Palisade/)
    assert.match(svg, /GUARD/)
    // The printed text is laid out line by line, so the whole string lives in
    // <desc> — where a screen reader reads it too.
    assert.match(svg, /<desc>◇ GUARD 4\. GUARD 10, then arm RIPOSTE 6 with parry 3\.<\/desc>/)
    assert.match(svg, /<title>Frostbitten Palisade<\/title>/)
    assert.match(svg, new RegExp(`viewBox="0 0 ${PLATE.width} ${PLATE.height}"`))
    assert.match(svg, /role="img"/)
    assert.match(svg, /aria-label="Frostbitten Palisade"/)
})

test('the same record always renders the same bytes', () => {
    assert.equal(cardPlate(CARD), cardPlate(CARD))
})

test('the frame is the app\'s real stance palette, not the prototype\'s guess', () => {
    const stances = readStanceColors()
    // The prototype assumed body -> blood (#e05a45). The shipped mapping is
    // the dice palette's red; reading the real one is DESIGN.md residue 7.
    assert.equal(stances.body, '#d6543f')
    assert.match(cardPlate(CARD, { stances }), /stroke="#d6543f"/)
    // A frame carries meaning, so it clears the non-text contrast floor on
    // every theme's plate ground.
    const specs = readThemeSpecs()
    for (const theme of THEME_IDS) {
        for (const stance of ['body', 'mind', 'heart']) {
            assert.ok(contrast(stances[stance], specs[theme].deepBg) >= NON_TEXT_CONTRAST,
                `${theme} ${stance} frame is below ${NON_TEXT_CONTRAST}:1`)
        }
    }
})

test('a foe plate reuses the card plate rather than forking it', () => {
    const svg = foePlate({ id: 'enemy-ghast', name: 'Ghast', level: 5, maxHealth: 44, stats: { body: 3, mind: 1, heart: 2 }, logicBlurb: 'Hunger given manners.' })
    assert.match(svg, /<title>Ghast<\/title>/)
    assert.match(svg, /LEVEL 5/)
    assert.match(svg, /HP 44/)
    assert.match(svg, /Hunger given manners\./)
    // The strongest stat picks the frame, so a foe plate is stance-coloured too.
    assert.match(svg, new RegExp(`stroke="${readStanceColors().body}"`))
})

test('text is escaped, so a card name can never inject markup', () => {
    const svg = cardPlate({ ...CARD, name: '<script>alert(1)</script>' })
    assert.ok(!svg.includes('<script>'))
    assert.match(svg, /&lt;script&gt;/)
})

test('wrapping is deterministic and never drops a word', () => {
    const text = 'GUARD 10, then arm RIPOSTE 6 with parry 3, and hold the wall until the bell.'
    const lines = wrap(text, { width: 272, fontSize: 12.5 })
    assert.deepEqual(lines, wrap(text, { width: 272, fontSize: 12.5 }))
    assert.equal(lines.join(' ').split(/\s+/).length, text.split(/\s+/).length)
})

test('the exporter still emits every field the plate reads', () => {
    // If this fails, the catalog export changed shape and the plate would be
    // rendering blanks — the exact silent drift the renderer must not have.
    const path = join(ROOT, 'devlog', 'data', 'cards.json')
    if (!existsSync(path)) return // `npm run catalog:export` has not run in this tree
    const cards = JSON.parse(readFileSync(path, 'utf8'))
    assert.ok(cards.length > 0)
    for (const field of CARD_FIELDS) assert.ok(field in cards[0], `cards.json lost "${field}"`)
    for (const field of FACE_FIELDS) assert.ok(field in cards[0].face, `cards.json's face lost "${field}"`)
    // Phase 104 — `any` is the grey office's colour (every die powers it).
    assert.ok(['body', 'mind', 'heart', 'any'].includes(stanceOf(cards[0])), 'the Stance chip stopped resolving')
})
