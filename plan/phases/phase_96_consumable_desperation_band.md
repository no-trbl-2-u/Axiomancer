# Phase 96 — Consumable desperation band (the anti-hoarding lever)

> Promoted from `plan/PHASE_CANDIDATES.md` [score 3.5] — "Consumables have no
> anti-hoarding lever — no cantrip-style secondary effect, no HP-conditional
> scaling", filed 2026-09-19 by `/adjust-equipment` pass 13.

## Outcome

A healing potion is worth **half again** when you drink it badly wounded. The
player can see that in the shop before buying and in the drink preview before
committing, so the flask stops being a thing you carry to the end of the run and
starts being a thing you use.

## Why

`/adjust-equipment` pass 13 ran a `kb_cards` (Dawncaster) cross-reference on
potion design and found three anti-hoarding levers the corpus uses that this
item set has **none** of:

1. an always-good secondary rider on every potion ("Draw a card") —
   `kb:dawncaster/0526-diamond-potion`, `/1455-steelskin-potion`,
   `/1114-potion-of-alacrity`;
2. **conditional scaling baked into the item** — Healing Potion: "Gain 10
   HEALTH. If you are below 50% health, gain 15 HEALTH instead"
   (`kb:dawncaster/0796-healing-potion`);
3. potions as a renewable categorical resource with a generation/payoff loop
   (`0041-alchemic-presence`, `0063-another-round`, `1117-potion-sash`,
   `1152-quick-chemistry`).

Lever 2 is the one this phase ships. A flat `healAmount` pays identically at
full health and at death's door, so the dominant play is always to hold the
flask — the item has no moment that is *its* moment.

## Routes / API endpoints / CLI surface

No new routes. The surface is three existing call sites:

| Surface | Call | Change |
|---|---|---|
| engine | `useConsumableEffect(player, consumable, round, lookupEffectFn)` | resolves the heal through the new two-band resolver; result gains `desperate` |
| mobile inventory | `selectItemModalViewModel(state, itemId)` | preview line states the band |
| mobile village shop | `wareEffectLine(item)` | ware line states both bands |

## Content / data reads

| Helper | Call | Use |
|---|---|---|
| `resolveConsumableHeal` | `(player, consumable)` | the ONE resolver for the two-band heal — engine and both presenters call it / read the same fields |
| `isDesperate` | `(player)` | exported band predicate, so presenters never re-derive the threshold |
| `DESPERATION_HP_FRACTION` | constant | `0.5`, matching the corpus convention |

## Components / handlers

New (all in `axiomancer-mechanics/src/Items/equipment.engine.ts`):

- `DESPERATION_HP_FRACTION` — the threshold constant.
- `isDesperate(player)` — strictly-less-than band predicate, guarded against
  `maxHealth <= 0`.
- `resolveConsumableHeal(player, consumable)` — `{ amount, desperate }`.

Reused: `heal` (`Combat/health.ts`) still does the `maxHealth` clamp; the
presenters' existing `previewLines` / `parts` arrays carry the new copy.

## Output schema / contracts

`Consumable` gains one optional field:

```ts
healAmountBelowHalf?: number;
```

`ConsumableUseResult` gains one field:

```ts
desperate: boolean;
```

Both are **purely additive**. A consumable that omits the band behaves exactly
as it did pre-Phase-96, so every existing item, fixture and hand-written state
literal keeps its current semantics.

## Decisions made upfront — DO NOT ASK

1. **One lever, not three.** The candidate row explicitly said "pick ONE lever to
   avoid scope creep". Shipped lever 2 (HP-conditional scaling) because
   `useConsumableEffect` already receives `player`, so the check is a local
   branch rather than new plumbing. Levers 1 and 3 are larger designs and stay
   unshipped — noted in the library docblock so the next reader knows they were
   considered, not missed.
2. **A uniform 1.5x, not per-item tuning.** All five healers pay
   `healAmount * 1.5` below the band. One rule the player learns once beats five
   numbers to memorise, and 1.5x is the corpus ratio (10 → 15 in
   `kb:dawncaster/0796-healing-potion`). Pinned by a test so a later tuning pass
   has to break it deliberately.
