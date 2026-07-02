# Phase 165 — Agentic Hazard-style combat CLI

**Source:** T direct steering 2026-06-23.

## Outcome

The mechanics CLI exposes two explicit combat routes:

1. **Legacy combat** — the current `resolveCombatRound` stance/action loop, renamed and surfaced as a `legacy-combat` option.
2. **New combat** — an agent-driveable Hazard-style combat CLI flow that uses the Spec 25/26b card/dice combat engine (`initializeCombatEncounter`, turn draft/read, card play, Signature Skills, threat resolution, between-phase upkeep) and supports scripted/JSON/state-log evidence for The Kid and `/combat-tuning` workers.

After this phase, an agent can run a deterministic CLI playthrough of the new combat without a TTY and produce state/event evidence showing actual player decisions: enemy selection, stance die draft, card/dice choices, optional signature skill use, combat phase resolution, threat phase resolution, outcome, rewards/summary.

## Source / user decision

T asked directly:

> Create a phase to Move the original combat CLI to a "legacy combat" option. Then create a new combat option to allow for Agentic playthroughs using the new combat system from the CLI.

Current truth at filing:

- `npm run game` / `src/CLI/game.cli.ts` has a `Combat` tab that still drives the old `resolveCombatRound` loop.
- Authored map encounters in `game.cli.ts` call `store.getState().startCombat(result.event.encounter)` and then `combatTab(store)`, so the map-triggered game CLI proves legacy combat, not Hazard-style combat.
- `npm run combat-sim` exists, but it is a Monte-Carlo bot over `simulateHazardPatternCombat`, not a player/agentic decision flow.
- `docs/hazard-pattern-combat-reconciliation-gaps.md` already names CLI parity as a gap.

This phase closes that gap.

## Source spec / anchors

- `docs/combat.md` — Hazard-Pattern Combat API and Spec 26/26b depth layer.
- `plan/bearings.md` — current combat surface: HP-only win condition; pressure tracks removed; new turn draft/read + Conviction + Signature Skills + deckbuilder rewards are current doctrine.
- `src/Combat/combat.engine.ts` — phase loop and core new-combat verbs.
- `src/Combat/combat.encounter.types.ts` — `CombatEncounterState` type family.
- `src/Combat/combat.signature.ts` — Conviction-funded Signature Skills.
- `src/Combat/combat.encounter.sim.ts` — existing bot witness, useful for auto-policy reference only.
- `src/CLI/game.cli.ts` — current legacy route to preserve under explicit naming.
- `src/CLI/io.ts` — existing `--script`, `--stdin`, `--json-events`, `--state-log` machinery.
- `src/CLI/e2e/{game.cli.engine.test.ts,hazard.cli.engine.test.ts,quest-board.cli.engine.test.ts}` — CLI e2e patterns.

## Implementation units

### Unit 1 — Rename the current combat tab/flow to legacy combat

Files:

- Modify: `src/CLI/game.cli.ts`
- Modify: `src/CLI/e2e/game.cli.engine.test.ts`
- Modify docs if current CLI docs name the old flow generically:
  - `README.md`
  - `docs/cli.md`
  - `docs/gameloop.md`

Work:

1. Rename the user-facing current combat tab from `Combat` to **Legacy Combat** or `legacy-combat`.
2. Rename helper functions where useful:
   - `combatTab` → `legacyCombatTab`
   - `chooseCombatAction` → `chooseLegacyCombatAction`
3. Preserve the old implementation exactly except for naming/docs:
   - still uses `resolveCombatRound`
   - still logs `combatRound`
   - still supports old walkthroughs until migrated
4. When an old `GameState.combat` exists, the tab label should make clear it is legacy.
5. Update tests/docs so nobody mistakes this for the new Hazard-style combat.

Decision: do **not** delete legacy combat in this phase. The point is to name it honestly and keep regression evidence alive.

### Unit 2 — Add a new `combat` subcommand or top-level CLI option for Hazard-style combat

Files:

- Create: `src/CLI/combat.cli.ts` or `src/CLI/hazard-combat.cli.ts` — choose the name that best fits the existing `game.cli.ts` subcommand dispatcher.
- Modify: `src/CLI/game.cli.ts` — dispatch `combat`/`hazard-combat` subcommand before interactive game loop, following `hazard`, `gathering`, `rest`, `loot-cache`, `quest-board` patterns.
- Modify: `package.json` — wire an npm alias. Preferred:
  - `"combat": "ts-node src/CLI/game.cli.ts combat"`
  - optional explicit alias: `"hazard-combat": "ts-node src/CLI/game.cli.ts combat"`
- Modify: `src/CLI/e2e/game.cli.engine.test.ts` or add a new focused e2e file.

Required CLI flags:

```bash
npm run combat -- \
  --enemy MournfulGull \
  --preset apprentice \
  --seed 1 \
  --script automation/scripts/walkthroughs/hazard-combat-smoke.json \
  --json-events \
  --state-log /tmp/hazard-combat.jsonl
```

Minimum supported flags:

