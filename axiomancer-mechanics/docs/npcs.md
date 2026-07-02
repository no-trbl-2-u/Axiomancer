# NPCs

> **Status:** Branching dialogue runtime is live (Spec 08 Q9). NPCs carry a
> legacy flat `dialogue` map and/or a structured `dialogueTree`; the engine
> exports tree-traversal helpers and a `GameState`-side-effect applier.
> Shop NPCs are typed but shop reducers (inventory, prices, stock refresh)
> are still pending — see [`specs/08-world-content-and-hazards.md`](../specs/08-world-content-and-hazards.md).

## Type Shape

Defined in [`src/NPCs/types.d.ts`](../src/NPCs/types.d.ts).

```ts
interface NPC {
    name: string;
    dialogue?: DialogueMap;        // legacy flat map (Q9 back-compat)
    dialogueTree?: DialogueTree;   // preferred for new authoring
    description?: string;
    image?: Image;
    isShopkeeper?: boolean;        // marks the NPC as exposing a shop view
}

interface DialogueMap {
    [key: string]: string | string[];
}

interface DialogueTree {
    rootId: string;
    nodes: Record<string, DialogueNode>;
}

interface DialogueNode {
    id: string;
    text: string;
    choices?: DialogueChoice[];    // omit for leaf nodes (terminator)
}

interface DialogueChoice {
    text: string;
    nextNodeId?: string;           // omit to end the conversation
    requires?: {
        quest?: QuestName;          // satisfied when the quest is active OR completed
        flag?: string;              // satisfied when the named flag is set
        questCompleted?: QuestName; // satisfied only when completed
        requiresAlignment?: AlignmentGate;  // Phase 46: gate by alignment cell axis
    };
    effect?: {
        startQuest?: QuestName;
        progressQuest?: { name: QuestName; objectiveId: string; amount?: number };
        completeQuest?: QuestName;
        teachSkill?: string;
        setFlag?: string;
        grantCurrency?: number;
        moralDelta?: number;        // Phase 14: direct moral-meter shift, clamped [-100, +100]
        alignmentDelta?: Partial<PhilosophicalAlignment>;  // Phase 43: 3-axis cube shift
    };
}
```

### Alignment-aware content (Phase 43 + 46)

Two Philosophy-system fields live on `DialogueChoice`:

- `effect.alignmentDelta?: Partial<PhilosophicalAlignment>` — Phase 43 authoring surface. When the choice is committed via `applyDialogueChoice`, the engine threads the delta through `applyAlignmentDelta(state.philosophicalAlignment, delta)` and surfaces the shift on `ApplyDialogueChoiceResult.effects.philosophicalShift`. Conventional band is ±1..±5 per axis; the helper clamps each axis to `[-100, +100]`.
- `requires.requiresAlignment?: AlignmentGate` — Phase 46 gating surface. Shape: `{ axis: 'epistemology' | 'outlook' | 'scope', op: 'gte' | 'lte', value: number }`. `visibleChoices` evaluates the gate against the optional `DialogueContext.alignment` (when supplied); choices whose gate misses are hidden from the returned list, identical to the existing `quest` / `flag` / `questCompleted` gating semantics. When `DialogueContext.alignment` is undefined, alignment-gated choices are hidden by default.

Cross-link: `docs/philosophy.md` carries the full authoring guidance in
"Authoring deltas (Phase 43)" + "Authoring gates (Phase 46)" — including
operator semantics, compound-gate composition, and the first-pass
authored gates on the Old Marrow and Coastal Beggar dialogue trees.

`DialogueMap` is the original flat shape keyed by trigger / context (e.g.
`"greeting"`, `"shop_open"`, `"quest_<id>_offer"`). Either a single line or an
array of lines is allowed; an array is interpreted as a sequence to play in
order. Retained for the existing NPC data — new content should author a
`DialogueTree` instead so the Spec 10 moral / quest gates have something to
grip.

