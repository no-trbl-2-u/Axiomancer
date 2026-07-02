/**
 * Spec 26b §4 — Signature Skills.
 *
 * A small, ALWAYS-available kit (independent of the shuffled deck) funded by
 * Conviction (◆). Conviction accrues from the per-turn dice draft (the unpicked
 * die) and from winning the hidden-stance read. Signature Skills are the
 * player's reliable plan through a bad draw — the agency lever the deck cannot
 * guarantee.
 *
 * `applySignatureSkill` is a pure transition (no RNG side-channel beyond the
 * passed `rng`, no conviction accounting, no outcome checks). The engine wraps it
 * in `playSignatureSkill` to gate on Conviction and check for an immediate
 * outcome. This split keeps the module free of any `combat.engine` import (no
 * cycle): it depends only on the effects engine, health, deck, and impact
 * helpers — none of which import the engine.
 */

import { lookupEffect, applyEffect } from '../Effects';
import type { Character } from '../Character/types';
import type { Enemy } from '../Enemy/types';
import { applyDamage, heal } from './health';
import { drawCombatCards } from './combat.deck';
import { rerollSpentDice } from './combat.dice';
import { recordAttribution } from './combat.attribution';
import { effectImpact } from './combat.cards';
import type {
    CombatEncounterState, CombatEvent, CombatTransition, SignatureSkill,
    SignatureSkillId, LandedEffect, PlayerArchetype,
} from './combat.encounter.types';

/** The baseline signature kit available to every player (Spec 26b §4). */
export const SIGNATURE_SKILLS: Record<SignatureSkillId, SignatureSkill> = {
    'sig-read-opponent': {
        id: 'sig-read-opponent', name: 'Read the Opponent', kind: 'scout', cost: 1, magnitude: 0,
        description: 'Reveal the current and next phase stance — buy certainty on your read. Cheap; cast it early.',
    },
    'sig-press-the-point': {
        id: 'sig-press-the-point', name: 'Press Fate', kind: 'reroll', cost: 4, magnitude: 0,
        description: 'Bend fate — re-roll only your spent and blocked (X) dice; keep the ones still in play.',
    },
    'sig-second-wind': {
        id: 'sig-second-wind', name: 'Second Wind', kind: 'sustain', cost: 4, magnitude: 2,
        description: 'Draw 2 cards and recover a little health — recover from a dead hand.',
    },
    'sig-overwhelming-argument': {
        id: 'sig-overwhelming-argument', name: 'Overwhelming Argument', kind: 'control', cost: 8,
        magnitude: 5, effectKind: 'control', effectId: 'debuff_petrify',
        description: 'Petrify the enemy — it turns to stone and loses its turns while the control holds.',
    },
    'sig-conviction-strike': {
        id: 'sig-conviction-strike', name: 'Conviction Strike', kind: 'dot', cost: 7,
        magnitude: 3, effectKind: 'dot', effectId: 'debuff_poison',
        description: 'A guaranteed venom at boosted intensity — DoT that cannot fizzle.',
    },
    // ── Per-archetype exclusives ─────────────────────────────────────────────
    'sig-disarming-plea': {
        id: 'sig-disarming-plea', name: 'Disarming Plea', kind: 'mercy', cost: 6,
        magnitude: 6, effectKind: 'control', effectId: 'debuff_charm',
        description: 'HEART — charm the foe (it falters) and strike, softening it toward mercy.',
    },
    'sig-rallying-blow': {
        id: 'sig-rallying-blow', name: 'Conclusion', kind: 'conclude', cost: 6,
        magnitude: 0,
        description: 'BODY — a finisher: deals damage for every stack of every effect on the enemy, then refreshes your stance die. Build the board, then conclude.',
    },
    'sig-clever-gambit': {
        id: 'sig-clever-gambit', name: 'Clever Gambit', kind: 'draw', cost: 4,
        magnitude: 2,
        description: 'MIND — draw 2 and refresh your stance die: turn information into tempo.',
    },
};

/** Per-archetype Signature kit (Spec 26b tuning §B). Everyone gets the scout;
 *  the rest is flavored to the archetype's stat identity. */
