/**
 * Loot-cache encounter presenter — maps the engine session
 * (`axiomancer-mechanics` World/LootCache) onto a render-ready
 * view-model. Pure: no store writes, no rolls, no rule decisions.
 *
 * HIDDEN INFORMATION: a layer's `trapped` fate is surfaced ONLY once
 * the layer is `revealed` (probe) or `opened` — the presenter is the
 * leak boundary, so the screen can render the VM blindly.
 */

import type {
    LootCacheOutcomeTier,
    LootCacheSession,
} from 'axiomancer-mechanics';
import type { AppStoreState } from '@/state/store';

// ---------------------------------------------------------------------------
// VM shapes
// ---------------------------------------------------------------------------

/** What the player may KNOW about a layer's fate. */
export type CacheLayerReading = 'sealed' | 'live' | 'dud' | 'clean' | 'sprung';

export interface CacheLayerVM {
    index: number;
    name: string;
    flavor: string;
    /** sealed = unknown; live/dud = probed; clean/sprung = opened. */
    reading: CacheLayerReading;
    opened: boolean;
    /** This is the next layer the delve would open. */
    isNext: boolean;
    /** Loot summary, shown only once opened. */
    lootSummary: string | null;
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
    probeUsed: boolean;
    canDelve: boolean;
    canProbe: boolean;
    canSeal: boolean;
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
    probeUsed: false,
    canDelve: false,
    canProbe: false,
    canSeal: false,
    card: null,
    outcome: null,
});

export function selectHasActiveCache(state: Pick<AppStoreState, 'cache'>): boolean {
    return state.cache?.session != null;
}

export function selectCacheVM(state: Pick<AppStoreState, 'cache'>): CacheVM {
    const s = state.cache?.session;
    if (!s) return EMPTY_VM;

    const layers: CacheLayerVM[] = s.layers.map(l => {
        let reading: CacheLayerReading;
        if (l.opened) reading = l.spoiled ? 'sprung' : 'clean';
        else if (l.revealed) reading = l.trapped ? 'live' : 'dud';
        else reading = 'sealed';

        let lootSummary: string | null = null;
        if (l.opened && !l.spoiled) {
            const pieces: string[] = [];
            if (l.loot.items.length > 0) pieces.push(l.loot.items.map(i => i.name).join(', '));
            if (l.loot.currency > 0) pieces.push(`${l.loot.currency} shillings`);
            if (l.loot.keepsake) pieces.push(l.loot.keepsake.toLowerCase());
            lootSummary = pieces.join(' · ');
        } else if (l.opened && l.spoiled) {
            lootSummary = 'spoiled by the trap';
        }

        return {
            index: l.index,
            name: l.name,
            flavor: l.flavor,
            reading,
            opened: l.opened,
            isNext: !l.opened && l.index === s.depth,
            lootSummary,
        };
    });

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
        probeUsed: s.probeUsed,
        canDelve: delving && s.depth < s.layers.length,
        canProbe: delving && !s.probeUsed && s.depth < s.layers.length,
        canSeal: delving,
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
