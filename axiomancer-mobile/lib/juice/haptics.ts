import { Haptics, ImpactFeedbackStyle, NotificationFeedbackType } from '@/lib/platform/haptics';

/**
 * The single wrapper every juice/combat call site fires haptics through —
 * the single swap point for the haptics backend. Preserves the
 * house `.catch(() => undefined)` never-throw idiom used at every existing
 * haptics call site.
 */
export const juiceHaptics = {
    impact(style: ImpactFeedbackStyle = ImpactFeedbackStyle.Light): void {
        Haptics.impactAsync(style).catch(() => undefined);
    },
    notify(type: NotificationFeedbackType): void {
        Haptics.notificationAsync(type).catch(() => undefined);
    },
};
