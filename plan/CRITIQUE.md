# Critique log

> Last pass: 2026-07-10 at commit 3dc27d24
> Pass count: 12

> External-observer feedback for Axiomancer. Populated by
> `/critique` (which drives the local expo-web build with the
> `playtester` agent — there is no hosted URL), drained by
> `/iterate`. See `skills/critique.md` for the contract and
> `plan/bearings.md` § Surface for the local-build adaptation.

## Pending

### [HIGH] persistent header — MORALE meter renders literal "v of x" placeholder
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

### [HIGH] title screen — wordmark cropped above the mobile fold
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

### [HIGH] combat tutorial never teaches the drag-to-play gesture
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

### [MED] persistent header VITAE bar doesn't update during combat
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
- source: playtester (critique pass 12)

### [MED] pre-fight enemy preview disagrees with live combat VITAE
- pass: 12 (commit 3dc27d24)
- viewport: mobile
- category: inconsistency
- observation: the pre-fight encounter card for "Little Belle"
  previews the enemy as "level 2 · 50 hp.", but immediately on
  entering combat the same enemy's VITAE bar reads 100/100 — double
  the previewed value.
- evidence: encounter card text "level 2 · 50 hp." / "Lv 2 foe · 50 HP
  · advantage not yet scouted"; combat screen progressbar "Enemy VITAE
  100 of 100" for the same enemy in the same encounter.
- suggested fix: source the pre-fight preview and the live combat
  VITAE bar from the same computed enemy stat.
- source: playtester (critique pass 12)

### [MED] card/tooltip copy still says "HP" instead of canon VITAE
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

### [MED] general — rethink early-game as canned preset-deck tutorial, defer deckbuilding to labyrinth choice
- pass: user-jot (commit 63cfb3ba)
- viewport: unspecified
- auth_state: anonymous
- category: design
- observation: for the early game / "child" levels, potentially remove the deck-building aspect entirely. Instead each battle is a canned tutorial introducing a new preset deck, teaching each mechanic in a controlled vacuum. Pre-maze gameplay is really just the tutorial: "build a boat" -> "sail to friend" -> "go to labyrinth". The labyrinth is when the player commits to which deck they want to start the game with, which dictates their reward offering for the labyrinth. When the player completes the labyrinth and lands in the new city, they gain the ability to switch base decks post-labyrinth and trade their current deck for a new mid-game deck (since during the labyrinth they earn card rewards focused on their current deck's theme).
- evidence: user-spotted at 2026-07-08T18:36:36Z
- suggested fix: [user has not specified — iterate to determine]. Related: build-plan Phase 17 (quest-board tutorial) was dropped via `/oversight` 2026-07-10 because its narrow scope overlaps this rethink — the correct next step is to route this design idea through `/iterate` or a design skill and re-derive any per-minigame tutorial phases from whatever it lands on.
- source: user

### [LOW] `web:container` dev-server script is broken
- pass: 1 (commit 6e23724a)
- viewport: n/a
- category: infra
- observation: `axiomancer-mobile/scripts/dev-server-container.sh`
  (`npm run web:container`) pulls Expo via `npx --yes expo start`
  inside a throwaway `node:20-alpine` container, which resolves a
  different/incompatible Expo CLI version than the repo's pinned
  one and fails immediately with `SyntaxError: Error reading Expo
  config at /app/app.config.ts: Unexpected token '{'`, exiting
  before it ever binds the port (`web:container:wait` then fails
  with "container is not running"). Worked around this pass by
  running `npx expo start --web --port 8081` directly on the host
  from `axiomancer-mobile/`, which uses the repo's already-installed
  Expo 54.0.35 and bundles cleanly.
- evidence: container log —
  `SyntaxError: Error reading Expo config at /app/app.config.ts`.
- suggested fix: pin the container's Expo CLI to the repo's
  installed version (e.g. run `node_modules/.bin/expo` from the
  mounted repo instead of `npx --yes expo`), or drop the container
  path in favor of the host-run command until fixed.
- source: critique pass 1

> Seeded 2026-07-03 from the retired `/archive` critique history —
> only the recurring *patterns* were carried; stale one-off rows
> were dropped. Each maps to category `external-critique`.

### [MED] Engine doc-drift is chronic
- New engine surfaces (status-depth constants, new spec exports)
  chronically lag `spec.md` / `docs/combat.md`. Keep a doc-sync
  check in the loop rather than trusting the docs. (Build-plan
  Phase 12 addresses the current backlog; this is the recurring
  guard.)

### [MED] Wrong-engine mental model in docs
- Any surviving copy in `docs/combat.md` that frames
  Hazard-Pattern Combat as "additive/secondary" or teaches
  `resolveCombatRound`-first is the wrong mental model for mobile
  integrators. Hazard-Pattern Combat is primary.

### [LOW] Combat kill-path legibility
- The status kill-path (DoT / execute) is the intended win path
  but is not obviously legible on the combat board. A
  projected-lethality readout would close the gap (build-plan
  Phase 2).

## Done

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
- source: `/oversight` 2026-07-10, synthesizing critique passes 5-11

### [x] [needs-user-call] Playwright MCP tools unavailable to sub-agents (pass 1-4; addressed at 525cd25 follow-up)
- Root cause: two allowlist gaps, not a Playwright bug. (1)
  `.github/workflows/_claude-skill.yml`'s `--allowedTools` CLI flag
  was a fixed list that never included any `mcp__playwright__*` tool,
  even when `install_playwright: true` installed the browser. (2)
  `.claude/settings.json.example` (activated as `.claude/settings.json`
  for every unattended CI run) had no `mcp__playwright__*` entries in
  `permissions.allow` either. Unattended runs auto-reject tools outside
  both allowlists instead of prompting, so every `playtester`
  `browser_*` call failed instantly.
- Fix: `--allowedTools` in `_claude-skill.yml` now appends the 14
  `mcp__playwright__browser_*` tools whenever `install_playwright` is
  true; `.claude/settings.json.example` grants the same 14 tools in
  `permissions.allow`. Also unblocks `deep-playtest`, `combat-ux-tuning`,
  `critic-loop`, and `hermes-playtest`, which share the same runner and
  had the identical gap.
- User-owned decision, applied on explicit user request (not a
  self-grant by `/critique` or `/march`).
