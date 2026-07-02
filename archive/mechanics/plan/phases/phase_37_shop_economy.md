# Phase 37 — Shop economy via `village` MapEventKind

> Make `Character.currency` a meaningful resource. Pure `buyItem` /
> `sellItem` reducers, a `shop` field on village payloads carrying the
> wares + prices, two authored starter shops, hermetic e2e, and a CLI
> shop loop that fires when a `village` node resolves with a shop.

## Outcome

- New pure reducers `buyItem(character, item, price)` and
  `sellItem(character, itemId, price)` ship in `src/Items/shop.reducer.ts`,
  both exported through `src/index.ts` (additive).
- `VillagePayload` carries an optional `shop?: ShopInventory` field;
  `resolveVillage` forwards it onto the resolved event.
- Two authored shops: the `fv-3` Fishing Village Stalls (healing /
  antidote / stamina pool) and the `nf-8` Glen Market (alternate stock).
- CLI Map tab opens a buy/sell loop when a village resolves with a
  shop. Logic stays in the reducers — `src/CLI/game.cli.ts` only
  prompts and dispatches.
- Hermetic e2e at `src/Items/e2e/shop.engine.test.ts` covers buy
  (success + insufficient funds), sell (success + item-not-found),
  pure-function invariants (input unchanged), and a village-payload
  round-trip through `resolveMapEvent` that asserts the shop appears
  on the resolved event.

## Source spec

- Build-plan row Phase 37 (`plan/steps/01_build_plan.md:60`).
- Spec 08 Q8 (`specs/08-world-content.md:88-89`) — "Just add the
  currency number. Shop to come in future spec." That future spec is
  effectively this phase.
- `docs/items.md` Pending block lines 108-110 names this as the
  anchor when shops land. Drain on ship.

## Implementation units

### Unit 1 — Shop reducers + types

**File:** `src/Items/shop.reducer.ts` (new). Pure, no GameState
coupling — operates on a `Character` and an `Item` / `itemId`.

```ts
// Shape sketch — final code may differ.
export interface ShopWare { readonly itemId: string; readonly price: number; }
export interface ShopInventory { readonly wares: ReadonlyArray<ShopWare>; }

export function buyItem(character: Character, item: Item, price: number): Character {
    if (price < 0) return character;          // invalid input — no-op
    if (character.currency < price) return character;  // insufficient
    return {
        ...character,
        currency: character.currency - price,
        inventory: [...character.inventory, deepClone(item)],
    };
}

export function sellItem(character: Character, itemId: string, price: number): Character {
    if (price < 0) return character;
    const idx = character.inventory.findIndex(i => i.id === itemId);
    if (idx === -1) return character;         // not in inventory
    const next = character.inventory.slice();
    next.splice(idx, 1);
    return { ...character, currency: character.currency + price, inventory: next };
}
```

**File:** `src/Items/shop.types.ts` (new) — `ShopWare`, `ShopInventory`.
Re-export from `src/Items/index.ts`. Co-locating with the reducer keeps
the surface tight (no separate `shop/` subdir for two files).

**`src/Items/index.ts`** — add `buyItem`, `sellItem`, `ShopWare`,
`ShopInventory` exports.

**`src/index.ts`** — append the four exports under the `Items` group.

**Co-located unit test:** `src/Items/shop.reducer.test.ts` — six cases
(buy success, buy insufficient, buy negative price, sell success, sell
missing item, pure invariant: input character unchanged).

Commit: `feat(items): Phase 37 unit 1 — buy/sell reducers + types`.

### Unit 2 — VillagePayload extension + content

**`src/World/MapEvents/types.ts`:**
- Import `ShopInventory` from `../../Items` (or define it in MapEvents
  if we want to keep MapEvents self-contained — decided below).
- Add `shop?: ShopInventory` to `VillagePayload`.
- Extend the `village` variant of `ResolvedEvent` with `shop?: ShopInventory`.

**Decision: ShopInventory lives in `src/Items/`** — it describes an
item catalogue, MapEvents is just a transport. The MapEvents types
import the shape.

**`src/World/MapEvents/handlers.ts`** (`resolveVillage`):
```ts
return {
    state,
    event: {
        kind: 'village',
        villageName: payload.villageName,
        merchants,
        shop: payload.shop,  // forward as-is; no defensive cloning needed
    },
};
```

