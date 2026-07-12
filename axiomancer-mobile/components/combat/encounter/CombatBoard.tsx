/**
 * Spec 26 / 26b — the Combat board (HP model + drag-to-power UX), rebuilt to the
 * combat-screen-polish 2026-07 layout (design/combat-screen-polish-2026-07.md).
 *
 * The interaction model is unchanged:
 *   1. drag a card UP into the play region to STAGE it (drag to SCRAP to discard);
 *   2. drag a DIE onto the staged card to power it (the die is *selected*, not
 *      yet committed — you can re-drag a different die);
 *   3. read the card's live keyword line (the stance-read + projected hit);
 *   4. tap APPLY (the ribbon fused to the staged card) to commit.
 * A landed status refreshes the drafted die (the combo loop): it returns to the
 * tray draggable ("↻ AGAIN") and can power ANOTHER card via an explicit re-drop.
 * It never auto-attaches to the next staged card — that was the stale-powered
 * bug ("the NEXT card appears powered", owner playtest 2026-07-12).
 *
 * The housing is new — a full-bleed battlefield with floating chrome:
 *   battlefield + top HUD      → CombatCombatantPane (absolute-fill overlay)
 *   play region                → invisible drop target; dashed affordance only
 *                                while a card drag is live; staged cards float
 *   signature rune column      → left edge (conviction chip + circular runes)
 *   dice row                   → free-floating gem dice above the hand
 *   hand fan                   → edge-to-edge arc, bottoms cropped off-screen
 *   corner medallions          → player portrait (tap = pilgrim modal) · END PHASE
 *   bottom rail                → ♥ HP · phase ledger · deck/discard counts
 *
 * The drag ghost renders at screen level in `CombatEncounterPanel`.
 */

import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    FadeIn, FadeInDown, LinearTransition, runOnJS,
    useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming,
    type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import type {
    CombatViewModel, CombatCardVM, CombatDieVM,
    CombatSignatureVM, CombatEffectChipVM, CombatCardFaceVM, CombatPerorationVM,
} from '@/state/presenters/combat-encounter.engine';
import { armedReadValue, dieCanPowerCardVM, STANCE_COLORS } from '@/state/presenters/combat-encounter.engine';
import { wheelNext, type WheelStance } from '@/state/combat/momentum';
import type { CombatReadResult } from '@mechanics';
import { TrashGlyph, LedgerMark } from '@/components/hazard/glyphs';
import { CombatCombatantPane, EffectChips, PlayerMedallion, COMBAT_HUD_HEIGHT, type CombatFx } from './CombatCombatantPane';
import { CombatDie } from './CombatDie';

// Per-card art registry (temp art pass) — keyed by cardId, falls back to the
// circe placeholder for unmapped ids. Stance tint + glyph still ride on top.
import { getCardArt } from '@/assets/images/cards';

// ── Drag plumbing (cards AND dice) ───────────────────────────────────────────

export type DragPayload =
    | { type: 'card'; from: 'hand' | 'play'; uid: string; card: CombatCardVM }
    | { type: 'die'; dieId: string; die: CombatDieVM };

export interface DragController {
    begin: (payload: DragPayload, x: number, y: number) => void;
    end: (x: number, y: number) => void;
    active: DragPayload | null;
    /** Ghost position shared values — written DIRECTLY from the gesture worklet
     *  every frame (no runOnJS hop; a per-frame UI→JS round-trip made card drags
     *  stutter whenever the JS thread was busy). begin/end still cross to JS once. */
    x: SharedValue<number>;
    y: SharedValue<number>;
    /** Screen rects of every drop-INELIGIBLE staged card for the die drag in
     *  flight (off-color or already armed). Measured once at die-drag begin by
     *  the board; the panel's drag ghost derives its ✕ "can't land here" cue
     *  from pointer-in-rect per frame on the UI thread. Optional — mock drag
     *  controllers in tests omit it. */
    badRects?: SharedValue<Rect[]>;
}

export interface Rect { x: number; y: number; width: number; height: number; }
function rectContains(r: Rect | null, x: number, y: number, pad = 0): boolean {
    if (!r) return false;
    return x >= r.x - pad && x <= r.x + r.width + pad && y >= r.y - pad && y <= r.y + r.height + pad;
}
function measureRect(ref: React.RefObject<View | null>): Promise<Rect | null> {
    return new Promise((resolve) => {
        const node = ref.current;
        if (!node) { resolve(null); return; }
        node.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
    });
}

/**
 * Pure die-drop targeting (unit-testable; `resolveDrop` feeds it the
 * measurements). `hitUid` is the staged card the pointer released over (null =
 * a loose drop); `inPlayArea` is whether the release landed inside the play
 * region. Enforces THE COLOR LAW (see `dieCanPowerCardVM` — the engine's
 * `playCombatCard` gate, combat.engine.ts ~:1339) AND the one-die-per-card
 * staging law (owner directive 2026-07-12) at the drop itself:
 *   · a direct hit on an ineligible card — off-color, OR already carrying a
 *     dropped die — REJECTS (returns null: the die snaps home, nothing is
 *     selected, no fizzle can ever reach the engine);
 *   · the loose-drop forgiveness only ever lands on a color-legal card that
 *     is not already armed.
 */
export function resolveDieDropTarget(
    die: { color: string; isX?: boolean },
    hitUid: string | null,
    inPlayArea: boolean,
    stagedUids: string[],
    stanceOf: (uid: string) => string | undefined,
    pendingByUid: Record<string, string>,
): string | null {
    const legal = (uid: string) => {
        const stance = stanceOf(uid);
        return !!stance && dieCanPowerCardVM(die, stance) && !pendingByUid[uid];
    };
    if (hitUid) return legal(hitUid) ? hitUid : null;
    if (!inPlayArea) return null;
    const eligible = stagedUids.filter(legal);
    return eligible[0] ?? null;
}

const READ_ACCENT: Record<string, string> = {
    advantage: '#5bbf6a', neutral: '#c2a14e', disadvantage: '#e2543b', none: '#8a8273',
};

// Render a sentence with each keyword name BOLDED (Sanguine-Step style). Shared by
// the large inspect card FACE (here) and the inspect modal (CombatEncounterPanel).
export function OutcomeText({ text, names, base, bold }: { text: string; names: string[]; base: StyleProp<TextStyle>; bold: StyleProp<TextStyle> }) {
    const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).filter(Boolean);
    if (escaped.length === 0) return <Text style={base}>{text}</Text>;
    const upper = new Set(names.map((n) => n.toUpperCase()));
    const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'gi'));
    return (
        <Text style={base}>
            {parts.map((p, i) => (upper.has(p.toUpperCase()) ? <Text key={i} style={bold}>{p}</Text> : <Text key={i}>{p}</Text>))}
        </Text>
    );
}

// ── Signature rune column (left edge) ────────────────────────────────────────

function SignatureColumn({ conviction, signatures, onCast, onInfo }: {
    conviction: number;
    signatures: CombatSignatureVM[];
    onCast: (id: string) => void;
    onInfo?: (s: CombatSignatureVM) => void;
}) {
    const AXM = usePalette();
    const styles = useStyles();
    return (
        <View style={styles.sigColumn} testID="combat-signature-bar" pointerEvents="box-none">
            <View
                style={styles.convictionChip}
                testID="combat-conviction"
                accessible
                accessibilityRole="text"
                accessibilityLabel={`${conviction} conviction`}
            >
                <Text style={[styles.convictionText, { color: AXM.sulfur }]} allowFontScaling={false}>◆ {conviction}</Text>
            </View>
            {signatures.map((s) => (
                <Pressable
                    key={s.id}
                    // NOT disabled while unaffordable — a tap then opens the info popup
                    // instead of casting, and a long-press explains any rune.
                    onPress={() => {
                        if (s.affordable) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined); onCast(s.id); }
                        else onInfo?.(s);
                    }}
                    onLongPress={() => onInfo?.(s)}
                    delayLongPress={350}
                    testID={`combat-signature-${s.id}`}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !s.affordable }}
                    accessibilityLabel={`${s.name}, costs ${s.cost} conviction. ${s.description}${s.affordable ? '' : ' — not enough conviction'}`}
                    accessibilityHint="Long press for details"
                    style={[styles.sigRune, { borderColor: s.affordable ? AXM.sulfur : AXM.ash, opacity: s.affordable ? 1 : 0.55 }]}
                >
                    <Text style={[styles.sigRuneIcon, { color: s.affordable ? AXM.sulfur : AXM.bone }]}>{s.icon}</Text>
                    <View style={styles.sigCostBadge}>
                        <Text style={[styles.sigCostText, { color: s.affordable ? AXM.sulfur : AXM.ash }]} allowFontScaling={false}>◆{s.cost}</Text>
                    </View>
                </Pressable>
            ))}
        </View>
    );
}

// ── Dice row (free-floating gems above the hand) ─────────────────────────────

