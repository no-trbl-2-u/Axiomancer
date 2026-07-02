/**
 * Item Factory — `dropItem` (Spec 05c) + Spec 05d catalogue integration.
 *
 * Turns an authored `EquipmentTemplate` / `UniqueItemTemplate` into a runtime
 * `Equipment` instance. Rarity is decided either by the caller (loot tables /
 * tests) or by a weighted random draw against the table in Spec 05c §9.
 *
 * Modifier rolls and payload merging now run through the Spec 05d catalogue
 * (`src/Items/modifier.catalogue.ts`). Per Spec 05d Q3 the resolve step
 * substitutes rolled values into `value: 0` / `bonus: 0` / `0` token sentinels
 * inside each mod's `payload`, then concatenates array fields and sums
 * `combatStartTokens` across mods so the existing `equipItem` /
 * `getEquipmentModifiers` / `aggregateCombatStartTokens` pipeline picks
 * everything up transparently.
 *
 * Determinism — every random draw inside the factory consumes from the
 * caller-supplied `rng` (defaults to `Math.random`). Two calls with the same
 * seeded `rng` produce identical Equipment instances. This keeps Spec 05c /
 * 05d hermetically testable today and aligns with Spec 11's seeded-RNG design.
 */

import {
    Equipment,
    EquipmentTemplate,
    UniqueItemTemplate,
    ItemRarity,
    RolledModifier,
    EquipmentProcTrigger,
    ResourceInteraction,
    ResourceGenerationBonus,
} from './types';
import { CombatResources } from '../Cards/types';
import { StatModifier } from '../Effects/types';
import { getEquipmentTemplate } from './equipment.templates';
import { getUniqueTemplate } from './unique.templates';
import {
    Modifier,
    HiddenModRarity,
    HIDDEN_MOD_RARITY_WEIGHTS,
} from './modifier.types';
import {
    MOD_POOLS,
    uniqueModPool,
    getModifierById,
    pickValueTier,
} from './modifier.catalogue';
import { Affix, AffixRole } from './modifier.types';
import {
    affixesForSlot,
    composeItemName,
    getAffixById,
    isOffensiveStatusAffix,
    AFFIX_RARITY_WEIGHTS,
} from './affix.library';
import { STATUS_AFFIX_DRAW_BIAS } from '../Game/game-mechanics.constants';

// ─── Rarity weight table (Spec 05c §9) ───────────────────────────────────────

// Phase 133 rebalancing: Improved progression feel with more exciting drops
// while maintaining common items as viable baseline progression.
//
// Previous: Common 60%, Uncommon 30%, Rare 9%, Unique 1%
// Updated:  Common 50%, Uncommon 35%, Rare 14%, Unique 1%
//
// Rationale:
// - Reduced common weight to make upgrades more frequent and exciting
// - Increased uncommon weight to provide more build experimentation opportunities
// - Significantly increased rare weight for better late-game engagement
// - Maintained unique rarity at 1% to preserve their special status
//
const RARITY_WEIGHTS: ReadonlyArray<readonly [Exclude<ItemRarity, 'unique'>, number]> = [
    ['common',   50],
    ['uncommon', 35],
    ['rare',     14],
];
const RARITY_WEIGHTS_WITH_UNIQUE: ReadonlyArray<readonly [ItemRarity, number]> = [
    ...RARITY_WEIGHTS,
    ['unique', 1],
];

function drawWeighted<T>(
    entries: ReadonlyArray<readonly [T, number]>,
    rng: () => number,
): T {
    const total = entries.reduce((acc, [, w]) => acc + w, 0);
    const roll = rng() * total;
    let cursor = 0;
    for (const [value, weight] of entries) {
        cursor += weight;
        if (roll < cursor) return value;
    }
    return entries[entries.length - 1]![0];
}

// ─── Roll & resolve ──────────────────────────────────────────────────────────

const MODS_PER_RARITY: Record<ItemRarity, number> = {
    common:   0,
    uncommon: 1,
    rare:     2,
    unique:   3,
};

