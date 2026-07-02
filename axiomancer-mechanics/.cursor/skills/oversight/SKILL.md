---
name: oversight
description: User-in-the-loop — brief, questionnaire, plan adjustments. The only interactive skill. Pause autonomy. Brief the user on current state. Ask targeted questions. Adjust the plan. Push. Use when the user says "oversight", "let's review the plan", "what's the project status", or wants to make plan adjustments interactively.
---

# Oversight

> **The user-in-the-loop command.** Pause autonomy. Brief the user
> on current state. Ask targeted questions. Adjust the plan. Push.
>
> Every other skill is autonomous; this one is the exception.

## 1. Purpose

When the user invokes oversight:

1. **Synthesis.** Read state files, recent commits, deploy state. ~25-line brief.
2. **Questionnaire.** Based on observed flags, ask 1–4 targeted questions
   directly in chat (present options as numbered lists so the user can reply
   quickly).
3. **Adjustment.** Apply answers as edits to plan files. One commit.

After this, user re-invokes march (or loops march) to resume.

## 2. Invocation

The user may provide a bias keyword:

- *(no argument)* — full audit + general questionnaire
- `phase` — bias toward phase progress / scope
- `content` — bias toward iterate findings + quality
- `deploy` — bias toward deploy gate state
- `reset` — bias toward scope reduction

## 3. What oversight reads

In parallel where independent:

1. `git log --oneline -20` — recent shipping velocity.
2. `git status --short` — uncommitted changes.
3. `npm run deploy:check` — current deploy state (package publishable?).
4. `plan/steps/01_build_plan.md` Status block — pending phases.
5. `plan/AUDIT.md` — open iterate findings.
6. `plan/CRITIQUE.md` — critique pending.
7. `plan/PHASE_CANDIDATES.md` — candidates awaiting promotion.
8. Last 3 phase briefs — current vs. recent commits.

## 4. The briefing (~25 lines max)

```
oversight — <ISO date>

shipping
- last commit: <sha> "<subject>" (<relative time>)
- phases shipped since last oversight: <list with hashes>
- velocity: ~<N> commits/day over last 7 days

state
- pending phases: <count>; next is Phase <N> (<topic>)
- open audit findings: <count>; top score <X>: "<one-liner>"
- pending critique findings: <count>; pass count <N>; last pass <when>
- pending phase candidates: <count>; top score <X>: "<one-liner>"
- working tree: <clean | N modified | N untracked>
- deploy gate: <green / red / not checked>

flags
- <unusual patterns: stuck phase, repeated fix commits,
  Knowledge-Gaps items ready to spec, ESLint still broken, etc.>
```

## 5. The questionnaire

Generate 1–4 questions and present them in chat. Rules:

- **Computed from observed flags**, not pre-canned.
- **Each question targets a specific observable.**
- **Present as numbered options with a recommended choice marked.**
- **Last question is free-form** if there's room.

Sample question shapes for this project:

**Stuck phase**
> Phase `<N>` has been pending across `<K>` ticks; last `<L>` commits were
> `fix:` against it. What now?
> 1. **(recommended)** Refresh the brief.
> 2. Abandon — mark [skipped], move on.
> 3. Continue.

**ESLint still broken**
> Phase 13 (ESLint fix) hasn't shipped. Promote it above current pending
> phases?
> 1. **(recommended)** Promote before Phase `<N+1>`.
> 2. Leave it in current order.
> 3. Skip permanently.

**Audit overload**
> `plan/AUDIT.md` has `<N>` findings; top 3 are `<category>`. Bias iterate?
> 1. **(recommended)** Yes — focus `<category>`.
> 2. No — keep balanced.

**Phase candidates pending**
> `plan/PHASE_CANDIDATES.md` has `<N>` candidates. Top: "`<title>`" (score `<X>`).
> 1. **(recommended)** Promote top candidate.
> 2. Review all — show me the list.
> 3. Defer.

**Free-form**
> Anything to adjust before handing back to /march?

## 6. The procedure

### Step 0 — Sync

```bash
git pull --ff-only
```

### Step 1 — Audit (§3)

### Step 2 — Brief (§4) — print it, no questions yet

### Step 3 — Build questionnaire (§5)

### Step 4 — Ask

Present the questionnaire directly in chat. Wait for user replies before
proceeding.

### Step 5 — Apply

- **"Refresh brief"** → run the plan-a-phase procedure inline.
- **"Abandon phase"** → flip `[ ]` to `[skipped]` in `01_build_plan.md`
  with comment `(skipped via oversight <date> — <reason>)`.
- **"Bias toward category X"** → write to top of `plan/AUDIT.md`:
  `> Bias: <category> (set via oversight <date>)`.
- **"Promote candidate"** → move from `## Pending` to `## Promoted` in
  `PHASE_CANDIDATES.md`. Append new phase row in `01_build_plan.md`.
- **"Reject candidate"** → move to `## Rejected` with one-line reason.
- **"Other" free-form** → interpret conservatively. If clear plan edit,
  apply. If ambiguous, write `[needs-user-call]` to AUDIT.md.

### Step 6 — Commit + push

```bash
git add <modified plan files>
git commit -m "oversight: <one-line summary>

- <bullet per adjustment>

User answers:
- Q: <question> → <answer>"
git push origin main
```

If no adjustments: no empty commit. Print "no adjustments — handing back
to the loop."

### Step 7 — Deploy gate

```bash
npm run deploy:check
```

Skip if no commit was made.

### Step 8 — Done

```
oversight complete. <N> adjustments applied.
- ready to resume: march (or loop march)
- next pending phase: Phase <N> (<topic>)
```

## 7. Hard rules

1. **Never edit code.** Plan adjustments only.
2. **No destructive git ops without explicit user confirmation.**
3. **Single commit for the adjustment set.**
4. **No emojis. No `Co-Authored-By:`.**
