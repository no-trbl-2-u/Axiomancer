/**
 * Hermetic e2e — the combat sim policy roster (`combat.sim-policies`) and the
 * policy-driven sim extensions (`combat.encounter.sim`).
 *
 * Verifies the roster resolves, `greedy`/`blind` still encode their ranking
 * EXACTLY (pinned decision sequences on seeded encounters — the determinism
 * guarantee behind the balance oracle), `chaos` randomness flows
 * only through the injected seeded rng (never `Math.random`), and the new
 * per-card telemetry + deck/focus options are consistent with the aggregate
 * counters. Doctrine: status effects are the MAIN fun — greedy's ranking must
 * put status cards above pure strikes, because status is the efficient path.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import { FloatEye, TheDoorwarden } from '../../Enemy/enemy.library';
import { getCardById } from '../../Cards/cards.library';
import { registerSandboxCards } from '../../Cards/cards.sandbox';
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

// Spec 32 v3: basePower is deleted at the schema level — the "no status game"
// card is a statusless utility fixture. (The Befriend card verb went in R7a;
// the mercy path lives on The Open Hand signature.)
const QA_STATUSLESS = 'qa-statusless-utility';
registerSandboxCards([
    {
        id: QA_STATUSLESS,
        name: 'QA Statusless Utility (test fixture)',
        color: 'body',
        description: 'Test-only fixture: a card with no status payload, used to witness status-first ranking.',
        tier: 1,
        rank: 1,
        cardType: 'spell',
        targetType: 'enemy',
    },
]);

afterEach(() => {
    vi.restoreAllMocks();
});

const ALL_POLICY_IDS: readonly CombatSimPolicyId[] = [
    'greedy', 'blind', 'dot-weaver', 'control-lock', 'aggro-brute', 'turtle', 'chaos', 'mercy-seeker',
];

function loadout(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    // Neutral stats (S3): printed numbers land as printed.
    p.baseStats = { heart: 5, body: 5, mind: 5 };
    p.health = 150;
    p.maxHealth = 150;
    return p;
}

// A cross-theme starter mix: ramping poison, second poison DoT, control, guard.
// (Profane Canon 2026-08-08: the old library is gone wholesale. The seats
//  refill by mechanical role — spoiled-poultice (weak poison starter, was
//  slippery-slope), unction-of-boils (tier-2 poison DoT, was
//  recurring-symptom — same theme, same body aspect), scolds-bridle
//  (STAGGER + BACKFIRE control, was red-herring), chilblain-watch (guard
//  starter, was brace-for-impact).)
//
// The card purge (P1, 2026-09-27): the library is the grey office alone, so
// MIX is its three roles — A Plain Word (the VULNERABLE status card), two
// Plain Blows (direct damage), A Plain Ward (GUARD).
const MIX = ['grey-word', 'grey-strike', 'grey-strike', 'grey-ward'];
/** The status card of MIX (VULNERABLE) — the seat the DoT starter held. */
const STATUS_CARD = 'grey-word';

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
    return initializeCombatEncounter(loadout(MIX), deepClone(FloatEye), undefined, seed);
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
            expect(policy.signatureKinds).toEqual(['mercy']);
            expect(policy.convictionThreshold).toBe(7);
            expect(policy.mercyChoice).toBe('spare');
            expect(policy.rankSignature).toBeUndefined();
        }
    });

    it('aggro-brute is the doctrinal weak baseline: pure damage preview, no status awareness', () => {
        const s = freshState();
        const brute = COMBAT_SIM_POLICIES['aggro-brute'];
        const dot = card(STATUS_CARD);
        const plain = card(QA_STATUSLESS);
        // The brute ranks strictly by preview — it does NOT put status first.
        expect(brute.rankCard(s, dot, forbiddenRng)).toBe(dot.bottomDamagePreview);
        expect(brute.rankCard(s, plain, forbiddenRng)).toBe(plain.bottomDamagePreview);
    });
});

