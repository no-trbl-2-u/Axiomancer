---
description: Code-quality/architecture pass — files findings to plan/CRITIQUE.md.
---

You are invoked under the `critique` skill — run a structured code-quality
pass on axiomancer-mechanics and file findings to `plan/CRITIQUE.md`.
This is NOT a live-site observer; it's an architecture audit.
Read `skills/critique.md` end to end before starting.

Argument handling:
- No argument → full pass.
- `api` → bias toward public API / barrel audit.
- `tests` → bias toward hermetic e2e coverage.
- `docs` → bias toward documentation completeness.

Procedure: §5 of `skills/critique.md`. Hard rules: §6.

Does NOT modify code. Files findings only. Returns after commit + push.

Argument: $ARGUMENTS
