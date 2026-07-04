/**
 * Loot-cache encounter presenter — maps the engine session
 * (`axiomancer-mechanics` World/LootCache) onto a render-ready
 * view-model. Pure: no store writes, no rolls, no rule decisions.
 *
 * PUBLIC INFORMATION (Pick Pool redesign): a layer's `difficulty` is
 * public from the start — there is no more hidden trap fate to leak.
 * The presenter's job is now to translate the live dice-pool pick
 * attempt (`LootCacheSession.pick`) into a render-ready `CachePickVM`
 * for the active layer, and to give every layer a `reading` that
 * reflects what has actually happened to it this session (never
 * attempted, mid-attempt, cracked clean, jammed, or retreated from).
 */

import type {
    LootCacheOutcomeTier,
    LootCacheSession,
} from '@mechanics';
import { LOOT_CACHE_TUNING } from '@mechanics';
import type { AppStoreState } from '@/state/store';

// ---------------------------------------------------------------------------
// VM shapes
// ---------------------------------------------------------------------------

/** What has happened to a layer this session. */
export type CacheLayerReading =
    | 'locked'      // not yet attempted
    | 'picking'     // the active lock, mid-attempt
    | 'cracked'     // opened clean
    | 'sprung'      // jammed / spoiled
    | 'retreated';  // closed without opening, no bite

export interface CacheLayerVM {
    index: number;
    name: string;
    flavor: string;
    difficulty: number;
    reading: CacheLayerReading;
    opened: boolean;
    /** This is the layer the pick attempt would open next. */
    isNext: boolean;
    /** Loot summary, shown only once opened. */
    lootSummary: string | null;
}

export interface CachePickRollVM {
    dice: readonly number[];
    slips: number;
    gained: number;
    jammed: boolean;
}

export interface CachePickVM {
    layerIndex: number;
    difficulty: number;
    progress: number;
    /** 0-1, for a fill-bar. */
    progressFraction: number;
    pushes: number;
    maxPushes: number;
    pushesRemaining: number;
    poolSize: number;
    canPush: boolean;
    canRetreat: boolean;
    canChannelInsight: boolean;
    insightUsed: boolean;
    /** True when the *next* push will roll the bonus die. */
    insightPending: boolean;
    lastRoll: CachePickRollVM | null;
}

export interface CacheCardVM {
    title: string;
    body: string;
    /** Compact chips, e.g. "+5 SHILLINGS", "−2 VITAE". */
    deltaChips: readonly string[];
    slammed: boolean;
}

export interface CacheOutcomeVM {
    tier: LootCacheOutcomeTier;
    tierLabel: string;
    itemNames: readonly string[];
    currency: number;
    bittenVitae: number;
    keepsakes: readonly string[];
    layersOpened: number;
}

export interface CacheVM {
    active: boolean;
    phase: LootCacheSession['phase'] | 'none';
    layers: readonly CacheLayerVM[];
    depth: number;
    insightUsed: boolean;
    canDelve: boolean;
    canSeal: boolean;
    pick: CachePickVM | null;
    card: CacheCardVM | null;
    outcome: CacheOutcomeVM | null;
}

export const CACHE_TIER_LABELS: Record<LootCacheOutcomeTier, string> = Object.freeze({
    emptied: 'EMPTIED',
    prudent: 'PRUDENT',
    stung: 'STUNG',
});

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

const EMPTY_VM: CacheVM = Object.freeze({
    active: false,
    phase: 'none',
    layers: Object.freeze([]),
    depth: 0,
    insightUsed: false,
    canDelve: false,
    canSeal: false,
    pick: null,
    card: null,
    outcome: null,
});

export function selectHasActiveCache(state: Pick<AppStoreState, 'cache'>): boolean {
    return state.cache?.session != null;
}