## Public API (current)

```ts
import type {
    NPC, DialogueMap,
    DialogueTree, DialogueNode, DialogueChoice, DialogueContext,
} from 'axiomancer-mechanics';

import {
    getDialogueNode,    // (tree, nodeId) → DialogueNode; throws on unknown id
    visibleChoices,     // (node, ctx)    → DialogueChoice[] (filtered by `requires`)
    isLeafNode,         // (node)         → true when no choices / empty choices
} from 'axiomancer-mechanics';
```

### `DialogueContext`

The predicate context `visibleChoices` consumes when filtering by `requires`:

```ts
interface DialogueContext {
    activeQuests:    ReadonlySet<string>;
    completedQuests: ReadonlySet<string>;
    flags:           ReadonlySet<string>;
}
```

`requires.quest` is satisfied when the named quest is **active OR completed**;
`requires.questCompleted` is satisfied **only** when completed; `requires.flag`
is satisfied when the named flag is present in `ctx.flags`. All declared
`requires` must hold simultaneously for the choice to be visible.

### Side-effect orchestration (World module)

Applying a chosen `DialogueChoice` to `GameState` is the World module's
responsibility — see [`docs/world.md`](./world.md) and
[`src/World/dialogue.runtime.ts`](../src/World/dialogue.runtime.ts):

```ts
import { applyDialogueChoice } from 'axiomancer-mechanics';
// → ApplyDialogueChoiceResult: { gameState, nextNode, effects: { startedQuest, ... } }
```

`applyDialogueChoice` reads the current map's `MapDefinition.quests` to
resolve a quest by name, then routes the choice's `effect` payload through
the quest engine (start / progress / complete), the player's `knownSkills`
(teach), `gameState.flags` (set flag), `player.currency` (grant currency),
and `gameState.moralMeter` (`moralDelta`, clamped to `[-100, +100]`).
It returns the next dialogue node (or `null` when the conversation ends)
alongside a flat side-effect summary the UI logs (including the cumulative
`moralShift` if any).

## Reactive NPCs — alignment observers (Phase 63)

NPCs whose dialogue trees carry `DialogueTree.id?: string` opt into the
alignment-observer machinery:

```typescript
interface DialogueTree {
    id?: string;                     // Phase 63 — observer cache key
    rootId: string;
    nodes: Record<string, DialogueNode>;
}
```

When `applyDialogueChoice` runs against an identified tree, it writes
the player's current alignment cell id (per `getAlignmentCell`) to
`GameState.lastSeenAlignmentCells?[tree.id]` AFTER applying the
choice's effects. Trees without an `id` opt out; their cache slot is
never written.

Reactive dialogue branches gate on the cache via:

```typescript
choices: [
    {
        text: "(Stand quietly. He looks up and sees who you have become.)",
        nextNodeId: 'observer_recognition',
        requires: { playerAlignmentCellChangedSince: true },
    },
];
```

The gate surfaces the choice only when the player's CURRENT alignment
cell id differs from the cached one. Both `DialogueContext.alignment`
AND `DialogueContext.lastSeenAlignmentCellId` must be present in the
caller's context for the gate to fire; either missing hides the
choice (cold-start safe).

**Caller responsibility.** When invoking `visibleChoices` for an
identified tree, source `lastSeenAlignmentCellId` from
`state.lastSeenAlignmentCells?.[tree.id]`. The package barrel doesn't
ship a sugar wrapper for this — consumers walk the cache directly.

**First authored use.** Old Marrow's tree (`id: 'old-marrow'`) gains
a reactive `(Stand quietly...)` branch that surfaces on re-conversation
when the player's alignment cell has shifted since the last visit.
See `src/World/Continents/Coastal-Village/maps.ts` for the authored
shape.

Hermetic coverage at
[`src/Game/e2e/old-marrow-observer.engine.test.ts`](../src/Game/e2e/old-marrow-observer.engine.test.ts).

