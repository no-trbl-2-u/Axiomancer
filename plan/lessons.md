# Lessons

> The domain-keyed corpus, counted (R11, 2026-10-12). Unlike
> `reflexes.md` (always read in full), this file is read **by
> offset**: a skill greps for its own `<!-- @domain:x -->` anchor and
> reads from there. Written by the **Retro** step that closes every
> shipping verb (`skills/march.md` §3 "Retro"); linted by
> `scripts/check-lessons.mjs` (root `npm test` and the post-write
> guard).
>
> **Format.** One bullet per lesson, one line, ≤500 bytes:
>
> `- **<slug>** · <trap> → <rule> · seen <N>× · last <YYYY-MM-DD> · open`
>
> or, once something enforces it, `· guarded by <hook, test or lint>`
> in place of `open`. Slugs are lowercase-kebab and unique across the
> file; skills cite them inline where they bite (`… (lesson
> \`shared-tree-sweep\`)`).
>
> **The ladder.** Seen once: logged. Seen **2×**: automated in the
> same tick (a guard check, a test, a lint) and marked `guarded by`,
> or a `PHASE_CANDIDATES` row names the automation. Seen **3× across
> verbs**: the retro may promote it to `reflexes.md` directly;
> `/oversight` reviews promotions after the fact. **At most 40 open
> lessons**: past that, graduate one (guard it) or merge two before
> adding another.

<!-- @domain:deploy -->

## Deploy

- **shared-tree-sweep** · background march/night loops share one working tree; a live loop swept an uncommitted local edit into its own commit (PR #120) → pause the loop before local work, or ship from an isolated `git worktree add --detach <tmp> origin/main` and push by SHA · seen 1× · last 2026-07-18 · open
- **parallel-journey-lists** · `verify-mechanics.yml` and `verify-mobile.yml` carry parallel copies of the browser-journey steps, and CI runs each `e2e:*` script alone, never the `e2e:minigames` chain (PR #216) → edit both workflows together; wire a harness as its own step · seen 1× · last 2026-08-19 · open
- **green-is-not-ran** · two green checks on PR #216 were hollow, and a 200 from a GitHub write did not mean the body changed → confirm a new CI step by grepping the job log for its own output; verify the effect, not the response · seen 1× · last 2026-08-19 · open
- **telemetry-add-add** · parallel PR branches each commit the same telemetry shard, so the second merge conflicts add/add (T5 PRs #376-#381) → union the rows sorted by timestamp; never auto-merge (D86) · seen 1× · last 2026-09-25 · guarded by scripts/pr-resolve.mjs union merge (scripts/loop-pr.test.mjs)
- **verify-gap-claims** · an explorer reported a CI gap open, citing an AUDIT row whose RESOLVED note sat below its excerpt (map-revamp M0) → read the whole row and the live code before filing work on a gap claim · seen 1× · last 2026-09-25 · open
- **workflow-level-concurrency** · ci-autofix's workflow-level group let skipped green runs displace the real queued red one: 2 ran, 32 cancelled (R0) → put concurrency on the job, after the `if`, in its own group, never `nexus-loop` · seen 1× · last 2026-09-28 · guarded by scripts/loop-pr.test.mjs
- **cross-branch-telemetry-push** · `_claude-skill.yml`'s stranded-rows step pulled `--rebase origin main` and pushed `HEAD:main`; on a PR branch that would push the PR's commits to main (R11 review) → push only to the branch HEAD is on (`loop/*` or the run's ref) · seen 1× · last 2026-10-12 · guarded by scripts/loop-pr.test.mjs
- **union-edit-doubles** · a union merge of an append-only file keeps both the old and edited form of a row both sides touched (hunt) → count lines three ways (base, ours, theirs) and keep each only as often as the merge implies · seen 1× · last 2026-10-12 · guarded by scripts/loop-pr.test.mjs (unionMerge)

<!-- @domain:data -->

## Data

- **court-validates-laws** · an A/B court that swapped cards ratified a seat that broke the 5/5/5 colour law (Phase D8, 10ec4fe8) → validate the structural laws inside the harness before measuring · seen 1× · last 2026-07-18 · open

<!-- @domain:review -->

## Review

<!-- @domain:loop -->

## Loop

- **plan-only-push-race** · a plan-only `push HEAD:main` from a worktree branch was refused because a telemetry tick-end commit landed on main between the fetch and the push (plot R12a) → commit first, then `git fetch origin && git rebase origin/main && git push origin HEAD:main` as one act · seen 1× · last 2026-10-12 · open
- **loop-pr-label-missing** · the first `loop:pr` PR after R11 failed at `gh pr create`: the repo had no `loop:pr` label, and the PR cap and claims read that label (ship R12a, #505) → ensure the label exists before `gh pr create`; `skills/march.md` §3 "Landing a change" now runs `gh label create … || true` first · seen 1× · last 2026-10-13 · open
- **brief-dnum-in-comments** · a brief's D-number citations copied into code comments failed root `check-comments`, which the workspace-scoped gate skips (ship RH1) → D-numbers go in commit and PR bodies; code comments state the rule; run root `npm test` on any source change · seen 1× · last 2026-10-13 · guarded by scripts/check-comments.mjs (root npm test)
- **brief-pointer-drift** · the CS1 brief named atlas budget bands R10c had deleted and a truth-sources table that never existed (ship CS1) → before building, grep every file anchor a brief names; when one is gone, restate it from the ruling it cites and record the call under Decisions · seen 1× · last 2026-10-13 · open
- **mechanics-verify-misses-root-lints** · `npm run verify -w axiomancer-mechanics` passed, but root `npm test` failed `check-comments` on D-numbers in new code comments (ship CS1) → a phase that adds mechanics code runs root `npm test` before its first commit; code comments name no decision numbers · seen 1× · last 2026-10-13 · guarded by scripts/check-comments.mjs (root npm test)

<!-- @domain:mobile -->

## Mobile

- **rntl-skips-hidden** · a test reading props off an a11y-hidden view failed: RNTL's default queries skip `accessibilityElementsHidden` / `aria-hidden` subtrees (iterate, title CTA #512) → pass `{ includeHiddenElements: true }` to reach a hidden node; a plain `queryBy*` returning null is itself the proof it is hidden · seen 1× · last 2026-10-13 · open

## Adding a domain

Append a new `<!-- @domain:<name> -->` anchor + `##` heading
above this section. Keep domain names short and stable — skills
reference them by name (`grep '@domain:deploy'`), so a rename
is a breaking change to every skill that reads this file.
