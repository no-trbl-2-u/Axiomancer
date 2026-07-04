/**
 * Loot-cache encounter ("The Reliquary") — content, tuning, and pure
 * engine transitions. Compact enough to live in one file; split if
 * any section grows past its welcome.
 *
 * State machine:
 *
 *   intro ──beginLootCache──▶ delving ──delve/seal──▶ picking ──push/insight/retreat──▶ card
 *                                ▲                        │  ▲                            │
 *                                │                        └──┘ (still picking: push again) │
 *                                └────continueLootCacheCard──────────────────────────────────┤ (layers left)
 *                                                                                             │
 *                                     outcome ◀───────────────────────────────────────────────┘ (all layers resolved / sealed)
 *                                        │
 *                               claimLootCacheOutcome
 *                                        ▼
 *                                      done
 *
 * "Pick Pool": each layer has a public `difficulty` (target progress).
 * The player rolls a d6 pool per push, banking progress toward that
 * target; too many slipped dice in one roll jams the pick, biting vitae
 * and spoiling that layer only — the session continues to the next
 * layer. A single per-session Insight charge grants a bonus die, but
 * only before a layer's first roll.
 */

import { rollDie, seedRng, type LootCacheRngState } from './lootcache.rng';
import type { SeedInput } from '../seed';
import type {
    CacheItemRef,
    LootCacheCard,
    LootCacheLayerIndex,
    LootCacheLayerState,
    LootCacheOutcome,
    LootCacheOutcomeTier,
    LootCachePickRoll,
    LootCacheSession,
} from './lootcache.types';

// ---------------------------------------------------------------------------
// Tuning & authored chrome
// ---------------------------------------------------------------------------

