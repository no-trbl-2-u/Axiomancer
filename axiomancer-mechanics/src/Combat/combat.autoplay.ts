import type { Character } from '../Character/types';
import type { Enemy } from '../Enemy/types';
import {
    initializeCombatEncounter,
    rollEncounterDice,
    startTurn,
    draftStanceDie,
    endTurn,
    playCombatCard,
    playSignatureSkill,
    resolveThreatPhase,
    handCards,
    getDraftedDie,
    revealedCurrentStance,
    chooseDraft,
    buildCombatSummary,
    getSignatureSkill,
    selectMercyChoice,
} from './combat.engine';
import type { CombatCard, CombatEncounterState, CombatOutcome } from './combat.encounter.types';

export type HazardAutoPolicyId = 'naive' | 'safe' | 'aggressive' | 'status';

export interface HazardCombatAutoOptions {
    seed?: number;
    policy?: HazardAutoPolicyId;
    maxTurns?: number;
}

export interface HazardCombatAutoResult {
    state: CombatEncounterState;
    outcome: CombatOutcome | null;
    summary: ReturnType<typeof buildCombatSummary>;
    phaseCount: number;
}

const bestAutoCard = (s: CombatEncounterState, policy: HazardAutoPolicyId): { uid: string; card: CombatCard } | null => {
    const cards = handCards(s).filter(c => c.card.verbClass !== 'retreat');
    if (cards.length === 0) return null;
    const activeIds = new Set(s.enemy.effects.map(e => e.effectId));
    return cards.sort((a, b) => {
        switch (policy) {
            case 'status': {
                const af = a.card.effectKind !== 'none' && !activeIds.has(a.card.primaryEffectId ?? '') ? 0 : a.card.effectKind !== 'none' ? 1 : 2;
                const bf = b.card.effectKind !== 'none' && !activeIds.has(b.card.primaryEffectId ?? '') ? 0 : b.card.effectKind !== 'none' ? 1 : 2;
                if (af !== bf) return af - bf;
                return b.card.bottomDamagePreview - a.card.bottomDamagePreview;
            }
            case 'aggressive':
                return b.card.bottomDamagePreview - a.card.bottomDamagePreview;
            case 'safe': {
                const at = a.card.verbClass === 'defend' || a.card.verbClass === 'buff-self' ? 0 : 1;
                const bt = b.card.verbClass === 'defend' || b.card.verbClass === 'buff-self' ? 0 : 1;
                if (at !== bt) return at - bt;
                return a.card.bottomDamagePreview - b.card.bottomDamagePreview;
            }
            default:
                return 0;
        }
    })[0] ?? null;
};

const bestAutoSignature = (s: CombatEncounterState): string | null => {
    for (const id of s.signatures) {
        const sig = getSignatureSkill(id);
        if (!sig || s.conviction < sig.cost) continue;
        if (['dot', 'strike', 'control'].includes(sig.kind)) return id;
    }
    return null;
};

const playAutoPhase = (state: CombatEncounterState, policy: HazardAutoPolicyId, phaseTurnLimit: number): CombatEncounterState => {
    let s = state;
    let safety = 0;
    while (s.phase === 'phase-play' && !s.finalOutcome && !s.mercyChoiceActive && safety < phaseTurnLimit * 6) {
        safety++;
        if (s.conviction >= 6) {
            const sigId = bestAutoSignature(s);
            if (sigId) {
                const cast = playSignatureSkill(s, sigId);
                if (cast.state !== s) { s = cast.state; if (s.finalOutcome) break; continue; }
            }
        }
        let drafted = getDraftedDie(s);
        if (!drafted || drafted.state !== 'available' || drafted.color === 'x') {
            if (s.draftedDieId !== null) s = endTurn(s).state;
            if (s.dice.length === 0) {
                s = startTurn(s).state;
                if (s.phase !== 'phase-play') break;
            }
            const want = bestAutoCard(s, policy);
            const enemyStance = revealedCurrentStance(s);
            const pick = chooseDraft(s.dice, want?.card.stance ?? 'wild', enemyStance);
            if (!pick) break;
            s = draftStanceDie(s, pick).state;
            drafted = getDraftedDie(s);
            if (!drafted || drafted.state !== 'available' || drafted.color === 'x') {
                const topCard = handCards(s)[0];
                if (topCard) s = playCombatCard(s, { uid: topCard.uid }, false).state;
                s = endTurn(s).state;
                continue;
            }
        }
        const want = bestAutoCard(s, policy);
        if (!want) {
            const topCard = handCards(s)[0];
            if (topCard) s = playCombatCard(s, { uid: topCard.uid }, false).state;
            s = endTurn(s).state;
            continue;
        }
        const res = playCombatCard(s, { uid: want.uid }, true);
        if (res.events.some(e => e.kind === 'effect-fizzled')) {
            s = playCombatCard(s, { uid: want.uid }, false).state;
            continue;
        }
        s = res.state;
        if (s.finalOutcome || s.mercyChoiceActive) break;
        const after = getDraftedDie(s);
        if (!after || after.state !== 'available') s = endTurn(s).state;
    }
    return s;
};

export function runHazardCombatAutoEncounter(
    player: Character,
    enemy: Enemy,
    options: HazardCombatAutoOptions = {},
): HazardCombatAutoResult {
    const policy = options.policy ?? 'status';
    const maxTurns = options.maxTurns ?? 20;
    let state = rollEncounterDice(initializeCombatEncounter(player, enemy, undefined, options.seed)).state;
    let phaseCount = 0;
    while (state.phase !== 'complete' && !state.finalOutcome && phaseCount < maxTurns) {
        phaseCount++;
        state = playAutoPhase(state, policy, maxTurns);
        if (state.finalOutcome) break;
        if (state.mercyChoiceActive) {
            state = selectMercyChoice(state, 'spare').state;
            break;
        }
        if (state.phase === 'phase-play') state = resolveThreatPhase(state).state;
    }
    return { state, outcome: state.finalOutcome ?? null, summary: buildCombatSummary(state), phaseCount };
}
