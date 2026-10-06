# Skill: iterate

> **Full autonomy.** Audit the project, pick the highest-impact
> weakness, ship one improvement end-to-end. The post-build
> loop. Drains queues from `/critique` and `/triage` alongside
> its own audit.

> **REVAMP MODE (D58, since 2026-09-28; ends when Phase R11 ships).** The
> loop's phase work is only the ratified revamp build plan
> (`plan/steps/01_build_plan.md`; part plans in `plan/revamp/`). It creates
> no content of any kind: cards, keywords, enemies, relics, maps, NPCs, events
> or art. `/iterate` and `/expand` still run when no phase is ready, under the
> same no-content rule. THE CARD HOLD (D37) stands: no card or keyword is made
> outside a guided session with T. The content stewards, `/forge` and the
> `card-expert`, `content-curator`, `mechanics-expert` and `reader` agents
> were archived in R0; never route work to them. R11 revisits the loop to
> bring content phases back.

## 1. Purpose

A quality pass on already-shipped surfaces: bugs, drift, debt,
docs, tests, accessibility, performance. It fills nothing in —
new content is T's (D58), so a finding whose fix would be
content is **filed, not shipped** (§3).

`/march` dispatches `/iterate` as its default step when nothing
else is due (`skills/march.md` §4 Step 5).

## 2. Invocation

```
/iterate                    # full audit, ship the top finding
/iterate audit              # audit-only; emit plan/AUDIT.md
/iterate <focus>            # bias toward one category (see below)
/loop 1h /iterate           # autonomous improvement loop
```

`<focus>` is one of the §4 category tokens: `external-critique`,
`divergence`, `contract`, `docs`, `debt`, `gap`, `a11y`, `tests`,
`perf`. (`content` is audited but never picked, so it is not a
focus.)

## 3. Autonomy contract

- **Many findings → one shipped fix per tick.** Multi-fix
  commits are unreviewable.
- **No content fixes.** A finding whose fix would create or
  rewrite content — cards, keywords, enemies, relics, maps, NPCs,
  events, art, dialogue or flavor prose — is written to
  `plan/AUDIT.md` with `next: file — content (D58)` and never
  picked. Card and keyword findings also wait on THE CARD HOLD
  (D37). Correcting a broken reference or a typo in existing UI
  text is a fix, not content.
- **Trivial fix → still ships through verify.**

## 4. The audit

Score every finding `0–10` for `impact × ease`. Bias toward
shipping cheap wins.

### User-source bump (from `/jot`)

Findings with `source: user` (filed via `/jot`) get a flat
**`+0.5`** on their final score, capped at `10`. Apply this
**after** `impact × ease / 10` and **before** the user-set
bias multiplier below.

Rationale: when the user has spotted something with their own
eyes, it's almost always more valid than what the audit
auto-detected. The flat add (rather than a multiplier) means
high-severity user jots don't blow past everything; they just
edge ahead of comparable auto-detected findings at the same
severity.

### User-set bias (from `/oversight`)

Before scoring, check the top of `plan/AUDIT.md` for:

```
> Bias: <category> (set via oversight <date>)
```

If present, **multiply scores in that category by 1.5**. Sticky
until cleared via `/oversight reset`. Apply this **after** the
user-source bump above (so the multiplier sees the bumped
score, but the cap at `10` still holds).

### Audit categories

#### Z. External critique (`external-critique`, highest priority when present)

`plan/CRITIQUE.md` `## Pending` is a finding source. Each row
maps to category `external-critique`. Severity → impact:
HIGH 8–10, MED 5–7, LOW 2–4. Ease scored from suggested-fix
complexity. When you ship a fix, **move row Pending → Done**
in CRITIQUE.md with `[x]` + commit hash.

#### A. Content (`content`, file only)

- Gaps or faults whose fix is new or rewritten content (§3).
  Record them so T sees them; never pick one.

#### B. Spec divergence / contract drift (`divergence`, `contract`)

- Implementation diverging from the revamp part plans
  (`plan/revamp/`) or a live spec in `axiomancer-mechanics/specs/`.
  Where they disagree the revamp plan wins; a spec marked
  HISTORICAL is not a divergence source.
- Cross-package contracts (types, event shapes) drifting between
  the engine and the mobile app.

#### C. Docs / debt (`docs`, `debt`)

- Stale or missing docs; README drift.
- Known debt: TODO clusters, dead code, duplicated logic.

#### D. Navigation / flow gaps (`gap`)

- Screens or routes unreachable or dead-ended in the
  running expo-web build.
- References to content or encounters that don't exist.

#### E. Accessibility (`a11y`)

- Touchables without `accessibilityLabel` / `accessibilityRole`,
  contrast failures, touch targets too small to hit.

#### F. Tests (`tests`)

- Components without colocated tests.
- E2E spec gaps. Untested helpers.

#### G. Performance (`perf`)

- Heavy image assets, bundle size regressions, slow engine or
  simulation paths, needless re-renders in the app.

### Scoring

- Impact 0–10: how many players / screens / packages affected?
- Ease 0–10: cheap fix = 9. New module = 4. Save migration = 1.
- Score = `impact × ease / 10`, clamped 0–10.

