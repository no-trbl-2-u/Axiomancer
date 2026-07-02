/**
 * Theme registry + palette factory (visual-audit 2026-06).
 *
 * Isolates theme/palette.ts's own contract — the runtime store
 * (runtime.test.tsx) only uses paletteFor/DEFAULT_THEME_ID as fixtures
 * and never exercises the derivation/guard/resolution logic here:
 *   - makePalette's 14 derived translucent tokens at their documented
 *     alphas, plus the fixed shadow and the base-spec spread.
 *   - paletteFor resolving every THEME_ORDER id to a complete Palette.
 *   - isThemeId accept/reject across registered ids, unknown strings,
 *     and non-string values.
 *   - resolveActiveThemeId's global-override → localStorage → default
 *     priority, with try/catch resilience when storage is unavailable.
 *   - registry-shape guards (THEME_SPECS keys === THEME_ORDER; every
 *     spec carries the full ThemeSpec hue set; every ThemeDef.id is
 *     self-consistent).
 */

import { afterEach, describe, expect, it } from '@jest/globals';

import {
    DEFAULT_THEME_ID,
    isThemeId,
    makePalette,
    paletteFor,
    resolveActiveThemeId,
    THEME_ORDER,
    THEME_SPECS,
    type Palette,
    type ThemeSpec,
} from '../palette';

const SPEC_KEYS: (keyof ThemeSpec)[] = [
    'bg',
    'parchment',
    'blood',
    'sulfur',
    'rust',
    'heal',
    'bone',
    'ash',
    'panelBg',
    'deepBg',
    'dockBg',
    'silhouette',
    'selectFill',
    'debuff',
    'buff',
    'pixelShadow',
    'pixelHighlight',
];

const DERIVED_KEYS: (keyof Palette)[] = [
    'backdrop',
    'overlay',
    'divider',
    'parchmentMed',
    'parchmentDim',
    'sulfurSubtle',
    'sulfurMed',
    'healSubtle',
    'bloodSubtle',
    'bloodMed',
    'bloodStrong',
    'rustSubtle',
    'shadow',
    'nodeBg',
];

/** A spec with a 6-digit hue per channel-easy-to-assert value. */
const FIXTURE_SPEC: ThemeSpec = {
    bg: '#102030',
    parchment: '#a0b0c0',
    blood: '#ff0011',
    sulfur: '#ffee00',
    rust: '#806040',
    heal: '#00ff80',
    bone: '#fffff0',
    ash: '#404040',
    panelBg: '#080808',
    deepBg: '#020406',
    dockBg: '#111111',
    silhouette: '#000000',
    selectFill: '#222244',
    debuff: '#aa0044',
    buff: '#0088aa',
    pixelShadow: '#010101',
    pixelHighlight: '#fefefe',
};

const ORIGINAL_THEME_GLOBAL = (globalThis as { __AXM_THEME__?: unknown }).__AXM_THEME__;

afterEach(() => {
    (globalThis as { __AXM_THEME__?: unknown }).__AXM_THEME__ = ORIGINAL_THEME_GLOBAL;
    try {
        if (typeof localStorage !== 'undefined') localStorage.clear();
    } catch {
        /* ignore */
    }
});

describe('makePalette', () => {
    it('spreads the base spec through unchanged', () => {
        const p = makePalette(FIXTURE_SPEC);
        for (const key of SPEC_KEYS) {
            expect(p[key]).toBe(FIXTURE_SPEC[key]);
        }
    });

    it('derives each translucent token at its documented alpha', () => {
        const p = makePalette(FIXTURE_SPEC);
        // #102030 -> 16,32,48 · #a0b0c0 -> 160,176,192 · #ff0011 -> 255,0,17
        // #ffee00 -> 255,238,0 · #00ff80 -> 0,255,128 · #806040 -> 128,96,64
        expect(p.backdrop).toBe('rgba(2, 4, 6, 0.4)'); // deepBg #020406
        expect(p.overlay).toBe('rgba(2, 4, 6, 0.92)');
        expect(p.divider).toBe('rgba(160, 176, 192, 0.12)'); // parchment
        expect(p.parchmentMed).toBe('rgba(160, 176, 192, 0.35)');
        expect(p.parchmentDim).toBe('rgba(160, 176, 192, 0.65)');
        expect(p.sulfurSubtle).toBe('rgba(255, 238, 0, 0.1)');
        expect(p.sulfurMed).toBe('rgba(255, 238, 0, 0.3)');
        expect(p.healSubtle).toBe('rgba(0, 255, 128, 0.1)');
        expect(p.bloodSubtle).toBe('rgba(255, 0, 17, 0.1)');
        expect(p.bloodMed).toBe('rgba(255, 0, 17, 0.3)');
        expect(p.bloodStrong).toBe('rgba(255, 0, 17, 0.55)');
        expect(p.rustSubtle).toBe('rgba(128, 96, 64, 0.1)');
        expect(p.nodeBg).toBe('rgba(16, 32, 48, 0.9)'); // bg
    });

    it('pins shadow to a fixed opaque-black wash independent of the spec', () => {
        expect(makePalette(FIXTURE_SPEC).shadow).toBe('rgba(0, 0, 0, 0.6)');
    });

    it('expands 3-digit shorthand hex through hexToRgb', () => {
        // #abc -> #aabbcc -> 170,187,204
        const p = makePalette({ ...FIXTURE_SPEC, parchment: '#abc' });
        expect(p.divider).toBe('rgba(170, 187, 204, 0.12)');
    });
});

