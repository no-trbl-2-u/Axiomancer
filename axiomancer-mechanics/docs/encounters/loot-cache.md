# Loot Cache Encounter ("The Reliquary") — Mechanics Source of Truth

> Derived from `src/World/LootCache/` as of 2026-06-15.
> Phase 137 — Live.

---

## What it is

A push-your-luck loot encounter triggered by Cache map nodes. Instead of a silent
item grant, the cache opens in three **layers**. Each deeper layer is richer but
more likely to be trapped. The player's trap fate is sealed and hidden at session
creation; one **Probe** can reveal the next layer's fate before committing.
A sprung trap bites VITAE, spoils that layer's loot, and slams the cache shut.

---

## Core loop

1. Cache node triggers. Session is seeded: each layer's trap fate is determined
   privately (sealed, hidden from the presenter until probed or opened).
2. Phase **intro** → player may begin delving.
3. Phase **delving:** player chooses on each layer —
   - **Delve:** open the next layer. Collect its loot if no trap; take the bite and lose the loot if trapped (cache slams shut).
   - **Probe (once per session):** reveal the next layer's trap status before committing. Does not open the layer.
   - **Seal:** close the cache, keeping all loot collected so far.
4. A **card** phase fires on each opened layer (narrative card with flavor text and any delta chips).
5. When all three layers are opened, sealed, or the cache slams shut: phase **outcome**.
6. Player claims the outcome.

---

## Three layers

| Index | Name | Trap chance | Trap bite (VITAE) | Loot character |
|---|---|---|---|---|
| 0 | **The Lid** | 0 % (always safe) | 0 | Entry — always safe; lightest loot |
| 1 | **The False Bottom** | ~33 % | 2 VITAE | Mid-tier; false layer the original owner hid from casual finders |
| 2 | **The Keeper's Tithe** | ~50 % | 3 VITAE | Deepest; the part the owner meant to come back for; mints a keepsake |

Exact trap chances: `LOOT_CACHE_TUNING.trapChance = [0, 1/3, 1/2]`.

---

## Loot economy

- **The Lid** grants base authored currency and items.
- **The False Bottom** adds 50 % bonus (`falseBottomBonus = 0.5`) to the authored purse,
  with a floor of 3 shillings if the authored purse is 0.
- **The Keeper's Tithe** doubles the authored purse (`tithesBonus = 1.0`) and mints a
  **keepsake** (named object with flavor text).

A **sprung trap** spoils that layer's loot (nothing is kept from it) and slams the
cache — deeper layers cannot be accessed.

---

## The Probe

- **One use per session.**
- Reveals the next layer's trap status without opening it.
- The player then decides to Delve (accepting the revealed risk) or Seal.
- Once used, `probeUsed` is true for the rest of the session.

---

## Hidden information rule

The `trapped` field on each `LootCacheLayerState` is sealed at creation. Presenters
**must not leak** this to the UI until the layer is probed or opened. This is an
explicit boundary enforced in `ADR-0001`.

---

## Outcome tiers

| Tier | Condition |
|---|---|
| **Emptied** (`emptied`) | All three layers lifted clean. The whole hoard. |
| **Prudent** (`prudent`) | Player sealed the cache early and walked away unbitten. |
| **Stung** (`stung`) | A trap fired: bitten, one layer spoiled, cache shut. |

Exact tier logic in `lootcache.engine.ts`.

---

## Session state shape

Key fields on `LootCacheSession` (see `lootcache.types.ts` for the full type):

```
phase         LootCachePhase   — intro | delving | card | outcome | done
layers        LootCacheLayerState[]   — 3 layers; trap fate hidden until probed/opened
depth         LootCacheLayerIndex     — 0 | 1 | 2 (current layer)
probeUsed     boolean
canDelve      boolean
canProbe      boolean
cardPending   LootCacheCard | null
outcome       LootCacheOutcome | null
```

`LootCacheLayerState` fields:

```
index         0 | 1 | 2
name          string
flavor        string
trapped       boolean   ← HIDDEN until revealed
trapBite      number
revealed      boolean   ← true after probe or open
opened        boolean
spoiled       boolean   ← true if trap was sprung
loot          LootCacheLayerLoot
```

---

## Authored layer chrome

| Layer | Name | Flavor |
|---|---|---|
| 0 | THE LID | "Swollen wood and a hasp rusted to lace. Whatever was meant to keep people out retired years ago." |
| 1 | THE FALSE BOTTOM | "The boards inside sit a knuckle too high. Someone hid the real goods from whoever found the first ones." |
| 2 | THE KEEPER'S TITHE | "Beneath everything, wrapped in oilcloth: the part the owner meant to come back for. Owners like that leave teeth behind." |

---

## Engine API

Exported from `src/World/LootCache/index.ts`. Key transitions:

```typescript
createLootCacheSession(seed, layerPayloads)   // sealed trap fate set here
beginLootCache(state)                          // intro → delving
delveLootCache(state)                          // open next layer
probeLootCache(state)                          // reveal next layer's fate (once)
sealLootCache(state)                           // close the cache
continueLootCacheCard(state)                   // advance past the narrative card
claimLootCacheOutcome(state)                   // → done
abandonLootCache(state)
```
