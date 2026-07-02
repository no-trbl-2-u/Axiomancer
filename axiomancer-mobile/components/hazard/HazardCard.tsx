/**
 * Hazard action card — parchment stock tinted to the card's colour
 * (red / blue / purple / gold), with a FREE (top) row and a MANA /
 * SURGE (bottom) row. Four render modes:
 *
 *  hand   — compact, docked in the fan (90×136)
 *  play   — staged in the play area, shrunk (70×112)
 *  detail — the tap-to-read view (234×330)
 *  offer  — rewards-modal pick (96 wide)
 *
 * Pure presentational: all affordability comes in on the VM.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { HazardCardVM } from '@/state/presenters/hazard.engine';
import { FONTS } from '@/theme/axm';

import { DieGlyph, ProgGlyph } from './glyphs';
import { CARD_EDGE, CARD_INK, CARD_INK2, CARD_PAPER, DIE, RARITY_UI, TYPE_INK } from './palette';

export type HazardCardMode = 'hand' | 'play' | 'detail' | 'offer';

// ---------------------------------------------------------------------------
// Small parts
// ---------------------------------------------------------------------------

/** Colour medallion with the card colour's glyph. */
export const CardArt = React.memo(function CardArt({ kind, size = 40 }: { kind: HazardCardVM['kind']; size?: number }) {
    const c = DIE[kind];
    return (
        <View
            style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: 1.5,
                borderColor: c.c,
                backgroundColor: `${c.c}2e`,
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <DieGlyph kind={c.glyph} size={size * 0.6} color={c.c} />
        </View>
    );
});

/** The mana socket — where the matching-colour die lands. */
function ManaSocket({
    kind,
    filled,
    size = 18,
    pulse = false,
}: {
    kind: HazardCardVM['kind'];
    filled: boolean;
    size?: number;
    pulse?: boolean;
}) {
    const c = DIE[kind];
    return (
        <View
            style={{
                width: size,
                height: size,
                borderWidth: 1.5,
                borderStyle: filled ? 'solid' : 'dashed',
                borderColor: c.c,
                backgroundColor: filled ? c.bg : 'rgba(0,0,0,0.16)',
                alignItems: 'center',
                justifyContent: 'center',
                ...(pulse && !filled ? { shadowColor: c.c, shadowOpacity: 0.9, shadowRadius: 4, elevation: 3 } : {}),
            }}
        >
            {filled ? (
                <DieGlyph kind={c.glyph} size={size - 7} color={c.c} />
            ) : (
                <Text style={{ fontFamily: FONTS.mono, fontSize: size * 0.5, color: c.c, opacity: 0.75, lineHeight: size * 0.62 }}>+</Text>
            )}
        </View>
    );
}

/** FORCE / ESCAPE number pair (zeros dimmed). */
function StatPair({
    force,
    escape,
    size = 12,
    gap = 8,
}: {
    force: number;
    escape: number;
    size?: number;
    gap?: number;
}) {
    const item = (kind: 'force' | 'escape', val: number) => (
        <View key={kind} style={{ flexDirection: 'row', alignItems: 'center', gap: 2, opacity: val > 0 ? 1 : 0.3 }}>
            <ProgGlyph kind={kind} size={size} color={TYPE_INK[kind]} />
            <Text style={{ fontFamily: FONTS.gothic, fontSize: size + 4, lineHeight: size + 5, color: TYPE_INK[kind] }}>{val}</Text>
        </View>
    );
    return <View style={{ flexDirection: 'row', gap }}>{[item('force', force), item('escape', escape)]}</View>;
}

/** A FREE/MANA row used by hand + play modes. Hybrid cards (purple/gold)
 *  show BOTH their numbers and a compact utility tag. */
