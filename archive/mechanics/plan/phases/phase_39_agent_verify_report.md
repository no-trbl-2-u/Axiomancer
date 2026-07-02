# Phase 39 — Agent-friendly hermetic e2e report

> Custom Vitest reporter that emits a structured JSON file + a delimited
> markdown summary on stdout so an LLM agent (or a human eyeballing the
> terminal) can answer "what was tested, how, and what happened" without
> scraping Vitest's default reporter output.

## Outcome

After `npm run verify:agent` finishes, two artefacts exist:

1. `automation/last-verify-report.json` — structured rollup + per-file +
   per-test entries with durations and failure messages.
2. A delimited markdown block on stdout (between `## Verify summary` and
   `## End summary`) listing totals, failed tests with `file:line —
   message`, and the slowest five passing tests.

The default `npm run verify` script is untouched; the new script is
additive.

## Source spec

No standalone spec — this is automation tooling, scoped via
`plan/PHASE_CANDIDATES.md` Phase 39 Promoted block. Decisions captured
upfront in that block:
- Audience: both — JSON file + markdown stdout.
- Hook point: custom Vitest reporter (Reporter API, not post-process).
- Additive npm script: `verify:agent` lives alongside `verify`, does not
  replace it.

## Implementation units

### Unit 1 — Reporter module + npm script

**File:** `automation/agent-vitest-reporter.mjs` (ESM, plain JS to match
`automation/agent-e2e.mjs`).

**Shape:** default-exports a class implementing the Vitest 4.x Reporter
interface. Only `onInit(ctx)` and `onTestRunEnd(testModules,
unhandledErrors, reason)` are needed.

```js
export default class AgentVitestReporter {
    constructor(opts = {}) {
        this.jsonOutputPath = opts.jsonOutputPath ?? DEFAULT_JSON_PATH;
        this.markdownStream = opts.markdownStream ?? process.stdout;
    }
    onInit(ctx) { this.rootDir = ctx?.config?.root ?? process.cwd(); }
    async onTestRunEnd(testModules, unhandledErrors, reason) {
        const report = this.buildReport(testModules, unhandledErrors, reason);
        await this.writeJson(report);
        this.writeMarkdown(report);
    }
}
```

**JSON schema** (the public contract for agent consumers):

```jsonc
{
  "rollup": {
    "total": number,
    "passed": number,
    "failed": number,
    "skipped": number,
    "reason": "passed" | "failed" | "interrupted",
    "unhandledErrors": number,
    "slowest5": [
      { "name": string, "file": string, "durationMs": number }
    ]
  },
  "files": [
    {
      "path": string,                      // project-relative
      "status": "passed" | "failed" | "skipped" | "queued",
      "durationMs": number,
      "tests": [
        {
          "name": string,                  // fullName ("Suite > test")
          "status": "passed" | "failed" | "skipped" | "pending",
          "durationMs": number,
          "failure": {                     // only when status === "failed"
            "message": string,
            "diff": string | undefined,
            "actual": string | undefined,
            "expected": string | undefined,
            "location": string | undefined  // "file:line:col" from first stack
          }
        }
      ]
    }
  ]
}
```

**Markdown delimiter convention** — the block always starts at a fresh
line with `## Verify summary` and ends with `## End summary`. Agents can
extract reliably with `/## Verify summary\n([\s\S]*?)\n## End summary/`.

**npm script** (additive to `package.json`):

```
"verify:agent": "npm run type-check && npm run lint && vitest run --reporter=./automation/agent-vitest-reporter.mjs && npm run build"
```

### Unit 2 — Hermetic e2e test

**File:** `src/test-utils/e2e/agent-vitest-reporter.engine.test.ts`.

**Strategy:** the reporter is data-driven — drive it with synthetic
TestModule-shaped objects (the structural minimum the reporter touches:
`children.allTests()` generator, `moduleId`, `ok()`, `state()`,
`diagnostic()` on the module, and `fullName`, `result()`, `diagnostic()`
on each test case). No Vitest internals required.

**Cases:**
1. Golden path: 2 passing + 1 failing test across 2 files →
   - JSON file is written with the expected shape (rollup totals,
     per-file entries, failure block on the failing test).
   - Markdown stdout contains the start delimiter, totals, failed-test
     line with location + message, and the end delimiter.
