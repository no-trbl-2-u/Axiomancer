/**
 * Screen-level presenter for `app/event` (full-screen modal).
 *
 * Composes `EventViewModel` from the mobile event slice
 * (`state.event.pending` + `state.event.dialogueCursor`) populated by
 * `eventActions.resolveCurrentMapEvent()` after `resolveMapEvent(state)`.
 * Two VM kinds drive screen behaviour: `'combat-prelude'` (foe intro
 * -> startCombat) and `'narrative-choice'` (prose + choices ->
 * applyDialogue or auto-resolve).
 *
 * Spec 08 product Qs locked (still binding after the 0.7.0 migration):
 *   Q1 = A (two kinds), Q2 = C (both description + machine-readable
 *   consequences), Q3 = B (mobile-local slug -> asset, see
 *   event-assets.ts), Q4 = Future spec (mid-combat events deferred),
 *   Q5 = Yes (skip affordance over long bodies).
 *
 * Engine-side surface (`axiomancer-mechanics@0.7.0`): pure
 * `resolveMapEvent(state)` returns `{ state, event }` where `event`
 * is a `ResolvedEvent` union over 8 kinds + 'none' (see
 * `node_modules/axiomancer-mechanics/dist/World/MapEvents/types.d.ts`).
 */

import type {
    ActiveEffect,
    DialogueChoice,
    DialogueNode,
    DialogueTree,
    Encounter,
    Item,
    NPC,
    ResolveMapEventResult,
    ResolvedEvent,
} from 'axiomancer-mechanics';
import { getDialogueNode, visibleChoices } from 'axiomancer-mechanics';

import type { AppStoreState } from '../store';
import {
    defaultBodyForEvent,
    selectEventArtSlug,
    type EventArtSlug,
} from './event-assets';
import { freezeViewModel } from './freeze';
import { toRomanLower } from './roman';

export type EventKind = 'combat-prelude' | 'narrative-choice';
// Phase 137 cleanup: the 'rest' / 'gather' variants left with their
// kinds — those events launch minigames and never reach this VM.
export type EventVariant = 'encounter' | 'boss' | 'quest' | 'npc';
export type ChoiceAccentKey = 'blood' | 'sulfur' | 'parchment' | 'bone' | 'rust';

export type ConsequenceKind =
    | 'damage'
    | 'heal'
    | 'currency'
    | 'item'
    | 'flag'
    | 'moral'
    | 'quest-start'
    | 'quest-progress'
    | 'skill-learn';

export interface EventConsequence {
    kind: ConsequenceKind;
    amount?: number;
    label?: string;
}

export interface EventChoice {
    /** Stable choice id. For combat-prelude: `'fight'` | `'flee'`. For dialogue: index into `visibleChoices(node, ctx)` as a string (Phase 60c — engine flattened DialogueChoice). */
    id: string;
    label: string;
    description: string;
    consequences: ReadonlyArray<EventConsequence>;
    iconKey: string;
    accentKey: ChoiceAccentKey;
    enabled: boolean;
    /**
     * Chrome subtitle rendered below the button label (italic, bone-
     * color, smaller font). Ports the design's `'ix · vi vitae ·
     * adv. unknown'`-style cost/consequence preview from
     * `prototype.jsx:481-489` (combat shell) + `:522-531` (paced
     * shell). `null` when no subtitle should render (default for
     * narrative-choice dialogue branches; combat-prelude populates
     * via the enemy-stats / morale ritual lines below).
     *
     * Distinct from `description` (which is the deeper "Combat ·
     * turns" / "Luck Save" line the modal sometimes ships above
     * the button) and from `consequences` (the structured kind /
     * amount data the engine reads for actual effects). Subtitle is
     * pure chrome.
     */
    subtitle: string | null;
    /**
     * Plain-language decode of the lore subtitle, rendered beneath
     * the ritual-register subtitle in parchment mono. Translates
     * Roman numerals and jargon into readable game terms so new
     * players can parse the cost without memorizing the notation.
     * `null` when no decode should render.
     */
    decode: string | null;
}

