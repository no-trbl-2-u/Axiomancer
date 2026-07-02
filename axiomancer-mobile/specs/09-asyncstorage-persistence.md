# Spec 09 — AsyncStorage Persistence Adapter

[DONE on 2026-05-13 — see commit (this commit)]

## Goal

Ship a persistence adapter that satisfies the engine's
`PersistenceAdapter` interface and writes to React Native's
`AsyncStorage`, so the player's game state survives app restarts.
Wire it into the store provider (Spec 02) so production runs are
durable while tests stay on `memoryAdapter`.

**Success state:** Quitting and re-launching the app restores the
last saved `GameState`. The adapter is hermetically tested against
a `jest.mock('@react-native-async-storage/async-storage')` fixture.

## Why now / dependencies

- **Unblocks:** real playtests that span days; "save and quit" UX.
- **Depends on:** Spec 02 (store provider needs to accept the
  adapter). Coordinates with engine Spec 12 (which decides whether
  the package ships an `asyncStorageAdapter` itself or expects each
  consumer to roll their own).

## Current state

- `package.json` does **not** include
  `@react-native-async-storage/async-storage` as a dep.
- The engine package exposes `nullAdapter` and (probably) Node-only
  `fsAdapter`. React Native consumers must supply their own.
- The provider in Spec 02 defaults to `nullAdapter` — no persistence
  in production without this spec.

## Open questions

1. **Where the adapter lives.**
   - (A) **(default)** This repo: `state/persistence/asyncStorageAdapter.ts`.
   - (B) The engine package, behind a subpath export. Coordinate
     with engine Spec 12 first.
   > Your answer: A — `state/persistence/asyncStorageAdapter.ts`.

2. **Save key namespace.** `'@axiomancer/save:v1'` or per-slot
   (`'@axiomancer/save:slot1'` etc.)?
   > Your answer: Single key `'@axiomancer/save:v1'` — consistent
   > with Q5 (one slot).

3. **Save cadence.** When does the adapter persist?
   - (A) **(default)** Debounced (500 ms) on every state change in
     production; never in tests.
   - (B) Manual only — user taps "Save".
   - (C) On specific actions (combat end, node entered).
   > Your answer: A — 500ms debounce; tests inject a fake `storage`
   > so writes are observable but not async-storage-bound. Also, leave a comment near this code to point out that we're testing this vs. manual save

4. **Schema versioning.** State shape will change. Migration story:
   - (A) **(default)** Embed `schemaVersion: number` in the saved
     blob; on load, run sequential migrations.
   - (B) Bump the storage key (`save:v1` → `save:v2`); old saves
     archived.
   > Your answer: A — embedded `schemaVersion` + forward-migration
   > map (`state/persistence/migrations.ts`). At v1 there are no
   > migrations; bumping `CURRENT_SCHEMA_VERSION` and adding a
   > `MigrationMap` entry keyed by source version is the contract.

5. **Multiple slots.** Today the design assumes one save. Slots:
   - (A) **(default)** One slot, no UI for multiple saves.
   - (B) Three slots with a save-select screen on launch.
   > Your answer: A.

6. **Encryption.** State has no PII / no networked content. Encrypt
   anyway?
   - (A) **(default)** No.
   - (B) Yes, with `expo-secure-store` for the key.
   > Your answer: A — no encryption.

7. **Corruption recovery.** If JSON.parse fails:
   - (A) **(default)** Throw, surface to user with "save corrupted —
     start new game?" modal.
   - (B) Silently start a new game and log to crash reporter.
   > Your answer: A — adapter throws. Minimum-viable host
   > behaviour in this phase: `app/_layout.tsx` catches the throw,
   > logs a warning, and boots with a fresh state (cache stays
   > null → provider falls through to `createNewGameState`). The
   > UX modal is a follow-up — flagged in this spec's Out of scope.

## Proposed approach

1. **Add `@react-native-async-storage/async-storage`** as a runtime
   dep.
2. **`state/persistence/asyncStorageAdapter.ts`** implementing the
   engine's adapter interface (`save`, `load`, `clear` per the
   engine's published `.d.ts`).
3. **Debounce wrapper** if Q3 picks (A) — wraps the adapter so
   bursts of state changes coalesce into one write.
4. **Schema migration runner** — `state/persistence/migrations.ts`
   if Q4 picks (A).
5. **Wire into the provider** (Spec 02) — production uses the new
   adapter; tests still pass `memoryAdapter`.
6. **Hermetic e2e** at `state/persistence/e2e/asyncStorageAdapter.engine.test.ts`:
   - Mock `@react-native-async-storage/async-storage`.
   - `save(state)` writes the JSON; `load()` returns the same shape.
   - Corruption: malformed JSON → throws / surfaces error per Q7.
   - Migration: a v1 blob loads through a v1→v2 migration into the
     current shape.
7. **Update `app/_layout.tsx`** to pick adapter based on
   `__DEV__` / `process.env.NODE_ENV` so storybook / dev tools can
   override.

## Acceptance checklist

- [x] All 7 questions answered.
- [x] `@react-native-async-storage/async-storage` in dependencies
      (`2.2.0`, expo-aligned).
- [x] Adapter implements the engine's `PersistenceAdapter`
      interface; type-checked.
- [x] Debounce + migration helpers covered by hermetic e2e
      (`state/persistence/e2e/asyncStorageAdapter.engine.test.ts`,
      15 tests).
- [ ] Manual: cold start with seeded save → restored player /
      world / inventory. **Pending physical-device verification**;
      the hermetic e2e exercises every adapter code path but
      can't substitute for end-to-end RN-runtime confirmation.
- [x] `npm test` and `npx tsc --noEmit` clean (200 / 200).

## Out of scope

- Cloud sync (iCloud / Drive) — future spec.
- Save export / import — future spec.
- Save slot management UI — Q5 picks (A) for now.
- "Save corrupted — start new game?" UX modal (Q7) — adapter
  throws; layout currently logs + starts fresh. Modal lives in
  a screen-polish follow-up.
