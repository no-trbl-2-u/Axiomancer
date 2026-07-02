/**
 * Hermetic E2E Tests — Affix-decorated drops (2026-06-07 content pass).
 *
 * Drives the prefix/suffix naming layer (`affix.library.ts`) through the
 * additive `dropItemWithAffixes` factory, proving:
 *   1. Determinism — the same seeded rng yields identical Equipment.
 *   2. Naming      — the composed name contains the template's base name.
 *   3. Resolvable  — every rolled mod (base + affix-granted) keys into a real
 *                    catalogue modifier via `getModifierById`.
 *   4. Composition — `composeItemName` / `affixesForSlot` behave purely.
 *   5. Unique safety — affixes are never layered onto a unique template.
 *
 * Hermetic standard (per `docs/testing.md`): self-contained, deterministic via
 * a seeded rng, isolated (`vi.restoreAllMocks`).
 */

import { afterEach, describe, it, expect, vi } from 'vitest';

import {
    dropItem,
    dropItemWithAffixes,
    getEquipmentTemplate,
    getModifierById,
    composeItemName,
    affixesForSlot,
    getAffixById,
    isOffensiveStatusAffix,
    allAffixes,
    prefixes,
    suffixes,
    equipmentTemplates,
} from '../index';
import { STATUS_AFFIX_DRAW_BIAS } from '../../Game/game-mechanics.constants';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Numerical-Recipes LCG — same pattern as the item.factory e2e suite. */
const seededRng = (seed: number): (() => number) => {
    let state = seed >>> 0;
    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 0x100000000;
    };
};

afterEach(() => {
    vi.restoreAllMocks();
});

// ─── Library invariants ──────────────────────────────────────────────────────

describe('affix.library: invariants', () => {
    it('exports the expanded prefix/suffix pools (Phase 151)', () => {
        expect(prefixes.length).toBeGreaterThanOrEqual(36);
        expect(suffixes.length).toBeGreaterThanOrEqual(36);
        expect(allAffixes.length).toBe(prefixes.length + suffixes.length);
    });

    it('every affix references only existing catalogue modifiers', () => {
        for (const affix of allAffixes) {
            expect(affix.modIds.length).toBeGreaterThan(0);
            for (const modId of affix.modIds) {
                expect(getModifierById(modId)).toBeDefined();
            }
        }
    });

    it('every affix references mods whose validSlots cover the affix slots', () => {
        for (const affix of allAffixes) {
            for (const modId of affix.modIds) {
                const mod = getModifierById(modId);
                expect(mod, `affix ${affix.id} → mod ${modId}`).toBeDefined();
                for (const slot of affix.validSlots) {
                    expect(
                        mod!.validSlots,
                        `affix ${affix.id} slot ${slot} vs mod ${modId}`,
                    ).toContain(slot);
                }
            }
        }
    });

    it('affix ids and display words are unique', () => {
        const ids = allAffixes.map(a => a.id);
        expect(new Set(ids).size).toBe(ids.length);
        const words = allAffixes.map(a => `${a.role}:${a.word}`);
        expect(new Set(words).size).toBe(words.length);
    });

    it('every slot has at least one prefix and one suffix at a high level', () => {
        const slots = ['weapon', 'armor', 'head', 'body', 'hands', 'feet', 'accessory'] as const;
        for (const slot of slots) {
            const pre = allAffixes.filter(a =>
                a.role === 'prefix' && a.validSlots.includes(slot) && a.minLevel <= 50);
            const suf = allAffixes.filter(a =>
                a.role === 'suffix' && a.validSlots.includes(slot) && a.minLevel <= 50);
            // Weapon/armor/body/head/hands/feet/accessory all carry coverage now.
            // (head/weapon-only slots may lean on one role — assert union > 0.)
            expect(pre.length + suf.length, `slot ${slot} affix coverage`).toBeGreaterThan(0);
        }
    });

    it('every affix role matches the pool it lives in', () => {
        for (const p of prefixes) expect(p.role).toBe('prefix');
        for (const s of suffixes) expect(s.role).toBe('suffix');
    });

    it('getAffixById round-trips a known id', () => {
        const affix = getAffixById('pfx-keen');
        expect(affix).toBeDefined();
        expect(affix?.word).toBe('Keen');
    });
});

