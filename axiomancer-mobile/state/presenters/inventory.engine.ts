/**
 * Screen-level presenter for `app/(tabs)/inventory/index.tsx`.
 *
 * Spec 06: drives the inventory view-model from `state.player.inventory`.
 * Items are grouped by engine category (Q1=A), stacks render as a single
 * row with a `quantity` (Q3=A), and the screen renders an empty-state
 * placeholder when the player carries nothing (Q4=A).
 *
 * The engine ships no `equipped` flag — by convention shared with
 * `selectCharacterViewModel`, the *first* equipment item per slot is
 * treated as worn. `equipItem` (in `state/actions.ts`) reorders the
 * inventory to make a target item that "first".
 */

import {
    isConsumable,
    isEquipment,
    isMaterial,
    isQuestItem,
    type Equipment,
    type GameStore,
    type Item,
} from '@mechanics';

import { freezeViewModel } from './freeze';
import { computeEquipDelta, type EquipDelta } from '@mechanics';
import { wornPerSlot, SLOT_CAPACITY, getSignatureSkill } from '@mechanics';

export type { EquipDelta } from '@mechanics';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type InventoryCategory = 'equipment' | 'consumable' | 'material' | 'quest';
export type InventoryTab = 'all' | InventoryCategory;

export interface InventoryLocalUi {
    activeTab?: InventoryTab;
    expandedItemId?: string | null;
    /**
     * When set, the equipment slot the user has tapped in the
     * Equipment Dock to filter the sack to compatible items
     * (Phase 32 sub-tick F). The filter overrides `activeTab` —
     * the screen sets `activeTab='all'` whenever it picks a slot,
     * and the presenter additionally guards against the case where
     * a stale tab is still set (slot filter wins). `null` / omitted
     * → no slot filter.
     */
    selectedSlot?: Equipment['slot'] | null;
}

export interface InventoryItemRow {
    /** Stable engine ID. */
    id: string;
    name: string;
    category: InventoryCategory;
    /** Free-form sub-classification (`'Weapon'`, `'Body'`, …) or `null`. */
    sub: string | null;
    /** Stack size — always 1 for non-stackable items. */
    quantity: number;
    /**
     * Phase 23 — the rarity model is retired; equipment (the signet relics) is
     * uniform, so this is always `null` now. The field is kept optional so the
     * rarity-shine affordance degrades to "no shine" without a wider UI change.
     */
    rarity?: 'common' | 'uncommon' | 'rare' | 'unique' | null;
    equipped: boolean;
    description: string;
    /** Whether the item can currently be used / equipped. */
    canUse: boolean;
    /** Whether the item can be discarded (`false` for quest items). */
    canDiscard: boolean;
    /**
     * Equip-preview replacement deltas. Surfaced on equipment rows
     * whose card the screen has expanded, so the player sees the
     * net stat change before committing the equip. Filled when:
     *   - the item is equipment, AND
     *   - the item is NOT currently equipped, AND
     *   - the player has another equipment item in the same slot
     *     marked equipped.
     *
     * `null` for non-equipment, equipped equipment, or equipment in
     * an empty slot (where the preview reduces to "no replacement —
     * the item's own stats win unopposed"). Phase 35 (ported from
     * `design/handoff-2026-05-16/project/screens/inventory.jsx:215-225`
     * `computeDelta`).
     */
    replacePreview: ReplacePreview | null;
    /**
     * Phase 19 — the signature this signet relic grants (display name), or
     * `null` when the item is not a relic. Surfaced as a "grants <name>"
     * sub-label on equipment rows and in the worn dock. Optional (sparse):
     * the presenter always sets it, but fixtures may omit it.
     */
    grantsSignature?: string | null;
    /**
     * Rich equip-change delta surface (Phase 133). Where `replacePreview`
     * collapses the change into a single signed net-stat list, this model
     * splits the change into gained vs. lost across stats, rolled
     * modifiers, passive effects, on-hit / on-defend proc hooks, combat
     * resource interactions, and keyword/affix labels — showing **only**
     * what the equip operation changes.
     *
     * Filled for equipment rows:
     *   - non-equipped with a worn sibling → `mode: 'swap'`
     *   - non-equipped into an empty slot  → `mode: 'equip'` (gained only)
     *   - the worn item itself             → `mode: 'unequip'` (lost only)
     *
     * `null` for non-equipment rows. The view hides empty sections and the
     * whole surface when `equipDelta.isEmpty` is true.
     */
    equipDelta: EquipDelta | null;
}

