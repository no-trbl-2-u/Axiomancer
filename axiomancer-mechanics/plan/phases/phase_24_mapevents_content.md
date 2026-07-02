# Phase 24 — MapEvents content

> Brief for `/ship-a-phase`. All decisions pre-resolved.
> DO NOT ASK the user during implementation — decide and ship.

## Outcome

The `fishing-village` and `northern-forest` maps are migrated into the
Spec 23 pool shape. Every one of the eight `MapEventKind` values is
exercised by ≥1 node across the two maps. Pools register at module
load via a new `src/World/MapEvents/content.ts`. The game store's
`PROCESS_NODE` action and `game.cli.ts` `mapTab` dispatch through
`resolveMapEvent` instead of the legacy `processNode`. A small
hermetic e2e walks a multi-node tour through fishing-village and
asserts the new flow produces the expected kinds.

**Scope deviation from Spec 23 Q7.** Spec 23 promised that Phase 24
would *remove* `processNode`, `MapEvent`, and `MapEventType`. That
removal is deferred to a follow-up phase because the existing
`src/World/e2e/world.engine.test.ts` suite has ~10 cases pinned on
`processNode` semantics and rewriting them is larger than the
content-migration intent of this phase. After Phase 24 ships, the
old surface is **deprecated but functional**; a follow-up cleanup
phase will rewrite the dependent tests and delete the legacy
dispatcher.

## Source spec

`specs/23-map-events.md` defines the engine; Phase 24 just authors
content against it and threads the dispatcher through the game
reducer + CLI.

Resolved questions:

1. **Pool granularity — per-region or per-node?**
   Per-node override. Each existing fv-N / nf-N node gets its own
   single-entry pool. This honors "≥1 node per event type" by
   mapping specific nodes to specific kinds and keeps the migration
   1:1 with the existing authored events.
2. **Coverage map (fishing-village).**
   - `fv-1` cutscene, `fv-2` interaction (Old Marrow),
   - `fv-3` village (Tide-Shopkeeper), `fv-4` encounter (wet-hound),
   - `fv-5` loot-cache (10 currency), `fv-6` encounter (boss: coastal-tyrant),
   - `fv-7` interaction (beggar), `fv-8` gathering (driftwood),
   - `fv-9` rest (full heal), `fv-10` hazard (small DoT).
3. **Coverage map (northern-forest).**
   - `nf-1` cutscene (entering the wood),
   - `nf-2` gathering, `nf-3` hazard,
   - `nf-4` rest (was authored — keep), `nf-5` loot-cache,
   - `nf-6` encounter, `nf-7` interaction (forest hermit — author),
   - `nf-8` village (forest market — author),
   - `nf-9` encounter, `nf-10` cutscene (the cave mouth).
4. **Where do pools register?**
   `src/World/MapEvents/content.ts` — imports `registerMapEventPool`
   + `setNodeEventPoolOverride` + `setDefaultMapEventPool` and
   side-effects at module load. `src/World/index.ts` imports
   `content` for the side effect so any consumer of the public
   barrel gets the pools registered.
5. **Game store wiring.**
   `gameReducer`'s `PROCESS_NODE` action stops dispatching
   `processNode` and instead calls `resolveMapEvent(state)`. The
   action returns the new `GameState` only; the event payload is
   surfaced through the existing event-emitter path. (Phase 24
   doesn't change the event surface — the store still emits
   `world:processed`; the payload just comes from the new resolver.)
6. **CLI wiring.**
   `src/CLI/game.cli.ts` `mapTab` swaps `processNode(before)` for
   `resolveMapEvent(before)`. Result type unification: the existing
   `result.event.kind === 'encounter'` branch keeps working since
   both surfaces emit `kind: 'encounter'`. Other kinds get
   minimal-prose log lines.
7. **Tests?**
   - Add `src/World/MapEvents/e2e/content.engine.test.ts` — walks a
     multi-node tour through fishing-village and asserts each kind
     resolves correctly.
   - Leave `src/World/e2e/world.engine.test.ts` as-is. The
     `processNode` cases continue to pass against the legacy
     dispatcher (which still exists).
8. **Where do "new" NPCs / merchants live for nf-7 / nf-8?**
   Inline in `content.ts` as minimal `NPC` records. The full
   character / world specs land in Phase 22's content/ tree at a
   later authoring pass.
9. **Backward-compat shim.**
   The legacy `nodeEvents` block on `MapDefinition` stays in place
   (untouched). `processNode` still reads it. The new dispatcher
   ignores it and consults the pool registry instead.

## Implementation units (commit per unit)

### Unit 1 — Author `src/World/MapEvents/content.ts`

