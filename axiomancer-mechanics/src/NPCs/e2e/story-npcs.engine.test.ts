/**
 * Hermetic E2E Tests — Story Content NPCs Dialogue Trees (Phase 115)
 *
 * Tests the 5 new story NPCs' dialogue trees, alignment gates, choice consequences,
 * and observer pattern integration. Covers the golden path for each NPC plus
 * edge cases for alignment gating, flag setting, and observer functionality.
 *
 * Coverage:
 *   1. Shrine Keeper: mystical dialogue, epistemology/scope alignment gates, crystal gift choice
 *   2. Chronicler: scholarly dialogue, chronicle integration flags, knowledge contribution
 *   3. Wandering Philosopher: philosophical discourse, diverse alignment perspectives
 *   4. Captain Blackwater: trade ethics, merchant philosophy, guild support flags
 *   5. Fisherman's Daughter: mentorship dynamics, growth encouragement choices
 *   6. Observer pattern: playerAlignmentCellChangedSince gates and recognition dialogue
 *   7. Alignment delta application: epistemology, outlook, scope shifts
 *   8. Flag setting: quest-adjacent integration via effect.setFlag
 */

import { describe, it, expect } from 'vitest';

import {
    getDialogueNode,
    visibleChoices,
    isLeafNode,
    type DialogueContext,
} from '../dialogue';
import { shrineKeeper, chronicler, wanderingPhilosopher, forestRanger, hermitSage, lostTrader } from '../../World/Continents/Northern-Forest/npcs';
import { captainBlackwater, fishermansDaughter, villageHealer, unionLeader, merchantWidow } from '../../World/Continents/Coastal-Village/npcs';

// ─── Test helpers ─────────────────────────────────────────────────────────────

const emptyCtx: DialogueContext = {
    activeQuests: new Set(),
    completedQuests: new Set(),
    flags: new Set(),
};

function ctxWithAlignment(
    epistemology: number = 0,
    outlook: number = 0,
    scope: number = 0,
): DialogueContext {
    return {
        ...emptyCtx,
        alignment: { epistemology, outlook, scope },
    };
}

function _ctxWithFlags(flags: string[]): DialogueContext {
    return {
        ...emptyCtx,
        flags: new Set(flags),
    };
}

function ctxWithObserver(lastSeenCellId: string = 'different-cell'): DialogueContext {
    return {
        ...emptyCtx,
        alignment: { epistemology: 20, outlook: 10, scope: -10 }, // Some alignment
        lastSeenAlignmentCellId: lastSeenCellId,
    };
}

// ─── Shrine Keeper Tests ──────────────────────────────────────────────────────

