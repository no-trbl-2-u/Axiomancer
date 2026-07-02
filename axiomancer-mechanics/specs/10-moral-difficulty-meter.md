# Spec 10 — Moral Choice Difficulty Meter

## Goal

Encode the moral-choice difficulty meter described in `BRAINDUMP.md` into the
engine: a meter shifted by player choices, gates on certain rewards / endings
based on the meter, optional enemy scaling.

**Success state:** `GameState` has a `moralMeter: number`. Choices in events,
quests, dialogue, and combat outcomes can shift it via a single
`shiftMoralMeter(state, delta)` reducer. Gating helpers exist
(`canTakePath(meter, requirement)`). At least one event in the demo content
exercises a moral choice.

## Why now / dependencies

- **Unblocks:** multiple endings, alignment-locked skills, the BRAINDUMP-style
  "escort the child" narrative.
- **Depends on:** Spec 08 (event handlers) for the choices to trigger from.

## Current state

- BRAINDUMP.md describes the design at a high level: moral choices push the
  meter up, immoral push it down. Different endings sit at different meter
  ranges.
- Nothing exists in code.

## Open questions

1. **Meter shape.** Single integer (e.g. -100 to +100), bucketed enum
   (`'compassionate' | 'neutral' | 'ruthless'`), or multi-axis (e.g.
   compassion + cunning + honour)?
   > Your answer: For now, a single integer, but in the future it'll be multi-axis

2. **Tick magnitude.** What's a typical shift? Suggested:
   - Minor choices: ±1.
   - Major choices: ±5.
   - Defining choices: ±10.
   > Your answer: Adopted the minor / major bands; defining ±10 hasn't
   > been authored yet. Shipped deltas across
   > `src/World/Continents/Coastal-Village/maps.ts` fall in the
   > ±1..±5 range (e.g. fv-3 shop: kind tip +5, harsh -5; Old Marrow:
   > offering +2, generous +5, dismissive -4, threat -5). The
   > friendship-win bonus in `src/Game/game.reducer.ts:230` shifts
   > exactly +1. The clamp is hard-coded in `shiftMoralMeter` and
   > `dialogue.runtime.ts:104` at [-100, +100], so a single defining
   > ±10 choice would move the meter by 10% of full range — appropriate
   > for the BRAINDUMP-style "escort the child" climax (Q9). Add a
   > `±10` defining choice when the endgame quest lands.

3. **Visibility.** Is the meter visible to the player, hidden, or
   hinted-at via narrative cues?
   > Your answer: visible

4. **Combat tie-ins.** Does the meter affect combat?
   - (A) No — purely narrative.
   - (B) Yes — it scales enemy difficulty (high meter = harder enemies,
     low meter = easier enemies).
   - (C) Yes — it gates some skills/effects (e.g. only available when
     meter > N).
   > Your answer: A (for now, will have more effects later)

5. **Effect on rewards.** If the player chooses the "evil" path, do
   rewards change (different items, different XP)? Or are reward changes
   purely narrative (ending text)?
   > Your answer: Evil = more XP and more items

6. **Friendship + meter.** Spec 03 friendship outcomes — do they shift the
   meter? Suggested: friendship win = +1 to compassion-flavoured meter.
   > Your answer: Yes

7. **Persistence across save.** Meter saves with state (assumed yes, but
   confirm).
   > Your answer: Yes

8. **Endings.** How are endings selected at the end of the game?
   - (A) Pure meter thresholds.
   - (B) Combination of meter + specific story flags.
   - (C) Specific story flags only; meter is colour, not gating.
   > Your answer: C (as the meter will effect available stories as well)

9. **The "child escort" example.** BRAINDUMP describes an escort quest
   where one ending requires forgiving the murderer. Is this meant to be
   a tutorial example for the system or actual game content? If actual,
   place it in the world map.
   > Your answer: Yes, this will be in the endgame. Don't worry about it now.

## Proposed approach

1. **Add `GameState.moralMeter`** with shape per Q1.
2. **`shiftMoralMeter(state, delta): GameState`** + selectors.
3. **Gating helpers** — `canTakePath(meter, requirement)`,
   `meetsAlignment(meter, range)`.
4. **Wire into events / quests** — a `MapEvent` choice carries an optional
   `moralDelta`; `processNode` (Spec 08) applies it.
5. **Combat tie-in** per Q4.
6. **Reward gating** per Q5.
7. **Friendship hook** per Q6.
8. **Save/load** — already covered if Q7 is yes.
9. **Sample event** — the child escort scenario (or another story-flag
   driven choice) as a demo.

## Acceptance checklist

- [x] All 9 questions answered. — Spec 10 (pre-loop).
- [x] `moralMeter` persists across save/load. — Phase 10 `a6085c4`
      shipped `moralMeter: number` on `GameState`
      (`src/Game/types.d.ts:40`); Phase 11 `a6b33f0` pinned save/load
      round-trip in `src/Game/e2e/game.loop.engine.test.ts` ("new
      game → combat → victory → level up → move → save → load
      round-trips identically"). Pinned by
      `src/Game/e2e/moral.meter.engine.test.ts`. Phase 72 D13
      (`013c0af`) further pins `moralMeter` as character-ledger state:
      `store.resetRun({ keepCharacter: true })` preserves the meter
      across run resets (alongside `philosophicalAlignment` +
      `rngState` + the Phase 73 `codex` slice). `keepCharacter: false`
      resets to 0 with the rest of the new-game baseline.
- [x] Sample event in the demo content shifts the meter; choosing
      differently gives a different outcome. — Spec 10 (pre-loop)
      shipped `shiftMoralMeter` (`src/Game/game.reducer.ts:108`); the
      friendship-counter exit (Phase 10 + 36) shifts +1 on befriend,
      0 on the alternative path. Pinned by
      `src/Game/e2e/moral.meter.engine.test.ts`.
- [x] `BRAINDUMP.md`'s "Difficulty System" section graduates into a
      section of `docs/world.md` (or a new `docs/morality.md`). —
      Shipped as `docs/morality.md` (pre-loop); cross-linked from
      `docs/combat.md` Friendship Path (Phase 36 / iterate
      `7306111`).
- [x] Moral meter affects combat difficulty through enemy stat scaling. —
      Phase 92 implements the originally-intended scaling behavior from
      the BRAINDUMP, resolving the Q4 "A (for now)" deferral.
      `applyMoralMeterScaling` in `src/Combat/difficulty.ts` scales
      enemy `baseStats` by 0.5x–2.0x based on moral meter (-100 to +100).
      Applied in `START_COMBAT` via `src/Game/game.reducer.ts` before
      `initializeCombat`. Tested in `src/Combat/e2e/difficulty.scaling.engine.test.ts`.

## Out of scope

- Multi-axis morality with sliders for "honour", "cunning", etc. — only
  pursue if Q1 picks the multi-axis option.
- Per-NPC reputation systems.
