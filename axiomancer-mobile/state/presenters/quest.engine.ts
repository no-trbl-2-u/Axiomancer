/**
 * Quest Board minigame presenter — maps the engine session
 * (`axiomancer-mechanics` World/QuestBoard) onto a render-ready
 * view-model. Pure: no store writes, no rolls, no rule decisions.
 * The screen renders this VM and dispatches store actions only.
 */

import {
    getQuestCharmDef,
    questBoardDefOf,
    questBoardTierOf,
    questVowResults,
    QUEST_BOARD_TUNING,
    QUEST_PART_KINDS,
} from '@mechanics';
import type {
    QuestBoardSession,
    QuestCharmId,
    QuestOutcomeTier,
    QuestPartKind,
    QuestSpaceKind,
    QuestSpaceResult,
    QuestVowStatus,
} from '@mechanics';
import type { AppStoreState } from '@/state/store';

// ---------------------------------------------------------------------------
// VM shapes
// ---------------------------------------------------------------------------

export interface QuestSpaceVM {
    index: number;
    id: string;
    kind: QuestSpaceKind;
    name: string;
    glyph: string;
    /** The piece stands here. */
    isPiece: boolean;
    isSlipway: boolean;
}

export interface QuestPartVM {
    kind: QuestPartKind;
    label: string;
    fitted: number;
    required: number;
    carried: number;
}

/** One cast bone, ready to render as a choice. */
export interface QuestBoneVM {
    index: number;
    die: number;
    bonus: number;
    total: number;
    target: number;
    targetKind: QuestSpaceKind;
    targetName: string;
    fitsAtSlipway: boolean;
    /** Wind the OTHER bone banks if this one is taken. */
    windLeftBehind: number;
    label: string;
    accessibilityLabel: string;
}

export interface QuestCharmVM {
    id: QuestCharmId;
    name: string;
    desc: string;
    flavor: string;
    used: boolean;
    primed: boolean;
    /** Tappable right now (idle phase, unused, unprimed). */
    usable: boolean;
}

export interface QuestVowVM {
    id: string;
    name: string;
    desc: string;
    status: QuestVowStatus;
}

export interface QuestOptionVM {
    id: string;
    label: string;
    desc: string;
    enabled: boolean;
    disabledReason: string | null;
}

export interface QuestResultVM {
    title: string;
    body: string;
    /** Die faces shown on the card (yours first). */
    rolls: readonly number[];
    /** Compact delta chips, e.g. "+2 IRON NAILS", "−1 VIGOR". */
    deltaChips: readonly string[];
}

export interface QuestPendingVM {
    kind: QuestSpaceKind;
    title: string;
    body: string;
    options: readonly QuestOptionVM[];
    result: QuestResultVM | null;
    ledger: readonly string[];
}

export interface QuestOutcomeVM {
    tier: QuestOutcomeTier;
    tierLabel: string;
    copy: string;
    daysTaken: number;
    fishLeft: number;
    vigorLeft: number;
    rolls: number;
    vowsKept: number;
    vows: readonly QuestVowVM[];
}

export interface QuestBoardVM {
    active: boolean;
    phase: QuestBoardSession['phase'] | 'none';
    boardId: string;
    title: string;
    headline: string;
    storyBeat: string;
    intro: string;
    pieceName: string;
    day: number;
    stretch: number;
    stretchesPerDay: number;
    fish: number;
    vigor: number;
    maxVigor: number;
    wind: number;
    pos: number;
    spaces: readonly QuestSpaceVM[];
    parts: readonly QuestPartVM[];
    /** 0..1 — fraction of required parts fitted. */
    boatProgress: number;
    lastRoll: { die: number; bonus: number; total: number } | null;
    /**
     * THE TWO BONES on the table, awaiting a choice (phase 'choosing').
     *
     * Each carries the space it would land on, so the player picks a
     * DESTINATION rather than a number. Empty in every other phase.
     * Before the 2026-08-08 redesign there was one bone and no choice —
     * the board was roll-and-move.
     */
    bones: readonly QuestBoneVM[];
    charms: readonly QuestCharmVM[];
    vows: readonly QuestVowVM[];
    tierPreview: QuestOutcomeTier;
    pending: QuestPendingVM | null;
    collapsedToday: boolean;
    outcome: QuestOutcomeVM | null;
}

