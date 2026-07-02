/**
 * CombatEncounterPanel — the Spec 26 / 26b card-and-dice combat surface,
 * extracted from `app/combat-encounter/index.tsx` (Phase 200) so the same
 * surface can be hosted by BOTH the dev route AND in-place inside the live
 * `EncounterModalOverlay` when the player triggers a map encounter.
 *
 * The engine `CombatEncounterState` is pure, so the panel holds it in local
 * React state and dispatches engine transitions; the presenter
 * (`buildCombatViewModel`) owns the mapping; the board owns the UI. The
 * drag ghost renders at panel root (top/left 0) and the board's drag uses
 * window coords, so the panel MUST be mounted full-bleed from the window
 * origin (the dev route wraps it in `<ScreenBg>`; the modal renders it as a
 * full-screen layer).
 *
 * Live play (`persistOutcome`) hand-rolls the economy write-back the new
 * engine intentionally omits (it has no economy layer — verified against
 * mechanics 0.28.0): final HP → player.health, `enemy.xpReward` →
 * experience (+ cascade level-ups), `rollLoot(enemy.loot)` → inventory.
 * Mirrors what the legacy `END_COMBAT` reducer did for the old combat. The
 * deckbuilder reward card is written regardless — it's the new system's own
 * reward (Spec 26b §C). Defeat HP / run reset is the host's concern.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, Polygon, RadialGradient, Stop } from 'react-native-svg';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard, resolveThreatPhase,
    startTurn, draftStanceDie, discardCombatCard, playSignatureSkill,
    selectEncounterMercyChoice, buildCombatSummary, rollCombatCardRewards, addRewardCard,
    rollLoot, addItem,
    type CombatEncounterState, type CombatOutcome, type Character, type Enemy, type CombatEvent,
    type CombatManaDie,
} from 'axiomancer-mechanics';

import { advanceWheel, isMomentumDieId, isWheelStance, momentumDieId, type WheelStance } from '@/state/combat/momentum';

import { CombatBoard, CombatCardFace, type DragController, type DragPayload } from '@/components/combat/encounter/CombatBoard';
import { type CombatFx } from '@/components/combat/encounter/CombatCombatantPane';
import { CombatDie } from '@/components/combat/encounter/CombatDie';
import { CombatSummaryModal } from '@/components/combat/encounter/CombatSummaryModal';
import { CombatRewardsOverlay } from '@/components/combat/encounter/CombatRewardsOverlay';
import { CombatTutorialPrimer } from '@/components/combat/encounter/CombatTutorialPrimer';
import { CombatTutorialCoach } from '@/components/combat/encounter/CombatTutorialCoach';
import { currentCombatTutorialStep } from '@/components/combat/encounter/combat-tutorial-steps';
import { EnemyPortrait } from '@/components/event/enemy-art/EnemyPortrait';
import { INTENT_ICONS, buildCombatViewModel, rewardOfferVMs, STANCE_COLORS, type CombatCardVM, type CombatEffectChipVM, type CombatSignatureVM } from '@/state/presenters/combat-encounter.engine';
import { PlayerPortrait } from '@/components/art/PlayerPortrait';
import { useGameState, useGameStore } from '@/state/GameStoreProvider';
import { COMBAT_TUTORIAL_FLAG, completeCombatTutorialAction, runArchetype, skewRewardsByArchetype } from '@/state/combat/store-actions';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

type DropResolver = (payload: DragPayload, x: number, y: number) => void | Promise<void>;

export interface CombatEncounterPanelProps {
    /** The foe to fight (live: the real map encounter enemy; dev: a mock). */
    enemy: Enemy;
    /** Player snapshot used to initialise the encounter (deck derives from knownSkills). */
    bootstrapPlayer: Character;
    /** Optional explicit deck (engine derives one from knownSkills when omitted). */
    deck?: string[];
    /** Deterministic seed. */
    seed?: number;
    /** Force the first-fight tutorial primer/coach even if the flag is set. */
    forceTutorial?: boolean;
    /**
     * Live play: hand-roll HP/XP/loot/level-up back onto the persistent
     * player on combat end. Dev sandbox passes false so test runs don't
     * mutate the player's real progression.
     */
    persistOutcome?: boolean;
    /** Fired once when the player dismisses the terminal summary. */
    onExit: (outcome: CombatOutcome | null) => void;
}

type StoreLike = ReturnType<typeof useGameStore>;

/**
 * Economy write-back for a finished hazard encounter — the bridge the new
 * engine omits. Victory/mercy grant XP (+ cascade level-ups); victory also
 * rolls item loot. Final HP persists for every outcome except defeat (the
 * host's run-reset full-heals there). The deckbuilder card is handled
 * separately (it's claimed mid-flow via `addRewardCard`).
 */
function applyHazardOutcome(
    store: StoreLike,
    outcome: CombatOutcome,
    finalState: CombatEncounterState,
    enemy: Enemy,
): void {
    const finalHp = finalState.player.health;
    store.setState((s) => {
        if (!s.player) return {};
        let player: Character = { ...s.player };
        if (outcome !== 'defeat') {
            player = { ...player, health: Math.max(0, Math.min(finalHp, player.maxHealth)) };
        }
        if (outcome === 'victory' || outcome === 'mercy') {
            player = { ...player, experience: player.experience + (enemy.xpReward ?? 0) };
        }
        if (outcome === 'victory') {
            const drop = rollLoot(enemy.loot, Math.random);
            if (drop) {
                player = { ...player, inventory: addItem(player.inventory, drop) };
            }
        }
        return { player };
    });
    // Cascade level-ups through the engine store (applyLevelUps isn't exported,
    // so the LEVEL_UP reducer is the only public path). applyLevelUps already
    // loops internally; the guarded while-loop is belt-and-braces.
    if (outcome === 'victory' || outcome === 'mercy') {
        const levelUp = (store.getState() as { levelUp?: () => void }).levelUp;
        let guard = 0;
        while (
            typeof levelUp === 'function'
            && store.getState().player
            && (store.getState().player as Character).experience >= (store.getState().player as Character).experienceToNextLevel
            && guard < 20
        ) {
            guard += 1;
            levelUp();
        }
    }
}

// Per-keyword type tag for the inspect-modal definition panels. The PRIMARY keyword
// (index 0) maps to the card's face kind; riders read as a generic EFFECT.
function keywordTypeTag(kind: string, index: number): string {
    if (index > 0) return 'EFFECT';
    switch (kind) {
        case 'dot': return 'DOT';
        case 'stun':
        case 'weaken': return 'CONTROL';
        case 'guard': return 'GUARD';
        case 'regen': return 'REGEN';
        case 'strike': return 'STRIKE';
        case 'befriend': return 'MERCY';
        default: return 'EFFECT';
    }
}

