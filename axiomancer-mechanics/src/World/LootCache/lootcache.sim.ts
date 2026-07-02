/**
 * Loot-cache minigame ("The Reliquary") — deterministic simulation harness.
 *
 * Drives full caches through the pure engine with scripted player policies
 * so balance can be asserted in hermetic tests (and tuned with evidence,
 * mirroring the hazard / gathering / quest-board sims). No I/O, no
 * Math.random — every run is reproducible from its seed.
 *
 * The Reliquary is PUSH-YOUR-LUCK on hidden information: three layers
 * (the lid is always safe; deeper layers are likelier trapped AND richer),
 * one PROBE that reveals the next layer's sealed fate before committing.
 * A sprung trap bites vitae, spoils that layer's loot, and slams the cache
 * shut. The skill expression is INFORMED greed — the policies witness it:
 *
 *  - `greedy`  — always delve, never probe, never seal. Blind greed:
 *                takes everything when lucky, eats every trap when not.
 *  - `prudent` — delve the always-safe lid, then seal and walk. The
 *                restraint baseline: never bitten, never rich.
 *  - `prober`  — probe each layer, delve only on a clean reading, seal on
 *                teeth. Perfect information by design: the skilled take.
 */

import {
    beginLootCache,
    claimLootCacheOutcome,
    continueLootCacheCard,
    createLootCacheSession,
    delveLootCache,
    probeLootCache,
    sealLootCache,
} from './lootcache.engine';
import type {
    CacheItemRef,
    LootCacheOutcome,
    LootCacheOutcomeTier,
    LootCacheSession,
} from './lootcache.types';

export type LootCachePolicyId = 'greedy' | 'prudent' | 'prober';

/** The default authored payload the sim opens when none is pinned. */
export const DEFAULT_CACHE_ITEMS: readonly CacheItemRef[] = Object.freeze([
    { uid: 'sim-i-1', name: 'Tarnished Compass' },
    { uid: 'sim-i-2', name: 'Whale-Oil Lamp' },
]);
export const DEFAULT_CACHE_CURRENCY = 10;

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

export interface LootCacheSimRunResult {
    seed: number;
    policy: LootCachePolicyId;
    outcome: LootCacheOutcome;
    itemsKept: number;
}

/**
 * Plays one whole cache to `done` and returns the outcome. The prober
 * spends its single probe on the next layer's fate, then delves a dud or
 * seals on teeth; the others never probe.
 */
export function simulateLootCache(
    seed: number,
    policy: LootCachePolicyId,
    items: readonly CacheItemRef[] = DEFAULT_CACHE_ITEMS,
    currency = DEFAULT_CACHE_CURRENCY,
): LootCacheSimRunResult {
    let s = createLootCacheSession(seed, items, currency);
    s = beginLootCache(s);

    let guard = 0;
    while (s.phase !== 'done' && guard++ < 100) {
        if (s.phase === 'card') {
            s = continueLootCacheCard(s);
            continue;
        }
        if (s.phase === 'outcome') {
            s = claimLootCacheOutcome(s);
            continue;
        }
        // phase === 'delving': decide.
        s = decide(s, policy);
    }

    const outcome = s.outcome;
    if (!outcome) throw new Error(`LootCache sim did not finish (seed ${seed}, ${policy})`);
    return {
        seed,
        policy,
        outcome,
        itemsKept: outcome.itemsKept.length,
    };
}

function decide(s: LootCacheSession, policy: LootCachePolicyId): LootCacheSession {
    if (policy === 'greedy') return delveLootCache(s);

    if (policy === 'prudent') {
        // Take the always-safe lid (depth 0), then seal and walk.
        return s.depth === 0 ? delveLootCache(s) : sealLootCache(s);
    }

    // prober: the lid (depth 0) is always safe — take it free. Reaching
    // the rich keeper's tithe (depth 2) means clearing the false bottom
    // (depth 1, trap chance 1/3) first; the deepest layer carries the worst
    // odds (1/2). The single probe is best spent on that deepest layer, so
    // at depth 1 the prober accepts the smaller blind risk to keep the probe
    // for where it matters; at depth 2 it probes and seals on teeth.
    const next = s.layers[s.depth];
    if (!next) return sealLootCache(s);
    if (s.depth === 0) return delveLootCache(s);

    // A fate this policy has already revealed is acted on directly.
    if (next.revealed) {
        return next.trapped ? sealLootCache(s) : delveLootCache(s);
    }

    const isDeepest = s.depth === s.layers.length - 1;
    if (isDeepest) {
        // The tithe: probe it if we still can; never blind-gamble the
        // richest-but-deadliest layer.
        return s.probeUsed ? sealLootCache(s) : probeLootCache(s);
    }

    // The false bottom, probe still in hand: accept the smaller blind risk
    // to push toward the tithe and keep the probe for it.
    return delveLootCache(s);
}