## Talk + Choice Structure (Phase 128)

**Canonical dialogue pattern:** Each NPC encounter offers a `*Talk` option that provides contextual information without ending the encounter, followed by 3+ mutually-exclusive philosophical-alignment responses with distinct consequence shapes.

### Structure Pattern

1. **Initial greeting** — Sets the scene and NPC personality
2. **Talk option** — Reveals the NPC's situation, conflict, or dilemma without ending the encounter
3. **Philosophical response choices** — Alignment-gated options expressing different ethical approaches:
   - **Divine/transcendent responses** — Trust in higher forces or spiritual solutions
   - **Collaborative/community responses** — Offering personal help or resources to solve problems
   - **Pragmatic/individual responses** — Self-interested or purely practical approaches

### Consequence Shape Categories

Following T-specified guidance for diverse outcome types:

- **Alignment-only consequences** — Pure philosophical positioning (`alignmentDelta` only)
- **Self-sacrificial consequences** — Help others at personal cost (`alignmentDelta` + `grantCurrency: -N` or `moralDelta: +N`)
- **Self-interested consequences** — Gain advantage through others' situations (`alignmentDelta` + `grantCurrency: +N`)
- **Balanced consequences** — Mixed outcomes reflecting complex moral choices

### Phase 128 NPCs

**Coastal Village:**
- **Village Healer** — Medical ethics dilemmas around obtaining supplies for the needy
- **Dockworker's Union Leader** — Labor rights tensions between collective action and individual survival
- **Merchant's Widow** — Grief and justice choices between forgiveness and retribution

**Northern Forest:**
- **Forest Ranger** — Conservation vs. exploitation balancing environmental and human needs
- **Hermit Sage** — Isolation vs. community obligation around sharing wisdom
- **Lost Trader** — Trust and deception in crisis situations requiring mutual aid

Each NPC demonstrates the alignment system across diverse life situations with memorable character conflicts designed for replayability across different philosophical paths.

## Pending

- **Dialogue-driven combat triggers** — currently choices can start quests
  and teach skills but cannot directly seed an encounter; a `startEncounter`
  effect on `DialogueChoice.effect` is being scoped for a later spec.
- **Per-NPC alignment observers** — Phase 63 shipped tree-level observers
  (`DialogueTree.id?` + `GameState.lastSeenAlignmentCells?`). NPC-level
  observation (different alignment cells gate different greetings on the
  same NPC across multiple trees) is a deliberate follow-up, not yet
  authored.

### Resolved since the original Pending list

- ~~Shop reducers~~ — Phase 37 (`f9c18f0`) shipped `buyItem` + `sellItem`
  + `defaultSellPrice` reducers in `src/Items/shop.reducer.ts`; CLI
  affordance lives in `src/CLI/game.cli.ts` `shopLoop`. `NPC.isShopkeeper`
  is consulted by the dialogue runtime to route into the shop. See
  [`docs/items.md`](./items.md#shop-economy-phase-37) for the engine
  description.
- ~~Moral gating (read-side via `state.moralMeter`)~~ — Spec 10 Q4 locked
  `moralMeter` as narrative-only by design. The read-side gating
  mechanism the original bullet anticipated landed instead via Phase 46's
  `DialogueChoice.requires.requiresAlignment?: AlignmentGate` keyed off
  `philosophicalAlignment` (Phase 42's 3-axis cube), not `moralMeter`.
  `visibleChoices` hides gated choices when the alignment is missing or
  the gate is unmet; `DialogueContext.alignment?` carries the player's
  current cube position. Phase 63 added a reactive variant —
  `requires.playerAlignmentCellChangedSince?: boolean` surfaces
  observer-style branches that hide until the player has shifted cells
  since the last interaction with the tree.

See [`specs/08-world-content-and-hazards.md`](../specs/08-world-content-and-hazards.md)
+ [`specs/14-philosophical-alignment.md`](../specs/14-philosophical-alignment.md).
