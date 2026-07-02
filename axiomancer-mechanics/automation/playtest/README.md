# automation/playtest/ — Balance measurement and probe scripts

> Reference probe scripts for measuring combat balance and performance 
> against known difficulty tiers. Designed for release-gating and 
> post-expansion validation.

## Probe Scripts

### Reference Probes

| Script | Target Tier | Description | Enemies Tested |
|---|---|---|---|
| [`late-game-coastal-tyrant.json`](./scenarios/late-game-coastal-tyrant.json) | Endgame | Late-game Sage preset against The Coastal Tyrant | `coastal-tyrant` |
| [`mid-game-reference-probe.mjs`](./mid-game-reference-probe.mjs) | Midgame | Level-6 Wanderer against northern-forest elite-tier enemies | `hush-wraith`, `hollow-saint`, `frostbound-hunter` |

### When to Run Probes

- **Mid-game probe**: Run when evaluating balance changes affecting levels 4-8, northern-forest content, or Tier 1-2 skill balance.
- **Late-game probe**: Run when evaluating endgame balance, boss-tier content, or Tier 3 skill interactions.

### Running Probes

```bash
# Run specific scenario
npm run playtest -- --scenario=automation/playtest/scenarios/late-game-coastal-tyrant.json

# Run mid-game reference probe (multiple scenarios)
node automation/playtest/mid-game-reference-probe.mjs
```

## Signal Interpretation

### Target Metrics (from Spec 15)

**Mid-tier (northern-forest)**:
- Expected rounds: 5-8 rounds
- Player survivability: 70-85%
- Damage ratio: 1.2:1 to 1.8:1 (player advantage)
- Friendship reachability: 55-70%

**Endgame tier (boss encounters)**:
- Expected rounds: 8-15 rounds  
- Player survivability: 55-75%
- Damage ratio: 0.8:1 to 1.4:1 (balanced to slight player advantage)
- Friendship reachability: 40-60%

### Alert Thresholds

- **Timeout rate > 15%**: Combat is dragging; consider stat/damage tuning
- **Win rate > 85%**: Encounter may be undertuned
- **Resolution success < 65% or > 75%**: Outside target band
- **Zero friendship outcomes**: Peaceful routes may be too hidden/costly

## Report Files

Generated reports land in [`reports/`](./reports/):
- `<scenario-id>.md` - Human-readable markdown summary
- `<scenario-id>.json` - Raw metrics for programmatic analysis

## Files

### Scenarios
- [`scenarios/`](./scenarios/) - JSON scenario definitions for the playtest CLI

### Reports  
- [`reports/`](./reports/) - Generated probe reports (markdown + JSON)

### Metadata
- [`BALANCE_LEDGER.md`](./BALANCE_LEDGER.md) - Historical balance decisions
- [`NEXT_STEPS.md`](./NEXT_STEPS.md) - Queued balance work
- [`WHY_THIS_EXISTS.md`](./WHY_THIS_EXISTS.md) - Rationale for the probe system