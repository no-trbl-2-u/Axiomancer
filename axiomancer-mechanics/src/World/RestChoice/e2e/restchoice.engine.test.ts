/**
 * Rest-choice engine ("rest" / "anvil" / "cut") — hermetic unit suite
 * (Phase 52c).
 *
 * No RNG stub needed: every transition here is deterministic by
 * construction (the composed Blacksmith upgrade verbs and the deck-removal
 * primitive are both deterministic themselves — see their own suites).
 * Driven through the PUBLIC BARREL (`../../../index`), the same module path
 * 52d's mobile screen will import.
 */

import { describe, it, expect } from 'vitest';

import {
    createRestChoiceSession,
    chooseRestChoiceOffer,
    pickRestChoiceAnvil,
    pickRestChoiceCut,
    claimRestChoiceOutcome,
    RESTCHOICE_TUNING,
    concreteDefaultRail,
    dieGearMissFaces,
    MIN_COMBAT_DECK_SIZE,
    cardRemovalPrice,
    removeCardFromCombatDeck,
    createCharacter,
    buildCombatDeck,
} from '../../../index';
import type { RestChoiceSession, DieGearRail, Character } from '../../../index';

const DECK = [
    'spoiled-poultice', 'chilblain-watch', 'petty-indictment', 'first-spadeful',
    'grandmothers-psalter', 'thumbprick-oath', 'thin-hymn', 'threadbare-cope',
    'unction-of-boils', 'the-sextons-bell', 'the-long-lent', 'promissory-cut',
] as const; // exactly MIN_COMBAT_DECK_SIZE (12)

function offerSession(overrides: Partial<Parameters<typeof createRestChoiceSession>[1]> = {}): RestChoiceSession {
    return createRestChoiceSession(1, {
        shelter: 'camp',
        maxHealth: 100,
        health: 50,
        currency: 100,
        rail: concreteDefaultRail(),
        deckCardIds: [...DECK, 'the-vig'], // 13 — one above the floor by default
        removals: 0,
        ...overrides,
    });
}

describe('rest-choice — offer phase + lifecycle', () => {
    it('opens with three offers, `rest` always free and enabled', () => {
        const s = offerSession();
        expect(s.phase).toBe('offer');
        const rest = s.offers.find(o => o.id === 'rest')!;
        expect(rest.cost).toBe(0);
        expect(rest.disabledReason).toBeUndefined();
    });

    it('disables `anvil` when the purse cannot cover the flat price', () => {
        const s = offerSession({ currency: RESTCHOICE_TUNING.anvilPrice - 1 });
        const anvil = s.offers.find(o => o.id === 'anvil')!;
        expect(anvil.disabledReason).toMatch(/cover/i);
        expect(chooseRestChoiceOffer(s, 'anvil')).toBe(s); // disabled offer — invalid call, no-op
    });

    it('disables `cut` at the deck floor even with a full purse', () => {
        const s = offerSession({ deckCardIds: [...DECK], currency: 9999 }); // exactly MIN_COMBAT_DECK_SIZE
        const cut = s.offers.find(o => o.id === 'cut')!;
        expect(cut.disabledReason).toMatch(new RegExp(`floor of ${MIN_COMBAT_DECK_SIZE}`));
        expect(chooseRestChoiceOffer(s, 'cut')).toBe(s);
    });

    it('disables `cut` when the escalating price outruns the purse', () => {
        const s = offerSession({ removals: 5, currency: 1 }); // price = 5 + 5*5 = 30
        const cut = s.offers.find(o => o.id === 'cut')!;
        expect(cut.cost).toBe(cardRemovalPrice(5));
        expect(cut.disabledReason).toMatch(/cover/i);
    });

    it('a broke player still has `rest` — never dead-ended', () => {
        const s = offerSession({ currency: 0, deckCardIds: [...DECK] });
        expect(s.offers.find(o => o.id === 'rest')!.disabledReason).toBeUndefined();
        expect(chooseRestChoiceOffer(s, 'rest').phase).toBe('outcome');
    });

    it('committing one offer locks the other two; re-committing is a no-op', () => {
        const committed = chooseRestChoiceOffer(offerSession(), 'rest');
        expect(committed.phase).toBe('outcome');
        expect(chooseRestChoiceOffer(committed, 'anvil')).toBe(committed);
        expect(chooseRestChoiceOffer(committed, 'rest')).toBe(committed);
    });

    it('outcome → done only via claimRestChoiceOutcome; invalid calls are no-ops', () => {
        const s = offerSession();
        expect(claimRestChoiceOutcome(s)).toBe(s); // still 'offer' — no outcome yet
        const committed = chooseRestChoiceOffer(s, 'rest');
        const done = claimRestChoiceOutcome(committed);
        expect(done.phase).toBe('done');
        expect(claimRestChoiceOutcome(done)).toBe(done);
    });
});

