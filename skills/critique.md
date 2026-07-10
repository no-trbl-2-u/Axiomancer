# Skill: critique

> **External observer.** Play the local expo-web build as a
> first-time player, take notes, self-assess, append durable findings to
> `plan/CRITIQUE.md`. `/iterate` reads CRITIQUE.md as a finding
> source — that's the **address loop** half.
>
> **Rate-limited** by `/march` (≥12 commits + ≥24h spacing,
> green-deploy required). Cap of 6 filed findings per pass.

## 1. Purpose

The autonomous loop is good at shipping what it was told to
ship. It's bad at noticing when the shipped result doesn't
play well as a real first-time player would experience it.

`/critique` is the corrective lens.

## 2. Invocation

```
/critique                    # full pass — see auth handling below
/critique <url>              # focused pass on one screen / route
/critique mobile             # 375×800 only
/critique desktop            # 1280×800 only
/critique anonymous          # public/anonymous pass only (skip auth)
/critique authenticated      # logged-in pass only (requires Auth: != none)
```

**Auth handling.** Read `plan/bearings.md`'s `Auth:` line on
entry:

- `Auth: none` → single anonymous pass (the default for
  this project — the game has no login).
- `Auth: <other>` → default `/critique` runs **two** passes
  in sequence: an anonymous pass, then an authenticated
  pass. Each pass spawns its own `playtester` invocation so
  the bot's session doesn't pollute the anonymous walk.
- Argument `anonymous` / `authenticated` runs only that
  pass.
- `Auth:` field missing → exit with `[needs-user-call]`. Do
  not guess.
- See `nexus/customization/auth-aware-critique.md` for
  patterns and env vars.

When invoked from `/march`, conditions are pre-checked.

## 3. The screen set (default full pass)

Pick **representative**, not exhaustive. The e2e suite
already covers every screen; critique is for *quality*.

### Screen set (always)

| Screen | Why critique it |
|---|---|
| Title / landing screen | First impression. The fold matters. |
| New-game / onboarding flow | Where a first-time player forms their model of the game. |
| A canonical combat encounter | The game's core loop as actually played. |
| Town / exploration hub | Navigation, voice, and orientation. |
| An empty or early-progression state | Often where the experience breaks down. |

Skip screens that don't exist yet. Note in pass log.

## 3.5 Known limitation (unattended ticks)