function isUnique(template: EquipmentTemplate): template is UniqueItemTemplate {
    return Array.isArray((template as UniqueItemTemplate).fixedModIds);
}

/** Inclusive uniform integer roll across `[min, max]`. */
function rollInRange(min: number, max: number, rng: () => number): number {
    if (max <= min) return min;
    return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Filters a pool to mods with at least one `levelTier.levelReq <= playerLevel`.
 * Mods with no eligible tier are excluded from the procedural draw.
 */
function eligibleMods(pool: Modifier[], playerLevel: number): Modifier[] {
    return pool.filter(mod => mod.levelTiers.some(t => t.levelReq <= playerLevel));
}

/**
 * Weighted sample without replacement from `pool` using each mod's
 * `hiddenRarity` weight. Throws if `count` exceeds the pool size.
 */
function sampleByHiddenRarity(
    pool: Modifier[],
    count: number,
    rng: () => number,
): Modifier[] {
    if (pool.length < count) {
        throw new Error(
            `dropItem: requested ${count} mods but only ${pool.length} eligible.`,
        );
    }
    const remaining = pool.slice();
    const picked: Modifier[] = [];
    for (let i = 0; i < count; i++) {
        const entries = remaining.map(mod =>
            [mod, HIDDEN_MOD_RARITY_WEIGHTS[mod.hiddenRarity as HiddenModRarity]] as const,
        );
        const choice = drawWeighted(entries, rng);
        picked.push(choice);
        const idx = remaining.indexOf(choice);
        remaining.splice(idx, 1);
    }
    return picked;
}

/**
 * Rolls the modifier list for a given (template, rarity, playerLevel).
 *
 * - `common`            — empty array.
 * - `uncommon` / `rare` — N distinct procedural mods drawn (weighted-without-
 *                         replacement) from the slot's procedural pool. Mods
 *                         without an eligible level tier are filtered out.
 * - `unique`            — the template's `fixedModIds` triple, in declaration
 *                         order, with values rolled from the catalogue.
 *                         Requires a `UniqueItemTemplate`.
 */
export function rollModifiers(
    template: EquipmentTemplate,
    rarity: ItemRarity,
    playerLevel: number,
    rng: () => number,
): RolledModifier[] {
    if (rarity === 'common') return [];

    if (rarity === 'unique') {
        if (!isUnique(template)) {
            throw new Error(
                `dropItem: rarity 'unique' requires a UniqueItemTemplate; ` +
                `template '${template.id}' has no fixedModIds.`,
            );
        }
        return template.fixedModIds.map(modId => {
            const mod = getModifierById(modId);
            if (!mod) {
                // Unknown unique-template mod ID — keep the shape stable, roll 0.
                return { modId, value: 0 };
            }
            const tier = pickValueTier(mod, playerLevel);
            const value = tier ? rollInRange(tier.range[0], tier.range[1], rng) : 0;
            return { modId, value };
        });
    }

    const count = MODS_PER_RARITY[rarity];
    const pool = MOD_POOLS[template.slot] ?? [];
    const eligible = eligibleMods(pool, playerLevel);
    if (eligible.length < count) {
        throw new Error(
            `dropItem: eligible procedural pool for slot '${template.slot}' at ` +
            `playerLevel ${playerLevel} has ${eligible.length} entries; ` +
            `cannot roll ${count} distinct mods for rarity '${rarity}'.`,
        );
    }

    const sampled = sampleByHiddenRarity(eligible, count, rng);
    return sampled.map(mod => {
        const tier = pickValueTier(mod, playerLevel)!;
        return { modId: mod.id, value: rollInRange(tier.range[0], tier.range[1], rng) };
    });
}

/**
 * Resolves rolled mods + base template stats into the `Equipment` payload
 * fields the engine consumes (`statModifiers`, `passiveEffects`,
 * `onHitEffects`, `onDefendEffects`, `resourceInteraction`).
 *
 * Per Spec 05d:
 *   - Array fields are concatenated (not replaced).
 *   - `value: 0` sentinels in `payload.statModifiers` get the rolled value.
 *   - `bonus: 0` sentinels in `generationBonus` entries get the rolled value.
 *   - `0` values inside `combatStartTokens` get the rolled value, then the
 *     keys are summed across all rolled mods (additive — Spec 05b Q2).
 */
export function resolveModifiers(
    template: EquipmentTemplate,
    rolledMods: RolledModifier[],
): Pick<Equipment,
    'statModifiers' | 'passiveEffects' | 'onHitEffects' | 'onDefendEffects' | 'resourceInteraction'
> {
    const statModifiers: StatModifier[] = [];
    const passiveEffects: string[] = [];
    const onHitEffects: EquipmentProcTrigger[] = [];
    const onDefendEffects: EquipmentProcTrigger[] = [];
    const startTokens: Partial<CombatResources> = {};
    const generationBonus: ResourceGenerationBonus[] = [];

    if (template.baseStatModifiers) {
        statModifiers.push(...template.baseStatModifiers);
    }

    const addStartTokens = (delta: Partial<CombatResources>, rolledValue: number): void => {
        for (const key of Object.keys(delta) as Array<keyof CombatResources>) {
            const raw = delta[key];
            if (typeof raw !== 'number') continue;
            const concrete = raw === 0 ? rolledValue : raw;
            startTokens[key] = (startTokens[key] ?? 0) + concrete;
        }
    };

    for (const rolled of rolledMods) {
        const mod = getModifierById(rolled.modId);
        if (!mod) continue;
        const { payload } = mod;

        if (payload.statModifiers) {
            for (const sm of payload.statModifiers) {
                const value = sm.value === 0 ? rolled.value : sm.value;
                const next: StatModifier = { stat: sm.stat, value };
                if (sm.isMultiplier) next.isMultiplier = true;
                statModifiers.push(next);
            }
        }
        if (payload.passiveEffects) {
            passiveEffects.push(...payload.passiveEffects);
        }
        if (payload.onHitEffects) {
            onHitEffects.push(...payload.onHitEffects);
        }
        if (payload.onDefendEffects) {
            onDefendEffects.push(...payload.onDefendEffects);
        }
        if (payload.resourceInteraction) {
            const ri = payload.resourceInteraction;
            if (ri.combatStartTokens) addStartTokens(ri.combatStartTokens, rolled.value);
            if (ri.generationBonus) {
                for (const entry of ri.generationBonus) {
                    const bonus = entry.bonus === 0 ? rolled.value : entry.bonus;
                    generationBonus.push({
                        trigger: entry.trigger,
                        resourceType: entry.resourceType,
                        bonus,
                    });
                }
            }
        }
    }

    const out: Pick<Equipment,
        'statModifiers' | 'passiveEffects' | 'onHitEffects' | 'onDefendEffects' | 'resourceInteraction'
    > = {};

    if (statModifiers.length > 0) out.statModifiers = statModifiers;
    if (passiveEffects.length > 0) out.passiveEffects = passiveEffects;
    if (onHitEffects.length > 0)   out.onHitEffects   = onHitEffects;
    if (onDefendEffects.length > 0) out.onDefendEffects = onDefendEffects;

    const startKeys = Object.keys(startTokens) as Array<keyof CombatResources>;
    if (startKeys.length > 0 || generationBonus.length > 0) {
        const ri: ResourceInteraction = {};
        if (startKeys.length > 0) ri.combatStartTokens = startTokens;
        if (generationBonus.length > 0) ri.generationBonus = generationBonus;
        out.resourceInteraction = ri;
    }

    return out;
}

// ─── Shared affix-resolution core (Phase 152) ────────────────────────────────

/**
 * How many procedural affixes each rarity grants by default when affixes are
 * enabled (Phase 152, T steering 2026-06-17):
 *   - common   → 0 (no procedural prefix/suffix)
 *   - uncommon → 1 (prefix OR suffix, chosen by rng)
 *   - rare     → 2 (one prefix AND one suffix)
 *   - unique   → 0 (a unique's identity is its three fixed mods)
 */
const AFFIX_DEFAULTS_BY_RARITY: Record<ItemRarity, { prefix: boolean; suffix: boolean; pickOne: boolean }> = {
    common:   { prefix: false, suffix: false, pickOne: false },
    uncommon: { prefix: true,  suffix: true,  pickOne: true  },
    rare:     { prefix: true,  suffix: true,  pickOne: false },
    unique:   { prefix: false, suffix: false, pickOne: false },
};

/**
 * Controls how a drop layers prefix/suffix affixes on top of its base mods.
 *
 * - `enabled` — master switch. When omitted, `dropItem` keeps the classic
 *   affix-free behaviour (back-compat); `dropItemWithAffixes` defaults it on.
 * - `maxPrefixes` / `maxSuffixes` — caps (0..1). Override the rarity default.
 * - `pinPrefixId` / `pinSuffixId` — force a specific affix id for that role
 *   (used by curated library entries). A pinned affix overrides the roll.
 */
export interface AffixControl {
    enabled?: boolean;
    maxPrefixes?: number;
    maxSuffixes?: number;
    pinPrefixId?: string;
    pinSuffixId?: string;
}

/**
 * Weighted draw of a single affix from `candidates`, consuming one rng value.
 *
 * Phase 157 — the base draw weight is the affix's hidden-rarity weight, then
 * OFFENSIVE status-applying affixes (see `isOffensiveStatusAffix`) are boosted
 * by `STATUS_AFFIX_DRAW_BIAS` so an affix roll meaningfully feeds status-effect
 * play rather than flat-stat trading (the load-bearing doctrine). Flat-stat
 * affixes remain drawable — the bias re-centers the distribution, it does not
 * remove variety.
 */
function drawAffix(candidates: Affix[], rng: () => number): Affix | undefined {
    if (candidates.length === 0) return undefined;
    const entries = candidates.map(a => {
        const base = AFFIX_RARITY_WEIGHTS[a.hiddenRarity];
        const weight = isOffensiveStatusAffix(a) ? base * STATUS_AFFIX_DRAW_BIAS : base;
        return [a, weight] as const;
    });
    return drawWeighted(entries, rng);
}

interface ResolvedAffixes {
    prefix?: Affix;
    suffix?: Affix;
    affixRolled: RolledModifier[];
}

/**
 * Selects the prefix/suffix affixes for a drop and rolls their modifier
 * values. Shared by `dropItem` (rarity-default affixes) and
 * `dropItemWithAffixes` (explicit caps) so the two paths can never diverge.
 *
 * Resolution order per role:
 *   1. A pinned affix id (curated library variant) wins outright.
 *   2. Otherwise, if that role is allowed, draw weighted from the slot pool.
 *
 * Unique templates never receive affixes (their identity is fixed).
 */
function resolveAffixes(
    template: EquipmentTemplate,
    playerLevel: number,
    rarity: ItemRarity,
    control: AffixControl,
    rng: () => number,
): ResolvedAffixes {
    const affixRolled: RolledModifier[] = [];
    if (isUnique(template)) return { affixRolled };

    const defaults = AFFIX_DEFAULTS_BY_RARITY[rarity];
    const maxPrefixes = control.maxPrefixes ?? (defaults.prefix ? 1 : 0);
    const maxSuffixes = control.maxSuffixes ?? (defaults.suffix ? 1 : 0);

    // `uncommon` default grants exactly one affix — prefix OR suffix, chosen by
    // the rng. Explicit caps from the caller bypass this coin flip.
    let wantPrefix = maxPrefixes > 0;
    let wantSuffix = maxSuffixes > 0;
    const callerSetCaps =
        control.maxPrefixes !== undefined || control.maxSuffixes !== undefined;
    if (defaults.pickOne && !callerSetCaps && wantPrefix && wantSuffix) {
        if (rng() < 0.5) wantSuffix = false;
        else wantPrefix = false;
    }

    const rollAffixMods = (affix: Affix): void => {
        for (const modId of affix.modIds) {
            const mod = getModifierById(modId);
            if (!mod) {
                affixRolled.push({ modId, value: 0 });
                continue;
            }
            const tier = pickValueTier(mod, playerLevel);
            const value = tier ? rollInRange(tier.range[0], tier.range[1], rng) : 0;
            affixRolled.push({ modId, value });
        }
    };

    const pickRole = (role: AffixRole, pinId: string | undefined, want: boolean): Affix | undefined => {
        if (pinId) {
            const pinned = getAffixById(pinId);
            if (pinned) return pinned;
        }
        if (!want) return undefined;
        return drawAffix(affixesForSlot(template.slot, playerLevel, role), rng);
    };

    const prefix = pickRole('prefix', control.pinPrefixId, wantPrefix);
    const suffix = pickRole('suffix', control.pinSuffixId, wantSuffix);
    if (prefix) rollAffixMods(prefix);
    if (suffix) rollAffixMods(suffix);

    return { prefix, suffix, affixRolled };
}

/**
 * Shared instance constructor. Rolls base mods (`rollModifiers`), optionally
 * layers affixes (`resolveAffixes`), resolves the combined mod list, and
 * stamps affix provenance onto the returned `Equipment`.
 */
function buildEquipment(
    template: EquipmentTemplate,
    playerLevel: number,
    rarity: ItemRarity,
    control: AffixControl,
    rng: () => number,
): Equipment {
    const baseRolled = rollModifiers(template, rarity, playerLevel, rng);

    // Curated library entries carry their own affix provenance; fold the pins in.
    const effectiveControl: AffixControl =
        template.prefixId || template.suffixId
            ? {
                  ...control,
                  enabled: true,
                  pinPrefixId: control.pinPrefixId ?? template.prefixId,
                  pinSuffixId: control.pinSuffixId ?? template.suffixId,
              }
            : control;

    const wantAffixes = effectiveControl.enabled === true;
    const { prefix, suffix, affixRolled } = wantAffixes
        ? resolveAffixes(template, playerLevel, rarity, effectiveControl, rng)
        : { prefix: undefined, suffix: undefined, affixRolled: [] as RolledModifier[] };

    const allRolled: RolledModifier[] = [...baseRolled, ...affixRolled];
    const resolved = resolveModifiers(template, allRolled);

    const instance: Equipment = {
        id:            template.id,
        name:          composeItemName(template.name, prefix, suffix),
        description:   template.description,
        category:      'equipment',
        slot:          template.slot,
        rarity,
        requiredLevel: template.requiredLevel,
        ...resolved,
        ...(allRolled.length > 0 ? { rolledMods: allRolled } : {}),
        ...(prefix ? { prefixId: prefix.id, prefixName: prefix.word } : {}),
        ...(suffix ? { suffixId: suffix.id, suffixName: suffix.word } : {}),
    };
    return instance;
}

// ─── Public factory ──────────────────────────────────────────────────────────

/**
 * Looks up a template (regular first, then Unique), validates the level gate,
 * and resolves the final rarity (caller-supplied or weighted draw; unique
 * templates force `'unique'`). Shared preamble for both factory entry points.
 */
function prepareDrop(
    factory: string,
    templateId: string,
    playerLevel: number,
    rarity: ItemRarity | undefined,
    rng: () => number,
): { template: EquipmentTemplate; finalRarity: ItemRarity } {
    const template = getEquipmentTemplate(templateId) ?? getUniqueTemplate(templateId);
    if (!template) {
        throw new Error(`${factory}: no template registered for id '${templateId}'.`);
    }
    if (playerLevel < template.requiredLevel) {
        throw new Error(
            `${factory}: playerLevel ${playerLevel} is below template '${templateId}' ` +
            `requiredLevel ${template.requiredLevel}.`,
        );
    }

    const isUniqueTpl = isUnique(template);
    if (rarity === 'unique' && !isUniqueTpl) {
        throw new Error(
            `${factory}: rarity 'unique' is reserved for UniqueItemTemplate; ` +
            `template '${templateId}' is a regular EquipmentTemplate.`,
        );
    }

    const finalRarity: ItemRarity = (() => {
        if (isUniqueTpl) return 'unique';
        if (rarity) return rarity;
        return drawWeighted(RARITY_WEIGHTS, rng);
    })();

    return { template, finalRarity };
}

/**
 * Drops an `Equipment` instance from a template.
 *
 *   1. Look up the template (regular first, then Unique).
 *   2. Resolve rarity — caller-supplied or drawn from the weighted table. For
 *      Unique templates, rarity is forced to `'unique'`.
 *   3. Assert `playerLevel >= template.requiredLevel`.
 *   4. Roll the modifier list, optionally layering affixes (`affix`).
 *   5. Merge base stats + rolled-mod payloads via `resolveModifiers`.
 *   6. Return the fully-formed `Equipment` instance.
 *
 * Phase 152 — the optional `affix` parameter enables prefix/suffix layering
 * with rarity defaults (common→none, uncommon→one, rare→both, unique→none).
 * The legacy `dropItem(templateId, playerLevel, rarity?, rng?)` call shape is
 * preserved; omitting `affix` keeps the classic affix-free behaviour. Curated
 * library templates carrying `prefixId` / `suffixId` always apply their affix
 * provenance regardless of `affix`.
 *
 * Pure when `rng` is deterministic; calls do not mutate input.
 */
export function dropItem(
    templateId: string,
    playerLevel: number,
    rarity?: ItemRarity,
    rng: () => number = Math.random,
    affix?: AffixControl,
): Equipment {
    const { template, finalRarity } = prepareDrop(
        'dropItem', templateId, playerLevel, rarity, rng,
    );
    return buildEquipment(template, playerLevel, finalRarity, affix ?? {}, rng);
}

// Re-export the rarity weight table so Spec 05d / Spec 07 loot tables can
// introspect the same constants the factory uses.
export const rarityWeightTable: ReadonlyArray<readonly [ItemRarity, number]> =
    RARITY_WEIGHTS_WITH_UNIQUE;

/**
 * Phase 75 — preview what a template's runtime `Equipment` instance
 * would look like if rolled at the specified rarity for the specified
 * player level. Closes the user-jot at `b5c8165` (refined at
 * oversight-15 `077979e`) — mobile item-library view was showing
 * zero modifiers per entry because `equipmentTemplates` carries only
 * `baseStatModifiers` by design; rolled mods only exist on runtime
 * `Equipment` from `dropItem`.
 *
 * Mobile UI (and any future inventory-detail / loot-preview /
 * vendor-stock surface) calls this helper per (template, rarity,
 * playerLevel) cell to render the player-visible mod stack.
 *
 * Default `rng` is `() => 0.5` so previews are deterministic per
 * tuple — same shape as the Phase 70 Coastal Tyrant
 * deterministic-drop pattern. Pass a custom rng for randomised
 * previews.
 *
 * Returns `undefined` instead of throwing for any failure mode
 * (UI-tier safety — UI code looping templates × rarities cannot wrap
 * every call in try/catch):
 * - unknown `templateId`
 * - `playerLevel < template.requiredLevel`
 * - `rarity === 'unique'` against a non-unique template
 *
 * Unique templates soft-coerce their rarity to `'unique'`
 * regardless of the caller's input (caller may not know the
 * template is unique; the preview should still be useful — same
 * coercion as `dropItem`).
 *
 * @see {@link dropItem} — the runtime drop entry point this helper
 * wraps. The only semantic difference is soft-error vs throw posture.
 */
export function previewTemplateAtRarity(
    templateId: string,
    rarity: ItemRarity,
    playerLevel: number,
    rng: () => number = () => 0.5,
): Equipment | undefined {
    const template = getEquipmentTemplate(templateId) ?? getUniqueTemplate(templateId);
    if (!template) return undefined;
    if (playerLevel < template.requiredLevel) return undefined;

    const isUniqueTpl = isUnique(template);
    if (rarity === 'unique' && !isUniqueTpl) return undefined;

    const finalRarity: ItemRarity = isUniqueTpl ? 'unique' : rarity;
    return dropItem(templateId, playerLevel, finalRarity, rng);
}

/**
 * Phase 76 — preview a template at every rarity tier in one call.
 *
 * Convenience wrapper around `previewTemplateAtRarity` for UI surfaces
 * that render every-rarity-for-this-template comparison strips (mobile
 * item-detail / tooltip / "Common / Uncommon / Rare / Unique" stat
 * ladder views). Saves the boilerplate of four sequential calls + the
 * record-zip step.
 *
 * Returns the full `Record<ItemRarity, Equipment | undefined>` shape;
 * `undefined` cells signal "this template can't roll at that rarity at
 * this player level" (per Phase 75's soft-error semantics — unknown
 * templateId / level-too-low / unique-rarity-on-regular-template all
 * surface as undefined). Each rarity-cell uses the same `rng` so the
 * mod values across the rarity strip are stable per seed.
 *
 * Default `rng = () => 0.5` matches the Phase 75 + Phase 70
 * deterministic-drop convention.
 *
 * @see {@link previewTemplateAtRarity} for the single-cell primitive.
 */
export function previewTemplateAtAllRarities(
    templateId: string,
    playerLevel: number,
    rng: () => number = () => 0.5,
): Record<ItemRarity, Equipment | undefined> {
    return {
        common:   previewTemplateAtRarity(templateId, 'common',   playerLevel, rng),
        uncommon: previewTemplateAtRarity(templateId, 'uncommon', playerLevel, rng),
        rare:     previewTemplateAtRarity(templateId, 'rare',     playerLevel, rng),
        unique:   previewTemplateAtRarity(templateId, 'unique',   playerLevel, rng),
    };
}

// ─── Affix-decorated drops (2026-06-07 content pass; Phase 152 unification) ───

/**
 * Options for {@link dropItemWithAffixes}. All optional; sensible defaults keep
 * the call site terse for loot tables and tests.
 *
 * - `rarity`      — instance rarity for the underlying base item (defaults to
 *                   the weighted table draw, same as `dropItem`). Affixes are
 *                   layered on top regardless of base rarity.
 * - `rng`         — seeded uniform `[0,1)` source. Defaults to `Math.random`.
 *                   Pass a deterministic rng for reproducible drops.
 * - `maxPrefixes` — cap on prefixes drawn (0..1; default 1).
 * - `maxSuffixes` — cap on suffixes drawn (0..1; default 1).
 */
export interface DropWithAffixesOptions {
    rarity?: ItemRarity;
    rng?: () => number;
    maxPrefixes?: number;
    maxSuffixes?: number;
}

/**
 * Drops an `Equipment` instance decorated with prefix/suffix affixes.
 *
 * Phase 152 — now a thin wrapper over the shared `buildEquipment` core that
 * also backs `dropItem`'s affix path, so the two factories can never diverge.
 * Defaults `maxPrefixes` / `maxSuffixes` to 1 (always attempt one of each,
 * bypassing the rarity-default coin flip), then stamps the structured
 * `prefixId` / `suffixId` / `prefixName` / `suffixName` provenance onto the
 * instance.
 *
 * Unique templates never receive affixes — a unique's identity is its three
 * fixed mods, not procedural affixes.
 *
 * Pure and deterministic given a seeded `rng`.
 */
export function dropItemWithAffixes(
    templateId: string,
    playerLevel: number,
    opts: DropWithAffixesOptions = {},
): Equipment {
    const {
        rarity,
        rng = Math.random,
        maxPrefixes = 1,
        maxSuffixes = 1,
    } = opts;

    const { template, finalRarity } = prepareDrop(
        'dropItemWithAffixes', templateId, playerLevel, rarity, rng,
    );

    return buildEquipment(template, playerLevel, finalRarity, {
        enabled: true,
        maxPrefixes,
        maxSuffixes,
    }, rng);
}

// ─── Rarity-drop contract (Phase 154 — absorbed from mobile `affix-roll.ts`) ──

/**
 * Named affixes per rarity — the design contract for a rarity drop.
 *
 * The visible affix count (prefix / suffix *words* like "Keen" / "of Clarity")
 * is the rarity signal, distinct from `rolledMods.length` (a single affix can
 * carry several modifier ids):
 *
 *   - common   → 0 affixes  → "Iron Blade"
 *   - uncommon → 1 affix    → "Keen Iron Blade" OR "Iron Blade of Clarity"
 *   - rare     → 2 affixes  → "Keen Iron Blade of Clarity" (prefix + suffix)
 *   - unique   → 3 *fixed* modifiers + fixed name; no prefix/suffix
 *
 * Uniques carry three fixed modifiers rather than rolled prefix/suffix affixes,
 * so their entry counts modifiers, not affixes — {@link countNamedAffixes}
 * returns 0 for a unique and callers verifying uniques check `rolledMods.length`
 * instead.
 *
 * Mirrors the module-private `AFFIX_DEFAULTS_BY_RARITY` as a public, numeric
 * contract consumers (loot tables, dev tools, presenters) can read directly.
 */
export const AFFIXES_PER_RARITY: Record<ItemRarity, number> = {
    common: 0,
    uncommon: 1,
    rare: 2,
    unique: 3,
};

/**
 * Count the *named* affixes (prefix + suffix) on an equipment instance — the
 * visible affix count that drives the rarity contract. Distinct from
 * `rolledMods.length`, since one affix can carry several modifier ids.
 */
export function countNamedAffixes(item: Equipment): number {
    const hasPrefix = Boolean(item.prefixId ?? item.prefixName);
    const hasSuffix = Boolean(item.suffixId ?? item.suffixName);
    return (hasPrefix ? 1 : 0) + (hasSuffix ? 1 : 0);
}

/**
 * A base template carries a *baked* affix when it pins a prefix or suffix the
 * factory force-applies (curated library variant). Such templates can't hit an
 * exact rolled-affix count, so procedural rarity drops skip them.
 */
export function hasBakedAffix(template: { prefixId?: string; suffixId?: string }): boolean {
    return Boolean(template.prefixId ?? template.suffixId);
}

/**
 * Roll one equipment drop carrying exactly the rarity's named-affix count, with
 * the display rarity stamped on the instance. `rng` defaults to `Math.random`;
 * pass a seeded rng for deterministic drops (the loot-cache reward table does).
 *
 * The design wants *named affixes only* (the affix count is the visible affix
 * count, with no separate hidden base mods), so for uncommon / rare this rolls
 * through {@link dropItemWithAffixes} with the base rarity pinned to `common`
 * (zero hidden mods) and the prefix/suffix caps set to the affix count wanted,
 * then stamps the display rarity. For uncommon the single affix is randomly a
 * prefix or a suffix. Uniques keep the plain `dropItem(..., 'unique')` path
 * (fixed name + three fixed modifiers).
 *
 * Throws only if the underlying factory throws (e.g. the template is below
 * `requiredLevel`); callers roll within a bounded retry and skip throws.
 */
export function dropItemAtRarity(
    templateId: string,
    playerLevel: number,
    rarity: ItemRarity,
    rng: () => number = Math.random,
): Equipment {
    if (rarity === 'unique') {
        return dropItem(templateId, playerLevel, 'unique', rng);
    }

    if (rarity === 'common') {
        const item = dropItem(templateId, playerLevel, 'common', rng);
        return { ...item, rarity: 'common' };
    }

    // uncommon → 1 affix (random prefix or suffix); rare → prefix + suffix.
    let maxPrefixes: number;
    let maxSuffixes: number;
    if (rarity === 'rare') {
        maxPrefixes = 1;
        maxSuffixes = 1;
    } else if (rng() < 0.5) {
        maxPrefixes = 1;
        maxSuffixes = 0;
    } else {
        maxPrefixes = 0;
        maxSuffixes = 1;
    }

    const item = dropItemWithAffixes(templateId, playerLevel, {
        rarity: 'common',
        maxPrefixes,
        maxSuffixes,
        rng,
    });
    return { ...item, rarity };
}

// Re-export the unique-pool shape so tests / loot tables can introspect it
// without reaching into `modifier.catalogue.ts` directly.
export { uniqueModPool };
