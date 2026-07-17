# Audit

> Findings queue for `/iterate`. Each row is scored
> `impact x ease / 10` (see `skills/iterate.md` §4). The Pending
> section is the loop's drain target; `/iterate` picks the
> highest score, ships one fix, moves the row to Done. Categories:
> see `plan/bearings.md` § "AUDIT category taxonomy".
>
> Seeded 2026-07-03 from the retired per-package harness
> (`/archive`) during nexus re-onboarding — stale/pre-monorepo
> findings were dropped; these were re-validated as still
> plausibly live. Verify each against current code before
> shipping; re-file or drain as reality dictates.

## Pending

### Stale worktree copy at .claude/worktrees/card-text-paid-effects-3cd590/
- category: debt
- impact: 2
- ease: 8
- detail: a full stale copy of the repo's guide files (and more) lives
  under `.claude/worktrees/card-text-paid-effects-3cd590/`, polluting
  glob/grep results (it surfaced in the 2026-07-16 agent-guide audit).
  It appears related to the card-text PAID-prose work that shipped
  around ef6a0ca3/d4f3a4f9. CAUTION: another agent was actively working
  in this area on 2026-07-16 — verify the worktree is abandoned
  (`git worktree list`, no uncommitted work inside) before removing it
  with `git worktree remove`; if it holds unmerged work, surface
  instead of deleting.
- next: /iterate

### Metric v2 design session parked until fresh metrics land
- category: gap
- impact: 7
- ease: 2
- detail: statusEngagement is enemy-side-only, volume-based, and
  arc-blind (2026-07-12 re-baseline: collapse + all-preset late 0.00),
  and it is the objective function for /deck-tuning and
  /combat-playtest. T agreed this is the highest-leverage fix but
  parked the design conversation (2026-07-16): a second agent is
  adding information to the metrics first, then T + Claude circle
  back to design metric v2 (player-side engagement, per-turn arc
  shape, win-path attribution). Loop guidance meanwhile: do not
  build new tuning conclusions on statusEngagement alone; treat its
  numbers as suspect per the known blind spots.
- next: attended session (T-gated — not loop work; do not auto-ship
  a metric rewrite)
- category: divergence
- impact: 6
- ease: 8
- detail: T's daily-play findings route three ways — Hermes (co-founder
  agent), direct chat with Claude, or manual fixes. Only work that
  lands in `plan/` files or GitHub issues is visible to the `/march`
  loop; Hermes-decided work that goes straight to code edits leaves no
  trace in the loop's state, so the loop optimizes over a stale model
  of what matters, and double-shipping risk rises (see the SIDE RAIL
  vs cloud Option A reconcile, 2026-07-16). Proposed convention: any
  Hermes-decided work item lands as a GitHub issue (or a build-plan
  phase row) before or alongside the code change, so both brains
  drain one queue via `/triage`. Requires T to adopt this on the
  Hermes side — not something the loop can enforce alone.
- next: /oversight (standing question 0 drains this)

### [3.2] Night workflow never installs Playwright's browser — breadth check silently would fail on every run
- category: gap
- impact: 4
- ease: 8
- detail: `.github/workflows/night.yml` calls `_claude-skill.yml`
  without `install_playwright: true` (unlike `critique.yml`,
  `deep-playtest.yml`, `hermes-playtest.yml`,
  `combat-ux-tuning.yml`, `critic-loop.yml`, which all set it).
  `/digest`'s breadth check (`npm run e2e:minigames` in
  `axiomancer-mobile`) needs Playwright's Chromium
  headless-shell binary; on a fresh Actions runner it isn't
  cached, so `hazard-e2e.mjs` aborts immediately with
  "Executable doesn't exist at
  .../chromium_headless_shell-1228/...". Worked around this run
  by installing it by hand (`npx playwright install
  chromium-headless-shell`) before the suite; without that step
  every future night run repeats the same failure and the
  nightly breadth signal is dead.
- next: /iterate

