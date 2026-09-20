#!/usr/bin/env node
// scripts/devlog-tokens.mjs — the app's palette, exported as CSS custom
// properties for the public DevLog site.
//
// WHY THIS EXISTS
// ---------------
// `devlog/DESIGN.md` §1 sets one rule for the site's colour: "tokens, never
// hex". Every colour on the public site is a CSS custom property named
// EXACTLY as the app's token is named in `axiomancer-mobile/theme/palette.ts`,
// so a token change in the app has an obvious counterpart on the web. The only
// way to keep that true without a human re-typing hexes is to read the app's
// own source at build time — which is what this module does.
//
// It is deliberately a *parser* rather than an import: `palette.ts` is
// TypeScript inside an Expo workspace, the public build is zero-dependency
// Node (design prompt §3.4), and nothing here may pull in ts-node just to read
// seventeen hex literals. The parse is narrow and asserted: `readThemeSpecs`
// throws if the file stops matching the shape it expects, so a refactor in the
// app fails the build loudly instead of silently publishing stale colours.
//
// WHAT IT EMITS
// -------------
//   :root                            the default theme (ashen-gold)
//   [data-theme="<id>"]              each of the five shipped themes
//   :root:not([data-theme]) under    a light system preference gets
//   (prefers-color-scheme: light)    `frost-marrow`, the palest of the five
//
// Derived tokens (`divider`, `parchmentDim`, …) are emitted alongside the base
// hues, computed by the same arithmetic `makePalette` uses — DESIGN.md §10
// residue item 1 names this explicitly: "it must emit the derived tokens too,
// not just the 17 base hues".
//
// Usage:
//   node scripts/devlog-tokens.mjs            print the stylesheet to stdout
//   import { readThemeSpecs, contrast } …     from the builder and the tests

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** The app's palette source — the single origin of every colour on the site. */
export const PALETTE_SOURCE = join(ROOT, 'axiomancer-mobile', 'theme', 'palette.ts')

/**
 * The combat view-model, which owns `STANCE_COLORS` — the dice palette a card
 * plate is framed by. DESIGN.md §10 residue item 7 is explicit that the build
 * must read the REAL mapping rather than reproduce the prototype's assumption
 * (the prototype guessed body -> blood, mind -> sulfur, heart -> rust; the
 * shipped mapping is body RED, mind BLUE, heart PURPLE, wild GOLD).
 */
export const STANCE_SOURCE = join(
    ROOT, 'axiomancer-mobile', 'state', 'presenters', 'combat-encounter.engine.ts',
)

/** The stances a card plate can be framed by, in the order the catalog lists them. */
export const STANCES = ['body', 'mind', 'heart', 'wild']

/**
 * WCAG's floor for MEANINGFUL NON-TEXT (a frame that carries which stance a
 * card is). Text on the site clears AA_CONTRAST instead.
 */
export const NON_TEXT_CONTRAST = 3

/** The five shipped themes, in the order the switcher lists them. */
export const THEME_IDS = [
    'ashen-gold',
    'coastal-verdant',
    'ember-depths',
    'frost-marrow',
    'plague-bloom',
]

/** The default, matching `DEFAULT_THEME_ID` in the app. */
export const DEFAULT_THEME = 'ashen-gold'

/**
 * The theme chosen for a first visit that states a LIGHT system preference.
 * All five themes are dark; DESIGN.md §1 rules that a light preference gets
 * the palest one rather than an invented sixth palette.
 */
export const LIGHT_PREFERENCE_THEME = 'frost-marrow'

/**
 * The six tokens that may carry TEXT, and therefore must clear WCAG AA (4.5:1)
 * against both grounds. `ash` is deliberately absent: it measures 1.74-1.94
 * and is borders and disabled furniture only (DESIGN.md §1).
 */
export const READABLE_TOKENS = ['parchment', 'bone', 'sulfur', 'blood', 'rust', 'heal']

/** The only two tokens text is ever set on. */
export const GROUND_TOKENS = ['bg', 'panelBg']

/** WCAG AA for body text. The gate the contrast gate asserts. */
export const AA_CONTRAST = 4.5

// ── colour arithmetic ───────────────────────────────────────────────────────

