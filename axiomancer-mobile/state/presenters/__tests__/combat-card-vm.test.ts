/**
 * Hermetic unit tests for the honest card view-model helpers
 * (engineHonestKind / resolvePrimary / faceStats / detailStats / armedReadValue).
 *
 * Fixtures are the four verified sample cards from the card-rework design spec,
 * read live from the installed engine so the assertions stay true to real data:
 *   - slippery-slope    Bleed 2× dur3 (dpr 3)  → 6/t·3t = 18
 *   - brace-for-impact  Guard 12               → free Guard 6
 *   - eternal-recurrence Regen 3× dur4 (dpr 4) → 12/t·4t = 48, free 4/t·6t = 24
 *   - buridans-impasse  Stun dur2              → skip 2t
 *   - achilles-gambit   Strike                 → no fabricated number
 *
 * Core invariant under test: real-units-or-no-number (never a fabricated value),
 * and face↔detail numbers agree.
 */

import { describe, it, expect } from '@jest/globals';
import { getCard, getSkillById } from 'axiomancer-mechanics';
import {
    faceStats, detailStats, engineHonestKind, resolvePrimary, armedReadValue,
} from '@/state/presenters/combat-encounter.engine';

const cardOf = (id: string) => {
    const card = getCard(id);
    if (!card) throw new Error(`fixture card missing: ${id}`);
    const skill = card.skillId ? getSkillById(card.skillId) : undefined;
    return { card, skill };
};

describe('engineHonestKind — the honesty gate', () => {
    it('classifies DoT / stun / regen / weaken / vulnerable / thorns', () => {
        expect(engineHonestKind('debuff_bleed')).toBe('dot');
        expect(engineHonestKind('debuff_stun')).toBe('stun');
        expect(engineHonestKind('buff_regeneration')).toBe('regen');
        expect(engineHonestKind('debuff_slow')).toBe('weaken');             // negative roll mod (0.33.0 de-inert)
        expect(engineHonestKind('debuff_confusion')).toBe('weaken');
        expect(engineHonestKind('debuff_vulnerable')).toBe('vulnerable');   // 0.34.0: damageTakenMult is now real
        expect(engineHonestKind('debuff_vulnerability_body')).toBe('vulnerable'); // now carries damageTakenMult
        expect(engineHonestKind('buff_brazen_thorns')).toBe('thorns');      // 0.34.0: reflectDamage is now real
        expect(engineHonestKind(null)).toBeNull();
    });
});

describe('faceStats — honest real-unit faces', () => {
    it('Slippery Slope (Bleed) → 18 total · 6/turn · 3 turns, FREE 2 HP', () => {
        const { card, skill } = cardOf('slippery-slope');
        const f = faceStats(card, skill);
        expect(f.kind).toBe('dot');
        expect(f.keyword).toBe('BLEED');
        expect(f.heroText).toBe('18');
        expect(f.heroSub).toBe('over 3 turns');
        expect(f.freeHeroText).toBe('2 HP');
        expect(f.readDependent).toBe(true);   // the read now scales status (depth epic)
        expect(f.statusBase).toBe(18);
        expect(f.inert).toBe(false);
    });
    it('Brace for Impact (Guard) → Guard 12, FREE Guard 6, read-dependent', () => {
        const { card, skill } = cardOf('brace-for-impact');
        const f = faceStats(card, skill);
        expect(f.kind).toBe('guard');
        expect(f.heroText).toBe('Guard 12');
        expect(f.freeHeroText).toBe('Guard 6');
        expect(f.readDependent).toBe(true);
        expect(f.guardBase).toBe(12);
    });
    it('Eternal Recurrence (Regen) → 48 total · 12/turn · 4 turns, FREE 24', () => {
        const { card, skill } = cardOf('eternal-recurrence');
        const f = faceStats(card, skill);
        expect(f.kind).toBe('regen');
        expect(f.heroText).toBe('48');
        expect(f.heroSub).toBe('over 4 turns');
        expect(f.freeHeroText).toBe('24');
        expect(f.freeHeroSub).toBe('4/turn · 6 turns');
    });
    it("Buridan's Impasse (Stun) → skip 2t", () => {
        const { card, skill } = cardOf('buridans-impasse');
        const f = faceStats(card, skill);
        expect(f.kind).toBe('stun');
        expect(f.heroText).toBe('skip 2 turns');
    });
    it('Achilles Gambit (Strike) → no fabricated number', () => {
        const { card, skill } = cardOf('achilles-gambit');
        const f = faceStats(card, skill);
        expect(f.kind).toBe('strike');
        expect(f.heroText).toBe('');               // real-units-or-no-number
        expect(f.freeHeroText).toBe('small chip');
        expect(f.readDependent).toBe(true);
    });
});

