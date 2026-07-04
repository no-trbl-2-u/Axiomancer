# Loot Cache Encounter ("The Reliquary") — Mechanics Source of Truth

> Derived from `src/World/LootCache/` as of 2026-07-03.
> Phase 137 — Live. Redesigned 2026-07-03 as the "Pick Pool" live
> dice-pool lockpicking minigame (see
> `braindump/2026-07-03-lockpicking-treasure-minigame.md` for the design
> session; `docs/encounters/loot-cache-alt-hybrid-spec.md` documents the
> lighter-weight fallback direction that was NOT built). Decision record:
> `docs/adr/ADR-0008-loot-cache-pick-pool.md`.

---

## What it is

A push-your-luck loot encounter triggered by Cache map nodes. Instead of a
silent item grant, the cache opens in three **layers**. Each deeper layer is
richer and needs more cumulative progress to crack. Every layer's
**difficulty** is public from the start — there is no hidden information.
Instead, the risk is LIVE: the player rolls a d6 **Pick Pool** against the
layer's difficulty, and after every roll chooses whether to push for more
progress or bank what's cracked so far. Roll too many slipped dice at once
and the pick **jams** — it bites VITAE, spoils that layer's loot, and closes
just that layer (the session moves on to the next decision, it does not
end). A single per-session **Insight** charge grants a bonus die.

---

## Core loop

1. Cache node triggers. Session is seeded, but nothing is rolled yet — each
   layer's difficulty is public tuning data set at creation.
2. Phase **intro** → player may begin delving.
3. Phase **delving:** player chooses on each remaining layer —
   - **Delve:** open a live pick attempt on the next layer (→ phase `picking`).
   - **Seal:** close the cache, keeping all loot cracked so far.
4. Phase **picking:** the player rolls the pick pool against the layer's
   difficulty, choosing after every roll —
   - **Push:** roll `pickPoolSize` d6 (plus a bonus die if Insight is
     pending). Progress banks toward the layer's difficulty.
   - **Channel Insight** (once per session, only before the layer's first
     roll): grants a bonus die on the very next push.
   - **Retreat:** voluntarily abandon this layer attempt. The layer stays
     closed — not opened, not spoiled, no bite.
   Each push resolves one of four ways: **jam** (too many slipped dice —
   bites, spoils, closes this layer), **crack** (cumulative progress meets
   the difficulty — the layer opens clean), **resist** (pushes exhausted at
   `maxPushesPerLayer` without cracking or jamming — the layer stays closed,
   no bite), or **continue** (still picking; progress banked, choose again).
5. A **card** phase fires on the result of every delve/push/retreat/seal-worthy
   resolution (narrative flash with any delta chips).
6. When all three layers are resolved (opened, jammed-shut, or resisted) or
   the player seals: phase **outcome**.
7. Player claims the outcome.

---

## Three layers

| Index | Name | Difficulty | Jam bite (VITAE) | Loot character |
|---|---|---|---|---|
| 0 | **The Lid** | 5 | 1 | Entry — easiest crack; lightest loot |
| 1 | **The False Bottom** | 9 | 2 | Mid-tier; false layer the original owner hid from casual finders |
| 2 | **The Keeper's Tithe** | 13 | 3 | Deepest; the part the owner meant to come back for; mints a keepsake |

Exact values: `LOOT_CACHE_TUNING.difficulty = [5, 9, 13]`,
`LOOT_CACHE_TUNING.trapBite = [1, 2, 3]`.

---

## The Pick Pool (dice-pool tuning)

```ts
pickPoolSize: 3,          // dice rolled per push (d6)
maxPushesPerLayer: 4,     // pushes before the lock "resists"
jamSlipThreshold: 2,      // 2+ dice showing 1 in a roll = jam
insightBonusDice: 1,      // bonus die granted by Insight
```

**Per-roll math** (3d6, no Insight): a die's expected value is 3.5, so a
roll averages 10.5 pips; a face of `1` ("slip") contributes 0 to progress
(`gained` = sum of non-1 dice), for an average **`gained` ≈ 10.0** per roll.
The **jam probability** is `P(2+ slips in 3d6) ≈ 7.4%` per push
(`Binomial(3, 1/6)`, `P(X≥2) = 16/216`).

Against `difficulty = [5, 9, 13]`, that puts:
- **The Lid (5):** cracked in **~1 push** almost always (10 ≫ 5).
- **The False Bottom (9):** cracked in **~1 push** on average, occasionally 2.
- **The Keeper's Tithe (13):** needs **~2 pushes** on average (10 < 13 on the
  first roll), compounding jam exposure across the extra push — the deepest
  layer is deliberately the riskiest to fully crack.

This matches the design brief's target bands (crack Lid in ~1 roll, False
Bottom in ~1–2, Tithe in ~2–3) with jam as a real but not crushing risk that
compounds the more a layer is pushed.

---

## Insight (replaces the old free Probe)

- **One use per session** (not per layer) — `insightUsed` on `LootCacheSession`.
- Must be channeled **before the layer's first roll** of an attempt
  (`pick.pushes === 0`); it cannot bail you out mid-roll.
