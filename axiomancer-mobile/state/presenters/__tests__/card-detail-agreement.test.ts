/**
 * AGREEMENT GUARD — the card detail panel must say what the card actually does.
 *
 * Owner finding 4, the most important item of the 2026-09-21 UI brief: "card
 * details sometimes don't match the actual card". This is a CORRECTNESS bug,
 * not a copy bug, and this test is how we know when it is fixed.
 *
 * ## What it checks
 *
 * For every card in the live library (all nine pools — apocrypha, choir, debt,
 * grave, relics, rot, starters, trial, vigil) it builds the REAL detail
 * view-model the combat overlay renders (`detailStats`) and compares the two
 * player-visible rows against the card's AUTHORED effect data:
 *
 * - **◇ NO DIE** (`detail.freePill`) against `card.free` — the authored dieless
 *   rider, as the engine's own `riderText` prints it.
 * - **◆ +DIE** (`detail.diePaidLine ?? detail.outcomeLine`) against
 *   `card.combatEffects` + `card.specialMechanics` — every payload clause the
 *   engine's own `mechanicText` prints must be represented, with its authored
 *   numbers, and no number may appear that the card's data cannot produce.
 *
 * ## Why the expectations come from the CARD, not from the engine's text
 *
 * The point is agreement with the DATA. Deriving the expectation from the
 * engine's printed string would only prove the presenter copied a string; the
 * numbers below are read straight off the authored `specialMechanics` /
 * `combatEffects` objects, so a presenter that recomputes a number wrongly, or
 * drops a clause it has no case for, fails here no matter how the engine words
 * itself.
 *
 * ## The universe of legal numbers
 *
 * A rendered number is legal when it is either authored on the card, or
 * printed by the engine's own generated lines for that card (`topActionText` /
 * `bottomActionText` / `dieLines`, all of which are generated FROM the effect
 * data by `combat.cards.ts`). Anything else is a presenter invention.
 */

import { describe, it, expect } from '@jest/globals';
import { getCard, cardLibrary, lookupEffect, mechanicText, riderText, MAX_EFFECT_INTENSITY } from '@mechanics';
import type { Card } from '@mechanics';
import { detailStats } from '@/state/presenters/combat-encounter.engine';
import { keywordForEffect, keywordForMechanic } from '@/state/combat/keywords';

type Mech = NonNullable<Card['specialMechanics']>[number];
type Rider = NonNullable<Card['free']>;

/** Mechanic kinds that are pure die plumbing — the engine prints them, but they
 *  are deliberately not a player-facing paid-line row (the presenter's own
 *  `mechPaidPart` returns null for exactly these). Not drift. */
const PLUMBING: ReadonlySet<string> = new Set([
    'refresh_die', 'convert_die_color', 'bank_spent_die', 'reroll_spent',
]);

/** Every finite number reachable inside an authored payload object, plus the
 *  percent spelling of any 0<x<1 fraction (the engine prints `pct: 0.35` as
 *  "35%"). Walks nested riders so a mechanic's rider numbers count as authored. */
function authoredNumbers(value: unknown, out: Set<number> = new Set()): Set<number> {
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) return out;
        out.add(value);
        if (value > 0 && value < 1) out.add(Math.round(value * 100));
        if (Number.isInteger(value)) out.add(value);
        return out;
    }
    if (Array.isArray(value)) {
        for (const v of value) authoredNumbers(v, out);
        return out;
    }
    if (value && typeof value === 'object') {
        for (const v of Object.values(value as Record<string, unknown>)) authoredNumbers(v, out);
    }
    return out;
}

/** Integers a rendered string actually shows the player. */
function renderedNumbers(text: string): number[] {
    return (text.match(/\d+/g) ?? []).map(Number);
}

/** The word the player should be able to find for a mechanic clause: the mobile
 *  keyword when one is registered, else the engine's own leading word. */
function mechLabels(m: Mech): string[] {
    const labels: string[] = [];
    const kw = keywordForMechanic(m.kind);
    if (kw) labels.push(kw);
    const engineText = mechanicText(m);
    if (engineText) {
        const lead = engineText.match(/^[A-Za-z]+/)?.[0];
        if (lead) labels.push(lead);
        // A clause the engine opens with a symbol ('+2 Conviction', '+2 pips to
        // every Reserve die') has no lead WORD to look for, so the engine's own
        // printed clause is the thing to find. Carrying it verbatim IS the
        // agreement criterion for those kinds.
        labels.push(engineText);
    }
    return labels;
}

