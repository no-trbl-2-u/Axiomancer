/**
 * Quest Board minigame ("The Boy's Almanac") — engine types.
 *
 * The story-quest encounter: a tabletop board game played INSIDE the
 * story. Each main-story beat from `content/story/story-overview.md`
 * becomes its own authored board; the first is `build-the-boat` (the
 * Fishing Village main quest). The fiction: the Boy sketches his plan
 * as a game board in the book his Father gave him, and the player
 * plays the plan — a wooden piece, a carved bone die, a loop of
 * spaces around the village.
 *
 * Design pillars (decided 2026-06-12; micro-games added 2026-06-13):
 *  - "Axiomancer-lite": board spaces echo every other encounter kind
 *    (combat → DUEL, hazard → SNAG, gathering → GATHER, rest → HEARTH,
 *    village → MARKET, interaction → PARLEY, loot-cache → CACHE,
 *    cutscene → OMEN) as small self-contained interactions. The board
 *    NEVER launches a real encounter.
 *  - Each space plays a DISTINCT decision shape, not one shared "safe
 *    vs gamble" gate, so landing on each FEELS different while staying a
 *    handful of taps: GATHER = press-your-luck (wade deeper or bank the
 *    wet haul; a rogue wave busts it), DUEL = allocate grit before one
 *    roll, SNAG = insure the crossing (bare / brace / detour), MARKET =
 *    an escalating shop (repeat buys cost more), PARLEY = an authored
 *    branch whose menu reacts to what you carry. HEARTH / CACHE / OMEN
 *    stay deliberately light — the calm beats that let the tense ones
 *    feel tense.
 *  - Fully sandboxed: the session reads nothing from `GameState` and
 *    only the completion record (board id + outcome tier) flows back.
 *  - Can't fail, only do worse: running out of VIGOR ends the day
 *    early ("home for supper"), never the quest. Performance decides
 *    the outcome TIER, which is cosmetic.
 *  - One full play targets 5–10 minutes (~3 laps, ~14 rolls).
 *
 * Everything mechanical lives in `World/QuestBoard/`; mobile renders
 * `QuestBoardSession` via a presenter and dispatches store actions.
 */

import type { SeedInput } from '../seed';
import type { QuestBoardRngState } from './quest-board.rng';

// ---------------------------------------------------------------------------
// Boat parts (the goal currency)
// ---------------------------------------------------------------------------

/** The four boat-part families the build-the-boat board collects. */
export type QuestPartKind = 'plank' | 'pitch' | 'cloth' | 'nail';

export const QUEST_PART_KINDS: readonly QuestPartKind[] = ['plank', 'pitch', 'cloth', 'nail'];

/** A per-part tally (carried, fitted, or required). */
export type QuestPartTally = Record<QuestPartKind, number>;

export const EMPTY_PART_TALLY: QuestPartTally = Object.freeze({
    plank: 0, pitch: 0, cloth: 0, nail: 0,
});

// ---------------------------------------------------------------------------
// Spaces
// ---------------------------------------------------------------------------

/**
 * The nine space kinds. Each is the board-game echo of one real
 * encounter kind (see file header); `slipway` is the start/goal.
 */
export type QuestSpaceKind =
    | 'slipway'  // start + goal: carried parts fit onto the hull here
    | 'gather'   // gathering echo: roll for materials, push-your-luck
    | 'duel'     // combat echo: a dice duel against a critter
    | 'snag'     // hazard echo: a save roll or pay the price
    | 'hearth'   // rest echo: recover vigor
    | 'market'   // village echo: trade fish for parts
    | 'parley'   // interaction echo: an NPC bargain with choices
    | 'cache'    // loot-cache echo: a hidden find, rolled
    | 'omen';    // cutscene echo: flavor lines + a small turn of luck

