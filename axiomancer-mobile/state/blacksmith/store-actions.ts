/**
 * Blacksmith encounter ("The Anvil") — store action glue (Spec 33 §6 /
 * Phase D6c).
 *
 * The pure engine lives in `axiomancer-mechanics` (World/Blacksmith);
 * these wrappers thread its die-gear upgrade session through the mobile
 * `blacksmith` slice. Two-way like the loot-cache / rest minigames: the
 * engine NEVER reads `GameState`. The slice seeds the session from the
 * player's current rail (`player.dieGear`, materialised to a concrete
 * rail) and the player's spendable currency (the PLACEHOLDER budget unit
 * the host maps to ◆/souls — D7 ratifies the numbers). At claim it writes
 * `outcome.rail` back to `Character.dieGear` and deducts `outcome.spent`
 * from the wallet (floors at 0 — the anvil charges, it never indebts).
 *
 * Cap-violating OR unaffordable upgrades are refused LOUDLY by the engine
 * (a refusal card, rail + budget untouched); the slice just relays them.
 */

import type { GameState } from '@mechanics';
import {
    createBlacksmithSession,
    beginBlacksmith as engineBegin,
    honeBlacksmith as engineHone,
    temperBlacksmith as engineTemper,
    swapBlacksmith as engineSwap,
    continueBlacksmithCard as engineContinueCard,
    leaveBlacksmith as engineLeave,
    claimBlacksmithOutcome as engineClaim,
    concreteDefaultRail,
    DIE_GEAR_COLORS,
    pickRestChoiceAnvil,
} from '@mechanics';
import type {
    BlacksmithSession,
    BlacksmithVariantOffer,
    DieGearColor,
    DieGearRail,
} from '@mechanics';
import { resolveMinigameSeed } from '../minigame-seeds';
import { EMPTY_BLACKSMITH_SLICE, type AppStore } from '../store';

/** Flag set once the guided first visit is completed or skipped. */
export const BLACKSMITH_TUTORIAL_FLAG = 'blacksmith-tutorial-done';

/**
 * Dev/test seed override (`globalThis.__AXM_BLACKSMITH_SEED__`),
 * mirroring the hazard/cache/rest hooks. The upgrade transitions are
 * deterministic, so the seed only threads the (unused) RNG.
 */
declare global {
    // eslint-disable-next-line no-var
    var __AXM_BLACKSMITH_SEED__: number | undefined;
}