export const SIGNATURE_KITS: Record<PlayerArchetype, SignatureSkillId[]> = {
    heart: ['sig-read-opponent', 'sig-second-wind', 'sig-overwhelming-argument', 'sig-disarming-plea'],
    body: ['sig-read-opponent', 'sig-press-the-point', 'sig-second-wind', 'sig-rallying-blow'],
    mind: ['sig-read-opponent', 'sig-press-the-point', 'sig-conviction-strike', 'sig-clever-gambit'],
};

/** The player's archetype from their dominant base stat (heart > body > mind tiebreak). */
export function playerArchetype(player: { baseStats: { heart: number; body: number; mind: number } }): PlayerArchetype {
    const { heart, body, mind } = player.baseStats;
    if (body >= heart && body >= mind) return 'body';
    if (mind >= heart && mind >= body) return 'mind';
    return 'heart';
}

/** The resolved signature kit (full objects) for an archetype. */
export function signaturesForArchetype(archetype: PlayerArchetype): SignatureSkill[] {
    return SIGNATURE_KITS[archetype].map(id => SIGNATURE_SKILLS[id]);
}

export const SIGNATURE_SKILL_LIST: readonly SignatureSkill[] = Object.freeze(Object.values(SIGNATURE_SKILLS));

export function getSignatureSkill(id: string): SignatureSkill | undefined {
    return SIGNATURE_SKILLS[id as SignatureSkillId];
}

/** Heal granted by Second Wind = a fraction of the player's max HP. */
const SECOND_WIND_HEAL_FRAC = 0.12;

/** Direct HP a strike-class signature deals on top of its DoT (× magnitude). */
const STRIKE_DAMAGE_MULT = 3;

/** Damage dealt per stack of any active effect on the enemy (Conclusion finisher). */
export const CONCLUDE_DMG_PER_STACK = 2;

/**
 * Applies a signature skill's effect to the encounter (HP model). Pure: returns
 * the new state + events; the engine handles Conviction spend + outcome checks.
 * Signatures DO real things to the enemy's HP / status — no abstract tracks.
 */
