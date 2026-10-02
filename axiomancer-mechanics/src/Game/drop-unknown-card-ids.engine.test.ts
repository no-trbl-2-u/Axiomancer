import { describe, it, expect } from 'vitest';
import { createNewGameState } from './game.reducer';
import { dropUnknownCardIds } from './game.migrate';
import { STARTING_CARD_IDS } from '../Combat/combat.rewards';

// B4 F2 (plan/AUDIT.md): a save written before the card purge keeps purged
// ids, and dealing one throws in `executeCard`. A trial set taken out of the
// library leaves the same residue. Every load drops them.
describe('dropUnknownCardIds', () => {
    const withCards = (knownCards: string[], combatRewardCards?: string[]) => {
        const state = createNewGameState();
        return { ...state, player: { ...state.player, knownCards, combatRewardCards } };
    };

    it('drops unknown ids and keeps known ones, copies and order', () => {
        const out = dropUnknownCardIds(withCards(
            ['grey-strike', 'purged-card', 'grey-strike', 'grey-ward'],
            ['grey-word', 'another-purged-card'],
        ));
        expect(out.player.knownCards).toEqual(['grey-strike', 'grey-strike', 'grey-ward']);
        expect(out.player.combatRewardCards).toEqual(['grey-word']);
    });

    it('falls back to the starting cards when every known card was dropped', () => {
        const out = dropUnknownCardIds(withCards(['purged-card', 'purged-card-2']));
        expect(out.player.knownCards).toEqual([...STARTING_CARD_IDS]);
    });

    it('returns the same state when nothing is unknown', () => {
        const state = withCards(['grey-strike', 'grey-ward'], ['grey-word']);
        expect(dropUnknownCardIds(state)).toBe(state);
    });

    it('leaves an empty deck empty: no cards named is not a purge', () => {
        const state = withCards([]);
        expect(dropUnknownCardIds(state).player.knownCards).toEqual([]);
    });
});
