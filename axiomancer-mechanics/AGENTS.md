# axiomancer-mechanics — agent guide

### Project overview

The mechanics engine (`axiomancer-mechanics`, the workspace name kept from
the product's former title) is a TypeScript TTRPG game engine (Node.js CLI)
for Miserere Mei, Deus.
No databases, servers, or containers required. See `README.md` for
architecture docs.

**Game doctrine is canonical in `VISION.md`** and kept always-in-context
in this package's `CLAUDE.md` — read both before any mechanics, combat,
balance, content, mercy, or alignment work. The former status-dominance
law and ten-starter-preset curve are historical after T's 2026-08-08
unshackling and the Profane Canon. THE BIG NUMBERS REWRITE (2026-09-02)
also repealed CQI and the idea of a governing objective function. Simulations
retain bug detectors and a wide sanity envelope; terminal outcomes and the
three campaign snapshots await an explicit viability/calibration charter.

**Evidence doctrine (condensed):**

- Command-green playtests can still be design-red. No summary score makes a
  terminal outcome viable; universal defeat, certainty, or capitulation
  requires separate judgment. Low-run/single-seed matrices are pressure evidence, not tuning
  authority. Capture generated playtest metrics in the dated report, then
  revert generated tracked reports unless the task explicitly updates those
  fixtures.
- A direct combat CLI run or passing combat tests prove the engine
  command path, not route integration. A route-level combat claim
  must traverse an authored map encounter, enter the HP-only board,
  and record `hazardCombat:start` + resolution events — repair or
  replace a drifted route witness before claiming coverage.

### Key commands

All commands are in `package.json`:

| Task | Command |
|---|---|
| Build | `npm run build` |
| Type-check | `npm run type-check` |
| Type-check (tests) | `npm run type-check:tests` |
| Type-check (CLI) | `npm run type-check:cli` — covers `src/CLI/**` (excluded from the two configs above) |
| Test | `npm test` (vitest) |
| Lint | `npm run lint` |
| Lint + type-check | `npm run check` |
| Demo CLI | `npm run game` (tabbed map / journal / cards / codex / inventory / character / dev loop) |
| Boot at a known state | `npm run game -- --fixture <id\|path.json\|list>` — declarative state fixtures shared with mobile (`docs/state-fixtures.md` at the root) |
| Verify gate | `npm run verify` (type-check + type-check:tests + type-check:cli + lint + test + build) |
| Deploy gate | `npm run deploy:check` — lives at the monorepo ROOT, not in this package; run `npm run deploy:check` from the repo root |

For automated / agent-driven CLI runs, the agent flags expose
scripted and JSON-event modes:
`npm run game -- --script <path>` / `--stdin` / `--json-events`. See
`README.md` "Agent-driven CLI mode" for examples.

### Committing during spec implementations

When implementing a spec, commit **incrementally** — do not accumulate all
changes into a single commit at the end. A natural commit cadence is:

1. **Per logical unit of work** — e.g. one commit per spec step, or one per
   file/layer when multiple files form a cohesive change (resolver + exports +
   tests can be one commit; CLI refactor can be another; docs/spec update can
   be a third).
2. **After each green gate** — only commit when `npm test` and
   `npm run type-check` are clean for that increment. Never commit a broken
   intermediate state.
3. **Commit message format** — `<type>(<scope>): <short description>`, e.g.
   `feat(combat): promote simulateHazardPatternCombat to first-class export` or
   `refactor(cli): delegate runCombatTurn to resolver — no inline math`.
   Keep the body concise; reference the spec number when relevant.
4. **Spec update commit** — the final commit for any spec implementation must
   include the updated spec file (acceptance checklist ticked + implementation
   notes) and any doc files changed.

Never squash or amend after pushing unless explicitly asked.

### Caveats

- **ESLint**: `npm run lint` is part of `npm run verify`. Warnings are
  advisory; only errors fail the gate.
- **Demo CLI is interactive**: `npm run game` uses `inquirer` prompts.
  For hermetic automation, use the agent flags (`--script` / `--stdin` /
  `--json-events`) — never `pexpect` / tmux `send-keys`.
- **Test runner**: `npm test` runs vitest. `npm run verify` chains all
  six legs (type-check + type-check:tests + type-check:cli + lint +
  test + build).
- **CLI files are not exempt from type-check**: `tsconfig.json` and
  `tsconfig.tests.json` both exclude `src/CLI`; `npm run type-check:cli`
  (`tsconfig.cli.json`) covers that gap and is wired into `verify` —
  a stale-call bug once shipped to `main` through it. Any new file
  under `src/CLI` is covered automatically; do not add another
  exclusion.
- **State file**: The Node persistence adapter writes `game-state.json` in
  the project root when used. This file is gitignored and ephemeral.
- **Spec update**: If using a spec file to implement a change, update the
  spec as you walk through the steps.
- **Wording-pin discipline**: `choir-card-wording` and the paid-summary
  honesty guard (`paidText` in `src/Combat/combat.cards.ts`) pin AUTHORED
  card prose to its underlying payload. If you reword a card's authored
  summary, update its pin in the same commit — never silence or loosen a
  guard just to make a wording change land.

### Hermetic E2E testing — REQUIRED

Every implementation must land with at least one **hermetic e2e test** that
drives the change through the highest-level public entry point of its module.
If you cannot, extract logic until you can — or document the
"hermetic-test debt" in the PR description.

**Hermetic** = self-contained (no disk/network/TTY) + deterministic
(`Math.random` stubbed via `src/test-utils/rng.ts`) + isolated
(`vi.restoreAllMocks` in `afterEach`).

- **Standard:** [`docs/testing.md`](./docs/testing.md) (canonical).
- **Reference test:** [`src/Combat/e2e/hazard-pattern-combat.engine.test.ts`](./src/Combat/e2e/hazard-pattern-combat.engine.test.ts) (copy its structure).
- **Location:** `src/<Module>/e2e/<feature>.engine.test.ts` (the `.engine.test.ts`
  suffix is a fixed marker meaning "hermetic e2e suite"). The engine code
  itself lives next to the module as `<feature>.resolver.ts` (composite
  orchestrators returning `{ state, events }`) or `<feature>.reducer.ts`
  (single state-shape edits) so CLI files contain UI only.
- **Stub helpers:** `mockAlternatingRng`, `mockFixedRng`, `mockSequentialRng`
  from `src/test-utils/rng.ts`. Do not re-roll your own `vi.spyOn(Math, 'random')`.
- **Verification:** `npm test` green twice + `npm run type-check` clean before
  declaring done.
- **Observability:** the repo-wide structured logging contract (the `src/Log/`
  module, its engine taps, and the `--log-level`/`--log-file` CLI flags) is
  documented in [`../docs/logging.md`](../docs/logging.md). It is default-OFF —
  sims and tests must leave it that way.
