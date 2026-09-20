/**
 * CardFace — the faithful in-combat card FACE for the editor (the prototype's
 * `WorkshopCard`), now typed against the editor's `CardDraft`.
 *
 *   · ART window (top 58%): die-tinted, category glyph top-left, rarity tag
 *   · die-coloured NAME band (★ for gold)
 *   · two-column ◇ FREE | ◆ PAID footer with a die pip
 *
 * A real `Card`/`CardDraft` does not carry the prototype's `die/rarity/freeKw…`
 * fields, so `projectFace` derives them from the card's actual mechanical
 * content (philosophical aspect → die/stance colour, GOLD membership → rarity,
 * specialMechanics / combatEffects → display keywords). This is the editor's
 * analogue of `toCombatCard` in `combat.cards.ts`.
 */
import type { CSSProperties, ReactNode } from 'react';
import type { CardDraft } from '../types';
import { fromDraft } from '../types';
import { rankToRarity, lookupEffect, getCardById, toCombatCard } from '../data/mechanics';
import {
    WX,
    DIE,
    RARITY,
    WX_NOISE,
    ART_STRIPES,
    KEYWORDS,
    fmtVal,
    type DieKey,
    type RarityKey,
    type KeywordId,
    type KeywordMeta,
} from '../theme/wx';

// A draft may carry a transient `img` data-URL (editor-only; not a Card field).
type DraftWithImage = CardDraft & { img?: string | null };

/** The projected, face-ready view of a card. */
export interface FaceCard {
    name: string;
    /** Phase 104 — 'any' (the grey office) is a card ASPECT, not a die
     *  colour, so it stays out of `DieKey`; painted neutral by consumers. */
    die: DieKey | 'any';
    rarity: RarityKey;
    img: string | null;
    /** Keyword that drives the top-left glyph. */
    glyphKw: KeywordId;
    /** May exceed the KEYWORDS vocabulary — every unique FREE effect gets its
     *  own silhouette (owner directive 2026-07-16), incl. rider verbs the paid
     *  vocabulary never uses (reveal / pip / mill / conviction / …). */
    freeKw: KeywordId | string;
    freeVal: number;
    paidKw: KeywordId;
    paidVal: number;
}

// ── Keyword projection from real mechanical content ──────────────────────────
function dotKeyword(effectId: string): KeywordId {
    if (effectId.includes('bleed')) return 'bleed';
    if (effectId.includes('poison')) return 'poison';
    return 'dot';
}

function controlKeyword(effectId: string, skipTurn: boolean): KeywordId {
    // Phase 68: the slow / confusion / silence arms were spec-32-v2 leftovers —
    // no live debuff id carries those substrings, so they could never fire.
    if (skipTurn || effectId.includes('stun')) return 'stun';
    return 'control';
}

