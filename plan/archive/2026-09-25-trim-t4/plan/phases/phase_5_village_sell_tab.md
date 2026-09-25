# Phase 5 — Village SELL tab

> Agent-facing brief. Concise, opinionated, decisive. Ship without
> asking; document any judgment calls in the commit body.

## Outcome / Why

The engine has carried `sellItem` / `defaultSellPrice` (Phase 37)
since the shop reducer landed, and the CLI's `shopLoop` already
drives both sides of the counter — but the mobile settlement screen
(`/village`, Phase 137) only ever wired the BUY half
(`buyVillageWare`). Players can spend shillings at a village shop but
have no in-app way to turn unwanted inventory back into currency.
This phase surfaces the missing SELL half on the same screen.

## Routes / endpoints / CLI surface (locked in `bearings.md`)

No new routes. `/village` (existing, Phase 137) gains a second tab
inside its already-shipped "THE STALLS" section. No CLI change — the
CLI's `shopLoop` sell path is the reference implementation mobile now
mirrors.

## Content / data reads

| Helper | Lookup | Use |
|---|---|---|
| `defaultSellPrice(ware)` (`@mechanics`) | per matching `ShopWare` | sell price when the inventory item's id matches a ware this village's shop lists |
| `sellItem(character, itemId, price)` (`@mechanics`) | action layer | removes the item, credits currency |
| `state.player.inventory` | presenter | source list for the SELL tab |
| `pending.event.shop.wares` | presenter + action | ware-price lookup for both BUY and the SELL fallback |

## Components / handlers

- `state/presenters/village.engine.ts` — `selectVillageVM` gains
  `hasShop: boolean` and `sellables: readonly VillageSellableVM[]`
  (`{ index, itemId, name, description, sellPrice }`).
- `state/actions.ts` — new `sellVillageItem(index: number): boolean`
  alongside the existing `buyVillageWare`.
- `app/village/index.tsx` — "THE STALLS" section gains a BUY/SELL tab
  row (`useState<'buy' | 'sell'>('buy')`); each tab renders its own
  empty state when the list is empty.

## Cross-links

**In** (already shipped — verify still wired): the village screen
itself (Phase 137), the shop reducer (Phase 37).

**Out** (this phase ships): the SELL tab UI + `sellVillageItem`
action + presenter `sellables`/`hasShop` fields. No new screens, no
new routes — nothing to retro-fit from other families.

## Output schema / contracts

`VillageSellableVM`:

```ts
interface VillageSellableVM {
    index: number;      // player.inventory index — sellVillageItem's identity
    itemId: string;
    name: string;
    description: string;
    sellPrice: number;
}
```

`sellVillageItem(index: number): boolean` — mirrors `buyVillageWare`'s
success-boolean contract.

## Composition

```
THE STALLS                    <purse>
[ BUY ] [ SELL ]
<active tab's rows, or an empty-state note>
```

## Empty / loading / error states

- **BUY, no wares:** "Nothing for sale."
- **SELL, no sellable inventory:** "Nothing to sell."
- **No shop on this village event at all:** the whole "THE STALLS"
  section (including tabs) is hidden — same gate BUY used before this
  phase, generalized from `wares.length > 0` to `hasShop` so an
  authored shop with zero current wares still exposes SELL.

## Decisions made upfront — DO NOT ASK

- **Sell pricing mirrors the CLI exactly.** `shopLoop`'s sell path
  (`src/CLI/game.cli.ts`) is the only prior consumer of
  `defaultSellPrice` outside tests: price = `defaultSellPrice(matching
  ware)` when the item's id is on this shop's ware list, else a flat
  `1`. Mobile reuses the identical policy rather than inventing a new
  one, so CLI-driven and mobile-driven runs price sells alike.
- **Quest items are never sellable.** No engine guard exists on
  `sellItem` itself (it'll happily remove anything by id), so the
  guard lives in both the presenter (excluded from `sellables`, same
  as `dropItem`'s `canDiscard` gate on the inventory VM) and the
  action (defense in depth, mirroring `dropItemAction`'s comment: "the
  screen never offers the action, but defend in depth here for direct
  dispatch").
- **Identity is inventory index, not item id.** `sellItem` itself
  still takes an id (and removes the first match), but the VM/action
  boundary uses `index` so duplicate-id stacks (e.g. two potions
  bought separately) render as distinct rows — same disambiguation
  the CLI's `shopLoop` already uses (`idx` into the inventory array).
- **BUY/SELL tab state is screen-local**, not persisted — reopening
  the village event always starts on BUY. No spec or prior phase
  establishes a durable "last tab" preference for this screen.
- **`hasShop` replaces the wares-length gate** for the whole "THE
  STALLS" section (BUY tab included) — a shop with an authored ware
  list of zero (rare, but not impossible) now still shows SELL instead
  of hiding the section outright. This slightly widens BUY's own gate;
  it ships in the same phase since both tabs share one gate.

## Mobile reflow / responsive

No layout change beyond the existing screen's `ScrollView`; the tab
row is two equal-flex buttons, matching the width of the purse/section
header row above it.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `village.engine.ts` presenter | `state/presenters/__tests__/village.engine.test.ts` — `hasShop`, `sellables` derivation, ware-match pricing, fallback pricing, quest-item exclusion, missing-inventory default | — |
| `sellVillageItem` action | — | `state/e2e/village-shop.engine.test.ts` — sells at matched ware price, falls back to 1, refuses quest items, out-of-range index, no pending event |

No new Playwright/web e2e — the village screen has no pre-existing
screen-render test file to extend, and the action/presenter coverage
above is hermetic and exercises the real reducer path end-to-end
(store → action → engine `sellItem`), consistent with this repo's
existing coverage for the BUY half (which also has no screen-render
test).

## Verify gate

```bash
npm run verify --workspace axiomancer-mobile
```

## Commit body template

```
feat(mobile): village SELL tab — phase 5

- Village screen "THE STALLS" section gains a BUY/SELL tab toggle
- New `sellVillageItem` action mirrors the CLI's shopLoop sell
  pricing (defaultSellPrice against a matching ware, else 1)
- Presenter `selectVillageVM` gains `hasShop` + `sellables`
- Quest items excluded from sellables (defense in depth, mirrors
  dropItem's guard)

Decisions:
- hasShop (not wares.length) gates the whole stalls section
- sell identity is inventory index, not item id (duplicate-id
  stacks render as distinct rows)
```

## DoD

Flip Phase 5's `[ ]` -> `[x]` in `plan/steps/01_build_plan.md`,
append commit hash, add to "Phase log".

## Confirm deploy

```bash
npm run deploy:check
```

## Follow-ups (out of scope this phase)

- No confirmation dialog before selling — matches BUY's own
  one-tap pattern; revisit only if playtesting flags accidental
  sells as a problem.
- No screen-render test for `/village` (BUY or SELL) — the screen has
  never had one; adding one is a cross-cutting testing debt item, not
  scoped to this phase.
