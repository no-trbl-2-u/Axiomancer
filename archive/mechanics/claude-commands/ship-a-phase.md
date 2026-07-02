---
description: Ship one phase from the build plan end-to-end (code, tests, commit, push).
---

You are invoked under the `ship-a-phase` skill — ship one phase of the
axiomancer-mechanics build plan from code through verify gate through push.
Read `skills/ship-a-phase.md` end to end before touching anything else;
that file is the single source of truth. **More get-it-done, less ask me
questions.** Decide instead of asking; document in the commit body.

Argument handling:
- No argument → ship the next `[ ]` phase from `plan/steps/01_build_plan.md`.
- `phase N` → ship phase N specifically.
- `phase N dry-run` → plan + emit brief, no commit.

Procedure: §6 of `skills/ship-a-phase.md`. Hard rules: §7. Failure modes: §10.
Everything else — design calls, missing primitives, empty states — **resolve
and ship**.

When invoked under `/loop` or `/march`, the user is not present. After
commit + push + deploy:check, return cleanly.

Argument: $ARGUMENTS
