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

### [user-issue #129] [HIGH] Log T's provenance for every Hermes-originated queue change
- category: external-issue
- impact: 6
- ease: 6
- detail: filed 2026-07-19 by the owner via Hermes. T asked that any time
  the plan queue changes, a log records that T asked for it and why (when
  given). Requirement: an append-only "Queue change log" section in
  `plan/steps/01_build_plan.md` (or another always-read planning surface,
  linked from the build plan) recording, per Hermes-originated mutation of
  the queue (add/remove/reorder/reprioritize/split/merge/skip/block/
  unblock/material scope change): date, actor (`T via Hermes`), exact
  action + affected phase IDs, that T requested it, T's stated reason (or
  `reason not stated` — never invent one), and the resulting commit/issue/
  phase brief when available. Repo-local planning/oversight instructions
  (bearings.md and/or the relevant skill, e.g. oversight.md) must require
  this entry land in the SAME commit as each Hermes-originated queue
  mutation going forward. Do NOT rewrite existing queue history as
  reconstruction — this is a forward-looking log, starting now.
- next: /iterate will pick up; reference #129 in commit body.

### hazard/gathering "paradox-token" reward vocabulary outlives the card category
- category: divergence
- impact: 2
- ease: 4
- detail: filed 2026-07-18 (phase 37 planning residue). Phase 37 retires
  the `fallacy`/`paradox` card **category** + the dead `combatResources`
  token pool, but deliberately leaves the separate hazard/gathering
  **reward** system that still speaks "paradox": `HAZARD_TOKEN_FLAG_PREFIX`
  = `'hazard-token-banked:'` + the `token` reward doc'd as banking a
  "paradox-token flag" (`axiomancer-mobile/state/hazard/store-actions.ts`
  ~L76-77/L484, `state/gathering/store-actions.ts` ~L64/L269), and the
  reward-blurb strings "+N paradox token(s)"
  (`state/presenters/hazard.engine.ts` ~L369, `gathering.engine.ts` ~L241,
  `components/hazard/glyphs.tsx` case `'paradox'`). These are a live reward
  token, NOT the removed card category — but once phase 37 lands, "paradox"
  survives ONLY as this reward vocabulary, which will read as an orphaned
  reference to a concept the game no longer has. needs-user-call: rename the
  reward token (to what?) vs. remove it vs. leave it. Do NOT bundle into
  phase 37 (owner scoped it out). Re-grep before acting; distinguish from the
  `arrow-paradox` card id (unrelated) and `Item.category` (unrelated).
- next: /oversight (owner call on rename-vs-remove-vs-keep) → then /iterate
  or a small phase to execute the chosen verb

