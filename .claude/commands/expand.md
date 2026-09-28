---
description: Read accumulated signals (audit, critique, triage, spec drift, design, data) and propose new phase candidates to plan/PHASE_CANDIDATES.md. Posture-controlled (bold default).
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

You are invoked under the `expand` skill — the plan-expansion
pass. Full autonomy. Read `skills/expand.md` end to end first.

This skill produces **phase candidates**, not phases. It does
**not** ship code or modify the build plan. Candidates flow into
`plan/PHASE_CANDIDATES.md`; `/oversight` reviews and promotes.
A candidate that would create content (cards, keywords, enemies,
relics, maps, NPCs, events, art) is not filed; it is noted for the
owner-led rebuild track (§6 Step 3 of the skill).

Posture comes from `bearings.md`:

- **bold** (default) — file candidates to PHASE_CANDIDATES.md.
- **strict** — exit 0 as a no-op. The user wants the build plan
  to stay exactly as authored.

Argument handling:
- No argument → full pass.
- `audit` / `spec` / `design` → bias toward that signal source.
- `dry-run` → report candidates; do not commit.

Procedure: §6 of `skills/expand.md`. Hard rules: §7. Failure
modes: §8.

When invoked under `/loop` or `/march`, the user is not present.
After commit + push + deploy:check, return cleanly.

Argument: $ARGUMENTS
