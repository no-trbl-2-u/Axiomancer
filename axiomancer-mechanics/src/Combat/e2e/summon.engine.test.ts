/**
 * Hermetic E2E — Phase 102 (SUMMON): the add-spawning enemy archetype.
 *
 * These are BUG DETECTORS and DOCTRINE PINS, not balance laws. Nothing here
 * asserts that N is 2 or that a bite is 4; retune those freely and every test
 * below still passes. What they pin is the set of rulings the three-lens design
 * panel refused to ship without:
 *
 *  1. THE WIN CONDITION IS UNTOUCHED. The enemy's sole VITAE bar is the fight.
 *     Clearing the whole brood can never end a combat, and a living brood can
 *     never postpone the foe's own death.
 *  2. THE SPAWN IS A ONE-SHOT, NEVER AN EMPTINESS CHECK. "Spawn when none are
 *     alive" makes the player's own clear cause the respawn, which turns the
 *     verb into a tax.
 *  3. THE BITE IS FLAT AND ISOLATED. It resolves in its own block outside the
 *     telegraph loop, so no multiplier touches it and no ledger the authored
 *     telegraph reads is contaminated by it. The rejected design — appending a
 *     synthetic entry to `threatEffects` — passes every OTHER test in this
 *     repo while corrupting four of them; the ledger-isolation describe below
 *     is the only gate that catches it.
 *  4. THE TELEGRAPH DOES NOT LIE. `projectIncomingThreat().addNetDamage` is the
 *     number `resolveThreatPhase` actually applies, because both go through one
 *     `soakFlatHit`.
 *
 * Pure math + fixed/counting RNG only; no disk / network / TTY.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import type { EnemyKeyword, EnemyStage } from '../../Enemy/enemy-keywords';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { lookupEffect, applyEffect } from '../../Effects';
import { effectsLibrary } from '../../Effects/effects.library';
import type { Effect, ActiveEffect } from '../../Effects/types';
import {
    initializeCombatEncounter, rollEncounterDice, resolveThreatPhase, processBetweenPhases,
    strikeAdd, projectIncomingThreat, projectEnemyHealPerRound,
    ADD_WAVE_CAP, STRIKE_ADD_COST, ADD_BITE_PER_LEVEL,
} from '../combat.engine';
import { setUpgradeableDice } from '../combat.upgradeable-dice';
import type {
    CombatAdd, CombatEncounterState, CombatEvent, CombatThreatEffect,
} from '../combat.encounter.types';

afterEach(() => { setUpgradeableDice(false); vi.restoreAllMocks(); });

function findEvents<K extends CombatEvent['kind']>(events: CombatEvent[], kind: K): Extract<CombatEvent, { kind: K }>[] {
    return events.filter((e): e is Extract<CombatEvent, { kind: K }> => e.kind === kind);
}

// The skipTurn control fixture — the only way to drive the engine's `hindered`
// branch since the spec 32 v3 keyword reset deleted the library's Sleep.
// Registered into the shared registry the threat engine actually reads
// (mirrors `hazard-pattern-combat-helpers.engine.test.ts`); never touches JSON.
const SUMMON_FIXTURES: Effect[] = [{
    id: 'qa_summon_skip', name: 'qa sleep', description: 'skipTurn control fixture',
    type: 'debuff', category: 'control', duration: 3, stacking: 'none', tier: 2,
    payload: { actionRestriction: { skipTurn: true } },
}];
beforeAll(() => { for (const e of SUMMON_FIXTURES) effectsLibrary.registry.set(e.id, e); });
afterAll(() => { for (const e of SUMMON_FIXTURES) effectsLibrary.registry.delete(e.id); });

const rng = (): number => 0.5;
const SEED = 7;
/** L22 elite → `max(2, round(22 * 0.2))` = 4 per body. */
const FOE_LEVEL = 22;
const EXPECTED_BITE = Math.max(2, Math.round(FOE_LEVEL * ADD_BITE_PER_LEVEL));

function makePlayer(): Character {
    const p = deepClone(Player);
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 400; p.maxHealth = 400;
    p.effects = [];
    return p;
}

function makeEnemy(over: Partial<Enemy> = {}): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-summon-dummy';
    e.name = 'QA Summoner';
    e.level = FOE_LEVEL;
    e.health = 1000; e.maxHealth = 1000; e.effects = [];
    e.keywords = undefined; e.stages = undefined;
    return { ...e, ...over };
}