### `deploy:check` is unusable from remote web sessions — 401 "Token rejected"
- category: debt
- impact: 4
- ease: 5
- detail: filed 2026-07-18 (oversight session residue). Running
  `npm run deploy:check` from a Claude Code web session fails with
  `GitHub Actions API error: 401 Unauthorized / Token rejected` — the
  script needs the repo-scoped `GH_TOKEN` from `.env`, which is
  gitignored and absent in remote containers. The session fell back to
  the GitHub MCP Actions API (which authenticates fine) to confirm
  CI-green, but nothing records that fallback, so every skill step that
  says "run `npm run deploy:check`" (oversight §7, ship-a-phase §10,
  bearings' deploy gate) silently dead-ends in web sessions. Fix
  options: teach `scripts/deploy-check.mjs` to fall back to a
  `GITHUB_TOKEN`-style env var when `GH_TOKEN` is absent, and/or state
  the MCP fallback in bearings' deploy-gate section so remote sessions
  know the sanctioned path.
- next: /iterate (deploy-check.mjs env fallback + a bearings note)

### `skills/oversight.md` assumes direct push to `main` — web sessions must ship via branch + PR
- category: docs
- impact: 2
- ease: 8
- detail: filed 2026-07-18 (oversight session residue). §6 of the skill
  commits and pushes `origin main`, but attended oversight from a
  Claude Code web session runs under a mandated `claude/*` branch and
  cannot push `main` directly — the 2026-07-18 session shipped its
  adjustment set as PR #121, which the owner merged in-session
  (rebase, commit landed verbatim). That worked, but the skill doesn't
  describe it: add a short "remote-session delivery" note to §6 (branch
  + ready-for-review PR + owner merge; rebase-merge preferred so the
  audit-trail commit lands intact) so future web oversights don't stall
  at the push step or improvise.
- next: /iterate (doc-only edit to skills/oversight.md §6)

### Gate the first-map blacksmith MapEvent node back to dev-only
- category: content
- impact: 4
- ease: 7
- detail: filed via /oversight 2026-07-18. Owner ruled the blacksmith is
  NOT the confirmed dice-upgrade surface (see the resolved
  `[needs-user-call]` row below): the screen stays dev-menu-only until
  the re-home design thread (PHASE_CANDIDATES: "Re-home dice upgrades
  off the blacksmith") lands. The D6c ship placed 1 MapEvent node on the
  first map + a Dev-menu entry; the map node must come back out (or be
  dev-flag-gated) so players don't meet a surface the design has
  disowned. Engine (D5 economy) and the screen itself are untouched.
- next: /iterate (remove or dev-gate the first-map blacksmith MapEvent
  node; keep the Dev-menu entry)

### Ratify `SPECIAL_FIRES_ON_USE` — drop the PROVISIONAL marker
- category: docs
- impact: 2
- ease: 9
- detail: filed via /oversight 2026-07-18. Owner confirmed KEEP
  fires-on-use (D7 evidence: 97% spend-rate, within ~3% of
  fires-on-roll's payout; use-trigger rewards deliberate play and keeps
  a banked Reserve special meaningful). The PROVISIONAL wording on the
  constant/comments in `combat.upgradeable-dice.ts` (and any spec 33 §6
  PROVISIONAL marker) should now read ratified — comment/doc change
  only, no behavior change.
- next: /iterate

### Doctrine-curve confirmation (digest 2026-07-18, reduced-nightly): mid/late collapse persists unchanged despite two days of engine work
- category: content
- impact: 7
- ease: 3
- detail: `/digest`'s reduced-nightly re-measure at `31f62c1e` (blind
  policy-pick, doctrine early ~80 / mid ~50 / late 25-35 / impossible 0):
  early 84.4% (in band), **mid 7.3%** (was 8.7% at the last digest's
  `bf0d3712` measurement — still far under ~50%), **late 0%** (was
  0.14% — still far under 25-35%), impossible 0% (in band, unchanged).
  Phase 33b (enemy archetypes + variable-rung telegraphs) and the whole
  D1-D6e Upgradeable-Dice rework landed on top of the last measurement
  and moved the curve by noise only — neither targeted the collapse
  directly. The CRITIQUE.md `[HIGH] phase 31-32's effect on the doctrine
  curve is unmeasured` row's framing is now stale (it *is* measured,
  repeatedly, and the answer is "no better"); the finding itself stands.
  Phase D7 ("Tuning, ratification + honest re-baseline") is the queued
  phase already scoped to read this curve against the win-curve
  ratification — this row is the evidence trail for that read, not a
  new ask.
- next: /iterate to refresh the CRITIQUE.md HIGH row's wording (measured,
  still failing — not unmeasured). Owner call (/oversight 2026-07-18): no
  dedicated collapse phase yet — let the spec-33 finale land first (Phase
  D-FLIP + D8 put the F3 sink and valves in play), re-measure the curve,
  and mint a dedicated phase only if the collapse survives a healthy
  flag-on economy.

### [x] Authored per-phase / boss stance-check variety — PROMOTED to Phase D9 via /oversight 2026-07-18
- category: mechanics
- impact: 4
- ease: 6
- resolution: owner call 2026-07-18 — queued as build-plan Phase D9
  (after D8): salvage PR #109's pipeline threading + 22 thematic checks
  as an ADDITIVE layer over the D6e backfill (authored check wins,
  absent → default). Detail below preserved as the phase's source.
