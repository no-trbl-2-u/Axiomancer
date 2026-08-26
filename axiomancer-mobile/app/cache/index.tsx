/**
 * /cache — the loot-cache-choice screen ("The Reliquary", Phase 63,
 * replacing the retired Pick Pool dice-pool minigame).
 *
 * One irreversible choice of three: TAKE A CARD (a rolled reward card),
 * TAKE THE GOODS (a tier-scaled consumable haul + the node's currency), or
 * LEAVE IT FOR THE VILLAGE (nothing to the player; increments the current
 * map's goodwill tally). `resolveMapEvent` consumes the node on entry,
 * before any choice — there is no back-out: no header back, no
 * swipe-dismiss (`gestureEnabled: false` in the root layout), no Android
 * hardware-back (`<HardwareBackHandler>`). All rules live in
 * `axiomancer-mechanics` (World/LootCacheChoice); this screen renders the
 * presenter VM and dispatches store actions only.
 */

import React, { useEffect, useMemo } from 'react';
import { useRouter } from '@/lib/platform/router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { ScreenBg } from '@/components/ScreenBg';
import { useGameActions, useGameState } from '@/state/GameStoreProvider';
import {
    selectCacheVM,
    type CacheChoiceOfferVM,
} from '@/state/presenters/cache.engine';
import {
    CACHE_CHOICE_EYEBROW,
    CACHE_CHOICE_INTRO,
    CACHE_CHOICE_TITLE,
    CACHE_OUTCOME_CLAIM_LABEL,
    CACHE_OUTCOME_EYEBROW,
    cacheOutcomeCardChip,
    cacheOutcomeCurrencyChip,
    cacheOutcomeGoodwillChip,
    cacheOutcomeItemChip,
} from '@/state/presenters/cache.copy';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

function OfferCard({ offer, onPress }: { offer: CacheChoiceOfferVM; onPress: () => void }) {
    const styles = useStyles();
    return (
        <View style={styles.offerCol}>
            <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`${offer.label}. ${offer.desc}`}
                onPress={onPress}
                style={styles.offerButton}
                testID={`cache-choice-offer-${offer.id}`}
            >
                <Text style={styles.offerLabel}>{offer.label}</Text>
                <Text style={styles.offerDesc}>{offer.desc}</Text>
            </TouchableOpacity>
        </View>
    );
}

export default function CacheScreen() {
    const styles = useStyles();
    const AXM = usePalette();
    const slice = useGameState((s) => s.cache);
    const mapGoodwill = useGameState((s) => s.mapGoodwill);
    const world = useGameState((s) => s.world);
    const vm = useMemo(
        () => selectCacheVM({ cache: slice, mapGoodwill, world }),
        [slice, mapGoodwill, world],
    );
    const actions = useGameActions();
    const router = useRouter();

    useEffect(() => {
        if (!vm.active && router.canGoBack()) router.back();
    }, [vm.active, router]);

    if (!vm.active) return <ScreenBg><View /></ScreenBg>;

    return (
        <ScreenBg scrollable={false}>
            <ScrollView style={styles.scrollOuter} contentContainerStyle={styles.scroll}>
                <Text style={styles.eyebrow}>{CACHE_CHOICE_EYEBROW}</Text>
                <Text style={styles.title}>{CACHE_CHOICE_TITLE}</Text>

                {vm.phase === 'offer' && (
                    <View testID="cache-choice-offers">
                        <Text style={styles.body} testID="cache-choice-intro">
                            {vm.description ?? CACHE_CHOICE_INTRO}
                        </Text>
                        {vm.offers.map((offer) => (
                            <OfferCard
                                key={offer.id}
                                offer={offer}
                                onPress={() => actions.chooseLootCacheChoiceOffer(offer.id)}
                            />
                        ))}
                    </View>
                )}

                {vm.phase === 'outcome' && vm.outcome !== null && (
                    <View style={styles.card} testID="cache-outcome">
                        <Text style={styles.eyebrow}>{CACHE_OUTCOME_EYEBROW}</Text>
                        <Text style={[styles.cardTitle, { color: AXM.sulfur }]}>{vm.outcome.label}</Text>
                        <View style={styles.chipRow}>
                            {vm.outcome.cardName !== null && (
                                <Text style={styles.chip}>{cacheOutcomeCardChip(vm.outcome.cardName)}</Text>
                            )}
                            {vm.outcome.itemNames.map((name, i) => (
                                <Text key={`${name}:${i}`} style={styles.chip}>{cacheOutcomeItemChip(name)}</Text>
                            ))}
                            {vm.outcome.currency > 0 && (
                                <Text style={styles.chip}>{cacheOutcomeCurrencyChip(vm.outcome.currency)}</Text>
                            )}
                            {vm.outcome.goodwillPreview !== null && (
                                <Text style={styles.chip}>
                                    {cacheOutcomeGoodwillChip(world?.currentMap?.name ?? 'this place', vm.outcome.goodwillPreview)}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Move on"
                            onPress={actions.claimLootCacheChoiceOutcome}
                            style={styles.bigButton}
                            testID="cache-claim"
                        >
                            <Text style={styles.bigButtonText}>{CACHE_OUTCOME_CLAIM_LABEL}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </ScreenBg>
    );
}

const useStyles = makeStyles((AXM) => ({
    scrollOuter: { flex: 1 },
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
        fontSize: 24,
        lineHeight: 28,
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
    offerCol: { marginBottom: 8 },
    offerButton: {
        borderWidth: 2,
        borderColor: AXM.sulfur,
        padding: 10,
        backgroundColor: AXM.bg,
    },
    offerLabel: { fontFamily: FONTS.gothic, fontSize: 17, letterSpacing: 1.2, color: AXM.sulfur },
    offerDesc: {
        fontFamily: FONTS.mono,
        fontSize: 12,
        color: AXM.bone,
        marginTop: 2,
        textTransform: 'uppercase',
    },
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
    bigButton: {
        borderWidth: 2,
        borderColor: AXM.sulfur,
        marginTop: 12,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: AXM.bg,
    },
    bigButtonText: { fontFamily: FONTS.gothic, fontSize: 18, letterSpacing: 2, color: AXM.sulfur },
}));
