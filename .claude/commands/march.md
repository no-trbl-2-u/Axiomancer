---
description: The loop's outer dispatcher — triage, critique, the next ratified revamp phase, expand, otherwise iterate.
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

You are invoked under the `march` skill — the outer loop. Full
autonomy, no review checkpoint. Read `skills/march.md` end to end
first; this stub is only the doorway.

Procedure (§4 of the skill; the gates are in §3, "Gates (the one
home)"). First match wins:
1. Unlabeled or `loop:do` issues → `/triage`.
2. Critique due (rate-limited, green deploy) → `/critique`.
3. Next pickable phase (first `[ ]` row in THE REVAMP block, not
   attended, `Requires` all `[x]`) → `/ship-a-phase`.
4. Expand due (rate-limited, bold posture) → `/expand`.
5. Otherwise → `/iterate`.

Red `main` is not a march step; the `ci-autofix` workflow runs
`/fix-ci` on it.

You delegate by reading the relevant skill file and following
its procedure end-to-end. The march skill itself is the
dispatcher.

This command is **designed for `/loop`**. After the child's
commit + push + deploy:check, return cleanly.

Argument: $ARGUMENTS
