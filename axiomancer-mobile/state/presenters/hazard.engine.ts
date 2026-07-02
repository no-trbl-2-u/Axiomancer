/**
 * Hazard minigame presenter — maps the v2 engine session
 * (`axiomancer-mechanics` World/Hazard) onto a render-ready view-model. Pure: no store
 * writes, no dice rolls, no rule decisions. The screen renders this VM
 * and dispatches store actions only.
 */

import {
    getHazardCardDef,
    getHazardDef,
    HAZARD_CONSEQUENCES,
    HAZARD_KEYWORDS,
    HAZARD_REWARDS,
    type SeedInput,
} from 'axiomancer-mechanics';
import {
    dieCanPowerCard,
    hazardCardPowerColors,
    hazardProjectedProgress,
    hazardSubquestResults,
} from 'axiomancer-mechanics';
import type { AppStoreState } from '@/state/store';
import {
    type HazardCardDef,
    type HazardColor,
    type HazardDieKind,
    type HazardHandEntry,
    type HazardMark,
    type HazardOutcomeTier,
    type HazardPhase,
    type HazardRouteKey,
    type HazardSessionState,
    type HazardSubquestReward,
    type HazardSubquestStatus,
} from 'axiomancer-mechanics';

// ---------------------------------------------------------------------------
// VM shapes
// ---------------------------------------------------------------------------

export interface HazardDieVM {
    id: string;
    kind: HazardDieKind;
    state: 'available' | 'spent';
    isHex: boolean;
    /** Player may pick this die up. */
    usable: boolean;
    temporary: boolean;
    /** Non-colour-only accessibility label, e.g. "Red blade die, available". */
    accessibilityLabel: string;
}

export interface HazardCardVM {
    uid: string;
    cardId: string;
    name: string;
    kind: HazardColor;
    /** Die colours that can power this card (besides the wild gold die). A
     *  two-tone card lists two — the board lets either land. */
    powerColors: HazardColor[];
    rarity: 'common' | 'uncommon' | 'rare';
    dead: boolean;
    utility: boolean;
    /** FREE row: stat pair or utility label. */
    free: { force: number; escape: number };
    powered: { force: number; escape: number };
    freeEffectLabel: string | null;
    poweredEffectLabel: string | null;
    flavor: string;
    keywords: { id: string; name: string; desc: string }[];
    /** A usable die (matching colour or the wild gold die) is on the board. */
    dieAvailable: boolean;
    /** Powered by which die (staged cards only). */
    poweredByDieId: string | null;
    /** Applied = locked in (staged cards only): no undo, no die, no bin. */
    applied: boolean;
    /** Discard benefit copy for the trash bin, e.g. "+1 FORCE this round". */
    salvageLabel: string | null;
    /** CHOOSE card: true when the player must pick a meter for the surge value. */
    choose: boolean;
    /** The chosen meter for a powered CHOOSE card (default 'force'). */
    chosenKey: 'force' | 'escape' | null;
    /** GILDED VOW bonus riding this staged card, when any. */
    vowBonus: { force: number; escape: number } | null;
}

export interface HazardForetellVM {
    /** Cards revealed by the foretell, in current draw-order. */
    revealed: HazardCardVM[];
    /** SCOUR mode: player may permanently discard any subset. */
    scour: boolean;
    /** How many cards to draw after the foretell resolves. */
    drawCount: number;
}

export interface HazardMeterVM {
    key: 'force' | 'escape' | 'passage';
    label: string;
    value: number;
    need: number;
    met: boolean;
}

export interface HazardSubquestVM {
    id: string;
    name: string;
    desc: string;
    status: HazardSubquestStatus;
    /** e.g. "+9 shillings" — the bonus paid on a survived crossing. */
    rewardLabel: string;
}

