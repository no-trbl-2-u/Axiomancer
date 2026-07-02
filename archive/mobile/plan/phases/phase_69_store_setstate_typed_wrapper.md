# Phase 69 — `store.setState` typed-wrapper sweep

> Drain ~9 `(store.setState({ ... } as any))` casts in
> `state/actions.ts` via a one-shot typing fix at the wrapper
> layer. Mirror the cleanup pattern that closed 4 cast-drift
> rows on the presenter side this session.

**Source:** `PHASE_CANDIDATES.md` pass-35 entry, score **5.5**.
Promoted via `/oversight` 2026-05-22 (30th call).

---

## 1. Why

5 of the last 8 closed audit rows were `(state as any)` /
`as any` cast-drains in presenters
(`(player as any).effects`, `(state as any).quests`,
`(state as any).moralMeter`, `(state as any).philosophicalAlignment`,
`(playerChoice as any).skillId`). The drained presenters were
straightforward; `state/actions.ts` is the holdout — **9 of 14**
`store.setState({ ... } as any)` calls still cast because the
Zustand wrapper's `setState` argument type doesn't admit the
mobile-side `AppStoreState` extras (`_recentEvents`,
`combatMana`, …).

Doing them one-at-a-time is fine but a single `setState`
typing fix would close the cluster cleanly.

## 2. Root cause hypothesis (Tick A's first task)

The Zustand store wrapper's `setState` is typed as
`(partial: GameStore) => void` (engine-shape only) while
callers pass `Partial<AppStoreState>` (engine-shape **plus**
mobile-private slices). Three possible fixes — Tick A picks
the cleanest:

1. **Widen the wrapper's argument type.** If the wrapper sits
   in `state/store.ts`, change its signature to admit
   `Partial<AppStoreState>`. Most surgical.
2. **Introduce a typed helper.** `setAppState(partial)` lives
   alongside the wrapper, calls into `store.setState`, casts
   once internally. Callers go through the helper.
3. **Widen `AppStoreState` itself** so engine `GameStore`'s
   `setState` already accepts it. Probably overreach; flagged
   as a fallback only.

## 3. Inventory — sites to drain (from expand pass-35)

Per `state/actions.ts` (line numbers may drift as the file
evolves):

- `262, 267, 274` — combat / combatMana setup paths
- `425, 427` — `lastResolution`-bearing combat state
- `560` — `enemyAction.action` cast
- `610` — combat-end commit path
- `876, 898` — `world` setState in `moveToAction` /
  `changeMapAction`
- `969` — `player` setState in `debugSeedAction`
- `989` — `world` setState in `debugSeedAction`
- `1011` — `player` setState in `applyCharacterPresetAction`
- `1062` — `resolvedState` + `event` setState in
  `resolveCurrentMapEvent`

The shape of every site is identical: build a partial state,
`as any` to satisfy the wrapper, hand to `store.setState`.

## 4. Scope

**1 phase, 2 ticks.**

### Tick A — typing fix + co-located test

- Investigate root cause (§2). Pick the surgical option.
- Land the typing fix (or `setAppState` helper) with a
  hermetic test pinning: a partial with only engine slices
  type-checks, a partial with `_recentEvents` /
  `combatMana` type-checks, a partial mixing both
  type-checks, a partial with a field NOT on
  `AppStoreState` is a tsc error.
- Drain ONE call site as proof-of-concept. Likely the
  cheapest — `combatMana: null` at line 267.
- Commit: `feat(spec69a): typed setAppState wrapper drops
  setState `as any` boundary — Phase 69 Tick A`.

### Tick B — drain the remaining 8+ sites

- Apply the new wrapper / helper across the 8+ remaining
  call sites listed in §3.
- No runtime change expected — inputs/outputs identical.
- Close any latent `[2.5]` DRIFT rows in `AUDIT.md` that
  the rotation hasn't reached yet (the cast cluster).
- Commit: `refactor(actions): drain 8 store.setState `as any`
  casts via typed setAppState — close Phase 69 Tick B`.

## 5. Verify gate

- All 1060+ existing tests stay green.
- New typing-contract test in Tick A.
- `pnpm verify` green at both Tick A and Tick B land.

## 6. Out of scope

- Test-file `as any` casts (e.g.
  `state/e2e/memoir.engine.test.ts:264`). Tests legitimately
  synthesize ad-hoc shapes; the cast there is intentional
  fixture noise, not a typing gap.
- The single `state as any` cast in
  `state/persistence/migrations.ts:34`. Migrations
  deliberately operate on `unknown`-shaped persisted blobs
  pre-validation; the cast is necessary, not drift.
- Any wider Zustand wrapper redesign. This is a typing fix,
  not a state-mgmt refactor.

## 7. Conflicts

None. Typing-only fix at a well-isolated boundary; no
runtime change, no consumer surface change.

## 8. Trail

- Filed: `plan/PHASE_CANDIDATES.md` pass 35 entry
  (`0a3de06`).
- Promoted: oversight 30th call, this commit.
- Brief: this file.