- `--enemy <slugOrName>` — default `MournfulGull`; validate against the enemy registry.
- `--preset <id>` — default `apprentice` or closest available early-game fixture.
- `--seed <n>` — deterministic RNG seed.
- `--script <path>` — existing JSON answer array.
- `--stdin` — JSONL answers.
- `--json-events` — machine-clean event output.
- `--state-log <path>` — JSONL state mutation log.
- `--auto` — optional but strongly preferred; runs a simple deterministic witness policy when no script is supplied.
- `--policy naive|safe|aggressive|status|bughunt` — optional if `--auto` lands in this phase; otherwise defer with explicit TODO.

Decision: `npm run combat` means **new Hazard-style combat** after this phase. The old flow is `legacy-combat`.

### Unit 3 — Implement the agentic new-combat prompt loop

Files:

- Create/modify: `src/CLI/combat.cli.ts` or `src/CLI/hazard-combat.cli.ts`
- Test: `src/CLI/e2e/hazard-combat.cli.engine.test.ts`

Use the real new-combat engine, not the legacy reducer:

- `initializeCombatEncounter(...)`
- `startTurn(...)`
- `rollEncounterDice(...)` if still required by the current engine shape
- `draftStanceDie(...)` / `chooseDraft(...)`
- `handCards(...)`
- `availableDice(...)`
- `cardDieCostPreview(...)`
- `playCombatCard(...)`
- `playSignatureSkill(...)` where affordable
- `resolveCombatPhase(...)`
- `resolveThreatPhase(...)`
- `processBetweenPhases(...)`
- `buildCombatSummary(...)`

The prompt loop must expose agent-usable decisions:

1. **Enemy / setup summary** — enemy, player preset, deck/hand, HP, Conviction, visible threat hint.
2. **Draft/read prompt** — choose a stance die from the rolled/drafted pool.
3. **Card prompt** — choose one or more playable cards, or pass.
4. **Dice assignment prompt** — choose dice for each card when costed/powered actions are available.
5. **Signature prompt** — if Conviction affords a Signature Skill, allow play or skip.
6. **Resolve phase prompt** — commit staged plays.
7. **Threat phase / continue prompt** — resolve enemy phase, process upkeep, proceed or quit.
8. **Outcome summary** — victory/defeat/mercy/retreat where supported, plus `buildCombatSummary` attribution.

Every state mutation must log through the same evidence idiom as existing CLIs:

- `logState('hazardCombat:start', before, after, event)`
- `logState('hazardCombat:draft', before, after, event)`
- `logState('hazardCombat:playCard', before, after, event)`
- `logState('hazardCombat:signature', before, after, event)`
- `logState('hazardCombat:resolvePhase', before, after, event)`
- `logState('hazardCombat:resolveThreat', before, after, event)`
- `logState('hazardCombat:betweenPhases', before, after, event)`
- `logState('hazardCombat:end', before, after, summary)`

Exact event names may vary; the important part is stable machine-readable action labels.

### Unit 4 — Add deterministic auto-policy support for agents

Files:

- Modify: `src/CLI/combat.cli.ts` or `src/CLI/hazard-combat.cli.ts`
- Reuse/refactor where sensible: `src/Combat/combat.encounter.sim.ts`
- Test: `src/CLI/e2e/hazard-combat.cli.engine.test.ts`

The agentic CLI must not require a human when `--auto` is set.

Minimum `--auto` behavior:

- choose a draft die deterministically based on current policy;
- prefer playable status/DoT/control cards over weak direct strike when policy is `status`;
- prefer direct damage when policy is `aggressive`;
- conserve resources / avoid overpaying when policy is `safe`;
- use Signature Skill when affordable and useful;
- stop after terminal outcome or `--max-turns`.

Required additional flag:

- `--max-turns <n>` default 8 or 10, to prevent infinite loops.

Report per run:

- outcome;
- turns/phases;
- enemy/player final HP;
- cards played;
- dice used;
- Signature Skills used;
- status effects applied/ticked;
- Conviction spent;
- summary attribution.

Decision: the first auto-policy can be simple and deterministic. It is a witness, not an omniscient tuner. If richer policies are needed, file follow-up work.

### Unit 5 — Add walkthrough fixtures proving agentic playthrough

Files:

- Create: `automation/scripts/walkthroughs/hazard-combat-smoke.json`
- Create: `automation/scripts/walkthroughs/hazard-combat-smoke.goal.md`
- Modify: `automation/scripts/walkthroughs/README.md`

The walkthrough must prove:

- the new `npm run combat` route starts a Hazard-style combat encounter;
- a stance/read draft decision is made;
- at least one card is played with a deterministic dice assignment or free half;
- at least one phase resolves;
- at least one threat phase resolves or a terminal outcome occurs;
- state-log contains `hazardCombat:*`-style entries, not `combatRound` only;
- legacy `resolveCombatRound` is not used by the new route.

If `automation/agent-e2e.mjs` is too tied to `npm run game`, extend it narrowly or add a small equivalent harness for the new CLI. Do not leave the new combat CLI without a replayable witness.

### Unit 6 — Docs and migration notes

