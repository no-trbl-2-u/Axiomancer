# Combat

## Overview

**Hazard-Pattern Combat (Spec 25) is the ONLY combat engine** — consumed by the mobile
app, driven by the combat CLI (`npm run combat`), and exercised by the `/combat-playtest`
and `/deck-tuning` loops. It is a card-and-dice system where the enemy's sole bar is
VITAE. Direct damage, damage-over-time, walls-and-reprisal, control, harvest and the
mercy lines are all first-class ways to empty it — none is the doctrinal path (THE BIG
NUMBERS REWRITE, 2026-09-02).
See [§Hazard-Pattern Combat](#hazard-pattern-combat-spec-25) below for the full API surface,
and [§Scale](#scale--the-numbers-the-big-numbers-rewrite-2026-09-02) for the live formulas.

> **Removed:** the legacy turn-based resolver (`resolveCombatRound` and its companions
> `determineEnemyAction` / `isCombatOngoing` / `determineCombatEnd` /
> `getEffectsResolutionOutcome`) has been deleted from the codebase. All consumers drive
> fights via `initializeCombatEncounter` / `playCombatCard` / `resolveCombatPhase`.

The shared combat mechanics live in:

- `Combat/index.ts` — module barrel + small mechanics helpers (advantage, stats, dice, damage, health, effect queries).
- `Combat/combat.reducer.ts` — `initializeCombat`, the `CombatState` constructor shared by the card / effects / equipment engines, plus `incrementFriendship`.
- `Combat/combat.engine.ts` — the Hazard-Pattern Combat driver (see §Hazard-Pattern Combat below).

The sections that follow document the shared mechanics (stances, advantage,
effects, procs, damage resistance, the friendship path) that both the card /
effects engines and the Hazard-Pattern driver consume.

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
| `card` | Use a learned/unlocked card that is currently affordable (Spec 04 / 04b; legacy equipped gate removed in Phase 98) |
| `item` | Use an inventory consumable (Spec 05 / 05b) |
| `flee` | Attempt to escape |
| `spare` | Phase 108 — mercy choice to spare/befriend the enemy (sets `friendshipResolutionAuthorized`) |
| `exploit` | Phase 108 — mercy choice to exploit the opening for a free critical attack |

## Combat Phases

`choosing_stance` → `choosing_action` → `choosing_skill` → `mercy_choice` → `resolving` → `ended`

The `mercy_choice` phase activates after a successful Befriend card cast, presenting
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

## Tier 1 Auto-Effects

> **Superseded (2026-09-23):** the stance attack/defend auto-effect loop below belongs to the removed turn-based resolver; `combat.engine.ts` does not call `applyTier1CombatEffect` / `clearTier1EffectsForStance` — live truth: src/Combat/combat.engine.ts, src/Effects/index.ts. Body kept as a historical record pending rewrite (plan/AUDIT.md).

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

These are live engine helpers in `src/Combat/effects.ts` (no CLI inline math — the CLI just renders the events the engine emits):

| Mechanic | When | What |
|----------|------|------|
| **Study Mark** (Mind/Attack) | Before damage roll | `getStudyMarkIntensity(enemy)` → added to damage roll as bonus |
| **Thorns Reflect** (Body/Defend) | After any hit on the bearer | `getThornsReflect(bearer)` → sums `reflectDamage × intensity`; dealt back to attacker |
| **Heart/Attack — strip buff** | On hit | `removeRandomBuff(enemy)` → one random enemy buff removed |
| **Heart/Attack — extend buff** | On hit | `extendRandomBuffDuration(player, 1)` → one random player buff gets +1 duration |
| **Heart/Attack — roll penalty** | Roll phase | −5 to the player's attack modifier |

## Spec 03 — Tier 2 / Tier 3 Effect Procs

> **Superseded (2026-09-23):** the proc matrix below is not read by live Hazard-Pattern combat (see the legacy note that follows) — live truth: src/Combat/combat.engine.ts, src/Combat/combat-effects.ts. Body kept as a historical record pending rewrite (plan/AUDIT.md).

> **Legacy subsystem.** This basic-attack/defend proc engine is not wired into
> live Hazard-Pattern combat (`combat.engine.ts` does not read it). Its runtime
> functions have no live callers, and most of the effects the matrix below named
> were retired with the 2026-07 unused-effect cleanup, so `combat-effects.library.json`
> was reduced to the few triggers whose effects still resolve. The `ProcUnlocks` /
> `ProcOverrides` / `CombatEffectTrigger` *types* survive because `Character` /
> `Enemy` still carry the fields. Kept as design history; the matrix below is the
> pre-cleanup shape.

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
| Mind / Attack | `debuff_affirming_consequent` (opponent, 10%) | `debuff_confusion` (opponent, 18%) | `debuff_petrify` (opponent, 6%) | `debuff_affirming_consequent` |
| Mind / Defend | `buff_gettiters_flicker` (self, 10%) | `buff_resistance_mind` (self, 15%) | `buff_haste` (self, 5%) | `debuff_affirming_consequent` |
| Heart / Attack | `debuff_straw_man_echo` (opponent, 10%) | `debuff_fear` (opponent, 18%) | `debuff_petrify` (opponent, 6%) | `debuff_straw_man_echo` |
| Heart / Defend | `buff_petitio_pulse` (self, 10%) | `buff_resistance_heart` (self, 15%) | `buff_invincibility` (self, 5%) | `debuff_straw_man_echo` |

**Enemy customisation (Q7)** — `Enemy.procOverrides` swaps the entire cell's table wholesale (used for bosses with signature procs and elite / basic enemies whose tables depend on the encounter map). `Enemy.procUnlocks` raises the per-cell tier cap independently.

**Switching (Q5)** — out of scope for this spec. The card engine (Spec 04) will hook switching into a different effect pool; basic procs do not currently apply a switching multiplier.

## Effect Application Rules (`resolveEffectApplication`)

| Tier | Rule |
|------|------|
| **Tier 1** | Auto-applies. No roll made. |
| **Tier 2 Buff** | Caster d20: natural 1 = fumble (buff fails, `buff-fumbled` event). Natural 20 = crit focus → 2× intensity. Any other = auto-succeeds. |
| **Tier 2 Debuff** | **Always lands.** No target-resist roll. No rebound. No overwhelmed. (Phase 80 — direction (a) pure split.) |
| **Tier 3** | **Always lands.** Inescapable. (Phase 80 — Nat-20 escape removed.) |

See `docs/effects.md` for the full per-tier breakdown and stacking rules.

## Damage Resistance (Phase 93)

> **Superseded (2026-09-23):** `calculateSkillDamage` no longer exists; direct damage is the `DEAL` mechanic resolved in the combat engine — live truth: src/Combat/combat.engine.ts, src/Combat/combat.cards.ts. Body kept as a historical record pending rewrite (plan/AUDIT.md).

Phase 93 completes Phase 80's direction (a) "pure split": effects always land (Phase 80), damage applies resistance separately (Phase 93).

Cards now apply damage resistance based on the target's stats:
- **Physical damage** (body-scaling cards) → reduced by target's body stat
- **Mental damage** (mind-scaling cards) → reduced by target's mind stat  
- **Emotional damage** (heart-scaling cards) → reduced by target's heart stat

**Linear resistance model:** Each point of resistance stat reduces damage by 1.
**Minimum damage:** Damage is clamped to at least 1 (high resistance reduces but never completely negates damage).

```typescript
// Physical card against high-body target
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

> **Superseded (2026-09-23):** the seven enemies in the table below (MournfulGull, HollowEyedBeggar, TideflukeReaver, HushWraith, HollowSaint, …) are no longer in the roster; `friendshipReward` is authored on 11 current entries — live truth: src/Enemy/enemy.library.ts. Body kept as a historical record pending rewrite (plan/AUDIT.md).

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
| `requiredCardUse?: string[]` | Player must have cast at least one of the named card IDs during combat (existential). Derived from `state.log[].playerAction` entries with `action === 'card'`. Empty array = no requirement. |
| `defaultFallback?: 'both-defend-cap'` | Explicit "fall through to Phase 36". When set, other fields are ignored for THIS enemy; eligibility uses the global counter cap exactly. |

The engine helper that evaluates the predicate lives in
`src/Combat/index.ts` (the private `befriendabilityPredicatesPass`,
consumed by `isBefriendAttemptEligible`). The legacy combat-end
predicates that also consumed it (`determineCombatEnd` /
`isCombatOngoing` / `isFriendshipEligible`) were removed with the
legacy turn-based driver.

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

1. **Explicit Befriend card cast** — the player must actively use the
   Befriend card (5 heart tokens) when the enemy is vulnerable.
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

Friendship resolution keys off
`state.friendshipResolutionAuthorized === true` rather than counter/config
predicates directly. In Hazard-Pattern Combat the mercy choice is opened via
`selectEncounterMercyChoice`; the legacy `isFriendshipEligible` /
`determineCombatEnd` predicates were removed with the legacy driver.

## Combat End Conditions

In Hazard-Pattern Combat the enemy's sole bar is VITAE: `isDefeated(enemy)` is
the main win condition, player VITAE ≤ 0 is the loss, and the `friendship`
outcome requires the explicit Befriend + `spare` authorization above. The
authored alt-wins (RELENT via PLEA, CONDEMN via CHARGE) end fights beside it —
since 2026-09-02 they are ordinary design tools, not exceptions to a
one-win-condition law. (The legacy `determineCombatEnd(state)` predicate was
removed with the legacy driver.)

### Effects-Driven Resolution (Phase 125 — removed)

Phase 125's `getEffectsResolutionOutcome(state)` (Saturation Yield → friendship,
DoT Erosion → victory) was a legacy-resolver mechanic and was removed with the
legacy driver. In Hazard-Pattern Combat the same doctrine is served directly by
the HP model: DoT erodes the enemy's sole HP bar, control denies its telegraphed
turns, and the escalation clock punishes stalling.

## Battle Log

`CombatState.log: BattleLogEntry[]` is an opt-in coarse summary slot from
the pre-Phase-9 combat design. The `BattleLogEntry` shape remains exported
for consumers that want the summary shape:

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

The live per-encounter signal that consumers actually subscribe to is the
`CombatEvent[]` stream returned by the Hazard-Pattern engine transitions
(`playCombatCard`, `resolveThreatPhase`, `processBetweenPhases`, ...).

## Combat Reducer API

Defined in `src/Combat/combat.reducer.ts`. These are small, single-concept
state-shape mutations. (The legacy per-round reducer verbs — `setPhase`,
`setPlayerStance`, `setPlayerAction`, `appendLog`, `endCombat` — were removed
with the legacy driver.)

| Function | Alias(es) | Description |
|----------|-----------|-------------|
| `initializeCombat(player, enemy)` | — | Creates fresh CombatState with deep-cloned combatants — the `CombatState` constructor shared by the card / effects / equipment engines |
| `incrementFriendship(state)` | — | Increments the friendship counter |

## Combat Mechanics API

> **Superseded (2026-09-23):** `rollSkillCheck` and `getSkillDamageType` below no longer exist (the stat / advantage / crit helpers are still exported but the attack contest that used them went with the turn-based resolver) — live truth: src/Combat/index.ts, src/Combat/combat.engine.ts. Body kept as a historical record pending rewrite (plan/AUDIT.md).

| Function | Description |
|----------|-------------|
| `determineAdvantage(attacker, defender)` | Returns advantage relationship |
| `getAdvantageModifier(advantage)` | Returns +2 / 0 / −2 |
| `hasAdvantage(attacker, defender)` | Boolean shorthand |
| `getBaseStat(entity, stance)` | Raw base stat for a stance |
| `getAttackStat(entity, stance)` | Attack derived stat for a stance |
| `getDefenseStat(entity, stance)` | Defense derived stat for a stance |
| `getSaveStat(entity, stance)` | Save stat for a stance (enemies fall back to defense) |
| `getEffectiveStats(entity).baseStats[resistedBy]` | Base stat used when resisting an effect |
| `rollSkillCheck(baseStat, advantage)` | d20 + modifier with advantage/disadvantage |
| `calculateFinalDamage(base, reduction, crit, bonus)` | Damage after reductions. On crit, picks the higher of `double` (2× base − defence) vs `pierce` (base, defence ignored) — Phase 32 auto-selection. |
| `selectCritDamage(base, reduction, bonus)` | Phase 32 — returns `{ style, damage }` for the crit auto-selection in isolation, useful for tests / future damage previews. |
| `calculateDamageResistance(target, baseDamage, damageType)` | Phase 93 — applies target's resistance to damage (linear reduction, minimum 1) |
| `getSkillDamageType(scalingStat)` | Phase 93 — maps card scaling stat to damage type for resistance calculation |
| `applyDamage(entity, damage)` | Reduces HP (clamps to 0) |
| `heal(entity, amount)` (alias `healCharacter`) | Restores HP (clamps to max) |
| `resolveEffectApplication(target, effect, type, heart, equip)` | Effect application (Tier 2 buff fumble/crit; Tier 2 debuff + Tier 3 always land) |
| `tickAllEffects(target)` | Decrements all effect durations |
| `getStudyMarkIntensity(target)` | Mind mark bonus for damage |
| `getThornsReflect(bearer)` | Thorns reflect damage total |
| `removeRandomBuff(target)` | Strips one random buff |
| `extendRandomBuffDuration(target, amount)` | Extends one random buff |
| `applyRegen(target)` | Sums and applies all regen effects |
| `getActiveRollModifier(target)` | Sums all `rollModifier` + `rollModifierPerIntensity × intensity` across active effects — flat roll-mod total consumed by the combat engine |
| `canAct(effects, requestedStance?)` | Action-restriction gate — returns `{ canAct, resolvedStance, reason }` reflecting forced/blocked-stance and skipTurn constraints |
| `isAlive(combatant)` | True if `health > 0` |
| `isDefeated(combatant)` | True if `health <= 0` — the main win condition for Hazard-Pattern Combat |
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
| `CombatPhase` | `'choosing_stance' \| 'choosing_action' \| 'mercy_choice' \| 'resolving' \| 'ended'` — the state-machine phase of a turn-based combat encounter |
| `AggregatedEffectModifiers` | Summed numeric modifiers from all active effects; consumed by `getEffectiveStats` |
| `EffectiveStats` | `{ baseStats, derivedStats, nonCombatStats, defenseDelta }` — combatant stats after all active-effect modifiers are applied; produced by `getEffectiveStats` |
| `DamageType` | `'physical' \| 'mental' \| 'emotional'` — damage category used by resistance calculations |
| `Combatant` | `Character \| Enemy` — the union type for any participant in a combat encounter |
| `BattleLogEntry` | Per-round log record (`round`, `playerAction`, `enemyAction`, `advantage`, rolls, damage fields, `result`) stored in `CombatState.log` |

## Card terminology

> **Superseded (2026-09-23):** the naming-collision note below cites `SKILLS_LIBRARY` / `triggerCombatSkill`, which no longer exist; there is one card library — live truth: src/Cards/cards.library.ts, src/Cards/card.engine.ts. Body kept as a historical record pending rewrite (plan/AUDIT.md).

The combat deck is built from **cards** (`knownCards`): a card is a Hazard-style
combat entity in the deck/hand/reward loop — free/powered action halves, a stance
color, a die cost, and draw/discard/deck cadence. A card in hand is projected from
a library `Card` via `toCombatCard`; the engine resolves its powered action through
`executeCard`.

The word **"skill"** in combat now refers ONLY to **Signature Skills** — the
Conviction-funded, always-available kit (`SIGNATURE_SKILLS` in
`combat.signature.ts`), independent of the shuffled deck. Everything the player
draws and plays is a card.

> **Naming collision warning (2026-07):** the table above is the *legacy*
> "Card" — `Cards/card.engine.ts`'s card-resolution engine (confusingly
> named; a "card" here is a card source, projected into play via
> `toCombatCard`). A second, unrelated **Cards system** (`src/Cards/`,
> `SKILLS_LIBRARY`, `triggerCombatSkill`) now also exists — see the next
> section. The two are NOT the same concept; when reading "card" in this
> codebase, check which module it's coming from.

## Card Doctrine, the Cards/Token System, and Wild-Die Growth

Product-owner decisions layered onto Hazard-Pattern Combat (full detail in the
card library files themselves, not duplicated here):

- **Direct damage is a first-class verb (THE BIG NUMBERS REWRITE,
  2026-09-02).** `DEAL` is a real `CardSpecialMechanic`
  (`{ kind: 'deal'; amount; hits?; pierce? }`) that scales with the read, the
  colour match and the combat-long scalers like every other verb; `hits`
  makes it a multi-hit whose instances each trigger damage-instance DoTs and
  each eat the foe's HIDE. The historical `basePower` / `chipHp` fields stay
  deleted <!-- lexicon-ok: base-power, chip-hp --> — `DEAL` replaces them, it
  does not restore them. `calculateSkillDamage` is kept only for call-site
  compatibility (sim policies / projections still call it) and unconditionally
  returns `0`. DoT ticks, affliction-payoff bursts (RUPTURE / REAP),
  engine-gated drips (BACKFIRE, persistent-card hooks) and reflect (THORNS /
  RIPOSTE) are all still live VITAE sources; they now compete with `DEAL`
  rather than substituting for it. The prior no-strike accounting in
  [`specs/32-no-strike-card-library.md`](../specs/32-no-strike-card-library.md)
  is historical, as are its 70-card / 10-theme / "exactly 30 keywords" /
  rank-band pricing rules. `cards.pricing.ts` survives as an **advisory**
  scorer, not a gate.
- **Rank / rarity / card-type axes (Spec 32 v3; spec 34 R-9/R-10/R-14).**
  Every card carries a `rank: CardRank` (1 Ash · 2 Tooth · 3 Splinter ·
  4 Rib · 5 Skull · 6 Saint — quality axis, orthogonal to `tier` which
  stays the resist axis) and a `cardType: CardType` (`'spell' | 'oath' |
  'hex'` — `spell` plays straight to discard; `oath` /
  `hex` carry both a FREE and a PAID line). `rankToRarity(rank)`
  derives the display rarity band (`common` = 1-2, `uncommon` = 3-4,
  `rare` = 5-6) consumed by mobile via `CARD_RANK_NAMES`. This axis family
  replaced the old ad hoc "gold card" list (`GOLD_CARD_IDS` / `isGoldCard`
  — deleted; see the API table below).
- **Cards are a separate, always-on ability system — NOT cards.** Cards are
  drawn/played from the hand; **Cards** (`src/Cards/cards.library.ts`,
  `SKILLS_LIBRARY`) are triggered any time the player can afford their
  `CombatResources` token cost, independent of the current hand — see
  `Combat/combat.engine.ts`'s `triggerCombatSkill`. `SkillDefinition` (the
  catalogue) is deliberately separate from `getKnownSkills()` (what a given
  player currently has access to) so race/class/equipment gating can be added
  later without a rewrite; today `getKnownSkills()` returns everything with
  `requiresUnlock: null` (i.e. all of them). See the naming-collision warning
  just above — this is unrelated to the legacy `Cards/card.engine.ts`.
- **Wild-die cards are permanent pool growth, not a one-turn trick.**
  Playing a `grant_permanent_wild_die` card (`CardSpecialMechanic`) adds a
  Wild die to `CombatEncounterState.permanentWildDice` for the **rest of the
  encounter** — every subsequent turn's dice pool includes it (see
  `combat.engine.ts`'s `rollPermanentBonusDice` / `MAX_PERMANENT_WILD_DICE`).
  The engine hook is still live; no card in the current library authors it —
  a future card can pick it back up without engine work.

The canonical design record for the current library is
`plan/2026-09-02-big-numbers-overhaul.prompt.md` (the scale ladder, the keyword
language, the enemy model) alongside
[`specs/25-hazard-pattern-combat.md`](../specs/25-hazard-pattern-combat.md) for
the underlying engine loop. `specs/32-no-strike-card-library.md` is HISTORICAL.
`src/Cards/types.ts` / `card.engine.ts` carry the most complete
design rationale for the separate Cards system.

## Hazard-Pattern Combat (Spec 25)

**The only combat engine** (mobile map encounters, the combat CLI, the `/combat-playtest` + `/deck-tuning` loops).
A card-and-dice system structurally mirrored on the Hazard minigame: every verb is a
combat card, and the enemy's **sole bar is VITAE** — dropping it to 0 (`isDefeated(enemy)`)
is the main win condition, beside the authored alt-wins (Befriend, RELENT, CONDEMN).
Direct damage (`DEAL`), DoT ticks, affliction-payoff bursts, engine-gated drips and
reflect are all live VITAE sources and compete on merit; control denies the enemy's
telegraphed threat turn outright rather than merely discouraging a parallel damage
track. Full design:
[`specs/25-hazard-pattern-combat.md`](../specs/25-hazard-pattern-combat.md) for the
engine loop and `plan/2026-09-02-big-numbers-overhaul.prompt.md` for the current card
and enemy model (note: spec 25's two-pressure-track narrative was superseded by the
one-bar model 2026-06-22, and its status-primacy successor was repealed 2026-09-02 —
`VISION.md` → Combat vision is canonical).

The engine lives in `src/Combat/`:

- `combat.engine.ts` — phase loop (`resolveCombatPhase` / `playCombatCard` /
  `resolveThreatPhase` / `processBetweenPhases`), RPS die-cost scaling, the
  self-reinforcing die-refresh loop, and `buildCombatSummary`.
- `combat.dice.ts` — the four colored mana dice and their state machine.
- `combat.deck.ts` — Fisher-Yates shuffle + draw-up-to-`COMBAT_HAND_SIZE`.
- `combat.cards.ts` — the card→card adapter and verb classification.
- `combat.threat.ts` — authored + generated enemy threat sequences.
- `combat.encounter.sim.ts` — `simulateHazardPatternCombat`, a Monte-Carlo
  greedy bot used for balance evidence.

### Hazard-Pattern Combat API

| Function / Type | Description |
|-----------------|-------------|
| `initializeCombatEncounter(...)` | Builds the `CombatEncounterState` for a fight (deck, dice, threat sequence). |
| `rollEncounterDice(state)` | Rolls the colored mana dice at phase start. |
| `resolveCardDieCost(cardColor, enemyPhaseStance)` | Returns the `CardDieCost` for playing a card: `{ cost, advantage }`. Advantage if card stance beats the enemy phase stance (RPS), disadvantage if beaten, neutral otherwise. Wild/X dice always cost 1. |
| `COMBAT_DICE_COUNT` / `COMBAT_HAND_SIZE` / `COMBAT_DIE_FACES` | Spec 25 tuning constants: opening dice pool size (4), hand-size target (5 — keep-hand rule 2026-07-13: the round boundary keeps unplayed cards and refills the hand up to the target), and the die-face bag (`heart`/`body`/`mind`/`wild` at 1/6 each; `x` at 2/6). |
| `rollCombatDice(count?, rng?)` / `combatDieCanPower(die, cardColor)` / `refreshOneDie(dice, color)` | Dice helpers: roll the opening pool; check whether a die can power a card of a given color (wild powers any; x powers nothing unless flipped); refresh one spent die of a matching color back to available (self-reinforcing status loop, §4.7). |
| `toCombatCard(cardId, lookupSkill, lookupEffect)` / `projectDeck(cardIds, lookupSkill, lookupEffect)` | Card-view converters: project a single card (or synthetic card) into a `CombatCard` view, or an entire deck of ids into a `CombatCard[]` (unknown ids dropped). |
| `classifyVerbClass(card, lookupEffect)` | Classifies a card into a `CombatVerbClass` + `CardEffectKind` pair. Priority: DoT > control > stat-debuff > buff > direct-damage. Used by `toCombatCard` to generate top/bottom action text. |
| `buildCombatDeck(player)` | Assembles the player's combat deck from `knownSkills` + `combatRewardCards` (de-duped for the baseline, duplicates kept for reward cards). No escape card is appended — there is no in-combat retreat. Ready to feed `initializeCombatEncounter`. |
| `playCombatCard(state, cardId, dice)` | Plays one combat card, spending dice; lands its effects and deals HP damage via status/strike. |
| `resolveCombatPhase(state, cardsPlayed)` | Resolves a full player phase (card-play driven; replaces the per-round attack/defend resolution). |
| `resolveThreatPhase(state)` | Resolves the enemy threat phase (Clear / Overwhelmed ledger). |
| `processBetweenPhases(state)` | Between-phase upkeep — persistent buffs, die refresh, momentum carry. |
| `selectEncounterMercyChoice(...)` | Opens the Befriend mercy choice (Phase 112 logic intact). |
| `getCard` / `handCards` / `cardDieCostPreview` / `availableDice` | Read-only previews for a UI to render the hand and affordances. |
| `buildCombatSummary(state)` | End-of-fight `CombatSummary` with per-effect attribution rows. |
| `simulateHazardPatternCombat(...)` | Monte-Carlo greedy bot returning `CombatSimStats` for balance runs. |
| `CardEffectKind` | `'dot' \| 'control' \| 'none'` — the status-payload classification tag on every `CombatCard` (set by `classifyVerbClass`); drives the mobile card frame and deck-preset focus logic. The baseline GUARD defense card (`'brace-for-impact'`) is included in `STARTING_SKILL_IDS`. **`GOLD_CARD_IDS` / `isGoldCard` were deleted in Spec 32 v3** (2026-07-08) along with the three rare card ids they named — rarity is now derived from `rank` via `rankToRarity` (`rare` = rank 5-6), and the wild-die-auto-advantage-on-gold behavior was removed with them (a wild/x die is always neutral advantage now — see `resolveCardDieCost`). |
| `CombatEncounterState`, `CombatCard`, `CombatThreatPhase`, `CombatOutcome`, `CombatSummary` | The core encounter type family. (`CombatPressureTracks` was REMOVED 2026-06-22 — VITAE is the one bar.) `CombatCard.skillId` is the canonical field for the backing learned-card id (`string \| null`; `null` for synthetic cards, if any are ever added again). `CombatOutcome`/`CombatVerbClass` still list `'retreat'` as a union member for now (no live code path can produce it — no escape card exists) rather than risk an unverified type-cascade removal. Use `skillId` to trace a projected card back to its source card. |
| `CombatAttributionRow`, `LandedEffect` | Attribution sub-types for `buildCombatSummary`. `CombatAttributionRow` is a per-card row (`cardId`, `name`, `dotDamage`, `damageDealt`, `phases`); `LandedEffect` is a snapshot of one live effect used internally during attribution (`effectId`, `effect`, `active`, `target`). |

### Spec 26 / 26b — stance draft, the read, Conviction, Signature Skills, deckbuilding

A depth layer built **on top of** the Spec 25 Hazard engine (it does not replace
it). It turns each turn into a small read-and-commit decision and adds two
progression levers.

> "Spec 26b" (stance draft / Conviction / Signature Skills / deckbuilder) is
> in-flight scaffolding carried in via PR #184; it has no spec file of its own
> yet, and is distinct from
> [`specs/26-catalyst-multiplicative-scaling.md`](../../plan/archive/2026-09-25-trim-t1/axiomancer-mechanics/specs/26-catalyst-multiplicative-scaling.md) (archived 2026-09-25).

- **Stance draft + the read (dice-law rework 2026-07-09).** Each turn rolls
  `TURN_DICE_COUNT` (**3**) dice — an honest roll, no stance-die guarantee; the
  player **drafts** one as their stance. Every unpicked die converts to
  Conviction tokens: colored `+CONVICTION_PER_UNPICKED_DIE` (1), wild
  `+CONVICTION_PER_UNPICKED_WILD` (2), dead X `+0` (a card effect —
  `float_x_die`, the FORGE X→WILD sense — can turn a tray X into a wild
  floating die instead).
  The enemy's phase stance is hidden behind a thematic hint; the drafted die's
  color is the player's **read** of it. A winning read (`resolveRead` →
  `advantage`) multiplies the damage of cards played that turn
  (`READ_DAMAGE_MULT` 1.5 / 1.0 / 0.5). Floating dice bypass the one-die draft
  entirely: all of them may be spent in one round, each is consumed forever, and
  they never bank tokens.
- **The colour match is a MECHANIC, not a law.** A die powers a card of ITS
  colour — WILD (rendered gold) matches every card; an off-colour play fizzles
  in `playBottomAction` (`combat.engine.ts`). This is the default *rule of the
  dice economy*, not a design law: it was demoted from "THE COLOR LAW" by THE
  BIG NUMBERS REWRITE (2026-09-02), which kept the mechanic because it is what
  makes a preset's exact aspect thirds mean anything, while releasing the ban on
  exceptions. A keyworded off-colour play — an "ANY" card, an
  off-colour-at-half line — is legal to author if a design wants one.
  **Reward, rescaled 2026-09-02:** a colour-matched (or Wild) die now adds
  `colorMatchBonus(base)` = **+25% of the printed magnitude, minimum +2,
  rounded** (`COLOR_MATCH_BONUS_PCT = 0.25`, `COLOR_MATCH_BONUS_MIN = 2`) to a
  damage / guard / barrier number, replacing the old flat +3. A percentage
  keeps the match worth making on a GUARD 40 card as well as a GUARD 8 one.
  `COLOR_MATCH_DAMAGE_BONUS = 3` survives only as a deprecated alias for
  unmigrated call sites — call `colorMatchBonus()`. On a status card the match
  still adds `COLOR_MATCH_STATUS_DURATION_BONUS` (1) turn of duration instead.
- **Conviction (◆).** The generic token pool that accrues per unused rolled die
  (see the color law above) and from winning the read
  (`CONVICTION_READ_WIN_BONUS`). It funds Signature Skills.
- **Signature Skills.** A small, **always-available** kit (`SIGNATURE_SKILLS`,
  `SIGNATURE_KITS`, biased per `playerArchetype`) independent of the shuffled
  deck — the reliable plan through a bad draw. Played via `playSignatureSkill`,
  gated on Conviction.
- **Deckbuilding.** After a won combat, `rollCombatCardRewards` offers a
  1-of-N card draft (archetype-biased) that `addRewardCard` appends to the
  player's persistent collection. New *cards* (a new card type) are unlocked
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
| `unlockSkillViaDilemma` / `STARTING_SKILL_ID` / `STARTING_SKILL_IDS` | Forward hook for ethical-dilemma card unlocks; the new-player starting card (`STARTING_SKILL_ID = 'slippery-slope'`). `STARTING_SKILL_IDS` is the preferred array (`['slippery-slope', 'brace-for-impact']`) that also grants the baseline GUARD defense card — use this to seed `knownSkills` for a new character. |
| `READ_DAMAGE_MULT`, `CONVICTION_PER_UNPICKED_DIE`, `CONVICTION_PER_UNPICKED_WILD`, `CONVICTION_READ_WIN_BONUS`, `colorMatchBonus` / `COLOR_MATCH_BONUS_PCT` / `COLOR_MATCH_BONUS_MIN`, `TURN_DICE_COUNT`, `CONVICTION_CAP` | Tuning constants for the read / Conviction / draft economy. `READ_DAMAGE_MULT` = 1.5 / 1.0 / 0.5 (advantage / neutral / disadvantage), `TURN_DICE_COUNT` = 3, wild banks double, `CONVICTION_CAP` = 12. The colour-match reward is `colorMatchBonus(base)` = +25%, minimum +2 (2026-09-02); `COLOR_MATCH_DAMAGE_BONUS = 3` is a deprecated flat alias. |
| `rollTurnDice` / `dieHasStance` / `deriveIntentType` | Draft-pool roll + stance helpers. |
| `AUTHORED_THREAT_ENEMY_IDS` | Read-only array of every enemy slug with a deterministic authored threat sequence — the keys of `AUTHORED_THREAT_SEQUENCES`, which is now compiled from `ENEMY_DECKS` (`combat.enemy-decks.ts`) rather than hand-authored, so it is exactly "every enemy that has a deck". Read the array; do not pin its length. |
| `getThreatSequence(enemy)` | Returns the threat phase sequence for an enemy: explicit `enemy.threatSequence` wins; otherwise an authored sequence keyed by enemy id; otherwise the generated default. |
| `generateDefaultThreatSequence(enemy)` | Generates a 3-phase fallback threat sequence from the enemy's dominant stance, rotating through Heart / Body / Mind. Used automatically by `getThreatSequence` when no authored sequence exists. |
| `rerollSpentDice(state, rng?)` / `hasRerollableDice(state)` / `dieIsRerollable(die)` | PR #190 — partial Press Fate re-roll: re-rolls only spent/exhausted + dead `x`-face dice, leaving usable dice in play. A no-op (refunds Conviction) when nothing is rerollable. |
| `THREAT_WEAKEN_PER_ROLL` / `THREAT_DENY_AT` / `THREAT_WEAKEN_FLOOR` | Soft-control and stat-debuff threat tunables (0.33.0). Each point of enemy roll penalty (from confusion, fear, blind, slow, accuracy/attack-down etc.) reduces the incoming hit by `THREAT_WEAKEN_PER_ROLL` (default 0.06). When the cumulative roll penalty reaches `THREAT_DENY_AT` (default 8), the turn is fully denied (same as hard control). `THREAT_WEAKEN_FLOOR` (default 0.4) clamps the minimum damage multiplier for a weakened-but-not-denied enemy. Read these to display soft-control thresholds in the UI. |
| `COMBAT_DECK_PRESETS` / `COMBAT_DECK_PRESET_ORDER` / `listDeckPresets()` / `getDeckPreset(id)` / `buildPresetDeck(id)` | The three campaign-stage preset decks (`src/Combat/combat.starter-deck-presets.ts`): `threadbare` ("The Threadbare Office", early), `pilgrim` ("The Pilgrim's Burden", mid), `apostate` ("The Apostate's Canon", late), plus `PRESET_LINEAGE` describing the removals/additions that walk one rung to the next. **The one surviving deck law is exact aspect thirds** — every preset splits evenly across body/mind/heart by `philosophicalAspect`. Deck sizes, copy limits and the lineage multiset are no longer laws (2026-09-02). `buildPresetDeck` appends no escape card — there is no in-combat retreat — and is ready to feed `initializeCombatEncounter`. |
| `CombatDeckPreset`, `CombatDeckFocus` | `CombatDeckPreset` describes a single named preset deck entry (id, name, theme, focus, description, cardIds). `CombatDeckFocus` is the discriminated string union of the (now six) coarse design-lever tags used by draft/sim-policy consumers — `'dot' \| 'control' \| 'utility' \| 'damage' \| 'rush-execute' \| 'balanced'` (not the old per-preset name union). Both are importable as `import type { CombatDeckPreset, CombatDeckFocus } from 'axiomancer-mechanics'`. |
| `CardDieCost` | Die-cost helper type — `{ cost: number; advantage: boolean }` returned by `resolveCardDieCost` and `cardDieCostPreview`. Importable as `import type { CardDieCost } from 'axiomancer-mechanics'`. |
| `CombatIntentType`, `CombatReadResult`, `SignatureSkill`, `SignatureSkillId`, `SignatureSkillKind`, `PlayerArchetype` | The depth-layer type family. |

### Phase 169 — Curated Combat Loadout

Replaces `buildCombatDeck = knownSkills` with a **player-shaped curated loadout**
persisted on `GameState.flags` via a `combat-loadout-card:` prefix codec (mirroring the
Hazard deck-flags pattern). When no loadout flags are present the engine falls back to
`knownSkills` for full backwards compatibility with pre-169 saves.

`createNewGameState()` no longer seeds a loadout (save v23, 2026-09-20): a seeded
4-card loadout shadowed the chosen starter bundle in `knownCards` for the whole run
(rest-node CUTs refused at the floor; `executeCard` threw `not known` for a seeded
starter the bundle lacked). The codec remains for dev/e2e deck pinning; the v22 → v23
migration strips any loadout flags an older save still carries.

`isCombatSynergySatisfied` is a pure read-only helper for mobile: pass a `CombatCard` in
hand and the enemy's current `ActiveEffect[]` — it returns `true` when the card's backing
card has a `CardSynergy.predicate` that is currently satisfied (target-side only; caster-
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

The whole roster is authored for this system: `combat.threat-sequences.ts` ships
a deterministic, fully-telegraphed threat pattern for the library enemies (each
phase declares a hidden stance, a damage weight, and optional threat debuffs),
and `combat.threat.ts` sizes each telegraph from level, difficulty, phase index
and the phase's own weight — see §Scale below for the formula.

### Scale — the numbers (THE BIG NUMBERS REWRITE, 2026-09-02)

The scale reset landed 2026-09-02. Design intent and the per-rank card ladder
live in `plan/2026-09-02-big-numbers-overhaul.prompt.md` §5; the live formulas
are here.

**Player VITAE** (`src/Utils/index.ts` `calculateMaxHealth`,
`src/Game/game-mechanics.constants.ts`):

```
PLAYER_VITAE = PLAYER_VITAE_BASE + (body + heart + mind) × HEALTH_PER_STAT
             = 50 + stats × 8
```

The flat base keeps a level-1 pilgrim alive long enough to see a second
telegraph; the per-stat term is what progression buys. Level influences VITAE
through the authored stat budget, not a second multiplicative factor.
Reference points: level 1 ≈ 100, level 3 ≈ 120, level 18 ≈ 350.

**Enemy VITAE** (`src/Enemy/index.ts`). An enemy may author `vitae` directly —
every boss and unique does. When absent it derives:

```
vitae = round((ENEMY_VITAE_BASE + ENEMY_VITAE_PER_LEVEL × level) × ENEMY_VITAE_MULT[difficulty])
      = round((30 + 18 × level) × mult)
```

| difficulty | `ENEMY_VITAE_MULT` |
|---|---|
| simple | 0.6 |
| normal | 1.0 |
| elite | 1.6 |
| boss | 2.5 |
| unique | 3.2 |

Reference points: L1 normal ≈ 48, L7 elite ≈ 250, L6 boss ≈ 345, L13 normal ≈
264, L18 boss ≈ 885, L110 unique ≈ 6,432. `baseStats` still drives stance procs,
derived combat stats and befriend logic, but no longer drives VITAE — so the
difficulty bands separate cleanly and a boss can be a wall without a grotesque
stat budget.

**Threat damage budget** (`src/Combat/combat.threat.ts` `threatDamageBudget`):

```
damage = max(4, round((THREAT_BASE + THREAT_PER_LEVEL × max(1, level))
                      × DIFFICULTY_MULT × (1 + 0.2 × phaseIndex) × damageWeight))
       = max(4, round((6 + 2.5 × level) × dMult × (1 + 0.2 × phaseIndex) × weight))
```

`DIFFICULTY_MULT`: simple 0.7 · normal 0.92 · elite 1.08 · boss 1.5 · unique
1.45. Authored `damageWeight` now ranges roughly 0.8–1.6. **`THREAT_DAMAGE_SCALE`
is RETIRED** — the old global 1.7 fudge factor was folded into the budget so a
telegraph's printed number IS the number the engine applies. The constant is
pinned at `1` and exported only so unmigrated callers stay honest; delete it
once nothing references it. The escalation clock
(`THREAT_ESCALATION_*`, below) still multiplies on top.

**Pip cashing.** `PIP_INTENSITY_BONUS` = **2** intensity per pip spent (was 1);
`PIP_GUARD_BONUS` = **5** Guard per pip on a defend card (was 2) — a ripened
die has to be worth banking against GUARD lines that now open at 8 and reach 60.

**Uncapped payoffs.** RUPTURE's 0.60 × maxVITAE cap and the ALL-spender caps
were repealed; a fed REAP-ALL or RUPTURE-ALL is expected to reach the 100–300
band. `RUPTURE_CAP_FRACTION` in `src/Combat/effects.ts` is now
`Number.POSITIVE_INFINITY` (fixed 2026-09-07, `/adjust-keywords` pass 2) —
the constant itself is honest; only the mobile `KEYWORD_GLOSS.Rupture` popup
text still claimed the old 60% cap, and that was corrected in the same pass.

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
| `RUPTURE_CAP_FRACTION` / `ruptureBurstCap(maxHp)` | RUPTURE burst cap: `round(fraction × enemy max VITAE)`. **The cap is repealed** (2026-09-02) — payoffs are uncapped by design; the constant is `Number.POSITIVE_INFINITY` in `src/Combat/effects.ts`, matching doctrine. |
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
| `READ_STATUS_MULT` | `Record<CombatReadResult, number>` — stance-read scales the magnitude of a landed status effect (DoT damage, control intensity, debuff intensity). Values: `advantage` 1.34 / `neutral` 1.0 / `none` 1.0 / `disadvantage` 0.75. Gentler than `READ_DAMAGE_MULT` (1.5/0.5) so reading adds texture without swinging fights wildly. Tuned manually against `/combat-playtest` evidence. |
| `THREAT_ESCALATION_PER_ROUND` | Per-round escalation step added to the incoming-threat damage multiplier for each round past the grace window (default 0.22). The escalation formula is `min(THREAT_ESCALATION_MAX, 1 + escalationRate × roundsPastGrace)` where `escalationRate = THREAT_ESCALATION_PER_ROUND × (isBoss ? THREAT_ESCALATION_BOSS_MULT : 1)`. |
| `THREAT_ESCALATION_GRACE` | Rounds of grace before the clock starts — a fast clean kill is unpunished (default 1). |
| `THREAT_ESCALATION_MAX` | Cap on the escalation multiplier so a long grind ramps but never runs away into a one-shot (default 2.0). The counters are on-vision: race the foe down (DoT) or deny its turns (control) to skip escalated hits. |
| `THREAT_ESCALATION_BOSS_MULT` | Boss/unique enemies escalate at `THREAT_ESCALATION_PER_ROUND × THREAT_ESCALATION_BOSS_MULT` per round (default 1.6). Makes long boss fights qualitatively more lethal than equivalently long normal fights — incentivises finishing bosses quickly via DoT or denying their turns via control. Normal/elite enemies use the base rate (multiplier 1.0). |
| `THREAT_EFFECT_ESCALATION_STEP` | The SAME clock (`escalation`, above — already boss-scaled, already capped at `THREAT_ESCALATION_MAX`) also intensifies the enemy's telegraphed STATUS application, not just its raw damage: `effectIntensityBonus = floor((escalation - 1) / THREAT_EFFECT_ESCALATION_STEP)` is added to the intensity of whatever status the enemy's hit applies this phase (default step 0.34, capping the bonus around +2 at max escalation). Reuses the damage clock's numbers rather than a second independent ramp. |

All seven are exported from `src/Combat/combat.engine.ts` and re-exported via
the root barrel. Used by `resolveCombatPhase` / `processBetweenPhases`;
consumers read them to render the escalation clock UI (e.g. showing current
multiplier vs. cap, surfacing the boss-tier escalation warning, and flagging
the next enchant/curse round).

### Phase 167/168 — Sim damage-source metrics + AMPLIFY mechanic + Conclusion sig

Phase 167 extends `CombatSimStats` (returned by `simulateHazardPatternCombat`)
with five damage-source fields. They were authored as doctrine witnesses for the
status-primacy doctrine; **that doctrine was repealed 2026-09-02** and none of
them is a pass/fail target any more. They survive as *descriptive* telemetry —
"where did the VITAE go" — for reading a playtest, not for grading one. Phase 168
adds the AMPLIFY burst mechanic (reads pending DoT × multiplier without consuming
effects). The Conclusion sig-card redesign adds `CONCLUDE_DMG_PER_STACK` for the
BODY archetype's stack-based finisher.

#### CombatSimStats extensions (Phase 167)

| Field | Type | Description |
|-------|------|-------------|
| `dotHpFraction` | `number` | Fraction of total enemy VITAE loss delivered by DoT ticks (0–1). Descriptive only since 2026-09-02. |
| `strikeFraction` | `number` | Fraction of total enemy VITAE loss from direct damage (excluding mechanic bursts) (0–1). |
| `mechanicBurstFraction` | `number` | Fraction of total enemy VITAE loss from mechanic bursts (rupture/execute/compound/conclude) (0–1). |
| `guardMitigatedFraction` | `number` | Guard availability ratio: guard present when enemy threat fired / (guard + player VITAE damage taken). Proxy for how often GUARD was relevant. |
| `avgActiveEffectsPerPhase` | `number` | Mean count of active effects on the enemy at the start of each threat phase. |

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
shipped, and the legacy turn-based resolver it produced has since been
removed. Combat is exercised end-to-end via the Hazard-Pattern engine
(`initializeCombatEncounter` → `playCombatCard` → `resolveThreatPhase` →
`processBetweenPhases`); Tier 2/3 procs are in `Combat/combat-effects.ts`.
The CLI log utilities were dropped when Phase 17 unified the CLI
surface around `npm run game` — no log strings exist in the engine
today; consumers render directly from the typed `CombatEvent` stream.
