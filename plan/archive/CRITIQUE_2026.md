# Critique archive — 2026

> Append-only. `## Done` rows from `plan/CRITIQUE.md` older than 60 days,
> moved here verbatim by `/consolidate` (skills/consolidate.md §3.2).

## Archived 2026-09-23 (Done rows resolved before 2026-07-25)

### [x] [HIGH] suppurating-curse can never fire on poison or bleed (RESOLVED 2026-07-12, commit b097efec — row was stale, closed via issue #145)
- pass: owner-playtest 2026-07-12
- viewport: n/a (engine truth-probe + expo-web via Playwright)
- category: mechanics
- observation: suppurating-curse's only hook reads the round-clock
  tick pool (`dotTickBreakdown`), but poison fires on card-played and
  bleed fires on damage-instance — both event-triggered, not
  round-clock. The keyword can never observe either DoT ticking, so it
  is permanently inert against the two DoTs a player is most likely to
  pair it with.
- evidence: engine truth-probe against
  `require('axiomancer-mechanics/dist/index.js')` with a mocked
  poison/bleed-afflicted enemy — `dotTickBreakdown` never contains a
  poison or bleed entry; live expo-web combat confirms the same via
  Playwright drag-to-stage + `combat-apply-*`.
- source: playtester (owner-directed break-test session)
- RESOLVED: same-day commit `b097efec` ("Fixes from \"cleanup\"") already
  landed the fix under the WI-1 label — `combat.engine.ts` now accumulates
  real per-event DoT damage into `enemyDotDamageThisRound` (folded in
  `withLog`), and `processBetweenPhases` drips suppurating-curse off that
  accumulator plus any round-clock ticks. Verified 2026-07-21 (triage
  #145): `themed-decks.engine.test.ts` `describe('WI-1 — suppurating-curse
  doubles the round's REAL DoT total')` — 3/3 tests pass, including a live
  scenario that plays a poison card and confirms the curse exacts the same
  amount the card-played clock ticked. Pending row was stale; no code
  change needed.

### [x] [LOW] "the-closing-word" card face states a threshold that doesn't match the live floor (RESOLVED 2026-07-17, PR #91)
- pass: owner-playtest 2026-07-12
- viewport: mobile (expo-web via Playwright)
- category: content/copy
- observation: the-closing-word's card face says "CONCEDE at 8", but
  the live elite floor is 10 and the boss floor is 12 — the printed
  number is only correct against a non-elite, non-boss enemy.
- evidence: card-face aria-label captured during the Playwright
  session vs. the CONCEDE-gate constants for elite/boss floors.
- suggested fix: either make the face text stage-relative (e.g.
  "CONCEDE at the current floor") or print the correct per-stage
  numbers if the card's threshold is meant to scale with stage.
- source: playtester (owner-directed break-test session)
- RESOLVED: the authored paidSummary (PR #91) prints the per-stage
  truth — "At 8 PREMISES, CONCEDE — you win (elite 10, boss 12)" —
  the entry's option (b), enforced by the paid-summary honesty guard
  (the engine's elite/boss floor numbers must appear verbatim).

### [x] [HIGH] combat design — kill the "weak basic chip OR real status effect" fork (RESOLVED 2026-07-10, owner session)
- The parked 2026-07-09 design signal got its session: the 2026-07-10
  engagement-audit sitting ratified **Option A — constrain the fork**:
  every FREE line deposits theme currency; a weak-enough deposit may also
  carry a `DRAW 1`-class kicker; generic draw alone and all FREE damage
  banned (TICK killed registry-wide). Decisions of record:
  `plan/tuning/2026-07-10-engagement-overhaul-roadmap.md` §4; doctrine
  refined in `VISION.md`; spec 32 amendment block added; execution queued
  as EA-5 (70-card pass + FREE-currency lint) in `plan/PHASE_CANDIDATES.md`.
- source: user (ratified via owner Q&A, 2026-07-10)

### [x] [needs-user-call] Playwright MCP tools unavailable to sub-agents — RESOLVED via /oversight 2026-07-10 (switch transport)
- history: pass 1-4 hit the identical visible symptom via a different
  root cause — two allowlist gaps, not a Playwright bug: (1)
  `.github/workflows/_claude-skill.yml`'s `--allowedTools` CLI flag
  never included any `mcp__playwright__*` tool even when
  `install_playwright: true` installed the browser; (2)
  `.claude/settings.json.example` (activated as `.claude/settings.json`
  for every unattended CI run) had no `mcp__playwright__*` entries in
  `permissions.allow` either. Fixed at commit 525cd25d (2026-07-07):
  `--allowedTools` now appends the 14 `mcp__playwright__browser_*`
  tools whenever `install_playwright` is true, and
  `.claude/settings.json.example` grants the same 14 tools — also
  unblocking `deep-playtest`, `combat-ux-tuning`, `critic-loop`, and
  `hermes-playtest`, which share the same runner. Applied on explicit
  user request, not a self-grant.
- 8 consecutive occurrences (of 11 total passes, pass 5 through pass
  11) of the identical failure: `playtester`'s first
  `mcp__playwright__browser_*` tool call is rejected with "you
  haven't granted it yet", even when the calling session's own
  `.claude/settings.json` carries the full `mcp__playwright__browser_*`
  allowlist and the calling session itself can use those tools
  directly. Ruled out across passes: settings-file content, settings
  file git-tracked-vs-untracked status, dev-server reachability (all
  confirmed up via `curl -> 200` before every spawn). Standing
  diagnosis (unchanged since pass 6): the grant is session-scoped and
  does not propagate into Agent-tool sub-agent contexts — a
  structural gap, not a config problem. Zero product findings across
  all 8 occurrences.
- decision (via `/oversight` 2026-07-10): stop retrying the grant
  mechanism. Give `/critique` a headless, non-Agent-tool transport
  for unattended ticks instead — a standalone script driving the
  expo-web build directly as a subprocess, not an MCP-gated
  sub-agent. Interactive `playtester` usage elsewhere is unaffected;
  this only covers the unattended-loop path. Tracked as build-plan
  **Phase 34**; `skills/critique.md` gets a matching note once
  Phase 34 lands.
- source: `/oversight` 2026-07-10, synthesizing critique passes 1-11

## Archived 2026-09-25 (T4 plan compaction, trim spec Tier 2)

### Pass banners moved from the file header (in file order)

> **[critique pass 50, 2026-09-25, commit 6619fc10] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5,
> `CRITIQUE_VIEWPORT=both`), mobile (375×812) and desktop (1280×800),
> against the full 11-screen set (title, onboarding, combat preview,
> live combat-board, exploration hub, dialogue, village, cutscene,
> rest, hazard, late-game hub) — 22 captures, 0 nav trouble, 0
> console/page errors. Read every screenshot directly across both
> viewports. Confirmed the pass-48 HIGH (late-game hub node-graph blank
> on mobile) stays fixed: `sage-fv-boss-gate`'s hex grid — nine nodes,
> edges, backdrop — renders on both viewports now (RESOLVED 2026-09-24,
> commit 2dfcafeb). Previously-filed candidates reconfirmed unchanged
> and not re-filed: the village "Void Essence"/"Heart Draught" wearer
> wording (pass 41, still Pending), the dialogue reply-card label echo
> ("WHAT NEEDS DOING?"/"LEAVE HIM BE.", still Pending), the mobile and
> desktop combat-board's DoT paid-value chip mid-token wrap
> (`SPOILED POULTICE` → "8/p"/"ay", pass 49, still Pending) — desktop
> also shows `THE LONG LENT`'s "Deal 14" chip wrapping across two lines
> at the same card width; same component, same root cause (`paidValue`
> `Text` with no `maxWidth`/non-breaking join), not a new finding. Zero
> fresh findings this pass.

> **[critique pass 48, 2026-09-22, commit 87a8b6fc] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5,
> `CRITIQUE_VIEWPORT=both`), mobile (375×812) and desktop (1280×800),
> against the full 11-screen set (title, onboarding, combat preview,
> live combat-board, exploration hub, dialogue, village, cutscene,
> rest, hazard, late-game hub) — 22 captures, 0 nav trouble, 0
> console/page errors. Read every screenshot directly across both
> viewports. Previously-filed candidates reconfirmed unchanged and not
> re-filed: the mobile combat-board hand fan's truncated card names
> (Thin Hymn/Chilblain Watch/The Long Lent/Spoiled Poultice, pass 37),
> the hazard danger-card's small centered panel (deliberate per pass
> 34), the late-game hub's faint unlabeled desktop oval (declined per
> pass 34/39/40, still ambiguous). One new finding: the late-game hub's
> node-graph map (`sage-fv-boss-gate` fixture, "the Drowned Parish", 28
> nodes/20 sealed) renders its full hex grid on desktop but is
> completely blank on mobile (375×812) — no nodes, no edges, no
> backdrop art, just the "NODE GRAPH" label and legend text sitting
> over solid black. The DOM text confirms the data loaded ("28 nodes ·
> 20 sealed"); this reads as a render/camera-fit defect, not a data
> gap. Filed below as HIGH — the node graph is the map's core
> traversal affordance (§3's "Town / exploration hub" slot), unusable
> at the viewport width that matters most for a mobile-first game.

> **[critique pass 47, 2026-09-22, commit 413c59b8] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5,
> `CRITIQUE_VIEWPORT=both`), mobile (375×812) and desktop (1280×800),
> against the full 11-screen set (title, onboarding, combat preview,
> live combat-board, exploration hub, dialogue, village, cutscene,
> rest, hazard, late-game hub) — 22 captures, 0 nav trouble, 0
> console/page errors. The 12 commits since pass 46 (`66decb5e`) were
> content-data ledger passes only (adjust-equipment pass 16, adjust-
> cards pass 16, adjust-npcs pass 15, adjust-keywords pass 15 — all
> "zero-diff, ledger bump only") plus two telemetry-record commits and
> a merged UI-improvements PR (#352); `git diff --stat 66decb5e..HEAD
> -- axiomancer-mobile axiomancer-mechanics/src` returns empty, so
> none of these touch the 11 screens' rendered surface. Read every
> screenshot directly across both viewports (title, combat preview,
> live combat-board, dialogue, village, rest, hazard, late-game hub
> spot-checked pixel-for-pixel against pass 46's descriptions). All
> previously-filed candidates reconfirmed unchanged and not re-filed:
> the desktop combat-board's non-frontmost card stat-row clipping
> (`SPOILED POULTICE` → "POIS"/"8/p"+"ay", pass 44), the desktop
> hazard panel's sparse framing (pass 34/36, confirmed deliberate),
> the OMEN cutscene redirect on onboarding/exploration-hub (pass 41,
> still open in Pending, not re-filed here), and the village "Void
> Essence" wearer wording (pass 41, still Pending). Zero fresh
> findings this pass.

> **[critique pass 45, 2026-09-21, commit 9af1cb2d] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5,
> `CRITIQUE_VIEWPORT=both`), mobile (375×812) and desktop (1280×800),
> against the full 11-screen set (title, onboarding, combat preview,
> live combat-board, exploration hub, dialogue, village, cutscene,
> rest, hazard, late-game hub) — 22 captures, 0 nav trouble, 0
> console/page errors. Read every screenshot + domText directly
> across both viewports (title, combat-board, village, rest, hazard,
> dialogue, combat preview, late-game-hub — the full screen-type
> spread). Phase 104 ("the grey office and the keyword pull") shipped
> since the last pass; checked its deck-floor surface specifically —
> the rest screen's "THE CUT" still reads "the deck is at its floor of
> 10 cards" (was 12 pre-104) with the option correctly dimmed, same
> already-reviewed pattern as passes 36/37 (correctly-communicated
> disabled state, not a defect). All previously-dropped candidates
> reconfirmed unchanged and not re-filed: the desktop combat-board's
> non-frontmost card stat-row clipping (`SPOILED POULTICE` → "POIS"/
> "8/p"+"ay", pass 44), the desktop hazard panel's sparse framing
> (pass 34/36, confirmed deliberate), and the OMEN cutscene redirect
> on onboarding/exploration-hub (pass 41, still open in Pending, not
> re-filed here). Zero fresh findings this pass.

> **[critique pass 44, 2026-09-20, commit 3e879e15] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5,
> `CRITIQUE_VIEWPORT=both`), mobile (375×812) and desktop (1280×800),
> against the full 11-screen set (title, onboarding, combat preview,
> live combat-board, exploration hub, dialogue, village, cutscene,
> rest, hazard, late-game hub) — 22 captures, 0 nav trouble, 0
> console/page errors. Read every screenshot + domText directly, and
> cropped/zoomed the combat-board fan on both viewports with `sharp`
> to check text legibility past the manifest's error fields. The
> **[MED] Phase 97 hint gap** row (pass 42/43, closed as row 3.13 at
> commit `c23c2905` between passes) is now confirmed fixed live: the
> mobile fan (`04-combat-board.png`) shows "tap a card to read it"
> rendered above the hand *before* any card is staged, the exact gap
> the row named. Considered and dropped as not-a-finding: desktop's
> fan clips the stat-row (not just the name-row) on every
> non-frontmost card — e.g. `SPOILED POULTICE` reads "POIS"/"8/p" +
> "ay" — but this is the same overlap mechanism visible on all four
> covered cards uniformly (`GUAR`, `Dea`/`14`, `PLEA`/`+8` cut
> identically), the name band stays fully legible as pass 43 found,
> and the same "tap a card to read it" hint is present in desktop's
> domText — a preview/tap-to-inspect design, not a fresh clipping
> defect. The village "Void Essence" wearer wording (pass 41, still
> Pending) reproduces unchanged on both viewports. The hazard
> danger-card's small centered panel (fixtures rolled "The Famine
> March" mobile / "Ashfall Crossing" desktop) reconfirms pass 34's
> deliberate-style call, not filed. The late-game-hub map's faint
> unlabeled oval in the open-fog area (pass 36, dropped as
> grid-line anti-aliasing) still reproduces at the same position,
> still not worth filing without a source check. The OMEN cutscene
> redirect (onboarding, exploration-hub) holds clean at prior-pass
> baseline. Zero fresh findings this pass.

> **[critique pass 43, 2026-09-20, commit c3f8fa04] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5,
> `CRITIQUE_VIEWPORT=both`), mobile (375×812) and desktop (1280×800),
> against the full 11-screen set (title, onboarding, combat preview,
> live combat-board, exploration hub, dialogue, village, cutscene,
> rest, hazard, late-game hub) — 22 captures, 0 nav trouble, 0
> console/page errors, no undefined/NaN/`[object Object]` text
> artifacts in any DOM-text dump. Read every screenshot + domText
> directly. Self-assessed against the current Pending/Done log: the
> mobile hand-fan reproduces the open **[MED] Phase 97 hint gap** row
> (pass 42, commit bbd22a94) unchanged — `04-combat-board.png` still
> shows "CHILBLA IN...", "THE LONG...", "SPOILED POULT..." with no
> visible tap-to-read cue in the fan itself; desktop's fan still
> renders all five names in full, confirming the gap stays
> mobile-only. The village "Void Essence" wearer wording (pass 41,
> still Pending) reproduces unchanged. The hazard danger-card's
> flat-vector art (this pass's fixtures rolled "Flooded Undercroft"
> mobile / "The Creeping Rot" desktop) reconfirms pass 34's
> deliberate-style call, not filed. The OMEN cutscene redirect
> (onboarding, exploration-hub) holds clean at prior-pass baseline.
> Zero fresh findings this pass.

> **[critique pass 38, 2026-09-15, commit 24448fde] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at both
> mobile (375×812) and desktop (1280×800) against the full
> fixture-boosted screen set (title, onboarding, combat-encounter
> preview, live combat board, exploration hub, plus the six
> fixture-booted screens: dialogue, village, cutscene, rest, hazard,
> late-game hub — 11 screens × 2 viewports = 22 captures, all clean).
> Zero page errors, zero console errors. Read every screenshot +
> domText directly. The open **[MED] combat — the mobile hand fan
> overlaps card-name bands** row (filed pass 37, same commit 7d470de1)
> reconfirmed exactly as filed: mobile hand still reads "THIN HYM /
> CHILBLAI / THE LONG / SPOILED / CHILBLAIN WATCH", desktop still
> renders all five names in full — no regression, no fix yet, not
> re-filed (not bumping severity either; it's only one pass old and
> hasn't had an `/iterate` turn at it yet). Also checked the
> previously-declined desktop title-art-overlays-CTA cosmetic note
> (pass 13-14) — still true, still not worth filing per `plan/bearings.md`
> § Surface (desktop has no shipped surface). No other rows sighted.
> Zero fresh findings this pass.

> **[critique pass 37, 2026-09-14, commit 7d470de1] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5,
> `CRITIQUE_VIEWPORT=both`), mobile (375×812) and desktop (1280×800),
> against the full fixture-boosted screen set (title, onboarding,
> combat-encounter preview, live combat board, exploration hub, plus
> the six fixture-booted screens: dialogue, village, cutscene, rest,
> hazard, late-game hub — 11 screens × 2 viewports = 22 captures, all
> clean). Zero page errors, zero console errors. Read every screenshot
> + domText directly. Two new findings filed (below). One candidate
> dropped: the rest screen's "THE CUT" option renders visually dimmed
> at 0/5 shillings, but the row already carries its own explanation
> ("the deck is at its floor of 12 cards") — correctly-communicated
> disabled state, not a defect.

> **[critique pass 36, 2026-09-12, commit 894cad12] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5,
> `CRITIQUE_VIEWPORT=both`), mobile (375×812) and desktop (1280×800),
> against the full fixture-boosted screen set (title, onboarding,
> combat-encounter preview, live combat board, exploration hub, plus
> the six fixture-booted screens: dialogue, village, cutscene, rest,
> hazard, late-game hub — 11 screens × 2 viewports = 22 captures, all
> clean). Zero page errors; console errors limited to the same benign
> `navigator.vibrate` autoplay warning seen every prior pass. Read
> every screenshot + domText directly (not just the manifest's
> error/nav fields). Both standing closed rows reconfirmed holding at
> current source: the dialogue reply-card echo fix (RESOLVED
> commit 393354c6) — `apprentice-fv-interaction`'s domText shows
> "WHAT NEEDS DOING?"/"LEAVE HIM BE." each exactly once, not doubled —
> and the LOG-toggle/stance-check-telegraph overlap fix — the LOG pill
> sits clear of both "Punishes HEART ×1.5"/"Yields to BODY ×0.5 +1◆"
> lines on both viewports. Two candidates considered and dropped before
> filing: (1) the hazard danger-card's small centered panel on desktop
> (`l30-caverns-hazard-arrive`) reads sparse against the full-width
> layouts every other desktop screen uses (title/combat/dialogue/
> village/rest all expand to use the 1280px viewport) — but this is the
> exact panel pass 34 already read `HazardIntroOverlay.tsx`/
> `danger-art.tsx` for and confirmed deliberate (a "sealed,
> non-dismissible panel" over "pure silhouette work in the AXM
> palette"), not a layout defect; re-filing it would be re-litigating a
> closed call, not a new finding. (2) a faint unlabeled oval mark in the
> late-game-hub world map's open fog area (desktop, `sage-fv-boss-gate`)
> that doesn't match the map's own legend (trodden dot / open circle /
> shut X) — too low-confidence to file without a source check (most
> likely two of the map's own diagonal dashed grid-lines crossing at a
> shallow angle, an anti-aliasing read rather than a distinct element);
> noted here for whichever future pass has reason to look at the map
> component, not filed as Pending. No new findings filed.

> **[critique pass 35, 2026-09-09, commit b9b5da55] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5,
> `CRITIQUE_VIEWPORT=both`), mobile (375×812) and desktop (1280×800),
> against the full fixture-boosted screen set (title, onboarding,
> combat-encounter preview, live combat board, exploration hub, plus
> the six fixture-booted screens: dialogue, village, cutscene, rest,
> hazard, late-game hub — 11 screens × 2 viewports = 22 captures, all
> clean). Zero page errors; console errors limited to the same benign
> `navigator.vibrate` autoplay warning seen every prior pass.
> Zoomed-eyes check on the **LOG-toggle/stance-check-telegraph overlap**
> row (the running MED from passes 31-34): the LOG pill now sits clear
> of both telegraph lines ("Punishes HEART ×1.5" / "Yields to BODY
> ×0.5 +1◆") on both viewports — the `onLayout`-measured HUD anchor
> from commit 161bfcf3 holds; row already closed to Done above this
> entry. The open **[LOW] dialogue — reply cards echo their label**
> row reconfirmed unchanged at the `apprentice-fv-interaction` fixture
> ("WHAT NEEDS DOING?" and "LEAVE HIM BE." each still doubled). No new
> findings filed.

> **[critique pass 34, 2026-09-09, commit 457d5d16] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5,
> `CRITIQUE_VIEWPORT=both`), mobile (375×812) and desktop (1280×800),
> against the full fixture-boosted screen set (title, onboarding,
> combat-encounter preview, live combat board, exploration hub, plus
> the six fixture-booted screens: dialogue, village, cutscene, rest,
> hazard, late-game hub — 11 screens × 2 viewports = 22 captures, all
> clean). Zero page errors; console errors limited to the same benign
> `navigator.vibrate` autoplay warning seen every prior pass. The open
> **[MED] LOG-toggle/stance-check-telegraph overlap** row reconfirmed
> on mobile exactly as before (LOG pill over the "Punishes HEART ×1.5"
> line, same `COMBAT_HUD_HEIGHT` fixed-anchor cause); desktop at 1280
> did not clip this pass. The open **[LOW] dialogue — reply cards echo
> their label** row reconfirmed at the new `apprentice-fv-interaction`
> fixture, both viewports ("WHAT NEEDS DOING?" and "LEAVE HIM BE." each
> doubled). Also newly checked this pass: the hazard danger-card
> (`l30-caverns-hazard-arrive` fixture) — small centered panel on a
> dark scrim with a minimalist SVG silhouette vignette. Read
> `HazardIntroOverlay.tsx`/`danger-art.tsx` before flagging: both the
> modal framing and the silhouette art style are deliberate, documented
> choices (a "sealed, non-dismissible panel" over "pure silhouette work
> in the AXM palette"), not a placeholder or layout defect — no finding
> filed for it. No new findings filed.

> **[critique pass 33, 2026-09-07, commit f7c7aa50] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5,
> `CRITIQUE_VIEWPORT=both`), mobile (375×812) and desktop (1280×800),
> against the cold-enterable screen set (title, onboarding/deck-picker,
> combat-encounter preview, live combat board post-ENTER COMBAT,
> exploration hub). All 10 captures clean: zero page errors, console
> errors limited to the same benign `navigator.vibrate` autoplay
> warning seen every prior pass. Since pass 32 the tree only moved
> through content-lifecycle ticks (cards/equipment/enemies/keywords/npcs
> pass 2, a digest, and a dev-tools surface rebuild) plus one combat
> starter-deck fix — none touching the screens in this set — so every
> row was expected to reproduce identically, and did: the elite-tier
> first-fight pacing row (same 5-phase Brine Hag opener, both
> viewports), the art-register incoherence row, and the fixed "ruined
> city" backdrop row all reconfirmed unchanged. The open **[MED]
> LOG-toggle/stance-check-telegraph overlap** row also reconfirmed —
> mobile viewport this pass, the pill visibly sits over the "Punishes
> HEART ×1.5" line exactly as pass-32 last observed it (one line up
> from the pass-31 original clip point); still the same root cause
> (`COMBAT_HUD_HEIGHT` fixed anchor vs. unmeasured telegraph height).
> Not re-filed as new. No new findings filed.

> **[critique pass 32, 2026-09-06, commit a6d6679d] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5,
> `CRITIQUE_VIEWPORT=both`), mobile (375×812) and desktop (1280×800),
> against the cold-enterable screen set (title, onboarding/deck-picker,
> combat-encounter preview, live combat board post-ENTER COMBAT,
> exploration hub). All 10 captures clean: zero page errors, console
> errors limited to the same benign `navigator.vibrate` autoplay
> warning seen every prior pass. No content commits touched the
> screens in this window (only adjust-npcs + keywords content and
> ledger bookkeeping since pass 31), so every row was expected to
> reproduce identically — and did: the elite-tier first-fight pacing
> row (same Brine Hag 5-phase opener, both viewports), the art-register
> incoherence row, and the fixed "ruined city" backdrop row all
> reconfirmed unchanged. Zoomed pixel-crop re-verification of the
> **[MED] LOG-toggle/stance-check-telegraph overlap** row: still
> reproduces on both viewports, but the clipped line shifted — pass 31
> evidenced the pill's border cutting the tail of "Yields to BODY
> ×0.5 +1◆" (line 2); this pass shows the same pill border instead
> clipping the "5" in "Punishes HEART ×1.5" (line 1), one line up.
> Same root cause (`COMBAT_HUD_HEIGHT` fixed anchor vs. unmeasured
> telegraph height) and same suggested fix — not re-filed as new, but
> worth flagging for whoever ships the fix: the collision line isn't
> stable, so an `onLayout` measurement fix (not a one-line offset bump)
> is the only durable one. No new findings filed.

> **[critique pass 31, 2026-09-04, commit 7f6b4312] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5,
> `CRITIQUE_VIEWPORT=both`), mobile (375×812) and desktop (1280×800),
> against the cold-enterable screen set (title, onboarding/deck-picker,
> combat-encounter preview, live combat board post-ENTER COMBAT,
> exploration hub). All 10 captures clean: zero page errors, console
> errors limited to the same benign `navigator.vibrate` autoplay warning
> seen every prior pass. The exploration-hub OMEN cutscene redirect and
> Brine Hag threat-sequence preview text match prior-pass baselines
> verbatim; the open **[MED] first-fight elite-tier pacing** row
> (2026-09-04) reconfirmed live — same Brine Hag opener. One new finding:
> the same-day stance-check telegraph (commit 636f3040) collides with the
> same-day persistent LOG toggle on the live combat board — both
> right-aligned, the toggle's fixed `COMBAT_HUD_HEIGHT` anchor wasn't
> re-measured against the telegraph's added height, so the LOG pill
> visually clips the "Yields to..." line on desktop when a PLEA meter and
> full stance check both render (see Pending). Filed [MED], one row.

> **[critique pass 30, 2026-08-29, commit 32ba438b] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5), mobile
> (375×812) and desktop (1280×800) run separately, against the
> cold-enterable screen set (title, onboarding/deck-picker,
> combat-encounter preview, live combat board post-ENTER COMBAT,
> exploration hub). All 10 captures clean: zero console/page errors
> besides the same benign `navigator.vibrate` autoplay warning seen
> every prior pass. The **[MED] momentum chain empty-state contrast**
> row (pass 21) now reads fixed on both viewports — `○ no momentum`
> is legible against the arena floor art on mobile and now visibly
> renders on desktop too, consistent with the 2026-08-28 ui-cleanup
> pass RESOLVED entry in Done; no regression. The open **[MED] fixed
> "ruined city" arena backdrop** row (pass 23) reconfirmed unchanged —
> the Brine Hag encounter (a coastal/drowning-themed foe) still
> renders against the same purple ruined-city skyline on both
> viewports. Title wordmark (no crop on mobile; the pass-14
> art-overlays-CTA desktop quirk still holds, still not filed per
> that pass's dev-only-surface reasoning), onboarding tagline, Brine
> Hag threat-sequence preview text, and the OMEN cutscene redirect at
> the exploration-hub route all match prior-pass baselines verbatim.
> Also re-examined the mobile title screen's vertical gap between the
> square hero art and the CTA panel (flex-end layout, `TitleScreen.tsx`)
> — reproduces identically to every prior capture; pass 14 already
> characterized this exact layout as the clean baseline (in contrast
> to the desktop overlay defect), so not re-litigated as a new finding.
> No new findings filed — nothing observed outside the existing rows.

> **[critique pass 29, 2026-08-22, commit 0aab723d] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5), mobile
> (375×812) and desktop (1280×800) run separately, against the
> cold-enterable screen set (title, onboarding/deck-picker,
> combat-encounter preview, live combat board post-ENTER COMBAT,
> exploration hub). All 10 captures clean: zero console/page errors
> besides the same benign `navigator.vibrate` autoplay warning seen
> every prior pass. The open **[MED] momentum chain empty-state
> contrast** row (pass 21) reconfirmed live and unchanged on both
> viewports — mobile combat board shows `○ no momentum` barely legible
> against the arena floor art, desktop shows no visible placeholder
> text at all in the same spot — no regression, no new evidence, not
> re-filed. The open **[MED] fixed "ruined city" arena backdrop** row
> (pass 23) also reconfirmed unchanged — the Brine Hag encounter (a
> coastal/drowning-themed foe) still renders against the same
> purple ruined-city skyline on both viewports. Title wordmark (no
> crop), onboarding tagline/preset-picker copy, Brine Hag
> threat-sequence preview text, and the OMEN cutscene redirect at the
> exploration-hub route all match prior-pass baselines verbatim. No
> new findings filed.

> **[critique pass 28, 2026-08-19, commit 125904d7] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5,
> `CRITIQUE_VIEWPORT=both`) against the cold-enterable screen set
> (title, onboarding/deck-picker, combat-encounter preview, live
> combat board post-ENTER COMBAT, exploration hub) at both mobile
> (375×812) and desktop (1280×800). All 10 captures clean: zero
> console/page errors besides the same benign `navigator.vibrate`
> autoplay warning seen every prior pass. The open **[MED] momentum
> chain empty-state contrast** row (pass 21) reconfirmed live and
> unchanged on both viewports — mobile combat board shows a `no
> momentum`-class placeholder near-illegible under "NO STANCE" against
> the arena floor art, desktop shows no visible placeholder text at
> all in the same spot — no regression, no new evidence, not re-filed.
> Title tagline, preset-picker copy, Brine Hag threat-sequence preview,
> and the OMEN cutscene redirect all match prior-pass baselines
> verbatim. No new findings filed.

> **[critique pass 27, 2026-08-17, commit bf39b391] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at both
> mobile (375×812) and desktop (1280×800) against the cold-enterable
> screen set (title, onboarding/deck-picker, combat-encounter preview,
> live combat board post-ENTER COMBAT, exploration hub — the last of
> which redirects a cold session into the intro OMEN cutscene by
> design, per `critique-drive.mjs`'s own screen comment). All 10
> captures clean: zero console/page errors besides the same benign
> `navigator.vibrate` autoplay warning seen every prior pass. The open
> **[MED] momentum chain empty-state contrast** row (pass 21)
> reconfirmed live and unchanged on both viewports — mobile DOM shows
> `○ no momentum` present but barely legible, desktop shows the same
> text with zero visible pixels against the arena floor art — no
> regression, no new evidence, not re-filed. VITAE-vs-HP and DoT
> round-clock rows both continue to hold their prior resolved/reconfirmed
> state (icon-only `♥ 90/90` readout, no duration-phrased card faces in
> the visible hand). No new findings filed.

> **[critique pass 26, 2026-08-16, commit c4f8d42b] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at both
> mobile (375×812) and desktop (1280×800); the cold drive again
> reached past "ENTER COMBAT" into the live combat-board at both
> viewports (10/10 captures, 0 with nav trouble). Zero console/page
> errors besides the same benign `navigator.vibrate` warning seen
> every prior pass. Self-assessed all 10 captures against the current
> Pending/Done log: title (no crop), onboarding (preset picker), and
> the exploration-hub cutscene redirect all hold clean; the same
> Brine Hag encounter reproduces both still-open Pending rows exactly
> as filed at both viewports — the pass-23 "ruined city" arena-backdrop
> mismatch and the pass-21 momentum-chain empty-state contrast row
> (`○ no momentum` barely legible over the arena floor on mobile,
> fully invisible at desktop). Noted but not filed: the "tap" wording
> ("tap a glowing node to begin", "· tap ·") appears verbatim on the
> desktop viewport too — reads as a deliberate touch-agnostic voice
> choice consistent across every prior pass at this viewport, not a
> new defect. Not re-filed. Zero new findings.

> **[critique pass 25, 2026-08-15, commit 7b28b287] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at mobile
> (375×812) only; the cold drive again reached past "ENTER COMBAT"
> into the live combat-board (5/5 captures, 0 with nav trouble). Zero
> console/page errors besides the same benign `navigator.vibrate`
> warning seen every prior pass. Title screen still reads "Carry your
> ancient knowledge and cold iron into the LEAGUES beyond" (unchanged
> since pass 24). Self-assessed all 5 captures against the current
> Pending/Done log: onboarding (preset picker) and the exploration-hub
> cutscene redirect hold clean (same as passes 21/22/24 — deliberate
> paced narration beat, not a bug); the same Brine Hag encounter
> reproduces both still-open Pending rows exactly as filed — the
> pass-23 "ruined city" arena-backdrop mismatch and the pass-21
> momentum-chain empty-state contrast row (`○ no momentum` still bare
> `AXM.ash` text over the busy arena floor). Not re-filed. Zero new
> findings.

> **[critique pass 24, 2026-08-14, commit 127bbc93] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at mobile
> (375×812) only; the cold drive reached past "ENTER COMBAT" into the
> live combat-board (5/5 captures, 0 with nav trouble). Zero
> console/page errors besides the same benign `navigator.vibrate`
> warning seen every prior pass. Title screen confirms the "modern
> steel" → "cold iron" tagline fix (commit 0f408571, issue #204) is
> live: "Carry your ancient knowledge and cold iron into the LEAGUES
> beyond." Self-assessed all 5 captures against the current
> Pending/Done log: onboarding and the exploration-hub cutscene
> redirect hold clean; the same Brine Hag encounter reproduces both
> still-open Pending rows exactly as filed — the pass-23 "ruined city"
> arena-backdrop mismatch (nautical enemy text, cityscape art, no
> water/dock/coastal signifier) and the pass-21 momentum-chain
> empty-state contrast row (`○ no momentum` still bare `AXM.ash` text
> over the busy arena floor). Not re-filed. Checked the Threat
> Sequence's four phases all reading intent label "SURGES" (Brine
> Hag) against `deriveIntentType` (`combat.threat.ts:221`) — every
> phase pairs damage with a debuff by design (Mark / curse / Bleed),
> so `combo` is the correct derived intent, not a placeholder or
> repeat-label bug. Zero new findings.

> **[critique pass 22, 2026-08-10, commit 62cde36e] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at both
> mobile (375×812) and desktop (1280×800); the cold drive again
> reached past "ENTER COMBAT" into the live combat-board at both
> viewports (10/10 captures, 0 with nav trouble). Zero console/page
> errors besides the same benign `navigator.vibrate` warning seen
> every prior pass. This is the first pass since Phase 44e (enemies +
> threat sequences retheme, commit 865eb90a) — the pre-fight "A FOE
> BARS THE WAY" screen's four-phase Threat Sequence now prints the
> reworded Brine Hag flavor text end to end at both viewports, no
> truncation, no placeholder leftovers. Self-assessed all 10 captures
> against the current Pending/Done log: title, onboarding, and the
> exploration-hub cutscene redirect hold clean (same as pass 21); the
> pass-19/20 node-legend/`regionProgress` rows and the pass-21 momentum
> chain empty-state contrast row all reproduce exactly as filed (not
> re-filed — still open in Pending, unaddressed by `/iterate`). Zero
> new findings.

> **[critique pass 21, 2026-08-09, commit 75ba5a34] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at both
> mobile (375×812) and desktop (1280×800); the cold drive again
> reached past "ENTER COMBAT" into the live combat-board at both
> viewports (10/10 captures, 0 with nav trouble). Zero console/page
> errors besides the same benign `navigator.vibrate` warning seen
> every prior pass. Self-assessed all 10 captures against the current
> Pending/Done log: title, onboarding, exploration-hub cutscene
> redirect, and combat pre-fight copy hold clean; the pass-19/20
> node-legend/`regionProgress` rows still reproduce exactly as filed
> (not re-filed). One fresh finding: the momentum chain chip's empty
> state ("○ no momentum", `CombatBoard.tsx:627`) renders as bare
> `AXM.ash` text with no background chip, directly over the busy
> arena floor art — barely legible on mobile and fully invisible on
> desktop at the same combat state (T1, no stance played yet, the most
> common opening state of every fight). Filed below. Zero other
> findings.

> **[critique pass 20, 2026-08-08, commit dc1270ca] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at both
> mobile (375×812) and desktop (1280×800); the cold drive again
> reached past "ENTER COMBAT" into the live combat-board at both
> viewports (10/10 captures, 0 with nav trouble). Zero console/page
> errors besides the same benign `navigator.vibrate` warning seen
> every prior pass. Self-assessed all 10 captures against the current
> Pending/Done log: title, onboarding, and combat pre-fight copy hold
> clean; the pass-19 `regionProgress`/legend mismatch row still
> reproduces exactly as filed (not re-filed). One fresh finding: on the
> desktop viewport only, the exploration-hub node-legend's right-hand
> string collapses to a bare "25" (the "nodes · 22 sealed" suffix is
> clipped) — traced to a component-nesting bug, not a copy bug; filed
> below. Zero other findings.

> **[critique pass 19, 2026-08-08, commit 18eb0ddb] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at both
> mobile (375×812) and desktop (1280×800); the cold drive again
> reached past "ENTER COMBAT" into the live combat-board at both
> viewports (10/10 captures, 0 with nav trouble). Zero console/page
> errors besides the same benign `navigator.vibrate` warning seen
> every prior pass. Self-assessed all 10 captures against the current
> Pending/Done log: title, onboarding, and combat pre-fight copy hold
> clean; the hand-card 3-line clip on Festering Argument / Slippery
> Slope is the known [LOW] row, not a new finding. One fresh finding:
> the exploration hub's static `regionProgress` header count doesn't
> reconcile with the dynamic node-legend on the same screen — filed
> below. Zero other findings.

> **[critique pass 18, 2026-08-07, commit a0882f60] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at both
> mobile (375×812) and desktop (1280×800); the cold drive again
> reached past "ENTER COMBAT" into the live combat-board at both
> viewports (10/10 captures, 0 with nav trouble). Zero console/page
> errors besides the same benign `navigator.vibrate` warning seen
> every prior pass. Self-assessed all 10 captures against the current
> Pending/Done log: the title wordmark renders full and uncropped
> (RESOLVED 2026-07-22 holds), the header MORALE reads arabic "5 / 10"
> (RESOLVED 2026-07-18 holds), and the live hand's "Slippery Slope"
> card still prints the event-phrased "Inflict POISON 1 (ticks each
> card you play; 4 turns)." — the pass-16 fix (commit d320ee12) holds,
> no round-clock regression. Zero fresh findings this pass.

> **[critique pass 17, 2026-08-05, commit 2458d51e] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at both
> mobile (375×812) and desktop (1280×800); the cold drive again
> reached past "ENTER COMBAT" into the live combat-board at both
> viewports. Zero console/page errors besides the same benign
> `navigator.vibrate` warning seen every prior pass, zero nav errors.
> Self-assessed all 10 captures (title, onboarding, combat preview,
> live combat-board, exploration hub × 2 viewports) against the
> current Pending/Done log: the fanned mobile hand's obscured card
> body text is the known tap-to-open-detail-modal design (Phase 22,
> taught by the combat tutorial), the wide-margin desktop layout is
> the documented dev/e2e-only surface (not a shipping target per
> `plan/bearings.md` § Surface), and the "Slippery Slope" PAID line
> ("Inflict POISON 1 (ticks each card you play; 4 turns).") is the
> pass-16 finding's own fix (commit d320ee12, now guard-tested by
> `card-face-honesty.guard.test.ts`'s WI-2 extension), not a
> regression. Zero fresh findings this pass.

> **[critique pass 16, 2026-08-05, commit 63574686] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at both
> mobile (375×812) and desktop (1280×800); the cold drive again
> reached past "ENTER COMBAT" into the live combat-board at both
> viewports. Zero console/page errors besides the same benign
> `navigator.vibrate` warning seen every prior pass. One new finding
> filed (below): the pass-15 note flagged "Inflict POISON 1 for 4
> turns." on the live hand and asked `/iterate` to settle whether that
> row was genuinely fixed by Phase 32 — it was then closed 2026-08-04
> as "RESOLVED — stale, already fixed by WI-2" (commit 0e69be8b, issue
> #168). This pass re-read the WI-2 fix and its guard test against the
> actual render path and found the closure incomplete: WI-2 only
> covers cards whose face text is auto-generated
> (`faceStats`'s `dot` case); a card with an authored `paidSummary`
> (`combat.cards.ts:389`) bypasses that path entirely and prints its
> raw authored string verbatim — which is exactly what the "Slippery
> Slope" card visible on this pass's board does. Filed as a fresh
> Pending row (not a re-open of the closed one, since the closed row's
> narrow claim — the auto-generated path is fixed — still holds) with
> the specific 7-card list and code-level citations so `/iterate` can
> act without re-deriving this.

> **[critique pass 15, 2026-08-04, commit db84dfc0] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at both
> mobile (375×812) and desktop (1280×800). **Methodology note:** this
> run's cold drive reached past "ENTER COMBAT" into the live
> combat-board (card hand, dice tray, stance state) at both viewports —
> the pass-13/14 note that "a cold drive still can't pass ENTER COMBAT"
> no longer holds; a future pass can use this to settle the
> unverified in-combat rows directly instead of waiting on an
> interactive pass. Using that new reach this pass: the VITAE-vs-HP
> row (RESOLVED 2026-07-22) still holds with no regression — the live
> board's health readouts are icon-only (♥ + number), no "HP" or
> "VITAE" text rendered anywhere to regress. The open **[MED] DoT card
> faces print round-clock math** row (2026-07-12) is reconfirmed
> live: the visible hand showed "Inflict POISON 1 for 4 turns." and
> "PROLONG every DoT on the enemy by 1 turn." — still duration-phrased
> card faces, unchanged since filing. Flagging for `/iterate`: that
> row's suggested fix says "fold into Phase 32's DoT-clock work," and
> Phase 32 is now `[x]` shipped in the build plan — worth checking
> whether the row is actually stale-resolved-by-Phase-32 or genuinely
> still open before it scores again. Zero console/page errors besides
> the same benign `navigator.vibrate` warning seen every prior pass.
> No new findings filed — nothing observed outside the existing rows.

> **[critique pass 14, 2026-07-31, commit 9a445281] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at both
> mobile (375×812) and desktop (1280×800) against the cold-enterable
> screen set (title, onboarding/deck-picker, combat-encounter preview,
> exploration hub). Zero console/page errors besides one benign
> `navigator.vibrate` autoplay-policy warning on the combat preview
> (an artifact of the headless driver never having received a user
> gesture — not reproducible by a real player, not filed). Both
> pass-13-reconfirmed HIGHs still hold fixed: MORALE renders arabic
> "5 / 10" (not "v of x"), and the mobile title wordmark is fully
> visible (no crop). One new finding below (exploration-hub level
> subtitle). Also noticed, but declined to file: at the 1280×800
> desktop viewport the title screen's art image (`aspectRatio: 1`,
> full-width) overlays the CTA directly instead of sitting in its own
> panel above it (as it cleanly does on mobile) — per
> `plan/bearings.md` § Surface the web build is dev/e2e/playtesting-only
> with no shipped desktop surface, so this has no real player impact;
> noting here rather than filing so it isn't silently dropped if that
> assumption ever changes. Still at the pass-13 plateau otherwise: an
> **interactive** `/critique` (playtester + Playwright MCP reaching
> live card-play) remains the next productive step for the unverified
> in-combat rows (VITAE-vs-HP copy, DoT round-clock math, tuning-harness
> starvation, doctrine-curve rebaseline) — a cold drive still can't
> pass "ENTER COMBAT".

> **[critique pass 39, 2026-09-17, commit 38d7711f] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at both
> mobile (375×812) and desktop (1280×800) against the full 11-screen
> set (title, onboarding, combat preview, live combat-board, exploration
> hub, dialogue, village, cutscene, rest, hazard, late-game hub) — 22
> captures, 0 with nav trouble, 0 console/page errors, no
> undefined/NaN/`[object Object]` text artifacts in any DOM-text dump.
> Self-assessed against the current Pending/Done log: the mobile
> combat-board hand fan reproduces exactly as the pass-37 row already
> describes (Thin Hymn/Chilblain Watch/The Long Lent/Spoiled Poultice
> truncated by overlap, desktop unaffected) — not re-filed. Noticed but
> declined to file: the late-game hub's node-graph map (desktop
> viewport) shows a faint hand-drawn oval sitting off the node grid
> with no connecting path; too easily read as intentional set-dressing
> (the eye/omen motif recurs on the title screen and the WILDS tab
> icon) to file as a defect without stronger evidence. Zero new
> findings.

> **[critique pass 40, 2026-09-18, commit 3a9689d8] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at both
> mobile (375×812) and desktop (1280×800) against the full 11-screen
> set (title, onboarding, combat preview, live combat-board, exploration
> hub, dialogue, village, cutscene, rest, hazard, late-game hub) — 22
> captures, 0 with nav trouble, 0 console/page errors, no
> undefined/NaN/`[object Object]` text artifacts in any DOM-text dump.
> Self-assessed against the current Pending/Done log: captures are
> unchanged from pass 39 — the mobile combat-board hand fan still
> reproduces the pass-37 row exactly (Thin Hymn/Chilblain Watch/The
> Long Lent/Spoiled Poultice truncated by overlap, desktop unaffected;
> not re-filed), the late-game hub's node-graph oval reproduces pass
> 39's declined note unchanged (still no connecting path, still reads
> as ambiguous set-dressing, no stronger evidence to file it now), and
> the pass-14 desktop title-art-overlays-CTA note also reproduces
> unchanged (still declined — no shipped desktop surface). None of the
> 30 commits since pass 39 touched a captured screen's UI. Zero new
> findings.

> **[critique pass 41, 2026-09-18, commit 6a804a02] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5,
> `CRITIQUE_VIEWPORT=both`) at both mobile (375×812) and desktop
> (1280×800) against the full 11-screen set (title, onboarding, combat
> preview, live combat-board, exploration hub, dialogue, village,
> cutscene, rest, hazard, late-game hub) — 22 captures, 0 with nav
> trouble, 0 console/page errors, no undefined/NaN/`[object Object]`
> text artifacts in any DOM-text dump. Self-assessed against the
> current Pending/Done log: the mobile combat-board hand fan reproduces
> the pass-37 row exactly (desktop unaffected, not re-filed); the
> late-game hub's node-graph oval reproduces pass 39/40's declined note
> unchanged; the hazard danger-card's sealed small panel (this pass's
> fixture rolled "Flooded Undercroft") reconfirms pass 34's deliberate-
> style call, not filed. One new finding: the village stall's "Void
> Essence" description says "drinking it leaves the wearer..." —
> equipment language ("wearer") on a consumable that's drunk, not worn.
> Checked the rest of `consumable.library.ts` for the same slip:
> `heart-draught` carries the identical "wearer" wording
> ("quickens the wearer's convictions"); no other consumable does. Filed
> below.

> **[critique pass 42, 2026-09-19, commit bbd22a94] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5,
> `CRITIQUE_VIEWPORT=both`) at both mobile (375×812) and desktop
> (1280×800) against the full 11-screen set (title, onboarding, combat
> preview, live combat-board, exploration hub, dialogue, village,
> cutscene, rest, hazard, late-game hub) — 22 captures, 0 with nav
> trouble, 0 console/page errors, no undefined/NaN/`[object Object]`
> text artifacts in any DOM-text dump. Self-assessed against the
> current Pending/Done log: the OMEN cutscene redirect (onboarding,
> exploration-hub) holds clean at prior-pass baseline; the hazard
> danger-card's flat-vector art (this pass's fixtures rolled "Flooded
> Undercroft" mobile / "The Famine March" desktop) reconfirms pass 34's
> deliberate-style call, not filed; the village "Void Essence" wearer
> wording (pass 41, still Pending) reproduces unchanged, not re-filed.
> One new finding: Phase 97 (commit cecae8f, resolving the mobile
> hand-fan occlusion row) shipped a visible "tap a card to read it"
> hint for the exact truncation this pass still shows (`04-combat-board.png`:
> "CHILBLA IN...", "THE LONG...", "SPOILED POULT..." — confirmed
> against `04-combat-board.txt`'s untruncated "Chilblain Watch"/"The
> Long Lent"/"Spoiled Poultice") — but the hint only renders once a
> card is already staged (`CombatBoard.tsx:1546`, gated on
> `stagedCards.length > 0`), never for the hand fan itself where the
> truncation lives and where a player would need it to choose which
> covered card to play. Filed below.

### Pass and residue banners moved from `## Pending`

