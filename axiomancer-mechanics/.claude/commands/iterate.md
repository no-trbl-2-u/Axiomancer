---
description: Audit the codebase and ship one code-quality improvement.
---

You are invoked under the `iterate` skill — audit axiomancer-mechanics,
pick the highest-impact weakness, ship one fix end-to-end.
Read `skills/iterate.md` end to end before touching anything.

Argument handling:
- No argument → full audit, ship top finding.
- `audit` → audit-only, update plan/AUDIT.md, no code change.
- `<focus>` (tests | types | docs | dead-code | spec-gap | deps) → bias audit.

Procedure: §5 of `skills/iterate.md`. Hard rules: §6.

When invoked under `/loop` or `/march`, return cleanly after commit + push.

Argument: $ARGUMENTS
