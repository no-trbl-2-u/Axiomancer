/**
 * Phase 38 — the central juice/animation layer (combat-first). One shared
 * feel module owning the recurring Reanimated primitives instead of ~33
 * components each rolling their own — screen shake, impact flash,
 * status-proc pulse, number pop, the idle breath, the spent-die static
 * treatment, and a haptics wrapper. Every animated primitive is reduced-motion gated and honors the `__AXM_JUICE_INSTANT__`
 * escape hatch (`instant.ts`) so seeded e2e never waits on animation.
 *
 * Incremental migration doctrine: new work uses this module; the remaining
 * Reanimated call sites (tutorial coaches, toasts, boards, D6f's own roll
 * ritual) migrate opportunistically in later ticks — this phase does not
 * big-bang rewrite them.
 */
export * from './juice.timing';
export * from './instant';
export * from './haptics';
export * from './shake';
export * from './flash';
export * from './pulse';
export * from './idle';
export * from './numberPop';
export * from './spentDie';
