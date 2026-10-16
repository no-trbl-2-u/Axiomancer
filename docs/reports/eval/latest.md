# Loop eval: how well the loop judges its own work

> Ledger stamp: commit `86eea99d` (2026-10-15T18:47:23Z)

A measurement, not a gate (phase EV1, `plan/phases/phase_EV1_loop_eval_ledger.md`). Each section is written by its own script between its markers.

<!-- eval:ledger:start -->

## Escape ledger (EV1a)

Window: `loop:pr` PRs merged 2026-10-12 to 2026-10-15. Stamp: commit `86eea99d` (2026-10-15T18:47:23Z). Regenerate with `node scripts/eval/escape-ledger.mjs`; the data is `docs/reports/eval/ledger.json`.

| Count | Value |
|---|---|
| PRs in the window | 26 |
| Merged before a check on the final head finished | 3 |
| No `verify-*` workflow ran on the final head | 1 |
| Changed code no `verify-*` filter covers | 9 |
| A triggered `verify-*` workflow absent on the final head | 0 |
| A fix or revert touched the same code within 7 days | 12 |
| Antagonist verdict on record at merge | 6 |
| Merged on an antagonist "not a pass" | 1 |

### Seeded escapes

| ID | Escape | Evidence | Gate that should have caught it | Status |
|---|---|---|---|---|
| S1 | #529 merged before CI finished on its final head | PR #529; head 9d44ca5e; merge 93f05dfe | merge gate (branch protection with required checks, not comment matching) | confirmed: finished after merge: verify-mobile; antagonist at merge: not-pass |
| S2 | `pr-resolve` merges cut `plan/CRITIQUE.md` rows apart on `main` | merge c95114a2; merge 49829988; repair 23f06828; repair 662aa10b | a structural lint for the plan queue files | confirmed: all four commits touch plan/CRITIQUE.md |
| S3 | Three tests that could not fail, their acceptance ticked `[x]` | PR #521 A4; PR #523 A6; PR #520 leaked `console.error` spy (near-miss) | a fail-on-parent check for new tests; an acceptance-ID-to-test map | seeded: 2 of 2 named ticks found in the PR bodies; "could not fail" is for EV1b to prove |
| S4 | #526 merged with only Cloudflare Pages run | PR #526; head efc7f371 | CI path filters (a path-coverage audit so no diff merges unverified) | confirmed: ran: Cloudflare Pages: axiomancer; uncovered: 3 file(s) |
| S5 | SF1's brief asked for a `verify:visual` shot of the callout; none was taken | PR #523; plan/phases/phase_SF1_sacrifice_floor_callout.md | the builder's own `[x]` (an acceptance-ID-to-test map) | confirmed: PR #523 body states verify:visual was not run |
| S6 | No gate runs on Android | .github/workflows/verify-*.yml | none exists (an Android smoke test on the preview APK) | confirmed: no verify-* workflow mentions Android |

### Every PR in the window

A follow-up is a fix or revert landing on `main` within 7 days that touched one of the PR's non-bookkeeping files. A shared file names a candidate, not a cause. "After merge" means the check finished after the PR merged, so the merge did not wait for it.

