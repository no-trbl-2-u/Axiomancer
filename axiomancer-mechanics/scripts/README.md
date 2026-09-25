# scripts/ — dev tooling

> Sibling to [`automation/`](../automation/) — `automation/` holds
> non-hermetic CLI walkthroughs + dev-facing test reporters.

The former release-engineering layer (deploy gate, public-surface contract,
autonomous-loop issue mirror) was removed at the monorepo merge:
`axiomancer-mechanics` is consumed as local source via the `@mechanics`
workspace alias, not published to npm. See the archived `plan/archive/2026-09-25-trim-t5/axiomancer-mechanics/CHANGELOG.md` for
the historical record.

## Tools

| Tool | Run | What it does |
| ---- | --- | ------------ |
| `export-catalog.ts` | `npm run catalog:export` | Reads the card / enemy / effect libraries and the mobile art registries, then writes flat JSON + copied paintings into `devlog/data/` and `devlog/assets/catalog/`. The repo-root `scripts/build-catalog.mjs` renders those into the DevLog catalog pages (Cards / Enemies / Effects). This one is TS (not `.mjs`) because it imports the engine libraries directly via ts-node. |

## When to add a new tool here

Drop a new `.mjs` at `scripts/` root when it enforces a structural
contract or provides a dev-only utility that doesn't belong in
`automation/` (non-hermetic CLI walkthroughs + reporters live there). Use
`.ts` + ts-node only when the tool must import the engine's TypeScript
libraries directly (as `export-catalog.ts` does). Add the tool to the table
above, and give failure messages that name the canonical fix
(`automation/README.md` is the model for failure-message UX).

## Related docs

- [`CHANGELOG.md`](../../plan/archive/2026-09-25-trim-t5/axiomancer-mechanics/CHANGELOG.md) — version history (archived 2026-09-25).
- [`automation/README.md`](../automation/README.md) — sibling
  directory for non-hermetic CLI walkthroughs + the agent-graded
  Vitest reporter.
