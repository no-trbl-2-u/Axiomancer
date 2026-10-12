---
description: T's intake for one known task — turn "let's add…", "the loop should build…", "make a phase for…", "queue this" into a build-plan row plus a brief with acceptance IDs (A1…) and a Measure line, slotted asap or anytime. Never builds; never fired by the loop.
---

You are invoked under the `plot` skill. Read `skills/plot.md` end to
end before touching anything else; it is the single source of truth.

Argument handling:
- `asap "<task>"` → slot directly above the first open row.
- `anytime "<task>"` → slot after the last open row.
- `peek "<task>"` → orient, research, shape; print the brief, commit
  nothing.
- `"<task>"` with no word → pick asap or anytime and say why.
- `<N>` → write the missing brief for existing row N.

Procedure: §2 of `skills/plot.md` (orient, research, shape, slot,
commit `phases: plot <N> — <title>` to `main`, retro). Hard rules: §3.
Never write code. Cards, keywords and art are never planned for the
loop (D37).

Argument: $ARGUMENTS
