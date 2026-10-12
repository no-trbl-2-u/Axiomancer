# Prompt: Phase R11 — Reopen the loop (attended)

> Written 2026-10-12 at T's direction ("it's time"), after the R11 brief
> item 1 (pause `march` + `night`) merged in #501. This is the kickoff for
> the **attended** session that implements R11. Paste it as the first
> message, or point the session at this file.
>
> **The spec is `plan/revamp/loop.md` → "R11 — Reopen the loop".** This
> prompt orders the work, names the gates and lists the traps. Where the
> two disagree, the brief wins; say so in the PR and fix this file.

## 0. Read first, in order

1. `AGENTS.md`, `CLAUDE.md`, `plan/bearings.md` (THE REVAMP entry
   `:248-262`, the push rule `:331-336`, the pause note `:490-495`).
2. `plan/revamp/loop.md` → R11, all of it: the Ruling, decisions a–g,
   work items 1–9, Out of scope, DoD.
3. `plan/2026-09-25-refactor-strategy.decisions.md`: D37 (THE CARD HOLD),
   D58 (revamp mode), D83 (the last number used). New decisions start at
   **D84**.
4. `plan/lessons.md`, `plan/reflexes.md` (item 5 migrates their format).
5. `docs/asking-well.md` (how to ask T).
6. `plan/PHASE_CANDIDATES.md:15-55`: the five held hunt-comparison
   candidates. They stay held until the R11 watch ends; do not build them.

## 1. State at hand-off

- `main` at `ba4b25d` (#501). `march` and `night` are disabled on GitHub;
  every other workflow runs. The last march tick was run 38191422615.
- Every open build-plan row is attended (R11, R12) or owner-led (B-rows).
- `grep -rl 'REVAMP M[O]DE' --include=*.md .` now finds **21** files, not
  the 20 the brief counts (the bracket keeps this file out of its own grep). Strip all of them; name the extra one in the PR.
- No `plan/phases/` brief exists for R11; `loop.md` is the brief.

## 2. Step one: the ballot (before any edit)

Put decisions **a–g** from the brief's table to T with `AskUserQuestion`,
default first and marked "(Recommended)", at most 4 questions per call
(two calls). Record each answer as D84+ in the decisions file, three lines
each, before writing code. Do not re-ask anything the brief's Ruling
already settles (PRs on, T merges, Haiku fixer, `/plot` + `/messy`, retro,
cards/keywords owner-only).

## 3. Mandate, in order

One branch from fresh `origin/main` (`git fetch origin main`), one PR.
R11 is the first PR the new doctrine describes: write its body with the
body template you create in item 3, acceptance items ticked.

| # | Brief item | Done when |
|---|---|---|
| 1 | End revamp mode | zero banner hits; `check-lexicon` rejects the phrase outside the two exempt files; `march.md` §3 and `ship-a-phase.md:125-130` pick "first `[ ]`, unattended, `Requires` ticked, has a brief, no open `loop:pr` PR" |
| 2 | Content rules per surface | decision e written into bearings "Decisions standing…" and `plan/revamp/README.md` §Rebuild track |
| 3 | Loop opens PRs | `ship-a-phase`, `iterate`, `critique`, `fix-ci` branch `loop/<verb>-<slug>` + `gh pr create` + label `loop:pr`; plan-only/telemetry still push `main`; `pr-autofix.yml` + `pr-resolve.yml` exist; `scripts/loop-pr.test.mjs` pins label filter, `head_branch != 'main'`, per-PR concurrency, `Closes #` shape; workflows README carries the cost line |
| 4 | `/plot` + `/messy` | both skills + commands exist; plan-a-phase §4 has acceptance IDs + `Measure:`; a briefless row is not pickable; AGENTS.md rule beside 7 and CLAUDE.md mirror; a test fails if any other skill or workflow fires them |
| 5 | Retro + lessons ladder | Retro step closes ship-a-phase, iterate, critique, fix-ci, plot; `lessons.md` migrated to the one-line counted format; `scripts/check-lessons.mjs` in root `npm test` and `guard.mjs` |
| 6 | R0 archive + zero-invocation verbs | reviewed; unwired verbs rewired, not cut; the `tick-end` gap (2026-10-11 14:33, 18:39, 20:34) fixed or filed to AUDIT with its cause |
| 7 | Doctrine sweep | every "pushes to main" for code reads "opens a PR" in AGENTS.md, bearings, truth-sources, workflows README, plan/README |
| 8 | Gates | §4 below, all green, output pasted in the PR |

Item 9 (exit) happens **after** T merges; see §5.

## 4. Gates (paste real output in the PR)

```bash
npm test                                   # root: picks up check-lessons + loop-pr.test
node scripts/check-lexicon.mjs
node .claude/hooks/guard.mjs self-test
node .claude/hooks/telemetry.test.mjs
npm run verify --workspace <each touched workspace>
actionlint .github/workflows/pr-autofix.yml .github/workflows/pr-resolve.yml
```

No `actionlint` on the box → say so and run
`node -e "require('yaml').parse(...)"` or equivalent; do not claim it ran.

## 5. After merge (T merges by hand)

1. T re-enables `march` and `night` (`gh workflow enable`).
2. Watch the first cron tick end to end: PR opened (or cap / "no pickable
   row" reported), `verify-*` green or `pr-autofix` fires once, T merges,
   row flips `[x] (#N)`, mirror closes.
3. DoD asks `pr-autofix` and `pr-resolve` to have run once each: if no
   real red or conflict occurred, `workflow_dispatch` them on a throwaway
   branch and delete it after.
4. Tick R11 `[x]` in `plan/steps/01_build_plan.md`, update
   `plan/revamp/README.md` §7 row 13, add the archive line. Next: R12 and
   T's first `/plot`.

## 6. Traps

- **`.claude/**` is classifier-blocked for autonomous runs.** This session
  is attended: T approves those edits. Do not route them through a cron.
- **Do not touch cards or keywords** (D37). Nothing in R11 needs to.
- **Never auto-merge** (lessons.md deploy #4). Never `--force` in any
  workflow you write.
- **`pr-autofix` concurrency is per PR, never the shared `nexus-loop`
  group** (the ci-autofix lesson).
- **Fork PRs never get secrets:** the workflows act only on PRs whose head
  repo is this repo.
- **Telemetry:** commit this session's shard with the PR; never edit rows.
- **Out of scope:** content (B-rows), R12, a `claims` branch, a PR-body
  writer, the march cadence, the five held candidates.
- Anything the brief leaves open and the ballot did not cover: ask T
  (`AskUserQuestion`, recommendation first). Do not guess.
