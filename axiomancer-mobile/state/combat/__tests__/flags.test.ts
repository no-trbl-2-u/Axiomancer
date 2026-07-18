/**
 * Spec 33 — build-time combat flags: the preview opt-in for Upgradeable Dice.
 * The env read is inlined by Expo on device; in Jest the real process.env is
 * read at call time, so the hook is pinned directly.
 */

import { isUpgradeableDiceEnabled, setUpgradeableDice } from '@mechanics';
import { applyCombatFlagsFromEnv } from '../flags';

const KEY = 'EXPO_PUBLIC_UPGRADEABLE_DICE';
const RUNTIME = '__AXM_UPGRADEABLE_DICE__';

describe('applyCombatFlagsFromEnv', () => {
    const prior = process.env[KEY];

    afterEach(() => {
        if (prior === undefined) delete process.env[KEY];
        else process.env[KEY] = prior;
        delete (globalThis as Record<string, unknown>)[RUNTIME];
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

    // Spec 33 (Phase D6a) — the RUNTIME escape hatch a browser/e2e harness (D6d)
    // uses to flip the flag per-run, which the bundle-time env can't provide.
    it('flips the flag ON when the runtime global is set (true / 1 / "1")', () => {
        delete process.env[KEY];
        for (const v of [true, 1, '1']) {
            setUpgradeableDice(false);
            (globalThis as Record<string, unknown>)[RUNTIME] = v;
            applyCombatFlagsFromEnv();
            expect(isUpgradeableDiceEnabled()).toBe(true);
        }
    });

    it('leaves the flag OFF for a falsy / other runtime-global value', () => {
        delete process.env[KEY];
        for (const v of [false, 0, '0', 'yes']) {
            (globalThis as Record<string, unknown>)[RUNTIME] = v;
            applyCombatFlagsFromEnv();
            expect(isUpgradeableDiceEnabled()).toBe(false);
        }
    });
});
