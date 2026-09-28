# Skill: fix-ci

> **The red-main first responder.** When a `verify-*` workflow
> goes red on `main`, read the failed run, reproduce it locally,
> fix the root cause, and push the fix to `main`. One root cause
> per run. If `main` is already green again, exit fast with no
> commit.

> **REVAMP MODE (D58, since 2026-09-28; ends when Phase R11 ships).** The
> loop's phase work is only the ratified revamp build plan
> (`plan/steps/01_build_plan.md`; part plans in `plan/revamp/`). It creates
> no content of any kind: cards, keywords, enemies, relics, maps, NPCs, events
> or art. `/iterate` and `/expand` still run when no phase is ready, under the
> same no-content rule. THE CARD HOLD (D37) stands: no card or keyword is made
> outside a guided session with T. The content stewards, `/forge` and the
> `card-expert`, `content-curator`, `mechanics-expert` and `reader` agents
> were archived in R0; never route work to them. R11 revisits the loop to
> bring content phases back.

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

During the revamp most red runs will be fallout from a reset
phase: a test or consumer still pinned to something the phase
deleted. Fix it in the reset's direction. Re-point the test at a
survivor or delete it with its subject (`plan/revamp/README.md`
§5 rule 2). Never restore a deleted thing to get green.

## 2. Invocation

```
/fix-ci <run-id>      # diagnose that workflow run
/fix-ci               # find the most recent failed verify-* run on main
```

Runs from `.github/workflows/ci-autofix.yml` when a `verify-*`
workflow completes with `failure` on `main` (it passes the run
id), or by hand. With no argument:

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
   see the same failure. A fresh worktree needs `npm install` at
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
   broke). Push to `main`, then `npm run deploy:check`.
7. **Cap:** at most 3 iterations on the same root cause. Then
   stop cleanly and page:

   ```bash
   node scripts/notify.mjs --title "fix-ci: stuck" --priority high
   ```

## 4. Hard rules

1. **Root cause, never suppression.** No skipped tests, no
   `--no-verify`, no loosened types or thresholds.
2. **Reset direction.** A failure caused by a revamp deletion is
   fixed by finishing the deletion or re-pointing at the
   survivors, never by restoring deleted content (D50, D58).
3. **No new content.** A fix never authors a card, keyword,
   enemy, relic, map, NPC, event or art to satisfy a test.
4. **One root cause, one commit.** Unrelated red found on the
   way is a `plan/AUDIT.md` row, not a second fix.
5. **Standing rules apply** (`AGENTS.md` → "Nexus standing
   rules"): atomic commit+push to `main`, no force-push, no
   destructive resets, verify gate in the foreground, no
   `Co-Authored-By`, no emojis.

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
gh run view <run-id> --log-failed                          # read it
npm run verify -w <workspace>                              # reproduce a package gate
gh run rerun <run-id> --failed                             # flake check
npm run deploy:check                                       # after the push
node scripts/notify.mjs --title "fix-ci: stuck" --priority high
.github/workflows/ci-autofix.yml                           # the trigger
```