export const LOOT_CACHE_TUNING = Object.freeze({
    /** Progress needed to crack each layer's lock. */
    difficulty: [5, 9, 13] as readonly number[],
    /** Vitae bitten per layer when the pick jams. */
    trapBite: [1, 2, 3] as readonly number[],
    /** Dice rolled per pick attempt (d6 pool). */
    pickPoolSize: 3,
    /** Max push attempts per layer before the lock "resists" (walk away, no loot, no bite). */
    maxPushesPerLayer: 4,
    /** Number of dice showing a "slip" (face value 1) in one roll that triggers a jam. */
    jamSlipThreshold: 2,
    /** Bonus dice granted by spending Insight on a roll. */
    insightBonusDice: 1,
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
 * Builds the cache from the authored map-event payload. Each layer's
 * difficulty is public tuning data — no RNG needed at creation. The RNG
 * state still threads through the session; it stays untouched until the
 * first pick roll.
 */
export function createLootCacheSession(
    seed: SeedInput,
    items: readonly CacheItemRef[],
    currency: number,
): LootCacheSession {
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

    const layers: LootCacheLayerState[] = lootByLayer.map((loot, i) => ({
        index: i as LootCacheLayerIndex,
        name: LAYER_CHROME[i].name,
        flavor: LAYER_CHROME[i].flavor,
        difficulty: T.difficulty[i],
        trapBite: T.trapBite[i],
        opened: false,
        spoiled: false,
        loot,
    }));

    return {
        phase: 'intro',
        layers,
        depth: 0,
        insightUsed: false,
        bittenVitae: 0,
        pick: null,
        card: null,
        outcome: null,
        seed,
        rng: seedRng(seed),
    };
}

/** intro → delving. */
export function beginLootCache(s: LootCacheSession): LootCacheSession {
    if (s.phase !== 'intro') return s;
    return { ...s, phase: 'delving' };
}

// ---------------------------------------------------------------------------
// Delving → picking
// ---------------------------------------------------------------------------

/**
 * delving → picking. Opens a live pick attempt on the next layer. Does
 * not roll — rolling is a separate, explicit action (`pushLootCachePick`).
 */
export function delveLootCache(s: LootCacheSession): LootCacheSession {
    if (s.phase !== 'delving' || s.depth >= s.layers.length) return s;
    const layer = s.layers[s.depth];
    return {
        ...s,
        phase: 'picking',
        pick: {
            layerIndex: layer.index,
            progress: 0,
            pushes: 0,
            lastRoll: null,
            insightPending: false,
        },
    };
}

/** delving → outcome. Walks away with everything lifted so far. */
export function sealLootCache(s: LootCacheSession): LootCacheSession {
    if (s.phase !== 'delving') return s;
    return finishLootCache(s);
}

// ---------------------------------------------------------------------------
// Picking (the Pick Pool)
// ---------------------------------------------------------------------------

/**
 * picking-only. Spends the one per-session Insight charge to grant a
 * bonus die on the NEXT push — must be spent before the layer's first
 * roll, keeping it a deliberate opening move rather than a mid-attempt
 * bailout.
 */
export function channelLootCacheInsight(s: LootCacheSession): LootCacheSession {
    if (s.phase !== 'picking' || s.insightUsed || s.pick === null || s.pick.pushes !== 0) return s;
    return {
        ...s,
        insightUsed: true,
        pick: { ...s.pick, insightPending: true },
    };
}

/**
 * picking-only. Rolls the pick pool (plus a bonus die if Insight was
 * channeled) and resolves the push: jam (bite + spoil + close layer),
 * crack (layer cleared), resistance (max pushes spent, layer skipped),
 * or another push still pending.
 */
export function pushLootCachePick(s: LootCacheSession): LootCacheSession {
    if (s.phase !== 'picking' || s.pick === null) return s;
    const T = LOOT_CACHE_TUNING;
    const pick = s.pick;
    const layer = s.layers[s.depth];

    const rollCount = T.pickPoolSize + (pick.insightPending ? T.insightBonusDice : 0);
    let rng: LootCacheRngState = s.rng;
    const dice: number[] = [];
    for (let i = 0; i < rollCount; i++) {
        const draw = rollDie(rng);
        rng = draw.state;
        dice.push(draw.value);
    }
    const slips = dice.filter(d => d === 1).length;
    const gained = dice.filter(d => d !== 1).reduce((sum, d) => sum + d, 0);
    // A channeled Insight die raises the jam tolerance along with the pool
    // size — otherwise the extra die would purely inflate jam odds (more
    // dice, same fixed slip threshold), making Insight a net-negative
    // "buy" instead of the deliberate edge it's meant to be.
    const jamThreshold = T.jamSlipThreshold + (pick.insightPending ? T.insightBonusDice : 0);
    const jammed = slips >= jamThreshold;
    const roll: LootCachePickRoll = {
        dice,
        slips,
        gained,
        jammed,
        insightSpent: pick.insightPending,
    };

    if (jammed) {
        const layers = s.layers.map(l =>
            l.index === layer.index ? { ...l, opened: true, spoiled: true } : l,
        );
        const card: LootCacheCard = {
            title: 'THE PICK JAMS',
            body:
                `Too many teeth slip at once under ${layer.name.toLowerCase()} — the mechanism binds, ` +
                'then bites back. Whatever was inside mangles on the way shut.',
            items: [],
            currency: 0,
            keepsake: '',
            bite: layer.trapBite,
            slammed: true,
            pickRoll: roll,
        };
        return {
            ...s,
            rng,
            layers,
            depth: s.depth + 1,
            bittenVitae: s.bittenVitae + layer.trapBite,
            phase: 'card',
            card,
            pick: null,
        };
    }

    const progress = pick.progress + gained;
    if (progress >= layer.difficulty) {
        const layers = s.layers.map(l =>
            l.index === layer.index ? { ...l, opened: true } : l,
        );
        const pieces: string[] = [];
        if (layer.loot.items.length > 0) pieces.push(layer.loot.items.map(i => i.name).join(', '));
        if (layer.loot.currency > 0) pieces.push(`${layer.loot.currency} shillings`);
        if (layer.loot.keepsake) pieces.push(layer.loot.keepsake.toLowerCase());
        const card: LootCacheCard = {
            title: `${layer.name} COMES AWAY CLEAN`,
            body: pieces.length > 0
                ? `The last tumbler falls. Inside: ${pieces.join('; ')}.`
                : 'The last tumbler falls. Inside: dust, arranged hopefully.',
            items: layer.loot.items,
            currency: layer.loot.currency,
            keepsake: layer.loot.keepsake,
            bite: 0,
            slammed: false,
            pickRoll: roll,
        };
        return { ...s, rng, layers, depth: s.depth + 1, phase: 'card', card, pick: null };
    }

    const pushes = pick.pushes + 1;
    if (pushes >= T.maxPushesPerLayer) {
        const card: LootCacheCard = {
            title: 'THE LOCK HOLDS',
            body: `${layer.name} outlasts the pick. Whatever's inside stays inside — for now.`,
            items: [],
            currency: 0,
            keepsake: '',
            bite: 0,
            slammed: false,
            pickRoll: roll,
        };
        return { ...s, rng, depth: s.depth + 1, phase: 'card', card, pick: null };
    }

    return {
        ...s,
        rng,
        pick: { ...pick, progress, pushes, lastRoll: roll, insightPending: false },
    };
}

/**
 * picking-only. Voluntarily abandons the current layer attempt: the
 * layer stays closed (not spoiled), the session moves on.
 */
export function retreatLootCachePick(s: LootCacheSession): LootCacheSession {
    if (s.phase !== 'picking' || s.pick === null) return s;
    const layer = s.layers[s.depth];
    const card: LootCacheCard = {
        title: 'YOU WALK AWAY',
        body: `${layer.name} stays shut. Better a closed lock than a bitten hand.`,
        items: [],
        currency: 0,
        keepsake: '',
        bite: 0,
        slammed: false,
        pickRoll: s.pick.lastRoll,
    };
    return { ...s, depth: s.depth + 1, phase: 'card', card, pick: null };
}

// ---------------------------------------------------------------------------
// Cards & outcome
// ---------------------------------------------------------------------------

/** card → delving | outcome. */
export function continueLootCacheCard(s: LootCacheSession): LootCacheSession {
    if (s.phase !== 'card' || s.card === null) return s;
    const cleared = { ...s, card: null };
    if (cleared.depth >= cleared.layers.length) return finishLootCache(cleared);
    return { ...cleared, phase: 'delving' };
}

function finishLootCache(s: LootCacheSession): LootCacheSession {
    const opened = s.layers.filter(l => l.opened && !l.spoiled);
    const itemsKept = opened.flatMap(l => l.loot.items);
    const currencyKept = opened.reduce((sum, l) => sum + l.loot.currency, 0);
    const keepsakes = opened.map(l => l.loot.keepsake).filter(k => k.length > 0);

    let tier: LootCacheOutcomeTier;
    if (s.bittenVitae > 0) tier = 'stung';
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
