# automation/ — non-hermetic tooling layer

> `src/` runs hermetic vitest e2e in milliseconds and is the contract
> the deploy gate cares about. `automation/` is the **complement**: a
> non-hermetic tooling surface for agent-graded CLI walkthroughs and
> developer-facing test-result reports. Nothing in here ships in the
> published npm package (the `files` field in `package.json` covers
> `dist/` only); these scripts run locally + in dev workflows.

## Tools

| Entry point | npm-script wrapper | What it does | Inputs | Outputs |
|---|---|---|---|---|
| [`agent-e2e.mjs`](./agent-e2e.mjs) | `npm run agent-e2e <script.json> <goal.md>` | Runs a scripted walkthrough against `npm run game`, captures the state log + JSON event stream + human stderr, then asks the Claude API whether the test goal was achieved. Phase 26 unit 6. | A scripted walkthrough pair from [`scripts/walkthroughs/`](./scripts/walkthroughs/). Requires `ANTHROPIC_API_KEY` (the grading layer phones home — intentionally non-hermetic). | Structured pass/fail decision on stdout; exit 0 on pass / 1 on fail. |
| [`agent-vitest-reporter.mjs`](./agent-vitest-reporter.mjs) | `npm run verify:agent` | Custom Vitest reporter that emits `last-verify-report.json` (failures, rollup, slowest5, diff vs prior run) + a delimited markdown block between `## Verify summary` and `## End summary` on stdout. Phase 39 + Phase 40 diff. | None directly — wired as a Vitest `--reporter` flag. | `automation/last-verify-report.json` (gitignored); markdown summary on stdout. |

Hermetic coverage for the reporter lives at
[`src/test-utils/e2e/agent-vitest-reporter.engine.test.ts`](../src/test-utils/e2e/agent-vitest-reporter.engine.test.ts).
`agent-e2e.mjs` has no hermetic counterpart by design — its whole
point is to drive the real CLI end-to-end against the real Claude API.

## Subdirectories

- [`scripts/walkthroughs/`](./scripts/walkthroughs/) — paired
  `<name>.{json,goal.md}` walkthroughs consumed by `agent-e2e.mjs`.
  Live inventory + per-walkthrough goal docs in that folder's own
  README.
- `last-verify-report.json` — gitignored output of the agent reporter,
  rewritten on every `npm run verify:agent`.
- `testing-logs/` — gitignored scratch space for agent-e2e runs (the
  harness writes the state-log file here before grading).

## When to add a new tool here

Drop a new `.mjs` (or `.ts` if it needs the engine's type graph) at
the `automation/` root when it:

- Drives or grades the CLI / a full-stack scenario rather than a
  hermetic unit.
- Phones home to an external service (Claude API, future log shippers).
- Produces dev-facing reports that don't need to ship in the package.

Add a row to the **Tools** table above + cross-link from the relevant
`docs/` page (e.g. `docs/testing.md` Phase 39 subsection points at
`agent-vitest-reporter.mjs`).
