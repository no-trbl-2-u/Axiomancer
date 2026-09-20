#!/usr/bin/env node
// scripts/devlog-entry.test.mjs — the shared entry grammar.
//
// Both DevLog sites parse entries through `devlog-entry.mjs`, so a regression
// here breaks the private index and the public site at once. The cases below
// are the ones that actually bit: run-on headlines, run-on fields, and the
// older category vocabulary the fifty-four committed entries still use.

import test from 'node:test'
import assert from 'node:assert/strict'
import {
    CATEGORIES, EVIDENCE_KINDS, categoryCounts, extractFields, mdToHtml, normaliseCategory, parseEntry,
} from './devlog-entry.mjs'

const ENTRY = `# 2026-09-20 — A public log, at last

> The DevLog gets a public face,
> and the evidence pipeline learns
> three new kinds of change.

## [ui] The card face, reprinted

**What:** The old face turned the card's name on its side,
and stuck a glyph over unrelated art.
**Why:** A fan only shows you each card's left edge,
so the name belonged where the sliver shows.
**Shot:** combat-encounter — the fan, before and after
**Evidence:** card frostbitten-palisade — the wall, reprinted
**Commits:** d65128a4, 4e93450d

Some trailing prose.

## [docs] A legacy category

**What:** Something documented.

## Needs you

- a question for the maintainer
`

test('the headline runs on across every blockquote line', () => {
    const { headline } = parseEntry(ENTRY)
    assert.equal(headline, 'The DevLog gets a public face, and the evidence pipeline learns three new kinds of change.')
})

test('a field runs on until a blank line or the next field', () => {
    const { sections } = parseEntry(ENTRY)
    const { fields, body } = extractFields(sections[0].bodyLines)
    assert.match(fields.what, /stuck a glyph over unrelated art\.$/)
    assert.match(fields.why, /where the sliver shows\.$/)
    assert.equal(body, 'Some trailing prose.')
})

test('the evidence fields parse into their kinds, and an unknown kind is dropped', () => {
    const { sections } = parseEntry(ENTRY)
    const { fields } = extractFields(sections[0].bodyLines)
    assert.deepEqual(fields.shots, [{ screen: 'combat-encounter', caption: 'the fan, before and after' }])
    assert.deepEqual(fields.evidence, [{ kind: 'card', id: 'frostbitten-palisade', caption: 'the wall, reprinted' }])
    assert.deepEqual(fields.commits, ['d65128a4', '4e93450d'])

    const { fields: none } = extractFields(['**Evidence:** sculpture the-thing — nope'])
    assert.deepEqual(none.evidence, [])
    for (const kind of Object.keys(EVIDENCE_KINDS)) {
        const { fields: one } = extractFields([`**Evidence:** ${kind} an-id — a caption`])
        assert.equal(one.evidence.length, 1, `${kind} should parse`)
    }
})

test('"no capture" is a field, because missing evidence is stated and never faked', () => {
    const { fields } = extractFields(['**No capture:** both frames sit under the tutorial card.'])
    assert.equal(fields.noCapture, 'both frames sit under the tutorial card.')
})

test('a bracketed heading is a work item whatever it is called; an unbracketed one is a panel', () => {
    const { sections } = parseEntry(ENTRY)
    assert.equal(sections[0].kind, 'card')
    assert.equal(sections[0].category, 'ui')
    // `[docs]` predates the five-category vocabulary and must still be a card.
    assert.equal(sections[1].kind, 'card')
    assert.equal(sections[1].category, 'infra')
    assert.equal(sections[2].kind, 'panel')
    assert.equal(sections[2].title, 'Needs you')
})

test('every alias resolves to one of the five categories', () => {
    for (const raw of ['docs', 'combat', 'mobile', 'world', 'tests', 'mechanics,mobile', 'unheard-of']) {
        assert.ok(CATEGORIES.includes(normaliseCategory(raw)), `${raw} did not resolve`)
    }
    assert.equal(normaliseCategory(''), null)
})

test('category counts are derived from the parse, never authored', () => {
    const counts = categoryCounts(parseEntry(ENTRY).sections)
    assert.deepEqual(counts, { ui: 1, infra: 1 })
})

test('block markdown renders tables, lists and diffs into classed markup both sites style', () => {
    const html = mdToHtml('| Tick | Outcome |\n|---|---|\n| one | shipped |\n\n```diff\n@@ hunk @@\n- old\n+ new\n```')
    assert.match(html, /<table>/)
    assert.match(html, /class="st st-ok"/)
    assert.match(html, /class="dl add"/)
    assert.match(html, /class="dl del"/)
})
