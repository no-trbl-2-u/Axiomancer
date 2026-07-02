# State wiring — `state/`

Single app-wide game store powered by `axiomancer-mechanics`'
`createGameStore`. Engine = source of truth for game state. UI = read
selectors + dispatch typed actions.

## Files

| File | Role |
|---|---|
| `state/store.ts` | `createAppStore({ adapter?, overrides? })` — wraps the engine's `createGameStore`. Defaults to `nullAdapter`. |
| `state/actions.ts` | `createAppActions(store)` — typed wrappers around engine actions (`startCombat`, `endCombat`, `setCombatPhase`, `setPlayerStance`, item ops, `save`). |
| `state/GameStoreProvider.tsx` | `<GameStoreProvider>` mounts the store + `useGameState`, `useGameActions`, `useGameStore` hooks. |
| `state/e2e/store.engine.test.ts` | Hermetic e2e — provider boot, action dispatch, adapter invocation, selector stability. |

## Reading state — selectors

Prefer per-field selectors to keep re-renders narrow:

```ts
const hp = useGameState((s) => s.player.health);
const inCombat = useGameState((s) => s.combat !== null);
```

The engine also re-exports memoizable selectors (`selectPlayer`,
`selectCombat`, `selectInventory`, `selectVersion`, `selectIsInCombat`)
from `axiomancer-mechanics` — pass them straight in:

```ts
import { selectIsInCombat } from 'axiomancer-mechanics';
const inCombat = useGameState(selectIsInCombat);
```

## Mutating state — actions

Never call `store.getState().startCombat(...)` from a screen. Go
through `useGameActions()`:

```ts
const { startCombat, setCombatPhase, endCombat } = useGameActions();
startCombat(enemy);
setCombatPhase('choosing_action');
```

`useGameActions()` returns the same object for the lifetime of the
provider, so it is safe in `useEffect` dependency lists.

## Adding a new action

1. Add the method to `AppActions` in `state/actions.ts`.
2. Implement it in `createAppActions` — typically pull the relevant
   slice via `store.getState()`, run an engine reducer, and call
   `store.getState().updateCombat(...)` or the equivalent setter.
3. Add a dispatch test under `state/e2e/store.engine.test.ts`.

## Persistence

Spec 02 ships with `nullAdapter` (no I/O). Spec 09 (Phase 7) swapped
in `createAsyncStorageAdapter` for runtime (`app/_layout.tsx`,
commits `09bc44e` + `2f8ecea`); the provider's `adapter` prop is
the single seam — pass a `memoryAdapter` (see `test-utils/`) in
tests.