| PR | Merged | Head | Ran on the final head | `verify-*` skipped | Uncovered code | Follow-ups (7d) | Antagonist |
|---|---|---|---|---|---|---|---|
| #505 loop: measured-truth baseline — phase R12a | 2026-10-13T10:26Z | cdba0b85 | Cloudflare Pages: axiomancer success; verify-mechanics success | verify-drift, verify-mobile, verify-prose | 10: .github/workflows/measured-truth.yml, CLAUDE.md, docs/game-model.md, ... | f6bc4f19 fix: cap the combat dock's VITAE column on wide windows (CRITIQUE pass 85 footer dock) | none |
| #507 loop: roster-health lenses — phase RH1 | 2026-10-13T11:42Z | caee9f0b | Cloudflare Pages: axiomancer success; verify-mechanics success; verify-prose success | verify-drift, verify-mobile | 3: docs/game-model.md, skills/iterate.md, skills/ship-a-phase.md | none | none |
| #509 loop: card-spec scaffold and card-rules lint — phase CS1 | 2026-10-13T10:27Z | cd8a8453 | Cloudflare Pages: axiomancer success (after merge); verify-drift success (after merge); verify-mechanics success (after merge); verify-prose success (after merge) | verify-mobile | 2: docs/card-spec.md, docs/truth-sources.md | none | none |
| #512 a11y: hide the faded title CTA under the menu (CRITIQUE pass 79 title a11y) | 2026-10-13T16:57Z | 577060dd | Cloudflare Pages: axiomancer success; verify-mobile success | verify-drift, verify-mechanics, verify-prose | none | 4c2a08bf fix: critique drive waits for the title and dice to settle; EMBARK guard; dice springs rest (CRITIQUE pass 79 drive settle) | none |
| #514 fix: P-07b's printed max holds (AUDIT bug P-07b) | 2026-10-13T21:36Z | 18f01653 | Cloudflare Pages: axiomancer success; verify-mechanics success | verify-drift, verify-mobile, verify-prose | none | none | none |
| #516 fix: refuse a die on a card that cannot be played now (AUDIT RC2 die spent on blocked card) | 2026-10-14T01:13Z | 25480107 | Cloudflare Pages: axiomancer success; verify-mobile success | verify-drift, verify-mechanics, verify-prose | none | f0b58df3 fix: A Plain Blow wears its FREE pill (CRITIQUE pass 85 Blow FREE pill); 5150c634 fix: pr-resolve union merge splits moved queue rows (AUDIT pr-resolve union merge); d82f5365 fix(combat): HUD clock line in full at 11px (CRITIQUE pass 88) | none |
| #520 feat: Globals stack as independent instances (experimental) — phase GS1 | 2026-10-14T02:42Z | 4b1ee463 | Cloudflare Pages: axiomancer success; verify-drift success; verify-mechanics success; verify-mobile success | verify-prose | 2: docs/card-spec.md, docs/game-model.md | f0b58df3 fix: A Plain Blow wears its FREE pill (CRITIQUE pass 85 Blow FREE pill); 5150c634 fix: pr-resolve union merge splits moved queue rows (AUDIT pr-resolve union merge); d82f5365 fix(combat): HUD clock line in full at 11px (CRITIQUE pass 88) | pass |
| #521 feat(mobile): one card face (D91) — phase BT2a | 2026-10-14T02:47Z | d4812993 | Cloudflare Pages: axiomancer success; verify-mobile success | verify-drift, verify-mechanics, verify-prose | none | d82f5365 fix(combat): HUD clock line in full at 11px (CRITIQUE pass 88) | pass |
| #523 feat: the SACRIFICE floor points at the VITAE ring — phase SF1 | 2026-10-14T03:02Z | 5d5fac9b | close-trailers success; Cloudflare Pages: axiomancer success; verify-mechanics success; verify-mobile success | verify-drift, verify-prose | 2: scripts/loop-issue.mjs, scripts/loop-issue.test.mjs | f0b58df3 fix: A Plain Blow wears its FREE pill (CRITIQUE pass 85 Blow FREE pill); 5150c634 fix: pr-resolve union merge splits moved queue rows (AUDIT pr-resolve union merge); d82f5365 fix(combat): HUD clock line in full at 11px (CRITIQUE pass 88) | pass |
| #526 fix(ci): pr-resolve resolves on a dispatched run, not on push (AUDIT infra pr-resolve) | 2026-10-14T03:24Z | efc7f371 | Cloudflare Pages: axiomancer success | verify-drift, verify-mechanics, verify-mobile, verify-prose | 3: .github/workflows/README.md, .github/workflows/pr-resolve.yml, scripts/loop-pr.test.mjs | 5150c634 fix: pr-resolve union merge splits moved queue rows (AUDIT pr-resolve union merge) | pass |
| #528 fix: sealed map nodes draw their mark (CRITIQUE pass 84 sealed node mark) | 2026-10-14T03:40Z | af2c11e5 | Cloudflare Pages: axiomancer success; verify-mobile success | verify-drift, verify-mechanics, verify-prose | none | none | pass |
| #529 feat(mobile): combat footer dock, full-width hand, intent top-left — phase BT2b | 2026-10-14T03:25Z | 9d44ca5e | Cloudflare Pages: axiomancer success; verify-mobile success (after merge) | verify-drift, verify-mechanics, verify-prose | none | f0b58df3 fix: A Plain Blow wears its FREE pill (CRITIQUE pass 85 Blow FREE pill); f6bc4f19 fix: cap the combat dock's VITAE column on wide windows (CRITIQUE pass 85 footer dock); 5150c634 fix: pr-resolve union merge splits moved queue rows (AUDIT pr-resolve union merge); b5b395ad fix(combat): END keeps the dock's right edge on a wide window (CRITIQUE pass 87); d82f5365 fix(combat): HUD clock line in full at 11px (CRITIQUE pass 88) | not-pass (merged anyway) |
| #531 fix: village stall prices read SHILLINGS (CRITIQUE pass 84 village shillings) | 2026-10-14T04:11Z | 49829988 | Cloudflare Pages: axiomancer success; verify-mobile success | verify-drift, verify-mechanics, verify-prose | none | none | none |
| #534 fix: A Plain Blow wears its FREE pill (CRITIQUE pass 85 Blow FREE pill) | 2026-10-14T08:21Z | cd785c17 | Cloudflare Pages: axiomancer success; verify-drift success; verify-mobile success | verify-mechanics, verify-prose | none | 5150c634 fix: pr-resolve union merge splits moved queue rows (AUDIT pr-resolve union merge); d82f5365 fix(combat): HUD clock line in full at 11px (CRITIQUE pass 88) | none |
| #535 fix: cap the combat dock's VITAE column on wide windows (CRITIQUE pass 85 footer dock) | 2026-10-14T08:22Z | 731f08fe | Cloudflare Pages: axiomancer success; verify-mobile success | verify-drift, verify-mechanics, verify-prose | 1: skills/march.md | b5b395ad fix(combat): END keeps the dock's right edge on a wide window (CRITIQUE pass 87) | none |
| #537 fix: critique drive waits for the title and dice to settle; EMBARK guard; dice springs rest (CRITIQUE pass 79 drive settle) | 2026-10-14T11:50Z | 7e216a55 | Cloudflare Pages: axiomancer success; verify-mobile success | verify-drift, verify-mechanics, verify-prose | none | none | none |
| #539 a11y: the dock's phase ledger speaks as one line (CRITIQUE pass 85 ledger a11y) | 2026-10-14T12:39Z | beac7799 | Cloudflare Pages: axiomancer success; verify-mobile success | verify-drift, verify-mechanics, verify-prose | none | 5150c634 fix: pr-resolve union merge splits moved queue rows (AUDIT pr-resolve union merge); b5b395ad fix(combat): END keeps the dock's right edge on a wide window (CRITIQUE pass 87); d82f5365 fix(combat): HUD clock line in full at 11px (CRITIQUE pass 88) | none |
| #541 fix: forge prices read SHILLINGS (CRITIQUE anvil shillings) | 2026-10-14T12:40Z | 7a9478f5 | Cloudflare Pages: axiomancer success; verify-mobile success (after merge) | verify-drift, verify-mechanics, verify-prose | none | none | none |
| #543 fix: pr-resolve union merge splits moved queue rows (AUDIT pr-resolve union merge) | 2026-10-14T16:07Z | a88a5f5c | Cloudflare Pages: axiomancer success; verify-mobile success | verify-drift, verify-mechanics, verify-prose | 2: scripts/loop-pr.test.mjs, scripts/pr-resolve.mjs | d82f5365 fix(combat): HUD clock line in full at 11px (CRITIQUE pass 88) | none |
| #545 fix: hazard cast and stamp springs name mass and energyThreshold (AUDIT hazard springs mass 4) | 2026-10-14T16:08Z | f548516f | Cloudflare Pages: axiomancer success; verify-mobile success | verify-drift, verify-mechanics, verify-prose | none | none | none |
| #549 perf(mobile): Sentry performance on preview builds, combat drag spans — phase PF3 | 2026-10-15T18:23Z | 0fc16b28 | Cloudflare Pages: axiomancer success; verify-mobile success | verify-drift, verify-mechanics, verify-prose | 1: docs/logging.md | none | none |
| #553 perf(mobile): no exploration map under live combat — phase PF4 | 2026-10-15T00:19Z | 988640ae | Cloudflare Pages: axiomancer success; verify-mobile success | verify-drift, verify-mechanics, verify-prose | none | none | none |
| #555 fix(combat): END keeps the dock's right edge on a wide window (CRITIQUE pass 87) | 2026-10-15T05:55Z | cf090553 | Cloudflare Pages: axiomancer success; verify-mobile success | verify-drift, verify-mechanics, verify-prose | none | none | none |
| #557 fix(combat): HUD clock line in full at 11px (CRITIQUE pass 88) | 2026-10-15T14:33Z | 1729a428 | Cloudflare Pages: axiomancer success; verify-mobile success | verify-drift, verify-mechanics, verify-prose | none | none | none |
| #559 a11y: announce the SACRIFICE floor line on each refusal (CRITIQUE antagonist PR #523) | 2026-10-15T14:59Z | 0ac5eded | Cloudflare Pages: axiomancer success; verify-mobile success | verify-drift, verify-mechanics, verify-prose | none | none | none |
| #562 fix: a hazard scar mends at any rest, not only at an inn (AUDIT Scarred never clears) | 2026-10-15T15:05Z | 4ed594e9 | Cloudflare Pages: axiomancer success; verify-mechanics success; verify-mobile success; verify-prose success | verify-drift | none | none | none |

