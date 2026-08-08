/**
 * Hermetic unit tests for the honest card view-model helpers
 * (engineHonestKind / resolvePrimary / faceStats / detailStats / armedReadValue).
 *
 * Fixtures are PROFANE CANON library cards (2026-08-08), read live from the
 * sibling engine so the assertions stay true to real data:
 *   - spoiled-poultice        card-played Poison i1 d2  → 2/play · FREE mark seed
 *   - frostbitten-palisade    Guard 8                   → FREE Guard 5
 *   - communion-of-the-worm   RUPTURE                   → a word, never a number
 *   - miserere                REAP all (3/Soul)         → live burst, never headlined
 *   - the-untended-garden     enchantment               → FREE timed (3 rounds) / PAID permanent
 *   - the-congregation-below  disenchant                → standing curse, FREE timed / PAID permanent
 *   - petty-indictment        MARK i1 d2                → +1 per DoT tick
 *   - contempt-of-court       BACKFIRE i2 d3            → 2 per denied rung
 *   - fx-ember (synthetic)    round-clock kindling ember → the "N over M turns" face
 *
 * Core invariant under test: real-units-or-no-number (never a fabricated
 * value — THE STRIKE IS DEAD), and face↔detail numbers agree.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
    getCard, getCardById, READ_DAMAGE_MULT, COLOR_MATCH_DAMAGE_BONUS,
    registerSandboxCards, clearSandboxCards,
} from '@mechanics';
import type { Card } from '@mechanics';
import {
    faceStats, detailStats, engineHonestKind, resolvePrimary, armedReadValue,
} from '@/state/presenters/combat-encounter.engine';

/**
 * The Profane Canon prints no round-clock DoT: POISON ticks per card played,
 * BLEED per hit taken, DOOM grows per enemy action. The "N over M turns" face
 * is still a live presenter branch, so a synthetic ember carrier exercises it.
 */
