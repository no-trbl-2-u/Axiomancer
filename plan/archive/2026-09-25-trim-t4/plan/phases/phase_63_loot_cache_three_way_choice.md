# Phase 63 — The loot cache becomes a three-way choice

## Outcome

The Reliquary's dice-pool delving session ("Pick Pool" lockpicking —
`World/LootCache/`) is retired and replaced with a plain three-offer choice,
mirroring the shape Phase 52c gave rest: a `loot-cache` node opens one
irreversible pick among **card reward**, **item reward**, or **sacrifice
reward**. Sacrifice grants nothing to the player but writes to a new per-map
goodwill tally on `GameState` — net-new counter state (not a flag, since it
must count rather than latch) that Phase 64 will render on the memoir tab as
"Helped `<map>` N times." `loot-cache-tuning` (skill + workflow + CLI) retires
with the minigame.

## Problem (from `01_build_plan.md`)

**T direct, 2026-08-15:** *"Card reward, item reward, or sacrifice reward."*
Scope: replace The Reliquary's dice-pool delving session with a plain
three-offer choice on the existing resolver (same shape 52c gave rest), and
add the per-map goodwill counter the sacrifice branch writes — T's framing:
*"if the player decides to sacrifice the reward, it'll be noted on their
journal as 'Helped `<current map>` n times'."* The counter is net-new state;
nothing like it exists (the flag system has exactly one `requires.flag` gate
in the whole game, per Phase 53e's finding — since superseded to four, still
all boolean latches, none of them counters). Design it as a per-map tally on
`GameState`, not a flag. This also hands Phase 53e's read-back web its first
real consumer (deferred to Phase 64/65, which render/spend it). Retires
`loot-cache-tuning` + its CLI/workflow with the minigame.

## Scope

