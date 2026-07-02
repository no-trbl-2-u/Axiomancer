# Enemy

> **Status:** Spec 07 shipped. Type, factory, six AI strategies, a 15-enemy
> library, weighted loot tables, and a per-map encounter generator are wired
> in. Future work (multi-enemy combat, Spec 10 difficulty bias) is tracked in
> [`specs/07-enemy-content-and-ai.md`](../specs/07-enemy-content-and-ai.md).

## Type Shape

Defined in [`src/Enemy/types.d.ts`](../src/Enemy/types.d.ts).

| Field | Type | Purpose |
|-------|------|---------|
| `id` | `string` | Unique save / tracking identifier. |
| `name`, `description` | `string` | Display + flavour. |
| `level`, `health`, `maxHealth` | `number` | Resources. |
| `baseStats` | `BaseStats` | Heart/Body/Mind. |
| `derivedStats` | `DerivedStats` | Computed combat stats (no `NonCombatStats`). |
| `mapName` | `MapName` | Map the enemy belongs to. |
| `logic` | `EnemyLogic` | AI strategy — see "AI strategies" below. |
| `difficulty?` | `EnemyDifficulty` | `simple` / `normal` / `elite` / `boss` / `unique`. |
| `tier1Overrides?` | `Tier1EffectOverrides` | Per-stance Tier 1 effect ID overrides. |
| `procUnlocks?` | `ProcUnlocks` | Spec 03 — per-cell tier cap (default 1). Elites bump to 2, bosses to 3. |
| `procOverrides?` | `ProcOverrides` | Spec 03 — per-cell custom proc tables. |
| `skills?` | `Skill[]` | Optional skill list (Spec 04 / 04b — currently unused on shipped enemies; reserved for elite/boss skill rotations). |
| `loot?` | `LootTableEntry[]` | Weighted drop table (Spec 07 Q7B). |
| `xpReward?` | `number` | Flat XP awarded on kill. Defaults to `level × DEFAULT_XP_BY_DIFFICULTY[difficulty]`. |
| `effects` | `ActiveEffect[]` | Live status effects. |

Enemies do not have `nonCombatStats`; `getSaveStat()` falls back to `getDefenseStat()`.

## Factory

`createEnemy(options): Enemy` — derives `derivedStats`, `maxHealth`, and the
default `xpReward` from `level` / `baseStats` / `difficulty`. Starts the enemy
at full HP.

`enemyStatBudget(level, weights?, perLevel?, gearTierPerLevel?)` — distributes a
level-scaled stat budget across heart/body/mind according to weights, with an
optional gear-tier bonus that scales with level to counter player power accumulation.
The gear-tier bonus is ≈0 at level 1 and grows linearly to balance late-game
trivialization. Used by budget-based enemies and the tuning workflow's enemy scaler.

`DEFAULT_XP_BY_DIFFICULTY` — `simple: 10, normal: 20, elite: 50, boss: 200, unique: 500`.
Multiplied by `level` for the final default.

## AI strategies

[`src/Enemy/enemy.logic.ts`](../src/Enemy/enemy.logic.ts):

| Strategy | Behaviour |
|----------|-----------|
| `randomLogic()` | Uniform stance + attack/defend. |
| `aggressiveLogic(state?)` | Attack 75% of the time; preferred stance counters the player's last declared stance. |
| `defensiveLogic(enemy, state?)` | Defend while HP > 50%; then attack the player's *weakest* stance. |
| `balancedLogic(enemy, state?)` | Attack above 50% HP, defend below. Stance counters the player's last stance. |
| `strategicLogic(enemy, state?)` | Attacks into `debuff_vulnerability_*` debuffs on the player; falls back to `aggressiveLogic` otherwise. |
| `bossLogic(enemy, state?)` | Deterministic 4-round phase script: Body defend → counter-attack → Mind attack → Heart defend → loop. |

Combat consumes the AI via `determineEnemyAction(enemy, state?)` in
[`Combat/index.ts`](../src/Combat/index.ts). Strategies that need to react to
the player (every non-random strategy) receive the live `CombatState`.

**Stance helpers** (used by the built-in strategies; also exported for custom logic):

