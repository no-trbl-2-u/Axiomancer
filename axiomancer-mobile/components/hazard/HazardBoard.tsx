/**
 * The Hazard round-play board: header ledger, crisis scene strip, live
 * progress meter(s), the mana dice tray, the play area, the fanned
 * hand dock, and the translucent sulfur-glow PLAY button.
 *
 * Touch model (drag-only, per direction):
 *  - drag a hand card up into the play area to stage it;
 *  - tap a hand card (or abort a drag) to read it;
 *  - tap a staged card (or drag it out) to return it to hand;
 *  - drag a mana die onto a staged card of its colour to power it.
 *
 * The drag ghost renders at screen level in `app/hazard/index.tsx`;
 * this board reports gestures up through the `drag` controller.
 */

import React, { useCallback, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    FadeIn,
    FadeInDown,
    LinearTransition,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

import type { HazardCardVM, HazardDieVM, HazardMeterVM, HazardViewModel } from '@/state/presenters/hazard.engine';
import { HAZARD_TUNING } from 'axiomancer-mechanics';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

import { HazardCard } from './HazardCard';
import { HazardDie } from './HazardDie';
import { Cracks, LedgerMark, ProgGlyph, TrashGlyph } from './glyphs';
import { HZ, routeAccent, TYPE_ACCENT } from './palette';

// ---------------------------------------------------------------------------
// Drag plumbing
// ---------------------------------------------------------------------------

export type DragPayload =
    | { type: 'card'; from: 'hand' | 'play'; uid: string; card: HazardCardVM }
    | { type: 'die'; dieId: string; die: HazardDieVM };

export interface DragController {
    /** Begin tracking a drag; the screen renders the ghost. */
    begin: (payload: DragPayload, x: number, y: number) => void;
    move: (x: number, y: number) => void;
    /** End the drag at (x, y); the board's drop logic runs. */
    end: (x: number, y: number) => void;
    /** Currently dragged payload (React state from the screen). */
    active: DragPayload | null;
}

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

function rectContains(rect: Rect | null, x: number, y: number, pad = 0): boolean {
    if (!rect) return false;
    return (
        x >= rect.x - pad &&
        x <= rect.x + rect.width + pad &&
        y >= rect.y - pad &&
        y <= rect.y + rect.height + pad
    );
}

/** A die of colour `dieKind` can power `card` when the die is the wild gold
 *  die or its colour is one of the card's power colours (two-tone cards list
 *  two). Mirrors `dieCanPowerCard` in the engine. */
function dieFits(dieKind: HazardDieVM['kind'], card: HazardCardVM): boolean {
    return dieKind === 'gold' || card.powerColors.includes(dieKind as HazardCardVM['kind']);
}

type MeasurableRef = React.RefObject<View | null>;

function measureRect(ref: MeasurableRef): Promise<Rect | null> {
    return new Promise((resolve) => {
        const node = ref.current;
        if (!node) {
            resolve(null);
            return;
        }
        node.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
    });
}

// ---------------------------------------------------------------------------
// Meters
// ---------------------------------------------------------------------------

function SegBar({ meter }: { meter: HazardMeterVM }) {
    const AXM = usePalette();
    const styles = useStyles();
    const accent = TYPE_ACCENT[meter.key];
    const segs = Math.max(1, meter.need);
    return (
        <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`${meter.label} progress: ${meter.value} of ${meter.need} ${meter.met ? '- requirement met' : '- not yet met'}`}
            accessibilityValue={{ min: 0, max: meter.need, now: meter.value }}
        >
            <View style={styles.meterHead}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <ProgGlyph kind={meter.key} size={13} color={accent} />
                    <Text style={[styles.meterLabel, { color: accent }]}>{meter.label}</Text>
                </View>
                <Text style={[styles.meterValue, { color: meter.met ? accent : AXM.parchment }]}>
                    {meter.value}
                    <Text style={{ color: AXM.bone }}> / {meter.need}</Text>
                    {meter.met ? ' ✓' : ''}
                </Text>
            </View>
            <View style={styles.segRow}>
                {Array.from({ length: segs }, (_, i) => {
                    const filled = i < meter.value;
                    return (
                        <Animated.View
                            key={i}
                            layout={LinearTransition.duration(140)}
                            style={[
                                styles.seg,
                                {
                                    borderColor: filled ? accent : AXM.ash,
                                    backgroundColor: filled ? accent : 'rgba(0,0,0,0.45)',
                                },
                            ]}
                        />
                    );
                })}
            </View>
        </View>
    );
}