describe('rest-choice — `rest` offer', () => {
    it('camp heals exactly 20% of MAX vitae at several max-vitae values', () => {
        for (const maxHealth of [50, 77, 100, 240]) {
            const s = offerSession({ maxHealth, health: 1 });
            const o = chooseRestChoiceOffer(s, 'rest').outcome!;
            expect(o.healed).toBe(Math.round(maxHealth * RESTCHOICE_TUNING.campHealFraction));
        }
    });

    it('camp heal never overheals past maxHealth', () => {
        const s = offerSession({ maxHealth: 100, health: 95 });
        const o = chooseRestChoiceOffer(s, 'rest').outcome!;
        expect(o.healed).toBe(5);
    });

    it('an inn night heals to full, regardless of the 20% figure', () => {
        const s = offerSession({ shelter: 'inn', maxHealth: 100, health: 10 });
        const o = chooseRestChoiceOffer(s, 'rest').outcome!;
        expect(o.healed).toBe(90);
    });

    it('spends nothing and leaves the rail/removals untouched', () => {
        const s = offerSession({ removals: 2 });
        const o = chooseRestChoiceOffer(s, 'rest').outcome!;
        expect(o.spent).toBe(0);
        expect(o.rail).toEqual(s.rail);
        expect(o.removedCardId).toBeNull();
        expect(o.removals).toBe(2);
    });
});

describe('rest-choice — `anvil` offer (composes Blacksmith)', () => {
    it('one HONE adds a mana face and charges the FLAT anvil price, not Blacksmith\'s own tier', () => {
        const s = chooseRestChoiceOffer(offerSession(), 'anvil');
        expect(s.phase).toBe('anvil-pick');
        const picked = pickRestChoiceAnvil(s, 'heart', 'hone');
        expect(picked.phase).toBe('outcome');
        const o = picked.outcome!;
        expect(o.chosen).toBe('anvil');
        expect(o.spent).toBe(RESTCHOICE_TUNING.anvilPrice);
        expect(o.rail.heart.manaFaces).toBe(3);
        expect(dieGearMissFaces(o.rail.heart)).toBe(2);
    });

    it('one TEMPER upgrades a mana face to a special face', () => {
        const s = chooseRestChoiceOffer(offerSession(), 'anvil');
        const picked = pickRestChoiceAnvil(s, 'body', 'temper');
        const o = picked.outcome!;
        expect(o.rail.body.specialFaces).toBe(2);
        expect(o.rail.body.manaFaces).toBe(1);
        expect(o.spent).toBe(RESTCHOICE_TUNING.anvilPrice);
    });

    it('refuses LOUDLY at a die already at its face cap, and leaves the session choosable', () => {
        // Wild already at the 1-miss floor (special 1, mana 4 — the shape three
        // real hones would reach): the next hone is illegal.
        const rail: DieGearRail = {
            ...concreteDefaultRail(),
            wild: { dieColor: 'wild', specialFaces: 1, manaFaces: 4, specialConviction: 2 },
        };
        const s = chooseRestChoiceOffer(offerSession({ rail }), 'anvil');
        const refused = pickRestChoiceAnvil(s, 'wild', 'hone');
        expect(refused.phase).toBe('anvil-pick'); // stays live — no lock, no spend
        expect(refused.pendingRefusal).toMatch(/miss/i);
        expect(refused.outcome).toBeNull();

        // The player can retry with a different die/verb after a refusal.
        const retried = pickRestChoiceAnvil(refused, 'heart', 'hone');
        expect(retried.phase).toBe('outcome');
        expect(retried.outcome!.spent).toBe(RESTCHOICE_TUNING.anvilPrice);
    });

    it('refuses to temper the wild die past its 1-special cap', () => {
        const s = chooseRestChoiceOffer(offerSession(), 'anvil');
        const refused = pickRestChoiceAnvil(s, 'wild', 'temper');
        expect(refused.phase).toBe('anvil-pick');
        expect(refused.pendingRefusal).toMatch(/cap/i);
    });

    it('picking while not in anvil-pick is an invalid call — silent no-op', () => {
        const s = offerSession();
        expect(pickRestChoiceAnvil(s, 'heart', 'hone')).toBe(s);
    });
});

