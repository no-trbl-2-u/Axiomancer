/**
 * Rest encounter ("The Night Watch") — store action glue.
 *
 * The pure engine lives in `axiomancer-mechanics` (World/Rest); these
 * wrappers thread the night through the mobile `rest` slice and, at
 * claim, apply the dawn outcome to the real `GameState`: vitae
 * restored by the dawn ledger's `healFraction`, lingering effects
 * cleansed when the fire held, dream keepsakes banked as flags. A night
 * never harms the player — the engine guarantees heal ≥ 0.
 *
 * Phase 52b — the night's SHELTER (`'camp' | 'inn'`) is authored on the
 * map event's `RestPayload` and carried on the slice. It is the sole
 * gate on the hazard-scar max-VITAE mend; it used to be inferred from
 * `baseHealFraction >= 1.0`, which two forest springs also passed.
 */

import type { GameState } from '@mechanics';

import {
    chooseRestOption as engineChooseOption,
    chooseRestPosture as engineChoosePosture,
    claimRestOutcome as engineClaim,
    continueRestWatch as engineContinue,
    createRestSession,
    DEFAULT_REST_SHELTER,
    REST_PASSIVE_HEAL_FRACTION,
    isInnShelter,
} from '@mechanics';
import type { RestOutcomeTier, RestPosture, RestSession, RestShelter } from '@mechanics';
import { bankedScarMagnitude, HAZARD_SCAR_FLAG_PREFIX } from '../hazard/store-actions';
import { resolveMinigameSeed } from '../minigame-seeds';
import { EMPTY_REST_SLICE, type AppStore } from '../store';

/** Flag prefix banking a held dream / watchful find. */
export const REST_KEEPSAKE_FLAG_PREFIX = 'night-keepsake:';

/** Flag set once the guided first night is completed or skipped. */
export const REST_TUTORIAL_FLAG = 'night-watch-tutorial-done';

/**
 * The tutorial session is pinned so the coach script always matches the
 * night: seed 41 deals `watchPlan = ['embers', 'dream', 'stir']` (a fire
 * to tend, a dream to hold or let fade, then a stir the chosen posture
 * decides), with `dreamQueue[1] = 'dream-gates'` surfacing on watch 2.
 */
export const REST_TUTORIAL_SEED = 41;

/**
 * Dev/test seed override (`globalThis.__AXM_REST_SEED__`), mirroring
 * the hazard/gathering/quest hooks.
 */
declare global {
    // eslint-disable-next-line no-var
    var __AXM_REST_SEED__: number | undefined;
}

function setSession(store: AppStore, session: RestSession | null): void {
    const prev = store.getState().rest ?? EMPTY_REST_SLICE;
    store.setState({ rest: { ...prev, session } });
}

export interface BeginRestOptions {
    seed?: number;
    /**
     * Authored shelter class from the map-event payload (Phase 52b).
     * Defaults to `'camp'` — silence is never a paid bed. Only an
     * `'inn'` night mends hazard-scarred max-VITAE.
     */
    shelter?: RestShelter;
    /** Start the guided first night (pinned seed unless overridden). */
    tutorial?: boolean;
}

export function beginRestAction(store: AppStore, options: BeginRestOptions = {}): boolean {
    const state = store.getState();
    if (state.rest?.session) return false; // one night at a time
    const seed = resolveMinigameSeed(
        'rest',
        options.seed,
        globalThis.__AXM_REST_SEED__,
        options.tutorial ? REST_TUTORIAL_SEED : undefined,
    );
    store.setState({
        rest: {
            // Phase 52b — the per-node heal knob is retired; the night runs at
            // the carried-forward shipped default until 52c derives the heal
            // from the shelter. The inn/camp split now rides on `shelter`.
            session: createRestSession(seed, REST_PASSIVE_HEAL_FRACTION),
            shelter: options.shelter ?? DEFAULT_REST_SHELTER,
            tutorial: options.tutorial === true,
        },
    });
    return true;
}

export function chooseRestPostureAction(store: AppStore, posture: RestPosture): void {
    const s = store.getState().rest?.session;
    if (!s) return;
    setSession(store, engineChoosePosture(s, posture));
}