export interface HazardRouteChoiceVM {
    key: HazardRouteKey;
    name: string;
    badge: string;
    /** 'bone' (safer) vs 'sulfur' (better reward). */
    badgeTone: 'bone' | 'sulfur';
    description: string;
    /** One ladder row per meter: label + per-round thresholds. */
    ladder: { key: 'force' | 'escape' | 'passage'; label: string; values: number[] }[];
    rewardLabel: string;
    penaltyLabel: string;
    ctaLabel: string;
    dual: boolean;
}

export interface HazardResolveFlashVM {
    cleared: boolean;
    roundRoman: string;
    verdict: string;
    stats: { key: 'force' | 'escape' | 'passage'; label: string; got: number; need: number; ok: boolean }[];
    /** Momentum carried into the next round, when any (REC#1). */
    carryNote: string | null;
}

export interface HazardBoonVM {
    id: string;
    name: string;
    icon: string;
    desc: string;
}

export interface HazardOutcomeVM {
    tier: HazardOutcomeTier;
    word: string;
    sub: string;
    line: string;
    ctaLabel: string;
    marks: HazardMark[];
}

export interface HazardRewardsVM {
    tier: HazardOutcomeTier;
    rewards: HazardBoonVM[];
    consequences: HazardBoonVM[];
    consequencesLabel: string | null;
    offerCards: HazardCardVM[];
    offerSubLabel: string;
    canSkip: boolean;
    /** e.g. "+2 VITAE — unspent dice" (REC#3); null when zero. */
    reserveNote: string | null;
    /** e.g. "−8 VITAE — route penalty"; null when zero. */
    penaltyNote: string | null;
    /** e.g. "−4 VITAE — sacrifice" from BLOODPRICE-style cards; null when zero. */
    sacrificeNote: string | null;
    /** e.g. "+4 VITAE — mended" from MEND cards; null when zero. */
    mendNote: string | null;
    /** e.g. "+8 shillings — bounty" from BOUNTY cards; null when zero. */
    bountyNote: string | null;
    /** Rolled sub-quests with their final status + bonus copy. */
    subquests: HazardSubquestVM[];
    /** e.g. "+18 shillings · +1 token — objectives"; null when none paid. */
    questBonusNote: string | null;
}

