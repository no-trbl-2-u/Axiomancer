/**
 * Gathering plot card — mossy parchment stock tinted to the plot's
 * material family, with the yield (richness pips) and the wrath price
 * face-up. Three render modes:
 *
 *  spread — on the board, tappable (104×136)
 *  detail — the tap-to-read view (234×320)
 *  preview — approach-select fan, non-interactive (88×116)
 *
 * Pure presentational: every number comes in on the VM (the presenter
 * already applied stance / dusk / watcher modifiers).
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { GatherPlotVM } from '@/state/presenters/gathering.engine';
import { FONTS } from '@/theme/axm';
import { usePalette } from '@/theme/runtime';

import { FamilyGlyph, RichnessPips, TraitGlyph, WrathEye } from './glyphs';
import { CARD_EDGE, CARD_INK, CARD_INK2, FAMILY, PLOT_PAPER, TRAIT_UI } from './palette';

export type PlotCardMode = 'spread' | 'detail' | 'preview';

/** Family medallion. */
export const PlotArt = React.memo(function PlotArt({
    family,
    size = 40,
}: {
    family: GatherPlotVM['family'];
    size?: number;
}) {
    const c = FAMILY[family];
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
            <FamilyGlyph kind={c.glyph} size={size * 0.62} color={c.c} />
        </View>
    );
});

/** The wrath price chip: the eye + the cost (or relief for breaths). */
function WrathChip({ cost, size = 12, isBreath }: { cost: number; size?: number; isBreath: boolean }) {
    const AXM = usePalette();
    const relief = cost < 0;
    const color = relief ? '#5b86c4' : cost === 0 ? CARD_INK2 : AXM.blood;
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <WrathEye open={relief || cost === 0 ? 0.1 : Math.min(1, cost / 4)} size={size + 4} color={color} />
            <Text style={{ fontFamily: FONTS.gothic, fontSize: size + 4, lineHeight: size + 5, color }}>
                {relief ? `${cost}` : cost === 0 ? 'free' : `+${cost}`}
            </Text>
            {isBreath && relief && (
                <Text style={{ fontFamily: FONTS.sans, fontSize: Math.max(10, size - 1), letterSpacing: 0.5, color }}>WRATH</Text>
            )}
        </View>
    );
}

