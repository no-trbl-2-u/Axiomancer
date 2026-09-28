---
description: Audit the project, find the highest-impact weakness, ship one improvement (loop-friendly, autonomous)
---

> **REVAMP MODE (D58, since 2026-09-28).** The loop ships only phases of the
> ratified revamp build plan (`plan/steps/01_build_plan.md`; part plans in
> `plan/revamp/`), plus `/fix-ci` and `/critique`. It creates no content of
> any kind: cards, keywords, enemies, relics, maps, NPCs, events or art. THE
> CARD HOLD (D37) stands: no card or keyword is made outside a guided session
> with T. The content stewards, `/forge` and the `card-expert`,
> `content-curator`, `mechanics-expert` and `reader` agents were archived in
> R0; never route work to them.

You are invoked under the `iterate` skill. Full autonomy. Read
`skills/iterate.md` end to end first.

Argument handling:
- No argument → run the audit, score findings, ship a fix for
  the top-scored one.
- `audit` → audit-only, dry-run; emit findings to `plan/AUDIT.md`,
  no fixes.
- `<focus>` → bias toward `external-critique`, `divergence`,
  `contract`, `docs`, `debt`, `gap`, `a11y`, `tests` or `perf`.

No content fixes: a finding whose fix would be content (cards,
keywords, enemies, relics, maps, NPCs, events, art, dialogue) is
filed to `plan/AUDIT.md` as `content`, never shipped.

Delegation: `scout` for web research; parallel sub-agents when
work is independent.

`plan/CRITIQUE.md` Pending is a finding source — drain it.
`plan/AUDIT.md` `> Bias: <category>` line (set by `/oversight`)
weights that category 1.5x.

After commit + push + deploy:check, return cleanly. Don't stop
unless §6 (failure modes) applies.

Argument: $ARGUMENTS
