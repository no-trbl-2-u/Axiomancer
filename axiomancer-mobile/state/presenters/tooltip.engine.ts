/**
 * Tooltip content presenter.
 *
 * Pure lookup: `(kind, id, state) → { title, body, footnote?, accent? }`.
 * Returns `null` when no content is authored for the requested
 * (kind, id) pair — the calling site renders nothing and the
 * primitive stays defensive.
 *
 * Authored kinds:
 * - `'stat'` — HEART / BODY / MIND (Tick A, Phase 74).
 * - `'effect'` — engine-sourced; payload-formatted (Phase 75 +
 *   user-jot tighten 2026-05-24). Body is a terse stat-effect
 *   line derived from `Effect.payload`; engine `description`
 *   is intentionally dropped per user request.
 * - `'stance-chip'` — static ADV / DIS dice rules (Phase 75).
 * - `'card'` — engine-sourced via `getCombatCardById(id)` (Phase 75).
 * - `'hazard-keyword'` — engine-sourced via `HAZARD_KEYWORDS[id]`
 *   (Phase 82). The hazard-deck screen's keyword tally chips key
 *   off `HazardKeywordId`; this kind reads the same glossary the
 *   in-hazard card faces already draw from, so the two stay in sync
 *   for free.
 *
 * Voice: title in uppercase mono / gothic, body in lowercase
 * chronicle (IM Fell English), footnote in mono for engine numbers.
 * Mirrors `event.engine.ts::preludeChrome` convention.
 */

import { HAZARD_KEYWORDS, lookupEffect } from '@mechanics';

import { getCombatCardById } from '@/state/selectors/combat-cards';
import type { AppStoreState } from '@/state/store';

export type TooltipKind =
    | 'stat'
    | 'alignment'
    | 'affliction'
    | 'blessing'
    | 'effect'
    | 'stance-chip'
    | 'card'
    | 'hazard-keyword'
    | 'slot'
    | 'burden'
    | 'item-stat'
    | 'chronicle-entry'
    | 'quest-objective'
    | 'map-node'
    | 'disabled-action';

/**
 * Stat-stance accent for tooltip tinting (Phase 75 follow-up,
 * user-jot 2026-05-24). Maps each base stat / stance to a palette
 * key the primitive resolves to a colour. `'neutral'` is the
 * default — used for content with no clear stat tie (Tick A
 * `kind: 'stat'`, `kind: 'stance-chip'`).
 */
export type TooltipAccent = 'heart' | 'body' | 'mind' | 'neutral';

export interface TooltipContent {
    title: string;
    body: string;
    footnote?: string;
    /** Optional palette tint; primitive defaults to 'neutral'. */
    accent?: TooltipAccent;
}

const STAT_CONTENT: Record<string, TooltipContent> = {
    HEART: {
        title: 'HEART',
        body: "the will to stay with what's difficult. governs grace, willpower, and the heart-stance damage curve.",
        footnote: '+1 grace per defend at heart stance',
        accent: 'heart',
    },
    BODY: {
        title: 'BODY',
        body: 'the weight you carry in the world. governs hp, physical attack, defense, and body-stance damage curves.',
        footnote: '+1 hp per body point',
        accent: 'body',
    },
    MIND: {
        title: 'MIND',
        body: 'the discipline of attention. governs focus, card cost recovery, and mind-stance damage curves.',
        footnote: '+1 focus per mind point',
        accent: 'mind',
    },
};

const STANCE_CHIP_CONTENT: Record<string, TooltipContent> = {
    adv: {
        title: 'ADVANTAGE',
        body: 'roll twice this exchange, keep the higher value.',
        footnote: 'your stance counters theirs',
    },
    dis: {
        title: 'DISADVANTAGE',
        body: 'roll twice, keep the lower value.',
        footnote: 'your stance falls to theirs',
    },
};

// Phase 95 — disabled action button tooltips. Keys match ActionKey
// values from the combat presenter (`item` initially, extensible
// for other disabled actions if needed later).
const DISABLED_ACTION_CONTENT: Record<string, TooltipContent> = {
    item: {
        title: 'ITEM UNAVAILABLE',
        body: 'Item usage will be available in a future update. Currently no usable items in inventory.',
        accent: 'neutral',
    },
};

