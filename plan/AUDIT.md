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

### [tests] The verify gate is blind to the Playwright journeys, and a real regression proved it
- category: tests
- impact: 7
- ease: 5
- detail: filed 2026-08-09 (first-map audit follow-up, offered to T at the
  close of PR #186 and accepted). `npm run verify` is lint + typecheck +
  jest/vitest in every workspace — the eight `e2e:*` journeys
  (`hazard`, `combat`, `gathering`, `encounters`, `theme`, `loot`,
  `exploration-roundtrip`, `upgradeable-dice`) are **not** in any verify
  script. They exist only as separate steps inside `verify-mechanics.yml`
  and `verify-mobile.yml`, so they run in CI and nowhere else. This is not
  theoretical: PR #186 shipped a start-node arrival guard that passed a
  clean three-workspace local verify and then failed
  `encounter-routing-e2e` in CI ("treasure did not route to /cache —
  landed on /cutscene"). The bug was real, the gate that was supposed to
  be the pre-flight check could not see it, and the loop's doctrine
  ("foreground verify gate, never backgrounded") bought nothing because
  the gate does not contain the test that fails.
- the general defect: `plan/bearings.md` § "Verify gate" presents
  `npm run verify` as THE pre-commit gate, and every shipping skill cites
  it as such. The journeys are the only coverage for cross-slice routing —
  exactly the class of bug unit tests structurally cannot catch, since each
  minigame slice passes its own tests in isolation while the router picks
  the wrong one. An unattended `/march` tick that runs verify, sees green,
  and pushes is shipping unverified routing on every tick.
- next: /iterate. The journeys are runnable locally today — they need
  `*_E2E_CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`
  because the repo's pinned Playwright expects a headless-shell build this
  container lacks. Decide whether they join `verify` outright (slow but
  honest), become a `verify:journeys` leg the shipping skills must run
  when they touch routing or a store slice, or stay CI-only with bearings
  amended to stop calling verify a sufficient pre-flight. Any of the three
  beats the current state, where the doc and the gate disagree.

### [divergence] Bearings says there is no hosted web surface; Cloudflare Pages has been publishing one
- category: divergence
- impact: 6
- ease: 6
- detail: filed 2026-08-09 (first-map audit follow-up, offered to T at the
  close of PR #186 and accepted). `plan/bearings.md` L35-37 states, as a
  standing decision, "**No hosted web surface.** The product ships as a
  mobile app via manual EAS builds; `main` does not auto-deploy," and
  § Surface reinforces it: "This is not a website... an expo-web build used
  only for dev/e2e/playtesting." Observed during PR #186: Cloudflare Pages
  publishes a preview per branch. The repo already knows this in one
  place — `.github/workflows/build-devlog.yml` L6 commits generated DevLog
  HTML to `main` explicitly "so the existing Cloudflare Pages integration
  can serve them" — so the integration is not a surprise to the tooling,
  only to the doctrine file every skill reads first.
- why this matters beyond bookkeeping: the "no hosted surface" premise is
  load-bearing in at least two places. `/critique` and the `reader`
  subagent are built to visit a live site as a stranger; a doctrine that
  says no such site exists tells them there is nothing to visit. And the
  `[needs-user-call]` product-name row above weighs "Axiomancer" under a
  whole-product pivot — a decision that reads differently if branch
  previews are already public URLs versus if nothing is published at all.
- `[needs-user-call]` on which way to reconcile: whether the previews are
  intended (bearings should describe them, name the URL shape, and say
  what is safe to publish there) or incidental (the Pages integration
  should be scoped or turned off). Do not "fix" this by editing bearings
  to match observed reality — the sentence is a standing decision, and
  only T can restate it. What /iterate CAN do without a ruling is confirm
  the current publish scope: which branches build, what the URLs are, and
  whether anything unintended (the private DevLog among them) is reachable
  without auth.

### [contract] `exploration-combat-roundtrip-e2e` regression: FLEE leaves the tab bar hidden
- category: contract
- impact: 8
- ease: 5
- detail: filed 2026-08-09 (digest, nightly `e2e:minigames` breadth check).
  `scripts/exploration-combat-roundtrip-e2e.mjs` — the browser-driven guard
  for the "FIGHT-modal-unmount class" (Phase 10) — now fails at its FLEE
  step: `FAIL — tab bar (Character tab) still hidden after FLEE closed the
  modal`. The modal itself closes correctly (`encounter-modal-fight` goes
  hidden); only the tab-bar unlock is stuck, i.e. the exact
  `inEncounterModal`/tab-bar desync class this script exists to catch.
  Reproduced locally (`npm --workspace axiomancer-mobile run e2e:minigames`),
  not a CI-only flake — the other four legs (hazard, combat, gathering,
  encounter-routing) all passed clean first.
- likely mechanism (code-read, not yet instrumented): the script arms the
  encounter modal via the `debug-trigger-encounter-encounter` dev button,
  which routes to `/exploration` and fires the combat-prelude directly —
  the player never actually "moves" off the map's starting node, so
  `state.world.currentMap.consumedNodes` never gains that node and
  `selectExplorationViewModel`'s `startNodePending` stays true
  (`axiomancer-mobile/state/presenters/exploration.engine.ts:440-443`).
  `61ea5513` (First-map audit, #186, 2026-08-08) added a new effect at
  `axiomancer-mobile/app/(tabs)/exploration/index.tsx:101-108` that fires
  `actions.resolveCurrentMapEvent()` on a deferred `setTimeout(0)` whenever
  `startNodePending` is true and nothing else is busy. FLEE
  (`onEncounterFlee` -> `pickEventChoice('flee')`) clears `state.event` and
  should let the existing close-effect (lines 146-150, Phase 118 /
  issue #191) drop `inEncounterModal`, unhiding the tab bar — but on the
  very next tick the new start-node effect can see an idle app
  (`!anySession && !inEncounterModal`) and re-fire
  `resolveCurrentMapEvent()`, re-opening the start node's authored event
  and re-arming the modal before the tab bar ever unhides. This would only
  bite the dev-trigger entry path (and any real path that flees before
  ever leaving the start node) — not confirmed with a debugger/log
  instrumentation, but it lines up commit-for-commit with the only
  relevant change since this script last passed.
- next: instrument (a console log on `resolveCurrentMapEvent` calls, or a
  breakpoint) to confirm the double-fire, then either gate the start-node
  effect on `lastOutcome === null` the same way the close-effect already
  gates on it, or have `onEncounterFlee`/FLEE mark the start node consumed
  the way a real move does. Verify with
  `ROUNDTRIP_E2E_REUSE_EXPORT=1 node scripts/exploration-combat-roundtrip-e2e.mjs`
  plus a full `npm --workspace axiomancer-mobile run e2e:minigames`.

### [gap] `march` ticks are creeping toward the 90-minute job timeout; one was killed mid-cycle
- category: gap
- impact: 6
- ease: 5
- detail: filed 2026-08-09 (digest pulse). Run `31301228665` (started
  07:28:30, triggered by the scheduled `march` workflow) hit
  `.github/workflows/march.yml`'s `timeout_minutes: 90` exactly
  (`1:30:18` wall clock) and was force-cancelled by the runner, surfacing
  as `conclusion: cancelled` rather than `success` in `gh run list`. The
  job log shows it had already committed and pushed both phase 44b halves
  cleanly (`04c75d22` feature, `f96f0584` DoD tick, landed at 08:52:30 and
  08:52:43) — no corruption, nothing half-committed — but the run kept
  going for another ~6 minutes past that push before the timeout killed
  it, and whatever work was in flight in that window (most likely starting
  the next phase) is gone with no trace, same as the already-filed
  "loop turns that end while CI is amber leave post-green work undone"
  class in `plan/PHASE_CANDIDATES.md`, but here the cause is the job
  ceiling itself rather than a CI wait. This is the first confirmed
  timeout-kill; the prior run (`2026-08-08T07:26:19Z`) already ran
  `1:26:24` — 4 minutes under the ceiling — so this reads as a trend
  (ticks that chain two full phases, like 44a+44b did here, run long
  enough to threaten the ceiling) rather than a one-off.
- next: a phase-candidate, not a direct edit to `march.yml` — see
  `plan/PHASE_CANDIDATES.md`'s new "march tick timeout" row for the
  proposal. This row is the evidence; the proposal is not this loop's to
  apply directly.

### [docs] `skills/digest.md` §3b still reads baseline health against the win-rate doctrine curve Phase 43 retired
- category: docs
- impact: 5
- ease: 8
- detail: filed 2026-08-09 (digest). §3b instructs: "READ the new numbers
  against the locked doctrine curve (early ~80 / mid ~50 / late 25-35 /
  impossible 0, blind policy-pick): each band that moved gets a line in
  the Tuning proposals panel, and a doctrine violation ... gets a
  `plan/AUDIT.md` row." `46b5a5df` (phase 43, "objective function v2 — the
  Combat Quality Index", 2026-08-08) retired win rate as a grading term
  outright — "Win rate is not a term at all: the doctrine curve grades
  WHETHER a deck should win, CQI grades HOW the fight played, and a 0%-win
  cell scoring well is pinned as correct" — and the already-filed
  `plan/AUDIT.md` row "`/deck-tuning` and `/combat-playtest` still name
  `statusEngagement` as the objective function" flags the identical drift
  in those two skills. `skills/digest.md` was outside phase 43's file
  ownership (same as those two) and has the same problem: followed
  literally tonight, §3b would have filed a doctrine-violation row against
  early 54.5% / mid 8.3% / late 0% / impossible 0% — a live reading of a
  retired law. This digest read `combatQuality.index` instead (see the
  now-resolved CQI-baseline row above) and skipped the win-rate violation
  filing on that basis, but the skill text itself still says otherwise for
  next time.
- next: repoint §3b at `combatQuality.index` (spine/arc/width/identity
  weights, 0.40/0.25/0.20/0.15) once spec 35 or Phase 43's follow-up
  defines what "moved" or "violates" means for CQI — there is no CQI band
  yet to grade against, only the first stamped reading, so this may need a
  design ruling (what CQI range is "good") before the skill text can be
  rewritten, not just a search-and-replace of the metric name.

### [docs] Phase 44a deferred its `lexicon.json` registrations to the phases that actually rename each concept
- category: docs
- impact: 4
- ease: 8
- detail: filed 2026-08-09 by Phase 44a. The build-plan row and spec 34 §5.9
  item 2 both ask 44a to register the fifteen §5.2 renames, the six rank
  names, and the V-1 word list in `axiomancer-mechanics/docs/lexicon.json`
  right now, even though 44a ships ZERO renames. `scripts/check-lexicon.mjs`
  scans every live `.md` file outside `plan/` (except `bearings.md`) — about
  240 files — and every one of those existing rows was added at the commit
  that actually retired the concept from code, never earlier (see the four
  shipped rows' `since` dates). Registering now, while ~40 live docs
  (`axiomancer-mechanics/docs/philosophy.md`, `morality.md`,
  `keyword-atlas.md`, `card-frame-legend.md`, `combat.md`, `api.md`,
  `effects.md`, `gameloop.md`, `npcs.md`, `quickstart.md`, `testing.md`,
  `hazard-minigame.md`, `references/*`, `axiomancer-mechanics/CLAUDE.md`,
  `axiomancer-mechanics/README.md`, plus mobile docs and `.claude/`
  agent/skill prompts) still correctly describe the pre-retheme system,
  would force premature rewrites of accurate docs or blanket
  pragma-tagging dozens of files for a guard that protects nothing yet.
  **Fix:** each of 44b (the §5.2 keyword/system-term renames), 44c (the rank
  ladder), and 44g/44h (the broader V-1 prose vocabulary) adds its own
  `lexicon.json` rows in the same commit that performs its rename, and
  triages whatever `check-lexicon.mjs` then flags the normal way (fix
  wording / HISTORICAL banner / `<!-- lexicon-ok -->` pragma). See
  `plan/phases/phase_44a_rename_infrastructure.md` "Decisions made upfront"
  for the full reasoning.

### [world] Map-event content has no coverage guard against unreachable authoring
- source: first-map audit 2026-08-08 (finding F5). `fv-1` carried a fully
  authored encounter pool that no player could ever see, because map events
  fire on ARRIVAL and `createMapState` places the player ON the start node.
  It sat there undetected across at least two content passes, and the
  all-25-nodes pool test passed the whole time — it drives `resolveMapEvent`
  at each node id directly, which proves the pool is REGISTERED, not that a
  player can reach it.
- the general defect: nothing asserts that authored content is reachable by
  legal play. `auditMapTraversal` (shipped in the same pass) now walks every
  legal route and could answer this — a test that intersects "nodes any route
  can visit" with "nodes carrying a pool" would have caught fv-1 immediately,
  and would catch the next one.
- scored low-ease/high-impact: the walker exists, so this is one test file.
  Left unfiled as a fix only because the audit pass had already closed the
  live instance and adding a second invariant belonged in its own tick.

### [mobile] The live combat exit path bypasses the engine's end-of-combat reducer entirely
- source: first-map audit 2026-08-08 (finding F3). The kill-objective break
  was fixed at the symptom — `applyHazardOutcome` now calls
  `advanceKillObjectives` directly. The root cause is unaddressed: hazard
  combat (Spec 26b) never calls `endCombat`, so EVERY side effect that reducer
  owns is silently absent from live play, not just quest progression.
- `game.reducer.endCombat` was not re-read line by line during the audit. What
  else it does — flags, codex unlocks, faction deltas, morale, run counters —
  is unknown, and each one is a candidate for the same class of silent
  no-op that hid the quest break. Somebody should diff what `endCombat` does
  against what `applyHazardOutcome` + `handleHazardExit` do, and either route
  the live path through the reducer or enumerate the deltas deliberately.
- `[needs-user-call]` on the resolution shape: routing live combat through
  `endCombat` is the correct-looking fix but the two paths have diverged for
  a reason (the panel keeps combat state in local React state precisely so the
  engine's `state.combat` slice could be retired). Reunifying them is a design
  decision, not a bug fix.


> **BANNER (/oversight 2026-08-08 — the unshackling).** The seven
> byte-identical "Doctrine-curve confirmation" rows below (07-20 →
> 08-07) measure adherence to the status-dominance doctrine, which T
> voided this day. They are **historical readings of a dead law**, not
> open findings: do not drain them, do not act on their 80/50/25-35/0
> target band, and do not file another identical nightly. The next
> `/consolidate` should compact the seven into one historical row, and
> `/digest` should stop emitting them until **Phase 43** defines the
> replacement objective function.
>
> The **post-Phase-39 row immediately below is different** and stays
> live: it is a post-phase verification rather than an eighth identical
> nightly, and its numbers are the honest record of what Phase 39 did.
> Read it with the caveat that its target band is void — Phase 43
> decides whether mid 2.0% / late 0.0% is a defect at all. Likewise the
> two `[needs-user-call]` rows it spawned are genuinely open, and the
> unshackling **changes one of them**: the foundry row's blocker ("no
> card in the current 86-card library gives forge a heart-aspect
> win-path alternative") is no longer a constraint, because a
> replacement may now be authored freely, including with normal damage.
> See `plan/bearings.md` § "THE UNSHACKLING".

### The loop's own docs still call the `Closes #N` trailer the closing mechanism
- category: docs
- impact: 6
- ease: 9
- detail: filed 2026-08-08 by Phase 48. `skills/ship-a-phase.md:325`,
  `skills/iterate.md:315` and `scripts/loop-issue.mjs:10` describe the
  trailer as a "belt-and-suspenders backup", and `skills/iterate.md:193`'s
  issue-body template promises "this issue auto-closes when the commit
  pushes to main". Phase 48 proved the trailer is inert here and has never
  closed anything. Those sentences are now TRUE for the first time — but
  because `close-trailers.yml` runs the sweep, not because GitHub parses the
  trailer. Reword them to name the sweep, or the next reader re-derives the
  same wrong mental model this row's parent already cost five days to.

### `SYSTEM_TERM_COVERED_BY` claims WILD / X is covered by a keyword with no glossary row
- category: contract
- impact: 4
- ease: 8
- detail: filed 2026-08-08 by Phase 42's registry survey.
  `axiomancer-mobile/state/combat/keywords.ts:399` maps
  `'WILD / X': ['FORGE', 'CLARITY']`, but **CLARITY has no `KEYWORD_GLOSS`
  row** — so the system term advertises coverage the player can never read.
  The mechanic is live (`forceWildOnNextDie`, `combat.engine.ts:624`, the
  `consumedOnUse` discharge at `effects.ts:374`), so this is a registry gap
  rather than dead code: either CLARITY earns a gloss or the coverage claim
  drops it. Spec 34 §5 rules all 42 glossary rows and 8 system terms, so
  Phase 44b is the natural owner.

### Three mobile source comments still name cards the Profane Canon deleted
- category: docs
- impact: 3
- ease: 9
- detail: filed 2026-08-08 by Phase 42's survey, scope-checked. Comments in
  `state/combat/store-actions.ts:69`, `state/actions.ts:775` and
  `state/selectors/combat-cards.ts:13` explain the starter path in terms of
  `slippery-slope` and `brace-for-impact`, neither of which exists in the
  library since `84ef85b`. **Live code is unaffected — these are comments
  only** (checked; no runtime reference survives). Same root as the
  `combat-sim` default-loadout row above, which IS a live defect.

### [x] The deck-matrix baseline needs re-stamping under CQI before Phase 43 is usable — RESOLVED 2026-08-09 by digest (reduced-nightly regen)
- category: gap
- impact: 7
- ease: 8
- detail: filed 2026-08-08. Phase 43 shipped `combatQualityIndex` but
  deliberately did not stamp a baseline (a stamp taken mid-batch names a
  commit that does not contain what it measured). The baseline is now STALE
  by 5 mechanics-source commits at `8eb33fb8`. Until
  `npm run baseline:regen && node scripts/check-baseline-freshness.mjs` runs
  on a clean tree, `/deck-tuning` and `/combat-playtest` have no stamped CQI
  to optimise against and would fall back on `statusEngagement` — the dead
  law Phase 43 exists to retire. Pairs with the `/deck-tuning` naming row
  above: the metric and the skills that consume it must move together.
- **[x] RESOLVED 2026-08-09 (digest, reduced-nightly).** `npm run
  baseline:regen -- --runs=30 --confidence=reduced-nightly` stamped
  `deck-matrix-baseline.json` at `f96f0584` (7 mechanics-source commits
  since the prior stamp, including Phase 43 itself, the Profane Canon card
  rework, the first-map audit, and phases 44a/44b). CQI is now populated
  per stage for the first time via the standard regen path: early 0.746,
  mid 0.739, late 0.814, impossible 0.820 (`combatQuality.index`,
  0.40·spine + 0.25·arc + 0.20·width + 0.15·identity per spec 35/Phase 43).
  `statusEngagement` is still reported alongside (0.210 / 0.190 / 0.205 /
  0.218) but per Phase 43's own ruling is dead-law noise, not a target.
  Win rate (54.5% / 8.3% / 0% / 0%) is likewise no longer a grading term —
  see the fresh "Doctrine-curve confirmation" row below for why this digest
  did not file a doctrine-violation row against it. The `dominantCardShare`
  and default-loadout rows below this one are untouched; this resolution is
  the baseline stamp only.
- next: (drained — `/deck-tuning` and `/combat-playtest` can now read a
  stamped CQI reference; re-check the two still-open rows below
  (`dominantCardShare`, default loadout) independently)

### `dominantCardShare` is broken post-strike-death
- category: debt
- impact: 7
- ease: 5
- detail: filed 2026-08-08 by Phase 43. The raw attribution ledger's
  `dotDamage` is filled at SUMMARY time, so the ledger itself carries direct
  damage only and collapses onto whichever signature burst last — it reads
  ~100% on nearly every matrix cell. CQI's identity term routes around it
  (cards from the sim's per-line HP swing), so the new metric is unaffected,
  but the standalone stat is wrong wherever else it is read. Left untouched
  because other suites consume it; repair is separate work.

### `npm run combat-sim`'s default loadout no longer exists
- category: debt
- impact: 6
- ease: 9
- detail: filed 2026-08-08 by Phase 43. The default is
  `slippery-slope,brace-for-impact` — both cards deleted by the Profane Canon
  (`84ef85b`). Every default-invocation run therefore reports 0% win, 0%
  statusEngagement, cqi ~29%. Pre-existing rot, not caused by Phase 43, and
  outside its "surface the new metric additively" scope. Anyone reading a
  bare `combat-sim` run right now is reading noise.

### The Surge meter is the least-used locked system, and most rolled dice never power a line
- category: divergence
- impact: 5
- ease: 3
- detail: filed 2026-08-08 by Phase 43's first CQI reading. Chain completion
  is 35% matrix-wide (the chain breaks ~2x for every surge), the lowest
  locked sub-score everywhere; `dice-spent` is 29% against a 0.5 reference.
  **Information, not work** — bearings' "the current card library is
  transitional" rule forbids tuning against it. Re-read after the redesign.

### `/deck-tuning` and `/combat-playtest` still name `statusEngagement` as the objective function
- category: docs
- impact: 6
- ease: 9
- detail: filed 2026-08-08 by Phase 43. The skill files in `skills/` and
  `.claude/commands/` were outside that phase's ownership. They should be
  repointed at `cqi` / spec 35, or the next tuning pass will optimise the
  dead law the phase exists to retire.

### [needs-user-call] The product name "Axiomancer" under the whole-product pivot
- category: content
- impact: 6
- ease: 9
- detail: filed 2026-08-08 by Phase 42. Spec 34 rules the title KEPT under
  its NL-9 proper-noun carve-out (the Parish's older names survive; the rule
  licenses nothing new). But "Axiomancer" is philosophy-native, and a
  whole-product pivot is exactly the moment a title gets reconsidered — that
  is a T-level call, above the loop's standing big-decisions authority.
  Phases 44a-44i execute identically either way, so this blocks nothing.
  Bearings' "Name is capitalized: Axiomancer, always" stands until ruled on.

### Phase 52b's shelter retheme raised four rest nodes' heal for an open window
- category: divergence
- impact: 6
- ease: 7
- detail: filed 2026-08-08 by Phase 52b (`8444922`). Its brief said "changes
  no heal numbers", but retiring a PER-NODE knob could not be fully
  number-neutral: four nodes whose sub-1.0 authoring had nowhere to go now
  heal at the carried-forward default 1.0 — `nf-11` was 0.75, the labyrinth
  act default 0.2, the waystone overrides 0.35 and 0.5. `nf-4`, `nf-24` and
  all four fishing-village inns are unchanged. **Phase 52c overwrites every
  one of these** (camp flat 20%, inn full), so the fix is already queued —
  but 52c did NOT ship alongside 52b, so the window is open until it does,
  not for a single tick as the shipping agent framed it. Player-favorable,
  legible, and `REST_PASSIVE_HEAL_FRACTION` is marked
  carried-forward-pending-52c. Drain by shipping 52c, not by tuning here.

### [needs-user-call] Should any map outside the fishing village read as an inn?
- category: content
- impact: 4
- ease: 9
- detail: filed 2026-08-08 by Phase 52b. `shelter: 'camp' | 'inn'` now says
  it explicitly instead of inferring it from `healFraction >= 1.0`. Shipped
  with the most-defensible default — the four fishing-village rest nodes are
  the only inns; everything else is a camp, pinned as a COMPLETE set so a new
  inn cannot appear silently. Authored content question, not a code one.

### The starter bundle collapses to 8 cards in the live app
- category: divergence
- impact: 8
- ease: 4
- detail: filed 2026-08-08 by Phase 52a. `ensureStarterCards`
  (`axiomancer-mobile/state/combat/store-actions.ts`) writes
  `knownCards = [...preset.cardIds]` — the 18-entry Threadbare recipe WITH
  its 3x copies — and `buildCombatDeck` de-dupes the card base, yielding an
  **8-card deck**. The shipped 18/30/45 preset shapes only reach a real fight
  through `buildPresetDeck` (sim/CLI). So the MTG-style copy law the presets
  are machine-checked against has no effect in the app, and sim measurements
  are taken against a deck the player never plays. Directly contests what
  "deck size" means, which is what 52a's floor of 12 and 52f's pricing both
  rest on. See the paired candidate in `plan/PHASE_CANDIDATES.md`.

### The Phase-169 loadout path is dead in the shipped runtime
- category: debt
- impact: 5
- ease: 5
- detail: filed 2026-08-08 by Phase 52a. `createNewGameState` seeds only the
  2 `STARTING_CARD_IDS` loadout flags and mobile never writes loadout flags
  afterward, while `initializeCombatEncounter` calls `buildCombatDeck(player)`
  with no flags at all. 52a's loadout reconciliation is correct and tested,
  but nothing exercises it end to end. Pairs with the row above.

### `specs/README.md` has no row for spec 34
- category: docs
- impact: 3
- ease: 10
- detail: filed 2026-08-08 by Phase 42; the authoring agent's file ownership
  forbade editing the index. One-line add.

### Dead id-keyed engine hooks survive the retired spec-32 library
- category: debt
- impact: 5
- ease: 6
- detail: filed 2026-08-08 by Phase 42. Engine hooks still keyed to
  `achilles-and-the-tortoise`, `the-closing-word`, `circular-reasoning` —
  cards the Profane Canon (`84ef85b`) deleted. Dead, and now actively
  misleading: Phase 44c's build-plan row cites those same ids as its scope.
  Related stale registry rows: `SYSTEM_TERM_COVERED_BY` names a nonexistent
  `CLARITY` keyword, and mobile fixtures still deck `slippery-slope` /
  `straw-mans-jab`.

### `RELEASES.md` and `CHANGELOG.md` describe the retired `healFraction` as current
- category: docs
- impact: 2
- ease: 9
- detail: filed 2026-08-08 by Phase 52b. Left alone as dated release records;
  the next release cut should note the retirement rather than rewriting them.

### axio-query overview still publishes the retired "THE STRIKE IS DEAD" doctrine after Phase 41
- category: divergence
- impact: 8
- ease: 9
- detail: filed 2026-08-08 by the scheduled SomberSoft roundtable against
  clean current `main` at `e24f9723`. The live `axio_overview` response still
  says `THE STRIKE IS DEAD — no card touches HP...` because
  `scripts/axio-mcp-server.mjs::extractDoctrine()` selects that phrase from the
  stale header of `axiomancer-mechanics/src/Cards/cards.library.ts`. T voided
  that doctrine in the 2026-08-08 unshackling, and Phase 41 removed its hard
  test, but the engine-truth MCP now presents the dead law as current doctrine.
  Historical plan/devlog mentions are not the defect; the live overview is.
- next: update the card-library header to state that direct damage is legal
  while Conviction, Surge and Dice remain locked, update the MCP doctrine
  selector if necessary, and add a server smoke assertion that the overview
  cannot publish the retired phrase. Verify `axio_overview` against the live
  server plus the nearest MCP smoke test.

### [x] Doctrine-curve confirmation post-Phase-39: violation persists — RESOLVED via /oversight 2026-08-08: accepted, library is transitional
- category: content
- impact: 8
- ease: 2
- detail: filed 2026-08-08 (digest). `baseline:check` opened this cycle
  stale by one mechanics-source commit (`8d50591e`, Phase 39 — "post-D8
  curve repair + library theme-symmetry", the phase explicitly promoted
  via `/oversight` 2026-08-08 to close this exact doctrine gap).
  Re-measured with the reduced-nightly pass, committed at `8eb33fb8`.
  Read (blind policy-pick, doctrine early ~80 / mid ~50 / late 25-35 /
  impossible 0): early 61.1% (unchanged from the six prior byte-identical
  reads), mid 2.0% (up from 0.0% — 3 wins across 150 runs, first
  measured movement since 07-30, still a deep violation against ~50),
  late 0.0% (unchanged — zero movement despite being Phase 39's named
  target), impossible 0% (unchanged, correct). Phase 39's own shipping
  commit (`8d50591e`) already flagged this in its `needs-user-call`
  section: the mid-cliff persists even in presets that already carry
  every proven staple, which the phase author reads as
  engine/enemy-scaling shaped rather than card-composition shaped — the
  fresh matrix corroborates that read rather than contradicting it. Also
  see `plan/CRITIQUE.md`'s `[HIGH] late-stage global collapse` row,
  updated this cycle to record that Phase 39 landed without draining it.
- **[x] RESOLVED via /oversight 2026-08-08 — T: "This is fine. We're
  working on a new card redesign anyway."** The violation is ACCEPTED,
  not actioned: the numbers are honest, the band they violate is void
  (the status-dominance doctrine died the same day), and the library
  they measure is transitional. No mid/late enemy-threat-scaling phase
  is promoted off this row. Re-measure after the card redesign lands and
  after **Phase 43** defines what band, if any, replaces 80/50/25-35/0 —
  a fresh reading against a live objective function is worth something;
  another reading against a dead one is not.
- next: (drained — do not re-file this row's successor)

### [x] [needs-user-call] Phase 39: foundry's SWAY win-path removal regressed early-stage 73% -> 44% — RESOLVED via /oversight 2026-08-08: accepted as the settled cost
- category: design
- impact: 6
- ease: 2
- detail: filed 2026-08-08 (digest, mined from Phase 39's shipping
  commit `8d50591e`). The owner-ruled status-doctrine seat swap
  (`entropy-tax` replaces the `mirror-of-longing` borrow in `foundry`,
  restoring forge's own disenchant/status-engine identity) was applied
  regardless of win-rate delta, per the ruling. Cost: foundry lost its
  sole SWAY/capitulate win path, and no card in the current 86-card
  library gives forge a heart-aspect win-path alternative — early-stage
  win rate measured 73% -> 44% in the phase's own before/after sweep.
  The phase author flagged this as a real, expected cost of the ruling,
  not a bug, but recommends forge get an authored win-condition card as
  a follow-up.
- **[x] RESOLVED via /oversight 2026-08-08 — T: "This is fine. We're
  working on a new card redesign anyway."** T took the second option:
  **accept the regressed early-stage number as the settled cost** of the
  status-doctrine identity ruling. No authored win-condition card is
  queued for foundry now — the incoming redesign is the place for it,
  and authoring one against the current library would be work thrown
  away. Note for whoever does the redesign: this row's original blocker
  ("no card in the 86-card library gives forge a heart-aspect win-path
  alternative") is no longer a constraint at all — the unshackling
  permits authoring one freely, including with normal damage, which did
  not exist as an option when this was filed.
- next: (drained — carry the foundry win-path gap into the card
  redesign, not into a standalone `/deck-tuning` pass)

### [x] [needs-user-call] Phase 39: mid-game doctrine cliff reads engine/enemy-scaling shaped, not card-shaped — RESOLVED via /oversight 2026-08-08: enemy-scaling phase declined for now
- category: design
- impact: 7
- ease: 2
- detail: filed 2026-08-08 (digest, mined from Phase 39's shipping
  commit `8d50591e`). Phase 39's §C duplication-sweep found 10 of the
  Card Ledger dashboard's 13 "ready to duplicate" staples were already
  fully deployed pre-phase (3 more stale post-2026-07-19-promotions),
  and presets already carrying proven staples still sat at 0% mid win
  rate — evidence the mid-cliff is not a card-composition gap. The
  phase author explicitly did not force further duplication on that
  basis and recommended a follow-up phase on mid-stage threat scaling
  as a manual engine constant, not a `/deck-tuning` card change. This
  cycle's fresh baseline (see the "Doctrine-curve confirmation
  post-Phase-39" row above) corroborates: mid moved only 0.0% -> 2.0%
  (150 runs) despite Phase 39 landing.
- **[x] RESOLVED via /oversight 2026-08-08 — T: "This is fine. We're
  working on a new card redesign anyway." DECLINED for now.** No
  dedicated mid/late enemy-threat-scaling phase is promoted. The finding
  itself still looks right — the cliff reads engine-shaped, and 10/13
  staples already being deployed is good evidence — but a redesign
  changes the inputs to that diagnosis, so scoping enemy scaling against
  the current library would be premature. Re-derive after the redesign
  lands and Phase 43 is live. The standing rail is unchanged: engine
  constants are tuned manually, never by `/deck-tuning`.
- next: (drained — re-open after the card redesign + Phase 43, if the
  cliff survives both)

### [x] `Closes #N` auto-close is still not firing reliably — RESOLVED 2026-08-08 by Phase 48 (`46b5a5d`), and this row's own premise was WRONG
- category: debt
- impact: 5
- ease: 4
- detail: filed 2026-08-08 (oversight session sweep). The candidate
  "Root-cause + fix the `Closes #N` trailer silently no-op'ing on
  direct-to-main pushes" was marked RESOLVED 2026-08-03 (commit
  `0441c554`, issue #166), but the behavior is back — or never fully
  fixed. Evidence from this session's GitHub sweep: **#174 was still
  open** despite its fix landing the same day at `615ff26b`, whose body
  ends `- Closes #174`. Its sibling `1004894` used the byte-identical
  trailer shape (`- Closes #175`) and #175 DID close. Same push window,
  same branch, same leading-`- ` bullet form, opposite outcomes — so the
  root cause is NOT the bullet prefix, and the 08-03 fix is at best
  intermittent. Additionally **five `loop:phase` issues sat open for
  phases the build plan records as `[x]`**: #83 (Phase 32), #98 (D1),
  #139 (Phase 37), #140 (Phase 38), #143 (Phase 33d).
- cleanup already done: all six issues (#83, #98, #139, #140, #143,
  #174) were closed by hand during /oversight 2026-08-08 with a comment
  citing the shipping commit — so the CURRENT queue is clean and this
  row is about the mechanism, not the backlog.
- **RESOLUTION 2026-08-08 (Phase 48). Read this before citing anything
  above.** The evidence in this row is accurate but its inference is not.
  Phase 48 compared #174 and #175 end to end and eliminated all three
  hypotheses: both commits were the tip of their own single-commit push to
  `main` with byte-identical bullet trailers, so neither the bullet prefix
  nor batched-push tip-only scanning was ever the cause. The decisive facts
  are that #175's only comment is `buildCloseCommentBody()` verbatim — so
  **our own API call closed it, not GitHub's parser** — and #174 has no loop
  comment at all, meaning `close-comment` was never invoked. March run
  `31184116798` ended with "Waiting on CI — will resume once the
  verify-mobile run for commit 615ff26b finishes"; the turn ended while CI
  was amber, nothing resumes, and #174 leaked for 11 hours.
- **Actual root cause:** the only working close path was a best-effort prose
  step gated behind `deploy:check` going green, so any turn ending before CI
  concluded skipped it silently and forever. **The `Closes #N` trailer is
  inert in this repo and has never been observed closing anything** — the
  2026-08-03 fix was not intermittent, it was fixing a mechanism that was
  never running. Why GitHub's native parser stays inert could not be
  determined; the fix deliberately does not depend on it.
- **Fixed by:** `loop-issue.mjs close-trailers` + `.github/workflows/close-trailers.yml`,
  which scan every commit in a pushed range and close via the API
  idempotently, with a 36-case hermetic witness (mutation-tested against
  five injected regressions, all killed). Verified on its first live firing
  against the `46b5a5d` squash merge — a worst-case body dense with `#NNN`
  references — which correctly reported `0 closing reference(s)`.
- (historical) **PROMOTED to build-plan Phase 48 via /oversight 2026-08-08** (T:
  "make phases for everything you mentioned") — it is no longer competing
  with Phase 39 for an `/iterate` slot.
- next: Phase 48 — re-open the root-cause hunt. Compare `615ff26b` vs
  `1004894` end to end (push event shape, whether `scripts/loop-issue.mjs`
  or GitHub's own trailer parser did the closing, whether one landed
  inside a batched push where only the tip commit's trailers are
  scanned). The 08-03 "resolved" claim should be treated as unproven
  until a witness exists that fails when the mechanism regresses.

### [x] [tests] GateSockets has zero test coverage on real state logic — RESOLVED 2026-08-07 (issue #175)
- category: tests
- impact: 5
- ease: 7
- issue: #175
- resolution: added `axiomancer-mobile/components/labyrinth/__tests__/
  GateSockets.test.tsx` (9 tests) pinning socket rendering (pre-confirmed +
  open), the `distinctWords` pocket dedupe, lay/take-back/clear behavior,
  the `openSockets` capacity guard, and submit ordering
  (`[...preConfirmed, ...laid]`). Mobile verify: 269 files/2728 tests green.
- next: (drained)

### Doctrine-curve confirmation (digest 2026-08-07, reduced-nightly): unchanged for a sixth straight read
- category: content
- impact: 8
- ease: 3
- detail: `baseline:check` flagged staleness by exactly one mechanics-source
  commit (`d793d607` — folded the fake color-match `dieBonus` condition
  into an unconditional `specialMechanics` rider on
  `the-burden-of-repetition`, re-pricing it 11.40 -> 12.60; a single-card
  paid-line repricing, not a global rebalance). Re-measured with
  `/digest`'s reduced-nightly pass at `043e298e`; the regenerated
  `report` block is **byte-identical** to the `444886eb` (2026-08-06),
  `acc64eca` (2026-08-02), and `ef492fff` (2026-08-01) reads — confirmed
  via direct diff of the committed JSON (only `meta.generatedAt`/
  `meta.commit`/`meta.note` changed). blind policy-pick, doctrine early
  ~80 / mid ~50 / late 25-35 / impossible 0: early 61.1%, mid 0.0%, late
  0%, impossible 0% — identical to every read since 08-01. This is the
  sixth consecutive digest confirming the flag-on mid/late collapse
  first exposed 07-30. The triggering commit only touched one uncommon
  card's paid-rider pricing (still inside its printed band) and a
  momentum-wheel tooltip string; neither `scoreCard`
  (`Cards/cards.pricing.ts`) nor `draftCombatDeck`'s policy-pick
  construction path reads that card's tooltip text or is sensitive to a
  single card's price moving within its band, so a byte-identical result
  is the mechanically expected one.
- next: /iterate — no new signal; `/deck-tuning` continues to own the
  actual repair via the existing "Post-D8 flag-on curve repair" candidate
  in `plan/PHASE_CANDIDATES.md`. The persistent late=0% doctrine violation
  stays tracked live in `plan/CRITIQUE.md`'s `[HIGH] late-stage global
  collapse` row.

### [x] [external-critique] Combat kill-path legibility — RESOLVED 2026-08-07 (commit 615ff26b, issue #174)
- category: external-critique
- impact: 4
- ease: 7
- issue: #174
- resolution: build-plan Phase 2 had shipped the mechanics selector
  `projectCombatOutcome` (pending DoT / rounds-to-kill /
  lethal-in-flight), but nothing in `axiomancer-mobile` ever consumed
  it — the API existed, the board stayed illegible. Forwarded the
  projection onto `CombatEnemyPaneVM` in the enemy-pane presenter
  (`combat-encounter.engine.ts`) and rendered it on the combat board
  (`CombatCombatantPane.tsx`) as a "DOT PENDING" / "LETHAL IN N"
  readout, reusing the existing `AltWinMeter` component (same HUD slot
  as the SWAY/PREMISE alt-win meters). Added presenter coverage
  (`legibility-sweep.engine.test.ts`) pinning the hidden/pending/lethal
  states against the same fixture as mechanics' own
  `projected-lethality.engine.test.ts` e2e. Mobile lint + typecheck +
  268 files/2719 tests green.
- detail: mirrored from `plan/CRITIQUE.md` Pending row (seeded
  2026-07-03 from the retired `/archive` critique history).
- next: (drained)

### [x] [external-critique] color-match die riders are a fake condition — RESOLVED 2026-08-07 (commit d793d607, issue #173)
- category: external-critique
- impact: 6
- ease: 6
- issue: #173
- resolution: re-verified the row's "7 cards" count was stale (Phase 30's
  FREE-lines rewrite had already stripped `dieBonus` from 6 of them); only
  `the-burden-of-repetition` still carried the fake `onColor: 'match'`
  condition (always-true under the color law, since only a same-stance or
  WILD die can legally power a card). Folded its `conviction: 1` rider
  into `specialMechanics` as a plain unconditional rider and re-priced at
  full weight (11.40 -> 12.60, still inside the printed uncommon band
  4.5-13); reworded the momentum-wheel tooltip that misattributed the
  bonus to the wild die specifically. Investigated but did NOT bake the
  flat `COLOR_MATCH_DAMAGE_BONUS`/duration bonus into unconditional math:
  the FATE Engine's X-die mechanism is a genuine, tested exception
  (`colorMatch` is correctly `false` for an X-die play) — no live card
  uses `fate` today, but baking it in would silently grant the bonus to
  any future fate-flagged card. That part of the finding was a false
  premise; closed as verified-not-a-bug. Mechanics 190 files/4085 tests +
  mobile 268 files/2716 tests green.
- detail: mirrored from `plan/CRITIQUE.md` Pending row (filed via `/jot`,
  2026-07-18, owner directive).
- next: (drained)

### [x] [external-critique] authored `paidSummary` card text still prints round-clock DoT duration — RESOLVED 2026-08-05 (commit d320ee12, issue #170)
- category: external-critique
- impact: 6
- ease: 7
- issue: #170
- resolution: the WI-2 fix (issue #168) only patched `faceStats`'s
  auto-generated dot classification; a card's authored `paidSummary` fully
  replaces that text (`combat.cards.ts:389/415`) and was never covered — nor
  could the existing guard test catch it, since it gates on `faceStats`'s
  single PRIMARY-effect classification and skips multi-effect authored cards
  (e.g. Opening Statement's primary effect is MARK, not its POISON). A full
  sweep of `cards.library.ts` for POISON/BLEED + "for N turns" found 12
  offending cards, not just the one the critique row cited: slippery-slope,
  exordium, opening-statement, mounting-case, sweet-poison, fallen-grace,
  pact-of-akrasia, glimpse, cassandras-burden, brief-candle, refrain,
  recurring-symptom. Reworded all 12 to name the real trigger ("ticks each
  card you play" / "ticks each time it is struck") while keeping the honest
  duration number; updated the two pinned `bottomActionText` fixtures in
  `erosion-paid-wording.engine.test.ts`. Extended
  `card-face-honesty.guard.test.ts` with a new sweep that reads every card's
  `combatEffects` directly (not gated on the primary-effect classification),
  closing the exact gap that let this ship. Mechanics 190 files/4085 tests +
  build green; mobile lint + typecheck + 268 files/2716 tests green.
- detail: mirrored from `plan/CRITIQUE.md` Pending row (filed by critique
  pass 16, 2026-08-05, unattended `/march` tick).
- next: (drained)

### [x] [external-critique] DoT card faces print round-clock math that contradicts their own keyword glosses — RESOLVED 2026-08-04 (issue #168)
- category: external-critique
- impact: 6
- ease: 9
- issue: #168
- resolution: verified stale; no new code. The trigger-clock source of
  truth the row asked for already exists —
  `debuffs.library.json`'s `damageOverTime.trigger` field, read once in
  `cardCalc()` (`axiomancer-mobile/state/presenters/combat-encounter.engine.ts:1187-1188`)
  and consumed by both the card-face and detail-overlay generators.
  Event-triggered DoT faces (poison, bleed) already print their real
  trigger ("each card you play" / "each time it is struck"); round-clock
  "X over Nt turns" phrasing survives only for genuinely round-clock
  (`dotTrigger === null`) effects. Fix landed in commit `b097efec` (WI-2,
  2026-07-12 11:45:52) — ten minutes before this CRITIQUE row was even
  filed (11:55:20 the same day). Regression guard
  `card-face-honesty.guard.test.ts` sweeps the full card library and
  passes clean on current `main` (verified this tick: 9/9 tests green).
- detail: mirrored from `plan/CRITIQUE.md` Pending row (filed by the
  playtester during the 2026-07-12 owner-directed break-test session;
  flagged for re-check by /critique pass 15, 2026-08-04, once Phase 32
  shipped in full).
- next: (drained)

### [x] [external-critique] SWAY has no meter anywhere in the combat UI — RESOLVED 2026-08-03 (issue #167)
- category: external-critique
- impact: 6
- ease: 9
- issue: #167
- resolution: verified stale; no new code. WI-5 (2026-07-12, commit
  `88406af8`) already shipped an `AltWinMeter` (SWAY -> CAPITULATE,
  PREMISE -> ORATORY) under the VITAE bar in
  `axiomancer-mobile/components/combat/encounter/CombatCombatantPane.tsx`
  — `testID="combat-sway-meter"`, full `accessibilityRole="progressbar"`
  semantics, gated on `enemy.swayVisible`. Presenter-level regression
  coverage already exists in `legibility-sweep.engine.test.ts` ("surfaces
  the SWAY meter with the engine capitulate target when sway accrues").
  The finding predates or narrowly missed WI-5's same-day landing.
- detail: mirrored from `plan/CRITIQUE.md` Pending row (filed by the
  playtester during the 2026-07-12 owner-directed break-test session).
- next: (drained)

### Doctrine-curve confirmation (digest 2026-08-06, reduced-nightly): unchanged for a fifth straight read — the triggering commit was text-only
- category: content
- impact: 8
- ease: 3
- detail: `baseline:check` flagged staleness by exactly one mechanics-source
  commit (`d320ee12` — reworded 12 cards' authored `paidSummary` strings,
  no numeric/effect change; verified via `git show` diff, string literals
  only). Re-measured with `/digest`'s reduced-nightly pass at `444886eb`;
  the regenerated `report` block is **byte-identical** to the prior
  `acc64eca` (2026-08-02) and `ef492fff` (2026-08-01) reads — confirmed via
  direct diff of the committed JSON (only `meta.generatedAt`/`meta.commit`/
  `meta.note` changed). blind policy-pick, doctrine early ~80 / mid ~50 /
  late 25-35 / impossible 0: early 61.1%, mid 0.0%, late 0%, impossible 0%
  — identical to 08-01 and 08-02. This is the fifth consecutive digest
  confirming the flag-on mid/late collapse first exposed 07-30; five days
  of intervening commits have been copy/content/audit/critique housekeeping,
  not mechanics rebalancing, so an unchanged read is expected, not a stall
  in the repair. (Sanity check performed this pass: confirmed no hidden
  coupling from card-face text into the policy-pick draft path — neither
  `scoreCard` (`Cards/cards.pricing.ts`) nor `draftCombatDeck`'s
  `verbClass`-based weighting (`Combat/combat.deck-draft.ts`,
  `Combat/combat.cards.ts`) reads `paidSummary`; the only consumer of
  card-face text is `cardComplexity`'s keyword scan
  (`Combat/combat.card-complexity.ts`), which feeds `preset:`-path
  complexity reporting only, never the `policy-pick` deck this matrix
  measures — so the byte-identical result is the mechanically expected
  one, not a coincidence worth further chasing.)
- next: /iterate — no new signal; `/deck-tuning` continues to own the
  actual repair via the existing "Post-D8 flag-on curve repair" candidate
  in `plan/PHASE_CANDIDATES.md`. The persistent late=0% doctrine violation
  stays tracked live in `plan/CRITIQUE.md`'s `[HIGH] late-stage global
  collapse` row.

### Doctrine-curve confirmation (digest 2026-08-02, reduced-nightly): unchanged from 08-01's flat-zero mid/late read
- category: content
- impact: 8
- ease: 3
- detail: `/digest`'s reduced-nightly re-measure at `acc64eca` (blind
  policy-pick, doctrine early ~80 / mid ~50 / late 25-35 / impossible 0):
  early 61.1%, mid 0.0%, late 0%, impossible 0% — byte-identical to the
  2026-08-01 digest's `ef492fff` read (only the JSON's `generatedAt`/
  `commit` meta fields changed). `baseline:check` had flagged staleness
  against `fbace426` (draft-scorer newcomer/sandbox-visibility fix), but
  that fix targets the *draft* scorer's card-offer weighting, not the
  `policy-pick` deck-construction path this matrix measures, so an
  unchanged read is the expected outcome, not a fresh data point on the
  collapse itself — this row exists to keep the freshness stamp honest,
  not to report new movement.
- next: /iterate — no new signal; `/deck-tuning` continues to own the
  actual repair via the existing "Post-D8 flag-on curve repair"
  candidate in `plan/PHASE_CANDIDATES.md`.

### Doctrine-curve confirmation (digest 2026-08-01, reduced-nightly): mid collapses to zero, early ticks up, late still dead flat
- category: content
- impact: 8
- ease: 3
- detail: `/digest`'s reduced-nightly re-measure at `ef492fff` (blind
  policy-pick, doctrine early ~80 / mid ~50 / late 25-35 / impossible 0):
  early 61.1% (was 59.9% at the 2026-07-30 digest's `aa21018b` read —
  up 1.2pts, still well under band), **mid 0.0%** (was 4.7% — the mid
  band has now fully collapsed to zero, the softest mid read logged in
  any digest to date), late 0% (unchanged — still zero), impossible 0%
  (in band, unchanged). This is the third consecutive digest confirming
  the flag-on mid/late collapse the 2026-07-30 entry first exposed once
  Upgradeable Dice became the default nightly measurement; the gap has
  not closed and mid has gotten measurably worse rather than better.
- next: /iterate — re-anchor future digest doctrine-curve comparisons
  against this reading. `/deck-tuning` owns the actual repair via the
  existing "Post-D8 flag-on curve repair" candidate in
  `plan/PHASE_CANDIDATES.md` — this confirms it's still live and, given
  mid's continued deterioration, more urgent than its filing date
  suggests.

### Doctrine-curve confirmation (digest 2026-07-30, reduced-nightly): first default-Upgradeable-Dice nightly read — mid near-total collapse, early down sharply, late still dead flat
- category: content
- impact: 8
- ease: 3
- detail: `/digest`'s reduced-nightly re-measure at `aa21018b` (blind
  policy-pick, doctrine early ~80 / mid ~50 / late 25-35 / impossible 0):
  early 59.9% (was 77.4% at the 2026-07-21 digest's `c0562bb3` read —
  down 17.4pts), **mid 4.7%** (was 22.9% — down 18.2pts, the softest
  mid read logged in any digest to date), **late 0%** (unchanged —
  another measurement running at exactly zero), impossible 0% (in
  band, unchanged). **Not directly comparable to prior digest
  entries**: `afd26600` (2026-07-23, "fix(playtest): default witnesses
  to Upgradeable Dice") flipped `combat-playtest`'s default dice model
  from legacy to spec-33 Upgradeable Dice — same CLI invocation
  (`--stage=all --policy=all --deck=policy-pick --runs=30 --seed=1
  --cards --json`), different model measured. This is the first
  reduced-nightly baseline to carry a `diceModel` field at all
  (`"upgradeable"`); the `c0562bb3` baseline predates the field and was
  measured under the old legacy-dice default, so this drop is not
  evidence of fresh regression — it's the flag-on curve becoming
  visible by default instead of only under an explicit flag. The
  direction lines up with the D8 flag-on gate rerun
  (`plan/tuning/2026-07-18-d8-preset-dice-valves.md`): "mid is a cliff
  for 8/10" preset decks under flag-on — this is that same cliff. The
  6-day gap since the last digest (`night` workflow failed
  2026-07-24 through 2026-07-29 on a GitHub Actions billing hold, now
  resolved — see this digest's "Needs you" panel) means no digest
  measured the interim `afd26600`-era commits until now.
- next: /iterate — re-anchor future digest doctrine-curve comparisons
  against this reading (stop diffing against pre-`afd26600` legacy-dice
  numbers). `/deck-tuning` owns the actual repair via the existing
  "Post-D8 flag-on curve repair" candidate in
  `plan/PHASE_CANDIDATES.md` — this confirms it's still live and, now
  that flag-on is the default nightly measurement, more urgent than its
  filing date suggests.

### 2026-07-20 missing-layers survey — unpromoted findings (audio, settings, a11y, perf, flags, save export)
- category: gap
- impact: 5
- ease: 3
- detail: filed 2026-07-20 (owner missing-layers survey session; "file
  the residue"). The session surveyed all cross-cutting infrastructure
  layers; the owner promoted TWO (in-house crash capture → candidate;
  central juice layer → Phase 38) and deliberately did NOT promote the
  rest. Recording those findings here as signal, NOT as candidates —
  the owner saw this list and chose; do not self-promote, let `/expand`
  re-propose when context changes. The unpromoted findings:
  (1) **Audio — fully absent.** No expo-av/expo-audio, no SFX/music/
  volume anywhere; haptics (~20 call sites) are the entire sensory
  layer. The biggest player-facing absence for a mobile game.
  (2) **Settings screen — absent.** No settings route; theme switching
  lives in the SELF tab (`components/ThemeSwitcher.tsx`); nowhere to
  put audio volume, a11y toggles, or data management. Partially blocks
  (1) and (3).
  (3) **A11y depth.** Reduced-motion + a11y labels exist; font scaling
  (`allowFontScaling` largely unused), color contrast, and screen-
  reader flow validation do not (`specs/12-accessibility-and-theming.md`
  is the spec surface).
  (4) **Feature-flag registry.** Flags are scattered per-feature
  env + `__AXM_*` global reads (`state/combat/flags.ts` the pattern);
  fine at ~3 flags, painful at 10; no central registry.
  (5) **Perf instrumentation.** One perf regression test + font-bundle
  splitting exist; no frame-budget hooks, no bundle-size CI gate.
  (6) **Save export/backup.** Single-slot save is mature (migrations,
  corruption modal) but there is no manual export/backup/restore.
  Deliberate non-goals confirmed same session (do not re-file): product
  analytics, i18n (copy doctrine cuts against it), backend/auth/cloud
  saves (offline by design, `plan/bearings.md` § Auth).
- next: /expand — re-propose individual items as candidates when their
  blockers move (a settings screen unlocks audio + a11y toggles; the
  flag registry becomes worth it at the next 2-3 flags).

### `skills/digest.md` §3 cites breadth-check plumbing that doesn't exist in this repo
- category: divergence
- impact: 2
- ease: 6
- detail: filed 2026-07-20 (digest run). The digest skill's breadth-check
  step reads `SMOKE_SAMPLE=full npm run e2e` and points to
  `nexus/customization/hermetic-e2e.md` for the per-project adaptation —
  neither exists: there's no root `e2e` script (root `package.json` has
  no `e2e` key) and no `nexus/` directory anywhere in the tree (also
  referenced by §"Purpose" as `nexus/concepts/loop-shapes.md`). The
  loop has clearly already adapted in practice — `plan/AUDIT.md`'s
  `[3.2]` row and the last several digest entries both correctly use
  `npm run e2e:minigames` in the `axiomancer-mobile` workspace — but
  the skill file itself still points at dead paths, so a fresh reader
  (or an agent without that precedent in context) would try a command
  that fails outright.
- next: /iterate — update `skills/digest.md` §3/§6 to cite the real
  command (`npm --workspace axiomancer-mobile run e2e:minigames`) and
  either drop the `nexus/` pointers or repoint them at wherever this
  project's actual loop-shape/adaptation notes live (`plan/bearings.md`
  § Surface looks like the closest fit).

### [resolved 2026-07-23] Upgradeable Dice activation law
- category: divergence
- impact: 5
- ease: 8
- detail: filed 2026-07-19 (`/march` -> `/ship-a-phase` tick; recovered
  from an unmerged branch's residue, `origin/claude/dice-mechanics-flag-
  removal-cc7a6b`, commits `49a3a372`/`bae870b4`/`cb267dc6`, 2026-07-18).
  A prior session decided the owner wants a full flag teardown ("go all
  in on the dice mechanics, remove the feature flag") -> new phases
  D10 (mechanics engine collapse) / D11 (mobile) / D12 (barrel + flag-
  module + dead-symbol removal), sequenced after D8, before D9. D10
  removes `isUpgradeableDiceEnabled()` from the engine entirely, which
  ABSORBS D-FLIP's reversible default-flip permanently — D-FLIP's
  original scope is throwaway work. That branch never merged and has
  since diverged too far from `main` to cherry-pick safely (predates
  the swap-pool card-library work), so the plan rows and brief exist
  only on the stale branch, not on `main`. Two coupled drifts:
  (1) `plan/steps/01_build_plan.md` Phase D-FLIP is now marked
  `[blocked: ... needs /oversight 2026-07-19]` (ship-a-phase does not
  have authority to set `[skipped]`); (2) shipped-vs-queue mismatch —
  THE FLIP already made every real app build boot Upgradeable Dice ON
  (`axiomancer-mobile/state/combat/flags.ts`, commit `ae51ab3d`,
  2026-07-18) while the mechanics-package default stays OFF by design
  (tests/sims toggle both models per-suite) and D8 already shipped on
  top of that live state without D-FLIP formally preceding it.
- resolution: T directed "Fix main" and "allow for upgradeable dice" after the
  doctrine sweeper exposed materially different Mobile-ON and witness-OFF
  results. Mobile and normal `combat-playtest` balance witnesses default ON;
  every report declares its dice model; `--legacy-dice` preserves an explicit
  comparison lane. The mechanics module remains default-OFF for hermetic test
  isolation. Do not resurrect the stale D10-D12 teardown branch.

### [x] [user-issue #129] [HIGH] Log T's provenance for every Hermes-originated queue change — RESOLVED 2026-07-30 (commit 4284562a)
- category: external-issue
- impact: 6
- ease: 6
- resolution: added a forward-looking "## Queue change log" section to
  `plan/steps/01_build_plan.md` (empty, format spec inline). Requirement to
  land a same-commit entry on every Hermes-originated queue mutation is now
  recorded in both `plan/bearings.md` (new standing-decision bullet) and
  `skills/oversight.md` §6 Step 5 (the skill that applies most queue-
  mutating adjustments). Pre-2026-07-30 queue history was NOT reconstructed
  per the finding's explicit instruction.
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

### hazard/gathering "paradox-token" reward vocabulary outlives the card category — OWNER CALL MADE 2026-08-08: rename to QUANDARY
- category: divergence
- impact: 2
- ease: 4
- **decision (owner, /oversight 2026-08-08 — this row is no longer a
  `[needs-user-call]`, it is a ready-to-ship /iterate row):** RENAME, do
  not remove and do not leave. The reward economy stays exactly as it is;
  only the vocabulary changes. **"paradox token" → "QUANDARY".** Removal
  was explicitly declined — the token is a live reward tail in two
  minigames, so deleting it is an economy change needing its own phase,
  not an /iterate row. Leaving it was declined too: the word points at
  nothing in the game after phase 37.
- rename target vetting (done at the call): `quandary`, `conundrum` and
  `sophism` are all zero-hit across `axiomancer-mechanics/src`,
  `axiomancer-mobile/state` and `axiomancer-mobile/components`, so none
  collides. `aporia` was ruled OUT — it is already W-01's continent
  (`specs/world/W-01-aporia-labyrinth-continent.md`) and also appears in
  C-01 and spec 32. QUANDARY chosen: same cold/archaic register, no
  collision, and it means what the paradox token meant without pointing
  at a retired card category.
- scope when /iterate takes it (5 sites, all mobile, no engine change):
  `HAZARD_TOKEN_FLAG_PREFIX` + its doc comment
  (`state/hazard/store-actions.ts` ~L76/L484), the gathering flag prefix
  + doc comment (`state/gathering/store-actions.ts` ~L64/L269), the two
  reward blurbs `+${r.amount} paradox token(s)`
  (`state/presenters/hazard.engine.ts` ~L369,
  `state/presenters/gathering.engine.ts` ~L241), and the
  `case 'paradox'` glyph (`components/hazard/glyphs.tsx`). Persisted
  flag prefixes are save-visible — check whether the change needs a
  `GAME_STATE_VERSION` migration before renaming the prefix strings, or
  keep the prefix and rename only player-facing copy. Re-grep first;
  distinguish from the `arrow-paradox` card id and `Item.category`
  (both unrelated, both stay).
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
- next: /iterate — the owner call is made (rename → QUANDARY); execute it.

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

### [x] `skills/oversight.md` assumes direct push to `main` — RESOLVED via /oversight 2026-08-08: no change needed, direct push is sanctioned
- category: docs
- impact: 2
- ease: 8
- **resolution (T direct, 2026-08-08): "Direct pushes to main are fine,
  keep going."** The row's premise — that a remote web session *cannot*
  push `main` and must ship via branch + PR — is falsified: this session
  pushed `main` directly (`3cb3c3d`, `463a3bc`) after two branch+PR
  rounds, and T ratified the direct path. So §6 of the skill is already
  correct as written and needs **no** "remote-session delivery" note.
  The branch+PR path stays available and is still the right call for
  anything a reviewer should see before it lands; it is simply not
  mandatory. Filed as a standing decision in `plan/bearings.md`.
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
- next: (drained — no doc edit required)

### [x] Gate the first-map blacksmith MapEvent node back to dev-only — RESOLVED 2026-07-23 (issue #151)
- category: content
- impact: 4
- ease: 7
- resolution: removed the `FV_BLACKSMITH_NODES` map-data entry + the
  `fvBlacksmithPool` helper from `axiomancer-mechanics/src/World/MapEvents/content.ts`
  (fv-16 falls back to a plain encounter, its pre-D6c state). Updated the
  three tests that asserted the node's kind: `content.engine.test.ts`
  (encounter count 7→8), `map-encounter-minigames.engine.test.ts`
  (dropped the `blacksmith` count assertion), and
  `blacksmith.flow.engine.test.ts` (removed the map-interception describe
  block; the forging tests already drove the session via
  `beginBlacksmith()` directly, unaffected). Dev-menu entry
  (`DebugBlacksmithButton.tsx`) untouched — it calls `beginBlacksmith()`
  directly, bypassing map-event resolution. Full three-workspace
  `npm run verify` green.
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

### Doctrine-curve confirmation (digest 2026-07-21, reduced-nightly): mid's two-day climb reverses, late still dead flat
- category: content
- impact: 7
- ease: 3
- detail: `/digest`'s reduced-nightly re-measure at `c0562bb3` (blind
  policy-pick, doctrine early ~80 / mid ~50 / late 25-35 / impossible 0,
  via the engine's own `stageSummaries` aggregate — includes
  capitulate/concede alt-wins, not HP-kill only): early 77.4% (was
  86.1% at `345cb0a6` — down 8.7pts, still roughly in band but the
  softest early read in the last three digests), **mid 22.9%** (was
  35.3% — **down 12.4pts, reversing the two-day climb** 7.3% →
  31.0% → 35.3% → 22.9%), **late 0%** (unchanged — fourth
  measurement running at exactly zero), impossible 0% (in band,
  unchanged). Only two mechanics-source commits landed between
  baselines: Phase 33d (GLYPHS pilot — sandbox-only per its own brief,
  no library/preset promotion, should be inert on the matrix) and
  Phase 37 (retire the fallacy/paradox card category + the dead
  `combatResources` pool — billed as pure dead-code teardown, nothing
  live consumed it). Neither commit's stated scope should move a win
  curve at all, let alone reverse a two-day upward trend by double
  digits on both early and mid — worth a closer look at whether
  Phase 37's teardown had a live side-effect the brief didn't
  anticipate, rather than filing this as ordinary reduced-nightly
  noise (30 runs/cell, single seed — noisy, but this repo's own past
  swings of this size have tracked real content changes, not chance).
- next: /iterate — confirm with a full 3-seed `baseline:regen` before
  treating the mid/early drop as real; if it holds, bisect Phase 37's
  diff for an unintended combat-path change (the `combatResources`
  removal touched `scoreCard`-adjacent code per its own brief) before
  blaming noise. Late-game 0% (fire-giant, rangda, tezcatlipoca,
  arch-demon, death, the-abortive) remains the standing "Post-D8
  flag-on curve repair" candidate's sharper target.

### Doctrine-curve confirmation (digest 2026-07-20, reduced-nightly): mid climbing, late still dead flat
- category: content
- impact: 6
- ease: 3
- detail: `/digest`'s reduced-nightly re-measure at `345cb0a6` (blind
  policy-pick, doctrine early ~80 / mid ~50 / late 25-35 / impossible 0):
  early 86.1% (in band, was 86.9% at the `f8c902e4` post-promotion
  baseline, 2026-07-19), **mid 35.3%** (was 31.0% at `f8c902e4`, which
  was itself up sharply from 7.3% at the 2026-07-18 digest's
  `31f62c1e` measurement — still under ~50% but the trend across the
  last two days is real, not noise), **late 0%** (unchanged from
  `f8c902e4` and from 07-18's 0.14% — flat zero survives the swap-pool
  promotions (`fc98fb7a`), Phase D9's stance-check variety (`2848fb6a`),
  and Phase 33c's coveted die (`fc7fddbf`); none of these three targeted
  late-stage difficulty), impossible 0% (in band, unchanged). Mid is
  moving in the right direction under general engine/content work; late
  is a flat doctrine violation that nothing shipped this window touched.
- next: /iterate — the standing "Post-D8 flag-on curve repair" phase
  candidate (`plan/PHASE_CANDIDATES.md`) is the scoped fix; late-stage
  0% across six enemies (fire-giant, rangda, tezcatlipoca, arch-demon,
  death, the-abortive) is the sharper target than the mid-game cliff now
  that mid is self-correcting.

### [x] Doctrine-curve confirmation (digest 2026-07-18, reduced-nightly): mid/late collapse persists unchanged despite two days of engine work
- drained 2026-07-23 (iterate tick, issue #150): the row's "next" action
  — reword the CRITIQUE.md `[HIGH] phase 31-32's effect on the doctrine
  curve is unmeasured` row, since it's actually measured repeatedly —
  is done; that CRITIQUE row is now `[x]` RESOLVED (framing was stale,
  underlying doctrine violation redirected to the `[HIGH] late-stage
  global collapse` row + the standing "Post-D8 flag-on curve repair"
  candidate). The 2026-07-20 and 2026-07-21 confirmation rows below
  remain open — they track the still-live mid/late doctrine numbers,
  not the stale-wording issue this row flagged.

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

### [x] deploy-check reports a `cancelled` CI run as red — false-red during concurrent-push collisions — RESOLVED 2026-08-07 (commit 3375fe98, issue #172)
- category: debt
- impact: 5
- ease: 6
- issue: #172
- resolution: `scripts/deploy-check.mjs`'s GitHub Actions poll loop now
  special-cases a `cancelled` conclusion: before failing closed, it
  checks `origin/main`'s current tip (`git ls-remote origin
  refs/heads/main`) against the polled SHA. If the tip has moved on
  (a newer commit superseded the polled one — the concurrency-group
  scenario this row described), it exits 2 (retry/stale) with a
  message pointing at the newer HEAD instead of exit 1 (red). A
  `cancelled` run whose SHA is still the branch tip (a genuine
  cancellation, not a supersession) still fails closed, unchanged from
  before. Root `npm run verify` green (268 suites/2716 tests mobile,
  mechanics + card-editor green); manual `deploy:check` run against
  the current green HEAD confirmed the normal success path is
  unaffected.
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

### [x] [3.5] `critique:drive` combat capture stops at the pre-fight preview — RESOLVED 2026-07-31 (issue #158)
- category: gap
- impact: 5
- ease: 7
- issue: #158
- resolution: added a `combat-board` screen entry to
  `axiomancer-mobile/scripts/critique-drive.mjs` mirroring
  `combat-encounter-e2e.mjs`'s pattern (`combat-enter` click → re-kill
  primer → wait for `combat-board`), captured alongside the existing
  pre-fight `combat` preview. Verified locally: the new capture's DOM
  text shows the live hand (Soft Word, Brace for Impact, Festering
  Argument, Slippery Slope) and VITAE/phase HUD, where the old capture
  only ever reached the pre-fight threat-sequence reveal. Factored the
  shared primer-dismiss loop into `dismissCombatPrimer()` since both
  screens now use it.
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

### [x] [external-critique] `card-themes.ts` THEME_KEYWORDS advertises the dead TICK keyword — RESOLVED 2026-08-01 (issue #160)
- category: external-critique
- impact: 3
- ease: 9
- issue: #160
- resolution: dropped TICK from `THEME_KEYWORDS.affliction` and
  `THEME_KEYWORDS.harvest` (`axiomancer-mechanics/src/Cards/card-themes.ts`)
  — both families listed a keyword ratified dead 2026-07-10 (phase 30,
  KW-4) that no live card uses, an empty-set "family lie" of the class
  KW-2/KW-6 fixed in phase 29. Confirmed dead via
  `roles-themes.engine.test.ts`'s "no TICK vocabulary anywhere in the
  sets" witness; no test pins family length/contents beyond the KW-6
  glossary-resolution check (`keywords.test.ts`). Mechanics + mobile
  `npm run verify` green.
- detail: mirrored from `plan/CRITIQUE.md` Pending row (filed via
  /deck-tuning fan-out session, 2026-07-18, PR #130 residue).
- next: (drained)

### [x] Combat deck-matrix baseline stale by 33 mechanics-source commits — RESOLVED 2026-08-05 (issue #169)
- category: gap
- impact: 6
- ease: 6
- issue: #169
- resolution: verified resolved by the ordinary nightly cadence, no new
  code. `npm run baseline:check` now reports "FRESH. Baseline acc64eca
  measured 2026-08-02; no mechanics-source commits since." The row's own
  suggested action (`baseline:regen` or a reduced-nightly digest pass)
  has run repeatedly since filing — see the chain of doctrine-curve
  confirmation rows below spanning 2026-07-20 through 2026-08-02, each
  re-measuring at a fresher commit. The row's warning about the "Metric
  v2" blind spots still applies to *those* newer rows; it is not
  reintroduced by closing this one.
- detail: surfaced 2026-07-17 by the new session-start hook — the
  baseline was measured 2026-07-12 (merge f325c423 + 953de92e) and 33
  mechanics-source commits have landed since (incl. the card PAID-prose
  work). Any balance/engagement answer citing it describes a 5-day-old
  engine.
- next: (drained)

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
- **PROMOTED to build-plan Phase 43 via /oversight 2026-08-08** — and
  the target moved. `statusEngagement` was the objective function
  *because* status play was the doctrine; the unshackling voids that
  doctrine, so the metric now measures adherence to a rule the game no
  longer has. Phase 43 defines what "good combat" means under the new
  rules rather than merely fixing the old metric's blind spots. The
  "treat its numbers as suspect" guidance hardens to: **every existing
  doctrine-curve reading measures a dead law** until 43 lands.
- next: Phase 43 (no longer a parked attended session)

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

### [x] [3.2] Night workflow never installs Playwright's browser — breadth check silently would fail on every run — RESOLVED 2026-08-03 (commit ca5b86f1, issue #165)
- resolution: added `install_playwright: true` to the `digest` job's
  `with:` block in `.github/workflows/night.yml`, mirroring
  `critique.yml`. One-line fix; no verify gate applies (workflow-config
  only, no package touched).
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
- update 2026-07-31: still unfixed — `night.yml` still has no
  `install_playwright: true` (confirmed by grep this run). At least
  the eighth night in a row needing the by-hand
  `npx playwright install chromium-headless-shell` workaround before
  the breadth check would run at all; the fix is a one-line addition
  to `.github/workflows/night.yml`.
- update 2026-08-01: still unfixed — `night.yml` still has no
  `install_playwright: true` (confirmed by grep this run; `critique.yml`
  has it, `night.yml` doesn't). Ninth night in a row needing the by-hand
  `npx playwright install chromium` workaround (this run installed the
  full `chromium` browser, not just `chromium-headless-shell` — the
  cache was cold for both) before `npm run e2e:minigames` would run at
  all. Still a one-line fix.
- update 2026-08-02: still unfixed — `night.yml` still has no
  `install_playwright: true` (confirmed by grep this run). Tenth night
  in a row needing the by-hand `npx playwright install
  chromium-headless-shell` workaround before `npm run e2e:minigames`
  would run at all; all six legs (hazard, combat, gathering,
  encounter-routing, exploration-roundtrip, upgradeable-dice) ALL PASS
  once installed. Still a one-line fix.

### [x] Phase 32 Part 1b stalls: two consecutive `/march` ticks spawn a background Explore agent, then end the turn "waiting" on it — zero commits, zero carried research — RESOLVED 2026-07-29 (issue #155)
- issue: #155
- resolution: added Hard rule 11 to `skills/ship-a-phase.md` §7 —
  research sub-agents a tick needs before it can write code must
  run in the foreground (blocking) and get synthesized before the
  turn ends; if backgrounding is still wanted, persist findings to
  a `plan/` scratch note first. Mirrors `skills/digest.md`
  §3.6/§4.7's existing verify/deploy rule, extended to research
  sub-agents.
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

### [x] [2.4] Phase-mirror issue close is unreliable — 9 shipped phases still show open, and even a present trailer once failed — RESOLVED 2026-08-03 (commit 0441c554, issue #166)
- resolution: `loop-issue.mjs close-comment` (the `/iterate` finding-mirror
  close path) never got the active-API-close fix that `phase-close` already
  carried for the same underlying trailer unreliability. Extracted
  `closePhaseIssue` into a shared `closeIssue()` helper and called it from
  `cmdCloseComment` too — it now posts the deploy comment AND closes the
  issue via `gh issue close --reason completed`, idempotent and best-effort,
  mirroring `phase-close`'s pattern exactly. The `Closes #N` trailer is now
  a backup for finding mirrors, not the load-bearing close, matching how
  phase mirrors have worked since Phase 35. Doc comments, help text, and
  `skills/iterate.md` Step 7 updated to match. Root cause of the trailer
  itself no-oping remains unknown — this fix stops depending on it working.
- category: gap
- impact: 4
- ease: 5
- issue: #166
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
- update 2026-07-23: another confirmed instance outside the phase-mirror
  lane — an /iterate finding-mirror issue (#151, blacksmith map-node
  fix) carried a `Closes #151` trailer on its shipping commit
  (`09048b8e`, direct push to `main`, verify + deploy both green) and
  still didn't auto-close; closed by hand. Same symptom as #83/Phase 32
  Part 1 above — a present, correctly-numbered trailer on a direct-to-
  main push sometimes just doesn't fire. Narrows the "which commits"
  question: this isn't phase-mirror-specific, so the root cause is
  probably in how GitHub processes `Closes #N` on this repo's push
  pattern generally, not something particular to `ship-a-phase`'s
  commit shape.
- update 2026-07-29: a third instance, this time on a plain `/iterate`
  finding-mirror issue outside both prior lanes — #155 (ship-a-phase
  foreground-research fix) carried a `Closes #155` trailer on its
  shipping commit (`5bb4e48a`, direct push to `main`, verify green,
  deploy:check reported no gated workflow for the docs-only diff) and
  still didn't auto-close; closed by hand. Three-for-three now on
  "trailer present, didn't fire" (#83, #151, #155) vs. the ~9 "trailer
  missing entirely" cases — two distinct failure populations under one
  row.
- update 2026-07-30: a fourth instance — #129 (`user-issue`-routed
  finding, Queue change log fix) carried a `Closes #129` trailer on its
  shipping commit (`4284562a`, direct push to `main`, verify green,
  deploy:check reported no gated workflow for the docs-only diff) and
  still didn't auto-close; closed by hand. Four-for-four now on
  "trailer present, didn't fire" (#83, #151, #155, #129).
- update 2026-07-30 (second, same day): a fifth instance — #156 (plain
  `/iterate` finding-mirror, the CRITIQUE.md doc-residue drain) carried
  a `Closes #156` trailer on its shipping commit (`7c20b4fd`, direct
  push to `main`, verify green, deploy:check reported no gated workflow
  for this docs-only diff) and still didn't auto-close; closed by hand.
  Five-for-five now on "trailer present, didn't fire" (#83, #151, #155,
  #129, #156) — every observed docs-only-diff close has failed this
  way; worth checking whether the pattern is specific to commits where
  deploy:check finds no gated workflow to confirm against.
- update 2026-07-31: a sixth instance, this time BREAKING the "docs-only
  diff" pattern noted above — #157 (`/march` -> `/iterate` tick,
  exploration-hub StatusCard LEVEL/LVL subtitle fix) carried a
  `Closes #157` trailer on its shipping commit (`16c89f25`, direct push
  to `main`, `verify-mobile` GitHub Actions run completed
  `conclusion: success`) and still didn't auto-close; closed by hand.
  This one DID have a real gated workflow run green against it, ruling
  out "no gated workflow to confirm against" as the sole explanation —
  the failure mode reproduces on both docs-only and code+CI-verified
  commits. Six-for-six now on "trailer present, didn't fire" (#83,
  #151, #155, #129, #156, #157).
- update 2026-08-01: a seventh instance — #160 (`/march` -> `/iterate`
  tick, THEME_KEYWORDS dead-TICK-keyword fix) carried a `Closes #160`
  trailer on its shipping commit (`581b3fe9`, direct push to `main`,
  `verify-mechanics` GitHub Actions run completed `conclusion: success`)
  and still didn't auto-close; closed by hand. Seven-for-seven now on
  "trailer present, didn't fire" (#83, #151, #155, #129, #156, #157,
  #160).
- update 2026-08-01 (digest pulse review): two MORE instances surfaced
  that no `/iterate` tick had caught — #158 (`critique:drive` combat-
  capture fix, shipping commit `ef19091e`, `Closes #158`, 2026-07-31
  20:09) and #159 (WS8.4 control-lock threat-surface fix, shipping
  commit `d0d83e06`, `Closes #159`, 2026-08-01 04:19) both still showed
  `OPEN` on GitHub when this digest checked, and neither had an AUDIT.md
  update note — unlike #157 and #160, whose shipping ticks noticed the
  no-op and closed by hand same-session. Both closed by hand now
  (verify green on both shipping commits per their own commit messages).
  Nine-for-nine now on "trailer present, didn't fire" (#83, #151, #155,
  #129, #156, #157, #158, #159, #160) — chronologically #158 and #159
  actually preceded #160, so the true running count was already 8-for-8
  before #160 shipped. Widens the finding: it isn't just that the
  trailer no-ops: the *catching* of the no-op is itself inconsistent —
  some `/iterate` ticks check and close by hand same-session, others
  (this pair) don't check at all and the issue would sit open
  indefinitely without a `/digest` pulse pass to catch it. Worth adding
  an explicit "confirm the issue actually closed" step to whichever
  skill lands the `Closes #N` trailer, not just relying on the digest's
  periodic sweep.
- update 2026-08-02: a tenth instance — #163 (`/march` -> `/iterate`
  tick, policy-pick draft-scorer newcomer-visibility fix) carried a
  `Closes #163` trailer on its shipping commit (`fbace426`, direct push
  to `main`, `verify-mechanics` GitHub Actions run completed
  `conclusion: success`) and still didn't auto-close; the shipping tick
  noticed the no-op same-session and closed by hand (per §Step 7's
  `close-comment` still showing `OPEN` after posting). Ten-for-ten now
  on "trailer present, didn't fire" (#83, #151, #155, #129, #156, #157,
  #158, #159, #160, #163). No new root-cause signal — same symptom on a
  green, code-changing, direct-to-main commit; the `next` action below
  (root-cause the `Closes #N` no-op) remains the actionable follow-up,
  not yet picked up.
- update 2026-08-02 (digest pulse review): an eleventh instance,
  chronologically the tenth (it shipped before #163 above but the
  shipping tick's own AUDIT note didn't check GitHub) — #162 (pre-fight
  enemy preview VITAE fix) carried a `Closes #162` trailer on its
  shipping commit (`15d45699`, direct push to `main`, `verify-mobile`
  presumed green per the commit's own "full three-workspace `npm run
  verify` green" claim) and still showed `OPEN` on GitHub when this
  digest checked. Same undetected-by-the-shipping-tick pattern as
  #158/#159 (2026-08-01 digest): the `next` action's "catching is
  itself unreliable" widening keeps reproducing. Closed by hand now.
  Eleven confirmed instances total (#83, #151, #155, #129, #156, #157,
  #158, #159, #160, #162, #163).
- update 2026-08-02 (second): a twelfth instance — #164 (`/march` ->
  `/iterate` tick, mobile `docs/combat.md` rewrite draining the
  standing "Engine doc-drift" / "Wrong-engine mental model" CRITIQUE.md
  rows) carried a `Closes #164` trailer on its shipping commit
  (`6690c5d0`, direct push to `main`, docs-only diff, `npm run verify
  --workspace axiomancer-mobile` green — 268/268 suites) and still
  didn't auto-close; the shipping tick noticed the no-op same-session
  and closed by hand. Twelve confirmed instances total (#83, #151,
  #155, #129, #156, #157, #158, #159, #160, #162, #163, #164). No new
  root-cause signal; the `next` action (root-cause the `Closes #N`
  no-op) remains unpicked-up.
- update 2026-08-03: a thirteenth instance — #165 (`/march` ->
  `/iterate` tick, `night.yml` missing `install_playwright: true` fix)
  carried a `Closes #165` trailer on its shipping commit (`ca5b86f1`,
  direct push to `main`, workflow-config-only diff, no verify gate
  applies, `deploy:check` reported no gated workflow to confirm — a
  docs/config-only tick) and still didn't auto-close; the shipping tick
  noticed the no-op same-session and closed by hand. Thirteen confirmed
  instances total (#83, #151, #155, #129, #156, #157, #158, #159, #160,
  #162, #163, #164, #165). No new root-cause signal.

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