| Helper | Signature | Returns |
|--------|-----------|---------|
| `counterStanceOf` | `(stance: Stance) => Stance` | The counter-stance for RPS advantage: heart→body, body→mind, mind→heart. Used by `aggressiveLogic` and `balancedLogic`. |
| `weakestStanceOf` | `(enemy: Enemy) => Stance` | The stance with the lowest base stat for the given enemy. Used by `defensiveLogic` to attack the player's vulnerability. |

## Alignment-driven AI tuning (Phase 45)

`Enemy.philosophicalAlignment?: PhilosophicalAlignment` (optional) pins an
enemy to a cell on the [Phase 42 27-cell cube](./philosophy.md). When set,
`decideEnemyAction` runs the per-strategy decision and then post-passes the
result through `applyOutlookBias`:

- **Pessimistic enemies** (outlook bucket `'low'`, value `<= -34`): with
  probability `0.25` per round, an `attack` decision flips to `defend`.
  Stance is preserved.
- **Optimistic enemies** (outlook bucket `'high'`, value `>= 34`): with
  probability `0.25` per round, a `defend` decision flips to `attack`.
- **Neutral enemies** (outlook bucket `'mid'`): bias is a no-op.
- **Non-basic actions** (`skill` / `item` / `flee`): bias is a no-op.

The bias spends one `getRng().random()` call per dispatch — deterministic
under the `src/test-utils/rng.ts` stubs. Enemies without an alignment pin
(legacy fixtures, the single-arg `decideEnemyAction(logic)` path) are
unaffected.

### Cell pins on authored enemies

`ENEMY_REGISTRY` holds 63 authored enemies. The 26 below carry the
first-pass cell pins:

| Enemy | Cell | Archetype |
|---|---|---|
| TidepoolCrab, EchoOfPyrrhonia | `mid-mid-individual` | Montaigne / Ishmael |
| SeaMistWisp | `mid-mid-transcendent` | Lao Tzu / Siddhartha |
| LullabyMoth | `faith-optimistic-individual` | Kierkegaard / Alyosha |
| Disatree_01 | `mid-pessimistic-relational` | Zapffe / Ahab |
| WetHound | `logic-pessimistic-individual` | Schopenhauer / Underground Man |
| MournfulGull | `mid-pessimistic-individual` | Cioran / Hamlet |
| ForestSprite | `mid-optimistic-individual` | Rorty / Huck Finn |
| HollowEyedBeggar | `faith-pessimistic-relational` | Mainländer / Ferreira |
| ArgumentativeCrow | `logic-optimistic-individual` | Nietzsche / Prometheus |
| TideflukeReaver | `logic-pessimistic-relational` | Ligotti / Rust Cohle |
| HushWraith | `mid-pessimistic-transcendent` | Lovecraft / Burroughs |
| HollowSaint | `faith-mid-transcendent` | St. John of the Cross / Rodrigues |
| CoastalTyrant | `faith-pessimistic-transcendent` | Marcion / Grand Inquisitor |
| TheDisagreement | `logic-mid-individual` | Camus / Meursault |
| ThornedSentinel | `faith-pessimistic-relational` | Mainländer / Ferreira |
| PackleaderWolf | `logic-mid-individual` | Camus / Meursault |
| WhisperingOak | `mid-optimistic-transcendent` | Teilhard / Whitman |
| FrostboundHunter | `logic-pessimistic-relational` | Ligotti / Rust Cohle |
| MistwalkerShade | `mid-mid-transcendent` | Lao Tzu / Siddhartha |
| VerdantProtector | `faith-optimistic-transcendent` | Aquinas / Hopkins |
| NightmareStag | `mid-pessimistic-transcendent` | Lovecraft / Burroughs |
| TheForestMind | `faith-mid-transcendent` | Eckhart / Teilhard |
| EternalAutumn | `logic-mid-relational` | Wittgenstein / Buber |
| ShadowOfTheFirst | `mid-mid-individual` | Montaigne / Ishmael |
| Sandbag_01 | `mid-mid-relational` | Buber / Carraway |

23 distinct cells used out of 27; the remaining 4 are headroom for future
enemies. Cell ids are stable across versions (see
[docs/philosophy.md](./philosophy.md) for the full registry).

## Loot tables

