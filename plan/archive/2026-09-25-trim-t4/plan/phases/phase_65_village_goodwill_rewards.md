# Phase 65 — Village goodwill rewards

## Outcome

`GameState.mapGoodwill` (Phase 63's per-map sacrifice tally, read back passively
by Phase 64's memoir tab) gets its first spend. Three tiers, keyed off a single
map's tally, all derived/idempotent (no "already granted" watermark beyond
what `knownCards` and `flags` already give for free):

- **Tier 1 (tally ≥ 1): a 10% shop discount** on BUY prices at that map's
  village shop. Purely derived — recomputed every time a price is shown or
  charged, no persisted state of its own.
- **Tier 2 (tally ≥ 2): grants the Ally card** `the-sworn-second` (Phase 62)
  directly into `knownCards`, permanently. Idempotent via the existing
  known-cards-includes guard — never double-grants.
- **Tier 3 (tally ≥ 3): a one-time 25-shilling goodwill gift**, tracked by a
  new prefixed flag (`village-goodwill-bonus:<mapName>`) on `GameState.flags`
  — the same boolean-latch mechanism every other one-time story beat already
  uses, so no `GAME_STATE_VERSION` bump is needed anywhere in this phase.

All three thresholds are checked using `≥`, not `===`, and Tier 2/3 grants
guard on "not already granted" rather than "count just crossed N" — this
makes them self-healing against saves that already accumulated goodwill
before this phase shipped (see Decision 8).

## Problem (from `01_build_plan.md`)

Phase 65 row: *"Village goodwill rewards. T's framing: 'When they visit a
village in that map, they'll receive discounts at the shop, an ally card
reward, and other various rewards.'"* Scope: a price hook on the shop
(`ShopInventory` is today just `{ wares }`, no multiplier anywhere) plus the
ally-card grant from Phase 62, both gated on Phase 63's per-map counter.
"Other various rewards" was deliberately left unspecified for this brief to
resolve. Deps: 62, 63.

## Scope

Both workspaces.

### Mechanics (`axiomancer-mechanics`)

**New file — `src/World/village-goodwill.ts`** (pure constants + one pure
function; sibling to `MapEvents/`, not a dedicated `Game/`-level module,
since it's genuinely World/village domain logic consuming the `Game`-level
`mapGoodwill` counter — same "the consumer domain owns the cross-cutting
reward file" precedent `Combat/combat.rewards.ts` sets for
Combat-consumes-Cards):

```ts
/**
 * Phase 65 — village goodwill reward tiers. All three thresholds read
 * GameState.mapGoodwill[mapName] and are checked with >=, not ===, so a
 * save that already holds a qualifying tally (e.g. from Phase 63 having
 * shipped before this phase) qualifies the next time any of these are
 * checked — no backfill migration needed. Tier 2/3 grants are themselves
 * idempotent (knownCards-includes / flags-includes), so re-checking on
 * every sacrifice claim is always safe.
 */

export const GOODWILL_DISCOUNT_THRESHOLD = 1;
/** 10% off BUY prices only — sell prices are untouched (see Decision 3). */
export const GOODWILL_DISCOUNT_RATE = 0.10;

export const GOODWILL_ALLY_THRESHOLD = 2;
/** The Ally granted at Tier 2. Phase 62's only shipped Ally. */
export const GOODWILL_ALLY_CARD_ID = 'the-sworn-second';

export const GOODWILL_BONUS_THRESHOLD = 3;
export const GOODWILL_BONUS_CURRENCY = 25;
export const GOODWILL_BONUS_FLAG_PREFIX = 'village-goodwill-bonus:';

/** Buy-price after the Tier 1 discount. Floors, matching `defaultSellPrice`'s
 *  rounding convention. No-ops (returns `price` unchanged) below threshold. */
export function applyGoodwillDiscount(price: number, goodwillCount: number): number {
    if (goodwillCount < GOODWILL_DISCOUNT_THRESHOLD) return price;
    return Math.max(0, Math.floor(price * (1 - GOODWILL_DISCOUNT_RATE)));
}

/** The per-map flag id gating the one-time Tier 3 currency gift. */
export function goodwillBonusFlag(mapName: string): string {
    return `${GOODWILL_BONUS_FLAG_PREFIX}${mapName}`;
}
```