/**
 * Combat-prelude chrome strings, populated only on `kind: 'combat-prelude'`
 * VMs. Phase 32 (Claude Design handoff, 2026-05-16) ported the prototype's
 * encounter-modal seam — header strip (red triangle + ENCOUNTER eyebrow),
 * diagonal "STRIFE STIRS" sash overlaying the illustration, plus the
 * non-dismissible SEALED · NO RETREAT chain bars and the FLEE-disabled
 * hint added in pass-7/8 chrome lifts. Routing the four chrome strings
 * (eyebrow, sash, seal-bar, flee-disabled hint) through the VM keeps
 * the view layer free of inline literals per Hard Rule #8 — the screen
 * reads `vm.preludeChrome` and paints if set, or returns null when the
 * field is null (narrative-choice variants).
 */
export interface PreludeChrome {
    /** Eyebrow text rendered in the header strip above the illustration. */
    eyebrow: string;
    /** Label on the diagonal sash overlaying the illustration top-left. */
    sashLabel: string;
    /**
     * Chain-bar label rendered top + bottom of the encounter modal
     * overlay (`SEALED · NO RETREAT`). The diegetic irreversible-
     * commitment signal — see `components/event/EncounterModalOverlay.tsx`
     * (Phase 32 sub-tick D port; chats/chat1.md).
     */
    sealLabel: string;
    /**
     * Hint rendered beneath the FLEE button when the choice is
     * disabled (typically on boss encounters where the engine event
     * VM marks the flee choice `enabled: false`). Single source of
     * truth for the "no retreat" copy across modal variants.
     */
    fleeDisabledHint: string;
    /**
     * One-doom-grammar pass — the grim hopeless line every threat
     * modal carries (matches the hazard danger intro's register),
     * always ending on the player's only out: "Unless…". Rendered in
     * italic between the body prose and the choice rows.
     */
    doomLine: string;
}

/**
 * General event-screen chrome strings constant across every variant.
 * Lifted onto the VM by /iterate (2026-05-16, addressing CRITIQUE pass 6
 * HIGH finding) so the screen reads `vm.chrome.*` instead of carrying
 * inline display literals per Hard Rule #8. Same pattern as pass 5's
 * drains for combat.tsx, exploration drawer, inventory headers, and
 * character empty-effects.
 */
export interface EventChrome {
    /** Section eyebrow above the choice list. Active-state only. */
    reckoningEyebrow: string;
    /** Label on the skip affordance over long prose. */
    skipLabel: string;
    /** Empty-state back-row primary label. */
    emptyBackLabel: string;
    /** Empty-state back-row secondary label (under primary). */
    emptyBackSub: string;
}

export const EVENT_CHROME: EventChrome = {
    reckoningEyebrow: '✠ A RECKONING',
    skipLabel: 'SKIP ›',
    emptyBackLabel: 'BACK',
    emptyBackSub: 'RETURN',
};

/**
 * Single source of truth for the non-boss encounter label that the
 * prelude eyebrow and the badge BOTH derive from. CRITIQUE pass 6 MED
 * flagged the duplicate literal: `withPreludeChrome` and
 * `composeCombatPrelude` previously hard-coded `'ENCOUNTER'` separately,
 * with no test pinning them together, so a copy edit on one would have
 * silently drifted from the other. Centralizing here makes the
 * relationship explicit and lets a single test (in
 * `state/e2e/event.engine.test.ts`) pin both call sites.
 */
export const ENCOUNTER_LABEL = 'ENCOUNTER';

export interface EventViewModel {
    kind: EventKind;
    variant: EventVariant;
    artSlug: EventArtSlug;
    /**
     * Enemy id (e.g. `"enemy-coastal-tyrant"`) for bespoke combat-prelude
     * art routing. Present only on combat-prelude variants; the art layer
     * maps it to an archetype illustration (see `enemy-art`).
     */
    enemyArtKey?: string | null;
    badge: string;
    badgeAccentKey: ChoiceAccentKey;
    title: string;
    subtitle: string;
    body: string;
    choices: ReadonlyArray<EventChoice>;
    lore: string | null;
    /** True iff the screen should show a skip affordance over long prose. */
    canSkip: boolean;
    /** Populated only on combat-prelude variants. `null` for narrative-choice. */
    preludeChrome: PreludeChrome | null;
    /** General chrome strings (eyebrow, skip, empty-state back). Constant across variants. */
    chrome: EventChrome;
    /**
     * Map node type that triggered this event (`'quest'`, `'rest'`,
     * `'treasure'`, etc.). Passed through from the mobile event slice
     * so the modal can apply quest-source visual treatment even when
     * the engine resolves to a generic kind (loot-cache, interaction…).
     * `null` when the event was not triggered from exploration or the
     * source node type was not recorded.
     */
    sourceNodeType: string | null;
}