function setSession(store: AppStore, session: BlacksmithSession | null): void {
    const prev = store.getState().blacksmith ?? EMPTY_BLACKSMITH_SLICE;
    store.setState({ blacksmith: { ...prev, session } });
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

export interface BeginBlacksmithOptions {
    /** Variant gear pieces on offer this visit (swap targets). */
    variants?: readonly BlacksmithVariantOffer[];
    /**
     * Spendable budget for the visit. Defaults to the player's currency
     * (the wallet the claim deducts from — keeps affordability honest).
     */
    budget?: number;
    seed?: number;
    /** Start the guided first visit (sets the `tutorial` flag on the slice). */
    tutorial?: boolean;
    /** Phase 52d — internal: set by `beginRestAnvilHandoffAction` only. */
    handoff?: 'rest-choice';
}

/**
 * Start a blacksmith visit from the player's current rail + wallet.
 * Returns false if one is already open (one anvil at a time).
 */
export function beginBlacksmithAction(store: AppStore, options: BeginBlacksmithOptions = {}): boolean {
    const gameState = store.getState() as unknown as GameState;
    if (store.getState().blacksmith?.session) return false;

    const seed = resolveMinigameSeed(
        'blacksmith',
        options.seed,
        globalThis.__AXM_BLACKSMITH_SEED__,
    );
    const rail = playerRail(gameState);
    const budget = options.budget ?? gameState.player?.currency ?? 0;
    const variants = options.variants ?? [];

    store.setState({
        blacksmith: {
            session: createBlacksmithSession(seed, rail, budget, variants),
            tutorial: options.tutorial === true,
            handoff: options.handoff ?? null,
        },
    });
    return true;
}

/**
 * Rest-choice `anvil` offer hand-off (Phase 52d): opens the REAL
 * blacksmith visit — same screen, same die-gear caps — with an
 * effectively unlimited budget, since the rest node's flat anvil price is
 * the transaction (the composed visit's own PLACEHOLDER tiers must never
 * double-charge or double-refuse on affordability; see
 * `World/RestChoice/restchoice.engine.ts`'s module header). Requires an
 * active rest session in `anvil-pick`. One hand-off at a time, like any
 * other blacksmith visit.
 */
export function beginRestAnvilHandoffAction(store: AppStore): boolean {
    const restChoiceSession = store.getState().rest?.session;
    if (!restChoiceSession || restChoiceSession.phase !== 'anvil-pick') return false;
    return beginBlacksmithAction(store, { budget: Number.MAX_SAFE_INTEGER, handoff: 'rest-choice' });
}

/**
 * Acknowledges the open card during a rest-choice anvil hand-off.
 *
 * A REFUSAL (cap violation) just returns to `forging` so the player can
 * retry a different die/verb — identical to the engine's own
 * `pickRestChoiceAnvil` refusal contract (stays live, no lock, no spend).
 *
 * An ACCEPTED card is the one hone-or-temper the rest node's anvil offer
 * buys. Rather than trusting this ephemeral session's own ledger (which
 * would double-charge against Blacksmith's own PLACEHOLDER prices), the
 * (color, verb) actually picked is replayed through the engine's own
 * `pickRestChoiceAnvil` against the REST session — deterministic, so it
 * reproduces exactly what a direct call would have sealed — and this
 * hand-off session is discarded unclaimed: the rest-choice claim
 * (`state/rest/store-actions.ts`) is the only thing that ever writes
 * currency/dieGear for this visit.
 */
export function continueRestAnvilHandoffCardAction(store: AppStore): void {
    const bs = store.getState().blacksmith?.session;
    if (!bs || bs.phase !== 'card' || !bs.card) return;

    if (bs.card.refused) {
        setSession(store, engineContinueCard(bs));
        return;
    }

    const restChoiceSession = store.getState().rest?.session;
    if (restChoiceSession && restChoiceSession.phase === 'anvil-pick' && bs.card.verb !== 'swap') {
        store.setState({ rest: { session: pickRestChoiceAnvil(restChoiceSession, bs.card.color, bs.card.verb) } });
    }
    store.setState({ blacksmith: EMPTY_BLACKSMITH_SLICE });
}

/** The anvil acknowledged: intro → forging. */
export function startBlacksmithForgingAction(store: AppStore): void {
    const s = store.getState().blacksmith?.session;
    if (!s) return;
    setSession(store, engineBegin(s));
}

/** HONE a die (add a mana face). forging → card (success or loud refusal). */
export function honeBlacksmithAction(store: AppStore, color: DieGearColor): void {
    const s = store.getState().blacksmith?.session;
    if (!s) return;
    setSession(store, engineHone(s, color));
}

/** TEMPER a die (mana face → special face). forging → card. */
export function temperBlacksmithAction(store: AppStore, color: DieGearColor): void {
    const s = store.getState().blacksmith?.session;
    if (!s) return;
    setSession(store, engineTemper(s, color));
}

/** SWAP an offered variant gear piece in for its die. forging → card. */
export function swapBlacksmithAction(store: AppStore, variantId: string): void {
    const s = store.getState().blacksmith?.session;
    if (!s) return;
    setSession(store, engineSwap(s, variantId));
}

/** Acknowledge the open result/refusal flash: card → forging. */
export function continueBlacksmithCardAction(store: AppStore): void {
    const s = store.getState().blacksmith?.session;
    if (!s) return;
    setSession(store, engineContinueCard(s));
}

/** Leave the anvil, sealing the ledger: forging → outcome. */
export function leaveBlacksmithAction(store: AppStore): void {
    const s = store.getState().blacksmith?.session;
    if (!s) return;
    setSession(store, engineLeave(s));
}

export interface ClaimBlacksmithResult {
    applied: boolean;
    spent: number;
    honed: number;
    tempered: number;
    swapped: number;
}

const NOOP_CLAIM: ClaimBlacksmithResult = Object.freeze({
    applied: false,
    spent: 0,
    honed: 0,
    tempered: 0,
    swapped: 0,
});

/**
 * Confirms the ledger and applies the outcome to the engine `GameState`:
 * `outcome.rail` is written to `Character.dieGear`, `outcome.spent` is
 * deducted from the wallet (floors at 0). Clears the slice and persists.
 */
export function claimBlacksmithOutcomeAction(store: AppStore): ClaimBlacksmithResult {
    const s = store.getState().blacksmith?.session;
    if (!s || !s.outcome) return NOOP_CLAIM;
    const done = engineClaim(s);
    if (done.phase !== 'done') return NOOP_CLAIM;

    const outcome = s.outcome;
    const state = store.getState() as unknown as GameState;
    const player = state.player;

    store.setState({
        player: {
            ...player,
            currency: Math.max(0, player.currency - outcome.spent),
            dieGear: outcome.rail,
        },
        blacksmith: EMPTY_BLACKSMITH_SLICE,
    } as never);

    try {
        store.getState().save();
    } catch {
        // Persistence failures must not strand the player on the ledger.
    }

    return {
        applied: true,
        spent: outcome.spent,
        honed: outcome.honed,
        tempered: outcome.tempered,
        swapped: outcome.swapped,
    };
}

/** Clears the anvil without applying anything (dev / navigation escape). */
export function abandonBlacksmithAction(store: AppStore): void {
    const prev = store.getState().blacksmith ?? EMPTY_BLACKSMITH_SLICE;
    store.setState({ blacksmith: { ...prev, session: null } });
}

/**
 * Marks the guided first visit as done (completed or skipped): sets the
 * persistent flag so the map trigger never re-runs it, and persists.
 */
export function completeBlacksmithTutorialAction(store: AppStore, skipped: boolean): void {
    const state = store.getState() as unknown as GameState;
    if (!(state.flags ?? []).includes(BLACKSMITH_TUTORIAL_FLAG)) {
        store.setState({ flags: [...(state.flags ?? []), BLACKSMITH_TUTORIAL_FLAG] } as never);
        try {
            store.getState().save();
        } catch {
            // Persistence failures must not strand the coach.
        }
    }
    void skipped;
}
