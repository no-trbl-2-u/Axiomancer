# Skill: fix-ci

> **The red-CI first responder.** When a `verify-*` workflow
> goes red on `main`, read the failed run, reproduce it locally,
> fix the root cause, and push the fix to `main`. With `--branch`
> it does the same for a red `loop:pr` PR and pushes to the PR's
> branch (D87). One root cause per run. If the target is already
> green again, exit fast with no commit.

## 1. Purpose

A red `verify-*` run on `main` blocks every other tick (the
deploy gate fails closed), so it is fixed before anything else
ships. The usual cause is a change that passed its own
package's gate but broke a consumer. For example, a mechanics
diff that moves a map node passes `verify-mechanics`'s own
tests and still breaks mobile's `layout-engine-parity` test.
That is why AGENTS.md carries the cross-package impact
checklist. This skill closes the window between the red run
and the fix.

A red run that is fallout from a reset phase (a test or consumer
still pinned to something the phase deleted) is fixed in the
reset's direction: re-point the test at a survivor or delete it
with its subject (`plan/revamp/README.md` §5 rule 2). Never
restore a deleted thing to get green.

## 2. Invocation

```
/fix-ci <run-id>                     # diagnose that workflow run on main
/fix-ci                              # most recent failed verify-* run on main
/fix-ci <run-id> --branch <branch>   # red loop:pr PR: fix on its branch (§3.5)
/fix-ci --resolve <branch>           # finish a pr-resolve merge (§3.6)
```

Runs from `.github/workflows/ci-autofix.yml` when a `verify-*`
workflow completes with `failure` on `main` (it passes the run
id), from `.github/workflows/pr-autofix.yml` (on Haiku) for a red
`loop:pr` PR, from `.github/workflows/pr-resolve.yml` for a merge
conflict the union rules could not settle, or by hand. With no
argument:

```bash
gh run list --branch main --status failure --limit 10 \
  --json databaseId,workflowName,headSha,createdAt
```

and take the newest run whose workflow name starts with
`verify-`.

## 3. The procedure

1. **Sync:** `git pull --ff-only`. If HEAD has moved past the
   failing commit, first check whether the failure still
   reproduces on HEAD. A later tick may already have fixed it.
   If HEAD is green, exit cleanly with no commit.
2. **Read the failure:**

   ```bash
   gh run view <run-id> --log-failed
   ```

   Identify the failing job, step and root cause. Do not guess
   from the workflow name alone: one workflow runs many legs
   (lint, lexicon, type-check, jest, e2e journeys).
3. **Reproduce locally:** run the failing step's own command,
   as named in the workflow file under `.github/workflows/`.
   For a package gate that is usually
   `npm run verify -w <workspace>`; for an e2e journey it is the
   named `npm run e2e:* -w axiomancer-mobile` script. Confirm you
   see the same failure. A journey step lives in both
   `verify-mechanics.yml` and `verify-mobile.yml`; a fix to one is a
   fix to both (lesson `parallel-journey-lists`). A fresh worktree needs `npm install` at
   its root first (AGENTS.md → Verify).
4. **Fix the root cause.** Make the minimal correct fix, not a
   suppression. Never skip or disable a test, loosen a type, or
   widen a snapshot to get green. If the correct fix is genuinely
   large, file the diagnosis to `plan/AUDIT.md` as a HIGH row
   (what fails, where, the root cause, the proposed fix), commit
   that, and exit. The loop picks it up; nothing waits on a
   user decision.
5. **Cross-package check:** apply the AGENTS.md cross-package
   impact checklist. If your fix touches the listed mechanics
   paths, also run each consumer gate that checklist names.
6. **Ship:** one commit, `fix(ci): <root cause>`, with the
   diagnosis in the body (the failing run id, the step, why it
   broke). Push to `main` (a fix of red `main` is the sanctioned
   direct push, D84), then `npm run deploy:check`.
7. **Cap:** at most 3 iterations on the same root cause. Then
   stop cleanly and page:

   ```bash
   node scripts/notify.mjs --title "fix-ci: stuck" --priority high
   ```

8. **Retro:** run `skills/march.md` §3 "Retro" (plan-only; push
   `main`).

