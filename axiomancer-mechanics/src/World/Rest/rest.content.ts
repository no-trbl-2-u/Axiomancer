/**
 * Rest encounter ("The Night Watch") — authored content & tuning.
 *
 * Postures, dreams, and the dial panel. Dreams are the rest
 * encounter's voice — small, sad, warm things in the Boy's register.
 */

import type { RestDreamDef, RestPosture, RestPostureDef, RestWatchKind } from './rest.types';

// ---------------------------------------------------------------------------
// Tuning
// ---------------------------------------------------------------------------

export const REST_TUNING = Object.freeze({
    /** Watches per night. */
    watchesPerNight: 3,
    /** Warmth scale. */
    warmthStart: 2,
    warmthMax: 4,
    /** Firewood in hand at dusk. */
    woodStart: 2,
    /** Heal fraction added per point of dawn warmth. */
    healPerWarmth: 0.04,
    /** Heal fraction added per point of comfort. */
    healPerComfort: 0.05,
    /** Dawn warmth at or above this cleanses lingering effects. */
    cleanseWarmth: 3,
    /** Tier cuts on the final heal fraction. */
    restoredAt: 0.55,
    restedAt: 0.35,
});

export const REST_WATCHES_PER_NIGHT = REST_TUNING.watchesPerNight;
export const REST_WARMTH_MAX = REST_TUNING.warmthMax;

// ---------------------------------------------------------------------------
// Postures
// ---------------------------------------------------------------------------

export const REST_POSTURES: readonly RestPostureDef[] = Object.freeze([
    {
        key: 'deep' as RestPosture,
        name: 'SLEEP DEEP',
        desc: 'The richest heal. The dark works unwatched.',
        flavor: 'Boots off. Trust the world for one night.',
        baseHeal: 0.40,
    },
    {
        key: 'doze' as RestPosture,
        name: 'DOZE LIGHT',
        desc: 'A middling heal. Stirs in the dark are a coin toss.',
        flavor: 'One ear above the blanket. The old fisherman\'s sleep.',
        baseHeal: 0.30,
    },
    {
        key: 'watch' as RestPosture,
        name: 'KEEP WATCH',
        desc: 'The thinnest heal — but nothing reaches you, and watchful eyes find things.',
        flavor: 'Knife across the knees, back to the fire.',
        baseHeal: 0.20,
    },
] as const);

const POSTURES_BY_KEY = new Map(REST_POSTURES.map(p => [p.key, p]));

export function getRestPostureDef(key: RestPosture): RestPostureDef {
    const def = POSTURES_BY_KEY.get(key);
    if (!def) throw new Error(`Rest: unknown posture '${key}'.`);
    return def;
}

// ---------------------------------------------------------------------------
// The night's bag (watch kinds drawn without replacement)
// ---------------------------------------------------------------------------

/**
 * The bag the night is dealt from: 3 of its 9 slips, shuffled. Embers
 * and dreams are common; stirs and still hours are rarer.
 */
export const REST_WATCH_BAG: readonly RestWatchKind[] = Object.freeze([
    'embers', 'embers', 'embers',
    'dream', 'dream', 'dream',
    'stir', 'stir',
    'still',
] as const);

// ---------------------------------------------------------------------------
// Dreams
// ---------------------------------------------------------------------------

export const REST_DREAMS: readonly RestDreamDef[] = Object.freeze([
    {
        id: 'dream-mother',
        title: 'A DREAM OF THE MOTHER',
        lines: Object.freeze([
            'A woman rows across a lake he has never seen, laughing at the ferryman\'s advice.',
            'He cannot see her face. He has never been able to see her face.',
            'She ships the oars and lets the boat drift, and the drifting is the whole dream.',
        ]),
        keepsake: 'An oar\'s rhythm, remembered wrong',
    },
    {
        id: 'dream-girl',
        title: 'A DREAM OF THE GIRL',
        lines: Object.freeze([
            'She is standing on a dock in a village he has not reached yet, looking back across the water.',
            'In the dream she is not waiting for him. She is just looking. Somehow that is better.',
        ]),
        keepsake: 'A dock, a figure, a held breath',
    },
    {
        id: 'dream-gates',
        title: 'A DREAM OF GATES',
        lines: Object.freeze([
            'Doors as tall as weather, shut for a hundred years, and a sound behind them like a city breathing.',
            'In the dream he knows the word that opens them. Waking takes it back.',
        ]),
        keepsake: 'A word, lost at the edge of waking',
    },
] as const);

const DREAMS_BY_ID = new Map(REST_DREAMS.map(d => [d.id, d]));

export function getRestDreamDef(id: string): RestDreamDef {
    const def = DREAMS_BY_ID.get(id);
    if (!def) throw new Error(`Rest: unknown dream '${id}'.`);
    return def;
}