// ---------------------------------------------------------------------------
// Glyphs & labels
// ---------------------------------------------------------------------------

export const QUEST_SPACE_GLYPHS: Record<QuestSpaceKind, string> = Object.freeze({
    slipway: '⚓',
    gather: '✦',
    duel: '⚔',
    snag: '⚠',
    hearth: '☽',
    market: '⌂',
    parley: '◉',
    cache: '◈',
    omen: '▶',
});

/** Short legend label per space kind (the "what the marks mean" key). */
export const QUEST_SPACE_KIND_LABELS: Record<QuestSpaceKind, string> = Object.freeze({
    slipway: 'SLIPWAY',
    gather: 'GATHER',
    duel: 'DUEL',
    snag: 'SNAG',
    hearth: 'HEARTH',
    market: 'MARKET',
    parley: 'PARLEY',
    cache: 'CACHE',
    omen: 'OMEN',
});

/** One-line meaning shown beneath each legend label. */
export const QUEST_SPACE_KIND_BLURBS: Record<QuestSpaceKind, string> = Object.freeze({
    slipway: 'Launch the piece; lap it to complete a day.',
    gather: 'Forage parts and fish from the shore.',
    duel: 'A fight — win to seize, lose and bleed vigor.',
    snag: 'A hazard that can drag the piece back.',
    hearth: 'Rest a while and mend vigor.',
    market: 'Trade fish for the parts you still want.',
    parley: 'Talk your way toward a boon.',
    cache: 'A found stash, free for the taking.',
    omen: 'Fate turns — a vow is put to the test.',
});

export const QUEST_TIER_LABELS: Record<QuestOutcomeTier, string> = Object.freeze({
    masterwork: 'MASTERWORK',
    seaworthy: 'SEAWORTHY',
    driftwood: 'DRIFTWOOD',
});

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

function deltaChips(
    result: QuestSpaceResult,
    partNames: Record<QuestPartKind, string>,
): string[] {
    const chips: string[] = [];
    const sign = (n: number) => (n > 0 ? `+${n}` : `${n}`);
    for (const kind of QUEST_PART_KINDS) {
        const d = result.partsDelta[kind] ?? 0;
        if (d !== 0) chips.push(`${sign(d)} ${partNames[kind]}`);
    }
    if (result.fishDelta !== 0) chips.push(`${sign(result.fishDelta)} FISH`);
    if (result.vigorDelta !== 0) chips.push(`${sign(result.vigorDelta)} VIGOR`);
    if (result.windDelta !== 0) chips.push(`${sign(result.windDelta)} WIND`);
    if (result.slippedBack > 0) chips.push(`BACK ${result.slippedBack}`);
    return chips;
}

const EMPTY_VM: QuestBoardVM = Object.freeze({
    active: false,
    phase: 'none',
    boardId: '',
    title: '',
    headline: '',
    storyBeat: '',
    intro: '',
    pieceName: '',
    day: 1,
    stretch: 0,
    stretchesPerDay: QUEST_BOARD_TUNING.stretchesPerDay,
    fish: 0,
    vigor: 0,
    maxVigor: 0,
    wind: 0,
    pos: 0,
    spaces: Object.freeze([]),
    parts: Object.freeze([]),
    boatProgress: 0,
    lastRoll: null,
    bones: Object.freeze([]),
    charms: Object.freeze([]),
    vows: Object.freeze([]),
    tierPreview: 'driftwood',
    pending: null,
    collapsedToday: false,
    outcome: null,
});

export function selectHasActiveQuestBoard(state: Pick<AppStoreState, 'quest'>): boolean {
    return state.quest?.session != null;
}

