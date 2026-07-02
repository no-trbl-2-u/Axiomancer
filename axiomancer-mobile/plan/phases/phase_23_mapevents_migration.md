# Phase 23 — MapEvents engine consumer migration (`processNode` → `resolveMapEvent`)

> **Status: [ ] — URGENT.** Promoted via `/oversight` 2026-05-15
> mid-`/march` halt. Engine `axiomancer-mechanics@0.7.0`
> (commit `ee3b9ad`) removed `processNode` /
> `ProcessNodeResult` / `ProcessedEvent` from the top-level
> surface; Phase 6's event subsystem (shipped four commits ago)
> references the removed types, so the **verify gate is RED
> across the entire codebase** until this migration lands.
> Score 9.5 (was 6.5 — what was alignment is now unblocker).
>
> Sized **3–4 ticks** per the original ROADMAP estimate. Sub-tick
> decomposition mirrors Phase 6's shape (store slice → action
> layer → screen → close-out).

## Outcome

The mobile event subsystem reads from the engine's new
`resolveMapEvent` / `ResolvedEvent` / `ResolveMapEventResult`
surface instead of the removed `processNode` /
`ProcessNodeResult` / `ProcessedEvent`. All eight typed
`MapEventKind` payloads (encounter / interaction / gathering /
rest / village / cutscene / hazard / loot-cache) compose to the
existing `EventViewModel` shape (`kind: 'combat-prelude' |
'narrative-choice'` + consequence chips + skip button) without
changing the screen layer. Verify gate returns to green;
Phase 26 unblocks.

## Routes / API endpoints / CLI surface — locked

