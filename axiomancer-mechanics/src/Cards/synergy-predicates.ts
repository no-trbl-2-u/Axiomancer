/**
 * Synergy state predicates — WS4.2 / WS5.2.
 *
 * Every library synergy authors a combat-STATE predicate
 * (`CardSynergy.statePredicate`), evaluated by the combat engine against the
 * encounter ledgers. The Phase 66 effect-matching branch in `executeCard` and
 * the Phase 142 "extended" effect-combination predicates that sat here were
 * never reached by a library card and were deleted in TRIM THE FAT T2a
 * (`plan/2026-09-25-trim-the-fat.spec.md`, Tier 1 engine table).
 */

import type { SynergyStatePredicate } from './types';

/**
 * WS4.2 / WS5.2 — the combat-ledger view a {@link SynergyStatePredicate}
 * reads: a structural subset of `CombatEncounterState` (spec 32 §12 item 4
 * ledgers + the turn-shape fields), so this module never imports the Combat
 * package. The engine passes the INCOMING play state, so every field is
 * pre-this-play (see the timing note on {@link SynergyStatePredicate}).
 */
export interface SynergyLedgerView {
    /** Post-soak HP the enemy's threat landed in the PRIOR round. */
    enemyDamageLastRound?: number;
    /** Post-soak HP the enemy's threat landed THIS turn (0 during the play
     *  window today — threats resolve between player turns). */
    enemyDamageThisTurn?: number;
    /** PAID spells already resolved this turn (this play not yet counted). */
    spellsPlayedThisTurn?: number;
    /** RECOIL HP paid by PRIOR plays this turn (this play's own not counted). */
    recoilPaidThisTurn?: number;
    /** The current hand — only its LENGTH is read (the played card is still
     *  in it at eval time). Structural: `CombatHandEntry[]` satisfies this. */
    hand?: readonly unknown[];
    /** The discard pile — only its LENGTH is read (REQUIEM, profane-canon
     *  rework). Structural: `string[]` satisfies this. */
    discard?: readonly unknown[];
    /** The draw pile — only its LENGTH's PARITY is read (EVENTIDE,
     *  `/adjust-keywords` pass 11). Structural: `string[]` satisfies this
     *  (`CombatEncounterState.drawPile`, not the full reshuffle-source
     *  `deck`). */
    drawPile?: readonly unknown[];
}

/**
 * WS4.2 — evaluate a combat-state synergy predicate against the encounter
 * ledgers. Pure and deterministic; exhaustive over the closed predicate union
 * (a new predicate kind fails compilation here until it is handled).
 *
 * Absent-field conventions (bare views in tests / legacy state literals):
 * counters default to 0 — so `opening` is vacuously TRUE (no spells played),
 * `recoil-paid-this-turn` / `enemy-drew-blood` are FALSE (no cost on the
 * ledger), and a missing `hand` makes `finale` vacuously TRUE (mirrors the
 * unmoved predicate's vacuous-truth convention; the engine always has a hand).
 */
export function checkStatePredicate(
    predicate: SynergyStatePredicate,
    ledgers: SynergyLedgerView,
): boolean {
    switch (predicate.kind) {
        // FLOW N — the turn has already carried `minPriorSpells` PAID spells.
        // Vacuously FALSE on a bare view (0 prior spells), mirroring the
        // cost-on-the-ledger predicates: FLOW must be EARNED within the turn.
        case 'flow':
            return (ledgers.spellsPlayedThisTurn ?? 0) >= predicate.minPriorSpells;
        case 'enemy-dealt-no-damage-last-round':
            return (ledgers.enemyDamageLastRound ?? 0) === 0;
        case 'opening':
            return (ledgers.spellsPlayedThisTurn ?? 0) <= predicate.maxPriorSpells;
        case 'finale':
            // The eval-time hand still contains the card being played.
            return (ledgers.hand?.length ?? 0) - 1 <= predicate.cardsLeftAtMost;
        case 'recoil-paid-this-turn':
            return (ledgers.recoilPaidThisTurn ?? 0) > 0;
        case 'enemy-drew-blood':
            return (ledgers.enemyDamageThisTurn ?? 0) > 0
                || (ledgers.enemyDamageLastRound ?? 0) > 0;
        case 'requiem':
            // The dead remember: ≥ n cards in the discard pile at play time.
            return (ledgers.discard?.length ?? 0) >= predicate.n;
        case 'eventide':
            // The ledger balances: the draw pile's remaining count is even.
            // Absent-view convention: a bare view has no drawPile field, and
            // `0 % 2 === 0`, so EVENTIDE is vacuously TRUE off a bare
            // ledger — same convention as `opening`/`finale`, not the
            // earned-cost convention of `flow`/`recoil-paid-this-turn`.
            return (ledgers.drawPile?.length ?? 0) % 2 === 0;
    }
}
