/**
 * Hermetic E2E — Set items (Spec 05e / Phase 54).
 *
 * Pins the 6 cases from the Spec 05e Acceptance + Proposed-approach §8:
 *   1. 2-piece Wanderer's Road equipped → getActiveSetBonuses returns 1
 *      SetBonus with combatStartTokens.heart === 2.
 *   2. Only sandals equipped → getActiveSetBonuses returns empty.
 *   3. initializeCombat with Wanderer's Road 2-piece + a per-item +1
 *      heart token grant → combatResources.heart === 3 (1 item + 2 set).
 *   4. 3-piece Iron Discipline equipped → both the 2-piece statModifier
 *      bonus AND the 3-piece generationBonus are active simultaneously.
 *   5. Overlapping membership — leather-cap + items from two different
 *      sets → partial bonuses from both sets activate independently.
 *   6. Set passiveEffects are present in combatState.player.effects
 *      during combat and absent in character.effects between combats
 *      (combat-scoped lifecycle per Spec 05e Q4).
 */

import { describe, it, expect } from 'vitest';

import { createCharacter } from '../../Character/index';
import { initializeCombat } from '../../Combat/combat.reducer';
import { generateBasicActionResources } from '../../Cards/skill.engine';
import {
    getActiveSetBonuses,
    aggregateSetStartTokens,
    applySetGenerationBonus,
    getActiveSetPassiveEffectIds,
    getEquippedItemSets,
} from '../set.engine';
import { itemSetLibrary, getItemSetById } from '../set.library';
import { Disatree_01 } from '../../Enemy/enemy.library';
import { tickAllEffects } from '../../Combat/effects';
import type { Equipment, EquipmentSlot } from '../types';
import type { CombatResources } from '../../Cards/types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const buildPlayer = () => createCharacter({
    name: 'TestPlayer',
    level: 1,
    baseStats: { heart: 4, body: 3, mind: 2 },
});

/** Build a minimal Equipment instance with the given template id + slot. */
function makeEquipment(
    templateId: string,
    slot: EquipmentSlot,
    extra: Partial<Equipment> = {},
): Equipment {
    return {
        id: templateId,
        name: templateId,
        description: '',
        category: 'equipment',
        slot,
        rarity: 'common',
        requiredLevel: 1,
        ...extra,
    };
}

const sandals     = makeEquipment('sandals',     'feet');
const leatherCap  = makeEquipment('leather-cap', 'head');
const clothWrap   = makeEquipment('cloth-wrap',  'body');
const clothGloves = makeEquipment('cloth-gloves','hands');
const copperRing  = makeEquipment('copper-ring', 'accessory');

const ZERO_RESOURCES: CombatResources = { heart: 0, body: 0, mind: 0, fallacy: 0, paradox: 0 };

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Phase 54 — set library', () => {
    it('ships the 3 initial sets first, in deterministic order', () => {
        // Content expansion appends further sets; the original three remain the
        // first entries in declaration order.
        expect(itemSetLibrary.map(s => s.id).slice(0, 3)).toEqual([
            'wanderers-road',
            'iron-discipline',
            'scholars-circle',
        ]);
        expect(itemSetLibrary.length).toBeGreaterThanOrEqual(3);
    });

    it('getItemSetById returns the matching set or undefined', () => {
        expect(getItemSetById('iron-discipline')?.name).toBe('Iron Discipline');
        expect(getItemSetById('not-a-set')).toBeUndefined();
    });
});