/** The word the player should be able to find for an authored status clause. */
function effectLabels(effectId: string): string[] {
    const labels: string[] = [];
    const kw = keywordForEffect(effectId);
    if (kw) labels.push(kw);
    const def = lookupEffect(effectId);
    if (def?.name) labels.push(def.name);
    labels.push(effectId.replace(/^(debuff|buff)_/, '').replace(/_/g, ' '));
    return labels;
}

function mentions(text: string, labels: readonly string[]): boolean {
    const hay = text.toLowerCase();
    return labels.some(l => l.length > 2 && hay.includes(l.toLowerCase()));
}

/** The row carries the clause's whole substantive vocabulary, even if it
 *  re-orders or re-cases it — `'+2 Conviction · draw 2'` rendered as
 *  `'CONVICTION +2 · DRAW 2'` is the SAME clause, and a presenter is allowed to
 *  spell it in the house idiom. Dropping a word is what this catches. */
function wordsCovered(row: string, engineText: string): boolean {
    const hay = row.toLowerCase();
    const words = engineText.match(/[A-Za-z]{4,}/g) ?? [];
    return words.length > 0 && words.every(w => hay.includes(w.toLowerCase()));
}

/** The exact string the ◆ +DIE row renders (CombatEncounterPanel.tsx). */
function paidRowText(d: ReturnType<typeof detailStats>): string {
    return d.diePaidLine ?? d.outcomeLine;
}