const EMPTY_VM: EventViewModel = {
    kind: 'narrative-choice',
    variant: 'quest',
    artSlug: 'interaction-generic',
    badge: 'NO EVENT',
    badgeAccentKey: 'bone',
    title: 'NO EVENT IN PROGRESS',
    subtitle: '',
    body: 'the world is still.',
    choices: [],
    lore: null,
    canSkip: false,
    preludeChrome: null,
    chrome: EVENT_CHROME,
    sourceNodeType: null,
};

/**
 * True when an event is currently pending and the modal should be
 * shown. Returns `false` when the slice is empty or the pending event
 * kind is `'none'` (engine signal that the node had no event).
 */
export function selectHasActiveEvent(state: AppStoreState): boolean {
    const slice = state.event;
    if (!slice || slice.pending === null) return false;
    if (slice.pending.event.kind === 'none') return false;
    return true;
}

/**
 * Returns `true` when the engine has an active event AND that event
 * is a **paced** (narrative-choice) one — the kind that renders as a
 * full-screen `/event` route. Combat-adjacent events
 * (`'combat-prelude'`) render in-place via `<EncounterModalOverlay>`
 * over the exploration map and must NOT route to the full-screen
 * shell; the `EventGate` reads this selector instead of the broader
 * `selectHasActiveEvent` to keep the two shells from mounting
 * simultaneously.
 *
 * Filed via Phase 40 (event-shell distinction audit, 2026-05-19).
 * Before this split, `EventGate` pushed `/event` on every active
 * event, which produced a "double-mount" race when a combat-prelude
 * fired: both the in-place modal and the full-screen route would
 * appear at once.
 */
export function selectHasActivePacedEvent(state: AppStoreState): boolean {
    if (!selectHasActiveEvent(state)) return false;
    const vm = selectEventViewModel(state);
    return vm.kind === 'narrative-choice';
}

/** Route targets for paced events (Phase 137 dedicated screens). */
export type PacedEventRoute = '/event' | '/village' | '/dialogue' | '/cutscene';

/**
 * Which full-screen route the active paced event should mount.
 * Phase 137 gave interaction / village / cutscene dedicated screens;
 * everything else paced keeps the generic `/event` shell. Returns
 * `null` when no paced event is active (rest / loot-cache / quest /
 * hazard / gathering never reach the event slice anymore — their
 * interceptors start minigame sessions instead).
 */
export function selectPacedEventRoute(state: AppStoreState): PacedEventRoute | null {
    if (!selectHasActivePacedEvent(state)) return null;
    const kind = state.event.pending?.event.kind;
    if (kind === 'interaction') return '/dialogue';
    if (kind === 'village') return '/village';
    if (kind === 'cutscene') return '/cutscene';
    if (kind === 'narration') return '/dialogue';
    return '/event';
}

/**
 * Returns `true` when the engine has an active **combat-adjacent**
 * event (kind `'combat-prelude'`) — the kind that mounts
 * `<EncounterModalOverlay>` over the map. The tab layout consumes
 * this OR `useCombatMode().inCombat` to flip the WILDS/STRIFE
 * positional slot to STRIFE early — while the encounter modal is
 * up, before the player commits FIGHT. Mirrors the design's
 * prototype.jsx:42 `combatTabShown = route === 'strife' ||
 * modal?.kind === 'event-combat'`. Phase 42 port (2026-05-19).
 */
export function selectHasActiveCombatPrelude(state: AppStoreState): boolean {
    if (!selectHasActiveEvent(state)) return false;
    const vm = selectEventViewModel(state);
    return vm.kind === 'combat-prelude';
}

/**
 * Phase 32 design-handoff port (2026-05-16): backfill `preludeChrome`
 * on a freshly-composed VM so each `composeX` function can stay
 * focused on its own concerns. Combat-prelude variants get the
 * "STRIFE STIRS" sash + ENCOUNTER / BOSS · ENCOUNTER eyebrow; every
 * other kind gets `null`. The strings live here (presenter), not in
 * the screen, per Hard Rule #8.
 */
