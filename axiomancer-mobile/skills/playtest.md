# Skill: playtest

> **Live-drive regression sentinel.** Drive the running web app
> through one canonical encounter via Playwright MCP. File any
> visible regressions to `plan/AUDIT.md`. The complement to the
> hermetic Jest suite — catches what code-read tests miss.
>
> **Opt-in by design.** Requires a user-started `pnpm web`
> instance (per `setup/04_claude_playtest.md`). Cannot autostart
> the dev server — chicken-and-egg with Claude's own bash
> session lifecycle.

## 1. Purpose

The hermetic Jest suite (1000+ tests) verifies code correctness
but not feature correctness. Phase 63 / 65 each took 4+
corrective commits because regressions only surfaced when the
user retested a preview build. The mechanics-vs-UI audits found
drift visible only in the live app (encounter step-card icon,
FLEE morale chrome, Heart pre-selected default).

`/playtest` closes that gap. It drives a canonical
exploration→combat walk in a fresh Playwright session, files
anything visibly wrong, and exits clean. Run it after risky
UI changes, after engine bumps, or on a periodic cadence.

## 2. Invocation

```
/playtest                          # full walk against http://localhost:8081
/playtest <url>                    # full walk against a custom URL
/playtest dry-run                  # walk + log findings; don't commit AUDIT
```

When invoked by `/march` (Phase 67 Tick B opt-in), the dispatcher
runs `/playtest` with no arguments at the configured cadence.
When invoked manually, the user can pass a URL (e.g. tunnel
URL) or `dry-run` for a sanity pass.

## 3. Prereqs

1. **`pnpm web` running** on the target URL (default
   `http://localhost:8081`). Per
   `setup/04_claude_playtest.md` — leave the dev server alive
   for the full Claude session.
2. **Playwright MCP enabled** in the Claude Code session
   (`mcp__playwright__*` tools available). Verify with a
   smoke navigate if uncertain.
3. **`.env` in working directory** (for `GH_TOKEN` /
   `GH_REPO`) — only needed if findings get mirrored to
   GitHub issues. Today findings just go to AUDIT.md; the
   issue-mirror step is a follow-up.

If any prereq fails, exit with `[needs-user-call]` to AUDIT
and stop. Do not attempt to start the dev server.

## 4. The canonical walk

Mobile viewport (414×896). Pre-existing save state OK; the
walk doesn't require a fresh game (the saved state from the
last session is usually at Hovel or one step in).

1. **Navigate** → `http://localhost:8081`. Wait for
   `/exploration` to load (Expo's first-time bundle can take
   10–30s).
2. **Snapshot the exploration screen.** Note: tab bar (WILDS
   / SELF / MEMOIR / SATCHEL), region name, current node,
   player HP shown on the card.
3. **Walk to an encounter node.** From any starting position,
   tap the first available step-card. If that's a non-
   encounter node (gather / rest / treasure), tap through
   one more travel option to reach an encounter. The
   fishing-village map has fv-3 (Hanged Wood, encounter)
   reachable in 1–2 moves from any start.
4. **Tap the encounter step-card.** Encounter modal should
   mount. Snapshot: badge (ENCOUNTER), title (enemy name),
   subtitle, FIGHT + FLEE buttons, chrome subtitles.
5. **Tap FIGHT.** Combat panel mounts inside the modal (per
   Phase 63 modal-contained encounter). Snapshot: enemy
   panel, battle log eyebrow, player HUD with HP, stance
   picker.
6. **Pick a stance** (BODY arbitrary choice — exercises a
   non-default since Tick B dropped the Heart default).
   Snapshot: phase stack should show I·STAND as `past` with
   BODY summary, II·DO as `current` with action picker.
7. **Tap ATTACK.** Round resolves. Snapshot: IV·LET as
   `current` with ResolvePanel showing roll values, outcome,
   and the NEXT ROUND button.
8. **Tap NEXT ROUND.** Should NOT exit combat (unless enemy
   was killed in one hit, which is rare). Round 2 begins.
   Snapshot: battle log gained a round, stance picker
   re-opens.
