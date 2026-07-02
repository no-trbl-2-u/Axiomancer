# Spec 07 — Enemy Content & AI

> [DONE on 2026-05-13]

## Goal

A library of at least 15 enemies stretched across difficulty tiers, plus AI
strategies more interesting than `randomLogic`, plus an encounter system that
selects appropriate enemies for the current map node and player level.

**Success state:** `decideEnemyAction` does not always fall through to random.
The library is rich enough that the first continent's content can be filled
without the same enemy appearing twice. `generateEncounter(mapNode, playerLevel)`
returns a sensible enemy.

## Why now / dependencies

- **Unblocks:** Phase 7 (real exploration content), variety in
  `npm run combat`.
- **Depends on:** Spec 03 (proc machinery so enemies can use the same proc
  table), ideally Spec 04 (enemy skill use) — but the library can land first.

## Current state

- One enemy: `Disatree_01`, `random` logic.
- `EnemyLogic` union has 4 members (`random`, `aggressive`, `defensive`,
  `balanced`), but `decideEnemyAction` falls through to random for all.
- `EnemyDifficulty` union (`simple`, `normal`, `elite`, `boss`, `unique`)
  exists; nothing reads it.
- `Enemy.skills?` and `Enemy.loot?` are typed but unused.
- No encounter type or generator.

## Open questions

1. **AI heuristic shape.** For each non-random logic:
   - `aggressive` — what's "aggressive"? Suggested: pick attack 75% of the
     time, prefer the stance that has advantage over the player's last
     stance.
   - `defensive` — defend until HP > 50%, then attack with the stance the
     player is weakest in.
   - `balanced` — switch on HP threshold (attack while >50%, defend below).
   - `bossLogic` — a deterministic phase script (e.g. round 1: stance, round
     2: attack pattern, round 3: signature ability).
   Pick or override.
   > Your answer: For now, yes, this'll work for now

2. **Knowledge of the player.** AI logic functions currently take only the
   `enemy` (and through it, the action only). Should they receive the full
   `CombatState` so they can react to player choices / HP / effects?
   > Your answer: yes

3. **Strategic logic depth.** "Strategic" implies looking at the player's
   active effects and exploiting weaknesses (e.g. cast Body if the player
   has `debuff_vulnerability_body`). Worth doing in this spec, or defer?
   > Your answer: yes

4. **Proc-table parity.** Should enemies use the same Spec 03 proc table by
   default, with optional per-enemy overrides? (Mirrors `tier1Overrides`.)
   > Your answer: For now, yes

5. **Encounter design.** `generateEncounter(mapNode, playerLevel)` returns
   what?
   - (A) Single `Enemy`.
   - (B) `Encounter { enemies: Enemy[], reward: Reward }` to set up future
     multi-enemy fights even if the engine is 1v1 today.
   > Your answer: B

6. **Difficulty scaling.** When the encounter generator picks an enemy:
   - (A) Use the enemy's stored `level` as-is — content authored at fixed
     level.
   - (B) Scale enemy level to ±1 of player level — adaptive.
   - (C) Use difficulty meter (Spec 10) to bias.
   > Your answer: Adaptive, but the offset band varies by encounter
   > difficulty (and is extensible to other factors later, e.g. Spec 10's
   > difficulty meter). Per-difficulty bands:
   >   - `simple`  → playerLevel − 1 … playerLevel
   >   - `normal`  → playerLevel     … playerLevel + 1
   >   - `elite`   → playerLevel + 1 … playerLevel + 2
   >   - `boss`    → playerLevel + 2 … playerLevel + 3
   >   - `unique`  → authored level, no adaptive scaling (signature fights).
   > The band is clamped to ≥ 1 so simple enemies don't drop below level 1
   > when the player is also level 1.

7. **Loot tables.** Each enemy has a fixed `loot?: Item[]`. Or weighted
   drops?
   > Your answer: B (but make it a variable so it can be dynamic)

