/**
 * Exploration codex presenter — Phase 50 tick D.
 *
 * Pure helpers consumed by `app/(tabs)/exploration/index.tsx` when
 * `useAesthetic()` returns `'codex'`. Composes the mono header
 * strip that the design source places at the top of the codex
 * exploration variant.
 *
 * Design source: `design/handoff-2026-05-16/project/app.jsx`
 * `function ScreenWildsCodex` — the `REGION/... · DAY=... ·
 * STATE=...` line at the top. Mobile doesn't carry a day counter
 * yet (engine-gated — see `design-spec.md` item 14 and
 * `plan/AUDIT.md`), so the strip renders only what the
 * exploration VM actually exposes: region + current-node id.
 */

import type { ExplorationViewModel } from './exploration.engine';

export interface ExplorationCodexHeader {
    /** Left token, e.g. `REGION/NORTHERN.FOREST`. */
    left: string;
    /** Right token, e.g. `NODE/NF.1`. */
    right: string;
}

/** Codex slug helper — uppercase, hyphens/whitespace/underscores → dots,
 * strip non-[A-Z0-9.], collapse dot-runs, trim edge dots. Matches the
 * combat-side slug rule (`selectCodexEnemySlug`) in spirit but stays
 * here so the modules don't cross-import. */
function toCodexToken(value: string): string {
    return value
        .toUpperCase()
        .replace(/[\s_-]+/g, '.')
        .replace(/[^A-Z0-9.]/g, '')
        .replace(/\.+/g, '.')
        .replace(/^\.|\.$/g, '');
}

/**
 * Compose the codex header tokens for exploration. Left side reads
 * `REGION/<region-slug>`; right side reads `NODE/<currentNodeId-slug>`.
 * Both run through the same slug normalization so multi-word names
 * render as `THE.ASH.MARCHES` rather than `THE ASH MARCHES`.
 */
export function selectExplorationCodexHeader(
    vm: ExplorationViewModel,
): ExplorationCodexHeader {
    const region = toCodexToken(vm.region) || 'UNKNOWN';
    const node = toCodexToken(vm.currentNodeId) || 'NONE';
    return {
        left: `REGION/${region}`,
        right: `NODE/${node}`,
    };
}
