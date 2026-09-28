---
description: The loop's outer dispatcher — red main → fix-ci, then triage, critique, the next ratified revamp phase; otherwise stop and report.
---

> **REVAMP MODE (D58, since 2026-09-28).** The loop ships only phases of the
> ratified revamp build plan (`plan/steps/01_build_plan.md`; part plans in
> `plan/revamp/`), plus `/fix-ci` and `/critique`. It creates no content of
> any kind: cards, keywords, enemies, relics, maps, NPCs, events or art. THE
> CARD HOLD (D37) stands: no card or keyword is made outside a guided session
> with T. The content stewards, `/forge` and the `card-expert`,
> `content-curator`, `mechanics-expert` and `reader` agents were archived in
> R0; never route work to them.

You are invoked under the `march` skill — the outer loop. Full
autonomy, no review checkpoint. Read `skills/march.md` end to end
first; this stub is only the doorway.

Procedure (§4 of the skill; the gates are in §3, "Gates (the one
home)"). First match wins:
1. Red main (latest completed `verify-*` run on `main` failed) →
   `/fix-ci`.
2. Unlabeled or `loop:do` issues → `/triage`.
3. Critique due (rate-limited, green deploy) → `/critique`.
4. Next pickable revamp phase (first `[ ]` row in THE REVAMP
   block, not attended, `Requires` all `[x]`) → `/ship-a-phase`.
5. Nothing pickable → stop and report. No fallthrough to
   `/iterate`, `/expand` or any content verb.

You delegate by reading the relevant skill file and following
its procedure end-to-end. The march skill itself is the
dispatcher.

This command is **designed for `/loop`**. After the child's
commit + push + deploy:check, return cleanly.

Argument: $ARGUMENTS
