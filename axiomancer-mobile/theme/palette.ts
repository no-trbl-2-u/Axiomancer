/**
 * Theme registry + palette factory (visual-audit 2026-06).
 *
 * Axiomancer ships a single dark-gothic identity, but the colour
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

export const THEME_SPECS: Record<ThemeId, ThemeDef> = {
    'ashen-gold': {
        id: 'ashen-gold',
        name: 'Ashen Gold',
        blurb: 'Cursed lands — richer accents on the canonical dark base.',
        spec: {
            bg: '#0b0a09',
            parchment: '#f1e7d0',
            blood: '#e01f33',
            sulfur: '#f0cb2e',
            rust: '#bd4a1e',
            heal: '#74c046',
            bone: '#9c937f',
            ash: '#46403a',
            panelBg: '#15110c',
            deepBg: '#070509',
            dockBg: '#100c08',
            silhouette: '#0c0908',
            selectFill: '#27200c',
            debuff: '#23123b',
            buff: '#37280a',
            pixelShadow: '#7a0d1c',
            pixelHighlight: '#fff5e0',
        },
    },
    'coastal-verdant': {
        id: 'coastal-verdant',
        name: 'Coastal Verdant',
        blurb: 'Salt-bitten shores — teal & coral over slate.',
        spec: {
            bg: '#080b0c',
            parchment: '#e7eedd',
            blood: '#e8643c',
            sulfur: '#46c8a0',
            rust: '#2f8f86',
            heal: '#7fd06a',
            bone: '#8a988f',
            ash: '#324440',
            panelBg: '#0c1614',
            deepBg: '#05090a',
            dockBg: '#0a1210',
            silhouette: '#081110',
            selectFill: '#0d2a24',
            debuff: '#10233b',
            buff: '#0c3326',
            pixelShadow: '#0d4a4a',
            pixelHighlight: '#e8fff5',
        },
    },
    'ember-depths': {
        id: 'ember-depths',
        name: 'Ember Depths',
        blurb: 'Molten underworld — fire-orange & ash.',
        spec: {
            bg: '#0c0706',
            parchment: '#f4e3cb',
            blood: '#f23a22',
            sulfur: '#ff9d2e',
            rust: '#c0431a',
            heal: '#9abf3a',
            bone: '#a8917e',
            ash: '#4a3a32',
            panelBg: '#180e09',
            deepBg: '#0a0503',
            dockBg: '#140b06',
            silhouette: '#0e0805',
            selectFill: '#33180a',
            debuff: '#2e1410',
            buff: '#3a2208',
            pixelShadow: '#8a1c0d',
            pixelHighlight: '#fff0d8',
        },
    },
    'frost-marrow': {
        id: 'frost-marrow',
        name: 'Frost Marrow',
        blurb: 'Frozen reaches — ice-cyan over deep blue.',
        spec: {
            bg: '#080a0d',
            parchment: '#e6edf4',
            blood: '#d8455f',
            sulfur: '#5ec5e8',
            rust: '#5a7fa8',
            heal: '#6fcfb0',
            bone: '#8893a0',
            ash: '#2f3b48',
            panelBg: '#0c131c',
            deepBg: '#05080c',
            dockBg: '#0a1018',
            silhouette: '#080e15',
            selectFill: '#0f2636',
            debuff: '#161a3b',
            buff: '#0c2433',
            pixelShadow: '#1c4a6a',
            pixelHighlight: '#eaffff',
        },
    },
    'plague-bloom': {
        id: 'plague-bloom',
        name: 'Plague Bloom',
        blurb: 'Rotting fen — toxic lime & violet.',
        spec: {
            bg: '#0a0a08',
            parchment: '#e9eccf',
            blood: '#b81fae',
            sulfur: '#a6e22e',
            rust: '#6a8a1a',
            heal: '#5ad0a0',
            bone: '#919a7e',
            ash: '#3e4233',
            panelBg: '#11140c',
            deepBg: '#07090a',
            dockBg: '#0d1108',
            silhouette: '#0a0e08',
            selectFill: '#1f2a0a',
            debuff: '#2a0e3b',
            buff: '#25330a',
            pixelShadow: '#5a1c6a',
            pixelHighlight: '#f0ffd8',
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
