/**
 * Screen-level presenter for `app/(tabs)/character/index.tsx`.
 *
 * Implements `selectCharacterViewModel` from engine state (Spec 05).
 * Reads base stats, active effects, and equipment slots directly from
 * `state.player`. (The derived attack/defence, luck and save/test panels were
 * deleted with the engine stats in TRIM THE FAT T2a — they were display-only
 * numbers combat never read.) Cards are deferred
 * to engine Spec 04.
 *
 * VM is *data only* per Q5 — no colour tokens, no icons. The screen
 * resolves `StanceGlyph` from `stanceKey`, etc.
 */

import {
    lookupEffect,
    type ActiveEffect,
    type Character,
    type GameStore,
} from '@mechanics';

import { freezeViewModel } from './freeze';
import { wornPerSlot, SLOT_CAPACITY, getSignatureSkill } from '@mechanics';
import type { Equipment } from '@mechanics';

export type StanceKey = 'heart' | 'body' | 'mind';
export type EffectKind = 'buff' | 'debuff' | 'poison' | 'bleed';
export type EffectTint = 'buff' | 'debuff';

export interface BaseStatRow {
    /** Stable key the component maps to a `StanceGlyph` kind. */
    stanceKey: StanceKey;
    /** Display label, e.g. `'HEART'`. */
    label: string;
    /** Raw stat value. */
    value: number;
}

export interface CharacterEffectRow {
    /**
     * Phase 74 follow-up — engine `effectId` threaded through so the
     * SELF tap-tooltip wrapper can fire `selectTooltipContentFor(
     * 'effect', effectId)`. Empty string when the source effect has
     * no engine id (synthetic fixtures); the tooltip presenter
     * short-circuits on empty.
     */
    effectId: string;
    name: string;
    kind: EffectKind;
    tint: EffectTint;
    /** Remaining duration in rounds. */
    duration: number | null;
    intensity: number;
    description: string;
}

export interface EquipmentSlotRow {
    /**
     * Engine slot kind (Phase 18 — `weapon | armor | accessory`). The SELF
     * tooltip wrapper passes this to `selectTooltipContentFor('slot', slotKey)`.
     */
    slotKey: 'weapon' | 'armor' | 'accessory';
    /**
     * Which of the 3 interchangeable accessory positions this row is (0-2).
     * Present only on `accessory` rows; absent for weapon/armor.
     */
    accessoryIndex?: 0 | 1 | 2;
    /** Slot label, e.g. `'Weapon'`. */
    name: string;
    /** Equipped item name, or `null` when empty. */
    item: string | null;
    /**
     * Phase 19 — the signature this worn signet relic grants (display name), or
     * `null` when the slot is empty or the worn piece is not a relic. The view
     * renders it as a "grants <name>" sub-label.
     */
    grantsSignature: string | null;
}

export interface CharacterCardRow {
    /**
     * Phase 74 follow-up walkthrough Tick 2 — engine card id
     * threaded through so the SELF tap-tooltip wrapper can fire
     * `selectTooltipContentFor('card', id)`. `vm.cards` is the
     * dead `[]` surface today; the field is in place for when
     * `player.knownCards` consumption ships.
     */
    id: string;
    name: string;
    stanceKey: StanceKey;
}

export interface CharacterViewModel {
    /** Pre-formatted display name (may include explicit `\n` line breaks). */
    displayName: string;
    /** Subtitle / role flavour line. */
    subtitle: string;
    level: number;
    xp: number;
    xpMax: number;
    /**
     * Label for the XP row (FE-004).
     *
     * The row printed `XP · LVL {level + 1}` beside a framed medallion showing
     * `{level}`, so a sheet at level 1 read `XP · LVL 2` next to a large `1`
     * and the player could not tell which number was their level. The label
     * now says the progress is TO the next level. Kept short on purpose: the
     * identity column is ~130px wide beside the portrait and the level
     * medallion, and a longer label wraps to three lines there.
     */
    xpLabel: string;
    /**
     * Phase 73 — unspent stat-allocation points. Engine surfaces this
     * via `Character.availableStatPoints`; the SELF-tab header inserts
     * the `<AscendStrip>` between the level box and XP chain when
     * `pendingPoints > 0`. When zero the header renders exactly as
     * pre-Phase-73.
     */
    pendingPoints: number;
    /**
     * Phase 73 follow-up (user-jot 2026-05-24): true when XP has
     * crossed the level-up threshold but `levelUp` has not yet been
     * dispatched. The SELF header mounts `<LevelReadyStrip>` in this
     * state — tap drains XP via `actions.levelUp()` and converts to
     * pending stat points (which then surface via `<AscendStrip>`).
     * Mutually-prioritized below `pendingPoints > 0` at the view
     * layer — when both are true, AscendStrip wins (spend before
     * earning more).
     */
    levelUpReady: boolean;
    base: readonly BaseStatRow[];
    effects: readonly CharacterEffectRow[];
    /**
     * Visible placeholder rendered when `effects` is empty. Lowercase
     * ritual register; the screen renders verbatim (uppercased via
     * `textTransform`) so the view layer carries no ritual literal
     * (Hard Rule #8). Sibling to `a11y.effects` which is the
     * full-sentence screen-reader analogue.
     */
    emptyEffectsMessage: string;
    equipment: readonly EquipmentSlotRow[];
    cards: readonly CharacterCardRow[];
    /** Accessibility labels for character screen elements. */
    a11y: {
        characterName: string;
        level: string;
        experience: string;
        baseStats: string;
        equipment: string;
        effects: string;
        /**
         * Label for the Token Crucible entry button. Lives on the
         * presenter so the screen has no hardcoded a11y literals
         * (Hard Rule #8 — content stays in the proper layer).
         */
        crucibleOpen: string;
    };
}