function DiceRow({
    vm, dieGesture, draggingDieId, assignedDieIds, onFateTap, bankSpare, onToggleBankSpare,
}: {
    vm: CombatViewModel;
    dieGesture: (die: CombatDieVM) => ReturnType<typeof Gesture.Exclusive>;
    draggingDieId: string | null;
    assignedDieIds: Set<string>;
    onFateTap?: (dieId: string) => void;
    bankSpare?: boolean;
    onToggleBankSpare?: () => void;
}) {
    const AXM = usePalette();
    const styles = useStyles();
    return (
        <View style={styles.diceRow} testID="combat-dice-tray" pointerEvents="box-none">
            {vm.dice.map((die) => {
                // Fate Engine P1 — a Reserve die is a SECOND power source: draggable
                // onto a card any time (the single-die law still holds per play).
                // Spec 32 v3 §5 — a FLOATING die likewise bypasses the one-die
                // draft: draggable whenever it is unspent, drafted or not.
                // Presenter-computed (CombatDieVM.draggable) so it can never flip
                // while the die's own drag is live — that unmounted the
                // GestureDetector mid-gesture, which on web killed the pan without
                // onEnd/onFinalize: the drop never resolved and the ghost stuck.
                const draggable = die.draggable;
                const isAssigned = assignedDieIds.has(die.id);
                // R4 — a dead X face is never dead: tap it to advance the strongest
                // enemy DoT (or bank +1 Conviction), once per turn.
                if (die.isX) {
                    return die.fateTappable && onFateTap ? (
                        <Pressable
                            key={die.id}
                            onPress={() => onFateTap(die.id)}
                            style={[styles.dieXPip, { borderColor: AXM.sulfur }]}
                            accessibilityRole="button"
                            accessibilityLabel="Fate die — tap to advance the strongest enemy status (or bank Conviction)"
                            testID={`combat-fate-tap-${die.id}`}
                        >
                            <Text style={[styles.dieXGlyph, { color: AXM.sulfur }]}>✕</Text>
                            <Text style={styles.dieFateHint}>TAP</Text>
                        </Pressable>
                    ) : (
                        <View key={die.id} style={styles.dieXPip} accessible accessibilityLabel="X die — spent this turn">
                            <Text style={styles.dieXGlyph}>✕</Text>
                        </View>
                    );
                }
                const node = (
                    <View style={isAssigned ? styles.dieAssigned : undefined}>
                        <CombatDie die={die} size={54} dimmed={(!die.reserve && !die.floating && vm.hasDraft && !die.drafted) || draggingDieId === die.id} />
                        {die.reserve ? (
                            <Text style={[styles.dieConv, { color: AXM.sulfur }]} testID={`combat-reserve-${die.id}`}>
                                ⏳{die.pips ? ` +${die.pips}✦` : ''} BANKED
                            </Text>
                        ) : null}
                        {die.floating ? (
                            <Text style={[styles.dieConv, { color: AXM.sulfur }]} testID={`combat-floating-${die.id}`}>
                                ✦ FLOATING
                            </Text>
                        ) : null}
                        {draggable && !die.reserve && !die.floating && die.readPip && die.readPip !== 'none' ? (
                            <Text style={[styles.diePip, { color: READ_ACCENT[die.readPip] }]}>
                                {die.readPip === 'advantage' ? '▲ ADV' : die.readPip === 'disadvantage' ? '▼ DIS' : '— EVEN'}
                            </Text>
                        ) : null}
                        {/* P2 — the spare was already converted at draft; the old
                            future-tense "→ +1 ◆" lied. State it in the past. */}
                        {!die.reserve && !die.floating && vm.hasDraft && !die.drafted && <Text style={styles.dieConv}>burned +1 ◆</Text>}
                        {/* A REFRESHED combo die is live again — it reads as a
                            re-draggable die, not as the locked STANCE draft
                            (stale-powered fix, 2026-07-12). */}
                        {die.drafted && (
                            <Text style={[styles.dieConv, { color: AXM.sulfur }]} testID={die.refreshed ? `combat-refreshed-${die.id}` : undefined}>
                                {die.spent ? 'SPENT' : die.refreshed ? '↻ AGAIN' : 'STANCE'}
                            </Text>
                        )}
                    </View>
                );
                return draggable ? (
                    <GestureDetector key={die.id} gesture={dieGesture(die)}>
                        <Animated.View>
                            {node}
                        </Animated.View>
                    </GestureDetector>
                ) : (
                    <View key={die.id}>{node}</View>
                );
            })}
            {/* R3 — BANK-OR-BURN made visible: the spare (undrafted) die's two lives. */}
            {!vm.hasDraft && vm.diceRolled && vm.reserveRoom && onToggleBankSpare ? (
                <Pressable
                    onPress={onToggleBankSpare}
                    style={[styles.bankChip, bankSpare && { borderColor: AXM.sulfur }]}
                    accessibilityRole="button"
                    accessibilityLabel={bankSpare ? 'Spare die will be banked to the Reserve' : 'Spare die will burn for one Conviction'}
                    testID="combat-bank-toggle"
                >
                    <Text style={[styles.bankChipText, bankSpare && { color: AXM.sulfur }]}>
                        {bankSpare ? 'spare → BANK ⏳' : 'spare → +1 ◆'}
                    </Text>
                </Pressable>
            ) : null}
        </View>
    );
}

// ── Staged card (die socket · fused APPLY ribbon) ────────────────────────────

const StagedCard = React.memo(function StagedCard({
    card, assignedDie, read, onApply, gesture, register, compact = false, popKey = 0, socketPulse = false,
    dropIneligible = false, chosenX = null, onChangeX, rejectKey = 0, freeProminent = false,
}: {
    card: CombatCardVM;
    assignedDie: CombatDieVM | null;
    read: string;
    /** Stable dispatcher — called with the card uid (memo-friendly). */
    onApply: (uid: string) => void;
    gesture: ReturnType<typeof Gesture.Exclusive>;
    /** Stable registrar — (uid, node) for the die drop-target measurement. */
    register: (uid: string, node: View | null) => void;
    compact?: boolean;
    /** WS7.2 chosen X-cost — the current pick (null → the card's printed min).
     *  Rendered only when `card.chooseX` is non-null (the card has an X mech). */
    chosenX?: number | null;
    /** Stable dispatcher — (uid, x) steps the chosen X. */
    onChangeX?: (uid: string, x: number) => void;
    /** Rising nonce: when it changes (>0) this card just received a dropped die →
     *  a brief 1.05 scale-pop confirms the drop landed HERE (and only here). */
    popKey?: number;
    /** True while a die drag is live — highlights the empty die socket. (A static
     *  highlight, deliberately not an animation: N staged cards each running an
     *  infinite pulse measurably chugged die drags.) */
    socketPulse?: boolean;
    /** THE COLOR LAW + staging law during a die drag (owner directives
     *  2026-07-12): true while the dragged die CANNOT land on this card —
     *  off-color (non-wild) OR the card already carries a dropped die — the
     *  card dims like every other disabled control and reads disabled to
     *  a11y; the drop itself is rejected in `resolveDieDropTarget`. */
    dropIneligible?: boolean;
    /** Rising nonce: a drop on this card was just REJECTED → a brief shake
     *  (the loud-rejection cue; the reason line renders at board level). */
    rejectKey?: number;
    /** Dead-tray state (no die in the tray can power ANY hand card): the
     *  FREE action is the out — the APPLY · FREE ribbon reads prominent. */
    freeProminent?: boolean;
}) {
    const AXM = usePalette();
    const styles = useStyles();
    const f = card.face;
    // Drop-confirmation pop (120ms up / 120ms back) on the card the die landed on.
    const pop = useSharedValue(1);
    useEffect(() => {
        if (popKey > 0) pop.value = withSequence(withTiming(1.05, { duration: 120 }), withTiming(1, { duration: 120 }));
    }, [popKey, pop]);
    // Rejection SHAKE (loud rejection, owner directive 2026-07-12): a quick
    // left-right shudder on the exact card that refused the drop.
    const shake = useSharedValue(0);
    useEffect(() => {
        if (rejectKey > 0) {
            shake.value = withSequence(
                withTiming(-7, { duration: 45 }), withTiming(7, { duration: 60 }),
                withTiming(-5, { duration: 55 }), withTiming(4, { duration: 55 }),
                withTiming(0, { duration: 50 }),
            );
        }
    }, [rejectKey, shake]);
    const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }, { translateX: shake.value }] }));
    const armed = assignedDie !== null;
    const readColor = armed ? (READ_ACCENT[read] ?? AXM.bone) : AXM.bone;
    // Option A rail needs width: staged faces track the hand-card proportion.
    const cardW = compact ? 100 : 122;
    const cardH = compact ? 147 : 179;
    // The keyword line shows the POWER value; for read-dependent kinds (guard) it is
    // recomputed live at the known read so the staged number is exact at commit.
    let heroOverride: string | undefined;
    if (armed && f.readDependent) {
        const colorMatch = assignedDie!.color === card.stance || assignedDie!.color === 'wild';
        const g = armedReadValue(f, read as CombatReadResult, colorMatch);
        // Read-scaled commit value: Guard NN / +NN% Vulnerable / NN DoT total.
        if (g != null) heroOverride = f.kind === 'guard' ? `Guard ${g}` : f.kind === 'vulnerable' ? `+${g}%` : `${g}`;
    }
    const readPip = armed && f.readDependent
        ? (read === 'advantage' ? '▲' : read === 'disadvantage' ? '▼' : '—')
        : null;
    // P2 — spell out the APPLY suffix instead of a bare glyph. A read-dependent
    // powered play names the read (WON / LOST / EVEN); a plain powered play names
    // the die color; the dieless out reads FREE.
    const applyLabel = !armed
        ? 'APPLY · FREE'
        : f.readDependent
            ? `APPLY · ${read === 'advantage' ? '▲ WON READ' : read === 'disadvantage' ? '▼ LOST READ' : '— EVEN READ'}`
            : assignedDie?.color
                ? `APPLY · ${assignedDie.color.toUpperCase()} DIE`
                : 'APPLY · POWERED';
    return (
        <View style={styles.stagedCol}>
            <GestureDetector gesture={gesture}>
                <Animated.View
                    ref={(node) => register(card.uid, node as unknown as View | null)}
                    entering={FadeInDown.duration(180)}
                    testID={`combat-staged-${card.uid}`}
                    accessible
                    accessibilityRole="button"
                    accessibilityState={{ disabled: dropIneligible }}
                    accessibilityLabel={dropIneligible
                        ? `${card.name} staged — only a ${card.stance.toUpperCase()} or WILD die can power this card.`
                        : `${card.name} staged — ${f.verbLine}. Tap to unstage.`}
                >
                  {/* inner wrapper carries the drop-pop scale so it never fights the
                      outer entering animation's transform — and the COLOR-LAW dim
                      (an off-color die in flight can't land here; matches the
                      sigRune/dieAssigned disabled-opacity language). */}
                  <Animated.View style={[popStyle, dropIneligible ? { opacity: 0.4 } : null]}>
                    <CombatCardFace
                        card={card}
                        width={cardW}
                        height={cardH}
                        accent={armed ? readColor : null}
                        readPip={readPip}
                        heroOverride={heroOverride}
                    />
                    {/* die socket notched into the top-right corner: dashed target while
                        empty (highlighted during a die drag), the assigned die once armed. */}
                    {/* testID must NOT share the `combat-die-` prefix (e2e drags dice by prefix) */}
                    <View style={[styles.dieSocket, socketPulse && !assignedDie ? { transform: [{ scale: 1.12 }] } : null]} testID={assignedDie ? undefined : `combat-socket-${card.uid}`}>
                        {assignedDie ? (
                            <View testID="combat-staged-die">
                                <CombatDie die={assignedDie} size={compact ? 26 : 32} />
                            </View>
                        ) : (
                            <View style={[styles.dieSocketEmpty, socketPulse ? { borderColor: AXM.sulfur, backgroundColor: 'rgba(212,192,38,0.18)' } : null]}>
                                <Text style={[styles.dieSocketGlyph, socketPulse ? { color: AXM.sulfur } : null]}>⬡</Text>
                            </View>
                        )}
                    </View>
                  </Animated.View>
                </Animated.View>
            </GestureDetector>
            {/* WS7.2 chosen X-cost — the amount picker, only on a card with an
                X mechanic. The range is the ENGINE's live clamp (vm.chooseX). */}
            {card.chooseX ? (() => {
                const range = card.chooseX;
                const x = Math.min(Math.max(chosenX ?? range.min, range.min), range.max);
                return (
                    <View style={[styles.xRow, { width: cardW }]} testID={`combat-choose-x-${card.uid}`}>
                        <Pressable
                            onPress={() => onChangeX?.(card.uid, Math.max(range.min, x - 1))}
                            disabled={x <= range.min}
                            hitSlop={6}
                            style={[styles.xStepBtn, x <= range.min && { opacity: 0.35 }]}
                            accessibilityRole="button"
                            accessibilityLabel={`Pay less: RECOIL ${Math.max(range.min, x - 1)}`}
                            testID={`combat-choose-x-minus-${card.uid}`}
                        >
                            <Text style={styles.xStepGlyph}>−</Text>
                        </Pressable>
                        <Text style={styles.xValue} accessibilityLabel={`RECOIL X = ${x}`}>X {x}</Text>
                        <Pressable
                            onPress={() => onChangeX?.(card.uid, Math.min(range.max, x + 1))}
                            disabled={x >= range.max}
                            hitSlop={6}
                            style={[styles.xStepBtn, x >= range.max && { opacity: 0.35 }]}
                            accessibilityRole="button"
                            accessibilityLabel={`Pay more: RECOIL ${Math.min(range.max, x + 1)}`}
                            testID={`combat-choose-x-plus-${card.uid}`}
                        >
                            <Text style={styles.xStepGlyph}>+</Text>
                        </Pressable>
                    </View>
                );
            })() : null}
            <Pressable
                onPress={() => { Haptics.impactAsync(armed ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined); onApply(card.uid); }}
                testID={`combat-apply-${card.uid}`}
                accessibilityRole="button"
                accessibilityLabel={armed ? `Apply powered: ${card.bottomActionText}` : `Apply free: ${card.topActionText}`}
                hitSlop={8}
                style={[
                    styles.applyRibbon,
                    { borderColor: armed ? readColor : AXM.bone, backgroundColor: armed ? 'rgba(91,191,106,0.16)' : 'rgba(0,0,0,0.55)', width: cardW },
                    // Dead-tray telegraph: the FREE line is the live out — the
                    // ribbon lights sulfur so it reads as THE button to press.
                    !armed && freeProminent && { borderColor: AXM.sulfur, backgroundColor: 'rgba(212,192,38,0.16)' },
                    compact && { paddingVertical: 3 },
                ]}
            >
                <Text style={[styles.applyText, { color: armed ? readColor : freeProminent ? AXM.sulfur : AXM.parchment }, compact && { fontSize: 10 }]} numberOfLines={1} adjustsFontSizeToFit>
                    {applyLabel}
                </Text>
            </Pressable>
        </View>
    );
});

