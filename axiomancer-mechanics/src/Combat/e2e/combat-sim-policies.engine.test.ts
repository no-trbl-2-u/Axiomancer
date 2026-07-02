/**
 * Hermetic e2e — the combat sim policy roster (`combat.sim-policies`) and the
 * policy-driven sim extensions (`combat.encounter.sim`).
 *
 * Verifies the roster resolves, `greedy`/`blind` still encode the legacy
 * witness EXACTLY (pinned decision sequences on seeded encounters — the
 * bit-identical guarantee behind the balance oracle), `chaos` randomness flows
 * only through the injected seeded rng (never `Math.random`), and the new
 * per-card telemetry + deck/focus options are consistent with the aggregate
 * counters. Doctrine: status effects are the MAIN fun — greedy's ranking must
 * put status cards above pure strikes, because status is the efficient path.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import { MournfulGull, CoastalTyrant, TidepoolCrab } from '../../Enemy/enemy.library';
import { getCardById } from '../../Cards/cards.library';
import { lookupEffect } from '../../Effects';
import { deepClone } from '../../Utils';
import {
    COMBAT_SIM_POLICIES, COMBAT_SIM_POLICY_ORDER, getSimPolicy, listSimPolicies,
    type CombatSimPolicyId,
} from '../combat.sim-policies';
import { runOneEncounter } from '../combat.encounter.sim';
import { initializeCombatEncounter } from '../combat.engine';
import { toCombatCard } from '../combat.cards';
import type { CombatCard, CombatEncounterState } from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

const ALL_POLICY_IDS: readonly CombatSimPolicyId[] = [
    'greedy', 'blind', 'dot-weaver', 'control-lock', 'aggro-brute', 'turtle', 'chaos', 'mercy-seeker',
];

function loadout(skills: string[]): Character {
    const p = deepClone(Player);
    p.knownSkills = skills.slice();
    p.baseStats = { heart: 10, body: 10, mind: 10 };
    p.health = 150;
    p.maxHealth = 150;
    return p;
}

const MIX = ['slippery-slope', 'eternal-regress', 'ad-hominem-strike', 'brace-for-impact', 'befriend'];

function card(id: string): CombatCard {
    const projected = toCombatCard(id, getCardById, lookupEffect);
    if (!projected) throw new Error(`test setup: card '${id}' failed to project`);
    return projected;
}

/** A never-consumed rng — trips the test if a deterministic policy touches it. */
const forbiddenRng = (): number => {
    throw new Error('deterministic policy consumed rng');
};

function freshState(seed = 5): CombatEncounterState {
    return initializeCombatEncounter(loadout(MIX), deepClone(TidepoolCrab), undefined, seed);
}

describe('policy roster — every id resolves', () => {
    it('exposes exactly the eight contracted policies, resolvable by id', () => {
        expect(Object.keys(COMBAT_SIM_POLICIES).sort()).toEqual([...ALL_POLICY_IDS].sort());
        for (const id of ALL_POLICY_IDS) {
            const policy = getSimPolicy(id);
            expect(policy, `policy '${id}' must resolve`).toBeDefined();
            expect(policy!.id).toBe(id);
            expect(policy!.name.length).toBeGreaterThan(0);
            expect(policy!.description.length).toBeGreaterThan(0);
            expect(policy!.convictionThreshold).toBeGreaterThanOrEqual(1);
            expect(['spare', 'exploit']).toContain(policy!.mercyChoice);
        }
    });

    it('listSimPolicies returns the canonical roster order; unknown ids are undefined', () => {
        expect(listSimPolicies().map(p => p.id)).toEqual([...COMBAT_SIM_POLICY_ORDER]);
        expect(getSimPolicy('nope')).toBeUndefined();
    });

    it('greedy/blind keep the exact legacy witness configuration', () => {
        for (const id of ['greedy', 'blind'] as const) {
            const policy = COMBAT_SIM_POLICIES[id];
            expect(policy.signatureKinds).toEqual(['dot', 'strike', 'control', 'mercy', 'conclude']);
            expect(policy.convictionThreshold).toBe(7);
            expect(policy.mercyChoice).toBe('spare');
            expect(policy.rankSignature).toBeUndefined();
        }
        expect(COMBAT_SIM_POLICIES.greedy.blind).toBe(false);
        expect(COMBAT_SIM_POLICIES.blind.blind).toBe(true);
    });

    it('aggro-brute is the doctrinal weak baseline: pure damage preview, no status awareness', () => {
        const s = freshState();
        const brute = COMBAT_SIM_POLICIES['aggro-brute'];
        const dot = card('slippery-slope');
        const strike = card('achilles-gambit');
        // The brute ranks strictly by preview — it does NOT put status first.
        expect(brute.rankCard(s, dot, forbiddenRng)).toBe(dot.bottomDamagePreview);
        expect(brute.rankCard(s, strike, forbiddenRng)).toBe(strike.bottomDamagePreview);
    });
});

