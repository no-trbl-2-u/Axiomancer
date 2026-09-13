/**
 * Blacksmith encounter presenter — maps the engine session
 * (`axiomancer-mechanics` World/Blacksmith) onto a render-ready
 * view-model (Spec 33 §6 / Phase D6c). Pure: no store writes, no rolls,
 * no rule decisions.
 *
 * The forge screen's job is to render, per die, the HONE / TEMPER offers
 * with their shilling prices (`ANVIL_VERB_PRICING`, ratified Phase 52f), and
 * the swap offers — each carrying an `enabled` flag AND, when disabled, the
 * LOUD reason (owner-UI doctrine: an illegal or unaffordable action is
 * greyed AND named, never a silent no-op). The reason strings are the SAME
 * cap authority the engine's refusal card uses (`validateDieGear`), so the
 * greyed-offer copy and the refusal-card copy always agree.
 */

import {
    ANVIL_VERB_PRICING,
    validateDieGear,
    dieGearMissFaces,
    dieSpecialCap,
    DIE_GEAR_COLORS,
} from '@mechanics';
import type {
    BlacksmithSession,
    DieGearColor,
    DieGearRail,
    UpgradeableDieGear,
} from '@mechanics';
import type { AppStoreState } from '@/state/store';

// ---------------------------------------------------------------------------
// VM shapes
// ---------------------------------------------------------------------------

/** One offered upgrade action: its price, whether it is takeable, and why not. */
export interface BlacksmithOfferVM {
    /** Verb + target: e.g. `hone:heart`, `swap:die-gear-heart-rich-payload`. */
    id: string;
    verb: 'hone' | 'temper' | 'swap';
    color: DieGearColor;
    label: string;
    price: number;
    enabled: boolean;
    /**
     * S5-talk-C12 — what the verb BUYS, in the screen's own face words
     * (`MISS face → MANA`). HONE and TEMPER are the smith's vocabulary, not
     * the game's; the offer now states its trade instead of naming it.
     * '' on a SWAP, whose row already prints the face read it installs.
     */
    effect: string;
    /** Loud reason when `!enabled`; '' when takeable. */
    reason: string;
}

/** A single die's current face table + its two service offers. */
export interface BlacksmithDieVM {
    color: DieGearColor;
    label: string;
    specialFaces: number;
    manaFaces: number;
    missFaces: number;
    specialConviction: number;
    /** Compact face read, e.g. "1 BOON · 2 MANA · 3 MISS". */
    faceSummary: string;
    hone: BlacksmithOfferVM;
    temper: BlacksmithOfferVM;
}

/** A swap offer (a variant gear piece for its die). */
export interface BlacksmithSwapVM {
    offer: BlacksmithOfferVM;
    name: string;
    /** The face read the swap would install. */
    faceSummary: string;
}

export interface BlacksmithCardVM {
    title: string;
    body: string;
    verb: 'hone' | 'temper' | 'swap';
    color: DieGearColor;
    cost: number;
    refused: boolean;
    reason: string;
}

export interface BlacksmithOutcomeVM {
    spent: number;
    honed: number;
    tempered: number;
    swapped: number;
    /** Compact tally chips, e.g. "2 HONED", "−7s". */
    chips: readonly string[];
}

export interface BlacksmithVM {
    active: boolean;
    phase: BlacksmithSession['phase'] | 'none';
    /** S5-talk-C12 — the smith's opening speech; teaches the face words. */
    introBody: string;
    /** S5-talk-C12 — one line decoding the `1 BOON · 2 MANA · 3 MISS` read. */
    faceKey: string;
    budget: number;
    spent: number;
    dice: readonly BlacksmithDieVM[];
    swaps: readonly BlacksmithSwapVM[];
    card: BlacksmithCardVM | null;
    outcome: BlacksmithOutcomeVM | null;
}

const COLOR_LABELS: Record<DieGearColor, string> = Object.freeze({
    heart: 'HEART',
    body: 'BODY',
    mind: 'MIND',
    wild: 'WILD',
});

