/**
 * Dialogue tree traversal helpers (Spec 08 Q9).
 *
 * Branching dialogue is data-only — the engine walks a `DialogueTree`, hands
 * back the current node and visible choices, and lets the caller (CLI / UI)
 * decide when to advance. Side effects on a chosen `DialogueChoice` are
 * surfaced as a `DialogueEffect` payload; the orchestrator (`processDialogueChoice`)
 * applies them to `GameState`.
 */

import { DialogueChoice, DialogueNode, DialogueTree } from './types';
import type { PhilosophicalAlignment } from '../Philosophy/types';
import { getAlignmentCell } from '../Philosophy';

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
 * @property alignment       - Phase 46 — player's current alignment on the
 *                             27-cell cube. Used by `requires.requiresAlignment`.
 *                             Optional; a missing field implicitly hides
 *                             every alignment-gated choice (mirrors the
 *                             behaviour of a missing flag).
 */
export interface DialogueContext {
    activeQuests: ReadonlySet<string>;
    completedQuests: ReadonlySet<string>;
    flags: ReadonlySet<string>;
    alignment?: PhilosophicalAlignment;
    /**
     * Phase 63 — the alignment cell id this tree last observed for the
     * player. Sourced from `GameState.lastSeenAlignmentCells[tree.id]`
     * by the caller. Used to evaluate
     * `requires.playerAlignmentCellChangedSince`.
     */
    lastSeenAlignmentCellId?: string;
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
        if (req.requiresAlignment) {
            // Phase 46 — alignment gate. Missing ctx.alignment hides the
            // choice (parallel to a missing flag).
            if (!ctx.alignment) return false;
            const { axis, op, value } = req.requiresAlignment;
            const v = ctx.alignment[axis];
            if (op === 'gte' && !(v >= value)) return false;
            if (op === 'lte' && !(v <= value)) return false;
        }
        if (req.playerAlignmentCellChangedSince) {
            // Phase 63 — alignment-observer gate. Visible only when the
            // player's current cell differs from the one this tree last
            // observed. Missing alignment OR missing cached cell hide the
            // choice (no shift to detect yet).
            if (!ctx.alignment || !ctx.lastSeenAlignmentCellId) return false;
            const currentCell = getAlignmentCell(ctx.alignment);
            if (currentCell.id === ctx.lastSeenAlignmentCellId) return false;
        }
        return true;
    });
}

/** True when the node terminates the conversation (no choices). */
export function isLeafNode(node: DialogueNode): boolean {
    return !node.choices || node.choices.length === 0;
}
