# Skill: resolve-playtest

> **Interactive playtest triage.** Read `plan/PLAYTEST_REPORT.md`,
> walk the user through each finding, determine what's intended
> vs. unintended, suggest fixes, route to design spec or phase
> candidates, and update all audit/critique logs. The user-in-
> the-loop counterpart to `/deep-playtest`.
>
> **Interactive by design.** Uses `AskUserQuestion` for every
> triage decision. Like `/oversight`, this skill asks — it does
> not decide autonomously.

## 1. Purpose

`/deep-playtest` produces a rich playtest report.
`/resolve-playtest` is where the user and Claude sit down
together to decide what to do about each finding:

1. Is this behavior intended or a problem?
2. If unintended — is it a design problem (needs Claude Design)
   or a code problem (needs a phase)?
3. What specifically should change?

The outputs feed three downstream systems:
- **`plan/DESIGN_SPEC.md`** — design brief for Claude Design
  handoff.
- **`plan/PHASE_CANDIDATES.md`** — code-side fixes for `/expand`
  and `/ship-a-phase`.
- **`plan/CRITIQUE.md`** — cross-reference so `/oversight` tracks
  resolution.

## 2. Invocation

```
/resolve-playtest                # triage all pending findings
/resolve-playtest <F##>          # triage a specific finding
/resolve-playtest design-only    # only output design spec (skip phase routing)
```

## 3. Prereqs

`plan/PLAYTEST_REPORT.md` must exist with at least one finding
in `## Findings` that is not already marked `[x]`. If no report
exists, tell the user to run `/deep-playtest` first.

## 4. Procedure

### Step 0 — Sync + load

```bash
git pull --ff-only
```

Read:
- `plan/PLAYTEST_REPORT.md` — the findings to triage.
- `plan/PHASE_CANDIDATES.md` — to avoid duplicate candidates.
- `plan/CRITIQUE.md` — to cross-reference.
- `plan/bearings.md` — voice and constraints.

Count pending (non-`[x]`) findings and delight entries.

### Step 1 — Brief the user

Print a summary of the playtest report:

```
Playtest report from <date>: <N> findings pending triage.
<H> high, <M> medium, <L> low severity.
<D> delight moments (preserved, not triaged).

I'll walk through each finding and ask whether the behavior
was intended. For unintended findings, I'll suggest approaches
and route them to design specs or phase candidates.
```

### Step 2 — Triage loop

Process findings in severity order: high → medium → low.
For each finding:

#### Step 2a — Present the finding

Show the finding's title, observation, expected behavior,
screenshot description, and impact in a concise block.

#### Step 2b — Ask: intended?

```
AskUserQuestion({
  questions: [{
    question: "[F##] <title> — Was this behavior intended?",
    header: "Intended?",
    options: [
      { label: "Not intended",
        description: "This is a problem that should be fixed" },
      { label: "Intended",
        description: "Working as designed — mark as resolved" },
      { label: "Intended but unclear",
        description: "Behavior is right but the UI doesn't
        communicate it well — needs design work" },
      { label: "Skip",
        description: "Defer this finding for now" }
    ],
    multiSelect: false
  }]
})
```

Handle responses:
- **Intended** → mark finding `[x]` in PLAYTEST_REPORT.md
  with note `resolved: intended`. Move to next finding.
- **Skip** → leave finding as-is. Move to next.
- **Not intended** or **Intended but unclear** → proceed to
  Step 2c.

#### Step 2c — Suggest approaches

Based on the finding's type, suggest 2-3 concrete approaches.
Use the finding type to bias the routing:

| Finding type | Default route | Why |
|---|---|---|
| `confusion` / `feedback-missing` | design | copy, layout, visual hierarchy |
| `friction` / `flow-gap` / `pacing` | either | may need new UI or logic |
| `bug` / `inconsistency` | code | logic error, state mismatch |
| `visual` | design | styling, spacing, hierarchy |

Present suggestions with previews where helpful:

```
AskUserQuestion({
  questions: [{
    question: "How should we address [F##] <title>?",
    header: "Approach",
    options: [
      { label: "<approach 1 — brief>",
        description: "<what this entails and its tradeoffs>" },
      { label: "<approach 2 — brief>",
        description: "<what this entails and its tradeoffs>" },
      { label: "<approach 3 — brief>",
        description: "<what this entails and its tradeoffs>" }
    ],
    multiSelect: false
  }]
})
```

#### Step 2d — Route the fix

Based on the chosen approach, determine routing:

- **Design issue** → queue for `plan/DESIGN_SPEC.md`.
- **Code issue** → queue for `plan/PHASE_CANDIDATES.md`.
- **Both** → queue for both, with cross-references.

Mark the finding `[x]` in PLAYTEST_REPORT.md with resolution
note: `resolved: <design-spec | phase-candidate | both> —
<chosen approach summary>`.

### Step 3 — Generate design spec

After all findings are triaged, compile all design-routed
findings into `plan/DESIGN_SPEC.md`:

