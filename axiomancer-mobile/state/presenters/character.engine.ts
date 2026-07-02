/**
 * Screen-level presenter for `app/(tabs)/character/index.tsx`.
 *
 * Implements `selectCharacterViewModel` from engine state (Spec 05).
 * Reads player stats, derived stats, save/test modifiers, active effects,
 * and equipment slots directly from `state.player`. Skills are deferred
 * to engine Spec 04.
 *
 * VM is *data only* per Q5 — no colour tokens, no icons. The screen
 * resolves `StanceGlyph` from `stanceKey`, etc.
 */

import {
    bucketAxis,
    defaultAlignment,
    getAlignmentCell,
    lookupEffect,
    type ActiveEffect,
    type Character,
    type GameStore,
} from 'axiomancer-mechanics';

import { freezeViewModel } from './freeze';
import { firstEquippedPerSlot } from 'axiomancer-mechanics';

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

export interface DerivedStatRow {
    /** Row label, e.g. `'PHYSICAL'`. */
    label: string;
    attack: number;
    skill: number;
    defense: number;
    attackId: string;
    skillId: string;
    defenseId: string;
}

export interface SaveOrTestRow {
    /**
     * Phase 74 follow-up walkthrough Tick 4 — kebab-case id used by
     * the SELF tap-tooltip wrapper to look up `kind: 'derived'`
     * content. One of: `'body-save' | 'mind-save' | 'heart-save' |
     * 'body-test' | 'mind-test' | 'heart-test'`.
     */
    id: string;
    label: string;
    /** Already-formatted display string (e.g. `'14'` or `'+2'`). */
    value: string;
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
     * Phase 74 follow-up walkthrough Tick 3 — engine slot literal
     * (`head | body | hands | feet | weapon | armor | accessory`).
     * The SELF tooltip wrapper passes this to
     * `selectTooltipContentFor('slot', slotKey)`.
     */
    slotKey: 'head' | 'body' | 'hands' | 'feet' | 'weapon' | 'armor' | 'accessory';
    /** Slot label, e.g. `'Head'`. */
    name: string;
    /** Equipped item name, or `null` when empty. */
    item: string | null;
}