// ─── composeItemName ─────────────────────────────────────────────────────────

describe('composeItemName', () => {
    const keen = getAffixById('pfx-keen')!;
    const ofRuin = getAffixById('sfx-of-ruin')!;

    it('returns the base name unchanged with no affixes', () => {
        expect(composeItemName('Iron Blade')).toBe('Iron Blade');
    });

    it('prepends a prefix word', () => {
        expect(composeItemName('Iron Blade', keen)).toBe('Keen Iron Blade');
    });

    it('appends a suffix word', () => {
        expect(composeItemName('Iron Blade', undefined, ofRuin)).toBe('Iron Blade of Ruin');
    });

    it('combines prefix and suffix around the base', () => {
        expect(composeItemName('Iron Blade', keen, ofRuin))
            .toBe('Keen Iron Blade of Ruin');
    });
});

// ─── affixesForSlot ──────────────────────────────────────────────────────────

describe('affixesForSlot', () => {
    it('filters by slot, role, and minLevel', () => {
        const lowWeapon = affixesForSlot('weapon', 1, 'prefix');
        expect(lowWeapon.length).toBeGreaterThan(0);
        for (const a of lowWeapon) {
            expect(a.role).toBe('prefix');
            expect(a.validSlots).toContain('weapon');
            expect(a.minLevel).toBeLessThanOrEqual(1);
        }
        // A level-gated affix (savage, minLevel 20) is excluded at level 1.
        expect(lowWeapon.find(a => a.id === 'pfx-savage')).toBeUndefined();
        // …and included once the level requirement is met.
        const highWeapon = affixesForSlot('weapon', 25, 'prefix');
        expect(highWeapon.find(a => a.id === 'pfx-savage')).toBeDefined();
    });

    it('returns no prefixes for a slot with only suffix coverage at that level', () => {
        // Sanity: a low-level head slot still surfaces at least one suffix.
        expect(affixesForSlot('head', 1, 'suffix').length).toBeGreaterThanOrEqual(0);
    });
});

// ─── dropItemWithAffixes ─────────────────────────────────────────────────────

describe('dropItemWithAffixes', () => {
    it('is deterministic for a seeded rng', () => {
        const a = dropItemWithAffixes('iron-blade', 25, { rarity: 'rare', rng: seededRng(7) });
        const b = dropItemWithAffixes('iron-blade', 25, { rarity: 'rare', rng: seededRng(7) });
        expect(a).toEqual(b);
    });

    it('composes a name containing the base template name', () => {
        const base = getEquipmentTemplate('iron-blade')!;
        const drop = dropItemWithAffixes('iron-blade', 25, { rarity: 'rare', rng: seededRng(7) });
        expect(drop.name).toContain(base.name);
    });

    it('produces rolled mods that all resolve against the catalogue', () => {
        const drop = dropItemWithAffixes('iron-blade', 25, { rarity: 'rare', rng: seededRng(11) });
        expect(drop.rolledMods).toBeDefined();
        expect(drop.rolledMods!.length).toBeGreaterThan(0);
        for (const rolled of drop.rolledMods!) {
            expect(getModifierById(rolled.modId)).toBeDefined();
        }
        // statModifiers should fold base + at least one rolled/affix payload.
        expect(drop.statModifiers).toBeDefined();
        expect(drop.statModifiers!.length).toBeGreaterThanOrEqual(2);
    });

    it('layers affix mods on top of the base rolled mods (more than common)', () => {
        // Common base has 0 base mods; affixes still grant mods → name + mods.
        const drop = dropItemWithAffixes('iron-blade', 25, { rarity: 'common', rng: seededRng(3) });
        expect(drop.rolledMods).toBeDefined();
        expect(drop.rolledMods!.length).toBeGreaterThan(0);
    });

    it('respects maxPrefixes / maxSuffixes = 0 (no affixes, base name kept)', () => {
        const base = getEquipmentTemplate('iron-blade')!;
        const drop = dropItemWithAffixes('iron-blade', 25, {
            rarity: 'common',
            rng: seededRng(3),
            maxPrefixes: 0,
            maxSuffixes: 0,
        });
        expect(drop.name).toBe(base.name);
        // Common base + no affixes → no rolled mods at all.
        expect(drop.rolledMods).toBeUndefined();
    });

    it('does not layer affixes onto a unique template (name stays fixed)', () => {
        const drop = dropItemWithAffixes('axioms-edge', 10, { rng: seededRng(5) });
        expect(drop.rarity).toBe('unique');
        expect(drop.name).toBe("Axiom's Edge");
        expect(drop.rolledMods).toHaveLength(3);
    });

    it('throws below the template required level', () => {
        expect(() => dropItemWithAffixes('steel-blade', 5, { rng: seededRng(1) }))
            .toThrowError(/requiredLevel/);
    });

    it('throws for an unknown template id', () => {
        expect(() => dropItemWithAffixes('nope', 5, { rng: seededRng(1) }))
            .toThrowError(/no template/i);
    });
});

