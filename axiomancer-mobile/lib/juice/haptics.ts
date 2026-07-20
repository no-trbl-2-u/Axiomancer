import * as Haptics from 'expo-haptics';

/**
 * The single wrapper every juice/combat call site fires haptics through —
 * the Expo-decouple swap point (phase 38 brief §"Inputs"). Preserves the
 * house `.catch(() => undefined)` never-throw idiom used at every existing
 * `expo-haptics` call site.
 */
export const juiceHaptics = {
    impact(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light): void {
        Haptics.impactAsync(style).catch(() => undefined);
    },
    notify(type: Haptics.NotificationFeedbackType): void {
        Haptics.notificationAsync(type).catch(() => undefined);
    },
};
