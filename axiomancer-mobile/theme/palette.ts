/**
 * Theme registry + palette factory (visual-audit 2026-06).
 *
 * Miserere Mei, Deus ships a single dark-gothic identity, but the colour
 * *accents* are now theme-driven so the world can shift palette as the
 * pilgrim descends into different regions (future biome worlds) without
 * touching the 150+ components that read `AXM.*`.
 *
 * ## How it works
 *
 * Every component imports the `AXM` object from `theme/axm.ts`. That
 * object is now a *frozen snapshot of the active theme's palette*,
 * resolved **once at module-load** (see `theme/axm.ts`). Because the
 * resolution happens while `theme/axm.ts` evaluates — strictly before
 * any importing module's body (and therefore before any
 * `StyleSheet.create(...)` runs) — every static stylesheet captures the
 * active palette with zero per-component change.
 *
 * Switching themes at runtime therefore reloads the bundle (the dev
 * switcher does this) so the new palette is re-resolved cleanly. This
 * keeps the system bullet-proof against React Native's module-scope
 * `StyleSheet.create` caching, at the cost of a ~1s reload on switch —
 * an acceptable trade for a preview affordance.
 *
 * ## Authoring a new theme
 *
 * Add a `ThemeSpec` (the ~17 base hues) to `THEME_SPECS`. The derived
 * translucent tokens (dividers, accent washes, overlays) are computed
 * by `makePalette` so they always track the theme's accents.
 *
 * The blackletter + serif type system (FONTS / TYPE) is identity and
 * is **not** theme-driven.
 */

export type ThemeId =
    | 'ashen-gold'
    | 'coastal-verdant'
    | 'ember-depths'
    | 'frost-marrow'
    | 'plague-bloom';

/** The integrated default — the "richer accents, dark base" direction. */
export const DEFAULT_THEME_ID: ThemeId = 'ashen-gold';

/** AsyncStorage / localStorage slot. `:v1` so a shape change can migrate. */
export const THEME_STORAGE_KEY = '@axiomancer/theme:v1';

/**
 * The ~17 authored base hues for a theme. Everything else (translucent
 * washes, dividers, overlays) is derived from these so a new theme only
 * needs these values.
 */
export interface ThemeSpec {
    bg: string;
    parchment: string;
    blood: string;
    sulfur: string;
    rust: string;
    heal: string;
    bone: string;
    ash: string;
    panelBg: string;
    deepBg: string;
    dockBg: string;
    silhouette: string;
    selectFill: string;
    debuff: string;
    buff: string;
    pixelShadow: string;
    pixelHighlight: string;
}

/** The full resolved palette — the exact shape the legacy `AXM` had. */
export interface Palette extends ThemeSpec {
    backdrop: string;
    overlay: string;
    divider: string;
    parchmentMed: string;
    parchmentDim: string;
    sulfurSubtle: string;
    sulfurMed: string;
    healSubtle: string;
    bloodSubtle: string;
    bloodMed: string;
    bloodStrong: string;
    rustSubtle: string;
    shadow: string;
    nodeBg: string;
}

export interface ThemeDef {
    id: ThemeId;
    /** Short display name for the dev switcher. */
    name: string;
    /** One-line flavour for the dev switcher. */
    blurb: string;
    spec: ThemeSpec;
}