/** Best-effort: the card's primary keyword + its representative value. */
function primaryKeyword(card: CardDraft): { kw: KeywordId; val: number } {
    // Persistent cards read as their card type.
    if (card.cardType === 'oath') return { kw: 'oath', val: 0 };
    if (card.cardType === 'hex') return { kw: 'hex', val: 0 };
    const sm = card.specialMechanics[0];
    if (sm) {
        switch (sm.kind) {
            case 'guard':
                return { kw: 'guard', val: sm.amount };
            case 'barrier':
                return { kw: 'barrier', val: sm.amount };
            case 'riposte':
                return { kw: 'riposte', val: sm.damage };
            case 'rupture':
                return { kw: 'rupture', val: sm.bonusPct ?? 0 };
            case 'siphon':
                return { kw: 'siphon', val: Math.round(sm.pct * 100) };
            case 'reap':
                return { kw: 'reap', val: sm.cost };
            case 'reap_all':
                return { kw: 'reap', val: 0 };
            case 'soul_gain':
            case 'consume_affliction':
                return { kw: 'soul', val: 0 };
            case 'sway':
                return { kw: 'sway', val: sm.amount };
            case 'stagger':
                return { kw: 'stagger', val: sm.rungs };
            case 'lock_stance':
                return { kw: 'stagger', val: 0 };
            case 'foretell':
                return { kw: 'foretell', val: sm.count };
            case 'omen':
                return { kw: 'foretell', val: 0 };
            case 'premise':
                return { kw: 'premise', val: sm.count };
            case 'peroration':
            case 'spend_premises':
                return { kw: 'premise', val: 0 };
            case 'echo':
            case 'echo_next_spell':
            case 'reprise':
            case 'replay_last':
                return { kw: 'echo', val: 0 };
            case 'forge_floating_die':
            case 'float_x_die':
            case 'create_temporary_die':
                return { kw: 'forge', val: 0 };
            case 'extend_dots':
            case 'convert_dots':
            case 'boost_all_dots':
                return { kw: 'dot', val: 0 };
            case 'strip_random_buff':
                return { kw: 'strip_buff', val: 0 };
            // ── THE BIG NUMBERS REWRITE (2026-09-02) + long-standing profane-
            // canon verbs that were never given a projection case (found by
            // `/adjust-keywords` pass 5, 2026-09-10): all four already have a
            // `KEYWORDS` entry below, so this is a pure mapping backfill, not a
            // new keyword. DEAL alone is `specialMechanics[0]` on 50/128 live
            // cards (39% of the library) — every one of those previously fell
            // through to the generic CONTROL clock glyph with no value shown. ──
            case 'deal':
                return { kw: 'damage', val: sm.amount };
            case 'recoil':
                return { kw: 'recoil', val: sm.hp };
            case 'recoil_x':
                return { kw: 'recoil', val: sm.min };
            case 'immolate':
                return { kw: 'immolate', val: sm.count };
            case 'purge_self':
                return { kw: 'purge', val: 0 };
            // Still falling to the generic CONTROL default below, deliberately
            // left unfixed this pass: `rider` (5 live cards) wraps an arbitrary
            // `CardRider` and needs the same field-by-field dispatch
            // `freeKeyword()` already does for the FREE line, not a one-line
            // mapping — a real refactor, not a backfill. `reroll_spent` /
            // `bank_spent_die` (1 card each) are die-gear/card-local kinds with
            // no `KEYWORDS` entry of their own, matching the same exemption
            // `KINDS_WITHOUT_MECHANIC_KEYWORD` already grants them on the
            // mobile badge surface (`axiomancer-mobile/state/combat/
            // __tests__/keywords.test.ts`) — consistent, not a regression.
            default:
                break;
        }
    }

    const ce = card.combatEffects[0];
    if (ce) {
        const eff = lookupEffect(ce.effectId);
        const payload = eff?.payload;
        if (payload?.damageOverTime) {
            return { kw: dotKeyword(ce.effectId), val: ce.intensity ?? 1 };
        }
        if (ce.effectId.includes('mark')) {
            return { kw: 'mark', val: ce.intensity ?? 1 };
        }
        if (ce.effectId.includes('backfire')) {
            return { kw: 'backfire', val: ce.intensity ?? 1 };
        }
        if (eff?.category === 'control') {
            const skip = !!payload?.actionRestriction?.skipTurn;
            return {
                kw: controlKeyword(ce.effectId, skip),
                val: ce.duration ?? eff?.duration ?? 1,
            };
        }
        if (eff?.category === 'regeneration' || payload?.regeneration) {
            return { kw: 'regen', val: ce.intensity ?? 1 };
        }
        if (eff?.category === 'defense') {
            return { kw: 'barrier', val: ce.intensity ?? 1 };
        }
        // stat / advantage / other debuff → treat as soft control on the face.
        return { kw: 'control', val: ce.duration ?? eff?.duration ?? 1 };
    }

    // Spec 32 v3 — the strike is dead: with no mechanic and no effect payload
    // there is no damage number to show.
    if (card.targetType === 'self') return { kw: 'heal_self', val: 0 };
    return { kw: 'control', val: 0 };
}

/** Face keyword + value for the authored FREE (dieless) rider. Every unique
 *  free effect resolves to its own keyword so `KwGlyph` can draw its own
 *  silhouette (owner directive 2026-07-16) — no generic clock fallbacks for
 *  real riders. An applied effect wins first (mirrors the mobile
 *  `freeGlyphMeta` priority). */
