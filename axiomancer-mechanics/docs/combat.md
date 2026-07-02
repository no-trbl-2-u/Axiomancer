# Combat

## Overview

**Hazard-Pattern Combat (Spec 25) is the primary player-facing combat system** — the one
consumed by the mobile app and exercised by `/combat-tuning`. It is a card-and-dice system
where the enemy's sole bar is HP; status effects are the efficient path to 0.
See [§Hazard-Pattern Combat](#hazard-pattern-combat-spec-25) below for the full API surface.

> **Legacy / dev-only:** `resolveCombatRound` (the turn-based resolver described in the
> sections below) backs only the dev-only legacy combat tab. It is NOT the player-facing
> system. Mobile consumers should use `initializeCombatEncounter` / `playCombatCard` /
> `resolveCombatPhase` instead.

The legacy resolver lives in:

- `Combat/index.ts` — module barrel + small mechanics helpers (advantage, stats, dice, damage, health, effect queries).
- `Combat/combat.reducer.ts` — small `(state, …args) => newState` mutations on `CombatState`.
- `Combat/combat.resolver.ts` — `resolveCombatRound`, the single round-resolution entry point. Returns `{ state, combatEvents }` so any UI client (CLI, future React Native UI, automated tester) can drive combat without re-implementing the math. The orchestrator delegates to per-phase helpers in `Combat/phases/`:
  - `phases/round-start.ts` — regen / drain / start-phase DoT.
  - `phases/action-restriction.ts` — `forcedStance` / `blockedStance` / `skipTurn`.
  - `phases/advantage.ts` — type-advantage matchup + effect overrides.
  - `phases/stance-effects.ts` — clear stale Tier 1 buffs; apply this round's Tier 1.
  - `phases/scenario.ts` — skill / item / attack / defend resolution and stance-token generation (the largest phase).
  - `phases/round-end.ts` — end-phase DoT and effect expiry.

## Type System

Each round both combatants choose a `Stance`: `heart`, `body`, or `mind`.
Advantage is determined by rock-paper-scissors:

```
Heart > Body > Mind > Heart
```

| Matchup | Result |
|---------|--------|
| Heart vs Body | Heart has **advantage** |
| Body vs Mind | Body has **advantage** |
| Mind vs Heart | Mind has **advantage** |
| Same type | **Neutral** |
| Reverse of above | **Disadvantage** |

Advantage modifier (flat roll bonus/penalty from `getAdvantageModifier()`):
- Advantage: +2
- Neutral: 0
- Disadvantage: −2

## Actions

| Action | Description |
|--------|-------------|
| `attack` | Offensive — deals damage |
| `defend` | Defensive — reduces incoming damage |
| `skill` | Use a learned/unlocked skill that is currently affordable (Spec 04 / 04b; legacy equipped gate removed in Phase 98) |
| `item` | Use an inventory consumable (Spec 05 / 05b) |
| `flee` | Attempt to escape |
| `spare` | Phase 108 — mercy choice to spare/befriend the enemy (sets `friendshipResolutionAuthorized`) |
| `exploit` | Phase 108 — mercy choice to exploit the opening for a free critical attack |

## Combat Phases

`choosing_stance` → `choosing_action` → `choosing_skill` → `mercy_choice` → `resolving` → `ended`

The `mercy_choice` phase activates after a successful Befriend skill cast, presenting
the player with a choice between `spare` (mercy/friendship) and `exploit` (critical attack).

The Combat CLI currently drives both selection phases inline rather than persisting them
on `state.phase`; the reducer still exposes `setPhase(state, phase)` for consumers that
want explicit phase tracking.

## Defense Multipliers

Applied to the defender's base defense stat when the `defend` action is chosen.
The multiplier depends on the defender's type-advantage over the attacker.

| Defender's Advantage | Multiplier |
|---------------------|------------|
| Advantage (picked the right counter-type) | 3× |
| Neutral (same type) | 2× |
| Disadvantage (wrong type) | 1.5× |
| Not defending (took damage after losing attack contest) | 1× (passive) |

## Round Flow (Current Implementation)

A single call to `resolveCombatRound(state, playerAction, enemyAction, lookupSkill?)`
runs every phase below and returns `{ state, combatEvents }`. The CLI prints the
event stream via `renderRoundEvents` in `combat.display.ts`; the resolver
itself never logs.

```
resolveCombatRound(state, playerAction, enemyAction, lookupSkill?)
├── 1. round-start          → processRoundStartEffects  → regen / drain / start-phase DoT
│                              (early exit if a combatant drops to 0 HP)
├── 2. action-restriction   → canAct                    → forced-stance / blocked-stance / skipTurn
├── 3. advantage            → resolveEffectiveAdvantage → matchup + per-side advantage label
├── 4. stance-effects       → clearTier1EffectsForStance + applyTier1CombatEffect
├── 5. scenario             → 'skill' routes through executeSkill (Spec 04);
│                              otherwise attack-vs-attack / attack-vs-defend / etc.
│                              Player basic actions also generate stance tokens
│                              into `combatResources` (hit +3 / miss +1 / defend +5).
│                              Phase 150: when the player lands a HOSTILE skill
│                              and the enemy did not already pick one, a
│                              legal-acting enemy may answer with a skill of its
│                              own — gated by hostility (befriend/buff skills
│                              draw no answer), `enemyCanAct`, and a 0.10
│                              `ENEMY_SKILL_ANSWER_CHANCE` roll
│                              (`selectEnemySkillResponse` → `enemy-skill-response`
│                              marker + the enemy's `skill` event stream).
└── 6. round-end            → end-phase DoT  → tickAllEffects  → log expired effects
                              + round counter increments
```

Events are emitted in the order above, grouped by `phase`:
`round-start` → `action-restriction` → `advantage` → `stance-effects` →
`skill` → `scenario` → `resources` → `round-end`. UI consumers render each
section from the typed `RoundEvent` union exported alongside the resolver.

## Tier 1 Auto-Effects

Every `attack` or `defend` action automatically applies a Tier 1 effect — no resist roll.
Switching action types removes the previous type's self-buff immediately via `clearTier1EffectsForStance()`.

| Action | Effect | Applied To |
|--------|--------|------------|
| Body + Attack | `tier1_body_attack` — Ad Baculum (physical attack stance) | self |
| Body + Defend | `tier1_body_defend` — Briar Stance (thorns reflect) | self |
| Mind + Attack | `tier1_mind_mark` — Exposed Reasoning (+1 intensity / +1 duration) | opponent |
| Mind + Defend | `tier1_mind_mark` — Exposed Reasoning (+3 intensity / +3 duration) | opponent |
| Heart + Attack | `tier1_heart_attack` — Fleeting Kindness (emotional pressure) | self |
| Heart + Defend | `tier1_heart_defend` — Vital Empathy (regen) | self |

## Effect-Based Combat Specials (Active)

These are live in `combat.resolver.ts` (no CLI inline math — the CLI just renders the events the resolver emits):

| Mechanic | When | What |
|----------|------|------|
| **Study Mark** (Mind/Attack) | Before damage roll | `getStudyMarkIntensity(enemy)` → added to damage roll as bonus |
| **Thorns Reflect** (Body/Defend) | After any hit on the bearer | `getThornsReflect(bearer)` → sums `reflectDamage × intensity`; dealt back to attacker |
| **Heart/Attack — strip buff** | On hit | `removeRandomBuff(enemy)` → one random enemy buff removed |
| **Heart/Attack — extend buff** | On hit | `extendRandomBuffDuration(player, 1)` → one random player buff gets +1 duration |
| **Heart/Attack — roll penalty** | Roll phase | −5 to the player's attack modifier |

## Spec 03 — Tier 2 / Tier 3 Effect Procs

Every basic `attack` or `defend` that lands a hit also rolls for effect procs from `combat-effects.library.json`. The proc table is organised as Stance × action × tier triples. Basic actors only roll the tier-1 entries; tier-2 and tier-3 procs are gated by per-cell unlocks on the actor (`procUnlocks` field on Character / Enemy).

**Trigger gate** — procs only fire on a successful hit (i.e. inside `resolveAttackHit`). The attacker rolls procs from their `attack` table; the defender, when they actively defended, additionally rolls procs from their `defend` table.

**Final proc chance** —

```
chance = baseChance
       + (stanceBaseStat       × 0.02)    // STAT_PROC_BONUS_PER_POINT
       + (statusChanceIntensity × 0.05)    // STATUS_CHANCE_BUFF_BONUS  (from buff_status_chance_up)
```

Clamped to [0, 1].

**Crit (nat 20 attack roll)** — every eligible proc in the table fires automatically with +1 intensity / +1 duration on top of the trigger's defaults.

**Fumble (nat 1 attack roll)** — applies the cell's `fumbleEffectId` to the actor as a self-debuff and skips other procs for that cell.

**Application path** — procs hand off to `applyEffect` (to materialise the ActiveEffect with the right intensity / duration) and then `resolveEffectApplication` (Tier 2 buff caster fumble/crit; Tier 2 debuff + Tier 3 always land post-Phase-80). Tier 1 procs auto-apply via `applyEffect` alone.

**Default proc matrix:**

| Stance / Action | Tier 1 (basic) | Tier 2 (unlock) | Tier 3 (unlock) | Fumble (self) |
|-----------------|----------------|------------------|------------------|----------------|
| Body / Attack | `debuff_post_hoc_tremor` (opponent, 10%) | `debuff_bleed` (opponent, 18%) | `debuff_petrify` (opponent, 6%) | `debuff_post_hoc_tremor` |
| Body / Defend | `buff_ad_hoc_patch` (self, 10%) | `buff_resistance_body` (self, 15%) | `buff_invincibility` (self, 5%) | `debuff_post_hoc_tremor` |
| Mind / Attack | `debuff_affirming_consequent` (opponent, 10%) | `debuff_daze` (opponent, 18%) | `debuff_petrify` (opponent, 6%) | `debuff_affirming_consequent` |
| Mind / Defend | `buff_gettiters_flicker` (self, 10%) | `buff_resistance_mind` (self, 15%) | `buff_haste` (self, 5%) | `debuff_affirming_consequent` |
| Heart / Attack | `debuff_straw_man_echo` (opponent, 10%) | `debuff_fear` (opponent, 18%) | `debuff_petrify` (opponent, 6%) | `debuff_straw_man_echo` |
| Heart / Defend | `buff_petitio_pulse` (self, 10%) | `buff_resistance_heart` (self, 15%) | `buff_invincibility` (self, 5%) | `debuff_straw_man_echo` |

**Enemy customisation (Q7)** — `Enemy.procOverrides` swaps the entire cell's table wholesale (used for bosses with signature procs and elite / basic enemies whose tables depend on the encounter map). `Enemy.procUnlocks` raises the per-cell tier cap independently.

**Switching (Q5)** — out of scope for this spec. The skill engine (Spec 04) will hook switching into a different effect pool; basic procs do not currently apply a switching multiplier.

## Effect Application Rules (`resolveEffectApplication`)

| Tier | Rule |
|------|------|
| **Tier 1** | Auto-applies. No roll made. |
| **Tier 2 Buff** | Caster d20: natural 1 = fumble (buff fails, `buff-fumbled` event). Natural 20 = crit focus → 2× intensity. Any other = auto-succeeds. |
| **Tier 2 Debuff** | **Always lands.** No target-resist roll. No rebound. No overwhelmed. (Phase 80 — direction (a) pure split.) |
| **Tier 3** | **Always lands.** Inescapable. (Phase 80 — Nat-20 escape removed.) |

See `docs/effects.md` for the full per-tier breakdown and stacking rules.

## Damage Resistance (Phase 93)

Phase 93 completes Phase 80's direction (a) "pure split": effects always land (Phase 80), damage applies resistance separately (Phase 93).

Skills now apply damage resistance based on the target's stats:
- **Physical damage** (body-scaling skills) → reduced by target's body stat
- **Mental damage** (mind-scaling skills) → reduced by target's mind stat  
- **Emotional damage** (heart-scaling skills) → reduced by target's heart stat

**Linear resistance model:** Each point of resistance stat reduces damage by 1.
**Minimum damage:** Damage is clamped to at least 1 (high resistance reduces but never completely negates damage).

```typescript
// Physical skill against high-body target
const damage = calculateSkillDamage(caster, bodySkill, target);
// If bodySkill would deal 10 damage, but target has 7 body stat,
// final damage = 10 - 7 = 3

// Very high resistance still allows minimum damage
// If target has 15 body stat vs 10 damage, result = 1 (not 0)
```

This affects `calculateSkillDamage` when a target is provided. Calls without a target maintain backward compatibility (no resistance applied).

## Friendship Path

Both combatants defending on the same round increments `friendshipCounter`.
Reaching `FRIENDSHIP_COUNTER_MAX` (3) ends combat with the `friendship`
outcome — UNLESS the enemy carries a per-enemy `befriendabilityConfig`
override (Phase 68), in which case ALL of its named predicates must pass
simultaneously before friendship triggers. See § "Per-enemy predicate
(Phase 68 — `BefriendabilityConfig`)" below for the override semantics.

When the Game store's `endCombat()` resolves a friendship exit (Phase 36),
the returned `CombatEndReport` carries:

- `outcome: 'friendship'` (distinct from `'flee'`)
- `xpGained: floor(totalEncounterXp * 0.5) + friendshipReward?.xpBonus` —
  half the kill-win XP plus any per-enemy bonus (Phase 60)
- `loot: rollEncounterLoot(encounter) ++ friendshipReward?.items` —
  the full weighted-loot roll with any per-enemy guaranteed items
  appended (Phase 60)
- `friendshipReward?: { narrative?, alignmentShift?, codexEntryUnlocked? }`
  (Phase 60 + 69 + 73) — present only when the befriended enemy
  carries an authored `friendshipReward` with `narrative` /
  `alignmentDelta`, OR a `journalEntry` that wasn't already
  unlocked. Engine doesn't interpret `narrative`; CLI / UI renders.
  `alignmentShift` (Phase 69) carries the post-clamp
  `PhilosophicalAlignment` the reducer just wrote to
  `state.philosophicalAlignment` — surface parity for consumers
  that don't subscribe separately. `codexEntryUnlocked` (Phase 73)
  carries `{ id, title }` for the newly-unlocked codex entry;
  body is looked up against the source `Enemy.journalEntry`.
- **State side effect (Phase 62)** — when the befriended enemy carries
  `friendshipReward.flagSet?: string`, the END_COMBAT reducer appends
  the flag to `state.flags` (de-duped). Downstream dialogue choices /
  quest objectives can gate on the flag via the existing
  `DialogueChoice.requires.flag` machinery — no new engine surface
  for the consumer. Convention is `befriended-<enemy-id-stem>` (e.g.
  `befriended-mournful-gull`). The flag does NOT surface on the report.
- **State side effect (Phase 69)** — when the befriended enemy carries
  `friendshipReward.alignmentDelta?: Partial<PhilosophicalAlignment>`,
  the END_COMBAT reducer applies the delta to
  `state.philosophicalAlignment` via `applyAlignmentDelta` (Phase 42
  clamp helper; each axis clamps to `[-100, +100]`, missing axes pass
  through). Closes Spec 14 Q4. Authoring band: ±1..±5 per axis (matches
  the Phase 43 dialogue / map-event delta convention). The post-clamp
  cell surfaces on `CombatEndReport.friendshipReward.alignmentShift`.
- **State side effect (Phase 73 — closes GH#65 ask 3)** — when the
  befriended enemy carries `journalEntry?: CodexEntry`
  (`{ id, title, body }`), the END_COMBAT reducer appends the
  entry's id to `state.codex.unlockedEntries` (de-duped). The
  store layer surfaces `{ id, title }` on
  `CombatEndReport.friendshipReward.codexEntryUnlocked` only when
  the entry wasn't already unlocked — repeat befriends don't
  re-fire the report field. Body is recovered at consumer render
  time via lookup against the source `Enemy` (or a future
  `CodexLibrary` registry). Victory / defeat / flee outcomes do
  NOT unlock the entry; future content can grant entries outside
  combat via `store.unlockCodexEntry(entryId)`.

The reducer side (Phase 10) also shifts the moral meter `+1` (see
`docs/morality.md` § "Combat: Friendship Victories") and routes the player
through `applyLevelUps` if the (now possibly-bonused) XP crossed a threshold.

### Befriendable-enemy content (Phase 60)

Per-enemy `Enemy.friendshipReward?: FriendshipReward` lets authors
attach bonus content to the friendship resolution. Seven enemies ship
authored rewards (Phase 102 expanded from 3 → 7):

| Enemy | Items | xpBonus | Narrative |
|---|---|---|---|
| **MournfulGull** (normal) | 1 × heart-draught | +10 | "The gull stops circling. It settles on the rail beside you. For a long moment, neither of you speaks the slights you remember." |
| **HollowEyedBeggar** (normal) | 1 × healing-potion + 1 × antidote | +15 | "They pull a folded cloth from somewhere inside the rags. Two phials, both still cold. \"I was carrying these for someone,\" they say. \"But you stopped. So.\"" |
| **TideflukeReaver** (elite, Phase 102) | 1 × body-elixir + 1 × healing-potion | +35 | "The salt-bound reaver's chains dissolve into foam. For the first time in memory, its fists unclench." |
| **HushWraith** (elite, Phase 102) | 1 × clarity-serum + 1 × antidote | +40 | "The wraith's silence breaks into whisper. 'I have been listening to the wrong questions,' it says..." |
| **HollowSaint** (elite, Phase 102) | 1 × resonance-crystal + 1 × heart-draught + 1 × healing-potion | +45 | "The hollow saint finds purpose in witness. 'I have been looking for a cause to die for,' it says..." |
| **CoastalTyrant** (boss) | paradox-loop + healing-potion + heart-draught | +75 | "For five rounds the magistrate has refused to strike. The sword stays low..." |
| **TheDisagreement** (boss, Phase 102) | 1 × philosopher-tea + 1 × focus-vial + 1 × healing-potion + 1 × clarity-serum | +80 | "The disagreement resolves into dialogue. 'You argued back properly,' it says..." |

`FriendshipReward` is `{ items?: Item[]; xpBonus?: number; narrative?:
string }`. Items are appended to the weighted-loot roll, xpBonus is
additive on top of the half-XP base, and `narrative` surfaces on
`CombatEndReport.friendshipReward.narrative` for the consumer to
render. Enemies without an authored `friendshipReward` resolve via the
Phase 36 base only (the report's `friendshipReward` field is
`undefined`). See `docs/enemy.md` § "Befriendable enemies (Phase 60)"
for authoring guidance.

### Per-enemy predicate (Phase 68 — `BefriendabilityConfig`)

`Enemy.befriendabilityConfig?: BefriendabilityConfig` overrides the
Phase 36 friendship-eligibility predicate per enemy. When absent, the
Phase 36 mechanic stays unchanged. When present, ALL of its named
fields AND-compose; eligibility requires every named predicate to pass
simultaneously. Within a single list-valued predicate, the match is
existential (at least one element).

| Field | Semantics |
|---|---|
| `roundsThreshold?: number` | Per-enemy override of `FRIENDSHIP_COUNTER_MAX`. Defaults to the global value (3) when absent on a config that sets other fields. |
| `hpGate?: { belowPct: number }` | Enemy HP fraction must be ≤ `belowPct` at the eligibility check. Pure snapshot — healing back above the threshold un-qualifies. Range [0, 1]. |
| `requiredStances?: Stance[]` | Player must have used at least one of the named stances during combat (existential). Derived from `state.log[].playerAction.stance`. Empty array = no requirement. |
| `requiredSkillUse?: string[]` | Player must have cast at least one of the named skill IDs during combat (existential). Derived from `state.log[].playerAction` entries with `action === 'skill'`. Empty array = no requirement. |
| `defaultFallback?: 'both-defend-cap'` | Explicit "fall through to Phase 36". When set, other fields are ignored for THIS enemy; eligibility uses the global counter cap exactly. |

The engine helper that evaluates the predicate is
`isFriendshipEligible(state: CombatState): boolean` in
`src/Combat/index.ts`. It is **not** on the public barrel — engine
consumers read combat-end state through `determineCombatEnd` /
`isCombatOngoing`, both of which call it so the two predicates stay in
lockstep.

The counter still increments freely on both-defend rounds (Phase 36
unchanged); friendship triggers only when ALL config predicates pass
together. A player can "bank" defends past `roundsThreshold` and have
friendship trigger later (e.g. once `hpGate` clears via damage progress).

Coastal Tyrant is the first boss-tier authored config (Phase 68):

```typescript
// CoastalTyrant (boss; alignment faith-pessimistic-transcendent)
befriendabilityConfig: {
    hpGate: { belowPct: 0.4 },
    requiredStances: ['heart'],
    roundsThreshold: 3, // Phase 101 — reduced from 5 for mercy policy viability
},
```

The fallen magistrate-priest opens his friendship arc only after he's
been brought low (HP ≤ 40%), the player has shown empathy at least
once (heart stance), and 3 both-defend rounds have passed. The
authored `friendshipReward` content (multi-paragraph narrative + items)
is deferred to the boss-tier befriendable-enemy follow-up phase.

### Friendship Resolution Authority (Phase 112)

Phase 112 hardened the Befriend doctrine to ensure friendship resolution
is always explicit and intentional. **Passive friendship counter pressure
alone no longer ends combat.** The friendship outcome requires:

1. **Explicit Befriend skill cast** — the player must actively use the
   Befriend skill (5 heart tokens) when the enemy is vulnerable.
2. **Mercy choice selection** — successful Befriend opens a choice between
   `spare` (mercy/friendship) and `exploit` (critical attack).
3. **Authorization flag** — only `spare` choice sets
   `state.friendshipResolutionAuthorized = true`, enabling the friendship
   combat end.

Both-defend friendship counters still increment normally and contribute to
`BefriendabilityConfig` thresholds, but they are no longer sufficient by
themselves. This prevents silent bypassing of:
- The 5-heart Befriend cost
- The explicit mercy choice moment
- HP-gate and other authored eligibility requirements

The `isFriendshipEligible(state)` predicate now checks
`state.friendshipResolutionAuthorized === true` rather than counter/config
predicates directly.

## Combat End Conditions

`determineCombatEnd(state)` returns:

| Return | Condition |
|--------|-----------|
| `'player'` | Enemy HP ≤ 0 OR effects-driven victory (Phase 125) |
| `'ko'` | Player HP ≤ 0 |
| `'friendship'` | `state.friendshipResolutionAuthorized === true` — set only when player casts Befriend + chooses `spare` (Phase 112) OR effects-driven friendship (Phase 125) |
| `'ongoing'` | None of the above |

### Effects-Driven Resolution (Phase 125)

Phase 125 allows status effects to force combat resolution instead of timeout, rewarding status-effect-heavy play styles. `getEffectsResolutionOutcome(state)` analyzes the enemy's active effects and can trigger two resolution paths:

**Saturation Yield (→ friendship)**: When the enemy is overwhelmed by control and debuff effects, it yields. The combined intensity of control effects plus stat-debuffing effects must reach `EFFECTS_RESOLUTION_DEBUFF_INTENSITY_THRESHOLD` (tunable, default 8). This routes through the existing `'friendship'` outcome for stable rewards (half XP + full loot). Phase 155 — a control effect that is *actively restricting* the enemy (`forcedStance` / `blockedStances` / `skipTurn`) also credits its remaining lock duration (capped) toward this sum, so exploiting a decisive multi-round lock saturates the enemy even at base intensity.

**DoT Erosion (→ victory)**: When damage-over-time effects can realistically finish the enemy, combat resolves to victory. Total DoT damage per round must exceed `EFFECTS_RESOLUTION_DOT_DAMAGE_THRESHOLD` (tunable, default 5) and be able to finish the enemy within ~10 rounds. Phase 155 — the route credits the **guaranteed pending DoT already locked in** (`Σ damagePerRound × intensity × remainingDuration`) against effective enemy HP, so a strategist who has stacked a lethal-in-flight DoT package resolves the fight they have already won instead of trading turns to the round cap. The per-round threshold gate is retained, so a trickle DoT still cannot force a premature win. This routes through the existing `'victory'` outcome for full XP and loot.

Effects resolution integrates with existing combat-end logic:
- Checked after HP conditions but before manual friendship authorization  
- Uses existing `CombatEndReport.outcome` union values (no new outcome types)
- Preserves round cap unchanged — effects provide resolution, not more time
- Thresholds are registry tunables for balance iteration

This closes the high-engagement timeout issue where players dominating via status effects couldn't complete fights within the round limit.

## Battle Log

`CombatState.log: BattleLogEntry[]` is an opt-in coarse summary slot from
the pre-Phase-9 combat design. `appendLog(state, entry)` is the reducer
that pushes one row:

```typescript
{
  round, playerAction, enemyAction, advantage,
  playerRoll, playerRollDetails,
  enemyRoll, enemyRollDetails,
  damageToPlayer, damageToEnemy,
  playerHPAfter, enemyHPAfter,
  result
}
```

The live per-round signal that consumers actually subscribe to is the
`RoundEvent[]` stream returned by `resolveCombatRound` — it carries every
phase / kind / sub-event (attack-roll, damage-applied, effect-application,
heal, resist, friendship-counter ticks, ...). The CLI threads that
stream onto the `combat:round` event payload and the agent-e2e state log
via `store.updateCombat(next, combatEvents)`. `appendLog` remains on the
public barrel for any consumer that wants the summary shape; the combat
resolver itself never populates it.

**Contract validation (Phase 96):** `resolveCombatRound` validates all
required parameters at entry to prevent runtime contract divergence issues
where BattleLogEntry fields might be undefined. If undefined `playerAction`
or `enemyAction` are passed, the function throws early with descriptive errors.

## Combat Reducer API

Defined in `src/Combat/combat.reducer.ts`. These are small, single-concept
state-shape mutations. The current names are on the left; legacy aliases are
listed where they exist for backwards compatibility.

| Function | Alias(es) | Description |
|----------|-----------|-------------|
| `initializeCombat(player, enemy)` | — | Creates fresh CombatState with deep-cloned combatants |
| `setPhase(state, phase)` | — | Transitions to a new combat phase |
| `setPlayerStance(state, stance)` | — | Sets the player's stance choice |
| `setPlayerAction(state, action)` | — | Sets the player's action choice |
| `appendLog(state, entry)` | — | Appends a battle log entry |
| `incrementFriendship(state)` | — | Increments the friendship counter |
| `endCombat(state)` | — | Marks combat as ended; the reason is encoded in `determineCombatEnd(state)` |

## Combat Resolver API

Defined in `src/Combat/combat.resolver.ts`. The resolver is the single
round-resolution entry point used by every UI client.

| Function / Type | Description |
|-----------------|-------------|
| `resolveCombatRound(state, playerAction, enemyAction): RoundResolution` | Runs all six phases of one round and returns `{ state, combatEvents }`. Pure; only RNG source is `Math.random` inside dice rolls and effect selectors (stub via `src/test-utils/rng.ts`). |
| `RoundResolution` | `{ state: CombatState; combatEvents: RoundEvent[] }` |
| `RoundEvent` | Discriminated union, organised by `phase` (`round-start`, `action-restriction`, `advantage`, `stance-effects`, `scenario`, `round-end`). UIs render each phase as a section. |
| `CombatActor` | `'player' \| 'enemy'` — used by every event to identify which side it belongs to. |

## Combat Mechanics API

| Function | Description |
|----------|-------------|
| `determineAdvantage(attacker, defender)` | Returns advantage relationship |
| `getAdvantageModifier(advantage)` | Returns +2 / 0 / −2 |
| `hasAdvantage(attacker, defender)` | Boolean shorthand |
| `determineEnemyAction(logic)` | AI-driven enemy action selection |
| `isCombatOngoing(state)` | True if combat should continue |
| `determineCombatEnd(state)` | Returns outcome or 'ongoing' |
| `getBaseStat(entity, stance)` | Raw base stat for a stance |
| `getAttackStat(entity, stance)` | Attack derived stat for a stance |
| `getDefenseStat(entity, stance)` | Defense derived stat for a stance |
| `getSaveStat(entity, stance)` | Save stat for a stance (enemies fall back to defense) |
| `getEffectiveStats(entity).baseStats[resistedBy]` | Base stat used when resisting an effect |
| `rollSkillCheck(baseStat, advantage)` | d20 + modifier with advantage/disadvantage |
| `calculateFinalDamage(base, reduction, crit, bonus)` | Damage after reductions. On crit, picks the higher of `double` (2× base − defence) vs `pierce` (base, defence ignored) — Phase 32 auto-selection. |
| `selectCritDamage(base, reduction, bonus)` | Phase 32 — returns `{ style, damage }` for the crit auto-selection in isolation, useful for tests / future damage previews. |
| `calculateDamageResistance(target, baseDamage, damageType)` | Phase 93 — applies target's resistance to damage (linear reduction, minimum 1) |
| `getSkillDamageType(scalingStat)` | Phase 93 — maps skill scaling stat to damage type for resistance calculation |
| `applyDamage(entity, damage)` | Reduces HP (clamps to 0) |
| `heal(entity, amount)` (alias `healCharacter`) | Restores HP (clamps to max) |
| `resolveEffectApplication(target, effect, type, heart, equip)` | Effect application (Tier 2 buff fumble/crit; Tier 2 debuff + Tier 3 always land) |
| `tickAllEffects(target)` | Decrements all effect durations |
| `getStudyMarkIntensity(target)` | Mind mark bonus for damage |
| `getThornsReflect(bearer)` | Thorns reflect damage total |
| `removeRandomBuff(target)` | Strips one random buff |
| `extendRandomBuffDuration(target, amount)` | Extends one random buff |
| `applyRegen(target)` | Sums and applies all regen effects |
| `getActiveRollModifier(target)` | Sums all `rollModifier` + `rollModifierPerIntensity × intensity` across active effects — flat roll-mod total consumed by the combat resolver |
| `canAct(effects, requestedStance?)` | Action-restriction gate — returns `{ canAct, resolvedStance, reason }` reflecting forced/blocked-stance and skipTurn constraints |
| `isAlive(combatant)` | True if `health > 0` |
| `isDefeated(combatant)` | True if `health <= 0` — the sole win condition for Hazard-Pattern Combat |
| `getHealthPercentage(combatant)` | `health / maxHealth` as a 0–1 fraction |
| `updateEffectDuration(target, effectId)` | Decrements one effect's duration by 1 and removes it when it reaches 0 |
| `getActiveEffectModifiers(effects)` | Aggregates all `ActiveEffect` modifiers into an `AggregatedEffectModifiers` object |
| `getEffectiveStats(combatant)` | Returns `EffectiveStats` — base stats and derived stats after all active-effect modifiers are applied |
| `calculateEnemyStatMultiplier(moralMeter)` | Maps moral-meter value (−100…+100) to an enemy-stat scale factor (0.5×…2×) |
| `applyMoralMeterScaling(baseStats, moralMeter)` | Returns a copy of `BaseStats` with every stat scaled by `calculateEnemyStatMultiplier(moralMeter)` |

### Combat Types

| Type | Description |
|------|-------------|
| `Advantage` | `'advantage' \| 'neutral' \| 'disadvantage'` — RPS matchup outcome |
| `CritStyle` | `'double' \| 'pierce'` — Phase 32 auto-selected crit variant |
| `CombatAction` | `{ stance: Stance; action: Action }` — the combined stance + action choice for one side of a round |
| `CombatPhase` | `'choosing_stance' \| 'choosing_action' \| 'choosing_skill' \| 'mercy_choice' \| 'resolving' \| 'ended'` — the state-machine phase of a turn-based combat encounter |
| `AggregatedEffectModifiers` | Summed numeric modifiers from all active effects; consumed by `getEffectiveStats` |
| `EffectiveStats` | `{ baseStats, derivedStats, nonCombatStats, defenseDelta }` — combatant stats after all active-effect modifiers are applied; produced by `getEffectiveStats` |
| `DamageType` | `'physical' \| 'mental' \| 'emotional'` — damage category used by resistance calculations |
| `Combatant` | `Character \| Enemy` — the union type for any participant in a combat encounter |
| `BattleLogEntry` | Per-round log record (`round`, `playerAction`, `enemyAction`, `advantage`, rolls, damage fields, `result`) stored in `CombatState.log` |

## Skills vs Cards — Terminology Boundary

**Skills** and **cards** are distinct concepts. Do not use them interchangeably.

| Concept | Definition |
|---------|-----------|
| **Skill** | A learned/unlocked action in `knownSkills`, gated only by token/resource affordability (`combatResources`). Always available once learned. Executed through `executeSkill`. |
| **Card** | A Hazard-style combat entity in the deck/hand/reward loop — with free/powered action halves, a stance color, a die cost, and draw/discard/deck cadence. |
| **Projected card** | A card derived from a skill-library entry via `toCombatCard`. The *source* is a skill; the *object in play* is still a card. Call it a "projected card" or "skill-sourced card", never a "skill". |

Cross-reference: `docs/skills.md` → Skills vs Cards.

## Hazard-Pattern Combat (Spec 25)

**The primary player-facing combat system** (mobile map encounters, `/combat-tuning`).
A card-and-dice system structurally mirrored on the Hazard minigame: every verb is a
combat card, and the enemy's **sole bar is HP** — dropping it to 0 (`isDefeated(enemy)`)
is the only win condition. Status effects are the **efficient** path: DoT erodes HP far
faster than the deliberately weak basic strike (`DIRECT_DAMAGE_WEIGHT`), and control
hinders the enemy's telegraphed threat turn. Basic-attack trading is the weak baseline,
not a parallel win track. Full design:
[`specs/25-hazard-pattern-combat.md`](../specs/25-hazard-pattern-combat.md)
(note: that spec's two-pressure-track narrative is superseded by the HP-only
model shipped 2026-06-22 — `VISION.md` → Combat vision is canonical).

The engine lives in `src/Combat/`:

- `combat.engine.ts` — phase loop (`resolveCombatPhase` / `playCombatCard` /
  `resolveThreatPhase` / `processBetweenPhases`), RPS die-cost scaling, the
  self-reinforcing die-refresh loop, and `buildCombatSummary`.
- `combat.dice.ts` — the four colored mana dice and their state machine.
- `combat.deck.ts` — Fisher-Yates shuffle + draw-up-to-`COMBAT_HAND_SIZE`.
- `combat.cards.ts` — the skill→card adapter and verb classification.
- `combat.threat.ts` — authored + generated enemy threat sequences.
- `combat.encounter.sim.ts` — `simulateHazardPatternCombat`, a Monte-Carlo
  greedy bot used for balance evidence.

### Hazard-Pattern Combat API

| Function / Type | Description |
|-----------------|-------------|
| `initializeCombatEncounter(...)` | Builds the `CombatEncounterState` for a fight (deck, dice, threat sequence). |
| `rollEncounterDice(state)` | Rolls the colored mana dice at phase start. |
| `resolveCardDieCost(cardColor, enemyPhaseStance)` | Returns the `CardDieCost` for playing a card: `{ cost, advantage }`. Advantage if card stance beats the enemy phase stance (RPS), disadvantage if beaten, neutral otherwise. Wild/X dice always cost 1. |
| `COMBAT_DICE_COUNT` / `COMBAT_HAND_SIZE` / `COMBAT_DIE_FACES` | Spec 25 tuning constants: opening dice pool size (4), max hand size (6), and the die-face bag (`heart`/`body`/`mind`/`wild` at 1/6 each; `x` at 2/6). |
| `rollCombatDice(count?, rng?)` / `combatDieCanPower(die, cardColor)` / `refreshOneDie(dice, color)` | Dice helpers: roll the opening pool; check whether a die can power a card of a given color (wild powers any; x powers nothing unless flipped); refresh one spent die of a matching color back to available (self-reinforcing status loop, §4.7). |
| `toCombatCard(cardId, lookupSkill, lookupEffect)` / `projectDeck(cardIds, lookupSkill, lookupEffect)` | Card-view converters: project a single skill (or synthetic card) into a `CombatCard` view, or an entire deck of ids into a `CombatCard[]` (unknown ids dropped). |
| `classifyVerbClass(skill, lookupEffect)` | Classifies a skill into a `CombatVerbClass` + `CardEffectKind` pair. Priority: DoT > control > stat-debuff > buff > direct-damage. Used by `toCombatCard` to generate top/bottom action text. |
| `buildCombatDeck(player)` | Assembles the player's combat deck from `knownSkills` + `combatRewardCards` (de-duped for the baseline, duplicates kept for reward cards) + the synthetic `card-retreat` baseline. Ready to feed `initializeCombatEncounter`. |
| `playCombatCard(state, cardId, dice)` | Plays one combat card, spending dice; lands its effects and deals HP damage via status/strike. |
| `resolveCombatPhase(state, cardsPlayed)` | Resolves a full player phase (card-play driven; replaces the per-round attack/defend resolution). |
| `resolveThreatPhase(state)` | Resolves the enemy threat phase (Clear / Overwhelmed ledger). |
| `processBetweenPhases(state)` | Between-phase upkeep — persistent buffs, die refresh, momentum carry. |
| `selectEncounterMercyChoice(...)` | Opens the Befriend mercy choice (Phase 112 logic intact). |
| `getCard` / `handCards` / `cardDieCostPreview` / `availableDice` | Read-only previews for a UI to render the hand and affordances. |
| `buildCombatSummary(state)` | End-of-fight `CombatSummary` with per-effect attribution rows. |
| `simulateHazardPatternCombat(...)` | Monte-Carlo greedy bot returning `CombatSimStats` for balance runs. |
| `SYNTHETIC_CARD_IDS` / `isSyntheticCard` | `SYNTHETIC_CARD_IDS` is a `readonly string[]` of built-in non-deck cards (currently `['card-retreat']`). The deck builder injects them into every hand; `isSyntheticCard(id)` is the boolean predicate. Filtered out of deckbuilder reward drafts. |
| `GOLD_CARD_IDS` / `isGoldCard` / `CardEffectKind` | Gold (rare) card support. `GOLD_CARD_IDS` is a `ReadonlySet<string>` of the three rare card ids (`'pyrrhic-victory'`, `'the-final-word'`, `'unmoved-mover'`); unpowered they provide utility, powered they land a MAJOR status + damage. `isGoldCard(id)` is the boolean predicate — the engine grants automatic advantage when a WILD die powers a gold card. `CardEffectKind` (`'dot' \| 'control' \| 'none'`) is the status-payload classification tag on every `CombatCard` (set by `classifyVerbClass`); it drives the mobile card frame and deck-preset focus logic. The baseline GUARD defense card (`'brace-for-impact'`) is included in `STARTING_SKILL_IDS`. |
| `CombatEncounterState`, `CombatCard`, `CombatThreatPhase`, `CombatOutcome`, `CombatSummary` | The core encounter type family. (`CombatPressureTracks` was REMOVED 2026-06-22 — HP is the sole win condition.) `CombatCard.skillId` is the canonical field for the backing learned-skill id (`string \| null`; `null` for synthetic cards like Retreat). Use it to trace a projected card back to its source skill. |
| `CombatAttributionRow`, `LandedEffect` | Attribution sub-types for `buildCombatSummary`. `CombatAttributionRow` is a per-card row (`cardId`, `name`, `dotDamage`, `damageDealt`, `phases`); `LandedEffect` is a snapshot of one live effect used internally during attribution (`effectId`, `effect`, `active`, `target`). |

### Spec 26 / 26b — stance draft, the read, Conviction, Signature Skills, deckbuilding

A depth layer built **on top of** the Spec 25 Hazard engine (it does not replace
it). It turns each turn into a small read-and-commit decision and adds two
progression levers, keeping status effects the win path.

> "Spec 26b" (stance draft / Conviction / Signature Skills / deckbuilder) is
> in-flight scaffolding carried in via PR #184; it has no spec file of its own
> yet, and is distinct from
> [`specs/26-catalyst-multiplicative-scaling.md`](../specs/26-catalyst-multiplicative-scaling.md).

- **Stance draft + the read.** Each turn rolls a small pool of dice
  (`TURN_DICE_COUNT`); the player **drafts** one as their stance — the unpicked
  die is not wasted (it grants Conviction and can carry forward). The enemy's
  phase stance is hidden behind a thematic hint; the drafted die's color is the
  player's **read** of it. A winning read (`resolveRead` → `advantage`)
  multiplies the HP damage of cards played that turn (the read bonus scales the
  direct-damage fraction), and a card whose stance matches the drafted die color
  earns a flat `COLOR_MATCH_DAMAGE_BONUS` HP damage. Reading the hidden stance is
  therefore the primary lever for amplifying card output — the doctrine path.
- **Conviction (◆).** A second resource that accrues from the unpicked draft die
  (`CONVICTION_PER_UNPICKED_DIE`) and from winning the read
  (`CONVICTION_READ_WIN_BONUS`). It funds Signature Skills.
- **Signature Skills.** A small, **always-available** kit (`SIGNATURE_SKILLS`,
  `SIGNATURE_KITS`, biased per `playerArchetype`) independent of the shuffled
  deck — the reliable plan through a bad draw. Played via `playSignatureSkill`,
  gated on Conviction.
- **Deckbuilding.** After a won combat, `rollCombatCardRewards` offers a
  1-of-N card draft (archetype-biased) that `addRewardCard` appends to the
  player's persistent collection. New *skills* (a new card type) are unlocked
  rarely via ethical-dilemma events through the `unlockSkillViaDilemma` hook;
  a new player starts with `STARTING_SKILL_ID` only.

| Function / Type | Description |
|-----------------|-------------|
| `startTurn` / `endTurn` | Open a turn (roll the draft pool) / close it (resolve carry + upkeep). |
| `draftStanceDie(state, dieId)` / `getDraftedDie` / `chooseDraft` | Commit one die as the stance; read the committed die. |
| `resolveRead(dieColor, enemyStance)` → `CombatReadResult` | The drafted die vs the hidden enemy stance: `advantage` / `neutral` / `disadvantage` / `none`. |
| `isPhaseStanceRevealed` / `revealedCurrentStance` | Whether (and what) the enemy's hidden stance is now known. |
| `cardReadPreview` / `projectCardImpact` | UI previews — a card's read result + color match, and its projected HP impact. |
| `discardCombatCard` | Discard a card from hand (tempo/sculpting). |
| `playSignatureSkill(state, id, ...)` / `getSignatureSkill` | Spend Conviction on an always-available Signature Skill. |
| `SIGNATURE_SKILLS` / `SIGNATURE_SKILL_LIST` / `SIGNATURE_KITS` / `signaturesForArchetype` / `playerArchetype` | The signature kit catalogue + per-archetype selection. |
| `rollCombatCardRewards` / `addRewardCard` / `COMBAT_REWARD_POOL` | Post-combat deckbuilder draft + persist. |
| `unlockSkillViaDilemma` / `STARTING_SKILL_ID` / `STARTING_SKILL_IDS` | Forward hook for ethical-dilemma skill unlocks; the new-player starting card (`STARTING_SKILL_ID = 'slippery-slope'`). `STARTING_SKILL_IDS` is the preferred array (`['slippery-slope', 'brace-for-impact']`) that also grants the baseline GUARD defense card — use this to seed `knownSkills` for a new character. |
| `READ_DAMAGE_MULT`, `CONVICTION_PER_UNPICKED_DIE`, `CONVICTION_READ_WIN_BONUS`, `COLOR_MATCH_DAMAGE_BONUS`, `TURN_DICE_COUNT` | Tuning constants for the read / Conviction / draft economy. (`READ_PRESSURE_MULT` / `COLOR_MATCH_PRESSURE_BONUS` were renamed 2026-06-22 on HP-model landing.) |
| `rollTurnDice` / `dieHasStance` / `deriveIntentType` | Draft-pool roll + stance helpers. |
| `AUTHORED_THREAT_ENEMY_IDS` | Read-only array of every enemy slug that has a deterministic authored threat sequence (i.e. keys of `combat.threat-sequences.ts`). Length = 61 at `v0.32.0`. |
| `getThreatSequence(enemy)` | Returns the threat phase sequence for an enemy: explicit `enemy.threatSequence` wins; otherwise an authored sequence keyed by enemy id; otherwise the generated default. |
| `generateDefaultThreatSequence(enemy)` | Generates a 3-phase fallback threat sequence from the enemy's dominant stance, rotating through Heart / Body / Mind. Used automatically by `getThreatSequence` when no authored sequence exists. |
| `rerollSpentDice(state, rng?)` / `hasRerollableDice(state)` / `dieIsRerollable(die)` | PR #190 — partial Press Fate re-roll: re-rolls only spent/exhausted + dead `x`-face dice, leaving usable dice in play. A no-op (refunds Conviction) when nothing is rerollable. |
| `THREAT_WEAKEN_PER_ROLL` / `THREAT_DENY_AT` / `THREAT_WEAKEN_FLOOR` | Soft-control and stat-debuff threat tunables (0.33.0). Each point of enemy roll penalty (from confusion, fear, blind, slow, accuracy/attack-down etc.) reduces the incoming hit by `THREAT_WEAKEN_PER_ROLL` (default 0.06). When the cumulative roll penalty reaches `THREAT_DENY_AT` (default 8), the turn is fully denied (same as hard control). `THREAT_WEAKEN_FLOOR` (default 0.4) clamps the minimum damage multiplier for a weakened-but-not-denied enemy. Read these to display soft-control thresholds in the UI. |
| `COMBAT_DECK_PRESETS` / `COMBAT_DECK_PRESET_ORDER` / `listDeckPresets()` / `getDeckPreset(id)` / `buildPresetDeck(id)` | PR #190 — five named preset decks (Erosion, Saturation, Bulwark, Onslaught, Generalist), each with a single design focus. `buildPresetDeck` appends the synthetic Retreat baseline and is ready to feed `initializeCombatEncounter`. |
| `CombatDeckPreset`, `CombatDeckFocus` | PR #190 type exports — `CombatDeckPreset` describes a single named preset deck entry (id, label, focus, cardIds); `CombatDeckFocus` is the discriminated string union of the five design-focus tags (`erosion` / `saturation` / `bulwark` / `onslaught` / `generalist`). Both are importable as `import type { CombatDeckPreset, CombatDeckFocus } from 'axiomancer-mechanics'`. |
| `CardDieCost` | Die-cost helper type — `{ cost: number; advantage: boolean }` returned by `resolveCardDieCost` and `cardDieCostPreview`. Importable as `import type { CardDieCost } from 'axiomancer-mechanics'`. |
| `CombatIntentType`, `CombatReadResult`, `SignatureSkill`, `SignatureSkillId`, `SignatureSkillKind`, `PlayerArchetype` | The depth-layer type family. |

### Phase 169 — Curated Combat Loadout

Replaces `buildCombatDeck = knownSkills + Retreat` with a **player-shaped curated loadout**
persisted on `GameState.flags` via a `combat-loadout-card:` prefix codec (mirroring the
Hazard deck-flags pattern). When no loadout flags are present the engine falls back to
`knownSkills` for full backwards compatibility with pre-169 saves.

`createNewGameState()` seeds the loadout with `STARTING_SKILL_IDS` so a fresh character
always has a valid curated loadout from first boot.

`isCombatSynergySatisfied` is a pure read-only helper for mobile: pass a `CombatCard` in
hand and the enemy's current `ActiveEffect[]` — it returns `true` when the card's backing
skill has a `CardSynergy.predicate` that is currently satisfied (target-side only; caster-
side predicates return `false` here and are resolved at execution time inside `executeSkill`).

| Function / Constant | Description |
|---------------------|-------------|
| `getCombatLoadout(flags)` | Decodes the ordered loadout (card ids) from `GameState.flags`. Returns `[]` when no loadout flags are present (caller falls back to `knownSkills`). Alias of `decodeCombatLoadout`. |
| `addToLoadout(flags, cardId)` | Returns a new flags array with `cardId` appended to the loadout. No-ops when the loadout is at `COMBAT_LOADOUT_MAX` (20) capacity. |
| `removeFromLoadout(flags, cardId)` | Returns a new flags array with the first occurrence of `cardId` removed. No-ops when the card is not in the loadout. |
| `decodeCombatLoadout(flags)` | The low-level decode function (same as `getCombatLoadout`). Prefer the alias. |
| `COMBAT_LOADOUT_FLAG_PREFIX` | The flag prefix used for loadout entries: `'combat-loadout-card:'`. |
| `COMBAT_LOADOUT_MAX` | Maximum loadout size: `20`. |
| `buildCombatDeck(player, flags?)` | Extended signature (Phase 169). When `flags` contains loadout entries the curated list is used; otherwise falls back to `player.knownSkills`. Reward cards and the synthetic baseline are always appended. |
| `isCombatSynergySatisfied(card, enemyEffects)` | Pure read-only combo-live helper. Returns `true` when the card's `CardSynergy.predicate` (target-side) is satisfied by the enemy's current `ActiveEffect[]`. Use this to decide whether to render a combo glow on a card in hand. |

The whole roster is now authored for this system: `combat.threat-sequences.ts`
ships a deterministic, fully-telegraphed threat pattern for all 61 library
enemies (each phase declares a hidden stance, a damage weight, and optional
threat debuffs). `combat.threat.ts` scales threat damage by level + difficulty
(`DIFFICULTY_MULT`), and status DoT erodes the enemy's sole HP bar far faster
than the weak basic strike — status is the efficient win path.

### 0.34.0 — Status-depth epic: HP-model selectors + tunable scalars

The 0.34.0 release adds a set of HP-model read-only selectors and tunable
scalars used by the status-depth card mechanics (RUPTURE, COMPOUND, DISRUPT,
EXECUTE, VULNERABLE, SIPHON) and by mobile for hit-preview rendering.

| Function / Constant | Description |
|---------------------|-------------|
| `getDamageTakenMultiplier(target)` | Incoming-damage multiplier for a combatant, given active Vulnerable or similar effects. |
| `getPendingDotTotal(target)` | Sums pending DoT damage across all active DoT effects — the raw value used by AMPLIFY burst. |
| `consumeDotEffects(target)` | Removes all active DoT effects and returns the total damage consumed. Used by RUPTURE to convert stacked DoT into a single burst. |
| `getDistinctDebuffCount(target)` | Counts the number of distinct active debuff effect types on the target. Drives COMPOUND damage scaling (capped at `COMPOUND_COUNT_CAP`). |
| `getDistinctControlCount(target)` | Counts the number of distinct active control effects. Drives DISRUPT — when ≥ `DISRUPT_DENY_AT` the target's next action is denied. |
| `VULNERABLE_MAX_MULT` | Maximum incoming-damage multiplier cap when Vulnerable is active. |
| `RUPTURE_BURST_CAP` | Maximum HP burst from a single RUPTURE consume. |
| `COMPOUND_COUNT_CAP` | Maximum distinct debuff count credited by COMPOUND. |
| `DISRUPT_DENY_AT` | Distinct-control-effect threshold at which DISRUPT denies the next enemy action. |
| `EXECUTE_DAMAGE_FRACTION` | Fraction of enemy max HP dealt by EXECUTE when the threshold is met. |
| `getEnemyIncomingDamageMultiplier(target)` | Combined incoming-damage multiplier for mobile hit-preview rendering (Vulnerable × any other modifiers). |
| `getDisruptMeter(target)` | Returns `{ current, threshold }` — current distinct control count vs. `DISRUPT_DENY_AT`, for a UI progress bar. |
| `projectRupture(target)` | Preview burst HP damage from consuming current DoT effects (does not consume). |
| `isExecuteReady(target)` | Whether the target's current HP is at or below the Execute HP threshold. |
| `projectExecute(target)` | Preview Execute damage (`EXECUTE_DAMAGE_FRACTION × maxHp`). |
| `projectSiphonHeal(caster, roll)` | Preview Siphon heal amount given the caster's current state and the roll result. |
| `getDotAmplificationByEffect(effectId, target)` | Per-effect amplification factor from active Phase 142 combos (used for detailed UI attribution). |
| `getActiveDotTotal(target)` | Total active DoT damage per round (sum of all ticking effects' `dotEnd` values). |
| `getActiveDotAmplifications(target)` | List of active `ActiveDotAmplification` entries for per-effect UI breakdown. |
| `PendingDotEntry` | Type: one entry from `getPendingDotTotal` breakdown — `{ effectId, damage }`. |
| `ActiveDotEntry` | Type: one ticking DoT entry — `{ effectId, dotPerRound }`. |
| `ActiveDotAmplification` | Type: one amplification entry — `{ effectId, amplificationFactor }`. |

### 0.35.0 — Depth-epic tunables: read-scales-status + escalation clock

The 0.35.0 release adds four public tunables that give the stance-read and the
escalation clock their consumer-facing surface.

| Constant | Description |
|----------|-------------|
| `READ_STATUS_MULT` | `Record<CombatReadResult, number>` — stance-read scales the magnitude of a landed status effect (DoT damage, control intensity, debuff intensity). Values: `advantage` 1.34 / `neutral` 1.0 / `none` 1.0 / `disadvantage` 0.75. Gentler than `READ_DAMAGE_MULT` (1.5/0.5) so reading adds texture without swinging fights wildly. Tuned by `/combat-tuning`. |
| `THREAT_ESCALATION_PER_ROUND` | Per-round escalation step added to the incoming-threat damage multiplier for each round past the grace window (default 0.22). The escalation formula is `min(THREAT_ESCALATION_MAX, 1 + escalationRate × roundsPastGrace)` where `escalationRate = THREAT_ESCALATION_PER_ROUND × (isBoss ? THREAT_ESCALATION_BOSS_MULT : 1)`. |
| `THREAT_ESCALATION_GRACE` | Rounds of grace before the clock starts — a fast clean kill is unpunished (default 1). |
| `THREAT_ESCALATION_MAX` | Cap on the escalation multiplier so a long grind ramps but never runs away into a one-shot (default 2.0). The counters are on-vision: race the foe down (DoT) or deny its turns (control) to skip escalated hits. |
| `THREAT_ESCALATION_BOSS_MULT` | Boss/unique enemies escalate at `THREAT_ESCALATION_PER_ROUND × THREAT_ESCALATION_BOSS_MULT` per round (default 1.6). Makes long boss fights qualitatively more lethal than equivalently long normal fights — incentivises finishing bosses quickly via DoT or denying their turns via control. Normal/elite enemies use the base rate (multiplier 1.0). |

All five are exported from `src/Combat/combat.engine.ts` and re-exported via
the root barrel. Used by `resolveCombatPhase`; consumers read them to render
the escalation clock UI (e.g. showing current multiplier vs. cap, and surfacing
the boss-tier escalation warning).

### Phase 167/168 — Sim status-engagement metrics + AMPLIFY mechanic + Conclusion sig

Phase 167 extends `CombatSimStats` (returned by `simulateHazardPatternCombat`)
with five doctrine-critical fields that make "low status-engagement = balance
failure" mechanically enforceable by `/combat-tuning`. Phase 168 adds the AMPLIFY
burst mechanic (reads pending DoT × multiplier without consuming effects). The
Conclusion sig-skill redesign adds `CONCLUDE_DMG_PER_STACK` for the BODY
archetype's stack-based finisher.

#### CombatSimStats extensions (Phase 167)

| Field | Type | Description |
|-------|------|-------------|
| `dotHpFraction` | `number` | Fraction of total enemy HP loss delivered by DoT ticks (0–1). Doctrine witness: DoT should be the primary damage source in status builds. |
| `strikeFraction` | `number` | Fraction of total enemy HP loss from direct strikes (excluding mechanic bursts) (0–1). |
| `mechanicBurstFraction` | `number` | Fraction of total enemy HP loss from mechanic bursts (rupture/execute/compound/conclude) (0–1). |
| `guardMitigatedFraction` | `number` | Guard availability ratio: guard present when enemy threat fired / (guard + player HP damage taken). Proxy for how often GUARD was relevant. |
| `avgActiveEffectsPerPhase` | `number` | Mean count of active effects on the enemy at the start of each threat phase. Doctrine witness: a loaded status board = the engine working as intended. |

`CombatSimPolicyId` (`'greedy' | 'blind'`) is the policy discriminator passed to
`simulateHazardPatternCombat`; export it as a named type when you need to annotate
a policy variable: `import type { CombatSimPolicyId } from 'axiomancer-mechanics'`.

#### AMPLIFY mechanic constants (Phase 168)

| Constant | Default | Description |
|----------|---------|-------------|
| `AMPLIFY_DEFAULT_MULTIPLIER` | `1.5` | Default multiplier for the AMPLIFY card mechanic — reads pending DoT × multiplier and fires as an HP burst WITHOUT consuming the DoT effects (DoT keeps ticking). |
| `AMPLIFY_BURST_CAP` | `60` | Maximum HP burst from a single AMPLIFY play. |

Cards that carry AMPLIFY: `crescendo-of-suffering` (heart, ×1.5, lv6) and
`the-inevitable` (mind, ×2.0, lv10). The mechanic is distinct from RUPTURE which
consumes DoTs; AMPLIFY is the build-then-detonate path.

#### Conclusion sig constant (Conclusion rework)

| Constant | Default | Description |
|----------|---------|-------------|
| `CONCLUDE_DMG_PER_STACK` | `2` | Damage dealt per stack of any active effect on the enemy when the Conclusion Signature Skill fires. `sig-conclusion` (BODY archetype capstone, cost 6) deals `CONCLUDE_DMG_PER_STACK × Σ(effect.intensity)` damage — the more intensely status-loaded the enemy, the harder Conclusion hits. |

## Pending

The Spec 02 / 03 / 04 / 05 work this section used to track has
shipped. Combat is exercised end-to-end via `resolveCombatRound`
through the six `Combat/phases/` files; skill and item actions live in
`phases/scenario.ts`; Tier 2/3 procs are in `Combat/combat-effects.ts`.
The CLI log utilities were dropped when Phase 17 unified the CLI
surface around `npm run game` — no log strings exist in the engine
today; consumers render directly from the typed `RoundEvent` stream.

### Landed in Spec 02

- `resolveCombatRound` (in `combat.resolver.ts`) replaces the CLI's inline
  attack / defend math; the CLI is now UI-only.
- Typed `RoundEvent` stream emitted alongside the new state for UI rendering.
- `canAct` / `getActiveEffectModifiers` are wired through the resolver.
- Symmetric defense (Q3): both player and enemy defenders now route through
  `getDefenseStat` instead of the asymmetric base-stat path the CLI used to
  use for the player.
