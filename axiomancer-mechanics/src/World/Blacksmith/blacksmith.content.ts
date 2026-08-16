/**
 * Blacksmith — witness variant gear (Spec 33 §6 / Phase D5).
 *
 * The brief asks for 1–2 variant die-gear pieces as WITNESSES that the swap
 * path (a payload change IS a gear swap) works end-to-end — content authoring
 * stays deliberately minimal. These are the only variants shipped in D5.
 *
 * [needs-user-call] Payloads are design surface (phase brief): anything beyond
 * the "+3◆" example proposed here needs owner sign-off before shipping. Only
 * the modest richer-payload witness below is authored — same legal face table
 * as the default heart gear (1 special / 2 mana / 3 miss), lifting only the
 * special payload 2◆ → 3◆.
 */

import type { BlacksmithVariantOffer } from './blacksmith.types';

/** A single witness: the heart die's default face table with a +3◆ payload. */
export const HEART_RICH_PAYLOAD_VARIANT: BlacksmithVariantOffer = Object.freeze({
    id: 'die-gear-heart-rich-payload',
    name: "Sanguine Fitting (+3◆ payload)",
    gear: Object.freeze({
        dieColor: 'heart',
        specialFaces: 1,
        manaFaces: 2,
        specialConviction: 3,
    }),
    // No override — falls back to ANVIL_VERB_PRICING.swap.
});

/** The variant offers a D5 blacksmith node may present (witnesses only). */
export const BLACKSMITH_WITNESS_VARIANTS: readonly BlacksmithVariantOffer[] = Object.freeze([
    HEART_RICH_PAYLOAD_VARIANT,
]);