function freeKeyword(card: CardDraft): { kw: KeywordId | string; val: number } {
    if (card.cardType === 'oath' || card.cardType === 'hex') {
        // PAID only — no free line exists on persistent cards.
        return { kw: card.cardType === 'oath' ? 'oath' : 'hex', val: 0 };
    }
    const f = card.free;
    if (!f) return { kw: 'control', val: 0 };
    if (f.applyEffect) {
        const id = f.applyEffect.effectId;
        const i = f.applyEffect.intensity ?? 1;
        if (id.includes('mark')) return { kw: 'mark', val: i };
        if (id.includes('bleed') || id.includes('poison')) return { kw: dotKeyword(id), val: i };
        if (id.includes('fester') || id.includes('acid')) return { kw: 'poison', val: i };
        if (id.includes('burn')) return { kw: 'dot', val: i };
        if (id.includes('quarter')) return { kw: 'quarter', val: i };
        if (id.includes('backfire')) return { kw: 'backfire', val: i };
        if (id.includes('doom')) return { kw: 'doom', val: i };
        return { kw: 'control', val: 0 };
    }
    if (f.guard) return { kw: 'guard', val: f.guard };
    if (f.barrier) return { kw: 'barrier', val: f.barrier };
    if (f.healHp) return { kw: 'heal_self', val: f.healHp };
    if (f.drawCards) return { kw: 'draw', val: f.drawCards };
    if (f.tickOne || f.tickAllDots) return { kw: 'tick', val: 0 };
    if (f.cleanse) return { kw: 'cleanse', val: f.cleanse };
    if (f.premises) return { kw: 'premise', val: f.premises };
    if (f.sway) return { kw: 'sway', val: f.sway };
    if (f.souls) return { kw: 'soul', val: f.souls };
    if (f.foretell) return { kw: 'foretell', val: f.foretell };
    if (f.revealStance) return { kw: 'reveal', val: 0 };
    if (f.pips) return { kw: 'pip', val: f.pips };
    if (f.millCards) return { kw: 'mill', val: f.millCards };
    if (f.recoil) return { kw: 'recoil', val: f.recoil };
    if (f.stagger) return { kw: 'stagger', val: f.stagger };
    if (f.refreshDie) return { kw: 'refresh', val: 0 };
    if (f.conviction) return { kw: 'conviction', val: f.conviction };
    return { kw: 'control', val: 0 };
}

/** Derive face-ready fields from any editable card draft. */
export function projectFace(card: CardDraft): FaceCard {
    const die = card.philosophicalAspect; // body | mind | heart | any
    // Spec 32 v3 §4 — rarity derives from the rank ladder (gold is gone).
    const rarity: RarityKey = rankToRarity(card.rank);
    const primary = primaryKeyword(card);
    const free = freeKeyword(card);
    return {
        name: card.name,
        die,
        rarity,
        img: (card as DraftWithImage).img ?? null,
        glyphKw: primary.kw,
        freeKw: free.kw,
        freeVal: free.val,
        paidKw: primary.kw,
        paidVal: primary.val,
    };
}

