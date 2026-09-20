/**
 * WS6.1 — the reward-draft harness (card-library improvement plan,
 * `plan/tuning/2026-07-11-card-library-improvement-plan-detailed.md`).
 *
 * Simulates the post-combat REWARD SCREEN per preset ORIGIN: for a given
 * preset (theme), roll N reward screens through `rollCombatCardRewards` with a
 * player whose archetype matches the origin's dominant card aspect, apply a
 * deterministic pick policy (rank the 3 offers by the origin focus's
 * verb-class fit, tie-break by rarity), and tally per-card pick counts.
 *
 * This is TELEMETRY ONLY — no balance judgment lives here. The WS6.3 evidence
 * gate ("each bridge picked by ≥2 distinct origins at a non-trivial rate")
 * reads these counts; the harness just produces them reproducibly.
 *
 * Pure and hermetic: all randomness flows through a LOCAL seeded LCG (same
 * Park-Miller constants as `Utils/rng`), never the global singleton and never
 * `Math.random` — the same (originId, seed, screens) always yields identical
 * counts.
 */

import { Player } from '../Character/characters.mock';
import type { Character } from '../Character/types';
import { deepClone } from '../Utils';
import { getCardById } from '../Cards/cards.library';
import { SANDBOX_CARD_SETS, applySandboxSet } from '../Cards/cards.sandbox-sets';
import { rankToRarity, type StatType } from '../Cards/types';
import { lookupEffect } from '../Effects';
import { rollCombatCardRewards } from './combat.rewards';
import { toCombatCard } from './combat.cards';
import { focusWeight, OFF_FOCUS_WEIGHT } from './combat.deck-draft';
import { getDeckPreset, type CombatDeckFocus, type CombatDeckPreset } from './combat.starter-deck-presets';

/** Offers rolled per reward screen (mirrors the aftermath's 1-of-3 pick). */
const OFFERS_PER_SCREEN = 3;
/** Default screens per origin (WS6.1: N=200). */
const DEFAULT_SCREENS = 200;

/** Rarity tie-break order: the policy models a player who, between equally
 *  on-focus offers, takes the rarer prize. */
const RARITY_PICK_ORDER: Readonly<Record<'common' | 'uncommon' | 'rare', number>> =
    Object.freeze({ common: 1, uncommon: 2, rare: 3 });

/** Local Park-Miller LCG (same constants as `Utils/rng`'s `SimpleRng`) so the
 *  sim never touches the global singleton — pure by construction. */
function makeSeededRng(seed: number): () => number {
    let state = Math.abs(seed % 2147483647) || 1;
    return (): number => {
        state = (state * 48271) % 2147483647;
        return state / 2147483647;
    };
}

/**
 * The origin's archetype = the dominant `philosophicalAspect` across the
 * preset's 15-card recipe (duplicates count — commons carry the deck's
 * texture). Tie precedence matches `playerArchetype` (body ≥ mind ≥ heart),
 * so the derived stat spread and the engine's derivation can never disagree.
 */
function originArchetype(preset: CombatDeckPreset): StatType {
    const tally: Record<StatType, number> = { heart: 0, body: 0, mind: 0 };
    for (const id of preset.cardIds) {
        const card = getCardById(id);
        // Phase 104 — grey (`'any'`) cards lean nowhere; they leave the tally alone.
        if (card && card.philosophicalAspect !== 'any') tally[card.philosophicalAspect]++;
    }
    if (tally.body >= tally.heart && tally.body >= tally.mind) return 'body';
    if (tally.mind >= tally.heart && tally.mind >= tally.body) return 'mind';
    return 'heart';
}

/** A minimal player whose dominant base stat pins `playerArchetype` to the
 *  origin's aspect — `rollCombatCardRewards` reads nothing else. */
function makeOriginPlayer(archetype: StatType): Character {
    const p = deepClone(Player);
    p.baseStats = { heart: 2, body: 2, mind: 2 };
    p.baseStats[archetype] = 9;
    return p;
}

/**
 * WS6.2 — the sandbox-injection hook: how extra (non-library) cards enter the
 * simulated reward pool so they can be MEASURED at reward screens.
 *
 * - `sandboxSetId` names a set in `SANDBOX_CARD_SETS`; the sim resolves it
 *   (throwing on an unknown id), APPLIES it into the process-global sandbox
 *   registry when its cards are not yet resolvable (so `getCardById` — and
 *   therefore the roll's validity filter — can see them), and appends the
 *   set's new-card ids to the reward pool. NOTE the one impurity this buys:
 *   applying a set registers into the module-level sandbox registry and the
 *   sim does NOT clear it (the caller owns the experiment lifecycle — the
 *   playtest CLI's `--sandbox` law; tests clear via `clearSandboxCards()`).
 *   Determinism is unaffected: same (origin, seed, screens, injected ids) →
 *   identical counts.
 * - `extraPool` appends explicit ids; they must already resolve through
 *   `getCardById` (register first) or the roll's filter drops them silently.
 */
export interface RewardDraftSimOptions {
    /** A `SANDBOX_CARD_SETS` id whose cards join the reward pool. */
    sandboxSetId?: string;
    /** Explicit extra candidate ids (must already be registered/resolvable). */
    extraPool?: readonly string[];
}

