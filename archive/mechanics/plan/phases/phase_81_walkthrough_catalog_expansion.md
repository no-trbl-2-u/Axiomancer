# Phase 81 — Walkthrough catalog expansion (Phase 65 / 66 / 68 coverage)

> Content-only phase. Ships three new walkthrough pairs under
> `automation/scripts/walkthroughs/` for Phase 65 (fishing-village
> 25-node map), Phase 66 (Tier 2 synergy → pivoted per D2), and
> Phase 68 (Coastal Tyrant per-enemy befriendability predicate).

## Outcome

Three new walkthrough pairs ship in `automation/scripts/walkthroughs/`:
- `fishing-village-exploration.{json,goal.md}` — Apprentice exploring
  the Phase 65 25-node grid via the Harbor District sub-area to the
  MournfulGull encounter at fv-15.
- `tier2-skill-chain.{json,goal.md}` — Wanderer casts Tier 2
  `eternal-regress` (two-effect compound application) in a
  debug-spawned combat, exercising the Phase 80 always-land contract
  on a multi-effect skill.
- `coastal-tyrant-befriend.{json,goal.md}` — Sage drives Coastal
  Tyrant combat toward the Phase 68 `BefriendabilityConfig`
  AND-composition (hpGate ≤ 0.4 + requiredStances `['heart']` +
  roundsThreshold 5) targeting the friendship outcome.

The `automation/scripts/walkthroughs/README.md` inventory table grows
three rows + `docs/testing.md` § "Agent-graded walkthroughs (Phase 26)"
gets a Phase 81 fold-in note. `CHANGELOG.md [unreleased] ### Added`
entry.

## Source

`plan/PHASE_CANDIDATES.md` Promoted section, Phase 81 row — promoted
at oversight-19 2026-05-24 (commit `7419142`). Original candidate
filed at expand-22 (`4826c37`) framing the post-Phase-65/66/68
coverage gap.

## Sibling brief

`plan/phases/phase_64_*.md` — last walkthrough authored
(endgame-loadout). Same agent-graded harness, same `.json + .goal.md`
pair pattern, same agent grader format.

## Implementation units

### Unit 1 — fishing-village-exploration walkthrough

Script: 4 moves + a quit. Apprentice preset (default fv-1 start) →
fv-11 (Inland Streets) → fv-14 (Harbor District spine) → fv-15
(gull crag — MournfulGull guaranteed encounter, weight 1). On
encounter trigger, the script issues a few defend rounds (Apprentice
is level 1; aggressive attacks against a level-2 enemy at the cost
of HP is unwise + non-deterministic), then quits. The walkthrough
demonstrates Phase 65's 25-node grid + Phase 60 befriendable
placements + Phase 23/24's `resolveMapEvent` chain.

Note: the walkthrough doesn't try to win or befriend — it pins the
**traversal + encounter trigger** at fv-15. Hermetic combat coverage
lives at `src/Game/e2e/befriend.engine.test.ts` (Phase 60 + 68
covered there).

### Unit 2 — tier2-skill-chain walkthrough

**Pivoted per D2.** Original candidate scope was Phase 66 synergy
skills (`resonance-bleed`, `intensity-feedback`, etc.), but **none
of the 5 Phase 66 synergy skills ship in any preset's `knownSkills`
or `equippedSkills`** (TIER_2_SKILLS in `src/Character/presets.ts`
holds only the 3 originals: mob-appeal, undistributed-middle,
eternal-regress; Phase 66 added 5 more to the library but not to
the presets). Exercising the synergy skills would require either
(a) extending the presets (engine work outside Phase 81 scope) or
(b) navigating Character-tab Learn + Equip prompts (significant
walkthrough complexity, and the Equip prompt isn't certain to exist
in the CLI — would need verification).

**Pivoted scope:** the walkthrough exercises **Wanderer casting
`eternal-regress`** (Tier 2, basePower 6 heart, applies
`debuff_confusion` + `debuff_slow` to opponent in one cast). This
skill:
1. Is pre-equipped on Wanderer (slot 4).
2. Exercises the **two-effect compound application** that Phase 78
   flagged as a MED-coverage gap (one of the 3 zero-coverage
   primitives).
3. Lands under the **Phase 80 always-land contract** — both effects
   now land unconditionally; the walkthrough is the first walkthrough
   to demonstrate the post-Phase-80 behaviour at the player-experience
   tier.

Script: Wanderer preset → debug spawn of a Tier 1 enemy (sandbag if
available; else wet-hound) → 1-2 basic body rounds to build up heart
+ mind tokens → switch to heart stance + skill: eternal-regress →
1-2 cleanup rounds → quit.