The `playtester` sub-agent's Playwright MCP tool grants have not
propagated into Agent-tool sub-agent contexts for 8 consecutive
unattended passes (`plan/CRITIQUE.md` Done section — "Playwright MCP
tools unavailable to sub-agents"). Decided via `/oversight`
2026-07-10: build-plan **Phase 34** gives unattended `/critique`
ticks a headless, non-Agent-tool transport instead of retrying the
grant. Until Phase 34 ships, an unattended `/critique` invocation
that gets the same "you haven't granted it yet" rejection on its
first `playtester` call should log the occurrence in
`plan/CRITIQUE.md` and exit — do not re-diagnose the grant mechanism
again; that's closed.

## 4. Delegate to `playtester`

The `playtester` sub-agent at `.claude/agents/playtester.md` is
the fresh-eyes observer. **Always delegate the playthrough.**
Reasons:

- It has Playwright tools (`mcp__playwright__*`) to actually
  drive the local expo-web build.
- Fresh sub-agent context = genuine first-time-player perspective.
- Output is structured JSON; easy to filter and file.

Pass it:
- The screen list.
- The **pass mode** (`anonymous` or `authenticated`).
- Voice cue from `plan/bearings.md`.
- Current `plan/CRITIQUE.md` Done section (so it doesn't
  re-surface addressed findings).
- Focus areas from invocation argument.

It returns a JSON array of findings, each carrying
`auth_state`. When the default invocation runs both passes,
spawn `playtester` **twice** (once per mode) and concatenate
results before §6 (self-assessment + filing).

Findings tagged `auth_state: "auth-failed"` are filed as
`[needs-user-call]` in `plan/CRITIQUE.md`'s Pending block —
not scored as product bugs. The user resolves the auth
config (refresh the session cookie, fix the login selectors,
etc.) and the next pass re-runs.

## 5. The procedure

### Step 0 — Pre-flight

```bash
git pull --ff-only
npm run deploy:check
```

If no green deploy: defer. Write a one-line entry to CRITIQUE.md
"deferred at <date>: no green deploy" and exit 0. **Don't commit
on no-ops.**

Ensure the local expo-web build is running (serves at
`http://localhost:8081`); start it if needed before spawning
the playtester.

### Step 1 — Build the screen set

Default §3. Adjust based on argument, phase progress (skip
non-existent screens), recent shipping focus.

### Step 2 — Spawn `playtester`

```
Agent({
  subagent_type: "playtester",
  prompt: "Play the local expo-web build at http://localhost:8081
           as a first-time player. Cover these screens: [list].
           Voice cue from plan/bearings.md: <quote>.
           Already-addressed (skip): <Done section>.
           Focus: <from arg or 'general'>.
           Return ≤ 8 findings as JSON per your output spec."
})
```

Wait for return.

### Step 3 — Self-assess

The playtester returns observations; you decide which deserve to land.
For each:

1. **Valid?** Can evidence be re-verified? Drop session-specific
   artifacts.
2. **Actionable?** Can a future `/iterate` tick fix with
   resources at hand? If not, file as `[needs-user-call]`.
3. **Duplicate?** If CRITIQUE.md has an open row for this exact
   issue, drop new + bump older's severity.
4. **Severity match impact?** Re-rate if needed.
5. **Suggested fix sane?** If contradicts bearings or contracts,
   replace with compatible fix.

After assessment, **3–6 findings**, not 8.

### Step 4 — Append to `plan/CRITIQUE.md`

```markdown
# Critique log

> Last pass: <ISO date> at commit <sha>
> Pass count: <N>

## Pending

### [HIGH] /<url> — <one-line>
- pass: <N> (commit <sha>)
- viewport: desktop | mobile
- category: <visual | comprehension | navigation | voice | mobile | performance | a11y>
- observation: <what was seen>
- evidence: <screenshot region | quoted text | console msg>
- suggested fix: <one-line concrete change>
- source: playtester

## Done

### [x] [MED] <url> — ... (pass <N>; addressed at <sha>)
```

Update metadata header.

### Step 5 — Commit + push

```bash
git add plan/CRITIQUE.md
git commit -m "$(cat <<'EOF'
critique: pass <N> — <K> findings (<H> high, <M> medium, <L> low)

Played: <list of screens>.
Findings filed to plan/CRITIQUE.md Pending.
Address loop: /iterate will pick the highest-scoring finding.
EOF
)"
git push origin main
```

If **zero** findings (rare): still update metadata, commit
`critique: pass <N> — no findings`. Pass counter is the signal
`/march` reads.

### Step 6 — Confirm deploy

```bash
npm run deploy:check
```

### Step 7 — Done

Return 3-line summary.

## 6. Hard rules

1. **Never modify code, content, or data.** Findings only.
2. **Always delegate the playthrough to `playtester`.** Don't
   play from main agent context.
3. **Self-assess after the playtester returns.** Don't file raw
   observations.
4. **Cap at 6 filed findings per pass.** 8 is the playtester's
   input cap; 6 is your output cap.
5. **Never duplicate Pending or Done entries.**
6. **One commit per pass.**
7. **No emojis. No `Co-Authored-By:`.**

## 7. Failure modes

1. **No green deploy.** Defer.
2. **`playtester` returns malformed output.** Re-spawn once with
   stricter format. If fails again, write single finding "playtester
   sub-agent malfunction at pass <N>", commit, exit 1.
3. **No screens in the set** (very early phases). Defer.
4. **`git pull` divergence.**

## 8. Address loop contract (how `/iterate` consumes findings)

`plan/CRITIQUE.md` `## Pending` is `/iterate`'s queue:
- Each finding has severity + ease (from suggested-fix
  complexity).
- `/iterate` §4 maps to category `external-critique`:
  HIGH→8–10, MED→5–7, LOW→2–4 impact.
- When `/iterate` ships a fix, moves row Pending → Done with
  `[x]` + commit hash.

Critique findings **compete fairly** with other audit sources.

## 9. When `/march` invokes `/critique`

`/march` reads metadata header at top of `plan/CRITIQUE.md`:

```
> Last pass: <ISO-date> at commit <sha>
> Pass count: <N>
```

Conditions to dispatch:

1. **At least 12 commits** after `Last pass` commit, OR
   `Last pass` more than **24 hours** ago, OR `Last pass` is
   "never" and at least one page-family phase has shipped.
2. `npm run deploy:check` shows green.
3. No pending HIGH critique already queued for iterate.

If all three: `/march` calls `/critique` for that tick.

## 10. Quick reference

```bash
# State files
plan/CRITIQUE.md                     # findings queue + last-pass metadata
plan/bearings.md                     # voice, URL contract, Auth: field

# Sub-agent
.claude/agents/playtester.md         # the fresh-eyes observer persona

# Commands
git pull --ff-only                   # Step 0
npm run deploy:check                    # green-deploy precondition
git commit && git push               # single critique: <summary> commit
```

If the app ever sits behind a login wall, the playtester needs
an auth path — see nexus's
[`customization/auth-aware-critique.md`](../../customization/auth-aware-critique.md)
for the five patterns (test-user, session-cookie, bearer-token,
preview-env, magic-link). Never fall back to critiquing the
logged-out shell silently.