// Phase 74 follow-up — memoir walkthrough Tick 2: chronicle +
// quest-status content. Two branches authored in one go since both
// surface on the memoir screen.
//
// Chronicle ids are the 4 engine event types the mapper recognises
// (per `state/presenters/memoir.engine.ts::ChronicleEntry`).
const CHRONICLE_CONTENT: Record<string, TooltipContent> = {
    'combat:ended': {
        title: 'COMBAT · ENDED',
        body: 'a fight resolved one way or another. the body records the outcome — victory, parley, defeat — and the foe who delivered it.',
        footnote: 'engine: combat:ended',
    },
    'character:levelup': {
        title: 'ASCENT',
        body: 'enough experience accumulated to cross a level threshold; you levelled up and gained stat-allocation points.',
        footnote: 'engine: character:levelup',
    },
    'world:moved': {
        title: 'STEP TAKEN',
        body: 'you walked from one node to another on the map. the chronicle keeps the latest passage so the route is not forgotten.',
        footnote: 'engine: world:moved',
    },
    'dialogue:applied': {
        title: 'WORDS EXCHANGED',
        body: 'a dialogue choice landed and its consequence applied — flag set, alignment shifted, item given, threshold crossed.',
        footnote: 'engine: dialogue:applied',
    },
};

// Quest-status ids — interpreted as the 3 status buckets the
// memoir screen groups quests under, not per-objective text
// (objectives are already self-describing).
const QUEST_OBJECTIVE_CONTENT: Record<string, TooltipContent> = {
    active: {
        title: 'ACTIVE QUEST',
        body: 'a thread you are currently pulling on. complete each objective to advance; consequences may carry forward into the world.',
        footnote: 'progress lives in player.quests',
    },
    completed: {
        title: 'COMPLETED QUEST',
        body: 'every objective met. the quest stays on the page as a record of what was done; rewards have already applied.',
        footnote: 'no further objectives',
    },
    failed: {
        title: 'FORGOTTEN QUEST',
        body: 'a thread you let slip — the window for it closed, or you chose against it. it lingers here as memoir, not as work.',
        footnote: 'cannot be resumed',
    },
};

// Phase 74 follow-up — exploration walkthrough Tick 1: map-node
// content. Keys match the 8 NodeType variants emitted by the
// exploration presenter (`encounter | treasure | boss | quest |
// rest | gather | hazard | current`). Each entry: uppercased title + short
// description of what happens when the node is engaged.
const MAP_NODE_CONTENT: Record<string, TooltipContent> = {
    encounter: {
        title: 'ENCOUNTER',
        body: 'a hostile presence stands between you and the next step. step in and the seal closes; fight, parley, or fall.',
        footnote: 'commits combat',
    },
    boss: {
        title: 'BOSS',
        body: 'a named foe — bigger threat, bigger reward. the seal still closes; you cannot flee a boss seal.',
        footnote: 'no retreat',
    },
    treasure: {
        title: 'TREASURE',
        body: 'something left behind for the careful. pick through it; items go to inventory.',
        footnote: 'no combat',
    },
    quest: {
        title: 'QUEST',
        body: 'a thread of story to be picked up — a dialogue, a marker, sometimes both. consequences carry forward.',
        footnote: 'opens dialogue',
    },
    rest: {
        title: 'REST',
        body: 'a place to mend. recover hp + clear short-duration effects without leaving the map.',
        footnote: 'no combat',
    },
    gather: {
        title: 'GATHER',
        body: 'forage, scavenge, salvage. yields are small but reliable; one of the cheaper ways to refill consumables.',
        footnote: 'no combat',
    },
    hazard: {
        title: 'HAZARD',
        body: 'the ground itself turns against you. a short minigame — read the route, brave it, and you pass; falter and it costs vitae.',
        footnote: 'no combat · costs vitae',
    },
    blacksmith: {
        title: 'THE ANVIL',
        body: 'a smith for your dice. pay to hone a face, temper a payload, or swap gear; the forge takes coin and gives no refunds.',
        footnote: 'no combat · costs coin',
    },
    village: {
        title: 'VILLAGE',
        body: 'a haven of roofs and wares. trade, sell, and hear what the settled know; nothing here bites — yet.',
        footnote: 'no combat',
    },
    current: {
        title: 'HERE',
        body: 'where you stand. tap an adjacent node to step toward it.',
        footnote: 'your current position',
    },
};

// Phase 74 follow-up — inventory walkthrough Tick 1: burden bar
// content. Single id ('burden') keys the inventory burden tooltip.
const BURDEN_CONTENT: Record<string, TooltipContent> = {
    burden: {
        title: 'BURDEN',
        body: 'the weight of what you carry, in stones. high burden slows you and saps endurance; over the cap, what you carry begins to wear on you.',
        footnote: 'shed gear to lighten',
    },
};