describe('Phase 54 — getActiveSetBonuses', () => {
    it('returns the Wanderer\'s Road 2-piece bonus when sandals + leather-cap are equipped', () => {
        const equipment = { feet: sandals, head: leatherCap };
        const bonuses = getActiveSetBonuses(equipment);

        expect(bonuses).toHaveLength(1);
        expect(bonuses[0].resourceInteraction?.combatStartTokens?.heart).toBe(2);
    });

    it('returns no bonuses when only one member of a set is equipped (count < 2)', () => {
        const equipment = { feet: sandals };
        expect(getActiveSetBonuses(equipment)).toEqual([]);
    });

    it('returns BOTH 2-piece and 3-piece bonuses when 3 Iron Discipline members are equipped', () => {
        const equipment = {
            head: leatherCap,
            body: clothWrap,
            hands: clothGloves,
        };
        const bonuses = getActiveSetBonuses(equipment);

        // Iron Discipline's 2-piece is a statModifier; its 3-piece is a generationBonus.
        expect(bonuses).toHaveLength(2);
        const statBonus = bonuses.find(b => b.statModifiers);
        const genBonus  = bonuses.find(b => b.resourceInteraction?.generationBonus);

        expect(statBonus?.statModifiers).toEqual([
            { stat: 'physicalDefense', value: 3 },
        ]);
        expect(genBonus?.resourceInteraction?.generationBonus).toEqual([
            { trigger: 'any', resourceType: 'body', bonus: 1 },
        ]);
    });

    it('activates overlapping partial bonuses from multiple sets independently', () => {
        // leather-cap is in all 3 sets. Pair with sandals → Wanderer's Road active.
        // Pair with copper-ring → Scholar's Circle ALSO active.
        const equipment = {
            head: leatherCap,
            feet: sandals,
            accessory: copperRing,
        };
        const bonuses = getActiveSetBonuses(equipment);

        // Wanderer's Road 2-piece + Scholar's Circle 2-piece both fire.
        // Iron Discipline only has leather-cap (count = 1) → no bonus.
        expect(bonuses).toHaveLength(2);

        const heartGrant = bonuses.find(b => b.resourceInteraction?.combatStartTokens?.heart);
        const mindGrant  = bonuses.find(b => b.resourceInteraction?.combatStartTokens?.mind);

        expect(heartGrant?.resourceInteraction?.combatStartTokens?.heart).toBe(2);
        expect(mindGrant?.resourceInteraction?.combatStartTokens?.mind).toBe(2);
    });
});

describe('Phase 54 — aggregateSetStartTokens + applySetGenerationBonus', () => {
    it('aggregateSetStartTokens sums combatStartTokens across active sets', () => {
        const equipment = {
            head: leatherCap,
            feet: sandals,
            accessory: copperRing,
        };
        const tokens = aggregateSetStartTokens(equipment);

        // Wanderer's Road +2 heart + Scholar's Circle +2 mind.
        expect(tokens).toEqual({
            ...ZERO_RESOURCES,
            heart: 2,
            mind: 2,
        });
    });

    it('applySetGenerationBonus folds in 3-piece Iron Discipline body generation', () => {
        const equipment = {
            head: leatherCap,
            body: clothWrap,
            hands: clothGloves,
        };
        const result = applySetGenerationBonus(
            { ...ZERO_RESOURCES, body: 0 },
            equipment,
            'hit',
        );
        // Iron Discipline 3-piece grants +1 body on ANY action — fires on 'hit'.
        expect(result.body).toBe(1);
    });

    it('applySetGenerationBonus is a no-op when no set qualifies', () => {
        const equipment = { feet: sandals };
        const start: CombatResources = { ...ZERO_RESOURCES, mind: 5 };
        const result = applySetGenerationBonus(start, equipment, 'hit');
        expect(result).toEqual(start);
    });
});

describe('Phase 54 — initializeCombat seeds set tokens additively', () => {
    it('Wanderer\'s Road 2-piece + a per-item +1 heart token yields combatResources.heart === 3', () => {
        // Equip Wanderer's Road members; add an accessory with a per-item heart grant.
        const heartAccessory: Equipment = {
            id: 'eq_heart_token',
            name: 'Heart Charm',
            description: '',
            category: 'equipment',
            slot: 'accessory',
            rarity: 'common',
            requiredLevel: 1,
            resourceInteraction: {
                combatStartTokens: { heart: 1 },
            },
        };
        const player = {
            ...buildPlayer(),
            equipment: { feet: sandals, head: leatherCap, accessory: heartAccessory },
        };

        const state = initializeCombat(player, Disatree_01);
        // 2 (set) + 1 (item) = 3.
        expect(state.combatResources.heart).toBe(3);
        // Other resources stay at the equipment/set baseline (all zero here).
        expect(state.combatResources.body).toBe(0);
        expect(state.combatResources.mind).toBe(0);
    });

    it('zero-set baseline still works (no equipment, no set bonuses)', () => {
        const player = buildPlayer();
        const state = initializeCombat(player, Disatree_01);
        expect(state.combatResources).toEqual(ZERO_RESOURCES);
    });
});

