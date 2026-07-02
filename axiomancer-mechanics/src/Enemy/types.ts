import { Card } from '../Cards/types';
import { MapName } from '../World/map.library';
import { Stance } from '../Combat/types';
import { BaseStats, DerivedStats } from '../Character/types';
import { ActiveEffect } from '../Effects/types';
import { ProcOverrides, ProcUnlocks } from '../Combat/combat-effects';
import { Item } from '../Items/types';
import { PhilosophicalAlignment } from '../Philosophy/types';
import { FactionReputationDelta } from '../Faction/types';
// Phase 73 — CodexEntry's semantic home is src/Game/types.ts (alongside
// CodexState + the Game-loop persistence surface). It's re-exported here
// so `Enemy.journalEntry?: CodexEntry` decoration works at the per-foe
// content site without import churn for consumers reading from the Enemy
// barrel. See critique-37 row 2 → iterate-`d0f0d73`-era drain for the
// reasoning trail.
import type { CodexEntry } from '../Game/types';
export type { CodexEntry };

/**
 * Phase 68 — per-enemy override on the Phase 36 friendship-eligibility
 * predicate. ALL present predicates AND-compose; eligibility requires
 * every named predicate to pass simultaneously. When the field is
 * absent, the Phase 36 mechanic stays unchanged
 * (`friendshipCounter >= FRIENDSHIP_COUNTER_MAX` -> friendship).
 *
 * Authors leave predicates undefined when they don't apply (e.g. low-tier
 * enemies that only need the rounds threshold drop the other three fields).
 * Within a single list-valued predicate (`requiredStances`, `requiredSkillUse`)
 * the match is existential — at least one element of the list must appear in
 * the player's combat log.
 */
export interface BefriendabilityConfig {
    /**
     * Override for the both-defend round count required. Defaults to the
     * global `FRIENDSHIP_COUNTER_MAX` (Phase 36) when absent. Setting this
     * to a lower value makes the enemy easier to befriend on the counter
     * axis; a higher value makes it harder. Negative or zero values are
     * not validated; authors are responsible for sensible thresholds.
     */
    roundsThreshold?: number;
    /**
     * Friendship eligibility requires `enemy.health / enemy.maxHealth`
     * to be at or below `belowPct` at the eligibility check. Pure
     * snapshot — healing back above the threshold un-qualifies
     * eligibility. Range [0, 1].
     */
    hpGate?: { belowPct: number };
    /**
     * Friendship eligibility requires the player to have used AT LEAST
     * ONE of the named stances during combat (existential, not universal).
     * Derived from `state.log[].playerAction.stance`; no separate
     * tracking state is kept on `CombatState`.
     * Empty array is treated as "no requirement" (same as undefined).
     */
    requiredStances?: Stance[];
    /**
     * Friendship eligibility requires the player to have cast AT LEAST
     * ONE of the named skill IDs during combat (existential, not universal).
     * Derived from `state.log[].playerAction` entries with
     * `action === 'skill'` and matching `skillId`.
     * Empty array is treated as "no requirement" (same as undefined).
     */
    requiredSkillUse?: string[];
    /**
     * Explicit "fall through to Phase 36 mechanic". When set, the engine
     * treats this config as if the field were absent — useful for
     * authoring clarity ("this enemy was explicitly considered and uses
     * defaults"). Other fields on the same config are ignored when this
     * is set.
     */
    defaultFallback?: 'both-defend-cap';
}

/**
 * Decision-making strategy used by an enemy each round (Spec 07).
 *
 * - `random`     — picks any stance and any action uniformly.
 * - `aggressive` — attacks ~75% of the time; favours the stance that beats
 *                  the player's last stance (rock-paper-scissors counter).
 * - `defensive`  — defends until HP > 50% of max; then attacks the stance
 *                  the player has the *lowest* base stat in.
 * - `balanced`   — attacks while HP > 50%; defends below that threshold.
 * - `strategic`  — inspects the player's active effects and exploits
 *                  matching vulnerabilities (e.g. `debuff_vulnerability_body`
 *                  pulls Body attacks). Falls back to `aggressive` heuristics
 *                  when no exploit is on the board.
 * - `boss`       — deterministic phase script keyed off `state.round`. Used
 *                  by `bossLogic` enemies for telegraphed signature patterns.
 */