8. **Library composition.** ≥15 enemies. Suggested split:
   - 3 simple, 6 normal, 3 elite, 2 boss, 1 unique.
   Stat alignment evenly across heart/body/mind. Override?
   > Your answer: Default split (3 simple, 6 normal, 3 elite, 2 boss,
   > 1 unique = 15 total). Stat alignment distributed across heart/body/mind
   > affinities so each tier has at least one of each stance focus where
   > the count allows.

## Proposed approach

1. **`Encounter` type** per Q5; library by area.
2. **AI strategy rewrites** in `enemy.logic.ts` per Q1, Q2 (extend the
   signature if needed).
3. **`strategicLogic`** per Q3 — only if you opt in.
4. **Enemy library expansion** per Q8. Use the Coastal Continent maps as
   the home for the first batch.
5. **Loot tables** per Q7 — either inline `loot: Item[]` or
   `loot: LootTableEntry[]` with weights.
6. **`generateEncounter(mapNode, playerLevel)`** — pulls from the
   per-area encounter library; respects Q6.
7. **Hook into combat** — `store.startCombat(encounter)` accepts an
   encounter or an enemy (back-compat). `endCombat` + Spec 06 grants XP +
   loot.
8. **Tests** — AI choice distribution checks, encounter generator returns
   appropriate enemies, no log-only fallthroughs.

## Acceptance checklist

- [x] All 8 questions answered.
- [x] ≥15 enemies in the library, distributed as agreed (3/6/3/2/1 across
      heart/body/mind affinities).
- [x] `decideEnemyAction` produces visibly different choices for each logic
      tag (verified by `src/Enemy/enemy.logic.test.ts`).
- [x] `generateEncounter` exposed and consumed by the combat CLI via
      `COMBAT_ENCOUNTER=1`; `startCombat` accepts `Enemy | Encounter`.
- [x] `docs/enemy.md` rewritten with the API + library overview.

## Out of scope

- Multi-enemy combat resolution — engine still 1v1.
- Boss phase scripting beyond "deterministic stance pattern" — defer if Q1
  picks the simple boss logic.
- Procedural enemy generation (random stats) — content-author-driven only.

## Post-spec engine extensions

Six post-spec phases extended the `Enemy` shape and the AI pipeline.
All additions are additive optional fields on the `Enemy` interface;
existing consumers continue to work.

### Phase 45 — `Enemy.philosophicalAlignment?` + outlook-driven AI bias

Adds optional `philosophicalAlignment?: PhilosophicalAlignment` to
`Enemy`. When set, `decideEnemyAction` applies an outlook-driven bias
on top of the per-strategy decision: pessimistic enemies sometimes
defend when they would attack; optimistic enemies sometimes attack
when they would defend. Bias fires at `ALIGNMENT_FLIP_CHANCE`
(0.35, colocated in `src/Enemy/enemy.logic.ts`). Legacy enemies without
a pin behave exactly as before. See `docs/enemy.md` § "Alignment-driven
AI tuning".

### Phase 49 — Enemy skill caster path

Promotes `Enemy.skills?: Skill[]` from "typed but unused" (current-state
bullet, line 30) to a live AI branch. `decideEnemyAction` can now
return a `'skill'` action; the resolver routes through the same
`executeSkill` entry point used by the player. Skill choice is keyed
off `philosophicalAspect` matching the chosen stance with a no-skill-
rotation short-circuit when the enemy carries no eligible skills. See
`docs/enemy.md` § "Enemy skill caster path (Phase 49)".

### Phase 57 — Enemy skill rotation content sweep

7 of 16 registry enemies now carry authored `skills: [skill('<id>')]`
entries. Boss-tier (Coastal Tyrant, The Disagreement) + several
elite / normal tiers get one Tier 3 fallacy-as-spell each, picked to
match each enemy's `philosophicalAlignment` cell archetype. Pure
content; no engine change.

### Phase 60 — `Enemy.friendshipReward?` (befriendable-enemy content arc)

