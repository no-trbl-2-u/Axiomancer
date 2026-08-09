/**
 * Blacksmith encounter presenter — maps the engine session
 * (`axiomancer-mechanics` World/Blacksmith) onto a render-ready
 * view-model (Spec 33 §6 / Phase D6c). Pure: no store writes, no rolls,
 * no rule decisions.
 *
 * The forge screen's job is to render, per die, the HONE / TEMPER offers
 * with their PLACEHOLDER ◆ prices, and the swap offers — each carrying an
 * `enabled` flag AND, when disabled, the LOUD reason (owner-UI doctrine:
 * an illegal or unaffordable action is greyed AND named, never a silent
 * no-op). The reason strings are the SAME cap authority the engine's
 * refusal card uses (`validateDieGear`), so the greyed-offer copy and the
 * refusal-card copy always agree.
 */

import {
    BLACKSMITH_PRICING_PLACEHOLDER,
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
    /** Compact tally chips, e.g. "2 HONED", "−7 ◆". */
    chips: readonly string[];
}

export interface BlacksmithVM {
    active: boolean;
    phase: BlacksmithSession['phase'] | 'none';
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

const CURRENCY_GLYPH = '◆';

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

const EMPTY_VM: BlacksmithVM = Object.freeze({
    active: false,
    phase: 'none',
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
    if (!affordable) return `costs ${price} ${CURRENCY_GLYPH} — you can't cover it`;
    return '';
}

function honeOffer(rail: DieGearRail, color: DieGearColor, budget: number): BlacksmithOfferVM {
    const gear = rail[color];
    const price = BLACKSMITH_PRICING_PLACEHOLDER.hone;
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
        reason,
    };
}

function temperOffer(rail: DieGearRail, color: DieGearColor, budget: number): BlacksmithOfferVM {
    const gear = rail[color];
    const price = BLACKSMITH_PRICING_PLACEHOLDER.temper;
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
        reason,
    };
}

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
        const price = v.price ?? BLACKSMITH_PRICING_PLACEHOLDER.swap;
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
    if (outcome.spent > 0) chips.push(`−${outcome.spent} ${CURRENCY_GLYPH}`);
    if (chips.length === 0) chips.push('LEFT AS FOUND');
    return chips;
}

// Re-export the cap helper the screen uses for a quick per-die legality hint
// (kept here so the screen imports one presenter module, not the engine).
export { dieSpecialCap };
