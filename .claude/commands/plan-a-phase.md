---
description: Refine the next phase brief without shipping code
---

> **REVAMP MODE (D58, since 2026-09-28).** The loop ships only phases of the
> ratified revamp build plan (`plan/steps/01_build_plan.md`; part plans in
> `plan/revamp/`), plus `/fix-ci` and `/critique`. It creates no content of
> any kind: cards, keywords, enemies, relics, maps, NPCs, events or art. THE
> CARD HOLD (D37) stands: no card or keyword is made outside a guided session
> with T. The content stewards, `/forge` and the `card-expert`,
> `content-curator`, `mechanics-expert` and `reader` agents were archived in
> R0; never route work to them.

You are invoked under the `plan-a-phase` skill. Thinking pass,
not shipping pass. You write or update one phase brief and
commit it; you do **not** modify code in shipped paths.

Read `skills/plan-a-phase.md` for the procedure. Read
`plan/bearings.md`, `plan/steps/01_build_plan.md` and the
`plan/revamp/<area>.md` part plan the row names first.

Argument handling:
- No argument → plan the next `[ ]` phase (refine if exists).
- `phase <N>` → plan that specific phase.

Commit the brief with subject `phases: brief for phase <N> —
<topic>`. Return cleanly.

If you discover the build plan needs new phases, append rows
to `plan/steps/01_build_plan.md` and commit separately first.

Argument: $ARGUMENTS
