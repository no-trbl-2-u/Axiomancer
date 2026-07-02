# Goal — fishing-village-exploration walkthrough

**Surface under test:** the current first-level Fishing Village route from authored map traversal into live Hazard-Pattern combat.

This walkthrough no longer uses the stale Harbor District combat assumption (`fv-11 → fv-14 → fv-15`). Current map truth routes the first reliable encounter through:

```txt
fv-1 Hovel → fv-2 Crossing/cache → fv-12 Market/encounter
```

`fv-12` resolves an encounter with **Driftwood Husk**. The CLI must not stage the encounter into the removed legacy combat shell. It must enter the Hazard-Pattern combat driver and emit `hazardCombat:*` events.

## Recommended command

```bash
npx ts-node src/CLI/game.cli.ts \
  --script automation/scripts/walkthroughs/fishing-village-exploration.json \
  --json-events \
  --state-log /tmp/fishing-village-exploration.jsonl
```

The script answers only map prompts. Because script mode is non-interactive, encounter combat is auto-run through Hazard-Pattern combat.

The newer direct route form is also valid and preferred for CI/Kid evidence:

```bash
npx ts-node src/CLI/game.cli.ts \
  --route fv-2,fv-12 \
  --auto-combat \
  --combat-policy status \
  --combat-seed 42 \
  --combat-max-turns 12 \
  --json-events \
  --state-log /tmp/fishing-village-exploration.jsonl
```

## Pass conditions

1. **Bootstrap** records the starting character and Fishing Village state.

2. **Route movement** records move events in order:

   ```txt
   fv-2 → fv-12
   ```

3. **Map events resolve**:

   - `fv-2` may resolve a cache/loot event.
   - `fv-12` must resolve `event.kind === 'encounter'`.
   - The encounter enemy must be `Driftwood Husk` unless the authored map/event pool has intentionally changed.

4. **Hazard-Pattern combat starts from the route**:

   Required state-log/event evidence:

   ```txt
   hazardCombat:start
   hazardCombat:autoPhase
   hazardCombat:end
   ```

   `hazardCombat:mercy`, `hazardCombat:resolveThreat`, or card events are acceptable additional evidence.

5. **No legacy combat proof is accepted**:

   The walkthrough must not count `startCombat`, `combat:started`, `combatRound`, `resolveCombatRound`, or old attack/defend stance rounds as success.

6. **Session exits cleanly**:

   - script mode: trailing `{ "tab": "quit" }` may produce `cli:exit reason=quit` after the route run; or
   - route mode: `cli:exit reason=route-complete` is the expected exit.

## Fail conditions

- Any route target is unreachable from the current node.
- `fv-12` no longer resolves an encounter and no replacement first-level encounter route is documented.
- The encounter is merely staged with a message such as “Run npm run combat” instead of entering Hazard-Pattern combat.
- No `hazardCombat:start` appears in the state log or JSON event stream.
- Direct `npm run combat` is used as substitute evidence for map traversal. It proves the combat command path only, not route integration.

## Diagnostic notes

- Mobile already proves the product path through `/exploration → fv-12 Market → Engage → CombatEncounterPanel`.
- This mechanics walkthrough is the CLI equivalent: authored map route → `resolveMapEvent(encounter)` → Hazard-Pattern combat runner.
- If `fv-12` changes, update this goal and script to the current first-level encounter route rather than reviving legacy combat assumptions.
