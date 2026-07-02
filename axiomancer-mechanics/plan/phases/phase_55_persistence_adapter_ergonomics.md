# Phase 55 — PersistenceAdapter ergonomics (Phase 50 follow-up)

> Promoted via `/oversight` 2026-05-20 (fifth oversight of the session,
> commit `0b8dc81`) from expand-pass-11 candidate `ce88559`. Brief
> authored 2026-05-20 at commit `8ec894c`.

## Source

- `plan/PHASE_CANDIDATES.md` Promoted entry "Phase 55 — PersistenceAdapter ergonomics".
- `axiomancer-mobile/docs/engine-team-handoff-2026-05-16.md` §"Issue 3" (the original complaint).
- `axiomancer-mobile/state/persistence/asyncStorageAdapter.ts` (mobile-side consumer).
- `src/Game/persistence/types.ts` (engine-side `PersistenceAdapter` declaration).

## Re-scoping decision (made upfront)

**The candidate's premise is outdated.** Reading
`axiomancer-mobile/state/persistence/asyncStorageAdapter.ts` post-0.10.1
shows mobile is NOT locally re-declaring `PersistenceAdapter`. The
first import line is:

```ts
import type { GameState, PersistenceAdapter } from 'axiomancer-mechanics';
```

Mobile then extends the imported interface to add async helpers:

```ts
export interface AsyncStorageAdapter extends PersistenceAdapter {
    preload(): Promise<void>;
    flush(): Promise<void>;
    clear(): Promise<void>;
}
```

This is **the correct architectural pattern** for bridging the engine's
synchronous `load() / save()` contract to AsyncStorage's async I/O.
Issue 3's original complaint ("Mobile locally re-declares the
`PersistenceAdapter` interface ... because the engine's interface
either isn't exported at the top level or its shape has drifted") was
either:

- Discoverability — `PersistenceAdapter` not reachable from
  `'axiomancer-mechanics'` (top-level barrel) at the time. Phase 50's
  types.d.ts emission fix + the existing `src/Game/index.ts` re-export
  through `src/index.ts:152` already resolved this. `grep -n
  "PersistenceAdapter" src/index.ts` returns the type-export line.
- Shape drift — none observed today. The engine's interface stayed at
  the same two-method shape (`load(): GameState | null` + `save(state:
  GameState): void`) since pre-loop, and mobile's extension is purely
  additive.

So **no engine-side code change is needed**. Phase 55's value is
documentary + contract-pinning:

## Goal — one-line outcome

Document the canonical "extend `PersistenceAdapter`" pattern as the
recommended approach for adding async / debounced / lifecycle
behavior to a consumer-side adapter, with mobile's
`AsyncStorageAdapter` as the reference implementation. Add a hermetic
test asserting the engine interface is type-importable from the
top-level barrel with the expected shape.

## Decisions (made upfront)

### D1 — No engine code change; docs + test only

Per the re-scoping above, the engine's `PersistenceAdapter` shape is
already what mobile and any other consumer needs. Changing it would
break existing consumers (mobile, Node CLI via `node.adapter.ts`,
`nullAdapter`). Stick to docs + test.

### D2 — JSDoc on the interface names the inheritance pattern

Extend the existing JSDoc on `src/Game/persistence/types.ts` to (a)
clarify that the synchronous shape is intentional — consumers wanting
async behavior should extend the interface, not re-declare; (b) name
mobile's `AsyncStorageAdapter` as the reference implementation; (c)
cross-link to the Node adapter as the bundled implementation for CLI
consumers.

### D3 — Hermetic test pins the type-import + the field shape

`src/test-utils/e2e/public-barrel.engine.test.ts` (Phase 50) already
covers runtime-exports. Add a small block to it asserting
`PersistenceAdapter` is type-importable from the package's public
barrel + the two-method shape is intact. Use a fake adapter
implementation in the test to compile-check the contract.

## Commit units

### Unit 1 — JSDoc + canonical extension pattern documentation

Files:
- `src/Game/persistence/types.ts` — extend the existing JSDoc on the
  `PersistenceAdapter` interface with the inheritance-extension
  guidance + cross-links to the bundled Node adapter and mobile's
  AsyncStorageAdapter as references.
- `docs/gameloop.md` — extend the persistence subsection (around line
  170-200) with a "Extending PersistenceAdapter for async backends"
  paragraph naming the pattern.

Verify: `npm run verify`.

Commit: `docs(persistence): document PersistenceAdapter extension pattern (Phase 55 unit 1)`.

### Unit 2 — Hermetic public-barrel test extension

Files:
- `src/test-utils/e2e/public-barrel.engine.test.ts` — new describe
  block: `Phase 55 — PersistenceAdapter is reachable + shape-stable`.
  Asserts the type imports from `'../../index'` (the public barrel),
  builds a fake adapter implementation against the interface
  (compile-check the shape), and verifies `load()` / `save()`
  signatures match the documented contract.

Verify: `npm run verify` + `npm run deploy:check`. No fixture refresh
needed (this phase adds no new public-barrel names).

Commit: `test(persistence): Phase 55 unit 2 — pin PersistenceAdapter barrel shape`.

## Verify gate

`npm run verify` + `npm run deploy:check` — both green. No public-surface fixture refresh needed.

## DoD

- Phase 55 row in `plan/steps/01_build_plan.md` flips `[ ]` → `[x]`.
- `src/Game/persistence/types.ts` JSDoc names the extension pattern + reference implementations.
- `docs/gameloop.md` persistence subsection covers the extension pattern.
- `src/test-utils/e2e/public-barrel.engine.test.ts` carries the new shape-stability assertions.

## Out of scope

- Changing the engine's `PersistenceAdapter` interface shape (D1 — would break existing consumers; the shape is what mobile + node.adapter + nullAdapter already need).
- Adding an async PersistenceAdapter variant (`AsyncPersistenceAdapter`) to the engine — consumers would still need to bridge async/sync at some boundary; the engine-internal sync contract is the cleaner boundary.
- Re-running the upgrade doc for mobile — `axiomancer-mobile/docs/engine-upgrade-0.7.0-to-0.10.0.md` already explicitly carved out Issue 3 as "no engine change needed."
