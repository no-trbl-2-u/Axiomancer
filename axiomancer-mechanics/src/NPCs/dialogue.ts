/**
 * Dialogue tree traversal helpers.
 *
 * Branching dialogue is data-only — the engine walks a `DialogueTree`, hands
 * back the current node and visible choices, and lets the caller (CLI / UI)
 * decide when to advance. Side effects on a chosen `DialogueChoice` are
 * carried on `DialogueChoice.effect`; the orchestrator (`applyDialogueChoice`,
 * `World/dialogue.runtime.ts`) applies them to `GameState`.
 */

import { DialogueChoice, DialogueNode, DialogueTree } from './types';

/** Lookup a dialogue node, throwing if the id is unknown. */
export function getDialogueNode(tree: DialogueTree, nodeId: string): DialogueNode {
    const node = tree.nodes[nodeId];
    if (!node) {
        throw new Error(`getDialogueNode: dialogue node '${nodeId}' not found.`);
    }
    return node;
}

/**
 * Predicate context for filtering dialogue choices.
 *
 * @property activeQuests    - Names of quests currently in the player's log
 *                             (any status). Used by `requires.quest`.
 * @property completedQuests - Names of quests marked completed. Used by
 *                             `requires.questCompleted`.
 * @property flags           - World flags currently set.
 */
export interface DialogueContext {
    activeQuests: ReadonlySet<string>;
    completedQuests: ReadonlySet<string>;
    flags: ReadonlySet<string>;
}

/**
 * Returns the choices on a node that pass the `requires` gates given the
 * current dialogue context. Choices without `requires` are always visible.
 */
export function visibleChoices(
    node: DialogueNode,
    ctx: DialogueContext,
): DialogueChoice[] {
    if (!node.choices) return [];
    return node.choices.filter(c => {
        const req = c.requires;
        if (!req) return true;
        if (req.quest && !ctx.activeQuests.has(req.quest) && !ctx.completedQuests.has(req.quest)) return false;
        if (req.questCompleted && !ctx.completedQuests.has(req.questCompleted)) return false;
        if (req.flag && !ctx.flags.has(req.flag)) return false;
        return true;
    });
}

/** True when the node terminates the conversation (no choices). */
export function isLeafNode(node: DialogueNode): boolean {
    return !node.choices || node.choices.length === 0;
}
