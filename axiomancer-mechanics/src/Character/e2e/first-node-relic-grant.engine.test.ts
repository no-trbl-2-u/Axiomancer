/**
 * Hermetic engine test — the first-node relic grant (the Suppliant's Ring).
 *
 * The first block pins that the seed (`createCharacter({ seedStartingRelics })`)
 * carries the ring, worn. The rest pins the hand-over: the ring is withheld
 * from a seeded character, handed over at the first node, and the post-grant
 * character is equivalent to the seeded one. A full accessory row (the
 * fixture trinkets, R7e2) gives up its last worn piece to the satchel.
 */

import { describe, it, expect } from 'vitest';
import { createCharacter } from '../index';
import { createNewGameState, gameReducer } from '../../Game/game.reducer';
import {
    grantFirstNodeRelic, withholdFirstNodeRelic, isFirstNodeRelicPending,
    FIRST_NODE_RELIC_ID, FIRST_NODE_RELIC_FLAG,
} from '../first-node-grant';
import { getRelicById, getSignaturesForLoadout } from '../../Items/relic.library';
import { wornPerSlot } from '../../Items/equipped';
import { SLOT_CAPACITY } from '../../Items/types';
import { FIXTURE_TRINKETS } from '../../Game/fixtures';
import type { Character } from '../types';
import type { Enemy } from '../../Enemy/types';

const BASE = { heart: 5, body: 5, mind: 5 } as const;

/** The seeded character: the ring, worn. */
function seededCharacter(): Character {
    return createCharacter({ name: 'Player', level: 1, baseStats: BASE, seedStartingRelics: true });
}

/** A character whose accessory row is full of fixture trinkets (no ring). */
function fullRowCharacter(): Character {
    return createCharacter({
        name: 'Full', level: 1, baseStats: BASE,
        equipment: [...FIXTURE_TRINKETS], inventory: [...FIXTURE_TRINKETS],
    });
}

const ids = (c: Character): string[] => c.inventory.map(i => i.id);
const accIds = (c: Character): string[] => c.equipment.accessories.map(a => a.id);

describe('the seed — the ring is carried, worn', () => {
    it('the seeded character carries the Suppliant\'s Ring, worn', () => {
        const c = seededCharacter();
        expect(ids(c)).toEqual([FIRST_NODE_RELIC_ID]);
        expect(accIds(c)).toEqual([FIRST_NODE_RELIC_ID]);
    });

    it('the ring sits inside the worn window, so inventory-driven clients agree it is worn', () => {
        // The SATCHEL reads worn-state positionally (`wornPerSlot`), not from
        // the loadout. Both must say the same thing or two screens reading one
        // save disagree.
        const c = seededCharacter();
        const wornAccessories = (wornPerSlot(c.inventory).get('accessory') ?? []).map(a => a.id);
        expect(wornAccessories).toEqual(accIds(c));
        expect(wornAccessories).toContain(FIRST_NODE_RELIC_ID);
    });
});

describe('withholdFirstNodeRelic — the pre-grant character', () => {
    it('removes the ring from inventory and from the body', () => {
        const c = withholdFirstNodeRelic(seededCharacter());
        expect(ids(c)).not.toContain(FIRST_NODE_RELIC_ID);
        expect(accIds(c)).not.toContain(FIRST_NODE_RELIC_ID);
        expect(c.inventory).toHaveLength(0);
        expect(c.equipment.accessories).toHaveLength(0);
    });

    it('leaves the other worn accessories in place', () => {
        const withRing = grantFirstNodeRelic(
            createCharacter({
                name: 'Two', level: 1, baseStats: BASE,
                equipment: FIXTURE_TRINKETS.slice(0, 2), inventory: FIXTURE_TRINKETS.slice(0, 2),
            }),
            [],
        ).character;
        const c = withholdFirstNodeRelic(withRing);
        expect(accIds(c)).toEqual(FIXTURE_TRINKETS.slice(0, 2).map(t => t.id));
        expect(ids(c)).toEqual(FIXTURE_TRINKETS.slice(0, 2).map(t => t.id));
    });

    it('keeps the positional worn-convention agreeing with the loadout', () => {
        const c = withholdFirstNodeRelic(seededCharacter());
        for (const slot of ['weapon', 'armor', 'accessory'] as const) {
            const positional = (wornPerSlot(c.inventory).get(slot) ?? []).map(e => e.id);
            const loadout = slot === 'weapon'
                ? (c.equipment.weapon ? [c.equipment.weapon.id] : [])
                : slot === 'armor'
                    ? (c.equipment.armor ? [c.equipment.armor.id] : [])
                    : accIds(c);
            expect(positional, slot).toEqual(loadout);
        }
    });

    it('derives no signature once the ring is withheld', () => {
        const c = withholdFirstNodeRelic(seededCharacter());
        expect(getSignaturesForLoadout(c.equipment)).toEqual([]);
    });

    it('is a no-op on a character that never had the ring', () => {
        const bare = createCharacter({ name: 'B', level: 1, baseStats: BASE });
        expect(withholdFirstNodeRelic(bare)).toBe(bare);
    });

    it('is idempotent', () => {
        const once = withholdFirstNodeRelic(seededCharacter());
        const twice = withholdFirstNodeRelic(once);
        expect(ids(twice)).toEqual(ids(once));
        expect(accIds(twice)).toEqual(accIds(once));
    });
});

