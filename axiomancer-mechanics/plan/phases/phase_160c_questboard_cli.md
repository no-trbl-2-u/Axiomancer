# Phase 160c — QuestBoard CLI play loop ("The Boy's Almanac")

**Goal:** Make the `World/QuestBoard` engine ("THE BOATWRIGHT'S GAMBIT")
manually- and agent-playable in the Node host, mirroring the existing
`npm run rest` / `npm run loot-cache` / `npm run gathering` drivers, and close
the remaining half of NEEDS_ATTENTION §4 (CLI does not play the Phase 137
minigames).

**Source:** Carved from Phase 160b (build-plan row 160c). QuestBoard is the
largest of the three minigame engines (charms, vows, bone rolls, nine space
kinds, dusk/collapse), so its play loop is its own slice.

## Scope

A standalone `src/CLI/quest-board.cli.ts` reachable as a `game.cli.ts`
subcommand (`npm run game -- quest-board`) and a convenience alias
(`npm run quest-board`). It reuses the shared `io.ts` layer
(`--script`/`--stdin`/`--json-events`/`--state-log`) and a `step()` wrapper that
logs `illegalQuestBoardAction` on a no-op transition with a state snapshot —
exactly the rest/loot-cache pattern.

### Flags

- `--policy safe|gambler|economist` — bot for `--auto`, reusing the
  `quest-board.sim.ts` policy shapes (default `economist`).
- `--auto` — the policy plays the whole board to `done`.
- `--board <id>` — pick a board (default `build-the-boat`; validated against
  `QUEST_BOARDS`).
- `--seed <n|str>` — seeds the engine's embedded RNG (reproducible runs, via
  `minigameRunSeed`).
- `--runs <n>` — play N boards back-to-back (default 3).

### Engine verbs driven

`createQuestBoardSession` → `beginQuestBoard` → loop of
`rollQuestBone` / `useQuestCharm` / `chooseQuestSpaceOption` /
`continueQuestSpace` / `acknowledgeQuestDusk` → `claimQuestBoardCompletion`.
The bot mirrors the sim's `safe`/`gambler`/`economist` option logic; logic stays
in the engine, this file only parses flags, prompts, dispatches, and formats.

## Commit unit

1. `quest-board.cli.ts` + `npm run quest-board` + `quest-board` subcommand in
   `game.cli.ts` + `src/CLI/e2e/quest-board.cli.engine.test.ts` (flag parsing,
   deterministic `--auto` replay via `--state-log`, illegal-action logging).
   New e2e file added to the hermeticity IO allowlist. Docs: `docs/world.md`
   CLI-play-loops note extended; NEEDS_ATTENTION §4 closed.

## Definition of done

- `npm run quest-board -- --auto --seed 1` plays a full board to a claimed
  outcome.
- `src/CLI/e2e/quest-board.cli.engine.test.ts` green; file in the IO allowlist.
- `npm run verify` green.
