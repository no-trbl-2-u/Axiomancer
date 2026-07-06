# Critique log

> Last pass: 2026-07-06 at commit 6e23724a
> Pass count: 1

> External-observer feedback for Axiomancer. Populated by
> `/critique` (which drives the local expo-web build with the
> `playtester` agent — there is no hosted URL), drained by
> `/iterate`. See `skills/critique.md` for the contract and
> `plan/bearings.md` § Surface for the local-build adaptation.

## Pending

### [needs-user-call] Playwright MCP tools unavailable to sub-agents
- pass: 1 (commit 6e23724a)
- viewport: n/a
- category: infra
- observation: The local expo-web build started fine on
  `http://localhost:8081` (host-run `npx expo start --web`, bundled
  clean — the containerised `web:container` path is separately
  broken, see below). But every `mcp__playwright__browser_*` call
  — from both the `playtester` sub-agent and the main agent
  directly — was rejected with "Claude requested permissions to use
  mcp__playwright__browser_navigate, but you haven't granted it
  yet." `.claude/settings.json`'s permission allowlist has no
  `mcp__playwright__*` entries, and there's no user present in an
  autonomous `/march` tick to approve the interactive prompt.
- evidence: playtester sub-agent report, and a direct
  `mcp__playwright__browser_navigate` call from the main agent
  hitting the identical error.
- suggested fix: add the needed `mcp__playwright__*` tool names to
  `.claude/settings.json`'s `permissions.allow` list (a user/config
  decision, not a code fix `/iterate` can make unilaterally).
- source: critique pass 1

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

(empty)
