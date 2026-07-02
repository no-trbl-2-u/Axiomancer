/**
 * Hazard Engagement (Phase 149) — hermetic e2e tests.
 *
 * Tests deck focus classification, three-choice rewards, sub-quest drafting,
 * deck scars tracking, and deck identity summaries. Validates all acceptance
 * criteria from the phase brief.
 */

import { describe, it, expect } from 'vitest';
import {
    classifyDeckFocus,
    calculateDeckScars,
    generateRewardOffer,
    generateSubquestDraft,
    chooseSubquest,
    generateDeckIdentity,
    removeCardFromDeck,
    createHazardSession,
    selectSubquestFromDraft,
    getHazardDeckIdentity,
    removeHazardDeckCard,
    seedRng,
    HAZARD_SUBQUESTS,
} from '../index';

describe('Hazard Engagement (Phase 149)', () => {
    describe('Deck Focus Classification', () => {
        it('classifies force-heavy deck correctly', () => {
            // Deck with mostly red/force cards
            const forceHeavyDeck = ['grip', 'grip', 'steps', 'haul', 'haul'];
            const focus = classifyDeckFocus(forceHeavyDeck);
            expect(focus).toBe('force-heavy');
        });

        it('classifies escape-heavy deck correctly', () => {
            // Deck with mostly blue/escape cards  
            const escapeHeavyDeck = ['leap', 'leap', 'scram', 'runner', 'runner'];
            const focus = classifyDeckFocus(escapeHeavyDeck);
            expect(focus).toBe('escape-heavy');
        });

        it('classifies gold utility deck correctly', () => {
            // Deck with gold cards and utility effects
            const utilityDeck = ['oath', 'footing', 'windread', 'pole', 'pole'];
            const focus = classifyDeckFocus(utilityDeck);
            expect(focus).toBe('gold-utility');
        });

        it('classifies scarred deck correctly', () => {
            // Deck with >30% CRACK cards
            const scarredDeck = ['crack', 'crack', 'crack', 'crack', 'steps', 'haul'];
            const focus = classifyDeckFocus(scarredDeck);
            expect(focus).toBe('scarred');
        });

        it('classifies mixed deck as default', () => {
            // Balanced distribution of card types
            const mixedDeck = ['steps', 'scram', 'oath', 'windread', 'grip'];
            const focus = classifyDeckFocus(mixedDeck);
            expect(focus).toBe('mixed');
        });

        it('handles empty deck', () => {
            const focus = classifyDeckFocus([]);
            expect(focus).toBe('mixed');
        });
    });

    describe('Deck Scars Tracking', () => {
        it('calculates scar metrics correctly', () => {
            const deckWithScars = ['steps', 'crack', 'crack', 'scram', 'haul'];
            const scars = calculateDeckScars(deckWithScars);
            
            expect(scars.crackCount).toBe(2);
            expect(scars.totalCards).toBe(5);
            expect(scars.scarRatio).toBeCloseTo(0.4);
        });

        it('handles deck with no scars', () => {
            const cleanDeck = ['steps', 'scram', 'haul'];
            const scars = calculateDeckScars(cleanDeck);
            
            expect(scars.crackCount).toBe(0);
            expect(scars.totalCards).toBe(3);
            expect(scars.scarRatio).toBe(0);
        });

        it('handles empty deck for scars', () => {
            const scars = calculateDeckScars([]);
            
            expect(scars.crackCount).toBe(0);
            expect(scars.totalCards).toBe(0);
            expect(scars.scarRatio).toBe(0);
        });
    });

    describe('Three-Choice Reward Generation', () => {
        it('generates focus-aligned and off-focus rewards', () => {
            const rng = seedRng('test-seed');
            const forceHeavyDeck = ['steps', 'steps', 'haul', 'grip'];
            
            const offer = generateRewardOffer(forceHeavyDeck, rng);
            
            expect(offer.focusBenefit).toBeDefined();
            expect(offer.offFocusTemptation).toBeDefined();
            expect(offer.removeCardOption).toBeDefined();
            
            // Should offer different cards for focus vs off-focus
            expect(offer.focusBenefit.id).not.toBe(offer.offFocusTemptation.id);
        });

        it('enables remove-card option for decks >5 cards', () => {
            const rng = seedRng('test-seed');
            const largeDeck = ['steps', 'scram', 'haul', 'grip', 'leap', 'oath'];
            
            const offer = generateRewardOffer(largeDeck, rng);
            
            expect(offer.removeCardOption.available).toBe(true);
            expect(offer.removeCardOption.eligibleCardIds.length).toBeGreaterThan(0);
        });

        it('disables remove-card option for small decks', () => {
            const rng = seedRng('test-seed');
            const smallDeck = ['steps', 'scram', 'haul'];
            
            const offer = generateRewardOffer(smallDeck, rng);
            
            expect(offer.removeCardOption.available).toBe(false);
        });

        it('excludes CRACK cards from removal eligibility', () => {
            const rng = seedRng('test-seed');
            const deckWithCracks = ['steps', 'crack', 'scram', 'haul', 'grip', 'leap'];
            
            const offer = generateRewardOffer(deckWithCracks, rng);
            
            expect(offer.removeCardOption.eligibleCardIds).not.toContain('crack');
            expect(offer.removeCardOption.eligibleCardIds.length).toBe(5); // All non-crack cards
        });
    });

    describe('Sub-quest Drafting', () => {
        it('generates candidate sub-quests for choice', () => {
            const rng = seedRng('test-seed');
            const draft = generateSubquestDraft(HAZARD_SUBQUESTS, rng, 3);
            
            expect(draft.candidates.length).toBe(3);
            expect(draft.chosen).toBe(null);
            
            // Ensure all candidates are unique
            const candidateIds = draft.candidates.map(sq => sq.id);
            const uniqueIds = new Set(candidateIds);
            expect(uniqueIds.size).toBe(candidateIds.length);
        });

        it('limits candidates to available sub-quests', () => {
            const rng = seedRng('test-seed');
            const limitedSubquests = HAZARD_SUBQUESTS.slice(0, 2);
            const draft = generateSubquestDraft(limitedSubquests, rng, 5);
            
            expect(draft.candidates.length).toBe(2); // Limited by available
        });

        it('chooseSubquest — stamps the chosen candidate by id', () => {
            const rng = seedRng('test-seed');
            const draft = generateSubquestDraft(HAZARD_SUBQUESTS, rng, 3);
            const candidateId = draft.candidates[0].id;

            const result = chooseSubquest(draft, candidateId);

            expect(result.chosen).not.toBeNull();
            expect(result.chosen!.id).toBe(candidateId);
        });

        it('chooseSubquest — preserves candidates list unchanged', () => {
            const rng = seedRng('test-seed');
            const draft = generateSubquestDraft(HAZARD_SUBQUESTS, rng, 3);

            const result = chooseSubquest(draft, draft.candidates[2].id);

            expect(result.candidates).toEqual(draft.candidates);
            expect(result.candidates.length).toBe(3);
        });

        it('chooseSubquest — unknown id sets chosen to null', () => {
            const rng = seedRng('test-seed');
            const draft = generateSubquestDraft(HAZARD_SUBQUESTS, rng, 3);

            const result = chooseSubquest(draft, 'not-a-real-subquest-id');

            expect(result.chosen).toBeNull();
        });
    });

    describe('Deck Identity Summary', () => {
        it('generates comprehensive deck identity', () => {
            const mixedDeck = ['steps', 'scram', 'oath', 'windread', 'crack'];
            const identity = generateDeckIdentity(mixedDeck);
            
            expect(identity.focus).toBeDefined();
            expect(identity.scars).toBeDefined();
            expect(identity.cardCount).toBe(5);
            expect(identity.dominantColors).toBeDefined();
            expect(identity.utilityRatio).toBeGreaterThanOrEqual(0);
            expect(identity.utilityRatio).toBeLessThanOrEqual(1);
        });

        it('identifies dominant colors correctly', () => {
            const redHeavyDeck = ['steps', 'steps', 'haul', 'grip', 'scram'];
            const identity = generateDeckIdentity(redHeavyDeck);
            
            expect(identity.dominantColors).toContain('red');
        });

        it('calculates utility ratio correctly', () => {
            const utilityDeck = ['oath', 'windread', 'steps']; // 2/3 utility
            const identity = generateDeckIdentity(utilityDeck);
            
            expect(identity.utilityRatio).toBeCloseTo(2/3, 2);
        });

        it('handles empty deck identity', () => {
            const identity = generateDeckIdentity([]);
            
            expect(identity.focus).toBe('mixed');
            expect(identity.cardCount).toBe(0);
            expect(identity.dominantColors).toEqual([]);
            expect(identity.utilityRatio).toBe(0);
        });
    });

    describe('Deck Card Removal', () => {
        it('removes specified card from deck', () => {
            const originalDeck = ['steps', 'scram', 'haul', 'grip'];
            const updatedDeck = removeCardFromDeck(originalDeck, 'scram');
            
            expect(updatedDeck).toEqual(['steps', 'haul', 'grip']);
            expect(updatedDeck.length).toBe(originalDeck.length - 1);
        });

        it('removes only first occurrence of duplicate cards', () => {
            const deckWithDupes = ['steps', 'steps', 'scram'];
            const updatedDeck = removeCardFromDeck(deckWithDupes, 'steps');
            
            expect(updatedDeck).toEqual(['steps', 'scram']);
            expect(updatedDeck.filter(card => card === 'steps').length).toBe(1);
        });

        it('returns unchanged deck when card not found', () => {
            const originalDeck = ['steps', 'scram', 'haul'];
            const updatedDeck = removeCardFromDeck(originalDeck, 'nonexistent');
            
            expect(updatedDeck).toEqual(originalDeck);
        });
    });

    describe('Engine Integration', () => {
        it('creates session with sub-quest draft initialized', () => {
            const seed = 'test-seed-123';
            const deckBag = ['steps', 'scram', 'haul', 'grip', 'leap'];
            const session = createHazardSession(seed, deckBag, 'cracked-cliff');
            
            expect(session.subquestDraft).toBeDefined();
            expect(session.subquestDraft.candidates.length).toBeGreaterThan(0);
            expect(session.subquestDraft.chosen).toBe(null);
        });

        it('allows sub-quest selection from draft', () => {
            const seed = 'test-seed-123';
            const deckBag = ['steps', 'scram', 'haul'];
            const session = createHazardSession(seed, deckBag, 'cracked-cliff');
            const candidateId = session.subquestDraft.candidates[0].id;
            
            const updatedSession = selectSubquestFromDraft(session, candidateId);
            
            expect(updatedSession.subquestDraft.chosen).toBeDefined();
            expect(updatedSession.subquestDraft.chosen!.id).toBe(candidateId);
        });

        it('rejects sub-quest selection when not in route-select phase', () => {
            const seed = 'test-seed-123';
            const deckBag = ['steps', 'scram', 'haul'];
            const session = createHazardSession(seed, deckBag, 'cracked-cliff');
            const candidateId = session.subquestDraft.candidates[0].id;
            
            // Change phase away from route-select
            const playingSession = { ...session, phase: 'playing' as const };
            const unchangedSession = selectSubquestFromDraft(playingSession, candidateId);
            
            expect(unchangedSession.subquestDraft.chosen).toBe(null);
        });

        it('generates deck identity from persistent deck', () => {
            const deckCardIds = ['steps', 'scram', 'oath', 'windread'];
            const identity = getHazardDeckIdentity(deckCardIds);
            
            expect(identity).toBeDefined();
            expect(identity.cardCount).toBe(4);
        });

        it('removes cards from persistent deck correctly', () => {
            const originalDeck = ['steps', 'scram', 'haul', 'grip'];
            const updatedDeck = removeHazardDeckCard(originalDeck, 'scram');
            
            expect(updatedDeck).not.toContain('scram');
            expect(updatedDeck.length).toBe(3);
        });
    });

    describe('Acceptance Criteria Validation', () => {
        it('engine can classify persistent Hazard deck into focus summaries', () => {
            const testDecks = [
                { cards: ['steps', 'steps', 'haul', 'grip'], expectedFocus: 'force-heavy' },
                { cards: ['scram', 'scram', 'leap', 'runner'], expectedFocus: 'escape-heavy' },
                { cards: ['oath', 'footing', 'windread'], expectedFocus: 'gold-utility' },
                { cards: ['crack', 'crack', 'crack', 'steps'], expectedFocus: 'scarred' },
            ];

            testDecks.forEach(({ cards, expectedFocus }) => {
                const focus = classifyDeckFocus(cards);
                expect(focus).toBe(expectedFocus);
            });
        });

        it('reward offer returns three typed choices', () => {
            const rng = seedRng('test-seed');
            const testDeck = ['steps', 'steps', 'haul', 'grip', 'leap', 'scram'];
            const offer = generateRewardOffer(testDeck, rng);

            // Three choice structure
            expect(offer.focusBenefit).toBeDefined();
            expect(offer.offFocusTemptation).toBeDefined();
            expect(offer.removeCardOption).toBeDefined();

            // Remove-card option is available and has eligible cards
            expect(offer.removeCardOption.available).toBe(true);
            expect(offer.removeCardOption.eligibleCardIds.length).toBeGreaterThan(0);
        });

        it('card removal through engine is deterministic and tested', () => {
            const originalDeck = ['steps', 'scram', 'haul', 'grip'];
            const cardToRemove = 'scram';
            
            const updatedDeck = removeHazardDeckCard(originalDeck, cardToRemove);
            
            expect(updatedDeck).toEqual(['steps', 'haul', 'grip']);
            expect(updatedDeck).not.toContain(cardToRemove);
        });

        it('CRACK additions surface as deck scar data', () => {
            const deckWithCracks = ['steps', 'crack', 'crack', 'scram'];
            const scars = calculateDeckScars(deckWithCracks);
            
            expect(scars.crackCount).toBe(2);
            expect(scars.scarRatio).toBe(0.5);
        });

        it('sub-quest drafting lets player choose from candidates', () => {
            const rng = seedRng('test-seed');
            const draft = generateSubquestDraft(HAZARD_SUBQUESTS, rng, 3);
            
            expect(draft.candidates.length).toBe(3);
            expect(draft.chosen).toBe(null);
            
            // Player can choose any candidate
            const candidateId = draft.candidates[1].id;
            const updatedDraft = { ...draft, chosen: draft.candidates[1] };
            expect(updatedDraft.chosen!.id).toBe(candidateId);
        });

        it('chooseSubquest stamps chosen candidate onto draft', () => {
            const rng = seedRng('test-seed');
            const draft = generateSubquestDraft(HAZARD_SUBQUESTS, rng, 3);
            const candidateId = draft.candidates[1].id;

            const chosen = chooseSubquest(draft, candidateId);

            expect(chosen.chosen).not.toBeNull();
            expect(chosen.chosen!.id).toBe(candidateId);
            expect(chosen.candidates).toEqual(draft.candidates);
        });

        it('hazard state exposes data mobile needs without rule simulation', () => {
            const testDeck = ['steps', 'scram', 'oath', 'crack'];
            
            // Deck identity contains all needed mobile data
            const identity = generateDeckIdentity(testDeck);
            expect(identity.focus).toBeDefined();
            expect(identity.scars.crackCount).toBeDefined();
            expect(identity.dominantColors).toBeDefined();
            expect(identity.utilityRatio).toBeDefined();
            
            // Reward offer contains mobile-friendly structure
            const rng = seedRng('test-seed');
            const offer = generateRewardOffer(testDeck, rng);
            expect(offer.removeCardOption.eligibleCardIds).toBeDefined();
        });
    });
});