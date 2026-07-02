/**
 * Runtime theme switching (theming-hot-reload 2026-06).
 *
 * The active palette is now a live value (see `theme/runtime.tsx`), so
 * switching no longer reloads the bundle — it swaps the palette and
 * notifies subscribers, re-painting the UI in place on web and native.
 *
 * This module is kept as the stable public entry point; it re-exports
 * the runtime store's switcher and active-id accessor so existing
 * importers keep working.
 */

export { getActiveThemeId, setActiveTheme } from './runtime';