function Row({
    card,
    bottom,
    compact,
}: {
    card: HazardCardVM;
    bottom?: boolean;
    compact?: boolean;
}) {
    const c = DIE[card.kind];
    const powered = card.poweredByDieId !== null;
    const active = bottom ? powered : !powered;
    const effectLabel = bottom ? card.poweredEffectLabel : card.freeEffectLabel;
    return (
        <View
            style={{
                paddingVertical: compact ? 2 : 3,
                paddingHorizontal: compact ? 4 : 6,
                backgroundColor: bottom ? `${c.c}22` : 'rgba(255,255,255,0.07)',
                borderTopWidth: bottom ? 1 : 0,
                borderTopColor: `${c.c}77`,
                opacity: active ? 1 : 0.5,
            }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                <StatPair
                    force={bottom ? card.powered.force : card.free.force}
                    escape={bottom ? card.powered.escape : card.free.escape}
                    size={compact ? 10 : 12}
                    gap={compact ? 5 : 8}
                />
                {bottom ? (
                    <ManaSocket kind={card.kind} filled={powered} size={compact ? 15 : 17} pulse={!powered && card.dieAvailable} />
                ) : (
                    <Text style={{ fontFamily: FONTS.sans, fontSize: compact ? 10 : 11, letterSpacing: 1, color: CARD_INK2 }}>FREE</Text>
                )}
            </View>
            {card.utility && effectLabel !== null && (
                <Text
                    numberOfLines={1}
                    style={{ fontFamily: FONTS.sans, fontSize: compact ? 10 : 11, letterSpacing: 0.4, color: bottom ? c.dark : CARD_INK, marginTop: 1 }}
                >
                    ⬡ {effectLabel}
                </Text>
            )}
        </View>
    );
}

// ---------------------------------------------------------------------------
// The card
// ---------------------------------------------------------------------------

export const HazardCard = React.memo(function HazardCard({
    card,
    mode = 'hand',
    dragging = false,
}: {
    card: HazardCardVM;
    mode?: HazardCardMode;
    dragging?: boolean;
}) {
    const c = DIE[card.kind];
    const rar = RARITY_UI[card.rarity];
    const powered = card.poweredByDieId !== null;
    // Two-tone cards can be powered by either of two colours — surface both.
    const powerLabel =
        card.powerColors.length > 1
            ? card.powerColors.map((k) => DIE[k].label).join(' / ')
            : DIE[card.kind].label;
    const W = mode === 'detail' ? 234 : mode === 'play' ? 70 : mode === 'offer' ? 96 : 90;
    const H = mode === 'detail' ? 330 : mode === 'play' ? 112 : mode === 'offer' ? 132 : 136;

    const frame = [
        styles.frame,
        {
            width: W,
            height: H,
            borderColor: c.c,
            shadowColor: dragging || powered ? c.c : '#000',
            shadowOpacity: dragging ? 0.9 : powered ? 0.6 : 0.5,
            shadowRadius: dragging ? 14 : powered ? 8 : 5,
            shadowOffset: { width: 0, height: dragging ? 10 : 4 },
            elevation: dragging ? 12 : 4,
            transform: dragging ? [{ scale: 1.05 }] : [],
            opacity: card.dead ? 0.82 : 1,
        },
    ];

    const overlays = (
        <>
            <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: `${c.c}1c` }]} />
            <View pointerEvents="none" style={[styles.edgeStripe, { backgroundColor: c.c }]} />
            {card.rarity === 'rare' && (
                <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { borderWidth: 4, borderColor: `${c.c}33` }]} />
            )}
        </>
    );

    if (mode === 'play') {
        return (
            <View style={frame}>
                {overlays}
                <Text numberOfLines={2} style={[styles.name, { fontSize: 12, lineHeight: 13, minHeight: 26 }]}>{card.name}</Text>
                <View style={{ alignItems: 'center', marginVertical: 2 }}>
                    <CardArt kind={card.kind} size={20} />
                </View>
                <View style={[styles.rowsBox]}>
                    <Row card={card} compact />
                    <Row card={card} bottom compact />
                </View>
                {card.applied && (
                    <View pointerEvents="none" style={styles.appliedVeil}>
                        <Text style={styles.appliedTag}>✓ LOCKED</Text>
                    </View>
                )}
            </View>
        );
    }

    if (mode === 'detail') {
        const section = (bottom: boolean) => (
            <View
                key={bottom ? 'b' : 't'}
                style={{
                    borderWidth: 1.5,
                    borderColor: bottom ? c.c : CARD_EDGE,
                    backgroundColor: bottom ? `${c.c}1a` : 'rgba(255,255,255,0.1)',
                    paddingVertical: 7,
                    paddingHorizontal: 9,
                    marginBottom: bottom ? 0 : 6,
                }}
            >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <StatPair
                            force={bottom ? card.powered.force : card.free.force}
                            escape={bottom ? card.powered.escape : card.free.escape}
                            size={14}
                        />
                        {card.utility && (
                            <Text style={{ fontFamily: FONTS.gothic, fontSize: 15, color: bottom ? c.dark : CARD_INK }}>
                                ⬡ {bottom ? card.poweredEffectLabel : card.freeEffectLabel}
                            </Text>
                        )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1.2, color: bottom ? c.dark : CARD_INK2 }}>
                            {bottom ? 'MANA' : 'FREE'}
                        </Text>
                        {bottom && <ManaSocket kind={card.kind} filled={powered} size={18} />}
                    </View>
                </View>
                <Text style={{ fontFamily: FONTS.serif, fontSize: 14, color: CARD_INK, lineHeight: 17, marginTop: 3 }}>
                    {card.dead
                        ? 'Dead weight. It does nothing, and nothing can power it.'
                        : bottom
                          ? `SURGE — spend a ${powerLabel} die ${card.utility ? 'for the stronger effect.' : 'for these values.'}`
                          : card.utility
                            ? 'Play free — no die needed.'
                            : 'Gain these — always available.'}
                </Text>
            </View>
        );
        return (
            <View style={frame}>
                {overlays}
                <View style={{ alignItems: 'center', paddingTop: 11, paddingHorizontal: 14 }}>
                    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
                        <Text style={{ fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.5, color: '#fff', backgroundColor: rar.c, paddingHorizontal: 7, paddingVertical: 1 }}>
                            {rar.label}
                        </Text>
                        <Text style={{ fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.5, color: c.dark, borderWidth: 1, borderColor: c.c, paddingHorizontal: 7, paddingVertical: 1 }}>
                            {powerLabel}
                        </Text>
                    </View>
                    <Text style={{ fontFamily: FONTS.gothic, fontSize: 22, lineHeight: 23, letterSpacing: 0.5, color: CARD_INK, textAlign: 'center' }}>
                        {card.name}
                    </Text>
                    <View style={{ marginVertical: 9 }}>
                        <CardArt kind={card.kind} size={66} />
                    </View>
                </View>
                <View style={{ paddingHorizontal: 14 }}>
                    {section(false)}
                    {section(true)}
                    {card.salvageLabel !== null && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 6, paddingVertical: 4, borderWidth: 1, borderStyle: 'dashed', borderColor: CARD_EDGE }}>
                            <Text style={{ fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.2, color: CARD_INK2 }}>SALVAGE</Text>
                            <Text style={{ fontFamily: FONTS.serif, fontSize: 13, color: CARD_INK }}>
                                scrap for {card.salvageLabel}
                            </Text>
                        </View>
                    )}
                    {card.keywords.filter(kw => kw.id !== 'salvage').length > 0 && (
                        <View style={{ marginTop: 8, gap: 4 }}>
                            {card.keywords.filter(kw => kw.id !== 'salvage').map(kw => (
                                <View key={kw.id} style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
                                    <Text style={{ fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 1.2, color: CARD_INK2, minWidth: 64, paddingTop: 1 }}>{kw.name}</Text>
                                    <Text style={{ fontFamily: FONTS.serif, fontSize: 11, color: CARD_INK, flex: 1, lineHeight: 14 }}>{kw.desc}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                    <Text style={{ fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 13, color: CARD_INK2, marginTop: 8, lineHeight: 17, textAlign: 'center' }}>
                        “{card.flavor}”
                    </Text>
                </View>
            </View>
        );
    }

    if (mode === 'offer') {
        return (
            <View style={[frame, { paddingBottom: 6 }]}>
                <Text style={{ fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.5, color: '#0a0a0a', backgroundColor: rar.c, textAlign: 'center', paddingVertical: 2 }}>
                    {rar.label}
                </Text>
                <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: `${c.c}1c` }]} />
                <Text numberOfLines={2} style={[styles.name, { fontSize: 14, lineHeight: 15, minHeight: 30, paddingTop: 4 }]}>{card.name}</Text>
                <View style={{ alignItems: 'center', marginVertical: 4 }}>
                    <CardArt kind={card.kind} size={42} />
                </View>
                <View style={{ alignItems: 'center', paddingBottom: 2 }}>
                    {card.utility ? (
                        <Text style={{ fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 0.6, color: c.dark }}>{card.freeEffectLabel}</Text>
                    ) : (
                        <StatPair force={card.powered.force} escape={card.powered.escape} size={11} />
                    )}
                </View>
            </View>
        );
    }

    // hand mode
    return (
        <View style={frame}>
            {overlays}
            <Text numberOfLines={2} style={[styles.name, { fontSize: 13, minHeight: 28 }]}>{card.name}</Text>
            <View style={{ alignItems: 'center', marginVertical: 3 }}>
                <CardArt kind={card.kind} size={30} />
            </View>
            <View style={styles.rowsBox}>
                <Row card={card} />
                <Row card={card} bottom />
            </View>
            {/* rarity corner pip */}
            <View
                pointerEvents="none"
                style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, backgroundColor: rar.c, transform: [{ rotate: '45deg' }] }}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    frame: {
        backgroundColor: CARD_PAPER,
        borderWidth: 1.5,
        overflow: 'hidden',
        paddingHorizontal: 4,
        paddingTop: 4,
        paddingBottom: 4,
    },
    edgeStripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
    name: {
        fontFamily: FONTS.gothic,
        color: CARD_INK,
        letterSpacing: 0.2,
        textAlign: 'center',
        lineHeight: 14,
    },
    rowsBox: { marginTop: 'auto', borderWidth: 1, borderColor: CARD_EDGE },
    appliedVeil: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 3,
        backgroundColor: 'rgba(134,168,33,0.16)',
    },
    appliedTag: {
        fontFamily: FONTS.sans,
        fontSize: 10,
        letterSpacing: 1,
        color: '#0c0a08',
        backgroundColor: '#86a821',
        paddingHorizontal: 4,
        paddingVertical: 1,
        overflow: 'hidden',
    },
});