`LootTableEntry { item: Item | null; weight: number }` — weighted entries
with explicit `null` buckets for "nothing drops". `rollLoot(table, rng?)`
normalises weights at call time and returns one item (or `null`).
`rollLootMany(table, n)` is a convenience for multi-roll tables.

Enemy `loot` is intentionally mutable — encounters can splice in extra
entries before combat starts (e.g. quest-driven guaranteed drops).

## Encounters

```ts
interface Encounter {
    enemies: Enemy[];        // 1v1 today; multi-enemy lands later
    rewards?: Reward[];      // optional encounter-level bonuses
    origin?: string;         // "<mapName>:<nodeId>" for attribution
}
```

`generateEncounter(mapNode, playerLevel, options?)` ([`World/encounter.ts`](../src/World/encounter.ts))
resolves the node's owning map (`fv-*` → fishing-village, `nf-*` → northern-forest),
filters the per-map pool by `options.difficulty` (if supplied), picks an
enemy uniformly, scales their level via the Q6 bands:

| Difficulty | Band relative to player |
|------------|-------------------------|
| `simple`   | `−1 … 0`                |
| `normal`   |  `0 … +1`               |
| `elite`    | `+1 … +2`               |
| `boss`     | `+2 … +3`               |
| `unique`   | authored level (fixed)  |

Floor clamps to level 1. The returned enemy is a deep clone — combat
mutations don't bleed back into the library.

## Store integration

`store.startCombat(target: Enemy | Encounter)` accepts either shape; the
encounter is retained so `endCombat()` can grant XP + loot on victory.

`store.endCombat(): CombatEndReport` — `{ outcome, xpGained, loot }`. On
victory, sums every enemy's `xpReward` into `player.experience` and
stack-merges rolled drops into `player.inventory`. Defeat / flee outcomes
grant nothing.

## Library

[`src/Enemy/enemy.library.ts`](../src/Enemy/enemy.library.ts) — 30 production
enemies across the Coastal Continent, with the original Spec 07 foundation,
Phase 114's northern-forest class family expansion, and Phase 127's ancient-ruins
themed third family (undead/construct/elemental archetypes).

### Original Coastal Family (Spec 07)
**Simple (3)** — Tidepool Crab (body), Sea-Mist Wisp (mind), Lullaby Moth (heart).
**Normal (6)** — Disatree (legacy 1/1/1), Wet Hound (body), Mournful Gull (heart),
Forest Sprite (mind), Hollow-Eyed Beggar (heart), Argumentative Crow (mind).
**Elite (3)** — Tidefluke Reaver (body), Hush-Wraith (mind), Hollow Saint (heart).
**Boss (2)** — The Coastal Tyrant (body+heart), The Disagreement (mind+heart).
**Unique (1)** — Echo of Pyrrhonia (all three).

### Northern-Forest Class Family (Phase 114)
**Normal (3)** — Thorned Sentinel (body, defensive territorial), Packleader Wolf (balanced, leading ghosts), Whispering Oak (mind, forest secrets).
**Elite (3)** — Frostbound Hunter (body, tracking warmth), Mistwalker Shade (mind, between certainties), Verdant Protector (heart, shepherd of growth).
**Boss (2)** — Nightmare Stag (mind+body, crystallized fear), The Forest Mind (mind+heart, thousand-year thoughts).
**Unique (2)** — Eternal Autumn (all three, season refusing to pass), Shadow of the First (body+heart, pre-philosophy wildness).

### Ancient-Ruins Third Family (Phase 127)
**Normal (2)** — Boneward Sentinel (body, ossified duty), Voidwrought Construct (mind, crystallized absence).
**Elite (2)** — Cindergeist Revenant (heart, ghost of flame), Obsidian Colossus (body, volcanic glass guardian).
**Boss (1)** — The Lich of Missing Steps (mind+heart, undead philosopher-king with flawed eternal proof).

The ancient-ruins family explores undead/construct/elemental themes with comprehensive befriendability configurations, skill rotations using Tier 3 effects, rich friendship reward content including unique items and alignment shifts, complete aftermath narrative (finalBlowLines/pactLines/causeLines), and journal entries that unlock ancient lore. All five enemies are thematically placed in the northern-forest map but represent a distinct archetype family focused on philosophical examination of existence, duty, and transformation.

