# Critique log

> Last pass: 2026-06-20 at commit d652daf
> Pass count: 49

> External-observer feedback for Axiomancer Mobile. Populated by
> `/critique`, drained by `/iterate`. See `skills/critique.md`
> for the contract.
>
> **Green-deploy gate dropped (set via `/oversight` 2026-06-07).**
> Every prior "fire pass N once a green deploy lands" directive is
> hereby **superseded** — it was a structural deadlock: EAS builds
> are user-triggered, so no green deploy ever auto-fires and the
> gate stayed closed indefinitely. `/critique` should now fire on
> its normal rate-limit (>=12 commits or >=24h since the last pass)
> as a **repo-proxy pass** — the mode pass 18 already used for
> mobile/EAS, reading docs/specs/artifacts as the "fresh maintainer"
> proxy per `plan/bearings.md`. No deploy-state precondition.
>
> **Superseded directives pruned (via /oversight 2026-06-08).** The
> 2026-05-15 pass-5 policy, the 2026-05-18 / 2026-05-21 "fire pass N
> once a green deploy lands" directives, and the 19th/20th-call
> re-affirmations were all superseded by the green-deploy-gate-dropped
> directive above and the loop's current rate-limit rhythm; removed to
> keep this header actionable.

## Pending

<!-- Pass 49 (2026-06-20, commit d652daf): repo-proxy pass —
     Auth: none, no live URL (mobile/EAS). Per plan/bearings.md,
     critique reads docs/specs/artifacts as the "fresh maintainer"
     proxy. The passes 45–48 reader blocker is CLEARED: the `reader`
     sub-agent spawned successfully on the first attempt this pass by
     passing an explicit `model: sonnet` override on the Agent call,
     bypassing the retired `claude-sonnet-4-20250514` pin that lived in
     runtime config outside `.claude/agents/reader.md`. Reader examined
     README.md, docs/README.md, specs/README.md, plan/bearings.md,
     setup/, SVG_ASSET_SPEC.md, package.json, VISION.md and returned 7
     findings (2 high). After self-assessment: 6 filed below; 1 dropped
     as duplicate of the open pass-44 docs/README engine-upgrade row
     (that row enriched with pass-49 specifics instead). The standing
     theme: package.json moved to engine ^0.24.0 and several docs
     (bearings, README, docs/README, specs) carry stale version/status
     lines that never followed. -->

### [MED] Gathering tutorial allows early descent and leaves stale TAKE copy (Kid playthrough 2026-06-23)
- category: bug
- impact: 5 (first-time Gathering instruction can tell the player to act on Verge plots after the board has already moved to Wet Hollow)
- ease: ? (likely tutorial-step gating/copy in `components/gathering/tutorial-steps.ts` / gathering screen controls)
- observed: daily Kid gathering ladder 2026-06-23 on exported web main `59efe7e`.
  - Repro: `/dev` → `DEBUG · GATHERING` → `GO GLEANING` → start tutorial → choose `THE TENDER HAND` → at `FIRST GLEANING 2/7 TAKE SOMETHING`, click `DESCEND` before taking a plot.
  - Observed: board moves to `THE WET HOLLOW`, but coach remains on `TAKE SOMETHING` and still says `WAX SHELF is free; the moss costs 1`, referring to the prior Verge spread.
  - Harness status: `npm run e2e:gathering` still passes; current harness does not catch this out-of-order tutorial path.
- next: disable/soft-block `DESCEND` until the tutorial reaches the descent step, or make the tutorial copy derive from the current spread/depth; add a regression assertion.
- source: Kid daily playthrough (2026-06-23)

### [LOW] Gathering disabled offerings explain cost but not why unavailable (Kid playthrough 2026-06-23)
- category: UX
- impact: 3 (players can infer affordability, but the restraint economy is strongest when offerings explain exact missing cost/material)
- ease: ?
- observed: daily Kid gathering ladder 2026-06-23.
  - Repro: enter Gathering via `/dev` → `DEBUG · GATHERING`, inspect disabled offering chips such as `THE COIN TOLL`, `THE SWEET SMOKE`, or `THE BLOOD TITHE` when shillings/materials are insufficient.
  - Observed: disabled offerings are visibly dimmed and functionally no-op when clicked, but aria/copy primarily states the demand (`pay 6 shillings`, `pay a RESIN piece`) rather than why it is currently unavailable.
  - Positive control: `WARDEN'S BELL` and `HORN SICKLE` functioned in bug-hunt/regression checks; this is clarity debt, not a hard blocker.
- next: add disabled reason text/aria (`need N shillings`, `no RESIN piece in satchel`, etc.) and keep no-op behavior covered.
- source: Kid daily playthrough (2026-06-23)

### [MED] Hazard reward preview serializes keyword objects as `[object Object]` (Kid playthrough 2026-06-22)
- category: bug
- impact: 6 (hazard reward choice comprehension is degraded at exactly the moment deck-growth meaning should be clearest)
- ease: ? (likely reward keyword normalization/rendering in `components/hazard/RewardsOverlay.tsx` or engine keyword shape)
- observed: daily Kid hazard ladder 2026-06-22 on exported web main `a6cff8a` before later rebase to `acdc632`.
  - Repro: `/dev` → `DEBUG · TRIGGER ENCOUNTER` → `HAZARD`, set/drive Cracked Cliff Safe seed `1`, reach rewards, preview `SWIFT CURRENT` or related reward.
  - Observed preview line: `KEYWORDS: [object Object], [object Object], [object Object]`.
  - Reward tiles remained selectable and the minigame could close cleanly; this is comprehension debt, not a hard blocker.
- next: normalize keyword labels before render and cover reward preview with a component/e2e assertion.
- source: Kid daily playthrough (2026-06-22)

### [LOW] Hazard staged-card trash gesture silently unstages instead of explaining discard behavior (Kid playthrough 2026-06-22)
- category: UX
- impact: 3 (players can mistake unstage for discard or think trash failed)
- ease: ? (needs doctrine decision: forbid with feedback or support explicit staged discard)
- observed: daily Kid hazard ladder 2026-06-22 on exported web main `a6cff8a` before later rebase to `acdc632`.
  - Repro: enter Hazard board, stage one card, drag staged card to trash.
  - Observed: staged count returned to hand and discard count stayed unchanged (`DECK 20 · DISCARD 0`, staged `1 → 0`, hand `4 → 5`) with no explicit feedback.
- next: add feedback or formalize staged-card-to-trash behavior in UI copy/tests.
- source: Kid daily playthrough (2026-06-22)

### [LOW] Hazard/dev menu accessibility route can no-op under browser automation while direct `/dev` works (Kid playthrough 2026-06-22)
- category: tests
- impact: 2 (daily evidence can fall back to `/dev`, but the player/dev path is brittle for automation)
- ease: ?
- observed: daily Kid hazard ladder 2026-06-22 on exported web main `a6cff8a` before later rebase to `acdc632`.
  - Repro: `/character` → SELF → click `Open dev tools` with accessibility/browser tooling; in several runs the snapshot remained on SELF.
  - Direct `/dev` route and Playwright/test-id activation of hazard controls still worked; committed `npm run e2e:hazard` passed.
- next: keep committed e2e route truth current and consider a narrow accessibility/navigation assertion for `self-dev-tools-link`.
- source: Kid daily playthrough (2026-06-22)

### [x] [needs-user-call → RESOLVED] reader sub-agent malfunction (passes 45–48) ✅
- pass: 48 (commit 1e9e12b; first seen pass 45 at 69e4ae2)
- viewport: n/a (repo-proxy)
- category: infra
- observation: `/critique` passes 45–48 could not run because the
  mandated `reader` sub-agent failed to spawn with `API Error: 404
  model: claude-sonnet-4-20250514` on every invocation (8 total). The
  retired model id was pinned in runtime config outside
  `.claude/agents/reader.md` (which declares no `model:` field).
- evidence: `API Error: 404 {"type":"not_found_error","message":"model:
  claude-sonnet-4-20250514"}` across passes 45–48.
- resolution: 2026-06-20 (pass 49). Worked around at the call site by
  passing an explicit `model: sonnet` override on the `reader` Agent
  invocation, which resolves to a currently-available Sonnet id and
  bypasses the stale runtime pin. The reader spawned and returned a
  full finding set on the first attempt. Durable fix (so future passes
  don't need the override): add a `model:` line to
  `.claude/agents/reader.md` or correct the retired id in runtime
  config — but the loop is no longer blocked either way.
- source: repo-proxy

### [HIGH] /plan/bearings.md — Stale "setup runbooks not yet authored" disclaimer redirects new maintainers away from authoritative docs
- pass: 49 (commit d652daf)
- viewport: desktop
- auth_state: anonymous
- category: navigation
- observation: bearings.md tells a fresh maintainer the `setup/NN_*.md`
  runbooks "are not yet authored" and to "treat agents.md Operational
  secrets as the canonical config doc" — but all four runbooks now exist
  on disk and are the real setup path. The disclaimer actively steers new
  contributors away from the authoritative docs.
- evidence: bearings.md line 82: "The `setup/NN_*.md` runbooks are not
  yet authored — they're queued in phase candidates." `ls setup/` returns
  01_repository.md, 02_eas.md, 03_store_setup.md, 04_claude_playtest.md.
- suggested fix: Remove/rewrite the bearings.md disclaimer to point at the
  now-authored setup/ runbooks as the canonical setup path.
- source: file-read

### [MED] /plan/bearings.md + /README.md — Engine version drift: package.json on ^0.24.0, README says ^0.22.0, bearings says ^0.21.0
- pass: 49 (commit d652daf)
- viewport: desktop
- auth_state: anonymous
- category: comprehension
- observation: Three documents disagree on the current engine pin.
  package.json has moved to ^0.24.0, but README's "Current engine
  version" line still reads ^0.22.0 (its pass-44 fix is stale again after
  two more bumps) and the bearings Stack table + setup note still cite
  ^0.21.0. A new maintainer cannot tell which is authoritative.
- evidence: package.json line 43 `"axiomancer-mechanics": "^0.24.0"`;
  README.md line 260 `Current engine version: axiomancer-mechanics
  ^0.22.0`; bearings.md line 62 `pinned ^0.21.0` and line 79 `currently
  ^0.21.0`.
- suggested fix: Update README.md line 260 and bearings.md lines 62/79 to
  ^0.24.0 to match package.json (single source of truth).
- source: file-read

### [MED] /specs/README.md — Spec 12 shown as open/"ready to start" but it was implemented at b0572aa
- pass: 49 (commit d652daf)
- viewport: desktop
- auth_state: anonymous
- category: navigation
- observation: specs/README.md "Next recommended work" says "Specs 10-12
  remain open and are ready to start" and the Spec 12 row carries no
  [DONE] tag, but plan/CRITIQUE.md records Spec 12 (accessibility &
  theming) implemented at commit b0572aa. A maintainer would pick up
  already-shipped work.
- evidence: specs/README.md line 61 "Specs 10-12 remain open and are ready
  to start"; line 87 Spec 12 row has no [DONE] marker. CRITIQUE.md line
  439 records `[HIGH] /specs/12 ... ✅ addressed at commit b0572aa`.
- suggested fix: Add a `[DONE on … — see commit b0572aa]` tag to the Spec
  12 row and drop 12 from the "remain open" list (verify 10/11 status too).
- source: file-read

### [MED] /specs/README.md — Intro references two files that do not exist in the repo (GAME-ROADMAP.md, Knowledge-Gaps.md)
- pass: 49 (commit d652daf)
- viewport: desktop
- auth_state: anonymous
- category: comprehension
- observation: The specs/README.md intro — the entry point to the spec
  set — points readers at `GAME-ROADMAP.md` and `Knowledge-Gaps.md` as if
  present and readable. Neither file exists anywhere in the repo, so a new
  maintainer hits two dead references on the first paragraph they read.
- evidence: specs/README.md lines 10-11 reference `GAME-ROADMAP.md` and
  `Knowledge-Gaps.md`; `ls specs/GAME-ROADMAP.md specs/Knowledge-Gaps.md`
  returns no such files (exit 2).
- suggested fix: Either create the two files (even as stubs) or rewrite the
  intro to drop the references to non-existent docs.
- source: file-read

### [LOW] /README.md — Scripts table omits four e2e scripts that exist in package.json
- pass: 49 (commit d652daf)
- viewport: desktop
- auth_state: anonymous
- category: navigation
- observation: The README Scripts table documents `e2e:hazard` but omits
  four sibling e2e scripts defined in package.json, so `npm run` surfaces
  undocumented commands to a new maintainer.
- evidence: package.json lines 26-29 define `e2e:gathering`,
  `e2e:encounters`, `e2e:theme`, `e2e:minigames`; README.md line 114 lists
  only `e2e:hazard`.
- suggested fix: Add rows for the four missing e2e scripts to the README
  Scripts table, matching the one-line `e2e:hazard` description pattern.
- source: file-read

<!-- Pass 44 (2026-06-15, commit 2da7843): repo-proxy pass —
     Auth: none, no live URL (mobile/EAS). Per plan/bearings.md,
     critique reads docs/specs/artifacts as the "fresh maintainer"
     proxy. Focus on general repository comprehension for new
     contributors. Examined README.md, docs/README.md, specs/README.md,
     setup/, SVG_ASSET_SPEC.md, package.json, plan/README.md.
     3 findings filed below. Pass 43 HIGH finding resolved (setup files created). -->

