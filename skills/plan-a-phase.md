# Skill: plan-a-phase

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

> **Thinking pass.** Refines or generates one phase brief.
> Writes to `plan/phases/phase_<N>_<topic>.md`. Does NOT modify
> code. The output is what `/ship-a-phase` reads next.

## 1. Purpose

`/ship-a-phase` works best when the brief is concrete. If the
brief is missing or stale, the shipping loop has to think and
ship in the same tick. `/plan-a-phase` is the dedicated thinking
pass that keeps shipping cheap.

Use when:
- A phase brief doesn't exist yet, especially if design has
  landed for that surface.
- A sibling phase shipped that changes context.
- The user wants a refined brief before kicking off
  `/loop /ship-a-phase`.

## 2. Invocation

```
/plan-a-phase                # next [ ] phase
/plan-a-phase phase 5        # specific phase
```

## 3. Inputs (read in this order)

1. `plan/bearings.md` — stack, contracts, standing decisions.
2. `plan/steps/01_build_plan.md` — phase scope row.
3. `plan/revamp/<area>.md` — the part plan the row names, plus
   `plan/revamp/README.md` (zero-state, reset rules §5, order §7)
   and every decision it cites in
   `plan/2026-09-25-refactor-strategy.decisions.md` (D46–D64 and
   earlier). For a revamp phase this is the design.
4. `plan/phases/<canonical-sibling>.md` — template.
5. `axiomancer-mechanics/specs/` — formal design specs touching
   the phase's code. Specs marked HISTORICAL and
   `axiomancer-mechanics/braindump/` are background, never
   authority.
6. The closest already-shipped code touching the same area
   (`axiomancer-mechanics/src/*`, `axiomancer-mobile/`) for
   patterns.
7. `spec.md` — only if brief touches a surface bearings doesn't
   describe.