### Phase 32 Part 1b stalls: two consecutive `/march` ticks spawn a background Explore agent, then end the turn "waiting" on it — zero commits, zero carried research
- category: gap
- impact: 6
- ease: 6
- detail: the 2026-07-16 03:44 and 08:37 UTC `march` runs (both
  `conclusion: success`) both dispatched to Phase 32 Part 1b
  (Harvest — Souls persist across combats), both spawned an
  `Explore` sub-agent to map the save-schema migration pattern,
  and both ended their turn with `result: "I'll wait for the
  research agent's findings before proceeding with
  implementation."` / "...Waiting on that research before writing
  the implementation plan and code." Each run is a fresh
  `claude-code-action` invocation with its own session id
  (`010ab1fe…`, `1ffc277b…`); when the job's turn ends the runner
  tears down, so the spawned Explore's findings are discarded —
  the next tick starts the same research from scratch. Two ticks,
  ~$4 combined (`total_cost_usd` 1.84 + 2.20), zero diff. This is
  the same class of mistake `/digest` itself is explicitly warned
  against (§3.6/§4.7 of `skills/digest.md`: never end a turn with
  work pending on a backgrounded call this invocation can't resume
  into) — but nothing in `skills/ship-a-phase.md` (or `march.md`'s
  dispatch to it) carries the same rule yet, and Phase 32 will
  never converge on Part 1b via automatic ticks until it does.
- next: /iterate (teach `ship-a-phase`/`march` to run this class
  of research agent in the foreground and synthesize before ending
  the turn, or to persist findings somewhere a fresh tick can pick
  up cheaply, e.g. a scratch note under `plan/`)

### [1.2] Skipped enemy stat-budget test (content decision — RESOLVED via oversight 2026-07-08)
- category: content
- impact: 4
- ease: 3
- detail: `src/Enemy/e2e/new-enemies.engine.test.ts` skips its
  `enemyStatBudget` assertion — the 30 authored enemies match the
  budget at levels 1-4 but drift up to 2x at level 50 (authored
  under old constants with gear-tier scaling baked into raw
  stats). Decision (via `/oversight` 2026-07-08): the budget curve
  is canon; the 30 authored enemies need re-authoring to comply
  (reconstruct per-enemy gear-tier inputs so raw stats match the
  budget formula through level 50), then unskip the assertion.
  Promoted to `plan/PHASE_CANDIDATES.md` as a real content phase —
  see "Enemy stat rewrite to budget-curve compliance".
- next: /oversight (promote candidate to a build-plan phase when
  queue has room)

### [2.0] Mobile `as any` clusters at the state boundary
- category: debt
- impact: 4
- ease: 5
- detail: cast clusters at state/test boundaries, esp. the
  `state/actions.ts` engine-store bridge. Recurring drain target,
  not a single fix.
- next: /iterate

### [1.6] Mobile accessibility gaps
- category: a11y
- impact: 4
- ease: 4
- detail: focus management + a11y labels surfaced repeatedly in
  prior critique. Ongoing drain.
- next: /iterate

### [1.5] Unbounded keepsake/death flag growth on long saves
- category: debt
- impact: 3
- ease: 5
- detail: `night-keepsake:`, `hazard-scar:`, `hazard-death:`,
  `gleaning-token-banked:` accumulate with no consumer/cap. A
  long-save soak test could trip on this.
- next: /iterate

### [1.5] `HazardBoard.tsx` file-length outlier (~815 lines)
- category: debt
- impact: 3
- ease: 5
- detail: extraction candidate; several other mobile files are
  length outliers. Extract sub-components with their own tests.
- next: /iterate

### [2.1] Two agent-e2e walkthroughs describe a deleted engine surface
- category: gap
- impact: 3
- ease: 7
- detail: spotted 2026-07-10 during the `/consolidate` terminology
  sweep design (phase 25). `axiomancer-mechanics/automation/scripts/
  walkthroughs/skill-learning.goal.md` names
  `learnSkill(character, skillId)` from `src/Skills/skill.engine.ts`;
  `tier2-skill-chain.goal.md` narrates `executeSkill`/`basePower` in
  the same retired vocabulary (`base-power` and `src-skills-path` are
  both live `lexicon.json` rows for exactly this concept). Neither
  `src/Skills/` nor `learnSkill` exist in `axiomancer-mechanics/src`
  today. Both files sit in `automation/`, a lexicon-exempt
  dated-record zone, so `check-lexicon` never sees them, and their
  paired `.json` scripts may already be dead too (`node
  automation/agent-e2e.mjs skill-learning` / `tier2-skill-chain`
  would confirm). Left un-deleted per the janitor mandate's
  suspected-dead-file rule — the automation/README.md inventory
  table and the harness owner should confirm dead-vs-superseded
  before removal.