export function selectCacheVM(state: Pick<AppStoreState, 'cache'>): CacheVM {
    const s = state.cache?.session;
    if (!s) return EMPTY_VM;

    const activePickLayer = s.pick?.layerIndex ?? null;

    const layers: CacheLayerVM[] = s.layers.map(l => {
        let reading: CacheLayerReading;
        if (l.opened) reading = l.spoiled ? 'sprung' : 'cracked';
        else if (activePickLayer === l.index) reading = 'picking';
        else if (l.index < s.depth) reading = 'retreated';
        else reading = 'locked';

        let lootSummary: string | null = null;
        if (l.opened && !l.spoiled) {
            const pieces: string[] = [];
            if (l.loot.items.length > 0) pieces.push(l.loot.items.map(i => i.name).join(', '));
            if (l.loot.currency > 0) pieces.push(`${l.loot.currency} shillings`);
            if (l.loot.keepsake) pieces.push(l.loot.keepsake.toLowerCase());
            lootSummary = pieces.join(' · ');
        } else if (l.opened && l.spoiled) {
            lootSummary = 'spoiled by the jam';
        }

        return {
            index: l.index,
            name: l.name,
            flavor: l.flavor,
            difficulty: l.difficulty,
            reading,
            opened: l.opened,
            isNext: !l.opened && l.index === s.depth,
            lootSummary,
        };
    });

    const pick: CachePickVM | null = s.pick === null ? null : (() => {
        const p = s.pick!;
        const maxPushes = LOOT_CACHE_TUNING.maxPushesPerLayer;
        const layer = s.layers[p.layerIndex];
        const insightPending = p.insightPending === true;
        const poolSize = LOOT_CACHE_TUNING.pickPoolSize + (insightPending || p.lastRoll?.insightSpent ? 1 : 0);
        return {
            layerIndex: p.layerIndex,
            difficulty: layer.difficulty,
            progress: p.progress,
            progressFraction: layer.difficulty > 0
                ? Math.max(0, Math.min(1, p.progress / layer.difficulty))
                : 0,
            pushes: p.pushes,
            maxPushes,
            pushesRemaining: Math.max(0, maxPushes - p.pushes),
            poolSize,
            canPush: p.pushes < maxPushes,
            canRetreat: true,
            canChannelInsight: !s.insightUsed && !insightPending && p.pushes === 0,
            insightUsed: s.insightUsed,
            insightPending,
            lastRoll: p.lastRoll === null ? null : {
                dice: p.lastRoll.dice,
                slips: p.lastRoll.slips,
                gained: p.lastRoll.gained,
                jammed: p.lastRoll.jammed,
            },
        };
    })();

    const card: CacheCardVM | null = s.card === null ? null : {
        title: s.card.title,
        body: s.card.body,
        deltaChips: composeCardChips(s.card),
        slammed: s.card.slammed,
    };

    const outcome: CacheOutcomeVM | null = s.outcome === null ? null : {
        tier: s.outcome.tier,
        tierLabel: CACHE_TIER_LABELS[s.outcome.tier],
        itemNames: s.outcome.itemsKept.map(i => i.name),
        currency: s.outcome.currencyKept,
        bittenVitae: s.outcome.bittenVitae,
        keepsakes: s.outcome.keepsakes,
        layersOpened: s.outcome.layersOpened,
    };

    const delving = s.phase === 'delving';
    return {
        active: true,
        phase: s.phase,
        layers,
        depth: s.depth,
        insightUsed: s.insightUsed,
        canDelve: delving && s.depth < s.layers.length,
        canSeal: delving,
        pick,
        card,
        outcome,
    };
}

function composeCardChips(card: {
    items: readonly { name: string }[];
    currency: number;
    keepsake: string;
    bite: number;
}): string[] {
    const chips: string[] = [];
    for (const item of card.items) chips.push(`+ ${item.name.toUpperCase()}`);
    if (card.currency > 0) chips.push(`+${card.currency} SHILLINGS`);
    if (card.keepsake) chips.push('+ KEEPSAKE');
    if (card.bite > 0) chips.push(`−${card.bite} VITAE`);
    return chips;
}
