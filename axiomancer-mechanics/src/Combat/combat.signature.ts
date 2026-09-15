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
import {
    isUpgradeableDiceEnabled, rerollMissFacesHonest, crackedColorsForTurn, PRESS_FATE_COST,
} from './combat.upgradeable-dice';
import { recordAttribution } from './combat.attribution';
import { effectImpact } from './combat.cards';
import type {
    CombatEncounterState, CombatEvent, CombatTransition, SignatureSkill,
    SignatureSkillId, LandedEffect, PlayerArchetype,
} from './combat.encounter.types';

/** The baseline signature kit available to every player (Spec 26b §4). */
export const SIGNATURE_SKILLS: Record<SignatureSkillId, SignatureSkill> = {
    'sig-read-opponent': {
        // Spec 33 §6 (D4, 2026-07-17): the hidden-stance read is retired (§2 —
        // everything telegraphs openly). Reinterpreted: buy the NEXT phase's
        // stance check (punish/yield) and reactive branch EARLY, before you
        // commit the play that sets your stance. Cost re-derived to 1◆ (D3).
        id: 'sig-read-opponent', name: 'Read the Entrails', kind: 'scout', cost: 1, magnitude: 0,
        description: "Reveal the next phase's stance check and reactive branch early — see its punish/yield and how it answers your play before you commit. Cheap; cast it early.",
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
        id: 'sig-overwhelming-argument', name: 'The Stilling', kind: 'control', cost: 8,
        // WI-8 (2026-07-12) — was wired to `debuff_backfire`, which only pays on
        // rung loss: 4 casts in one fight moved the enemy's HP by ZERO. Now it
        // applies REAL hard control (`debuff_petrify`, a 1-phase skipTurn honored
        // by `canAct`) so an 8-Conviction flagship actually denies the foe's turn.
        magnitude: 1, effectKind: 'control', effectId: 'debuff_petrify',
        description: 'Petrify the foe — it turns to stone and loses its next turn. A boss is too willful to freeze: it is STAGGERED instead.',
    },
    // Phase 31 (EA-8, Gate 0 §4 lever 1, re-measured 2026-07-13): cost
    // raised 7 -> 8 to match `sig-overwhelming-argument`. At 7, this was
    // BOTH the cheaper AND the more reliable (never-fizzles) of the two
    // `greedy`-funded signatures — any run that saved exactly 7-but-not-8
    // Conviction could only ever afford this one, structurally starving
    // control of its turn. A 540-run stage-matrix re-measurement (post
    // Phase 26 Turn Law + this phase's THE STAKE, both already-shipped
    // Conviction-sink corrections) still showed it at 83.6% of all
    // signature casts (56/67) — the dominance survived those fixes, so
    // this lever fires. Price parity lets both compete once a policy
    // actually holds 8◆, instead of dot auto-winning the 7-7 window.
    'sig-conviction-strike': {
        id: 'sig-conviction-strike', name: 'The Oath Kept', kind: 'dot', cost: 8,
        magnitude: 3, effectKind: 'dot', effectId: 'debuff_poison',
        description: 'A guaranteed venom at boosted intensity — DoT that cannot fizzle.',
    },
    // ── Per-archetype exclusives ─────────────────────────────────────────────
    'sig-disarming-plea': {
        id: 'sig-disarming-plea', name: 'The Open Hand', kind: 'mercy', cost: 6,
        magnitude: 6, effectKind: 'control', effectId: 'debuff_quarter',
        description: 'HEART — charm the foe (it falters) and strike, softening it toward mercy.',
    },
    'sig-rallying-blow': {
        id: 'sig-rallying-blow', name: "The Butcher's Bill", kind: 'conclude', cost: 6,
        magnitude: 0,
        description: 'BODY — a finisher: deals damage for every stack of every effect on the enemy, then refreshes your stance die. Build the board, then conclude.',
    },
    'sig-clever-gambit': {
        id: 'sig-clever-gambit', name: 'Cold Counsel', kind: 'draw', cost: 4,
        magnitude: 2,
        description: 'MIND — draw 2 and refresh your stance die: turn information into tempo.',
    },
    // ── Phase 85 (equipment progression — head/hands/feet accessories) ───────
    'sig-mounting-dread': {
        id: 'sig-mounting-dread', name: 'The Mounting Dread', kind: 'dot', cost: 9,
        magnitude: 3, effectKind: 'dot', effectId: 'debuff_creeping_doom',
        description: 'MIND — a dread that will not be reasoned with: an open-ended doom, guaranteed to take hold, that grows with everything the foe still tries.',
    },
    'sig-endless-labor': {
        id: 'sig-endless-labor', name: 'The Endless Labor', kind: 'empower', cost: 6,
        magnitude: 3,
        description: 'BODY — the strength that does not rest: a permanent surge of might added to every blow you land for the rest of the fight.',
    },
    'sig-unbroken-stride': {
        id: 'sig-unbroken-stride', name: 'The Unbroken Stride', kind: 'surge', cost: 4,
        magnitude: 5,
        description: 'BODY — a fleetness that punishes hesitation: your next blow lands harder, but only if you keep swinging.',
    },
};

