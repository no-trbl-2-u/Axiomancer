/**
 * Equip-change delta — hermetic E2E tests (Phase 154).
 *
 * Pins the three delta modes (equip / unequip / swap), the deltas-only
 * contract, signature gained/lost surfacing, and the engine-simulated stat
 * diff. Hermetic: builds characters/equipment in-line, no mocks.
 */

import { describe, it, expect } from 'vitest';

import { createCharacter } from '../index';
import { computeEquipDelta } from '../equip-delta';
import type { Equipment } from '../../Items/types';

const buildPlayer = () =>
    createCharacter({ name: 'TestPlayer', level: 5, baseStats: { heart: 4, body: 3, mind: 2 } });

function makeEquipment(id: string, extra: Partial<Equipment> = {}): Equipment {
    return {
        id,
        name: id,
        description: '',
        category: 'equipment',
        slot: 'weapon',
        ...extra,
    };
}

describe('computeEquipDelta (Phase 23 — stat + signature diff only)', () => {
    it('equip into an empty slot → mode equip, stat gain surfaced', () => {
        const candidate = makeEquipment('blade', {
            statModifiers: [{ stat: 'physicalAttack', value: 3 }],
        });
        const d = computeEquipDelta(candidate, null, buildPlayer());
        expect(d.mode).toBe('equip');
        expect(d.against).toBeNull();
        expect(d.stats.some((s) => s.delta > 0)).toBe(true);
    });

    it('unequip the worn item → mode unequip, against the item', () => {
        const worn = makeEquipment('blade', { statModifiers: [{ stat: 'physicalAttack', value: 3 }] });
        const d = computeEquipDelta(worn, worn, buildPlayer());
        expect(d.mode).toBe('unequip');
        expect(d.against).toEqual({ id: 'blade', name: 'blade' });
    });

    it('swap → mode swap, against the worn sibling', () => {
        const worn = makeEquipment('old', { statModifiers: [{ stat: 'physicalAttack', value: 1 }] });
        const candidate = makeEquipment('new', { statModifiers: [{ stat: 'physicalAttack', value: 4 }] });
        const d = computeEquipDelta(candidate, worn, buildPlayer());
        expect(d.mode).toBe('swap');
        expect(d.against).toEqual({ id: 'old', name: 'old' });
    });

    it('is empty when nothing changes (identical worn item, no player)', () => {
        const item = makeEquipment('plain');
        const d = computeEquipDelta(item, item);
        expect(d.mode).toBe('unequip');
        expect(d.isEmpty).toBe(true);
    });

    // ── Phase 19 — signet relic signature swap ────────────────────────────────
    it('surfaces the granted signature (with name) when equipping a signet relic', () => {
        const relic = makeEquipment('relic-x', { grantsSignature: 'sig-overwhelming-argument' });
        const d = computeEquipDelta(relic, null);
        expect(d.signatures.gained).toEqual([
            { id: 'sig-overwhelming-argument', name: 'The Stilling' },
        ]);
        expect(d.signatures.lost).toEqual([]);
        expect(d.isEmpty).toBe(false);
    });

    it('surfaces the lost signature when unequipping a signet relic', () => {
        const relic = makeEquipment('relic-x', { grantsSignature: 'sig-read-opponent' });
        const d = computeEquipDelta(relic, relic);
        expect(d.mode).toBe('unequip');
        expect(d.signatures.lost).toEqual([{ id: 'sig-read-opponent', name: 'Read the Entrails' }]);
        expect(d.signatures.gained).toEqual([]);
    });

    it('swapping two relics surfaces the gained and lost signatures', () => {
        const worn = makeEquipment('relic-a', { grantsSignature: 'sig-read-opponent' });
        const candidate = makeEquipment('relic-b', { grantsSignature: 'sig-second-wind' });
        const d = computeEquipDelta(candidate, worn);
        expect(d.mode).toBe('swap');
        expect(d.signatures.gained.map(s => s.id)).toEqual(['sig-second-wind']);
        expect(d.signatures.lost.map(s => s.id)).toEqual(['sig-read-opponent']);
    });

    it('a same-signature swap nets to no signature change', () => {
        const worn = makeEquipment('relic-a', { grantsSignature: 'sig-read-opponent' });
        const candidate = makeEquipment('relic-b', { grantsSignature: 'sig-read-opponent' });
        const d = computeEquipDelta(candidate, worn);
        expect(d.signatures.gained).toEqual([]);
        expect(d.signatures.lost).toEqual([]);
    });

    it('non-relic gear surfaces no signatures', () => {
        const d = computeEquipDelta(makeEquipment('plain-blade'), null);
        expect(d.signatures.gained).toEqual([]);
        expect(d.signatures.lost).toEqual([]);
    });
});