`EnemiesByMap` indexes them per map for `generateEncounter`. `ENEMY_REGISTRY`
keys them by CLI slug (`tidepool-crab`, `thorned-sentinel`, `disatree`, `sandbag`, ...) for the
combat CLI's `COMBAT_ENEMY=<slug>` override.

The legacy `Sandbag_01` (level 10, 1/1/1) is preserved as a test fixture and
deliberately omitted from `EnemiesByMap` so the encounter generator never
picks it.

## CLI usage

```sh
npm run game   # tabbed demo loop; pick the Combat tab to engage
               # an active encounter generated from the current map node
```

Victory grants are surfaced inside the Combat tab after each encounter
resolves; the hermetic e2e suite (`src/**/e2e/*.engine.test.ts`) is the
durable way to exercise specific enemy fixtures.

## Skill use (Phase 49)

Enemies with a non-empty `Enemy.skills?: Skill[]` field can fire skills
during combat. `decideEnemyAction` consults a new helper
`pickEnemySkill(enemy)` BEFORE the per-strategy dispatch — when the
rotation is non-empty AND `getRng().random() < ENEMY_SKILL_PICK_CHANCE`
(0.35), it returns `{ action: 'skill', skillId, stance }`. Otherwise
the strategy resolves normally. The stance is sourced from
`skill.philosophicalAspect` so a body-aspected skill arrives with
`stance: 'body'`.

Nine enemies carry rotations — 2 from Phase 49, 7 from Phase 57.
Picks come exclusively from the existing `skillLibrary` (no new skill
content); each is single-skill per the current `pickEnemySkill`
contract (first-pick semantics).

| Enemy | Difficulty | Skill | Skill aspect | Phase |
|---|---|---|---|---|
| Mournful Gull | normal | `appeal-to-pity` | heart | 57 |
| Hollow-Eyed Beggar | normal | `pascals-wager` | heart | 57 |
| Argumentative Crow | normal | `false-dilemma` | mind | 49 |
| Tidefluke Reaver | elite | `straw-giant` | body | 57 |
| Hush-Wraith | elite | `sorites-cascade` | mind | 57 |
| Hollow Saint | elite | `pascals-wager` | heart | 57 |
| The Coastal Tyrant | boss | `achilles-gambit` | body | 49 |
| The Disagreement | boss | `liars-echo` | mind | 57 |
| Echo of Pyrrhonia | unique | `eternal-regress` | heart | 57 |

The 3 simplest normals (Tidepool Crab, Sea-Mist Wisp, Lullaby Moth)
stay skill-less per Phase 57 D2 — early-game pacing benefits from
straight basic-action encounters before the player has the reactive
budget for enemy skill rotations.

The actual skill execution runs through `executeSkill` with
`casterSide: 'enemy'` — see `docs/skills.md` "Enemy caster path
(Phase 49)" for the engine-side semantics, including D2 (enemies
bypass the player's `combatResources` pool) and D3 (`skill.targetType`
is relative to the caster).

Calibration: the 0.35 fire rate is colocated with the Phase 45
`ALIGNMENT_FLIP_CHANCE` in `src/Enemy/enemy.logic.ts`. Tune both
together if a future playtest pass shows elite/boss encounters
feel too spammy or too quiet.

## Befriendable enemies (Phase 60)

Per-enemy `Enemy.friendshipReward?: FriendshipReward` lets authors
attach bonus content to the Phase 36 friendship-victory path. The
field is optional; enemies without an authored reward resolve via
the Phase 36 base only (half-XP + weighted-loot roll + +1
moralMeter).

```typescript
interface FriendshipReward {
    /** Guaranteed items appended to the weighted-loot roll. */
    items?: Item[];
    /** Extra XP on top of the half-XP base. Additive, not multiplicative. */
    xpBonus?: number;
    /** Optional flavour text for the CLI / UI to render after combat-end. */
    narrative?: string;
    /** Phase 62 — optional world flag appended to state.flags on
     *  friendship. Convention: `befriended-<enemy-id-stem>`. */
    flagSet?: string;
    /** Phase 69 — optional shift applied to the player's
     *  philosophical alignment cube on the friendship outcome.
     *  Routed through applyAlignmentDelta (Phase 42 clamp helper).
     *  Authoring band: ±1..±5 per axis (matches Phase 43 dialogue
     *  / map-event delta convention). Closes Spec 14 Q4. */
    alignmentDelta?: Partial<PhilosophicalAlignment>;
}
```