9. **Read console messages** (`mcp__playwright__browser_console_messages`
   level=warning). File any errors — warnings only if novel.
10. **Close the browser** (`mcp__playwright__browser_close`).
11. **Clean up any loose screenshots** in the repo root —
    delete `playtest-*.png` files; do not commit them.

## 5. What gets surfaced

After the walk, compare observations against expectations.

| Observation type | File as |
|---|---|
| HP / mana / stat mismatch between surfaces | AUDIT row, MED 5–6 |
| Visible regression vs prior playtest's snapshot | AUDIT row, scored per impact |
| Console error (not warning) | AUDIT row, scored per impact |
| New deprecation warning class | AUDIT row, LOW 2 |
| Modal mount/unmount glitch (mid-combat unmount, etc.) | AUDIT row, HIGH 8+ |
| Phase doesn't advance | AUDIT row, HIGH 9+ |
| Everything clean | No commit; print summary; exit 0 |

Each AUDIT row carries the `source: live-drive playtest
<date>` line so future iterate ticks know the finding came
from this walk, not code-read audit.

### AUDIT row template

```markdown
### [<score>] <one-line description> (NEW — playtest <date>)

- category: <bug | tests | tech-debt | voice>
- impact: <0-10> (<one-line>)
- ease: <0-10 or `?`> (<one-line>)
- observed: live-drive playtest <date>.
  - <bullet of what was seen>
  - <bullet of expected vs actual>
  - <bullet of context — level, encounter, etc.>
- next: <action — investigate / file iterate fix / etc.>
- source: live-drive playtest (<oversight call or cron tick>)
```

## 6. Procedure

### Step 0 — Sync

```bash
git pull --ff-only
```

If divergence, stop per §8.

### Step 1 — Prereq smoke

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" --max-time 5 \
    http://localhost:8081/
```

Expect `HTTP 200`. If not, the dev server isn't reachable —
file `[needs-user-call]` to AUDIT and exit.

Playwright tools come via the Claude Code MCP server; load
them via `ToolSearch` if not yet in context (typical select:
`mcp__playwright__browser_resize`,
`mcp__playwright__browser_navigate`,
`mcp__playwright__browser_snapshot`,
`mcp__playwright__browser_click`,
`mcp__playwright__browser_take_screenshot`,
`mcp__playwright__browser_console_messages`,
`mcp__playwright__browser_close`).

### Step 2 — Drive the walk (§4)

Each click + snapshot is a separate tool call. Use snapshot
refs from the previous snapshot (the `[ref=eXX]` markers) to
target the next click.

### Step 3 — Read console

```
mcp__playwright__browser_console_messages level=warning
```

Categorize: errors (always file), warnings (file only if
novel — see existing AUDIT `[2.5]` console-warning tracking
row for the current baseline).

### Step 4 — Close + clean

```
mcp__playwright__browser_close
```

```bash
rm -f playtest-*.png
```

### Step 5 — File findings

If any findings, append to `plan/AUDIT.md` `## Pending` using
the §5 template. If `dry-run`, log to stdout instead.

### Step 6 — Commit + push

If no findings: print `playtest <date>: clean. No commit.` and
exit.

If findings:

```bash
git add plan/AUDIT.md
git commit -m "$(cat <<'EOF'
playtest: <date> — <N> finding(s) filed

<bullet per finding: [score] one-line>

Observed: <one-line context — e.g. "walked Hovel → Crossing → Hanged
Wood → combat with MOURNFUL GULL lvl 2">.
EOF
)"
git push origin main
```

### Step 7 — Done

Print 3-line summary:

```
playtest <date> complete.
<N> findings filed (top: <one-line>).
Plan/AUDIT.md updated; iterate will triage.
```

## 7. Hard rules

1. **Never start the dev server.** If `pnpm web` isn't
   running, file `[needs-user-call]` and exit. The user is the
   only one who can start a long-running process Claude can
   reach.
