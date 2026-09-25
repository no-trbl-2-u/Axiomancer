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
 *   2. A paid play lands the printed numbers EXACTLY (spec 33 retired the
 *      hidden-stance read); a color match adds exactly +1 duration (Fate
 *      Engine R7).
 *   3. `projectCardImpact` never advertises a strike number — there is none.
 *   4. QUARTER (the v3 charm-vocabulary debuff) really dampens the enemy's
 *      outgoing threat damage.
 */

import { describe, it, expect } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { cardLibrary } from '../../Cards/cards.library';
import type { Card } from '../../Cards/types';
import { deepClone } from '../../Utils';
import { lookupEffect } from '../../Effects/effects.library';
import type { ActiveEffect } from '../../Effects/types';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard, resolveThreatPhase,
    getCard, projectCardImpact,
    THREAT_DAMAGE_SCALE,
} from '../combat.engine';
import {
    getDamageTakenMultiplier, getHealingReceivedMult, getOutgoingDamageMult,
} from '../effects';
import { getActiveDotTotal } from '../effect-modifiers';
import { MAX_EFFECT_INTENSITY } from '../../Game/game-mechanics.constants';
import type { CombatDieColor, CombatEncounterState, CombatThreatPhase } from '../combat.encounter.types';

function makePlayer(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
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

/** Spec 33 tray: every non-X die shows a MANA face (can power a paid line). */
function setDice(state: CombatEncounterState, colors: CombatDieColor[]): CombatEncounterState {
    const turn = state.turn || 1;
    const dice = colors.map((c, i) => ({
        id: `t${turn}-d${i}`, color: c,
        state: c === 'x' ? ('locked' as const) : ('available' as const), temporary: false,
        face: c === 'x' ? ('miss' as const) : ('mana' as const),
    }));
    return { ...state, dice, turn };
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
    let s = initializeCombatEncounter(makePlayer(['spoiled-poultice']), makeEnemy(500, 'body'), ['spoiled-poultice'], 7);
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

/**
 * THE BIG NUMBERS REWRITE (2026-09-02) — the direct-damage half of the
 * preview. `bottomDamagePreview` counts what the PAID line takes off the foe:
 * the `deal` mechanic (multi-hit aware), a rider that carries `damage`, and
 * the condition riders at face value. Re-derived here from the card data so
 * the test computes the same truth independently of the implementation.
 */
function directDamageOf(entry: Card): number {
    let total = 0;
    for (const m of entry.specialMechanics ?? []) {
        if (m.kind === 'deal') total += m.amount * Math.max(1, m.hits ?? 1);
        else if (m.kind === 'rider') total += m.rider.damage ?? 0;
        else if (m.kind === 'immolate') total += m.rider.damage ?? 0;
    }
    for (const r of [entry.threshold?.rider, entry.dieBonus?.rider, entry.fate?.rider,
        entry.fallen?.rider, entry.synergy?.rider]) {
        total += r?.damage ?? 0;
    }
    return total;
}

describe('P0-truth — the card preview is the applied number', () => {
    it('every DoT card previews its statuses\' REAL lifetime HP (neutral read)', () => {
        const dotCards = cardLibrary.filter(c => {
            const card = getCard(c.id);
            return card?.verbClass === 'direct-dot';
        });
        // Profane-Canon library (2026-08-08): spoiled-poultice,
        // unction-of-boils, the-sextons-bell, gangrene-gospel, the-vig at
        // minimum — the rot/debt cores keep the DoT-seed class populated.
        expect(dotCards.length).toBeGreaterThanOrEqual(5);
        for (const entry of dotCards) {
            const card = getCard(entry.id)!;
            // Expected: Σ over enemy-targeted DoT payloads of floor(dpr×int)×dur
            // (ramp-aware) — the exact un-amplified pending total the enemy
            // carries the moment the card lands on a neutral read.
            let expected = 0;
            for (const ce of entry.combatEffects ?? []) {
                if (ce.appliedTo !== 'opponent') continue;
                const def = lookupEffect(ce.effectId);
                const dot = def?.payload.damageOverTime;
                if (!def || !dot) continue;
                // `applyEffect` (src/Effects/index.ts) clamps every landed
                // intensity to MAX_EFFECT_INTENSITY, so the APPLIED intensity —
                // the thing the preview must equal — is the clamped one. (A
                // card that AUTHORS above the cap prints a number the engine
                // will not honour; that is a card-data bug, caught by the
                // face-honesty guards, not a preview bug.)
                const intensity = Math.min(ce.intensity ?? 1, MAX_EFFECT_INTENSITY);
                const duration = Math.max(1, ce.duration ?? def.duration);
                const ramp = def.payload.dotModifiers?.escalatesPerTurn ? (def.payload.dotModifiers.rampFactor ?? 0) : 0;
                for (let k = 0; k < duration; k++) {
                    expected += Math.floor((dot.damagePerRound + Math.floor(ramp * k)) * intensity);
                }
            }
            expect(
                card.bottomDamagePreview,
                `${card.id} preview must be its real direct damage + lifetime VITAE`,
            ).toBe(expected + directDamageOf(entry));
        }
    });

    it('every card previews exactly its REAL direct damage + enemy-DoT lifetime VITAE (real-units-or-no-number)', () => {
        // Pin change 2026-07-19: pre-promotion, "verbClass !== direct-dot ⇒
        // preview 0" held because no defend-class card carried an enemy DoT.
        // The promoted hybrids (tempered-edge, the-anvil-speaks: GUARD mech ⇒
        // classified 'defend', plus a real ember/sting DoT payload) print
        // their DoT's true lifetime number. The invariant is restated in its
        // honest general form: the preview EQUALS the card's real enemy-DoT
        // lifetime on a neutral read — never a fake "impact" number, and 0
        // whenever no enemy DoT exists.
        for (const entry of cardLibrary) {
            const card = getCard(entry.id)!;
            let realLifetime = 0;
            for (const ce of entry.combatEffects ?? []) {
                if (ce.appliedTo !== 'opponent') continue;
                const def = lookupEffect(ce.effectId);
                const dot = def?.payload.damageOverTime;
                if (!def || !dot) continue;
                // Clamped for the same reason as above: the engine never lands
                // more than MAX_EFFECT_INTENSITY.
                const intensity = Math.min(ce.intensity ?? 1, MAX_EFFECT_INTENSITY);
                const duration = Math.max(1, ce.duration ?? def.duration);
                const ramp = def.payload.dotModifiers?.escalatesPerTurn ? (def.payload.dotModifiers.rampFactor ?? 0) : 0;
                for (let k = 0; k < duration; k++) {
                    realLifetime += Math.floor((dot.damagePerRound + Math.floor(ramp * k)) * intensity);
                }
            }
            expect(
                card.bottomDamagePreview,
                `${card.id} preview must be its real direct damage + DoT lifetime (or 0)`,
            ).toBe(realLifetime + directDamageOf(entry));
            expect(card.bottomActionText).not.toContain('impact ~');
        }
    });

    it('an OFF-color die cannot power a card — the play fizzles honestly (the color law)', () => {
        // Dice-law rework (2026-07-09): spoiled-poultice (the Profane-Canon
        // poison starter) is a BODY card; a heart die may not power it at
        // all. The old "off-color lands untouched numbers" case no longer
        // exists — the fizzle IS the truth now.
        let s = initializeCombatEncounter(makePlayer(['spoiled-poultice']), makeEnemy(500, 'heart'), ['spoiled-poultice'], 7);
        s = rollEncounterDice(s).state;
        s = setDice(s, ['heart']);
        const entry = s.hand.find(h => h.cardId === 'spoiled-poultice')!;
        const res = playCombatCard(s, { uid: entry.uid }, true, s.dice[0].id);
        expect(res.events.some(e => e.kind === 'effect-fizzled' && /colors must match/.test(e.message))).toBe(true);
        expect(res.state.enemy.effects.length).toBe(0);
    });

    it('a color-MATCHED status play lands +1 duration (Fate Engine R7 — printed on the card)', () => {
        // body die powers the body card: printed numbers, color match → +1 turn.
        let s = initializeCombatEncounter(makePlayer(['spoiled-poultice']), makeEnemy(500, 'body'), ['spoiled-poultice'], 7);
        s = rollEncounterDice(s).state;
        s = setDice(s, ['body']);
        const entry = s.hand.find(h => h.cardId === 'spoiled-poultice')!;
        const after = playCombatCard(s, { uid: entry.uid }, true, s.dice[0].id).state;
        const authored = cardLibrary.find(c => c.id === 'spoiled-poultice')!.combatEffects!
            .find(e => e.appliedTo === 'opponent')!;
        const landed = after.enemy.effects.find(e => e.effectId === authored.effectId)!;
        expect(landed.intensity).toBe(authored.intensity ?? 1);
        expect(landed.remainingDuration).toBe(
            (authored.duration ?? lookupEffect(authored.effectId)!.duration) + 1);
    });

    it('projectCardImpact never advertises a strike number — the strike is dead (spec 32 v3 §1)', () => {
        const s = initializeCombatEncounter(makePlayer(['spoiled-poultice']), makeEnemy(500, 'body'), ['spoiled-poultice'], 7);
        for (const entry of cardLibrary) {
            const card = getCard(entry.id)!;
            const impact = projectCardImpact(s, card);
            expect(impact.amount, `${card.id} must not advertise an immediate-strike number`).toBe(0);
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

    it('QUARTER on the enemy dampens ITS outgoing hit (-10%/stack, spec 32 v3 T8)', () => {
        const s = threatState([{ damage: 10 }], { enemyEffects: [activeEffect('debuff_quarter', 2, 2)] });
        const after = resolveThreatPhase(s).state;
        expect(s.player.health - after.player.health).toBe(Math.round(10 * THREAT_DAMAGE_SCALE * 0.8));
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