## 3.5 `--branch`: a red `loop:pr` PR (D87)

`pr-autofix` passes the failed run id and the PR's head branch. Same
procedure as §3, with these differences:

1. **Sync the branch, not main:** `git fetch origin && git switch
   <branch> && git pull --ff-only`. Confirm the branch's PR is open
   and labelled `loop:pr` (`gh pr list --head <branch> --label
   loop:pr --state open`); if not, exit with no commit.
2. **Still red?** If the branch's head has moved past the failing
   commit and its checks are green, exit with no commit.
3. **Fix the root cause on the branch.** The failure is this PR's
   unless it reproduces identically on `origin/main`; a failure that
   is `main`'s is not fixed here (exit and say so; `ci-autofix` owns
   it). Keep the fix minimal and inside what the PR already touches
   where possible.
4. **Ship:** one commit `fix(ci): <root cause>` on the branch, `git
   push origin <branch>`. **Never** force-push, rebase, merge `main`
   in (that is `pr-resolve`'s job), merge the PR, or touch `main`.
5. **One root cause per run.** The workflow allows two runs per PR;
   it labels the PR `loop:pr-stuck` after that, so do not loop past
   your one fix.

## 3.6 `--resolve`: finish a conflicted merge

`pr-resolve` has already checked out `<branch>`, run `git merge
origin/main`, and left conflict markers in the files it could not
settle by union. This run uses **Read and Edit only** (no shell):

1. For each file `git` reported conflicted (the workflow lists them in
   the prompt), read it and resolve every `<<<<<<<` / `=======` /
   `>>>>>>>` block so both sides' intent survives. Where both sides
   changed the same logic and one must lose, keep `main`'s side and
   say which hunk in your final message.
2. Leave no marker behind. Do not edit any file the prompt did not
   list. The workflow commits and pushes after you exit, and fails
   if a marker remains.

## 4. Hard rules

1. **Root cause, never suppression.** No skipped tests, no
   `--no-verify`, no loosened types or thresholds.
2. **Reset direction.** A failure caused by a reset deletion is
   fixed by finishing the deletion or re-pointing at the
   survivors, never by restoring deleted content (D50).
3. **No new content.** A fix never authors a card, keyword,
   enemy, relic, map, NPC, event or art to satisfy a test (D88).
4. **One root cause, one commit.** Unrelated red found on the
   way is a `plan/AUDIT.md` row, not a second fix.
5. **Standing rules apply** (`AGENTS.md` → "Nexus standing
   rules"): atomic commit+push to the target (`main`, or the PR
   branch with `--branch`), no force-push, no destructive resets,
   verify gate in the foreground, no attribution trailers, no
   emojis.

## 5. Failure modes

1. **HEAD already green.** Exit 0, no commit.
2. **Cannot reproduce locally** (CI-only flake, runner
   difference). Re-run the failed job once
   (`gh run rerun <run-id> --failed`). If it passes, file a LOW
   `plan/AUDIT.md` row naming the flake. If it fails again,
   diagnose from the log alone and say so in the commit body.
3. **The failure is in the workflow, not the code** (missing
   secret, runner image change). Fix the workflow file if the
   fix is certain; otherwise file a HIGH `plan/AUDIT.md` row.
4. **`gh` unavailable or unauthenticated.** Exit 3; nothing to
   read.
5. **Stuck after 3 iterations.** Page per §3 step 7 and stop.

## 6. Quick reference

```bash
gh run list --branch main --status failure --limit 10     # find the red run
gh pr list --head <branch> --label loop:pr --state open   # --branch: confirm the PR
gh run view <run-id> --log-failed                          # read it
npm run verify -w <workspace>                              # reproduce a package gate
gh run rerun <run-id> --failed                             # flake check
npm run deploy:check                                       # after the push
node scripts/notify.mjs --title "fix-ci: stuck" --priority high
.github/workflows/ci-autofix.yml                           # trigger: red main
.github/workflows/pr-autofix.yml                           # trigger: red loop:pr PR (Haiku)
.github/workflows/pr-resolve.yml                           # trigger: conflicted loop:pr PR
```
