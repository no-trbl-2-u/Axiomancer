/**
 * Equip-change delta model (Phase 154 — absorbed from the mobile app's
 * `state/presenters/equipDelta.ts`).
 *
 * When the player equips, unequips, or swaps an equipment item, a client wants
 * to show **only what changes** — not the whole item or the full character
 * sheet. This computes that delta from item-instance truth, simulating the
 * equip/unequip through the engine's own `equipItem` / `unequipItem` reducers
 * and diffing the resulting `Character` stats. Effect ids resolve to their
 * engine names via `lookupEffect`.
 *
 * Contract:
 *   - Compare the candidate against the currently-worn sibling in the same slot.
 *   - No worn sibling   → gained-only (`mode: 'equip'`).
 *   - Candidate is worn → lost-only   (`mode: 'unequip'`).
 *   - Both present      → gained + lost split (`mode: 'swap'`).
 *   - Deltas only — unchanged values never surface.
 *   - Never parse affix truth out of a display name; read structured
 *     `prefixName` / `suffixName` provenance instead.
 *
 * Pure: no rendering, no string formatting beyond the engine's own effect /
 * affix labels. Voice-register chrome (canon terms, colours) is the view's job.
 */

import { equipItem as engineEquipItem, unequipItem as engineUnequipItem } from './equipment.reducer';
import { lookupEffect } from '../Effects';
import type { Character } from './types';
import type {
    Equipment,
    EquipmentProcTrigger,
    ResourceGenerationBonus,
} from '../Items/types';
import type { CombatResources } from '../Cards/types';
import type { StatModifier } from '../Effects/types';

// ─── Public types ─────────────────────────────────────────────────────────────

/**
 * Which equip operation produced this delta.
 *   - `equip`   — candidate worn into a previously-empty slot (gained only).
 *   - `unequip` — currently-worn item taken off (lost only).
 *   - `swap`    — candidate replaces a worn sibling (gained + lost).
 */
export type EquipDeltaMode = 'equip' | 'unequip' | 'swap';

/** A signed, additive stat change (e.g. `attack +2`). */
export interface StatDeltaEntry {
    stat: string;
    /** Signed net additive delta. Always non-zero (zero entries are dropped). */
    delta: number;
}

/** A modifier gained or lost. */
export interface ModifierDeltaEntry {
    id: string;
    name: string | null;
    /** Rolled value, when the source carried a `RolledModifier`. */
    value: number | null;
}

/** A passive / on-hit / on-defend effect gained or lost. `name` is the engine
 * effect name when resolvable, else `null`. */
export interface EffectDeltaEntry {
    id: string;
    name: string | null;
}

/** A resource interaction (start-tokens or generation bonus) gained or lost. */
export interface ResourceDeltaEntry {
    /** Stable key used for list rendering and tests. */
    key: string;
    resource: keyof CombatResources;
    /** Signed amount for start-tokens, or the generation bonus amount. */
    amount: number;
    /** `'start'` for combat-start tokens, or the generation trigger. */
    kind: 'start' | ResourceGenerationBonus['trigger'];
}

/** A keyword / affix label gained or lost. Only populated when the item
 * instance carries structured keyword/affix metadata; never synthesised from a
 * display name. */
export interface KeywordDeltaEntry {
    key: string;
    label: string;
}

/** One side (gained or lost) of the equip-change comparison. */
export interface EquipDeltaSide {
    modifiers: readonly ModifierDeltaEntry[];
    passiveEffects: readonly EffectDeltaEntry[];
    onHitEffects: readonly EffectDeltaEntry[];
    onDefendEffects: readonly EffectDeltaEntry[];
    resources: readonly ResourceDeltaEntry[];
    keywords: readonly KeywordDeltaEntry[];
}

