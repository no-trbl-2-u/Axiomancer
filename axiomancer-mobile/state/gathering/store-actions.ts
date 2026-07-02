/**
 * Gathering minigame — store action implementations.
 *
 * The pure engine lives in `axiomancer-mechanics` (World/Gathering —
 * fully migrated 2026-06-13 at 0.18.0; mobile owns UI only); these
 * wrappers thread the session through the mobile store slice and, at
 * claim time, apply the outcome to the real engine `GameState`
 * (inventory materials, VITAE, currency, flags). This file is the
 * mobile-host glue — affordability checks, item synthesis, and the
 * tutorial trigger are host concerns.
 */

import type { GameState, Material } from 'axiomancer-mechanics';

import {
    acknowledgeGatheringOutcome as engineAcknowledgeOutcome,
    canPayGatheringOffering,
    claimGatheringSpoils as engineClaimSpoils,
    continueGatheringAfterReprisal as engineContinueAfterReprisal,
    createGatheringSession,
    descendGathering as engineDescend,
    harvestGatheringPlot as engineHarvestPlot,
    payGatheringOffering as enginePayOffering,
    selectGatheringApproach as engineSelectApproach,
    useGatheringTool as engineUseTool,
    withdrawFromGathering as engineWithdraw,
} from 'axiomancer-mechanics';
import {
    GATHER_SET_REFINEMENTS,
    GATHERING_SITES,
    getGatherOfferingDef,
    getGatherPlotDef,
} from 'axiomancer-mechanics';
import type {
    GatherApproachKey,
    GatherPiece,
    GatherToolId,
    GatheringSessionState,
} from 'axiomancer-mechanics';
import type { AppStore } from '../store';
import { resolveMinigameSeed, resolveMinigameString } from '../minigame-seeds';

export interface MobileGatheringSlice {
    session: GatheringSessionState | null;
    /**
     * True while this session is the guided first gleaning. The coach
     * overlay (`components/gathering/TutorialCoach.tsx`) renders on top
     * of the normal board; completion/skip sets
     * `GATHERING_TUTORIAL_FLAG`, which gates both the trigger and the
     * coach's visibility.
     */
    tutorial: boolean;
}

export const EMPTY_GATHERING_SLICE: MobileGatheringSlice = Object.freeze({
    session: null,
    tutorial: false,
});

/** Flag set when a gleaning ends despoiled/routed — future faction hook. */
export const GATHERING_SCAR_FLAG = 'gleaning-scar';
/** Flag set on a communion exit — future faction/nature hook. */
export const GATHERING_GRACE_FLAG = 'gleaning-grace';
/** Flag prefix for banked paradox tokens granted by boons. */
export const GATHERING_TOKEN_FLAG_PREFIX = 'gleaning-token-banked:';
/** Flag set once the guided first gleaning is completed or skipped. */
export const GATHERING_TUTORIAL_FLAG = 'gleaning-tutorial-done';

/**
 * The tutorial session is pinned so the coach script always matches the
 * board: seed 14 on the mire-mint verge opens with a taking, a BREATH
 * plot, and a second taking face-up; the rolled offerings include the
 * always-payable BLOOD TITHE; the rolled tools include the bell.
 */
export const GATHERING_TUTORIAL_SEED = 14;
export const GATHERING_TUTORIAL_SITE = 'mire-mint';

/**
 * Dev/test seed override. Playwright / dev tooling sets
 * `globalThis.__AXM_GATHER_SEED__` / `globalThis.__AXM_GATHER_SITE__`
 * before triggering a gathering to get a reproducible session.
 * Ignored when unset.
 */
declare global {
    // eslint-disable-next-line no-var
    var __AXM_GATHER_SEED__: number | undefined;
    // eslint-disable-next-line no-var
    var __AXM_GATHER_SITE__: string | undefined;
}

function setSession(store: AppStore, session: GatheringSessionState | null): void {
    const prev = store.getState().gathering ?? EMPTY_GATHERING_SLICE;
    store.setState({ gathering: { ...prev, session } });
}

export interface BeginGatheringOptions {
    siteId?: string;
    seed?: number;
    /** Start the guided first gleaning (pinned seed + site unless overridden). */
    tutorial?: boolean;
}