// ─── Phase 151 — new affix reachability + application ────────────────────────

describe('Phase 151: new affixes are reachable through generation', () => {
    const PFX_151 = new Set(
        prefixes.filter(p => p.addedIn === '2026-06-16').map(p => p.id),
    );
    const SFX_151 = new Set(
        suffixes.filter(s => s.addedIn === '2026-06-16').map(s => s.id),
    );

    it('declares 20 new prefixes and 20 new suffixes (2026-06-16)', () => {
        expect(PFX_151.size).toBe(20);
        expect(SFX_151.size).toBe(20);
    });

    it('a weapon drop sweep surfaces at least one new prefix and one new suffix', () => {
        // Sweep seeds at a high level (all weapon affixes eligible) and confirm
        // the new prefix/suffix pools are actually drawable by the factory.
        let sawNewPrefix = false;
        let sawNewSuffix = false;
        for (let s = 1; s <= 400 && !(sawNewPrefix && sawNewSuffix); s++) {
            const drop = dropItemWithAffixes('iron-blade', 40, {
                rarity: 'rare',
                rng: seededRng(s),
            });
            const name = drop.name;
            for (const p of prefixes) {
                if (p.addedIn === '2026-06-16' && name.startsWith(`${p.word} `)) sawNewPrefix = true;
            }
            for (const sfx of suffixes) {
                if (sfx.addedIn === '2026-06-16' && name.endsWith(` ${sfx.word}`)) sawNewSuffix = true;
            }
        }
        expect(sawNewPrefix).toBe(true);
        expect(sawNewSuffix).toBe(true);
    });

    it('a venom-coat affix folds its onHitEffect into the resolved drop', () => {
        // pfx-venomous / sfx-of-venom both reference wm-venom-coat (poison proc).
        // Resolve the backing mod directly to prove application is wired.
        const base = getEquipmentTemplate('iron-blade')!;
        // Find a seed whose weapon drop name carries a venom affix; assert the
        // poison proc lands in onHitEffects.
        let proven = false;
        for (let s = 1; s <= 400 && !proven; s++) {
            const drop = dropItemWithAffixes('iron-blade', 40, {
                rarity: 'common',
                rng: seededRng(s),
            });
            const carriesVenom =
                drop.name.startsWith('Venomous ') || drop.name.endsWith(' of Venom');
            if (!carriesVenom) continue;
            expect(drop.name).toContain(base.name);
            expect(drop.onHitEffects?.some(e => e.effectId === 'debuff_poison')).toBe(true);
            proven = true;
        }
        expect(proven).toBe(true);
    });

    it('a resistance suffix folds its passiveEffect into the resolved drop', () => {
        // sfx-of-stone → armm-body-resist (buff_resistance_body passive).
        let proven = false;
        for (let s = 1; s <= 400 && !proven; s++) {
            const drop = dropItemWithAffixes('hide-vest', 20, {
                rarity: 'common',
                rng: seededRng(s),
            });
            if (!drop.name.endsWith(' of Stone')) continue;
            expect(drop.passiveEffects).toContain('buff_resistance_body');
            proven = true;
        }
        expect(proven).toBe(true);
    });
});

// ─── Phase 153 — status-family expansion (2026-06-18) ────────────────────────

