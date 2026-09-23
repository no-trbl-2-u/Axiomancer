/**
 * MainMenu — the first screen after the title (owner call 2026-09-23):
 * CONTINUE (most recent slot) · NEW GAME · LOAD GAME · SETTINGS.
 *
 * Presentation only. The view-model comes from `selectMainMenuViewModel`
 * over the live slot summaries; the verbs are the callbacks the index
 * route binds to the slot actions and the router.
 *
 * Inputs: `onContinue`, `onNewGame`, `onLoadGame`, `onSettings`.
 * Output: the menu panel. Owns no state.
 */

import React from 'react';
import { Text, View } from 'react-native';

import { MenuButton } from '@/components/menu/MenuButton';
import { useSaveSlotSummaries } from '@/state/SaveSlotsProvider';
import { MAIN_MENU_COPY, selectMainMenuViewModel } from '@/state/presenters/main-menu.engine';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export interface MainMenuProps {
    onContinue: () => void;
    onNewGame: () => void;
    onLoadGame: () => void;
    onSettings: () => void;
    /** Clock for the CONTINUE stamp. Injectable for tests. */
    now?: () => number;
}

export function MainMenu({ onContinue, onNewGame, onLoadGame, onSettings, now = Date.now }: MainMenuProps) {
    const styles = useStyles();
    const summaries = useSaveSlotSummaries();
    const vm = selectMainMenuViewModel(summaries, now());

    return (
        <View style={styles.root} testID="main-menu">
            <View style={styles.header}>
                <Text style={styles.eyebrow}>{MAIN_MENU_COPY.eyebrow}</Text>
                <Text style={styles.title}>{MAIN_MENU_COPY.title}</Text>
            </View>
            <View style={styles.buttons}>
                {vm.continue.enabled ? (
                    <MenuButton
                        label={MAIN_MENU_COPY.continue}
                        hint={vm.continue.hint}
                        onPress={onContinue}
                        primary
                        testID="main-menu-continue"
                    />
                ) : null}
                <MenuButton
                    label={MAIN_MENU_COPY.newGame}
                    hint={vm.newGame.hint}
                    onPress={onNewGame}
                    primary={!vm.continue.enabled}
                    testID="main-menu-new-game"
                />
                <MenuButton
                    label={MAIN_MENU_COPY.loadGame}
                    hint={vm.loadGame.hint}
                    onPress={onLoadGame}
                    disabled={!vm.loadGame.enabled}
                    testID="main-menu-load-game"
                />
                <MenuButton
                    label={MAIN_MENU_COPY.settings}
                    hint={vm.settings.hint}
                    onPress={onSettings}
                    testID="main-menu-settings"
                />
            </View>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: {
        flex: 1,
        backgroundColor: AXM.bg,
        justifyContent: 'flex-end',
        paddingHorizontal: 24,
        paddingBottom: 48,
        paddingTop: 48,
    },
    header: { alignItems: 'center', marginBottom: 28 },
    eyebrow: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        letterSpacing: 3,
        color: AXM.bone,
    },
    title: {
        fontFamily: FONTS.gothic,
        fontSize: 30,
        color: AXM.parchment,
        marginTop: 6,
        textAlign: 'center',
    },
    buttons: { gap: 10 },
}));
