# Presenters — the engine → screen contract

> Status: locked by [Spec 03](../specs/03-presenter-layer.md).

Every screen in `app/(tabs)/` has a sibling **presenter** under
`state/presenters/<screen>.engine.ts` whose job is to map the engine
`GameState` (and an optional, ephemeral UI-state argument) into a
plain-JSON **view-model** that the screen renders.

Screens become "dumb": they import a single
`select<Screen>ViewModel` plus shared components, render the VM, and
wire `useGameState` / `useGameActions` from
[`state/GameStoreProvider`](../state/GameStoreProvider.tsx). Screens do
**no** math, **no** shaping, and **no** direct
`axiomancer-mechanics` imports.

---

## The contract

```ts
export interface <Screen>ViewModel {
    // raw data only — no event handlers, no colour tokens, no icons.
}

export function select<Screen>ViewModel(
    state: GameStore,
    localUi?: <Screen>LocalUi,
): <Screen>ViewModel { … }
```

### Locked decisions (Spec 03 Q1–Q6)

| # | Decision | Choice |
|---|---|---|
| Q1 | Naming convention | `select<Screen>ViewModel` returning `<Screen>ViewModel` |
| Q2 | Argument shape | `(state, localUi?)` — `state` is the engine `GameStore`; `localUi` is ephemeral UI state the engine doesn't track (selected stance preview, expanded item, active tab). |
| Q3 | Immutability | The returned VM is deep-frozen in dev (`__DEV__`) via `freezeViewModel`; no-op in prod. |
| Q4 | Memoisation | None — Zustand's selector + per-field subscriptions in `useGameState` keep re-renders narrow. Presenters stay pure-but-uncached. |
| Q5 | VM scope | **Data only**: numbers, strings, ratios in `[0, 1]`, flags. **No** event handlers, **no** colour tokens, **no** icon names. The component owns everything cosmetic — palette, icons, layout. |
| Q6 | Localisation | Deferred. VM owns raw English strings until a real locale need shows up. |

### What goes in the VM

- Numeric ratios `[0, 1]` for bars (`hpPercent`, `manaPercent`).
- Display strings already formatted (`'iv vs i'`, `'CIRCLING'`).
- Plain boolean flags (`canPickStance`, `isFleeAvailable`).
- Stable IDs the component maps to icons / palette (`stance: 'heart'`,
  `effectKind: 'poison'`).
- Filtered, ordered, capped lists (the HUD shows at most four effects;
  the cap lives in the presenter, not in the JSX).

### What stays on the component

- `StyleSheet` / `AXM.*` palette tokens.
- Icon resolution (`<StanceGlyph kind={vm.stance} />`).
- Event handlers — the screen wires `onPress` to
  `useGameActions().setCombatPhase('choosing_action')`. The presenter
  may expose a `canAct: boolean` to tell the screen whether the action
  is currently legal; the screen still owns the dispatch.

### Local UI state (`localUi`)

Ephemeral, presentation-only state goes through the second argument so
the presenter stays pure. Examples:

- Combat: `{ selectedStance, currentPhase }` while the player is
  composing a turn but hasn't committed yet.
- Inventory: `{ activeTab, expandedItemId }`.
- Event: `{ revealedLoreCount }`.

Anything that *persists across a screen unmount* (the engine combat
phase, the player's inventory) belongs on the engine, not on
`localUi`.

---

## File layout

| Concern | Location |
|---|---|
| Presenter | `state/presenters/<screen>.engine.ts` |
| Presenter test | `state/e2e/<screen>.engine.test.ts` |
| Screen (UI shell) | `app/(tabs)/<screen>.tsx` |
| Component render test | `components/<Component>.test.tsx` |

> Non-route files must live **outside `app/`** — Expo Router walks
> every `.ts`/`.tsx` under `app/` and would mount them as routes. See
> `state/e2e/route-tree.engine.test.ts` for the guard test.

This diverges from Spec 03's original suggestion of
`app/(tabs)/<screen>/<screen>.engine.ts`; the divergence is
intentional, settled in Spec 01, and pinned by the route-tree guard.

## Deep-freeze helper

Every presenter calls `freezeViewModel` on its return value:

```ts
import { freezeViewModel } from './freeze';

export function selectCombatViewModel(state: GameStore): CombatViewModel {
    return freezeViewModel({ /* … */ });
}
```

`freezeViewModel` recursively `Object.freeze`s its argument when
`__DEV__` is truthy and returns it unchanged in production. The type
signature is identity — screens see the same `CombatViewModel` shape.

## Composing presenters

A screen-level presenter may compose smaller ones. The canonical
example is `selectCombatViewModel`, which embeds
`selectCombatHudViewModel`'s output under a `hud` field. Composition
keeps each piece testable on its own and lets specs grow the VM
gradually without breaking older callers.

## Testing — see [`docs/testing.md`](./testing.md)

Every presenter ships with a hermetic e2e test under
`state/e2e/<feature>.engine.test.ts`. The required suites are:

1. **Happy path** — a typical state yields the expected VM.
2. **Boundary / branches** — every phase, every empty/partial/full
   permutation the change can reach.
3. **Invariants** — VM fields are total (no `undefined` strings),
   bars stay in `[0, 1]`, lists are capped where the contract says so.
4. **Lifecycle integration** — drive the change through
   `createGameStore(memoryAdapter, …)` and assert `memoryAdapter.save`
   was / was not called.

A stub presenter — one that returns a constant fixture pending Specs
04+ — still ships with a stub test that pins the VM shape so the
contract can't drift silently.
