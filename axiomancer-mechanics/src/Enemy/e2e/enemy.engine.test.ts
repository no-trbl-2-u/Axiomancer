/**
 * Enemy data-model coverage.
 *
 * The Spec 07 turn-based AI strategy tests (counterStanceOf / weakestStanceOf /
 * decideEnemyAction and the per-strategy heuristics) were removed with the
 * legacy turn-based combat driver — the Hazard-Pattern engine drives enemies
 * via authored threat sequences, not these strategies. What remains here is the
 * enemy registry shape, the authored skill rotations, and the stat-law
 * compliance guards used by the balance anchors.
 */

import { describe, it, expect } from 'vitest';
import {
    ENEMY_REGISTRY, ArgumentativeCrow, CoastalTyrant,
    TideflukeReaver, HushWraith, HollowSaint, TheDisagreement, EchoOfPyrrhonia,
    MournfulGull, HollowEyedBeggar,
} from '../enemy.library';

describe('ENEMY_REGISTRY', () => {
    it('contains every published enemy with a stable shape', () => {
        const entries = Object.entries(ENEMY_REGISTRY);
        expect(entries.length).toBeGreaterThan(0);
        for (const [slug, enemy] of entries) {
            expect(enemy.id).toBeTruthy();
            expect(enemy.name).toBeTruthy();
            expect(enemy.maxHealth).toBeGreaterThan(0);
            expect(enemy.health).toBe(enemy.maxHealth);
            expect(enemy.baseStats).toBeDefined();
            // Slug stability: the slug must round-trip back to the same fixture.
            expect(ENEMY_REGISTRY[slug as keyof typeof ENEMY_REGISTRY]).toBe(enemy);
        }
    });
});

describe('Phase 49 + Phase 57 enemy rotations', () => {
    // Phase 49 (`27064d9`) authored the first 2 rotations; Phase 57
    // (this commit) extended the coverage to all 5 elites/boss/unique
    // + 2 of the 6 normals. The 3 simplest normals (Tidepool Crab,
    // Sea-Mist Wisp, Lullaby Moth) intentionally stay skill-less per
    // Phase 57 D2 (early-game pacing).

    it('Argumentative Crow carries the false-dilemma rotation (Phase 49)', () => {
        expect(ArgumentativeCrow.skills).toBeDefined();
        expect(ArgumentativeCrow.skills?.length).toBe(1);
        expect(ArgumentativeCrow.skills?.[0].id).toBe('false-dilemma');
    });

    it('Coastal Tyrant carries the achilles-gambit rotation (Phase 49)', () => {
        expect(CoastalTyrant.skills).toBeDefined();
        expect(CoastalTyrant.skills?.length).toBe(3); // Phase 121 — added skills for Easy anchor
        const skillIds = CoastalTyrant.skills?.map(s => s.id) || [];
        expect(skillIds).toContain('achilles-gambit');
    });

    it('Tidefluke Reaver carries the straw-giant rotation (Phase 57)', () => {
        expect(TideflukeReaver.skills?.[0].id).toBe('straw-giant');
    });

    it('Hush-Wraith carries the sorites-cascade rotation (Phase 57)', () => {
        expect(HushWraith.skills?.[0].id).toBe('sorites-cascade');
    });

    it('Hollow Saint carries the pascals-wager rotation (Phase 57)', () => {
        expect(HollowSaint.skills?.[0].id).toBe('pascals-wager');
    });

    it('The Disagreement carries the liars-echo rotation (Phase 57)', () => {
        expect(TheDisagreement.skills?.[0].id).toBe('liars-echo');
    });

    it('Echo of Pyrrhonia carries the eternal-regress rotation (Phase 57)', () => {
        expect(EchoOfPyrrhonia.skills?.[0].id).toBe('eternal-regress');
    });

    it('Mournful Gull carries the appeal-to-pity rotation (Phase 57)', () => {
        expect(MournfulGull.skills?.[0].id).toBe('appeal-to-pity');
    });

    it('Hollow-Eyed Beggar carries the pascals-wager rotation (Phase 57)', () => {
        expect(HollowEyedBeggar.skills?.[0].id).toBe('pascals-wager');
    });
});

describe('Phase 121 stat law compliance for playtest balance anchors', () => {
    it('Coastal Tyrant level 6 has exactly 30 total stats (5 × level)', () => {
        const { body, mind, heart } = CoastalTyrant.baseStats;
        const total = body + mind + heart;
        expect(total).toBe(30);
    });

    it('Coastal Tyrant has skills for Easy anchor testing', () => {
        expect(CoastalTyrant.skills).toBeDefined();
        expect(CoastalTyrant.skills?.length).toBeGreaterThanOrEqual(3);
        const skillIds = CoastalTyrant.skills?.map(s => s.id) || [];
        expect(skillIds).toContain('achilles-gambit');
    });

    it('Audit Sentinel level 15 has exactly 75 total stats (5 × level)', () => {
        const AuditSentinel = ENEMY_REGISTRY['audit-sentinel'];
        const { body, mind, heart } = AuditSentinel.baseStats;
        const total = body + mind + heart;
        expect(total).toBe(75);
    });

    it('Audit Sentinel has 1-2 low-tier skills for Normal anchor', () => {
        const AuditSentinel = ENEMY_REGISTRY['audit-sentinel'];
        expect(AuditSentinel.skills).toBeDefined();
        expect(AuditSentinel.skills?.length).toBeGreaterThanOrEqual(1);
        expect(AuditSentinel.skills?.length).toBeLessThanOrEqual(2);
    });

    it('Balance Judge level 18 has exactly 90 total stats (5 × level)', () => {
        const BalanceJudge = ENEMY_REGISTRY['balance-judge'];
        const { body, mind, heart } = BalanceJudge.baseStats;
        const total = body + mind + heart;
        expect(total).toBe(90);
    });

    it('Balance Judge has several devastating skills for Difficult anchor', () => {
        const BalanceJudge = ENEMY_REGISTRY['balance-judge'];
        expect(BalanceJudge.skills).toBeDefined();
        expect(BalanceJudge.skills?.length).toBeGreaterThanOrEqual(3);
        const skillIds = BalanceJudge.skills?.map(s => s.id) || [];
        expect(skillIds).toContain('bootstrap-paradox'); // devastating tier 3 skill
    });
});
