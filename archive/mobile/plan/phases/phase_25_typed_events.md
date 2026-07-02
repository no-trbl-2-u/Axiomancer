# Phase 25 — Typed event surface consumer (engine 12 / 21 catch-up)

> **Status: [ ] — promoted via `/oversight` 2026-05-15.**
> Score 5.0. Engine 0.7.0 ships a typed event emitter
> (`createEventEmitter()`) + 10 typed event variants + 10
> `is*Event` guards. The mobile store hasn't wired the
> emitter — typed events fire into the void on every engine
> dispatch.
>
> Sized **2 ticks**.

## Outcome

The mobile `createAppStore` constructs a `GameEventEmitter`, passes it to `createGameStore`, and exposes it for downstream consumers. A new presenter slice `selectRecentEngineEvents` returns the last-N typed events for observability. The combat log doesn't change shape — engine `combat:round` events carry only `{ state }`, not the per-event detail mobile already extracts from `resolveCombatRound` directly. Phase 25 wires the channel and demonstrates consumption; later phases (or `/iterate` rows) can route specific event kinds into user-visible surfaces (level-up badge auto-clear, inventory toast feedback, dialogue-applied confirmation).

## Routes / API endpoints / CLI surface — locked

No route changes. Internal-only refactor.

## Content / data reads — engine surface

Every read is from `axiomancer-mechanics` top-level barrel.

| Helper / type | From | Use |
|---|---|---|
| `createEventEmitter()` | top-level | Construct an emitter in `state/store.ts`; pass to `createGameStore` as the third arg |
| `GameEventEmitter`, `GameEvent`, `GameEventHandler` | top-level | Typing for the emitter wiring |
| `TypedGameEvent` + the 10 typed variants | top-level (`TypedCombatStartedEvent` etc.) | Strong-typed listeners |
| 10 `is*Event` guards | top-level | Narrow `GameEvent` to a typed variant inside `onAny` handler |
| `EnginePayload` | top-level | `{ action, state, report? }` carried on typed events |

## Components / handlers — modified

**Modified files:**

- `state/store.ts`
  - Import `createEventEmitter` + `GameEventEmitter` type.
  - In `createAppStore`, construct a single emitter per store. Pass it as the third arg to `createGameStore(adapter, overrides, emitter)`.
  - Expose the emitter on the mobile store: extend `AppStoreState` with a non-engine field `_emitter?: GameEventEmitter` (or stash it in a parallel context — see Decisions).
- `state/GameStoreProvider.tsx`
  - New hook `useGameEvents(handler: GameEventHandler): void` that subscribes via `emitter.onAny` on mount, returns cleanup. Stable subscription per component lifecycle.
- `state/presenters/engine-events.engine.ts` (NEW)
  - `selectRecentEngineEvents(state, capacity = 20): readonly TypedGameEvent[]`. Returns the cached event tail (newest-first). Backed by a tiny ring buffer the store maintains.
  - Pure data — no React subscriptions inside the presenter.
- `state/store.ts` (continued)
  - Subscribe to `emitter.onAny` at construction time; push each event onto `state._recentEvents` (capacity 20, newest-first). This makes the buffer observable via zustand's standard subscription mechanism.

**New test files:**

- `state/e2e/engine-events.engine.test.ts` — pin: emitter receives dispatched events, ring-buffer trims to capacity, `is*Event` guards narrow correctly.

**Untouched:**

- `state/actions.ts:summarizeRoundEvents` — the bespoke severity inference STAYS. Engine `combat:round` typed event carries only `{ state }`; mobile already extracts per-event detail from `resolveCombatRound`'s direct return. Routing that through the emitter would lose information. The brief's original goal ("drop bespoke severity inference") is **revised** here per the engine-surface reality.

## Cross-links

**In (verify before starting):**

- `pnpm verify` green at 342/342.
- `createEventEmitter` + the 10 typed exports + 10 `is*Event` guards verified in `node_modules/axiomancer-mechanics/dist/Game/events.d.ts` + `events.types.d.ts` + `events.utils.d.ts`.

**Out (ships in this phase):**

- `state/store.ts` — emitter wired + ring buffer.
- `state/GameStoreProvider.tsx` — `useGameEvents` hook.
- `state/presenters/engine-events.engine.ts` — new presenter file.
- `state/e2e/engine-events.engine.test.ts` — new test file.

**Retro-fit (out of scope, follow-up):**

- Wire level-up badge auto-clear (subscribe to `character:levelup` event, update local state). Belongs to a future `/iterate` row.
- Wire toast feedback for inventory changes. Same.
- Wire dialogue-cursor advancement via `dialogue:applied` event. Belongs to a Phase 6 follow-up, not Phase 25.

## Decisions made upfront — DO NOT ASK

1. **Emitter location.** The emitter constructs in `createAppStore`. Lives for the store's lifetime. Single instance per store. Tests instantiate their own via `createAppStore` (or directly via `createEventEmitter()` for unit-shape tests).

2. **Ring-buffer capacity = 20.** Enough for a couple of combat rounds + a few world moves. Small enough that the slice doesn't bloat saves (the save adapter doesn't persist `_recentEvents` — see Decision #5).

