/**
 * Item-reward screen — store action glue (owner finding 10; D5 / D6 / D7).
 *
 * The RULES live in `axiomancer-mechanics`:
 *   - `grantItem` owns the `unequipItem -> addItem -> equipItem` chain, so
 *     nothing is destroyed and a full accessory row swaps instead of no-oping;
 *   - `qualifiesForItemRewardScreen` (D5) is the one predicate that decides
 *     ceremony vs. the lightweight inline grant;
 *   - `displacedBy` previews the trade so the screen can name it (D6).
 *
 * This module only threads those through the mobile `itemReward` slice. It
 * makes no rule decisions of its own, and it never re-derives what the engine
 * already answers.
 *
 * ## The commit model, and why dismissal is safe (D7)
 *
 * The pending item is NOT in the inventory while the screen is up — the grant
 * is exactly what CONFIRM and EQUIP commit. That would make "back" a way to
 * lose a reward, so `dismissItemRewardAction` DRAINS the whole queue as
 * CONFIRM. Back, swipe, and Android hardware-back all route there (the screen
 * commits on unmount), which is D7 stated in code: leaving keeps the item.
 *
 * ## Why the inventory is reordered after an EQUIP
 *
 * Worn-state has two representations that must agree: the engine's
 * `Character.equipment` loadout, and the positional convention every
 * inventory-driven client reads (`wornPerSlot` — the first
 * `SLOT_CAPACITY[slot]` equipment items per slot, in inventory order).
 * `grantItem` appends the clone to the END of the inventory, so a granted
 * relic that the loadout now wears can sit outside the worn window and the
 * SATCHEL would draw the displaced piece as still worn. Expressing the
 * loadout in inventory order is the CLIENT's convention (documented on
 * `Items/equipped.ts`), which is why the reordering lives here and not in the
 * engine — `state/actions.ts`'s own `equipItemAction` / `unequipItemAction`
 * do the same thing for the inventory screen.
 */

import {
    grantItem,
    isEquipment,
    isFirstNodeRelicPending,
    partitionGrantsForReward,
    getRelicById,
    FIRST_NODE_RELIC_FLAG,
    FIRST_NODE_RELIC_ID,
    STAND_IN_RELIC_ID,
} from '@mechanics';
import type {
    Character,
    Equipment,
    EquipmentSlot,
    GameState,
    GrantOutcome,
    Item,
} from '@mechanics';

import { EMPTY_ITEM_REWARD_SLICE, type AppStore, type PendingItemReward } from '../store';

// ---------------------------------------------------------------------------
// Offering
// ---------------------------------------------------------------------------

export interface OfferItemRewardOptions {
    /** Where the item came from, shown as the screen's eyebrow. */
    source?: string | null;
    /** Flags stamped onto `GameState.flags` when the entry commits. */
    settleFlags?: readonly string[];
    /** Accessory position EQUIP should displace when the row is full. */
    replaceIndex?: number;
    /**
     * Queue items that do NOT pass D5 as well. Default `false`: D5 partitions
     * them out and the caller keeps its existing inline grant for them.
     */
    includeInline?: boolean;
}

export interface OfferItemRewardResult {
    /** Items now waiting on the reward screen, in the order they will show. */
    queued: readonly Item[];
    /**
     * Items D5 sent back to the caller's lightweight inline grant. These were
     * NOT granted here — the caller still owns them.
     */
    inline: readonly Item[];
}

function setQueue(store: AppStore, queue: readonly PendingItemReward[]): void {
    store.setState({ itemReward: { queue } });
}

function currentQueue(store: AppStore): readonly PendingItemReward[] {
    return store.getState().itemReward?.queue ?? EMPTY_ITEM_REWARD_SLICE.queue;
}

/**
 * Offer one item or a batch to the reward screen.
 *
 * Nothing is granted here — the grant is the player's CONFIRM / EQUIP. The
 * returned `inline` list is the caller's to grant as it does today, which is
 * exactly the split D5 asks for.
 */
