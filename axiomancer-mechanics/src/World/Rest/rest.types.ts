/**
 * Rest encounter ("The Night Watch") — engine types.
 *
 * The dedicated rest experience (Phase 137): instead of a silent
 * `healFraction` grant, a rest node plays one night at camp in three
 * watches. The player picks a POSTURE at dusk (how deeply to sleep),
 * tends the fire's WARMTH against a small store of firewood, and
 * meets what the dark sends — embers, dreams, stirs, still hours.
 *
 * Two-way like the hazard and gathering minigames: the engine never
 * reads `GameState`; at claim time the host applies the outcome
 * (vitae restored, effects cleansed, keepsakes) to the real player.
 * A night can be MEAGRE but never lethal — rest cannot hurt you
 * beyond a thinner heal.
 */

import type { SeedInput } from '../seed';
import type { RestRngState } from './rest.rng';

// ---------------------------------------------------------------------------
// Postures
// ---------------------------------------------------------------------------

/**
 * How the sleeper lies:
 *  - `deep`  — surrender to it. The richest heal, but the dark works
 *              unwatched (stirs always cost).
 *  - `doze`  — one ear open. Middle heal; stirs are a coin toss.
 *  - `watch` — knife across the knees. The thinnest heal, but no stir
 *              ever lands, and watchful eyes find things.
 */
export type RestPosture = 'deep' | 'doze' | 'watch';

export interface RestPostureDef {
    key: RestPosture;
    name: string;
    desc: string;
    flavor: string;
    /** Base heal fraction of max vitae for the night. */
    baseHeal: number;
}

// ---------------------------------------------------------------------------
// Watch events
// ---------------------------------------------------------------------------

/**
 * What a watch of the night can hold:
 *  - `embers` — the fire wants feeding: spend firewood for warmth or
 *               hoard it and let the circle of light shrink.
 *  - `dream`  — an authored dream with a choice: hold it (keep a
 *               KEEPSAKE) or let it fade (take its COMFORT as heal).
 *  - `stir`   — something moves past the light. Posture decides.
 *  - `still`  — a quiet hour. Comfort for free.
 */
export type RestWatchKind = 'embers' | 'dream' | 'stir' | 'still';

export interface RestDreamDef {
    id: string;
    title: string;
    /** The dream's narration lines. */
    lines: readonly string[];
    /** Keepsake label minted when the dreamer holds the dream. */
    keepsake: string;
}

/** One option on an open watch card. */
export interface RestWatchOption {
    id: string;
    label: string;
    desc: string;
    disabledReason?: string;
}

/** Display deltas of a resolved watch. */
export interface RestWatchResult {
    title: string;
    body: string;
    /** Die rolls shown on the card (doze stirs roll). */
    rolls: readonly number[];
    warmthDelta: number;
    woodDelta: number;
    comfortDelta: number;
    /** Keepsake label minted this watch ('' = none). */
    keepsake: string;
}

/** The current watch's card (phase 'watch'). */
export interface RestPendingWatch {
    /** 1-based watch number (1..REST_WATCHES_PER_NIGHT). */
    watch: number;
    kind: RestWatchKind;
    title: string;
    body: string;
    /** Options on offer; empty once `result` is set. */
    options: readonly RestWatchOption[];
    result: RestWatchResult | null;
    /** Dream id when kind = 'dream'. */
    dreamId?: string;
}

// ---------------------------------------------------------------------------
// Outcome
// ---------------------------------------------------------------------------

/**
 * Dawn tiers (display only; the numbers ride alongside):
 *  - `restored` — warm fire, kind night. The full measure of sleep.
 *  - `rested`   — an ordinary night. Most of the measure.
 *  - `meagre`   — cold ashes and interruptions. Sleep, technically.
 */
export type RestOutcomeTier = 'restored' | 'rested' | 'meagre';

export interface RestOutcome {
    tier: RestOutcomeTier;
    /** Final heal fraction of max vitae the host should apply. */
    healFraction: number;
    /** True when the fire held: the host clears lingering effects. */
    cleansed: boolean;
    warmth: number;
    comfort: number;
    /** Keepsake labels minted by held dreams / watchful finds. */
    keepsakes: readonly string[];
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export type RestPhase =
    | 'posture'  // dusk: choosing how to lie
    | 'watch'    // a watch card is open
    | 'outcome'  // dawn ledger
    | 'done';    // host claimed the night

export interface RestSession {
    phase: RestPhase;
    /** Baseline heal fraction from the authored map event payload. */
    baseHealFraction: number;
    posture: RestPosture | null;
    /** 1-based current watch; watches resolve in order. */
    watch: number;
    /** Seeded order of the night's watch kinds. */
    watchPlan: readonly RestWatchKind[];
    /** Seeded dream order; dream watches consume from the front. */
    dreamQueue: readonly string[];
    /** Fire warmth 0..REST_WARMTH_MAX. */
    warmth: number;
    /** Firewood in hand. */
    wood: number;
    /** Accrued comfort (small heal bonuses). */
    comfort: number;
    keepsakes: readonly string[];
    pending: RestPendingWatch | null;
    outcome: RestOutcome | null;
    seed: SeedInput;
    rng: RestRngState;
}