Exported from `World/index.ts` and the top-level `src/index.ts` barrel
(mirrors every other World export block).

**`CLI/game.cli.ts` `shopLoop`** — buy path applies
`applyGoodwillDiscount(ware.price, store.getState().mapGoodwill?.[store.getState().world.currentMap.name] ?? 0)`
before affordability-checking and charging, so the CLI driver stays at parity
with mobile (same "both workspaces get the real behavior" precedent every
prior phase in this row sets). Sell path is untouched (Decision 3).

**No `GAME_STATE_VERSION` bump.** `flags: string[]` and `knownCards: string[]`
both already exist; this phase only writes new *values* into them, not new
*shape*.

### Mobile (`axiomancer-mobile`)

**`state/presenters/village.engine.ts`**:
- `selectVillageVM`'s param type gains `'mapGoodwill' | 'world'` (currently
  `Pick<AppStoreState, 'event' | 'player'>`).
- `VillageWareVM` gains two fields: `basePrice: number` (the undiscounted
  ware price, for strikethrough display) and `discounted: boolean`
  (`basePrice !== price`). `price` becomes the POST-discount price (the
  actual charge) — same value the BUY action must use, so both read through
  the same `applyGoodwillDiscount` call with the same inputs.
- Discount lookup: `const goodwillCount = state.mapGoodwill?.[state.world?.currentMap?.name ?? ''] ?? 0;`
  then `price: applyGoodwillDiscount(ware.price, goodwillCount)`,
  `basePrice: ware.price`. `affordable` compares `currency >= price` (the
  discounted price — the player should be able to afford what they're
  actually charged).
- `sellables` / `sellPrice` — **unchanged**, no discount (Decision 3).

**`state/actions.ts` `buyVillageWareAction`**: after resolving `ware`, compute
the same `goodwillCount` from `state.mapGoodwill`/`state.world.currentMap.name`
and charge `applyGoodwillDiscount(ware.price, goodwillCount)` via
`engineBuyItem`, instead of raw `ware.price` — single source of truth with
the presenter, so the displayed price is always the charged price.
`sellVillageItemAction` — unchanged.

**`state/cache/store-actions.ts` `claimLootCacheChoiceOutcomeAction`** — inside
the existing `if (outcome.chosen === 'sacrifice')` block, after `goodwill` is
computed for `mapName`:

```ts
if (mapName) {
    patch.mapGoodwill = { ...prevGoodwill, [mapName]: goodwill };

    if (goodwill! >= GOODWILL_ALLY_THRESHOLD && !player.knownCards.includes(GOODWILL_ALLY_CARD_ID)) {
        player = unlockCardViaDilemma(player, GOODWILL_ALLY_CARD_ID);
    }

    const bonusFlag = goodwillBonusFlag(mapName);
    const flags = state.flags ?? [];
    if (goodwill! >= GOODWILL_BONUS_THRESHOLD && !flags.includes(bonusFlag)) {
        player = { ...player, currency: player.currency + GOODWILL_BONUS_CURRENCY };
        patch.flags = [...flags, bonusFlag];
    }

    patch.player = player;
}
```

(`patch.player = player` was already being set unconditionally above this
block from the `card`/`item` branches' possible mutation — the sacrifice
branch now also needs to re-set it since `player` may have been reassigned
here. Thread this through cleanly rather than duplicating the assignment —
see the file's existing `let player: Character = state.player;` at the top,
which this block already closes over.)

Uses `unlockCardViaDilemma` (Combat/combat.rewards.ts, already exported from
`@mechanics`) — the existing "bypass normal learn gates, no-op if already
known or unknown id" grant primitive, semantically exactly this case (a
reward grant, not a player-initiated learn). Reuses it rather than the
`LEARN_CARD` action's `learnCard`, which is the normal opt-in pathway.

