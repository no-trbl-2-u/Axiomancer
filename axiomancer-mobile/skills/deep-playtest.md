# Skill: deep-playtest

> **Testing persona walkthrough.** Spawn the `playtester` agent
> to play through the game as a first-time player, documenting
> UX friction, flow gaps, and delight moments in
> `plan/PLAYTEST_REPORT.md`. The complement to `/playtest`
> (regression sentinel) — this is the experience audit.
>
> **Opt-in by design.** Requires a user-started `pnpm web`
> instance. Cannot autostart the dev server.

## 1. Purpose

`/playtest` walks one canonical path and files regressions to
AUDIT.md. `/deep-playtest` is different: the `playtester` agent
explores broadly, plays multiple paths (golden, failure, tab
exploration, edge cases), and produces a rich experience report
that feeds the `/resolve-playtest` triage flow.

The output (`plan/PLAYTEST_REPORT.md`) serves two purposes:
1. Input for `/resolve-playtest` — interactive triage with the
   user, routing findings to design specs or phase candidates.
2. Context for `/oversight` — the next oversight call sees what
   the playtester found and can adjust priorities.

## 2. Invocation

```
/deep-playtest                   # full walk against localhost:8081
/deep-playtest <url>             # full walk against custom URL
/deep-playtest dry-run           # walk + print report; don't commit
/deep-playtest combat            # focus: combat UX only
/deep-playtest exploration       # focus: map/exploration only
/deep-playtest character         # focus: SELF/SATCHEL tabs only
```

## 3. Prereqs

1. **Playwright MCP enabled** in the Claude Code session
   (`mcp__playwright__*` tools available).

The dev server (`pnpm web`) does **not** need to be running —
the skill starts it automatically and tears it down when done
(see Step 1). If the user already has a server running, the
skill detects it and skips the start/stop.

## 4. Procedure

### Step 0 — Sync

```bash
git pull --ff-only
```

If divergence, stop.

### Step 1 — Dev server

Check if a dev server is already running:

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" --max-time 5 \
    http://localhost:8081/
```

**If HTTP 200** — server is already running. Set
`SELF_STARTED_SERVER=false` and proceed.

**If not reachable** — start the server in the background:

```bash
# run_in_background: true
pnpm web
```

Set `SELF_STARTED_SERVER=true`. Then poll until the bundle is
ready (Expo's first bundle takes 10-30s):

```bash
# Monitor tool — poll until server responds
until curl -s -o /dev/null -w "%{http_code}" --max-time 3 \
    http://localhost:8081/ | grep -q 200; do sleep 3; done
```

If the server doesn't respond within 120 seconds, exit with
`[needs-user-call]` — the build is failing.

Load Playwright tools via `ToolSearch` if not yet in context
(select: `mcp__playwright__browser_navigate`,
`mcp__playwright__browser_click`,
`mcp__playwright__browser_snapshot`,
`mcp__playwright__browser_take_screenshot`,
`mcp__playwright__browser_resize`,
`mcp__playwright__browser_console_messages`,
`mcp__playwright__browser_close`).

### Step 2 — Read existing report

If `plan/PLAYTEST_REPORT.md` exists, read its `## Done` section
to pass to the playtester (avoid re-surfacing addressed
findings).

Read `plan/bearings.md` for voice cue.

### Step 3 — Spawn playtester

```
Agent({
  subagent_type: "playtester",
  prompt: "Play through Axiomancer Mobile at <url>.
           Voice cue from plan/bearings.md: <quote>.
           Already-addressed (skip): <Done section or 'none'>.
           Focus: <from arg or 'full walk — all paths'>.
           Current commit: <sha>.
           Return your full playtest report per your output spec."
})
```

Wait for return.

### Step 4 — Validate + write report

Validate the playtester's output:
- Has session narrative, findings, paths walked.
- Findings follow the `[F##]` format.
- No invented observations (cross-check any specific UI text
  against codebase via grep if suspicious).

Write to `plan/PLAYTEST_REPORT.md`. If a previous report exists,
move its `## Findings` and `## Delight Log` sections to
`## Previous Sessions` at the bottom (preserve the `## Done`
section intact at its current location).

### Step 5 — Clean up

```bash
rm -f playtest-*.png screenshot-*.png
```

If `SELF_STARTED_SERVER=true`, kill the dev server:

```bash
pkill -f "expo start --web" || true
```

Verify it's down:

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" --max-time 3 \
    http://localhost:8081/ || true
```

If the user's own server was already running
(`SELF_STARTED_SERVER=false`), leave it alone.

### Step 6 — Cross-reference CRITIQUE.md

Scan `plan/CRITIQUE.md` Pending for findings that overlap with
the new playtest findings. Add a cross-reference note to
matching CRITIQUE rows: `- playtest: see PLAYTEST_REPORT.md [F##]`.

### Step 7 — Commit + push

If `dry-run`, print the report and exit.

```bash
git add plan/PLAYTEST_REPORT.md plan/CRITIQUE.md
git commit -m "$(cat <<'EOF'
deep-playtest: <date> — <N> findings (<H> high, <M> med, <L> low, <D> delight)

Paths walked: <list>.
Top findings: <1-2 line summary of highest-severity items>.

Next step: /resolve-playtest to triage with user.
EOF
)"
git push origin main
```

### Step 8 — Done

Print summary:

```
deep-playtest <date> complete.
<N> findings filed (<H> high, <M> med, <L> low).
<D> delight moments logged.
Run /resolve-playtest to triage findings and generate design spec.
```

## 5. Relationship to other skills

| Skill | How it relates |
|---|---|
| `/playtest` | Regression sentinel — walks one canonical path, files to AUDIT.md. Narrow and fast. `/deep-playtest` is broad and thorough. |
| `/critique` | External observer of the site as text/HTML. `/deep-playtest` is an interactive player of the game as a game. |
| `/resolve-playtest` | Reads PLAYTEST_REPORT.md and triages findings with the user. The downstream consumer. |
| `/oversight` | Reads PLAYTEST_REPORT.md as context. Can re-prioritize findings. |
| `/iterate` | Picks up code-routed findings from PHASE_CANDIDATES.md (after `/resolve-playtest` files them). |

## 6. Hard rules

1. **Clean up what you start.** If the skill started the dev
   server, kill it when done. If the user's server was already
   running, leave it alone.
2. **Never modify shipped code.** This skill is observation only.
   Findings go to PLAYTEST_REPORT; fixes go through
   `/resolve-playtest` → `/iterate` or Claude Design.
3. **Always delegate to the playtester agent.** Don't play the
   game from the main agent context — the fresh-eyes persona
   requires a clean sub-agent context.
4. **Clean up screenshot artifacts.** Loose `.png` files in the
   repo root pollute the working tree.
5. **Archive, don't overwrite** previous reports. Move old
   findings to `## Previous Sessions`.
6. **No emojis. No `Co-Authored-By:`.**

## 7. Failure modes

1. **Dev server won't start** (build errors, port conflict) →
   file `[needs-user-call]` with the error output and exit.
2. **Playwright MCP unavailable** → exit with error.
3. **Playtester agent returns malformed output** → re-spawn once
   with stricter format instructions. If fails again, write
   partial report with what's available, commit, exit.
4. **`git pull` divergence** → stop.
5. **No findings at all** (rare — even a clean game has friction
   points) → commit report with narrative only, note "no
   findings filed" in summary.
