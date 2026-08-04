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
