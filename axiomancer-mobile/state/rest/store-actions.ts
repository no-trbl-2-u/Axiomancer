/**
 * Rest-choice encounter — store action glue (Phase 52d, replacing the
 * retired rest minigame — see Phase 52e).
 *
 * The pure engine lives in `axiomancer-mechanics` (World/RestChoice); these
 * wrappers thread a rest node's one irreversible choice — `rest` (free
 * heal) / `anvil` (paid die-gear upgrade) / `cut` (paid deck removal) —
 * through the mobile `rest` slice and, at claim, apply the settled ledger
 * to the real `GameState`: heal, shillings spent, `cardRemovals`
 * incremented, the die-gear rail written to `Character.dieGear`, and the
 * inn scar-mend preserved from the retired rest minigame (Phase 52b).
 *
 * The `anvil` offer hands off to the REAL `/blacksmith` screen (Spec 33 §6)
 * rather than duplicating a picker here — see `beginRestAnvilHandoffAction`
 * / `continueRestAnvilHandoffAction` below and their `blacksmith`-slice
 * counterparts in `state/blacksmith/store-actions.ts`. The engine's own
 * `pickRestChoiceAnvil` is what actually seals the rest session's outcome;
 * the blacksmith screen only supplies the (color, verb) pick and the loud
 * cap-legality refusal card, exactly the "die-gear legality check" the
 * engine module header says is the only thing reused from Blacksmith here.
 */

import type { GameState } from '@mechanics';

import {
    buildCombatDeck,
    cardRemovalsOf,
    chooseRestChoiceOffer as engineChooseOffer,
    claimRestChoiceOutcome as engineClaim,
    concreteDefaultRail,
    createRestChoiceSession,
    DEFAULT_REST_SHELTER,
    DIE_GEAR_COLORS,
    isInnShelter,
    pickRestChoiceCut as engineCut,
    removeCardFromCombatDeck,
} from '@mechanics';
import type {
    Character,
    DieGearRail,
    RestChoiceOfferId,
    RestChoiceSession,
    RestShelter,
} from '@mechanics';
import { bankedScarMagnitude, HAZARD_SCAR_FLAG_PREFIX } from '../hazard/store-actions';
import { resolveMinigameSeed } from '../minigame-seeds';
import { EMPTY_REST_SLICE, type AppStore } from '../store';

/**
 * Flag prefix banking a held dream / watchful find from the retired Night
 * Watch. The rest-choice node never writes new ones (52d — see the
 * scope note above), but historical saves still carry them, and
 * `/memoir`'s REMAINS section reads them back — kept per the 52e brief's
 * KEEP list even after the writer that produced them is gone.
 */
export const REST_KEEPSAKE_FLAG_PREFIX = 'night-keepsake:';

/**
 * Dev/test seed override (`globalThis.__AXM_REST_SEED__`), mirroring the
 * hazard/gathering/cache/blacksmith hooks.
 */
declare global {
    // eslint-disable-next-line no-var
    var __AXM_REST_SEED__: number | undefined;
}

function setSession(store: AppStore, session: RestChoiceSession | null): void {
    store.setState({ rest: { session } });
}

/** Materialise the player's current die-gear into a full concrete rail. */
function playerRail(state: GameState): DieGearRail {
    const rail = concreteDefaultRail();
    const worn = state.player?.dieGear;
    if (worn) {
        for (const color of DIE_GEAR_COLORS) {
            const gear = worn[color];
            if (gear) rail[color] = { ...gear };
        }
    }
    return rail;
}

export interface BeginRestOptions {
    seed?: number;
    /**
     * Authored shelter class from the map-event payload (Phase 52b).
     * Defaults to `'camp'` — silence is never a paid bed. Only an
     * `'inn'` night mends hazard-scarred max-VITAE.
     */
    shelter?: RestShelter;
}

