/**
 * Hermetic E2E Tests — Story Content NPCs Dialogue Trees (Phase 115)
 *
 * Tests the story NPCs' dialogue trees and choice consequences. Covers
 * the golden path for each NPC plus flag setting. (The alignment gates and
 * observer branches were removed with the alignment grid, T6 / D39; the
 * choices they hid are now always offered.)
 *
 * Coverage:
 *   1. Shrine Keeper: mystical dialogue, crystal gift choice
 *   2. Chronicler: scholarly dialogue, chronicle integration flags, knowledge contribution
 *   3. Wandering Philosopher: philosophical discourse, diverse perspectives
 *   4. Phase 128 northern-forest NPCs: Talk + choice structure
 *
 * (The fishing-village NPCs — Captain Blackwater, the Fisherman's Daughter,
 * the Village Healer, the Union Leader, the Merchant Widow — and their cases
 * were purged with the map in THE REVAMP R3b.)
 */

import { describe, it, expect } from 'vitest';

import {
    getDialogueNode,
    visibleChoices,
    type DialogueContext,
} from '../dialogue';
import { shrineKeeper, chronicler, wanderingPhilosopher, forestRanger, hermitSage, lostTrader } from '../../World/Continents/Northern-Forest/npcs';

// ─── Test helpers ─────────────────────────────────────────────────────────────

const emptyCtx: DialogueContext = {
    activeQuests: new Set(),
    completedQuests: new Set(),
    flags: new Set(),
};

/** Every choice is ungated by alignment now; the old alignment args are ignored. */
function ctxAny(..._ignored: unknown[]): DialogueContext {
    return emptyCtx;
}

function _ctxWithFlags(flags: string[]): DialogueContext {
    return {
        ...emptyCtx,
        flags: new Set(flags),
    };
}

// ─── Shrine Keeper Tests ──────────────────────────────────────────────────────

describe('Shrine Keeper — belief-vs-skepticism NPC', () => {
    const tree = shrineKeeper.dialogueTree!;

    it('provides greeting with multiple paths based on epistemology', () => {
        const greetNode = getDialogueNode(tree, 'greet');
        expect(greetNode.text).toContain('keeps its own count');

        // Every choice is visible: the alignment gates are gone (T6 / D39).
        const choices = visibleChoices(greetNode, emptyCtx);
        expect(choices).toHaveLength(greetNode.choices!.length);

        const choiceTexts = choices.map(c => c.text);
        expect(choiceTexts).toContain('What does it count?');
        expect(choiceTexts).toContain('Leave quietly.');
    });

    it('shows faith-based choice for high epistemology alignment', () => {
        const ctx = ctxAny(25, 0, 0); // High epistemology (faith)
        const greetNode = getDialogueNode(tree, 'greet');
        const choices = visibleChoices(greetNode, ctx);

        const faithChoice = choices.find(c => c.text.includes('feels different'));
        expect(faithChoice).toBeTruthy();
    });

    it('shows skeptical choice for low epistemology alignment', () => {
        const ctx = ctxAny(-25, 0, 0); // Low epistemology (skeptical)
        const greetNode = getDialogueNode(tree, 'greet');
        const choices = visibleChoices(greetNode, ctx);

        const skepticChoice = choices.find(c => c.text.includes('superstition'));
        expect(skepticChoice).toBeTruthy();
    });

    it('offers no crystal that grants nothing (R3c)', () => {
        const veilNode = getDialogueNode(tree, 'veil_thin');
        expect(veilNode.text).toContain('crystalline fragment');

        // "Accept the crystal." set an unread flag and granted nothing; R3c
        // removed it. The refusal stays.
        const choices = visibleChoices(veilNode, emptyCtx);
        expect(choices.map(c => c.text)).toEqual(["I can't take something this valuable."]);
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
        expect(contributeChoice!.effect).toBeUndefined(); // R3c: its unread flag went
    });

    it('provides scholarly responsibility acceptance', () => {
        const contributionNode = getDialogueNode(tree, 'contribution_offer');
        const choices = visibleChoices(contributionNode, emptyCtx);

        const acceptChoice = choices.find(c => c.text.includes('scholarly responsibility'));
        expect(acceptChoice).toBeTruthy();
        expect(acceptChoice!.effect).toBeUndefined(); // R3c: its unread flag went
    });

    it('gates present-focus choice by low scope alignment', () => {
        const purposeNode = getDialogueNode(tree, 'chronicling_purpose');
        const ctx = ctxAny(0, 0, -15); // Low scope (individualist)
        const choices = visibleChoices(purposeNode, ctx);

        const presentChoice = choices.find(c => c.text.includes('Focus on the present'));
        expect(presentChoice).toBeTruthy();
    });

});

// ─── Wandering Philosopher Tests ──────────────────────────────────────────────