function hexToRgb(hex: string): [number, number, number] {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgba(hex: string, alpha: number): string {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Derive the full translucent palette from a theme's base hues. */
export function makePalette(s: ThemeSpec): Palette {
    return {
        ...s,
        backdrop: rgba(s.deepBg, 0.4),
        overlay: rgba(s.deepBg, 0.92),
        divider: rgba(s.parchment, 0.12),
        parchmentMed: rgba(s.parchment, 0.35),
        parchmentDim: rgba(s.parchment, 0.65),
        sulfurSubtle: rgba(s.sulfur, 0.1),
        sulfurMed: rgba(s.sulfur, 0.3),
        healSubtle: rgba(s.heal, 0.1),
        bloodSubtle: rgba(s.blood, 0.1),
        bloodMed: rgba(s.blood, 0.3),
        bloodStrong: rgba(s.blood, 0.55),
        rustSubtle: rgba(s.rust, 0.1),
        shadow: 'rgba(0, 0, 0, 0.6)',
        nodeBg: rgba(s.bg, 0.9),
    };
}

/**
 * Phase 101 retune — the accents were pulled toward HISTORICAL PIGMENT.
 *
 * The world plates are 19th-century wood engravings graded toward the void:
 * they carry essentially zero chroma. Against that, the previous accents
 * (a #a6e22e lime, a #b81fae magenta, a #5ec5e8 cyan) read as UI stickers
 * laid on top of a print rather than as part of the page. Each theme's hues
 * were desaturated and shifted toward colours a hand-tinted plate or an
 * illuminated manuscript would actually carry — iron-gall, oxblood, gold
 * leaf, verdigris, red ochre, lapis, orpiment, murex — while keeping every
 * theme's identity and its name.
 *
 * Readability was measured before and after, not assumed. No pair regressed,
 * and the two that were only AA-large before now clear full AA: ashen-gold's
 * `blood/bg` 4.16 -> 5.39, plague-bloom's `blood/bg` 3.63 -> 5.72. The
 * `theme contrast` block in `__tests__/palette.test.ts` is the guard that did
 * not exist when those two were allowed to drift below the line.
 */
export const THEME_SPECS: Record<ThemeId, ThemeDef> = {
    'ashen-gold': {
        id: 'ashen-gold',
        name: 'Ashen Gold',
        blurb: 'Cursed lands — iron-gall ink, gold leaf and oxblood.',
        spec: {
            bg: '#0b0a09',
            parchment: '#ece0c8',
            blood: '#e05a45',
            sulfur: '#dcb04a',
            rust: '#a8562a',
            heal: '#8fa855',
            bone: '#9c937f',
            ash: '#46403a',
            panelBg: '#15110c',
            deepBg: '#070509',
            dockBg: '#100c08',
            silhouette: '#0c0908',
            selectFill: '#27200c',
            debuff: '#241a33',
            buff: '#33270d',
            pixelShadow: '#6e2a1c',
            pixelHighlight: '#f6ecd8',
        },
    },
    'coastal-verdant': {
        id: 'coastal-verdant',
        name: 'Coastal Verdant',
        blurb: 'Salt-bitten shores — verdigris and weathered coral over slate.',
        spec: {
            bg: '#080b0c',
            parchment: '#e2e8d8',
            blood: '#e07a5a',
            sulfur: '#6fb89c',
            rust: '#417f78',
            heal: '#8cb473',
            bone: '#8a988f',
            ash: '#324440',
            panelBg: '#0c1614',
            deepBg: '#05090a',
            dockBg: '#0a1210',
            silhouette: '#081110',
            selectFill: '#0d2a24',
            debuff: '#14243a',
            buff: '#10302a',
            pixelShadow: '#1a4a48',
            pixelHighlight: '#e6f2ea',
        },
    },
    'ember-depths': {
        id: 'ember-depths',
        name: 'Ember Depths',
        blurb: 'Molten underworld — red ochre and smoke.',
        spec: {
            bg: '#0c0706',
            parchment: '#eddcc4',
            blood: '#e2604a',
            sulfur: '#dd9a4e',
            rust: '#a84a22',
            heal: '#9caf5c',
            bone: '#a8917e',
            ash: '#4a3a32',
            panelBg: '#180e09',
            deepBg: '#0a0503',
            dockBg: '#140b06',
            silhouette: '#0e0805',
            selectFill: '#33180a',
            debuff: '#2b1a18',
            buff: '#33240c',
            pixelShadow: '#7a2a18',
            pixelHighlight: '#f6e8d4',
        },
    },
    'frost-marrow': {
        id: 'frost-marrow',
        name: 'Frost Marrow',
        blurb: 'Frozen reaches — pale lapis over bone.',
        spec: {
            bg: '#080a0d',
            parchment: '#e0e7ee',
            blood: '#d3697a',
            sulfur: '#86b2c9',
            rust: '#6b85a2',
            heal: '#83b5a6',
            bone: '#8893a0',
            ash: '#2f3b48',
            panelBg: '#0c131c',
            deepBg: '#05080c',
            dockBg: '#0a1018',
            silhouette: '#080e15',
            selectFill: '#0f2636',
            debuff: '#1b2040',
            buff: '#122a36',
            pixelShadow: '#244a62',
            pixelHighlight: '#e6f0f4',
        },
    },
    'plague-bloom': {
        id: 'plague-bloom',
        name: 'Plague Bloom',
        blurb: 'Rotting fen — orpiment and murex.',
        spec: {
            bg: '#0a0a08',
            parchment: '#e3e7cb',
            blood: '#c46bae',
            sulfur: '#b8c661',
            rust: '#7b8a3a',
            heal: '#74b899',
            bone: '#919a7e',
            ash: '#3e4233',
            panelBg: '#11140c',
            deepBg: '#07090a',
            dockBg: '#0d1108',
            silhouette: '#0a0e08',
            selectFill: '#1f2a0a',
            debuff: '#2a1a38',
            buff: '#232e10',
            pixelShadow: '#4e2a5e',
            pixelHighlight: '#eef4dc',
        },
    },
};

/** Ordered list for the dev switcher (default first). */
export const THEME_ORDER: ThemeId[] = [
    'ashen-gold',
    'coastal-verdant',
    'ember-depths',
    'frost-marrow',
    'plague-bloom',
];

export function isThemeId(value: unknown): value is ThemeId {
    return typeof value === 'string' && value in THEME_SPECS;
}

/**
 * Resolve the active theme id **synchronously** at module-load.
 * Priority: an explicit global override (used by the screenshot
 * harness / tests) → persisted web `localStorage` choice → default.
 *
 * Native (no `localStorage`) always boots the default and relies on the
 * dev switcher's reload + persisted value; the switcher mirrors the id
 * into the same global so a same-session reload honours the choice.
 */
export function resolveActiveThemeId(): ThemeId {
    try {
        const override = (globalThis as { __AXM_THEME__?: unknown }).__AXM_THEME__;
        if (isThemeId(override)) return override;
    } catch {
        /* ignore */
    }
    try {
        if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem(THEME_STORAGE_KEY);
            if (isThemeId(stored)) return stored;
        }
    } catch {
        /* ignore — storage may be unavailable */
    }
    return DEFAULT_THEME_ID;
}

export function paletteFor(id: ThemeId): Palette {
    return makePalette(THEME_SPECS[id].spec);
}
