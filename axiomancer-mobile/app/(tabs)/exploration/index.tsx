import React, { useEffect, useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';
import { ScreenBg } from '@/components/ScreenBg';
import { StatusCard } from '@/components/StatusCard';
import { SectionLabel } from '@/components/SectionLabel';
import { ExplorationCodexHeader } from '@/components/ExplorationCodexHeader';
import { MapCanvas } from '@/components/exploration/MapCanvas';
import { NodeGrid } from '@/components/exploration/NodeGrid';
import { NodeConfirmPanel } from '@/components/exploration/NodeConfirmPanel';
import { EventBadge } from '@/components/exploration/EventBadge';
import { NodeToast } from '@/components/exploration/NodeToast';
import { MapOverlays } from '@/components/exploration/MapOverlays';
import { useAesthetic } from '@/state/aesthetic-mode';
import { useCombatMode } from '@/state/combat-mode';
import { selectExplorationCodexHeader } from '@/state/presenters/exploration.codex.engine';
import { useGameActions, useGameState } from '@/state/GameStoreProvider';
import {
    selectExplorationViewModel,
    type ExplorationNode,
    type ExplorationOption,
} from '@/state/presenters/exploration.engine';
import {
    selectEventViewModel,
    selectHasActiveEvent,
} from '@/state/presenters/event.engine';
import { EncounterModalOverlay } from '@/components/event/EncounterModalOverlay';
import type { Enemy } from 'axiomancer-mechanics';

export default function ExplorationScreen() {
    const styles = useStyles();
    const {
        enterCombat,
        inCombat,
        inEncounterModal,
        openEncounterModal,
        closeEncounterModal,
        lastOutcome,
        recordDeepestNode,
    } = useCombatMode();
    const { mode: aesthetic } = useAesthetic();
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
    // Phase 200 — drop the captured foe once the modal session fully closes,
    // so the next encounter bootstraps clean.
    useEffect(() => {
        if (!inEncounterModal) setActiveEnemy(null);
    }, [inEncounterModal]);

    // The node the player has tapped but not yet confirmed; resolved against
    // the current options so a stale selection (after a move) falls away.
    const selectedOption = useMemo(
        () => vm.options.find((o) => o.nodeId === selectedNodeId) ?? null,
        [vm.options, selectedNodeId],
    );

    // Tapping a node SELECTS it (showing the confirm panel) rather than moving
    // immediately; locked / completed taps surface a brief toast.
    const onNodePress = (node: ExplorationNode) => {
        if (node.kind === 'locked') {
            setNodeTip('This path is sealed.');
            return;
        }
        if (node.kind === 'completed') {
            setNodeTip('walked already');
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

    const onEncounterFlee = () => {
        actions.pickEventChoice('flee');
    };

    return (
        <ScreenBg scrollable={false}>
            <StatusCard />

            {aesthetic === 'codex' && (() => {
                const { left, right } = selectExplorationCodexHeader(vm);
                return <ExplorationCodexHeader left={left} right={right} />;
            })()}

            {/* Region Header */}
            <View style={styles.regionHeader}>
                <View>
                    <SectionLabel size={9} style={styles.continentLabel}>{vm.continent}</SectionLabel>
                    <Text style={styles.regionTitle}>{vm.region}</Text>
                    <Text style={styles.regionSub}>{vm.regionProgress}</Text>
                </View>
            </View>

            {/* Node Graph */}
            <MapCanvas nodes={vm.nodes} edges={vm.edges}>
                <MapOverlays legend={vm.legend} />
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
                />
            )}
            {nodeTip !== null && <NodeToast tip={nodeTip} />}
            {showMapHint && (
                <View style={styles.mapHint} pointerEvents="none">
                    <Text style={styles.mapHintText}>Tap a glowing node to travel there</Text>
                </View>
            )}
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
    mapHint: {
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    mapHintText: {
        fontFamily: FONTS.serifItalic,
        fontSize: 13,
        color: AXM.parchment,
        backgroundColor: 'rgba(10,10,10,0.72)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: AXM.ash,
        textAlign: 'center',
    },
}));