export const PlotCard = React.memo(function PlotCard({
    plot,
    mode = 'spread',
}: {
    plot: GatherPlotVM;
    mode?: PlotCardMode;
}) {
    const AXM = usePalette();
    const c = FAMILY[plot.family];
    const trait = plot.trait ? TRAIT_UI[plot.trait] : null;
    const W = mode === 'detail' ? 234 : mode === 'preview' ? 88 : 104;
    const H = mode === 'detail' ? 320 : mode === 'preview' ? 116 : 136;

    const frame = [
        styles.frame,
        {
            width: W,
            height: H,
            borderColor: c.c,
            shadowColor: '#000',
            shadowOpacity: 0.5,
            shadowRadius: 5,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
        },
    ];

    const overlays = (
        <>
            <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: `${c.c}1c` }]} />
            <View pointerEvents="none" style={[styles.edgeStripe, { backgroundColor: c.c }]} />
        </>
    );

    if (mode === 'detail') {
        return (
            <View style={frame}>
                {overlays}
                <View style={{ alignItems: 'center', paddingTop: 12, paddingHorizontal: 14 }}>
                    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
                        <Text style={[styles.tag, { color: '#fff', backgroundColor: c.c }]}>{plot.familyLabel}</Text>
                        {trait && plot.trait && (
                            <View style={[styles.traitTag, { borderColor: trait.c }]}>
                                <TraitGlyph kind={plot.trait} size={10} color={trait.c} />
                                <Text style={[styles.traitTagText, { color: trait.c }]}>{trait.label}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.detailName}>{plot.name}</Text>
                    <View style={{ marginVertical: 10 }}>
                        <PlotArt family={plot.family} size={64} />
                    </View>
                </View>
                <View style={{ paddingHorizontal: 14 }}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailRowLabel}>YIELD</Text>
                        {plot.isBreath ? (
                            <Text style={styles.detailRowValue}>nothing — you tend, not take</Text>
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                <RichnessPips count={plot.yieldRichness} size={10} color={c.dark} />
                                <Text style={styles.detailRowValue}>
                                    {plot.yieldRichness} {plot.familyLabel}
                                </Text>
                            </View>
                        )}
                    </View>
                    <View style={[styles.detailRow, { borderColor: plot.wrathCost > 0 ? AXM.blood : CARD_EDGE }]}>
                        <Text style={styles.detailRowLabel}>PRICE</Text>
                        <WrathChip cost={plot.wrathCost} isBreath={plot.isBreath} size={13} />
                    </View>
                    <Text style={styles.detailFlavor}>“{plot.flavor}”</Text>
                </View>
            </View>
        );
    }

    const compact = mode === 'preview';
    return (
        <View style={frame}>
            {overlays}
            <Text numberOfLines={2} style={[styles.name, { fontSize: compact ? 12 : 13, minHeight: compact ? 26 : 28 }]}>
                {plot.name}
            </Text>
            <View style={{ alignItems: 'center', marginVertical: compact ? 2 : 4 }}>
                <PlotArt family={plot.family} size={compact ? 26 : 34} />
            </View>
            <View style={styles.rowsBox}>
                <View style={styles.yieldRow}>
                    {plot.isBreath ? (
                        <Text style={[styles.breathText]}>TEND</Text>
                    ) : (
                        <RichnessPips count={plot.yieldRichness} size={compact ? 8 : 10} color={c.dark} />
                    )}
                    <Text style={[styles.familyMini, { color: c.dark }]}>{plot.isBreath ? '' : plot.familyLabel}</Text>
                </View>
                <View style={[styles.priceRow, { borderTopColor: `${c.c}66` }]}>
                    <WrathChip cost={plot.wrathCost} isBreath={plot.isBreath} size={compact ? 9 : 11} />
                </View>
            </View>
            {trait && plot.trait && (
                <View pointerEvents="none" style={[styles.traitCorner, { backgroundColor: trait.c }]}>
                    <TraitGlyph kind={plot.trait} size={9} color="#0c0a08" />
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    frame: {
        backgroundColor: PLOT_PAPER,
        borderWidth: 1.5,
        overflow: 'hidden',
        paddingHorizontal: 5,
        paddingTop: 5,
        paddingBottom: 5,
    },
    edgeStripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
    name: {
        fontFamily: FONTS.gothic,
        color: CARD_INK,
        letterSpacing: 0.2,
        textAlign: 'center',
        lineHeight: 13,
    },
    rowsBox: { marginTop: 'auto', borderWidth: 1, borderColor: CARD_EDGE },
    yieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 3,
        paddingHorizontal: 5,
        backgroundColor: 'rgba(255,255,255,0.08)',
        minHeight: 18,
    },
    familyMini: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 0.8 },
    breathText: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1.4, color: '#34527a' },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 2,
        borderTopWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    traitCorner: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 14,
        height: 14,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: '45deg' }],
    },
    tag: {
        fontFamily: FONTS.sans,
        fontSize: 11,
        letterSpacing: 1.5,
        paddingHorizontal: 7,
        paddingVertical: 1,
        overflow: 'hidden',
    },
    traitTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        borderWidth: 1,
        paddingHorizontal: 6,
        paddingVertical: 1,
    },
    traitTagText: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.5 },
    detailName: {
        fontFamily: FONTS.gothic,
        fontSize: 22,
        lineHeight: 23,
        letterSpacing: 0.5,
        color: CARD_INK,
        textAlign: 'center',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: CARD_EDGE,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 7,
        paddingHorizontal: 9,
        marginBottom: 6,
    },
    detailRowLabel: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1.2, color: CARD_INK2 },
    detailRowValue: { fontFamily: FONTS.serif, fontSize: 14, color: CARD_INK },
    detailFlavor: {
        fontFamily: FONTS.serifItalic,
        fontStyle: 'italic',
        fontSize: 13,
        color: CARD_INK2,
        marginTop: 8,
        lineHeight: 15,
        textAlign: 'center',
    },
});
