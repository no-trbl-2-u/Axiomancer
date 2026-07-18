/**
 * Spec 33 (Phase D2 follow-up) — build-time combat flags.
 *
 * The Upgradeable-Dice model ships flag-OFF by default everywhere (CI, tests,
 * sims, store builds stay byte-identical). Preview builds opt in via
 * `EXPO_PUBLIC_UPGRADEABLE_DICE=1` (set in `eas.json`'s preview profile) so
 * the owner sees each D-phase's work land as it ships, ahead of the D7
 * flag-flip decision.
 *
 * The env read MUST stay a static `process.env.EXPO_PUBLIC_*` member
 * expression — Expo inlines these at bundle time; an indirect/dynamic read
 * would be undefined at runtime on device.
 *
 * Spec 33 (Phase D6a) — a RUNTIME escape hatch beside the bundle-time env:
 * `globalThis.__AXM_UPGRADEABLE_DICE__`. The bundle-time env can only decide
 * the flag at build; a browser/e2e harness (D6d) needs to flip it per-run
 * BEFORE the combat surface boots. This mirrors the `__AXM_COMBAT_SEED__` /
 * `__AXM_COMBAT_DECK__` test-global pattern in `app/combat-encounter/index.tsx`
 * — inert in production (nothing sets the global there).
 */

import { setUpgradeableDice } from '@mechanics';

/** True for the runtime opt-in global (`true`, `1`, or `'1'`) — the dev/e2e
 *  enabler that the bundle-time env can't provide (it's fixed at build). */
function runtimeUpgradeableDice(): boolean {
    const g = (globalThis as { __AXM_UPGRADEABLE_DICE__?: unknown }).__AXM_UPGRADEABLE_DICE__;
    return g === true || g === 1 || g === '1';
}

/** Applies build-time (and runtime-global) combat flags to the engine. Called
 *  once at app root; a test/dev harness may also call it after setting the
 *  runtime global to flip the flag on for that run. */
export function applyCombatFlagsFromEnv(): void {
    if (process.env.EXPO_PUBLIC_UPGRADEABLE_DICE === '1' || runtimeUpgradeableDice()) {
        setUpgradeableDice(true);
    }
}
