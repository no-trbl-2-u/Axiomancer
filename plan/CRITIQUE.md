# Critique log

> Last pass: 2026-07-07 at commit b0707e0a
> Pass count: 5

> External-observer feedback for Axiomancer. Populated by
> `/critique` (which drives the local expo-web build with the
> `playtester` agent — there is no hosted URL), drained by
> `/iterate`. See `skills/critique.md` for the contract and
> `plan/bearings.md` § Surface for the local-build adaptation.

## Pending

### [needs-user-call] Playwright MCP tools unavailable to sub-agents — reopened (pass 5)
- pass: 5 (commit b0707e0a)
- viewport: n/a
- category: infra
- observation: the pass 1-4 occurrence of this issue was marked
  fixed (see Done section) via `.claude/settings.json` /
  `.claude/settings.json.example` and `_claude-skill.yml`
  `--allowedTools` grants for the 14 `mcp__playwright__browser_*`
  tools. This pass, `.claude/settings.json` on disk already lists
  all 14 tools under `permissions.allow`, yet a live
  `mcp__playwright__browser_navigate` call — both from the
  `playtester` sub-agent and from the main agent directly — was
  rejected with "Claude requested permissions to use
  mcp__playwright__browser_navigate, but you haven't granted it
  yet." The settings-file fix does not appear sufficient for this
  session/runtime; something in the live permission-mode
  enforcement (interactive session vs. the CI `--allowedTools`
  path the prior fix targeted) still gates MCP tool calls behind
  a grant that never arrives in an unattended run. Local expo-web
  build was started and reachable at http://localhost:8081; the
  blocker is purely the tool grant, not the app.
- evidence: verbatim tool error, reproduced 2x independently:
  `Claude requested permissions to use
  mcp__playwright__browser_navigate, but you haven't granted it
  yet.`
- suggested fix: needs a user-side permission-mode decision —
  either grant `mcp__playwright__*` at a scope this session
  actually reads (vs. project `.claude/settings.json`), or
  confirm whether unattended `/march` ticks run under a
  permission mode that structurally cannot auto-approve MCP
  tools (in which case `/critique` needs a different playtest
  transport, not another allowlist edit).
- source: critique pass 5 (playtester + direct main-agent probe)

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