```markdown
# Design Spec — Playtest Findings

> Generated: <ISO date>
> Source: plan/PLAYTEST_REPORT.md (<playtest date>)
> For: Claude Design handoff
> Project: https://claude.ai/design/p/019e0f5a-a0f0-753b-be1e-8939e6011384

## Context

Axiomancer Mobile is a TTRPG game (React Native / Expo). A
first-time playtester walked through the game and identified
the following UX issues that need design attention.

The game has five tab screens: WILDS (exploration map), SELF
(character stats), SATCHEL (inventory/equipment), MEMOIR
(journal), and combat (modal overlay).

## Preserve (Delight Points)

<List delight findings from the playtest — these anchor the
design. Don't break what works.>

### <delight title>
- What works: <observation>
- Why it works: <impact>
- Constraint: preserve this behavior in any redesign.

## Fix (Design Issues)

<Each design-routed finding, ordered by severity.>

### Issue <N>: <title> [from F##]
- Problem: <observation + impact from the playtest>
- Current behavior: <what happens now>
- Desired outcome: <the approach the user chose in triage>
- Affected screens: <tab/modal/component>
- Constraints: <from bearings.md — voice, hard rules, e.g.
  "no display literals at view layer">
- Priority: <high | medium | low>

## Summary for Designer

<2-3 sentences the user can paste into Claude Design as the
opening prompt. Summarizes the issues, references delight
anchors, and states the overall goal.>
```

If a previous `plan/DESIGN_SPEC.md` exists, archive its content
to `## Previous Specs` at the bottom before writing the new one.

### Step 4 — File phase candidates

For code-routed findings, append to `plan/PHASE_CANDIDATES.md`
using the existing candidate format and scoring heuristic:

```markdown
### <title> (playtest <date> [F##])
- source: deep-playtest
- finding: [F##] — <one-line from playtest report>
- approach: <user-chosen approach from triage>
- severity: <from finding>
- score: <baseline 2.5 + modifiers per existing heuristic>
```

Check for duplicates against existing candidates before adding.
If a candidate already covers this finding, add a cross-reference
note instead of a new entry.

### Step 5 — Update CRITIQUE.md

Cross-reference `plan/CRITIQUE.md`:

- If a playtest finding matches a Pending critique row, add
  `- playtest: confirmed by PLAYTEST_REPORT.md [F##]` to that
  row.
- If a playtest finding is new and has been routed (design or
  code), add a new Pending row with
  `source: deep-playtest [F##]` so `/iterate` can see it.
- Do not add rows for findings marked `intended` or `skipped`.

### Step 6 — Commit + push

```bash
git add plan/PLAYTEST_REPORT.md plan/DESIGN_SPEC.md \
    plan/PHASE_CANDIDATES.md plan/CRITIQUE.md
git commit -m "$(cat <<'EOF'
resolve-playtest: triaged <N> findings — <D> design, <C> code, <I> intended, <S> skipped

Design spec: plan/DESIGN_SPEC.md (<D> issues for Claude Design).
Phase candidates: <C> new candidates filed.
Delight points: <delight count> preserved in design spec.
EOF
)"
git push origin main
```

### Step 7 — Done

Print summary:

```
Playtest triage complete.
- <I> findings marked as intended (resolved).
- <D> findings routed to design spec (plan/DESIGN_SPEC.md).
- <C> findings routed to phase candidates.
- <S> findings skipped (still pending).
- <delight count> delight points preserved in design spec.

Next steps:
- Pass plan/DESIGN_SPEC.md to Claude Design for mockups.
- Run /oversight to review updated phase candidates.
- Run /iterate to pick up code-routed fixes.
```

## 5. Hard rules

1. **Always ask the user.** Never decide intended/unintended
   autonomously. This is the user-in-the-loop skill.
2. **Never modify shipped code.** Plan documents only.
3. **Preserve delight findings.** They anchor the design spec —
   never suggest changing them, never mark them as problems.
4. **Cross-reference everything.** PLAYTEST_REPORT ↔ DESIGN_SPEC
   ↔ PHASE_CANDIDATES ↔ CRITIQUE should all link to each other
   via `[F##]` references.
5. **One commit at the end.** Don't commit mid-triage — the user
   might cancel or restart.
6. **No emojis. No `Co-Authored-By:`.**
7. **Batch questions when safe.** If two findings are clearly
   related (same screen, same root cause), present them together
   in one question. Don't over-batch — when in doubt, ask
   separately.

## 6. Design spec output quality

The design spec is the user's handoff to Claude Design. It must
be self-contained — the designer will not read PLAYTEST_REPORT.md
or CRITIQUE.md. Every issue entry needs enough context that a
designer unfamiliar with the codebase can produce a mockup.

Specifically:
- Name the screen/tab/modal, not the React component.
- Describe current behavior in player terms, not code terms.
- State the desired outcome as a user-visible change.
- Include constraints from `plan/bearings.md` (especially Hard
  Rule 8: no display literals at view layer).
- The "Summary for Designer" section is the most important — it's
  what the user pastes as the opening prompt in Claude Design.

## 7. Failure modes

1. **No playtest report** → tell user to run `/deep-playtest`
   first and exit.
2. **All findings already resolved** → print "nothing to triage"
   and exit.
3. **User cancels mid-triage** → commit what's been triaged so
   far with note `(partial triage — <N> remaining)`. The user
   can resume with `/resolve-playtest` and only un-`[x]`
   findings will be presented.
4. **`git pull` divergence** → stop.
5. **PHASE_CANDIDATES.md or CRITIQUE.md missing** → create the
   file with the standard header before appending.
