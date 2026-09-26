# Lessons

> The domain-keyed corpus. Unlike `reflexes.md` (always read
> in full), this file is read **by offset** — a skill greps
> for its own `<!-- @domain:x -->` anchor and reads from
> there, not the whole file. Caps are hard: ≤500 bytes per
> bullet. The promotion path is lesson → reflex (`reflexes.md`);
> the drain path is reflex → skill procedure edit.

<!-- @domain:deploy -->

## Deploy

1. 2026-07-18 — Background march/night loops share the ONE working
   tree. A live loop swept an uncommitted local edit into its own
   commit, entangled with its half-done feature (+ a type error), and
   my new branch inherited it. Pause the loop before local phase work;
   if you can't, ship clean via an isolated `git worktree add --detach
   <tmp> origin/main`, `git checkout <sha> -- <only-your-files>`,
   commit there, and push by SHA — never the shared tree. Source: PR
   #120 (color-match rider removal).

2. 2026-08-19 — `verify-mechanics.yml` and `verify-mobile.yml` carry
   PARALLEL copies of the browser-journey step list under different job
   names. A journey added to one silently skips whichever PR shape
   triggers the other, and CI stays green because the step never ran.
   Also: CI invokes each `e2e:*` script individually — it never runs the
   `e2e:minigames` chain, so wiring a harness only into that chain wires
   it into nothing. Edit both workflows together. Source: PR #216.

3. 2026-08-19 — A green check is not evidence a new gate ran. Two greens
   on PR #216 were hollow. Confirm a newly added CI step by grepping the
   JOB LOG for its own output line, not by reading the check conclusion.
   Same rule for GitHub writes: a 200 from `update_pull_request` does not
   mean the body changed (`updated_at` stayed put; the server strips a
   model-supplied attribution footer on edit). Verify the effect, not the
   response. Source: PR #216.

4. 2026-09-25 — Parallel PR branches in one session each commit the
   same telemetry shard, so the second merge conflicts (add/add). The
   shard is append-only: resolve by taking the union of rows, sorted by
   timestamp. Auto-merge is disabled on this repo (`gh pr merge --auto`
   fails), so "merge when green" means waiting on checks and then
   merging by hand. Source: T5 PRs #376–#381.

5. 2026-09-25 — Verify an explorer's "gap" claim before you file work on
   it. A read-only sweep reported the CI map-scope gap as open, citing
   an AUDIT row whose RESOLVED note sat a few lines below the excerpt it
   read. Read the whole row and the live code
   (`ci-e2e-scope.mjs:133`) first. Source: map-revamp kickoff prompt
   M0, corrected in the T5 residue.

<!-- @domain:data -->

## Data

1. 2026-07-18 — An A/B court that swaps cards must VALIDATE the
   structural laws (5/5/5 color law, deck size) before measuring, or it
   ratifies illegal seats: D8's court measured augury's valve in a
   heart seat for a mind card (+3.3, best result) and only the
   structural test caught it — the ratified number was for an
   unshippable deck. Bake the law checks into the court harness, not
   just the after-the-fact tests. Source: 10ec4fe8 (Phase D8).

<!-- @domain:review -->

## Review

1. <ISO> — <one-line lesson, ≤500 bytes>. Source:
   <commit or issue reference>.

## Adding a domain

Append a new `<!-- @domain:<name> -->` anchor + `##` heading
at the bottom. Keep domain names short and stable — skills
reference them by name (`grep '@domain:deploy'`), so a rename
is a breaking change to every skill that reads this file.