/**
 * Shilling suffix for forge prices (FE-023).
 *
 * The forge prices everything in SHILLINGS (`ANVIL_VERB_PRICING`, ratified
 * Phase 52f — "Upgrade prices in shillings"), but every price here used to
 * print with `◆`, which the combat board spends on CONVICTION. A player
 * arriving from a fight reads the smith's prices as costing a combat resource
 * they cannot carry to a forge. `s` is the suffix the village already uses on
 * its own ware prices (`12s`), so the two shops now agree.
 */
const CURRENCY_SUFFIX = 's';

/**
 * The smith's opening speech (S5-talk-C12).
 *
 * It used to sell "drawing a miss out true" and "hardening a face into
 * something that pays" — evocative, and the only place the forge's whole
 * vocabulary appeared. A player who has never seen a die face here could not
 * tell what either sentence bought. Same voice, but it now names the three
 * faces the screen goes on to print, and what each one pays.
 */
const INTRO_BODY =
    'The forge breathes low and orange. The smith turns your dice over, '
    + 'reading the dead weight in them. “Six faces to a die. Most come up '
    + 'MISS and pay you nothing. I can beat a MISS into a MANA face — that one '
    + 'pays for a card. Or harden a MANA face into a BOON, which pays for the '
    + 'card and pays CONVICTION besides. Costs, of course.”';

/**
 * The legend for the per-die face read (S5-talk-C12).
 *
 * Each die prints `1 BOON · 2 MANA · 3 MISS` and nothing said what those
 * three words are worth. Straight off the engine's face semantics
 * (`combat.upgradeable-dice.ts`): a MANA face powers one paid line of its
 * colour, a BOON powers a card AND fires its conviction payload, a MISS is
 * dead.
 */
const FACE_KEY =
    'MANA pays for a card in its colour. BOON pays for a card and pays '
    + 'CONVICTION besides. MISS pays nothing.';

/** S5-talk-C12 — the trade each verb makes, in the same face words. */
const HONE_EFFECT = 'MISS face → MANA';
const TEMPER_EFFECT = 'MANA face → BOON';

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

const EMPTY_VM: BlacksmithVM = Object.freeze({
    active: false,
    phase: 'none',
    introBody: INTRO_BODY,
    faceKey: FACE_KEY,
    budget: 0,
    spent: 0,
    dice: Object.freeze([]),
    swaps: Object.freeze([]),
    card: null,
    outcome: null,
});

export function selectHasActiveBlacksmith(state: Pick<AppStoreState, 'blacksmith'>): boolean {
    return state.blacksmith?.session != null;
}

function faceSummary(gear: UpgradeableDieGear): string {
    const miss = dieGearMissFaces(gear);
    return `${gear.specialFaces} BOON · ${gear.manaFaces} MANA · ${miss} MISS`;
}

/** Combine a cap reason with the affordability reason into one loud line. */
function offerReason(capReason: string | null, affordable: boolean, price: number): string {
    if (capReason) return capReason;
    if (!affordable) return `costs ${price}${CURRENCY_SUFFIX} — you can't cover it`;
    return '';
}

/**
 * Build the HONE offer for one die.
 *
 * @param rail - the session's current die gear, one entry per colour.
 * @param color - which die the offer is for.
 * @param budget - the visit's spendable shillings, for the afford check.
 * @returns the offer VM: price, whether it is takeable, the LOUD reason when
 *   it is not, and (cluster S5-talk-C12) the trade it makes in face words.
 */
function honeOffer(rail: DieGearRail, color: DieGearColor, budget: number): BlacksmithOfferVM {
    const gear = rail[color];
    const price = ANVIL_VERB_PRICING.hone;
    const candidate: UpgradeableDieGear = { ...gear, manaFaces: gear.manaFaces + 1 };
    const capReason = validateDieGear(candidate, color);
    const affordable = price <= budget;
    const reason = offerReason(capReason, affordable, price);
    return {
        id: `hone:${color}`,
        verb: 'hone',
        color,
        label: 'HONE',
        price,
        enabled: reason === '',
        effect: HONE_EFFECT,
        reason,
    };
}

/**
 * Build the TEMPER offer for one die.
 *
 * @param rail - the session's current die gear, one entry per colour.
 * @param color - which die the offer is for.
 * @param budget - the visit's spendable shillings, for the afford check.
 * @returns the offer VM, same contract as `honeOffer` — including the face-word
 *   trade line added for cluster S5-talk-C12.
 */