// ── Category glyph (top-left of the art window, coloured by die) ─────────────
export function KwGlyph({
    id,
    size = 16,
    color = WX.parchment,
}: {
    id: KeywordId | string;
    size?: number;
    color?: string;
}) {
    const s: CSSProperties = { width: size, height: size, display: 'block' };
    const m = (KEYWORDS as Record<string, KeywordMeta>)[id];
    const fam = m ? m.family : 'special';
    switch (id) {
        case 'bleed':
            return (
                <svg viewBox="0 0 24 24" style={s} fill={color}>
                    <path d="M6 4 C4 9 4 12 6 13 C8 12 8 9 6 4Z" />
                    <path d="M12 8 C10 13 10 16 12 17 C14 16 14 13 12 8Z" />
                    <path d="M18 4 C16 9 16 12 18 13 C20 12 20 9 18 4Z" />
                </svg>
            );
        case 'poison':
            return (
                <svg viewBox="0 0 24 24" style={s} fill="none" stroke={color} strokeWidth="1.7" strokeLinejoin="round">
                    <path d="M9 3 H15 V8 L18 18 C18 20 16 21 12 21 C8 21 6 20 6 18 L9 8Z" fill={color} fillOpacity="0.25" />
                    <path d="M9 3 H15" strokeWidth="2" />
                    <circle cx="12" cy="15" r="1.3" fill={color} />
                </svg>
            );
        case 'dot':
        case 'rupture':
            return (
                <svg viewBox="0 0 24 24" style={s} fill={color}>
                    <path d="M12 2 C14 6 18 8 18 13 C18 17 15 21 12 21 C9 21 6 18 6 14 C6 11 8 10 9 8 C10 11 11 10 12 8 C12 6 11 4 12 2Z" />
                </svg>
            );
        case 'stun':
            return (
                <svg viewBox="0 0 24 24" style={s} fill={color}>
                    <path d="M12 1 L14 8 L21 7 L15 12 L21 17 L14 16 L12 23 L10 16 L3 17 L9 12 L3 7 L10 8Z" />
                </svg>
            );
        case 'regen':
        case 'heal_self':
        case 'siphon':
            return (
                <svg viewBox="0 0 24 24" style={s} fill="none" stroke={color} strokeWidth="1.7" strokeLinejoin="round">
                    <path d="M12 21 C5 16 3 12 3 8 A4 4 0 0 1 12 6 A4 4 0 0 1 21 8 C21 12 19 16 12 21Z" fill={color} fillOpacity="0.22" />
                </svg>
            );
        case 'guard':
        case 'barrier':
        case 'riposte':
            return (
                <svg viewBox="0 0 24 24" style={s} fill={color} stroke={color} strokeWidth="1">
                    <path d="M12 2 L21 5 V12 C21 17 17 21 12 22 C7 21 3 17 3 12 V5Z" fillOpacity="0.35" />
                </svg>
            );
        case 'control':
            return (
                <svg viewBox="0 0 24 24" style={s} fill="none" stroke={color} strokeWidth="1.7">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7 V12 L16 14" strokeLinecap="round" />
                </svg>
            );
        // ── Effect-silhouette set (2026-07-16) — keep in sync with the mobile
        // glyphShapes.ts table and the catalog's copy in build-catalog.mjs. ──
        case 'mark':
            // Crosshair — MARK must never read as generic rings (owner 2026-07-16).
            return (
                <svg viewBox="0 0 24 24" style={s} fill={color} fillRule="evenodd">
                    <path d="M12 3.5 A8.5 8.5 0 1 0 12 20.5 A8.5 8.5 0 1 0 12 3.5 Z M12 6 A6 6 0 1 0 12 18 A6 6 0 1 0 12 6 Z M12 9.25 A2.75 2.75 0 1 0 12 14.75 A2.75 2.75 0 1 0 12 9.25 Z M11 0.5 H13 V3 H11 Z M11 21 H13 V23.5 H11 Z M0.5 11 H3 V13 H0.5 Z M21 11 H23.5 V13 H21 Z" />
                </svg>
            );
        case 'reveal':
            return (
                <svg viewBox="0 0 24 24" style={s} fill={color} fillRule="evenodd">
                    <path d="M2 8 C5 6.5 9 6.5 12 8 C15 6.5 19 6.5 22 8 C22 13 19 16.5 15.5 16.5 C13.8 16.5 12.8 15.4 12 14.2 C11.2 15.4 10.2 16.5 8.5 16.5 C5 16.5 2 13 2 8 Z M6.2 10 A1.8 1.8 0 1 0 6.2 13.6 A1.8 1.8 0 1 0 6.2 10 Z M17.8 10 A1.8 1.8 0 1 0 17.8 13.6 A1.8 1.8 0 1 0 17.8 10 Z" />
                </svg>
            );
        case 'cleanse':
            return (
                <svg viewBox="0 0 24 24" style={s} fill={color}>
                    <path d="M12 2 C17 9 19 12 19 15.5 A7 7 0 0 1 5 15.5 C5 12 7 9 12 2 Z" />
                </svg>
            );
        case 'conviction':
            return (
                <svg viewBox="0 0 24 24" style={s} fill={color}>
                    <path d="M12 2 L22 12 L12 22 L2 12 Z" />
                </svg>
            );
        case 'pip':
            return (
                <svg viewBox="0 0 24 24" style={s} fill={color}>
                    <path d="M12 2 L21 7 V17 L12 22 L3 17 V7 Z" />
                </svg>
            );
        case 'mill':
            return (
                <svg viewBox="0 0 24 24" style={s} fill={color}>
                    <path d="M3 6 L11 3 L14 12 L6 15 Z M10 9 H21 V21 H10 Z" />
                </svg>
            );
        case 'recoil':
            return (
                <svg viewBox="0 0 24 24" style={s} fill={color}>
                    <path d="M8 3 H16 V12 H21 L12 22 L3 12 H8 Z" />
                </svg>
            );
        case 'stagger':
            return (
                <svg viewBox="0 0 24 24" style={s} fill={color}>
                    <path d="M4 4 H16 V7 H4 Z M8 10.5 H20 V13.5 H8 Z M4 17 H16 V20 H4 Z" />
                </svg>
            );
        case 'backfire':
            return (
                <svg viewBox="0 0 24 24" style={s} fill={color}>
                    <path d="M14 3 A7 7 0 0 1 14 17 H11 V21 L4 15 L11 9 V13 H14 A3 3 0 0 0 14 7 H8 V3 Z" />
                </svg>
            );
        case 'quarter':
            return (
                <svg viewBox="0 0 24 24" style={s} fill={color}>
                    <path d="M3 4 H21 V16 H12 L7 21 V16 H3 Z" />
                </svg>
            );
        case 'refresh':
            return (
                <svg viewBox="0 0 24 24" style={s} fill={color}>
                    <path d="M12 3 A9 9 0 1 0 21 12 H18.5 A6.5 6.5 0 1 1 12 5.5 L12 9 L18 4.5 L12 0 Z" />
                </svg>
            );
        case 'draw':
            return (
                <svg viewBox="0 0 24 24" style={s} fill={color} fillRule="evenodd">
                    <path d="M7 2 H17 A1.5 1.5 0 0 1 18.5 3.5 V20.5 A1.5 1.5 0 0 1 17 22 H7 A1.5 1.5 0 0 1 5.5 20.5 V3.5 A1.5 1.5 0 0 1 7 2 Z M8 4.5 H16 V11 H8 Z" />
                </svg>
            );
        case 'tick':
            return (
                <svg viewBox="0 0 24 24" style={s} fill={color}>
                    <path d="M6 2 H18 V6 L13.5 12 L18 18 V22 H6 V18 L10.5 12 L6 6 Z" />
                </svg>
            );
        case 'foretell':
            return (
                <svg viewBox="0 0 24 24" style={s} fill={color} fillRule="evenodd">
                    <path d="M12 5.5 C6 5.5 2 12 2 12 C2 12 6 18.5 12 18.5 C18 18.5 22 12 22 12 C22 12 18 5.5 12 5.5 Z M12 8.5 A3.5 3.5 0 1 0 12 15.5 A3.5 3.5 0 1 0 12 8.5 Z" />
                </svg>
            );
        case 'premise':
            return (
                <svg viewBox="0 0 24 24" style={s} fill={color}>
                    <path d="M7 2 H17 V22 L12 17.5 L7 22 Z" />
                </svg>
            );
        case 'soul':
            return (
                <svg viewBox="0 0 24 24" style={s} fill={color}>
                    <path d="M12 2 L14.2 9.8 L22 12 L14.2 14.2 L12 22 L9.8 14.2 L2 12 L9.8 9.8 Z" />
                </svg>
            );
        case 'sway':
            return (
                <svg viewBox="0 0 24 24" style={s} fill={color}>
                    <path d="M2 9 C4.8 5.8 8 5.8 11 8.8 C13.7 11.5 16.3 11.5 19 8.8 L22 10.3 C18.4 14.2 14.3 14.3 11 11 C8.4 8.4 6 8.6 3.6 11.3 Z M2 15 C4.8 11.8 8 11.8 11 14.8 C13.7 17.5 16.3 17.5 19 14.8 L22 16.3 C18.4 20.2 14.3 20.3 11 17 C8.4 14.4 6 14.6 3.6 17.3 Z" />
                </svg>
            );
        case 'forge':
        case 'oath':
            return (
                <svg viewBox="0 0 24 24" style={s} fill={color}>
                    <path d="M12 1 L15 5.5 L12 10 L9 5.5 Z M12 14 L15 18.5 L12 23 L9 18.5 Z M5.5 7.5 L8.5 12 L5.5 16.5 L2.5 12 Z M18.5 7.5 L21.5 12 L18.5 16.5 L15.5 12 Z" />
                </svg>
            );
        case 'doom':
        case 'hex':
            return (
                <svg viewBox="0 0 24 24" style={s} fill={color} fillRule="evenodd">
                    <path d="M12 2 C7.3 2 4 5.4 4 9.4 C4 12.3 5.7 14.5 8 15.6 L8 20 H10.2 L10.2 17.2 H11.2 L11.2 20 H12.8 L12.8 17.2 H13.8 L13.8 20 H16 L16 15.6 C18.3 14.5 20 12.3 20 9.4 C20 5.4 16.7 2 12 2 Z M8.8 8 A2 2 0 1 0 8.8 12 A2 2 0 1 0 8.8 8 Z M15.2 8 A2 2 0 1 0 15.2 12 A2 2 0 1 0 15.2 8 Z" />
                </svg>
            );
        case 'strip_buff':
            return (
                <svg viewBox="0 0 24 24" style={s} fill={color}>
                    <rect x="4" y="13" width="16" height="3.5" />
                    <rect x="6" y="8" width="12" height="3" />
                    <rect x="8" y="4" width="8" height="2.5" />
                </svg>
            );
        case 'damage':
        default:
            if (fam === 'direct')
                return (
                    <svg viewBox="0 0 32 32" style={s} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round">
                        <path d="M22 4 L28 4 L28 10 L13 25 L10 28 L4 28 L4 22 L7 19Z" fill={color} fillOpacity="0.18" />
                    </svg>
                );
            return (
                <svg viewBox="0 0 24 24" style={s} fill={color}>
                    <path d="M12 2 L22 12 L12 22 L2 12Z" />
                </svg>
            );
    }
}