No route changes. The event modal stays at
`app/event/index.tsx` (Phase 6's folder). The Stack.Screen
registration in `app/_layout.tsx` is untouched. EventGate keeps
the same `selectHasActiveEvent` interface.

## Content / data reads — engine surface

Every import path migrates from removed names to the new ones.

| Old (0.6.0, removed) | New (0.7.0) | Use |
|---|---|---|
| `processNode(state)` (standalone) | `resolveMapEvent(state, rng?)` | Pure function; returns `{ state, event }`. Mobile action calls this, caches result in slice. |
| `ProcessNodeResult` | `ResolveMapEventResult` | `{ state: GameState; event: ResolvedEvent }` |
| `ProcessedEvent` | `ResolvedEvent` | Discriminated union; 9 cases (8 + none) |
| `kind: 'npc'` | `kind: 'interaction'` | NPC dialogue branch |
| `kind: 'gather'` | `kind: 'gathering'` | Items found |
| `kind: 'treasure'` | `kind: 'loot-cache'` | Items + currency |
| `kind: 'quest'` | — | **Removed** (folded into other kinds at the engine level) |
| `kind: 'shop'` | `kind: 'village'` | Village node with optional merchant NPCs |
| (none) | `kind: 'cutscene'` | **New** — `lines: readonly string[]` |
| (none) | `kind: 'hazard'` | **New** — `effects: ActiveEffect[]` + `damage: number` |
| `kind: 'encounter'` | `kind: 'encounter'` | Unchanged shape |
| `kind: 'rest'` | `kind: 'rest'` | `healed: number` unchanged |
| `kind: 'none'` | `kind: 'none'` | Unchanged |

**Engine actions still on `GameActions` (unchanged):**

- `startCombat(enemy)` — combat-prelude path still dispatches this
- `applyDialogue(tree, choice)` — interaction-with-dialogue path
- `applyDialogueChoice(state, tree, choice)` (standalone, returns `ApplyDialogueChoiceResult`) — still exported; used to walk cursor

## Components / handlers — modified

**Modified files:**

- `state/store.ts`
  - `MobileEventSlice.pending` type: `ProcessNodeResult | null` → `ResolveMapEventResult | null`.
  - `import` updates: `ProcessNodeResult` → `ResolveMapEventResult`.
- `state/presenters/event.engine.ts`
  - Replace all `ProcessNodeResult` references with `ResolveMapEventResult`.
  - Replace all `ProcessedEvent` references with `ResolvedEvent`.
  - `composeNarrative(processed, message)`: branch on the new 8 kinds. Rename `composeNpcDialogue` → `composeInteractionDialogue` for the dialogue path (kind `'interaction'`). Rename `composeItemBag` callers from `'gather'`/`'treasure'` to `'gathering'`/`'loot-cache'`. Add new branches: `'village'`, `'cutscene'`, `'hazard'`. Remove `'shop'` and `'quest'` branches.
  - The mapping table in §Decisions documents each new kind → VM `kind` + `variant` mapping.
  - **`message` field is gone from `ResolveMapEventResult`** — pull body text from `event.description` on each payload (each `MapEventPayload` carries an optional `description: string`); fallback to a kind-keyed default in `event-assets.ts` when description is absent.
- `state/presenters/event-assets.ts`
  - Expand `EventArtSlug` to include the new kinds:
    `'encounter' | 'boss' | 'rest' | 'gathering' | 'loot-cache' | 'interaction-generic' | 'village' | 'cutscene' | 'hazard'`. (Drop `'treasure'`, `'gather'`, `'npc-generic'`; rename or alias the latter.)
  - Rewrite `selectEventArtSlug` for the 8 kinds.
- `state/actions.ts`
  - Rename `processCurrentNode()` → `resolveCurrentMapEvent()` on `AppActions`. Same return signature: `boolean` for "an event was produced".
  - Drop the `enginePureProcessNode` import; add `resolveMapEvent`.
  - The implementation calls `resolveMapEvent(state)` (pure), spreads `result.state` onto the store, caches `result` in `state.event.pending`. The dialogue-cursor seeding logic adapts: when `result.event.kind === 'interaction' && result.event.dialogue` is present, seed the cursor to `result.event.dialogue.rootId`.
  - Rename `pickEventChoice` branches: keep the dispatch logic but match the new `kind` strings. `'npc'` → `'interaction'`, `'gather'`/`'treasure'` → `'gathering'`/`'loot-cache'`. Add early-return for `'cutscene'` / `'hazard'` (auto-resolve; engine already applied effects via `result.state`).
  - Comment swept earlier in Phase 26's brief also needs to mention the new engine surface (re-write the file header again).
- `state/e2e/event.engine.test.ts`
  - Rewrite all fixture builders (`makeEncounterResult`, `makeRestResult`, `makeGatherResult`) to produce `ResolveMapEventResult` shapes instead of `ProcessNodeResult`. Drop `gameState` / `objectivesProgressed` / `questsCompleted` / `message` from fixtures (gone in new shape). Replace with `{ state, event }`. Move `message` content into `event.description` where the kind supports it (each payload has optional `description`).
  - Update kind names in assertions: `'gather'` → `'gathering'`, etc.
  - Add new test cases: `'village'` (variant `quest` artSlug `village`), `'cutscene'` (single-choice with lines), `'hazard'` (single-choice with damage consequence).
- `state/e2e/event-assets.test.ts`
  - Rewrite fixture shapes to match the new payloads (kind strings update).
  - Add cases for `'interaction'`, `'village'`, `'cutscene'`, `'hazard'`, `'loot-cache'`, `'gathering'`.
- `state/e2e/event.screen.test.tsx`
  - Update the inline `encounter` / `rest` fixture helpers to produce `ResolveMapEventResult` shape. No screen-side logic changes.

**Untouched:**

- `app/event/index.tsx` — screen consumes the VM via the existing `selectEventViewModel` interface; nothing changes screen-side.
- `components/event/*` — illustrations are slug-keyed; only the slug enum changes.
- `components/EventGate.tsx` — still reads `selectHasActiveEvent`; semantics unchanged.

**Exploration `moveToAction` migration (`worldCompleteNode` → `revealAdjacent` / `markNodeConsumed`):** **OUT OF SCOPE for Phase 23.** That sits inside the same audit gap I (per ROADMAP) but is independent of the event-subsystem migration. File as a follow-up phase candidate after Phase 23 ships. Phase 23 must NOT touch `state/actions.ts:moveToAction` beyond the comment-sweep.

## VM shape — locked

**Unchanged from Phase 6** — the `EventViewModel` shape is stable. This is the point of the presenter layer: engine churn doesn't reach the screen.

The internal `EventVariant` enum may extend with `'village' | 'cutscene' | 'hazard'`, but those are additive — existing variants stay valid.

## Cross-links

**In (verify before starting):**

- `node_modules/axiomancer-mechanics/package.json` version is `0.7.0` (verified — pinned `^0.7.0` in package.json).
- `resolveMapEvent`, `ResolvedEvent`, `ResolveMapEventResult` exported from top-level barrel (verified in `dist/index.d.ts`).
- `applyDialogue` still on `GameActions` (verified at `dist/Game/store.d.ts:24`).
- The eight typed payload exports exist (`EncounterPayload`, `InteractionPayload`, `GatheringPayload`, `RestPayload`, `VillagePayload`, `CutscenePayload`, `HazardPayload`, `LootCachePayload`).

**Out (ships in this phase):**

- `state/store.ts` — slice type updated.
- `state/presenters/event.engine.ts` — composition rewritten.
- `state/presenters/event-assets.ts` — slug enum + mapper rewritten.
- `state/actions.ts` — `resolveCurrentMapEvent` (renamed from `processCurrentNode`); `pickEventChoice` branches updated.
- `state/e2e/event.engine.test.ts` — fixtures + assertions rewritten.
- `state/e2e/event-assets.test.ts` — kind cases rewritten + extended.
- `state/e2e/event.screen.test.tsx` — fixture helpers updated.

**Retro-fit (out of scope, follow-up):**

- Phase 26 re-plan + ship (its scope is unchanged; just blocked on this).
- Exploration `moveToAction` → engine `revealAdjacent` / `markNodeConsumed` (separate phase).
- `'cutscene'` UX polish (paged narration); ships as iterate row after.
- `'village'` shop UI (was already deferred for Phase 6's `'shop'` kind).

## Decisions made upfront — DO NOT ASK

Authority order per `skills/plan-a-phase.md` §3: spec answers > `plan/bearings.md` > phase-specific. Spec 08's product answers (A / C / B / Future spec / Yes) still bind; this brief just maps them onto the new engine kinds.

1. **Action rename: `processCurrentNode` → `resolveCurrentMapEvent`.** Matches the engine's new function name. Backward-compat alias **not** added — Phase 23 ships against a verify-red baseline, so renaming is free.

2. **Mapping table from `ResolvedEvent.kind` → VM `kind` + `variant` + `artSlug`:**

   | engine `kind` | VM `kind` | VM `variant` | art slug |
   |---|---|---|---|
   | `'encounter'` (isBoss=false) | `combat-prelude` | `encounter` | `encounter` |
   | `'encounter'` (isBoss=true) | `combat-prelude` | `boss` | `boss` |
   | `'interaction'` (no dialogue) | `narrative-choice` | `npc` | `interaction-generic` |
   | `'interaction'` (with dialogue) | `narrative-choice` | `npc` | `interaction-generic` (cursor-driven) |
   | `'gathering'` | `narrative-choice` | `gather` | `gathering` |
   | `'rest'` | `narrative-choice` | `rest` | `rest` |
   | `'village'` | `narrative-choice` | `quest` | `village` |
   | `'cutscene'` | `narrative-choice` | `quest` | `cutscene` |
   | `'hazard'` | `narrative-choice` | `quest` | `hazard` |
   | `'loot-cache'` | `narrative-choice` | `quest` | `loot-cache` |
   | `'none'` | n/a — `selectHasActiveEvent` false | n/a | n/a |

   The `EventVariant` enum extends to `'encounter' | 'boss' | 'quest' | 'rest' | 'gather' | 'npc'` (unchanged from Phase 6). `'village'` / `'cutscene'` / `'hazard'` all use `variant: 'quest'` because they have no dedicated visual treatment yet — that's a follow-up polish phase.

3. **Body-text source change.** The old `ProcessNodeResult.message` field is gone. Each new `MapEventPayload` carries an optional `description: string`. Mobile reads:
   - If `event.description` (from the payload) is non-empty → use it.
   - Otherwise, fall back to a kind-keyed default string (single-source-of-truth in `event-assets.ts` next to the slug map).
   - This is the SAME pattern as the old code's `result.message` fallback; just sourced differently.

4. **`'cutscene'` rendering.** Engine returns `lines: readonly string[]`. Mobile composes `body = lines.join('\n\n')` (paragraph break per line). A future polish phase may add line-by-line paging; this phase ships the no-paging baseline. `canSkip` is `true` for cutscenes (auto-resolved single-choice).

5. **`'hazard'` rendering.** Engine `state` already had effects/damage applied by `resolveMapEvent`. The mobile VM surfaces the damage as a consequence chip (`{ kind: 'damage', amount: event.damage }`) and the applied effects as additional chips (`{ kind: 'flag', label: effect.id }` — best available — drop richer mapping for follow-up). Single choice: `'ACKNOWLEDGE'` → clears slice.

6. **`'village'` rendering.** Engine returns `villageName: string` + optional `merchants: NPC[]`. Mobile shows `title = villageName.toUpperCase()`, body from `description`, single `'LEAVE'` choice — shop UI stays deferred (was already Spec 08 Phase-6 follow-up).

7. **Dialogue cursor compatibility.** The interaction-with-dialogue path (Phase 6 Tick B's `applyDialogue` walk) still works — `DialogueTree` / `DialogueNode` / `DialogueChoice` exports unchanged, `applyDialogueChoice` standalone still in `World/dialogue.runtime.d.ts`. Only the wrapper changes: `result.event.dialogue` is now on `InteractionPayload`.

8. **Exploration screen scope freeze.** This phase touches `state/actions.ts` only for the event-action block. `moveToAction` and its world-completeNode / unlockNode flow stay as they were — a future phase migrates them to `revealAdjacent` / `markNodeConsumed`. Phase 23's brief explicitly forbids touching `moveToAction`.

9. **Renamed `processNode` engine action.** The `GameActions.processNode()` method on the store is still present at runtime in 0.7.0 (verified). Mobile **does not call it** — the action layer uses the standalone pure `resolveMapEvent(state)` function. The deprecated store method may disappear in a future minor; we don't rely on it.

10. **Test fixture shape:** Drop the `gameState: undefined as never` / `objectivesProgressed: []` / `questsCompleted: []` / `message: '...'` cruft from the Phase 6 fixtures. `ResolveMapEventResult` is just `{ state, event }`. Tests build:
    ```ts
    function makeRestResult(healed, description) {
      return {
        state: undefined as never,
        event: { kind: 'rest', healed },
      };
    }
    ```
    And pass `description` via the payload field where the kind supports it.

## Sub-tick decomposition (for `/ship-a-phase`)

The brief is one phase; `/ship-a-phase` may split across sub-ticks if verify-gate green can land between them. Recommended split:

- **Tick A (~1 tick):** type-level migration. Update `state/store.ts` slice type; update `state/presenters/event-assets.ts` slug enum + mapper; update `state/presenters/event.engine.ts` imports and `composeNarrative` switch for the new kinds. Rewrite `event.engine.test.ts` + `event-assets.test.ts` fixtures. **First green: verify passes.**

- **Tick B (~1 tick):** action layer. Rename `processCurrentNode` → `resolveCurrentMapEvent` on `AppActions`. Update `state/actions.ts` import (`resolveMapEvent` instead of standalone `processNode`). Update `pickEventChoice` branches for `'interaction'` (was `'npc'`) / `'gathering'` (was `'gather'`) / `'loot-cache'` (was `'treasure'`) / new `'cutscene'` / `'hazard'` / `'village'` auto-resolve paths. Update `state/e2e/event.engine.test.ts` action-layer cases. Verify green.

- **Tick C (~½–1 tick):** screen-side fixtures + VM coverage for the new kinds (`'village'`, `'cutscene'`, `'hazard'`). Update `state/e2e/event.screen.test.tsx` fixture helpers. Add at least one render test per new kind. Verify green.

- **Tick D (~½ tick):** close-out. Tick Phase 23 row to `[x]` in `01_build_plan.md`; un-defer Phase 26 (flip its row note back). Add Phase log entry. Comment on phase mirror issue (open it via `loop-issue.mjs phase-open` at Tick A's start). No code change in this tick.

If verify goes red between sub-ticks, halt and re-plan; do not stack work on a red gate (the whole point of this phase is to restore green).

## Verify gate

```bash
pnpm verify        # lint + tsc --noEmit + jest
```

Target: full suite green. Current baseline is **RED** — the engine bump broke verify at HEAD. Expected delta after Phase 23 (Tick D):

- Existing event tests rewritten in place (no net delta beyond renames).
- `+3` new tests in `event.engine.test.ts` for the new kinds (village / cutscene / hazard).
- `+3` new tests in `event-assets.test.ts` (one per new kind).
- `+1–3` new render tests in `event.screen.test.tsx` (probabilistic — village + cutscene + hazard render).

Approx **~325–330 hermetic** after ship from a pre-bump baseline of 321.

## Deploy gate

```bash
pnpm deploy:check
```

Stub exits 0 / fails on "no builds" (deploy is opt-in via EAS Build; Phase 11 wired the contract). No deploy-side change for Phase 23.

## Commit body template

For the canonical "Tick A" commit (the bulk of the type migration):

```
refactor(spec08): migrate event subsystem to resolveMapEvent (Phase 23 Tick A)

Engine 0.7.0 removed processNode / ProcessNodeResult / ProcessedEvent
in favour of resolveMapEvent / ResolvedEvent / ResolveMapEventResult
plus 8 typed MapEventKind payloads. Phase 6's event subsystem references
the removed types; this commit migrates the type layer and fixtures.

- state/store.ts: MobileEventSlice.pending typed against
  ResolveMapEventResult instead of ProcessNodeResult.
- state/presenters/event-assets.ts: slug enum expanded — adds
  'gathering', 'loot-cache', 'interaction-generic', 'village',
  'cutscene', 'hazard'; drops 'gather', 'treasure', 'npc-generic';
  mapper rewritten against ResolvedEvent kinds.
- state/presenters/event.engine.ts: composeNarrative switch
  rebuilt for the 8 kinds; body text now reads from
  event.description (per-payload) with a kind-keyed default
  fallback in event-assets.ts.
- e2e fixtures rebuilt; +3 new VM-shape tests for village /
  cutscene / hazard.

Decisions:
- VM shape stays unchanged (the screen reads the same shape).
- 'shop' / 'quest' / 'treasure' / 'gather' / 'npc' kind names
  swapped for the new engine names; mapping table in the brief.
- exploration moveToAction migration explicitly OUT OF SCOPE
  (separate phase candidate).

verify: N tests passing (was RED at HEAD before this commit).
```

## Definition of Done

After all sub-ticks land:

1. `pnpm verify` returns green. The baseline was RED at the start of Phase 23 because of engine 0.7.0 removals; reaching green is the headline metric.
2. `grep -r "ProcessNodeResult\|ProcessedEvent\|enginePureProcessNode" state/ app/ components/` returns empty.
3. `state/presenters/event.engine.ts` reads `ResolveMapEventResult` / `ResolvedEvent` types directly; no compatibility shim.
4. The 8 new `ResolvedEvent` kinds each have a VM-shape e2e test (one per kind, including the three new ones — village / cutscene / hazard).
5. Phase 23 row in `plan/steps/01_build_plan.md` flipped `[ ]` → `[x]` with the final commit hash.
6. Phase 26 row's "DEFERRED behind Phase 23" note is removed; Phase 26 returns to its original `[ ]` state ready for re-shipping.
7. Phase log entry appended.
8. PHASE_CANDIDATES.md Phase 23 Promoted row gets a close-out note pointing at the shipping commit.

## Follow-ups (out of scope this phase)

- **Phase 26 re-ship** — Drain stale presenter stubs. Original brief at `plan/phases/phase_26_drain_presenter_stubs.md` is unchanged; just deferred. Pick up after Phase 23 ships.
- **Exploration moveToAction migration** — `state/actions.ts:moveToAction` re-implements unlock propagation locally. Engine 0.7.0 ships `revealAdjacent` / `markNodeConsumed` reducers. File a fresh candidate for this; not part of Phase 23.
- **`'cutscene'` paged narration** — Tick C ships `body = lines.join('\n\n')` (no paging). A polish phase can add line-by-line presentation later.
- **`'village'` shop UI** — Same deferral as Phase 6's `'shop'` kind. Future phase.
- **`'hazard'` richer effect chip rendering** — Engine returns `ActiveEffect[]`; mobile surfaces them as generic `flag`-kind chips. A typed-effect-to-chip mapper is a polish row.
- **MapEvent pool authoring** — `registerMapEventPool` / `setDefaultMapEventPool` are engine-side authoring hooks. Mobile may want to register a "starter map" pool for default events; out of scope for Phase 23 (which is migration, not content).
