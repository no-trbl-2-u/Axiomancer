# Critique log

> Last pass: 2026-07-09 at commit 2e0a2324
> Pass count: 10

> External-observer feedback for Axiomancer. Populated by
> `/critique` (which drives the local expo-web build with the
> `playtester` agent — there is no hosted URL), drained by
> `/iterate`. See `skills/critique.md` for the contract and
> `plan/bearings.md` § Surface for the local-build adaptation.

## Pending

### [HIGH] combat design — kill the "weak basic chip OR real status effect" fork
- pass: user-jot (2026-07-09, dice-law rework session)
- viewport: unspecified
- auth_state: anonymous
- category: design
- observation: owner, verbatim intent — "I really want Axiomancer to
  FUNDAMENTALLY do away with these 'do low basic damage OR a status effect'
  [forks]. I think it's bogging the game down." Trigger: the new split-face
  layout (◇ FREE | ◆ PAID) made authored FREE lines like slippery-slope's
  `tickOne` (one weak DoT tick) visibly read as a worse copy of the paid
  effect. The complaint targets the FREE/PAID fork's CONTENT (weak-chip
  free lines), possibly the fork itself — not the layout.
- evidence: user-spotted while reviewing card layout mock-ups,
  2026-07-09; see plan/HANDOFF-2026-07-09-dice-law-rework.md § DESIGN SIGNAL