export type EnemyLogic =
    | 'random' | 'aggressive' | 'defensive' | 'balanced' | 'strategic' | 'boss';

/**
 * Difficulty classification used by the world to seed encounters.
 */
export type EnemyDifficulty = 'simple' | 'normal' | 'elite' | 'boss' | 'unique';

/**
 * Per-enemy override for the default Tier 1 stance-effect map. Only the
 * effect ID is overridden; the action's target (self/opponent) and stacking
 * options are preserved from the global map.
 */
export type Tier1EffectOverrides =
    Partial<Record<Stance, Partial<Record<'attack' | 'defend', string>>>>;

/**
 * Phase 60 — per-enemy content awarded when combat resolves via
 * friendship (Phase 36's `outcome === 'friendship'` path).
 *
 * Layered ON TOP OF the existing Phase 36 base: half-XP +
 * full loot + +1 moralMeter. None of the FriendshipReward fields
 * REPLACE the Phase 36 grants; they augment them. Authors leave
 * undefined for enemies whose friendship path is purely mechanical
 * (no content stakes).
 *
 * Engine wiring lives in `store.endCombat()` — items append to
 * `report.loot` and `xpBonus` adds to `report.xpGained` before the
 * level-up cascade fires. `narrative` surfaces on
 * `CombatEndReport.friendshipReward.narrative` for the CLI / UI
 * (engine does not interpret).
 */
export interface FriendshipReward {
    /** Guaranteed items appended to the weighted-loot roll. */
    items?: Item[];
    /** Extra XP on top of the half-XP base. Additive, not multiplicative. */
    xpBonus?: number;
    /** Optional flavour text for the CLI / UI to render after combat-end. */
    narrative?: string;
    /**
     * Phase 62 — optional world-flag appended to `state.flags` when combat
     * resolves via friendship. Reuses the existing flag-gate machinery
     * (`DialogueChoice.requires.flag`, `visibleChoices`); downstream content
     * (dialogue branches, quest objectives) can gate on the flag without
     * extending the engine. Convention: `befriended-<enemy-id-stem>`
     * (e.g. `'befriended-mournful-gull'`). De-duplicated on append.
     */
    flagSet?: string;
    /**
     * Phase 69 — optional shift applied to the player's philosophical
     * alignment cube on the friendship outcome. The END_COMBAT reducer
     * routes the delta through `applyAlignmentDelta(state.philosophicalAlignment,
     * delta)` (Phase 42's clamp helper at `src/Philosophy/alignment.engine.ts`);
     * each named axis clamps to `[-100, +100]`, missing axes pass through
     * unchanged. Authoring band mirrors Phase 43's dialogue / map-event
     * `alignmentDelta` convention (±1..±5 per axis; ±10 reserved for endgame).
     * Closes Spec 14 Q4 — the friendship-victory ↔ alignment-cube
     * intersection is now opt-in per encounter rather than orthogonal by
     * default.
     */
    alignmentDelta?: Partial<PhilosophicalAlignment>;
    /**
     * Phase 110 — optional shift applied to the player's faction reputation
     * standings on the friendship outcome. The END_COMBAT reducer routes
     * the delta through `applyFactionReputationDeltas(state.factionReputations,
     * factionDeltas)` (Phase 110's clamp helper); each faction clamps to
     * `[-100, +100]`. Authoring band: ±5..±15 per faction for boss encounters
     * (demonstrates lose-with-one / gain-with-another tradeoffs).
     */
    factionDeltas?: FactionReputationDelta;
}

