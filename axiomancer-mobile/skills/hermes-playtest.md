# Skill: hermes-playtest

> **Hermes-native UI playthrough.** Drive Axiomancer Mobile with Hermes'
> native browser tools, not Claude Code's Playwright MCP, and produce a
> thorough Tobin-facing playtest report. This is the Hermes counterpart to
> `skills/playtest.md` and `skills/deep-playtest.md`.

## 1. Purpose

`/playtest` and `/deep-playtest` were written for Claude Code sessions with
Playwright MCP tools. Hermes does not need that bridge. Hermes can start Expo
Web as a tracked process, drive the app with `browser_navigate`,
`browser_snapshot`, `browser_click`, `browser_press`, `browser_scroll`,
`browser_console`, and `browser_vision`, then kill only the process it started.

The output is not just a QA bug list. It is evidence for Tobin: player psychology, mechanic-to-UI fidelity, friction, delight, and the places where
the interface teaches or lies about the rules.

## 2. Config

Read `automation/hermes-ui-playtest.config.json` before starting. Treat it as
the run contract:

- server command, port, readiness text, and kill policy
- required browser tools
- deterministic minigame seeds (`minigameSeeds`) for hazard, gathering, rest, cache, and quest runs
- required paths
- report schema and finding fields

Default target:

```bash
CI=1 EXPO_NO_TELEMETRY=1 npx expo start --web --port 18081 --host localhost
```

Default URL:

```text
http://127.0.0.1:18081/
```

## 3. Startup procedure

1. Check whether `http://127.0.0.1:18081/` already responds.
2. If it responds, set `SELF_STARTED_SERVER=false` and leave the server alive
   after the run.
3. If it does not respond, start the configured command with Hermes `terminal`:
   - `background=true`
   - `pty=true`
   - `watch_patterns=["Waiting on http://localhost:18081"]`
4. Wait for the readiness line or poll the URL until HTTP 200.
5. If startup fails, write a high-severity finding explaining the blocker and
   include the server output.

Hard rule: cleanup uses `process(action="kill")` only when
`SELF_STARTED_SERVER=true`. Do not kill a user-started server.

## Required paths

Run these paths unless the user scopes the test narrower.

### Path A — Golden encounter

Goal: prove the first playable loop is legible.

1. `browser_navigate` to the base URL.
2. `browser_snapshot` the WILDS screen.
3. Record current location, visible HP/resources, open/sealed nodes, and travel
   affordances.
4. Travel toward an encounter node.
5. Snapshot the encounter modal.
6. Choose FIGHT.
7. Snapshot combat before stance choice.
8. Choose a non-default stance when available.
9. Choose ATTACK or the most obvious action.
10. Snapshot round resolution.
11. Tap NEXT ROUND if present.
12. Snapshot the new round or aftermath.
13. Run `browser_console(clear=false)` and file every error.

### Path B — Failure and retreat

Goal: see whether the UI teaches consequence.

- Inspect FLEE or equivalent retreat controls.
- Record cost text before acting.
- Trigger retreat only if safe and reversible enough for the run.
- If defeat is reachable without excessive grinding, observe it. Do not invent a
  defeat report if it was not seen.
- Note whether the player understands what was lost, what changed, and how to
  recover.

### Path C — Tab literacy

Goal: determine whether each primary surface tells the player what it is for.

Visit and snapshot:

- WILDS
- SELF
- MEMOIR
- SATCHEL

For each tab, record:

- first visible purpose
- primary action
- unexplained jargon
- disabled/dead-looking controls
- whether values match the combat/exploration surfaces

### Path D — Edge probes

Goal: expose dead affordances and hidden assumptions.

- Tap at least three things that look tappable.
- Use `browser_press` for Tab/Enter where practical.
- Use `browser_scroll` on long screens.
- Record no-op taps as findings only when a reasonable player would expect
  feedback.

### Path E — Mechanics fidelity

Goal: give Tobin evidence about whether the UI embodies the rules.

Track visible values before and after actions:

- HP and resource totals
- stance choice and phase progression
- battle log versus resolution panel
- reward, item, or codex changes
- friendship or aftermath language

A mismatch is a mechanic-to-UI fidelity risk even if the underlying mechanic is
correct.

## Evidence rubric

Every finding must be grounded in observed evidence:

- location: route, tab, modal, component, or visible heading
- path: A/B/C/D/E
- screenshot or visual description from `browser_vision`
- relevant `browser_snapshot` text
- console output if present
- expected vs actual behavior
- playerFeeling: agency, mastery, dread, confusion, temptation, pride, fatigue,
  or delight
- mechanicImplication: what this may teach the player about the rules
- tobinPrompt: one sentence asking what Tobin should judge

Do not report what you did not see. If a path is blocked, the blocker itself is
the finding.

## Tobin-facing report contract

Write or update `plan/PLAYTEST_REPORT.md` in this shape:

```markdown
# Playtest Report

> Date: <ISO date>
> Harness: Hermes native browser
> Config: automation/hermes-ui-playtest.config.json
> Build: Expo web at <url>
> Commit: <sha>
> Paths walked: A, B, C, D, E

## Verdict-ready summary

<5-8 bullets. Lead with the highest consequence findings. State whether the UI
currently teaches the mechanics faithfully enough for Tobin to judge balance.>

## Session narrative

<3-5 paragraphs as a first-time player: what was understood, what was doubted,
where the game produced friction or delight.>

## Paths walked

<Per-path notes. Include skipped steps and why.>

## Findings

### [F##] <title>
- severity: high | medium | low
- type: confusion | friction | flow-gap | feedback-missing | bug | inconsistency | visual | pacing
- location: <screen/component>
- path: A | B | C | D | E
- playerFeeling: <one or more feelings>
- mechanicImplication: <what this implies about the rules or player behavior>
- evidence: <snapshot/vision/console summary>
- expected: <reasonable player expectation>
- actual: <observed behavior>
- tobinPrompt: <one sentence for Tobin>

## Mechanic-to-UI fidelity notes

<HP, stance, phase, reward, friendship, inventory, aftermath, and battle-log
comparisons. These notes may exist even when not formal findings.>

## Delight log

<What worked and should be preserved. Delight is mandatory; if none, say so.>

## Console and network

- Errors: <count + details>
- Warnings: <count + details if novel/player-visible>
- Slow/broken requests: <details if observed>

## Tobin questions

<Numbered questions for Tobin's mechanics judgment.>
```

The phrase **verdict-ready summary** is deliberate: Tobin should be able to read
the first section and know what judgment is being asked of him.

## Cleanup

1. Close or abandon browser state only after console capture.
2. If the run created screenshots or exports under ignored paths, remove them
   unless the user explicitly asked to preserve evidence files.
3. If `SELF_STARTED_SERVER=true`, kill the background process with
   `process(action="kill")`.
4. Run `git status --short` and ensure no generated artifacts are staged by
   accident.

## 7. Verification

For changes to this harness, run:

```bash
npm test -- --runTestsByPath scripts/__tests__/hermes-ui-playtest.test.ts --runInBand
npm run typecheck
git diff --check
```

For an actual playtest run, also perform at least one live browser navigation,
collect one snapshot, and check console output.
