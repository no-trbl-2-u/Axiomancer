/**
 * Phase 71 — encounter-seal chrome presenter.
 *
 * The encounter modal seal renders top + bottom `SEALED` chain
 * bars + a panel border + a soft glow. Pre-Phase-71 those were
 * static (blood + "SEALED · NO RETREAT" forever); the design's
 * `PtEncounterFlow` chrome (handoff bundle `prototype.jsx:558-617`)
 * swaps them per phase to carry the "the seal is waking up"
 * signal at outcome.
 *
 * Three states:
 *   - prelude   — blood border + glow, "SEALED · AT ARMS" top,
 *                 "NO RETREAT" bottom.
 *   - combat    — blood border + glow, "SEALED · ROUND I/II/III"
 *                 top, "NO RETREAT" bottom. Round labels use
 *                 lowercase Roman (i, ii, iii) — matches the
 *                 bundle's lowercase-roman numeral rule for
 *                 chronicle counts.
 *   - aftermath — sulfur border + glow, "IT IS DONE" top,
 *                 "CARRY ON" bottom. The visual change tells the
 *                 player the seal is about to release.
 *
 * Per Hard Rule #8 — no display literals at the view layer. The
 * label strings live here; the view consumes them via the
 * `EncounterSealChrome` shape.
 */

import { currentPalette } from '@/theme/runtime';
import { toRomanLower } from './roman';

export type EncounterSealMode = 'prelude' | 'combat' | 'aftermath';

export interface EncounterSealChrome {
    /** Top chain-bar label (e.g. "SEALED · AT ARMS"). */
    topLabel: string;
    /** Bottom chain-bar label (e.g. "NO RETREAT" or "CARRY ON"). */
    bottomLabel: string;
    /** Hex color for the chain text, chain rule, and panel border. */
    accentColor: string;
    /** Soft outer-glow color (rgba) for the panel's shadow. */
    glowColor: string;
}

// Lowercase Roman helper consolidated into `./roman`. The
// `·` fallback for `n <= 0` is preserved by passing `'·'` as
// the second arg at the call site.

const BLOOD_GLOW = 'rgba(192, 21, 42, 0.35)';
const SULFUR_GLOW = 'rgba(212, 192, 38, 0.30)';

/**
 * Build the chrome shape for the encounter seal's current state.
 *
 * - `mode`  — modal phase (prelude / combat / aftermath).
 * - `round` — current combat round (1+). Only consulted in combat
 *             mode; the prelude / aftermath labels are
 *             round-independent. Default 1.
 *
 * The aftermath branch only carries one signal — the seal is
 * resolving — so we don't disambiguate on outcome here (victory /
 * parley / defeat all wake the seal the same way; the panel's
 * own chrome carries the per-outcome accents).
 */
export function selectEncounterSealChrome(
    mode: EncounterSealMode,
    round: number = 1,
): EncounterSealChrome {
    // Live palette so the seal's accent tracks the active theme; the
    // consuming view subscribes and re-renders on switch.
    const AXM = currentPalette();
    if (mode === 'aftermath') {
        return {
            topLabel: 'IT IS DONE',
            bottomLabel: 'CARRY ON',
            accentColor: AXM.sulfur,
            glowColor: SULFUR_GLOW,
        };
    }
    if (mode === 'combat') {
        return {
            topLabel: `SEALED · ROUND ${toRomanLower(round, '·')}`,
            bottomLabel: 'NO RETREAT',
            accentColor: AXM.blood,
            glowColor: BLOOD_GLOW,
        };
    }
    // prelude
    return {
        topLabel: 'SEALED · AT ARMS',
        bottomLabel: 'NO RETREAT',
        accentColor: AXM.blood,
        glowColor: BLOOD_GLOW,
    };
}
