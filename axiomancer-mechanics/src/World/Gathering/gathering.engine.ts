/**
 * Gathering Minigame ("The Gleaning") — pure engine.
 *
 * Every function takes a `GatheringSessionState` and returns a new one
 * (or the same reference when the transition is illegal). All
 * randomness flows through the session's embedded mulberry32 state, so
 * a session is fully reproducible from its seed.
 *
 * Doctrine:
 *  - Push-your-luck: the player may withdraw at any time during
 *    foraging and keep the satchel. Greed is punished by WRATH —
 *    crossing a threshold draws a reprisal; filling the meter erupts
 *    the site and claws part of the satchel back.
 *  - The approach (GLEAN / STRIP) is binding for the whole site, like
 *    the hazard's route choice.
 *  - Descending a stratum is one-way. The deep is richer and angrier.
 *  - Wrath thresholds fire once each, even if wrath later falls and
 *    re-crosses — the place remembers.
 *  - The engine never reads player state: offering costs in shillings
 *    or vitae ACCRUE on the session and settle at claim (the store
 *    wrapper checks affordability before dispatching).
 */

import {
    GATHERING_BOONS,
    GATHERING_OFFERINGS,
    GATHERING_REPRISAL_ORDER,
    GATHERING_TOOLS,
    getGatherBoonDef,
    getGatherOfferingDef,
    getGatherPlotDef,
    getGatherSiteDef,
} from './gathering.content';
import {
    GATHER_DUSK_AFTER,
    GATHER_SPREAD_SIZE,
    GATHER_WRATH_MAX,
    GATHER_WRATH_THRESHOLDS,
    GATHERING_TUNING,
} from './gathering.tuning';
import { seedRng, shuffle, type GatheringRngState } from './gathering.rng';
import { branchMinigameSeed, type SeedInput } from '../seed';
import {
    EMPTY_GATHER_METRICS,
    GATHER_FAMILIES,
    type GatherApproachDef,
    type GatherApproachKey,
    type GatherBoonResult,
    type GatherBoonState,
    type GatherBoonStatus,
    type GatherDepth,
    type GatherFamily,
    type GatherFamilyTotal,
    type GatherMetrics,
    type GatherOfferingState,
    type GatherOutcome,
    type GatherOutcomeTier,
    type GatherPiece,
    type GatherPlotDef,
    type GatherPlotEntry,
    type GatherReprisalEvent,
    type GatherReprisalId,
    type GatherToolId,
    type GatherToolState,
    type GatheringSessionState,
} from './gathering.types';

