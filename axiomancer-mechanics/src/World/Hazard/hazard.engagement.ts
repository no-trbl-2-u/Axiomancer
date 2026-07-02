/**
 * Hazard Minigame — Phase 149 engagement mechanics.
 *
 * Deck focus classification, three-choice rewards, sub-quest drafting,
 * deck scars tracking, and identity summaries. Makes Hazard deck growth
 * and failure memory readable, strategic, and player-owned.
 */

import { getHazardCardDef, HAZARD_REWARD_CARDS } from './hazard.content';
import { shuffle, type HazardRngState } from './hazard.rng';
import type {
    HazardColor,
    HazardCardDef,
    HazardDeckFocus,
    HazardDeckIdentity,
    HazardDeckScars,
    HazardRewardOffer,
    HazardSubquestDraft,
    HazardSubquestDef,
} from './hazard.types';

// ---------------------------------------------------------------------------
// Deck Focus Classification
// ---------------------------------------------------------------------------

/** 
 * Classifies a persistent Hazard deck by its dominant archetype.
 * Used for curating reward offers to match or tempt the current build.
 */
export function classifyDeckFocus(cardIds: string[]): HazardDeckFocus {
    if (cardIds.length === 0) return 'mixed';

    const cards = cardIds.map(getHazardCardDef);
    const total = cards.length;
    
    // Count CRACK cards for scar classification
    const crackCount = cards.filter(card => card.id === 'crack').length;
    const scarRatio = crackCount / total;
    
    // If heavily scarred (>30% CRACK cards), classify as scarred
    if (scarRatio > 0.3) return 'scarred';
    
    // Analyze color distribution and progress focus
    let forceCards = 0;
    let escapeCards = 0;
    let goldUtilityCards = 0;
    let hexControlCards = 0;
    
    for (const card of cards) {
        // Force-heavy: primarily red cards or high force values
        if (card.kind === 'red' || (card.f > 0 && card.f >= card.e * 2)) {
            forceCards++;
        }
        
        // Escape-heavy: primarily blue cards or high escape values  
        if (card.kind === 'blue' || (card.e > 0 && card.e >= card.f * 2)) {
            escapeCards++;
        }
        
        // Gold utility: gold cards or utility effects
        if (card.kind === 'gold' || card.effect) {
            goldUtilityCards++;
        }
        
        // Hex control: purple cards or cards that interact with dice/control
        if (card.kind === 'purple' || card.keywords?.includes('convert')) {
            hexControlCards++;
        }
    }
    
    const forceRatio = forceCards / total;
    const escapeRatio = escapeCards / total;
    const goldRatio = goldUtilityCards / total;
    const hexRatio = hexControlCards / total;
    
    // Determine focus based on dominant archetype (>40% threshold)
    if (forceRatio > 0.4) return 'force-heavy';
    if (escapeRatio > 0.4) return 'escape-heavy';
    if (goldRatio > 0.4) return 'gold-utility';
    if (hexRatio > 0.4) return 'hex-control';
    
    return 'mixed';
}

/**
 * Calculate deck scar metrics from CRACK and dead-weight cards.
 */
export function calculateDeckScars(cardIds: string[]): HazardDeckScars {
    const total = cardIds.length;
    const crackCount = cardIds.filter(id => id === 'crack').length;
    
    return {
        crackCount,
        totalCards: total,
        scarRatio: total > 0 ? crackCount / total : 0,
    };
}

// ---------------------------------------------------------------------------
// Three-Choice Reward Generation
// ---------------------------------------------------------------------------

/**
 * Generate a three-choice reward offer based on deck focus (Phase 149 doctrine).
 * - Slot A: obvious benefit to current deck focus
 * - Slot B: stronger temptation outside current deck focus  
 * - Slot C: remove-card option
 */
export function generateRewardOffer(
    deckCardIds: string[],
    rngState: HazardRngState,
    availableRewards: HazardCardDef[] = HAZARD_REWARD_CARDS
): HazardRewardOffer {
    const focus = classifyDeckFocus(deckCardIds);
    
    // Filter rewards by focus alignment
    const focusAligned = availableRewards.filter(card => isCardAlignedWithFocus(card, focus));
    const offFocus = availableRewards.filter(card => !isCardAlignedWithFocus(card, focus));
    
    // Slot A: obvious benefit (common/uncommon from focus-aligned pool)
    const focusCandidates = focusAligned.filter(card => card.rarity !== 'rare');
    const focusShuffled = shuffle(rngState, focusCandidates);
    const focusBenefit = focusShuffled.value[0] ?? availableRewards[0];
    
    // Slot B: stronger temptation (prefer rare/higher impact from off-focus)
    const temptationCandidates = offFocus.length > 0 ? offFocus : availableRewards;
    const rareCandidates = temptationCandidates.filter(card => card.rarity === 'rare');
    const strongCandidates = rareCandidates.length > 0 ? rareCandidates : temptationCandidates;
    const temptationShuffled = shuffle(focusShuffled.state, strongCandidates);
    const offFocusTemptation = temptationShuffled.value[0] ?? availableRewards[1];
    
    // Slot C: remove-card option (available if deck has >5 cards)
    const removeCardOption = {
        available: deckCardIds.length > 5,
        eligibleCardIds: deckCardIds.filter(id => id !== 'crack'), // Can't remove base mechanics
    };
    
    return {
        focusBenefit,
        offFocusTemptation,
        removeCardOption,
    };
}