- detail: filed 2026-07-18 as D6e residue. The shipped D6e (`0b29ff42`)
  drains D3-F2 with a UNIFORM `defaultStanceCheck(enemyStance)` backfilled at
  `getThreatSequence` on every RESOLVED phase (punishes own stance / yields
  chain-successor) — good coverage, yield 0.329◆/round. But it backfills at the
  resolved-phase level and does NOT thread a hand-authored `stanceCheck` from
  `AuthoredThreatPhase` through `resolveAuthored` — so per-phase or per-boss
  authored checks can't stick, and the spec 33 §2 authoring law's "bosses may
  check two stances / not-X" variety is unreachable. The shipped D6e commit
  flags this itself as a §2 follow-up. A reference implementation already
  exists on the closed PR #109 branch
  (`origin/claude/march-push-main-tcjk0j`): `stanceCheck?` threaded onto
  `AuthoredThreatPhase` + `CombatThreatBranchOutcome`, copied through
  `resolveAuthored` / `resolveBranchOutcome` / `commitThreatBranch`, plus 22
  hand-authored thematic checks across 14 enemies (bosses naming two stances)
  and an e2e guard. Rework it as an ADDITIVE layer OVER the backfill (authored
  check wins; absent → default), NOT a replacement. D7 tunes yield density/
  payout — land this before or alongside D7 so boss variety is in the ratified
  read, or explicitly after if D7 prefers the uniform baseline.
- next: /oversight or a dedicated follow-up phase (salvage PR #109's pipeline
  threading + thematic content as an additive layer over the D6e backfill)

### GLYPHS (Phase 33d) has no formal spec — design lives only in a braindump
- category: docs
- impact: 3
- ease: 5
- detail: filed 2026-07-18 during the queue audit. 33d (GLYPHS pilot,
  "Option-B grammar experiment") is the only queued phase not governed by a
  formal spec: its design lives in braindump
  `axiomancer-mechanics/braindump/2026-07-13-enchant-curse-spell-grammar.md`,
  and it only borrows spec 33 §3 rule 5 (FREE-charge / momentum) for
  compatibility. Every other pending phase (33c + the D-batch) is under spec
  33. 33d is now confirmed LAST in the queue, so this is not urgent — but a
  pilot that graduates should be written up as a proper spec (or at minimum a
  decisive 33d brief scoped from the braindump) BEFORE engine work, per the
  plan-a-phase order-of-authority (spec > bearings > phase call).
- next: /plan-a-phase 33d (or write a GLYPHS spec) at pickup — do not start
  33d engine work against a braindump alone

### [x] `[needs-user-call]` FORGE identity — RESOLVED via /oversight 2026-07-18: amplifier enchants confirmed
- category: design
- impact: 4
- ease: 2
- resolution: owner's own words — "FORGE has enchantments that provide a
  benefit to the 'special' effect" — which IS the shipped
  amplifier-enchant model (spec 33 §6, `forge-masters-stamp`). The
  braindump's "in-combat temporary face upgrades" wording is superseded;
  no spec amendment, no card follow-up. Shipped identity stands.
- detail: filed 2026-07-18 (owner drift-check session on the D-batch). The
  braindump (`braindump/2026-07-17-upgradeable-dice-combat.md` decision 7)
  records an owner addition: *"in-combat temporary face upgrades are part of
  the FORGE preset's identity."* At D1 this became **special-amplifier
  enchantments** instead (spec 33 §6, marked `[owner, D1]`; D4 shipped
  `forge-masters-stamp` on that model) and the face-swap economy was retired
  into die gear. So the change WAS owner-decided, but the braindump wording
  and the shipped model diverge — if the owner's mental model is still "Forge
  temporarily upgrades faces mid-combat," the shipped identity is "Forge
  amplifies fired-special payloads." Surfaced in the 2026-07-18 drift check;
  owner asked for it to be filed, has not yet confirmed either way. Wants an
  answer BEFORE D7 ratifies the economy (amplifier enchant pricing + FORGE
  preset identity are inputs to the win-curve read).
- next: /oversight (owner confirms amplifier-enchant identity, or reopens
  in-combat temp face upgrades as a FORGE mechanic — which would be a spec 33
  §6 amendment + D4-era card follow-up, routed via /deck-tuning)

