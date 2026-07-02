# Skill: expand

> **Plan-expansion pass.** Read accumulated signals and propose new
> phase candidates. Posture-controlled: bold (default) files candidates
> to `plan/PHASE_CANDIDATES.md`; strict is a no-op; autonomous writes
> directly to the build plan.
>
> **Aggressive filing (set 2026-05-24):** score ≥ 2.5 files (was 3.0).
> When in doubt, file — `/oversight` is the gate that filters.

## 1. Purpose

The original build plan was written at adoption time. As the loop ships
phases and `/critique` + `/iterate` accumulate findings, the plan falls
behind reality. `/expand` bridges that gap by proposing new phases.

Rate-limited (≥20 commits + ≥48h between passes) and posture-gated.
`/oversight` promotes or rejects candidates.

## 2. Invocation

```
/expand                # full signals pass, propose candidates
```

Called by `/march` when rate-limit + posture conditions pass and no
phases/data are pending.

## 3. Autonomy contract

- **bold posture (default):** files candidates to `plan/PHASE_CANDIDATES.md`.
  `/oversight` promotes.
- **strict posture:** `/expand` is a no-op. Build plan grows only via
  `/plan-a-phase` or `/oversight`.
- **autonomous posture:** writes phase rows directly to
  `plan/steps/01_build_plan.md`. Most aggressive; document if chosen.

Current posture: **bold** (set in `plan/bearings.md`).

## 4. Signal sources

Walk each in order:

1. **`plan/AUDIT.md` Pending** — clusters of findings in the same category
   suggest a dedicated phase.
2. **`plan/CRITIQUE.md` Pending** — HIGH findings that iterate can't address
   in single ticks suggest a refactor phase.
3. **`Knowledge-Gaps.md`** — open design questions that have matured to
   "ready to spec" (i.e., enough context from shipped phases).
4. **`specs/` unstarted specs** — specs that aren't in the build plan yet
   but are listed in `specs/README.md` recommended order.
5. **`braindump/`** — surfaced ideas that have become relevant to the current
   state of the engine.
6. **`spec.md` "6-month horizon"** — items queued for later that are now
   unblocked by recent phases.
7. **Recent commits** — patterns in `git log` suggesting unplanned rework
   (N consecutive fix commits on the same area → might need a cleanup phase).

## 5. The procedure

### Step 0 — Sync + rate-limit check

```bash
git pull --ff-only
```

Read `plan/PHASE_CANDIDATES.md` metadata header:
```
> Last pass: <ISO date> at commit <sha>
> Pass count: <N>
```

If posture is strict: return immediately.

### Step 1 — Walk signal sources

Walk §4. For each signal: assess whether it suggests a new phase or a
scope extension of an existing pending phase.

### Step 2 — Propose candidates

For each candidate worth filing, format as:

```markdown
### Candidate: <Phase title>
- signal: <what triggered this — AUDIT row, spec, braindump entry, etc.>
- scope: <2–3 sentences describing what the phase would ship>
- unblocks: <what becomes easier/possible after this phase>
- blocked-by: <phases this depends on, if any>
- score: <urgency 0–10> × <value 0–10> / 10 = <total>
- recommended-slot: after Phase <N>
```

**Filing threshold (aggressive — set 2026-05-24):** file any candidate
scoring **≥ 2.5**. Prior implicit floor was 3.0; the lower bar surfaces
medium-impact / medium-ease candidates (small infrastructure polish,
narrow content sweeps, near-miss audit pairings) that the loop has
otherwise been letting drift. `/oversight` is the gate that decides
what actually ships — `/expand`'s job is to surface, not to filter.

**Broader signal interpretation:** weight signals generously.
A single AUDIT row, a half-formed Knowledge-Gaps note, a one-line
braindump entry, or a critique-pass rejection with a "but this related
thing might be worth filing" comment all count. When in doubt, file.

Cap: 5 candidates per pass. Quality > quantity still applies — the
threshold drops, the cap does not.

### Step 3 — Update PHASE_CANDIDATES.md

Append candidates to `## Pending`. Update metadata header.

### Step 4 — Commit + push

```bash
git add plan/PHASE_CANDIDATES.md
git commit -m "expand: pass <N> — <N> candidates proposed"
git push origin main
```

### Step 5 — Done

"Expand pass <N> complete. <N> candidates in PHASE_CANDIDATES.md.
Top candidate: '<title>' (score <X.Y>). Use /oversight to promote."

## 6. Hard rules

1. **Never modify code.** Plan files only.
2. **Bold posture = candidates only.** Never modify the build plan directly
   unless posture is autonomous.
3. **Cap 5 candidates per pass.**
4. **No emojis. No `Co-Authored-By:`.**

## 7. Failure modes

1. **Posture is strict** — return immediately, no commit.
2. **Rate-limit not met** — return, no commit.
3. **`git pull` divergence** — stop.