describe('greedy rankCard — the legacy ordering as scores (doctrine: status > strikes)', () => {
    it('ranks a status card above a pure strike', () => {
        const s = freshState();
        expect(COMBAT_SIM_POLICIES.greedy.rankCard(s, card('slippery-slope'), forbiddenRng))
            .toBeGreaterThan(COMBAT_SIM_POLICIES.greedy.rankCard(s, card('achilles-gambit'), forbiddenRng));
    });

    it('ranks a status NEW to the board above the same status already applied', () => {
        const s = freshState();
        const dot = card('slippery-slope');
        const freshScore = COMBAT_SIM_POLICIES.greedy.rankCard(s, dot, forbiddenRng);
        const applied = deepClone(s);
        applied.enemy.effects = [
            { effectId: dot.primaryEffectId! } as unknown as (typeof applied.enemy.effects)[number],
        ];
        const repeatScore = COMBAT_SIM_POLICIES.greedy.rankCard(applied, dot, forbiddenRng);
        expect(freshScore).toBeGreaterThan(repeatScore);
    });

    it('ranks Befriend above everything once the foe is low-HP (the mercy turn)', () => {
        const s = freshState();
        const low = deepClone(s);
        low.enemy.health = 1;
        const greedy = COMBAT_SIM_POLICIES.greedy;
        expect(greedy.rankCard(low, card('befriend'), forbiddenRng))
            .toBeGreaterThan(greedy.rankCard(low, card('slippery-slope'), forbiddenRng));
        // ...but NOT before that (status play stays the default game).
        expect(greedy.rankCard(s, card('befriend'), forbiddenRng))
            .toBeLessThan(greedy.rankCard(s, card('slippery-slope'), forbiddenRng));
    });
});

describe('greedy object reproduces the pinned legacy decision sequences', () => {
    // These literals were produced by the PRE-refactor sim (verified via a
    // side-by-side run of the HEAD implementation). If they drift, the policy
    // refactor changed greedy's behavior — fix the refactor, never the pin.
    it('seed 11 vs MournfulGull: befriend-spare in one round', () => {
        const r = runOneEncounter(loadout(MIX), MournfulGull, 11, 'greedy');
        expect({ outcome: r.outcome, rounds: r.rounds, plays: r.plays, statusPlays: r.statusPlays })
            .toEqual({ outcome: 'mercy', rounds: 1, plays: 3, statusPlays: 2 });
        expect(r.cardUsage['slippery-slope']).toEqual({
            cardId: 'slippery-slope', plays: 1, bottomPlays: 1, topPlays: 0, statusLands: 1, discards: 0,
        });
        expect(r.cardUsage['eternal-regress']).toEqual({
            cardId: 'eternal-regress', plays: 1, bottomPlays: 1, topPlays: 0, statusLands: 1, discards: 0,
        });
    });

    it('seed 11 vs CoastalTyrant: a five-round status grind to victory', () => {
        const r = runOneEncounter(loadout(MIX), CoastalTyrant, 11, 'greedy');
        expect({ outcome: r.outcome, rounds: r.rounds, plays: r.plays, statusPlays: r.statusPlays })
            .toEqual({ outcome: 'victory', rounds: 5, plays: 24, statusPlays: 8 });
        expect(r.cardUsage['slippery-slope']).toEqual({
            cardId: 'slippery-slope', plays: 4, bottomPlays: 4, topPlays: 0, statusLands: 4, discards: 0,
        });
        expect(r.cardUsage['card-retreat']).toEqual({
            cardId: 'card-retreat', plays: 4, bottomPlays: 0, topPlays: 4, statusLands: 0, discards: 0,
        });
    }, 30_000);
});