### [x] `[needs-user-call]` Blacksmith cadence + dice-upgrade-site identity — RESOLVED via /oversight 2026-07-18: wrong surface, rethink
- category: content
- impact: 5
- ease: 3
- resolution: owner call 2026-07-18 — the blacksmith is NOT confirmed as
  the dice-upgrade surface. Keep the D5 HONE/TEMPER economy (engine
  untouched); the player-facing affordance gets re-homed (candidates:
  rest site, relic, event — design thread filed to PHASE_CANDIDATES as
  "Re-home dice upgrades off the blacksmith"). Meanwhile the blacksmith
  screen is dev-menu-only: the first-map MapEvent node gets gated back
  to dev (new AUDIT row below routes it to /iterate). Cadence question
  dissolves into the re-home design session. Blacksmith prices stay
  placeholder until the new surface + souls-economy pass.
- detail: filed via /oversight 2026-07-18 alongside the D6c placement call.
  The owner green-lit shipping the blacksmith reachably — 1 MapEvent node on
  the first map + a Dev-menu entry (see Phase D6c row) — but explicitly kept
  TWO design questions OPEN: (1) *when* in the run the player first meets the
  blacksmith (map cadence — one-and-done first-map node, recurring, gated on
  progress?), and (2) *whether the blacksmith is even the right surface for
  dice upgrades at all*, vs. some other affordance. D5's dieGear rail + HONE/
  TEMPER economy are built and the D6c screen will render them, so this is
  not blocking — but D7 tunes the die-gear economy against WHATEVER cadence
  ships, so the cadence/identity call wants an owner answer before D7's
  ratification, not after. Do NOT guess: this is map/design content the loop
  routed around by owner instruction.
- next: /oversight (owner decides cadence + whether blacksmith owns dice
  upgrades; then fold into D6c/D7 scope or re-route to another surface)

### Retire two stale worktrees fully landed on `main` (dice + price-experiment)
- category: debt
- impact: 3
- ease: 9
- detail: filed 2026-07-17 (Upgradeable-Dice reframe chat close-out). Two
  `.claude/worktrees/*` checkouts now have all their unique work on `main`,
  so they only add clutter + collision-discipline confusion:
  (1) `card-text-paid-effects-3cd590` on branch
  `claude/combat-dice-mechanics-3e92fd` — the spec 33 Upgradeable-Dice
  reframe + D1 promotion (`28707b87`) and the persistence-pointer fix
  (`76275289`) are both on `main`, reconciled by merge `3e688ed2` (verified
  dup-free: one Combat-rework section, one D1 row, 36b still `[x]`), so the
  branch is fully represented and safe to retire. Note the worktree NAME
  ("card-text-paid-effects") does not match its branch
  (combat-dice-mechanics) — confirm no orphaned "card text paid effects"
  scope was dropped before removing. (2)
  `price-experiment-analysis-df8297` on branch
  `claude/price-experiment-analysis-df8297` at `d8c04c71`, an ancestor of
  `main` — nothing unique left. Fix: `git worktree remove` both, then
  `git branch -d` the two branches once confirmed. Related: the TS5095
  worktree-verify row below (fewer live worktrees shrinks that surface).

### Worktree sessions resolve the wrong TypeScript — mechanics verify gate fails with TS5095
- category: debt
- impact: 4
- ease: 7
- detail: surfaced 2026-07-17 during the starter-deck-presets rename.
  `npm run verify` in `axiomancer-mechanics` fails from any
  `.claude/worktrees/*` checkout with `TS5095: Option 'bundler' can
  only be used when 'module' is set to 'preserve' or es2015+`. Root
  cause: the mechanics tsconfig (module `commonjs` +
  moduleResolution `bundler`) is accepted by TypeScript 6.0.3
  (installed at `axiomancer-mechanics/node_modules`) but rejected by
  5.9.3 (repo-root `node_modules`); worktrees have no local install,
  so Node walks up past the worktree into the root and picks 5.9.3.
  Every worktree session must hand-invoke the 6.0.3 `tsc.js` to run
  the gate. Fix options: align the root TypeScript devDependency to
  6.x, make the tsconfig valid under both (e.g. module `preserve` or
  moduleResolution `node`), or install per-worktree. A task chip was
  also filed from the session.

