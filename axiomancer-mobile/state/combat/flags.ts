/**
 * Spec 33 — combat flags. THE FLIP (owner call, 2026-07-18): every app build
 * — dev, preview, store — now boots the Upgradeable-Dice model ON. The
 * mechanics-package default stays OFF so tests/sims keep toggling both models
 * per-suite; this module is where the APP commits to the new dice.
 *
 * Kill-switch (explicit opt-OUT, for triage only):
 *   · bundle-time: `EXPO_PUBLIC_UPGRADEABLE_DICE=0`
 *   · runtime:     `globalThis.__AXM_UPGRADEABLE_DICE__ = '0'` (or 0 / false),
 *     set BEFORE the combat surface boots — the legacy-flow e2e harnesses use
 *     this to keep exercising the pre-spec-33 model while it still exists.
 *
 * The env read MUST stay a static `process.env.EXPO_PUBLIC_*` member
 * expression — Expo inlines these at bundle time; an indirect/dynamic read
 * would be undefined at runtime on device. The runtime global mirrors the
 * `__AXM_COMBAT_SEED__` / `__AXM_COMBAT_DECK__` test-global pattern in
 * `app/combat-encounter/index.tsx` — inert in production (nothing sets it).
 */

import { setUpgradeableDice } from '@mechanics';

/** True when the runtime global explicitly opts OUT (`false`, `0`, or `'0'`). */
function runtimeOptOut(): boolean {
    const g = (globalThis as { __AXM_UPGRADEABLE_DICE__?: unknown }).__AXM_UPGRADEABLE_DICE__;
    return g === false || g === 0 || g === '0';
}

/** Applies combat flags at app root. Upgradeable Dice defaults ON for every
 *  build; only the explicit `0` kill-switch (env or runtime global) keeps the
 *  legacy model. A test/dev harness may call this again after setting the
 *  runtime global to re-resolve the flag for that run. */
export function applyCombatFlagsFromEnv(): void {
    const off = process.env.EXPO_PUBLIC_UPGRADEABLE_DICE === '0' || runtimeOptOut();
    setUpgradeableDice(!off);
}
