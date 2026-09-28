---
description: Diagnose a failed verify-* workflow run on main, fix the root cause, verify locally, and push the fix to main. The red-main first responder.
---

You are invoked under the `fix-ci` skill. Read `skills/fix-ci.md`
end to end before touching anything else.

This skill reads a failed `verify-*` run on `main`, reproduces the
failure locally, fixes the root cause (never a suppression), and pushes
one `fix(ci):` commit to `main`. If HEAD is already green, it exits with
no commit.

Argument handling:
- `<run-id>` → diagnose that workflow run (what `ci-autofix.yml` passes).
- No argument → the most recent failed `verify-*` run on `main`.

Procedure: §3 of `skills/fix-ci.md`. Hard rules: §4. Failure modes:
§5. At most 3 iterations on one root cause, then page and stop.

When invoked from the ci-autofix workflow, the user is not present.
One commit, push, `npm run deploy:check`, return cleanly.

Argument: $ARGUMENTS
