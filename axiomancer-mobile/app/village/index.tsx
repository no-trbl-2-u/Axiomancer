/**
 * /village — the dedicated settlement screen (Phase 137).
 *
 * A village event opens as a hub: the settlement's name, its
 * merchants (their stall-calls), and a transactional shop when the
 * authored payload carries one. Buying goes through the action
 * layer's `buyVillageWare` (engine `buyItem` owns the rules).
 *
 * Phase 5 adds a SELL tab alongside BUY: the shop head gains a tab
 * toggle, and SELL lists the player's inventory (quest items
 * excluded) priced via the presenter's `sellables` — dispatching
 * `sellVillageItem` (engine `sellItem` owns the rules).
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from '@/lib/platform/router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { ScreenBg } from '@/components/ScreenBg';
import { AxmIcon } from '@/components/icons';
import { useGameActions, useGameState } from '@/state/GameStoreProvider';
import { selectVillageVM } from '@/state/presenters/village.engine';
import { FONTS, TYPE } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export default function VillageScreen() {
    const styles = useStyles();
    const event = useGameState((s) => s.event);
    const player = useGameState((s) => s.player);
    const mapGoodwill = useGameState((s) => s.mapGoodwill);
    const world = useGameState((s) => s.world);
    const vm = useMemo(
        () => selectVillageVM({ event, player, mapGoodwill, world } as never),
        [event, player, mapGoodwill, world],
    );
    const actions = useGameActions();
    const router = useRouter();
    const [shopTab, setShopTab] = useState<'buy' | 'sell'>('buy');

    useEffect(() => {
        if (!vm.active && router.canGoBack()) router.back();
    }, [vm.active, router]);

    // Inactive shell — visible for a frame while the router unwinds; never a
    // blank screen (UI-cleanup pass, CRITIQUE).
    if (!vm.active) {
        return (
            <ScreenBg scrollable={false} art="village">
                <View style={styles.inactiveWrap} testID="village-inactive">
                    <Text style={styles.inactiveText}>No settlement here. Only the road.</Text>
                </View>
            </ScreenBg>
        );
    }

    return (
        <ScreenBg art="village">
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.eyebrowRow}>
                    <AxmIcon name="action-village" size={18} />
                    <Text style={styles.eyebrow}>SETTLEMENT</Text>
                </View>
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

                {vm.hasShop && (
                    <>
                        <View style={styles.shopHead}>
                            <Text style={styles.sectionLabel}>THE STALLS</Text>
                            <Text style={styles.purse} testID="village-purse">
                                {vm.currency} SHILLINGS
                            </Text>
                        </View>
                        <View style={styles.tabRow}>
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel="Buy from the stalls"
                                accessibilityState={{ selected: shopTab === 'buy' }}
                                onPress={() => setShopTab('buy')}
                                style={[styles.tabButton, shopTab === 'buy' && styles.tabButtonActive]}
                                testID="village-tab-buy"
                            >
                                <Text style={[styles.tabButtonText, shopTab === 'buy' && styles.tabButtonTextActive]}>BUY</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel="Sell to the stalls"
                                accessibilityState={{ selected: shopTab === 'sell' }}
                                onPress={() => setShopTab('sell')}
                                style={[styles.tabButton, shopTab === 'sell' && styles.tabButtonActive]}
                                testID="village-tab-sell"
                            >
                                <Text style={[styles.tabButtonText, shopTab === 'sell' && styles.tabButtonTextActive]}>SELL</Text>
                            </TouchableOpacity>
                        </View>

                        {shopTab === 'buy' && (
                            vm.wares.length > 0 ? vm.wares.map(ware => (
                                <TouchableOpacity
                                    key={ware.itemId}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Buy ${ware.name} for ${ware.price} shillings`}
                                    accessibilityState={{ disabled: !ware.affordable }}
                                    disabled={!ware.affordable}
                                    onPress={() => actions.buyVillageWare(ware.itemId)}
                                    style={[styles.wareRow, !ware.affordable && styles.wareRowUnaffordable]}
                                    testID={`village-ware-${ware.itemId}`}
                                >
                                    <View style={styles.flexOne}>
                                        <Text style={styles.wareName}>{ware.name}</Text>
                                        {ware.description.length > 0 && (
                                            <Text style={styles.wareDesc}>{ware.description}</Text>
                                        )}
                                    </View>
                                    {ware.discounted && (
                                        <Text style={[styles.warePriceStruck, !ware.affordable && styles.wareCtaDimmed]} testID={`village-ware-${ware.itemId}-base-price`}>{ware.basePrice}s</Text>
                                    )}
                                    <Text style={[styles.warePrice, !ware.affordable && [styles.warePriceUnaffordable, styles.wareCtaDimmed]]}>{ware.price}s</Text>
                                </TouchableOpacity>
                            )) : (
                                <Text style={styles.emptyNote} testID="village-buy-empty">Nothing for sale.</Text>
                            )
                        )}

                        {shopTab === 'sell' && (
                            vm.sellables.length > 0 ? vm.sellables.map(sellable => (
                                <TouchableOpacity
                                    key={`${sellable.itemId}-${sellable.index}`}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Sell ${sellable.name} for ${sellable.sellPrice} shillings`}
                                    onPress={() => actions.sellVillageItem(sellable.index)}
                                    style={styles.wareRow}
                                    testID={`village-sell-${sellable.index}`}
                                >
                                    <View style={styles.flexOne}>
                                        <Text style={styles.wareName}>{sellable.name}</Text>
                                        {sellable.description.length > 0 && (
                                            <Text style={styles.wareDesc}>{sellable.description}</Text>
                                        )}
                                    </View>
                                    <Text style={styles.warePrice}>{sellable.sellPrice}s</Text>
                                </TouchableOpacity>
                            )) : (
                                <Text style={styles.emptyNote} testID="village-sell-empty">Nothing to sell.</Text>
                            )
                        )}
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
    eyebrowRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
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
    tabRow: { flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 8 },
    tabButton: {
        flex: 1,
        borderWidth: 2,
        borderColor: AXM.ash,
        backgroundColor: AXM.panelBg,
        paddingVertical: 6,
        alignItems: 'center',
    },
    tabButtonActive: { borderColor: AXM.parchment, backgroundColor: AXM.bg },
    tabButtonText: { fontFamily: FONTS.gothic, fontSize: 13, letterSpacing: 1.5, color: AXM.bone },
    tabButtonTextActive: { color: AXM.parchment },
    emptyNote: { fontFamily: FONTS.serifItalic, fontSize: 12, color: AXM.bone, marginBottom: 6 },
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
    // Unaffordable rows dim only the price/CTA (below) — the border alone
    // signals disabled so the name/description stay bone/parchment-bright
    // and legible, matching combat's disabled-item treatment (critic round).
    wareRowUnaffordable: { borderColor: AXM.ash },
    wareName: { fontFamily: FONTS.gothic, fontSize: 16, color: AXM.parchment, letterSpacing: 1 },
    wareDesc: { fontFamily: FONTS.mono, fontSize: 8, color: AXM.bone, marginTop: 2, textTransform: 'uppercase' },
    warePrice: { fontFamily: FONTS.gothic, fontSize: 18, color: AXM.sulfur },
    // Price tracks affordability, not just the row's opacity: value-gold
    // is loud enough to survive the unaffordable dim, so mute the colour
    // to bone when the player can't afford it (critic round).
    warePriceUnaffordable: { color: AXM.bone },
    wareCtaDimmed: { opacity: 0.6 },
    // Phase 65 — village goodwill discount: the pre-discount price shown
    // struck through beside the discounted charge.
    warePriceStruck: {
        fontFamily: FONTS.gothic,
        fontSize: 12,
        color: AXM.bone,
        textDecorationLine: 'line-through',
    },
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
    inactiveWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    inactiveText: { ...TYPE.body, color: AXM.parchment, opacity: 0.55, textAlign: 'center' },
}));
