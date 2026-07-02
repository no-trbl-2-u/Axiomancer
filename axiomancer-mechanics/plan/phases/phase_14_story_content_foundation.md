# Phase 14 — Story content foundation

> Brief for `/ship-a-phase`. All decisions pre-resolved.
> DO NOT ASK the user during implementation — decide and ship.

## Outcome

The first named NPC ("Old Marrow") gets a fully-fleshed moral dialogue
tree whose choices shift the Phase-10 moral meter directly. The shift
path stops piggy-backing on flag-name string-matching and becomes a
first-class `moralDelta` field on `DialogueChoice.effect`. Existing
content (Hollow-Eyed Beggar) migrates onto the new field; the hard-coded
`MORAL_FLAG_EFFECTS` lookup table is retired. Hermetic e2e proves a
choice picked through `applyDialogueChoice` mutates `state.moralMeter`
without going through any flag intermediary.

## Source spec

No dedicated `specs/14-*.md` yet (story arc is tracked in
`src/Story/story-overview.md` and `specs/story/`). Source intent:

- `plan/steps/01_build_plan.md` Phase 14 row — "First named NPC with a
  moral dialogue tree. Implement `NPC` entity with branching dialogue
  that affects the moral/difficulty meter. Tie into `processNode`
  dialogue flow. See `specs/story/` for content direction."
- `src/Story/story-overview.md` — Old Marrow lives in the Fishing
  Village (`fv-2`), is referenced in `src/Game/spec08.e2e.test.ts`, and
  is the player's first quest-giver. Promoting him to "demo NPC" for
  the moral integration aligns with that placement.
- `specs/10-moral-difficulty-meter.md` — moral shifts happen via
  `SHIFT_MORAL_METER` actions; reducer clamps to `[-100, +100]`.

Resolved questions:

1. **Which NPC carries the demo?** Old Marrow. He's already on `fv-2`,
   already named, already wired into `spec08.e2e.test.ts`, and is
   thematically the first villager the Boy interacts with. The
   Hollow-Eyed Beggar already has a moral tree but exists primarily as
   the Spec 10 demonstration — Phase 14 is about the **canonical**
   first story NPC, which means Old Marrow.
2. **Direct `moralDelta` field vs. keep flag-name lookup?** Direct
   field on `DialogueChoice.effect`. Reason: the
   `MORAL_FLAG_EFFECTS` lookup table doesn't scale (every new NPC
   would have to register a unique flag name and a separate map
   entry), violates locality (the moral cost of a choice should live
   on the choice, not in a global table), and obscures intent in the
   dialogue file. Direct field is what every other effect already
   does (`startQuest`, `grantCurrency`, `teachSkill`).
3. **Back-compat for the Beggar?** Migrate, don't preserve. The
   Beggar tree currently sets flags like `'beggar_generous_gift'`
   purely so `MORAL_FLAG_EFFECTS` can read them; the flags have no
   other in-game use (grep confirmed: zero readers outside
   `dialogue.runtime.ts`). Replacing them with direct `moralDelta`
   values removes dead state. The `setFlag` mechanism stays for
   choices that actually gate downstream content.
4. **Clamping rules.** Already in place: `applyDialogueChoice`
   clamps to `[-100, +100]`. New code reuses that same clamp.
5. **Old Marrow's moral choices.** Three additions, threaded through
   the existing tree, no break to the quest path:
   - On `offer` ("Maybe later"): now `helpfulRefuse` → +2 moral
     (declining work politely costs nothing socially but reads as
     considerate).
   - On `thanks` ("Take only half — your need is greater"):
     +5 moral, halves the currency grant (12 instead of 25).
   - On `thanks` ("Demand more — this killed me to do"):
     -4 moral, currency unchanged (25). Adds a flag
     `marrow_pressed` so future NPCs can react.
6. **Should the moralDelta apply event-style or reducer-style?**
   In-line inside `applyDialogueChoice`, same as the other effects.
   Do NOT mint a separate `SHIFT_MORAL_METER` dispatch from inside
   the runtime — it's already mid-transaction with the GameState.
7. **Documentation.** Update `docs/npcs.md` (new field on
   `DialogueChoice.effect`) and `docs/story.md` (introduce Old
   Marrow as the canonical first NPC). Do NOT create `docs/moral.md`
   — that file's scope sits in Spec 10's documentation.

## Implementation units (commit per unit)

### Unit 1 — Add `moralDelta` to `DialogueChoice.effect`

Files: `src/NPCs/types.d.ts`