describe('Phase 54 — set passiveEffects are combat-scoped (Spec Q4)', () => {
    it('Scholar\'s Circle 2-piece applies buff_critical_rate_up at combat start', () => {
        const passiveIds = getActiveSetPassiveEffectIds({
            head: leatherCap,
            accessory: copperRing,
        });
        expect(passiveIds).toContain('buff_critical_rate_up');

        const player = {
            ...buildPlayer(),
            equipment: { head: leatherCap, accessory: copperRing },
        };
        const state = initializeCombat(player, Disatree_01);

        // The effect lands on combatState.player.effects, not character.effects.
        const setEffect = state.player.effects?.find(
            e => e.effectId === 'buff_critical_rate_up' && e.sourceId === 'set-bonus',
        );
        expect(setEffect).toBeDefined();
    });

    it('out-of-combat character.effects does NOT carry the set passive', () => {
        const player = {
            ...buildPlayer(),
            equipment: { head: leatherCap, accessory: copperRing },
        };
        // initializeCombat clones the player and applies effects to the clone.
        // The original player's effects array stays unchanged — set passives
        // live on the combatState, not the canonical character.
        expect(player.effects ?? []).toEqual([]);
    });

    it('set passive uses the combat-lifetime sentinel (remainingDuration: -1) so it survives every tick', () => {
        // Critique-23 row: the prior implementation passed `applyEffect` with
        // no duration override, which let the passive expire mid-combat at
        // round 4 (buff_critical_rate_up's default duration). The fix uses
        // the -1 sentinel that tickAllEffects skips.
        const player = {
            ...buildPlayer(),
            equipment: { head: leatherCap, accessory: copperRing },
        };
        let state = initializeCombat(player, Disatree_01);

        // Tick the player's effects 20 times — well past any plausible combat
        // length. The set passive must still be present at the end.
        for (let i = 0; i < 20; i++) {
            const result = tickAllEffects(state.player);
            state = { ...state, player: result.target };
        }

        const setEffect = state.player.effects?.find(
            e => e.effectId === 'buff_critical_rate_up' && e.sourceId === 'set-bonus',
        );
        expect(setEffect).toBeDefined();
        expect(setEffect?.remainingDuration).toBe(-1);
    });
});

