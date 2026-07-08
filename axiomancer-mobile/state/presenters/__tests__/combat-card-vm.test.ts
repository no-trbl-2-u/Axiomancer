/**
 * Hermetic unit tests for the honest card view-model helpers
 * (engineHonestKind / resolvePrimary / faceStats / detailStats / armedReadValue).
 *
 * Fixtures are spec 32 v3 library cards, read live from the sibling engine so
 * the assertions stay true to real data:
 *   - slippery-slope        ramping Poison i1 d4  → 2+2+3+3 = 10 lifetime · FREE tick
 *   - brace-for-impact      Guard 8               → FREE Guard 2
 *   - resonance-detonation  RUPTURE               → a word, never a number
 *   - the-reaping           REAP all (2/Soul)     → live burst, never headlined
 *   - venom-and-vein        enchantment           → persistent, PAID only
 *   - suppurating-curse     disenchant            → standing curse, PAID only
 *   - memento-mori          MARK i2 d1            → +2 per DoT tick
 *   - red-herring           BACKFIRE i2 d2        → 2 per denied rung
 *
 * Core invariant under test: real-units-or-no-number (never a fabricated
 * value — THE STRIKE IS DEAD), and face↔detail numbers agree.
 */

import { describe, it, expect } from '@jest/globals';
import { getCard, getSkillById, READ_DAMAGE_MULT, COLOR_MATCH_DAMAGE_BONUS } from '@mechanics';
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
    it('classifies the spec 32 v3 keyword effects', () => {
        expect(engineHonestKind('debuff_poison')).toBe('dot');
        expect(engineHonestKind('debuff_bleed')).toBe('dot');
        expect(engineHonestKind('debuff_mark')).toBe('mark');           // tickAmplifyFlat
        expect(engineHonestKind('debuff_backfire')).toBe('backfire');   // backfirePerRung
        expect(engineHonestKind('debuff_rapport')).toBe('weaken');      // outgoingDamageMulPct < 0
        expect(engineHonestKind('buff_thorns')).toBe('thorns');         // reflectDamage
        expect(engineHonestKind(null)).toBeNull();
    });
});

describe('faceStats — honest real-unit faces', () => {
    it('Slippery Slope (ramping Poison) → 10 lifetime (2,2,3,3) · 4 turns · FREE tick', () => {
        const { card, skill } = cardOf('slippery-slope');
        const f = faceStats(card, skill);
        expect(f.kind).toBe('dot');
        expect(f.heroText).toBe('10');        // ramp-aware: 2+2+3+3 (rampFactor 0.5)
        expect(f.heroSub).toBe('over 4 turns');
        expect(f.freeHeroText).toBe('tick');  // the AUTHORED free rider, verbatim
        expect(f.readDependent).toBe(true);
        expect(f.statusBase).toBe(10);
        expect(f.inert).toBe(false);
    });
    it('Brace for Impact (Guard) → Guard 8 · the authored FREE Guard 2', () => {
        const { card, skill } = cardOf('brace-for-impact');
        const f = faceStats(card, skill);
        expect(f.kind).toBe('guard');
        expect(f.heroText).toBe('Guard 8');
        expect(f.freeHeroText).toBe('Guard 2');   // skill.free.guard — never a halved fabrication
        expect(f.readDependent).toBe(true);
        expect(f.guardBase).toBe(8);
    });
    it('Resonance Detonation (RUPTURE) → a word, never a number', () => {
        const { card, skill } = cardOf('resonance-detonation');
        const f = faceStats(card, skill);
        expect(f.kind).toBe('rupture');
        expect(f.heroText).toBe('detonate');  // live burst → qualitative word only
        expect(f.freeHeroText).toBe('tick');
    });
    it('The Reaping (REAP all) → spends the Soul bank, burst stays live', () => {
        const { card, skill } = cardOf('the-reaping');
        const f = faceStats(card, skill);
        expect(f.kind).toBe('reap');
        expect(f.heroText).toBe('all Souls');
        expect(f.heroSub).toBe('4 per Soul'); // burstPerSoul — a real authored unit (v3 rework: 2 → 4)
    });
    it('Venom and Vein (enchantment) → persistent, PAID only', () => {
        const { card, skill } = cardOf('venom-and-vein');
        const f = faceStats(card, skill);
        expect(f.kind).toBe('enchant');
        expect(f.heroSub).toBe('rest of combat');
        expect(f.freeHeroText).toBe('PAID only');
        expect(card.cardType).toBe('enchantment');
    });
    it('Suppurating Curse (disenchant) → a standing curse on the enemy', () => {
        const { card, skill } = cardOf('suppurating-curse');
        const f = faceStats(card, skill);
        expect(f.kind).toBe('disenchant');
        expect(f.freeHeroText).toBe('PAID only');
        expect(card.cardType).toBe('disenchant');
    });
    it('Memento Mori (MARK i2 d1) → +2 per DoT tick, real units', () => {
        const { card, skill } = cardOf('memento-mori');
        const f = faceStats(card, skill);
        expect(f.kind).toBe('mark');
        expect(f.heroText).toBe('+2/tick');   // tickAmplifyFlat 1 × intensity 2
        expect(f.inert).toBe(false);
    });
    it('Red Herring (BACKFIRE i2 d2) → 2 per denied rung, real units', () => {
        const { card, skill } = cardOf('red-herring');
        const f = faceStats(card, skill);
        expect(f.kind).toBe('backfire');
        expect(f.heroText).toBe('2/rung');    // backfirePerRung 1 × intensity 2
        expect(f.inert).toBe(false);
    });
});

