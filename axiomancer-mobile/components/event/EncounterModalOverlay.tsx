/**
 * Encounter modal overlay. Encounters triggered by map movement are
 * modals the player cannot exit: when the player taps an encounter or
 * boss node, this overlay rises over the exploration map. The backdrop
 * is intentionally non-dismissible — there is no `onPress` handler on
 * the backdrop View. The only way out is through the encounter itself.
 *
 * The seal auto-engages on mount: the combat reveal's ENTER COMBAT is the
 * single commit gate, and retreat is the panel's WITHDRAW (`onWithdraw`).
 *
 * Mounts only when the active event VM has `kind === 'combat-prelude'`.
 * Caller (`app/(tabs)/exploration/index.tsx`) controls mount/unmount
 * via `selectHasActiveEvent` + `vm.kind`.
 *
 * The "SEALED · NO RETREAT" chain bars top and bottom carry the
 * diegetic signal that the encounter is committed; they frame the
 * aftermath panels.
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
 * Modal mode state machine.
 *
 * - `prelude`  — the first frame only. Nothing renders but the
 *                backdrop: the effect below engages immediately.
 * - `combat`   — the encounter itself, `<CombatEncounterPanel>`, living
 *                inside the same modal session that opened on the
 *                encounter trigger. No `router.replace('/combat')`.
 * - `aftermath`— the post-combat victory / parley / defeat panel, inside
 *                the seal.
 */
export type EncounterModalMode = 'prelude' | 'combat' | 'aftermath';

interface EncounterModalOverlayProps {
    vm: EventViewModel;
    /** The foe for the in-place hazard combat (null until engaged). */
    encounterEnemy?: Enemy | null;
    onFight: () => void;
    /** Pays the retreat cost. Fired by the reveal's WITHDRAW (see doc-block). */
    onFlee: () => void;
    /** The exploration screen's current map region (`vm.region` there — this
     *  component's own `vm` is the event VM, hence the separate name), keying
     *  the combat arena backdrop plate. */
    region?: string;
    /** Set when a chronicle saved mid-fight is continued: the fight's own
     *  state did not survive the restart, so the modal opens straight into a
     *  fresh fight against `encounterEnemy` (no prelude VM exists to engage
     *  from). `fleeAllowed` stands in for the prelude's `flee` choice. */
    resumeFight?: { fleeAllowed: boolean };
}

