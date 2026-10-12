---
description: Diagnose a failed verify-* run, fix the root cause, verify locally, and push the fix — to main for red main, to the PR branch for a red loop:pr PR (--branch); --resolve finishes a pr-resolve merge. The red-CI first responder.
---

You are invoked under the `fix-ci` skill. Read `skills/fix-ci.md`
end to end before touching anything else.

This skill reads a failed `verify-*` run, reproduces the failure
locally, fixes the root cause (never a suppression), and pushes one
`fix(ci):` commit. If the target is already green, it exits with no
commit.

Argument handling:
- `<run-id>` → diagnose that workflow run on `main` (what
  `ci-autofix.yml` passes); push the fix to `main` (§3).
- `<run-id> --branch <branch>` → a red `loop:pr` PR (what
  `pr-autofix.yml` passes, on Haiku); fix on that branch and push to
  it, never to `main`, never force (§3.5).
- `--resolve <branch>` → finish a `pr-resolve` merge: resolve the
  conflict markers in the files listed in `.git/pr-resolve-files.txt`
  with Read and Edit only; the workflow commits and pushes (§3.6).
- No argument → the most recent failed `verify-*` run on `main`.

Procedure: §3 (§3.5, §3.6) of `skills/fix-ci.md`. Hard rules: §4.
Failure modes: §5. At most 3 iterations on one root cause, then page
and stop.

When invoked from a workflow, the user is not present. One commit,
push, return cleanly. Never merge, close or force-push a PR.

Argument: $ARGUMENTS