// Equipment slot kinds, matching the engine's Phase-18 EquipmentSlot literals.
type SlotKey = 'weapon' | 'armor' | 'accessory';

const SLOT_LABELS: Record<SlotKey, string> = {
    weapon: 'Weapon',
    armor: 'Armor',
    // [3.0] DRIFT fix: aligned to 'Trinket' (matches the inventory dock's
    // 'TRINKET' chrome). The three accessory rows share this label.
    accessory: 'Trinket',
};

function buildBase(player: Character): readonly BaseStatRow[] {
    const { heart, body, mind } = player.baseStats;
    return [
        { stanceKey: 'heart', label: 'HEART', value: heart },
        { stanceKey: 'body', label: 'BODY', value: body },
        { stanceKey: 'mind', label: 'MIND', value: mind },
    ];
}

function buildEffects(player: Character): readonly CharacterEffectRow[] {
    // Character-audit [2.5] fix 2026-05-22: dropped `(player as
    // any).effects` cast. Engine `Character.effects: ActiveEffect[]`
    // is typed cleanly; the `?? []` defensive fallback covers
    // synthetic test fixtures that build a Character via spreads.
    const effects: readonly ActiveEffect[] = player.effects ?? [];
    return effects.map((ae) => {
        const def = lookupEffect(ae.effectId);
        const rawKind = def?.type ?? 'debuff';
        const kind = (rawKind === 'buff' ? 'buff' : 'debuff') as EffectKind;
        return {
            effectId: ae.effectId ?? '',
            name: def?.name ?? ae.effectId,
            kind,
            tint: (kind === 'buff' ? 'buff' : 'debuff') as EffectTint,
            duration: ae.remainingDuration,
            intensity: ae.intensity,
            description: def?.description ?? '',
        };
    });
}

/** Build one equipment slot row, resolving a worn signet relic's granted
 *  signature to its display name (Phase 19). */
function equipmentRow(
    slotKey: 'weapon' | 'armor' | 'accessory',
    name: string,
    piece: Equipment | undefined,
): EquipmentSlotRow {
    const sigId = piece?.grantsSignature;
    return {
        slotKey,
        name,
        item: piece?.name ?? null,
        grantsSignature: sigId ? getSignatureSkill(sigId)?.name ?? null : null,
    };
}

function buildEquipment(player: Character): readonly EquipmentSlotRow[] {
    // Worn-state convention lives in the engine's `Items/equipped.ts`
    // (capacity-aware `wornPerSlot`, Phase 18). Five rows: Weapon, Armor, then
    // three interchangeable accessory positions.
    const worn = wornPerSlot(player.inventory);
    const accessories = worn.get('accessory') ?? [];
    const rows: EquipmentSlotRow[] = [
        equipmentRow('weapon', SLOT_LABELS.weapon, worn.get('weapon')?.[0]),
        equipmentRow('armor', SLOT_LABELS.armor, worn.get('armor')?.[0]),
    ];
    for (let i = 0; i < SLOT_CAPACITY.accessory; i++) {
        rows.push({
            ...equipmentRow('accessory', SLOT_LABELS.accessory, accessories[i]),
            accessoryIndex: i as 0 | 1 | 2,
        });
    }
    return rows;
}

/**
 * Derives the character view-model from game state.
 * All fields are driven by the engine's `state.player`. Cards are
 * empty until engine Spec 04 ships known-card reads.
 */
export function selectCharacterViewModel(state: GameStore): CharacterViewModel {
    const player = state.player;
    // Character-audit [2.5] fix 2026-05-22: lifted `buildEffects(player)`
    // to a single call. Pre-fix called it 3x (vm field + 2x a11y
    // branches) — wasteful + brittle if the helper extends to
    // engine library reads.
    const effects = buildEffects(player);

    return freezeViewModel({
        displayName: player.name,
        subtitle: 'PILGRIM',
        level: player.level,
        xp: player.experience,
        xpMax: player.experienceToNextLevel,
        xpLabel: `XP TO LVL ${(player.level ?? 0) + 1}`,
        pendingPoints: player.availableStatPoints ?? 0,
        levelUpReady:
            (player.experience ?? 0) >= (player.experienceToNextLevel ?? Infinity),
        base: buildBase(player),
        effects,
        emptyEffectsMessage: 'none at hand.',
        equipment: buildEquipment(player),
        cards: [],
        a11y: {
            characterName: `Character name: ${player.name}`,
            level: `Level ${player.level}`,
            experience: `Experience: ${player.experience} of ${player.experienceToNextLevel}`,
            baseStats: 'Base statistics: Heart, Body, Mind',
            equipment: 'Equipment slots and equipped items',
            effects: effects.length > 0
                ? `${effects.length} active effects`
                : 'No active effects',
            crucibleOpen: 'Open Token Crucible.',
        },
    });
}