const FX_EMBER: Card = {
    id: 'fx-ember',
    theme: 'rot',
    name: 'Ember (fixture)',
    philosophicalAspect: 'mind',
    description: 'Test carrier: a genuine round-clock DoT.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Inflict KINDLING EMBER 1 for 3 turns.',
    free: { foretell: 1 },
    combatEffects: [{ effectId: 'debuff_kindling_ember', appliedTo: 'opponent', intensity: 1, duration: 3 }],
    addedIn: '2026-08-08',
    tags: ['rot'],
};
beforeAll(() => registerSandboxCards([FX_EMBER]));
afterAll(() => clearSandboxCards());

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
        const { card, sourceCard } = cardOf('spoiled-poultice');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('dot');
        expect(f.heroText).toBe('2/play');        // dpr 2 × i1, per card played
        expect(f.heroSub).toBe('per card you play · 2t');
        expect(f.verbLine).toBe('foe loses VITAE each card you play');
        expect(f.verbLine).not.toMatch(/\bHP\b/);
        // phase 30: TICK retired registry-wide — FREE deposits a MARK seed instead.
        // 2026-07-12 (card-wording audit): the 'i1 d1' shorthand de-abbreviates
        // at render — 8 of 10 playtest decks could not decode it.
        expect(f.freeHeroText).toBe('mark ×1 · 1 turn');
        expect(f.readDependent).toBe(true);
        expect(f.statusBase).toBe(2);             // the per-tick base (▲ raises it, ▼ leaves it)
        expect(f.statusAdv).toBe(4);              // won read: +1 intensity → 4/tick
        expect(f.inert).toBe(false);
    });
    it('Sketch of a Thought (round-clock ember) keeps the honest "N over M turns" lifetime', () => {
        // A genuine round-clock DoT (kindling ember dpr 1 · i1 · 3t) still ticks
        // at the boundary, so its lifetime face stands — proving WI-2 only
        // retires the fiction for EVENT DoTs.
        const { card, sourceCard } = cardOf('fx-ember');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('dot');
        expect(f.heroText).toBe('3');             // 1 × 3 turns, no ramp
        expect(f.heroSub).toBe('over 3 turns');
        expect(f.verbLine).toBe('foe loses VITAE each turn');
    });
    it('The Black Cap (CONCEDE) tier-floors: ladder in catalog, effective vs the live foe (WI-6)', () => {
        // The face used to print the raw authored "concede at 8" unconditionally
        // — a lie against an elite (10) or boss (12). Static catalog shows the
        // whole ladder; in combat the live difficulty resolves the real number.
        const { card, sourceCard } = cardOf('the-black-cap');
        expect(faceStats(card, sourceCard).heroSub).toBe('concede 8/10 elite/12 boss');
        expect(faceStats(card, sourceCard, 'elite').heroSub).toBe('concede at 10 vs this foe');
        expect(faceStats(card, sourceCard, 'boss').heroSub).toBe('concede at 12 vs this foe');
        expect(faceStats(card, sourceCard, 'normal').heroSub).toBe('concede at 8 vs this foe');
    });
    it('Frostbitten Palisade (Guard) → Guard 8 · the authored FREE Guard 5', () => {
        const { card, sourceCard } = cardOf('frostbitten-palisade');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('guard');
        expect(f.heroText).toBe('Guard 8');
        // phase 30: BARRIER merged into GUARD — bulwark's FREE line lays a
        // persistent brick, not a fading chip.
        expect(f.freeHeroText).toBe('Guard 5');
        expect(f.readDependent).toBe(true);
        expect(f.guardBase).toBe(8);
    });
    it('Communion of the Worm (RUPTURE) → a word, never a number', () => {
        const { card, sourceCard } = cardOf('communion-of-the-worm');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('rupture');
        expect(f.heroText).toBe('detonate');  // live burst → qualitative word only
        // The canon detonation's FREE line is the replant: a TICK plus a fresh
        // poison seed, so the board is not empty after the board is emptied.
        expect(f.freeHeroText).toBe('tick · poison ×1 · 4 turns');
    });
    it('Miserere (REAP all) → spends the Soul bank, burst stays live', () => {
        const { card, sourceCard } = cardOf('miserere');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('reap');
        expect(f.heroText).toBe('all Souls');
        expect(f.heroSub).toBe('3 per Soul'); // burstPerSoul — a real authored unit
    });
    it('The Untended Garden (enchantment) → FREE = timed instance, PAID = rest of combat (spec 32 v4)', () => {
        const { card, sourceCard } = cardOf('the-untended-garden');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('enchant');
        expect(f.heroSub).toBe('rest of combat');            // the ◆ PAID rail truth
        // The ◇ FREE line is the ENGINE's timed instance — never 'PAID only'.
        expect(f.freeHeroText).toContain('3 rounds');
        expect(f.freeHeroText).toContain('FESTER');          // the passive itself, engine-printed
        expect(f.freeHeroText).not.toMatch(/paid only/i);
        expect(card.cardType).toBe('enchantment');
    });
    it('The Congregation Below (disenchant) → a standing curse; FREE = timed instance', () => {
        const { card, sourceCard } = cardOf('the-congregation-below');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('disenchant');
        expect(f.freeHeroText).toContain('3 rounds');
        expect(f.freeHeroText).not.toMatch(/paid only/i);
        expect(card.cardType).toBe('disenchant');
    });
    it('persistent verb slot leads with the PAYLOAD keyword, never the bare type word (owner, 2026-07-12)', () => {
        // Every Stone an Oath lays GUARD on a bloodless round — the outcome
        // verb (GUARD) wins, not the trigger.
        const stones = cardOf('every-stone-an-oath');
        expect(faceStats(stones.card, stones.sourceCard).keyword).toBe('GUARD');
        // The Untended Garden FESTERs every DoT — a payload keyword, not ENCHANTMENT.
        const garden = cardOf('the-untended-garden');
        expect(faceStats(garden.card, garden.sourceCard).keyword).toBe('FESTER');
        // Caltrops leads with its payload verb (BLEED), not the type word.
        const caltrops = cardOf('caltrops-under-the-snow');
        expect(faceStats(caltrops.card, caltrops.sourceCard).keyword).toBe('BLEED');
    });
    it('Petty Indictment (MARK i1 d2) → +1 per DoT tick, real units', () => {
        const { card, sourceCard } = cardOf('petty-indictment');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('mark');
        expect(f.heroText).toBe('+1/tick');   // tickAmplifyFlat 1 x intensity 1
        expect(f.inert).toBe(false);
    });
    it('Contempt of Court (BACKFIRE i2 d3) → 2 per denied rung, real units', () => {
        const { card, sourceCard } = cardOf('contempt-of-court');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('backfire');
        expect(f.heroText).toBe('2/rung');    // backfirePerRung 1 × intensity 2
        expect(f.inert).toBe(false);
    });
});