describe('rest-choice — `cut` offer (names a card; the host removes it)', () => {
    it('opens the picker, prices the escalating cost, and locks on a valid pick', () => {
        const s = chooseRestChoiceOffer(offerSession({ removals: 1 }), 'cut');
        expect(s.phase).toBe('cut-pick');
        const picked = pickRestChoiceCut(s, 'thin-hymn');
        expect(picked.phase).toBe('outcome');
        const o = picked.outcome!;
        expect(o.chosen).toBe('cut');
        expect(o.removedCardId).toBe('thin-hymn');
        expect(o.spent).toBe(cardRemovalPrice(1));
        expect(o.removals).toBe(2); // incremented for the host to write back
        expect(o.rail).toEqual(s.rail); // the anvil never ran
        expect(o.healed).toBe(0);
    });

    it('a card not on offer is an invalid call — silent no-op', () => {
        const s = chooseRestChoiceOffer(offerSession(), 'cut');
        expect(pickRestChoiceCut(s, 'no-such-card')).toBe(s);
    });

    it('picking while not in cut-pick is an invalid call — silent no-op', () => {
        const s = offerSession();
        expect(pickRestChoiceCut(s, 'thin-hymn')).toBe(s);
    });

    it('the named card actually shrinks buildCombatDeck\'s output once the host removes it', () => {
        // A real fixture Character whose deck is exactly what this session was
        // authored from — proving `removedCardId` is a valid, composable input
        // to Phase 52a's primitive, which is the host's job at claim.
        const known = DECK.slice(0, 6);
        const rewards = DECK.slice(6);
        const player: Character = {
            ...createCharacter({ name: 'Anvil Fixture', level: 1, baseStats: { heart: 5, body: 5, mind: 5 } }),
            knownCards: [...known],
            combatRewardCards: [...rewards, 'the-vig'],
        };
        const deckCardIds = buildCombatDeck(player);
        expect(deckCardIds).toHaveLength(DECK.length + 1);

        const s = chooseRestChoiceOffer(offerSession({ deckCardIds }), 'cut');
        const picked = pickRestChoiceCut(s, 'the-vig');
        const outcome = picked.outcome!;

        const removal = removeCardFromCombatDeck(player, outcome.removedCardId!);
        expect(removal.ok).toBe(true);
        if (!removal.ok) return;
        expect(buildCombatDeck(removal.player)).toHaveLength(deckCardIds.length - 1);
        expect(removal.player.cardRemovals).toBe(outcome.removals);
    });
});

describe('rest-choice — never reads GameState', () => {
    it('the same authored payload always produces the same offers, independent of call order', () => {
        const a = offerSession();
        const b = offerSession();
        expect(a.offers).toEqual(b.offers);
    });
});