The file declares two pool blocks (one per map), registers them via
the API from `resolve-map-event.ts`, and sets per-node overrides for
all 20 nodes. Inline minimal NPC records for the new
`forest-hermit` and `forest-marketeer` slots; reuse the existing
fishing-village NPCs by name.

Commit: `feat(world): author fishing-village + northern-forest pools (20 nodes / 8 kinds)`

### Unit 2 — Side-effect import in the World barrel

File: `src/World/index.ts` — import `./MapEvents/content` for its
side effect (pool registration on module load). Document in the
file header that consumers get pools registered automatically when
they import from `'axiomancer-mechanics'`.

Commit: `feat(world): auto-register MapEvent pools on barrel import`

### Unit 3 — Switch the game store to `resolveMapEvent`

File: `src/Game/game.reducer.ts`:
- Replace `processWorldNode(state).gameState` in the `PROCESS_NODE`
  branch with `resolveMapEvent(state).state`.
- Drop the `processNode as processWorldNode` import.

The legacy `processNode` is no longer imported by `gameReducer`; the
function still exists at `src/World/process-node.ts` for the world
e2e suite until the follow-up cleanup phase.

Commit: `refactor(game): PROCESS_NODE dispatches resolveMapEvent`

### Unit 4 — Switch the CLI to `resolveMapEvent`

File: `src/CLI/game.cli.ts`:
- Replace `processNode(before)` with `resolveMapEvent(before)`.
- The result shape changes: `result.gameState` → `result.state`;
  `result.event.kind === 'encounter'` keeps the same shape (the new
  `ResolvedEvent` covers it).
- Update the `if (result.event.kind === 'encounter')` branch to
  read `result.event.encounter.enemies` from the new shape.
- Update the `log(result.message)` call: the new engine doesn't ship
  a `message` field. Emit a one-line summary per kind via a small
  helper.

Commit: `refactor(cli): mapTab uses resolveMapEvent + handles all 8 kinds`

### Unit 5 — Hermetic content test

File: `src/World/MapEvents/e2e/content.engine.test.ts` (new). One
case per map walks the start-to-end node chain, asserting that
`resolveMapEvent` produces the expected kind at each step. Use
`mockSequentialRng` to keep the encounter generator deterministic.

Commit: `test(world): hermetic e2e walking fishing-village + northern-forest pools`

### Unit 6 — Verify gate + DoD

- Run `npm run verify` and `npm run deploy:check`.
- Flip Phase 24 in `plan/steps/01_build_plan.md` to `[x]`.
- Add a follow-up entry to `plan/PHASE_CANDIDATES.md` for the
  `processNode` + legacy-type cleanup phase deferred from this one.

Commit: `plan: phase 24 shipped — MapEvents content + dispatcher switch`

## Decisions made upfront — DO NOT ASK

- **Per-node single-entry pool overrides.** Predictable, easy to
  test, mirrors the existing authored-event mapping.
- **Pools register via side-effect import** through the world
  barrel.
- **`processNode` stays in place.** Deferred to a follow-up cleanup
  phase per the scope-deviation note above.
- **No semver bump** — pre-1.0, additive surface.
- **No new NPC spec files** for nf-7/nf-8 stub NPCs; inline in
  `content.ts` and let Phase 22's authoring skills produce real
  bios at a later pass.

## Verify gate

```bash
npm run type-check
npm test
npm run verify
npm run deploy:check
```

## Definition of Done

- [ ] `src/World/MapEvents/content.ts` exists and registers 20 pool
      overrides across the two maps
- [ ] All 8 `MapEventKind` values appear ≥1 in the registered pools
- [ ] `src/World/index.ts` side-effect-imports `content.ts`
- [ ] `gameReducer`'s `PROCESS_NODE` dispatches `resolveMapEvent`
- [ ] `src/CLI/game.cli.ts` `mapTab` dispatches `resolveMapEvent`
- [ ] `src/World/MapEvents/e2e/content.engine.test.ts` exists and
      walks both maps
- [ ] `npm run verify` exits 0
- [ ] `npm run deploy:check` exits 0
- [ ] `plan/steps/01_build_plan.md` Phase 24 row flipped to `[x]`
- [ ] A "deferred cleanup" candidate row exists in
      `plan/PHASE_CANDIDATES.md` for removing `processNode`,
      `MapEvent`, `MapEventType`

## Follow-ups (out of scope)

- Remove `processNode`, `MapEvent`, `MapEventType`; rewrite
  `src/World/e2e/world.engine.test.ts` to use `resolveMapEvent`.
  Track as a Z-MED candidate.
- Author real character/world specs for the inline `forest-hermit`
  + `forest-marketeer` placeholders through `/character-spec` and
  `/world-spec`.