const SUMMON_2: EnemyKeyword = { kind: 'summon', n: 2, addName: 'QA Shoot' };

function open(enemy: Enemy = makeEnemy()): CombatEncounterState {
    let s = initializeCombatEncounter(makePlayer(), enemy, undefined, SEED);
    s = rollEncounterDice(s, rng).state;
    return s;
}

/** Seeds a live brood onto a state without going through a spawn boundary. */
function addState(
    s: CombatEncounterState,
    adds: Array<Partial<CombatAdd>> = [{}, {}],
    over: Partial<CombatEncounterState> = {},
): CombatEncounterState {
    return {
        ...s,
        adds: adds.map((a, i) => ({
            id: `qa-add-${i}`, name: 'QA Shoot', vitae: 1, maxVitae: 1, bite: EXPECTED_BITE, ...a,
        })),
        conviction: 12,
        ...over,
    };
}

/** Rewrites the CURRENT phase's telegraph, leaving the authored sequence's
 *  shape (length, rungs, stances, stake flags) exactly as generated. */
function withTelegraph(s: CombatEncounterState, effects: CombatThreatEffect[]): CombatEncounterState {
    const idx = Math.min(s.currentPhaseIndex, s.threatPhases.length - 1);
    return {
        ...s,
        threatPhases: s.threatPhases.map((p, i) => (
            i === idx ? { ...p, threatAction: { ...p.threatAction, effects } } : p
        )),
    };
}

/** Puts the skipTurn fixture on the foe, so its telegraph is denied. */
function hinder(s: CombatEncounterState): CombatEncounterState {
    const def = lookupEffect('qa_summon_skip')!;
    const applied = applyEffect(s.enemy.effects as ActiveEffect[], def, s.round);
    return { ...s, enemy: { ...s.enemy, effects: applied.activeEffects } };
}

// ─────────────────────────────────────────────────────────────────────────────

describe('SUMMON never touches the win condition', () => {
    // THE DOCTRINE PIN. The enemy's SOLE VITAE bar is the fight; adds are
    // furniture on the board, and this test is the gate on the whole phase.
    it("clearing every add never ends the combat; only the foe's VITAE does", () => {
        const s = addState(open(makeEnemy({ keywords: [SUMMON_2] })));
        expect(s.adds).toHaveLength(2);

        const first = strikeAdd(s, s.adds![0].id, rng);
        const second = strikeAdd(first.state, first.state.adds![0].id, rng);

        // Direction 1 — an add's death is never a win.
        expect(second.state.adds).toEqual([]);
        expect(second.state.finalOutcome).toBeFalsy();
        expect(second.state.phase).toBe('phase-play');
        expect(findEvents([...first.events, ...second.events], 'combat-ended')).toEqual([]);

        // Direction 2 — an add's LIFE is never a stay of execution. Same state,
        // both bodies still standing, foe's bar at 0.
        const dying = { ...s, enemy: { ...s.enemy, health: 0 } };
        const res = resolveThreatPhase(dying, rng);
        expect(res.state.adds).toHaveLength(2);
        expect(res.state.finalOutcome).toBe('victory');
        expect(findEvents(res.events, 'combat-ended')).toHaveLength(1);
    });

    it('the brood is not a second bar: no add ever reaches state.enemy', () => {
        const base = open(makeEnemy({ keywords: [SUMMON_2] }));
        const control = resolveThreatPhase(base, rng).state;
        const brood = resolveThreatPhase(addState(base), rng).state;

        expect(brood.enemy.health).toBe(control.enemy.health);
        expect(brood.enemy.maxHealth).toBe(control.enemy.maxHealth);
        expect(brood.enemy.effects).toEqual(control.enemy.effects);
    });

    it('strikeAdd removes a body and nothing else on the foe moves', () => {
        const s = addState(open(makeEnemy({ keywords: [SUMMON_2] })));
        const res = strikeAdd(s, 'qa-add-0', rng);
        expect(res.state.enemy).toEqual(s.enemy);
    });
});

