import { trigger, HapticFeedbackTypes } from 'react-native-haptic-feedback';

import { settingsStore } from '@/state/settings';

/**
 * The Expo-decouple swap for haptics (phase 47d). Backed by
 * `react-native-haptic-feedback`, the bare-RN library the build-plan
 * row named. It ships its own `.web.js` implementation using the Web
 * Vibration API (`navigator.vibrate()`) — the same API
 * `expo-haptics`' own `ExpoHaptics.web.ts` used, so web behavior (the
 * only end-to-end-testable platform in this repo today) stays a real
 * vibration call, just with re-tuned pulse durations, not a
 * regression to silence. The native path (an iOS/Android TurboModule,
 * `codegenSpec/NativeHapticFeedback`) is unverified here — no native
 * project exists yet to run it against (that's 47e's prebuild); it
 * throws synchronously at import time under Jest too
 * (`TurboModuleRegistry.getEnforcing` finds nothing), which is why
 * `jest.setup.ts` mocks this package globally now instead of
 * `expo-haptics`. See phase 47d brief "Decisions".
 *
 * `Haptics` keeps the `Haptics.impactAsync(...)` /
 * `Haptics.ImpactFeedbackStyle.Light` call-site shape every existing
 * caller already uses (`import { Haptics } from
 * '@/lib/platform/haptics'`, unchanged since phase 47a) — this is now
 * a plain object, not a namespace import, so the two call sites that
 * used `Haptics.ImpactFeedbackStyle` as a *type* annotation import
 * the enum directly instead (see brief).
 */
export enum ImpactFeedbackStyle {
    Light = 'light',
    Medium = 'medium',
    Heavy = 'heavy',
    Soft = 'soft',
    Rigid = 'rigid',
}

export enum NotificationFeedbackType {
    Success = 'success',
    Warning = 'warning',
    Error = 'error',
}

const IMPACT_TYPE: Record<ImpactFeedbackStyle, HapticFeedbackTypes> = {
    [ImpactFeedbackStyle.Light]: HapticFeedbackTypes.impactLight,
    [ImpactFeedbackStyle.Medium]: HapticFeedbackTypes.impactMedium,
    [ImpactFeedbackStyle.Heavy]: HapticFeedbackTypes.impactHeavy,
    [ImpactFeedbackStyle.Soft]: HapticFeedbackTypes.soft,
    [ImpactFeedbackStyle.Rigid]: HapticFeedbackTypes.rigid,
};

const NOTIFICATION_TYPE: Record<NotificationFeedbackType, HapticFeedbackTypes> = {
    [NotificationFeedbackType.Success]: HapticFeedbackTypes.notificationSuccess,
    [NotificationFeedbackType.Warning]: HapticFeedbackTypes.notificationWarning,
    [NotificationFeedbackType.Error]: HapticFeedbackTypes.notificationError,
};

/**
 * May we fire a haptic right now?
 *
 * @returns false when the player switched HAPTICS off in SETTINGS
 *   (2026-09-23; read synchronously from `settingsStore`), or on a web
 *   runtime that reports the document has never received a user gesture;
 *   true everywhere else.
 *
 * FE-012: the web backend calls `navigator.vibrate()`, which Chromium refuses
 * before the first gesture and logs as a console ERROR each time — "Blocked
 * call to navigator.vibrate because user hasn't tapped on the frame or any
 * embedded frame yet". Screens that pulse on mount (the combat board, the
 * hazard entry) fired it cold, so every capture of those screens carried the
 * error at both viewports. The call could never have vibrated anything at
 * that moment, so skipping it loses no feedback and clears the log.
 *
 * Platforms without `navigator.userActivation` (native, older browsers) fall
 * through to true and behave exactly as before.
 *
 * Pure read of runtime state; no mutation.
 */
function hapticsAllowed(): boolean {
    if (!settingsStore.get().haptics) return false;
    const activation = (globalThis as {
        navigator?: { userActivation?: { hasBeenActive?: boolean } };
    }).navigator?.userActivation;
    if (activation && typeof activation.hasBeenActive === 'boolean') {
        return activation.hasBeenActive;
    }
    return true;
}

async function impactAsync(style: ImpactFeedbackStyle = ImpactFeedbackStyle.Light): Promise<void> {
    if (!hapticsAllowed()) return;
    trigger(IMPACT_TYPE[style]);
}

async function notificationAsync(type: NotificationFeedbackType): Promise<void> {
    if (!hapticsAllowed()) return;
    trigger(NOTIFICATION_TYPE[type]);
}

async function selectionAsync(): Promise<void> {
    if (!hapticsAllowed()) return;
    trigger(HapticFeedbackTypes.selection);
}

export const Haptics = {
    impactAsync,
    notificationAsync,
    selectionAsync,
    ImpactFeedbackStyle,
    NotificationFeedbackType,
};
