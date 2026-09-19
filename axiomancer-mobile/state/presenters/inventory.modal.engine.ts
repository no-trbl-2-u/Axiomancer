/**
 * Item-use / item-equip modal presenter for the inventory screen (Spec 06).
 *
 * Q2 / Q5 both call for a confirmation modal that previews the effect
 * of using or equipping an item before it is committed. The helpers
 * here are pure: state → view-model, no side effects.
 */

import {
    equipItem as engineEquipItem,
    isConsumable,
    isEquipment,
    lookupEffect,
    resolveConsumableHeal,
    type Character,
    type Consumable,
    type Equipment,
    type GameStore,
    type Item,
} from '@mechanics';

import { keywordForEffect } from '@/state/combat/keywords';
import { freezeViewModel } from './freeze';
import { parseHealAmount } from '../actions';
import { computeEquipDelta } from '@mechanics';
import {
    findEquippedInSlot as selectFindEquippedInSlot,
    isEquippedFirstOfSlot as selectIsEquippedFirstOfSlot,
} from '@mechanics';

/**
 * Modal mode discriminator. The screen branches on this to pick
 * which action to dispatch on confirm:
 * - `'use'` → `actions.useItem` (consumables).
 * - `'equip'` → `actions.equipItem` (equipment NOT currently worn).
 * - `'unequip'` → `actions.unequipItem` (equipment currently worn
 *   AND has at least one other slot peer to swap to). Filed via
 *   user-jot 2026-05-22 (oversight 29th call).
 * - `'view'` → no action (display-only; for items with no available
 *   action, including equipment that's the sole worn item in its
 *   slot — see notes on `unequipItemAction` for why sole-item
 *   unequip is a no-op under mobile's first-in-slot convention).
 */
export type ItemModalMode = 'use' | 'equip' | 'unequip' | 'view';

export interface StatDelta {
    label: string;
    before: number;
    after: number;
    delta: number;
    /**
     * Engine stat key (e.g. `'physicalAttack'`, `'mentalDefense'`).
     * Consumed by the inventory item-modal's TooltipTarget wrap
     * (Phase 80a) to fire a `kind:'item-stat'` synthesizer tooltip
     * on tap. Optional so callers building deltas without a stat
     * binding can omit it; the view falls back to a plain row.
     */
    id?: string;
}

/**
 * A non-stat change (passive / on-hit / on-defend effect, combat
 * resource interaction, or keyword/affix) gained or lost by the equip
 * operation the modal previews. Stat changes ride on `statDeltas`;
 * everything else the equip alters surfaces here so the preview shows
 * *all* of an item's effect — not just its four headline combat stats.
 */
export interface ModalEffectDelta {
    /** Display label (resolved engine effect name, resource summary, or
     * keyword/affix word; falls back to the raw id when unresolved). */
    label: string;
    /** `'gained'` when the equip adds this, `'lost'` when it removes it. */
    direction: 'gained' | 'lost';
}

/**
 * One line of an item's *intrinsic* modifier block — the stats and
 * effects the item itself grants (independent of equip state). Stat
 * lines read e.g. "+5 PHYS ATK"; effect lines read the resolved effect
 * name. This is what makes an affixed drop ("Keen Iron Blade of
 * Clarity") show *what* its affixes do, not just its name.
 */
export interface ItemModifierLine {
    label: string;
    /** Engine stat key for tooltip wiring, when the line is a stat. */
    id?: string;
}