Engine wiring lives in `src/Game/store.ts#endCombat`: in the
`outcome === 'friendship'` branch, the reward's `items` append to
`report.loot`, `xpBonus` adds to `report.xpGained`, `narrative`
surfaces on `CombatEndReport.friendshipReward.narrative`, and
(Phase 69) `alignmentDelta` is folded into `state.philosophicalAlignment`
via `applyAlignmentDelta` — the post-clamp value also surfaces on
`CombatEndReport.friendshipReward.alignmentShift?: PhilosophicalAlignment`
for the consumer to render. None of
the FriendshipReward fields REPLACE the Phase 36 grants; they
augment them.

Seven enemies ship authored predicates / rewards (Phase 102 expanded from 3 → 7):

| Enemy | Difficulty | World placement | Items | xpBonus | alignmentDelta (Phase 69) | BefriendabilityConfig (Phase 68) | Narrative tone |
|---|---|---|---|---|---|---|---|
| **MournfulGull** | normal | `fv-15` gull crag (Harbor District dead-end via `fv-11` → `fv-14`) | 1 × heart-draught | +10 | `{ outlook: +3 }` — wistful-empathy nudge toward optimistic | default Phase 36 mechanic (no config) | Heart-attuned remembrance gift; the gull stops circling. Sets flag `befriended-mournful-gull` (Phase 62) — Coastal Beggar's dialogue surfaces a new branch acknowledging the gull's silence. |
| **HollowEyedBeggar** | normal | `fv-18` back alley (Inland Streets, on the way to the abandoned-shack loop via `fv-5` → `fv-18` or `fv-3` → `fv-16` → `fv-17` → `fv-18`) | 1 × healing-potion + 1 × antidote | +15 | `{ scope: -3 }` — re-grounds toward the relational individual | default Phase 36 mechanic (no config) | Reversal of the begging dynamic; they offer what they carry. |
| **TideflukeReaver** | elite | `fv-*` fishing-village elite encounters | 1 × body-elixir + 1 × healing-potion | +35 | `{ outlook: +2, scope: +1 }` — softens pessimism, opens to relationship | `{ hpGate: { belowPct: 0.3 }, requiredStances: ['heart'], roundsThreshold: 4 }` | Salt-bound reaver's chains dissolve; empathy required. Sets flag `befriended-tidefluke-reaver` (Phase 102). |
| **HushWraith** | elite | `nf-*` northern-forest elite encounters | 1 × clarity-serum + 1 × antidote | +40 | `{ outlook: +1 }` — slight hope in cosmic indifference | `{ hpGate: { belowPct: 0.25 }, requiredStances: ['heart'], roundsThreshold: 6 }` | Transcendent silence breaks into whisper; patience required. Sets flag `befriended-hush-wraith` (Phase 102). |
| **HollowSaint** | elite | `nf-*` northern-forest elite encounters | 1 × resonance-crystal + 1 × heart-draught + 1 × healing-potion | +45 | `{ scope: -2 }` — turns inward from transcendent to individual | `{ hpGate: { belowPct: 0.4 }, requiredStances: ['heart'], requiredSkillUse: ['prayer'], roundsThreshold: 3 }` | Martyr finds purpose in witness; prayer skill connection if available. Sets flag `befriended-hollow-saint` (Phase 102). |
| **CoastalTyrant** | boss | `coastal-continent` fishing-village boss tile | `paradox-loop` (unique circlet, requiredLevel 15) + healing-potion + heart-draught | +75 | `{ outlook: +3, scope: -2 }` — recognition + release; he gave up his despair toward optimism, and saw a person rather than a doctrine | `{ hpGate: { belowPct: 0.4 }, requiredStances: ['heart'], roundsThreshold: 3 }` | Magistrate-fallen-priest; friendship opens only after he's been brought low, the player has shown empathy at least once, and 3 both-defend rounds have passed. The fallen-priest hands over his regalia (Paradox Loop unique — "a sentence which forever ends without finishing") + healing tokens; multi-paragraph narrative captures the recognition + release. Sets flag `befriended-coastal-tyrant` (Phase 62) for downstream dialogue / quest gates. Demonstrates the full Phase 60+62+68+69 stack on a single high-stakes encounter (Phase 70). |
| **TheDisagreement** | boss | `coastal-continent` northern-forest boss tile | 1 × philosopher-tea + 1 × focus-vial + 1 × healing-potion + 1 × clarity-serum | +80 | `{ scope: +1 }` — opens to relational despite absurdism | `{ hpGate: { belowPct: 0.2 }, requiredStances: ['mind'], roundsThreshold: 8 }` | Disagreement resolves into dialogue; reasoned argumentation and boss patience required. Sets flag `befriended-the-disagreement` (Phase 102). |

