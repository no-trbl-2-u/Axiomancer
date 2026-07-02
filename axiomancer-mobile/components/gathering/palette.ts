/**
 * Gathering minigame palette — extends the canonical AXM tokens with
 * the gleaning's four material-family identities and the site hues
 * (living green against rot and ember). Colour is never the only
 * channel: every family pairs its colour with a distinct glyph shape
 * (sprig / drop / shard / knuckle), and wrath pairs red with the
 * opening eye.
 */

import type { Palette } from '@/theme/palette';
import type { GatherFamily } from 'axiomancer-mechanics';

export const GL = {
    moss: '#5a8a3a',
    mossDeep: '#22360f',
    rot: '#8a57bd',
    soil: '#14110c',
    soilHi: '#1f1a13',
} as const;

export interface FamilyColorway {
    c: string;
    dark: string;
    lite: string;
    bg: string;
    label: string;
    glyph: 'sprig' | 'drop' | 'shard' | 'knuckle';
}

export const FAMILY: Record<GatherFamily, FamilyColorway> = {
    bloom: { c: '#5a8a3a', dark: '#33531f', lite: '#8ab86a', bg: '#0c1407', label: 'BLOOM', glyph: 'sprig' },
    resin: { c: '#c98a3b', dark: '#75501f', lite: '#e0ad67', bg: '#160e05', label: 'RESIN', glyph: 'drop' },
    vein: { c: '#5b86c4', dark: '#34527a', lite: '#8fb0dd', bg: '#0b1018', label: 'VEIN', glyph: 'shard' },
    bone: { c: '#b3a78c', dark: '#6a6151', lite: '#d6cbb1', bg: '#121008', label: 'BONE', glyph: 'knuckle' },
};

/**
 * Wrath is the site's anger (the theme's `blood`); grace its favour (the
 * theme's `sulfur`). Consumers read these straight off the live palette
 * (`AXM.blood` / `AXM.sulfur`) via `usePalette()` so they track the
 * active theme.
 */

/** Plot-card paper stock (slightly mossier than the hazard parchment). */
export const PLOT_PAPER = '#d3cfae';
export const PLOT_INK = '#232114';
export const CARD_INK = '#241f17';
export const CARD_INK2 = '#5d5344';
export const CARD_EDGE = '#878a62';

/** Trait tag tones. */
export const TRAIT_UI = {
    gift: { c: '#5a8a3a', label: 'GIFT' },
    lure: { c: '#c0152a', label: 'LURE' },
    breath: { c: '#5b86c4', label: 'BREATH' },
    tangle: { c: '#8a57bd', label: 'TANGLE' },
} as const;

/**
 * Approach accents (GLEAN bone / STRIP acid-green). The GLEAN accent
 * tracks the active theme's `bone`, so this is a function of the live
 * palette — call it with `usePalette()` inside a component.
 */
export const approachAccent = (AXM: Palette) =>
    ({ glean: AXM.bone, strip: '#86a821' }) as const;
