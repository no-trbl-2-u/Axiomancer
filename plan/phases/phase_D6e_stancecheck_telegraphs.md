# Phase D6e — Enemy stanceCheck telegraphs (yield-lever content)

> Agent-facing brief. Author a first batch of **open stance checks**
> (`stanceCheck: { punishes?, yields? }`) onto enemy threat phases so
> spec 33 §2's yield lever (`yields: X → ×0.5 + 1◆`) and punish rail
> (`punishes: X → ×1.5`) actually fire in play. D2 shipped the resolver
> (`resolveStanceCheck`) and the resolved-phase field; D4 priced the
> synergy — but **zero enemies authored a check**, so realized yield
> income read **0.000** across 900 sim encounters (D3 finding F2). The
> yield lever is dark and D7's win-curve read cannot exercise the
> steer-into-yields loop the design leans on. This phase turns it on.
>
> Enemy content — mechanics package, no combat-engine behavior change.
> Parallel-safe with the mobile D6a–d stretch; a hard dependency of D7.
> Deps: **D2** (`resolveStanceCheck`) + **D4** (priced synergy) — both
> landed.

## Inputs

1. Spec 33 §2 (`axiomancer-mechanics/specs/33-upgradeable-dice.md`,
   "Stance: an output of play") — the check semantics and the
   **authoring law**: distribute checks across stances so mono-color
   builds face 1–2 off-color checks per fight; bosses may name two
   stances (or "not-X", which the single-`Stance` field does not model —
   bosses instead carry one `punishes` + one `yields`).
2. D3 finding F2 (`plan/tuning/2026-07-17-d3-dice-economy.md` §F2) — the
   dial options: check **density** (how many phases carry one) and yield
   **payout** (spec-fixed at +1◆). The +1◆ pays only when the die is
   *used*; the sim's greedy policy is check-blind, so a yield lands only
   when play happens to end a checked phase in the yielded stance.
3. Authoring surface: `combat.threat-sequences.ts`
   (`AUTHORED_THREAT_SEQUENCES`, keyed by enemy id). Resolver pipeline:
   `combat.threat.ts` (`resolveAuthored` / `resolveBranchOutcome` /
   `commitThreatBranch`).
4. Economy witness: `simulateUpgradeableEconomy` — reads `yields` off the
   `stance-check-resolved` event stream; exercises `stage.enemySlugs[0]`
   per stage (early → grave-larva, mid → tri-eyes, late → fire-giant).

## Scope

- **Pipeline (minimal enabler, additive).** `AuthoredThreatPhase` did
  NOT carry `stanceCheck`, and `resolveAuthored` dropped it — an authored
  check was silently discarded (`grep stanceCheck src/Enemy/` → 0, and
  the resolver never referenced it). Thread `stanceCheck?` onto
  `AuthoredThreatPhase` and the branch fork `CombatThreatBranchOutcome`,
  and copy it through `resolveAuthored` / `resolveBranchOutcome` /
  `commitThreatBranch` — the same passthrough pattern as `rungs` /
  `stanceHint`. Flag-gated at resolution (inert flag-off).
- **Content.** A first batch of ~14 enemies across all three stages
  authors 22 checks, distributed so all three stances appear as both a
  `punishes` and a `yields`. The three economy-sim-witnessed enemies
  (grave-larva / tri-eyes / fire-giant) each carry a `yields`, so the
  witness measures realized yield income > 0. Density ≈ 1–2 checks/fight;
  bosses (king-of-revenge, rawhead-rex, rangda, tezcatlipoca, death)
  name two stances. Checks are tied thematically to their phase
  (e.g. the mindless larva `yields: mind` to a cool answer, `punishes:
  body` a brawl; Death's ledger `yields: mind`, its offered hand
  `punishes: heart`).
- **Canary flip.** The D3 economy test pinned `yieldIncomePerRound === 0`
  as CANARY F2, designed to fail loudly the moment content lands. Flip it
  to assert the yield lever is now live (`> 0`).

## Decisions made upfront — DO NOT ASK

1. **The pipeline plumbing ships here, in-scope.** The row said "no
   engine change"; F2 assumed the authored field already flowed through.
   It did not — D2 shipped the resolver + resolved-type field but not the
   authoring passthrough. Threading it is the minimal, additive,
   flag-gated enabler required for *any* authored check to fire; without
   it the content is inert. Not a combat-engine behavior change.
2. **Single-`Stance` checks only; no "not-X".** The resolved field is
   `{ punishes?: Stance; yields?: Stance }`. Bosses satisfy the "two
   stances" law by carrying one of each, not a negation.
3. **Density: a curated first batch, not the whole roster.** ~14 enemies,
   ~1–2 checks/fight, spanning early/mid/late and all three stances. D7
   tunes density/payout against the now-live yield signal; a later batch
   can extend coverage.
4. **Yield stance chosen for theme, not to game the policy.** The greedy
   witness is check-blind — yields fire by deck coincidence across the 10
   presets, which is exactly the steer-tension the design wants. The
   witness is proven empirically (yield > 0), not by reverse-engineering
   the policy's ending stance.

## Prove (DoD)

- Enemy-content tests (`phase-d6e-stance-checks.engine.test.ts`): an
  authored `stanceCheck` survives `getThreatSequence` (regression guard
  against the silent drop); the authored check drives `resolveStanceCheck`
  end-to-end on a real enemy (yield blunts ×0.5 + pays +1◆; punish lands
  ×1.5; off-check stance is `none`); flag-off is inert; branch forks carry
  their check through `commitThreatBranch`; the roster batch is
  well-formed and spans all three stances.
- Sim witness: the D3 economy test's CANARY F2 flips —
  `yieldIncomePerRound > 0` (realized ~0.05/round in the small canary
  slice; the lever is no longer dark).
- `npm run verify` (mechanics) green; mobile + card-editor typecheck
  green against the shared contract.

## Follow-ups (out of scope)

- **Density/payout tuning at D7** against the live yield signal.
- **A second content batch** extending checks to the remaining ~38
  enemies once D7 confirms the first batch's density is right.
- **Mobile render of the open stance-check telegraph** is D6b
  (`punishes X` / `yields X` in the threat readout) — this phase authors
  the data; D6b draws it.