Top 1 non-`content` finding wins. Tie-break: cascading
findings, older findings, cheapest-to-ship.

## 5. Procedure

### Step 0 — Sync

```bash
git pull --ff-only
```

### Step 1 — Audit (or read latest)

Run §4. Write to `plan/AUDIT.md`.

**Durable rows survive the rewrite.** The audit section (`#
Site audit — <date>` + Top 5) is yours to regenerate each
pass. Everything else in the file is durable and must be
preserved verbatim when you rewrite: the `> Bias:` line (only
`/oversight reset` clears it), `[needs-user-call]` rows, and
`[user-issue #N]` rows routed by `/triage` that you are not
addressing this tick. Losing a queued user issue in an audit
rewrite is a state-integrity failure, not tidying.

Audit block shape:

```markdown
# Site audit — <ISO date>

## Top 5 findings (scored)

### [8.1] <one-line description>
- category: <contract | divergence | debt | gap | content | docs | tests | a11y | perf | external-critique>
- impact: <0-10>
- ease: <0-10>
- next: <action — invocation, sub-agent, or follow-up>
```

### Step 2 — Pick the work

Top scored. If `/iterate audit`, stop here.

### Step 2.5 — Mirror to GitHub

Open a public GitHub issue mirroring the picked finding **before**
the work starts. The repo's Issues tab becomes a live timeline of
"what the loop is shipping right now"; the issue opens when work
starts and closes when the fix commit, carrying a `Closes #N`
trailer, reaches `main` (the `close-trailers` sweep, Step 5).

Skip this step in two cases:

