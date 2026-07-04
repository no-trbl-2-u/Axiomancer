# Loot Cache Encounter ("The Reliquary") — Mobile UX Source of Truth

> Derived from `app/cache/index.tsx`, `state/presenters/cache.engine.ts`,
> `state/cache/store-actions.ts`, and `components/cache/*` as of 2026-07-03
> (Pick Pool redesign).
>
> Mechanics rules (engine, layer definitions, dice-pool economy) live in the
> mechanics repo:
> - `docs/encounters/loot-cache.md` — rules source of truth
>
> Confirmed against the shipped `axiomancer-mechanics/src/World/LootCache/`
> Pick Pool rewrite (`LOOT_CACHE_TUNING.{pickPoolSize, maxPushesPerLayer,
> jamSlipThreshold}`, `pushLootCachePick`/`channelLootCacheInsight`/
> `retreatLootCachePick`) — the mobile package typechecks clean against it.

---

## Screen entry

**Route:** `app/cache/index.tsx`
**Gate:** `CacheGate` in the root layout watches `vm.active`
(`selectHasActiveCache`). Navigation fires when a Loot Cache session is created;
the screen auto-exits when the session clears.

No swipe-back gesture (`gestureEnabled: false`).

---

## Session phases and layer map

The presenter (`selectCacheVM`) maps engine phase to a screen layer.

| Engine phase | Screen state | Primary overlay |
|---|---|---|
| `intro` | Cache intro card | IntroOverlay (kneel button) |
| `delving` | Layer stack + delve/seal bar | *(main decision surface)* |
| `picking` | Layer stack + dice tray | *(the tactile centerpiece)* |
| `card` | Layer stack | NarrativeCardOverlay |
| `outcome` | — | OutcomeOverlay |
| `done` | *(auto-exit)* | — |

---

## Public information — no more hidden trap fate

The Pick Pool redesign removed hidden trap fates entirely: every layer's
`difficulty` (the progress target its lock demands) is shown from the moment
the cache opens. There is no probe, no "sealed/live/dud" reading, and nothing
for the presenter to gate — `CacheLayerVM.difficulty` is always populated.
Risk now lives entirely in the live dice-pool roll (slip odds, jam odds),
which is genuinely unknown to the player until the dice land.

---

## Intro overlay

Shown at the `intro` phase. Flavor text for the cache. Single CTA: "KNEEL AND
BEGIN" fires `startLootCacheDelving()` (engine: `beginLootCache`).

---

## Layer stack (persistent surface)

Three `CacheLayerVM` tiles rendered as a vertical stack. Each tile shows:

- Layer name (THE LID / THE FALSE BOTTOM / THE KEEPER'S TITHE)
- Flavor text
- `difficulty` — always visible (`LOCK · N`)
- `reading` chip:
  - `locked` — not yet attempted this session
  - `picking` — the active lock, mid-attempt (dice tray is live)
  - `cracked` — opened clean, loot visible
  - `sprung` — the pick jammed; that layer's loot spoiled
  - `retreated` — closed without opening; no bite, no loot
- Loot summary (shown only once `opened` and not `spoiled`)

While a layer reads `picking`, its tile also renders an inline
**`CacheProgressMeter`** — a fill bar showing `progress` / `difficulty` that
animates its width with `withTiming` on every push that lands.

**Action bar** (visible during `delving` phase, between picks):

| Button | testID | Enabled when | Action |
|---|---|---|---|
| DELVE DEEPER | `cache-delve` | `canDelve` | `delveLootCache()` → opens the next lock, enters `picking` (does not roll) |
| TAKE WHAT'S LIFTED AND GO | `cache-seal` | `canSeal` | `sealLootCache()` |

`canDelve` is false once every layer is opened or closed. `canSeal` is true
throughout `delving`.

---

## Picking phase — the dice tray

The tactile heart of the encounter. While `phase === 'picking'`:

- **Dice tray** (`components/cache/CacheDie.tsx`, `testID="cache-dice-tray"`):
  renders `LOOT_CACHE_TUNING.pickPoolSize` dice (+1 bonus die once Insight is
  spent), each a hand-drawn `react-native-svg` pip face (`Circle`/`Rect`
  primitives, classic 1-6 arrangement). Dice sit idle (face 6, no slip tint)
  until the first push.
- **PUSH** (`cache-push`, primary): rolls the pool. On press: `Haptics.
  impactAsync(Light)`. Every die then plays a staggered tumble — a
  `withSequence` of rotate/translateY/scale via reanimated — before settling
  on the values from `lastRoll.dice`. This is the single most important
  animation in the encounter; each die's tumble is offset by ~60ms per index
  so the tray doesn't snap in lockstep.
- **Slip treatment**: any die showing `1` renders its pips blood-tinted and
  dimmed. When `slips` is one below the jam threshold (best-effort — see the
  status note above), the roll readout's slip count pulses blood-red
  (`onEdge`) to build tension before the next push.
- **Roll readout**: below the tray, `+N PROGRESS` and, if any dice slipped,
  `N SLIP(S)` (with the "— ONE FROM A JAM" tag when on the edge).
- **STEADY THE HAND** (`cache-insight`, visible only while
  `canChannelInsight`): the one-time Insight charge — spends it for a bonus
  die on the *next* push. Must be tapped before the first push on a layer
  (`pushes === 0`). Disappears once spent for the session.
- **PULL THE PICK BACK** (`cache-retreat`, secondary): abandons the current
  layer's attempt cleanly — no loot, no bite, layer reads `retreated`.

Resolution haptics fire once a push resolves:

| Outcome | Haptic |
|---|---|
| Layer cracked (progress ≥ difficulty) | `Haptics.notificationAsync(Success)` |
| Pick jammed | `Haptics.notificationAsync(Error)` + `Haptics.impactAsync(Heavy)` |
| Progress added, no resolution yet | `Haptics.impactAsync(Medium)` |

---

## Narrative card overlay

Fires once a layer resolves — cracked, jammed, or (per current engine
semantics) other card-worthy beats (`card` phase). Shows `CacheCardVM`:

- `title` and `body` — authored layer narrative, updated for pick-pool
  resolutions (e.g. "THE TRAP KEEPS ITS PROMISE" for a jam; a clean-crack
  variant per layer)
- `deltaChips[]` — compact accounting chips:
  - `+ ITEM NAME` for each item found
  - `+N SHILLINGS` for currency
  - `+ KEEPSAKE` if a keepsake is minted
  - `−N VITAE` if the pick bit
- `slammed` flag — if true, the card's dismiss closes the cache (no further
  delving)