Adds optional `friendshipReward?: FriendshipReward` to `Enemy`. When
combat resolves via `outcome === 'friendship'`, `store.endCombat()`
threads per-enemy items / xpBonus / narrative through the report.
Two enemies ship authored content today (MournfulGull +
HollowEyedBeggar). See `docs/enemy.md` § "Befriendable enemies
(Phase 60)" and `specs/05` for the Item type pointer.

### Phase 62 — `FriendshipReward.flagSet?: string`

Extends the Phase 60 `FriendshipReward` shape with an optional
`flagSet?: string` — when present, the END_COMBAT reducer appends the
flag to `state.flags` on the friendship outcome (de-duped). Reuses the
existing `DialogueChoice.requires.flag` machinery; no new gate
primitive. Convention: `befriended-<enemy-id-stem>`. First authored
use: `MournfulGull.friendshipReward.flagSet:
'befriended-mournful-gull'` unlocks a flag-gated branch on the
Coastal Beggar's `greet` node.

### Phase 68 — `Enemy.befriendabilityConfig?: BefriendabilityConfig`

Per-enemy override of the Phase 36 friendship-eligibility predicate.
When absent, the global `friendshipCounter >= FRIENDSHIP_COUNTER_MAX`
mechanic stays unchanged; when present, the five-axis predicate set
AND-composes (`roundsThreshold` / `hpGate { belowPct }` /
`requiredStances[]` / `requiredSkillUse[]` / `defaultFallback`). New
internal helper `isFriendshipEligible(state)` in
`src/Combat/index.ts` is the single decision point;
`determineCombatEnd` + `isCombatOngoing` both call it so the two
predicates stay in lockstep. Helper is intentionally NOT exported on
the public barrel per Phase 68 D11. First boss-tier authored config:
CoastalTyrant (`hpGate { belowPct: 0.4 }`, `requiredStances: ['heart']`,
`roundsThreshold: 5`). See `docs/combat.md` § "Per-enemy predicate
(Phase 68 — BefriendabilityConfig)" + `specs/02` § "Post-spec engine
extensions" for the engine-side description.

### Phase 69 — `FriendshipReward.alignmentDelta?: Partial<PhilosophicalAlignment>`

Extends the Phase 60 `FriendshipReward` shape with an optional
`alignmentDelta?: Partial<PhilosophicalAlignment>` field. When combat
resolves via friendship, the END_COMBAT reducer threads the delta
through the Phase 42 `applyAlignmentDelta` clamp helper onto
`state.philosophicalAlignment` (each axis clamps to `[-100, +100]`;
missing axes pass through). The post-clamp `PhilosophicalAlignment`
surfaces on `CombatEndReport.friendshipReward.alignmentShift` for
consumers to render (mirrors `applyDialogueChoice`'s
`effects.philosophicalShift`). Phase 36's +1 `moralMeter` shift stays
unchanged on top — friendship resolutions now optionally shift BOTH
axes per encounter. Closes Spec 14 Q4 ("friendship-victory ↔
alignment cube intersection"). Authoring band mirrors Phase 43's
dialogue / map-event delta convention (±1..±5 per axis; ±10 reserved
for endgame). First authored deltas: MournfulGull `{ outlook: +3 }`
(wistful empathy); HollowEyedBeggar `{ scope: -3 }` (gravity pulls
toward the relational individual). The Boss-tier befriendable enemy
candidate's reward-content scope (currently in
`plan/PHASE_CANDIDATES.md`) will consume the same primitive at
authoring time. (Boss-tier authoring shipped at Phase 70 — see
the per-section note below.)

### Phase 70 — Coastal Tyrant boss-tier `friendshipReward` content

