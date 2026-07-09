/**
 * Loot-cache minigame ("The Reliquary") — deterministic simulation harness.
 *
 * Drives full caches through the pure engine with scripted player policies
 * so balance can be asserted in hermetic tests (and tuned with evidence,
 * mirroring the hazard / gathering / quest-board sims). No I/O, no
 * Math.random — every run is reproducible from its seed.
 *
 * The Reliquary is PUSH-YOUR-LUCK on a LIVE dice-pool "Pick Pool": three
 * layers (the lid is easiest and richest-in-safety; deeper layers need
 * more cumulative progress AND bite harder on a jam), a single Insight
 * charge that grants a bonus die on a layer's opening roll. The card
 * expression is INFORMED risk management — the policies witness it:
 *
 *  - `greedy`  — always delve, always push to crack or resist, never
 *                retreats, never spends Insight. Blind greed: takes
 *                everything when lucky, eats every jam when not.
 *  - `prudent` — delves each layer but retreats after one push (banking
 *                nothing extra), and stops delving new layers once bitten
 *                once this session. The restraint baseline: rarely bitten,
 *                rarely rich.
 *  - `informed`  — delves and pushes like greedy, but spends the one
 *                Insight charge on the deepest layer it attempts (The
 *                Keeper's Tithe) before that layer's first roll. Informed
 *                greed: the same raw pushes, a better-loaded pool where it
 *                matters most.
 */

import {
    beginLootCache,
    channelLootCacheInsight,
    claimLootCacheOutcome,
    continueLootCacheCard,
    createLootCacheSession,
    delveLootCache,
    pushLootCachePick,
    retreatLootCachePick,
    sealLootCache,
} from './lootcache.engine';
import type {
    CacheItemRef,
    LootCacheOutcome,
    LootCacheOutcomeTier,
    LootCacheSession,
} from './lootcache.types';

export type LootCachePolicyId = 'greedy' | 'prudent' | 'informed';

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
 * Plays one whole cache to `done` and returns the outcome. The informed
 * spends its single Insight charge on the deepest layer it attempts; the
 * others never channel it.
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
    while (s.phase !== 'done' && guard++ < 200) {
        if (s.phase === 'card') {
            s = continueLootCacheCard(s);
            continue;
        }
        if (s.phase === 'outcome') {
            s = claimLootCacheOutcome(s);
            continue;
        }
        if (s.phase === 'picking') {
            s = decidePicking(s, policy);
            continue;
        }
        // phase === 'delving': decide.
        s = decideDelving(s, policy);
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

/** Per-layer push count the prudent bot risks before retreating. */
const PRUDENT_MAX_PUSHES = 1;

function decideDelving(s: LootCacheSession, policy: LootCachePolicyId): LootCacheSession {
    if (s.depth >= s.layers.length) return sealLootCache(s);

    if (policy === 'prudent') {
        // Stop opening new layers once bitten once this session.
        return s.bittenVitae > 0 ? sealLootCache(s) : delveLootCache(s);
    }

    // greedy and informed both delve every layer.
    return delveLootCache(s);
}

function decidePicking(s: LootCacheSession, policy: LootCachePolicyId): LootCacheSession {
    if (s.pick === null) return s;

    if (policy === 'prudent') {
        return s.pick.pushes < PRUDENT_MAX_PUSHES ? pushLootCachePick(s) : retreatLootCachePick(s);
    }

    if (policy === 'informed') {
        // Spend the single Insight charge on the deepest layer this bot
        // attempts, before that layer's first roll.
        const isDeepest = s.pick.layerIndex === s.layers.length - 1;
        if (isDeepest && !s.insightUsed && s.pick.pushes === 0) {
            return channelLootCacheInsight(s);
        }
        return pushLootCachePick(s);
    }

    // greedy: always push, never retreats, never channels Insight.
    return pushLootCachePick(s);
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
    /** Net currency per policy as [informed, greedy, prudent]. */
    currencyGradient: [number, number, number];
    /**
     * Risk-adjusted value per policy as [informed, greedy, prudent]:
     * `avgCurrency - bitePenalty * avgBitten`. Insight's worth shows up
     * here even when raw currency is flat — informed pushes buy the same
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
    for (const policy of ['greedy', 'prudent', 'informed'] as const) {
        policies[policy] = runLootCacheSim({ runs, policy });
    }

    const currencyGradient: [number, number, number] = [
        policies.informed.avgCurrency,
        policies.greedy.avgCurrency,
        policies.prudent.avgCurrency,
    ];
    const riskAdjusted: [number, number, number] = [
        riskAdjustedValue(policies.informed),
        riskAdjustedValue(policies.greedy),
        riskAdjustedValue(policies.prudent),
    ];

    const recommendations: string[] = [];
    if (riskAdjusted[0] <= riskAdjusted[1]) {
        recommendations.push('Insight no longer beats blind greed on risk-adjusted value — Insight is undervalued.');
    }
    if (policies.greedy.avgBitten <= policies.informed.avgBitten) {
        recommendations.push('Blind greed is no longer punished more than informed pushing — jam economy too soft.');
    }
    if (policies.prudent.avgBitten > policies.greedy.avgBitten) {
        recommendations.push('Prudent (retreat-early) policy is taking more bites than blind greed — retreat threshold too loose.');
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