- Grants `insightBonusDice` (1) extra d6 on the very next push.
- **The jam threshold also rises by the same amount on a channeled push**
  (`jamThreshold = jamSlipThreshold + insightBonusDice` for that roll only).
  This is a deliberate tuning call: naively adding a die while holding the
  slip threshold fixed *increases* the jam probability (more dice rolled,
  same 2-slip trigger — a 4-die roll jams ~13.2% of the time vs. 7.4% for
  3 dice), which made Insight a net-negative "buy" in early sim runs (see
  `lootcache.sim.ts`'s `informed` bot underperforming `greedy` on
  risk-adjusted value). Scaling the jam tolerance with the bonus die keeps
  Insight a genuine edge — in balance sim runs (2,000 seeds/policy), the
  `informed` policy (spends Insight on the deepest layer it attempts) beats
  `greedy` (never uses it) on both raw currency and risk-adjusted value.

---

## Outcome tiers

| Tier | Condition |
|---|---|
| **Emptied** (`emptied`) | All three layers cracked clean. The whole hoard. |
| **Prudent** (`prudent`) | No layer ever jammed this session (some layers may be resisted, retreated, or unopened by choice); at least one layer is left unopened, or the player sealed early. |
| **Stung** (`stung`) | Any layer jammed this session (`bittenVitae > 0`), regardless of how the rest of the session went. |

**Design note — a jam does not end the session.** Only sealing
(`sealLootCache`) or resolving all three layers ends the session. A jam
closes just the layer it happened on (bitten, spoiled) and the player
returns to `'delving'` to decide on the next layer or seal. The `stung` tier
still fires at final `finishLootCache` as long as `bittenVitae > 0`
anywhere in the run — so a session that jams on layer 1 but then cracks
layers 2 and 3 clean is `stung`, not `emptied`, even though `layersOpened`
would read 3. This preserves the old doctrine (any bite taints the run) while
letting play continue past a single bad roll — the risk/reward decision is
"is it worth pushing further," not "did the whole run just end."

Exact tier logic in `finishLootCache` (`lootcache.engine.ts`).

---

## Session state shape

Key fields on `LootCacheSession` (see `lootcache.types.ts` for the full type):

```
phase         LootCachePhase   — intro | delving | picking | card | outcome | done
layers        LootCacheLayerState[]   — 3 layers; difficulty PUBLIC from the start
depth         number           — 0 | 1 | 2 | 3 (next unopened layer; 3 = none left)
insightUsed   boolean          — true once the one per-session Insight charge is spent
bittenVitae   number           — accrued across jams; the host settles it at claim
pick          LootCachePickState | null   — non-null only during 'picking'
card          LootCacheCard | null
outcome       LootCacheOutcome | null
```

`LootCacheLayerState` fields:

```
index         0 | 1 | 2
name          string
flavor        string
difficulty    number    — progress needed to crack; PUBLIC (no hidden info)
trapBite      number    — vitae bitten on a jam
opened        boolean
spoiled       boolean   — true if the pick jammed on this layer
loot          LootCacheLayerLoot
```

`LootCachePickState` fields (the live pick attempt on the current layer):

```
layerIndex      LootCacheLayerIndex
progress        number    — cumulative progress banked so far
pushes          number    — pushes made this attempt
lastRoll        LootCachePickRoll | null
insightPending  boolean   — true when the NEXT push should add the bonus die
```

`LootCachePickRoll` fields (one resolved push):

```
dice          number[]   — face values, including the bonus die if Insight was spent
slips         number     — count of dice showing 1
gained        number     — progress added this roll (sum of non-1 dice)
jammed        boolean
insightSpent  boolean
```

`LootCacheCard` also carries an optional `pickRoll: LootCachePickRoll | null`
— the final roll that resolved the layer, for UI display.

---

## Authored layer chrome

| Layer | Name | Flavor |
|---|---|---|
| 0 | THE LID | "Swollen wood and a hasp rusted to lace. Whatever was meant to keep people out retired years ago." |
| 1 | THE FALSE BOTTOM | "The boards inside sit a knuckle too high. Someone hid the real goods from whoever found the first ones." |
| 2 | THE KEEPER'S TITHE | "Beneath everything, wrapped in oilcloth: the part the owner meant to come back for. Owners like that leave teeth behind." |

---

## Loot economy (unchanged)

- **The Lid** grants base authored currency and items.
- **The False Bottom** adds 50 % bonus (`falseBottomBonus = 0.5`) to the authored purse,
  with a floor of 3 shillings if the authored purse is 0.
- **The Keeper's Tithe** doubles the authored purse (`tithesBonus = 1.0`) and mints a
  **keepsake** (named object with flavor text).

A **jammed pick** spoils that layer's loot (nothing is kept from it), but
does not touch other layers' loot or block deeper layers from being
attempted.

---

## Engine API

Exported from `src/World/LootCache/index.ts`. Key transitions:

```typescript
createLootCacheSession(seed, items, currency)  // difficulty is public tuning data; no upfront roll
beginLootCache(state)                          // intro → delving
delveLootCache(state)                          // delving → picking: opens a pick attempt on the next layer
pushLootCachePick(state)                       // picking-only: rolls the pool, resolves jam/crack/resist/continue
channelLootCacheInsight(state)                 // picking-only, pushes === 0: queues the bonus die (once/session)
retreatLootCachePick(state)                    // picking-only: abandons this layer's attempt cleanly
sealLootCache(state)                           // delving-only: closes the cache
continueLootCacheCard(state)                   // card → delving | outcome
claimLootCacheOutcome(state)                   // outcome → done
```