8. **Truth-source MCPs** — when the brief locks card / keyword /
   mechanic / balance decisions: `axio-query`
   (`axio_cards` / `axio_effects` / `axio_keywords` — the
   engine's current facts, never stale) and `kb-query`
   (`kb_find_games` / `kb_search` / `kb_cards` — external prior
   art and player-reception evidence, cited
   `kb:<game-slug>/<doc> (src-NNN)`). A "Decisions made upfront"
   row backed by a reception receipt or an engine-fact query is
   the brief doing its job; one argued from model memory is a
   guess wearing a lock. `axio-query` is an accelerator, not a
   dependency — grep the libraries when it is absent. `kb-query`
   is the only route to the external corpus: when it is absent,
   say the prior art is UNGROUNDED rather than sourcing it from
   memory unlabeled.

## 4. The brief format (`plan/phases/phase_<N>_<topic>.md`)

Mirrors `skills/ship-a-phase.md` §6. Fixed structure:

- **Sources** — the part plan (`plan/revamp/<area>.md`, section
  cited) and every decision number the phase rests on (e.g.
  D47, D58). A brief that cites neither is not done.
- **Outcome** — one line; what is true when the phase ships.
- **Scope** — workspaces touched and the files / systems changed,
  deleted or parked (and why "park" where the part plan says so).
- **Consumers to update** — engine exports, mobile screens,
  catalog/devlog exporters.
- **Save / schema contracts** — types, save-data shape, and the
  migration in `Game/game.migrate.ts` for anything removed from a
  save.
- **Carrier sweep** (R-phases) — glossary/atlas rows, glyphs,
  glosses and editor words left without a carrier (D45).
- **Decisions made upfront — DO NOT ASK** — every judgment
  call resolved, each tied to a D-number, the part plan, or a
  truth-source receipt.
- **Tests matrix** — suites added, rewritten or deleted with
  their subjects.
- **Verify gate** — the scoped workspace gates plus the revamp
  gates (`plan/revamp/README.md` §5).
- **Commit body template.**
- **DoD.**
- **Follow-ups (out of scope).**

A brief that leaves Open Qs is a brief that fails its job.
**Resolve every ambiguity.**

## 5. The procedure

### Step 0 — Sync + load

```bash
git pull --ff-only
```

Read all inputs in §3.

### Step 1 — Pick the phase

If no argument, the next `[ ]` row in `01_build_plan.md`. Else
the phase number passed.

### Step 2 — Audit existing brief (if any)

If `plan/phases/phase_<N>_<topic>.md` exists, check:

- Are design references current?
- Have sibling-phase commits introduced primitives this brief
  should reference?
- Are locked decisions still valid given new bearings entries?
- Are there Open Qs needing resolution?

If fully current: return cleanly with "brief still current — no
changes."

### Step 3 — Compose the new / refined brief

Walk the brief format (§4). For each section, derive content
from the inputs. Make decisions; document under "Decisions made
upfront — DO NOT ASK".

**Order of authority for Decisions:** the source-of-truth
hierarchy in `docs/truth-sources.md` (T's latest explicit
decision first — for the revamp, the D-numbers and the ratified
part plans). Phase-specific calls come last and never contradict
a ruling. If two sources disagree, follow that file's procedure:
surface the drift and reconcile it (a separate prior commit)
rather than silently pick one.

### Step 4 — Reality-check against codebase

Open the canonical sibling. Confirm every primitive your brief
references actually exists. If missing:

- Add it to phase scope ("ship X plus the missing primitive Y"),
  OR
- Push to a follow-up phase and note under Follow-ups.

### Step 5 — Commit

```bash
git add plan/phases/phase_<N>_<topic>.md
git commit -m "$(cat <<'EOF'
phases: brief for phase <N> — <topic>

- Part plan: plan/revamp/<area>.md (<section>).
- Decisions cited: <D-numbers>.
- N decisions resolved upfront (see brief).
EOF
)"
git push origin main
```

### Step 5.5 — Mirror the phase to GitHub (best-effort)

Once the brief is committed, open (or reuse) the phase mirror
issue so the public timeline reflects "next up" before shipping
starts:

```bash
issue_body=$(mktemp)
cat > "$issue_body" <<EOF
**Goal:** <one-line outcome from the brief's "Outcome" section>

<2–4 line summary of what shipping this phase delivers>

**Brief:** [\`plan/phases/phase_<N>_<topic>.md\`](https://github.com/no-trbl-2-u/Axiomancer/blob/main/plan/phases/phase_<N>_<topic>.md)

---
_Tracked by the autonomous loop. The phase commit will close this issue via a \`Closes #<this-issue>\` trailer; deploy URL is posted as a follow-up comment._
EOF

node scripts/loop-issue.mjs phase-open \
    --phase "<N>" \
    --title "Phase <N> — <topic>" \
    --body-file "$issue_body"
```

The helper is **idempotent** — if `/ship-a-phase` already opened
this phase's issue (or if a previous plan-a-phase tick did), the
same number is reused. Failures here are warnings, not blockers
(same contract as `/ship-a-phase` Step 2.5).

### Step 6 — Done

Return 2-line summary: "phase <N> brief committed — <one-line>.
ready for /ship-a-phase."

## 6. New phases (rare)

If during planning you discover the build plan is missing a
phase entirely:

- Append a new row to `01_build_plan.md` in the appropriate
  group; don't reorder existing numbers.
- Pick the next free phase number.
- Commit `01_build_plan.md` first
  (`plan: add phase <N> for <topic>`), then write its brief in
  a separate commit.
- Note rationale in the commit body — user reviews these more
  carefully.

## 7. Hard rules

1. **Never modify code in shipped paths.** Brief generation
   may add primitives to phase scope — but they ship via
   `/ship-a-phase`, not here.
2. **Never leave Open Qs in a generated brief.**
3. **No emojis, no `Co-Authored-By:`.**
4. **Contracts in `bearings.md` are law** — never propose
   shapes that contradict them.
5. **No content, no owner rows.** A brief never plans the
   creation of a card, keyword, enemy, relic, map, NPC, event or
   art (D58, D37), and never plans an owner-led B-row — those are
   T's sessions.

## 8. Failure modes

1. **Phase scope row in `01_build_plan.md` is itself
   ambiguous.** Fix the row first via separate commit; retry.
   If can't clarify without user input, stop.
2. **Design contradicts contract.** Surface; do not silently
   re-decide contract shape.

## 9. Quick reference

```bash
# Reads (in this order)
plan/steps/01_build_plan.md          # the phase row being refined
plan/revamp/<area>.md                # the part plan (design)
plan/2026-09-25-refactor-strategy.decisions.md  # D-numbers to cite
plan/bearings.md                     # contracts, standing decisions
docs/truth-sources.md                # authority when sources disagree
spec.md                              # product truth
axiomancer-mechanics/specs/          # design specs, if any landed
plan/AUDIT.md                        # open findings that touch the phase

# Writes
plan/phases/phase_<N>_<topic>.md     # the brief (the only deliverable)
plan/steps/01_build_plan.md          # only when adding a new phase row

# Commands
git pull --ff-only                   # Step 0
git commit && git push               # docs-only commit; verify gate not required
```
