# Phase 22 — Mechanics CLI verify-gate coverage

## Outcome

The mechanics verify gate must fail before `main` ships a broken player-facing CLI. `npm run game`, `npm run combat`, and the route-to-Hazard evidence path must be protected by a deliberate CLI typecheck/smoke lane rather than depending on ad hoc `ts-node` execution after merge.

## Source / user decision

Promoted by T on 2026-07-09 after the game CLI broke on current `main`:

- `src/CLI/game.cli.ts` still called `getAvailableCards(player, philosophicalAlignment)` after `getAvailableCards` was simplified to `getAvailableCards(player)`.
- `npm run type-check --workspace axiomancer-mechanics` and `npm run type-check:tests --workspace axiomancer-mechanics` both passed because both TypeScript configs excluded `src/CLI`.
- Runtime `ts-node src/CLI/game.cli.ts` failed with `TS2554: Expected 1 arguments, but got 2`.
- The immediate bug was repaired in `fix(mechanics): repair game CLI card learning call`, but the missing guardrail remains.

## Implementation units

1. **Add a CLI TypeScript gate**
   - Inspect `axiomancer-mechanics/tsconfig.json` and `axiomancer-mechanics/tsconfig.tests.json`.
   - Add a dedicated `axiomancer-mechanics/tsconfig.cli.json` if including `src/CLI` in the existing configs would drag test-only or runtime-only constraints into the wrong lane.
   - Add `npm run type-check:cli` to `axiomancer-mechanics/package.json`.
   - Wire `type-check:cli` into `npm run verify` and `npm run verify:agent`.

2. **Add CLI smoke witnesses for actual command entrypoints**
   - Preserve existing hermetic CLI e2e tests, but add at least one process-level smoke if the typecheck alone cannot prove `ts-node` command startup.
   - Required smoke commands or equivalent scripted tests:
     - `npm run combat -- --auto --policy status --enemy little-belle --seed 42 --max-turns 12 --json-events --state-log <tmp>`
     - `npm run game -- --route fv-2,fv-12 --auto-combat --combat-policy status --combat-seed 42 --combat-max-turns 12 --json-events --state-log <tmp>`
   - The route witness must assert `moveToNode`, `resolveMapEvent kind=encounter`, `hazardCombat:start`, at least one `hazardCombat:autoPhase`, and `hazardCombat:end`.

3. **Keep CLI docs synchronized with registry truth**
   - Add or extend a cheap doc/example validation path so `docs/cli.md` examples do not name removed enemy slugs.
   - At minimum, make stale enemy examples visible to CI through a test or lint script that checks documented `--enemy` examples against `ENEMY_REGISTRY`.

4. **Document the new guardrail**
   - Update `axiomancer-mechanics/AGENTS.md` and `axiomancer-mechanics/docs/testing.md` or `docs/cli.md` to state that CLI files are no longer excluded from verification without a compensating `type-check:cli` lane.

## Decisions made upfront — do not ask

- Do not remove CLI tests from `src/CLI/e2e`; the problem is not their existence, it is that TypeScript verify excluded the CLI implementation.
- Prefer a dedicated `type-check:cli` lane over forcing `src/CLI` into every existing `tsconfig` if that creates noisy coupling.
- The canonical route smoke remains Fishing Village `fv-2,fv-12` unless map truth changes; if it changes, inspect the map/event registry and update the witness deliberately.
- Use current valid enemy slugs such as `little-belle`; do not resurrect stale `mournful-gull` / `wet-hound` examples.

## Verify gate

Run at minimum:

```bash
npm run type-check --workspace axiomancer-mechanics
npm run type-check:tests --workspace axiomancer-mechanics
npm run type-check:cli --workspace axiomancer-mechanics
npm run verify --workspace axiomancer-mechanics
npm run combat --workspace axiomancer-mechanics -- --auto --policy status --enemy little-belle --seed 42 --max-turns 12 --json-events --state-log /tmp/axiomancer-phase22-combat.jsonl
npm run game --workspace axiomancer-mechanics -- --route fv-2,fv-12 --auto-combat --combat-policy status --combat-seed 42 --combat-max-turns 12 --json-events --state-log /tmp/axiomancer-phase22-route.jsonl
```

If package-script argument forwarding differs under npm workspaces, run the same commands from `axiomancer-mechanics/` and record the exact command form that works.

## Definition of Done

- `npm run verify --workspace axiomancer-mechanics` includes a CLI typecheck lane.
- The original stale-call class (`TS2554` inside `src/CLI`) would fail the verify gate before runtime playtesting.
- Standalone combat CLI and route-to-Hazard CLI are exercised by automated smoke/e2e evidence.
- `docs/cli.md` examples use valid current enemy slugs or are validated against the registry.
- Repo remains clean after smoke runs except intentional committed files; temporary state logs are written under `/tmp` or cleaned.

## Commit body template

```text
Phase 22 hardens the mechanics CLI against runtime-only TypeScript failures.

- adds a CLI typecheck lane and wires it into mechanics verify
- adds process-level smoke/e2e coverage for combat CLI and route-to-Hazard CLI
- validates or updates CLI docs/examples against current registry slugs

Verification:
- npm run type-check --workspace axiomancer-mechanics
- npm run type-check:tests --workspace axiomancer-mechanics
- npm run type-check:cli --workspace axiomancer-mechanics
- npm run verify --workspace axiomancer-mechanics
- combat CLI smoke
- game route-to-Hazard smoke
```

## Follow-ups out of scope

- Reworking the whole CLI architecture.
- Changing combat balance, enemy stats, map topology, or tutorial behavior.
- Mobile UI changes unless mechanics public exports shift unexpectedly.