describe('chaos — randomness flows only through the injected seeded rng', () => {
    it('rankCard consumes the provided rng (and returns its value)', () => {
        const s = freshState();
        let calls = 0;
        const rng = (): number => { calls++; return 0.42; };
        const score = COMBAT_SIM_POLICIES.chaos.rankCard(s, card('slippery-slope'), rng);
        expect(calls).toBe(1);
        expect(score).toBe(0.42);
        expect(COMBAT_SIM_POLICIES.chaos.rankSignature).toBeDefined();
    });

    it('a full chaos encounter never touches Math.random (hermeticity)', () => {
        const spy = vi.spyOn(Math, 'random');
        const r = runOneEncounter(loadout(MIX), MournfulGull, 9, 'chaos');
        expect(spy).not.toHaveBeenCalled();
        expect(['victory', 'mercy', 'defeat', 'retreat']).toContain(r.outcome);
    }, 30_000);

    it('chaos runs are seed-deterministic', () => {
        const a = runOneEncounter(loadout(MIX), MournfulGull, 9, 'chaos');
        const b = runOneEncounter(loadout(MIX), MournfulGull, 9, 'chaos');
        expect(b).toEqual(a);
    }, 30_000);
});

describe('per-card telemetry — cardUsage is consistent with the aggregate counters', () => {
    it('usage sums match plays / bottom+top / statusPlays', () => {
        const r = runOneEncounter(loadout(MIX), MournfulGull, 3, 'greedy');
        const rows = Object.values(r.cardUsage);
        const totalPlays = rows.reduce((n, row) => n + row.plays, 0);
        const totalBottom = rows.reduce((n, row) => n + row.bottomPlays, 0);
        const totalTop = rows.reduce((n, row) => n + row.topPlays, 0);
        const totalLands = rows.reduce((n, row) => n + row.statusLands, 0);
        expect(totalPlays).toBe(r.plays);
        expect(totalBottom + totalTop).toBe(r.plays);
        expect(totalLands).toBe(r.statusPlays);
        for (const row of rows) expect(row.cardId.length).toBeGreaterThan(0);
    });

    it('respects an explicit deck: only its ids (plus Retreat) appear in usage', () => {
        const deck = ['slippery-slope', 'slippery-slope', 'brace-for-impact'];
        const allowed = new Set([...deck, 'card-retreat']);
        const r = runOneEncounter(loadout(MIX), MournfulGull, 4, 'greedy', { deck });
        expect(Object.keys(r.cardUsage).length).toBeGreaterThan(0);
        for (const key of Object.keys(r.cardUsage)) {
            expect(allowed.has(key), `unexpected card '${key}' in usage`).toBe(true);
        }
    });

    it('focusCardIds boosts a card to the front of ranking so it gets exercised', () => {
        // Greedy would normally power the DoT before the pure strike; the focus
        // boost must force the strike into play (the card-coverage lever).
        const deck = ['slippery-slope', 'achilles-gambit', 'achilles-gambit', 'brace-for-impact'];
        const r = runOneEncounter(loadout(deck), MournfulGull, 6, 'greedy', {
            deck, focusCardIds: ['achilles-gambit'],
        });
        expect(r.cardUsage['achilles-gambit']?.plays ?? 0).toBeGreaterThanOrEqual(1);
        expect(r.cardUsage['achilles-gambit']?.bottomPlays ?? 0).toBeGreaterThanOrEqual(1);
    });

    it('throws on an unknown policy id (honest failure, no silent fallback)', () => {
        expect(() => runOneEncounter(loadout(MIX), MournfulGull, 1, 'nope' as CombatSimPolicyId))
            .toThrow(/Unknown combat sim policy/);
    });
});