export interface ItemModalViewModel {
    /** Item ID the modal is acting on. */
    itemId: string | null;
    /** Display name of the item. */
    name: string;
    /** Engine description. */
    description: string;
    /** Modal mode — determines the primary button. */
    mode: ItemModalMode;
    /** Confirmation copy ("Drink the phial?"). */
    confirmPrompt: string;
    /** Primary button label, e.g. `"DRINK"` / `"EQUIP"`. */
    confirmLabel: string;
    /** Preview lines (Q2 / Q5 — "potential results"). */
    previewLines: readonly string[];
    /**
     * Stat deltas for an equip preview (Q5). Covers *every* stat the
     * equip changes — combat stats, non-combat saves/tests, luck, and
     * max health — and includes **only** stats whose value actually
     * changes (unchanged stats are dropped, per the design brief).
     */
    statDeltas: readonly StatDelta[];
    /**
     * Non-stat changes the equip preview should surface — passive /
     * on-hit / on-defend effects, combat-resource interactions, and
     * keyword/affix labels gained or lost. Empty for consumables,
     * display-only rows, and equips that change no effects.
     */
    effectDeltas: readonly ModalEffectDelta[];
    /**
     * The item's own intrinsic modifiers — the stats (with values) and
     * effects it grants, regardless of equip state. Empty for items with
     * no modifiers (e.g. a plain common drop) and for consumables.
     */
    itemModifiers: readonly ItemModifierLine[];
    /**
     * Name of the currently-equipped item that this equip would
     * replace, or `null` when the slot is empty / this item is
     * already equipped / the item isn't equipment. Surfaced on the
     * equip modal's confirmLabel as `"EQUIP · REPLACE <NAME>"` per
     * the design's chat-1 iteration 2 EQUIP-button rule (Phase 36
     * port). The view layer reads `replacingName` directly to avoid
     * parsing the label string back out.
     */
    replacingName: string | null;
}

/**
 * Build the modal view-model for a tapped item. The screen passes the
 * item id; this helper resolves the rest from engine state. Returns
 * `null` when the item can't be found.
 */
export function selectItemModalViewModel(
    state: GameStore,
    itemId: string,
): ItemModalViewModel | null {
    const inventory: readonly Item[] = state.player.inventory;
    const item = inventory.find((i: Item) => i.id === itemId);
    if (!item) return null;

    if (isConsumable(item)) return buildConsumableModal(state.player, item);
    if (isEquipment(item)) return buildEquipmentModal(state.player, item);

    return freezeViewModel({
        itemId: item.id,
        name: item.name,
        description: item.description,
        mode: 'view' as ItemModalMode,
        confirmPrompt: '',
        confirmLabel: 'CLOSE',
        previewLines: [item.description] as readonly string[],
        statDeltas: [] as readonly StatDelta[],
        effectDeltas: [] as readonly ModalEffectDelta[],
        itemModifiers: [] as readonly ItemModifierLine[],
        replacingName: null,
    });
}

function buildConsumableModal(player: Character, item: Item): ItemModalViewModel {
    // `isConsumable(item)` has narrowed at the call site; cast through.
    const consumable = item as Consumable;
    // Prefer the engine's structured `healAmount`; fall back to parsing
    // a legacy `effectId` string for fixtures / records that haven't
    // migrated yet.
    const legacyEffect = consumable.effectId ?? '';
    // Phase 96 — ask the engine what THIS player, at THIS HP, would actually be
    // paid. `resolveConsumableHeal` is the same call `useConsumableEffect` makes,
    // so the number previewed here is by construction the number drinking pays;
    // the legacy `parseHealAmount` path stays as the fallback for un-migrated
    // fixtures whose heal is still encoded in a free-form `effectId` string.
    const { amount: resolvedHeal, desperate } = resolveConsumableHeal(player, consumable);
    const heal = resolvedHeal > 0 ? resolvedHeal : parseHealAmount(legacyEffect);
    const projectedHp = heal > 0
        ? Math.min(player.maxHealth, player.health + heal)
        : player.health;
    const hpDelta = projectedHp - player.health;

    const previewLines: string[] = [];
    if (resolvedHeal > 0) {
        // The headline number is always what the player gets right now. When the
        // desperation band is what earned it, say so on the same line — a player
        // who is told "you are getting the wounded rate" learns the rule from
        // one drink instead of inferring it from a number that changed.
        previewLines.push(
            desperate
                ? `Heal ${resolvedHeal} HP (badly wounded)`
                : `Heal ${resolvedHeal} HP`,
        );
        // Not currently desperate, but the item HAS a band: advertise the
        // upside. This is the anti-hoarding lever's whole job — the player must
        // be able to see, at full health, that the flask is worth more later.
        if (!desperate && (consumable.healAmountBelowHalf ?? 0) > 0) {
            previewLines.push(
                `Heal ${consumable.healAmountBelowHalf} HP instead when below half HP`,
            );
        }
    } else if (legacyEffect) {
        previewLines.push(legacyEffect);
    }
    if (hpDelta > 0) {
        previewLines.push(`HP ${player.health} → ${projectedHp} (+${hpDelta})`);
    } else if (legacyEffect && heal === 0) {
        previewLines.push('No HP change.');
    }

    return freezeViewModel({
        itemId: item.id,
        name: item.name,
        description: item.description,
        mode: 'use' as ItemModalMode,
        confirmPrompt: `Drink the ${item.name.toLowerCase()}?`,
        confirmLabel: 'DRINK',
        previewLines: previewLines as readonly string[],
        statDeltas: [] as readonly StatDelta[],
        effectDeltas: [] as readonly ModalEffectDelta[],
        itemModifiers: [] as readonly ItemModifierLine[],
        replacingName: null,
    });
}