// Phase 74 follow-up walkthrough Tick 3 — equipment slot content.
// Keys match the Phase-18 engine `EquipmentSlot` kinds (`weapon | armor |
// accessory`). SELF equipment cells pass the slotKey verbatim as the tooltip
// id; "accessory" stays the engine key (the chrome label "Trinket" lives on
// the row, not the tooltip lookup). The legacy head/body/hands/feet slots
// folded into armor (torso) and accessory (worn kinds) in Phase 18.
const SLOT_CONTENT: Record<string, TooltipContent> = {
    weapon: {
        title: 'WEAPON',
        body: 'sword, ledger, censer, voice. the thing you bring to the exchange — primary contributor to physical attack and the action verb.',
    },
    armor: {
        title: 'ARMOR',
        body: 'harness, surcoat, ritual mantle — everything worn on the torso. raw defense; the heaviest single item the burden bar feels.',
    },
    accessory: {
        title: 'TRINKET',
        body: 'helms, gauntlets, boots, rings, charms — three interchangeable worn things. small numbers; sometimes the only place a particular blessing or sigil appears.',
    },
};

// Phase 74 follow-up walkthrough Tick 2 — alignment axis content.
// Keys match `AlignmentAxisKey` in `state/presenters/character.engine.ts`
// (`'epistemology' | 'outlook' | 'scope'`); SELF axis chips pass
// the axisKey verbatim as the tooltip id. Each entry explains what
// the axis measures + the bucket-direction convention.
const ALIGNMENT_CONTENT: Record<string, TooltipContent> = {
    epistemology: {
        title: 'CREED',
        body: 'what you take on trust. low leans on faith; high demands what can be shown.',
        footnote: 'low ← faith · mid ← doubt · high → evidence',
    },
    outlook: {
        title: 'AUGURY',
        body: 'the omen you read in your own days. low reads dread; high reads hope.',
        footnote: 'low ← dread · mid ← endurance · high → hope',
    },
    scope: {
        title: 'TROTH',
        body: 'whom your conduct is pledged to. low keeps troth with the self; high keeps troth with the dead saints.',
        footnote: 'low ← self · mid ← kin · high → saints',
    },
    // Memoir walkthrough Tick 1 — two derived alignment chips read
    // from `state.moralMeter` + `player.baseStats`. Bands ladder
    // from IN ARREARS / INDIFFERENT / IN GRACE for moral (Phase 44h —
    // spec 34 §6.1); from HEART/BODY/MIND for the bent (dominant base
    // stat, ties land in 'UNDECLARED').
    moral: {
        title: 'GRACE',
        body: 'where your mercy and cruelty leave you with the Parish. each choice nudges the account; the band on this chip is what the Parish currently reads.',
        footnote: 'in arrears ← indifferent → in grace',
    },
    philosophical: {
        title: 'THE BENT',
        body: 'which of the three base stats — heart, body, mind — leads the others. the dominant stat colours how the world reads you; ties leave you undeclared.',
        footnote: 'derived from base stats · ties → undeclared',
    },
};

// ---------------------------------------------------------------------------
// Effect payload formatter (Phase 75 follow-up).
//
// User-jot 2026-05-24 asked for the combat tooltip to drop the
// engine description and surface just "Name + the effect on the
// stats". The helpers below format an Effect.payload into the
// shortest line that still names what changed and by how much.
// ---------------------------------------------------------------------------

interface EffectPayloadLike {
    damageOverTime?: { damagePerRound: number; damageType: string };
    regeneration?: { healthPerRound?: number };
    actionRestriction?: { forcedStance?: string; blockedStances?: string[]; skipTurn?: boolean };
    advantageModifier?: { grantAdvantage?: string[]; grantDisadvantage?: string[] };
    rollModifier?: number;
    defenseModifier?: number;
    reflectDamage?: number;
}

function sign(n: number): string {
    if (n > 0) return `+${n}`;
    if (n < 0) return `${n}`;
    return '0';
}

/**
 * Derive the accent from a stance key. The bare stances
 * `'heart' | 'body' | 'mind'` map to themselves; anything else returns
 * `'neutral'`. (The `physical*` / `mental*` / `emotional*` stat prefixes it
 * also mapped were deleted with `EffectStatTarget` in TRIM THE FAT T2a.)
 */
export function accentForStat(stat: string): TooltipAccent {
    if (stat === 'heart' || stat === 'body' || stat === 'mind') return stat;
    return 'neutral';
}

/**
 * Format `Effect.payload` as a short stat-effect line. Picks the
 * single most-informative summand (regeneration first, then DOT, then action restriction, then roll /
 * defense / reflect modifiers). Returns the engine `description`
 * fallback when no payload data is present — defensive only;
 * Tier-1+ engine effects all carry payload.
 */