> **[owner session, 2026-07-18 — THE FLIP residue] Upgradeable Dice is now ON
> for every app build** (owner call, overriding D7's stays-OFF default): the
> app root (`axiomancer-mobile/state/combat/flags.ts`) forces the spec-33
> model on all surfaces; only the explicit `EXPO_PUBLIC_UPGRADEABLE_DICE=0` /
> `__AXM_UPGRADEABLE_DICE__='0'` kill-switch keeps the legacy model. THE
> STAKE's wager UI is retired on every surface (completing spec 33 §5).
> Follow-ups this creates:
> - **F3 DRAINED same day (owner call)**: the Gambler's Knot is now
>   default-worn (Venom Sigil benched), so every starter loadout — main game
>   included — carries Press Fate beside Disarming Plea (Befriend) and
>   Overwhelming Argument. Re-measured at seeds 1-8: 0.060 casts/round,
>   income 1.533◆ (in band), stake-gap narrowed +13.6%→+11.5%. The economy
>   canaries now pin the sink STAYING live. Remaining: the combat-sandbox
>   e2e route still equips no relics, so the Press Fate control is only
>   witnessable in the main game (e2e NOTE stands).
> - **D7's not-ready verdict now describes the shipped game**: early win
>   61-66 vs the ~80 band, statusEngagement −9pts. The tuning debt (D3/D4
>   sinks, signature repricing) is no longer flag-gated homework.
> - **Engine stake plumbing** (`placeStake`/`settleStake`, `stake-won/lost`
>   events, `CombatEncounterState.stake`) is now UI-orphaned on every surface —
>   remove mechanics-side per spec 33 §5 "removed, not rewired".
> - **Mechanics default stays OFF** (tests/sims toggle per-suite) — the
>   app/engine defaults now disagree by design; revisit at the true D-series
>   close-out.

> **[iterate residue, 2026-07-18, after the D-series march loop] Open-HIGH
> triage — no cheap autonomous win remains; next productive critique is
> INTERACTIVE, not another cold drive.** The hourly `/march` loop that shipped
> the whole spec-33 D-series drained four HIGHs as already-fixed-by-shipped-work
> (D7-blocker→fix, MORALE→#117, END-phase→WI-3, momentum-wild-die→Phase 31); the
> queue was pass-12/13 and predates the D-series + phases 31/32, so carried-forward
> rows kept resolving stale on inspection. The **6 remaining open HIGHs** split
> into three buckets, none a clean loop win:
> - **owner/design-judgment** — title wordmark crop (baked-art reflow, visual-design
>   call; pass-13 reconfirmed it's still live) · combat tutorial drag-to-play gesture (UX).
> - **phase-coupled / expensive** — suppurating-curse-on-poison/bleed (Phase-32
>   substrate) · late-stage global collapse (expensive balance, D7-confirmed pre-existing).
> - **unverified — need an IN-COMBAT capture** — tuning-harness policy-pick starves
>   sandbox cards · phase-31/32 doctrine-curve rebaseline. The cold-enterable
>   `critique:drive` stops at the pre-fight preview, so these can't be settled by
>   another cold pass.
> Next productive critique action = an **interactive `/critique`** (playtester +
> Playwright MCP reaching card-hand + staged play), not a cold drive; the loop
> reached its plateau on this queue.

> **[critique pass 13, 2026-07-17, commit b4870384] Re-baseline ran.**
> Used the unattended `critique:drive` transport (§3.5) against the
> cold-enterable screen set (title, onboarding/deck-picker,
> combat-encounter preview, exploration hub) at mobile viewport.
> Directly reconfirmed two of the STALE-flagged rows are still live
> post-SIDE-RAIL: the header **MORALE "v of x"** placeholder (still
> renders literally on the exploration-hub capture) and the **title
> wordmark crop** (still bleeds off the top edge — "xiomance..." only).
> Both stand as-is below, no longer unverified.
>
> The remaining STALE-flagged rows — VITAE-vs-HP copy and DoT
> round-clock card-face math — need a **live in-combat** capture (card
> hand + staged play) to confirm or drop; the cold-enterable screen set
> stops at the pre-fight preview ("ENTER COMBAT" not yet pressed), so
> this pass could not reach them. They stand as unverified-but-not-
> disproven; a future interactive `/critique` (playtester + Playwright
> MCP) or a deep-playtest pass should settle them. The card-editor
> mechanic-fields gap is a desktop-tool row, out of reach of the mobile
> web-viewport drive — also stands as unverified.
>
> "the-closing-word" threshold is already `[x]` RESOLVED below (PR
> #91) — drop from the stale set.
>
> Zero new findings filed this pass (nothing observed outside the
> existing rows).

### Done rows resolved before 2026-07-27

### [x] [MED] persistent header VITAE bar doesn't update during combat (RESOLVED 2026-07-23, commit 20af943f, issue #152)
- pass: 12 (commit 3dc27d24)
- viewport: mobile
- category: inconsistency
- observation: the always-visible header's player VITAE bar stays
  frozen at "80/80" through an entire combat, while the in-combat HUD
  correctly shows VITAE dropping (71 -> 59 -> 35 -> 7 -> 0) as the
  fight progresses.
- evidence: accessibility snapshots at multiple combat states show
  header progressbar "VITAE: 80 out of 80, 100 percent" alongside the
  in-combat element reading "Player, VITAE 0 of 80."
- suggested fix: bind the persistent header VITAE bar to the same live
  combat state store the in-combat HUD reads from.
- resolution: no shared store exists to bind to (`CombatEncounterPanel`
  keeps engine state in local React state) — instead the exploration
  screen stops rendering the out-of-combat header while the encounter
  modal is showing, since that modal already renders full-screen over
  the map by design. `axiomancer-mobile/app/(tabs)/exploration/index.tsx`.
- source: playtester (critique pass 12)
- issue: #152

### [x] [HIGH] phase 31-32's effect on the doctrine curve is unmeasured (RESOLVED 2026-07-23 — framing stale, issue #150)
- pass: session 2026-07-17 (card-text + measurement-freshness work,
  branch claude/card-text-paid-effects-3cd590, PRs #91/#92)
- viewport: n/a
- category: measurement
- resolution: RESOLVED-BY-CLARIFICATION, not by code change. The
  "unmeasured" premise no longer holds: `/digest`'s reduced-nightly
  baseline regens have re-measured the doctrine curve repeatedly since
  this row was filed — 2026-07-18 at `31f62c1e` (mid 7.3%, late 0%),
  2026-07-20 at `345cb0a6` (mid 35.3%, late 0%), 2026-07-21 at
  `c0562bb3` (mid 22.9% — the 07-18→07-20 climb reversed, late still
  0%) — all logged in `plan/AUDIT.md` "Doctrine-curve confirmation"
  rows. The pass-13 annotation above bucketed this as needing an
  in-combat capture critique's cold `critique:drive` can't reach, but
  the digest's sim-harness measurement path is independent of that
  limitation and has been supplying the read all along. The doctrine
  violation itself STANDS (late-stage flat 0% across four
  measurements now; mid-stage newly regressing) — its owner is the
  separate `[HIGH] late-stage global collapse` row below and the
  standing "Post-D8 flag-on curve repair" candidate in
  `plan/PHASE_CANDIDATES.md`, not this row. Queue was overstating open
  HIGH bugs by double-counting the same doctrine failure under two
  rows; corrected.
- observation (as filed): the checked-in deck-matrix baseline is
  stamped 2026-07-12 and `npm run baseline:check` reports it stale by
  33 mechanics-source commits — including keep-hand,
  REAP-attacks-max-HP, charm resolve milestones, Oratory milestone
  drip, TURNABOUT, OMEN v2, and OVERHEAT, the changes aimed at the
  very findings the baseline records (mid badly under ~50%, late 0.00
  for all ten presets). The fixes shipped; the validation did not.
- evidence: `npm run baseline:check` output at a99d0f64;
  `plan/tuning/2026-07-11-honest-rebaseline-and-evidence.md` §1.

### [x] [MED] four reward-pool spells still print generated telegraphese (RESOLVED 2026-07-23 — stale, all four ids retired)
- RESOLVED 2026-07-23 (iterate tick). All four named cards —
  straw-mans-jab, memento-mori, heart-of-the-matter, ad-nauseam — were
  retired from the live library in Phase D8 (`plan/tuning/2026-07-18-d8-preset-dice-valves.md`
  "Out (retired)" ledger), one day after this row was filed. None exist
  in `axiomancer-mechanics/src/Cards/cards.library.ts` (the current
  card-definition file) or anywhere else as live card objects — only in
  comments/tests documenting the retirement. There is nothing left to
  author `paidSummary` prose for. The underlying pattern this row
  pointed at (draft/reward cards missing authored paid text) may still
  be real for other live cards — of the library's 79 current ids, ~33
  still lack `paidSummary` — but that's a fresh finding against
  different cards, not this one. Queue was tracking dead card ids;
  corrected.
- pass: session 2026-07-17 (card-text work, PRs #91/#92)
- viewport: n/a
- category: content/copy
- observation: all 46 preset-seated spells now carry authored
  `paidSummary` prose, but the four reward/draft-only spells —
  straw-mans-jab, memento-mori, heart-of-the-matter, ad-nauseam —
  still render the generated "i2 d3"-style paid text, so a drafted
  reward card reads worse than every starter card next to it.
- evidence: `cards.library.ts` spells lacking `paidSummary`
  (grep); the paid-summary honesty guard covers them the moment
  text is added.
- suggested fix: author the four summaries through the same
  pipeline (payload dump via
  `axiomancer-mechanics/scripts/dump-paid-context.ts`, honesty guard,
  adversarial check). NOTE: heart-of-the-matter's wording is pinned
  by `grace-card-wording.engine.test.ts` — update its pins in the
  same commit.

### [x] [HIGH] title screen — wordmark cropped above the mobile fold (RESOLVED 2026-07-22, commit 0725b9cc)
- issue: #148
- pass: 12 (commit 3dc27d24)
- viewport: mobile
- category: visual
- observation: on the title screen at 414x896, the game's wordmark
  bleeds off the top of the screen — only "xiomance..." is visible, the
  leading "A" and trailing letters cut off above the fold. No full
  title text is visible on load.
- evidence: title-screen screenshot shows the stained-glass artwork
  with "xiomance" cropped at the top edge; no scroll reveals the rest.
- suggested fix: reflow or rescale the title art/wordmark so the full
  name fits inside the mobile viewport without requiring scroll.
- source: playtester (critique pass 12)
- resolution: root cause was the 1024x1024 square key art rendered
  with `contentFit="cover"` on a narrow/tall viewport — covering the
  full screen height scales the square up and crops ~27% off each
  side, taking the wordmark's leading "A" and trailing "R" with it.
  `TitleScreen.tsx`'s art image now uses `contentFit="contain"` pinned
  to the top edge at full width (`aspectRatio: 1`), so the whole
  square — wordmark included — is always fully visible; verified at
  414x896 via the expo-web dev server.

### [x] [HIGH] combat tutorial never teaches the drag-to-play gesture (RESOLVED 2026-07-22, commit 6f138c27)
- issue: #147
- pass: 12 (commit 3dc27d24)
- viewport: mobile
- category: comprehension
- observation: the only way to play a card in combat is a drag from
  hand to a staging zone; a plain tap only opens a read-only
  card-detail modal. The 3-page "FIRST FIGHT" tutorial never mentions
  the drag gesture — it only says tapping a card shows its keywords.
  A first-time player tapping cards (the only affordance taught) would
  plausibly never discover how to actually play one.
- evidence: tutorial page 3/3 verbatim: "...Tap any card to read its
  keywords and full effect." No drag instruction anywhere; the
  "APPLY · FREE" staged state required a synthetic drag sequence to
  find.
- suggested fix: add an explicit tutorial step demonstrating the
  drag-to-stage/APPLY gesture, and/or a visible "drag to play"
  affordance on card faces.
- source: playtester (critique pass 12)
- resolution: `CombatTutorialPrimer.tsx`'s DICE & CARDS page (page
  3/3) now says "Drag a card up into the PLAY AREA to play it; tap
  one first to read its keywords and full effect." — matching the
  wording already used by the in-combat coach's 'spend' step
  (`combat-tutorial-steps.ts`), which taught the gesture but only
  after the primer had already sent the player off with tap-only
  instructions. The larger suggested "visible drag affordance on
  card faces" remains open as a follow-up, not required to close
  this finding.

### [x] [MED] card/tooltip copy still says "HP" instead of canon VITAE (RESOLVED 2026-07-22, commit 21c55b94)
- issue: #146
- pass: 12 (commit 3dc27d24)
- viewport: mobile
- category: voice
- observation: canon term VITAE is used inconsistently against "HP"
  within the same screens — the pre-fight card mixes "hp.", "HP", and
  "vitae" for one stat; in live combat, card copy and the BLEED
  keyword tooltip both say "HP" instead of VITAE, contradicting the
  tutorial text ("The enemy has ONE bar: VITAE") shown moments before.
- evidence: quoted "level 2 · 50 hp."; "Lv 2 foe · 50 HP"; combat card
  aria-label "Slippery Slope, body card. foe loses HP each turn.";
  BLEED tooltip "Deals 3 HP per stack at the END of each round...".
- suggested fix: replace remaining "HP"/"hp" occurrences in encounter
  and card copy with VITAE per bearings' copy canon.
- source: playtester (critique pass 12)
- resolution: the two evidence quotes for the combat-card aria-label
  and BLEED tooltip were already fixed by unrelated prior work
  (verified live 2026-07-22 — no longer reproducible). The remaining
  two live occurrences (`event.engine.ts` pre-fight prelude `decode`
  and `body` strings) were the actual fix — both now read VITAE/vitae,
  matching the same function's own `fightSubtitle`.

### [x] [MED] general — used dice have no spent-state visual indicator (grey them out) — ROUTED to Phase 38 via /oversight 2026-07-20
- pass: user-jot (commit 42ec22b0526a3922a6cfccab16663984eb249a2f)
- viewport: unspecified
- auth_state: anonymous
- category: visual
- observation: The dice, after they're used don't have a visual indicator that they're used. I would like for any used dice to become greyed out after usage
- evidence: user-spotted at 2026-07-20T14:03:53Z
- resolution: folded into Phase 38 (central juice/animation layer) as an in-scope combat-first legibility primitive (spent-die greying). Do NOT drain via /iterate — it ships with Phase 38. See plan/phases/phase_38_juice_layer.md.
- source: user

### [x] [HIGH] D7-BLOCKER — flag-on paid plays don't commit through the mobile UI (RESOLVED 2026-07-18)

**RESOLVED 2026-07-18.** Root cause (deeper than first classified but same
lane): `handleApply` resolved correctly, but `onApply → resolveApplyRouting`
(`state/presenters/combat-encounter.engine.ts`) was draft-model-shaped — a fresh
tray die (not reserve/floating/fate-X) returned `{draftFirst:true,
explicitDieId:undefined}`; then `draftStanceDie` is a flag-on no-op, so
`playCombatCard` got NO die and the flag-on engine fizzled ("choose a die"),
bouncing the card (the "die spent" was only the drop's UI dim). Fix: a flag-on
early return in `resolveApplyRouting` forwards every dropped die as the explicit
`dieId` (`draftFirst:false`). Regression guards: a deterministic unit test
(`floating-die-apply.engine.test.ts` — flag-on tray-die routes explicit + Soft
Word commits SWAY>0, both fail pre-fix) + the D6d e2e `assertSwayCommit` (SWAY
0→4, card leaves hand). Stale flag-on STAKE affordance hidden in the same fix.
Mobile verify green (2624). `fix(mobile): flag-on paid-play UI commit + STAKE
hide`.

Surfaced by the D6d flag-on e2e (2026-07-18). Powering a card with a legal
die and pressing APPLY under the spec-33 flag **spends the die but the play
never commits** — the effect doesn't apply and the card bounces back to hand
(observed on Soft Word / SWAY: die consumed, SWAY meter stays 0/31).

**Classified (do NOT re-litigate the engine):** the ENGINE is correct flag-on.
A hermetic probe (`playCombatCard(state, {uid}, true, heartDieId)`, flag-on)
plays Soft Word paid via a heart mana die → `card-played:1, fizzled:0,
sway 0→4, die spent, left hand`. So the bug is **mobile-side**, in
`axiomancer-mobile/components/combat/encounter/CombatBoard.tsx` — the
`handleApply` / `assignedDieFor` / `comboTargetUid` commit path is built around
the retired DRAFT model (`draftedDie = vm.dice.find(d => d.drafted)`, the combo
refresh) which does not exist flag-on (no draft; four independent fixed dice).
D6a extended the drop-based `pendingDieByUid` path for display/arming, but the
COMMIT still routes through draft-model logic that mishandles the flag-on
no-draft multi-die case (likely calling `onApply` with a wrong/absent `dieId`
or `power`, so the engine fizzles-then-drains-free while the die still reads
spent).

**Why HIGH but not live:** the flag is OFF in production, so no user hits this
— but it is a hard **D7 blocker**: D7 recommends the flag-flip, and a broken
flag-on paid-play UI cannot ship. Fix before D7. Repro is cheap: the D6d e2e
harness + a "successful paid SWAY commit" assertion (which the e2e currently
lacks — add it as the regression guard). Also seen in the same screenshot: a
stale STAKE affordance renders flag-on though STAKE was retired in D2 §5 —
fold that cleanup into the same fix.

**Root-cause pinpoint (independent confirmation, D6d parallel run, 2026-07-18):**
narrowed past "likely calling `onApply` with a wrong/absent `dieId` or
`power`" above to the exact mechanism. `resolveApplyRouting`
(`axiomancer-mobile/state/presenters/combat-encounter.engine.ts:1938-1949`)
computes `draftFirst: !!dieId && !explicit && state.draftedDieId === null`
with NO `isUpgradeableDiceEnabled()` gate (every sibling VM function in the
same file gates on the flag; this one doesn't). For an ordinary tray die (not
Reserve/floating/fate-X — every rolled die under the flag-on four-fixed-dice
model) this evaluates `draftFirst = true`, so `CombatEncounterPanel.onApply`
(`components/combat/encounter/CombatEncounterPanel.tsx:464-474`) calls
`draftStanceDie(ns, dieId, ...)` before `playCombatCard`. But `draftStanceDie`
(`axiomancer-mechanics/src/Combat/combat.engine.ts:715-717`) is an explicit
no-op under the flag ("the draft is retired under the flag ... if
(isUpgradeableDiceEnabled()) return { state, events: [] }"), so
`state.draftedDieId` stays `null` forever and `routing.explicitDieId`
resolves to `undefined` — `playCombatCard` is called with NO die id at all.
Since the one function that would set `draftedDieId` always no-ops under the
flag, this is permanent for the life of the combat, not an edge case. Suggested
fix: gate `resolveApplyRouting`'s `draftFirst` on `!isUpgradeableDiceEnabled()`
(flag-on: every non-Reserve/floating/fate-X tray die should also resolve
`explicit = true` and pass straight through as `explicitDieId`, mirroring how
Reserve/floating dice already route) — this one function is the fix, not
`CombatBoard.tsx`'s `handleApply` (which already computes the right
`dieId`/`power` and hands them to `onApply` correctly; the miscount happens
one level down, in the routing helper `onApply` calls next).

### [x] [HIGH] persistent header — MORALE meter renders literal "v of x" placeholder (RESOLVED 2026-07-18)
- RESOLVED 2026-07-18 (issue #117, `fix(mobile): MORALE header renders arabic value` 270e5f93). Not a literal placeholder — the value was roman ("v of x" = 5 of 10), which read as unresolved template vars and clashed with VITAE (same card) + the POOLS panel (both arabic). Switched the header to arabic "N / 10" using the moraleDisplay/moraleMax already computed; regression test added.
- pass: 12 (commit 3dc27d24)
- viewport: mobile
- category: visual
- observation: the always-visible top header's MORALE meter shows the
  unresolved template placeholder text "v of x" instead of real numbers,
  on every screen in the app (title, exploration, combat, SELF, SATCHEL,
  MEMOIR). The correct value renders fine in the SELF tab's POOLS panel
  just below ("MORALE · resolve to walk 5 / 10"), so the data exists —
  it just isn't reaching the header component.
- evidence: accessibility snapshot on every screen: "MORALE / · RESOLVE
  TO WALK / v of x"; SELF tab POOLS panel correctly shows "5 / 10" for
  the same stat.
- suggested fix: wire the header MORALE display to the same
  morale value/formatter already used in the SELF tab's POOLS panel.
- source: playtester (critique pass 12)

### [x] [HIGH] combat END-phase button has no in-flight guard — rapid clicks skip player turns (RESOLVED — already fixed by WI-3)
- RESOLVED 2026-07-18 (verified stale; no new code). The WI-3 in-flight guard shipped AFTER this 2026-07-12 critique closes it: `CombatEncounterPanel.onEndPhase` holds a SYNCHRONOUS lock (`resolvingRef.current` — a same-frame second tap finds it held on line 516 and is dropped; released only after `RESOLVE_LOCK_MS`), and `CombatBoard` renders the END medallion `disabled={resolving}` with `handleEndPhase` no-opping while resolving. Regression-tested: `CombatBoard.multistage.test.tsx` "END PHASE is disabled + press-inert while a phase is resolving" (lines 91-117) reproduces the exact 2026-07-12 double-tap-machine-guns scenario and asserts neither `onEndPhase` nor the staged-card auto-apply fires again. The queue was overstating open HIGH bugs; corrected.
- pass: owner-playtest 2026-07-12
- viewport: mobile (expo-web via Playwright)
- category: functional
- observation: the END phase button has no in-flight/disabled guard
  while its action is resolving. Rapid clicks resolve multiple enemy
  phases in a row, letting the player's own turn get skipped entirely.
  This is a plain functional bug, not gated on any of the pending
  design phases — worth fixing standalone rather than waiting for
  Phase 31/33 to touch the turn loop.
- evidence: reproduced via Playwright rapid-click on `combat-apply-*`
  / END phase control against the running expo-web dev server; event
  log shows multiple enemy-phase resolutions per click burst.
- suggested fix: disable the END phase control (or debounce/queue its
  handler) for the duration of phase resolution.
- source: playtester (owner-directed break-test session)

### [x] [HIGH] momentum wheel's forged wild die cannot be spent — silently burns as a spare (RESOLVED — Phase 31 + dice-law rework)
- RESOLVED 2026-07-18 (verified stale; no new code). Phase 31 ("The Roll and the Read — momentum wheel engine-native", shipped `[x]`) is exactly what this 2026-07-12 critique said should absorb the die-routing bug, and the dice-law/drag rework closed it: the UI drop-eligibility `dieCanPowerCardVM` (`combat-encounter.engine.ts:383`) returns true for `die.color === 'wild'` on ANY card stance, so a floating/forged wild die is droppable everywhere; `state/presenters/__tests__/floating-die-apply.engine.test.ts` guards floating dice (incl. wild floats — "wild floats power any") applying end-to-end through the real engine and leaving `floatingDice` when spent. The auto-convert to +1◆ now only fires for a genuinely UNSPENT die at turn end (correct), not a can-never-be-spent one. Queue was overstating open HIGH bugs; corrected.
- pass: owner-playtest 2026-07-12
- viewport: mobile (expo-web via Playwright)
- category: functional
- observation: the momentum-wheel's forged wild die is rejected by
  drop routing wherever it's dragged, so it can never actually be
  spent; instead it silently burns as a spare (+1◆) at end of turn.
  Directly relevant to Phase 31 ("The Roll and the Read" — momentum
  wheel going engine-native, `plan/tuning/2026-07-10-momentum-scoping.md`):
  the phase should absorb this concrete die-routing bug as part of
  making the wheel engine-native, not build the global wheel on top of
  a broken die-routing path.
- evidence: reproduced via Playwright drag of the forged wild die onto
  every valid-looking staged card; drop routing rejects it in every
  case; end-of-turn event log shows it converted to +1◆ Reserve
  instead of consumed.
- suggested fix: fix drop-routing acceptance for the wild die kind (or
  explicitly document+telegraph the auto-convert as intended, if it
  is) before Phase 31 builds momentum's engine-native version on top
  of it.
- source: playtester (owner-directed break-test session)

### Pending rows closed because their subject was deleted

### [x] [LOW] mobile — legacy flag-off combat render paths linger post-FLIP — CLOSED 2026-09-25 (subject deleted in T2b)
- pass: combat declutter residue (PR #135, 2026-07-19)
- viewport: n/a
- auth_state: n/a
- category: engineering
- observation: THE FLIP (2026-07-18) made Upgradeable Dice the shipped default, but the flag-off render stack survives whole under the legacy kill-switch: the three-node MomentumWheel component + `vm.momentum`, the faceless 2-die draft tray, and the reroll rune's printed legacy cost/description (kept byte-identical flag-off by design). Dead weight the moment the kill-switch retires.
- evidence: CombatBoard.tsx MomentumWheel / `vm.momentumV2 ? chip : wheel` fork; presenter signaturesVM flag fork (PR #135).
- suggested fix: when the owner retires `EXPO_PUBLIC_UPGRADEABLE_DICE=0`, delete the wheel component, the `momentum` VM surface, and the flag forks in one sweep (the flag-off byte-identical test suites go with it).
- source: owner session 2026-07-19 (press-fate/momentum/dice PR)
- closed 2026-09-25: subject deleted in T2b (d565910d deleted the MomentumWheel, the flag forks and the kill-switch).
