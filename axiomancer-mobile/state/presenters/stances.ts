/**
 * Shared `STANCES` constant.
 *
 * Consolidates 7 pre-existing sites that wrote
 * `['heart', 'body', 'mind']` inline or as a local named const.
 * Engine exports the `Stance` type union but no constant array,
 * so this lives mobile-side as the canonical iteration source.
 *
 * Ordering — `heart` → `body` → `mind` — matches the design's
 * STAND-phase picker layout (left-to-right) and the engine's
 * resolution-triangle convention. Don't reorder without
 * checking the picker / phase-stack rendering.
 */

import type { Stance } from 'axiomancer-mechanics';

export const STANCES: readonly Stance[] = ['heart', 'body', 'mind'] as const;