export function offerItemRewardAction(
    store: AppStore,
    items: Item | readonly Item[],
    options: OfferItemRewardOptions = {},
): OfferItemRewardResult {
    const batch = Array.isArray(items) ? (items as readonly Item[]) : [items as Item];
    if (batch.length === 0) return { queued: [], inline: [] };

    const split = partitionGrantsForReward(batch);
    const toQueue = options.includeInline ? batch : split.reward;
    const inline = options.includeInline ? [] : split.inline;
    if (toQueue.length === 0) return { queued: [], inline };

    const entries: PendingItemReward[] = toQueue.map((item) => ({
        item,
        source: options.source ?? null,
        settleFlags: options.settleFlags ?? [],
        ...(options.replaceIndex === undefined ? {} : { replaceIndex: options.replaceIndex }),
    }));

    setQueue(store, [...currentQueue(store), ...entries]);
    return { queued: toQueue, inline };
}

/**
 * Offer the first-node Suppliant's Ring, if the run still owes it.
 *
 * This is W1's grant given a ceremony: `game.reducer.ts` deliberately settles
 * the ring silently only as a floor (`START_COMBAT`, `PROCESS_NODE`) and
 * leaves the hand-over to "clients with a screen to show it on". Mobile is
 * that client, and this is that screen's door.
 *
 * Returns `false` when the grant is already settled — idempotent, so a gate
 * may call it on every state change.
 */
export function offerFirstNodeRelicAction(store: AppStore): boolean {
    const state = store.getState() as unknown as GameState;
    const player = state.player;
    const flags = state.flags ?? [];
    if (!player) return false;
    if (!isFirstNodeRelicPending(player, flags)) return false;
    // Already queued — do not stack a second copy of the same hand-over.
    if (currentQueue(store).some((e) => e.item.id === FIRST_NODE_RELIC_ID)) return false;

    const ring = getRelicById(FIRST_NODE_RELIC_ID);
    if (!ring) return false;

    // `withholdFirstNodeRelic` back-fills the ring's seat with the Venom Sigil
    // stand-in, so that is the piece this grant should push out. Passing the
    // index explicitly keeps that true even if the accessory row is reordered
    // before the player reaches the first node; when the stand-in is absent the
    // engine default (last worn accessory) applies.
    const standInIndex = player.equipment.accessories.findIndex((a) => a.id === STAND_IN_RELIC_ID);

    offerItemRewardAction(store, ring, {
        source: 'Handed over at the first waypoint',
        settleFlags: [FIRST_NODE_RELIC_FLAG],
        ...(standInIndex === -1 ? {} : { replaceIndex: standInIndex }),
        // The ring qualifies under D5 on its own (signature + stat grant); the
        // flag makes that independent of a future content edit.
        includeInline: true,
    });
    return true;
}

// ---------------------------------------------------------------------------
// Worn-window reconciliation
// ---------------------------------------------------------------------------

/**
 * Reorder `player.inventory` so the positional worn convention reports exactly
 * the pieces the engine loadout wears.
 *
 * Within each equipment slot the loadout's members come first, in loadout
 * order, followed by the benched peers in their existing relative order. Every
 * inventory POSITION keeps its slot, so non-equipment rows and the overall
 * shape of the sack are untouched — only equipment of the same slot permutes
 * among the positions it already occupied.
 *
 * A duplicate id (two copies of one relic row) counts as worn for both copies;
 * `wornPerSlot` caps the window at the slot capacity regardless, so the worst
 * case is a cosmetic ordering, never a stat drift.
 */
function reconcileWornWindow(player: Character): Character {
    const loadout = player.equipment;
    const wornIds: Record<EquipmentSlot, readonly string[]> = {
        weapon: loadout.weapon ? [loadout.weapon.id] : [],
        armor: loadout.armor ? [loadout.armor.id] : [],
        accessory: loadout.accessories.map((a) => a.id),
    };

    const bySlot = new Map<EquipmentSlot, Item[]>();
    for (const item of player.inventory) {
        if (!isEquipment(item)) continue;
        const list = bySlot.get(item.slot);
        if (list === undefined) bySlot.set(item.slot, [item]);
        else list.push(item);
    }
    if (bySlot.size === 0) return player;

    for (const [slot, list] of bySlot) {
        const ids = wornIds[slot];
        const worn: Item[] = [];
        const bench: Item[] = [];
        for (const it of list) (ids.includes(it.id) ? worn : bench).push(it);
        worn.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
        bySlot.set(slot, [...worn, ...bench]);
    }

    const cursor = new Map<EquipmentSlot, number>();
    const inventory = player.inventory.map((item) => {
        if (!isEquipment(item)) return item;
        const at = cursor.get(item.slot) ?? 0;
        cursor.set(item.slot, at + 1);
        return bySlot.get(item.slot)?.[at] ?? item;
    });

    return { ...player, inventory };
}