export interface EquipDelta {
    mode: EquipDeltaMode;
    /** The other item in the comparison (the worn sibling for `equip`/`swap`
     * candidates, or the candidate itself for `unequip`). `null` for an
     * `equip` into an empty slot. */
    against: { id: string; name: string } | null;
    /** Net signed additive stat deltas, zero entries dropped. */
    stats: readonly StatDeltaEntry[];
    gained: EquipDeltaSide;
    lost: EquipDeltaSide;
    /** True when nothing actually changed (all sections empty). */
    isEmpty: boolean;
}

// ─── Internal aggregation helpers ─────────────────────────────────────────────

/**
 * Aggregate flat additive `statModifiers` into a stat → value map. Multipliers
 * are skipped (the engine still applies multipliers on the real equip; the
 * display delta is additive-only for legibility).
 */
function aggregateStats(equipment: Equipment): Map<string, number> {
    const out = new Map<string, number>();
    for (const mod of equipment.statModifiers ?? []) {
        if (mod.isMultiplier) continue;
        out.set(mod.stat, (out.get(mod.stat) ?? 0) + mod.value);
    }
    return out;
}

function computeStatDeltas(
    candidate: Map<string, number>,
    against: Map<string, number>,
): StatDeltaEntry[] {
    const keys = new Set<string>([...candidate.keys(), ...against.keys()]);
    const out: StatDeltaEntry[] = [];
    for (const stat of keys) {
        const delta = (candidate.get(stat) ?? 0) - (against.get(stat) ?? 0);
        if (delta !== 0) out.push({ stat, delta });
    }
    out.sort((a, b) => a.stat.localeCompare(b.stat));
    return out;
}

function characterStats(character: Character): Map<string, number> {
    const out = new Map<string, number>();
    for (const [stat, value] of Object.entries(character.derivedStats ?? {})) {
        if (typeof value === 'number' && Number.isFinite(value)) out.set(stat, value);
    }
    for (const [stat, value] of Object.entries(character.nonCombatStats ?? {})) {
        if (typeof value === 'number' && Number.isFinite(value)) out.set(stat, value);
    }
    if (typeof character.maxHealth === 'number' && Number.isFinite(character.maxHealth)) {
        out.set('maxHealth', character.maxHealth);
    }
    return out;
}

function computeCharacterStatDeltas(player: Character, after: Character): StatDeltaEntry[] {
    return computeStatDeltas(characterStats(after), characterStats(player));
}

function fullOrItemStatDeltas(
    player: Character | undefined,
    after: Character,
    fallbackCandidate: Map<string, number>,
    fallbackAgainst: Map<string, number>,
): StatDeltaEntry[] {
    if (player !== undefined) {
        const full = computeCharacterStatDeltas(player, after);
        if (full.length > 0) return full;
    }
    return computeStatDeltas(fallbackCandidate, fallbackAgainst);
}

/** Resolve an effect ID to its engine name, gracefully returning `null` when
 * the engine has no definition (e.g. content not yet published). */
function resolveEffectName(id: string): string | null {
    try {
        const def = lookupEffect(id);
        return def?.name ?? null;
    } catch {
        return null;
    }
}

/** Build a `modId → value` map of rolled-modifier ids for set-difference. */
function rolledModMap(equipment: Equipment): Map<string, number> {
    const out = new Map<string, number>();
    for (const rolled of equipment.rolledMods ?? []) {
        out.set(rolled.modId, rolled.value);
    }
    return out;
}

function diffModifiers(fromItem: Equipment, notIn: Equipment): ModifierDeltaEntry[] {
    const present = rolledModMap(fromItem);
    const other = rolledModMap(notIn);
    const out: ModifierDeltaEntry[] = [];
    for (const [id, value] of present) {
        if (other.has(id)) continue;
        out.push({ id, name: null, value });
    }
    out.sort((a, b) => a.id.localeCompare(b.id));
    return out;
}

function diffEffectIds(
    fromList: readonly string[] | undefined,
    notInList: readonly string[] | undefined,
): EffectDeltaEntry[] {
    const exclude = new Set(notInList ?? []);
    const out: EffectDeltaEntry[] = [];
    const seen = new Set<string>();
    for (const id of fromList ?? []) {
        if (exclude.has(id) || seen.has(id)) continue;
        seen.add(id);
        out.push({ id, name: resolveEffectName(id) });
    }
    out.sort((a, b) => a.id.localeCompare(b.id));
    return out;
}