// ── Momentum wheel (stance-sequencing combo tracker) ─────────────────────────

const WHEEL_META: { stance: WheelStance; glyph: string }[] = [
    { stance: 'heart', glyph: '♥' },
    { stance: 'body', glyph: '⚡' },
    { stance: 'mind', glyph: '★' },
];

/** Three stance nodes in wheel order. Playing cards that step the wheel
 *  (heart → body → mind → heart…) lights nodes; a full cycle forges a wild
 *  MOMENTUM die (rendered charged: every node gold + the ✦ tag). */
function MomentumWheel({ lit, charged, onPress }: { lit: WheelStance[]; charged: boolean; onPress?: () => void }) {
    const AXM = usePalette();
    const styles = useStyles();
    const litSet = new Set(lit);
    const next = charged ? null : wheelNext(lit);
    const a11y = charged
        ? 'Momentum charged — a wild momentum die waits in your tray; it can power any card.'
        : lit.length === 0
            ? 'Momentum wheel empty — play any stance to start the cycle.'
            : `Momentum ${lit.length} of 3 — next stance ${next?.toUpperCase() ?? ''}.`;
    return (
        <Pressable
            style={styles.wheelRow}
            onPress={onPress}
            testID="combat-momentum"
            accessibilityRole="button"
            accessibilityLabel={a11y}
            accessibilityHint="Tap for how momentum works"
        >
            {WHEEL_META.map(({ stance, glyph }, i) => {
                const isLit = charged || litSet.has(stance);
                const isNext = !charged && next === stance;
                const color = charged ? AXM.sulfur : STANCE_COLORS[stance];
                return (
                    <React.Fragment key={stance}>
                        {i > 0 ? <Text style={styles.wheelChevron} allowFontScaling={false}>›</Text> : null}
                        <View
                            style={[
                                styles.wheelNode,
                                { borderColor: isLit ? color : isNext ? `${color}aa` : AXM.ash, backgroundColor: isLit ? `${color}30` : 'rgba(0,0,0,0.5)' },
                                isNext && styles.wheelNodeNext,
                            ]}
                        >
                            <Text style={[styles.wheelGlyph, { color: isLit ? color : AXM.ash, textShadowColor: isLit ? color : 'transparent' }]} allowFontScaling={false}>{glyph}</Text>
                        </View>
                    </React.Fragment>
                );
            })}
            {charged ? <Text style={[styles.wheelCharged, { color: AXM.sulfur, textShadowColor: AXM.sulfur }]} allowFontScaling={false}>✦ MOMENTUM</Text> : null}
        </Pressable>
    );
}

// ── Premise track + CONCEDE beat (phase 28) ──────────────────────────────────

/** Peroration was fully engine-side state with zero combat-UI rendering
 *  before phase 28 — "the deck's whole win condition is invisible." */
function PerorationTrack({ peroration }: { peroration: CombatPerorationVM }) {
    const AXM = usePalette();
    const styles = useStyles();
    if (!peroration.active) return null;
    const pct = peroration.at > 0 ? Math.min(1, peroration.premises / peroration.at) : 0;
    const a11y = `Peroration declared: ${peroration.cardName}. Premise ${peroration.premises} of ${peroration.at}`
        + (peroration.concedeAt ? `, concedes the fight outright at ${peroration.concedeAt} Premises.` : '.');
    return (
        <View style={styles.perorationTrack} testID="combat-peroration" accessible accessibilityRole="text" accessibilityLabel={a11y}>
            <Text style={styles.perorationLabel} numberOfLines={1} allowFontScaling={false}>
                ☞ {peroration.cardName.toUpperCase()} · {peroration.premises}/{peroration.at}
                {peroration.concedeAt ? ` · CONCEDE ${peroration.concedeAt}` : ''}
            </Text>
            <View style={styles.perorationBarTrack}>
                <View style={[styles.perorationBarFill, { width: `${pct * 100}%`, backgroundColor: AXM.sulfur }]} />
            </View>
        </View>
    );
}

// ── END PHASE medallion ──────────────────────────────────────────────────────

function EndPhaseMedallion({ onPress, consequence = null, disabled = false }: {
    onPress: () => void;
    /** Owner directive 2026-07-12 (no-softlock telegraph): the honest one-line
     *  consequence of ending now (verified engine behavior, never invented) —
     *  rendered under the medallion and folded into the a11y label. */
    consequence?: string | null;
    /** WI-3 — dimmed + press-inert while a phase is resolving (double-tap guard). */
    disabled?: boolean;
}) {
    const AXM = usePalette();
    const styles = useStyles();
    const pulse = useSharedValue(0);
    React.useEffect(() => {
        pulse.value = withRepeat(withSequence(withTiming(1, { duration: 1100 }), withTiming(0, { duration: 1100 })), -1);
    }, [pulse]);
    const glow = useAnimatedStyle(() => ({ opacity: 0.35 + pulse.value * 0.45 }));
    return (
        <View style={styles.endWrap} pointerEvents="box-none">
            {/* pulsing radial backing glow */}
            <Animated.View style={[StyleSheet.absoluteFill, glow]} pointerEvents="none">
                <Svg width={112} height={112} viewBox="0 0 100 100" style={{ position: 'absolute', top: -16, left: -16 }}>
                    <Defs>
                        <RadialGradient id="axmEndGlow" cx="50%" cy="50%" r="50%">
                            <Stop offset="0%" stopColor={AXM.sulfur} stopOpacity={0.5} />
                            <Stop offset="70%" stopColor={AXM.sulfur} stopOpacity={0.12} />
                            <Stop offset="100%" stopColor={AXM.sulfur} stopOpacity={0} />
                        </RadialGradient>
                    </Defs>
                    <Circle cx={50} cy={50} r={50} fill="url(#axmEndGlow)" />
                </Svg>
            </Animated.View>
            <Pressable
                onPress={disabled ? undefined : onPress}
                disabled={disabled}
                testID="combat-end-phase"
                accessibilityRole="button"
                accessibilityState={{ disabled }}
                accessibilityLabel={`End phase — the enemy acts, then the next phase begins.${consequence ? ` ${consequence}.` : ''}`}
                style={[styles.endBtn, { borderColor: AXM.sulfur }, disabled && styles.endBtnDisabled]}
            >
                <View style={[styles.endBtnInnerRim]} pointerEvents="none" />
                <Text style={[styles.endGlyph, { color: AXM.sulfur }]} allowFontScaling={false}>⧗</Text>
                <Text style={[styles.endLabel, { color: AXM.sulfur }]} allowFontScaling={false}>END</Text>
            </Pressable>
            {consequence ? (
                <View style={styles.endConsequenceWrap} pointerEvents="none">
                    <Text style={styles.endConsequence} testID="combat-end-consequence" numberOfLines={2}>
                        {consequence}
                    </Text>
                </View>
            ) : null}
        </View>
    );
}

// ── The board ────────────────────────────────────────────────────────────────

export interface CombatBoardProps {
    vm: CombatViewModel;
    drag: DragController;
    stagedUids: string[];
    /** Commit the staged card. `power` true → power it with `dieId` (null when a die
     *  is already drafted, the combo case); `power` false → the FREE base action,
     *  no die (hazard model — the die is optional). `choices.chosenX` (WS7.2)
     *  rides along only when the card carries an X mechanic and the stepper was
     *  touched; `choices.reprisalCardId` (phase 28) carries the songbook pick. */
    onApply: (uid: string, dieId: string | null, power: boolean, choices?: { chosenX?: number; reprisalCardId?: string }) => void;
    onStage: (uid: string) => void;
    onUnstage: (uid: string) => void;
    onDiscard: (uid: string) => void;
    onSignature: (id: string) => void;
    onEndPhase: () => void;
    /** WI-3 — true while a threat phase is resolving (and its fx timeline plays).
     *  The END button renders disabled + dimmed and the auto-apply/end-phase
     *  handler no-ops, so a touch double-tap can't machine-gun several phases. */
    resolving?: boolean;
    onInspect: (card: CombatCardVM) => void;
    onChip?: (e: CombatEffectChipVM) => void;
    /** Long-press (or tap while unaffordable) on a signature rune → info popup. */
    onSignatureInfo?: (s: CombatSignatureVM) => void;
    /** Tap the player medallion → pilgrim stats/effects modal. */
    onPlayerInspect?: () => void;
    /** Momentum wheel state (panel-owned): lit nodes + whether a wild momentum
     *  die is currently live in the tray. */
    momentum?: { lit: WheelStance[]; charged: boolean };
    /** Tap the wheel → how-momentum-works popup. */
    onMomentumInfo?: () => void;
    /** Latest resolved engine events (drives enemy/player resolution feedback). */
    fx?: CombatFx;
    // ── Fate Engine P1 ──
    /** Tap a dead X die → the universal fate tap (once per turn). */
    onFateTap?: (dieId: string) => void;
    /** Bank-or-burn choice for the spare die at draft (panel-owned). */
    bankSpare?: boolean;
    onToggleBankSpare?: () => void;
    /** phase 28 — REPRISE songbook choice. Called INSTEAD of `onApply` when the
     *  card being APPLYd carries a `reprise` mechanic and the discard pile is
     *  non-empty; the panel opens its picker and calls `onApply` itself once
     *  the player chooses (or skips, which omits the choice — auto-pick).
     *  `chosenX` (WS7.2) rides along so a deferred X-card still resolves at
     *  the stepper's pick, not the printed min. The deferral is a HELD play,
     *  not a commit: the board keeps the card staged and its pending die /
     *  chosen X untouched, so the panel's backdrop can CANCEL back to the
     *  exact pre-APPLY staging. Not consulted from the END PHASE auto-apply
     *  batch (never pop a picker mid-batch — that path always auto-picks). */
    onReprisalNeeded?: (uid: string, dieId: string | null, power: boolean, chosenX?: number) => void;
}