describe('spawn is a one-shot, never an emptiness check', () => {
    it('spawns exactly one wave of n adds at the first phase boundary', () => {
        const s = open(makeEnemy({ keywords: [SUMMON_2] }));
        const res = processBetweenPhases(s, rng);
        const spawned = findEvents(res.events, 'add-spawned');

        expect(spawned).toHaveLength(1);
        expect(spawned[0].addIds).toHaveLength(2);
        expect(spawned[0].bite).toBe(EXPECTED_BITE);
        expect(spawned[0].wave).toBe(1);
        expect(res.state.adds).toHaveLength(2);
        expect(res.state.addWavesSpawned).toBe(1);
        expect(res.state.adds!.every(a => a.vitae === 1 && a.maxVitae === 1)).toBe(true);
    });

    it('a cleared wave NEVER respawns, however many boundaries pass — the anti-tax pin', () => {
        let s = processBetweenPhases(open(makeEnemy({ keywords: [SUMMON_2] })), rng).state;
        // The player pays and clears the whole wave.
        for (const add of [...s.adds!]) s = strikeAdd({ ...s, conviction: 12 }, add.id, rng).state;
        expect(s.adds).toEqual([]);

        for (let i = 0; i < 3; i++) {
            const res = processBetweenPhases({ ...s, phase: 'phase-resolve' }, rng);
            expect(findEvents(res.events, 'add-spawned')).toEqual([]);
            s = res.state;
        }
        expect(s.adds).toEqual([]);
        expect(s.addWavesSpawned).toBe(1);
    });

    it('a STAGE-firing boundary spawns wave 2, and ADD_WAVE_CAP stops wave 3', () => {
        const stage = (name: string, round: number): EnemyStage => ({
            at: { round }, name, text: `${name} fires`,
        });
        const foe = makeEnemy({
            keywords: [SUMMON_2],
            stages: [stage('SECOND', 2), stage('THIRD', 3), stage('FOURTH', 4)],
        });
        let s = open(foe);
        const waves: number[] = [];
        for (let i = 0; i < 5; i++) {
            const res = processBetweenPhases({ ...s, phase: 'phase-resolve' }, rng);
            waves.push(findEvents(res.events, 'add-spawned').length);
            s = res.state;
        }
        // Wave 1 on the first boundary; wave 2 on the next boundary a stage
        // fires; nothing after that, however many stages remain.
        expect(waves.reduce((a, b) => a + b, 0)).toBe(ADD_WAVE_CAP);
        expect(s.addWavesSpawned).toBe(ADD_WAVE_CAP);
    });

    it('a STAGE whose `gain` grants SUMMON spawns on the boundary it is entered', () => {
        // The spawn block sits AFTER the stage block precisely for this: a
        // stage-granted SUMMON must not be a phase late.
        const foe = makeEnemy({
            stages: [{ at: { round: 1 }, name: 'IT OPENS', text: 'the bark splits', gain: [SUMMON_2] }],
        });
        const res = processBetweenPhases(open(foe), rng);
        expect(findEvents(res.events, 'stage-entered')).toHaveLength(1);
        expect(findEvents(res.events, 'add-spawned')).toHaveLength(1);
        expect(res.state.adds).toHaveLength(2);
    });

    it("a STAGE's cleanse wipes enemy.effects and leaves the brood standing", () => {
        const foe = makeEnemy({
            keywords: [SUMMON_2],
            stages: [{ at: { round: 1 }, name: 'IT SHEDS', text: 'the rot falls off', cleanse: true }],
        });
        // Waves already spent, so this boundary's only business is the cleanse.
        const seeded = addState(open(foe), [{}, {}], { addWavesSpawned: ADD_WAVE_CAP });
        const withAffliction = hinder(seeded);
        expect(withAffliction.enemy.effects.length).toBeGreaterThan(0);

        const res = processBetweenPhases({ ...withAffliction, phase: 'phase-resolve' }, rng);
        expect(res.state.enemy.effects).toEqual([]);
        // A body is not an affliction.
        expect(res.state.adds).toHaveLength(2);
    });

    it('the spawn consumes no RNG — a seeded draw downstream cannot shift', () => {
        let calls = 0;
        const counting = (): number => { calls += 1; return 0.5; };

        const plain = open(makeEnemy());
        processBetweenPhases(plain, counting);
        const withoutSummon = calls;

        calls = 0;
        const summoner = open(makeEnemy({ keywords: [SUMMON_2] }));
        const res = processBetweenPhases(summoner, counting);
        expect(findEvents(res.events, 'add-spawned')).toHaveLength(1);
        expect(calls).toBe(withoutSummon);
    });
});