**`state/presenters/cache.engine.ts` `selectCacheVM`** — preview the Tier
2/3 grants on the outcome screen BEFORE the player commits (mirrors how
`goodwillPreview` already previews the tally increment before claim):
- Param type gains `'player' | 'flags'` (now
  `Pick<AppStoreState, 'cache' | 'mapGoodwill' | 'world' | 'player' | 'flags'>`).
- `CacheChoiceOutcomeVM` gains `allyGrantPreview: string | null` (the Ally's
  display name via `getCardById(GOODWILL_ALLY_CARD_ID)?.name`, set iff
  `outcome.sacrificed && goodwillPreview >= GOODWILL_ALLY_THRESHOLD &&
  !player.knownCards.includes(GOODWILL_ALLY_CARD_ID)`) and
  `bonusPreview: number | null` (`GOODWILL_BONUS_CURRENCY`, set iff
  `outcome.sacrificed && goodwillPreview >= GOODWILL_BONUS_THRESHOLD &&
  !flags.includes(goodwillBonusFlag(mapName))`).

**`app/cache/index.tsx`** — two new chips in the outcome `chipRow`, reusing
the EXISTING chip copy helpers (no new copy needed — a granted card and a
currency gift render exactly like the `card`/`item` offers' own chips):
```tsx
{vm.outcome.allyGrantPreview !== null && (
    <Text style={styles.chip}>{cacheOutcomeCardChip(vm.outcome.allyGrantPreview)}</Text>
)}
{vm.outcome.bonusPreview !== null && (
    <Text style={styles.chip}>{cacheOutcomeCurrencyChip(vm.outcome.bonusPreview)}</Text>
)}
```
The screen threads `player`/`flags` from the store into `selectCacheVM`
alongside the existing `cache`/`mapGoodwill`/`world` picks.

**`app/village/index.tsx`** — the BUY row's price text shows the strikethrough
base price beside the discounted price when `ware.discounted`:
```tsx
<View style={styles.flexOne}>
    ...
</View>
{ware.discounted && (
    <Text style={styles.warePriceStruck}>{ware.basePrice}s</Text>
)}
<Text style={[styles.warePrice, !ware.affordable && styles.warePriceUnaffordable]}>{ware.price}s</Text>
```
New style `warePriceStruck: { ...styles.warePrice, fontSize: 12, color: AXM.bone, textDecorationLine: 'line-through' }`
(reuses existing tokens, no new hex literals — Hard rule).

## Content / data reads

| Helper | Call | Use |
|---|---|---|
| `applyGoodwillDiscount` (new, `@mechanics`) | `applyGoodwillDiscount(ware.price, goodwillCount)` | BUY price display + charge |
| `unlockCardViaDilemma` (existing, `@mechanics`) | `unlockCardViaDilemma(player, GOODWILL_ALLY_CARD_ID)` | Tier 2 grant |
| `goodwillBonusFlag` (new, `@mechanics`) | `goodwillBonusFlag(mapName)` | Tier 3 idempotency key |
| `getCardById` (existing, already imported in `cache.engine.ts`) | `getCardById(GOODWILL_ALLY_CARD_ID)?.name` | Ally display name in the outcome preview |

## Output schema / contracts

```ts
// village.engine.ts
export interface VillageWareVM {
    itemId: string;
    name: string;
    description: string;
    price: number;       // CHANGED: now the post-discount (charged) price
    basePrice: number;   // NEW
    discounted: boolean; // NEW
    affordable: boolean;
}

// cache.engine.ts
export interface CacheChoiceOutcomeVM {
    // ...existing fields unchanged...
    allyGrantPreview: string | null; // NEW
    bonusPreview: number | null;     // NEW
}
```

`VillageSellableVM` and every other VM shape in both files are unchanged.
`ClaimLootCacheChoiceResult` (store-actions.ts) is unchanged — its `goodwill`
field already gives tests what they need; the ally/bonus grants are
observable on `player.knownCards` / `player.currency` / `state.flags` after
the action runs, same as the `card`/`item` branches already are.

## Decisions made upfront — DO NOT ASK

1. **Grant mechanism for the Ally: `unlockCardViaDilemma` into `knownCards`,
   not `combatRewardCards`.** Phase 62's open question (Decision 7) was
   "knownCards mutation? owned-allies list? immediate deck insertion or
   only future combats?" `combatRewardCards` (the `addRewardCard` path the
   `card`/`item` offers already use) is a transient, removable, current-run
   deck topper — wrong shape for "a persistent companion now permanently in
   your collection." `knownCards` is the permanent-unlock shape every other
   card grant uses. Whether it reaches the CURRENT combat deck immediately
   depends on the pre-existing curated-loadout mechanism (Phase 169): if the
   player has no curated loadout yet, `buildCombatDeck` falls back to full
   `knownCards` and the Ally appears immediately; if they've curated one,
   they add it via the existing loadout editor, same as any other newly
   learned card. No special-casing needed — this is the established,
   already-shipped precedent for "I just learned a new card," not a new
   behavior invented for Allies.