export const CombatBoard = React.memo(function CombatBoard({
    vm, drag, stagedUids, onApply, onStage, onUnstage, onDiscard, onSignature, onEndPhase, resolving = false, onInspect, onChip, onSignatureInfo, onPlayerInspect, momentum, onMomentumInfo, fx,
    onFateTap, bankSpare, onToggleBankSpare, onReprisalNeeded,
}: CombatBoardProps) {
    const AXM = usePalette();
    const styles = useStyles();
    // Null-safe insets (the context is null with no SafeAreaProvider, e.g. in tests).
    const insets = useContext(SafeAreaInsetsContext);
    const topInset = insets?.top ?? 0;
    const bottomInset = insets?.bottom ?? 0;
    const { width: screenW } = useWindowDimensions();
    const playAreaRef = useRef<View | null>(null);
    const trashRef = useRef<View | null>(null);
    // Per-staged-card measurable frames — used to drop a die onto a SPECIFIC card.
    const stagedRefs = useRef<Map<string, View>>(new Map());

    // Per-card die selection: the die the player has dragged onto each staged card
    // but not yet APPLYd. Local UI state — selecting/re-selecting is free; APPLY is
    // the commit. (Combat drafts ONE stance die per turn, so once a die is drafted
    // it — or its combo refresh — powers whichever card APPLYs next; before that,
    // each staged card shows the die dragged onto it.)
    const [pendingDieByUid, setPendingDieByUid] = useState<Record<string, string>>({});
    // WS7.2 chosen X-cost: the stepper pick per staged X card (absent → the
    // card's printed min). Local UI state; APPLY forwards it as `chosenX`.
    const [chosenXByUid, setChosenXByUid] = useState<Record<string, number>>({});
    const chosenXRef = useRef(chosenXByUid);
    chosenXRef.current = chosenXByUid;
    const onChangeX = useCallback((uid: string, x: number) => {
        setChosenXByUid((prev) => ({ ...prev, [uid]: x }));
    }, []);
    // Rising drop-confirmation nonce for the card a die just landed on (scale-pop).
    const [dropPop, setDropPop] = useState<{ uid: string; n: number }>({ uid: '', n: 0 });
    // Loud rejection (owner directive 2026-07-12): a rejected die drop shakes
    // the refusing card (`uid` — '' for a loose rejection) and surfaces the
    // reason as a visible line, auto-cleared after a beat.
    const [dropReject, setDropReject] = useState<{ uid: string; reason: string; n: number }>({ uid: '', reason: '', n: 0 });
    useEffect(() => {
        if (dropReject.n === 0) return;
        const t = setTimeout(() => setDropReject((prev) => (prev.n === dropReject.n ? { uid: '', reason: '', n: prev.n } : prev)), 2200);
        return () => clearTimeout(t);
    }, [dropReject.n]);
    const stagedKey = stagedUids.join(',');
    // Clear pending selections when the turn's dice change…
    useEffect(() => { setPendingDieByUid({}); }, [vm.turnLabel]);
    // …and drop entries for cards that are no longer staged. Covers chosen X
    // too: a REPRISE-deferred play skips handleApply's own cleanup (it must —
    // the songbook can cancel back to the staging), so the unstage that
    // follows its eventual commit is what prunes both maps.
    useEffect(() => {
        setPendingDieByUid((prev) => {
            const next: Record<string, string> = {};
            for (const uid of stagedUids) if (prev[uid]) next[uid] = prev[uid];
            return next;
        });
        setChosenXByUid((prev) => {
            const next: Record<string, number> = {};
            for (const uid of stagedUids) if (prev[uid] !== undefined) next[uid] = prev[uid];
            return next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stagedKey]);

    const draftedDie = vm.dice.find((d) => d.drafted && !d.spent) ?? null;
    // Card stance by uid — the COLOR LAW checks key off this (uid → stance is
    // immutable for the life of the hand entry).
    const stanceOfUid = (uid: string): string | undefined => vm.hand.find((c) => c.uid === uid)?.stance;
    // THE COLOR LAW (engine: playCombatCard's gate, combat.engine.ts ~:1339;
    // UI mirror: dieCanPowerCardVM): can the shared drafted die legally power
    // the card at `uid`? Off-color routing would fizzle at resolution, so the
    // board never arms — and never commits — an illegal pairing.
    const draftedLegalFor = (uid: string): boolean => {
        if (!draftedDie) return false;
        const stance = stanceOfUid(uid);
        return !!stance && dieCanPowerCardVM(draftedDie, stance);
    };
    // The ONE staged card a FRESH drafted die visibly arms: the first
    // color-legal staged card without its own dropped die. The stale-powered
    // fix (owner report 2026-07-12: "the NEXT card appears powered"): a
    // REFRESHED combo die — one that already powered a play this turn and was
    // handed back by a landed status — NEVER auto-attaches to another card.
    // It returns to the tray draggable (vm `refreshed`), and powering a second
    // card takes an explicit re-drop, exactly like any other die.
    const comboTargetUid = draftedDie && !draftedDie.refreshed
        ? (stagedUids.find((u) => !pendingDieByUid[u] && draftedLegalFor(u))
            ?? stagedUids.find((u) => draftedLegalFor(u))
            ?? null)
        : null;
    // DISPLAY (decoupled from commit): resolve the per-card dropped die FIRST (only
    // when still usable AND color-legal — drops are already gated, this is the belt
    // to the drop's braces; a REFRESHED drafted die counts, its re-drop was
    // explicit), then show the fresh drafted die on the single comboTargetUid,
    // else null → the card reads as FREE (no die).
    const assignedDieFor = (uid: string): CombatDieVM | null => {
        const pid = pendingDieByUid[uid];
        if (pid) {
            const d = vm.dice.find((x) => x.id === pid);
            const stance = stanceOfUid(uid);
            if (d && !d.spent && !d.isX && (!d.drafted || d.refreshed) && stance && dieCanPowerCardVM(d, stance)) return d;
        }
        if (draftedDie && uid === comboTargetUid) return draftedDie;
        return null;
    };
    const readFor = (die: CombatDieVM | null): string =>
        (die ? (die.drafted ? vm.read.result : die.readPip) : 'none') ?? 'none';
    // Dim every die that's already drafted or pending-assigned to some card.
    // A REFRESHED die is live again — it dims only while pending on a card.
    const assignedDieIds = new Set<string>(
        [draftedDie && !draftedDie.refreshed ? draftedDie.id : null, ...Object.values(pendingDieByUid)]
            .filter(Boolean) as string[],
    );

    const resolveDrop = useCallback(async (payload: DragPayload, x: number, y: number) => {
        if (x < 0 && y < 0) return;
        if (payload.type === 'die') {
            // Per-card targeting: drop a die onto a SPECIFIC staged card to power it.
            // All staged rects are measured in ONE parallel round-trip — awaiting
            // them sequentially cost O(N) async hops per drop with N staged cards.
            let hitUid: string | null = null;
            const measured = await Promise.all(stagedUids.map(async (uid) => {
                const node = stagedRefs.current.get(uid);
                if (!node) return null;
                const rect = await measureRect({ current: node });
                return { uid, rect };
            }));
            for (const m of measured) {
                if (m && rectContains(m.rect, x, y, 16)) { hitUid = m.uid; break; }
            }
            const playRect = hitUid ? null : await measureRect(playAreaRef);
            const inPlayArea = hitUid ? true : rectContains(playRect, x, y, 24);
            // THE COLOR LAW gate + loose-drop forgiveness live in the pure
            // resolver: an off-color drop rejects (die snaps home, nothing is
            // selected, no fizzle ever reaches the engine); a loose drop lands
            // on a color-legal card only.
            const target = resolveDieDropTarget(
                payload.die, hitUid, inPlayArea, stagedUids, stanceOfUid, pendingDieByUid,
            );
            if (target) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => undefined);
                const t = target;
                setPendingDieByUid((prev) => ({ ...prev, [t]: payload.dieId }));
                setDropPop((prev) => ({ uid: t, n: prev.n + 1 }));   // confirm the drop landed HERE
            } else if (hitUid || inPlayArea) {
                // LOUD rejection (owner directive 2026-07-12): the refusing card
                // shakes and the reason renders as a visible line — never just
                // an a11y whisper. A drop outside the play area stays silent
                // (that's an aborted drag, not a refusal).
                const card = hitUid ? vm.hand.find((c) => c.uid === hitUid) : undefined;
                const reason = card
                    ? (pendingDieByUid[hitUid!]
                        ? `${card.name} already holds a die — tap it to unstage first`
                        : `only a ${card.stance.toUpperCase()} or WILD die can power ${card.name}`)
                    : 'no staged card can take this die';
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
                setDropReject((prev) => ({ uid: hitUid ?? '', reason, n: prev.n + 1 }));
            }
            return;
        }
        if (payload.from === 'hand') {
            const trashRect = await measureRect(trashRef);
            if (rectContains(trashRect, x, y, 18)) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
                onDiscard(payload.uid); return;
            }
            const playRect = await measureRect(playAreaRef);
            if (rectContains(playRect, x, y)) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
                onStage(payload.uid);
            }
            // Drag that misses the play area is a no-op — the pan gesture already
            // fired, so the Exclusive tap handler is suppressed. Inspect is tap-only.
            return;
        }
        if (payload.from === 'play') {
            const playRect = await measureRect(playAreaRef);
            if (!rectContains(playRect, x, y)) onUnstage(payload.uid);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onDiscard, onStage, onUnstage, onInspect, stagedKey, pendingDieByUid]);

    (drag as DragController & { resolveDrop?: typeof resolveDrop }).resolveDrop = resolveDrop;

    // ── stable gesture layer (multi-card staging perf) ───────────────────────
    // Gestures used to be REBUILT on every render — with several staged cards
    // each interaction re-created and re-attached every pan/tap handler on the
    // board, and the drags degraded the longer cards sat staged. Now:
    //   · latest handlers live in refs, bridged through IDENTITY-STABLE JS
    //     callbacks (runOnJS mappings never change);
    //   · each card/die gets its gesture built ONCE, cached by uid;
    //   · per-frame position updates write the shared values DIRECTLY on the
    //     UI thread — only begin (stage the ghost) and end (resolve) hop to JS.
    const handMapRef = useRef(new Map<string, CombatCardVM>());
    handMapRef.current = new Map(vm.hand.map((c) => [c.uid, c]));
    const diceMapRef = useRef(new Map<string, CombatDieVM>());
    diceMapRef.current = new Map(vm.dice.map((d) => [d.id, d]));
    const dragBeginRef = useRef(drag.begin); dragBeginRef.current = drag.begin;
    const dragEndRef = useRef(drag.end); dragEndRef.current = drag.end;
    const onInspectRef = useRef(onInspect); onInspectRef.current = onInspect;
    const onUnstageRef = useRef(onUnstage); onUnstageRef.current = onUnstage;

    const beginCardJS = useCallback((from: 'hand' | 'play', uid: string, x: number, y: number) => {
        const card = handMapRef.current.get(uid);
        if (card) dragBeginRef.current({ type: 'card', from, uid, card }, x, y);
    }, []);
    const beginDieJS = useCallback((dieId: string, x: number, y: number) => {
        const die = diceMapRef.current.get(dieId);
        if (die) dragBeginRef.current({ type: 'die', dieId, die }, x, y);
    }, []);
    const endJS = useCallback((x: number, y: number) => { dragEndRef.current(x, y); }, []);
    const inspectJS = useCallback((uid: string) => {
        const card = handMapRef.current.get(uid);
        if (card) onInspectRef.current(card);
    }, []);
    const unstageJS = useCallback((uid: string) => { onUnstageRef.current(uid); }, []);

    const gestureCacheRef = useRef(new Map<string, ReturnType<typeof Gesture.Exclusive>>());
    // drag.x/drag.y are the SAME SharedValue objects across renders (created once
    // in the panel), so gestures capturing them can be cached indefinitely.
    const gx = drag.x;
    const gy = drag.y;
    const cardGestureFor = (from: 'hand' | 'play', uid: string) => {
        const key = `${from}-${uid}`;
        let g = gestureCacheRef.current.get(key);
        if (!g) {
            const pan = Gesture.Pan().minDistance(10)
                .onStart((e) => { gx.value = e.absoluteX; gy.value = e.absoluteY; runOnJS(beginCardJS)(from, uid, e.absoluteX, e.absoluteY); })
                .onUpdate((e) => { gx.value = e.absoluteX; gy.value = e.absoluteY; })
                .onEnd((e) => { runOnJS(endJS)(e.absoluteX, e.absoluteY); })
                .onFinalize((e, ok) => { if (!ok) runOnJS(endJS)(-1, -1); });
            const tap = Gesture.Tap().maxDistance(9).onEnd(() => {
                if (from === 'hand') runOnJS(inspectJS)(uid); else runOnJS(unstageJS)(uid);
            });
            g = Gesture.Exclusive(pan, tap);
            gestureCacheRef.current.set(key, g);
        }
        return g;
    };
    const handCardGesture = (card: CombatCardVM) => cardGestureFor('hand', card.uid);
    const stagedGesture = (card: CombatCardVM) => cardGestureFor('play', card.uid);
    const dieGesture = (die: CombatDieVM) => {
        const key = `die-${die.id}`;
        let g = gestureCacheRef.current.get(key);
        if (!g) {
            const pan = Gesture.Pan().minDistance(8)
                .onStart((e) => { gx.value = e.absoluteX; gy.value = e.absoluteY; runOnJS(beginDieJS)(die.id, e.absoluteX, e.absoluteY); })
                .onUpdate((e) => { gx.value = e.absoluteX; gy.value = e.absoluteY; })
                .onEnd((e) => { runOnJS(endJS)(e.absoluteX, e.absoluteY); })
                .onFinalize((e, ok) => { if (!ok) runOnJS(endJS)(-1, -1); });
            g = Gesture.Exclusive(pan);
            gestureCacheRef.current.set(key, g);
        }
        return g;
    };

    const stagedSet = new Set(stagedUids);
    // Staged cards, in stage order (filtered to those still in hand).
    const stagedCards = stagedUids
        .map((uid) => vm.hand.find((c) => c.uid === uid))
        .filter((c): c is CombatCardVM => Boolean(c));
    const fan = vm.hand.filter((c) => !stagedSet.has(c.uid));
    const n = fan.length;
    const mid = (n - 1) / 2;
    // Width is the binding constraint. The fan spans edge-to-edge (12pt insets) —
    // the corner medallions float ABOVE the fan ends at higher zIndex, reference
    // style. `step` = the visible width of each non-last card: clamped so small
    // hands keep a roomy peek (≤ HAND_CARD_W-16) and large hands tighten to fit,
    // never below a readable 28pt sliver.
    const band = screenW - 24;
    const step = n > 1
        ? Math.min(HAND_CARD_W - 16, Math.max(28, (band - HAND_CARD_W) / (n - 1)))
        : HAND_CARD_W;
    const overlap = HAND_CARD_W - step;
    const draggingDieId = drag.active?.type === 'die' ? drag.active.dieId : null;
    // The full VM of the die in flight — the COLOR LAW dimming keys off its color.
    const draggingDie = drag.active?.type === 'die' ? drag.active.die : null;
    const draggingCardUid = drag.active?.type === 'card' ? drag.active.uid : null;
    const cardDragLive = draggingCardUid !== null;
    const dieDragLive = draggingDieId !== null;

    // A staged card is drop-INELIGIBLE for the die in flight when it is
    // off-color (THE COLOR LAW) or already carries a dropped die (the staging
    // law) — mirrors `resolveDieDropTarget` exactly, so the dim always
    // predicts the rejection.
    const dropIneligibleFor = (card: CombatCardVM): boolean =>
        !!draggingDie && (!dieCanPowerCardVM(draggingDie, card.stance) || !!pendingDieByUid[card.uid]);

    // Ghost ✕ cue (owner directive 2026-07-12): on die-drag begin, measure
    // every INELIGIBLE staged card once and hand the rects to the panel's
    // ghost via the drag controller — the ✕ shows per-frame on the UI thread
    // while the pointer is over any of them. Cleared when the drag ends.
    const badRectsSV = drag.badRects;
    useEffect(() => {
        if (!badRectsSV) return;
        if (!draggingDie) { badRectsSV.value = []; return; }
        let live = true;
        void (async () => {
            const bad = stagedCards.filter(dropIneligibleFor);
            const rects = await Promise.all(bad.map(async (c) => {
                const node = stagedRefs.current.get(c.uid);
                return node ? measureRect({ current: node }) : null;
            }));
            if (live) badRectsSV.value = rects.filter((r): r is Rect => r !== null);
        })();
        return () => { live = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draggingDieId, badRectsSV]);

    // NO-SOFTLOCK telegraph (owner directive 2026-07-12) — the DEAD TRAY: at
    // least one die is still playable but NONE of them can power ANY card in
    // hand (no matching color, no wild). The outs get lit instead of leaving
    // the player staring: FREE ribbons read prominent, and END carries its
    // honest consequence line.
    const playableDice = vm.dice.filter((d) => d.draggable && !d.isX && !d.spent);
    const deadTray = vm.diceRolled && playableDice.length > 0 && vm.hand.length > 0
        && playableDice.every((d) => vm.hand.every((c) => !dieCanPowerCardVM(d, c.stance)));
    // The END consequence — VERIFIED engine behavior, never invented copy:
    // `endTurn` (called by the panel before the phase resolves) banks an
    // unspent drafted die to the Reserve when a slot is free, else burns it
    // for Conviction; dice never drafted are simply discarded — the fresh
    // tray rolls next phase (`processBetweenPhases` clears the old one).
    const unspentDraft = draftedDie !== null;
    const endConsequence = unspentDraft
        ? (vm.reserveRoom ? 'unspent die ⏳ banks to Reserve' : 'unspent die burns → ◆')
        : deadTray
            ? 'unusable dice are discarded · fresh roll next phase'
            : null;

    // Commit ONE staged card. A FRESH drafted die stays SHARED: if one exists,
    // APPLY this card powered regardless of comboTargetUid. A REFRESHED combo
    // die (it already powered a play this turn) powers only the card it was
    // explicitly re-dropped on — commit mirrors display (stale-powered fix,
    // 2026-07-12). Else if this card has a usable dropped die, draft+power it;
    // else FREE (no die).
    // Latest-closure ref + a stable dispatcher so memoized StagedCards never
    // re-render just because the board did.
    // `autoResolve` (phase 28) — true only from the END PHASE batch below: a
    // staged REPRISE card must still land (never silently dropped), but
    // there's no player present mid-batch to answer a picker, so it always
    // auto-picks (the engine's pre-existing highest-rank default) instead of
    // calling `onReprisalNeeded`.
    const handleApplyRef = useRef<(uid: string, autoResolve?: boolean) => void>(() => undefined);
    handleApplyRef.current = (uid: string, autoResolve = false) => {
        // WS7.2 — forward the stepper's chosen X (absent = no X mechanic).
        const chosenX = chosenXRef.current[uid];
        // THE COLOR LAW at commit (engine: playCombatCard's gate, ~:1339): an
        // off-color die must never be routed at a card — the engine would
        // fizzle the play. An off-color DRAFTED die falls through to the
        // card's own dropped die (a Reserve/floating die is its own power
        // source even while a draft is live; a fresh tray die can only power
        // via draft-first, i.e. when nothing is drafted yet), else FREE.
        const stance = stanceOfUid(uid);
        const legalHere = (d: CombatDieVM | null): boolean =>
            !!d && !!stance && dieCanPowerCardVM(d, stance);
        const pid = pendingDieByUid[uid];
        const pending = pid ? vm.dice.find((x) => x.id === pid) ?? null : null;
        const pendingUsable = !!pending && !pending.spent && !pending.isX && !pending.drafted && legalHere(pending);
        let dieId: string | null = null;
        let power: boolean;
        // Stale-powered fix (2026-07-12): a REFRESHED drafted die powers this
        // card only when the player explicitly re-dropped it HERE (pid match) —
        // commit mirrors display, so a card that reads FREE commits FREE. A
        // fresh (not-yet-played) drafted die keeps the shared-commit combo law.
        if (draftedDie && legalHere(draftedDie)
            && (!draftedDie.refreshed || pid === draftedDie.id)) {
            dieId = null; power = true;
        } else if (pendingUsable && pending && (pending.reserve || pending.floating || !draftedDie)) {
            dieId = pending.id; power = true;
        } else {
            dieId = null; power = false;
        }
        const card = handMapRef.current.get(uid);
        if (!autoResolve && power && card?.needsReprisalChoice && vm.discardCards.length > 0 && onReprisalNeeded) {
            // DEFER, don't commit: the songbook backdrop may CANCEL this play,
            // so return before the cleanup below — the staged card, its pending
            // die, and its chosen X must all survive exactly as they were.
            // `chosenX` rides the prompt so the eventual pick/skip re-enters
            // `onApply` with it (the deferred play must not fall to min X);
            // once that commit unstages the card, the stagedKey effects above
            // prune the pending-die and chosen-X entries.
            onReprisalNeeded(uid, dieId, power, chosenX);
            return;
        }
        if (chosenX !== undefined) {
            // WS7.2 — arity preserved when no X was chosen (see the multistage pins).
            onApply(uid, dieId, power, { chosenX });
        } else {
            onApply(uid, dieId, power);
        }
        setPendingDieByUid((prev) => { const next = { ...prev }; delete next[uid]; return next; });
        setChosenXByUid((prev) => { const next = { ...prev }; delete next[uid]; return next; });
    };
    const handleApply = useCallback((uid: string) => handleApplyRef.current(uid), []);
    // Stable staged-frame registrar (drop-target measurement).
    const registerStaged = useCallback((uid: string, node: View | null) => {
        if (node) stagedRefs.current.set(uid, node); else stagedRefs.current.delete(uid);
    }, []);

    // A staged card is a committed intent — END PHASE must never silently drop it.
    // Auto-APPLY every still-staged card first (each exactly as its own APPLY button
    // would: honoring a dropped/drafted die, else FREE), THEN resolve the phase. The
    // applies and the resolve all compose through the panel's functional setState, so
    // cards land before the enemy acts.
    const handleEndPhase = () => {
        if (resolving) return; // WI-3 — a phase is already resolving; ignore the tap
        for (const uid of stagedUids) handleApplyRef.current(uid, true);
        onEndPhase();
    };

    const metaLine = `${vm.phaseBadge} · ${vm.roundLabel} · ${vm.turnLabel}`
        .replace('ROUND ', 'R').replace('TURN ', 'T');
    const railH = 26 + bottomInset;

    return (
        <View style={styles.root} testID="combat-board">
            {/* layers 0–2: battlefield scene, scrims, top HUD, player medallion */}
            <CombatCombatantPane
                enemy={vm.enemy}
                player={vm.player}
                onChip={onChip}
                fx={fx}
                topInset={topInset}
                metaLine={metaLine}
            />

            {/* interactive column */}
            <View style={styles.content} pointerEvents="box-none">
                {/* clearance under the floating top HUD */}
                <View style={{ height: topInset + COMBAT_HUD_HEIGHT }} pointerEvents="none" />

                {/* play region — an invisible drop target over the battlefield. The
                    dashed affordance appears ONLY while a card drag is live; staged
                    cards float as a centered row anchored to the region's bottom. */}
                <View style={{ flex: 1 }} pointerEvents="box-none">
                    {/* plain View (no layout transition): a reanimated layout container
                        wrapping animated staged children was measurable drag overhead */}
                    <View
                        ref={(node) => { playAreaRef.current = node; }}
                        style={[styles.playRegion, cardDragLive && { borderColor: `${AXM.sulfur}99`, backgroundColor: 'rgba(212,192,38,0.05)' }]}
                        testID="combat-play-area"
                        pointerEvents="box-none"
                    >
                        {cardDragLive && (
                            <Animated.Text entering={FadeIn.duration(150)} style={styles.playHint}>
                                release to stage
                            </Animated.Text>
                        )}
                        <View style={styles.stagedRow} pointerEvents="box-none">
                            {stagedCards.map((card) => {
                                const adie = assignedDieFor(card.uid);
                                // THE COLOR LAW + staging law during the drag: a
                                // card the die in flight cannot LAND on (off-color
                                // or already armed) dims + reads disabled; only
                                // eligible sockets invite the drop.
                                const dropEligible = !draggingDie || !dropIneligibleFor(card);
                                return (
                                    <StagedCard
                                        key={card.uid}
                                        card={card}
                                        assignedDie={adie}
                                        read={readFor(adie)}
                                        onApply={handleApply}
                                        gesture={stagedGesture(card)}
                                        register={registerStaged}
                                        compact={stagedCards.length > 2}
                                        popKey={dropPop.uid === card.uid ? dropPop.n : 0}
                                        rejectKey={dropReject.uid === card.uid ? dropReject.n : 0}
                                        socketPulse={dieDragLive && dropEligible}
                                        dropIneligible={dieDragLive && !dropEligible}
                                        freeProminent={deadTray}
                                        chosenX={chosenXByUid[card.uid] ?? null}
                                        onChangeX={onChangeX}
                                    />
                                );
                            })}
                        </View>
                        {/* LOUD rejection reason — the a11y label made visible. */}
                        {dropReject.reason ? (
                            <Animated.Text entering={FadeIn.duration(120)} style={styles.rejectLine} numberOfLines={2} testID="combat-drop-reject">
                                ✕ {dropReject.reason}
                            </Animated.Text>
                        ) : null}
                        {stagedCards.length > 0 && !stagedCards.some((c) => assignedDieFor(c.uid)) && !cardDragLive && !dropReject.reason ? (
                            <Text style={styles.stageHint} numberOfLines={1}>
                                {deadTray ? 'no die matches your hand — APPLY · FREE still works' : 'drag a die onto your card · APPLY to commit'}
                            </Text>
                        ) : null}
                    </View>
                </View>

                {/* momentum wheel — stance-sequencing combo tracker (heart→body→mind) */}
                {momentum ? (
                    <MomentumWheel lit={momentum.lit} charged={momentum.charged} onPress={onMomentumInfo} />
                ) : null}

                {/* Premise track + CONCEDE beat (phase 28) — the peroration theme's win condition */}
                <PerorationTrack peroration={vm.peroration} />

                {/* player status strip — IN FLOW (not floated over the fan, where the
                    hand's gesture area swallowed the taps) so every tile stays tappable */}
                {(vm.player.effects.length > 0 || vm.player.guard > 0) && (
                    <View style={styles.statusStrip} pointerEvents="box-none">
                        <EffectChips effects={vm.player.effects} onChip={onChip} />
                        {vm.player.guard > 0 ? <Text style={styles.guardChip} testID="combat-guard">🛡 {vm.player.guard}</Text> : null}
                    </View>
                )}

                {/* DEAD TRAY (no-softlock telegraph): nothing in the tray can
                    power any card in hand — say so where the dice live, and
                    point at the outs (FREE plays; END rolls fresh). */}
                {deadTray && stagedCards.length === 0 ? (
                    <Text style={styles.deadTrayLine} numberOfLines={2} testID="combat-dead-tray">
                        no die matches your hand — FREE plays still work · END rolls fresh dice
                    </Text>
                ) : null}
                <DiceRow vm={vm} dieGesture={dieGesture} draggingDieId={draggingDieId} assignedDieIds={assignedDieIds} onFateTap={onFateTap} bankSpare={bankSpare} onToggleBankSpare={onToggleBankSpare} />

                {/* the hand dock — edge-to-edge fan, bottoms cropped off-screen */}
                <View style={styles.dock}>
                    {/* sulfur shelf glow behind the fan */}
                    <Svg width="100%" height={90} viewBox="0 0 100 30" preserveAspectRatio="none" style={styles.fanGlow} pointerEvents="none">
                        <Defs>
                            <RadialGradient id="axmFanGlow" cx="50%" cy="100%" r="80%">
                                <Stop offset="0%" stopColor={AXM.sulfur} stopOpacity={0.16} />
                                <Stop offset="100%" stopColor={AXM.sulfur} stopOpacity={0} />
                            </RadialGradient>
                        </Defs>
                        <Circle cx={50} cy={30} r={55} fill="url(#axmFanGlow)" />
                    </Svg>
                    <View style={styles.fan} testID="combat-hand" pointerEvents="box-none">
                        {fan.map((card, i) => (
                            <GestureDetector key={card.uid} gesture={handCardGesture(card)}>
                                <Animated.View
                                    entering={FadeIn.duration(180)} layout={LinearTransition.duration(160)}
                                    style={{
                                        marginLeft: i === 0 ? 0 : -overlap,
                                        zIndex: draggingCardUid === card.uid ? 30 : i,
                                        opacity: draggingCardUid === card.uid ? 0.3 : 1,
                                        transform: [{ translateY: 2 + Math.abs(i - mid) * 3 }, { rotate: `${(i - mid) * 3}deg` }],
                                    }}
                                    testID={`combat-hand-${card.uid}`}
                                    accessible accessibilityRole="button"
                                    accessibilityLabel={`${card.name}, ${card.stance} card. ${card.face.verbLine}.`}
                                    accessibilityHint="Drag up to stage, or tap to read"
                                >
                                    <HandCard card={card} />
                                </Animated.View>
                            </GestureDetector>
                        ))}
                    </View>
                </View>

                {/* bottom rail — ♥ HP · phase ledger · deck/discard */}
                <View style={[styles.rail, { height: railH, paddingBottom: bottomInset }]}>
                    <Text style={styles.railHp} allowFontScaling={false}>♥ {vm.player.hp}</Text>
                    <View style={styles.railLedger} testID="combat-ledger">
                        {vm.ledger.map((m, i) => <LedgerMark key={i} kind={m === 'clear' ? 'O' : m === 'overwhelmed' ? 'X' : 'pending'} size={15} />)}
                    </View>
                    <View
                        style={styles.railPiles}
                        accessible
                        accessibilityRole="text"
                        accessibilityLabel={`Deck ${vm.deckCount} cards, discard ${vm.discardCount}`}
                    >
                        <View style={styles.pileGlyph}><Text style={styles.pileGlyphText} allowFontScaling={false}>▮</Text></View>
                        <Text style={styles.pileCount} allowFontScaling={false}>{vm.deckCount}</Text>
                        <View style={[styles.pileGlyph, { transform: [{ rotate: '8deg' }] }]}><Text style={styles.pileGlyphText} allowFontScaling={false}>▯</Text></View>
                        <Text style={styles.pileCount} allowFontScaling={false}>{vm.discardCount}</Text>
                    </View>
                </View>
            </View>

            {/* player medallion — bottom-left, ABOVE the hand (reference corner chrome) */}
            <PlayerMedallion
                player={vm.player}
                enemyIntentDamage={vm.enemy.intent.damage}
                onPress={onPlayerInspect}
                fx={fx}
                bottomInset={bottomInset}
            />

            {/* signature rune column — left edge */}
            <SignatureColumn conviction={vm.conviction} signatures={vm.signatures} onCast={onSignature} onInfo={onSignatureInfo} />

            {/* SCRAP — only present while a card is being dragged (no permanent
                footprint). Kept mounted/hidden rather than unmounted so the drop
                measurement still resolves against its ref after the drag ends. */}
            <View
                ref={trashRef}
                pointerEvents={draggingCardUid ? 'auto' : 'none'}
                style={[styles.trashBin, { bottom: railH + 108 }, draggingCardUid ? { borderColor: AXM.blood, backgroundColor: AXM.bloodSubtle, opacity: 1 } : { opacity: 0 }]}
                testID="combat-trash"
                accessible
                accessibilityLabel="Scrap bin. Drag a card here to discard it."
            >
                <TrashGlyph size={20} color={draggingCardUid ? AXM.blood : AXM.bone} />
                <Text style={[styles.trashLabel, draggingCardUid ? { color: AXM.blood } : null]}>SCRAP</Text>
            </View>

            {/* corner medallion — END PHASE. (The dice-reroll disc is deliberately
                gone: dice are the turn's hand, you play what you rolled.) */}
            <View style={[styles.cornerStack, { bottom: railH + 6 }]} pointerEvents="box-none">
                <EndPhaseMedallion onPress={handleEndPhase} consequence={endConsequence} disabled={resolving} />
            </View>
        </View>
    );
});

