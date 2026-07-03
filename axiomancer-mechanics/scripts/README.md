# scripts/ — dev tooling

> Sibling to [`automation/`](../automation/) — `automation/` holds
> non-hermetic CLI walkthroughs + dev-facing test reporters.

This directory is currently empty of tools. The former release-engineering
layer (deploy gate, public-surface contract, autonomous-loop issue mirror)
was removed at the monorepo merge: `axiomancer-mechanics` is consumed as
local source via the `@mechanics` workspace alias, not published to npm.
See `CHANGELOG.md` / `RELEASES.md` for the historical record.

## When to add a new tool here

Drop a new `.mjs` at `scripts/` root when it enforces a structural
contract or provides a dev-only utility that doesn't belong in
`automation/` (non-hermetic CLI walkthroughs + reporters live there).
Add a table of tools to this README when the first one lands, and give
failure messages that name the canonical fix (`automation/README.md`
is the model for failure-message UX).

## Related docs

- [`CHANGELOG.md`](../CHANGELOG.md) — version history.
- [`automation/README.md`](../automation/README.md) — sibling
  directory for non-hermetic CLI walkthroughs + the agent-graded
  Vitest reporter.
