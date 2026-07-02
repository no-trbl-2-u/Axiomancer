# Phase 63 — NPC alignment observers (Spec 14 Q2 follow-up)

> Closes Spec 14 Q2. Tightest-possible engine primitive for "NPCs
> notice when the player's alignment cell has shifted since the last
> conversation"; content authoring stays opt-in per dialogue tree.

## Outcome

`DialogueTree.id?: string` (optional tree identifier);
`GameState.lastSeenAlignmentCells?: Record<string, string>` map
(tree-id → cellId, populated when `applyDialogueChoice` runs against
an identified tree); `DialogueChoice.requires.playerAlignmentCellChangedSince?:
boolean` gate evaluated by `visibleChoices` against the cached cell.
Old Marrow's tree gets `id: 'old-marrow'` plus one new dialogue
branch that surfaces when the player's cell has shifted since the
last visit. Hermetic e2e drives shift → re-converse → branch path.

## Source

`plan/PHASE_CANDIDATES.md` Promoted Phase 63 row + Spec 14 Q2 deferral.

## Implementation units

### Unit 1 — Engine primitive: tree id + cache field + gate

**Files:**
- `src/NPCs/types.ts` — extend `DialogueTree` with `id?: string` (optional tree identifier; opt-in per tree); extend `DialogueChoice.requires` with `playerAlignmentCellChangedSince?: boolean` (gate).
- `src/NPCs/dialogue.ts` — extend `DialogueContext` with `lastSeenAlignmentCellId?: string`; extend `visibleChoices` to evaluate the new gate (true when `ctx.alignment` resolves to a cell whose id differs from `ctx.lastSeenAlignmentCellId`; the gate hides the choice unless the alignment cell HAS changed).
- `src/Game/types.ts` — extend `GameState` with `lastSeenAlignmentCells?: Record<string, string>` (optional; no GAME_STATE_VERSION bump per D2).
- `src/World/dialogue.runtime.ts` — `applyDialogueChoice` writes the current cell to `state.lastSeenAlignmentCells[tree.id]` (when the tree has an id) AFTER applying the choice's other effects. Read the current cell via `getAlignmentCell(state.philosophicalAlignment).id`.
- `src/Game/store.ts` save / load paths thread the new optional field through (just like `philosophicalAlignment` does).

### Unit 2 — Content: Old Marrow tree id + reactive branch

**Files:**
- `src/World/Continents/Coastal-Village/maps.ts` — add `id: 'old-marrow'` to the Old Marrow `DialogueTree`. Add one new `greet` choice gated by `requires: { playerAlignmentCellChangedSince: true }` routing to a new terminal node where Old Marrow comments on the perceived shift.

### Unit 3 — Hermetic e2e + docs

**Files:**
- `src/Game/e2e/old-marrow-observer.engine.test.ts` (new) — drives the full path: dialogue → cache write → shift alignment → re-converse → visibleChoices surfaces the reactive branch; pre-shift the branch is hidden.
- `docs/npcs.md` gains a "Reactive NPCs — alignment observers (Phase 63)" subsection naming the three new surfaces.
- `specs/14-philosophical-alignment.md` Q2 → flip to "Resolved at Phase 63" with shipping reference.
- `CHANGELOG.md` `[unreleased]` `### Added` gains a Phase 63 bullet.

## Decisions made upfront — DO NOT ASK

- **D1 — Tree-level identification, not NPC-level.** `DialogueTree.id?` keyed the cache by tree, not by NPC name. Trees are owned by NPCs; multiple NPCs could theoretically share a tree but in practice don't. Tree id avoids threading NPC name through `applyDialogueChoice` (which already takes a tree, not an NPC).
- **D2 — Optional field; no GAME_STATE_VERSION bump.** `lastSeenAlignmentCells?: Record<string, string>` is optional; `undefined` defaults to "no observations yet" which is the correct cold-start semantic. Spec 09 acceptance doesn't require a bump for additive optional fields.
- **D3 — Gate semantic: "has changed since".** `playerAlignmentCellChangedSince: true` means "show this choice when the cell HAS changed." When `ctx.lastSeenAlignmentCellId` is undefined (first conversation), the gate fails (no shift to detect yet); when the cached cell matches the current cell, the gate fails. The choice is only visible when there's a delta to remark on.
- **D4 — Cache write happens AFTER the choice's effects.** `applyDialogueChoice` first applies the choice's effects (which may shift alignment via `alignmentDelta`), then writes the resulting cell to the cache. This means a choice can simultaneously shift alignment AND be the last-known reference point.
- **D5 — visibleChoices needs both `ctx.alignment` and `ctx.lastSeenAlignmentCellId`.** When `ctx.alignment` is undefined, the gate hides the choice (same convention as `requires.requiresAlignment`).
- **D6 — Three commits, single phase scope.** Unit 1 (engine), Unit 2 (content), Unit 3 (test + docs).

## Verify gate

- `npm run type-check` clean.
- `npm test` ≥633 (new e2e cases bump count by 3-4).
- `npm run build` clean.
- `npm run deploy:check` clean (no fixture change — only additive optional fields on existing exported types).

## Definition of Done

- [ ] `DialogueTree.id?: string` shipped.
- [ ] `GameState.lastSeenAlignmentCells?: Record<string, string>` shipped.
- [ ] `DialogueChoice.requires.playerAlignmentCellChangedSince?: boolean` shipped.
- [ ] `applyDialogueChoice` writes the cache for identified trees per D4.
- [ ] `visibleChoices` evaluates the new gate per D3.
- [ ] Old Marrow tree gets `id: 'old-marrow'` + one reactive branch.
- [ ] Hermetic e2e covers shift → re-converse → branch.
- [ ] `docs/npcs.md` + `specs/14-philosophical-alignment.md` Q2 + CHANGELOG.md `[unreleased]` updated.
- [ ] `npm run verify` + `npm run deploy:check` green.
- [ ] Build plan Phase 63 row flips `[ ]` → `[x]`.

## Follow-ups (out of scope)

- **NPC.observesAlignment?** marker (the candidate row suggested it). Skipped per D1 — tree-id keying is sufficient. Future content can adopt the observer pattern by adding tree ids; no engine extension needed.
- **Compound gates** (e.g. cell-changed-since AND in-particular-region). Sequential checks work; compound gate primitive deferred.

## Canonical sibling

Phase 46 (alignment-gated content) — the closest precedent for adding a `requires.X` gate to `DialogueChoice`. Phase 42 (alignment cube) for the `getAlignmentCell` resolution.
