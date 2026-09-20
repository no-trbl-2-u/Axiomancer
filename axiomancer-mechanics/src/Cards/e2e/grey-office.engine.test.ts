/**
 * Hermetic E2E — Phase 104: the grey office (the fresh-run starter shapes).
 *
 * `grey-strike` ("A Plain Blow") and `grey-ward` ("A Plain Ward") are the
 * two colourless cards (`philosophicalAspect: 'any'`) every brand-new run
 * seeds ten copies of (7 + 3 — see `STARTING_CARD_IDS`,
 * `Combat/combat.rewards.ts`). This suite pins:
 *
 *   - both resolve with the right shape (colourless aspect, `theme: 'grey'`,
 *     Ash tier/rank, spell);
 *   - THE COLOUR LAW's exception: every die colour, plus wild, powers either
 *     card (no fizzle) — the missing half `philosophicalAspect: 'any'` adds;
 *   - FREE/PAID ledgers read exactly 2 / 5, as printed;
 *   - a fresh `STARTING_CARD_IDS`-shaped deck deals exactly 7 grey-strike +
 *     3 grey-ward (`ensureStarterCards`'s verbatim-copy contract);
 *   - neither grey id is ever offered as a reward.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { mockSequentialRng } from '../../test-utils/rng';
import { buildFixtureState } from '../../test-utils/card-fixture';
import { playCombatCard } from '../../Combat/combat.engine';
import { buildCombatDeck } from '../../Combat/combat.deck';
import { getCardById } from '../cards.library';
import { STARTING_CARD_IDS, COMBAT_REWARD_POOL } from '../../Combat/combat.rewards';
import { Player } from '../../Character/characters.mock';
import { deepClone } from '../../Utils';
import type { Character } from '../../Character/types';
import type {
    CombatEncounterState, CombatManaDie, CombatDieColor,
} from '../../Combat/combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

const GREY_IDS = ['grey-strike', 'grey-ward'] as const;

describe('Phase 104 — the grey office: card shape', () => {
    it('both grey cards resolve with the colourless aspect and the grey theme', () => {
        for (const id of GREY_IDS) {
            const card = getCardById(id);
            expect(card, id).toBeDefined();
            expect(card!.philosophicalAspect, id).toBe('any');
            expect(card!.theme, id).toBe('grey');
            expect(card!.tier, id).toBe(1);
            expect(card!.rank, id).toBe(1);
            expect(card!.cardType, id).toBe('spell');
            expect(card!.tags, id).toContain('grey');
            expect(card!.tags, id).toContain('starter');
        }
        expect(getCardById('grey-strike')!.targetType).toBe('enemy');
        expect(getCardById('grey-ward')!.targetType).toBe('self');
    });

    it('neither grey card is ever offered as a reward', () => {
        expect(COMBAT_REWARD_POOL).not.toContain('grey-strike');
        expect(COMBAT_REWARD_POOL).not.toContain('grey-ward');
    });
});

/** A CLEAN fixture with `cardId` staged in hand, powered by a single die of `color`. */
function stateWithDie(cardId: string, color: CombatDieColor): CombatEncounterState {
    const s = buildFixtureState({ clean: true });
    const die: CombatManaDie = { id: 'fx-grey-die', color, state: 'available', temporary: false };
    return {
        ...s,
        hand: [{ uid: 'under-test', cardId }],
        dice: [die],
        draftedDieId: die.id,
    };
}

describe('Phase 104 — the grey office: THE COLOUR LAW exception', () => {
    const COLORS: readonly CombatDieColor[] = ['body', 'mind', 'heart', 'wild'];

    for (const id of GREY_IDS) {
        for (const color of COLORS) {
            it(`a ${color} die powers ${id} (never a fizzle)`, () => {
                mockSequentialRng(0.5);
                const { events } = playCombatCard(stateWithDie(id, color), { uid: 'under-test' }, true);
                expect(events.some(e => e.kind === 'effect-fizzled'), JSON.stringify(events)).toBe(false);
                expect(events.some(e => e.kind === 'card-played')).toBe(true);
            });
        }
    }

    it('colour-match is neutral — a wild-powered play banks no on-colour bonus', () => {
        mockSequentialRng(0.5);
        const { events } = playCombatCard(stateWithDie('grey-strike', 'wild'), { uid: 'under-test' }, true);
        const played = events.find(e => e.kind === 'card-played');
        expect(played && 'colorMatch' in played ? played.colorMatch : undefined).toBe(false);
    });
});

describe('Phase 104 — the grey office: FREE/PAID ledgers read exactly as printed', () => {
    it('grey-strike: FREE deals 2, PAID deals 5', () => {
        mockSequentialRng(0.5);
        const free = playCombatCard(stateWithDie('grey-strike', 'wild'), { uid: 'under-test' }, false);
        const freeHit = free.events.find(e => e.kind === 'damage-dealt' && e.target === 'enemy');
        expect(freeHit && 'amount' in freeHit ? freeHit.amount : undefined).toBe(2);

        mockSequentialRng(0.5);
        const paid = playCombatCard(stateWithDie('grey-strike', 'wild'), { uid: 'under-test' }, true);
        const paidHit = paid.events.find(e => e.kind === 'damage-dealt' && e.target === 'enemy');
        expect(paidHit && 'amount' in paidHit ? paidHit.amount : undefined).toBe(5);
    });

    it('grey-ward: FREE guards 2, PAID guards 5', () => {
        mockSequentialRng(0.5);
        const before = stateWithDie('grey-ward', 'wild');
        const free = playCombatCard(before, { uid: 'under-test' }, false);
        expect((free.state.guard ?? 0) - (before.guard ?? 0)).toBe(2);

        mockSequentialRng(0.5);
        const paid = playCombatCard(before, { uid: 'under-test' }, true);
        expect((paid.state.guard ?? 0) - (before.guard ?? 0)).toBe(5);
    });
});

describe('Phase 104 — the grey office: the fresh-run deck', () => {
    it('a fresh STARTING_CARD_IDS-shaped player deals exactly 7 grey-strike + 3 grey-ward', () => {
        const player: Character = { ...deepClone(Player), knownCards: [...STARTING_CARD_IDS], combatRewardCards: [] };
        const deck = buildCombatDeck(player);
        expect(deck).toHaveLength(10);
        expect(deck.filter(id => id === 'grey-strike')).toHaveLength(7);
        expect(deck.filter(id => id === 'grey-ward')).toHaveLength(3);
    });
});
