/**
 * Hazard Minigame v2 — engine types.
 *
 * This is the mechanics source-of-truth port of the Hazard v2 engine
 * formerly housed under `axiomancer-mobile/state/hazard/`. Mobile
 * components must never compute rules — they render `HazardSessionState`
 * via presenters and dispatch mechanics-owned transitions.
 */

import type { SeedInput } from '../seed';
import type { HazardRngState } from './hazard.rng';

// ---------------------------------------------------------------------------
// Phase 149 — Deck focus, scars, and engagement
// ---------------------------------------------------------------------------

/** Deck archetype classification based on card composition and distribution. */
export type HazardDeckFocus = 
    | 'force-heavy'
    | 'escape-heavy' 
    | 'gold-utility'
    | 'hex-control'
    | 'scarred'
    | 'mixed';

/** Deck scar summary — tracks burden/dead-weight from CRACK cards. */
export interface HazardDeckScars {
    crackCount: number;
    totalCards: number;
    scarRatio: number;
}

/** Three-choice reward offer structure (Phase 149 doctrine). */
export interface HazardRewardOffer {
    /** Obvious benefit to current deck focus. */
    focusBenefit: HazardCardDef;
    /** Stronger card outside current deck focus. */
    offFocusTemptation: HazardCardDef;
    /** Remove-card option data for deck editing. */
    removeCardOption: {
        available: boolean;
        eligibleCardIds: string[];
    };
}

/** Sub-quest drafting choice before route selection. */
export interface HazardSubquestDraft {
    /** 2-3 candidate sub-quests to choose from. */
    candidates: HazardSubquestDef[];
    /** Player's chosen sub-quest (null = none selected yet). */
    chosen: HazardSubquestDef | null;
}

/** Deck identity summary for post-Hazard reporting. */
export interface HazardDeckIdentity {
    focus: HazardDeckFocus;
    scars: HazardDeckScars;
    cardCount: number;
    dominantColors: HazardColor[];
    utilityRatio: number;
}

// ---------------------------------------------------------------------------
// Colours, progress, dice
// ---------------------------------------------------------------------------

/** The only four card/mana colours in the v2 system. */
export type HazardColor = 'red' | 'blue' | 'purple' | 'gold';

/** A die face is a colour or the hostile blocked face. */
export type HazardDieKind = HazardColor | 'hex';

/** The two progress types that fill the meters. */
export type HazardProgressKey = 'force' | 'escape';

export type HazardDieState = 'available' | 'spent';

