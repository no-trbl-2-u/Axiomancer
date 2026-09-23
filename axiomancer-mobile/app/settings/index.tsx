/**
 * The SETTINGS screen — `/settings` (owner call 2026-09-23).
 *
 * Reached from the main menu and from the SELF tab. Every row is a player
 * preference kept on the device (`state/settings.ts`), except COLOUR THEME,
 * which lives in the theme runtime and is rendered through the same
 * `<ThemeSwitcher>` the SELF tab used to host.
 *
 * Two rows exist only inside a run (the store has an active slot):
 * RESET TUTORIALS (strips the coach flags from THIS chronicle) and
 * SAVE & RETURN TO TITLE (writes the chronicle, then lands on the menu).
 *
 * Copy and option sets: `state/presenters/settings.engine.ts`.
 */

import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ConfirmSheet } from '@/components/menu/ConfirmSheet';
import { MenuButton } from '@/components/menu/MenuButton';
import { OptionRow } from '@/components/menu/OptionRow';
import { StepperRow } from '@/components/menu/StepperRow';
import { ScreenBg } from '@/components/ScreenBg';
import { SectionLabel } from '@/components/SectionLabel';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useRouter } from '@/lib/platform/router';
import { useGameStore } from '@/state/GameStoreProvider';
import { useSaveSlots, useSaveSlotSummaries } from '@/state/SaveSlotsProvider';
import {
    REDUCED_MOTION_OPTIONS,
    SETTINGS_COPY,
    TEXT_SCALE_OPTIONS,
    TOGGLE_OPTIONS,
    VOLUME_STEP,
    selectSettingsViewModel,
    volumeStep,
} from '@/state/presenters/settings.engine';
import { useSettings, useSettingsStore } from '@/state/settings';
import { resetTutorialsAction } from '@/state/tutorials';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

