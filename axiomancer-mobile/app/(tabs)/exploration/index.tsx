import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';
import { ScreenBg } from '@/components/ScreenBg';
import { StatusCard } from '@/components/StatusCard';
import { SectionLabel } from '@/components/SectionLabel';
import { MapCanvas } from '@/components/exploration/MapCanvas';
import { NodeGrid } from '@/components/exploration/NodeGrid';
import { NodeConfirmPanel } from '@/components/exploration/NodeConfirmPanel';
import { EventBadge } from '@/components/exploration/EventBadge';
import { NodeToast } from '@/components/exploration/NodeToast';
import { MapOverlays } from '@/components/exploration/MapOverlays';
import { useCombatMode } from '@/state/combat-mode';
import { useGameActions, useGameState, useGameStore } from '@/state/GameStoreProvider';
import {
    selectExplorationViewModel,
    type ExplorationNode,
    type ExplorationOption,
} from '@/state/presenters/exploration.engine';
import {
    selectEventViewModel,
    selectHasActiveEvent,
} from '@/state/presenters/event.engine';
import { selectHasAnyActiveSession, selectResumableFight } from '@/state/presenters/navigation.engine';
import { EncounterModalOverlay } from '@/components/event/EncounterModalOverlay';
import type { Enemy } from '@mechanics';

