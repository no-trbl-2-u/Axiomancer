/**
 * Hermetic E2E — combat depth epic (combat-depth-epic branch).
 *
 * Two new on-vision levers:
 *   H2 — the stance READ bites a landed STATUS in REAL units (P0-truth): a won
 *        read lands the card's statuses at +1 intensity, a lost read shortens
 *        them by 1 turn (floor 1), a neutral/none read leaves the printed
 *        numbers byte-identical. Deterministic and previewable — the old
 *        ×1.34/×0.75 post-hoc intensity rewrite was a no-op below intensity 3.
 *   H3 — THE CLOCK: the enemy's telegraphed hit escalates each round past the
 *        grace window (capped), so a drawn-out fight turns lethal.
 */

import { describe, it, expect } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    resolveThreatPhase, draftStanceDie,
    READ_ADVANTAGE_INTENSITY_BONUS, READ_DISADVANTAGE_DURATION_PENALTY,
    THREAT_ESCALATION_PER_ROUND, THREAT_ESCALATION_GRACE, THREAT_ESCALATION_MAX,
    THREAT_ESCALATION_BOSS_MULT, THREAT_EFFECT_ESCALATION_STEP,
} from '../combat.engine';
import type { CombatDieColor, CombatEncounterState } from '../combat.encounter.types';

const DOT_BODY = 'spoiled-poultice'; // body stance, applies a poison DoT

function makePlayer(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 400; p.maxHealth = 400;
    return p;
}
function makeEnemy(hp: number, stance: 'heart' | 'body' | 'mind'): Enemy {
    const e = deepClone(GraveLarva);
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
/** Play a DoT card with a body die vs the given enemy stance (body-vs-mind =
 *  advantage, body-vs-body = neutral, body-vs-heart = disadvantage) and return
 *  the landed bleed. */
function playDotReadAgainst(stance: 'mind' | 'body' | 'heart'): { intensity: number; duration: number } {
    let s = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(300, stance), [DOT_BODY], 1);
    s = rollEncounterDice(s).state;
    s = setDice(s, ['body']);
    s = draftStanceDie(s, s.dice[0].id).state;
    const entry = s.hand.find(h => h.cardId === DOT_BODY);
    if (!entry) throw new Error('DOT card not in hand');
    const after = playCombatCard(s, { uid: entry.uid }, true).state;
    const bleed = after.enemy.effects.find(e => /bleed|poison/.test(e.effectId));
    return { intensity: bleed?.intensity ?? 0, duration: bleed?.remainingDuration ?? 0 };
}

describe('combat depth epic — H2: the read bites STATUS in real units (P0-truth)', () => {
    it('the read deltas are real, displayable units', () => {
        expect(READ_ADVANTAGE_INTENSITY_BONUS).toBe(1);
        expect(READ_DISADVANTAGE_DURATION_PENALTY).toBe(1);
    });

    it('winning the read lands the status at +1 intensity over a neutral read', () => {
        const adv = playDotReadAgainst('mind');     // body beats mind → advantage
        const neutral = playDotReadAgainst('body'); // body vs body → neutral
        expect(neutral.intensity).toBeGreaterThan(0);
        expect(adv.intensity).toBe(neutral.intensity + READ_ADVANTAGE_INTENSITY_BONUS);
        expect(adv.duration).toBe(neutral.duration); // advantage never shortens
    });

    it('losing the read shortens the status by 1 turn (floor 1) at printed intensity', () => {
        const dis = playDotReadAgainst('heart');    // heart beats body → disadvantage
        const neutral = playDotReadAgainst('body');
        expect(dis.intensity).toBe(neutral.intensity); // printed intensity still lands
        expect(dis.duration).toBe(Math.max(1, neutral.duration - READ_DISADVANTAGE_DURATION_PENALTY));
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

describe('combat depth epic — H5: the clock also intensifies enemy-inflicted STATUS', () => {
    /** Injects a status-applying effect onto phase 0's threat action (the
     *  default generated sequence is damage-only) so landed intensity can be
     *  observed directly. Same neutral-read fixture as H3/H4 (body vs body). */
    function statusIntensityAtRound(round: number): number {
        let s = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(300, 'body'), [DOT_BODY], 1);
        s = rollEncounterDice(s).state;
        const threatPhases = s.threatPhases.map((p, i) => (i === 0
            ? { ...p, threatAction: { ...p.threatAction, effects: [...p.threatAction.effects, { effectId: 'debuff_poison', intensity: 1 }] } }
            : p));
        s = { ...s, threatPhases, round };
        const after = resolveThreatPhase(s).state;
        const poison = after.player.effects.find(e => e.effectId === 'debuff_poison');
        return poison?.intensity ?? 0;
    }

    it('within the grace window the printed intensity lands unboosted', () => {
        expect(statusIntensityAtRound(THREAT_ESCALATION_GRACE)).toBe(1);
    });

    it('a drawn-out fight lands the status at higher intensity, capped with the damage clock', () => {
        const early = statusIntensityAtRound(1);
        const late = statusIntensityAtRound(20); // far past the escalation cap
        expect(late).toBeGreaterThan(early);
        const maxBonus = Math.floor((THREAT_ESCALATION_MAX - 1) / THREAT_EFFECT_ESCALATION_STEP);
        expect(late).toBe(early + maxBonus);
    });
});

/**
 * TRIM THE FAT Tier 0 item 3 (`plan/2026-09-25-trim-the-fat.spec.md`): the H6
 * threat-clock enchant is gone. Every 5 rounds it put Sorites Ascension on the
 * enemy or Grelling's Malediction on the player and announced it, but both
 * were no-ops: the enemy's +1 roll bonus is never read (only enemy roll
 * PENALTIES are), and the player's roll modifier is never read at all. A
 * visible event that changes nothing lied to the player, so the clock tier
 * was removed rather than left as theatre.
 */
describe('combat depth epic — H6 retired: no threat-clock enchant or curse', () => {
    function stateAtRound(round: number): CombatEncounterState {
        let s = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(300, 'body'), [DOT_BODY], 1);
        s = rollEncounterDice(s).state;
        return { ...s, round };
    }

    for (const [label, roll] of [['a low roll', 0.1], ['a high roll', 0.9]] as const) {
        it(`the old cadence round (resolvedRound 5) applies nothing on ${label}`, () => {
            const s = stateAtRound(4); // resolvedRound = 5, the retired cadence
            const res = resolveThreatPhase(s, () => roll);
            expect(res.state.enemy.effects.some(e => e.effectId === 'buff_all_stats_up')).toBe(false);
            expect(res.state.player.effects.some(e => e.effectId === 'debuff_curse')).toBe(false);
            expect(res.events.some(e => (e as { kind: string }).kind === 'threat-clock-enchant')).toBe(false);
        });
    }
});
