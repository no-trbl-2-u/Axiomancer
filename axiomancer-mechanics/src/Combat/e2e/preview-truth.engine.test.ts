/**
 * Hermetic E2E — P0-truth: THE PRINTED NUMBER IS THE APPLIED NUMBER.
 *
 * Re-pinned to spec 32 v3: the strike is dead (`basePower`/`chipHp` deleted at
 * the schema level), the retired effect vocabulary (resolute / vulnerable /
 * septic / doubt / overextended / despair / isolated / hemorrhage / clarity /
 * sensory-null / unraveling) is gone from the library, and the surviving truth
 * laws are pinned against the v3 cards and effects:
 *   1. `bottomDamagePreview` is the DoT's real lifetime HP on a neutral read,
 *      and 0 (no number) otherwise.
 *   2. The deterministic read rule lands the printed numbers EXACTLY on a
 *      neutral read; a color match adds exactly +1 duration (Fate Engine R7).
 *   3. `projectCardImpact` never advertises a strike number — there is none.
 *   4. RAPPORT (the v3 charm-vocabulary debuff) really dampens the enemy's
 *      outgoing threat damage; CHARM's forced stance is visible to the read.
 */

import { describe, it, expect } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { cardLibrary } from '../../Cards/cards.library';
import { deepClone } from '../../Utils';
import { lookupEffect } from '../../Effects/effects.library';
import type { ActiveEffect } from '../../Effects/types';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard, resolveThreatPhase,
    draftStanceDie, getCard, projectCardImpact,
    THREAT_DAMAGE_SCALE,
} from '../combat.engine';
import {
    getDamageTakenMultiplier, getHealingReceivedMult, getOutgoingDamageMult,
} from '../effects';
import { getActiveDotTotal } from '../effect-modifiers';
import type { CombatDieColor, CombatEncounterState, CombatThreatPhase } from '../combat.encounter.types';

function makePlayer(skills: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = skills.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 400; p.maxHealth = 400;
    return p;
}

function makeEnemy(hp: number, stance: 'heart' | 'body' | 'mind'): Enemy {
    const e = deepClone(GraveLarva);
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
        // v3 library: slippery-slope, straw-mans-jab, sweet-poison,
        // fallen-grace, brief-candle at minimum.
        expect(dotCards.length).toBeGreaterThanOrEqual(5);
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

    it('non-DoT cards print NO number (real-units-or-no-number; the strike is dead)', () => {
        for (const skill of cardLibrary) {
            const card = getCard(skill.id)!;
            if (card.verbClass !== 'direct-dot') {
                expect(card.bottomDamagePreview, `${skill.id} has no honest single number`).toBe(0);
            }
            expect(card.bottomActionText).not.toContain('impact ~');
        }
    });

    it('a neutral-read, OFF-color DoT play lands EXACTLY the authored intensity and duration', () => {
        // slippery-slope is a BODY card; a heart die vs a heart-stance enemy is a
        // neutral read with NO color match → the printed numbers land untouched.
        let s = initializeCombatEncounter(makePlayer(['slippery-slope']), makeEnemy(500, 'heart'), ['slippery-slope'], 7);
        s = rollEncounterDice(s).state;
        s = setDice(s, ['heart']);
        s = draftStanceDie(s, s.dice[0].id).state;
        const entry = s.hand.find(h => h.cardId === 'slippery-slope')!;
        const after = playCombatCard(s, { uid: entry.uid }, true).state;
        const authored = cardLibrary.find(c => c.id === 'slippery-slope')!.combatEffects!
            .find(e => e.appliedTo === 'opponent')!;
        const landed = after.enemy.effects.find(e => e.effectId === authored.effectId)!;
        expect(landed.intensity).toBe(authored.intensity ?? 1);
        expect(landed.remainingDuration).toBe(authored.duration ?? lookupEffect(authored.effectId)!.duration);
    });

    it('a color-MATCHED status play lands +1 duration (Fate Engine R7 — printed on the card)', () => {
        // body die vs body-stance enemy: neutral read, color match → +1 turn.
        let s = initializeCombatEncounter(makePlayer(['slippery-slope']), makeEnemy(500, 'body'), ['slippery-slope'], 7);
        s = rollEncounterDice(s).state;
        s = setDice(s, ['body']);
        s = draftStanceDie(s, s.dice[0].id).state;
        const entry = s.hand.find(h => h.cardId === 'slippery-slope')!;
        const after = playCombatCard(s, { uid: entry.uid }, true).state;
        const authored = cardLibrary.find(c => c.id === 'slippery-slope')!.combatEffects!
            .find(e => e.appliedTo === 'opponent')!;
        const landed = after.enemy.effects.find(e => e.effectId === authored.effectId)!;
        expect(landed.intensity).toBe(authored.intensity ?? 1);
        expect(landed.remainingDuration).toBe(
            (authored.duration ?? lookupEffect(authored.effectId)!.duration) + 1);
    });

    it('projectCardImpact never advertises a strike number — the strike is dead (spec 32 v3 §1)', () => {
        const s = initializeCombatEncounter(makePlayer(['slippery-slope']), makeEnemy(500, 'body'), ['slippery-slope'], 7);
        for (const skill of cardLibrary) {
            const card = getCard(skill.id)!;
            const impact = projectCardImpact(s, card);
            expect(impact.amount, `${skill.id} must not advertise an immediate-strike number`).toBe(0);
            expect(impact.track).toBe(card.effectKind);
        }
    });
});

describe('P0-truth — threat-side payloads bite for real', () => {
    it('baseline: a 10-damage threat lands round(10 × THREAT_DAMAGE_SCALE)', () => {
        const s = threatState([{ damage: 10 }]);
        const after = resolveThreatPhase(s).state;
        expect(s.player.health - after.player.health).toBe(BASE_HIT);
    });

    it('RAPPORT on the enemy dampens ITS outgoing hit (-10%/stack, spec 32 v3 T8)', () => {
        const s = threatState([{ damage: 10 }], { enemyEffects: [activeEffect('debuff_rapport', 2, 2)] });
        const after = resolveThreatPhase(s).state;
        expect(s.player.health - after.player.health).toBe(Math.round(10 * THREAT_DAMAGE_SCALE * 0.8));
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

describe('P0-truth — dice/DoT-side laws', () => {
    it('POISON RAMPS: later rounds tick harder than the first (v3 honest printed curve)', () => {
        const effects = [activeEffect('debuff_poison', 2, 5, 1)];
        const early = getActiveDotTotal(effects, 1).total;   // turnsActive 0 → dpr 2
        const late = getActiveDotTotal(effects, 6).total;    // turnsActive 5 → dpr 2+floor(0.5×5)=4
        expect(early).toBe(4);
        expect(late).toBe(8);
    });

    it('multiplier helpers are exactly 1 for unmarked bearers (byte-compat)', () => {
        const p = makePlayer([]);
        expect(getDamageTakenMultiplier(p)).toBe(1);
        expect(getHealingReceivedMult(p)).toBe(1);
        expect(getOutgoingDamageMult(p)).toBe(1);
    });
});