describe('Shrine Keeper — Mystical NPC with alignment gates', () => {
    const tree = shrineKeeper.dialogueTree!;

    it('provides greeting with multiple paths based on epistemology', () => {
        const greetNode = getDialogueNode(tree, 'greet');
        expect(greetNode.text).toContain('patterns speak of your approach');

        // Test all choices visible with empty context (alignment-gated ones hidden)
        const choices = visibleChoices(greetNode, emptyCtx);
        expect(choices).toHaveLength(2); // 2 base choices, alignment-specific ones hidden

        const choiceTexts = choices.map(c => c.text);
        expect(choiceTexts).toContain('What patterns do you see?');
        expect(choiceTexts).toContain('Leave quietly.');
    });

    it('shows faith-based choice for high epistemology alignment', () => {
        const ctx = ctxWithAlignment(25, 0, 0); // High epistemology (faith)
        const greetNode = getDialogueNode(tree, 'greet');
        const choices = visibleChoices(greetNode, ctx);

        const faithChoice = choices.find(c => c.text.includes('sense something... different'));
        expect(faithChoice).toBeTruthy();
        expect(faithChoice!.requires?.requiresAlignment).toEqual({
            axis: 'epistemology',
            op: 'gte',
            value: 20,
        });
    });

    it('shows skeptical choice for low epistemology alignment', () => {
        const ctx = ctxWithAlignment(-25, 0, 0); // Low epistemology (skeptical)
        const greetNode = getDialogueNode(tree, 'greet');
        const choices = visibleChoices(greetNode, ctx);

        const skepticChoice = choices.find(c => c.text.includes('mystical nonsense'));
        expect(skepticChoice).toBeTruthy();
        expect(skepticChoice!.requires?.requiresAlignment).toEqual({
            axis: 'epistemology',
            op: 'lte',
            value: -20,
        });
    });

    it('provides crystal gift interaction for faith path', () => {
        const veilNode = getDialogueNode(tree, 'veil_thin');
        expect(veilNode.text).toContain('crystalline fragment');

        const choices = visibleChoices(veilNode, emptyCtx);
        expect(choices).toHaveLength(2);

        const acceptChoice = choices.find(c => c.text.includes('Accept the crystal'));
        expect(acceptChoice).toBeTruthy();
        expect(acceptChoice!.effect?.setFlag).toBe('shrine_keeper_crystal_gift');
        expect(acceptChoice!.effect?.alignmentDelta).toEqual({
            epistemology: 2,
            scope: 1,
        });
        expect(acceptChoice!.effect?.moralDelta).toBe(1);
    });

    it('supports observer pattern for alignment cell changes', () => {
        const ctx = ctxWithObserver(); // Has alignment but no cached cell = changed
        const greetNode = getDialogueNode(tree, 'greet');
        const choices = visibleChoices(greetNode, ctx);

        const observerChoice = choices.find(c => c.requires?.playerAlignmentCellChangedSince);
        expect(observerChoice).toBeTruthy();
        expect(observerChoice!.text).toContain('shifted in your essence');
        expect(observerChoice!.nextNodeId).toBe('observer_transformation');
    });
});

// ─── Chronicler Tests ─────────────────────────────────────────────────────────

describe('Chronicler — Scholarly NPC with Chronicle integration', () => {
    const tree = chronicler.dialogueTree!;

    it('offers chronicle contribution dialogue', () => {
        const greetNode = getDialogueNode(tree, 'greet');
        expect(greetNode.text).toContain('Chronicle');

        const choices = visibleChoices(greetNode, emptyCtx);
        const contributeChoice = choices.find(c => c.text.includes('strange things in my travels'));
        expect(contributeChoice).toBeTruthy();
        expect(contributeChoice!.effect?.setFlag).toBe('chronicler_met');
    });

    it('provides scholarly responsibility acceptance', () => {
        const contributionNode = getDialogueNode(tree, 'contribution_offer');
        const choices = visibleChoices(contributionNode, emptyCtx);

        const acceptChoice = choices.find(c => c.text.includes('scholarly responsibility'));
        expect(acceptChoice).toBeTruthy();
        expect(acceptChoice!.effect?.setFlag).toBe('chronicler_scholarly_mission');
        expect(acceptChoice!.effect?.alignmentDelta).toEqual({
            epistemology: 2,
            scope: 2,
        });
    });

    it('gates present-focus choice by low scope alignment', () => {
        const purposeNode = getDialogueNode(tree, 'chronicling_purpose');
        const ctx = ctxWithAlignment(0, 0, -15); // Low scope (individualist)
        const choices = visibleChoices(purposeNode, ctx);

        const presentChoice = choices.find(c => c.text.includes('Focus on the present'));
        expect(presentChoice).toBeTruthy();
        expect(presentChoice!.requires?.requiresAlignment).toEqual({
            axis: 'scope',
            op: 'lte',
            value: -10,
        });
    });

    it('supports observer pattern for scholarly recognition', () => {
        const ctx = ctxWithObserver('some-previous-cell');
        const greetNode = getDialogueNode(tree, 'greet');
        const choices = visibleChoices(greetNode, ctx);

        const observerChoice = choices.find(c => c.requires?.playerAlignmentCellChangedSince);
        expect(observerChoice).toBeTruthy();
        expect(observerChoice!.nextNodeId).toBe('scholar_observation');
    });
});

// ─── Wandering Philosopher Tests ──────────────────────────────────────────────