**`src/World/MapEvents/content.ts`:**
- Update `fv-3.village` payload to add a starter `shop`:
  - `healing-potion` × 1 → 25
  - `minor-healing-potion` × 1 → 12
  - `antidote` → 30
  - `stamina-draught` (if present in `consumableLibrary`) → 20
- Update `nf-8.village` (Glen Market) with a different selection that
  reads as a forest hamlet's stock:
  - `minor-healing-potion` → 12
  - `philosopher-tea` → 35
  - `void-essence` → 40

**Content test:** add a single assertion to
`src/World/MapEvents/e2e/content.engine.test.ts` confirming both
authored village payloads carry a non-empty `shop` with at least one
ware referencing a real `consumableLibrary` entry. Keeps content
drift detectable.

Commit: `feat(world): Phase 37 unit 2 — village shop field + starter shops`.

### Unit 3 — Hermetic e2e

**File:** `src/Items/e2e/shop.engine.test.ts` (new).

**Cases:**
1. `buyItem` — happy path: character with 50 currency, item priced 20
   → currency 30, inventory length +1, item is a `deepClone` (mutating
   the returned inventory's item doesn't mutate the source item).
2. `buyItem` — insufficient funds: 10 currency, item priced 20 →
   character returned unchanged (referential / structural equality).
3. `buyItem` — negative price → unchanged.
4. `sellItem` — happy path: 5 currency, inventory `['x']`, sell `x`
   for 10 → currency 15, inventory empty.
5. `sellItem` — item not in inventory → unchanged.
6. `sellItem` — negative price → unchanged.
7. **Round-trip through `resolveMapEvent`** — drive a `village` node
   whose pool entry carries a shop; assert the resolved event carries
   the `shop` field with the authored wares, AND that `buyItem` against
   one of the wares decrements currency + adds the item.

Stub RNG with `mockFixedRng` so weighted pools roll deterministically.

Commit: `test(items): Phase 37 unit 3 — shop reducers hermetic e2e`.

### Unit 4 — CLI shop loop

**File:** `src/CLI/game.cli.ts`.

After `result.event.kind === 'village'` resolves and the event carries
a `shop` with non-empty `wares`, open a small prompt loop:

```
What would you like to do?
  buy → list wares with prices; pick one; dispatch buyItem
  sell → list inventory with sell prices (use the same price the shop
         buys at, or a heuristic — see Decisions); pick one; dispatch
         sellItem
  leave → exit the loop
```

The prompt body calls `buyItem` / `sellItem` directly with the current
`store.getState().player`, then `store.setState({ player: next })` to
commit the result. Each iteration `logState`s the transaction for the
agent-grading layer.

**`describeResolvedEvent` for village** — when `shop` exists, append
`(N wares for sale)`.

This unit changes CLI surface only. The logic was tested in Unit 3.

Commit: `feat(cli): Phase 37 unit 4 — shop loop on village resolve`.

### Unit 5 — Docs + DoD tick

- `docs/items.md` — replace the "Pending: shop economy" block with a
  new "Shop economy (Phase 37)" section naming `buyItem` / `sellItem` /
  `ShopWare` / `ShopInventory` and pointing at
  `src/World/MapEvents/content.ts` for the two authored shops.
- `docs/api.md` — add Items / Shop entries to the Items section.
- Optional: add `automation/scripts/walkthroughs/shop.json` +
  `shop.goal.md` for an agent-graded walkthrough. **Punt to a follow-up
  iterate row** — keeps this phase tight.
- `plan/steps/01_build_plan.md` — flip Phase 37 `[ ]` → `[x]` with
  commit hash.

Commit: `plan: phase 37 shipped — shop economy (commit <sha>)`.

## Decisions made upfront — DO NOT ASK

- **`ShopInventory` / `ShopWare` live in `src/Items/`**, not in
  `src/World/MapEvents/`. The shape describes an item catalogue; the
  village payload is just where it happens to ride. Items is the
  durable home.
