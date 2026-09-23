/**
 * Hermetic engine test — the 11 signet relics (Phase 19; extended Phase 85).
 *
 * Locks the relic library invariants (roster, slot split, stat pool, default
 * loadout legality) and the `getSignaturesForLoadout` derivation that replaces
 * the retired archetype kit at combat-init.
 */

import { describe, it, expect } from 'vitest';
import {
    relicLibrary, getRelicById, getSignaturesForLoadout, cloneStartingRelics,
    DEFAULT_WORN_RELIC_IDS, BENCHED_RELIC_IDS,
} from '../relic.library';
import { SIGNATURE_SKILLS } from '../../Combat/combat.signature';
import { SLOT_CAPACITY } from '../types';
import type { SignatureSkillId } from '../../Combat/combat.encounter.types';
import { emptyLoadout } from '../../Character/types';

const ALL_SIGNATURE_IDS = Object.keys(SIGNATURE_SKILLS) as SignatureSkillId[];

describe('relic library — roster + slot split', () => {
    it('ships exactly 11 relics', () => {
        expect(relicLibrary).toHaveLength(11);
    });

    it('splits 2 weapon / 2 armor / 7 accessory', () => {
        const bySlot = (slot: string) => relicLibrary.filter(r => r.slot === slot);
        expect(bySlot('weapon')).toHaveLength(2);
        expect(bySlot('armor')).toHaveLength(2);
        expect(bySlot('accessory')).toHaveLength(7);
    });

    it('every accessory relic carries an accessoryKind; weapons/armor do not', () => {
        for (const r of relicLibrary) {
            if (r.slot === 'accessory') expect(r.accessoryKind).toBeDefined();
            else expect(r.accessoryKind).toBeUndefined();
        }
    });

    it('every relic grants exactly one signature; the 11 cover the full roster with no dupes', () => {
        const granted = relicLibrary.map(r => r.grantsSignature);
        expect(granted.every(Boolean)).toBe(true);
        expect(new Set(granted).size).toBe(11);
        expect([...granted].sort()).toEqual([...ALL_SIGNATURE_IDS].sort());
    });

    it('relics are the lean signet shape — only stat/signature fields (Phase 23)', () => {
        for (const r of relicLibrary) {
            // Phase 23 — the rarity / rolled-mod / affix / effect / proc / resource
            // fields are gone from the Equipment type entirely.
            const keys = Object.keys(r).sort();
            expect(keys).toEqual(
                (r.slot === 'accessory'
                    ? ['accessoryKind', 'category', 'description', 'grantsSignature', 'id', 'name', 'slot', 'statModifiers']
                    : ['category', 'description', 'grantsSignature', 'id', 'name', 'slot', 'statModifiers']),
            );
        }
    });

    it('stat pool is Body×2 (weapons), maxHp×2 (armor), Mind×3 + Heart×1 + Body×2 (accessories); the ring carries none', () => {
        const statOf = (id: string) => getRelicById(id)!.statModifiers![0];
        for (const r of relicLibrary) {
            if (r.id === 'relic-disarming-plea') {
                // Owner call 2026-09-23: the Suppliant's Ring grants ONLY its
                // signature (The Open Hand) — no stat bump at all.
                expect(r.statModifiers).toEqual([]);
                continue;
            }
            const mod = r.statModifiers![0];
            expect(r.statModifiers).toHaveLength(1);
            expect(mod.isMultiplier).toBe(false);
            if (r.slot === 'weapon') { expect(mod.stat).toBe('body'); expect(mod.value).toBe(2); }
            else if (r.slot === 'armor') { expect(mod.stat).toBe('maxHp'); expect(mod.value).toBe(5); }
            else { expect(['mind', 'heart', 'body']).toContain(mod.stat); expect(mod.value).toBe(2); }
        }
        // Phase 85 added a 3rd mind accessory (head) and 2 body accessories
        // (hands, feet) — closing the accessories' body-stat gap.
        const accStats = relicLibrary
            .filter(r => r.slot === 'accessory' && r.id !== 'relic-disarming-plea')
            .map(r => statOf(r.id).stat);
        expect(accStats.filter(s => s === 'mind')).toHaveLength(3);
        expect(accStats.filter(s => s === 'heart')).toHaveLength(1);
        expect(accStats.filter(s => s === 'body')).toHaveLength(2);
    });
});