export interface CharacterSkillRow {
    /**
     * Phase 74 follow-up walkthrough Tick 2 — engine skill id
     * threaded through so the SELF tap-tooltip wrapper can fire
     * `selectTooltipContentFor('skill', id)`. `vm.skills` is the
     * dead `[]` surface today; the field is in place for when
     * `player.knownSkills` consumption ships.
     */
    id: string;
    name: string;
    category: 'fallacy' | 'paradox';
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
    derived: readonly DerivedStatRow[];
    /** Average of the three base stats — the engine's "luck" surface. */
    luck: number;
    saves: readonly SaveOrTestRow[];
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
    skills: readonly CharacterSkillRow[];
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
    /** Accessibility labels for character screen elements. */
    a11y: {
        characterName: string;
        level: string;
        experience: string;
        baseStats: string;
        derivedStats: string;
        saves: string;
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

// Equipment slots in display order, matching engine EquipmentSlot literals 1:1.
const SLOT_ORDER = ['head', 'body', 'hands', 'feet', 'weapon', 'armor', 'accessory'] as const;
type SlotKey = typeof SLOT_ORDER[number];

const SLOT_LABELS: Record<SlotKey, string> = {
    head: 'Head',
    body: 'Body',
    hands: 'Hands',
    feet: 'Feet',
    weapon: 'Weapon',
    armor: 'Armor',
    // [3.0] DRIFT fix: aligned to 'Trinket' (matches inventory
    // dock's 'TRINKET' chrome + chat 1's "HEAD, WEAPON, HANDS,
    // FEET, BODY, ARMOR, TRINKET" specimen). Pre-fix the SELF tab
    // read 'Accessory' for the same slot — inconsistent
    // vocabulary across tabs.
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

function buildDerived(player: Character): readonly DerivedStatRow[] {
    // derivedStats are guaranteed present after v1→v2 persistence migration
    const d = player.derivedStats;
    return [
        { label: 'PHYSICAL', attack: d.physicalAttack, skill: d.physicalSkill, defense: d.physicalDefense, attackId: 'physicalAttack', skillId: 'physicalSkill', defenseId: 'physicalDefense' },
        { label: 'MENTAL',   attack: d.mentalAttack,   skill: d.mentalSkill,   defense: d.mentalDefense,   attackId: 'mentalAttack',   skillId: 'mentalSkill',   defenseId: 'mentalDefense' },
        { label: 'EMOTIONAL',attack: d.emotionalAttack, skill: d.emotionalSkill, defense: d.emotionalDefense, attackId: 'emotionalAttack', skillId: 'emotionalSkill', defenseId: 'emotionalDefense' },
    ];
}

function buildSaves(player: Character): readonly SaveOrTestRow[] {
    // nonCombatStats are guaranteed present after v1→v2 persistence migration
    const n = player.nonCombatStats;
    const sign = (v: number) => (v >= 0 ? `+${v}` : `${v}`);
    return [
        { id: 'body-save',  label: 'Body Save',  value: String(n.physicalSave) },
        { id: 'mind-save',  label: 'Mind Save',  value: String(n.mentalSave) },
        { id: 'heart-save', label: 'Heart Save', value: String(n.emotionalSave) },
        { id: 'body-test',  label: 'Body Test',  value: sign(n.physicalTest) },
        { id: 'mind-test',  label: 'Mind Test',  value: sign(n.mentalTest) },
        { id: 'heart-test', label: 'Heart Test', value: sign(n.emotionalTest) },
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

function buildEquipment(player: Character): readonly EquipmentSlotRow[] {
    // Worn-state convention lives in `state/selectors/equipment.ts`
    // (AUDIT [3.5] inventory-audit row 1).
    const worn = firstEquippedPerSlot(player.inventory);
    return SLOT_ORDER.map((slot) => ({
        slotKey: slot,
        name: SLOT_LABELS[slot],
        item: worn.get(slot)?.name ?? null,
    }));
}

/**
 * Derives the character view-model from game state.
 * All fields are driven by the engine's `state.player`. Skills are
 * empty until engine Spec 04 ships known-skill reads.
 */
const ALIGNMENT_AXIS_LABELS: Record<AlignmentAxisKey, string> = {
    epistemology: 'EPISTEMOLOGY',
    outlook: 'OUTLOOK',
    scope: 'SCOPE',
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

export function selectCharacterViewModel(state: GameStore): CharacterViewModel {
    const player = state.player;
    // derivedStats.luck is guaranteed present after v1→v2 persistence migration
    const luck: number = player.derivedStats.luck;

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
        pendingPoints: player.availableStatPoints ?? 0,
        levelUpReady:
            (player.experience ?? 0) >= (player.experienceToNextLevel ?? Infinity),
        base: buildBase(player),
        derived: buildDerived(player),
        luck,
        saves: buildSaves(player),
        effects,
        emptyEffectsMessage: 'none at hand.',
        equipment: buildEquipment(player),
        skills: [],
        alignment,
        morale: state.moralMeter,
        a11y: {
            characterName: `Character name: ${player.name}`,
            level: `Level ${player.level}`,
            experience: `Experience: ${player.experience} of ${player.experienceToNextLevel}`,
            baseStats: 'Base statistics: Heart, Body, Mind',
            derivedStats: 'Derived statistics: attack, skill, and defense values',
            saves: 'Saving throws and ability tests',
            equipment: 'Equipment slots and equipped items',
            effects: effects.length > 0
                ? `${effects.length} active effects`
                : 'No active effects',
            crucibleOpen: 'Open Token Crucible.',
            alignment: `Philosophical alignment: ${alignment.cellName}. ${alignment.axes.map((a) => `${a.label.toLowerCase()} ${a.bucket}`).join(', ')}.`,
        },
    });
}
