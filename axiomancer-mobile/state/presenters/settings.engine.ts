/**
 * Presenter — the SETTINGS screen (owner call 2026-09-23).
 *
 * Every line the screen prints and every option list it offers lives here,
 * plus the pure view-model over `PlayerSettings`. The screen renders; it
 * does not author copy or decide option sets.
 *
 * What a NEW PLAYER can change, and why each row exists:
 *   - COLOUR THEME   the five palettes (moved here from the SELF tab);
 *   - TEXT SIZE      four steps; scales every stylesheet's type;
 *   - REDUCED MOTION follow the OS, or force on / off;
 *   - HAPTICS        the pulses on drags, dice and coaches;
 *   - TUTORIAL HINTS the first-time coaches, plus RESET so they run again;
 *   - MUSIC / SOUND  volumes kept for the audio build (nothing plays yet);
 *   - STORY MODE     coming soon — listed so its absence is not a mystery.
 *
 * Functions (lowest → highest abstraction):
 *   volumeStep(value, delta)         clamp a 0–100 step
 *   selectSettingsViewModel(settings, inRun)  the rows
 */

import { TEXT_SCALES, type PlayerSettings, type ReducedMotionPreference, type TextScale } from '../settings';

export const SETTINGS_COPY = Object.freeze({
    eyebrow: 'THE PILGRIM’S PREFERENCES',
    title: 'SETTINGS',
    subtitle: 'kept on this device; a new game never resets them',
    back: 'BACK',
    sections: Object.freeze({
        appearance: 'APPEARANCE',
        motion: 'MOTION & FEEL',
        guidance: 'GUIDANCE',
        sound: 'SOUND',
        story: 'STORY',
        run: 'THE RUN',
        device: 'THIS DEVICE',
    }),
    textSize: 'TEXT SIZE',
    textSizeHint: 'grows every line of type; the chrome holds',
    reducedMotion: 'REDUCED MOTION',
    reducedMotionHint: 'skip the dice ritual, fades and pops',
    haptics: 'HAPTICS',
    hapticsHint: 'the pulse on drags, dice and coaches',
    tutorialHints: 'TUTORIAL HINTS',
    tutorialHintsHint: 'the first-time coaches: combat, crossing, forge, rest',
    resetTutorials: 'RESET TUTORIALS',
    resetTutorialsHint: 'the coaches run again in this chronicle',
    resetTutorialsDone: 'the coaches will run again',
    resetTutorialsNothing: 'nothing to reset yet',
    music: 'MUSIC',
    sfx: 'SOUND EFFECTS',
    soundNote: 'no sound plays yet — these are kept for the build that brings it',
    storyMode: 'STORY MODE',
    storyModeHint: 'a gentler road through the same chronicle — coming soon',
    comingSoon: 'COMING SOON',
    returnToTitle: 'SAVE & RETURN TO TITLE',
    returnToTitleHint: 'the chronicle is written before you leave',
    resetSettings: 'RESET SETTINGS',
    resetSettingsHint: 'back to the defaults; the chronicles are untouched',
    resetSettingsTitle: 'reset every setting?',
    resetSettingsBody: 'theme, text size, motion, haptics, hints and sound return to their defaults. no chronicle is touched.',
    resetSettingsConfirm: 'RESET',
    cancel: 'KEEP IT',
    on: 'ON',
    off: 'OFF',
});

export interface OptionVM<V> {
    readonly value: V;
    readonly label: string;
}

export const TEXT_SCALE_OPTIONS: readonly OptionVM<TextScale>[] = Object.freeze(
    TEXT_SCALES.map((value) => ({
        value,
        label: value === 0.9 ? 'SMALL' : value === 1 ? 'DEFAULT' : value === 1.15 ? 'LARGE' : 'LARGER',
    })),
);

export const REDUCED_MOTION_OPTIONS: readonly OptionVM<ReducedMotionPreference>[] = Object.freeze([
    { value: 'system', label: 'SYSTEM' },
    { value: 'on', label: 'ON' },
    { value: 'off', label: 'OFF' },
]);

export const TOGGLE_OPTIONS: readonly OptionVM<boolean>[] = Object.freeze([
    { value: true, label: SETTINGS_COPY.on },
    { value: false, label: SETTINGS_COPY.off },
]);

/** The volume stepper's increment. */
export const VOLUME_STEP = 10;

/** Clamp `value + delta` into 0–100. Pure. */
export function volumeStep(value: number, delta: number): number {
    return Math.max(0, Math.min(100, value + delta));
}

export interface SettingsViewModel {
    readonly textScale: TextScale;
    readonly reducedMotion: ReducedMotionPreference;
    readonly haptics: boolean;
    readonly tutorialHints: boolean;
    readonly musicVolume: number;
    readonly sfxVolume: number;
    /** `70%` for the stepper readout. */
    readonly musicLabel: string;
    readonly sfxLabel: string;
    /** RESET TUTORIALS and RETURN TO TITLE only make sense inside a run. */
    readonly inRun: boolean;
}

/** The screen's rows. Pure. */
export function selectSettingsViewModel(settings: PlayerSettings, inRun: boolean): SettingsViewModel {
    return {
        textScale: settings.textScale,
        reducedMotion: settings.reducedMotion,
        haptics: settings.haptics,
        tutorialHints: settings.tutorialHints,
        musicVolume: settings.musicVolume,
        sfxVolume: settings.sfxVolume,
        musicLabel: `${settings.musicVolume}%`,
        sfxLabel: `${settings.sfxVolume}%`,
        inRun,
    };
}