Coverage gap closure for Phase 66 synergy walkthroughs filed as a
new Pending candidate at ship-time (D6).

### Unit 3 — coastal-tyrant-befriend walkthrough

Sage preset (level 15) → debug spawn coastal-tyrant → drive heart
stance + defend for ≥5 rounds (the Phase 68 BefriendabilityConfig
requires `roundsThreshold: 5` + `requiredStances: ['heart']`). The
hpGate (0.4) is harder to satisfy — Sage's heart-stance defend won't
damage the Tyrant; the Tyrant must attack itself into hpGate range,
OR we accept that the walkthrough may not reach the friendship
outcome and grade on **whichever outcome surfaces** (befriendability
predicate path attempted; engine evaluation visible in the event
stream).

Per D3 below: grade on **predicate-attempt visibility**, not
friendship-success. The walkthrough's value is exercising the
Phase 68 surface; whether AND-composition fires is dependent on
the boss's offensive RNG against Sage's defense.

### Unit 4 — Inventory update + docs + CHANGELOG

- `automation/scripts/walkthroughs/README.md` inventory table: 3 new
  rows (matching the existing column shape).
- `docs/testing.md` § "Agent-graded walkthroughs (Phase 26)" — short
  Phase 81 fold-in paragraph naming the 3 new walkthroughs + their
  per-phase coverage attribution.
- `CHANGELOG.md [unreleased] ### Added` entry naming the 3 new
  walkthroughs + the deferred Phase 66 synergy walkthrough candidate.

## Decisions made upfront — DO NOT ASK

- **D1 — Single-commit ship.** All four units land in one commit
  (content-only; no engine touch; verify gate is automatic since
  no source files change).

- **D2 — Unit 2 pivot from Phase 66 synergy → Tier 2 `eternal-regress`.**
  None of the 5 Phase 66 synergy skills ship in any preset's
  `knownSkills` / `equippedSkills`. Exercising them via Learn +
  Equip workflow would significantly complicate the walkthrough +
  risks failure-mode 6 (scope expansion). Pivot to `eternal-regress`
  preserves the intent (exercise a Tier 2 skill in combat) + lands
  a bonus benefit (closes one of Phase 78's MED-coverage primitives
  via the player-experience tier). The Phase 66 synergy walkthrough
  candidate is filed at ship-time per D6.

- **D3 — Unit 3 grades on predicate-attempt visibility, not
  friendship-success.** Coastal Tyrant's hpGate requires the boss
  to fall to ≤40% HP; Sage's heart-stance defend doesn't damage
  the Tyrant. The boss would need to be self-damaging via DoTs (no
  authored DoT-self mechanic) OR Sage would need to body-attack
  alongside (which breaks `requiredStances: ['heart']`). The walkthrough
  intentionally **attempts** the predicate path and grades on
  **engine-visible attempt** — the grader confirms that (a) Sage
  spent ≥5 rounds in heart stance, (b) defend was the action, (c)
  the BefriendabilityConfig was evaluated at least once. Whether
  AND-composition resolves to friendship is RNG-dependent.

- **D4 — Apprentice over Wanderer for Unit 1.** Apprentice is level
  1 with no equipment — the canonical "fresh from char-creator"
  state. Unit 1's value is exercising the 25-node map + the
  MournfulGull encounter trigger, not surviving the combat. The
  walkthrough quits before combat resolves (the encounter triggers
  → script issues `quit`).

- **D5 — Defend-only on encounter trigger in Unit 1.** Apprentice
  defending in heart stance against MournfulGull's 4-heart attacks
  is the safest non-aggressive interaction — the player isn't
  killed, the encounter is visible, the friendship counter may even
  start incrementing. If the script wants to demonstrate the
  encounter trigger AND avoid combat noise, the cleanest exit is
  `tab: quit` immediately after the move that triggers the
  encounter — but the CLI's combat-mode prompt would expect
  combat actions next. So: 2-3 defend rounds, then quit. The
  walkthrough grade pins the encounter trigger (combat:started
  event); combat outcome is not graded.

- **D6 — File the Phase 66 synergy walkthrough as a new Pending
  candidate.** The original Phase 81 Unit 2 scope (Phase 66 synergy
  walkthrough) is genuinely worth shipping eventually; it just
  needs a preset extension first. Candidate body: extend
  TIER_2_SKILLS (or add a new `TIER_2_SYNERGY_SKILLS` const) to
  include the 5 Phase 66 skills + add them to Wanderer's
  `knownSkills` + add 1-2 to `equippedSkills`. Then the synergy
  walkthrough becomes 5-line trivial.

