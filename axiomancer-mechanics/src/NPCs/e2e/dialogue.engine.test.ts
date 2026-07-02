/**
 * Hermetic E2E Tests — NPCs dialogue traversal (Spec 08 Q9)
 *
 * Drives the three exported helpers (`getDialogueNode`, `visibleChoices`,
 * `isLeafNode`) plus the `DialogueContext` predicate against fabricated
 * dialogue trees. The module is data-only and pure — no RNG, no I/O, no
 * Math.random stubbing required.
 *
 * Coverage:
 *   1. getDialogueNode returns the node and throws on unknown id.
 *   2. visibleChoices: no `requires` → always visible.
 *   3. visibleChoices: `requires.quest` satisfied by active OR completed.
 *   4. visibleChoices: `requires.questCompleted` requires completed (active is
 *      not enough).
 *   5. visibleChoices: `requires.flag` gates by ctx.flags.
 *   6. visibleChoices: combined requirements all must pass.
 *   7. visibleChoices: returns [] when node has no choices.
 *   8. isLeafNode: true when no choices or empty array; false otherwise.
 */

import { describe, it, expect } from 'vitest';

import {
    getDialogueNode,
    visibleChoices,
    isLeafNode,
    type DialogueContext,
} from '../dialogue';
import type {
    DialogueChoice,
    DialogueNode,
    DialogueTree,
} from '../types';
import type { QuestName } from '../../World/quest.library';

// Fabricated quest for these synthetic trees. It is not part of the QuestName
// union (the gating logic only compares names), so cast once and reuse.
const VOW_OF_SALT = 'Vow of Salt' as QuestName;

const emptyCtx: DialogueContext = {
    activeQuests: new Set(),
    completedQuests: new Set(),
    flags: new Set(),
};

function makeNode(id: string, choices?: DialogueChoice[]): DialogueNode {
    return { id, text: `node:${id}`, choices };
}

function makeTree(...nodes: DialogueNode[]): DialogueTree {
    return {
        rootId: nodes[0].id,
        nodes: Object.fromEntries(nodes.map(n => [n.id, n])),
    };
}

// ─── getDialogueNode ──────────────────────────────────────────────────────────

describe('getDialogueNode', () => {
    it('returns the node when the id exists', () => {
        const root = makeNode('root', [{ text: 'continue', nextNodeId: 'a' }]);
        const a = makeNode('a');
        const tree = makeTree(root, a);

        expect(getDialogueNode(tree, 'root')).toBe(root);
        expect(getDialogueNode(tree, 'a')).toBe(a);
    });

    it('throws when the id is unknown', () => {
        const tree = makeTree(makeNode('root'));
        expect(() => getDialogueNode(tree, 'missing')).toThrowError(
            /dialogue node 'missing' not found/,
        );
    });
});

// ─── visibleChoices ───────────────────────────────────────────────────────────

describe('visibleChoices — gating logic', () => {
    it('returns every choice when none declare `requires`', () => {
        const node = makeNode('root', [
            { text: 'a', nextNodeId: 'a' },
            { text: 'b', nextNodeId: 'b' },
        ]);
        const result = visibleChoices(node, emptyCtx);
        expect(result.map(c => c.text)).toEqual(['a', 'b']);
    });

    it('hides choices whose `requires.quest` is neither active nor completed', () => {
        const node = makeNode('root', [
            { text: 'open', nextNodeId: 'a' },
            { text: 'quest-gated', nextNodeId: 'b', requires: { quest: VOW_OF_SALT } },
        ]);
        const result = visibleChoices(node, emptyCtx);
        expect(result.map(c => c.text)).toEqual(['open']);
    });

    it('shows `requires.quest` choices when the quest is active', () => {
        const node = makeNode('root', [
            { text: 'gated', nextNodeId: 'a', requires: { quest: VOW_OF_SALT } },
        ]);
        const ctx: DialogueContext = {
            ...emptyCtx,
            activeQuests: new Set([VOW_OF_SALT]),
        };
        expect(visibleChoices(node, ctx)).toHaveLength(1);
    });

    it('shows `requires.quest` choices when the quest is completed', () => {
        const node = makeNode('root', [
            { text: 'gated', nextNodeId: 'a', requires: { quest: VOW_OF_SALT } },
        ]);
        const ctx: DialogueContext = {
            ...emptyCtx,
            completedQuests: new Set([VOW_OF_SALT]),
        };
        expect(visibleChoices(node, ctx)).toHaveLength(1);
    });

    it('treats `requires.questCompleted` strictly — active is not enough', () => {
        const node = makeNode('root', [
            {
                text: 'post-quest',
                nextNodeId: 'a',
                requires: { questCompleted: VOW_OF_SALT },
            },
        ]);
        const activeOnly: DialogueContext = {
            ...emptyCtx,
            activeQuests: new Set([VOW_OF_SALT]),
        };
        const completed: DialogueContext = {
            ...emptyCtx,
            completedQuests: new Set([VOW_OF_SALT]),
        };
        expect(visibleChoices(node, activeOnly)).toEqual([]);
        expect(visibleChoices(node, completed)).toHaveLength(1);
    });

    it('gates choices by `requires.flag`', () => {
        const node = makeNode('root', [
            { text: 'open', nextNodeId: 'a' },
            { text: 'flag-only', nextNodeId: 'b', requires: { flag: 'lit_candle' } },
        ]);

        expect(visibleChoices(node, emptyCtx).map(c => c.text)).toEqual(['open']);

        const withFlag: DialogueContext = {
            ...emptyCtx,
            flags: new Set(['lit_candle']),
        };
        expect(visibleChoices(node, withFlag).map(c => c.text)).toEqual([
            'open',
            'flag-only',
        ]);
    });

    it('requires every `requires` field to be satisfied simultaneously', () => {
        const node = makeNode('root', [
            {
                text: 'all-three',
                nextNodeId: 'a',
                requires: {
                    quest: VOW_OF_SALT,
                    questCompleted: VOW_OF_SALT,
                    flag: 'lit_candle',
                },
            },
        ]);
        const partial: DialogueContext = {
            ...emptyCtx,
            completedQuests: new Set([VOW_OF_SALT]),
            flags: new Set(['lit_candle']),
            // activeQuests omitted — but `requires.quest` is satisfied by completed too.
        };
        expect(visibleChoices(node, partial)).toHaveLength(1);

        const missingFlag: DialogueContext = {
            ...emptyCtx,
            completedQuests: new Set([VOW_OF_SALT]),
        };
        expect(visibleChoices(node, missingFlag)).toEqual([]);
    });

    it('returns an empty array when the node has no choices', () => {
        const leaf = makeNode('leaf');
        expect(visibleChoices(leaf, emptyCtx)).toEqual([]);
    });
});

