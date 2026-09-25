/**
 * Blacksmith encounter ("The Anvil") — content, tuning, and pure engine
 * transitions (Spec 33 §6, Phase D5). Compact enough to live in one file.
 *
 * State machine:
 *
 *   intro ──beginBlacksmith──▶ forging ──hone/temper/swap──▶ card ──continueBlacksmithCard──▶ forging
 *                                 │  ▲                                                            │
 *                                 │  └────────────────────────────────────────────────────────────┘
 *                                 │
 *                                 └──leaveBlacksmith──▶ outcome ──claimBlacksmithOutcome──▶ done
 *
 * The engine NEVER reads `GameState`. The host passes the authored payload —
 * the starting rail, the spendable budget, offered variant gear — and applies
 * the outcome (upgraded rail + budget spent) at claim. Cap authority is the
 * shared `validateDieGear` (the SAME check the character-side reducer uses),
 * so a cap-violating upgrade is refused identically here and in the reducer.
 * Refusals are LOUD (a refusal card) and leave the rail + budget untouched.
 *
 * Prices are ratified (Phase 52f) in SHILLINGS. The rest-node offer that
 * used to reach this engine with a single flat bypass price was dropped
 * Phase 59; Phase 60 re-homes access to a directly-authored `blacksmith`
 * MapEvent node instead (`MapEvents/types.ts`), so these per-verb tiers are
 * the live prices again. The mobile host maps `budget` to
 * `Character.currency` by default.
 */

import { seedRng } from './blacksmith.rng';
import type { SeedInput } from '../seed';
import {
    validateDieGear,
    concreteDefaultRail,
    type DieGearColor,
    type DieGearRail,
} from '../../Character/dieGear.reducer';
import type { UpgradeableDieGear } from '../../Combat/combat.encounter.types';
import type {
    BlacksmithCard,
    BlacksmithOutcome,
    BlacksmithSession,
    BlacksmithVariantOffer,
    BlacksmithVerb,
} from './blacksmith.types';

// ---------------------------------------------------------------------------
// Tuning (ratified Phase 52f)
// ---------------------------------------------------------------------------

/**
 * Upgrade prices in shillings, ratified Phase 52f against measured
 * loot-cache income (~26 shillings/act) — sized so a single anvil visit
 * (hone + temper + swap once each = 16) still leaves room for shop wares,
 * while HONE < TEMPER < SWAP keeps the D3-derived ordering (a full gear
 * swap costs more than one face upgrade).
 */
export const ANVIL_VERB_PRICING = Object.freeze({
    /** HONE (add a mana face, −1 miss). */
    hone: 3,
    /** TEMPER (upgrade a mana face to a special face). */
    temper: 5,
    /** SWAP (replace a die's gear with an offered variant). */
    swap: 8,
});

const VERB_CHROME: Readonly<Record<BlacksmithVerb, { title: string; body: string }>> = Object.freeze({
    hone: {
        title: 'THE EDGE TAKES',
        body: 'The hammer finds the die\'s dead weight and draws it out true. A miss face gives way to live mana.',
    },
    temper: {
        title: 'TEMPERED IN THE DARK',
        body: 'Quenched and folded, a mana face hardens into something that pays: a new special, and the Conviction it carries.',
    },
    swap: {
        title: 'RE-GEARED',
        body: 'The old fitting comes off cold; the new one seats with a click the anvil seems to approve of.',
    },
});

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

/**
 * Builds the anvil session from the authored payload. `rail` is the player's
 * current die gear (a pre-D5 host may pass a default rail via
 * `concreteDefaultRail()`); `budget` is the spendable resource; `variants` are
 * the swap offers. RNG is seeded and threaded but untouched by the
 * deterministic upgrade transitions.
 */
export function createBlacksmithSession(
    seed: SeedInput,
    rail: DieGearRail,
    budget: number,
    variants: readonly BlacksmithVariantOffer[] = [],
): BlacksmithSession {
    return {
        phase: 'intro',
        rail: cloneRail(rail),
        budget: Math.max(0, budget),
        spent: 0,
        variants: variants.map(v => ({ ...v, gear: { ...v.gear } })),
        honed: 0,
        tempered: 0,
        swapped: 0,
        card: null,
        outcome: null,
        seed,
        rng: seedRng(seed),
    };
}

function cloneRail(rail: DieGearRail): DieGearRail {
    const out = concreteDefaultRail();
    (Object.keys(out) as DieGearColor[]).forEach(c => {
        if (rail[c]) out[c] = { ...rail[c] };
    });
    return out;
}

/** intro → forging. */
export function beginBlacksmith(s: BlacksmithSession): BlacksmithSession {
    if (s.phase !== 'intro') return s;
    return { ...s, phase: 'forging' };
}

// ---------------------------------------------------------------------------
// Forging (the upgrade verbs)
// ---------------------------------------------------------------------------

function refusalCard(
    verb: BlacksmithVerb,
    color: DieGearColor,
    gear: UpgradeableDieGear,
    reason: string,
): BlacksmithCard {
    return {
        title: 'THE ANVIL REFUSES',
        body: `The smith sets the hammer down. "${reason}."`,
        verb,
        color,
        cost: 0,
        gear,
        refused: true,
        reason,
    };
}

function successCard(
    verb: BlacksmithVerb,
    color: DieGearColor,
    gear: UpgradeableDieGear,
    cost: number,
): BlacksmithCard {
    const chrome = VERB_CHROME[verb];
    return {
        title: chrome.title,
        body: chrome.body,
        verb,
        color,
        cost,
        gear,
        refused: false,
        reason: '',
    };
}

