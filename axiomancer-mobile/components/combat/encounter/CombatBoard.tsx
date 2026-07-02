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
 * A landed status refreshes the drafted die (the combo loop) so the next staged
 * card can be APPLYd straight away without dragging a new die.
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
    CombatSignatureVM, CombatEffectChipVM, CombatCardFaceVM,
} from '@/state/presenters/combat-encounter.engine';
import { armedReadValue, STANCE_COLORS } from '@/state/presenters/combat-encounter.engine';
import { wheelNext, type WheelStance } from '@/state/combat/momentum';
import type { CombatReadResult } from 'axiomancer-mechanics';
import { TrashGlyph, LedgerMark } from '@/components/hazard/glyphs';
import { CombatCombatantPane, EffectChips, PlayerMedallion, COMBAT_HUD_HEIGHT, type CombatFx } from './CombatCombatantPane';
import { CombatDie } from './CombatDie';

// The single bundled card art (one photo across every card for now — see TODO at
// CombatCardFace). Per-card differentiation is preserved via the stance tint +
// the keyword/category glyph until per-card art exists.
const CARD_ART = require('@/assets/images/cards/circe-placeholder.jpg');

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
}

interface Rect { x: number; y: number; width: number; height: number; }
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
    vm, dieGesture, draggingDieId, assignedDieIds,
}: {
    vm: CombatViewModel;
    dieGesture: (die: CombatDieVM) => ReturnType<typeof Gesture.Exclusive>;
    draggingDieId: string | null;
    assignedDieIds: Set<string>;
}) {
    const AXM = usePalette();
    const styles = useStyles();
    return (
        <View style={styles.diceRow} testID="combat-dice-tray" pointerEvents="box-none">
            {vm.dice.map((die) => {
                const draggable = !vm.hasDraft && !die.isX && !die.drafted && !die.spent;
                const isAssigned = assignedDieIds.has(die.id);
                // The drawn X/dud die is non-draggable — render it as a small greyed
                // pip so it doesn't pad the row with an unusable full-size slot.
                if (die.isX) {
                    return (
                        <View key={die.id} style={styles.dieXPip} accessible accessibilityLabel="X die — unusable this turn">
                            <Text style={styles.dieXGlyph}>✕</Text>
                        </View>
                    );
                }
                const node = (
                    <View style={isAssigned ? styles.dieAssigned : undefined}>
                        <CombatDie die={die} size={54} dimmed={(vm.hasDraft && !die.drafted) || draggingDieId === die.id} />
                        {draggable && die.readPip && die.readPip !== 'none' ? (
                            <Text style={[styles.diePip, { color: READ_ACCENT[die.readPip] }]}>
                                {die.readPip === 'advantage' ? '▲ ADV' : die.readPip === 'disadvantage' ? '▼ DIS' : '— EVEN'}
                            </Text>
                        ) : null}
                        {vm.hasDraft && !die.drafted && <Text style={styles.dieConv}>→ +1 ◆</Text>}
                        {die.drafted && <Text style={[styles.dieConv, { color: AXM.sulfur }]}>{die.spent ? 'SPENT' : 'STANCE'}</Text>}
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
        </View>
    );
}

// ── Staged card (die socket · fused APPLY ribbon) ────────────────────────────

const StagedCard = React.memo(function StagedCard({
    card, assignedDie, read, onApply, gesture, register, compact = false, popKey = 0, socketPulse = false,
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
    /** Rising nonce: when it changes (>0) this card just received a dropped die →
     *  a brief 1.05 scale-pop confirms the drop landed HERE (and only here). */
    popKey?: number;
    /** True while a die drag is live — highlights the empty die socket. (A static
     *  highlight, deliberately not an animation: N staged cards each running an
     *  infinite pulse measurably chugged die drags.) */
    socketPulse?: boolean;
}) {
    const AXM = usePalette();
    const styles = useStyles();
    const f = card.face;
    // Drop-confirmation pop (120ms up / 120ms back) on the card the die landed on.
    const pop = useSharedValue(1);
    useEffect(() => {
        if (popKey > 0) pop.value = withSequence(withTiming(1.05, { duration: 120 }), withTiming(1, { duration: 120 }));
    }, [popKey, pop]);
    const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
    const armed = assignedDie !== null;
    const readColor = armed ? (READ_ACCENT[read] ?? AXM.bone) : AXM.bone;
    const cardW = compact ? 92 : 118;
    const cardH = compact ? 128 : 164;
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
    return (
        <View style={styles.stagedCol}>
            <GestureDetector gesture={gesture}>
                <Animated.View
                    ref={(node) => register(card.uid, node as unknown as View | null)}
                    entering={FadeInDown.duration(180)}
                    testID={`combat-staged-${card.uid}`}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel={`${card.name} staged — ${f.verbLine}. Tap to unstage.`}
                >
                  {/* inner wrapper carries the drop-pop scale so it never fights the
                      outer entering animation's transform. */}
                  <Animated.View style={popStyle}>
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
            <Pressable
                onPress={() => { Haptics.impactAsync(armed ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined); onApply(card.uid); }}
                testID={`combat-apply-${card.uid}`}
                accessibilityRole="button"
                accessibilityLabel={armed ? `Apply powered: ${card.bottomActionText}` : `Apply free: ${card.topActionText}`}
                hitSlop={8}
                style={[
                    styles.applyRibbon,
                    { borderColor: armed ? readColor : AXM.bone, backgroundColor: armed ? 'rgba(91,191,106,0.16)' : 'rgba(0,0,0,0.55)', width: cardW },
                    compact && { paddingVertical: 3 },
                ]}
            >
                <Text style={[styles.applyText, { color: armed ? readColor : AXM.parchment }, compact && { fontSize: 10 }]} numberOfLines={1} adjustsFontSizeToFit>
                    {armed ? `APPLY ${readPip ?? '◆'}` : 'APPLY · FREE'}
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

// ── END PHASE medallion ──────────────────────────────────────────────────────

function EndPhaseMedallion({ onPress }: { onPress: () => void }) {
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
                onPress={onPress}
                testID="combat-end-phase"
                accessibilityRole="button"
                accessibilityLabel="End phase — the enemy acts, then the next phase begins"
                style={[styles.endBtn, { borderColor: AXM.sulfur }]}
            >
                <View style={[styles.endBtnInnerRim]} pointerEvents="none" />
                <Text style={[styles.endGlyph, { color: AXM.sulfur }]} allowFontScaling={false}>⧗</Text>
                <Text style={[styles.endLabel, { color: AXM.sulfur }]} allowFontScaling={false}>END</Text>
            </Pressable>
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
     *  no die (hazard model — the die is optional). */
    onApply: (uid: string, dieId: string | null, power: boolean) => void;
    onStage: (uid: string) => void;
    onUnstage: (uid: string) => void;
    onDiscard: (uid: string) => void;
    onSignature: (id: string) => void;
    onEndPhase: () => void;
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
}

export const CombatBoard = React.memo(function CombatBoard({
    vm, drag, stagedUids, onApply, onStage, onUnstage, onDiscard, onSignature, onEndPhase, onInspect, onChip, onSignatureInfo, onPlayerInspect, momentum, onMomentumInfo, fx,
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
    // Rising drop-confirmation nonce for the card a die just landed on (scale-pop).
    const [dropPop, setDropPop] = useState<{ uid: string; n: number }>({ uid: '', n: 0 });
    const stagedKey = stagedUids.join(',');
    // Clear pending selections when the turn's dice change…
    useEffect(() => { setPendingDieByUid({}); }, [vm.turnLabel]);
    // …and drop entries for cards that are no longer staged.
    useEffect(() => {
        setPendingDieByUid((prev) => {
            const next: Record<string, string> = {};
            for (const uid of stagedUids) if (prev[uid]) next[uid] = prev[uid];
            return next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stagedKey]);

    const draftedDie = vm.dice.find((d) => d.drafted && !d.spent) ?? null;
    // The ONE staged card the shared drafted (combo) die visibly arms: the next card
    // that will consume it — the first staged card without its own dropped die, else
    // the first staged card. The die's COMMIT stays shared (handleApply powers
    // whichever card APPLYs); only its DISPLAY is bound here so the combo die doesn't
    // light up every staged card at once.
    const comboTargetUid = draftedDie
        ? (stagedUids.find((u) => !pendingDieByUid[u]) ?? stagedUids[0] ?? null)
        : null;
    // DISPLAY (decoupled from commit): resolve the per-card dropped die FIRST (only
    // when still usable), then show the drafted/combo die on the single comboTargetUid,
    // else null → the card reads as FREE (no die).
    const assignedDieFor = (uid: string): CombatDieVM | null => {
        const pid = pendingDieByUid[uid];
        if (pid) {
            const d = vm.dice.find((x) => x.id === pid);
            if (d && !d.spent && !d.isX && !d.drafted) return d;
        }
        if (draftedDie && uid === comboTargetUid) return draftedDie;
        return null;
    };
    const readFor = (die: CombatDieVM | null): string =>
        (die ? (die.drafted ? vm.read.result : die.readPip) : 'none') ?? 'none';
    // Dim every die that's already drafted or pending-assigned to some card.
    const assignedDieIds = new Set<string>(
        [draftedDie?.id, ...Object.values(pendingDieByUid)].filter(Boolean) as string[],
    );

    const resolveDrop = useCallback(async (payload: DragPayload, x: number, y: number) => {
        if (x < 0 && y < 0) return;
        if (payload.type === 'die') {
            // Per-card targeting: drop a die onto a SPECIFIC staged card to power it.
            let target: string | null = null;
            for (const uid of stagedUids) {
                const node = stagedRefs.current.get(uid);
                if (!node) continue;
                const rect = await measureRect({ current: node });
                if (rectContains(rect, x, y, 16)) { target = uid; break; }
            }
            // Forgiveness: a die dropped loosely in the play area lands on the one
            // eligible card (the single staged card, else the first still without a die).
            if (!target) {
                const playRect = await measureRect(playAreaRef);
                if (rectContains(playRect, x, y, 24) && stagedUids.length > 0) {
                    target = stagedUids.length === 1
                        ? stagedUids[0]
                        : (stagedUids.find((u) => !pendingDieByUid[u]) ?? stagedUids[0]);
                }
            }
            if (target) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => undefined);
                const t = target;
                setPendingDieByUid((prev) => ({ ...prev, [t]: payload.dieId }));
                setDropPop((prev) => ({ uid: t, n: prev.n + 1 }));   // confirm the drop landed HERE
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
    const draggingCardUid = drag.active?.type === 'card' ? drag.active.uid : null;
    const cardDragLive = draggingCardUid !== null;
    const dieDragLive = draggingDieId !== null;

    // Commit ONE staged card. The drafted die stays SHARED: if a drafted die exists,
    // APPLY this card powered regardless of comboTargetUid (binding consumption to one
    // uid would be a combo regression); else if this card has a usable dropped die,
    // draft+power it; else FREE (no die).
    // Latest-closure ref + a stable dispatcher so memoized StagedCards never
    // re-render just because the board did.
    const handleApplyRef = useRef<(uid: string) => void>(() => undefined);
    handleApplyRef.current = (uid: string) => {
        if (draftedDie) {
            onApply(uid, null, true);
        } else {
            const pid = pendingDieByUid[uid];
            const pending = pid ? vm.dice.find((x) => x.id === pid) ?? null : null;
            if (pending && !pending.spent && !pending.isX && !pending.drafted) onApply(uid, pending.id, true);
            else onApply(uid, null, false);
        }
        setPendingDieByUid((prev) => { const next = { ...prev }; delete next[uid]; return next; });
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
        for (const uid of stagedUids) handleApply(uid);
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
                                        socketPulse={dieDragLive}
                                    />
                                );
                            })}
                        </View>
                        {stagedCards.length > 0 && !stagedCards.some((c) => assignedDieFor(c.uid)) && !cardDragLive ? (
                            <Text style={styles.stageHint} numberOfLines={1}>drag a die onto your card · APPLY to commit</Text>
                        ) : null}
                    </View>
                </View>

                {/* momentum wheel — stance-sequencing combo tracker (heart→body→mind) */}
                {momentum ? (
                    <MomentumWheel lit={momentum.lit} charged={momentum.charged} onPress={onMomentumInfo} />
                ) : null}

                {/* player status strip — IN FLOW (not floated over the fan, where the
                    hand's gesture area swallowed the taps) so every tile stays tappable */}
                {(vm.player.effects.length > 0 || vm.player.guard > 0) && (
                    <View style={styles.statusStrip} pointerEvents="box-none">
                        <EffectChips effects={vm.player.effects} onChip={onChip} />
                        {vm.player.guard > 0 ? <Text style={styles.guardChip} testID="combat-guard">🛡 {vm.player.guard}</Text> : null}
                    </View>
                )}

                <DiceRow vm={vm} dieGesture={dieGesture} draggingDieId={draggingDieId} assignedDieIds={assignedDieIds} />

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
                <EndPhaseMedallion onPress={handleEndPhase} />
            </View>
        </View>
    );
});

// ── A small fanned hand card ─────────────────────────────────────────────────

// Fallback word for a face that has no honest number (heroText === '').
function heroFace(f: CombatCardFaceVM): string {
    if (f.heroText) return f.heroText;
    switch (f.kind) {
        case 'strike': return 'HIT';
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

// Deterministic per-card art variation (one bundled photo backs every card until
// per-card art ships): mirror the image for ~half the cards, keyed off the card id.
function artMirrored(cardId: string): boolean {
    let h = 0;
    for (let i = 0; i < cardId.length; i++) h = (h * 31 + cardId.charCodeAt(i)) | 0;
    return (h & 1) === 1;
}

/**
 * The shared card FACE — art-forward reference shape — instanced small in the
 * hand and LARGE in the inspect modal so the two can never drift.
 *   · real ART (Circe placeholder) fills the top ~64% behind a stance-tint
 *     gradient wash;
 *   · a glossy stance ORB (category glyph, stance colour) top-left;
 *   · the card NAME on a stance-coloured bevelled band;
 *   · small face: ONE keyword line ("◆ KEYWORD value") — the FREE/POWER fork
 *     lives on the APPLY ribbon + the detail modal;
 *   · large face: the effect SENTENCE with bolded keywords + the type tab.
 *
 * TODO(art): one bundled photo (circe-placeholder.jpg) backs every card today —
 * per-card differentiation is carried by the stance tint + mirror + the glyph
 * until per-card art ships; swap CARD_ART for a per-card source then.
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
    const numberless = !f.heroText && !heroOverride;
    const value = numberless ? (f.keyword ?? heroFace(f)) : paidValueText(f, heroOverride);
    const orbR = large ? 22 : 13;
    return (
        <View style={[styles.faceOuter, { width, height }]}>
            <View style={[styles.faceCard, { borderColor }]}>
                {/* ART window — top ~64% behind a bottom-up stance gradient */}
                <View style={[styles.faceArt, large && { height: '52%' }]} pointerEvents="none">
                    <Image
                        source={CARD_ART}
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
                    {large ? (
                        /* large inspect card: the effect SENTENCE (keywords bolded, hero number
                           inside it) replaces the small card's terse keyword line — stated
                           ONCE, on the card itself (Sanguine-Step shape). */
                        <View style={styles.faceBody}>
                            <OutcomeText
                                text={card.detail.outcomeLine}
                                names={card.detail.keywords.map((k) => k.name)}
                                base={styles.faceEffect}
                                bold={styles.faceEffectBold}
                            />
                        </View>
                    ) : (
                        /* small face: ONE keyword line — "◆ KEYWORD value" */
                        <View style={styles.kwLine}>
                            <Text style={[styles.kwText, { color: kwColor }]} numberOfLines={1} adjustsFontSizeToFit>
                                ◆ {f.keyword ?? 'DIE'}{readPip ? ` ${readPip}` : ''}
                            </Text>
                            {!numberless ? (
                                <Text style={[styles.kwValue, { color: kwColor }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
                            ) : null}
                            {f.heroSub ? <Text style={styles.kwSub} numberOfLines={1} adjustsFontSizeToFit>{f.heroSub}</Text> : null}
                        </View>
                    )}
                    {/* large-only TYPE-TAB pinned to the card's bottom edge (replaces the floating
                        detailTypeBanner in the modal). */}
                    {large ? (
                        <View style={styles.typeTab}>
                            <Text style={styles.typeTabText} numberOfLines={1}>{card.detail.metaChip}</Text>
                        </View>
                    ) : null}
                </View>
            </View>
        </View>
    );
});

// The fanned hand card — a small instance of the shared face, art-forward at the
// reference's ~1:1.5 proportion. The fan-overlap math (band fit) keys off these
// same constants — keep them in sync.
const HAND_CARD_W = 108;
const HAND_CARD_H = 158;
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
    dieXGlyph: { fontFamily: FONTS.sans, fontSize: 12, color: '#8a8273' },
    dieConv: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone, textAlign: 'center', marginTop: 2, letterSpacing: 0.5, textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 3 },
    diePip: { fontFamily: FONTS.sans, fontSize: 10, textAlign: 'center', marginTop: 2, letterSpacing: 0.6, textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 3 },

    // ── the hand dock ──
    dock: { height: 178, overflow: 'hidden' },

    // ── momentum wheel ──
    wheelRow: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 3, paddingHorizontal: 10, marginBottom: 2 },
    wheelNode: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    wheelNodeNext: { borderStyle: 'dashed' },
    wheelGlyph: { fontSize: 12, lineHeight: 15, textShadowRadius: 6, textShadowOffset: { width: 0, height: 0 } },
    wheelChevron: { fontFamily: FONTS.sans, fontSize: 13, color: '#5a5346', marginHorizontal: -1 },
    wheelCharged: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.6, marginLeft: 7, textShadowRadius: 7, textShadowOffset: { width: 0, height: 0 } },
    fanGlow: { position: 'absolute', bottom: 0, left: 0 },
    fan: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 12 },

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

    // ── corner medallions ──
    cornerStack: { position: 'absolute', right: 10, alignItems: 'center', gap: 8, zIndex: 40 },
    endWrap: { width: 80, height: 80 },
    endBtn: {
        width: 80, height: 80, borderRadius: 40, borderWidth: 3, backgroundColor: '#0c0a06',
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    endBtnInnerRim: {
        ...StyleSheet.absoluteFillObject, margin: 4, borderRadius: 36, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(212,192,38,0.10)',
    },
    endGlyph: { fontFamily: FONTS.gothic, fontSize: 30, lineHeight: 33 },
    endLabel: { fontFamily: FONTS.sans, fontSize: 9, letterSpacing: 2, marginTop: -1 },

    // ── Shared card FACE (hand · staged · inspect modal) ──────────────────────
    // Outer/inner double frame: 2pt near-black outside a category-coloured border.
    faceOuter: {
        borderRadius: 8, borderWidth: 2, borderColor: 'rgba(0,0,0,0.9)', backgroundColor: '#14110e',
        shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 6,
    },
    faceCard: { flex: 1, borderWidth: 1.5, borderRadius: 6, backgroundColor: '#14110e', overflow: 'hidden' },
    // Art fills the top ~64% (art-forward reference proportion) — the name band
    // anchors directly beneath it, the keyword line fills the remainder.
    faceArt: { width: '100%', height: '64%', backgroundColor: '#0c0a08' },
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
    // Small-face keyword line — the ONE statement under the name band.
    kwLine: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, backgroundColor: 'rgba(10,8,6,0.62)' },
    kwText: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1 },
    kwValue: { fontFamily: FONTS.mono, fontSize: 15, lineHeight: 17, marginTop: 0 },
    kwSub: { fontFamily: FONTS.mono, fontSize: 8, lineHeight: 10, color: AXM.bone },
    // large-only effect body (Sanguine-Step shape) — fills the space under the name band.
    // Warm parchment-tone panel behind the effect text anchors it like a scroll.
    faceBody: { flex: 1, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(38,30,20,0.6)' },
    faceEffect: { fontFamily: FONTS.serif, fontSize: 14, lineHeight: 20, color: AXM.parchment, textAlign: 'center' },
    faceEffectBold: { fontFamily: FONTS.gothic, color: AXM.sulfur },
    // large-only TYPE-TAB pinned to the card's bottom edge.
    typeTab: {
        alignSelf: 'center', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
        backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 3, paddingHorizontal: 12, paddingVertical: 3,
    },
    typeTabText: { fontFamily: FONTS.sans, fontSize: 9, letterSpacing: 1.6, color: AXM.bone },
}));