// ── Die pip — small coloured token signalling "costs one die" ────────────────
export function DiePip({ die, size = 16 }: { die: DieKey | 'any'; size?: number }) {
    const d = DIE[die as DieKey] || DIE.body;
    // Phase 104 — a grey card is powered by every die colour, same as wild;
    // its pip shows the wild glyph.
    if (die === 'wild' || die === 'any') {
        return (
            <span
                title={die === 'any' ? 'Any die (grey office)' : 'Wild die'}
                style={{
                    width: size,
                    height: size,
                    borderRadius: 4,
                    display: 'inline-block',
                    flexShrink: 0,
                    background: 'conic-gradient(from 210deg, #d6543f, #d9b44a, #4f7fd6, #9a5fd0, #d6543f)',
                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.45)',
                }}
            />
        );
    }
    return (
        <span
            title={d.label + ' die'}
            style={{
                width: size,
                height: size,
                borderRadius: 4,
                display: 'inline-block',
                flexShrink: 0,
                background: d.color,
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.45), inset 0 0 4px rgba(255,255,255,0.25)',
            }}
        />
    );
}

// ── PAID sentence — the authored bottom-line effect, composed through the real
// engine (toCombatCard) so the editor face never invents wording. ─────────────
function paidSentence(card: CardDraft): string {
    const id = card.id?.trim() || '__preview__';
    try {
        const real = { ...fromDraft(card), id };
        const cc = toCombatCard(id, (q) => (q === id ? real : getCardById(q)), lookupEffect);
        if (!cc) return '';
        let s = cc.bottomActionText || '';
        if (cc.dieLines?.length) {
            const suffix = ' ' + cc.dieLines.join(' · ');
            if (s.endsWith(suffix)) s = s.slice(0, -suffix.length);
        }
        return s
            .replace(/^PAID(\s*\([^)]*\))?\s*—\s*/i, '')
            .replace(/\s*Costs\s+1\s+die\.?\s*$/i, '')
            .trim();
    } catch {
        return '';
    }
}