export interface HazardDie {
    id: string;
    kind: HazardDieKind;
    state: HazardDieState;
    /**
     * True for dice created by card effects (powered convert / re-cast).
     * Display-only distinction; temporary dice follow normal spend rules
     * and — like all dice under the no-re-cast doctrine — persist until
     * spent or the hazard ends.
     */
    temporary?: boolean;
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

export type HazardCardRarity = 'common' | 'uncommon' | 'rare';

export type HazardUtilityEffect =
    | 'draw'
    | 'recast'
    | 'convert'
    | 'aura'
    | 'burst'
    | 'goldvow'
    // ── codex-library mechanics (2026-06-13 expansion) ──
    | 'purge'
    | 'transmute'
    | 'mend'
    | 'bounty'
    | 'ward'
    | 'anchor'
    // ── keyword expansion (2026-06-25) ──
    | 'foretell'
    // ── MTG expansion (2026-06-25) ──
    | 'echo'
    | 'scour';

export type HazardKeywordId =
    | 'surge'
    | 'force'
    | 'escape'
    | 'convert'
    | 'draw'
    | 'recast'
    | 'gilded'
    | 'salvage'
    | 'crack'
    | 'twotone'
    | 'enchant'
    | 'burst'
    | 'rally'
    | 'sacrifice'
    | 'vow'
    | 'choose'
    // ── codex-library mechanics (2026-06-13 expansion) ──
    | 'purge'
    | 'transmute'
    | 'mend'
    | 'bounty'
    | 'ward'
    | 'anchor'
    // ── keyword expansion (2026-06-25) ──
    | 'foretell'
    // ── MTG expansion (2026-06-25) ──
    | 'echo'
    | 'scour'
    // ── heavy card library swap (2026-06-26) ──
    | 'jeopardy'
    | 'miracle'
    | 'buyback'
    | 'delve';

/**
 * Persistent enchantment modifiers (auras). Accumulated on the session by
 * `effect: 'aura'` cards and applied to every qualifying card contribution
 * for the rest of the hazard.
 *  - `auraForce`/`auraEscape`: +X to EVERY played card that contributes that
 *    meter (per card — the user's framing: "added to every card played that
 *    generates that specific value").
 *  - `surgeForce`/`surgeEscape`: +X to every POWERED card's contribution of
 *    that meter (RELIC OF FURY — buffs the surge row, not the meter total).
 */
export interface HazardModifiers {
    auraForce: number;
    auraEscape: number;
    surgeForce: number;
    surgeEscape: number;
}

export const EMPTY_HAZARD_MODIFIERS: HazardModifiers = Object.freeze({
    auraForce: 0,
    auraEscape: 0,
    surgeForce: 0,
    surgeEscape: 0,
});

/**
 * Salvage — the discard benefit. Dragging a card to the trash bin
 * grants this instead of the card's actions. Always strictly weaker
 * than playing the card:
 *  - progress: +amount of one type, THIS round only (it rides
 *    `progressBase`, which the round advance overwrites);
 *  - mana: conjure a temporary die of the card's colour.
 */
export type HazardSalvage =
    | { type: 'progress'; key: HazardProgressKey; amount: number }
    | { type: 'mana' };

export interface HazardCardDef {
    id: string;
    name: string;
    /** Card colour — primary identity (display tint, salvage colour). For a
     *  two-tone card it is also the FIRST of its `colors`. */
    kind: HazardColor;
    /**
     * Die colours (besides the wild gold die) that can power this card.
     * Omitted = `[kind]`. Two-tone cards list two colours — e.g. a red/blue
     * pivot powered by EITHER a red or a blue die.
     */
    colors?: HazardColor[];
    rarity: HazardCardRarity;
    /** Relative frequency in the starter draw pile (reward cards omit it). */
    weight?: number;
    /** FREE (top) action values — contributed the moment the card is staged. */
    f: number;
    e: number;
    /** MANA (bottom / SURGE) action values, used once a die is applied. */
    fp?: number;
    ep?: number;
    /**
     * CHOOSE card: when powered, the single powered value (`fp` === `ep`)
     * feeds ONE meter the player picks at apply-time. `entry.chosenKey`
     * carries the choice (default 'force').
     */
    choose?: boolean;
    /**
     * Optional utility, fired once when the card is APPLIED (powered tier
     * if a die is attached, else base). A card may carry BOTH numbers and
     * a utility (purple hybrids; gold cards lead with the utility and only
     * pay their numbers when a die is applied).
     */
    effect?: HazardUtilityEffect;
    /**
     * Gold ("yellow") cards lead with their utility: the effect always
     * fires at its MAJOR tier (the powered amount / the +die bonus) even
     * with no die attached. The die on a gold card buys its numbers
     * instead. Purple/red/blue utilities omit this — they upgrade from
     * minor to major only when a die is applied.
     */
    majorEffect?: boolean;
    drawBase?: number;
    drawPowered?: number;
    /**
     * ENCHANT (`effect: 'aura'`) payload. `auraBase` is added to the session
     * modifiers at the minor tier; `auraPowered` at the major tier (powered,
     * or a gold `majorEffect` card). Persists for the rest of the hazard.
     */
    auraBase?: Partial<HazardModifiers>;
    auraPowered?: Partial<HazardModifiers>;
    /**
     * BURST (`effect: 'burst'`) payload — progress added to THIS round only
     * (rides `progressBase`). `burstPowered` is the bigger powered tier.
     */
    burstBase?: { force?: number; escape?: number };
    burstPowered?: { force?: number; escape?: number };
    /** WAR-CRY: +force per unspent non-hex die in the pool, fired on apply. */
    burstPerUnspentDieForce?: number;
    /** TIDE TURNS: +escape per unspent non-hex die in the pool, fired on apply. */
    burstPerUnspentDieEscape?: number;
    /** SACRIFICE (BLOODPRICE): VITAE spent on apply (accrues to session). */
    vitaeCost?: number;
    /** GILDED VOW (`effect: 'goldvow'`): one-shot bonus primed onto the next
     *  gold die the player spends powering any card. */
    goldVow?: { force: number; escape: number };
    /** Rider: raise the session momentum cap on apply (SAINT'S PATIENCE). */
    momentumBonus?: number;
    /**
     * MEND (`effect: 'mend'`): VITAE restored at claim on a survived
     * crossing (the opposite ledger line to SACRIFICE's `vitaeCost`).
     */
    mendBase?: number;
    mendPowered?: number;
    /** BOUNTY (`effect: 'bounty'`): shillings banked at claim on a
     *  survived crossing. */
    bountyBase?: number;
    bountyPowered?: number;
    /** WARD (`effect: 'ward'`): flat reduction of the route's total
     *  VITAE penalty at the outcome (floored at 0). */
    wardBase?: number;
    wardPowered?: number;
    /**
     * ANCHOR (`effect: 'anchor'`): raises the session's momentum FLOOR —
     * the minimum total carry banked into the next round, even off a
     * failed round (insurance). Capped by the session momentum cap.
     */
    anchorBase?: number;
    anchorPowered?: number;
    /**
     * FORETELL (`effect: 'foretell'`): reveal top N cards, reorder freely.
     * At powered tier the player may also discard one of the revealed cards.
     * When `foretellScour` is true the player may discard ANY number of
     * revealed cards (Surveil-equivalent — permanent deck thinning).
     */
    foretellBase?: number;
    foretellPowered?: number;
    foretellScour?: boolean;
    /** Draw N cards after the FORETELL resolves (awarded in confirmHazardForetell). */
    foretellDrawCount?: number;
    /**
     * ECHO (`effect: 'burst'` variant inspired by MTG Storm): +force/escape for
     * each card ALREADY applied this round. Rewards playing ECHO last in a chain.
     * Powered tier doubles the per-card bonus.
     */
    echoPerCardForce?: number;
    echoPerCardEscape?: number;
    /**
     * PURGE combo: after a PURGE effect fires, draw this many cards.
     * Rewards the "cut dead weight, draw fresh options" pattern.
     */
    purgeDrawCount?: number;
    /**
     * MEND rider alongside a BURST effect: queues a vitae restoration at claim.
     * Lets sacrifice-burst cards offset their vitae cost with a mend promise.
     */
    burstMendBase?: number;
    burstMendPowered?: number;
    /**
     * JEOPARDY (MTG Spectacle analogue): bonus force/escape when ≥1 round
     * mark is 'X' (i.e. the player has already lost a round). Encourages
     * comeback plays — the cards get better the worse things are going.
     */
    jeopardyForce?: number;
    jeopardyEscape?: number;
    /**
     * MIRACLE (MTG Miracle analogue): bonus force/escape when this is the
     * FIRST card applied this round (no prior applied cards in s.play).
     * Rewards leading with the miracle card instead of saving it.
     */
    firstPlayForce?: number;
    firstPlayEscape?: number;
    /**
     * BUYBACK (MTG Buyback analogue): when powered by a die, this card
     * returns to hand instead of the discard pile after the round resolves.
     * The engine handles this in continueHazardAfterResolve.
     */
    buyback?: boolean;
    /**
     * DELVE (MTG Delve analogue): +N force/escape for EACH card already
     * in the discard pile when applied. Scales with how much of the deck
     * has been spent — rewards late-round or multi-round commitment.
     */
    delveForce?: number;
    delveEscape?: number;
    /**
     * Dead cards (consequence CRACK cards) cannot be powered and
     * contribute nothing — they only clog the hand.
     */
    dead?: boolean;
    /** Discard benefit (trash bin). Omitted = discards for nothing. */
    salvage?: HazardSalvage;
    flavor: string;
    keywords: HazardKeywordId[];
}

/** A physical card instance in hand / play. */
export interface HazardHandEntry {
    uid: string;
    cardId: string;
    /** Die powering this card's MANA action, or null when un-powered. */
    dieId: string | null;
    /**
     * Set once the card is APPLIED. Applying fires the card's utility
     * effect (if any) and locks the card permanently — it can no longer
     * be returned to hand, re-powered, or discarded. A round can only be
     * resolved once every staged card is applied.
     */
    applied?: boolean;
    /** CHOOSE card: which meter the powered value feeds (default 'force'). */
    chosenKey?: HazardProgressKey;
    /** GILDED VOW bonus locked onto this card when a gold die powered it. */
    vowBonus?: { force: number; escape: number };
}

// ---------------------------------------------------------------------------
// Sub-quests (optional per-hazard objectives)
// ---------------------------------------------------------------------------

/** What a completed sub-quest pays out (on a survived crossing). */
export type HazardSubquestRewardKind = 'shillings' | 'vitae' | 'token';

export interface HazardSubquestReward {
    kind: HazardSubquestRewardKind;
    amount: number;
}

/** A sub-quest definition in the catalogue. Pure data — the engine owns the
 *  per-id evaluation logic (see `hazardSubquestStatus`). */
export interface HazardSubquestDef {
    id: string;
    name: string;
    /** Short objective copy, e.g. "Salvage 2+ cards to the bin." */
    desc: string;
    reward: HazardSubquestReward;
}

export type HazardSubquestStatus = 'active' | 'done' | 'failed';

/** The rolled set member tracked on the session. */
export interface HazardSubquestState {
    id: string;
}

/**
 * Rolling metrics the engine accrues so sub-quests can be judged without the
 * objectives reaching into raw play state. Updated at the resolve / discard /
 * apply seams; never alters game rules or progress.
 */
export interface HazardQuestMetrics {
    /** Cards committed into play across the whole hazard (counted at resolve). */
    cardsCommitted: number;
    /** Committed cards that carried a die (powered). */
    cardsPowered: number;
    /** Cards dragged to the bin for salvage. */
    cardsSalvaged: number;
    /** Re-cast / convert utility effects fired. */
    recastConvertApplied: number;
    /** Rounds that carried momentum (>0 surplus) into the next round. */
    momentumCarries: number;
    /** True once the hand was emptied at a round resolve (invariant break). */
    handEmptied: boolean;
    /** Per-round cleared flag, set as each round resolves. */
    roundsCleared: boolean[];
    /** Non-hex dice still available at the final resolve (−1 until recorded). */
    finalDiceAvailable: number;
}

export const EMPTY_HAZARD_QUEST_METRICS: HazardQuestMetrics = Object.freeze({
    cardsCommitted: 0,
    cardsPowered: 0,
    cardsSalvaged: 0,
    recastConvertApplied: 0,
    momentumCarries: 0,
    handEmptied: false,
    roundsCleared: [],
    finalDiceAvailable: -1,
});

/** A judged sub-quest at outcome time (for the rewards ledger). */
export interface HazardSubquestResult {
    id: string;
    name: string;
    desc: string;
    status: HazardSubquestStatus;
    reward: HazardSubquestReward;
}

// ---------------------------------------------------------------------------
// Routes & hazards
// ---------------------------------------------------------------------------

export type HazardRouteKey = 'safe' | 'risk';

export interface HazardSafeRouteDef {
    key: 'safe';
    dual: false;
    /** Combined FORCE+ESCAPE threshold per round. */
    thresholds: number[];
    rewardLabel: string;
    /** Vitae lost per failed round when the hazard ends in failure tiers. */
    penaltyVitae: number;
}

export interface HazardRiskRouteDef {
    key: 'risk';
    dual: true;
    /** Per-round [force, escape] thresholds — BOTH required. */
    thresholds: [number, number][];
    rewardLabel: string;
    penaltyVitae: number;
}

export type HazardRouteDef = HazardSafeRouteDef | HazardRiskRouteDef;

export interface HazardDef {
    id: string;
    title: string;
    scenario: string;
    /**
     * Grim intro copy for the danger modal shown the moment the hazard
     * triggers — short, hopeless, ending on the player's only out.
     * The modal pairs it with the title and the hazard's intro art.
     */
    intro: string;
    /** Dramatic headline on the play board's scene strip. */
    boardHeadline: string;
    /** One-line route flavor shown on the play board. */
    safeBoardNote: string;
    riskBoardNote: string;
    safeRouteName: string;
    riskRouteName: string;
    safeRouteDesc: string;
    riskRouteDesc: string;
    rounds: number;
    safe: HazardSafeRouteDef;
    risk: HazardRiskRouteDef;
}

// ---------------------------------------------------------------------------
// Rounds, outcome, rewards
// ---------------------------------------------------------------------------

export type HazardMark = 'O' | 'X' | 'pending';

export interface HazardResolveInfo {
    cleared: boolean;
    dual: boolean;
    round: number;
    force: number;
    escape: number;
    /** Safe route: combined value + need. */
    combined?: number;
    need?: number;
    /** Risk route: per-meter needs. */
    needF?: number;
    needE?: number;
    /**
     * Momentum (REC#1): surplus carried into the next round, already
     * halved and capped. Zero on a failed round or the final round.
     */
    carryForce: number;
    carryEscape: number;
}

export type HazardOutcomeTier = 'perfect' | 'complete' | 'failure';

export type HazardRewardId = 'cache' | 'relic' | 'vitae' | 'token';

export type HazardConsequenceId = 'tokens' | 'deadcard' | 'maxhp' | 'minhp' | 'curse';

export interface HazardOutcome {
    tier: HazardOutcomeTier;
    wins: number;
    losses: number;
    rewards: HazardRewardId[];
    consequences: HazardConsequenceId[];
    /** Pick-1-of-3 card offer (empty on failure). */
    offerCards: HazardCardDef[];
    /** Perfect runs may decline the card pick. */
    canSkip: boolean;
    /**
     * Reserves (REC#3): unspent non-hex dice at completion each restore
     * 1 VITAE on complete/perfect tiers. Mage Knight's crystal economy —
     * dice you didn't burn are worth something.
     */
    reserveBonus: number;
    /** Vitae lost to the route penalty: penaltyVitae × lost rounds,
     *  reduced by accrued WARD (floored at 0). */
    penaltyVitae: number;
    /** Vitae spent in-run by SACRIFICE cards (BLOODPRICE), applied at claim. */
    vitaeCost: number;
    /** Vitae restored by MEND cards (0 on a failure — the cure needs a
     *  survivor), applied at claim. */
    vitaeRestore: number;
    /** Shillings banked by BOUNTY cards (0 on a failure), applied at claim. */
    bountyShillings: number;
    /** Rolled sub-quests, each judged done/failed/active at outcome. */
    subquests: HazardSubquestResult[];
    /** Bonus shillings from completed sub-quests (0 on a failure). */
    questShillings: number;
    /** Bonus vitae from completed sub-quests (0 on a failure). */
    questVitae: number;
    /** Bonus paradox tokens from completed sub-quests (0 on a failure). */
    questTokens: number;
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export type HazardPhase =
    | 'route-select'
    | 'rolling'
    | 'playing'
    | 'foretell-pending'
    | 'resolve-flash'
    | 'outcome'
    | 'rewards'
    | 'done';

export interface HazardSessionState {
    hazardId: string;
    phase: HazardPhase;
    route: HazardRouteKey | null;
    round: number;
    totalRounds: number;
    marks: HazardMark[];
    /** Card ids remaining in the draw pile (refilled from the deck bag when low). */
    drawPile: string[];
    /** Card ids discarded this hazard (UI shows the count — REC#2). */
    discardPile: string[];
    hand: HazardHandEntry[];
    play: HazardHandEntry[];
    dice: HazardDie[];
    /** Momentum carried into the current round (REC#1). */
    progressBase: { force: number; escape: number };
    /** Persistent enchantment modifiers (auras) — rest-of-hazard. */
    modifiers: HazardModifiers;
    /** Sub-quests rolled for this hazard (objective ids). */
    subquests: HazardSubquestState[];
    /** Sub-quest drafting state (Phase 149). */
    subquestDraft: HazardSubquestDraft;
    /** Rolling metrics that judge the sub-quests. */
    questMetrics: HazardQuestMetrics;
    /** Primed one-shot bonus consumed by the next gold die used to power. */
    goldVow: { force: number; escape: number } | null;
    /** Per-session momentum cap (starts at HAZARD_MOMENTUM_CAP; cards raise it). */
    momentumCap: number;
    /** VITAE spent by sacrifice cards this hazard, applied at claim. */
    vitaeCost: number;
    /** VITAE restored by MEND cards (paid at claim on a survived crossing). */
    vitaeRestore: number;
    /** Shillings banked by BOUNTY cards (paid at claim on a survived crossing). */
    bountyShillings: number;
    /** Flat reduction of the route's total VITAE penalty (WARD cards). */
    wardPenaltyReduction: number;
    /** Momentum FLOOR: minimum total carry banked into the next round,
     *  even off a failed round (ANCHOR cards). Respects `momentumCap`. */
    carryFloor: number;
    /**
     * FORETELL pending state: revealed card ids, powered flag, scour mode
     * (allows discarding any number, not just one), and optional draw reward
     * after the player confirms their ordering.
     */
    foretellPending: { revealed: string[]; powered: boolean; scour: boolean; drawCount: number } | null;
    resolveInfo: HazardResolveInfo | null;
    outcome: HazardOutcome | null;
    /** Reward card picked in the rewards phase (null = skipped / none). */
    pickedRewardCardId: string | null;
    seed: SeedInput;
    rng: HazardRngState;
    /** Monotonic per-session counter backing uid generation. */
    uidCounter: number;
}

// Round-shape constants now live in the central tuning module so the
// hazard-tuning skill has one file to edit. Re-exported here under their
// long-standing names for every existing import site.
export {
    HAZARD_DICE_COUNT,
    HAZARD_HAND_SIZE,
    HAZARD_MOMENTUM_CAP,
} from './hazard.tuning';