/**
 * GATHER is push-your-luck (a `Can't Stop`-style ladder): each PRESS casts
 * the bone die into a "wet haul"; a face ≤ `bustFloor` is the rogue wave —
 * the unbanked haul is lost and `bustBite` vigor with it. Any other face
 * adds `perPress` pieces. STOP banks the wet haul into carried parts. The
 * spot runs dry after `maxPress` successful presses (forcing a bank), so a
 * naive "just keep pressing" line always terminates.
 */
export interface QuestGatherParams {
    /** Part family this spot yields. */
    part: QuestPartKind;
    /** Pieces added to the wet haul per non-bust press. */
    perPress: number;
    /** Die faces at or below this BUST the wade (lose the unbanked haul). */
    bustFloor: number;
    /** Vigor bitten on a bust. */
    bustBite: number;
    /** Successful presses before the spot runs dry and STOP is forced. */
    maxPress: number;
}

export interface QuestDuelParams {
    /** The critter's name, e.g. "THE GULL KING". */
    foe: string;
    /** Added to the foe's die roll. */
    foeBonus: number;
    /** Spoils for winning the duel. */
    spoils: { part: QuestPartKind; count: number };
    /** Vigor lost on a defeat. */
    bite: number;
    /** Fish cost to slip past without fighting (0 = no bribe offered). */
    bribeFish: number;
}

export interface QuestSnagParams {
    /** Roll ≥ threshold to cross clean. */
    threshold: number;
    /** Vigor bitten on a failed crossing. */
    bite: number;
    /** Spaces slipped backward on a failed crossing. */
    slipBack: number;
    /** Fish cost of the safe detour (0 = no detour offered). */
    detourFish: number;
}

export interface QuestHearthParams {
    /** Vigor restored on landing. */
    vigor: number;
}

export interface QuestMarketOffer {
    part: QuestPartKind;
    count: number;
    fishCost: number;
}

export interface QuestMarketParams {
    offers: readonly QuestMarketOffer[];
}

/** One authored option of a parley exchange. */
export interface QuestParleyOption {
    id: string;
    label: string;
    desc: string;
    /**
     * Gate that reacts to what the player carries — the option renders
     * disabled until met. The interaction echo's "inventory changes the
     * menu" beat. (Spending happens via the deltas below; this only gates.)
     */
    requires?: { fish?: number };
    /** Fish delta (negative = paid). */
    fish?: number;
    /** Vigor delta (negative = lost). */
    vigor?: number;
    /** Parts granted. */
    parts?: { part: QuestPartKind; count: number };
    /** Movement bonus added to the next roll (the friend's shortcut). */
    wind?: number;
    /** Result copy shown after picking this option. */
    outcome: string;
}

export interface QuestParleyParams {
    npc: string;
    prompt: string;
    options: readonly QuestParleyOption[];
}

/** One weighted entry of a cache find table. */
export interface QuestCacheFind {
    weight: number;
    label: string;
    fish?: number;
    parts?: { part: QuestPartKind; count: number };
    vigor?: number;
}

export interface QuestCacheParams {
    finds: readonly QuestCacheFind[];
}

export interface QuestOmenParams {
    lines: readonly string[];
    /** Wind (movement bonus on the next roll) the omen grants. */
    wind: number;
}

/** Discriminated space definition. */
export type QuestSpaceDef =
    | { id: string; kind: 'slipway'; name: string; flavor: string }
    | { id: string; kind: 'gather';  name: string; flavor: string; gather: QuestGatherParams }
    | { id: string; kind: 'duel';    name: string; flavor: string; duel: QuestDuelParams }
    | { id: string; kind: 'snag';    name: string; flavor: string; snag: QuestSnagParams }
    | { id: string; kind: 'hearth';  name: string; flavor: string; hearth: QuestHearthParams }
    | { id: string; kind: 'market';  name: string; flavor: string; market: QuestMarketParams }
    | { id: string; kind: 'parley';  name: string; flavor: string; parley: QuestParleyParams }
    | { id: string; kind: 'cache';   name: string; flavor: string; cache: QuestCacheParams }
    | { id: string; kind: 'omen';    name: string; flavor: string; omen: QuestOmenParams };

