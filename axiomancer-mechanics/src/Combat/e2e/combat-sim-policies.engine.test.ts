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
import { LittleBelle, KingOfRevenge, GraveLarva } from '../../Enemy/enemy.library';
import { getCardById } from '../../Cards/cards.library';
import { registerSandboxCards } from '../../Cards/cards.sandbox';
import { lookupEffect } from '../../Effects';
import { deepClone } from '../../Utils';
import {
    COMBAT_SIM_POLICIES, COMBAT_SIM_POLICY_ORDER, getSimPolicy, listSimPolicies,
    type CombatSimPolicyId, type CombatSimPolicy,
} from '../combat.sim-policies';
import { runOneEncounter, upgradeablePlayPhase } from '../combat.encounter.sim';
import { initializeCombatEncounter, rollEncounterDice, projectIncomingThreat } from '../combat.engine';
import { emptyObjectiveTelemetry, foldObjectiveEvents } from '../combat.objective.telemetry';
import { toCombatCard } from '../combat.cards';
import type { CombatCard, CombatEncounterState, GlyphInstance } from '../combat.encounter.types';

// Spec 32 v3: basePower is deleted at the schema level — the "no status game"
// card is a statusless utility fixture, and the Befriend lever (no library
// card carries `befriend_attempt` any more; the mercy path lives on the heart
// signature) is a sandbox fixture too.
const QA_STATUSLESS = 'qa-statusless-utility';
const QA_BEFRIEND = 'qa-befriend';
registerSandboxCards([
    {
        id: QA_STATUSLESS,
        name: 'QA Statusless Utility (test fixture)',
        philosophicalAspect: 'body',
        description: 'Test-only fixture: a card with no status payload, used to witness status-first ranking.',
        tier: 1,
        rank: 1,
        cardType: 'spell',
        targetType: 'enemy',
    },
    {
        id: QA_BEFRIEND,
        name: 'QA Befriend (test fixture)',
        philosophicalAspect: 'heart',
        description: 'Test-only fixture: the Befriend verb for the mercy-turn ranking law.',
        tier: 1,
        rank: 1,
        cardType: 'spell',
        targetType: 'enemy',
        specialMechanics: [{ kind: 'befriend_attempt' }],
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
    p.baseStats = { heart: 10, body: 10, mind: 10 };
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
const MIX = ['spoiled-poultice', 'unction-of-boils', 'scolds-bridle', 'chilblain-watch'];

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
    return initializeCombatEncounter(loadout(MIX), deepClone(GraveLarva), undefined, seed);
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
            expect(policy.signatureKinds).toEqual(['dot', 'control', 'mercy', 'conclude']);
            expect(policy.convictionThreshold).toBe(7);
            expect(policy.mercyChoice).toBe('spare');
            expect(policy.rankSignature).toBeUndefined();
        }
    });

    it('aggro-brute is the doctrinal weak baseline: pure damage preview, no status awareness', () => {
        const s = freshState();
        const brute = COMBAT_SIM_POLICIES['aggro-brute'];
        const dot = card('spoiled-poultice');
        const plain = card(QA_STATUSLESS);
        // The brute ranks strictly by preview — it does NOT put status first.
        expect(brute.rankCard(s, dot, forbiddenRng)).toBe(dot.bottomDamagePreview);
        expect(brute.rankCard(s, plain, forbiddenRng)).toBe(plain.bottomDamagePreview);
    });
});