3. **Strictly below half, not at-or-below.** A player sitting on exactly half
   gets the flat rate. `<=` is the likeliest mis-implementation, so it has its
   own test.
4. **The band is read BEFORE healing.** A drink that lifts the player out of the
   band still pays the desperation amount — the potion answers the state it was
   drunk in, not the state it produced. The alternative (re-read after) would
   make the payout depend on the potion's own size, which is incoherent.
5. **`healAmountBelowHalf` alone is inert.** It is a conditional upgrade of
   `healAmount`, never a standalone payload. A malformed item heals for 0 rather
   than silently becoming a desperation-only potion.
6. **Non-healing consumables stay band-less.** The lever answers the hoarding
   incentive on heals specifically; a band on a cleanse would be a different
   design. Pinned by a test.
7. **`actions.ts` is untouched.** Its `legacyHeal` path only fires when
   `healAmount` is absent, and it defers to the engine otherwise — so the band
   flows through it with no change.
8. **Both presenters teach the band, in their own register.** The shop says
   `restores 20 VITAE, 30 below half` (naming law: VITAE, never HP, on that
   surface). The inventory preview says `Heal 30 HP (badly wounded)` when the
   band is live and `Heal 20 HP` + `Heal 30 HP instead when below half HP` when
   it is not. The second line is the lever's whole job: a player at full health
   must be able to SEE the flask is worth more later.

## Empty / loading / error states

- No heal payload → preview falls through to the existing legacy-`effectId`
  path, then `No HP change.` Unchanged.
- Band present, flat absent → heals 0; no band copy renders.
- `maxHealth <= 0` → never desperate; flat rate.

## Mobile reflow

The inventory preview gains at most one extra line (the advertisement), which
the existing `previewLines` list renders and wraps. No layout change.

## Pages x tests matrix

| Suite | Asserts |
|---|---|
| `axiomancer-mechanics/src/Items/e2e/desperation-band.engine.test.ts` (new, 24 tests) | threshold is strict; band read before heal; band-only is inert; clamp still wins; degenerate records; all five library healers at 1.5x; no non-healer banded; no band below its own flat heal |
| `axiomancer-mobile/state/e2e/inventory.modal.engine.test.ts` (+4) | larger heal flagged when wounded; flat + advertisement when healthy; silence for band-less; HP delta projects off the resolved amount |
| `axiomancer-mobile/state/e2e/ware-effect-line.S5-talk-C04.test.tsx` (+2) | shop line states both bands and keeps the VITAE naming law; flat-only line unchanged |

## Verify gate

`src/index.ts` changed, so AGENTS.md's cross-package impact checklist applies in
full:

- `npm run verify --workspace axiomancer-mechanics` — 3504 tests, 215 files, build
- `npm run verify --workspace axiomancer-mobile` — 2875 tests, 302 suites
- `npm run type-check --workspace axiomancer-card-editor` — clean

Baseline: this is a mechanics change, so `deck-matrix-baseline.json` goes stale.
Regen is deferred to a single pass at the end of the session (owner call, this
session) rather than once per phase.

## DoD

- [x] `healAmountBelowHalf` on `Consumable`, `desperate` on `ConsumableUseResult`
- [x] `DESPERATION_HP_FRACTION` / `isDesperate` / `resolveConsumableHeal` exported
      from `Items/index.ts` and the mechanics root `index.ts`
- [x] five healing potions retuned at 1.5x with copy that teaches the band
- [x] both mobile presenters state the band
- [x] 30 new tests, all three gates green

## Follow-ups (out of scope)

- Lever 1 (always-good secondary rider on every potion) — a card/effect design
  question, not an item-field one.
- Lever 3 (potions as a renewable categorical resource) — needs a generation
  loop and a payoff surface; a phase of its own.
- The band is currently player-only because only the player drinks. If enemies
  ever gain consumables, `resolveConsumableHeal` already takes any
  `{health, maxHealth}` record and needs no change.