export interface HazardViewModel {
    active: boolean;
    phase: HazardPhase;
    title: string;
    scenario: string;
    /** Grim danger-intro copy for the modal shown when the hazard triggers. */
    intro: string;
    /** Hazard def id — keys the intro modal's per-danger art. */
    hazardId: string;
    /** Session seed — lets the screen show the intro once per session. */
    sessionSeed: SeedInput;
    boardHeadline: string;
    boardNote: string;
    roundLabel: string;
    roundRoman: string;
    totalRounds: number;
    marks: HazardMark[];
    routeKey: HazardRouteKey | null;
    routeLabel: string;
    routeChoices: HazardRouteChoiceVM[];
    dice: HazardDieVM[];
    diceReady: number;
    hexCount: number;
    bothRequired: boolean;
    meters: HazardMeterVM[];
    /** Safe-route helper line: per-type split of the combined meter. */
    meterDetail: string | null;
    momentumNote: string | null;
    /** Active persistent enchantments (auras) — the "ENCHANTMENTS" strip. */
    enchantments: { id: string; label: string }[];
    /** Rolled sub-quests (optional objectives) with live status + bonus. */
    subquests: HazardSubquestVM[];
    /** Primed GILDED VOW awaiting the next gold die, when any. */
    goldVowNote: string | null;
    hand: HazardCardVM[];
    play: HazardCardVM[];
    deckCount: number;
    discardCount: number;
    /** Current route's full per-round threshold ladder (REC#2). */
    thresholdLadder: { key: 'force' | 'escape' | 'passage'; label: string; values: number[] }[];
    resolveEnabled: boolean;
    resolveLabel: string;
    resolveSubLabel: string;
    resolveFlash: HazardResolveFlashVM | null;
    outcome: HazardOutcomeVM | null;
    rewards: HazardRewardsVM | null;
    foretellPending: HazardForetellVM | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

const DIE_WORD: Record<HazardDieKind, string> = {
    red: 'Red blade',
    blue: 'Blue eye',
    purple: 'Purple crescent',
    gold: 'Yellow wild sun',
    hex: 'Blocked hex',
};

function riderLabel(def: HazardCardDef, powered: boolean): string | null {
    const major = powered || def.majorEffect === true;
    const segs: string[] = [];
    if (def.jeopardyForce) segs.push(`+${def.jeopardyForce} FOR if behind`);
    if (def.jeopardyEscape) segs.push(`+${def.jeopardyEscape} ESC if behind`);
    if ((def.firstPlayForce || def.firstPlayEscape) && !def.jeopardyForce && !def.jeopardyEscape) {
        if (def.firstPlayForce) segs.push(`+${def.firstPlayForce} FOR if first`);
        if (def.firstPlayEscape) segs.push(`+${def.firstPlayEscape} ESC if first`);
    } else if (def.firstPlayForce || def.firstPlayEscape) {
        if (def.firstPlayForce) segs.push(`+${def.firstPlayForce} FOR if first`);
        if (def.firstPlayEscape) segs.push(`+${def.firstPlayEscape} ESC if first`);
    }
    if (def.buyback) segs.push(major ? 'RETURNS to hand' : 'BUYBACK (needs die)');
    if (def.delveForce) segs.push(`+${def.delveForce} FOR/discard`);
    if (def.delveEscape) segs.push(`+${def.delveEscape} ESC/discard`);
    return segs.length > 0 ? segs.join(' · ') : null;
}

function effectLabel(def: HazardCardDef, powered: boolean): string | null {
    // Gold cards are major-tier even on the free row (the die buys numbers).
    const major = powered || def.majorEffect === true;
    if (!def.effect) {
        return riderLabel(def, powered);
    }
    if (def.effect === 'draw') return `DRAW ${major ? def.drawPowered ?? def.drawBase ?? 1 : def.drawBase ?? 1}`;
    if (def.effect === 'convert') return major ? 'CONVERT ✕→◆ ALL' : 'CONVERT 1 ✕→◆';
    if (def.effect === 'recast') return major ? 'RE-CAST +DIE' : 'RE-CAST';
    if (def.effect === 'aura') {
        const p = (major ? def.auraPowered ?? def.auraBase : def.auraBase) ?? {};
        const segs: string[] = [];
        if (p.auraForce) segs.push(`+${p.auraForce} FOR/card`);
        if (p.auraEscape) segs.push(`+${p.auraEscape} ESC/card`);
        if (p.surgeForce || p.surgeEscape) segs.push(`+${p.surgeForce ?? p.surgeEscape} surge`);
        return `ENCHANT ${segs.join(' ')}`.trim();
    }
    if (def.effect === 'burst') {
        if (def.burstPerUnspentDieForce) return `RALLY +${def.burstPerUnspentDieForce} FOR / die`;
        if (def.echoPerCardForce || def.echoPerCardEscape) {
            const f = def.echoPerCardForce ?? 0;
            const e = def.echoPerCardEscape ?? 0;
            const segs: string[] = [];
            if (f) segs.push(`+${f} FOR`);
            if (e) segs.push(`+${e} ESC`);
            const mend = major ? (def.burstMendPowered ?? def.burstMendBase ?? 0) : (def.burstMendBase ?? 0);
            const mendSeg = mend > 0 ? ` ·+${mend}♥` : '';
            return `ECHO ${segs.join('/')} /card${mendSeg}`;
        }
        const pl = major ? def.burstPowered ?? def.burstBase : def.burstBase;
        const burstSegs: string[] = [];
        if (pl?.force) burstSegs.push(`+${pl.force} FOR`);
        if (pl?.escape) burstSegs.push(`+${pl.escape} ESC`);
        if (def.delveForce) burstSegs.push(`+${def.delveForce} FOR/discard`);
        if (def.delveEscape) burstSegs.push(`+${def.delveEscape} ESC/discard`);
        const cost = def.vitaeCost ? `−${def.vitaeCost}♥ ` : '';
        const mend = major ? (def.burstMendPowered ?? def.burstMendBase ?? 0) : (def.burstMendBase ?? 0);
        const mendSeg = mend > 0 ? ` ·+${mend}♥` : '';
        return `${cost}BURST ${burstSegs.join(' ')}${mendSeg}`.trim();
    }
    if (def.effect === 'goldvow') {
        return def.goldVow ? `VOW +${def.goldVow.force}/+${def.goldVow.escape} on gold` : null;
    }
    if (def.effect === 'purge') {
        const draw = def.purgeDrawCount ? ` +DRAW ${def.purgeDrawCount}` : '';
        return major ? `PURGE ALL CRACKS${draw}` : `PURGE 1 CRACK${draw}`;
    }
    if (def.effect === 'transmute') {
        return major ? `TRANSMUTE ALL → ${DIE_LABEL[def.kind]}` : `TRANSMUTE 1 → ${DIE_LABEL[def.kind]}`;
    }
    if (def.effect === 'mend') {
        const n = (major ? def.mendPowered ?? def.mendBase : def.mendBase) ?? 0;
        return n > 0 ? `MEND +${n}♥ at claim` : null;
    }
    if (def.effect === 'bounty') {
        const n = (major ? def.bountyPowered ?? def.bountyBase : def.bountyBase) ?? 0;
        return n > 0 ? `BOUNTY +${n} shillings` : null;
    }
    if (def.effect === 'ward') {
        const n = (major ? def.wardPowered ?? def.wardBase : def.wardBase) ?? 0;
        return n > 0 ? `WARD −${n} penalty` : null;
    }
    if (def.effect === 'anchor') {
        const n = (major ? def.anchorPowered ?? def.anchorBase : def.anchorBase) ?? 0;
        return n > 0 ? `ANCHOR carry ≥ ${n}` : null;
    }
    if (def.effect === 'foretell') {
        const drawN = def.drawBase ?? 2;
        const scourTag = def.foretellScour ? 'SCOUR' : 'FORETELL';
        const base = `${scourTag} ${drawN}`;
        const afterDraw = major ? (def.foretellDrawCount ?? 0) : 0;
        const foretellLabel = afterDraw > 0 ? `${base} · DRAW ${afterDraw}` : base;
        const rider = riderLabel(def, powered);
        return rider ? `${foretellLabel} · ${rider}` : foretellLabel;
    }
    // For any effect card that also has new mechanic riders, append them.
    const rider = riderLabel(def, powered);
    if (rider) return rider;
    return null;
}

/** Powered-row display numbers, honouring CHOOSE (only the chosen meter shows)
 *  and the GILDED VOW bonus riding a staged card. */
function poweredDisplay(def: HazardCardDef, entry: HazardHandEntry): { force: number; escape: number } {
    let force: number;
    let escape: number;
    if (def.choose) {
        const key = entry.chosenKey ?? 'force';
        force = key === 'escape' ? 0 : def.fp ?? 0;
        escape = key === 'escape' ? def.ep ?? 0 : 0;
    } else {
        force = def.fp ?? def.f;
        escape = def.ep ?? def.e;
    }
    if (entry.vowBonus) {
        force += entry.vowBonus.force;
        escape += entry.vowBonus.escape;
    }
    return { force, escape };
}

const DIE_LABEL: Record<HazardColor, string> = {
    red: 'RED',
    blue: 'BLUE',
    purple: 'PURPLE',
    gold: 'YELLOW',
};

function subquestRewardLabel(r: HazardSubquestReward): string {
    if (r.kind === 'shillings') return `+${r.amount} shillings`;
    if (r.kind === 'vitae') return `+${r.amount} vitae`;
    return `+${r.amount} paradox token${r.amount > 1 ? 's' : ''}`;
}

function salvageLabelOf(def: HazardCardDef): string | null {
    if (!def.salvage) return null;
    if (def.salvage.type === 'mana') return `conjure a ${DIE_LABEL[def.kind]} die`;
    return `+${def.salvage.amount} ${def.salvage.key.toUpperCase()} this round`;
}

function keywordsOf(def: HazardCardDef): { id: string; name: string; desc: string }[] {
    const ids = def.salvage ? [...def.keywords, 'salvage' as const] : def.keywords;
    return ids.map((k) => ({ id: k, ...HAZARD_KEYWORDS[k] }));
}

function cardVM(entry: HazardHandEntry, session: HazardSessionState): HazardCardVM {
    const def = getHazardCardDef(entry.cardId);
    const dieAvailable =
        !def.dead &&
        session.dice.some((d) => d.state === 'available' && dieCanPowerCard(d.kind, def));
    return {
        uid: entry.uid,
        cardId: entry.cardId,
        name: def.name,
        kind: def.kind,
        powerColors: hazardCardPowerColors(def),
        rarity: def.rarity,
        dead: def.dead === true,
        utility: def.effect !== undefined,
        free: { force: def.f, escape: def.e },
        powered: poweredDisplay(def, entry),
        freeEffectLabel: effectLabel(def, false),
        poweredEffectLabel: effectLabel(def, true),
        flavor: def.flavor,
        keywords: keywordsOf(def),
        dieAvailable,
        poweredByDieId: entry.dieId,
        applied: entry.applied === true,
        salvageLabel: salvageLabelOf(def),
        choose: def.choose === true,
        chosenKey: def.choose ? entry.chosenKey ?? 'force' : null,
        vowBonus: entry.vowBonus ?? null,
    };
}

/**
 * Build a static (un-staged) card VM straight from a card id — the
 * same shape the rewards offer uses. Phase 126 reuses this so the
 * persistent deck screen and remove-card grid render identical
 * `HazardCard` stock to the in-encounter hand. Unknown ids fall
 * through to the engine's own throw, matching offer behaviour.
 */
export function cardVMFromId(cardId: string): HazardCardVM {
    return offerCardVM(getHazardCardDef(cardId));
}

function offerCardVM(def: HazardCardDef): HazardCardVM {
    return {
        uid: `offer-${def.id}`,
        cardId: def.id,
        name: def.name,
        kind: def.kind,
        powerColors: hazardCardPowerColors(def),
        rarity: def.rarity,
        dead: def.dead === true,
        utility: def.effect !== undefined,
        free: { force: def.f, escape: def.e },
        powered: poweredDisplay(def, { uid: '', cardId: def.id, dieId: null }),
        freeEffectLabel: effectLabel(def, false),
        poweredEffectLabel: effectLabel(def, true),
        flavor: def.flavor,
        keywords: keywordsOf(def),
        dieAvailable: false,
        poweredByDieId: null,
        applied: false,
        salvageLabel: salvageLabelOf(def),
        choose: def.choose === true,
        chosenKey: null,
        vowBonus: null,
    };
}

function routeChoices(session: HazardSessionState): HazardRouteChoiceVM[] {
    const def = getHazardDef(session.hazardId);
    return [
        {
            key: 'safe',
            name: def.safeRouteName,
            badge: 'SAFER',
            badgeTone: 'bone',
            description: def.safeRouteDesc,
            ladder: [{ key: 'passage', label: 'PASS', values: def.safe.thresholds }],
            rewardLabel: def.safe.rewardLabel,
            penaltyLabel: `−${def.safe.penaltyVitae}♥ per lost round`,
            ctaLabel: 'TAKE SAFE ROUTE ›',
            dual: false,
        },
        {
            key: 'risk',
            name: def.riskRouteName,
            badge: 'BETTER REWARD',
            badgeTone: 'sulfur',
            description: def.riskRouteDesc,
            ladder: [
                { key: 'force', label: 'FOR', values: def.risk.thresholds.map((t) => t[0]) },
                { key: 'escape', label: 'ESC', values: def.risk.thresholds.map((t) => t[1]) },
            ],
            rewardLabel: def.risk.rewardLabel,
            penaltyLabel: `−${def.risk.penaltyVitae}♥ per lost round`,
            ctaLabel: 'TAKE RISK ROUTE ›',
            dual: true,
        },
    ];
}

const OUTCOME_COPY: Record<HazardOutcomeTier, { word: string; sub: string; line: string; cta: string }> = {
    perfect: {
        word: 'PERFECT',
        sub: 'EVERY ROUND HELD — FLAWLESS PASSAGE',
        line: 'Not one stone gave way beneath you.',
        cta: '✠ CLAIM YOUR DUE ›',
    },
    complete: {
        word: 'COMPLETE',
        sub: 'YOU CROSSED — BLOODIED BUT ALIVE',
        line: 'The far side holds. Some of you stayed behind.',
        cta: '✠ CLAIM YOUR DUE ›',
    },
    failure: {
        word: 'FAILURE',
        sub: 'THE PATH TOOK EVERYTHING',
        line: 'You fall, and the cliff keeps what it caught.',
        cta: '✠ FACE THE COST ›',
    },
};

const EMPTY_VM: HazardViewModel = Object.freeze({
    active: false,
    phase: 'route-select',
    title: '',
    scenario: '',
    intro: '',
    hazardId: '',
    sessionSeed: 0,
    boardHeadline: '',
    boardNote: '',
    roundLabel: '',
    roundRoman: 'I',
    totalRounds: 0,
    marks: [],
    routeKey: null,
    routeLabel: '',
    routeChoices: [],
    dice: [],
    diceReady: 0,
    hexCount: 0,
    bothRequired: false,
    meters: [],
    meterDetail: null,
    momentumNote: null,
    enchantments: [],
    subquests: [],
    goldVowNote: null,
    hand: [],
    play: [],
    deckCount: 0,
    discardCount: 0,
    thresholdLadder: [],
    resolveEnabled: false,
    resolveLabel: 'PLAY',
    resolveSubLabel: 'STAGE A CARD',
    resolveFlash: null,
    outcome: null,
    rewards: null,
    foretellPending: null,
}) as HazardViewModel;

// ---------------------------------------------------------------------------
// Selector
// ---------------------------------------------------------------------------

export function selectHazardViewModel(state: Pick<AppStoreState, 'hazard'>): HazardViewModel {
    const session = state.hazard?.session ?? null;
    if (!session) return EMPTY_VM;
    const def = getHazardDef(session.hazardId);
    const proj = hazardProjectedProgress(session);
    const isRisk = session.route === 'risk';

    const dice: HazardDieVM[] = session.dice.map((d) => ({
        id: d.id,
        kind: d.kind,
        state: d.state,
        isHex: d.kind === 'hex',
        usable: d.kind !== 'hex' && d.state === 'available',
        temporary: d.temporary === true,
        accessibilityLabel: `${DIE_WORD[d.kind]} die, ${
            d.kind === 'hex' ? 'blocked' : d.state
        }${d.temporary ? ', conjured' : ''}`,
    }));

    let meters: HazardMeterVM[] = [];
    let meterDetail: string | null = null;
    let thresholdLadder: HazardViewModel['thresholdLadder'] = [];
    if (session.route === 'risk') {
        const [needF, needE] = def.risk.thresholds[session.round - 1];
        meters = [
            { key: 'force', label: 'FORCE', value: proj.force, need: needF, met: proj.force >= needF },
            { key: 'escape', label: 'ESCAPE', value: proj.escape, need: needE, met: proj.escape >= needE },
        ];
        thresholdLadder = [
            { key: 'force', label: 'FOR', values: def.risk.thresholds.map((t) => t[0]) },
            { key: 'escape', label: 'ESC', values: def.risk.thresholds.map((t) => t[1]) },
        ];
    } else if (session.route === 'safe') {
        const need = def.safe.thresholds[session.round - 1];
        const combined = proj.force + proj.escape;
        meters = [
            { key: 'passage', label: 'PASSAGE — FORCE + ESCAPE', value: combined, need, met: combined >= need },
        ];
        meterDetail = `FORCE ${proj.force} · ESCAPE ${proj.escape} — either type counts`;
        thresholdLadder = [{ key: 'passage', label: 'PASS', values: def.safe.thresholds }];
    }

    const momentum = session.progressBase;
    const momentumNote =
        momentum.force > 0 || momentum.escape > 0
            ? `MOMENTUM +${momentum.force + momentum.escape} carried in`
            : null;

    const m = session.modifiers;
    const enchantments: { id: string; label: string }[] = [];
    if (m.auraForce) enchantments.push({ id: 'auraForce', label: `+${m.auraForce} FORCE / card` });
    if (m.auraEscape) enchantments.push({ id: 'auraEscape', label: `+${m.auraEscape} ESCAPE / card` });
    if (m.surgeForce || m.surgeEscape)
        enchantments.push({ id: 'surge', label: `+${m.surgeForce || m.surgeEscape} to surge numbers` });
    const goldVowNote = session.goldVow
        ? `VOW PRIMED — next gold die +${session.goldVow.force}/+${session.goldVow.escape}`
        : null;

    const questsFinal =
        session.phase === 'outcome' || session.phase === 'rewards' || session.phase === 'done';
    const subquests: HazardSubquestVM[] = hazardSubquestResults(session, questsFinal).map((q) => ({
        id: q.id,
        name: q.name,
        desc: q.desc,
        status: q.status,
        rewardLabel: subquestRewardLabel(q.reward),
    }));

    const flash = session.resolveInfo;
    const resolveFlash: HazardResolveFlashVM | null = flash
        ? {
              cleared: flash.cleared,
              roundRoman: ROMAN[flash.round - 1] ?? String(flash.round),
              verdict: flash.cleared ? 'PASSED' : 'FALLEN',
              stats: flash.dual
                  ? [
                        { key: 'force', label: 'FORCE', got: flash.force, need: flash.needF ?? 0, ok: flash.force >= (flash.needF ?? 0) },
                        { key: 'escape', label: 'ESCAPE', got: flash.escape, need: flash.needE ?? 0, ok: flash.escape >= (flash.needE ?? 0) },
                    ]
                  : [
                        { key: 'passage', label: 'PASSAGE', got: flash.combined ?? 0, need: flash.need ?? 0, ok: (flash.combined ?? 0) >= (flash.need ?? 0) },
                    ],
              carryNote:
                  flash.carryForce + flash.carryEscape > 0
                      ? `MOMENTUM — ${flash.carryForce + flash.carryEscape} surplus carries to round ${
                            ROMAN[flash.round] ?? flash.round + 1
                        }`
                      : null,
          }
        : null;

    const outcome = session.outcome;
    const outcomeVM: HazardOutcomeVM | null =
        outcome && (session.phase === 'outcome' || session.phase === 'rewards' || session.phase === 'done')
            ? {
                  tier: outcome.tier,
                  word: OUTCOME_COPY[outcome.tier].word,
                  sub: OUTCOME_COPY[outcome.tier].sub,
                  line: OUTCOME_COPY[outcome.tier].line,
                  ctaLabel: OUTCOME_COPY[outcome.tier].cta,
                  marks: session.marks,
              }
            : null;

    const rewardsVM: HazardRewardsVM | null = outcome
        ? {
              tier: outcome.tier,
              rewards: outcome.rewards.map((r) => ({ id: r, ...HAZARD_REWARDS[r] })),
              consequences: outcome.consequences.map((c) => ({ id: c, ...HAZARD_CONSEQUENCES[c] })),
              consequencesLabel:
                  outcome.consequences.length > 0
                      ? `☠ CONSEQUENCES — ${outcome.losses} ROUND${outcome.losses > 1 ? 'S' : ''} LOST`
                      : null,
              offerCards: outcome.offerCards.map(offerCardVM),
              offerSubLabel:
                  outcome.tier === 'perfect'
                      ? 'GUARANTEED RARE · CHOOSE ONE OR SKIP'
                      : outcome.wins <= 1
                        ? 'CHOOSE ONE · NO RARE THIS TIME'
                        : 'CHOOSE ONE OF THREE',
              canSkip: outcome.canSkip,
              reserveNote:
                  outcome.reserveBonus > 0
                      ? `+${outcome.reserveBonus} VITAE — unspent dice held in reserve`
                      : null,
              penaltyNote:
                  outcome.penaltyVitae > 0 ? `−${outcome.penaltyVitae} VITAE — route penalty` : null,
              sacrificeNote:
                  outcome.vitaeCost > 0 ? `−${outcome.vitaeCost} VITAE — sacrifice` : null,
              mendNote:
                  outcome.vitaeRestore > 0 ? `+${outcome.vitaeRestore} VITAE — mended` : null,
              bountyNote:
                  outcome.bountyShillings > 0
                      ? `+${outcome.bountyShillings} shillings — bounty`
                      : null,
              subquests: outcome.subquests.map((q) => ({
                  id: q.id,
                  name: q.name,
                  desc: q.desc,
                  status: q.status,
                  rewardLabel: subquestRewardLabel(q.reward),
              })),
              questBonusNote: ((): string | null => {
                  const segs: string[] = [];
                  if (outcome.questShillings > 0) segs.push(`+${outcome.questShillings} shillings`);
                  if (outcome.questVitae > 0) segs.push(`+${outcome.questVitae} vitae`);
                  if (outcome.questTokens > 0)
                      segs.push(`+${outcome.questTokens} token${outcome.questTokens > 1 ? 's' : ''}`);
                  return segs.length ? `${segs.join(' · ')} — objectives` : null;
              })(),
          }
        : null;

    // PLAY arms as soon as anything is staged — pressing it auto-applies
    // every staged card (the engine fires their utilities) and resolves.
    const staged = session.play.length;
    const canResolve = session.phase === 'playing' && staged > 0;
    const resolveSubLabel = staged === 0 ? 'STAGE A CARD' : 'RESOLVE';

    return {
        active: true,
        phase: session.phase,
        title: def.title,
        scenario: def.scenario,
        intro: def.intro,
        hazardId: session.hazardId,
        sessionSeed: session.seed,
        boardHeadline: def.boardHeadline,
        boardNote: isRisk ? def.riskBoardNote : def.safeBoardNote,
        roundLabel: `ROUND ${ROMAN[session.round - 1]} / ${ROMAN[session.totalRounds - 1]}`,
        roundRoman: ROMAN[session.round - 1] ?? String(session.round),
        totalRounds: session.totalRounds,
        marks: session.marks,
        routeKey: session.route,
        routeLabel: session.route === null ? '' : isRisk ? 'RISK ROUTE' : 'SAFE ROUTE',
        routeChoices: session.phase === 'route-select' ? routeChoices(session) : [],
        dice,
        diceReady: dice.filter((d) => d.usable).length,
        hexCount: dice.filter((d) => d.isHex).length,
        bothRequired: isRisk,
        meters,
        meterDetail,
        momentumNote,
        enchantments,
        subquests,
        goldVowNote,
        hand: session.hand.map((h) => cardVM(h, session)),
        play: session.play.map((p) => cardVM(p, session)),
        deckCount: session.drawPile.length,
        discardCount: session.discardPile.length,
        thresholdLadder,
        resolveEnabled: canResolve,
        resolveLabel: 'PLAY',
        resolveSubLabel,
        resolveFlash,
        outcome: outcomeVM,
        rewards: session.phase === 'rewards' || session.phase === 'done' ? rewardsVM : null,
        foretellPending: session.foretellPending
            ? {
                  revealed: session.foretellPending.revealed.map((cardId) =>
                      offerCardVM(getHazardCardDef(cardId)),
                  ),
                  scour: session.foretellPending.scour,
                  drawCount: session.foretellPending.drawCount,
              }
            : null,
    };
}

/** True while a hazard session is active — drives `<HazardGate>`. */
export function selectHasActiveHazard(state: Pick<AppStoreState, 'hazard'>): boolean {
    return state.hazard?.session != null;
}