Dismiss → `continueLootCacheCard()`.

---

## Outcome overlay

Shown at `outcome` phase. Renders `CacheOutcomeVM`:

- Tier label: `EMPTIED` / `PRUDENT` / `STUNG`
- Items kept (names)
- Currency kept (shillings)
- VITAE bitten total
- Keepsakes minted
- Layers opened count

CTA → `claimLootCacheOutcome()`.

---

## Outcome tiers (as surfaced by mobile presenter)

| Code | Label | Condition |
|---|---|---|
| `emptied` | EMPTIED | All three locks cracked clean |
| `prudent` | PRUDENT | Sealed or retreated early; never bitten |
| `stung` | STUNG | Any pick jammed |

---

## Presenter — CacheVM

Entry: `selectCacheVM({ cache })` in `state/presenters/cache.engine.ts`.

Key VM sub-shapes:

```typescript
CacheLayerVM {
  index                       // 0 | 1 | 2
  name, flavor
  difficulty                  // public from the start
  reading                     // 'locked' | 'picking' | 'cracked' | 'sprung' | 'retreated'
  opened
  isNext
  lootSummary                 // null until opened; "spoiled by the jam" if sprung
}

CachePickVM {
  layerIndex
  difficulty
  progress
  progressFraction            // 0-1, for the fill bar
  pushes, maxPushes, pushesRemaining
  poolSize                    // pickPoolSize (+1 once insight is spent)
  canPush, canRetreat, canChannelInsight
  insightUsed, insightPending
  lastRoll                    // { dice, slips, gained, jammed } | null
}

CacheCardVM {
  title, body
  deltaChips                  // readonly string[]
  slammed                     // cache will close after dismiss
}

CacheOutcomeVM {
  tier                        // LootCacheOutcomeTier
  tierLabel
  itemNames                   // readonly string[]
  currency, bittenVitae
  keepsakes                   // readonly string[]
  layersOpened
}
```

Top-level `CacheVM`:
```typescript
CacheVM {
  active, phase
  layers                      // readonly CacheLayerVM[]
  depth                       // current layer index
  insightUsed
  canDelve, canSeal
  pick                        // CachePickVM | null — non-null only during 'picking'
  card                        // CacheCardVM | null
  outcome                     // CacheOutcomeVM | null
}
```

---

## Store actions

`state/cache/store-actions.ts`:

```
beginLootCacheAction(items, currency)        ← called by resolveCurrentMapEvent; seeds session
startLootCacheDelvingAction()                ← intro → delving
delveLootCacheAction()                       ← open next layer: delving → picking (no roll)
pushLootCachePickAction()                    ← roll the pool; resolves or continues picking
channelLootCacheInsightAction()              ← spend the one Insight charge (before first push)
retreatLootCachePickAction()                 ← abandon the current pick attempt cleanly
sealLootCacheAction()                        ← close, keep collected loot
continueLootCacheCardAction()                ← advance past narrative card
claimLootCacheOutcomeAction()                ← apply world-state delta, clear session
```

**State restoration:** the engine's `resolveMapEvent` applies the authored item and
currency grant to `result.state`. Mobile reverts this pre-event player state and
re-applies only what the cache outcome authorizes (supporting session abandonment
without double-granting).

---

## Removed concepts (Pick Pool redesign, 2026-07)

The following no longer exist anywhere in mobile cache code — if you see a
reference to one, it's stale:

- `probeLootCache` / `probeUsed` / `cache-probe` — no more probe; difficulty
  is public from the start.
- `CacheLayerReading` values `sealed` / `live` / `dud` — replaced by
  `locked` / `picking` / `cracked` / `sprung` / `retreated`.
- Instant, silent trap resolution on delve — `delveLootCache` now opens the
  lock into a live `picking` phase instead of resolving immediately.

---

## ADR references

- **ADR-0001** — engine truth boundary: mobile presenter is mapping only; never recomputes rules. (The presenter is no longer a hidden-information leak boundary post-redesign, since difficulty is public; it remains the sole mapper from engine session → render-ready VM.)
- **ADR-0003** — mobile does not invent mechanics; file issue if the engine is missing something.