/**
 * Applies a validated upgrade: charges `cost`, writes `gear` into the rail,
 * bumps the verb tally, and opens the success card. Assumes the caller has
 * already validated caps + affordability.
 */
function applyUpgrade(
    s: BlacksmithSession,
    verb: BlacksmithVerb,
    color: DieGearColor,
    gear: UpgradeableDieGear,
    cost: number,
): BlacksmithSession {
    const rail: DieGearRail = { ...s.rail, [color]: gear };
    return {
        ...s,
        rail,
        budget: s.budget - cost,
        spent: s.spent + cost,
        honed: s.honed + (verb === 'hone' ? 1 : 0),
        tempered: s.tempered + (verb === 'temper' ? 1 : 0),
        swapped: s.swapped + (verb === 'swap' ? 1 : 0),
        phase: 'card',
        card: successCard(verb, color, gear, cost),
    };
}

/** Guard shared by every verb: must be forging, and must afford the price. */
function refuseUnaffordable(
    s: BlacksmithSession,
    verb: BlacksmithVerb,
    color: DieGearColor,
    gear: UpgradeableDieGear,
    price: number,
): BlacksmithSession | null {
    if (price > s.budget) {
        return {
            ...s,
            phase: 'card',
            card: refusalCard(verb, color, gear, `you can't cover the ${price} it costs`),
        };
    }
    return null;
}

/**
 * forging → card. HONE a die: add a mana face (−1 miss). Refused loudly at the
 * 1-miss floor (whiff is never forgeable away) or when unaffordable.
 */
export function honeBlacksmith(s: BlacksmithSession, color: DieGearColor): BlacksmithSession {
    if (s.phase !== 'forging') return s;
    const gear = s.rail[color];
    const price = ANVIL_VERB_PRICING.hone;
    const unaffordable = refuseUnaffordable(s, 'hone', color, gear, price);
    if (unaffordable) return unaffordable;

    const candidate: UpgradeableDieGear = { ...gear, manaFaces: gear.manaFaces + 1 };
    const reason = validateDieGear(candidate, color);
    if (reason) return { ...s, phase: 'card', card: refusalCard('hone', color, gear, reason) };
    return applyUpgrade(s, 'hone', color, candidate, price);
}

/**
 * forging → card. TEMPER a die: upgrade a mana face to a special face
 * (+1 special, −1 mana). Refused loudly above the special cap, with no mana
 * face to spend, or when unaffordable.
 */
export function temperBlacksmith(s: BlacksmithSession, color: DieGearColor): BlacksmithSession {
    if (s.phase !== 'forging') return s;
    const gear = s.rail[color];
    const price = ANVIL_VERB_PRICING.temper;
    const unaffordable = refuseUnaffordable(s, 'temper', color, gear, price);
    if (unaffordable) return unaffordable;

    if (gear.manaFaces < 1) {
        return { ...s, phase: 'card', card: refusalCard('temper', color, gear, 'no mana face to upgrade') };
    }
    const candidate: UpgradeableDieGear = {
        ...gear,
        specialFaces: gear.specialFaces + 1,
        manaFaces: gear.manaFaces - 1,
    };
    const reason = validateDieGear(candidate, color);
    if (reason) return { ...s, phase: 'card', card: refusalCard('temper', color, gear, reason) };
    return applyUpgrade(s, 'temper', color, candidate, price);
}

/**
 * forging → card. SWAP in an offered variant gear piece for its die. The
 * variant's `dieColor` decides the target; refused loudly on an unknown offer,
 * an illegal table, or when unaffordable.
 */
export function swapBlacksmith(s: BlacksmithSession, variantId: string): BlacksmithSession {
    if (s.phase !== 'forging') return s;
    const offer = s.variants.find(v => v.id === variantId);
    if (!offer) return s; // unknown offer — invalid call, silent no-op.

    const color = offer.gear.dieColor as DieGearColor;
    const gear = { ...offer.gear };
    const price = offer.price ?? ANVIL_VERB_PRICING.swap;
    const unaffordable = refuseUnaffordable(s, 'swap', color, gear, price);
    if (unaffordable) return unaffordable;

    const reason = validateDieGear(gear, color);
    if (reason) return { ...s, phase: 'card', card: refusalCard('swap', color, s.rail[color], reason) };
    return applyUpgrade(s, 'swap', color, gear, price);
}

// ---------------------------------------------------------------------------
// Cards & outcome
// ---------------------------------------------------------------------------

/** card → forging. Acknowledges the result flash (success or refusal). */
export function continueBlacksmithCard(s: BlacksmithSession): BlacksmithSession {
    if (s.phase !== 'card' || s.card === null) return s;
    return { ...s, phase: 'forging', card: null };
}

/** forging → outcome. Leaves the anvil, sealing the visit's ledger. */
export function leaveBlacksmith(s: BlacksmithSession): BlacksmithSession {
    if (s.phase !== 'forging') return s;
    const outcome: BlacksmithOutcome = {
        rail: cloneRail(s.rail),
        spent: s.spent,
        honed: s.honed,
        tempered: s.tempered,
        swapped: s.swapped,
    };
    return { ...s, phase: 'outcome', outcome };
}

/** outcome → done. The host writes the rail to the player and settles the spend. */
export function claimBlacksmithOutcome(s: BlacksmithSession): BlacksmithSession {
    if (s.phase !== 'outcome' || s.outcome === null) return s;
    return { ...s, phase: 'done' };
}
