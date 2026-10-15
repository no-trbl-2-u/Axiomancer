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
