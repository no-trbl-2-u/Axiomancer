/**
 * /village — the dedicated settlement screen (Phase 137).
 *
 * A village event opens as a hub: the settlement's name, its
 * merchants (their stall-calls), and a transactional shop when the
 * authored payload carries one. Buying goes through the action
 * layer's `buyVillageWare` (engine `buyItem` owns the rules).
 */

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { ScreenBg } from '@/components/ScreenBg';
import { useGameActions, useGameState } from '@/state/GameStoreProvider';
import { selectVillageVM } from '@/state/presenters/village.engine';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export default function VillageScreen() {
    const styles = useStyles();
    const event = useGameState((s) => s.event);
    const player = useGameState((s) => s.player);
    const vm = useMemo(
        () => selectVillageVM({ event, player } as never),
        [event, player],
    );
    const actions = useGameActions();
    const router = useRouter();

    useEffect(() => {
        if (!vm.active && router.canGoBack()) router.back();
    }, [vm.active, router]);

    if (!vm.active) return <ScreenBg><View /></ScreenBg>;

    return (
        <ScreenBg>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.eyebrow}>⌂ SETTLEMENT</Text>
                <Text style={styles.title}>{vm.villageName.toUpperCase()}</Text>
                <Text style={styles.body}>{vm.body}</Text>

                {vm.merchants.length > 0 && (
                    <>
                        <Text style={styles.sectionLabel}>VOICES OF THE PLACE</Text>
                        {vm.merchants.map(merchant => (
                            <View key={merchant.name} style={styles.merchantCard} testID={`village-merchant-${merchant.name}`}>
                                <Text style={styles.merchantName}>{merchant.name}</Text>
                                {merchant.line.length > 0 && (
                                    <Text style={styles.merchantLine}>“{merchant.line}”</Text>
                                )}
                            </View>
                        ))}
                    </>
                )}

                {vm.wares.length > 0 && (
                    <>
                        <View style={styles.shopHead}>
                            <Text style={styles.sectionLabel}>THE STALLS</Text>
                            <Text style={styles.purse} testID="village-purse">
                                {vm.currency} SHILLINGS
                            </Text>
                        </View>
                        {vm.wares.map(ware => (
                            <TouchableOpacity
                                key={ware.itemId}
                                accessibilityRole="button"
                                accessibilityLabel={`Buy ${ware.name} for ${ware.price} shillings`}
                                accessibilityState={{ disabled: !ware.affordable }}
                                disabled={!ware.affordable}
                                onPress={() => actions.buyVillageWare(ware.itemId)}
                                style={[styles.wareRow, { opacity: ware.affordable ? 1 : 0.4 }]}
                                testID={`village-ware-${ware.itemId}`}
                            >
                                <View style={styles.flexOne}>
                                    <Text style={styles.wareName}>{ware.name}</Text>
                                    {ware.description.length > 0 && (
                                        <Text style={styles.wareDesc}>{ware.description}</Text>
                                    )}
                                </View>
                                <Text style={[styles.warePrice, !ware.affordable && styles.warePriceUnaffordable]}>{ware.price}s</Text>
                            </TouchableOpacity>
                        ))}
                    </>
                )}

                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Leave the village"
                    onPress={actions.dismissEvent}
                    style={styles.bigButton}
                    testID="village-leave"
                >
                    <Text style={styles.bigButtonText}>TAKE THE ROAD</Text>
                </TouchableOpacity>
            </ScrollView>
        </ScreenBg>
    );
}

const useStyles = makeStyles((AXM) => ({
    scroll: { padding: 14, paddingBottom: 24 },
    eyebrow: {
        fontFamily: FONTS.sans,
        fontSize: 10,
        letterSpacing: 2.2,
        color: AXM.parchment,
        marginBottom: 4,
    },
    title: {
        fontFamily: FONTS.gothic,
        fontSize: 30,
        lineHeight: 34,
        color: AXM.parchment,
        marginBottom: 8,
    },
    body: {
        fontFamily: FONTS.serif,
        fontSize: 13,
        lineHeight: 19,
        color: AXM.parchment,
        marginBottom: 8,
    },
    sectionLabel: {
        fontFamily: FONTS.sans,
        fontSize: 10,
        letterSpacing: 2.2,
        color: AXM.bone,
        marginTop: 12,
        marginBottom: 6,
    },
    merchantCard: {
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.panelBg,
        padding: 10,
        marginBottom: 6,
    },
    merchantName: { fontFamily: FONTS.gothic, fontSize: 16, color: AXM.sulfur, letterSpacing: 1.2 },
    merchantLine: { fontFamily: FONTS.serifItalic, fontSize: 12, color: AXM.parchment, marginTop: 4 },
    shopHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    purse: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.sulfur, letterSpacing: 1 },
    wareRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 2,
        borderColor: AXM.bone,
        backgroundColor: AXM.bg,
        padding: 10,
        marginBottom: 6,
    },
    wareName: { fontFamily: FONTS.gothic, fontSize: 16, color: AXM.parchment, letterSpacing: 1 },
    wareDesc: { fontFamily: FONTS.mono, fontSize: 8, color: AXM.bone, marginTop: 2, textTransform: 'uppercase' },
    warePrice: { fontFamily: FONTS.gothic, fontSize: 18, color: AXM.sulfur },
    // Price tracks affordability, not just the row's opacity: value-gold
    // is loud enough to survive the unaffordable dim, so mute the colour
    // to bone when the player can't afford it (critic round).
    warePriceUnaffordable: { color: AXM.bone },
    bigButton: {
        borderWidth: 2,
        borderColor: AXM.parchment,
        marginTop: 14,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: AXM.bg,
    },
    bigButtonText: { fontFamily: FONTS.gothic, fontSize: 18, letterSpacing: 2, color: AXM.parchment },
    flexOne: { flex: 1 },
}));
