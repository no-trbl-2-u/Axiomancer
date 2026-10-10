# Phase PF1 — Weekly performance audit

> Agent-facing brief. Tooling only: no content of any kind (D58). Ship
> without asking; record judgment calls in the commit body.

## Sources

- Part plan: `plan/revamp/tooling.md` → "PF1 — Weekly performance audit".
- Decisions: **D77** (what "performance" means, report-only, budgets and
  drift), **D57** (no balance baseline; balance is out of scope), **D58**
  (revamp mode: tooling phases allowed, no content).
- Audit taxonomy: `plan/bearings.md` → "AUDIT category taxonomy" (`perf`);
  `skills/iterate.md` §4 G and the audit block shape in §5 Step 1.

## Outcome

Every Sunday a workflow measures web load and bundle, runtime smoothness
and engine speed, appends one line to a committed history, and files a
`[perf]` row in `plan/AUDIT.md` (plus its issue) for each budget breach or
week-over-week drift. It never fails a check.

## Scope

Three measurers, one pure comparison module, one orchestrator, one workflow.

| File | Workspace | Role |
|---|---|---|
| `axiomancer-mechanics/src/CLI/perf-bench.cli.ts` | mechanics | **Engine speed.** Times `simulateHazardPatternCombat` over FloatEye, BrineHag and TheDoorwarden with the grey deck (the `combat-sim` CLI's setup), seed 1, 20 warm-up combats then 100 timed combats per enemy. Prints one JSON object to stdout: `{ engineMsPerCombat: { FloatEye, BrineHag, TheDoorwarden, all } }`. `all` is the mean over every timed combat. Uses `performance.now()` only. |
| `axiomancer-mechanics/package.json` | mechanics | Adds `"perf-bench": "ts-node src/CLI/perf-bench.cli.ts"`. |
| `axiomancer-mobile/scripts/perf-web.mjs` | mobile | **Web load and bundle, runtime smoothness.** Exports the web build to `.perf-dist` (or reuses it when `PERF_REUSE_EXPORT=1`), serves it with the same static server and SPA fallback as `combat-round-e2e.mjs` (copy the boot plumbing; the e2e scripts already duplicate it), drives Chromium at the e2e viewport (390×844). Prints one JSON object to stdout (fields below). |
| `scripts/perf-compare.mjs` | root | **Pure functions only** (no I/O): `median(xs)`, `summarize(runs)`, `compare({ current, previous, budgets, drift })` → list of breaches, `renderAuditRow(breach, date)` → markdown, `seedBudgets(summary)` → budgets. |
| `scripts/perf-compare.test.mjs` | root | `node:test` suite for the module; added to the root `npm test` list. |
| `scripts/perf-audit.mjs` | root | **Orchestrator.** Runs both measurers three times, medians each metric, reads budgets and the last history line, calls `compare`, appends history, inserts AUDIT rows, opens issues. Flags: `--seed-budgets` (write `budgets.json` from this run), `--dry-run` (print, write nothing). |
| `docs/reports/perf/budgets.json` | root | Budgets per metric, seeded at ship (see Decisions). |
| `docs/reports/perf/history.jsonl` | root | One JSON line per run: `{ date, commit, runner: { cpu, cores }, metrics }`. |
| `.github/workflows/perf-audit.yml` | root | Weekly cron plus `workflow_dispatch`. Runs the orchestrator, commits `docs/reports/perf/` and `plan/AUDIT.md`, pushes to main. |
| `package.json` (root) | root | Adds `"perf:audit": "node scripts/perf-audit.mjs"`. |
| `axiomancer-mobile/.gitignore` | mobile | Adds `.perf-dist/` under the existing `.smoke-dist/` line. |

### Metrics (names are the JSON keys and the budget keys)

| Key | Kind | How it is measured |
|---|---|---|
| `bundleJsBytes` | bytes | Sum of `.perf-dist/**/*.js` file sizes. |
| `bundleJsGzipBytes` | bytes | Same files, `zlib.gzipSync` level 9, summed. |
| `firstScreenMs` | load | `page.goto('/')` start → `getByTestId('title-scrim')` visible. |
| `lcpMs` | load | `PerformanceObserver({ type: 'largest-contentful-paint', buffered: true })`, last entry, read 2 s after the first screen. |
| `tbtMs` | load | Sum of `(duration − 50)` over `longtask` entries from navigation to 2 s after the first screen. |
| `frameP95Ms` | runtime | `requestAnimationFrame` deltas recorded in-page during the combat script; 95th percentile. |
| `slowFramePct` | runtime | Share of those deltas over 33 ms, in percent. |
| `longTaskMs` | runtime | Sum of `longtask` durations during the combat script. |
| `engineMsPerCombat.all` | engine | From `perf-bench`. The per-enemy values go to history but have no budget. |

**Combat script** (runtime): `goto('/combat-encounter')` (the sandbox route
`combat-round-e2e.mjs` uses in its default `MODE=sandbox`), wait for
`combat-board`, then play three rounds by tapping the first
`combat-hand-*` card and confirming, using the same selectors and waits as
`combat-round-e2e.mjs`. Frame and long-task recording starts after
`combat-board` is visible and stops after round three.

## Consumers to update

- Root `npm test` list gains `scripts/perf-compare.test.mjs`.
- `.github/workflows/README.md` gains a `perf-audit` row.
- `plan/bearings.md` workflows line (`# verify-* gates · march/night/triage
  crons · verb workflows`) mentions the weekly perf audit.
- `docs/truth-sources.md` → "Measured truth": names
  `docs/reports/perf/history.jsonl` as the performance record and states
  that balance has no measured baseline (D57) — unchanged.

## Save / schema contracts

None. No engine, save or mobile runtime code changes.

## Carrier sweep

Not applicable (adds tooling, removes nothing).

## Decisions made upfront — DO NOT ASK

1. **Three kinds, not balance** (D77). Win rates stay with R12.
2. **Report-only** (D77). The orchestrator exits 0 whenever it measured;
   it exits non-zero only when a measurer crashes (that is a broken audit,
   which `/fix-ci` should see).
3. **Three runs, median** (D77). The web measurer re-uses one export across
   the three runs (export once, browser fresh each run).
4. **First budgets** (D77): `--seed-budgets` at ship, on the CI runner via
   `workflow_dispatch` with input `seed_budgets: true`, never from a local
   machine. Budget = median × 1.20 for load, runtime and engine; median ×
   1.10 for the two byte metrics. Rounded up: bytes to the next 1 KB, ms to
   the next whole ms, percent to one decimal.
5. **Drift** (D77): bytes > 5%, engine > 15%, load and runtime > 25% over
   the previous history line. Only increases count (a metric getting
   better is never a finding). `slowFramePct` drift is measured in
   percentage points ×1 (absolute: +25 points would be absurd), so for it
   use: current > previous × 1.25 **and** current − previous ≥ 2 points.
6. **Runner change.** When `runner.cpu` differs from the previous line,
   skip drift for load, runtime and engine (bytes still compare) and note
   `runner changed: <old> → <new>` in the history line. Budgets still apply.
7. **Finding shape.** One `[perf]` row per breached metric, inserted at the
   top of `plan/AUDIT.md`'s `## Pending` section, matching the existing
   row shape:
   `### [ ] [perf] <metric> <budget breach|drift>: <value> vs <limit> (<date>)`
   with `- category: perf`, `- impact: 4` (load/runtime 5),
   `- ease: 5`, `- detail:` (the numbers, commit, previous commit) and
   `- next (/iterate):` "bisect the commits between the two history
   lines; fix or raise the budget with T." No row is filed twice: if an
   open `[ ] [perf] <metric>` row exists, append an `- evidence <date>:`
   line to it instead.
8. **Issues.** Each new row opens one issue via
   `node scripts/loop-issue.mjs open --severity med --category perf
   --source audit` and records `- issue: #N` on the row. An issue failure is
   a warning, not a crash (same contract as `/ship-a-phase` Step 2.5).
9. **Schedule.** `cron: '7 7 * * 0'` (Sunday 07:07 UTC), before the other
   Sunday checks (07:13–07:53), so it never overlaps `verify-mobile`'s
   export.
10. **Concurrency.** `group: nexus-loop`, `cancel-in-progress: false`, the
    same group as `march`, so the commit never races a tick's push. Push
    with `git pull --rebase origin main` then `git push`, four retries with
    2/4/8/16 s backoff.
11. **Permissions.** `contents: write`, `issues: write`. Commit subject:
    `perf: weekly audit <date> — <n> finding(s)`; plain body, no trailers.
12. **Functional style.** `perf-compare.mjs` exports pure functions over
    plain objects; the orchestrator is the only module with I/O. No classes.
13. **Comments.** Every exported function carries a JSDoc block (purpose,
    params, return, example). No decision numbers in code comments
    (`scripts/check-comments.mjs` fails them).

## Tests matrix

| Suite | Subjects |
|---|---|
| `scripts/perf-compare.test.mjs` | `median` (odd, even, one value); `summarize` medians each metric across three runs; `compare`: budget breach, drift over each kind's threshold, drift under threshold is silent, improvement is silent, runner change skips timing drift but keeps bytes, no previous line → budgets only, `slowFramePct` points rule; `renderAuditRow` matches the AUDIT row shape; `seedBudgets` applies 1.20 / 1.10 and the rounding rules. |
| Orchestrator smoke | `node scripts/perf-audit.mjs --dry-run` locally prints a summary and the would-be rows, writes nothing (checked by `git status`). |
| `perf-bench` | Run once locally; output parses as JSON with the four keys. |
| `perf-web.mjs` | Run once locally with Chromium at `/opt/pw-browsers` when present; output parses with all eight web keys. |

## Verify gate

- Root `npm test` (includes the new suite and `check-comments`).
- `npm run verify --workspace axiomancer-mechanics` (typecheck covers the
  new CLI).
- `npm run verify --workspace axiomancer-mobile` (its lint globs are
  `app components`, so the new script is not linted; the gate still runs).
- `node scripts/check-lexicon.mjs` and `npm run lint:prose`.
- The revamp gates in `plan/revamp/README.md` §5 that apply to tooling.
- After merge: trigger `perf-audit.yml` once with `seed_budgets: true`;
  the run commits `budgets.json` and the first history line. The phase is
  not done until that commit lands.

## Commit body template

```
tooling: weekly performance audit — phase PF1

- perf-bench CLI times seeded combats; perf-web measures bundle, load and
  a scripted combat round in Chromium.
- perf-compare (pure) checks budgets and week-over-week drift; the
  orchestrator files [perf] rows in plan/AUDIT.md and opens issues.
- perf-audit.yml runs Sunday 07:07 UTC in the nexus-loop group; report
  only, never a gate.
```

## DoD

- [ ] All files in Scope exist; root `npm test` green.
- [ ] `--dry-run` writes nothing.
- [ ] Seed run on CI committed `budgets.json` and one history line.
- [ ] Build-plan row PF1 ticked with the commit hash.

## Follow-ups (out of scope)

- Native (Android) runtime numbers: needs a device lab; not on CI.
- A devlog panel charting `history.jsonl`.
- Balance measurement: R12.