/** The player's archetype from their dominant base stat (heart > body > mind
 *  tiebreak). Phase 19 retired archetype→signature gating; `playerArchetype`
 *  survives only to flavour the mobile portrait. */
export function playerArchetype(player: { baseStats: { heart: number; body: number; mind: number } }): PlayerArchetype {
    const { heart, body, mind } = player.baseStats;
    if (body >= heart && body >= mind) return 'body';
    if (mind >= heart && mind >= body) return 'mind';
    return 'heart';
}

export const SIGNATURE_SKILL_LIST: readonly SignatureSkill[] = Object.freeze(Object.values(SIGNATURE_SKILLS));

export function getSignatureSkill(id: string): SignatureSkill | undefined {
    return SIGNATURE_SKILLS[id as SignatureSkillId];
}

/** Heal granted by Second Wind = a fraction of the player's max HP. */
const SECOND_WIND_HEAL_FRAC = 0.12;

/** Damage dealt per stack of any active effect on the enemy (The Butcher's Bill finisher). */
export const CONCLUDE_DMG_PER_STACK = 2;

/** WI-8 — STAGGER rungs a HARD-control signature lays on a boss/unique instead
 *  of the (forbidden) turn-skip: bosses can't be frozen (anti-permalock), so the
 *  8-Conviction cast still buys an observable weaken of their next telegraph. */
