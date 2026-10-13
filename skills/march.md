# Skill: march

> **Outer dispatcher.** Reads project state and delegates to one
> of the shipping skills. Designed for `/loop` and the `march`
> workflow.

## 1. Purpose

`/loop /march` picks the right thing to do every tick. The chain is:

```
unlabeled or loop:do issues        →  /triage
ELSE critique due (rate-limited)   →  /critique
ELSE PR cap reached (§3)           →  report "waiting on T", end
ELSE next pickable phase           →  /ship-a-phase
ELSE expand due + bold posture     →  /expand
ELSE                               →  /iterate
```

First match wins. Every "due", "pickable" and "cap" test lives in §3,
the one home for gate logic; other verbs point here rather than
repeating it. §3 also owns **Landing a change** (the PR flow,
D84–D87) and the **Retro**, so every verb lands code and learns the
same way.

This is the upstream nexus chain (`daretodave/nexus`
`templates/skills/march.md`) minus its `/ship-data` step, which this
project never adopted. Red `main` is not a march step: the
`ci-autofix` workflow runs `/fix-ci` on its own the moment a
`verify-*` run fails on `main`, and `pr-autofix` does the same for a
red `loop:pr` PR (D87).

Standing rules the chain carries (Phase R11, 2026-10-12):

- **Code lands by PR; T merges** (D84, D86). Plan-only and telemetry
  commits still push `main` (§3 "Landing a change").
- **The loop builds only briefed rows** (§3 "Pickable phase"). A row
  with no brief is filed as "needs a brief: `/plot <N>`"; the loop
  never authors a brief.
- **Content per surface** (D88). THE CARD HOLD (D37): no card or
  keyword is made outside a guided session with T; art is owner-only
  too (B8). Enemies, relics, maps, NPCs and events are built only from
  a row whose brief T wrote or approved; `/expand` may propose them as
  candidates (D89).
- **`/plot` and `/messy` are T's intake.** No march step, cron,
  workflow or loop verb fires them; they run only in a conversation
  with T (AGENTS.md rule 8).
- **Every closing verb ends with a Retro** (§3 "Retro").

## 2. Invocation

```
/march                       # one tick: dispatch + execute
/loop 30m /march             # autonomous loop, every 30 min
/loop /march                 # self-paced autonomous loop
```

## 3. Gates (the one home)

Every rate limit and eligibility test the loop uses is defined
here. `skills/critique.md`, `skills/expand.md` and
`skills/iterate.md` cite this section instead of carrying copies.

`GH_TOKEN` / `GH_REPO` are loaded in §4 Step 0. If `gh` isn't
installed or `GH_TOKEN` is missing, a `gh`-based gate reads as
"not met": log a warning and fall through. **Don't fail the
march** on a missing token. The PR cap is the exception: with no
`gh`, nothing can land by PR, so the tick builds no code (report it;
plan-only verbs still run).

### Critique due

Read the metadata header at the top of `plan/CRITIQUE.md`:

```
> Last pass: <ISO-date> at commit <sha>
> Pass count: <N>
```

Due when **all three** hold:

1. The current commit is at least **12 commits after** `Last
   pass`, OR `Last pass` is more than **24 hours ago**, OR `Last
   pass` is "never" and at least one phase has shipped.
2. `npm run deploy:check` shows a green deploy.
3. No pending HIGH critique row is already queued in
   `plan/CRITIQUE.md` `## Pending`.

### Expand due

Decides whether `/march` dispatches `/expand` (§4 Step 4) and
whether `/iterate` hands an empty tick to `/expand`
(`skills/iterate.md` §6, failure mode 6).