describe('the bite is flat and isolated', () => {
    const TELEGRAPH: CombatThreatEffect[] = [{ damage: 30 }];

    function bitten(s: CombatEncounterState): { raw: number; dealt: number } | undefined {
        const res = resolveThreatPhase(s, rng);
        return findEvents(res.events, 'add-bit')[0];
    }

    it('raw is the printed sum of bites and no multiplier term touches it', () => {
        const base = addState(withTelegraph(open(makeEnemy({ keywords: [SUMMON_2] })), TELEGRAPH));
        const control = bitten(base);
        expect(control?.raw).toBe(2 * EXPECTED_BITE);

        // Four terms the telegraph loop applies, none of which may reach a bite:
        // the STAGE bonus, the escalation clock (round), a WEAKEN stack on the
        // foe (soft control), and the open stance check's rail.
        expect(bitten({ ...base, stageThreatBonus: 0.5 })?.raw).toBe(control?.raw);
        expect(bitten({ ...base, round: 25 })?.raw).toBe(control?.raw);
        expect(bitten(hinder(base))?.raw).toBe(control?.raw);
        expect(bitten({ ...base, playerStance: 'body' })?.raw).toBe(control?.raw);
    });

    it('the brood bites while the FOE is denied — staggering it does not silence them', () => {
        const denied = hinder(addState(withTelegraph(open(makeEnemy({ keywords: [SUMMON_2] })), TELEGRAPH)));
        const res = resolveThreatPhase(denied, rng);
        const resolved = findEvents(res.events, 'phase-resolved')[0];
        const bite = findEvents(res.events, 'add-bit')[0];

        expect(resolved.mark).toBe('clear');   // the foe's own turn was denied
        expect(bite.dealt).toBeGreaterThan(0); // bodies act anyway
    });

    it('the brood does not bite once the foe is defeated', () => {
        const dead = { ...addState(open(makeEnemy({ keywords: [SUMMON_2] }))), enemy: { ...makeEnemy(), health: 0 } };
        const res = resolveThreatPhase(dead, rng);
        expect(findEvents(res.events, 'add-bit')).toEqual([]);
    });

    it('GUARD and BARRIER soak it, SWIFT halves the wall against it, armor subtracts once', () => {
        const foe = makeEnemy({ keywords: [SUMMON_2] });
        const bare = addState(withTelegraph(open(foe), []));
        const raw = 2 * EXPECTED_BITE;

        expect(bitten(bare)?.dealt).toBe(raw);
        expect(bitten({ ...bare, guard: raw })?.dealt).toBe(0);
        expect(bitten({ ...bare, barrier: raw })?.dealt).toBe(0);

        // SWIFT: the wall absorbs half its face value (and is consumed at the
        // full rate), so a wall exactly the size of the bite only half-stops it.
        const swiftFoe = makeEnemy({ keywords: [SUMMON_2, { kind: 'swift' }] });
        const swift = addState(withTelegraph(open(swiftFoe), []));
        expect(bitten({ ...swift, guard: raw })?.dealt).toBe(raw - Math.floor(raw / 2));

        // ARMOR: flat, once, before the wall.
        const armorDef = lookupEffect('buff_damage_reduction')!;
        const armored = applyEffect(bare.player.effects as ActiveEffect[], armorDef, bare.round);
        const armorState = { ...bare, player: { ...bare.player, effects: armored.activeEffects } };
        const armorDealt = bitten(armorState)?.dealt ?? -1;
        expect(armorDealt).toBeLessThan(raw);
        expect(armorDealt).toBeGreaterThanOrEqual(0);
    });

    it('BRUTAL does not double it and RIPOSTE is neither fired nor consumed by it', () => {
        const plainFoe = makeEnemy({ keywords: [SUMMON_2] });
        const brutalFoe = makeEnemy({ keywords: [SUMMON_2, { kind: 'brutal' }] });
        const plain = hinder(addState(withTelegraph(open(plainFoe), [])));
        const brutal = hinder(addState(withTelegraph(open(brutalFoe), [])));
        expect(bitten(brutal)?.dealt).toBe(bitten(plain)?.dealt);

        const riposted = { ...plain, riposte: { damage: 5, reduce: 99 } };
        const res = resolveThreatPhase(riposted, rng);
        expect(findEvents(res.events, 'riposte-fired')).toEqual([]);
        // The parry did not blunt the bite either — it belongs to the foe's swing.
        expect(findEvents(res.events, 'add-bit')[0].dealt).toBe(2 * EXPECTED_BITE);
    });

    it('RAVENOUS never heals off the brood and WOUNDING never fires off it', () => {
        const foe = makeEnemy({
            keywords: [SUMMON_2, { kind: 'ravenous' }, { kind: 'wounding', n: 1 }],
            health: 500,
        });
        // The foe is denied, so the ONLY damage this phase is the brood's.
        const s = hinder(addState(withTelegraph(open(foe), []), [{ bite: 40 }]));
        const res = resolveThreatPhase(s, rng);

        expect(findEvents(res.events, 'add-bit')[0].dealt).toBe(40);
        expect(res.state.enemy.health).toBe(s.enemy.health);
        expect(findEvents(res.events, 'enemy-healed')).toEqual([]);
        expect(findEvents(res.events, 'curse-injected')).toEqual([]);
    });

    it('the bite DOES reach enemyDamageThisTurn — HP accounting has to reconcile', () => {
        const s = hinder(addState(withTelegraph(open(makeEnemy({ keywords: [SUMMON_2] })), [])));
        const before = s.player.health;
        const res = resolveThreatPhase(s, rng);
        const dealt = findEvents(res.events, 'add-bit')[0].dealt;
        expect(dealt).toBe(2 * EXPECTED_BITE);
        // The bite is real VITAE lost, and the ledger says so. A deliberate
        // choice on record, not an omission: `enemyDamageLastRound` inflates
        // for SUMMON foes and for nothing else.
        expect(before - res.state.player.health).toBeGreaterThanOrEqual(dealt);
    });
});

