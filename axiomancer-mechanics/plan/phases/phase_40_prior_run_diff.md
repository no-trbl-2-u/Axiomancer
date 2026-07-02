# Phase 40 — Prior-run diff in agent verify report

> Phase 39 follow-up: the agent verify reporter learns to read the
> prior `automation/last-verify-report.json` and surface what changed
> run-to-run. Bundles the AUDIT MED 5.4 "top-level `failures[]` flat
> list" row so the JSON schema settles in one pass rather than
> churning across multiple iterate ticks.

## Outcome

After `npm run verify:agent` runs, the JSON report at
`automation/last-verify-report.json` carries two new top-level fields:

- `failures: [{file, name, message, location}]` — flat list across
  every failed test in the run (closes AUDIT MED 5.4).
- `diff: { addedTests, removedTests, flippedToFail, flippedToPass,
  durationDeltaSlowest5 } | null` — compared against the prior
  report on disk; `null` on first run, missing prior, or
  schema-incompatible prior.

The markdown summary on stdout gains a `### Changes since last run`
section when the diff is non-empty (otherwise nothing is rendered to
keep the block tight on fresh / first runs).

The reporter degrades gracefully on a missing or malformed prior
report: writes the new report normally, sets `diff: null`, and prints
a one-line warning to stderr (kept off stdout so agent-parsable
markdown stays clean).

## Source spec

- Build-plan row Phase 40 (`plan/steps/01_build_plan.md:63`).
- Promoted in `plan/PHASE_CANDIDATES.md` Promoted block as the
  Phase 39 follow-up; recommended-slot pairing says to bundle
  AUDIT MED 5.4 into the same commit so the schema settles in one
  pass.
- Phase 39 brief Follow-ups (`plan/phases/phase_39_agent_verify_report.md`)
  flagged this as the #1 deferred item.
- AUDIT MED 5.4 row absorbed into this phase: `failures[]` flat list.

## Implementation units

### Unit 1 — Reporter changes (single file)

**File:** `automation/agent-vitest-reporter.mjs`.

Five focused additions:

1. **`failures: [{file, name, message, location}]` on the rollup.**
   Built inside the existing `buildReport` walk — push a fresh entry
   whenever a test's `status === 'failed'`. Project-relative `file`,
   `fullName` for `name`, `errors[0].message` for `message`, the
   same `location` heuristic the per-test failure block already uses.
   No new walk; same single-pass aggregation.

2. **`readPriorReport(absPath): PriorReport | null` helper.** Reads the
   JSON at `absPath` if present; returns parsed object if it has a
   recognisable shape (`rollup` object + `files` array); else returns
   `null` and prints `[agent-vitest-reporter] prior report ignored:
   <reason>` to `process.stderr` (not stdout — keeps the markdown
   block agent-pluckable).

3. **`computeDiff(currentReport, priorReport): Diff | null`.** Walks
   both reports' `files[].tests[]` arrays and keys each test by
   `${file}::${name}` to build before / after maps. Produces:
   - `addedTests: string[]` — keys in current not in prior.
   - `removedTests: string[]` — keys in prior not in current.
   - `flippedToFail: [{file, name, prevStatus: 'passed', currStatus: 'failed'}]`
     — keys present in both whose status changed `passed → failed`.
   - `flippedToPass: [{file, name, prevStatus: 'failed', currStatus: 'passed'}]`
     — opposite direction.
   - `durationDeltaSlowest5: [{file, name, prevMs, currMs, deltaMs}]`
     — top 5 across "in both reports" by absolute `deltaMs`
     (`Math.abs(currMs - prevMs)`); ties broken by `currMs` descending.

4. **Read order in `onTestRunEnd`.** Prior report read BEFORE writing
   the new one (otherwise the prior we read is the one we're about to
   overwrite). Sequence: build report → read prior → compute diff →
   stamp diff on the rollup → write new report → render markdown.

5. **Markdown `### Changes since last run` section.** Rendered only
   when `diff` is non-null AND any of the diff arrays is non-empty.
   Format (each subsection only when its array is non-empty):
   ```
   ### Changes since last run

   #### Added tests
   - <file>: <name>
   #### Removed tests
   - <file>: <name>
   #### Flipped to fail
   - <file>: <name>
   #### Flipped to pass
   - <file>: <name>
   #### Largest duration deltas
   - <file>: <name> — <prev>ms → <curr>ms (Δ <delta>ms)
   ```

Commit: `feat(automation): Phase 40 unit 1 — failures[] + prior-run diff in agent reporter`.

### Unit 2 — Tests + docs + DoD

**File:** `src/test-utils/e2e/agent-vitest-reporter.engine.test.ts`.

New cases (in addition to the existing 3):

1. **`failures[]` populated** — drive a 2-file run with 1 failing
   test; assert `parsed.failures.length === 1` and the entry has
   the four fields with the expected values. Also assert
   `parsed.failures === []` on an all-passing run.

2. **Diff against a fabricated prior** — write a synthetic prior
   `last-verify-report.json` to the same path the reporter will
   write to, then drive a current run that:
   - Adds a new test (key not in prior).
   - Removes a test from a file the prior had.
   - Has one test flipped passed → failed.
   - Has one test flipped failed → passed.
   - Has a duration delta on a shared test.
   Assert each of the five diff arrays carries the expected entry.

