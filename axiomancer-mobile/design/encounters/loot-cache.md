# Loot Cache Encounter ("The Reliquary") — Mobile UX Source of Truth

> Derived from `app/cache/index.tsx`, `state/presenters/cache.engine.ts`,
> and `state/cache/store-actions.ts` as of 2026-06-15.
>
> Mechanics rules (engine, layer definitions, trap economy) live in the mechanics repo:
> - `docs/encounters/loot-cache.md` — rules source of truth

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
| `delving` | Layer stack + action bar | *(main decision surface)* |
| `card` | Layer stack | NarrativeCardOverlay |
| `outcome` | — | OutcomeOverlay |
| `done` | *(auto-exit)* | — |

---

## Hidden information rule

The presenter is the **leak boundary** for trap fate. A layer's `trapped` field
is never surfaced to the UI until the layer is probed (`revealed`) or opened
(`opened`). The screen renders `CacheLayerVM.reading` only, which is computed by
the presenter and holds exactly what the player may know.

See `ADR-0001`.

---

## Intro overlay

Shown at the `intro` phase. Flavor text for the cache. Single CTA: "KNEEL →"
fires `startLootCacheDelving()` (engine: `beginLootCache`).

---

## Layer stack (main delving surface)

Three `CacheLayerVM` tiles rendered as a vertical stack (deepest at top, lid at
bottom, matching the physical metaphor):

Each tile shows:
- Layer name (THE LID / THE FALSE BOTTOM / THE KEEPER'S TITHE)
- Flavor text
- `reading` chip:
  - `sealed` — unknown fate (no probe used yet)
  - `live` — probed: trap present
  - `dud` — probed: no trap
  - `clean` — opened: no trap, loot visible
  - `sprung` — opened: trap was triggered, loot spoiled
- `isNext` highlight — the layer the Delve would open next
- Loot summary (shown only once `opened` and not `spoiled`)

**Action bar** (visible during `delving` phase):

| Button | Enabled when | Action |
|---|---|---|
| DELVE | `canDelve` | `delveLootCache()` |
| PROBE | `canProbe` | `probeLootCache()` |
| SEAL | `canSeal` | `sealLootCache()` |

`canProbe` is false once `probeUsed` is set (one use per session).
`canDelve` and `canSeal` are false once all layers are opened or the cache slams.

---

## Narrative card overlay

Fires on each opened layer (`card` phase). Shows `CacheCardVM`:

- `title` and `body` — authored layer narrative
- `deltaChips[]` — compact accounting chips:
  - `+ ITEM NAME` for each item found
  - `+N SHILLINGS` for currency
  - `+ KEEPSAKE` if a keepsake is minted
  - `−N VITAE` if the trap bit
- `slammed` flag — if true, the card's dismiss closes the cache (no further delving)

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
| `emptied` | EMPTIED | Keeper's Tithe opened cleanly |
| `prudent` | PRUDENT | Lid or False Bottom opened; Tithe not reached or sealed |
| `stung` | STUNG | Any trap sprung |

---

## Presenter — CacheVM

Entry: `selectCacheVM({ cache })` in `state/presenters/cache.engine.ts`.

Key VM sub-shapes:

```typescript
CacheLayerVM {
  index                       // 0 | 1 | 2
  name, flavor
  reading                     // 'sealed' | 'live' | 'dud' | 'clean' | 'sprung'
  opened
  isNext
  lootSummary                 // null until opened; "spoiled by the trap" if sprung
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
  probeUsed
  canDelve, canProbe, canSeal
  card                        // CacheCardVM | null
  outcome                     // CacheOutcomeVM | null
}
```

---

## Store actions

`state/cache/store-actions.ts`:

```
beginLootCacheAction(items, currency)    ← called by resolveCurrentMapEvent; seeds session
startLootCacheDelvingAction()            ← intro → delving
delveLootCacheAction()                   ← open next layer
probeLootCacheAction()                   ← reveal next layer's fate (once)
sealLootCacheAction()                    ← close, keep collected loot
continueLootCacheCardAction()            ← advance past narrative card
claimLootCacheOutcomeAction()            ← apply world-state delta, clear session
```

**State restoration:** the engine's `resolveMapEvent` applies the authored item and
currency grant to `result.state`. Mobile reverts this pre-event player state and
re-applies only what the cache outcome authorizes (supporting session abandonment
without double-granting).

---

## ADR references

- **ADR-0001** — engine truth boundary: mobile presenter is mapping only; never recomputes rules; hidden information boundary enforced here.
- **ADR-0003** — mobile does not invent mechanics; file issue if the engine is missing something.
