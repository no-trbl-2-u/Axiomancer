/**
 * Grouped dev-tools surface (Phase 132 — dev menu tab extraction).
 *
 * Before Phase 132 every Debug* affordance lived flat inside
 * `DebugComponentsLazy`, rendered through the collapsible `DevMenu`
 * dropdown at the bottom of the SELF tab. That made the SELF screen a
 * debug junk drawer and — with the Phase 131 evidence presets — too
 * noisy to scan.
 *
 * This component keeps the lazy-load / bundle-split contract
 * (`DebugComponentsLazy`'s reason for existing — production never
 * imports the Debug* modules) but reorganizes the same controls into
 * audit-friendly sections for the dedicated `/dev` route. No controls
 * are pruned: every component `DebugComponentsLazy` rendered is
 * rendered here, just grouped and ordered. T's later visual audit
 * decides what to remove (Phase 132 follow-up).
 *
 * Production gate: returns `null` outside dev builds. The children also
 * self-gate, but the container gate keeps the whole surface inert.
 */

import React, { Suspense, lazy } from 'react';
import { Text, View } from 'react-native';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

const DebugCombatEncounterButton = lazy(() => import('@/components/DebugCombatEncounterButton').then(m => ({ default: m.DebugCombatEncounterButton })));
const DebugCombatTutorialButton = lazy(() => import('@/components/DebugCombatTutorialButton').then(m => ({ default: m.DebugCombatTutorialButton })));
const DebugHazardButton = lazy(() => import('@/components/DebugHazardButton').then(m => ({ default: m.DebugHazardButton })));
const DebugHazardDeckRandomize = lazy(() => import('@/components/DebugHazardDeckRandomize').then(m => ({ default: m.DebugHazardDeckRandomize })));
const DebugGatheringButton = lazy(() => import('@/components/DebugGatheringButton').then(m => ({ default: m.DebugGatheringButton })));
const DebugEncounterButtons = lazy(() => import('@/components/DebugEncounterButtons').then(m => ({ default: m.DebugEncounterButtons })));
const DebugAlignmentShift = lazy(() => import('@/components/DebugAlignmentShift').then(m => ({ default: m.DebugAlignmentShift })));
const DebugCurrencyControl = lazy(() => import('@/components/DebugCurrencyControl').then(m => ({ default: m.DebugCurrencyControl })));
const DebugDialogueJump = lazy(() => import('@/components/DebugDialogueJump').then(m => ({ default: m.DebugDialogueJump })));
const DebugCombatDeck = lazy(() => import('@/components/DebugCombatDeck').then(m => ({ default: m.DebugCombatDeck })));
const DebugEffectApply = lazy(() => import('@/components/DebugEffectApply').then(m => ({ default: m.DebugEffectApply })));
const DebugQuestState = lazy(() => import('@/components/DebugQuestState').then(m => ({ default: m.DebugQuestState })));
const DebugTriggerEncounter = lazy(() => import('@/components/DebugTriggerEncounter').then(m => ({ default: m.DebugTriggerEncounter })));
const DebugHudOverrides = lazy(() => import('@/components/DebugHudOverrides').then(m => ({ default: m.DebugHudOverrides })));
const DebugMapResetButton = lazy(() => import('@/components/DebugMapResetButton').then(m => ({ default: m.DebugMapResetButton })));
const DebugPlaythroughPresets = lazy(() => import('@/components/DebugPlaythroughPresets').then(m => ({ default: m.DebugPlaythroughPresets })));
const DebugPresetPicker = lazy(() => import('@/components/DebugPresetPicker').then(m => ({ default: m.DebugPresetPicker })));
const DebugPopulateAllItems = lazy(() => import('@/components/DebugPopulateAllItems').then(m => ({ default: m.DebugPopulateAllItems })));
const DebugAddItemById = lazy(() => import('@/components/DebugAddItemById').then(m => ({ default: m.DebugAddItemById })));
const DebugLootRarityButtons = lazy(() => import('@/components/DebugLootRarityButtons').then(m => ({ default: m.DebugLootRarityButtons })));
const DebugPlayerTierPresets = lazy(() => import('@/components/DebugPlayerTierPresets').then(m => ({ default: m.DebugPlayerTierPresets })));
const DebugSeedButton = lazy(() => import('@/components/DebugSeedButton').then(m => ({ default: m.DebugSeedButton })));
const DebugXpGrant = lazy(() => import('@/components/DebugXpGrant').then(m => ({ default: m.DebugXpGrant })));
const AestheticDevToggle = lazy(() => import('@/components/AestheticDevToggle').then(m => ({ default: m.AestheticDevToggle })));