// Reference-style coloured type tags (right-aligned on the keyword panels).
const TAG_COLORS: Record<string, string> = {
    DOT: '#e2543b', CONTROL: '#a86bdc', GUARD: '#9aa0a6', REGEN: '#5bbf6a',
    STRIKE: '#c2a14e', MERCY: '#5bbf6a', EFFECT: '#8a8273',
};

// Category plaque for the status tooltip — glyph kind → badge label + colour.
function effectCategory(kind: string, color: string): { label: string; color: string } {
    switch (kind) {
        case 'dot': return { label: 'AFFLICTION', color: '#e2543b' };
        case 'control': return { label: 'CONTROL', color: '#a86bdc' };
        case 'statdown':
        case 'drain':
        case 'mark': return { label: 'HEX', color: '#e08a3b' };
        case 'statup':
        case 'regen':
        case 'advantage':
        case 'thorns': return { label: 'BLESSING', color: '#5bbf6a' };
        default: return { label: 'EFFECT', color };
    }
}

/** Dimmed-backdrop plaque hero: a radial burst + rayed ring around a large
 *  glowing glyph (the reference status-detail centrepiece). */
function GlyphBurst({ color, glyph }: { color: string; glyph: string }) {
    const styles = useStyles();
    return (
        <View style={styles.burstWrap} pointerEvents="none">
            <Svg width={170} height={170} viewBox="0 0 170 170">
                <Defs>
                    <RadialGradient id="axmTipBurst" cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor={color} stopOpacity={0.55} />
                        <Stop offset="55%" stopColor={color} stopOpacity={0.16} />
                        <Stop offset="100%" stopColor={color} stopOpacity={0} />
                    </RadialGradient>
                </Defs>
                <Circle cx={85} cy={85} r={85} fill="url(#axmTipBurst)" />
                {Array.from({ length: 12 }).map((_, i) => {
                    const a = (i / 12) * Math.PI * 2;
                    return (
                        <Line
                            key={i}
                            x1={85 + Math.cos(a) * 52} y1={85 + Math.sin(a) * 52}
                            x2={85 + Math.cos(a) * (i % 2 === 0 ? 76 : 66)} y2={85 + Math.sin(a) * (i % 2 === 0 ? 76 : 66)}
                            stroke={color}
                            strokeWidth={1.4}
                            opacity={0.3}
                        />
                    );
                })}
                <Circle cx={85} cy={85} r={46} fill="#070509" stroke={color} strokeWidth={3} />
                <Circle cx={85} cy={85} r={41} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
            </Svg>
            <View style={StyleSheet.absoluteFill}>
                <View style={styles.burstGlyphBox}>
                    <Text style={[styles.burstGlyph, { color, textShadowColor: color }]} allowFontScaling={false}>{glyph}</Text>
                </View>
            </View>
        </View>
    );
}

