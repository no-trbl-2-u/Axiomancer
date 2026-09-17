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

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import { Image } from '@/lib/platform/image';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { Haptics } from '@/lib/platform/haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    FadeIn, FadeInDown, LinearTransition, runOnJS,
    useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming,
    type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import type {
    CombatViewModel, CombatCardVM, CombatDieVM,
    CombatSignatureVM, CombatEffectChipVM, CombatPerorationVM,
    CombatMomentumV2VM, CombatStanceChipVM, CombatSealVM,
} from '@/state/presenters/combat-encounter.engine';
import { armedReadValue, dieCanPowerCardVM, STANCE_COLORS } from '@/state/presenters/combat-encounter.engine';
import { wheelNext, type WheelStance } from '@/state/combat/momentum';
import type { CombatReadResult } from '@mechanics';
import { isUpgradeableDiceEnabled } from '@mechanics';
import { TrashGlyph, LedgerMark } from '@/components/hazard/glyphs';
import { glyphShapeFor } from '@/components/combat/glyphShapes';
import { CombatCombatantPane, EffectChips, SealChips, PlayerMedallion, COMBAT_HUD_HEIGHT, PLAYER_DOCK_FOOTPRINT_W, type CombatFx } from './CombatCombatantPane';
import { CombatDie } from './CombatDie';
import { RollingDie } from './RollingDie';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
    planDiceRoll, rollSignatureMap, resolveRollMode, shouldInstantSettleDice,
    type DieRollPlan,
} from '@/state/combat/dice-roll-ritual';
import { DICE_ROLL_TIMING } from '@/state/combat/dice-roll-ritual.timing';
import { juiceHaptics, useJuicePulse, useJuiceShake } from '@/lib/juice';

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
export function OutcomeText({ text, names, base, bold, numberOfLines }: { text: string; names: string[]; base: StyleProp<TextStyle>; bold: StyleProp<TextStyle>; numberOfLines?: number }) {
    const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).filter(Boolean);
    if (escaped.length === 0) return <Text style={base} numberOfLines={numberOfLines}>{text}</Text>;
    const upper = new Set(names.map((n) => n.toUpperCase()));
    const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'gi'));
    return (
        <Text style={base} numberOfLines={numberOfLines}>
            {parts.map((p, i) => (upper.has(p.toUpperCase()) ? <Text key={i} style={bold}>{p}</Text> : <Text key={i}>{p}</Text>))}
        </Text>
    );
}

// ── Signature rune column (left edge) ────────────────────────────────────────