describe('Option A split rail — freeKeyword/freeValue + typeStrip (owner-picked 2026-07-09)', () => {
    it('Spoiled Poultice → ◇ MARK · ×1 · 1t | BODY · SPELL foot strip', () => {
        const { card, sourceCard } = cardOf('spoiled-poultice');
        const f = faceStats(card, sourceCard);
        // phase 30: TICK retired registry-wide — FREE deposits a MARK seed instead.
        // 2026-07-12 (card-wording audit): '×1 · 1t', never the 'i1 d1' code.
        expect(f.freeKeyword).toBe('MARK');
        expect(f.freeValue).toBe('×1 · 1t');
        expect(f.typeStrip).toBe('BODY · SPELL');
    });
    it('Frostbitten Palisade → ◇ GUARD · 5 (the authored free rider, never halved)', () => {
        const { card, sourceCard } = cardOf('frostbitten-palisade');
        const f = faceStats(card, sourceCard);
        expect(f.freeKeyword).toBe('GUARD');
        expect(f.freeValue).toBe('5');
    });
    it('enchantment / disenchant → ◇ FREE · timed rounds rail; disenchant foot prints CURSE', () => {
        const venom = cardOf('the-untended-garden');
        const fv = faceStats(venom.card, venom.sourceCard);
        expect(fv.freeKeyword).toBeNull();
        expect(fv.freeValue).toBe('3 rounds');   // the engine's FREE_ENCHANT_ROUNDS truth, via topActionText
        expect(fv.typeStrip).toContain('ENCHANTMENT');
        const curse = cardOf('the-congregation-below');
        const fc = faceStats(curse.card, curse.sourceCard);
        expect(fc.freeValue).toBe('3 rounds');
        expect(fc.typeStrip).toContain('CURSE');
        expect(fc.typeStrip).not.toContain('DISENCHANT');
    });
    it("multi-clause free line keeps the head clause and marks the rest with '+'", () => {
        const { card, sourceCard } = cardOf('promissory-cut');  // free: draw 1 · RECOIL 1
        const f = faceStats(card, sourceCard);
        expect(f.freeKeyword).toBe('DRAW');
        expect(f.freeValue).toBe('1 +');
        // The overlay's freePill still carries the full-truth prose.
        const d = detailStats(card, sourceCard);
        expect(d.freePill).toContain('draw 1');
        expect(d.freePill).toContain('RECOIL');
    });
});

describe('rank / rarity projection (spec 32 v3 §4)', () => {
    it('rank rides the card; rarity derives from it (rare frame keys off rarity)', () => {
        expect(getCard('spoiled-poultice')!.rank).toBe(1);
        expect(getCard('spoiled-poultice')!.rarity).toBe('common');
        expect(getCard('communion-of-the-worm')!.rank).toBe(5);
        expect(getCard('communion-of-the-worm')!.rarity).toBe('rare');
        expect(getCard('the-congregation-below')!.rank).toBe(6);
        expect(getCard('the-congregation-below')!.rarity).toBe('rare');
    });
});