// Render a sentence with every keyword LABEL bolded + coloured (mirrors the
// mobile OutcomeText). Keywords read as caps in the composed text.
const KW_LABELS = Object.values(KEYWORDS).map((k) => k.label);
function BoldKeywords({ text, color }: { text: string; color: string }): ReactNode {
    const escaped = KW_LABELS.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const upper = new Set(KW_LABELS.map((n) => n.toUpperCase()));
    const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'gi'));
    return (
        <>
            {parts.map((p, i) =>
                upper.has(p.toUpperCase()) ? (
                    <b key={i} style={{ fontFamily: WX.sans, fontWeight: 700, fontSize: '1.12em', letterSpacing: 0.5, textTransform: 'uppercase', color }}>{p}</b>
                ) : (
                    <span key={i}>{p}</span>
                ),
            )}
        </>
    );
}

// ── Stance cube — small isometric die that flags "this line costs one die" ────
export function StanceCube({ color, size = 22 }: { color: string; size?: number }) {
    const mid = `color-mix(in srgb, ${color} 68%, #000)`;
    const dark = `color-mix(in srgb, ${color} 42%, #000)`;
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M12 3 L21 8 L12 13 L3 8Z" fill={color} />
            <path d="M3 8 L12 13 L12 21 L3 16Z" fill={mid} />
            <path d="M21 8 L12 13 L12 21 L21 16Z" fill={dark} />
        </svg>
    );
}

