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
 */

import { setUpgradeableDice } from '@mechanics';

/** Applies build-time combat flags to the engine. Called once at app root. */
export function applyCombatFlagsFromEnv(): void {
    if (process.env.EXPO_PUBLIC_UPGRADEABLE_DICE === '1') {
        setUpgradeableDice(true);
    }
}
