# Automated Playtest Harness — Why This Exists

This directory is additive infrastructure. It does **not** replace the existing CLI walkthrough pipeline, `automation/agent-e2e.mjs`, or the hermetic Vitest engine suites.

## What already existed

Axiomancer already had useful automation:

- `src/CLI/io.ts` supports `--script`, `--stdin`, `--json-events`, `--state-log`, and `--save-file`.
- `automation/scripts/walkthroughs/` contains scripted one-shot CLI walkthroughs.
- `automation/agent-e2e.mjs` can run a walkthrough and ask an LLM to grade it against a goal file.
- `src/Character/presets.ts` already includes a late-game `sage` preset.
- `src/Enemy/enemy.library.ts` exposes stable enemy slugs through `ENEMY_REGISTRY`, including `coastal-tyrant`.
- The engine already exposes deterministic RNG control through `setSeed`.

Those tools answer: **can this scripted flow still execute?**

## What was missing

For design playtesting, we also need to ask:

- What happens if this encounter runs 25, 100, or 1000 times?
- Which policy wins, dies, stalls, or dominates?
- Does friendship ever happen under a policy trying to produce it?
- Which stance or action becomes the obvious answer?
- Which seeds should Tobin inspect because they broke, timed out, or produced strange evidence?

The existing walkthrough system was a puppet string. This harness is a repeatable arena.

## What this harness adds

- Scenario files under `automation/playtest/scenarios/`.
- A direct engine runner under `src/Playtest/` that bypasses the CLI UI and drives the mechanics through the public combat/store surfaces.
- Policy players: `aggressive`, `defensive`, `friendship`, `resource-optimal`, `random`, and `mixed`.
- Repeat-run simulation with seeded reproducibility.
- Aggregate metrics: win/defeat/friendship/timeout rates, average and median rounds, action/stance/skill/item/enemy-action counts.
- Markdown and JSON reports under `automation/playtest/reports/`.
- A hermetic e2e test proving the scenario runner can execute multiple runs and return aggregate evidence.

## What this harness is not

- Not a replacement for `npm test` or `npm run verify`.
- Not a replacement for CLI walkthroughs.
- Not an LLM evaluator.
- Not a human-feel test.
- Not a Playwright or mobile UI test harness.

This is the mechanical proving ground. Later, an agentic playtester can consume these reports, replay seeds, and bring evidence to Tobin.

## Usage

Default scenario:

```bash
npm run playtest
```

Explicit scenario:

```bash
npm run playtest -- --scenario automation/playtest/scenarios/late-game-coastal-tyrant.json
```

Custom output directory:

```bash
npm run playtest -- --scenario automation/playtest/scenarios/late-game-coastal-tyrant.json --out-dir /tmp/axiomancer-playtest
```

Reports are written as Markdown for Tobin and JSON for downstream agents.

## Encapsulation rule

Keep new scenario definitions, generated reports, and playtest-specific documentation inside `automation/playtest/`. The reusable engine-facing runner lives in `src/Playtest/` so it can be type-checked, tested, and kept hermetic without changing the old CLI automation pipeline.
