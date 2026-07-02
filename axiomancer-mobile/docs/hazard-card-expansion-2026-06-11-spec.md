# Hazard Card Expansion — Locked Spec (2026-06-11)

Status: **Authoritative** for the `claude/hazard-minigame-refinements-enn8e7` work.
Owner sign-off: user-selected card roster + mechanics (this session).

This document is the single source of truth for the hazard card / mechanics
expansion. Anything that ships must match it; any later deviation is a spec
change and must be recorded here first (see "UI/UX lock-in" below).

---

## 0. Scope (the four asks)

1. **No more errors into preview + lock the hazard UI/UX.** The preview crash
   (`#352`, DevAutoSeed running in non-EAS production bundles → "Maximum update
   depth exceeded") is fixed on `main`. We add a UI/UX **lock-in snapshot** so
   any change to the hazard view-model contract is surfaced as a failing test
   (it must be consciously re-blessed, never slipped through).
2. **Docs 100% aligned to the implementation.** The divergence catalogue and
   design brief are updated to match what ships here (notably: enchantments
   now EXIST; convert produces gold; the reward pool roster grows).
3. **New cards** (multi-colour pivots, lopsided duals, number+utility hybrids,
   offensive enchantments, bursts, and gold showpieces). Roster locked below.
4. **`convert` always converts to GOLD** (wild). Otherwise re-cast is strictly
   better. Minor = 1 die; major = all dice (+ a floating gold die when ≤1 was
   converted, so major is always strictly better than minor).

---

## 1. New mechanics

### 1.1 Multi-colour ("two-tone") cards
- A card may declare `colors: HazardColor[]` (default `[kind]`). A die powers
  the card if it is the **wild gold** die OR its colour is in `colors`.
- `kind` stays the card's primary identity (display tint, salvage colour).
- Engine: `hazardCardPowerColors(def)` + `dieCanPowerCard(dieKind, def)`. The
  board's drop test and the presenter's `dieAvailable` use the card's colour
  set, not just `kind`.
- Rarity policy (user): two-tone is **mostly rare, a few uncommon, never
  common**, and lives in the reward pool (acquired, not starter).

### 1.2 Pivot cards
- Free row pays one meter; the powered (SURGE) row pays the OTHER meter, bigger.
  Powering **swaps** contribution (the engine already replaces free with
  powered — pivots just put the value on the opposite meter).
- All pivots are two-tone red/blue: either a red OR a blue die powers them.

### 1.3 Enchantments (persistent auras) — NEW
- `effect: 'aura'`. On APPLY, adds to the session `modifiers` for the **rest of
  the hazard** (persists across rounds):
  - `auraForce` / `auraEscape`: **+X to every played card that contributes that
    meter** (per card, not per round — the user's exact framing).
  - `surgeForce` / `surgeEscape`: **+X to every POWERED card's** contribution of
    that meter (RELIC OF FURY).
- Minor vs major: red/blue auras upgrade their NUMBER on power and keep the aura
  flat; purple auras keep the number flat and upgrade the AURA on power; gold
  auras (`majorEffect`) fire major for free and the die buys their numbers.
- UI: an "ENCHANTMENTS" strip above the meter lists active modifiers (design
  brief §6 "Persistent Enchantments").

### 1.4 Bursts (this-round-only) — NEW
- `effect: 'burst'`. On APPLY, adds `burstBase`/`burstPowered` to
  `progressBase` for the CURRENT round only (rides the same field salvage uses,
  which the round advance overwrites). Powering buys the bigger `burstPowered`.
- `burstPerUnspentDieForce` (WAR-CRY): +force per unspent non-hex die, at apply.
- `vitaeCost` (BLOODPRICE): accrues to `session.vitaeCost`, applied at claim
  (VITAE still floors at 1). Design brief §6 "Risk / Sacrifice": show the cost.

### 1.5 Gold vow (one-shot priming) — NEW
- `effect: 'goldvow'`. On APPLY, sets `session.goldVow = {force, escape}`. The
  **next** time a GOLD die powers any card, that card gains the vow bonus
  (`entry.vowBonus`) and the vow is consumed.

### 1.6 Choose — NEW
- `choose: true`. When powered, the card's value (`fp`/`ep`, equal) feeds ONE
  meter the player picks (`entry.chosenKey`, default `force`). New store action
  `chooseHazardCardKey(uid, key)`; UI shows a FORCE/ESCAPE toggle on the staged
  card while it is powered and unapplied.

### 1.7 Momentum rider — NEW
- `momentumBonus?: number` raises `session.momentumCap` on APPLY (SAINT'S
  PATIENCE). Default cap stays `HAZARD_MOMENTUM_CAP`.

### 1.8 `convert` → GOLD (ask #4)
- Minor (unpowered, non-gold utility): convert exactly **1** hex die → gold.
- Major (powered, or gold `majorEffect`): convert **all** hex dice → gold; if
  ≤1 was converted, also conjure **1 floating gold** die (temporary). Guarantees
  major ⪈ minor.

---

## 2. Session-state additions

```ts
modifiers: { auraForce; auraEscape; surgeForce; surgeEscape }   // all default 0
goldVow: { force; escape } | null                               // default null
momentumCap: number                                             // default HAZARD_MOMENTUM_CAP
vitaeCost: number                                               // default 0
```
HandEntry: `chosenKey?: 'force'|'escape'`, `vowBonus?: { force; escape }`.

Per-card contribution = base (free/powered/pivot/choose) + surge bonus (if
powered) + aura (per contributed meter) + vowBonus. Dead cards: 0/0, no mods.

---

## 3. Locked card roster (all reward-pool, balance sim untouched)

| # | id | name | colour(s) | rarity | line |
|---|----|------|-----------|--------|------|
| 1 | `r_pivot` | STORM PIVOT | red/blue | uncommon | free 4 FORCE · surge 7 ESCAPE (pivot) |
| 2 | `r_drop` | DEADWEIGHT DROP | red/blue | uncommon | free 4 ESCAPE · surge 7 FORCE (pivot) |
| 3 | `r_last` | LAST RESORT | red/blue | rare | free 5 FORCE · surge 10 ESCAPE (pivot) |
| 5 | `r_heave` | HEAVE-TO | purple | uncommon | 5 FORCE + 2 ESCAPE, surge 7+3 |
| 6 | `r_skitter` | SKITTER | purple | uncommon | 2 FORCE + 5 ESCAPE, surge 3+7 |
| 8 | `r_path` | PATHFINDER | red | rare | 5 FORCE + RE-CAST (minor→major on power) |
| 9 | `r_windcall` | WINDCALLER | blue | rare | 5 ESCAPE + CONVERT (1→all on power) |
| 10 | `r_stone` | STONEREADER | red | uncommon | 3→5 FORCE + DRAW 1→2 |
| 11 | `r_tide` | TIDEREADER | blue | uncommon | 3→5 ESCAPE + DRAW 1→2 |
| 12 | `r_aggr` | AGGRESSION | red | rare | 3→6 FORCE + ENCHANT +2 FORCE/card |
| 13 | `r_swift` | SWIFTNESS | blue | rare | 3→6 ESCAPE + ENCHANT +2 ESCAPE/card |
| 14 | `r_zeal` | ZEAL | purple | rare | 2+2 + ENCHANT +1/+1 (→+2/+2 on power) |
| 15 | `r_martyr` | MARTYR'S RESOLVE | gold | rare | ENCHANT +3/+3, numbers 6/6 on gold die |
| 16 | `r_vow` | GILDED VOW | gold | rare | VOW +7/+7 on next gold die used (once) |
| 17 | `r_serk` | BERSERK | red | uncommon | BURST +5 FORCE this round (→+8 on power) |
| 18 | `r_bolt` | BOLT | blue | uncommon | BURST +5 ESCAPE this round (→+8 on power) |
| 19 | `r_warcry` | WAR-CRY | red | rare | BURST +1 FORCE per unspent mana die |
| 20 | `r_blood` | BLOODPRICE | red | rare | pay 4 VITAE → BURST +8 FORCE (→+12 on power) |
| 21 | `r_pwrath` | PILGRIM'S WRATH | gold | rare | BURST +4/+4, numbers 6/6 on gold die |
| 22 | `r_twin` | TWIN PATHS | gold | rare | CHOOSE 8 FORCE or 8 ESCAPE on gold die |
| 23 | `r_relic` | RELIC OF FURY | gold | rare | ENCHANT surge numbers +2, numbers 6/6 |
| 24 | `r_saint` | SAINT'S PATIENCE | purple | rare | 3+3 + DRAW 2 + momentum cap +2 |

(The original brainstorm numbers 4, 7, and the defensive WRATH/SPITE were
declined by the user.)

---

## 4. UI/UX lock-in (ask #1)

- `state/presenters/__tests__/hazard-vm-lock.engine.test.ts` snapshots the
  hazard view-model for a fixed seed across phases. A diff means the hazard
  UI contract changed: the test fails loudly and the snapshot must be
  **consciously** re-blessed (`-u`) with a note here — nothing slips silently.
- The new card mechanics extend the VM additively; the lock-in is established
  AFTER this expansion lands, so it guards the post-expansion contract.

---

## 5. Out of scope / deferred
- Combat consumption of the gold-vow / enchantment flavour (hazard-only here).
- Multi-colour cards in the STARTER bag (kept to reward pool to hold balance).
</content>
</invoke>