describe('greedy rankCard — the legacy ordering as scores (doctrine: status > everything)', () => {
    it('ranks a status card above a statusless card', () => {
        const s = freshState();
        expect(COMBAT_SIM_POLICIES.greedy.rankCard(s, card(STATUS_CARD), forbiddenRng))
            .toBeGreaterThan(COMBAT_SIM_POLICIES.greedy.rankCard(s, card(QA_STATUSLESS), forbiddenRng));
    });

    it('ranks a status NEW to the board above the same status already applied', () => {
        const s = freshState();
        const dot = card(STATUS_CARD);
        const freshScore = COMBAT_SIM_POLICIES.greedy.rankCard(s, dot, forbiddenRng);
        const applied = deepClone(s);
        applied.enemy.effects = [
            { effectId: dot.primaryEffectId! } as unknown as (typeof applied.enemy.effects)[number],
        ];
        const repeatScore = COMBAT_SIM_POLICIES.greedy.rankCard(applied, dot, forbiddenRng);
        expect(freshScore).toBeGreaterThan(repeatScore);
    });
});

describe('greedy object reproduces the pinned decision sequences', () => {
    // Freshly measured against the spec 32 v3 library (2026-07-08); if they
    // drift, a refactor changed greedy's behavior — fix the refactor, never
    // the pin (unless the library/engine legitimately changed again).
    //
    // Re-pinned 2026-07-08: removing the Retreat card (no in-combat retreat
    // exists any more) changed MIX's deck length from 5 to 4 cards, which
    // reshuffles every seed-derived draw order for `loadout(MIX)` — both
    // pins below were re-measured against the current engine.
    //
    // Re-pinned 2026-07-09 (dice-law rework): 3 dice per turn, strict color
    // match, per-die token accrual — every seed-derived roll and greedy
    // decision shifted; both pins re-measured against the current engine.
    //
    // Re-pinned 2026-07-11 (WS3.3 DoT-clock data sweep): poison rides the
    // card-played clock (each subsequent play ticks it) and bleed the
    // damage-instance clock — kills land earlier on the same seeds; both
    // pins re-measured against the current engine.
    //
    // Re-pinned 2026-07-11 (Gate 0 round-turn law): ONE tray roll per threat
    // phase — greedy now plays the whole legal turn (drafted die + Reserve +
    // floats, then the FREE-top drain) instead of farming endTurn→startTurn;
    // both pins re-measured with zero turn-law-blocked events.
    //
    // Re-pinned 2026-07-12 (WS3.3 fresh-stack CAP): the card-played clock's
    // eligibility gate became an intensity cap (a play's own fresh stacks
    // merged onto an existing instance no longer tick on the play that
    // applied them), and manual TICK paths now decay decaysPerTick DoTs.
    //
    // post-Phase-30 merge re-pin 2026-07-12: slippery-slope's and (the since-
    // retired) straw-mans-jab's FREE lines moved from TICK (retired
    // registry-wide) to a MARK seed under the FREE-currency law, shifting
    // greedy's per-play scoring on the merged tree.
    //
    // Re-pinned 2026-07-13 (keep-hand rule): COMBAT_HAND_SIZE 6→5 and the
    // round boundary now REFILLS the kept hand instead of redrawing it —
    // fewer cards per round means fewer plays on the same seeds. Outcomes
    // and round counts are unchanged on both pins.
    //
    // Re-pinned 2026-07-18 (Phase D8 ten-in/ten-out): straw-mans-jab left the
    // library and MIX's second seat went to recurring-symptom (see the MIX
    // comment above) — every seed-derived draw and greedy decision shifted;
    // both pins re-measured against the current engine. Both fights remain
    // status victories at the same round counts as before the swap.
    //
    // Re-pinned 2026-08-08 (Profane Canon): the card library was replaced
    // wholesale and every MIX seat refilled by role (see the MIX comment
    // above) — every seed-derived draw and greedy decision shifted; both
    // pins re-measured against the new library + engine.
    //
    // Re-pinned 2026-09-02 (THE BIG NUMBERS REWRITE): every card in MIX was
    // rewritten and direct damage came back as a first-class verb, so both
    // fights end far sooner on the same seeds. These pins are FIDELITY
    // measurements of the current tree — a "the sim is reproducible" detector,
    // never a balance target. Nothing here grades the game against a shape;
    // re-measure them, do not tune the game to them.
    //
    // Re-measured 2026-09-04 (playtest fix): FREE-line plays now advance the
    // card-played DoT clock like PAID plays always did, so the poison the
    // greedy line stacks ticks on every play and the same seed closes in ONE
    // round (plays/statusPlays unchanged).
    //
    // Re-measured 2026-09-25 (D7 flag collapse): until now this file's
    // `afterEach` switched the Upgradeable-Dice flag OFF, so every test after
    // the first — these pins included — silently measured the deleted
    // draft-era model. First honest spec-33 measurement: same one-round
    // victory, fewer status lands (3→1).
    //
    // Re-measured after the card purge (P1, 2026-09-27): MIX is the grey
    // office (see the MIX comment above) — a five-round victory, 24 plays,
    // 5 VULNERABLE lands, all from A Plain Word.
    //
    // Re-pointed at Float-Eye in the enemy roster reset (R2): its foe was
    // retired. Re-measured: a five-round victory, 22 plays, 5 lands.
    it('seed 11 vs FloatEye: a status victory', () => {
        const r = runOneEncounter(loadout(MIX), FloatEye, 11, 'greedy');
        expect({ outcome: r.outcome, rounds: r.rounds, plays: r.plays, statusPlays: r.statusPlays })
            .toEqual({ outcome: 'victory', rounds: 5, plays: 22, statusPlays: 5 });
        expect(r.cardUsage['grey-word']).toEqual({
            cardId: 'grey-word', plays: 6, bottomPlays: 5, topPlays: 1, statusLands: 5, discards: 0,
        });
        // Telemetry stays internally consistent whatever the sequence is: the
        // per-card counters sum to the aggregates (the actual bug detector).
        const usage = Object.values(r.cardUsage);
        expect(usage.reduce((n, u) => n + u.plays, 0)).toBe(r.plays);
        expect(usage.reduce((n, u) => n + u.bottomPlays + u.topPlays, 0)).toBe(r.plays);
        expect(usage.reduce((n, u) => n + u.statusLands, 0)).toBe(r.statusPlays);
    });

    // Re-pinned 2026-07-11 (phase 30 control-theme fix): red-herring's FREE
    // line moved from a double-stagger stack (which flattened the standstill
    // preset's win-rate curve to 100% at every stage — a real balance
    // regression caught by combat-playtest.balance-bands.sim.test.ts) to a
    // reveal-stance deposit. This is a narrow fidelity pin on `greedy`'s
    // decision sequence, not a balance gate (that's the win-rate-curve
    // suite). post-Phase-30 merge re-pin 2026-07-12 against the merged tree.
    // Re-pinned 2026-07-13 (keep-hand rule, see the FloatEye pin above).
    // Re-pinned 2026-07-14: POISON ramp now resets on reapplication (spec 32 v3
    // — `applyEffect` re-stamps `appliedAt` for `escalatesPerTurn` DoTs), so a
    // reapplied poison ticks slightly less and the greedy line spent one more
    // play (15→16) to reach the same four-round status victory.
    // Re-pinned 2026-07-18 (color-match rider removal): straw-mans-jab (then
    // still in the library) lost its color-match +1-intensity dieBonus, its
    // bleed landed one point weaker, and the greedy line spent one more play
    // (16→17, statusPlays 11→12) for the same four-round status victory.
    // Re-pinned 2026-07-18 (Phase D8, see the FloatEye pin above):
    // recurring-symptom now holds the second MIX seat — still a four-round
    // status victory (plays 17→18, statusPlays 12→11).
    // Re-pinned 2026-08-08 (Profane Canon, see the FloatEye pin above).
    // Re-measured 2026-09-02 (THE BIG NUMBERS REWRITE + its tuning pass): the
    // same seeded line now closes in 3 rounds instead of 4 because the starter
    // office deals real damage. These figures are a FIDELITY MEASUREMENT of a
    // deterministic sequence, never a target — re-measure them after any
    // tuning change rather than treating a move as a regression.
    // Re-measured 2026-09-04 (free-line card-played clock, see the FloatEye
    // pin above): one fewer play (8→7, statusPlays 6→5) for the same
    // two-round status victory.
    // Re-measured 2026-09-25 (D7 flag collapse, see the FloatEye pin
    // above): the first spec-33 measurement of this line — a three-round
    // victory (plays 11, statusPlays 2).
    // Re-measured after the card purge (P1, 2026-09-27): the grey MIX at 5/5/5
    // loses this line in four rounds (plays 20, statusPlays 4). A fidelity
    // pin, not a balance gate — the grey office is the deck you outgrow.
    // Re-pointed at the Doorwarden in the enemy roster reset (R2): its boss
    // was retired. Re-measured: a four-round defeat (plays 20, statusPlays 4).
    it('seed 11 vs TheDoorwarden: the pinned sequence (Gate 0 law: one tray per phase)', () => {
        const r = runOneEncounter(loadout(MIX), TheDoorwarden, 11, 'greedy');
        expect({ outcome: r.outcome, rounds: r.rounds, plays: r.plays, statusPlays: r.statusPlays })
            .toEqual({ outcome: 'defeat', rounds: 4, plays: 20, statusPlays: 4 });
        // Determinism, not balance: the same seed must reproduce the same
        // sequence byte-for-byte. (The exact figures above are a fidelity
        // measurement of the CURRENT library + engine and are expected to be
        // re-measured whenever either moves — they are not a target.)
        const again = runOneEncounter(loadout(MIX), TheDoorwarden, 11, 'greedy');
        expect({ outcome: again.outcome, rounds: again.rounds, plays: again.plays, statusPlays: again.statusPlays })
            .toEqual({ outcome: r.outcome, rounds: r.rounds, plays: r.plays, statusPlays: r.statusPlays });
        expect(again.cardUsage).toEqual(r.cardUsage);
        // card-retreat no longer exists — it can never appear in cardUsage.
    }, 30_000);
});

