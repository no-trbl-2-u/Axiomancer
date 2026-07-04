# Phase 14 — First-map route audit and survivorship semantics

## Outcome

Make the `game.cli --route` first-map playthrough witness honest enough for Kid/automated playthrough reports:

1. A worker can cover every authored Fishing Village node through deterministic route-audit evidence, without pretending the no-backtravel player route can visit every branch in one life.
2. Route-level Hazard combat outcomes affect traversal semantics: a combat `defeat` must stop the scripted route or mark the remainder as post-defeat command-path evidence, not clean survivorship.
3. The reportable CLI evidence distinguishes three lanes cleanly:
   - **player-ish survivorship route** — legal moves only, stops on defeat/death/blocker;
   - **coverage/audit route** — branch-reset or non-mutating audit mode for all nodes;
   - **command-path probe** — explicit fallback that proves handlers fire but does not claim playthrough survival.

## Source / user decision

T asked on 2026-07-04 to “make a phase to fix this playthrough issue regarding the map.” The direct evidence is the Kid report:

- `/root/Workspace/reports/axiomancer-playthrough/2026-07-04.md`
- Current route reached 19 of 25 Fishing Village nodes.
- Unvisited because completed-node no-backtravel / branch topology prevented a single all-node route: `fv-4`, `fv-11`, `fv-14`, `fv-15`, `fv-20`, `fv-25`.
- `fv-1` was counted as start but its event was not resolved in-place.
- Boss combat at `fv-6` returned `defeat`, but route traversal continued, so downstream movement was command-path evidence rather than survivorship evidence.

## Package / ownership

Primary package: `axiomancer-mechanics`.

Mobile is out of scope unless the mechanics CLI/export contract changes a public type consumed by mobile. If that happens, verify the mobile workspace too.

## Implementation units

### 1. Inspect and preserve the current legal movement law

Files likely involved:

- `axiomancer-mechanics/src/World/world.reducer.ts`
- `axiomancer-mechanics/src/Game/store.ts`
- `axiomancer-mechanics/src/World/Continents/Coastal-Village/maps.ts`
- `axiomancer-mechanics/src/World/MapEvents/content.ts`

Do not remove the player-facing no-backtravel/completed-node rule unless the map doctrine explicitly changes. The bug is the witness claiming more than the player route can prove, not necessarily the movement law itself.

### 2. Add explicit route run modes / result classification

Files likely involved:

- `axiomancer-mechanics/src/CLI/game.cli.ts`
- `axiomancer-mechanics/src/CLI/io.ts`
- `axiomancer-mechanics/src/CLI/e2e/game.cli.route-hazard.engine.test.ts`

Expected behavior:

- Default `--route` remains player-ish/legal.
- The route runner stops on combat defeat/death or emits a clear terminal blocker event and refuses to classify later nodes as survivorship evidence.
- Add a machine-readable final summary event to the state log, e.g. `route:end`, with enough fields for Kid reports:
  - `classification: "survivorship" | "coverage-audit" | "command-path" | "blocked"`
  - `visitedNodeIds`
  - `resolvedNodeIds`
  - `unvisitedNodeIds`
  - `blockedAtNodeId` / `blockerReason` when applicable
  - `combatOutcomes`
  - `survived: boolean`

Names may differ; the contract matters more than the exact enum spelling.

### 3. Provide a full-map coverage witness without lying about one-run traversal

Choose the least invasive implementation that gives automated workers all 25 nodes honestly:

Preferred option:

- Add a route-audit mode, for example `--route-audit fishing-village` or `--route-coverage fishing-village`, that evaluates/reports all authored nodes and their event wiring without mutating the player run as if it were a single life.

Acceptable option:

- Add documented branch-reset probe support that runs multiple legal route fragments from fresh state and merges coverage into one `coverage-audit` summary.

Do not silently teleport in normal `--route` mode.

### 4. Resolve start-node event semantics

`fv-1` currently counts as starting position but does not resolve in place. Make the behavior explicit:

- either support an explicit `--resolve-start` / equivalent in audit mode;
- or record `fv-1` as `visitedUnresolved` with a reason.

No report should count start-node event coverage unless the event actually resolved.

### 5. Tests

Add/extend hermetic e2e coverage around the highest public CLI entry point:

- current happy path still emits `moveToNode`, `resolveMapEvent`, `hazardCombat:start`, `hazardCombat:autoPhase`, `hazardCombat:end`;
- route stops or downgrades classification after a combat defeat;
- route summary reports unvisited branch nodes honestly for the long Fishing Village path;
- coverage/audit mode accounts for all 25 authored Fishing Village nodes without claiming single-run survivorship;
- start node event state is explicit.

Use deterministic seeds/policies. Do not rely on shell-only manual output as the primary witness.

## Decisions made upfront — do not ask

- Keep no-backtravel/completed-node movement law unless code inspection proves it is an accidental defect.
- Fix the evidence contract first: survivorship and coverage are different claims.
- Coverage mode may use branch resets or non-mutating audit semantics; it must label itself as coverage/audit, not player survival.
- A combat `defeat` in route mode is terminal for survivorship evidence.
- Do not touch combat balance numbers in this phase.

## Verify gate

Minimum:

```bash
npm test --workspace axiomancer-mechanics -- --run src/CLI/e2e/game.cli.route-hazard.engine.test.ts
npm run verify --workspace axiomancer-mechanics
npm run deploy:check
```

If public exports/types changed and mobile imports are affected:

```bash
npm run verify --workspace axiomancer-mobile
```

## Commit body template

```txt
feat(cli): classify first-map route coverage and survivorship

- add explicit route summary classification for survivorship vs coverage/audit vs command-path evidence
- stop or downgrade scripted route evidence after combat defeat
- add full Fishing Village coverage witness without pretending one legal route reaches every branch
- make start-node event coverage explicit

Verify:
- npm test --workspace axiomancer-mechanics -- --run src/CLI/e2e/game.cli.route-hazard.engine.test.ts
- npm run verify --workspace axiomancer-mechanics
- npm run deploy:check
```

## Definition of Done

- `game.cli --route` no longer lets a post-defeat route be reported as a clean playthrough.
- A Kid report can mechanically distinguish legal survivorship route coverage from audit coverage.
- A deterministic witness accounts for all 25 Fishing Village nodes or reports the exact missing nodes and why.
- `fv-1` start-node resolution is explicit.
- Route-Hazard lifecycle evidence still exists for authored encounters.
- Mechanics verify gate is green.

## Follow-ups out of scope

- Retuning boss/enemy difficulty.
- Fixing impossible-stage combat ceiling.
- Mercy/Befriend matrix accounting.
- Mobile UI map traversal changes unless a mechanics contract change forces a narrow consumer update.