- suggested fix: [owner explicitly parked it — "a conversation for another
  time"; needs a /brainstorm-mechanics or /oversight session, NOT an /iterate
  fix. Candidate directions recorded in the handoff: FREE line shouldn't carry "raw" damage but rather lay a foundation for bigger, PAID effects, all within the theme]
- source: user

### [MED] general — rethink early-game as canned preset-deck tutorial, defer deckbuilding to labyrinth choice
- pass: user-jot (commit 63cfb3ba)
- viewport: unspecified
- auth_state: anonymous
- category: design
- observation: for the early game / "child" levels, potentially remove the deck-building aspect entirely. Instead each battle is a canned tutorial introducing a new preset deck, teaching each mechanic in a controlled vacuum. Pre-maze gameplay is really just the tutorial: "build a boat" -> "sail to friend" -> "go to labyrinth". The labyrinth is when the player commits to which deck they want to start the game with, which dictates their reward offering for the labyrinth. When the player completes the labyrinth and lands in the new city, they gain the ability to switch base decks post-labyrinth and trade their current deck for a new mid-game deck (since during the labyrinth they earn card rewards focused on their current deck's theme).
- evidence: user-spotted at 2026-07-08T18:36:36Z
- suggested fix: [user has not specified — iterate to determine]
- source: user

### [needs-user-call] Playwright MCP tools unavailable to sub-agents — recurred again (pass 10)
- pass: 10 (commit 2e0a2324); prior: pass 9 (commit 31817335),
  pass 8 (commit 43088f6f), pass 7 (commit aff7fece), pass 6
  (commit e50e819a), pass 5 (commit b0707e0a), pass 1-4 (marked
  fixed, see Done section)
- pass 10 update: seventh occurrence, sixth consecutive. Local
  expo-web build started fresh this pass (`npx expo start --web
  --port 8081` from `axiomancer-mobile/`) and confirmed reachable
  (`curl -> 200`) at http://localhost:8081 before spawning
  `playtester` — identical pre-flight to pass 9. The `playtester`
  sub-agent's very first tool call, `mcp__playwright__browser_navigate`,
  was rejected twice with "Claude requested permissions to use
  mcp__playwright__browser_navigate, but you haven't granted it
  yet." No page ever loaded; zero screens covered; zero product
  findings this pass. `.claude/settings.json` on disk is unchanged
  from pass 9 (still carries the 14-tool `mcp__playwright__browser_*`
  allowlist, still untracked in git). This continues to confirm
  the pass 6-9 diagnosis: the gap is in grant propagation to
  Agent-tool sub-agent contexts, not the settings file content.
  No new information surfaced this pass beyond "still broken,
  identically" — deferring to the existing suggested fix below
  rather than re-diagnosing.
- viewport: n/a
- category: infra
- observation: fifth occurrence of this exact blocker, fourth
  consecutive. Local expo-web build was started fresh this pass
  (`npx expo start --web --port 8081` from `axiomancer-mobile/`,
  since `web:container` is still broken per the separate LOW
  finding below) and confirmed reachable (`curl -> 200`) at
  http://localhost:8081 before spawning `playtester`. New this
  pass: found that `.claude/settings.json` on disk in this
  environment already carries the `mcp__playwright__browser_*`
  allowlist (copied from `settings.json.example`, minus the
  `__note` key) — so the grants are present and correct in the
  *main* session's settings file, yet the `playtester` sub-agent
  still had its `browser_navigate` call rejected at the
  permission layer before executing. This rules out "the
  settings file is missing or stale in this environment" as an
  explanation and further confirms the grants in
  `.claude/settings.json` are not propagating to Agent-tool
  sub-agent contexts at all — the gap is structural, not a config
  content problem. Also notable: `.claude/settings.json` itself
  is untracked in git (`git status` shows `?? .claude/settings.json`
  at every pass) — it was never committed, so it only exists
  because someone copied it into this persistent environment by
  hand. Even if sub-agent grant propagation gets fixed, the
  allowlist as it stands would not travel with the repo to a
  fresh clone/environment unless committed (or unless that's
  intentional per the `__note` in `settings.json.example`, which
  frames activation as "a deliberate, user-owned step").
  New this pass: the *calling* session (this one) was itself
  offered direct `mcp__playwright__browser_*` tool access mid-run
  (surfaced via a deferred-tool listing, and callable without a
  permission prompt) — yet the `playtester` sub-agent it spawned
  moments later, using the identical repo-level
  `.claude/settings.json` allowlist, still had every
  `browser_navigate`/`browser_snapshot` call rejected as
  ungranted. This is the clearest signal yet that the grant is
  session-scoped and does not inherit into Agent-tool sub-agent
  contexts even when the top-level session holds it — reinforcing
  (not just repeating) the pass 5-8 diagnosis that this is a
  structural sub-agent propagation gap, not a stale-config or
  missing-file problem.
- evidence: sixth occurrence, fifth consecutive. Verbatim
  sub-agent tool errors this pass: "Claude requested permissions
  to use mcp__playwright__browser_navigate, but you haven't
  granted it yet." and "...mcp__playwright__browser_snapshot,
  but you haven't granted it yet." — raised on every attempt
  before any page load.
- suggested fix: unchanged from pass 6/7 — this needs a
  `[needs-user-call]` decision on the permission-mode mechanism
  itself: either (a) confirm whether this harness's
  unattended/`/march`-invoked sessions structurally cannot
  auto-approve MCP tool grants for sub-agents (in which case
  `/critique` needs a non-Playwright transport for unattended
  ticks — e.g. a headless script driving the expo-web build
  directly), or (b) identify the correct scope/mechanism (session
  flag, env var, harness config outside `.claude/settings.json`)
  that actually grants MCP tools to sub-agent contexts. Do not
  re-attempt settings.json edits in this environment — four
  passes have now verified the file is already correct and
  present; the gap is in grant propagation to sub-agents, not the
  file. Separately (lower priority): if (a) or (b) ever gets
  resolved, decide deliberately whether `.claude/settings.json`
  should be committed to the repo so the fix travels with it, or
  left as a per-environment opt-in as `settings.json.example`'s
  note implies.
- source: critique pass 9 (playtester, dev server pre-verified up
  before spawn; expo web bound at http://localhost:8081 via
  `npx expo start --web --port 8081` from `axiomancer-mobile/`)

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
