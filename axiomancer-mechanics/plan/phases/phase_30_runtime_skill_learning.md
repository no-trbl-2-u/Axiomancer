# Phase 30 — Runtime skill learning

> Brief for `/ship-a-phase`. All decisions pre-resolved.
> DO NOT ASK the user during implementation — decide and ship.

## Outcome

A level-up in the CLI surfaces a "you can now learn N new skills" line;
the player can visit the Character tab to commit one or more learns
against the eligible subset of `skillLibrary`. Each learn dispatches
through a typed action, autosaves, and produces a state-log record.
`getAvailableSkills(character)` and the underlying
`learnSkill(character, skillId)` engine helper close Spec 06 Q7's
runtime gap (skills were preset-only at character build before).

Units 1 and 2 already shipped (1e14a8e, 6097001). Unit 3 — the
Character-tab Learn prompt plus a hermetic walkthrough — is the
remaining work.

## Source spec

`specs/06-character-progression.md` Q7. After the Phase 28 backfill
(75f250b) the answer read "deferred — there is no `learnSkill`
function"; Phase 30 reverses that.

Resolved questions:

1. **Where does the learning gate live?**
   `meetsLearningRequirement(character, skill)` in
   `src/Skills/skill.engine.ts` (added at 1e14a8e). Falls back to a
   tier-derived level minimum (T1=1, T2=5, T3=10) when a skill has
   no explicit `learningRequirement`. Author-supplied requirements
   override.

2. **Does learning consume a resource?**
   No. Pure assertion of the requirement → append to `knownSkills`.
   Future content can layer a currency cost or a once-per-level cap
   on top via a phase rewrite; out of scope here.

3. **Does learning auto-equip?**
   No. `knownSkills` and `equippedSkills` stay distinct (Spec 04b
   established the split — knowledge is unbounded, equip is capped
   at 4). A player who learns a skill then visits combat sees it in
   the Known list but must explicitly equip via a future surface
   (not in scope; the existing skill picker in combat only reads
   `equippedSkills`).

4. **What event topic fires on learn?**
   None — the existing 10 GameEventType topics are the locked
   surface per Spec 12 Q6. The autosave + state-log record carries
   the diff. A future `character:skill-learned` topic can land if a
   UI consumer needs it; today the CLI is the only consumer.

5. **Does the Character tab block on a learn?**
   No. Matches Phase 29's deferred-allocation model: a `rawlist`
   prompt appears at the bottom of the Character tab only when
   `getAvailableSkills(player).length > 0`, with a "leave them
   unlearned" exit. The walkthrough harness can script through
   it without modal trickery.

6. **How are the unlocks surfaced after a level-up?**
   The `character:levelup` event payload carries `unlockedSkills:
   string[]` (Phase 30 unit 2 at 6097001). The CLI subscribes to
   that topic in `bootstrapStore` and logs "You can now learn N
   new skill(s): <ids>" via `log` when the array is non-empty.

## Implementation units (commit per unit)

### Unit 1 — `getAvailableSkills` + `learnSkill` (engine) — SHIPPED at 1e14a8e

For reference only; no work to redo:
- Added `meetsLearningRequirement`, `getAvailableSkills`, `learnSkill`
  to `src/Skills/skill.engine.ts`.
- Surfaced all three on both `src/Skills/index.ts` and `src/index.ts`.
- 11 hermetic cases in `src/Skills/e2e/learning.engine.test.ts`.

### Unit 2 — Level-up unlock surfacing (event payload) — SHIPPED at 6097001

For reference only:
- Extended `EnginePayload` with `unlockedSkills?: string[]`.
- Added `enrichExtra` in `src/Game/store.ts` to compute the diff
  between `getAvailableSkills(prev)` and `getAvailableSkills(next)`
  when LEVEL_UP changes the level.
- CLI subscribes to `character:levelup` in `bootstrapStore` and
  prints the unlock line when the payload's `unlockedSkills` is
  non-empty.
- 4 hermetic cases in
  `src/Game/e2e/levelup-unlocks.engine.test.ts`.

### Unit 3 — CLI Learn prompt + walkthrough

Files:
- `src/Game/actions.types.ts`
- `src/Game/game.reducer.ts`
- `src/Game/store.ts`
- `src/CLI/game.cli.ts`
- `src/Character/e2e/character.engine.test.ts` (optional extension)
- `automation/scripts/walkthroughs/skill-learning.json` (new)
- `automation/scripts/walkthroughs/skill-learning.goal.md` (new)

Changes:

1. **Action** — add to `GameAction` union:
   ```ts
   | { type: 'LEARN_SKILL'; payload: { skillId: string } }
   ```

2. **Reducer** — dispatch through `learnSkill`:
   ```ts
   case 'LEARN_SKILL': {
       return { ...state, player: learnSkill(state.player, action.payload.skillId) };
   }
   ```
   Import `learnSkill` from `'../Skills'` next to the existing
   `allocateStatPoint` import.