describe('paletteFor', () => {
    it('resolves every THEME_ORDER id to a structurally complete Palette', () => {
        for (const id of THEME_ORDER) {
            const p = paletteFor(id);
            for (const key of [...SPEC_KEYS, ...DERIVED_KEYS]) {
                expect(typeof p[key]).toBe('string');
                expect(p[key].length).toBeGreaterThan(0);
            }
            // Derived tokens always track the theme's own base hues.
            expect(p).toEqual(makePalette(THEME_SPECS[id].spec));
        }
    });

    it('resolves the default theme', () => {
        expect(paletteFor(DEFAULT_THEME_ID)).toEqual(
            makePalette(THEME_SPECS[DEFAULT_THEME_ID].spec),
        );
    });
});

describe('isThemeId', () => {
    it('accepts every registered theme id', () => {
        for (const id of THEME_ORDER) {
            expect(isThemeId(id)).toBe(true);
        }
    });

    it('rejects unknown strings and non-string values', () => {
        expect(isThemeId('not-a-theme')).toBe(false);
        expect(isThemeId('')).toBe(false);
        expect(isThemeId(undefined)).toBe(false);
        expect(isThemeId(null)).toBe(false);
        expect(isThemeId(42)).toBe(false);
        expect(isThemeId({})).toBe(false);
    });
});

describe('resolveActiveThemeId', () => {
    const otherId = THEME_ORDER.find((id) => id !== DEFAULT_THEME_ID)!;

    it('honours a valid __AXM_THEME__ global override above all else', () => {
        (globalThis as { __AXM_THEME__?: unknown }).__AXM_THEME__ = otherId;
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('@axiomancer/theme:v1', DEFAULT_THEME_ID);
            }
        } catch {
            /* ignore */
        }
        expect(resolveActiveThemeId()).toBe(otherId);
    });

    it('ignores an invalid global override and falls through', () => {
        (globalThis as { __AXM_THEME__?: unknown }).__AXM_THEME__ = 'bogus-theme';
        expect(resolveActiveThemeId()).toBe(DEFAULT_THEME_ID);
    });

    it('falls back to a persisted localStorage choice when no global override', () => {
        (globalThis as { __AXM_THEME__?: unknown }).__AXM_THEME__ = undefined;
        if (typeof localStorage === 'undefined') return; // native: no storage path
        localStorage.setItem('@axiomancer/theme:v1', otherId);
        expect(resolveActiveThemeId()).toBe(otherId);
    });

    it('defaults when neither a global override nor a valid stored id is present', () => {
        (globalThis as { __AXM_THEME__?: unknown }).__AXM_THEME__ = undefined;
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('@axiomancer/theme:v1', 'bogus-theme');
            }
        } catch {
            /* ignore */
        }
        expect(resolveActiveThemeId()).toBe(DEFAULT_THEME_ID);
    });
});

describe('registry shape', () => {
    it('THEME_SPECS keys match THEME_ORDER exactly', () => {
        expect([...Object.keys(THEME_SPECS)].sort()).toEqual([...THEME_ORDER].sort());
    });

    it('every ThemeDef carries a self-consistent id, a name, a blurb, and the full hue set', () => {
        for (const id of THEME_ORDER) {
            const def = THEME_SPECS[id];
            expect(def.id).toBe(id);
            expect(typeof def.name).toBe('string');
            expect(def.name.length).toBeGreaterThan(0);
            expect(typeof def.blurb).toBe('string');
            expect(def.blurb.length).toBeGreaterThan(0);
            for (const key of SPEC_KEYS) {
                expect(typeof def.spec[key]).toBe('string');
                expect(def.spec[key]).toMatch(/^#[0-9a-fA-F]{3,6}$/);
            }
        }
    });

    it('DEFAULT_THEME_ID is a registered theme', () => {
        expect(isThemeId(DEFAULT_THEME_ID)).toBe(true);
    });
});