export default function ExplorationScreen() {
    const styles = useStyles();
    const {
        enterCombat,
        exitCombat,
        inCombat,
        inEncounterModal,
        openEncounterModal,
        closeEncounterModal,
        lastOutcome,
        recordDeepestNode,
    } = useCombatMode();
    const [nodeTip, setNodeTip] = useState<string | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    // First-visit hint: shown once on mount, auto-dismissed after 5s or on first node tap.
    const [showMapHint, setShowMapHint] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => setShowMapHint(false), 5000);
        return () => clearTimeout(t);
    }, []);
    // Phase 200 — the foe for the in-place hazard combat, captured at FIGHT
    // (the event slice is cleared by then) and fed to the encounter modal.
    const [activeEnemy, setActiveEnemy] = useState<Enemy | null>(null);

    useEffect(() => {
        if (nodeTip !== null) {
            const t = setTimeout(() => setNodeTip(null), 2000);
            return () => clearTimeout(t);
        }
    }, [nodeTip]);

    const actions = useGameActions();
    const eventVm = useGameState(selectEventViewModel);
    const vm = useGameState(selectExplorationViewModel);

    // Phase 63c — the modal mount lifecycle. Skip `state.hasEvent` hook
    // (state shape; would re-render on every engine call), read the 
    // presenter shape directly. The encounter modal mounts on the
    // first combat-prelude event and stays mounted until aftermath
    // dismissal completes (via the combat-mode hook above).
    const hasEvent = useGameState(selectHasActiveEvent);
    const anySession = useGameState(selectHasAnyActiveSession);

    // Resolve the arrival this screen still owes the player, once, on mount.
    //
    // 2026-08-08 first-map audit — the original case was the START node.
    // Events fire on ARRIVAL at a node, and the player never "arrives" at
    // the node they are placed on, so whatever the map authored for its
    // starting node was dead content: on fishing-village that silently
    // swallowed fv-1's entire pool. The mechanics CLI has resolved the start
    // node behind `--resolve-start` since Phase 14; this is the app's
    // equivalent.
    //
    // Burn-day audit 2026-09-19 row 3.1 — the start node is only the FIRST
    // unanswered arrival, not the only one. A move checkpoints before its
    // arrival resolves (`moveToAction` saves, then `onConfirmMove` calls
    // `resolveCurrentMapEvent`), so a player who reloaded in between came
    // back standing on the node with its onward edges open and no fight
    // pending — the encounter was skipped outright. `vm.arrivalPending` is
    // that debt, read off the engine's `pendingArrival` record, and it is
    // cleared by the resolve, so it stays a genuine one-shot: an answered
    // arrival never re-fires, here or after a reload.
    //
    // The two flags are owed for different reasons and neither implies the
    // other (row 3.1 follow-up). `arrivalPending` is a record of WALKING onto
    // a node; `startNodePending` is the map placing you on its first one.
    // Being PLACED somewhere else — a state fixture, a `/dev` JUMP — is
    // neither, and owes nothing: firing on the fixture's placement is what
    // made `/exploration?fixture=sage-fv-boss-gate` engage the fv-9 boss
    // instead of drawing the map.
    //
    // Two guards, and CI taught me both of them.
    //
    // WHAT counts as busy: every minigame owns its own slice, so the arrival
    // has to stand down for ANY of them, not just a paced event — see
    // `selectHasAnyActiveSession`. Checking only the event slice let the dev
    // treasure trigger (which opens the CACHE slice) look idle, and the
    // cutscene stole its route to /cache.
    //
    // WHEN to decide: callers navigate to this screen and open their session
    // in the same handler — `DebugTriggerEncounter.onPress` does
    // `router.push('/(tabs)/exploration')` and then `fire(kind)` — so this
    // screen can mount one commit BEFORE that session exists. Deciding on the
    // render-time reading would see an idle app that is about to be busy, so
    // let the interaction settle and re-read the store at fire time.
    const store = useGameStore();
    const arrivalOwed = vm.arrivalPending || vm.startNodePending;
    useEffect(() => {
        if (!arrivalOwed || anySession || inEncounterModal || inCombat) return;
        const settle = setTimeout(() => {
            if (selectHasAnyActiveSession(store.getState())) return;
            actions.resolveCurrentMapEvent();
        }, 0);
        return () => clearTimeout(settle);
    }, [vm.mapId, vm.currentNodeId, arrivalOwed, anySession, inEncounterModal, inCombat, store, actions]);
    // Phase 63c — the modal mount lifecycle now spans the full
    // encounter session (prelude → combat → aftermath), not just
    // the moment `selectHasActiveEvent` returns true. Once combat
    // starts, `selectHasActiveEvent` flips false (it short-circuits
    // when `state.combat !== null` — Spec 08 Q4 = Future spec for
    // mid-combat events), which would otherwise unmount the modal
    // mid-encounter. The `inEncounterModal` flag (combat-mode)
    // keeps the modal mounted across that boundary.
    const preludeReady = hasEvent && eventVm.kind === 'combat-prelude';
    const showEncounterModal = inEncounterModal || preludeReady;

    // Open the encounter session the first time the prelude appears
    // for a given event. The flag is the modal's lifecycle anchor;
    // the modal itself drives the close via aftermath dismissal
    // (Phase 63c follow-on or 63d).
    useEffect(() => {
        if (preludeReady && !inEncounterModal) {
            openEncounterModal();
        }
    }, [preludeReady, inEncounterModal, openEncounterModal]);
    // Phase 118 — Close encounter modal when encounter event is cleared.
    // Fixes issue where subsequent encounters don't trigger after first
    // encounter (issue #191). When user flees or other non-aftermath exit
    // paths clear the event but leave inEncounterModal=true, subsequent
    // encounters can't open because the openEncounterModal effect above
    // won't fire when inEncounterModal is already true.
    // Guard: a victory/parley/defeat exit ALSO nulls `combat` while the
    // modal is showing the aftermath panel — `lastOutcome` is non-null
    // in exactly that window and the panel's own CARRY ON drives the
    // dismissal. Closing here would swallow the aftermath entirely.
    // Phase 200 — `!inCombat` guard. The new hazard combat keeps its state
    // in the panel's local React state, so `state.combat` stays null during
    // a live encounter — without this clause the teardown would slam the
    // modal shut the instant FIGHT clears the event slice. `inCombat` is true
    // for the whole hazard fight (set by `enterCombat`, cleared on exit), so
    // the modal survives until the panel resolves. Flee (never entered
    // combat) still closes correctly.
    useEffect(() => {
        if (inEncounterModal && !preludeReady && lastOutcome === null && !inCombat) {
            closeEncounterModal();
        }
    }, [inEncounterModal, preludeReady, lastOutcome, inCombat, closeEncounterModal]);
    // Dev-only SKIP EVENT (`state/dev/skip-event.ts`): the store has already
    // settled the fight through `endCombat`, but the hazard panel's "in
    // progress" lives in React (`inCombat`, this screen's captured foe), so
    // the store bumps `_devSkipSeq` and this effect drops the combat flag.
    // With `inCombat` false and no aftermath outcome, the teardown effect
    // above closes the modal and the closing-edge effect below drops the
    // foe. Inert in production: nothing ever bumps the counter there.
    const devSkipSeq = useGameState((s) => s._devSkipSeq ?? 0);
    const seenSkipSeq = useRef(devSkipSeq);
    useEffect(() => {
        if (devSkipSeq === seenSkipSeq.current) return;
        seenSkipSeq.current = devSkipSeq;
        if (inCombat) exitCombat();
    }, [devSkipSeq, inCombat, exitCombat]);

    // Phase 200 — drop the captured foe once the modal session fully closes,
    // so the next encounter bootstraps clean. Strictly on the CLOSING edge:
    // since the modal auto-engages (2026-08-10) the foe is now captured by a
    // child effect in the very commit that opens the session, and this screen's
    // own effects run after its children's — a plain `if (!inEncounterModal)`
    // wiped that foe the instant it was captured, and every encounter fell
    // through to the NO FOE CAPTURED fallback.
    const modalWasOpen = useRef(false);
    useEffect(() => {
        if (inEncounterModal) { modalWasOpen.current = true; return; }
        if (modalWasOpen.current) {
            modalWasOpen.current = false;
            setActiveEnemy(null);
            setResumeFight(null);
        }
    }, [inEncounterModal]);

    // A chronicle continued mid-fight (the store still holds its
    // `currentEncounter`) restarts that fight here, once, on mount: the
    // fight's dice, hand and HP lived in the panel and did not survive the
    // restart, so the saved foe is fought again from the top (owner call,
    // 2026-09-25). Cold start used to route this to the dev sandbox.
    const [resumeFight, setResumeFight] = useState<{ fleeAllowed: boolean } | null>(null);
    const resumeChecked = useRef(false);
    useEffect(() => {
        if (resumeChecked.current) return;
        resumeChecked.current = true;
        if (inEncounterModal || inCombat) return;
        const fight = selectResumableFight(store.getState());
        if (!fight) return;
        setResumeFight({ fleeAllowed: fight.fleeAllowed });
        setActiveEnemy(fight.enemy);
        openEncounterModal();
        enterCombat();
    }, [store, inEncounterModal, inCombat, openEncounterModal, enterCombat]);

    // The node the player has tapped but not yet confirmed; resolved against
    // the current options so a stale selection (after a move) falls away.
    const selectedOption = useMemo(
        () => vm.options.find((o) => o.nodeId === selectedNodeId) ?? null,
        [vm.options, selectedNodeId],
    );

    /**
     * Node tap handler for the exploration map.
     *
     * Input: the tapped `ExplorationNode`. Output: none — it either selects
     * the node (opening `<NodeConfirmPanel>`) or raises a brief toast saying
     * why the tap did nothing. Resolves S4-world-C06: the node the player is
     * STANDING on fell through to a silent `return`, so the one mark the
     * chart drew loudest was also the one that answered nothing when tapped.
     * Every kind now says something back.
     */
    const onNodePress = (node: ExplorationNode) => {
        if (node.kind === 'locked') {
            setNodeTip('This path is sealed.');
            return;
        }
        if (node.kind === 'completed') {
            setNodeTip('walked already');
            return;
        }
        if (node.kind === 'current') {
            setNodeTip('you stand here');
            return;
        }
        if (node.kind !== 'available') return;
        setShowMapHint(false);
        setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
    };

    // Confirm: commit the move to the selected node, then resolve its event.
    const onConfirmMove = () => {
        if (selectedNodeId === null) return;
        const node = vm.nodes.find((n) => n.id === selectedNodeId);
        if (!node || node.kind !== 'available') {
            setSelectedNodeId(null);
            return;
        }
        const result = actions.moveTo(node.id);
        setSelectedNodeId(null);
        if (result.moved) {
            // Run-stats: track the deepest node reached (records on move, not
            // on tap, so cancelled selections don't bump the figure).
            recordDeepestNode(node.id);
            // Resolve the node's event (combat-prelude handled by the encounter
            // modal; other kinds route to their minigame / event).
            actions.resolveCurrentMapEvent(node.type);
        }
    };

    const onEncounterFight = () => {
        // Phase 200 — live encounters now run the new hazard-pattern combat
        // (Spec 26b) in-place. `beginHazardEncounter` pulls the foe, guarantees
        // a real deck, and clears the event WITHOUT starting legacy combat; we
        // hand the foe to the modal and flip the combat-mode flag. The
        // EncounterModalOverlay swaps prelude → combat and renders
        // <CombatEncounterPanel> full-screen over the still-mounted map.
        const enemy = actions.beginHazardEncounter();
        if (!enemy) return;
        setActiveEnemy(enemy);
        enterCombat();
    };

    // 2026-08-10 — retreat now comes from the combat reveal's WITHDRAW, after
    // the encounter has already been entered and the event slice cleared, so
    // it pays the cost through `fleeEncounter` rather than the event choice.
    // The modal owns its own teardown.
    const onEncounterFlee = () => {
        actions.fleeEncounter();
    };

    return (
        <ScreenBg scrollable={false}>
            {/* CRITIQUE.md [MED] "persistent header VITAE bar doesn't update
              * during combat" (pass 12): the encounter modal already renders
              * full-screen over this map (see onEncounterFight above), but
              * this out-of-combat header stayed mounted underneath it,
              * showing a stale VITAE reading that visibly contradicted the
              * live combat HUD's. There is no shared store between this
              * screen's player snapshot and the combat panel's local state
              * (CombatEncounterPanel keeps its engine state in local React
              * state), so the fix is to stop rendering the stale header
              * while the modal owns the screen, matching the "full-screen"
              * design intent instead of wiring a new cross-boundary read. */}
            {!showEncounterModal && <StatusCard />}

            {/* Region Header */}
            <View style={styles.regionHeader}>
                <View>
                    <SectionLabel size={9} style={styles.continentLabel}>{vm.continent}</SectionLabel>
                    <Text style={styles.regionTitle}>{vm.region}</Text>
                    <Text style={styles.regionSub}>{vm.regionProgress}</Text>
                </View>
            </View>

            {/* Node Graph */}
            {/* Legend/compass copy ride the `overlays` slot (viewport-fixed),
                not `children` (the pannable canvas) — CRITIQUE pass 20. */}
            <MapCanvas nodes={vm.nodes} edges={vm.edges} sheet={vm.sheet} overlays={<MapOverlays legend={vm.legend} hint={showMapHint ? vm.drawerCopy.mapHint : null} />}>
                <NodeGrid
                    nodes={vm.nodes}
                    onNodePress={onNodePress}
                    selectedNodeId={selectedNodeId}
                />
            </MapCanvas>

            {vm.eventCallout && (
                <EventBadge eventCallout={vm.eventCallout} />
            )}

            {/* Select a node on the map → name + brief explanation + confirm. */}
            <NodeConfirmPanel
                selected={selectedOption}
                onConfirm={onConfirmMove}
                onCancel={() => setSelectedNodeId(null)}
                emptyMessage={vm.drawerCopy.emptyMessage}
            />

            {showEncounterModal && (
                <EncounterModalOverlay
                    vm={eventVm}
                    encounterEnemy={activeEnemy}
                    onFight={onEncounterFight}
                    onFlee={onEncounterFlee}
                    region={vm.region}
                    resumeFight={resumeFight ?? undefined}
                />
            )}
            {nodeTip !== null && <NodeToast tip={nodeTip} />}
            {/* FE-005: the hint moved into <MapOverlays> so it stacks above
              * the legend instead of landing on top of it at 375x812. */}
            {/* Phase 70 Tick B — `<AftermathBanner>` retired. Both
              * victory and parley outcomes now render inside
              * `<EncounterModalOverlay>` via `<CombatVictoryPanel>`
              * / `<CombatFriendshipPanel>`. Defeat (Tick C pending)
              * and flee paths intentionally don't surface anything
              * on the exploration screen — the seal dismisses
              * silently in those cases. */}
        </ScreenBg>
    );
}

const useStyles = makeStyles((AXM) => ({
    regionHeader: {
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 4,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    regionTitle: {
        fontFamily: FONTS.gothic,
        fontSize: 26,
        lineHeight: 28,
        color: AXM.parchment,
        marginTop: 2,
    },
    regionSub: {
        fontFamily: FONTS.serif,
        fontSize: 11,
        color: AXM.bone,
        fontStyle: 'italic',
        marginTop: 1,
    },
    continentLabel: {
        color: AXM.bone,
    },
}));