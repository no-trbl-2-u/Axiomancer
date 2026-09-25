import { type Palette } from './palette';
import { currentPalette, getActiveThemeId } from './runtime';

/**
 * The active theme id at module-load. Exported for backward compat and
 * non-reactive callers; React code that must track switches should use
 * `useThemeId()` from `theme/runtime` instead.
 */
export const ACTIVE_THEME_ID = getActiveThemeId();

/**
 * Canonical colour palette — a **static snapshot** of the active theme
 * at module-load. Retained for non-reactive consumers (engine
 * presenters that snapshot once, fixtures, fallbacks). Reactive UI must
 * read colours via `usePalette()` / `makeStyles()` from `theme/runtime`
 * so they re-paint when the theme switches without a reload. See
 * `theme/palette.ts` for the registry and `theme/runtime.tsx` for the
 * live store.
 */
export const AXM: Palette = currentPalette();

export const FONTS = {
  gothic: 'PirataOne_400Regular',
  serif: 'IMFellEnglish_400Regular',
  serifItalic: 'IMFellEnglish_400Regular_Italic',
  sans: 'BebasNeue_400Regular',
  mono: 'JetBrainsMono_400Regular',
  // Fallback fonts for progressive loading
  sansFallback: 'System',
  monoFallback: 'Courier',
};

export const TYPE = {
  display: { fontFamily: FONTS.gothic, fontSize: 32, lineHeight: 38, letterSpacing: 0.5 },
  h1: { fontFamily: FONTS.gothic, fontSize: 24, lineHeight: 30, letterSpacing: 0.3 },
  h2: { fontFamily: FONTS.serif, fontSize: 20, lineHeight: 26, letterSpacing: 0.2 },
  body: { fontFamily: FONTS.serif, fontSize: 16, lineHeight: 22, letterSpacing: 0 },
  caption: { fontFamily: FONTS.sans, fontSize: 14, lineHeight: 18, letterSpacing: 0.1 },
  mono: { fontFamily: FONTS.mono, fontSize: 14, lineHeight: 18, letterSpacing: 0 },
} as const;

// Dynamic type styles with font fallbacks for progressive loading
export function getTypeWithFallbacks(secondaryFontsLoaded: boolean) {
  return {
    display: { fontFamily: FONTS.gothic, fontSize: 32, lineHeight: 38, letterSpacing: 0.5 },
    h1: { fontFamily: FONTS.gothic, fontSize: 24, lineHeight: 30, letterSpacing: 0.3 },
    h2: { fontFamily: FONTS.serif, fontSize: 20, lineHeight: 26, letterSpacing: 0.2 },
    body: { fontFamily: FONTS.serif, fontSize: 16, lineHeight: 22, letterSpacing: 0 },
    caption: { fontFamily: secondaryFontsLoaded ? FONTS.sans : FONTS.sansFallback, fontSize: 14, lineHeight: 18, letterSpacing: 0.1 },
    mono: { fontFamily: secondaryFontsLoaded ? FONTS.mono : FONTS.monoFallback, fontSize: 14, lineHeight: 18, letterSpacing: 0 },
  } as const;
}

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export function rnd(i: number, seed = 1) {
  const x = Math.sin(i * 9301 + seed * 49297) * 233280;
  return x - Math.floor(x);
}