/** `#rgb` / `#rrggbb` -> `[r, g, b]`, each 0-255. Mirrors palette.ts's hexToRgb. */
export function hexToRgb(hex) {
    let h = String(hex).replace('#', '').trim()
    if (h.length === 3) h = h.split('').map((c) => c + c).join('')
    if (!/^[0-9a-f]{6}$/i.test(h)) throw new Error(`devlog-tokens: not a hex colour: ${hex}`)
    const n = parseInt(h, 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** `rgba(r, g, b, a)` from a hex + alpha. Mirrors palette.ts's rgba(). */
export function rgba(hex, alpha) {
    const [r, g, b] = hexToRgb(hex)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** WCAG 2.1 relative luminance of an `#rrggbb` colour. */
export function luminance(hex) {
    const [r, g, b] = hexToRgb(hex).map((v) => {
        const s = v / 255
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 2.1 contrast ratio between two opaque `#rrggbb` colours (1 - 21). */
export function contrast(a, b) {
    const la = luminance(a)
    const lb = luminance(b)
    const [hi, lo] = la >= lb ? [la, lb] : [lb, la]
    return (hi + 0.05) / (lo + 0.05)
}

/**
 * Composite a translucent foreground over an opaque ground and return the
 * resulting opaque hex. Body prose renders at `--parchmentDim` (parchment at
 * 0.65), so its real contrast is the contrast of the COMPOSITE, not of
 * `parchment` — the gate measures what the reader actually sees.
 */
export function composite(fgHex, alpha, groundHex) {
    const fg = hexToRgb(fgHex)
    const bg = hexToRgb(groundHex)
    const mix = fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha)))
    return '#' + mix.map((c) => c.toString(16).padStart(2, '0')).join('')
}

// ── reading the app's palette ───────────────────────────────────────────────

/**
 * Pull every theme's ~17 authored base hues out of `palette.ts`.
 *
 * The parse walks `THEME_SPECS`' per-theme `spec: { … }` blocks and collects
 * `key: '#hex'` pairs. It is intentionally strict: a theme that goes missing,
 * or a spec that loses a token the site names, throws. Publishing the wrong
 * colours silently is the failure this guards against.
 *
 * @param {string} [source] the palette.ts contents (defaults to reading disk)
 * @returns {Record<string, Record<string, string>>} themeId -> token -> hex
 */
export function readThemeSpecs(source = readFileSync(PALETTE_SOURCE, 'utf8')) {
    const specs = {}
    for (const id of THEME_IDS) {
        // The theme's entry, e.g.  'ashen-gold': { … spec: { … }, },
        const head = source.indexOf(`'${id}': {`)
        if (head === -1) throw new Error(`devlog-tokens: theme ${id} is missing from palette.ts`)
        const specAt = source.indexOf('spec: {', head)
        if (specAt === -1) throw new Error(`devlog-tokens: theme ${id} has no spec block`)
        const close = source.indexOf('},', specAt)
        const block = source.slice(specAt, close)

        const tokens = {}
        for (const [, key, hex] of block.matchAll(/(\w+):\s*'(#[0-9a-fA-F]{3,8})'/g)) tokens[key] = hex
        for (const required of [...READABLE_TOKENS, ...GROUND_TOKENS, 'ash', 'deepBg', 'selectFill']) {
            if (!tokens[required]) {
                throw new Error(`devlog-tokens: theme ${id} is missing token "${required}"`)
            }
        }
        specs[id] = tokens
    }
    return specs
}

/**
 * Derive the translucent tokens exactly as `makePalette` does in the app.
 * Kept to the members the site actually uses — the app's combat-only washes
 * (`nodeBg`, `pixelShadow`, …) have no web counterpart and are not emitted.
 */
export function derive(spec) {
    return {
        divider: rgba(spec.parchment, 0.12),
        parchmentMed: rgba(spec.parchment, 0.35),
        parchmentDim: rgba(spec.parchment, 0.65),
        sulfurSubtle: rgba(spec.sulfur, 0.1),
        sulfurMed: rgba(spec.sulfur, 0.3),
        bloodSubtle: rgba(spec.blood, 0.1),
        rustSubtle: rgba(spec.rust, 0.1),
        backdrop: rgba(spec.deepBg, 0.4),
        overlay: rgba(spec.deepBg, 0.92),
        shadow: 'rgba(0, 0, 0, 0.6)',
    }
}

/** One theme's full token set: base hues the site uses + the derived ones. */
export function tokensFor(spec) {
    const base = {}
    for (const key of [...READABLE_TOKENS, ...GROUND_TOKENS, 'ash', 'deepBg', 'selectFill']) {
        base[key] = spec[key]
    }
    return { ...base, ...derive(spec) }
}

/**
 * Read `STANCE_COLORS` out of the combat presenter.
 *
 * These are the one family of colours on the site that is NOT a palette token:
 * they are the game's dice palette, identity-carrying and not theme-driven, and
 * a card plate framed in anything else would be a prettier lie. They are
 * emitted as `--stance-*` custom properties so components still name a token
 * rather than a hex.
 *
 * @returns {Record<string, string>} stance -> hex
 */
export function readStanceColors(source = readFileSync(STANCE_SOURCE, 'utf8')) {
    const at = source.indexOf('STANCE_COLORS')
    if (at === -1) throw new Error('devlog-tokens: STANCE_COLORS is missing from the combat presenter')
    const block = source.slice(at, source.indexOf('}', at))
    const colors = {}
    for (const [, key, hex] of block.matchAll(/(\w+):\s*'(#[0-9a-fA-F]{3,8})'/g)) colors[key] = hex
    for (const stance of STANCES) {
        if (!colors[stance]) throw new Error(`devlog-tokens: STANCE_COLORS has no "${stance}"`)
    }
    return colors
}

/** `{ bg: '#0b0a09', … }` -> `  --bg: #0b0a09;` lines, stable order. */
function declarations(tokens, indent = '  ') {
    return Object.entries(tokens)
        .map(([k, v]) => `${indent}--${k}: ${v};`)
        .join('\n')
}

/**
 * The whole token stylesheet.
 *
 * `:root` carries the default so the page is correct before any script runs;
 * `[data-theme="…"]` blocks let the switcher repaint by setting one attribute
 * (no reload — the web has no `StyleSheet.create` snapshot problem the app
 * works around). The light-preference block is CSS, not script, so a first
 * visit is already right with JavaScript off.
 */
export function stylesheet(specs = readThemeSpecs(), stances = readStanceColors()) {
    const stanceDecls = STANCES.map((s) => `  --stance-${s}: ${stances[s]};`).join('\n')
    const blocks = [
        '/* GENERATED by scripts/devlog-tokens.mjs from axiomancer-mobile/theme/palette.ts.',
        '   Do not edit: change the app\'s palette and rebuild. */',
        `:root {\n${declarations(tokensFor(specs[DEFAULT_THEME]))}\n}`,
        '/* The dice palette, read from the combat presenter\'s STANCE_COLORS. Not',
        '   theme-driven: it is identity, exactly as it is in the app. */',
        `:root {\n${stanceDecls}\n}`,
    ]
    for (const id of THEME_IDS) {
        blocks.push(`[data-theme="${id}"] {\n${declarations(tokensFor(specs[id]))}\n}`)
    }
    blocks.push(
        '/* All five themes are dark. A light system preference gets the palest of',
        '   them rather than an invented sixth palette (DESIGN.md §1). */',
        '@media (prefers-color-scheme: light) {',
        `  :root:not([data-theme]) {\n${declarations(tokensFor(specs[LIGHT_PREFERENCE_THEME]), '    ')}\n  }`,
        '}',
    )
    return blocks.join('\n') + '\n'
}

/**
 * Measure every readable token against both grounds, on every theme.
 *
 * Returns one row per pair — the data behind DESIGN.md §1's contrast table and
 * behind the CI gate. `pass` is the AA verdict; `composited` is true for the
 * dimmed prose register, whose ratio is measured after compositing.
 */
export function contrastRows(specs = readThemeSpecs()) {
    const rows = []
    for (const theme of THEME_IDS) {
        const spec = specs[theme]
        for (const token of READABLE_TOKENS) {
            for (const ground of GROUND_TOKENS) {
                const ratio = contrast(spec[token], spec[ground])
                rows.push({ theme, token, ground, ratio, pass: ratio >= AA_CONTRAST, composited: false })
            }
        }
        // The body-prose register: parchment at 0.65 over each ground.
        for (const ground of GROUND_TOKENS) {
            const flat = composite(spec.parchment, 0.65, spec[ground])
            const ratio = contrast(flat, spec[ground])
            rows.push({
                theme, token: 'parchmentDim', ground, ratio,
                pass: ratio >= AA_CONTRAST, composited: true,
            })
        }
    }
    return rows
}

// ── CLI ─────────────────────────────────────────────────────────────────────
// `node scripts/devlog-tokens.mjs`          -> the stylesheet
// `node scripts/devlog-tokens.mjs --table`  -> the measured contrast table
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    // A consumer that closes the pipe early (`| head`) must not crash the CLI.
    process.stdout.on('error', () => {})
    if (process.argv.includes('--table')) {
        for (const r of contrastRows()) {
            const mark = r.pass ? 'AA' : 'FAIL'
            process.stdout.write(
                `${r.theme.padEnd(16)} ${r.token.padEnd(13)} vs ${r.ground.padEnd(8)} ${r.ratio.toFixed(2).padStart(6)}  ${mark}\n`,
            )
        }
    } else {
        process.stdout.write(stylesheet())
    }
}
