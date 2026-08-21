/**
 * /cache — the Loot-cache encounter screen ("The Reliquary").
 *
 * Three layers, public difficulty, one Insight charge, push-your-luck
 * on a live dice-pool pick. All rules live in `axiomancer-mechanics`
 * (World/LootCache); this screen renders the presenter VM and
 * dispatches store actions only. The picking phase's dice tray is the
 * tactile centerpiece — every push shakes the pool, settles on the
 * rolled faces, and fires haptics keyed to the outcome.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from '@/lib/platform/router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Image } from '@/lib/platform/image';
import { Haptics, ImpactFeedbackStyle, NotificationFeedbackType } from '@/lib/platform/haptics';

import { TREASURE_CHEST_CLOSED, TREASURE_GOLD_HOARD } from '@/assets/images/treasure';
import { CacheDie } from '@/components/cache/CacheDie';
import { CacheProgressMeter } from '@/components/cache/CacheProgressMeter';
import { CacheTutorialCoach } from '@/components/cache/CacheTutorialCoach';
import { currentTutorialStep } from '@/components/cache/tutorial-steps';
import { ScreenBg } from '@/components/ScreenBg';
import { CACHE_TUTORIAL_FLAG } from '@/state/cache/store-actions';
import { useGameActions, useGameState } from '@/state/GameStoreProvider';
import {
    selectCacheVM,
    type CacheLayerVM,
    type CachePickVM,
} from '@/state/presenters/cache.engine';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import { LOOT_CACHE_TUNING } from '@mechanics';

/** One slip shy of a jam — the engine's real jam threshold minus one. */
const JAM_WARNING_SLIPS = LOOT_CACHE_TUNING.jamSlipThreshold - 1;

function hapticImpact(style: ImpactFeedbackStyle): void {
    try {
        Haptics.impactAsync(style).catch(() => undefined);
    } catch {
        // Haptics are pure polish — never let them break the screen.
    }
}

function hapticNotification(type: NotificationFeedbackType): void {
    try {
        Haptics.notificationAsync(type).catch(() => undefined);
    } catch {
        // Haptics are pure polish — never let them break the screen.
    }
}

function LayerCard({ layer }: { layer: CacheLayerVM }) {
    const styles = useStyles();
    const AXM = usePalette();
    const READING_CHROME: Record<CacheLayerVM['reading'], { label: string; color: string }> = {
        locked:    { label: 'LOCKED',        color: AXM.bone },
        picking:   { label: 'PICKING',       color: AXM.sulfur },
        cracked:   { label: 'LIFTED CLEAN',  color: AXM.heal },
        sprung:    { label: 'SPRUNG',        color: AXM.blood },
        retreated: { label: 'LEFT SHUT',     color: AXM.bone },
    };
    const chrome = READING_CHROME[layer.reading];
    return (
        <View
            style={[
                styles.layer,
                layer.reading === 'picking' && { borderColor: AXM.sulfur },
                layer.opened && { opacity: 0.75 },
            ]}
            testID={`cache-layer-${layer.index}`}
        >
            <View style={styles.layerHead}>
                <Text style={styles.layerName}>{layer.name}</Text>
                <Text style={[styles.layerReading, { color: chrome.color }]}>{chrome.label}</Text>
            </View>
            <Text style={styles.layerFlavor}>{layer.flavor}</Text>
            <Text style={styles.layerDifficulty} testID={`cache-layer-${layer.index}-difficulty`}>
                LOCK · {layer.difficulty}
            </Text>
            {layer.lootSummary !== null && (
                <Text style={styles.layerLoot} testID={`cache-layer-${layer.index}-loot`}>
                    {layer.lootSummary}
                </Text>
            )}
        </View>
    );
}