export function chooseRestOptionAction(store: AppStore, optionId: string): void {
    const s = store.getState().rest?.session;
    if (!s) return;
    setSession(store, engineChooseOption(s, optionId));
}

export function continueRestWatchAction(store: AppStore): void {
    const s = store.getState().rest?.session;
    if (!s) return;
    setSession(store, engineContinue(s));
}

export interface ClaimRestOutcomeResult {
    applied: boolean;
    healed: number;
    cleansed: boolean;
    tier: RestOutcomeTier | null;
    keepsakes: readonly string[];
    /** Max-VITAE mended back from hazard scars (`shelter === 'inn'` only). */
    scarMended: number;
}

const NOOP_CLAIM: ClaimRestOutcomeResult = Object.freeze({
    applied: false,
    healed: 0,
    cleansed: false,
    tier: null,
    keepsakes: Object.freeze([]),
    scarMended: 0,
});

/**
 * Confirms the dawn ledger and applies the night to the engine
 * `GameState`: heal (fraction of max vitae, capped), effect cleanse
 * when the fire held, keepsakes banked as flags. Clears the slice and
 * persists.
 *
 * A night at an INN (`shelter === 'inn'`, authored on the map event's
 * `RestPayload`) additionally mends hazard-scarred max-VITAE: every
 * banked `hazard-scar:` flag is summed back into `maxHealth` and the
 * flags are cleared. The recovered max is the heal cap, so the inn night
 * can also top current VITAE up to the restored bar. Camp watches leave
 * the scar flags and `maxHealth` untouched.
 *
 * Phase 52b re-homed this off the old `baseHealFraction >= 1.0`
 * heuristic, which called two authored forest springs (`nf-4`, `nf-24`)
 * inn-grade and mended scars there for free.
 */
export function claimRestOutcomeAction(store: AppStore): ClaimRestOutcomeResult {
    const slice = store.getState().rest;
    const s = slice?.session;
    if (!s || !s.outcome) return NOOP_CLAIM;
    const done = engineClaim(s);
    if (done.phase !== 'done') return NOOP_CLAIM;

    const outcome = s.outcome;
    const state = store.getState() as unknown as GameState;
    const player = state.player;

    let flags = state.flags ?? [];

    // Inn nights mend max-VITAE scars back toward baseline. Camps do not.
    const isInnRest = isInnShelter(slice?.shelter ?? DEFAULT_REST_SHELTER);
    const scarMended = isInnRest ? bankedScarMagnitude(flags) : 0;
    if (scarMended > 0) {
        flags = flags.filter((f) => !f.startsWith(HAZARD_SCAR_FLAG_PREFIX));
    }
    const recoveredMax = player.maxHealth + scarMended;

    const healed = Math.min(
        recoveredMax - player.health,
        Math.round(recoveredMax * outcome.healFraction),
    );

    for (const keepsake of outcome.keepsakes) {
        const flag = `${REST_KEEPSAKE_FLAG_PREFIX}${keepsake}`;
        if (!flags.includes(flag)) flags = [...flags, flag];
    }

    store.setState({
        player: {
            ...player,
            maxHealth: recoveredMax,
            health: player.health + healed,
            ...(outcome.cleansed ? { effects: [] } : {}),
        },
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
        healed,
        cleansed: outcome.cleansed,
        tier: outcome.tier,
        keepsakes: outcome.keepsakes,
        scarMended,
    };
}

/** Clears the night without a heal (dev / navigation escape). */
export function abandonRestAction(store: AppStore): void {
    setSession(store, null);
}

/**
 * Marks the guided first night as done (completed or skipped): sets the
 * persistent flag so the map trigger never re-runs it, and persists.
 * The session (if any) keeps running as normal play. Idempotent.
 */
export function completeRestTutorialAction(store: AppStore, skipped: boolean): void {
    const state = store.getState() as unknown as GameState;
    if (!(state.flags ?? []).includes(REST_TUTORIAL_FLAG)) {
        store.setState({ flags: [...(state.flags ?? []), REST_TUTORIAL_FLAG] } as never);
        try {
            store.getState().save();
        } catch {
            // Persistence failures must not strand the coach.
        }
    }
    void skipped;
}