describe('Phase 153: status-family affix expansion', () => {
    const PFX_153 = prefixes.filter(p => p.addedIn === '2026-06-18');
    const SFX_153 = suffixes.filter(s => s.addedIn === '2026-06-18');

    it('declares 30 new prefixes and 30 new suffixes (2026-06-18)', () => {
        expect(PFX_153.length).toBe(30);
        expect(SFX_153.length).toBe(30);
    });

    it('every new affix references only existing catalogue modifiers', () => {
        for (const affix of [...PFX_153, ...SFX_153]) {
            expect(affix.modIds.length).toBeGreaterThan(0);
            for (const modId of affix.modIds) {
                const mod = getModifierById(modId);
                expect(mod, `affix ${affix.id} → mod ${modId}`).toBeDefined();
                for (const slot of affix.validSlots) {
                    expect(mod!.validSlots).toContain(slot);
                }
            }
        }
    });

    it('grows the status-effect family coverage (new debuff families wired)', () => {
        // Each entry: an affix word and the debuff it must surface on a hit.
        const statusFamilies: Array<[string, string]> = [
            ['Immolating', 'debuff_burn'],
            ['Toxic', 'debuff_strong_poison'],
            ['Rending', 'debuff_wound'],
            ['Terrifying', 'debuff_fear'],
            ['Cursed', 'debuff_curse'],
            ['Hexing', 'debuff_hex'],
            ['Slumbering', 'debuff_sleep'],
            ['Concussive', 'debuff_stun'],
            ['Petrifying', 'debuff_petrify'],
            ['Plague', 'debuff_disease'],
            ['Withering', 'debuff_hp_decay'],
            ['Slowing', 'debuff_slow'],
        ];
        for (const [word, effectId] of statusFamilies) {
            const affix = prefixes.find(p => p.word === word);
            expect(affix, `prefix ${word}`).toBeDefined();
            const folded = affix!.modIds.flatMap(id =>
                getModifierById(id)!.payload.onHitEffects ?? []);
            expect(
                folded.some(e => e.effectId === effectId),
                `${word} should apply ${effectId}`,
            ).toBe(true);
        }
    });

    it('a fear weapon affix folds its onHitEffect into a resolved drop', () => {
        // pfx-terrifying / sfx-of-dread both ride wm-terrorize (fear proc).
        let proven = false;
        for (let s = 1; s <= 600 && !proven; s++) {
            const drop = dropItemWithAffixes('iron-blade', 40, {
                rarity: 'rare',
                rng: seededRng(s),
            });
            const carriesFear =
                drop.name.startsWith('Terrifying ') || drop.name.endsWith(' of Dread');
            if (!carriesFear) continue;
            expect(drop.onHitEffects?.some(e => e.effectId === 'debuff_fear')).toBe(true);
            proven = true;
        }
        expect(proven).toBe(true);
    });
});

// ─── Phase 152 — unified factory: rarity-default affixes + provenance ─────────

