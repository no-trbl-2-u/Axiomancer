/**
 * Hermetic unit tests for the honest card view-model helpers
 * (engineHonestKind / resolvePrimary / faceStats / detailStats / armedReadValue).
 *
 * Fixtures are live library cards (THE BIG NUMBERS REWRITE, 2026-09-02), read
 * live from the sibling engine so the assertions stay true to real data:
 *   - spoiled-poultice        card-played Poison i4 d3  → 8/play · FREE poison seed
 *   - chilblain-watch         Guard 12                  → FREE Guard 5
 *   - frostbitten-palisade    Guard 10 + RIPOSTE 6/3    → the riposte face
 *   - communion-of-the-worm   RUPTURE                   → a word, never a number
 *   - miserere                REAP all (14/Soul)        → live burst, never headlined
 *   - the-untended-garden     oath                      → FREE timed (3 rounds) / PAID permanent
 *   - the-congregation-below  hex                       → standing curse, FREE timed / PAID permanent
 *   - the-pricking-needle     MARK i4 d3                → +4 per DoT tick
 *   - contempt-of-court       BACKFIRE i8 d3            → 8 per denied rung
 *   - fx-ember (synthetic)    round-clock kindling ember → the "N over M turns" face
 *
 * Core invariant under test: real-units-or-no-number (never a fabricated
 * value — THE STRIKE IS DEAD), and face↔detail numbers agree.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
    getCard, getCardById, READ_DAMAGE_MULT, colorMatchBonus,
    registerSandboxCards, clearSandboxCards, concedeFloorFor,
    CONCEDE_PREMISES_BASE, CONCEDE_PREMISES_ELITE, CONCEDE_PREMISES_BOSS,
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
        expect(engineHonestKind('debuff_quarter')).toBe('weaken');      // outgoingDamageMulPct < 0
        expect(engineHonestKind('buff_thorns')).toBe('thorns');         // reflectDamage
        expect(engineHonestKind(null)).toBeNull();
    });
});

describe('faceStats — honest real-unit faces', () => {
    it('Spoiled Poultice (card-played Poison) → 8/play, never a round-clock lifetime (WI-2)', () => {
        // Poison is a card-played DoT: passive round-clock play deals 0, so a
        // "N over M turns" face would be fiction. The honest face is the per-tick
        // bite and its real trigger.
        const { card, sourceCard } = cardOf('spoiled-poultice');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('dot');
        expect(f.heroText).toBe('8/play');        // dpr 2 × i4, per card played
        expect(f.heroSub).toBe('per card you play · 3t');
        expect(f.verbLine).toBe('foe loses VITAE each card you play');
        expect(f.verbLine).not.toMatch(/\bHP\b/);
        // 2026-07-12 (card-wording audit): the 'i3 d2' shorthand de-abbreviates
        // at render — 8 of 10 playtest decks could not decode it.
        expect(f.freeHeroText).toBe('poison ×3 · 2 turns');
        expect(f.readDependent).toBe(true);
        expect(f.statusBase).toBe(8);             // the per-tick base (▲ raises it, ▼ leaves it)
        expect(f.statusAdv).toBe(10);             // won read: +1 intensity → 10/tick
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
    it('The Black Cap (CONDEMN) tier-floors: ladder in catalog, effective vs the live foe (WI-6)', () => {
        // The face must never print a threshold BELOW what the live foe demands
        // — the authored `concedeAt` floored by the enemy's difficulty tier.
        // Static catalog shows the whole ladder; in combat the live difficulty
        // resolves the one real number. Derived from the card + the engine's own
        // floors so a re-costed CONDEMN can never desync the face from the rule.
        const { card, sourceCard } = cardOf('the-black-cap');
        const per = sourceCard?.specialMechanics?.find(m => m.kind === 'peroration');
        const authored = per?.kind === 'peroration' ? per.concedeAt : undefined;
        expect(authored).toBeGreaterThan(0);
        const eff = (d: 'normal' | 'elite' | 'boss') => Math.max(authored!, concedeFloorFor(d));
        expect(faceStats(card, sourceCard).heroSub)
            .toBe(`condemn ${Math.max(authored!, CONCEDE_PREMISES_BASE)}`
                + `/${Math.max(authored!, CONCEDE_PREMISES_ELITE)} elite`
                + `/${Math.max(authored!, CONCEDE_PREMISES_BOSS)} boss`);
        expect(faceStats(card, sourceCard, 'elite').heroSub).toBe(`condemn at ${eff('elite')} vs this foe`);
        expect(faceStats(card, sourceCard, 'boss').heroSub).toBe(`condemn at ${eff('boss')} vs this foe`);
        expect(faceStats(card, sourceCard, 'normal').heroSub).toBe(`condemn at ${eff('normal')} vs this foe`);
        // …and the printed number is never under the floor it must clear.
        expect(eff('boss')).toBeGreaterThanOrEqual(CONCEDE_PREMISES_BOSS);
    });
    it('Chilblain Watch (Guard) → Guard 12 · the authored FREE Guard 5', () => {
        const { card, sourceCard } = cardOf('chilblain-watch');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('guard');
        expect(f.heroText).toBe('Guard 12');
        // phase 30: BARRIER merged into GUARD — the FREE line lays a
        // persistent brick, not a fading chip.
        expect(f.freeHeroText).toBe('Guard 5');
        expect(f.readDependent).toBe(true);
        expect(f.guardBase).toBe(12);
    });
    it('Frostbitten Palisade (Guard + RIPOSTE) headlines the richer mechanic', () => {
        // A defend card carrying a riposte leads with the counter, and the Guard
        // it also grants stays visible on the detail panel (never dropped).
        const { card, sourceCard } = cardOf('frostbitten-palisade');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('riposte');
        expect(f.heroText).toBe('CTR 6 · CUT 3');
        expect(f.freeHeroText).toBe('Guard 4');
        expect(f.inert).toBe(false);
        const d = detailStats(card, sourceCard);
        expect(d.outcomeStats.find(st => st.label === 'COUNTER')?.value).toBe('6');
        expect(d.outcomeStats.find(st => st.label === 'REDUCE')?.value).toBe('-3');
        expect(d.outcomeStats.find(st => st.label === 'GUARD')?.value).toBe('10');
    });
    it('Communion of the Worm (RUPTURE) → a word, never a number', () => {
        const { card, sourceCard } = cardOf('communion-of-the-worm');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('rupture');
        expect(f.heroText).toBe('detonate');  // live burst → qualitative word only
        // The detonation's FREE line is the replant: a TICK plus a fresh
        // poison seed, so the board is not empty after the board is emptied.
        expect(f.freeHeroText).toBe('tick · poison ×5 · 3 turns');
    });
    it('Miserere (REAP all) → spends the Soul bank, burst stays live', () => {
        const { card, sourceCard } = cardOf('miserere');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('reap');
        expect(f.heroText).toBe('all Souls');
        expect(f.heroSub).toBe('14 per Soul'); // burstPerSoul — a real authored unit
    });
    it('The Untended Garden (oath) → FREE = timed instance, PAID = rest of combat (spec 32 v4)', () => {
        const { card, sourceCard } = cardOf('the-untended-garden');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('oath');
        expect(f.heroSub).toBe('rest of combat');            // the ◆ PAID rail truth
        // The ◇ FREE line is the ENGINE's timed instance — never 'PAID only'.
        expect(f.freeHeroText).toContain('3 rounds');
        expect(f.freeHeroText).toContain('FESTER');          // the passive itself, engine-printed
        expect(f.freeHeroText).not.toMatch(/paid only/i);
        expect(card.cardType).toBe('oath');
    });
    it('The Congregation Below (hex) → a standing curse; FREE = timed instance', () => {
        const { card, sourceCard } = cardOf('the-congregation-below');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('hex');
        expect(f.freeHeroText).toContain('3 rounds');
        expect(f.freeHeroText).not.toMatch(/paid only/i);
        expect(card.cardType).toBe('hex');
    });
    it('persistent verb slot leads with the PAYLOAD keyword, never the bare type word (owner, 2026-07-12)', () => {
        // Oath/Hex are card TYPES. The headline keyword must be a payload verb
        // the inspect panel can actually gloss — never the type word itself.
        for (const id of ['every-stone-an-oath', 'the-untended-garden', 'caltrops-under-the-snow']) {
            const { card, sourceCard } = cardOf(id);
            const kw = faceStats(card, sourceCard).keyword;
            expect(kw).not.toBeNull();
            expect(kw).not.toBe('OATH');
            expect(kw).not.toBe('HEX');
            // …and the headline keyword is one the panel explains (no orphan chip).
            expect(detailStats(card, sourceCard).keywords.map(k => k.name)).toContain(kw);
        }
        // Every Stone an Oath answers a bloodless round with THORNS; The Untended
        // Garden FESTERs every DoT; Caltrops pays off GUARD.
        expect(faceStats(cardOf('every-stone-an-oath').card, cardOf('every-stone-an-oath').sourceCard).keyword).toBe('THORNS');
        expect(faceStats(cardOf('the-untended-garden').card, cardOf('the-untended-garden').sourceCard).keyword).toBe('FESTER');
        expect(faceStats(cardOf('caltrops-under-the-snow').card, cardOf('caltrops-under-the-snow').sourceCard).keyword).toBe('GUARD');
    });
    it('The Pricking Needle (MARK i4 d3) → +4 per DoT tick, real units', () => {
        const { card, sourceCard } = cardOf('the-pricking-needle');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('mark');
        expect(f.heroText).toBe('+4/tick');   // tickAmplifyFlat 1 × intensity 4
        expect(f.heroSub).toBe('3 turns');
        expect(f.inert).toBe(false);
    });
    it('Contempt of Court (BACKFIRE i8 d3) → 8 per denied rung, real units', () => {
        const { card, sourceCard } = cardOf('contempt-of-court');
        const f = faceStats(card, sourceCard);
        expect(f.kind).toBe('backfire');
        expect(f.heroText).toBe('8/rung');    // backfirePerRung 1 × intensity 8
        expect(f.inert).toBe(false);
    });
});

describe('Option A split rail — freeKeyword/freeValue + typeStrip (owner-picked 2026-07-09)', () => {
    it('Spoiled Poultice → ◇ POISON · ×3 · 2t | BODY · SPELL foot strip', () => {
        const { card, sourceCard } = cardOf('spoiled-poultice');
        const f = faceStats(card, sourceCard);
        // 2026-07-12 (card-wording audit): '×3 · 2t', never the 'i3 d2' code.
        expect(f.freeKeyword).toBe('POISON');
        expect(f.freeValue).toBe('×3 · 2t');
        expect(f.typeStrip).toBe('BODY · SPELL');
    });
    it('Frostbitten Palisade → ◇ GUARD · 4 (the authored free rider, never halved)', () => {
        const { card, sourceCard } = cardOf('frostbitten-palisade');
        const f = faceStats(card, sourceCard);
        expect(f.freeKeyword).toBe('GUARD');
        expect(f.freeValue).toBe('4');
    });
    it('oath / hex → ◇ FREE · timed rounds rail; hex foot prints HEX', () => {
        const venom = cardOf('the-untended-garden');
        const fv = faceStats(venom.card, venom.sourceCard);
        expect(fv.freeKeyword).toBeNull();
        expect(fv.freeValue).toBe('3 rounds');   // the engine's FREE_ENCHANT_ROUNDS truth, via topActionText
        expect(fv.typeStrip).toContain('OATH');
        const curse = cardOf('the-congregation-below');
        const fc = faceStats(curse.card, curse.sourceCard);
        expect(fc.freeValue).toBe('3 rounds');
        expect(fc.typeStrip).toContain('HEX');
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
        // D-fix: a keyword that appears ONLY on the FREE line still renders its
        // panel chip (DRAW is nowhere on this card's paid line).
        expect(d.keywords.map(k => k.name)).toContain('DRAW');
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
        expect(d.outcomeStats.find(st => st.label === 'PER TICK')?.value).toBe('8');
        expect(d.outcomeStats.find(st => st.label === 'TRIGGER')?.value).toBe('per card played');
        expect(d.outcomeStats.find(st => st.label === 'DURATION')?.value).toBe('3t');
        expect(d.stacksText).toBe('Stacks by intensity.');
        // §C: the +DIE read triplet scales the per-tick base (8 → ▲10 / ▼8).
        // 2026-09-21 (W3, owner finding 3) — the decode used to be a separate
        // prose row under the fork; it now rides the triplet, so the combat
        // overlay spends one row on the fact instead of two. `readLegend`
        // keeps the full sentence for the out-of-combat DECK screen.
        expect(d.dieTriplet).toBe('READ ▲10 · —8 · ▼8 — won · even · lost');
        expect(d.readLegend).toContain('▲ won read');
        // The FREE pill is the authored free line, de-abbreviated.
        expect(d.freePill).toBe('poison ×3 · 2 turns');
        // D-fix: the FREE-line rider renders its keyword panel.
        expect(d.keywords.map(k => k.name)).toContain('POISON');
        // The meta chip surfaces the rank name + card type (where gold used to sit).
        expect(d.metaChip).toContain('ASH');
        expect(d.metaChip).toContain('SPELL');
    });
    it('Chilblain Watch (Guard) → terse "Gain Guard 12."', () => {
        const { card, sourceCard } = cardOf('chilblain-watch');
        const d = detailStats(card, sourceCard);
        expect(d.outcomeLine).toBe('Gain Guard 12.');
        expect(d.stacksText).toBeNull();
    });
    it('Oath detail leans on the engine-generated PAID text', () => {
        const { card, sourceCard } = cardOf('the-untended-garden');
        const d = detailStats(card, sourceCard);
        expect(d.powerLine).toContain(card.bottomActionText);
        expect(d.metaChip).toContain('OATH');
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
        // Oath/Hex are card TYPES: they read on the frame's
        // type strip, so the inspect panel carries only what the passive DOES.
        // The Congregation Below bleeds the foe off your discard pile — REQUIEM leads.
        const curse = cardOf('the-congregation-below');
        const ck = detailStats(curse.card, curse.sourceCard).keywords;
        const names = ck.map(k => k.name);
        expect(names).not.toContain('HEX');
        expect(names).not.toContain('OATH');
        expect(names).toEqual(expect.arrayContaining(['REQUIEM']));
        expect(ck.every(k => k.def.length > 0)).toBe(true);  // every chip carries its gloss
        // The Untended Garden deepens every DoT — FESTER leads.
        const garden = cardOf('the-untended-garden');
        const vk = detailStats(garden.card, garden.sourceCard).keywords;
        expect(vk.map(k => k.name)).not.toContain('OATH');
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
        // GHOST/WILD are already explained by its FORGE keyword chip →
        // deduped away.
        const relic = cardOf('saints-finger-bone');
        const d = detailStats(relic.card, relic.sourceCard);
        const terms = d.systemTerms.map(s => s.term);
        expect(terms).toEqual(expect.arrayContaining(['CONVICTION ◆']));
        expect(terms).not.toContain('GHOST ✦');
        expect(terms).not.toContain('WILD / X');
        expect(terms).not.toContain('RUNGS');
        expect(d.keywords.map(k => k.name)).toContain('FORGE');
        // The Offertory Plate carries a '⬡ HEART ×3 spent' threshold line →
        // TOLL renders on the card that actually prints it.
        const plate = cardOf('the-offertory-plate');
        expect(detailStats(plate.card, plate.sourceCard).systemTerms.map(s => s.term))
            .toEqual(expect.arrayContaining(['TOLL ⬡']));
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
        // Petty Indictment prints STAGGER, DEAL and CHARGE — a face can only
        // headline one, so the +DIE row is where all three stay visible.
        const { card, sourceCard } = cardOf('petty-indictment');
        const d = detailStats(card, sourceCard);
        expect(d.diePaidLine).toContain('STAGGER');
        expect(d.diePaidLine).toContain('DEAL');
        expect(d.diePaidLine).toContain('CHARGE');
        expect(d.dieTriplet).toBeNull();  // a STAGGER face takes no read triplet
    });
    it('Miserere surfaces its riding SIPHON on the paid line', () => {
        const { card, sourceCard } = cardOf('miserere');
        const d = detailStats(card, sourceCard);
        expect(d.diePaidLine).toContain('REAP');
        expect(d.diePaidLine).toContain('SIPHON 50%');
    });
    it('a read-scaled Guard card keeps its triplet and enumerates its rider', () => {
        const { card, sourceCard } = cardOf('chilblain-watch');
        const d = detailStats(card, sourceCard);
        expect(d.diePaidLine).toContain('GUARD 12');
        expect(d.diePaidLine).toContain('THORNS');
        expect(d.dieTriplet).toMatch(/^READ ▲\d+ · —12 · ▼\d+ — won · even · lost$/);
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
        expect(resolvePrimary(getCard('chilblain-watch')!, getCardById('chilblain-watch')).kind).toBe('guard');
        expect(resolvePrimary(getCard('frostbitten-palisade')!, getCardById('frostbitten-palisade')).kind).toBe('riposte');
        expect(resolvePrimary(getCard('spoiled-poultice')!, getCardById('spoiled-poultice')).kind).toBe('dot');
        expect(resolvePrimary(getCard('communion-of-the-worm')!, getCardById('communion-of-the-worm')).kind).toBe('rupture');
        expect(resolvePrimary(getCard('miserere')!, getCardById('miserere')).kind).toBe('reap');
        expect(resolvePrimary(getCard('the-untended-garden')!, getCardById('the-untended-garden')).kind).toBe('oath');
        expect(resolvePrimary(getCard('the-congregation-below')!, getCardById('the-congregation-below')).kind).toBe('hex');
    });
    it('armedReadValue scales Guard by the DAMAGE read (+colour match)', () => {
        const guard = faceStats(getCard('chilblain-watch')!, getCardById('chilblain-watch'));
        const base = guard.guardBase!;
        expect(base).toBe(12);
        const adv = Math.max(1, Math.round(base * READ_DAMAGE_MULT.advantage));
        const dis = Math.max(1, Math.round(base * READ_DAMAGE_MULT.disadvantage));
        expect(armedReadValue(guard, 'neutral', false)).toBe(base);
        expect(armedReadValue(guard, 'advantage', false)).toBe(adv);
        expect(armedReadValue(guard, 'disadvantage', false)).toBe(dis);
        // The presenter consumes the ENGINE's rule, not a restatement of it:
        // colorMatchBonus() = max(2, 25% of the base). Asserted on a big base
        // too, where the old flat +3 and the live rule visibly disagree — that
        // divergence is exactly the printed-not-applied bug this catches.
        expect(armedReadValue(guard, 'neutral', true)).toBe(base + colorMatchBonus(base));
        const bigWall = faceStats(getCard('the-hedgehog')!, getCardById('the-hedgehog'));
        const bigBase = bigWall.guardBase!;
        expect(bigBase).toBeGreaterThan(20);
        expect(armedReadValue(bigWall, 'neutral', true)).toBe(bigBase + colorMatchBonus(bigBase));
    });
    it('armedReadValue reads an EVENT DoT per-tick (poison ticks per card, not per turn) — WI-2', () => {
        // Spoiled Poultice: poison dpr 2, i4, card-played. The read scales the
        // PER-TICK bite (▲ +1 intensity → 10/tick; ▼ shortens the window,
        // per-tick unchanged), never a round-clock lifetime.
        const dot = faceStats(getCard('spoiled-poultice')!, getCardById('spoiled-poultice'));
        expect(armedReadValue(dot, 'neutral', false)).toBe(8);          // 8/tick
        expect(armedReadValue(dot, 'advantage', false)).toBe(10);       // +1 intensity → 10/tick
        expect(armedReadValue(dot, 'disadvantage', false)).toBe(8);     // per-tick unchanged by −1 turn
        expect(armedReadValue(dot, 'advantage', true)).toBe(10);        // no colour-match bonus on status
    });
    it('armedReadValue reads a ROUND-CLOCK DoT as its ramp-aware lifetime (exact)', () => {
        // Sketch of a Thought: kindling ember dpr 1, i1, 3 turns, no ramp → 3.
        const dot = faceStats(getCard('fx-ember')!, getCardById('fx-ember'));
        expect(armedReadValue(dot, 'neutral', false)).toBe(3);          // 1+1+1
        expect(armedReadValue(dot, 'advantage', false)).toBe(6);        // +1 intensity: 2+2+2
        expect(armedReadValue(dot, 'disadvantage', false)).toBe(2);     // −1 turn: 1+1
    });
});