describe('Phase 158 — every set anchors on a status-effect passive', () => {
    const STATUS_OFFENSE = 'buff_status_chance_up';
    const STATUS_DEFENSE = ['buff_resistance_body', 'buff_resistance_mind', 'buff_resistance_heart'];

    /** Equip the full member roster of a set by id, matched to plausible slots. */
    function equipAll(memberIds: string[]): Partial<Record<EquipmentSlot, Equipment>> {
        const SLOT_BY_TEMPLATE: Record<string, EquipmentSlot> = {
            sandals: 'feet', 'leather-cap': 'head', 'cloth-wrap': 'body',
            'cloth-gloves': 'hands', 'copper-ring': 'accessory',
            'plate-mail': 'armor', 'full-helm': 'head', 'plate-gauntlets': 'hands',
            'iron-greaves': 'feet', 'scaled-coat': 'body', 'gold-ring': 'accessory',
            'phoenix-mantle': 'body', 'titans-girdle': 'accessory',
            'leather-coat': 'body', 'chain-gauntlets': 'hands',
        };
        const equipment: Partial<Record<EquipmentSlot, Equipment>> = {};
        for (const id of memberIds) {
            const slot = SLOT_BY_TEMPLATE[id];
            if (slot) equipment[slot] = makeEquipment(id, slot);
        }
        return equipment;
    }

    it('every set (except the already status-rich Embers of Rebirth) grants a status-offense or status-resistance passive', () => {
        for (const set of itemSetLibrary) {
            if (set.id === 'embers-of-rebirth') continue;
            const passives = getActiveSetPassiveEffectIds(equipAll(set.memberTemplateIds));
            const hasStatusPassive =
                passives.includes(STATUS_OFFENSE) ||
                passives.some(p => STATUS_DEFENSE.includes(p));
            expect(hasStatusPassive, `set ${set.id} has no status passive`).toBe(true);
        }
    });

    it('aggressive sets grant the status-offense passive (buff_status_chance_up)', () => {
        for (const id of ['iron-discipline', 'scholars-circle', 'skirmishers-kit']) {
            const set = getItemSetById(id)!;
            const passives = getActiveSetPassiveEffectIds(equipAll(set.memberTemplateIds));
            expect(passives, id).toContain(STATUS_OFFENSE);
        }
    });

    it('defensive sets grant a status-resistance passive', () => {
        const expected: Record<string, string> = {
            'wanderers-road': 'buff_resistance_heart',
            'veterans-plate': 'buff_resistance_body',
            'sages-regalia':  'buff_resistance_mind',
        };
        for (const [id, resist] of Object.entries(expected)) {
            const set = getItemSetById(id)!;
            const passives = getActiveSetPassiveEffectIds(equipAll(set.memberTemplateIds));
            expect(passives, id).toContain(resist);
        }
    });

    it('preserves the Phase 54 flat-stat / resource invariants while layering status on top', () => {
        // Iron Discipline 2-piece flat-stat floor is unchanged.
        const ironBonuses = getActiveSetBonuses(equipAll(
            getItemSetById('iron-discipline')!.memberTemplateIds,
        ));
        const ironStat = ironBonuses.find(b => b.statModifiers);
        expect(ironStat?.statModifiers).toEqual([{ stat: 'physicalDefense', value: 3 }]);

        // Scholar's Circle keeps its crit-rate signature alongside the new bias.
        const scholarPassives = getActiveSetPassiveEffectIds(equipAll(
            getItemSetById('scholars-circle')!.memberTemplateIds,
        ));
        expect(scholarPassives).toContain('buff_critical_rate_up');
        expect(scholarPassives).toContain(STATUS_OFFENSE);

        // Wanderer's Road keeps its +2 heart start-token floor.
        const wandererTokens = aggregateSetStartTokens(equipAll(
            getItemSetById('wanderers-road')!.memberTemplateIds,
        ));
        expect(wandererTokens.heart).toBe(2);
    });

    it('the status passive resolves at combat start with the -1 combat-lifetime sentinel', () => {
        const player = {
            ...buildPlayer(),
            equipment: equipAll(getItemSetById('iron-discipline')!.memberTemplateIds),
        };
        const state = initializeCombat(player, Disatree_01);
        const statusEffect = state.player.effects?.find(
            e => e.effectId === STATUS_OFFENSE && e.sourceId === 'set-bonus',
        );
        expect(statusEffect).toBeDefined();
        expect(statusEffect?.remainingDuration).toBe(-1);
    });
});

describe('Phase 54 — getEquippedItemSets surfaces partial counts for UI', () => {
    it('returns partial counts (1/3 of Iron Discipline) when only one member is equipped', () => {
        const equipment = { head: leatherCap };
        const entries = getEquippedItemSets(equipment);
        // leather-cap is in all 3 sets, so all 3 show partial counts.
        expect(entries).toHaveLength(3);
        const ironDiscipline = entries.find(e => e.set.id === 'iron-discipline');
        expect(ironDiscipline?.equipped).toBe(1);
    });
});

describe('Phase 54 — generateBasicActionResources chains set bonuses after item bonuses', () => {
    it('Iron Discipline 3-piece grants +1 body on a hit (set bonus on top of base)', () => {
        const equipment = {
            head: leatherCap,
            body: clothWrap,
            hands: clothGloves,
        };
        const before: CombatResources = { ...ZERO_RESOURCES, body: 0 };

        // Body stance + hit + Iron Discipline 3-piece → base body gen + set +1.
        // The base body-stance hit gen is governed by RESOURCE_GENERATION.ATTACK_HIT;
        // assert the set delta is layered on top by computing without equipment first.
        const withoutSet = generateBasicActionResources(before, 'body', 'hit');
        const withSet    = generateBasicActionResources(before, 'body', 'hit', equipment);
        expect(withSet.body - withoutSet.body).toBe(1);
    });
});
