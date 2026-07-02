# Hazard Encounter — Mechanics Source of Truth

> Derived from `src/World/Hazard/` as of 2026-06-15.
> This file supersedes the v0 design vocabulary in `docs/hazard-minigame.md`
> (which uses old terms: Stability, Supply, Focus, Green/Yellow). The current
> implementation uses only FORCE / ESCAPE and Red / Blue / Purple / Gold.
>
> Companion documents:
> - `docs/hazard-minigame.md` — original CDR-0006 design proposal (v0 vocabulary; some terms superseded)
> - `docs/hazard-minigame-api.md` — export surface for mobile and other hosts
> - `docs/hazard-balance-recommendations.md` — tuning evidence and balance bands
> - `docs/hazard-card-expansion-2026-06-11-spec.md` — 150-card expansion roster spec
> - `docs/encounters/hazard-card-library.md` — ← **go here for the full card catalogue**

---

## What it is

A card-and-dice tactical minigame triggered by hazard map nodes. The player
receives a hand of action cards, rolls four mana dice, chooses a route, and
assembles solutions across three rounds to clear a dangerous crisis. Inspiration:
Mage Knight (constraint puzzle), Gloomhaven (mana economy), Slay the Spire
(deck composition).

Phase 131 — Live.

---

## Core loop

1. Hazard node triggers. Hazard scenario and intro text are revealed.
2. Player draws 5 action cards (their opening hand).
3. Player chooses **Safe** or **Risk** route.
4. 4 mana dice are rolled — once per hazard; they persist as board objects.
5. For each of 3 rounds:
   a. Stage cards into the play area (up to 6 at once).
   b. Drop a matching die on a staged card to power its SURGE action.
   c. Drag a card to the bin to salvage it instead.
   d. Press **Play** to commit and resolve the round.
   e. Round resolves as **O** (cleared) or **X** (failed); cards discard; next round draws 5 new cards.
6. After all rounds: outcome is judged (Perfect / Complete / Failure).
7. Rewards / consequences modal. Current shipped behavior is a pick-1-of-3 card offer on Complete/Perfect; accepted next doctrine (Phase 149) changes this into a typed three-choice reward ritual: one obvious in-focus deck benefit, one stronger off-focus temptation, and one remove-card option.

---

## Mana dice

- **Count:** 4 dice, cast once at route selection, persist for the whole hazard.
- **Face bag:** `[red, blue, purple, gold, gold, hex]`
  - Red / Blue / Purple / Hex — 1/6 each (≈ 17 %).
  - Gold (wild) — 2/6 (≈ 33 %). Gold powers any card colour.
  - Hex (✕) — 1/6 (≈ 17 %). Blocked mana; cannot be spent unless a card specifically enables it.
- **Lifecycle:** spent dice stay spent. No automatic refresh between rounds. Card
  effects (RECAST, CONVERT, TRANSMUTE, PURGE) are the only normal way to
  manipulate the pool.
- **Temporary dice** (created by card effects) follow the same spend rules and
  persist until spent or the hazard ends.

---

## Routes

### Safe Route

- **Single meter:** FORCE + ESCAPE combined. Either meter's contribution counts.
- **Threshold:** per-round single number; must meet or exceed to clear the round.
- **Penalty:** penaltyVitae × failed rounds, reduced by accumulated WARD (floored 0).

### Risk Route

- **Dual meters:** FORCE and ESCAPE tracked separately. **Both** must reach their
  per-round thresholds to score O; meeting only one is an X.
- **Threshold:** `[force, escape]` pair per round.
- **Reward:** richer; includes an exclusive Relic card reward.
- **Penalty:** penaltyVitae × 2 vs. Safe (4 vs. 2 per round).

---

## Progress mechanics

| Mechanic | Rule |
|---|---|
| **Momentum** | Surplus from a cleared round carries into the next, halved and capped at 3 per meter. Failed rounds carry 0 (unless an ANCHOR card sets a floor). |
| **Aura / ENCHANT** | Applied on card use; persist for the rest of the hazard. Add `auraForce` or `auraEscape` to every subsequent card contributing that meter, or boost surged (powered) values via `surgeForce`/`surgeEscape`. |
| **Burst** | Progress added to the current round only; does not carry as momentum. |
| **SACRIFICE** | VITAE spent on apply (BLOODPRICE / VEIN-PRICE). Accrues across the hazard; applied at claim. |
| **MEND** | VITAE restored at claim on a survived crossing (0 on a failure). |
| **BOUNTY** | Shillings banked at claim on a survived crossing (0 on a failure). |
| **WARD** | Reduces the route's total VITAE penalty at outcome (floored at 0). |
| **ANCHOR** | Sets a momentum floor — carry at least this much into the next round even on a failed round. |
| **PURGE** | Removes CRACK dead-weight cards from deck/hand/discard for the rest of the crossing. |
| **TRANSMUTE** | Recolours unspent dice to the card's colour; hostile ✕ stays hostile. |
| **Reserve bonus** | Unspent non-hex dice at completion: +1 VITAE per die on Complete/Perfect tiers. |