The 2 normal-tier enemies (MournfulGull, HollowEyedBeggar) are 
picked from the fishing-village (level 2-3), where the player's first 
deliberate befriending attempts are likeliest to land. Phase 102 expands 
the roster with 4 new enemies: 3 elite-tier (TideflukeReaver, HushWraith, 
HollowSaint) and 1 boss-tier (TheDisagreement), bringing the total 
befriendable count from 3 → 7. All carry the full Phase 60+62+68+69+71+73 
stack: `befriendabilityConfig` predicates, `friendshipReward` content, 
`pactLines` narrative, and `journalEntry` codex unlocks. CoastalTyrant 
demonstrates the Phase 70 boss-tier reward integration; TheDisagreement 
demonstrates boss-tier predicate complexity (full stance spectrum + 
8-round patience threshold).

Hermetic e2e coverage at
[`src/Game/e2e/befriend.engine.test.ts`](../src/Game/e2e/befriend.engine.test.ts)
drives one friendship run per authored enemy + a no-friendshipReward
regression case (TidepoolCrab) + a victory-outcome regression case
(no friendshipReward thread on non-friendship outcomes).

See `docs/combat.md` § "Friendship Path" for the engine-side
semantics + `docs/morality.md` § "Combat: Friendship Victories" for
the moralMeter shift that fires alongside.

## Aftermath narrative (Phase 71)

Three optional per-foe line sets carry chronicle-voice prose for
the post-combat aftermath panel. The engine stores the data and
emits it on the encounter; consumer surfaces (mobile presenter,
CLI, future UI tabs) pick which variant to render based on the
outcome shape.

| Field | Type | When meaningful | Variants |
| --- | --- | --- | --- |
| `finalBlowLines` | `FinalBlowLines` | Victory outcome | `brutal` (overkill burst), `quiet` (exact-cap), `ironic` (mirror / self-inflicted) |
| `pactLines` | `PactLines` | Friendship outcome (paired with `friendshipReward`) | `quiet` (mutual silence), `setDown` (literal weapon laid down), `heavy` (recognition under weight) |
| `causeLines` | `CauseLines` | Defeat outcome | `brutal` (enemy burst), `broken` (attrition), `quiet` (single-tick KO) |

**Engine does NO variant selection** — fields are pure data; the
consumer (mobile presenter etc.) picks `brutal` vs `quiet` vs
`ironic` based on damage-tier shape or parley posture. Strings are
complete chronicle prose; the engine performs no interpolation.

**Initial author coverage (Phase 71):** the three original
befriendable enemies — **MournfulGull** (heart-aspected wistful,
"slights" / "list" / "catalogue" thread), **HollowEyedBeggar**
(faith-pessimistic-relational, "carrying" / "rags" / "phials"
thread; reversal-of-begging carries into pact + cause variants),
and **CoastalTyrant** (magistrate-fallen-priest, "verdict" /
"regalia" / "magistrate" thread; pact lines echo the existing
4-paragraph `friendshipReward.narrative`).

**Phase 102 expansion:** four additional befriendable enemies gained
`pactLines` — **TideflukeReaver** (salt-bound / shore-cursed / chains
dissolving thread), **HushWraith** (silence / questions / patience
thread), **HollowSaint** (martyrdom / witness / devotion thread),
and **TheDisagreement** (argument / dialogue / good-faith thread).
All carry the full befriendability stack (`befriendabilityConfig` +
`friendshipReward` + `pactLines` + `journalEntry`).