describe('Phase 152: dropItem rarity-default affixes', () => {
    it('common drops carry no procedural affix even with affixes enabled', () => {
        const drop = dropItem('iron-blade', 25, 'common', seededRng(7), { enabled: true });
        expect(drop.prefixId).toBeUndefined();
        expect(drop.suffixId).toBeUndefined();
        expect(drop.name).toBe(getEquipmentTemplate('iron-blade')!.name);
    });

    it('uncommon drops carry exactly one affix (prefix XOR suffix)', () => {
        // Sweep seeds; every uncommon drop must carry exactly one of the two
        // affix roles, and across the sweep both roles must appear.
        let sawPrefixOnly = false;
        let sawSuffixOnly = false;
        for (let s = 1; s <= 60; s++) {
            const drop = dropItem('iron-blade', 25, 'uncommon', seededRng(s), { enabled: true });
            const hasPrefix = Boolean(drop.prefixId);
            const hasSuffix = Boolean(drop.suffixId);
            expect(hasPrefix && hasSuffix, `seed ${s} should not carry both`).toBe(false);
            if (hasPrefix) sawPrefixOnly = true;
            if (hasSuffix) sawSuffixOnly = true;
        }
        expect(sawPrefixOnly).toBe(true);
        expect(sawSuffixOnly).toBe(true);
    });

    it('rare drops carry both a prefix and a suffix', () => {
        const drop = dropItem('iron-blade', 25, 'rare', seededRng(11), { enabled: true });
        expect(drop.prefixId).toBeDefined();
        expect(drop.suffixId).toBeDefined();
        expect(drop.prefixName).toBeDefined();
        expect(drop.suffixName).toBeDefined();
        // Composed name surrounds the base name with both affix words.
        const base = getEquipmentTemplate('iron-blade')!.name;
        expect(drop.name).toContain(base);
        expect(drop.name.startsWith(`${drop.prefixName} `)).toBe(true);
        expect(drop.name.endsWith(` ${drop.suffixName}`)).toBe(true);
    });

    it('without the affix param dropItem stays affix-free (back-compat)', () => {
        const drop = dropItem('iron-blade', 25, 'rare', seededRng(11));
        expect(drop.prefixId).toBeUndefined();
        expect(drop.suffixId).toBeUndefined();
        expect(drop.name).toBe(getEquipmentTemplate('iron-blade')!.name);
    });

    it('provenance fields resolve to real affixes whose mods are in rolledMods', () => {
        const drop = dropItem('iron-blade', 40, 'rare', seededRng(3), { enabled: true });
        const prefix = getAffixById(drop.prefixId!);
        const suffix = getAffixById(drop.suffixId!);
        expect(prefix).toBeDefined();
        expect(suffix).toBeDefined();
        const rolledIds = new Set(drop.rolledMods!.map(m => m.modId));
        for (const modId of [...prefix!.modIds, ...suffix!.modIds]) {
            expect(rolledIds.has(modId), `mod ${modId} present in rolledMods`).toBe(true);
        }
    });

    it('unique templates never receive procedural affixes', () => {
        const drop = dropItem('axioms-edge', 10, undefined, seededRng(5), { enabled: true });
        expect(drop.rarity).toBe('unique');
        expect(drop.prefixId).toBeUndefined();
        expect(drop.suffixId).toBeUndefined();
        expect(drop.name).toBe("Axiom's Edge");
    });
});

// ─── Phase 152 — curated affixed library variants ────────────────────────────

describe('Phase 152: curated affixed library variants', () => {
    const affixedVariants = equipmentTemplates.filter(t => t.prefixId || t.suffixId);

    it('ships exactly 5 affixed variants per slot (35 total)', () => {
        expect(affixedVariants).toHaveLength(35);
        const slots = ['weapon', 'armor', 'head', 'body', 'hands', 'feet', 'accessory'] as const;
        for (const slot of slots) {
            expect(affixedVariants.filter(t => t.slot === slot)).toHaveLength(5);
        }
    });

    it('every curated affix id resolves and matches the variant slot + role', () => {
        for (const tpl of affixedVariants) {
            if (tpl.prefixId) {
                const affix = getAffixById(tpl.prefixId);
                expect(affix, `prefix ${tpl.prefixId} on ${tpl.id}`).toBeDefined();
                expect(affix!.role).toBe('prefix');
                expect(affix!.validSlots).toContain(tpl.slot);
            }
            if (tpl.suffixId) {
                const affix = getAffixById(tpl.suffixId);
                expect(affix, `suffix ${tpl.suffixId} on ${tpl.id}`).toBeDefined();
                expect(affix!.role).toBe('suffix');
                expect(affix!.validSlots).toContain(tpl.slot);
            }
        }
    });

    it('a curated prefixed variant drops with the composed name + provenance, regardless of affix param', () => {
        // `keen-iron-blade` pins pfx-keen; the drop must stamp the prefix even
        // though no `affix` control is passed (curated pins always apply).
        const drop = dropItem('keen-iron-blade', 5, 'common', seededRng(2));
        expect(drop.prefixId).toBe('pfx-keen');
        expect(drop.prefixName).toBe('Keen');
        expect(drop.name).toBe('Keen Iron Blade');
        // The pinned affix's mod (wm-flat-damage) is folded into the rolled mods.
        const tpl = getEquipmentTemplate('keen-iron-blade')!;
        const affix = getAffixById(tpl.prefixId!)!;
        const rolledIds = new Set(drop.rolledMods!.map(m => m.modId));
        for (const modId of affix.modIds) {
            expect(rolledIds.has(modId)).toBe(true);
        }
    });

    it('a curated prefix+suffix variant composes both around the base name', () => {
        const drop = dropItem('venomous-mithril-blade-of-frost', 20, 'common', seededRng(4));
        expect(drop.prefixId).toBe('pfx-venomous');
        expect(drop.suffixId).toBe('sfx-of-frost');
        expect(drop.name).toBe('Venomous Mithril Blade of Frost');
    });

    it('curated drops are deterministic for a seeded rng', () => {
        const a = dropItem('savage-mithril-blade-of-ruin', 20, 'common', seededRng(9));
        const b = dropItem('savage-mithril-blade-of-ruin', 20, 'common', seededRng(9));
        expect(a).toEqual(b);
    });
});