function withPreludeChrome(vm: Omit<EventViewModel, 'preludeChrome' | 'sourceNodeType'>): Omit<EventViewModel, 'sourceNodeType'> {
    if (vm.kind !== 'combat-prelude') {
        return { ...vm, preludeChrome: null };
    }
    return {
        ...vm,
        preludeChrome: {
            eyebrow: vm.variant === 'boss' ? `BOSS · ${ENCOUNTER_LABEL}` : ENCOUNTER_LABEL,
            sashLabel: 'STRIFE STIRS',
            sealLabel: 'SEALED · NO RETREAT',
            fleeDisabledHint: 'no retreat from this one.',
            doomLine:
                vm.variant === 'boss'
                    ? 'This is the thing the road was leading to. It has ended every pilgrim it has met, and it will end him the same — without hurry, without malice. Unless…'
                    : 'It has done this before. The ditch beside the road is full of those it did it to. He will not be the exception. Unless…',
        },
    };
}

function withSourceNodeType(vm: Omit<EventViewModel, 'sourceNodeType'>, sourceNodeType: string | null): EventViewModel {
    return { ...vm, sourceNodeType };
}

/**
 * Stamp the constant `chrome` block onto compose results. Sibling of
 * `withPreludeChrome`. Both wrappers run on every active VM so the
 * compose functions can stay focused on per-event composition without
 * touching chrome strings.
 */
function withChrome(
    vm: Omit<EventViewModel, 'preludeChrome' | 'chrome' | 'sourceNodeType'>,
): Omit<EventViewModel, 'preludeChrome' | 'sourceNodeType'> {
    return { ...vm, chrome: EVENT_CHROME };
}

// Referential-stability memo (1-entry), mirroring the sibling memo in
// `exploration.engine.ts::selectExplorationViewModel`. `useGameState`
// subscribes via Zustand `useStore`, whose `getSnapshot` is the bare
// selector call — React's `useSyncExternalStore` then requires a STABLE
// reference for unchanged state, or it loops ("getSnapshot should be
// cached → Maximum update depth exceeded"). The empty-state path returns
// the frozen `EMPTY_VM` singleton, but every active-event path composes a
// fresh frozen VM, so a direct subscriber (e.g. the exploration screen's
// `useGameState(selectEventViewModel)`, which mounts `<EncounterModalOverlay>`)
// would re-render forever once an event resolved. We cache the computed VM
// against the immutable slices it reads — `event`, `combat`, `quests`,
// `flags` — which Zustand replaces only when they actually change. These
// are exactly the deps the `/event` screen already memoizes on.
let _evtEventRef: unknown;
let _evtQuestsRef: unknown;
let _evtFlagsRef: unknown;
let _evtVm: EventViewModel | null = null;

/**
 * Returns the event view-model. When no event is active, returns the
 * empty-state VM (the screen shows "no event in progress").
 */
export function selectEventViewModel(state: AppStoreState): EventViewModel {
    if (
        _evtVm !== null &&
        state.event === _evtEventRef &&
        state.quests === _evtQuestsRef &&
        state.flags === _evtFlagsRef
    ) {
        return _evtVm;
    }
    const vm = computeEventViewModel(state);
    _evtEventRef = state.event;
    _evtQuestsRef = state.quests;
    _evtFlagsRef = state.flags;
    _evtVm = vm;
    return vm;
}

function computeEventViewModel(state: AppStoreState): EventViewModel {
    if (!selectHasActiveEvent(state)) {
        return freezeViewModel(EMPTY_VM);
    }
    const slice = state.event;
    const result = slice.pending as ResolveMapEventResult;
    const resolved = result.event;
    const sourceNodeType = slice.sourceNodeType;

    if (resolved.kind === 'encounter') {
        return freezeViewModel(
            withSourceNodeType(
                withPreludeChrome(withChrome(composeCombatPrelude(resolved.encounter, resolved.isBoss))),
                sourceNodeType,
            ),
        );
    }

    // Dialogue cursor takes precedence when walking an NPC tree.
    if (slice.dialogueCursor !== null) {
        return freezeViewModel(
            withSourceNodeType(
                withPreludeChrome(
                    withChrome(composeNpcDialogue(slice.dialogueCursor.tree, slice.dialogueCursor.nodeId, state)),
                ),
                sourceNodeType,
            ),
        );
    }

    return freezeViewModel(
        withSourceNodeType(
            withPreludeChrome(withChrome(composeNarrative(resolved))),
            sourceNodeType,
        ),
    );
}

