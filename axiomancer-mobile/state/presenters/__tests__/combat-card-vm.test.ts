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
    it('Slippery Slope (card-played Poison) → 2/play, never a round-clock lifetime (WI-2)', () => {
        // Poison is a card-played DoT: passive round-clock play deals 0, so the
        // old "10 over 4 turns" face was fiction. The honest face is the per-tick
        // bite and its real trigger.
        const { card, sourceCard } = cardOf('slippery-slope');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('dot');
        expect(f.heroText).toBe('2/play');        // dpr 2 × i1, per card played
        expect(f.heroSub).toBe('per card you play · 4t');
        expect(f.verbLine).toBe('foe loses VITAE each card you play');
        expect(f.verbLine).not.toMatch(/\bHP\b/);
        // phase 30: TICK retired registry-wide — FREE deposits a MARK seed instead.
        expect(f.freeHeroText).toBe('mark i1 d1');
        expect(f.readDependent).toBe(true);
        expect(f.statusBase).toBe(2);             // the per-tick base (▲ raises it, ▼ leaves it)
        expect(f.statusAdv).toBe(4);              // won read: +1 intensity → 4/tick
        expect(f.inert).toBe(false);
    });
    it('Sketch of a Thought (round-clock ember) keeps the honest "N over M turns" lifetime', () => {
        // A genuine round-clock DoT (kindling ember dpr 1 · i1 · 3t) still ticks
        // at the boundary, so its lifetime face stands — proving WI-2 only
        // retires the fiction for EVENT DoTs.
        const { card, sourceCard } = cardOf('sketch-of-a-thought');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('dot');
        expect(f.heroText).toBe('3');             // 1 × 3 turns, no ramp
        expect(f.heroSub).toBe('over 3 turns');
        expect(f.verbLine).toBe('foe loses VITAE each turn');
    });
    it('The Closing Word (CONCEDE) tier-floors: ladder in catalog, effective vs the live foe (WI-6)', () => {
        // The face used to print the raw authored "concede at 8" unconditionally
        // — a lie against an elite (10) or boss (12). Static catalog shows the
        // whole ladder; in combat the live difficulty resolves the real number.
        const { card, sourceCard } = cardOf('the-closing-word');
        expect(faceStats(card, sourceCard).heroSub).toBe('concede 8/10 elite/12 boss');
        expect(faceStats(card, sourceCard, 'elite').heroSub).toBe('concede at 10 vs this foe');
        expect(faceStats(card, sourceCard, 'boss').heroSub).toBe('concede at 12 vs this foe');
        expect(faceStats(card, sourceCard, 'normal').heroSub).toBe('concede at 8 vs this foe');
    });
    it('Brace for Impact (Guard) → Guard 8 · the authored FREE persistent Guard 2', () => {
        const { card, sourceCard } = cardOf('brace-for-impact');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('guard');
        expect(f.heroText).toBe('Guard 8');
        // phase 30: BARRIER merged into GUARD — bulwark's FREE line lays a
        // persistent brick, not a fading chip.
        expect(f.freeHeroText).toBe('GUARD 2 (persists)');
        expect(f.readDependent).toBe(true);
        expect(f.guardBase).toBe(8);
    });
    it('Resonance Detonation (RUPTURE) → a word, never a number', () => {
        const { card, sourceCard } = cardOf('resonance-detonation');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('rupture');
        expect(f.heroText).toBe('detonate');  // live burst → qualitative word only
        // phase 30: TICK retired registry-wide — FREE deposits a MARK seed instead.
        expect(f.freeHeroText).toBe('mark i1 d1');
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
    it('Slippery Slope → ◇ MARK · i1 d1 | BODY · SPELL foot strip', () => {
        const { card, sourceCard } = cardOf('slippery-slope');
        const f = faceStats(card, sourceCard);
        // phase 30: TICK retired registry-wide — FREE deposits a MARK seed instead.
        expect(f.freeKeyword).toBe('MARK');
        expect(f.freeValue).toBe('i1 d1');
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
    it('Slippery Slope detail + pill agree on the per-tick bite, not a round-clock total (WI-2)', () => {
        const { card, sourceCard } = cardOf('slippery-slope');
        const d = detailStats(card, sourceCard);
        // No round-clock TOTAL/TURNS table for an event DoT — PER TICK / TRIGGER / DURATION.
        expect(d.outcomeStats.find(st => st.label === 'TOTAL')).toBeUndefined();
        expect(d.outcomeStats.find(st => st.label === 'PER TICK')?.value).toBe('2');
        expect(d.outcomeStats.find(st => st.label === 'TRIGGER')?.value).toBe('per card played');
        expect(d.outcomeStats.find(st => st.label === 'DURATION')?.value).toBe('4t');
        expect(d.stacksText).toBe('Stacks by intensity.');
        // §C: the +DIE read triplet scales the per-tick base (2 → ▲4 / ▼2).
        expect(d.diePill).toBe('▲4 · —2 · ▼2');
        // The FREE pill is the authored free line. Phase 30: TICK retired
        // registry-wide — FREE deposits a MARK seed instead.
        expect(d.freePill).toBe('mark i1 d1');
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
    it('persistent keyword chips are PAYLOAD-only — the type never enters the panel (owner, 2026-07-12)', () => {
        // Enchantment/Curse/Disenchant are card TYPES: they read on the frame's
        // type strip, so the inspect panel carries only what the passive DOES.
        // suppurating-curse doubles POISON and BLEED damage — those lead.
        const curse = cardOf('suppurating-curse');
        const names = detailStats(curse.card, curse.sourceCard).keywords.map(k => k.name);
        expect(names).not.toContain('DISENCHANT');
        expect(names).not.toContain('ENCHANTMENT');
        expect(names).toEqual(expect.arrayContaining(['POISON', 'BLEED']));
        const venom = cardOf('venom-and-vein');
        const vk = detailStats(venom.card, venom.sourceCard).keywords;
        expect(vk.map(k => k.name)).not.toContain('ENCHANTMENT');
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
    it('armedReadValue reads an EVENT DoT per-tick (poison ticks per card, not per turn) — WI-2', () => {
        // Slippery Slope: canonical poison dpr 2, i1, card-played. The read
        // scales the PER-TICK bite (▲ +1 intensity → 4/tick; ▼ shortens the
        // window, per-tick unchanged), never a round-clock lifetime.
        const dot = faceStats(getCard('slippery-slope')!, getCardById('slippery-slope'));
        expect(armedReadValue(dot, 'neutral', false)).toBe(2);          // 2/tick
        expect(armedReadValue(dot, 'advantage', false)).toBe(4);        // +1 intensity → 4/tick
        expect(armedReadValue(dot, 'disadvantage', false)).toBe(2);     // per-tick unchanged by −1 turn
        expect(armedReadValue(dot, 'advantage', true)).toBe(4);         // no colour-match bonus on status
    });
    it('armedReadValue reads a ROUND-CLOCK DoT as its ramp-aware lifetime (exact)', () => {
        // Sketch of a Thought: kindling ember dpr 1, i1, 3 turns, no ramp → 3.
        const dot = faceStats(getCard('sketch-of-a-thought')!, getCardById('sketch-of-a-thought'));
        expect(armedReadValue(dot, 'neutral', false)).toBe(3);          // 1+1+1
        expect(armedReadValue(dot, 'advantage', false)).toBe(6);        // +1 intensity: 2+2+2
        expect(armedReadValue(dot, 'disadvantage', false)).toBe(2);     // −1 turn: 1+1
    });
});
