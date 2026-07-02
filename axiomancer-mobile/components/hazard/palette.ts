/**
 * Hazard minigame palette — extends the canonical AXM tokens with the
 * minigame's four-colour card/dice identities and board hues. Ported
 * from the design-handoff prototype kit (`hazard-kit.jsx`).
 *
 * Colour is never the only channel: every die face pairs its colour
 * with a distinct glyph shape (blade / eye / crescent / sun / cross).
 */

import type { Palette } from '@/theme/palette';
import type { HazardDieKind } from 'axiomancer-mechanics';

export const HZ = {
    acid: '#86a821',
    acidDim: '#566612',
    purple: '#8a57bd',
    purpleDeep: '#160a26',
    gold: '#c2a14e',
    goldDim: '#6e5a28',
    steel: '#6b8eb0',
    stone: '#15120f',
    stoneHi: '#221d18',
} as const;

export interface DieColorway {
    c: string;
    dark: string;
    lite: string;
    bg: string;
    label: string;
    glyph: 'blade' | 'eye' | 'crescent' | 'sun' | 'cross';
}

export const DIE: Record<HazardDieKind, DieColorway> = {
    red: { c: '#c0152a', dark: '#6e0c18', lite: '#e2455a', bg: '#1a0808', label: 'RED', glyph: 'blade' },
    blue: { c: '#5b86c4', dark: '#34527a', lite: '#8fb0dd', bg: '#0b1018', label: 'BLUE', glyph: 'eye' },
    purple: { c: '#8a57bd', dark: '#522f78', lite: '#b083e0', bg: '#160a26', label: 'PURPLE', glyph: 'crescent' },
    gold: { c: '#c2a14e', dark: '#6e5a28', lite: '#ddc372', bg: '#16130a', label: 'YELLOW', glyph: 'sun' },
    hex: { c: '#0c0c0e', dark: '#040405', lite: '#cdbede', bg: '#040405', label: 'HEX', glyph: 'cross' },
};

/** Progress-type accents (FORCE rust-red fist / ESCAPE steel-blue runner). */
export const TYPE_ACCENT = {
    force: '#c0152a',
    escape: '#5b86c4',
    passage: '#9e7d2a',
} as const;

/** Darker inks so type numbers read on parchment card stock. */
export const TYPE_INK = { force: '#8e1020', escape: '#2c4f7a' } as const;

export const CARD_PAPER = '#d8cdb4';
export const CARD_INK = '#241f17';
export const CARD_INK2 = '#5d5344';
export const CARD_EDGE = '#8d8268';

export const RARITY_UI = {
    common: { c: '#8a8273', label: 'COMMON' },
    uncommon: { c: '#5b86c4', label: 'UNCOMMON' },
    rare: { c: HZ.gold, label: 'RARE' },
} as const;

/**
 * Route-type accents (SAFE rust / RISK acid-green). The SAFE accent
 * tracks the active theme's `rust`, so this is a function of the live
 * palette — call it with `usePalette()` inside a component.
 */
export const routeAccent = (AXM: Palette) =>
    ({ safe: AXM.rust, risk: HZ.acid }) as const;
