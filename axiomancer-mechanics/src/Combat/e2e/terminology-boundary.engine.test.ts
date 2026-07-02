/**
 * Regression guard — Phase 166 Skills vs Cards terminology boundary.
 *
 * Skills are always-available token-spending actions in `knownSkills`.
 * Cards are Hazard-style deck/hand/reward objects (CombatCard).
 * A card may be projected from a skill, but the projected object is a card.
 *
 * This suite reads key source files and asserts that banned conflation phrases
 * are absent from active (non-comment-historical, non-spec-archived) mechanics
 * source. It deliberately targets only the files that the Phase 166 brief
 * called out as the boundary-relevant surface.
 *
 * Allowlisted patterns (changelog / spec archive prose) are excluded by
 * checking targeted source files — not the whole repo — so the guard stays
 * focused and does not break on spec history or braindump prose.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..', '..', '..');

function read(rel: string): string {
    return readFileSync(resolve(ROOT, rel), 'utf8');
}

const BANNED_PHRASES = [
    'skillCard',
    'skill_card',
    'SkillCard',
];

const GUARDED_SOURCE_FILES = [
    'src/Combat/combat.cards.ts',
    'src/Combat/combat.deck.ts',
    'src/Combat/combat.deck-presets.ts',
    'src/Combat/combat.engine.ts',
    'src/Combat/combat.encounter.types.ts',
    'src/Combat/combat.dice.ts',
    'src/Combat/combat.threat.ts',
];

describe('Phase 166 — Skills vs Cards terminology guard', () => {
    for (const file of GUARDED_SOURCE_FILES) {
        it(`${file} contains no banned skill/card conflation identifiers`, () => {
            const src = read(file);
            for (const phrase of BANNED_PHRASES) {
                expect(
                    src.includes(phrase),
                    `"${phrase}" found in ${file} — use "combatCard", "projectedCard", or "sourceSkill" instead`,
                ).toBe(false);
            }
        });
    }

    it('CombatCard.skillId field is the accepted skill-source field name', () => {
        const src = read('src/Combat/combat.encounter.types.ts');
        expect(src).toContain('skillId: string | null');
    });

    it('toCombatCard is the accepted projection entry-point name', () => {
        const src = read('src/Combat/combat.cards.ts');
        expect(src).toContain('export function toCombatCard(');
    });
});
