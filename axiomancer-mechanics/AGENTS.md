# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Axiomancer Mechanics is a TypeScript TTRPG game engine (Node.js CLI). No databases, servers, or containers required. See `README.md` for architecture docs. Read `VISION.md` before major mechanics, combat, balance, friendship/mercy, alignment, or `/march` phase work.

**Load-bearing doctrine (2026-06):** Status effects are the MAIN fun and the most engaging aspect of combat encounters. Balance/tuning/content work optimises first for status-effect-centric play; treat low status-effect engagement as a balance failure even when win/loss rates look healthy. Canonical in `VISION.md`.

**Scheduled evidence doctrine (2026-06):** Command-green playtests can still be design-red. Treat late-game/boss witnesses as failed evidence when they sit outside the 65–75% resolution-success band, record 0 player damage, never exercise Heart/Befriend/mercy attempts, or collapse into low-status Body/damage dominance. Capture generated playtest metrics in the dated report, then revert generated tracked reports unless the task explicitly updates those fixtures.

**Hazard-style combat witness doctrine (2026-06):** A direct combat CLI run or passing combat tests prove the engine command path, not first-level route integration. When scheduled evidence claims route-level Hazard-style combat, the walkthrough must actually traverse an authored map encounter, enter the current HP-only/Hazard-style board, and record `hazardCombat:start`/resolution events. If a Fishing Village route now resolves loot/narration/quest instead of combat, repair or replace the route witness before claiming coverage.

### Key commands

All commands are in `package.json`:

| Task | Command |
|---|---|
| Build | `npm run build` |
| Type-check | `npm run type-check` |
| Test | `npm test` (vitest) |
| Lint | `npm run lint` |
| Lint + type-check | `npm run check` |
| Demo CLI | `npm run game` (tabbed map / combat / journal / skills / inventory / debug loop) |
| Verify gate | `npm run verify` (type-check + lint + test + build) |
| Deploy gate | `npm run deploy:check` (`npm pack --dry-run`) |

For automated / agent-driven CLI runs, the Phase 20 flags expose
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
   `feat(combat): promote resolveCombatRound to first-class export` or
   `refactor(cli): delegate runCombatTurn to resolver — no inline math`.
   Keep the body concise; reference the spec number when relevant.
4. **Spec update commit** — the final commit for any spec implementation must
   include the updated spec file (acceptance checklist ticked + implementation
   notes) and any doc files changed.

Never squash or amend after pushing unless explicitly asked.

### Caveats

- **ESLint**: `npm run lint` is part of `npm run verify`. The flat config
  registers `@typescript-eslint` correctly (Phase 13 fix). Warnings are
  advisory; only errors fail the gate.
- **Demo CLI is interactive**: `npm run game` uses `inquirer` prompts. For
  hermetic automation, prefer the Phase 20 flags (`--script` / `--stdin` /
  `--json-events`) over `pexpect` / tmux `send-keys`. The Python harness
  was removed in Phase 17 — hermetic e2e tests are the durable path.
- **Test runner**: `npm test` runs vitest. Use alongside `npm run type-check`,
  `npm run lint`, and `npm run build` (all four chained by `npm run verify`).
- **State file**: The Node persistence adapter writes `game-state.json` in
  the project root when used. This file is gitignored and ephemeral.
- **Spec update**: If using a spec file to implement a change, update the
  spec as you walk through the steps.

### Hermetic E2E testing — REQUIRED

Every implementation must land with at least one **hermetic e2e test** that
drives the change through the highest-level public entry point of its module.
If you cannot, extract logic until you can — or document the
"hermetic-test debt" in the PR description.

**Hermetic** = self-contained (no disk/network/TTY) + deterministic
(`Math.random` stubbed via `src/test-utils/rng.ts`) + isolated
(`vi.restoreAllMocks` in `afterEach`).

- **Standard:** [`docs/testing.md`](./docs/testing.md) (canonical).
- **Reference test:** [`src/Combat/e2e/combat.resolver.engine.test.ts`](./src/Combat/e2e/combat.resolver.engine.test.ts) (copy its structure).
- **Location:** `src/<Module>/e2e/<feature>.engine.test.ts` (the `.engine.test.ts`
  suffix is a fixed marker meaning "hermetic e2e suite"). The engine code
  itself lives next to the module as `<feature>.resolver.ts` (composite
  orchestrators returning `{ state, events }`) or `<feature>.reducer.ts`
  (single state-shape edits) so CLI files contain UI only.
- **Stub helpers:** `mockAlternatingRng`, `mockFixedRng`, `mockSequentialRng`
  from `src/test-utils/rng.ts`. Do not re-roll your own `vi.spyOn(Math, 'random')`.
- **Verification:** `npm test` green twice + `npm run type-check` clean before
  declaring done.