// -- composition helpers -----------------------------------------------------

/**
 * Boss subtitle fallback when `enemy.description` is empty (which the
 * Enemy type says shouldn't happen, but be defensive). Rotates over
 * the player-facing level so repeat encounters at the same tier still
 * read consistently but different tiers each get their own omen.
 */
const BOSS_OMEN_BY_LEVEL: readonly string[] = [
    'first seal · first sigh',
    'second seal · waking',
    'third seal · the hush',
    'fourth seal · third sigh',
    'fifth seal · the long count',
];

// Lowercase-Roman helper consolidated into `./roman` (close
// `[3.0]` engine-dup audit row). The earlier "duplicate of
// combat.engine.ts::toRoman" was self-acknowledged in the
// doc-block on this surface; both call sites now import from the
// shared util.

function composeCombatPrelude(encounter: Encounter, isBoss: boolean): Omit<EventViewModel, 'preludeChrome' | 'chrome' | 'sourceNodeType'> {
    // Phase 60b — engine's canonical `Encounter` shape is
    // `{ enemies: Enemy[], origin?: string }`. The prelude
    // consumes the first enemy (combat is single-enemy today).
    // The earlier `as any` cast (closed via [2.5] event-audit
    // row 4) dated back to Phase 60b's migration; engine
    // `Encounter` exposes `.enemies` directly today.
    const enemy = encounter.enemies[0];
    const badge = isBoss ? 'OMEN OF DOOM' : ENCOUNTER_LABEL;
    // Phase 43 port: boss encounters swap FIGHT/FLEE labels for
    // STRIKE/KNEEL per the design's chat-1 spec ("KNEEL / STRIKE for
    // boss"). Choice IDs stay 'fight' / 'flee' so the screen's
    // existing handlers (onFight/onFlee) still dispatch correctly —
    // KNEEL is semantically engine-equivalent to FLEE today (still
    // disabled on bosses; no engine-side "kneel to a boss" mechanic
    // exists yet), but the label honors the design's intent that the
    // ritual register differs from a regular encounter's
    // fight-or-flee binary.
    // Phase 45 port: chrome subtitles under each action button (the
    // italic cost/consequence preview from prototype.jsx:481-489 +
    // :486-489 — 'ix · vi vitae · adv. unknown' on FIGHT, 'forfeit
    // the path · -ii morale' on FLEE). Lowercase-roman cost line +
    // ritual-register kicker. Boss variant tightens the kicker
    // since the engine's boss-blocks-flee rule is part of the
    // design intent (KNEEL is sealed, not a real choice).
    const fightSubtitle = `${toRomanLower(enemy.level)} · ${toRomanLower(enemy.health)} vitae · adv. unknown`;
    const fleeSubtitle = isBoss
        ? 'sealed · no retreat'
        : 'forfeit the path · -ii morale';

    const choices: EventChoice[] = [
        {
            id: 'fight',
            label: isBoss ? 'STRIKE' : 'FIGHT',
            description: isBoss ? 'Combat · BOSS' : 'Combat · turns',
            consequences: [],
            iconKey: 'sword',
            accentKey: 'blood',
            enabled: true,
            subtitle: fightSubtitle,
            decode: `Lv ${enemy.level} foe · ${enemy.health} HP · advantage not yet scouted`,
        },
        {
            id: 'flee',
            label: isBoss ? 'KNEEL' : 'FLEE',
            description: isBoss ? 'Submission · sealed' : 'Luck Save',
            consequences: [],
            iconKey: 'flee',
            accentKey: 'bone',
            enabled: !isBoss,
            subtitle: fleeSubtitle,
            decode: isBoss ? null : 'Give up this node · spend 2 Morale',
        },
    ];
    let subtitle: string;
    if (isBoss) {
        const description = enemy.description?.trim() ?? '';
        if (description.length > 0) {
            subtitle = description;
        } else {
            const idx = Math.max(0, (enemy.level - 1) % BOSS_OMEN_BY_LEVEL.length);
            subtitle = BOSS_OMEN_BY_LEVEL[idx] ?? 'fourth seal · third sigh';
        }
    } else {
        subtitle = 'something stirs';
    }
    return {
        kind: 'combat-prelude',
        variant: isBoss ? 'boss' : 'encounter',
        artSlug: isBoss ? 'boss' : 'encounter',
        enemyArtKey: enemy.id,
        badge,
        badgeAccentKey: 'blood',
        title: enemy.name.toUpperCase(),
        subtitle,
        body: `level ${enemy.level} · ${enemy.health} hp.`,
        choices,
        lore: null,
        canSkip: false,
    };
}