function LiveMeter({ vm }: { vm: HazardViewModel }) {
    const styles = useStyles();
    // Memoized expensive calculation for threshold ladder text
    const ladderText = useMemo(() => {
        return vm.thresholdLadder
            .map((row) => `${row.label} ${row.values.map((v, i) => (i === 0 ? `${v}` : `·${v}`)).join('')}`)
            .join('   ');
    }, [vm.thresholdLadder]);
    return (
        <View style={styles.meterPanel} testID="hazard-meters">
            {vm.meters.map((meter, i) => (
                <React.Fragment key={meter.key}>
                    <SegBar meter={meter} />
                    {vm.bothRequired && i === 0 && (
                        <View style={styles.bothRow}>
                            <View style={styles.bothLine} />
                            <Text style={styles.bothText}>BOTH REQUIRED</Text>
                            <View style={styles.bothLine} />
                        </View>
                    )}
                </React.Fragment>
            ))}
            {vm.meterDetail !== null && <Text style={styles.meterDetail}>{vm.meterDetail}</Text>}
            {/* full ladder + momentum (REC#1 / REC#2) */}
            <View style={styles.metaRow}>
                <Text style={styles.ladderText}>
                    {ladderText}
                </Text>
                {vm.momentumNote !== null && <Text style={styles.momentum}>⟜ {vm.momentumNote}</Text>}
            </View>
        </View>
    );
}

// ---------------------------------------------------------------------------
// Dice tray
// ---------------------------------------------------------------------------

function TrayDie({
    die,
    drag,
    ghosted,
}: {
    die: HazardDieVM;
    drag: DragController;
    ghosted: boolean;
}) {
    const styles = useStyles();
    const pan = Gesture.Pan()
        .enabled(die.usable)
        .minDistance(6)
        .onStart((e) => {
            runOnJS(drag.begin)({ type: 'die', dieId: die.id, die }, e.absoluteX, e.absoluteY);
        })
        .onUpdate((e) => {
            runOnJS(drag.move)(e.absoluteX, e.absoluteY);
        })
        .onEnd((e) => {
            runOnJS(drag.end)(e.absoluteX, e.absoluteY);
        })
        .onFinalize((e, success) => {
            if (!success) runOnJS(drag.end)(-1, -1);
        });
    return (
        <GestureDetector gesture={pan}>
            <Animated.View
                layout={LinearTransition.duration(180)}
                entering={FadeIn.duration(220)}
                style={{ opacity: ghosted ? 0.25 : 1 }}
                testID={`hazard-die-${die.id}`}
                accessible
                accessibilityLabel={die.accessibilityLabel}
            >
                <HazardDie kind={die.kind} size={42} state={die.state} glow={die.usable} temporary={die.temporary} />
                {die.temporary && <Text style={styles.dieTag}>CONJURED</Text>}
            </Animated.View>
        </GestureDetector>
    );
}

// ---------------------------------------------------------------------------
// APPLY button — under each staged card. Commits the card (fires its
// utility, locks it). Once applied it reads LOCKED and can't be undone.
// ---------------------------------------------------------------------------