function DiceTray({ pick, onPush }: { pick: CachePickVM; onPush: () => void }) {
    const styles = useStyles();
    const AXM = usePalette();
    const rollToken = useRef(0);
    const [token, setToken] = useState(0);
    const dice = pick.lastRoll?.dice ?? [];
    const slips = pick.lastRoll?.slips ?? 0;
    const onEdge = slips >= JAM_WARNING_SLIPS && !pick.lastRoll?.jammed && pick.canPush;

    // Bump the shared roll token whenever a fresh roll lands so every die
    // retriggers its tumble in lockstep (each die staggers off its index).
    useEffect(() => {
        if (pick.lastRoll === null) return;
        rollToken.current += 1;
        setToken(rollToken.current);
    }, [pick.lastRoll]);

    // Idle faces (before the first push) read as "ready", not "slipped" —
    // show a neutral high face rather than 1s.
    const faces = dice.length > 0 ? dice : Array.from({ length: pick.poolSize }, () => 6);

    // The tray itself is a tap target that pushes the pool — players kept
    // reaching for the dice directly (that's the natural read of a pile of
    // rollable-looking dice) and finding nothing happened, since the only
    // wired control used to be the separate PUSH button below. Tapping the
    // tray now fires the exact same action, so the dice are never "just
    // sitting there, unclickable."
    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Push the pick by tapping the dice"
            accessibilityState={{ disabled: !pick.canPush }}
            disabled={!pick.canPush}
            onPress={onPush}
            activeOpacity={pick.canPush ? 0.7 : 1}
            style={styles.diceTray}
            testID="cache-dice-tray"
        >
            <View style={styles.diceRow}>
                {faces.map((face, i) => (
                    <CacheDie
                        key={i}
                        face={face}
                        rollToken={token}
                        index={i}
                        bonus={i >= LOOT_CACHE_TUNING.pickPoolSize}
                        testID={`cache-dice-${i}`}
                    />
                ))}
            </View>
            {pick.lastRoll === null && pick.canPush && (
                <Text style={styles.diceHint} testID="cache-dice-hint">
                    TAP THE DICE OR PUSH TO ROLL
                </Text>
            )}
            {pick.lastRoll !== null && (
                <View style={styles.rollReadout} testID="cache-roll-readout">
                    <Text style={[styles.rollGain, { color: AXM.sulfur }]}>
                        +{pick.lastRoll.gained} PROGRESS
                    </Text>
                    {pick.lastRoll.slips > 0 && (
                        <Text
                            style={[
                                styles.rollSlips,
                                { color: onEdge ? AXM.blood : AXM.bone },
                            ]}
                            testID="cache-roll-slips"
                        >
                            {pick.lastRoll.slips} SLIP{pick.lastRoll.slips > 1 ? 'S' : ''}
                            {onEdge ? ' — ONE FROM A JAM' : ''}
                        </Text>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
}

export default function CacheScreen() {
    const styles = useStyles();
    const AXM = usePalette();
    const slice = useGameState((s) => s.cache);
    const vm = useMemo(() => selectCacheVM({ cache: slice }), [slice]);
    const actions = useGameActions();
    const router = useRouter();

    const tutorialDone = useGameState((s) =>
        ((s as unknown as { flags?: string[] }).flags ?? []).includes(CACHE_TUTORIAL_FLAG),
    );
    // The coach rides the guided first delve until its script is done or
    // skipped; the persistent flag gates it (and the map trigger).
    const session = slice?.session ?? null;
    const coachActive = slice?.tutorial === true && session !== null && !tutorialDone;
    useEffect(() => {
        if (coachActive && currentTutorialStep(session!, vm) === -1) {
            actions.completeLootCacheTutorial(false);
        }
    }, [coachActive, session, vm, actions]);

    useEffect(() => {
        if (!vm.active && router.canGoBack()) router.back();
    }, [vm.active, router]);

    const handlePush = () => {
        hapticImpact(Haptics.ImpactFeedbackStyle.Light);
        actions.pushLootCachePick();
    };

    // Fire resolution haptics once a roll lands (cracked / jammed / progressed).
    const lastRollSeen = useRef<unknown>(null);
    useEffect(() => {
        const roll = vm.pick?.lastRoll ?? null;
        if (roll === null || roll === lastRollSeen.current) return;
        lastRollSeen.current = roll;
        if (roll.jammed) {
            hapticNotification(Haptics.NotificationFeedbackType.Error);
            hapticImpact(Haptics.ImpactFeedbackStyle.Heavy);
        } else if (vm.phase === 'card') {
            hapticNotification(Haptics.NotificationFeedbackType.Success);
        } else {
            hapticImpact(Haptics.ImpactFeedbackStyle.Medium);
        }
    }, [vm.pick?.lastRoll, vm.phase]);

    if (!vm.active) return <ScreenBg><View /></ScreenBg>;

    return (
        <ScreenBg scrollable={false}>
            <ScrollView style={styles.scrollOuter} contentContainerStyle={styles.scroll}>
                <Text style={styles.eyebrow}>THE RELIQUARY</Text>
                <Text style={styles.title}>A CACHE, LONG UNCLAIMED</Text>

                {vm.phase === 'intro' && (
                    <View testID="cache-intro">
                        <Image
                            source={TREASURE_CHEST_CLOSED}
                            style={styles.heroArt}
                            contentFit="contain"
                            transition={0}
                            accessibilityLabel="A banded chest, shut and half-buried"
                        />
                        <Text style={styles.body}>
                            Half-buried and patient, the way hidden things are. Three
                            locks, honest about their difficulty, and no one watching.
                            The pick either holds or it doesn&apos;t.
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
                        {vm.layers.map(layer => (
                            <View key={layer.index}>
                                <LayerCard layer={layer} />
                                {layer.reading === 'picking' && vm.pick !== null && (
                                    <CacheProgressMeter
                                        progress={vm.pick.progress}
                                        difficulty={vm.pick.difficulty}
                                        fraction={vm.pick.progressFraction}
                                    />
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {/* Delving decisions */}
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
                            accessibilityLabel="Seal the cache and walk away"
                            onPress={actions.sealLootCache}
                            style={styles.smallButton}
                            testID="cache-seal"
                        >
                            <Text style={styles.smallButtonText}>TAKE WHAT&apos;S LIFTED AND GO</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Picking — the dice tray, the tactile heart of the encounter */}
                {vm.phase === 'picking' && vm.pick !== null && (
                    <View style={styles.decisions} testID="cache-picking">
                        <DiceTray pick={vm.pick} onPush={handlePush} />

                        {vm.pick.canChannelInsight && (
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel="Steady the hand before the first push"
                                onPress={actions.channelLootCacheInsight}
                                style={[styles.smallButton, { borderColor: AXM.sulfur }]}
                                testID="cache-insight"
                            >
                                <Text style={[styles.smallButtonText, { color: AXM.sulfur }]}>
                                    STEADY THE HAND
                                </Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Push the pick"
                            accessibilityState={{ disabled: !vm.pick.canPush }}
                            disabled={!vm.pick.canPush}
                            onPress={handlePush}
                            style={[styles.bigButton, !vm.pick.canPush && styles.disabled]}
                            testID="cache-push"
                        >
                            <Text style={styles.bigButtonText}>
                                PUSH ({vm.pick.pushesRemaining} LEFT)
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Retreat from this lock"
                            accessibilityState={{ disabled: !vm.pick.canRetreat }}
                            disabled={!vm.pick.canRetreat}
                            onPress={actions.retreatLootCachePick}
                            style={styles.smallButton}
                            testID="cache-retreat"
                        >
                            <Text style={styles.smallButtonText}>PULL THE PICK BACK</Text>
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
                        <Image
                            source={TREASURE_GOLD_HOARD}
                            style={styles.tallyArt}
                            contentFit="contain"
                            transition={0}
                            accessibilityLabel="Spilled gold and an ewer — the take"
                        />
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

            {coachActive && (
                <CacheTutorialCoach
                    session={session!}
                    vm={vm}
                    onSkip={() => actions.completeLootCacheTutorial(true)}
                />
            )}
        </ScreenBg>
    );
}

const useStyles = makeStyles((AXM) => ({
    scrollOuter: { flex: 1 },
    // Centre the reliquary in the viewport so the short intro/card phases
    // don't sit atop a sea of empty black (critic round: cache was the one
    // encounter screen that never got dialogue's centring treatment).
    scroll: { padding: 14, paddingBottom: 24, flexGrow: 1, justifyContent: 'center' },
    // Encounter art — the shut chest greets the kneel; the hoard crowns the tally.
    heroArt: { width: '100%', height: 180, marginBottom: 10 },
    tallyArt: { width: '100%', height: 140, marginBottom: 8 },
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
    layerDifficulty: { fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 1, color: AXM.bone, marginTop: 4 },
    layerLoot: { fontFamily: FONTS.mono, fontSize: 12, color: AXM.sulfur, marginTop: 4 },
    decisions: { gap: 8 },
    diceTray: {
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.deepBg,
        paddingVertical: 14,
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    diceRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
    diceHint: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        letterSpacing: 1.5,
        color: AXM.bone,
        marginTop: 10,
        opacity: 0.7,
    },
    rollReadout: { marginTop: 10, alignItems: 'center' },
    rollGain: { fontFamily: FONTS.mono, fontSize: 13, letterSpacing: 1 },
    rollSlips: { fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 1, marginTop: 2 },
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