function composeNpcDialogue(
    tree: DialogueTree,
    nodeId: string,
    state: AppStoreState,
): Omit<EventViewModel, 'preludeChrome' | 'chrome' | 'sourceNodeType'> {
    const node: DialogueNode = getDialogueNode(tree, nodeId);
    const activeNames: string[] = state.quests.active.map((q: { name: string }) => q.name);
    const ctx = {
        activeQuests: new Set<string>(activeNames),
        completedQuests: new Set<string>(state.quests.completed as string[]),
        flags: new Set<string>(state.flags as string[]),
    };
    const visible = visibleChoices(node, ctx);
    // Phase 60c — engine's DialogueChoice was flattened: `.id` and
    // `.label` were removed; the canonical user-facing field is
    // `.text`. Mobile derives a stable VM `id` from the choice's
    // index in `visibleChoices(node, ctx)` so the
    // `pickEventChoiceAction` lookup stays deterministic without
    // depending on a `.id` that no longer exists. The same indexing
    // shape is consumed by the action below.
    const choices: EventChoice[] = visible.map((choice, index) => ({
        id: String(index),
        label: choice.text.toUpperCase(),
        description: choice.text,
        consequences: extractDialogueConsequences(choice),
        iconKey: 'scroll',
        accentKey: 'parchment',
        enabled: true,
        subtitle: null,
        decode: null,
    }));
    const text = (node.text ?? '') as string;
    return {
        kind: 'narrative-choice',
        variant: 'npc',
        artSlug: 'interaction-generic',
        badge: 'A VOICE',
        badgeAccentKey: 'parchment',
        // Phase 60c — engine's DialogueNode dropped `.speaker`;
        // mobile falls back to the canonical 'A FIGURE' chrome
        // (already the fallback when speaker was undefined).
        title: 'A FIGURE',
        subtitle: '',
        body: text,
        choices,
        lore: null,
        canSkip: choices.length <= 1 && text.length > 240,
    };
}

function bodyFromPayload(event: ResolvedEvent): string {
    // Each MapEventPayload has an optional description; the
    // `ResolvedEvent` payload doesn't directly expose it on every
    // discriminant (kind: 'encounter' has no description; kind:
    // 'cutscene' has `lines`; others may or may not). The pure
    // mapper here returns a kind-appropriate string.
    if (event.kind === 'cutscene') {
        return event.lines.join('\n\n');
    }
    return defaultBodyForEvent(event);
}

function composeNarrative(resolved: ResolvedEvent): Omit<EventViewModel, 'preludeChrome' | 'chrome' | 'sourceNodeType'> {
    const artSlug = selectEventArtSlug(resolved);
    const body = bodyFromPayload(resolved);
    switch (resolved.kind) {
        case 'interaction':
            return composeInteraction(resolved.npcName, body, artSlug);
        case 'village':
            return composeVillage(resolved.villageName, resolved.merchants, body, artSlug);
        case 'cutscene':
            return composeCutscene(body, artSlug);
        // Dead-end kinds (Phase 137 cleanup): rest / gathering /
        // loot-cache / hazard / quest never reach the event slice —
        // `resolveCurrentMapEventAction` intercepts them and starts
        // their minigame sessions instead ("The Night Watch", "The
        // Gleaning", "The Reliquary", the hazard board, "The Boy's
        // Almanac"). 'encounter' renders through the combat-prelude
        // path before composeNarrative is reached; 'none' is guarded
        // by selectHasActiveEvent. All fall to the empty VM
        // defensively.
        case 'rest':
        case 'gathering':
        case 'loot-cache':
        case 'hazard':
        case 'quest':
        case 'encounter':
        case 'narration':
        case 'none':
            return EMPTY_VM;
    }
}

