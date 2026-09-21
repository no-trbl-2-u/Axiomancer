/**
 * Hermetic engine test — the first-node relic grant (the Suppliant's Ring).
 *
 * The first block is the DIAGNOSIS the fix was built on and is deliberately
 * kept: it pins that the pre-v24 seed never dropped the ring. The owner's
 * finding ("new players start with no items") was read as a leak between
 * `cloneStartingRelics()` and the SATCHEL; it is not one. `createCharacter`
 * has always handed the whole kit over — silently, inside character
 * construction, before any screen existed to say so. If a future change
 * really does start dropping relics, the first block is what catches it.
 *
 * The rest pins the v24 behaviour: the ring is withheld from the seed, handed
 * over at the first node, and the post-grant character is equivalent to the
 * character the old seed produced.
 */

import { describe, it, expect } from 'vitest';
import { createCharacter } from '../index';
import { createNewGameState, gameReducer } from '../../Game/game.reducer';
import {
    grantFirstNodeRelic, withholdFirstNodeRelic, isFirstNodeRelicPending,
    FIRST_NODE_RELIC_ID, STAND_IN_RELIC_ID, FIRST_NODE_RELIC_FLAG,
} from '../first-node-grant';
import { getSignaturesForLoadout } from '../../Items/relic.library';
import { wornPerSlot } from '../../Items/equipped';
import { SLOT_CAPACITY } from '../../Items/types';
import type { Character } from '../types';
import type { Enemy } from '../../Enemy/types';

const BASE = { heart: 5, body: 5, mind: 5 } as const;

/** The character the pre-v24 seed produced: the whole kit, silently. */
function seededCharacter(): Character {
    return createCharacter({ name: 'Player', level: 1, baseStats: BASE, seedStartingRelics: true });
}

const ids = (c: Character): string[] => c.inventory.map(i => i.id);
const accIds = (c: Character): string[] => c.equipment.accessories.map(a => a.id);

describe('DIAGNOSIS — the satchel was never empty', () => {
    it('the seeded character carries the Suppliant\'s Ring, worn', () => {
        const c = seededCharacter();
        expect(ids(c)).toContain(FIRST_NODE_RELIC_ID);
        expect(accIds(c)).toContain(FIRST_NODE_RELIC_ID);
        expect(c.inventory).toHaveLength(11);
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
        expect(c.inventory).toHaveLength(10);
    });

    it('keeps the accessory row at capacity by promoting the stand-in', () => {
        const c = withholdFirstNodeRelic(seededCharacter());
        expect(c.equipment.accessories).toHaveLength(SLOT_CAPACITY.accessory);
        expect(accIds(c)).toContain(STAND_IN_RELIC_ID);
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

    it('still derives a full five-signature kit (the seat is held, not left empty)', () => {
        const c = withholdFirstNodeRelic(seededCharacter());
        expect(getSignaturesForLoadout(c.equipment)).toHaveLength(5);
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
    it('hands the ring over and swaps it onto the body, benching the stand-in', () => {
        const before = withholdFirstNodeRelic(seededCharacter());
        const g = grantFirstNodeRelic(before, []);
        expect(g.reason).toBe('granted');
        expect(g.granted?.id).toBe(FIRST_NODE_RELIC_ID);
        expect(g.displaced?.id).toBe(STAND_IN_RELIC_ID);
        expect(accIds(g.character)).toContain(FIRST_NODE_RELIC_ID);
        expect(accIds(g.character)).not.toContain(STAND_IN_RELIC_ID);
    });

    it('never destroys the displaced relic — it goes back to the satchel', () => {
        const before = withholdFirstNodeRelic(seededCharacter());
        const g = grantFirstNodeRelic(before, []);
        expect(ids(g.character)).toContain(STAND_IN_RELIC_ID);
        expect(g.character.inventory).toHaveLength(11);
    });

    it('does not alias the library singleton into the character', () => {
        const before = withholdFirstNodeRelic(seededCharacter());
        const a = grantFirstNodeRelic(before, []).granted!;
        const b = grantFirstNodeRelic(before, []).granted!;
        expect(a).not.toBe(b);
        expect(a.statModifiers?.[0]).not.toBe(b.statModifiers?.[0]);
    });

    it('lands on a character equivalent to the pre-v24 silent seed', () => {
        const seeded = seededCharacter();
        const granted = grantFirstNodeRelic(withholdFirstNodeRelic(seeded), []).character;

        expect(getSignaturesForLoadout(granted.equipment))
            .toEqual(expect.arrayContaining(getSignaturesForLoadout(seeded.equipment)));
        expect(getSignaturesForLoadout(granted.equipment)).toHaveLength(5);
        expect(granted.derivedStats).toEqual(seeded.derivedStats);
        expect(granted.maxHealth).toBe(seeded.maxHealth);
        expect(ids(granted).slice().sort()).toEqual(ids(seeded).slice().sort());
        expect(accIds(granted).slice().sort()).toEqual(accIds(seeded).slice().sort());
    });

    it('keeps the positional worn-convention agreeing after the swap', () => {
        const granted = grantFirstNodeRelic(withholdFirstNodeRelic(seededCharacter()), []).character;
        const positional = (wornPerSlot(granted.inventory).get('accessory') ?? []).map(a => a.id);
        expect(positional).toEqual(accIds(granted));
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
    it('seeds ten relics, not eleven, and owes the eleventh', () => {
        const s = createNewGameState();
        expect(s.player.inventory).toHaveLength(10);
        expect(ids(s.player)).not.toContain(FIRST_NODE_RELIC_ID);
        expect(s.flags).not.toContain(FIRST_NODE_RELIC_FLAG);
    });

    it('still enters the world wearing a full five-relic loadout', () => {
        const s = createNewGameState();
        expect(s.player.equipment.weapon).not.toBeNull();
        expect(s.player.equipment.armor).not.toBeNull();
        expect(s.player.equipment.accessories).toHaveLength(SLOT_CAPACITY.accessory);
        expect(getSignaturesForLoadout(s.player.equipment)).toHaveLength(5);
    });
});

describe('the reducer floor — nobody fights with the grant still pending', () => {
    const foe = {
        id: 'test-foe', name: 'Test Foe', description: '', level: 1,
        baseStats: { heart: 3, body: 3, mind: 3 },
        health: 20, maxHealth: 20, effects: [], difficulty: 'normal',
        mapName: 'fishing-village', experienceReward: 1, lootTable: [],
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