// ---------------------------------------------------------------------------
// Committing
// ---------------------------------------------------------------------------

export type ItemRewardCommitMode = 'confirm' | 'equip';

export interface ItemRewardCommitResult {
    applied: boolean;
    /** The clone that entered the inventory. `null` when nothing was pending. */
    granted: Item | null;
    /** The worn piece EQUIP pushed back to the satchel. Never destroyed. */
    displaced: Equipment | null;
    outcome: GrantOutcome | null;
    /** Entries still waiting behind this one. */
    remaining: number;
}

const NOOP_COMMIT: ItemRewardCommitResult = Object.freeze({
    applied: false,
    granted: null,
    displaced: null,
    outcome: null,
    remaining: 0,
});

function persist(store: AppStore): void {
    try {
        store.getState().save();
    } catch {
        // A persistence failure must never strand the player mid-hand-over.
    }
}

/**
 * Commit the head of the queue through the engine's shared grant path and
 * advance to the next entry.
 *
 * `'confirm'` grants to the inventory only; `'equip'` grants AND wears it,
 * swapping (never destroying) whatever the slot already held.
 */
export function commitItemRewardAction(
    store: AppStore,
    mode: ItemRewardCommitMode,
): ItemRewardCommitResult {
    const queue = currentQueue(store);
    const head = queue[0];
    if (!head) return NOOP_COMMIT;

    const state = store.getState() as unknown as GameState;
    const equip = mode === 'equip' && isEquipment(head.item);

    const result = grantItem(state.player, head.item, {
        equip,
        ...(head.replaceIndex === undefined ? {} : { replaceIndex: head.replaceIndex }),
    });

    const player = equip ? reconcileWornWindow(result.character) : result.character;
    const rest = queue.slice(1);

    const patch: Record<string, unknown> = {
        player,
        itemReward: { queue: rest },
    };

    if (head.settleFlags.length > 0) {
        const flags = state.flags ?? [];
        const missing = head.settleFlags.filter((f) => !flags.includes(f));
        if (missing.length > 0) patch.flags = [...flags, ...missing];
    }

    store.setState(patch as never);
    persist(store);

    return {
        applied: true,
        granted: result.granted,
        displaced: result.displaced,
        outcome: result.outcome,
        remaining: rest.length,
    };
}

/** CONFIRM — the item goes to the satchel and nothing is worn. */
export function confirmItemRewardAction(store: AppStore): ItemRewardCommitResult {
    return commitItemRewardAction(store, 'confirm');
}

/** EQUIP — the item goes to the satchel AND onto the body (D6: swap, never destroy). */
export function equipItemRewardAction(store: AppStore): ItemRewardCommitResult {
    return commitItemRewardAction(store, 'equip');
}

/**
 * D7 — leaving the screen is CONFIRM, for every entry still queued.
 *
 * Back, swipe, and Android hardware-back land here (the screen commits on
 * unmount), so there is no exit path that loses a reward. Returns the LAST
 * commit's result, with `applied` true when anything was paid.
 */
export function dismissItemRewardAction(store: AppStore): ItemRewardCommitResult {
    let last = NOOP_COMMIT;
    // Bounded by the queue length; each commit pops exactly one entry.
    for (let guard = currentQueue(store).length; guard > 0; guard--) {
        const step = confirmItemRewardAction(store);
        if (!step.applied) break;
        last = step;
    }
    return last;
}

/**
 * D5's predicate and D6's displacement preview, re-exported so a call site can
 * ask "does this deserve the screen, and what would it cost" from the one
 * module it already imports. Both are the engine's — nothing is re-derived.
 */
export { qualifiesForItemRewardScreen, partitionGrantsForReward, displacedBy } from '@mechanics';