describe("the brood does not contaminate the foe's ledgers", () => {
    // THE ENGINEERING GATE. Every one of these assertions still passes under a
    // brood-free engine, and every one of them FAILS if the bite is folded back
    // into `threatEffects` as a synthetic entry. Nothing else in the suite does.
    const TELEGRAPH: CombatThreatEffect[] = [{ damage: 10 }];

    function pair(guard: number): { control: CombatEncounterState; brood: CombatEncounterState; events: CombatEvent[]; controlEvents: CombatEvent[] } {
        const foe = makeEnemy({ keywords: [{ kind: 'summon', n: 1 }] });
        const base = { ...withTelegraph(open(foe), TELEGRAPH), guard };
        const c = resolveThreatPhase(base, rng);
        const b = resolveThreatPhase(addState(base, [{}]), rng);
        return { control: c.state, brood: b.state, events: b.events, controlEvents: c.events };
    }

    it('lastThreatFullyBlocked reads exactly what it reads with no brood', () => {
        // A wall that fully blocks the foe's own blow must STILL read as a full
        // block while an add is biting through the leftovers.
        const { control, brood } = pair(500);
        expect(control.lastThreatFullyBlocked).toBe(true);
        expect(brood.lastThreatFullyBlocked).toBe(control.lastThreatFullyBlocked);

        const open = pair(0);
        expect(open.control.lastThreatFullyBlocked).toBe(false);
        expect(open.brood.lastThreatFullyBlocked).toBe(open.control.lastThreatFullyBlocked);
    });

    it('threat-fired reports ONLY the authored telegraph — no synthetic entry', () => {
        const { events, controlEvents } = pair(0);
        const broodFired = findEvents(events, 'threat-fired')[0];
        const controlFired = findEvents(controlEvents, 'threat-fired')[0];
        expect(broodFired.effects.length).toBe(controlFired.effects.length);
        expect(broodFired.effects).toEqual(controlFired.effects);
        expect(broodFired.effects.length).toBe(TELEGRAPH.length);
    });

    it('penaltiesApplied is identical to the control', () => {
        const { control, brood } = pair(0);
        const last = (s: CombatEncounterState) => s.phaseResults[s.phaseResults.length - 1];
        expect(last(brood).penaltiesApplied.length).toBe(last(control).penaltiesApplied.length);
        expect(last(brood).penaltiesApplied).toEqual(last(control).penaltiesApplied);
    });

    it("the 'prior-threat-fully-blocked' branch commits the same fork with a brood alive", () => {
        // The authored branch condition reads `lastThreatFullyBlocked`, which
        // the rejected design corrupts via `attacksLanded`.
        const foe = makeEnemy({ keywords: [{ kind: 'summon', n: 1 }] });
        const base = { ...withTelegraph(open(foe), TELEGRAPH), guard: 500 };
        const branched = (s: CombatEncounterState): CombatEncounterState => ({
            ...s,
            threatPhases: s.threatPhases.map((p, i) => (i === 1 ? {
                ...p,
                branch: {
                    condition: { kind: 'prior-threat-fully-blocked' as const },
                    conditionText: 'if you blocked it whole',
                    then: { enemyStance: 'body' as const, threatAction: { description: 'punish', effects: [{ damage: 40 }] } },
                    else: { enemyStance: 'mind' as const, threatAction: { description: 'press', effects: [{ damage: 10 }] } },
                },
            } : p)),
        });
        const control = resolveThreatPhase(branched(base), rng);
        const brood = resolveThreatPhase(branched(addState(base, [{}])), rng);

        const taken = (evts: CombatEvent[]) => findEvents(evts, 'threat-branch').map(e => e.taken);
        expect(taken(control.events)).toEqual(['then']);
        expect(taken(brood.events)).toEqual(taken(control.events));
    });

    it("THE COVETED DIE's 'block' payout is byte-identical with a brood biting through", () => {
        // THE ACCOUNTING TEST the panel demanded, and the one regression no
        // pre-existing fixture catches. The rejected design appended the bite
        // to `threatEffects`, which drives `attacksLanded`/`attacksFullyBlocked`
        // — the exact pair the 'block' method reads at the coveted-die gate.
        // Under it a fully-blocked telegraph silently STOPS paying out the
        // moment a body is on the board, and every other test in this repo
        // stays green.
        setUpgradeableDice(true);

        const foe = makeEnemy({ keywords: [{ kind: 'summon', n: 1 }] });
        const staked = (s: CombatEncounterState): CombatEncounterState => {
            const idx = Math.min(s.currentPhaseIndex, s.threatPhases.length - 1);
            return {
                ...s,
                covetedDiceClaimed: [],
                threatPhases: s.threatPhases.map((p, i) => (i === idx ? { ...p, stake: true } : p)),
            };
        };
        // A wall that swallows the foe's whole authored blow (the 'block'
        // condition) and still leaves a body chewing on the leftovers.
        const base = staked({ ...withTelegraph(open(foe), TELEGRAPH), guard: 500 });
        const control = resolveThreatPhase(base, rng);
        const brood = resolveThreatPhase(addState(base, [{ bite: 600 }]), rng);

        const stolen = (evts: CombatEvent[]) => findEvents(evts, 'coveted-die-stolen');
        expect(stolen(control.events)).toHaveLength(1);
        expect(stolen(control.events)[0].method).toBe('block');
        // The add really is biting, and the payout is still identical — down to
        // the die's own id, which is derived from the pre-threat log length.
        expect(findEvents(brood.events, 'add-bit')[0].dealt).toBeGreaterThan(0);
        expect(stolen(brood.events)).toEqual(stolen(control.events));
        expect(brood.state.covetedDiceClaimed).toEqual(control.state.covetedDiceClaimed);
        expect(brood.state.lastThreatFullyBlocked).toBe(control.state.lastThreatFullyBlocked);
        // The gold die itself landed on the table in both runs.
        expect(brood.state.floatingDice?.length ?? 0).toBe(control.state.floatingDice?.length ?? 0);
    });
});

