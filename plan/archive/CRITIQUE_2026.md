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
