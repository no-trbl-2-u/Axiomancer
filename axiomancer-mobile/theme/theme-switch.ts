/**
 * Runtime theme switching.
 *
 * The active palette is a live value (see `theme/runtime.tsx`), so
 * switching swaps the palette and notifies subscribers, re-painting the
 * UI in place on web and native without a reload.
 *
 * This module is the stable public entry point; it re-exports the
 * runtime store's switcher and active-id accessor.
 */

export { getActiveThemeId, setActiveTheme } from './runtime';