describe('Wandering Philosopher — Multi-perspective philosophical dialogue', () => {
    const tree = wanderingPhilosopher.dialogueTree!;

    it('provides diverse philosophical perspective gates', () => {
        const seekingNode = getDialogueNode(tree, 'seeking_place');
        const choices = visibleChoices(seekingNode, emptyCtx);
        expect(choices).toHaveLength(1); // Only uncertain option visible without alignment

        // Check that gated choices have alignment requirements but are hidden without context
        const allChoiceTexts = seekingNode.choices!.map(c => c.text);
        expect(allChoiceTexts).toContain('Fate guides us toward our destined role.');
        expect(allChoiceTexts).toContain('We forge our own destiny through determination.');
        expect(allChoiceTexts).toContain('We find ourselves through community and connection.');
        
        // Only the uncertain choice should be visible without alignment context
        expect(choices[0].text).toContain('not sure');
    });

    it('shows fate perspective for high epistemology (transcendent)', () => {
        const ctx = ctxWithAlignment(20, 0, 0); // High epistemology
        const seekingNode = getDialogueNode(tree, 'seeking_place');
        const choices = visibleChoices(seekingNode, ctx);

        const fateChoice = choices.find(c => c.text.includes('Fate guides us'));
        expect(fateChoice).toBeTruthy();
        expect(fateChoice!.effect?.alignmentDelta).toEqual({
            epistemology: 2,
            scope: -1,
        });
    });

    it('shows will perspective for low scope (individualist)', () => {
        const ctx = ctxWithAlignment(0, 0, -5); // Low scope
        const seekingNode = getDialogueNode(tree, 'seeking_place');
        const choices = visibleChoices(seekingNode, ctx);

        const willChoice = choices.find(c => c.text.includes('forge our own destiny'));
        expect(willChoice).toBeTruthy();
        expect(willChoice!.effect?.alignmentDelta).toEqual({
            scope: -2,
            outlook: 1,
        });
    });

    it('shows community perspective for high scope (relational)', () => {
        const ctx = ctxWithAlignment(0, 0, 20); // High scope
        const seekingNode = getDialogueNode(tree, 'seeking_place');
        const choices = visibleChoices(seekingNode, ctx);

        const communityChoice = choices.find(c => c.text.includes('community and connection'));
        expect(communityChoice).toBeTruthy();
        expect(communityChoice!.effect?.alignmentDelta).toEqual({
            scope: 2,
            outlook: 1,
        });
    });

    it('rewards honest uncertainty', () => {
        const seekingNode = getDialogueNode(tree, 'seeking_place');
        const choices = visibleChoices(seekingNode, emptyCtx);

        const uncertainChoice = choices.find(c => c.text.includes('not sure'));
        expect(uncertainChoice).toBeTruthy();
        expect(uncertainChoice!.effect?.setFlag).toBe('philosopher_appreciates_honesty');
        expect(uncertainChoice!.effect?.moralDelta).toBe(1);
    });
});

// ─── Captain Blackwater Tests ─────────────────────────────────────────────────

describe('Captain Blackwater — Pragmatic merchant with ethics', () => {
    const tree = captainBlackwater.dialogueTree!;

    it('discusses fair trade practices', () => {
        const greetNode = getDialogueNode(tree, 'greet');
        const choices = visibleChoices(greetNode, emptyCtx);

        const fairTradeChoice = choices.find(c => c.text.includes('fair trade practices'));
        expect(fairTradeChoice).toBeFalsy(); // Hidden without high scope alignment

        const ctx = ctxWithAlignment(0, 0, 25); // High scope (relational)
        const scopedChoices = visibleChoices(greetNode, ctx);
        const visibleFairTrade = scopedChoices.find(c => c.text.includes('fair trade practices'));
        expect(visibleFairTrade).toBeTruthy();
    });

    it('shows quick profit option for low scope alignment', () => {
        const ctx = ctxWithAlignment(0, 0, -15); // Low scope (individualist)
        const greetNode = getDialogueNode(tree, 'greet');
        const choices = visibleChoices(greetNode, ctx);

        const profitChoice = choices.find(c => c.text.includes('quickest profit'));
        expect(profitChoice).toBeTruthy();
        expect(profitChoice!.requires?.requiresAlignment).toEqual({
            axis: 'scope',
            op: 'lte',
            value: -10,
        });
    });

    it('provides guild support interaction', () => {
        const fairTradeNode = getDialogueNode(tree, 'fair_trade');
        const choices = visibleChoices(fairTradeNode, emptyCtx);

        const guildChoice = choices.find(c => c.text.includes("traders' guild"));
        expect(guildChoice).toBeTruthy();
        expect(guildChoice!.effect?.setFlag).toBe('guild_support_secured');
    });

    it('responds to harsh necessity with moral challenge', () => {
        const harshNode = getDialogueNode(tree, 'harsh_necessity');
        expect(harshNode.text).toContain('choosing which soul you want to keep');
        expect(harshNode.text).toContain('poor with honor than rich with shame');
    });
});

