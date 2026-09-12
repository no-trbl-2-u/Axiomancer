/**
 * /blacksmith — the Blacksmith encounter screen ("The Anvil").
 *
 * The die-gear upgrade surface (Spec 33 §6): HONE (add a mana face),
 * TEMPER (mana face → special face), and gear SWAP. All rules live in
 * `axiomancer-mechanics` (World/Blacksmith); this screen renders the
 * presenter VM and dispatches store actions only.
 *
 * Owner-UI doctrine: a cap-violating OR unaffordable offer is greyed AND
 * names its reason out loud (never a silent no-op) — the greyed-offer
 * copy is the SAME cap authority the engine's refusal card uses, so they
 * always agree.
 */

import React, { useEffect, useMemo } from 'react';
import { useRouter } from '@/lib/platform/router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Haptics, ImpactFeedbackStyle } from '@/lib/platform/haptics';

import { LeaveRow } from '@/components/LeaveRow';
import { ScreenBg } from '@/components/ScreenBg';
import { AxmIcon } from '@/components/icons';
import { useGameActions, useGameState } from '@/state/GameStoreProvider';
import {
    selectBlacksmithVM,
    type BlacksmithDieVM,
    type BlacksmithOfferVM,
    type BlacksmithSwapVM,
} from '@/state/presenters/blacksmith.engine';
import { FONTS, TYPE } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

function hapticImpact(style: ImpactFeedbackStyle): void {
    try {
        Haptics.impactAsync(style).catch(() => undefined);
    } catch {
        // Haptics are pure polish — never let them break the screen.
    }
}

/** A single service offer as a button; greyed + reason when disabled. */
function OfferButton({ offer, onPress }: { offer: BlacksmithOfferVM; onPress: () => void }) {
    const styles = useStyles();
    const AXM = usePalette();
    return (
        <View style={styles.offerCol}>
            <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={
                    offer.enabled
                        ? `${offer.label} the ${offer.color} die for ${offer.price} diamonds`
                        : `${offer.label} unavailable: ${offer.reason}`
                }
                accessibilityState={{ disabled: !offer.enabled }}
                disabled={!offer.enabled}
                onPress={() => {
                    hapticImpact(Haptics.ImpactFeedbackStyle.Medium);
                    onPress();
                }}
                style={[styles.offerButton, !offer.enabled && styles.offerDisabled]}
                testID={`blacksmith-offer-${offer.id}`}
            >
                <Text style={[styles.offerLabel, !offer.enabled && { color: AXM.bone }]}>
                    {offer.label}
                </Text>
                {/* FE-023: shillings, not ◆ — that glyph is combat's CONVICTION. */}
                <Text style={[styles.offerPrice, !offer.enabled && { color: AXM.bone }]}>
                    {offer.price}s
                </Text>
            </TouchableOpacity>
            {!offer.enabled && (
                <Text style={styles.offerReason} testID={`blacksmith-offer-${offer.id}-reason`}>
                    {offer.reason}
                </Text>
            )}
        </View>
    );
}

function DieRow({
    die,
    onHone,
    onTemper,
}: {
    die: BlacksmithDieVM;
    onHone: () => void;
    onTemper: () => void;
}) {
    const styles = useStyles();
    return (
        <View style={styles.die} testID={`blacksmith-die-${die.color}`}>
            <View style={styles.dieHead}>
                <Text style={styles.dieName}>{die.label}</Text>
                <Text style={styles.dieFaces} testID={`blacksmith-die-${die.color}-faces`}>
                    {die.faceSummary}
                </Text>
            </View>
            <View style={styles.offerRow}>
                <OfferButton offer={die.hone} onPress={onHone} />
                <OfferButton offer={die.temper} onPress={onTemper} />
            </View>
        </View>
    );
}

