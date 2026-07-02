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
import type { CSSProperties } from 'react';
import type { CardDraft } from '../types';
import { isGold, lookupEffect } from '../data/mechanics';
import {
    WX,
    DIE,
    RARITY,
    WX_NOISE,
    ART_STRIPES,
    KEYWORDS,
    fmtVal,
    kwLine,
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
    die: DieKey;
    rarity: RarityKey;
    img: string | null;
    /** Keyword that drives the top-left glyph. */
    glyphKw: KeywordId;
    freeKw: KeywordId;
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
    if (skipTurn || effectId.includes('stun')) return 'stun';
    if (effectId.includes('slow')) return 'slow';
    if (effectId.includes('confus')) return 'confusion';
    if (effectId.includes('silence')) return 'silence';
    return 'control';
}

/** Best-effort: the card's signature keyword + its representative value. */
function primaryKeyword(card: CardDraft): { kw: KeywordId; val: number } {
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
            case 'compound':
                return { kw: 'compound', val: sm.perDebuff };
            case 'siphon':
                return { kw: 'siphon', val: sm.pct };
            case 'execute':
                return { kw: 'execute', val: 0 };
            case 'strip_random_buff':
            case 'convert_enemy_buff_to_self':
                return { kw: 'strip_buff', val: 0 };
            case 'secondary_heal_self':
                return { kw: 'heal_self', val: 0 };
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

    if (card.targetType === 'self') return { kw: 'heal_self', val: card.basePower };
    return { kw: 'damage', val: card.basePower };
}

/** Derive face-ready fields from any editable card draft. */
export function projectFace(card: CardDraft): FaceCard {
    const die = card.philosophicalAspect as DieKey; // body | mind | heart
    const rarity: RarityKey = isGold(card.id) ? 'gold' : 'common';
    const primary = primaryKeyword(card);
    const free: { kw: KeywordId; val: number } =
        card.targetType === 'self'
            ? { kw: 'heal_self', val: card.basePower }
            : { kw: 'damage', val: card.basePower };
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
        case 'execute':
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
        case 'slow':
        case 'confusion':
        case 'silence':
        case 'control':
            return (
                <svg viewBox="0 0 24 24" style={s} fill="none" stroke={color} strokeWidth="1.7">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7 V12 L16 14" strokeLinecap="round" />
                </svg>
            );
        case 'compound':
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
export function DiePip({ die, size = 16 }: { die: DieKey; size?: number }) {
    const d = DIE[die] || DIE.body;
    if (die === 'wild') {
        return (
            <span
                title="Wild die"
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

// ── The card FACE ────────────────────────────────────────────────────────────
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
    const die = DIE[face.die] || DIE.body;
    const rar = RARITY[face.rarity] || RARITY.common;
    const band = face.die === 'wild' ? '#d9b44a' : die.color;
    const scale = width / 200;
    const px = (n: number) => Math.round(n * scale * 10) / 10;

    return (
        <div
            style={{
                width,
                height,
                borderRadius: px(7),
                background: WX.panel,
                backgroundImage: WX_NOISE,
                border: `${rar.border}px solid ${rar.color}`,
                boxShadow: rar.glow
                    ? `0 0 ${rar.glow}px ${rar.color}66, 0 6px 18px rgba(0,0,0,0.6)`
                    : '0 6px 18px rgba(0,0,0,0.55)',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: WX.serif,
            }}
        >
            {/* ART WINDOW */}
            <div
                onClick={onArtPick || undefined}
                style={{
                    height: '58%',
                    position: 'relative',
                    background: '#0c0a08',
                    backgroundImage: face.img ? `url(${face.img})` : ART_STRIPES,
                    backgroundSize: face.img ? 'cover' : 'auto',
                    backgroundPosition: 'center',
                    cursor: onArtPick ? 'pointer' : 'default',
                }}
            >
                {/* die tint overlay */}
                <div style={{ position: 'absolute', inset: 0, background: die.color, opacity: 0.16, mixBlendMode: 'soft-light' }} />
                {/* category glyph, top-left */}
                <div style={{ position: 'absolute', top: px(6), left: px(7), filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))' }}>
                    <KwGlyph id={face.glyphKw} size={px(20)} color={face.die === 'wild' ? '#d9b44a' : die.color} />
                </div>
                {/* rarity tag, top-right */}
                <div
                    style={{
                        position: 'absolute',
                        top: px(6),
                        right: px(6),
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
                {/* placeholder caption when no art */}
                {!face.img && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: WX.mono,
                            fontSize: px(10),
                            letterSpacing: 1,
                            color: 'rgba(232,223,200,0.4)',
                            textAlign: 'center',
                        }}
                    >
                        {onArtPick ? '+ card art' : 'card art'}
                    </div>
                )}
            </div>

            {/* NAME band */}
            <div
                style={{
                    background: band,
                    padding: `${px(3)}px ${px(5)}px`,
                    textAlign: 'center',
                    borderTop: '1px solid rgba(255,255,255,0.28)',
                    borderBottom: '1px solid rgba(0,0,0,0.45)',
                }}
            >
                <div
                    style={{
                        fontFamily: WX.gothic,
                        fontSize: px(18),
                        lineHeight: 1.05,
                        color: '#100d0a',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {rar.star ? '★ ' : ''}
                    {face.name || 'Untitled'}
                </div>
            </div>

            {/* FREE | PAID footer */}
            <div style={{ flex: 1, display: 'flex', background: 'rgba(10,8,6,0.62)' }}>
                {/* FREE col */}
                <div style={{ flex: 1, padding: `${px(6)}px ${px(7)}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: px(2) }}>
                    <div style={{ fontFamily: WX.sans, fontSize: px(9), letterSpacing: 1, color: WX.bone }}>◇ FREE</div>
                    <div style={{ fontFamily: WX.mono, fontSize: px(12), lineHeight: 1.15, color: WX.parchment }}>
                        {kwLine(face.freeKw, face.freeVal)}
                    </div>
                </div>
                <div style={{ width: 1, background: 'rgba(255,255,255,0.14)', margin: `${px(6)}px 0` }} />
                {/* PAID col */}
                <div style={{ flex: 1, padding: `${px(6)}px ${px(7)}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: px(2) }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: px(4) }}>
                        <DiePip die={face.die} size={px(13)} />
                        <span style={{ fontFamily: WX.sans, fontSize: px(10), letterSpacing: 0.6, color: band }}>
                            ◆ {KEYWORDS[face.paidKw] ? KEYWORDS[face.paidKw].label : 'DIE'}
                        </span>
                    </div>
                    <div style={{ fontFamily: WX.mono, fontSize: px(15), lineHeight: 1.1, color: band }}>
                        {fmtVal(face.paidKw, face.paidVal) || '—'}
                    </div>
                </div>
            </div>
        </div>
    );
}