2. **`unlockCardViaDilemma` over `learnCard`.** Both have byte-identical
   bodies today (`knownCards.includes` guard + `getCardById` existence
   guard + append) — but `unlockCardViaDilemma`'s doc comment already
   describes exactly this shape ("bypasses the normal learnCard requirement
   gates... because the [event] choice is itself the gate"), and reusing it
   documents intent at the call site without relying on two functions
   happening to have identical bodies today.
3. **Discount applies to BUY prices only, never SELL.** T's word is
   "discounts" — paying less, not being paid more. Keeps `defaultSellPrice`
   and the whole `sellables` VM/action path untouched, which also sidesteps
   any risk of re-opening the Phase 37 buy→sell exploit-fix (`defaultSellPrice`
   floors to strictly-less-than-buy specifically to foreclose an infinite-money
   loop; a sell-side discount stacked on top of that arithmetic is exactly
   the kind of change that arithmetic was hardened against, and it isn't
   what was asked for).
4. **Flat 10% BUY discount at Tier 1, non-scaling.** No second discount tier
   at Tier 2/3 — those tiers deliver a DIFFERENT reward each (ally, currency),
   which is more legible than three stacked discount percentages the player
   would have to track mentally per map.
5. **Tier thresholds (1 / 2 / 3) sized against the authored content, not
   arbitrary.** Both `fishing-village` (`fv-12`/`fv-11`/`fv-17`) and
   `northern-forest` (`nf-5`/`nf-16`/`nf-20`) currently author exactly THREE
   `loot-cache` nodes each. Setting Tier 3 at exactly 3 means a player who
   sacrifices every single cache opportunity in one map earns all three
   tiers in that map — full commitment to the sacrifice path pays out
   completely, with no unreachable tier and no leftover headroom.
6. **The Ally/bonus grants are NOT gated on that map having a shop.**
   `fishing-village` currently has zero authored `village`/shop nodes (only
   `northern-forest`'s `nf-8` "Glen Market" and `nf-18` "Hidden Camp" carry
   `shop:`) — a pre-existing content gap, not something this phase's scope
   (a reward-plumbing phase, not a content-authoring one) is asked to fix.
   Gating the Tier 2/3 grants on the SACRIFICE claim itself (not on a later
   shop visit) means `fishing-village` sacrifices still earn the Ally and
   the currency gift even though that map's Tier 1 discount currently has
   nowhere to manifest. A future phase authoring a `fishing-village` shop
   node is the natural follow-up, not this one.
7. **Tier 3's "other various reward" is a flat one-time currency gift
   (25 shillings), tracked by a new prefixed flag
   (`village-goodwill-bonus:<mapName>`).** The build-plan row deliberately
   left "other various rewards" unspecified for this brief to resolve. A
   currency gift is the simplest new reward shape that (a) needs no new
   persisted counter (the flags array already exists), (b) is trivially
   idempotent (flags-includes guard), and (c) reads as "the village repays
   you in the coin it has" — thematically consistent with a shop-adjacent
   reward without requiring new content (a new item, a new NPC line) this
   phase doesn't have scope to author.
8. **All three thresholds check `≥`, and Tier 2/3 grants guard on
   "not already granted" (idempotent) rather than "just crossed exactly N"
   (transition-only).** Phase 63 has already been live in production for
   several days before this phase ships; some saves may already hold a
   qualifying `mapGoodwill` tally. An exact-equality check
   (`goodwill === 2`) would permanently skip a save that jumped past 2
   before this code existed. A `≥` + idempotent-guard check instead
   self-heals the FIRST time that save's player performs any further
   sacrifice on that map — no migration hop needed. Residual gap, accepted:
   a save that had ALREADY exhausted every authored `loot-cache` node on a
   given map (all 3, on either map) before this phase shipped would need a
   node that doesn't exist to trigger the backfill check, since checks
   only run at sacrifice-claim time, not on every shop visit. Given Phase
   63 shipped only days ago on a small install base, this is treated as an
   accepted, documented edge case rather than a reason to add a shop-visit-time
   safety net or a full migration hop — both are disproportionate plumbing
   for a near-zero-probability gap.
9. **CLI (`shopLoop`) gets the discount too, sell path untouched — same
   split as mobile.** Keeps the two consumers of `Items/shop.reducer.ts`
   pricing at parity, matching how every prior phase in this row (62/63/64)
   touched both workspaces.
10. **No new copy strings.** The outcome-screen chips for the Ally grant and
    the currency bonus reuse the EXISTING `cacheOutcomeCardChip` /
    `cacheOutcomeCurrencyChip` helpers (`cache.copy.ts`) — a granted card and
    a currency gift render identically to the `card`/`item` offers' own
    chips, and inventing parallel copy for "the same visual fact, arrived at
    a different way" would be duplication with no reader-facing benefit.
11. **No `GAME_STATE_VERSION` bump.** Both `flags: string[]` and
    `knownCards: string[]` already exist on every save; this phase writes
    new values into existing arrays, not new shape.

## Empty / loading / error states

- A shop with `goodwillCount < 1`: `basePrice === price`, `discounted: false`
  — renders exactly as it does today, byte-identical VM for every existing
  test that doesn't set up goodwill.
- A sacrifice claim below every threshold: `allyGrantPreview` and
  `bonusPreview` are both `null` — the outcome chip row renders exactly as
  Phase 63 shipped it (no new chips appear).
- A sacrifice claim that re-crosses an already-granted threshold (e.g. a
  4th, 5th... sacrifice on a map already past Tier 3): both guards are
  already-true, so no chip appears and no double-grant happens — same
  "idempotent, no visible effect on replay" contract every other grant
  primitive in this codebase already holds.

## Mobile reflow / responsive / paginate / output limits

None new. The struck-through base price is a single extra `<Text>` node
inside the existing `wareRow` flex row — at 375px the row already fits
name + description + one price column; adding a small second price token
before it does not change the row's height or wrapping behavior (verified
by running the existing 375px village e2e after the change, not a new
viewport concern this brief needs to author for).