describe('grantFirstNodeRelic — the hand-over', () => {
    it('on a full accessory row, swaps the ring onto the body, displacing the last worn accessory', () => {
        const before = fullRowCharacter();
        const last = FIXTURE_TRINKETS[FIXTURE_TRINKETS.length - 1]!;
        const g = grantFirstNodeRelic(before, []);
        expect(g.reason).toBe('granted');
        expect(g.granted?.id).toBe(FIRST_NODE_RELIC_ID);
        expect(g.displaced?.id).toBe(last.id);
        expect(g.character.equipment.accessories).toHaveLength(SLOT_CAPACITY.accessory);
        expect(accIds(g.character)).toContain(FIRST_NODE_RELIC_ID);
        expect(accIds(g.character)).not.toContain(last.id);
    });

    it('never destroys the displaced relic — it goes back to the satchel', () => {
        const before = fullRowCharacter();
        const last = FIXTURE_TRINKETS[FIXTURE_TRINKETS.length - 1]!;
        const g = grantFirstNodeRelic(before, []);
        expect(ids(g.character)).toContain(last.id);
        expect(g.character.inventory).toHaveLength(before.inventory.length + 1);
    });

    it('keeps the positional worn-convention agreeing after a full-row swap', () => {
        const granted = grantFirstNodeRelic(fullRowCharacter(), []).character;
        const positional = (wornPerSlot(granted.inventory).get('accessory') ?? []).map(a => a.id);
        expect(positional).toEqual(accIds(granted));
    });

    it('does not alias the library singleton into the character', () => {
        const before = withholdFirstNodeRelic(seededCharacter());
        const a = grantFirstNodeRelic(before, []).granted!;
        const b = grantFirstNodeRelic(before, []).granted!;
        expect(a).not.toBe(b);
        // The ring carries no stat modifier (owner call 2026-09-23), so the
        // aliasing guard is on the array itself, not on a first entry.
        expect(a.statModifiers).not.toBe(b.statModifiers);
        expect(a.statModifiers).not.toBe(getRelicById(FIRST_NODE_RELIC_ID)!.statModifiers);
    });

    it('withhold then grant lands on a character equivalent to the seed', () => {
        const seeded = seededCharacter();
        const granted = grantFirstNodeRelic(withholdFirstNodeRelic(seeded), []).character;

        expect(getSignaturesForLoadout(granted.equipment)).toEqual(getSignaturesForLoadout(seeded.equipment));
        expect(granted.maxHealth).toBe(seeded.maxHealth);
        expect(ids(granted)).toEqual(ids(seeded));
        expect(accIds(granted)).toEqual(accIds(seeded));
    });

    it('stamps the settle flag and is then a no-op', () => {
        const before = withholdFirstNodeRelic(seededCharacter());
        const first = grantFirstNodeRelic(before, []);
        expect(first.flags).toContain(FIRST_NODE_RELIC_FLAG);

        const second = grantFirstNodeRelic(first.character, first.flags);
        expect(second.reason).toBe('already-settled');
        expect(second.character).toBe(first.character);
        expect(second.granted).toBeNull();
    });

    it('settles without re-granting when the ring is already owned (the RESET_RUN keepCharacter path)', () => {
        // `RESET_RUN { keepCharacter: true }` keeps the player but clears flags.
        const owner = grantFirstNodeRelic(withholdFirstNodeRelic(seededCharacter()), []).character;
        const again = grantFirstNodeRelic(owner, []);
        expect(again.reason).toBe('already-owned');
        expect(again.character).toBe(owner);
        expect(again.flags).toContain(FIRST_NODE_RELIC_FLAG);
        expect(again.character.inventory.filter(i => i.id === FIRST_NODE_RELIC_ID)).toHaveLength(1);
    });

    it('fills a free accessory position without displacing anything', () => {
        const bare = createCharacter({ name: 'B', level: 1, baseStats: BASE });
        const g = grantFirstNodeRelic(bare, []);
        expect(g.reason).toBe('granted');
        expect(g.displaced).toBeNull();
        expect(accIds(g.character)).toEqual([FIRST_NODE_RELIC_ID]);
        expect(ids(g.character)).toEqual([FIRST_NODE_RELIC_ID]);
    });
});