export function applySignatureSkill(
    state: CombatEncounterState,
    skill: SignatureSkill,
    rng: () => number,
): CombatTransition {
    const events: CombatEvent[] = [];
    let next = state;

    switch (skill.kind) {
        case 'scout': {
            // Reveal the current + next phase stance.
            const cur = Math.min(state.currentPhaseIndex, state.threatPhases.length - 1);
            const indices = [cur, cur + 1].filter(i => i < state.threatPhases.length);
            const revealed = new Set(state.revealedStances);
            for (const i of indices) {
                if (!revealed.has(i)) {
                    revealed.add(i);
                    events.push({ kind: 'stance-revealed', phaseIndex: i, stance: state.threatPhases[i].enemyStance });
                }
            }
            next = { ...state, revealedStances: [...revealed].sort((a, b) => a - b) };
            break;
        }
        case 'reroll': {
            // Press Fate — bend fate on the BAD dice only: re-roll the dice you've
            // USED (spent/exhausted) or that show a dead X face, and KEEP every
            // still-usable die. The engine wrapper spends the Conviction; this is a
            // pure partial re-roll.
            const { dice, rerolledIds } = rerollSpentDice(state.dice, rng);
            // The draft survives unless its die was one of the re-rolled (used/X)
            // dice — in which case the read is gone and the player can re-draft.
            const draftRerolled = state.draftedDieId !== null && rerolledIds.includes(state.draftedDieId);
            next = {
                ...state, dice,
                draftedDieId: draftRerolled ? null : state.draftedDieId,
                lastRead: draftRerolled ? 'none' : state.lastRead,
            };
            events.push({ kind: 'turn-dice-rolled', turn: state.turn, dice });
            break;
        }
        case 'sustain': {
            const draw = drawCombatCards(state.drawPile, state.discard, state.deck, skill.magnitude, rng);
            let uid = state.turn * 1000 + 7;
            const newHand = [...state.hand, ...draw.drawn.map(cardId => ({ uid: `sw${++uid}`, cardId }))];
            const healed = heal(state.player, Math.max(1, Math.round(state.player.maxHealth * SECOND_WIND_HEAL_FRAC))) as Character;
            next = { ...state, hand: newHand, drawPile: draw.drawPile, discard: draw.discard, player: healed };
            events.push({ kind: 'hand-drawn', cards: draw.drawn });
            break;
        }
        case 'conclude': {
            // Finisher — reads the enemy's current effect board and deals
            // CONCLUDE_DMG_PER_STACK × total stacks (sum of all effect intensities).
            // Then refreshes the drafted die so the BODY archetype keeps swinging.
            const totalStacks = state.enemy.effects.reduce((sum, ae) => sum + ae.intensity, 0);
            const dmg = Math.max(1, Math.round(CONCLUDE_DMG_PER_STACK * totalStacks));
            const enemy = applyDamage(state.enemy, dmg) as Enemy;
            const attribution = recordAttribution(state.attribution, skill.id, skill.name, null, dmg);
            events.push({ kind: 'conclude-hit', amount: dmg, totalStacks });
            events.push({ kind: 'damage-dealt', cardId: skill.id, target: 'enemy', amount: dmg });
            next = refreshDraftedDie({ ...state, enemy, attribution });
            break;
        }
        case 'control':
        case 'dot':
        case 'mercy':
        case 'strike': {
            // Apply the named effect to the enemy at boosted intensity (guaranteed
            // — no caster roll, so it never fizzles). DoT will tick HP; control
            // hinders the enemy's turn (canAct). 'strike'/'mercy' also hit HP now.
            let enemy = state.enemy;
            let attribution = state.attribution;
            const def = skill.effectId ? lookupEffect(skill.effectId) : undefined;
            if (def) {
                const res = applyEffect(enemy.effects, def, state.round, {
                    intensityDelta: skill.magnitude, sourceId: state.player.id,
                });
                enemy = { ...enemy, effects: res.activeEffects } as Enemy;
                const active = enemy.effects.find(a => a.effectId === def.id);
                if (active) {
                    const landed: LandedEffect = { effectId: def.id, effect: def, active, target: 'enemy' };
                    const cls = effectImpact(def, active.intensity, active.remainingDuration).track;
                    attribution = recordAttribution(attribution, skill.id, skill.name, landed, 0);
                    events.push({ kind: 'effect-landed', cardId: skill.id, effectId: def.id, target: 'enemy', effectKind: cls, intensity: active.intensity, effect: def });
                }
            }
            // strike = a heavy bleeding blow; mercy = a disarming hit. Both chip HP.
            if (skill.kind === 'strike' || skill.kind === 'mercy') {
                const dmg = skill.kind === 'strike' ? skill.magnitude * STRIKE_DAMAGE_MULT : skill.magnitude;
                enemy = applyDamage(enemy, dmg) as Enemy;
                attribution = recordAttribution(attribution, skill.id, skill.name, null, dmg);
                events.push({ kind: 'damage-dealt', cardId: skill.id, target: 'enemy', amount: dmg });
            }
            next = { ...state, enemy, attribution };
            // BODY strike — refresh the drafted die so the player keeps swinging.
            if (skill.kind === 'strike') next = refreshDraftedDie(next);
            break;
        }
        case 'draw': {
            // MIND tempo — draw cards AND refresh the drafted die.
            const draw = drawCombatCards(state.drawPile, state.discard, state.deck, skill.magnitude, rng);
            let uid = state.turn * 1000 + 31;
            const newHand = [...state.hand, ...draw.drawn.map(cardId => ({ uid: `cg${++uid}`, cardId }))];
            next = refreshDraftedDie({ ...state, hand: newHand, drawPile: draw.drawPile, discard: draw.discard });
            events.push({ kind: 'hand-drawn', cards: draw.drawn });
            break;
        }
    }

    return { state: next, events };
}

/** Refreshes the currently drafted die back to `available` (for strike/draw). */
function refreshDraftedDie(state: CombatEncounterState): CombatEncounterState {
    if (!state.draftedDieId) return state;
    return {
        ...state,
        dice: state.dice.map(d => (d.id === state.draftedDieId && d.color !== 'x' ? { ...d, state: 'available' as const } : d)),
    };
}

/** Convenience: which stances a scout would reveal (for presenter previews). */
export function scoutRevealIndices(state: CombatEncounterState): number[] {
    const cur = Math.min(state.currentPhaseIndex, state.threatPhases.length - 1);
    return [cur, cur + 1].filter(i => i < state.threatPhases.length);
}