## Pages × tests matrix

| Surface | Test |
|---|---|
| `applyGoodwillDiscount`: below/at/above threshold, floors, never negative | `axiomancer-mechanics/src/World/e2e/village-goodwill.engine.test.ts` (new) |
| `goodwillBonusFlag` format | same file |
| CLI `shopLoop` buy path charges the discounted price | `axiomancer-mechanics/src/CLI/e2e/game.cli.engine.test.ts` (extended, if it covers shopLoop; else a focused new case) |
| `selectVillageVM`: `basePrice`/`discounted`/`price`/`affordable` at goodwill 0 / 1 / above | `axiomancer-mobile/state/presenters/__tests__/village.engine.test.ts` (extended) |
| `buyVillageWareAction` charges the discounted price, not the raw ware price | `axiomancer-mobile/state/e2e/village-shop.engine.test.ts` (extended) |
| `sellVillageItemAction` unaffected by goodwill (regression) | same file |
| Sacrifice claim at tally 2 grants the Ally into `knownCards`, no-ops if already known | `axiomancer-mobile/state/e2e/cache.flow.engine.test.ts` (extended) |
| Sacrifice claim at tally 3 grants +25 currency once, sets the flag, no-ops on replay | same file |
| Sacrifice claim at tally 1 (below both) grants neither | same file |
| `selectCacheVM`: `allyGrantPreview`/`bonusPreview` populate/stay-null correctly across tallies and already-granted state | `axiomancer-mobile/state/e2e/cache.flow.engine.test.ts` or a presenter-level test alongside it, mirroring how `goodwillPreview` is already covered |

