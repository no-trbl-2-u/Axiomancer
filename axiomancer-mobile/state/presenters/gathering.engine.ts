/**
 * Gathering minigame presenter — maps the engine session
 * (`axiomancer-mechanics` World/Gathering) onto a render-ready view-model. Pure: no store
 * writes, no rolls, no rule decisions. The screen renders this VM and
 * dispatches store actions only.
 */

import {
    GATHER_APPROACH_COPY,
    GATHERING_KEYWORDS,
    GATHERING_REPRISALS,
    GATHER_SET_REFINEMENTS,
    getGatherBoonDef,
    getGatherOfferingDef,
    getGatherPlotDef,
    getGatherSiteDef,
    getGatherToolDef,
    type GatherKeywordId,
    type SeedInput,
} from 'axiomancer-mechanics';
import {
    canPayGatheringOffering,
    gatherApproachDef,
    gatheringBoonResults,
    gatheringDuskFallen,
    gatheringFamilyTotals,
    gatheringHarvestWrath,
    gatheringHarvestYield,
} from 'axiomancer-mechanics';
import {
    GATHER_WRATH_MAX,
    GATHER_WRATH_THRESHOLDS,
    GATHERING_TUNING,
} from 'axiomancer-mechanics';
import type {
    GatherApproachKey,
    GatherBoonReward,
    GatherBoonStatus,
    GatherFamily,
    GatherOutcomeTier,
    GatherPlotTrait,
    GatherReprisalEvent,
    GatherToolId,
    GatheringPhase,
    GatheringSessionState,
} from 'axiomancer-mechanics';
import type { AppStoreState } from '@/state/store';

// ---------------------------------------------------------------------------
// VM shapes
// ---------------------------------------------------------------------------

export interface GatherPlotVM {
    uid: string;
    plotId: string;
    name: string;
    family: GatherFamily;
    familyLabel: string;
    trait: GatherPlotTrait | null;
    traitLabel: string | null;
    /** Richness this plot yields RIGHT NOW (stance applied). 0 for breaths. */
    yieldRichness: number;
    /** Wrath this taking costs RIGHT NOW (≤ 0 = relief, breaths). */
    wrathCost: number;
    isBreath: boolean;
    flavor: string;
    keywords: { id: string; name: string; desc: string }[];
    accessibilityLabel: string;
}

export interface GatherSatchelFamilyVM {
    family: GatherFamily;
    label: string;
    pieces: number;
    richness: number;
    setThreshold: number;
    set: boolean;
}

export interface GatherWrathVM {
    value: number;
    max: number;
    /** Threshold positions with their fired state. */
    thresholds: { at: number; fired: boolean }[];
    /** 0..1 fill for the meter. */
    ratio: number;
    duskFallen: boolean;
    watcherWoken: boolean;
    mired: boolean;
    sickled: boolean;
}

export interface GatherOfferingVM {
    id: string;
    name: string;
    demandLabel: string;
    paid: boolean;
    /** Engine + host affordability combined (display only). */
    payable: boolean;
    flavor: string;
}

export interface GatherToolVM {
    id: GatherToolId;
    name: string;
    desc: string;
    used: boolean;
}

export interface GatherBoonVM {
    id: string;
    name: string;
    desc: string;
    status: GatherBoonStatus;
    rewardLabel: string;
}

export interface GatherApproachChoiceVM {
    key: GatherApproachKey;
    name: string;
    badge: string;
    badgeTone: 'bone' | 'sulfur';
    description: string;
    rewardLabel: string;
    costLabel: string;
    ctaLabel: string;
}

export interface GatherReprisalFlashVM {
    kind: GatherReprisalEvent['kind'];
    name: string;
    desc: string;
    /** e.g. "−3 VITAE" / "2 BLOOM pieces spoil" / "the jar holds". */
    detail: string | null;
    eruption: boolean;
    veiled: boolean;
}

export interface GatherOutcomeVM {
    tier: GatherOutcomeTier;
    word: string;
    sub: string;
    line: string;
    ctaLabel: string;
}

