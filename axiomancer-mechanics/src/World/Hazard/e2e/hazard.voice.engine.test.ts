/**
 * Hazard voice (CRITIQUE pass 56, #405; widened pass 71, #463) — every
 * player-facing string a hazard carries (`scenario`, `intro`, route names
 * and descriptions, board notes, reward labels) addresses the player in
 * second person, never as a gendered third person. The delivery register
 * (MB-4, `docs/narrative/DELIVERY_REGISTER.md`) permits second person to
 * price a death; this pins that no line slips back to "he/him/his".
 * Pure data check; no RNG.
 */

import { describe, expect, it } from 'vitest';

import { HAZARD_LIBRARY } from '../hazard.content';

const GENDERED_THIRD_PERSON = /\b(he|him|his|she|her|hers|himself|herself)\b/i;

/** Every string reachable from a hazard def, keyed by its dotted path. */
function stringFields(value: unknown, path: string): Array<readonly [string, string]> {
    if (typeof value === 'string') return [[path, value]];
    if (value === null || typeof value !== 'object') return [];
    return Object.entries(value).flatMap(([key, child]) => stringFields(child, `${path}.${key}`));
}

describe('hazard voice', () => {
    const lines = HAZARD_LIBRARY.flatMap(def => stringFields(def, def.id));

    it('covers every authored scenario and intro', () => {
        for (const def of HAZARD_LIBRARY) {
            const paths = lines.map(([path]) => path);
            expect(paths).toContain(`${def.id}.scenario`);
            if (def.intro) expect(paths).toContain(`${def.id}.intro`);
        }
    });

    it.each(lines)('%s carries no gendered third-person pronoun', (_path, line) => {
        expect(line).not.toMatch(GENDERED_THIRD_PERSON);
    });
});