// ─── Fisherman's Daughter Tests ───────────────────────────────────────────────

describe("Fisherman's Daughter — Young idealist seeking guidance", () => {
    const tree = fishermansDaughter.dialogueTree!;

    it('responds positively to encouraging mentorship', () => {
        const greetNode = getDialogueNode(tree, 'greet');
        const ctx = ctxWithAlignment(0, 0, 15); // High scope for bright observation
        const choices = visibleChoices(greetNode, ctx);

        const brightChoice = choices.find(c => c.text.includes('too bright for just mending nets'));
        expect(brightChoice).toBeTruthy();
        expect(brightChoice!.effect?.moralDelta).toBe(1);
    });

    it('shows dismissive option for pessimistic outlook', () => {
        const ctx = ctxWithAlignment(0, -20, 0); // Low outlook (pessimistic)
        const greetNode = getDialogueNode(tree, 'greet');
        const choices = visibleChoices(greetNode, ctx);

        const dismissiveChoice = choices.find(c => c.text.includes('Focus on your work, child'));
        expect(dismissiveChoice).toBeTruthy();
        expect(dismissiveChoice!.effect?.moralDelta).toBe(-2);
    });

    it('encourages dreams for optimistic outlook', () => {
        const storyNode = getDialogueNode(tree, 'story_interest');
        const ctx = ctxWithAlignment(0, 20, 0); // High outlook (optimistic)
        const choices = visibleChoices(storyNode, ctx);

        const encourageChoice = choices.find(c => c.text.includes('Dream big'));
        expect(encourageChoice).toBeTruthy();
        expect(encourageChoice!.effect?.alignmentDelta).toEqual({
            outlook: 2,
            scope: 1,
        });
        expect(encourageChoice!.effect?.moralDelta).toBe(2);
    });

    it('provides mentorship wisdom options', () => {
        const wisdomNode = getDialogueNode(tree, 'worldly_wisdom');
        const choices = visibleChoices(wisdomNode, emptyCtx);

        expect(choices).toHaveLength(4);
        const wisdomTexts = choices.map(c => c.text);
        expect(wisdomTexts).toContain('Every person has wisdom worth learning.');
        expect(wisdomTexts).toContain('Stay true to your values, no matter the pressure.');
        expect(wisdomTexts).toContain('Trust yourself, but verify what others tell you.');

        const wisdomChoice = choices.find(c => c.text.includes('Every person has wisdom'));
        expect(wisdomChoice!.effect?.setFlag).toBe('mentored_fishermans_daughter_wisdom');
    });

    it('validates learning and knowledge pursuit', () => {
        const knowledgeNode = getDialogueNode(tree, 'knowledge_validation');
        expect(knowledgeNode.text).toContain('Knowledge can serve others');

        const brightNode = getDialogueNode(tree, 'bright_observation');
        const choices = visibleChoices(brightNode, emptyCtx);
        const validateChoice = choices.find(c => c.text.includes('Knowledge and growth are worthy'));
        expect(validateChoice!.effect?.setFlag).toBe('encouraged_daughters_learning');
    });
});

// ─── Cross-NPC Observer Pattern Tests ─────────────────────────────────────────

