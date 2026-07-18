/**
 * Spec 33 — combat flags after THE FLIP (owner call, 2026-07-18): every app
 * build boots Upgradeable Dice ON; only the explicit `0` kill-switch (env or
 * runtime global) keeps the legacy model. In Jest the real process.env is
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

    it('flips the engine flag ON by default (env unset — the flip)', () => {
        delete process.env[KEY];
        applyCombatFlagsFromEnv();
        expect(isUpgradeableDiceEnabled()).toBe(true);
    });

    it('stays ON for legacy opt-in values ("1" is now redundant, never harmful)', () => {
        process.env[KEY] = '1';
        applyCombatFlagsFromEnv();
        expect(isUpgradeableDiceEnabled()).toBe(true);
    });

    it('honors the bundle-time kill-switch (env "0")', () => {
        process.env[KEY] = '0';
        applyCombatFlagsFromEnv();
        expect(isUpgradeableDiceEnabled()).toBe(false);
    });

    // The runtime kill-switch: a legacy-flow e2e harness sets the global to
    // '0' BEFORE the combat surface boots to keep exercising the pre-spec-33
    // model while it still exists.
    it('honors the runtime kill-switch (false / 0 / "0")', () => {
        delete process.env[KEY];
        for (const v of [false, 0, '0']) {
            setUpgradeableDice(true);
            (globalThis as Record<string, unknown>)[RUNTIME] = v;
            applyCombatFlagsFromEnv();
            expect(isUpgradeableDiceEnabled()).toBe(false);
        }
    });

    it('stays ON for any non-kill-switch runtime-global value', () => {
        delete process.env[KEY];
        for (const v of [true, 1, '1', 'yes', undefined]) {
            setUpgradeableDice(false);
            (globalThis as Record<string, unknown>)[RUNTIME] = v;
            applyCombatFlagsFromEnv();
            expect(isUpgradeableDiceEnabled()).toBe(true);
        }
    });

    it('re-resolves on a later call (harness flips the global mid-session)', () => {
        delete process.env[KEY];
        applyCombatFlagsFromEnv();
        expect(isUpgradeableDiceEnabled()).toBe(true);
        (globalThis as Record<string, unknown>)[RUNTIME] = '0';
        applyCombatFlagsFromEnv();
        expect(isUpgradeableDiceEnabled()).toBe(false);
    });
});
