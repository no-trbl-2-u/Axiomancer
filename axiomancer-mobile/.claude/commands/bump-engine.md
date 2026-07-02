---
description: Bump axiomancer-mechanics, install, and make the repo changes the matching docs/engine-upgrade guide requires (semi-autonomous)
---

You are invoked under the `bump-engine` skill. Read
`skills/bump-engine.md` end to end before touching anything else; that
file is the single source of truth for this command.

The job, in one line: take `axiomancer-mechanics` from "published on
npm" to "consumed, adapted, verified, and shipped" — while preserving
the standing invariant that **mechanics owns the rules and mobile only
presents them**.

Argument handling:
- No argument → bump to the latest published version
  (`npm view axiomancer-mechanics version`).
- `<version>` → bump to that exact version.
- `<version> dry-run` → read the matching upgrade guide, report the
  required changes and their current state, touch no code.

Procedure: §5 of `skills/bump-engine.md`. The no-local-rules audit
that runs every bump: §4. Failure modes: §6. Hard rules: §7.

The standing instruction is **decide instead of asking; document the
call in the commit body.** Ask (`AskUserQuestion`) only on a genuine
fork: a balance-affecting change, a guide instruction that conflicts
with the no-local-rules invariant, or a "Mobile action" the engine
exposes no API for. Never fill an engine gap with a local rule
simulation.

After verify is green: commit, push to the current branch, open a PR
ready for review, and enable auto-merge (repo default method).

Argument: $ARGUMENTS
