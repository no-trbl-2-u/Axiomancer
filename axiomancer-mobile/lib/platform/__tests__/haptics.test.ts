/**
 * FE-012 — haptics must not fire before the page has a user gesture.
 *
 * The web backend calls `navigator.vibrate()`, which Chromium blocks and logs
 * as a console ERROR until the first tap. Screens that pulse on mount (combat
 * board, hazard entry) fired it cold, so every capture of those screens
 * carried the error at both viewports.
 */

import { trigger } from 'react-native-haptic-feedback';

import { Haptics, ImpactFeedbackStyle, NotificationFeedbackType } from '../haptics';

const mockedTrigger = trigger as unknown as jest.Mock;

/** Install a `navigator.userActivation` with the given history. */
function setActivation(hasBeenActive: boolean | undefined) {
    const nav = globalThis.navigator as unknown as Record<string, unknown>;
    if (hasBeenActive === undefined) {
        delete nav.userActivation;
        return;
    }
    Object.defineProperty(nav, 'userActivation', {
        value: { hasBeenActive },
        configurable: true,
        writable: true,
    });
}

afterEach(() => {
    setActivation(undefined);
    mockedTrigger.mockClear();
});

describe('haptics user-activation gate', () => {
    it('skips every haptic before the first gesture', async () => {
        setActivation(false);

        await Haptics.impactAsync(ImpactFeedbackStyle.Light);
        await Haptics.notificationAsync(NotificationFeedbackType.Success);
        await Haptics.selectionAsync();

        expect(mockedTrigger).not.toHaveBeenCalled();
    });

    it('fires normally once the page has been interacted with', async () => {
        setActivation(true);

        await Haptics.impactAsync(ImpactFeedbackStyle.Heavy);
        await Haptics.notificationAsync(NotificationFeedbackType.Error);
        await Haptics.selectionAsync();

        expect(mockedTrigger).toHaveBeenCalledTimes(3);
    });

    it('fires on a runtime with no userActivation API at all (native, older browsers)', async () => {
        setActivation(undefined);

        await Haptics.impactAsync();

        expect(mockedTrigger).toHaveBeenCalledTimes(1);
    });
});
