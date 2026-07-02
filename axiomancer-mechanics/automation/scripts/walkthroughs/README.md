# Walkthroughs — scripted CLI traces for the agent-graded harness

Each walkthrough is a pair: `<name>.json` (scripted input replayed
through `npm run game --script`) plus `<name>.goal.md` (the test goal
the agent grader checks the resulting state log against). Together
they pin a single CLI surface under hermetic, replayable conditions.

Drive a walkthrough through the harness:

```
node automation/agent-e2e.mjs <name>
```

The harness loads the JSON script, optionally allocates a temp save
slot, invokes the CLI with the right flags, then hands the state log
and the goal file to the grader for pass/fail.

## Inventory

| Script | Surface under test | Preset | Enemy / scene | Required flags | Exit expectation |
|---|---|---|---|---|---|
| `boss-encounter` | Debug-tab `debugSpawn` driving a long combat loop against a boss-tier enemy | `sage` | `coastal-tyrant` (debug-spawned) | — | Combat ends (`scriptExhausted` after the final attack); player either victorious or scripted past the kill |
| `character-sheet` | Character tab — fields, derived stats, equipment, knownSkills (Phase 26 unit 3) | `apprentice` | — | — | `quit` reason; state log captures the Character tab render |
| `item-use` | In-combat `item` action consuming a `healing-potion` mid-fight (Spec 05b consumables) | `wanderer` | `sandbag` (debug-spawned) | — | Inventory decrements by one `healing-potion`; combat ends or script exhausts |
| `map-events` | Map tab + `resolveMapEvent` dispatcher firing on `fv-2` | `apprentice` | — | — | `quit` reason after the node resolves; state log shows the MapEvent payload |
| `save-load` | Save / Load CLI tabs + `--save-file` slot (Phase 27 unit 2 + Phase 31 fix at `711b49e` for fv-1 → fv-2 → fv-3 rollback) | `apprentice` | — | `--save-file <path>` (the harness allocates a temp path) | `quit` reason; map state rolls back to the save slot, not the autosave |
| `shop` | Phase 37 `buyItem` / `sellItem` + `defaultSellPrice` engine helper + CLI `shopLoop` (fv-3 Fishing Village Stalls) | `wanderer` | — | — | `quit` reason after a buy → sell round-trip on `minor-healing-potion` (25 → 13 → 19 currency, inventory empty again); `defaultSellPrice` strictly-less-than-buy invariant holds |
| `skill-learning` | Character-tab Learn prompt (Phase 30 unit 3 — `LEARN_SKILL` action wired to `learnSkill`) | `wanderer` | — | — | `quit` reason; state log shows newly-learned skills the preset didn't ship with |
| `skills-in-combat` | In-combat `skill` action (Phase 26 unit 1) — `ad-hominem-strike` mid-fight | `wanderer` | `wet-hound` (debug-spawned) | — | `quit` reason after combat; skill resource cost + damage applied |
| `stat-allocation` | Character-tab stat-allocation prompt loop (Phase 29 `db7c26f` — spend `availableStatPoints`) | `sage` | `coastal-tyrant` (long combat to generate XP / level-ups) | — | Combat ends; allocation prompt fires; `availableStatPoints` decrements |
| `endgame-loadout` | Phase 64 — endgame interactions: Tier 3 skill use (Phase 33/44), equipped-skill rotation (Phase 18+30), enemy alignment AI bias (Phase 45), enemy-skill caster path (Phase 49), boss combat resolution (Phase 15 phases). Drives `bootstrap-paradox` against the Coastal Tyrant. | `sage` | `coastal-tyrant` (debug-spawned) | — | Demonstration-grade — combat in progress at script quit OR `combat:ended` (any outcome); the value is exercising the surfaces, not finishing the fight |
| `fishing-village-exploration` | Phase 65 — 25-node fishing-village grid Harbor District sub-area traversal (fv-1 → fv-11 → fv-14 → fv-15) + Phase 60 befriendable encounter trigger at fv-15 (MournfulGull guaranteed via the `fvGullCrag` pool, weight 1). | `apprentice` | `mournful-gull` (organic encounter at fv-15) | — | `quit` reason after 3 heart-defend rounds at the encounter OR `combat:ended` with `outcome === 'friendship'` if the both-defend pattern caps the friendship counter |
| `tier2-skill-chain` | **Phase 81 ship; pivoted from Phase 66 synergy per brief D2.** Tier 2 skill cast in combat with two-effect compound application (`eternal-regress` → `debuff_confusion` + `debuff_slow` on opponent) under the **Phase 80 always-land contract**. Closes one of Phase 78's MED zero-coverage primitives at the player-experience tier. | `wanderer` | `wet-hound` (debug-spawned) | — | `quit` reason or `scriptExhausted`; combat may end via `victory` or continue past the script tail |
| `coastal-tyrant-befriend` | Phase 68 — per-enemy `BefriendabilityConfig` AND-composition (`hpGate: { belowPct: 0.4 } + requiredStances: ['heart'] + roundsThreshold: 5`). 9 consecutive heart-stance defends exercise the `requiredStances` + `roundsThreshold` axes; `hpGate` is RNG-dependent (per D3 grades on predicate-attempt visibility, not friendship-success). | `sage` | `coastal-tyrant` (debug-spawned) | — | `quit` / `scriptExhausted` / `combat:ended` (any outcome); the value is exercising the predicate path |
| `codex-unlock` | Phase 82 CLI Codex tab + Phase 73 codex-unlock-on-friendship path. Apprentice → fv-11 → fv-14 → fv-15 (MournfulGull guaranteed encounter) → 5 heart-defends to attempt friendship → Codex tab. Grades on either friendship-fires-and-codex-renders OR script-exhausted-with-empty-codex (per Phase 82 D3). | `apprentice` | `mournful-gull` (organic encounter at fv-15) | — | `quit` reason after the Codex tab render; combat may have ended via friendship OR continued past script tail |
| `synergy-skills-chain` | **Phase 120 ship.** Phase 66 Tier 2 synergy skill (`resonance-burst`) casting with predicate match. Extended Wanderer preset (now includes synergy skills) → debug-spawn Wet Hound → cast `eternal-regress` (applies `debuff_confusion`) → cast `resonance-burst` (synergizes with confusion). Closes the deferred Phase 81 Unit 2 synergy walkthrough coverage. | `wanderer` | `wet-hound` (debug-spawned) | — | `quit` reason or `scriptExhausted`; `synergy-fired` event must appear in the `resonance-burst` cast round |

**Phase 165 — new combat CLI walkthroughs** are hermetic in-process e2e tests (`src/CLI/e2e/combat.cli.engine.test.ts`) rather than agent-e2e JSON walkthroughs, because the new combat CLI's `--auto` mode drives state without scripted answers. Run them with `npm test` or `npx vitest run src/CLI/e2e/combat.cli.engine.test.ts`.

## Conventions

- **Hermetic.** The harness seeds the RNG; replays are deterministic.
- **Pre-allocated saves.** Scripts that touch the Save / Load tabs
  must declare `--save-file <path>` in their goal file. The harness
  allocates the path and cleans up after the run.
- **No interactive prompts that aren't pre-answered.** Every prompt the
  CLI fires must have a matching line in the JSON script — otherwise
  the run exits with `reason: 'error'`.
- **`reason: 'scriptExhausted'`** is a valid exit only when the script
  intentionally drains every step; `reason: 'quit'` is the standard
  golden-path exit.

When adding a new walkthrough: drop in the `<name>.json` script + the
`<name>.goal.md` goal file, add a row to the table above, and run
`node automation/agent-e2e.mjs <name>` until the grader reports pass.