function procKey(p: EquipmentProcTrigger): string {
    return `${p.effectId}:${p.target}`;
}

function diffProcs(
    fromList: readonly EquipmentProcTrigger[] | undefined,
    notInList: readonly EquipmentProcTrigger[] | undefined,
): EffectDeltaEntry[] {
    const exclude = new Set((notInList ?? []).map(procKey));
    const out: EffectDeltaEntry[] = [];
    const seen = new Set<string>();
    for (const p of fromList ?? []) {
        const key = procKey(p);
        if (exclude.has(key) || seen.has(key)) continue;
        seen.add(key);
        out.push({ id: p.effectId, name: resolveEffectName(p.effectId) });
    }
    out.sort((a, b) => a.id.localeCompare(b.id));
    return out;
}

function resourceEntries(equipment: Equipment): Map<string, ResourceDeltaEntry> {
    const out = new Map<string, ResourceDeltaEntry>();
    const ri = equipment.resourceInteraction;
    if (ri === undefined) return out;
    for (const [resource, amount] of Object.entries(ri.combatStartTokens ?? {})) {
        if (amount === undefined || amount === 0) continue;
        const key = `start:${resource}`;
        out.set(key, {
            key,
            resource: resource as keyof CombatResources,
            amount,
            kind: 'start',
        });
    }
    for (const bonus of ri.generationBonus ?? []) {
        if (bonus.bonus === 0) continue;
        const key = `${bonus.trigger}:${bonus.resourceType}`;
        out.set(key, {
            key,
            resource: bonus.resourceType,
            amount: bonus.bonus,
            kind: bonus.trigger,
        });
    }
    return out;
}

function diffResources(fromItem: Equipment, notIn: Equipment): ResourceDeltaEntry[] {
    const present = resourceEntries(fromItem);
    const other = resourceEntries(notIn);
    const out: ResourceDeltaEntry[] = [];
    for (const [key, entry] of present) {
        if (other.has(key)) continue;
        out.push(entry);
    }
    out.sort((a, b) => a.key.localeCompare(b.key));
    return out;
}

/**
 * Keyword / affix labels from structured `prefixName` / `suffixName` provenance
 * (rare drops carry both, uncommon one, common/unique neither). A `keywords`
 * array is not part of the published `Equipment` surface yet; we read it
 * defensively via a cast so the label set widens for free if it is added. Affix
 * truth is never parsed from the display name.
 */
function keywordEntries(equipment: Equipment): Map<string, KeywordDeltaEntry> {
    const out = new Map<string, KeywordDeltaEntry>();
    const provenance = equipment as Equipment & { keywords?: readonly string[] };
    if (typeof provenance.prefixName === 'string' && provenance.prefixName.length > 0) {
        out.set(`prefix:${provenance.prefixName}`, {
            key: `prefix:${provenance.prefixName}`,
            label: provenance.prefixName,
        });
    }
    if (typeof provenance.suffixName === 'string' && provenance.suffixName.length > 0) {
        out.set(`suffix:${provenance.suffixName}`, {
            key: `suffix:${provenance.suffixName}`,
            label: provenance.suffixName,
        });
    }
    for (const kw of provenance.keywords ?? []) {
        if (typeof kw !== 'string' || kw.length === 0) continue;
        out.set(`kw:${kw}`, { key: `kw:${kw}`, label: kw });
    }
    return out;
}

function diffKeywords(fromItem: Equipment, notIn: Equipment): KeywordDeltaEntry[] {
    const present = keywordEntries(fromItem);
    const other = keywordEntries(notIn);
    const out: KeywordDeltaEntry[] = [];
    for (const [key, entry] of present) {
        if (other.has(key)) continue;
        out.push(entry);
    }
    out.sort((a, b) => a.key.localeCompare(b.key));
    return out;
}

