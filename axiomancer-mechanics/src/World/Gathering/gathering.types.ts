/**
 * Gathering Minigame ("The Gleaning") — engine types.
 *
 * The Forage archetype from the encounter brainstorm: extraction and
 * restraint. "How much do you take from a place that may not forgive
 * taking?" A push-your-luck harvest against the site's rising WRATH,
 * with offerings, one-use field tools, three strata of riches, family
 * sets, and rolled boons.
 *
 * Everything mechanical lives in `state/gathering/` so the directory
 * can be lifted into `axiomancer-mechanics` wholesale (mirrors the
 * hazard v2 pattern). Mobile components must never compute rules —
 * they render `GatheringSessionState` via the presenter and dispatch
 * store actions.
 */

import type { SeedInput } from '../seed';
import type { GatheringRngState } from './gathering.rng';

// ---------------------------------------------------------------------------
// Families, depths, approaches
// ---------------------------------------------------------------------------

/** The four material families. Sets are collected per family. */
export type GatherFamily = 'bloom' | 'resin' | 'vein' | 'bone';

export const GATHER_FAMILIES: readonly GatherFamily[] = ['bloom', 'resin', 'vein', 'bone'];

/** Strata index: 0 = verge, 1 = hollow, 2 = root. Descending is one-way. */
export type GatherDepth = 0 | 1 | 2;

export const GATHER_DEPTH_COUNT = 3;

/** The binding stance taken at the threshold of the site. */
export type GatherApproachKey = 'glean' | 'strip';

// ---------------------------------------------------------------------------
// Plots (the face-up spread the player harvests from)
// ---------------------------------------------------------------------------

/**
 * Optional plot traits:
 *  - `gift`   — the site offers this freely (informational; the plot's
 *               authored wrath already reflects the bargain).
 *  - `lure`   — rich and angry (informational; the numbers carry the
 *               temptation, the tag names it).
 *  - `breath` — TENDING, not taking: harvesting yields nothing and
 *               LOWERS wrath by the plot's (negative) authored amount.
 *               Stance/dusk/watcher modifiers never apply to a breath.
 *  - `tangle` — taking it tramples the rest: the other plots in the
 *               spread are discarded and redrawn.
 */
export type GatherPlotTrait = 'gift' | 'lure' | 'breath' | 'tangle';

export interface GatherPlotDef {
    id: string;
    /** Plot name on the spread card, e.g. "MINT CROWN". */
    name: string;
    /** Material item name granted per piece, e.g. "Mire-Mint Crown". */
    yieldName: string;
    family: GatherFamily;
    /** Authored richness (pieces of value). Breath plots author 0. */
    richness: number;
    /** Authored wrath cost. Breath plots author a NEGATIVE value. */
    wrath: number;
    trait?: GatherPlotTrait;
    flavor: string;
}

/** A physical plot instance face-up in the spread. */
export interface GatherPlotEntry {
    uid: string;
    plotId: string;
}

/** One harvested piece in the satchel (at risk until the player leaves). */
export interface GatherPiece {
    uid: string;
    plotId: string;
    family: GatherFamily;
    /** Richness actually yielded (after stance modifiers). */
    richness: number;
    name: string;
}

// ---------------------------------------------------------------------------
// Approaches (the route-select analogue)
// ---------------------------------------------------------------------------

export interface GatherApproachDef {
    key: GatherApproachKey;
    /** Grace granted on entry (the tender hand starts in the site's favour). */
    startGrace: number;
    /** Per-piece richness cap (0 = uncapped). The tender hand takes lightly. */
    richnessCap: number;
    /** Richness added to every taking harvest (the stripping hand takes deep). */
    richnessBonus: number;
    /** Wrath added to every taking harvest. */
    wrathBonus: number;
    /** Fraction of the satchel lost if the site erupts (numerator/denominator). */
    eruptionLoss: { num: number; den: number };
    /** Shillings per point of kept richness at outcome (plunder bonus). */
    plunderPerRichness: number;
}

// ---------------------------------------------------------------------------
// Offerings
// ---------------------------------------------------------------------------

/** What an offering demand costs. Shilling/vitae costs accrue on the
 *  session and settle at claim (the engine never reads player state);
 *  a material demand surrenders a satchel piece of that family. */
