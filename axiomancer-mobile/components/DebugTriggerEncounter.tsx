/**
 * Dev-only "Trigger encounter" panel.
 *
 * One button per encounter kind the game can surface. Tapping a
 * button jumps to the WILDS (exploration) tab and fires that
 * encounter immediately — no walking onto the right node required:
 *
 *   - COMBAT   → combat-prelude over the map (`<EncounterModalOverlay>`),
 *               seeded with the LOWEST-level standard foe on the
 *               current map so the fight is the gentlest available.
 *   - BOSS     → combat-prelude with the lowest-level boss foe on
 *               the current map (KNEEL / STRIKE chrome, no flee).
 *   - HAZARD / REST / GATHER / TREASURE / QUEST → the real minigame
 *               session, launched through the same `begin*` actions
 *               the live map path uses, so the matching gate
 *               (`<HazardGate>` → `/hazard`, `<RestGate>` → `/rest`,
 *               `<GatheringGate>` → `/gathering`, `<CacheGate>` →
 *               `/cache`, `<QuestGate>` → `/quest`) routes to the
 *               full-screen minigame.
 *
 * Mechanism (Phase 137 alignment, 2026-06-14): rest / gather /
 * treasure / quest no longer reach the `/event` slice — the live
 * `resolveCurrentMapEventAction` intercepts those kinds and starts a
 * minigame session. This panel mirrors that interception by calling
 * the `begin*` actions directly rather than seeding a `ResolvedEvent`
 * onto the event slice. The old slice-seeding behavior dead-ended at
 * the `/event` "NO EVENT" card because `composeNarrative` returns the
 * empty VM for minigame kinds — the exact bug this rewrite fixes.
 * Combat / boss still construct a combat-prelude `ResolvedEvent` and
 * drop it on the slice (those DO render in-place via
 * `<EncounterModalOverlay>`); village / cutscene still seed their
 * paced events for `<EventGate>` to route. Every button is
 * deterministic regardless of where the player is standing.
 *
 * Navigation happens first so the minigame / paced routes stack on
 * top of the WILDS tab rather than the other way round.
 *
 * Renders null outside dev builds. Mounts inside the DevMenu.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
    EnemiesByMap,
    consumableLibrary,
    type Enemy,
    type Item,
} from 'axiomancer-mechanics';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameActions, useGameStore } from '@/state/GameStoreProvider';
import { EMPTY_EVENT_SLICE } from '@/state/store';
import type { NodeType } from '@/state/presenters/exploration.engine';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

type MapKey = keyof typeof EnemiesByMap;
const DEFAULT_MAP: MapKey = 'fishing-village';

/** All encounters exposed as trigger buttons. `kind` doubles as the
 * `sourceNodeType` stamped on the event slice. */
const ENCOUNTERS: readonly { kind: NodeType; label: string }[] = [
    { kind: 'encounter', label: 'COMBAT' },
    { kind: 'boss', label: 'BOSS' },
    { kind: 'hazard', label: 'HAZARD' },
    { kind: 'rest', label: 'REST' },
    { kind: 'gather', label: 'GATHER' },
    { kind: 'treasure', label: 'TREASURE' },
    { kind: 'quest', label: 'QUEST' },
];

/** Paced narrative events that route to their own dedicated screens
 * (Phase 137) rather than the generic /event shell — village + cutscene.
 * Their `kind` isn't a NodeType, so they ride a separate button row; the
 * seeded event drives <EventGate> to push /village or /cutscene. Sample
 * payloads mirror the engine's ResolvedEvent shape (selectVillageVM reads
 * merchants[].dialogueTree + shop.wares; the cutscene screen reads
 * lines[]). Visual-audit 2026-06 — closes the village/cutscene capture
 * gap so both screens can be eyeballed. */
const PACED_EXTRAS: readonly { id: string; label: string; event: unknown }[] = [
    {
        id: 'village',
        label: 'VILLAGE',
        event: {
            kind: 'village',
            villageName: 'Saltmarsh Wend',
            merchants: [
                {
                    name: 'Maren the Netwright',
                    dialogueTree: {
                        rootId: 'r',
                        nodes: { r: { id: 'r', text: 'Rope and twine, pilgrim — cheaper than drowning.' } },
                    },
                },
                {
                    name: 'Old Coddle',
                    dialogueTree: {
                        rootId: 'r',
                        nodes: { r: { id: 'r', text: 'Bread two days stale, honest as the tide.' } },
                    },
                },
            ],
            shop: {
                wares: [
                    { itemId: 'minor-healing-potion', price: 12 },
                    { itemId: 'antidote', price: 8 },
                ],
            },
        },
    },
    {
        id: 'cutscene',
        label: 'CUTSCENE',
        event: {
            kind: 'cutscene',
            lines: [
                'The tide goes out further than it should, and does not turn.',
                'On the bared flats lies something the sea forgot to take back.',
                'It does not move. It is waiting for you to.',
            ],
        },
    },
];