function SwapRow({ swap, onSwap }: { swap: BlacksmithSwapVM; onSwap: () => void }) {
    const styles = useStyles();
    return (
        <View style={styles.die} testID={`blacksmith-swap-${swap.offer.id}`}>
            <View style={styles.dieHead}>
                <Text style={styles.dieName}>{swap.name}</Text>
                <Text style={styles.dieFaces}>{swap.faceSummary}</Text>
            </View>
            <View style={styles.offerRow}>
                <OfferButton offer={swap.offer} onPress={onSwap} />
            </View>
        </View>
    );
}

export default function BlacksmithScreen() {
    const styles = useStyles();
    const AXM = usePalette();
    const slice = useGameState((s) => s.blacksmith);
    const vm = useMemo(() => selectBlacksmithVM({ blacksmith: slice }), [slice]);
    const actions = useGameActions();
    const router = useRouter();

    useEffect(() => {
        if (!vm.active && router.canGoBack()) router.back();
    }, [vm.active, router]);

    // Inactive shell — visible for a frame while the router unwinds; never a
    // blank screen (UI-cleanup pass, CRITIQUE).
    if (!vm.active) {
        return (
            <ScreenBg scrollable={false} art="blacksmith">
                <View style={styles.inactiveWrap} testID="blacksmith-inactive">
                    <Text style={styles.inactiveText}>The forge is cold. Nothing keeps you here.</Text>
                </View>
            </ScreenBg>
        );
    }

    return (
        <ScreenBg scrollable={false} art="blacksmith">
            <ScrollView style={styles.scrollOuter} contentContainerStyle={styles.scroll}>
                <View style={styles.eyebrowRow}>
                    <AxmIcon name="action-anvil" size={18} />
                    <Text style={styles.eyebrow}>THE ANVIL</Text>
                </View>
                <Text style={styles.title}>A SMITH FOR YOUR DICE</Text>

                {vm.phase === 'intro' && (
                    <View testID="blacksmith-intro">
                        <Text style={styles.body}>
                            The forge breathes low and orange. The smith turns your dice
                            over, reading the dead weight in them. &quot;I can draw a miss
                            out true, or harden a face into something that pays. Costs, of
                            course.&quot;
                        </Text>
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Set your dice on the anvil"
                            onPress={actions.startBlacksmithForging}
                            style={styles.bigButton}
                            testID="blacksmith-begin"
                        >
                            <Text style={styles.bigButtonText}>SET THEM ON THE ANVIL</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {vm.phase === 'forging' && (
                    <View testID="blacksmith-forging">
                        <View style={styles.budgetRow}>
                            <Text style={styles.budgetLabel}>PURSE</Text>
                            <Text style={styles.budgetValue} testID="blacksmith-budget">
                                {vm.budget}s
                            </Text>
                        </View>

                        <Text style={styles.sectionLabel}>YOUR DICE</Text>
                        {vm.dice.map((die) => (
                            <DieRow
                                key={die.color}
                                die={die}
                                onHone={() => actions.honeBlacksmith(die.color)}
                                onTemper={() => actions.temperBlacksmith(die.color)}
                            />
                        ))}

                        {vm.swaps.length > 0 && (
                            <>
                                <Text style={styles.sectionLabel}>ON OFFER</Text>
                                {vm.swaps.map((swap) => (
                                    <SwapRow
                                        key={swap.offer.id}
                                        swap={swap}
                                        onSwap={() => actions.swapBlacksmith(swap.offer.id.replace(/^swap:/, ''))}
                                    />
                                ))}
                            </>
                        )}

                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Take your dice and leave the anvil"
                            onPress={actions.leaveBlacksmith}
                            style={styles.bigButton}
                            testID="blacksmith-leave"
                        >
                            <Text style={styles.bigButtonText}>TAKE THEM AND GO</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {vm.phase === 'card' && vm.card !== null && (
                    <View
                        style={[styles.card, vm.card.refused && { borderColor: AXM.blood }]}
                        testID="blacksmith-card"
                    >
                        <Text style={[styles.cardTitle, vm.card.refused && { color: AXM.blood }]}>
                            {vm.card.title}
                        </Text>
                        <Text style={styles.body}>{vm.card.body}</Text>
                        {!vm.card.refused && vm.card.cost > 0 && (
                            <View style={styles.chipRow}>
                                <Text style={styles.chip}>−{vm.card.cost}s</Text>
                                <Text style={styles.chip}>{vm.card.verb.toUpperCase()} · {vm.card.color.toUpperCase()}</Text>
                            </View>
                        )}
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Continue"
                            onPress={actions.continueBlacksmithCard}
                            style={styles.bigButton}
                            testID="blacksmith-continue"
                        >
                            <Text style={styles.bigButtonText}>
                                {vm.card.refused ? 'HEAR HIM OUT' : 'GOOD'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {vm.phase === 'outcome' && vm.outcome !== null && (
                    <View style={styles.card} testID="blacksmith-outcome">
                        <Text style={styles.eyebrow}>THE RECKONING</Text>
                        <Text style={[styles.cardTitle, { color: AXM.sulfur }]}>WORK DONE</Text>
                        <View style={styles.chipRow}>
                            {vm.outcome.chips.map((chip, i) => (
                                <Text key={i} style={styles.chip}>{chip}</Text>
                            ))}
                        </View>
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Pay the smith and pocket your dice"
                            onPress={actions.claimBlacksmithOutcome}
                            style={styles.bigButton}
                            testID="blacksmith-claim"
                        >
                            <Text style={styles.bigButtonText}>PAY AND POCKET THEM</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* FE-007: shared bordered control — see LeaveRow. */}
                {vm.phase !== 'outcome' && vm.phase !== 'card' && (
                    <LeaveRow
                        label="LET THE COALS DIE"
                        accessibilityLabel="Leave the forge untouched"
                        onPress={actions.abandonBlacksmith}
                        testID="blacksmith-abandon"
                    />
                )}
            </ScrollView>
        </ScreenBg>
    );
}

const useStyles = makeStyles((AXM) => ({
    scrollOuter: { flex: 1 },
    scroll: { padding: 14, paddingBottom: 24, flexGrow: 1, justifyContent: 'center' },
    eyebrowRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
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
    budgetRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        borderBottomWidth: 1,
        borderBottomColor: AXM.ash,
        paddingBottom: 6,
        marginBottom: 10,
    },
    budgetLabel: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 2, color: AXM.bone },
    budgetValue: { fontFamily: FONTS.gothic, fontSize: 20, letterSpacing: 1, color: AXM.sulfur },
    sectionLabel: {
        fontFamily: FONTS.sans,
        fontSize: 11,
        letterSpacing: 2,
        color: AXM.bone,
        marginTop: 6,
        marginBottom: 6,
    },
    die: {
        borderWidth: 2,
        borderColor: AXM.ash,
        backgroundColor: AXM.panelBg,
        padding: 10,
        marginBottom: 8,
    },
    dieHead: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    dieName: { fontFamily: FONTS.gothic, fontSize: 16, color: AXM.parchment, letterSpacing: 1.2 },
    dieFaces: { fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.5, color: AXM.bone },
    offerRow: { flexDirection: 'row', gap: 8 },
    offerCol: { flex: 1 },
    offerButton: {
        borderWidth: 1,
        borderColor: AXM.sulfur,
        paddingVertical: 8,
        paddingHorizontal: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: AXM.bg,
    },
    offerDisabled: { borderColor: AXM.ash, opacity: 0.5 },
    offerLabel: { fontFamily: FONTS.gothic, fontSize: 14, letterSpacing: 1.5, color: AXM.sulfur },
    offerPrice: { fontFamily: FONTS.mono, fontSize: 12, color: AXM.sulfur },
    offerReason: {
        fontFamily: FONTS.serifItalic,
        fontSize: 11,
        lineHeight: 15,
        color: AXM.bone,
        marginTop: 4,
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
        marginTop: 10,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: AXM.bg,
    },
    bigButtonText: { fontFamily: FONTS.gothic, fontSize: 18, letterSpacing: 2, color: AXM.sulfur },
    inactiveWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    inactiveText: { ...TYPE.body, color: AXM.parchment, opacity: 0.55, textAlign: 'center' },
}));
