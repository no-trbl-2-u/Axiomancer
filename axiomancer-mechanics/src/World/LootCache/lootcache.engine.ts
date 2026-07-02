/**
 * Loot-cache encounter ("The Reliquary") — content, tuning, and pure
 * engine transitions. Compact enough to live in one file; split if
 * any section grows past its welcome.
 *
 * State machine:
 *
 *   intro ──beginLootCache──▶ delving ──delve/probe/seal──▶ card
 *                                ▲                            │
 *                                └────continueLootCacheCard───┤ (layers left, not slammed)
 *                                                             │
 *                                     outcome ◀───────────────┘ (sealed / slammed / emptied)
 *                                        │
 *                               claimLootCacheOutcome
 *                                        ▼
 *                                      done
 */

import { nextFloat, seedRng, type LootCacheRngState } from './lootcache.rng';
import type { SeedInput } from '../seed';
import type {
    CacheItemRef,
    LootCacheCard,
    LootCacheLayerIndex,
    LootCacheLayerState,
    LootCacheOutcome,
    LootCacheOutcomeTier,
    LootCacheSession,
} from './lootcache.types';

// ---------------------------------------------------------------------------
// Tuning & authored chrome
// ---------------------------------------------------------------------------

export const LOOT_CACHE_TUNING = Object.freeze({
    /** Trap probability per layer (the lid is always safe). */
    trapChance: [0, 1 / 3, 1 / 2] as readonly number[],
    /** Vitae bitten per layer when a trap fires. */
    trapBite: [0, 2, 3] as readonly number[],
    /** Bonus currency fractions: false bottom pays half again; the
     *  keeper's tithe doubles the authored purse. */
    falseBottomBonus: 0.5,
    tithesBonus: 1.0,
    /** Floor currency for the false bottom when the authored purse is 0. */
    falseBottomFloor: 3,
});

const LAYER_CHROME: ReadonlyArray<{ name: string; flavor: string }> = Object.freeze([
    {
        name: 'THE LID',
        flavor: 'Swollen wood and a hasp rusted to lace. Whatever was meant to keep people out retired years ago.',
    },
    {
        name: 'THE FALSE BOTTOM',
        flavor: 'The boards inside sit a knuckle too high. Someone hid the real goods from whoever found the first ones.',
    },
    {
        name: "THE KEEPER'S TITHE",
        flavor: 'Beneath everything, wrapped in oilcloth: the part the owner meant to come back for. Owners like that leave teeth behind.',
    },
] as const);

export const LOOT_CACHE_KEEPSAKE = 'A dead stranger\'s luck, inherited';

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

/**
 * Builds the cache from the authored map-event payload. Trap fates are
 * sealed here (seeded) — the probe reveals, never re-rolls.
 */
export function createLootCacheSession(
    seed: SeedInput,
    items: readonly CacheItemRef[],
    currency: number,
): LootCacheSession {
    let rng: LootCacheRngState = seedRng(seed);
    const T = LOOT_CACHE_TUNING;

    const falseBottomCurrency = Math.max(
        T.falseBottomFloor,
        Math.ceil(currency * T.falseBottomBonus),
    );
    const titheCurrency = Math.max(T.falseBottomFloor, Math.ceil(currency * T.tithesBonus));

    const lootByLayer = [
        { items, currency, keepsake: '' },
        { items: [] as readonly CacheItemRef[], currency: falseBottomCurrency, keepsake: '' },
        { items: [] as readonly CacheItemRef[], currency: titheCurrency, keepsake: LOOT_CACHE_KEEPSAKE },
    ];

    const layers: LootCacheLayerState[] = lootByLayer.map((loot, i) => {
        const draw = nextFloat(rng);
        rng = draw.state;
        return {
            index: i as LootCacheLayerIndex,
            name: LAYER_CHROME[i].name,
            flavor: LAYER_CHROME[i].flavor,
            trapped: draw.value < T.trapChance[i],
            trapBite: T.trapBite[i],
            revealed: false,
            opened: false,
            spoiled: false,
            loot,
        };
    });

    return {
        phase: 'intro',
        layers,
        depth: 0,
        probeUsed: false,
        bittenVitae: 0,
        card: null,
        outcome: null,
        seed,
        rng,
    };
}

/** intro → delving. */
export function beginLootCache(s: LootCacheSession): LootCacheSession {
    if (s.phase !== 'intro') return s;
    return { ...s, phase: 'delving' };
}

// ---------------------------------------------------------------------------
// Decisions
// ---------------------------------------------------------------------------

/**
 * delving → card. Opens the next layer. A sealed trap fires
 * unconditionally: the bite lands, the layer's loot spoils, and the
 * cache slams (continue goes straight to outcome).
 */
