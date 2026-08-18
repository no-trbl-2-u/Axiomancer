/**
 * Hermetic e2e — Phase 53e "the read-back web" (S-02).
 *
 * Across every authored map there was exactly ONE `requires.flag` gate
 * before this phase (the Coastal Beggar's `befriended-little-belle`
 * branch). Every other moral choice — S-01's four dilemmas, `marrow_pressed`
 * — was a fork the world never mentioned again. This phase gates a branch
 * on each of those flags in the three post-boss NPCs (Coastal Beggar,
 * Captain Blackwater, Fisherman's Daughter), strictly forward-only per the
 * gauntlet's column law, additive so an unflagged player sees a complete
 * conversation with nothing visibly missing.
 *
 * Covers: gated-hidden / gated-visible / ungated-conversation-identical for
 * every reactive branch, the forward-only column law asserted mechanically,
 * and the `requires.flag` count across the three touched trees.
 */

import { describe, it, expect } from 'vitest';

import { fishingVillage } from '../Coastal-Village/maps';
import { captainBlackwater, fishermansDaughter } from '../Coastal-Village/npcs';
import { visibleChoices } from '../../../NPCs/dialogue';
import type { DialogueContext } from '../../../NPCs/dialogue';
import type { DialogueTree } from '../../../NPCs/types';

function ctxWithFlags(flags: string[]): DialogueContext {
    return {
        activeQuests: new Set(),
        completedQuests: new Set(),
        flags: new Set(flags),
    };
}

function columnOf(nodeId: string): number {
    const node = fishingVillage.nodes.find(n => n.id === nodeId);
    if (!node) throw new Error(`no such node: ${nodeId}`);
    return node.location[0];
}

/** Counts every `DialogueChoice` across a tree whose `requires` names a `flag`. */
function countFlagGates(tree: DialogueTree): number {
    let count = 0;
    for (const node of Object.values(tree.nodes)) {
        for (const choice of node.choices ?? []) {
            if (choice.requires?.flag) count += 1;
        }
    }
    return count;
}

const beggarTree = fishingVillage.npcs!.find(n => n.name === 'Coastal Beggar')!.dialogueTree!;
const blackwaterTree = captainBlackwater.dialogueTree!;
const daughterTree = fishermansDaughter.dialogueTree!;