export const HARD_CONTROL_BOSS_STAGGER = 2;

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
            // Spec 33 §4 (flag-gated) — Press Fate's HONEST form: reroll every
            // MISS face from its gear table, once per round, no stance/mana
            // guarantee (this explicitly supersedes `rerollSpentDice`'s
            // stance-bearing conversion — a rig under the spec-33 law). Cracked
            // dice are excluded. The engine wrapper charged PRESS_FATE_COST.
            if (isUpgradeableDiceEnabled()) {
                const cracked = crackedColorsForTurn(state, state.turn);
                const honest = rerollMissFacesHonest(state.dice, state, cracked, rng);
                next = { ...state, dice: honest.dice, pressFateRound: state.round };
                events.push({ kind: 'press-fate-rerolled', dieIds: honest.rerolledIds, cost: PRESS_FATE_COST });
                events.push({ kind: 'turn-dice-rolled', turn: state.turn, dice: honest.dice });
                break;
            }
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
            const attribution = recordAttribution(state.attribution, skill.id, skill.name, null, dmg, state.enemy.health);
            events.push({ kind: 'conclude-hit', amount: dmg, totalStacks });
            events.push({ kind: 'damage-dealt', cardId: skill.id, target: 'enemy', amount: dmg });
            next = refreshDraftedDie({ ...state, enemy, attribution });
            break;
        }
        case 'control':
        case 'dot':
        case 'mercy': {
            // Apply the named effect to the enemy at boosted intensity (guaranteed
            // — no caster roll, so it never fizzles). DoT will tick HP; control
            // hinders the enemy's turn (canAct). 'mercy' also chips HP (the
            // signature-only flat-magnitude exception, spec 32 §12).
            let enemy = state.enemy;
            let attribution = state.attribution;
            const def = skill.effectId ? lookupEffect(skill.effectId) : undefined;
            // WI-8 — bosses/uniques RESIST hard control (a skipTurn effect): the
            // anti-permalock doctrine (cf. `bossRungGrowth`) forbids freezing
            // them outright. A hard-control signature instead STAGGERS the boss's
            // next telegraph — a real, observable weaken — while normal foes take
            // the full turn-skip below.
            const isHardControl = !!def?.payload.actionRestriction?.skipTurn;
            const bossImmune = state.enemy.difficulty === 'boss' || state.enemy.difficulty === 'unique';
            if (def && isHardControl && bossImmune) {
                const total = (state.staggerRungs ?? 0) + HARD_CONTROL_BOSS_STAGGER;
                events.push({ kind: 'staggered', rungs: HARD_CONTROL_BOSS_STAGGER, total });
                next = { ...state, staggerRungs: total };
                break;
            }
            if (def) {
                const res = applyEffect(enemy.effects, def, state.round, {
                    intensityDelta: skill.magnitude, sourceId: state.player.id,
                });
                enemy = { ...enemy, effects: res.activeEffects } as Enemy;
                const active = enemy.effects.find(a => a.effectId === def.id);
                if (active) {
                    const landed: LandedEffect = { effectId: def.id, effect: def, active, target: 'enemy' };
                    const cls = effectImpact(def, active.intensity, active.remainingDuration).track;
                    attribution = recordAttribution(attribution, skill.id, skill.name, landed, 0, enemy.health);
                    events.push({ kind: 'effect-landed', cardId: skill.id, effectId: def.id, target: 'enemy', effectKind: cls, intensity: active.intensity, effect: def });
                }
            }
            // mercy = a disarming hit: a flat-magnitude chip that softens the
            // foe toward the mercy screen (The Open Hand's ratified exception).
            if (skill.kind === 'mercy') {
                const dmg = skill.magnitude;
                const hpBefore = enemy.health;
                enemy = applyDamage(enemy, dmg) as Enemy;
                attribution = recordAttribution(attribution, skill.id, skill.name, null, dmg, hpBefore);
                events.push({ kind: 'damage-dealt', cardId: skill.id, target: 'enemy', amount: dmg });
            }
            next = { ...state, enemy, attribution };
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
        case 'empower': {
            // BODY — grant WRATH directly (Phase 85): mirrors the card-authored
            // WRATH grant in combat.engine.ts exactly (a flat add, combat-long,
            // never fades) so a signature-granted stack behaves identically to a
            // card-granted one for every downstream reader (scalePlayerHit, etc.).
            const wrath = (state.wrath ?? 0) + skill.magnitude;
            next = { ...state, wrath };
            events.push({ kind: 'wrath-gained', cardId: skill.id, amount: skill.magnitude, total: wrath });
            break;
        }
        case 'surge': {
            // BODY — grant CHAIN directly (Phase 85): mirrors the card-authored
            // CHAIN grant exactly, including marking the turn as fed so the
            // signature's own grant doesn't fade at the very boundary it was
            // cast on.
            const chain = (state.chain ?? 0) + skill.magnitude;
            next = { ...state, chain, chainFedThisTurn: true };
            events.push({ kind: 'chain-gained', cardId: skill.id, amount: skill.magnitude, total: chain });
            break;
        }
    }

    return { state: next, events };
}

/** Refreshes the currently drafted die back to `available` (for conclude/draw). */
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
