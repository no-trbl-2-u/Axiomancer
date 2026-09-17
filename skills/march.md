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
ELSE content lifecycle due      →  /adjust-<cards|equipment|enemies|keywords|npcs>
ELSE content growth due         →  /forge
ELSE expand due + bold posture  →  /expand
ELSE                            →  /iterate
```

Deliveries first: pending phases ship before `/expand`
ever fires. `/expand` only runs when there's no immediate
delivery, OR when its rate-limit window opens (every ~20
commits or ~48h) AND the bearings posture is **bold** or
**autonomous**.

Per-item content (cards, equipment, enemies, keywords, NPCs) has its
own standing stewards — the `adjust-*` family — on their own
rate-limited cadence, independent of the growth-due signal that still
drives `/forge` for maps/continents/events/art. See §3b.

This means: an overnight run can take the project from
"scaffolded" to "shipped, populated, iteratively polished,
critiqued, addressed, inbox-zero on issues, growing and pruning its
own content, and growing its own plan when reality outpaces the
original spec" without a mode switch from the user.

The triage check is **cheap when idle** (one API call to count
unlabeled issues). The critique check is **rate-limited**
(≥12 commits + ≥24h spacing, green-deploy required). The content
lifecycle check is **rate-limited per category** (≥15 commits or
≥36h since that category's own last pass, green-deploy required).
The expand check is **rate-limited + posture-gated** (≥20 commits
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

#### 3b-pre. Growth floor (THE GROWTH FLOOR ¶1, 2026-09-17)

The steward lane below can starve 3c indefinitely: five categories
re-ripen on a 36-hour clause faster than the loop ticks, and
first-match-wins means 3c is never reached. The floor stops that.

```bash
git log --since="7 days ago" --oneline -- \
  axiomancer-mechanics/src/World | head -5
```

If that log is EMPTY (no world-surface commit in **7 days**) and no
phase work matched in 3a:

- Read `skills/forge.md`.
- Execute its procedure end-to-end.
- Return.

The steward category that would have run waits for the next tick; its
ledger row is untouched, so it stays stalest and wins 3b next time.

Otherwise fall through to 3b.

#### 3b. Content lifecycle due (rate-limited, per category)?

The five per-item content surfaces (cards, equipment, enemies,
keywords, NPCs) each have a standing steward — the `adjust-*`
family — that creates, updates, AND retires that surface's content.
This is independent of 3c's growth-due signal: it fires on its own
cadence regardless of whether `/forge` shipped recently.

Read `plan/CONTENT_LEDGER.md`'s category table:

```
| category  | last pass | commit | pass count |
| cards     | ...       | ...    | ...        |
| equipment | ...       | ...    | ...        |
| enemies   | ...       | ...    | ...        |
| keywords  | ...       | ...    | ...        |
| npcs      | ...       | ...    | ...        |
```

Dispatch if **all three** hold:

1. At least one category qualifies: its `last pass` is at least
   **15 commits after** the row's commit, OR **more than 36 hours
   ago**, OR "never" AND at least **2 phases have shipped touching
   that category's surface**.
2. `npm run deploy:check` shows a green deploy.
3. No phase work is pending (Step 3a would have matched first if
   there were).

If multiple categories qualify, pick the **stalest** one (oldest
`last pass`; "never" counts as oldest). Break remaining ties by fixed
rotation order: cards → equipment → enemies → keywords → npcs.

If all three hold:

- Read `skills/adjust-<category>.md` for the picked category.
- Execute its procedure end-to-end. A CREATE-shaped finding the
  steward is authorized to fill ships in that same tick when it is
  **small**, and is filed as a candidate only when it is **large** —
  the threshold is THE GROWTH FLOOR ¶2 in `plan/bearings.md`.
- Return.

Otherwise fall through to 3c.

#### 3c. Content growth due (THE OPEN GATE ¶8)?

Growth is a standing mandate, not opportunistic work. This gate now
covers only `/forge`'s remaining surfaces (maps/continents, events,
art) — per-item content is 3b's job. Check whether any of those
surfaces shipped growth recently:

```bash
git log --since="48 hours ago" --oneline -- \
  axiomancer-mechanics/src/World | head -5
```

If that log is EMPTY (no world-surface commit in 48h) and no
phase work matched in 3a and no dispatch happened in 3b:

- Read `skills/forge.md`.
- Execute its procedure end-to-end.
- Return.

Otherwise fall through to 3d.

#### 3d. Expand due (rate-limited, posture-gated)?

Read `plan/bearings.md` "Plan expansion posture" section. If
posture is **strict**, skip to 3e.

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

If any condition fails, fall through to 3e.

#### 3e. Else — iterate.

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
   CRITIQUE, CONTENT_LEDGER). Stop and report — don't
   reconstruct silently.

Otherwise inherited from the dispatched skill.

## 6. Quick reference

```bash
# State files
plan/steps/01_build_plan.md          # pending phases
plan/CRITIQUE.md                     # critique queue + last-pass metadata
plan/CONTENT_LEDGER.md               # per-category adjust-* last-pass metadata

# External signals
gh issue list ...                    # unlabeled count
npm run deploy:check                    # green-deploy condition

# Skills it dispatches into
skills/triage.md                     # Step 1 (cheapest)
skills/critique.md                   # Step 2 (rate-limited)
skills/ship-a-phase.md               # Step 3a
skills/adjust-cards.md               # Step 3b (content lifecycle)
skills/adjust-equipment.md           # Step 3b (content lifecycle)
skills/adjust-enemies.md             # Step 3b (content lifecycle)
skills/adjust-keywords.md            # Step 3b (content lifecycle)
skills/adjust-npcs.md                # Step 3b (content lifecycle)
skills/forge.md                      # Step 3b-pre (growth floor) + Step 3c (growth mandate — maps/events/art)
skills/expand.md                     # Step 3d (posture-gated)
skills/iterate.md                    # Step 3e
```
