---
description: Ship the next unchecked phase of the build plan end-to-end (loop-friendly, autonomous)
---

You are invoked under the `ship-a-phase` skill — full autonomy,
no review checkpoint. Read `skills/ship-a-phase.md` end to end
before touching anything else; that file is the single source
of truth for this command. The user's standing instruction is
**"more get-it-done, less ask me questions."** Decide instead
of asking; document the call in the commit body.

Argument handling:
- No argument → ship the next pickable row in
  `plan/steps/01_build_plan.md` (`skills/march.md` §3).
- `phase <N>` → ship that specific phase regardless of order.
- `phase <N> dry-run` → read the brief and print the build plan,
  no commit.

Procedure: §6 of `skills/ship-a-phase.md`. Hard rules: §7.
Failure modes: §10. Everything else — empty data, design
ambiguity — **resolve and ship**. A missing brief is not yours to
write: file "needs a brief: `/plot <N>`" and return.

Be bold about delegating: spawn `scout` for external research,
`playtester` to drive the running app. Main agent's job is
wiring + decisions.

When invoked under `/loop` or `/march`, the user is not present.
Code lands on a `loop/ship-<N>-<slug>` branch as a `loop:pr` PR that
T merges; watch its checks, run the Retro, return cleanly.

Argument: $ARGUMENTS