<!-- eval:ledger:end -->

<!-- eval:parent-replay:start -->

## Do the tests fail on the parent? (EV1b)

Stamp: commit `5085b096` (2026-10-15T17:35:13-04:00), over the ledger at `86eea99d`. Regenerate with `node scripts/eval/parent-replay.mjs`; the data is `docs/reports/eval/parent-replay.json`.

Each test file a ledger PR added or changed runs twice in a detached worktree: at the PR's merge (the control), then at the merge's first parent with the PR's version of the file laid over. A file that passes on the parent could not fail: the code it pins was not there yet. A new case is a test title in the PR's version that the parent's version lacks; dynamic titles are not matched. A new case passing on the parent is not a defect by itself: a guard of behaviour the PR must not change (the other direction of a pinned rule) passes there by design.

| Count | Value |
|---|---|
| Test files replayed | 58 |
| Fail on the parent | 54 (11 do not load there) |
| Could not fail (pass on the parent) | 4 |
| Inconclusive (fail at their own merge) | 0 |
| New cases that pass on the parent | 11 |
| Ticked acceptance lines | 65 |
| Ticked lines naming no replayed test | 49 |
| Unproven ticks | 0 |

### Unproven ticks

A ticked acceptance line is unproven when it names at least one test (a file by name, or a new case by a backticked token in the line) and every test it names could not fail.