describe('greedy rankCard — the legacy ordering as scores (doctrine: status > everything)', () => {
    it('ranks a status card above a statusless card', () => {
        const s = freshState();
        expect(COMBAT_SIM_POLICIES.greedy.rankCard(s, card('spoiled-poultice'), forbiddenRng))
            .toBeGreaterThan(COMBAT_SIM_POLICIES.greedy.rankCard(s, card(QA_STATUSLESS), forbiddenRng));
    });

    it('ranks a status NEW to the board above the same status already applied', () => {
        const s = freshState();
        const dot = card('spoiled-poultice');
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
        expect(greedy.rankCard(low, card(QA_BEFRIEND), forbiddenRng))
            .toBeGreaterThan(greedy.rankCard(low, card('spoiled-poultice'), forbiddenRng));
        // ...but NOT before that (status play stays the default game).
        expect(greedy.rankCard(s, card(QA_BEFRIEND), forbiddenRng))
            .toBeLessThan(greedy.rankCard(s, card('spoiled-poultice'), forbiddenRng));
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
    it('seed 11 vs LittleBelle: a status victory', () => {
        const r = runOneEncounter(loadout(MIX), LittleBelle, 11, 'greedy');
        expect({ outcome: r.outcome, rounds: r.rounds, plays: r.plays, statusPlays: r.statusPlays })
            .toEqual({ outcome: 'victory', rounds: 1, plays: 5, statusPlays: 1 });
        expect(r.cardUsage['spoiled-poultice']).toEqual({
            cardId: 'spoiled-poultice', plays: 1, bottomPlays: 0, topPlays: 1, statusLands: 0, discards: 0,
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
    // Re-pinned 2026-07-13 (keep-hand rule, see the LittleBelle pin above).
    // Re-pinned 2026-07-14: POISON ramp now resets on reapplication (spec 32 v3
    // — `applyEffect` re-stamps `appliedAt` for `escalatesPerTurn` DoTs), so a
    // reapplied poison ticks slightly less and the greedy line spent one more
    // play (15→16) to reach the same four-round status victory.
    // Re-pinned 2026-07-18 (color-match rider removal): straw-mans-jab (then
    // still in the library) lost its color-match +1-intensity dieBonus, its
    // bleed landed one point weaker, and the greedy line spent one more play
    // (16→17, statusPlays 11→12) for the same four-round status victory.
    // Re-pinned 2026-07-18 (Phase D8, see the LittleBelle pin above):
    // recurring-symptom now holds the second MIX seat — still a four-round
    // status victory (plays 17→18, statusPlays 12→11).
    // Re-pinned 2026-08-08 (Profane Canon, see the LittleBelle pin above).
    // Re-measured 2026-09-02 (THE BIG NUMBERS REWRITE + its tuning pass): the
    // same seeded line now closes in 3 rounds instead of 4 because the starter
    // office deals real damage. These figures are a FIDELITY MEASUREMENT of a
    // deterministic sequence, never a target — re-measure them after any
    // tuning change rather than treating a move as a regression.
    // Re-measured 2026-09-04 (free-line card-played clock, see the LittleBelle
    // pin above): one fewer play (8→7, statusPlays 6→5) for the same
    // two-round status victory.
    // Re-measured 2026-09-25 (D7 flag collapse, see the LittleBelle pin
    // above): the first spec-33 measurement of this line — a three-round
    // victory (plays 11, statusPlays 2).
    it('seed 11 vs KingOfRevenge: a status victory (Gate 0 law: one tray per phase)', () => {
        const r = runOneEncounter(loadout(MIX), KingOfRevenge, 11, 'greedy');
        expect({ outcome: r.outcome, rounds: r.rounds, plays: r.plays, statusPlays: r.statusPlays })
            .toEqual({ outcome: 'victory', rounds: 3, plays: 11, statusPlays: 2 });
        // Determinism, not balance: the same seed must reproduce the same
        // sequence byte-for-byte. (The exact figures above are a fidelity
        // measurement of the CURRENT library + engine and are expected to be
        // re-measured whenever either moves — they are not a target.)
        const again = runOneEncounter(loadout(MIX), KingOfRevenge, 11, 'greedy');
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
        const score = COMBAT_SIM_POLICIES.chaos.rankCard(s, card('spoiled-poultice'), rng);
        expect(calls).toBe(1);
        expect(score).toBe(0.42);
        expect(COMBAT_SIM_POLICIES.chaos.rankSignature).toBeDefined();
    });

    it('a full chaos encounter never touches Math.random (hermeticity)', () => {
        const spy = vi.spyOn(Math, 'random');
        const r = runOneEncounter(loadout(MIX), LittleBelle, 9, 'chaos');
        expect(spy).not.toHaveBeenCalled();
        expect(['victory', 'mercy', 'defeat', 'retreat']).toContain(r.outcome);
    }, 30_000);

    it('chaos runs are seed-deterministic', () => {
        const a = runOneEncounter(loadout(MIX), LittleBelle, 9, 'chaos');
        const b = runOneEncounter(loadout(MIX), LittleBelle, 9, 'chaos');
        expect(b).toEqual(a);
    }, 30_000);
});

describe('per-card telemetry — cardUsage is consistent with the aggregate counters', () => {
    it('usage sums match plays / bottom+top / statusPlays', () => {
        const r = runOneEncounter(loadout(MIX), LittleBelle, 3, 'greedy');
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
        const deck = ['spoiled-poultice', 'spoiled-poultice', 'chilblain-watch'];
        const allowed = new Set(deck);
        const r = runOneEncounter(loadout(MIX), LittleBelle, 4, 'greedy', { deck });
        expect(Object.keys(r.cardUsage).length).toBeGreaterThan(0);
        for (const key of Object.keys(r.cardUsage)) {
            expect(allowed.has(key), `unexpected card '${key}' in usage`).toBe(true);
        }
    });

    it('focusCardIds boosts a card to the front of ranking so it gets exercised', () => {
        // Greedy would normally power the DoT before the guard; the focus
        // boost must force the guard into play (the card-coverage lever).
        const deck = ['spoiled-poultice', 'chilblain-watch', 'chilblain-watch', 'hoarfrost-teeth'];
        const r = runOneEncounter(loadout(deck), LittleBelle, 6, 'greedy', {
            deck, focusCardIds: ['chilblain-watch'],
        });
        expect(r.cardUsage['chilblain-watch']?.plays ?? 0).toBeGreaterThanOrEqual(1);
        expect(r.cardUsage['chilblain-watch']?.bottomPlays ?? 0).toBeGreaterThanOrEqual(1);
    });

    it('throws on an unknown policy id (honest failure, no silent fallback)', () => {
        expect(() => runOneEncounter(loadout(MIX), LittleBelle, 1, 'nope' as CombatSimPolicyId))
            .toThrow(/Unknown combat sim policy/);
    });
});

// ── Phase 51 — the crackAt policy heuristic (GLYPHS) ─────────────────────────
// Doctrinal roster assignment: greedy/blind/dot-weaver/turtle/control-lock get
// crackAt 2 (cap/2, glyphExpectedValue's own "reasonable crack timing"
// assumption); aggro-brute/chaos/mercy-seeker stay never-cracking (absent).
describe('crackAt roster assignment (combat.sim-policies)', () => {
    it('exactly the doctrine-fit five carry crackAt: 2', () => {
        const withCrackAt = COMBAT_SIM_POLICY_ORDER.filter(id => COMBAT_SIM_POLICIES[id].crackAt !== undefined);
        expect(withCrackAt.sort()).toEqual(['blind', 'control-lock', 'dot-weaver', 'greedy', 'turtle'].sort());
        for (const id of withCrackAt) expect(COMBAT_SIM_POLICIES[id].crackAt).toBe(2);
    });

    it('aggro-brute, chaos, and mercy-seeker are left never-cracking', () => {
        for (const id of ['aggro-brute', 'chaos', 'mercy-seeker'] as const) {
            expect(COMBAT_SIM_POLICIES[id].crackAt).toBeUndefined();
        }
    });
});

// ── Phase 51 — the crackAt decision seam (combat.encounter.sim) ─────────────
// Read by `upgradeablePlayPhase` (the spec-33 driver) — these cases drive it
// directly with a hand-built glyph and a policy stub, per the phase brief's
// own test spec.
describe('crackAt decision seam — upgradeablePlayPhase (combat.encounter.sim)', () => {
    function stubPolicy(crackAt: number | undefined): CombatSimPolicy {
        return {
            id: 'greedy',
            name: 'crackAt test stub',
            description: 'test-only witness for the crackAt decision seam',
            preferredFocus: 'balanced',
            rankCard: () => 0,
            signatureKinds: [],
            // Never funds a signature — isolates the crack check from the
            // existing conviction/signature-cast branch it sits beside.
            convictionThreshold: 999,
            mercyChoice: 'spare',
            capitulationChoice: 'continue',
            crackAt,
        };
    }

    /** A four-fixed-dice phase-play state (spec 33), the only shape
     *  `upgradeablePlayPhase` reads. */
    function upgradeableState(seed = 5): CombatEncounterState {
        const initial = initializeCombatEncounter(loadout(MIX), deepClone(GraveLarva), undefined, seed);
        return rollEncounterDice(initial).state;
    }

    function glyph(id: string, charges: number, kind: 'poison' | 'barrier' = 'poison'): GlyphInstance {
        return kind === 'poison'
            ? { id, cardId: 'the-plague-seal', payload: { kind: 'poison', baseIntensity: 1, duration: 2 }, charges, cap: 3 }
            : { id, cardId: 'the-hoarwatch-sigil', payload: { kind: 'barrier', baseAmount: 2 }, charges, cap: 3 };
    }

    const crackedIds = (state: CombatEncounterState): string[] =>
        state.log
            .filter((e): e is Extract<typeof e, { kind: 'glyph-cracked' }> => e.kind === 'glyph-cracked')
            .map(e => e.glyphId);

    it('a policy with crackAt set cracks its eligible glyph once charges meet the threshold', () => {
        const state = { ...upgradeableState(), glyphs: [glyph('g1', 2)] };
        const result = upgradeablePlayPhase(state, stubPolicy(2), () => 0.5, {}, {});
        expect(crackedIds(result.state)).toContain('g1');
        expect(result.state.glyphs).not.toContainEqual(expect.objectContaining({ id: 'g1' }));
    });

    it('a glyph below the threshold is never cracked', () => {
        const state = { ...upgradeableState(), glyphs: [glyph('g1', 1)] };
        const result = upgradeablePlayPhase(state, stubPolicy(2), () => 0.5, {}, {});
        expect(crackedIds(result.state)).not.toContain('g1');
        expect(result.state.glyphs).toContainEqual(expect.objectContaining({ id: 'g1' }));
    });

    it('a policy with crackAt ABSENT never cracks, even with a glyph sitting at cap', () => {
        const state = { ...upgradeableState(), glyphs: [glyph('g1', 3)] };
        const result = upgradeablePlayPhase(state, stubPolicy(undefined), () => 0.5, {}, {});
        expect(crackedIds(result.state)).toEqual([]);
        expect(result.state.glyphs).toEqual([glyph('g1', 3)]);
    });

    it('two eligible glyphs at different charges: the higher-charge one cracks FIRST', () => {
        const state = {
            ...upgradeableState(),
            glyphs: [glyph('g1', 2), glyph('g2', 3, 'barrier')],
        };
        const result = upgradeablePlayPhase(state, stubPolicy(2), () => 0.5, {}, {});
        expect(crackedIds(result.state).slice(0, 2)).toEqual(['g2', 'g1']);
    });

    it('a true tie (equal charges) breaks to state.glyphs array order', () => {
        const state = {
            ...upgradeableState(),
            glyphs: [glyph('g1', 2), glyph('g2', 2, 'barrier')],
        };
        const result = upgradeablePlayPhase(state, stubPolicy(2), () => 0.5, {}, {});
        expect(crackedIds(result.state).slice(0, 2)).toEqual(['g1', 'g2']);
    });
});

// ── Phase 102 — the strikeAddsAt policy heuristic (SUMMON) ──────────────────
// The panel was unanimous that the sim must be TAUGHT the brood rather than
// left blind: an archetype the witness cannot answer produces matrix rows that
// are wrong in a known direction, and `CLAUDE.md` routes every balance question
// through those rows. Roster assignment mirrors `crackAt` exactly — the same
// doctrine-fit five, so the two knobs can never drift apart silently.
describe('strikeAddsAt roster assignment (combat.sim-policies)', () => {
    it('exactly the crackAt five also carry strikeAddsAt: 1', () => {
        const withStrike = COMBAT_SIM_POLICY_ORDER.filter(id => COMBAT_SIM_POLICIES[id].strikeAddsAt !== undefined);
        expect(withStrike.sort()).toEqual(['blind', 'control-lock', 'dot-weaver', 'greedy', 'turtle'].sort());
        for (const id of withStrike) expect(COMBAT_SIM_POLICIES[id].strikeAddsAt).toBe(1);
    });

    it('aggro-brute, chaos, and mercy-seeker are left never-striking', () => {
        for (const id of ['aggro-brute', 'chaos', 'mercy-seeker'] as const) {
            expect(COMBAT_SIM_POLICIES[id].strikeAddsAt).toBeUndefined();
        }
    });
});

// ── Phase 102 — the strikeAddsAt decision seam (combat.encounter.sim) ───────
// Mirrors the `crackAt` seam above in shape: the knob is read by
// `upgradeablePlayPhase`.
describe('strikeAddsAt decision seam — upgradeablePlayPhase (combat.encounter.sim)', () => {
    function stubPolicy(strikeAddsAt: number | undefined): CombatSimPolicy {
        return {
            id: 'greedy',
            name: 'strikeAddsAt test stub',
            description: 'test-only witness for the strikeAddsAt decision seam',
            preferredFocus: 'balanced',
            rankCard: () => 0,
            signatureKinds: [],
            convictionThreshold: 999,
            mercyChoice: 'spare',
            capitulationChoice: 'continue',
            strikeAddsAt,
        };
    }

    function broodState(over: Partial<CombatEncounterState> = {}): CombatEncounterState {
        const initial = initializeCombatEncounter(loadout(MIX), deepClone(GraveLarva), undefined, 5);
        return {
            ...rollEncounterDice(initial).state,
            conviction: 12,
            adds: [
                { id: 'a1', name: 'QA Shoot', vitae: 1, maxVitae: 1, bite: 4 },
                { id: 'a2', name: 'QA Bough', vitae: 1, maxVitae: 1, bite: 9 },
            ],
            ...over,
        };
    }

    const struckIds = (state: CombatEncounterState): string[] =>
        state.log
            .filter((e): e is Extract<typeof e, { kind: 'add-struck' }> => e.kind === 'add-struck')
            .map(e => e.addId);

    it('a policy with strikeAddsAt set clears the brood when it would get through', () => {
        const result = upgradeablePlayPhase(broodState(), stubPolicy(1), () => 0.5, {}, {});
        // Highest bite first — the body doing the most damage is the one worth
        // the Conviction.
        expect(struckIds(result.state)[0]).toBe('a2');
        expect(struckIds(result.state)).toContain('a1');
    });

    it('a live wall answers the brood for free, so the witness declines to pay', () => {
        // The second honest line of the design, taught rather than hard-coded:
        // a turtle behind a wall projects `addNetDamage === 0` and keeps its ◆.
        const result = upgradeablePlayPhase(broodState({ guard: 9999 }), stubPolicy(1), () => 0.5, {}, {});
        expect(struckIds(result.state)).toEqual([]);
        expect(result.state.adds).toHaveLength(2);
    });

    it('a policy with strikeAddsAt ABSENT never strikes — the byte-identical default', () => {
        const result = upgradeablePlayPhase(broodState(), stubPolicy(undefined), () => 0.5, {}, {});
        expect(struckIds(result.state)).toEqual([]);
        expect(result.state.adds).toHaveLength(2);
    });

    it('never pays for a brood the wall THIS SAME PHASE buys answers for free', () => {
        // Audit 3.8, the sibling of the live-wall law above — same law, but the
        // wall is BOUGHT DURING the phase instead of pre-set, which is the only
        // shape a real fight ever has. The decision used to be taken in the
        // powered-play preamble, before the card pass, so the witness read a
        // stale wall and bought a body the very next play removed for free.
        //
        // Fixture: guard 2 at the top of the phase leaves this small brood
        // getting through (addNetDamage 2 >= strikeAddsAt 1), but the wall the
        // phase itself buys takes addNetDamage to 0.
        const state = broodState({
            guard: 2,
            adds: [
                { id: 'a1', name: 'QA Shoot', vitae: 1, maxVitae: 1, bite: 1 },
                { id: 'a2', name: 'QA Bough', vitae: 1, maxVitae: 1, bite: 1 },
            ],
        });
        const result = upgradeablePlayPhase(state, stubPolicy(1), () => 0.5, {}, {});

        // Asserted UNCONDITIONALLY: if MIX's draw order or chilblain-watch's
        // guard ever changes, this fails loudly on its own premise rather than
        // passing vacuously.
        expect(
            projectIncomingThreat(result.state).addNetDamage,
            'fixture premise: the wall this phase buys answers this brood',
        ).toBe(0);
        expect(struckIds(result.state)).toEqual([]);
        expect(result.state.adds).toHaveLength(2);
        expect(result.state.conviction).toBeGreaterThanOrEqual(state.conviction);
    });

    it('the score ledger accounts for every Conviction the board charged', () => {
        // Audit 3.8, the cross-module half: `foldObjectiveEvents` is what the
        // Combat Quality Index reads, and it was blind to `add-struck`, so a
        // fight that paid its Conviction through the strike tap scored as
        // having spent none of it.
        //
        // Fixture premise: `convictionThreshold: 999` keeps every signature
        // unaffordable and MIX carries no omen card, so the strike tap is the
        // ONLY Conviction sink this phase can reach. That premise is what makes
        // the conservation equality below statable at all, so it is asserted
        // rather than assumed.
        const before = broodState();
        const result = upgradeablePlayPhase(before, stubPolicy(1), () => 0.5, {}, {});
        const telemetry = foldObjectiveEvents(result.state.log, emptyObjectiveTelemetry());

        expect(struckIds(result.state).length, 'fixture premise: this phase DID strike').toBeGreaterThan(0);
        expect(telemetry.convictionGained, 'fixture premise: this phase has no Conviction income').toBe(0);
        // The law, in relation form rather than magnitude: whatever the board
        // removed from the pool, the ledger the score reads must show as spent.
        // It survives any retune of STRIKE_ADD_COST or of how many bodies the
        // witness clears.
        expect(telemetry.convictionSpent).toBe(before.conviction - result.state.conviction);
    });

    it('an unaffordable strike is never attempted (no fizzle spam in the log)', () => {
        const result = upgradeablePlayPhase(broodState({ conviction: 1 }), stubPolicy(1), () => 0.5, {}, {});
        expect(struckIds(result.state)).toEqual([]);
        expect(result.state.adds).toHaveLength(2);
    });
});
