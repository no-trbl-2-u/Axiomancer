import { describe, expect, it } from 'vitest';

import { EnemyLibrary } from '../Enemy/enemy.library';
import { getThreatSequence } from './combat.threat';

describe('threat telegraph copy', () => {
    it('prints the hit as "N damage", never "+N", which the game reads as a gain', () => {
        for (const enemy of EnemyLibrary) {
            for (const phase of getThreatSequence(enemy)) {
                const faces = phase.branch ? [phase.branch.then, phase.branch.else] : [phase];
                for (const face of faces) {
                    const { description, effects } = face.threatAction;
                    const damage = effects.find(e => e.damage !== undefined)?.damage;
                    expect(description, enemy.id).not.toMatch(/\+\d+ damage/);
                    if (damage) expect(description, enemy.id).toContain(`(${damage} damage`);
                }
            }
        }
    });
});
