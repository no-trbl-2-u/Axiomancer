/**
 * Hermetic engine test — the v24 → v25 hop: derived stats retired.
 *
 * TRIM THE FAT T2a (`plan/2026-09-25-trim-the-fat.spec.md`, D14 in
 * `plan/2026-09-25-refactor-strategy.decisions.md`) deleted the six derived
 * attack/defence stats, luck, the six non-combat saves/tests, and every
 * body/mind/heart stat line on relics. A v24 save still carries all of them.
 * This hop strips them so a loaded save matches the current shape, and must
 * leave everything that still means something — base stats, max VITAE, the
 * armor relics' +5 max VITAE line, the worn loadout — exactly as it was.
 */

import { describe, it, expect } from 'vitest';
import { migrate } from '../game.migrate';
import { createNewGameState, GAME_STATE_VERSION } from '../game.reducer';
import { createCharacter } from '../../Character';
import type { Equipment } from '../../Items/types';

/** The pre-v25 stat line shape: any stat, optional multiplier flag. */
type LegacyStatLine = { stat: string; value: number; isMultiplier?: boolean };

/**
 * Re-applies the v24 relic stat lines to a relic: +2 body on the weapon the
 * kit wears, and the `isMultiplier: false` flag v24 wrote on every line.
 */
function legacyRelic(relic: Equipment): Record<string, unknown> {
    const lines: LegacyStatLine[] = (relic.statModifiers ?? []).map(m => ({ ...m, isMultiplier: false }));
    if (relic.slot === 'weapon') lines.push({ stat: 'body', value: 2, isMultiplier: false });
    return { ...relic, statModifiers: lines };
}

/**
 * A v24 save: a kitted player (11 relics, 5 worn) carrying `derivedStats`,
 * `nonCombatStats` and a +2 body line on every weapon relic, plus a staged
 * encounter whose enemy still carries `derivedStats`.
 */
function v24Save(): Record<string, unknown> {
    const fresh = createNewGameState();
    const kitted = createCharacter({
        name: 'Player', level: 3, baseStats: { heart: 5, body: 6, mind: 4 }, seedStartingRelics: true,
    });
    const player = {
        ...kitted,
        derivedStats: {
            physicalAttack: 8, physicalDefense: 24, mentalAttack: 4, mentalDefense: 12,
            emotionalAttack: 5, emotionalDefense: 15, luck: 5,
        },
        nonCombatStats: {
            physicalSave: 12, physicalTest: 24, mentalSave: 8, mentalTest: 16,
            emotionalSave: 10, emotionalTest: 20,
        },
        inventory: kitted.inventory.map(it => (it.category === 'equipment' ? legacyRelic(it as Equipment) : it)),
        equipment: {
            weapon: kitted.equipment.weapon ? legacyRelic(kitted.equipment.weapon) : null,
            armor: kitted.equipment.armor ? legacyRelic(kitted.equipment.armor) : null,
            accessories: kitted.equipment.accessories.map(legacyRelic),
        },
    };
    return {
        ...fresh,
        version: 24,
        player,
        currentEncounter: {
            enemies: [{ id: 'enemy-x', name: 'X', derivedStats: { physicalAttack: 1, luck: 1 } }],
        },
    } as unknown as Record<string, unknown>;
}

/** Every stat line on every item the player owns or wears. */
function allStatLines(player: Record<string, unknown>): LegacyStatLine[] {
    const inv = (player.inventory as Record<string, unknown>[]) ?? [];
    const eq = player.equipment as { weapon: unknown; armor: unknown; accessories: unknown[] };
    const worn = [eq.weapon, eq.armor, ...eq.accessories].filter(Boolean) as Record<string, unknown>[];
    return [...inv, ...worn].flatMap(it => (it.statModifiers as LegacyStatLine[] | undefined) ?? []);
}

describe('migrate v24 → v25 — derived stats retired', () => {
    it('the v24 → v25 hop is on the supported chain', () => {
        expect(GAME_STATE_VERSION).toBeGreaterThanOrEqual(25);
        expect(migrate(v24Save(), 24, 25).version).toBe(25);
    });

    it('strips derivedStats and nonCombatStats from the player', () => {
        const migrated = migrate(v24Save(), 24, 25);
        expect(migrated.player).not.toHaveProperty('derivedStats');
        expect(migrated.player).not.toHaveProperty('nonCombatStats');
    });

    it('strips derivedStats from a staged encounter enemy', () => {
        const migrated = migrate(v24Save(), 24, 25) as unknown as {
            currentEncounter: { enemies: Record<string, unknown>[] };
        };
        expect(migrated.currentEncounter.enemies[0]).not.toHaveProperty('derivedStats');
        expect(migrated.currentEncounter.enemies[0]!.id).toBe('enemy-x');
    });

    it('keeps only maxHp stat lines on owned and worn relics, without the multiplier flag', () => {
        const raw = v24Save();
        expect(allStatLines(raw.player as Record<string, unknown>).some(l => l.stat === 'body')).toBe(true);
        const migrated = migrate(raw, 24, 25);
        const lines = allStatLines(migrated.player as unknown as Record<string, unknown>);
        expect(lines.length).toBeGreaterThan(0); // the armor relics' +5 max VITAE survives
        expect(lines.every(l => l.stat === 'maxHp')).toBe(true);
        expect(lines.every(l => !('isMultiplier' in l))).toBe(true);
    });

    it('leaves base stats, VITAE and the worn loadout untouched', () => {
        const raw = v24Save();
        const p = raw.player as Record<string, unknown> & { equipment: { weapon: { id: string } } };
        const migrated = migrate(raw, 24, 25);
        expect(migrated.player.baseStats).toEqual(p.baseStats);
        expect(migrated.player.maxHealth).toBe(p.maxHealth);
        expect(migrated.player.health).toBe(p.health);
        expect(migrated.player.equipment.weapon?.id).toBe(p.equipment.weapon.id);
        expect(migrated.player.inventory).toHaveLength((p.inventory as unknown[]).length);
    });

    it('is idempotent over a save with nothing to strip', () => {
        const fresh = { ...createNewGameState(), version: 24 } as unknown as Record<string, unknown>;
        const migrated = migrate(fresh, 24, 25);
        expect(migrated.player).not.toHaveProperty('derivedStats');
        expect(migrated.version).toBe(25);
    });
});
