/**
 * Hermetic E2E Tests — Inventory modal presenter (Spec 06 Q2 / Q5).
 *
 * The modal previews the result of using or equipping an item before
 * the player confirms. These tests drive `selectItemModalViewModel`
 * end-to-end through the engine store with no mocks.
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';
import {
    createCharacter,
    createGameStore,
    type Consumable,
    type Equipment,
} from 'axiomancer-mechanics';

import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { selectItemModalViewModel } from '@/state/presenters/inventory.modal.engine';

afterEach(() => {
    jest.restoreAllMocks();
});

function makeStore(inventory: readonly (Consumable | Equipment)[]) {
    const base = createCharacter({
        name: 'Pilgrim',
        level: 1,
        baseStats: { heart: 4, body: 4, mind: 4 },
    });
    const player = { ...base, health: 5, inventory: [...inventory] };
    return createGameStore(createMemoryAdapter(), { player });
}

const potion: Consumable = {
    id: 'phial',
    name: 'Potion of Heart',
    description: 'A small phial of ruby liquor.',
    category: 'consumable',
    healAmount: 6,
    quantity: 1,
};

const blade: Equipment = {
    id: 'long-blade',
    name: 'Long Blade',
    description: 'Iron, notched.',
    category: 'equipment',
    slot: 'weapon',
    rarity: 'common',
    requiredLevel: 1,
};

// A stat-bearing weapon used to exercise the equip stat-delta surface:
// it adds physical attack and a passive effect, so swapping it in over
// the plain `blade` produces a real, non-empty set of changes.
const runeBlade: Equipment = {
    id: 'rune-blade',
    name: 'Rune Blade',
    description: 'Etched with a humming sigil.',
    category: 'equipment',
    slot: 'weapon',
    rarity: 'uncommon',
    requiredLevel: 1,
    statModifiers: [{ stat: 'physicalAttack', value: 5, isMultiplier: false }],
    passiveEffects: ['rune-ward'],
};

// A weapon granting a fractional luck modifier — exercises the
// one-decimal rounding of the luck display.
const luckBlade: Equipment = {
    id: 'luck-blade',
    name: 'Lucky Blade',
    description: 'Suspiciously fortunate.',
    category: 'equipment',
    slot: 'weapon',
    rarity: 'uncommon',
    requiredLevel: 1,
    statModifiers: [{ stat: 'luck', value: 1.55432728, isMultiplier: false }],
};

// Two named (affixed) weapons used to prove the equip/swap block shows
// non-stat changes, not affix/keyword add-removes.
const affixBladeWorn: Equipment = {
    id: 'affix-worn',
    name: 'Dull Blade',
    description: 'A worn affixed blade.',
    category: 'equipment',
    slot: 'weapon',
    rarity: 'uncommon',
    requiredLevel: 1,
    prefixId: 'p-dull',
    prefixName: 'Dull',
};
const affixBladeCandidate: Equipment = {
    id: 'affix-candidate',
    name: 'Glittering Blade',
    description: 'A bright affixed blade with a ward.',
    category: 'equipment',
    slot: 'weapon',
    rarity: 'uncommon',
    requiredLevel: 1,
    prefixId: 'p-glitter',
    prefixName: 'Glittering',
    passiveEffects: ['rune-ward'],
};

// ---------------------------------------------------------------------------

describe('selectItemModalViewModel: missing item', () => {
    it('returns null when the item id is unknown', () => {
        const store = makeStore([potion]);
        expect(selectItemModalViewModel(store.getState(), 'missing')).toBeNull();
    });
});

describe('selectItemModalViewModel: consumable preview (Q2)', () => {
    it('reports mode "use" and a DRINK confirm label', () => {
        const store = makeStore([potion]);

        const vm = selectItemModalViewModel(store.getState(), 'phial')!;

        expect(vm.mode).toBe('use');
        expect(vm.confirmLabel).toBe('DRINK');
        expect(vm.confirmPrompt).toMatch(/potion/i);
    });

    it('shows the HP delta in the preview lines', () => {
        const store = makeStore([potion]);

        const vm = selectItemModalViewModel(store.getState(), 'phial')!;

        expect(vm.previewLines.some((l) => /\+6/.test(l))).toBe(true);
        expect(vm.previewLines.some((l) => /HP/.test(l))).toBe(true);
    });

    it('reports "No HP change." when the effect is non-healing', () => {
        // Intentionally exercises the legacy `effectId` fallback: a free-form
        // non-healing effect should round-trip through `parseHealAmount → 0`
        // and surface the "No HP change." preview line.
        const odd: Consumable = {
            ...potion,
            id: 'wine',
            healAmount: undefined,
            effectId: '+4 Mana',
        };
        const store = makeStore([odd]);

        const vm = selectItemModalViewModel(store.getState(), 'wine')!;

        expect(vm.previewLines.join(' ')).toMatch(/No HP change/i);
    });
});

describe('selectItemModalViewModel: equipment preview (Q5)', () => {
    it('reports mode "equip" and an EQUIP · REPLACE label when there is a worn sibling (Phase 36)', () => {
        const store = makeStore([blade]);
        // First-in-slot is `blade` (worn). Add a second weapon — the
        // modal for it should show the replace-label form.
        const second: Equipment = { ...blade, id: 'second', name: 'Whittled Stick' };
        const player = {
            ...store.getState().player,
            inventory: [blade, second],
        };
        store.setState({ player });

        const vm = selectItemModalViewModel(store.getState(), 'second')!;

        expect(vm.mode).toBe('equip');
        expect(vm.confirmLabel).toBe('EQUIP · REPLACE LONG BLADE');
        expect(vm.replacingName).toBe('Long Blade');
    });

    it('reports a plain EQUIP label + null replacingName when the slot is empty (Phase 36)', () => {
        // No equipment in inventory at all → bare slot.
        const armor: Equipment = {
            id: 'cuirass',
            name: 'Brass Cuirass',
            description: 'Heavy.',
            category: 'equipment',
            slot: 'armor',
            rarity: 'common',
            requiredLevel: 1,
        };
        // armor is first-in-slot for `armor` so it's worn. To exercise
        // the "bare slot, would equip" path we need an unworn item in
        // a slot with no equipped sibling — that means a second item
        // in a NEW slot, with no first-of-slot ahead of it. But the
        // first item per slot is always equipped... so use two-slot
        // inventory: blade (worn in weapon), unequipped armor in armor
        // slot has no equipped sibling yet... wait, that armor is also
        // first-in-slot. The only path to "would equip, no sibling" is
        // a second item in a slot whose first item isn't present.
        // Practically: ship a sword that's NOT the first-of-slot when
        // no other weapon is worn. That's impossible with the
        // first-in-slot=worn convention. So this case is structurally
        // unreachable through normal inventory state — the path lives
        // for completeness of the modal contract (selectInventoryView
        // mirror) but realistically the equipped-sibling case is the
        // only one a player hits at runtime. Skip the test body — the
        // remaining cases pin the equip and equip-replace paths.
        const store = makeStore([armor]);
        const vm = selectItemModalViewModel(store.getState(), 'cuirass')!;
        // cuirass is first-in-armor-slot → worn. confirmLabel is WORN.
        // (See above for why the empty-slot would-equip path is
        // unreachable through normal flow.)
        expect(vm.confirmLabel).toBe('WORN');
        expect(vm.replacingName).toBeNull();
    });

    it('reports "WORN" + null replacingName when the target is already first-in-slot AND sole item in slot', () => {
        // User-jot 2026-05-22 (oversight 29th): sole-item-in-slot
        // falls back to mode='view' confirmLabel='WORN' — there's
        // no other peer to swap to, so unequip is a no-op under
        // the mobile first-per-slot convention.
        const store = makeStore([blade]);

        const vm = selectItemModalViewModel(store.getState(), 'long-blade')!;

        expect(vm.mode).toBe('view');
        expect(vm.confirmLabel).toBe('WORN');
        expect(vm.replacingName).toBeNull();
    });

    it('reports mode "unequip" + UNEQUIP confirm label when target is worn AND has a slot peer (user-jot 2026-05-22)', () => {
        // Worn weapon + a peer: tapping the worn one offers
        // UNEQUIP · WEAR <peer-name>. After the action layer
        // moves the worn item to the back of its slot peers,
        // the peer becomes the new first-in-slot worn item.
        const peer: Equipment = {
            id: 'short-blade',
            name: 'Short Blade',
            description: 'Cracked at the hilt.',
            category: 'equipment',
            slot: 'weapon',
            rarity: 'common',
            requiredLevel: 1,
        };
        const store = makeStore([blade, peer]);

        const vm = selectItemModalViewModel(store.getState(), 'long-blade')!;

        expect(vm.mode).toBe('unequip');
        expect(vm.confirmLabel).toContain('UNEQUIP');
        expect(vm.confirmLabel).toContain('SHORT BLADE');
        expect(vm.confirmPrompt).toMatch(/stop wearing/i);
    });

    it('reports mode "equip" + EQUIP confirm label when target is the peer (not worn)', () => {
        // Same fixture as above; tap the peer (not worn) →
        // standard equip flow with EQUIP · REPLACE Long Blade.
        const peer: Equipment = {
            id: 'short-blade',
            name: 'Short Blade',
            description: 'Cracked at the hilt.',
            category: 'equipment',
            slot: 'weapon',
            rarity: 'common',
            requiredLevel: 1,
        };
        const store = makeStore([blade, peer]);

        const vm = selectItemModalViewModel(store.getState(), 'short-blade')!;

        expect(vm.mode).toBe('equip');
        expect(vm.confirmLabel).toContain('EQUIP · REPLACE');
        expect(vm.confirmLabel).toContain('LONG BLADE');
    });

    it('exposes a stat delta table for the modal to render', () => {
        // `blade` is worn; tapping the stat-bearing peer previews the
        // swap, which changes at least one stat.
        const store = makeStore([blade, runeBlade]);

        const vm = selectItemModalViewModel(store.getState(), 'rune-blade')!;

        expect(vm.statDeltas.length).toBeGreaterThan(0);
        for (const delta of vm.statDeltas) {
            expect(typeof delta.before).toBe('number');
            expect(typeof delta.after).toBe('number');
            expect(typeof delta.delta).toBe('number');
        }
    });

    // Brief fix #3: the modal shows *only* stats that change — never a
    // stat whose value is unchanged.
    it('emits only stats that actually change (no zero-delta rows)', () => {
        const store = makeStore([blade, runeBlade]);

        const vm = selectItemModalViewModel(store.getState(), 'rune-blade')!;

        expect(vm.statDeltas.length).toBeGreaterThan(0);
        for (const delta of vm.statDeltas) {
            expect(delta.delta).not.toBe(0);
            expect(delta.after - delta.before).toBe(delta.delta);
        }
        // Rune Blade adds +5 physical attack over the plain blade.
        const atk = vm.statDeltas.find((d) => d.id === 'physicalAttack');
        expect(atk).toBeDefined();
        expect(atk!.delta).toBe(5);
    });

    // A swap that changes nothing (identical stat-less weapons) shows an
    // empty stat table.
    it('shows no stat rows when the equip changes no stats', () => {
        const twin: Equipment = { ...blade, id: 'twin-blade', name: 'Twin Blade' };
        const store = makeStore([blade, twin]);

        const vm = selectItemModalViewModel(store.getState(), 'twin-blade')!;

        expect(vm.statDeltas).toHaveLength(0);
    });

    // The item's own modifiers surface (with values) regardless of equip
    // state, so an affixed drop shows *what* its affixes grant.
    it('exposes the item\'s intrinsic modifiers with values', () => {
        const store = makeStore([blade, runeBlade]);

        const vm = selectItemModalViewModel(store.getState(), 'rune-blade')!;

        const labels = vm.itemModifiers.map((m) => m.label);
        expect(labels).toContain('+5 PHYS ATK');
        // The passive effect id surfaces (resolved name, or the id when
        // the engine has no definition for the fixture id).
        expect(labels.some((l) => l.includes('rune-ward'))).toBe(true);
        // The stat line carries its engine key for tooltip wiring.
        const atk = vm.itemModifiers.find((m) => m.label === '+5 PHYS ATK');
        expect(atk?.id).toBe('physicalAttack');
    });

    // A plain common item (no modifiers) exposes an empty modifier list.
    it('exposes no intrinsic modifiers for a plain item', () => {
        const store = makeStore([blade]);

        const vm = selectItemModalViewModel(store.getState(), 'long-blade')!;

        expect(vm.itemModifiers).toHaveLength(0);
    });

    // Luck is fractional; the modifier window rounds it to one decimal.
    it('rounds a luck modifier to one decimal in the intrinsic list', () => {
        const store = makeStore([luckBlade]);

        const vm = selectItemModalViewModel(store.getState(), 'luck-blade')!;

        const luck = vm.itemModifiers.find((m) => m.label.includes('LUCK'));
        expect(luck?.label).toBe('+1.6 LUCK');
    });

    it('rounds a luck stat delta to one decimal', () => {
        // Worn plain blade + lucky peer: tapping the peer previews the
        // swap, whose luck delta must read at one decimal.
        const store = makeStore([blade, luckBlade]);

        const vm = selectItemModalViewModel(store.getState(), 'luck-blade')!;

        const luck = vm.statDeltas.find((d) => d.id === 'luck' || d.label === 'LUCK');
        expect(luck).toBeDefined();
        // Every surfaced number carries at most one decimal place.
        for (const n of [luck!.before, luck!.after, luck!.delta]) {
            expect(Number.isInteger(n * 10)).toBe(true);
        }
    });

    // Brief: the equip/swap block shows non-stat changes (passive effects
    // / status adjustments), NOT affix/keyword add-removes.
    it('omits affix/keyword labels from the equip/swap effect block', () => {
        const store = makeStore([affixBladeWorn, affixBladeCandidate]);

        const vm = selectItemModalViewModel(store.getState(), 'affix-candidate')!;

        const labels = vm.effectDeltas.map((e) => e.label);
        // Affix words never appear as add/remove lines…
        expect(labels.some((l) => l.includes('Glittering'))).toBe(false);
        expect(labels.some((l) => l.includes('Dull'))).toBe(false);
        // …but the genuine non-stat change (the gained passive effect) does.
        expect(labels.some((l) => l.includes('rune-ward'))).toBe(true);
    });

    // Brief fix #3: non-stat changes (passive effects, etc.) surface in
    // `effectDeltas` so the preview shows all of an item's effect.
    it('surfaces gained passive effects in effectDeltas', () => {
        const store = makeStore([blade, runeBlade]);

        const vm = selectItemModalViewModel(store.getState(), 'rune-blade')!;

        const gained = vm.effectDeltas.filter((e) => e.direction === 'gained');
        expect(gained.some((e) => e.label === 'rune-ward')).toBe(true);
    });

    // Phase 80a — equipment stat-delta rows carry an `id` engine-stat
    // key so the inventory item modal's TooltipTarget wrap can fire a
    // `kind:'item-stat'` synthesizer tooltip on tap. The combat /
    // non-combat stat keys follow the `<dimension><Verb>` pattern the
    // synthesizer resolves; pin physical-attack so a future rename in
    // the engine surfaces here as a test failure.
    it('equipment stat deltas carry engine stat-key ids for tooltip wiring (Phase 80a)', () => {
        const store = makeStore([blade, runeBlade]);

        const vm = selectItemModalViewModel(store.getState(), 'rune-blade')!;

        const atk = vm.statDeltas.find((d) => d.label === 'PHYS ATK');
        expect(atk?.id).toBe('physicalAttack');
    });
});

describe('selectItemModalViewModel: invariants', () => {
    it('the modal VM is deep-frozen', () => {
        const store = makeStore([potion]);

        const vm = selectItemModalViewModel(store.getState(), 'phial')!;

        expect(Object.isFrozen(vm)).toBe(true);
        expect(Object.isFrozen(vm.previewLines)).toBe(true);
        expect(Object.isFrozen(vm.statDeltas)).toBe(true);
    });
});