// ---------------------------------------------------------------------------
// Charms (one-use trinkets — the field-tool echo)
// ---------------------------------------------------------------------------

export type QuestCharmId =
    | 'gull-feather'    // next roll: roll twice, keep the higher
    | 'mothers-locket'  // next duel: +2 on your die
    | 'tar-twine'       // next snag: cross clean without rolling
    | 'lucky-hook'      // next gather: double the yield
    | 'friends-whistle'; // next roll: +2 movement

export interface QuestCharmDef {
    id: QuestCharmId;
    name: string;
    desc: string;
    flavor: string;
}

export interface QuestCharmState {
    id: QuestCharmId;
    used: boolean;
    /** Primed = used this turn, effect pending its trigger. */
    primed: boolean;
}

// ---------------------------------------------------------------------------
// Vows (rolled objectives — the boon echo; judged at outcome)
// ---------------------------------------------------------------------------

export type QuestVowId =
    | 'swift-keel'      // finish by the end of day `QUEST_SWIFT_KEEL_DAY`
    | 'unbitten'        // never drop below 3 vigor
    | 'fed-larder'      // end holding ≥ 4 fish
    | 'gulls-bane'      // win ≥ 2 duels
    | 'tale-collector'; // resolve ≥ 2 parley/omen spaces

export interface QuestVowDef {
    id: QuestVowId;
    name: string;
    desc: string;
}

export type QuestVowStatus = 'active' | 'kept' | 'broken';

export interface QuestVowResult {
    id: QuestVowId;
    name: string;
    desc: string;
    status: QuestVowStatus;
}

// ---------------------------------------------------------------------------
// Boards
// ---------------------------------------------------------------------------

export interface QuestBoardDef {
    /** Stable id, e.g. 'build-the-boat'. One per story beat. */
    id: string;
    /** Board-game title, e.g. "THE BOATWRIGHT'S GAMBIT". */
    title: string;
    /** The story beat this board enacts (for the codex / quest log). */
    storyBeat: string;
    /** Hushed intro copy for the board-reveal overlay. */
    intro: string;
    /** Dramatic headline on the board's scene strip. */
    boardHeadline: string;
    /** The player's piece, e.g. "THE BOY". */
    pieceName: string;
    /** Loop of spaces; index 0 MUST be the slipway (start + goal). */
    spaces: readonly QuestSpaceDef[];
    /** Required part counts to finish the build. */
    partsRequired: QuestPartTally;
    /** Display names per part family, e.g. plank → "HULL PLANKS". */
    partNames: Record<QuestPartKind, string>;
    /** Starting provisions (the cart of fish) and vigor. */
    startFish: number;
    startVigor: number;
    maxVigor: number;
    /** Outcome copy per tier. */
    outcomeCopy: Record<QuestOutcomeTier, string>;
}

// ---------------------------------------------------------------------------
// Turn results (what a resolved space reports back for the flash card)
// ---------------------------------------------------------------------------

/** Display deltas of a resolved space interaction. */
export interface QuestSpaceResult {
    /** Result headline, e.g. "THE GULL KING IS ROUTED". */
    title: string;
    /** Result body copy. */
    body: string;
    /** Die rolls shown on the card (yours first, foe's second if any). */
    rolls: readonly number[];
    fishDelta: number;
    vigorDelta: number;
    partsDelta: Partial<QuestPartTally>;
    /** Wind (movement bonus) granted for the next roll. */
    windDelta: number;
    /** Spaces slipped backward (snag failure). */
    slippedBack: number;
}

/** One option the player may pick on an interactive space. */
export interface QuestSpaceOption {
    id: string;
    label: string;
    desc: string;
    /** Disabled options render greyed with this reason. */
    disabledReason?: string;
}