describe('strikeAdd', () => {
    const live = () => addState(open(makeEnemy({ keywords: [SUMMON_2] })));

    it('is a silent identity no-op outside phase-play', () => {
        const s = { ...live(), phase: 'phase-resolve' as const };
        const res = strikeAdd(s, 'qa-add-0', rng);
        expect(res.state).toBe(s);
        expect(res.events).toEqual([]);
    });

    it('is a silent identity no-op for an unknown id', () => {
        const s = live();
        const res = strikeAdd(s, 'no-such-add', rng);
        expect(res.state).toBe(s);
        expect(res.events).toEqual([]);
    });

    it('an unaffordable strike fizzles LOUDLY: one event, in the log, nothing spent', () => {
        const s = { ...live(), conviction: STRIKE_ADD_COST - 1 };
        const res = strikeAdd(s, 'qa-add-0', rng);

        expect(res.state.adds).toHaveLength(2);
        expect(res.state.conviction).toBe(STRIKE_ADD_COST - 1);
        const fizzles = findEvents(res.events, 'effect-fizzled');
        expect(fizzles).toHaveLength(1);
        expect(fizzles[0].cardId).toBe('qa-add-0');
        // The loss stays attributable — a dead-looking chip is the reception
        // failure this avoids.
        expect(res.state.log.length).toBeGreaterThan(s.log.length);
    });

    it('a paid strike removes exactly one body, debits exactly the price, ends nothing', () => {
        const s = live();
        const res = strikeAdd(s, 'qa-add-1', rng);

        expect(res.state.conviction).toBe(s.conviction - STRIKE_ADD_COST);
        expect(res.state.adds).toHaveLength(1);
        expect(res.state.adds![0].id).toBe('qa-add-0');
        const struck = findEvents(res.events, 'add-struck');
        expect(struck).toHaveLength(1);
        expect(struck[0]).toMatchObject({ addId: 'qa-add-1', cost: STRIKE_ADD_COST });
        expect(res.state.finalOutcome).toBeFalsy();
    });
});