- **Reducers operate on `Character` + `Item` / `itemId`**, not on
  inventory arrays. Currency lives on Character, so the buy/sell
  operations must edit Character; passing the full Character keeps
  the call sites trivial in CLI + future React Native consumers.
  Phase 29's `allocateStatPoint` set the pattern (`Character →
  Character` reducers).
- **Negative price = no-op**, not an error throw. Library contract is
  "pure, never throws"; bad input returns the character unchanged.
  Mirrors `removeItem` / `useConsumable` shape.
- **Insufficient funds = no-op**. UI is responsible for rendering "you
  can't afford that" before / instead of dispatching. Engine never
  signals via exceptions.
- **`buyItem` `deepClone`s the purchased item.** Two consumers
  bought from the same shop ware shouldn't share an item identity
  in their inventories. Matches `resolveGathering` / `resolveLootCache`.
- **Sell price is whatever the caller supplies.** No "shops buy at
  half price" engine policy — that's an authoring concern; UIs can
  compute it from the ware's price. Keeps the reducer dumb.
- **Shop inventories are static per village node.** Stock doesn't
  deplete or refresh; that's a future-content concern. A second pass
  could add `stock` per ware + a refresh policy.
- **`merchants` and `shop` are separate fields on the village
  payload.** Merchants are NPC pointers (dialogue / interaction);
  `shop` is the transactional surface. A village might have one
  without the other.
- **CLI loop is the only UI affordance**. No JSON wire event surface
  beyond what `resolveMapEvent` already emits on the `combat:round` /
  `world:processed` event family. React Native consumers read the
  resolved event's `shop` field and render however they like.

## Verify gate

```bash
npm run verify   # type-check + lint + test + build
```

The new reducer test, the new shop e2e file, and the touched content
test all run as part of `npm test`.

## Commit body template (final summary, if using a single commit)

```
feat(items): Phase 37 — shop economy via `village` MapEventKind

- New `src/Items/shop.reducer.ts` exports `buyItem(character, item,
  price)` and `sellItem(character, itemId, price)` — pure, no
  GameState coupling, no exceptions.
- New `ShopInventory` / `ShopWare` types in `src/Items/shop.types.ts`,
  exported through `src/index.ts` (additive — no barrel removals).
- `VillagePayload.shop?` + resolved-event `shop` field; `resolveVillage`
  forwards. Authored shops on `fv-3` (Fishing Village Stalls) and
  `nf-8` (Glen Market) draw from `consumableLibrary`.
- Hermetic e2e at `src/Items/e2e/shop.engine.test.ts` (7 cases) +
  content-drift assertion in
  `src/World/MapEvents/e2e/content.engine.test.ts`.
- CLI Map tab runs a buy / sell loop when a village resolves with a
  shop. Logic stays in the reducers — CLI only prompts + dispatches.
- `docs/items.md` Pending shop-economy row drained; new
  "Shop economy (Phase 37)" section names the surface.

Closes <issue> if filed.
```

## Definition of Done

- [ ] `buyItem` and `sellItem` exist in `src/Items/shop.reducer.ts`,
  exported through `src/index.ts`.
- [ ] `ShopInventory` and `ShopWare` types exist and are re-exported.
- [ ] `VillagePayload.shop?` + resolved-event `shop` field; handler
  forwards.
- [ ] `fv-3.village` and `nf-8.village` payloads carry shop inventories
  with prices and consumable IDs that resolve in `consumableLibrary`.
- [ ] `src/Items/e2e/shop.engine.test.ts` covers all 7 cases listed in
  Unit 3.
- [ ] `src/Items/shop.reducer.test.ts` covers the 6 unit cases.
- [ ] `src/CLI/game.cli.ts` opens a shop loop on village resolve with a
  non-empty shop.
- [ ] `docs/items.md` Pending shop block replaced with a live section.
- [ ] `docs/api.md` Items section names the new exports.
- [ ] Phase 37 row in `plan/steps/01_build_plan.md` flipped to `[x]`.

## Follow-ups (out of scope)

- Agent-graded walkthrough at `automation/scripts/walkthroughs/shop.json`
  + `shop.goal.md` — file as an iterate row.
- Per-ware stock + refresh policy.
- "Shops buy at half price" UI convention (currently caller-supplied).
- A `Shopkeeper` NPC-attached shop variant (currently village-attached).
- Currency-display UI affordance on the Character tab.
