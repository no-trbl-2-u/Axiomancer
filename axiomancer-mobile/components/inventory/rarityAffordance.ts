/**
 * Rarity affordance helper (Phase 135).
 *
 * Maps an item's `rarity` to the visual treatment the inventory /
 * reward surfaces paint, plus the accessible phrase that announces the
 * affix / fixed-modifier count. Driven purely by `item.rarity` — never
 * by parsing `item.name` or counting `prefixName` / `suffixName` at
 * render time (Phase 135 decision).
 *
 * Mechanics truth (`axiomancer-mechanics@0.22.0`):
 *   - uncommon → exactly one procedural affix → green shine
 *   - rare     → two procedural affixes        → blue shine
 *   - unique   → three set-in-stone modifiers   → red outline
 *   - common   → plain, no shine / outline
 *
 * Colours come from a small derived rarity palette rather than scattered
 * hex literals: green reuses the theme `heal` hue, red reuses `blood`,
 * and blue is a fixed rarity-blue (the dark-gothic palette ships no
 * blue accent, so it lives here as the single source of truth). All are
 * alpha-derived for the glow wash so they track the base hue.
 */

import type { Palette } from '@/theme/palette';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'unique';

export type RarityVisualKind =
    | 'plain'
    | 'green-shine'
    | 'blue-shine'
    | 'red-outline';

export interface RarityAffordance {
    /** The visual treatment kind the surfaces paint. */
    kind: RarityVisualKind;
    /**
     * Accessible phrase appended to a card / tile label, e.g.
     * "uncommon, one affix". `null` for common (no extra wording).
     */
    label: string | null;
    /** True when the treatment is a soft shine/glow (uncommon / rare). */
    isShine: boolean;
    /** True when the treatment is a hard outline (unique). */
    isOutline: boolean;
}

/** Fixed rarity-blue — the dark-gothic palette has no blue accent. */
export const RARITY_BLUE = '#3b7fd4';

const AFFORDANCE: Record<ItemRarity, RarityAffordance> = {
    common: { kind: 'plain', label: null, isShine: false, isOutline: false },
    uncommon: {
        kind: 'green-shine',
        label: 'uncommon, one affix',
        isShine: true,
        isOutline: false,
    },
    rare: {
        kind: 'blue-shine',
        label: 'rare, two affixes',
        isShine: true,
        isOutline: false,
    },
    unique: {
        kind: 'red-outline',
        label: 'unique, three fixed modifiers',
        isShine: false,
        isOutline: true,
    },
};

/**
 * Resolve the rarity affordance for an item rarity. `null` / undefined
 * (non-equipment, missing field) collapses to the plain `common`
 * treatment so callers never have to branch on absence.
 */
export function rarityAffordance(rarity: ItemRarity | null | undefined): RarityAffordance {
    if (rarity == null) return AFFORDANCE.common;
    return AFFORDANCE[rarity] ?? AFFORDANCE.common;
}

export interface RarityColors {
    /** Solid accent for the border / rail. */
    accent: string;
    /** Translucent wash used for the shine glow. */
    glow: string;
}

function withAlpha(hex: string, alpha: number): string {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Resolve the accent + glow colours for a rarity against the active
 * palette. Green reuses `heal`, red reuses `blood`, blue is the fixed
 * `RARITY_BLUE`. Common falls back to the muted `bone` rail colour.
 */
export function rarityColors(rarity: ItemRarity | null | undefined, AXM: Palette): RarityColors {
    switch (rarity) {
        case 'uncommon':
            return { accent: AXM.heal, glow: withAlpha(AXM.heal, 0.55) };
        case 'rare':
            return { accent: RARITY_BLUE, glow: withAlpha(RARITY_BLUE, 0.55) };
        case 'unique':
            return { accent: AXM.blood, glow: withAlpha(AXM.blood, 0.5) };
        default:
            return { accent: AXM.bone, glow: withAlpha(AXM.bone, 0.3) };
    }
}