export type GatherOfferingDemand =
    | { kind: 'shillings'; amount: number }
    | { kind: 'vitae'; amount: number }
    | { kind: 'material'; family: GatherFamily };

export interface GatherOfferingDef {
    id: string;
    name: string;
    demand: GatherOfferingDemand;
    flavor: string;
}

export interface GatherOfferingState {
    id: string;
    paid: boolean;
}

// ---------------------------------------------------------------------------
// Field tools (one-use)
// ---------------------------------------------------------------------------

export type GatherToolId = 'sickle' | 'veil' | 'twig' | 'bell' | 'jar' | 'spade';

export interface GatherToolDef {
    id: GatherToolId;
    name: string;
    desc: string;
    flavor: string;
}

export interface GatherToolState {
    id: GatherToolId;
    used: boolean;
}

// ---------------------------------------------------------------------------
// Reprisals (the site answers greed)
// ---------------------------------------------------------------------------

export type GatherReprisalId = 'thorns' | 'rot' | 'mire' | 'watcher';

/** A reprisal (or eruption / veiled no-op) staged for the flash overlay.
 *  Effects are applied to the session the moment the event is created;
 *  the entry carries display detail only. */
export interface GatherReprisalEvent {
    kind: GatherReprisalId | 'eruption' | 'veiled';
    /** ROT: the family that spoiled + pieces lost (display). */
    rotFamily?: GatherFamily;
    rotLost?: number;
    /** True when the SEALED JAR absorbed a rot. */
    jarHeld?: boolean;
    /** THORNS / eruption: vitae bitten (display; accrues on the session). */
    bite?: number;
    /** Eruption: pieces clawed back by the site (display). */
    eruptionLost?: number;
}

// ---------------------------------------------------------------------------
// Boons (optional rolled objectives — the sub-quest analogue)
// ---------------------------------------------------------------------------

export type GatherBoonRewardKind = 'shillings' | 'vitae' | 'token';

export interface GatherBoonReward {
    kind: GatherBoonRewardKind;
    amount: number;
}

export interface GatherBoonDef {
    id: string;
    name: string;
    desc: string;
    reward: GatherBoonReward;
}

export type GatherBoonStatus = 'active' | 'done' | 'failed';

export interface GatherBoonState {
    id: string;
}

/** A judged boon at outcome time (for the spoils ledger). */
export interface GatherBoonResult {
    id: string;
    name: string;
    desc: string;
    status: GatherBoonStatus;
    reward: GatherBoonReward;
}

/**
 * Rolling metrics the engine accrues so boons can be judged without the
 * objectives reaching into raw play state. Updated at the harvest /
 * offering / reprisal seams; never alters game rules.
 */
export interface GatherMetrics {
    /** Taking harvests committed (breaths excluded). */
    harvests: number;
    /** Breath plots tended. */
    breathsTended: number;
    /** Offerings paid. */
    offeringsPaid: number;
    /** Reprisals actually suffered (veiled draws excluded). */
    reprisalsSuffered: number;
    /** Taking harvests made at root depth (depth 2). */
    rootHarvests: number;
}

export const EMPTY_GATHER_METRICS: GatherMetrics = Object.freeze({
    harvests: 0,
    breathsTended: 0,
    offeringsPaid: 0,
    reprisalsSuffered: 0,
    rootHarvests: 0,
});

// ---------------------------------------------------------------------------
// Sites
// ---------------------------------------------------------------------------

/** Weighted plot roster entry for one stratum of a site. */
export interface GatherDepthPlotEntry {
    plotId: string;
    weight: number;
}

export interface GatherSiteDef {
    id: string;
    title: string;
    scenario: string;
    /** Hushed intro copy for the site-reveal modal. */
    intro: string;
    /** Dramatic headline on the board's scene strip. */
    boardHeadline: string;
    /** Names of the three strata, shallowest first. */
    depthNames: [string, string, string];
    /** One-line stance flavor shown on the board. */
    gleanBoardNote: string;
    stripBoardNote: string;
    gleanDesc: string;
    stripDesc: string;
    /** Per-stratum weighted plot rosters (index = depth). */
    depths: [GatherDepthPlotEntry[], GatherDepthPlotEntry[], GatherDepthPlotEntry[]];
}

// ---------------------------------------------------------------------------
// Outcome
// ---------------------------------------------------------------------------

