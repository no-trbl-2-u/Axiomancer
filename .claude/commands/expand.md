---
description: Read accumulated signals (audit, critique, triage, spec drift, design, data) and propose new phase candidates to plan/PHASE_CANDIDATES.md. Posture-controlled (bold default).
---

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
`/expand` is plan-only: commit + push `main`, return cleanly.

Argument: $ARGUMENTS