export function DebugTriggerEncounter() {
    const styles = useStyles();
    const store = useGameStore();
    const actions = useGameActions();
    const router = useRouter();

    if (!isDevToolsEnabled()) return null;

    const currentMapKey = (): MapKey => {
        const world = store.getState().world as
            | { currentMap?: { name?: string } }
            | undefined;
        const name = world?.currentMap?.name;
        return name && name in EnemiesByMap ? (name as MapKey) : DEFAULT_MAP;
    };

    /** Lowest-level foe on the map matching `predicate`, ties broken by
     * lowest health. Returns null if nothing matches. */
    const lowestFoe = (predicate: (e: Enemy) => boolean): Enemy | null => {
        const roster = EnemiesByMap[currentMapKey()].filter(predicate);
        if (roster.length === 0) return null;
        return [...roster].sort(
            (a, b) => a.level - b.level || a.health - b.health,
        )[0];
    };

    const setPending = (event: unknown, sourceNodeType: NodeType) => {
        store.setState({
            event: {
                ...EMPTY_EVENT_SLICE,
                pending: { state: store.getState(), event } as never,
                sourceNodeType,
            },
        });
    };

    const fire = (kind: NodeType) => {
        switch (kind) {
            case 'encounter': {
                // Lowest-level standard foe — bosses + uniques excluded.
                const enemy = lowestFoe(
                    (e) => e.difficulty !== 'boss' && e.difficulty !== 'unique',
                );
                if (!enemy) return;
                setPending(
                    {
                        kind: 'encounter',
                        encounter: { enemies: [enemy], origin: 'dev:trigger-encounter' },
                        isBoss: false,
                    },
                    'encounter',
                );
                return;
            }
            case 'boss': {
                // Lowest-level boss foe; fall back to the gentlest foe if
                // the map somehow has no boss-tier entry.
                const enemy =
                    lowestFoe((e) => e.difficulty === 'boss') ?? lowestFoe(() => true);
                if (!enemy) return;
                setPending(
                    {
                        kind: 'encounter',
                        encounter: { enemies: [enemy], origin: 'dev:trigger-boss' },
                        isBoss: true,
                    },
                    'boss',
                );
                return;
            }
            case 'hazard':
                // The real minigame. <HazardGate> observes the slice and
                // pushes /hazard.
                actions.beginHazard();
                return;
            case 'rest':
                // "The Night Watch" — <RestGate> routes to /rest. Mirror
                // the live interceptor's default half-heal.
                actions.beginRest({ healFraction: 0.5 });
                return;
            case 'gather':
                // "The Gleaning" — <GatheringGate> routes to /gathering.
                // Skip the tutorial framing for the dev shortcut so it
                // drops straight into the organic board.
                actions.beginGathering({});
                return;
            case 'treasure': {
                // "The Reliquary" — <CacheGate> routes to /cache. Seed a
                // sample item + coin so the claim ledger has content.
                const loot: Item[] = consumableLibrary[0] ? [consumableLibrary[0]] : [];
                actions.beginLootCache({ items: loot, currency: 25 });
                return;
            }
            case 'quest':
                // "The Boy's Almanac" board — <QuestGate> routes to /quest.
                // The only authored board today is the story's first main
                // quest, "build-the-boat" (fishing-village Sea Cave).
                actions.beginQuestBoard({ boardId: 'build-the-boat' });
                return;
            default:
                return;
        }
    };

    const onPress = (kind: NodeType) => {
        // Jump to WILDS first so paced-event (/event) and hazard
        // (/hazard) routes stack on top of the world tab.
        router.push('/(tabs)/exploration');
        fire(kind);
    };

    const onPressPaced = (event: unknown) => {
        // Village/cutscene push a dedicated full-screen route via
        // <EventGate>, which is mounted at the root layout and so fires
        // from any tab. Unlike onPress (whose combat-prelude renders over
        // the WILDS map), these need NO tab jump — and crucially, NOT
        // jumping means the event's dismiss tap returns here, to the dev
        // menu, instead of dead-ending on the exploration map.
        // `sourceNodeType` is metadata these screens don't read, so any
        // valid NodeType is harmless — 'quest' stands in.
        setPending(event, 'quest');
    };

    return (
        <View style={styles.root}>
            <View style={styles.labelRow}>
                <Text style={styles.label}>DEBUG · TRIGGER ENCOUNTER</Text>
                <Text style={styles.sub}>jump to WILDS + fire it</Text>
            </View>
            <View style={styles.buttonGroup}>
                {ENCOUNTERS.map((entry) => (
                    <Pressable
                        key={entry.kind}
                        style={styles.button}
                        onPress={() => onPress(entry.kind)}
                        accessibilityRole="button"
                        accessibilityLabel={`Trigger ${entry.label.toLowerCase()} encounter on the world tab`}
                        testID={`debug-trigger-encounter-${entry.kind}`}
                    >
                        <Text style={styles.buttonLabel}>{entry.label}</Text>
                    </Pressable>
                ))}
                {PACED_EXTRAS.map((entry) => (
                    <Pressable
                        key={entry.id}
                        style={styles.button}
                        onPress={() => onPressPaced(entry.event)}
                        accessibilityRole="button"
                        accessibilityLabel={`Trigger ${entry.label.toLowerCase()} on the world tab`}
                        testID={`debug-trigger-encounter-${entry.id}`}
                    >
                        <Text style={styles.buttonLabel}>{entry.label}</Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: {
        marginTop: 8,
        marginHorizontal: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: AXM.ash,
        borderStyle: 'dashed',
        backgroundColor: AXM.panelBg,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 6,
    },
    label: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        letterSpacing: 1.5,
        color: AXM.bone,
    },
    sub: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        color: AXM.parchment,
    },
    buttonGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    button: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: AXM.rust,
        backgroundColor: AXM.bg,
    },
    buttonLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 11,
        color: AXM.rust,
        letterSpacing: 1,
    },
}));
