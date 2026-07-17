# Phase D2 — Upgradeable-Dice engine core (flagged)

> Agent-facing brief. Build the entire spec-33 combat dice model behind a
> feature flag, engine-only, with hermetic tests. NO mobile UI (D6), no
> gear items/blacksmith (D5 — but D2 defines the gear *interface*), no
> repricing (D3/D4). **Engine work — pause `/march` + night crons before
> starting** (collision discipline). Spec 33 is post-D1 and owner-locked:
> build what it says; do not re-litigate.

## Inputs

1. `axiomancer-mechanics/specs/33-upgradeable-dice.md` — the law. §1
   dice/pool, §2 stance, §3 momentum, §4 valves, §5 economy, §6 table.
2. `plan/phases/phase_D1_upgradeable_dice_spec_review.md` § DECISION LOG —
   the owner calls, verbatim.
3. `src/Combat/combat.dice.ts`, `combat.engine.ts` — the surfaces being
   superseded (see phase_31 brief banner for what survives).

## Scope

- **Flag**: one engine-level switch (constant/config, e.g.
  `UPGRADEABLE_DICE`) gating the whole model; flag-off preserves current
  behavior byte-for-byte (existing tests stay green untouched).
- **Dice**: 4 fixed dice authored AS stance names (body/mind/heart/wild —
  hex is rendering, spec §1); per-die face tables sourced from a **die-gear
  interface** (`payload provider + face table` per die). D2 hardcodes the
  default gear (R/B/P: 1 special/2 mana/3 miss, +2◆ payload; Gold: 1/1/4
  wild). D5 makes gear real items — the interface is the contract.
- **Roll/turn law**: roll all 4 each round; every usable die may power one
  paid line of its color (gold = any); no draft, no single-die law.
- **Stance-from-cards** (§2): stance = last PAID card's stance; fights open
  stance-less (null-stance rule: no check fires); `punishes`/`yields`
  stance-check fields on threat-phase scripts, resolved at phase end on
  `READ_DAMAGE_MULT` rails; yields pays +1◆.
- **Momentum** (§3): `{color, length} | null`; heart→body→mind cyclic;
  break (wrong OR same color paid) = **reset to null** — do NOT port the
  shipped `advanceWheel` restart truth table; keep the landed-play gate
  (only `card-played` advances); persists across rounds; surge = temp gold
  die **until spent, this combat**, then momentum null; FREE never touches.
- **Valves** (§4): Press Fate = 1◆, rerolls all miss faces, once/round,
  **honest** (the shipped `rerollSpentDice` stance guarantee is a rig —
  delete, don't port); cracked dice excluded from the reroll.
- **Ports** (§6 table): Reserve (bank 1 mana/special die, cap 2, pips
  unchanged; banked special fires payload on spend — the PROVISIONAL
  special-on-use rule is ONE switchable constant); KINDLE cap 1 concurrent;
  OVERHEAT (second card off a spent die @35% crack; the second play IS a
  paid play — moves stance/momentum; gold overheatable); Resonance
  unchanged; CHARM/blockedStances/canAct unchanged (enemy-side);
  gold+lead pair (leaden = 5 miss / 1 gold mana); `sig-read-opponent` →
  reveals next phase's stance check + reactive branch.
- **Ceiling** (§1): 7 die objects, materialization priority, overflow
  converts to +1◆ — reuse the existing overflow idiom.
- **Retire in-flag**: draft/read economy (`resolveRead`-as-draft, read-win
  ◆, unpicked-die income, OMEN v1) and **STAKE plumbing removed entirely**
  (`placeStake`/`settleStake`, tiers, escalation-tick loss — owner call,
  not rewired).

## Decisions made upfront — DO NOT ASK

Everything marked [owner-locked] in spec 33 post-D1, incl.: momentum
null-reset; surge until-spent; STAKE removal; special-on-use PROVISIONAL
(keep switchable, default ON); Gold=wild; miss=0◆; fixed-4 pool.

## Surface as `[needs-user-call]`

- Only a contradiction discovered INSIDE spec 33 while implementing — cite
  both sections and stop that item; do not guess.

## Prove (DoD)

- Hermetic vitest with `mockSequentialRng` for: roll law, color law, whiff
  round, Press Fate honesty (statistical witness: no face-type guarantee),
  momentum truth table incl. null-reset + persistence + surge lifetime,
  stance checks incl. null-stance, ceiling overflow →+1◆, OVERHEAT crack +
  Press-Fate exclusion, Reserve×special payload timing, both flag states.
- Flag-off: full existing suite green with zero edits to existing tests.
- `CombatManaDie`/public-barrel change ⇒ migrate mobile + card-editor in
  THIS phase; re-verify `npm run verify -w axiomancer-mobile`.
- Flip D2 `[x]` in `plan/steps/01_build_plan.md` + Phase log + commit hash.

## Follow-ups (out of scope)

- D3 measures; D4 reprices; D5 real gear + blacksmith; D6 UI; D7 ratifies
  + decides the flag-default flip.
