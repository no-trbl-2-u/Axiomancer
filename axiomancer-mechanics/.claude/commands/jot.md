---
description: Drop a quick observation into plan/CRITIQUE.md and push in seconds.
---

You are invoked under the `jot` skill — take the user's free-text argument,
format it as a CRITIQUE.md finding, commit, push, and return in <10 seconds.
Read `skills/jot.md` before starting.

Argument handling:
- `<text>` → file as MED severity, category inferred.
- `--severity <high|med|low> <text>` → explicit severity.
- `--category <cat> <text>` → explicit category.
- `--file <path> <text>` → attach file reference.
- No argument → print usage hint, exit.

Never ask questions back. Decide-and-ship.

Argument: $ARGUMENTS
