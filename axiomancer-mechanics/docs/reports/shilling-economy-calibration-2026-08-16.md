# Shilling economy calibration — Phase 52f

**Date:** 2026-08-16
**Baseline stamp cited:** `c297d923` (measured 2026-08-14, confidence
`reduced-nightly`, flagged STALE-by-1-commit by `npm run baseline:check` at
report time — the one intervening commit is `d83978cb`, Phase 52e's rest
minigame retirement, which does not touch combat balance). The combat
deck-matrix baseline is not directly load-bearing for this report — this is
an economy/pricing calibration, not a win-rate finding — but is cited per
`plan/bearings.md` § "Measured truth (baselines)".

## Why

Three price sets shipped as stacked placeholder guesses, each explicitly
marked "do not treat as final":

| Constant | Where | Old value | Status |
|---|---|---|---|
| `BLACKSMITH_PRICING_PLACEHOLDER` | `World/Blacksmith/blacksmith.engine.ts` | hone 2 / temper 3 / swap 4 | "PLACEHOLDER pending D7 ratification" since D5 — D7 never ran |
| `RESTCHOICE_TUNING.anvilPrice` | `World/RestChoice/restchoice.content.ts` | 50 | "PROVISIONAL" since Phase 52c |
| `CARD_REMOVAL_PRICING_PLACEHOLDER` | `Cards/card.removal.pricing.ts` | base 15 / step 10 | "PROVISIONAL" since Phase 52a |

T's ruling (2026-08-08): *"I pick, you tune later"* — this phase is the tune.

## Measurement

**Method.** The only LIVE, deterministic shilling source on the two
currently-authored maps (fishing-village, northern-forest) is the flat
`loot-cache` MapEvent kind — `resolveLootCache` deposits `payload.currency`
into `state.player.currency` with no RNG (`World/MapEvents/handlers.ts`).
Everything else that touches currency on these maps is either non-existent
or dormant:

- **Combat victory** grants XP + loot items but currently **zero currency**
  — `aftermath.engine.ts`'s reward VM hardcodes `currency: null`. There is
  no live shilling reward from fighting.
- **`World/Hazard`** and **`World/Gathering`** are full minigame packages
  with their own shilling economies (bounties, caches, harvest sets), but
  neither is wired to a fishing-village or northern-forest node — the
  map-level `'hazard'` / `'gathering'` MapEvent kinds resolve to flat damage
  / flat item grants only (`resolveHazard`, `resolveGathering`), not a
  minigame handoff. Dormant machinery, same shape as the `'blacksmith'` kind
  below.
- **The `'blacksmith'` MapEvent kind** (a direct multi-verb anvil visit,
  distinct from the rest-choice flat-price anvil) is fully built
  (`beginBlacksmithAction` defaults its budget to `player.currency`) but
  **no map node currently authors it** — confirmed by grep across
  `content.ts`. Also dormant.
- **Shop selling** (`defaultSellPrice`) is a real but *secondary* lever —
  it only pays out on items the player already holds and chooses to sell,
  so it is not a guaranteed income floor.
