/**
 * Hermetic engine test — Phase 104: THE GREY OFFICE.
 *
 * The deck every new run opens with: ten copies of two colourless shapes
 * (`grey-strike` ×7, `grey-ward` ×3). A grey card (`philosophicalAspect:
 * 'any'`) projects as the WILD stance and is powered by ANY die — the colour
 * law's one card-side exception. Pins: the two cards resolve and read as
 * authored (deal 2 / 5, GUARD 2 / 5); every die colour and the wild die
 * power both of them in a live encounter; the fresh deck deals exactly
 * 7 + 3; neither id is ever a reward; and the grey theme never tilts a
 * deck's theme tally.
 */

import { describe, it, expect } from 'vitest';
import { getCardById } from '../cards.library';
import { GREY_OFFICE_CARDS } from '../library/starters.cards';
import { cardStanceColor } from '../../Combat/combat.cards';
import {
    COMBAT_REWARD_POOL, REWARD_THEMES, STARTING_CARD_IDS, GREY_OFFICE_SHAPE, deckThemeCounts, dominantTheme,
} from '../../Combat/combat.rewards';
import { buildCombatDeck } from '../../Combat/combat.deck';
import { draftStanceDie, initializeCombatEncounter, playCombatCard, rollEncounterDice } from '../../Combat/combat.engine';
import { MIN_COMBAT_DECK_SIZE } from '../card.removal';
import { createCharacter } from '../../Character';
import { GraveLarva } from '../../Enemy/enemy.library';
import type { CombatDieColor, CombatEncounterState } from '../../Combat/combat.encounter.types';

const rng = (): number => 0.5;

const freshPlayer = () => ({
    ...createCharacter({ name: 'Novice', level: 1, baseStats: { heart: 5, body: 5, mind: 5 } }),
    knownCards: [...STARTING_CARD_IDS],
    combatRewardCards: [],
});

/** An encounter with `cardId` seated in hand and one die of `color` drafted
 *  (mirrors `big-numbers-ceiling`'s `openFed`, minus the fed board). */
function handWithDie(cardId: string, color: CombatDieColor): CombatEncounterState {
    const deck = [cardId, cardId, cardId, cardId, cardId];
    let s = initializeCombatEncounter({ ...freshPlayer(), knownCards: deck }, GraveLarva, deck, 7);
    s = rollEncounterDice(s, rng).state;
    const dice = [
        { id: 'grey-test-die', color, state: 'available' as const, temporary: false },
        { id: 'grey-test-die-2', color, state: 'available' as const, temporary: false },
    ];
    s = { ...s, dice, draftedDieId: null };
    s = draftStanceDie(s, 'grey-test-die').state;
    return { ...s, hand: [{ uid: 'grey-under-test', cardId }, ...s.hand] };
}

describe('Phase 104 — the grey office cards', () => {
    it('both shapes exist, are grey, Ash, starters, and read as authored', () => {
        const strike = getCardById('grey-strike')!;
        const ward = getCardById('grey-ward')!;
        expect(GREY_OFFICE_CARDS.map(c => c.id)).toEqual(['grey-strike', 'grey-ward']);
        for (const c of [strike, ward]) {
            expect(c.philosophicalAspect).toBe('any');
            expect(c.theme).toBe('grey');
            expect(c.rank).toBe(1);
            expect(c.tags).toContain('starter');
            expect(cardStanceColor(c)).toBe('wild');
        }
        expect(strike.free).toEqual({ damage: 2 });
        expect(strike.specialMechanics).toEqual([{ kind: 'deal', amount: 5 }]);
        expect(ward.free).toEqual({ guard: 2 });
        expect(ward.specialMechanics).toEqual([{ kind: 'guard', amount: 5 }]);
    });

    it('a fresh run deals exactly 7 STRIKE and 3 WARD, and sits on the floor', () => {
        const deck = buildCombatDeck(freshPlayer(), []);
        expect(deck.filter(id => id === 'grey-strike')).toHaveLength(GREY_OFFICE_SHAPE.strike);
        expect(deck.filter(id => id === 'grey-ward')).toHaveLength(GREY_OFFICE_SHAPE.ward);
        expect(deck).toHaveLength(MIN_COMBAT_DECK_SIZE);
    });

    it('neither grey card is ever a reward, and grey is not an offerable theme', () => {
        expect(COMBAT_REWARD_POOL).not.toContain('grey-strike');
        expect(COMBAT_REWARD_POOL).not.toContain('grey-ward');
        expect(REWARD_THEMES as readonly string[]).not.toContain('grey');
    });

    it('the grey office leans nowhere — every theme count is 0 and there is no dominant theme', () => {
        const counts = deckThemeCounts(freshPlayer());
        for (const t of REWARD_THEMES) expect(counts[t]).toBe(0);
        expect(dominantTheme(freshPlayer())).toBeNull();
    });
});

describe('Phase 104 — any die powers a grey card', () => {
    const COLOURS: CombatDieColor[] = ['heart', 'body', 'mind', 'wild'];

    it.each(COLOURS)('a %s die powers A Plain Blow for 5', (color) => {
        const s = handWithDie('grey-strike', color);
        const before = s.enemy.health;
        const { state, events } = playCombatCard(s, { uid: 'grey-under-test' }, true, 'grey-test-die', rng);
        expect(events.some(e => e.kind === 'effect-fizzled')).toBe(false);
        expect(events.some(e => e.kind === 'card-played' && e.dieId === 'grey-test-die')).toBe(true);
        expect(before - state.enemy.health).toBeGreaterThanOrEqual(5);
    });

    it.each(COLOURS)('a %s die powers A Plain Ward for GUARD 5', (color) => {
        const s = handWithDie('grey-ward', color);
        const { state, events } = playCombatCard(s, { uid: 'grey-under-test' }, true, 'grey-test-die', rng);
        expect(events.some(e => e.kind === 'effect-fizzled')).toBe(false);
        expect(state.guard ?? 0).toBeGreaterThanOrEqual(5);
    });

    it('a coloured card still refuses an off-colour die (the law itself is untouched)', () => {
        const s = handWithDie('spoiled-poultice', 'heart'); // a BODY card
        const { events } = playCombatCard(s, { uid: 'grey-under-test' }, true, 'grey-test-die', rng);
        expect(events.some(e => e.kind === 'effect-fizzled')).toBe(true);
    });
});
