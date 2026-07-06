/**
 * Player portrait gallery — temp art pass (2026-07-06 drop).
 *
 * 15 alpha-matted busts/figures. The pilgrim's chosen portrait is stored as a
 * `portrait:<id>` entry in `GameState.flags` (generic string flags, persisted
 * with the save); absent → the hooded Master Thief, the closest match to the
 * old procedural "hooded pilgrim" SVG bust.
 */

export interface PlayerPortraitEntry {
    id: string;
    label: string;
    source: number;
}

export const PLAYER_PORTRAITS: PlayerPortraitEntry[] = [
    { id: 'master-thief', label: 'The Hooded Pilgrim', source: require('./master-thief.webp') },
    { id: 'bard', label: 'The Bard', source: require('./bard.webp') },
    { id: 'altair-man', label: 'The Knight-Errant', source: require('./altair-man-d.webp') },
    { id: 'elf-fighter', label: 'The Elf Fighter', source: require('./elf-fighter-d.webp') },
    { id: 'elf-mage-dark', label: 'The Dark Magess', source: require('./elf-mage-dark.webp') },
    { id: 'kunoichi', label: 'The Kunoichi', source: require('./kunoichi-c.webp') },
    { id: 'dwarf-lordess', label: 'The Dwarf Lordess', source: require('./dwarf-lordess.webp') },
    { id: 'dwarf-princess', label: 'The Dwarf Princess', source: require('./dwarf-princess.webp') },
    { id: 'gignos-cleric', label: 'The Cleric', source: require('./gignos-cleric-a.webp') },
    { id: 'gignos-male', label: 'The Wanderer', source: require('./gignos-male.webp') },
    { id: 'biwa-houshi', label: 'The Biwa Priest', source: require('./biwa-houshi-1.webp') },
    { id: 'paladin-cursed', label: 'The Cursed Paladin', source: require('./paladin-cursed-b.webp') },
    { id: 'air-elemental-lord', label: 'The Air Elemental Lord', source: require('./air-elemental-lord.webp') },
    { id: 'haniel', label: 'The Haniel', source: require('./haniel-e.webp') },
    { id: 'fairy', label: 'The Fairy', source: require('./fairy.webp') },
];

export const PORTRAIT_FLAG_PREFIX = 'portrait:';

/** Portrait id currently chosen in the flags list, or null. */
export function portraitIdFromFlags(flags: readonly string[] | undefined): string | null {
    const flag = flags?.find((f) => f.startsWith(PORTRAIT_FLAG_PREFIX));
    return flag ? flag.slice(PORTRAIT_FLAG_PREFIX.length) : null;
}

export function getPlayerPortrait(id: string | null | undefined): PlayerPortraitEntry {
    return PLAYER_PORTRAITS.find((p) => p.id === id) ?? PLAYER_PORTRAITS[0];
}

/** The entry after `id` in gallery order (wraps) — the tap-to-cycle step. */
export function nextPlayerPortrait(id: string | null | undefined): PlayerPortraitEntry {
    const i = PLAYER_PORTRAITS.findIndex((p) => p.id === id);
    return PLAYER_PORTRAITS[(i + 1) % PLAYER_PORTRAITS.length];
}
