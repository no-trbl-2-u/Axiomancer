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
 * Live play (`persistOutcome`) hand-rolls only the write-backs that have no
 * engine equivalent — floating dice (Spec 32 v3 §5), banked Souls (Phase 32
 * part 1b), and final HP → player.health — then (Phase 54) routes the
 * outcome through the engine's real `endCombat` reducer for everything else
 * (XP, loot, quest kill-objective advancement + completion rewards, and, on
 * a merciful win, the authored `friendshipReward` payload: flags, codex
 * unlocks, alignment shift, faction deltas, moral-meter). `beginHazardEncounter`
 * stages `state.currentEncounter` via `startCombat` so `endCombat` has a real
 * encounter to resolve against. The deckbuilder reward card is written
 * regardless — it's the new system's own reward (Spec 26b §C). Defeat HP /
 * run reset is the host's concern.
 */

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, Polygon, RadialGradient, Stop } from 'react-native-svg';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard, resolveThreatPhase,
    startTurn, endTurn, draftStanceDie, discardCombatCard, playSignatureSkill, crackGlyph,
    tapFateDie, getPendingDotTotal, getFloatingDiceColors,
    selectEncounterMercyChoice, selectCapitulationChoice, buildCombatSummary,
    getLogger,
    type CombatEncounterState, type CombatOutcome, type Character, type Enemy, type CombatEvent,
} from '@mechanics';

import { CombatBoard, CombatCardFace, OutcomeText, HAND_CARD_W, HAND_CARD_H, type DragController, type DragPayload, type Rect } from '@/components/combat/encounter/CombatBoard';
import { useDragInterruptRecovery } from '@/components/combat/encounter/useDragInterruptRecovery';
import { COMBAT_HUD_HEIGHT, type CombatFx } from '@/components/combat/encounter/CombatCombatantPane';
import { CombatDie, combatDieFootprint } from '@/components/combat/encounter/CombatDie';
import { CombatSummaryModal } from '@/components/combat/encounter/CombatSummaryModal';
import { CombatRewardsOverlay } from '@/components/combat/encounter/CombatRewardsOverlay';
import { CombatTutorialPrimer } from '@/components/combat/encounter/CombatTutorialPrimer';
import { EnemyActionCard } from '@/components/combat/encounter/EnemyActionCard';
import { CombatTutorialCoach } from '@/components/combat/encounter/CombatTutorialCoach';
import { currentCombatTutorialStep } from '@/components/combat/encounter/combat-tutorial-steps';
import { Image } from '@/lib/platform/image';
import { getEncounterEnemyArt } from '@/assets/images/enemies';
import {
    INTENT_ICONS, buildCombatViewModel, resolveApplyRouting, rewardCardVMs, selectEnemyActionCard, STANCE_COLORS,
    selectCombatLogHistory, COMBAT_LOG_TOGGLE_TEXT, COMBAT_LOG_TOGGLE_A11Y, COMBAT_LOG_CLOSE_A11Y,
    type CombatCardVM, type CombatEffectChipVM, type CombatSealVM, type CombatSignatureVM, type EnemyActionCardVM,
} from '@/state/presenters/combat-encounter.engine';
import { formatAveragedStat } from '@/state/presenters/stat-format';
import { PlayerPortraitImage } from '@/components/art/PlayerPortraitImage';
import { useGameState, useGameStore } from '@/state/GameStoreProvider';
import {
    COMBAT_TUTORIAL_FLAG, completeCombatTutorialAction,
    claimCombatRewardAction, resetCombatRewardAction, rollCombatRewardAction,
} from '@/state/combat/store-actions';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

type DropResolver = (payload: DragPayload, x: number, y: number) => void | Promise<void>;

/** Stable empty-offers reference — a fresh `[]` in the selector would make the
 *  store subscription report a change on every render. */
const EMPTY_OFFERS: readonly string[] = Object.freeze([]);

/** Rendered size of the dragged-die ghost chip — the die ghost anchors on HALF
 *  of its rendered FOOTPRINT (cube + shadow, not the bare size) so it tracks
 *  the pointer (see dieGhostStyle). */
const DIE_GHOST_SIZE = 49;
const DIE_GHOST_FOOT = combatDieFootprint(DIE_GHOST_SIZE);

/** WI-3 — how long an END-phase press locks the button + staging while the
 *  threat resolves and its fx timeline plays out (IMPACT 100ms + the longest
 *  resolution animation ~880ms in CombatCombatantPane, with headroom). The lock
 *  exists only to swallow machine-gun double-taps; a legitimately new end-phase
 *  after the state has fully advanced is always ~1s away. */
const RESOLVE_LOCK_MS = 1100;

/** WI-7 — if a live drag goes this long with no pointer movement, its input
 *  stream is assumed dead (a killed/interrupted pointer that never delivered an
 *  end event) and the drag is force-finalized so it can't wedge staging or leave
 *  a permanent ghost. Every `pointermove` resets the clock, so a slow-but-live
 *  drag is never cut short. */
const DRAG_WATCHDOG_MS = 4000;

export interface CombatEncounterPanelProps {
    /** The foe to fight (live: the real map encounter enemy; dev: a mock). */
    enemy: Enemy;
    /** Player snapshot used to initialise the encounter (deck derives from knownCards). */
    bootstrapPlayer: Character;
    /** Optional explicit deck (engine derives one from knownCards when omitted). */
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
    /**
     * Retreat, offered on the reveal screen only (before a die is rolled).
     * This is where the retired encounter-prelude modal's FLEE now lives — the
     * reveal IS the commit gate, so the choice belongs beside ENTER COMBAT.
     * Omitted (dev sandbox, boss encounters) = no retreat is offered.
     */
    onWithdraw?: () => void;
    /** Fired once when the player dismisses the terminal summary. */
    onExit: (outcome: CombatOutcome | null) => void;
    /** The live map region (`vm.region` from the exploration screen), keying
     *  the arena backdrop plate (phase 83). The dev-only sandbox route omits
     *  it and gets the fallback plate, same as any unmapped region. */
    region?: string;
}

type StoreLike = ReturnType<typeof useGameStore>;

/** Spec 32 v3 §9 — the merciful resolutions. Befriend (mercy), RELENT
 *  (PLEA ≥ enemy VITAE) and CONDEMN (the 8-Charge Sentence) all reward like
 *  mercy: XP flows, no corpse loot. */
function isMercifulWin(outcome: CombatOutcome): boolean {
    return outcome === 'mercy' || outcome === 'capitulate' || outcome === 'concede';
}

/**
 * Phase 54 — translate the hazard-pattern engine's 6-way `CombatOutcome`
 * into the vocabulary `game.reducer.ts`'s `END_COMBAT` case understands.
 * The merciful wins (mercy / capitulate / concede — "won without killing")
 * map onto the legacy engine's `'friendship'` outcome, which is exactly the
 * "spared the foe" branch already-authored `Enemy.friendshipReward` data
 * targets. `'retreat'` is dead (`combat.encounter.types.ts` — no in-combat
 * retreat exists) and maps to `'flee'` only so this function stays total.
 */
function mapHazardOutcomeToEndCombat(
    outcome: CombatOutcome,
): 'victory' | 'defeat' | 'friendship' | 'flee' {
    if (outcome === 'victory') return 'victory';
    if (outcome === 'defeat') return 'defeat';
    if (isMercifulWin(outcome)) return 'friendship';
    return 'flee';
}

/**
 * Write-back for a finished hazard encounter. Handles only what has no
 * engine equivalent — the GHOST-die pool (spec 32 v3 §5, forged dice persist
 * across combats until spent), Phase 32 part 1b's banked Harvest Souls
 * (`player.bankedSouls` accumulates `finalState.souls`, "the jar travels"
 * regardless of how the fight ended), and final HP (persists for every
 * outcome except defeat — the host's run-reset full-heals there) — then
 * (Phase 54) dispatches the real `game.reducer.ts` `endCombat` for
 * everything else: XP, loot, quest kill-objective advancement + completion
 * rewards, and — on a merciful win — the authored `friendshipReward`
 * payload (flags, codex unlock, alignment shift, faction deltas,
 * moral-meter). `endCombat` reads its own `Enemy` off the `currentEncounter`
 * `beginHazardEncounter` staged via `startCombat`, so no `finalPlayer` is
 * passed here — the write-back below already lands HP/floatingDice/
 * bankedSouls on `state.player` first, and `endCombat` builds its grant on
 * top of that already-current root player. The deckbuilder card is handled
 * separately (rolled into the store on victory, claimed via
 * `claimCombatRewardAction`).
 */