```diff
 export interface DialogueChoice {
     ...
     effect?: {
         startQuest?: QuestName;
         progressQuest?: { name: QuestName; objectiveId: string; amount?: number };
         completeQuest?: QuestName;
         teachSkill?: string;
         setFlag?: string;
         grantCurrency?: number;
+        /**
+         * Direct moral-meter shift applied by `applyDialogueChoice`.
+         * Clamped to [-100, +100] via `gameState.moralMeter`. Positive
+         * values are "more virtuous"; negative "more pragmatic / cruel".
+         */
+        moralDelta?: number;
     };
 }
```

Commit: `feat(npcs): add moralDelta to DialogueChoice.effect`

### Unit 2 — Wire `moralDelta` through `applyDialogueChoice`; retire flag lookup

File: `src/World/dialogue.runtime.ts`

Edits:
1. Delete the `MORAL_FLAG_EFFECTS` constant entirely.
2. Inside the `if (e) { ... }` block, after the existing effect
   handlers, add:
   ```ts
   if (typeof e.moralDelta === 'number' && e.moralDelta !== 0) {
       const delta = e.moralDelta;
       moralMeter = Math.max(-100, Math.min(100, moralMeter + delta));
       effects.moralShift = (effects.moralShift ?? 0) + delta;
   }
   ```
3. Delete the standalone post-effect block that reads
   `MORAL_FLAG_EFFECTS[effects.setFlag]`. Move the `let moralMeter`
   declaration up beside `let player` / `let quests` so the new
   branch can mutate it directly.

Commit: `refactor(dialogue): drive moral shifts off DialogueChoice.effect.moralDelta`

### Unit 3 — Migrate Beggar tree to direct `moralDelta`

File: `src/World/Continents/Coastal-Village/maps.ts`

Within `beggarTree`, replace every `effect: { setFlag: 'beggar_*' }`
with the matching delta direct on `moralDelta`. Drop the flag setting
entirely — confirmed it has no readers anywhere else in the codebase
(grep: `setFlag.*beggar_` only hits this file; `flags.includes` /
`gameState.flags.has` calls in src/ never reference `beggar_*`).

Existing mapping (from `MORAL_FLAG_EFFECTS`):
- `beggar_generous_gift` → `+5`
- `beggar_small_gift`    → `+1`
- `beggar_kind_gesture`  → `+3`
- `beggar_dismissed`     → `-1`
- `beggar_harsh_words`   → `-5`

Verify `src/Game/e2e/moral.meter.engine.test.ts` still passes —
the test asserts on `state.moralMeter` shifts, which remain numerically
identical post-migration; the difference is purely how they flow.

Commit: `refactor(npcs): migrate beggar tree to direct moralDelta`

### Unit 4 — Author Old Marrow's moral choices

File: `src/World/Continents/Coastal-Village/maps.ts`

Edit `oldDockmasterTree`:
- `offer.choices[1]` (currently "Maybe later"): rename to "I've got
  my own dead to bury — maybe later.", set
  `effect: { moralDelta: 2 }`. Leaves `nextNodeId` undefined.
- `thanks.choices`: replace the single "Accept the reward." entry
  with three:
  - "Take it — coin keeps a man fed."
    `nextNodeId: undefined`, `requires: { questCompleted: 'starting-quest' }`,
    `effect: { grantCurrency: 25 }`
  - "Take only half — your need is greater than mine."
    `nextNodeId: undefined`, `requires: { questCompleted: 'starting-quest' }`,
    `effect: { grantCurrency: 12, moralDelta: 5 }`
  - "This nearly killed me. Pay double or keep it."
    `nextNodeId: undefined`, `requires: { questCompleted: 'starting-quest' }`,
    `effect: { grantCurrency: 25, moralDelta: -4, setFlag: 'marrow_pressed' }`

Voice note: Old Marrow is laconic, weather-worn, no exclamation
points. New player-facing choices should sound like a thirteen-year-
old in a village — direct, slightly uncertain — not literary.

Commit: `feat(story): give Old Marrow moral choices on quest reward`

### Unit 5 — Hermetic e2e for Old Marrow's moral integration