3. **Slice name `_recentEvents`.** Leading underscore signals "mobile-private, not engine state". Type-wise: `_recentEvents: readonly TypedGameEvent[]`.

4. **Subscription mechanism: `emitter.onAny()`.** Single handler captures all 10 typed event kinds. Internal switch via the `is*Event` guards. Avoids 10 separate subscriptions and the bookkeeping that implies.

5. **Don't persist `_recentEvents`.** Add it to the `wrapDeflectingAdapter`'s save-filter so the field never reaches AsyncStorage. (The deflecting adapter already swallows non-explicit saves; this also makes the field truly ephemeral.)

6. **Bespoke severity inference stays.** Engine `combat:round` event payload is `{ state }` only; the round-event detail mobile renders comes from `resolveCombatRound`'s direct return, which the emitter doesn't expose. Dropping the inference would lose information. The brief's original goal is revised here based on engine-surface reality — the typed event channel is *additive* to the current log pipeline, not a replacement.

7. **Tick decomposition.** Tick A: emitter wiring + ring buffer + presenter + test scaffold. Tick B: `useGameEvents` hook + close-out + un-defer follow-up iterate rows.

## SEO / metadata / output schema

N/A. Output schemas:

- `TypedGameEvent` discriminated union (10 variants, engine-defined).
- `_recentEvents: readonly TypedGameEvent[]` on the mobile store slice (private, not exported as part of `AppStoreState` public shape).
- `selectRecentEngineEvents(state, capacity?)` presenter signature.

## Pages x tests matrix

| Surface | Test file | Cases |
|---|---|---|
| Emitter wiring | `state/e2e/engine-events.engine.test.ts` (new) | (1) `createAppStore` returns a store with `_recentEvents` initialized to `[]`, (2) dispatching `startCombat(enemy)` populates a `combat:started` event in the buffer, (3) `combat:round` fires on `updateCombat`, (4) `is*Event` guards narrow the captured events to the right variant, (5) ring buffer trims to capacity 20 after 25 events |
| `selectRecentEngineEvents` | same file | (a) returns most-recent-first slice up to capacity, (b) returns `[]` on a fresh store, (c) the returned array is frozen / does not mutate the buffer |
| `useGameEvents` hook | `state/e2e/engine-events.hook.test.tsx` (Tick B) | onMount subscribes; onUnmount unsubscribes; handler receives events in dispatch order |

## Verify gate

```bash
pnpm verify
```

Target: full suite green. Current baseline 342/342. Expected delta:

- `+5–8` tests in `engine-events.engine.test.ts` (Tick A) — emitter contract + ring buffer + presenter
- `+3` tests in `engine-events.hook.test.tsx` (Tick B) — React subscription contract

Approx **~350 hermetic** after ship.

## Deploy gate

```bash
pnpm deploy:check
```

Stub. No deploy-side change.

## Commit body template (Tick A)

```
feat(spec25): wire engine event emitter + ring-buffer presenter (Phase 25 Tick A)

- state/store.ts: construct GameEventEmitter via createEventEmitter()
  and pass to createGameStore as third arg. New mobile-private
  _recentEvents slice (capacity 20, newest-first) populated via
  emitter.onAny.
- state/presenters/engine-events.engine.ts: new
  selectRecentEngineEvents(state, capacity?) presenter; returns
  the frozen tail of the ring buffer.
- state/e2e/engine-events.engine.test.ts: new — emitter wiring,
  ring-buffer trimming, is*Event guard narrowing.

Decisions per the brief:
- Ring capacity 20 (small enough not to bloat saves).
- Subscription via emitter.onAny() not per-type subscriptions.
- _recentEvents excluded from save payload via wrapDeflectingAdapter.
- Bespoke severity inference in summarizeRoundEvents stays — engine
  combat:round payload doesn't ship per-event detail, only post-state.

verify: N / N tests passing.
```

## Definition of Done

After both sub-ticks land:

1. `createAppStore` constructs an emitter and passes it to `createGameStore`.
2. `state._recentEvents` is a readonly tail of typed events (capacity 20).
3. `selectRecentEngineEvents` returns the tail; tests pin the contract.
4. `useGameEvents(handler)` subscribes/unsubscribes correctly.
5. `pnpm verify` green; +8–11 new tests.
6. Phase 25 row in `plan/steps/01_build_plan.md` flipped `[ ]` → `[x]` with the commit hash.
7. Phase log entry appended.

## Follow-ups (out of scope this phase)

- **Level-up badge auto-clear** — subscribe to `character:levelup` in the navigation presenter; clear `LEVELUP_BADGE` after the user visits the character screen post-event.
- **Inventory toast feedback** — subscribe to `inventory:changed` in a global feedback layer; show a transient "Picked up X" / "Discarded Y" toast.
- **Dialogue-applied cursor confirmation** — subscribe to `dialogue:applied` in the event modal to confirm advancement (cosmetic; the cursor already advances via the action layer).
- **Combat log via typed events** — defer. The engine `combat:round` payload doesn't carry the per-event detail needed for the current severity-keyed log lines.
