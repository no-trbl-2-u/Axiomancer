/**
 * Rest minigame ("The Night Watch") — deterministic simulation harness.
 *
 * Drives full nights through the pure engine with scripted player
 * policies so balance can be asserted in hermetic tests (and tuned with
 * evidence, mirroring the hazard / gathering / quest-board sims). No I/O,
 * no Math.random — every run is reproducible from its seed.
 *
 * Rest is the gentle minigame: a night can be MEAGRE but never lethal
 * (healFraction >= 0 always). The tension is heal RICHNESS vs. what each
 * posture trades for it — so the policies span the posture x fire-tending
 * space rather than a risk-of-ruin axis.
 *
 * Policies:
 *  - `deep-sleeper` — always SLEEP DEEP (richest baseHeal); holds dreams
 *                     as keepsakes. Surrenders to the night and takes the
 *                     biggest measure, paying for stirs unwatched.
 *  - `watcher`      — always KEEP WATCH (thinnest baseHeal); never stirred,
 *                     finds things, but takes the leanest heal.
 *  - `fire-tender`  — DOZE; feeds the fire while wood lasts (warmth -> heal
 *                     + cleanse), then takes comfort. The balanced read.
 */

import {
    chooseRestOption,
    chooseRestPosture,
    claimRestOutcome,
    continueRestWatch,
    createRestSession,
} from './rest.engine';
import type { RestOutcome, RestOutcomeTier, RestPosture, RestSession } from './rest.types';

export type RestPolicyId = 'deep-sleeper' | 'watcher' | 'fire-tender';

const POLICY_POSTURE: Record<RestPolicyId, RestPosture> = {
    'deep-sleeper': 'deep',
    watcher: 'watch',
    'fire-tender': 'doze',
};

/**
 * Picks the option for the open watch card. Only `embers` and `dream`
 * watches present a choice; everything else resolves itself.
 */
function pickOption(s: RestSession, policy: RestPolicyId): string | null {
    if (s.pending === null || s.pending.result !== null) return null;
    const enabled = s.pending.options.filter(o => !o.disabledReason);
    if (enabled.length === 0) return null;

    if (s.pending.kind === 'embers') {
        // Fire-tender feeds while wood lasts; others spare it.
        if (policy === 'fire-tender') {
            const feed = enabled.find(o => o.id === 'feed');
            if (feed) return feed.id;
        }
        const spare = enabled.find(o => o.id === 'spare');
        return spare ? spare.id : enabled[0].id;
    }

    if (s.pending.kind === 'dream') {
        // Deep-sleeper hoards dreams as keepsakes; others cash the comfort.
        if (policy === 'deep-sleeper') {
            const hold = enabled.find(o => o.id === 'hold');
            if (hold) return hold.id;
        }
        const fade = enabled.find(o => o.id === 'fade');
        return fade ? fade.id : enabled[0].id;
    }

    return enabled[0].id;
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

export interface RestSimRunResult {
    seed: number;
    policy: RestPolicyId;
    outcome: RestOutcome;
    keepsakes: number;
}

/** Plays one whole night to `done` and returns the dawn outcome. */
export function simulateRest(seed: number, policy: RestPolicyId, baseHealFraction = 1.0): RestSimRunResult {
    let s = createRestSession(seed, baseHealFraction);
    s = chooseRestPosture(s, POLICY_POSTURE[policy]);

    let guard = 0;
    while (s.phase !== 'done' && guard++ < 100) {
        if (s.phase === 'watch') {
            const optionId = pickOption(s, policy);
            if (optionId !== null) {
                s = chooseRestOption(s, optionId);
            }
            s = continueRestWatch(s);
            continue;
        }
        if (s.phase === 'outcome') {
            s = claimRestOutcome(s);
            continue;
        }
        // posture should already be past; defensive break.
        break;
    }

    const outcome = s.outcome;
    if (!outcome) throw new Error(`Rest sim did not finish (seed ${seed}, ${policy})`);
    return {
        seed,
        policy,
        outcome,
        keepsakes: outcome.keepsakes.length,
    };
}

export interface RestSimSummary {
    runs: number;
    policy: RestPolicyId;
    tiers: Record<RestOutcomeTier, number>;
    restoredRate: number;
    meagreRate: number;
    cleanseRate: number;
    avgHealFraction: number;
    avgWarmth: number;
    avgComfort: number;
    avgKeepsakes: number;
}

export interface RunRestSimOptions {
    runs: number;
    policy: RestPolicyId;
    baseHealFraction?: number;
    startSeed?: number;
}

export function runRestSim(options: RunRestSimOptions): RestSimSummary {
    const { runs, policy, baseHealFraction = 1.0, startSeed = 1 } = options;
    const tiers: Record<RestOutcomeTier, number> = { restored: 0, rested: 0, meagre: 0 };
    let cleansed = 0;
    let healFraction = 0;
    let warmth = 0;
    let comfort = 0;
    let keepsakes = 0;

    for (let i = 0; i < runs; i++) {
        const result = simulateRest(startSeed + i * 7919, policy, baseHealFraction);
        tiers[result.outcome.tier] += 1;
        if (result.outcome.cleansed) cleansed += 1;
        healFraction += result.outcome.healFraction;
        warmth += result.outcome.warmth;
        comfort += result.outcome.comfort;
        keepsakes += result.keepsakes;
    }

    return {
        runs,
        policy,
        tiers,
        restoredRate: tiers.restored / runs,
        meagreRate: tiers.meagre / runs,
        cleanseRate: cleansed / runs,
        avgHealFraction: healFraction / runs,
        avgWarmth: warmth / runs,
        avgComfort: comfort / runs,
        avgKeepsakes: keepsakes / runs,
    };
}

// ---------------------------------------------------------------------------
// Balance Report
// ---------------------------------------------------------------------------

export interface RestBalanceReport {
    timestamp: string;
    totalRuns: number;
    policies: Record<RestPolicyId, RestSimSummary>;
    /**
     * The heal-richness gradient as [fire-tender, deep-sleeper, watcher].
     * Skilled fire-tending out-heals lazy deep-sleep, which out-heals the
     * watcher — who trades heal for safety, keepsakes, and finds.
     */
    healGradient: [number, number, number];
    recommendations: string[];
}

export function generateRestBalanceReport(runs = 400): RestBalanceReport {
    const policies = {} as Record<RestPolicyId, RestSimSummary>;
    for (const policy of ['deep-sleeper', 'watcher', 'fire-tender'] as const) {
        policies[policy] = runRestSim({ runs, policy });
    }

    const healGradient: [number, number, number] = [
        policies['fire-tender'].avgHealFraction,
        policies['deep-sleeper'].avgHealFraction,
        policies.watcher.avgHealFraction,
    ];

    const recommendations: string[] = [];
    if (policies['fire-tender'].avgHealFraction <= policies.watcher.avgHealFraction) {
        recommendations.push('Fire-tending no longer out-heals the watcher — the warmth->heal payoff has collapsed.');
    }
    if (policies['fire-tender'].cleanseRate < 0.5) {
        recommendations.push('Fire-tender cleanse rate below 50% — warmth is too hard to bank for the cleanse line.');
    }
    if (policies.watcher.avgKeepsakes <= policies['fire-tender'].avgKeepsakes) {
        recommendations.push('Watchful posture no longer finds more than fire-tending — the watch reward is gone.');
    }

    return {
        timestamp: new Date().toISOString(),
        totalRuns: runs * 3,
        policies,
        healGradient,
        recommendations,
    };
}
