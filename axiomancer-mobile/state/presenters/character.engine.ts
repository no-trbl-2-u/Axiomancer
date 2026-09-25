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
    AXIS_LOW_THRESHOLD,
    bucketAxis,
    defaultAlignment,
    getAlignmentCell,
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

/**
 * Three philosophical axes the engine 0.10.0 alignment cube tracks
 * (`state.philosophicalAlignment`). Each axis is bucketed via
 * `bucketAxis()` to `low` | `mid` | `high` for display.
 */
export type AlignmentAxisKey = 'epistemology' | 'outlook' | 'scope';
export type AlignmentBucket = 'low' | 'mid' | 'high';

export interface AlignmentAxisRow {
    axisKey: AlignmentAxisKey;
    /** Display label, e.g. `'EPISTEMOLOGY'`. */
    label: string;
    /** Bucketed value for the axis. */
    bucket: AlignmentBucket;
}

export interface AlignmentSlice {
    /** Human-readable cell name from `philosophicalAlignmentLibrary`, e.g.
     * `'Agnostic-Neutral-Relational'`. */
    cellName: string;
    /** Three axis rows in display order: epistemology, outlook, scope. */
    axes: readonly AlignmentAxisRow[];
}

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
    /**
     * Philosophical alignment cube (Phase 52, engine 0.10.0).
     * Computed from `state.philosophicalAlignment` via the engine's
     * `getAlignmentCell` + `bucketAxis`. Defaults to mid/mid/mid for
     * a fresh game (the engine's `defaultAlignment()` seed).
     */
    alignment: AlignmentSlice;
    /**
     * Phase 92 — morale meter value. Sourced from `state.moralMeter`
     * (engine alignment/personality state). Displays current morale
     * level affected by flee actions and other moral choices. Makes
     * the flee cost visible per deep-playtest F03 feedback.
     */
    morale: number;
    /**
     * Copy for the GRACE readouts (FE-003).
     *
     * The sheet shows grace twice: a 1-10 pool bar under POOLS, and the raw
     * `moralMeter` balance further down. Both were headed with the bare word
     * GRACE, so two different numbers appeared under one name with no stated
     * relationship. These strings name the second one as the balance the pool
     * is read from, and live here because presenters own player-facing copy.
     */
    graceCopy: {
        /** Heading for the raw-balance section — distinct from the pool's word. */
        readonly balanceHeading: string;
        /** Sub-label under the balance number. */
        readonly balanceUnit: string;
        /** One line tying the balance to the pool bar above it. */
        readonly balanceRelation: string;
    };
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
        /** Screen-reader analogue for the alignment row. */
        alignment: string;
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
const ALIGNMENT_AXIS_LABELS: Record<AlignmentAxisKey, string> = {
    epistemology: 'CREED',
    outlook: 'AUGURY',
    scope: 'TROTH',
};

function buildAlignmentSlice(state: GameStore): AlignmentSlice {
    // Character-audit [2.5] fix 2026-05-22: dropped `(state as
    // any).philosophicalAlignment` cast. Engine `GameState.philosophicalAlignment:
    // PhilosophicalAlignment` is typed cleanly (non-optional);
    // v3 saves backfill it via the persistence migration. The
    // `?? defaultAlignment()` defensive fallback only covers
    // synthetic test fixtures that bypass `createNewGameState`.
    const alignment = state.philosophicalAlignment ?? defaultAlignment();

    const cell = getAlignmentCell(alignment);

    const axes: AlignmentAxisRow[] = (Object.keys(ALIGNMENT_AXIS_LABELS) as AlignmentAxisKey[])
        .map((axisKey) => ({
            axisKey,
            label: ALIGNMENT_AXIS_LABELS[axisKey],
            bucket: bucketAxis(alignment[axisKey] ?? 0),
        }));

    return { cellName: cell.label, axes };
}

/** Width of the GRACE track in tenths — the readout prints `value / 10`. */
export const GRACE_TRACK_MAX = 10;

/**
 * Geometry for a GRACE track (the exploration HUD's StatusCard and the SELF
 * sheet's POOLS panel draw the same bar).
 */
export interface GraceTrack {
    /** The printed tenths, 1-10: `round((meter + 100) / 20)` clamped. */
    value: number;
    /** Always `GRACE_TRACK_MAX`. */
    max: number;
    /** Fill width in percent from the RAW meter, so the fill and the tic compare exactly. */
    fillPct: number;
    /** The arrears tic's left offset in percent, from the engine's own band boundary. */
    breakPct: number;
    /** `true` when the meter sits in the IN ARREARS band (`<= AXIS_LOW_THRESHOLD`). */
    inArrears: boolean;
}

/**
 * Lays out a GRACE track from the moral meter (-100..100).
 *
 * Purpose: one source for the number, the fill, the tic and the arrears
 * verdict, so the HUD, the SELF sheet and `/memoir` agree.
 *
 * Audit 2026-09-12: both surfaces hard-coded the tic at 2/10 (meter ≈ -60)
 * while `/memoir` puts IN ARREARS at meter <= -34 (`AXIS_LOW_THRESHOLD`, the
 * same boundary `bucketAxis` uses). The tic now sits at that boundary
 * (33% of the track) and the fill follows the raw meter rather than the
 * rounded tenths, so a meter of -33 draws just right of the tic
 * (INDIFFERENT) and -34 touches it (IN ARREARS) — exactly the memoir chip.
 *
 * @param moralMeter - `state.moralMeter`; non-finite reads as 0.
 * @returns a frozen-by-convention geometry object (plain data, no tokens).
 */
export function graceTrack(moralMeter: number): GraceTrack {
    const meter = Number.isFinite(moralMeter) ? Math.max(-100, Math.min(100, moralMeter)) : 0;
    const value = Math.max(1, Math.min(GRACE_TRACK_MAX, Math.round((meter + 100) / 20)));
    return {
        value,
        max: GRACE_TRACK_MAX,
        fillPct: ((meter + 100) / 200) * 100,
        breakPct: ((AXIS_LOW_THRESHOLD + 100) / 200) * 100,
        inArrears: meter <= AXIS_LOW_THRESHOLD,
    };
}

/**
 * Legend copy for the red break tic drawn on a GRACE track.
 *
 * Purpose: the tic is the only mark on either grace bar and nothing named
 * it, so it read as damage on the bar rather than as the arrears threshold
 * the ledger warns about. Resolves cluster S3-sheet-C12.
 *
 * Output: one lowercase marginal line, glyph first so the eye ties the text
 * to the mark. It names no number: the printed tenths round, the band does
 * not (a meter of -33 and -34 both print 3), so any tenths figure would
 * contradict `/memoir` at the edge. The mark itself is the threshold.
 */
export function graceBreakLegend(): string {
    return '▏arrears left of the mark';
}

export function selectCharacterViewModel(state: GameStore): CharacterViewModel {
    const player = state.player;
    const alignment = buildAlignmentSlice(state);
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
        alignment,
        morale: state.moralMeter,
        graceCopy: {
            balanceHeading: '✠ GRACE · THE BALANCE',
            balanceUnit: 'on the parish ledger',
            balanceRelation: 'the pool above is this balance, read in tenths.',
        },
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
            alignment: `The Oaths: ${alignment.cellName}. ${alignment.axes.map((a) => `${a.label.toLowerCase()} ${a.bucket}`).join(', ')}.`,
        },
    });
}