3. **Store action** — extend `GameActions`:
   ```ts
   learnSkill: (skillId: string) => void;
   ```
   Implementation:
   ```ts
   learnSkill(skillId) {
       dispatch({ type: 'LEARN_SKILL', payload: { skillId } });
   }
   ```

4. **CLI prompt** — at the bottom of `characterTab`, after the
   Allocate loop, mirror the Allocate shape:
   ```ts
   let available = getAvailableSkills(store.getState().player);
   while (available.length > 0) {
       const choices = available.map(s => ({
           name: `${s.name}  (tier ${s.tier}, ${s.category})  — ${s.description.slice(0, 60)}…`,
           value: s.id,
       }));
       choices.push({ name: 'leave them unlearned', value: 'skip' });
       const { skillId } = await prompt<{ skillId: string }>([{
           type: 'rawlist', name: 'skillId',
           message: `Learn a skill? (${available.length} available)`,
           choices,
       }]);
       if (skillId === 'skip') break;
       const before = store.getState();
       store.getState().learnSkill(skillId);
       logState('learnSkill', before, store.getState(), { skillId });
       log(`Learned ${skillId}.`);
       available = getAvailableSkills(store.getState().player);
   }
   ```
   Import `getAvailableSkills` from `'../Skills'` at the top of the
   file (next to `getSkillById`).

5. **Walkthrough** — pick the Apprentice preset (level 1, knows only
   the 6 T1 skills). Use the debug tab to enter a low-HP fight
   (sandbag) — but that won't produce a level-up. Instead, prefer
   a sage-vs-coastal-tyrant scenario like the existing stat-
   allocation walkthrough: after the boss kill, the level cascade
   from 15 → 16 should not change the eligible set (sage already
   knows everything T1-T3). To make the walkthrough non-trivial,
   use the Wanderer preset (level 8, knows T1 + T2 = 9 of 12
   skills). After a coastal-tyrant kill, wanderer should level
   from 8 → 9 — still below T3's level 10 gate, so unlockedSkills
   stays empty for the level event. We need a stronger XP yield.

   **Decision:** the walkthrough boots Wanderer, debug-spawns
   Disagreement (level 8 boss, `level × DEFAULT_XP_BY_DIFFICULTY
   [boss]` = 8 × 200 = 1600 XP). Wanderer starts at 7000/8000 XP;
   after kill 8400, level → 9, threshold 9000; 8400 < 9000 stops.
   Still no T3 unlock. **Stronger:** boot Wanderer at level 9
   manually via a preset override is not in scope. Cleanest
   alternative: have the walkthrough script the player learning a
   skill that's already eligible (no level-up needed) — Wanderer
   level 8 unlocks T1 + T2 (9 of 12). Apprentice level 1 unlocks
   T1 (6 of 12) but already knows all 6. **Final decision:**
   use Wanderer — they qualify for T1+T2 but only learned T1+T2
   per preset (so `getAvailableSkills` returns empty unless we
   strip something from their `knownSkills`).

   **Walkthrough seed:** add a `knownSkills` override in the
   walkthrough by not using the preset directly — but that's a
   bigger CLI change. **Alternative final:** use the Apprentice
   preset (level 1, knows 6 T1 skills only). Get one level-up
   via a debug-spawn fight; after the level-up, the apprentice is
   level 2 — still all T1 known, no T2 unlock yet (T2 needs level
   5). So nothing learnable at level 2. We need to demonstrate
   the prompt at a level where it actually fires.

   **The cleanest reliable scenario:** Wanderer (level 8 already)
   visits the Character tab without a level-up. The walkthrough
   uses a fixture that strips a known skill from Wanderer's
   `knownSkills` so something is learnable. But the preset is
   immutable.

   **Pragmatic resolution:** skip the level-up demonstration in
   this walkthrough. The Character-tab prompt is the surface
   under test. The wanderer's `knownSkills` includes T1 + T2
   (9 of 12). The player just won't see the prompt because every
   eligible skill is already known. To force the prompt to fire,
   use the **Sage preset** as the boot character and override
   the script to first allocate enough stat points to qualify
   for nothing additional — Sage already knows all 12.

   **Final final decision:** make the walkthrough Wanderer-based
   and accept that **no skill will be learnable** when the
   Character tab opens. The walkthrough's pass condition is
   simpler: the prompt loop is correctly *skipped* (no prompt
   fires when `getAvailableSkills` returns empty), and the CLI
   doesn't error. This still verifies the surface boots cleanly.
   For end-to-end coverage of the learn flow itself, a future
   walkthrough can use a custom preset (out of scope here).

   **Plan B (only if Plan A is unsatisfying):** add a debug-only
   CLI flag `--strip-skill <id>` that removes a skill from the
   booted player's `knownSkills`. Out of scope for unit 3 but
   noted as a follow-up.

   Walkthrough JSON shape:
   ```json
   [
     { "presetId": "wanderer" },
     { "tab": "character" },
     { "tab": "quit" }
   ]
   ```
   Goal: no `learnSkill` record fires (empty `getAvailableSkills`
   for a fully-saturated wanderer); the Character tab opens and
   closes cleanly; `cli:exit reason='quit'` fires.

