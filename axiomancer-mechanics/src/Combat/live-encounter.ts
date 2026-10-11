/**
 * The live-encounter VITAE knob.
 *
 * Every live encounter in the app doubles its foe's VITAE (a testing knob
 * applied at the app's encounter chokepoint, so fights run long enough to
 * exercise a deck). The engine's own fights and tests use the authored
 * VITAE; the pacing sim (`combat.pacing.sim.ts`) applies this so its turn
 * counts compare with play. One constant, read by both.
 */
export const LIVE_ENCOUNTER_ENEMY_HP_MULTIPLIER = 2;
