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
 *   - venom-and-vein        enchantment           → FREE timed (3 rounds) / PAID permanent
 *   - suppurating-curse     disenchant            → standing curse, FREE timed / PAID permanent
 *   - memento-mori          MARK i2 d1            → +2 per DoT tick
 *   - red-herring           BACKFIRE i2 d2        → 2 per denied rung
 *
 * Core invariant under test: real-units-or-no-number (never a fabricated
 * value — THE STRIKE IS DEAD), and face↔detail numbers agree.
 */

import { describe, it, expect } from '@jest/globals';
import { getCard, getCardById, READ_DAMAGE_MULT, COLOR_MATCH_DAMAGE_BONUS } from '@mechanics';
import {
    faceStats, detailStats, engineHonestKind, resolvePrimary, armedReadValue,
} from '@/state/presenters/combat-encounter.engine';

const cardOf = (id: string) => {
    const card = getCard(id);
    if (!card) throw new Error(`fixture card missing: ${id}`);
    const sourceCard = getCardById(card.id);
    return { card, sourceCard };
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
        const { card, sourceCard } = cardOf('slippery-slope');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('dot');
        expect(f.heroText).toBe('10');        // ramp-aware: 2+2+3+3 (rampFactor 0.5)
        expect(f.heroSub).toBe('over 4 turns');
        expect(f.freeHeroText).toBe('tick');  // the AUTHORED free rider, verbatim
        expect(f.readDependent).toBe(true);
        expect(f.statusBase).toBe(10);
        expect(f.inert).toBe(false);
    });
    it('Brace for Impact (Guard) → Guard 8 · the authored FREE Guard 2', () => {
        const { card, sourceCard } = cardOf('brace-for-impact');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('guard');
        expect(f.heroText).toBe('Guard 8');
        expect(f.freeHeroText).toBe('Guard 2');   // sourceCard.free.guard — never a halved fabrication
        expect(f.readDependent).toBe(true);
        expect(f.guardBase).toBe(8);
    });
    it('Resonance Detonation (RUPTURE) → a word, never a number', () => {
        const { card, sourceCard } = cardOf('resonance-detonation');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('rupture');
        expect(f.heroText).toBe('detonate');  // live burst → qualitative word only
        expect(f.freeHeroText).toBe('tick');
    });
    it('The Reaping (REAP all) → spends the Soul bank, burst stays live', () => {
        const { card, sourceCard } = cardOf('the-reaping');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('reap');
        expect(f.heroText).toBe('all Souls');
        expect(f.heroSub).toBe('4 per Soul'); // burstPerSoul — a real authored unit (v3 rework: 2 → 4)
    });
    it('Venom and Vein (enchantment) → FREE = timed instance, PAID = rest of combat (spec 32 v4)', () => {
        const { card, sourceCard } = cardOf('venom-and-vein');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('enchant');
        expect(f.heroSub).toBe('rest of combat');            // the ◆ PAID rail truth
        // The ◇ FREE line is the ENGINE's timed instance — never 'PAID only'.
        expect(f.freeHeroText).toContain('3 rounds');
        expect(f.freeHeroText).toContain('BLEED');           // the passive itself, engine-printed
        expect(f.freeHeroText).not.toMatch(/paid only/i);
        expect(card.cardType).toBe('enchantment');
    });
    it('Suppurating Curse (disenchant) → a standing curse; FREE = timed instance', () => {
        const { card, sourceCard } = cardOf('suppurating-curse');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('disenchant');
        expect(f.freeHeroText).toContain('3 rounds');
        expect(f.freeHeroText).not.toMatch(/paid only/i);
        expect(card.cardType).toBe('disenchant');
    });
    it('persistent verb slot leads with the PAYLOAD keyword, never the bare type word (owner, 2026-07-12)', () => {
        // entropy-tax: 'Every KINDLEd or FORGEd die you spend MARKs the enemy.'
        // — the outcome verb (MARK) wins, not the trigger (KINDLE/FORGE).
        const tax = cardOf('entropy-tax');
        expect(faceStats(tax.card, tax.sourceCard).keyword).toBe('MARK');
        // venom-and-vein boosts BLEED/POISON — a payload keyword, not ENCHANTMENT.
        const venom = cardOf('venom-and-vein');
        expect(faceStats(venom.card, venom.sourceCard).keyword).toBe('POISON');
        // achilles-and-the-tortoise opens with its verb: 'DRAW 1 card each time…'
        const draw = cardOf('achilles-and-the-tortoise');
        expect(faceStats(draw.card, draw.sourceCard).keyword).toBe('DRAW');
    });
    it('Memento Mori (MARK i2 d1) → +2 per DoT tick, real units', () => {
        const { card, sourceCard } = cardOf('memento-mori');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('mark');
        expect(f.heroText).toBe('+2/tick');   // tickAmplifyFlat 1 × intensity 2
        expect(f.inert).toBe(false);
    });
    it('Red Herring (BACKFIRE i2 d2) → 2 per denied rung, real units', () => {
        const { card, sourceCard } = cardOf('red-herring');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('backfire');
        expect(f.heroText).toBe('2/rung');    // backfirePerRung 1 × intensity 2
        expect(f.inert).toBe(false);
    });
});

