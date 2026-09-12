/**
 * S2-preview-C03 — ONE NAME FOR ONE METER.
 *
 * The threat preview the board prints is `CombatThreatPhase.threatAction
 * .description` (rendered by `CombatEncounterPanel`'s reveal list). Its PLEA
 * rider used to read "steadies 3 resolve" while the meter it moves is drawn
 * as "🕊 PLEA" under the foe's VITAE, narrated in the log as "PLEA −3", and
 * chipped on the intent as "−3 PLEA" — so a first-time player could not tell
 * the telegraph and the bar were the same thing.
 *
 * Guard (whole roster, no RNG): every threat preview that sheds PLEA names
 * PLEA, and no threat preview anywhere names a meter "resolve".
 */

import { describe, it, expect } from '@jest/globals';
import { EnemyLibrary, getThreatSequence } from '@mechanics';
import type { CombatThreatAction } from '@mechanics';

/**
 * Purpose (S2-preview-C03): flatten the whole enemy roster's telegraphs into
 * every threat action a player can ever read — linear phases plus BOTH forks
 * of every authored branch, since the panel prints "then:" / "otherwise:".
 * Inputs: none (reads the static `EnemyLibrary` through `getThreatSequence`).
 * Output: a flat array of `CombatThreatAction`s.
 */
function allThreatActions(): CombatThreatAction[] {
    return EnemyLibrary.flatMap(enemy =>
        getThreatSequence(enemy).flatMap(phase => [
            phase.threatAction,
            ...(phase.branch ? [phase.branch.then.threatAction, phase.branch.else.threatAction] : []),
        ]),
    );
}

/**
 * Purpose (S2-preview-C03): pick out the previews whose effects actually shed
 * PLEA — the ones whose wording the finding is about.
 * Inputs: the flattened threat actions.
 * Output: their `description` strings.
 */
function pleaShedPreviews(actions: CombatThreatAction[]): string[] {
    return actions
        .filter(a => a.effects.some(e => (e.swayCleanse ?? 0) > 0))
        .map(a => a.description);
}

/**
 * Purpose (S2-preview-C03): isolate the MACHINE-BUILT rider clause — the
 * trailing "(+N damage, …)" parenthetical `buildThreatAction` appends — from
 * the authored flavour sentence in front of it, so the meter-naming guard
 * judges only the clause the engine writes. Authored flavour may use "resolve"
 * as an English word ("where you keep your resolve"); the rider clause may
 * never use it as a meter name.
 * Inputs: one threat-action description.
 * Output: the rider clause without its parentheses, or undefined when the
 * description carries none (an enemy with a hand-written `threatSequence`).
 */
function riderClause(description: string): string | undefined {
    return /\(([^()]*)\)\.\s*$/.exec(description)?.[1];
}

describe('S2-preview-C03 — the threat preview names the PLEA meter PLEA', () => {
    it('the roster authors at least one PLEA-shedding telegraph (the guard has teeth)', () => {
        expect(pleaShedPreviews(allThreatActions()).length).toBeGreaterThan(0);
    });

    it('every PLEA-shedding preview names PLEA, the board label', () => {
        for (const description of pleaShedPreviews(allThreatActions())) {
            expect(description).toContain('PLEA');
        }
    });

    it('no telegraphed rider clause calls a meter "resolve"', () => {
        for (const action of allThreatActions()) {
            const clause = riderClause(action.description);
            if (clause === undefined) continue;
            expect(clause.toLowerCase()).not.toContain('resolve');
        }
    });
});