describe('rank / rarity projection (spec 32 v3 §4)', () => {
    it('rank rides the card; rarity derives from it (rare frame keys off rarity)', () => {
        expect(getCard('slippery-slope')!.rank).toBe(1);
        expect(getCard('slippery-slope')!.rarity).toBe('common');
        expect(getCard('resonance-detonation')!.rank).toBe(5);
        expect(getCard('resonance-detonation')!.rarity).toBe('rare');
        expect(getCard('suppurating-curse')!.rank).toBe(6);
        expect(getCard('suppurating-curse')!.rarity).toBe('rare');
    });
});

describe('detailStats — same numbers as the face', () => {
    it('Slippery Slope outcome + stats + pill all agree on the ramp-aware 10', () => {
        const { card, skill } = cardOf('slippery-slope');
        const d = detailStats(card, skill);
        expect(d.outcomeStats.find(st => st.label === 'TOTAL')?.value).toBe('10');
        expect(d.stacksText).toBe('Stacks up to 10×.');
        // §C: the +DIE read triplet is the deterministic rule, base = 10.
        expect(d.diePill).toMatch(/^▲\d+ · —10 · ▼\d+$/);
        // The FREE pill is the authored free line.
        expect(d.freePill).toBe('tick');
        // The meta chip surfaces the rank name + card type (where gold used to sit).
        expect(d.metaChip).toContain('DOXA');
        expect(d.metaChip).toContain('SPELL');
    });
    it('Brace for Impact (Guard) → terse "Gain Guard 8."', () => {
        const { card, skill } = cardOf('brace-for-impact');
        const d = detailStats(card, skill);
        expect(d.outcomeLine).toBe('Gain Guard 8.');
        expect(d.stacksText).toBeNull();
    });
    it('Enchantment detail leans on the engine-generated PAID text', () => {
        const { card, skill } = cardOf('venom-and-vein');
        const d = detailStats(card, skill);
        expect(d.powerLine).toContain(card.bottomActionText);
        expect(d.metaChip).toContain('ENCHANTMENT');
    });
});

describe('resolvePrimary + armedReadValue', () => {
    it('resolvePrimary routes by verb-class + honesty (the v3 shapes)', () => {
        expect(resolvePrimary(getCard('brace-for-impact')!, getSkillById('brace-for-impact')).kind).toBe('guard');
        expect(resolvePrimary(getCard('slippery-slope')!, getSkillById('slippery-slope')).kind).toBe('dot');
        expect(resolvePrimary(getCard('resonance-detonation')!, getSkillById('resonance-detonation')).kind).toBe('rupture');
        expect(resolvePrimary(getCard('the-reaping')!, getSkillById('the-reaping')).kind).toBe('reap');
        expect(resolvePrimary(getCard('venom-and-vein')!, getSkillById('venom-and-vein')).kind).toBe('enchant');
        expect(resolvePrimary(getCard('suppurating-curse')!, getSkillById('suppurating-curse')).kind).toBe('disenchant');
    });
    it('armedReadValue scales Guard by the DAMAGE read (+colour match)', () => {
        const guard = faceStats(getCard('brace-for-impact')!, getSkillById('brace-for-impact'));
        const adv = Math.max(1, Math.round(8 * READ_DAMAGE_MULT.advantage));
        const dis = Math.max(1, Math.round(8 * READ_DAMAGE_MULT.disadvantage));
        expect(armedReadValue(guard, 'neutral', false)).toBe(8);
        expect(armedReadValue(guard, 'advantage', false)).toBe(adv);
        expect(armedReadValue(guard, 'disadvantage', false)).toBe(dis);
        expect(armedReadValue(guard, 'neutral', true)).toBe(8 + COLOR_MATCH_DAMAGE_BONUS);
    });
    it('armedReadValue follows the P0-truth deterministic read rule for DoT (exact, ramp-aware)', () => {
        // Slippery Slope: canonical poison dpr 2, ramp 0.5, i1, 4 turns.
        const dot = faceStats(getCard('slippery-slope')!, getSkillById('slippery-slope'));
        expect(armedReadValue(dot, 'neutral', false)).toBe(10);         // 2+2+3+3, printed exactly
        expect(armedReadValue(dot, 'advantage', false)).toBe(20);       // +1 intensity: 4+4+6+6
        expect(armedReadValue(dot, 'disadvantage', false)).toBe(7);     // −1 turn: 2+2+3
        expect(armedReadValue(dot, 'advantage', true)).toBe(20);        // no colour-match bonus on status
    });
});