function emptySide(): EquipDeltaSide {
    return {
        modifiers: [],
        passiveEffects: [],
        onHitEffects: [],
        onDefendEffects: [],
        resources: [],
        keywords: [],
    };
}

function buildSide(fromItem: Equipment, notIn: Equipment): EquipDeltaSide {
    return {
        modifiers: diffModifiers(fromItem, notIn),
        passiveEffects: diffEffectIds(fromItem.passiveEffects, notIn.passiveEffects),
        onHitEffects: diffProcs(fromItem.onHitEffects, notIn.onHitEffects),
        onDefendEffects: diffProcs(fromItem.onDefendEffects, notIn.onDefendEffects),
        resources: diffResources(fromItem, notIn),
        keywords: diffKeywords(fromItem, notIn),
    };
}

function sideIsEmpty(side: EquipDeltaSide): boolean {
    return (
        side.modifiers.length === 0 &&
        side.passiveEffects.length === 0 &&
        side.onHitEffects.length === 0 &&
        side.onDefendEffects.length === 0 &&
        side.resources.length === 0 &&
        side.keywords.length === 0
    );
}

/** A zero-valued equipment used as the "other" side when computing a one-sided
 * (equip-into-empty / unequip) delta. */
const EMPTY_EQUIPMENT: Equipment = {
    id: '__none__',
    name: '',
    description: '',
    category: 'equipment',
    slot: 'weapon',
    rarity: 'common',
    requiredLevel: 0,
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Compute the equip-change delta for `candidate` against the currently worn
 * sibling (`worn`, or `null` for an empty slot). When a `player` Character is
 * supplied, stat deltas are the full recomputed-character diff (via the engine
 * `equipItem` / `unequipItem` reducers); otherwise they fall back to the
 * item-level additive stat diff.
 *
 *   - `worn === null`            → `equip`   (gained only)
 *   - `worn.id === candidate.id` → `unequip` (lost only)
 *   - otherwise                  → `swap`    (gained + lost)
 */
export function computeEquipDelta(
    candidate: Equipment,
    worn: Equipment | null,
    player?: Character,
): EquipDelta {
    if (worn === null) {
        const gained = buildSide(candidate, EMPTY_EQUIPMENT);
        const stats =
            player === undefined
                ? computeStatDeltas(aggregateStats(candidate), new Map())
                : fullOrItemStatDeltas(
                      player,
                      engineEquipItem(player, candidate),
                      aggregateStats(candidate),
                      new Map(),
                  );
        return {
            mode: 'equip',
            against: null,
            stats,
            gained,
            lost: emptySide(),
            isEmpty: stats.length === 0 && sideIsEmpty(gained),
        };
    }

    if (worn.id === candidate.id) {
        const lost = buildSide(candidate, EMPTY_EQUIPMENT);
        const stats =
            player === undefined
                ? computeStatDeltas(new Map(), aggregateStats(candidate))
                : fullOrItemStatDeltas(
                      player,
                      engineUnequipItem(player, candidate.slot),
                      new Map(),
                      aggregateStats(candidate),
                  );
        return {
            mode: 'unequip',
            against: { id: candidate.id, name: candidate.name },
            stats,
            gained: emptySide(),
            lost,
            isEmpty: stats.length === 0 && sideIsEmpty(lost),
        };
    }

    const stats =
        player === undefined
            ? computeStatDeltas(aggregateStats(candidate), aggregateStats(worn))
            : fullOrItemStatDeltas(
                  player,
                  engineEquipItem(player, candidate),
                  aggregateStats(candidate),
                  aggregateStats(worn),
              );
    const gained = buildSide(candidate, worn);
    const lost = buildSide(worn, candidate);
    return {
        mode: 'swap',
        against: { id: worn.id, name: worn.name },
        stats,
        gained,
        lost,
        isEmpty: stats.length === 0 && sideIsEmpty(gained) && sideIsEmpty(lost),
    };
}

export type { StatModifier };
