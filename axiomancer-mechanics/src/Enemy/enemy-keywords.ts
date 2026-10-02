/**
 * ENEMY KEYWORDS AND STAGES.
 *
 * No enemy keyword exists. `EnemyKeyword` is an empty type so
 * `Enemy.keywords?` keeps its slot for keywords added later, one at a time,
 * each with a live counter.
 */

/** A keyword carried by an enemy. None exist yet. */
export type EnemyKeyword = never;

/**
 * A boss/unique STAGE — the moment a fight becomes a different fight.
 *
 * Modelled on Cthulhu: Death May Die's Elder One progression and Aeon's End's
 * tiered nemesis escalation: the foe crosses a printed threshold and changes
 * shape, loudly. The first stage whose `at` is satisfied fires; each stage
 * fires at most once per combat, checked at phase boundaries.
 */
export interface EnemyStage {
    /** Trigger. `vitaePct` is the fraction of max VITAE at or below which it
     *  fires (0.6 = "at 60% or lower"); `round` fires on that round or later.
     *  Both may be set — whichever is satisfied first wins. */
    at: { vitaePct?: number; round?: number };
    /** The stage's name, shouted into the log: `THE COURT ADJOURNS`. */
    name: string;
    /** One telegraphed line printed in the log and on the enemy pane. */
    text: string;
    /** Strip every affliction the player has landed on it. */
    cleanse?: boolean;
    /** Heal a flat amount, or a fraction of max VITAE. */
    heal?: number | { pct: number };
    /** Added to every subsequent phase's damage weight. */
    threatBonus?: number;
}
