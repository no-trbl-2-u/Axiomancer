# Skill: march

> **Outer dispatcher.** Reads project state and delegates to one
> of the shipping skills. Designed for `/loop`. The
> autonomous-beast entry point.

## 1. Purpose

`/loop /march` is the autonomous-beast mode. It picks the
right-thing-to-do every tick:

```
unlabeled issues exist          →  /triage
ELSE critique due (rate-lim)    →  /critique
ELSE pending phase              →  /ship-a-phase
ELSE content growth due         →  /forge
ELSE expand due + bold posture  →  /expand
ELSE                            →  /iterate
```

Deliveries first: pending phases ship before `/expand`
ever fires. `/expand` only runs when there's no immediate
delivery, OR when its rate-limit window opens (every ~20
commits or ~48h) AND the bearings posture is **bold** or
**autonomous**.

This means: an overnight run can take the project from
"scaffolded" to "shipped, populated, iteratively polished,
critiqued, addressed, inbox-zero on issues, and growing its
own plan when reality outpaces the original spec" without a
mode switch from the user.

The triage check is **cheap when idle** (one API call to count
unlabeled issues). The critique check is **rate-limited**
(≥12 commits + ≥24h spacing, green-deploy required). The
expand check is **rate-limited + posture-gated** (≥20 commits
+ ≥48h, posture ≠ strict).

## 2. Invocation

```
/march                       # one tick: dispatch + execute
/loop 30m /march             # autonomous loop, every 30 min
/loop /march                 # self-paced autonomous loop
```

## 3. Procedure

### Step 0 — Sync

```bash
git pull --ff-only
```

If divergence, stop per §5.

### Step 1 — Triage gate (cheapest check)

Load `GH_TOKEN` from `.env` and count unlabeled open issues:

```bash
export GH_TOKEN=$(awk -F= '/^GH_TOKEN=/ {sub(/^GH_TOKEN=/, ""); print; exit}' .env)
export GH_REPO=$(awk -F= '/^GH_REPO=/ {sub(/^GH_REPO=/, ""); print; exit}' .env)
GH_REPO=${GH_REPO:-no-trbl-2-u/Axiomancer}

unlabeled=$(gh issue list --repo "$GH_REPO" --state open \
  --search "-label:triage:loop-queued -label:triage:needs-user -label:triage:closed -label:triage:reviewed -label:loop:opened" \
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

If `unlabeled == 0`, fall through to Step 2.

If `gh` isn't installed or `GH_TOKEN` missing, **don't fail
the march** — log warning and fall through.

### Step 2 — Critique gate (rate-limited)

Read metadata header at top of `plan/CRITIQUE.md`:

```
> Last pass: <ISO-date> at commit <sha>
> Pass count: <N>
```

Dispatch to `/critique` if **all three** hold:

1. Current commit is at least **12 commits after** `Last pass`,
   OR `Last pass` > **24 hours ago**, OR `Last pass` is "never"
   and at least one substantive phase (e.g., the canonical
   sibling) has shipped.
2. `npm run deploy:check` shows a green deploy.
3. No pending HIGH critique already queued for iterate.

If all three hold:

- Read `skills/critique.md`.
- Execute its procedure end-to-end.
- Return.

Otherwise fall through to Step 3.

### Step 3 — Dispatch (first match wins)

#### 3a. Pending phase?

Open `plan/steps/01_build_plan.md`. If any `[ ]` row in the
"Status (at-a-glance)" block — skipping rows marked
`[skipped]` or `[blocked: …]` (a blocked phase is a
conversation waiting for `/oversight`, not work for this
tick):

- Read `skills/ship-a-phase.md`.
- Execute its procedure end-to-end.
- Return.

#### 3b. Content growth due (THE OPEN GATE ¶8)?

Growth is a standing mandate, not opportunistic work. Check
whether any content surface shipped growth recently:

```bash
git log --since="48 hours ago" --oneline -- \
  axiomancer-mechanics/src/World \
  axiomancer-mechanics/src/Enemy \
  axiomancer-mechanics/src/Cards \
  axiomancer-mechanics/src/NPCs | head -5
```

If that log is EMPTY (no content-surface commit in 48h) and no
phase work matched in 3a:

- Read `skills/forge.md`.
- Execute its procedure end-to-end.
- Return.

Otherwise fall through to 3c.

#### 3c. Expand due (rate-limited, posture-gated)?

Read `plan/bearings.md` "Plan expansion posture" section. If
posture is **strict**, skip to 3d.

Read metadata header at top of `plan/PHASE_CANDIDATES.md`:

```
> Last pass: <ISO-date> at commit <sha>
> Pass count: <N>
```

Dispatch to `/expand` if **all four** hold:

1. Posture is **bold** or **autonomous** (not strict).
2. Current commit is at least **20 commits after** `Last pass`,
   OR `Last pass` is more than **48 hours ago**, OR `Last pass`
   is "never" and at least **3 phases have shipped**.
3. There's at least one signal worth examining: `plan/AUDIT.md`
   has Pending rows, OR `plan/CRITIQUE.md` has Pending rows,
   OR `git log -p --since="<last pass>" -- spec.md
   axiomancer-mechanics/specs/ axiomancer-mechanics/braindump/`
   shows changes.
4. No phase work is pending (Step 3a would have matched first
   if there were).

If all four hold:

- Read `skills/expand.md`.
- Execute its procedure end-to-end.
- Return.

If any condition fails, fall through to 3d.

#### 3d. Else — iterate.

- Read `skills/iterate.md`.
- Execute its procedure end-to-end.
- Return.

(Note: when `/iterate`'s audit finds no actionable findings
scoring ≥ 3.0 AND posture is bold, iterate dispatches to
`/expand` itself rather than stopping. See `skills/iterate.md`
§6 failure mode 6.)

### Step 4 — Done

Return cleanly. Loop's next tick re-dispatches.

## 4. Hand-off honesty

When you dispatch into a child skill, **fully adopt its
contract**. Hard rules, failure modes, commit conventions,
verify gate. `/march` itself doesn't add rules; it inherits.

A march tick succeeds iff the child tick succeeds.

## 5. Failure modes

`/march` itself only fails on:

1. **`git pull` divergence.**
2. **State files corrupted or missing** (build plan, AUDIT,
   CRITIQUE). Stop and report — don't reconstruct
   silently.

Otherwise inherited from the dispatched skill.

## 6. Quick reference

```bash
# State files
plan/steps/01_build_plan.md          # pending phases
plan/CRITIQUE.md                     # critique queue + last-pass metadata

# External signals
gh issue list ...                    # unlabeled count
npm run deploy:check                    # green-deploy condition

# Skills it dispatches into
skills/triage.md                     # Step 1 (cheapest)
skills/critique.md                   # Step 2 (rate-limited)
skills/ship-a-phase.md               # Step 3a
skills/forge.md                      # Step 3b (growth mandate)
skills/expand.md                     # Step 3c (posture-gated)
skills/iterate.md                    # Step 3d
```