describe('Option A split rail — freeKeyword/freeValue + typeStrip (owner-picked 2026-07-09)', () => {
    it('Slippery Slope → ◇ TICK · 1 | BODY · SPELL foot strip', () => {
        const { card, sourceCard } = cardOf('slippery-slope');
        const f = faceStats(card, sourceCard);
        expect(f.freeKeyword).toBe('TICK');
        expect(f.freeValue).toBe('1');
        expect(f.typeStrip).toBe('BODY · SPELL');
    });
    it('Brace for Impact → ◇ GUARD · 2 (the authored free rider, never halved)', () => {
        const { card, sourceCard } = cardOf('brace-for-impact');
        const f = faceStats(card, sourceCard);
        expect(f.freeKeyword).toBe('GUARD');
        expect(f.freeValue).toBe('2');
    });
    it('enchantment / disenchant → ◇ FREE · timed rounds rail; disenchant foot prints CURSE', () => {
        const venom = cardOf('venom-and-vein');
        const fv = faceStats(venom.card, venom.sourceCard);
        expect(fv.freeKeyword).toBeNull();
        expect(fv.freeValue).toBe('3 rounds');   // the engine's FREE_ENCHANT_ROUNDS truth, via topActionText
        expect(fv.typeStrip).toContain('ENCHANTMENT');
        const curse = cardOf('suppurating-curse');
        const fc = faceStats(curse.card, curse.sourceCard);
        expect(fc.freeValue).toBe('3 rounds');
        expect(fc.typeStrip).toContain('CURSE');
        expect(fc.typeStrip).not.toContain('DISENCHANT');
    });
    it("multi-clause free line keeps the head clause and marks the rest with '+'", () => {
        const { card, sourceCard } = cardOf('the-gleaners-due');  // free: draw 1 · +1 Soul
        const f = faceStats(card, sourceCard);
        expect(f.freeKeyword).toBe('DRAW');
        expect(f.freeValue).toBe('1 +');
        // The overlay's freePill still carries the full-truth prose.
        const d = detailStats(card, sourceCard);
        expect(d.freePill).toContain('draw 1');
        expect(d.freePill).toContain('Soul');
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
        const { card, sourceCard } = cardOf('slippery-slope');
        const d = detailStats(card, sourceCard);
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
        const { card, sourceCard } = cardOf('brace-for-impact');
        const d = detailStats(card, sourceCard);
        expect(d.outcomeLine).toBe('Gain Guard 8.');
        expect(d.stacksText).toBeNull();
    });
    it('Enchantment detail leans on the engine-generated PAID text', () => {
        const { card, sourceCard } = cardOf('venom-and-vein');
        const d = detailStats(card, sourceCard);
        expect(d.powerLine).toContain(card.bottomActionText);
        expect(d.metaChip).toContain('ENCHANTMENT');
    });
    it('persistent detail tells the v4 fork (FREE timed / PAID permanent), never PAID only', () => {
        const { card, sourceCard } = cardOf('suppurating-curse');
        const d = detailStats(card, sourceCard);
        expect(d.outcomeLine).toBe('FREE: on the enemy for 3 rounds. PAID: rest of combat.');
        expect(d.readNote).toContain('permanent');
        expect(d.readNote).toContain('leaves the deck cycle');
        expect(d.readNote).not.toMatch(/paid only/i);
        expect(d.freePill).toContain('3 rounds');
        expect(d.freeLine).toContain('3 rounds');
    });
    it('persistent keyword chips lead with the TYPE, then the PAYLOAD keywords with glosses', () => {
        // suppurating-curse's passive doubles POISON and BLEED damage — the
        // explainer slot must surface those, not just the card-type label.
        const curse = cardOf('suppurating-curse');
        const names = detailStats(curse.card, curse.sourceCard).keywords.map(k => k.name);
        expect(names[0]).toBe('DISENCHANT');                  // the type, clearly first
        expect(names).toEqual(expect.arrayContaining(['POISON', 'BLEED']));
        const venom = cardOf('venom-and-vein');
        const vk = detailStats(venom.card, venom.sourceCard).keywords;
        expect(vk.map(k => k.name)).toEqual(expect.arrayContaining(['BLEED', 'POISON']));
        expect(vk.every(k => k.def.length > 0)).toBe(true);  // every chip carries its gloss
    });
    it('systemTerms is the PER-CARD glossary slice, not the KW-7 dump (owner, 2026-07-12)', () => {
        // entropy-tax's printed lines reference no dice-system token → NO
        // systems glossary at all (the old dump rendered all six on every card).
        const tax = cardOf('entropy-tax');
        expect(detailStats(tax.card, tax.sourceCard).systemTerms).toEqual([]);
        // bootstrap-loop prints '+1 Conviction' and a '⬡ MIND ×2 spent'
        // threshold line → CONVICTION and RESONANCE render; FLOATING/WILD are
        // already explained by its FORGE keyword chip → deduped away.
        const loop = cardOf('bootstrap-loop');
        const d = detailStats(loop.card, loop.sourceCard);
        const terms = d.systemTerms.map(s => s.term);
        expect(terms).toEqual(expect.arrayContaining(['CONVICTION ◆', 'RESONANCE ⬡']));
        expect(terms).not.toContain('FLOATING ✦');
        expect(terms).not.toContain('WILD / X');
        expect(terms).not.toContain('RUNGS');
        expect(d.keywords.map(k => k.name)).toContain('FORGE');
    });
});