/**
 * Outcome tiers:
 *  - `communion` — left in the site's favour (grace + low wrath): full
 *    spoils plus a blessing. The site forgives the taking.
 *  - `laden`     — walked out with the satchel. A clean harvest.
 *  - `despoiled` — took too much and left an angry place: spoils kept,
 *    but the despoiler's scar follows you.
 *  - `routed`    — the site erupted: it claws back part of the satchel
 *    and bites on the way out.
 */
export type GatherOutcomeTier = 'communion' | 'laden' | 'despoiled' | 'routed';

export interface GatherFamilyTotal {
    family: GatherFamily;
    pieces: number;
    richness: number;
    /** Family completed a set (richness ≥ set threshold). */
    set: boolean;
}

export interface GatherOutcome {
    tier: GatherOutcomeTier;
    /** Pieces carried out. */
    kept: GatherPiece[];
    /** Pieces clawed back by the eruption (empty otherwise). */
    lost: GatherPiece[];
    familyTotals: GatherFamilyTotal[];
    /** Families that completed a set. */
    sets: GatherFamily[];
    /** All four families represented among the kept pieces. */
    roundHarvest: boolean;
    /** Shillings: set refinements + round harvest + plunder bonus. */
    shillings: number;
    /** Vitae lost to thorns / the eruption bite (settled at claim). */
    bittenVitae: number;
    /** Vitae spent on offerings (settled at claim). */
    offeringVitae: number;
    /** Shillings spent on offerings (settled at claim). */
    offeringShillings: number;
    /** Communion blessing (vitae restored at claim; 0 otherwise). */
    blessingVitae: number;
    /** Final grace and wrath, for the ledger. */
    grace: number;
    wrath: number;
    /** Despoiled/routed leave a scar (flag + morale shift at claim). */
    scarred: boolean;
    /** Rolled boons, each judged done/failed at outcome. */
    boons: GatherBoonResult[];
    /** Boon bonuses (0 when routed — the site forfeits them). */
    boonShillings: number;
    boonVitae: number;
    boonTokens: number;
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export type GatheringPhase =
    | 'approach-select'
    | 'foraging'
    | 'reprisal'
    | 'outcome'
    | 'rewards'
    | 'done';

export interface GatheringSessionState {
    siteId: string;
    phase: GatheringPhase;
    approach: GatherApproachKey | null;
    /** Taking harvests made so far (drives dusk). */
    turn: number;
    depth: GatherDepth;
    /** Face-up plots on offer. */
    spread: GatherPlotEntry[];
    /** Per-stratum remaining draw bags (plot ids; index = depth). */
    bags: [string[], string[], string[]];
    satchel: GatherPiece[];
    wrath: number;
    grace: number;
    /** Which wrath thresholds have fired (parallel to tuning thresholds). */
    thresholdsFired: boolean[];
    /** Seeded reprisal order (drawn front-first on each crossing). */
    reprisalDeck: GatherReprisalId[];
    /** Reprisal flashes awaiting acknowledgement (phase 'reprisal'). */
    pendingReprisals: GatherReprisalEvent[];
    /** True once the site erupted (outcome computes on continue). */
    erupted: boolean;
    offerings: GatherOfferingState[];
    tools: GatherToolState[];
    /** HORN SICKLE primed: the next taking harvest costs 0 wrath. */
    sickled: boolean;
    /** CLINGING MIRE: the next taking harvest costs +2 wrath. */
    mired: boolean;
    /** THE WARDEN WAKES: all taking harvests cost +1 wrath, permanently. */
    watcherWoken: boolean;
    /** ASHEN VEIL charges (consumes a threshold crossing without a draw). */
    veilCharges: number;
    /** SEALED JAR charges (absorbs a ROT reprisal). */
    jarCharges: number;
    /** Vitae bitten by thorns so far (accrues; settled at claim). */
    bittenVitae: number;
    /** Offering costs accrued (settled at claim; affordability is the
     *  store wrapper's concern — the engine never reads player state). */
    offeringVitae: number;
    offeringShillings: number;
    boons: GatherBoonState[];
    metrics: GatherMetrics;
    outcome: GatherOutcome | null;
    seed: SeedInput;
    rng: GatheringRngState;
    /** Monotonic per-session counter backing uid generation. */
    uidCounter: number;
}
