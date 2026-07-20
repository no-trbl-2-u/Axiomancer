/**
 * The escape hatch every juice primitive checks before animating — mirrors
 * the D6f `dice-roll-ritual.ts` `__AXM_DICE_INSTANT_SETTLE__` global-flag
 * idiom (itself D6a-hook style). Set by the seeded e2e harness before bundle
 * boot; inert in production, since nothing there sets the global.
 */
export function shouldInstantSettleJuice(): boolean {
    const g = (globalThis as { __AXM_JUICE_INSTANT__?: unknown }).__AXM_JUICE_INSTANT__;
    return g === true || g === 1 || g === '1';
}

export type JuiceMode = 'animate' | 'instant';

export interface JuiceModeInput {
    reducedMotion: boolean;
    /** An additional per-call instant override, independent of the global escape hatch. */
    instant?: boolean;
}

/**
 * A primitive's motion mode. Reduced-motion and the e2e escape hatch both
 * collapse to 'instant' — presentation never decides outcomes, so an
 * 'instant' primitive still lands its final value and still fires any
 * completion callback; it just skips the tween.
 */
export function resolveJuiceMode({ reducedMotion, instant }: JuiceModeInput): JuiceMode {
    return reducedMotion || instant || shouldInstantSettleJuice() ? 'instant' : 'animate';
}