function temperOffer(rail: DieGearRail, color: DieGearColor, budget: number): BlacksmithOfferVM {
    const gear = rail[color];
    const price = ANVIL_VERB_PRICING.temper;
    const affordable = price <= budget;
    let capReason: string | null;
    if (gear.manaFaces < 1) {
        capReason = 'no mana face to upgrade';
    } else {
        capReason = validateDieGear(
            { ...gear, specialFaces: gear.specialFaces + 1, manaFaces: gear.manaFaces - 1 },
            color,
        );
    }
    const reason = offerReason(capReason, affordable, price);
    return {
        id: `temper:${color}`,
        verb: 'temper',
        color,
        label: 'TEMPER',
        price,
        enabled: reason === '',
        effect: TEMPER_EFFECT,
        reason,
    };
}

/**
 * Compose the forge screen's view-model from the engine session.
 *
 * @param state - the blacksmith slice; `session === null` means no visit.
 * @returns the render-ready `BlacksmithVM`, or the inactive `EMPTY_VM`. Carries
 *   the smith's opening speech and the face-read key (cluster S5-talk-C12) so
 *   no forge copy lives in the screen; every other field is unchanged.
 */
export function selectBlacksmithVM(state: Pick<AppStoreState, 'blacksmith'>): BlacksmithVM {
    const s = state.blacksmith?.session;
    if (!s) return EMPTY_VM;

    const budget = s.budget;

    const dice: BlacksmithDieVM[] = DIE_GEAR_COLORS.map(color => {
        const gear = s.rail[color];
        return {
            color,
            label: COLOR_LABELS[color],
            specialFaces: gear.specialFaces,
            manaFaces: gear.manaFaces,
            missFaces: dieGearMissFaces(gear),
            specialConviction: gear.specialConviction,
            faceSummary: faceSummary(gear),
            hone: honeOffer(s.rail, color, budget),
            temper: temperOffer(s.rail, color, budget),
        };
    });

    const swaps: BlacksmithSwapVM[] = s.variants.map(v => {
        const color = v.gear.dieColor as DieGearColor;
        const price = v.price ?? ANVIL_VERB_PRICING.swap;
        const capReason = validateDieGear(v.gear, color);
        const affordable = price <= budget;
        const reason = offerReason(capReason, affordable, price);
        return {
            offer: {
                id: `swap:${v.id}`,
                verb: 'swap',
                color,
                label: 'SWAP',
                price,
                enabled: reason === '',
                effect: '',
                reason,
            },
            name: v.name,
            faceSummary: faceSummary(v.gear),
        };
    });

    const card: BlacksmithCardVM | null = s.card === null ? null : {
        title: s.card.title,
        body: s.card.body,
        verb: s.card.verb,
        color: s.card.color,
        cost: s.card.cost,
        refused: s.card.refused,
        reason: s.card.reason,
    };

    const outcome: BlacksmithOutcomeVM | null = s.outcome === null ? null : {
        spent: s.outcome.spent,
        honed: s.outcome.honed,
        tempered: s.outcome.tempered,
        swapped: s.outcome.swapped,
        chips: composeOutcomeChips(s.outcome),
    };

    return {
        active: true,
        phase: s.phase,
        introBody: INTRO_BODY,
        faceKey: FACE_KEY,
        budget,
        spent: s.spent,
        dice,
        swaps,
        card,
        outcome,
    };
}

function composeOutcomeChips(outcome: {
    honed: number;
    tempered: number;
    swapped: number;
    spent: number;
}): string[] {
    const chips: string[] = [];
    if (outcome.honed > 0) chips.push(`${outcome.honed} HONED`);
    if (outcome.tempered > 0) chips.push(`${outcome.tempered} TEMPERED`);
    if (outcome.swapped > 0) chips.push(`${outcome.swapped} RE-GEARED`);
    if (outcome.spent > 0) chips.push(`−${outcome.spent}${CURRENCY_SUFFIX}`);
    if (chips.length === 0) chips.push('LEFT AS FOUND');
    return chips;
}

// Re-export the cap helper the screen uses for a quick per-die legality hint
// (kept here so the screen imports one presenter module, not the engine).
export { dieSpecialCap };
