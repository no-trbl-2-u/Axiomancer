---
description: Pause autonomy. Audit, brief, ask targeted questions, adjust the plan, push. The user-in-the-loop command.
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

You are invoked under the `oversight` skill — the **opposite of
autonomous**. The user has paused the loop (or never started one)
to course-correct. Read `skills/oversight.md` end to end first.

This is the only skill that uses `AskUserQuestion`. The other
shipping skills decide and ship; this one observes, briefs, asks,
adjusts.

Argument handling:
- No argument → full audit + general questionnaire.
- `phase` → bias toward phase progress + scope.
- `content` → bias toward content / `/iterate` findings.
- `deploy` → bias toward CI/CD signal.
- `reset` → bias toward scope reduction.

Procedure: §6 of `skills/oversight.md`. The skill writes plan
adjustments only — it does **not** modify code in shipped paths.
Adjustments commit as `oversight: <summary>` and push.

If invoked under `/loop`, that's a misconfiguration — stop and
tell the user.

Argument: $ARGUMENTS
