/**
 * Hermetic engine test — 2026-09-20 save migration (v22 → v23): retire the
 * STARTING-LOADOUT SEED.
 *
 * Reproduces the two live symptoms the seed caused and pins both closed:
 *
 *   1. `createNewGameState()` used to write one `combat-loadout-card:` flag
 *      per `STARTING_CARD_IDS` entry. `buildCombatDeck` deals a loadout
 *      INSTEAD of `knownCards` whenever one exists, so the 18-card starter
 *      bundle the client writes to `knownCards` was never dealt — the deck
 *      was the 4-card seed plus rewards, which sits at `MIN_COMBAT_DECK_SIZE`
 *      after 8 rewards and refuses every rest-node CUT (`deck-at-floor`).
 *   2. A seeded starter the chosen bundle did NOT contain was still dealt,
 *      and `executeCard`'s ownership guard reads `knownCards` (never the
 *      loadout), so playing it threw `Card 'thin-hymn' is not known.`
 *
 * After v23: a fresh save carries no loadout flags, an old save has them
 * stripped, and the deck dealt is exactly `knownCards` + `combatRewardCards`.
 */

import { describe, it, expect } from 'vitest';
import { migrate } from '../game.migrate';
import { createNewGameState, GAME_STATE_VERSION } from '../game.reducer';
import {
    COMBAT_LOADOUT_FLAG_PREFIX, addToLoadout, getCombatLoadout,
} from '../../Combat/combat.loadout';
import { buildCombatDeck } from '../../Combat/combat.deck';
import { MIN_COMBAT_DECK_SIZE, removeCardFromCombatDeck } from '../../Cards/card.removal';
import { executeCard } from '../../Cards/card.engine';
import { getCardById } from '../../Cards/cards.library';
import { buildPresetDeck } from '../../Combat/combat.starter-deck-presets';
import { GraveLarva } from '../../Enemy/enemy.library';
import type { CombatState } from '../../Combat/types';

// Phase 104 (2026-09-20) repurposed `STARTING_CARD_IDS` for the grey-office
// fresh-run seed, so this migration fixture pins the EXACT pre-v23 seed by
// value instead of tracking the live (now differently-shaped) constant.
const LEGACY_V22_SEED_IDS: readonly string[] = [
    'spoiled-poultice', 'chilblain-watch', 'first-spadeful', 'thin-hymn',
];

/** The pre-v23 seed, rebuilt exactly as `createNewGameState` used to write it. */
function legacySeedFlags(): string[] {
    let flags: string[] = [];
    for (const id of LEGACY_V22_SEED_IDS) flags = addToLoadout(flags, id);
    return flags;
}

/** A v22 save: a fresh state stamped back to v22 with the legacy seed restored. */
function v22Save(): Record<string, unknown> {
    const fresh = createNewGameState();
    return {
        ...fresh,
        flags: [...fresh.flags, ...legacySeedFlags()],
        version: 22,
    } as unknown as Record<string, unknown>;
}

const isLoadoutFlag = (f: string): boolean => f.startsWith(COMBAT_LOADOUT_FLAG_PREFIX);

describe('createNewGameState — no starting-loadout seed (v23)', () => {
    it('a fresh save carries no combat-loadout-card flags', () => {
        const fresh = createNewGameState();
        expect(fresh.version).toBe(GAME_STATE_VERSION);
        expect(fresh.flags.some(isLoadoutFlag)).toBe(false);
        expect(getCombatLoadout(fresh.flags)).toEqual([]);
    });

    it('the dealt deck is exactly the starter bundle written to knownCards', () => {
        const fresh = createNewGameState();
        const bundle = buildPresetDeck('threadbare');
        expect(bundle.length).toBeGreaterThan(MIN_COMBAT_DECK_SIZE);
        const player = { ...fresh.player, knownCards: bundle, combatRewardCards: [] };
        expect(buildCombatDeck(player, fresh.flags)).toEqual(bundle);
    });

    it('a rest-node CUT is legal on a fresh bundle (the floor is no longer hit)', () => {
        const fresh = createNewGameState();
        const player = { ...fresh.player, knownCards: buildPresetDeck('threadbare'), combatRewardCards: [] };
        const cut = removeCardFromCombatDeck(player, 'spoiled-poultice', fresh.flags);
        expect(cut.ok).toBe(true);
    });
});

describe('migrate v22 → v23 — strip the starting-loadout seed', () => {
    it('the v22 → v23 hop is on the supported chain', () => {
        expect(GAME_STATE_VERSION).toBeGreaterThanOrEqual(23);
        expect(migrate(v22Save(), 22, 23).version).toBe(23);
    });

    it('drops every combat-loadout-card flag and keeps every other flag', () => {
        const raw = v22Save();
        raw.flags = [...(raw.flags as string[]), 'some-story-flag', 'starter-bundle-chosen'];
        const migrated = migrate(raw, 22, 23);
        expect(migrated.flags.some(isLoadoutFlag)).toBe(false);
        expect(migrated.flags).toContain('some-story-flag');
        expect(migrated.flags).toContain('starter-bundle-chosen');
    });

    it('is idempotent — a save with no loadout flags only gets its version stamped', () => {
        const raw = v22Save();
        raw.flags = ['some-story-flag'];
        const migrated = migrate(raw, 22, 23);
        expect(migrated.flags).toEqual(['some-story-flag']);
        expect(migrated.version).toBe(23);
    });

    it('chains a v21 save straight to v23 in one call', () => {
        const raw = v22Save();
        raw.version = 21;
        const migrated = migrate(raw, 21, 23);
        expect(migrated.version).toBe(23);
        expect(migrated.flags.some(isLoadoutFlag)).toBe(false);
    });

    it('REPRO: the seed dealt a starter the bundle lacked and executeCard threw; v23 does not', () => {
        // A themed bundle that does NOT contain the seeded `thin-hymn`.
        const bundle = buildPresetDeck('pilgrim').filter(id => id !== 'thin-hymn');
        expect(LEGACY_V22_SEED_IDS).toContain('thin-hymn');
        const raw = v22Save();
        const before = migrate(raw, 22, 22);
        const player = { ...before.player, knownCards: bundle, combatRewardCards: [] };

        // Before: the loadout shadows the bundle and deals thin-hymn …
        const legacyDeck = buildCombatDeck(player, before.flags);
        expect(legacyDeck).toContain('thin-hymn');
        // … which the ownership guard then rejects mid-combat.
        const shim: CombatState = {
            active: true, phase: 'resolving', round: 1, friendshipCounter: 0,
            player, enemy: { ...GraveLarva }, playerChoice: {}, enemyChoice: {},
        };
        expect(() => executeCard(shim, 'thin-hymn', getCardById)).toThrow(/not known/);

        // After: the deck is the bundle, and thin-hymn is never dealt.
        const after = migrate(raw, 22, 23);
        const dealt = buildCombatDeck(player, after.flags);
        expect(dealt).toEqual(bundle);
        expect(dealt).not.toContain('thin-hymn');
    });
});