/**
 * Weighted drop entry on an `Enemy.loot` table (Spec 07 Q7B).
 *
 * Each entry contributes its `weight` to the roll; the rolled bucket spawns
 * the entry's `item` (or, if `item` is `null`, nothing — that bucket is the
 * empty / no-drop slot). Library authors can express "nothing 60%, herb 30%,
 * potion 10%" with `[ { item: null, weight: 60 }, { item: herb, weight: 30 },
 * { item: potion, weight: 10 } ]`. Weights are unitless integers; the runtime
 * normalises them at roll time.
 *
 * `loot` on the `Enemy` is intentionally a runtime-mutable variable: encounters
 * can splice in extra entries (e.g. quest-driven guaranteed drops, biome
 * tables) before combat starts. See `rollLoot` in `Enemy/loot.ts`.
 */
export interface LootTableEntry {
    /** Item to drop when this bucket rolls. `null` represents a no-drop slot. */
    item: Item | null;
    /** Positive integer weight; normalised across the table at roll time. */
    weight: number;
}

/**
 * Phase 71 — chronicle-voice prose for the victory final-blow
 * aftermath panel. Three variants; consumer (mobile presenter, CLI,
 * etc.) picks which to render based on the outcome shape (typically
 * damage-tier: brutal = overkill burst, quiet = exact cap, ironic =
 * self-inflicted / mirror-effect KO). Strings are complete prose as
 * authored; engine does no interpolation and no variant selection.
 * Closes GH#65 ask 1.
 */
export interface FinalBlowLines {
    brutal: string;
    quiet: string;
    ironic: string;
}

/**
 * Phase 71 — chronicle-voice prose for the friendship-pact
 * aftermath panel. Three variants matching how the parley landed
 * (quiet = mutual silence, setDown = enemy lays down its weapon
 * literally, heavy = recognition under weight). Only meaningful
 * when the enemy also carries a `friendshipReward`; un-befriendable
 * enemies leave this undefined.
 *
 * Naming note: GH#65 source text used "set-down"; this field is
 * `setDown` (TS-identifier convention).
 */
export interface PactLines {
    quiet: string;
    setDown: string;
    heavy: string;
}

/**
 * Phase 71 — chronicle-voice prose for the defeat aftermath panel
 * ("cause of loss"). Three variants matching how the player went
 * down (brutal = enemy unloaded a burst, broken = attrition over
 * many rounds, quiet = exact-cap or single-tick KO).
 */
export interface CauseLines {
    brutal: string;
    broken: string;
    quiet: string;
}

/**
 * An adversary that can be encountered in combat.
 *
 * @property id           - Unique identifier (used for save/load and tracking).
 * @property mapName      - The map this enemy belongs to.
 * @property logic        - AI strategy.
 * @property difficulty   - Optional encounter classification.
 * @property tier1Overrides - Optional Tier 1 effect ID overrides per stance.
 * @property skills       - Optional skill list the enemy can use.
 * @property loot         - Optional weighted drop table (Spec 07 Q7B). Each
 *                          successful kill rolls the table once. May be empty
 *                          / undefined for enemies that don't drop anything.
 * @property effects      - Active status effects on the enemy.
 */