export function CombatEncounterPanel({
    enemy,
    bootstrapPlayer,
    deck,
    seed,
    forceTutorial = false,
    persistOutcome = false,
    onExit,
}: CombatEncounterPanelProps) {
    const styles = useStyles();
    const AXM = usePalette();
    const { width: screenW } = useWindowDimensions();
    // Hero card width in the inspect modal (reference: the card IS the screen) —
    // sized so keyword panels + the full card fit a ~844pt viewport together.
    const detailCardW = Math.min(264, screenW - 116);
    const player = useGameState((s) => s.player);
    const store = useGameStore();

    // ── first-fight tutorial (primer panels → turn-one coach) ──
    const seenTutorial = useGameState(
        (s) => ((s as unknown as { flags?: string[] }).flags ?? []).includes(COMBAT_TUTORIAL_FLAG),
    );
    const [primerDone, setPrimerDone] = useState(false);
    const [tutorialDismissed, setTutorialDismissed] = useState(false);
    const tutorialActive = (forceTutorial || !seenTutorial) && !tutorialDismissed;
    const finishTutorial = useCallback((skipped: boolean) => {
        setTutorialDismissed(true);
        completeCombatTutorialAction(store, skipped);
    }, [store]);

    const [state, setState] = useState<CombatEncounterState | null>(null);
    // Multi-card staging (hazard model): several cards can be staged at once; each
    // is APPLYd individually (powered by the die dragged onto it, or FREE).
    const [stagedUids, setStagedUids] = useState<string[]>([]);
    const [detailCard, setDetailCard] = useState<CombatCardVM | null>(null);
    // Guard: the tap that OPENS the inspect modal can reach the backdrop and close it
    // instantly ("blink"). Ignore backdrop dismiss for a moment after open (the ✕ always works).
    const detailOpenedAt = useRef(0);
    const [tipEffect, setTipEffect] = useState<CombatEffectChipVM | null>(null);
    // Signature-rune info popup (long-press / unaffordable tap) + pilgrim modal.
    const [sigInfo, setSigInfo] = useState<CombatSignatureVM | null>(null);
    const [pilgrimOpen, setPilgrimOpen] = useState(false);
    // Deckbuilder reward (Spec 26b §C) — rolled once on victory, claimed before the summary.
    const [rewardOffers, setRewardOffers] = useState<string[]>([]);
    const [rewardsClaimed, setRewardsClaimed] = useState(false);
    const wroteBackRef = useRef(false);
    const exitedRef = useRef(false);
    // Resolution-feedback bridge: the latest resolved engine events + a rising seq.
    // The events are stashed in a ref (set inside the state updater) and surfaced
    // to the board via a bumped seq, so the pane animates exactly once per resolve.
    const fxRef = useRef<CombatEvent[]>([]);
    const [fxSeq, setFxSeq] = useState(0);

    // Bootstrap the encounter ONCE — combat must not restart when the store
    // player mutates (e.g. our own write-back) or props re-identify.
    const initial = useMemo(
        () => initializeCombatEncounter(bootstrapPlayer, enemy, deck, seed),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    const live = state ?? initial;
    const vm = useMemo(() => buildCombatViewModel(live), [live]);
    const vmRef = useRef(vm);
    vmRef.current = vm;

    // ── momentum wheel (see state/combat/momentum.ts) ──
    // `lit` is panel-owned UI state; `charged` is DERIVED from the engine state:
    // a live wild momentum die in the tray IS the charge.
    const [wheelLit, setWheelLit] = useState<WheelStance[]>([]);
    const wheelLitRef = useRef<WheelStance[]>([]);
    const momentumCounter = useRef(0);
    const [momentumInfoOpen, setMomentumInfoOpen] = useState(false);
    const momentumCharged = vm.dice.some((d) => isMomentumDieId(d.id) && !d.spent && !d.isX);
    const chargedRef = useRef(momentumCharged);
    chargedRef.current = momentumCharged;

    // ── screen-level drag controller (cards + dice) ──
    // dragX/dragY are written straight from the board's gesture worklets every
    // frame (see DragController.x/y) — the JS thread only sees begin and end.
    const [dragActive, setDragActive] = useState<DragPayload | null>(null);
    const dragRef = useRef<DragPayload | null>(null);
    const dragX = useSharedValue(0);
    const dragY = useSharedValue(0);
    const dragShown = useSharedValue(0);
    const begin = useCallback((payload: DragPayload, x: number, y: number) => {
        dragRef.current = payload; dragX.value = x; dragY.value = y; dragShown.value = 1; setDragActive(payload);
    }, [dragX, dragY, dragShown]);
    const drag: DragController = useMemo(() => ({ begin, end: () => undefined, active: dragActive, x: dragX, y: dragY }), [begin, dragActive, dragX, dragY]);
    const end = useCallback((x: number, y: number) => {
        const payload = dragRef.current; dragRef.current = null; dragShown.value = 0; setDragActive(null);
        if (!payload) return;
        const resolver = (drag as DragController & { resolveDrop?: DropResolver }).resolveDrop;
        if (resolver) void resolver(payload, x, y);
    }, [drag, dragShown]);
    drag.end = end;
    // Centre the 108×158 face under the finger (half-width 54 / half-height 79)
    // and lift it above the fingertip so the card stays readable mid-drag.
    const ghostStyle = useAnimatedStyle(() => ({ opacity: dragShown.value, transform: [{ translateX: dragX.value - 54 }, { translateY: dragY.value - 79 - 24 }, { scale: 1.1 }] }));

    // ── engine wiring ──
    const apply = useCallback((fn: (s: CombatEncounterState) => CombatEncounterState) => {
        setState((prev) => { const s = prev ?? initial; return fn(s); });
    }, [initial]);

    const unstageUid = useCallback((uid: string) => setStagedUids((prev) => prev.filter((u) => u !== uid)), []);
    const onEnter = useCallback(() => apply((s) => rollEncounterDice(s).state), [apply]);
    const onStage = useCallback((uid: string) => setStagedUids((prev) => (prev.includes(uid) ? prev : [...prev, uid])), []);
    const onUnstage = useCallback((uid: string) => unstageUid(uid), [unstageUid]);
    // APPLY one staged card (hazard model — the die is OPTIONAL). `power` true →
    // draft the dragged die (unless one is already drafted, the combo case) + power
    // the card (bottom action); `power` false → the FREE base action (top action,
    // no die). One commit; the card leaves staging.
    const onApply = useCallback((uid: string, dieId: string | null, power: boolean) => {
        // Momentum: advance the wheel with this card's stance (looked up BEFORE the
        // play removes it from the hand). A completed cycle forges a wild momentum
        // die into the tray; while that die is live, plays don't advance the wheel.
        let grantId: string | null = null;
        const stance = vmRef.current.hand.find((c) => c.uid === uid)?.stance;
        if (!chargedRef.current && isWheelStance(stance)) {
            const r = advanceWheel(wheelLitRef.current, stance);
            wheelLitRef.current = r.lit;
            setWheelLit(r.lit);
            if (r.completed) {
                momentumCounter.current += 1;
                grantId = momentumDieId(momentumCounter.current);
                chargedRef.current = true;   // block re-advance within this apply batch
            }
        }
        apply((s) => {
            let ns = s;
            if (power && dieId && s.draftedDieId === null) ns = draftStanceDie(ns, dieId).state;
            const t = playCombatCard(ns, { uid }, power);
            fxRef.current = t.events;
            ns = t.state;
            // TODO(engine): momentum belongs in axiomancer-mechanics as a first-class
            // rule. Until then the grant is a minimal host-side state write — the
            // same precedent as this panel's economy write-back — of an engine-native
            // wild die (draft/play/spend all handled by the engine). Id-guarded so a
            // double-invoked updater can't duplicate it.
            if (grantId && !ns.dice.some((d) => d.id === grantId)) {
                const die: CombatManaDie = { id: grantId, color: 'wild', state: 'available', temporary: true };
                ns = { ...ns, dice: [...ns.dice, die] };
            }
            return ns;
        });
        setFxSeq((n) => n + 1);
        unstageUid(uid);
    }, [apply, unstageUid]);
    const onDiscard = useCallback((uid: string) => { apply((s) => discardCombatCard(s, uid).state); unstageUid(uid); }, [apply, unstageUid]);
    const onSignature = useCallback((id: string) => apply((s) => playSignatureSkill(s, id).state), [apply]);
    const onEndPhase = useCallback(() => {
        apply((s) => {
            const t = resolveThreatPhase(s);
            fxRef.current = t.events;
            let ns = t.state;
            if (ns.phase === 'phase-play' && ns.dice.length === 0) ns = startTurn(ns).state;
            return ns;
        });
        setFxSeq((n) => n + 1);
        setStagedUids([]);
    }, [apply]);
    const onMercy = useCallback((choice: 'spare' | 'exploit') => apply((s) => selectEncounterMercyChoice(s, choice).state), [apply]);
    // Stable resolution-feedback payload — recomputed only when a new resolve bumps
    // the seq (captures the events stashed in fxRef just before).
    const fx = useMemo<CombatFx>(() => ({ seq: fxSeq, events: fxRef.current }), [fxSeq]);

    const handleExit = useCallback(() => {
        if (exitedRef.current) return;
        exitedRef.current = true;
        onExit(live.finalOutcome ?? null);
    }, [onExit, live.finalOutcome]);

    // Economy write-back — fires once, the instant combat reaches a terminal
    // outcome (so spoils land even if the player lingers on the summary).
    useEffect(() => {
        if (!live.finalOutcome || wroteBackRef.current) return;
        wroteBackRef.current = true;
        if (persistOutcome) applyHazardOutcome(store, live.finalOutcome, live, enemy);
    }, [live.finalOutcome, live, persistOutcome, store, enemy]);

    // Roll the deckbuilder reward once, on victory. Roll a wider pool, then bias
    // it ~60% toward the run's hidden archetype (a no-op for non-bundle runs).
    useEffect(() => {
        if (live.finalOutcome === 'victory' && rewardOffers.length === 0 && !rewardsClaimed && player) {
            const pool = rollCombatCardRewards(player, Math.random, 8);
            setRewardOffers(skewRewardsByArchetype(pool, runArchetype(store), 3));
        }
    }, [live.finalOutcome, rewardOffers.length, rewardsClaimed, player, store]);

    // Tutorial completes itself once the turn-one coach script is exhausted.
    useEffect(() => {
        if (tutorialActive && primerDone && vm && live.phase !== 'reveal'
            && currentCombatTutorialStep(live, vm) === -1) {
            finishTutorial(false);
        }
    }, [tutorialActive, primerDone, live, vm, finishTutorial]);

    const onRewardPick = useCallback((cardId: string | null) => {
        if (cardId) store.setState((s) => (s.player ? { player: addRewardCard(s.player, cardId) } : {}));
        setRewardsClaimed(true);
    }, [store]);

    if (!vm) {
        return <View style={styles.root} testID="combat-encounter-empty" />;
    }

    const summary = live.finalOutcome ? buildCombatSummary(live) : null;
    const mercy = live.phase === 'mercy-choice' && !live.finalOutcome;
    const showReveal = live.phase === 'reveal';

    return (
        <View style={styles.root}>
            {!showReveal && (
                <CombatBoard
                    vm={vm}
                    drag={drag}
                    stagedUids={stagedUids}
                    onApply={onApply}
                    onStage={onStage}
                    onUnstage={onUnstage}
                    onDiscard={onDiscard}
                    onSignature={onSignature}
                    onEndPhase={onEndPhase}
                    onInspect={(c) => { detailOpenedAt.current = Date.now(); setDetailCard(c); }}
                    onChip={setTipEffect}
                    onSignatureInfo={setSigInfo}
                    onPlayerInspect={() => setPilgrimOpen(true)}
                    momentum={{ lit: wheelLit, charged: momentumCharged }}
                    onMomentumInfo={() => setMomentumInfoOpen(true)}
                    fx={fx}
                />
            )}

            {/* CombatRevealOverlay (Spec 26 §7) — read the foe before you commit */}
            {showReveal && (
                <View style={styles.reveal} testID="combat-reveal">
                    <ScrollView contentContainerStyle={styles.revealScroll}>
                        <Text style={styles.revealEyebrow}>⚔ A FOE BARS THE WAY</Text>
                        <View style={[styles.revealPortrait, { borderColor: AXM.blood }]}>
                            <EnemyPortrait enemyArtKey={vm.enemy.artKey} isBoss={vm.enemy.isBoss} width={120} height={140} label={vm.enemy.name} />
                        </View>
                        <Text style={styles.revealName}>{vm.enemy.name}</Text>
                        <Text style={styles.revealHp}>♥ {vm.enemy.hp} / {vm.enemy.maxHp}</Text>
                        {vm.enemy.stanceHint ? <Text style={styles.revealTell}>“{vm.enemy.stanceHint}”</Text> : null}
                        <Text style={styles.revealSection}>THREAT SEQUENCE — they telegraph WHAT, not their stance</Text>
                        {live.threatPhases.map((p, i) => {
                            const meta = INTENT_ICONS[p.intentType ?? 'pass'];
                            return (
                                <View key={i} style={styles.revealPhase}>
                                    <Text style={[styles.revealPhaseIcon, { color: meta.color }]}>{meta.icon}</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.revealPhaseLabel}>PHASE {p.index} · {meta.label}</Text>
                                        <Text style={styles.revealPhaseText} numberOfLines={2}>{p.threatAction.description}</Text>
                                        {p.stanceHint ? <Text style={styles.revealPhaseTell}>🜲 stance hidden — {p.stanceHint}</Text> : null}
                                    </View>
                                </View>
                            );
                        })}
                        <Pressable onPress={onEnter} testID="combat-enter" accessibilityRole="button" accessibilityLabel="Enter combat and roll your first dice" style={[styles.revealBtn, { borderColor: AXM.sulfur }]}>
                            <Text style={[styles.revealBtnText, { color: AXM.sulfur }]}>ENTER COMBAT ›</Text>
                        </Pressable>
                    </ScrollView>
                </View>
            )}

            {/* mercy choice */}
            {mercy && (
                <View style={styles.backdrop} testID="combat-mercy">
                    <View style={[styles.modal, { borderColor: '#a86bdc' }]}>
                        <Text style={styles.modalTitle}>{live.enemy.name} is overwhelmed.</Text>
                        <Text style={styles.modalSub}>The will to fight has drained away.</Text>
                        <View style={styles.modalBtns}>
                            <Pressable onPress={() => onMercy('spare')} testID="combat-mercy-spare" accessibilityRole="button" accessibilityLabel="Spare" style={[styles.modalBtn, { borderColor: '#5bbf6a' }]}><Text style={[styles.modalBtnText, { color: '#5bbf6a' }]}>SPARE</Text></Pressable>
                            <Pressable onPress={() => onMercy('exploit')} testID="combat-mercy-exploit" accessibilityRole="button" accessibilityLabel="Exploit" style={[styles.modalBtn, { borderColor: AXM.blood }]}><Text style={[styles.modalBtnText, { color: AXM.blood }]}>EXPLOIT</Text></Pressable>
                        </View>
                    </View>
                </View>
            )}

            {/* card detail — Sanguine-Step shape: keyword DEFINITIONS on top, ONE
                large rendered card centrepiece over a stance-coloured halo, then the
                FREE-vs-POWER fork. Un-boxed: everything floats on the dimmed backdrop.
                The developer-facing mathLine / subtitle / readNote are NEVER shown. */}
            {detailCard && (
                <Pressable style={styles.backdrop} testID="combat-card-detail" onPress={() => { if (Date.now() - detailOpenedAt.current > 350) setDetailCard(null); }}>
                    <View style={styles.detailModalWrap} onStartShouldSetResponder={() => true}>
                        <ScrollView
                            style={styles.detailScroll}
                            contentContainerStyle={styles.detailStack}
                        >
                            {/* (1) keyword DEFINITION panels at the top */}
                            {detailCard.detail.keywords.length > 0 && (
                                <View style={styles.detailKeywords}>
                                    {detailCard.detail.keywords.map((k, i) => {
                                        const tag = keywordTypeTag(detailCard.face.kind, i);
                                        return (
                                            <View key={k.name} style={styles.detailKeywordRow}>
                                                <View style={styles.detailKeywordHead}>
                                                    <Text style={[styles.detailKeywordName, k.minor ? { color: AXM.ash } : null]}>{k.name}</Text>
                                                    <Text style={[styles.detailKeywordTag, { color: TAG_COLORS[tag] ?? AXM.bone }]}>{tag}</Text>
                                                </View>
                                                <Text style={styles.detailKeywordDef}>{k.def}{k.minor ? ' (minor right now)' : ''}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}

                            {/* (2) the LARGE rendered card over a stance-coloured radial halo —
                                the effect SENTENCE + the type-tab live ON the card (define once /
                                show once), so no restated outcome line below it. */}
                            <View style={styles.detailCardWrap}>
                                <Svg width={detailCardW + 120} height={detailCardW + 120} viewBox="0 0 100 100" style={styles.detailHalo} pointerEvents="none">
                                    <Defs>
                                        <RadialGradient id="axmCardHalo" cx="50%" cy="50%" r="50%">
                                            <Stop offset="0%" stopColor={detailCard.stanceColor} stopOpacity={0.34} />
                                            <Stop offset="60%" stopColor={detailCard.stanceColor} stopOpacity={0.1} />
                                            <Stop offset="100%" stopColor={detailCard.stanceColor} stopOpacity={0} />
                                        </RadialGradient>
                                    </Defs>
                                    <Circle cx={50} cy={50} r={50} fill="url(#axmCardHalo)" />
                                </Svg>
                                <CombatCardFace card={detailCard} width={detailCardW} height={Math.round(detailCardW * 1.43)} large />
                            </View>
                            {detailCard.detail.stacksText ? <Text style={styles.detailStacks}>{detailCard.detail.stacksText}</Text> : null}

                            {/* (3) the die-optional choice as a compact two-row pill table. The +DIE
                                pill carries the real read-scaling math (guard ▲/▼ triplet, etc.) —
                                the prose is flattened, NOT the math. */}
                            <View style={styles.detailPills}>
                                <View style={styles.detailPillRow}>
                                    <Text style={styles.detailPillTag}>◇ NO DIE</Text>
                                    <Text style={styles.detailPillVal} numberOfLines={2}>{detailCard.detail.freePill}</Text>
                                </View>
                                <View style={[styles.detailPillRow, styles.detailPillRowPaid, { borderLeftColor: detailCard.face.categoryColor, backgroundColor: `${detailCard.face.categoryColor}14` }]}>
                                    <Text style={[styles.detailPillTag, { color: detailCard.face.categoryColor }]}>◆ +DIE</Text>
                                    <Text style={[styles.detailPillKw, { color: detailCard.face.categoryColor }]} numberOfLines={1}>{detailCard.detail.diePillKeyword}</Text>
                                    <Text style={styles.detailPillVal} numberOfLines={2}>{detailCard.detail.diePill}</Text>
                                </View>
                            </View>
                            {/* the colour-match rule — ONE global legend (was boilerplated onto every card) */}
                            <Text style={styles.detailColorMatch}>{detailCard.detail.colorMatchHint}</Text>
                        </ScrollView>

                    </View>

                    {/* close ✕ — pinned to the BACKDROP's bottom-right (reference shape), so
                        it never falls below the fold and never overlaps the keyword tags. */}
                    <Pressable
                        onPress={() => setDetailCard(null)}
                        testID="combat-card-detail-close"
                        accessibilityRole="button"
                        accessibilityLabel="Close card detail"
                        hitSlop={10}
                        style={[styles.detailClose, { borderColor: detailCard.face.categoryColor }]}
                    >
                        <Text style={[styles.detailCloseText, { color: detailCard.face.categoryColor }]}>✕</Text>
                    </Pressable>
                </Pressable>
            )}

            {/* effect tooltip — reference status-detail plaque: radial glyph burst hero,
                coloured name, serif gloss, mechanics meta, hex category badge pinned to
                the bottom border. */}
            {tipEffect && (() => {
                const cat = effectCategory(tipEffect.glyph.kind, tipEffect.glyph.color);
                return (
                    <Pressable style={styles.backdrop} testID="combat-effect-tip" onPress={() => setTipEffect(null)}>
                        <View style={[styles.tipPlaque, { borderColor: `${tipEffect.glyph.color}66` }]}>
                            {/* corner brackets */}
                            <View style={[styles.tipCorner, styles.tipCornerTl, { borderColor: tipEffect.glyph.color }]} pointerEvents="none" />
                            <View style={[styles.tipCorner, styles.tipCornerTr, { borderColor: tipEffect.glyph.color }]} pointerEvents="none" />
                            <View style={[styles.tipCorner, styles.tipCornerBl, { borderColor: tipEffect.glyph.color }]} pointerEvents="none" />
                            <View style={[styles.tipCorner, styles.tipCornerBr, { borderColor: tipEffect.glyph.color }]} pointerEvents="none" />
                            <GlyphBurst color={tipEffect.glyph.color} glyph={tipEffect.glyph.glyph} />
                            <Text style={[styles.tipName, { color: tipEffect.glyph.color, textShadowColor: tipEffect.glyph.color }]}>
                                {tipEffect.glyph.label.toUpperCase()}
                            </Text>
                            {tipEffect.gloss && <Text style={styles.tipGloss}>{tipEffect.gloss}</Text>}
                            <Text style={styles.tipMeta}>intensity {tipEffect.intensity}{tipEffect.isMax ? ' (MAX)' : ''} · {tipEffect.duration} turns left</Text>
                            <View style={styles.tipBadgeWrap} pointerEvents="none">
                                <Svg width={128} height={30} viewBox="0 0 128 30">
                                    <Polygon
                                        points="14,1 114,1 127,15 114,29 14,29 1,15"
                                        fill={AXM.panelBg}
                                        stroke={cat.color}
                                        strokeWidth={1.5}
                                    />
                                </Svg>
                                <View style={StyleSheet.absoluteFill}>
                                    <View style={styles.tipBadgeInner}>
                                        <Text style={[styles.tipBadgeText, { color: cat.color }]} allowFontScaling={false}>{cat.label}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </Pressable>
                );
            })()}

            {/* signature-rune info — long-press (or unaffordable tap) on a rune */}
            {sigInfo && (
                <Pressable style={styles.backdrop} testID="combat-signature-info" onPress={() => setSigInfo(null)}>
                    <View style={[styles.tipPlaque, { borderColor: `${AXM.sulfur}66` }]}>
                        <View style={[styles.tipCorner, styles.tipCornerTl, { borderColor: AXM.sulfur }]} pointerEvents="none" />
                        <View style={[styles.tipCorner, styles.tipCornerTr, { borderColor: AXM.sulfur }]} pointerEvents="none" />
                        <View style={[styles.tipCorner, styles.tipCornerBl, { borderColor: AXM.sulfur }]} pointerEvents="none" />
                        <View style={[styles.tipCorner, styles.tipCornerBr, { borderColor: AXM.sulfur }]} pointerEvents="none" />
                        <GlyphBurst color={AXM.sulfur} glyph={sigInfo.icon} />
                        <Text style={[styles.tipName, { color: AXM.sulfur, textShadowColor: AXM.sulfur }]}>{sigInfo.name.toUpperCase()}</Text>
                        <Text style={styles.tipGloss}>{sigInfo.description}</Text>
                        <Text style={styles.tipMeta}>
                            consumes ◆ {sigInfo.cost} conviction{sigInfo.affordable ? '' : ` — you have too little`}
                        </Text>
                        <View style={styles.tipBadgeWrap} pointerEvents="none">
                            <Svg width={128} height={30} viewBox="0 0 128 30">
                                <Polygon points="14,1 114,1 127,15 114,29 14,29 1,15" fill={AXM.panelBg} stroke={AXM.sulfur} strokeWidth={1.5} />
                            </Svg>
                            <View style={StyleSheet.absoluteFill}>
                                <View style={styles.tipBadgeInner}>
                                    <Text style={[styles.tipBadgeText, { color: AXM.sulfur }]} allowFontScaling={false}>SIGNATURE</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </Pressable>
            )}

            {/* momentum — how the wheel works */}
            {momentumInfoOpen && (
                <Pressable style={styles.backdrop} testID="combat-momentum-info" onPress={() => setMomentumInfoOpen(false)}>
                    <View style={[styles.tipPlaque, { borderColor: `${AXM.sulfur}66` }]}>
                        <View style={[styles.tipCorner, styles.tipCornerTl, { borderColor: AXM.sulfur }]} pointerEvents="none" />
                        <View style={[styles.tipCorner, styles.tipCornerTr, { borderColor: AXM.sulfur }]} pointerEvents="none" />
                        <View style={[styles.tipCorner, styles.tipCornerBl, { borderColor: AXM.sulfur }]} pointerEvents="none" />
                        <View style={[styles.tipCorner, styles.tipCornerBr, { borderColor: AXM.sulfur }]} pointerEvents="none" />
                        <GlyphBurst color={AXM.sulfur} glyph="✦" />
                        <Text style={[styles.tipName, { color: AXM.sulfur, textShadowColor: AXM.sulfur }]}>MOMENTUM</Text>
                        <Text style={styles.tipGloss}>
                            Play stances around the wheel — HEART, then BODY, then MIND (starting on any of
                            them). Each right stance lights the next node; a wrong stance resets the wheel.
                            Light all three and you forge a wild ✦ MOMENTUM die — drag it onto ANY card to
                            power it, with the wild colour-match bonus.
                        </Text>
                        <Text style={styles.tipMeta}>wrong stance resets · the wild die lasts until spent or the turn ends</Text>
                        <View style={styles.tipBadgeWrap} pointerEvents="none">
                            <Svg width={128} height={30} viewBox="0 0 128 30">
                                <Polygon points="14,1 114,1 127,15 114,29 14,29 1,15" fill={AXM.panelBg} stroke={AXM.sulfur} strokeWidth={1.5} />
                            </Svg>
                            <View style={StyleSheet.absoluteFill}>
                                <View style={styles.tipBadgeInner}>
                                    <Text style={[styles.tipBadgeText, { color: AXM.sulfur }]} allowFontScaling={false}>COMBO</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </Pressable>
            )}

            {/* pilgrim modal — tap the player medallion: ALL stats + status effects */}
            {pilgrimOpen && (() => {
                const p = live.player;
                const stats = p.baseStats ?? { heart: 0, body: 0, mind: 0 };
                const d = p.derivedStats ?? ({} as Partial<Character['derivedStats']>);
                const nc = p.nonCombatStats ?? ({} as Partial<Character['nonCombatStats']>);
                const axes = [
                    { label: 'PHYSICAL', color: STANCE_COLORS.body, atk: d.physicalAttack, skl: d.physicalSkill, def: d.physicalDefense, save: nc.physicalSave, test: nc.physicalTest },
                    { label: 'MENTAL', color: STANCE_COLORS.mind, atk: d.mentalAttack, skl: d.mentalSkill, def: d.mentalDefense, save: nc.mentalSave, test: nc.mentalTest },
                    { label: 'EMOTIONAL', color: STANCE_COLORS.heart, atk: d.emotionalAttack, skl: d.emotionalSkill, def: d.emotionalDefense, save: nc.emotionalSave, test: nc.emotionalTest },
                ] as const;
                return (
                    <Pressable style={styles.backdrop} testID="combat-pilgrim-modal" onPress={() => setPilgrimOpen(false)}>
                        <View style={styles.pilgrimWrap} onStartShouldSetResponder={() => true}>
                            <ScrollView contentContainerStyle={styles.pilgrimStack} showsVerticalScrollIndicator={false}>
                                <View style={styles.pilgrimHead}>
                                    <View style={styles.pilgrimPortrait}><PlayerPortrait width={56} height={68} /></View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.pilgrimName}>{vm.player.name}</Text>
                                        <Text style={styles.pilgrimVitae}>LVL {p.level ?? 1}   ♥ {vm.player.hp} / {vm.player.maxHp} VITAE{vm.player.guard > 0 ? `   🛡 ${vm.player.guard}` : ''}</Text>
                                    </View>
                                    <Text style={[styles.pilgrimConviction, { color: AXM.sulfur }]}>◆ {vm.conviction}</Text>
                                </View>
                                <View style={styles.pilgrimStatRow}>
                                    {([['HEART', stats.heart, STANCE_COLORS.heart], ['BODY', stats.body, STANCE_COLORS.body], ['MIND', stats.mind, STANCE_COLORS.mind]] as const).map(([label, val, color]) => (
                                        <View key={label} style={[styles.pilgrimStat, { borderColor: `${color}88` }]}>
                                            <Text style={[styles.pilgrimStatVal, { color }]}>{val}</Text>
                                            <Text style={styles.pilgrimStatLabel}>{label}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* the FULL stat table — attack/skill/defense + save/test per axis */}
                                <View style={styles.pilgrimGridHead}>
                                    <Text style={styles.pilgrimGridLabel} />
                                    {['ATK', 'SKL', 'DEF', 'SAVE', 'TEST'].map((h) => (
                                        <Text key={h} style={styles.pilgrimGridCol} allowFontScaling={false}>{h}</Text>
                                    ))}
                                </View>
                                {axes.map((a) => (
                                    <View key={a.label} style={styles.pilgrimGridRow}>
                                        <Text style={[styles.pilgrimGridLabel, { color: a.color }]} allowFontScaling={false}>{a.label}</Text>
                                        {[a.atk, a.skl, a.def, a.save, a.test].map((v, i) => (
                                            <Text key={i} style={styles.pilgrimGridVal} allowFontScaling={false}>{v ?? 0}</Text>
                                        ))}
                                    </View>
                                ))}
                                <View style={styles.pilgrimMetaRow}>
                                    <Text style={styles.pilgrimMetaChip} allowFontScaling={false}>🍀 LUCK {d.luck ?? 0}</Text>
                                    <Text style={styles.pilgrimMetaChip} allowFontScaling={false}>XP {p.experience ?? 0} / {p.experienceToNextLevel ?? 0}</Text>
                                </View>

                                <Text style={styles.pilgrimSection}>STATUS EFFECTS</Text>
                                {vm.player.effects.length === 0 && <Text style={styles.pilgrimEmpty}>clear — nothing afflicts or blesses you</Text>}
                                {vm.player.effects.map((e) => (
                                    <View key={e.effectId} style={styles.pilgrimRow}>
                                        <Text style={[styles.pilgrimRowIcon, { color: e.glyph.color }]}>{e.glyph.glyph}</Text>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.pilgrimRowName, { color: e.glyph.color }]}>{e.glyph.label}  ·  ×{e.intensity} · {e.duration} turns</Text>
                                            {e.gloss ? <Text style={styles.pilgrimRowDef}>{e.gloss}</Text> : null}
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                        <Pressable
                            onPress={() => setPilgrimOpen(false)}
                            testID="combat-pilgrim-close"
                            accessibilityRole="button"
                            accessibilityLabel="Close pilgrim details"
                            hitSlop={10}
                            style={[styles.detailClose, { borderColor: AXM.sulfur }]}
                        >
                            <Text style={[styles.detailCloseText, { color: AXM.sulfur }]}>✕</Text>
                        </Pressable>
                    </Pressable>
                );
            })()}

            {/* deckbuilder reward — claimed before the summary on a win */}
            {live.finalOutcome === 'victory' && !rewardsClaimed && rewardOffers.length > 0 && (
                <CombatRewardsOverlay offers={rewardOfferVMs(rewardOffers)} onPick={onRewardPick} />
            )}

            {summary && (rewardsClaimed || live.finalOutcome !== 'victory') && (
                <CombatSummaryModal summary={summary} onClose={handleExit} />
            )}

            {/* first-fight tutorial — primer panels, then the turn-one coach */}
            {tutorialActive && !primerDone && (
                <CombatTutorialPrimer onBegin={() => setPrimerDone(true)} onSkip={() => finishTutorial(true)} />
            )}
            {tutorialActive && primerDone && !showReveal && !summary && !mercy && (
                <CombatTutorialCoach state={live} vm={vm} onSkip={() => finishTutorial(true)} />
            )}

            {/* drag ghost */}
            {dragActive && (
                <Animated.View pointerEvents="none" style={[styles.ghost, ghostStyle]}>
                    {dragActive.type === 'card' ? (
                        // The dragged card keeps its real face (was a stripped name-only box
                        // that looked like a different, "old" card mid-drag).
                        <CombatCardFace card={dragActive.card} width={108} height={158} />
                    ) : (
                        <CombatDie die={dragActive.die} size={56} />
                    )}
                </Animated.View>
            )}
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: { flex: 1, width: '100%', height: '100%' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4,3,6,0.93)', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50 },
    modal: { width: '100%', maxWidth: 380, borderWidth: 2, backgroundColor: AXM.panelBg, padding: 18, alignItems: 'center' },
    modalTitle: { fontFamily: FONTS.gothic, fontSize: 18, color: AXM.parchment, textAlign: 'center' },
    modalSub: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 13, color: AXM.bone, textAlign: 'center', marginTop: 4, marginBottom: 14 },
    modalBtns: { flexDirection: 'row', gap: 12, marginTop: 6 },
    modalBtn: { borderWidth: 2, paddingHorizontal: 22, paddingVertical: 9 },
    modalBtnText: { fontFamily: FONTS.gothic, fontSize: 16, letterSpacing: 1 },
    detailMeta: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.bone, letterSpacing: 0.6, marginTop: 4, marginBottom: 10 },
    // Relative wrapper so the close ✕ can pin OUTSIDE the ScrollView.
    detailModalWrap: { width: '100%', maxWidth: 380, maxHeight: '92%' },
    detailScroll: { width: '100%' },
    // Sanguine-Step inspect stack (keyword defs → large card → fork) — UN-BOXED:
    // panels/card/pills float directly on the dimmed backdrop.
    detailStack: { width: '100%', maxWidth: 380, padding: 8, paddingBottom: 64, alignItems: 'center' },
    detailCardWrap: { marginTop: 2, marginBottom: 6, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.8, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
    detailHalo: { position: 'absolute' },
    detailBold: { fontFamily: FONTS.gothic, color: AXM.parchment },
    detailKeywordHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3, gap: 8 },
    detailKeywordTag: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 1.5, flexShrink: 0 },
    // Close ✕ — bottom-right of the BACKDROP (never overlaps the keyword tags,
    // never falls below the fold).
    detailClose: { position: 'absolute', bottom: 26, right: 18, zIndex: 10, width: 50, height: 50, borderRadius: 25, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: AXM.panelBg },
    detailCloseText: { fontFamily: FONTS.sans, fontSize: 20, lineHeight: 22 },
    detailSubtitle: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 13, color: AXM.parchment, textAlign: 'center', marginTop: 3 },
    detailOutcomeBox: { alignSelf: 'stretch', borderWidth: 1, borderRadius: 3, padding: 10, marginBottom: 8 },
    detailOutcomeHead: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 1.5, color: AXM.bone, opacity: 0.7, marginBottom: 5 },
    detailStatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 7 },
    detailStat: { fontFamily: FONTS.mono, fontSize: 12 },
    detailStatLabel: { fontFamily: FONTS.sans, fontSize: 9, letterSpacing: 0.8, color: AXM.bone },
    detailStatValue: { fontFamily: FONTS.mono, fontSize: 13, color: AXM.parchment },
    detailStacks: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 11, color: AXM.bone, marginTop: 6 },
    detailFreeBox: { alignSelf: 'stretch', marginBottom: 8 },
    detailFreeLine: { fontFamily: FONTS.serif, fontSize: 12.5, color: AXM.bone, lineHeight: 17, marginBottom: 5 },
    detailPowerLine: { fontFamily: FONTS.serif, fontSize: 12.5, lineHeight: 17, marginBottom: 5 },
    // Compact NO-DIE / +DIE pill table (replaces the two prose paragraphs).
    detailPills: { alignSelf: 'stretch', gap: 7, marginBottom: 10, marginTop: 4 },
    detailPillRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 9, backgroundColor: 'rgba(0,0,0,0.6)' },
    detailPillRowPaid: { borderLeftWidth: 3 },
    detailPillTag: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.5, color: AXM.bone, minWidth: 58 },
    detailPillKw: { fontFamily: FONTS.gothic, fontSize: 13, letterSpacing: 0.5 },
    detailPillVal: { flex: 1, fontFamily: FONTS.mono, fontSize: 12.5, color: AXM.parchment, letterSpacing: 0.2 },
    detailColorMatch: { alignSelf: 'stretch', fontFamily: FONTS.sans, fontSize: 9, letterSpacing: 1.6, color: AXM.bone, opacity: 0.6, lineHeight: 14, marginBottom: 4, textAlign: 'center' },
    detailReadNote: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 11, color: AXM.bone, lineHeight: 15 },
    detailLine: { fontFamily: FONTS.serif, fontSize: 13, color: AXM.parchment, lineHeight: 18 },
    detailKeywords: { alignSelf: 'stretch', marginBottom: 10 },
    detailKeywordsHead: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 1.5, color: AXM.bone, opacity: 0.7, marginBottom: 7 },
    detailKeywordRow: { alignSelf: 'stretch', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 6, padding: 12, marginBottom: 7, backgroundColor: 'rgba(0,0,0,0.6)' },
    detailKeywordName: { fontFamily: FONTS.sans, fontSize: 16, letterSpacing: 1.5, color: AXM.sulfur, flexShrink: 1 },
    detailKeywordDef: { fontFamily: FONTS.serif, fontSize: 13.5, color: AXM.parchment, lineHeight: 19 },
    detailMath: { alignSelf: 'stretch', fontFamily: FONTS.mono, fontSize: 10.5, color: AXM.bone, opacity: 0.85, lineHeight: 15, marginBottom: 8 },
    detailTipGloss: { fontFamily: FONTS.serif, fontSize: 12, color: AXM.parchment, textAlign: 'center', marginTop: 6, lineHeight: 16 },
    detailHint: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 11, color: AXM.bone, marginTop: 4, textAlign: 'center' },

    // ── status tooltip plaque (reference status-detail shape) ──
    tipPlaque: {
        width: '100%', maxWidth: 340, borderWidth: 1, borderRadius: 8, backgroundColor: AXM.panelBg,
        paddingTop: 18, paddingBottom: 30, paddingHorizontal: 22, alignItems: 'center',
    },
    tipCorner: { position: 'absolute', width: 18, height: 18 },
    tipCornerTl: { top: -1, left: -1, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 8 },
    tipCornerTr: { top: -1, right: -1, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 8 },
    tipCornerBl: { bottom: -1, left: -1, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 8 },
    tipCornerBr: { bottom: -1, right: -1, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 8 },
    burstWrap: { width: 170, height: 170, alignItems: 'center', justifyContent: 'center' },
    burstGlyphBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    burstGlyph: { fontSize: 42, lineHeight: 50, textShadowRadius: 10, textShadowOffset: { width: 0, height: 0 } },
    tipName: {
        fontFamily: FONTS.sans, fontSize: 26, letterSpacing: 3, marginTop: 6,
        textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 },
    },
    tipGloss: { fontFamily: FONTS.serif, fontSize: 14, lineHeight: 20, color: AXM.parchmentDim, textAlign: 'center', marginTop: 8 },
    tipMeta: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.bone, letterSpacing: 0.6, marginTop: 10 },
    tipBadgeWrap: { position: 'absolute', bottom: -15, alignSelf: 'center', width: 128, height: 30 },
    tipBadgeInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    tipBadgeText: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 2 },

    // ── pilgrim modal (tap the player medallion) ──
    pilgrimWrap: { width: '100%', maxWidth: 380, maxHeight: '88%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', borderRadius: 8, backgroundColor: AXM.panelBg },
    pilgrimStack: { padding: 16, paddingBottom: 24 },
    pilgrimHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    pilgrimPortrait: { width: 60, height: 72, borderRadius: 6, borderWidth: 1.5, borderColor: AXM.sulfur, backgroundColor: AXM.deepBg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    pilgrimName: { fontFamily: FONTS.gothic, fontSize: 20, color: AXM.parchment },
    pilgrimVitae: { fontFamily: FONTS.mono, fontSize: 12, color: AXM.bone, marginTop: 3, letterSpacing: 0.4 },
    pilgrimConviction: { fontFamily: FONTS.gothic, fontSize: 18 },
    pilgrimStatRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
    pilgrimStat: { flex: 1, borderWidth: 1, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', paddingVertical: 7 },
    pilgrimStatVal: { fontFamily: FONTS.gothic, fontSize: 20, lineHeight: 23 },
    pilgrimStatLabel: { fontFamily: FONTS.sans, fontSize: 9, letterSpacing: 1.6, color: AXM.bone, marginTop: 1 },
    // full stat table
    pilgrimGridHead: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingHorizontal: 4 },
    pilgrimGridRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.4)', paddingVertical: 6, paddingHorizontal: 4, marginTop: 4 },
    pilgrimGridLabel: { flex: 1.6, fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 1.2, color: AXM.bone, paddingLeft: 4 },
    pilgrimGridCol: { flex: 1, fontFamily: FONTS.sans, fontSize: 9, letterSpacing: 1, color: AXM.bone, textAlign: 'center', opacity: 0.75 },
    pilgrimGridVal: { flex: 1, fontFamily: FONTS.mono, fontSize: 13, color: AXM.parchment, textAlign: 'center' },
    pilgrimMetaRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
    pilgrimMetaChip: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.bone, letterSpacing: 0.4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 7, paddingVertical: 3, overflow: 'hidden' },
    pilgrimSection: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 2, color: AXM.sulfur, marginTop: 14, marginBottom: 6 },
    pilgrimEmpty: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 12, color: AXM.ash },
    pilgrimRow: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.4)', padding: 9, marginBottom: 6 },
    pilgrimRowIcon: { fontSize: 17, lineHeight: 20 },
    pilgrimRowSlot: { fontFamily: FONTS.sans, fontSize: 9, letterSpacing: 1.2, color: AXM.bone, marginTop: 2, minWidth: 52 },
    pilgrimRowName: { fontFamily: FONTS.sans, fontSize: 13, letterSpacing: 0.8, color: AXM.parchment },
    pilgrimRowDef: { fontFamily: FONTS.serif, fontSize: 12, lineHeight: 16, color: AXM.bone, marginTop: 2 },

    reveal: { flex: 1, backgroundColor: '#0c0a08' },
    revealScroll: { alignItems: 'center', padding: 22, paddingBottom: 40 },
    revealEyebrow: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 2, color: AXM.blood, marginBottom: 14, marginTop: 8 },
    revealPortrait: { borderWidth: 2, borderRadius: 6, padding: 6, backgroundColor: AXM.deepBg },
    revealName: { fontFamily: FONTS.gothic, fontSize: 24, color: AXM.parchment, marginTop: 12, textAlign: 'center' },
    revealHp: { fontFamily: FONTS.mono, fontSize: 13, color: AXM.blood, marginTop: 2 },
    revealTell: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 14, color: AXM.bone, textAlign: 'center', marginTop: 10, marginHorizontal: 10, lineHeight: 19 },
    revealSection: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.2, color: AXM.sulfur, marginTop: 20, marginBottom: 8, alignSelf: 'stretch' },
    revealPhase: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', borderWidth: 1, borderColor: AXM.ash, backgroundColor: 'rgba(0,0,0,0.35)', padding: 9, marginBottom: 7 },
    revealPhaseIcon: { fontSize: 20, lineHeight: 22 },
    revealPhaseLabel: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 0.6, color: AXM.parchment },
    revealPhaseText: { fontFamily: FONTS.serif, fontSize: 12, color: AXM.bone, marginTop: 2, lineHeight: 15 },
    revealPhaseTell: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 10, color: AXM.ash, marginTop: 3, lineHeight: 13 },
    revealBtn: { borderWidth: 2, paddingHorizontal: 30, paddingVertical: 12, marginTop: 22, backgroundColor: 'rgba(212,192,38,0.12)' },
    revealBtnText: { fontFamily: FONTS.gothic, fontSize: 18, letterSpacing: 1 },

    ghost: { position: 'absolute', top: 0, left: 0, zIndex: 999 },
}));