- One authored `loot-cache` pool (`nf-5`, 15 shillings, "a waxed pouch
  under a flat stone") is dead content — the constant defining it
  (`_nfBuriedCache`) is never registered into `NORTHERN_FOREST_POOLS`. It
  does not count toward the measured total, and this report does not
  re-wire it (out of scope — flagged as a follow-up below).

**Evidence.** A new hermetic test
(`World/MapEvents/e2e/content.engine.test.ts`, "Phase 52f — guaranteed
per-act shilling income") walks every authored node on both maps via the
real dispatcher (`resolveMapEvent`, not a hand-rolled model) from a fresh
`GameState` (starting currency 0) and reads the final `player.currency`:

```
fishing-village (Act 1, new-player map): 26 shillings guaranteed
  fv-2:  8  ("A coin-purse snagged in the netting...")
  fv-11: 12 ("A waterlogged strongbox wedged under the pilings.")
  fv-17: 6  ("Loose coppers spill from a cracked jar in the rocks.")

northern-forest (Act 2): 18 shillings guaranteed
  nf-16: 10 ("An old hunter's cache buried beneath gnarled roots.")
  nf-20: 8  ("A woodcutter's forgotten axe head, still sharp beneath the rust.")
```

Shop wares run ~1-12 shillings (confirmed range across `nf-8`'s Glen Market
and `nf-18`'s Herb Trader inventories). Player starting currency varies by
preset (Apprentice 0 / Wanderer 25 / Sage 75) — treated as a player choice,
not "earned" income, so it is not folded into the guaranteed-income floor.

This test is a permanent regression witness: if a future content edit
changes a loot-cache amount (or the `_nfBuriedCache` orphan gets wired up),
the pinned total moves and the derivation below should be revisited.

## Derivation

Doctrine (confirmed by the measurement, per the brief):

- A die upgrade (anvil) is a **major** purchase — roughly a full act's
  disposable income.
- The first deck cut is **obviously affordable** early.
- The fourth/fifth cut is a **real sacrifice**, not a lockout — linear, not
  exponential.
- `rest` stays free (unchanged, already 0).

| Constant | Old | New | Reasoning |
|---|---|---|---|
| `RESTCHOICE_TUNING.anvilPrice` | 50 | **25** | ~1x the measured 26-shilling Act-1 floor — a player who saves the whole act's guaranteed find can afford exactly one visit; the old 50 required saving across two full acts before shop spending, which overshot "roughly a full act's income." |
| `CARD_REMOVAL_PRICING.base` | 15 | **5** | ~19% of the Act-1 floor — clearly affordable well before the anvil, satisfying "obviously affordable" without being free. |
| `CARD_REMOVAL_PRICING.step` | 10 | **5** | Keeps the curve linear; sequence is now 5 / 10 / 15 / 20 / 25 — the 5th cut (25) lands at ~1x the Act-1 floor, a real sacrifice on the same order as a die upgrade, without the old curve's 45-by-cut-4 lockout pressure. |
| `ANVIL_VERB_PRICING` (renamed from `BLACKSMITH_PRICING_PLACEHOLDER`) | hone 2 / temper 3 / swap 4 | **hone 3 / temper 5 / swap 8** | Dormant surface (no live map node), repriced in shillings for when a future node authors the `'blacksmith'` kind directly. Kept HONE < TEMPER < SWAP; sized so one of each (16 total) still leaves ~10 shillings of the Act-1 floor for shop wares. |

`rest` (free) and `campHealFraction` (0.2, a design ratio not an economy
number) are unchanged.

## Tuning home

No new tuning skill was stood up. `.claude/commands/world-tuning.md` (added
alongside Phase 52e's rest-minigame retirement) already states the decision
explicitly: *"The rest node is a one-shot player choice (`World/RestChoice`),
not a tuning loop — Phase 52f owns its shilling pricing, not this skill or a
`rest-tuning` sibling."* This report + its pinning test is that ownership
discharged. A future recalibration (e.g. once more acts/maps are authored,
or if the `_nfBuriedCache` orphan is wired up) is a new one-off phase, not a
recurring `/xxx-tuning` loop — the rest-choice economy is three flat
constants, not a weighted-pool system that benefits from repeated seeded
sweeps.

## DoD

- [x] Report exists, cites the baseline stamp, shows the measured income
      curve.
- [x] Hermetic tests pin the new constants (existing suites, updated) and
      the measured income floor the derivation is anchored to (new test).
- [x] Tuning-home decision documented (no new lane needed; see above).
- [x] `npm run verify --workspace axiomancer-mechanics` (and, because the
      blacksmith rename crosses into `@mechanics` consumers,
      `npm run verify -w axiomancer-mobile`).

## Follow-ups (not built here)

- `_nfBuriedCache` (nf-5, 15 shillings) is dead content — either wire it
  into `NORTHERN_FOREST_POOLS` (raising the Act-2 floor to 33) or delete it.
  Left as a content-authoring call, not a pricing call.
- Phase 43's objective-function v2 may want the anvil and the cut as
  inputs — noted there per the brief, not built here.