export interface Enemy {
    id: string;
    name: string;
    description: string;
    level: number;
    health: number;
    maxHealth: number;
    baseStats: BaseStats;
    derivedStats: DerivedStats;
    mapName: MapName;
    logic: EnemyLogic;
    difficulty?: EnemyDifficulty;
    tier1Overrides?: Tier1EffectOverrides;
    /**
     * Spec 03 — per-cell proc unlock caps for this enemy. Default cap is
     * tier 1; elite / boss enemies bump the cap to enable higher-tier procs.
     */
    procUnlocks?: ProcUnlocks;
    /**
     * Spec 03 — per-cell custom proc tables that fully replace the global
     * entries for that Stance × action combo. Bosses get unique tables here;
     * elite / basic enemies receive map-themed overrides (Q7).
     */
    procOverrides?: ProcOverrides;
    skills?: Card[];
    /** Weighted drop table — see {@link LootTableEntry}. */
    loot?: LootTableEntry[];
    /** Flat experience-point award on kill. Defaults computed by difficulty. */
    xpReward?: number;
    effects: ActiveEffect[];
    /**
     * Phase 45 — per-enemy pin on the 3-axis philosophical alignment cube.
     * Optional; enemies without a pin behave exactly as before. Consumed by
     * dialogue / alignment surfaces and (historically) by the legacy
     * turn-based AI's outlook bias, which was removed with that combat driver.
     */
    philosophicalAlignment?: PhilosophicalAlignment;
    /**
     * Phase 60 — optional per-enemy reward content surfaced on
     * `outcome === 'friendship'`. See {@link FriendshipReward}.
     * When undefined, the enemy's friendship resolution is purely
     * mechanical (Phase 36 base only: half-XP + weighted-loot roll
     * + +1 moralMeter).
     */
    friendshipReward?: FriendshipReward;
    /**
     * Phase 68 — optional per-enemy override of the Phase 36
     * friendship-eligibility predicate (`friendshipCounter >=
     * FRIENDSHIP_COUNTER_MAX`). See {@link BefriendabilityConfig}.
     * When undefined, the Phase 36 mechanic stays unchanged; when
     * present, ALL named predicates AND-compose.
     */
    befriendabilityConfig?: BefriendabilityConfig;
    /**
     * Phase 71 — optional per-foe victory final-blow chronicle
     * prose. See {@link FinalBlowLines}. Three variants; consumer
     * picks based on damage-tier shape. Undefined falls through to
     * consumer-side defaults (e.g. mobile presenter's
     * derive*Phrase helpers). Closes GH#65 ask 1.
     */
    finalBlowLines?: FinalBlowLines;
    /**
     * Phase 71 — optional per-foe friendship-pact chronicle prose.
     * See {@link PactLines}. Three variants matching parley
     * posture. Only meaningful when the enemy also carries a
     * `friendshipReward`. Closes GH#65 ask 1.
     */
    pactLines?: PactLines;
    /**
     * Phase 71 — optional per-foe defeat / cause-of-loss chronicle
     * prose. See {@link CauseLines}. Three variants matching the
     * KO shape. Closes GH#65 ask 1.
     */
    causeLines?: CauseLines;
    /**
     * Phase 73 — optional per-foe codex / journal entry. Auto-fires
     * on `outcome === 'friendship'`: the engine appends the entry's
     * id to `state.codex.unlockedEntries` (de-duped) and surfaces
     * `{ id, title }` on
     * `CombatEndReport.friendshipReward.codexEntryUnlocked`. See
     * {@link CodexEntry}. Closes GH#65 ask 3.
     */
    journalEntry?: CodexEntry;
    /**
     * Content-provenance metadata used by the tuning `--focus` filter
     * (`src/Tuning/focus.parser.ts`). `addedIn` is an ISO date / phase tag;
     * `tags` are freeform labels (e.g. `'late-game'`, `'boss'`). Both
     * optional and ignored by the combat engine.
     */
    addedIn?: string;
    tags?: string[];
    /**
     * Spec 26 §3.1 — asset id for the enemy's combat portrait. Mobile resolves
     * it via the portrait registry; absent → fallback silhouette. Kebab-case
     * (e.g. `coastal-tyrant`).
     */
    portraitAsset?: string;
    /**
     * Spec 26b §2 — an enemy-level thematic tell that IMPLIES (never states) the
     * enemy's stance tendency. Per-phase `CombatThreatPhase.stanceHint` overrides
     * it; if neither is set a generic per-stance hint is used. Surfaced in the
     * combat reveal so reading the foe's character pays off in the hidden read.
     */
    stanceHint?: string;
}