Read `plan/bearings.md` → "Plan expansion posture", then the
metadata header at the top of `plan/PHASE_CANDIDATES.md` (same
shape as CRITIQUE's). Due when **all four** hold:

1. Posture is not **strict**.
2. The current commit is at least **20 commits after** `Last
   pass`, OR `Last pass` is more than **48 hours ago**, OR `Last
   pass` is "never" and at least **3 phases have shipped**.
3. There is at least one signal worth examining: `plan/AUDIT.md`
   has Pending rows, OR `plan/CRITIQUE.md` has Pending rows, OR
   `git log -p --since="<last pass>" -- spec.md plan/revamp/
   axiomancer-mechanics/specs/` shows changes (a spec marked
   HISTORICAL is not a signal).
4. No phase is pickable (below).

### Pickable phase

Open `plan/steps/01_build_plan.md` → "Status (at-a-glance)". The
next pickable phase is the **first** `[ ]` row, in file order,
that:

1. is not marked **attended** — attended phases are shipped in a
   session with T;
2. has every phase named in its `Requires …` clause ticked `[x]`
   on `main`;
3. **has a brief**: `plan/phases/phase_<N>_*.md`, or the part-plan
   section its row points to. A row with none is not pickable: file
   one `plan/PHASE_CANDIDATES.md` row "needs a brief: `/plot <N>`"
   (once; skip if it exists) and move on. The loop never authors a
   brief; `/plot` and attended `/plan-a-phase` do;
4. **is not claimed** by an open `loop:pr` PR (below, "Claims").

Rows marked `[x]`, `[-]`, `[skipped]` or `[blocked: …]` are
never pickable. A blocked row (including every owner-led B-row)
is a conversation for `/oversight` or T's session, not work for
this tick.

### PR cap (D85)

```bash
open_prs=$(gh pr list --repo "$GH_REPO" --state open --label loop:pr \
  --json number,title,createdAt,labels 2>/dev/null || echo '[]')
count=$(echo "$open_prs" | jq 'length')
```

At **3 or more** the cap is reached: the tick runs triage (Step 1)
and, if due, critique (it files findings only and pushes `main`),
then reports
`waiting on T: PRs #a, #b, #c` and ends. Every tick, capped or not,
also lists in its output:

- each open `loop:pr` PR older than **7 days** ("open 7d+, waiting
  on T"); the loop never closes one (D86);
- each PR labelled `loop:pr-stuck` (`pr-autofix` gave up after two
  runs, D87), with its number and failing check.

### Claims

An open `loop:pr` PR is the claim on the work it carries. Its title
names the claim: `phase <N>` for a build-plan row, the queue item's
ID (`AUDIT <id>`, `CRITIQUE <id>`) for a fix. `/march`,
`/ship-a-phase` and `/iterate` skip any row or item an open PR's
title names. No `claims` branch is needed while one loop runs at a
time (`plan/PHASE_CANDIDATES.md` holds that candidate).

### Landing a change (the PR flow, D84–D87)

A diff is **plan-only** when every path is under `plan/`,
`telemetry/`, `docs/reports/` or `devlog/entries/`. Plan-only commits (queue rows, pass
counters, lessons, build-plan bookkeeping) commit and `git push
origin main` as before. **Anything else lands by PR:**

```bash
git fetch origin main
git switch -c "loop/<verb>-<slug>" origin/main     # before the first edit
# edit, verify, commit (plain bodies, AGENTS.md rule 2)
git push -u origin "loop/<verb>-<slug>"
gh label create loop:pr --repo "$GH_REPO" --color 0E8A16 \
  --description "Loop-opened PR; T merges (D84-D87)" 2>/dev/null || true
gh pr create --repo "$GH_REPO" --base main --head "loop/<verb>-<slug>" \
  --label loop:pr --title "<subject naming the claim>" --body-file "$body"
gh pr checks "loop/<verb>-<slug>" --repo "$GH_REPO" --watch --fail-fast
```

- **One PR per tick**, never one per fix. Each PR carries only this
  session's telemetry shard, so two PRs never add the same file
  (lesson `telemetry-add-add`). The plan-only commits that
  record the PR's own work (the build-plan tick, the AUDIT or
  CRITIQUE row it closes, the retro) ride in the PR; unrelated queue
  bookkeeping pushes `main`.
- **Body template** (`scripts/loop-pr.test.mjs` pins its shape):

  ```markdown
  ## What shipped
  - <2-5 bullets>

  ## What T can now do
  - <1-3 bullets, player- or owner-facing>

  ## Decisions
  - <autonomous call: picked X over Y because ...>

  ## Acceptance
  - [x] A1 <the brief's acceptance ID and text>

  ## Verify
  - `<command>` -> <summary>

  Closes #<mirror issue>
  ```

  `## Acceptance` lists the brief's IDs the PR closes; drop the
  section for a fix with no brief. `Closes #<N>` is the last line, one
  issue per line; `close-trailers` reads it from the commit range of
  the merge push, so put the same trailer in the PR's last commit.
- **`gh pr checks --watch` replaces `deploy:check`** for the branch
  (the `verify-*` workflows run on `pull_request`). Red on this tick's
  own change: fix on the branch (push, never force), up to 3
  same-root-cause tries. Still red when the tick must end: leave it;
  `pr-autofix` takes it (two runs, D87).
- **Never** enable auto-merge, merge the PR, close it, or force-push
  its branch. T merges (D86).
- **Check the cap and claims before cutting the branch.**
- Attended sessions with T may still push `main` at T's word.

### Retro

Closes `ship-a-phase`, `iterate`, `critique`, `fix-ci` and `plot`,
even a tick that shipped nothing. Lesson format and the ladder live
in the `plan/lessons.md` header; `scripts/check-lessons.mjs` lints it.

1. Did anything in this tick bite (a wrong assumption, a step that
   misled, a red check, a retry)? If it matches a lesson, bump its
   `seen N×` and `last` date; if not, add one under its `@domain:`.
2. A lesson now **seen 2×** is automated in this tick (a guard check,
   a test, a lint) and marked `guarded by <hook/test>`; if the
   automation is a phase of its own, file a `PHASE_CANDIDATES` row
   naming it.
3. A lesson seen **3× across verbs** may be promoted to
   `plan/reflexes.md` directly; `/oversight` reviews promotions after
   the fact (THE OPEN GATE).
4. If one of the verb's own steps misled you, tighten that step (it
   may only get safer or clearer).