function buildEquipmentModal(player: Character, item: Item): ItemModalViewModel {
    const eq = item as Equipment;
    const isAlreadyEquipped = selectIsEquippedFirstOfSlot(player.inventory, eq);
    const replacing = isAlreadyEquipped ? null : selectFindEquippedInSlot(player.inventory, eq);

    // User-jot 2026-05-22 (oversight 29th): equipment needs an
    // 'unequip' option in addition to equip + discard. Under
    // mobile's "first-equipment-per-slot = worn" convention,
    // unequip = swap to a different slot-peer (move the worn
    // item to the back of its slot peers). When the worn item
    // is the sole entry in its slot, there's no peer to swap to
    // — the row falls back to display-only with the WORN label
    // (engine-true "unequip to bare" requires a mobile-side
    // unequipped-marker that's not in scope today).
    const slotPeerCount = player.inventory.filter(
        (it: Item): it is Equipment =>
            isEquipment(it) && (it as Equipment).slot === eq.slot,
    ).length;
    const canUnequip = isAlreadyEquipped && slotPeerCount > 1;
    const wornSibling = canUnequip
        ? player.inventory.find(
              (it: Item): it is Equipment =>
                  isEquipment(it)
                  && (it as Equipment).slot === eq.slot
                  && it.id !== eq.id,
          ) ?? null
        : null;

    // Phase 36 + user-jot 2026-05-22 confirmLabel matrix:
    // - Not equipped, slot empty → 'EQUIP'
    // - Not equipped, slot has worn sibling → 'EQUIP · REPLACE <NAME>'
    // - Equipped, has peer → 'UNEQUIP · WEAR <NAME>' (or just
    //   'UNEQUIP' if no clear next-up — but slotPeerCount > 1
    //   guarantees at least one)
    // - Equipped, sole item in slot → 'WORN' (display-only).
    let confirmLabel: string;
    let mode: ItemModalMode;
    if (isAlreadyEquipped && canUnequip) {
        mode = 'unequip';
        confirmLabel = wornSibling !== null
            ? `UNEQUIP · WEAR ${wornSibling.name.toUpperCase()}`
            : 'UNEQUIP';
    } else if (isAlreadyEquipped) {
        // Sole item in slot — 'view' mode (no action on confirm);
        // confirmLabel stays 'WORN' to communicate display-only.
        mode = 'view';
        confirmLabel = 'WORN';
    } else if (replacing !== null) {
        mode = 'equip';
        confirmLabel = `EQUIP · REPLACE ${replacing.name.toUpperCase()}`;
    } else {
        mode = 'equip';
        confirmLabel = 'EQUIP';
    }

    const previewLines: string[] = [
        `Slot · ${eq.slot.toUpperCase()}`,
        mode === 'unequip'
            ? wornSibling !== null
                ? `Worn now. Swaps with ${wornSibling.name}.`
                : 'Worn now.'
            : isAlreadyEquipped
              ? 'Worn now.'
              : `${eq.slot.charAt(0).toUpperCase() + eq.slot.slice(1)} slot.`,
    ];

    // Compute the real before/after character for whichever operation
    // the confirm button performs, then surface *every* changed stat and
    // effect — not just the four headline combat stats — keeping only
    // entries that actually change (per the design brief).
    //
    // - equip   → wear `eq` (engine replaces any worn slot sibling).
    // - unequip → take `eq` off and wear `wornSibling` in its place.
    // - view    → display-only (sole worn item / no action) → no change.
    let afterChar: Character = player;
    let newlyWorn: Equipment | null = null;
    let removed: Equipment | null = null;
    if (mode === 'equip') {
        afterChar = engineEquipItem(player, eq);
        newlyWorn = eq;
        removed = replacing;
    } else if (mode === 'unequip' && wornSibling !== null) {
        afterChar = engineEquipItem(player, wornSibling);
        newlyWorn = wornSibling;
        removed = eq;
    }

    const statDeltas = computeStatDeltas(player, afterChar);
    const effectDeltas = newlyWorn === null
        ? []
        : computeEffectDeltas(newlyWorn, removed, player);
    const itemModifiers = computeItemModifiers(eq);

    return freezeViewModel({
        itemId: item.id,
        name: item.name,
        description: item.description,
        mode,
        confirmPrompt: mode === 'unequip'
            ? `Stop wearing the ${item.name.toLowerCase()}?`
            : `Wear the ${item.name.toLowerCase()}?`,
        confirmLabel,
        previewLines: previewLines as readonly string[],
        statDeltas: statDeltas as readonly StatDelta[],
        effectDeltas: effectDeltas as readonly ModalEffectDelta[],
        itemModifiers: itemModifiers as readonly ItemModifierLine[],
        replacingName: replacing === null ? null : replacing.name,
    });
}