export function formatEffectStatEffect(
    payload: EffectPayloadLike | undefined,
    fallback: string,
): string {
    if (!payload) return fallback;
    if (payload.regeneration?.healthPerRound !== undefined) {
        return `${sign(payload.regeneration.healthPerRound)} hp / round`;
    }
    if (payload.damageOverTime !== undefined) {
        return `${sign(-payload.damageOverTime.damagePerRound)} hp / round`;
    }
    if (payload.actionRestriction?.skipTurn) {
        return 'skip turn';
    }
    if (payload.actionRestriction?.forcedStance) {
        return `forced ${payload.actionRestriction.forcedStance} stance`;
    }
    if (payload.advantageModifier?.grantAdvantage?.length) {
        const list = payload.advantageModifier.grantAdvantage.join(' / ');
        return `advantage on ${list}`;
    }
    if (payload.advantageModifier?.grantDisadvantage?.length) {
        const list = payload.advantageModifier.grantDisadvantage.join(' / ');
        return `disadvantage on ${list}`;
    }
    if (payload.rollModifier !== undefined && payload.rollModifier !== 0) {
        return `${sign(payload.rollModifier)} to rolls`;
    }
    if (payload.defenseModifier !== undefined && payload.defenseModifier !== 0) {
        return `${sign(payload.defenseModifier)} defense`;
    }
    if (payload.reflectDamage !== undefined && payload.reflectDamage !== 0) {
        return `reflects ${payload.reflectDamage} damage`;
    }
    return fallback;
}

/**
 * Phase 74 follow-up — inventory walkthrough Tick 2: item-stat tooltip
 * synthesizer. The only stat keys left are the bare stances (`heart`,
 * `body`, `mind`), which reuse the `kind:'stat'` copy. The derived
 * `<dimension><Verb>` keys and `luck` it used to synthesize were deleted
 * with those stats in TRIM THE FAT T2a.
 *
 * Returns `null` for unknown keys so the chip stays silent.
 */
function synthesizeItemStatContent(id: string): TooltipContent | null {
    if (id === 'heart' || id === 'body' || id === 'mind') {
        return STAT_CONTENT[id.toUpperCase()] ?? null;
    }
    return null;
}

/** Derive the accent for an effect from its DoT stance, if any. */
function accentForEffect(payload: EffectPayloadLike | undefined): TooltipAccent {
    if (!payload) return 'neutral';
    if (payload.damageOverTime?.damageType) return accentForStat(payload.damageOverTime.damageType);
    return 'neutral';
}

export function selectTooltipContentFor(
    kind: TooltipKind,
    id: string,
    // Reserved for kinds that need live state (effect-attribution,
    // alignment readings, codex entries). Current authored kinds
    // read engine static data only, so state is unused — keeping
    // the signature stable means future ticks don't have to
    // retrofit every call site.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _state: AppStoreState,
): TooltipContent | null {
    if (kind === 'stat') {
        return STAT_CONTENT[id] ?? null;
    }
    if (kind === 'stance-chip') {
        return STANCE_CHIP_CONTENT[id] ?? null;
    }
    if (kind === 'alignment') {
        return ALIGNMENT_CONTENT[id] ?? null;
    }
    if (kind === 'slot') {
        return SLOT_CONTENT[id] ?? null;
    }
    if (kind === 'burden') {
        return BURDEN_CONTENT[id] ?? null;
    }
    if (kind === 'map-node') {
        return MAP_NODE_CONTENT[id] ?? null;
    }
    if (kind === 'chronicle-entry') {
        return CHRONICLE_CONTENT[id] ?? null;
    }
    if (kind === 'quest-objective') {
        return QUEST_OBJECTIVE_CONTENT[id] ?? null;
    }
    if (kind === 'item-stat') {
        return synthesizeItemStatContent(id);
    }
    if (kind === 'effect') {
        if (!id) return null;
        const def = lookupEffect(id);
        if (!def) return null;
        // Phase 75 follow-up (user-jot 2026-05-24): drop the
        // engine description; render just the stat-effect line.
        // The `description` is kept only as a defensive fallback
        // when payload introspection finds nothing usable (Tier-1
        // engine effects always carry payload, so this is rare).
        const body = formatEffectStatEffect(
            def.payload as EffectPayloadLike | undefined,
            def.description,
        );
        return {
            title: def.name.toUpperCase(),
            body,
            accent: accentForEffect(def.payload as EffectPayloadLike | undefined),
        };
    }
    if (kind === 'card') {
        if (!id) return null;
        const card = getCombatCardById(id);
        if (!card) return null;
        return {
            title: card.name,
            body: card.description,
            footnote: `stance ${card.stance.toUpperCase()}`,
            accent: accentForStat(card.stance),
        };
    }
    if (kind === 'hazard-keyword') {
        if (!id) return null;
        const kw = HAZARD_KEYWORDS[id as keyof typeof HAZARD_KEYWORDS];
        if (!kw) return null;
        return {
            title: kw.name,
            body: kw.desc,
            accent: 'neutral',
        };
    }
    if (kind === 'disabled-action') {
        return DISABLED_ACTION_CONTENT[id] ?? null;
    }
    // All other kinds: no content authored yet — return null so
    // the caller can render nothing without crashing.
    return null;
}
