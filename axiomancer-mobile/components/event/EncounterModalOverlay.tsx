/**
 * Encounter modal overlay (Phase 32 design-handoff port, 2026-05-16).
 *
 * Per the prototype's seam pattern (prototype.jsx PtEventModal +
 * chats/chat1.md "encounters triggered by map movement should now be
 * modals — the user cannot exit these modals"): when the player taps
 * an encounter or boss node, this overlay rises over the exploration
 * map. The backdrop is intentionally non-dismissible — there is no
 * `onPress` handler on the backdrop View. The only way out is through
 * the encounter itself.
 *
 * 2026-08-10 (user report) — THE PRELUDE MODAL IS RETIRED. Entering a
 * fight used to ask twice: this overlay's ENGAGE/FLEE seal (over a
 * procedural SVG of the foe) and then the combat reveal's ENTER COMBAT
 * (over the foe's painting, with the whole threat sequence laid out).
 * Two consecutive agreements to the same fight, the first strictly
 * poorer than the second. The seal now auto-engages on mount and the
 * reveal is the single commit gate; retreat moved there too, as the
 * panel's WITHDRAW (`onWithdraw`), so nothing was lost with the popup.
 *
 * Mounts only when the active event VM has `kind === 'combat-prelude'`.
 * Caller (`app/(tabs)/exploration/index.tsx`) controls mount/unmount
 * via `selectHasActiveEvent` + `vm.kind`.
 *
 * The "SEALED · NO RETREAT" chain bars top and bottom carry the
 * diegetic signal that the encounter is committed; they still frame the
 * aftermath panels, which is where the seal chrome is still seen.
 * Component-level pins live in
 * `components/event/__tests__/EncounterModalOverlay.test.tsx`.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    Easing,
} from 'react-native-reanimated';

import { CombatEncounterPanel } from '@/components/combat/encounter/CombatEncounterPanel';
import { CombatDefeatPanel } from '@/components/event/aftermath/CombatDefeatPanel';
import { CombatFriendshipPanel } from '@/components/event/aftermath/CombatFriendshipPanel';
import { CombatVictoryPanel } from '@/components/event/aftermath/CombatVictoryPanel';
import { ChainBarFixed } from '@/components/event/ChainBarFixed';
import { ModalRivet } from '@/components/event/ModalRivet';
import { makeStyles, usePalette } from '@/theme/runtime';
import { useCombatMode } from '@/state/combat-mode';
import { useGameActions, useGameState } from '@/state/GameStoreProvider';
import { selectAftermathViewModel } from '@/state/presenters/aftermath.engine';
import {
    selectEncounterSealChrome,
    type EncounterSealMode,
} from '@/state/presenters/encounter-seal.engine';
import type { EventViewModel } from '@/state/presenters/event.engine';
import type { CombatOutcome, Enemy } from '@mechanics';

/**
 * Modal mode state machine (Phase 63b).
 *
 * - `prelude`  — the first frame only. Once the ENGAGE/FLEE seal was
 *                retired (2026-08-10) nothing renders here but the
 *                backdrop: the effect below engages immediately.
 * - `combat`   — the encounter itself, `<CombatEncounterPanel>`, living
 *                inside the same modal session that opened on the
 *                encounter trigger. No `router.replace('/combat')`.
 * - `aftermath`— the post-combat victory / parley / defeat panel, inside
 *                the seal (Phase 70).
 */
export type EncounterModalMode = 'prelude' | 'combat' | 'aftermath';

interface EncounterModalOverlayProps {
    vm: EventViewModel;
    /** Phase 200 — the foe for the in-place hazard combat (null until engaged). */
    encounterEnemy?: Enemy | null;
    onFight: () => void;
    /** Pays the retreat cost. Fired by the reveal's WITHDRAW (see doc-block). */
    onFlee: () => void;
    /** The exploration screen's current map region (`vm.region` there — this
     *  component's own `vm` is the event VM, hence the separate name), keying
     *  the combat arena backdrop plate (phase 83). */
    region?: string;
}