export function delveLootCache(s: LootCacheSession): LootCacheSession {
    if (s.phase !== 'delving' || s.depth >= s.layers.length) return s;
    const layer = s.layers[s.depth];

    if (layer.trapped) {
        const layers = s.layers.map(l =>
            l.index === layer.index ? { ...l, opened: true, spoiled: true, revealed: true } : l,
        );
        const card: LootCacheCard = {
            title: 'THE TRAP KEEPS ITS PROMISE',
            body:
                `A click under ${layer.name.toLowerCase()}, half a heartbeat of regret, and the thing bites. ` +
                'The mechanism mangles its own treasure on the way shut — spite, engineered.',
            items: [],
            currency: 0,
            keepsake: '',
            bite: layer.trapBite,
            slammed: true,
        };
        return {
            ...s,
            layers,
            depth: s.depth + 1,
            bittenVitae: s.bittenVitae + layer.trapBite,
            phase: 'card',
            card,
        };
    }

    const layers = s.layers.map(l =>
        l.index === layer.index ? { ...l, opened: true, revealed: true } : l,
    );
    const pieces: string[] = [];
    if (layer.loot.items.length > 0) pieces.push(layer.loot.items.map(i => i.name).join(', '));
    if (layer.loot.currency > 0) pieces.push(`${layer.loot.currency} shillings`);
    if (layer.loot.keepsake) pieces.push(layer.loot.keepsake.toLowerCase());
    const card: LootCacheCard = {
        title: `${layer.name} COMES AWAY CLEAN`,
        body: pieces.length > 0
            ? `Inside: ${pieces.join('; ')}.`
            : 'Inside: dust, arranged hopefully.',
        items: layer.loot.items,
        currency: layer.loot.currency,
        keepsake: layer.loot.keepsake,
        bite: 0,
        slammed: false,
    };
    return { ...s, layers, depth: s.depth + 1, phase: 'card', card };
}

/**
 * delving → card. Spends the one probe to reveal the next layer's
 * sealed fate before committing to it.
 */
export function probeLootCache(s: LootCacheSession): LootCacheSession {
    if (s.phase !== 'delving' || s.probeUsed || s.depth >= s.layers.length) return s;
    const layer = s.layers[s.depth];
    const layers = s.layers.map(l =>
        l.index === layer.index ? { ...l, revealed: true } : l,
    );
    const card: LootCacheCard = {
        title: layer.trapped ? 'TEETH IN THE DARK' : 'NOTHING WAITS',
        body: layer.trapped
            ? `A knife run along the seam of ${layer.name.toLowerCase()} finds wire, drawn taut. It is live. It is very live.`
            : `A knife run along the seam of ${layer.name.toLowerCase()} finds old wood and older air. Whatever guarded this has already failed.`,
        items: [],
        currency: 0,
        keepsake: '',
        bite: 0,
        slammed: false,
    };
    return { ...s, layers, probeUsed: true, phase: 'card', card };
}

/** delving → outcome. Walks away with everything lifted so far. */
export function sealLootCache(s: LootCacheSession): LootCacheSession {
    if (s.phase !== 'delving') return s;
    return finishLootCache(s, false);
}

// ---------------------------------------------------------------------------
// Cards & outcome
// ---------------------------------------------------------------------------

/** card → delving | outcome. */
export function continueLootCacheCard(s: LootCacheSession): LootCacheSession {
    if (s.phase !== 'card' || s.card === null) return s;
    const slammed = s.card.slammed;
    const cleared = { ...s, card: null };
    if (slammed) return finishLootCache(cleared, true);
    if (cleared.depth >= cleared.layers.length) return finishLootCache(cleared, false);
    return { ...cleared, phase: 'delving' };
}

function finishLootCache(s: LootCacheSession, slammed: boolean): LootCacheSession {
    const opened = s.layers.filter(l => l.opened && !l.spoiled);
    const itemsKept = opened.flatMap(l => l.loot.items);
    const currencyKept = opened.reduce((sum, l) => sum + l.loot.currency, 0);
    const keepsakes = opened.map(l => l.loot.keepsake).filter(k => k.length > 0);

    let tier: LootCacheOutcomeTier;
    if (slammed || s.bittenVitae > 0) tier = 'stung';
    else if (s.layers.every(l => l.opened)) tier = 'emptied';
    else tier = 'prudent';

    const outcome: LootCacheOutcome = {
        tier,
        itemsKept,
        currencyKept,
        keepsakes,
        bittenVitae: s.bittenVitae,
        layersOpened: s.layers.filter(l => l.opened).length,
    };
    return { ...s, outcome, phase: 'outcome' };
}

/** outcome → done. The host applies the outcome and seals the find. */
export function claimLootCacheOutcome(s: LootCacheSession): LootCacheSession {
    if (s.phase !== 'outcome' || s.outcome === null) return s;
    return { ...s, phase: 'done' };
}
