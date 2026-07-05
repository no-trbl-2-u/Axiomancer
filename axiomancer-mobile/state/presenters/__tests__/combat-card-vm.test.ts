/**
 * Hermetic unit tests for the honest card view-model helpers
 * (engineHonestKind / resolvePrimary / faceStats / detailStats / armedReadValue).
 *
 * Fixtures are curated keepers (Fate Engine P1 trim, spec 31 §4), read live
 * from the installed engine so the assertions stay true to real data:
 *   - slippery-slope    ramping Poison i1 d4   → 2+2+3+3 = 10 lifetime
 *   - brace-for-impact  Guard 12               → free Guard 6
 *   - eternal-recurrence Regen i2 d4 (hpr 4)   → 8/t·4t = 32
 *   - unmoved-mover     Stagger d1             → skip 1t
 *   - qa-mobile-pure-strike (sandbox fixture) Strike → no fabricated number
 *
 * Core invariant under test: real-units-or-no-number (never a fabricated value),
 * and face↔detail numbers agree.
 */

import { describe, it, expect } from '@jest/globals';
import { getCard, getSkillById, registerSandboxCards } from '@mechanics';
import {
    faceStats, detailStats, engineHonestKind, resolvePrimary, armedReadValue,
} from '@/state/presenters/combat-encounter.engine';

// Master Spec (2026-07-03) doctrine pass converted every real library card off
// flat `basePower` strikes — no real card can play "pure damage, no status"
// anymore (see `achilles-gambit`, now a control-effect card), so this suite's
// pure-strike fixture is a sandbox-only test card, mirroring the mechanics
// package's identical fixture (`qa-pure-strike-body`).
registerSandboxCards([{
    id: 'qa-mobile-pure-strike',
    name: 'QA Pure Strike (test fixture)',
    category: 'paradox',
    philosophicalAspect: 'body',
    description: 'Test-only fixture: a flat direct-damage card with no status payload.',
    tier: 1,
    targetType: 'enemy',
    basePower: 12,
    scalingStat: 'body',
}]);

const cardOf = (id: string) => {
    const card = getCard(id);
    if (!card) throw new Error(`fixture card missing: ${id}`);
    const skill = card.skillId ? getSkillById(card.skillId) : undefined;
    return { card, skill };
};

describe('engineHonestKind — the honesty gate', () => {
    it('classifies DoT / stun / regen / weaken / vulnerable / thorns', () => {
        expect(engineHonestKind('debuff_bleed')).toBe('dot');
        expect(engineHonestKind('debuff_stun')).toBe('stun');
        expect(engineHonestKind('buff_regeneration')).toBe('regen');
        expect(engineHonestKind('debuff_slow')).toBe('weaken');             // negative roll mod (0.33.0 de-inert)
        expect(engineHonestKind('debuff_confusion')).toBe('weaken');
        expect(engineHonestKind('debuff_vulnerable')).toBe('vulnerable');   // 0.34.0: damageTakenMult is now real
        expect(engineHonestKind('debuff_vulnerability_body')).toBe('vulnerable'); // now carries damageTakenMult
        expect(engineHonestKind('buff_brazen_thorns')).toBe('thorns');      // 0.34.0: reflectDamage is now real
        expect(engineHonestKind(null)).toBeNull();
    });

    it('classifies the 6 card-overhaul (2026-07-03) effects the whitelist previously missed', () => {
        expect(engineHonestKind('debuff_exposure')).toBe('exposure');           // real -N DEF
        expect(engineHonestKind('debuff_doubt')).toBe('doubt');                 // forces weak-tier next play
        expect(engineHonestKind('debuff_sensory_null')).toBe('sensoryNull');    // blocks advantage / dulls control
        expect(engineHonestKind('debuff_isolated')).toBe('isolated');           // denies ally-buff targeting
        expect(engineHonestKind('debuff_overextended')).toBe('overextended');   // self-cost weak next play
        expect(engineHonestKind('buff_clarity')).toBe('clarity');               // next die: Wild
        expect(engineHonestKind('buff_resolute')).toBe('resolute');             // real -N% dmg taken (inverse of vulnerable)
    });
});