/**
 * Check if a reward card aligns with the given deck focus.
 */
function isCardAlignedWithFocus(card: HazardCardDef, focus: HazardDeckFocus): boolean {
    switch (focus) {
        case 'force-heavy':
            return card.kind === 'red' || (card.f > 0 && card.f >= (card.e || 0) * 2);
        case 'escape-heavy':
            return card.kind === 'blue' || (card.e > 0 && card.e >= (card.f || 0) * 2);
        case 'gold-utility':
            return card.kind === 'gold' || !!card.effect;
        case 'hex-control':
            return card.kind === 'purple' || card.keywords?.includes('convert');
        case 'scarred':
            return card.effect === 'mend' || card.keywords?.includes('purge'); // Healing/cleansing effects
        case 'mixed':
            return true; // All cards align with mixed focus
    }
}

// ---------------------------------------------------------------------------
// Sub-quest Drafting
// ---------------------------------------------------------------------------

/**
 * Generate 2-3 candidate sub-quests for player choice before route selection.
 * Preserves deterministic seeding while offering strategic choice.
 */
export function generateSubquestDraft(
    availableSubquests: readonly HazardSubquestDef[],
    rngState: HazardRngState,
    count: number = 3
): HazardSubquestDraft {
    const shuffled = shuffle(rngState, availableSubquests);
    const candidates = shuffled.value.slice(0, Math.min(count, availableSubquests.length));
    
    return {
        candidates,
        chosen: null,
    };
}

/**
 * Select a sub-quest from the draft candidates.
 */
export function chooseSubquest(
    draft: HazardSubquestDraft,
    chosenId: string
): HazardSubquestDraft {
    const chosen = draft.candidates.find(sq => sq.id === chosenId) ?? null;
    
    return {
        ...draft,
        chosen,
    };
}

// ---------------------------------------------------------------------------
// Deck Identity Summary
// ---------------------------------------------------------------------------

/**
 * Generate a comprehensive deck identity summary for post-Hazard reporting.
 */
export function generateDeckIdentity(cardIds: string[]): HazardDeckIdentity {
    if (cardIds.length === 0) {
        return {
            focus: 'mixed',
            scars: { crackCount: 0, totalCards: 0, scarRatio: 0 },
            cardCount: 0,
            dominantColors: [],
            utilityRatio: 0,
        };
    }
    
    const cards = cardIds.map(getHazardCardDef);
    const focus = classifyDeckFocus(cardIds);
    const scars = calculateDeckScars(cardIds);
    
    // Analyze color distribution
    const colorCounts: Record<HazardColor, number> = {
        red: 0,
        blue: 0,
        purple: 0,
        gold: 0,
    };
    
    let utilityCount = 0;
    
    for (const card of cards) {
        if (card.kind) {
            colorCounts[card.kind]++;
        }
        if (card.effect) {
            utilityCount++;
        }
    }
    
    // Determine dominant colors (>20% representation)
    const dominantColors = (Object.keys(colorCounts) as HazardColor[])
        .filter(color => colorCounts[color] / cards.length > 0.2)
        .sort((a, b) => colorCounts[b] - colorCounts[a]);
    
    const utilityRatio = utilityCount / cards.length;
    
    return {
        focus,
        scars,
        cardCount: cards.length,
        dominantColors,
        utilityRatio,
    };
}

// ---------------------------------------------------------------------------
// Deck Editing (Remove Card)
// ---------------------------------------------------------------------------

/**
 * Remove a card from the persistent Hazard deck.
 * Used for the remove-card reward option (Slot C).
 */
export function removeCardFromDeck(
    currentCardIds: string[],
    cardIdToRemove: string
): string[] {
    const index = currentCardIds.indexOf(cardIdToRemove);
    if (index === -1) return currentCardIds; // Card not found
    
    // Remove first occurrence only
    return [
        ...currentCardIds.slice(0, index),
        ...currentCardIds.slice(index + 1)
    ];
}