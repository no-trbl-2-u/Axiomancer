# Skill: plot

> **T's intake for one known task (R11).** Turns a request from T
> into a build-plan row plus a brief with acceptance IDs, slotted
> where T wants it. Never builds. Never fired by the loop: no
> `/march` step, cron, workflow or loop verb dispatches it. It runs
> when T types `/plot`, or when T, in conversation, asks for loop
> work and the agent routes it here (AGENTS.md rule 8).
>
> Modelled on the `hunt` repo's `.claude/commands/plot.md`. `/plot`
> is to the build plan what `/jot` is to `plan/CRITIQUE.md`.

## 1. Invocation

```
/plot asap "<task>"       # slot at the top of the open rows
/plot anytime "<task>"    # slot after the last open row
/plot peek "<task>"       # orient + research + shape, print the brief, commit nothing
/plot "<task>"            # no word: the skill picks asap or anytime and says why
/plot <N>                 # write the missing brief for existing row N
                          # (what a "needs a brief: /plot <N>" candidate asks for)
```

## 2. The procedure

### Step 1 — Orient

Read, in order: `plan/bearings.md` (standing decisions, "Decisions
standing for the autonomous loop"), `plan/reflexes.md`, the Status
block of `plan/steps/01_build_plan.md`, the heads of `plan/AUDIT.md`
and `plan/CRITIQUE.md` Pending, and `plan/PHASE_CANDIDATES.md` for a
row that already covers the task.

### Step 2 — Research

- What already exists in code and plan for this task (grep the
  packages; read the nearest part plan in `plan/revamp/` or
  `plan/<topic>.md`).
- Which D-numbers it touches
  (`plan/2026-09-25-refactor-strategy.decisions.md`).
- Which content surfaces it touches, and what D88 allows: cards,
  keywords and art are owner-only (D37) and are never planned for
  the loop; enemies, relics, maps, NPCs and events are allowed
  because T is asking now.
- Whether an existing row, candidate or AUDIT item already covers
  it. If one does, extend that instead of adding a duplicate, and
  say so.

### Step 3 — Shape

Write the brief at `plan/phases/phase_<N>_<topic>.md` in the format
of `skills/plan-a-phase.md` §4, **including acceptance IDs `A1…` and
a `Measure:` line**. `<N>` is the next free phase id (a letter
suffix for a sibling of an existing phase). Resolve every ambiguity
under "Decisions made upfront — DO NOT ASK"; if a call is genuinely
T's and the session is attended, ask it (`AskUserQuestion`, at most
4 questions, recommendation first, `docs/asking-well.md`). If T is
not present to answer, record the leading option as a decision and
mark it `[T to confirm]`.

### Step 4 — Slot

Add the row to the Status block of `plan/steps/01_build_plan.md`:

- `asap` → directly above the first open (`[ ]`) row.
- `anytime` → after the last open (`[ ]` or `[blocked: …]`) row.
- no word → pick one and state the reason in the commit body
  (blocking a pending row or fixing a live defect → asap; otherwise
  anytime).

Row shape: `- [ ] Phase <N> — <title> (plotted by T, <date>): <one
line>. Brief \`plan/phases/phase_<N>_<topic>.md\`. Requires <ids or
nothing>.` Mark it `(attended)` only if T says it must be shipped
with T present. If a "needs a brief: `/plot <N>`" candidate existed,
move it to Rejected as "briefed".

### Step 5 — Commit

Plan-only, so it pushes `main` (D84):

```bash
git add plan/phases/phase_<N>_<topic>.md plan/steps/01_build_plan.md plan/PHASE_CANDIDATES.md
git commit -m "phases: plot <N> — <title>" -m "<asap|anytime> because <reason>. Acceptance A1-A<k>."
git push origin main
```

From a worktree branch (the usual attended case), commit first and then
`git fetch origin && git rebase origin/main && git push origin HEAD:main`
as one act; main moves under you (lesson `plan-only-push-race`).

`peek` stops before Step 4 and prints the brief instead.

### Step 6 — Retro

Run `skills/march.md` §3 "Retro".

### Step 7 — Done

Two lines: the row, where it was slotted, and "the next `/march`
tick can pick it" (or why it cannot: attended, `Requires` unmet).

## 3. Hard rules

1. **Never builds.** No code, no tests, no workflow edits.
2. **Never fired by the loop.** A `skills/` file other than this
   one and `skills/messy.md` that dispatches `/plot` fails
   `scripts/loop-pr.test.mjs`.
3. **Never plans card, keyword or art work for the loop** (D37).
4. **Acceptance IDs and `Measure:` are mandatory.**
5. **No emojis, no attribution trailers** (AGENTS.md rule 2).
