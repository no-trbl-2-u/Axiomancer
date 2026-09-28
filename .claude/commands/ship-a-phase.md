---
description: Ship the next unchecked phase of the build plan end-to-end (loop-friendly, autonomous)
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

You are invoked under the `ship-a-phase` skill — full autonomy,
no review checkpoint. Read `skills/ship-a-phase.md` end to end
before touching anything else; that file is the single source
of truth for this command. The user's standing instruction is
**"more get-it-done, less ask me questions."** Decide instead
of asking; document the call in the commit body.

Argument handling:
- No argument → ship the next `[ ]` row in
  `plan/steps/01_build_plan.md`.
- `phase <N>` → ship that specific phase regardless of order.
- `phase <N> dry-run` → emit the brief at
  `plan/phases/phase_<N>_<topic>.md` without committing code.

Procedure: §6 of `skills/ship-a-phase.md`. Hard rules: §7.
Failure modes: §10. Everything else — empty data, design
ambiguity, missing brief — **resolve and ship**.

Be bold about delegating: spawn `scout` for external research,
`playtester` to drive the running app. Main agent's job is
wiring + decisions.

When invoked under `/loop` or `/march`, the user is not present.
After commit + push + deploy:check, return cleanly.

Argument: $ARGUMENTS