None.

### Seed S3

- #521 A4: names no replayed test, so the replay can neither prove nor clear it
- #523 A6: names no replayed test, so the replay can neither prove nor clear it

### Every replayed test file

| PR | Test file | In the PR | Verdict | New cases passing on the parent |
|---|---|---|---|---|
| #505 | combat.measured-truth.test.ts | added | fails-on-parent (does not load on the parent) | 0 of 10 |
| #505 | act1-progression.test.ts | changed | fails-on-parent (a case fails on the parent) | 0 of 1 |
| #505 | measured-compare.test.mjs | added | fails-on-parent (does not load on the parent) | 0 of 13 |
| #507 | roster-health.engine.test.ts | added | fails-on-parent (does not load on the parent) | 0 of 19 |
| #509 | card-rules.test.ts | added | fails-on-parent (does not load on the parent) | 0 of 15 |
| #509 | card-rules.engine.test.ts | added | fails-on-parent (does not load on the parent) | 0 of 15 |
| #509 | hermeticity.audit.test.ts | changed | could-not-fail (passes on the parent) | 0 of 0 |
| #509 | check-prose.test.mjs | changed | fails-on-parent (a case fails on the parent) | 0 of 1 |
| #509 | content-drift.test.mjs | changed | fails-on-parent (does not load on the parent) | 0 of 4 |
| #512 | TitleScreen.test.tsx | changed | fails-on-parent (a case fails on the parent) | 0 of 1 |
| #514 | blood-price.engine.test.ts | changed | fails-on-parent (a case fails on the parent) | 0 of 1 |
| #516 | CombatBoard.colorlaw.test.tsx | changed | fails-on-parent (a case fails on the parent) | 0 of 3 |
| #520 | blood-price.engine.test.ts | changed | fails-on-parent (a case fails on the parent) | 2 of 7: the draw fallback takes one deck copy out per instance in play; the witness values a copy with one already in play, and a stacked deck si... |
| #520 | CombatBoard.program-cards.test.tsx | changed | fails-on-parent (a case fails on the parent) | 0 of 1 |
| #521 | CombatBoard.handfan.test.tsx | changed | fails-on-parent (a case fails on the parent) | 1 of 3: the fixture fan overlaps at the phone width (non-vacuity) |
| #521 | CombatBoard.paid-column.test.tsx | changed | fails-on-parent (a case fails on the parent) | 0 of 12 |
| #521 | CombatBoard.playtest-2026-09-04.test.tsx | changed | fails-on-parent (a case fails on the parent) | 1 of 2: at the hand width (120) the ledger is the same single row |
| #521 | CombatCardFace.rarity-D4.test.tsx | changed | fails-on-parent (a case fails on the parent) | 1 of 3: does NOT print it on a small face — the name band is the name’s |
| #521 | CombatCardFace.seamless.test.tsx | added | fails-on-parent (a case fails on the parent) | 0 of 2 |
| #521 | CombatRewardsOverlay.test.tsx | changed | fails-on-parent (a case fails on the parent) | 0 of 1 |
| #523 | blood-price.engine.test.ts | changed | fails-on-parent (a case fails on the parent) | 0 of 4 |
| #523 | CombatBoard.colorlaw.test.tsx | changed | could-not-fail (passes on the parent) | 0 of 0 |
| #523 | CombatBoard.sacfloor.test.tsx | added | fails-on-parent (does not load on the parent) | 0 of 14 |
| #523 | card-program.engine.test.ts | changed | fails-on-parent (a case fails on the parent) | 0 of 1 |
| #523 | loop-issue.test.mjs | changed | fails-on-parent (does not load on the parent) | 0 of 3 |
| #526 | loop-pr.test.mjs | changed | fails-on-parent (a case fails on the parent) | 0 of 1 |
| #528 | ExplorationNode.test.tsx | changed | fails-on-parent (a case fails on the parent) | 0 of 2 |
| #529 | CombatBoard.S1-board.test.tsx | changed | fails-on-parent (a case fails on the parent) | 0 of 2 |
| #529 | CombatBoard.footer-dock.test.tsx | added | fails-on-parent (does not load on the parent) | 0 of 9 |
| #529 | CombatBoard.fresh-eyes-repair.test.tsx | changed | fails-on-parent (a case fails on the parent) | 0 of 2 |
| #529 | CombatBoard.handfan.test.tsx | changed | fails-on-parent (a case fails on the parent) | 1 of 4: a five-card fan at 375 shows the start of every covered name (A6) |
| #529 | CombatBoard.playtest-2026-09-04.test.tsx | changed | fails-on-parent (does not load on the parent) | 0 of 0 |
| #529 | CombatBoard.sacfloor.test.tsx | changed | fails-on-parent (a case fails on the parent) | 0 of 1 |
| #529 | CombatBoard.sig-column.test.tsx | added | fails-on-parent (does not load on the parent) | 0 of 7 |
| #529 | CombatEncounterPanel.log.test.tsx | changed | fails-on-parent (a case fails on the parent) | 0 of 5 |
| #531 | stall-price-shillings.critique-84.test.tsx | added | fails-on-parent (a case fails on the parent) | 0 of 1 |
| #534 | card-program.engine.test.ts | changed | fails-on-parent (a case fails on the parent) | 0 of 0 |
| #534 | combat-card-vm.test.ts | changed | fails-on-parent (a case fails on the parent) | 0 of 3 |
| #535 | CombatBoard.footer-dock.test.tsx | changed | fails-on-parent (a case fails on the parent) | 0 of 1 |
| #537 | TitleScreen.test.tsx | changed | fails-on-parent (a case fails on the parent) | 0 of 1 |
| #537 | critique-drive.test.mjs | changed | fails-on-parent (a case fails on the parent) | 0 of 1 |
| #537 | dice-roll-ritual.test.ts | changed | fails-on-parent (a case fails on the parent) | 0 of 0 |
| #539 | CombatBoard.footer-dock.test.tsx | changed | fails-on-parent (a case fails on the parent) | 0 of 1 |
| #541 | forge-vocabulary.S5-talk-C12.test.tsx | changed | fails-on-parent (a case fails on the parent) | 1 of 2: spells the purse out in SHILLINGS, the unit the prices are in |
| #541 | blacksmith.engine.test.ts | changed | fails-on-parent (a case fails on the parent) | 0 of 0 |
| #543 | card-program.engine.test.ts | changed | could-not-fail (passes on the parent) | 0 of 0 |
| #543 | loop-pr.test.mjs | changed | fails-on-parent (a case fails on the parent) | 0 of 1 |
| #545 | HazardOverlays.test.tsx | changed | fails-on-parent (a case fails on the parent) | 0 of 1 |
| #549 | CombatEncounterPanel.drag-spans.test.tsx | added | fails-on-parent (a case fails on the parent) | 0 of 5 |
| #549 | monitoring.test.ts | added | fails-on-parent (a case fails on the parent) | 0 of 8 |
| #553 | EncounterModalOverlay.test.tsx | changed | fails-on-parent (a case fails on the parent) | 1 of 3: leaving it out changes nothing |
| #553 | map-under-combat-modes.engine.test.tsx | added | fails-on-parent (a case fails on the parent) | 2 of 3: prelude: the map stays mounted behind the modal; aftermath: the map comes back behind the modal |
| #553 | map-under-combat.engine.test.tsx | added | fails-on-parent (a case fails on the parent) | 1 of 5: no encounter: the map is mounted |
| #555 | CombatBoard.footer-dock.test.tsx | changed | fails-on-parent (a case fails on the parent) | 0 of 0 |
| #557 | legibility-sweep.engine.test.ts | changed | fails-on-parent (a case fails on the parent) | 0 of 1 |
| #559 | CombatBoard.sacfloor.test.tsx | changed | fails-on-parent (a case fails on the parent) | 0 of 1 |
| #562 | rest-shelter.engine.test.ts | changed | could-not-fail (passes on the parent) | 0 of 0 |
| #562 | hazard-scar-rest-recovery.engine.test.ts | changed | fails-on-parent (a case fails on the parent) | 0 of 3 |

