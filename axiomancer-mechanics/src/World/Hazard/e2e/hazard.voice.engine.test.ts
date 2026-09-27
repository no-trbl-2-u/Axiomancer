/**
 * Hazard intro voice (CRITIQUE pass 56, #405) — every authored hazard
 * `intro` addresses the player in second person, never as a gendered
 * third person. Spec 34 §2.5.4 (MB-4) permits second person to price a
 * death; this pins that no intro slips back to "he/him/his".
 * Pure data check; no RNG.
 */

import { describe, expect, it } from 'vitest';

import { HAZARD_LIBRARY } from '../hazard.content';

const GENDERED_THIRD_PERSON = /\b(he|him|his|she|her|hers|himself|herself)\b/i;

describe('hazard intro voice', () => {
    const withIntro = HAZARD_LIBRARY.filter(def => typeof def.intro === 'string' && def.intro.length > 0);

    it('covers at least one authored intro', () => {
        expect(withIntro.length).toBeGreaterThan(0);
    });

    it.each(withIntro.map(def => [def.id, def.intro] as const))(
        '%s intro carries no gendered third-person pronoun',
        (_id, intro) => {
            expect(intro).not.toMatch(GENDERED_THIRD_PERSON);
        },
    );
});
