# Spec 06 — Character Progression

> Historical implementation spec. Skill progression now treats learned/unlocked
> skills (`knownSkills`) as the canonical access model; the legacy
> `equippedSkills` gate was deprecated in Phase 99 and the field removed
> entirely in Phase 159 (see ADR-0002).

## Goal

Earn XP from combat, level up, allocate stat points, and learn skills. The
existing `experience` / `experienceToNextLevel` fields plus `EXPERIENCE_PER_LEVEL`
constant are wired to character creation but no XP is ever granted at
runtime.

**Success state:** Defeating an enemy in the CLI grants XP. Hitting the
threshold prompts a level-up flow that increments `level`, restores HP/MP to
new max values, grants stat points to allocate, and offers eligible skills
to learn.

## Why now / dependencies

- **Unblocks:** longer-term progression in the CLI, Spec 08 (quest XP rewards).
- **Depends on:** Spec 04 for skill learning to be meaningful. Can land
  before Spec 04 by stubbing the skill-learning step.

## Current state

- `createCharacter` initialises `experience` and `experienceToNextLevel`.
- No `levelUp`, `grantExperience`, `allocateStatPoint` functions exist.
- `Character` has no `availableStatPoints`, `knownSkills`, or
  `equippedSkills`.
- The combat CLI never references the player's XP after combat ends.
- Character CLI exists but is a builder, not a progression UI.

## Open questions

1. **XP curve.** Linear `level × 1000` (current default) is forgiving;
   exponential is grindy. Pick:
   - (A) Linear — `level × EXPERIENCE_PER_LEVEL`.
   - (B) Quadratic — `level² × C`.
   - (C) Polynomial — `C × level^1.5`.
   - (D) Hand-tuned table.
   > Your answer: (A) Linear. `src/Game/game-mechanics.constants.ts` ships
   > `EXPERIENCE_PER_LEVEL = 1000`, and both `createCharacter` in
   > `src/Character/index.ts` and `applyLevelUps` in
   > `src/Game/game.reducer.ts` set `experienceToNextLevel = level *
   > EXPERIENCE_PER_LEVEL`. No exponent, no table. Re-tune to (B) or (C)
   > later by adjusting the threshold formula in one place
   > (`game.reducer.ts:91`).

2. **XP rewards per enemy.** A function of:
   - Enemy `level`.
   - `difficulty` (`simple`/`normal`/`elite`/`boss`/`unique`).
   - Encounter outcome (combat win, friendship win, flee).
   What's the formula? Suggested default: `level × difficultyMultiplier`,
   where simple=10, normal=20, elite=50, boss=200, unique=500. Friendship
   wins grant 50% XP.
   > Your answer: Adopted verbatim. `DEFAULT_XP_BY_DIFFICULTY` in
   > `src/Enemy/index.ts` is exactly
   > `{ simple: 10, normal: 20, elite: 50, boss: 200, unique: 500 }`, and
   > `createEnemy` falls back to `level × DEFAULT_XP_BY_DIFFICULTY[difficulty]`
   > when an enemy author doesn't override `xpReward`. The friendship-win
   > 50% bonus shipped at Phase 36: `CombatEndReport.outcome` gained a
   > `'friendship'` value, `store.endCombat()` detects the
   > friendship-counter cap and grants `floor(totalEncounterXp * 0.5)` XP
   > + full loot table. The reducer side (Phase 10) was already
   > friendship-aware; the store-side mismatch is what Phase 36 closed.

3. **Stat points per level.** How many? Cap per stat? Default proposal:
   - 3 stat points per level.
   - No cap until level cap (TBD per Q5).
   > Your answer: Adopted — 3 points per level, no cap. Shipped at
   > Phase 29 (`9f2e3f6` + `121aea8` + `db7c26f`). `Character` now
   > carries `availableStatPoints: number` (`src/Character/types.d.ts`),
   > `applyLevelUps` in `src/Game/game.reducer.ts` grants
   > `STAT_POINTS_PER_LEVEL = 3` on every promotion (from
   > `src/Game/game-mechanics.constants.ts`), and `allocateStatPoint`
   > in `src/Character/index.ts` spends them one at a time. No per-stat
   > cap was added — the level cap (Q5) is doing the work, and the
   > derived-stat multipliers (up to 4×) mean a 3-pt cadence is paced
   > correctly for the linear XP curve.