6. **Tests** — hermetic e2e for the LEARN_SKILL action path:
   - Already-known: no-op.
   - Eligible: appends.
   - Not eligible (below level requirement): no-op.
   Add to `src/Character/e2e/character.engine.test.ts` next to the
   existing `allocateStatPoint` cases, OR a new
   `src/Game/e2e/learn-skill.engine.test.ts`. The cleaner placement
   is the new file since `LEARN_SKILL` is a Game-level action.

## Decisions made upfront — DO NOT ASK

1. **No `character:skill-learned` event topic.** The 10-topic Phase 12
   contract stays locked; future UI consumers can subscribe to a state
   diff if needed.
2. **No auto-equip on learn.** Known and equipped stay distinct.
3. **No learning currency / cap.** Pure assertion of the requirement.
4. **Character tab loops while there are eligible learns.** Same
   deferred-allocation pattern as Phase 29.
5. **Walkthrough exercises the "no eligible skills" branch.** Forcing
   the prompt to fire requires either a preset override or a
   debug-only CLI flag; both are out of scope. The walkthrough's
   value is verifying the surface boots cleanly without errors.

## Verify gate

```bash
npm run verify   # type-check + lint + tests + build
```

Expected: 445 → ~448 tests (3 new for LEARN_SKILL action path).
Type-check, build, lint all green. The new walkthrough doesn't run
through vitest — it's exercised by `automation/agent-e2e.mjs`.

## Commit body template

```
feat(skills): Phase 30 unit 3 — Character-tab Learn prompt + walkthrough

- src/Game/actions.types.ts: add LEARN_SKILL action with
  { skillId: string } payload.
- src/Game/game.reducer.ts: dispatch through `learnSkill` from
  `'../Skills'`.
- src/Game/store.ts: add `learnSkill(skillId)` to GameActions and
  the store factory. Autosaves via the same dispatch path.
- src/CLI/game.cli.ts: extend `characterTab` with a Learn prompt loop
  after the Allocate loop. Visible only when
  `getAvailableSkills(player).length > 0`; offers each eligible
  skill plus a "leave them unlearned" exit.
- src/Game/e2e/learn-skill.engine.test.ts: 3 hermetic cases —
  already-known no-op, eligible learn appends, blocked-by-requirement
  no-op.
- automation/scripts/walkthroughs/skill-learning.{json,goal.md}:
  Wanderer (level 8, fully T1+T2 saturated) opens the Character
  tab, prompt is correctly skipped, exits via quit.

Decisions:
- No new event topic for skill-learned (Spec 12 Q6 locks the 10
  topics). State-log + autosave carry the diff.
- Walkthrough exercises the empty-eligibility branch. Forcing the
  prompt to fire requires a preset override or debug flag; out of
  scope here.

Closes #<phase-issue> (if mirrored).
```

## Definition of Done

- [ ] `LEARN_SKILL` action listed in `GameAction` and routed through
      `gameReducer`.
- [ ] `store.learnSkill(skillId)` exists on `GameStore`.
- [ ] `getAvailableSkills(player)` is read at the bottom of
      `characterTab` and skipped cleanly when empty.
- [ ] `automation/scripts/walkthroughs/skill-learning.{json,goal.md}`
      exist and dry-run cleanly (`exit=0`, `cli:exit` reason `quit`).
- [ ] 3 new hermetic cases in
      `src/Game/e2e/learn-skill.engine.test.ts`.
- [ ] 445/445 (or 448/448) tests green.
- [ ] `npm run verify` and `npm pack --dry-run` both clean.

## Follow-ups (out of scope)

- **Debug `--strip-skill <id>` CLI flag** — would let walkthroughs
  exercise the learn-fires branch deterministically. Currently
  requires a preset override, which is heavier than the surface
  warrants.
- **`character:skill-learned` event topic** — only valuable when a
  React Native UI is consuming the package and wants to animate the
  unlock. Defer until that consumer exists.
- **Auto-equip on learn** — would require capping `equippedSkills`
  to 4 inside the reducer. Mechanics question (does the player give
  up a slot automatically?) belongs in a design discussion, not a
  shipping phase.
- **Learning-cost currency** — straightforward layer-on (subtract
  currency in the reducer, no-op when insufficient). Wait for content
  authors to want it.