Pure content authoring against the fully-shipped Phase 60 + 62 +
68 + 69 stack. No engine change. CoastalTyrant
(`src/Enemy/enemy.library.ts:326`) gains a boss-tier `friendshipReward`:
3 items (`paradox-loop` unique circlet + `healing-potion` +
`heart-draught`; the unique uses a fixed `() => 0.5` rng for
reload-determinism), `xpBonus: 75` (boss-tier weight vs the
normal-tier +10/+15), multi-paragraph narrative ("you have made me
a man with nothing to be king of"), `alignmentDelta: { outlook: +3,
scope: -2 }` combined-axis shift matching the magistrate-fallen-
priest archetype, `flagSet: 'befriended-coastal-tyrant'`. First
demonstration of the full Phase 60+62+68+69 stack on a single
high-stakes encounter. Closes Phase 60's most-named follow-up.

### Phase 71 — Per-foe aftermath narrative prose (GH#65 ask 1)

Three new optional type interfaces on the public surface +
three additive-optional fields on `Enemy`:

```ts
interface FinalBlowLines { brutal: string; quiet: string; ironic: string }
interface PactLines      { quiet: string; setDown: string; heavy: string }
interface CauseLines     { brutal: string; broken: string; quiet: string }

interface Enemy {
    // ... existing fields ...
    finalBlowLines?: FinalBlowLines;
    pactLines?: PactLines;
    causeLines?: CauseLines;
}
```

Engine does **no** variant selection between the three slots —
fields are pure data; consumer (mobile presenter, CLI, future UI)
picks `brutal` vs `quiet` vs `ironic` based on damage-tier shape or
parley posture. Strings are complete chronicle prose as authored;
no template interpolation. `pactLines` is only meaningful when the
enemy also carries a `friendshipReward`. Naming note: GH#65 source
text used hyphenated `set-down`; field is `pactLines.setDown`
(TS-identifier convention). Initial author coverage at Phase 71:
MournfulGull, HollowEyedBeggar, CoastalTyrant — the three
currently-authored befriendable enemies. Remaining 13 enemies in
the library leave the three fields undefined; consumer-side
fallback (mobile presenter's `derive*Phrase` helpers) covers them
until a future content-sweep phase authors them. Hermetic pin at
`src/Enemy/e2e/aftermath-lines.engine.test.ts`. Fixture bump
162 → 165 types; runtime exports unchanged at 233. See
`docs/enemy.md` § "Aftermath narrative (Phase 71)".

### Phase 73 — `Enemy.journalEntry?: CodexEntry` (GH#65 ask 3)

Adds optional per-foe codex / journal entry metadata + auto-firing
wire on the friendship outcome:

```ts
interface CodexEntry { id: string; title: string; body: string }

interface Enemy {
    // ... existing fields ...
    journalEntry?: CodexEntry;
}
```

When combat resolves via `outcome === 'friendship'` and the
befriended enemy carries a `journalEntry`, the END_COMBAT reducer
appends the entry's id to `state.codex.unlockedEntries` (de-duped)
and `store.endCombat()` surfaces `{ id, title }` on
`CombatEndReport.friendshipReward.codexEntryUnlocked` only when the
entry wasn't already unlocked (mirrors the Phase 69 `alignmentShift`
surfacing pattern; body is recovered at consumer render time via
content-registry lookup). Victory / defeat / flee outcomes do NOT
unlock the entry; future content can grant entries outside combat
via `store.unlockCodexEntry(entryId)`. The matching Game-side
slice (`GameState.codex: CodexState`) + the engine wiring live in
the Spec 09 game-loop area — this spec's slice is the per-foe
content extension. Initial author coverage at Phase 73:
MournfulGull (`codex-mournful-gull` — "The Catalogue of Slights"),
HollowEyedBeggar (`codex-hollow-eyed-beggar` — "They Carry What
You Set Down"), CoastalTyrant (`codex-coastal-tyrant` — "The
Magistrate Who Set Down the Circlet"). Hermetic pin at
`src/Game/e2e/codex.engine.test.ts`. Fixture bump 165 → 167 types
(CodexEntry + CodexState). See `docs/enemy.md` § "Codex entries
(Phase 73)".

## Phase 114 Extension

The original Spec 07 established the enemy content foundation with 15 enemies
across the coastal/fishing-village family. Phase 114 expanded this with a
second enemy class family of 10 northern-forest themed enemies, bringing the
total library to 25 production enemies. This expansion demonstrates the
established content patterns: diverse AI behaviors, befriendability configs
for elite/boss tiers, philosophical alignment distribution, and comprehensive
journal/aftermath content.