describe('faceStats — honest real-unit faces', () => {
    it('Slippery Slope (ramping Poison) → 10 lifetime (2,2,3,3) · 4 turns, FREE 2 HP', () => {
        const { card, skill } = cardOf('slippery-slope');
        const f = faceStats(card, skill);
        expect(f.kind).toBe('dot');
        expect(f.heroText).toBe('10');        // ramp-aware: 2+2+3+3 (rampFactor 0.5)
        expect(f.heroSub).toBe('over 4 turns');
        expect(f.freeHeroText).toBe('2 HP');
        expect(f.readDependent).toBe(true);   // the read now scales status (depth epic)
        expect(f.statusBase).toBe(10);
        expect(f.inert).toBe(false);
    });
    it('Brace for Impact (Guard) → Guard 12, FREE Guard 6, read-dependent', () => {
        const { card, skill } = cardOf('brace-for-impact');
        const f = faceStats(card, skill);
        expect(f.kind).toBe('guard');
        expect(f.heroText).toBe('Guard 12');
        expect(f.freeHeroText).toBe('Guard 6');
        expect(f.readDependent).toBe(true);
        expect(f.guardBase).toBe(12);
    });
    it('Eternal Recurrence (Regen) → real i2 d4 totals from the canonical library', () => {
        const { card, skill } = cardOf('eternal-recurrence');
        const f = faceStats(card, skill);
        expect(f.kind).toBe('regen');
        // buff_regeneration hpr 4 × i2 = 8/turn × 4 turns = 32 (exact, from data)
        expect(f.heroText).toBe('32');
        expect(f.heroSub).toBe('over 4 turns');
    });
    it('Unmoved Mover (Stagger) → skip 1t (stun/sleep/petrify merged into stagger)', () => {
        const { card, skill } = cardOf('unmoved-mover');
        const f = faceStats(card, skill);
        expect(f.kind).toBe('stun');
        expect(f.heroText).toBe('skip 1 turns');
    });
    it('QA Pure Strike (Strike) → no fabricated number', () => {
        const { card, skill } = cardOf('qa-mobile-pure-strike');
        const f = faceStats(card, skill);
        expect(f.kind).toBe('strike');
        expect(f.heroText).toBe('');               // real-units-or-no-number
        expect(f.freeHeroText).toBe('small chip');
        expect(f.readDependent).toBe(true);
    });

    // ── card-overhaul (2026-07-03) — the 6 previously-blank effects ──
    it("Achilles' Gambit (FATE bleed) → real 8-HP lifetime + a printed X-die line", () => {
        const { card, skill } = cardOf('achilles-gambit');
        const f = faceStats(card, skill);
        expect(f.kind).toBe('dot');
        expect(f.heroText).toBe('8');       // bleed 4 × i1 × 2 turns
        expect(card.dieLines?.some(l => l.includes('X die'))).toBe(true);
        expect(f.inert).toBe(false);
    });
    it('Appeal to Pity (Resolute self-buff) → real -15% dmg taken', () => {
        const { card, skill } = cardOf('appeal-to-pity');
        const f = faceStats(card, skill);
        expect(f.kind).toBe('resolute');
        expect(f.heroText).toBe('-15%');
        expect(f.heroSub).toBe('dmg taken · 2 turns');
        expect(f.inert).toBe(false);
    });
    // (Clarity-primary face: no curated keeper leads with buff_clarity —
    // appeal-to-authority carries it as a rider. Face coverage returns with
    // the P3 extension wave.)
    it('Existential Debt leads with its DESPAIR DoT (isolate rides along)', () => {
        const { card, skill } = cardOf('existential-debt');
        const f = faceStats(card, skill);
        expect(f.kind).toBe('dot');
        expect(f.heroText).toBe('36');              // despair 3 × i3 × 4 turns
        expect(f.inert).toBe(false);
    });
    // (Sensory-null face: its card was cut in the P1 trim; the effect returns
    // as enemy-side content in P2.)
});

describe('detailStats — same numbers as the face', () => {
    it('Slippery Slope outcome + stats + pill all agree on the ramp-aware 10', () => {
        const { card, skill } = cardOf('slippery-slope');
        const d = detailStats(card, skill);
        expect(d.outcomeStats.find(st => st.label === 'TOTAL')?.value).toBe('10');
        expect(d.stacksText).toBe('Stacks up to 10×.');
        // §C: the +DIE read triplet is the deterministic rule, base = 10.
        expect(d.diePill).toMatch(/^▲\d+ · —10 · ▼\d+$/);
    });
    it('Eternal Recurrence detail agrees with the 32 face total', () => {
        const { card, skill } = cardOf('eternal-recurrence');
        const d = detailStats(card, skill);
        expect(d.outcomeLine).toContain('32 over');
    });
    it('Brace for Impact (Guard) → terse "Gain Guard 12."', () => {
        const { card, skill } = cardOf('brace-for-impact');
        const d = detailStats(card, skill);
        expect(d.outcomeLine).toBe('Gain Guard 12.');
        expect(d.stacksText).toBeNull();
    });
});

describe('resolvePrimary + armedReadValue', () => {
    it('resolvePrimary routes by verb-class + honesty', () => {
        expect(resolvePrimary(getCard('brace-for-impact')!, getSkillById('brace-for-impact')).kind).toBe('guard');
        expect(resolvePrimary(getCard('qa-mobile-pure-strike')!, getSkillById('qa-mobile-pure-strike')).kind).toBe('strike');
        expect(resolvePrimary(getCard('befriend')!, getSkillById('befriend')).kind).toBe('befriend');
        expect(resolvePrimary(getCard('slippery-slope')!, getSkillById('slippery-slope')).kind).toBe('dot');
    });
    it('armedReadValue scales Guard by the DAMAGE read (+colour match)', () => {
        const guard = faceStats(getCard('brace-for-impact')!, getSkillById('brace-for-impact'));
        expect(armedReadValue(guard, 'neutral', false)).toBe(12);       // 12 × 1.0
        expect(armedReadValue(guard, 'advantage', false)).toBe(18);     // 12 × 1.5
        expect(armedReadValue(guard, 'disadvantage', false)).toBe(6);   // 12 × 0.5
        expect(armedReadValue(guard, 'neutral', true)).toBe(15);        // + colour-match bonus
    });
    it('armedReadValue follows the P0-truth deterministic read rule for DoT (exact, ramp-aware)', () => {
        // Slippery Slope: canonical poison dpr 2, ramp 0.5, i1, 4 turns.
        const dot = faceStats(getCard('slippery-slope')!, getSkillById('slippery-slope'));
        expect(armedReadValue(dot, 'neutral', false)).toBe(10);         // 2+2+3+3, printed exactly
        expect(armedReadValue(dot, 'advantage', false)).toBe(20);       // +1 intensity: 4+4+6+6
        expect(armedReadValue(dot, 'disadvantage', false)).toBe(7);     // −1 turn: 2+2+3
        expect(armedReadValue(dot, 'advantage', true)).toBe(20);        // no colour-match bonus on status
    });
});
