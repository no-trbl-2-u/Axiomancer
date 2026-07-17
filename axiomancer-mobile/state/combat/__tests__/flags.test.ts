/**
 * Spec 33 — build-time combat flags: the preview opt-in for Upgradeable Dice.
 * The env read is inlined by Expo on device; in Jest the real process.env is
 * read at call time, so the hook is pinned directly.
 */

import { isUpgradeableDiceEnabled, setUpgradeableDice } from '@mechanics';
import { applyCombatFlagsFromEnv } from '../flags';

const KEY = 'EXPO_PUBLIC_UPGRADEABLE_DICE';

describe('applyCombatFlagsFromEnv', () => {
    const prior = process.env[KEY];

    afterEach(() => {
        if (prior === undefined) delete process.env[KEY];
        else process.env[KEY] = prior;
        setUpgradeableDice(false);
    });

    it('leaves the engine flag OFF when the env var is unset', () => {
        delete process.env[KEY];
        applyCombatFlagsFromEnv();
        expect(isUpgradeableDiceEnabled()).toBe(false);
    });

    it('leaves the flag OFF for any value other than "1"', () => {
        process.env[KEY] = '0';
        applyCombatFlagsFromEnv();
        expect(isUpgradeableDiceEnabled()).toBe(false);
    });

    it('flips the engine flag ON when the preview build sets "1"', () => {
        process.env[KEY] = '1';
        applyCombatFlagsFromEnv();
        expect(isUpgradeableDiceEnabled()).toBe(true);
    });
});
