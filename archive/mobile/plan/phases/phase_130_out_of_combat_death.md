# Phase 130 — Out-of-combat death + scar/curse consequence weight

> Promoted via `/oversight` 2026-06-16 from expand pass 78 [score 4.5].

## Outcome

The Hazard `minhp` consequence (and stacked penalties: `penaltyVitae`,
SACRIFICE `vitaeCost`, multiple `minhp` rolls) currently bottoms out at
a silent VITAE floor of 1 — `claimHazardRewardsAction` clamps
`player.health + vitaeDelta` with `Math.max(1, …)`
(`state/hazard/store-actions.ts:480`). A pilgrim can take a lethal
crossing on 1 VITAE and walk away on 1 VITAE. The risk/reward loop has
**no teeth**: there is no out-of-combat death.

This phase wires the **out-of-combat death path** for a genuinely
lethal Hazard outcome — a crossing whose net VITAE swing would drop the
player to `health <= 0` by the engine's own `isDefeated` threshold.
Instead of the silent floor, a fatal crossing routes through the engine's
established death/respawn primitive — `resetRun({ keepCharacter: true })`
— exactly the consequence combat death's BEGIN AGAIN flow already uses,
records a durable `hazard-death:<n>` tombstone flag, and surfaces
`died: true` on the claim result so the modal can render a death beat.

After this phase a Hazard you cannot afford can actually kill the run:
the character survives (keepCharacter), but the run loop resets — the
push-your-luck stakes the consequence model was promoted for.

## Engine truth consumed (NOT engine-gated)

This is **not** engine-gated. `axiomancer-mechanics` 0.21.0 already
owns the full death model the phase needs:

| Export | Use |
| --- | --- |
| `isDefeated(combatant)` → `health <= 0` (`Combat/health`) | the lethality threshold — the SAME predicate combat death uses |
| `GameStore.resetRun({ keepCharacter })` (`Game/store`) | the engine-owned death/respawn primitive; combat BEGIN AGAIN already calls it |

The engine has no out-of-combat *run-loop death event* (no
`onPlayerDeath`, no global game-over state) — death is modeled as the
`isDefeated` threshold plus the `resetRun` transition. The mobile
adapter composes those two engine truths at the Hazard claim site; it
does **not** simulate a new death rule locally. Documented divergence
already present in `docs/hazard-v2-vs-mechanics-divergence.md:218`
("Out-of-combat death: absent; hazard damage floors VITAE at 1") — this
phase flips that line.

## What ships

- **Lethality detection in `claimHazardRewardsAction`
  (`state/hazard/store-actions.ts`).** Before the `Math.max(1, …)`
  floor, compute the *nominal* post-crossing VITAE
  (`player.health + vitaeDelta`). When it is `<= 0` (engine `isDefeated`
  threshold), the crossing is fatal:
  - stamp a durable `hazard-death:<timestamp>` flag (run-count
    tombstone, same flag-record discipline as `hazard-scar:` /
    `hazard-token-banked:`),
  - call the engine `resetRun({ keepCharacter: true })` via the
    established cast pattern (`actions.ts` `resetRun` wrapper),
  - clear the hazard session, persist, and return `died: true`.
  - The spoils that would have ridden along (shillings, cards, tokens)
    are forfeit on death — a fatal crossing yields no reward.
- **`ClaimHazardRewardsResult` gains `died: boolean`.** `NOOP_CLAIM`
  and the non-fatal success path both report `died: false`; the fatal
  branch reports `true`. Lets the modal/aftermath layer key a death
  beat off the result without re-deriving lethality.
- **`HAZARD_DEATH_FLAG_PREFIX = 'hazard-death:'`** exported alongside
  the existing flag-prefix constants; `hazardDeathCount(flags)` helper
  mirrors `bankedScarMagnitude` for read-back / future tombstone UI.
- **Divergence doc** line flipped from "absent" to the wired model.

## Decisions made upfront — DO NOT ASK

- **Lethality = engine `isDefeated` threshold (`<= 0`), not the
  floor-1 clamp.** Reuse the engine predicate the combat death path
  uses; do not invent a "death at 1" or percentage rule. The nominal
  swing crossing zero is death; a swing that lands on exactly 1 VITAE
  is a maiming, not a death (unchanged).
- **`resetRun({ keepCharacter: true })`, not `false`.** Mirror combat
  BEGIN AGAIN: the character (stats, level, allocation) survives; the
  *run* resets. A full character wipe (`keepCharacter: false`) is a
  harsher rule the engine supports but combat does not use for death —
  staying consistent with the combat death/aftermath flow the row
  demands.
- **Spoils forfeit on a fatal crossing.** You do not bank shillings or
  pick a reward card on the crossing that kills you. The death branch
  returns before applying spoils to the player slice; `died: true`
  carries zeroed deltas.
- **Tombstone flag, not engine state.** The engine owns no death
  *counter*; the `hazard-death:` flag is the durable mobile record
  (same family as scar/token flags), readable for a future "deaths
  this save" tombstone surface. Non-gating, additive.
- **Persist after death.** A fatal crossing is exactly the kind of
  irreversible moment the explicit-save policy exists for — `save()`
  fires after `resetRun`, same as the spoils path.
- **No new modal in this phase.** The presenter/aftermath death beat
  is surfaced via the `died` result flag; wiring a bespoke Hazard
  death panel UI is a scoped follow-up. The consequence (run reset) is
  real and fully tested at the store-action layer now.

## Pages × tests matrix

| Surface | Test |
| --- | --- |
| lethal crossing (`health + vitaeDelta <= 0`) triggers `resetRun`, stamps `hazard-death:` flag, returns `died: true`, forfeits spoils | `state/e2e/hazard-out-of-combat-death.engine.test.ts` |
| non-lethal crossing still floors at 1, `died: false`, spoils applied (regression) | same file |
| `hazardDeathCount` reads tombstone flags | `state/hazard/__tests__/death-flag.test.ts` |
| existing scar/claim flow unaffected | `state/e2e/hazard-scar-rest-recovery.engine.test.ts` (unchanged, must stay green) |

## Verify gate

`npm run verify` (lint 0 errors + typecheck + full jest). Hermetic
test confirms a lethal hazard outcome triggers the defined
out-of-combat death consequence (run reset + tombstone + forfeit),
and a survivable outcome does not.

## Commit body template

```
feat: out-of-combat death — phase 130

- lethal hazard crossing (isDefeated threshold) resets the run
- hazard-death tombstone flag + hazardDeathCount read-back
- ClaimHazardRewardsResult.died surfaces the death beat
- fatal crossings forfeit spoils; survivable ones still floor at 1

Decisions:
- death = engine isDefeated (<=0), not the floor-1 clamp
- resetRun keepCharacter:true, mirroring combat BEGIN AGAIN
- spoils forfeit on the killing crossing

Closes #<phase-issue>
```

## DoD

`[ ]` → `[x]` on the Phase 130 row in `01_build_plan.md` with the
commit hash, same commit family.

## Follow-ups (out of scope)

- Bespoke Hazard death modal / aftermath panel (this phase surfaces
  `died` on the result; a dedicated death beat UI is separate).
- Deaths-this-save tombstone surface reading `hazardDeathCount`.
- Extending the lethality model to Gathering / other minigames if they
  grow VITAE-draining consequences.
