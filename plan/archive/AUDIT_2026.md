# Audit archive — 2026

> Append-only. Rows and pass narrative moved verbatim out of `plan/AUDIT.md`; seeded by TRIM THE FAT T4 (2026-09-25).

## Pass narrative — site audit 2026-09-11, passes 1-11 (archived 2026-09-25)

# Site audit — 2026-09-11

> `/march` dispatched to `/iterate` (no pending phase, no content-lifecycle
> category due, `/forge`'s 48h world-growth window still open via
> `f56fa198`, `/expand`'s 20-commit/48h window not yet open). Hard rule §7.5
> applied: `plan/CRITIQUE.md` has 20+ open Pending rows, so this pass scored
> those (category Z, external-critique) rather than running a fresh
> site audit.
>
> **Second pass, same date.** The block below is a full re-score (a
> sub-agent read all ~50 Pending rows end to end, not a skim) after the
> first pass's [9.0] shipped. It found the "mid-combat crash, 30 seeded
> runs could not reproduce" row (2026-08-19, issue #277) scoring higher
> than this morning's quick pass had it (ease was undercounted — the row
> named one precise, cheap remaining axis), picked it, and shipped it
> (commit `c51547ae`): `combat-round-e2e.mjs` gained `LEVEL_UP=1`,
> closing the row's own stated "ship the remaining axis" condition. The
> crash itself is still UNREPRODUCED on web. Top 5 below is refreshed
> for the next pass.
>
> **Third pass, same date.** Top score [5.9] stays parked — it names its
> own blocker (owner device log) and can't be shipped blind this tick,
> same as the explicitly-parked late-collapse row below. Before picking
> the next two, actually did the staleness check both of their own
> `next` fields already flagged rather than deferring it again: read
> `Coastal-Village/maps.ts` + `MapEvents/content.ts` directly. Both
> [4.7] and [4.2] turned out fully stale — the fishing-village redesign
> (Phase 53c/53d/60/61) pinned every node's foe explicitly, dropped
> Brine Hag from the map entirely, and put a guaranteed pre-boss rest +
> a deliberately-low-leveled boss ahead of the climax. Closed both
> RESOLVED-STALE in `plan/CRITIQUE.md` (Pending → Done) with the
> supporting reads on each row — no code shipped for either, nothing to
> tick here beyond the Top 5 refresh. That left [3.5] exploration as the
> actual top actionable score; shipped it (commit `6fe4e47c`, issue
> #294): `MapCanvas.tsx`'s one-time initial-camera effect now fits the
> whole focus-node bounding box into the viewport instead of just
> centring the centroid at 1x, so a wide open branch can't leave its
> outermost node off-screen at mount. Top 5 below is refreshed again for
> the next pass — only two rows (crash, hazard-fan) are freshly
> confirmed live; the rest of the list needs the same direct-read
> discipline before its next pick, not assumed accurate from an older
> pass.
>
> **Fourth pass, 2026-09-11 (`/march` tick).** Hard rule §7.5 applied
> again — `/march`'s dispatch chain (triage clean, no HIGH-critique-free
> critique window, no pending phase, no content-lifecycle category due,
> `/forge`'s 48h world-growth window still open via `f56fa198`,
> `/expand`'s 20-commit/48h window not yet open) landed on `/iterate`,
> and Pending still had ~20 open rows, so a sub-agent re-read all of them
> end to end against current source rather than trusting older framing.
> Confirmed [5.9] (crash) still blocked on the owner's device log and
> [HIGH late-collapse] still PARKED (both untouched, re-verify before
> ever picking). [3.5] (hazard-fan) was the top actionable score — shipped
> it (commit `8f3acef7`, issue #295): `RouteSelect.tsx`'s opening-hand
> overlap widened `-32`→`-22`, AND the existing `CardDetailOverlay`/
> `onInspect` pattern (already used by the live in-round hand) was wired
> onto the preview so any name still covered is one tap away — did both
> of the row's suggested-fix options rather than picking one, since
> neither alone gets every name legible in a fixed-5-card 90px-wide fan
> on a 390px screen. No rows in this pass turned out stale — all ~20 were
> re-confirmed live against current source. Top 5 below is refreshed with
> the sub-agent's scored findings for the next pass.
>
> **Fifth pass, 2026-09-11 (`/march` tick).** Same dispatch chain landed
> on `/iterate` again (triage clean, both open CRITIQUE.md HIGHs still
> block the critique gate, no pending phase, no content-lifecycle
> category past its 15-commit/36h threshold, `/forge`'s 48h world-growth
> window still open via `f56fa198`, `/expand`'s 20-commit/48h window not
> yet open). [5.9] (crash) re-confirmed still blocked on the owner's
> device log — not picked. [3.2] (dialogue reply-card echo) was the top
> actionable score — re-verified live by direct read of
> `event.engine.ts:572-576` (label/description still the same source
> string) and both render sites before shipping. Shipped it (commit
> `393354c6`, issue #296): guarded `app/dialogue/index.tsx`'s reply row
> and `app/event/index.tsx`'s choice row so the sub-line only renders
> when it differs from the label (case-insensitively) — combat-prelude
> and the interaction "SO BE IT"/"Continue" choice already differ, so
> they render unaffected. Added regression coverage for both screens in
> `event.screen.test.tsx`. Moved the row Pending → Done in
> `plan/CRITIQUE.md`. Top 5 below is refreshed for the next pass.

> **Sixth pass, 2026-09-11 (`/march` tick).** Same dispatch chain landed on
> `/iterate` again (hard rule §7.5: `plan/CRITIQUE.md` still had ~20 open
> Pending rows, so this pass scored those plus a full `grep '^### \['`
> sweep of `plan/AUDIT.md`'s own non-CRITIQUE rows, rather than a fresh
> site audit). Found this Top 5 block stale on arrival: its own [2.4]
> village-stall row had already shipped in the immediately-preceding commit
> (`2836d821`, issue #297), with its `plan/CRITIQUE.md` row already moved
> Pending → Done — not re-picked, just dropped from the refresh below.
> Re-verified every open `plan/CRITIQUE.md` Pending row against current
> source: the two art-register rows (incoherent art vocab, fixed "ruined
> city" backdrop) both name their own fix as out of scope for `/iterate` —
> an art-direction decision / dedicated art phase, not a code change, so
> near-zero ease; the two `[HIGH]` rows (sixth-axis equipment, post-combat
> reward crash) stay excluded per their standing loop-call/blocked status;
> every remaining LOW/MED row (color-hex debt, akrasia swap-pool tension,
> fated-course dead test hook, stale Card Ledger metrics, AccessoryKind
> closed union, hand-card 3-line clip, pixel-art-heart style outlier, two
> missing engine hooks, UI-communication testing gap) scored below the
> survivors already in this block. `plan/AUDIT.md`'s own non-CRITIQUE
> Pending rows were mostly `[loop-call]`/`[needs-user-call]` or now belong
> to an `adjust-*` steward's lane per THE CONTENT LIFECYCLE SPLIT; the real
> competition was the open AUDIT-native scored rows ([2.1] two dead
> agent-e2e walkthroughs, [2.0] mobile `as any` clusters, [1.8] flag-on
> tray-die a11y gap, [1.6] a11y gaps, [1.5] keepsake/death-flag growth,
> [1.5] `HazardBoard.tsx` length). [2.1] scored highest on paper but its
> true ease is far lower than filed once actually investigated — confirmed
> genuinely dead via `docs/lexicon.json`'s own retired-vocabulary registry,
> but the row's "two automation files" framing undersells the real scope
> (README.md's feature table + 4 specs + 2 docs also describe the same
> retired system as current) — not shipped blind; see the row's own new
> update note in Pending. **[1.8] (flag-on tumbling tray die drops
> `assigned`/`specialConviction` a11y opts) was the top genuinely-actionable
> score** — verified live by direct read (`RollingDie.tsx:141` forwarded
> only `die/size/dimmed` to the real `CombatDie`; `CombatBoard.tsx` already
> computed both `isAssigned`/`specialConviction` values but only threaded
> them to the static, non-ritual `<CombatDie>` branch). Shipped it (commit
> `f9f2be28`, issue #298): added the two props to `RollingDie`, forwarded
> them to its inner `CombatDie`, wired `CombatBoard`'s existing computation
> through at the `<RollingDie>` call site, and added
> `RollingDie.a11y.test.tsx` (mirrors `CombatDie.a11y.test.tsx`'s coverage
> shape) proving both opts reach the rendered label. `npm run verify
> --workspace axiomancer-mobile`: 261 suites / 2657 tests green. Top 5
> below is refreshed for the next pass.

> **Seventh pass, 2026-09-12 (`/march` tick).** Dispatch chain landed on
> `/iterate` again (triage clean; critique not yet due at 5 commits/~8h
> since pass 36; no pending phase; no content-lifecycle category past its
> 15-commit/36h threshold — cards/equipment/enemies/keywords/npcs all sit
> at 1-12 commits since their own pass-7 ticks; `/forge`'s 48h world-growth
> window still open via `47bcda82`, ~43.7h old at dispatch; `/expand`'s
> 20-commit/48h window not yet open at 17 commits/~25.7h since pass 14).
> Read latest rather than re-running a full site audit (hard rule §7.5:
> `plan/CRITIQUE.md` still carries ~19 open Pending rows). [2.0] (mobile
> `as any` clusters) is now `[x]` RESOLVED (issue #299, commit `2dc459b4`,
> landed by the immediately-preceding `/iterate` tick) — confirmed via
> `git log`, not re-picked. Of the remaining Top 5 rows: [5.9] (post-combat
> reward crash) stays excluded, still blocked on the owner's device log;
> the `[HIGH] late-stage global collapse` row stays PARKED per the standing
> `/oversight 2026-08-08` ruling. That leaves [1.6] (`web:container`
> dev-server script) and [1.5] (card-editor missing three mechanic-field
> form controls) as the only actionable, unblocked rows — both re-verified
> still live and unshipped by direct read of `axiomancer-mobile/scripts/
> dev-server-container.sh` and `CardForm.tsx`'s `grant_pip`/`spend_all_pips`
> cases (no `synergy` case exists). Top score is 1.6, under this skill's
> §6 failure-mode-6 threshold of 3.0 — **no actionable iterate work this
> tick**. `plan/bearings.md` "Plan expansion posture" reads **bold** —
> handing off to `/expand` per §6 rather than shipping a low-value pick or
> stopping. No row shipped, no commit from this pass; Top 5 below is
> otherwise unchanged (only the resolved [2.0] row is now `[x]`).

> **Eighth pass, 2026-09-14 (`/march` tick).** Dispatch chain landed on
> `/iterate` again (triage clean; critique not due — 5 commits/~7.9h since
> pass 37; no pending phase; content-lifecycle gate checked all five
> categories fresh, none past 15 commits/36h; `/forge`'s 48h world-growth
> window still open via `c6ca37d7`; `/expand`'s 20-commit/48h window not
> yet open at 1 commit/~3.7h since pass 15). Hard rule §7.5 applied again:
> `plan/CRITIQUE.md` had 8 open Pending rows, two of them new since the
> seventh pass's read (critique pass 37 filed the mobile hand-fan-overlap
> row and the shop-effect-duplication row below). Standing Top 5 stayed
> unchanged from pass seven ([5.9] blocked on owner device log, `[HIGH]`
> late-collapse PARKED, [1.6]/[1.5] both under the 3.0 floor) — scored the
> two new pass-37 rows against that floor instead of re-running a full
> site audit. The hand-fan row: investigated `handFanLayout`
> (`CombatBoard.tsx:269`) directly rather than trusting the critique
> screenshot alone — a 2026-09-13 fix (`140f4c8b`) already picks the
> widest available band for a 5-card hand (351px board-edge band over the
> 183px chrome-safe one), so the ~62px overlap at n=5 is already close to
> the structural floor for 120pt cards on a 375pt screen, and the
> existing `onInspect` tap-to-detail wiring (confirmed live via
> `CombatEncounterPanel.tsx:726`) already lets a player read any covered
> card's full name by tapping its visible sliver — the residual gap is
> first-glance legibility polish, not a functional block, and a real fix
> risks reworking the fan's width math for marginal gain (impact ~5, ease
> ~5, score 2.5 — left open, not shipped blind). The shop-effect row
> scored higher: `buff_critical_damage_up`'s `grantAdvantage` payload
> (`Stance[]`) already supports single-stance grants generically per
> `effect-modifiers.ts:255-256`, confirmed via grep that the effect id is
> referenced by no card or other item, so differentiating the two
> consumables was a contained data-only addition, not an engine change
> (impact 5, ease 8, score 4.0 — clears the floor). Shipped it (commit
> `f19afd0d`, issue #307) via the `card-expert` sub-agent (delegation
> table: balance/effect findings route there): two new single-stance
> advantage buffs in `buffs.library.json`, the two consumables rewired,
> mobile keyword gloss added, and a regression test pinning the two
> consumables to distinct effect ids. `npm run verify --workspace
> axiomancer-mechanics`: 213/213 files, 3432/3432 tests, build green.
> `npm run verify --workspace axiomancer-mobile`: 299/299 suites,
> 2854/2854 tests, 3/3 snapshots, lint/typecheck/assets/art green. Row
> moved Pending → Done in `plan/CRITIQUE.md` with its resolution. Top 5
> below is unchanged (the shipped finding lived in CRITIQUE.md, not this
> table) — next pass should re-score the still-open hand-fan row fresh
> rather than trusting this pass's 2.5 as durable, since the fan's exact
> numbers shift with hand size and screen width.

> **Ninth pass, 2026-09-14 (`/march` tick).** Hard rule §7.5 applied again:
> `plan/CRITIQUE.md` still had open Pending rows, so two sub-agents did a
> genuinely fresh re-read rather than trusting any prior pass's framing —
> one read every `plan/CRITIQUE.md` Pending row end to end against current
> source, the other swept `plan/AUDIT.md`'s own non-CRITIQUE Pending rows
> for anything not already `[loop-call]`/`[needs-user-call]`/steward-lane.
> Confirmed [5.9] (crash) still blocked on the owner's device log and
> `[HIGH]` late-collapse still PARKED — neither picked. The CRITIQUE.md
> sweep's best live candidate was the mobile hand-fan overlap row (~3.0,
> real but layout-tuning-hard, `CombatBoard.tsx:269` re-verified). The
> AUDIT.md sweep surfaced a genuinely fresh top score: `[docs]` "Scheduled
> playtest references name retired Hazard and Fishing Village route
> identities" (impact 7 x ease 8 / 10 = 5.6) — re-verified live by direct
> read (not just trusting the row) of `docs/cli.md` (still `--hazard H01`
> in two places), the walkthrough's `.goal.md` + `.json` script (still
> `fv-2 -> fv-12` / Driftwood Husk), and `fishingVillage.nodes` (`fv-2`'s
> `connectedNodes` no longer include `fv-12` at all — the old `--route
> fv-2,fv-12` example was a broken command, not just stale prose). Shipped
> it (commit `541e4ad4`, issue #308): fixed both `docs/cli.md` examples to
> the current `cracked-cliff` hazard slug, rewrote the walkthrough's route
> description/commands/pass-fail-conditions/diagnostic notes and its
> `.json` script to the current authored `fv-2 -> fv-11 -> fv-13` / Little
> Belle route, manually ran both the corrected `--script` and `--route`
> forms end-to-end before shipping (both resolve the encounter and
> complete Hazard-Pattern combat), and added the row's own requested
> docs/registry parity witness to `cli.docs-examples.engine.test.ts`
> (extends its existing --enemy/preset pattern: hazard ids must resolve
> in `HAZARD_LIBRARY`, the walkthrough's documented `--route` chain must
> be a real connected path in `fishingVillage.nodes` — the exact check
> that would have caught this drift). `npm run verify --workspace
> axiomancer-mechanics`: 213/213 files, 3435/3435 tests, build green.
> Also surfaced but not shipped (kept for the next pass, see Top 5
> below): a `[contract]` row on `axio-mcp-server.mjs`'s freshness-check-
> once-per-process gate (~4.2), a `[tests]` row on the mobile verify gate
> being blind to Playwright journeys (~3.5), and a re-assessment of the
> `critique:drive` artifact-deletion hazard (tagged `[loop-call]` but
> scores as a concrete, low-risk fix on direct read, ~3.2) — none picked
> this tick per hard rule §7.1 (one fix per tick), all newly promoted
> into the Top 5 refresh below.

> **Tenth pass, 2026-09-17 (`/march` tick).** Dispatch chain landed on
> `/iterate` again (triage clean; critique not due — 4 commits/~9.4h since
> pass 39; no pending phase; content-lifecycle gate checked all five
> categories fresh, none past 15 commits/36h; `/forge`'s 48h world-growth
> window still open via `2227fe9c`, ~37.7h old at dispatch; `/expand`'s
> 20-commit/48h window not yet open at 6 commits/~13.9h since pass 17).
> Hard rule §7.5 applied: `plan/CRITIQUE.md` still carries ~19 open
> Pending rows, so this pass scored those alongside this table's own
> standing rows rather than running a fresh site audit. [5.9] (crash)
> stays excluded, still blocked on the owner's device log. **[4.2]
> `[contract]` (axio-query stale-corpus gate) was the top actionable
> score** — re-verified live by direct read of `axio-mcp-server.mjs:54-73`
> (the `freshnessChecked` once-per-process gate, unchanged since pass 9's
> filing) before shipping. Shipped it (commit `3652d663`, issue #323):
> dropped the once-per-process gate so `ensureFresh()`'s cheap mtime
> comparison runs on every `tools/call`, only paying for the actual
> `npm run catalog:export` regen when genuinely stale or missing; tightened
> the smoke test's `\d+` count assertions to a real `[1-9]\d*` lower bound;
> added a hermetic regression test reproducing the exact Phase 57 incident
> shape (delete `cards.json` mid-session, confirm the next call re-detects
> and regenerates it). `node --test scripts/axio-mcp-server.test.mjs`: 9/9
> pass. `node scripts/check-lexicon.mjs`: 241 files clean. Row moved
> Pending → Done above (in this file, not `plan/CRITIQUE.md` — the finding
> lived in `plan/AUDIT.md`'s own non-CRITIQUE Pending section). Top 5 below
> is refreshed with the [4.2] row dropped; next pass should treat [3.5]
> (Playwright-blind verify gate) as the new top score.

## Top 5 findings (scored)

### [x] [3.5] `[tests]` Verify gate is blind to the Playwright journeys — RESOLVED 2026-09-19 (`/iterate`, `[loop-call]`)
- category: tests
- impact: 7
- ease: 5
- **[loop-call], decided 2026-09-19:** re-checked the premise before picking
  an option — it's narrower than filed. `axiomancer-mobile/package.json`'s
  `verify` script never ran any `e2e:*` script, true, but `verify-mobile.yml`
  and `verify-mechanics.yml` already run 8 of the 11 `e2e:*` journeys as
  their own scope-gated steps (`ci-e2e-scope.mjs` → hazard/encounters/combat/
  run_integration), outside `verify` entirely — that's the load-bearing gate,
  and the established convention (one step per journey, gated on the scope
  output it belongs to), not an omission. Folding all of them into `verify`
  proper would fight that convention and duplicate coverage CI already has.
  The real live gap: `e2e:theme`, `e2e:exploration-roundtrip`, and
  `e2e:upgradeable-dice` had **zero** CI trigger anywhere — not in `verify`,
  not as a workflow step, not in `ci-e2e-scope.mjs`'s suite list. Fixed by
  extending the existing convention rather than inventing a new one: added
  three scope-gated steps to both workflows (`run_integration` for theme —
  cross-cutting, boots any full run like `e2e:fixture` already does;
  `encounters` for the roundtrip script — it drives `DebugTriggerEncounter`,
  already an `encounters`-classified path; `combat` for upgradeable-dice —
  it's a combat-surface flag-on harness).

### [3.2] `npm run critique:drive` deletes anything else living under `.critique-artifacts/`
- category: debt (filed `[loop-call]` in Pending below, but re-assessed
  this pass — see note)
- impact: 4
- ease: 8
- next: `critique-drive.mjs:318` `rm`s the entire `ARTIFACT_ROOT`
  (`.critique-artifacts/`) on start rather than scoping the delete to its
  own known output paths (`mobile/`, `desktop/`, `manifest.json`) — it
  already destroyed an unrelated 54-cell capture set once
  (2026-09-12 fresh-eyes sweep). On direct read this reads as a concrete,
  low-risk, mechanical patch, not a genuine judgment call despite its
  `[loop-call]` tag in Pending — flagging here so the next pass considers
  it on its numeric merits rather than skipping it as owner-gated.

### [3.0] mobile combat hand-fan overlap at 5-card hands (CRITIQUE.md Pending)
- category: external-critique
- impact: 6
- ease: 5
- next: `handFanLayout()` (`CombatBoard.tsx:269`) still overlaps a 5-card
  hand to ~58pt of a 120pt card width on a 375pt screen — confirmed live,
  not stale. The fan's width math is already deliberately tuned (an
  in-file comment documents a prior overflow trade-off), so a naive widen
  risks regressing that; existing `onInspect` tap-to-detail already lets a
  player read any covered card. Real fix needs care, not a quick patch —
  hence parked below the cheaper wins above despite the comparable score.

> **Triaged 2026-09-19 (issue #343) — design ready, ease likely higher
> than filed.** User issue #343 mirrors this exact row and proposes a fix
> that sidesteps the naive-widen risk noted above entirely: leave
> `handFanLayout()`'s derived geometry untouched and instead size the
> name *box* to the sliver that's actually visible — a
> `NAME_BAND_LEFT_CHROME` constant (17.5pt, derived from the four chrome
> styles rather than duplicated), a `nameColumnPeek(step)` helper, and an
> optional `CombatCardFace.namePeek` prop that caps `plateName`'s
> `maxWidth` only for the hand fan (the other four face sizes — staged,
> reward offer, drag ghost, detail overlay — stay byte-identical). The
> last (uncovered) card keeps the full band, and `handFanLayout` itself
> stays unchanged so the existing C11/C11-R2 geometry invariants in
> `CombatBoard.fresh-eyes-repair.test.tsx` keep holding. Issue also
> proposes a `CombatBoard.handfan.test.tsx` guard suite (10 tests:
> re-derive the chrome constant independently, pin the peek at the
> captured viewport 57.75 -> 40.25, assert every covered card is capped
> to exactly the peek and the last isn't, assert non-fanned faces stay
> uncapped) and surfacing the existing tap-to-inspect hatch as visible
> copy ("tap a card to read it"), not just an `accessibilityHint`. Not
> re-scoring here — leaving that to whichever `/iterate` pass picks this
> row up, since it should verify the design against current code first —
> but flagging that ease is plausibly higher than 5 given the design and
> test plan are already worked out. Reference `Closes #343` in the
> closing commit.

> **RESOLVED 2026-09-15 (Phase 81) — no longer parked.** `[HIGH]
> late-stage global collapse — all 10 presets 0.00 late` is closed in
> `plan/CRITIQUE.md`: both of the 2026-08-08 reopen conditions (redesign
> landed, Phase 43 defined an objective function) held, and the fresh
> measurement plus THE BIG NUMBERS REWRITE's repeal of any governing
> win-rate shape mooted the row entirely (late win rate now reads 82%,
> zero of 48 late cells at 0%). No longer excluded from future ranking
> passes as a live row — it simply has nothing left to rank, being
> closed. See `plan/phases/phase_81_late_campaign_difficulty_cliff.md`.

> Below the cut this pass: `[1.6]` `web:container` dev-server script
> (`axiomancer-mobile/scripts/dev-server-container.sh` still runs `npx
> --yes expo start` instead of the mounted repo's own `expo` binary) and
> `[1.5]` card-editor missing `grant_pip.overflow`/`spend_all_pips.markPer`/
> `synergy.statePredicate` form controls (`CardForm.tsx`) — both
> re-confirmed live this pass, unchanged from pass 7/8's framing.

> **Eleventh pass, 2026-09-24 (`/march` tick).** Dispatch chain landed on
> `/iterate` again (triage clean; critique gate blocked by this very row —
> an open HIGH keeps the critique window shut per its own third condition;
> no pending phase; content-lifecycle gate checked all five categories,
> none past 15 commits/36h; `/forge`'s 48h world-growth window still open;
> `/expand`'s 20-commit/48h window not yet open at 1 commit/~3.7h since
> pass 20). Hard rule §7.5 applied: `plan/CRITIQUE.md`'s HIGH row
> (exploration — late-game hub node graph blank on mobile, pass 48) is the
> newest and highest-severity open item in either queue, well above this
> table's own stale (2026-09-17) Top 5 — picked it directly rather than
> re-running a fresh audit. Root cause was NOT the row's own two named
> suspects (`MIN_SCALE` floor, first-layout-wins `viewport` capture) —
> both re-verified correct on direct read. Found instead, via a throwaway
> Playwright probe against the exported web build: `computeFocusTransform`
> assumes the canvas `Animated.View` pivots its scale around its own
> top-left corner, but the platform default pivots around the CENTER —
> invisible while the fitted scale sits at 1 (desktop always lands there)
> but throwing the whole canvas off-frame once a narrow viewport clamps to
> `MIN_SCALE`. Shipped `transformOrigin: '0 0'` (commit `2dfcafeb`, issue
> #366) plus a regression test pinning the style. `npm run verify`
> (axiomancer-mobile): green. Row moved Pending → Done in
> `plan/CRITIQUE.md` (not this file — the finding lived there, not here).
> This table's own Top 5 is unchanged and still due a fresh re-score next
> pass; treat it as stale rather than authoritative.


## Rows moved out of Pending (2026-09-25)

### [debt] TRIM THE FAT T2a merged unverified — finish list (2026-09-25)

- **Closed 2026-09-25:** main green again (`e073bb6e`: inspector row, routing-test asserts, stale e2e imports, befriend loot asserts). Baselines re-stamped in #371: `character.png` re-captured (plus a Grace-heading overlap the Derived cut exposed), perf baseline FRESH at `e073bb6e`, full confidence, no movement past noise. Residue PR: dead `isMultiplier` / effect `statModifiers` reads (village, tooltip presenters), luck/derived labels and tooltip ids (inventory modal + `ItemModal.tsx`), `CardEvent` `damage`/`heal` kinds, and docs naming removed systems (`docs/faction.md` deleted).
- **Still open (closed part):** The spec's "~198 unused barrel exports" pass was not done — fold it into T3.
- closed 2026-09-25: the barrel pass shipped in T3 (`8ef3c7da`); the rest of this row stays live in `plan/AUDIT.md`.

### [x] [docs] Seven files still describe `story-overview.md` as an event-by-event road with a figureless X (2026-09-24) — RESOLVED 2026-09-24
- category: docs
- impact: 7
- ease: 8
- detail: residue of the 2026-09-23/24 attended story sessions (PRs #362,
  #365). T replaced `axiomancer-mechanics/content/story/story-overview.md`
  (clean slate) with an over-arching story document: rulings, the prologue,
  the per-map themes, and open questions. It is no longer a road walked one
  event per turn, and X is no longer figureless (T's own prologue gives him a
  sex, a past, a station, and a habit). The live docs that tell agents what
  that file is still describe the old shape:
  - `axiomancer-mechanics/CLAUDE.md` "THE STORY IS THE ROAD" (always in
    context): "the ordered list of what happens to the player", "still being
    walked", "no name, no figure, no identifiers".
  - `plan/bearings.md` THE BLANK PAGE, ~lines 625–662: "No name, no figure",
    "event by event", "the road".
  - `axiomancer-mechanics/content/story/README.md` lines 1–12: "That file is
    the road".
  - `axiomancer-mechanics/docs/story.md` lines 3–7: "the road, event by
    event … no name, no figure".
  - `.claude/skills/world-spec/SKILL.md` line 42 and
    `.claude/skills/character-spec/SKILL.md` line 43: "the road, event by
    event. Short and still being walked".
  - `plan/2026-09-17-story-outline.prompt.md`: the whole method (one event
    per turn, pivot rule) is superseded by T's switch to a top-down document.
- next: rewrite each description to "the over-arching story document:
  rulings, prologue, per-map themes, open questions". Keep the rule that
  still holds: a story fact the document does not carry does not exist, and
  agents do not invent canon. Keep "X" as the placeholder name. Drop "no
  figure". Put a superseded banner on the outline prompt rather than
  deleting it. Docs only.
- **RESOLVED 2026-09-24 (T asked, same session):** all seven rewritten as
  above. `bearings.md` ¶2 keeps its original wording with a dated amendment
  under it, and a new ¶7 records the switch to a top-down document. Also
  fixed an eighth pointer found while doing it:
  `.claude/skills/story-spec/SKILL.md` sent "Story premise" to
  `docs/story.md`, which only catalogues shipped non-canon content; it now
  points to the overview.

### [x] [loop-call] Art the public DevLog may not publish: 90 files with an UNRESOLVED licence (2026-09-20) — RATIFIED via /oversight 2026-09-23
- category: content
- impact: 7
- ease: 3
- detail: the public DevLog build gates every image on its directory's
  `provenance.json` (`scripts/devlog-art-licence.mjs`). The audit it produces,
  run against today's tree: `maps/` 5/5, `combat/` 7/7 and `splatter/` 4/4
  publish (public domain); `enemies/` publishes 25 of 77 (24 CC BY 3.0 with the
  artist rendered, 1 public domain); `cards/` 0 of 19, `portraits/` 0 of 15 and
  `treasure/` 0 of 4 publish. Every withheld file reads "UNRESOLVED" — the
  provenance gate's own word for owner-supplied external illustration with no
  source and no licence traced since. This is the publish prompt's §1 carve-out
  exercised exactly as it is written: T's ruling makes the CONTENT public, and
  it is not T's to waive a third party's licence. So the public catalog's card
  plates publish their frame, name and ledger and say in the frame the painting
  would fill that the painting is withheld and why.
- next: not a build fix — a content debt. Either trace the provenance of the
  2026-07-06 illustration drop (52 foe portraits, 19 card paintings, 15
  character portraits, 4 treasure images) or replace those files with art whose
  licence is on record, the way `acquire-art.mjs` acquires the plates. Filed as
  a candidate in `plan/PHASE_CANDIDATES.md`. Until then the public catalog is
  honest but thin, and it says so on every plate.
- **RATIFIED via /oversight 2026-09-23:** the `PHASE_CANDIDATES.md` filing
  ("Trace or replace the UNRESOLVED art") is the right shape — left as filed,
  competing for promotion on its own turn rather than promoted immediately.

### [x] [loop-call] Seven calls made while building the public DevLog (2026-09-20) — RATIFIED via /oversight 2026-09-23
- category: process
- impact: 3
- ease: 9
- detail: decisions the build made itself, per THE OPEN GATE, recorded for
  after-the-fact review rather than asked. (1) **Panels publish by default;
  `Needs you` alone is withheld** — it is correspondence, not a report, and
  every post says at its foot that it is held back; `/digest` now carries the
  obligation to promote its player-facing half into `Queues now`. (2) **Fonts
  load from Google Fonts** with a full local fallback, rather than blocking the
  build on vendoring four families; self-hosting is filed as a candidate. (3)
  **Card and foe plates render as SVG** of the card's printed text in the
  shipped face's layout, not a rasterised app screenshot: the nightly has no
  browser and no model call, and the site captions the plate as what it is. (4)
  **The hero's holed sheet is generated** rather than importing the design
  prototype's placeholder, which had no provenance. (5) **The 54 legacy entries
  get a derived title** (the headline's first clause, or a word-boundary cut of
  it) because they predate the title field `/digest` now authors — derived
  always from the author's own words, never invented. (6) **Two latent grammar
  bugs were fixed while extracting the shared parser**: a headline and a field
  value now run on across wrapped lines instead of truncating at the first, and
  a bracketed heading in the older vocabulary (`[docs]`, `[combat]`, `[mobile]`)
  renders as the work item it is rather than falling through to the panel
  branch. Both fixes improve the private index too. (7) **A page's payload
  budget counts every image it references**, not only what paints first.
- next: review at the next `/oversight`; nothing here blocks.
- **RATIFIED via /oversight 2026-09-23:** all seven calls stand as made. No
  action needed.

### [x] [loop-call] Keyword registry has no analogue for Dawncaster's "Chaos" or generic "Upgrade" families (2026-09-13) — RESOLVED via `/adjust-keywords` pass 11 (2026-09-16)
`/adjust-keywords` pass 9's functions-column sweep (`DigitalCardGames/dawncaster/
keywords.csv`, 141 rows) against our 68-row registry's eight families (damage,
afflictions/payoffs, walls/reprisal, tempo/control, turn shape, deck-as-resource,
resolve/harvest/mercy, dice) turned up two genre families we carry no analogue
for at all:

- **Chaos** (Balance/Order/Delirious/Dominated/Pinned) — cards that gate on a
  parity property of your own deck/hand (even/odd cards remaining) or briefly
  scramble/restrict what you may play (shuffled costs, forced-random-card,
  leftmost/rightmost-only). A genuinely different lever from anything in our
  "turn shape" family (which gates on position-in-turn/hand-size, never on a
  randomized or parity-checked state).
- **generic Upgrade** (Mergecraft/Infuse/permanent per-card damage growth) —
  a card that gets permanently stronger outside of WRATH's fight-long stacking
  buff; Dawncaster's version attaches to the CARD object itself (deck-building
  layer), not to combat state, which is a different axis than anything we
  currently price.

Neither clears this skill's own CREATE bar ("a real design gap exists," not
merely "a mechanic Dawncaster has that we lack") — no concrete card idea, rank
slot, or theme attachment has been proposed for either, and both would need a
new payload shape / verb class ratified before the 12-step wiring checklist
even starts. Filed as a genre-toolbox observation for an owner to size, not
actioned. If picked up: KB prior art already gathered above
(`kb:dawncaster/keywords.csv`, community-sourced, confidence medium per the
corpus's own `status: draft` — cite this row's csv read as the receipt, then
`kb_read_doc` the individual `keywords/balance.okf.md` / `order.okf.md` /
`dominated.okf.md` / `mergecraft.okf.md` / `infuse.okf.md` records before
drafting semantics) plus the standard KB research gate for whichever family is
chosen.

**DECIDED via /oversight 2026-09-15:** authorize a concrete proposal. Neither
family is rejected outright — `/adjust-keywords`'s next pass should draft an
actual card idea + rank-slot proposal for Chaos or generic Upgrade (whichever
the KB research favors) and bring it back through the normal CREATE-bar gate,
rather than leaving this a bare genre-toolbox observation. Row stays open
until that proposal lands.

**RESOLVED via `/adjust-keywords` pass 11 (2026-09-16):** shipped Chaos, not
generic Upgrade — Balance/Order's parity read fits the existing turn-shape
predicate slot cleanly (a new `SynergyStatePredicate` kind, same surface as
AMBUSH/FLOW/FINALE/REQUIEM); generic Upgrade would need a NEW payload shape
(per-card-object persistent state across combats, which nothing in the
engine currently stores) and stayed out of scope for a single pass. New
keyword **EVENTIDE** (`{ kind: 'eventide' }`, drilled to ONE even-only check
rather than Dawncaster's Balance/Order pair): fires while the draw pile
holds an even number of cards. Two carriers: The Even Bell (vigil, Splinter
3) and An Even Reckoning (debt, Splinter 3). Full wiring + hermetic e2e +
atlas row + mobile gloss, all verify gates green (mechanics, mobile,
card-editor, root content-drift). See
`axiomancer-mechanics/docs/keyword-atlas.md` § "Added" and the matching
`plan/CONTENT_LEDGER.md` pass-11 log entry for the full file list. Generic
Upgrade is NOT re-filed here — if it resurfaces, it needs its own KB
research + payload-shape design pass, not a continuation of this row.

### [x] [loop-call] The deck-matrix baseline reads STALE because of a speech-mark edit (2026-09-12) — RESOLVED 2026-09-17 (`/iterate`, issue #321)
`baseline:check` now reports the baseline stale by one mechanics-source commit:
`df6e98f ui-fresh-eyes: FE-006 world content — speech marks that point the
right way`. The flag is correct by the rule and wrong about the concern.
`check-baseline-freshness.mjs` watches all of `axiomancer-mechanics/src`
(WATCH_PATH, line 30), and FE-006 changed only string literals in four
dialogue/world content files plus one test matcher — no rule, number, state
transition or RNG. Nothing it touched is an input to the deck matrix, so a
regen would spend a full sim run to reproduce the same numbers.

Deliberately NOT regenerated. Anyone answering a balance question off this
baseline can cite stamp `b1624da0 · 2026-09-11` as still true of the engine;
the staleness is bookkeeping, not drift. If the coarse watch path keeps
producing this, narrowing it to exclude `src/World/Continents/**` prose (or
any content-only path) would stop text passes from invalidating measured
balance truth.

**DECIDED via /oversight 2026-09-15:** narrow the watch path. Exclude
`src/World/Continents/**` and other content-only prose paths from
`check-baseline-freshness.mjs`'s WATCH_PATH so a docs/dialogue-only commit
stops tripping STALE. Ready to ship — no further design call needed; routing
to the next `/iterate` pass (or a direct fix) as a normal finding, tag
dropped.

**RESOLVED via `/iterate` (2026-09-17, issue #321):** the literal decided fix
(exclude `World/Continents/**` from a path-prefix `WATCH_PATH`) was verified
against the actual motivating commit before shipping and found incomplete —
`df6e98f` also touched `Game/e2e/old-marrow-observer.engine.test.ts` (an
engine test's literal-quote matcher, updated to track the content edit), so
excluding only the content directory would still have left that exact
example flagged STALE. Shipped the fuller fix instead: `WATCH_PATH` became
`WATCH_ROOT` plus an exported, unit-tested `isFreshnessRelevantPath(rel)`
predicate that excludes both `World/Continents/**` (confirmed disjoint from
the deck-matrix's actual inputs — `Combat/`, `Cards/`, `Enemy/`, `Character/`
never import anything under `World/`) and any test file (`*.test.ts(x)`,
`e2e/**`), while leaving every other `World/*` surface (Hazard, MapEvents,
map.library.ts, ...) watched since those are not shown to be disjoint. `git
log` now filters by per-commit changed-file content rather than a single
path prefix. New `scripts/check-baseline-freshness.test.mjs` (6 cases,
including the exact FE-006 file set) wired into the root `npm test`
aggregator. `baseline:check` still reports FRESH post-fix — no regression.

### [x] [loop-call] UI fresh-eyes 2026-09-12 left six product decisions and a large unverified candidate set (2026-09-12) — DECISION CLOSED via /oversight 2026-09-15, PROMOTED to Phase 95 via /oversight 2026-09-17 (the 309-row unverified candidate set stays open, tracked separately)
The sweep (`axiomancer-mobile/docs/reports/UI_FRESH_EYES_2026-09-12.md`) shipped
21 fixes and filed the rest. Six rows are genuine product calls the loop should
not make silently, each with a recommended option in the report's section 4:
the fanned hand hiding every card's ledger but the last (an explicit owner
directive, so changing it is a decision, not a fix); the unnamed left signet
rail; `/rest` greying an option for two possible reasons while naming only one;
`/hazard-deck`'s pastel visual language inside a black gothic app; `LEAGUES` as
a proper noun on the title screen and a unit on the map; and the opening art
plates carrying their source engraving's baked-in caption.

Beyond those, the Observe fleet returned 309 candidate rows (16 of 16 agents,
0 errors; 100 major), sorted and filed in
`UI_FRESH_EYES_2026-09-12.candidates.md`. They are NOT verified — the sweep
could not run its adversarial verify panel (2-way concurrency on a 4-CPU
container) and five candidates were refuted by hand, one of them reported at
confidence 100. The recurring themes worth a named pass rather than a row at a
time: one concept carrying several words (currency, the journal, SEALED, SURGE,
"the deck"), glyphs with no key, meters with no unit or goal, and definitions
that exist in the tooltip registry but are unreachable from the screen that
needs them.

**DECIDED via /oversight 2026-09-15:** accept all 6 of the report's own
recommended options (fanned-hand ledger, signet rail naming, `/rest` greyed
option, hazard-deck pastel tone, `LEAGUES` usage, art-plate captions — see
`UI_FRESH_EYES_2026-09-12.md` §4 for each one's specific recommendation).
Ready to ship as 6 small fixes; routing to the next `/iterate` pass, tag
dropped. Row closed as a decision; the 309-row unverified candidate set
described below stays open and unrelated to this call.

### [x] [loop-call] `npm run critique:drive` deletes anything else living under `.critique-artifacts/` (2026-09-12) — DECISION CLOSED via /oversight 2026-09-15, PROMOTED to Phase 94 via /oversight 2026-09-17
`critique-drive.mjs:318` clears the whole artifact root on start. During the
fresh-eyes sweep this destroyed a complete 54-cell before/after capture set
that had been written to `.critique-artifacts/fresh-eyes/`. Both sets were
rebuilt and the sweep's driver now writes to `.critique-artifacts-fresh-eyes/`,
but the hazard is still there for the next tool that shares that directory —
either scope the delete to the driver's own subdirectory or document the
directory as exclusively its own.

**DECIDED via /oversight 2026-09-15:** scope the delete to the driver's own
subdirectory (`critique-drive.mjs:318`), not the whole `.critique-artifacts/`
root. Ready to ship; routing to the next `/iterate` pass, tag dropped.

### [x] [loop-call] Phase W6 (The Capital) reused "W5" as a map-sequence label collision, resolved by numbering the map "W6" instead (2026-09-10)
- category: docs/naming residue (found while filing `/forge`'s Step-6
  residue for shipping The Capital, map 5 of the northern continent)
- detail: the map-growth sequence in `plan/steps/01_build_plan.md` runs
  Phase W1 (travel) → W2 (caverns) → W3 (northern city) → W4 (connecting
  river + town-across-river) → the next map. But "Phase W5" was already
  claimed by a DIFFERENT phase — "New blood: per-map enemy roster
  growth" — filed the same day as W1-W4 and still `[-]` partially
  drained (per-item enemy work now lives with `/adjust-enemies` under
  THE CONTENT LIFECYCLE SPLIT, 2026-09-02, so that row's remaining
  scope is that steward's job, not a map-growth row at all). Rather than
  either colliding with the existing W5 label or renumbering the
  already-shipped W1-W4 history, this tick's map ships as "Phase W6" —
  logged as its own row in the build plan, distinct from the enemy-roster
  W5 row above it. No code depends on the phase label; this is purely a
  plan-file bookkeeping call, filed so a future steward doesn't read
  "W5" twice and assume a duplicate/conflicting entry.
- resolution: no action needed — the build-plan row already uses "W6".
  Filed as `[loop-call]` per standing rule 7 for after-the-fact review,
  not because the call was ambiguous enough to block on.

### [x] [loop-call] The Capital's enemy pool reuses existing roster entries rather than authoring capital-native enemies — a legitimate future `/adjust-enemies` backfill (2026-09-10) — RESOLVED via `/adjust-enemies` pass 6 (2026-09-11)
- category: content residue (found while shipping The Capital via
  `/forge`; `/forge` owns maps/events/art, not per-item enemies — see
  `skills/forge.md` §1's 2026-09-02 scope split)
- detail: `the-capital`'s `EnemiesByMap` pool
  (`axiomancer-mechanics/src/Enemy/enemy.library.ts`) reuses
  northern-city's roster (TollSergeant, GuildKnife, WharfShrike) plus
  two northern-forest re-treads (CursedPaladin, VampireThrall) —
  100%/83% overlap with northern-city and northern-forest respectively.
  This mirrors the northern-city launch pattern (which also opened with
  partial forest reuse, later backfilled twice by `/adjust-enemies`
  passes 1 and 2 per `plan/CONTENT_LEDGER.md`), so it's a known,
  precedented shape — not a defect — but it is real thinness by the
  same >70%-sibling-overlap signal `/adjust-enemies` already uses
  elsewhere. The Factor (already a northern-city normal enemy, not
  previously a boss anywhere) is reused as the-capital's boss at an
  elevated payload level (22) — the RawheadRex-in-caverns precedent for
  reusing a defined enemy as a new map's climax rather than inventing
  one.
- action: none taken by this tick (out of `/forge`'s lane by design).
  Flagged for `/adjust-enemies`'s next structural pass to pick up on its
  own rate-limited cadence, the same way caverns/connecting-river/
  town-across-river's thin pools were each backfilled after their own
  `/forge` launches.
- resolution (2026-09-11): `/adjust-enemies` pass 6's fresh structural
  audit re-derived the overlap directly (5 of the-capital's 6 members —
  every member but CursedPaladin — also sit in northern-city's own pool,
  83.3%, over the skill §1 >70% ceiling) and backfilled two capital-native
  enemies, The Stamper and The Underclerk (both `debt-office` archetype,
  reusing the existing card canon — no new cards needed, the capital being
  that archetype's home city), dropping the reading to 5/8 = 62.5%. Full
  wiring: `enemy.library.ts` (createEnemy + EnemyLibrary + EnemiesByMap +
  ENEMY_REGISTRY), a 3-card deck each in `combat.enemy-decks.ts`, aftermath
  prose, licensed game-icons.net portraits (Delapouite/Lorc, CC BY 3.0,
  provenance recorded). See `plan/CONTENT_LEDGER.md`'s adjust-enemies pass
  6 entry for the full audit and verify status.

### [x] [loop-call] AMBUSH and FINALE now print correctly but still show exactly 1 card carrier each (2026-09-07) — RESOLVED via `/adjust-cards` pass 3 (2026-09-08)
- category: content residue (found during `/adjust-keywords` pass 2's full
  structural audit — Step 1's carrier-count signal, same shape as pass 1's
  CHAIN/OMEN finding, which `/adjust-cards` pass 2 already resolved by
  authoring a second carrier for each)
- detail: `docs/keyword-atlas.md`'s "turn shape" family (AMBUSH, FLOW,
  FINALE, REQUIEM, FALLEN) was written whole during THE BIG NUMBERS REWRITE
  (2026-09-02), and `paid-summary-honesty.engine.test.ts`'s own comment
  already grouped AMBUSH with "the turn-shape conditions promoted to face
  terms" — but the promotion was left half-wired: `combat.cards.ts`'s
  `statePredicateText` still printed the WS5.2-era "OPENING" face term
  (a deliberately card-local, unregistered word predating the rewrite —
  see the historical doc comment this pass left in place, now corrected)
  instead of "AMBUSH", and the `finale` case printed a plain lowercase gloss
  with no keyword word at all. This pass fixed the WIRING bug (both cases
  now print their registry name, matching FLOW/REQUIEM's shape) — see
  `plan/CONTENT_LEDGER.md`'s adjust-keywords pass 2 entry for the full file
  list — but did NOT author new cards, so the underlying carrier count is
  unchanged: **AMBUSH** (`kind: 'opening'`, trial.cards.ts, "Struck from the
  Record") and **FINALE** (`kind: 'finale'`, trial.cards.ts, "Judgment
  Entered Against Them") are each still exactly 1 live carrier, below the
  atlas's own "≥2 cards or ≥2 enemies" discipline. Per this skill's own
  REMOVE-routing rule, authoring a second carrier is a card-authoring
  decision, not a keyword-registry one — left to `/adjust-cards` (or an
  owner call weighing "author a second AMBUSH/FINALE carrier, mirroring
  CHAIN/OMEN's resolution" against "retire the badge to plain rules text,
  mirroring CURDLE's resolution," now that the print-text bug that would
  have complicated either choice is already fixed).
- score: n/a — routing item; carrier-count judgment belongs to `/adjust-cards`.
- **resolution (2026-09-08):** authored a second carrier for each, same call
  as CHAIN/OMEN — `kb_keyword`/`kb_cards` (`kb:dawncaster/keywords.csv`,
  `kb:dawncaster/cards/0021-advance-932954.okf.md` and siblings) showed both
  Ambush and Finale spread across many Dawncaster cards, the opposite shape
  from CURDLE's single-card-only miss, so retiring the badge would have been
  the wrong read. Added **The Door Comes Down First** (`the-door-comes-down-
  first`, trial rank 5/Skull, mind aspect) — deal 34 + AMBUSH[STAGGER 2, +8
  CHARGES], one rank above Struck from the Record's Splinter carrier — and
  **Nothing Further, Your Honour** (`nothing-further-your-honour`, trial rank
  4/Rib, heart aspect) — deal 24 + BACKFIRE 6/3 + FINALE 1[deal 16, STAGGER
  2], one rank below Judgment Entered Against Them's Skull carrier. See
  `plan/CONTENT_LEDGER.md`'s adjust-cards pass 3 entry for the full file list
  and verify results.

### [debt] Die a11y copy drift — `RollingDie` and `upgradeable-dice-e2e.mjs` still speak the draft-era wording (2026-09-04)
- category: mobile evidence residue (found while fixing the playtest
  2026-09-04 die a11y finding; `CombatDie.tsx` now derives its label from
  the pure `combatDieA11yLabel(die, { assigned, specialConviction })`)
- detail: two surfaces were out of scope for that fix and still drift.
  (a) `components/combat/encounter/RollingDie.tsx` forwards only
  `die/size/dimmed` to `CombatDie`, so the flag-on tumbling tray die speaks
  the stock `SPECIAL_CONVICTION_DEFAULT` payload and never the assigned
  state — a screen-reader user hears "2 Conviction" on a die whose gear
  slot pays more. (b) `scripts/upgradeable-dice-e2e.mjs` lines ~249,
  ~338-340, ~401-403 still regex the old `stance die` / `BOON face` /
  `available` wording; `combat-round-e2e.mjs` was migrated to the new
  `^(\w+)(?:\s+\(gold\))?\s+die` + `drag onto` shape and the other script
  should follow or its usable-die detection goes silently blind.
- score: impact 5 x ease 8 / 10 = 4.0
- update (digest 2026-09-05): (b) stopped being silent and started being
  loud — the nightly breadth check (`npm --workspace axiomancer-mobile run
  e2e:minigames`) now fails red at `upgradeable-dice-e2e.mjs`'s
  `assertSwayCommit` step: `SWAY-commit guard: no usable heart/wild die in
  the opening tray this seed`. Live seed-8 die labels read
  `"HEART die, SPECIAL face: drag onto a staged HEART card to power it and
  gain 2 Conviction"` / `"WILD (gold) die, MISS face: dead, powers
  nothing"` — the script's `color` regex (`^(\w+)\s+stance die`) and
  `usable` regex (`available|drafted|ghost|banked|BOON face`) match none
  of that, so every tray die parses to `color: ''`, `usable: false` and
  the guard's `.find` always comes back empty regardless of what the tray
  actually deals. This is the predicted "usable-die detection goes
  silently blind" outcome from the same row, now confirmed as a hard CI
  failure rather than a hypothetical — raising this from a copy-polish
  debt item to the breadth check's current red gate. Fix is still the
  same shape already scoped above: port `combat-round-e2e.mjs`'s
  `^(\w+)(?:\s+\(gold\))?\s+die` + a presence-of-"drag onto" (rather than
  "BOON face") usability check into `upgradeable-dice-e2e.mjs` lines
  ~338-340 (and the sibling sites at ~249, ~401-403 the original row
  already named).
- update (digest 2026-09-07): still red, two nights later, unchanged
  failure — `npm --workspace axiomancer-mobile run e2e:minigames` aborts
  at the same `assertSwayCommit` guard with the same
  `SWAY-commit guard: no usable heart/wild die in the opening tray this
  seed` message. Every other leg (hazard, combat-encounter,
  encounter-routing, exploration/combat round-trip) still passes clean;
  the pipeline still aborts before `combat-round-e2e` (MODE=both) runs.
  No commit touched `scripts/upgradeable-dice-e2e.mjs` in
  `2afc1b19..HEAD` (confirmed via `git log -- scripts/upgradeable-dice-e2e.mjs`
  since the last digest), so this is the same stale-regex bug, not a new
  regression — the fix is still exactly the port already scoped above,
  still unshipped. Raising impact to 6 (a second consecutive red night
  on the same known-broken guard; ease unchanged at 8 — still a
  same-file regex port). Revised score: impact 6 x ease 8 / 10 = 4.8.
- update (digest 2026-09-09): still red, same `SWAY-commit guard: no
  usable heart/wild die in the opening tray this seed` failure at the
  same step; every other leg (hazard, combat-encounter, encounter-
  routing, exploration/combat round-trip) still passes clean and the
  pipeline still aborts before `combat-round-e2e` (MODE=both) runs. No
  commit touched `scripts/upgradeable-dice-e2e.mjs` in `5ff070d7..HEAD`
  (confirmed via `git log`), so this is the same unshipped fix, not a
  third regression — three consecutive dated digests now (09-05, 09-07,
  09-09) with no `/march` tick picking up an unowned `[debt]` row. Score
  unchanged at impact 6 x ease 8 / 10 = 4.8.
- **resolution, part (b) only (2026-09-09, commit `bfa80bae`, `/iterate`
  via `/march`):** ported `combat-round-e2e.mjs`'s migrated
  `^(\w+)(?:\s+\(gold\))?\s+die\b` color regex + `drag onto`-presence
  usability check into all three named sites in
  `scripts/upgradeable-dice-e2e.mjs` (~249's face-state presence check,
  ~338-340's `assertSwayCommit`, ~401-403's `readDice`). Verified locally:
  `npm run e2e:upgradeable-dice` now runs ALL PASS end to end
  (`assertSwayCommit` commits SWAY 0 → 8 as expected); `npm run verify
  --workspace axiomancer-mobile` green. The nightly `e2e:minigames` red
  gate this row caused should clear on the next digest. **Part (a) —
  `RollingDie.tsx` forwarding only `die/size/dimmed` to `CombatDie`, so
  the flag-on tumbling tray die still speaks the stock
  `SPECIAL_CONVICTION_DEFAULT` payload instead of the assigned
  gear-scaled value — is untouched and still open.** Retitling/rescoring
  below to reflect (a) as the sole remaining scope.
- closed 2026-09-25: both parts shipped — (b) `bfa80bae`, (a) `f9f2be28` (the [1.8] tray-die row, archived alongside).

### [x] [1.8] Flag-on tumbling tray die (`RollingDie`) speaks the stock Conviction payload, not the assigned gear-scaled value — RESOLVED 2026-09-11 (commit `f9f2be28`, issue #298)
- category: mobile evidence residue (remaining half of the row above,
  split 2026-09-09 after (b) shipped)
- detail: `components/combat/encounter/RollingDie.tsx` forwards only
  `die/size/dimmed` to `CombatDie`, so a screen-reader user hears "2
  Conviction" on a die whose gear slot actually pays more — the a11y
  label never carries the real `specialConviction` value on this
  surface, unlike the (now-fixed) static tray die.
- score: impact 3 x ease 6 / 10 = 1.8 (narrow surface — one screen-reader
  wording gap on the flag-on tumble animation, not a functional or CI
  break; straightforward prop-forwarding fix once picked up)
- resolution: also missed `assigned` (never spoke "assigned to a staged
  card" for a socketed tray die mid-cast), not just `specialConviction` —
  both were absent, not just the one named in the title. Added
  `assigned`/`specialConviction` props to `RollingDie`, forwarded to its
  inner `CombatDie`, and wired `CombatBoard.tsx`'s existing
  `isAssigned`/`specialConviction` computation through at the
  `<RollingDie>` call site (previously only threaded to the static,
  non-ritual `<CombatDie>` branch). New `RollingDie.a11y.test.tsx` proves
  both opts reach the rendered label, mirroring `CombatDie.a11y.test.tsx`'s
  existing coverage shape. `npm run verify --workspace axiomancer-mobile`:
  261 suites / 2657 tests green.

### [x] [loop-call] No mid/late equipment progression — 8 relics are 1:1-locked to 8 signatures, 3 accessory kinds have zero live relics (2026-09-04) — RESOLVED via Phase 85 (2026-09-15, commit 9f313d0c)
- category: design residue (found during `/adjust-equipment` pass 1's
  structural audit; directly answers the pending `[HIGH] general — no
  mid/late equipment or signature skills exist for THE PATH's sixth axis`
  row in `plan/CRITIQUE.md`, filed rather than actioned solo — it implies a
  new-mechanics decision, not a routine content edit)
- detail: the lean signet-relic shape (`docs/equipment.md`, phases 18-23)
  is deliberately closed: exactly 8 relics, each granting exactly one of the
  8 `SignatureSkillId`s, and `relic.library.ts`'s own header calls that
  id-to-signature mapping "1:1 and load-bearing." Three `AccessoryKind`
  values (`head`, `hands`, `feet`) have zero live relics — the Step-1 CREATE
  signal for that gap fires clean — but there is no 9th signature skill to
  grant, and inventing one means designing new signature-cast combat
  behavior (WRATH/CHAIN interaction, cost, cast conditions), not writing an
  item record. The alternative — a relic with only `statModifiers`, no
  `grantsSignature` — contradicts `relic.library.ts`'s own stated relic
  identity rule ("Relic identity = `grantsSignature !== undefined`").
  Needs an owner call: (a) design N new signature skills first (a
  mechanics-expert task, THE BIG NUMBERS REWRITE-era numbers), then relics
  to carry them into the empty accessory kinds, or (b) deliberately break
  the 1:1 rule and ship stat-only accessories for those 3 kinds, or (c)
  something else entirely for "THE PATH's sixth axis" that the original
  user-jot didn't specify. `/adjust-equipment` pass 1 shipped its other,
  in-scope finding (5 dead consumables, see `CONTENT_LEDGER.md`) instead of
  guessing at this one.

**DECIDED via /oversight 2026-09-15:** option (a) — design N new signature
skills first, preserving `relic.library.ts`'s stated 1:1 relic-identity rule.
Routed to **Phase 85** (promoted from PHASE_CANDIDATES.md's matching
[score 5.5] row this same tick). Row closed; see Phase 85's brief for the
mechanics-expert design session.

**SHIPPED 2026-09-15 (commit 9f313d0c):** Phase 85 authored 3 new signature
skills (`sig-mounting-dread`, `sig-endless-labor`, `sig-unbroken-stride`) and
their carrying relics for the `head`/`hands`/`feet` accessory kinds,
preserving the 1:1 relic-identity rule. `relic.library.ts` now ships 11
relics across all 6 `AccessoryKind`s. Re-verified during `/adjust-equipment`
pass 12 (2026-09-17): no gap remains.

### [x] [loop-call] Dead engine hooks — 19 orphaned `zoneHas` sites in combat.engine.ts (2026-09-04) — RESOLVED via Phase 86 (2026-09-16, commit 7cd4119c)
- category: mechanics residue (found during `/adjust-cards` pass 1, filed
  rather than actioned — cleanup is a mechanics-expert-owned sweep, not a
  card-content change)
- detail: `combat.engine.ts` carries 19 `zoneHas(state, '<card-id>')` hook
  sites keyed to card ids that resolve nowhere — not in `cardLibrary`, not
  in Haunts, not in Allies (pre-THE-BIG-NUMBERS-REWRITE "profane canon"
  era leftovers): `forge-masters-stamp`, `crown-of-thorns`,
  `venom-and-vein`, `bone-orchard`, `stuck-in-their-head`,
  `anvil-of-form`, `practiced-cadence`, `mirror-of-guilt`, `entropy-tax`,
  `quagmire-of-doubt`, `hedgehogs-dilemma`, `mirror-of-longing`,
  `crumbling-resolve`, `achilles-and-the-tortoise`, `fated-course`,
  `the-oracles-eye`, `irresistible-grace`, `captive-audience`,
  `resonant-chamber`. Each has its own test pinning the dead behavior in
  `src/Combat/e2e/themed-decks.engine.test.ts` (one test file's own
  comment already half-acknowledges this as "scheduled for the dead-hook
  cleanup sweep"). Needs a dedicated pass to delete the hooks and
  retire/repurpose their tests.

**DECIDED via /oversight 2026-09-15:** ship the sweep. Routed to **Phase 86**
(promoted from PHASE_CANDIDATES.md's matching [score 4.5] row this same
tick, alongside the TWIN-wire row below). Row closed.

### [x] [loop-call] the-sextons-count is missing its TWIN trigger (2026-09-04) — RESOLVED via Phase 86 (2026-09-16, commit 7cd4119c)
- category: mechanics residue (found + deliberately not fixed during
  `/adjust-cards` pass 1's card-face-honesty sweep)
- detail: the card's printed text named a TWIN clause (RECALL/REPLAY/TWIN
  → 8 VITAE + MILL 1) but no engine hook ever fired it. The RECALL/REPLAY
  fix shipped this pass (engine now matches the printed 8-VITAE/MILL-1
  effect for those two triggers), but TWIN's real "a card resolved twice"
  moment (`twinCharge`/`echoed` resolution, `combat.engine.ts` ~line
  2257) sits in a different variable scope than the RECALL/REPLAY sites —
  before `directDamage`/`drawPile`/`discard` locals are declared — and
  wiring it risked double-counting when a twinned card itself carries
  `reprise`. Trimmed the TWIN clause from the card's printed text rather
  than ship a rushed/wrong wire; re-adding it is a small dedicated
  mechanics-expert task.

**DECIDED via /oversight 2026-09-15:** re-add TWIN, correctly scoped (after
the `directDamage`/`drawPile`/`discard` locals, guarded against
double-counting with `reprise`). Routed to **Phase 86**, same as the dead-hook
sweep above. Row closed.

### [x] [loop-call] CHAIN and OMEN each show exactly 1 card carrier after a rider-inclusive audit (2026-09-05) — RESOLVED via `/adjust-cards` pass 2 (2026-09-06)
- category: content residue (rider-inclusive follow-up to the 2026-09-04
  `/adjust-cards` pass-1 loop-call below, run during `/adjust-keywords`
  pass 1)
- resolved for 9 of the original 11 kinds: `/adjust-keywords` pass 1 ran
  the rider-inclusive sweep this note asked for (grepped every
  `library/*.cards.ts` for both the `kind: '<x>'` form and every bare
  `CardRider` field of the same name, not just top-level
  `specialMechanics`). `recoil_x`→Recoil, `consume_affliction`→Rupture,
  `spend_premises`→Charge all share a well-carried umbrella keyword with
  other kinds (Recoil/Rupture/Charge each have several independent card
  carriers beyond the thin kind itself), so they were never really
  single-carrier keywords, just single-carrier *kinds* sharing a healthy
  badge. `reap`/`reap_all`, `grant_pip`, `bank_spent_die`, `reroll_spent`,
  `conjure_card` carry no `MECHANIC_KEYWORD` row at all by design (own
  face kind / die-gear / card-local — see `KINDS_WITHOUT_MECHANIC_KEYWORD`
  in `axiomancer-mobile/state/combat/__tests__/keywords.test.ts`), so they
  were never atlas rows to begin with. `convert_dots` (CURDLE) WAS a
  genuine single-card violation (The Lazar's Kiss, rot rank 4, no rider
  grants it anywhere else) and this pass retired the badge — see the
  keyword atlas's "Retired" section and the commit for the full wiring.
- residue, NOT actioned: **CHAIN** (`trial.cards.ts`, "Hue and Cry" —
  both its FREE `chain: 2` rider grant and its PAID `kind: 'chain'`
  mechanic sit on the SAME single card; no other theme file mentions
  `chain` in any form) and **OMEN** (`trial.cards.ts`, "The Summing Up" —
  same story, one card, no rider grants elsewhere) are each exactly as
  thin as CURDLE was. Left unactioned on purpose: unlike CURDLE (a
  card-local "glue" verb whose description already reads as
  self-contained flavor text), CHAIN anchors the atlas's primary "damage
  family" octet (DEAL/PIERCE/WRATH/FLAY/CHAIN/EXECUTE/OVERKILL/TWIN) and
  OMEN anchors "tempo and control" alongside STAGGER/BACKFIRE/CHARGE/
  FORETELL/QUARTER — both read as deliberate, load-bearing family members
  the player is meant to meet more than once, not accidental cruft. That
  makes this a card-authoring call (does trial earn a second CHAIN/OMEN
  carrier?) more than a keyword-registry call, and card authoring is
  `/adjust-cards` territory per this skill's own REMOVE-routing rule
  ("routes through `/adjust-cards` if the card itself also needs a
  content change"). Next `/adjust-cards` pass: author a second trial (or
  cross-theme) carrier for each, or make the owner call to retire them
  the same way CURDLE went if a second carrier never lands.
- **resolution (2026-09-06):** authored a second carrier for each rather than
  retiring — both mechanics were judged deliberate family anchors, not
  accidental cruft, and both are generic engine mechanics (`chain`/`omen`
  `specialMechanics` kinds already handle any card that carries them, so no
  engine wiring was needed, only new cards). Added to
  `axiomancer-mechanics/src/Cards/library/trial.cards.ts`: "The Village Comes
  Over the Hill" (rank 4/Rib, heart) — deal 20 + CHAIN 8, with a FLOW rider
  that adds CHAIN 6 more, explicitly a narrative escalation of Hue and Cry's
  own flavor text ("the village comes over the hill..."); and "The Ducking
  Stool" (rank 3/Splinter, body) — deal 14 + a second OMEN (window 2, ante 2,
  same parameters as The Summing Up's proven carrier) staking a claim on the
  foe's stance. KB research (kb-query): CHAIN has strong Dawncaster prior art
  (`kb:dawncaster/keywords/chain.okf.md`, src-general — "Increase the damage
  of the next action by 1 per stack... plays a key role in raising the
  Tide" — a keyword the genre deliberately spreads across many cards, not a
  singleton); OMEN has NO on-point Dawncaster analogue (the closest,
  Foretell, is deck-peek/reorder, a different job from a Conviction-anted
  stance wager) — that miss is stated plainly, not papered over; the second
  OMEN carrier is grounded instead in the repo's own already-proven shape
  (The Summing Up's identical window/ante parameters). Both cards pass the
  card-effectiveness lint, the paid-summary-honesty guard, and the pricing
  sanity guard unchanged. See `plan/CONTENT_LEDGER.md`'s adjust-cards pass 2
  entry for the full arithmetic and verify result.

### [x] [loop-call] Phase 78 — W5 art-pass candidates (2026-09-03) — CLOSED by Phase 88 (2026-09-16)
- category: design residue (art sourcing — awaiting `/oversight` pick;
  RESEARCH-AND-PRESENT per `plan/phases/phase_78_art_pass_w5_sourcing.md`,
  no art wired or committed this phase)
- detail: >=2 CC/open-source candidates per W3/W5 enemy (9 total),
  sourced from a few different sites, each with license + provenance +
  a one-line fit rationale. All URLs verified live via WebFetch at
  research time (2026-09-03). Current interim source for all 9 remains
  the game-icons.net silhouette placeholders (CC BY 3.0, Lorc/
  Delapouite) filed in the W3 loop-call row below — this row is
  candidates for a *replacement* pick, not a report that the
  placeholders are broken.

  **enemy-seam-tick** ("Seam Tick" — blood-drinking cave tick)
  1. [Tick icon](https://game-icons.net/1x1/lorc/tick.html) — Lorc —
     CC BY 3.0 — direct blood-drinking-tick match, distinct SVG from
     the current `maggot.svg` placeholder.
  2. [Tick (PSF).png](https://commons.wikimedia.org/wiki/File:Tick_(PSF).png)
     — Pearson Scott Foresman — Public Domain — clean line-art tick,
     different source/style than game-icons.net.

  **enemy-prop-wight** ("Prop-Wight" — vengeful mine-timber spirit)
  1. [Ghost icon](https://game-icons.net/lorc/originals/ghost.html) —
     Lorc — CC BY 3.0 — "floating soul back from dead to haunt the
     livings"; distinct file from the current `haunting.svg`.
  2. [Ghost monster](https://opengameart.org/content/ghost-monster) —
     ImogiaGames — CC0 — 6-frame animated ghost sprite, 11 color
     variants; full remix freedom to pose as timber-bound.

  **enemy-unpaid-delver** ("The Unpaid Delver" — undead miner)
  1. [Mining icon](https://game-icons.net/1x1/lorc/mining.html) — Lorc
     — CC BY 3.0 — pick-wielding digger motif, different artist than
     the placeholder `miner.svg` (Delapouite).
  2. [Skeleton Sprite](https://opengameart.org/content/skeleton-sprite)
     — r0ar — CC0 — base undead figure (idle/walk/throw-bone/die); weak
     standalone fit — has no pickaxe built in, would need compositing
     with a tool asset (flagged by the scout as the weakest match of
     the 9; an itch.io CC0 mining-character-pack trawl might do better).

  **enemy-sump-maren** ("Sump Maren" — drowned water spirit)
  1. [Mermaid icon](https://game-icons.net/1x1/delapouite/mermaid.html)
     — Delapouite — CC BY 3.0 — gentler/more lure-like than the
     placeholder `drowning.svg`.
  2. [Ophelia (Rusalka) by Konstantin Makovsky](https://commons.wikimedia.org/wiki/File:Ophelia_(Rusalka)_by_Konstantin_Makovsky.jpg)
     — Konstantin Makovsky (1839-1915) — Public Domain — painted
     drowned-woman/water-spirit figure, portrait-quality, on-theme.
     (Also surfaced, not deeply vetted: other Commons
     Category:Rusalka works — Bilibin 1934, Kramskoi "The Mermaids".)

  **enemy-toll-sergeant** ("Toll-Sergeant" — corrupt extortionist guard)
  1. [Sergeant icon](https://game-icons.net/1x1/delapouite/sergeant.html)
     — Delapouite — CC BY 3.0 — rank stripes, distinct from `guards.svg`.
  2. [Brass knuckles icon](https://game-icons.net/1x1/delapouite/brass-knuckles.html)
     — Delapouite — CC BY 3.0 — "fists backing the shakedown" angle.
  3. [The Tax Collector (1542) by Marinus van Reymerswaele](https://commons.wikimedia.org/wiki/File:Marinus_van_Reymerswale_-_The_Tax_Collector_-_WGA19329.jpg)
     — Marinus van Reymerswaele — Public Domain — period portrait of a
     venal fee-collector; medium confidence on fit (tax collector, not
     literally a gate guard, but same extortion archetype). No
     medieval-toll-specific asset found on OpenGameArt/Kenney.nl.

  **enemy-guild-knife** ("Guild Knife" — clean-boots contract killer)
  1. [Dagger & Rose icon](https://game-icons.net/1x1/delapouite/dagger-rose.html)
     — Delapouite — CC BY 3.0 — page names it "symbol of the Mafia",
     matches the guild-contract-killer motif.
  2. [Poison bottle icon](https://game-icons.net/1x1/lorc/poison-bottle.html)
     — Lorc — CC BY 3.0 — alt weapon-of-choice for a killer who avoids
     messy blade work.
  3. [Dark Elf Assassin sprite set](https://opengameart.org/content/dark-elf-assassin)
     — Spring Spring — CC0 — suited professional-assassin framing,
     tonally more playful than intended but maximally permissive.

  **enemy-the-factor** ("The Factor" — predatory debt-broker)
  1. [Scales icon](https://game-icons.net/1x1/lorc/scales.html) — Lorc
     — CC BY 3.0 — weighing imagery, different artist than the
     placeholder `abacus.svg` (Delapouite).
  2. ["The Moneylender and his Wife" (1514)](https://commons.wikimedia.org/wiki/File:Quinten_Massijs_(I)_-_The_Moneylender_and_his_Wife_-_WGA14281.jpg)
     — Quinten Metsys — Public Domain — period painting of a
     predatory financial dealer, strong tonal match.

  **enemy-wharf-shrike** ("Wharf Shrike" — impaling harbor bird)
  1. [Raven 16x18 sprite](https://opengameart.org/content/raven-16x18)
     — Redshrike (concept: KrizEvil) — CC0 — pixel corvid, easy to
     reskin with a hooked/impaling motif; distinct from `raven.svg`.
  2. [Shrike clipart](https://openclipart.org/detail/123931/shrike) —
     Pearson Scott Foresman (via Wikimedia) — Public Domain — the
     literal namesake bird.
  3. [Loggerhead shrike photo](https://commons.wikimedia.org/wiki/File:Shrike_Loggerhead_JG.jpg)
     — JeffreyGammon — CC BY 4.0 — photoreal option if wanted instead
     of line art.

  **enemy-the-harbormaster** ("The Harbormaster" — boss, water-gate
  keeper)
  1. [Kraken tentacle icon](https://game-icons.net/1x1/delapouite/kraken-tentacle.html)
     — Delapouite — CC BY 3.0 — more imposing/threatening than the
     current `pirate-captain.svg` silhouette; scale and menace fit
     the boss slot.
  2. [Sailors & Pirates sprite pack (captain sprite)](https://opengameart.org/content/sailors-pirates)
     — Svetlana Kushnariova (Cabbit) and Jordan Irwin (AntumDeluge) —
     OGA-BY 3.0+ / CC BY 3.0+ (dual) — captain sprite re-skinnable as
     an ancient gatekeeper.
     Neither candidate is portrait-format; if a single strong "face"
     image is wanted for the boss specifically, a further search for
     CC-licensed "ancient sea god" / "customs officer" portrait packs
     is the suggested next step.

- open questions carried from the research (not blocking a pick, but
  worth knowing before `/oversight`): OpenGameArt/itch.io yielded thin
  results for toll-sergeant, the-factor, and wharf-shrike specifically
  (search-engine indexing of those sites is sparse) — Wikimedia
  fine-art/clipart filled the gap instead of a purpose-built game
  asset for those three. unpaid-delver's best CC0 candidate needs
  compositing (skeleton + pick prop), not a single drop-in.
- evidence: `plan/phases/phase_78_art_pass_w5_sourcing.md`; the W3
  loop-call row below (current placeholder sourcing); `enemy.library.ts`
  (`W3_ADDED = '2026-08-28'`) for the enemy roster/theme lines; three
  `scout` sub-agent research passes, 2026-09-03, all candidate URLs
  confirmed live via WebFetch at research time.
- status: awaiting `/oversight` pick — no art wired into the game or
  `provenance.json`/`index.ts` this phase.

**DECIDED via /oversight 2026-09-15:** adopt the first-listed (top) licensed
candidate for each of the 9 enemies, replacing the game-icons.net silhouette
placeholders. Routed to a new **Phase 88** (direct oversight instruction, same
shape as Phase 78/77's promotion — no PHASE_CANDIDATES row to strike). Row
closed; open sourcing questions (toll-sergeant/the-factor/wharf-shrike thin
results, unpaid-delver compositing) carry into Phase 88's brief.

**CLOSED via Phase 88 (2026-09-16):** all 9 enemies re-sourced. 8 of 9 wired
exactly as decided (top-listed game-icons.net candidate, rasterized via the
established recipe). `enemy-wharf-shrike` is the one exception: its top pick
("Raven 16x18 sprite", OpenGameArt) was verified at wiring time to be a
mislabeled humanoid character sheet, not a corvid asset — wired the AUDIT
row's second-listed candidate (openclipart "Shrike", Public Domain) instead.
See `plan/phases/phase_88_w5_art_adoption.md` Decision 2 for the full
verification trail.

### [x] [loop-call] Phase W3 design decisions — the northern city ships (2026-08-28)
- category: design residue (THE OPEN GATE standing rule 7 — decisions filed
  for after-the-fact review, shipped either way; no action needed unless
  /oversight disagrees)
- detail: five calls made while shipping W3 + the W5 partial drain:
  1. **Door placement — nc-26, a NEW column past the Under-Gate boss**,
     not a re-pool of the nc-16 sealed-stair cutscene. Rationale: nc-16
     sits at [8,1], off the terminal column, and its own prose ("through
     the gate below") already names the Under-Gate as the way through —
     so the stair stays sealed scenery and the door follows the boss (the
     fv-10 post-climax pattern). Cost: the caverns tolerate a FOURTH
     singleton column (arrival/quest-giver/boss/door); the map-traversal
     branch-width law carries a caverns-only tolerance of 4 with a comment.
  2. **No v21→v22 migration hop.** The catalogue's `lockedMaps` ledger is
     informational; `unlockMap` admits any REGISTERED destination into
     `availableMaps` at travel time whether or not the save's catalogue
     listed it. A pre-W3 v21 save (2-map catalogue) provably reaches
     northern-city — regression pinned in `travel-kind.engine.test.ts`
     ("a v21 save with the PRE-W3 two-map catalogue can still cross").
     `createStartingWorld` + the v20→v21 seeding constant both gained
     'northern-city' so NEW saves and v20 migrations carry the full ledger.
  3. **`get-to-northern-city` grantor = The Delver, ungated.** She is the
     caverns' guaranteed singleton (every route meets her); the grant is
     not gated on `gather-iron` or the boss because the door itself sits
     past the Under-Gate — the graph does the gating Old Marrow's
     quest-completed requirement did on the coast.
  4. **W5 partially drained: 9 new enemies** (4 cavern natives, 4 city
     predators, the Harbormaster boss), decks composed from the shared
     enemy-card canon (no new cards), portraits from the licensed
     game-icons.net trove as white-on-transparent silhouettes — a
     deliberate style departure from the 52 paintings (the paintings'
     license is UNRESOLVED; the silhouettes are the first fully-licensed
     portraits in the roster). Pool overlaps: caverns∩forest 10/14,
     city∩caverns 3/8, city∩forest 3/8 — the city meets the W5 <70% bar;
     the caverns still lean on the forest roster (full W5 pass remains
     queued to finish the drain).
  5. **Boss ladder — the Harbormaster pinned at L9** on ncy-25 (fv-6=3,
     nc-25=6, ncy-25=9: a clean 3-step act ladder). Library level L18
     boss-tier for late-game wandering scale.
- evidence: `plan/steps/01_build_plan.md` Phase W3 row; commits on
  `claude/w3-northern-city`.
- **RATIFIED via /oversight 2026-09-02:** all 5 calls ratified as filed,
  walked through individually. Call 4 (W5 silhouette portraits) drew a
  follow-up ruling, not a reversal: T wants a standing sourcing process
  going forward rather than ad hoc per-enemy picks — filed as new
  **Phase 78** below (agent-researched open-source art, 2 candidates
  presented per next `/oversight`, the picked source becomes the
  standing pipeline until in-house generation is ready).

### [x] [contract] Phase 57 can zero the live axio-query corpus inside an already-running session — RESOLVED 2026-09-17 (commit 3652d663, issue #323)
- category: contract
- observed: during the 2026-08-24 roundtable, the checkout fast-forwarded across Phase 57 (`cb788468`), which deleted the tracked `devlog/data/{cards,enemies,effects}.json` snapshots. The already-running `axio-query` process then returned `0 cards, 0 enemies, 0 effects` instead of regenerating. A manual `npm run catalog:export` restored `57 cards, 56 enemies, 24 effects` immediately.
- cause seam: `scripts/axio-mcp-server.mjs` caches `freshnessChecked` for the process lifetime, while Phase 57 made the JSON inputs ignored/generated. A server that checked freshness before a checkout mutation can later lose those files without rechecking. `scripts/axio-mcp-server.test.mjs` calls the smoke test "returns non-empty counts" but only matches `\d+`, so zero passes.
- impact: the MCP advertises live-library truth while silently returning an empty corpus after a legal pull/checkout transition. Card/effect research can then make false absence claims until the export is rebuilt or the MCP process restarts.
- suggested fix: make freshness sensitive to missing/changed export files on every data-bearing tool call (or invalidate the cache when any snapshot disappears), strengthen the smoke to assert positive card/enemy/effect counts, and add a hermetic delete-after-first-call regression witness.
- evidence: `scripts/axio-mcp-server.mjs:14-22,51-69,129-151`; `scripts/axio-mcp-server.test.mjs:57-63`; roundtable command sequence and MCP outputs dated 2026-08-24.
- resolution: dropped the `freshnessChecked` once-per-process gate — `ensureFresh()` now re-runs its cheap mtime comparison on every `tools/call`, only paying for the actual `npm run catalog:export` regen when the export files are missing or genuinely stale. Tightened the smoke test's count assertions from a bare `\d+` (a 0-count response still passed) to a real `[1-9]\d*` lower bound, and added a hermetic regression test that deletes `cards.json` mid-session and confirms the very next tool call re-detects and regenerates it — all 9 smoke-test cases green, `check-lexicon.mjs` clean.
- issue: #323

### [x] [docs] Combat playtest reference still names the retired ten-preset campaign — RESOLVED 2026-09-02 (commit dfa03ebb, issue #270)
- category: docs
- impact: 8
- ease: 9
- detail: filed 2026-08-28 from the scheduled Kid/roundtable witness. `axiomancer-mechanics/docs/playtest.md` still declares `erosion`, `oratory`, `foundry`, `penitent`, `standstill`, `augury`, `tithe`, `grace`, `bastion`, and `refrain` as the preset grammar, and its cookbook invokes `preset:dot-erosion` / `preset:erosion`. The live CLI rejects those ids and exposes only `threadbare`, `pilgrim`, and `apostate`; the same document still teaches the retired starter-curve doctrine at its close. The Kid's direct `npm run combat -- ... --deck preset:erosion` probe failed before combat on current main.
- resolution: rewrote the grammar table and all three cookbook examples against the live threadbare/pilgrim/apostate presets; added a docs-parity witness (`cli.docs-examples.engine.test.ts`) asserting every `preset:<id>` in `docs/playtest.md` resolves in `COMBAT_DECK_PRESETS`, so a future preset rename/removal fails CI instead of leaving stale docs. The starter-preset win-rate curve section (lines 156-164) was verified current against `CLAUDE.md`'s load-bearing doctrine, not retired — left unchanged.
- evidence: `axiomancer-mechanics/docs/playtest.md:53-64,98-124,156-164`; `axiomancer-mechanics/src/Combat/combat.starter-deck-presets.ts`; `/root/Workspace/reports/axiomancer-playthrough/2026-08-28.md`.
- issue: #270

> AUDIT-DRAIN MODE LIFTED (via oversight 2026-08-15 — T called it off).
> The 2026-08-12 banner in `plan/steps/01_build_plan.md` paused
> `ship-a-phase` dispatch so `/march` would fall through to `/iterate`
> every tick until this Pending queue was clear. It did not hold —
> Phases 52c/52d/52e shipped under it while the drain closed one row in
> three days — so T lifted it. Phases ship on their normal turn again
> and this queue drains through `/iterate`'s ordinary place in the
> rotation. Still no category bias: /iterate works top-down by score.
> The prior divergence
> bias (set 2026-08-10) is retired: its target row, top score 72
> (`axio-query overview still publishes the retired "THE STRIKE IS
> DEAD" doctrine after Phase 41`), sat unclaimed across 2 full ticks
> despite the bias, so it was promoted directly to build-plan **Phase
> 55** instead of waiting on a third `/iterate` pass — see that row
> below. The same same-day /oversight pass re-verified every other
> non-historical row in this Pending section against current code;
> rows found stale or premise-changed were closed out below with a
> RESOLVED note, same convention as every other closed row in this
> file.

### [x] [debt] `.claude/**` doc sync for THE OPEN GATE — classifier-blocked from this session [loop-call] — RESOLVED via Phase G1 (2026-08-31, `/march`)
- category: debt
- impact: 6
- ease: 8
- detail: filed 2026-08-28 by the attended OPEN GATE session. The harness's
  permission classifier blocks editing `.claude/commands/*.md` (and,
  precedent, `.claude/settings.json` — see the Phase 72 row) even in an
  attended session, so the command files still carry wall text that
  `plan/bearings.md` § THE OPEN GATE has superseded:
  `.claude/commands/deck-tuning.md` ("Engine constants are tuned manually,
  not here" — desc, §Disambiguation, §walls table, §related-loops),
  `combat-playtest.md` ("Report only" + engine-constants-manual handoff),
  `world-tuning.md` ("Dispatcher/handler CONTROL FLOW stays propose-only"),
  `hazard-tuning.md` (propose-only structural findings). Also blocked: a
  `.claude/commands/forge.md` doorway pointer for the new `skills/forge.md`
  loop verb (march reads the skill file directly, so the loop itself works;
  only the human-typed `/forge` slash entry is missing). Until the sync
  lands, bearings outranks the command files per the source-of-truth
  hierarchy — a tuning tick reading a wall should check bearings before
  obeying it.
- next: land the edits from a session with the grant (add
  `Edit(.claude/commands/*)` permission, or T runs an attended pass and
  approves the prompts). Exact edit list mirrors THE OPEN GATE ¶4–¶5.
- **RESOLVED 2026-08-31 (Phase G1, `/march`):** the classifier block did not
  reproduce this tick — a direct `Edit()` probe on
  `.claude/commands/deck-tuning.md` succeeded with no prompt or denial, so
  whatever blocked the 2026-08-28 attended session no longer holds. All four
  command files' superseded wall text lifted per THE OPEN GATE ¶4/¶5, plus
  the `.claude/commands/forge.md` doorway pointer, in
  `docs(.claude): lift superseded OPEN GATE wall text from tuning commands — phase G1`.

### [x] [divergence] Transitional-library ruling outlived its subject — card authority is a dead letter — RESOLVED-STALE 2026-09-17 (/oversight): `plan/bearings.md:363` lifts the hold and `skills/digest.md` carries THE PIPELINE LIBERATION; the ruling the row calls live was already repealed
- category: divergence
- impact: 9
- ease: 9
- detail: filed 2026-08-22 by the content-pipelines audit
  (`docs/reports/content-pipelines-audit-2026-08-22.md`, PR #228).
  `plan/bearings.md`'s "THE CURRENT CARD LIBRARY IS TRANSITIONAL — do not
  spend tuning effort on it" ruling (T direct 2026-08-08) names the 86-card
  library that was replaced by the 57-card Profane Canon the same day, and
  Phase 43 has since shipped the CQI objective function the ruling was
  waiting on. No bearing lifts the order; `skills/digest.md:79` still
  enforces it. Net: `/deck-tuning`'s "full card authority" cannot be
  exercised — no card content ships autonomously against an expired
  rationale. Needs one line from T: lift, or restate against the canon.
- next: /oversight
- **RESOLVED 2026-08-22 (same PR):** T directed *"free up ALL these
  pipelines"* — ruled as THE PIPELINE LIBERATION in `plan/bearings.md`;
  the transitional-library hold is lifted and the historical ruling is
  marked superseded in place. No further action.

### [docs] Card-work docs describe a dead world — /deck-tuning is unexecutable as written
- category: docs
- impact: 8
- ease: 7
- detail: filed 2026-08-22 by the content-pipelines audit.
  `.claude/agents/card-expert.md` teaches "70 cards / 10 themes / exactly
  30 keywords / THE STRIKE IS DEAD / sandbox-first is law";
  `.claude/commands/deck-tuning.md` §8 references the deleted
  `src/Cards/swap-pool/` and 10 retired preset ids (live: threadbare /
  pilgrim / apostate); neither file mentions CQI (spec 35) once;
  `SANDBOX_CARD_SETS` is `{}` yet the skill cites a `forge-example` set;
  `.github/workflows/deck-tuning.yml` dropdown offers only dead preset
  ids; `axiomancer-mechanics/CLAUDE.md:22-32` and
  `docs/profane-canon.md:33` carry the same drift while
  `cards.library.ts:22` states the opposite. A tick invoking /deck-tuning
  today fails at its own Step 1. Rewrite the set against the Profane
  Canon + CQI in one pass.
- next: /iterate
- **RESOLVED 2026-08-22 (same PR):** card-expert.md, deck-tuning.md,
  mechanics CLAUDE.md, profane-canon.md, keyword-atlas.md headers, and
  deck-tuning.yml's preset dropdown all rewritten against the Profane
  Canon + CQI + THE PIPELINE LIBERATION; stale axio-mcp-server tests
  fixed and wired into a new root `npm test`. Residual polish (if any
  drifted line surfaces) drains through normal /iterate.
- closed 2026-09-25: the row's own RESOLVED 2026-08-22 line; `/deck-tuning` itself is retired in T5 (D10).

### [x] [gap] THE LONGER LEASH is unratified and invisible to the loop — RESOLVED-STALE 2026-09-17 (/oversight): `plan/bearings.md:471` is the bearings entry this row says is missing, and no north-star heading still reads DRAFT-FOR-RATIFICATION
- category: gap
- impact: 9
- ease: 8
- detail: filed 2026-08-22 by the content-pipelines audit.
  `plan/north-star-mork-borg.md` R-D (full authority to ship
  NPCs/regions/beats/copy) and R-F (bold authority over new cards,
  effects, keywords, narration, art, UI, the map) are headed
  DRAFT-FOR-RATIFICATION; its own follow-ups N-1 (fold into bearings /
  spec 34), N-2 (register lint — R-D is conditioned on it), N-3
  (re-voice) appear in no build-plan row and no candidates file, and
  bearings has no longer-leash entry, so a tick reading bearings sees
  only the narrow 2026-08-08 postures. R-C ("prose only") also
  contradicts R-F (art in scope) inside the same draft. Needs T:
  ratify/trim, then N-1 folds it in.
- next: /oversight
- **NARROWED 2026-08-22:** THE PIPELINE LIBERATION (bearings) now
  grants the operative content authority directly (cards, keywords,
  content items, narrative, art acquisition), so the loop is no longer
  blind to it.
- **RESOLVED 2026-08-22 (walkthrough):** T ratified
  `plan/north-star-mork-borg.md` **as-is**. The R-C/R-F art
  contradiction resolves in R-F's favour (it is the later ruling and
  self-declares precedence): art IS in loop scope, with the Woodcut
  Codex masterplan surviving as the current art bearings rather than
  as a bar on the visual layer — reconciliation written into that
  file's header. Follow-ups queued: N-1 → **Phase 74**, N-2 → Phase 70
  + Phase 74, N-3 → **Phase 75**.

### [gap] Narrative has no shipping verb; authored narration never reaches players until Phase 58
- category: gap
- impact: 7
- ease: 6
- detail: filed 2026-08-22 by the content-pipelines audit. Story ships
  only via a hand-written build-plan row into /ship-a-phase; the three
  design skills are attended-only; `skills/iterate.md` §content still
  instructs spawning a `content-curator` agent that does not exist in
  `.claude/agents/`. Meanwhile `MapEventPayload.description` is authored
  on 59/74 nodes but `ResolvedEvent` never carries it — players get
  three-word placeholders (queued as Phase 58, "ship it first").
  Sequence: ship 58, fix or drop the content-curator reference, then a
  narrative shipping skill (draftable propose-only now; its authority
  language waits on the longer-leash call).
- next: /iterate
- **PARTIAL 2026-08-22 (same PR):** `content-curator` agent CREATED
  (`.claude/agents/content-curator.md` — authority via THE PIPELINE
  LIBERATION, voice constitution + gates baked in) and /iterate's
  references made concrete. STILL OPEN: Phase 58 (already queued,
  "ship it first") and an optional dedicated narrative loop
  skill/workflow if content-curator-via-/iterate proves insufficient.
- closed 2026-09-25: Phase 58 shipped (`426912a9`); the only remaining item was optional.

### [content] Shipped in-game prose is un-linted; naming law unwired
- category: content
- impact: 5
- ease: 6
- detail: filed 2026-08-22 by the content-pipelines audit.
  `scripts/check-lexicon.mjs` scans `.md` only — every dialogue tree,
  `MapEvents/content.ts`, `act*.content.ts`, and `rest.copy.ts` string
  is `.ts`, so the prose players actually see has no retired-term or
  voice lint at write time or in CI (Phase 66 as queued still targets
  docs). `scripts/check-naming-law.mjs` exists with tests but has no npm
  script and no CI hook — NL-4/5/8 run only if invoked by hand. Extend
  the lexicon lint to authored `.ts` content surfaces and wire the
  naming law into verify.
- next: /iterate
- **QUEUED 2026-08-22:** promoted to build-plan Phase 70 (same-PR
  queue addition) — the liberation authorizes autonomous narrative
  shipping, so this guardrail should be mechanized before heavy prose
  volume lands.
- closed 2026-09-25: Phase 70 shipped (prose lint for `.ts` content + naming law in CI; `npm run lint:content`).

### [x] [docs] Scheduled playtest references name retired Hazard and Fishing Village route identities — RESOLVED 2026-09-14 (commit `541e4ad4`, issue #308)
- category: docs
- impact: 7
- ease: 8
- issue: #308
- detail: filed 2026-08-21 by the scheduled SomberSoft roundtable from the
  Kid's current-main playthrough. Two canonical-looking operator references
  now issue commands against identities the live CLIs/maps reject or no longer
  traverse. `axiomancer-mechanics/docs/cli.md` still documents and exemplifies
  `--hazard H01`, but the current Hazard CLI rejects `H01` and accepts named
  slugs such as `cracked-cliff`. Separately,
  `axiomancer-mechanics/automation/scripts/walkthroughs/fishing-village-exploration.goal.md`
  still declares `fv-2 -> fv-12` / Driftwood Husk as the first reliable
  encounter, while current main's passing route-Hazard witness and direct CLI
  route use `fv-2 -> fv-11 -> fv-13` / Little Belle. The stale walkthrough is
  especially dangerous because commit `4c1b9df6` reconciled adjacent world/map
  truth on 2026-08-20 without updating this executable goal.
- evidence: `/root/Workspace/reports/axiomancer-playthrough/2026-08-21.md`;
  `npx vitest run src/CLI/e2e/game.cli.route-hazard.engine.test.ts
  --reporter=verbose` passed on main and traversed `fv-2 -> fv-11 -> fv-13`;
  `npm run hazard -- --auto --seed 42 --runs 1 --hazard H01 --route top`
  rejected the id, while the same command with `--hazard cracked-cliff`
  passed. Current source paths named above were re-read at `b67a25fb`.
- next: /iterate. Replace operator-facing examples with current stable slugs and
  the current authored route, then add a docs/registry parity witness so hazard
  ids and walkthrough node/enemy identities cannot drift silently again. Do
  not rewrite historical H01-H15 design doctrine where it is explicitly
  historical; fix executable command/reference surfaces.
- resolution (2026-09-14): fixed exactly the two executable surfaces named
  above, left historical H01-H15 design-doctrine docs untouched (confirmed via
  grep that only `docs/cli.md`'s two live examples reference `H01` outside
  explicitly-historical spec/BDD/TDD docs). `docs/cli.md` now examples
  `--hazard cracked-cliff` in both the flag table and the runnable command.
  `fishing-village-exploration.goal.md` now documents `fv-2 -> fv-11 -> fv-13`
  / Little Belle throughout (route description, both recommended commands,
  pass/fail conditions, diagnostic notes); its paired `.json` script now
  targets `fv-11` then `fv-13` instead of the disconnected `fv-12`. Manually
  ran both the corrected `--script` and `--route` forms end-to-end before
  shipping — both resolve the `fv-13` encounter against Little Belle and
  complete Hazard-Pattern combat. Added the requested parity witness to
  `src/CLI/e2e/cli.docs-examples.engine.test.ts` (extends the file's existing
  --enemy/preset pattern): one test asserts every `--hazard <id>` example in
  `docs/cli.md` resolves in `HAZARD_LIBRARY`, two more assert the
  walkthrough's documented `fv-N` node ids exist on `fishingVillage.nodes` and
  that its `--route` chain is actually connected node-to-node — this is the
  check that would have caught the original drift (the old `--route
  fv-2,fv-12` example was a broken command, not just stale prose: fv-2's
  `connectedNodes` no longer include fv-12 at all). `npm run verify
  --workspace axiomancer-mechanics`: 213/213 files, 3435/3435 tests
  (3432 + 3 new), build green.

### [debt] `telemetry.mjs` writes `TELEMETRY.md` relative to cwd, so a workspace-cd forks the log
- category: debt
- impact: 3
- ease: 8
- detail: filed 2026-08-09. Invoking a skill while the shell's cwd is inside
  a workspace makes the hook create a **second** `TELEMETRY.md` there
  (observed: `axiomancer-mechanics/TELEMETRY.md`, one row, full header)
  instead of appending to the tracked root log. The row is not lost, but it
  lands untracked in the wrong package, the stop hook flags it as an
  uncommitted file, and the canonical log silently misses the invocation
  unless someone notices and moves it. Any agent that `cd`s into a package
  to run a script — which is routine — reproduces it.
- this instance was repaired by hand: the row was appended verbatim to the
  root log and the stray file deleted. Rows were not edited, per the
  standing rule.
- next: /iterate — resolve the path from `CLAUDE_PROJECT_DIR` (the hook
  already receives it; `guard.mjs` uses it) rather than from cwd, and add a
  smoke assertion that a hook fired from a subdirectory still appends to the
  root log.
- closed 2026-09-25: resolved in tree — `.claude/hooks/telemetry.mjs` anchors its path to `CLAUDE_PROJECT_DIR` (and the log is now sharded under `telemetry/`).

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
- closed 2026-09-25: superseded — CI triggers for the three uncovered journeys shipped 2026-09-19 ([3.5]); the local-gate half lives on as the 2026-09-20 `[loop-call]` row (decided option (a) `verify:journeys`, still in Pending).

### [x] [contract] `exploration-combat-roundtrip-e2e` regression: FLEE leaves the tab bar hidden — RESOLVED via /oversight 2026-08-10: fixed by #194
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
- **[x] RESOLVED 2026-08-10 (/oversight, verified against commit
  `a251a325` / PR #194 "combat: breathe the foe, retire the double entry
  gate, name the enemy's turn").** #194 retired the encounter-modal
  double-entry gate this row's own root-cause read named as the likely
  mechanism (auto-engage on mount, single commit gate at the reveal) and
  its commit body states the roundtrip e2e now "plays out the start-node
  arrival cutscene... before reading the tab lock it was misattributing
  to" — the exact desync class this row tracked. Commit body reports
  `e2e:combat` and `e2e:exploration-roundtrip` passing in a real browser.
  Not re-run locally by this /oversight pass; drain on the strength of
  the commit's own evidence. If it recurs, re-file fresh rather than
  reopen this row.

### [x] [gap] `march` ticks are creeping toward the 90-minute job timeout; one was killed mid-cycle — RESOLVED via Phase 92 (2026-09-18, commit d7cc91d7)
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
- recurrence (2026-08-21 digest pulse): run `32374048835` (the
  2026-08-20 13:24 scheduled `march` tick) ran `1:14:56` before
  `##[error]The operation was canceled.` — not stuck on the apt-mirror
  hang this time (real work in flight per the job log), no commit
  resulted. Reinforces the existing phase-candidate proposal; not a new
  finding.

**RESOLVED via Phase 92 (2026-09-18, commit `d7cc91d7`):** the candidate's
raise-vs-split choice was already decided by `plan/bearings.md` §
Operational notes before this phase (`b53dac5d`, 2026-08-14, PR #205:
"a tick that genuinely needs more should be split, not have its cap
raised silently") — raising `timeout_minutes` was off the table. What was
still open was why the split side of that policy failed once: Step 13 of
`skills/ship-a-phase.md` already said "return cleanly" on 2026-08-09 (it
shipped with the nexus adoption five weeks earlier) and the 44a+44b chain
happened anyway. Phase 92 promoted the no-chaining constraint from step
prose to an enumerated Hard Rule (§7 rule 12), the section agents follow
more reliably per Hard Rule 11's own precedent. Re-measured before
deciding: the last 100 `march` runs (checked 2026-09-18) show 0
cancellations, slowest 53.3 min against the 75-min ceiling — the
discipline has evidently held for weeks; this closes the documented gap
that let it fail once, rather than a live problem. `timeout_minutes`
stays at 75, unchanged.

### [x] [mobile] The live combat exit path bypasses the engine's end-of-combat reducer entirely — RESOLVED via /oversight 2026-08-10: route through endCombat, folded into Phase 54
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
- **RULING (T via /oversight 2026-08-10):** route live combat through
  `endCombat` — the correctness risk of an unenumerated silent no-op
  outweighs the refactor cost of reunifying with the panel's local React
  state. Queued as build-plan **Phase 54**.


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

### [x] `SYSTEM_TERM_COVERED_BY` claims WILD / X is covered by a keyword with no glossary row — RESOLVED by Phase 44b (verified via /oversight 2026-08-12)
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
- resolution: `keywords.ts:395-401` now maps `'WILD / X': ['FORGE']` only,
  with an inline comment recording the 2026-08-09 Phase 44b / spec 34 §5.2.1
  call: CLARITY dropped (named no glossary row), FORGE alone covers X→WILD
  and does have a live `KEYWORD_GLOSS` entry. Coverage claim now resolves.
- next: (drained)

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

### [x] [needs-user-call] The product name "Axiomancer" under the whole-product pivot — RESOLVED via /oversight 2026-08-20: renamed to "Miserere Mei, Deus"
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
- **RULING (T via /oversight 2026-08-10):** reconsider, not keep-as-is.
  The name is not finalized here — only the standing question ("does this
  deserve reconsideration at all?") is closed, answer yes. Open a
  dedicated naming discussion (candidate names + rationale) as its own
  session rather than deciding it inline as a multiple-choice; until that
  session lands, "Axiomancer" remains the working name and Phases 44a-44i
  are unaffected either way.
- next: schedule a naming session (own thread, not folded into a phase
  brief). Row stays open until that session rules a final name (or
  reaffirms the current one).
- **STILL OPEN after /oversight 2026-08-15 — T asked for more
  candidates.** The session opened 2026-08-12
  (`plan/naming-session-2026-08-12.md`) and its §3 first pass was put to
  T today; T ruled none of it and asked for a wider set rather than
  picking from that list or closing on KEEP. A second pass was authored
  in the same oversight commit as that file's new §5 — six candidates
  across three deliberately different directions (liturgical hours:
  Compline, Viaticum; architecture: Lychgate, Sepulchre; the game's own
  shipped language: Cold Iron, Threnody), each collision-checked against
  the keyword registry and both source trees. Note recorded there for
  the next pass: if §5 also misses, T naming a *direction* is a better
  format than a third cold list. Nothing in the queue waits on this —
  "Axiomancer" remains the working name and Phases 44a-44i are
  unaffected either way, exactly as the 2026-08-10 ruling said.
- **RESOLVED via /oversight 2026-08-20:** T did not pick from either
  candidate pass. Ruling, direct: rename to **"Miserere Mei, Deus"**
  (Latin, Psalm 51 — "Have mercy on me, God"). This landed alongside a
  broader decision, not a naming-session pick in isolation — T set
  *Mörk Borg* as the new tonal North Star for everything except deck/dice
  mechanics (art, narration, encounter design, content pipelines), and
  named this title in that same breath. See `new-north-star.prompt.md`
  (repo root) for the follow-up brainstorm this opens — the name is
  locked now; the rest of the pivot is not.
- **Scope of what's actually done here:** the plan-of-record only —
  this row, `plan/naming-session-2026-08-12.md` closed out, and
  `plan/bearings.md`'s standing name line updated. The mechanical
  migration (title screen, `app.json`/store metadata, CLI banner
  strings, doc mentions across both packages) is queued as build-plan
  **Phase 67**, not done in this commit — `/oversight` doesn't touch
  code. Until Phase 67 ships, hardcoded "Axiomancer" strings remain in
  the live app; that's expected, not a regression.
- **Naming collision to flag for whoever ships Phase 67:** the bare word
  "Miserere" is already live in-fiction (per the 2026-08-15 pass's own
  collision check, which is why it dropped that word from consideration
  on its own). The chosen title is the full phrase "Miserere Mei, Deus,"
  not the bare word — distinct, but worth a deliberate check during
  Phase 67 that in-game UI never places the existing "Miserere" content
  next to the product title in a way that reads as duplicated or
  confusing.

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
- closed 2026-09-25: Phase 52c shipped, which the row names as the drain.

### [x] [needs-user-call] Should any map outside the fishing village read as an inn? — RESOLVED via /oversight 2026-08-10: no, fishing village only
- category: content
- impact: 4
- ease: 9
- detail: filed 2026-08-08 by Phase 52b. `shelter: 'camp' | 'inn'` now says
  it explicitly instead of inferring it from `healFraction >= 1.0`. Shipped
  with the most-defensible default — the four fishing-village rest nodes are
  the only inns; everything else is a camp, pinned as a COMPLETE set so a new
  inn cannot appear silently. Authored content question, not a code one.
- **RULING (T via /oversight 2026-08-10):** no — confirm the current
  default as final. The four fishing-village rest nodes stay the
  COMPLETE inn set; no content change.

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
- closed 2026-09-25: resolved in tree — `buildCombatDeck` (`src/Combat/combat.deck.ts`) keeps copies and `ensureStarterCards` writes the recipe verbatim (Phase 104).

### [x] axio-query overview still publishes the retired "THE STRIKE IS DEAD" doctrine after Phase 41 — PROMOTED via /oversight 2026-08-12: build-plan Phase 55
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
- **PROMOTED 2026-08-12 (/oversight).** 2 full ticks (44g, 44h) shipped
  since the 2026-08-10 divergence bias targeted this row and it still
  hadn't drained — `ship-a-phase` phase work keeps winning `/march`'s
  Step 3a ahead of `/iterate`. Promoted directly to build-plan **Phase
  55** rather than wait on a third bias-weighted pass; the fix itself is
  unchanged from the "next" note above. See `plan/steps/01_build_plan.md`.

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
- closed 2026-09-25: the tracked `[HIGH] late-stage global collapse` row closed 2026-09-15 (Phase 81), and THE BIG NUMBERS REWRITE repealed the doctrine curve these reads graded against.

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
- closed 2026-09-25: the tracked `[HIGH] late-stage global collapse` row closed 2026-09-15 (Phase 81), and THE BIG NUMBERS REWRITE repealed the doctrine curve these reads graded against.

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
- closed 2026-09-25: the tracked `[HIGH] late-stage global collapse` row closed 2026-09-15 (Phase 81), and THE BIG NUMBERS REWRITE repealed the doctrine curve these reads graded against.

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
- closed 2026-09-25: the tracked `[HIGH] late-stage global collapse` row closed 2026-09-15 (Phase 81), and THE BIG NUMBERS REWRITE repealed the doctrine curve these reads graded against.

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
- closed 2026-09-25: the tracked `[HIGH] late-stage global collapse` row closed 2026-09-15 (Phase 81), and THE BIG NUMBERS REWRITE repealed the doctrine curve these reads graded against.

### [x] `skills/digest.md` §3 cites breadth-check plumbing that doesn't exist in this repo — RESOLVED (verified via /oversight 2026-08-12)
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
- resolution: `skills/digest.md` no longer cites the dead command or
  path — line 49 now reads `npm --workspace axiomancer-mobile run
  e2e:minigames`, and its only remaining `nexus/` mention explicitly
  disclaims the retired pre-monorepo tree as non-authoritative.
- next: (drained)
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

### [x] Ratify `SPECIAL_FIRES_ON_USE` — drop the PROVISIONAL marker — RESOLVED (verified via /oversight 2026-08-12)
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
- resolution: `combat.upgradeable-dice.ts:71-76`'s doc comment now
  reads "§6 owner-ratified fires-on-use rule (D7)"; spec 33 §6 likewise
  reads "RATIFIED rule (D7)." One harmless dangling cross-reference
  remains at `specs/33-upgradeable-dice.md:276` ("see PROVISIONAL
  above," pointing at a heading that no longer exists) — low-value
  wording cleanup, not a live PROVISIONAL marker; left for a future
  /iterate pass rather than reopening this row over it.
- next: (drained)

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
- closed 2026-09-25: the tracked `[HIGH] late-stage global collapse` row closed 2026-09-15 (Phase 81), and THE BIG NUMBERS REWRITE repealed the doctrine curve these reads graded against.

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
- closed 2026-09-25: the tracked `[HIGH] late-stage global collapse` row closed 2026-09-15 (Phase 81), and THE BIG NUMBERS REWRITE repealed the doctrine curve these reads graded against.

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

### [x] GLYPHS (Phase 33d) has no formal spec — design lives only in a braindump — RESOLVED (verified via /oversight 2026-08-12)
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
- resolution: `plan/phases/phase_33d_glyphs_pilot.md` (371 lines) states
  in its own header that it IS the decisive 33d brief this row calls
  for, satisfying the row's stated minimum bar. Phase 33d shipped
  against it (`01_build_plan.md`, `[x]`, commit `ac1853b2`).
- next: (drained)

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

### [x] Retire two stale worktrees fully landed on `main` (dice + price-experiment) — RESOLVED (verified via /oversight 2026-08-12)
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

### [x] `circular-reasoning` sits at exactly the uncommon pricing-lint floor (4.50) — RESOLVED (stale premise via /oversight 2026-08-12)
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
- resolution: the card no longer exists — retired entirely by the
  Profane Canon rework (PR #182, commit `84ef85b`). No pricing-lint
  floor concern has a subject anymore; only a test-fixture comment
  references the old id.
- next: (drained)
- next: /iterate or /deck-tuning (nudge the card value or the band floor)

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
- closed 2026-09-25: resolved in tree — `theme-switch-e2e.mjs` uses `fileURLToPath`.

### [x] Stale worktree copy at .claude/worktrees/card-text-paid-effects-3cd590/ — RESOLVED (verified via /oversight 2026-08-12)
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
- resolution: `.claude/worktrees/` no longer exists in the repo at all
  (confirmed via `git worktree list`, which shows only the primary
  worktree) — the stale copy is gone.
- next: (drained)

### [x] Metric v2 design session parked until fresh metrics land — RESOLVED (Phase 43 shipped, verified via /oversight 2026-08-12)
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
- **Phase 43 shipped** (`01_build_plan.md`, `[x]`; `combatQuality`/CQI
  live in `combat.encounter.sim.ts`, documented as "THE OBJECTIVE
  FUNCTION," `statusEngagement` demoted to a warning light). The
  blocking condition ("fresh metrics land") has cleared.
- next: (drained)

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

### [x] `axiomancer-mechanics/CLAUDE.md` still asserts the retired STRIKE-IS-DEAD / status-primacy doctrine as current — RESOLVED via Phase 66 (2026-08-27, `d3b46d59`)
- category: docs
- impact: 4
- ease: 8
- detail: filed 2026-08-14 by Phase 55 (retiring the same stale doctrine from
  the `axio-query` MCP). `CLAUDE.md`'s "Load-bearing doctrine (set 2026-06)"
  section still reads "Status effects are the MAIN fun and the most engaging
  aspect of combat encounters" and "**Updated 2026-07-08 (spec 32 v3 — THE
  STRIKE IS DEAD):** raw HP damage was purged at the schema level" as
  present-tense fact. Both were retired by T's 2026-08-08 unshackling
  (`axiomancer-mechanics/VISION.md` "Combat vision": "restored ordinary
  direct damage... No one path is doctrine-mandated as the dominant combat
  route"). The 2026-08-13 reconciliation pass (`9caf2a26`, "docs: reconcile
  combat doctrine after unshackling") touched `AGENTS.md`,
  `axiomancer-mechanics/AGENTS.md`, `VISION.md` (both packages), and
  `skills/digest.md` — not this file, so it's the one doctrine echo that
  pass missed.
- next: reword to match the reconciled `VISION.md` §Combat vision language
  (direct damage legal; Conviction/Surge/dice the three locked systems);
  same edit shape as the `9caf2a26` pass.
- RESOLVED 2026-08-27 by Phase 66. The "Load-bearing doctrine (set 2026-06)"
  section now reads "status effects remain a major authored tool — they are
  no longer the governing combat objective" and judges changes by CQI
  (spec 35). Guarded going forward by the new `status-primacy-doctrine`
  row in `lexicon.json`, so a reversion goes red in CI rather than waiting
  for the next audit to notice.

### [x] `axiomancer-mechanics/docs/profane-canon.md` still asserts "THE STRIKE stays DEAD" as current design law — STALE, drained via Phase 66 (2026-08-27)
- category: docs
- impact: 3
- ease: 8
- detail: filed 2026-08-14 by Phase 55. §1's "Unchanged, by hard constraint"
  paragraph reads "THE STRIKE stays DEAD: no card deals raw HP damage —
  enemy HP falls only to DoT ticks, affliction payoffs..." — this is the
  Profane Canon rework's own design record, written earlier the same day
  (2026-08-08) as the unshackling that retired the ban later that day. Lower
  impact than the sibling `CLAUDE.md` row (this is a design-history doc, not
  live agent-loaded guidance, and doesn't feed the `axio-query` MCP), but
  still reads as current-tense wrong.
- next: reword the paragraph to note the ban was retired same-day by the
  unshackling, or move it under a "design history — since superseded"
  heading rather than "Unchanged, by hard constraint."
- DRAINED 2026-08-27 by Phase 66 (verified stale; no new code). §1 already
  reads "Direct damage is LEGAL (THE UNSHACKLING, 2026-08-08 —
  `cards.library.ts`'s header is authoritative): the CURRENT canon happens
  to deal enemy HP only via DoT ticks... but that is a design choice of
  this library, not a law." Phase 66's `strike-ban-doctrine` row scans the
  file clean. The row was fixed by some pass between 2026-08-14 and today
  without being ticked here.

### [x] [tooling] Four keyword surfaces drift with no failing test — RESOLVED via Phase 68 (2026-08-27, `25e3e3cb`)
- category: tooling
- impact: 6
- ease: 4
- detail: filed by the 2026-08-22 content-pipelines audit (§2, "silently-drifting
  surfaces"). THE PIPELINE LIBERATION opened the keyword registry to loop growth
  while the wiring around it stayed ungated: a new keyword or mechanic kind
  type-checked clean, printed nothing, and drifted four surfaces apart.
- RESOLVED 2026-08-27 by Phase 68. `CARD_SPECIAL_MECHANIC_KINDS` binds a runtime
  enumeration to the `CardSpecialMechanic` union in both directions (compile
  error either way); mobile KW-2 walks it and forces every new kind to be
  classified; `scripts/content-drift.test.mjs` asserts glyph-table equality,
  editor-vocabulary liveness, and atlas-vs-registry parity, on its own
  `verify-drift.yml` lane triggered by every path it reads.
- residue, deliberately out of scope (both named in the brief's Follow-ups):
  the two `default:`-armed switches (`combat.engine.ts` mech switch,
  `combat.cards.ts` mechanicText) still let a new kind no-op silently — closing
  that means `assertNever`, a behavioural change; and card-expert's 8-step
  keyword checklist still omits the mobile registry, `CARD_EFFECT_SET`, the
  atlas, `retheme-map.json`, and `MECH_HEADLINE_PRIORITY`.

### [x] [needs-user-call] No shipped art has a license on record — CONVERTED to loop policy via THE OPEN GATE ¶6 (2026-08-28)
- **resolution:** THE OPEN GATE (T direct, 2026-08-28 — `plan/bearings.md`)
  withdrew the owner-input dependency: art origin questions are the loop's
  to settle. Standing policy, effective now: for each `UNRESOLVED` batch
  the loop (1) traces the source itself (reverse-image / filename /
  asset-pack search) and records real terms when evidenced; (2) anything
  untraceable within reasonable effort is a RE-ART decision the loop
  makes — replace via the licensed trove or the generation pipeline and
  retire the untraceable asset. Truthful provenance stays mandatory (law
  + store policy). Drains through `/forge` art ticks; the
  provenance-completeness gate keeps printing the count until zero.
- category: content
- impact: 7
- ease: 9
- detail: filed 2026-08-27 by Phase 71, whose new provenance-completeness gate
  found it. Every raster directory under `axiomancer-mobile/assets/images/`
  EXCEPT `maps/` (the public-domain Dore plate) shipped with no license
  recorded: `cards/`, `enemies/`, `portraits/`, `treasure/`, `combat/`,
  `labyrinth/doors/`, `labyrinth/walls/`, plus the two root SVGs and the title
  art. All owner-supplied ("external-illustration", "Add doors and maze
  walls"), no source URL captured at the time, terms never established. Phase
  71 wrote `"license": "UNRESOLVED"` into each record with a note rather than
  inventing terms, and the gate prints the count on every run.
- why it matters now: this is the same question already open for `Potential
  Assets/MCP-Axiomancer/images/` (asset-conventions.md), except that art is
  merely staged while THIS art ships in the app. "Open source" spans CC0, CC
  BY, and share-alike; without the terms, attribution obligations cannot be
  met and a store submission cannot be answered honestly.
- next: T-level. For each batch, the origin answer (where did it come from) is
  what unblocks it — a source URL or generator name is usually enough to
  settle the terms. Anything that cannot be traced is a re-art decision, not a
  documentation one. Replacing `UNRESOLVED` with real terms in the
  `provenance.json` records is what closes this row.