2. **Never modify shipped code.** This skill is observation
   only. Findings go to AUDIT; fixes go through `/iterate`.
3. **Close the browser cleanly.** Leaking Playwright tabs
   wastes resources across sessions.
4. **Clean up screenshot artifacts.** Loose `playtest-*.png`
   files in the repo root pollute the working tree.
5. **Cap at 5 filed findings per pass.** A wall of findings
   means the playtest is the wrong tool — escalate to
   `/oversight`.
6. **No emojis. No `Co-Authored-By:`.**

## 8. Failure modes

1. **`pnpm web` not running** → `[needs-user-call]` to AUDIT,
   exit.
2. **Playwright MCP unavailable** → exit with error log; the
   user needs to enable the MCP server.
3. **Encounter walk doesn't reach combat** (every reachable
   node is non-encounter) → file an AUDIT row "no encounter
   node reachable from current location" and exit; the user
   may need to invoke `/debug seed map reset` or similar.
4. **Bundle errors at navigate time** (Expo crash, 500
   response) → file AUDIT, exit.
5. **Tool call timeout** during the walk → record what got
   walked, file AUDIT, exit.
6. **`git pull` divergence** → stop per /march hard rule.

## 9. Quick reference

```bash
# Prereq smoke
curl -s -o /dev/null -w "HTTP %{http_code}\n" --max-time 5 http://localhost:8081/

# Walk (each line is a Playwright MCP tool call)
mcp__playwright__browser_resize width=414 height=896
mcp__playwright__browser_navigate url=http://localhost:8081
mcp__playwright__browser_snapshot
mcp__playwright__browser_click target=<ref to step-card>   # ... walk ...
mcp__playwright__browser_click target=<ref to FIGHT>
mcp__playwright__browser_click target=<ref to stance>
mcp__playwright__browser_click target=<ref to ATTACK>
mcp__playwright__browser_click target=<ref to NEXT ROUND>
mcp__playwright__browser_console_messages level=warning
mcp__playwright__browser_close

# Clean + commit
rm -f playtest-*.png
git add plan/AUDIT.md
git commit -m "playtest: <date> — <N> finding(s)"
git push origin main
```

## 10. Reference: example walk from oversight 28th call (2026-05-22)

The 28th `/oversight` call ran a live-drive playtest by hand;
the procedure above codifies that walk. Reference for what a
clean playtest looks like:

- Loaded `http://localhost:8081` → landed on `/exploration` at
  Hovel.
- Tapped "Travel to Crossing" (II leagues, gather node).
  Crossing became "here"; Hanged Wood + Drowned Shrine
  opened.
- Tapped "Travel to Hanged Wood" (II leagues, encounter
  node — `sword` icon per the [3.5] fix). Encounter modal
  mounted: MOURNFUL GULL, level 2, 60 hp. FIGHT chrome
  `ii · 60 vitae · adv. unknown`. FLEE chrome `forfeit the
  path · -ii morale`.
- Tapped FIGHT. Combat panel mounted. Player HUD: `HP 10/10`
  (later filed as `[5.5]` AUDIT row — mismatched against
  exploration card's `HP 22/38`).
- Tapped BODY stance. Phase advanced I·STAND past → II·DO
  current.
- Tapped ATTACK. Phase advanced II·DO past → IV·LET current.
  ResolvePanel: 17 vs 0, ADVANTAGE, STRIKE LANDS, -14
  damage. Battle log gained "You apply Ad Baculum. Your
  blade lands — 14 damage."
- Tapped NEXT ROUND. Combat continued — enemy 60→46 hp,
  round 2 with stance picker re-opened. Did not exit
  combat (Phase 65 [9.5] Next Round fix confirmed).
- Console: 0 errors, 3 warnings (deprecation tracking row
  `[2.5]`).
- Closed browser cleanly.

That walk took ~2 minutes and surfaced one new MED finding
(`[5.5]` HP scaling) that the code-read audits had missed.