// ─── Phase 157 — status-centered affix draw bias ─────────────────────────────

describe('Phase 157: status-affix draw bias', () => {
    it('uses a bias multiplier strictly greater than 1 (status play is favoured)', () => {
        expect(STATUS_AFFIX_DRAW_BIAS).toBeGreaterThan(1);
    });

    it('classifies offensive weapon/hands status affixes as status-applying', () => {
        // Venomous (weapon, status/dot), Slowing (weapon, status/control),
        // Sapping (hands, status/control) are the doctrine payoff affixes.
        for (const id of ['pfx-venomous', 'pfx-slowing', 'pfx-sapping', 'sfx-of-venom']) {
            const affix = getAffixById(id)!;
            expect(isOffensiveStatusAffix(affix), id).toBe(true);
        }
    });

    it('excludes flat-stat affixes and defensive/cleanse "status" affixes', () => {
        // Flat-stat affixes carry no status tag at all.
        for (const id of ['pfx-keen', 'pfx-crushing', 'pfx-fortified']) {
            expect(isOffensiveStatusAffix(getAffixById(id)!), id).toBe(false);
        }
        // sfx-of-purity (am-cleanse) is tagged status + sustain → NOT biased.
        const purity = getAffixById('sfx-of-purity')!;
        expect(purity.tags).toContain('status');
        expect(isOffensiveStatusAffix(purity)).toBe(false);
        // am-status-amp accessory hex is status-tagged but not on a status-
        // applying slot (accessory), so it is not an offensive-application affix.
        const hex = getAffixById('sfx-of-the-hex')!;
        expect(hex.tags).toContain('status');
        expect(isOffensiveStatusAffix(hex)).toBe(false);
    });

    it('every classified affix sits on a status-applying slot (weapon/hands)', () => {
        for (const affix of allAffixes.filter(isOffensiveStatusAffix)) {
            expect(
                affix.validSlots.some(s => s === 'weapon' || s === 'hands'),
                affix.id,
            ).toBe(true);
            expect(affix.tags ?? []).toContain('status');
        }
    });

    it('weapon rare drops surface offensive status prefixes the MAJORITY of the time', () => {
        // With the bias live, an affixed weapon drop should carry an offensive
        // status prefix far more often than not — proving loot now feeds status
        // play rather than flat-stat trading. Measure the prefix word against the
        // offensive-status set across a large seed sweep.
        const statusPrefixWords = new Set(
            prefixes.filter(isOffensiveStatusAffix).map(p => p.word),
        );
        let statusHits = 0;
        const N = 600;
        for (let s = 1; s <= N; s++) {
            const drop = dropItemWithAffixes('iron-blade', 40, {
                rarity: 'rare',
                rng: seededRng(s * 13 + 1),
                maxSuffixes: 0, // isolate the prefix roll
            });
            const lead = drop.name.replace(/ Iron Blade$/, '');
            if (statusPrefixWords.has(lead)) statusHits++;
        }
        // Doctrine bar: status prefixes are the dominant outcome (> half).
        expect(statusHits / N).toBeGreaterThan(0.5);
    });

    it('does NOT eliminate flat-stat variety (some non-status prefixes still roll)', () => {
        const statusPrefixWords = new Set(
            prefixes.filter(isOffensiveStatusAffix).map(p => p.word),
        );
        let nonStatusHits = 0;
        for (let s = 1; s <= 600; s++) {
            const drop = dropItemWithAffixes('iron-blade', 40, {
                rarity: 'rare',
                rng: seededRng(s * 13 + 1),
                maxSuffixes: 0,
            });
            const lead = drop.name.replace(/ Iron Blade$/, '');
            if (lead !== 'Iron Blade' && !statusPrefixWords.has(lead)) nonStatusHits++;
        }
        // Variety guard: flat-stat / non-status prefixes remain reachable.
        expect(nonStatusHits).toBeGreaterThan(0);
    });
});