describe('detailStats — same numbers as the face', () => {
    it('Spoiled Poultice detail + pill agree on the per-tick bite, not a round-clock total (WI-2)', () => {
        const { card, sourceCard } = cardOf('spoiled-poultice');
        const d = detailStats(card, sourceCard);
        // No round-clock TOTAL/TURNS table for an event DoT — PER TICK / TRIGGER / DURATION.
        expect(d.outcomeStats.find(st => st.label === 'TOTAL')).toBeUndefined();
        expect(d.outcomeStats.find(st => st.label === 'PER TICK')?.value).toBe('2');
        expect(d.outcomeStats.find(st => st.label === 'TRIGGER')?.value).toBe('per card played');
        expect(d.outcomeStats.find(st => st.label === 'DURATION')?.value).toBe('2t');
        expect(d.stacksText).toBe('Stacks by intensity.');
        // §C: the +DIE read triplet scales the per-tick base (2 → ▲4 / ▼2),
        // and the one global legend decodes the columns (audit 2026-07-12).
        expect(d.dieTriplet).toBe('▲4 · —2 · ▼2');
        expect(d.readLegend).toContain('▲ won read');
        // The FREE pill is the authored free line, de-abbreviated. Phase 30:
        // TICK retired registry-wide — FREE deposits a MARK seed instead.
        expect(d.freePill).toBe('mark ×1 · 1 turn');
        // D-fix: the FREE-line MARK rider now renders its keyword panel.
        expect(d.keywords.map(k => k.name)).toContain('MARK');
        // The meta chip surfaces the rank name + card type (where gold used to sit).
        expect(d.metaChip).toContain('DOXA');
        expect(d.metaChip).toContain('SPELL');
    });
    it('Frostbitten Palisade (Guard) → terse "Gain Guard 8."', () => {
        const { card, sourceCard } = cardOf('frostbitten-palisade');
        const d = detailStats(card, sourceCard);
        expect(d.outcomeLine).toBe('Gain Guard 8.');
        expect(d.stacksText).toBeNull();
    });
    it('Enchantment detail leans on the engine-generated PAID text', () => {
        const { card, sourceCard } = cardOf('the-untended-garden');
        const d = detailStats(card, sourceCard);
        expect(d.powerLine).toContain(card.bottomActionText);
        expect(d.metaChip).toContain('ENCHANTMENT');
    });
    it('persistent detail tells the v4 fork (FREE timed / PAID permanent), never PAID only', () => {
        const { card, sourceCard } = cardOf('the-congregation-below');
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
        // The Congregation Below reads the discard pile — MILL leads.
        const curse = cardOf('the-congregation-below');
        const names = detailStats(curse.card, curse.sourceCard).keywords.map(k => k.name);
        expect(names).not.toContain('DISENCHANT');
        expect(names).not.toContain('ENCHANTMENT');
        expect(names).toEqual(expect.arrayContaining(['MILL']));
        // The Untended Garden deepens every DoT — FESTER leads.
        const garden = cardOf('the-untended-garden');
        const vk = detailStats(garden.card, garden.sourceCard).keywords;
        expect(vk.map(k => k.name)).not.toContain('ENCHANTMENT');
        expect(vk.map(k => k.name)).toEqual(expect.arrayContaining(['FESTER']));
        expect(vk.every(k => k.def.length > 0)).toBe(true);  // every chip carries its gloss
    });
    it('systemTerms is the PER-CARD glossary slice, not the KW-7 dump (owner, 2026-07-12)', () => {
        // Every Stone an Oath's printed lines reference no dice-system token →
        // NO entries (INTENSITY/FREE retired from the glossary, owner
        // 2026-07-18) — never the dump.
        const stones = cardOf('every-stone-an-oath');
        expect(detailStats(stones.card, stones.sourceCard).systemTerms.map(s => s.term)).toEqual([]);
        // The Saint's Finger-Bone prints '+1 Conviction' → CONVICTION renders;
        // FLOATING/WILD are already explained by its FORGE keyword chip →
        // deduped away.
        const relic = cardOf('saints-finger-bone');
        const d = detailStats(relic.card, relic.sourceCard);
        const terms = d.systemTerms.map(s => s.term);
        expect(terms).toEqual(expect.arrayContaining(['CONVICTION ◆']));
        expect(terms).not.toContain('FLOATING ✦');
        expect(terms).not.toContain('WILD / X');
        expect(terms).not.toContain('RUNGS');
        expect(d.keywords.map(k => k.name)).toContain('FORGE');
        // The Offertory Plate carries a '⬡ HEART ×3 spent' threshold line →
        // RESONANCE renders on the card that actually prints it.
        const plate = cardOf('the-offertory-plate');
        expect(detailStats(plate.card, plate.sourceCard).systemTerms.map(s => s.term))
            .toEqual(expect.arrayContaining(['RESONANCE ⬡']));
    });
});