describe('isFirstNodeRelicPending', () => {
    it('is true for a fresh run and false once settled or owned', () => {
        const fresh = createNewGameState();
        expect(isFirstNodeRelicPending(fresh.player, fresh.flags)).toBe(true);

        const g = grantFirstNodeRelic(fresh.player, fresh.flags);
        expect(isFirstNodeRelicPending(g.character, g.flags)).toBe(false);
        // Owned but unflagged (keepCharacter reset) is also not pending.
        expect(isFirstNodeRelicPending(g.character, [])).toBe(false);
    });
});

describe('createNewGameState — the run starts owing the player the ring', () => {
    // Owner call 2026-09-23 (THE VERY START): a fresh run seeds NO relics.
    // The ring is still owed and still arrives at the first node. See
    // `fresh-start.engine.test.ts` for the full empty-start contract.
    it('seeds no relics and owes the ring', () => {
        const s = createNewGameState();
        expect(s.player.inventory).toHaveLength(0);
        expect(ids(s.player)).not.toContain(FIRST_NODE_RELIC_ID);
        expect(s.flags).not.toContain(FIRST_NODE_RELIC_FLAG);
    });

    it('enters the world wearing nothing, and the first-node grant fills the first accessory seat', () => {
        const s = createNewGameState();
        expect(s.player.equipment.weapon).toBeNull();
        expect(s.player.equipment.armor).toBeNull();
        expect(s.player.equipment.accessories).toHaveLength(0);
        expect(getSignaturesForLoadout(s.player.equipment)).toHaveLength(0);

        const g = grantFirstNodeRelic(s.player, s.flags);
        expect(g.reason).toBe('granted');
        expect(g.displaced).toBeNull();
        expect(accIds(g.character)).toEqual([FIRST_NODE_RELIC_ID]);
        expect(getSignaturesForLoadout(g.character.equipment)).toEqual(['sig-disarming-plea']);
        expect(g.character.equipment.accessories.length).toBeLessThanOrEqual(SLOT_CAPACITY.accessory);
    });
});

describe('the reducer floor — nobody fights with the grant still pending', () => {
    const foe = {
        id: 'test-foe', name: 'Test Foe', description: '', level: 1,
        baseStats: { heart: 3, body: 3, mind: 3 },
        health: 20, maxHealth: 20, effects: [], difficulty: 'normal',
        mapName: 'breakwater', experienceReward: 1, lootTable: [],
    } as unknown as Enemy;

    it('START_COMBAT settles the grant before staging the encounter', () => {
        const fresh = createNewGameState();
        expect(isFirstNodeRelicPending(fresh.player, fresh.flags)).toBe(true);

        const next = gameReducer(fresh, { type: 'START_COMBAT', payload: { target: foe } });
        expect(ids(next.player)).toContain(FIRST_NODE_RELIC_ID);
        expect(next.flags).toContain(FIRST_NODE_RELIC_FLAG);
        expect(getSignaturesForLoadout(next.player.equipment)).toContain('sig-disarming-plea');
        expect(next.currentEncounter).toBeDefined();
    });

    it('PROCESS_NODE settles the grant for reducer-driven consumers', () => {
        const fresh = createNewGameState();
        const next = gameReducer(fresh, { type: 'PROCESS_NODE' });
        expect(ids(next.player)).toContain(FIRST_NODE_RELIC_ID);
        expect(next.flags).toContain(FIRST_NODE_RELIC_FLAG);
    });

    it('MOVE_TO_NODE stays a world-only transition — walking grants nothing', () => {
        // Pinned by `game.loop.engine.test.ts` too; repeated here because the
        // grant is the thing most likely to break it.
        const fresh = createNewGameState();
        const target = fresh.world.currentMap.availableNodes[0];
        expect(typeof target).toBe('string');

        const next = gameReducer(fresh, { type: 'MOVE_TO_NODE', payload: { nodeId: target! } });
        expect(next.player).toBe(fresh.player);
        expect(next.flags).toBe(fresh.flags);
    });
});
