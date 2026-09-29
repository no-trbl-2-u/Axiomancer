/**
 * Spec 26b §4 — Signature Skills, as the revamp leaves them (phase R4, D47).
 *
 * A small, ALWAYS-available kit (independent of the shuffled deck) funded by
 * Conviction (◆) and granted only by the eleven signet relics. Until the owner
 * re-authors them (B1) they are placeholders: ten raise GUARD 5 at one flat
 * cost, and The Open Hand (the Suppliant's Ring) is the befriend — it opens
 * the mercy choice on a foe that can be befriended and is low enough.
 *
 * `applySignatureSkill` is a pure transition; the engine wraps it in
 * `playSignatureSkill` to gate on `signatureCastBlock`, spend Conviction and
 * check for an immediate outcome. The module imports nothing from
 * `combat.engine` (no cycle).
 */

import { befriendHpGateOpen, isEnemyBefriendable } from '../Enemy/befriend';
import { scaleFor } from './stat-scaling';
import type {
    CombatEncounterState, CombatEvent, CombatTransition, SignatureSkill,
    SignatureSkillId, PlayerArchetype,
} from './combat.encounter.types';

/** The one Conviction price every signature pays (A Plain Ward's paid parity). */
export const SIGNATURE_COST = 4;

/** The GUARD a placeholder signature raises, before the player's mind scales it. */
export const SIGNATURE_GUARD = 5;

const GUARD_TEXT = `Raise GUARD ${SIGNATURE_GUARD}.`;

function guardSignature(id: SignatureSkillId, name: string): SignatureSkill {
    return { id, name, kind: 'guard', cost: SIGNATURE_COST, magnitude: SIGNATURE_GUARD, description: GUARD_TEXT };
}

/** The eleven signatures, keyed by id. Names are unchanged from before R4. */
export const SIGNATURE_SKILLS: Record<SignatureSkillId, SignatureSkill> = {
    'sig-read-opponent': guardSignature('sig-read-opponent', 'Read the Entrails'),
    'sig-press-the-point': guardSignature('sig-press-the-point', 'Press Fate'),
    'sig-second-wind': guardSignature('sig-second-wind', 'Second Wind'),
    'sig-overwhelming-argument': guardSignature('sig-overwhelming-argument', 'The Stilling'),
    'sig-conviction-strike': guardSignature('sig-conviction-strike', 'The Oath Kept'),
    'sig-disarming-plea': {
        id: 'sig-disarming-plea', name: 'The Open Hand', kind: 'mercy', cost: SIGNATURE_COST, magnitude: 0,
        description: 'Offer the foe mercy. A foe that can be befriended, once low enough, may be spared.',
    },
    'sig-rallying-blow': guardSignature('sig-rallying-blow', "The Butcher's Bill"),
    'sig-clever-gambit': guardSignature('sig-clever-gambit', 'Cold Counsel'),
    'sig-mounting-dread': guardSignature('sig-mounting-dread', 'The Mounting Dread'),
    'sig-endless-labor': guardSignature('sig-endless-labor', 'The Endless Labor'),
    'sig-unbroken-stride': guardSignature('sig-unbroken-stride', 'The Unbroken Stride'),
};

/** The player's archetype from their dominant base stat (body > mind > heart
 *  tiebreak). It only flavours the mobile portrait. */
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

/** The GUARD a `guard` signature raises for this player (S3: mind scales it). */
export function signatureGuardAmount(state: CombatEncounterState, skill: SignatureSkill): number {
    return scaleFor(skill.magnitude, state.player.baseStats, 'mind', 'one-shot');
}

/**
 * Why this signature can't be cast right now, or null when it can. The engine
 * refuses on it and the signature bar prints it, so the two never disagree.
 * A refused cast spends nothing.
 */
export function signatureCastBlock(state: CombatEncounterState, skill: SignatureSkill): string | null {
    if (state.conviction < skill.cost) return `Need ${skill.cost} ◆ Conviction`;
    if (skill.kind === 'mercy') {
        if (state.mercyChoiceActive) return 'Mercy is already offered';
        if (!isEnemyBefriendable(state.enemy)) return `${state.enemy.name} will not be befriended`;
        if (!befriendHpGateOpen(state.enemy)) return `${state.enemy.name} is not yet low enough to spare`;
    }
    return null;
}

/**
 * Applies a signature skill to the encounter. Pure: returns the new state +
 * events; the engine handles the gate, the Conviction spend and outcomes.
 */
export function applySignatureSkill(
    state: CombatEncounterState,
    skill: SignatureSkill,
): CombatTransition {
    switch (skill.kind) {
        case 'guard': {
            const guard = (state.guard ?? 0) + signatureGuardAmount(state, skill);
            return { state: { ...state, guard }, events: [] };
        }
        case 'mercy': {
            const events: CombatEvent[] = [
                { kind: 'mercy-opened', message: `${state.enemy.name} falters — spare or exploit?` },
            ];
            // `mercy-choice` is the phase the board opens the spare/exploit
            // modal on; `selectMercyChoice` resolves it.
            return { state: { ...state, phase: 'mercy-choice', mercyChoiceActive: true }, events };
        }
    }
}