/**
 * Short chrome labels for the known engine stat keys. Anything not
 * listed (a stat the engine adds later) falls back to a humanized
 * upper-case rendering of the key, so the table never silently drops a
 * new stat.
 */
const STAT_LABELS: Record<string, string> = {
    maxHealth: 'MAX HP',
    physicalAttack: 'PHYS ATK',
    physicalDefense: 'PHYS DEF',
    mentalAttack: 'MENT ATK',
    mentalDefense: 'MENT DEF',
    emotionalAttack: 'EMOT ATK',
    emotionalDefense: 'EMOT DEF',
    luck: 'LUCK',
    physicalSave: 'BODY SAVE',
    physicalTest: 'BODY TEST',
    mentalSave: 'MIND SAVE',
    mentalTest: 'MIND TEST',
    emotionalSave: 'HEART SAVE',
    emotionalTest: 'HEART TEST',
};

/** Engine stat keys the inventory item-stat tooltip synthesizer can
 * resolve (`<dimension><Verb>` — see `tooltip.engine.ts`). Only these
 * get a `StatDelta.id` so the row's TooltipTarget never renders an
 * empty chip for a key the synthesizer can't describe. */
const TOOLTIP_STAT_KEY = /^(physical|mental|emotional)(Attack|Card|Defense|Save|Test)$/;

function statLabelFor(key: string): string {
    return (
        STAT_LABELS[key]
        ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).toUpperCase().trim()
    );
}

/**
 * Round a stat value to one decimal place for display. Integer stats
 * stay integers (`15`); fractional stats like luck read cleanly (`1.5`
 * rather than `1.55432728`).
 */
function round1(n: number): number {
    return Math.round(n * 10) / 10;
}

/**
 * Flatten a character's numeric stats into one `key → value` map —
 * derived combat stats, non-combat saves/tests, and max health — so the
 * modal can diff any of them.
 */
function characterStatMap(character: Character): Map<string, number> {
    const out = new Map<string, number>();
    const add = (key: string, value: unknown) => {
        if (typeof value === 'number' && Number.isFinite(value)) out.set(key, value);
    };
    for (const [key, value] of Object.entries(character.derivedStats ?? {})) add(key, value);
    for (const [key, value] of Object.entries(character.nonCombatStats ?? {})) add(key, value);
    add('maxHealth', character.maxHealth);
    return out;
}