export interface ReplacePreview {
    /** The currently-equipped sibling in this slot. */
    replacing: { id: string; name: string };
    /**
     * Net stat deltas (this item's stats minus the replaced item's
     * stats). Zero-delta entries are omitted. Each entry's `delta`
     * is signed (positive when better, negative when worse).
     */
    deltas: ReadonlyArray<{ stat: string; delta: number }>;
}

export interface InventoryTabRow {
    key: InventoryTab;
    label: string;
    count: number;
}

/**
 * One paper-doll Equipment Dock slot. The dock renders the wearer's full
 * loadout — 5 rows (1 weapon, 1 armor, 3 interchangeable accessories) around
 * the player portrait — so worn vs. unworn is unmistakable at a glance.
 *
 * `key` mirrors the engine `Equipment.slot` union ("weapon", "armor",
 * "accessory") and drives the sack-filter / slot-tooltip lookup. The three
 * accessory rows share `key: 'accessory'` (the positions are interchangeable —
 * see `SLOT_CAPACITY`) and disambiguate via `accessoryIndex`. `label` is the
 * uppercase chrome label for the row. `item` is the worn equipment row at this
 * position (worn set per the `selectCharacterViewModel` convention) or `null`
 * when the position is bare.
 */
export interface EquipmentDockSlot {
    key: Equipment['slot'];
    /**
     * Which of the 3 interchangeable accessory positions this row is (0-2).
     * Present only on `accessory` rows; absent for weapon/armor. Mirrors
     * `EquipmentSlotRow.accessoryIndex` on the SELF character presenter, and
     * gives each accessory row a stable identity for React keys / testIDs.
     */
    accessoryIndex?: 0 | 1 | 2;
    label: string;
    /** Worn item at this position, or `null`. */
    item: { id: string; name: string; sub: string | null; grantsSignature?: string | null } | null;
}

/**
 * The Equipment Dock view-model. Independent of the active tab —
 * tapping "PHIALS" should still show the player's worn equipment in
 * the dock above the tabs.
 */
export interface EquipmentDockViewModel {
    /** All 5 worn positions in display order: weapon, armor, accessory ×3. */
    slots: readonly EquipmentDockSlot[];
    /** Section eyebrow on the dock outer panel (ritual lowercase chrome). */
    headerLabel: string;
    /** One-line hint under the eyebrow ("TAP A SLOT TO SEE WHAT ELSE FITS"). */
    hintLabel: string;
    /** Empty-slot copy (lowercase ritual register, framed with em-dashes per the design). */
    bareLabel: string;
    /**
     * Slot-filter banner copy & state (Phase 32 sub-tick F).
     * `selectedSlot` mirrors the user pick; `bannerEyebrow` /
     * `bannerSlotLabel` / `bannerClearLabel` are the chrome strings
     * the screen renders when a slot is active. `bannerSlotLabel`
     * resolves to the dock slot's `label` (e.g. "WEAPON") so the
     * screen doesn't have to reach back through `slots`. `null` /
     * empty when no slot is selected; the screen treats `null` as
     * "do not render the banner".
     */
    selectedSlot: Equipment['slot'] | null;
    bannerEyebrow: string;
    bannerSlotLabel: string;
    bannerClearLabel: string;
}