describe('the telegraph does not lie', () => {
    // THE SHIP GATE: the projected add damage IS the applied add damage, across
    // every wall state — driven through a LIVE telegraph, because the leftover
    // wall the add term is handed is computed by the projection itself.
    //
    // The earlier form of this case emptied or denied the foe's telegraph in
    // every cell. That is the one configuration in which the projection's own
    // wall soak cannot diverge from the engine's (the leftover wall is the
    // whole wall on both sides), so it stayed green while the projection
    // dropped both the SWIFT divisor and the flat armor soak.
    function parity(s: CombatEncounterState): { projected: number; applied: number } {
        const projected = projectIncomingThreat(s).addNetDamage;
        const applied = findEvents(resolveThreatPhase(s, rng).events, 'add-bit')[0]?.dealt ?? 0;
        return { projected, applied };
    }

    // The wall/telegraph matrix both cases below run. The GUARD list contains
    // every literal the earlier four-state form asserted (0, 3, 8, 24, 32) and
    // the BARRIER list its 4, so this widens the dimensions covered without
    // dropping a cell it had.
    //
    // PRECONDITIONS the exact equality leans on, held BY CONSTRUCTION rather
    // than by exclusion: `makeEnemy` clones GraveLarva with `keywords` and
    // `stages` overridden, so the fixture carries no BRUTAL, no FLURRY and no
    // stage (`stageThreatBonus === 0`); its `getOutgoingThreatDamageMult` is 1;
    // each cell telegraphs at most ONE damaging effect; and the
    // Upgradeable-Dice flag is off, so no authored `stanceCheck` multiplies the
    // telegraph. Those are exactly the divergences `projectIncomingThreat`'s
    // docblock still leaves open. A foe carrying any of them is outside this
    // matrix's scope — widen the fixture and you must close them first.
    const MATRIX_GUARDS = [0, 3, 5, 8, 10, 20, 24, 32, 40];
    const MATRIX_BARRIERS = [0, 4, 6];
    const MATRIX_TELEGRAPHS = [0, 10, 30];

    function wallCells(): Array<{ label: string; state: CombatEncounterState }> {
        const armorDef = lookupEffect('buff_damage_reduction')!;
        const out: Array<{ label: string; state: CombatEncounterState }> = [];
        for (const swift of [false, true]) {
            const keywords: EnemyKeyword[] = swift ? [SUMMON_2, { kind: 'swift' }] : [SUMMON_2];
            for (const dmg of MATRIX_TELEGRAPHS) {
                const base = addState(withTelegraph(
                    open(makeEnemy({ keywords })), dmg > 0 ? [{ damage: dmg }] : [],
                ));
                for (const armored of [false, true]) {
                    const s = armored
                        ? {
                            ...base,
                            player: {
                                ...base.player,
                                effects: applyEffect(
                                    base.player.effects as ActiveEffect[], armorDef, base.round,
                                ).activeEffects,
                            },
                        }
                        : base;
                    for (const guard of MATRIX_GUARDS) {
                        for (const barrier of MATRIX_BARRIERS) {
                            out.push({
                                label: `swift=${swift} tele=${dmg} armor=${armored} guard=${guard} barrier=${barrier}`,
                                state: { ...s, guard, barrier },
                            });
                        }
                    }
                }
            }
        }
        return out;
    }

    it('addNetDamage equals the add-bit the engine applies — through a LIVE telegraph, SWIFT on and off, armored and bare', () => {
        for (const { label, state } of wallCells()) {
            const { projected, applied } = parity(state);
            expect(projected, label).toBe(applied);
        }
    });

    it('the HUD total is the VITAE the player actually loses — one damaging effect, unstaged foe', () => {
        // This is what makes the pair a guard rather than a readout test: it
        // pins the printed total to the health the engine actually takes off
        // the bar. It pins a RELATION, never a magnitude — retune
        // ADD_BITE_PER_LEVEL, THREAT_DAMAGE_SCALE, the armor value or the SWIFT
        // divisor and every cell still holds.
        for (const { label, state } of wallCells()) {
            const before = state.player.health;
            const after = resolveThreatPhase(state, rng).state.player.health;
            expect(projectIncomingThreat(state).totalNetDamage, label).toBe(before - after);
        }
    });

    it('a DENIED telegraph does not read as a safe turn while the brood bites', () => {
        const s = hinder(addState(withTelegraph(open(makeEnemy({ keywords: [SUMMON_2] })), [{ damage: 30 }])));
        const proj = projectIncomingThreat(s);

        expect(proj.willDeny).toBe(true);
        expect(proj.netDamage).toBe(0);
        expect(proj.addNetDamage).toBeGreaterThan(0);
        expect(proj.totalNetDamage).toBe(proj.netDamage + proj.addNetDamage);
        expect(parity(s).projected).toBe(parity(s).applied);
    });

    it('netDamage excludes the add term, so the RAVENOUS estimate never reads the brood', () => {
        const foe = makeEnemy({ keywords: [SUMMON_2, { kind: 'ravenous' }] });
        const base = withTelegraph(open(foe), [{ damage: 30 }]);
        const brood = addState(base);

        expect(projectIncomingThreat(brood).netDamage).toBe(projectIncomingThreat(base).netDamage);
        expect(projectEnemyHealPerRound(brood)).toBe(projectEnemyHealPerRound(base));
        expect(projectIncomingThreat(brood).addDamage).toBe(2 * EXPECTED_BITE);
    });
});


