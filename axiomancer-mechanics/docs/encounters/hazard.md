# Hazard Encounter — Mechanics Source of Truth

> Derived from `src/World/Hazard/` as of 2026-09-30 (the minimal ten-card
> deck, THE REVAMP R6). This file supersedes the v0 design vocabulary in
> `docs/hazard-minigame.md` (which uses old terms: Stability, Supply, Focus,
> Green/Yellow). The current implementation uses only FORCE / ESCAPE and
> Red / Blue / Purple / Gold.
>
> Companion documents:
> - `docs/hazard-minigame.md` — original CDR-0006 design proposal (v0 vocabulary; some terms superseded)
> - `docs/hazard-minigame-api.md` — export surface for mobile and other hosts

---

## What it is

A card-and-dice tactical minigame triggered by hazard map nodes. The player
receives a hand of action cards, rolls four mana dice, chooses a route, and
assembles solutions across three rounds to clear a dangerous crisis. Inspiration:
Mage Knight (constraint puzzle), Gloomhaven (mana economy), Slay the Spire
(deck composition).

---

## Core loop

1. Hazard node triggers. Hazard scenario and intro text are revealed.
2. Player draws 5 action cards (their opening hand) and sees them before choosing a route.
3. Player chooses **Safe** or **Risk** route.
4. 4 mana dice are rolled — once per hazard; they persist as board objects.
5. For each of 3 rounds:
   a. Stage cards into the play area (no cap).
   b. Drop a matching die on a staged card to power its SURGE row.
   c. Drag a hand card to the bin to salvage it instead.
   d. **Apply** a staged card to fire its utility and lock it; **Play** applies the rest and resolves the round.
   e. Round resolves as **O** (cleared) or **X** (failed). Played cards discard,
      the unplayed hand is kept, and the hand draws back up to 5.
6. After all rounds: outcome is judged (Perfect / Complete / Failure).
7. Rewards / consequences modal, with a pick-one card offer on Complete/Perfect.

---

## Mana dice

- **Count:** 4 dice, cast once at route selection, persist for the whole hazard.
- **Face bag:** `[red, blue, purple, gold, gold, hex]`
  - Red / Blue / Purple / Hex — 1/6 each (≈ 17 %).
  - Gold (wild) — 2/6 (≈ 33 %). Gold powers any card colour; gold cards need a gold die.
  - Hex (✕) — 1/6 (≈ 17 %). Blocked mana; never spendable until CONVERT turns it gold.
- **Lifecycle:** spent dice stay spent. No automatic refresh between rounds.
  RE-CAST, CONVERT, and mana salvage are the only ways to change the pool.
- **Temporary dice** (created by card effects) follow the same spend rules and
  persist until spent or the hazard ends.

---

## Routes

### Safe Route

- **Single meter:** FORCE + ESCAPE combined. Either meter's contribution counts.
- **Threshold:** per-round single number; must meet or exceed to clear the round.
- **Penalty:** 2 VITAE × failed rounds.

### Risk Route

- **Dual meters:** FORCE and ESCAPE tracked separately. **Both** must reach their
  per-round thresholds to score O; meeting only one is an X.
- **Threshold:** `[force, escape]` pair per round.
- **Reward:** the larger purse (`riskShillings`).
- **Penalty:** 4 VITAE × failed rounds.

---

## Progress mechanics

| Mechanic | Rule |
|---|---|
| **Momentum** | Surplus from a cleared round carries into the next, halved and capped at 3. Failed rounds and the final round carry 0. The safe route banks its carry on the FORCE meter. |
| **Salvage** | Binning a hand card grants its salvage: +1 FORCE or ESCAPE for this round only, or a temporary die of the card's colour. CRACK salvages nothing. |
| **CRACK** | A failed round shuffles a CRACK into the middle of the draw pile. CRACK has no values and cannot be powered. |
| **Reserve bonus** | Unspent non-hex dice at completion: +1 VITAE per die on Complete/Perfect tiers. |

---

## The deck

Ten cards. The starter bag holds each card `weight` times (14 cards). FREE is the
value when staged; SURGE is the value once a die is applied.

| ID | Name | Colour | Rarity | Weight | FREE (F/E) | SURGE (F/E) | Utility | Salvage |
|---|---|---|---|---|---|---|---|---|
| `haul` | DEAD-MAN HAUL | red | common | 1 | 3 / 0 | 6 / 0 | — | red die |
| `grip` | IRON GRIP | red | uncommon | 1 | 5 / 0 | 9 / 0 | — | +1 FORCE |
| `scram` | SCRAMBLE | blue | common | 1 | 0 / 3 | 0 / 6 | — | +1 ESCAPE |
| `runner` | CLIFFRUNNER | blue | common | 1 | 0 / 3 | 0 / 6 | — | blue die |
| `leap` | FAITH LEAP | blue | uncommon | 1 | 0 / 5 | 0 / 9 | — | +1 ESCAPE |
| `footing` | SURE FOOTING | purple | common | 3 | 2 / 2 | 2 / 2 | DRAW 1 (powered: 2) | +1 FORCE |
| `windread` | READ THE WIND | purple | common | 2 | 2 / 2 | 2 / 2 | CONVERT | +1 ESCAPE |
| `pole` | BALANCE POLE | purple | uncommon | 2 | 3 / 3 | 3 / 3 | RE-CAST | +1 FORCE |
| `oath` | UNBROKEN OATH | gold | rare | 1 | 0 / 0 | 6 / 6 | DRAW 2 (always major) | gold die |
| `blessing` | PILGRIM'S BLESSING | gold | rare | 1 | 0 / 0 | 7 / 7 | RE-CAST (always major) | gold die |

