/**
 * MapEvents (Spec 23) — type surface.
 *
 * Eleven event kinds plus a weighted-pool authoring model. ('quest' joined
 * the original eight in Phase 137 and was retired in Phase 61 — the
 * Quest Board minigame it launched is gone.) See `specs/23-map-events.md`
 * for the original spec; see
 * `src/World/MapEvents/resolve-map-event.ts` for the dispatcher.
 */

import type { ActiveEffect } from '../../Effects/types';
import type { GameState } from '../../Game/types';
import type { Item } from '../../Items/types';
import type { ShopInventory } from '../../Items/shop.types';
import type { NPC, DialogueTree } from '../../NPCs/types';
import type { EnemySlug } from '../../Enemy/enemy.library';
import type { ContinentName, MapName } from '../map.library';
import type { Encounter, NodeId } from '../types';
import type { PhilosophicalAlignment } from '../../Ledger/types';
import type { BlacksmithVariantOffer } from '../Blacksmith/blacksmith.types';

/**
 * The MapEvent kinds. 'narration' (a dialogue-backed monologue shell)
 * joined the original eight in 2026-06; 'quest' (Phase 137) was retired
 * in Phase 61; 'travel' (inter-map doors) joined 2026-08-28.
 */
export type MapEventKind =
    | 'encounter'
    | 'interaction'
    | 'gathering'
    | 'rest'
    | 'village'
    | 'cutscene'
    | 'hazard'
    | 'loot-cache'
    | 'narration'
    | 'blacksmith'
    | 'travel';

// ─── Per-kind authoring payloads ──────────────────────────────────────────────

export interface EncounterPayload {
    kind: 'encounter';
    /** Specific enemy slug; if omitted, the encounter generator picks. */
    enemySlug?: EnemySlug;
    /** Boss flag — affects scaling and downstream UI framing. */
    isBoss?: boolean;
    /**
     * Absolute level to scale the enemy to, overriding the default
     * `max(enemy.level, player.level)` scaling. Lets an authored encounter
     * pin a fixed difficulty — e.g. a starting-region boss that must stay
     * beatable by a fresh player even though the shared enemy is endgame-tier.
     */
    level?: number;
    description?: string;
}

export interface InteractionPayload {
    kind: 'interaction';
    /** NPC name on the current map. */
    npcName: string;
    description?: string;
}

export interface GatheringPayload {
    kind: 'gathering';
    /** Items the player gathers. Cloned at resolution time. */
    items: readonly Item[];
    description?: string;
}

/**
 * Shelter class of a rest node (Phase 52b).
 *
 * `'inn'` is a PAID, tended shelter — full-recovery semantics, and the
 * only place hazard-scarred max-VITAE is mended back toward baseline.
 * `'camp'` is anything in the wild: a spring, a mossy log, a corner of
 * the labyrinth the house forgot to make uncomfortable.
 *
 * This replaces the retired `healFraction >= 1.0` heuristic, which was
 * wrong on the authored content: `nf-4`, `nf-24` and every `fvRestPool`
 * node were all authored at 1.0, so two forest springs mended scars like
 * a paid shelter. "Is this an inn?" is now authored, never inferred.
 */
export type RestShelter = 'camp' | 'inn';

export interface RestPayload {
    kind: 'rest';
    /**
     * Shelter class. Defaults to `'camp'` — a node that forgot to say is
     * wilderness. Never infer this from a heal magnitude; see
     * `rest-shelter.ts`.
     */
    shelter?: RestShelter;
    description?: string;
}

export interface VillagePayload {
    kind: 'village';
    villageName: string;
    /** Shopkeepers / merchants present in the scene. */
    merchants?: readonly NPC[];
    /**
     * Transactional shop attached to this village (Phase 37). Authoring
     * is optional — a village can carry merchants for dialogue without
     * a shop, or a shop without named merchants.
     */
    shop?: ShopInventory;
    description?: string;
}

export interface CutscenePayload {
    kind: 'cutscene';
    /** Ordered narration lines. */
    lines: readonly string[];
    description?: string;
}

export interface HazardPayload {
    kind: 'hazard';
    /** Effect IDs (from `src/Effects/`) applied to the player on arrival. */
    effectIds?: readonly string[];
    /** Flat damage applied to the player on arrival. */
    damage?: number;
    description?: string;
}

export interface LootCachePayload {
    kind: 'loot-cache';
    items?: readonly Item[];
    currency?: number;
    description?: string;
}

export interface NarrationPayload {
    kind: 'narration';
    /**
     * Dialogue tree the narration plays through (`src/NPCs/types.ts`). A
     * narration is authored as a monologue — leaf `DialogueNode`s with no
     * `choices` — so it reuses the existing dialogue runtime without
     * branching. Unlike `interaction`, the tree is authored inline on the
     * node rather than looked up from a map NPC.
     */
    dialogue: DialogueTree;
    description?: string;
}

