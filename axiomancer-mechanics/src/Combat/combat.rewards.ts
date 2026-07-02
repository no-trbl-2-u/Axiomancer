/**
 * Spec 26b deckbuilder — combat card rewards + the skill-unlock hook.
 *
 * Two distinct progression levers (per the design):
 *   1. CARD REWARDS (frequent, after a won combat) grow the DECK — extra copies
 *      and variety. They append to `Character.combatRewardCards`, which
 *      `buildCombatDeck` stacks on top of the learned-skill baseline.
 *   2. SKILL UNLOCKS (rare, via ethical-dilemma events — not implemented yet)
 *      add a NEW card type. `unlockSkillViaDilemma` is the hook those events will
 *      call; it bypasses the normal learning requirements (the dilemma IS the
 *      gate), unlike `learnSkill`.
 *
 * Pure: rolling takes an explicit `rng`. The mobile aftermath offers the 1-of-N
 * and persists the pick.
 */

import type { Character } from '../Character/types';
import { getCardById } from '../Cards/cards.library';
import { isGoldCard } from './combat.cards';
import { playerArchetype } from './combat.signature';
import type { PlayerArchetype } from './combat.encounter.types';

/**
 * The card-reward pool — skill ids that make good combat cards (they apply enemy
 * effects → pressure). Curated across aspects + tiers; invalid ids are filtered
 * at roll time so the list is safe to edit. A reward MAY duplicate a card you
 * already run (that's the deckbuilder point).
 */
export const COMBAT_REWARD_POOL: readonly string[] = Object.freeze([
    // body
    'slippery-slope', 'ad-hominem-strike', 'mob-appeal', 'straw-giant',
    'brace-for-impact',     // defense (GUARD)
    'brazen-rebuttal',      // THORNS — reflect the telegraphed hit
    'briar-riposte',        // RIPOSTE — parry + counter
    // mind
    'false-dilemma', 'liars-echo', 'undistributed-middle', 'sorites-cascade',
    'suspend-judgment',     // defense (GUARD)
    'breach',               // VULNERABLE — mark the foe Breached (set-up-then-swing)
    'mounting-contradictions', // COMPOUND — HP per distinct debuff
    // heart
    'eternal-regress', 'appeal-to-pity', 'ship-of-theseus', 'bootstrap-paradox',
    'stoic-reserve',        // defense (GUARD)
    'resonance-rupture',    // RUPTURE — detonate the foe's DoT
    'gabriels-bulwark',     // BARRIER — stacking, persistent soak
    'leeching-syllogism',   // SIPHON — offense-scaled sustain
    // gold (rare) — the strongest tier; weighted RARE in the roll below
    'pyrrhic-victory', 'the-final-word', 'unmoved-mover',
]);

/** The skills a brand-new player starts with: an opening offensive card PLUS a
 *  basic defense card, so every player can GUARD from turn one. The rest unlock
 *  through ethical-dilemma events via `unlockSkillViaDilemma`. The mobile
 *  bootstrap seeds a new character's `knownSkills` from this list. */
export const STARTING_SKILL_IDS: readonly string[] = Object.freeze([
    'slippery-slope',       // opening offense
    'brace-for-impact',     // basic defense (GUARD) — guard from turn one
]);

/** The single OFFENSIVE skill a brand-new player starts with. Kept for
 *  back-compat; prefer `STARTING_SKILL_IDS` (which also grants a defense card). */
export const STARTING_SKILL_ID = 'slippery-slope';

/** A valid reward-pool entry must resolve to a real skill. */
function validPool(): string[] {
    return COMBAT_REWARD_POOL.filter(id => !!getCardById(id));
}

const ASPECT_OF = (id: string): PlayerArchetype | null => {
    const s = getCardById(id);
    return s ? (s.philosophicalAspect as PlayerArchetype) : null;
};

/**
 * Rolls `count` distinct card-reward offers after a won combat. Biased toward the
 * player's archetype (≈2× weight) so rewards tend to reinforce a build, while
 * still offering cross-aspect variety. Pure (seeded by `rng`).
 */
export function rollCombatCardRewards(
    player: Character,
    rng: () => number,
    count = 3,
): string[] {
    const archetype = playerArchetype(player);
    const pool = validPool();
    const offers: string[] = [];
    const remaining = pool.slice();
    while (offers.length < count && remaining.length > 0) {
        // Weighted pick: archetype-aligned entries get double weight; gold
        // (rare) cards are heavily down-weighted so they're an occasional prize.
        const weights = remaining.map(id => {
            const arch = ASPECT_OF(id) === archetype ? 2 : 1;
            return isGoldCard(id) ? arch * 0.25 : arch;
        });
        const total = weights.reduce((a, b) => a + b, 0);
        let roll = rng() * total;
        let idx = 0;
        for (; idx < remaining.length; idx++) {
            roll -= weights[idx];
            if (roll <= 0) break;
        }
        const pick = remaining[Math.min(idx, remaining.length - 1)];
        offers.push(pick);
        remaining.splice(remaining.indexOf(pick), 1);
    }
    return offers;
}

/** Appends a chosen reward card to the player's persistent deck collection. */
export function addRewardCard(player: Character, cardId: string): Character {
    return { ...player, combatRewardCards: [...(player.combatRewardCards ?? []), cardId] };
}

/**
 * Spec 26b §D — unlock a NEW skill from an ethical-dilemma event. Bypasses the
 * normal `learnSkill` requirement gates (level/stat/prereq) because the dilemma
 * choice is itself the gate. No-op (same ref) when already known or unknown id.
 * The dilemma EVENTS are not implemented yet; this is the hook they will call.
 */
export function unlockSkillViaDilemma(player: Character, skillId: string): Character {
    if (player.knownSkills.includes(skillId)) return player;
    if (!getCardById(skillId)) return player;
    return { ...player, knownSkills: [...player.knownSkills, skillId] };
}