describe('back-compat — a state with no `adds` field behaves exactly as before', () => {
    // `adds` / `addWavesSpawned` are optional, "absent = none", the same
    // convention `tempZone` and `glyphs` carry. Every state literal written
    // before Phase 102 — and every saved encounter — arrives here without them.
    const bare = (): CombatEncounterState => {
        const s = open(makeEnemy());               // no SUMMON keyword at all
        expect(s.adds).toBeUndefined();
        expect(s.addWavesSpawned).toBeUndefined();
        return s;
    };

    it('strikeAdd on an addless state is a silent identity no-op', () => {
        const s = bare();
        const res = strikeAdd(s, 'qa-add-0', rng);
        expect(res.state).toBe(s);
        expect(res.events).toEqual([]);
    });

    it('resolveThreatPhase never bites, and matches an explicit empty brood exactly', () => {
        const s = withTelegraph(bare(), [{ damage: 30 }]);
        const absent = resolveThreatPhase(s, rng);
        const empty = resolveThreatPhase({ ...s, adds: [], addWavesSpawned: 0 }, rng);

        expect(findEvents(absent.events, 'add-bit')).toEqual([]);
        expect(absent.state.player.health).toBe(empty.state.player.health);
        expect(absent.state.enemy.health).toBe(empty.state.enemy.health);
        expect(absent.state.lastThreatFullyBlocked).toBe(empty.state.lastThreatFullyBlocked);
        expect(absent.state.guard).toBe(empty.state.guard);
        expect(absent.state.barrier).toBe(empty.state.barrier);
    });

    it('projectIncomingThreat reports a zero add term and leaves netDamage alone', () => {
        const s = withTelegraph(bare(), [{ damage: 30 }]);
        const proj = projectIncomingThreat(s);
        expect(proj.addDamage).toBe(0);
        expect(proj.addNetDamage).toBe(0);
        expect(proj.totalNetDamage).toBe(proj.netDamage);
        expect(projectIncomingThreat({ ...s, adds: [] })).toEqual(proj);
    });

    it('a foe without SUMMON spawns nothing at any boundary', () => {
        let s = bare();
        for (let i = 0; i < 4; i++) {
            const res = processBetweenPhases({ ...s, phase: 'phase-resolve' }, rng);
            expect(findEvents(res.events, 'add-spawned')).toEqual([]);
            s = res.state;
        }
        expect(s.adds ?? []).toEqual([]);
        expect(s.addWavesSpawned ?? 0).toBe(0);
    });
});