/**
 * Blacksmith node ("The Anvil", Spec 33 §6 / Phase D5). Hands the host an
 * authored budget + variant-gear offers; the host launches a
 * `World/Blacksmith` session from them (the sandboxed launch contract the
 * hazard minigame uses). The handler touches no state — it only
 * validates the offered gear against the die-gear caps.
 *
 * RULED (T, attended chat, 2026-08-08; resolved Phase 52c) the anvil was
 * reached THROUGH the rest node, one of `World/RestChoice`'s offers. Phase
 * 59 dropped that offer (T direct, 2026-08-15) and Phase 60 re-homed the
 * anvil to its own placed `blacksmith` node — a single fixed placement at
 * fishing-village `fv-21`, mirroring the D6c precedent (one owner-ruled
 * node, not a repeating cadence). See `MapEvents/content.ts`'s
 * `FV_BLACKSMITH_NODES`.
 */
export interface BlacksmithPayload {
    kind: 'blacksmith';
    /** Spendable budget for this visit (PLACEHOLDER unit; host maps ◆/souls). */
    budget?: number;
    /** Variant gear pieces offered for swap this visit. */
    variants?: readonly BlacksmithVariantOffer[];
    description?: string;
}

/**
 * Travel node — an inter-map DOOR (2026-08-28). Resolving it walks the
 * player out of the current map: the departed map's runtime `MapState` is
 * preserved under `WorldState.mapStates` and the map is marked in
 * `completedMaps` (the world is a place, not a checklist — completing a
 * map means "walked through", never "reset"); the destination map is
 * unlocked if locked, the continent switches when it differs, and the
 * destination becomes `currentMap` (restored if previously departed,
 * fresh otherwise). One-way per door, repeatable: the dispatcher never
 * consumes a travel node, so re-resolving it travels again.
 */
export interface TravelPayload {
    kind: 'travel';
    destinationContinent: ContinentName;
    destinationMap: MapName;
    description?: string;
}

/** Discriminated union of all authoring payloads. */
export type MapEventPayload =
    | EncounterPayload
    | InteractionPayload
    | GatheringPayload
    | RestPayload
    | VillagePayload
    | CutscenePayload
    | HazardPayload
    | LootCachePayload
    | NarrationPayload
    | BlacksmithPayload
    | TravelPayload;

// ─── Pools ────────────────────────────────────────────────────────────────────

export interface MapEventPoolEntry {
    /** Must match `payload.kind`. */
    kind: MapEventKind;
    /** Weight for weighted-random draw; must be positive. */
    weight: number;
    payload: MapEventPayload;
    /**
     * Per-axis shift on the Phase 42 philosophical alignment cube, applied
     * by `resolveMapEvent` after the matching handler runs. Each axis clamps
     * to [-100, +100]. Missing axes in the partial pass through unchanged.
     * Authoring band: ±1..±5; defining ±10 choices reserved for endgame.
     */
    alignmentDelta?: Partial<PhilosophicalAlignment>;
}

export interface MapEventPool {
    id: string;
    entries: readonly MapEventPoolEntry[];
}

// ─── Resolved events (the engine's output) ────────────────────────────────────

// Phase 58 — every kind below except 'cutscene' (already delivers its
// authored prose via `lines`) and 'none' (nothing to say) carries the
// optional `description` threaded straight from its `MapEventPayload`.
// Presenters prefer it over their kind-keyed placeholder text; see
// `axiomancer-mobile/state/presenters/event.engine.ts::bodyFromPayload`.
export type ResolvedEvent =
    | { kind: 'encounter';   encounter: Encounter; isBoss: boolean; description?: string }
    | { kind: 'interaction'; npcName: string; dialogue?: DialogueTree; description?: string }
    | { kind: 'gathering';   items: Item[]; description?: string }
    // Phase 52b — the authored `healFraction` is retired; the resolved rest
    // event carries the SHELTER CLASS so hosts (and 52c's rest-choice
    // engine) decide the heal from an honest marker rather than a number.
    // `healed` remains a computed OUTCOME, not an authoring knob.
    | { kind: 'rest';        healed: number; shelter: RestShelter; description?: string }
    | { kind: 'village';     villageName: string; merchants: NPC[]; shop?: ShopInventory; description?: string }
    | { kind: 'cutscene';    lines: readonly string[] }
    | { kind: 'hazard';      effects: ActiveEffect[]; damage: number; description?: string }
    | { kind: 'loot-cache';  items: Item[]; currency: number; description?: string }
    | { kind: 'narration';   dialogue: DialogueTree; description?: string }
    | { kind: 'blacksmith';  budget: number; variants: readonly BlacksmithVariantOffer[]; description?: string }
    // The world state on the result has already crossed; the resolved event
    // names where the door led so hosts can narrate the departure.
    | { kind: 'travel';      destinationContinent: ContinentName; destinationMap: MapName; description?: string }
    | { kind: 'none' };

export interface ResolveMapEventResult {
    state: GameState;
    event: ResolvedEvent;
}

// ─── Re-export NodeId for downstream consumers ────────────────────────────────
export type { NodeId };