2. Failure block carries `location` parsed from the first stack frame.
3. Empty run (zero modules) writes a valid report with all-zero rollup.

### Unit 3 — Docs + plan tick

- `docs/testing.md` — new "Agent-friendly report" subsection naming
  `npm run verify:agent` and the two outputs.
- `plan/steps/01_build_plan.md` — flip Phase 39 `[ ]` → `[x]` with hash.

## Decisions made upfront — DO NOT ASK

- **`.mjs` over `.ts`** — matches `automation/agent-e2e.mjs`. The
  reporter has no engine deps; JSDoc-tier typing is enough; sidesteps
  any Vitest-loader-of-TS questions.
- **Reporter lives in `automation/`, test lives under `src/test-utils/`** —
  reporter is automation tooling (not engine), but tests must live
  under a path that vitest's `include: ['src/**/*.test.ts']` glob
  matches. `src/test-utils/e2e/` is the natural home (tests for testing
  infrastructure).
- **Project-relative `path` in the JSON** — absolute paths leak machine
  state; consumers want a stable key. Use `path.relative(rootDir, ...)`.
- **`durationMs` is `diagnostic()?.duration ?? 0`** — Vitest gives ms
  already. No conversion. Tests that never ran (pending) get `0`.
- **First call-out heuristic ships: slowest 5 passing tests.** Cheaper
  than "added since last report" (no prior-run diff plumbing), useful
  on every run.
- **No CLI flags / env vars** — second pass when an actual consumer asks.
- **`verify:agent` is additive** — Hard Rule 9 conservatism. The deploy
  gate expectations attached to the existing `verify` script stay
  unchanged.
- **Failure message picks `errors[0]`** — Vitest gives an array; the
  first entry is the test's assertion failure. Subsequent errors are
  almost always cascade noise.

## Verify gate

`npm run verify` (the existing one — type-check, lint, test, build).

The new `verify:agent` script also runs as a smoke (just to confirm the
reporter loads and writes a non-empty `automation/last-verify-report.json`).

## Commit body template

```
feat(automation): Phase 39 — agent-friendly hermetic e2e report

- New Vitest reporter at automation/agent-vitest-reporter.mjs emits
  automation/last-verify-report.json and a delimited markdown summary
  on stdout. Schema documented in plan/phases/phase_39_agent_verify_report.md.
- New additive `npm run verify:agent` script wires the reporter.
- Hermetic e2e at src/test-utils/e2e/agent-vitest-reporter.engine.test.ts
  drives the reporter with synthetic Vitest events.

Decisions:
- .mjs over .ts (matches automation/agent-e2e.mjs pattern).
- Test under src/test-utils/e2e/ so the existing vitest include glob
  picks it up without config changes.
- Slowest-5 chosen as the first call-out heuristic.
```

## Definition of Done

- [ ] `automation/agent-vitest-reporter.mjs` exists and default-exports
  a Reporter class with `onInit` + `onTestRunEnd`.
- [ ] `npm run verify:agent` returns the same exit code as `npm run
  verify` and writes `automation/last-verify-report.json` with the
  documented schema.
- [ ] Stdout contains a `## Verify summary` … `## End summary` block.
- [ ] Hermetic e2e at `src/test-utils/e2e/agent-vitest-reporter.engine.test.ts`
  pins the JSON shape, markdown contents, and the empty-run case.
- [ ] `docs/testing.md` documents the new script + the two outputs.
- [ ] Phase 39 row in `plan/steps/01_build_plan.md` flipped to `[x]`.

## Follow-ups (out of scope)

- ~~"Added since last report" call-out (needs prior-run diff).~~
  **Shipped as Phase 40 (commit 87bab8c)** — `rollup.diff` carries
  added / removed / flipped / duration-delta arrays compared against
  the prior `last-verify-report.json`. The MED 5.4 AUDIT row for
  `failures[]` was bundled into the same phase so the JSON schema
  settled in one pass.
- Slow-test thresholding tied to Vitest's `slowTestThreshold`.
- Optional `--reporter-output <path>` CLI passthrough (none yet).
- A reporter for the agent-e2e harness — separate concern from the
  hermetic Vitest run.