function composeInteraction(npcName: string, body: string, artSlug: EventArtSlug): Omit<EventViewModel, 'preludeChrome' | 'chrome' | 'sourceNodeType'> {
    return {
        kind: 'narrative-choice',
        variant: 'npc',
        artSlug,
        // Phase 46 port: design eyebrow 'INTERACTION' (literal,
        // chrome-shaped). Title stays as the NPC name from engine —
        // the design's 'The Wagoner' is one specimen of a generic
        // npc-name title.
        badge: 'INTERACTION',
        badgeAccentKey: 'parchment',
        title: npcName.toUpperCase(),
        subtitle: '',
        body,
        choices: [
            {
                id: 'acknowledge',
                label: 'SO BE IT',
                description: 'Continue',
                consequences: [],
                iconKey: 'scroll',
                accentKey: 'parchment',
                enabled: true,
                subtitle: null,
                decode: null,
            },
        ],
        lore: null,
        canSkip: body.length > 240,
    };
}

function composeVillage(
    villageName: string,
    merchants: ReadonlyArray<NPC>,
    body: string,
    artSlug: EventArtSlug,
): Omit<EventViewModel, 'preludeChrome' | 'chrome' | 'sourceNodeType'> {
    // Shop UI is still out of scope (was already deferred under Spec
    // 08's 'shop' kind). Render the village name + a single LEAVE
    // choice. Surface `merchants.length` in the subtitle so the
    // deferred-shop signal is visible in-VM rather than hidden behind
    // an underscore-prefixed unused arg.
    const stallCount = merchants.length;
    const subtitle =
        stallCount === 0 ? '' : stallCount === 1 ? '1 stall' : `${stallCount} stalls`;
    return {
        kind: 'narrative-choice',
        variant: 'quest',
        artSlug,
        // Phase 46 port: design eyebrow 'A SETTLEMENT' (kindToMeta
        // 'town' fallback from prototype.jsx:503).
        badge: 'A SETTLEMENT',
        badgeAccentKey: 'parchment',
        title: villageName.toUpperCase(),
        subtitle,
        body,
        choices: [
            {
                id: 'leave',
                label: 'LEAVE',
                description: 'Walk on',
                consequences: [],
                iconKey: 'flee',
                accentKey: 'bone',
                enabled: true,
                subtitle: null,
                decode: null,
            },
        ],
        lore: null,
        canSkip: body.length > 240,
    };
}

function composeCutscene(body: string, artSlug: EventArtSlug): Omit<EventViewModel, 'preludeChrome' | 'chrome' | 'sourceNodeType'> {
    return {
        kind: 'narrative-choice',
        variant: 'quest',
        artSlug,
        badge: 'A VISION',
        badgeAccentKey: 'sulfur',
        title: '',
        subtitle: '',
        body,
        choices: [
            {
                id: 'acknowledge',
                label: 'WITNESS',
                description: 'Continue',
                consequences: [],
                iconKey: 'eye',
                accentKey: 'sulfur',
                enabled: true,
                subtitle: null,
                decode: null,
            },
        ],
        lore: null,
        // Cutscenes are often long; skip is always available.
        canSkip: true,
    };
}

function extractDialogueConsequences(choice: DialogueChoice): ReadonlyArray<EventConsequence> {
    const out: EventConsequence[] = [];
    const e = choice.effect;
    if (!e) return out;
    if (e.grantCurrency) out.push({ kind: 'currency', amount: e.grantCurrency });
    if (typeof e.moralDelta === 'number' && e.moralDelta !== 0) {
        out.push({ kind: 'moral', amount: e.moralDelta });
    }
    if (e.startQuest) out.push({ kind: 'quest-start', label: e.startQuest });
    if (e.completeQuest) out.push({ kind: 'quest-progress', label: e.completeQuest });
    if (e.progressQuest) {
        out.push({
            kind: 'quest-progress',
            label: e.progressQuest.name,
            amount: e.progressQuest.amount ?? 1,
        });
    }
    if (e.teachSkill) out.push({ kind: 'skill-learn', label: e.teachSkill });
    if (e.setFlag) out.push({ kind: 'flag', label: e.setFlag });
    return out;
}