### deploy-check reports a `cancelled` CI run as red — false-red during concurrent-push collisions
- category: debt
- impact: 5
- ease: 6
- detail: surfaced 2026-07-17 during the Phase 36a march tick. A
  concurrent "file the residue" session pushed several commits onto
  `main` while 36a's `verify-mobile` was mid-run; GitHub's concurrency
  group cancelled each prior commit's long `e2e-minigames` playwright job
  (`cancel-in-progress`). `scripts/deploy-check.mjs` maps that
  `conclusion: cancelled` to **"DEPLOY FAILED (CI red)"** and exit 1,
  identical to a real failure — even though every FAST job
  (detect-scope, smoke-bundler, lint+typecheck+jest) succeeded and only
  the superseded e2e was cut off. This produced two false-reds in one
  tick and, under a stricter reading of ship-a-phase §10, could have
  triggered a wrongful stop on green code. Fix: treat a `cancelled`
  verify-* run distinctly from `failure` — when the cancel is a
  concurrency supersession (a newer commit for the same ref exists),
  re-poll the newer HEAD or report exit 2 (timeout/retry) rather than
  exit 1 (red). Belt-and-suspenders: only count runs whose head_sha ==
  the checked HEAD. Harness/script only.
- next: /iterate (deploy-check.mjs: distinguish cancelled-by-supersession
  from failed; prefer the newest same-ref run)

### `circular-reasoning` sits at exactly the uncommon pricing-lint floor (4.50)
- category: tests
- impact: 2
- ease: 8
- detail: surfaced 2026-07-17 by the Phase 36a mechanics-expert pricing
  pass. `circular-reasoning` scores exactly 4.50 — the uncommon band
  floor in `pricing.engine.test.ts` (`RANK_BANDS.uncommon = [4.5, 13]`)
  — so it is one rounding hair from a red lint. It was NOT a 36a mover
  (its "premise" lives in flavor text, no scored mechanic), so 36a's
  SWAY/concede changes did not touch it, but any future Premise-currency
  reprice or rider tweak that shaves a fraction off it flips the lint red
  with no real design change. Low-urgency tripwire: either give the card
  a hair more printed value (design call → `/deck-tuning`) or widen the
  uncommon floor a touch (lint call). Note for whoever next touches
  Premise pricing.
- next: /iterate or /deck-tuning (nudge the card value or the band floor)

### Playtest harness has no victory-only rounds-to-victory metric
- category: gap
- impact: 4
- ease: 7
- detail: surfaced 2026-07-17 by the ultracode price-vs-win-rate
  playtest. `CombatSimStats.avgRounds`
  (src/Combat/combat.encounter.sim.ts) averages `state.round` over ALL
  outcomes (defeats + retreats included), so there is no way to answer
  "how many rounds to WIN" — the owner asked exactly that and it forced
  a bespoke harness
  (axiomancer-mechanics/scratch/price-experiment/price-winrate.harness.ts)
  that re-derives it from per-run `runOneEncounter` returns. The raw
  `rounds`+`outcome` already exist per run; they are just discarded at
  aggregation. Add `avgRoundsToVictory` (victory-only, null when ~0
  victories) to `CombatSimStats` + the stage summary so kill-speed is a
  first-class witness for /deck-tuning. Related: the "Doctrine-curve
  check in the nightly baseline" candidate (PHASE_CANDIDATES.md) would
  absorb this harness's per-stage cells — this is the engine-side metric
  that check depends on. (The other residue of this session — the
  mid-collapse quartet foundry/standstill/grace/augury ≈0% mid, and the
  tempo/alt-win pricing conclusions — is already tracked there and in
  Phases 36a/36b, so it is not re-filed here.)
- next: /iterate (retain victory-only rounds in
  simulateHazardPatternCombatDetailed; surface in PlaytestStageSummary +
  the report formatter)

