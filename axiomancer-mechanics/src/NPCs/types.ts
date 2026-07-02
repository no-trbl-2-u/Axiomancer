import { Image } from '../Utils/types';
import { QuestName } from '../World/quest.library';
import { PhilosophicalAlignment } from '../Philosophy/types';

/**
 * Single-clause alignment predicate used by `DialogueChoice.requires` and
 * `CardLearningRequirement` to gate content behind a position on the
 * Phase 42 alignment cube.
 *
 * `gte` matches when the player's axis value is greater than or equal to
 * `value`; `lte` matches when less than or equal. Compound gates (e.g.
 * "pessimistic AND transcendent") author as two separate gated choices
 * sharing a `nextNodeId` until a real consumer demands an AND-of-array
 * shape.
 */
export interface AlignmentGate {
    axis: 'epistemology' | 'outlook' | 'scope';
    op: 'gte' | 'lte';
    value: number;
}

/**
 * NPCs module type definitions.
 *
 * - `DialogueMap` is the legacy flat string-keyed map. Retained so older NPC
 *   data keeps working.
 * - `DialogueTree` is the Spec 08 Q9 branching tree — every node has text and
 *   optional `choices` that traverse to other nodes, gated by requirements
 *   and able to fire side effects (start quest, advance objective, teach a
 *   skill, set a flag).
 */

/**
 * Legacy flat dialogue map kept for back-compat. Use `DialogueTree` for new
 * NPCs — the branching shape enables the moral / quest gating from Spec 10.
 *
 * @example
 * {
 *   "greeting": "Hello, traveler!",
 *   "farewell": ["Safe travels!", "Come back soon."]
 * }
 */
export interface DialogueMap {
    [key: string]: string | string[];
}

/**
 * A single choice the player can pick at a dialogue node.
 *
 * @property text         - What the player says / chooses (UI label).
 * @property nextNodeId   - Node to advance to. Omit to end the conversation.
 * @property requires     - Optional gate; the choice is hidden when unmet.
 *                          `quest` is satisfied when the named quest is `'active'` or `'completed'`.
 *                          `flag` is satisfied when the named flag is set in `gameState.flags`.
 * @property effect       - Optional side effect when chosen. Each field is
 *                          independent so a choice can both start a quest and
 *                          teach a skill.
 */
export interface DialogueChoice {
    text: string;
    nextNodeId?: string;
    requires?: {
        quest?: QuestName;
        flag?: string;
        questCompleted?: QuestName;
        /**
         * Phase 46 — gates the choice on the player's position on the
         * Phase 42 alignment cube. Single axis + operator + threshold;
         * the choice is hidden by `visibleChoices` when either the
         * gate is unmet OR the player's alignment isn't in
         * `DialogueContext`.
         */
        requiresAlignment?: AlignmentGate;
        /**
         * Phase 63 — when `true`, the choice surfaces only when the
         * player's current alignment cell differs from the one cached
         * by this tree's last interaction. Requires
         * `DialogueContext.alignment` AND
         * `DialogueContext.lastSeenAlignmentCellId` to be set;
         * otherwise the gate hides the choice. Use for "I notice you
         * have shifted" reactive branches on observing NPCs.
         */
        playerAlignmentCellChangedSince?: boolean;
    };
    effect?: {
        startQuest?: QuestName;
        progressQuest?: { name: QuestName; objectiveId: string; amount?: number };
        completeQuest?: QuestName;
        teachSkill?: string;
        setFlag?: string;
        grantCurrency?: number;
        /**
         * Direct moral-meter shift applied by `applyDialogueChoice`. Clamped
         * to [-100, +100] against `gameState.moralMeter`. Positive values
         * read as "more virtuous"; negative as "more pragmatic / cruel".
         */
        moralDelta?: number;
        /**
         * Per-axis shift on the Phase 42 philosophical alignment cube,
         * applied by `applyDialogueChoice` via `applyAlignmentDelta`. Each
         * axis clamps to [-100, +100]. Missing axes in the partial pass
         * through unchanged. Authoring band: ±1..±5; defining ±10 choices
         * reserved for endgame.
         */
        alignmentDelta?: Partial<PhilosophicalAlignment>;
    };
}

/** A node in a branching dialogue tree. */
export interface DialogueNode {
    id: string;
    text: string;
    /** Omit for leaf nodes (terminator). */
    choices?: DialogueChoice[];
}

/**
 * Branching dialogue tree — set of nodes keyed by id with a designated root.
 * The engine traverses the tree by following the `nextNodeId` of the chosen
 * `DialogueChoice`. A leaf node (no `choices`) ends the conversation.
 */
export interface DialogueTree {
    rootId: string;
    nodes: Record<string, DialogueNode>;
    /**
     * Phase 63 — optional tree identifier used as the cache key for
     * `GameState.lastSeenAlignmentCells`. When set, `applyDialogueChoice`
     * writes the player's current alignment cell id to that cache slot
     * after applying each choice; `DialogueChoice.requires.playerAlignmentCellChangedSince`
     * gates against the cached cell. Trees without an id opt out of the
     * observer machinery (the cache is never written; the gate always
     * hides).
     */
    id?: string;
}

/**
 * NPC is a non-player character that can be interacted with.
 *
 * Either `dialogue` (legacy flat map) or `dialogueTree` (Spec 08 Q9) may be
 * present. New authoring should use `dialogueTree`; the flat map is retained
 * for the existing NPC data.
 *
 * @property name          - The name of the NPC (also the lookup key in node events).
 * @property dialogue      - Legacy flat dialogue map (optional).
 * @property dialogueTree  - Branching tree (preferred for new content).
 * @property description   - A description of the NPC (optional).
 * @property image         - Optional visual.
 * @property isShopkeeper  - Marks this NPC as exposing a shop view.
 */
export interface NPC {
    name: string;
    dialogue?: DialogueMap;
    dialogueTree?: DialogueTree;
    description?: string;
    image?: Image;
    isShopkeeper?: boolean;
}