// ── A small fanned hand card ─────────────────────────────────────────────────

// Fallback word for a face that has no honest number (heroText === '').
function heroFace(f: CombatCardFaceVM): string {
    if (f.heroText) return f.heroText;
    switch (f.kind) {
        case 'befriend': return 'SPARE';
        case 'weaken': return 'softens';
        default: return 'minor';   // inert
    }
}

// The keyword line reads "KEYWORD value"; strip a leading keyword word from the
// hero string so it doesn't double (keyword GUARD + "Guard 12" → "12").
function paidValueText(f: CombatCardFaceVM, hero?: string): string {
    const base = hero ?? (f.heroText || heroFace(f));
    if (f.keyword) {
        const stripped = base.replace(new RegExp('^' + f.keyword + '\\s*', 'i'), '');
        return stripped || base;
    }
    return base;
}

// Deterministic per-card art variation (the temp art pool is smaller than the
// card pool, so paintings are shared): mirror for ~half the cards, keyed off id.
function artMirrored(cardId: string): boolean {
    let h = 0;
    for (let i = 0; i < cardId.length; i++) h = (h * 31 + cardId.charCodeAt(i)) | 0;
    return (h & 1) === 1;
}

// Option A rail values are terse: "over N turns" → "over Nt" etc.
function compactSub(s: string): string {
    return s.replace(/(\d+)\s*turns?\b/g, '$1t');
}