4. **Resource refill.** On level up, restore HP/MP to new max?
   - (A) Yes, full refill.
   - (B) Add the delta only (so you don't get a "free heal" by leveling).
   - (C) No refill at all.
   > Your answer: (A) Yes, full refill — for HP. `applyLevelUps` in
   > `src/Game/game.reducer.ts:90` sets `health: maxHealth` after
   > recomputing `maxHealth` from the new level. MP is N/A per Spec 01 Q9
   > (mana abstraction was dropped; combat resources don't survive
   > between fights). The free-heal-by-leveling concern is real but the
   > XP curve makes it self-limiting at high level (the next-level
   > threshold scales linearly).

5. **Level cap.** Hard cap (e.g. 20)? Soft (XP curve becomes punishing)?
   None?
   > Your answer: None today. `applyLevelUps` is an uncapped `while`
   > loop (`game.reducer.ts:83`) that keeps incrementing level as long
   > as `experience >= experienceToNextLevel`. The linear curve gives a
   > soft pressure (1000 XP for L2, 15000 cumulative for L15) but there
   > is no hard cap. The Sage preset already ships at level 15 and the
   > existing enemy library tops out at level 8 (Disagreement) — so the
   > effective ceiling under normal play is around L15-L20, set by
   > content rather than code. Add an explicit `MAX_LEVEL` constant when
   > content scales past that band.

6. **Character `id`.** Knowledge-Gap 12: Enemies have `id` but Character
   doesn't. `ActiveEffect.sourceId` references the applier. With one PC,
   is `sourceId` even needed? Decision:
   - (A) Add `Character.id` (uniformity, future multi-char support).
   - (B) Use a constant `'player'` string for `sourceId` from the player.
   - (C) Drop `sourceId` for player-applied effects entirely.
   > Your answer: Deferred — the `Character` interface in
   > `src/Character/types.d.ts` still ships no `id` field, and the
   > project's `plan/PHASE_CANDIDATES.md` still lists "Character.id field
   > for stable identity" as a Pending candidate. Effectively the engine
   > behaves as if (B) is in force without it being a constant —
   > `state.player` is the singleton character and consumers reference
   > it directly. Spec 23's MapEvents + Phase 21's typed events both
   > assume the singleton. Promote (A) when multi-character (party /
   > reincarnation arcs) shows up in scope.

7. **Skill learning gate.** Is "level up" the only way to learn a skill,
   or also via shops / quests / NPCs?
   > Your answer: Level-up driven today, but the runtime gate is
   > general enough to bolt shops / quests / NPCs on later without an
   > engine change. Shipped at Phase 30 (`1e14a8e` engine,
   > `6097001` level-up event payload, `32dc22c` CLI prompt +
   > `LEARN_SKILL` action). `meetsLearningRequirement(character, skill)`,
   > `getAvailableSkills(character)`, and `learnSkill(character,
   > skillId)` live in `src/Skills/skill.engine.ts`; every
   > `learningRequirement` on the skill library (now explicit on all
   > Tier 2 + Tier 3 skills as of Phase 33) is checked at learn time.
   > Level-up surfaces newly-eligible skills via the `unlockedSkills`
   > field on the `character:levelup` event payload (Phase 30 unit 2).
   > Shops / quests / NPCs would invoke the same `learnSkill` reducer
   > with their own gating logic — pure additive.

8. **Allocation timing.** When the player levels up:
   - (A) Stat points and skill picks must be made immediately (blocks the
     game until done).
   - (B) Earned points sit in `availableStatPoints` and can be spent at any
     time via the character CLI.
   > Your answer: (B) Deferred allocation — shipped at Phase 29
   > (`db7c26f`) and Phase 30 (`32dc22c`). `availableStatPoints` sits
   > on the `Character` and `knownSkills` grows on demand; the
   > Character tab in `npm run game` prompts the player to spend
   > points + learn newly-unlocked skills, but the prompts are
   > polled from the tab loop rather than fired as a modal interrupt
   > on level-up. That keeps the loop scriptable (the Phase 26
   > walkthrough harness drives the same actions through CLI input)
   > and lets the player re-spec across multiple level-ups before
   > committing.

9. **Multi-level catch-up.** If a single XP grant pushes through multiple
   level thresholds, do you level up once or repeatedly until XP is below
   the next threshold?
   > Your answer: Cascade — keep levelling until XP is below the next
   > threshold. `applyLevelUps` in `src/Game/game.reducer.ts:81-95` is a
   > `while (next.experience >= next.experienceToNextLevel)` loop that
   > bumps `level`, recomputes `maxHealth`, raises the threshold, and
   > refills HP each iteration. A single boss-kill that grants 500 XP at
   > L1 happily promotes the player from L1 to L2 with one report event,
   > though the CLI only emits one `character:levelup` event per call —
   > something to revisit when stat allocation lands (Q3/Q8).

## Proposed approach

1. **`grantExperience(character, amount): Character`** — adds XP, does not
   auto-level (returns the same character with bumped XP). Per Q9, expose
   `levelsGained(character)` to detect threshold crossings.
2. **`levelUp(character): Character`** — bumps level, re-derives stats per
   Q4, grants stat points per Q3.
3. **`allocateStatPoint(character, stat: 'body'|'mind'|'heart'): Character`**
   — decrements `availableStatPoints`, increments `baseStats`, re-derives
   `derivedStats`.
4. **`Character.availableStatPoints`, `knownSkills`, `equippedSkills`,
   optional `id`** added per Q6.
5. **`getAvailableSkills(character): Skill[]`** — filters the skill library
   by `learningRequirement`.
6. **`learnSkill(character, skillId): Character`** + reducer integration.
7. **Combat reward hook** — after `endCombat`, if the player won, call
   `grantExperience(player, xpReward(enemy, outcome))` and surface the
   result to the CLI.
8. **Character CLI** extended with a "Level up" tab when
   `availableStatPoints > 0` or new skills are unlockable.
9. **Tests** — XP curve, multi-level-up, stat allocation respect caps,
   skill learning gate.

## Acceptance checklist

- [x] All 9 questions answered. — Phase 28 unit 2 (`75f250b`) backfilled
      the original answers; Phase 34 unit 4 (`61a8b94`) refreshed Q3/Q7/Q8
      after Phase 29 + Phase 30 shipped.
- [ ] Defeating Disatree in the CLI grants XP visible after combat. —
      XP grant is wired (`endCombat` in `src/Game/store.ts` adds
      `enemy.xpReward` on victory; Q2 answer in this spec), but a
      walkthrough that surfaces the post-combat XP delta in the CLI
      transcript hasn't been pinned. Leave open for an `/iterate` pass.
- [x] Hitting the XP threshold triggers a level-up flow per Q8. —
      Cascade level-up shipped pre-loop (`applyLevelUps` in
      `src/Game/game.reducer.ts`); the deferred-allocation flow chosen
      in Q8 lives in the Character tab via Phase 29 (`db7c26f`) +
      Phase 30 unit 3 (`32dc22c`).
- [x] Allocating a stat point updates `derivedStats` (verified in CLI
      display). — Phase 29 unit 3 (`db7c26f`) shipped the Character-tab
      prompt loop; `allocateStatPoint` re-derives `derivedStats` /
      `nonCombatStats` / `maxHealth` on every spend.
- [x] `docs/character.md` "Pending" section drained; replaced with the
      new progression API. — Phase 34 unit 2 (`1d6cc13`) trimmed
      Pending to just the `id` field (Knowledge-Gaps Q12) and added a
      Stat allocation section.

## Out of scope

- Multiplayer / multiple PCs.
- Prestige / NG+ — not yet on the roadmap.
- Equipment as level-up reward — handled by Spec 08 (loot drops, shops).