export interface InventoryViewModel {
    /** Tabs in display order. */
    tabs: readonly InventoryTabRow[];
    /** Currently active tab (defaults to `'all'`). */
    activeTab: InventoryTab;
    /** Items filtered by the active tab, in display order. */
    items: readonly InventoryItemRow[];
    /** Currency the player carries (engine "shilling"). */
    shilling: number;
    /** Burden / encumbrance numerator. */
    burden: number;
    burdenMax: number;
    /** ID of the item the user has tapped to expand, or `null`. */
    expandedItemId: string | null;
    /** True when the inventory is empty — the screen shows the empty state. */
    isEmpty: boolean;
    /** Empty-state copy. Per bearings 2026-05-15 no second-person archaic pronouns (drops the earlier "Thy sack…" phrasing). */
    emptyMessage: string;
    /**
     * Display header above the category list (rendered uppercased by
     * the view). Lives on the presenter so the screen has no inline
     * ritual literal (Hard Rule #8).
     */
    sectionHeader: string;
    /**
     * Per-category section labels, in the order categories appear on
     * the screen. Lives on the presenter so the view layer carries no
     * literal copy.
     */
    categoryHeaders: Record<InventoryCategory, string>;
    /**
     * Paper-doll Equipment Dock above the tabs (Phase 32 sub-tick E).
     * Computed from the full inventory (independent of active-tab
     * filter) so the dock keeps showing worn slots regardless of
     * which tab the user is on.
     */
    equipmentDock: EquipmentDockViewModel;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TAB_ORDER: readonly InventoryTab[] = [
    'all',
    'equipment',
    'consumable',
    'material',
    'quest',
] as const;

/** Display strings for the inventory screen's chrome. */
// Phase 80 (naming pass): the eyebrow said WALLET while the money box a few
// pixels below it said SHILLING — two words for the same readout on one
// screen. PURSE is the canonical money-container word everywhere else
// (blacksmith/rest/village); this screen now agrees with itself and them.
const SECTION_HEADER = 'SATCHEL · PURSE · BURDEN';
const CATEGORY_HEADERS: Record<InventoryCategory, string> = {
    // S3-sheet-C22 (second half): every header echoes its own tab — PHIALS →
    // '✠ PHIALS & SOPS', STUFF → '✠ STUFF', SEALED → '✠ SEALED'. This one was
    // '✠ WORN & WIELDED' back when the tab read WORN, so renaming the tab to
    // GEAR left the section heading as the surviving half of the same lie: it
    // claims wornness over a list that includes everything carried unworn.
    // GEAR & GIRDING restores the echo and names the goods, not their state;
    // the per-row WORN badge stays the only claim about what is on the body.
    equipment: '✠ GEAR & GIRDING',
    consumable: '✠ PHIALS & SOPS',
    material: '✠ STUFF',
    quest: '✠ SEALED',
};

const TAB_LABELS: Record<InventoryTab, string> = {
    all: 'ALL',
    // S3-sheet-C22: every tab's badge counts the rows that tab shows, and this
    // tab shows all equipment carried — so the badge read "8" while five things
    // were worn. The count is right; the word was the liar. GEAR names the
    // filter (equipment) instead of a state (equipped) the filter does not
    // apply; the per-row WORN badge still marks what is actually on the body.
    equipment: 'GEAR',
    consumable: 'PHIALS',
    material: 'STUFF',
    quest: 'SEALED',
};

const SLOT_LABELS: Record<Equipment['slot'], string> = {
    weapon: 'Weapon',
    armor: 'Armor',
    // FE-009: 'Trinket', not 'Accessory'. The worn-gear dock above the grid
    // labels these three positions TRINKET I/II/III, and the SELF sheet was
    // already aligned to Trinket by an earlier drift fix — the item grid was
    // the last surface naming the same slot a second way, on the same
    // unscrolled screen as the dock.
    accessory: 'Trinket',
};

const BURDEN_MAX = 50;
const EMPTY_MESSAGE = 'nothing in the satchel.';

/**
 * Uppercase chrome label per slot — distinct from `SLOT_LABELS`
 * (which is title-case "Weapon" / "Armor" for the item-row sub
 * field). The dock chrome uses TRINKET for accessory per the design;
 * the three accessory rows append a numeral (TRINKET I/II/III).
 */
const DOCK_SLOT_TITLE: Record<Equipment['slot'], string> = {
    weapon: 'WEAPON',
    armor: 'ARMOR',
    accessory: 'TRINKET',
};

/** Roman numeral suffix per accessory position (indexed by `accessoryIndex`). */
const DOCK_ACCESSORY_NUMERALS = ['I', 'II', 'III'] as const;

const DOCK_HEADER_LABEL = '✠ WORN UPON THE BODY';
// FE-027: the old hint, 'WORN VS. UNWORN AT A GLANCE', described a comparison
// that is not on screen — the dock lists five worn slots with a name and what
// each grants, and nothing unworn. The comparison is real but it is BEHIND a
// tap: selecting a slot filters the grid below to the items that fit it
// (`filterRowsBySlot`). The hint now says how to get it, which also teaches an
// interaction nothing else on the screen advertises.
const DOCK_HINT_LABEL = 'TAP A SLOT TO SEE WHAT ELSE FITS';
const DOCK_BARE_LABEL = '— bare —';
const DOCK_BANNER_EYEBROW = 'FITTING SLOT';
const DOCK_BANNER_CLEAR_LABEL = 'CLEAR ✕';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function presentationCategory(item: Item): InventoryCategory {
    if (isEquipment(item)) return 'equipment';
    if (isConsumable(item)) return 'consumable';
    if (isQuestItem(item)) return 'quest';
    return 'material';
}

function subFor(item: Item): string | null {
    if (isEquipment(item)) return SLOT_LABELS[item.slot] ?? null;
    return null;
}

function rarityFor(_item: Item): InventoryItemRow['rarity'] {
    // Phase 23 — the rarity model is retired; equipment (the signet relics) is
    // uniform, so no row carries a rarity shine any more.
    return null;
}

/** Phase 19 — the display name of the signature a signet relic grants, or
 *  `null` for non-relic items. */
function grantsSignatureName(item: Item): string | null {
    if (!isEquipment(item) || !item.grantsSignature) return null;
    return getSignatureSkill(item.grantsSignature)?.name ?? null;
}

function quantityFor(item: Item): number {
    if (isConsumable(item) || isMaterial(item)) {
        // `?? 1` defends against fixtures that omit the engine-required
        // `quantity` field; pre-cast-drop refactor preserved this
        // fallback under `(item as any).quantity ?? 1`.
        return Math.max(1, Number(item.quantity ?? 1));
    }
    return 1;
}

function canUseFor(item: Item): boolean {
    return isConsumable(item) || isEquipment(item);
}

function canDiscardFor(item: Item): boolean {
    return !isQuestItem(item);
}

/**
 * Aggregate an equipment item's flat statModifiers into a stat → value
 * map. Multipliers are skipped for the v1 equip-preview (Phase 35) —
 * the preview surfaces additive deltas only; the engine itself still
 * applies the multipliers correctly when the actual equip lands. A
 * future refinement could surface multiplier deltas separately.
 */
function aggregateEquipmentStats(equipment: Equipment): Map<string, number> {
    const out = new Map<string, number>();
    for (const mod of equipment.statModifiers ?? []) {
        if (mod.isMultiplier) continue;
        out.set(mod.stat, (out.get(mod.stat) ?? 0) + mod.value);
    }
    return out;
}

/**
 * Compute the net stat-delta from replacing `oldItem` with `newItem`.
 * Mirrors `design/handoff-2026-05-16/project/screens/inventory.jsx:215-225`
 * `computeDelta` — start with new item's aggregated stats, subtract
 * the equipped item's stats, drop zero entries. Phase 35 preview.
 */
function computeReplacePreview(
    newItem: Equipment,
    oldItem: Equipment,
): ReplacePreview {
    const newAgg = aggregateEquipmentStats(newItem);
    const oldAgg = aggregateEquipmentStats(oldItem);
    const allKeys = new Set<string>([...newAgg.keys(), ...oldAgg.keys()]);
    const deltas: Array<{ stat: string; delta: number }> = [];
    for (const stat of allKeys) {
        const delta = (newAgg.get(stat) ?? 0) - (oldAgg.get(stat) ?? 0);
        if (delta !== 0) deltas.push({ stat, delta });
    }
    return { replacing: { id: oldItem.id, name: oldItem.name }, deltas };
}

/**
 * Convert the raw engine inventory into display rows. Per Q3=A, items
 * with the same `id` collapse into a single row whose `quantity`
 * reflects the stack size. The *first* equipment item per slot is
 * marked `equipped` to match `selectCharacterViewModel`. Phase 35
 * additionally computes `replacePreview` for every non-equipped
 * equipment row whose slot has an equipped sibling.
 */
function buildRows(state: GameStore): InventoryItemRow[] {
    const inventory = state.player?.inventory ?? [];
    const rowsById = new Map<string, InventoryItemRow>();
    const order: string[] = [];
    // Worn-state convention lives in the engine's capacity-aware `wornPerSlot`
    // (Phase 18). Compute once; all consumers in this function read from it.
    const wornBySlot = wornPerSlot(inventory);
    const isWorn = (item: Equipment): boolean =>
        (wornBySlot.get(item.slot) ?? []).some((w) => w.id === item.id);
    // The worn sibling a candidate is compared against: itself when already worn
    // (→ unequip delta), null when a position is free (→ equip), or the piece it
    // would displace when the slot is at capacity (→ swap).
    const siblingFor = (item: Equipment): Equipment | null => {
        const worn = wornBySlot.get(item.slot) ?? [];
        if (worn.some((w) => w.id === item.id)) return item;
        if (worn.length < SLOT_CAPACITY[item.slot]) return null;
        return worn[worn.length - 1];
    };
    // First-seen engine item per ID — used to grab the StatModifier
    // array on non-equipped equipment when we compute the preview.
    const itemById = new Map<string, Equipment>();

    for (const item of inventory) {
        const cat = presentationCategory(item);
        const existing = rowsById.get(item.id);
        if (existing !== undefined) {
            rowsById.set(item.id, {
                ...existing,
                quantity: existing.quantity + quantityFor(item),
            });
            continue;
        }

        let equipped = false;
        if (isEquipment(item)) {
            equipped = isWorn(item);
            itemById.set(item.id, item);
        }

        const row: InventoryItemRow = {
            id: item.id,
            name: item.name,
            category: cat,
            sub: subFor(item),
            quantity: quantityFor(item),
            rarity: rarityFor(item),
            equipped,
            description: item.description,
            canUse: canUseFor(item),
            canDiscard: canDiscardFor(item),
            grantsSignature: grantsSignatureName(item),
            replacePreview: null,
            equipDelta: null,
        };
        rowsById.set(item.id, row);
        order.push(item.id);
    }

    // Second pass: replacePreview + equipDelta for equipment rows.
    //
    // `replacePreview` (Phase 35) stays scoped to non-equipped items
    // with an equipped sibling — net signed stat list only. `equipDelta`
    // (Phase 133) is computed for *every* equipment row so the surface
    // can show gained-only (equip into empty slot), lost-only (the worn
    // item), or gained+lost (swap), across stats, modifiers, passive
    // effects, proc hooks, resources, and keywords.
    for (const id of order) {
        const row = rowsById.get(id)!;
        if (row.category !== 'equipment') continue;
        const item = itemById.get(id);
        if (item === undefined) continue;

        const equippedSibling = siblingFor(item);
        const equipDelta = computeEquipDelta(item, equippedSibling, state.player);

        let replacePreview: ReplacePreview | null = null;
        if (
            !row.equipped &&
            equippedSibling !== null &&
            equippedSibling.id !== item.id
        ) {
            replacePreview = computeReplacePreview(item, equippedSibling);
        }

        rowsById.set(id, { ...row, replacePreview, equipDelta });
    }

    return order.map((id) => rowsById.get(id)!);
}

function countByCategory(rows: readonly InventoryItemRow[]): Record<InventoryCategory, number> {
    const counts: Record<InventoryCategory, number> = {
        equipment: 0,
        consumable: 0,
        material: 0,
        quest: 0,
    };
    for (const row of rows) counts[row.category] += row.quantity;
    return counts;
}

function buildTabs(rows: readonly InventoryItemRow[]): InventoryTabRow[] {
    const counts = countByCategory(rows);
    const totalAll = counts.equipment + counts.consumable + counts.material + counts.quest;
    return TAB_ORDER.map((key) => ({
        key,
        label: TAB_LABELS[key],
        count: key === 'all' ? totalAll : counts[key],
    }));
}

function filterRowsByTab(
    rows: readonly InventoryItemRow[],
    tab: InventoryTab,
): readonly InventoryItemRow[] {
    if (tab === 'all') return rows;
    return rows.filter((r) => r.category === tab);
}

function readShilling(state: GameStore): number {
    // The engine canonical currency field is `Character.currency`
    // (engine type def `Character/types.d.ts:41`). "Shilling" is the
    // mobile chrome label for the same value — the VM field name +
    // the SHILLING screen literal carry the voice-register choice.
    // Closes the [2.5] DRIFT row from
    // archived `plan/archive/2026-09-25-trim-t1/axiomancer-mobile/docs/mechanics-ui-audit-2026-05-22-inventory.md` row 7: the
    // earlier `p.shilling ?? p.currency` fallback hid which engine
    // field was canonical; no save / migration / fixture writes
    // `shilling` (cross-tree grep confirms) so the fallback was
    // dead code.
    const raw = Number(state.player.currency ?? 0);
    return Number.isFinite(raw) && raw >= 0 ? raw : 0;
}

function computeBurden(rows: readonly InventoryItemRow[]): number {
    // Return the uncapped total so the BURDEN bar's text reads
    // honestly ("60 / 50" when over capacity) rather than silently
    // clamping the display to "50 / 50". The bar fill renders
    // clamped at 100% (StatBar handles its own pct clamp) — that's
    // correct because the bar can't visualize "more than full" —
    // but the numeric text on the label row carries the overflow
    // signal. Closes the [3.0] DRIFT row from
    // archived `plan/archive/2026-09-25-trim-t1/axiomancer-mobile/docs/mechanics-ui-audit-2026-05-22-inventory.md` row 11.
    return rows.reduce((acc, r) => acc + r.quantity, 0);
}

/**
 * Resolve the item-row's `sub` field back to the engine slot key.
 * `subFor` produces title-case slot labels ("Weapon" / "Body" / etc.)
 * from `SLOT_LABELS`; reverse the mapping here so the dock can build
 * its `worn` map without re-importing the engine's Equipment type at
 * the screen.
 */
const SUB_TO_SLOT: Record<string, Equipment['slot']> = Object.fromEntries(
    (Object.entries(SLOT_LABELS) as ReadonlyArray<[Equipment['slot'], string]>).map(
        ([slot, sub]) => [sub, slot],
    ),
) as Record<string, Equipment['slot']>;

function buildEquipmentDock(
    rows: readonly InventoryItemRow[],
    selectedSlot: Equipment['slot'] | null,
): EquipmentDockViewModel {
    // Bucket the worn rows by slot kind. Weapon/armor keep the first worn row;
    // accessories collect up to `SLOT_CAPACITY.accessory` in worn order so each
    // of the 3 positions renders its own dock row (worn window per the
    // `wornPerSlot` convention already caps `r.equipped` at capacity).
    let weapon: InventoryItemRow | null = null;
    let armor: InventoryItemRow | null = null;
    const accessories: InventoryItemRow[] = [];
    for (const r of rows) {
        if (r.category !== 'equipment' || !r.equipped || r.sub === null) continue;
        const slot = SUB_TO_SLOT[r.sub];
        if (slot === 'weapon') {
            if (weapon === null) weapon = r;
        } else if (slot === 'armor') {
            if (armor === null) armor = r;
        } else if (slot === 'accessory') {
            if (accessories.length < SLOT_CAPACITY.accessory) accessories.push(r);
        }
    }
    const toItem = (row: InventoryItemRow | null): EquipmentDockSlot['item'] =>
        row === null
            ? null
            : { id: row.id, name: row.name, sub: row.sub, grantsSignature: row.grantsSignature };
    const slots: EquipmentDockSlot[] = [
        { key: 'weapon', label: DOCK_SLOT_TITLE.weapon, item: toItem(weapon) },
        { key: 'armor', label: DOCK_SLOT_TITLE.armor, item: toItem(armor) },
        ...Array.from({ length: SLOT_CAPACITY.accessory }, (_, i): EquipmentDockSlot => ({
            key: 'accessory',
            accessoryIndex: i as 0 | 1 | 2,
            label: `${DOCK_SLOT_TITLE.accessory} ${DOCK_ACCESSORY_NUMERALS[i]}`,
            item: toItem(accessories[i] ?? null),
        })),
    ];
    return {
        slots,
        headerLabel: DOCK_HEADER_LABEL,
        hintLabel: DOCK_HINT_LABEL,
        bareLabel: DOCK_BARE_LABEL,
        selectedSlot,
        bannerEyebrow: DOCK_BANNER_EYEBROW,
        bannerSlotLabel: selectedSlot === null ? '' : DOCK_SLOT_TITLE[selectedSlot],
        bannerClearLabel: DOCK_BANNER_CLEAR_LABEL,
    };
}

function filterRowsBySlot(
    rows: readonly InventoryItemRow[],
    slot: Equipment['slot'],
): readonly InventoryItemRow[] {
    const targetSub = SLOT_LABELS[slot];
    return rows.filter((r) => r.category === 'equipment' && r.sub === targetSub);
}

// ---------------------------------------------------------------------------
// Public selector
// ---------------------------------------------------------------------------

export function selectInventoryViewModel(
    state: GameStore,
    localUi: InventoryLocalUi = {},
): InventoryViewModel {
    const inventory = state.player?.inventory ?? [];
    const rows = buildRows(state);
    const activeTab = localUi.activeTab ?? 'all';
    const selectedSlot = localUi.selectedSlot ?? null;
    // Slot filter overrides tab filter — the screen sets activeTab='all'
    // when picking a slot, but we guard here too so a stale tab pick
    // can't leak through when the consumer is e.g. a hermetic test.
    const items = selectedSlot === null
        ? filterRowsByTab(rows, activeTab)
        : filterRowsBySlot(rows, selectedSlot);

    return freezeViewModel({
        tabs: buildTabs(rows),
        activeTab,
        items,
        shilling: readShilling(state),
        burden: computeBurden(rows),
        burdenMax: BURDEN_MAX,
        expandedItemId: localUi.expandedItemId ?? null,
        isEmpty: rows.length === 0,
        emptyMessage: EMPTY_MESSAGE,
        sectionHeader: SECTION_HEADER,
        categoryHeaders: CATEGORY_HEADERS,
        equipmentDock: buildEquipmentDock(rows, selectedSlot),
    });
}
