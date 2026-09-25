# Phase D3 — Upgradeable-Dice sim harness + economy derivation

> Agent-facing brief. Teach the autoplay policies the new action space,
> then measure spec 33 §7's **D3 gates** with a Monte-Carlo witness and
> DERIVE the economy constants D2 left symbolic. No UI, no card
> re-authoring. Engine-adjacent — collision discipline applies.

## Inputs

1. Spec 33 §5 (number ownership: this phase derives signature/ante
   constants), §7 (D3 gate table — the mandate).
2. `src/Combat/combat.autoplay.ts` — the policies to extend.
3. D2's flag + engine (deps: D2 shipped).

## Scope

- **Policy extension**: the blind/greedy/status policies must handle:
  which die powers which card (color law + gold), Press Fate spend
  decision, momentum steering (advance vs deliberate break-to-null),
  stance-check answering (steer into yields / out of punishes), OVERHEAT
  gamble, Reserve banking. Policies stay simple and legible — they are
  measurement instruments, not AIs.
- **Monte-Carlo witness** (extend combat-sim / `combat-playtest` cells),
  seeds ≥ 5, all 10 starter presets × 4 stages, flag-on:
  - E[usable dice/round] 1.83 ± 0.05 (stock gear)
  - Whiff 8.3% ± 1%; post-Press-Fate residue ≈0.7%; dead-round rate
    (FREE-only, 0◆) measured + reported
  - Per-color access ≥ 65%
  - ◆ income/round 1.2–1.6 (specials + yield bonuses)
  - Surge frequency — measured; PROPOSE the target band from the data
  - **STAKE-retirement gap**: escalation-clock pressure + ◆-sink delta vs
    flag-off baseline, reported explicitly
- **Derive** (report + engine-constant proposals, ratified at D7):
  signature cost table (target: meaningful spend every 2–3 rounds at
  ~0.3–0.6◆/round discretionary), ante/scrap constants,
  `sig-read-opponent` cost, Reserve/pip values sanity check.

## Decisions made upfront — DO NOT ASK

- Bands are spec 33 §7's — do not move them to fit; a miss is a finding.
- Win curve / statusEngagement are NOT measured here (D7 gates — a pre-D4
  read is a false red/green, spec §7).

## Surface as `[needs-user-call]`

- A D3 band that fails by design (not by bug) — e.g. income structurally
  outside 1.2–1.6 — with the dial options (face counts, payload size,
  yield bonus) laid out. Face-table changes are owner territory.

## Prove (DoD)

- Report (dated, `plan/tuning/`) with every gate row measured, seeds/config
  stated, STAKE gap quantified, derived-constant table proposed.
- Sim tests pinned (band assertions live in a `.sim.test.ts` gated to
  flag-on).
- Flip D3 `[x]` + Phase log + hash.

## Follow-ups

- D4 consumes the derived economy; D7 ratifies constants + flips bands to
  hard assertions.