---

## Outcomes

| Tier | Condition | Rewards | Consequences |
|---|---|---|---|
| **Perfect** | All 3 rounds cleared (3 O) | Route reward + card offer (1 rare guaranteed; may skip) | None |
| **Complete** | ≥ 1 round cleared | Route reward + card offer (rarity scales with rounds won) | Scales with rounds lost |
| **Failure** | 0 rounds cleared | None | Maximum consequences |

### Reward catalogue

| ID | Name | Description |
|---|---|---|
| `cache` | Shrine Cache | +12 shillings |
| `relic` | Bonus Relic | +20 shillings (Risk-route exclusive) |
| `vitae` | Restored Vitae | +6 VITAE |
| `token` | Paradox Token | +1 paradox token for next combat |

### Consequence catalogue

| ID | Name | Description |
|---|---|---|
| `tokens` | Sundered | Lose all banked Paradox & Fallacy tokens |
| `deadcard` | Dead Weight | CRACK card shuffled into the persistent deck |
| `maxhp` | Scarred | −5 Maximum VITAE until next inn rest |
| `minhp` | Bleeding | −8 VITAE immediately |
| `curse` | Hexed | Begin next combat with a hostile Curse die |

---

## Sub-quests

10 optional objectives in the catalogue; current shipped behavior rolls N per hazard (per
`HAZARD_TUNING.subquests.pickCount`). Accepted next doctrine (Phase 149) changes this
to **sub-quest drafting**: offer 2–3 candidate objectives and let the player choose one
before/around route commitment. Completing the chosen sub-quest on a **survived crossing**
pays the listed bonus; a **failed crossing** forfeits sub-quest rewards.

| ID | Name | Condition | Reward |
|---|---|---|---|
| `travel-light` | Travel Light | Commit ≤ cap cards total | Vitae |
| `dice-reserve` | Dice in Reserve | Hold N+ dice unspent at final round | Shillings |
| `steady-hand` | Steady Hand | Never empty hand at a round resolve | Shillings |
| `flawless` | Flawless | Clear every round | Paradox token |
| `surge-master` | Surge Master | Power N+ cards with dice | Shillings |
| `stormcaller` | Stormcaller | Fire N+ recast/convert effects | Shillings |
| `scavenger` | Scavenger | Salvage N+ cards to the bin | Vitae |
| `momentum` | Momentum | Carry surplus into a later round | Shillings |
| `fast-start` | Fast Start | Clear the first round | Shillings |
| `finisher` | Finisher | Clear the final round | Vitae |

Exact N values live in `HAZARD_TUNING.subquests` in `hazard.tuning.ts`.

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
cast of 4 dice lasts all 3 rounds). A difficulty pass in 2026-06-12 raised all
thresholds (+1/+2/+2 safe, +0/+1/+1 risk) to bring safe perfect rate to ~30–40 %
and risk perfect to ~10 %. Evidence: `src/World/Hazard/e2e/hazard.balance.sim.test.ts`.

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
progressBase     { force, escape }        — momentum carried in
modifiers        HazardModifiers          — active aura bonuses
subquests        HazardSubquestState[]
questMetrics     HazardQuestMetrics
goldVow          { force, escape } | null
momentumCap      number                   — raised by SAINT'S PATIENCE
vitaeCost        number                   — sacrifice debt
vitaeRestore     number                   — mend credit
bountyShillings  number
wardPenaltyReduction  number
carryFloor       number                   — anchor floor
resolveInfo      HazardResolveInfo | null
outcome          HazardOutcome | null
```

---

## Engine API

Exported from `src/World/Hazard/index.ts`. Key transitions:

```typescript
createHazardSession(hazardId, seed, bagCardIds)  // entry point
selectHazardRoute(state, route)                   // lock Safe or Risk
finishHazardRolling(state)                        // roll dice → 'playing'
stageHazardCard(state, uid)
powerHazardCard(state, uid, dieId)
applyHazardCard(state, uid)                       // fires utility effect
resolveHazardRound(state)                         // O / X judgement
continueHazardAfterResolve(state)                 // advance to next round
hazardSubquestStatus(state, subquestId)           // 'active' | 'done' | 'failed'
claimHazardRewards(state, pickedCardId | null)    // → 'done'
```

Full API with types: `docs/hazard-minigame-api.md`.

---

## Card library

See `docs/encounters/hazard-card-library.md` for the complete card catalogue
(IDs, names, colors, free/surge actions, mechanics, roles, balancing notes).