/** A space awaiting player input (phase 'space'). */
export interface QuestPendingSpace {
    spaceId: string;
    kind: QuestSpaceKind;
    title: string;
    body: string;
    /** Options on offer; empty once `result` is set. */
    options: readonly QuestSpaceOption[];
    /** Filled after the player picks (or immediately for passive spaces). */
    result: QuestSpaceResult | null;
    /**
     * Market only: running record of purchases made this landing. The
     * market keeps its options open (buy several things, then LEAVE);
     * each buy appends a line here and the LEAVE result summarises it.
     */
    ledger?: readonly string[];
    /**
     * Market only: how many times each offer (by index) has been bought
     * this landing. Drives the escalating price — the Nth repeat of an
     * offer costs `marketRamp` more fish than the first.
     */
    purchases?: readonly number[];
    /**
     * Gather only: pieces in the "wet haul" — pressed for but not yet
     * banked, and forfeit on a rogue wave. STOP banks them; the card
     * renders the stack so the player can read the tension.
     */
    haul?: number;
    /**
     * Gather only: successful presses so far (caps at `maxPress`, after
     * which PRESS is disabled and STOP is the only move).
     */
    presses?: number;
}

// ---------------------------------------------------------------------------
// Metrics & outcome
// ---------------------------------------------------------------------------

/** Rolling counters the engine accrues so vows judge without reaching
 *  into play state. Updated at resolution seams only. */
export interface QuestBoardMetrics {
    rolls: number;
    duelsWon: number;
    duelsLost: number;
    snagsSuffered: number;
    fishSpent: number;
    talesHeard: number;
    /** Times vigor hit 0 and the day ended early. */
    collapses: number;
    /** Lowest vigor ever held. */
    lowestVigor: number;
}

/**
 * Outcome tiers (cosmetic — the boat always floats):
 *  - `masterwork` — swift, mostly-kept vows; the village whistles.
 *  - `seaworthy`  — an honest build. It'll hold.
 *  - `driftwood`  — late, bruised, lashed with twine. It floats. Probably.
 */
export type QuestOutcomeTier = 'masterwork' | 'seaworthy' | 'driftwood';

export interface QuestBoardOutcome {
    tier: QuestOutcomeTier;
    daysTaken: number;
    fishLeft: number;
    vigorLeft: number;
    vows: readonly QuestVowResult[];
    vowsKept: number;
    metrics: QuestBoardMetrics;
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export type QuestBoardPhase =
    | 'intro'    // board-reveal overlay
    | 'idle'     // awaiting a roll (or a charm)
    | 'space'    // a space interaction is open (options and/or result)
    | 'dusk'     // day-end flash ("home for supper")
    | 'outcome'  // the boat is built; ledger shown
    | 'done';    // host has claimed the completion record

export interface QuestBoardSession {
    boardId: string;
    phase: QuestBoardPhase;
    /** Piece position: index into `QuestBoardDef.spaces`. */
    pos: number;
    /** 1-based day counter. */
    day: number;
    /** Rolls taken today (of QUEST_STRETCHES_PER_DAY). */
    stretch: number;
    fish: number;
    vigor: number;
    /** Carried (unfitted) parts. */
    parts: QuestPartTally;
    /** Parts fitted onto the hull at the slipway. */
    fitted: QuestPartTally;
    /** Last bone-die roll (display): die face, bonus applied, total. */
    lastRoll: { die: number; bonus: number; total: number } | null;
    /** Open space interaction, when phase = 'space'. */
    pending: QuestPendingSpace | null;
    charms: QuestCharmState[];
    vows: readonly QuestVowId[];
    /** Movement bonus armed for the next roll (wind, whistle…). */
    wind: number;
    /** True when the day ended because vigor collapsed. */
    collapsedToday: boolean;
    metrics: QuestBoardMetrics;
    outcome: QuestBoardOutcome | null;
    seed: SeedInput;
    rng: QuestBoardRngState;
}
