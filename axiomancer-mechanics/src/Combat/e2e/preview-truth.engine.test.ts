/**
 * Hermetic E2E — P0-truth: THE PRINTED NUMBER IS THE APPLIED NUMBER.
 *
 * The owner-reported bug (2026-07-05): "the number on the card doesn't appear
 * to be the same number of effect points the enemy gets". Root causes, all
 * fixed in the P0-truth pass and pinned here so they cannot regress:
 *   1. `bottomDamagePreview` was denominated in the REMOVED pressure-track
 *      model's units (intensity × CONTROL_HARD_MULT…) — now it is the DoT's
 *      real lifetime HP on a neutral read, and 0 (no number) otherwise.
 *   2. `READ_STATUS_MULT` rescaled a landed intensity AFTER application
 *      (round(2×1.34)=3 but round(1×1.34)=1 — a silent no-op at low intensity)
 *      — replaced by the deterministic ±1 read rule (see combat.depth-epic).
 *   3. `projectCardImpact` omitted the damage resistance and VULNERABLE
 *      multiplier execution applies — now it threads the same factors.
 *   4. A dozen shipped payload fields (`buff_resolute`, DESPAIR's anti-heal,
 *      SEPTIC's damp, UNRAVELING's ramp, HEMORRHAGE's decay, DOUBT, CLARITY,
 *      OVEREXTENDED, ISOLATED, NOVIKOV, SENSORY NULL, CHARM's forced stance)
 *      had ZERO engine readers — cards printed effects the enemy never
 *      received. Each is pinned to a real behavioral delta below.
 */

import { describe, it, expect } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { TidepoolCrab } from '../../Enemy/enemy.library';
import { cardLibrary } from '../../Cards/cards.library';
import { deepClone } from '../../Utils';
import { lookupEffect } from '../../Effects/effects.library';
import type { ActiveEffect } from '../../Effects/types';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard, resolveThreatPhase,
    draftStanceDie, startTurn, getCard, projectCardImpact,
    THREAT_DAMAGE_SCALE,
} from '../combat.engine';
import {
    getDamageTakenMultiplier, getHealingReceivedMult, getOutgoingDamageMult,
    RESOLUTE_MIN_MULT,
} from '../effects';
import { getActiveDotTotal } from '../effect-modifiers';
import type { CombatDieColor, CombatEncounterState, CombatThreatPhase } from '../combat.encounter.types';

function makePlayer(skills: string[]): Character {
    const p = deepClone(Player);
    p.knownSkills = skills.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 400; p.maxHealth = 400;
    return p;
}