function SignatureColumn({ conviction, signatures, onCast, onInfo, top, onMeasureHeight }: {
    conviction: number;
    signatures: CombatSignatureVM[];
    onCast: (id: string) => void;
    onInfo?: (s: CombatSignatureVM) => void;
    /** Measured anchor that keeps the column clear of the dice tray (see
     *  `sigTop` in `CombatBoard`). Undefined until the first layout pass, when
     *  the stylesheet's proportional `top` stands in. */
    top?: number;
    onMeasureHeight?: (h: number) => void;
}) {
    const AXM = usePalette();
    const styles = useStyles();
    return (
        <View
            style={[styles.sigColumn, top !== undefined ? { top } : null]}
            testID="combat-signature-bar"
            pointerEvents="box-none"
            onLayout={(e) => onMeasureHeight?.(e.nativeEvent.layout.height)}
        >
            <View
                style={styles.convictionChip}
                testID="combat-conviction"
                accessible
                accessibilityRole="text"
                accessibilityLabel={`${conviction} conviction`}
            >
                <Text style={[styles.convictionText, { color: AXM.sulfur }]} allowFontScaling={false}>◆ {conviction}</Text>
                {/* FE-021: name it. This chip is the board's whole economy — every
                  * rune below it is priced in ◆, and the enemy telegraph offers
                  * '+1◆' — but the word CONVICTION appeared nowhere on the board,
                  * only in the chip's accessibility label. A first-time player
                  * could see the number move and never learn what it was. */}
                <Text style={styles.convictionCaption} allowFontScaling={false}>CONVICTION</Text>
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
                    accessibilityLabel={`${s.name}, costs ${s.cost} conviction. ${s.description}${s.affordable ? '' : ` — ${s.reason ?? 'not enough conviction'}`}`}
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

// Owner declutter pass 2026-07-19: the 54pt cube crowded the board — shave ~1/8.
const TRAY_DIE_SIZE = 47;

// The rune column's resting anchor, and the gap it keeps above the dice tray
// when a long signature list would otherwise push it onto the dice.
const SIG_COLUMN_TOP_RATIO = 0.34;
const SIG_COLUMN_TOP = `${SIG_COLUMN_TOP_RATIO * 100}%` as const;
const SIG_TRAY_CLEARANCE = 10;

// One line of the bottom rail (VITAE · ledger · piles) before the safe-area
// inset. Exported for the rail test — the readout must sit inside this.
export const RAIL_LINE_H = 26;

// ── The hand fan's chrome-free band (cluster S1-board-C11) ───────────────────
// The two bottom corners are chrome, not board: the player medallion sits at
// left 10 and is PLAYER_DOCK_FOOTPRINT_W wide, the END stack at right 10 with
// an 80pt disc. The fan prefers the band BETWEEN them — but only a hand that
// actually seats there takes it (see `handFanLayout`); the board's own edge
// inset is the fallback, because five 120pt cards do not fit 183pt of phone.
export const END_CORNER_FOOTPRINT_W = 90;
export const HAND_FAN_LEFT = PLAYER_DOCK_FOOTPRINT_W;
export const HAND_FAN_RIGHT = END_CORNER_FOOTPRINT_W;
// Never tighter than a readable sliver, however large the hand.
export const HAND_FAN_MIN_STEP = 28;
// The board's own edge inset — the widest band the fan may honestly use, and
// the reference layout the corner medallions float above at a higher zIndex.
export const HAND_FAN_BOARD_EDGE = 12;

/**
 * Lay the hand fan out in the widest band it can honestly use (cluster
 * S1-board-C11).
 *
 * Inputs: `screenW` (viewport width) and `n` (number of fanned cards).
 * Outputs: `band` — the width the fan lays out in; `step` — the visible width
 * of each non-last card; `overlap` — the negative margin that produces it.
 *
 * Pure: the board calls it once per render. The chrome-free band between the
 * corner medallions is preferred, and a hand that seats there above the sliver
 * floor takes it — such a fan clears both corners entirely. A hand that does
 * NOT seat there takes the full board band instead: forcing it into the narrow
 * band shaved every card to the 28pt floor (four of five names cut to two
 * letters, all art and cost chips hidden, each a 28pt drag target) AND still
 * overflowed the band, so the last card landed half under the END disc with
 * its keyword chip cut mid-word. A readable fan the corner chrome floats over
 * beats an unreadable one crushed beside it.
 */
export function handFanLayout(screenW: number, n: number): { band: number; step: number; overlap: number } {
    const chromeBand = Math.max(HAND_CARD_W, screenW - HAND_FAN_LEFT - HAND_FAN_RIGHT);
    const seatsBesideChrome = n <= 1 || (chromeBand - HAND_CARD_W) / (n - 1) >= HAND_FAN_MIN_STEP;
    const band = seatsBesideChrome
        ? chromeBand
        : Math.max(chromeBand, screenW - HAND_FAN_BOARD_EDGE * 2);
    const step = n > 1
        ? Math.min(HAND_CARD_W - 16, Math.max(HAND_FAN_MIN_STEP, (band - HAND_CARD_W) / (n - 1)))
        : HAND_CARD_W;
    return { band, step, overlap: HAND_CARD_W - step };
}

function DiceRow({
    vm, dieGesture, draggingDieId, assignedDieIds, onFateTap,
}: {
    vm: CombatViewModel;
    dieGesture: (die: CombatDieVM) => ReturnType<typeof Gesture.Exclusive>;
    draggingDieId: string | null;
    assignedDieIds: Set<string>;
    onFateTap?: (dieId: string) => void;
}) {
    const AXM = usePalette();
    const styles = useStyles();

    // ── Spec 33 (Phase D6f) — The Roll Ritual (flag-on only) ─────────────────
    // The tumble choreographs the four dice onto the faces the engine ALREADY
    // rolled — it never decides an outcome. Flag-off, `ritual` is false and this
    // whole block collapses: the tray renders the untouched, byte-identical
    // `CombatDie` path below.
    const ritual = isUpgradeableDiceEnabled();
    const reducedMotion = useReducedMotion();
    const mode = resolveRollMode({ reducedMotion, instantSettle: shouldInstantSettleDice() });
    // Previous roll's face signatures — diffed so a round-start roll re-tumbles
    // everything while a Press-Fate reroll re-tumbles ONLY the rerolled dice.
    const prevSigRef = useRef<Record<string, string> | null>(null);
    const plansById = useMemo<Record<string, DieRollPlan>>(() => {
        if (!ritual) return {};
        const plans = planDiceRoll(vm.dice, prevSigRef.current, mode, DICE_ROLL_TIMING);
        const byId: Record<string, DieRollPlan> = {};
        for (const p of plans) byId[p.id] = p;
        return byId;
        // vm.dice is the roll identity; prevSigRef is read intentionally-stale.
    }, [vm.dice, mode, ritual]);
    useEffect(() => {
        if (ritual) prevSigRef.current = rollSignatureMap(vm.dice);
    }, [vm.dice, ritual]);
    // Tap-to-skip + the tray overlay gate (only while a die is mid-tumble).
    const [skipNonce, setSkipNonce] = useState(0);
    const tumblingIds = useRef<Set<string>>(new Set());
    const [anyTumbling, setAnyTumbling] = useState(false);
    const onTumbleChange = useCallback((id: string, on: boolean) => {
        const s = tumblingIds.current;
        if (on) s.add(id); else s.delete(id);
        setAnyTumbling(s.size > 0);
    }, []);

    return (
        <View style={styles.diceRow} testID="combat-dice-tray" pointerEvents="box-none">
            {vm.dice.map((die) => {
                // Fate Engine P1 — a Reserve die is a SECOND power source: draggable
                // onto a card any time (the single-die law still holds per play).
                // Spec 32 v3 §5 — a GHOST die likewise bypasses the one-die
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
                const dieDimmed = (!die.reserve && !die.floating && vm.hasDraft && !die.drafted) || draggingDieId === die.id;
                // The SPECIAL face's real payload (gear may raise it above the
                // stock 2) — spoken in the die's a11y label.
                const specialConviction = vm.dieGear?.slots.find((s) => s.color === die.color)?.specialConviction;
                const node = (
                    <View style={isAssigned ? styles.dieAssigned : undefined}>
                        {ritual && plansById[die.id] ? (
                            <RollingDie
                                die={die}
                                size={TRAY_DIE_SIZE}
                                dimmed={dieDimmed}
                                mode={mode}
                                plan={plansById[die.id]}
                                skipNonce={skipNonce}
                                onTumbleChange={onTumbleChange}
                                assigned={isAssigned}
                                specialConviction={specialConviction}
                            />
                        ) : (
                            <CombatDie die={die} size={TRAY_DIE_SIZE} dimmed={dieDimmed} assigned={isAssigned} specialConviction={specialConviction} />
                        )}
                        {die.reserve ? (
                            <Text style={[styles.dieConv, { color: AXM.sulfur }]} testID={`combat-reserve-${die.id}`}>
                                ⏳{die.pips ? ` +${die.pips}✦` : ''} BANKED
                            </Text>
                        ) : null}
                        {die.floating ? (
                            <Text style={[styles.dieConv, { color: AXM.sulfur }]} testID={`combat-floating-${die.id}`}>
                                ✦ GHOST
                            </Text>
                        ) : null}
                        {draggable && !die.reserve && !die.floating && die.readPip && die.readPip !== 'none' ? (
                            <Text style={[styles.diePip, { color: READ_ACCENT[die.readPip] }]}>
                                {die.readPip === 'advantage' ? '▲ ADV' : die.readPip === 'disadvantage' ? '▼ DIS' : '— EVEN'}
                            </Text>
                        ) : null}
                        {/* P2 — the spare was already converted at draft; the old
                            future-tense "→ +1 ◆" lied. State it in the past.
                            Spec 33 (flag-on): a faced die (mana/special/miss) is
                            not a draft-burned spare — the gem carries its face
                            state, so this legacy spare label is suppressed. */}
                        {!die.reserve && !die.floating && !die.face && vm.hasDraft && !die.drafted && <Text style={styles.dieConv}>burned +1 ◆</Text>}
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
            {/* Spec 33 (Phase D6f) — tap-to-skip: while any die is mid-tumble a
                transparent overlay catches a tap and snaps every die to its
                settled (engine-rolled) face. Absent once settled, so it never
                sits in front of the dice drags. */}
            {ritual && anyTumbling ? (
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={() => setSkipNonce((n) => n + 1)}
                    testID="combat-dice-skip"
                    accessibilityRole="button"
                    accessibilityLabel="Skip the dice roll animation"
                />
            ) : null}
        </View>
    );
}

// ── Staged card (die socket · fused APPLY ribbon) ────────────────────────────

export const StagedCard = React.memo(function StagedCard({
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
    // Drop-confirmation pop (a nudge, not the full status-proc "main event")
    // and rejection SHAKE (loud rejection, owner directive 2026-07-12: a quick
    // left-right shudder on the exact card that refused the drop) — lib/juice
    // primitives (phase 38), reduced-motion + escape-hatch gated centrally.
    const popStyle = useJuicePulse(popKey, 0.4);
    const shakeStyle = useJuiceShake(rejectKey, 'low');
    const armed = assignedDie !== null;
    const readColor = armed ? (READ_ACCENT[read] ?? AXM.bone) : AXM.bone;
    // Option A rail needs width: staged faces track the hand-card proportion
    // (shaved with it in the 2026-07-19 declutter pass).
    const cardW = compact ? 92 : 112;
    const cardH = compact ? 135 : 164;
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
                  {/* inner wrappers carry the drop-pop scale + reject shake so
                      neither fights the outer entering animation's transform —
                      nested so each juice primitive's own transform composes
                      independently (RN style-array merge does not combine two
                      `transform` arrays) — and the COLOR-LAW dim (an off-color
                      die in flight can't land here; matches the
                      sigRune/dieAssigned disabled-opacity language). */}
                  <Animated.View style={shakeStyle}>
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
                                {/* The socket's copy answers to its OWN id — the prefix
                                    warning above applies to the die face too, not just
                                    this wrapper: an armed card otherwise put a second
                                    `combat-die-<id>` node on the board. */}
                                <CombatDie die={assignedDie} size={compact ? 26 : 32} testID="combat-staged-die-face" assigned />
                            </View>
                        ) : (
                            <View style={[styles.dieSocketEmpty, socketPulse ? { borderColor: AXM.sulfur, backgroundColor: 'rgba(212,192,38,0.18)' } : null]}>
                                <Text style={[styles.dieSocketGlyph, socketPulse ? { color: AXM.sulfur } : null]}>⬡</Text>
                            </View>
                        )}
                    </View>
                  </Animated.View>
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

// ── Spec 33 §3 (Phase D6b, flag-on) — Momentum-V2 chain chip ─────────────────

const CHAIN_GLYPHS: Record<string, string> = { heart: '♥', body: '⚡', mind: '★' };

// S1-board-C19 — the momentum chip's ⓘ tap mark is a plated box of this
// width, set apart by this gap; `chipInfoGutter` mirrors the pair on the row's
// leading edge so the readout keeps the centre line it held before the mark.
// The glyph measures ~15pt in the capture (U+24D8 rides wide), so the box is
// sized to seat it with a plate's worth of air, borders included.
export const CHIP_INFO_MARK_W = 24;
export const CHIP_INFO_MARK_GAP = 5;

/** The spec-33 momentum chain: a single color + length (heart→body→mind),
 *  NOT the three-node wheel. A BREAK collapses it to null and reads LOUD
 *  (owner-locked strict rule — the chip teaches it); a SURGE flashes gold.
 *
 *  Inputs: the momentum-V2 VM and the "how momentum works" opener. Output: the
 *  chip row. Cluster S1-board-C19 — this chip OPENS something and the stance
 *  chip directly below it does not, so it now carries a visible ⓘ mark: the
 *  tappable one of the pair is the one that says it is tappable. The mark
 *  carries its own backing plate (it sits on the arena floor, not on the
 *  readout's plate) and a mirrored leading gutter, so marking the chip neither
 *  costs the mark its contrast nor costs the readout its centre line. */
function MomentumChainChip({ vm, onPress }: { vm: CombatMomentumV2VM; onPress?: () => void }) {
    const AXM = usePalette();
    const styles = useStyles();
    const { color, length, chain, surgeAt, next, broke, surged, a11y } = vm;
    return (
        <Pressable
            style={styles.wheelRow}
            onPress={onPress}
            testID="combat-momentum-v2"
            accessibilityRole="button"
            accessibilityLabel={a11y}
            accessibilityHint="Tap for how momentum works"
        >
            {/* S1-board-C19 — the tap mark's mirror. An empty box of the mark's
                own footprint, so adding the mark did not shove the readout off
                the centre line it held. */}
            <View style={styles.chipInfoGutter} testID="combat-momentum-info-gutter" />
            {broke ? (
                <Text style={[styles.chainBroke, { color: AXM.blood }]} allowFontScaling={false} testID="combat-momentum-broke">
                    ✕ MOMENTUM BROKEN
                </Text>
            ) : surged ? (
                <Text style={[styles.wheelCharged, { color: AXM.sulfur, textShadowColor: AXM.sulfur }]} allowFontScaling={false} testID="combat-momentum-surged">
                    ✦ MOMENTUM SURGE
                </Text>
            ) : color === null || length === 0 ? (
                <Text style={[styles.chainEmpty, { color: AXM.ash }]} allowFontScaling={false} testID="combat-momentum-empty">○ no momentum</Text>
            ) : (
                <>
                    {Array.from({ length: surgeAt }, (_u, i) => {
                        // Each lit node keeps the stance that was ACTUALLY played
                        // (vm.chain, play order) — a heart→body chain reads ♥ ⚡,
                        // never two copies of the chain's current color.
                        const link = chain[i];
                        const filled = link !== undefined;
                        const nodeHex = link ? STANCE_COLORS[link] : AXM.ash;
                        return (
                            <View
                                key={i}
                                style={[
                                    styles.chainNode,
                                    { borderColor: filled ? nodeHex : AXM.ash, backgroundColor: filled ? `${nodeHex}30` : 'rgba(0,0,0,0.5)' },
                                ]}
                            >
                                <Text style={[styles.wheelGlyph, { color: filled ? nodeHex : AXM.ash, textShadowColor: filled ? nodeHex : 'transparent' }]} allowFontScaling={false}>
                                    {link ? (CHAIN_GLYPHS[link] ?? '◆') : '·'}
                                </Text>
                            </View>
                        );
                    })}
                    {next ? (
                        <Text style={[styles.chainNext, { color: STANCE_COLORS[next] ?? AXM.bone }]} allowFontScaling={false}>
                            → {CHAIN_GLYPHS[next] ?? ''}
                        </Text>
                    ) : null}
                </>
            )}
            {/* S1-board-C19 — the tap mark. Always drawn, in every chain state,
                so the chip never reads as the inert stance chip below it. */}
            <Text style={styles.chipInfoMark} allowFontScaling={false} testID="combat-momentum-info-mark">ⓘ</Text>
        </Pressable>
    );
}

// ── Spec 33 §2 (Phase D6b, flag-on) — player current-stance chip ─────────────

/** The player's current stance, as an INERT readout.
 *
 *  Input: the stance-chip VM. Output: the chip row. Cluster S1-board-C19 — it
 *  sat directly under the momentum chip, in the same pill, reading a bare
 *  'NO STANCE'; the two looked like one control each, but only the momentum
 *  one opened anything. The momentum chip now carries a ⓘ tap mark and this
 *  one names itself — STANCE ♥ HEART — so it reads as a labelled value, never
 *  a button that refuses to answer. ('NO STANCE' already carries the word, so
 *  the caption is dropped there rather than stuttering it twice.)
 *
 *  Cluster S1-board-C34 — the empty read stopped at the state word and left
 *  the way out unnamed, on a chip that cannot be tapped for more. It now
 *  prints the presenter's `hint` beside it: the action that fills the chip. */
function StanceChip({ vm }: { vm: CombatStanceChipVM }) {
    const AXM = usePalette();
    const styles = useStyles();
    const active = vm.stance !== null;
    return (
        <View
            style={[styles.stanceChip, { borderColor: active ? vm.colorHex : AXM.ash }]}
            testID="combat-player-stance"
            accessible
            accessibilityRole="text"
            accessibilityLabel={vm.a11y}
        >
            {active ? (
                <Text style={styles.stanceChipCaption} allowFontScaling={false} testID="combat-player-stance-caption">STANCE</Text>
            ) : null}
            <Text style={[styles.stanceChipGlyph, { color: active ? vm.colorHex : AXM.ash }]} allowFontScaling={false}>{vm.glyph}</Text>
            <Text style={[styles.stanceChipLabel, { color: active ? vm.colorHex : AXM.bone }]} allowFontScaling={false}>{vm.label}</Text>
            {/* S1-board-C34 — the empty state names the action that fills it. */}
            {vm.hint ? (
                <Text style={styles.stanceChipHint} allowFontScaling={false} numberOfLines={1} testID="combat-player-stance-hint">
                    · {vm.hint}
                </Text>
            ) : null}
        </View>
    );
}

// THE STAKE (Phase 31/EA-7) is RETIRED EVERYWHERE (owner call 2026-07-18,
// completing spec 33 §5's flag-on retirement): the pre-play wager UI is gone
// on every surface, legacy kill-switch included. Engine plumbing
// (`placeStake`/`settleStake`) awaits its own mechanics-side removal.

// ── Charge track + CONDEMN beat (phase 28) ──────────────────────────────────

/** Peroration was fully engine-side state with zero combat-UI rendering
 *  before phase 28 — "the deck's whole win condition is invisible." */
function PerorationTrack({ peroration }: { peroration: CombatPerorationVM }) {
    const AXM = usePalette();
    const styles = useStyles();
    if (!peroration.active) return null;
    const pct = peroration.at > 0 ? Math.min(1, peroration.premises / peroration.at) : 0;
    const a11y = `Sentence declared: ${peroration.cardName}. Charge ${peroration.premises} of ${peroration.at}`
        + (peroration.concedeAt ? `, condemns the fight outright at ${peroration.concedeAt} Charges.` : '.');
    return (
        <View style={styles.perorationTrack} testID="combat-peroration" accessible accessibilityRole="text" accessibilityLabel={a11y}>
            <Text style={styles.perorationLabel} numberOfLines={1} allowFontScaling={false}>
                ☞ {peroration.cardName.toUpperCase()} · {peroration.premises}/{peroration.at}
                {peroration.concedeAt ? ` · CONDEMN ${peroration.concedeAt}` : ''}
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
                <View style={styles.endConsequenceWrap} pointerEvents="none" testID="combat-end-consequence-wrap">
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
    /** Tap a Seal chip (Phase 50) → the CRACK/WAIT confirm sheet. */
    onSeal?: (s: CombatSealVM) => void;
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
    /** Reports the enemy HUD's measured bottom edge (screen-top-relative) on
     *  every layout pass, so panel-level siblings anchored under the same HUD
     *  (the LOG toggle, the tutorial coach) can track its real height instead
     *  of the static `COMBAT_HUD_HEIGHT` estimate. */
    onHudLayout?: (height: number) => void;
    /** The live map region (`vm.region` from the exploration screen), keying
     *  the arena backdrop plate (phase 83). Omitted by the dev-only sandbox
     *  route, which falls back to the plate every unmapped region gets. */
    region?: string;
}

export const CombatBoard = React.memo(function CombatBoard({
    vm, drag, stagedUids, onApply, onStage, onUnstage, onDiscard, onSignature, onEndPhase, resolving = false, onInspect, onChip, onSeal, onSignatureInfo, onPlayerInspect, momentum, onMomentumInfo, fx,
    onFateTap, onReprisalNeeded, onHudLayout, region,
}: CombatBoardProps) {
    const AXM = usePalette();
    const styles = useStyles();
    // Null-safe insets (the context is null with no SafeAreaProvider, e.g. in tests).
    const insets = useContext(SafeAreaInsetsContext);
    const topInset = insets?.top ?? 0;
    const bottomInset = insets?.bottom ?? 0;
    // Measured HUD bottom (see `onHudLayout` doc above) — falls back to the
    // static estimate until the first layout pass lands, same pattern as
    // `sigTop` below.
    const [hudMeasuredH, setHudMeasuredH] = useState(0);
    const hudBottom = hudMeasuredH > 0 ? hudMeasuredH : topInset + COMBAT_HUD_HEIGHT;
    const handleHudLayout = useCallback((h: number) => {
        setHudMeasuredH(h);
        onHudLayout?.(h);
    }, [onHudLayout]);
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
                juiceHaptics.impact(Haptics.ImpactFeedbackStyle.Rigid);
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
                juiceHaptics.notify(Haptics.NotificationFeedbackType.Error);
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
    // Tap-to-power (playtest 2026-09-04: a tap on a die did nothing). With
    // exactly ONE card staged, a tap routes the die to it exactly as a drop
    // would — through the same `resolveDieDropTarget` gate (THE COLOR LAW +
    // one-die-per-card), so an illegal pairing is refused silently, the way a
    // tap has no card to shake. Any other staging count keeps drag-only: the
    // player must say WHICH card. Latest-closure ref, stable JS bridge.
    const dieTapRef = useRef<(dieId: string) => void>(() => undefined);
    dieTapRef.current = (dieId: string) => {
        if (stagedUids.length !== 1) return;
        const die = diceMapRef.current.get(dieId);
        if (!die || !die.draggable) return;
        const target = resolveDieDropTarget(die, stagedUids[0], true, stagedUids, stanceOfUid, pendingDieByUid);
        if (!target) return;
        juiceHaptics.impact(Haptics.ImpactFeedbackStyle.Rigid);
        setPendingDieByUid((prev) => ({ ...prev, [target]: dieId }));
        setDropPop((prev) => ({ uid: target, n: prev.n + 1 }));
    };
    const tapDieJS = useCallback((dieId: string) => { dieTapRef.current(dieId); }, []);

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
            const tap = Gesture.Tap().maxDistance(9).onEnd(() => { runOnJS(tapDieJS)(die.id); });
            g = Gesture.Exclusive(pan, tap);
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
    // Width is the binding constraint. S1-board-C11: the fan prefers the
    // chrome-free band BETWEEN the corner medallions (see `handFanLayout`),
    // and falls back to the full board band for a hand too large to seat
    // there — readable cards the corners float over, never a row of slivers.
    const { overlap } = handFanLayout(screenW, n);
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

    // ── the rune column must never sit on the tray ──────────────────────────
    // `sigColumn` is absolutely positioned and grows DOWNWARD with the
    // signature count. Measured 2026-09-03 (live e2e probe): with a full
    // loadout it reached into the dice row, and `elementFromPoint` at the
    // leftmost die's centre returned the rune button, not the die — so that
    // die could not be dragged at all, and a tap aimed at it cast a signature
    // and spent Conviction instead. Anchor the column off the MEASURED tray
    // top so its last rune always clears the tray, however many signatures the
    // loadout grants and however many rows the tray wraps to. Falls back to the
    // stylesheet's proportional `top` until the first layout pass lands.
    const [contentH, setContentH] = useState(0);
    const [trayTop, setTrayTop] = useState(0);
    const [sigH, setSigH] = useState(0);
    const sigTop = contentH > 0 && trayTop > 0 && sigH > 0
        ? Math.max(0, Math.min(contentH * SIG_COLUMN_TOP_RATIO, trayTop - sigH - SIG_TRAY_CLEARANCE))
        : undefined;

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
    // The rail is at least one 26pt line plus the home-indicator inset, and it
    // GROWS if its row wraps (a long phase ledger on a narrow phone) — it never
    // clips. Playtest 2026-09-04 at 390x844: the row overflowed its width, the
    // VITAE text wrapped to a second line under a fixed 26pt height, and the
    // number fell off the bottom of the screen. The floating chrome (SCRAP,
    // END) keys off the MEASURED height so it always sits above the rail.
    const [railMeasuredH, setRailMeasuredH] = useState(0);
    const railMinH = RAIL_LINE_H + bottomInset;
    const railH = Math.max(railMinH, railMeasuredH);

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
                onHudLayout={handleHudLayout}
                region={region}
            />

            {/* interactive column */}
            <View
                style={styles.content}
                pointerEvents="box-none"
                onLayout={(e) => setContentH(e.nativeEvent.layout.height)}
            >
                {/* clearance under the floating top HUD — the measured height
                    once it lands, so a tall HUD (stance-check telegraph, alt-win
                    meters) never overlaps the play region below it */}
                <View style={{ height: hudBottom }} pointerEvents="none" />

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

                {/* momentum — spec-33 chain chip (flag-on) supersedes the old
                    three-node wheel; both stance-sequence combo trackers. */}
                {vm.momentumV2 ? (
                    <MomentumChainChip vm={vm.momentumV2} onPress={onMomentumInfo} />
                ) : momentum ? (
                    <MomentumWheel lit={momentum.lit} charged={momentum.charged} onPress={onMomentumInfo} />
                ) : null}

                {/* Spec 33 §2 (flag-on) — the player's current-stance chip. */}
                {vm.playerStance ? <StanceChip vm={vm.playerStance} /> : null}

                {/* Charge track + CONDEMN beat (phase 28) — the Sentence theme's win condition */}
                <PerorationTrack peroration={vm.peroration} />

                {/* player status strip — IN FLOW (not floated over the fan, where the
                    hand's gesture area swallowed the taps) so every tile stays tappable.
                    RIGHT-aligned (owner playtest 2026-07-18): the left edge belongs to
                    the signature-rune column, which was hiding these tiles. */}
                {(vm.player.effects.length > 0 || vm.player.guard > 0 || vm.player.seals.length > 0
                    || vm.player.wrathVisible || vm.player.chainVisible || vm.player.twinArmed) && (
                    <View style={styles.statusStrip} pointerEvents="box-none">
                        {vm.player.guard > 0 ? <Text style={styles.guardChip} testID="combat-guard">🛡 {vm.player.guard}</Text> : null}
                        {/* THE BIG NUMBERS REWRITE — the damage-scaler ledgers. They
                            rode invisibly before: WRATH is combat-long, CHAIN dies at
                            the end of a turn that fed it nothing, and neither was on
                            the board. Same rail as GUARD, same visibility law as the
                            alt-win meters (a value, or a deck that feeds one). */}
                        {vm.player.wrathVisible ? (
                            <Text style={[styles.ledgerChip, { color: AXM.blood, borderColor: AXM.bloodMed }]} testID="combat-wrath">
                                ⚔ WRATH {vm.player.wrath}
                            </Text>
                        ) : null}
                        {vm.player.chainVisible ? (
                            <Text style={[styles.ledgerChip, { color: AXM.sulfur, borderColor: AXM.sulfurMed }]} testID="combat-chain">
                                ⛓ CHAIN {vm.player.chain}
                            </Text>
                        ) : null}
                        {vm.player.twinArmed ? (
                            <Text style={[styles.ledgerChip, { color: AXM.parchment, borderColor: AXM.divider }]} testID="combat-twin">
                                ‡ TWIN
                            </Text>
                        ) : null}
                        <EffectChips effects={vm.player.effects} onChip={onChip} align="flex-end" />
                        {/* Phase 50 — Seal chips (Phase 33d's state.glyphs, renamed "Seal" per
                            Phase 49 decision 3), merged into this row per Phase 49 decision 1. */}
                        <SealChips seals={vm.player.seals} onSeal={onSeal} />
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
                {/* Spec 33 §4 — Press Fate has NO board control of its own (owner
                    call 2026-07-19): it is a signature, cast from the rune column
                    like every other. The presenter reshapes its rune flag-on
                    (1◆ cost + the full firing gate + refusal reason). */}
                {/* The tray outranks the rune column in z-order (2026-09-13,
                    re-fixed 2026-09-13). `sigTop` keeps the column clear of the
                    tray whenever there is room, but it is derived from THREE
                    measured values (`contentH`, `trayTop`, `sigH`) held in
                    state: for the frame between a re-layout and the re-render
                    that follows it, the column is still at its previous anchor
                    and can sit over the tray. In that frame `elementFromPoint`
                    at a die's centre returns a rune button, so the die cannot
                    be dragged and a tap aimed at it casts a signature and
                    spends Conviction instead. Ranking the tray's zIndex (31)
                    above the column's (30) is only real if they are SIBLINGS —
                    react-native-web gives every plain View `position: relative;
                    z-index: 0` by default, so this tray layer used to be
                    trapped inside `content`'s own stacking context while the
                    column floated as `content`'s SIBLING at the `root` level.
                    There, `content` (z-index 0) always lost to the column
                    (z-index 30) regardless of the tray's internal 31, so the
                    column painted — and hit-tested — on top of the tray
                    whenever they overlapped. CI caught exactly that (PR #306,
                    boss seed 16, round 9 one run and round 5 the next — the
                    round is incidental, the stacking bug is not; it reproduced
                    again on main at d4468c21, the merge that already carried
                    the first zIndex attempt). The column is rendered as this
                    layer's own sibling below so the 31-vs-30 comparison is a
                    real one: a die wins the hit test no matter what the
                    measurements are doing; the clearance clamp still does the
                    visual work. */}
                <View
                    onLayout={(e) => setTrayTop(e.nativeEvent.layout.y)}
                    pointerEvents="box-none"
                    style={styles.trayLayer}
                >
                    <DiceRow vm={vm} dieGesture={dieGesture} draggingDieId={draggingDieId} assignedDieIds={assignedDieIds} onFateTap={onFateTap} />
                </View>

                {/* signature rune column — left edge. A sibling of the tray
                    layer above (both direct children of `content`) so their
                    explicit zIndex values actually compete in one stacking
                    context — see the comment on the tray layer. */}
                <SignatureColumn
                    conviction={vm.conviction} signatures={vm.signatures} onCast={onSignature} onInfo={onSignatureInfo}
                    top={sigTop} onMeasureHeight={setSigH}
                />

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
                                        transform: [{ translateY: 2 + Math.abs(i - mid) * 3 }, { rotate: `${(i - mid) * 3}deg` }],
                                    }}
                                    testID={`combat-hand-${card.uid}`}
                                    accessible accessibilityRole="button"
                                    accessibilityLabel={`${card.name}, ${card.stance} card. ${card.face.verbLine}.`}
                                    accessibilityHint="Drag up to stage, or tap to read"
                                >
                                    {/* The in-flight dim lives on a plain inner view: FadeIn
                                        drives `opacity` on the animated wrapper, and an
                                        `opacity` style on that same node is what Reanimated
                                        warns "may be overwritten by a layout animation" —
                                        once per hand card, every draw (playtest 2026-09-04). */}
                                    <View style={draggingCardUid === card.uid ? styles.handCardLifted : null}>
                                        <HandCard card={card} />
                                    </View>
                                </Animated.View>
                            </GestureDetector>
                        ))}
                    </View>
                </View>

                {/* bottom rail — ♥ HP · phase ledger · deck/discard */}
                <View
                    style={[styles.rail, { minHeight: railMinH, paddingBottom: bottomInset }]}
                    testID="combat-rail"
                    onLayout={(e) => setRailMeasuredH(e.nativeEvent.layout.height)}
                >
                    {/* FE-016: print the maximum. The enemy's bar above reads
                      * '120 /120', so a bare '♥ 160' down here gave no way to tell
                      * whether 160 is most of my VITAE or nearly none of it — the
                      * one number a player checks before spending a turn. maxHp was
                      * already on the view model, just unused. */}
                    <Text
                        style={styles.railHp}
                        numberOfLines={1}
                        allowFontScaling={false}
                        testID="combat-rail-vitae"
                        accessibilityLabel={`VITAE ${vm.player.hp} of ${vm.player.maxHp}`}
                    >
                        ♥ {vm.player.hp}<Text style={styles.railHpMax}> / {vm.player.maxHp}</Text>
                    </Text>
                    <View style={styles.railLedger} testID="combat-ledger">
                        {vm.ledger.map((m, i) => <LedgerMark key={i} kind={m === 'clear' ? 'O' : m === 'overwhelmed' ? 'X' : 'pending'} size={14} />)}
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

// Deterministic per-card art variation (the temp art pool is smaller than the
// card pool, so paintings are shared): mirror for ~half the cards, keyed off id.
function artMirrored(cardId: string): boolean {
    let h = 0;
    for (let i = 0; i < cardId.length; i++) h = (h * 31 + cardId.charCodeAt(i)) | 0;
    return (h & 1) === 1;
}

/**
 * Compact the FREE value to what sits INSIDE the glyph — its intensity (the
 * effect owns the duration): "i1 d1" → "+1", "3 rounds" → "3r", "2" → "+2",
 * "×4 · 3t" → "×4".
 *
 * Input: the face's raw FREE value (or its hero line), or null.
 * Output: a WHOLE value, never a fragment — '' when nothing whole fits.
 *
 * Resolves cluster S1-board-C32: the old fallback was `v.slice(0, 3)`, which
 * cut any unmatched string mid-word — the '×4 · 3t' the presenter prints for
 * an applyEffect rider reached the card face as the three characters "×4 "
 * (trailing space included), which reads as a chopped sentence, not a value.
 * The ×N intensity now has its own branch, and the last resort keeps a whole
 * short token or prints nothing (the glyph still carries the read; the
 * inspect overlay carries the full truth).
 */
export function compactFree(v: string | null): string {
    if (!v) return '';
    const s = v.trim();
    const im = s.match(/i(\d+)/i);
    if (im) return `+${im[1]}`;
    const rm = s.match(/^(\d+)\s*rounds?$/i);
    if (rm) return `${rm[1]}r`;
    // The presenter's applyEffect rail: '×4 · 3t', '×1 (enemy)', '×4 · 3t +'.
    const xm = s.match(/×\s*(\d+)/);
    if (xm) return `×${xm[1]}`;
    const nm = s.match(/^\+?(\d+)/);
    if (nm) return `+${nm[1]}`;
    const head = s.split(/\s+/)[0];
    return head.length <= 3 ? head : '';
}

// Darken a #rrggbb by a factor (0..1) — the stance cube's shaded faces.
function darkenHex(hex: string, f: number): string {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex);
    if (!m) return hex;
    const n = parseInt(m[1], 16);
    const r = Math.round(((n >> 16) & 255) * f);
    const g = Math.round(((n >> 8) & 255) * f);
    const b = Math.round((n & 255) * f);
    return `rgb(${r},${g},${b})`;
}

// The stance cube — a small isometric die that flags "this line costs a die",
// tinted the card's stance colour (matches the #5 rail design).
function StanceCube({ color, size }: { color: string; size: number }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M12 3 L21 8 L12 13 L3 8Z" fill={color} />
            <Path d="M3 8 L12 13 L12 21 L3 16Z" fill={darkenHex(color, 0.68)} />
            <Path d="M21 8 L12 13 L12 21 L21 16Z" fill={darkenHex(color, 0.42)} />
        </Svg>
    );
}

// The PAID value beside the face's keyword — the presenter's honest number
// (`heroText`), or its qualitative word (`heroSub`) for the kinds that have no
// number. A leading repeat of the keyword is stripped so the two slots never
// print the same word twice ('GUARD' + 'Guard 12' → 'GUARD' + '12').
function paidValueFor(f: CombatCardVM['face'], override?: string): string {
    const raw = (override ?? f.heroText ?? '').trim() || (f.heroSub ?? '').trim();
    if (!raw || !f.keyword) return raw;
    const kw = f.keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return raw.replace(new RegExp(`^${kw}\\s+`, 'i'), '').trim() || raw;
}

/**
 * The shared card FACE — THE PRINTED PLATE (owner reset 2026-08-28: "dump the
 * card design … full freedom" — the #5 side-rail face is retired). Cards read
 * as pages of the codex, in line with the ratified Woodcut Codex direction:
 *   · ① NAME BAND, top, HORIZONTAL, blackletter on solid ink — the fan shows
 *     each card's left edge, so the name now reads without turning your head;
 *     rarity is a small wax pip at the band's head, not a text tag;
 *   · ② ART PLATE — a framed print with a hairline rule and dark margins, not
 *     a full-bleed background. No stance wash, no scrim: the plate is clean
 *     and the text never fights the art for contrast;
 *   · ③ LEDGER, bottom, solid ink ground — FREE cell (glyph + intensity,
 *     category colour) | hairline rule | PAID cell (stance die cube +
 *     KEYWORD + value). In the fan the visible sliver is name-start + FREE
 *     effect: the two fastest reads.
 * Stance colours the frame + die cube; category colours the glyph + keyword.
 * Instanced small in the hand and LARGE in the inspect modal so the two can
 * never drift.
 *
 * Owner directive 2026-08-10 still governs: the face carries NO prose. The
 * authored PAID sentence, the type strip, and the printed die lines live in
 * the inspect overlay. The face is the glance read (name · free glyph ·
 * keyword · value); the overlay is the explanation.
 */
/** Below this face width the ledger stacks (see `narrow` in `CombatCardFace`).
 *  The hand card (120) sits above it; the reward offer (100) and the compact
 *  staged card (92) below. Exported for the face test. */
export const NARROW_FACE_W = 112;

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
    // PRINTED PLATE: STANCE colours the frame + the die cube; CATEGORY colours
    // the FREE glyph + the keyword. Inert cards grey both honestly.
    const band = f.stanceColor;
    const baseKw = f.inert ? AXM.ash : f.categoryColor;
    const kwColor = accent ?? baseKw;
    const paidValue = paidValueFor(f, heroOverride);
    const freeInner = compactFree(f.freeValue ?? (f.freeHeroText || null));
    const hasFree = !!f.freeGlyph;
    // Effect-shaped silhouette for the FREE glyph (owner directive 2026-07-16);
    // keywords without a shape keep the text rune.
    const freeShape = glyphShapeFor(f.freeGlyphKey);
    // A NARROW face (the reward-draft offer at 100pt, a compact staged card at
    // 92pt) cannot seat FREE | PAID side by side: the fixed FREE cell and the
    // stance cube left the keyword and value ~8pt, which react-native-web
    // ellipsized to "B..", "D." (playtest 2026-09-04 — the player could not
    // read the card they were adding to the deck for the rest of the run).
    // `adjustsFontSizeToFit` is a silent no-op on web, so the fix is layout:
    // the ledger STACKS (FREE row over PAID row, full width each) and the
    // text wraps under an explicit lineHeight instead of clipping.
    const narrow = !large && width < NARROW_FACE_W;
    const bandH = large ? 36 : 26;
    const ledgerH = large ? 60 : 42;
    const glyphSize = large ? 38 : narrow ? 18 : 24;
    // The drop shadow is STANCE-coloured (owner directive 2026-09-13). It is
    // applied inline on `faceOuter` rather than in the static style, because
    // the colour is per-card data; `accent` (the armed staged-card read tint)
    // wins where set, so the shadow always matches the frame above it.
    const rarity = card.rarity ?? 'common';
    const rarColor = rarity === 'rare' ? '#9a6ad6' : rarity === 'uncommon' ? '#6b8eb0' : '#8a8273';
    return (
        <View style={[styles.faceOuter, { width, height, shadowColor: accent ?? band }]}>
            <View style={[styles.faceCard, { borderColor: accent ?? band }]}>
                {/* ① NAME BAND — horizontal blackletter on solid ink; the wax
                    pip carries rarity. The fan's visible sliver starts here.
                    A long name wraps to a second line (the band grows, the art
                    plate gives) rather than truncating to a stub. */}
                <View style={[styles.plateBand, { minHeight: bandH }]} pointerEvents="none">
                    <View style={[styles.plateRarityPip, large && styles.plateRarityPipLarge, { backgroundColor: rarColor }]} />
                    <Text
                        style={[styles.plateName, large && styles.plateNameLarge]}
                        numberOfLines={2}
                        allowFontScaling={false}
                        testID="combat-card-face-name"
                    >
                        {card.name.toUpperCase()}
                    </Text>
                </View>
                {/* ② ART PLATE — a framed print behind a hairline rule; dark
                    margins, no wash, no scrim. Inert cards grey the plate. */}
                <View style={styles.plateArtWrap} pointerEvents="none">
                    <View style={styles.plateArtFrame}>
                        <Image
                            source={getCardArt(card.cardId)}
                            style={[StyleSheet.absoluteFill, artMirrored(card.cardId) && { transform: [{ scaleX: -1 }] }]}
                            contentFit="cover"
                            transition={0}
                        />
                        {f.inert ? <View style={styles.plateInertWash} /> : null}
                    </View>
                </View>
                {/* ③ LEDGER — solid ink ground: FREE cell | rule | PAID cell.
                    No prose (owner 2026-08-10); the overlay explains. */}
                <View
                    style={[styles.plateLedger, narrow ? styles.plateLedgerStacked : { minHeight: ledgerH }]}
                    pointerEvents="none"
                    testID={narrow ? 'combat-card-face-ledger-stacked' : 'combat-card-face-ledger'}
                >
                    {hasFree ? (
                        <View style={styles.plateFreeCell}>
                            {freeShape ? (
                                <Svg width={glyphSize} height={glyphSize} viewBox="0 0 24 24">
                                    <Path
                                        d={freeShape.d}
                                        fill={f.inert ? AXM.ash : kwColor}
                                        fillRule={freeShape.evenodd ? 'evenodd' : 'nonzero'}
                                    />
                                </Svg>
                            ) : (
                                <Text style={[styles.plateFreeGlyph, { fontSize: glyphSize * 0.85, lineHeight: glyphSize, color: f.inert ? AXM.ash : kwColor }]} allowFontScaling={false}>{f.freeGlyph}</Text>
                            )}
                            {freeInner ? (
                                <Text style={[styles.plateFreeValue, large && styles.plateFreeValueLarge]} allowFontScaling={false}>{freeInner}</Text>
                            ) : null}
                        </View>
                    ) : null}
                    {hasFree ? <View style={narrow ? styles.plateRuleAcross : styles.plateRule} /> : null}
                    <View style={styles.platePaidCell}>
                        <StanceCube color={band} size={large ? 20 : narrow ? 12 : 14} />
                        {readPip ? <Text style={[styles.paidRead, { color: kwColor }]} allowFontScaling={false}>{readPip}</Text> : null}
                        <View style={styles.paidTextWrap}>
                            {f.keyword ? (
                                <Text
                                    style={[styles.paidKeyword, large && styles.paidKeywordLarge, { color: kwColor }]}
                                    numberOfLines={large ? 1 : 2}
                                    allowFontScaling={false}
                                    testID="combat-card-face-keyword"
                                >
                                    {f.keyword.toUpperCase()}
                                </Text>
                            ) : null}
                            {paidValue ? (
                                <Text
                                    style={[styles.paidValue, large && styles.paidValueLarge]}
                                    numberOfLines={large ? 1 : 2}
                                    allowFontScaling={false}
                                    testID="combat-card-face-value"
                                >
                                    {paidValue}
                                </Text>
                            ) : null}
                        </View>
                    </View>
                </View>
                {children}
            </View>
        </View>
    );
});

// The fanned hand card — a small instance of the shared face, art-forward at the
// reference's ~1:1.5 proportion. The fan-overlap math (band fit) keys off these
// same constants — keep them in sync. Option A: 108×158 → 132×194 (the split
// rail needs the room; the old size was illegible) → 120×176 (owner declutter
// pass 2026-07-19: the board read too busy). Exported for the drag ghost.
export const HAND_CARD_W = 120;
export const HAND_CARD_H = 176;
function HandCard({ card }: { card: CombatCardVM }) {
    return <CombatCardFace card={card} width={HAND_CARD_W} height={HAND_CARD_H} />;
}

const useStyles = makeStyles((AXM) => ({
    // S1-board-C12 — the fight fits the phone. The board is the viewport: any
    // floating chrome that bleeds past its edge (the END disc's backing glow,
    // an over-wide consequence line) is clipped here instead of widening the
    // page into a sideways scroll with unpainted ground beyond the board.
    root: { flex: 1, backgroundColor: AXM.bg, overflow: 'hidden' },
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
    sigColumn: { position: 'absolute', left: 6, top: SIG_COLUMN_TOP, alignItems: 'center', gap: 8, zIndex: 30 },
    // One rung above `sigColumn`'s 30, so a die is never swallowed by a rune
    // (see the comment at the tray's call site). Still below the corner
    // medallions at 40, which are deliberately the topmost board chrome.
    trayLayer: { zIndex: 31 },
    convictionChip: {
        borderWidth: 1, borderColor: AXM.sulfur, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 7, paddingVertical: 3,
    },
    convictionText: { fontFamily: FONTS.gothic, fontSize: 15, letterSpacing: 0.5, textAlign: 'center' },
    // FE-021 — the word, small enough to stay chrome, large enough to read.
    convictionCaption: { fontFamily: FONTS.sans, fontSize: 6, letterSpacing: 0.6, color: AXM.bone, textAlign: 'center', marginTop: 1 },
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
    // gap 26→14 + wrap (2026-07-18): four 54pt gems + the spare chip overflowed
    // a 375pt viewport and clipped the first die off-screen.
    diceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center', alignItems: 'flex-start', minHeight: 74, paddingBottom: 2 },
    dieAssigned: { opacity: 0.4 },
    // Drawn X/dud die — a small greyed pip, not a full slot.
    dieXPip: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: '#3a3a3a', backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', opacity: 0.6, alignSelf: 'center' },
    dieFateHint: { fontFamily: FONTS.sans, fontSize: 7, color: '#d4c026', marginTop: 1 },
    // Spec 33 §4 — Press Fate reroll control (flag-on).
    dieXGlyph: { fontFamily: FONTS.sans, fontSize: 12, color: '#8a8273' },
    dieConv: { fontFamily: FONTS.sans, fontSize: 9, color: AXM.bone, textAlign: 'center', marginTop: 2, letterSpacing: 0.5, textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 3 },
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
    // ── Spec 33 §3 — momentum-V2 chain chip ──
    chainNode: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    chainNext: { fontFamily: FONTS.sans, fontSize: 13, marginLeft: 4 },
    // CRITIQUE pass 21 — bare "○ no momentum" text vanished against the arena
    // floor art (fully invisible on desktop). Give the empty state the same
    // contrast-guaranteeing container the filled chain nodes get: dark alpha
    // fill + ash border. `overflow: 'hidden'` keeps the radius on Android
    // (the guardChip treatment).
    chainEmpty: {
        fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 0.5,
        backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: AXM.ash,
        borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden',
    },
    chainBroke: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.4, textShadowRadius: 6, textShadowOffset: { width: 0, height: 0 } },
    // ── Spec 33 §2 — player current-stance chip ──
    stanceChip: {
        flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'center',
        borderWidth: 1, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 2,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    stanceChipGlyph: { fontFamily: FONTS.sans, fontSize: 13, textShadowRadius: 5, textShadowOffset: { width: 0, height: 0 } },
    stanceChipLabel: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 1 },
    // S1-board-C19 — the readout's own name, in the convictionCaption idiom:
    // chrome-quiet, still legible.
    stanceChipCaption: { fontFamily: FONTS.sans, fontSize: 7, letterSpacing: 0.8, color: AXM.bone },
    // S1-board-C34 — the empty state's instruction, quieter than the value it
    // follows so 'NO STANCE' stays the thing the eye lands on.
    stanceChipHint: { fontFamily: FONTS.sans, fontSize: 9, letterSpacing: 0.6, color: AXM.bone },
    // S1-board-C19 — the tap mark on the momentum chip (the tappable half of
    // the pair). Quiet chrome; the chip's own colours stay the loud part. It
    // floats on the arena floor art beside the readout's plate, not on it, so
    // it carries the same contrast-guaranteeing backing the empty readout got
    // in CRITIQUE pass 21 — bare, it read at ~1.5:1 against the bright floor
    // and vanished on desktop. Fixed width: `chipInfoGutter` mirrors it.
    chipInfoMark: {
        fontFamily: FONTS.sans, fontSize: 10, lineHeight: 14, color: AXM.bone, textAlign: 'center',
        marginLeft: CHIP_INFO_MARK_GAP, width: CHIP_INFO_MARK_W,
        backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: AXM.ash,
        borderRadius: 5, paddingVertical: 2, overflow: 'hidden',
    },
    // S1-board-C19 — the mark's mirror on the leading edge of the chip row.
    chipInfoGutter: { width: CHIP_INFO_MARK_W + CHIP_INFO_MARK_GAP },
    fanGlow: { position: 'absolute', bottom: 0, left: 0 },
    // S1-board-C11 — the side paddings are the corner-medallion footprints,
    // not decoration: the fan is centred in what is left between them. A hand
    // too large for that band (see `handFanLayout`) overflows it symmetrically
    // and the corners float over the outermost cards, as they did before.
    fan: {
        ...StyleSheet.absoluteFillObject, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center',
        paddingLeft: HAND_FAN_LEFT, paddingRight: HAND_FAN_RIGHT, paddingBottom: 20,
    },
    // The hand card whose drag ghost is in flight — dimmed in place.
    handCardLifted: { opacity: 0.3 },

    // ── bottom rail ── The row sits between the player medallion (left 10,
    //    92 wide) and the END medallion (right 10, 80 wide); the side paddings
    //    are those footprints, not spare room. The VITAE readout never wraps
    //    or shrinks; the ledger is the one flexible cell (it wraps to a second
    //    row on a narrow phone and the rail grows with it).
    rail: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6,
        paddingLeft: 104, paddingRight: 92, backgroundColor: 'rgba(7,5,9,0.9)',
        borderTopWidth: 1, borderTopColor: AXM.divider,
    },
    railHp: { fontFamily: FONTS.mono, fontSize: 13, lineHeight: 17, color: AXM.parchment, letterSpacing: 0.5, flexShrink: 0 },
    // FE-016 — the maximum rides quieter than the live value.
    railHpMax: { color: AXM.bone, fontSize: 11 },
    railLedger: { flexDirection: 'row', flexWrap: 'wrap', flexShrink: 1, gap: 3, alignItems: 'center', justifyContent: 'center' },
    railPiles: { flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 0 },
    pileGlyph: { width: 13, height: 17, borderRadius: 2, borderWidth: 1, borderColor: AXM.ash, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
    pileGlyphText: { fontFamily: FONTS.sans, fontSize: 7, color: AXM.ash, lineHeight: 9 },
    pileCount: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.bone, marginRight: 4 },

    // ── SCRAP medallion (drag-time only) ──
    trashBin: {
        position: 'absolute', left: 10, zIndex: 40, width: 60, height: 60, borderRadius: 30,
        borderWidth: 2, borderStyle: 'solid', borderColor: AXM.ash, backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center', justifyContent: 'center',
    },
    trashLabel: { fontFamily: FONTS.sans, fontSize: 9, letterSpacing: 1, color: AXM.bone, marginTop: 1 },

    // ── player status strip (in-flow, above the dice; RIGHT-aligned so the
    //    left signature-rune column never covers it) ──
    // S1-board-C12 — wraps: a long ledger row (GUARD · WRATH · CHAIN · chips)
    // otherwise ran past the viewport, and the board now clips at its edge.
    statusStrip: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 8, paddingHorizontal: 12, paddingBottom: 6 },
    guardChip: {
        fontFamily: FONTS.sans, fontSize: 11, color: '#6fb3e0', letterSpacing: 0.5,
        backgroundColor: 'rgba(0,0,0,0.7)', borderWidth: 1, borderColor: '#6fb3e055', borderRadius: 4,
        paddingHorizontal: 5, paddingVertical: 2, overflow: 'hidden',
    },
    // THE BIG NUMBERS REWRITE — WRATH / CHAIN / TWIN, cut to GUARD's chip so
    // the whole rail reads as one ledger row. Colour comes from the call site.
    ledgerChip: {
        fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 0.5,
        backgroundColor: AXM.backdrop, borderWidth: 1, borderRadius: 4,
        paddingHorizontal: 5, paddingVertical: 2, overflow: 'hidden',
    },

    // ── Charge track (phase 28) ──
    perorationTrack: { paddingHorizontal: 12, paddingBottom: 6, gap: 3 },
    perorationLabel: { fontFamily: FONTS.sans, fontSize: 10, color: '#d9b44a', letterSpacing: 0.4 },
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
    // S1-board-C12 — anchored to the medallion's RIGHT edge, so the 140pt line
    // runs inward across the board. Anchored left (-30) it ran 20pt past the
    // screen's right edge, which is horizontal overflow the viewport can scroll
    // to; clipping it at `root` would have eaten the words instead.
    endConsequenceWrap: { position: 'absolute', top: -34, right: 0, width: 140, alignItems: 'center' },
    endConsequence: {
        fontFamily: FONTS.sans, fontSize: 8.5,
        letterSpacing: 0.4, color: AXM.sulfur, textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.95)', textShadowRadius: 3,
    },

    // ── Shared card FACE — THE PRINTED PLATE (owner reset 2026-08-28) ────────
    // A page of the codex: name band on ink, framed art plate behind a
    // hairline rule, solid-ground ledger. Stance colours the frame; category
    // colours glyph + keyword. AXM tokens throughout — no scrim, no washes.
    // Owner directive 2026-09-13: the 2pt `pixelShadow` ring (a dark RED in the
    // default palette, #7a0d1c) read as a second border wrapped around every
    // card, fighting the stance-coloured frame that is the card's real colour
    // signal. The ring is gone — a card now carries exactly ONE border, the
    // stance colour on `faceCard`. The drop shadow stays as a depth cue and now
    // carries the card's own stance colour, supplied inline by `CombatCardFace`
    // (`shadowColor` is per-card data, so it cannot live in this static style).
    faceOuter: {
        borderRadius: 6, backgroundColor: AXM.deepBg,
        shadowOpacity: 0.5, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 6,
    },
    faceCard: { flex: 1, borderWidth: 1.5, borderRadius: 4, backgroundColor: AXM.deepBg, overflow: 'hidden' },
    // ① The name band — horizontal blackletter; the wax pip is the rarity.
    plateBand: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, gap: 5,
        backgroundColor: AXM.deepBg,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: AXM.divider,
    },
    plateRarityPip: { width: 5, height: 5, borderRadius: 3 },
    plateRarityPipLarge: { width: 7, height: 7, borderRadius: 4 },
    // Explicit lineHeights: the name / keyword / value may WRAP (never clip)
    // on a small face, so their two-line height is a known quantity.
    plateName: { flex: 1, fontFamily: FONTS.gothic, fontSize: 13, lineHeight: 15, letterSpacing: 0.4, color: AXM.parchment, paddingVertical: 2 },
    plateNameLarge: { fontSize: 20, lineHeight: 24, letterSpacing: 0.8 },
    // ② The framed art plate — dark margins, hairline rule.
    plateArtWrap: { flex: 1, padding: 4, backgroundColor: AXM.panelBg },
    plateArtFrame: {
        flex: 1, borderWidth: StyleSheet.hairlineWidth, borderColor: AXM.ash,
        overflow: 'hidden', backgroundColor: AXM.deepBg,
    },
    plateInertWash: { ...StyleSheet.absoluteFillObject, backgroundColor: AXM.backdrop },
    // ③ The ledger — FREE cell | hairline rule | PAID cell, solid ground.
    plateLedger: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, gap: 6,
        backgroundColor: AXM.deepBg,
        borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: AXM.divider,
    },
    // Narrow face: FREE row over PAID row, each the full ledger width.
    plateLedgerStacked: { flexDirection: 'column', alignItems: 'stretch', paddingVertical: 4, gap: 3 },
    plateFreeCell: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    plateFreeGlyph: { textAlign: 'center' },
    plateFreeValue: { fontFamily: FONTS.mono, fontSize: 12, fontWeight: '700', color: AXM.parchment },
    plateFreeValueLarge: { fontSize: 17 },
    plateRule: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', marginVertical: 6, backgroundColor: AXM.divider },
    plateRuleAcross: { height: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: AXM.divider },
    platePaidCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
    paidRead: { fontFamily: FONTS.sans, fontSize: 11, marginTop: 1 },
    paidTextWrap: { flex: 1 },
    // The keyword is the loudest word on the face — it is the whole read now.
    paidKeyword: { fontFamily: FONTS.sans, fontSize: 12, lineHeight: 14, letterSpacing: 0.8 },
    paidKeywordLarge: { fontSize: 17, lineHeight: 20, letterSpacing: 1.2 },
    paidValue: { fontFamily: FONTS.mono, fontSize: 11, lineHeight: 15, color: AXM.parchment },
    paidValueLarge: { fontSize: 15, lineHeight: 20 },
}));