describe('card detail agreement (finding 4 — the detail must match the card)', () => {
    it('the ◇ NO DIE row is the authored free rider, never a substitute', () => {
        const drift: string[] = [];
        for (const authored of cardLibrary) {
            const projected = getCard(authored.id);
            if (!projected) continue;
            if (authored.cardType === 'oath' || authored.cardType === 'hex') continue;
            const d = detailStats(projected, authored);
            const free: Rider | undefined = authored.free;
            if (!free) {
                // No authored rider — the row must say so, not invent an effect.
                if (!/no effect/i.test(d.freePill)) {
                    drift.push(`${authored.id}: NO-DIE row reads "${d.freePill}" but the card authors no free rider`);
                }
                continue;
            }
            const expectedNums = authoredNumbers(free);
            const shown = renderedNumbers(d.freePill);
            for (const n of shown) {
                if (!expectedNums.has(n)) {
                    drift.push(`${authored.id}: NO-DIE row shows ${n}, absent from the authored free rider (${riderText(free)})`);
                }
            }
            // Every number the engine's own rider text prints must survive to the row.
            for (const n of renderedNumbers(riderText(free))) {
                if (!shown.includes(n)) {
                    drift.push(`${authored.id}: NO-DIE row "${d.freePill}" drops ${n} from the authored free rider (${riderText(free)})`);
                }
            }
        }
        expect(drift).toEqual([]);
    });

    it('a card with any payload never falls back to the headline sentence', () => {
        // The old presenter returned null from its paid-line builder whenever
        // fewer than two clauses survived its walk, and the panel then printed
        // a one-clause headline — which is how `thumbprick-oath` came to print
        // "Deal 14 VITAE." and never mention the 5 VITAE it costs you.
        const fallbacks: string[] = [];
        for (const authored of cardLibrary) {
            const projected = getCard(authored.id);
            if (!projected) continue;
            const hasPayload = (authored.combatEffects?.length ?? 0) > 0
                || (authored.specialMechanics?.length ?? 0) > 0
                || !!authored.persistentEffect;
            if (!hasPayload) continue;
            if (detailStats(projected, authored).diePaidLine === null) fallbacks.push(authored.id);
        }
        expect(fallbacks).toEqual([]);
    });

    it('the ◆ +DIE row represents every authored payload clause', () => {
        const drift: string[] = [];
        for (const authored of cardLibrary) {
            const projected = getCard(authored.id);
            if (!projected) continue;
            const d = detailStats(projected, authored);
            const row = paidRowText(d);
            for (const m of authored.specialMechanics ?? []) {
                if (PLUMBING.has(m.kind)) continue;
                if (!mechanicText(m)) continue;
                if (!mentions(row, mechLabels(m)) && !wordsCovered(row, mechanicText(m)!)) {
                    drift.push(`${authored.id}: +DIE row "${row}" never names its ${m.kind} clause (engine prints "${mechanicText(m)}")`);
                }
            }
            for (const ce of authored.combatEffects ?? []) {
                if (!mentions(row, effectLabels(ce.effectId))) {
                    drift.push(`${authored.id}: +DIE row "${row}" never names its ${ce.effectId} status`);
                }
            }
        }
        expect(drift).toEqual([]);
    });

    it('the ◆ +DIE row prints the numbers the card authors', () => {
        const drift: string[] = [];
        for (const authored of cardLibrary) {
            const projected = getCard(authored.id);
            if (!projected) continue;
            const d = detailStats(projected, authored);
            const row = paidRowText(d);
            const shown = new Set(renderedNumbers(row));
            for (const m of authored.specialMechanics ?? []) {
                if (PLUMBING.has(m.kind)) continue;
                if (!mechanicText(m)) continue;
                // clause absence is the other test's finding
                if (!mentions(row, mechLabels(m)) && !wordsCovered(row, mechanicText(m)!)) continue;
                for (const n of authoredNumbers(m)) {
                    // Only require the headline magnitudes, not every nested flag.
                    if (n === 0 || n === 1) continue;
                    // A fraction is printed as its percent form, which is in the
                    // same set and IS checked; the raw 0.35 never appears.
                    if (!Number.isInteger(n)) continue;
                    if (!shown.has(n)) {
                        drift.push(`${authored.id}: +DIE row "${row}" omits ${n} from its ${m.kind} clause (engine prints "${mechanicText(m)}")`);
                    }
                }
            }
        }
        expect(drift).toEqual([]);
    });

    it('the ◆ +DIE row invents no number the card cannot produce', () => {
        const drift: string[] = [];
        for (const authored of cardLibrary) {
            const projected = getCard(authored.id);
            if (!projected) continue;
            const d = detailStats(projected, authored);
            const row = paidRowText(d);
            const legal = authoredNumbers({
                effects: authored.combatEffects ?? [],
                mechs: authored.specialMechanics ?? [],
                free: authored.free ?? null,
                threshold: authored.threshold ?? null,
                dieBonus: authored.dieBonus ?? null,
                fate: authored.fate ?? null,
                fallen: authored.fallen ?? null,
                synergy: authored.synergy ?? null,
            });
            // Durations that fall back to the effect library's own default are
            // authored data too — just one indirection away.
            for (const ce of authored.combatEffects ?? []) {
                const def = lookupEffect(ce.effectId);
                if (def) authoredNumbers(def.duration, legal);
            }
            // A DoT's tick and lifetime are DERIVED from its payload, so they
            // are the card's data one arithmetic step away. Re-derive them here
            // independently of the presenter rather than trusting it.
            for (const ce of authored.combatEffects ?? []) {
                const def = lookupEffect(ce.effectId);
                const dot = def?.payload.damageOverTime;
                if (!def || !dot) continue;
                const i = Math.min(ce.intensity ?? 1, MAX_EFFECT_INTENSITY);
                const d = ce.duration ?? def.duration;
                legal.add(Math.floor(dot.damagePerRound * i));
                let life = 0;
                for (let k = 0; k < d; k++) life += Math.floor(dot.damagePerRound * i);
                legal.add(life);
            }
            // The engine's own generated lines are derived from the same data;
            // a number it prints is by construction legal.
            for (const n of renderedNumbers([
                projected.topActionText, projected.bottomActionText, ...(projected.dieLines ?? []),
            ].join(' '))) legal.add(n);
            for (const n of renderedNumbers(row)) {
                if (!legal.has(n)) {
                    drift.push(`${authored.id}: +DIE row "${row}" shows ${n}, which the card's effect data cannot produce`);
                }
            }
        }
        expect(drift).toEqual([]);
    });
});
