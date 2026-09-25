/**
 * Grouped dev-tools surface — the body of the `/dev` route.
 *
 * Rebuilt in the 2026-09 dev-tools audit. The Phase 132 extraction kept
 * every legacy control "for a later audit"; this is that audit. Retired
 * (stale or duplicated): the rarity-loot buttons (rarity model retired
 * in Phase 21), the second rest/cache row, the FRESH/ENDGAME raw-state
 * presets (superseded by the L1–L50 ladder), the composite SEED button,
 * the dead HIDE MANA / HIDE STANCE toggles, the free-text add-item
 * input, and the synthetic OMEN/FRIEND dialogue + two-quest fixtures.
 * Added: a live STATE inspector, world travel to any map / node with
 * its authored event, the labyrinth acts, an any-foe enemy picker, every
 * reward channel, flag toggles, real NPC trees + real quests, effect and
 * item pickers, and run controls.
 *
 * Sections read top-down in the order a tester thinks: see state →
 * shape the player → shape the deck → stand somewhere → fight / play a
 * minigame → collect rewards → drive the story → tweak the UI → manage
 * the run and read the log. `testID`s: `dev-section-<key>`.
 *
 * Every leaf is `React.lazy` so production bundles never import the
 * Debug* modules; the container also self-gates on `isDevToolsEnabled`.
 */

import React, { Suspense, lazy } from 'react';
import { Text, View } from 'react-native';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

/** Lazy-load a named export from a Debug* module (keeps prod bundles clean). */
const lazyNamed = <T extends React.ComponentType>(load: () => Promise<Record<string, unknown>>, name: string) =>
    lazy(() => load().then((m) => ({ default: m[name] as T })));

// ── STATE ──
const DebugStateInspector = lazyNamed(() => import('@/components/DebugStateInspector'), 'DebugStateInspector');
// ── PLAYER ──
const DebugPresetPicker = lazyNamed(() => import('@/components/DebugPresetPicker'), 'DebugPresetPicker');
const DebugPlayerTierPresets = lazyNamed(() => import('@/components/DebugPlayerTierPresets'), 'DebugPlayerTierPresets');
const DebugXpGrant = lazyNamed(() => import('@/components/DebugXpGrant'), 'DebugXpGrant');
const DebugCurrencyControl = lazyNamed(() => import('@/components/DebugCurrencyControl'), 'DebugCurrencyControl');
const DebugAlignmentShift = lazyNamed(() => import('@/components/DebugAlignmentShift'), 'DebugAlignmentShift');
const DebugEffectApply = lazyNamed(() => import('@/components/DebugEffectApply'), 'DebugEffectApply');
// ── DECKS & ITEMS ──
const DebugHazardDeckRandomize = lazyNamed(() => import('@/components/DebugHazardDeckRandomize'), 'DebugHazardDeckRandomize');
const DebugPopulateAllItems = lazyNamed(() => import('@/components/DebugPopulateAllItems'), 'DebugPopulateAllItems');
const DebugItemPicker = lazyNamed(() => import('@/components/DebugItemPicker'), 'DebugItemPicker');
// ── WORLD ──
const DebugWorldTravel = lazyNamed(() => import('@/components/DebugWorldTravel'), 'DebugWorldTravel');
const DebugFlags = lazyNamed(() => import('@/components/DebugFlags'), 'DebugFlags');
// ── ENCOUNTERS ──
const DebugTriggerEncounter = lazyNamed(() => import('@/components/DebugTriggerEncounter'), 'DebugTriggerEncounter');
const DebugEnemyPicker = lazyNamed(() => import('@/components/DebugEnemyPicker'), 'DebugEnemyPicker');
const DebugCombatSandbox = lazyNamed(() => import('@/components/DebugCombatSandbox'), 'DebugCombatSandbox');
// ── MINIGAMES & REWARDS ──
const DebugHazardButton = lazyNamed(() => import('@/components/DebugHazardButton'), 'DebugHazardButton');
const DebugRestButton = lazyNamed(() => import('@/components/DebugRestButton'), 'DebugRestButton');
const DebugBlacksmithButton = lazyNamed(() => import('@/components/DebugBlacksmithButton'), 'DebugBlacksmithButton');
const DebugRewardTriggers = lazyNamed(() => import('@/components/DebugRewardTriggers'), 'DebugRewardTriggers');
// ── STORY ──
const DebugDialogueJump = lazyNamed(() => import('@/components/DebugDialogueJump'), 'DebugDialogueJump');
const DebugQuestState = lazyNamed(() => import('@/components/DebugQuestState'), 'DebugQuestState');
// ── UI ──
const AestheticDevToggle = lazyNamed(() => import('@/components/AestheticDevToggle'), 'AestheticDevToggle');
// ── RUN & DIAGNOSTICS ──
const DebugRunControls = lazyNamed(() => import('@/components/DebugRunControls'), 'DebugRunControls');
const DebugLogViewer = lazyNamed(() => import('@/components/DebugLogViewer'), 'DebugLogViewer');

