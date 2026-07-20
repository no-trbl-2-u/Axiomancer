import { describe, expect, it, jest } from '@jest/globals';
import * as Haptics from 'expo-haptics';

import { juiceHaptics } from '../haptics';

describe('juiceHaptics', () => {
    it('impact fires expo-haptics impactAsync and never throws on rejection', async () => {
        const spy = jest.spyOn(Haptics, 'impactAsync').mockReturnValue(Promise.reject(new Error('no haptics engine')));
        expect(() => juiceHaptics.impact(Haptics.ImpactFeedbackStyle.Heavy)).not.toThrow();
        expect(spy).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
        spy.mockRestore();
    });

    it('impact defaults to Light', () => {
        const spy = jest.spyOn(Haptics, 'impactAsync').mockReturnValue(Promise.resolve());
        juiceHaptics.impact();
        expect(spy).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
        spy.mockRestore();
    });

    it('notify fires expo-haptics notificationAsync and never throws on rejection', () => {
        const spy = jest.spyOn(Haptics, 'notificationAsync').mockReturnValue(Promise.reject(new Error('no haptics engine')));
        expect(() => juiceHaptics.notify(Haptics.NotificationFeedbackType.Error)).not.toThrow();
        expect(spy).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Error);
        spy.mockRestore();
    });
});
