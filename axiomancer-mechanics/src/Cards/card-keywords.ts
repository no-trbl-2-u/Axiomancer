/**
 * Phase 104 — a card's REAL keyword surface, derived from what it actually
 * carries (`combatEffects` + `specialMechanics`), not just its declared
 * theme. Needed because DOOM/MARK/BLEED are deliberately connective tissue
 * shared across most theme families (`Cards/card-themes.ts`'s own doc
 * comment): matching by theme MEMBERSHIP alone (any card whose theme family
 * happens to list one of these words) would make the reward-draft's
 * dominant-theme guarantee (`Combat/combat.rewards.ts`) match almost the
 * whole library through DOOM alone, defeating its purpose. This file is
 * mechanics' own copy of the mapping mobile's `state/combat/keywords.ts`
 * (`EFFECT_KEYWORD` / `MECHANIC_KEYWORD`) keeps for PRESENTATION — the two
 * are separate concerns (engine-logic matching vs. player-facing text) that
 * happen to share data, same as `THEME_KEYWORDS` already does; this table is
 * intentionally a narrower subset (only the entries that resolve to a word a
 * `THEME_KEYWORDS` family actually lists — the rest can never match a
 * dominant theme, so they are not worth carrying here).
 */

import type { Card, CardRider } from './types';

const EFFECT_ID_KEYWORD: Readonly<Record<string, string>> = Object.freeze({
    debuff_bleed: 'BLEED',
    debuff_creeping_doom: 'DOOM',
    debuff_mark: 'MARK',
    debuff_poison: 'POISON',
    debuff_quarter: 'QUARTER',
});

const MECHANIC_KIND_KEYWORD: Readonly<Record<string, string>> = Object.freeze({
    guard: 'GUARD',
});

/** `CardRider` field → keyword. */
const RIDER_FIELD_KEYWORD: { readonly [K in keyof CardRider]?: string } = Object.freeze({
    guard: 'GUARD',
});

function riderKeywords(rider: CardRider | undefined, out: Set<string>): void {
    if (!rider) return;
    for (const field of Object.keys(RIDER_FIELD_KEYWORD) as (keyof CardRider)[]) {
        if (rider[field] != null) out.add(RIDER_FIELD_KEYWORD[field]!);
    }
}

/**
 * The keywords a specific card actually carries, in the same UPPERCASE
 * vocabulary `THEME_KEYWORDS` uses. Not every mechanic resolves to one (e.g.
 * `deal` — a real verb, just not a member of any theme's
 * printed family, so they can never steer the dominant-theme pull).
 */
export function cardKeywords(card: Card): readonly string[] {
    const out = new Set<string>();
    for (const ce of card.combatEffects ?? []) {
        const kw = EFFECT_ID_KEYWORD[ce.effectId];
        if (kw) out.add(kw);
    }
    for (const sm of card.specialMechanics ?? []) {
        const kw = MECHANIC_KIND_KEYWORD[sm.kind];
        if (kw) out.add(kw);
    }
    riderKeywords(card.free, out);
    return [...out];
}