File: `src/Game/e2e/oldmarrow.engine.test.ts` (new — lives under Game
rather than NPCs because it drives through `store.getState()` +
`applyDialogueChoice` end-to-end, matching the Beggar test's location).

Test cases:
1. **Refusing politely shifts +2.** Bootstrap the game store, move
   the player to `fv-2`, run `processNode`, walk into
   `oldDockmasterTree.greet → offer → helpfulRefuse`, apply, assert
   `state.moralMeter === 2`.
2. **Taking the modest half-share shifts +5 and grants 12 coin.**
   Bootstrap with `quests.completed = ['starting-quest']` so the
   `thanks` node's gated choices show; apply the half-share choice;
   assert `state.moralMeter === 5` AND `state.player.currency` was
   credited 12.
3. **Demanding double shifts -4 and sets `marrow_pressed`.**
   Same setup; pick the demanding choice; assert `state.moralMeter ===
   -4`, `state.flags.includes('marrow_pressed')`, currency credited 25.

Use `mockSequentialRng` if any RNG is touched (it shouldn't be in
this flow). Stub the persistence adapter with `nullAdapter`.

Commit: `test(game): hermetic e2e — Old Marrow moral dialogue tree`

### Unit 6 — Documentation refresh

Files: `docs/npcs.md`, `docs/story.md`

- `docs/npcs.md`: add `moralDelta` to the `DialogueChoice.effect`
  field table; remove any reference to the retired
  `MORAL_FLAG_EFFECTS` table; refresh the "moral integration" section
  to point at `applyDialogueChoice` as the single shift path.
- `docs/story.md`: introduce Old Marrow under Characters; one
  paragraph on his role as the first quest-giver and the moral
  branch on his reward dialogue. Cross-link to
  `src/Story/story-overview.md` for the longer arc.

Commit: `docs(npcs, story): document moralDelta path and Old Marrow`

## Decisions made upfront — DO NOT ASK

- Old Marrow is the demo NPC, not a new character. Reason in §Q1.
- Moral shifts route through a direct `moralDelta` field, not flag
  names. Reason in §Q2.
- Beggar tree migrates; the flag-name detour is deleted, not
  preserved for "back-compat". Reason in §Q3.
- `applyDialogueChoice` keeps its single-pass transactional shape —
  the moral shift happens in-line, not via a re-dispatch through the
  reducer. Reason in §Q6.
- No new `docs/moral.md`. Reason in §Q7.
- All dialogue voice stays terse and unornamented. Old Marrow does
  not deliver speeches. Choices read as a thirteen-year-old's voice.
- The new e2e test lives under `src/Game/e2e/` per the moral.meter
  test's precedent. (Phase 16 will later migrate sibling tests; this
  one is already in the right shape.)

## Verify gate

```bash
npm run verify          # type-check + lint + test + build all green
npm run deploy:check    # publishable
```

The pre-existing 4 `no-explicit-any` warnings in
`events.engine.test.ts` are tracked by critique-2 LOW and remain
out-of-scope.

## Commit body template (if units coalesce)

```
feat(story): phase 14 — Old Marrow gets moral dialogue tree; retire flag-lookup hack

- Add DialogueChoice.effect.moralDelta direct shift field
- Drive applyDialogueChoice off the new field; delete MORAL_FLAG_EFFECTS
- Migrate Hollow-Eyed Beggar tree onto moralDelta (no behavior change)
- Author Old Marrow's reward branch with three moral choices
- Hermetic e2e covering all three Old Marrow moral paths
- Refresh docs/npcs.md and docs/story.md

Decisions:
- Old Marrow chosen over a brand-new NPC because he's already wired
  into Phase 9's demo flow (spec08.e2e.test) and is the canonical
  first quest-giver per story-overview.
- moralDelta is a first-class field, not a string-flag lookup —
  scales to any future NPC without touching dialogue.runtime.ts.

Closes #<phase issue>
```

## Definition of Done

- [ ] `DialogueChoice.effect.moralDelta?: number` exists in `src/NPCs/types.d.ts`
- [ ] `applyDialogueChoice` applies `moralDelta` and clamps `[-100, +100]`
- [ ] `MORAL_FLAG_EFFECTS` constant deleted from `dialogue.runtime.ts`
- [ ] Beggar tree migrated; no `beggar_*` flag names remain
- [ ] Old Marrow tree has three moral choices (refuse / half / demand)
- [ ] `src/Game/e2e/oldmarrow.engine.test.ts` covers all three paths
- [ ] `moral.meter.engine.test.ts` still passes unchanged
- [ ] `docs/npcs.md` lists `moralDelta` in the effect field table
- [ ] `docs/story.md` introduces Old Marrow
- [ ] `plan/steps/01_build_plan.md` Phase 14 row flipped to `[x]` with hash
- [ ] `npm run verify` and `npm run deploy:check` both green

## Follow-ups (out of scope)

- A `specs/14-story-content-foundation.md` formal spec — would
  retroactively document this phase. Defer to an iterate tick once
  Phase 14 has shipped, so the spec describes what landed rather than
  what was planned.
- A second moral NPC (the Father, per story-overview) — left for a
  later phase once the new field has proven itself across Old Marrow
  and the Beggar.
- Migrating `moralShift` accumulation when multiple effects in one
  choice fire (currently `effects.moralShift` is a single number; the
  Unit 2 code uses `+=` so it accumulates, but no choice today fires
  multiple moralDeltas — capability without a caller).