export function beginGatheringAction(store: AppStore, options: BeginGatheringOptions = {}): boolean {
    const state = store.getState();
    if (state.gathering?.session) return false; // one gleaning at a time
    const seed = resolveMinigameSeed(
        'gathering',
        options.seed,
        globalThis.__AXM_GATHER_SEED__,
        options.tutorial ? GATHERING_TUTORIAL_SEED : undefined,
    );
    let siteId = resolveMinigameString(
        'gathering',
        ['siteId', 'site'],
        options.siteId,
        globalThis.__AXM_GATHER_SITE__,
        options.tutorial ? GATHERING_TUTORIAL_SITE : undefined,
    );
    if (!siteId) {
        siteId = GATHERING_SITES[Math.abs(seed) % GATHERING_SITES.length].id;
    }
    store.setState({
        gathering: { session: createGatheringSession(seed, siteId), tutorial: options.tutorial === true },
    });
    return true;
}

/**
 * Marks the guided first gleaning as done (completed or skipped): sets
 * the persistent flag so the map trigger never re-runs it, and persists.
 * The session (if any) keeps running as normal play.
 */
export function completeGatheringTutorialAction(store: AppStore, skipped: boolean): void {
    const state = store.getState() as unknown as GameState;
    if (!(state.flags ?? []).includes(GATHERING_TUTORIAL_FLAG)) {
        store.setState({ flags: [...(state.flags ?? []), GATHERING_TUTORIAL_FLAG] } as never);
        try {
            store.getState().save();
        } catch {
            // Persistence failures must not strand the coach.
        }
    }
    void skipped;
}

export function selectGatheringApproachAction(store: AppStore, approach: GatherApproachKey): void {
    const s = store.getState().gathering?.session;
    if (!s) return;
    setSession(store, engineSelectApproach(s, approach));
}

export function harvestGatheringPlotAction(store: AppStore, uid: string): void {
    const s = store.getState().gathering?.session;
    if (!s) return;
    setSession(store, engineHarvestPlot(s, uid));
}

export function descendGatheringAction(store: AppStore): void {
    const s = store.getState().gathering?.session;
    if (!s) return;
    setSession(store, engineDescend(s));
}

/**
 * Pay an offering — affordability gate lives HERE (the engine never
 * reads player state). Shilling demands check `player.currency` net of
 * what this session already pledged; vitae demands always leave at
 * least 1 VITAE after every accrued cost would settle.
 */
export function payGatheringOfferingAction(store: AppStore, offeringId: string): boolean {
    const s = store.getState().gathering?.session;
    if (!s) return false;
    if (!canPayGatheringOffering(s, offeringId).payable) return false;
    const def = getGatherOfferingDef(offeringId);
    const player = (store.getState() as unknown as GameState).player;
    if (def.demand.kind === 'shillings') {
        if (player.currency - s.offeringShillings < def.demand.amount) return false;
    }
    if (def.demand.kind === 'vitae') {
        const pledged = s.offeringVitae + s.bittenVitae;
        if (player.health - pledged - def.demand.amount < 1) return false;
    }
    const next = enginePayOffering(s, offeringId);
    if (next === s) return false;
    setSession(store, next);
    return true;
}

export function useGatheringToolAction(store: AppStore, toolId: GatherToolId): void {
    const s = store.getState().gathering?.session;
    if (!s) return;
    setSession(store, engineUseTool(s, toolId));
}

export function continueGatheringAfterReprisalAction(store: AppStore): void {
    const s = store.getState().gathering?.session;
    if (!s) return;
    setSession(store, engineContinueAfterReprisal(s));
}

export function withdrawFromGatheringAction(store: AppStore): void {
    const s = store.getState().gathering?.session;
    if (!s) return;
    setSession(store, engineWithdraw(s));
}

export function acknowledgeGatheringOutcomeAction(store: AppStore): void {
    const s = store.getState().gathering?.session;
    if (!s) return;
    setSession(store, engineAcknowledgeOutcome(s));
}

export interface ClaimGatheringSpoilsResult {
    applied: boolean;
    /** Distinct material stacks added to the inventory. */
    itemsAdded: number;
    piecesKept: number;
    richnessKept: number;
    shillings: number;
    vitaeDelta: number;
    tokensBanked: number;
    scarred: boolean;
    blessed: boolean;
}

const NOOP_CLAIM: ClaimGatheringSpoilsResult = Object.freeze({
    applied: false,
    itemsAdded: 0,
    piecesKept: 0,
    richnessKept: 0,
    shillings: 0,
    vitaeDelta: 0,
    tokensBanked: 0,
    scarred: false,
    blessed: false,
});