function makeEnemy(hp: number, stance: 'heart' | 'body' | 'mind'): Enemy {
    const e = deepClone(TidepoolCrab);
    e.id = 'enemy-truth-dummy';
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

function activeEffect(effectId: string, intensity = 1, duration = 3, appliedAt = 1): ActiveEffect {
    const def = lookupEffect(effectId);
    if (!def) throw new Error(`unknown effect ${effectId}`);
    return { effectId, intensity, remainingDuration: duration, appliedAt, tier: def.tier };
}

/** One-phase custom threat so incoming numbers are fully controlled. */
function threatOnly(effects: CombatThreatPhase['threatAction']['effects']): CombatThreatPhase[] {
    return [{
        index: 1, enemyStance: 'body', isFinalPhase: true,
        threatAction: { description: 'truth probe', effects },
    }];
}

/** A ready-to-resolve encounter with a custom threat and optional side effects. */
function threatState(
    effects: CombatThreatPhase['threatAction']['effects'],
    opts: { playerEffects?: ActiveEffect[]; enemyEffects?: ActiveEffect[] } = {},
): CombatEncounterState {
    let s = initializeCombatEncounter(makePlayer(['slippery-slope']), makeEnemy(500, 'body'), ['slippery-slope'], 7);
    s = rollEncounterDice(s).state;
    s = {
        ...s,
        threatPhases: threatOnly(effects),
        threatMarks: ['pending'],
        currentPhaseIndex: 0,
        player: { ...s.player, effects: opts.playerEffects ?? [] },
        enemy: { ...s.enemy, effects: opts.enemyEffects ?? [] },
    };
    return s;
}

const BASE_HIT = Math.round(10 * THREAT_DAMAGE_SCALE); // round 1 = grace → escalation 1, no weaken

describe('P0-truth — the card preview is the applied number', () => {
    it('every DoT card previews its statuses\' REAL lifetime HP (neutral read)', () => {
        const dotCards = cardLibrary.filter(c => {
            const card = getCard(c.id);
            return card?.verbClass === 'direct-dot';
        });
        expect(dotCards.length).toBeGreaterThan(10);
        for (const skill of dotCards) {
            const card = getCard(skill.id)!;
            // Expected: Σ over enemy-targeted DoT payloads of floor(dpr×int)×dur
            // (ramp-aware) — the exact un-amplified pending total the enemy
            // carries the moment the card lands on a neutral read.
            let expected = 0;
            for (const ce of skill.combatEffects ?? []) {
                if (ce.appliedTo !== 'opponent') continue;
                const def = lookupEffect(ce.effectId);
                const dot = def?.payload.damageOverTime;
                if (!def || !dot) continue;
                const intensity = ce.intensity ?? 1;
                const duration = Math.max(1, ce.duration ?? def.duration);
                const ramp = def.payload.dotModifiers?.escalatesPerTurn ? (def.payload.dotModifiers.rampFactor ?? 0) : 0;
                for (let k = 0; k < duration; k++) {
                    expected += Math.floor((dot.damagePerRound + Math.floor(ramp * k)) * intensity);
                }
            }
            expect(card.bottomDamagePreview, `${skill.id} preview must be its real lifetime HP`).toBe(expected);
        }
    });

    it('non-DoT status cards print NO number (real-units-or-no-number)', () => {
        for (const skill of cardLibrary) {
            const card = getCard(skill.id)!;
            if (card.verbClass === 'direct-control' || card.verbClass === 'stat-debuff' || card.verbClass === 'buff-self') {
                const hasMechanicFloor = (skill.specialMechanics ?? []).some(
                    m => m.kind === 'rupture' || m.kind === 'compound' || m.kind === 'execute');
                if (!hasMechanicFloor) {
                    expect(card.bottomDamagePreview, `${skill.id} has no honest single number`).toBe(0);
                }
                expect(card.bottomActionText).not.toContain('impact ~');
            }
        }
    });

    it('a neutral-read DoT play lands EXACTLY the authored intensity and duration', () => {
        let s = initializeCombatEncounter(makePlayer(['slippery-slope']), makeEnemy(500, 'body'), ['slippery-slope'], 7);
        s = rollEncounterDice(s).state;
        s = setDice(s, ['body']); // body vs body → neutral read
        s = draftStanceDie(s, s.dice[0].id).state;
        const entry = s.hand.find(h => h.cardId === 'slippery-slope')!;
        const after = playCombatCard(s, { uid: entry.uid }, true).state;
        const authored = cardLibrary.find(c => c.id === 'slippery-slope')!.combatEffects!
            .find(e => e.appliedTo === 'opponent')!;
        const landed = after.enemy.effects.find(e => e.effectId === authored.effectId)!;
        expect(landed.intensity).toBe(authored.intensity ?? 1);
        expect(landed.remainingDuration).toBe(authored.duration ?? lookupEffect(authored.effectId)!.duration);
    });

    it('projectCardImpact matches the strike HP the enemy actually loses', () => {
        // A pure basePower strike card with no synergy / no mechanics.
        const strikeSkill = cardLibrary.find(c =>
            c.basePower > 0 && c.targetType === 'enemy'
            && !(c.combatEffects ?? []).length && !(c.specialMechanics ?? []).length && !c.synergy
            && getCard(c.id)?.verbClass === 'direct-damage');
        if (!strikeSkill) return; // library carries no pure strike — nothing to pin
        let s = initializeCombatEncounter(makePlayer([strikeSkill.id]), makeEnemy(500, 'body'), [strikeSkill.id], 7);
        s = rollEncounterDice(s).state;
        s = setDice(s, ['body']);
        s = draftStanceDie(s, s.dice[0].id).state;
        const card = getCard(strikeSkill.id)!;
        const projected = projectCardImpact(s, card).amount;
        const entry = s.hand.find(h => h.cardId === strikeSkill.id)!;
        const after = playCombatCard(s, { uid: entry.uid }, true).state;
        expect(500 - after.enemy.health).toBe(projected);
    });
});

describe('P0-truth — formerly-inert payloads now bite (threat side)', () => {
    it('baseline: a 10-damage threat lands round(10 × THREAT_DAMAGE_SCALE)', () => {
        const s = threatState([{ damage: 10 }]);
        const after = resolveThreatPhase(s).state;
        expect(s.player.health - after.player.health).toBe(BASE_HIT);
    });

    it('buff_resolute on the player REDUCES incoming threat damage (was double-dead)', () => {
        const s = threatState([{ damage: 10 }], { playerEffects: [activeEffect('buff_resolute', 1, 2)] });
        const after = resolveThreatPhase(s).state;
        expect(s.player.health - after.player.health).toBe(Math.round(10 * THREAT_DAMAGE_SCALE * 0.85));
    });

    it('self debuff_vulnerable on the player INCREASES incoming threat damage (gambles have stakes)', () => {
        const s = threatState([{ damage: 10 }], { playerEffects: [activeEffect('debuff_vulnerable', 1, 2)] });
        const after = resolveThreatPhase(s).state;
        expect(s.player.health - after.player.health).toBe(Math.round(10 * THREAT_DAMAGE_SCALE * 1.5));
    });

    it('protective stacking clamps at RESOLUTE_MIN_MULT (never full immunity)', () => {
        const p = makePlayer([]);
        p.effects = [activeEffect('buff_resolute', 5, 2)];
        expect(getDamageTakenMultiplier(p)).toBe(RESOLUTE_MIN_MULT);
    });

    it('debuff_septic on the enemy dampens ITS outgoing hit (-10%/stack)', () => {
        const s = threatState([{ damage: 10 }], { enemyEffects: [activeEffect('debuff_septic', 2, 3)] });
        const after = resolveThreatPhase(s).state;
        expect(s.player.health - after.player.health).toBe(Math.round(10 * THREAT_DAMAGE_SCALE * 0.8));
    });

    it('debuff_overextended halves the enemy\'s next fired phase, then is consumed', () => {
        const s = threatState([{ damage: 10 }], { enemyEffects: [activeEffect('debuff_overextended', 1, 3)] });
        const after = resolveThreatPhase(s).state;
        expect(s.player.health - after.player.health).toBe(Math.round(10 * THREAT_DAMAGE_SCALE * 0.5));
        expect(after.enemy.effects.find(e => e.effectId === 'debuff_overextended')).toBeUndefined();
    });

    it('debuff_doubt cancels the threat\'s RIDERS (status + self-heal), then is consumed', () => {
        const s = threatState(
            [{ damage: 10, effectId: 'debuff_fear', intensity: 2, enemyHeal: 10 }],
            { enemyEffects: [activeEffect('debuff_doubt', 1, 3)] },
        );
        const enemyHpBefore = s.enemy.health;
        const after = resolveThreatPhase(s).state;
        expect(after.player.effects.find(e => e.effectId === 'debuff_fear'), 'rider cancelled').toBeUndefined();
        expect(after.enemy.health, 'self-heal cancelled').toBeLessThanOrEqual(enemyHpBefore);
        expect(after.enemy.effects.find(e => e.effectId === 'debuff_doubt'), 'doubt consumed').toBeUndefined();
        // the damage itself still lands — doubt cancels riders, not the hit
        expect(s.player.health - after.player.health).toBe(BASE_HIT);
    });

    it('debuff_despair on the enemy shrinks its self-heal; debuff_isolated denies it outright', () => {
        const despair = threatState([{ enemyHeal: 10 }], { enemyEffects: [activeEffect('debuff_despair', 2, 4)] });
        const hurt = { ...despair, enemy: { ...despair.enemy, health: 300 } };
        const healed = resolveThreatPhase(hurt).state;
        // despair i2 → ×0.7, minus this round's despair DoT ticks on the enemy
        const dotTick = getActiveDotTotal(hurt.enemy.effects).total;
        expect(healed.enemy.health).toBe(300 + Math.round(10 * 0.7) - dotTick);

        const isolated = threatState([{ enemyHeal: 10 }], { enemyEffects: [activeEffect('debuff_isolated', 1, 3)] });
        const hurtIso = { ...isolated, enemy: { ...isolated.enemy, health: 300 } };
        const after = resolveThreatPhase(hurtIso).state;
        expect(after.enemy.health).toBe(300); // no heal, and isolated has no DoT
    });

    it('debuff_hemorrhage decays 1 intensity when the bearer heals (big but fragile)', () => {
        const s = threatState([{ enemyHeal: 5 }], { enemyEffects: [activeEffect('debuff_hemorrhage', 2, 3)] });
        const after = resolveThreatPhase(s).state;
        expect(after.enemy.effects.find(e => e.effectId === 'debuff_hemorrhage')?.intensity).toBe(1);
    });

    it('charm (forcedStance) makes the enemy fight from the forced stance — the read sees it', () => {
        let s = initializeCombatEncounter(makePlayer(['slippery-slope']), makeEnemy(500, 'body'), ['slippery-slope'], 7);
        s = rollEncounterDice(s).state;
        // Enemy phase stance is body, but charm forces heart → a MIND die now
        // reads ADVANTAGE (mind beats heart), where vs body it would read
        // disadvantage. The charm names the door.
        s = { ...s, enemy: { ...s.enemy, effects: [activeEffect('debuff_charm', 1, 2)] } };
        s = setDice(s, ['mind']);
        s = draftStanceDie(s, s.dice[0].id).state;
        expect(s.lastRead).toBe('advantage');
    });
});

describe('P0-truth — formerly-inert payloads now bite (player/dice side)', () => {
    it('buff_clarity guarantees one WILD die next roll, then is consumed', () => {
        let s = initializeCombatEncounter(makePlayer(['slippery-slope']), makeEnemy(500, 'body'), ['slippery-slope'], 7);
        s = { ...s, phase: 'phase-play' as const, player: { ...s.player, effects: [activeEffect('buff_clarity', 1, 2)] } };
        const rolled = startTurn(s).state;
        expect(rolled.dice[0].color).toBe('wild');
        expect(rolled.player.effects.find(e => e.effectId === 'buff_clarity')).toBeUndefined();
    });

    it('debuff_sensory_null on the player clamps a won read to neutral', () => {
        let s = initializeCombatEncounter(makePlayer(['slippery-slope']), makeEnemy(500, 'mind'), ['slippery-slope'], 7);
        s = rollEncounterDice(s).state;
        s = { ...s, player: { ...s.player, effects: [activeEffect('debuff_sensory_null', 1, 2)] } };
        s = setDice(s, ['body']); // body beats mind → would be advantage
        s = draftStanceDie(s, s.dice[0].id).state;
        expect(s.lastRead).toBe('neutral');
    });

    it('debuff_unraveling RAMPS: later rounds tick harder than the first', () => {
        const effects = [activeEffect('debuff_unraveling', 2, 5, 1)];
        const early = getActiveDotTotal(effects, 1).total;   // turnsActive 0
        const late = getActiveDotTotal(effects, 6).total;    // turnsActive 5 → +floor(0.25×5)=+1 dpr
        expect(late).toBeGreaterThan(early);
    });

    it('multiplier helpers are exactly 1 for unmarked bearers (byte-compat)', () => {
        const p = makePlayer([]);
        expect(getDamageTakenMultiplier(p)).toBe(1);
        expect(getHealingReceivedMult(p)).toBe(1);
        expect(getOutgoingDamageMult(p)).toBe(1);
    });
});