export function applyHazardOutcome(
    store: StoreLike,
    outcome: CombatOutcome,
    finalState: CombatEncounterState,
    enemy: Enemy,
): void {
    const finalHp = finalState.player.health;
    // Spec 32 v3 §5 — the surviving floating dice, in engine truth (spent dice
    // are gone forever; unspent ones arrive in the next battle's opening tray).
    const floatingDice = getFloatingDiceColors(finalState);
    // Phase 32 part 1b — whatever Souls the fight ended with, unspent, banks
    // permanently; a combat that never generated Souls contributes 0.
    const soulsRemaining = finalState.souls ?? 0;
    store.setState((s) => {
        if (!s.player) return {};
        let player: Character = {
            ...s.player,
            floatingDice,
            bankedSouls: (s.player.bankedSouls ?? 0) + soulsRemaining,
        };
        if (outcome !== 'defeat') {
            player = { ...player, health: Math.max(0, Math.min(finalHp, player.maxHealth)) };
        }
        return { player };
    });
    // Phase 54 — resolve the staged encounter through the engine's real
    // endCombat reducer: XP, loot, quest kill-objective advancement +
    // completion rewards, and (on 'friendship') flags/codex/alignment/
    // faction/moral-meter, all read off Enemy.xpReward / .loot /
    // .friendshipReward / .journalEntry via state.currentEncounter.
    store.getState().endCombat(mapHazardOutcomeToEndCombat(outcome));
    // Cascade level-ups through the engine store (applyLevelUps isn't exported,
    // so the LEVEL_UP reducer is the only public path). applyLevelUps already
    // loops internally; the guarded while-loop is belt-and-braces. Runs after
    // endCombat since that's what actually grants the XP now.
    if (outcome === 'victory' || isMercifulWin(outcome)) {
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
// 2026-07-12 (owner directive) — the panel carries PAYLOAD keywords only, so
// a persistent card's first chip is its passive's keyword: it tags EFFECT,
// never the type word (ENCHANT/CURSE read on the card frame's type strip).
function keywordTypeTag(kind: string, index: number): string {
    if (index > 0) return 'EFFECT';
    switch (kind) {
        case 'dot': return 'DOT';
        case 'stun':
        case 'weaken': return 'CONTROL';
        case 'guard': return 'GUARD';
        case 'regen': return 'REGEN';
        case 'befriend': return 'MERCY';
        case 'forge': return 'DICE';
        default: return 'EFFECT';
    }
}

// Reference-style coloured type tags (right-aligned on the keyword panels).
const TAG_COLORS: Record<string, string> = {
    DOT: '#e2543b', CONTROL: '#a86bdc', GUARD: '#9aa0a6', REGEN: '#5bbf6a',
    MERCY: '#5bbf6a', ENCHANT: '#7fb3a6', CURSE: '#a86bdc', EFFECT: '#8a8273',
    DICE: '#d9c66a',
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
    onWithdraw,
    onExit,
    region,
}: CombatEncounterPanelProps) {
    const styles = useStyles();
    const AXM = usePalette();
    const { width: screenW } = useWindowDimensions();
    // Hero card width in the inspect modal (reference: the card IS the screen) —
    // sized so keyword panels + the full card fit a ~844pt viewport together.
    const detailCardW = Math.min(264, screenW - 116);
    const player = useGameState((s) => s.player);
    const store = useGameStore();
    // The live reward draft (store-owned so it survives a panel remount).
    const rewardOffers = useGameState((s) => s.combatReward?.offers ?? EMPTY_OFFERS);
    const rewardsClaimed = useGameState((s) => s.combatReward?.claimed ?? false);

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
    /**
     * Which threat phases are expanded in the pre-combat reveal (owner directive
     * 2026-09-13: "the enemy phases should be an accordion — we don't need to
     * show them all by default").
     *
     * Holds the 1-based `phase.index` of every OPEN row. Seeded with `1` so the
     * imminent phase — the only one that can hurt you this turn — is still read
     * at a glance, while the rest of the sequence collapses to its headers.
     */
    const [openThreatPhases, setOpenThreatPhases] = useState<ReadonlySet<number>>(
        () => new Set([1]),
    );
    /** Toggle one threat phase row open/closed by its 1-based phase index. */
    const toggleThreatPhase = useCallback((phaseIndex: number) => {
        setOpenThreatPhases((prev) => {
            const next = new Set(prev);
            if (next.has(phaseIndex)) next.delete(phaseIndex);
            else next.add(phaseIndex);
            return next;
        });
    }, []);
    // Phase 50 — a tapped Seal chip's CRACK/WAIT confirm sheet (mirrors the
    // PLEA/mercy modal pattern per Phase 49 decision 2).
    const [sealConfirm, setSealConfirm] = useState<CombatSealVM | null>(null);
    // Signature-rune info popup (long-press / unaffordable tap) + pilgrim modal.
    const [sigInfo, setSigInfo] = useState<CombatSignatureVM | null>(null);
    const [pilgrimOpen, setPilgrimOpen] = useState(false);
    // phase 28 — REPRISE songbook picker: set by CombatBoard's onReprisalNeeded
    // when a staged reprise-mechanic card is APPLYd with a non-empty discard.
    // The prompt HOLDS the deferred play (including the WS7.2 chosen X) — the
    // board committed nothing yet, so dismissing the prompt is a clean cancel.
    const [reprisalPrompt, setReprisalPrompt] = useState<{ uid: string; dieId: string | null; power: boolean; chosenX?: number } | null>(null);
    // Deckbuilder reward (Spec 26b §C) — rolled once on victory, claimed before
    // the summary. The offer lives in the STORE, not here: panel-local state
    // meant navigating away mid-draft silently threw away an earned reward.
    const wroteBackRef = useRef(false);
    const exitedRef = useRef(false);
    // Resolution-feedback bridge: the latest resolved engine events + a rising seq.
    // The events are stashed in a ref (set inside the state updater) and surfaced
    // to the board via a bumped seq, so the pane animates exactly once per resolve.
    const fxRef = useRef<CombatEvent[]>([]);
    const [fxSeq, setFxSeq] = useState(0);
    // WI-3 — END-phase in-flight guard. `resolvingRef` is the synchronous gate
    // (checked before any dispatch, so machine-gun taps in the same frame are
    // dropped); `resolving` is the render-visible mirror that dims/disables the
    // button and suppresses staging/apply until the resolution + its fx timeline
    // settle.
    const resolvingRef = useRef(false);
    const [resolving, setResolving] = useState(false);
    const resolveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const endResolving = useCallback(() => {
        resolvingRef.current = false;
        setResolving(false);
    }, []);
    useEffect(() => () => { if (resolveTimer.current) clearTimeout(resolveTimer.current); }, []);


    // Bootstrap the encounter ONCE — combat must not restart when the store
    // player mutates (e.g. our own write-back) or props re-identify.
    // Real encounters run unseeded (`seed` only arrives from sims/tests); stamp
    // a random one so seed-keyed presentation (the enemy-art pick) reshuffles
    // per encounter. Nothing engine-side reads `state.seed` after init.
    const initial = useMemo(
        () => {
            const s = initializeCombatEncounter(bootstrapPlayer, enemy, deck, seed);
            const stamped = s.seed === undefined ? { ...s, seed: Math.floor(Math.random() * 0xffffffff) } : s;
            // AXM Log: thin mount marker only — the engine's `withLog` tap
            // already mirrors every CombatEvent this encounter produces.
            try {
                getLogger().info('combat', 'encounter-mounted', {
                    enemy: enemy.name, seed: stamped.seed,
                });
            } catch { /* logging never breaks play */ }
            return stamped;
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    const live = state ?? initial;
    const vm = useMemo(() => buildCombatViewModel(live), [live]);

    // ── momentum wheel (Phase 31 — engine-native; see combat.engine.ts's
    // `advanceMomentumWheel`) — `vm.momentum` is read straight off engine
    // state, no panel-owned wheel state or grant logic left here. ──
    const [momentumInfoOpen, setMomentumInfoOpen] = useState(false);

    // Playtest fix 2026-09-04 — the persistent combat log. `topInset` mirrors
    // CombatBoard's own null-safe read of the same context (no SafeAreaProvider
    // in tests) so the toggle sits directly under the HUD. The history is
    // cheap (capped at 200 lines) and only walked off `live`, so recomputing
    // every render is fine.
    const insets = useContext(SafeAreaInsetsContext);
    const topInset = insets?.top ?? 0;
    // Bug fix 2026-09-09 — the LOG toggle and the tutorial coach both used to
    // anchor off the static `COMBAT_HUD_HEIGHT` estimate; a full stance-check
    // telegraph plus an active alt-win meter grows the real HUD past it, and
    // the LOG toggle's near-opaque pill painted over the telegraph's tail
    // line. `CombatBoard`'s `onHudLayout` reports the HUD's real measured
    // height on every layout pass; both siblings now anchor off that once it
    // lands, falling back to the estimate until then.
    const [hudBottom, setHudBottom] = useState(0);
    const hudAnchor = hudBottom > 0 ? hudBottom : topInset + COMBAT_HUD_HEIGHT;
    const [logOpen, setLogOpen] = useState(false);
    const logHistory = useMemo(() => selectCombatLogHistory(live), [live]);
    const logScrollRef = useRef<ScrollView | null>(null);

    // ── screen-level drag controller (cards + dice) ──
    // dragX/dragY are written straight from the board's gesture worklets every
    // frame (see DragController.x/y) — the JS thread only sees begin and end.
    const [dragActive, setDragActive] = useState<DragPayload | null>(null);
    const dragRef = useRef<DragPayload | null>(null);
    const dragX = useSharedValue(0);
    const dragY = useSharedValue(0);
    const dragShown = useSharedValue(0);
    // Drop-INELIGIBLE staged-card rects for the die drag in flight (measured
    // once by the board at drag begin) — drives the ghost's ✕ cue per frame
    // on the UI thread, no JS round-trips.
    const badRects = useSharedValue<Rect[]>([]);
    const begin = useCallback((payload: DragPayload, x: number, y: number) => {
        // NOTE: dragShown is NOT set here. The ghost keeps the PREVIOUS drag's
        // payload until React commits `dragActive`, so showing it synchronously
        // flashed the last-dragged card's face for a frame when a DIE drag began
        // (the "die looks like a card" bug). The effect below reveals it on the
        // commit that carries the right payload.
        dragRef.current = payload; dragX.value = x; dragY.value = y; setDragActive(payload);
    }, [dragX, dragY]);
    useEffect(() => {
        if (dragActive) dragShown.value = 1;
    }, [dragActive, dragShown]);
    const drag: DragController = useMemo(() => ({ begin, end: () => undefined, active: dragActive, x: dragX, y: dragY, badRects }), [begin, dragActive, dragX, dragY, badRects]);
    const end = useCallback((x: number, y: number) => {
        const payload = dragRef.current; dragRef.current = null; dragShown.value = 0; setDragActive(null);
        if (!payload) return;
        const resolver = (drag as DragController & { resolveDrop?: DropResolver }).resolveDrop;
        if (resolver) void resolver(payload, x, y);
    }, [drag, dragShown]);
    drag.end = end;
    // WI-7 — force-finalize a live drag whose pointer stream was interrupted
    // (pointercancel / blur / tab hidden / dead stream) so it can't leave a
    // permanent ghost or wedge staging. The finalizer is the SAME snap-home path
    // the cancel branch uses (`end(-1,-1)`).
    const finalizeDrag = useCallback(() => end(-1, -1), [end]);
    useDragInterruptRecovery(!!dragActive, finalizeDrag, DRAG_WATCHDOG_MS);
    // Centre the hand-card face under the finger (half of HAND_CARD_W/H)
    // and lift it above the fingertip so the card stays readable mid-drag.
    const cardGhostStyle = useAnimatedStyle(() => ({ opacity: dragShown.value, transform: [{ translateX: dragX.value - HAND_CARD_W / 2 }, { translateY: dragY.value - HAND_CARD_H / 2 - 24 }, { scale: 1.1 }] }));
    // The DIE ghost is a small chip, not a card: it must anchor at ITS OWN
    // half-size so the die stays centred under the pointer for the whole drag.
    // CONSTRAINT: never reuse the card's half-W/H anchor for the die — that was
    // the "die renders up-and-left of the finger" bug (playtest, 2026-07-11).
    const dieGhostStyle = useAnimatedStyle(() => ({ opacity: dragShown.value, transform: [{ translateX: dragX.value - DIE_GHOST_FOOT.width / 2 }, { translateY: dragY.value - DIE_GHOST_FOOT.height / 2 }, { scale: 1.1 }] }));
    // Ineligible-target cue (owner directive 2026-07-12): while the pointer is
    // over ANY illegal drop target (an off-color or already-armed staged card,
    // rects measured by the board at drag begin), the ghost carries an ✕ —
    // "this die can't land here", said before the drop.
    const dieGhostXStyle = useAnimatedStyle(() => {
        const x = dragX.value;
        const y = dragY.value;
        const over = badRects.value.some((r) =>
            x >= r.x - 16 && x <= r.x + r.width + 16 && y >= r.y - 16 && y <= r.y + r.height + 16);
        return { opacity: dragShown.value > 0 && over ? 1 : 0 };
    });

    // ── engine wiring ──
    const apply = useCallback((fn: (s: CombatEncounterState) => CombatEncounterState) => {
        setState((prev) => { const s = prev ?? initial; return fn(s); });
    }, [initial]);

    const unstageUid = useCallback((uid: string) => setStagedUids((prev) => prev.filter((u) => u !== uid)), []);
    const onEnter = useCallback(() => apply((s) => rollEncounterDice(s).state), [apply]);
    const onStage = useCallback((uid: string) => {
        if (resolvingRef.current) return; // WI-3 — no staging mid-resolution
        setStagedUids((prev) => (prev.includes(uid) ? prev : [...prev, uid]));
    }, []);
    const onUnstage = useCallback((uid: string) => unstageUid(uid), [unstageUid]);
    // APPLY one staged card (hazard model — the die is OPTIONAL). `power` true →
    // draft the dragged die (unless one is already drafted, the combo case) + power
    // the card (bottom action); `power` false → the FREE base action (top action,
    // no die). One commit; the card leaves staging.
    // Fate Engine P1 R3, recut 2026-07-18 (owner) — the spare/bank toggle chip
    // is GONE from the tray: the spare die always burns for +1◆ (the default).
    // The Reserve still fills through cards (KINDLE / bank_spent_die).
    // R4 — the universal fate tap: advance the strongest enemy DoT when one is
    // ticking, else bank +1 Conviction. Once per turn (engine-gated).
    const onFateTap = useCallback((dieId: string) => {
        apply((s) => {
            const choice = getPendingDotTotal(s.enemy, s.round).total > 0 ? 'dot-tick' as const : 'conviction' as const;
            const t = tapFateDie(s, dieId, choice);
            fxRef.current = t.events;
            return t.state;
        });
        setFxSeq((n) => n + 1);
    }, [apply]);
    // THE STAKE (Phase 31/EA-7) is retired everywhere (owner call 2026-07-18)
    // — no wager wiring; the board no longer renders the chip on any surface.
    // Per-play choices threaded to `playCombatCard`: WS7.2 `chosenX` (the
    // X-cost stepper's pick) and phase 28 `reprisalCardId` (the REPRISE
    // songbook discard-pile pick — omitted/skipped falls back to the engine's
    // pre-existing highest-rank auto-pick).
    const onApply = useCallback((uid: string, dieId: string | null, power: boolean, choices?: { chosenX?: number; reprisalCardId?: string }) => {
        if (resolvingRef.current) return; // WI-3 — a drag must not land mid-resolution
        apply((s) => {
            let ns = s;
            // Fate Engine P1 R8 — the dragged die is HONORED: a banked Reserve die
            // (or, for fate cards, a dead X die) powers the play directly; a fresh
            // tray die drafts first (bank-or-burn applies to the spare die).
            // Spec 32 v3 §5 — a Reserve / fate-X / GHOST die is its own power
            // source (explicit dieId, never drafted); a fresh tray die drafts
            // first. Routing extracted to `resolveApplyRouting` (tested).
            const routing = resolveApplyRouting(s, dieId);
            if (power && routing.draftFirst && dieId) {
                ns = draftStanceDie(ns, dieId, { bankUnpicked: false }).state;
            }
            // WS7.2 chosenX + phase 28 reprisalCardId ride through to the
            // engine (which clamps X to [min, affordable] and validates the
            // reprisal pick against the live discard pile). Phase 31 — the
            // engine's `playCombatCard` also advances the momentum wheel and
            // grants its die internally now; the panel no longer does either.
            const t = playCombatCard(
                ns, { uid }, power, routing.explicitDieId, undefined,
                choices && (choices.chosenX !== undefined || choices.reprisalCardId !== undefined)
                    ? choices
                    : undefined,
            );
            fxRef.current = t.events;
            ns = t.state;
            return ns;
        });
        setFxSeq((n) => n + 1);
        unstageUid(uid);
    }, [apply, unstageUid]);
    // phase 28 — opens the songbook picker instead of applying immediately.
    // `chosenX` (WS7.2) rides the prompt so the deferred play still resolves
    // at the stepper's pick, not the printed min.
    const onReprisalNeeded = useCallback((uid: string, dieId: string | null, power: boolean, chosenX?: number) => {
        setReprisalPrompt({ uid, dieId, power, chosenX });
    }, []);
    // A tap on a discard entry commits that choice; `null` (the skip row)
    // omits it — falls back to the engine's highest-rank auto-pick.
    const onReprisalPick = useCallback((cardId: string | null) => {
        if (!reprisalPrompt) return;
        const { uid, dieId, power, chosenX } = reprisalPrompt;
        setReprisalPrompt(null);
        const choices = {
            ...(chosenX !== undefined ? { chosenX } : {}),
            ...(cardId ? { reprisalCardId: cardId } : {}),
        };
        onApply(uid, dieId, power, chosenX !== undefined || cardId ? choices : undefined);
    }, [reprisalPrompt, onApply]);
    // Backdrop tap = CANCEL, not commit (every other backdrop in this panel
    // dismisses without action). The board held the play — nothing reached
    // the engine — so dropping the prompt restores the exact pre-APPLY
    // staging: card still staged, pending die and chosen X intact. Auto-pick
    // stays available as the explicit skip row.
    const onReprisalCancel = useCallback(() => setReprisalPrompt(null), []);
    const onDiscard = useCallback((uid: string) => { apply((s) => discardCombatCard(s, uid).state); unstageUid(uid); }, [apply, unstageUid]);
    const onSignature = useCallback((id: string) => apply((s) => playSignatureSkill(s, id).state), [apply]);
    // Phase 50 — tap a Seal chip -> open the confirm sheet; CRACK commits
    // `crackGlyph` (dieless, mirrors onSignature's shape); WAIT just closes.
    const onSeal = useCallback((s: CombatSealVM) => setSealConfirm(s), []);
    const onCrackSeal = useCallback(() => {
        if (!sealConfirm) return;
        apply((s) => crackGlyph(s, sealConfirm.id).state);
        setSealConfirm(null);
    }, [apply, sealConfirm]);
    const onEndPhase = useCallback(() => {
        // WI-3 — the synchronous gate: a second tap in the same frame (touch
        // double-tap) finds the lock already held and is dropped, so exactly one
        // threat phase resolves per intent.
        if (resolvingRef.current) return;
        resolvingRef.current = true;
        setResolving(true);
        apply((s) => {
            // Fate Engine P1 R2 — close the turn BEFORE the phase resolves: an
            // unspent (still-available, non-X) drafted die BANKS to the Reserve
            // when a slot is free, else burns for Conviction (`endTurn`,
            // combat.engine.ts). The panel used to skip straight to
            // `resolveThreatPhase`, whose boundary just WIPES the tray — the
            // sim path (`ensureDraftForCard`) always ran `endTurn`, so mobile
            // silently lost the banked die the engine's R2 promises.
            // END-TURN BREADCRUMBS. The owner's repeat crash report is "the
            // app closes when I end my turn", and it is a NATIVE process
            // death (EAS preview APK) that no web harness reproduces — so
            // nothing survives it except what was already logged. These four
            // lines ride into Sentry as breadcrumbs (lib/monitoring.ts) and
            // into the on-device crash tail, so the LAST one recorded names
            // the step that died. Cheap: four entries per turn, not a hot loop.
            const log = getLogger();
            log.info('combat', 'end-phase:begin', {
                turn: s.turn, round: s.round, phaseIndex: s.currentPhaseIndex,
                dice: s.dice.length, reserve: (s.reserve ?? []).length, hand: s.hand.length,
            });
            const ended = endTurn(s);
            log.info('combat', 'end-phase:turn-closed', { banked: (ended.state.reserve ?? []).length });
            const t = resolveThreatPhase(ended.state);
            log.info('combat', 'end-phase:threat-resolved', {
                phase: t.state.phase, outcome: t.state.finalOutcome ?? null, events: t.events.length,
            });
            fxRef.current = [...ended.events, ...t.events];
            let ns = t.state;
            if (ns.phase === 'phase-play' && ns.dice.length === 0) ns = startTurn(ns).state;
            log.info('combat', 'end-phase:tray-rolled', { turn: ns.turn, dice: ns.dice.length });
            return ns;
        });
        setFxSeq((n) => n + 1);
        setStagedUids([]);
        // Release the lock once the resolution + its fx timeline have played out.
        if (resolveTimer.current) clearTimeout(resolveTimer.current);
        resolveTimer.current = setTimeout(endResolving, RESOLVE_LOCK_MS);
    }, [apply, endResolving]);
    const onMercy = useCallback((choice: 'spare' | 'exploit') => apply((s) => selectEncounterMercyChoice(s, choice).state), [apply]);
    const onCapitulation = useCallback((choice: 'accept' | 'continue') => apply((s) => selectCapitulationChoice(s, choice).state), [apply]);
    // Stable resolution-feedback payload — recomputed only when a new resolve bumps
    // the seq (captures the events stashed in fxRef just before).
    const fx = useMemo<CombatFx>(() => ({ seq: fxSeq, events: fxRef.current }), [fxSeq]);

    // The enemy's turn, shown back as a card for a beat (user report 2026-08-10:
    // "show the card so the player knows what happened on the enemy's turn").
    // Driven off the SAME resolved-event bump the pane's floats ride, and keyed
    // by that seq so a repeated action still replays. `null` on every bump that
    // carried no threat resolution — a card APPLY is the player's turn, not the
    // foe's. The seq ref makes this exactly-once-per-resolve even though `live`
    // is a dep (the selector needs the post-resolution threat sequence).
    const [enemyAction, setEnemyAction] = useState<{ key: number; vm: EnemyActionCardVM } | null>(null);
    const lastCardSeq = useRef(0);
    useEffect(() => {
        if (fx.seq === 0 || fx.seq === lastCardSeq.current) return;
        lastCardSeq.current = fx.seq;
        const card = selectEnemyActionCard(fx.events, live);
        setEnemyAction(card ? { key: fx.seq, vm: card } : null);
    }, [fx, live]);
    const onEnemyActionDone = useCallback(() => setEnemyAction(null), []);

    const handleExit = useCallback(() => {
        if (exitedRef.current) return;
        exitedRef.current = true;
        // Clear the draft slate for the NEXT encounter. Deliberately here and
        // not on mount: the store slice has to outlive a panel remount, or it
        // would drop the offer exactly when it is meant to preserve it.
        resetCombatRewardAction(store);
        try {
            getLogger().info('combat', 'encounter-exited', {
                outcome: live.finalOutcome ?? null,
            });
        } catch { /* logging never breaks play */ }
        onExit(live.finalOutcome ?? null);
    }, [onExit, live.finalOutcome, store]);

    // Economy write-back — fires once, the instant combat reaches a terminal
    // outcome (so spoils land even if the player lingers on the summary).
    useEffect(() => {
        if (!live.finalOutcome || wroteBackRef.current) return;
        wroteBackRef.current = true;
        if (persistOutcome) applyHazardOutcome(store, live.finalOutcome, live, enemy);
    }, [live.finalOutcome, live, persistOutcome, store, enemy]);

    // Roll the deckbuilder reward once, on victory. The roll is engine truth
    // (theme-aware: weighted toward what the deck already plays, with a real
    // off-theme pivot); the action is idempotent, so a remount re-reads the
    // SAME offer rather than rerolling it.
    useEffect(() => {
        if (live.finalOutcome === 'victory') rollCombatRewardAction(store);
    }, [live.finalOutcome, store]);

    // Tutorial completes itself once the turn-one coach script is exhausted.
    useEffect(() => {
        if (tutorialActive && primerDone && vm && live.phase !== 'reveal'
            && currentCombatTutorialStep(live, vm, { stagedCount: stagedUids.length }) === -1) {
            finishTutorial(false);
        }
    }, [tutorialActive, primerDone, live, vm, stagedUids.length, finishTutorial]);

    // Claim (or skip) — the action appends the card AND persists, so the pick
    // no longer waits on some unrelated save() to happen along.
    const onRewardPick = useCallback((cardId: string | null) => {
        claimCombatRewardAction(store, cardId);
    }, [store]);

    // Identity-stable board props: inline arrows / fresh objects here defeat
    // CombatBoard's React.memo and re-render the whole 1200-line board on every
    // unrelated panel state change (tooltips, fx bumps) — felt as drag jank.
    const onInspect = useCallback((c: CombatCardVM) => { detailOpenedAt.current = Date.now(); setDetailCard(c); }, []);
    /**
     * Dismiss the card detail overlay. Shared by the backdrop, the card body,
     * and the scrolled content so a tap ANYWHERE exits (owner directive
     * 2026-09-13). The 350ms guard swallows the tail of the press that OPENED
     * the overlay, which would otherwise close it on the same gesture.
     */
    const closeCardDetail = useCallback(() => {
        if (Date.now() - detailOpenedAt.current > 350) setDetailCard(null);
    }, []);
    const onPlayerInspect = useCallback(() => setPilgrimOpen(true), []);
    const onMomentumInfo = useCallback(() => setMomentumInfoOpen(true), []);
    const momentum = vm.momentum;

    // Ghost stays MOUNTED once the first drag begins (opacity-gated by dragShown):
    // remounting the face + image on every drag begin cost a mount + decode while
    // the finger was already moving — the start-of-drag stutter.
    const lastDragRef = useRef<DragPayload | null>(null);
    if (dragActive) lastDragRef.current = dragActive;
    const ghostPayload = dragActive ?? lastDragRef.current;

    if (!vm) {
        return <View style={styles.root} testID="combat-encounter-empty" />;
    }

    const summary = live.finalOutcome ? buildCombatSummary(live) : null;
    const capitulation = live.phase === 'mercy-choice' && !!live.capitulationChoiceActive && !live.finalOutcome;
    const mercy = live.phase === 'mercy-choice' && !live.capitulationChoiceActive && !live.finalOutcome;
    const showReveal = live.phase === 'reveal';
    // Playtest fix 2026-09-04 — the log toggle/sheet never shows over the
    // reveal (nothing has happened yet) or once the fight is over (the
    // summary owns that screen).
    const logAvailable = !showReveal && !live.finalOutcome;

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
                    resolving={resolving}
                    onInspect={onInspect}
                    onChip={setTipEffect}
                    onSeal={onSeal}
                    onSignatureInfo={setSigInfo}
                    onPlayerInspect={onPlayerInspect}
                    momentum={momentum}
                    onMomentumInfo={onMomentumInfo}
                    fx={fx}
                    onFateTap={onFateTap}
                    onReprisalNeeded={onReprisalNeeded}
                    onHudLayout={setHudBottom}
                    region={region}
                />
            )}

            {/* CombatRevealOverlay (Spec 26 §7) — read the foe before you commit */}
            {showReveal && (
                <View style={styles.reveal} testID="combat-reveal">
                    <ScrollView contentContainerStyle={styles.revealScroll}>
                        <Text style={styles.revealEyebrow}>⚔ A FOE BARS THE WAY</Text>
                        <View style={[styles.revealPortrait, { borderColor: AXM.blood }]}>
                            <Image
                                source={getEncounterEnemyArt(vm.enemy.artKey, vm.enemy.artNonce)}
                                style={{ width: 120, height: 140 }}
                                contentFit="contain"
                                transition={0}
                                accessibilityLabel={vm.enemy.name}
                            />
                        </View>
                        <Text style={styles.revealName}>{vm.enemy.name}</Text>
                        <Text style={styles.revealHp}>♥ {vm.enemy.hp} / {vm.enemy.maxHp}</Text>
                        {/* FE-025: this screen is the commit gate for a fight, and it
                          * priced the fight entirely in the foe's numbers — its VITAE
                          * and five phases of damage aimed at me — while my own VITAE
                          * appeared nowhere. The one figure that decides whether to
                          * take the fight now or turn back was the missing one. */}
                        <Text style={styles.revealYours} testID="combat-reveal-player-vitae">
                            YOURS ♥ {vm.player.hp} / {vm.player.maxHp}
                        </Text>
                        {vm.enemy.stanceHint ? <Text style={styles.revealTell}>“{vm.enemy.stanceHint}”</Text> : null}
                        <Text style={styles.revealSection}>THREAT SEQUENCE — they telegraph WHAT, not their stance</Text>
                        {/* Playtest fix 2026-09-04 — no line clamp on the threat
                            text: a multi-clause phase ("Deals 12. Applies BLEED 2.
                            Gains HIDE 4.") was ellipsised mid-sentence on the one
                            screen whose whole job is to telegraph it. */}
                        {live.threatPhases.map((p, i) => {
                            const meta = INTENT_ICONS[p.intentType ?? 'pass'];
                            // Accordion row: the header (icon + PHASE n · INTENT +
                            // chevron) is always present and is the whole touch
                            // target; the threat text only mounts when open.
                            const open = openThreatPhases.has(p.index);
                            return (
                                <View key={i} style={styles.revealPhase}>
                                    <Pressable
                                        onPress={() => toggleThreatPhase(p.index)}
                                        accessibilityRole="button"
                                        accessibilityState={{ expanded: open }}
                                        accessibilityLabel={`Phase ${p.index}, ${meta.label}`}
                                        accessibilityHint={open ? 'tap to collapse this phase' : 'tap to read this phase'}
                                        testID={`combat-reveal-phase-${p.index}`}
                                        style={styles.revealPhaseHead}
                                    >
                                        <Text style={[styles.revealPhaseIcon, { color: meta.color }]}>{meta.icon}</Text>
                                        <Text style={[styles.revealPhaseLabel, styles.revealPhaseHeadLabel]}>
                                            PHASE {p.index} · {meta.label}
                                        </Text>
                                        <Text style={styles.revealPhaseChevron}>{open ? '▾' : '▸'}</Text>
                                    </Pressable>
                                    <View style={[styles.revealPhaseBody, open ? null : styles.revealPhaseBodyHidden]}>
                                        {open ? (p.branch ? (
                                            /* WS9 — a branch phase telegraphs its condition + BOTH
                                               outcomes before commit; the taken fork is marked after. */
                                            <View>
                                                <Text style={styles.revealBranchCond}>⑂ {p.branch.conditionText}</Text>
                                                <Text style={[styles.revealPhaseText, p.branch.taken === 'then' ? styles.revealBranchTaken : null]}>
                                                    {p.branch.taken === 'then' ? '▶ ' : ''}then: {p.branch.then.threatAction.description}
                                                </Text>
                                                <Text style={[styles.revealPhaseText, p.branch.taken === 'else' ? styles.revealBranchTaken : null]}>
                                                    {p.branch.taken === 'else' ? '▶ ' : ''}otherwise: {p.branch.else.threatAction.description}
                                                </Text>
                                            </View>
                                        ) : (
                                            <Text style={styles.revealPhaseText}>{p.threatAction.description}</Text>
                                        )) : null}
                                        {open && p.stanceHint ? <Text style={styles.revealPhaseTell}>🜲 stance hidden — {p.stanceHint}</Text> : null}
                                    </View>
                                </View>
                            );
                        })}
                        <Pressable onPress={onEnter} testID="combat-enter" accessibilityRole="button" accessibilityLabel="Enter combat and roll your first dice" style={[styles.revealBtn, { borderColor: AXM.sulfur }]}>
                            <Text style={[styles.revealBtnText, { color: AXM.sulfur }]}>ENTER COMBAT ›</Text>
                        </Pressable>
                        {/* The retreat, where the retired prelude modal's FLEE now
                            lives: the reveal is the commit gate, so the choice sits
                            beside the commit. Absent when retreat is sealed. */}
                        {onWithdraw && (
                            <Pressable
                                onPress={onWithdraw}
                                testID="combat-withdraw"
                                accessibilityRole="button"
                                accessibilityLabel="Withdraw from this encounter"
                                style={styles.withdrawBtn}
                            >
                                <Text style={[styles.withdrawBtnText, { color: AXM.bone }]}>WITHDRAW</Text>
                                <Text style={styles.withdrawSub}>forfeit the path · grace −2</Text>
                            </Pressable>
                        )}
                    </ScrollView>
                </View>
            )}

            {/* Playtest fix 2026-09-04 — the persistent combat log. Every beat
                used to be a floating token that vanished in ~1s; this toggle
                opens a scrollable, newest-at-the-bottom history of the whole
                fight. Pinned top-right, directly under the HUD (mirrors
                CombatTutorialCoach's own placement below the same HUD — both
                anchor off the measured `hudAnchor`, see above). */}
            {logAvailable && (
                <Pressable
                    onPress={() => setLogOpen(true)}
                    testID="combat-log-toggle"
                    accessibilityRole="button"
                    accessibilityLabel={COMBAT_LOG_TOGGLE_A11Y}
                    style={[styles.logToggle, { top: hudAnchor + 8 }]}
                >
                    <Text style={styles.logToggleText}>{COMBAT_LOG_TOGGLE_TEXT}</Text>
                </Pressable>
            )}
            {logAvailable && logOpen && (
                <View style={styles.logSheet} testID="combat-log">
                    <ScrollView
                        ref={logScrollRef}
                        style={styles.logScroll}
                        contentContainerStyle={styles.logScrollContent}
                        onContentSizeChange={() => logScrollRef.current?.scrollToEnd({ animated: false })}
                    >
                        {logHistory.map((entry) => (
                            <Text key={entry.id} style={[styles.logLine, { color: entry.color }]}>{entry.text}</Text>
                        ))}
                    </ScrollView>
                    <Pressable
                        onPress={() => setLogOpen(false)}
                        testID="combat-log-close"
                        accessibilityRole="button"
                        accessibilityLabel={COMBAT_LOG_CLOSE_A11Y}
                        hitSlop={10}
                        style={styles.logClose}
                    >
                        <Text style={styles.logCloseText}>✕</Text>
                    </Pressable>
                </View>
            )}

            {/* the foe's turn, named — rises over the board for a beat after END
                PHASE, then clears itself. Never over the reveal (nothing has
                resolved yet there). */}
            {enemyAction && !showReveal && (
                <EnemyActionCard
                    vm={enemyAction.vm}
                    enemyName={vm.enemy.name}
                    revealKey={enemyAction.key}
                    onDone={onEnemyActionDone}
                />
            )}

            {/* PLEA opens a yield; the player, not the threshold, authors the outcome. */}
            {capitulation && (
                <View style={styles.backdrop} testID="combat-capitulation">
                    <View style={[styles.modal, { borderColor: AXM.sulfur }]}>
                        <Text style={styles.modalTitle}>{live.enemy.name} yields.</Text>
                        <Text style={styles.modalSub}>Accept the yield, or continue the fight.</Text>
                        <View style={styles.modalBtns}>
                            <Pressable onPress={() => onCapitulation('accept')} testID="combat-capitulation-accept" accessibilityRole="button" accessibilityLabel="Accept the yield" style={[styles.modalBtn, { borderColor: '#5bbf6a' }]}><Text style={[styles.modalBtnText, { color: '#5bbf6a' }]}>ACCEPT</Text></Pressable>
                            <Pressable onPress={() => onCapitulation('continue')} testID="combat-capitulation-continue" accessibilityRole="button" accessibilityLabel="Continue fighting" style={[styles.modalBtn, { borderColor: AXM.blood }]}><Text style={[styles.modalBtnText, { color: AXM.blood }]}>CONTINUE</Text></Pressable>
                        </View>
                    </View>
                </View>
            )}

            {/* Phase 50 — Seal crack confirm sheet: reuses the PLEA/mercy centered-modal
                shape exactly (Phase 49 decision 2), plain View backdrop (no dismiss-by-tap)
                so the player's tap is the explicit CRACK/WAIT choice, not a stray dismiss. */}
            {sealConfirm && (
                <View style={styles.backdrop} testID="combat-seal-confirm">
                    <View style={[styles.modal, { borderColor: sealConfirm.color }]}>
                        <Text style={styles.modalTitle}>Crack the {sealConfirm.label}?</Text>
                        <Text style={styles.modalSub}>{sealConfirm.previewText} · {sealConfirm.charges}/{sealConfirm.cap} charges</Text>
                        <View style={styles.modalBtns}>
                            <Pressable onPress={onCrackSeal} testID="combat-seal-crack" accessibilityRole="button" accessibilityLabel={`Crack for ${sealConfirm.previewText}`} style={[styles.modalBtn, { borderColor: '#5bbf6a' }]}><Text style={[styles.modalBtnText, { color: '#5bbf6a' }]}>CRACK</Text></Pressable>
                            <Pressable onPress={() => setSealConfirm(null)} testID="combat-seal-wait" accessibilityRole="button" accessibilityLabel="Wait, don't crack yet" style={[styles.modalBtn, { borderColor: AXM.ash }]}><Text style={[styles.modalBtnText, { color: AXM.ash }]}>WAIT</Text></Pressable>
                        </View>
                    </View>
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
                <Pressable style={styles.backdrop} testID="combat-card-detail" onPress={closeCardDetail}>
                    {/* Owner directive 2026-09-13: a card detail screen exits on a
                        tap ANYWHERE — the card body no longer claims the touch via
                        `onStartShouldSetResponder`, and the scrolled content is
                        wrapped in its own Pressable so a tap landing on the prose
                        closes too. The ✕ stays as an explicit affordance. Scroll
                        gestures are unaffected: a drag never fires `onPress`. */}
                    <Pressable style={styles.detailModalWrap} onPress={closeCardDetail}>
                        <ScrollView
                            style={styles.detailScroll}
                            contentContainerStyle={styles.detailStack}
                        >
                            <Pressable onPress={closeCardDetail}>
                            {/* (1) keyword DEFINITIONS at the top — ONE compact ledger
                                (owner playtest 2026-07-18: five separate full-size boxes
                                buried the card they were explaining). Hairline-separated
                                rows, terse type. */}
                            {detailCard.detail.keywords.length > 0 && (
                                <View style={styles.detailKeywords}>
                                    {detailCard.detail.keywords.map((k, i) => {
                                        const tag = keywordTypeTag(detailCard.face.kind, i);
                                        return (
                                            <View key={k.name} style={[styles.detailKeywordRow, i > 0 ? styles.detailKeywordRowSep : null]}>
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

                            {/* (2) the LARGE rendered card over a stance-coloured radial halo.
                                The face is the glance read only (name · free glyph · KEYWORD ·
                                value) since the 2026-08-10 declutter — the sentence, the type
                                strip and the die triplet it used to carry are restated BELOW,
                                where the definitions already live. */}
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
                            {/* the card's own metadata strip — off the face since
                                2026-08-10, so it reads here instead. */}
                            <Text style={styles.detailMetaStrip} testID="combat-card-detail-meta">{detailCard.detail.metaChip}</Text>

                            {/* (3) the NO-DIE / +DIE fork — RESTORED 2026-08-10. It was retired
                                on 2026-07-16 because the face carried the free glyph, the paid
                                sentence and the printed die lines itself; now that the face is
                                bare, this is the only place a player can read what the card
                                actually does. Keywords bold out of the sentence and are defined
                                in the ledger at the top. */}
                            <View style={styles.detailPlays}>
                                <View style={styles.detailPlayRow}>
                                    <Text style={styles.detailPlayTag}>◇ NO DIE</Text>
                                    <Text style={styles.detailPlayText}>{detailCard.detail.freePill}</Text>
                                </View>
                                <View style={[styles.detailPlayRow, styles.detailPlayRowSep]}>
                                    <Text style={[styles.detailPlayTag, { color: detailCard.face.categoryColor }]}>◆ +DIE</Text>
                                    <View style={styles.detailPlayBody}>
                                        <OutcomeText
                                            text={detailCard.detail.diePaidLine ?? detailCard.detail.outcomeLine}
                                            names={detailCard.detail.keywords.map(k => k.name)}
                                            base={styles.detailPlayText}
                                            bold={[styles.detailPlayText, styles.detailPlayBold, { color: detailCard.face.categoryColor }]}
                                        />
                                        {detailCard.dieLines?.length ? (
                                            <Text style={styles.detailDieLine}>{detailCard.dieLines.join(' · ')}</Text>
                                        ) : null}
                                        {detailCard.detail.dieTriplet ? (
                                            <Text style={styles.detailDieLine}>{detailCard.detail.dieTriplet}</Text>
                                        ) : null}
                                    </View>
                                </View>
                            </View>
                            {detailCard.detail.stacksText ? <Text style={styles.detailStacks}>{detailCard.detail.stacksText}</Text> : null}
                            {detailCard.detail.readLegend ? <Text style={styles.detailLegend}>{detailCard.detail.readLegend}</Text> : null}
                            {detailCard.detail.durationFooter ? <Text style={styles.detailLegend}>{detailCard.detail.durationFooter}</Text> : null}
                            <Text style={styles.detailLegend}>{detailCard.detail.colorMatchHint}</Text>

                            {/* KW-7 (phase 29, re-scoped 2026-07-12) — system-term definitions
                                (Conviction, Resonance, Reserve/Pips, Floating, rungs, WILD/X):
                                ONLY the entries THIS card's printed lines reference, derived
                                per-card by the presenter (systemTermsForCard). The wholesale
                                six-entry dump made every inspect a scrolling wall (owner
                                playtest) — a card's inspect explains only what the card
                                actually uses, each term at most once. */}
                            {detailCard.detail.systemTerms.length > 0 && (
                                <View style={styles.systemsGlossary}>
                                    {detailCard.detail.systemTerms.map(s => (
                                        <Text key={s.term} style={styles.systemsGlossaryLine}>
                                            <Text style={styles.systemsGlossaryTerm}>{s.term}</Text>
                                            {' — ' + s.def}
                                        </Text>
                                    ))}
                                </View>
                            )}

                            {/* (4) FLAVOR — authored prose, overlay BOTTOM only (owner
                                directive 2026-07-09: the face stays purely functional). */}
                            {detailCard.flavor ? (
                                <Text style={styles.detailFlavor} testID="combat-card-detail-flavor">{detailCard.flavor}</Text>
                            ) : null}
                            </Pressable>
                        </ScrollView>

                    </Pressable>

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
                            {/* A standing enchant/curse chip has no intensity — it shows its
                                clock (or permanence) instead (card-wording audit 2026-07-12). */}
                            <Text style={styles.tipMeta}>
                                {tipEffect.standing
                                    ? (tipEffect.duration > 0 ? `${tipEffect.duration} rounds left` : 'rest of combat')
                                    : `intensity ${tipEffect.intensity} · ${tipEffect.duration} turns left`}
                            </Text>
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
                            consumes ◆ {sigInfo.cost} conviction{sigInfo.affordable ? '' : ` — ${sigInfo.reason ?? 'you have too little'}`}
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
                            Light all three and you forge a wild ✦ MOMENTUM die — drag it onto ANY card,
                            regardless of colour, to power it.
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

            {/* phase 28 — REPRISE songbook picker: choose which discarded card
                returns to hand (the engine's default is the highest-rank one).
                Backdrop = cancel (the play is still held, staged, uncommitted);
                the skip row is the explicit auto-pick. Rows/testIDs are keyed
                by INDEX-qualified id — the discard pile can hold duplicates. */}
            {reprisalPrompt && (
                <Pressable
                    style={styles.backdrop}
                    testID="combat-reprisal-picker"
                    accessibilityLabel="Cancel — keep the card staged, decide later"
                    onPress={onReprisalCancel}
                >
                    <View style={[styles.tipPlaque, { borderColor: `${AXM.sulfur}66` }]} onStartShouldSetResponder={() => true}>
                        <View style={[styles.tipCorner, styles.tipCornerTl, { borderColor: AXM.sulfur }]} pointerEvents="none" />
                        <View style={[styles.tipCorner, styles.tipCornerTr, { borderColor: AXM.sulfur }]} pointerEvents="none" />
                        <View style={[styles.tipCorner, styles.tipCornerBl, { borderColor: AXM.sulfur }]} pointerEvents="none" />
                        <View style={[styles.tipCorner, styles.tipCornerBr, { borderColor: AXM.sulfur }]} pointerEvents="none" />
                        <GlyphBurst color={AXM.sulfur} glyph="↺" />
                        <Text style={[styles.tipName, { color: AXM.sulfur, textShadowColor: AXM.sulfur }]}>REPRISE — CHOOSE</Text>
                        <Text style={styles.tipGloss}>Return one discarded card to your hand.</Text>
                        <View style={styles.reprisalList}>
                            {vm.discardCards.map((c, i) => (
                                <Pressable
                                    key={`${i}-${c.id}`}
                                    style={styles.reprisalRow}
                                    testID={`combat-reprisal-option-${i}-${c.id}`}
                                    onPress={() => onReprisalPick(c.id)}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Return ${c.name} to hand`}
                                >
                                    <Text style={styles.reprisalRowText}>{c.name}</Text>
                                </Pressable>
                            ))}
                            <Pressable
                                style={[styles.reprisalRow, styles.reprisalSkipRow]}
                                testID="combat-reprisal-skip"
                                onPress={() => onReprisalPick(null)}
                                accessibilityRole="button"
                                accessibilityLabel="Skip — the engine picks the highest-rank card"
                            >
                                <Text style={[styles.reprisalRowText, { color: AXM.bone }]}>skip · let it pick the best</Text>
                            </Pressable>
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
                    { label: 'PHYSICAL', color: STANCE_COLORS.body, atk: d.physicalAttack, def: d.physicalDefense, save: nc.physicalSave, test: nc.physicalTest },
                    { label: 'MENTAL', color: STANCE_COLORS.mind, atk: d.mentalAttack, def: d.mentalDefense, save: nc.mentalSave, test: nc.mentalTest },
                    { label: 'EMOTIONAL', color: STANCE_COLORS.heart, atk: d.emotionalAttack, def: d.emotionalDefense, save: nc.emotionalSave, test: nc.emotionalTest },
                ] as const;
                return (
                    <Pressable style={styles.backdrop} testID="combat-pilgrim-modal" onPress={() => setPilgrimOpen(false)}>
                        <View style={styles.pilgrimWrap} onStartShouldSetResponder={() => true}>
                            <ScrollView contentContainerStyle={styles.pilgrimStack} showsVerticalScrollIndicator={false}>
                                <View style={styles.pilgrimHead}>
                                    <View style={styles.pilgrimPortrait}><PlayerPortraitImage width={56} height={68} fit="cover" /></View>
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

                                {/* the FULL stat table — attack/defense + save/test per axis */}
                                <View style={styles.pilgrimGridHead}>
                                    <Text style={styles.pilgrimGridLabel} />
                                    {['ATK', 'DEF', 'SAVE', 'TEST'].map((h) => (
                                        <Text key={h} style={styles.pilgrimGridCol} allowFontScaling={false}>{h}</Text>
                                    ))}
                                </View>
                                {axes.map((a) => (
                                    <View key={a.label} style={styles.pilgrimGridRow}>
                                        <Text style={[styles.pilgrimGridLabel, { color: a.color }]} allowFontScaling={false}>{a.label}</Text>
                                        {[a.atk, a.def, a.save, a.test].map((v, i) => (
                                            <Text key={i} style={styles.pilgrimGridVal} allowFontScaling={false}>{v ?? 0}</Text>
                                        ))}
                                    </View>
                                ))}
                                <View style={styles.pilgrimMetaRow}>
                                    {/* FE-001: `derivedStats.luck` is an average, so it is
                                      * usually a float; print it through the shared formatter
                                      * so this chip and the SELF sheet agree and neither shows
                                      * a 17-digit tail. */}
                                    <Text style={styles.pilgrimMetaChip} allowFontScaling={false}>🍀 LUCK {formatAveragedStat(d.luck ?? 0)}</Text>
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
                <CombatRewardsOverlay offers={rewardCardVMs(rewardOffers)} onPick={onRewardPick} />
            )}

            {summary && (rewardsClaimed || live.finalOutcome !== 'victory') && (
                <CombatSummaryModal summary={summary} onClose={handleExit} />
            )}

            {/* first-fight tutorial — primer panels, then the turn-one coach */}
            {tutorialActive && !primerDone && (
                <CombatTutorialPrimer onBegin={() => setPrimerDone(true)} onSkip={() => finishTutorial(true)} />
            )}
            {tutorialActive && primerDone && !showReveal && !summary && !mercy && (
                <CombatTutorialCoach state={live} vm={vm} stagedCount={stagedUids.length} onSkip={() => finishTutorial(true)} hudBottom={hudAnchor} />
            )}

            {/* drag ghost — persistently mounted after the first drag; dragShown
                gates visibility so a finished drag leaves it hidden, not unmounted */}
            {ghostPayload && (
                // WI-7 — the ghost is a purely-visual clone that follows the
                // finger. It must carry its OWN testID and be hidden from
                // accessibility: without this it inherited the source node's
                // testID + aria, which surfaced DUPLICATE dice (two
                // `combat-die-*` nodes) and phantom "available to draft" entries
                // to screen readers.
                <Animated.View
                    pointerEvents="none"
                    testID="combat-drag-ghost"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={[styles.ghost, ghostPayload.type === 'card' ? cardGhostStyle : dieGhostStyle]}
                >
                    {ghostPayload.type === 'card' ? (
                        // The dragged card keeps its real face (was a stripped name-only box
                        // that looked like a different, "old" card mid-drag).
                        <CombatCardFace card={ghostPayload.card} width={HAND_CARD_W} height={HAND_CARD_H} />
                    ) : (
                        <>
                            <CombatDie die={ghostPayload.die} size={DIE_GHOST_SIZE} testID="combat-drag-ghost-die" />
                            {/* ✕ ineligible cue — lights while hovering an illegal target */}
                            <Animated.View style={[styles.ghostXBadge, dieGhostXStyle]} testID="combat-drag-ghost-x">
                                <Text style={styles.ghostXGlyph} allowFontScaling={false}>✕</Text>
                            </Animated.View>
                        </>
                    )}
                </Animated.View>
            )}
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: { flex: 1, width: '100%', height: '100%' },
    // Playtest fix 2026-09-04 — the persistent combat log toggle + sheet.
    logToggle: {
        position: 'absolute', right: 10, zIndex: 20,
        borderWidth: 1.5, borderColor: AXM.sulfur, backgroundColor: 'rgba(10,8,6,0.82)',
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4,
    },
    logToggleText: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.6, color: AXM.sulfur },
    logSheet: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 30,
        backgroundColor: 'rgba(4,3,6,0.93)', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 24,
    },
    logScroll: { flex: 1, borderWidth: 1, borderColor: AXM.ash, backgroundColor: AXM.panelBg },
    logScrollContent: { padding: 12, gap: 4 },
    logLine: { fontFamily: FONTS.mono, fontSize: 12, lineHeight: 17 },
    logClose: {
        alignSelf: 'center', marginTop: 14, width: 44, height: 44, borderRadius: 22,
        borderWidth: 2, borderColor: AXM.sulfur, backgroundColor: AXM.panelBg,
        alignItems: 'center', justifyContent: 'center',
    },
    logCloseText: { fontFamily: FONTS.sans, fontSize: 15, color: AXM.sulfur },
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
    detailKeywordHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2, gap: 8 },
    detailKeywordTag: { fontFamily: FONTS.sans, fontSize: 8.5, letterSpacing: 1.2, flexShrink: 0 },
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
    // 2026-08-10 declutter — everything the bare face no longer prints reads here.
    detailMetaStrip: { fontFamily: FONTS.sans, fontSize: 9, letterSpacing: 1.6, color: AXM.bone, opacity: 0.7, marginBottom: 8 },
    detailPlays: { alignSelf: 'stretch', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.65)', overflow: 'hidden' },
    detailPlayRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 10, paddingVertical: 7 },
    detailPlayRowSep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.14)' },
    detailPlayTag: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: AXM.bone, width: 58, flexShrink: 0 },
    detailPlayBody: { flex: 1 },
    detailPlayText: { fontFamily: FONTS.serif, fontSize: 12.5, color: AXM.parchment, lineHeight: 17, flex: 1 },
    detailPlayBold: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase' },
    detailDieLine: { fontFamily: FONTS.mono, fontSize: 10.5, color: AXM.sulfur, letterSpacing: 0.2, marginTop: 3 },
    detailLegend: { alignSelf: 'stretch', fontFamily: FONTS.sans, fontSize: 9.5, color: AXM.bone, opacity: 0.65, lineHeight: 14, marginTop: 6 },
    detailFreeBox: { alignSelf: 'stretch', marginBottom: 8 },
    detailFreeLine: { fontFamily: FONTS.serif, fontSize: 12.5, color: AXM.bone, lineHeight: 17, marginBottom: 5 },
    detailPowerLine: { fontFamily: FONTS.serif, fontSize: 12.5, lineHeight: 17, marginBottom: 5 },
    // KW-7 (phase 29) — systems glossary (Conviction/Resonance/Reserve+Pips/Floating/rungs/WILD-X).
    systemsGlossary: { alignSelf: 'stretch', marginTop: 6, marginBottom: 4, paddingTop: 6, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
    systemsGlossaryLine: { fontFamily: FONTS.sans, fontSize: 9.5, color: AXM.bone, opacity: 0.65, lineHeight: 15, marginBottom: 3 },
    systemsGlossaryTerm: { fontFamily: FONTS.sans, fontSize: 9.5, letterSpacing: 1, color: AXM.ash, opacity: 1 },
    detailFlavor: { alignSelf: 'stretch', fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 12, color: AXM.bone, opacity: 0.75, lineHeight: 17, marginTop: 10, textAlign: 'center' },
    detailReadNote: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 11, color: AXM.bone, lineHeight: 15 },
    detailLine: { fontFamily: FONTS.serif, fontSize: 13, color: AXM.parchment, lineHeight: 18 },
    // 2026-07-18 (owner playtest) — ONE compact ledger, not a box per keyword.
    detailKeywords: { alignSelf: 'stretch', marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.65)', overflow: 'hidden' },
    detailKeywordsHead: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 1.5, color: AXM.bone, opacity: 0.7, marginBottom: 7 },
    detailKeywordRow: { alignSelf: 'stretch', paddingHorizontal: 10, paddingVertical: 6 },
    detailKeywordRowSep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.14)' },
    detailKeywordName: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1.2, color: AXM.sulfur, flexShrink: 1 },
    detailKeywordDef: { fontFamily: FONTS.serif, fontSize: 11.5, color: AXM.parchment, lineHeight: 16 },
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
    // ── REPRISE songbook picker (phase 28) ──
    reprisalList: { width: '100%', marginTop: 14, gap: 6 },
    reprisalRow: {
        borderWidth: 1, borderColor: AXM.ash, borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    reprisalSkipRow: { borderStyle: 'dashed', marginTop: 4 },
    reprisalRowText: { fontFamily: FONTS.sans, fontSize: 13, color: AXM.parchment, textAlign: 'center' },
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
    // FE-025 — the player's side of the same trade, quieter than the foe's.
    revealYours: { fontFamily: FONTS.mono, fontSize: 12, color: AXM.bone, letterSpacing: 1, marginTop: 2 },
    revealTell: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 14, color: AXM.bone, textAlign: 'center', marginTop: 10, marginHorizontal: 10, lineHeight: 19 },
    revealSection: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.2, color: AXM.sulfur, marginTop: 20, marginBottom: 8, alignSelf: 'stretch' },
    revealPhase: { alignSelf: 'stretch', borderWidth: 1, borderColor: AXM.ash, backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 9, paddingVertical: 4, marginBottom: 7 },
    // Accordion header: the whole strip is the toggle, sized to a thumb.
    revealPhaseHead: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
    revealPhaseHeadLabel: { flex: 1 },
    revealPhaseChevron: { fontFamily: FONTS.mono, fontSize: 12, color: AXM.bone },
    // Body sits under the header, indented to clear the intent glyph.
    revealPhaseBody: { paddingLeft: 30, paddingBottom: 7 },
    revealPhaseBodyHidden: { paddingBottom: 0 },
    revealPhaseIcon: { fontSize: 20, lineHeight: 22 },
    revealPhaseLabel: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 0.6, color: AXM.parchment },
    revealPhaseText: { fontFamily: FONTS.serif, fontSize: 12, color: AXM.bone, marginTop: 2, lineHeight: 15 },
    revealPhaseTell: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 10, color: AXM.ash, marginTop: 3, lineHeight: 13 },
    // WS9 — branch fork rows in the threat sequence
    revealBranchCond: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 0.6, color: AXM.sulfur, marginTop: 2 },
    revealBranchTaken: { color: AXM.parchment },
    revealBtn: { borderWidth: 2, paddingHorizontal: 30, paddingVertical: 12, marginTop: 22, backgroundColor: 'rgba(212,192,38,0.12)' },
    revealBtnText: { fontFamily: FONTS.gothic, fontSize: 18, letterSpacing: 1 },
    // Retreat reads QUIETER than the commit — it is the lesser road, not the
    // symmetric other half of a fight-or-flight binary.
    withdrawBtn: { borderWidth: 1, borderColor: AXM.ash, paddingHorizontal: 20, paddingVertical: 8, marginTop: 12, alignItems: 'center' },
    withdrawBtnText: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 2 },
    withdrawSub: { fontFamily: FONTS.mono, fontSize: 8.5, letterSpacing: 0.8, color: AXM.ash, marginTop: 3 },

    ghost: { position: 'absolute', top: 0, left: 0, zIndex: 999 },
    // ✕ badge riding the die ghost while it hovers an illegal target.
    ghostXBadge: {
        position: 'absolute', top: -10, right: -10, width: 24, height: 24, borderRadius: 12,
        borderWidth: 1.5, borderColor: AXM.blood, backgroundColor: 'rgba(10,4,4,0.92)',
        alignItems: 'center', justifyContent: 'center',
    },
    ghostXGlyph: { fontFamily: FONTS.sans, fontSize: 13, lineHeight: 15, color: AXM.blood },
}));