export function EncounterModalOverlay({
    vm,
    encounterEnemy,
    onFight,
    onFlee,
    region,
}: EncounterModalOverlayProps) {
    // Phase 63b — internal mode. FIGHT advances prelude → combat
    // and bubbles the existing onFight callback up (which still
    // starts combat in the engine but no longer routes away).
    // Phase 70 Tick A — `combat` flips to `aftermath` when the
    // combat-mode shim's `lastOutcome === 'victory'`; the modal
    // body swaps from `<CombatPanel>` to `<CombatVictoryPanel>`
    // in place, and the seal stays closed until the panel's
    // CARRY ON button fires `dismissAftermath()`.
    const AXM = usePalette();
    const styles = useStyles();
    const [mode, setMode] = useState<EncounterModalMode>('prelude');
    // Whether this foe may be walked away from — read off the prelude VM's
    // own `flee` choice (bosses seal it) at the moment we engage, because
    // `beginHazardEncounter` clears the event slice on the way in and the VM
    // is gone by the time the reveal renders its WITHDRAW.
    const [fleeAllowed, setFleeAllowed] = useState(false);
    const {
        lastOutcome,
        aftermathData,
        dismissAftermath,
        resetRunStats,
        exitCombat,
        closeEncounterModal,
    } = useCombatMode();
    const handleFight = useCallback(() => {
        setFleeAllowed(vm.choices.find((c) => c.id === 'flee')?.enabled ?? false);
        onFight();
        setMode('combat');
    }, [onFight, vm]);

    // Phase 70 Tick A — watch the outcome signal. On 'victory' (the
    // only branch with a Tick A panel), swap mode to 'aftermath'.
    // Phase 70 Tick B — extend to 'parley' (friendship panel).
    // Phase 70 Tick C — extend to 'defeat' (defeat panel).
    useEffect(() => {
        if (
            mode === 'combat'
            && (lastOutcome === 'victory' || lastOutcome === 'parley' || lastOutcome === 'defeat')
            && aftermathData !== null
        ) {
            setMode('aftermath');
        }
    }, [mode, lastOutcome, aftermathData]);

    // Phase 77 — BEGIN AGAIN dispatches the engine's `resetRun({
    // keepCharacter: true })` primitive (Phase 72 [ENGINE LANDED]):
    // atomically regenerates `runId`, full-heals the player, clears
    // active effects, regenerates world / quests / flags. The
    // mobile-only `resetRunStats()` shim still runs alongside —
    // `encountersFaced` / `deepestNodeId` live on the combat-mode
    // provider (engine doesn't track run-level counters yet).
    // `dismissAftermath()` tears down the modal session.
    const actions = useGameActions();
    const handleBeginAgain = useCallback(() => {
        actions.resetRun({ keepCharacter: true });
        resetRunStats();
        dismissAftermath();
    }, [actions, resetRunStats, dismissAftermath]);

    // Phase 200 — the player snapshot the in-place hazard combat (Spec 26b)
    // initialises from (live map encounters).
    const player = useGameState((s) => s.player);

    // Phase 200 — teardown for the in-place hazard combat. The panel already
    // persisted HP/XP/loot on the terminal outcome; here we mirror the legacy
    // defeat BEGIN AGAIN (reset the run, keep the character — full heal +
    // regenerate world/quests) and tear the modal session down for any
    // outcome.
    const handleHazardExit = useCallback((outcome: CombatOutcome | null) => {
        if (outcome === 'defeat') {
            actions.resetRun({ keepCharacter: true });
            resetRunStats();
        }
        exitCombat();
        closeEncounterModal();
    }, [actions, resetRunStats, exitCombat, closeEncounterModal]);

    // The reveal's WITHDRAW: pay the retreat cost, then tear the session down
    // the same way any non-defeat exit does. `onFlee` no longer runs through
    // the event slice (already cleared at engage) — see `fleeEncounter`.
    const handleWithdraw = useCallback(() => {
        onFlee();
        handleHazardExit(null);
    }, [onFlee, handleHazardExit]);

    const aftermathVm = selectAftermathViewModel(aftermathData);

    // Phase 64 follow-up (2026-05-21) — auto-scroll on combat phase
    // change. User-direct symptom: "choosing the Action does nothing
    // but logs it to the screen." Engine layer mutates state
    // correctly per Phase 64's integration tests; the suspected
    // root cause is layout (hypothesis A in AUDIT [9.8]): the
    // ResolvePanel mounts when `combat.phase` flips to 'resolving',
    // but the modal's bounded ScrollView leaves it below the
    // visible viewport. This hook scrolls the modal to bottom
    // whenever the engine phase advances, surfacing the new
    // active row (action picker → resolving → choosing_action of
    // next round) into view.
    const combatScrollRef = useRef<ScrollView>(null);
    // Legacy turn-based combat (engine `state.combat` phase/round) was
    // removed in mechanics 0.37.0. Live hazard combat owns its own state
    // in the panel, so the phase-driven auto-scroll is inert and the seal
    // chrome always renders round 1.
    const combatPhase: string | null = null;
    const combatRound = 1;
    const sealChrome = selectEncounterSealChrome(mode as EncounterSealMode, combatRound);
    useEffect(() => {
        if (mode !== 'combat' || combatPhase === null) return;
        // Defer to next tick so layout finishes before scrolling.
        const handle = setTimeout(() => {
            combatScrollRef.current?.scrollToEnd({ animated: true });
        }, 16);
        return () => clearTimeout(handle);
    }, [mode, combatPhase]);

    // Rise animation (Phase 44 port from prototype.jsx:632-638 — the
    // design's `@keyframes rise`). Backdrop fades in over 280ms;
    // panel translates from translateY(20) → 0 + opacity 0 → 1.
    // Shared values default to the start state so the first frame
    // renders mid-transition rather than at the final state.
    const backdropOpacity = useSharedValue(0);
    const panelOffset = useSharedValue(20);
    const panelOpacity = useSharedValue(0);
    useEffect(() => {
        const timing = { duration: 280, easing: Easing.out(Easing.ease) };
        backdropOpacity.value = withTiming(1, timing);
        panelOffset.value = withTiming(0, timing);
        panelOpacity.value = withTiming(1, timing);
    }, [backdropOpacity, panelOffset, panelOpacity]);

    const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
    const panelStyle = useAnimatedStyle(() => ({
        opacity: panelOpacity.value,
        transform: [{ translateY: panelOffset.value }],
    }));

    // Phase 63c follow-up (2026-05-21): the prelude branch requires
    // a `combat-prelude` VM, but the `combat` mode branch MUST stay
    // mounted even after the engine event slice clears (which engaging
    // does synchronously). Gate the early-return on mode: only the
    // pre-engage branch needs the prelude VM. Combat mode reads the
    // captured foe; aftermath mode (Phase 70 Tick A) reads from the
    // snapshot stashed in `combat-mode` and surfaced via `aftermathVm`.
    const preludeRenderable = vm.kind === 'combat-prelude' && vm.preludeChrome !== null;

    // Auto-engage (2026-08-10) — the ENGAGE/FLEE seal is retired; the combat
    // reveal is the one commit gate. The effect (not a render-time call)
    // keeps the parent's state write out of this render pass.
    useEffect(() => {
        if (mode === 'prelude' && preludeRenderable) handleFight();
    }, [mode, preludeRenderable, handleFight]);

    if (mode === 'prelude' && !preludeRenderable) return null;
    // Pre-engage: the single frame between mount and the effect above. Only
    // the backdrop — the seal panel would flash an empty leaf for a frame.
    if (mode === 'prelude') {
        return (
            <View style={styles.overlay} testID="encounter-modal-overlay">
                <Animated.View style={[styles.backdrop, backdropStyle]} />
            </View>
        );
    }
    if (mode === 'aftermath' && aftermathVm === null) {
        // Defensive — should not happen because we only flip into
        // aftermath when aftermathData is non-null. If it does (e.g.
        // a stale outcome signal), fall back to closing the modal.
        return null;
    }

    // Phase 200 — live hazard-pattern combat (Spec 26b). When the player chose
    // FIGHT and exploration captured the foe, render the new card-and-dice
    // combat as a FULL-SCREEN layer over the dimmed map: the board's drag uses
    // window coords, so it must mount from the window origin rather than inside
    // the inset seal panel. The map stays mounted underneath — modal-contained,
    // not a route push. Legacy <CombatPanel> (below) stays as the fallback for
    // any path that reaches combat mode without a captured foe.
    if (mode === 'combat' && encounterEnemy && player) {
        return (
            <View style={styles.overlay} testID="encounter-modal-overlay">
                <Animated.View style={[styles.backdrop, backdropStyle]} />
                <View style={StyleSheet.absoluteFill} testID="encounter-modal-hazard-combat">
                    <CombatEncounterPanel
                        key={encounterEnemy.id}
                        enemy={encounterEnemy}
                        bootstrapPlayer={player}
                        persistOutcome
                        onWithdraw={fleeAllowed ? handleWithdraw : undefined}
                        onExit={handleHazardExit}
                        region={region}
                    />
                </View>
            </View>
        );
    }
    return (
        <View
            style={styles.overlay}
            // The backdrop is non-dismissible per chat1: "user cannot
            // exit these modals". No `onPress` handler. `pointerEvents:
            // box-none` would let taps fall through; we want the
            // opposite — swallow all backdrop taps.
            testID="encounter-modal-overlay"
        >
            <Animated.View style={[styles.backdrop, backdropStyle]} />
            {/* Phase 73 — chain bars now sit OUTSIDE the seal panel
              * to match the design (`prototype.jsx:558-569` for the
              * top chain, `:605-617` for the bottom). The panel is
              * inset between them so the diamond strands frame the
              * seal rather than living inside its border. */}
            <ChainBarFixed position="top" label={sealChrome.topLabel} accentColor={sealChrome.accentColor} />
            <Animated.View
                style={[
                    styles.panel,
                    // Phase 71/73 — phase-aware border + glow. Border
                    // color tracks the seal chrome (blood in prelude /
                    // combat, sulfur on aftermath). boxShadow uses the
                    // glow color so the outer halo around the panel
                    // matches the seal-state accent (rgba colors come
                    // from selectEncounterSealChrome).
                    {
                        borderColor: sealChrome.accentColor,
                        shadowColor: sealChrome.glowColor,
                        boxShadow: `0 0 0 1px ${AXM.bg}, 0 0 24px ${sealChrome.glowColor}, inset 0 0 60px ${AXM.shadow}`,
                    },
                    panelStyle,
                ]}
            >
                {/* Phase 73 — four corner rivets inside the seal,
                  * porting the design's `PtRivet` chrome (handoff
                  * bundle `prototype.jsx:580-583`). */}
                <ModalRivet position="tl" />
                <ModalRivet position="tr" />
                <ModalRivet position="bl" />
                <ModalRivet position="br" />
                {mode === 'aftermath' && aftermathVm !== null && aftermathVm.kind === 'victory' ? (
                    <CombatVictoryPanel
                        vm={aftermathVm}
                        onContinue={dismissAftermath}
                    />
                ) : mode === 'aftermath' && aftermathVm !== null && aftermathVm.kind === 'parley' ? (
                    <CombatFriendshipPanel
                        vm={aftermathVm}
                        onContinue={dismissAftermath}
                    />
                ) : mode === 'aftermath' && aftermathVm !== null && aftermathVm.kind === 'defeat' ? (
                    <CombatDefeatPanel
                        vm={aftermathVm}
                        onBeginAgain={handleBeginAgain}
                        onLetClose={dismissAftermath}
                    />
                ) : (
                    // Fallback for the impossible-in-practice path where
                    // combat mode is entered without a captured foe. The
                    // live path is the full-screen hazard combat early-return
                    // above (`encounterEnemy && player`); map encounters always
                    // supply a foe. The legacy turn-based <CombatPanel> that
                    // used to render here was removed with the legacy combat
                    // surface; this placeholder keeps the modal's combat-mode
                    // contract defined.
                    <ScrollView
                        ref={combatScrollRef}
                        style={styles.combatScroll}
                        contentContainerStyle={styles.combatScrollContent}
                        showsVerticalScrollIndicator={false}
                        testID="encounter-modal-combat-mode"
                    >
                        <Text style={styles.combatFallbackText}>
                            NO FOE CAPTURED
                        </Text>
                    </ScrollView>
                )}
            </Animated.View>
            {/* Phase 73 — bottom chain, also outside the panel. */}
            <ChainBarFixed
                position="bottom"
                label={sealChrome.bottomLabel}
                accentColor={sealChrome.accentColor}
            />
        </View>
    );
}


