# Phase 7 — Spec 09: AsyncStorage persistence adapter

> Shipped autonomously by `/march` on 2026-05-13. The first
> phase the loop built from scratch (vs. close-out / bookkeeping
> for pre-loop work). Verify gate green at 200 / 200.

## Scope

Ship a `PersistenceAdapter` (engine interface) backed by React
Native's `AsyncStorage`. Wire it into the root layout so cold
launches restore the last `GameState`; tests stay on
`memoryAdapter` and inject a fake `storage` for call-count
assertions.

See `specs/09-asyncstorage-persistence.md` for the locked
contract.

## Files shipped

```
state/persistence/asyncStorageAdapter.ts                       # factory + preload/save/flush/clear
state/persistence/migrations.ts                                # CURRENT_SCHEMA_VERSION + wrap/unwrap + MigrationMap
state/persistence/e2e/asyncStorageAdapter.engine.test.ts       # 15 hermetic tests
app/_layout.tsx                                                # mounts adapter; awaits preload before GameStoreProvider
package.json                                                   # +@react-native-async-storage/async-storage 2.2.0
package-lock.json                                              # transitive deps
specs/09-asyncstorage-persistence.md                           # 7 Qs answered, checklist ticked, [DONE] header
```

## Verify gate

```bash
npm run verify
```

Confirmed green: lint clean (7 pre-existing unused-import
warnings, 0 errors), typecheck clean, **200 / 200 tests pass**
(13 prior suites + the new `asyncStorageAdapter.engine.test.ts`).

## Deploy gate

```bash
npm run deploy:check
```

Stub (exit 0) until Phase 11. Unchanged by Phase 7.

## Tests

`state/persistence/e2e/asyncStorageAdapter.engine.test.ts`
(15 tests). Hermetic via two layers:

- **AsyncStorage integration** — the official jest mock
  (`@react-native-async-storage/async-storage/jest/async-storage-mock`)
  for round-trip tests (`preload reads saved envelope`,
  `clear removes the stored save`, corruption / future-version
  throw paths).
- **Call-count assertions** — use the adapter's injected
  `storage` option with a `jest.fn()` triad
  (`getItem`/`setItem`/`removeItem`). This sidesteps a `jest.spyOn`
  pitfall where the module-level AsyncStorage mock accumulated
  call history across tests; injection gives each test a clean
  storage instance.

Coverage:

- `preload + load` — null on empty, round-trip envelope,
  corrupt-JSON throw, future-version throw.
- `save (debounced)` — cache updates immediately, 500ms window
  coalesces bursts into one write, `debounceMs: 0` writes
  synchronously, `flush` is a no-op when no pending write.
- `clear` — wipes cache + storage, cancels a pending debounced
  write.
- `migrations` — identity at CURRENT, future-version throw,
  malformed-envelope throw, forward-migration chain (covered
  via a `0 → 1` synthetic path that future bumps will reuse).

## Decisions made upfront — DO NOT ASK

All seven mirrored from `specs/09-asyncstorage-persistence.md`:

1. **Adapter lives in this repo** —
   `state/persistence/asyncStorageAdapter.ts`. Engine-package
   ownership (Spec B) is the engine team's call.
2. **Single key** `'@axiomancer/save:v1'`. Coherent with Q5
   (one slot).
3. **500ms debounce** in production. Bursts of state writes
   coalesce into one `AsyncStorage.setItem`. Tests use either
   `debounceMs: 0` (sync) or `flush()` (drain on demand).
4. **Embedded `schemaVersion`** + `MigrationMap` keyed by
   source version. At v1 the map is empty; bumping the constant
   to N and adding `MigrationMap[N-1]` is the contract.
5. **One save slot** — no save-select UI.
6. **No encryption.** State has no PII or networked content.
7. **Throw on corruption.** `app/_layout.tsx` catches the
   throw, logs, and proceeds with a fresh state (cache stays
   null → provider's `createNewGameState` is the boot path).
   The "save corrupted" UX modal is a follow-up.

Additional engineering decisions:

- **Adapter API extends `PersistenceAdapter`** with `preload`,
  `flush`, and `clear`. The engine contract only requires
  sync `load` + `save`; the AsyncStorage bridge needs async
  bootstrap and a flush primitive for graceful shutdown / tests.
- **Module-level singleton adapter** at the top of
  `app/_layout.tsx`. Reasoning: there's one save slot, and the
  preload cache must survive React Hot Reload boundaries so
  hot-reload doesn't blank state on every save. Tests bypass
  the singleton via the provider's `adapter` / `store` props.
- **`storage` is injectable.** This is what made the hermetic
  tests possible — call-count assertions inject a fake instead
  of spying on the global AsyncStorage mock.

## `[needs-user-call]` rows logged in `plan/AUDIT.md`

None opened by this phase.

## Mobile reflow / responsive considerations

N/A — persistence layer, no UI surface.

## Git

Single atomic commit `feat(spec09): asyncStorage persistence
adapter (Phase 7)`. The phase row flip + Phase log entry land
in a follow-up `plan: phase 7 shipped — AsyncStorage
persistence` commit (canonical DoD pattern).

## DoD

1. Adapter + migrations + hermetic e2e shipped.
2. `app/_layout.tsx` calls `preload()` and mounts
   `<GameStoreProvider adapter={adapter}>`.
3. `specs/09-asyncstorage-persistence.md`'s seven Qs answered;
   acceptance checklist ticked (with "manual physical-device
   verification" left unticked as a stated honest gap).
4. Spec 09 status header: `[DONE on 2026-05-13 — see commit
   <hash>]`.
5. Spec 09 moved to "Already shipped" in the build plan.
6. Phase 7 row: `[ ]` → `[x]`.
7. Phase log entry added.

## Confirm deploy

```bash
npm run deploy:check
```

Exit 0 (stub).

## Follow-ups (out of scope this phase)

- **Save-corrupted UX modal** (Spec 09 Q7's "surface to user"
  half). Adapter already throws; layout currently logs. Add a
  recoverable modal during a screen-polish tick.
- **Manual cold-start verification** on a real device once
  Phase 13 (TestFlight / Play Internal Track) wires the build
  pipeline.
- **Storybook / dev-only adapter override.** Spec 09's
  proposed approach §7 mentions `__DEV__` switching. The
  current wiring uses AsyncStorage in dev too (hot-reload
  retains preload cache). Add an override hook if devs need
  to flush state between iterations.