function LoadingFallback() {
    const AXM = usePalette();
    return (
        <View style={{ padding: 8 }} testID="dev-tools-loading">
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone }}>
                Loading debug tools...
            </Text>
        </View>
    );
}

function DevSection({
    label,
    testID,
    children,
}: {
    label: string;
    testID: string;
    children: React.ReactNode;
}) {
    const styles = useStyles();
    return (
        <View style={styles.section} testID={testID}>
            <Text style={styles.sectionLabel}>{label}</Text>
            <View style={styles.sectionBody}>{children}</View>
        </View>
    );
}

/**
 * Grouped dev controls. Mounted by the `/dev` route. Sections mirror
 * the Phase 132 brief's audit groupings; component order within a
 * section preserves the prior flat order so existing automation and
 * muscle memory stay close to stable.
 */
export function DevToolsSections() {
    const styles = useStyles();
    if (!isDevToolsEnabled()) return null;

    return (
        <View style={styles.root} testID="dev-tools-sections">
            <Suspense fallback={<LoadingFallback />}>
                <DevSection label="PLAYTHROUGH PRESETS" testID="dev-section-presets">
                    <DebugPresetPicker />
                    <DebugPlaythroughPresets />
                    <DebugPlayerTierPresets />
                    <DebugSeedButton />
                </DevSection>

                <DevSection label="ENCOUNTER TRIGGERS" testID="dev-section-encounters">
                    <DebugTriggerEncounter />
                    <DebugEncounterButtons />
                    <DebugCombatEncounterButton />
                    <DebugCombatTutorialButton />
                </DevSection>

                <DevSection label="HAZARD SETUP" testID="dev-section-hazard">
                    <DebugHazardButton />
                    <DebugHazardDeckRandomize />
                </DevSection>

                <DevSection label="GATHERING SETUP" testID="dev-section-gathering">
                    <DebugGatheringButton />
                </DevSection>

                <DevSection label="COMBAT SETUP" testID="dev-section-combat">
                    <DebugCombatDeck />
                    <DebugEffectApply />
                </DevSection>

                <DevSection label="INVENTORY & ITEM TOOLS" testID="dev-section-inventory">
                    <DebugPopulateAllItems />
                    <DebugLootRarityButtons />
                    <DebugAddItemById />
                    <DebugCurrencyControl />
                    <DebugXpGrant />
                </DevSection>

                <DevSection label="WORLD & STORY TOOLS" testID="dev-section-world">
                    <DebugMapResetButton />
                    <DebugAlignmentShift />
                    <DebugDialogueJump />
                    <DebugQuestState />
                </DevSection>

                <DevSection label="MISC & SYSTEM" testID="dev-section-system">
                    <AestheticDevToggle />
                    <DebugHudOverrides />
                </DevSection>
            </Suspense>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: {
        gap: 12,
    },
    section: {
        borderWidth: 1,
        borderColor: AXM.ash,
        borderStyle: 'dashed',
        backgroundColor: AXM.panelBg,
        paddingBottom: 6,
    },
    sectionLabel: {
        fontFamily: FONTS.mono,
        fontSize: 11,
        letterSpacing: 2,
        color: AXM.sulfur,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: AXM.ash,
        borderStyle: 'dashed',
    },
    sectionBody: {
        paddingTop: 4,
    },
}));