// ─── Phase 46 — requiresAlignment ─────────────────────────────────────────────

describe('visibleChoices — requiresAlignment (Phase 46)', () => {
    const gatedChoice: DialogueChoice = {
        text: 'You speak like someone who already lost everything.',
        nextNodeId: 'pessimistic-branch',
        requires: { requiresAlignment: { axis: 'outlook', op: 'lte', value: -34 } },
    };
    const node = makeNode('root', [gatedChoice]);

    it('is visible to a player whose alignment axis meets the gte/lte threshold', () => {
        const ctx: DialogueContext = {
            ...emptyCtx,
            alignment: { epistemology: 0, outlook: -50, scope: 0 },
        };
        expect(visibleChoices(node, ctx)).toEqual([gatedChoice]);
    });

    it('is hidden when the player\'s axis value misses the threshold', () => {
        const ctx: DialogueContext = {
            ...emptyCtx,
            alignment: { epistemology: 0, outlook: 0, scope: 0 },
        };
        expect(visibleChoices(node, ctx)).toEqual([]);
    });

    it('is visible at exactly the lte threshold and hidden one above', () => {
        const at: DialogueContext = {
            ...emptyCtx,
            alignment: { epistemology: 0, outlook: -34, scope: 0 },
        };
        const above: DialogueContext = {
            ...emptyCtx,
            alignment: { epistemology: 0, outlook: -33, scope: 0 },
        };
        expect(visibleChoices(node, at)).toEqual([gatedChoice]);
        expect(visibleChoices(node, above)).toEqual([]);
    });

    it('hides the gated choice when ctx.alignment is undefined (parallel to missing flag)', () => {
        expect(visibleChoices(node, emptyCtx)).toEqual([]);
    });

    it('honours `gte` operator in the opposite direction', () => {
        const choice: DialogueChoice = {
            text: 'Your scope is wide enough.',
            requires: { requiresAlignment: { axis: 'scope', op: 'gte', value: 34 } },
        };
        const n = makeNode('root', [choice]);
        const transcendent: DialogueContext = {
            ...emptyCtx,
            alignment: { epistemology: 0, outlook: 0, scope: 50 },
        };
        const individual: DialogueContext = {
            ...emptyCtx,
            alignment: { epistemology: 0, outlook: 0, scope: -50 },
        };
        expect(visibleChoices(n, transcendent)).toEqual([choice]);
        expect(visibleChoices(n, individual)).toEqual([]);
    });
});

// ─── isLeafNode ───────────────────────────────────────────────────────────────

describe('isLeafNode', () => {
    it('is true when the node has no `choices` field', () => {
        expect(isLeafNode(makeNode('leaf'))).toBe(true);
    });

    it('is true when the node declares an empty `choices` array', () => {
        expect(isLeafNode(makeNode('leaf', []))).toBe(true);
    });

    it('is false when the node has at least one choice', () => {
        const node = makeNode('branch', [{ text: 'go', nextNodeId: 'a' }]);
        expect(isLeafNode(node)).toBe(false);
    });
});
