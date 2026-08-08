# Phase 52e — Retire the Night Watch

> Agent-facing brief. Tear out the rest minigame now that its replacement
> is live and reachable. Mechanics + mobile + harness. Fifth of the
> **rest-choice** epic (52a-52f). **Runs after 52d, never before** — a
> `rest` MapEvent kind with no host screen is an unplayable map, and
> `plan/bearings.md` requires every phase to leave `main` green *and
> playable*.

## Why this exists

T direct (attended chat, 2026-08-08), asked explicitly what should happen
to the ~1,000-line Night Watch: **full retirement.** Delete the engine,
sim, CLI, tutorial and tuning harness; void its balance doctrine; keep
the design docs as dated history.

## Inventory — delete

**mechanics**
- `src/World/Rest/` entire directory: `index.ts`, `rest.content.ts`,
  `rest.engine.ts`, `rest.rng.ts`, `rest.sim.ts`, `rest.types.ts`,
  `e2e/rest.engine.test.ts`.
- `src/CLI/rest.cli.ts` + `src/CLI/e2e/rest.cli.engine.test.ts`.
- The `rest` sub-command in `src/CLI/game.cli.ts` and the
  `"rest": "ts-node src/CLI/game.cli.ts rest"` script in
  `axiomancer-mechanics/package.json`.
- `export * from './Rest'` in `src/World/index.ts:95` and
  `export * from './World/Rest'` in `src/index.ts:385` — **barrel
  removals, so all three workspace gates run.**
- The `rest*` RNG aliases (`src/index.ts:384` comment names them).

**mobile**
- `components/rest/tutorial-steps.ts`, `components/rest/TutorialCoach.tsx`.
- `components/DebugRestButton.tsx` + its debug-menu entry.
- `state/e2e/rest.tutorial.engine.test.ts`.
- `REST_TUTORIAL_FLAG` / `REST_TUTORIAL_SEED` / `REST_KEEPSAKE_FLAG_PREFIX`
  / `INN_REST_HEAL_FRACTION` and any posture/watch/keepsake residue left
  in `state/rest/store-actions.ts` after 52d's rewrite.
- Night-Watch-shaped assertions in `state/e2e/rest.flow.engine.test.ts`,
  `state/e2e/event.engine.test.ts`, `state/e2e/map-encounter-minigames.engine.test.ts`,
  `state/e2e/minigame-seeds.engine.test.ts`, `components/__tests__/DebugEncounterButtons.test.tsx`.

**harness**
- `.claude/commands/rest-tuning.md` and `.github/workflows/rest-tuning.yml`.
- The `Rest meagre-but-never-lethal (posture gradient)` row in
  `plan/bearings.md` § "Balance doctrines (per encounter)" — **void it,
  do not silently drop it**; the doctrine described a minigame that no
  longer exists.

## Inventory — keep (do not delete by association)

- **The `rest` MapEvent kind.** It is the choice node now.
- **`RestGate` and the `/rest` route** — repointed by 52d.
- **`'rest'` in `MinigameSeedKey`** (`state/minigame-seeds.ts`) — the
  choice node is still seeded.
- **The hazard-scar max-VITAE mend** — re-homed onto `shelter: 'inn'` in
  52b. It is hazard-system behaviour that merely *fired* at a rest.
- **`docs/encounters/rest.md`, `axiomancer-mobile/design/encounters/rest.md`** —
  mark `**Status:** HISTORICAL` with a dated header pointing at this
  phase. The lexicon lint already exempts HISTORICAL files, and
  `plan/bearings.md` says dated records are not rewritten.

## Save migration — the part that bites

`GAME_STATE_VERSION` 16 → 17. Existing saves carry Night Watch residue
that must not orphan or crash a load:

- `night-keepsake:*` flags — **keep them**. `/memoir`'s REMAINS section
  (Phase 6) reads keepsakes, and deleting them silently erases a
  player's run history. They simply stop being minted.
- `night-watch-tutorial-done` — drop.
- Any persisted `rest` slice holding a live `RestSession` — a player
  mid-night when they update must land somewhere valid. Clear the slice
  and leave the node consumed; do not attempt to translate a posture
  mid-flight into a choice.

## Decisions made upfront — DO NOT ASK

- Full retirement, not a flag-park. T chose it explicitly over "park it
  behind a flag" and "keep as a rare special node".
- Keepsake flags survive; the tutorial flag does not.
- Historical docs are annotated, never deleted.

## Knock-on: Phase 44f

Phase 44f's scope line lists *"the four authored minigame names — The
Gleaning (gathering), The Reliquary (loot-cache), **The Night Watch
(rest)**, The Boy's Almanac (quest board)"*. After this phase there are
three. **Update 44f's row in the same commit** so the retheme is not
sent looking for a thing that no longer exists — and note that the new
rest-choice node still needs a name from the Phase 42 bible.

## Prove (DoD)

- `grep -rn "Night Watch\|RestPosture\|restSession\|createRestSession"`
  across the repo (excluding `node_modules` and HISTORICAL docs) returns
  nothing live. Make that grep a checked step, not a hope.
- Migration test: a v16 save with a live rest session and two keepsakes
  loads clean at v17, keeps the keepsakes, drops the tutorial flag.
- `npm run verify` (**all three workspaces** — barrel removals).
- `npm run deploy:check` after push.

## Follow-ups

- 52f calibrates the prices this node now charges.
- The new node has no tutorial. Filed to Phase 46a/46c, not patched here.
