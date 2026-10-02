/**
 * Hermetic engine test — the relic library (one row: the Suppliant's Ring).
 *
 * Locks the library invariants (roster, shape, no stat line), the
 * `cloneStartingRelics` seed and the `getSignaturesForLoadout` derivation
 * that supplies the signature kit at combat-init.
 */

import { describe, it, expect } from 'vitest';
import {
    relicLibrary, getRelicById, getSignaturesForLoadout, cloneStartingRelics,
} from '../relic.library';
import { SIGNATURE_SKILLS } from '../../Combat/combat.signature';
import type { SignatureSkillId } from '../../Combat/combat.encounter.types';
import { emptyLoadout } from '../../Character/types';
import { FIXTURE_WEAPON, FIXTURE_ARMOR, FIXTURE_TRINKETS } from '../../Game/fixtures';

const ALL_SIGNATURE_IDS = Object.keys(SIGNATURE_SKILLS) as SignatureSkillId[];
const RING_ID = 'relic-disarming-plea';

describe('relic library — roster', () => {
    it('ships exactly one relic, the Suppliant\'s Ring', () => {
        expect(relicLibrary.map(r => r.id)).toEqual([RING_ID]);
        const ring = getRelicById(RING_ID)!;
        expect(ring.name).toBe("Suppliant's Ring");
        expect(ring.slot).toBe('accessory');
        expect(ring.accessoryKind).toBe('ring');
    });

    it('every relic grants exactly one signature; together they cover the full roster with no dupes', () => {
        const granted = relicLibrary.map(r => r.grantsSignature);
        expect(granted.every(Boolean)).toBe(true);
        expect(new Set(granted).size).toBe(relicLibrary.length);
        expect([...granted].sort()).toEqual([...ALL_SIGNATURE_IDS].sort());
        expect(getRelicById(RING_ID)!.grantsSignature).toBe('sig-disarming-plea');
    });

    it('relics are the lean signet shape — only stat/signature fields (Phase 23)', () => {
        for (const r of relicLibrary) {
            const keys = Object.keys(r).sort();
            expect(keys).toEqual(
                (r.slot === 'accessory'
                    ? ['accessoryKind', 'category', 'description', 'grantsSignature', 'id', 'name', 'slot', 'statModifiers']
                    : ['category', 'description', 'grantsSignature', 'id', 'name', 'slot', 'statModifiers']),
            );
        }
    });

    it('the ring carries no stat line — it grants only its signature', () => {
        for (const r of relicLibrary) expect(r.statModifiers, r.id).toEqual([]);
    });

    it('resolves an unknown or deleted relic id to undefined', () => {
        expect(getRelicById('relic-overwhelming')).toBeUndefined();
        expect(getRelicById('nope')).toBeUndefined();
    });
});

describe('cloneStartingRelics', () => {
    it('returns the whole library as fresh, non-aliased clones', () => {
        const a = cloneStartingRelics();
        const b = cloneStartingRelics();
        expect(a.map(r => r.id)).toEqual(relicLibrary.map(r => r.id));
        expect(a).toEqual([...relicLibrary]);
        // Fresh objects each call (equipping must not mutate the singleton library).
        expect(a[0]).not.toBe(b[0]);
        expect(a[0]).not.toBe(getRelicById(a[0].id));
        expect(a[0].statModifiers).not.toBe(getRelicById(a[0].id)!.statModifiers);
    });
});

describe('getSignaturesForLoadout', () => {
    it('derives the ring\'s signature from a worn ring', () => {
        const loadout = { weapon: null, armor: null, accessories: cloneStartingRelics() };
        expect(getSignaturesForLoadout(loadout)).toEqual(['sig-disarming-plea']);
    });

    it('returns [] for an empty loadout (combat may legally begin signature-less)', () => {
        expect(getSignaturesForLoadout(emptyLoadout())).toEqual([]);
    });

    it('dedupes when two worn pieces grant the same signature (first occurrence wins)', () => {
        const ring = getRelicById(RING_ID)!;
        const loadout = { weapon: null, armor: null, accessories: [ring, { ...ring, id: 'dup' }] };
        expect(getSignaturesForLoadout(loadout)).toEqual(['sig-disarming-plea']);
    });

    it('reads the signature from any slot (a weapon-slot carrier counts)', () => {
        const ringAsWeapon = { ...FIXTURE_WEAPON, grantsSignature: 'sig-disarming-plea' as const };
        expect(getSignaturesForLoadout({ weapon: ringAsWeapon, armor: null, accessories: [] }))
            .toEqual(['sig-disarming-plea']);
    });

    it('ignores non-relic worn pieces (no grantsSignature)', () => {
        expect(getSignaturesForLoadout({
            weapon: FIXTURE_WEAPON, armor: FIXTURE_ARMOR, accessories: [...FIXTURE_TRINKETS],
        })).toEqual([]);
    });
});
