---
description: Play through the game as a first-time player via the playtester agent, documenting UX friction, flow gaps, and delight moments to axiomancer-mobile/docs/reports/PLAYTEST_REPORT.md
---

> **⚙️ Runs against the `axiomancer-mobile` package.** Repo-relative paths below
> (`state/…`, `components/…`, `app/…`, `scripts/…`) are relative to that package — run from it (`cd axiomancer-mobile`) or via
> `npm run <script> -w axiomancer-mobile`.

# Skill: deep-playtest

> **Testing persona walkthrough.** Spawn the `playtester` agent
> to play through the game as a first-time player, documenting
> UX friction, flow gaps, and delight moments in
> `axiomancer-mobile/docs/reports/PLAYTEST_REPORT.md`. This is
> the experience audit.
>
> **Opt-in by design.** Requires a user-started `npm run web`
> instance. Cannot autostart the dev server.

## 1. Purpose

`/deep-playtest` has the `playtester` agent explore broadly,
play multiple paths (golden, failure, tab exploration, edge
cases), and produce a rich experience report.

The output (`axiomancer-mobile/docs/reports/PLAYTEST_REPORT.md`)
is the durable experience record: triage findings with the user,
then route fixes into normal development work.

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

The dev server (`npm run web`) does **not** need to be running —
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
npm run web
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

If `axiomancer-mobile/docs/reports/PLAYTEST_REPORT.md` exists,
read its `## Done` section to pass to the playtester (avoid
re-surfacing addressed findings).

For a voice cue, skim recent reports in
`axiomancer-mobile/docs/reports/` and the package's `AGENTS.md`
for how the game talks about itself.

### Step 3 — Spawn playtester

```
Agent({
  subagent_type: "playtester",
  prompt: "Play through Axiomancer Mobile at <url>.
           Voice cue: <quote gathered in Step 2>.
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

Write to `axiomancer-mobile/docs/reports/PLAYTEST_REPORT.md`
(create the `docs/reports/` directory if it doesn't exist yet).
If a previous report exists,
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

### Step 6 — Cross-reference critic-loop findings

If `axiomancer-mobile/docs/reports/CRITIQUE.md` exists (written
by `/critic-loop`), scan its Pending section for findings that
overlap with the new playtest findings. Add a cross-reference
note to matching rows: `- playtest: see PLAYTEST_REPORT.md [F##]`.

### Step 7 — Commit + push

If `dry-run`, print the report and exit.

```bash
git add axiomancer-mobile/docs/reports/PLAYTEST_REPORT.md \
        axiomancer-mobile/docs/reports/CRITIQUE.md
git commit -m "$(cat <<'EOF'
deep-playtest: <date> — <N> findings (<H> high, <M> med, <L> low, <D> delight)

Paths walked: <list>.
Top findings: <1-2 line summary of highest-severity items>.
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
Report: axiomancer-mobile/docs/reports/PLAYTEST_REPORT.md —
triage the findings with the user before routing fixes.
```

## 5. Relationship to other skills

| Skill | How it relates |
|---|---|
| `/critic-loop` | Screenshot-based visual/UX critic that fixes findings itself. `/deep-playtest` is an interactive player of the game as a game — report only. |
| `/hermes-playtest` | Scripted Hermes-native UI playthrough. `/deep-playtest` is a free-form persona walk via Playwright. |
| `/combat-ux-tuning` | Automated combat UX A/B tuner. Combat-UX findings from this report can seed its hypotheses. |

## 6. Hard rules

1. **Clean up what you start.** If the skill started the dev
   server, kill it when done. If the user's server was already
   running, leave it alone.
2. **Never modify shipped code.** This skill is observation only.
   Findings go to PLAYTEST_REPORT; fixes are triaged with the
   user and land through normal development work.
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
