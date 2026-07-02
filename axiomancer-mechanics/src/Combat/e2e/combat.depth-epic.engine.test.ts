/**
 * Hermetic E2E — combat depth epic (combat-depth-epic branch).
 *
 * Two new on-vision levers:
 *   H2 — the stance READ now scales a landed STATUS's magnitude (not just the
 *        weak strike), so "read the stance, draft the right color" matters for the
 *        status play that IS the game. Advantage makes a DoT bite harder; a
 *        neutral/none read leaves it byte-identical.
 *   H3 — THE CLOCK: the enemy's telegraphed hit escalates each round past the
 *        grace window (capped), so a drawn-out fight turns lethal.
 */

import { describe, it, expect } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { TidepoolCrab } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    resolveThreatPhase, draftStanceDie,
    READ_STATUS_MULT, THREAT_ESCALATION_PER_ROUND, THREAT_ESCALATION_GRACE, THREAT_ESCALATION_MAX,
    THREAT_ESCALATION_BOSS_MULT,
} from '../combat.engine';
import type { CombatDieColor, CombatEncounterState } from '../combat.encounter.types';

const DOT_BODY = 'slippery-slope'; // body stance, applies a bleed DoT

function makePlayer(skills: string[]): Character {
    const p = deepClone(Player);
    p.knownSkills = skills.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 400; p.maxHealth = 400;
    return p;
}
function makeEnemy(hp: number, stance: 'heart' | 'body' | 'mind'): Enemy {
    const e = deepClone(TidepoolCrab);
    e.id = 'enemy-depth-dummy';
    e.health = hp; e.maxHealth = hp; e.effects = [];
    e.baseStats = { heart: stance === 'heart' ? 6 : 2, body: stance === 'body' ? 6 : 2, mind: stance === 'mind' ? 6 : 2 };
    return e;
}
function setDice(state: CombatEncounterState, colors: CombatDieColor[]): CombatEncounterState {
    const turn = state.turn || 1;
    const dice = colors.map((c, i) => ({
        id: `t${turn}-d${i}`, color: c,
        state: c === 'x' ? ('locked' as const) : ('available' as const), temporary: false,
    }));
    return { ...state, dice, draftedDieId: null, turn };
}
const bleedIntensity = (s: CombatEncounterState) =>
    s.enemy.effects.find(e => /bleed/.test(e.effectId))?.intensity ?? 0;

/** Play a DoT card with a body die vs the given enemy stance (body-vs-mind = advantage,
 *  body-vs-body = neutral) and return the landed bleed intensity. */
function playDotReadAgainst(stance: 'mind' | 'body'): number {
    let s = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(300, stance), [DOT_BODY], 1);
    s = rollEncounterDice(s).state;
    s = setDice(s, ['body']);
    s = draftStanceDie(s, s.dice[0].id).state;
    const entry = s.hand.find(h => h.cardId === DOT_BODY);
    if (!entry) throw new Error('DOT card not in hand');
    return bleedIntensity(playCombatCard(s, { uid: entry.uid }, true).state);
}

describe('combat depth epic — H2: the read scales STATUS', () => {
    it('READ_STATUS_MULT is gentle and neutral/none are identity', () => {
        expect(READ_STATUS_MULT.advantage).toBeGreaterThan(1);
        expect(READ_STATUS_MULT.disadvantage).toBeLessThan(1);
        expect(READ_STATUS_MULT.neutral).toBe(1);
        expect(READ_STATUS_MULT.none).toBe(1);
        // gentler than the strike's 1.5/0.5 read
        expect(READ_STATUS_MULT.advantage).toBeLessThan(1.5);
    });

    it('winning the read makes a landed DoT bite harder than a neutral read', () => {
        const adv = playDotReadAgainst('mind');   // body beats mind → advantage
        const neutral = playDotReadAgainst('body'); // body vs body → neutral
        expect(neutral).toBeGreaterThan(0);
        expect(adv).toBeGreaterThan(neutral);      // the read now matters for STATUS
    });
});

describe('combat depth epic — H3: the escalation clock', () => {
    function threatDamageAtRound(round: number): number {
        let s = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(300, 'body'), [DOT_BODY], 1);
        s = rollEncounterDice(s).state;
        s = { ...s, round };
        const before = s.player.health;
        const after = resolveThreatPhase(s).state;
        return before - after.player.health;
    }

    it('within the grace window the hit is un-escalated (a fast kill is unpunished)', () => {
        // round <= grace → escalation 1.0
        const base = threatDamageAtRound(THREAT_ESCALATION_GRACE);
        expect(base).toBeGreaterThan(0); // the dummy's phase-0 action deals damage
    });

    it('a drawn-out fight hits harder, monotonically, up to the cap', () => {
        const r1 = threatDamageAtRound(1);
        const r4 = threatDamageAtRound(4);
        const r20 = threatDamageAtRound(20); // far past the cap
        expect(r4).toBeGreaterThan(r1);
        expect(r20).toBeGreaterThanOrEqual(r4);
        // capped: round-20 escalation must not exceed THREAT_ESCALATION_MAX × the base
        expect(r20).toBeLessThanOrEqual(Math.ceil(r1 * THREAT_ESCALATION_MAX) + 1);
        expect(THREAT_ESCALATION_PER_ROUND).toBeGreaterThan(0);
    });
});

function makeBossEnemy(hp: number, stance: 'heart' | 'body' | 'mind'): Enemy {
    const e = makeEnemy(hp, stance);
    e.difficulty = 'boss';
    return e;
}

describe('combat depth epic — H4: bosses escalate faster', () => {
    function threatDamageAtRoundFor(enemy: Enemy, round: number): number {
        const p = makePlayer([DOT_BODY]);
        let s = initializeCombatEncounter(p, enemy, [DOT_BODY], 1);
        s = rollEncounterDice(s).state;
        s = { ...s, round };
        const before = s.player.health;
        const after = resolveThreatPhase(s).state;
        return before - after.player.health;
    }

    it('THREAT_ESCALATION_BOSS_MULT is greater than 1', () => {
        expect(THREAT_ESCALATION_BOSS_MULT).toBeGreaterThan(1);
    });

    it('a boss escalates faster than a normal enemy at the same round', () => {
        const round = 4; // past grace — escalation active
        const normal = makeEnemy(300, 'body');
        const boss = makeBossEnemy(300, 'body');
        const normalDmg = threatDamageAtRoundFor(normal, round);
        const bossDmg = threatDamageAtRoundFor(boss, round);
        expect(bossDmg).toBeGreaterThan(normalDmg);
    });

    it('within the grace window the boss escalation clock is inactive (no clock bonus)', () => {
        const boss = makeBossEnemy(300, 'body');
        const atGrace = threatDamageAtRoundFor(boss, THREAT_ESCALATION_GRACE);
        const atEarlier = threatDamageAtRoundFor(boss, 0);
        expect(atGrace).toBe(atEarlier);
    });

    it('boss escalation is still capped by THREAT_ESCALATION_MAX', () => {
        const boss = makeBossEnemy(300, 'body');
        const r4 = threatDamageAtRoundFor(boss, 4);
        const r1 = threatDamageAtRoundFor(boss, 1);
        const r20 = threatDamageAtRoundFor(boss, 20); // far past cap
        expect(r4).toBeGreaterThan(r1);
        expect(r20).toBeLessThanOrEqual(Math.ceil(r1 * THREAT_ESCALATION_MAX) + 1);
    });
});