Plus `crack` (CRACK) — the dead card from failed rounds and the `deadcard` consequence.

### Utilities

A purple card's utility is **minor** unless a die is applied, then **major**.
A gold card (GILDED) always fires its utility at **major**; its die buys the numbers.

| Utility | Minor | Major |
|---|---|---|
| **DRAW** | Draw `drawBase` cards | Draw `drawPowered` cards |
| **CONVERT** | Turn one hostile ✕ die into a wild gold die | Turn every ✕ die gold; if one or none was turned, also add a temporary gold die |
| **RE-CAST** | Re-roll every unspent die | Re-roll every unspent die and add a temporary non-hex die |

### Keywords

`HAZARD_KEYWORDS`: SURGE, FORCE, ESCAPE, DRAW, CONVERT, RE-CAST, GILDED, SALVAGE, CRACK.

---

## Outcomes

| Tier | Condition | Rewards | Consequences |
|---|---|---|---|
| **Perfect** | All 3 rounds cleared (3 O) | Route reward + card offer (first slot a gold rare; may skip) | None |
| **Complete** | ≥ 1 round cleared | Route reward + card offer (no rare on a one-win run) | Scales with rounds lost |
| **Failure** | 0 rounds cleared | None | Maximum consequences |

### Card offer

Three distinct cards drawn from the core deck. A perfect run's first slot is
one of the two gold rares; a one-win run excludes rares. The picked card joins
the persistent deck as a `hazard-card:<id>:<n>` flag. Only a perfect run may skip.

### Reward catalogue

Every reward pays exactly what its chip says.

| ID | Name | Description |
|---|---|---|
| `shillings` | Shillings | +12 shillings |
| `riskShillings` | Shillings | +32 shillings (the risk route's purse) |
| `vitae` | Restored Vitae | +6 VITAE |

| Tier | Safe route | Risk route |
|---|---|---|
| Perfect | `shillings`, `vitae` | `riskShillings`, `vitae` |
| Complete, 2+ wins | `vitae` | `riskShillings` |
| Complete, 1 win | `vitae` | `shillings` |
| Failure | none | none |

### Consequence catalogue

| ID | Name | Description |
|---|---|---|
| `deadcard` | Dead Weight | CRACK card shuffled into the persistent deck |
| `maxhp` | Scarred | −5 Maximum VITAE until next inn rest |
| `minhp` | Bleeding | −8 VITAE immediately |

By rounds lost: one loss costs only the route penalty; two add Scarred and
Dead Weight; three add Bleeding as well.

---

## Authored hazard library

Six hazards are shipped. All run 3 rounds. Safe penalty = 2 VITAE/failed round;
Risk penalty = 4 VITAE/failed round.

| ID | Title | Safe thresholds | Risk thresholds (F / E) |
|---|---|---|---|
| `cracked-cliff` | Cracked Cliff Path | 20 / 23 / 25 | 9–9 / 11–11 / 12–12 |
| `flooded-undercroft` | Flooded Undercroft | 19 / 23 / 26 | 8–10 / 10–12 / 11–13 |
| `ashfall-crossing` | Ashfall Crossing | 22 / 23 / 25 | 10–8 / 11–11 / 13–11 |
| `famine-march` | The Famine March | 20 / 23 / 25 | 9–9 / 11–11 / 12–12 |
| `bandit-hunt` | Hunted by Bandits | 19 / 23 / 26 | 8–10 / 10–12 / 11–13 |
| `fever-rot` | The Creeping Rot | 22 / 23 / 25 | 10–8 / 11–11 / 13–11 |

Thresholds were tuned by Monte-Carlo sim for the no-recast dice doctrine (one
cast of 4 dice lasts all 3 rounds). Evidence:
`src/World/Hazard/e2e/hazard.balance.sim.test.ts`.

---

## Session state shape

Key fields on `HazardSessionState` (see `hazard.types.ts` for the full type):

```
hazardId         string                   — which hazard definition
phase            HazardPhase              — route-select | rolling | playing | resolve-flash | outcome | rewards | done
route            'safe' | 'risk' | null
round            number                   — 1-indexed current round
totalRounds      number
marks            ('O' | 'X' | 'pending')[]
drawPile / discardPile  string[]          — card ids
hand / play      HazardHandEntry[]
dice             HazardDie[]
progressBase     { force, escape }        — momentum (and this round's salvage) carried in
momentumCap      number                   — 3
resolveInfo      HazardResolveInfo | null
outcome          HazardOutcome | null
pickedRewardCardId  string | null
seed / rng / uidCounter                   — deterministic replay state
```

---

## Engine API

Exported from `src/World/Hazard/index.ts`. Key transitions:

```typescript
createHazardSession(seed, bagCardIds, hazardId)  // entry point
selectHazardRoute(state, route, bagCardIds)       // lock Safe or Risk; cast dice
finishHazardRolling(state)                        // → 'playing'
stageHazardCard(state, uid, bagCardIds)
unstageHazardCard(state, uid)
powerHazardCard(state, uid, dieId, bagCardIds)
applyHazardCard(state, uid, bagCardIds)           // fires utility effect, locks card
discardHazardCard(state, uid)                     // salvage
resolveHazardRound(state, bagCardIds)             // O / X judgement
continueHazardAfterResolve(state, bagCardIds)     // next round, or → 'outcome'
acknowledgeHazardOutcome(state)                   // → 'rewards'
claimHazardRewards(state, pickedCardId | null)    // → 'done'
```

Full API with types: `docs/hazard-minigame-api.md`.
