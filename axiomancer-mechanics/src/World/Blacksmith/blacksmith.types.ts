/**
 * Blacksmith encounter ("The Anvil") — engine types.
 *
 * The die-gear upgrade surface (Spec 33 §6, Phase D5). The four dice are
 * permanent immutable 6-siders; ALL progression lives on the GEAR that drives
 * each die's face table + special payload. The blacksmith is where that gear
 * is HONED (add a mana face, −1 miss) and TEMPERED (upgrade a mana face to a
 * special face), and where variant gear pieces can be SWAPPED in (a payload
 * change IS a gear swap; §6 — no service keyword for it).
 *
 * Two-way like the hazard / rest / loot-cache minigames: the engine NEVER
 * reads `GameState`. The host passes an authored payload in — the starting
 * rail, the spendable budget, any offered variant gear — and applies the
 * outcome (the upgraded rail written to `Character.dieGear`, the budget spent)
 * at claim time. Every transition is `(session, …) → session`; invalid calls
 * return the input unchanged; cap-violating or unaffordable upgrades are
 * refused LOUDLY (a refusal card), leaving the rail + budget untouched.
 */

import type { SeedInput } from '../seed';
import type { UpgradeableDieGear } from '../../Combat/combat.encounter.types';
import type { DieGearColor, DieGearRail } from '../../Character/dieGear.reducer';
import type { BlacksmithRngState } from './blacksmith.rng';

export type { DieGearColor, DieGearRail };

/** The service verbs the anvil offers (§6 keywords + the gear swap). */
export type BlacksmithVerb = 'hone' | 'temper' | 'swap';

/**
 * One offered variant gear piece the player may swap in for its die. Authored
 * on the map-event payload (a witness reward, e.g. a richer-payload piece).
 * `id` is a stable handle the host maps back; `price` overrides the default
 * swap price when set.
 */
export interface BlacksmithVariantOffer {
    id: string;
    name: string;
    gear: UpgradeableDieGear;
    /** PLACEHOLDER price override; falls back to the default swap price. */
    price?: number;
}

/** A result flash shown between forging decisions (like the loot-cache card). */
export interface BlacksmithCard {
    title: string;
    body: string;
    verb: BlacksmithVerb;
    color: DieGearColor;
    /** Budget spent by this action (0 on a refusal). */
    cost: number;
    /** The die's gear AFTER the action (the pre-action gear on a refusal). */
    gear: UpgradeableDieGear;
    /** True when the anvil refused the upgrade (cap violation / unaffordable). */
    refused: boolean;
    /** Loud reason when `refused`; '' otherwise. */
    reason: string;
}

/**
 * The claim-time ledger. The host writes `rail` to `Character.dieGear` and
 * deducts `spent` from the player's budget.
 */
export interface BlacksmithOutcome {
    rail: DieGearRail;
    /** Total budget spent across the visit. */
    spent: number;
    honed: number;
    tempered: number;
    swapped: number;
}

export type BlacksmithPhase =
    | 'intro'    // the anvil, described
    | 'forging'  // choosing an upgrade (hone / temper / swap) or leaving
    | 'card'     // a result / refusal flash is open
    | 'outcome'  // the ledger
    | 'done';    // host claimed

export interface BlacksmithSession {
    phase: BlacksmithPhase;
    /** The working rail — starts from the authored payload (or default). */
    rail: DieGearRail;
    /** Spendable resource remaining (PLACEHOLDER unit; host maps ◆/souls). */
    budget: number;
    /** Total spent so far; the host settles this at claim. */
    spent: number;
    /** Variant gear pieces on offer this visit (swap targets). */
    variants: readonly BlacksmithVariantOffer[];
    honed: number;
    tempered: number;
    swapped: number;
    card: BlacksmithCard | null;
    outcome: BlacksmithOutcome | null;
    seed: SeedInput;
    rng: BlacksmithRngState;
}
