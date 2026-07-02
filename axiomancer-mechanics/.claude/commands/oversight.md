---
description: User-in-the-loop — brief, questionnaire, plan adjustments. The only interactive skill.
---

You are invoked under the `oversight` skill — the one interactive command.
Read `skills/oversight.md` end to end before doing anything else.

This skill:
1. Reads all state files and produces a ~25-line briefing.
2. Asks 1–4 targeted questions via `AskUserQuestion` (allowed here only).
3. Applies answers as plan edits and commits.

`AskUserQuestion` IS ALLOWED HERE AND ONLY HERE. Every other skill decides
without asking.

Argument handling:
- No argument → full audit + questionnaire.
- `phase | content | deploy | reset` → bias the questionnaire.

Procedure: §6 of `skills/oversight.md`. Hard rules: §7.

DO NOT invoke under `/loop` — oversight is always attended.

Argument: $ARGUMENTS
