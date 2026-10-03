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
import { selectIsInCombat, type Enemy } from '@mechanics';

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
    // The foe for the in-place hazard combat, captured at FIGHT
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

    // The modal mount lifecycle. Skip `state.hasEvent` hook
    // (state shape; would re-render on every engine call), read the 
    // presenter shape directly. The encounter modal mounts on the
    // first combat-prelude event and stays mounted until aftermath
    // dismissal completes (via the combat-mode hook above).
    const hasEvent = useGameState(selectHasActiveEvent);
    const anySession = useGameState(selectHasAnyActiveSession);

    // Resolve the arrival this screen still owes the player, once, on mount.
    //
    // The START node: events fire on ARRIVAL at a node, and the player never
    // "arrives" at the node they are placed on, so without this whatever the
    // map authored for its starting node would be dead content. The
    // mechanics CLI resolves the start node behind `--resolve-start`; this
    // is the app's equivalent.
    //
    // The start node is only the FIRST unanswered arrival, not the only one.
    // A move checkpoints before its arrival resolves (`moveToAction` saves,
    // then `onConfirmMove` calls `resolveCurrentMapEvent`), so a player who
    // reloads in between comes back standing on the node with the arrival
    // still owed. `vm.arrivalPending` is that debt, read off the engine's
    // `pendingArrival` record, and it is cleared by the resolve, so it stays
    // a genuine one-shot: an answered arrival never re-fires, here or after
    // a reload.
    //
    // The two flags are owed for different reasons and neither implies the
    // other. `arrivalPending` is a record of WALKING onto a node;
    // `startNodePending` is the map placing you on its first one. Being
    // PLACED somewhere else — a state fixture, a `/dev` JUMP — is neither,
    // and owes nothing (so `/exploration?fixture=sage-bw-door-gate` draws
    // the map rather than engaging the boss).
    //
    // Two guards.
    //
    // WHAT counts as busy: every minigame owns its own slice, so the arrival
    // has to stand down for ANY of them, not just a paced event — see
    // `selectHasAnyActiveSession`. Checking only the event slice would let
    // the dev treasure trigger (which opens the CACHE slice) look idle, and
    // the cutscene would steal its route to /cache.
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
            // A fight still on the books (the in-memory resume below) owns the
            // node: its arrival stays owed until the fight ends, and
            // resolving it here as well would stage the same fight twice.
            const now = store.getState();
            if (selectHasAnyActiveSession(now) || selectIsInCombat(now)) return;
            actions.resolveCurrentMapEvent();
        }, 0);
        return () => clearTimeout(settle);
    }, [vm.mapId, vm.currentNodeId, arrivalOwed, anySession, inEncounterModal, inCombat, store, actions]);
    // The modal mount lifecycle spans the full
    // encounter session (prelude → combat → aftermath), not just
    // the moment `selectHasActiveEvent` returns true. Once combat
    // starts, `selectHasActiveEvent` flips false (it short-circuits
    // when `state.combat !== null`), which would otherwise unmount the modal
    // mid-encounter. The `inEncounterModal` flag (combat-mode)
    // keeps the modal mounted across that boundary.
    const preludeReady = hasEvent && eventVm.kind === 'combat-prelude';
    const showEncounterModal = inEncounterModal || preludeReady;

    // Open the encounter session the first time the prelude appears
    // for a given event. The flag is the modal's lifecycle anchor;
    // the modal itself drives the close via aftermath dismissal.
    useEffect(() => {
        if (preludeReady && !inEncounterModal) {
            openEncounterModal();
        }
    }, [preludeReady, inEncounterModal, openEncounterModal]);
    // Close the encounter modal when the encounter event is cleared.
    // When the user flees or other non-aftermath exit
    // paths clear the event but leave inEncounterModal=true, subsequent
    // encounters can't open because the openEncounterModal effect above
    // won't fire when inEncounterModal is already true.
    // Guard: a victory/parley/defeat exit ALSO nulls `combat` while the
    // modal is showing the aftermath panel — `lastOutcome` is non-null
    // in exactly that window and the panel's own CARRY ON drives the
    // dismissal. Closing here would swallow the aftermath entirely.
    // `!inCombat` guard. The hazard combat keeps its state
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

    // Drop the captured foe once the modal session fully closes,
    // so the next encounter bootstraps clean. Strictly on the CLOSING edge:
    // the modal auto-engages, so the foe is captured by a child effect in
    // the very commit that opens the session, and this screen's own effects
    // run after its children's — a plain `if (!inEncounterModal)` would wipe
    // that foe the instant it was captured, and every encounter would fall
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
    // restart, so the saved foe is fought again from the top.
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
     * why the tap did nothing. Every kind says something back, including the
     * node the player is STANDING on.
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
        // Live encounters run the hazard-pattern combat in-place.
        // `beginHazardEncounter` pulls the foe, guarantees a real deck, and
        // clears the event WITHOUT setting `state.combat`; we
        // hand the foe to the modal and flip the combat-mode flag. The
        // EncounterModalOverlay swaps prelude → combat and renders
        // <CombatEncounterPanel> full-screen over the still-mounted map.
        const enemy = actions.beginHazardEncounter();
        if (!enemy) return;
        setActiveEnemy(enemy);
        enterCombat();
    };

    // Retreat comes from the combat reveal's WITHDRAW, after
    // the encounter has already been entered and the event slice cleared, so
    // it pays the cost through `fleeEncounter` rather than the event choice.
    // The modal owns its own teardown.
    const onEncounterFlee = () => {
        actions.fleeEncounter();
    };

    return (
        <ScreenBg scrollable={false}>
            {/* The encounter modal renders full-screen over this map (see
              * onEncounterFight above). The combat panel keeps its engine
              * state in local React state, so this out-of-combat header would
              * show a stale VITAE reading under it; it is not rendered while
              * the modal owns the screen. */}
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
            <MapCanvas nodes={vm.nodes} edges={vm.edges} sheet={vm.sheet} overlays={<MapOverlays legend={vm.legend} />}>
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
            {/* Combat outcomes render inside `<EncounterModalOverlay>`;
              * nothing on the exploration screen surfaces them. */}
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