describe('chaos — randomness flows only through the injected seeded rng', () => {
    it('rankCard consumes the provided rng (and returns its value)', () => {
        const s = freshState();
        let calls = 0;
        const rng = (): number => { calls++; return 0.42; };
        const score = COMBAT_SIM_POLICIES.chaos.rankCard(s, card(STATUS_CARD), rng);
        expect(calls).toBe(1);
        expect(score).toBe(0.42);
        expect(COMBAT_SIM_POLICIES.chaos.rankSignature).toBeDefined();
    });

    it('a full chaos encounter never touches Math.random (hermeticity)', () => {
        const spy = vi.spyOn(Math, 'random');
        const r = runOneEncounter(loadout(MIX), FloatEye, 9, 'chaos');
        expect(spy).not.toHaveBeenCalled();
        expect(['victory', 'mercy', 'defeat', 'retreat']).toContain(r.outcome);
    }, 30_000);

    it('chaos runs are seed-deterministic', () => {
        const a = runOneEncounter(loadout(MIX), FloatEye, 9, 'chaos');
        const b = runOneEncounter(loadout(MIX), FloatEye, 9, 'chaos');
        expect(b).toEqual(a);
    }, 30_000);
});

describe('per-card telemetry — cardUsage is consistent with the aggregate counters', () => {
    it('usage sums match plays / bottom+top / statusPlays', () => {
        const r = runOneEncounter(loadout(MIX), FloatEye, 3, 'greedy');
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

    it('respects an explicit deck: only its ids appear in usage', () => {
        const deck = ['grey-word', 'grey-word', 'grey-ward'];
        const allowed = new Set(deck);
        const r = runOneEncounter(loadout(MIX), FloatEye, 4, 'greedy', { deck });
        expect(Object.keys(r.cardUsage).length).toBeGreaterThan(0);
        for (const key of Object.keys(r.cardUsage)) {
            expect(allowed.has(key), `unexpected card '${key}' in usage`).toBe(true);
        }
    });

    it('focusCardIds boosts a card to the front of ranking so it gets exercised', () => {
        // Greedy would normally power the status card before the guard; the
        // focus boost must force the guard into play (the card-coverage lever).
        const deck = ['grey-word', 'grey-ward', 'grey-ward', 'grey-strike'];
        const r = runOneEncounter(loadout(deck), FloatEye, 6, 'greedy', {
            deck, focusCardIds: ['grey-ward'],
        });
        expect(r.cardUsage['grey-ward']?.plays ?? 0).toBeGreaterThanOrEqual(1);
        expect(r.cardUsage['grey-ward']?.bottomPlays ?? 0).toBeGreaterThanOrEqual(1);
    });

    it('throws on an unknown policy id (honest failure, no silent fallback)', () => {
        expect(() => runOneEncounter(loadout(MIX), FloatEye, 1, 'nope' as CombatSimPolicyId))
            .toThrow(/Unknown combat sim policy/);
    });
});