1. The picked row already has an `- issue: #N` field (a previous
   tick mirrored it but didn't ship the fix; reuse the same number).
2. The picked row came from `/triage` routing (an `[user-issue
   #N]`-prefixed AUDIT.md row, or a `(issue #N)` reference); the
   issue already exists publicly. Reuse `#N`.

Otherwise:

```bash
# 1. Build the body file from the finding row.
issue_body=$(mktemp)
cat > "$issue_body" <<EOF
**Source:** <pass description, e.g. "/critique pass 2 (playtester sub-agent)" or "/jot <date>" or "/iterate audit <date>">
**Severity:** <HIGH|MED|LOW> · **Category:** <category from row> · **URL:** <url-or-"general">

## Observation
<verbatim from row's "observation" field>

## Evidence
<verbatim from row's "evidence" field>

## Suggested fix
<verbatim from row's "suggested fix" field>

---
_Tracked by the autonomous loop. The fix lands as a commit with \`Closes #<this-issue>\` in the body; the \`close-trailers\` workflow closes this issue when the commit reaches main._
EOF

# 2. Map row severity → helper flag.
#    [HIGH] → high · [MED] → med · [LOW] → low
# 3. Map row "source" field → helper flag.
#    user → user · playtester → reader · audit/iterate → audit · external → external
#    ("reader" is the helper's label for critique findings, not the archived agent.)
# 4. Map row category → helper category.
#    visual / voice / navigation / mobile / external-critique → enhancement
#    content (copy/content gap) → content
#    a11y → a11y · docs → docs · perf → perf
#    bug-shaped (broken link, regression) → bug
#    Otherwise → enhancement.

# 5. Open the issue.
N=$(node scripts/loop-issue.mjs open \
    --severity <high|med|low> \
    --category <see mapping above> \
    --source <user|reader|audit|external> \
    --title "<one-line summary, ≤ 70 chars>" \
    --body-file "$issue_body")
echo "loop-issue: opened #$N"
```

Capture `$N` (the helper echoes only the number on stdout). On
**any failure** of `loop-issue.mjs open` (auth, rate limit,
network):

- Print stderr to the iterate run log.
- Note the failure inline in the row as
  `- issue: [mirror-failed: <ISO timestamp>]` so the next tick
  retries.
- Continue with the fix. **The mirror is best-effort, not gating**
  (Hard rule §7.7).

If the open succeeded, record the number on the row before
shipping. The CRITIQUE.md/AUDIT.md row gains a new line:

```markdown
- issue: #<N>
```

This row update is committed in Step 6 (Tick the audit), not
separately — keep tick churn low.

### Step 3 — Delegate or implement

Default delegation:
- Contract / divergence / debt / docs / gap / a11y / tests → main
  agent. The `kb-query` and `axio-query` MCP tools are callable
  directly when a fix needs prior art or an engine fact.
- Performance → main agent; may delegate to `scout` for
  external benchmarking.

For research-heavy fixes, spawn `scout` in parallel.

### Step 4 — Verify

```bash
npm run verify
```

Iterate up to 3 times on same root cause.

### Step 5 — Commit

Commit subject prefixes:
- `content:` — corrections to existing player-facing text (typos,
  stale names). Never new content (D58).
- `docs:` — documentation.
- `fix:` — bug fixes, broken flows, regressions.
- `a11y:` — accessibility.
- `test:` — test additions or fixes only.
- `perf:` — performance work.
- `refactor:` — structural cleanup, no behavior change.

Body lists audit finding ID/score, the fix, verify result.

**If the addressed finding has an `- issue: #N` field on its row**
(populated either by Step 2.5 above, or carried in from `/triage`
routing), close the loop on GitHub in the same flow:

```
# Trailer in commit body — the close-trailers sweep reads it
- Closes #42
```

The `- Closes #<N>` trailer is **mandatory** in the commit body
when the row carries an issue number; it is the closing mechanism.
GitHub's native parser does not act on it in this repo (Phase 48).
`.github/workflows/close-trailers.yml` sweeps every push to `main`,
reads the closing keywords out of each commit in the range, and
closes the named issues through the API. Multiple issues can be
closed in a single commit by listing one trailer line per issue.

Load `GH_TOKEN` and `GH_REPO` from `.env` first if they aren't
already in the env (see `skills/triage.md` §3). The
`loop-issue.mjs` helper does this internally; manual `gh` calls
outside the helper need to do it themselves.

```bash
git add <explicit files>
git commit -m "<category>: <subject>"
git push origin main
```

### Step 6 — Tick the audit

Flip the addressed finding `[ ]` → `[x]` in `plan/AUDIT.md`.
For external-critique findings, also move row Pending → Done in
`plan/CRITIQUE.md`. Commit:

```bash
git add plan/AUDIT.md plan/CRITIQUE.md
git commit -m "audit: finding [<id>] addressed"
git push origin main
```

### Step 7 — Confirm deploy

```bash
npm run deploy:check
```

**Once deploy:check is green and the row carried an `- issue: #N`,
post the close-comment** (posts the deploy-URL comment AND actively
closes the issue via the API. The load-bearing close is the
`close-trailers` sweep reading the commit's `Closes #N` trailer
(Step 5); this call adds the deploy comment and is idempotent if
the sweep already closed it):

```bash
node scripts/loop-issue.mjs close-comment \
  --number <N> \
  --commit <commit-sha> \
  --deploy-url <ci-run-url>
```

Failures of `close-comment` are warnings, not blockers — the fix
shipped; the close is best-effort like the rest of the mirror.
Continue to Step 8.

If this tick ends before `deploy:check` goes green, this comment
never posts — but `.github/workflows/deploy-comment.yml` (Phase 91)
is the floor underneath it: it fires on the gated `verify-*`
workflows' own completion, independent of this tick's lifetime, and
posts the same comment once CI is actually green.

### Step 8 — Done

Return cleanly. Loop's next tick re-audits.

## 6. Failure modes

1. **`npm run verify` fails ≥3 times on same root cause.**
2. **`npm run deploy:check` fails ≥3 times on same root cause.**
3. **`GH_TOKEN` missing.**
4. **Finding requires schema migration > 20 records.** Push to
   `/plan-a-phase`.
5. **Finding requires owner-flavored judgment.** Decide it (THE
   OPEN GATE, `plan/bearings.md`, 2026-08-28), file the call to
   AUDIT.md as `[loop-call]` with reasoning, and ship — or, if the
   evidence genuinely cannot support a call this tick, file the
   `[loop-call]` with the leading option named and ship next. A
   call about content or card work is never the loop's: file it
   (§3).
6. **No actionable iterate work** (top non-`content` score
   < 3.0). Read `plan/bearings.md` "Plan expansion posture":
   - **bold** posture → dispatch to `/expand` instead of
     stopping. "Make things brilliant when delivery is not."
     Log "no actionable iterate work — handing to expand" and
     execute `skills/expand.md` procedure end-to-end.
   - **strict** posture → stop and report.
7. **`git pull` divergence.**

## 7. Hard rules

1. **One fix per tick.**
2. **Verify gate must pass.** No `--no-verify`.
3. **No emojis. No `Co-Authored-By:`.**
4. **No content.** Content findings are filed, never shipped
   (§3, D58); card and keyword work waits on THE CARD HOLD (D37).
5. **Don't audit blindly when work is queued.** If
   `plan/CRITIQUE.md` has Pending rows, prefer draining those
   over a fresh audit.
6. **Never delete shipped content silently.** Archive +
   update routing.
7. **Issue mirror is best-effort, not gating.** If
   `loop-issue.mjs open` fails (auth, rate limit, network), note
   `- issue: [mirror-failed: <ISO timestamp>]` on the row and ship
   the fix anyway. Likewise, `close-comment` failures after a
   green deploy are warnings, not blockers. The mirror is a
   public timeline, not a verification step.

## 8. Quick reference

```bash
# Read
plan/AUDIT.md                            # latest findings
plan/CRITIQUE.md                         # external-critique queue
plan/bearings.md                         # voice + standing decisions

# Sub-agents
Agent({ subagent_type: "scout", prompt: "..." })            # web research

# Verify + commit + push + deploy
npm run verify
git add <explicit files>
git commit -m "<category>: <subject>"
git push origin main
npm run deploy:check

# Issue mirror
node scripts/loop-issue.mjs open --severity ... --category ... \
  --source ... --title "..." --body-file "$(mktemp)"
node scripts/loop-issue.mjs close-comment --number N --commit SHA \
  --deploy-url <ci-run-url>
```
