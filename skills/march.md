# Skill: march

> **Outer dispatcher.** Reads project state and delegates to one
> of the shipping skills. Designed for `/loop` and the `march`
> workflow.

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

`/loop /march` picks the right thing to do every tick. In revamp
mode the chain is:

```
unlabeled or loop:do issues        →  /triage
ELSE critique due (rate-limited)   →  /critique
ELSE next pickable phase           →  /ship-a-phase
ELSE expand due + bold posture     →  /expand
ELSE                               →  /iterate
```

First match wins. Every "due" and "pickable" test lives in §3,
the one home for gate logic; other verbs point here rather than
repeating it.

This is the upstream nexus chain (`daretodave/nexus`
`templates/skills/march.md`) minus its `/ship-data` step, which this
project never adopted. Red `main` is not a march step: the
`ci-autofix` workflow runs `/fix-ci` on its own the moment a
`verify-*` run fails on `main`.

What revamp mode changes (THE REVAMP, D58), and nothing more:

- **No content lifecycle and no growth step.** The `adjust-*`
  stewards, `/forge`, the per-category ledger and the growth floor
  are archived.
- **Phase picking is revamp-aware.** Only ratified revamp rows are
  pickable, in order, and only once their `Requires` are done (§3).
- **`/expand` and `/iterate` create nothing.** They still run on
  their normal turns; their own skills carry the no-content rule.
- **When revamp mode ends** (Phase R11 ships), R11 decides how
  content phases come back; the chain above does not change.

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
march** on a missing token.

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

1. while revamp mode holds, sits in THE REVAMP block (a `[ ]` row
   anywhere else is not ratified revamp work: report it, don't
   ship it);
2. is not marked **attended** (R0) — attended phases are shipped
   in a session with T;
3. has every phase named in its `Requires …` clause ticked `[x]`
   on `main`.

Rows marked `[x]`, `[-]`, `[skipped]` or `[blocked: …]` are
never pickable. A blocked row (including every owner-led B-row)
is a conversation for `/oversight` or T's session, not work for
this tick.

## 4. Procedure

### Step 0 — Sync and load the token

```bash
git pull --ff-only

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
- Execute its procedure end-to-end.
- Return.

Otherwise fall through to Step 3.

### Step 3 — Next phase

Find the next pickable phase per §3 "Pickable phase". If there
is one:

- Read `skills/ship-a-phase.md`.
- Execute its procedure end-to-end on that phase. A phase with no
  brief gets one generated first, per `skills/plan-a-phase.md` §5
  (ship-a-phase does this itself).
- Return.

Otherwise, if a `[ ]` row exists but none is pickable, note in
the tick's output which row is waiting and why (attended,
`Requires` unmet, owner-led, outside THE REVAMP block), then fall
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
plan/steps/01_build_plan.md          # pending phases (THE REVAMP block)
plan/revamp/README.md                # the revamp plan; part plans beside it
plan/CRITIQUE.md                     # critique queue + last-pass metadata
plan/PHASE_CANDIDATES.md             # expand last-pass metadata (§3 expand gate)

# External signals
gh issue list ...                    # unlabeled / loop:do count
npm run deploy:check                 # green-deploy condition

# Skills it dispatches into
skills/triage.md                     # Step 1 (cheapest)
skills/critique.md                   # Step 2 (rate-limited)
skills/ship-a-phase.md               # Step 3 (next pickable phase)
skills/plan-a-phase.md               # brief format, used by ship-a-phase
skills/expand.md                     # Step 4 (rate-limited, posture-gated)
skills/iterate.md                    # Step 5 (default)

# Not a march step
skills/fix-ci.md                     # run by the ci-autofix workflow on red main
```