## Verify gate

`npm run verify --workspace axiomancer-mechanics` and
`npm run verify --workspace axiomancer-mobile` — both green.

## Commit body template

```
feat(world): village goodwill spends the counter — phase 65

- new World/village-goodwill.ts: applyGoodwillDiscount (10% off BUY prices
  at goodwill >= 1), goodwillBonusFlag (idempotency key for the Tier 3
  currency gift) — pure, no new persisted shape
- Tier 2 (goodwill >= 2): grants the-sworn-second into knownCards via the
  existing unlockCardViaDilemma bypass-gate primitive; idempotent
- Tier 3 (goodwill >= 3): one-time +25 currency, tracked by a new
  village-goodwill-bonus:<map> flag on the existing GameState.flags array
- mobile: village.engine.ts prices BUY wares post-discount (basePrice +
  discounted added to the VM for strikethrough display); buyVillageWareAction
  charges the same discounted price; sell path untouched
- mobile: cache.engine.ts previews the Ally/bonus grant on the outcome
  screen before claim (allyGrantPreview/bonusPreview), reusing the existing
  card/currency outcome chips — no new copy
- CLI shopLoop buy path gets the same discount for parity
- no GAME_STATE_VERSION bump — flags/knownCards already exist

Decisions:
- knownCards (permanent), not combatRewardCards (transient reward-queue) —
  an Ally is a persistent companion, not a run-scoped deckbuilder pickup
- >= threshold checks + idempotent grant guards, not === transition checks
  — self-heals saves that already held a qualifying tally before this
  phase shipped (Phase 63 has been live for several days)
- discount is BUY-side only — doesn't touch defaultSellPrice's
  exploit-fix arithmetic
- Tier 3's "other various reward" resolved as a flat currency gift — the
  simplest shape needing no new persisted counter
- fishing-village has no authored shop node yet; Tier 2/3 still fire there
  (gated on the sacrifice claim, not a shop visit) — Tier 1's discount
  just has nowhere to manifest until a future phase authors one

Closes #<phase-issue-number>
```

## DoD

- [ ] `World/village-goodwill.ts` ships with `applyGoodwillDiscount` +
      `goodwillBonusFlag`, exported from both barrels.
- [ ] Tier 2 (`knownCards`) and Tier 3 (`flags`) grants fire exactly once
      per map, checked with `>=` + idempotent guards, inside
      `claimLootCacheChoiceOutcomeAction`.
- [ ] `village.engine.ts` / `buyVillageWareAction` price the discount
      identically (single source of truth); `sellVillageItemAction`
      unaffected.
- [ ] `cache.engine.ts` outcome preview surfaces the Ally/bonus grant
      before claim, reusing existing chip copy.
- [ ] CLI `shopLoop` buy path applies the same discount.
- [ ] `npm run verify` green on both touched workspaces.

## Follow-ups (out of scope)

- Author a `fishing-village` village/shop node so that map's Tier 1
  discount has somewhere to manifest (Tier 2/3 already work there today).
- A dedicated Ally-collection viewing surface (there is currently no
  mobile screen listing owned Allies distinct from the rest of `knownCards`)
  — not blocking, since the Ally plays like any other oath card once known.
- Additional Allies beyond `the-sworn-second`, if a future goodwill-tier
  redesign wants per-map-distinct companions rather than the same one for
  every map.