**Sweep coverage (Phase 74):** the remaining 12 non-sandbox enemies
in the library gained `finalBlowLines` + `causeLines` (Phase 74
D3 — `pactLines` skipped on non-befriendable enemies; only
meaningful when the enemy also carries a `friendshipReward`).
Total authored: **15 of 16** enemies; the only un-authored entry
is `Sandbag_01` (Phase 74 D1 — test sandbox with no narrative
weight). Each new sweep voice extends the existing enemy
identity (description + Phase 45 alignment archetype + Phase 49
skill rotation where present). Mobile presenter's `derive*Phrase`
fallback now only fires on the test sandbox — the player-visible
roster all renders engine-authored prose.

**Naming note:** GH#65 source text used the hyphenated `set-down`;
the field is `pactLines.setDown` (TS-identifier convention).

Hermetic e2e coverage at
[`src/Enemy/e2e/aftermath-lines.engine.test.ts`](../src/Enemy/e2e/aftermath-lines.engine.test.ts)
pins registration shape across the 3 authored enemies + voice
signatures + a regression case (TidepoolCrab leaves all three
fields undefined). Source: GH#65 ask 1 (filed 2026-05-22).

## Codex entries (Phase 73)

Optional per-foe `journalEntry?: CodexEntry` (`{ id, title, body }`)
holds chronicle prose that the engine auto-unlocks when the player
befriends the enemy. The unlock fires inside the END_COMBAT reducer
on `outcome === 'friendship'`: the entry's id is appended to
`state.codex.unlockedEntries` (de-duped) and surfaced as
`{ id, title }` on `CombatEndReport.friendshipReward.codexEntryUnlocked`
for the consumer's after-action UI (mobile
`<CombatFriendshipPanel>` NEW ENTRY card). Body is recovered via
lookup against the source enemy.

Initial author coverage (Phase 73): MournfulGull ("The Catalogue of
Slights"), HollowEyedBeggar ("They Carry What You Set Down"),
CoastalTyrant ("The Magistrate Who Set Down the Circlet"). 

Phase 102 expansion: TideflukeReaver ("The Salt-Bound Oath"),
HushWraith ("The Question After Silence"), HollowSaint ("The Witness
Who Chose to Stay"), TheDisagreement ("The Art of Arguing in Good Faith").
All bodies extend their respective Phase 71 chronicle voices and
philosophical archetypes.

Victory / defeat / flee outcomes do NOT unlock the entry. Future
dialogue / map-event content can grant codex entries outside combat
by dispatching `store.unlockCodexEntry(entryId)`. See
`docs/combat.md` § "Friendship Path" for the engine-side semantics
and `docs/api.md` § "Codex slice (Phase 73)" for the public-surface
shape. Source: GH#65 ask 3 (filed 2026-05-22).

## Spec 26 / 26b author fields

Two optional author-facing fields on `Enemy` / `CreateEnemyOptions`
feed the Spec 26/26b Hazard-Pattern combat presentation (see
`docs/combat.md` § "Spec 26 / 26b"). Both are sparse — absent fields
fall back to engine defaults, so existing enemies need no migration.

| Field | Type | Spec | Purpose |
| --- | --- | --- | --- |
| `portraitAsset` | `string` | 26 §3.1 | Kebab-case asset id for the enemy's combat portrait (e.g. `coastal-tyrant`). Mobile resolves it via the portrait registry; absent → fallback silhouette. |
| `stanceHint` | `string` | 26b §2 | An enemy-level thematic tell that *implies* (never states) the foe's stance tendency. Surfaced in the combat reveal so reading the foe's character pays off in the hidden read. A per-phase `CombatThreatPhase.stanceHint` overrides it; if neither is set a generic per-stance hint is used. |

Author coverage: the seven befriendable-stack enemies carry both
fields — MournfulGull, HollowEyedBeggar, TideflukeReaver, HushWraith,
HollowSaint, CoastalTyrant, and TheDisagreement. The remaining
roster leaves both undefined and renders the engine fallbacks.
