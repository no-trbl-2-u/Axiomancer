---
description: Audit the project, find the highest-impact weakness, ship one improvement (loop-friendly, autonomous)
---

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
filed to `plan/AUDIT.md` as `content`, never shipped (D88). A
defect found while shipping is fixed in the same tick in its own
commit (D90).

Delegation: `scout` for web research; parallel sub-agents when
work is independent.

`plan/CRITIQUE.md` Pending is a finding source — drain it.
`plan/AUDIT.md` `> Bias: <category>` line (set by `/oversight`)
weights that category 1.5x.

A code fix lands as one `loop:pr` PR (`loop/iterate-<slug>`) that T
merges; a plan-only fix pushes `main`. Watch the PR's checks, run
the Retro, return cleanly. Don't stop unless §6 (failure modes)
applies.

Argument: $ARGUMENTS