### [3.5] `critique:drive` combat capture stops at the pre-fight preview — in-combat card-face rows can't be re-validated unattended
- category: gap
- impact: 5
- ease: 7
- detail: the Phase 34 transport
  (`axiomancer-mobile/scripts/critique-drive.mjs`) navigates
  `/combat-encounter` and dismisses the tutorial primer, but never
  presses **ENTER COMBAT** (`combat-enter`), so it captures only the
  pre-fight reveal/preview, not the live board with the card hand.
  Critique pass 13 (2026-07-17, commit b4870384) hit exactly this
  wall: it could reconfirm the exploration-hub findings (MORALE
  "v of x", title wordmark crop) but **could not re-validate** the two
  remaining STALE-flagged card-face rows — VITAE-vs-HP copy and DoT
  round-clock math — because they only render once combat is entered
  and cards are in hand. The fix is a known pattern: mirror
  `combat-encounter-e2e.mjs` (`combat-enter` click → re-kill primer →
  wait for `combat-board` → capture the board + hand) as an extra
  captured state on the combat screen, so the unattended re-baseline
  reaches in-combat surfaces. Secondary (lower value): state-gated
  screens pushed by `<EventGate>` (`/village`, `/dialogue`,
  `/cutscene`) are still uncapturable by direct nav — reaching them
  needs a debug event-seed hook; leave to interactive/playtester
  critique unless the card-face gap recurs for those surfaces too.
- next: /iterate

### Combat deck-matrix baseline stale by 33 mechanics-source commits
- category: gap
- impact: 6
- ease: 6
- detail: surfaced 2026-07-17 by the new session-start hook — the
  baseline was measured 2026-07-12 (merge f325c423 + 953de92e) and 33
  mechanics-source commits have landed since (incl. the card PAID-prose
  work). Any balance/engagement answer citing it describes a 5-day-old
  engine. Note the interaction with the parked "Metric v2" row above:
  regenerating restores freshness but the metric's known blind spots
  still apply — regen is hygiene, not a green light for new tuning
  conclusions.
- next: /iterate (npm run baseline:regen, or the digest's reduced
  nightly pass)

### theme-switch-e2e.mjs uses URL.pathname — broken paths on Windows
- category: debt
- impact: 3
- ease: 9
- detail: axiomancer-mobile/scripts/theme-switch-e2e.mjs:13,20 builds
  DIST and cwd via `new URL(..., import.meta.url).pathname`, which
  yields `/C:/...` on Windows — fs/spawn calls get a bad path, so the
  script only works in CI (Linux). Same bug class was found and fixed
  2026-07-17 in both game-knowledge-base generators (their isMain
  check silently never matched locally); fix is `fileURLToPath`.
  Grep found no other live occurrences in this repo.
- next: /iterate

### Telemetry attribution is best-effort; CI logging path unverified
- category: debt
- impact: 3
- ease: 4
- detail: TELEMETRY.md (shipped 2026-07-17, commit 03969cea) scrapes
  model and main-vs-subagent from the transcript tail because hooks
  don't expose either directly — expect `unknown` cells and possible
  misattribution near sidechain boundaries; a call racing a sidechain
  boundary can be attributed to the wrong side. Also unverified: in
  cloud ticks, skills arrive as '/command' prompts and should land as
  slash-prompt rows via UserPromptSubmit — confirm rows appear (and
  ride the tick's commit) after the first few cloud runs. If the
  harness later exposes agent id / model in hook input, replace the
  transcript-tail scrape in .claude/hooks/telemetry.mjs.
- next: /iterate (verify after next cloud tick; upgrade when harness
  allows)

### kb-query MCP could surface kb/ sync age
- category: gap
- impact: 2
- ease: 8
- detail: kb-sync.mjs now stamps kb/.sync-meta.json (2026-07-17) and
  the session-start hook reports age, but design sessions that go
  straight to the kb-query MCP server / skill never see it. Adding the
  stamp's age to kb_overview output (and a staleness warning >14d)
  would put corpus freshness in front of the consumer that actually
  cites it.
- next: /iterate

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

### [x] Hermes-decided work is invisible to the loop — RESOLVED via /oversight 2026-07-18: convention adopted
- category: divergence
- impact: 6
- ease: 8
- resolution: owner adopted the convention 2026-07-18 — every
  Hermes-decided work item lands as a GitHub issue (or build-plan phase
  row) before or alongside its code change, so both brains drain one
  queue via `/triage`. Recorded in `plan/bearings.md` § "Decisions
  standing for the autonomous loop". (Heading restored here — this row
  had lost its `###` line in an earlier merge.)
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