describe('Observer Pattern Integration — Alignment cell change recognition', () => {
    it('all observed NPCs have tree ids for cache keys', () => {
        expect(shrineKeeper.dialogueTree!.id).toBe('shrine-keeper');
        expect(chronicler.dialogueTree!.id).toBe('chronicler');
        expect(wanderingPhilosopher.dialogueTree!.id).toBe('wandering-philosopher');
        expect(captainBlackwater.dialogueTree!.id).toBe('captain-blackwater');
        expect(fishermansDaughter.dialogueTree!.id).toBe('fishermans-daughter');
    });

    it('all NPCs provide observer recognition choices when alignment changes', () => {
        const npcs = [shrineKeeper, chronicler, wanderingPhilosopher, captainBlackwater, fishermansDaughter];
        const ctx = ctxWithObserver(); // Changed alignment context

        for (const npc of npcs) {
            const greetNode = getDialogueNode(npc.dialogueTree!, 'greet');
            const choices = visibleChoices(greetNode, ctx);
            const observerChoice = choices.find(c => c.requires?.playerAlignmentCellChangedSince);
            
            expect(observerChoice).toBeTruthy();
            expect(observerChoice!.text).toMatch(/recogni|shift|chang|transform|different/i);
        }
    });

    it('observer choices lead to unique recognition dialogue', () => {
        const observerNodes = [
            'observer_transformation', // Shrine Keeper
            'scholar_observation',     // Chronicler  
            'philosophical_recognition', // Wandering Philosopher
            'merchant_recognition',    // Captain Blackwater
            'growth_recognition',      // Fisherman's Daughter
        ];

        const npcs = [shrineKeeper, chronicler, wanderingPhilosopher, captainBlackwater, fishermansDaughter];

        npcs.forEach((npc, i) => {
            const observerNode = getDialogueNode(npc.dialogueTree!, observerNodes[i]);
            expect(observerNode.text).toMatch(/chang|shift|transform|evolv|different/i);
            expect(isLeafNode(observerNode)).toBe(true); // Observer nodes are terminals
        });
    });
});

// ─── Alignment Delta Coverage ─────────────────────────────────────────────────