describe('card-wording audit (2026-07-12) — the +DIE row carries only what the face cannot', () => {
    it('Communion of the Worm enumerates its FULL paid line (the pill used to hide SIPHON)', () => {
        const { card, sourceCard } = cardOf('communion-of-the-worm');
        const d = detailStats(card, sourceCard);
        expect(d.diePaidLine).toContain('RUPTURE');
        expect(d.diePaidLine).toContain('SIPHON 50%');
        // Not read-scaled → no triplet, no legend.
        expect(d.dieTriplet).toBeNull();
        expect(d.readLegend).toBeNull();
    });
    it('a multi-clause card enumerates every clause on the +DIE row', () => {
        // Petty Indictment prints MARK and PREMISE — a face can only headline
        // one, so the +DIE row is where both stay visible.
        const { card, sourceCard } = cardOf('petty-indictment');
        const d = detailStats(card, sourceCard);
        expect(d.diePaidLine).toContain('MARK');
        expect(d.diePaidLine).toContain('PREMISE');
        expect(d.dieTriplet).toBeNull();  // a MARK face takes no read triplet
    });
    it('Miserere surfaces its riding SIPHON on the paid line', () => {
        const { card, sourceCard } = cardOf('miserere');
        const d = detailStats(card, sourceCard);
        expect(d.diePaidLine).toContain('REAP');
        expect(d.diePaidLine).toContain('SIPHON 50%');
    });
    it('a read-scaled Guard card keeps its triplet and enumerates its rider', () => {
        const { card, sourceCard } = cardOf('frostbitten-palisade');
        const d = detailStats(card, sourceCard);
        expect(d.diePaidLine).toContain('GUARD 8');
        expect(d.diePaidLine).toContain('THORNS');
        expect(d.dieTriplet).toMatch(/^▲\d+ · —8 · ▼\d+$/);
        expect(d.readLegend).toContain("your die's stance");
    });
    it('persistent cards carry the duration footer (the 6-deck free-vs-paid confusion)', () => {
        const venom = cardOf('the-untended-garden');
        expect(detailStats(venom.card, venom.sourceCard).durationFooter).toBe('3 rounds free · permanent with a die');
        const spell = cardOf('spoiled-poultice');
        expect(detailStats(spell.card, spell.sourceCard).durationFooter).toBeNull();
    });
    it('INTENSITY and FREE never render as system terms (retired, owner 2026-07-18)', () => {
        // Both read plainly enough in context; their rows padded every inspect.
        const { card, sourceCard } = cardOf('spoiled-poultice');
        const terms = detailStats(card, sourceCard).systemTerms.map(s => s.term);
        expect(terms).not.toContain('INTENSITY');
        expect(terms).not.toContain('FREE');
    });
});

describe('resolvePrimary + armedReadValue', () => {
    it('resolvePrimary routes by verb-class + honesty (the v3 shapes)', () => {
        expect(resolvePrimary(getCard('frostbitten-palisade')!, getCardById('frostbitten-palisade')).kind).toBe('guard');
        expect(resolvePrimary(getCard('spoiled-poultice')!, getCardById('spoiled-poultice')).kind).toBe('dot');
        expect(resolvePrimary(getCard('communion-of-the-worm')!, getCardById('communion-of-the-worm')).kind).toBe('rupture');
        expect(resolvePrimary(getCard('miserere')!, getCardById('miserere')).kind).toBe('reap');
        expect(resolvePrimary(getCard('the-untended-garden')!, getCardById('the-untended-garden')).kind).toBe('enchant');
        expect(resolvePrimary(getCard('the-congregation-below')!, getCardById('the-congregation-below')).kind).toBe('disenchant');
    });
    it('armedReadValue scales Guard by the DAMAGE read (+colour match)', () => {
        const guard = faceStats(getCard('frostbitten-palisade')!, getCardById('frostbitten-palisade'));
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
        const dot = faceStats(getCard('spoiled-poultice')!, getCardById('spoiled-poultice'));
        expect(armedReadValue(dot, 'neutral', false)).toBe(2);          // 2/tick
        expect(armedReadValue(dot, 'advantage', false)).toBe(4);        // +1 intensity → 4/tick
        expect(armedReadValue(dot, 'disadvantage', false)).toBe(2);     // per-tick unchanged by −1 turn
        expect(armedReadValue(dot, 'advantage', true)).toBe(4);         // no colour-match bonus on status
    });
    it('armedReadValue reads a ROUND-CLOCK DoT as its ramp-aware lifetime (exact)', () => {
        // Sketch of a Thought: kindling ember dpr 1, i1, 3 turns, no ramp → 3.
        const dot = faceStats(getCard('fx-ember')!, getCardById('fx-ember'));
        expect(armedReadValue(dot, 'neutral', false)).toBe(3);          // 1+1+1
        expect(armedReadValue(dot, 'advantage', false)).toBe(6);        // +1 intensity: 2+2+2
        expect(armedReadValue(dot, 'disadvantage', false)).toBe(2);     // −1 turn: 1+1
    });
});