### [x] [MED] /README.md — Engine version pinning documentation inconsistent ✅
- pass: 44 (commit 2da7843)
- viewport: desktop
- auth_state: anonymous
- category: comprehension
- observation: README and bearings.md give conflicting guidance about engine pinning strategy causing confusion about upgrade policies
- evidence: README line 233 states "Current engine version: axiomancer-mechanics ^0.21.0" but bearings.md lines 79-80 specify "exact" pinning after drift incident and package.json shows caret usage
- suggested fix: Align documentation to clarify exact vs caret pinning strategy
- source: file-read
- addressed: 2026-06-19 via commit d88ace6 (issue #473). README "Current engine version" corrected to ^0.22.0 to match package.json; 0.21.0→0.22.0 upgrade doc surfaced as the latest reference.

### [MED] /docs/README.md — Engine upgrade documentation outdated for current version
- pass: 44 (commit 2da7843)
- viewport: desktop
- auth_state: anonymous
- category: comprehension
- observation: Documentation references multiple old engine upgrade guides but lacks current 0.21.0 upgrade context
- evidence: Shows upgrade paths from 0.7.0-0.16.0 in lines 24-33 but current is 0.21.0, missing recent upgrade documentation chain
- suggested fix: Add note indicating which upgrade docs are historical vs current or provide 0.20.0-to-0.21.0 reference
- source: file-read
- pass-49 re-confirmed (commit d652daf): still open and now further out of
  date. The docs/README.md engine-upgrade table line 27 still labels
  `0.15.1-to-0.16.0.md` as "Latest upgrade to 0.16.0" (HELPFUL), yet two
  newer guides exist on disk — `docs/engine-upgrade-0.20.0-to-0.21.0.md`
  and `docs/engine-upgrade-0.21.0-to-0.22.0.md` — neither listed in the
  table. Fix should add rows for both newer guides and demote the 0.16.0
  row from "Latest" to REFERENCE. (Pass-49 reader finding merged here as
  duplicate rather than filed separately.)

### [LOW] /SVG_ASSET_SPEC.md — Asset completion checklist lacks context
- pass: 44 (commit 2da7843)
- viewport: desktop
- auth_state: anonymous
- category: comprehension
- observation: Asset replacement checklist shows items completed without commit references or completion dates
- evidence: Lines 261-263 show completed items "GlyphHeart" and "GlyphBody" but no indication of when or how replacement was done
- suggested fix: Add commit references or completion dates to completed checklist items
- source: file-read
- resolution: Duplicate of pass-41 finding already addressed at commit e253c8d (2026-06-14). The "Coming Soon" annotations are the intentional treatment — the runbooks are acknowledged as not-yet-authored rather than silently broken. Closed via oversight 2026-06-15.

### [LOW] /docs/README.md — Duplicate priority classification creates confusion
- pass: 43 (commit 772f0c0)
- viewport: desktop
- auth_state: anonymous
- category: navigation
- observation: Testing documentation table lists both testing.md and testing-guide.md with overlapping purposes and priority ratings that don't clearly distinguish use cases
- evidence: Lines 10-21: testing.md marked 'ESSENTIAL' and testing-guide.md marked 'HELPFUL' but both described as testing guidance without clear functional distinction
- suggested fix: Clarify distinct purposes or consolidate into single testing reference
- source: file-read

### [x] [MED] /README.md — Engine version mismatch between documentation and package.json ✅
- pass: 41 (commit a185532)
- viewport: repository
- auth_state: anonymous
- category: comprehension
- observation: README.md has conflicting information about engine version - states 'axiomancer-mechanics ^0.20.0' in AI workflow section but package.json shows ^0.21.0
- evidence: Line 233: 'Current engine version: `axiomancer-mechanics ^0.20.0`' vs package.json line 41: 'axiomancer-mechanics': '^0.21.0'
- suggested fix: Update README.md line 233 to reflect actual engine version ^0.21.0
- source: repo-proxy
- addressed: 2026-06-19 via commit d88ace6 (issue #473). README "Current engine version" now reads ^0.22.0 (current package.json truth, two minors ahead of this finding's snapshot); upgrade-doc list updated to surface 0.21.0→0.22.0 as the latest.


### [MED] /SVG_ASSET_SPEC.md — Asset specification unclear when relevant for new maintainers
- pass: 41 (commit a185532)
- viewport: repository
- auth_state: anonymous
- category: comprehension
- observation: SVG_ASSET_SPEC.md opens with warning for fresh maintainers but then provides complex asset replacement workflow without clear entry point for when this becomes relevant
- evidence: Lines 5-12 warn fresh maintainers they 'likely don't need this file yet' but no guidance on when they WOULD need it or how to know when asset replacement phase begins
- suggested fix: Add clear trigger conditions like 'Start using this when Spec 11 (asset pipeline) is ready to implement'
- source: repo-proxy

### [MED] /specs/README.md — Spec completion status lacks verification guidance for new contributors
- pass: 41 (commit a185532)
- viewport: repository
- auth_state: anonymous
- category: navigation
- observation: Specs README claims 'Specs 1-9 are complete' but doesn't clearly explain what this means for new contributors or how to verify completion status
- evidence: Lines 59-66 state completion but a new maintainer has no way to verify this claim or understand what 'complete' means in this context
- suggested fix: Add verification instructions or link to committed evidence showing spec completion (like PR links)
- source: repo-proxy

### [MED] /docs/README.md — Documentation priority labels lack clear definitions
- pass: 41 (commit a185532)
- viewport: repository
- auth_state: anonymous
- category: navigation
- observation: Documentation README uses inconsistent priority labeling (ESSENTIAL vs HELPFUL vs REFERENCE) without explaining what these categories mean for new maintainers
- evidence: Priority column uses three levels but no legend explains whether ESSENTIAL means 'read first' or 'read before contributing' or something else
- suggested fix: Add priority legend explaining what ESSENTIAL/HELPFUL/REFERENCE mean for different contributor goals
- source: repo-proxy

### [MED] /plan/bearings.md — Bearings file overwhelming for fresh maintainers seeking project overview
- pass: 41 (commit a185532)
- viewport: repository
- auth_state: anonymous
- category: comprehension
- observation: Bearings file contains dense autonomous loop context that overwhelms fresh maintainers trying to understand basic project structure and contribution workflow
- evidence: File mixes basic project info with advanced autonomous loop configuration, deploy gates, and operational secrets in a 348-line document without clear sections for different audience needs
- suggested fix: Split into bearings-overview.md for new contributors and bearings-loop.md for autonomous operation details
- source: repo-proxy

<!-- Pass 40 (2026-06-13, commit f270824): repo-proxy pass —
     Auth: none, no live URL (mobile/EAS). Per plan/bearings.md,
     critique reads docs/specs/artifacts as the "fresh maintainer"
     proxy. Focus on general repository comprehension for new
     contributors. Examined README.md, VISION.md, docs/README.md,
     specs/README.md, setup/, app/_layout.tsx, package.json, bearings.md.
     4 findings filed below. -->

<!-- Kid daily playthrough (2026-06-14, commit 774760d): hazard encounter-learning ladder.
     Filed transient play blockers from live browser evidence; durable play doctrine lives in
     Hermes skill reference kid-encounter-agents/hazard.md. -->

### [x] [HIGH] Hazard debug entry can mount hidden hazard UI while SELF/WILDS remains visible ✅
- pass: Kid daily playthrough 2026-06-14 (commit 774760d)
- viewport: live Expo web at http://127.0.0.1:8081/
- auth_state: anonymous/dev menu
- category: playthrough blocker
- observation: Hazard debug entry intermittently leaves the player-visible screen on SELF or WILDS while hazard intro/test IDs are mounted behind it.
- evidence: Five-run hazard ladder run 4 saw `SELF → DEV MENU → DEBUG · HAZARD → BRAVE IT` create `hazard-intro-overlay`/`hazard-intro-continue` DOM with `THE FAMINE MARCH` text while browser snapshot/vision still showed SELF; category trigger could return to WILDS with no visible minigame.
- suggested fix: Reconcile debug encounter routing and route lifecycle so hazard entry produces a visibly rendered intro/route-select/board, not hidden mounted state behind the previous screen.
- source: Kid encounter-learning ladder
- addressed: 2026-06-14 via commit 6c3b022
- fix: Improved HazardGate navigation reliability with defensive timeout, error handling, and duplicate navigation prevention to ensure route transitions complete properly without mounting hidden UI behind previous screens.

### [MED] Hazard dev trigger requires DOM/test-ID activation more reliably than player/accessibility click
- pass: Kid daily playthrough 2026-06-14 (commit 774760d)
- viewport: live Expo web at http://127.0.0.1:8081/
- auth_state: anonymous/dev menu
- category: accessibility/automation
- observation: The documented `SELF → DEV MENU → DEBUG · TRIGGER ENCOUNTER → HAZARD` route sometimes does not visibly fire through accessibility-level browser clicks, while DOM/test-ID activation succeeds.
- evidence: Ladder runs 1 and 5 both reported first-click or accessibility-click no visible transition; run 5 reached hazard after `document.querySelector('[data-testid="debug-trigger-encounter-hazard"]').click()`.
- suggested fix: Make the debug hazard trigger a normal accessible control with reliable visible navigation, or document and expose the direct `DEBUG · HAZARD` fallback intentionally.
- source: Kid encounter-learning ladder

### [x] [HIGH] /VISION.md — Vision document uses inconsistent voice between archaic game language and modern technical language ✅
- pass: 40 (commit f270824)
- viewport: repository
- auth_state: anonymous
- category: voice
- observation: Vision document uses inconsistent voice between archaic game language and modern technical language within same sections
- evidence: Lines 42-66 mix archaic terms like 'Befriend' and 'friendship counters' with modern technical language like 'modal when the engine emits the state' and 'status effect whose only purpose is qualifying future Befriend paths'
- suggested fix: Maintain consistent archaic voice throughout vision document or clearly separate technical implementation details from game vision
- source: repo-analysis
- addressed: 2026-06-14 via commit 4c54c1f

### [MED] /README.md — Repository navigation section lacks clear priority guidance for new contributors
- pass: 40 (commit f270824)
- viewport: repository
- auth_state: anonymous
- category: comprehension
- observation: Repository navigation section provides comprehensive directory coverage but doesn't clearly prioritize which documentation to read first for new contributors
- evidence: Lines 16-24 list multiple documentation directories (VISION.md, docs/adr/, specs/, plan/, docs/, setup/) without clear guidance on essential vs optional reading for first-time contributors
- suggested fix: Add priority indicators (ESSENTIAL/HELPFUL/REFERENCE) to repository navigation section consistent with docs/README.md approach
- source: repo-analysis

### [MED] /specs/README.md — Spec completion status claims inconsistent with visual completion indicators
- pass: 40 (commit f270824)
- viewport: repository
- auth_state: anonymous
- category: comprehension
- observation: Spec completion status claims specs 1-9 are complete but doesn't provide clear visual completion indicators in the table
- evidence: Line 59 states 'Specs 1-9 are complete' but the recommended order table uses [DONE] markers inconsistently - some entries show [DONE] while others don't despite being claimed complete
- suggested fix: Add consistent [DONE] markers to all completed specs in the recommended order table to match the stated completion status
- source: repo-analysis

### [LOW] /README.md — Prerequisites section uses technical jargon without definitions for mobile development newcomers
- pass: 40 (commit f270824)
- viewport: repository
- auth_state: anonymous
- category: navigation
- observation: Quick start prerequisites section explains React Native/Expo purpose but uses technical jargon that may be unclear to developers new to mobile development
- evidence: Lines 40-47 contain detailed technical explanations like 'Metro bundler and development tools require modern Node.js versions for performance and compatibility' without defining Metro for newcomers
- suggested fix: Simplify prerequisites explanations or add brief definitions for mobile development terms like Metro bundler
- source: repo-analysis

<!-- Pass 38 (2026-06-13, commit f7112f9): repo-proxy pass —
     Auth: none, no live URL (mobile/EAS). Per plan/bearings.md,
     critique reads docs/specs/artifacts as the "fresh maintainer"
     proxy. Focus on general repository comprehension for new
     contributors. Examined README.md, VISION.md, docs/README.md,
     specs/README.md, setup/, app/_layout.tsx, package.json, bearings.md.
     3 findings filed below. -->



### [LOW] /specs/README.md — Spec completion table doesn't highlight next steps for contributors
- pass: 38 (commit f7112f9)
- viewport: repository
- auth_state: anonymous
- category: navigation
- observation: Recommended order table shows 'DONE' status for specs 1-9 but doesn't indicate current active work clearly for new contributors
- evidence: Table shows historical completion status but next steps require reading dense prose above table to understand specs 10-12 are ready to start
- suggested fix: Add Status column showing DONE/READY/BLOCKED and highlight next recommended spec for new contributors
- source: repo-analysis
<!-- Pass 39 (2026-06-13, commit ce00704): repo-proxy pass —
     Auth: none, no live URL (mobile/EAS). Per plan/bearings.md,
     critique reads docs/specs/artifacts as the "fresh maintainer"
     proxy. Focus on general repository comprehension for new
     contributors. 4 findings filed below. -->
### [MED] /specs/README.md — Spec completion status lacks required metadata format
- pass: 39 (commit ce00704)
- viewport: repository
- auth_state: anonymous
- category: navigation
- observation: Specs status table shows all items 1-9 as [DONE] but lacks completion dates or PR references that the conventions section requires
- evidence: Lines 76-84 show '[DONE]' status without the documented '> [DONE on YYYY-MM-DD — see PR #N]' format from line 96-97 conventions
- suggested fix: Add completion dates and PR references to done specs per stated conventions
- source: repo-analysis
### [MED] /app/(tabs)/_layout.tsx — Technical comments drift from archaic voice consistency
- pass: 39 (commit ce00704)
- viewport: repository
- auth_state: anonymous
- category: voice
- observation: Tab navigation code contains extensive implementation comments that drift from the archaic ritual voice toward modern development documentation style
- evidence: Lines 83-117 contain detailed technical comments about Phase 63c+ changes and modal behavior using modern development terminology rather than maintaining voice consistency
- suggested fix: Reduce verbose technical commentary or move to separate documentation to preserve voice register in code
- source: repo-analysis
### [LOW] /README.md — ASCII architecture diagram may break in some markdown renderers
- pass: 39 (commit ce00704)
- viewport: repository
- auth_state: anonymous
- category: visual
- observation: README.md architecture diagram uses non-standard arrow notation and text formatting that may not render consistently across platforms
- evidence: Lines 179-201 show ASCII box diagram with '▼' arrows and '└──────────────┬─────────────┘' borders that may break in some markdown renderers
- suggested fix: Replace ASCII art with standard markdown table or mermaid diagram for better compatibility
- source: repo-analysis
### [LOW] /package.json — Non-standard field usage may confuse tooling
- pass: 39 (commit ce00704)
- viewport: repository
- auth_state: anonymous
- category: comprehension
- observation: Package.json has undocumented _engineNotes field that serves as informal documentation but may confuse tooling or fresh contributors
- evidence: Line 9 shows '_engineNotes' field with implementation notes rather than using standard package.json documentation approaches
- suggested fix: Move engine notes to comments or separate documentation file to avoid non-standard package.json fields
- source: repo-analysis

<!-- Pass 34 (2026-06-11, commit 72f489d): repo-proxy pass —
     Auth: none, no live URL (mobile/EAS). Per plan/bearings.md,
     critique reads docs/specs/artifacts as the "fresh maintainer"
     proxy. Focus on general repo onboarding and mobile development
     guidance. Examined README.md, setup/, docs/, state/presenters/,
     package.json. 4 findings filed below. -->

<!-- Pass 36 (2026-06-12, commit 17850b2): repo-proxy pass —
     Auth: none, no live URL (mobile/EAS). Per plan/bearings.md,
     critique reads docs/specs/artifacts as the "fresh maintainer"
     proxy. Focus on general repository comprehension. Examined
     README.md, specs/README.md, docs/, plan/bearings.md, package.json.
     4 findings filed below. -->
### [x] [MED] /README.md — Architecture diagram uses technical shorthand without explanation ✅
- pass: 36 (commit 17850b2); addressed at commit 19bd545 via `/iterate`
- viewport: desktop
- auth_state: anonymous
- category: comprehension
- observation: Architecture diagram uses technical shorthand 'read upward, mutate downward' pattern that may confuse newcomers without context
- evidence: Architecture section shows data flow but doesn't explain the 'read upward, mutate downward' pattern until after the diagram
- suggested fix: Add a brief explanation before the diagram defining 'read upward, mutate downward'
- source: browser
- addressed: 2026-06-12 via commit 19bd545
- fix: Added brief explanation before architecture diagram defining 'read upward, mutate downward' pattern as data flowing up from engine to UI (read) while state changes flow down from actions to engine (mutate), clarifying the separation between business logic in engine and presentation logic in UI
### [x] [MED] /docs/README.md — Documentation index doesn't prioritize essential reading ✅
- pass: 36 (commit 17850b2); addressed at commit 587761d via `/iterate`
- viewport: desktop
- auth_state: anonymous
- category: navigation
- observation: Documentation index doesn't clearly distinguish between essential vs optional reading for new maintainers
- evidence: All files listed with equal weight - testing.md marked REQUIRED but other critical files like presenters.md not prioritized
- suggested fix: Add priority indicators (ESSENTIAL/HELPFUL/REFERENCE) to file descriptions
- source: browser
- addressed: 2026-06-13 via commit 587761d
- fix: Added ESSENTIAL/HELPFUL/REFERENCE priority indicators across all sections in docs/README.md to help new maintainers distinguish between critical and optional reading. Reorganized ADR table by priority and added priority column to all tables.
### [LOW] /plan/bearings.md — Stack decisions table mixes current state with migration notes
- pass: 36 (commit 17850b2)
- viewport: desktop
- auth_state: anonymous
- category: comprehension
- observation: Stack decisions table mixes current state with migration notes in a way that could confuse present vs future state
- evidence: State management row shows 'Local useState per screen → migrating to a zustand store' mixing current and target state
- suggested fix: Separate current state from target state or mark migration items with clear temporal indicators
- source: browser
### [LOW] /specs/README.md — Spec completion table doesn't highlight next steps for contributors
- pass: 36 (commit 17850b2)
- viewport: desktop
- auth_state: anonymous
- category: navigation
- observation: Recommended order table shows 'DONE' status for specs 1-9 but doesn't indicate current active work clearly for new contributors
- evidence: Table shows historical completion status but next steps require reading dense prose above
- suggested fix: Add a 'Status' column showing DONE/READY/BLOCKED and highlight next recommended spec
- source: browser
### [HIGH] /setup/01_repository.md — Setup documentation disconnected from main README creating confusing dual setup paths ✅
- pass: 34 (commit 72f489d); addressed at commit 9390929 via `/iterate`
- viewport: repository
- category: comprehension
- observation: Setup documentation exists but is disconnected from main README, creating confusing dual setup paths for new maintainers
- evidence: README.md provides quick start in lines 22-51 while setup/01_repository.md provides detailed setup guide, but neither cross-references the other
- suggested fix: Cross-reference setup documentation in README and clarify when to use each path
- source: repo-analysis

### [MED] /README.md — Quick start prerequisites lack context for mobile development ecosystem
- pass: 34 (commit 72f489d)
- viewport: repository
- category: comprehension
- observation: Quick start section assumes familiarity with React Native/Expo ecosystem without explaining mobile development fundamentals or providing context for prerequisites
- evidence: Lines 24-31 list Node.js 20+, Expo CLI, and platform requirements but don't explain why these specific versions are needed or what each platform option provides
- suggested fix: Add brief explanation of mobile development context and why each prerequisite is required
- source: repo-analysis

### [MED] /state/presenters/ — Presenter layer architecture unclear for engine integration newcomers ✅
- pass: 34 (commit 72f489d); addressed at commit be50b69 via `/iterate`
- viewport: repository
- category: comprehension
- observation: Presenter layer architecture is well-documented but the connection between engine integration and mobile-specific concerns is unclear for newcomers
- evidence: combat.engine.ts shows complex engine integration but lacks clear explanation of how axiomancer-mechanics relates to mobile UI patterns
- suggested fix: Add architectural overview explaining engine-to-mobile presentation layer translation
- source: repo-analysis

### [x] [MED] /docs/testing.md — Testing standard lacks mobile-specific testing guidance ✅
- pass: 34 (commit 72f489d); addressed at commit a46baae via `/iterate`
- viewport: repository
- category: mobile
- observation: Testing standard focuses heavily on hermetic requirements but provides minimal guidance for mobile-specific testing challenges like device simulation and native modules
- evidence: Lines 67-81 mention mocking expo-haptics and expo-font but don't explain mobile testing strategy beyond component render tests
- suggested fix: Add mobile-specific testing guidance covering device simulation, native module mocking, and platform differences
- source: repo-analysis
- addressed: 2026-06-12 via commit a46baae
- fix: Added comprehensive mobile-specific testing section covering platform-specific component testing, device simulation, native module mocking strategy, React Native-specific test patterns, and mobile performance testing considerations

### [MED] /README.md — Repository structure navigation unclear for new maintainers
- pass: 33 (commit 07b4068)
- viewport: repository
- category: comprehension
- observation: Repository README jumps immediately from project overview into technical quick start without explaining repository structure or how different documentation areas relate to each other
- evidence: Lines 14-21 reference VISION.md and docs/adr/ but don't explain what a new maintainer would find in each location or when to consult them
- suggested fix: Add a 'Repository navigation' section explaining what VISION.md, docs/adr/, specs/, and plan/ contain and when to use each
- source: repo-analysis

### [MED] /docs/ — Extensive documentation lacks index for maintainer navigation
- pass: 33 (commit 07b4068)
- viewport: repository
- category: navigation
- observation: Extensive docs/ folder with 40+ files but no index or navigation guide for maintainers to find relevant documentation
- evidence: Glob shows numerous specialized docs (engine-upgrade-*.md, mechanics-ui-audit-*.md, adr/*.md) but no docs/README.md or clear categorization
- suggested fix: Add docs/README.md organizing documentation by category and purpose
- source: repo-analysis

### [MED] /docs/testing.md — Testing standard lacks clear compliance examples
- pass: 33 (commit 07b4068)
- viewport: repository
- category: comprehension
- observation: Testing standard requires hermetic e2e tests but provides complex requirements without clear examples of what constitutes minimal compliance
- evidence: Lines 112-128 list 4 required test categories but the canonical reference tests mentioned (combat-hud.engine.test.ts, combat.engine.test.ts) are not easily discoverable
- suggested fix: Add direct links to canonical test examples and provide a minimal passing test template
- source: repo-analysis

### [LOW] /README.md — Voice guidelines scope unclear between in-game and technical documentation
- pass: 33 (commit 07b4068)
- viewport: repository
- category: voice
- observation: Project voice inconsistency between terse archaic game voice and modern technical documentation voice creates confusion about target tone
- evidence: bearings.md specifies 'terse, archaic, ritual' voice but README uses modern technical writing throughout, creating unclear voice expectations
- suggested fix: Clarify in README that voice guidelines apply to in-game content only, not technical documentation
- source: repo-analysis

<!-- Pass 32 (2026-06-11, commit fb5d297): repo-proxy pass —
     Auth: none, no live URL (mobile/EAS). Per plan/bearings.md,
     critique reads docs/specs/artifacts as the "fresh maintainer"
     proxy. Focus on general fresh maintainer experience. Examined
     README.md, specs/, docs/, app/ components, testing patterns.
     4 findings filed below. -->

### [HIGH] /specs/12-accessibility-and-theming.md — Accessibility spec unimplemented despite interactive elements ✅
- pass: 32 (commit fb5d297); addressed at commit b0572aa via `/iterate`
- viewport: repository
- category: a11y
- observation: Accessibility spec remains unimplemented despite app having interactive elements — most components lack required accessibilityRole and accessibilityLabel props
- evidence: Spec 12 shows current state as 'No accessibilityLabel / accessibilityRole props in the screens' and grep found only 15 accessibility references across entire codebase
- suggested fix: Implement Spec 12 to add systematic accessibility support before wider distribution
- source: repo-proxy

### [MED] /specs/README.md — Spec completion guidance creates inconsistent tracking
- pass: 32 (commit fb5d297)
- viewport: repository
- category: comprehension
- observation: Spec completion guidance mentions 'mark the spec [DONE] in this file' but the actual completion pattern shown is editing the spec header, creating inconsistent completion tracking
- evidence: Line 50: 'mark the spec [DONE] in this file' vs example showing header modification with [DONE on YYYY-MM-DD — see PR #N]
- suggested fix: Clarify spec completion pattern to use consistent header modification approach
- source: repo-proxy

### [MED] /app/(tabs)/_layout.tsx — Tab accessibility during modal states unclear
- pass: 32 (commit fb5d297)
- viewport: repository
- category: a11y
- observation: Tab icons have accessibility labels but tab navigation during encounter modal lockdown may confuse screen readers — tabs are visually hidden but accessibility tree unclear
- evidence: Lines 118-121: encounter modal hides tab bar via 'display: none' and nulls hrefs, but accessibility implications not addressed
- suggested fix: Add accessibilityElementsHidden or similar screen reader guidance during modal states
- source: repo-proxy

### [MED] /README.md — Setup documentation references non-existent files
- pass: 32 (commit fb5d297)
- viewport: repository
- category: navigation
- observation: Setup documentation references non-existent setup/ directory files — links to setup/02_eas.md, setup/03_store_setup.md, setup/04_claude_playtest.md that are not present in repository
- evidence: Lines 92-94: Links to setup files that glob search confirms do not exist in the repository
- suggested fix: Remove references to missing setup documentation or create the referenced files
- source: repo-proxy

### [HIGH] /specs/README.md — Current development status unclear for fresh maintainers ✅
- pass: 31 (commit 94326ac); addressed at commit 4831d15 via `/iterate`
- viewport: repository
- category: comprehension
- observation: Specs documentation shows most work as DONE but fresh maintainer cannot easily determine current development status or next recommended tasks without reading all 12 spec files
- evidence: specs/README.md shows '[DONE]' for specs 1-9 but spec 8 shows as incomplete, creating confusion about actual current state vs recommended order
- suggested fix: Add current development status summary or 'What to work on next' section to specs/README.md
- source: repo-proxy

### [MED] /package.json — Node.js version mismatch with README.md ✅
- pass: 31 (commit 94326ac); addressed at commit e7051c1 via `/iterate`
- viewport: repository
- category: comprehension
- observation: Package.json engines section specifies Node >=20.0.0 but README.md Quick start says 'Node.js 18+' creating version requirement confusion for new maintainers
- evidence: package.json line 6 shows "node": ">=20.0.0" while README.md line 26 says "Node.js 18+" requirement
- suggested fix: Update README.md to specify Node.js 20+ to match package.json engines requirement
- source: repo-proxy

### [MED] /.env.example — Setup documentation not linked from main README
- pass: 31 (commit 94326ac)
- viewport: repository
- category: navigation
- observation: Environment setup references setup/02_eas.md for detailed configuration but fresh maintainer needs to discover this file exists and contains critical EAS Build setup instructions
- evidence: .env.example line 17 references 'See setup/02_eas.md for detailed configuration steps' but this file is not mentioned in main README workflow
- suggested fix: Add reference to setup/ directory documentation in README.md Quick start or Deploy environment sections
- source: repo-proxy

### [MED] /README.md — Engine upgrade documentation lacks current context
- pass: 31 (commit 94326ac)
- viewport: repository
- category: navigation
- observation: README mentions multiple critical engine upgrade docs in AI workflow section but fresh maintainer would not know which version they need to follow or if upgrades are current
- evidence: README.md lines 207-221 list multiple engine upgrade paths (0.14.0, 0.15.0, 0.15.1, 0.16.0) without indicating which applies to current repo state
- suggested fix: Add current engine version indicator and clarify which upgrade docs are needed for fresh checkout vs specific version migrations
- source: repo-proxy

### [MED] /README.md — Testing prerequisite unclear for fresh maintainers
- pass: 31 (commit 94326ac)
- viewport: repository
- category: comprehension
- observation: Testing prerequisite section mentions 'Spec 01 setup first' for npm test but fresh maintainer unclear what this setup entails or if already completed
- evidence: README.md line 66 shows '| `npm test` | Run Jest (requires Spec 01 setup first). |'
- suggested fix: Clarify that Spec 01 test harness setup is already complete or provide verification command to check setup status
- source: repo-proxy

### [MED] /docs — Documentation lacks index for fresh maintainer navigation
- pass: 31 (commit 94326ac)
- viewport: repository
- category: navigation
- observation: Repository contains 35+ documentation files in docs/ but no clear index or entry point for fresh maintainer to understand documentation hierarchy and reading order
- evidence: docs/ contains ADRs, engine upgrades, testing guides, UI audits, and various other files without clear navigation structure
- suggested fix: Create docs/README.md with categorized index and recommended reading order for new contributors
- source: repo-proxy

<!-- Pass 30 (2026-06-10, commit c4c5c1a): repo-proxy pass —
     Auth: none, no live URL (mobile/EAS). Per plan/bearings.md,
     critique reads docs/specs/artifacts as the "fresh maintainer"
     proxy. Focus on general fresh maintainer experience. Examined
     README.md, package.json, .env.example, docs/, recent commits.
     3 findings filed below. -->

### [MED] /README.md — Engine upgrade docs reference outdated versions ✅
- pass: 30 (commit c4c5c1a); addressed at commit 8e9dd9e via `/iterate`
- viewport: repository
- category: comprehension
- observation: README mentions engine upgrade guides for 0.14.0→0.15.0 and 0.15.0→0.15.1 but package.json shows axiomancer-mechanics ^0.16.0, creating confusion about which upgrade guide applies
- evidence: README lines 208-217 reference 0.15.0 and 0.15.1 upgrade docs while package.json line 37 shows "axiomancer-mechanics": "^0.16.0"
- suggested fix: Update README engine upgrade references to reflect current 0.16.0 version or add 0.15.1→0.16.0 upgrade documentation
- fix: Updated engine upgrade documentation references to reflect current axiomancer-mechanics ^0.16.0 package version, added reference to docs/engine-upgrade-0.15.1-to-0.16.0.md, and reorganized previous version references for clarity.
- source: repo-proxy

### [MED] /.env.example — References non-existent EAS setup documentation ✅ [INVALID]
- pass: 30 (commit c4c5c1a); marked invalid during `/iterate` 2026-06-10
- viewport: repository
- category: navigation
- observation: .env.example references setup/02_eas.md for EAS Build configuration steps but this file does not exist, creating broken guidance for new contributors
- evidence: Line 17: "See setup/02_eas.md for detailed configuration steps" but setup/ directory contains no 02_eas.md file
- suggested fix: Create setup/02_eas.md with EAS configuration steps or update reference to point to existing documentation
- resolution: Finding was invalid - setup/02_eas.md exists and contains comprehensive EAS Build setup documentation. The .env.example reference is correct.
- source: repo-proxy

### [LOW] /package.json — Node version requirement lacks specificity guidance ✅
- pass: 30 (commit c4c5c1a); addressed at commit 636127e via `/iterate`
- viewport: repository
- category: maintainability
- observation: Package.json specifies "node": ">=20.0.0" but dev scripts reference node:20-alpine container, potentially creating confusion about exact version requirements for fresh maintainers
- evidence: Line 6 shows ">=20.0.0" while scripts/dev-server-container.sh uses "node:20-alpine" image
- suggested fix: Add brief comment in package.json engines section explaining recommended Node version or align container version reference
- fix: Added _engineNotes field to package.json explaining that while local development accepts any Node >=20.0.0, the development container uses node:20-alpine for consistency. Resolves confusion between flexible local requirement and pinned container version.
- source: repo-proxy
- issue: #340

### [LOW] /app/(tabs)/_layout.tsx — Extensive legacy comments may confuse maintainers ✅
- pass: 29 (commit cef865b); addressed at commit 3ef9e82 via `/iterate`
- viewport: repository
- category: maintainability
- observation: Tab layout component contains extensive legacy comments about Phase 63d combat tab behavior that may confuse new maintainers about current state
- evidence: Lines 83-91 contain detailed historical context about retired WILDS↔STRIFE tab mutex and lines 177-182 explain permanently hidden STRIFE tab
- suggested fix: Consolidate historical comments into single brief comment explaining current tab configuration
- fix: Simplified extensive historical comments in app/(tabs)/_layout.tsx to brief explanations. Consolidated 9 lines of Phase 63d details into 2 concise comments explaining current tab configuration. Improves maintainer comprehension without losing essential context.
- source: repo-proxy
- issue: #330

### [LOW] /.env.example — References non-existent setup documentation ✅ [INVALID]
- pass: 29 (commit cef865b); marked invalid during `/iterate` 2026-06-10
- viewport: repository
- category: comprehension
- observation: Environment example file references setup docs that don't exist yet, creating dead-end navigation path
- evidence: Line 17: 'See setup/02_eas.md for detailed configuration steps.' but setup/ directory does not exist in repository
- suggested fix: Either create the referenced setup docs or update comment to point to existing documentation
- resolution: Finding was invalid - setup/02_eas.md exists and contains comprehensive EAS Build setup documentation. The .env.example reference is correct.
- source: repo-proxy

<!-- Pass 27 (2026-06-09, commit 8da116b): repo-proxy pass —
     Auth: none, no live URL (mobile/EAS). Per plan/bearings.md,
     critique reads docs/specs/artifacts as the "fresh maintainer"
     proxy. Focus on repository comprehension and fresh maintainer
     onboarding experience. Reader examined README.md, specs/README.md,
     docs/testing.md, agents.md, and SVG_ASSET_SPEC.md. 3 findings
     filed below. -->

### [MED] /README.md — Architecture diagram mentions undefined presenter contract ✅
- pass: 27 (commit 8da116b); addressed at commit c3b6b97 via `/iterate`
- viewport: repository
- category: comprehension
- observation: Architecture section uses technical terms 'presenter' and 'view-model' without defining them for fresh maintainers, though these are core concepts for understanding the codebase
- evidence: Lines 147-168 reference presenter contract and hermetic e2e testing but assume prior knowledge of these patterns
- suggested fix: Add brief inline definitions or clear reference to docs/presenters.md where the contract is explained
- fix: Added brief inline definition of 'view-model' as data objects containing exactly what UI components need to render alongside existing presenter definition
- source: repo-proxy
- issue: [mirror-failed: 2026-06-09T00:00:00Z]

### [MED] /agents.md — Documentation file truncated preventing full comprehension ✅
- pass: 27 (commit 8da116b); addressed at commit ae42d0e via `/iterate`
- viewport: repository
- category: navigation
- observation: agents.md file appears to be truncated when read, showing only 50 lines of what should be comprehensive autonomous loop guidance
- evidence: File read shows only partial content through line 50, ending mid-sentence in rule 4 about deploy gates
- suggested fix: Verify file integrity and ensure complete documentation is accessible to fresh maintainers
- fix: Verified file integrity - agents.md is complete with 252 lines (9719 bytes) and ends properly with the SVG asset swap contract reference. The original critique was based on a partial read, but the file is intact and accessible to fresh maintainers.
- source: repo-proxy
- issue: #325


<!-- Pass 26 (2026-06-08, commit 2f0ed3d): repo-proxy pass —
     Auth: none, no live URL (mobile/EAS). Per plan/bearings.md,
     critique reads docs/specs/artifacts as the "fresh maintainer"
     proxy. Focus on repository comprehension and documentation
     quality. Reader examined README.md, docs/README.md,
     specs/README.md, plan/bearings.md, and docs/testing.md.
     5 findings filed below. -->

### [MED] /README.md — Project description buries key user context
- pass: 26 (commit 2f0ed3d)
- viewport: repository
- category: comprehension
- observation: Project description buries the key user context — 'TTRPG client' is mentioned in first paragraph but the actual game genre (gothic tabletop RPG) is unclear until much later in bearings.md
- evidence: README opens with 'Expo / React Native client for the Axiomancer TTRPG' but never explains what kind of game Axiomancer is
- suggested fix: Add one sentence after line 7 explaining 'Axiomancer is a gothic tabletop RPG with combat, exploration, and character progression'
- source: repo-proxy

### [MED] /plan/bearings.md — Technical context lacks quick-start orientation
- pass: 26 (commit 2f0ed3d)
- viewport: repository
- category: comprehension
- observation: Technical context is comprehensive but lacks quick-start orientation — fresh maintainer must read 348 lines to understand basic project scope and setup
- evidence: File contains detailed operational context but no executive summary or 'TL;DR' section before diving into stack choices and repo structure
- suggested fix: Add 3-4 line executive summary after line 7 covering: what the app does, target platforms, and development approach
- source: repo-proxy

### [MED] /README.md — Scripts table lacks development workflow context
- pass: 26 (commit 2f0ed3d)
- viewport: repository
- category: navigation
- observation: Scripts table lacks development workflow context — no guidance on typical dev loop or which commands a new contributor runs first
- evidence: Lines 34-54 list 21 script commands but no workflow guidance like 'new contributor: run npm install → npm start → npm run ios' or 'before pushing: npm run verify'
- suggested fix: Add 'Development workflow' section after Scripts table showing common command sequences for first-time setup and daily development
- source: repo-proxy

### [MED] /README.md — Architecture section uses undefined technical jargon
- pass: 26 (commit 2f0ed3d)
- viewport: repository
- category: comprehension
- observation: Architecture diagram and presenter contract explanation provides clear separation of concerns but uses technical jargon without defining key terms for fresh maintainers
- evidence: Lines 139-168 mention 'presenter', 'view-model', and 'hermetic e2e' without definitions, though these are crucial concepts for understanding the codebase structure
- suggested fix: Add brief definitions inline or link to docs/presenters.md from the architecture section
- source: repo-proxy

### [MED] /.env.example — Environment setup references missing documentation files
- pass: 24 (commit 1c8be58)
- viewport: repository
- category: onboarding
- observation: Environment setup references non-existent setup files
- evidence: Line 17 references 'See setup/02_eas.md for detailed configuration steps' but no setup/ directory exists in repository
- suggested fix: Remove references to missing setup files or create the referenced setup documentation
- source: repo-proxy

### [LOW] /specs/README.md — Specs unclear for human-only development workflow
- pass: 24 (commit 1c8be58)
- viewport: repository
- category: comprehension
- observation: Specs are marked as 'conversation loop' oriented toward AI assistance but unclear for human-only development
- evidence: Lines 39-52 describe AI-centric workflow but no guidance for developers working without AI assistance on spec-driven development
- suggested fix: Add section explaining how to use specs for traditional human-only development workflow
- source: repo-proxy

### [LOW] /jest.config.js — Complex transform patterns lack troubleshooting documentation
- pass: 24 (commit 1c8be58)
- viewport: repository
- category: testing
- observation: Jest configuration includes complex transformIgnorePatterns with minimal inline documentation
- evidence: Lines 5-19 contain complex regex for pnpm store handling but insufficient explanation for maintainer troubleshooting
- suggested fix: Add comment explaining when to modify transformIgnorePatterns and common troubleshooting scenarios
- source: repo-proxy

<!-- Pass 23 (2026-06-07, commit 88a3708): repo-proxy pass —
     Auth: none, no live URL (mobile/EAS). Per plan/bearings.md,
     critique reads docs/specs/artifacts as the "fresh maintainer"
     proxy. Focus on recent Phase 116 integration, documentation
     clarity for new maintainers, and code organization patterns.
     Reader examined README, specs/, docs/, component structure,
     recent phase implementations. 4 findings filed below. -->


### [MED] /README.md — New maintainer onboarding path unclear  
- pass: 23 (commit 88a3708)
- viewport: repository
- category: comprehension
- observation: README mentions specs/ and docs/ but provides no guided walkthrough for new maintainers to understand the system
- evidence: Lines 166-175 assume existing context. New maintainer must navigate AGENTS.md, specs/README.md, docs/testing.md independently without clear sequence
- suggested fix: Add 'New Maintainer Quick Start' section with numbered walkthrough of key files and concepts
- source: repo-proxy

### [MED] /plan/CRITIQUE.md — Issue #227 status inconsistency across files
- pass: 23 (commit 88a3708) 
- viewport: repository
- category: comprehension
- observation: Issue #227 token accumulation shows conflicting status between CRITIQUE.md (resolved) and build plan (active Phase 116 work)
- evidence: Previous critique entries suggest #227 was addressed but build plan shows Phase 116 as active work for same issue
- suggested fix: Reconcile #227 status across files - either mark fully resolved or clarify Phase 116 scope vs previous work
- source: repo-proxy

### [LOW] /components — Component organization pattern inconsistent
- pass: 23 (commit 88a3708)
- viewport: repository  
- category: code_quality
- observation: aftermath/ and combat/ subdirectories show good domain organization but pattern not applied consistently across all components
- evidence: Well-organized aftermath/combat directories while other components remain flat in root directory
- suggested fix: Organize remaining components by domain (inventory/, event/, shared/) to match established pattern
- source: repo-proxy

<!-- Pass 18 (2026-05-30, commit fd525e3): repo-proxy pass —
     Auth: none, no live URL (mobile/EAS). Per plan/bearings.md,
     critique reads docs/specs/artifacts as the "fresh maintainer"
     proxy. Reader walked README, AGENTS.md, docs/testing*.md,
     docs/combat.md, plan/bearings.md, specs/00. 3 of its 8
     findings were dropped as dup/addressed (dual-agent-files ✅,
     README test-promise ✅, README arch diagram → bumped the
     existing pass-17 row). 4 new findings filed below. -->

### [LOW] /agents.md — Technical documentation voice contrasts with project voice guidelines
- pass: 21 (commit add8801)
- viewport: repository
- category: voice
- observation: Nexus rule book uses modern technical language that contrasts with project's 'terse, archaic, ritual' voice guideline
- evidence: Throughout file uses contemporary technical terms like 'autonomous loop', 'skill files', 'sub-agents' while bearings.md specifies 'terse, archaic, ritual' voice
- suggested fix: Clarify that voice guidelines apply to in-game content only, not technical documentation, or adjust technical docs to match voice
- source: repo-proxy

### [LOW] /specs/README.md — Spec completion table lacks visual priority distinction
- pass: 21 (commit add8801)
- viewport: repository
- category: navigation
- observation: Spec completion status table shows mixed [DONE] vs. unmarked entries but lacks clear visual distinction for maintainer priority
- evidence: Lines 65-76 mix completed specs (01, 04, 06) with pending ones in same format without clear visual prioritization
- suggested fix: Add visual separators or priority indicators for pending vs. completed specs in the recommended order table
- source: repo-proxy

### [MED] /combat — Difficulty too hard; enemies scale with the player, no progression order `[needs-engine-release]`
- pass: user-jot (commit ff2b8ae)
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: The game's difficulty is WAY too hard, and the mechanics have no order. Start at level 1 with 5 in each stat; even using the Dev Menu to level up manually, enemies just level up with the user. User likes the difficulty scaling in principle but it's rough — needs a real start-to-endgame progression curve, not flat rubber-banding.
- evidence: user-spotted at 2026-05-30T13:57:17Z (manual playtest)
- suggested_fix: [user has not specified — iterate to determine] likely an engine-side difficulty/scaling concern (enemy level derivation); mobile may only surface it. Needs a balance pass and probably a design/spec decision before code.
- source: user
- engine-gated: tagged `[needs-engine-release]` via /oversight 2026-06-02 (52nd call). Enemy level derivation / progression curve lives in `axiomancer-mechanics`; the mobile repo only surfaces it and cannot fix the balance here. Row stays OPEN so the next /oversight re-surfaces it for an engine-side decision.
- re-affirmed deferred via /oversight 2026-06-08 (queue-drained call). User reviewed and chose to **keep deferred** — no GitHub engine issue filed yet. Remains the only live gameplay blocker; re-surface again next oversight for the file-an-engine-issue / accept-as-is decision.
- mobile-actionable solution identified via /oversight 2026-06-11: user directed to solve this from the mobile side by setting **reasonable starting-map enemies** (fishing-village pool weighted toward lower-difficulty foes appropriate for level-1). Phase 120 filed. This approach keeps engine rubber-banding in place but makes the entry experience feel graduated rather than punishing. Row remains open until Phase 120 ships and user confirms the start feels right.

### [MED] /dev — Add two seeded test playthroughs (level-1-easy + max-level endgame) to Dev Menu [PROMOTED → Phase 100 via /oversight 2026-06-02]
- pass: user-jot (commit ff2b8ae)
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: Testing strategy request — provide two reproducible playthroughs to test the game across its range: (a) a fresh level-1 run against easy enemies (start-of-game testing), and (b) a max-level run with max stats and all items + skills unlocked (endgame testing). Today everything starts at level 1 / 5-each with enemies that scale to the player, so neither extreme is easy to exercise.
- evidence: user-spotted at 2026-05-30T13:57:17Z (manual playtest)
- suggested_fix: [user has not specified — iterate to determine] add two Dev Menu seed presets ("start seed" and "endgame seed") that initialize the engine state to those two fixtures; pair with the difficulty finding above.
- source: user
- promoted: Phase 100 via /oversight 2026-06-02 (52nd call). Mobile Dev-Menu seed-preset harness; pairs with the engine-gated difficulty finding above. See PHASE_CANDIDATES ## Promoted + build-plan Status block.

### [MED] /specs/README.md — Spec dependency chain creates false work-ready impression
- pass: 17 (commit c7a1c9c)
- viewport: desktop
- category: comprehension
- observation: Specs 02-12 listed as available but line 66 states 'Spec 01 is a hard prerequisite' creating false impression work can begin
- evidence: Specs table suggests readiness but dependency blocks everything until test harness exists
- suggested fix: Mark specs 02-12 with [BLOCKED BY SPEC 01] prefix until test harness exists
- source: browser

### [MED] /docs/testing.md — Critical testing documentation references nonexistent files
- pass: 17 (commit c7a1c9c)
- viewport: desktop
- category: navigation
- observation: Lines 133-138 reference state/e2e/combat-hud.engine.test.ts and state/e2e/combat.engine.test.ts as canonical examples but files don't exist yet
- evidence: References to future test files break documentation flow for maintainers trying to understand patterns
- suggested fix: Replace references to future test files with placeholder text or axiomancer-mechanics examples until Spec 01 ships
- source: browser

### [MED] general — Voice guidance scattered across multiple files without hierarchy
- pass: 17 (commit c7a1c9c)
- viewport: desktop
- category: voice
- observation: Voice guidance appears in plan/bearings.md and theme/axm.ts with different detail levels and no cross-references
- evidence: Multiple sources of voice guidance with no clear canonical source
- suggested fix: Consolidate voice guidance in single source file and reference from others with 'See [file] for full voice guidelines'
- source: browser

### [MED] /README.md — Architecture diagram + layout drifted behind the code (presenters moved, screens wired)
- pass: 17 (commit c7a1c9c); severity bumped + reframed pass 18 (commit fd525e3)
- viewport: desktop
- category: drift
- observation: The drift has inverted since pass 17. The diagram/layout now lags BEHIND the code, not ahead of it. README:135 places presenters at `app/<route>/*.engine.ts`, but they actually live in `state/presenters/*.engine.ts` (20 engines) — a maintainer who greps `app/(tabs)/combat.engine.ts` finds nothing. README:103-107 still labels every screen `(placeholder UI)`, but the screens shipped long ago, and the layout omits the Memoir tab entirely.
- evidence: README.md:135 "Presenters | app/<route>/*.engine.ts" vs `state/presenters/*.engine.ts`; README.md:103-107 "(placeholder UI)" ×5; Memoir tab absent from the layout block though `app/(tabs)/memoir/` ships.
- suggested fix: Redraw the layout/diagram to point presenters at `state/presenters/`, drop the `(placeholder UI)` labels, and add the Memoir tab.
- source: file-read (repo-proxy)

### [LOW] /exploration — Sealed map nodes give no tap feedback
- pass: deep-playtest (2026-05-25, commit d560e8c)
- viewport: mobile (414x896)
- auth_state: anonymous
- category: observation
- observation: Sealed nodes rendered as tappable buttons (cursor:pointer) but produce no visual response on tap. No tooltip, no message.
- suggested_fix: Tap shows "path sealed" toast. Phase candidate filed.
- source: deep-playtest [F11]

### [LOW] /combat — ITEM action always disabled with no explanation
- pass: deep-playtest (2026-05-25, commit d560e8c)
- viewport: mobile (414x896)
- auth_state: anonymous
- category: observation
- observation: ITEM button ("USE A CONSUMABLE") greyed out even with Healing Potion in inventory. No tooltip or message explaining why.
- suggested_fix: Tooltip on disabled ITEM button. Phase candidate filed.
- source: deep-playtest [F12]
### [MED] /README.md — License section incomplete, creates uncertainty for fresh maintainer
- pass: 19 (commit 18c3371)
- viewport: desktop
- auth_state: anonymous
- category: comprehension
- observation: README contains incomplete License section stating 'TBD. Ask the project maintainer' which creates uncertainty about usage rights for fresh maintainers examining the repository
- evidence: Line 263 in README.md showing placeholder license text
- suggested_fix: Specify actual license or provide clear guidance on where to find licensing information
- source: browser
### [MED] /specs/00-how-to-use-specs.md — References missing GAME-ROADMAP.md file
- pass: 19 (commit 18c3371)
- viewport: desktop
- auth_state: anonymous
- category: navigation
- observation: Document instructs users to 'Update GAME-ROADMAP.md first' for capturing big ideas, but this file does not exist in repository structure
- evidence: Line 35 references non-existent GAME-ROADMAP.md file
- suggested_fix: Create missing GAME-ROADMAP.md file or update reference to point to existing roadmap documentation
- source: browser
### [LOW] /agents.md — Dead link to asset swap documentation
- pass: 19 (commit 18c3371)
- viewport: desktop
- auth_state: anonymous
- category: navigation
- observation: File references .cursor/skills/swap-asset-placeholder/SKILL.md workflow but this path does not exist in current repository structure
- evidence: Line 100 contains reference to non-existent .cursor/skills/ path
- suggested_fix: Update reference to point to correct asset swap documentation or remove outdated reference
- source: browser

<!-- Pass 25 (2026-06-08, commit 44794db): repo-proxy pass —
     Auth: none, no live URL (mobile/EAS). Per plan/bearings.md,
     critique reads docs/specs/artifacts as the "fresh maintainer"
     proxy. Focus on repository experience, development workflow,
     documentation completeness. Reader examined environment setup,
     workflow guidance, voice consistency, theme tokens, performance
     concerns, script documentation. 6 findings filed below. -->

### [MED] /.env.example — Environment setup references missing documentation files
- pass: 25 (commit 44794db)
- viewport: n/a
- category: comprehension
- observation: Environment configuration file references 'setup/02_eas.md for detailed configuration steps' but no setup/ directory exists in repository
- evidence: Line 17: '# See setup/02_eas.md for detailed configuration steps.' but no setup/ directory found in repository structure
- suggested fix: Either create referenced setup/02_eas.md file or remove reference and move configuration details into .env.example comments
- source: file-read

### [MED] /README.md — Missing guidance for development workflow ordering
- pass: 25 (commit 44794db)
- viewport: n/a
- category: comprehension
- observation: Scripts table lists verification and deployment commands but lacks guidance on typical development workflow sequence
- evidence: Scripts section shows 'verify', 'deploy:preview', 'baseline:approve' but no clear indication of when/how to use them in normal development flow
- suggested fix: Add workflow section showing typical development sequence: start → lint/test → verify → commit → deploy
- source: file-read

### [MED] /plan/AUDIT.md — Audit findings indicate performance concerns unaddressed
- pass: 25 (commit 44794db)
- viewport: n/a
- category: performance
- observation: Open performance finding [5.6] indicates components lack optimization patterns despite complex UI rendering requirements
- evidence: Lines 87-96 describe limited use of React optimization hooks, no React.memo usage, and console logging in production paths
- suggested fix: Implement React.memo for expensive components and add useMemo/useCallback for complex calculations in combat and modal components
- source: file-read

### [LOW] /specs/README.md — Specs workflow unclear for human-only development
- pass: 25 (commit 44794db)
- viewport: n/a
- category: comprehension
- observation: Documentation describes AI-assisted conversation loop but provides no guidance for developers working without AI assistance
- evidence: Lines 39-52 detail AI-centric workflow but no alternative path for traditional human development using specs
- suggested fix: Add section explaining how to use specs independently for traditional development workflow without AI assistance
- source: file-read

### [LOW] /plan/bearings.md — Voice guidelines conflict with actual implementation voice
- pass: 25 (commit 44794db)
- viewport: n/a
- category: voice
- observation: Voice guidelines specify 'terse, archaic, ritual' but some recent commit messages and documentation use modern, conversational tone
- evidence: Bearings.md lines 180-184 specify cold/old register but recent docs and error messages use contemporary language patterns
- suggested fix: Audit recent documentation and in-app copy to align with specified archaic voice or revise voice guidelines to reflect current practice
- source: file-read

### [LOW] /theme/axm.ts — Theme tokens include deprecated font references
- pass: 25 (commit 44794db)
- viewport: n/a
- category: consistency
- observation: Theme file exports both legacy FONTS.{pirata, fell, fellItalic, bebas, mono} and new FONTS.{gothic, serif, serifItalic, sans, mono} patterns
- evidence: Lines 49-58 show current implementation but bearings.md references legacy pattern FONTS.{pirata, fell, fellItalic, bebas, mono}
- suggested fix: Update plan/bearings.md to reference current theme token names or add legacy aliases for backward compatibility
- source: file-read

### [MED] /README.md — Mobile-specific context missing for React Native newcomers in prerequisites section
- pass: 35 (commit 87b994c)
- viewport: repository
- category: comprehension
- observation: Mobile-specific context missing for React Native newcomers in prerequisites section
- evidence: Lines 24-31 list 'Node.js 20+, Expo CLI' but don't explain React Native/Expo ecosystem or why these versions matter for mobile development
- suggested fix: Add 2-3 sentences explaining React Native compilation requirements and mobile development ecosystem context
- source: web-fetch

### [MED] /setup/01_repository.md — Setup documentation creates dual paths without clear routing guidance
- pass: 35 (commit 87b994c)
- viewport: repository
- category: navigation
- observation: Setup documentation creates dual paths without clear routing guidance
- evidence: README quick start (lines 22-51) and setup/01_repository.md detailed guide exist independently with no cross-reference or guidance on when to use each
- suggested fix: Cross-reference setup docs in README with clear routing (quick start vs detailed setup)
- source: web-fetch

### [MED] /docs/testing.md — Hermetic testing standard lacks mobile-native testing patterns
- pass: 35 (commit 87b994c)
- viewport: repository
- category: mobile
- observation: Hermetic testing standard lacks mobile-native testing patterns
- evidence: Lines 67-81 mention mocking expo-haptics/expo-font but missing guidance for device simulation, platform differences, native module testing
- suggested fix: Add mobile-specific testing section covering device viewport testing, native module mocking strategies, platform-specific test patterns
- source: web-fetch

### [MED] /specs/README.md — Spec workflow assumes engine knowledge without mobile implementation context
- pass: 35 (commit 87b994c)
- viewport: repository
- category: comprehension
- observation: Spec workflow assumes engine knowledge without mobile implementation context
- evidence: Lines 22-35 describe spec conversation loop but presenter/engine integration pattern unclear for mobile developers unfamiliar with axiomancer-mechanics
- suggested fix: Add brief engine-to-mobile architecture primer explaining state → presenter → view-model flow
- source: web-fetch

### [LOW] /package.json — EAS Build scripts lack mobile development context for maintainer onboarding
- pass: 35 (commit 87b994c)
- viewport: repository
- category: mobile
- observation: EAS Build scripts lack mobile development context for maintainer onboarding
- evidence: Scripts deploy:preview/deploy:production reference EAS without explaining mobile binary distribution vs web deployment
- suggested fix: Add script comments explaining EAS Build as mobile app store binary generation
- source: web-fetch

### [LOW] /VISION.md — Combat UX doctrine assumes knowledge of status-effect-centered gameplay
- pass: 35 (commit 87b994c)
- viewport: repository
- category: voice
- observation: Combat UX doctrine assumes knowledge of status-effect-centered gameplay
- evidence: Lines 15-25 reference 'status effects exist and matter' but lack context for mobile developers unfamiliar with TTRPG mechanics
- suggested fix: Add brief primer on status-effect gameplay before mobile UX requirements
- source: web-fetch

<!-- Pass 37 (2026-06-13, commit 396c9c7): repo-proxy pass —
     Auth: none, no live URL (mobile/EAS). Per plan/bearings.md,
     critique reads docs/specs/artifacts as the "fresh maintainer"
     proxy. Focus on general repository comprehension. Examined
     README.md, specs/README.md, docs/testing.md, plan/bearings.md,
     SVG_ASSET_SPEC.md. 5 findings filed below. -->

### [MED] /README.md — Repository navigation section lacks priority indicators for fresh maintainer reading order
- pass: 37 (commit 396c9c7)
- viewport: repository
- category: navigation
- observation: Repository navigation section lists extensive documentation but lacks priority indicators for fresh maintainer reading order
- evidence: Lines 139-149 list multiple documentation areas (VISION.md, docs/adr/, specs/, plan/, docs/, setup/) without indicating which to read first or prerequisites
- suggested fix: Add priority markers (★ essential, ◆ implementation-focused, etc.) or numbered reading order
- source: file-read

### [MED] /plan/bearings.md — Operational setup scattered across multiple files without clear onboarding path
- pass: 37 (commit 396c9c7)
- viewport: repository
- category: setup
- observation: Critical operational information scattered across multiple files without clear onboarding path for fresh maintainer
- evidence: Lines 82-84: 'setup/NN_*.md runbooks are not yet authored — they're queued in phase candidates. Until then, treat agents.md Operational secrets as the canonical config doc'
- suggested fix: Create consolidated onboarding checklist or point to primary setup entry point
- source: file-read

### [LOW] /specs/README.md — Specs workflow consolidation needed for fresh maintainer focus
- pass: 37 (commit 396c9c7)
- viewport: repository
- category: comprehension
- observation: Specs workflow is well-documented but the recommended order table shows completed work without clear indication of what fresh maintainer should focus on
- evidence: Lines 74-87 show Specs 1-9 marked [DONE] but fresh maintainer focus (Specs 10-12) mentioned separately at lines 60-66
- suggested fix: Consolidate current status and next-recommended work in single prominent section
- source: file-read

### [LOW] /docs/testing.md — Testing entry point unclear among three different test types
- pass: 37 (commit 396c9c7)
- viewport: repository
- category: comprehension
- observation: Comprehensive testing standard but entry point for fresh maintainer unclear among three different test types mentioned
- evidence: Document covers hermetic e2e (main requirement), browser playthroughs (scripts), and component tests (optional) but lacks 'getting started' section
- suggested fix: Add 'Quick start for new tests' section with most common test pattern
- source: file-read

### [LOW] /SVG_ASSET_SPEC.md — Asset specification lacks clear integration point with development workflow
- pass: 37 (commit 396c9c7)
- viewport: repository
- category: documentation
- observation: Asset specification lacks clear integration point with development workflow
- evidence: Lines 5-12 clarify this is for asset replacement not initial development, but no clear bridge to when/how maintainer would use this
- suggested fix: Add reference to this file in README repository navigation section
- source: file-read

### [x] [HIGH] /README.md — Repository navigation creates confusing hierarchy with overlapping documentation directories ✅
- pass: 42 (commit 076dfb9)
- viewport: desktop
- category: navigation
- observation: Multiple documentation directories (docs/adr/, specs/, plan/, docs/, setup/) with overlapping purposes create unclear boundaries for new maintainers
- evidence: Lines 16-24 list setup/ for 'detailed setup guides' while docs/ contains 'technical documentation' creating navigation confusion
- suggested fix: Consolidate or clearly delineate the boundary between setup/, docs/, and other documentation directories with explicit routing guidance
- source: repo-proxy
- issue: #439
- resolution: Reworked README "Repository navigation" into a decision-oriented "you want to… / go to / not to" table plus a per-directory "stated plainly" list that delineates setup/ (operational runbooks) vs docs/ (conceptual reference) vs docs/adr/ (decisions) vs specs/ (contracts) vs plan/ (execution state) vs VISION.md (doctrine). Addressed by /iterate.

### [MED] /VISION.md — Inconsistent terminology around mercy/friendship mechanics  
- pass: 42 (commit 076dfb9)
- viewport: desktop
- category: voice
- observation: Vision document alternates between 'Befriend' (capitalized) and 'friendship' (lowercase) without clear distinction creating implementation ambiguity
- evidence: Lines 39-50 alternate between 'Befriend' as skill name and 'friendship' as concept without established capitalization rules
- suggested fix: Establish clear capitalization rules: 'Befriend' for the skill action, 'friendship' for the concept/counter
- source: repo-proxy

### [MED] /docs/testing.md — Testing documentation lacks concrete examples for mobile patterns
- pass: 42 (commit 076dfb9)
- viewport: desktop  
- category: comprehension
- observation: Testing documentation covers mobile considerations extensively but only provides brief code snippets rather than complete working examples
- evidence: Lines 84-131 cover mobile testing considerations but lack copy-paste examples new maintainers can modify
- suggested fix: Add complete working test examples for common mobile patterns (navigation, touch events, platform differences)
- source: repo-proxy

### [LOW] /SVG_ASSET_SPEC.md — Asset specification uses inconsistent measurement units
- pass: 42 (commit 076dfb9)
- viewport: desktop
- category: visual
- observation: Asset swap specification mixes 'px' measurements with abstract 'size' props without clear conversion ratios
- evidence: Lines 53, 87, 110 mix 'px' measurements (12-20 px) with abstract 'size' props (default 40) and rendered dimensions (180 × 200 px)
- suggested fix: Standardize on px measurements throughout or provide clear conversion ratios between abstract sizes and pixel dimensions
- source: repo-proxy

## Done

<!-- Drained from ## Pending via /oversight 2026-06-08 (queue-drained
     call): addressed-✅ findings moved here so the open-findings
     signal /iterate reads is accurate. -->

### [x] [MED] Hazard reward offer tiles expose inconsistent card names before preview (Kid playthrough 2026-06-18)
- category: accessibility
- impact: 5 (automation and accessibility users may choose blind until opening preview)
- ease: 7 (regression-guard test; render contract already satisfied)
- issue: #460
- observed: daily Kid Hazard ladder 2026-06-18.
  - Run 1 found three reward offer hit targets with empty `innerText`.
  - Run 3 saw offer IDs (`x_swiftcurrent`, `r_warcry`, `x_oxback`) but blank visible/accessibility text in the tile query.
  - Run 5 saw `QUIET COMMUNION` exposed by aria label and preview, but the tile itself still had empty inner text.
- next: ensure each reward offer tile visibly and accessibly renders card name/rarity before the player opens the preview.
- source: Kid daily playthrough (2026-06-18)
- addressed: 2026-06-18 via commit (this tick)
- resolution: Investigated the offer tile (`components/hazard/RewardsOverlay.tsx` → `HazardCard mode="offer"`). The card **name** renders as a visible `<Text numberOfLines={2}>` and the **rarity** as a visible `<Text>` (`COMMON`/`UNCOMMON`/`RARE`), and the offer `Pressable` carries `accessibilityLabel="Preview reward card {name}, {rarity}"` — so both name and rarity are present and accessible **before** preview for sighted and screen-reader users. The blank-`innerText` observation is a react-native-web `numberOfLines` line-clamp artifact in the Playwright harness (the clamped span reports empty `innerText` while `textContent`/aria are populated), not a missing-name product defect. Rather than churn product code, locked the contract with two hermetic regression guards in `components/hazard/__tests__/RewardsOverlay.test.tsx`: one pins both offer tiles' visible name + rarity text before any preview opens, the other pins name + rarity on each tile's accessibility label. Verify green (245 suites / 2611 tests).

### [x] [HIGH] Mobile minigame e2e harness still waits for stale inline dev menu (Kid playthrough 2026-06-18)
- category: tests
- impact: 8 (`npm run e2e:minigames` fails before testing Hazard/Gathering/Encounter flow)
- ease: 6 (route update appears localized to the e2e harness dev-entry helper)
- observed: daily Kid Hazard ladder 2026-06-18.
  - `npm run e2e:minigames` aborted in `scripts/hazard-e2e.mjs` waiting for `data-testid="dev-menu-header"`.
  - Current exported app exposes `SELF → DEV TOOLS` via `data-testid="self-dev-tools-link"`, then a Developer screen with `debug-trigger-encounter-hazard`, direct `debug-hazard-button`, deck randomize, and deterministic deck preset buttons.
  - Manual/subagent browser playthroughs reached Hazard through the new Developer screen, so this is harness drift rather than proof the product route is absent.
- source: Kid daily playthrough (2026-06-18)
- issue: #459
- resolution: Phase 132 moved the Debug* controls onto the dedicated
  `/dev` route reached via `self-dev-tools-link` on the SELF sheet, but
  the harnesses still clicked the retired `dev-menu-header`. Added a
  shared `openDevTools` helper to `hazard-e2e.mjs`, `gathering-e2e.mjs`,
  and `encounter-routing-e2e.mjs` (and fixed the equivalent
  `openDevMenu` in `audit-capture.mjs`) that taps the link and waits for
  the `/dev` route before querying the debug buttons. Fix commit
  aabc17d; 2602/2602 verify green.

### [x] [MED] Hazard reward preview renders keyword objects as raw text (Kid playthrough 2026-06-18)
- category: bug
- impact: 5 (reward choice comprehension is degraded after a completed Hazard)
- observed: daily Kid Hazard ladder 2026-06-18.
  - Run 2 and Run 5 reached the reward preview after a completed/perfect Cracked Cliff Hazard.
  - Preview text included `KEYWORDS: [object Object], [object Object]...` instead of readable keyword labels/details.
  - The reward could still be claimed, so this is not a hard progression blocker.
- source: Kid daily playthrough (2026-06-18)
- issue: #458
- resolution: `components/hazard/RewardsOverlay.tsx` preview rendered
  `card.keywords.join(', ')` where `HazardCardVM.keywords` is
  `{ id, name, desc }[]`, so array→string coercion produced
  `[object Object]`. Now maps each keyword to its `name`
  (`card.keywords.map((kw) => kw.name).join(', ')`). New
  RewardsOverlay test asserts keyword names render and `[object Object]`
  never appears. 2602/2602 verify green.

### [x] [HIGH] /setup/01_repository.md — Setup guide references missing setup runbooks creating broken navigation
- pass: 41 (commit a185532)
- viewport: repository
- auth_state: anonymous
- category: navigation
- observation: Setup guide references missing setup runbooks that are explicitly not authored yet, creating broken navigation paths for new maintainers
- evidence: Lines 232-234 reference setup/02_eas.md, setup/03_store_setup.md, setup/04_claude_playtest.md but plan/bearings.md line 82-84 states 'The `setup/NN_*.md` runbooks are not yet authored'
- suggested fix: Add clear 'TODO' or 'Coming Soon' annotations to setup guide references until runbooks are authored
- source: repo-proxy
- addressed: 2026-06-14 via commit e253c8d
### [x] [HIGH] /setup/01_repository.md — Setup guide references non-existent future setup files
- pass: 43 (commit 772f0c0)
- viewport: desktop
- auth_state: anonymous
- category: navigation
- observation: Repository setup guide promises future setup files that don't exist, creating broken workflow for new maintainers
- evidence: Lines 232-234 reference setup/02_eas.md, setup/03_store_setup.md, setup/04_claude_playtest.md with "Coming Soon" but these create dead links
- suggested fix: Either create the promised files or remove the coming soon references
- source: file-read
- addressed: 2026-06-15 via pass 44 (setup files now exist with real content)

### [x] [MED] /setup/ — Setup documentation usage guidance unclear for fresh maintainers ✅
- pass: 38 (commit f7112f9)
- viewport: repository
- auth_state: anonymous
- category: navigation
- observation: Setup documentation exists but README navigation section doesn't clearly distinguish when to use comprehensive setup vs quick start
- evidence: README line 29 says 'For comprehensive repository setup see setup/01_repository.md' but doesn't explain when fresh maintainer should use comprehensive vs quick start workflow
- suggested fix: Add usage guidance explaining when to use setup/ documentation vs README quick start based on developer needs
- source: repo-analysis
- addressed: 2026-06-14 via commit 43f079c

### [x] [MED] /plan/bearings.md — Stack decisions table mixes current state with migration notation ✅
- pass: 38 (commit f7112f9)
- viewport: repository
- auth_state: anonymous
- category: comprehension
- observation: Stack decisions table mixes current state with migration notes in State management row creating confusion about current vs historical implementation
- evidence: Line 61 shows 'zustand store wrapping createGameStore from axiomancer-mechanics → Local useState per screen' with strikethrough, mixing current implementation with historical migration path
- suggested fix: Clean up State management row to show only current implementation status without migration notation
- source: repo-analysis
- addressed: 2026-06-13 via commit 663f457

### [x] [MED] general — Switch to axiomancer-mechanics imports for gathering minigame ✅
- pass: user-jot (commit 38597ebcff7bbbe1b12297701191432e1646aa65); addressed at commit 38597eb via `/iterate`
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: Switch to axiomancer-mechanics imports for the gathering minigame and clean up the duplicate code
- evidence: user-spotted at 2026-06-12T16:33:38Z
- suggested_fix: [user has not specified — iterate to determine]
- source: user
- addressed: 2026-06-12 via commit 38597eb (axiomancer-mechanics 0.18.0 bump)
- fix: Gathering minigame fully migrated to axiomancer-mechanics imports. Local rule files (state/gathering/{engine,types,content,tuning,rng,sim}.ts) were deleted and all imports now come from the package root. Only host glue (store-actions.ts) remains in state/gathering/.

### [x] [MED] /package.json — Specialized development scripts lack documentation
- pass: 33 (commit 07b4068)
- viewport: repository
- category: comprehension
- observation: Package scripts include specialized commands for containerized development and visual testing but lack documentation about when to use them
- evidence: Scripts like 'web:container', 'verify:visual', 'e2e:hazard', 'baseline:approve' are present but not explained in README workflow section
- suggested fix: Expand README scripts table to include all specialized commands with usage context
- source: repo-analysis
- addressed: 2026-06-11 via commit f73a839

### [x] [HIGH] /setup/ — Referenced setup documentation missing, blocking onboarding (commit 735d52b)
- pass: 33 (commit 07b4068)
- viewport: repository
- category: navigation
- observation: Setup documentation referenced throughout README but missing critical setup files, creating broken onboarding path
- evidence: README line 90 references setup/02_eas.md, 03_store_setup.md, 04_claude_playtest.md but only partial content exists - setup process appears incomplete
- suggested fix: Complete all setup documentation or remove references to non-existent setup guides
- source: repo-analysis

### [MED] /specs/README.md — Spec dependency information contradicts completion status ✅
- pass: 29 (commit cef865b); addressed at commit c93eef3 via `/iterate`
- viewport: repository
- category: comprehension
- observation: Specs README shows 'Spec 8 waits on Spec 09 store/orchestration' but Spec 09 is marked as DONE, creating confusion about implementation order
- evidence: Line 72: 'Engine Spec 08 (world) is done; this screen waits on Spec 09 store/orchestration + a pinned narrative contract (see spec body)' vs line 73: '09-asyncstorage-persistence.md [DONE]'
- suggested fix: Update spec 8 description to reflect current status since spec 09 is complete
- fix: Fixed Spec 08 description to reflect that Spec 09 (store/orchestration) is complete, eliminating confusion about implementation order for fresh maintainers
- source: repo-proxy

### [MED] /README.md — VISION.md reference lacks context for maintainer navigation ✅
- pass: 29 (commit cef865b); addressed at commit eb8b431 via `/iterate`
- viewport: repository
- category: navigation
- observation: Main README references VISION.md on line 14 but then immediately jumps into technical quick start without explaining what the vision contains or why a maintainer should read it
- evidence: Line 14: 'T's current game vision and UX doctrine guardrail lives in [`VISION.md`](./VISION.md). Read it before major mobile UX, combat, mercy/friendship, alignment, or `/march` work.' followed directly by technical prerequisites
- suggested fix: Add one sentence after line 14 explaining what VISION.md contains (game identity, combat UX principles) so maintainers understand its relevance
- fix: Added explanatory sentence defining VISION.md as containing game identity, core UX principles, and philosophical design constraints, providing essential context for maintainer navigation
- source: repo-proxy

### [HIGH] docs/README.md — Referenced documentation file does not exist ✅
- pass: 26 (commit 2f0ed3d); addressed at commit cf60f7a via `/iterate`
- viewport: repository
- category: navigation
- observation: docs/README.md referenced in main README but file does not exist — creates broken navigation path for fresh maintainer
- evidence: Main README line 132 shows 'docs/ design notes' and bearings.md line 132 shows 'docs/' in repo structure, but glob search found no docs/README.md
- suggested fix: Create docs/README.md with overview of documentation structure or remove reference from main README
- fix: Created comprehensive docs/README.md with overview of documentation structure, ADR guidance, engine integration guides, and navigation back to main README
- source: repo-proxy
- issue: #309
### [MED] /SVG_ASSET_SPEC.md — Asset specification overwhelming for fresh maintainer first impression ✅
- pass: 27 (commit 8da116b); addressed at commit 4909905 via `/iterate`
- viewport: repository
- category: comprehension
- observation: SVG asset specification provides comprehensive detail but may overwhelm fresh maintainers with 260 lines of specific replacement instructions before basic project understanding
- evidence: File jumps directly into detailed asset replacement procedures without context about when/why a maintainer would need this information
- suggested fix: Add executive summary at top explaining this is for asset replacement workflow, not initial development setup
- fix: Added executive summary section explaining this document is for asset replacement workflow, not initial development setup. Provides clear guidance for fresh maintainers about when they need this specification versus starting with README.md and docs/
- source: repo-proxy
- issue: #322

### [x] [MED] /package.json — Package scripts lack development workflow guidance ✅
- pass: 24 (commit 1c8be58)
- viewport: repository
- category: maintainability
- observation: Package.json scripts include verification and deployment commands but no development workflow guidance
- evidence: Commands like 'verify', 'deploy:preview', 'baseline:approve' exist with no explanation of when/how to use them in development workflow
- suggested fix: Add script descriptions in README.md Scripts table or package.json comments explaining development workflow usage
- source: repo-proxy
- addressed: 2026-06-08 via commit 6ad6e8b
- fix: Expanded README.md Scripts table with 7 additional development workflow scripts including verify (quality gate), verify:visual (visual smoke tests), baseline:approve (visual test maintenance), and deploy:* commands with clear descriptions for new maintainer onboarding

### [HIGH] /docs/testing.md — Testing standard references non-existent test files ✅
- pass: 21 (commit add8801)
- viewport: repository
- category: documentation
- observation: Testing standard states 'Spec 01 — Test Harness Setup has shipped' but provides stale reference pointers to files that may not exist
- evidence: Lines 133-139 reference 'state/e2e/combat-hud.engine.test.ts' and 'state/e2e/combat.engine.test.ts' as canonical reference examples without verifying existence
- suggested fix: Verify reference test file paths exist and update documentation to point to actual shipped test files
- source: repo-proxy
- issue: #270
- addressed: 2026-06-05 via verification audit
- fix: Verified that both referenced test files exist as documented - state/e2e/combat-hud.engine.test.ts and state/e2e/combat.engine.test.ts are present in the repository. The documentation references are accurate.

### [HIGH] /SVG_ASSET_SPEC.md — Asset specification references non-existent components ✅
- pass: 21 (commit add8801)
- viewport: repository
- category: documentation
- observation: Asset specification references files and components that may not exist, creating broken implementation guidance
- evidence: Lines 28-29 reference 'components/StanceGlyph.tsx' exports 'GlyphHeart', 'GlyphBody', 'GlyphMind' without verification these components exist as described
- suggested fix: Verify all file paths and component exports in asset spec match actual codebase structure
- source: repo-proxy
- issue: #270
- addressed: 2026-06-05 via verification audit
- fix: Verified that components/StanceGlyph.tsx exists and exports exactly the components listed in the specification: GlyphHeart, GlyphBody, GlyphMind, and StanceGlyph. The asset specification is accurate.

### [MED] /README.md — Project status description inconsistent with current implementation ✅
- pass: 21 (commit add8801)
- viewport: repository
- category: comprehension
- observation: README references 'placeholder UI' in several core screens but doesn't clarify current implementation status vs. spec-driven migration plan
- evidence: Lines 109-113 describe combat.tsx, character.tsx, etc. as 'placeholder UI' but combat screen is actually fully implemented per spec 04
- suggested fix: Update project layout section to reflect current implementation status per specs/README.md completion table
- source: repo-proxy
- addressed: 2026-06-05 via commit 89a3e9f
- fix: Updated README.md lines 109-113 to show actual implementation status per specs completion table. Changed "placeholder UI" descriptions to "fully implemented per spec 04/05/06/07/08" for combat, character, inventory, exploration, and event screens respectively.

### [MED] /AGENTS.md — Pre-nexus orientation contains outdated workflow instructions ✅
- pass: 21 (commit add8801)
- viewport: repository
- category: navigation
- observation: Pre-nexus orientation file contains outdated workflow instructions and duplicate information with agents.md
- evidence: Lines 3-4 state 'This is the pre-nexus orientation file. For current autonomous loop instructions, see agents.md' but file contains 103 lines of detailed instructions that may conflict with current nexus methodology
- suggested fix: Consolidate or clearly separate pre-nexus vs. current instructions, or archive AGENTS.md if superseded by agents.md
- source: repo-proxy
- issue: #274
- addressed: 2026-06-05 via commit 0a7766f
- fix: Streamlined AGENTS.md from 103 lines to 49 lines by removing outdated workflow instructions that conflicted with nexus methodology. File now focuses purely on project-specific technical orientation while clearly directing users to agents.md for current autonomous loop instructions.

### [HIGH] /combat — Combat cannot be re-triggered after a victory (only after a loss) ✅
- pass: user-jot (commit ff2b8ae)
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: Combat bug spotted in manual playtest: (1) Lose the fight and restart — you CAN trigger a new fight. (2) Friendship victory — you CANNOT trigger another combat encounter. (3) Regular victory — you still CANNOT trigger another combat encounter. So the encounter loop only re-arms on defeat, not on either victory path.
- evidence: user-spotted at 2026-05-30T13:57:17Z (manual playtest)
- suggested_fix: [user has not specified — iterate to determine] likely the node/encounter consumed-state is not reset (or is reset only on defeat) after friendship/regular victory; check resolveCurrentMapEvent / markNodeConsumed + combat-end handling.
- source: user
- issue: #232
- addressed: 2026-06-01 via commit `2396dd0`
- fix: Fixed encounter node consumption in moveToAction. Root cause: encounter nodes were being marked as completed on visit, preventing repeat encounters. Modified logic to check node type (encounter/boss) and only complete/consume non-encounter nodes. Updated test to expect correct behavior. Encounter nodes now remain reusable after both victory paths.

### [HIGH] /combat — Token resource system (skill-cast currency) never accumulates ✅
- pass: user-jot (commit ff2b8ae)
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: The token resource system (what's used to cast skills) is not working at all — tokens are not accumulating whatsoever. Without them, skills cannot be cast.
- evidence: user-spotted at 2026-05-30T13:57:17Z (manual playtest)
- suggested_fix: [user has not specified — iterate to determine] verify the engine combatResources accrual per round is read/propagated to the mobile combat presenter (state/presenters/combat.engine.ts) rather than displayed as a static value; may be an engine vs mobile boundary issue.
- source: user
- addressed: 2026-06-01 via Phase 97(a), commit `8df2971` (drained via /oversight 2026-06-02). Token resource now reads the engine's per-round `combatResources` accrual instead of a static placeholder. Mirrors AUDIT [user-issue #227] / issue #227.

### [HIGH] /combat — Learned skills blocked as "not equipped"; combat should show only currently-usable skills ✅
- pass: user-jot (commit ff2b8ae)
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: Skills are failing because they are not "equipped." Intended behavior: once a skill is learned it should be available, and in combat only the skills that can actually be used at that moment should be shown.
- evidence: user-spotted at 2026-05-30T13:57:17Z (manual playtest)
- suggested_fix: [user has not specified — iterate to determine] drop the equipped-gate for learned skills; filter the in-combat skill list to those castable right now (affordable tokens + valid stance/target). Relates to Phase 82a equippedSkills filter — may need a product re-decision.
- source: user
- addressed: 2026-06-01 via Phase 97(c), commit `8df2971` (drained via /oversight 2026-06-02). Learned skills no longer gated as "not equipped"; in-combat list surfaces currently-usable skills.

### [HIGH] /plan/bearings.md — Hard rule 10 says verify gate is RED and "the loop CANNOT autonomously commit" — stale, blocks/misleads ✅
- resolved: 2026-06-01 via /oversight (51st call). Rewrote bearings.md Hard rule 10 to state the verify gate is GREEN and the loop commits autonomously (Phase 2 migration shipped in 527f021; ~96 phases shipped since). Stale RED-gate hold removed.
- pass: 18 (commit fd525e3)
- viewport: n/a (repo-proxy)
- auth_state: anonymous
- category: drift
- observation: bearings.md Hard rule 10 declares the verify gate "currently RED on a pre-existing typecheck failure" from an `axiomancer-mechanics` `Consumable.effect → effectId` rename, and concludes "Until Phase 2 (engine-API-drift fix) ships the migration, the loop CANNOT autonomously commit — manual `/ship-a-phase` only, at intervention spectrum level 0." This is the single most damaging stale claim in the orientation doc: Phase 2 shipped long ago, the engine is now pinned 0.11.0, and the loop has autonomously committed 90+ phases since with verify green. A fresh maintainer (or the loop reading its own bearings) is told it must not commit.
- evidence: plan/bearings.md:269-278 "10. **The verify gate is currently RED** ... the loop CANNOT autonomously commit — manual `/ship-a-phase` only" vs package.json pin `axiomancer-mechanics: 0.11.0` and the shipped Phase 2 / 90+ later phases in plan/steps/01_build_plan.md.
- suggested fix: Delete Hard rule 10 (or mark it RESOLVED with the fixing commit and the current green verify count); the live verify status belongs in one place, not contradicted across the doc.
- source: file-read (repo-proxy)

### [MED] /docs/testing.md — PR self-check tells newcomers to put tests under `app/<route>/e2e/`, contradicting the doc's own `state/e2e/` mandate ✅
- pass: 18 (commit fd525e3)
- viewport: n/a (repo-proxy)
- auth_state: anonymous
- category: consistency
- observation: docs/testing.md is the canonical hermetic-test standard. Its File-conventions section says "NEVER put non-route files inside `app/`" (line 87) and mandates `state/e2e/<feature>.engine.test.ts` (line 100) — which is where all real tests live. But the same doc's PR self-check checkbox (line 198) tells contributors to add "at least one new test under `app/<route>/e2e/`". A newcomer following the checklist places their first test under `app/`, which trips the route-tree guard test. AGENTS.md:82-83 echoes the same wrong path.
- evidence: docs/testing.md:198 "[ ] At least one new (or modified) test under `app/<route>/e2e/`" vs docs/testing.md:87 "NEVER put non-route files inside `app/`" and :100 "`state/e2e/<feature>.engine.test.ts`"; actual tests in `state/e2e/`, `state/persistence/e2e/`, `state/presenters/__tests__/`.
- suggested fix: Change docs/testing.md:198 (and the AGENTS.md:82-83 echo) to `state/e2e/`.
- source: file-read (repo-proxy)
- addressed: Already fixed in prior commit - docs/testing.md:198 correctly references `state/e2e/` and AGENTS.md:80-82 also uses correct paths. Finding was already resolved before this iterate tick.

### [MED] /docs/testing-guide.md — unfilled QA-template skeleton: omits Memoir tab, placeholder contacts, name-collides with docs/testing.md ✅
- pass: 18 (commit fd525e3)
- viewport: n/a (repo-proxy)
- auth_state: anonymous
- category: comprehension
- observation: docs/testing-guide.md reads as a copied generic mobile-QA template that was never filled in, and it sits one keystroke from docs/testing.md (the real hermetic-test standard) so a maintainer can't tell which is authoritative. It lists the tabs as "Combat, Character, Inventory, Exploration, Event" — omitting Memoir, which ships as a tab — and carries dead placeholders: "[internal testing email]", "[development team contact]", "[List any known issues...]", "#mobile-testing Slack channel".
- evidence: docs/testing-guide.md:7 tab list omits Memoir; :59 "Email: [internal testing email]"; :85 "[List any known issues that are planned for future fixes]"; :101 "Technical Issues: [development team contact]".
- suggested fix: Add a top banner clarifying this is the manual TestFlight/Play QA checklist (vs docs/testing.md = the hermetic-test standard), add the Memoir tab, and remove or fill the placeholder contact stubs.
- source: file-read (repo-proxy)
- issue: #255
- addressed: 2026-06-04 via commit cf94ee7
- fix: Added missing Memoir tab to core functionality checklist and top banner clarifying this is manual QA checklist vs hermetic test standard. Placeholder contacts were already filled in previous commits.

### [LOW] /plan/bearings.md — Stack table pins engine `^0.4.x` while the rest of the file + package.json pin exact `0.11.0` ✅
- pass: 18 (commit fd525e3); addressed at commit f003a8a
- viewport: n/a (repo-proxy)
- auth_state: anonymous
- category: consistency
- observation: The "Stack (locked — do not re-litigate)" table pins the engine at `^0.4.x`, but the External-services row (line 79) and package.json both pin it exact at `0.11.0`. A stale cell inside the table that's explicitly labelled "locked — do not re-litigate" undercuts trust in the table.
- evidence: plan/bearings.md:62 "Engine | `axiomancer-mechanics` npm package (pinned ^0.4.x)" vs :79 "Pinned **exact** (e.g. `0.11.0`)" and package.json "axiomancer-mechanics": "0.11.0".
- suggested fix: Update the Stack-table cell to the exact current pin (`0.11.0`) so it agrees with line 79 and the lockfile.
- source: file-read (repo-proxy)
- fix: Updated stack table engine pin and external services example to reflect current ^0.15.0 from package.json

### [HIGH] general — Equipment has no visible effect on character stats ✅
- pass: user-jot (commit `5e6cd5e`)
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: I still don't understand why equipment has no effect on stats? Either update the UI to show the change in stats that occur on changing equipment, or call it out in the next oversight that I need to create a gh issue for the engine if it's missing there.
- evidence: user-spotted at 2026-05-26
- suggested_fix: [user has not specified — iterate to determine]
- source: user
- addressed: 2026-05-26 via commit `be1469d`
- fix: Equipment items were not showing their stat effects because the templateToEquipment function was not mapping the engine's baseStatModifiers to the mobile app's expected statModifiers field. Fixed by adding statModifiers mapping in state/selectors/equipment.ts line 126. This affects all equipment sources: debug seed, populate all items, and treasure loot. Equipment stats like +2 Body or +1 Physical Defense now properly appear in character sheet derived stats and affect combat calculations.

### [MED] general — Tooltip mentions "mana" which is incorrect for Mind ✅
- pass: user-jot (commit `5e6cd5e`)
- viewport: unspecified
- auth_state: anonymous
- category: voice
- observation: The tooltip mentions "mana" which is incorrect. Mind does more than that.
- evidence: user-spotted at 2026-05-26
- suggested_fix: [user has not specified — iterate to determine]
- source: user
- addressed: 2026-05-27 via commit `9a09162`
- fix: Updated MIND stat tooltip to use 'focus' instead of 'mana' throughout. Changed body text from 'governs mana, skill cost recovery...' to 'governs focus, skill cost recovery...' and footnote from '+1 mana per mind point' to '+1 focus per mind point'. The terminology better reflects that Mind represents more than just spell resources and aligns with the game's archaic voice.

### [MED] /self — Level Up button at top of SELF screen + stat-allocation modal ✅ (PROMOTED → Phase 73 via /oversight 33rd call, design bundle landed `design/handoff-2026-05-23/`)
- pass: user-jot (commit `3de163f`)
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: We need a "Level up" button at the top of the "SELF" screen to allow for the player to level up. I'll go to design and have us create a modal for stat allocation on level up
- evidence: user-spotted at 2026-05-22
- suggested_fix: [waiting on design — the prompt file `design/levelup-modal-prompt.txt` landed 2026-05-22 specifying both surfaces (SELF-header `ASCEND` strip + full-screen LevelUpModal). User confirmed via /oversight 2026-05-22 (32nd call) that the design is in progress at <https://claude.ai/design/p/019e0f5a-a0f0-753b-be1e-8939e6011384>. The actual handoff bundle hasn't been generated yet — the 2026-05-22 bundle at `design/handoff-2026-05-22/` covers aftermath modals only. Once the levelup bundle lands (likely `design/handoff-<date>/project/screens/levelup.jsx`), this row promotes to its own phase. Until then it stays Pending so the next /oversight sees it.]
- source: user


### [HIGH] general — Equipment has no effect on player stats ✅
- pass: user-jot (commit `b12f1e9`)
- issue: #192
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: Equipment still doesn't appear to have an effect on the player's stats. This is a big one.
- evidence: user-spotted at 2026-05-25
- addressed: 2026-05-25 via commit `71a0b6d`
- fix: Mobile app's equipItemAction and unequipItemAction now call engine's equipItem/unequipItem functions which apply/remove equipment stat bonuses and recalculate derived stats. Previously only reordered inventory for visual display without applying actual stat modifiers. Added imports for engineEquipItem and engineUnequipItem from axiomancer-mechanics. Equipment stats now properly affect character sheet derived stats and combat calculations.
- suggested_fix: [user has not specified — iterate to determine]
- source: user

### [MED] general — Verify all tooltip content is 100% accurate ✅
- pass: user-jot (commit `b12f1e9`)
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: The tooltips look great. Let's make sure all the information provided in the tooltips are 100% accurate.
- evidence: user-spotted at 2026-05-25
- suggested_fix: [user has not specified — iterate to determine]
- source: user
- playtest: see PLAYTEST_REPORT.md [F08] (Explain buttons on SELF produce no visible output)
- issue: #217
- addressed: 2026-05-28 via commit `375c371`
- fix: Fixed mana→focus terminology inconsistency across tooltip system. Skill tooltips, combat action help text, and debug strings now consistently use "focus" terminology matching MIND stat description rather than "mana".

### [MED] /combat — Space heart/body/mind buttons evenly in combat modal ✅
- pass: user-jot (commit `b12f1e9`)
- viewport: unspecified
- auth_state: anonymous
- category: visual
- observation: In the combat modal, let's space the heart/body/mind buttons evenly instead of listing from the left.
- evidence: user-spotted at 2026-05-25
- suggested_fix: [user has not specified — iterate to determine]
- source: user
- playtest: see PLAYTEST_REPORT.md [F07] (Mind stance card clipped at right edge)
- issue: #256
- addressed: 2026-06-04 via commit 026fc7f
- fix: Changed stance card row layout from justifyContent 'space-between' to 'space-evenly' to distribute heart/body/mind buttons evenly across modal width instead of pushing them to edges

### [MED] /self — Stat allocation cross-effects not reflected in actual character stats ✅
- pass: user-jot (commit `b12f1e9`)
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: The stat allocation says when I level up a given stat, it effects the other ones (ie. adding mind effects heart). I like that idea, however, it is not reflected in the characters actual stats. This one needs my final call, but it's something we need to talk about.
- issue: #285
- addressed: 2026-06-06 via commit 92feb74
- fix: Clarified that the engine has no cross-stat effects - each stat only affects its primary category (heart→emotional, body→physical, mind→mental). Fixed misleading test name and added clear documentation. The system was correctly showing engine truth; user expectation of cross-effects was incorrect.
- evidence: user-spotted at 2026-05-25
- resolution: User call made via /oversight 2026-05-26 (42nd call).
  Decision: **keep cross-effects**, but engine-authoritative.
  Three actions: (1) engine issue filed requesting
  `previewStatAllocation` API, (2) mobile's local approximation
  (`lib/previewAllocation.ts` + `DerivedPreviewRibbon`) to be
  removed so players don't see inaccurate coefficients,
  (3) phase candidate filed for re-wiring when engine ships.
  See PHASE_CANDIDATES.md `[score 5.0] Cross-stat effects on
  level-up`.
- source: user

### [MED] /exploration — Only show node labels for unvisited, available nodes ✅
- pass: user-jot (commit `3c9c534`)
- viewport: unspecified
- auth_state: anonymous
- category: visual
- observation: In the map, there are a lot of labels for each node. We should only display a label to a node if the player has not ventured there yet and is available as a choice.
- evidence: user-spotted at 2026-05-25
- suggested_fix: [user has not specified — iterate to determine]
- source: user
- issue: #267
- addressed: 2026-06-05 via commit `2085246` (Phase 107)
- fix: Implemented map node label display optimization. Only shows labels for unvisited available nodes that are currently shown as options (first 4 choices). Added shouldShowLabel prop to MapNodeMarker component based on vm.options filtering.

### [HIGH] /combat — Combat UX unintuitive, numbers and icons lack meaning, needs design overhaul ✅
- pass: user-jot (commit `dde93f4`)
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: From a less "mechanical" perspective and more of a UX perspective, the combat modal may not provide as intuitive an experience as possible. I see numbers and icons, but I don't know what they mean. We need a design overhaul.
- evidence: user-spotted at 2026-05-25
- suggested_fix: [needs design — user flagged this as a UX overhaul, not a code fix]
- source: user
- playtest: confirmed by PLAYTEST_REPORT.md [F02] (encounter jargon), [F04] (battle log ability names), [F05] (LET phase numbers), [F06] (CRUCIBLE symbols)
- addressed: design-first via Phase 96 (`939efd2`) then implemented in Phase 98, commit `b6593df` (drained via /oversight 2026-06-02). Iconography / terminology / information-hierarchy overhaul closed AUDIT [4.5] and playtests [F02]/[F04]/[F05]/[F06].

### [HIGH] README.md — Critical mismatch between test promise and actual state blocks new contributors ✅
- pass: 17 (commit c7a1c9c)
- issue: #196
- viewport: desktop
- category: comprehension
- observation: README.md promises 'npm test' runs Jest but AGENTS.md reveals no test runner is installed yet, creating false expectations for new contributors
- evidence: README.md line 41: 'npm test' with note 'Not wired yet' vs AGENTS.md line 31: 'No test runner is installed yet'
- addressed: 2026-05-26 via commit 56e25f2
- fix: Added prominent warning box before Quick start section explaining that npm test requires Spec 01 setup first. Removed misleading caveat from Scripts table. New contributors now have clear expectations about testing setup requirements.
- suggested fix: Move the test setup caveat to a prominent warning box in README.md before the Quick start section
- source: browser

### [MED] general — Dual agent instruction files create navigation confusion ✅
- pass: 17 (commit c7a1c9c)
- issue: #222
- viewport: desktop
- category: navigation
- observation: Both AGENTS.md and agents.md exist with overlapping content but different purposes, confusing new maintainers about which is authoritative
- evidence: AGENTS.md is pre-nexus orientation, agents.md is nexus rule book
- addressed: 2026-05-29 via commit `b6d81ef`
- fix: Added clear disambiguation notice at the top of AGENTS.md directing maintainers to agents.md for current autonomous loop instructions. New maintainers now have clear guidance about which file is authoritative for nexus operations.
- suggested fix: Add clear disambiguation notice in AGENTS.md header directing to agents.md for current instructions
- source: browser

### [HIGH] general — No title screen or onboarding for new players ✅
- pass: deep-playtest (2026-05-25, commit d560e8c)
- viewport: mobile (414x896)
- auth_state: anonymous
- category: comprehension
- observation: Game loads directly to WILDS map with no title screen, tutorial, or orientation. New players have zero context for vocabulary (PILGRIM, VITAE, LEAGUES) or goals.
- suggested_fix: Title card before first WILDS load, setting tone + minimal vocabulary. Design-routed to DESIGN_SPEC.md.
- source: deep-playtest [F01]
- addressed: 2026-05-28 via commit `785ae6e`
- fix: Added TitleScreen component that appears for new players (level 1, at fv-1, minimal progress). Gothic-themed welcome experience with AXIOMANCER branding, flavor text explaining world setting (PILGRIM, VITAE, LEAGUES), and BEGIN JOURNEY button. Includes onboarding presenter to detect new vs returning players and modifies index route to show title conditionally. Comprehensive test coverage for both components.

### [HIGH] /encounter — FLEE gives no feedback, morale has no UI surface ✅
- pass: deep-playtest (2026-05-25, commit d560e8c)
- viewport: mobile (414x896)
- auth_state: anonymous
- category: observation
- observation: After fleeing, encounter modal closes silently. Cost says "-ii morale" but morale is not displayed anywhere. No confirmation, no animation, no indication cost was paid.
- suggested_fix: Flee narrative beat (prose style) + morale bar on exploration card or SELF tab. Both-routed: code (narrative) + design (morale bar in DESIGN_SPEC.md).
- source: deep-playtest [F03]
- addressed: 2026-05-27 via Phase 92 implementation
- fix: Added narrative feedback after fleeing encounters via toast message "you fled the encounter. the path bends away.\n\nmorale -2" in actions.ts lines 1392-1393. Exposed morale value on SELF tab via character presenter moralMeter mapping (line 358) displayed as "willpower" value. Both parts of the F03 finding are now resolved with test coverage in flee-action.engine.test.ts.



### [HIGH] /specs/README.md — Phase 116 engine boundary debugging guidance missing ✅
- pass: 23 (commit 88a3708)
- viewport: repository
- category: comprehension
- observation: Phase 116 (token accumulation bug #227) requires understanding engine vs mobile boundary debugging but no clear documentation exists for this debugging approach
- evidence: Build plan references 'suspected engine-vs-mobile boundary' without guidance. Critical for active work but specs don't explain boundary debugging methodology
- suggested fix: Add 'Debugging Engine Boundaries' section in specs/00-how-to-use-specs.md with concrete steps to trace state flow through presenters
- source: repo-proxy
- issue: #298
- addressed: 2026-06-07 via commit 03be47c
- fix: Added comprehensive 'Debugging Engine Boundaries' section with methodology, common bug patterns, and Phase 116 token accumulation example

### [MED] general — Add tiny stat-effect label to each combat action button ✅
- pass: user-jot (commit 14cae2c99ce7a5fdfe09876a451f89c31b83f3ae)
- viewport: unspecified
- auth_state: anonymous
- category: visual
- observation: There should be a very concise (maybe 15 chars max), small, text label of which status effect (no name, just direct stat effect) on each button (attack/defend/each specific skill)
- evidence: user-spotted at 2026-06-07T09:02:26Z
- suggested_fix: [user has not specified — iterate to determine]
- source: user
- issue: #289
- addressed: 2026-06-07 via commit 7bd8493
- fix: Added statEffect field to ActionOption interface with concise labels (+DMG, +DEF, VAR) displayed as small text below hint on each action button

### [MED] general — Resource system has no visual representation ✅
- pass: user-jot (commit 0529532347c306d861233a4456604db319e7c195)
- viewport: unspecified
- auth_state: anonymous
- category: visual
- observation: the resource system doesn't have any visual representation. The lane has been replaced with a legend instead
- evidence: user-spotted at 2026-06-06T16:04:36Z
- resolution: Phase 113 replaced the crucible token `glyph` (◐◑◒◓◉) with the same 3-letter code as `short`, so the strip rendered duplicate text ("BOD/BOD/count") instead of a token symbol. Restored the visual glyphs in `buildCrucibleTokens` so the strip now shows a colored token symbol + readable label + count. (combat-modal-tokens-button branch)
- source: user

### [MED] /death — Death screen LEDGER shows wrong encounter count + internal node ID ✅
- pass: deep-playtest (2026-05-25, commit d560e8c)
- viewport: mobile (414x896)
- auth_state: anonymous
- category: observation
- observation: LEDGER shows "encounters survived: i" despite dying in the encounter (should be 0). Also shows "deepest node: fv-14" instead of human-readable "Tide Pool."
- suggested_fix: Fix encounter counter logic + resolve node ID to name via map layout lookup. Phase candidate filed.
- source: deep-playtest [F09, F10]
- addressed: 2026-06-05 via commit 293f171
- fix: Fixed encounters survived calculation by subtracting 1 from encountersFaced when player died (aftermath.engine.ts:227) and added resolveNodeIdToHumanName function (lines 160-171) to resolve node IDs like "fv-14" to human-readable names like "Tide Pool" via map layout lookup. Both F09 and F10 playtest findings resolved.

### [MED] general — update mechanics engine to version 0.13.0 ✅
- pass: user-jot (commit `2673c5e`)
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: update mechanics to version 0.13.0
- evidence: user-spotted at 2026-05-27T12:45:45Z
- suggested_fix: [user has not specified — iterate to determine]
- source: user
- issue: #214
- addressed: 2026-05-28 via commit `3b83793`
- fix: Updated axiomancer-mechanics from version 0.11.0 to 0.13.0 in package.json and updated package-lock.json. All 1530 tests pass with new engine version, ensuring backward compatibility.

### [MED] /inventory — Satchel equipment tap should open modal directly, skip intermediate step ✅
- pass: user-jot (commit `b12f1e9`)
- issue: #198
- viewport: unspecified
- auth_state: anonymous
- category: navigation
- observation: There's an HTML warning when I click a piece of equipment in Satchel. Let's change this so that when I click a piece of equipment, it goes right to the modal. Within the modal, I can cancel, equip, or discard. Skip the inbetween step.
- evidence: user-spotted at 2026-05-25
- addressed: 2026-05-26 via commit `43fd331`
- fix: Equipment items now open modal directly on tap instead of requiring intermediate expansion step. Non-equipment items still expand to show details first. This addresses the HTML warning from nested button structure and improves UX by reducing clicks for equipment interactions. Updated corresponding test to reflect new direct-to-modal behavior.
- suggested_fix: [user has not specified — iterate to determine]
- source: user
- playtest: see PLAYTEST_REPORT.md [F13] (nested button HTML violation in item cards)

### [HIGH] general — Combat encounters stop triggering after first encounter until refresh ✅
- pass: user-jot (commit `b12f1e9`); addressed at commit `46adcac` via /iterate.
- issue: [mirror-failed: 2026-05-25T14:30:00Z]
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: Once the player completes 1 single combat encounter, subsequent combat encounters do not trigger until I refresh the game. That is not good.
- evidence: user-spotted at 2026-05-25
- resolution: Fixed encounter node consumption bug in `state/actions.ts:resolveCurrentMapEventAction`. Root cause: encounter nodes were incorrectly being marked as "consumed" after resolving, preventing subsequent encounters. Modified logic to only consume nodes for one-time events (rest, treasure, quest, gathering) while keeping encounter nodes reusable. Encounter nodes can now trigger multiple encounters on repeated visits.
- source: user
### [MED] general — Tooltip walkthrough across non-combat surfaces (inventory, SELF, exploration, memoir) ✅
- pass: user-jot (commit `6415787`); walkthrough delivered at commit `<this-tick>` via /iterate.
- issue: #162
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: Make sure to add tooltips to other things, outside of combat as well. Do a walkthrough and see if there are any icons that don't have explanations for them.
- evidence: user-spotted at 2026-05-24T03:55:00Z (follow-up to Phase 75 ship `de3bb7b`)
- resolution: Walkthrough audit pass delivered as 4 AUDIT.md rows (one per surface: SELF [4.5], Inventory [4.0], Memoir [3.5], Exploration [3.5]). Each row enumerates the icons / glyphs lacking tap-tooltip wiring, maps each to the appropriate presenter `TooltipKind` (most already in the union; exploration needs an additive `'map-node'` kind), and notes the natural Phase-74-Ticks-C-E mapping. The wiring itself remains under the Phase 74 Ticks C-E candidate (PHASE_CANDIDATES.md `[score 5.5]`) — `/oversight` promotes the multi-phase split when ready; the walkthrough findings feed each sub-tick's brief. Surfaces audited: 4. Discrete icon families enumerated: 14.
- source: user


### [MED] /self — Level Up button gating + stat-allocation lifecycle ✅
- pass: user-jot (commit `b96ea05`); addressed at commit `<this-tick>` via /iterate.
- issue: #161
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: Once a player has enough experience, the level up button should be available to press and trigger a "level up". Once they level up, drain the experience and show the stat allocation button. Once the player has no available stats to apply, remove the stat allocation button
- evidence: user-spotted at 2026-05-24T03:50:03Z
- resolution: Wired the full level-up lifecycle. CharacterViewModel gains `levelUpReady: boolean` (`experience >= experienceToNextLevel`). New `actions.levelUp()` wrapper forwards to the engine `levelUp` action. New `<LevelReadyStrip>` component (sibling to AscendStrip — same sulfur-banded chrome, "✠ ASCEND READY" copy, chevron-up glyph instead of lock-seal) mounts on the SELF screen when `levelUpReady && pendingPoints === 0`; tap dispatches `actions.levelUp()`, engine drains XP into pending stat points, AscendStrip takes over next render. AscendStrip auto-dismisses when `pendingPoints === 0` (existing Phase 73 behaviour — completes the cycle). 8 new pins (4 presenter + 4 component); 1293/1293 verify green.
- source: user

### [MED] /combat — Tighten Phase 75 tooltip content (name + stat effect, colour-coded) ✅
- pass: user-jot (commit `6415787`); addressed at commit `<this-tick>` via /iterate.
- issue: #160
- viewport: unspecified
- auth_state: anonymous
- category: visual
- observation: For the combat HUD tap-tooltips, make sure the explanation is concise (name, and stat effect. No description, no explanation. Just Name, and the effect it has on the stats. Try to color coordinate both the effect and the tooltip to which stat it effects
- evidence: user-spotted at 2026-05-24T03:55:00Z (follow-up to Phase 75 ship `de3bb7b`)
- resolution: Effect tooltip body now reads the payload-derived stat-effect line (e.g. `+1 physical attack`) via new `formatEffectStatEffect(payload, fallback)` helper; engine `description` is dropped. `<TapTooltip>` gains an optional `accent: 'heart' | 'body' | 'mind' | 'neutral'` prop that tints the title + border; `selectTooltipContentFor('effect')` derives the accent from the primary stat target (`physical*` → body/rust, `mental*` → mind/sulfur, `emotional*` → heart/blood). Skill tooltips also get stance-derived accents. 16 new pins + 1 contract update; 1285/1285 verify green.
- source: user

### [MED] general — Tap-tooltip phase ✅ (PROMOTED → PHASE_CANDIDATES.md candidate)
- pass: user-jot (commit `cfc524c`); promoted via oversight 31st call 2026-05-22 to `plan/PHASE_CANDIDATES.md` as `[score 5.0] Tap-tooltip primitive + per-surface wiring`. Multi-tick scope — touches every interactive icon across SELF / combat / inventory surfaces. Next `/expand` or `/oversight` decides the slicing (one global primitive + per-surface wiring vs. per-surface ticks).

### [needs-user-call] / — No accessible deployment URL for web critique
- pass: 20 (commit f10820a)
- viewport: mobile
- category: infra
- observation: No accessible deployment URL for web critique - mobile app not currently served at localhost:19006 or any public URL
- evidence: WebFetch to localhost:19006 failed - development server not running
- suggested fix: Start development server with 'npm run web' or provide deployed URL for critique
- source: browser

### [MED] general — Expand DEV mode to cover every ported mechanic ✅
- pass: user-jot (commit 7821f13); addressed at commit `<this-tick>` by filing as a phase candidate (not a one-tick fix — meta-feature ask requires planning).
- Filed as `[score 6.0] DEV-mode coverage expansion — one debug affordance per ported mechanic` in `plan/PHASE_CANDIDATES.md` `## Pending`. Includes initial gap inventory (XP / mana / alignment / effects / event-kind triggers / dialogue jump / quest state / friendship / currency / HUD overrides) + suggested phased breakdown (Phases 61-66 as small per-mechanic phases, or one bigger parent phase with sub-rows).
- Next: `/oversight` decides on the slicing (parent-with-sub-rows vs. per-mechanic small phases) and promotes the first piece.

### [MED] general — no combat encounters in the first map ✅
- pass: user-jot (commit c3c4e4e); addressed at commit `<this-tick>` via `state/exploration-maps/event-pools.ts`
- Root cause: mobile's layout files annotated nodes with type (encounter / boss / rest / gather / treasure / quest), but the engine's map-event pool registry was empty — `resolveMapEvent` returned `{ kind: 'none' }` on every node. Walking onto an encounter node did nothing because no pool was registered for the engine's `lookupPool(continent, mapName, nodeId)` to find.
- Fix: a new module that registers one pool per node type (encounter / boss per map; rest / gather / treasure / quest shared across maps) and then a per-node `setNodeEventPoolOverride` call for every node in both fishing-village and northern-forest layouts. Auto-registers on module import; `app/_layout.tsx` imports it as a side-effect so production picks up the registration at boot. Enemy slugs picked from the engine's `EnemiesByMap` library (fishing-village → tidepool-crab / coastal-tyrant; northern-forest → disatree / the-disagreement).
- Result: walking onto `fv-3` now fires an `encounter` event with `tidepool-crab`. The existing flow does the rest: tab-mutex flips, STRIFE tab becomes visible, combat starts.

### [MED] general — manual combat trigger + starting-character seed for testing ✅
- pass: user-jot (commit 686d598); addressed at commit `<this-tick>` via DebugCombatButton + DevAutoSeed
- Manual trigger: SELF tab DEBUG · COMBAT row's STRIKE button calls `actions.startCombat(createMockEncounterEnemy())` + `enterCombat()` + routes to /(tabs)/combat. Bypasses the tab-mutex catch-22 (STRIFE tab hidden until combat active; combat-active requires encounter node; first map has none — second jot row).
- Auto-seed: `<DevAutoSeed />` mounts inside the providers tree at the root layout; on first DEV boot with empty inventory, fires `actions.debugSeed()` once. Persisted state means subsequent launches skip. `__DEV__` false → no-op.

### [MED] /app/(tabs)/exploration/index.tsx:373-379 — aftermath banner display literals lifted onto presenter ✅
- pass: 16 (commit 56725ae); addressed at commit fd410cc
- viewport: repository
- category: voice
- observation: Phase 41 shipped the aftermath banner with
  four display literals inline at the view layer ('IT IS WON' /
  'IT IS DONE' / 'The foe yielded.' / 'The foe fell.') chosen
  by branching on `lastOutcome`. Hard Rule #8 violation —
  per-outcome copy + the outcome→copy mapping both belong on
  a presenter.
- fix: new `selectAftermathCopy(outcome): AftermathCopy | null`
  helper in `state/combat-mode.tsx` returning `{eyebrow,
  title, subtitle}` for victory + parley, null for defeat +
  flee. Banner becomes prop-driven (no string defaults).
  Exploration screen reads the helper; banner mounts only
  when copy is non-null (filters silent outcomes
  automatically). +4 hermetic cases pinning the per-outcome
  contract.

### [LOW] /components/AftermathBanner.tsx:53 — accessibilityLiveRegion + announceForAccessibility added ✅
- pass: 16 (commit 56725ae); addressed at commit fd410cc
- viewport: repository
- category: a11y
- observation: Banner had `pointerEvents="none"` on its root
  with no accessibility props. The 2500ms auto-dismiss meant
  a screen-reader user got no notification of the victory.
- fix: added `accessibilityLiveRegion="polite"` +
  `accessibilityLabel` on the root View; the useEffect that
  starts the dismiss timer also fires
  `AccessibilityInfo.announceForAccessibility(`${eyebrow}.
  ${title}`)` as a one-shot.

### [MED] /plan/phases/phase_32_design_refresh.md:88-109 — Sub-tick log stale (only A-D listed; E-H shipped) ✅
- pass: 15 (commit f1a8a94); addressed at commit e78dbb6
- viewport: repository
- category: docs
- observation: Phase 32 brief's Sub-tick log table stopped at
  tick D (encounter modal seam, 2026-05-17) with closing
  "Next: tick E (awaiting user port commit)". Ticks E (dock),
  F (slot filter), G (per-slot glyphs), H (node toast) have
  all shipped since but weren't enumerated in the canonical
  log location. A fresh maintainer reading the brief would
  miss four shipped ticks.
- fix: appended rows E (02beaeb / 2a23047), F (9c6024d /
  cc38107), G (05127df — self-contained), H (d7489a2 —
  self-contained); updated trailing "Next:" line to "tick I
  (awaiting next port commit per dispatch rule)" with a
  cross-link to design-spec.md for the inventory of
  un-ported surfaces.

### [LOW] /design-spec.md:266-270 — internal contradiction on cold-codex sizing ✅
- pass: 15 (commit f1a8a94); addressed at commit e78dbb6
- viewport: repository
- category: docs
- observation: closing summary claimed "items 1-10 above are
  all single-port-sized" but item 4 (cold-codex aesthetic
  variant) explicitly described as "three screens" and "much
  larger surface than the per-port sub-ticks" — recommended
  as a fresh `Phase 25` candidate. Self-contradiction.
- fix: rephrased the summary to "Items 1-3 and 5-10 are each
  single-port-sized; item 4 is the exception" with one-line
  explanation pointing back to item 4's body.

### [LOW] /app/(tabs)/inventory/index.tsx:30-66 — per-slot `ItemGlyph` variants ported (helmet / gauntlet / boot / breastplate / ring) ✅
- pass: 14 (commit 2a23047); addressed at commit 05127df
- viewport: repository
- category: design-fidelity
- observation: ItemGlyph fell through to one quad-path glyph
  for Head/Body/Hands/Feet/Accessory — 5 of 7 Equipment Dock
  slots rendered identically when filled, undermining the
  dock's "WORN VS. UNWORN AT A GLANCE" hint copy.
- fix: ported the 5 bespoke per-slot SVG paths from
  `design/handoff-2026-05-16/project/screens/inventory.jsx:
  513-541` to `app/(tabs)/inventory/index.tsx` ItemGlyph,
  translating `<svg>/<path>/<circle>` to react-native-svg
  primitives (`Svg`/`Path`/`Circle`). Each branch carries a
  one-line glyph-meaning comment (helmet w/ horns, gauntlet
  pair, boot profile, breastplate w/ shoulders, ring w/
  stone). Verify 497/497 unchanged.



### [MED] /app/(tabs)/inventory/index.tsx:149 — `'— bare —'` lifted onto `EquipmentDockViewModel.bareLabel` ✅
- pass: 14 (commit 2a23047); addressed at commit 594105b
- issue: #91
- viewport: repository
- category: voice
- observation: `SlotCard` rendered the empty-slot copy
  `'— bare —'` as an inline literal at the view layer. Hard
  Rule #8 violation; sibling chrome (`headerLabel`,
  `hintLabel`) already on the VM.
- fix: added `bareLabel: string` to `EquipmentDockViewModel`;
  `DOCK_BARE_LABEL = '— bare —'` constant in
  `inventory.engine.ts`; `buildEquipmentDock` emits it.
  Screen's `SlotCard` now takes a `bareLabel` prop and reads
  `vm.bareLabel` from the dock VM. +1 hermetic case pinning
  the new field. Verify 492/492 unchanged.

### [MED] /app/(tabs)/inventory/index.tsx PaperDoll — 10× `"#0a0807"` → `AXM.silhouette` ✅
- pass: 14 (commit 2a23047); addressed at commit 2a22a74
- issue: #90
- viewport: repository
- category: consistency
- observation: The Phase 32 tick E port shipped `PaperDoll`
  with 10 inline `fill="#0a0807"` literals. Same Hard Rule #8
  class as the just-drained 8× `'#100d0a'` sweep.
- fix: added `AXM.silhouette = '#0a0807'` to `theme/axm.ts`
  with a JSDoc comment placing it visually between `deepBg`
  (void) and `dockBg` (panel) — warmer than deepBg, cooler
  than dockBg. Replaced 10 `fill="#0a0807"` with
  `fill={AXM.silhouette}`. Same value; no behavioural delta.
  Verify 492/492 unchanged.

### [MED] sweep — 8× hex literal `'#100d0a'` → `AXM.panelBg` across combat/inventory/exploration/_layout ✅
- pass: 13 follow-up; filed via `/oversight` 2026-05-18;
  addressed at commit 9339e3e
- issue: #89
- viewport: repository
- category: consistency
- observation: After three prior single-component drains
  (memoir `8a4f69c`, character `9531270`, StatusCard
  `8b3747b`), 8 more `'#100d0a'` occurrences remained
  across 4 files. `/oversight` directed a sweep rather than
  4 more single-component ticks.
- fix: eight mechanical replacements
  (`backgroundColor: '#100d0a'` → `backgroundColor: AXM.panelBg`)
  across `app/(tabs)/combat.tsx:199,804,818,829`,
  `app/(tabs)/inventory/index.tsx:388,448`,
  `app/(tabs)/exploration/index.tsx:496`,
  `app/(tabs)/_layout.tsx:199`. Same value; no behavioural
  delta. Verify 488 / 488 unchanged. Project is now
  `'#100d0a'`-free outside `theme/axm.ts`.

### [MED] /components/StatusCard.tsx:56 — hex literal `'#100d0a'` → `AXM.panelBg` ✅
- pass: 13 (commit ce4f851); addressed at commit 8b3747b
- issue: #88
- viewport: repository
- category: consistency
- observation: StatusCard's `card` style hard-coded
  `'#100d0a'` — same literal pass 11 / pass 12 drained from
  memoir + character. Reusable component, Hard Rule #8.
- fix: one-line replace `backgroundColor: '#100d0a'` →
  `backgroundColor: AXM.panelBg` in
  `components/StatusCard.tsx:56`. Verify 488/488 unchanged.
  Broader hex-literal terrain (8 more `'#100d0a'` in
  combat/inventory/exploration/_layout) noted on the row's
  pending-state body for future passes.

### [MED] /state/presenters/event.engine.ts:323 — combat-prelude `body` lowercase ritual register ✅
- pass: 12 (commit a836031); addressed at commit 3b54f98
- issue: #87
- viewport: repository
- category: voice
- observation: Combat-prelude `body` was sentence-case stat
  block `'Level N. M HP.'` rendered under a drop-cap as
  primary narrative prose, while every sibling prelude /
  narrative body holds lowercase ritual register
  (`'the world is still.'`, `'something stirs'`, `'no
  retreat from this one.'`).
- fix: changed `body` to
  `` `level ${enemy.level} · ${enemy.health} hp.` `` in
  `state/presenters/event.engine.ts:323`. Lowercases the
  shape, swaps the period separator for a middot (matches
  other chrome separators across the surface like
  `'CONTINENT · UNKNOWN'`, `'MAP ii of vii'`-style
  formatting), drops 'HP' to 'hp' for register consistency.
  Updated the one test fixture pinning the old literal
  (`components/event/__tests__/EncounterModalOverlay.test.tsx:46`).
  Verify 488 / 488 unchanged.

### [MED] /app/(tabs)/character/index.tsx:226,229,253 — hex literal `'#100d0a'` × 3 → `AXM.panelBg` ✅
- pass: 12 (commit a836031); addressed at commit 9531270
- issue: #86
- viewport: repository
- category: consistency
- observation: Three style entries (`baseCard`, `derivedTable`,
  `slotCell`) hard-coded `'#100d0a'` — same literal / use case
  pass 11 drained from memoir (commit `8a4f69c`). Bearings
  line 109 locks "no hex literals in components".
- fix: three mechanical replacements
  (`backgroundColor: '#100d0a'` → `backgroundColor: AXM.panelBg`)
  in `app/(tabs)/character/index.tsx:226,229,253`. Mirrors
  the memoir pass-11 fix exactly. Same value; no behavioural
  delta. Verify 488 / 488 unchanged.

### [LOW] /app/(tabs)/memoir/index.tsx:174,189 — view layer label-literal comparisons → isEmpty / rationale.length ✅
- pass: 11 (commit 5be0022); addressed at commit 0e173a4
- issue: #85
- viewport: repository
- category: consistency
- observation: MemoirScreen renders the moral / philosophical
  empty-state lines conditionally on
  `vm.moralAlignment.chip.label === 'UNDECLARED'` (line 174)
  and `vm.philosophicalAlignment.label === 'UNTESTED'` (line
  189). A future voice pass that renames either band would
  silently break the conditional.
- fix: added `isEmpty: boolean` to MoralAlignment VM kind;
  DEFAULT_MORAL ships `isEmpty: true`; buildMoralAlignment
  derives it from `band.label === DEFAULT_MORAL.chip.label`
  (encapsulates rename within memoir.engine.ts). Screen
  swaps to `vm.moralAlignment.isEmpty` and (for
  philosophical) `vm.philosophicalAlignment.rationale.length
  === 0` — symmetric with line 184's existing
  `rationale.length > 0` guard. +1 hermetic test pinning the
  isEmpty contract. Verify 488 / 488 (was 487).

### [LOW] /state/presenters/inventory.engine.ts:133 — `EMPTY_MESSAGE` lowercased ('Nothing' → 'nothing') ✅
- pass: 11 (commit 5be0022); addressed at commit b90bf73
- issue: #84
- viewport: repository
- category: voice
- observation: `EMPTY_MESSAGE = 'Nothing in the satchel.'`
  was the sole sentence-cased narrative empty-state across
  every presenter; sibling surfaces all ship lowercase
  ritual register (bearings line 184).
- fix: one-character edit, `'Nothing'` → `'nothing'` in
  `state/presenters/inventory.engine.ts:133`. Aligns
  inventory with the 7 other lowercase ritual empty-states
  shipped by sibling presenters. Verify 487/487 unchanged;
  no test asserted on the literal.

### [MED] /state/presenters/exploration.engine.ts:288 — `dayDisplay` 'XXIV' YAGNI deletion ✅
- pass: 11 (commit 5be0022); addressed at commit 4913ab9
- issue: #83
- viewport: repository
- category: comprehension
- observation: Populated selector branch shipped
  `dayDisplay: 'XXIV'` as a fixed Roman numeral while the
  field's JSDoc claimed a live in-game day value. Every
  player on every map saw "day XXIV" regardless of
  progression.
- fix: confirmed engine surface has no `day` / `turn` /
  `stepCount` state (`node_modules/axiomancer-mechanics/dist/`
  has no day field). Per suggested-fix branch B (delete when
  engine doesn't expose state), deleted the `dayDisplay`
  field from `ExplorationViewModel` interface (line 88), the
  FALLBACK_VM (line 230), and the populated branch (line
  288); deleted the screen's `dayBox` / `dayLabel` / `dayNum`
  block (`app/(tabs)/exploration/index.tsx:172-175`) and the
  three matching StyleSheet entries; dropped the
  `expect(typeof vm.dayDisplay).toBe('string')` line in
  `state/e2e/exploration.engine.test.ts:37`. Same YAGNI
  pattern previously used for `swipeHint` (commit `5a8c2ea`).
  Verify 487 / 487 unchanged. Re-add via /expand when a real
  engine day counter ships.

### [MED] /app/(tabs)/memoir/index.tsx:249,280 — hex literal `'#100d0a'` → `AXM.panelBg` ✅
- pass: 11 (commit 5be0022); addressed at commit 8a4f69c
- issue: #82
- viewport: repository
- category: consistency
- observation: MemoirScreen's `questCard` and `measureChip`
  StyleSheet entries inlined the raw hex `'#100d0a'` for
  `backgroundColor`, despite `theme/axm.ts:11` already
  exporting `panelBg: '#100d0a'` named for this exact use.
  Bearings line 109 locks "no hex literals in components".
- fix: two mechanical replacements
  (`backgroundColor: '#100d0a'` → `backgroundColor: AXM.panelBg`)
  in `app/(tabs)/memoir/index.tsx:249,280`. Same value, no
  behavioural delta. Verify 487 / 487 unchanged.

### [LOW] /state/presenters/event.engine.ts:152 — `STRIFE STIRS` is verb-as-chrome — `[accepted-as-design]` ✅
- pass: 6 (commit 08bcf5e); resolved via /oversight 2026-05-16
- viewport: repository
- category: voice
- observation: Reader twice flagged the sash text as
  sentence-shaped (subject + present-tense verb) cased like
  chrome — bearings line 180 reserves uppercase for chrome
  labels and lowercase ritual for narrative.
- resolution: **Accepted as intentional design.** The sash
  itself is a chrome element (diagonal flag at the
  illustration's top-left), and the slightly-verb-shaped
  phrasing reads as an in-world omen on the encounter card
  rather than as inappropriate narrative-in-chrome. A
  verb-as-chrome exception is now pinned in
  `plan/bearings.md` Hard Rules so future critique passes
  don't re-surface this row.

### [MED] /state/presenters/inventory.engine.ts:133 — EMPTY_MESSAGE 'sack' → 'satchel' (Phase 32 catch-up) ✅
- pass: 10 (commit 306e3f1); addressed at commit 2822455
- issue: #81
- viewport: repository
- category: consistency
- observation: Phase 32 SACK→SATCHEL rename swept chrome but
  not this narrative line; the empty-state copy was the only
  surviving 'sack' on the inventory surface.
- fix: single-string flip in `state/presenters/inventory.
  engine.ts:133` — `'Nothing in the sack.'` → `'Nothing in
  the satchel.'`. Lowercase ritual register preserved; no
  test asserted on the literal. Verify 487 / 487 unchanged.

### [LOW] /state/e2e/combat.engine.test.ts — buildPhaseStack `'ended'` branch pinned ✅
- pass: 8 (commit 9a4bdeb); addressed at commit f87a5ec
- issue: #80
- viewport: repository
- category: comprehension
- observation: phaseStack contract tests covered every
  non-ended phase but not the `currentPhase === 'ended' ?
  'resolving' : currentPhase` special case in buildPhaseStack
  — a regression dropping the special case would silently
  collapse every row to past post-fight + stop rendering the
  ResolvePanel.
- fix: 1 test added — drive combat to `phase === 'ended'`,
  assert phaseStack[3] stays current with key 'resolving'
  and label 'IV · LET'; the three earlier rows are all past.
  Inline comment explains why the special case matters so a
  future reader doesn't strip it. Verify 487 / 487 (+1 from
  486).

### [LOW] /components/event/EncounterModalOverlay.tsx:1-19 — JSDoc now mentions vm.preludeChrome contract ✅
- pass: 9 (commit 65dc6ad); addressed at commit cfac6f1
- issue: #79
- viewport: repository
- category: docs
- observation: File JSDoc described backdrop / seal-chain /
  mount-conditions but never the four-string `vm.preludeChrome`
  contract or the `preludeChrome === null` defensive guard.
- fix: appended a paragraph naming all four chrome strings,
  documenting the defensive null return, and pointing at the
  new `components/event/__tests__/EncounterModalOverlay.test.tsx`
  for component-level pins.

### [LOW] /state/presenters/exploration.engine.ts:99-116 — drawerCopy.swipeHint YAGNI dead-field deleted ✅
- pass: 9 (commit 65dc6ad); addressed at commit 5a8c2ea
- issue: #78
- viewport: repository
- category: consistency
- observation: `swipeHint` declared + populated + tested
  but unconsumed since Phase 32 dropped horizontal swipe.
- fix: deleted from the VM type, JSDoc paragraph,
  `DRAWER_COPY` constant, and test assertion. Same shape
  as pass-4 `vm.a11y` and pass-7 `emptyMoral` drains.
  Re-add if a future horizontal surface materializes.

### [MED] /components/event/EncounterModalOverlay.tsx — hermetic component test added ✅
- pass: 8 (commit 9a4bdeb); addressed at commit 234c7a6
- issue: #77
- viewport: repository
- category: comprehension
- observation: New ~330-line overlay shipped without a
  component test — mount conditions, FLEE-disabled-for-boss
  branch, and non-dismissible backdrop all unguarded.
- fix: new file `components/event/__tests__/EncounterModalOverlay.test.tsx`
  with 8 hermetic cases across 3 describe blocks (mount
  conditions / FLEE-disabled-for-boss / non-dismissible
  backdrop). Verify 486 / 486 (+8 from 478; suite count
  29 → 30).

### [LOW] /state/presenters/memoir.engine.ts:127,359 — `'untested.'` chip/narrative register split ✅
- pass: 7 (commit 3385951); addressed at commit aeec2c3
- issue: #76
- viewport: repository
- category: voice
- observation: Same `'untested.'` string used as both chip
  label (chrome register expects ALL-CAPS no period) and
  empty-state line (narrative register).
- fix: chip label flipped to `'UNTESTED'` (matches RUTHLESS /
  STERN / UNDECLARED / BENEVOLENT / SAINTLY); empty-state
  line `emptyPhilosophical` unchanged at `'untested.'`. Screen
  check + 2 test pins updated; JSDoc block added at the
  constant explaining the split.

### [MED] /state/presenters/event.engine.ts:75-82 — PreludeChrome JSDoc refreshed to four-field reality ✅
- pass: 9 (commit 65dc6ad); addressed at commit d843be8
- issue: #75
- viewport: repository
- category: docs
- observation: JSDoc said "both strings" but the interface
  carried 4 fields after pass-7/8 chrome lifts — undercount.
- fix: rewrote summary to enumerate all 4 strings (eyebrow,
  sash, seal-bar, flee-disabled hint); noted the SEALED · NO
  RETREAT chain bars + FLEE-disabled hint as the additions
  from pass-7/8; added a note about the null branch the
  EncounterModalOverlay early-return guard depends on.

### [MED] /plan/ docs — SACK→SATCHEL sweep across briefs ✅
- pass: 6 (commit 08bcf5e); addressed at commit b342553
- issue: #74
- viewport: repository
- category: docs
- observation: Phase 32's SACK→SATCHEL rename landed in
  presenter + tests but plan/ docs still spelled SACK in
  places; grep returned 16 hits and a fresh maintainer
  couldn't tell historical from live.
- fix: hybrid sweep — `phase_33_memoir_tab.md:254` flipped to
  SATCHEL (was a current-state claim about live tab bar);
  `phase_31_tabs_design_pass.md` + `phase_8_navigation_app_shell_polish.md`
  gained a one-line breadcrumb at the top noting the
  rename. Historical-quote contexts (rename narrative in
  build plan, Phase 31 brief body, prior CRITIQUE Done rows,
  AUDIT bias descriptions) left as-is — they quote what the
  surface was at a given commit, not what it is now.

### [MED] /components/event/EncounterModalOverlay.tsx:42-43 — seal + flee-hint chrome routed through vm.preludeChrome ✅
- pass: 8 (commit 9a4bdeb); addressed at commit ec5f875
- issue: #73
- viewport: repository
- category: voice
- observation: Two encounter-modal chrome strings parked at
  view-module scope (`SEAL_LABEL`, `FLEE_DISABLED_HINT`)
  instead of flowing through `vm.preludeChrome` per the
  established pattern from pass 6's ENCOUNTER_LABEL drain.
- fix: extended `PreludeChrome` with `sealLabel` +
  `fleeDisabledHint`; populated in `withPreludeChrome`;
  `ChainBar` takes label as prop; overlay reads both off the
  VM. The two existing `preludeChrome contract` shape pins
  now include the full 4-field VM in lockstep.

### [MED] /app/(tabs)/exploration/index.tsx:281,324 — drawer header + LEAGUES column label lifted onto VM ✅
- pass: 8 (commit 9a4bdeb); addressed at commit 6251e83
- issue: #72
- viewport: repository
- category: voice
- observation: WHITHER PILGRIM eyebrow + LEAGUES column label
  were inline JSX; same Hard Rule #8 class drained pass 6/7.
- fix: extended `ExplorationViewModel.drawerCopy` with `title`
  + `leaguesLabel`; populated in `DRAWER_COPY` constant;
  screen reads `vm.drawerCopy.title` + `…leaguesLabel`. 2
  pins added to the existing drawer-copy test case.

### [MED] /plan/steps/01_build_plan.md:334-335 — Phase 33 row body refreshed SACK → SATCHEL ✅
- pass: 7 (commit 3385951); addressed at commit 2f846a3
- issue: #71
- viewport: repository
- category: docs
- observation: Phase 33's row body (ticked `[x]` at `6c1ddfa`
  after the rename) still spelled the fourth tab `SACK` —
  fresh stale reference in post-rename narrative.
- fix: single-line swap `SACK` → `SATCHEL` on line 335.
  Historical-quote contexts (pre-Phase-31 quotes) still
  covered by the standing SACK docs sweep row.

### [HIGH] /app/(tabs)/combat.tsx:9-15,312 — file-level + section JSDoc refreshed post phase-stack swap ✅
- pass: 8 (commit 9a4bdeb); addressed at commit 5ffb330
- issue: #70
- viewport: repository
- category: docs
- observation: File JSDoc + line-321 section banner still
  described the horizontal swipe carousel removed in
  `9222bf9` — actively misleading for fresh maintainers.
- fix: rewrote the Q5-carousel paragraph in present tense
  describing the vertical PhaseStack pattern (past/current/
  future states, sulfur dot indicator, swap removed the
  swipe-to-change-phase affordance); section banner flipped
  to "header + vertical PhaseStack". Reference commit
  `9222bf9` for the port history.

### [HIGH] /app/(tabs)/combat.tsx:761 — ResolvePanel `✠ DEPART` / `✠ NEXT ROUND` chrome lifted onto VM ✅
- pass: 8 (commit 9a4bdeb); addressed at commit 0981e46
- issue: #69
- viewport: repository
- category: voice
- observation: Continue button inlined two chrome literals
  in JSX — same Hard Rule #8 class drained pass 6 / pass 7.
- fix: added `nextActionLabel: string` to `ResolveSlice`
  (phase-driven), pinned `NEXT_ROUND_LABEL` + `DEPART_LABEL`
  at module scope, dropped unused `isEnded` prop from
  ResolvePanel, +3 hermetic pins. Verify 478 / 478 (+3 from
  475).

### [MED] /scripts/smoke-screens.mjs:34-42 + test mirror — memoir route added to smoke coverage ✅
- pass: 6 (commit 08bcf5e); addressed at commit 78bb861
- issue: #68
- viewport: repository
- category: consistency
- observation: ROUTES list + mirror test missed Phase 33's
  MEMOIR tab; visual smoke coverage silently skipped the new
  journal surface for the entire phase shipping window.
- fix: added `{ name: 'memoir', path: '/memoir' }` to ROUTES
  in both files; mirror test flipped from "five (4 tabs)" to
  "six (5 tabs)" with `'memoir'` added to arrayContaining.
  Baseline PNG generates on the next harness run.

### [MED] /app/(tabs)/memoir/index.tsx + memoir.engine.ts:358-359 — VM `emptyMoral` / `emptyPhilosophical` strings now consumed ✅
- pass: 7 (commit 3385951); addressed at commit 883af26
- issue: #67
- viewport: repository
- category: consistency
- observation: VM exposed `emptyMoral` + `emptyPhilosophical`
  strings the screen never read — dead VM contract, same
  class as the `vm.a11y` finding drained pass 4.
- fix: MeasureSection now renders `emptyMoral` beneath the
  moral chip when label === 'UNDECLARED'; renders
  `emptyPhilosophical` beneath the philosophical chip when
  label === 'untested.'. Satisfies the Phase 33 brief
  §"Empty / loading / error states" copy contract. New
  testIDs `memoir-moral-empty` + `memoir-philosophical-empty`
  for future smoke-render pins.

### [MED] /state/presenters/memoir.engine.ts:236,244 — `PARLEYED WITH` for flee outcome → re-voiced to FLED ✅
- pass: 7 (commit 3385951); addressed at commit 8717d8e
- issue: #66
- viewport: repository
- category: voice
- observation: Chronicle was mapping the flee outcome to
  `'PARLEYED WITH'` / `'talks turn aside.'` — the engine has
  no parley outcome today, so the journal was claiming the
  player negotiated when they actually fled. Pass-7 reader
  flagged it as lying; /oversight 2026-05-16 chose Re-voice
  to FLED.
- fix: `buildChronicle` flee branch now emits label `'FLED'`
  + body `'the path bends away.'` matching the FELLED /
  ROUTED BY register. JSDoc updated; test fixture flipped
  in lockstep. PARLEYED WITH can return as its own mapping
  when/if the engine ships a real parley outcome.

### [MED] /state/presenters/memoir.engine.ts:447-462 — `selectMemoirViewModel` JSDoc stale after Ticks C+D shipped ✅
- pass: 7 (commit 3385951); addressed at commit c15c755
- issue: #65
- viewport: repository
- category: docs
- observation: JSDoc still narrated Tick B as `(this commit)`
  and described Ticks C-D as future placeholders, even though
  all four ticks shipped on 2026-05-16.
- fix: rewrote the `selectMemoirViewModel` JSDoc in present
  tense (one paragraph per VM section with read source +
  current behaviour); moved the tick-by-tick changelog into a
  `## Phase 33 history` subsection. Refreshed the file-level
  JSDoc to drop the pre-ship framing.

### [HIGH] /app/(tabs)/memoir/index.tsx:42 — QuestCard inlines objective bullet glyphs ✅
- pass: 7 (commit 3385951); addressed at commit 40db0e3
- issue: #64
- viewport: repository
- category: consistency
- observation: Inline `'✓ '` / `'○ '` glyphs at the view layer
  — same Hard Rule #8 class pass 6 just closed for event.tsx.
- fix: exported `QUEST_OBJECTIVE_BULLET = { done: '✓',
  pending: '○' }` constant + extended `MemoirQuestRow.objectives`
  with `bullet: '✓' | '○'`; screen now reads `{o.bullet}
  {o.text}`. +2 pins added to the existing active-quests test
  case. Verify 461 / 461 unchanged (pins inside existing case).

### [LOW] /state/presenters/event.engine.ts:115 — empty-state body is second-person imperative + modern sentence-case ✅
- pass: 6 (commit 08bcf5e); addressed at commit d6bf779
- issue: #63
- viewport: repository
- category: voice
- observation: Empty-state body `'Walk on. The world has not
  yet stirred.'` was second-person imperative + modern
  sentence-case; moved to the VM in pass 5 but never re-voiced
  to match the lowercase-ritual register adopted everywhere else.
- fix: re-voiced to `'the world is still.'` — lowercase ritual
  matching `'the paths close.'` / `'none at hand.'`. Avoided
  the verb `stirred` so the empty-state body doesn't echo the
  `STRIFE STIRS` chrome sash. No test added (existing shape
  test still covers the field; pinning the exact string would
  over-constrain). Verify 461 / 461.

### [MED] /state/presenters/event.engine.ts:144-155 + :203-251 — `'ENCOUNTER'` literal duplicated between preludeChrome and badge ✅
- pass: 6 (commit 08bcf5e); addressed at commit 11c47db
- issue: #62
- viewport: repository
- category: consistency
- observation: Same `ENCOUNTER` literal lived in two places
  derived from the same `isBoss` boolean (`withPreludeChrome`
  eyebrow + `composeCombatPrelude` badge) with no test pinning
  the relationship — silent-drift risk on any copy edit.
- fix: exported `ENCOUNTER_LABEL = 'ENCOUNTER'` module constant
  referenced from both sites; +2 hermetic pins under
  `selectEventViewModel: preludeChrome contract` (non-boss
  asserts both equal `ENCOUNTER_LABEL`, boss asserts eyebrow
  ends with it + badge diverges to `OMEN OF DOOM`).
  Verify 461 / 461 (+2 from 459).

### [HIGH] /app/event/index.tsx:217-218,291,298 — display literals still at view layer post Phase-32 port ✅
- pass: 6 (commit 08bcf5e); addressed at commit 994fb02
- issue: #61
- viewport: repository
- category: consistency
- observation: After the Phase 32 prelude-chrome lift, four
  display literals (`BACK`, `RETURN`, `SKIP ›`, `✠ A RECKONING`)
  still lived at the view layer — same Hard Rule #8 class pass 5
  closed elsewhere.
- fix: added `EventChrome` interface + `EVENT_CHROME` constant +
  `withChrome` wrapper sibling to `withPreludeChrome`; lifted
  all four strings off `app/event/index.tsx` onto `vm.chrome.*`;
  +4 hermetic tests under `selectEventViewModel: chrome
  contract`. Verify 428 / 428 (+4 from 424).

### [needs-user-call] /app/(tabs)/_layout.tsx — tab labels MAP / COMBAT / SHEET / SACK mix registers ✅
- pass: 2 (commit d967f27)
- viewport: repository
- category: navigation
- observation: The four tab titles wobble as a coherent set — three are objects/places (MAP, SHEET, SACK) and one is an event/state (COMBAT).
- evidence: `app/(tabs)/_layout.tsx` lines 98, 113, 128, 142.
- suggested fix: Align to one register.
- source: reader
- **Unblocked 2026-05-16 via `/oversight`** — promoted as Phase 31 (Tabs design pass) in `plan/steps/01_build_plan.md` with explicit register pick: **all places** (`WILDS · STRIFE · SELF · SACK`). Phase 31 ships after Phase 30 (hermetic render coverage) so the tab title pipeline is verified working before the strings change. Row moved Pending → Done; the fix lands as part of Phase 31's commit.

### [LOW] /plan/steps/01_build_plan.md — Phase 17 row's "to be drafted" parenthetical lacks owner reference ✅
- pass: 5 (commit dfb3358)
- viewport: repository
- category: comprehension
- observation: Phase 17 row referenced an unwritten brief at the time of critique.
- evidence: `plan/steps/01_build_plan.md:167-169` pre-fix (and pre-Phase-28).
- suggested fix: Append `— drafted by Phase 28` to the Phase 17 row.
- source: reader
- issue: #55
- fixed in commit `ee64020`. The brief landed via Phase 28 (`ab3912a`) and the row already cited Phase 28; this fix replaced the remaining `<this commit>` placeholder with the actual hash so the pointer is concrete.

### [LOW] /app/(tabs)/inventory/index.tsx — static category headers + `SACK · WALLET · BURDEN` hardcoded ✅
- pass: 5 (commit dfb3358)
- viewport: repository
- category: consistency
- observation: Section eyebrow + four category headers lived at the view layer; pass-3 had moved emptyMessage but skipped these.
- evidence: `app/(tabs)/inventory/index.tsx:28-33` + `:141` pre-fix.
- suggested fix: Move both onto `selectInventoryViewModel`.
- source: reader
- issue: #54
- fixed in commit `17297af` — `vm.sectionHeader` + `vm.categoryHeaders` populated; screen reads via VM; +1 hermetic shape test. 390/390 pass.

### [LOW] /app/(tabs)/character/index.tsx — "NO ACTIVE EFFECTS" hardcoded HUD-imperative ✅
- pass: 5 (commit dfb3358)
- viewport: repository
- category: voice
- observation: Effect-section empty label was hardcoded ALLCAPS at the view layer rather than the lowercase-ritual + `textTransform: 'uppercase'` pattern unified across other screens.
- evidence: `app/(tabs)/character/index.tsx:95` pre-fix.
- suggested fix: Add `emptyEffectsMessage: 'none at hand.'` to the VM; render via `textTransform: 'uppercase'`.
- source: reader
- issue: #53
- fixed in commit `69588e2` — `vm.emptyEffectsMessage = 'none at hand.'`; screen reads via the existing emptyLabel style augmented with `textTransform: 'uppercase'`. +1 shape test. 389/389 pass.

### [MED] /app/(tabs)/exploration/index.tsx — drawer empty-state + swipe hint hardcoded; voice mismatch ✅
- pass: 5 (commit dfb3358)
- viewport: repository
- category: consistency
- observation: Drawer empty-state `"No paths remain from here."` and `"swipe →"` were hardcoded ritual copy at the view layer; the empty string also read sentence-case modern rather than the article-prefix lowercase ritual used elsewhere.
- evidence: `app/(tabs)/exploration/index.tsx:244` + `:249` pre-fix.
- suggested fix: Move both strings to `selectExplorationViewModel`; rephrase as lowercase ritual.
- source: reader
- issue: #52
- fixed in commit `6122db8` — `vm.drawerCopy.emptyMessage = 'the paths close.'` and `vm.drawerCopy.swipeHint`; both code paths populated; +2 hermetic shape + regression tests. 388/388 pass.

### [MED] /app/(tabs)/combat.tsx — hardcoded ritual copy violates Hard Rule #8 ✅
- pass: 5 (commit dfb3358)
- viewport: repository
- category: consistency
- observation: Two ritual strings lived at the view layer — battle-log empty `"The air shivers. Combat begins."` and flee row `"or … flee like a craven (luck save)"`.
- evidence: `app/(tabs)/combat.tsx:259` + `:577` pre-fix.
- suggested fix: Surface both on the combat VM and drop the literals.
- source: reader
- issue: #51
- fixed in commit `96636fc` — added `vm.logEmptyMessage` + `vm.actionPicker.fleeHint`; both code paths populated; +3 hermetic shape tests. 386/386 pass.

### [MED] /app/(tabs)/character/index.tsx — `vm.a11y` block built but never consumed ✅
- pass: 5 (commit dfb3358)
- viewport: repository
- category: a11y
- observation: `selectCharacterViewModel` built a populated `a11y` block but the screen consumed zero of it; the only inline a11y string was a hardcoded `accessibilityLabel="Open Token Crucible"` on the Crucible button.
- evidence: `state/presenters/character.engine.ts:204-215` built `a11y` strings; `app/(tabs)/character/index.tsx` consumed 0 of them.
- suggested fix: Wire `vm.a11y.*` onto the section wrappers + replace the inline Crucible literal with a presenter-sourced label.
- source: reader
- issue: #50
- fixed in commit `1380a4f` — header / BASE / DERIVED / SAVES & TESTS / AFFLICTIONS & BLESSINGS / WORN & WIELDED + Crucible button all carry `accessibilityLabel={vm.a11y.<section>}`; added `vm.a11y.crucibleOpen` to the presenter. +1 shape test. 383/383 pass.

### [LOW] /state/presenters/event.engine.ts — combat-prelude boss subtitle is the same cryptic line for every boss ✅
- pass: 4 (commit 2a2c0aa)
- viewport: repository
- category: voice
- observation: Every boss opened with `'fourth seal · third sigh'`.
- evidence: `state/presenters/event.engine.ts:176`.
- suggested fix: Derive from `enemy.description` or rotate by level.
- source: reader
- issue: #46
- **Resolved 2026-05-15.** Boss subtitle prefers trimmed `enemy.description`; falls back to a 5-entry per-level table (`first seal` / `second seal` / ... / `fifth seal`) keyed on `enemy.level - 1 % 5` so repeats at the same tier are consistent but different tiers each get their own omen. Verify green at 357/357. Closes #46. See commit `28676c6`.

### [LOW] /state/presenters/event.engine.ts — village `merchants` argument received and discarded ✅
- pass: 4 (commit 2a2c0aa)
- viewport: repository
- category: consistency
- observation: Underscore-prefixed `_merchants` arg silently ignored; deferred-shop signal hidden in comment.
- evidence: `state/presenters/event.engine.ts:355-388`.
- suggested fix: Surface `merchants.length` in subtitle.
- source: reader
- issue: #45
- **Resolved 2026-05-15.** Subtitle now shows `'1 stall'` / `'N stalls'` when merchants exist (empty when none, to keep small villages tidy). The deferred-shop signal is in-VM. Verify green at 357/357. Closes #45. See commit `72487ac`.

### [LOW] /state/presenters/event.engine.ts — cutscene 'ON' button label too terse for the register ✅
- pass: 4 (commit 2a2c0aa)
- viewport: repository
- category: voice
- observation: Cutscene continue button `ON` didn't match the ritual register of sibling choice labels.
- evidence: `state/presenters/event.engine.ts:403`.
- suggested fix: `WALK ON` or `WITNESS`.
- source: reader
- issue: #44
- **Resolved 2026-05-15.** `'ON'` → `'WITNESS'`. Matches the cutscene's `A VISION` badge cadence. Verify green at 357/357. Closes #44. See commit `0038d66`.

### [LOW] /app/(tabs)/exploration/index.tsx — "Where next, pilgrim?" breaks the screen's own glyph + case convention ✅
- pass: 2 (commit d967f27)
- viewport: repository
- category: voice
- observation: Star glyph + sentence case break the ✠+ALLCAPS pattern used elsewhere.
- evidence: `app/(tabs)/exploration/index.tsx:242`.
- suggested fix: Unify to ✠ + ALLCAPS ritual.
- source: reader
- issue: #43
- **Resolved 2026-05-15.** `★ Where next, pilgrim?` → `✠ WHITHER, PILGRIM?` Verify green at 357/357. Closes #43. See commit `d6849bc`.

### [MED] /docs/combat.md — "Stance-derived stats" section references deleted `STANCE_DERIVED` constant ✅
- pass: 4 (commit 2a2c0aa)
- viewport: repository
- category: comprehension
- observation: Doc named deleted constant + future swap that already happened.
- evidence: `docs/combat.md:117-119`.
- suggested fix: Refresh bullet to post-Phase-26 reality.
- source: reader
- issue: #42
- **Resolved 2026-05-15.** Bullet rewritten to describe `deriveStancePerformance` reading `player.derivedStats` (emotional/physical/mental triples, Math.round at the mapper boundary). Verify green at 357/357. Closes #42. See commit `583dc55`.

### [MED] /state/actions.ts — pickEventChoice JSDoc still names removed `processNode` API ✅
- pass: 4 (commit 2a2c0aa)
- viewport: repository
- category: comprehension
- observation: Phase 23 migrated to `resolveMapEvent`; JSDoc still mentioned `processNode`.
- evidence: `state/actions.ts:162`.
- suggested fix: Replace with `resolveMapEvent`.
- source: reader
- issue: #41
- **Resolved 2026-05-15.** One-comment-line edit. `grep -rn processNode state/ app/ components/` now empty. Verify green at 357/357. Closes #41. See commit `133ce07`.

### [MED] /app/crucible.tsx — file-level JSDoc points at dead `app/event.tsx` path ✅
- pass: 3 (commit aaa6dbd)
- viewport: repository
- category: comprehension
- observation: JSDoc cited removed `app/event.tsx`; Phase 6 Tick C moved it to `app/event/index.tsx`.
- evidence: `app/crucible.tsx:8`.
- suggested fix: Update reference.
- source: reader
- issue: #40
- **Resolved 2026-05-15.** JSDoc now points at `app/event/index.tsx` and names the `app/_layout.tsx` Stack.Screen registration for context. Verify green at 357/357. Closes #40. See commit `5696c23`.

### [MED] /state/presenters/event.engine.ts — narrative-choice titles mix HUD-imperative with ritual register ✅
- pass: 4 (commit 2a2c0aa)
- viewport: repository
- category: voice
- observation: Three titles used HUD-imperative `YOU REST/GATHER/TAKE` while hazard/village/interaction branches used ritual phrasing.
- evidence: `state/presenters/event.engine.ts:245,263,267`.
- suggested fix: Article-prefix ritual titles.
- source: reader
- issue: #39
- **Resolved 2026-05-15.** `YOU REST → THE FIRE LOWERS`, `YOU GATHER → THE BRUSH YIELDS`, `YOU TAKE → THE CACHE OPENS`. Three string changes; matches the hazard branch's `THE AIR TURNS` pattern. Verify green at 357/357. Closes #39. See commit `8449ce9`.

### [MED] /app/(tabs)/combat.tsx — skill-availability hint "X of Y available — STANCE LOCKED" reads as a status bar ✅
- pass: 2 (commit d967f27)
- viewport: repository
- category: voice
- observation: Mixed register: lowercase progress + ALLCAPS suffix + em-dash separator. HUD readout, not scripture.
- evidence: `app/(tabs)/combat.tsx:656`.
- suggested fix: Lowercase ritual + em-dot separator.
- source: reader
- issue: #36
- **Resolved 2026-05-15.** `{N} of {M} available — STANCE LOCKED` → `{N} of {M} open · stance bound.` One-line copy change. Verify green at 342/342. Closes #36. See commit `62fc19b`.

### [MED] /app/(tabs)/exploration/index.tsx — map-node `accessibilityLabel` reads internal enum to screen readers ✅
- pass: 2 (commit d967f27)
- viewport: repository
- category: a11y
- observation: Screen-reader users heard raw enum tokens (`locked` / `completed` / `current` / `available`).
- evidence: `app/(tabs)/exploration/index.tsx:190`.
- suggested fix: Map kinds to spoken phrases.
- source: reader
- issue: #35
- **Resolved 2026-05-15.** `accessibilityLabel` now maps `locked → sealed`, `completed → walked`, `current → here`, `available → open` — ritual single-word descriptors, no second-person pronouns. Verify green at 342/342. Closes #35. See commit `3f33d72`.

### [MED] /state/presenters/event.engine.ts — choice descriptions double-uppercased between presenter and screen ✅
- pass: 3 (commit aaa6dbd)
- viewport: repository
- category: voice
- observation: Presenter labels are ALLCAPS and the screen re-uppercased the descriptions, flattening lowercase ritual cadence into HUD shouting.
- evidence: `app/event/index.tsx:93`.
- suggested fix: Drop the screen-side `.toUpperCase()`, move styling to `textTransform: 'uppercase'`.
- source: reader
- issue: #34
- **Resolved 2026-05-15.** Two-line fix in `app/event/index.tsx`: drop `description.toUpperCase()` and add `textTransform: 'uppercase'` to the `choiceSub` style. Source strings stay readable as voice copy; UI still renders caps. Verify green at 342/342. Closes #34. See commit `30e01bd`.

### [MED] /app/event/index.tsx — "✠ WHAT WILL YOU DO?" eyebrow uses modern direct-address voice ✅
- pass: 3 (commit aaa6dbd)
- viewport: repository
- category: voice
- observation: Modern quiz-prompt eyebrow out of register with the rest of the Phase 6 surface.
- evidence: `app/event/index.tsx:225-227`.
- suggested fix: Rephrase to ritual register.
- source: reader
- issue: #33
- **Resolved 2026-05-15.** `'✠ WHAT WILL YOU DO?'` → `'✠ A RECKONING'`. Matches the article-prefix ritual pattern of the surrounding badges. Verify green at 342/342. Closes #33. See commit `2ece636`.

### [MED] /state/presenters/inventory.engine.ts — empty-state copy still says "Thy sack is empty." ✅
- pass: 3 (commit aaa6dbd)
- viewport: repository
- category: voice
- observation: Banned-pronoun violation; also hardcoded in the screen layer (Hard Rule #8 violation).
- evidence: `state/presenters/inventory.engine.ts:112` + `app/(tabs)/inventory/index.tsx:83`.
- suggested fix: Rephrase + drop the hardcoded literal.
- source: reader
- issue: #32
- **Resolved 2026-05-15.** Rephrased to `'Nothing in the sack.'` `EmptySack` component now takes a `message` prop sourced from `vm.emptyMessage`. Q4 JSDoc note updated to point at the bearings rule. Verify green at 342/342. Closes #32. See commit `068322e`.

### [MED] /components/EventGate.tsx — JSDoc claims `selectHasActiveEvent` is a no-op; Spec 08 shipped ✅
- pass: 3 (commit aaa6dbd)
- viewport: repository
- category: comprehension
- observation: The gate's JSDoc said "Spec 08 will make `selectHasActiveEvent` non-trivial. Until then this is a no-op..." — but Spec 08 had shipped.
- evidence: `components/EventGate.tsx:12-14`.
- suggested fix: Rewrite the JSDoc to match the post-Phase-6 reality.
- source: reader
- **Resolved 2026-05-15 via `/oversight` (drop-now).** Phase 23 (the engine-0.7.0 migration in progress) will re-touch the event surface and rewrite this JSDoc as part of its close-out (Tick C/D in `plan/phases/phase_23_mapevents_migration.md`); filing this row as a standalone iterate target would be double-work. Resolution rolled into Phase 23's commit chain.

### [HIGH] /state/presenters/combat.engine.ts — phase banner copy still says "CHOOSE THY STANCE" / "DECLARE THY ACTION" ✅
- pass: 3 (commit aaa6dbd)
- viewport: repository
- category: voice
- observation: Bearings was updated 2026-05-15 (commit `14a9395`) to ban second-person archaic pronouns. These two strings sat on the combat HUD every turn.
- evidence: `state/presenters/combat.engine.ts:268-269`. Test pin at `state/e2e/combat.screen.test.tsx:106,114`.
- suggested fix: Rephrase without `thy` — pattern-match the sibling `✠ INVOKE A SKILL`. Update presenter + screen test.
- source: reader
- issue: #29
- **Resolved 2026-05-15.** Rephrased to `✠ CHOOSE A STANCE` and `✠ DECLARE AN ACTION` — matches the sibling `✠ INVOKE A SKILL` pattern in the same record. Test pins updated. Verify green at 321/321. Closes #29. See commit `e3da6ba`.

### [MED] /app/(tabs)/combat.tsx — "No items at hand. Coming soon." breaks voice on visible failure path ✅
- pass: 2 (commit d967f27)
- viewport: repository
- category: voice
- observation: The Item-action toast string read as a modern dev placeholder. It appeared on the most-tapped failure path (player picks Item before items exist), making it the highest-frequency voice violation in combat.
- evidence: `app/(tabs)/combat.tsx:122`: `setToast('No items at hand. Coming soon.');`
- suggested fix: Rephrase in the project's terse/archaic register and drop the shipping-status aside, e.g. `setToast('Thy hands are empty.');`
- source: reader
- issue: #28
- **Resolved 2026-05-15.** Replaced the toast string with `'Thy hands are empty.'` Verify green at 287/287. Closes #28. See commit `176cc80`.

### [HIGH] /app/event.tsx — dev-only ENCOUNTER/BOSS variant toggle shipped to players ✅
- pass: 2 (commit d967f27)
- viewport: repository
- category: comprehension
- observation: The modal event screen rendered a top-of-screen `ENCOUNTER` / `BOSS` toggle as two full-width tappable buttons — a stranger landing in this scene from `EventGate` would read it as a real choice and be confused. The accompanying comment literally tagged it `for demo`.
- evidence: `app/event.tsx:135-143`: `{/* Variant toggle (for demo) */}` … two `TouchableOpacity` rows rendered above the illustration.
- suggested fix: Gate behind `__DEV__` (or remove entirely); the screen is the player-facing modal in production, not a dev sandbox.
- source: reader
- issue: #27
- **Resolved 2026-05-15.** Wrapped the toggle JSX in `{__DEV__ && (...)}` in `app/event.tsx`. In production builds the toggle disappears entirely; in dev / Expo Go it stays so the team can still preview the boss illustration while Phase 6 (event screen wiring) is [skipped]. Default `variant` state remains `'encounter'`. Verify green at 287/287. Closes #27. See commit `c4fd3a4`.

### [LOW] /state/presenters/navigation.engine.ts — TODO comments break voice consistency ✅
- pass: 1 (commit 2a2b0b6)
- viewport: repository
- category: voice
- observation: Multiple TODO comments break the terse archaic voice with modern development language
- evidence: navigation.engine.ts lines contain 'TODO: When engine exposes' which conflicts with the ritual/archaic voice guideline
- suggested fix: Rewrite TODOs in archaic voice or use different comment style
- source: reader
- issue: #23
- **Resolved 2026-05-15.** Rewrote both `TODO`-prefixed comments in `state/presenters/navigation.engine.ts` to match the codebase's "Until / Once X ships…" pattern already used in `components/EventGate.tsx` and `state/presenters/character.engine.ts`. No behaviour change — `selectTabBadges` still returns `EMPTY_BADGES`. Closes #23.

### [MED] /app/_layout.tsx — deep link implementation status unclear ✅
- pass: 1 (commit 2a2b0b6)
- viewport: repository
- category: comprehension
- observation: Deep linking handlers are stubbed with TODO comments indicating incomplete implementation
- evidence: app/_layout.tsx lines 72-82: handleDeepLink function has logic but comments suggest incomplete functionality
- suggested fix: Complete deep link implementation or document current limitations
- source: reader
- issue: #21
- **Resolved 2026-05-15.** Removed the dead `handleDeepLink` `useEffect` block from `app/_layout.tsx` (both branches were no-ops); replaced with a comment block documenting that deep linking is declared in `app.json` but not yet wired to navigation, plus the implementation notes needed when it gets wired. Also dropped the now-unused `expo-linking` import. Closes #21.

### [MED] /package.json — deploy environment setup unclear ✅
- pass: 1 (commit 2a2b0b6)
- viewport: repository
- category: comprehension
- observation: Deploy commands exist but appear to require manual environment setup not documented for new maintainers
- evidence: package.json lines 21-22: deploy commands reference scripts/with-env.mjs and eas build but env setup is unclear
- suggested fix: Add quick start section for deploy environment setup
- source: reader
- issue: #20
- **Resolved 2026-05-15.** Added a "Deploy environment" section to README.md covering `.env.example` setup, the EXPO_TOKEN / EAS_PROJECT_ID / DEPLOY_PROVIDER table, build commands, and the `deploy:check` stub contract. Closes #20.

### [HIGH] /README.md — broken TODO.md reference ✅
- pass: 1 (commit 2a2b0b6)
- viewport: repository
- category: comprehension
- observation: README references missing TODO.md file that would contain native testing plan
- evidence: README.md line 192: 'See [`TODO.md`](./TODO.md) for the eventual native plan.'
- suggested fix: Either create TODO.md or remove the broken reference
- source: reader
- **Resolved 2026-05-15.** Removed broken reference to non-existent TODO.md file from README. Simplified text to state that native testing is not wired in current pass. See commit 7b5b44d.

### [MED] /README.md — README lacks clear onboarding flow for new maintainers
- pass: 22 (commit 83ee7f2)
- viewport: repository
- category: comprehension
- observation: README jumps from quick start to complex scripts without explaining prerequisites like Expo CLI installation
- evidence: Lines 31-32: 'You will need the Expo CLI installed; on first run, install Expo Go or build a development client.' Critical setup step is buried in Quick start section
- suggested fix: Add dedicated 'Prerequisites' section before Quick start listing required tools
- source: repo-proxy

### [HIGH] /specs/README.md — Spec dependency table references completed specs without clear status ✅
- pass: 22 (commit 83ee7f2)
- viewport: repository
- category: navigation
- observation: Spec dependency table references completed specs as blocking dependencies without clear status indicators
- evidence: Lines 65-76: Table shows Spec 01 as '[DONE]' but Specs 02, 03 are listed without clear status, creating confusion about what can be worked on
- suggested fix: Update recommended order table with current completion status for all specs
- source: repo-proxy
- addressed: 2026-06-06 via commit a8b8b68
- fix: Updated specs/README.md lines 66-73 to mark Specs 02, 03, 05, 07, and 09 as [DONE] to match their actual completion status documented in plan/steps/01_build_plan.md

### [LOW] /docs/testing.md — Testing documentation uses casual voice conflicting with project archaic tone
- pass: 22 (commit 83ee7f2)
- viewport: repository
- category: voice
- observation: Testing documentation uses modern casual tone that conflicts with project's archaic voice directive
- evidence: Line 9: 'If you can't write one, you must explain why in the PR description (and ideally fix the architecture so you can).' Uses casual modern phrasing
- suggested fix: Revise documentation to match terse, archaic voice established in bearings.md
- source: repo-proxy

### [MED] /plan/bearings.md — Bearings file lacks executive summary of current project state
- pass: 22 (commit 83ee7f2)
- viewport: repository
- category: comprehension
- observation: Bearings file has dense technical content but lacks executive summary of current project state
- evidence: Lines 8-27: Project description starts immediately with technical details without high-level status overview
- suggested fix: Add 'Current Status' section summarizing shipped phases and next milestones
- source: repo-proxy

### [LOW] /docs/adr/README.md — ADR index lacks brief summaries for decision context
- pass: 22 (commit 83ee7f2)
- viewport: repository
- category: comprehension
- observation: ADR index lacks brief summaries making it hard to understand what each decision covers without reading full ADR
- evidence: Lines 17-23: ADR list shows only titles like 'Engine truth and presenter boundary' without explaining scope or impact
- suggested fix: Add one-sentence summaries for each ADR explaining its scope and key decision
- source: repo-proxy

### [MED] /repository structure — Multiple overlapping documentation sources lack clear hierarchy
- pass: 22 (commit 83ee7f2)
- viewport: repository
- category: comprehension
- observation: Repository has multiple overlapping documentation sources without clear hierarchy for new maintainers
- evidence: Found README.md, AGENTS.md, agents.md, docs/ folder, specs/ folder, plan/ folder all containing different types of project documentation
- suggested fix: Create single entry point documentation that guides maintainers through the doc hierarchy based on their role
- source: repo-proxy