/** Result of one origin's reward-draft sim (telemetry, no judgment). */
export interface RewardDraftSimResult {
    /** The preset origin simulated (e.g. 'erosion'). */
    originId: string;
    /** The origin's derived archetype (drives the reward roll's 2× bias). */
    archetype: StatType;
    /** The origin's focus (drives the pick policy's verb-class ranking). */
    focus: CombatDeckFocus;
    /** Screens simulated. */
    screens: number;
    /** The seed the run is reproducible from. */
    seed: number;
    /** Per-card PICK counts (cardId → times chosen). Values sum to `screens`. */
    picks: Record<string, number>;
    /** Per-card OFFER counts (cardId → times shown). Values sum to
     *  `screens × 3`. Distinguishes "never offered" from "offered, never
     *  picked" when WS6.3 reads the pick rates. */
    offers: Record<string, number>;
    /** WS6.2 — the extra (non-library) ids injected into this run's pool, in
     *  injection order (explicit `extraPool` first, then the sandbox set's
     *  cards). Empty for a plain library run. Part of the reproduction
     *  contract: the same (origin, seed, screens, extraPoolIds) → same counts. */
    extraPoolIds: readonly string[];
}

/** Ranks one screen's offers by focus fit, tie-break by rarity, tie-break by
 *  offer order (stable) — returns the picked card id. */
function pickOffer(offerIds: readonly string[], focus: CombatDeckFocus): string {
    let bestId = offerIds[0];
    let bestWeight = -Infinity;
    let bestRarity = -Infinity;
    for (const id of offerIds) {
        const combat = toCombatCard(id, getCardById, lookupEffect);
        const weight = combat ? focusWeight(focus, combat.verbClass) : OFF_FOCUS_WEIGHT;
        const rarity = RARITY_PICK_ORDER[rankToRarity(getCardById(id)?.rank ?? 1)];
        // Strict > keeps the EARLIEST offer on a full tie (stable, like the
        // policy rank in `combat.encounter.sim.ts`).
        if (weight > bestWeight || (weight === bestWeight && rarity > bestRarity)) {
            bestWeight = weight;
            bestRarity = rarity;
            bestId = id;
        }
    }
    return bestId;
}

/**
 * WS6.2 — resolves the injected extra pool for a run: the explicit
 * `extraPool` ids first, then the named sandbox set's new-card ids. Applies
 * the sandbox set into the global registry when its cards do not yet resolve
 * (see {@link RewardDraftSimOptions} for the lifecycle contract). Throws on an
 * unknown set id — a silently-empty injection would read as a dead-bridge
 * finding in WS6.3.
 */
function resolveExtraPool(options: RewardDraftSimOptions): string[] {
    const extra = [...(options.extraPool ?? [])];
    if (options.sandboxSetId !== undefined) {
        const set = SANDBOX_CARD_SETS[options.sandboxSetId];
        if (!set) {
            throw new Error(`runRewardDraftSim: unknown sandbox set '${options.sandboxSetId}'`);
        }
        // Apply unless every new card already resolves (idempotent re-entry
        // for callers — e.g. the playtest CLI — that applied the set earlier).
        // Overrides-only sets always re-apply: override merging is idempotent.
        const live = set.cards.length > 0 && set.cards.every(c => !!getCardById(c.id));
        if (!live) applySandboxSet(set.id);
        for (const card of set.cards) {
            if (!extra.includes(card.id)) extra.push(card.id);
        }
    }
    return extra;
}

/**
 * Simulates `screens` reward screens for one preset origin: each screen rolls
 * `rollCombatCardRewards` (3 distinct offers, archetype-biased 2×, rarity
 * weights per spec 32 v3 §4) with the origin's derived archetype, then the
 * pick policy takes the best offer by `focusWeight(origin.focus, verbClass)`,
 * rarity tie-break. Deterministic for a given (originId, seed, screens) — and,
 * with the WS6.2 hook, a given injected pool. Throws on an unknown origin id —
 * a silent empty result would read as a dead-origin finding.
 */
export function runRewardDraftSim(
    originId: string,
    seed: number,
    screens = DEFAULT_SCREENS,
    options: RewardDraftSimOptions = {},
): RewardDraftSimResult {
    const preset = getDeckPreset(originId);
    if (!preset) throw new Error(`runRewardDraftSim: unknown preset origin '${originId}'`);

    const archetype = originArchetype(preset);
    const player = makeOriginPlayer(archetype);
    const rng = makeSeededRng(seed);
    const extraPoolIds = resolveExtraPool(options);

    const picks: Record<string, number> = {};
    const offers: Record<string, number> = {};
    for (let i = 0; i < screens; i++) {
        const offerIds = rollCombatCardRewards(player, rng, OFFERS_PER_SCREEN, extraPoolIds);
        for (const id of offerIds) offers[id] = (offers[id] ?? 0) + 1;
        const picked = pickOffer(offerIds, preset.focus);
        picks[picked] = (picks[picked] ?? 0) + 1;
    }

    return { originId, archetype, focus: preset.focus, screens, seed, picks, offers, extraPoolIds };
}