/** Start a rest node from the player's current stats. One node at a time. */
export function beginRestAction(store: AppStore, options: BeginRestOptions = {}): boolean {
    const state = store.getState() as unknown as GameState;
    if (store.getState().rest?.session) return false;
    const seed = resolveMinigameSeed('rest', options.seed, globalThis.__AXM_REST_SEED__);
    const player = state.player;
    const flags = state.flags ?? [];
    setSession(store, createRestChoiceSession(seed, {
        shelter: options.shelter ?? DEFAULT_REST_SHELTER,
        maxHealth: player.maxHealth,
        health: player.health,
        currency: player.currency,
        rail: playerRail(state),
        deckCardIds: buildCombatDeck(player, flags),
        removals: cardRemovalsOf(player),
    }));
    return true;
}

/** offer -> outcome | anvil-pick | cut-pick. */
export function chooseRestChoiceOfferAction(store: AppStore, offer: RestChoiceOfferId): void {
    const s = store.getState().rest?.session;
    if (!s) return;
    setSession(store, engineChooseOffer(s, offer));
}

/** cut-pick -> outcome. `cardId` must be one of `session.deckCardIds`. */
export function pickRestChoiceCutAction(store: AppStore, cardId: string): void {
    const s = store.getState().rest?.session;
    if (!s) return;
    setSession(store, engineCut(s, cardId));
}

export interface ClaimRestChoiceResult {
    applied: boolean;
    chosen: RestChoiceOfferId | null;
    healed: number;
    spent: number;
    removedCardId: string | null;
    /** Max-VITAE mended back from hazard scars (`shelter === 'inn'` only). */
    scarMended: number;
}

const NOOP_CLAIM: ClaimRestChoiceResult = Object.freeze({
    applied: false,
    chosen: null,
    healed: 0,
    spent: 0,
    removedCardId: null,
    scarMended: 0,
});

/**
 * Confirms the outcome ledger and applies the rest node to the engine
 * `GameState`.
 *
 * A `cut` outcome only NAMES the removed card (see `RestChoiceOutcome`
 * header) — the real `removeCardFromCombatDeck` call, and the loadout
 * reconciliation it may do, happens here.
 *
 * A night at an INN (`shelter === 'inn'`, authored on the map event's
 * `RestPayload`) mends hazard-scarred max-VITAE regardless of which of the
 * three offers was taken — the shelter is the trigger, not the choice
 * (Phase 52b). The engine computes `rest`'s heal against the PRE-mend
 * maxHealth (it never reads `GameState`), so an inn `rest` pick is topped
 * up here to the post-mend cap rather than under-healing by the mended
 * amount.
 */
export function claimRestChoiceOutcomeAction(store: AppStore): ClaimRestChoiceResult {
    const s = store.getState().rest?.session;
    if (!s || s.phase !== 'outcome' || !s.outcome) return NOOP_CLAIM;
    const done = engineClaim(s);
    if (done.phase !== 'done') return NOOP_CLAIM;

    const outcome = s.outcome;
    const state = store.getState() as unknown as GameState;
    let player: Character = state.player;
    let flags = state.flags ?? [];

    if (outcome.chosen === 'cut' && outcome.removedCardId) {
        const removal = removeCardFromCombatDeck(player, outcome.removedCardId, flags);
        if (removal.ok) {
            player = removal.player;
            flags = removal.flags;
        }
    }

    const isInnRest = isInnShelter(s.shelter);
    const scarMended = isInnRest ? bankedScarMagnitude(flags) : 0;
    if (scarMended > 0) {
        flags = flags.filter((f) => !f.startsWith(HAZARD_SCAR_FLAG_PREFIX));
    }
    const recoveredMax = player.maxHealth + scarMended;

    const healed = outcome.chosen !== 'rest'
        ? 0
        : isInnRest
            ? recoveredMax - player.health
            : Math.min(outcome.healed, recoveredMax - player.health);

    const nextPlayer: Character = {
        ...player,
        maxHealth: recoveredMax,
        health: player.health + healed,
        currency: Math.max(0, player.currency - outcome.spent),
        dieGear: outcome.rail,
        cardRemovals: outcome.removals,
    };

    store.setState({
        player: nextPlayer,
        flags,
        rest: EMPTY_REST_SLICE,
    } as never);

    try {
        store.getState().save();
    } catch {
        // Persistence failures must not strand the player on the ledger.
    }

    return {
        applied: true,
        chosen: outcome.chosen,
        healed,
        spent: outcome.spent,
        removedCardId: outcome.removedCardId,
        scarMended,
    };
}
