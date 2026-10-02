/**
 * Signature Skills.
 *
 * A small, ALWAYS-available kit (independent of the shuffled deck) funded by
 * Conviction (◆) and granted only by worn signet relics. There is one: The
 * Open Hand (the Suppliant's Ring), the befriend — it opens the mercy choice
 * on a foe that can be befriended and is low enough.
 *
 * `applySignatureSkill` is a pure transition; the engine wraps it in
 * `playSignatureSkill` to gate on `signatureCastBlock`, spend Conviction and
 * check for an immediate outcome. The module imports nothing from
 * `combat.engine` (no cycle).
 */

import { befriendHpGateOpen, isEnemyBefriendable } from '../Enemy/befriend';
import type {
    CombatEncounterState, CombatEvent, CombatTransition, SignatureSkill,
    SignatureSkillId, PlayerArchetype,
} from './combat.encounter.types';

/** The one Conviction price every signature pays (A Plain Ward's paid parity). */
export const SIGNATURE_COST = 4;

/** The signatures, keyed by id. One since R7e2: The Open Hand. */
export const SIGNATURE_SKILLS: Record<SignatureSkillId, SignatureSkill> = {
    'sig-disarming-plea': {
        id: 'sig-disarming-plea', name: 'The Open Hand', kind: 'mercy', cost: SIGNATURE_COST,
        description: 'Offer the foe mercy. A foe that can be befriended, once low enough, may be spared.',
    },
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