/** Aggregate kept pieces into Material stacks (quantity = total richness). */
function materialsOf(kept: readonly GatherPiece[]): Material[] {
    const byPlot = new Map<string, Material>();
    for (const piece of kept) {
        const existing = byPlot.get(piece.plotId);
        if (existing) {
            existing.quantity += piece.richness;
            continue;
        }
        const def = getGatherPlotDef(piece.plotId);
        byPlot.set(piece.plotId, {
            id: `glean-${piece.plotId}`,
            name: def.yieldName,
            description: def.flavor,
            category: 'material',
            quantity: piece.richness,
        });
    }
    return [...byPlot.values()];
}

/**
 * Confirms the spoils ledger and applies the whole outcome to the
 * engine `GameState`:
 *
 *  materials  — kept pieces stack into Material items; completed sets
 *               add their refined treasure on top.
 *  shillings  — set/plunder/round-harvest coin + boon coin − offerings.
 *  vitae      — blessing + boon vitae − bites − offered blood. VITAE
 *               never drops below 1 here: the site maims, it does not
 *               kill (matches the hazard's documented divergence).
 *  tokens     — boon paradox tokens bank as flags.
 *  scar/grace — despoiled/routed sets the scar flag and shifts morale
 *               −2; communion sets the grace flag and shifts morale +1.
 */
export function claimGatheringSpoilsAction(store: AppStore): ClaimGatheringSpoilsResult {
    const s = store.getState().gathering?.session;
    if (!s || !s.outcome) return NOOP_CLAIM;
    const done = engineClaimSpoils(s);
    if (done.phase !== 'done') return NOOP_CLAIM;

    const outcome = s.outcome;
    const state = store.getState() as unknown as GameState;
    let flags = (state.flags ?? []).slice();

    const materials = materialsOf(outcome.kept);
    for (const family of outcome.sets) {
        const refined = GATHER_SET_REFINEMENTS[family];
        materials.push({
            id: refined.id,
            name: refined.name,
            description: refined.desc,
            category: 'material',
            quantity: 1,
        });
    }

    const shillings = outcome.shillings + outcome.boonShillings - outcome.offeringShillings;
    const vitaeDelta =
        outcome.blessingVitae + outcome.boonVitae - outcome.bittenVitae - outcome.offeringVitae;

    for (let i = 0; i < outcome.boonTokens; i++) {
        flags = [...flags, `${GATHERING_TOKEN_FLAG_PREFIX}${Date.now()}-${flags.length}`];
    }
    if (outcome.scarred && !flags.includes(GATHERING_SCAR_FLAG)) {
        flags = [...flags, GATHERING_SCAR_FLAG];
    }
    const blessed = outcome.tier === 'communion';
    if (blessed && !flags.includes(GATHERING_GRACE_FLAG)) {
        flags = [...flags, GATHERING_GRACE_FLAG];
    }

    const player = state.player;
    const newHealth = Math.min(player.maxHealth, Math.max(1, player.health + vitaeDelta));
    store.setState({
        player: {
            ...player,
            health: newHealth,
            currency: Math.max(0, player.currency + shillings),
            inventory: [...player.inventory, ...materials],
        },
        flags,
        gathering: EMPTY_GATHERING_SLICE,
    } as never);

    if (outcome.scarred) {
        try {
            store.getState().shiftMoralMeter(-2);
        } catch {
            // Morale shift is feedback, not a gate.
        }
    } else if (blessed) {
        try {
            store.getState().shiftMoralMeter(1);
        } catch {
            // Morale shift is feedback, not a gate.
        }
    }

    // Persist immediately — the gleaning's spoils and scars are exactly
    // the kind of moment the explicit-save policy exists for.
    try {
        store.getState().save();
    } catch {
        // Persistence failures must not strand the player on the modal.
    }

    return {
        applied: true,
        itemsAdded: materials.length,
        piecesKept: outcome.kept.length,
        richnessKept: outcome.kept.reduce((sum, p) => sum + p.richness, 0),
        shillings,
        vitaeDelta,
        tokensBanked: outcome.boonTokens,
        scarred: outcome.scarred,
        blessed,
    };
}

/** Clears the session without spoils or penalties (dev / navigation escape). */
export function abandonGatheringAction(store: AppStore): void {
    setSession(store, null);
}