Files:

- Modify: `README.md`
- Modify: `docs/cli.md`
- Modify: `docs/combat.md`
- Modify: `docs/gameloop.md`
- Modify if present/relevant: `divergences.md`
- Modify if relevant: `CHANGELOG.md`

Docs must state clearly:

- `npm run combat` = new Hazard-style combat CLI.
- `legacy-combat` = old `resolveCombatRound` stance/action loop.
- `npm run combat-sim` = Monte-Carlo balance witness, not an agentic playthrough.
- `npm run game` map-triggered combat behavior after this phase:
  - either routes to new combat by default, or keeps old route explicitly named `legacy-combat` with a documented follow-up.

Decision: if technically safe inside this phase, map-triggered encounters in `game.cli.ts` should offer a choice between `combat` and `legacy-combat`, defaulting to new combat. If that makes the phase too large, the new standalone `npm run combat` still ships now and map-trigger integration is filed as follow-up.

## Decisions made upfront — DO NOT ASK

1. **The old CLI flow is legacy.** Preserve it under `legacy-combat`; do not remove it.
2. **The new route owns `npm run combat`.** If an old `combat` alias exists or stale docs mention it, move that meaning to `legacy-combat`.
3. **`combat-sim` is not enough.** Keep it as a balance witness, but do not call it agentic playthrough evidence.
4. **Use existing CLI IO.** Reuse `src/CLI/io.ts` flags and JSON/state-log conventions. Do not invent a second scripting protocol.
5. **No hidden TTY-only surface.** The new combat flow must work with `--script`, `--stdin`, `--json-events`, and `--state-log`.
6. **State-log action labels must distinguish new combat from legacy.** New evidence should not be named `combatRound` alone.
7. **The first implementation may be standalone.** Full map-trigger integration is preferred, but not allowed to block the standalone agentic CLI. If map-trigger integration is deferred, document and phase it.
8. **No balance tuning.** This phase builds evidence machinery; it does not retune enemy/player numbers.
9. **No mobile changes.** Mobile consumes this later; mechanics owns this CLI phase.

## Verify gate

Run at minimum:

```bash
git diff --check
npm run type-check
npx vitest run src/CLI/e2e/game.cli.engine.test.ts src/CLI/e2e/hazard-combat.cli.engine.test.ts src/Combat/e2e/hazard-pattern-combat.engine.test.ts
npm run combat -- --enemy MournfulGull --preset apprentice --seed 1 --auto --policy status --max-turns 6 --json-events --state-log /tmp/hazard-combat-cli.jsonl
npm run legacy-combat -- --script automation/scripts/walkthroughs/skills-in-combat.json --json-events --state-log /tmp/legacy-combat-cli.jsonl
```

If package scripts cannot support `npm run legacy-combat` directly, verify the equivalent `npm run game -- legacy-combat ...` or documented command. The shipped docs must match the actual command.

If source/test code changes beyond isolated CLI wiring, run:

```bash
npm run verify
npm run deploy:check
```

## Commit body template

```text
feat(cli): split legacy combat and add hazard combat playthrough CLI

- rename the old resolveCombatRound CLI path as legacy combat
- add an agent-driveable Hazard-style combat CLI using the Spec 25/26b engine
- support script/stdin/json-events/state-log evidence for new combat decisions
- add deterministic auto-policy and walkthrough fixture coverage
- document combat vs legacy-combat vs combat-sim roles

Verification:
- npm run type-check
- npx vitest run src/CLI/e2e/game.cli.engine.test.ts src/CLI/e2e/hazard-combat.cli.engine.test.ts src/Combat/e2e/hazard-pattern-combat.engine.test.ts
- npm run combat -- --enemy MournfulGull --preset apprentice --seed 1 --auto --policy status --max-turns 6 --json-events --state-log /tmp/hazard-combat-cli.jsonl
- npm run legacy-combat -- ...
```

## Definition of Done

- [ ] Old `resolveCombatRound` CLI path is visibly named `legacy-combat` / Legacy Combat.
- [ ] New `npm run combat` or equivalent command drives Hazard-style combat, not legacy `resolveCombatRound`.
- [ ] New combat CLI supports `--script`, `--stdin`, `--json-events`, and `--state-log`.
- [ ] New combat CLI supports deterministic agentic `--auto` play with at least one policy.
- [ ] State-log/action labels distinguish new combat from legacy combat.
- [ ] At least one hermetic e2e test covers the new CLI path.
- [ ] At least one scripted walkthrough fixture exists for the new combat route.
- [ ] Docs explain `combat`, `legacy-combat`, and `combat-sim` distinctly.
- [ ] The old legacy walkthroughs still pass or are explicitly migrated/documented.
- [ ] Verification commands above are run and recorded.

## Follow-ups out of scope

- Mobile UI changes.
- Retuning combat numbers.
- Full first-level map-trigger-to-new-combat integration if it proves too large; file it as the next phase, but prefer shipping it here if straightforward.
- Rich multi-policy strategic AI beyond the first deterministic auto witness.
- Multi-enemy Hazard-style combat redesign.