describe('resolvePrimary + armedReadValue', () => {
    it('resolvePrimary routes by verb-class + honesty (the v3 shapes)', () => {
        expect(resolvePrimary(getCard('brace-for-impact')!, getCardById('brace-for-impact')).kind).toBe('guard');
        expect(resolvePrimary(getCard('slippery-slope')!, getCardById('slippery-slope')).kind).toBe('dot');
        expect(resolvePrimary(getCard('resonance-detonation')!, getCardById('resonance-detonation')).kind).toBe('rupture');
        expect(resolvePrimary(getCard('the-reaping')!, getCardById('the-reaping')).kind).toBe('reap');
        expect(resolvePrimary(getCard('venom-and-vein')!, getCardById('venom-and-vein')).kind).toBe('enchant');
        expect(resolvePrimary(getCard('suppurating-curse')!, getCardById('suppurating-curse')).kind).toBe('disenchant');
    });
    it('armedReadValue scales Guard by the DAMAGE read (+colour match)', () => {
        const guard = faceStats(getCard('brace-for-impact')!, getCardById('brace-for-impact'));
        const adv = Math.max(1, Math.round(8 * READ_DAMAGE_MULT.advantage));
        const dis = Math.max(1, Math.round(8 * READ_DAMAGE_MULT.disadvantage));
        expect(armedReadValue(guard, 'neutral', false)).toBe(8);
        expect(armedReadValue(guard, 'advantage', false)).toBe(adv);
        expect(armedReadValue(guard, 'disadvantage', false)).toBe(dis);
        expect(armedReadValue(guard, 'neutral', true)).toBe(8 + COLOR_MATCH_DAMAGE_BONUS);
    });
    it('armedReadValue follows the P0-truth deterministic read rule for DoT (exact, ramp-aware)', () => {
        // Slippery Slope: canonical poison dpr 2, ramp 0.5, i1, 4 turns.
        const dot = faceStats(getCard('slippery-slope')!, getCardById('slippery-slope'));
        expect(armedReadValue(dot, 'neutral', false)).toBe(10);         // 2+2+3+3, printed exactly
        expect(armedReadValue(dot, 'advantage', false)).toBe(20);       // +1 intensity: 4+4+6+6
        expect(armedReadValue(dot, 'disadvantage', false)).toBe(7);     // −1 turn: 2+2+3
        expect(armedReadValue(dot, 'advantage', true)).toBe(20);        // no colour-match bonus on status
    });
});