Both workspaces. New pure engine (mirrors `RestChoice`'s shape) + deletion of
the old dice-pool engine (mirrors Rest's 52e retirement) + one new `GameState`
counter slice — all folded into this single phase since T assigned the whole
row at once, unlike rest's split across 52c/52d/52e.

### Mechanics (`axiomancer-mechanics`)

**New engine — `src/World/LootCacheChoice/`** (sibling to `RestChoice/`,
same "engine never reads `GameState`, host settles the ledger at claim"
contract):

- `lootcachechoice.types.ts`:
  ```ts
  export type LootCacheChoiceOfferId = 'card' | 'item' | 'sacrifice';
  export type LootCacheChoicePhase = 'offer' | 'outcome' | 'done';

  export interface LootCacheChoiceOutcome {
      chosen: LootCacheChoiceOfferId;
      /** Set iff chosen === 'card' — the host-rolled candidate id. */
      rewardCardId: string | null;
      /** Non-empty iff chosen === 'item' — the host-rolled candidate items. */
      items: readonly Item[];
      /** >0 iff chosen === 'item' — the authored node's currency, pass-through. */
      currency: number;
      /** True iff chosen === 'sacrifice'. */
      sacrificed: boolean;
  }

  export interface LootCacheChoiceSession {
      phase: LootCacheChoicePhase;
      /** Host-rolled candidate (rollCombatCardRewards(player, rng, 1)[0]) for the 'card' offer. */
      cardCandidate: string;
      /** Host-rolled candidates (rollCacheReward(...)) for the 'item' offer. */
      itemCandidates: readonly Item[];
      /** Authored node currency, carried for the 'item' offer. */
      currencyCandidate: number;
      description: string | null;
      outcome: LootCacheChoiceOutcome | null;
      seed: SeedInput;
  }
  ```
  No `offers`/cost/`disabledReason` fields — unlike rest's `cut`, none of the
  three offers are ever unaffordable or disabled; all three are always live.
  No tuning file (`lootcachechoice.content.ts`) — nothing numeric is tuned
  inside this engine; count/rarity tuning lives where it already does
  (`CACHE_REWARD_TUNING` in `Items/cache-reward.ts`,
  `REWARD_RARITY_WEIGHTS`/`REWARD_OFF_THEME_RATE` in `Combat/combat.rewards.ts`).

- `lootcachechoice.engine.ts`:
  ```
  offer ──chooseLootCacheChoiceOffer('card'|'item'|'sacrifice')──▶ outcome ──claimLootCacheChoiceOutcome──▶ done
  ```
  All three offers commit straight to `outcome` — no sub-picks (unlike rest's
  `cut-pick`). `createLootCacheChoiceSession(seed, opts: { cardCandidate,
  itemCandidates, currencyCandidate, description })` builds the `offer`
  session. `chooseLootCacheChoiceOffer(s, offer)`: invalid phase or unknown
  id is a silent no-op (standing contract, matches `RestChoice`); `'card'`
  seals `{ chosen: 'card', rewardCardId: s.cardCandidate, items: [],
  currency: 0, sacrificed: false }`; `'item'` seals `{ chosen: 'item',
  rewardCardId: null, items: s.itemCandidates, currency:
  s.currencyCandidate, sacrificed: false }`; `'sacrifice'` seals `{ chosen:
  'sacrifice', rewardCardId: null, items: [], currency: 0, sacrificed: true
  }`. `claimLootCacheChoiceOutcome(s)`: `outcome → done`, same guard shape as
  `claimRestChoiceOutcome`.

- `index.ts` — barrel, mirrors `RestChoice/index.ts`.
- `e2e/lootcachechoice.engine.test.ts` — full phase-machine coverage: each
  offer's outcome shape, invalid-phase no-ops, unknown-offer no-op, claim
  guard (can't claim from `offer`/before an outcome exists).

**Deleted — `src/World/LootCache/` entire** (`index.ts`, `lootcache.types.ts`,
`lootcache.engine.ts`, `lootcache.rng.ts`, `lootcache.sim.ts`,
`e2e/lootcache.engine.test.ts`, `e2e/lootcache.balance.sim.test.ts`).
**`Items/cache-reward.ts` (`rollCacheReward`, `CacheLootTier`,
`CACHE_REWARD_TUNING`) is KEPT** — it's a plain deterministic roller with no
dependency on the deleted session machine, and the new engine's host
(mobile) calls it directly to build `itemCandidates`.

**Deleted CLI**: `src/CLI/lootcache.cli.ts` +
`src/CLI/e2e/lootcache.cli.engine.test.ts`; the `if (rawArgs[0] ===
'loot-cache')` dispatch block in `src/CLI/game.cli.ts` removed; its
`describeResolvedEvent` `case 'loot-cache':` narration line (~line 392) is
UNTOUCHED — same precedent as gathering/rest, it renders the surviving
kind's plain narration, not the minigame. `package.json`: delete the
`"loot-cache"` npm script.

**Deleted skill/workflow**: `.claude/commands/loot-cache-tuning.md`,
`.github/workflows/loot-cache-tuning.yml`. `AGENTS.md`: drop
`loot-cache-tuning` from the two tuning-skill roster sentences (lines ~93,
105) and append it to the existing "already-retired skills" sentence
alongside `rest-tuning`/`quest-board-tuning`/`gathering-tuning`.

**Barrel exports**: `src/World/index.ts` and `src/index.ts` — swap the
`LootCache` re-exports for `LootCacheChoice` ones (types + engine functions),
mirroring how `RestChoice` is exported today.

**`MapEventKind`/resolver — NO CHANGE.** `MapEvents/types.ts`'s
`'loot-cache'` union member, `LootCachePayload`, and the `ResolvedEvent`
member all stay exactly as-is; `MapEvents/handlers.ts`'s `resolveLootCache`
keeps granting `payload.items`/`currency` directly onto `state.player` on
node entry — this is the same "decoy grant, immediately undone by the
mobile interceptor" shape `resolveRest`'s passive heal already has (see
`restchoice` module header precedent). The 7 authored `loot-cache` nodes in
`MapEvents/content.ts` are untouched; their `currency` field becomes
`LootCacheChoiceSession.currencyCandidate`, their optional `items` field
stays unused by the new flow (as it already was unused by the old engine,
which always rolled its own loot via `rollCacheReward` regardless of
payload).

**`hermeticity.audit.test.ts`**: drop the
`'CLI/e2e/lootcache.cli.engine.test.ts'` IO-allowlist entry.

**`Game/types.ts`** — new required `GameState` field:
```ts
/**
 * Phase 63 — per-map goodwill tally. Written only by the loot-cache
 * sacrifice offer (never a flag: it counts, it does not latch). Keyed by
 * `MapName`; a map with no entry has never been helped. Required state
 * slice; defaults to `{}` on new games and legacy saves via
 * `migrateV19toV20`.
 */
mapGoodwill: Record<string, number>;
```
Placed as a sibling to `factionReputations`/`regionConsequences` (the
existing per-key numeric/string-array state slices) — a plain
`Record<string, number>`, no dedicated domain module (no helper needed
beyond the inline increment at claim time; this is materially simpler than
`FactionReputations`, which has deltas/thresholds this counter does not).

**`Game/game.reducer.ts`**: `createNewGameState()`/default-state builder
gets `mapGoodwill: {}`; `resetRun()` carries it forward (`mapGoodwill:
state.mapGoodwill` — goodwill is player-knowledge-shaped like
`factionReputations`/`codex`, not run-scoped, so it survives a run reset).

**`Game/game.migrate.ts`**: `GAME_STATE_VERSION` 19→20. New
`migrateV19ToV20` hop: (a) clears a live `cache`-slice `LootCacheSession`
riding in old raw save payloads' mobile-only `cache` key (mirrors Phase
76's `migrateV18ToV19` gathering-session clear exactly), (b) defaults
`mapGoodwill: {}` for legacy payloads missing the field. New hermetic
migration test
(`Game/e2e/loot-cache-choice-migration.engine.test.ts`).

**Docs**: `docs/encounters/loot-cache.md` rewritten to describe the new
three-way choice (the encounter survives, only its delivery mechanism
changes — unlike gathering/rest, this doc is NOT marked HISTORICAL, it's
updated in place). `docs/encounters/loot-cache-alt-hybrid-spec.md` deleted
outright (an unbuilt alt spec, explicitly marked "NOT IMPLEMENTED" already
— nothing to go HISTORICAL). `docs/adr/ADR-0008-loot-cache-pick-pool.md`
marked HISTORICAL (documents the now-retired pick-pool design).
`docs/world.md`: the Phase 137 "mobile host intercepts `loot-cache`/hazard"
paragraph updated to describe the choice screen instead of the delving
session; the `npm run loot-cache` CLI mention dropped; the "Loot-Cache
(\"The Reliquary\") — `lootcache.sim.ts`" balance-sim section deleted
wholesale (mirrors the Gathering section Phase 76 deleted). `docs/testing.md`
CLI driver mention updated. `docs/cli.md`'s `lootcache.cli.ts` driver
section removed wholesale.

### Mobile (`axiomancer-mobile`)

**`state/cache/store-actions.ts`** — rewritten (not deleted; the file/slice
name `cache` stays, matching how `state/rest/store-actions.ts` kept its name
across the rest retirement):
- All dice-pool action fns removed (`beginLootCacheAction`,
  `startLootCacheDelvingAction`, `delveLootCacheAction`,
  `pushLootCachePickAction`, `channelLootCacheInsightAction`,
  `retreatLootCachePickAction`, `sealLootCacheAction`,
  `continueLootCacheCardAction`, `abandonLootCacheAction`), replaced with:
  - `beginLootCacheChoiceAction(store, { currency, description, seed? })` —
    rolls `cardCandidate` via `rollCombatCardRewards(player, rng, 1)[0]`
    (falling back to any pool card if the roll is somehow empty — pool is
    never empty per `Combat/combat.rewards.ts`'s own guarantee) and
    `itemCandidates` via `rollCacheReward({ playerLevel: player.level,
    seed, tier })`, `tier` derived the same way the retired flow derived it
    (`northern-forest` → `'rich'`, else `'modest'` — this derivation MOVES
    from `actions.ts`'s interceptor into this fn's caller, unchanged
    logic).
  - `chooseLootCacheChoiceOfferAction(store, offer)` — thin wrapper over
    `chooseLootCacheChoiceOffer`.
  - `claimLootCacheChoiceOutcomeAction(store)` — applies the outcome:
    `'card'` → `addRewardCard(player, outcome.rewardCardId)`; `'item'` →
    append `outcome.items` to inventory + add `outcome.currency`;
    `'sacrifice'` → `mapGoodwill: { ...state.mapGoodwill, [mapName]:
    (state.mapGoodwill[mapName] ?? 0) + 1 }` where `mapName =
    state.world.currentMap.name` read at claim time (the route is
    back-out-proof like `/rest`, so the map cannot change mid-session). All
    three branches clear the `cache` slice and call `store.getState().save()`
    in a try/catch, matching `claimRestChoiceOutcomeAction`'s shape.
- `CACHE_TUTORIAL_FLAG`/`CACHE_TUTORIAL_SEED`/`CACHE_TUTORIAL_TIER`/
  `CACHE_TUTORIAL_CURRENCY` constants dropped — the new three-button choice
  needs no guided coach (mirrors `RestChoice` having no tutorial machinery
  of its own). `CACHE_KEEPSAKE_FLAG_PREFIX` **stays** (historical saves may
  carry `cache-keepsake:`-prefixed flags from the old engine's deepest-layer
  keepsakes; Memoir's `extractKeepsakes` keeps reading them back — same
  "kept per the retirement brief's KEEP list" precedent as
  `REST_KEEPSAKE_FLAG_PREFIX`). No new keepsake flag is minted by the
  sacrifice offer — the goodwill counter itself is the record, per T's
  framing.

**`state/presenters/cache.engine.ts`** — rewritten: `CacheVM` narrows to the
three-offer shape (`offers: LootCacheChoiceOfferId[]`, `outcome:
LootCacheChoiceOutcome | null`, `description`), `CACHE_TIER_LABELS` dropped
(no more layer-tier display).

**`state/store.ts`**: `MobileCacheSlice` narrows to `{ session:
LootCacheChoiceSession | null }` (was already this shape structurally —
only the imported session type changes); `EMPTY_CACHE_SLICE` unchanged
shape. **New required `GameState`-mirroring field**: `mapGoodwill:
Record<string, number>` added to `AppStoreState` (sourced from
`GameState.mapGoodwill`) and its initial-state assignment, same pattern as
every other `GameState` field the store mirrors.

**`app/cache/index.tsx`** — rewritten from the 544-line
intro/delving/picking/card/outcome dice-tray renderer down to a `RestGate`
sibling shape: three offer buttons (`card` / `item` / `sacrifice`) each with
a one-line flavor description pulled from copy constants, an outcome panel
after commit (showing what was won, or the goodwill tally increment for
sacrifice), and a claim button. No dice, no haptics-per-roll, no phase
progress meter.

**Deleted mobile components**: `components/cache/CacheDie.tsx`,
`components/cache/CacheProgressMeter.tsx`,
`components/cache/CacheTutorialCoach.tsx` (+ test),
`components/cache/tutorial-steps.ts` (+ test).

**`components/CacheGate.tsx`** (+ test) — kept, side-effect-only route push
on `selectHasActiveCache`, unchanged shape (mirrors `RestGate`).

**`state/actions.ts`**:
- Import block updated: drop dice-pool action imports, add
  `beginLootCacheChoiceAction`, `chooseLootCacheChoiceOfferAction`,
  `claimLootCacheChoiceOutcomeAction`.
- `AppActions` interface + wiring updated to the three new method
  signatures (replacing the ~9 dice-pool methods).
- **Interception block rewritten** (lines ~1611-1632): same "undo the
  resolver's grant, clear the event slice" opening, but calls
  `beginLootCacheChoiceAction(store, { currency: result.event.currency,
  description: result.event.description })` unconditionally — the
  `tutorialDone` branch and its `{ tutorial: true }` call are deleted
  entirely (no tutorial in the new flow).

**`state/minigame-seeds.ts`**: `MinigameSeedKey`'s `'cache'` entry stays
(the new engine still wants a deterministic seed for its `rollCacheReward`
call) — only the dice-pool-specific fields on `MinigameSeedEntry`, if any
are cache-only, get dropped (confirm no other key shares them first).

**`components/DebugTriggerEncounter.tsx`**: the `'treasure'` case (routes to
`/cache` via `<CacheGate>`) stays functionally the same — it still just
needs to seed a live cache node and let the gate fire; no dice-pool-specific
debug wiring to unwind here beyond confirming it doesn't reference deleted
tutorial constants.

**`components/DebugEncounterButtons.tsx`**: `DebugCacheRow`'s TUTORIAL
button is deleted (no tutorial anymore); the DIG button stays (still
triggers a live cache node).

**Dead-end-kind bookkeeping — NO CHANGE.**
`state/presenters/event.engine.ts`'s `case 'loot-cache':` in the dead-end
switch and `state/presenters/event-assets.ts`'s `case 'loot-cache':` +
`DEFAULT_BODY_BY_KIND['loot-cache']` stay exactly as they are — `loot-cache`
never reached the event modal before and still doesn't (same precedent
`rest` sets: a minigame-retired-but-kind-kept case stays in the dead-end
camp, routed to its own gate/screen instead of the modal).

**Node-type icon mapping — NO CHANGE.**
`state/presenters/exploration.engine.ts`'s `'loot-cache': 'treasure'` entry
in `KIND_TO_NODE_TYPE` stays untouched (maps the unfired node's on-map icon,
unrelated to the minigame).

**e2e tests**: `state/e2e/cache.flow.engine.test.ts` rewritten for the
three-offer flow (card/item/sacrifice outcomes, claim application,
`mapGoodwill` increment); `state/e2e/cache.loot-table.engine.test.ts`
rewritten to assert `itemCandidates` rolling (same `rollCacheReward` call,
new call site); `state/e2e/cache.tutorial.engine.test.ts` **deleted**
(no tutorial); loot-cache cases inside `state/e2e/event.engine.test.ts` and
`state/e2e/map-encounter-minigames.engine.test.ts` updated for the new
interception shape; `state/e2e/minigame-seeds.engine.test.ts`'s `cache`
case updated if its fixture shape changed.

**Docs**: `axiomancer-mobile/design/encounters/loot-cache.md` rewritten for
the new three-button screen. `axiomancer-mobile/docs/E2E_INVENTORY.md`
updated rows. `README.md` route-table row for `cache/` unchanged (route
survives, just its content).

## Player-visible impact

- Stepping onto a `loot-cache` node opens a single screen: "You've found a
  cache." with three buttons — **Take a card**, **Take goods**, **Leave it
  for the village** (exact copy TBD by whoever writes the screen strings;
  functionally: card / item / sacrifice). No dice, no lockpicking, no jam
  risk, no vitae cost — the cache can no longer hurt the player.
- Choosing **card** grants one reward card (same pool/weighting as a
  post-combat card reward) straight to the deck.
- Choosing **item** grants a tier-scaled consumable haul + the node's
  authored currency, same reward math the old engine used
  (`rollCacheReward`), just without the layer-by-layer reveal.
- Choosing **sacrifice** grants nothing directly but increments a per-map
  counter — invisible this phase (Phase 64 renders it on Memoir as "Helped
  `<map>` N times"; Phase 65 spends it on village rewards). The choice is
  irreversible once claimed, same as every other minigame-node visit in this
  game.
- The dev-tools cache tutorial button is gone; the DIG debug button still
  seeds a live cache node.

## Decisions made upfront — DO NOT ASK

1. **All three offers instant-terminal, no sub-picks.** T's framing is "card
   reward, item reward, or sacrifice reward" — three parallel top-level
   choices, not "pick one of N cards." Unlike rest's `cut` (which genuinely
   needs a deck-removal picker), the card offer's card is host-rolled at
   session creation and simply named in the outcome — this keeps the new
   engine's phase machine simpler than `RestChoice`'s (no `card-pick` phase),
   which is the correct target for a "plain three-offer choice."
2. **Host pre-rolls both `cardCandidate` and `itemCandidates` at session
   creation, not lazily at commit.** Mirrors `RestChoice`'s `deckCardIds`
   being computed by the host (`buildCombatDeck`) before the engine ever
   sees them — the pure engine has no `Character`/RNG-with-deck-context
   access, so anything needing that must arrive pre-rolled.
3. **`resolveLootCache`/`LootCacheKind`/payload — untouched.** The resolver's
   direct grant-on-entry is a decoy the mobile interceptor undoes, exactly
   mirroring `resolveRest`'s passive heal. Changing the resolver to NOT grant
   would be a bigger, unnecessary diff for the same net behavior.
4. **`rollCacheReward` (`Items/cache-reward.ts`) survives**, unlike the rest
   of `LootCache/`. It's a standalone deterministic function with no
   session-machine dependency; the new engine's host calls it directly. Not
   moved into `LootCacheChoice/` — it's Items-domain, reused by name from
   its existing home (same relationship `RestChoice` has with
   `Cards/card.removal`'s `cardRemovalPrice`).
5. **No tutorial in the new flow.** Three labeled buttons need no guided
   coach; `RestChoice` (the explicit precedent this phase cites) has none
   either. All `CACHE_TUTORIAL_*` machinery is deleted, not adapted.
6. **`mapGoodwill: Record<string, number>` lives directly on `GameState`**,
   sibling to `factionReputations`, with no dedicated domain module. The
   counter has exactly one writer (the sacrifice claim) and, this phase, zero
   readers — a `Faction`-style module with deltas/thresholds would be
   speculative complexity for a single `count++`.
7. **`mapGoodwill` survives `resetRun()`.** Village goodwill is
   player-knowledge-shaped (like `factionReputations`/`codex`), not
   run-scoped combat/exploration state — a fresh run at the hearth doesn't
   un-help a village.
8. **`cache-keepsake:` flag prefix stays defined but stops being minted.**
   Historical saves may carry old-engine keepsake flags; Memoir's
   `extractKeepsakes` keeps reading them back. The sacrifice offer does NOT
   mint a new flag of its own — the counter itself is the record (T's
   framing names only the counter, no keepsake).
9. **`state/cache/` directory and slice name unchanged** despite the engine
   rename to `LootCacheChoice` — mirrors `state/rest/` keeping its name
   across the `Rest` → `RestChoice` engine swap. Renaming the mobile slice
   directory would be pure churn with no behavior change.
10. **Tier derivation (`northern-forest` → `'rich'`, else `'modest'`) moves
    verbatim from `actions.ts`'s old interceptor into
    `beginLootCacheChoiceAction`'s call site** — same logic, just relocated
    with the rest of the begin-time setup instead of split across two files.

## Empty / loading / error states

None new beyond what `RestChoice`'s screen already proves out: the outcome
panel always has content (every offer produces a non-empty result to show,
including sacrifice's "Helped `<map>`" line), and the route is back-out-proof
(no header back, no swipe-dismiss) exactly like `/rest`. Legacy saves with a
stray `cache` dice-pool session in flight are cleared by
`migrateV19ToV20`, same as every prior minigame retirement.

## Pages × tests matrix

| Surface | Test |
|---|---|
| `LootCacheChoice` engine — full phase machine, all 3 offers, no-ops | `axiomancer-mechanics/src/World/LootCacheChoice/e2e/lootcachechoice.engine.test.ts` (new) |
| `loot-cache` node still grants inline (decoy), mobile undoes + launches choice | `axiomancer-mobile/state/e2e/event.engine.test.ts`, `state/e2e/map-encounter-minigames.engine.test.ts` |
| Card offer grants a reward card to the deck | `axiomancer-mobile/state/e2e/cache.flow.engine.test.ts` (rewritten) |
| Item offer grants tier-scaled consumables + currency | `state/e2e/cache.loot-table.engine.test.ts` (rewritten) |
| Sacrifice offer increments `mapGoodwill[currentMap]`, grants nothing | `state/e2e/cache.flow.engine.test.ts` |
| v19→v20 save migration clears a stale cache session + defaults `mapGoodwill` | `axiomancer-mechanics/src/Game/e2e/loot-cache-choice-migration.engine.test.ts` (new) |
| No tutorial machinery reachable; DIG debug button still works | `axiomancer-mobile/components/__tests__/DebugEncounterButtons.test.tsx` |
| CLI loot-cache driver gone; plain narration line still fires | `axiomancer-mechanics/src/CLI/e2e/game.cli.engine.test.ts` (if it covers `describeResolvedEvent`) |

## Verify gate

`npm run verify --workspace axiomancer-mechanics` and
`npm run verify --workspace axiomancer-mobile` — both green.

## Commit body template

```
feat(world): loot cache becomes a three-way choice — phase 63

- new World/LootCacheChoice pure engine: card / item / sacrifice, each an
  instant-terminal offer (no sub-picks) settled at claim
- delete the old World/LootCache dice-pool engine, its CLI driver + npm
  script, and the loot-cache-tuning skill/workflow
- resolveLootCache/loot-cache MapEventKind untouched — mobile still undoes
  the resolver's decoy grant and launches the new choice screen instead
- mobile: app/cache rewritten from the 544-line dice-tray renderer to a
  3-button RestGate-sibling screen; tutorial machinery deleted entirely
- new GameState.mapGoodwill: Record<string, number> — the sacrifice
  offer's only effect, counts (never latches) per-map help; survives
  resetRun(), defaults {} for legacy saves
- GAME_STATE_VERSION 19->20: clears a stale mobile cache session, defaults
  mapGoodwill for old saves

Decisions:
- all three offers instant-terminal — card/item candidates are host-rolled
  at session creation, not picked from a sub-list (T's framing names three
  parallel choices, not a nested pick)
- mapGoodwill lives directly on GameState (no Faction-style module) — one
  writer, zero readers this phase
- no tutorial in the new flow, matching RestChoice's precedent

Closes #<phase-issue-number>
```

## DoD

- [ ] `World/LootCacheChoice/` ships with full phase-machine coverage;
      `World/LootCache/` and its CLI/skill/workflow are deleted.
- [ ] `loot-cache` node resolution unchanged; mobile's `/cache` route
      renders the three-offer screen and applies each outcome correctly.
- [ ] `GameState.mapGoodwill` ships, increments only via sacrifice, survives
      `resetRun()`, defaults `{}` on migration.
- [ ] `GAME_STATE_VERSION` bumped with a hermetic migration test.
- [ ] `npm run verify` green on both touched workspaces.

## Follow-ups (out of scope)

- Phase 64 — render `mapGoodwill` on the memoir tab.
- Phase 65 — village goodwill rewards (discounts, ally card grant, etc.)
  spent against the counter this phase writes.