/**
 * The shared card FACE — Option A layout (owner-picked 2026-07-09) — instanced
 * small in the hand and LARGE in the inspect modal so the two can never drift.
 *   · per-card ART (temp pool, keyword-matched) fills the top region behind a
 *     stance-tint gradient wash;
 *   · a glossy stance ORB (category glyph, stance colour) top-left;
 *   · the card NAME on a stance-coloured bevelled band, mid-card;
 *   · a bottom rail SPLIT 50/50: ◇ FREE (keyword · value) | ◆ PAID (keyword ·
 *     value, category colour), a visible divider between the halves;
 *   · printed die lines as ONE small line under the split (when present);
 *   · the TYPE STRIP at the very foot ("BODY · SPELL" — CURSE for disenchant).
 * Identical wording at both sizes; definitions/pills/flavor live in the
 * inspect overlay, never on the face.
 */
export const CombatCardFace = React.memo(function CombatCardFace({
    card, width, height, large = false, accent = null, readPip = null, heroOverride, children,
}: {
    card: CombatCardVM;
    width: number;
    height: number;
    large?: boolean;
    /** Override the keyword/value/border colour (the armed staged-card read tint). */
    accent?: string | null;
    /** ▲ / ▼ / — read pip beside the keyword (read-dependent staged cards). */
    readPip?: string | null;
    /** Override the hero value text (e.g. the live-recomputed Guard number). */
    heroOverride?: string;
    children?: React.ReactNode;
}) {
    const AXM = usePalette();
    const styles = useStyles();
    const f = card.face;
    // STANCE rides the name band + orb + art tint; CATEGORY rides the frame (border)
    // + keyword colour — two orthogonal identity axes until per-card art ships.
    // Gold-rarity cards render with the NORMAL frame: no gold border/glow/star.
    const band = f.stanceColor;
    const baseKw = f.inert ? AXM.ash : f.categoryColor;
    const kwColor = accent ?? baseKw;
    const borderColor = accent ?? f.categoryColor;
    // ◆ PAID column value: the powered number (+ compact sub), or the exact
    // clause/word for numberless kinds — never a fabricated value.
    const numberless = !f.heroText && !heroOverride;
    const paidValue = numberless
        ? (f.heroSub ? compactSub(f.heroSub) : heroFace(f))
        : `${paidValueText(f, heroOverride)}${f.heroSub ? ` ${compactSub(f.heroSub)}` : ''}`;
    const freeValue = f.freeValue ?? f.freeHeroText;
    const orbR = large ? 22 : 13;
    return (
        <View style={[styles.faceOuter, { width, height }]}>
            <View style={[styles.faceCard, { borderColor }]}>
                {/* ART window — top region behind a bottom-up stance gradient */}
                <View style={[styles.faceArt, large && { height: '48%' }]} pointerEvents="none">
                    <Image
                        source={getCardArt(card.cardId)}
                        style={[StyleSheet.absoluteFill, artMirrored(card.cardId) && { transform: [{ scaleX: -1 }] }]}
                        contentFit="cover"
                        transition={0}
                    />
                    {/* stance wash, heavier toward the name band so the art melts into it */}
                    <View style={[styles.faceArtTint, { backgroundColor: f.stanceColor }]} />
                    <View style={[styles.faceArtTintLow, { backgroundColor: f.stanceColor }]} />
                </View>
                {/* glossy stance orb carrying the category glyph */}
                <View
                    style={[styles.orb, {
                        width: orbR * 2, height: orbR * 2, borderRadius: orbR,
                        top: large ? 8 : 4, left: large ? 8 : 4,
                        backgroundColor: f.inert ? AXM.ash : f.stanceColor,
                    }]}
                    pointerEvents="none"
                >
                    <View style={[styles.orbShine, { width: orbR * 0.9, height: orbR * 0.7, borderRadius: orbR * 0.5 }]} />
                    <Text style={[styles.orbGlyph, { fontSize: large ? 22 : 13 }]} allowFontScaling={false}>{f.glyph}</Text>
                </View>
                {children}
                <View style={styles.faceLower}>
                    <View style={[styles.nameBand, { backgroundColor: band }]}>
                        <View style={styles.nameBandShade} pointerEvents="none" />
                        <Text style={[styles.nameText, large && styles.nameTextLarge]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{card.name}</Text>
                    </View>
                    {/* Option A bottom rail — IDENTICAL wording at BOTH sizes:
                        ◇ FREE keyword·value | divider | ◆ PAID keyword·value.
                        Definitions/pills live OUTSIDE the face in the inspect
                        overlay; the face itself may never drift between the hand
                        and the modal. */}
                    <View style={styles.railSplit}>
                        <View style={styles.railHalf}>
                            <Text style={[styles.railHead, large && styles.railHeadLarge, { color: AXM.bone }]} numberOfLines={1} adjustsFontSizeToFit>
                                ◇ {f.freeKeyword ?? 'FREE'}
                            </Text>
                            <Text style={[styles.railValue, large && styles.railValueLarge, { color: AXM.parchment }]} numberOfLines={large ? 3 : 2} adjustsFontSizeToFit>
                                {freeValue}
                            </Text>
                        </View>
                        <View style={styles.railDivider} pointerEvents="none" />
                        <View style={styles.railHalf}>
                            <Text style={[styles.railHead, large && styles.railHeadLarge, { color: kwColor }]} numberOfLines={1} adjustsFontSizeToFit>
                                ◆ {f.keyword ?? 'DIE'}{readPip ? ` ${readPip}` : ''}
                            </Text>
                            <Text style={[styles.railValue, large && styles.railValueLarge, { color: kwColor }]} numberOfLines={large ? 3 : 2} adjustsFontSizeToFit>
                                {paidValue}
                            </Text>
                        </View>
                    </View>
                    {/* Fate Engine P1 — printed DIE LINES: one small line under the
                        split (Option A gives them no rail slot). */}
                    {card.dieLines?.length ? (
                        <Text style={[styles.faceDieLine, styles.railDieLine, !large && styles.faceDieLineSmall]} numberOfLines={1} adjustsFontSizeToFit>
                            {card.dieLines.join(' · ')}
                        </Text>
                    ) : null}
                    {/* TYPE STRIP at the very foot — printed identity, both sizes
                        (SPELL / ENCHANTMENT / CURSE; stance first). */}
                    <View style={styles.typeStrip}>
                        <Text style={[styles.typeStripText, large && styles.typeStripTextLarge]} numberOfLines={1} adjustsFontSizeToFit>{f.typeStrip}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
});

// The fanned hand card — a small instance of the shared face, art-forward at the
// reference's ~1:1.5 proportion. The fan-overlap math (band fit) keys off these
// same constants — keep them in sync. Option A: 108×158 → 132×194 (the split
// rail needs the room; the old size was illegible). Exported for the drag ghost.
export const HAND_CARD_W = 132;
export const HAND_CARD_H = 194;
function HandCard({ card }: { card: CombatCardVM }) {
    return <CombatCardFace card={card} width={HAND_CARD_W} height={HAND_CARD_H} />;
}

const useStyles = makeStyles((AXM) => ({
    root: { flex: 1, backgroundColor: AXM.bg },
    content: { flex: 1 },

    // ── play region (invisible drop target; dashed only while dragging) ──
    playRegion: {
        flex: 1, marginHorizontal: 10, marginBottom: 2, borderWidth: 1.5, borderStyle: 'dashed',
        borderColor: 'transparent', borderRadius: 10, justifyContent: 'flex-end',
    },
    playHint: {
        position: 'absolute', top: 8, alignSelf: 'center', fontFamily: FONTS.sans, fontSize: 11,
        letterSpacing: 1.4, color: AXM.sulfur, textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 3,
    },
    stagedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', alignItems: 'flex-end' },
    stageHint: {
        alignSelf: 'center', marginTop: 4, fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 12,
        color: AXM.bone, textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 3,
    },
    // Loud-rejection reason line (owner directive 2026-07-12) — the refusal,
    // said out loud where the drop just failed.
    rejectLine: {
        alignSelf: 'center', marginTop: 4, paddingHorizontal: 10, fontFamily: FONTS.sans, fontSize: 11,
        letterSpacing: 0.6, color: AXM.blood, textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.95)', textShadowRadius: 3,
    },
    // Dead-tray telegraph — sits directly above the dice it describes.
    deadTrayLine: {
        alignSelf: 'center', marginBottom: 2, paddingHorizontal: 12, fontFamily: FONTS.sans, fontSize: 10,
        letterSpacing: 0.8, color: AXM.sulfur, textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.95)', textShadowRadius: 3,
    },
    stagedCol: { alignItems: 'center' },
    dieSocket: { position: 'absolute', top: -10, right: -10, zIndex: 4 },
    dieSocketEmpty: {
        width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderStyle: 'dashed', borderColor: AXM.bone,
        backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
    },
    dieSocketGlyph: { fontFamily: FONTS.sans, fontSize: 13, color: AXM.bone },
    applyRibbon: {
        marginTop: -2, borderWidth: 1.5, borderTopWidth: 0, borderBottomLeftRadius: 6, borderBottomRightRadius: 6,
        paddingVertical: 5, alignItems: 'center',
    },
    applyText: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1.5 },
    // WS7.2 chosen X-cost — the amount picker row on a staged X card.
    xRow: {
        marginTop: -2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderTopWidth: 0, borderColor: AXM.bone, backgroundColor: 'rgba(0,0,0,0.55)',
    },
    xStepBtn: { paddingHorizontal: 10, paddingVertical: 3 },
    xStepGlyph: { fontFamily: FONTS.sans, fontSize: 14, color: AXM.parchment },
    xValue: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1, color: AXM.sulfur, minWidth: 34, textAlign: 'center' },

    // ── signature rune column ──
    sigColumn: { position: 'absolute', left: 6, top: '34%', alignItems: 'center', gap: 8, zIndex: 30 },
    convictionChip: {
        borderWidth: 1, borderColor: AXM.sulfur, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 7, paddingVertical: 3,
    },
    convictionText: { fontFamily: FONTS.gothic, fontSize: 15, letterSpacing: 0.5 },
    sigRune: {
        width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center', justifyContent: 'center',
    },
    sigRuneIcon: { fontSize: 18, lineHeight: 22 },
    sigCostBadge: {
        position: 'absolute', right: -4, bottom: -3, backgroundColor: 'rgba(0,0,0,0.92)', borderRadius: 7,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 3, paddingVertical: 0,
    },
    sigCostText: { fontFamily: FONTS.mono, fontSize: 9, lineHeight: 12 },

    // ── dice row ──
    diceRow: { flexDirection: 'row', gap: 26, justifyContent: 'center', alignItems: 'flex-start', minHeight: 74, paddingBottom: 2 },
    dieAssigned: { opacity: 0.4 },
    // Drawn X/dud die — a small greyed pip, not a full slot.
    dieXPip: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: '#3a3a3a', backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', opacity: 0.6, alignSelf: 'center' },
    dieFateHint: { fontFamily: FONTS.mono, fontSize: 7, color: '#d4c026', marginTop: 1 },
    faceDieLine: { fontFamily: FONTS.mono, fontSize: 9, color: '#d4c026', marginTop: 3, letterSpacing: 0.2 },
    bankChip: { borderWidth: 1, borderColor: '#3a3a3a', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
    bankChipText: { fontFamily: FONTS.mono, fontSize: 9, color: '#8a8a7a', letterSpacing: 0.5 },
    dieXGlyph: { fontFamily: FONTS.sans, fontSize: 12, color: '#8a8273' },
    dieConv: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone, textAlign: 'center', marginTop: 2, letterSpacing: 0.5, textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 3 },
    diePip: { fontFamily: FONTS.sans, fontSize: 10, textAlign: 'center', marginTop: 2, letterSpacing: 0.6, textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 3 },

    // ── the hand dock ── (Option A: fits the 194pt card raised ~20pt off the
    // screen bottom — was 178 for the 158pt card flush against the rail)
    dock: { height: 216, overflow: 'hidden' },

    // ── momentum wheel ──
    wheelRow: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 3, paddingHorizontal: 10, marginBottom: 2 },
    wheelNode: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    wheelNodeNext: { borderStyle: 'dashed' },
    wheelGlyph: { fontSize: 12, lineHeight: 15, textShadowRadius: 6, textShadowOffset: { width: 0, height: 0 } },
    wheelChevron: { fontFamily: FONTS.sans, fontSize: 13, color: '#5a5346', marginHorizontal: -1 },
    wheelCharged: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.6, marginLeft: 7, textShadowRadius: 7, textShadowOffset: { width: 0, height: 0 } },
    fanGlow: { position: 'absolute', bottom: 0, left: 0 },
    fan: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 12, paddingBottom: 20 },

    // ── bottom rail ──
    rail: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingLeft: 112, paddingRight: 104, backgroundColor: 'rgba(7,5,9,0.9)',
        borderTopWidth: 1, borderTopColor: AXM.divider,
    },
    railHp: { fontFamily: FONTS.mono, fontSize: 13, color: AXM.parchment, letterSpacing: 0.5 },
    railLedger: { flexDirection: 'row', gap: 4, alignItems: 'center' },
    railPiles: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    pileGlyph: { width: 13, height: 17, borderRadius: 2, borderWidth: 1, borderColor: AXM.ash, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
    pileGlyphText: { fontFamily: FONTS.mono, fontSize: 7, color: AXM.ash, lineHeight: 9 },
    pileCount: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.bone, marginRight: 5 },

    // ── SCRAP medallion (drag-time only) ──
    trashBin: {
        position: 'absolute', left: 10, zIndex: 40, width: 60, height: 60, borderRadius: 30,
        borderWidth: 2, borderStyle: 'solid', borderColor: AXM.ash, backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center', justifyContent: 'center',
    },
    trashLabel: { fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: AXM.bone, marginTop: 1 },

    // ── player status strip (in-flow, above the dice) ──
    statusStrip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 6 },
    guardChip: {
        fontFamily: FONTS.mono, fontSize: 11, color: '#6fb3e0', letterSpacing: 0.5,
        backgroundColor: 'rgba(0,0,0,0.7)', borderWidth: 1, borderColor: '#6fb3e055', borderRadius: 4,
        paddingHorizontal: 5, paddingVertical: 2, overflow: 'hidden',
    },

    // ── Premise track (phase 28) ──
    perorationTrack: { paddingHorizontal: 12, paddingBottom: 6, gap: 3 },
    perorationLabel: { fontFamily: FONTS.mono, fontSize: 10, color: '#d9b44a', letterSpacing: 0.4 },
    perorationBarTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.6)', overflow: 'hidden' },
    perorationBarFill: { height: '100%', borderRadius: 2 },

    // ── corner medallions ──
    cornerStack: { position: 'absolute', right: 10, alignItems: 'center', gap: 8, zIndex: 40 },
    endWrap: { width: 80, height: 80 },
    endBtn: {
        width: 80, height: 80, borderRadius: 40, borderWidth: 3, backgroundColor: '#0c0a06',
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    // WI-3 — dimmed while a phase resolves (double-tap guard); every other
    // disabled control in this board uses the same ~0.4 opacity treatment.
    endBtnDisabled: { opacity: 0.4 },
    endBtnInnerRim: {
        ...StyleSheet.absoluteFillObject, margin: 4, borderRadius: 36, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(212,192,38,0.10)',
    },
    endGlyph: { fontFamily: FONTS.gothic, fontSize: 30, lineHeight: 33 },
    endLabel: { fontFamily: FONTS.sans, fontSize: 9, letterSpacing: 2, marginTop: -1 },
    // The honest one-line END consequence (R2 telegraph, 2026-07-12) —
    // floats ABOVE the medallion (below would collide with the bottom rail).
    endConsequenceWrap: { position: 'absolute', top: -34, left: -30, width: 140, alignItems: 'center' },
    endConsequence: {
        fontFamily: FONTS.mono, fontSize: 8.5,
        letterSpacing: 0.4, color: AXM.sulfur, textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.95)', textShadowRadius: 3,
    },

    // ── Shared card FACE (hand · staged · inspect modal) ──────────────────────
    // Outer/inner double frame: 2pt near-black outside a category-coloured border.
    faceOuter: {
        borderRadius: 8, borderWidth: 2, borderColor: 'rgba(0,0,0,0.9)', backgroundColor: '#14110e',
        shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 6,
    },
    faceCard: { flex: 1, borderWidth: 1.5, borderRadius: 6, backgroundColor: '#14110e', overflow: 'hidden' },
    // Option A: art fills the top region — the name band anchors mid-card
    // beneath it, the split rail + type strip fill the remainder.
    faceArt: { width: '100%', height: '46%', backgroundColor: '#0c0a08' },
    faceArtTint: { ...StyleSheet.absoluteFillObject, opacity: 0.14 },
    faceArtTintLow: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%', opacity: 0.22 },
    faceLower: { flex: 1 },
    // Glossy stance orb (category glyph in the stance colour).
    orb: {
        position: 'absolute', zIndex: 3, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.65)',
        shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 3, shadowOffset: { width: 0, height: 2 }, elevation: 4,
    },
    orbShine: { position: 'absolute', top: 2, left: 3, backgroundColor: 'rgba(255,255,255,0.32)' },
    orbGlyph: { color: '#fff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 } },
    // Bevelled name banner — 1px top highlight + 1px bottom shadow reads as raised metal/wood.
    nameBand: {
        paddingVertical: 3, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center',
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.28)', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.45)',
    },
    nameBandShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.30)' },
    nameText: {
        fontFamily: FONTS.sans, fontSize: 12, lineHeight: 15, color: '#f1e7d0', letterSpacing: 0.5,
        textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 },
    },
    nameTextLarge: { fontFamily: FONTS.gothic, fontSize: 22, lineHeight: 26, color: '#f3e9d2', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } },
    // Option A bottom rail — 50/50 FREE | PAID split with a visible divider.
    railSplit: {
        flex: 1, flexDirection: 'row', alignItems: 'stretch',
        backgroundColor: 'rgba(10,8,6,0.62)',
    },
    railHalf: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, paddingVertical: 3, gap: 1 },
    railDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginVertical: 4 },
    railHead: { fontFamily: FONTS.sans, fontSize: 9, letterSpacing: 0.8 },
    railValue: { fontFamily: FONTS.mono, fontSize: 12, lineHeight: 14, textAlign: 'center' },
    // large-face scale-ups of the SAME rail (identical wording law).
    railHeadLarge: { fontSize: 15, letterSpacing: 1.4 },
    railValueLarge: { fontSize: 20, lineHeight: 23, marginTop: 2 },
    railDieLine: { alignSelf: 'center', marginTop: 0, marginBottom: 2, paddingHorizontal: 4 },
    faceDieLineSmall: { fontSize: 7, marginTop: 1 },
    // Option A type strip — full-width foot bar (printed identity).
    typeStrip: {
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', paddingVertical: 2,
    },
    typeStripText: { fontFamily: FONTS.sans, fontSize: 7, letterSpacing: 1.2, color: AXM.bone },
    typeStripTextLarge: { fontSize: 10, letterSpacing: 1.8, paddingVertical: 2 },
    // large-only effect body (Sanguine-Step shape) — fills the space under the name band.
    // Warm parchment-tone panel behind the effect text anchors it like a scroll.
    faceBody: { flex: 1, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(38,30,20,0.6)' },
    faceEffect: { fontFamily: FONTS.serif, fontSize: 14, lineHeight: 20, color: AXM.parchment, textAlign: 'center' },
    faceEffectBold: { fontFamily: FONTS.gothic, color: AXM.sulfur },
}));