5. "retro: clean" is a valid outcome and needs no commit. Otherwise
   commit `lessons: retro <verb> <N>` (plan-only: it rides the tick's
   PR if there is one, else pushes `main`).

## 4. Procedure

### Step 0 — Sync and load the token

```bash
git switch main 2>/dev/null; git pull --ff-only

export GH_TOKEN=$(awk -F= '/^GH_TOKEN=/ {sub(/^GH_TOKEN=/, ""); print; exit}' .env)
export GH_REPO=$(awk -F= '/^GH_REPO=/ {sub(/^GH_REPO=/, ""); print; exit}' .env)
GH_REPO=${GH_REPO:-no-trbl-2-u/Axiomancer}
```

If divergence, stop per §6.

### Step 1 — Triage (cheapest check)

Count unlabeled open issues:

```bash
unlabeled=$(gh issue list --repo "$GH_REPO" --state open \
  --search "-label:triage:loop-queued -label:triage:closed -label:triage:reviewed -label:loop:opened" \
  --json number --jq 'length' 2>/dev/null || echo 0)

# Concierge lane — loop:do outranks everything, even labeled
# issues; the user said "this one, now".
urgent=$(gh issue list --repo "$GH_REPO" --state open \
  --label loop:do --json number --jq 'length' 2>/dev/null || echo 0)
```

If `urgent > 0` or `unlabeled > 0`:

- Read `skills/triage.md`.
- Execute its procedure end-to-end.
- Return.

Otherwise fall through to Step 2.

### Step 2 — Critique due?

Check §3 "Critique due". If due:

- Read `skills/critique.md`.
- Execute its procedure end-to-end (plan-only; it never opens a
  PR, so the cap does not stop it).
- Return.

Otherwise fall through to Step 2.5.

### Step 2.5 — PR cap reached?

Check §3 "PR cap". At the cap: report `waiting on T: PRs #a, #b,
#c`, plus any 7d+ or stuck PRs, and return.

### Step 3 — Next phase

Find the next pickable phase per §3 "Pickable phase". If there
is one:

- Read `skills/ship-a-phase.md`.
- Execute its procedure end-to-end on that phase. It lands by PR
  (§3 "Landing a change").
- Return.

Otherwise, if a `[ ]` row exists but none is pickable, note in
the tick's output which row is waiting and why (attended,
`Requires` unmet, owner-led, no brief, claimed by PR #N), then fall
through to Step 4.

### Step 4 — Expand due?

Check §3 "Expand due". If due:

- Read `skills/expand.md`.
- Execute its procedure end-to-end.
- Return.

Otherwise fall through to Step 5.

### Step 5 — Iterate (default)

- Read `skills/iterate.md`.
- Execute its procedure end-to-end.
- Return.

## 5. Hand-off honesty

When you dispatch into a child skill, **fully adopt its
contract**. Hard rules, failure modes, commit conventions,
verify gate. `/march` itself doesn't add rules; it inherits.

A march tick succeeds iff the child tick succeeds.

## 6. Failure modes

`/march` itself only fails on:

1. **`git pull` divergence.**
2. **State files corrupted or missing** (build plan, AUDIT,
   CRITIQUE). Stop and report — don't reconstruct silently.

Otherwise inherited from the dispatched skill.

## 7. Quick reference

```bash
# State files
plan/steps/01_build_plan.md          # pending phases
plan/revamp/README.md                # the revamp record; part plans beside it
plan/CRITIQUE.md                     # critique queue + last-pass metadata
plan/PHASE_CANDIDATES.md             # expand last-pass metadata (§3 expand gate)
plan/lessons.md                      # retro ladder (§3 "Retro")

# External signals
gh issue list ...                    # unlabeled / loop:do count
gh pr list --label loop:pr ...       # PR cap, claims, 7d+ and stuck PRs
npm run deploy:check                 # green-deploy condition (main)

# Skills it dispatches into
skills/triage.md                     # Step 1 (cheapest)
skills/critique.md                   # Step 2 (rate-limited)
skills/ship-a-phase.md               # Step 3 (next pickable phase)
skills/plan-a-phase.md               # brief format (attended)
skills/expand.md                     # Step 4 (rate-limited, posture-gated)
skills/iterate.md                    # Step 5 (default)

# Not march steps
skills/fix-ci.md                     # ci-autofix (red main), pr-autofix (red loop:pr)
skills/plot.md, skills/messy.md      # T's intake; only T fires them
```