describe('relic library — default loadout', () => {
    it('DEFAULT_WORN_RELIC_IDS is a legal loadout (1 weapon + 1 armor + 3 accessories)', () => {
        const worn = DEFAULT_WORN_RELIC_IDS.map(id => getRelicById(id)!);
        expect(worn.filter(r => r.slot === 'weapon')).toHaveLength(1);
        expect(worn.filter(r => r.slot === 'armor')).toHaveLength(1);
        expect(worn.filter(r => r.slot === 'accessory')).toHaveLength(SLOT_CAPACITY.accessory);
        expect(worn).toHaveLength(5);
    });

    it('the 6 benched relics are exactly the non-default weapon/armor/accessory', () => {
        expect(BENCHED_RELIC_IDS).toHaveLength(6);
        const overlap = BENCHED_RELIC_IDS.filter(id => DEFAULT_WORN_RELIC_IDS.includes(id));
        expect(overlap).toEqual([]);
        // Worn + benched partition the full 11.
        expect([...DEFAULT_WORN_RELIC_IDS, ...BENCHED_RELIC_IDS].sort())
            .toEqual(relicLibrary.map(r => r.id).sort());
    });

    it('cloneStartingRelics returns fresh, non-aliased objects in canonical worn order', () => {
        const a = cloneStartingRelics();
        const b = cloneStartingRelics();
        expect(a.worn).toHaveLength(5);
        expect(a.benched).toHaveLength(6);
        // canonical order: weapon, armor, then accessories.
        expect(a.worn.map(r => r.slot)).toEqual(['weapon', 'armor', 'accessory', 'accessory', 'accessory']);
        // Fresh objects each call (equipping must not mutate the singleton library).
        expect(a.worn[0]).not.toBe(b.worn[0]);
        const singleton = getRelicById(a.worn[0].id);
        expect(a.worn[0]).not.toBe(singleton);
    });
});

describe('getSignaturesForLoadout', () => {
    it('derives the 5 default-worn signatures in slot order (weapon, armor, accessories)', () => {
        const { worn } = cloneStartingRelics();
        const loadout = {
            weapon: worn.find(r => r.slot === 'weapon')!,
            armor: worn.find(r => r.slot === 'armor')!,
            accessories: worn.filter(r => r.slot === 'accessory'),
        };
        // Owner call 2026-07-18: Press Fate rides the default loadout (Gambler's
        // Knot in, Venom Sigil benched) so every starter owns the whiff valve.
        expect(getSignaturesForLoadout(loadout)).toEqual([
            'sig-overwhelming-argument', 'sig-read-opponent',
            'sig-clever-gambit', 'sig-disarming-plea', 'sig-press-the-point',
        ]);
    });

    it('returns [] for an empty loadout (combat may legally begin signature-less)', () => {
        expect(getSignaturesForLoadout(emptyLoadout())).toEqual([]);
    });

    it('dedupes when two worn pieces grant the same signature (first occurrence wins)', () => {
        const overwhelming = getRelicById('relic-overwhelming')!;
        const loadout = { weapon: overwhelming, armor: null, accessories: [{ ...overwhelming, id: 'dup', slot: 'accessory' as const, accessoryKind: 'charm' as const }] };
        expect(getSignaturesForLoadout(loadout)).toEqual(['sig-overwhelming-argument']);
    });

    it('ignores non-relic worn pieces (no grantsSignature)', () => {
        const plainWeapon = { ...getRelicById('relic-overwhelming')!, id: 'plain', grantsSignature: undefined };
        expect(getSignaturesForLoadout({ weapon: plainWeapon, armor: null, accessories: [] })).toEqual([]);
    });
});