// ── The card FACE — #5 SIDE RAIL layout ──────────────────────────────────────
export function CardFace({
    card,
    width = 200,
    height = 280,
    onArtPick = null,
}: {
    card: CardDraft;
    width?: number;
    height?: number;
    onArtPick?: (() => void) | null;
}) {
    const face = projectFace(card);
    // Phase 104 — a grey card ('any') paints neutral, never the DIE.body
    // fallback a plain lookup miss would otherwise land on.
    const die = face.die === 'any' ? { label: 'ANY', color: WX.bone, soft: 'rgba(138,130,115,0.16)' } : (DIE[face.die] || DIE.body);
    const rar = RARITY[face.rarity] || RARITY.common;
    const band = face.die === 'wild' ? '#d9b44a' : die.color;
    const scale = width / 200;
    const px = (n: number) => Math.round(n * scale * 10) / 10;

    // The stance SPINE carries only the vertical identity (STANCE · TYPE); the
    // FREE effect is the GIANT top-left glyph, the PAID effect the authored
    // sentence at the foot. Skinnier per owner directive 2026-07-16.
    const railW = px(18);
    const railDark = `color-mix(in srgb, ${band} 45%, #000)`;
    // Persistent cards (oath / hex) have no dieless FREE line to badge.
    const persistent = card.cardType === 'oath' || card.cardType === 'hex';
    const typeLabel =
        card.philosophicalAspect.toUpperCase() +
        (card.cardType ? ` · ${card.cardType.toUpperCase()}` : '');
    // ② PAID = the composed sentence; fall back to the terse keyword+value line.
    const paid = paidSentence(card);
    const paidFallback = `${KEYWORDS[face.paidKw] ? KEYWORDS[face.paidKw].label : 'DIE'} ${fmtVal(face.paidKw, face.paidVal)}`.trim();
    // Owner directive 2026-07-16 part 2: the FREE glyph reads BIGGER (~30%).
    const glyphSize = px(72);

    return (
        <div
            style={{
                width,
                height,
                borderRadius: px(7),
                background: WX.panel,
                border: `${rar.border}px solid ${rar.color}`,
                boxShadow: rar.glow
                    ? `0 0 ${rar.glow}px ${rar.color}66, 0 6px 18px rgba(0,0,0,0.6)`
                    : '0 6px 18px rgba(0,0,0,0.55)',
                overflow: 'hidden',
                position: 'relative',
                fontFamily: WX.serif,
            }}
        >
            {/* FULL-BLEED ART — fills the whole face, anchored to the top */}
            <div
                onClick={onArtPick || undefined}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: '#0c0a08',
                    backgroundImage: face.img ? `url(${face.img})` : `${WX_NOISE}, ${ART_STRIPES}`,
                    backgroundSize: face.img ? 'cover' : 'auto',
                    backgroundPosition: 'top center',
                    cursor: onArtPick ? 'pointer' : 'default',
                }}
            >
                {/* die tint wash over the art */}
                <div style={{ position: 'absolute', inset: 0, background: die.color, opacity: 0.17, mixBlendMode: 'soft-light' }} />
            </div>

            {/* SCRIM — dark gradient rising from the bottom so text stays legible */}
            <div
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: '78%',
                    background: `linear-gradient(to top, #06050a 22%, color-mix(in srgb, #06050a 82%, ${band}) 48%, rgba(6,5,4,0.55) 68%, transparent)`,
                    pointerEvents: 'none',
                }}
            />

            {/* placeholder caption when no art */}
            {!face.img && (
                <div
                    style={{
                        position: 'absolute',
                        top: '40%',
                        left: railW,
                        right: 0,
                        textAlign: 'center',
                        fontFamily: WX.mono,
                        fontSize: px(10),
                        letterSpacing: 1,
                        color: 'rgba(232,223,200,0.4)',
                        pointerEvents: 'none',
                    }}
                >
                    {onArtPick ? '+ card art' : 'card art'}
                </div>
            )}

            {/* ④ LEFT RAIL — stance spine carrying only the vertical identity. */}
            <div
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: railW,
                    background: `linear-gradient(${band}, ${railDark})`,
                    borderRight: '1px solid rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                }}
            >
                <div
                    style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                        fontFamily: WX.sans,
                        fontSize: px(9),
                        letterSpacing: px(2),
                        color: 'rgba(255,255,255,0.9)',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {typeLabel}
                </div>
            </div>

            {/* ① FREE effect — the GIANT glyph (what the card does for free) + its
                intensity, top-left just past the rail. */}
            {!persistent && card.free && (
                <div
                    style={{
                        position: 'absolute',
                        left: px(5),
                        top: px(5),
                        width: glyphSize,
                        height: glyphSize,
                        zIndex: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundImage: 'radial-gradient(circle at 48% 46%, rgba(6,5,10,0.82) 40%, rgba(6,5,10,0) 72%)',
                        filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.85))',
                    }}
                >
                    <KwGlyph id={face.freeKw} size={glyphSize} color={band} />
                    {face.freeVal ? (
                        <span
                            style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontFamily: WX.mono,
                                fontSize: px(14),
                                fontWeight: 700,
                                color: '#fff',
                                textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.9)',
                            }}
                        >
                            +{face.freeVal}
                        </span>
                    ) : null}
                </div>
            )}

            {/* rarity tag, top-right corner (kept per owner call) */}
            <div
                style={{
                    position: 'absolute',
                    top: px(6),
                    right: px(6),
                    zIndex: 2,
                    fontFamily: WX.sans,
                    fontSize: px(9),
                    letterSpacing: 1,
                    color: rar.color,
                    background: 'rgba(8,7,6,0.7)',
                    padding: `${px(1)}px ${px(5)}px`,
                    border: `1px solid ${rar.color}88`,
                }}
            >
                {rar.label}
            </div>

            {/* BOTTOM-ANCHORED content — right of the rail; rises as text grows */}
            <div style={{ position: 'absolute', left: railW + px(10), right: px(12), bottom: px(12), zIndex: 2 }}>
                <div
                    style={{
                        fontFamily: WX.gothic,
                        fontSize: px(24),
                        lineHeight: 1.02,
                        color: WX.parchment,
                        textShadow: '0 2px 6px #000',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {rar.star ? '★ ' : ''}
                    {face.name || 'Untitled'}
                </div>
                <div style={{ height: 1, background: 'rgba(232,223,200,0.22)', margin: `${px(9)}px 0` }} />
                {/* ② PAID effect — the die cube + the authored sentence, keyword bold. */}
                <div style={{ display: 'flex', gap: px(8), alignItems: 'flex-start' }}>
                    <StanceCube color={band} size={px(20)} />
                    <div style={{ fontFamily: WX.serif, fontSize: px(13), lineHeight: 1.35, color: WX.parchment }}>
                        <BoldKeywords text={paid || paidFallback} color={band} />
                    </div>
                </div>
            </div>
        </div>
    );
}
