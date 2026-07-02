/**
 * /cache — the Loot-cache encounter screen ("The Reliquary").
 *
 * Three layers, sealed trap fates, one probe, push-your-luck. All
 * rules live in `axiomancer-mechanics` (World/LootCache); this screen
 * renders the presenter VM (which is also the hidden-information leak
 * boundary) and dispatches store actions only.
 */

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { ScreenBg } from '@/components/ScreenBg';
import { useGameActions, useGameState } from '@/state/GameStoreProvider';
import { selectCacheVM, type CacheLayerVM } from '@/state/presenters/cache.engine';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

function LayerCard({ layer }: { layer: CacheLayerVM }) {
    const styles = useStyles();
    const AXM = usePalette();
    const READING_CHROME: Record<CacheLayerVM['reading'], { label: string; color: string }> = {
        sealed: { label: 'SEALED',          color: AXM.bone },
        live:   { label: 'TRAP — LIVE',     color: AXM.blood },
        dud:    { label: 'TRAP — DEAD',     color: AXM.heal },
        clean:  { label: 'LIFTED CLEAN',    color: AXM.heal },
        sprung: { label: 'SPRUNG',          color: AXM.blood },
    };
    const chrome = READING_CHROME[layer.reading];
    return (
        <View
            style={[
                styles.layer,
                layer.isNext && { borderColor: AXM.sulfur },
                layer.opened && { opacity: 0.75 },
            ]}
            testID={`cache-layer-${layer.index}`}
        >
            <View style={styles.layerHead}>
                <Text style={styles.layerName}>{layer.name}</Text>
                <Text style={[styles.layerReading, { color: chrome.color }]}>{chrome.label}</Text>
            </View>
            <Text style={styles.layerFlavor}>{layer.flavor}</Text>
            {layer.lootSummary !== null && (
                <Text style={styles.layerLoot} testID={`cache-layer-${layer.index}-loot`}>
                    {layer.lootSummary}
                </Text>
            )}
        </View>
    );
}

