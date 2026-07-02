# Skill: plan-a-phase

> **Thinking pass.** Refines or generates one phase brief.
> Writes to `plan/phases/phase_<N>_<topic>.md`. Does NOT modify
> code. The output is what `/ship-a-phase` reads next.

## 1. Purpose

`/ship-a-phase` works best when the brief is concrete and pre-decided.
Use this skill when:
- A phase brief doesn't exist yet.
- An existing spec has unresolved open questions.
- A sibling phase shipped that changes conventions.
- The user wants a refined brief before kicking off an autonomous run.

## 2. Invocation

```
/plan-a-phase              # next [ ] phase
/plan-a-phase phase 10     # specific phase
```

## 3. Inputs (read in this order)

1. `plan/bearings.md` — stack, contracts, standing decisions.
2. `plan/steps/01_build_plan.md` — phase scope row.
3. `specs/<NN>-<topic>.md` — the corresponding implementation spec.
4. `plan/phases/<phase_canonical_sibling>.md` — nearest shipped phase brief.
5. `src/<closest-sibling-module>/` — code patterns from the nearest
   already-shipped module.
6. `spec.md` — only if the brief touches a surface bearings doesn't describe.

## 4. The brief format

Mirrors `skills/ship-a-phase.md` §5. Fixed structure:

- **Outcome** — one sentence: what "done" looks like.
- **Source spec** — reference to `specs/<NN>.md` + pre-resolved open questions.
- **Implementation units** — one per commit. Each unit: file, types, logic,
  pattern (with concrete TypeScript sketches where the shape is non-obvious).
- **Decisions made upfront — DO NOT ASK** — every judgment call resolved.
- **Verify gate** — which checks apply.
- **Commit body template** — for the summary commit.
- **Definition of Done** — checkbox list matching the spec's acceptance
  checklist.
- **Follow-ups (out of scope)** — deferred items.

A brief that leaves Open Qs is a brief that fails its job. **Resolve every
ambiguity.** If genuinely unknowable, pick the most-defensible default and
document it under "Decisions made upfront."

## 5. The procedure

### Step 0 — Sync + load

```bash
git pull --ff-only
```

Read all inputs in §3.

### Step 1 — Pick the phase

Next `[ ]` row in `01_build_plan.md`, or the phase number passed.

### Step 2 — Audit existing brief (if any)

If `plan/phases/phase_<N>_<topic>.md` exists:
- Are all spec open questions answered?
- Do the commit units reference up-to-date module paths?
- Are the decisions consistent with current `bearings.md`?

If fully current: return "brief still current — no changes."

### Step 3 — Compose the brief

Walk the brief format (§4). For each section, derive content from the inputs.
Make decisions; document under "Decisions made upfront — DO NOT ASK".

Authority order:
1. Pre-answered questions in `specs/<NN>.md` (highest).
2. `plan/bearings.md` standing decisions.
3. Phase-specific calls (document these explicitly).

### Step 4 — Reality-check against codebase

Check that every primitive the brief references exists in `src/`. If missing:
- Add it to the phase scope ("ship X plus missing primitive Y"), OR
- Push to a follow-up phase and note under Follow-ups.

### Step 5 — Commit

```bash
git add plan/phases/phase_<N>_<topic>.md
git commit -m "phases: brief for phase <N> — <topic>"
git push origin main
```

### Step 6 — Done

"Phase <N> brief committed — <one-line summary>. Ready for /ship-a-phase."

## 6. Hard rules

1. **Never modify code.** Brief generation may propose new primitives, but
   they ship via `/ship-a-phase`, not here.
2. **Never leave Open Qs in a generated brief.** Decide and document.
3. **No emojis, no `Co-Authored-By:`.**
4. **Bearings and spec answers are law** — don't contradict them.

## 7. Failure modes

1. **Phase scope row in `01_build_plan.md` is ambiguous.** Fix the row first;
   retry.
2. **Spec has unanswered questions that require user input.** Surface as
   `[needs-user-call]` in `plan/AUDIT.md`, then write the brief with the
   most-defensible default. Don't block.