export interface LootCacheSimSummary {
    runs: number;
    policy: LootCachePolicyId;
    tiers: Record<LootCacheOutcomeTier, number>;
    stungRate: number;
    emptiedRate: number;
    prudentRate: number;
    avgCurrency: number;
    avgItemsKept: number;
    avgBitten: number;
    avgLayersOpened: number;
}

export interface RunLootCacheSimOptions {
    runs: number;
    policy: LootCachePolicyId;
    items?: readonly CacheItemRef[];
    currency?: number;
    startSeed?: number;
}

export function runLootCacheSim(options: RunLootCacheSimOptions): LootCacheSimSummary {
    const {
        runs,
        policy,
        items = DEFAULT_CACHE_ITEMS,
        currency = DEFAULT_CACHE_CURRENCY,
        startSeed = 1,
    } = options;
    const tiers: Record<LootCacheOutcomeTier, number> = { emptied: 0, prudent: 0, stung: 0 };
    let currencyKept = 0;
    let itemsKept = 0;
    let bitten = 0;
    let layersOpened = 0;

    for (let i = 0; i < runs; i++) {
        const result = simulateLootCache(startSeed + i * 7919, policy, items, currency);
        tiers[result.outcome.tier] += 1;
        currencyKept += result.outcome.currencyKept;
        itemsKept += result.itemsKept;
        bitten += result.outcome.bittenVitae;
        layersOpened += result.outcome.layersOpened;
    }

    return {
        runs,
        policy,
        tiers,
        stungRate: tiers.stung / runs,
        emptiedRate: tiers.emptied / runs,
        prudentRate: tiers.prudent / runs,
        avgCurrency: currencyKept / runs,
        avgItemsKept: itemsKept / runs,
        avgBitten: bitten / runs,
        avgLayersOpened: layersOpened / runs,
    };
}

// ---------------------------------------------------------------------------
// Balance Report
// ---------------------------------------------------------------------------

export interface LootCacheBalanceReport {
    timestamp: string;
    totalRuns: number;
    policies: Record<LootCachePolicyId, LootCacheSimSummary>;
    /** Net currency per policy as [prober, greedy, prudent]. */
    currencyGradient: [number, number, number];
    /**
     * Risk-adjusted value per policy as [prober, greedy, prudent]:
     * `avgCurrency - bitePenalty * avgBitten`. The probe's worth shows up
     * here even when raw currency is flat — informed greed buys the same
     * loot at a fraction of the vitae cost.
     */
    riskAdjusted: [number, number, number];
    recommendations: string[];
}

/** Shillings a single bitten vitae point is treated as costing. */
export const LOOT_CACHE_BITE_PENALTY = 4;

function riskAdjustedValue(sum: LootCacheSimSummary): number {
    return sum.avgCurrency - LOOT_CACHE_BITE_PENALTY * sum.avgBitten;
}

export function generateLootCacheBalanceReport(runs = 400): LootCacheBalanceReport {
    const policies = {} as Record<LootCachePolicyId, LootCacheSimSummary>;
    for (const policy of ['greedy', 'prudent', 'prober'] as const) {
        policies[policy] = runLootCacheSim({ runs, policy });
    }

    const currencyGradient: [number, number, number] = [
        policies.prober.avgCurrency,
        policies.greedy.avgCurrency,
        policies.prudent.avgCurrency,
    ];
    const riskAdjusted: [number, number, number] = [
        riskAdjustedValue(policies.prober),
        riskAdjustedValue(policies.greedy),
        riskAdjustedValue(policies.prudent),
    ];

    const recommendations: string[] = [];
    if (riskAdjusted[0] <= riskAdjusted[1]) {
        recommendations.push('Informed probing no longer beats blind greed on risk-adjusted value — the probe is undervalued.');
    }
    if (policies.greedy.avgBitten <= policies.prober.avgBitten) {
        recommendations.push('Blind greed is no longer punished more than skilled probing — trap economy too soft.');
    }
    if (policies.prudent.avgBitten > 0) {
        recommendations.push('Prudent (lid-only) policy is taking bites — the lid is no longer always safe.');
    }

    return {
        timestamp: new Date().toISOString(),
        totalRuns: runs * 3,
        policies,
        currencyGradient,
        riskAdjusted,
        recommendations,
    };
}
