# Phase D9 — Authored stance-check variety (salvage PR #109)

> Agent-facing brief. Promoted from AUDIT via `/oversight` 2026-07-18. Deps:
> D6e (shipped, uniform `defaultStanceCheck` backfill), D8 (shipped, dice
> valves). Reference implementation on closed PR #109's branch
> (`origin/claude/march-push-main-tcjk0j`) — that PR shipped BOTH the pipeline
> threading AND the uniform backfill as one replace-the-default change; it
> conflicted and was superseded by a simpler D6e (backfill only, no authoring
> capability). D9 salvages PR #109's pipeline + content as an ADDITIVE layer
> on top of the shipped D6e backfill instead of replacing it.

## Outcome

Enemies can author a per-phase open stance check (`stanceCheck: { punishes?,
yields? }`) that overrides D6e's uniform `defaultStanceCheck(enemyStance)`
fallback. Bosses can name two distinct stances across their sequence (spec 33
§2's "bosses may check two stances" variety). Authored check wins; absent →
uniform default (byte-identical to pre-D9 behavior for every phase that
doesn't opt in).

## What ships

1. **Pipeline (additive, non-breaking).** `stanceCheck?: { punishes?: Stance;
   yields?: Stance }` threaded onto:
   - `AuthoredThreatPhase` (`combat.threat.ts`) — the per-phase authoring slot.
   - `CombatThreatBranchOutcome` (`combat.encounter.types.ts`) — the per-fork
     authoring slot (branch phases, WS9).
   - `resolveBranchOutcome` — copies `p.stanceCheck` onto the resolved fork.
   - `resolveAuthored` — copies `p.stanceCheck` onto both the linear-phase
     return and (via `...elseOutcome` spread, already in place) the branch
     step's base face.
   - `commitThreatBranch` — copies `outcome.stanceCheck` (the TAKEN fork's
     value) onto the committed phase, so a branch's THEN/ELSE forks can name
     different checks.
   - `getThreatSequence`'s existing backfill (`p.stanceCheck ? p : {...p,
     stanceCheck: defaultStanceCheck(p.enemyStance)}`, shipped D6e) is
     UNCHANGED — it already implements "authored wins, absent → default"
     correctly once phases can carry an authored value at all. No edit
     needed there.
2. **Content.** 22 hand-authored checks across 14 enemies, ported from PR
   #109's authoring batch (`combat.threat-sequences.ts`): grave-larva,
   little-belle, foot-stealer, the-butcher, king-of-revenge (2 stances named:
   heart punish, mind yield), sugata, tri-eyes, mirac, hasshaku-sama,
   rawhead-rex, fire-giant, rangda, tezcatlipoca, death. Bosses (king-of-
   revenge, rawhead-rex, fire-giant, rangda, tezcatlipoca, death) each carry
   checks spanning >= 2 distinct stances across their sequence. Density
   stays within D6e's ~1-2 checks/fight authoring law — this batch adds
   checks to existing phases, it does not add new phases.
3. **Regression guard (new e2e).** `phase-d9-stance-check-variety.engine.test.ts`
   pins:
   - An authored check (Grave Larva) survives `getThreatSequence` unchanged
     (the exact regression PR #109 was written to prevent: silent drop).
   - A boss (King of Revenge) names >= 2 distinct stances across its phases.
   - Every authored check in `AUTHORED_THREAT_SEQUENCES` is well-formed
     (>= one side, every side a real `Stance`) and the batch spans all three
     stances.
   - An authored check drives `resolveStanceCheck` end-to-end through the
     real engine (yield blunts + pays Conviction; punish lands advantage;
     off-check stance is `none`) — flag-on only, inert flag-off.
   - Branch forks (`commitThreatBranch`) carry their OWN authored check
     through to the committed phase (THEN != ELSE).

## Decisions made upfront — DO NOT ASK

- **Additive, not replace-the-default.** PR #109 deleted `defaultStanceCheck`
  and the `getThreatSequence` backfill, assuming full manual authoring. D9
  keeps both — most phases across the ~60-enemy roster still have no
  authored check and rely on the uniform default; only a hand-picked batch
  (bosses + the D3 economy-witnessed trio) gets an authored override. This
  matches the build-plan row's explicit framing ("rework over the backfill,
  do not revert it").
- **Content is a direct port, not a re-author.** PR #109's 22 checks were
  already reviewed prose (thematic yields/punishes tied to each phase's
  action text); ported verbatim rather than re-derived, since the base
  `combat.threat-sequences.ts` entries the diff touches are byte-identical
  to PR #109's pre-image (verified via `git apply --check` before landing).
- **No density/payout retuning.** D7 already owns those dials; D9 only adds
  authoring capability + a first content batch, matching the existing +1◆ /
  ×0.5 / ×1.5 constants.

## Prove (DoD)

- `npm run verify --workspace axiomancer-mechanics` green (type-check + test
  + build).
- New e2e green, including the flag-on/flag-off inert split.
- `npm run typecheck --workspace axiomancer-mobile` and `--workspace
  axiomancer-card-editor` green (shared-contract check — additive optional
  field only).
- Flip D9 `[x]` in `plan/steps/01_build_plan.md` + commit hash.

## Follow-ups (out of scope)

- Extending authored variety to the remaining roster (only 14 of ~60 enemies
  touched this pass) — a future content pass, not gating.
- "Not-X" check shapes (spec 33 §2 mentions them) — the field only models
  `punishes`/`yields` a single stance each; a richer condition shape is a
  separate design call if ever needed.