function LoadingFallback() {
    const AXM = usePalette();
    return (
        <View style={{ padding: 8 }} testID="dev-tools-loading">
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone }}>Loading debug tools...</Text>
        </View>
    );
}

/** One titled, dashed-border group of leaves. */
function DevSection({ label, hint, testID, children }: { label: string; hint: string; testID: string; children: React.ReactNode }) {
    const styles = useStyles();
    return (
        <View style={styles.section} testID={testID}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>{label}</Text>
                <Text style={styles.sectionHint}>{hint}</Text>
            </View>
            <View style={styles.sectionBody}>{children}</View>
        </View>
    );
}

/** The grouped dev controls. Mounted by the `/dev` route. */
export function DevToolsSections() {
    const styles = useStyles();
    if (!isDevToolsEnabled()) return null;

    return (
        <View style={styles.root} testID="dev-tools-sections">
            <Suspense fallback={<LoadingFallback />}>
                <DevSection label="STATE" hint="see everything" testID="dev-section-state">
                    <DebugStateInspector />
                </DevSection>

                <DevSection label="PLAYER" hint="archetype · level · wallet · ledger · effects" testID="dev-section-player">
                    <DebugPresetPicker />
                    <DebugPlayerTierPresets />
                    <DebugXpGrant />
                    <DebugCurrencyControl />
                    <DebugAlignmentShift />
                    <DebugEffectApply />
                </DevSection>

                <DevSection label="DECKS & ITEMS" hint="hazard deck · satchel" testID="dev-section-decks">
                    <DebugHazardDeckRandomize />
                    <DebugPopulateAllItems />
                    <DebugItemPicker />
                </DevSection>

                <DevSection label="WORLD" hint="any map · any node · the labyrinth · flags" testID="dev-section-world">
                    <DebugWorldTravel />
                    <DebugFlags />
                </DevSection>

                <DevSection label="ENCOUNTERS" hint="quick triggers · any foe · sandbox" testID="dev-section-encounters">
                    <DebugTriggerEncounter />
                    <DebugEnemyPicker />
                    <DebugCombatSandbox />
                </DevSection>

                <DevSection label="MINIGAMES & REWARDS" hint="hazard · rest · anvil · reliquary · journal · cards" testID="dev-section-rewards">
                    <DebugHazardButton />
                    <DebugRestButton />
                    <DebugBlacksmithButton />
                    <DebugRewardTriggers />
                </DevSection>

                <DevSection label="STORY" hint="real NPC trees · real quests" testID="dev-section-story">
                    <DebugDialogueJump />
                    <DebugQuestState />
                </DevSection>

                <DevSection label="UI" hint="aesthetic" testID="dev-section-ui">
                    <AestheticDevToggle />
                </DevSection>

                <DevSection label="RUN & DIAGNOSTICS" hint="save · reset · galleries · log" testID="dev-section-run">
                    <DebugRunControls />
                    <DebugLogViewer />
                </DevSection>
            </Suspense>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: { gap: 12 },
    section: {
        borderWidth: 1,
        borderColor: AXM.ash,
        borderStyle: 'dashed',
        backgroundColor: AXM.panelBg,
        paddingBottom: 6,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: AXM.ash,
        borderStyle: 'dashed',
        gap: 8,
    },
    sectionLabel: { fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 2, color: AXM.sulfur },
    sectionHint: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone, flexShrink: 1, textAlign: 'right' },
    sectionBody: { paddingTop: 4 },
}));