describe('Phase 53e — the read-back web', () => {
    describe('forward-only column law', () => {
        it('fv-14 (the father flags) sits strictly ahead of its two readers (Beggar, Daughter)', () => {
            const setterColumn = columnOf('fv-14');
            for (const readerId of ['fv-7', 'fv-19']) {
                expect(setterColumn, `fv-14 must precede ${readerId}`).toBeLessThan(columnOf(readerId));
            }
        });

        it('fv-4 (the Stranger\'s Net flags) sits strictly ahead of the Fisherman\'s Daughter', () => {
            expect(columnOf('fv-4')).toBeLessThan(columnOf('fv-19'));
        });

        it('fv-2 (marrow_pressed) sits strictly ahead of Captain Blackwater', () => {
            expect(columnOf('fv-2')).toBeLessThan(columnOf('fv-18'));
        });
    });

    describe('Coastal Beggar — reads fv-14\'s three father flags', () => {
        const cases: Array<[string, string]> = [
            ['boy-told-father-truth', 'father_echo_truth'],
            ['boy-spared-father-worry', 'father_echo_spared'],
            ['boy-deflected-father', 'father_echo_deflected'],
        ];

        it.each(cases)('hidden without %s, visible with it, leads to %s', (flag, leafId) => {
            const withoutFlag = visibleChoices(beggarTree.nodes.greet, ctxWithFlags([]));
            expect(withoutFlag.find(c => c.nextNodeId === leafId)).toBeUndefined();

            const withFlag = visibleChoices(beggarTree.nodes.greet, ctxWithFlags([flag]));
            const reactive = withFlag.find(c => c.nextNodeId === leafId);
            expect(reactive).toBeDefined();
            expect(reactive!.effect?.moralDelta).toBeUndefined();

            // Additive: exactly one new choice appears, nothing else changes.
            expect(withFlag.length).toBe(withoutFlag.length + 1);

            const leaf = beggarTree.nodes[leafId]!;
            expect(leaf.choices).toBeUndefined(); // terminal
            expect(leaf.text.length).toBeGreaterThan(0);
        });

        it('the ordinary conversation is untouched by any single father flag', () => {
            const ordinary = visibleChoices(beggarTree.nodes.greet, ctxWithFlags([])).map(c => c.text);
            for (const [flag] of cases) {
                const withFlag = visibleChoices(beggarTree.nodes.greet, ctxWithFlags([flag])).map(c => c.text);
                for (const text of ordinary) {
                    expect(withFlag).toContain(text);
                }
            }
        });
    });

    describe('Captain Blackwater — reads marrow_pressed', () => {
        it('hidden without the flag, visible with it, sets no moralDelta', () => {
            const withoutFlag = visibleChoices(blackwaterTree.nodes.greet, ctxWithFlags([]));
            expect(withoutFlag.find(c => c.nextNodeId === 'marrow_pressed_recognition')).toBeUndefined();

            const withFlag = visibleChoices(blackwaterTree.nodes.greet, ctxWithFlags(['marrow_pressed']));
            const reactive = withFlag.find(c => c.nextNodeId === 'marrow_pressed_recognition');
            expect(reactive).toBeDefined();
            expect(reactive!.effect?.moralDelta).toBeUndefined();
            expect(withFlag.length).toBe(withoutFlag.length + 1);

            const leaf = blackwaterTree.nodes.marrow_pressed_recognition!;
            expect(leaf.choices).toBeUndefined();
            expect(leaf.text.length).toBeGreaterThan(0);
        });
    });

    describe("Fisherman's Daughter — reads the father flags and the Stranger's Net flags, no moralDelta ever", () => {
        const cases: Array<[string, string]> = [
            ['boy-told-father-truth', 'daughter_reads_told_truth'],
            ['boy-spared-father-worry', 'daughter_reads_spared_worry'],
            ['boy-deflected-father', 'daughter_reads_deflected'],
            ['boy-returned-the-net', 'daughter_reads_returned_net'],
            ['boy-skimmed-the-net', 'daughter_reads_skimmed_net'],
            ['boy-took-the-net', 'daughter_reads_took_net'],
        ];

        it.each(cases)('hidden without %s, visible with it, leads to %s, sets no moralDelta', (flag, leafId) => {
            const withoutFlag = visibleChoices(daughterTree.nodes.greet, ctxWithFlags([]));
            expect(withoutFlag.find(c => c.nextNodeId === leafId)).toBeUndefined();

            const withFlag = visibleChoices(daughterTree.nodes.greet, ctxWithFlags([flag]));
            const reactive = withFlag.find(c => c.nextNodeId === leafId);
            expect(reactive).toBeDefined();
            expect(reactive!.effect).toBeUndefined();
            expect(withFlag.length).toBe(withoutFlag.length + 1);

            const leaf = daughterTree.nodes[leafId]!;
            expect(leaf.choices).toBeUndefined();
            expect(leaf.text.length).toBeGreaterThan(0);
        });

        // "The finding, as a test" — the brief's own acceptance scenario: a
        // choice made in column 3 (fv-14), noticed in column 6 (fv-19), has
        // never once worked in this project before this phase.
        it('setting boy-spared-father-worry surfaces her recognition branch; the rest of her conversation is unchanged', () => {
            const before = visibleChoices(daughterTree.nodes.greet, ctxWithFlags([]));
            const after = visibleChoices(daughterTree.nodes.greet, ctxWithFlags(['boy-spared-father-worry']));

            const recognition = after.find(c => c.nextNodeId === 'daughter_reads_spared_worry');
            expect(recognition).toBeDefined();
            expect(recognition!.text).not.toBe('');

            const beforeTexts = before.map(c => c.text);
            const afterTexts = after.map(c => c.text);
            for (const text of beforeTexts) {
                expect(afterTexts).toContain(text);
            }
            expect(afterTexts.length).toBe(beforeTexts.length + 1);

            const leaf = daughterTree.nodes.daughter_reads_spared_worry!;
            expect(leaf.text).toContain('We are both good at it. That is the part I mind.');
        });
    });

    describe('requires.flag count moves from 1 to 11', () => {
        it('Coastal Beggar: 1 pre-existing (befriended-little-belle) + 3 new (father flags) = 4', () => {
            expect(countFlagGates(beggarTree)).toBe(4);
        });

        it('Captain Blackwater: 0 pre-existing + 1 new (marrow_pressed) = 1', () => {
            expect(countFlagGates(blackwaterTree)).toBe(1);
        });

        it("Fisherman's Daughter: 0 pre-existing + 6 new (father + net flags) = 6", () => {
            expect(countFlagGates(daughterTree)).toBe(6);
        });

        it('total across the three touched trees is 11 (repo-wide: 1 before this phase)', () => {
            const total = countFlagGates(beggarTree) + countFlagGates(blackwaterTree) + countFlagGates(daughterTree);
            expect(total).toBe(11);
        });
    });
});
