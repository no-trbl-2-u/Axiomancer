---
description: Diagnose a failed verify-* workflow run on main, fix the root cause, verify locally, and push the fix to main. The red-main first responder.
---

You are invoked under the `fix-ci` skill — the first responder when a
`verify-*` workflow goes red on `main`. The nexus standing rules
(`AGENTS.md`, `plan/bearings.md`) apply: atomic commit+push to `main`, no
`--no-verify`, no force-push, verify gate foreground.

Witness for why this exists: the `grant_permanent_wild_die` variant
(edba726) shipped with mechanics + mobile green but left
`verify-card-editor` red on `main` for half a day. This skill closes that
window.

Argument handling:
- `<run-id>` → diagnose that specific workflow run.
- No argument → find the most recent failed `verify-*` run on `main`
  (`gh run list --branch main --status failure`).

Procedure:

1. **Sync:** `git pull --ff-only`. If HEAD has moved past the failing
   commit, first re-check whether the failure still reproduces on HEAD —
   someone (or a later tick) may already have fixed it. If green, exit
   cleanly with no commit.
2. **Read the failure:** `gh run view <run-id> --log-failed`. Identify the
   failing workspace and the root cause. Do not guess from the workflow
   name alone.
3. **Reproduce locally:** run that workspace's verify leg
   (`npm run verify -w axiomancer-mechanics`, `npm run verify -w
   axiomancer-mobile`, or `npm run verify -w axiomancer-card-editor`)
   and confirm you see the same failure.
4. **Fix the root cause** — the minimal correct fix, not a suppression.
   Never skip/disable a test or loosen a type to get green; if the correct
   fix is genuinely large or ambiguous, stop, file the diagnosis to
   `plan/AUDIT.md` as a HIGH row (with `[needs-user-call]` if it needs a
   decision), commit that, and exit.
5. **Cross-package check:** apply the AGENTS.md cross-package impact
   checklist — if your fix touches the listed mechanics paths, also run the
   mobile verify and card-editor type-check legs.
6. **Ship:** one commit (`fix(ci): <root cause>` with the diagnosis in the
   body), push to `main`, then `npm run deploy:check`.
7. **Cap:** ≤3 iterations on the same root cause, then stop cleanly and
   page via `node scripts/notify.mjs --title "fix-ci: stuck" --priority high`.

Argument: $ARGUMENTS
