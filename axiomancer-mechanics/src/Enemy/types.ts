import { Card } from '../Cards/types';
import { MapName } from '../World/map.library';
import { BaseStats } from '../Character/types';
import { ActiveEffect } from '../Effects/types';
import { Item } from '../Items/types';
// Phase 73 — CodexEntry's semantic home is src/Game/types.ts (alongside
// CodexState + the Game-loop persistence surface). It's re-exported here
// so `Enemy.journalEntry?: CodexEntry` decoration works at the per-foe
// content site without import churn for consumers reading from the Enemy
// barrel. See critique-37 row 2 → iterate-`d0f0d73`-era drain for the
// reasoning trail.
import type { CodexEntry } from '../Game/types';
export type { CodexEntry };
import type { EnemyKeyword, EnemyStage } from './enemy-keywords';
export type { EnemyKeyword, EnemyStage };

/**
 * Per-enemy befriend gate, read by The Open Hand (`befriendHpGateOpen`,
 * `Enemy/befriend.ts`). Absent = the foe is always open to a befriend.
 */
export interface BefriendabilityConfig {
    /**
     * Friendship eligibility requires `enemy.health / enemy.maxHealth`
     * to be at or below `belowPct` at the eligibility check. Pure
     * snapshot — healing back above the threshold un-qualifies
     * eligibility. Range [0, 1].
     */
    hpGate?: { belowPct: number };
}

/**
 * Decision-making label an enemy carries (Spec 07). Data only: nothing reads
 * it. The Hazard-Pattern engine drives every foe through its authored threat
 * sequence, and the legacy turn-based AI that branched on this label (and on
 * the player's stance) was removed with that driver.
 */
export type EnemyLogic =
    | 'random' | 'aggressive' | 'defensive' | 'balanced' | 'strategic' | 'boss';

/**
 * Difficulty classification used by the world to seed encounters.
 */
export type EnemyDifficulty = 'simple' | 'normal' | 'elite' | 'boss' | 'unique';

/**
 * Phase 60 — per-enemy content awarded when combat resolves via
 * friendship (Phase 36's `outcome === 'friendship'` path).
 *
 * Layered ON TOP OF the existing Phase 36 base: half-XP +
 * full loot. None of the FriendshipReward fields
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
 * @property cards        - Optional card rotation the enemy can use.
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
    mapName: MapName;
    logic: EnemyLogic;
    difficulty?: EnemyDifficulty;
    cards?: Card[];
    /** Weighted drop table — see {@link LootTableEntry}. */
    loot?: LootTableEntry[];
    /** Flat experience-point award on kill. Defaults computed by difficulty. */
    xpReward?: number;
    effects: ActiveEffect[];
    /**
     * Phase 60 — optional per-enemy reward content surfaced on
     * `outcome === 'friendship'`. See {@link FriendshipReward}.
     * When undefined, the enemy's friendship resolution is purely
     * mechanical (Phase 36 base only: half-XP + weighted-loot roll).
     */
    friendshipReward?: FriendshipReward;
    /** The befriend gate The Open Hand reads. See {@link BefriendabilityConfig}. */
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
     * Content-provenance metadata (originally consumed by the since-retired
     * tuning `--focus` filter). `addedIn` is an ISO date / phase tag;
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
     * The foe's combat keywords. Empty since the revamp deleted all eleven
     * (D63); the optional slot stays so B2 can re-add them. See
     * {@link EnemyKeyword}.
     */
    keywords?: EnemyKeyword[];
    /**
     * THE BIG NUMBERS REWRITE (2026-09-02) — boss/unique STAGES: the VITAE (or
     * round) thresholds at which this foe becomes a different fight. Checked at
     * phase boundaries; each fires at most once. See {@link EnemyStage}.
     */
    stages?: EnemyStage[];
}
