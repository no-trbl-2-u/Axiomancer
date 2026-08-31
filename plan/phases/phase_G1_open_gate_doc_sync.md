# Phase G1 — `.claude/**` OPEN GATE doc sync

## Outcome / Why

THE OPEN GATE (`plan/bearings.md`, T direct, attended session 2026-08-28)
lifted the "engine constants are tuned manually, not here" wall (¶4) and
every remaining "propose-only" / "report-only" wall in the domain tuning
commands (¶5): *"every tuning/playtest command may ship what it proves,
through the verify + deploy gates."* None of that landed in the command
files themselves — `.claude/commands/{deck-tuning,combat-playtest,
world-tuning,hazard-tuning}.md` still carry the pre-OPEN-GATE wall text
verbatim, so an operator reading the command docs sees a stricter contract
than the loop actually operates under. `plan/AUDIT.md`'s
`[debt] .claude/** doc sync ... [loop-call]` row (filed 2026-08-28) flagged
this as classifier-blocked at the time; a direct `Edit()` probe this tick
(2026-08-31, `/march`) succeeded, so that block no longer holds — clearing
it now. Also missing: a `.claude/commands/forge.md` doorway pointer for
`skills/forge.md` (the content-growth loop verb `/march` already dispatches
to directly by reading the skill file — the command file is a discoverability
doorway only, not load-bearing for the loop itself).

## Scope (files touched)

1. `.claude/commands/deck-tuning.md` — remove "Engine constants are tuned
   manually, not here" (frontmatter description + body prose), correct the
   disambiguation table's "engine-constant tuning (manual)" row and the
   "Related loops" footer line.
2. `.claude/commands/combat-playtest.md` — remove "Report only ... this
   skill ships NO balance changes" framing and "engine-constant follow-ups
   are handled manually" (frontmatter description + body prose + the
   disambiguation table row).
3. `.claude/commands/world-tuning.md` — remove "Dispatcher/handler CONTROL
   FLOW stays propose-only" wall.
4. `.claude/commands/hazard-tuning.md` — the structural-findings
   "propose-only" wall for architecturally significant findings (numeric
   changes were already applyable; the doc still gates structural findings
   as propose-only, which THE OPEN GATE ¶5 lifted too).
5. `.claude/commands/forge.md` — new file, doorway pointer to
   `skills/forge.md`, mirroring the format of the existing tuning command
   files' frontmatter + short body.

## Decisions made upfront — DO NOT ASK

- **Wording, not restructuring.** Each file keeps its existing shape
  (frontmatter description, disambiguation tables, body sections); only the
  superseded clauses are rewritten to state the current THE OPEN GATE
  doctrine. No section reorganization.
- **`hazard-tuning.md`'s numeric-change-applies-now behavior is unchanged**
  — it already applies numeric changes; only the structural/architectural
  "propose-only" language is lifted per ¶5.
- **`forge.md` is a pointer, not a duplicate.** `/march` reads
  `skills/forge.md` directly (Step 3b) — the command file exists only so a
  human typing `/forge` finds the loop verb; it should not re-author the
  skill's procedure.
- **No code changes** — `.claude/commands/**` is documentation/config, not
  application code. The verify gate is a sanity check only.

## Verify gate

```bash
npm run verify
```

Doc-only diff outside any workspace — expected to pass unchanged.

## Commit body template

```
docs(.claude): lift superseded OPEN GATE wall text from tuning commands — phase G1

- <bullets>

Decisions:
- classifier-block from the 2026-08-28 AUDIT row no longer reproduces;
  Edit() on .claude/commands/*.md succeeded this tick
- <other calls>

Closes #<phase-issue-number>
```

## DoD

- None of `deck-tuning.md`, `combat-playtest.md`, `world-tuning.md`,
  `hazard-tuning.md` state "engine constants are tuned manually, not here"
  or "propose-only" / "report only" as a current constraint.
- `.claude/commands/forge.md` exists and points to `skills/forge.md`.
- `npm run verify` green.

## Follow-ups (out of scope)

- None identified — this is a self-contained doc-text lift.