export function selectQuestBoardVM(state: Pick<AppStoreState, 'quest'>): QuestBoardVM {
    const s = state.quest?.session;
    if (!s) return EMPTY_VM;
    const def = questBoardDefOf(s);

    const spaces: QuestSpaceVM[] = def.spaces.map((space, index) => ({
        index,
        id: space.id,
        kind: space.kind,
        name: space.name,
        glyph: QUEST_SPACE_GLYPHS[space.kind],
        isPiece: index === s.pos,
        isSlipway: space.kind === 'slipway',
    }));

    const parts: QuestPartVM[] = QUEST_PART_KINDS
        .filter(kind => def.partsRequired[kind] > 0)
        .map(kind => ({
            kind,
            label: def.partNames[kind],
            fitted: s.fitted[kind],
            required: def.partsRequired[kind],
            carried: s.parts[kind],
        }));
    const requiredTotal = parts.reduce((sum, p) => sum + p.required, 0);
    const fittedTotal = parts.reduce((sum, p) => sum + p.fitted, 0);

    const charms: QuestCharmVM[] = s.charms.map(c => {
        const charmDef = getQuestCharmDef(c.id);
        return {
            id: c.id,
            name: charmDef.name,
            desc: charmDef.desc,
            flavor: charmDef.flavor,
            used: c.used,
            primed: c.primed,
            usable: s.phase === 'idle' && !c.used && !c.primed,
        };
    });

    const vows: QuestVowVM[] = questVowResults(s).map(v => ({
        id: v.id,
        name: v.name,
        desc: v.desc,
        status: v.status,
    }));

    const pending: QuestPendingVM | null = s.pending === null ? null : {
        kind: s.pending.kind,
        title: s.pending.title,
        body: s.pending.body,
        options: s.pending.options.map(o => ({
            id: o.id,
            label: o.label,
            desc: o.desc,
            enabled: !o.disabledReason,
            disabledReason: o.disabledReason ?? null,
        })),
        result: s.pending.result === null ? null : {
            title: s.pending.result.title,
            body: s.pending.result.body,
            rolls: s.pending.result.rolls,
            deltaChips: deltaChips(s.pending.result, def.partNames),
        },
        ledger: s.pending.ledger ?? [],
    };

    const outcome: QuestOutcomeVM | null = s.outcome === null ? null : {
        tier: s.outcome.tier,
        tierLabel: QUEST_TIER_LABELS[s.outcome.tier],
        copy: def.outcomeCopy[s.outcome.tier],
        daysTaken: s.outcome.daysTaken,
        fishLeft: s.outcome.fishLeft,
        vigorLeft: s.outcome.vigorLeft,
        rolls: s.outcome.metrics.rolls,
        vowsKept: s.outcome.vowsKept,
        vows: s.outcome.vows.map(v => ({
            id: v.id, name: v.name, desc: v.desc, status: v.status,
        })),
    };

    return {
        active: true,
        phase: s.phase,
        boardId: s.boardId,
        title: def.title,
        headline: def.boardHeadline,
        storyBeat: def.storyBeat,
        intro: def.intro,
        pieceName: def.pieceName,
        day: s.day,
        stretch: s.stretch,
        stretchesPerDay: QUEST_BOARD_TUNING.stretchesPerDay,
        fish: s.fish,
        vigor: s.vigor,
        maxVigor: def.maxVigor,
        wind: s.wind,
        pos: s.pos,
        spaces,
        parts,
        boatProgress: requiredTotal === 0 ? 0 : fittedTotal / requiredTotal,
        lastRoll: s.lastRoll,
        bones: (s.bones ?? []).map((bone, i, all) => {
            const other = all[i === 0 ? 1 : 0];
            return {
                index: i,
                die: bone.die,
                bonus: bone.bonus,
                total: bone.total,
                target: bone.target,
                targetKind: bone.targetKind,
                targetName: bone.targetName,
                fitsAtSlipway: bone.fitsAtSlipway,
                // What the OTHER bone banks if this one is taken — the cost
                // side of the trade, and the thing that stops the choice
                // from being "which square looks nicer".
                windLeftBehind: other?.windIfLeft ?? 0,
                label: `${bone.total} → ${bone.targetName}`,
                accessibilityLabel:
                    `Step ${bone.total} to ${bone.targetName}, a ${bone.targetKind} space.`
                    + (bone.fitsAtSlipway ? ' Fits carried parts at the slipway.' : '')
                    + ` Leaves ${other?.windIfLeft ?? 0} wind banked.`,
            };
        }),
        charms,
        vows,
        tierPreview: questBoardTierOf(s),
        pending,
        collapsedToday: s.collapsedToday,
        outcome,
    };
}
