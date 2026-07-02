# Skill: oversight

> **The user-in-the-loop command.** Pause autonomy. Brief the user
> on current state. Ask targeted questions. Adjust the plan. Push.
>
> Every other skill is autonomous; this one is the exception.
> `AskUserQuestion` is allowed here and ONLY here.
>
> **Decision records:** Durable decisions must be synced per the Glanton
> Nexus source-of-truth law (Phase 105) before returning to `/march`:
>
> 1. T's latest explicit decision.
> 2. CDRs / ADRs (`~/Workspace/decisions/`, `docs/adr/`).
> 3. Central SomberSoft ledger (`~/Workspace/SOMBERSOFT_COMMAND_LEDGER.md`).
> 4. Active build plan (`plan/steps/01_build_plan.md`).
> 5. Phase candidates (`plan/PHASE_CANDIDATES.md`).
> 6. Critique/audit logs (`plan/CRITIQUE.md`, `plan/AUDIT.md`).
> 7. Historical reports (`~/Workspace/reports/`).
>
> Sync decisions down the hierarchy and stop if contradictions remain.

## 1. Purpose

When the user types `/oversight`:

1. **Synthesis.** Read state files, recent commits, deploy state. ~25-line brief.
2. **Questionnaire.** Based on observed flags, ask 1–4 targeted questions.
3. **Adjustment.** Apply answers as edits to plan files. One commit.
4. **Decision sync.** If the answer settles durable doctrine, update or create the relevant CDR/ADR and subordinate plan rows before handoff.

After this, user re-invokes `/march` (or `/loop /march`) to resume.

## 2. Invocation

```
/oversight              # full audit + general questionnaire
/oversight phase        # bias toward phase progress / scope
/oversight content      # bias toward iterate findings + quality
/oversight deploy       # bias toward deploy gate state
/oversight reset        # bias toward scope reduction
```

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

Generate 1–4 questions via `AskUserQuestion`. Rules:
- **Computed from observed flags**, not pre-canned.
- **Each question targets a specific observable.**
- **Multiple choice with recommended option first.**
- **Last question is free-form** if there's room.

Sample question shapes for this project:

**Stuck phase**
> Phase <N> has been pending across <K> ticks; last <L> commits were
> fix: against it. What now?
> - (recommended) Refresh the brief.
> - Abandon — mark [skipped], move on.
> - Continue.

**ESLint still broken**
> Phase 13 (ESLint fix) hasn't shipped. Promote it above current pending
> phases?
> - (recommended) Promote before Phase <N+1>.
> - Leave it in current order.
> - Skip permanently.

**Audit overload**
> plan/AUDIT.md has <N> findings; top 3 are <category>. Bias iterate?
> - (recommended) Yes — focus <category>.
> - No — keep balanced.

**Phase candidates pending**
> plan/PHASE_CANDIDATES.md has <N> candidates. Top: "<title>" (score <X>).
> - (recommended) Promote top candidate.
> - Review all — show me the list.
> - Defer.

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

Invoke `AskUserQuestion`.

### Step 5 — Apply

- **"Refresh brief"** → run `skills/plan-a-phase.md` §5 inline.
- **"Abandon phase"** → flip `[ ]` to `[skipped]` in `01_build_plan.md`
  with comment `(skipped via oversight <date> — <reason>)`.
- **"Bias toward category X"** → write to top of `plan/AUDIT.md`:
  `> Bias: <category> (set via oversight <date>)`. `/iterate` weights 1.5×.
- **"Promote candidate"** → move from `## Pending` to `## Promoted` in
  `PHASE_CANDIDATES.md`. Append new phase row in `01_build_plan.md`.
- **"Reject candidate"** → move to `## Rejected` with one-line reason.
- **"Other" free-form** → interpret conservatively. If clear plan edit,
  apply. If ambiguous, write `[needs-user-call]` to AUDIT.md.

### Step 6 — Commit + push

```bash
git add <modified plan files>
git commit -m "$(cat <<'EOF'
oversight: <one-line summary>

- <bullet per adjustment>

User answers:
- Q: <question> → <answer>
EOF
)"
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
- ready to resume: /march (or /loop /march)
- next pending phase: Phase <N> (<topic>)
```

## 6.5 Decision-sync checklist (Glanton Nexus state reconciliation — Phase 105)

Before handing back to `/march`, verify state consistency per the source-of-truth hierarchy:

- [ ] **T decisions synced:** Latest explicit T decisions are reflected in local plan files.
- [ ] **Central ledger aligned:** CDR/ADR doctrine and central SomberSoft ledger law are mirrored into local operational files.
- [ ] **Deferred work marked:** Newly deferred work is marked `[deferred]` everywhere it appears (build plan, candidates, critique rows).
- [ ] **Promoted candidates moved:** Candidates promoted to phases are moved/annotated in `PHASE_CANDIDATES.md` and added to build plan.
- [ ] **Shipped phases drained:** Completed phases drain or annotate matching critique/audit rows with resolution notes.
- [ ] **Build plan current:** Phase status in `01_build_plan.md` matches recent shipping decisions and commit hashes.
- [ ] **No layer contradictions:** Higher decision layers don't contradict lower operational state.
- [ ] **Stale rows surfaced:** Any shipped-but-still-pending phase rows are flagged for reconciliation.

If any checklist item fails, resolve the drift or surface it for T/Glanton reconciliation before declaring `/march` safe to resume.

## 7. Hard rules

1. **Never edit code.** Plan adjustments only.
2. **No destructive git ops without explicit user confirmation.**
3. **Single commit for the adjustment set.**
4. **`AskUserQuestion` is allowed here and only here.**
5. **No emojis. No `Co-Authored-By:`.**

## 8. Failure modes

1. **Invoked under `/loop`** — misconfiguration. Stop.
2. **`git pull` divergence** — stop.
3. **State files corrupted** — stop.
