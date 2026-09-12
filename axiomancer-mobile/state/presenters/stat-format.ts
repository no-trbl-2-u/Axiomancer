/**
 * Shared numeric formatting for player-facing stat readouts.
 *
 * Why this module exists (FE-001): `derivedStats.luck` is an ARITHMETIC MEAN
 * of the three base stats, so it is a float far more often than not. Two
 * screens printed it straight into a `<Text>` — the SELF sheet's
 * `LUCK · AVG` row and the combat pilgrim sheet's `LUCK` chip — and a
 * first-time player read `7.666666666666667` as a rendering bug sitting in a
 * column of clean integers.
 *
 * Formatting lives here rather than in either screen because CLAUDE.md keeps
 * player-facing presentation out of components, and because both call sites
 * must agree: the same stat shown two ways is its own finding.
 */

/**
 * Render an averaged stat for display.
 *
 * @param value - the raw averaged stat (may be a float, NaN, or Infinity).
 * @returns a string with at most one decimal place, with a redundant `.0`
 *   trimmed so whole averages read as integers alongside the integer stats
 *   they sit next to (`7.666666666666667` -> `7.7`; `12` -> `12`). A
 *   non-finite input renders as `0`, matching the `?? 0` fallbacks the call
 *   sites already used.
 *
 * Pure: no state, no mutation, same input always yields the same string.
 *
 * Resolves FE-001 (character / combat pilgrim sheet: raw float in LUCK).
 */
export function formatAveragedStat(value: number): string {
    if (!Number.isFinite(value)) return '0';
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
