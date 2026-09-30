/**
 * Fixture EFFECTS — synthetic effect definitions for the engine channels whose
 * library carriers were deleted by the keyword audit (2026-09-27, after the
 * card purge).
 *
 * `buff_thorns`, `debuff_backfire`, `debuff_kindling_ember` and
 * `debuff_nettle_sting` left `buffs.library.json` / `debuffs.library.json`
 * with the cards that applied them. The engine CHANNELS they exercised stay
 * implemented and under test: `reflectDamage` (the THORNS reflect),
 * `backfirePerRung` (the BACKFIRE drip), and the ROUND-CLOCK DoT tick phases
 * (`tickPhase: 'start'` / `'end'` — every live library DoT is event-clocked or
 * no-calendar). These fixtures carry the deleted definitions' payloads under
 * `fixture_*` ids, so no retired id is ever resurrected. R5 added the curse,
 * roll-up and armor fixtures when the items reset deleted the last effects carrying
 * a flat `rollModifier` or a `defenseModifier` (R7a deletes those channels).
 *
 * Tests call {@link registerFixtureEffects} at module scope; it inserts the
 * fixtures into the live effect registry (`effectsLibrary.registry`, which
 * `lookupEffect` reads). Vitest isolates each test file, so a registration
 * never leaks into another file.
 *
 * Excluded from the published build via `tsconfig.json` `exclude`
 * (`src/test-utils`); must not be imported from production code.
 */

import { effectsLibrary } from '../Effects/effects.library';
import type { Effect } from '../Effects/types';

/** The old `buff_thorns`: 1 reflected VITAE per stack when the bearer is hit. */
export const FIXTURE_THORNS: Effect = {
    id: 'fixture_thorns',
    name: 'Thorns',
    description: 'Test fixture: reflects 1 per stack when the bearer is hit.',
    type: 'buff',
    category: 'defense',
    duration: 2,
    stacking: 'intensity',
    payload: { reflectDamage: 1 },
    tier: 1,
    addedIn: '2026-07-08',
    tags: ['fixture'],
} as Effect;

/** The old `debuff_backfire`: 1 VITAE per stack per rung the bearer's telegraph loses. */
export const FIXTURE_BACKFIRE: Effect = {
    id: 'fixture_backfire',
    name: 'Backfire',
    description: 'Test fixture: bills the bearer per denied rung.',
    type: 'debuff',
    category: 'control',
    duration: 2,
    stacking: 'intensity',
    resistedBy: 'mind',
    resistDR: 12,
    payload: { backfirePerRung: 1 },
    tier: 2,
    addedIn: '2026-07-08',
    tags: ['fixture'],
} as Effect;

/** The old `debuff_kindling_ember`: a START-phase round-clock DoT, 1 per stack. */
export const FIXTURE_EMBER: Effect = {
    id: 'fixture_ember',
    name: 'Kindling Ember',
    description: 'Test fixture: a start-phase round-clock DoT.',
    type: 'debuff',
    category: 'damage',
    duration: 3,
    stacking: 'intensity',
    resistedBy: 'mind',
    resistDR: 10,
    payload: { damageOverTime: { damagePerRound: 1, damageType: 'mind', tickPhase: 'start' } },
    tier: 1,
    addedIn: '2026-07-08',
    tags: ['fixture'],
} as Effect;

/** The old `debuff_nettle_sting`: an END-phase round-clock DoT, 2 per stack, no decay. */
export const FIXTURE_NETTLE: Effect = {
    id: 'fixture_nettle',
    name: 'Nettle Sting',
    description: 'Test fixture: an end-phase round-clock DoT.',
    type: 'debuff',
    category: 'damage',
    duration: 2,
    stacking: 'intensity',
    resistedBy: 'body',
    resistDR: 10,
    payload: {
        damageOverTime: { damagePerRound: 2, damageType: 'body', tickPhase: 'end' },
        dotModifiers: { decaysPerTick: false },
    },
    tier: 1,
    addedIn: '2026-07-08',
    tags: ['fixture'],
} as Effect;

/** The old `debuff_curse` (deleted in R5, no applier): a flat -2 roll modifier. */
export const FIXTURE_CURSE: Effect = {
    id: 'fixture_curse',
    name: 'Curse',
    description: 'Test fixture: a flat negative roll modifier.',
    type: 'debuff',
    category: 'stat',
    duration: 5,
    stacking: 'none',
    payload: { rollModifier: -2 },
    tier: 2,
    tags: ['fixture'],
} as Effect;

/** The old `buff_status_chance_up` (deleted in R5 with its consumable): a flat +3 roll modifier. */
export const FIXTURE_ROLL_UP: Effect = {
    id: 'fixture_roll_up',
    name: 'Roll Up',
    description: 'Test fixture: a flat positive roll modifier on a buff.',
    type: 'buff',
    category: 'advantage',
    duration: 4,
    stacking: 'none',
    payload: { rollModifier: 3 },
    tier: 2,
    tags: ['fixture'],
} as Effect;

/** The old `buff_damage_reduction` (deleted in R5 with Iron Skin): 5 flat armor. */
export const FIXTURE_ARMOR: Effect = {
    id: 'fixture_armor',
    name: 'Armor',
    description: 'Test fixture: soaks 5 off each incoming hit.',
    type: 'buff',
    category: 'defense',
    duration: 3,
    stacking: 'none',
    payload: { defenseModifier: 5 },
    tier: 2,
    tags: ['fixture'],
} as Effect;

export const FIXTURE_EFFECTS: readonly Effect[] = [
    FIXTURE_THORNS, FIXTURE_BACKFIRE, FIXTURE_EMBER, FIXTURE_NETTLE,
    FIXTURE_CURSE, FIXTURE_ROLL_UP, FIXTURE_ARMOR,
];

/** Registers every fixture effect into the live registry. Idempotent. */
export function registerFixtureEffects(): void {
    for (const effect of FIXTURE_EFFECTS) effectsLibrary.registry.set(effect.id, effect);
}
