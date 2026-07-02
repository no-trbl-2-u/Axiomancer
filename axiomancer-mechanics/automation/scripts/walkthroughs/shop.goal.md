# Goal — shop walkthrough

**Surface under test:** the Phase 37 shop economy — `buyItem` /
`sellItem` reducers in `src/Items/shop.reducer.ts`, the
`defaultSellPrice(ware): number` engine-tier helper (added at iterate
`3ba5319` to foreclose the Phase 37 sell-price exploit), and the CLI
`shopLoop` affordance that opens automatically when a `village`
MapEvent resolves with a `shop` payload (`src/CLI/game.cli.ts`).

The walkthrough boots the Wanderer preset (starting currency 25;
chosen because Apprentice starts at 0 and can't afford anything,
while Sage at 75 has more than the round-trip needs), moves through
fv-1 → fv-2 (Old Marrow interaction) → fv-3 (Fishing Village Stalls
— the shop village authored at `src/World/MapEvents/content.ts:55`),
buys the `minor-healing-potion` ware (price 12), then immediately
sells it back at the engine-default half price (6), then leaves the
shop and quits.

The point of the round-trip is to pin the buy/sell ledger: 25 →
buy 12 → 13 → sell 6 → 19. Net 6 currency burned by the round-trip
(consistent with `defaultSellPrice`'s "always strictly less than buy
price" guarantee), and the `minor-healing-potion` is in inventory
between the two reducer calls but gone after the sell.

**Pass conditions (the agent should verify against the state log +
event stream):**

1. Bootstrap records the Wanderer preset (level 1, starting at `fv-1`,
   `player.currency === 25`).
2. A `moveToNode` record fires with `event.target === 'fv-2'`,
   followed by a `resolveMapEvent` whose event kind is `interaction`
   (Old Marrow). `world.currentMap.currentNode` is `'fv-2'` after
   this step.
3. A second `moveToNode` record fires with `event.target === 'fv-3'`,
   followed by a `resolveMapEvent` with kind `village` whose
   `event.shop.wares` lists 4 entries (`healing-potion`,
   `minor-healing-potion`, `antidote`, `heart-draught`).
4. A `buyItem` state-log record fires with
   `event.itemId === 'minor-healing-potion'` and
   `event.price === 12`. After the record:
   - `player.currency === 13` (was 25, minus 12).
   - `player.inventory` contains exactly one item whose `id` is
     `minor-healing-potion`.
5. A `sellItem` state-log record fires with
   `event.itemId === 'minor-healing-potion'` and
   `event.price === 6` (the engine-default half-price). After the
   record:
   - `player.currency === 19` (was 13, plus 6).
   - `player.inventory` is empty again.
   - The sell price is **strictly less** than the buy price — the
     `defaultSellPrice` invariant the iterate `3ba5319` regression
     tests pin.
6. The shop closes via the `leave` action (no further `buyItem` /
   `sellItem` records before the quit).
7. The run terminates cleanly via the `quit` tab; the JSON event
   stream's final entry is a `game:saved`-or-quit-equivalent.

**Negative conditions (the agent should NOT see):**

- No `buyItem` / `sellItem` record with `event.price` ≤ 0.
- No round-trip where the player ends with currency strictly greater
  than the starting 25 (the exploit closed at iterate `3ba5319`).
- No `combat:started` event — this is a non-combat walkthrough.

**Mirrors:** `stat-allocation.{json,goal.md}` (Phase 29) for the
buy → mutate → assert pattern; `save-load.{json,goal.md}` for the
fv-2 → fv-3 traversal that this walkthrough piggybacks on. The shop
walkthrough is the eighth in the post-Phase-26 agent-graded set and
closes the gap critique-15 flagged.