<!-- eval:parent-replay:end -->

<!-- eval:seeded:start -->

## Planted defects (EV1c, A6)

Stamp: commit `b0ac22f8` (2026-10-16T02:49:04Z). Regenerate with `node scripts/eval/seeded-replay.mjs`; the data is `docs/reports/eval/seeded.json`.

Each real bug of 2026-10-14 is planted again by reverting its fix's source (not its tests) in a detached worktree that is never pushed. Each mechanical gate then meets it:

- **CI path filters**: a `verify-*` workflow triggers on the planted paths.
- **verify, tests as they stood**: the related tests at the fix's parent, where the bug lived.
- **verify, with the fix's tests**: the related tests at the fix, with its source reverted.

A related test that also fails at the unplanted fix (the control run) is noise and is dropped from both test gates; the JSON names it.

The related tests are the test files beside a planted file whose names start with its name, plus the files the fix itself changed. The antagonist, `/critique` and the merge gate are agent or session judges and are scored from the ledger, not replayed (brief Decisions).

| Seed | Bug | Fix | Planted paths | CI path filters | verify, tests as they stood | verify, with the fix's tests |
|---|---|---|---|---|---|---|
| D1 (#534) | `riderPairs` ignored damage riders, so A Plain Blow drew no FREE pill | 4080f4a0 | axiomancer-mobile/components/combat/glyphShapes.ts, axiomancer-mobile/state/presenters/card-program.engine.ts, axiomancer-mobile/state/presenters/combat-encounter.engine.ts, scripts/build-catalog.mjs | missed (verify-drift.yml, verify-mobile.yml triggers, and its related tests pass) | missed | caught (card-program.engine.test.ts, combat-card-vm.test.ts) |
| D2 (#523) | a loose die drop refused at the SACRIFICE floor showed no VITAE ring callout (#523's own follow-up) | cfadbf7a | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx | missed (verify-mobile.yml triggers, and its related tests pass) | missed | caught (CombatBoard.sacfloor.test.tsx) |
| D3 (#529) | the leftmost hand card's FREE pill was clipped at the screen edge (#529's final head) | 9d44ca5e | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx | missed (verify-mobile.yml triggers, and its related tests pass) | missed | caught (CombatBoard.handfan.test.tsx) |
| D4 (#543) | the `pr-resolve` union merge split moved queue rows | 80ea6f44 | scripts/pr-resolve.mjs | missed (no `verify-*` workflow triggers on these paths) | missed | caught (loop-pr.test.mjs) |

CI path filters: 0 of 4 caught; verify, tests as they stood: 0 of 4 caught; verify, with the fix's tests: 4 of 4 caught.

<!-- eval:seeded:end -->

<!-- eval:mutation:start -->

## Mutation scores (EV1c, A5)

Stamp: commit `b0ac22f8` (2026-10-16T02:49:04Z). Regenerate with `npm run eval:mutation`; the data, with every survivor, is `docs/reports/eval/mutation.json`.

StrykerJS mutates the named files and runs the workspace's own tests against each mutant, in a detached worktree. The score is killed plus timed-out mutants over every mutant that compiled, uncovered ones included. A survivor is a change to the code that no test noticed. Never part of `verify`.

| Target | Files | Mutants | Killed | Timed out | Survived | No coverage | Score | Run |
|---|---|---|---|---|---|---|---|---|
| mechanics: combat resolution | 0 | 820 | - | 4 | 121 | - | n/a | over budget (1380s): 694 of 820 tested, 121 survived, 1380s |
| mobile: combat presenters | 0 | 2276 | - | 2 | 6 | - | n/a | over budget (1380s): 564 of 2276 tested, 6 survived, 1380s |

### Per file

| File | Mutants | Survived | No coverage | Score |
|---|---|---|---|---|

### Survivors: mechanics: combat resolution

No report (over budget (1380s): 694 of 820 tested, 121 survived).

### Survivors: mobile: combat presenters

No report (over budget (1380s): 564 of 2276 tested, 6 survived).

<!-- eval:mutation:end -->

<!-- eval:miss-rates:start -->

## Miss rate per judge (EV1c, A7)

Stamp: commit `15a2fa76` (2026-10-16T07:25:59Z). Regenerate with `node scripts/eval/miss-rates.mjs`; inputs: ledger at `86eea99d`, parent replay at `5085b096`, planted defects at `b0ac22f8`, mutation at `b0ac22f8`.

| Judge | Missed | Of | Rate | Rows it comes from | How it is counted |
|---|---|---|---|---|---|
| CI and its path filters | 4 | 4 | 100% | D1 (#534), D2 (#523), D3 (#529), D4 (#543) | 1 of 4 planted defects trigger no `verify-*` workflow (D4). Path coverage: 9 of 26 ledger PRs changed code no filter covers (#505, #507, #509, #520, #523, #526, #535, #543, #549). |
| `verify` | 4 | 4 | 100% | D1 (#534), D2 (#523), D3 (#529), D4 (#543) | Tests as they stood at each fix's parent. Each fix's own tests catch its defect: 4 of 4. Mutation: mechanics: combat resolution: over budget (1380s): 694 of 820 tested, 121 survived; mobile: combat presenters: over budget (1380s): 564 of 2276 tested, 6 survived. |
| The antagonist | 4 | 5 | 80% | #520 (S3), #521 (S3), #523 (S3, S5), #526 (S4) | Denominator: PRs carrying a seeded escape that the antagonist reviewed before merge. It reviewed 6 of 26 ledger PRs; 1 drew a "not a pass". |
| `/critique` | not measured | - | - | - | it plays the deployed web build after merge and no ledger row records what a pass saw against what had escaped, so it has no denominator. Context: 5 follow-up fix(es) in the ledger cite a critique pass. |
| The merge gate | 3 | 26 | 11.5% | #509, #529, #541 | A miss is a merge before every check on the final head finished, or over an antagonist "not a pass" (S1). |
| The builder's own `[x]` | 3 | 65 | 4.6% | #521 A4 (S3), #523 A6 (S3), #523 verify:visual (S5) | Misses: ticks the parent replay found unproven (0), the seeded S3 ticks and S5's missing shot. 49 of 65 ticks name no test, so the replay can neither prove nor clear them. |

Android has no gate at all (S6), so it has no rate (brief Decisions).

<!-- eval:miss-rates:end -->