/**
 * Diff every stat between the player and the post-operation character,
 * emitting a before→after row for each stat that *changed*. Unchanged
 * stats are dropped. Ordered by `STAT_LABELS` declaration order so the
 * combat stats lead and the rest follow stably; unknown keys trail in
 * alphabetical order.
 */
function computeStatDeltas(before: Character, after: Character): StatDelta[] {
    const beforeMap = characterStatMap(before);
    const afterMap = characterStatMap(after);
    const keys = new Set<string>([...beforeMap.keys(), ...afterMap.keys()]);

    const known = Object.keys(STAT_LABELS);
    const orderOf = (key: string) => {
        const i = known.indexOf(key);
        return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };

    const out: StatDelta[] = [];
    for (const key of keys) {
        // Round to one decimal so fractional stats (luck) read as e.g.
        // 1.5, and compare the rounded values so a sub-0.05 wobble never
        // surfaces a "+0.0" row.
        const b = round1(beforeMap.get(key) ?? 0);
        const a = round1(afterMap.get(key) ?? 0);
        if (a === b) continue;
        const d = round1(a - b);
        const row: StatDelta = TOOLTIP_STAT_KEY.test(key)
            ? { label: statLabelFor(key), before: b, after: a, delta: d, id: key }
            : { label: statLabelFor(key), before: b, after: a, delta: d };
        out.push(row);
    }
    out.sort((x, y) => {
        const ox = orderOf(idOrLabelKey(x));
        const oy = orderOf(idOrLabelKey(y));
        if (ox !== oy) return ox - oy;
        return x.label.localeCompare(y.label);
    });
    return out;
}

/** Recover the engine stat key for ordering: prefer the explicit id,
 * else fall back to the label (unknown keys, which trail anyway). */
function idOrLabelKey(row: StatDelta): string {
    return row.id ?? row.label;
}

/** Signed stat-value string, rounded to one decimal (`+5` / `-2` /
 * `+1.5` for luck). */
function signed(n: number): string {
    const r = round1(n);
    return r >= 0 ? `+${r}` : `${r}`;
}

/** Resolve an effect id to its player-facing keyword (falling back to engine name). */
function effectName(id: string): string {
    try {
        return keywordForEffect(id) ?? lookupEffect(id)?.name ?? id;
    } catch {
        return id;
    }
}

/**
 * Build the item's intrinsic modifier block — the stats (with values)
 * and effects it grants on its own. Stat lines carry the engine stat
 * key as `id` so the view can wire a tooltip. Multipliers render as
 * `×N`, flat modifiers as `+N` / `-N`. Returns `[]` for an item with no
 * modifiers (a plain common drop).
 */
function computeItemModifiers(eq: Equipment): ItemModifierLine[] {
    const out: ItemModifierLine[] = [];
    for (const mod of eq.statModifiers ?? []) {
        const value = mod.isMultiplier ? `×${round1(mod.value)}` : signed(mod.value);
        const line: ItemModifierLine = TOOLTIP_STAT_KEY.test(mod.stat)
            ? { label: `${value} ${statLabelFor(mod.stat)}`, id: mod.stat }
            : { label: `${value} ${statLabelFor(mod.stat)}` };
        out.push(line);
    }
    // Phase 23 — equipment is stat-only + `grantsSignature`; there are no
    // passive-effect / proc / resource lines to list. The granted signature is
    // surfaced separately (see `computeEffectDeltas`).
    return out;
}

/**
 * The non-stat change the equip causes: the signet-relic signature gained /
 * lost (Phase 23 — equipment carries no other non-stat channel). Stat changes
 * ride on `computeStatDeltas`.
 */
function computeEffectDeltas(
    newlyWorn: Equipment,
    removed: Equipment | null,
    player: Character,
): ModalEffectDelta[] {
    const equipDelta = computeEquipDelta(newlyWorn, removed, player);
    const out: ModalEffectDelta[] = [];
    for (const s of equipDelta.signatures.gained) {
        out.push({ label: `grants ${s.name ?? s.id}`, direction: 'gained' });
    }
    for (const s of equipDelta.signatures.lost) {
        out.push({ label: `loses ${s.name ?? s.id}`, direction: 'lost' });
    }
    return out;
}