const useStyles = makeStyles((AXM) => ({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        // Backdrop opacity tuned to the design's diegetic-stack target
        // (chat 2 §IV — "map persists at 35% opacity behind every
        // modal"). 0.65 backdrop fill = ~35% map visibility. Mirrors
        // `design/handoff-2026-05-16/project/prototype.jsx:454`
        // `'rgba(10,10,10,0.6)'` for the combat-event shell; ours is
        // marginally darker (0.65 vs 0.6) so the panel border reads
        // sharp on the lighter regions of the exploration map. Phase
        // 39 port from the handoff bundle.
        backgroundColor: AXM.nodeBg,
    },
    panel: {
        position: 'absolute',
        // Phase 73 (2026-05-23, user-direct): pull the panel
        // close to all four screen edges. The seal should fill
        // the available real estate so the combat content
        // (enemy + log + phase stack + HUD) has room to breathe
        // without the body scrolling for every interaction. The
        // top/bottom insets leave 26px for the SEALED chain bars
        // that sit OUTSIDE the panel per the design
        // (`prototype.jsx:558-617`): each chain bar is 18px tall,
        // pinned 4px in from the screen edge, plus a 4px breath
        // gap before the panel border begins.
        left: 8,
        right: 8,
        top: 26,
        bottom: 22,
        // Phase 73 — match the design's panel fill (AXM.silhouette)
        // (`prototype.jsx:574`). Slightly warmer than AXM.bg so
        // the panel reads as a sealed parchment leaf rather
        // than the same flat near-black as the page behind it.
        backgroundColor: AXM.silhouette,
        // Phase 72 — border bumped 1px → 2px to match the design
        // bundle's PtEncounterFlow (`prototype.jsx:574`)
        // `border: 2px solid $accent`. The color itself comes
        // from `sealChrome.accentColor` (Phase 71).
        borderWidth: 2,
        borderColor: AXM.rust,
        // Phase 73 — port the design's `boxShadow: 0 0 0 1px
        // ${AXM.bg}, 0 0 24px <accent-tint>, inset 0 0 60px
        // rgba(0,0,0,0.7)` (`prototype.jsx:576`). React Native's
        // legacy shadowProps can only carry the outer halo, so
        // we surface the dark 1px outer ring + inset darken via
        // `boxShadow` (RN 0.76+ web-compatible) and keep the
        // shadow* keys as a native fallback for older Android.
        // The accent-tint outer glow is driven by sealChrome.
        boxShadow:
            `0 0 0 1px ${AXM.bg}, 0 0 24px ${AXM.bloodMed}, inset 0 0 60px ${AXM.shadow}`,
        shadowColor: AXM.deepBg,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.8,
        shadowRadius: 24,
        elevation: 10,
        flexDirection: 'column',
    },
    // Phase 63b — combat-mode ScrollView wrap. The panel has a
    // bounded height (top: 56, bottom: 84); CombatPanel renders
    // EnemyPanel + log + HUD + PhaseStack, often taller than the
    // panel viewport, so the scroll lets the player see all of
    // it without breaking the modal containment.
    combatScroll: { flex: 1 },
    // Phase 72 — combat-body horizontal inset aligns with the
    // design bundle's `PtCombatBody` outer wrap
    // (`design/handoff-2026-05-23/project/prototype.jsx:697`
    // `padding: '8px 14px 12px'`). Pre-Phase-72 the scroll was
    // edge-to-edge and the EnemyPanel + phase rows looked cramped
    // against the modal border.
    combatScrollContent: { paddingBottom: 12, paddingHorizontal: 4 },
    combatFallbackText: {
        textAlign: 'center',
        padding: 24,
        color: AXM.bone,
        fontSize: 12,
        letterSpacing: 2,
    },
}));