/** The rule block for an approach (copy lives in content). */
export function gatherApproachDef(key: GatherApproachKey): GatherApproachDef {
    return GATHERING_TUNING.approaches[key];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Expand a weighted roster into a bag and shuffle it. */
function buildBag(
    rng: GatheringRngState,
    roster: readonly { plotId: string; weight: number }[],
): { bag: string[]; rng: GatheringRngState } {
    const expanded: string[] = [];
    for (const entry of roster) {
        const n = Math.max(1, Math.round(entry.weight));
        for (let i = 0; i < n; i++) expanded.push(entry.plotId);
    }
    const shuffled = shuffle(rng, expanded);
    return { bag: shuffled.value, rng: shuffled.state };
}

/** Draw plots off the front of a bag into spread entries. */
function drawPlots(
    bag: readonly string[],
    uidCounter: number,
    n: number,
): { drawn: GatherPlotEntry[]; bag: string[]; uidCounter: number } {
    let uc = uidCounter;
    const drawn = bag.slice(0, n).map((plotId) => {
        uc += 1;
        return { uid: `p${uc}`, plotId };
    });
    return { drawn, bag: bag.slice(n), uidCounter: uc };
}

/** Refill the spread up to the standard size from the current bag. */
function refillSpread(s: GatheringSessionState): GatheringSessionState {
    if (s.spread.length >= GATHER_SPREAD_SIZE) return s;
    const want = GATHER_SPREAD_SIZE - s.spread.length;
    const draw = drawPlots(s.bags[s.depth], s.uidCounter, want);
    if (draw.drawn.length === 0) return s;
    const bags = s.bags.slice() as GatheringSessionState['bags'];
    bags[s.depth] = draw.bag;
    return { ...s, spread: [...s.spread, ...draw.drawn], bags, uidCounter: draw.uidCounter };
}

// ---------------------------------------------------------------------------
// Wrath application (thresholds, reprisals, eruption)
// ---------------------------------------------------------------------------

/** Rot: the fullest family spoils. Returns the new satchel + display info. */
function applyRot(satchel: GatherPiece[]): { satchel: GatherPiece[]; family: GatherFamily | undefined; lost: number } {
    if (satchel.length === 0) return { satchel, family: undefined, lost: 0 };
    let family: GatherFamily = GATHER_FAMILIES[0];
    let most = -1;
    for (const f of GATHER_FAMILIES) {
        const count = satchel.filter((p) => p.family === f).length;
        if (count > most) {
            most = count;
            family = f;
        }
    }
    const R = GATHERING_TUNING.reprisals.rotLoss;
    const lossCount = Math.floor((most * R.num) / R.den);
    if (lossCount <= 0) return { satchel, family, lost: 0 };
    // Lowest richness first — the decay takes the small things.
    const victims = satchel
        .filter((p) => p.family === family)
        .sort((a, b) => a.richness - b.richness)
        .slice(0, lossCount)
        .map((p) => p.uid);
    return {
        satchel: satchel.filter((p) => !victims.includes(p.uid)),
        family,
        lost: lossCount,
    };
}

/** Apply one drawn reprisal's effect and return the staged flash event. */
function applyReprisal(s: GatheringSessionState, id: GatherReprisalId): {
    state: GatheringSessionState;
    event: GatherReprisalEvent;
} {
    if (id === 'thorns') {
        const bite = GATHERING_TUNING.reprisals.thornsBite;
        return {
            state: {
                ...s,
                bittenVitae: s.bittenVitae + bite,
                metrics: { ...s.metrics, reprisalsSuffered: s.metrics.reprisalsSuffered + 1 },
            },
            event: { kind: 'thorns', bite },
        };
    }
    if (id === 'rot') {
        if (s.jarCharges > 0) {
            // The SEALED JAR absorbs the decay — not counted as suffered.
            return {
                state: { ...s, jarCharges: s.jarCharges - 1 },
                event: { kind: 'rot', jarHeld: true, rotLost: 0 },
            };
        }
        const rot = applyRot(s.satchel);
        return {
            state: {
                ...s,
                satchel: rot.satchel,
                metrics: { ...s.metrics, reprisalsSuffered: s.metrics.reprisalsSuffered + 1 },
            },
            event: { kind: 'rot', rotFamily: rot.family, rotLost: rot.lost },
        };
    }
    if (id === 'mire') {
        return {
            state: {
                ...s,
                mired: true,
                metrics: { ...s.metrics, reprisalsSuffered: s.metrics.reprisalsSuffered + 1 },
            },
            event: { kind: 'mire' },
        };
    }
    // watcher
    return {
        state: {
            ...s,
            watcherWoken: true,
            metrics: { ...s.metrics, reprisalsSuffered: s.metrics.reprisalsSuffered + 1 },
        },
        event: { kind: 'watcher' },
    };
}

/**
 * Apply a wrath delta and resolve consequences:
 *  - filling the meter ERUPTS the site (supersedes any threshold draw);
 *  - newly crossed thresholds each draw one reprisal (ASHEN VEIL
 *    consumes a crossing without a draw);
 *  - relief simply lowers the meter — fired thresholds never re-fire.
 * Any staged events flip the phase to 'reprisal'.
 */
function applyWrathDelta(s: GatheringSessionState, delta: number): GatheringSessionState {
    const wrath = Math.max(0, Math.min(GATHER_WRATH_MAX, s.wrath + delta));
    let ns: GatheringSessionState = { ...s, wrath };
    if (delta <= 0) return ns;

    if (wrath >= GATHER_WRATH_MAX) {
        const A = gatherApproachDef(ns.approach ?? 'glean');
        const lossCount = Math.ceil((ns.satchel.length * A.eruptionLoss.num) / A.eruptionLoss.den);
        return {
            ...ns,
            erupted: true,
            phase: 'reprisal',
            pendingReprisals: [
                { kind: 'eruption', bite: GATHERING_TUNING.eruption.bite, eruptionLost: lossCount },
            ],
        };
    }

    const fired = ns.thresholdsFired.slice();
    const events: GatherReprisalEvent[] = [];
    let reprisalDeck = ns.reprisalDeck;
    let veilCharges = ns.veilCharges;
    for (let i = 0; i < GATHER_WRATH_THRESHOLDS.length; i++) {
        if (fired[i] || wrath < GATHER_WRATH_THRESHOLDS[i]) continue;
        fired[i] = true;
        if (veilCharges > 0) {
            veilCharges -= 1;
            events.push({ kind: 'veiled' });
            continue;
        }
        const drawn = reprisalDeck[0];
        if (!drawn) continue;
        reprisalDeck = reprisalDeck.slice(1);
        const applied = applyReprisal({ ...ns, thresholdsFired: fired, reprisalDeck, veilCharges }, drawn);
        ns = applied.state;
        events.push(applied.event);
    }
    ns = { ...ns, thresholdsFired: fired, reprisalDeck, veilCharges };
    if (events.length > 0) {
        return { ...ns, phase: 'reprisal', pendingReprisals: [...ns.pendingReprisals, ...events] };
    }
    return ns;
}

// ---------------------------------------------------------------------------
// Session lifecycle
// ---------------------------------------------------------------------------

/**
 * Offerings / tools / boons / the reprisal order are rolled off
 * INDEPENDENT seeded streams (branched from the session seed) so their
 * selection never perturbs the plot bags — the play stream stays
 * byte-for-byte identical across catalogue growth, keeping the balance
 * sim and deterministic tests stable.
 */
function rollOfferings(seed: SeedInput): GatherOfferingState[] {
    const rng = seedRng(branchMinigameSeed(seed, 0x0ff35e1));
    const ids = GATHERING_OFFERINGS.map((o) => o.id);
    const picked = shuffle(rng, ids).value.slice(0, GATHERING_TUNING.offerings.pickCount);
    return picked.map((id) => ({ id, paid: false }));
}

function rollTools(seed: SeedInput): GatherToolState[] {
    const rng = seedRng(branchMinigameSeed(seed, 0x700a15));
    const ids = GATHERING_TOOLS.map((t) => t.id);
    const picked = shuffle(rng, ids).value.slice(0, GATHERING_TUNING.tools.pickCount);
    return picked.map((id) => ({ id, used: false }));
}

function rollBoons(seed: SeedInput): GatherBoonState[] {
    const rng = seedRng(branchMinigameSeed(seed, 0xb0035));
    const ids = GATHERING_BOONS.map((b) => b.id);
    const picked = shuffle(rng, ids).value.slice(0, GATHERING_TUNING.boons.pickCount);
    return picked.map((id) => ({ id }));
}

function rollReprisalDeck(seed: SeedInput): GatherReprisalId[] {
    const rng = seedRng(branchMinigameSeed(seed, 0x53e1f));
    return shuffle(rng, GATHERING_REPRISAL_ORDER).value;
}

/**
 * Creates a fresh session in `approach-select`: the three strata bags
 * are built and the verge spread is face-up — the player sees the first
 * plots BEFORE committing to an approach (mirrors the hazard's
 * opening-hand-before-route reveal).
 */
export function createGatheringSession(seed: SeedInput, siteId: string): GatheringSessionState {
    const site = getGatherSiteDef(siteId);
    let rng = seedRng(seed);
    const bags: string[][] = [];
    for (const roster of site.depths) {
        const built = buildBag(rng, roster);
        rng = built.rng;
        bags.push(built.bag);
    }
    const draw = drawPlots(bags[0], 0, GATHER_SPREAD_SIZE);
    bags[0] = draw.bag;
    return {
        siteId,
        phase: 'approach-select',
        approach: null,
        turn: 0,
        depth: 0,
        spread: draw.drawn,
        bags: bags as GatheringSessionState['bags'],
        satchel: [],
        wrath: 0,
        grace: 0,
        thresholdsFired: GATHER_WRATH_THRESHOLDS.map(() => false),
        reprisalDeck: rollReprisalDeck(seed),
        pendingReprisals: [],
        erupted: false,
        offerings: rollOfferings(seed),
        tools: rollTools(seed),
        sickled: false,
        mired: false,
        watcherWoken: false,
        veilCharges: 0,
        jarCharges: 0,
        bittenVitae: 0,
        offeringVitae: 0,
        offeringShillings: 0,
        boons: rollBoons(seed),
        metrics: { ...EMPTY_GATHER_METRICS },
        outcome: null,
        seed,
        rng,
        uidCounter: draw.uidCounter,
    };
}

/** The approach is binding for the whole site. Begins the foraging. */
export function selectGatheringApproach(
    s: GatheringSessionState,
    approach: GatherApproachKey,
): GatheringSessionState {
    if (s.phase !== 'approach-select') return s;
    const def = gatherApproachDef(approach);
    return { ...s, phase: 'foraging', approach, grace: s.grace + def.startGrace };
}

// ---------------------------------------------------------------------------
// Previews (presenter-facing; MUST match the harvest math below)
// ---------------------------------------------------------------------------

/** The wrath this plot would cost (or relieve) if harvested right now. */
export function gatheringHarvestWrath(s: GatheringSessionState, def: GatherPlotDef): number {
    if (def.trait === 'breath') return def.wrath;
    if (s.sickled) return 0;
    const A = gatherApproachDef(s.approach ?? 'glean');
    let w = def.wrath + A.wrathBonus;
    if (s.watcherWoken) w += 1;
    if (s.mired) w += GATHERING_TUNING.tools.mireSurcharge;
    if (s.turn >= GATHER_DUSK_AFTER) w += 1;
    return Math.max(0, w);
}

/** The richness this plot would yield if harvested right now. */
export function gatheringHarvestYield(s: GatheringSessionState, def: GatherPlotDef): number {
    if (def.trait === 'breath') return 0;
    const A = gatherApproachDef(s.approach ?? 'glean');
    let r = def.richness + A.richnessBonus;
    if (A.richnessCap > 0) r = Math.min(r, A.richnessCap);
    return r;
}

/** Dusk has fallen: takings cost +1 wrath. */
export function gatheringDuskFallen(s: GatheringSessionState): boolean {
    return s.turn >= GATHER_DUSK_AFTER;
}

// ---------------------------------------------------------------------------
// Foraging actions
// ---------------------------------------------------------------------------

/**
 * Harvest a plot from the spread. A taking yields pieces and angers the
 * site; a BREATH plot yields nothing and soothes it. TANGLE plots
 * trample the rest of the spread. The spread refills from the stratum
 * bag afterwards (it thins out as the stratum is exhausted).
 */
export function harvestGatheringPlot(s: GatheringSessionState, uid: string): GatheringSessionState {
    if (s.phase !== 'foraging') return s;
    const entry = s.spread.find((p) => p.uid === uid);
    if (!entry) return s;
    const def = getGatherPlotDef(entry.plotId);

    if (def.trait === 'breath') {
        let ns: GatheringSessionState = {
            ...s,
            spread: s.spread.filter((p) => p.uid !== uid),
            metrics: { ...s.metrics, breathsTended: s.metrics.breathsTended + 1 },
        };
        ns = refillSpread(ns);
        return applyWrathDelta(ns, def.wrath);
    }

    const wrathCost = gatheringHarvestWrath(s, def);
    const richness = gatheringHarvestYield(s, def);
    const uidCounter = s.uidCounter + 1;
    const piece: GatherPiece = {
        uid: `g${uidCounter}`,
        plotId: def.id,
        family: def.family,
        richness,
        name: def.yieldName,
    };
    let spread = s.spread.filter((p) => p.uid !== uid);
    if (def.trait === 'tangle') spread = [];
    let ns: GatheringSessionState = {
        ...s,
        spread,
        satchel: [...s.satchel, piece],
        turn: s.turn + 1,
        sickled: false,
        mired: false,
        uidCounter,
        metrics: {
            ...s.metrics,
            harvests: s.metrics.harvests + 1,
            rootHarvests: s.metrics.rootHarvests + (s.depth === 2 ? 1 : 0),
        },
    };
    ns = refillSpread(ns);
    return applyWrathDelta(ns, wrathCost);
}

/** Descend one stratum (one-way). The spread is abandoned and redrawn. */
export function descendGathering(s: GatheringSessionState): GatheringSessionState {
    if (s.phase !== 'foraging') return s;
    if (s.depth >= 2) return s;
    const depth = (s.depth + 1) as GatherDepth;
    const draw = drawPlots(s.bags[depth], s.uidCounter, GATHER_SPREAD_SIZE);
    const bags = s.bags.slice() as GatheringSessionState['bags'];
    bags[depth] = draw.bag;
    return { ...s, depth, spread: draw.drawn, bags, uidCounter: draw.uidCounter };
}

/**
 * Pay an offering demand: wrath eases and grace grows. Shilling / vitae
 * demands accrue on the session (settled at claim — the STORE checks
 * affordability before dispatching); a material demand surrenders the
 * least-rich satchel piece of that family and is refused without one.
 */
export function payGatheringOffering(s: GatheringSessionState, offeringId: string): GatheringSessionState {
    if (s.phase !== 'foraging') return s;
    const state = s.offerings.find((o) => o.id === offeringId);
    if (!state || state.paid) return s;
    const def = getGatherOfferingDef(offeringId);
    let ns: GatheringSessionState = s;
    if (def.demand.kind === 'material') {
        const family = def.demand.family;
        const candidates = s.satchel.filter((p) => p.family === family);
        if (candidates.length === 0) return s;
        const surrendered = candidates.reduce((min, p) => (p.richness < min.richness ? p : min), candidates[0]);
        ns = { ...ns, satchel: ns.satchel.filter((p) => p.uid !== surrendered.uid) };
    } else if (def.demand.kind === 'shillings') {
        ns = { ...ns, offeringShillings: ns.offeringShillings + def.demand.amount };
    } else {
        ns = { ...ns, offeringVitae: ns.offeringVitae + def.demand.amount };
    }
    return {
        ...ns,
        wrath: Math.max(0, ns.wrath - GATHERING_TUNING.offerings.wrathRelief),
        grace: ns.grace + GATHERING_TUNING.offerings.grace,
        offerings: ns.offerings.map((o) => (o.id === offeringId ? { ...o, paid: true } : o)),
        metrics: { ...ns.metrics, offeringsPaid: ns.metrics.offeringsPaid + 1 },
    };
}

/** Use a one-shot field tool. */
export function useGatheringTool(s: GatheringSessionState, toolId: GatherToolId): GatheringSessionState {
    if (s.phase !== 'foraging') return s;
    const tool = s.tools.find((t) => t.id === toolId);
    if (!tool || tool.used) return s;
    const tools: GatherToolState[] = s.tools.map((t) => (t.id === toolId ? { ...t, used: true } : t));
    if (toolId === 'sickle') return { ...s, tools, sickled: true };
    if (toolId === 'veil') return { ...s, tools, veilCharges: s.veilCharges + 1 };
    if (toolId === 'jar') return { ...s, tools, jarCharges: s.jarCharges + 1 };
    if (toolId === 'bell') {
        return { ...s, tools, wrath: Math.max(0, s.wrath - GATHERING_TUNING.tools.bellRelief) };
    }
    if (toolId === 'twig') {
        const draw = drawPlots(s.bags[s.depth], s.uidCounter, GATHER_SPREAD_SIZE);
        const bags = s.bags.slice() as GatheringSessionState['bags'];
        bags[s.depth] = draw.bag;
        return { ...s, tools, spread: draw.drawn, bags, uidCounter: draw.uidCounter };
    }
    // spade — turn more ground: extra plots join the spread.
    const draw = drawPlots(s.bags[s.depth], s.uidCounter, GATHERING_TUNING.tools.spadeReveal);
    const bags = s.bags.slice() as GatheringSessionState['bags'];
    bags[s.depth] = draw.bag;
    return { ...s, tools, spread: [...s.spread, ...draw.drawn], bags, uidCounter: draw.uidCounter };
}

/** Dismiss the current reprisal flash; the eruption flows into the outcome. */
export function continueGatheringAfterReprisal(s: GatheringSessionState): GatheringSessionState {
    if (s.phase !== 'reprisal') return s;
    const remaining = s.pendingReprisals.slice(1);
    if (remaining.length > 0) return { ...s, pendingReprisals: remaining };
    if (s.erupted) {
        const outcome = computeOutcome(s);
        return { ...s, pendingReprisals: [], phase: 'outcome', outcome };
    }
    return { ...s, pendingReprisals: [], phase: 'foraging' };
}

/** Walk away with the satchel. Restraint is always available. */
export function withdrawFromGathering(s: GatheringSessionState): GatheringSessionState {
    if (s.phase !== 'foraging') return s;
    const outcome = computeOutcome(s);
    return { ...s, phase: 'outcome', outcome };
}

/** Outcome modal acknowledged → spoils ledger. */
export function acknowledgeGatheringOutcome(s: GatheringSessionState): GatheringSessionState {
    if (s.phase !== 'outcome') return s;
    return { ...s, phase: 'rewards' };
}

/**
 * Confirms the spoils ledger. Terminal phase; the store applies the
 * outcome to real game state and clears the session.
 */
export function claimGatheringSpoils(s: GatheringSessionState): GatheringSessionState {
    if (s.phase !== 'rewards') return s;
    if (!s.outcome) return s;
    return { ...s, phase: 'done' };
}

// ---------------------------------------------------------------------------
// Sets & boons
// ---------------------------------------------------------------------------

/** Per-family totals over a set of pieces (satchel or kept spoils). */
export function gatheringFamilyTotals(pieces: readonly GatherPiece[]): GatherFamilyTotal[] {
    return GATHER_FAMILIES.map((family) => {
        const mine = pieces.filter((p) => p.family === family);
        const richness = mine.reduce((sum, p) => sum + p.richness, 0);
        return {
            family,
            pieces: mine.length,
            richness,
            set: richness >= GATHERING_TUNING.sets.threshold,
        };
    });
}

/**
 * Judges a single boon against the session. `final` is true once the
 * gleaning is over — only then can a "reach N by the end" objective be
 * declared failed; invariant breaks (a reprisal suffered, dusk
 * overstayed) flip to `failed` the moment they happen so the board can
 * grey them out.
 */
export function gatheringBoonStatus(
    id: string,
    s: Pick<GatheringSessionState, 'wrath' | 'turn' | 'satchel' | 'metrics'>,
    final: boolean,
): GatherBoonStatus {
    const B = GATHERING_TUNING.boons;
    const m: GatherMetrics = s.metrics;
    const reachable = (met: boolean): GatherBoonStatus => (met ? 'done' : final ? 'failed' : 'active');
    switch (id) {
        case 'lightfoot':
            // Wrath can still fall (offerings / breaths) — judged at the end.
            if (!final) return 'active';
            return s.wrath <= B.lightfootWrathMax ? 'done' : 'failed';
        case 'devout':
            return reachable(m.offeringsPaid >= B.devoutCount);
        case 'keeper':
            return reachable(gatheringFamilyTotals(s.satchel).some((f) => f.set));
        case 'unbitten':
            if (m.reprisalsSuffered > 0) return 'failed';
            return final ? 'done' : 'active';
        case 'root-delver':
            return reachable(m.rootHarvests >= B.rootDelverCount);
        case 'swift':
            if (s.turn > B.swiftTurnMax) return 'failed';
            return final ? 'done' : 'active';
        default:
            return 'active';
    }
}

/** Judges every rolled boon for the spoils ledger. */
export function gatheringBoonResults(s: GatheringSessionState, final: boolean): GatherBoonResult[] {
    return s.boons.map((b) => {
        const def = getGatherBoonDef(b.id);
        return {
            id: b.id,
            name: def.name,
            desc: def.desc,
            status: gatheringBoonStatus(b.id, s, final),
            reward: def.reward,
        };
    });
}

// ---------------------------------------------------------------------------
// Outcome
// ---------------------------------------------------------------------------

export function gatheringTierOf(
    s: Pick<GatheringSessionState, 'erupted' | 'grace' | 'wrath' | 'satchel'>,
    keptCount: number,
): GatherOutcomeTier {
    const O = GATHERING_TUNING.outcome;
    if (s.erupted) return 'routed';
    if (s.grace >= O.communionGrace && s.wrath <= O.communionWrathMax && keptCount > 0) return 'communion';
    if (s.wrath >= O.despoilWrathMin) return 'despoiled';
    return 'laden';
}

function computeOutcome(s: GatheringSessionState): GatherOutcome {
    const A = gatherApproachDef(s.approach ?? 'glean');

    // Eruption claws back richest-first; a clean exit keeps everything.
    let kept = s.satchel;
    let lost: GatherPiece[] = [];
    if (s.erupted) {
        const lossCount = Math.ceil((s.satchel.length * A.eruptionLoss.num) / A.eruptionLoss.den);
        const byRichness = s.satchel.slice().sort((a, b) => b.richness - a.richness);
        const lostUids = new Set(byRichness.slice(0, lossCount).map((p) => p.uid));
        lost = s.satchel.filter((p) => lostUids.has(p.uid));
        kept = s.satchel.filter((p) => !lostUids.has(p.uid));
    }

    const familyTotals = gatheringFamilyTotals(kept);
    const sets = familyTotals.filter((f) => f.set).map((f) => f.family);
    const roundHarvest = familyTotals.every((f) => f.pieces > 0);
    const tier = gatheringTierOf(s, kept.length);

    const S = GATHERING_TUNING.sets;
    const keptRichness = kept.reduce((sum, p) => sum + p.richness, 0);
    const shillings =
        sets.length * S.shillings +
        (roundHarvest ? S.roundHarvestShillings : 0) +
        A.plunderPerRichness * keptRichness;

    const boons = gatheringBoonResults(s, true);
    const survived = tier !== 'routed';
    let boonShillings = 0;
    let boonVitae = 0;
    let boonTokens = 0;
    if (survived) {
        for (const b of boons) {
            if (b.status !== 'done') continue;
            if (b.reward.kind === 'shillings') boonShillings += b.reward.amount;
            else if (b.reward.kind === 'vitae') boonVitae += b.reward.amount;
            else boonTokens += b.reward.amount;
        }
    }

    return {
        tier,
        kept,
        lost,
        familyTotals,
        sets,
        roundHarvest,
        shillings,
        bittenVitae: s.bittenVitae + (s.erupted ? GATHERING_TUNING.eruption.bite : 0),
        offeringVitae: s.offeringVitae,
        offeringShillings: s.offeringShillings,
        blessingVitae: tier === 'communion' ? GATHERING_TUNING.outcome.blessingVitae : 0,
        grace: s.grace,
        wrath: s.wrath,
        scarred: tier === 'despoiled' || tier === 'routed',
        boons,
        boonShillings,
        boonVitae,
        boonTokens,
    };
}

// ---------------------------------------------------------------------------
// Affordability helpers (the store wrapper consults these — the engine
// itself never reads player state)
// ---------------------------------------------------------------------------

/** Whether a material-demand offering can currently be paid. */
export function canPayGatheringOffering(
    s: GatheringSessionState,
    offeringId: string,
): { payable: boolean; reason: 'paid' | 'no-material' | null } {
    const state = s.offerings.find((o) => o.id === offeringId);
    if (!state || state.paid) return { payable: false, reason: 'paid' };
    const def = getGatherOfferingDef(offeringId);
    if (def.demand.kind === 'material') {
        const has = s.satchel.some((p) => p.family === (def.demand as { family: GatherFamily }).family);
        return { payable: has, reason: has ? null : 'no-material' };
    }
    return { payable: true, reason: null };
}