describe('detailStats — same numbers as the face', () => {
    it('Slippery Slope outcome + stats + math all agree on 18', () => {
        const { card, skill } = cardOf('slippery-slope');
        const d = detailStats(card, skill);
        expect(d.outcomeLine).toBe('Apply Bleed 18 over 3 turns.');
        expect(d.outcomeStats).toEqual([
            { label: 'PER TURN', value: '6' },
            { label: 'TURNS', value: '3' },
            { label: 'TOTAL', value: '18' },
        ]);
        expect(d.stacksText).toBe('Stacks up to 10×.');
        expect(d.mathLine).toContain('3 base × 2 intensity');
        // §C: the +DIE read triplet surfaces the status read scaling, base = 18.
        expect(d.diePill).toMatch(/^▲\d+ · —18 · ▼\d+$/);
        expect(d.diePillKeyword).toBe('BLEED');
    });
    it('Eternal Recurrence shows the 48 power total and the 24 FREE total', () => {
        const { card, skill } = cardOf('eternal-recurrence');
        const d = detailStats(card, skill);
        expect(d.outcomeLine).toContain('48 over');
        expect(d.mathLine).toContain('24');
    });
    it('Brace for Impact (Guard) → terse "Gain Guard 12."', () => {
        const { card, skill } = cardOf('brace-for-impact');
        const d = detailStats(card, skill);
        expect(d.outcomeLine).toBe('Gain Guard 12.');
        expect(d.stacksText).toBeNull();
    });
});

describe('resolvePrimary + armedReadValue', () => {
    it('resolvePrimary routes by verb-class + honesty', () => {
        expect(resolvePrimary(getCard('brace-for-impact')!, getSkillById('brace-for-impact')).kind).toBe('guard');
        expect(resolvePrimary(getCard('achilles-gambit')!, getSkillById('achilles-gambit')).kind).toBe('strike');
        expect(resolvePrimary(getCard('befriend')!, getSkillById('befriend')).kind).toBe('befriend');
        expect(resolvePrimary(getCard('slippery-slope')!, getSkillById('slippery-slope')).kind).toBe('dot');
    });
    it('armedReadValue scales Guard by the DAMAGE read (+colour match)', () => {
        const guard = faceStats(getCard('brace-for-impact')!, getSkillById('brace-for-impact'));
        expect(armedReadValue(guard, 'neutral', false)).toBe(12);       // 12 × 1.0
        expect(armedReadValue(guard, 'advantage', false)).toBe(18);     // 12 × 1.5
        expect(armedReadValue(guard, 'disadvantage', false)).toBe(6);   // 12 × 0.5
        expect(armedReadValue(guard, 'neutral', true)).toBe(15);        // + colour-match bonus
    });
    it('armedReadValue scales DoT total by the gentler STATUS read (the read now bites status)', () => {
        const dot = faceStats(getCard('slippery-slope')!, getSkillById('slippery-slope'));
        expect(armedReadValue(dot, 'neutral', false)).toBe(18);         // 18 × 1.0
        expect(armedReadValue(dot, 'advantage', false)).toBe(24);       // 18 × 1.34 → 24
        expect(armedReadValue(dot, 'disadvantage', false)).toBe(14);    // 18 × 0.75 → 14 (rounded)
        expect(armedReadValue(dot, 'advantage', true)).toBe(24);        // no colour-match bonus on status
    });
});