describe('Wandering Philosopher — Multi-perspective philosophical dialogue', () => {
    const tree = wanderingPhilosopher.dialogueTree!;

    it('provides diverse philosophical perspective gates', () => {
        const seekingNode = getDialogueNode(tree, 'seeking_place');
        const choices = visibleChoices(seekingNode, emptyCtx);
        // Every perspective is visible: the alignment gates are gone (T6 / D39).
        expect(choices).toHaveLength(seekingNode.choices!.length);

        const allChoiceTexts = seekingNode.choices!.map(c => c.text);
        expect(allChoiceTexts).toContain('Fate guides us toward our destined role.');
        expect(allChoiceTexts).toContain('We forge our own destiny through determination.');
        expect(allChoiceTexts).toContain('We find ourselves through community and connection.');
        expect(choices.some(c => c.text.includes('not sure'))).toBe(true);
    });

    it('shows fate perspective for high epistemology (transcendent)', () => {
        const ctx = ctxAny(20, 0, 0); // High epistemology
        const seekingNode = getDialogueNode(tree, 'seeking_place');
        const choices = visibleChoices(seekingNode, ctx);

        const fateChoice = choices.find(c => c.text.includes('Fate guides us'));
        expect(fateChoice).toBeTruthy();
    });

    it('shows will perspective for low scope (individualist)', () => {
        const ctx = ctxAny(0, 0, -5); // Low scope
        const seekingNode = getDialogueNode(tree, 'seeking_place');
        const choices = visibleChoices(seekingNode, ctx);

        const willChoice = choices.find(c => c.text.includes('forge our own destiny'));
        expect(willChoice).toBeTruthy();
    });

    it('shows community perspective for high scope (relational)', () => {
        const ctx = ctxAny(0, 0, 20); // High scope
        const seekingNode = getDialogueNode(tree, 'seeking_place');
        const choices = visibleChoices(seekingNode, ctx);

        const communityChoice = choices.find(c => c.text.includes('community and connection'));
        expect(communityChoice).toBeTruthy();
    });

    it('rewards honest uncertainty', () => {
        const seekingNode = getDialogueNode(tree, 'seeking_place');
        const choices = visibleChoices(seekingNode, emptyCtx);

        const uncertainChoice = choices.find(c => c.text.includes('not sure'));
        expect(uncertainChoice).toBeTruthy();
        expect(uncertainChoice!.effect).toBeUndefined(); // R3c: its unread flag went
    });
});

// ─── Cross-NPC Observer Pattern Tests ─────────────────────────────────────────

describe('Phase 128 NPCs — Talk + choice structure', () => {
    // ─── Phase 128 NPCs (Talk + Choice Structure) ─────────────────────────────

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
            const faithCtx = ctxAny(20, 0, 0);
            const faithChoices = visibleChoices(happenedNode, faithCtx);
            const trustChoice = faithChoices.find(c => c.text.includes('Providence'));
            expect(trustChoice).toBeDefined();
            
            // Honest mutual aid (collaborative)
            const mutualCtx = ctxAny(0, 0, 15);
            const mutualChoices = visibleChoices(happenedNode, mutualCtx);
            const honestChoice = mutualChoices.find(c => c.text.includes('honest action'));
            expect(honestChoice).toBeDefined();
            expect(honestChoice!.effect?.grantCurrency).toBe(-5);
        });
    });

    describe('Phase 128 Talk + Choice Structure Validation', () => {
        it('validates all new NPCs implement Talk option pattern', () => {
            const phase128NPCs = [forestRanger, hermitSage, lostTrader];
            
            for (const npc of phase128NPCs) {
                const greetNode = getDialogueNode(npc.dialogueTree!, 'greet');
                const choices = visibleChoices(greetNode, emptyCtx);
                
                const talkOption = choices.find(c => c.text.includes('*Talk'));
                expect(talkOption, `${npc.name} should have *Talk option`).toBeDefined();
                expect(talkOption!.nextNodeId, `${npc.name} *Talk should not end encounter`).toBeDefined();
            }
        });

        it('validates the self-interested consequence shape on the surviving NPCs', () => {
            const testCases = [
                // Self-interested consequences (positive currency)
                { npc: forestRanger, nodeId: 'talk_duties', alignCtx: ctxAny(0, 0, -10) },
                { npc: lostTrader, nodeId: 'talk_what_happened', alignCtx: ctxAny(0, -5, 0) },
            ];

            for (const testCase of testCases) {
                const node = getDialogueNode(testCase.npc.dialogueTree!, testCase.nodeId);
                const choices = visibleChoices(node, testCase.alignCtx);
                const gainChoice = choices.find(c => c.effect?.grantCurrency && c.effect.grantCurrency > 0);
                expect(gainChoice, `${testCase.npc.name} should have self-interested choice`).toBeDefined();
            }
        });
    });
});