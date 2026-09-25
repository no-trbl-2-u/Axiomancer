# State wiring — `state/`

Single app-wide game store powered by `axiomancer-mechanics`'
`createGameStore`. Engine = source of truth for game state. UI = read
selectors + dispatch typed actions.

## Files

| File | Role |
|---|---|
| `state/store.ts` | `createAppStore({ adapter?, overrides? })` — wraps the engine's `createGameStore`. Defaults to `nullAdapter`. |
| `state/actions.ts` | `createAppActions(store)` — typed wrappers around engine actions (`startCombat`, `endCombat`, item ops, `moveTo`, `save`) plus the minigame / menu verbs. |
| `state/GameStoreProvider.tsx` | `<GameStoreProvider>` mounts the store + `useGameState`, `useGameActions`, `useGameStore` hooks. |
| `state/persistence/saveSlots.ts` | The three-slot vocabulary: ids, storage keys, `SaveSlotSummary`, `mostRecentSlot`, the `SaveSlotStore` interface (2026-09-23). |
| `state/persistence/asyncStorageAdapter.ts` | The AsyncStorage `PersistenceAdapter` + `SaveSlotStore`: `load()`/`save()` scoped to the ACTIVE slot; `preload()` reads all three. |
| `state/persistence/memorySlotStore.ts` | In-memory `SaveSlotStore` for tests and fixture boots. |
| `state/menu/store-actions.ts` | NEW GAME / LOAD GAME / CONTINUE / RETURN TO TITLE — `hydrateStoreWithGameState` swaps the engine state inside the live store. |
| `state/SaveSlotsProvider.tsx` | `<SaveSlotsProvider slots>` + `useSaveSlots()` / `useSaveSlotSummaries()`. |
| `state/settings.ts` | Player settings (`settingsStore`, `useSetting`, `useSettings`) — motion, haptics, text size, tutorial hints, volumes. |
| `state/tutorials.ts` | The coach flags, `isTutorialDone(flags, flag, hints)` and `resetTutorialsAction`. |
| `state/e2e/store.engine.test.ts` | Hermetic e2e — provider boot, action dispatch, adapter invocation, selector stability. |

Save slots, the main menu and the settings screen are documented in
[`save-slots-and-settings.md`](./save-slots-and-settings.md).

## Reading state — selectors

Prefer per-field selectors to keep re-renders narrow:

```ts
const hp = useGameState((s) => s.player.health);
const inCombat = useGameState((s) => s.currentEncounter != null);
```

The engine also re-exports memoizable selectors (`selectPlayer`,
`selectVersion`, `selectIsInCombat`)
— import them via the `@mechanics` alias and pass them straight in:

```ts
import { selectIsInCombat } from '@mechanics';
const inCombat = useGameState(selectIsInCombat);
```

## Mutating state — actions

Never call `store.getState().startCombat(...)` from a screen. Go
through `useGameActions()`:

```ts
const { startCombat, endCombat } = useGameActions();
startCombat(enemy);
endCombat('victory');
```

`useGameActions()` returns the same object for the lifetime of the
provider, so it is safe in `useEffect` dependency lists.

## Adding a new action

1. Add the method to `AppActions` in `state/actions.ts`.
2. Implement it in `createAppActions` — typically pull the relevant
   slice via `store.getState()`, run an engine reducer, and call
   the matching engine action (e.g. `store.getState().save()`) or
   `store.setState(...)` for a mobile-only slice.
3. Add a dispatch test under `state/e2e/store.engine.test.ts`.

## Persistence

Spec 02 ships with `nullAdapter` (no I/O). Spec 09 (Phase 7) swapped
in `createAsyncStorageAdapter` for runtime (`app/_layout.tsx`,
commits `09bc44e` + `2f8ecea`); the provider's `adapter` prop is
the single seam — pass a `memoryAdapter` (see `test-utils/`) in
tests.
