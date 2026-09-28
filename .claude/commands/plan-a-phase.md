---
description: Refine the next phase brief without shipping code
---

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