export interface GatherSpoilsVM {
    tier: GatherOutcomeTier;
    /** Aggregated kept stacks: "Mire-Mint Crown ×3". */
    keptStacks: { plotId: string; name: string; family: GatherFamily; quantity: number }[];
    lostCount: number;
    familyTotals: GatherSatchelFamilyVM[];
    /** Completed set refinements (named treasures). */
    refinements: { family: GatherFamily; name: string; desc: string }[];
    roundHarvest: boolean;
    /** e.g. "+8 shillings — SAINT-WAX SEAL refined". */
    coinNotes: string[];
    /** e.g. "−3 VITAE — the briar's toll" / "+5 VITAE — the site's blessing". */
    vitaeNotes: string[];
    scarNote: string | null;
    boons: GatherBoonVM[];
    boonNote: string | null;
    confirmLabel: string;
}

export interface GatheringViewModel {
    active: boolean;
    phase: GatheringPhase;
    siteId: string;
    sessionSeed: SeedInput;
    title: string;
    scenario: string;
    intro: string;
    boardHeadline: string;
    boardNote: string;
    approachKey: GatherApproachKey | null;
    approachLabel: string;
    approachChoices: GatherApproachChoiceVM[];
    depthIndex: number;
    depthCount: number;
    depthName: string;
    depthNames: string[];
    canDescend: boolean;
    /** Plots remaining in the current stratum's bag. */
    bagCount: number;
    turn: number;
    duskNote: string | null;
    wrath: GatherWrathVM;
    grace: number;
    graceNote: string | null;
    spread: GatherPlotVM[];
    satchelCount: number;
    satchelRichness: number;
    satchelFamilies: GatherSatchelFamilyVM[];
    offerings: GatherOfferingVM[];
    tools: GatherToolVM[];
    boons: GatherBoonVM[];
    withdrawEnabled: boolean;
    withdrawLabel: string;
    withdrawSubLabel: string;
    reprisalFlash: GatherReprisalFlashVM | null;
    outcome: GatherOutcomeVM | null;
    spoils: GatherSpoilsVM | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const FAMILY_LABEL: Record<GatherFamily, string> = {
    bloom: 'BLOOM',
    resin: 'RESIN',
    vein: 'VEIN',
    bone: 'BONE',
};

const TRAIT_LABEL: Record<GatherPlotTrait, string> = {
    gift: 'GIFT',
    lure: 'LURE',
    breath: 'BREATH',
    tangle: 'TANGLE',
};

const TRAIT_KEYWORD: Record<GatherPlotTrait, GatherKeywordId> = {
    gift: 'gift',
    lure: 'lure',
    breath: 'breath',
    tangle: 'tangle',
};

function keywordsOf(trait: GatherPlotTrait | null): { id: string; name: string; desc: string }[] {
    const ids: GatherKeywordId[] = ['wrath'];
    if (trait) ids.push(TRAIT_KEYWORD[trait]);
    ids.push('set');
    return ids.map((id) => ({ id, ...GATHERING_KEYWORDS[id] }));
}

function boonRewardLabel(r: GatherBoonReward): string {
    if (r.kind === 'shillings') return `+${r.amount} shillings`;
    if (r.kind === 'vitae') return `+${r.amount} vitae`;
    return `+${r.amount} paradox token${r.amount > 1 ? 's' : ''}`;
}

function demandLabel(offeringId: string): string {
    const def = getGatherOfferingDef(offeringId);
    if (def.demand.kind === 'shillings') return `${def.demand.amount} shillings`;
    if (def.demand.kind === 'vitae') return `${def.demand.amount} vitae`;
    return `a ${FAMILY_LABEL[def.demand.family]} piece`;
}

const OUTCOME_COPY: Record<GatherOutcomeTier, { word: string; sub: string; line: string; cta: string }> = {
    communion: {
        word: 'COMMUNION',
        sub: 'THE PLACE FORGIVES THE TAKING',
        line: 'You leave lighter than you came, and somehow richer.',
        cta: '✠ ACCEPT ITS BLESSING ›',
    },
    laden: {
        word: 'LADEN',
        sub: 'YOU WALK OUT WITH WHAT YOU CAME FOR',
        line: 'The satchel rides heavy. The site says nothing.',
        cta: '✠ WEIGH THE TAKE ›',
    },
    despoiled: {
        word: 'DESPOILED',
        sub: 'YOU TOOK MORE THAN IT FORGAVE',
        line: 'Behind you, the green goes grey. Some of it follows.',
        cta: '✠ WEIGH THE TAKE ›',
    },
    routed: {
        word: 'ROUTED',
        sub: 'THE SITE ROSE AGAINST YOU',
        line: 'You run, and the place keeps its tithe from your satchel.',
        cta: '✠ COUNT WHAT SURVIVED ›',
    },
};

function approachChoices(): GatherApproachChoiceVM[] {
    return (['glean', 'strip'] as const).map((key) => {
        const copy = GATHER_APPROACH_COPY[key];
        return {
            key,
            name: copy.name,
            badge: copy.badge,
            badgeTone: key === 'glean' ? 'bone' : 'sulfur',
            description: copy.desc,
            rewardLabel: copy.rewardLabel,
            costLabel: copy.costLabel,
            ctaLabel: copy.ctaLabel,
        };
    });
}

function reprisalFlashVM(event: GatherReprisalEvent): GatherReprisalFlashVM {
    const copy = GATHERING_REPRISALS[event.kind];
    let detail: string | null = null;
    if (event.kind === 'thorns' && event.bite) detail = `−${event.bite} VITAE`;
    if (event.kind === 'rot') {
        detail = event.jarHeld
            ? 'the sealed jar holds — nothing spoils'
            : event.rotLost && event.rotFamily
              ? `${event.rotLost} ${FAMILY_LABEL[event.rotFamily]} piece${event.rotLost > 1 ? 's' : ''} spoil`
              : 'nothing to spoil';
    }
    if (event.kind === 'mire') detail = `next taking +${GATHERING_TUNING.tools.mireSurcharge} WRATH`;
    if (event.kind === 'watcher') detail = 'every taking +1 WRATH from now on';
    if (event.kind === 'eruption') {
        const segs: string[] = [];
        if (event.eruptionLost) segs.push(`${event.eruptionLost} piece${event.eruptionLost > 1 ? 's' : ''} clawed back`);
        if (event.bite) segs.push(`−${event.bite} VITAE`);
        detail = segs.join(' · ') || null;
    }
    return {
        kind: event.kind,
        name: copy.name,
        desc: copy.desc,
        detail,
        eruption: event.kind === 'eruption',
        veiled: event.kind === 'veiled',
    };
}

function familyVMs(totals: ReturnType<typeof gatheringFamilyTotals>): GatherSatchelFamilyVM[] {
    return totals.map((t) => ({
        family: t.family,
        label: FAMILY_LABEL[t.family],
        pieces: t.pieces,
        richness: t.richness,
        setThreshold: GATHERING_TUNING.sets.threshold,
        set: t.set,
    }));
}

const EMPTY_VM: GatheringViewModel = Object.freeze({
    active: false,
    phase: 'approach-select',
    siteId: '',
    sessionSeed: 0,
    title: '',
    scenario: '',
    intro: '',
    boardHeadline: '',
    boardNote: '',
    approachKey: null,
    approachLabel: '',
    approachChoices: [],
    depthIndex: 0,
    depthCount: 3,
    depthName: '',
    depthNames: [],
    canDescend: false,
    bagCount: 0,
    turn: 0,
    duskNote: null,
    wrath: { value: 0, max: GATHER_WRATH_MAX, thresholds: [], ratio: 0, duskFallen: false, watcherWoken: false, mired: false, sickled: false },
    grace: 0,
    graceNote: null,
    spread: [],
    satchelCount: 0,
    satchelRichness: 0,
    satchelFamilies: [],
    offerings: [],
    tools: [],
    boons: [],
    withdrawEnabled: false,
    withdrawLabel: 'WITHDRAW',
    withdrawSubLabel: '',
    reprisalFlash: null,
    outcome: null,
    spoils: null,
}) as GatheringViewModel;

// ---------------------------------------------------------------------------
// Selector
// ---------------------------------------------------------------------------

export function selectGatheringViewModel(
    state: Pick<AppStoreState, 'gathering'> & { player?: { currency: number; health: number } },
): GatheringViewModel {
    const session = state.gathering?.session ?? null;
    if (!session) return EMPTY_VM;
    const site = getGatherSiteDef(session.siteId);
    const isStrip = session.approach === 'strip';
    const duskFallen = gatheringDuskFallen(session);

    const spread: GatherPlotVM[] = session.spread.map((entry) => {
        const def = getGatherPlotDef(entry.plotId);
        const wrathCost = gatheringHarvestWrath(session, def);
        const yieldRichness = gatheringHarvestYield(session, def);
        const isBreath = def.trait === 'breath';
        return {
            uid: entry.uid,
            plotId: entry.plotId,
            name: def.name,
            family: def.family,
            familyLabel: FAMILY_LABEL[def.family],
            trait: def.trait ?? null,
            traitLabel: def.trait ? TRAIT_LABEL[def.trait] : null,
            yieldRichness,
            wrathCost,
            isBreath,
            flavor: def.flavor,
            keywords: keywordsOf(def.trait ?? null),
            accessibilityLabel: isBreath
                ? `${def.name}, tend the site: wrath eases by ${Math.abs(wrathCost)}`
                : `${def.name}, ${FAMILY_LABEL[def.family]} plot: yields ${yieldRichness}, costs ${wrathCost} wrath`,
        };
    });

    const offerings: GatherOfferingVM[] = session.offerings.map((o) => {
        const def = getGatherOfferingDef(o.id);
        let payable = canPayGatheringOffering(session, o.id).payable && session.phase === 'foraging';
        // Host affordability (display only — the action re-checks).
        if (payable && state.player) {
            if (def.demand.kind === 'shillings') {
                payable = state.player.currency - session.offeringShillings >= def.demand.amount;
            } else if (def.demand.kind === 'vitae') {
                payable =
                    state.player.health - session.offeringVitae - session.bittenVitae - def.demand.amount >= 1;
            }
        }
        return {
            id: o.id,
            name: def.name,
            demandLabel: demandLabel(o.id),
            paid: o.paid,
            payable,
            flavor: def.flavor,
        };
    });

    const tools: GatherToolVM[] = session.tools.map((t) => {
        const def = getGatherToolDef(t.id);
        return { id: t.id, name: def.name, desc: def.desc, used: t.used };
    });

    const final =
        session.phase === 'outcome' || session.phase === 'rewards' || session.phase === 'done';
    const boons: GatherBoonVM[] = gatheringBoonResults(session, final).map((b) => ({
        id: b.id,
        name: b.name,
        desc: b.desc,
        status: b.status,
        rewardLabel: boonRewardLabel(b.reward),
    }));

    const flashEvent = session.pendingReprisals[0] ?? null;
    const outcome = session.outcome;

    let spoils: GatherSpoilsVM | null = null;
    if (outcome) {
        const stacks = new Map<string, { plotId: string; name: string; family: GatherFamily; quantity: number }>();
        for (const piece of outcome.kept) {
            const existing = stacks.get(piece.plotId);
            if (existing) existing.quantity += piece.richness;
            else stacks.set(piece.plotId, { plotId: piece.plotId, name: piece.name, family: piece.family, quantity: piece.richness });
        }
        const coinNotes: string[] = [];
        const S = GATHERING_TUNING.sets;
        for (const family of outcome.sets) {
            coinNotes.push(`+${S.shillings} shillings — ${GATHER_SET_REFINEMENTS[family].name} refined`);
        }
        if (outcome.roundHarvest) coinNotes.push(`+${S.roundHarvestShillings} shillings — the round harvest`);
        const A = gatherApproachDef(session.approach ?? 'glean');
        if (A.plunderPerRichness > 0) {
            const keptRichness = outcome.kept.reduce((sum, p) => sum + p.richness, 0);
            if (keptRichness > 0)
                coinNotes.push(`+${keptRichness * A.plunderPerRichness} shillings — plunder weighed out`);
        }
        if (outcome.offeringShillings > 0) coinNotes.push(`−${outcome.offeringShillings} shillings — offerings`);

        const vitaeNotes: string[] = [];
        if (outcome.blessingVitae > 0) vitaeNotes.push(`+${outcome.blessingVitae} VITAE — the site's blessing`);
        if (outcome.bittenVitae > 0) vitaeNotes.push(`−${outcome.bittenVitae} VITAE — what the place took back`);
        if (outcome.offeringVitae > 0) vitaeNotes.push(`−${outcome.offeringVitae} VITAE — the blood tithe`);

        const boonSegs: string[] = [];
        if (outcome.boonShillings > 0) boonSegs.push(`+${outcome.boonShillings} shillings`);
        if (outcome.boonVitae > 0) boonSegs.push(`+${outcome.boonVitae} vitae`);
        if (outcome.boonTokens > 0) boonSegs.push(`+${outcome.boonTokens} token${outcome.boonTokens > 1 ? 's' : ''}`);

        spoils = {
            tier: outcome.tier,
            keptStacks: [...stacks.values()],
            lostCount: outcome.lost.length,
            familyTotals: familyVMs(outcome.familyTotals),
            refinements: outcome.sets.map((family) => ({ family, ...GATHER_SET_REFINEMENTS[family] })),
            roundHarvest: outcome.roundHarvest,
            coinNotes,
            vitaeNotes,
            scarNote: outcome.scarred ? '☠ THE DESPOILER’S SCAR — the wild remembers your hand' : null,
            boons: outcome.boons.map((b) => ({
                id: b.id,
                name: b.name,
                desc: b.desc,
                status: b.status,
                rewardLabel: boonRewardLabel(b.reward),
            })),
            boonNote: boonSegs.length ? `${boonSegs.join(' · ')} — boons` : null,
            confirmLabel: outcome.kept.length > 0 ? 'BIND THE SATCHEL ›' : 'WALK ON ›',
        };
    }

    const satchelTotals = gatheringFamilyTotals(session.satchel);

    return {
        active: true,
        phase: session.phase,
        siteId: session.siteId,
        sessionSeed: session.seed,
        title: site.title,
        scenario: site.scenario,
        intro: site.intro,
        boardHeadline: site.boardHeadline,
        boardNote: session.approach === null ? '' : isStrip ? site.stripBoardNote : site.gleanBoardNote,
        approachKey: session.approach,
        approachLabel:
            session.approach === null ? '' : GATHER_APPROACH_COPY[session.approach].name,
        approachChoices: session.phase === 'approach-select' ? approachChoices() : [],
        depthIndex: session.depth,
        depthCount: 3,
        depthName: site.depthNames[session.depth],
        depthNames: [...site.depthNames],
        canDescend: session.phase === 'foraging' && session.depth < 2,
        bagCount: session.bags[session.depth].length,
        turn: session.turn,
        duskNote: duskFallen ? 'DUSK FALLS — every taking angers it one more' : null,
        wrath: {
            value: session.wrath,
            max: GATHER_WRATH_MAX,
            thresholds: GATHER_WRATH_THRESHOLDS.map((at, i) => ({
                at,
                fired: session.thresholdsFired[i] === true,
            })),
            ratio: session.wrath / GATHER_WRATH_MAX,
            duskFallen,
            watcherWoken: session.watcherWoken,
            mired: session.mired,
            sickled: session.sickled,
        },
        grace: session.grace,
        graceNote: session.grace > 0 ? `GRACE ${session.grace} — the place is listening` : null,
        spread,
        satchelCount: session.satchel.length,
        satchelRichness: session.satchel.reduce((sum, p) => sum + p.richness, 0),
        satchelFamilies: familyVMs(satchelTotals),
        offerings,
        tools,
        boons,
        withdrawEnabled: session.phase === 'foraging',
        withdrawLabel: 'WITHDRAW',
        withdrawSubLabel:
            session.satchel.length === 0 ? 'LEAVE EMPTY-HANDED' : `KEEP ${session.satchel.length} PIECES`,
        reprisalFlash: session.phase === 'reprisal' && flashEvent ? reprisalFlashVM(flashEvent) : null,
        outcome:
            outcome && final
                ? {
                      tier: outcome.tier,
                      word: OUTCOME_COPY[outcome.tier].word,
                      sub: OUTCOME_COPY[outcome.tier].sub,
                      line: OUTCOME_COPY[outcome.tier].line,
                      ctaLabel: OUTCOME_COPY[outcome.tier].cta,
                  }
                : null,
        spoils: session.phase === 'rewards' || session.phase === 'done' ? spoils : null,
    };
}

/** True while a gathering session is active — drives `<GatheringGate>`. */
export function selectHasActiveGathering(state: Pick<AppStoreState, 'gathering'>): boolean {
    return state.gathering?.session != null;
}