- **D7 — Inventory table column shape stays unchanged.** Three new
  rows match the existing column layout (Script / Surface / Preset
  / Enemy / Flags / Exit). No table restructuring.

- **D8 — No `--save-file` flag required for any of the 3 new
  walkthroughs.** None touch the Save / Load tabs. Per the
  README.md convention, only walkthroughs that explicitly touch
  Save / Load need pre-allocated paths.

- **D9 — Do NOT run `node automation/agent-e2e.mjs` during the
  phase.** The harness calls the Anthropic API (non-hermetic, costs
  money, slow). Per `docs/testing.md` Phase 26 description, agent-e2e
  is non-hermetic by design; running it in a `/ship-a-phase`
  autonomous tick would be off-scope. The walkthroughs ship as
  content; future agent-graded runs validate them in their own
  cadence.

- **D10 — No new TypeScript files.** All four units are pure JSON +
  markdown content. Verify gate runs but no engine change touches
  the type-check / test path.

## Verify gate

Pure content / docs change. `npm run verify` should be a no-op pass
(713/713 stay green). `npm run deploy:check` is unaffected (walkthroughs
aren't packaged into the published tarball per `package.json` files
exclusions).

## Commit body template

```
feat(walkthroughs): Phase 81 shipped — 3 new walkthroughs (Phase 65 / 80 / 68 coverage)

- automation/scripts/walkthroughs/fishing-village-exploration.{json,goal.md}
  — Apprentice exploring the Phase 65 25-node grid via Harbor District
  to MournfulGull encounter at fv-15 (Phase 60 befriendable placement)
- automation/scripts/walkthroughs/tier2-skill-chain.{json,goal.md}
  — Wanderer casts Tier 2 eternal-regress (two-effect compound:
  debuff_confusion + debuff_slow), exercising the Phase 80 always-land
  contract on a multi-effect skill (closes Phase 78 MED coverage gap)
- automation/scripts/walkthroughs/coastal-tyrant-befriend.{json,goal.md}
  — Sage drives heart-stance defends to attempt the Phase 68
  BefriendabilityConfig AND-composition (hpGate / requiredStances /
  roundsThreshold); grades on predicate-attempt visibility per D3
- automation/scripts/walkthroughs/README.md inventory: 3 new rows
- docs/testing.md § "Agent-graded walkthroughs (Phase 26)" extended
- CHANGELOG.md [unreleased] ### Added entry

Decisions:
- D1: single-commit ship (content-only)
- D2: Unit 2 pivoted from Phase 66 synergy → Tier 2 eternal-regress
  (none of the 5 synergy skills ship in any preset's knownSkills)
- D3: Unit 3 grades on predicate-attempt visibility, not friendship
- D4-D5: Apprentice + defend-only for Unit 1 (no combat outcome grading)
- D6: Phase 66 synergy walkthrough filed as new Pending candidate
- D7: inventory table column shape unchanged
- D8: no --save-file flag needed
- D9: do NOT run agent-e2e.mjs during phase ship (Anthropic API)
- D10: no new TypeScript files (pure content)

713/713 tests stay green; verify + deploy:check clean.
Brief committed at <this-commit>.
```

## Definition of Done

- [ ] `automation/scripts/walkthroughs/fishing-village-exploration.json`
      + `.goal.md` ship.
- [ ] `automation/scripts/walkthroughs/tier2-skill-chain.json`
      + `.goal.md` ship.
- [ ] `automation/scripts/walkthroughs/coastal-tyrant-befriend.json`
      + `.goal.md` ship.
- [ ] `automation/scripts/walkthroughs/README.md` inventory table
      gains 3 new rows.
- [ ] `docs/testing.md` § "Agent-graded walkthroughs (Phase 26)"
      extended.
- [ ] `CHANGELOG.md [unreleased] ### Added` entry.
- [ ] `plan/PHASE_CANDIDATES.md` Pending gains a new "Phase 66 synergy
      walkthrough (requires preset extension)" candidate per D6.
- [ ] `plan/steps/01_build_plan.md` Phase 81 row flipped `[ ]` → `[x]`.
- [ ] `npm run verify` passes (no-op for content change).
- [ ] `npm run deploy:check` passes.

## Follow-ups (out of scope)

- Phase 66 synergy walkthrough (D6 candidate) — extend
  TIER_2_SKILLS / Wanderer.knownSkills + equippedSkills to include
  the 5 Phase 66 synergy skills, then author the synergy-chain
  walkthrough.
- Agent-grader pass — running `node automation/agent-e2e.mjs
  fishing-village-exploration` etc. validates the walkthroughs at
  the API tier; cron-scheduled or one-shot user trigger.