export function EncounterModalOverlay({
    vm,
    encounterEnemy,
    onFight,
    onFlee,
    region,
    resumeFight,
}: EncounterModalOverlayProps) {
    // Internal mode. Engaging advances prelude → combat and calls
    // `onFight` (which starts combat in the engine without routing away).
    // `combat` flips to `aftermath` on a terminal outcome; the modal body
    // swaps to the matching aftermath panel in place, and the seal stays
    // closed until that panel calls `dismissAftermath()`.
    const AXM = usePalette();
    const styles = useStyles();
    const [mode, setMode] = useState<EncounterModalMode>(resumeFight ? 'combat' : 'prelude');
    // Whether this foe may be walked away from — read off the prelude VM's
    // own `flee` choice (bosses seal it) at the moment we engage, because
    // `beginHazardEncounter` clears the event slice on the way in and the VM
    // is gone by the time the reveal renders its WITHDRAW.
    const [fleeAllowed, setFleeAllowed] = useState(resumeFight?.fleeAllowed ?? false);
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

    // Watch the outcome signal: on 'victory', 'parley' or 'defeat' (with
    // aftermath data present), swap mode to 'aftermath'.
    useEffect(() => {
        if (
            mode === 'combat'
            && (lastOutcome === 'victory' || lastOutcome === 'parley' || lastOutcome === 'defeat')
            && aftermathData !== null
        ) {
            setMode('aftermath');
        }
    }, [mode, lastOutcome, aftermathData]);

    // BEGIN AGAIN dispatches the engine's `resetRun({
    // keepCharacter: true })` primitive: atomically regenerates `runId`, full-heals the player, clears
    // active effects, regenerates world / quests / flags. The
    // mobile-only `resetRunStats()` shim runs alongside —
    // `encountersFaced` / `deepestNodeId` live on the combat-mode
    // provider (the engine does not track run-level counters).
    // `dismissAftermath()` tears down the modal session.
    const actions = useGameActions();
    const handleBeginAgain = useCallback(() => {
        actions.resetRun({ keepCharacter: true });
        resetRunStats();
        dismissAftermath();
    }, [actions, resetRunStats, dismissAftermath]);

    // The player snapshot the in-place hazard combat initialises from.
    const player = useGameState((s) => s.player);
    // The real player's loadout flags, threaded to the panel
    // explicitly (it corresponds to `player` above, unlike the dev sandbox's
    // synthetic demo deck, which must not receive them).
    const flags = useGameState((s) => (s as unknown as { flags?: string[] }).flags);

    // Teardown for the in-place hazard combat. The panel already persisted
    // HP/XP/loot on the terminal outcome; on defeat this does what BEGIN
    // AGAIN does (reset the run, keep the character — full heal + regenerate
    // world/quests), then tears the modal session down for any outcome.
    const handleHazardExit = useCallback((outcome: CombatOutcome | null) => {
        if (outcome === 'defeat') {
            actions.resetRun({ keepCharacter: true });
            resetRunStats();
        }
        exitCombat();
        closeEncounterModal();
    }, [actions, resetRunStats, exitCombat, closeEncounterModal]);

    // The reveal's WITHDRAW: pay the retreat cost, then tear the session down
    // the same way any non-defeat exit does. `onFlee` does not run through
    // the event slice (already cleared at engage) — see `fleeEncounter`.
    const handleWithdraw = useCallback(() => {
        onFlee();
        handleHazardExit(null);
    }, [onFlee, handleHazardExit]);

    const aftermathVm = selectAftermathViewModel(aftermathData);

    // Scrolls the combat-mode body to the bottom whenever `combatPhase`
    // changes. Live hazard combat owns its own state in the panel, so
    // `combatPhase` is always null (the auto-scroll is inert) and the seal
    // chrome always renders round 1.
    const combatScrollRef = useRef<ScrollView>(null);
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

    // Rise animation (the design's `@keyframes rise`). Backdrop fades in over 280ms;
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

    // The prelude branch requires
    // a `combat-prelude` VM, but the `combat` mode branch MUST stay
    // mounted even after the engine event slice clears (which engaging
    // does synchronously). Gate the early-return on mode: only the
    // pre-engage branch needs the prelude VM. Combat mode reads the
    // captured foe; aftermath mode reads from the
    // snapshot stashed in `combat-mode` and surfaced via `aftermathVm`.
    const preludeRenderable = vm.kind === 'combat-prelude' && vm.preludeChrome !== null;

    // Auto-engage: the combat reveal is the one commit gate. The effect (not a render-time call)
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

    // Live hazard-pattern combat. When the player engaged and exploration
    // captured the foe, render the card-and-dice
    // combat as a FULL-SCREEN layer over the dimmed map: the board's drag uses
    // window coords, so it must mount from the window origin rather than inside
    // the inset seal panel. The map stays mounted underneath — modal-contained,
    // not a route push. The NO FOE CAPTURED placeholder (below) is the
    // fallback for any path that reaches combat mode without a captured foe.
    if (mode === 'combat' && encounterEnemy && player) {
        return (
            <View style={styles.overlay} testID="encounter-modal-overlay">
                <Animated.View style={[styles.backdrop, backdropStyle]} />
                <View style={StyleSheet.absoluteFill} testID="encounter-modal-hazard-combat">
                    <CombatEncounterPanel
                        key={encounterEnemy.id}
                        enemy={encounterEnemy}
                        bootstrapPlayer={player}
                        flags={flags}
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
            // The backdrop is non-dismissible: the player cannot exit
            // these modals. No `onPress` handler. `pointerEvents:
            // box-none` would let taps fall through; we want the
            // opposite — swallow all backdrop taps.
            testID="encounter-modal-overlay"
        >
            <Animated.View style={[styles.backdrop, backdropStyle]} />
            {/* Chain bars sit OUTSIDE the seal panel. The panel is
              * inset between them so the diamond strands frame the
              * seal rather than living inside its border. */}
            <ChainBarFixed position="top" label={sealChrome.topLabel} accentColor={sealChrome.accentColor} />
            <Animated.View
                style={[
                    styles.panel,
                    // Phase-aware border + glow. Border
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
                {/* Four corner rivets inside the seal. */}
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
                    // supply a foe. This placeholder keeps the modal's
                    // combat-mode contract defined.
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
            {/* Bottom chain, also outside the panel. */}
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
        // modal"). 0.65 backdrop fill = ~35% map visibility — marginally
        // darker than the design's 0.6 so the panel border reads sharp
        // on the lighter regions of the exploration map.
        backgroundColor: AXM.nodeBg,
    },
    panel: {
        position: 'absolute',
        // Pull the panel close to all four screen edges. The seal should fill
        // the available real estate so the combat content
        // (enemy + log + phase stack + HUD) has room to breathe
        // without the body scrolling for every interaction. The
        // top/bottom insets leave 26px for the SEALED chain bars
        // that sit OUTSIDE the panel: each chain bar is 18px tall,
        // pinned 4px in from the screen edge, plus a 4px breath
        // gap before the panel border begins.
        left: 8,
        right: 8,
        top: 26,
        bottom: 22,
        // The design's panel fill (AXM.silhouette). Slightly warmer than AXM.bg so
        // the panel reads as a sealed parchment leaf rather
        // than the same flat near-black as the page behind it.
        backgroundColor: AXM.silhouette,
        // 2px border, per the design's `border: 2px solid $accent`.
        // The color itself comes from `sealChrome.accentColor`.
        borderWidth: 2,
        borderColor: AXM.rust,
        // The design's `boxShadow: 0 0 0 1px ${AXM.bg}, 0 0 24px
        // <accent-tint>, inset 0 0 60px rgba(0,0,0,0.7)`. React Native's
        // shadow* props can only carry the outer halo, so
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
    // Combat-mode ScrollView wrap. The panel has a bounded height
    // (top: 26, bottom: 22), so the scroll keeps any taller combat-mode
    // content visible without breaking the modal containment.
    combatScroll: { flex: 1 },
    // Combat-body inset so content does not sit cramped against the
    // modal border.
    combatScrollContent: { paddingBottom: 12, paddingHorizontal: 4 },
    combatFallbackText: {
        textAlign: 'center',
        padding: 24,
        color: AXM.bone,
        fontSize: 12,
        letterSpacing: 2,
    },
}));