function ApplyButton({ card, onApply }: { card: HazardCardVM; onApply: (uid: string) => void }) {
    const AXM = usePalette();
    const styles = useStyles();
    if (card.applied) {
        return (
            <View style={[styles.applyBtn, styles.applyLocked]} testID={`hazard-applied-${card.uid}`}>
                <Text style={styles.applyLockedText}>✓ LOCKED</Text>
            </View>
        );
    }
    const armed = card.dieAvailable || card.poweredByDieId !== null;
    return (
        <Pressable
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => undefined);
                onApply(card.uid);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Apply ${card.name} — locks it in${card.poweredByDieId ? ', powered' : ''}`}
            testID={`hazard-apply-${card.uid}`}
            style={[styles.applyBtn, { borderColor: armed ? HZ.acid : AXM.bone }]}
        >
            <Text style={[styles.applyText, { color: armed ? HZ.acid : AXM.parchment }]}>APPLY</Text>
        </Pressable>
    );
}

// ---------------------------------------------------------------------------
// CHOOSE toggle — under a powered CHOOSE card (TWIN PATHS). Picks the meter
// its surge value feeds. Hidden once applied.
// ---------------------------------------------------------------------------

function ChooseToggle({ card, onChoose }: { card: HazardCardVM; onChoose: (uid: string, key: 'force' | 'escape') => void }) {
    const AXM = usePalette();
    const styles = useStyles();
    if (!card.choose || card.poweredByDieId === null || card.applied) return null;
    const opt = (key: 'force' | 'escape', label: string) => {
        const on = card.chosenKey === key;
        const accent = TYPE_ACCENT[key];
        return (
            <Pressable
                key={key}
                onPress={() => {
                    Haptics.selectionAsync().catch(() => undefined);
                    onChoose(card.uid, key);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`Send TWIN PATHS into ${label}${on ? ', selected' : ''}`}
                testID={`hazard-choose-${card.uid}-${key}`}
                style={[styles.chooseBtn, { borderColor: on ? accent : AXM.ash, backgroundColor: on ? `${accent}28` : 'rgba(0,0,0,0.4)' }]}
            >
                <Text style={[styles.chooseText, { color: on ? accent : AXM.bone }]}>{label}</Text>
            </Pressable>
        );
    };
    return (
        <View style={styles.chooseRow} testID={`hazard-choose-${card.uid}`}>
            {opt('force', 'FOR')}
            {opt('escape', 'ESC')}
        </View>
    );
}

// ---------------------------------------------------------------------------
// ENCHANTMENTS strip — persistent auras + a primed gold VOW (design §6).
// ---------------------------------------------------------------------------

function EnchantStrip({ vm }: { vm: HazardViewModel }) {
    const styles = useStyles();
    if (vm.enchantments.length === 0 && vm.goldVowNote === null) return null;
    return (
        <View style={styles.enchantPanel} testID="hazard-enchantments">
            <Text style={styles.enchantHead}>✦ ENCHANTMENTS</Text>
            <View style={styles.enchantRow}>
                {vm.enchantments.map((e) => (
                    <Text key={e.id} style={styles.enchantChip}>{e.label}</Text>
                ))}
                {vm.goldVowNote !== null && (
                    <Text style={[styles.enchantChip, styles.vowChip]}>{vm.goldVowNote}</Text>
                )}
            </View>
        </View>
    );
}

// ---------------------------------------------------------------------------
// OBJECTIVES strip — the rolled sub-quests with live status + bonus.
// ---------------------------------------------------------------------------

const QUEST_GLYPH: Record<string, string> = { active: '○', done: '✓', failed: '✕' };

function SubquestStrip({ vm }: { vm: HazardViewModel }) {
    const AXM = usePalette();
    const styles = useStyles();
    if (vm.subquests.length === 0) return null;
    return (
        <View style={styles.questPanel} testID="hazard-subquests">
            <Text style={styles.questHead}>✷ OBJECTIVES — BONUS ON A CLEAR</Text>
            <View style={styles.questRow}>
                {vm.subquests.map((q) => {
                    const tone =
                        q.status === 'done' ? HZ.acid : q.status === 'failed' ? AXM.ash : AXM.bone;
                    return (
                        <View
                            key={q.id}
                            style={[styles.questChip, { borderColor: `${tone}77` }]}
                            testID={`hazard-subquest-${q.id}`}
                            accessible
                            accessibilityLabel={`Objective: ${q.desc} Reward ${q.rewardLabel}. ${q.status}.`}
                        >
                            <Text style={[styles.questName, { color: tone }]}>
                                {QUEST_GLYPH[q.status]} {q.name}
                            </Text>
                            <Text style={styles.questDesc} numberOfLines={2}>{q.desc}</Text>
                            <Text style={[styles.questReward, { color: q.status === 'failed' ? AXM.ash : HZ.gold }]}>
                                {q.rewardLabel}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

// ---------------------------------------------------------------------------
// PLAY button — translucent sulfur glow, pulsing when armed.
// ---------------------------------------------------------------------------

function PlayButton({ enabled, subLabel, onPress }: { enabled: boolean; subLabel: string; onPress: () => void }) {
    const AXM = usePalette();
    const styles = useStyles();
    const pulse = useSharedValue(0);
    React.useEffect(() => {
        pulse.value = enabled
            ? withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0, { duration: 900 })), -1)
            : withTiming(0, { duration: 200 });
    }, [enabled, pulse]);
    const glow = useAnimatedStyle(() => ({
        shadowOpacity: enabled ? 0.35 + pulse.value * 0.45 : 0,
    }));
    return (
        <Animated.View style={[styles.playWrap, glow]}>
            <Pressable
                disabled={!enabled}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityState={{ disabled: !enabled }}
                accessibilityLabel={enabled ? 'Play — commit every staged card and resolve the round' : 'Play, disabled. Stage at least one card first.'}
                testID="hazard-play-button"
                style={[
                    styles.playBtn,
                    {
                        borderColor: enabled ? AXM.sulfur : AXM.ash,
                        backgroundColor: enabled ? 'rgba(212,192,38,0.16)' : 'rgba(0,0,0,0.4)',
                    },
                ]}
            >
                <Text style={[styles.playText, { color: enabled ? AXM.sulfur : AXM.bone }]}>PLAY</Text>
                <Text style={[styles.playSub, { color: enabled ? AXM.sulfur : AXM.bone }]}>{subLabel}</Text>
            </Pressable>
        </Animated.View>
    );
}

// ---------------------------------------------------------------------------
// The board
// ---------------------------------------------------------------------------

export interface HazardBoardProps {
    vm: HazardViewModel;
    drag: DragController;
    onStage: (uid: string) => void;
    onUnstage: (uid: string) => void;
    onPower: (uid: string, dieId: string) => void;
    onApply: (uid: string) => void;
    onDiscard: (uid: string) => void;
    onChoose: (uid: string, key: 'force' | 'escape') => void;
    onResolve: () => void;
    onInspect: (card: HazardCardVM) => void;
}

export const HazardBoard = React.memo(function HazardBoard({ vm, drag, onStage, onUnstage, onPower, onApply, onDiscard, onChoose, onResolve, onInspect }: HazardBoardProps) {
    const AXM = usePalette();
    const styles = useStyles();
    const playAreaRef = useRef<View | null>(null);
    const trashRef = useRef<View | null>(null);
    const stagedRefs = useRef(new Map<string, View | null>());

    // Drop resolution: called by the screen-level drag controller when a
    // gesture ends. Coordinates are window-absolute.
    const resolveDrop = useCallback(
        async (payload: DragPayload, x: number, y: number) => {
            if (x < 0 && y < 0) return; // cancelled gesture
            // Discard is HAND-ONLY: a hand card dropped on the trash bin
            // scraps for salvage. The bin gets a generous pad.
            if (payload.type === 'card' && payload.from === 'hand') {
                const trashRect = await measureRect(trashRef);
                if (rectContains(trashRect, x, y, 18)) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
                    onDiscard(payload.uid);
                    return;
                }
                const playRect = await measureRect(playAreaRef);
                if (rectContains(playRect, x, y)) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
                    onStage(payload.uid);
                } else {
                    // an aborted drag reads the card — matches the prototype
                    onInspect(payload.card);
                }
                return;
            }
            if (payload.type === 'card' && payload.from === 'play') {
                const playRect = await measureRect(playAreaRef);
                if (!rectContains(playRect, x, y)) onUnstage(payload.uid);
                return;
            }
            if (payload.type === 'die') {
                // 1) Direct hit anywhere on a staged card frame (generous pad)
                //    that isn't already applied and can take this die.
                let onCard: string | null = null;
                for (const [uid, node] of stagedRefs.current) {
                    if (!node) continue;
                    const rect = await measureRect({ current: node });
                    if (rectContains(rect, x, y, 14)) {
                        onCard = uid;
                        break;
                    }
                }
                // 2) Forgiveness: a die dropped loosely in the play area, when
                //    exactly one staged card can still take it, lands there.
                if (onCard === null) {
                    const playRect = await measureRect(playAreaRef);
                    if (rectContains(playRect, x, y)) {
                        const takers = vm.play.filter(
                            (p) => !p.applied && dieFits(payload.die.kind, p),
                        );
                        if (takers.length === 1) onCard = takers[0].uid;
                    }
                }
                if (onCard !== null) {
                    const target = vm.play.find((p) => p.uid === onCard);
                    const ok = target && !target.applied && dieFits(payload.die.kind, target);
                    if (ok) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
                        onPower(onCard, payload.dieId);
                    } else {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
                    }
                }
            }
        },
        [onStage, onUnstage, onPower, onDiscard, onInspect, vm.play],
    );

    // Expose drop resolution to the screen-level controller.
    (drag as DragController & { resolveDrop?: typeof resolveDrop }).resolveDrop = resolveDrop;

    const handCardGesture = (card: HazardCardVM) => {
        const pan = Gesture.Pan()
            .minDistance(10)
            .onStart((e) => {
                runOnJS(drag.begin)({ type: 'card', from: 'hand', uid: card.uid, card }, e.absoluteX, e.absoluteY);
            })
            .onUpdate((e) => {
                runOnJS(drag.move)(e.absoluteX, e.absoluteY);
            })
            .onEnd((e) => {
                runOnJS(drag.end)(e.absoluteX, e.absoluteY);
            })
            .onFinalize((e, success) => {
                if (!success) runOnJS(drag.end)(-1, -1);
            });
        const tap = Gesture.Tap()
            .maxDistance(9)
            .onEnd(() => {
                runOnJS(onInspect)(card);
            });
        return Gesture.Exclusive(pan, tap);
    };

    const stagedCardGesture = (card: HazardCardVM) => {
        const pan = Gesture.Pan()
            .enabled(!card.applied)
            .minDistance(10)
            .onStart((e) => {
                runOnJS(drag.begin)({ type: 'card', from: 'play', uid: card.uid, card }, e.absoluteX, e.absoluteY);
            })
            .onUpdate((e) => {
                runOnJS(drag.move)(e.absoluteX, e.absoluteY);
            })
            .onEnd((e) => {
                runOnJS(drag.end)(e.absoluteX, e.absoluteY);
            })
            .onFinalize((e, success) => {
                if (!success) runOnJS(drag.end)(-1, -1);
            });
        const tap = Gesture.Tap()
            .enabled(!card.applied)
            .maxDistance(9)
            .onEnd(() => {
                runOnJS(onUnstage)(card.uid);
            });
        return Gesture.Exclusive(pan, tap);
    };

    const routeBadgeColor = vm.routeKey ? routeAccent(AXM)[vm.routeKey] : AXM.bone;
    const n = vm.hand.length;
    const mid = (n - 1) / 2;
    const overlap = n > 6 ? 56 : n > 4 ? 42 : 24;
    // Fanned-hand arch (tunable). Always applied so the hand never renders
    // as a flat line; tightened a touch once the hand grows past the cap.
    const ARCH = HAZARD_TUNING.hand;
    const archScale = n > ARCH.tightenAbove ? ARCH.tightenScale : 1;
    const archLift = ARCH.archLiftPerStep * archScale;
    const archRotate = ARCH.archRotatePerStep * archScale;


    return (
        <View style={styles.root} testID="hazard-board">
            {/* header — title, route badge, round, O/X ledger */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>{vm.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <Text style={[styles.routeBadge, { backgroundColor: routeBadgeColor }]}>{vm.routeLabel}</Text>
                        <Text style={styles.roundLabel}>{vm.roundLabel}</Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 5 }} testID="hazard-ledger">
                    {vm.marks.map((m, i) => (
                        <LedgerMark key={i} kind={m} size={22} />
                    ))}
                </View>
            </View>

            {/* crisis scene strip */}
            <View style={styles.scene}>
                <Cracks seed={7} opacity={0.6} />
                <Text style={styles.sceneTitle}>{vm.boardHeadline}</Text>
                <Text style={styles.sceneNote}>— {vm.boardNote}</Text>
            </View>

            <LiveMeter vm={vm} />

            <EnchantStrip vm={vm} />

            <SubquestStrip vm={vm} />

            {/* dice tray */}
            <View style={styles.tray}>
                <View style={styles.trayHead}>
                    <Text style={styles.trayLabel}>⬡ MANA DICE — DRAG ONTO A MATCHING CARD</Text>
                    <Text style={styles.trayCount}>
                        <Text style={{ color: vm.diceReady > 0 ? HZ.acid : AXM.bone }}>{vm.diceReady} READY</Text>
                        {vm.hexCount > 0 && <Text style={{ color: HZ.purple }}> · {vm.hexCount} ✕</Text>}
                    </Text>
                </View>
                <View style={styles.trayDice} testID="hazard-dice-tray">
                    {vm.dice.map((die) => (
                        <TrayDie
                            key={die.id}
                            die={die}
                            drag={drag}
                            ghosted={drag.active?.type === 'die' && drag.active.dieId === die.id}
                        />
                    ))}
                </View>
            </View>

            {/* play area */}
            <View
                ref={playAreaRef}
                style={[styles.playArea, { borderColor: vm.play.length ? `${HZ.acid}88` : AXM.ash }]}
                testID="hazard-play-area"
            >
                <View style={styles.playHead}>
                    <Text style={[styles.playLabel, { color: vm.play.length ? HZ.acid : AXM.bone }]}>
                        PLAY AREA — {vm.play.length} STAGED
                    </Text>
                    <Text style={styles.deckCounts} testID="hazard-deck-counts">
                        DECK {vm.deckCount} · DISCARD {vm.discardCount}
                    </Text>
                </View>
                {vm.play.length === 0 ? (
                    <View style={styles.playEmpty}>
                        <Text style={styles.playEmptyText}>drag cards up from your hand</Text>
                    </View>
                ) : (
                    <View style={styles.playCards}>
                        {vm.play.map((card) => (
                            <View key={card.uid} style={styles.stagedCol}>
                                <GestureDetector gesture={stagedCardGesture(card)}>
                                    <Animated.View
                                        ref={(node) => {
                                            stagedRefs.current.set(card.uid, node as unknown as View | null);
                                        }}
                                        entering={FadeInDown.duration(200)}
                                        layout={LinearTransition.duration(180)}
                                        style={{
                                            opacity:
                                                drag.active?.type === 'card' && drag.active.uid === card.uid ? 0.3 : 1,
                                        }}
                                        testID={`hazard-staged-${card.uid}`}
                                        accessible
                                        accessibilityRole="button"
                                        accessibilityLabel={`${card.name}, ${card.kind} card staged for play. ${card.applied ? 'Applied and locked. ' : card.poweredByDieId ? 'Powered by mana die. ' : 'Drop a die anywhere on it to power it. '}${card.powered.force || card.powered.escape ? `Will provide: ${card.powered.force} force, ${card.powered.escape} escape.` : ''}`}
                                        accessibilityHint={card.applied ? 'Locked in' : 'Tap to return to hand, or drag a die onto the card to power it, then Apply'}
                                    >
                                        <HazardCard card={card} mode="play" />
                                    </Animated.View>
                                </GestureDetector>
                                <ApplyButton card={card} onApply={onApply} />
                                <ChooseToggle card={card} onChoose={onChoose} />
                            </View>
                        ))}
                    </View>
                )}
                <Text style={styles.playHint}>drop dice to power cards — PLAY commits and resolves the whole set</Text>
            </View>

            {/* hand dock + trash bin + PLAY button */}
            <View style={styles.dock}>
                {/* trash bin — drag a card here to scrap it for its SALVAGE */}
                <View
                    ref={trashRef}
                    style={[
                        styles.trashBin,
                        drag.active?.type === 'card'
                            ? { borderColor: AXM.blood, backgroundColor: AXM.bloodSubtle, borderStyle: 'solid' }
                            : null,
                    ]}
                    testID="hazard-trash"
                    accessible
                    accessibilityLabel="Trash bin. Drag a card here to discard it for its salvage benefit."
                >
                    <TrashGlyph size={22} color={drag.active?.type === 'card' ? AXM.blood : AXM.bone} />
                    <Text
                        style={[
                            styles.trashLabel,
                            drag.active?.type === 'card' ? { color: AXM.blood } : null,
                        ]}
                    >
                        SCRAP
                    </Text>
                </View>
                <View style={styles.fan} testID="hazard-hand">
                    {vm.hand.map((card, i) => (
                        <GestureDetector key={card.uid} gesture={handCardGesture(card)}>
                            <Animated.View
                                entering={FadeIn.duration(200)}
                                layout={LinearTransition.duration(180)}
                                style={{
                                    marginLeft: i === 0 ? 0 : -overlap,
                                    zIndex: drag.active?.type === 'card' && drag.active.uid === card.uid ? 30 : i,
                                    opacity: drag.active?.type === 'card' && drag.active.uid === card.uid ? 0.3 : 1,
                                    transform: [
                                        { translateY: Math.abs(i - mid) * archLift },
                                        { rotate: `${(i - mid) * archRotate}deg` },
                                    ],
                                }}
                                testID={`hazard-hand-${card.uid}`}
                                accessible
                                accessibilityRole="button"
                                accessibilityLabel={`${card.name}, ${card.kind} card in hand. ${card.powered.force || card.powered.escape ? `Powered: ${card.powered.force} force, ${card.powered.escape} escape. ` : ''}${card.free.force || card.free.escape ? `Free: ${card.free.force} force, ${card.free.escape} escape. ` : ''}`}
                                accessibilityHint="Drag up to stage this card, or tap to read details"
                            >
                                <HazardCard card={card} mode="hand" />
                            </Animated.View>
                        </GestureDetector>
                    ))}
                </View>
                <PlayButton enabled={vm.resolveEnabled} subLabel={vm.resolveSubLabel} onPress={onResolve} />
            </View>
        </View>
    );
});

const useStyles = makeStyles((AXM) => ({
    root: { flex: 1, backgroundColor: '#0c0a08' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 9,
        borderBottomWidth: 1,
        borderBottomColor: AXM.ash,
    },
    headerTitle: { fontFamily: FONTS.gothic, fontSize: 16, lineHeight: 17, color: AXM.parchment, letterSpacing: 0.5 },
    routeBadge: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.4, color: AXM.bg, paddingHorizontal: 5, paddingVertical: 1, overflow: 'hidden' },
    roundLabel: { fontFamily: FONTS.mono, fontSize: 12, color: AXM.bone, letterSpacing: 1 },
    scene: { height: 64, overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: AXM.ash, backgroundColor: HZ.stone, alignItems: 'center', justifyContent: 'center' },
    sceneTitle: { fontFamily: FONTS.gothic, fontSize: 19, color: AXM.parchment, letterSpacing: 1, textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 0 },
    sceneNote: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 12, color: AXM.bone, marginTop: 1 },
    meterPanel: { paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(6,5,4,0.82)', borderBottomWidth: 1, borderBottomColor: AXM.ash },
    meterHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 },
    meterLabel: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1.4 },
    meterValue: { fontFamily: FONTS.mono, fontSize: 14 },
    segRow: { flexDirection: 'row', gap: 2, height: 13 },
    seg: { flex: 1, borderWidth: 1 },
    bothRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 5 },
    bothLine: { flex: 1, height: 1, backgroundColor: AXM.ash },
    bothText: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 2, color: AXM.sulfur },
    meterDetail: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.bone, letterSpacing: 0.6, marginTop: 3 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    ladderText: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone, letterSpacing: 0.8 },
    momentum: { fontFamily: FONTS.mono, fontSize: 11, color: HZ.gold, letterSpacing: 0.6 },
    tray: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6, backgroundColor: 'rgba(0,0,0,0.35)' },
    trayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
    trayLabel: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.2, color: AXM.bone },
    trayCount: { fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 1 },
    trayDice: { flexDirection: 'row', gap: 14, justifyContent: 'center', alignItems: 'flex-end', minHeight: 64 },
    dieTag: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone, letterSpacing: 0.5, textAlign: 'center', marginTop: 2 },
    playArea: { flex: 1, marginHorizontal: 10, marginVertical: 8, borderWidth: 1.5, borderStyle: 'dashed', backgroundColor: 'rgba(134,168,33,0.04)', paddingHorizontal: 8, paddingVertical: 7 },
    playHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
    playLabel: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.2 },
    deckCounts: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone, letterSpacing: 1 },
    playEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    playEmptyText: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 14, color: AXM.ash },
    playCards: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, justifyContent: 'center', alignContent: 'flex-start' },
    stagedCol: { alignItems: 'center', gap: 3 },
    applyBtn: {
        width: 70,
        borderWidth: 1.5,
        borderColor: AXM.bone,
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingVertical: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyText: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1.6, color: AXM.parchment },
    applyLocked: { borderColor: HZ.acidDim, backgroundColor: 'rgba(134,168,33,0.16)' },
    applyLockedText: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.2, color: HZ.acid },
    chooseRow: { flexDirection: 'row', gap: 3, width: 70 },
    chooseBtn: { flex: 1, borderWidth: 1, paddingVertical: 2, alignItems: 'center', justifyContent: 'center' },
    chooseText: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1 },
    enchantPanel: { paddingHorizontal: 12, paddingVertical: 5, backgroundColor: 'rgba(138,87,189,0.12)', borderBottomWidth: 1, borderBottomColor: AXM.ash },
    enchantHead: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.4, color: HZ.purple, marginBottom: 3 },
    enchantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
    enchantChip: { fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.4, color: AXM.parchment, backgroundColor: 'rgba(138,87,189,0.28)', borderWidth: 1, borderColor: `${HZ.purple}77`, paddingHorizontal: 5, paddingVertical: 1, overflow: 'hidden' },
    vowChip: { color: HZ.gold, backgroundColor: 'rgba(194,161,78,0.22)', borderColor: `${HZ.gold}88` },
    questPanel: { paddingHorizontal: 12, paddingVertical: 5, backgroundColor: 'rgba(212,192,38,0.07)', borderBottomWidth: 1, borderBottomColor: AXM.ash },
    questHead: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.4, color: AXM.sulfur, marginBottom: 3 },
    questRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
    questChip: { flexGrow: 1, flexBasis: '30%', borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 5, paddingVertical: 3 },
    questName: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 0.8 },
    questDesc: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone, letterSpacing: 0.2, marginTop: 1 },
    questReward: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 0.4, marginTop: 2 },
    playHint: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone, letterSpacing: 1, textAlign: 'center', marginTop: 4 },
    dock: { height: 164, borderTopWidth: 1, borderTopColor: AXM.ash },
    trashBin: {
        position: 'absolute',
        left: 8,
        bottom: 10,
        zIndex: 40,
        width: 66,
        height: 66,
        borderRadius: 33,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: AXM.ash,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    trashLabel: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: AXM.bone, marginTop: 1 },
    fan: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 8 },
    playWrap: {
        position: 'absolute',
        right: 10,
        bottom: 12,
        zIndex: 40,
        shadowColor: AXM.sulfur,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 0 },
        elevation: 8,
    },
    playBtn: { width: 78, height: 78, borderRadius: 39, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
    playText: { fontFamily: FONTS.gothic, fontSize: 17, letterSpacing: 1, lineHeight: 18 },
    playSub: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, marginTop: 2 },
}));
