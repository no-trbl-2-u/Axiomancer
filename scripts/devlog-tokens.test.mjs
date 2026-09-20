#!/usr/bin/env node
// scripts/devlog-tokens.test.mjs — THE CONTRAST GATE.
//
// The burn-day audit's row 3.10 found `rust` shipped below AA on three themes
// behind a commit message claiming "no pair regressed". It went uncaught
// because the app's `READABLE_PAIRS` did not list `rust` at all and covered the
// other accents against `bg` only. The public DevLog publishes those same
// tokens to strangers, so it carries its own gate over the stylesheet it
// actually emits: all six readable tokens against BOTH grounds on ALL five
// themes, plus the dimmed prose register measured after compositing.
//
// DESIGN.md §1: "a pair that cannot be measured is a pair that does not ship."
//
// Run: node --test scripts/devlog-tokens.test.mjs  (or `npm test` at the root)

import test from 'node:test'
import assert from 'node:assert/strict'
import {
    AA_CONTRAST, DEFAULT_THEME, GROUND_TOKENS, LIGHT_PREFERENCE_THEME, READABLE_TOKENS,
    THEME_IDS, composite, contrast, contrastRows, derive, readThemeSpecs, stylesheet, tokensFor,
} from './devlog-tokens.mjs'

test('every readable token clears AA against both grounds on every theme', () => {
    const failures = contrastRows()
        .filter((r) => !r.pass)
        .map((r) => `${r.theme} ${r.token}/${r.ground} = ${r.ratio.toFixed(2)}`)
    assert.deepEqual(failures, [], `below AA (${AA_CONTRAST}:1): ${failures.join(', ')}`)
})

test('the gate covers the pairs row 3.10 was found in — rust against both grounds, all five themes', () => {
    const rows = contrastRows()
    for (const theme of THEME_IDS) {
        for (const ground of GROUND_TOKENS) {
            const row = rows.find((r) => r.theme === theme && r.token === 'rust' && r.ground === ground)
            assert.ok(row, `no measurement for ${theme} rust/${ground}`)
            assert.ok(row.ratio >= AA_CONTRAST, `${theme} rust/${ground} = ${row.ratio.toFixed(2)}`)
        }
    }
})

test('the dimmed prose register is measured composited, not as raw parchment', () => {
    const specs = readThemeSpecs()
    for (const theme of THEME_IDS) {
        const spec = specs[theme]
        const flat = composite(spec.parchment, 0.65, spec.bg)
        assert.notEqual(flat.toLowerCase(), spec.parchment.toLowerCase(), 'compositing must change the colour')
        assert.ok(contrast(flat, spec.bg) >= AA_CONTRAST, `${theme} parchmentDim/bg below AA`)
        // And the composite is genuinely dimmer than the raw token it derives from.
        assert.ok(contrast(flat, spec.bg) < contrast(spec.parchment, spec.bg))
    }
})

test('ash is never a text token — it is borders and disabled furniture only', () => {
    assert.ok(!READABLE_TOKENS.includes('ash'))
    const specs = readThemeSpecs()
    for (const theme of THEME_IDS) {
        // Documented as 1.74-1.94 in DESIGN.md §1; assert it stays a non-text hue
        // so nobody "fixes" the gate by promoting ash into the readable set.
        assert.ok(contrast(specs[theme].ash, specs[theme].bg) < 3, `${theme} ash is bright enough to be mistaken for text`)
    }
})

test('the palette parse is strict — a shape change fails loudly instead of publishing stale colour', () => {
    assert.throws(() => readThemeSpecs('export const THEME_SPECS = {}'), /theme ashen-gold is missing/)
    const truncated = THEME_IDS.map((id) => `'${id}': {\n  spec: {\n    bg: '#000000',\n  },\n`).join('')
    assert.throws(() => readThemeSpecs(truncated), /missing token/)
})

test('the stylesheet carries the derived tokens, not only the base hues', () => {
    const css = stylesheet()
    for (const token of ['divider', 'parchmentDim', 'parchmentMed', 'sulfurSubtle', 'overlay']) {
        assert.match(css, new RegExp(`--${token}:`), `derived token --${token} is missing`)
    }
    // Residue item 1: the derivation is makePalette's, not an approximation.
    const specs = readThemeSpecs()
    assert.equal(derive(specs[DEFAULT_THEME]).divider, 'rgba(236, 224, 200, 0.12)')
    assert.equal(derive(specs[DEFAULT_THEME]).parchmentDim, 'rgba(236, 224, 200, 0.65)')
})

test('the stylesheet ships all five themes, defaults to ashen-gold, and answers a light preference in CSS', () => {
    const css = stylesheet()
    for (const id of THEME_IDS) assert.match(css, new RegExp(`\\[data-theme="${id}"\\]`))
    const specs = readThemeSpecs()
    // :root is the default theme's block, so the page is correct with no script.
    const root = css.slice(css.indexOf(':root {'), css.indexOf('}'))
    assert.match(root, new RegExp(`--bg: ${specs[DEFAULT_THEME].bg}`))
    assert.match(css, /@media \(prefers-color-scheme: light\)/)
    assert.match(css, new RegExp(`--bg: ${specs[LIGHT_PREFERENCE_THEME].bg}`))
})

test('tokensFor exposes exactly the tokens the site names, and every value is a colour', () => {
    const tokens = tokensFor(readThemeSpecs()[DEFAULT_THEME])
    for (const name of [...READABLE_TOKENS, ...GROUND_TOKENS, 'ash', 'deepBg', 'selectFill']) {
        assert.match(tokens[name], /^#[0-9a-f]{6}$/i, `${name} is not a hex colour`)
    }
    for (const value of Object.values(tokens)) {
        assert.match(value, /^(#[0-9a-f]{3,8}|rgba\([\d\s.,]+\))$/i, `${value} is not a colour`)
    }
})