- next: /iterate

### [2.4] Phase-mirror issue close is unreliable — 9 shipped phases still show open, and even a present trailer once failed
- category: gap
- impact: 4
- ease: 5
- detail: `skills/ship-a-phase.md` Step 10 says the shipping commit
  should add a `Closes #<phase-issue-number>` trailer so GitHub
  auto-closes the phase mirror opened in Step 2.5. Checked every
  `plan: phase N shipped` commit for single-part phases 1, 3, 5, 12,
  16, 22, 24, 26, 30 (`4b9e30f3`, `f2d59a13`, `b1cd4278`, `b778a0c3`,
  `8f49f612`, `9e7d17c6`, `06c54466`, `83fec94f`, `bf48c6c8`) — none
  contain a `Closes` trailer, and issues #22, #25, #36, #47, #54,
  #52, #65, #69, #74 are still open on GitHub, ~21 other phases'
  mirrors (2, 4, 6, 7, 8, 9, 10, 11, 14, 15, 17-21, 23, 25, 27-29, 31)
  closed cleanly, so this isn't a universal failure — it's roughly a
  coin flip across the project's history, not obviously correlated
  with phase order or single- vs multi-part. Odder still: Phase 32
  Part 1's commit (`7392573c`) DOES contain `Closes #83`, yet issue
  #83's GitHub timeline shows zero close/comment events since
  creation (2026-07-13T15:26) — the trailer was present and still
  didn't fire, which contradicts a "missing trailer" theory as the
  sole cause. Net effect: the phase-mirror issue list silently
  degrades from "what's in flight" to "some unpredictable mix of
  in-flight and long-done," which is exactly the signal `/digest`'s
  pulse gather and `/oversight` read.
- next: /iterate (root-cause why the `Closes #N` keyword sometimes
  no-ops on a direct push to `main` — compare a known-good case
  like #82/Phase 31 against #83/Phase 32 part 1 commit-by-commit;
  once understood, sweep-close the 9 confirmed-stale issues by hand)

## Done

### [x] [3.2] `CardSpecialMechanic` deprecated-name not exported — stale/resolved
- drained 2026-07-14 via scheduled oversight: current `main` exports
  `CardSpecialMechanic` from both `axiomancer-mechanics/src/Cards/index.ts`
  and the package barrel `axiomancer-mechanics/src/index.ts`. The root
  three-workspace `npm run verify` gate passed at `96421aa8`, confirming
  the preferred import is live for package consumers.

### fishing-village CLI + spec08 e2e drive legacy combat
- drained 2026-07-03 (monorepo cleanup): stale — the legacy
  `resolveCombatRound` no longer exists anywhere in
  `axiomancer-mechanics/src`; no fv-15/spec08 script remains in
  package.json. The finding predated the resolver removal.

### Hazard v2 engine ownership (DIV-MECH-002)
- resolved via `/oversight` 2026-07-03: mechanics absorbs
  mobile's duplicate `state/hazard/` engine. Promoted to
  `plan/PHASE_CANDIDATES.md` -> build plan Phase 13.

### [2.0] `combatMana` slice deprecated but still load-bearing
- drained 2026-07-08 (build-plan Phase 7): stale — the slice was
  actually retired by mobile commit `6ef5f989` (2026-06-20,
  "remove the vestigial client mana model") and its container
  (`state.combat`) fully removed by `160ae907`/mechanics `4cb504a5`
  (2026-06-30/07-01). "Phase 156" was never the migration (that
  number is the unrelated status-effect interaction engine); the
  audit row was carried into the monorepo re-onboard without being
  re-validated against code that had already changed nine days
  earlier. No live `combatMana` reference remained; Phase 7 deleted
  the one dead type (`CombatManaState`) and fixed four stale
  comments still narrating the retired slice.