export default function SettingsScreen() {
    const AXM = usePalette();
    const styles = useStyles();
    const router = useRouter();
    const store = useGameStore();
    const settings = useSettings();
    const settingsStore = useSettingsStore();
    const { slots, returnToTitle } = useSaveSlots();
    // Subscribe so `inRun` follows slot selection.
    useSaveSlotSummaries();
    const inRun = slots.getActiveSlot() !== null;
    const vm = selectSettingsViewModel(settings, inRun);

    const [tutorialNote, setTutorialNote] = useState<string | null>(null);
    const [confirmReset, setConfirmReset] = useState(false);

    const onResetTutorials = useCallback(() => {
        const removed = resetTutorialsAction(store);
        setTutorialNote(removed.length > 0 ? SETTINGS_COPY.resetTutorialsDone : SETTINGS_COPY.resetTutorialsNothing);
    }, [store]);

    const onReturnToTitle = useCallback(() => {
        void returnToTitle().then(() => router.replace('/?menu=1'));
    }, [returnToTitle, router]);

    return (
        <ScreenBg>
            <View style={styles.headerRow}>
                <View style={styles.headerText}>
                    <SectionLabel size={10} color={AXM.bone}>{SETTINGS_COPY.eyebrow}</SectionLabel>
                    <Text style={styles.title}>{SETTINGS_COPY.title}</Text>
                    <Text style={styles.subtitle}>{SETTINGS_COPY.subtitle}</Text>
                </View>
                <Pressable
                    style={styles.backBtn}
                    onPress={() => router.back()}
                    accessibilityRole="button"
                    accessibilityLabel={SETTINGS_COPY.back}
                    testID="settings-back"
                >
                    <Text style={styles.backLabel}>✕</Text>
                </Pressable>
            </View>

            <View style={styles.body} testID="settings-screen">
                <SectionLabel size={10} color={AXM.sulfur}>{SETTINGS_COPY.sections.appearance}</SectionLabel>
                <ThemeSwitcher initialExpanded />
                <OptionRow
                    label={SETTINGS_COPY.textSize}
                    hint={SETTINGS_COPY.textSizeHint}
                    options={TEXT_SCALE_OPTIONS}
                    value={vm.textScale}
                    onChange={(textScale) => settingsStore.set({ textScale })}
                    testID="settings-text-scale"
                />

                <SectionLabel size={10} color={AXM.sulfur} style={styles.sectionGap}>{SETTINGS_COPY.sections.motion}</SectionLabel>
                <OptionRow
                    label={SETTINGS_COPY.reducedMotion}
                    hint={SETTINGS_COPY.reducedMotionHint}
                    options={REDUCED_MOTION_OPTIONS}
                    value={vm.reducedMotion}
                    onChange={(reducedMotion) => settingsStore.set({ reducedMotion })}
                    testID="settings-reduced-motion"
                />
                <OptionRow
                    label={SETTINGS_COPY.haptics}
                    hint={SETTINGS_COPY.hapticsHint}
                    options={TOGGLE_OPTIONS}
                    value={vm.haptics}
                    onChange={(haptics) => settingsStore.set({ haptics })}
                    testID="settings-haptics"
                />

                <SectionLabel size={10} color={AXM.sulfur} style={styles.sectionGap}>{SETTINGS_COPY.sections.guidance}</SectionLabel>
                <OptionRow
                    label={SETTINGS_COPY.tutorialHints}
                    hint={SETTINGS_COPY.tutorialHintsHint}
                    options={TOGGLE_OPTIONS}
                    value={vm.tutorialHints}
                    onChange={(tutorialHints) => settingsStore.set({ tutorialHints })}
                    testID="settings-tutorial-hints"
                />
                {vm.inRun ? (
                    <MenuButton
                        label={SETTINGS_COPY.resetTutorials}
                        hint={tutorialNote ?? SETTINGS_COPY.resetTutorialsHint}
                        onPress={onResetTutorials}
                        testID="settings-reset-tutorials"
                    />
                ) : null}

                <SectionLabel size={10} color={AXM.sulfur} style={styles.sectionGap}>{SETTINGS_COPY.sections.sound}</SectionLabel>
                <StepperRow
                    label={SETTINGS_COPY.music}
                    valueLabel={vm.musicLabel}
                    onDecrement={() => settingsStore.set({ musicVolume: volumeStep(vm.musicVolume, -VOLUME_STEP) })}
                    onIncrement={() => settingsStore.set({ musicVolume: volumeStep(vm.musicVolume, VOLUME_STEP) })}
                    atMin={vm.musicVolume <= 0}
                    atMax={vm.musicVolume >= 100}
                    testID="settings-music"
                />
                <StepperRow
                    label={SETTINGS_COPY.sfx}
                    valueLabel={vm.sfxLabel}
                    onDecrement={() => settingsStore.set({ sfxVolume: volumeStep(vm.sfxVolume, -VOLUME_STEP) })}
                    onIncrement={() => settingsStore.set({ sfxVolume: volumeStep(vm.sfxVolume, VOLUME_STEP) })}
                    atMin={vm.sfxVolume <= 0}
                    atMax={vm.sfxVolume >= 100}
                    testID="settings-sfx"
                />
                <Text style={styles.note}>{SETTINGS_COPY.soundNote}</Text>

                <SectionLabel size={10} color={AXM.sulfur} style={styles.sectionGap}>{SETTINGS_COPY.sections.story}</SectionLabel>
                <MenuButton
                    label={`${SETTINGS_COPY.storyMode} · ${SETTINGS_COPY.comingSoon}`}
                    hint={SETTINGS_COPY.storyModeHint}
                    onPress={() => undefined}
                    disabled
                    testID="settings-story-mode"
                />

                {vm.inRun ? (
                    <>
                        <SectionLabel size={10} color={AXM.sulfur} style={styles.sectionGap}>{SETTINGS_COPY.sections.run}</SectionLabel>
                        <MenuButton
                            label={SETTINGS_COPY.returnToTitle}
                            hint={SETTINGS_COPY.returnToTitleHint}
                            onPress={onReturnToTitle}
                            testID="settings-return-to-title"
                        />
                    </>
                ) : null}

                <SectionLabel size={10} color={AXM.sulfur} style={styles.sectionGap}>{SETTINGS_COPY.sections.device}</SectionLabel>
                <MenuButton
                    label={SETTINGS_COPY.resetSettings}
                    hint={SETTINGS_COPY.resetSettingsHint}
                    onPress={() => setConfirmReset(true)}
                    danger
                    testID="settings-reset"
                />
            </View>

            <ConfirmSheet
                visible={confirmReset}
                title={SETTINGS_COPY.resetSettingsTitle}
                body={SETTINGS_COPY.resetSettingsBody}
                confirmLabel={SETTINGS_COPY.resetSettingsConfirm}
                cancelLabel={SETTINGS_COPY.cancel}
                onConfirm={() => { settingsStore.reset(); setConfirmReset(false); }}
                onCancel={() => setConfirmReset(false)}
                testID="settings-reset-confirm"
            />
        </ScreenBg>
    );
}

const useStyles = makeStyles((AXM) => ({
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 6,
    },
    headerText: { flex: 1 },
    title: { fontFamily: FONTS.gothic, fontSize: 22, color: AXM.sulfur, letterSpacing: 1, marginTop: 1 },
    subtitle: { fontFamily: FONTS.serifItalic, fontSize: 12, color: AXM.bone, marginTop: 2 },
    backBtn: {
        width: 40,
        height: 40,
        borderWidth: 1,
        borderColor: AXM.ash,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: AXM.panelBg,
    },
    backLabel: { fontFamily: FONTS.mono, fontSize: 16, color: AXM.bone },
    body: { paddingHorizontal: 12, paddingTop: 6, gap: 8 },
    sectionGap: { marginTop: 14 },
    note: { fontFamily: FONTS.serifItalic, fontSize: 11, color: AXM.bone, paddingHorizontal: 2 },
}));