3. **No prior file** — `jsonOutputPath` points at a fresh temp dir;
   the reporter writes the new report, `parsed.diff === null`, no
   stderr noise above one warning line (or zero, on the "no prior at
   all" path — pick the cleaner UX; **decision below: no warning on
   first-run-ever, only on schema mismatch**).

4. **Incompatible-schema prior** — write a junk JSON to the path
   (`{"hello": "world"}`); reporter ignores it, sets `diff: null`,
   prints exactly one stderr warning line containing
   `[agent-vitest-reporter] prior report ignored`. Use `vi.spyOn(
   process.stderr, 'write')` to capture and assert.

5. **Diff renders into the markdown block** when non-empty; absent
   when empty.

**Docs:**
- `docs/testing.md` "Agent-friendly report" subsection: append the
  two new fields to the schema sketch + name the markdown subsection.
- `plan/phases/phase_39_agent_verify_report.md` Follow-ups block:
  mark the prior-run-diff item shipped (with this phase's commit
  hash).
- `plan/AUDIT.md`: move the MED 5.4 `failures[]` row to Done with
  the commit hash + a one-line "absorbed into Phase 40" note.

**Plan tick:** flip Phase 40 `[ ]` → `[x]` in
`plan/steps/01_build_plan.md` with summary + commit hashes.

Commit: `test(automation): Phase 40 unit 2 — hermetic diff coverage + docs`.

## Decisions made upfront — DO NOT ASK

- **`failures[]` lives on the rollup root** (sibling to `rollup`),
  not inside `rollup`. The rollup carries counts; the failure list
  is a separate flat surface. Matches the existing top-level
  `{ rollup, files }` shape.
- **Diff lives on the rollup** (as `rollup.diff`), not as a top-
  level sibling. Diff data is one tier "below" the rollup totals —
  consumers want totals first, drilldown second.
- **Schema-compatibility check is shallow.** A prior counts as
  "compatible" if it has a `rollup` object and a `files` array.
  Anything else (missing fields, missing version key — we don't have
  a version key today) is `diff: null` + warning. Cheap, robust.
- **First-run vs missing-prior: no warning.** The "fresh repo" case
  should be silent. We warn ONLY when a file exists at the path
  but can't be parsed or doesn't match the shape. `fs.access` →
  ENOENT → silent `diff: null`; `JSON.parse` throws → warning;
  shape mismatch → warning.
- **`flippedToFail` / `flippedToPass` ignore `skipped` and `pending`
  transitions.** Only `passed ↔ failed` flips are interesting; a
  test going from `skipped → passed` is noise (the test was just
  un-skipped).
- **`durationDeltaSlowest5` ranks by absolute delta**, not signed.
  A test that got 50ms faster is just as interesting as one that
  got 50ms slower. The entry carries `prevMs`, `currMs`, and a
  signed `deltaMs` so the consumer can tell which direction.
- **Markdown subsections are nested under `### Changes since last
  run`** as `#### Added tests` etc. so an agent doing regex
  extraction of `### Changes since last run` captures the whole
  block in one match.
- **Stderr warning format is exactly one line, prefixed
  `[agent-vitest-reporter]`** so a developer scanning stderr can
  tell where it came from. No emoji, no colour.
- **Read happens BEFORE write** — otherwise we'd diff against our
  own freshly-written output. Sequence in `onTestRunEnd` is build →
  read prior → compute diff → assign diff → write new → render
  markdown.

## Verify gate

`npm run verify` — type-check + lint + test + build. Then
`npm run verify:agent` as a smoke (the reporter is the artefact we
just changed; running it confirms the JSON file gets the new fields
against the live test suite).

## Definition of Done

- [ ] `automation/agent-vitest-reporter.mjs` builds `failures[]` in
  `buildReport`.
- [ ] `readPriorReport(absPath)` + `computeDiff(curr, prior)` exist
  inside the reporter file (private helpers, no exports needed).
- [ ] `onTestRunEnd` reads the prior report BEFORE writing the new
  one; assigns `report.rollup.diff` (or sets it to `null`).
- [ ] Markdown stdout includes a `### Changes since last run` section
  whenever any diff array is non-empty.
- [ ] Stderr emits a one-line `[agent-vitest-reporter] prior report
  ignored: <reason>` warning ONLY on parse failure / shape mismatch,
  never on a missing file.
- [ ] `src/test-utils/e2e/agent-vitest-reporter.engine.test.ts`
  covers the five new cases (failures[], diff-against-fabricated-prior,
  no-prior-file, incompatible-schema, markdown render).
- [ ] `docs/testing.md` "Agent-friendly report" subsection lists
  both new fields and the markdown subsection.
- [ ] `plan/phases/phase_39_agent_verify_report.md` Follow-ups marks
  the prior-run-diff item shipped.
- [ ] `plan/AUDIT.md` MED 5.4 `failures[]` row moved to Done.
- [ ] Phase 40 row in `plan/steps/01_build_plan.md` flipped to `[x]`.

## Follow-ups (out of scope)

- A schema version key on the JSON report so future migrations can
  be safer than "shape match" — file as iterate row if a real
  consumer needs it.
- A `--reporter-options` CLI passthrough so consumers can override
  the prior-report path or disable the diff — currently hardcoded
  to `automation/last-verify-report.json`.
- The remaining 5 Phase 39 self-critique rows in AUDIT (callouts[],
  file:line via experimental_getRunnerTask, chain default reporter,
  slow-failing-tests, durationMs precision) — the iterate-bias to
  `reporter` (set by oversight 2026-05-16) will weight these for the
  next /iterate ticks.
