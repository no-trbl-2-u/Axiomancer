/**
 * Hermetic engine test — the v25 → v26 hop: alignment and GRACE removed.
 *
 * T6 (D39 in `plan/2026-09-25-refactor-strategy.decisions.md`) deleted the
 * philosophical-alignment grid, its per-tree observer cache and the GRACE
 * meter (`moralMeter`), and renamed a card's `philosophicalAspect` to
 * `color`. A v25 save still carries all of them. This hop strips the three
 * state fields and renames the card field wherever a card rides in the save
 * (a staged encounter's enemies carry their cards whole). Everything else
 * passes through untouched.
 */

import { describe, it, expect } from 'vitest';
import { migrate } from '../game.migrate';
import { createNewGameState, GAME_STATE_VERSION } from '../game.reducer';
import { cardLibrary } from '../../Cards/cards.library';

/** Re-applies the v25 card field name to a current card. */
function legacyCard(card: (typeof cardLibrary)[number]): Record<string, unknown> {
    const { color, ...rest } = card;
    return { ...rest, philosophicalAspect: color };
}

/** A v25 save: alignment, GRACE, an observer cache, and a staged fight. */
function v25Save(): Record<string, unknown> {
    const fresh = createNewGameState();
    const card = cardLibrary[0]!;
    return {
        ...fresh,
        version: 25,
        moralMeter: 12,
        philosophicalAlignment: { epistemology: 40, outlook: -10, scope: 5 },
        lastSeenAlignmentCells: { 'old-marrow': 'logic-neutral-relational' },
        currentEncounter: {
            enemies: [{ id: 'grave-larva', name: 'Grave Larva', cards: [legacyCard(card)] }],
        },
    };
}

describe('migrate v25 → v26 (T6 / D39)', () => {
    it('lands at the current version', () => {
        expect(GAME_STATE_VERSION).toBeGreaterThanOrEqual(26);
        expect(migrate(v25Save(), 25, 26).version).toBe(26);
    });

    it('strips moralMeter, philosophicalAlignment and lastSeenAlignmentCells', () => {
        const migrated = migrate(v25Save(), 25, 26) as unknown as Record<string, unknown>;
        expect(migrated).not.toHaveProperty('moralMeter');
        expect(migrated).not.toHaveProperty('philosophicalAlignment');
        expect(migrated).not.toHaveProperty('lastSeenAlignmentCells');
    });

    it("renames a staged enemy card's philosophicalAspect to color", () => {
        const card = cardLibrary[0]!;
        const migrated = migrate(v25Save(), 25, 26);
        const migratedCard = migrated.currentEncounter!.enemies[0]!.cards![0]! as unknown as Record<string, unknown>;
        expect(migratedCard.color).toBe(card.color);
        expect(migratedCard).not.toHaveProperty('philosophicalAspect');
    });

    it('passes the rest of the save through unchanged', () => {
        const save = v25Save();
        const migrated = migrate(save, 25, 26);
        expect(migrated.player).toEqual(save.player);
        expect(migrated.world).toEqual(save.world);
        expect(migrated.flags).toEqual(save.flags);
        expect(migrated.codex).toEqual(save.codex);
    });

    it('chains from v24 in one call', () => {
        const fresh = { ...createNewGameState(), version: 24, moralMeter: 0 } as unknown as Record<string, unknown>;
        const migrated = migrate(fresh, 24) as unknown as Record<string, unknown>;
        expect(migrated.version).toBe(GAME_STATE_VERSION);
        expect(migrated).not.toHaveProperty('moralMeter');
    });
});