export default function CacheScreen() {
    const styles = useStyles();
    const AXM = usePalette();
    const slice = useGameState((s) => s.cache);
    const vm = useMemo(() => selectCacheVM({ cache: slice }), [slice]);
    const actions = useGameActions();
    const router = useRouter();

    useEffect(() => {
        if (!vm.active && router.canGoBack()) router.back();
    }, [vm.active, router]);

    if (!vm.active) return <ScreenBg><View /></ScreenBg>;

    return (
        <ScreenBg scrollable={false}>
            <ScrollView style={styles.scrollOuter} contentContainerStyle={styles.scroll}>
                <Text style={styles.eyebrow}>THE RELIQUARY</Text>
                <Text style={styles.title}>A CACHE, LONG UNCLAIMED</Text>

                {vm.phase === 'intro' && (
                    <View testID="cache-intro">
                        <Text style={styles.body}>
                            Half-buried and patient, the way hidden things are. Whoever
                            packed it meant to come back; whoever trapped it meant the
                            opposite. Three layers, one knife, and no one watching.
                        </Text>
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Kneel and begin"
                            onPress={actions.startLootCacheDelving}
                            style={styles.bigButton}
                            testID="cache-begin"
                        >
                            <Text style={styles.bigButtonText}>KNEEL AND BEGIN</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Layer stack — always visible once delving */}
                {vm.phase !== 'intro' && (
                    <View style={styles.layers} testID="cache-layers">
                        {vm.layers.map(layer => <LayerCard key={layer.index} layer={layer} />)}
                    </View>
                )}

                {/* Decisions */}
                {vm.phase === 'delving' && (
                    <View style={styles.decisions} testID="cache-decisions">
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Delve into the next layer"
                            accessibilityState={{ disabled: !vm.canDelve }}
                            disabled={!vm.canDelve}
                            onPress={actions.delveLootCache}
                            style={[styles.bigButton, !vm.canDelve && styles.disabled]}
                            testID="cache-delve"
                        >
                            <Text style={styles.bigButtonText}>DELVE DEEPER</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Probe the next layer for traps"
                            accessibilityState={{ disabled: !vm.canProbe }}
                            disabled={!vm.canProbe}
                            onPress={actions.probeLootCache}
                            style={[styles.smallButton, !vm.canProbe && styles.disabled]}
                            testID="cache-probe"
                        >
                            <Text style={styles.smallButtonText}>
                                {vm.probeUsed ? 'THE KNIFE IS SPENT' : 'RUN THE KNIFE ALONG THE SEAM'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Seal the cache and walk away"
                            onPress={actions.sealLootCache}
                            style={styles.smallButton}
                            testID="cache-seal"
                        >
                            <Text style={styles.smallButtonText}>TAKE WHAT&apos;S LIFTED AND GO</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Result card */}
                {vm.phase === 'card' && vm.card !== null && (
                    <View
                        style={[styles.card, vm.card.slammed && { borderColor: AXM.blood }]}
                        testID="cache-card"
                    >
                        <Text style={[styles.cardTitle, vm.card.slammed && { color: AXM.blood }]}>
                            {vm.card.title}
                        </Text>
                        <Text style={styles.body}>{vm.card.body}</Text>
                        {vm.card.deltaChips.length > 0 && (
                            <View style={styles.chipRow}>
                                {vm.card.deltaChips.map((chip, i) => (
                                    <Text key={i} style={styles.chip}>{chip}</Text>
                                ))}
                            </View>
                        )}
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Continue"
                            onPress={actions.continueLootCacheCard}
                            style={styles.bigButton}
                            testID="cache-continue"
                        >
                            <Text style={styles.bigButtonText}>
                                {vm.card.slammed ? 'NURSE THE HAND' : 'GO ON'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Ledger */}
                {vm.phase === 'outcome' && vm.outcome !== null && (
                    <View style={styles.card} testID="cache-outcome">
                        <Text style={styles.eyebrow}>THE TALLY</Text>
                        <Text style={[styles.cardTitle, { color: AXM.sulfur }]}>{vm.outcome.tierLabel}</Text>
                        <View style={styles.chipRow}>
                            {vm.outcome.itemNames.map((name, i) => (
                                <Text key={i} style={styles.chip}>+ {name.toUpperCase()}</Text>
                            ))}
                            {vm.outcome.currency > 0 && (
                                <Text style={styles.chip}>+{vm.outcome.currency} SHILLINGS</Text>
                            )}
                            {vm.outcome.bittenVitae > 0 && (
                                <Text style={[styles.chip, { color: AXM.blood }]}>
                                    −{vm.outcome.bittenVitae} VITAE
                                </Text>
                            )}
                        </View>
                        {vm.outcome.keepsakes.map((k, i) => (
                            <Text key={i} style={styles.keepsake}>— {k}</Text>
                        ))}
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Pocket everything and go"
                            onPress={actions.claimLootCacheOutcome}
                            style={styles.bigButton}
                            testID="cache-claim"
                        >
                            <Text style={styles.bigButtonText}>POCKET IT ALL</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {vm.phase !== 'outcome' && vm.phase !== 'card' && (
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Leave the cache untouched"
                        onPress={actions.abandonLootCache}
                        style={styles.abandon}
                        testID="cache-abandon"
                    >
                        <Text style={styles.abandonText}>LEAVE IT FOR THE NEXT STRANGER</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </ScreenBg>
    );
}

const useStyles = makeStyles((AXM) => ({
    scrollOuter: { flex: 1 },
    // Centre the reliquary in the viewport so the short intro/card phases
    // don't sit atop a sea of empty black (critic round: cache was the one
    // encounter screen that never got dialogue's centring treatment).
    scroll: { padding: 14, paddingBottom: 24, flexGrow: 1, justifyContent: 'center' },
    eyebrow: {
        fontFamily: FONTS.sans,
        fontSize: 12,
        letterSpacing: 2.2,
        color: AXM.bone,
        marginBottom: 4,
    },
    title: {
        fontFamily: FONTS.gothic,
        fontSize: 26,
        lineHeight: 30,
        color: AXM.parchment,
        marginBottom: 10,
    },
    body: {
        fontFamily: FONTS.serif,
        fontSize: 13,
        lineHeight: 19,
        color: AXM.parchment,
        marginBottom: 8,
    },
    layers: { gap: 8, marginBottom: 12 },
    layer: {
        borderWidth: 2,
        borderColor: AXM.ash,
        backgroundColor: AXM.panelBg,
        padding: 10,
    },
    layerHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    layerName: { fontFamily: FONTS.gothic, fontSize: 16, color: AXM.parchment, letterSpacing: 1.2 },
    layerReading: { fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 1 },
    layerFlavor: { fontFamily: FONTS.serifItalic, fontSize: 13, color: AXM.bone, marginTop: 4 },
    layerLoot: { fontFamily: FONTS.mono, fontSize: 12, color: AXM.sulfur, marginTop: 4 },
    decisions: { gap: 8 },
    card: {
        borderWidth: 2,
        borderColor: AXM.ash,
        backgroundColor: AXM.panelBg,
        padding: 12,
    },
    cardTitle: {
        fontFamily: FONTS.gothic,
        fontSize: 22,
        lineHeight: 26,
        color: AXM.parchment,
        marginBottom: 6,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
    chip: {
        fontFamily: FONTS.mono,
        fontSize: 12,
        letterSpacing: 1,
        color: AXM.parchment,
        borderWidth: 1,
        borderColor: AXM.ash,
        paddingHorizontal: 5,
        paddingVertical: 2,
    },
    keepsake: { fontFamily: FONTS.serifItalic, fontSize: 13, color: AXM.sulfur, marginTop: 6 },
    bigButton: {
        borderWidth: 2,
        borderColor: AXM.sulfur,
        marginTop: 10,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: AXM.bg,
    },
    bigButtonText: { fontFamily: FONTS.gothic, fontSize: 18, letterSpacing: 2, color: AXM.sulfur },
    smallButton: {
        borderWidth: 1,
        borderColor: AXM.bone,
        paddingVertical: 8,
        alignItems: 'center',
        backgroundColor: AXM.bg,
    },
    smallButtonText: { fontFamily: FONTS.sans, fontSize: 13, letterSpacing: 2, color: AXM.bone },
    disabled: { opacity: 0.35 },
    abandon: { alignSelf: 'center', marginTop: 18, padding: 6 },
    abandonText: { fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 2, color: AXM.bone },
}));