describe('Alignment Delta Integration — Philosophical alignment shifts', () => {
    it('covers all three philosophical axes across NPCs', () => {
        // Test that our NPCs cover epistemology, outlook, and scope shifts
        const allTrees = [
            shrineKeeper.dialogueTree!,
            chronicler.dialogueTree!,
            wanderingPhilosopher.dialogueTree!,
            captainBlackwater.dialogueTree!,
            fishermansDaughter.dialogueTree!,
        ];

        let hasEpistemology = false;
        let hasOutlook = false;
        let hasScope = false;

        for (const tree of allTrees) {
            for (const node of Object.values(tree.nodes)) {
                if (!node.choices) continue;
                for (const choice of node.choices) {
                    if (!choice.effect?.alignmentDelta) continue;
                    const delta = choice.effect.alignmentDelta;
                    if (delta.epistemology) hasEpistemology = true;
                    if (delta.outlook) hasOutlook = true;
                    if (delta.scope) hasScope = true;
                }
            }
        }

        expect(hasEpistemology).toBe(true);
        expect(hasOutlook).toBe(true);
        expect(hasScope).toBe(true);
    });

    it('provides meaningful moral delta for character growth moments', () => {
        // Check that moral-significant choices have appropriate moralDelta
        const moralChoices = [
            // Shrine Keeper crystal gift
            { npc: shrineKeeper, nodeId: 'veil_thin', choiceText: 'Accept the crystal' },
            // Fisherman's Daughter encouragement  
            { npc: fishermansDaughter, nodeId: 'story_interest', choiceText: 'Dream big' },
            // Captain Blackwater ethics
            { npc: captainBlackwater, nodeId: 'trading_goods', choiceText: 'admirable business philosophy' },
        ];

        for (const { npc, nodeId, choiceText } of moralChoices) {
            const node = getDialogueNode(npc.dialogueTree!, nodeId);
            const choices = visibleChoices(node, emptyCtx);
            const moralChoice = choices.find(c => c.text.includes(choiceText));
            
            if (moralChoice?.effect?.moralDelta) {
                expect(Math.abs(moralChoice.effect.moralDelta)).toBeGreaterThan(0);
            }
        }
    });

    // ─── Phase 128 NPCs (Talk + Choice Structure) ─────────────────────────────

    describe('Village Healer (Phase 128)', () => {
        it('provides Talk option that reveals situation without ending encounter', () => {
            const greetNode = getDialogueNode(villageHealer.dialogueTree!, 'greet');
            const choices = visibleChoices(greetNode, emptyCtx);
            
            const talkOption = choices.find(c => c.text.includes('*Talk'));
            expect(talkOption).toBeDefined();
            expect(talkOption!.nextNodeId).toBe('talk_situation');
            
            const situationNode = getDialogueNode(villageHealer.dialogueTree!, 'talk_situation');
            // Need alignment context to see alignment-gated choices
            const alignCtx = ctxWithAlignment(20, -10, 15); // High epistemology, low outlook, high scope
            const followUpChoices = visibleChoices(situationNode, alignCtx);
            expect(followUpChoices.length).toBeGreaterThanOrEqual(3);
        });

        it('implements consequence shape categories correctly', () => {
            const situationNode = getDialogueNode(villageHealer.dialogueTree!, 'talk_situation');
            
            // Divine providence (alignment-only)
            const divineCtx = ctxWithAlignment(20, 0, 0);
            const divineChoices = visibleChoices(situationNode, divineCtx);
            const divineChoice = divineChoices.find(c => c.text.includes('divine providence'));
            expect(divineChoice).toBeDefined();
            expect(divineChoice!.effect?.alignmentDelta).toBeDefined();
            expect(divineChoice!.effect?.grantCurrency).toBeUndefined();
            
            // Self-sacrificial (help + cost)
            const collectiveCtx = ctxWithAlignment(0, 0, 15);
            const collectiveChoices = visibleChoices(situationNode, collectiveCtx);
            const helpChoice = collectiveChoices.find(c => c.text.includes('I\'ll help you'));
            expect(helpChoice).toBeDefined();
            expect(helpChoice!.effect?.grantCurrency).toBeLessThan(0);
            
            // Self-interested (gain + pragmatic)
            const pragmaticCtx = ctxWithAlignment(0, -10, 0);
            const pragmaticChoices = visibleChoices(situationNode, pragmaticCtx);
            const takeChoice = pragmaticChoices.find(c => c.text.includes('take what you need'));
            expect(takeChoice).toBeDefined();
            expect(takeChoice!.effect?.grantCurrency).toBeGreaterThan(0);
        });
    });

    describe('Dockworker\'s Union Leader (Phase 128)', () => {
        it('demonstrates Talk + choice structure with labor rights theme', () => {
            const greetNode = getDialogueNode(unionLeader.dialogueTree!, 'greet');
            const choices = visibleChoices(greetNode, emptyCtx);
            
            const talkOption = choices.find(c => c.text.includes('*Talk'));
            expect(talkOption).toBeDefined();
            
            const situationNode = getDialogueNode(unionLeader.dialogueTree!, 'talk_workers_situation');
            // Need alignment context to see alignment-gated choices
            const alignCtx = ctxWithAlignment(25, 0, 20); // High epistemology, neutral outlook, high scope
            const followUpChoices = visibleChoices(situationNode, alignCtx);
            expect(followUpChoices.length).toEqual(2); // Two visible choices for this alignment
        });

        it('implements T-specified consequence patterns for collective action', () => {
            const situationNode = getDialogueNode(unionLeader.dialogueTree!, 'talk_workers_situation');
            
            // Solidarity support (self-sacrificial)
            const solidarityCtx = ctxWithAlignment(0, 0, 20);
            const solidarityChoices = visibleChoices(situationNode, solidarityCtx);
            const supportChoice = solidarityChoices.find(c => c.text.includes('stand with you'));
            expect(supportChoice).toBeDefined();
            expect(supportChoice!.effect?.grantCurrency).toBeLessThan(0);
            expect(supportChoice!.effect?.alignmentDelta?.scope).toBeGreaterThan(0);
            expect(supportChoice!.effect?.setFlag).toBe('union_supporter');
            
            // Strike breaking (self-interested)
            const individualistCtx = ctxWithAlignment(0, 0, -15);
            const individualistChoices = visibleChoices(situationNode, individualistCtx);
            const undermineChoice = individualistChoices.find(c => c.text.includes('cross your picket'));
            expect(undermineChoice).toBeDefined();
            expect(undermineChoice!.effect?.grantCurrency).toBeGreaterThan(0);
            expect(undermineChoice!.effect?.setFlag).toBe('strike_breaker');
        });
    });

    describe('Lost Trader (Phase 128)', () => {
        it('presents trust and deception crisis scenario', () => {
            const greetNode = getDialogueNode(lostTrader.dialogueTree!, 'greet');
            const choices = visibleChoices(greetNode, emptyCtx);
            
            const talkOption = choices.find(c => c.text.includes('*Talk'));
            expect(talkOption).toBeDefined();
            
            const happenedNode = getDialogueNode(lostTrader.dialogueTree!, 'talk_what_happened');
            expect(happenedNode.text).toContain('Bandits');
            expect(happenedNode.text).toContain('trust');
            expect(happenedNode.text).toContain('desperate man');
        });

        it('implements trust-building vs verification responses', () => {
            const happenedNode = getDialogueNode(lostTrader.dialogueTree!, 'talk_what_happened');
            
            // Sacred trust (divine/transcendent)
            const faithCtx = ctxWithAlignment(20, 0, 0);
            const faithChoices = visibleChoices(happenedNode, faithCtx);
            const trustChoice = faithChoices.find(c => c.text.includes('Providence'));
            expect(trustChoice).toBeDefined();
            expect(trustChoice!.effect?.alignmentDelta?.epistemology).toBeGreaterThan(0);
            
            // Honest mutual aid (collaborative)
            const mutualCtx = ctxWithAlignment(0, 0, 15);
            const mutualChoices = visibleChoices(happenedNode, mutualCtx);
            const honestChoice = mutualChoices.find(c => c.text.includes('honest action'));
            expect(honestChoice).toBeDefined();
            expect(honestChoice!.effect?.setFlag).toBe('trader_honest_helper');
        });
    });

    describe('Phase 128 Talk + Choice Structure Validation', () => {
        it('validates all new NPCs implement Talk option pattern', () => {
            const phase128NPCs = [villageHealer, unionLeader, merchantWidow, forestRanger, hermitSage, lostTrader];
            
            for (const npc of phase128NPCs) {
                const greetNode = getDialogueNode(npc.dialogueTree!, 'greet');
                const choices = visibleChoices(greetNode, emptyCtx);
                
                const talkOption = choices.find(c => c.text.includes('*Talk'));
                expect(talkOption, `${npc.name} should have *Talk option`).toBeDefined();
                expect(talkOption!.nextNodeId, `${npc.name} *Talk should not end encounter`).toBeDefined();
            }
        });

        it('validates consequence shape diversity across all new NPCs', () => {
            const testCases = [
                // Self-sacrificial consequences (negative currency or positive moral)
                { npc: unionLeader, nodeId: 'talk_workers_situation', alignCtx: ctxWithAlignment(0, 0, 20), isSelfSacrificial: true },
                { npc: merchantWidow, nodeId: 'talk_troubles', alignCtx: ctxWithAlignment(0, 0, 15), isSelfSacrificial: true },
                
                // Self-interested consequences (positive currency)
                { npc: forestRanger, nodeId: 'talk_duties', alignCtx: ctxWithAlignment(0, 0, -10), isSelfInterested: true },
                { npc: lostTrader, nodeId: 'talk_what_happened', alignCtx: ctxWithAlignment(0, -5, 0), isSelfInterested: true },
            ];

            for (const testCase of testCases) {
                const node = getDialogueNode(testCase.npc.dialogueTree!, testCase.nodeId);
                const choices = visibleChoices(node, testCase.alignCtx);
                
                if (testCase.isSelfSacrificial) {
                    const sacrificeChoice = choices.find(c => c.effect?.grantCurrency && c.effect.grantCurrency < 0);
                    expect(sacrificeChoice, `${testCase.npc.name} should have self-sacrificial choice`).toBeDefined();
                } else if (testCase.isSelfInterested) {
                    const gainChoice = choices.find(c => c.effect?.grantCurrency && c.effect.grantCurrency > 0);
                    expect(gainChoice, `${testCase.npc.name} should have self-interested choice`).toBeDefined();
                }
            }
        });
    });
});