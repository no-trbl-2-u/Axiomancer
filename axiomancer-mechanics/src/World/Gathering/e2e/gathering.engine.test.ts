/**
 * Gathering ("The Gleaning") engine — hermetic unit suite. Seeded RNG
 * only; no timers, no network, no Math.random.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    acknowledgeGatheringOutcome,
    canPayGatheringOffering,
    claimGatheringSpoils,
    continueGatheringAfterReprisal,
    createGatheringSession,
    descendGathering,
    gatheringBoonStatus,
    gatheringDuskFallen,
    gatheringFamilyTotals,
    gatheringHarvestWrath,
    gatheringHarvestYield,
    gatheringTierOf,
    harvestGatheringPlot,
    payGatheringOffering,
    selectGatheringApproach,
    useGatheringTool,
    withdrawFromGathering,
} from '../gathering.engine';
import {
    GATHERING_BOONS,
    GATHERING_OFFERINGS,
    GATHERING_PLOTS,
    GATHERING_SITES,
    GATHERING_TOOLS,
    getGatherPlotDef,
} from '../gathering.content';
import {
    GATHER_DUSK_AFTER,
    GATHER_SPREAD_SIZE,
    GATHER_WRATH_MAX,
    GATHER_WRATH_THRESHOLDS,
    GATHERING_TUNING,
} from '../gathering.tuning';
import {
    EMPTY_GATHER_METRICS,
    type GatherFamily,
    type GatherPiece,
    type GatherPlotEntry,
    type GatheringSessionState,
} from '../gathering.types';

const SITE_ID = 'mire-mint';

afterEach(() => {
    vi.restoreAllMocks();
});

function freshSession(seed = 7): GatheringSessionState {
    return createGatheringSession(seed, SITE_ID);
}

function foraging(seed = 7, approach: 'glean' | 'strip' = 'glean'): GatheringSessionState {
    return selectGatheringApproach(freshSession(seed), approach);
}

/** Force a deterministic arrangement for targeted scenarios. */
function rig(s: GatheringSessionState, over: Partial<GatheringSessionState>): GatheringSessionState {
    return { ...s, ...over };
}

function plot(uid: string, plotId: string): GatherPlotEntry {
    return { uid, plotId };
}

function piece(uid: string, plotId: string, family: GatherFamily, richness: number): GatherPiece {
    return { uid, plotId, family, richness, name: 'piece' };
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

describe('gathering session lifecycle', () => {
    it('opens in approach-select with the verge spread face-up', () => {
        const s = freshSession();
        expect(s.phase).toBe('approach-select');
        expect(s.spread).toHaveLength(GATHER_SPREAD_SIZE);
        expect(s.depth).toBe(0);
        expect(s.wrath).toBe(0);
        expect(s.satchel).toHaveLength(0);
        expect(s.offerings).toHaveLength(GATHERING_TUNING.offerings.pickCount);
        expect(s.tools).toHaveLength(GATHERING_TUNING.tools.pickCount);
        expect(s.boons).toHaveLength(GATHERING_TUNING.boons.pickCount);
    });

    it('is deterministic for a fixed seed', () => {
        const a = createGatheringSession(42, SITE_ID);
        const b = createGatheringSession(42, SITE_ID);
        expect(a).toEqual(b);
    });

    it('different seeds produce different bags', () => {
        const a = createGatheringSession(1, SITE_ID);
        const b = createGatheringSession(2, SITE_ID);
        expect(a.bags).not.toEqual(b.bags);
    });

    it('GLEAN starts with grace; STRIP starts without', () => {
        expect(foraging(7, 'glean').grace).toBe(GATHERING_TUNING.approaches.glean.startGrace);
        expect(foraging(7, 'strip').grace).toBe(0);
    });

    it('approach choice is binding (no re-select)', () => {
        const s = foraging();
        expect(selectGatheringApproach(s, 'strip')).toBe(s);
    });

    it('every site has three populated strata of known plots', () => {
        for (const site of GATHERING_SITES) {
            expect(site.depths).toHaveLength(3);
            for (const roster of site.depths) {
                expect(roster.length).toBeGreaterThan(0);
                for (const entry of roster) {
                    expect(() => getGatherPlotDef(entry.plotId)).not.toThrow();
                }
            }
        }
    });
});

// ---------------------------------------------------------------------------
// Harvest math
// ---------------------------------------------------------------------------

describe('harvest', () => {
    it('a taking yields a piece, raises wrath, advances the turn, and refills the spread', () => {
        const s = rig(foraging(), { spread: [plot('a', 'widow-moss'), plot('b', 'wax-shelf'), plot('c', 'salt-lace')] });
        const next = harvestGatheringPlot(s, 'a');
        expect(next.satchel).toHaveLength(1);
        expect(next.satchel[0].family).toBe('bloom');
        expect(next.satchel[0].richness).toBe(2);
        expect(next.wrath).toBe(getGatherPlotDef('widow-moss').wrath);
        expect(next.turn).toBe(1);
        expect(next.spread).toHaveLength(GATHER_SPREAD_SIZE);
        expect(next.spread.find((p) => p.uid === 'a')).toBeUndefined();
    });

    it('GLEAN caps yields at the richness cap', () => {
        const s = rig(foraging(7, 'glean'), { spread: [plot('a', 'kings-rue')] });
        const next = harvestGatheringPlot(s, 'a');
        expect(next.satchel[0].richness).toBe(GATHERING_TUNING.approaches.glean.richnessCap);
    });

    it('STRIP adds +1 richness and +1 wrath per taking', () => {
        const def = getGatherPlotDef('widow-moss');
        const s = rig(foraging(7, 'strip'), { spread: [plot('a', 'widow-moss')] });
        const next = harvestGatheringPlot(s, 'a');
        expect(next.satchel[0].richness).toBe(def.richness + 1);
        expect(next.wrath).toBe(def.wrath + 1);
    });

    it('GIFT plots cost no wrath', () => {
        const s = rig(foraging(), { spread: [plot('a', 'mint-crown')] });
        expect(harvestGatheringPlot(s, 'a').wrath).toBe(0);
    });

    it('BREATH tends instead of taking: no piece, no turn, wrath eases', () => {
        const s = rig(foraging(), { wrath: 5, thresholdsFired: [true, false], spread: [plot('a', 'green-breath')] });
        const next = harvestGatheringPlot(s, 'a');
        expect(next.satchel).toHaveLength(0);
        expect(next.turn).toBe(0);
        expect(next.wrath).toBe(5 - GATHERING_TUNING.plots.breathRelief);
        expect(next.metrics.breathsTended).toBe(1);
    });

    it('BREATH ignores stance and dusk surcharges', () => {
        const dusk = rig(foraging(7, 'strip'), { turn: GATHER_DUSK_AFTER, wrath: 6, thresholdsFired: [true, false] });
        const def = getGatherPlotDef('green-breath');
        expect(gatheringHarvestWrath(dusk, def)).toBe(def.wrath);
        expect(gatheringHarvestYield(dusk, def)).toBe(0);
    });

    it('TANGLE tramples the rest of the spread (full redraw)', () => {
        const s = rig(foraging(), { spread: [plot('a', 'star-grit'), plot('b', 'wax-shelf'), plot('c', 'salt-lace')] });
        const next = harvestGatheringPlot(s, 'a');
        expect(next.spread.find((p) => p.uid === 'b')).toBeUndefined();
        expect(next.spread.find((p) => p.uid === 'c')).toBeUndefined();
        expect(next.spread.length).toBeGreaterThan(0);
    });

    it('dusk falls after the configured taking count: +1 wrath', () => {
        const def = getGatherPlotDef('widow-moss');
        const before = rig(foraging(), { turn: GATHER_DUSK_AFTER - 1 });
        const after = rig(foraging(), { turn: GATHER_DUSK_AFTER });
        expect(gatheringDuskFallen(before)).toBe(false);
        expect(gatheringDuskFallen(after)).toBe(true);
        expect(gatheringHarvestWrath(after, def)).toBe(gatheringHarvestWrath(before, def) + 1);
    });

    it('harvest is refused outside foraging and for unknown plots', () => {
        const s = freshSession();
        expect(harvestGatheringPlot(s, s.spread[0]?.uid ?? 'x')).toBe(s);
        const f = foraging();
        expect(harvestGatheringPlot(f, 'nope')).toBe(f);
    });

    it('root-depth takings are tracked for the ROOT-DELVER boon', () => {
        const s = rig(foraging(), { depth: 2, spread: [plot('a', 'quick-water')] });
        expect(harvestGatheringPlot(s, 'a').metrics.rootHarvests).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// Wrath thresholds, reprisals, eruption
// ---------------------------------------------------------------------------

describe('wrath and reprisals', () => {
    it('crossing a threshold draws a reprisal and enters the reprisal phase', () => {
        const s = rig(foraging(), {
            wrath: GATHER_WRATH_THRESHOLDS[0] - 1,
            spread: [plot('a', 'widow-moss')],
            reprisalDeck: ['mire', 'thorns', 'rot', 'watcher'],
        });
        const next = harvestGatheringPlot(s, 'a');
        expect(next.phase).toBe('reprisal');
        expect(next.pendingReprisals[0].kind).toBe('mire');
        expect(next.mired).toBe(true);
        expect(next.thresholdsFired[0]).toBe(true);
        expect(next.metrics.reprisalsSuffered).toBe(1);
    });

    it('a fired threshold never re-fires after wrath falls and re-crosses', () => {
        let s = rig(foraging(), {
            wrath: GATHER_WRATH_THRESHOLDS[0] - 1,
            spread: [plot('a', 'widow-moss'), plot('b', 'green-breath'), plot('c', 'widow-moss')],
            reprisalDeck: ['mire', 'thorns', 'rot', 'watcher'],
            bags: [[], [], []],
        });
        s = harvestGatheringPlot(s, 'a');
        s = continueGatheringAfterReprisal(s);
        s = harvestGatheringPlot(s, 'b'); // breath: wrath back below the line
        expect(s.wrath).toBeLessThan(GATHER_WRATH_THRESHOLDS[0]);
        s = { ...s, mired: false };
        s = harvestGatheringPlot(s, 'c'); // re-cross
        expect(s.phase).toBe('foraging');
        expect(s.pendingReprisals).toHaveLength(0);
    });

    it('THORNS bites vitae (accrued, settled at claim)', () => {
        const s = rig(foraging(), {
            wrath: GATHER_WRATH_THRESHOLDS[0] - 1,
            spread: [plot('a', 'widow-moss')],
            reprisalDeck: ['thorns'],
        });
        const next = harvestGatheringPlot(s, 'a');
        expect(next.bittenVitae).toBe(GATHERING_TUNING.reprisals.thornsBite);
        expect(next.pendingReprisals[0]).toMatchObject({ kind: 'thorns', bite: GATHERING_TUNING.reprisals.thornsBite });
    });

    it('ROT spoils the fullest family, lowest richness first', () => {
        const satchel = [
            piece('s1', 'widow-moss', 'bloom', 2),
            piece('s2', 'mint-crown', 'bloom', 1),
            piece('s3', 'fever-bell', 'bloom', 2),
            piece('s4', 'amber-weep', 'resin', 2),
        ];
        const s = rig(foraging(), {
            wrath: GATHER_WRATH_THRESHOLDS[0] - 1,
            satchel,
            spread: [plot('a', 'widow-moss')],
            reprisalDeck: ['rot'],
        });
        const next = harvestGatheringPlot(s, 'a');
        // bloom counts 3 pre-harvest + the new bloom piece = 4 → lose 2.
        const event = next.pendingReprisals[0];
        expect(event.kind).toBe('rot');
        expect(event.rotFamily).toBe('bloom');
        expect(event.rotLost).toBe(2);
        expect(next.satchel.find((p) => p.uid === 's2')).toBeUndefined();
    });

    it('the SEALED JAR absorbs a rot (not counted as suffered)', () => {
        const s = rig(foraging(), {
            wrath: GATHER_WRATH_THRESHOLDS[0] - 1,
            satchel: [piece('s1', 'widow-moss', 'bloom', 2)],
            spread: [plot('a', 'widow-moss')],
            reprisalDeck: ['rot'],
            jarCharges: 1,
        });
        const next = harvestGatheringPlot(s, 'a');
        expect(next.pendingReprisals[0]).toMatchObject({ kind: 'rot', jarHeld: true });
        expect(next.jarCharges).toBe(0);
        expect(next.satchel.length).toBe(s.satchel.length + 1);
        expect(next.metrics.reprisalsSuffered).toBe(0);
    });

    it('the ASHEN VEIL consumes a crossing without a draw', () => {
        const s = rig(foraging(), {
            wrath: GATHER_WRATH_THRESHOLDS[0] - 1,
            spread: [plot('a', 'widow-moss')],
            reprisalDeck: ['thorns'],
            veilCharges: 1,
        });
        const next = harvestGatheringPlot(s, 'a');
        expect(next.pendingReprisals[0].kind).toBe('veiled');
        expect(next.veilCharges).toBe(0);
        expect(next.bittenVitae).toBe(0);
        expect(next.reprisalDeck).toEqual(['thorns']);
        expect(next.metrics.reprisalsSuffered).toBe(0);
        expect(next.thresholdsFired[0]).toBe(true);
    });

    it('THE WARDEN WAKES: every later taking costs +1 wrath', () => {
        const s = rig(foraging(), { watcherWoken: true });
        const def = getGatherPlotDef('widow-moss');
        expect(gatheringHarvestWrath(s, def)).toBe(def.wrath + 1);
    });

    it('filling the meter erupts the site and supersedes threshold draws', () => {
        const s = rig(foraging(), {
            wrath: GATHER_WRATH_MAX - 1,
            satchel: [piece('s1', 'widow-moss', 'bloom', 2), piece('s2', 'amber-weep', 'resin', 2)],
            spread: [plot('a', 'kings-rue')],
            thresholdsFired: [true, false],
        });
        const next = harvestGatheringPlot(s, 'a');
        expect(next.erupted).toBe(true);
        expect(next.phase).toBe('reprisal');
        expect(next.pendingReprisals[0].kind).toBe('eruption');
        const after = continueGatheringAfterReprisal(next);
        expect(after.phase).toBe('outcome');
        expect(after.outcome?.tier).toBe('routed');
    });

    it('eruption claws back richest-first at the approach fraction', () => {
        const satchel = [
            piece('s1', 'a', 'bloom', 3),
            piece('s2', 'b', 'resin', 1),
            piece('s3', 'c', 'vein', 2),
        ];
        const s = rig(foraging(7, 'glean'), { satchel, erupted: true, wrath: GATHER_WRATH_MAX });
        const out = continueGatheringAfterReprisal(
            rig(s, { phase: 'reprisal', pendingReprisals: [{ kind: 'eruption' }] }),
        );
        // glean: ceil(3 × 1/3) = 1 lost, the richest piece.
        expect(out.outcome?.lost.map((p) => p.uid)).toEqual(['s1']);
        expect(out.outcome?.kept).toHaveLength(2);
    });

    it('actions are refused during the reprisal phase', () => {
        const s = rig(foraging(), { phase: 'reprisal', pendingReprisals: [{ kind: 'mire' }] });
        expect(harvestGatheringPlot(s, s.spread[0]?.uid ?? 'x')).toBe(s);
        expect(descendGathering(s)).toBe(s);
        expect(withdrawFromGathering(s)).toBe(s);
        expect(useGatheringTool(s, 'bell')).toBe(s);
    });
});

// ---------------------------------------------------------------------------
// Offerings
// ---------------------------------------------------------------------------

describe('offerings', () => {
    it('a shilling demand accrues coin, eases wrath, grows grace, and pays once', () => {
        const s = rig(foraging(), { wrath: 6, thresholdsFired: [true, false], offerings: [{ id: 'coin-toll', paid: false }] });
        const next = payGatheringOffering(s, 'coin-toll');
        expect(next.offeringShillings).toBe(GATHERING_TUNING.offerings.shillings);
        expect(next.wrath).toBe(6 - GATHERING_TUNING.offerings.wrathRelief);
        expect(next.grace).toBe(s.grace + 1);
        expect(next.offerings[0].paid).toBe(true);
        expect(payGatheringOffering(next, 'coin-toll')).toBe(next);
    });

    it('a vitae demand accrues blood', () => {
        const s = rig(foraging(), { offerings: [{ id: 'blood-tithe', paid: false }] });
        expect(payGatheringOffering(s, 'blood-tithe').offeringVitae).toBe(GATHERING_TUNING.offerings.vitae);
    });

    it('a material demand surrenders the least-rich piece of that family', () => {
        const s = rig(foraging(), {
            satchel: [piece('s1', 'widow-moss', 'bloom', 2), piece('s2', 'mint-crown', 'bloom', 1)],
            offerings: [{ id: 'first-green', paid: false }],
        });
        const next = payGatheringOffering(s, 'first-green');
        expect(next.satchel.map((p) => p.uid)).toEqual(['s1']);
    });

    it('a material demand is refused without a piece of the family', () => {
        const s = rig(foraging(), { satchel: [], offerings: [{ id: 'first-green', paid: false }] });
        expect(payGatheringOffering(s, 'first-green')).toBe(s);
        expect(canPayGatheringOffering(s, 'first-green').payable).toBe(false);
    });

    it('wrath relief floors at zero', () => {
        const s = rig(foraging(), { wrath: 1, offerings: [{ id: 'coin-toll', paid: false }] });
        expect(payGatheringOffering(s, 'coin-toll').wrath).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

describe('field tools', () => {
    it('HORN SICKLE zeros the next taking and is consumed by it', () => {
        const tools = [{ id: 'sickle' as const, used: false }];
        let s = rig(foraging(), { tools, spread: [plot('a', 'kings-rue')] });
        s = useGatheringTool(s, 'sickle');
        expect(s.sickled).toBe(true);
        const def = getGatherPlotDef('kings-rue');
        expect(gatheringHarvestWrath(s, def)).toBe(0);
        s = harvestGatheringPlot(s, 'a');
        expect(s.wrath).toBe(0);
        expect(s.sickled).toBe(false);
    });

    it("WARDEN'S BELL eases wrath immediately", () => {
        const s = rig(foraging(), { wrath: 5, thresholdsFired: [true, false], tools: [{ id: 'bell', used: false }] });
        expect(useGatheringTool(s, 'bell').wrath).toBe(5 - GATHERING_TUNING.tools.bellRelief);
    });

    it('DOWSING TWIG redraws the spread', () => {
        const s = rig(foraging(), { tools: [{ id: 'twig', used: false }] });
        const before = s.spread.map((p) => p.uid);
        const next = useGatheringTool(s, 'twig');
        expect(next.spread.map((p) => p.uid)).not.toEqual(before);
        expect(next.spread).toHaveLength(GATHER_SPREAD_SIZE);
    });

    it('GRAVE SPADE widens the spread', () => {
        const s = rig(foraging(), { tools: [{ id: 'spade', used: false }] });
        const next = useGatheringTool(s, 'spade');
        expect(next.spread).toHaveLength(GATHER_SPREAD_SIZE + GATHERING_TUNING.tools.spadeReveal);
    });

    it('tools are one-use', () => {
        const s = rig(foraging(), { wrath: 5, thresholdsFired: [true, false], tools: [{ id: 'bell', used: false }] });
        const used = useGatheringTool(s, 'bell');
        expect(useGatheringTool(used, 'bell')).toBe(used);
    });

    it('the MIRE surcharge applies once and is cleared by the next taking', () => {
        let s = rig(foraging(), { mired: true, spread: [plot('a', 'widow-moss'), plot('b', 'widow-moss')] });
        const def = getGatherPlotDef('widow-moss');
        expect(gatheringHarvestWrath(s, def)).toBe(def.wrath + GATHERING_TUNING.tools.mireSurcharge);
        s = harvestGatheringPlot(s, 'a');
        expect(s.mired).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Depth
// ---------------------------------------------------------------------------

describe('depth', () => {
    it('descending is one-way and redraws the spread from the deeper bag', () => {
        const s = foraging();
        const down = descendGathering(s);
        expect(down.depth).toBe(1);
        expect(down.spread).toHaveLength(GATHER_SPREAD_SIZE);
        const root = descendGathering(down);
        expect(root.depth).toBe(2);
        expect(descendGathering(root)).toBe(root);
    });
});

// ---------------------------------------------------------------------------
// Outcome
// ---------------------------------------------------------------------------

describe('outcome', () => {
    it('withdrawing computes the outcome and enters the outcome phase', () => {
        const s = rig(foraging(), { satchel: [piece('s1', 'widow-moss', 'bloom', 2)] });
        const next = withdrawFromGathering(s);
        expect(next.phase).toBe('outcome');
        expect(next.outcome?.tier).toBe('laden');
        expect(next.outcome?.kept).toHaveLength(1);
    });

    it('COMMUNION needs grace, low wrath, and a non-empty satchel', () => {
        expect(gatheringTierOf({ erupted: false, grace: 2, wrath: 4, satchel: [] }, 1)).toBe('communion');
        expect(gatheringTierOf({ erupted: false, grace: 2, wrath: 4, satchel: [] }, 0)).toBe('laden');
        expect(gatheringTierOf({ erupted: false, grace: 1, wrath: 2, satchel: [] }, 1)).toBe('laden');
        expect(gatheringTierOf({ erupted: false, grace: 2, wrath: 5, satchel: [] }, 1)).toBe('laden');
    });

    it('withdrawing at high wrath is DESPOILMENT (scarred)', () => {
        const s = rig(foraging(), {
            wrath: GATHERING_TUNING.outcome.despoilWrathMin,
            thresholdsFired: [true, true],
            satchel: [piece('s1', 'widow-moss', 'bloom', 2)],
        });
        const next = withdrawFromGathering(s);
        expect(next.outcome?.tier).toBe('despoiled');
        expect(next.outcome?.scarred).toBe(true);
    });

    it('a completed family set and the round harvest pay shillings', () => {
        const satchel = [
            piece('s1', 'a', 'bloom', 3),
            piece('s2', 'b', 'bloom', 3),
            piece('s3', 'c', 'resin', 1),
            piece('s4', 'd', 'vein', 1),
            piece('s5', 'e', 'bone', 1),
        ];
        const next = withdrawFromGathering(rig(foraging(), { satchel }));
        const S = GATHERING_TUNING.sets;
        expect(next.outcome?.sets).toEqual(['bloom']);
        expect(next.outcome?.roundHarvest).toBe(true);
        expect(next.outcome?.shillings).toBe(S.shillings + S.roundHarvestShillings);
    });

    it('STRIP pays plunder per kept richness', () => {
        const satchel = [piece('s1', 'a', 'bloom', 3), piece('s2', 'b', 'resin', 2)];
        const next = withdrawFromGathering(rig(foraging(7, 'strip'), { satchel }));
        expect(next.outcome?.shillings).toBe(5 * GATHERING_TUNING.approaches.strip.plunderPerRichness);
    });

    it('communion grants the blessing; routed forfeits boon bonuses', () => {
        const blessed = withdrawFromGathering(
            rig(foraging(), { grace: 2, wrath: 0, satchel: [piece('s1', 'a', 'bloom', 1)] }),
        );
        expect(blessed.outcome?.blessingVitae).toBe(GATHERING_TUNING.outcome.blessingVitae);

        const routed = continueGatheringAfterReprisal(
            rig(foraging(), {
                phase: 'reprisal',
                erupted: true,
                pendingReprisals: [{ kind: 'eruption' }],
                satchel: [piece('s1', 'a', 'bloom', 3), piece('s2', 'b', 'bloom', 3), piece('s3', 'c', 'bloom', 3)],
            }),
        );
        expect(routed.outcome?.boonShillings).toBe(0);
        expect(routed.outcome?.boonVitae).toBe(0);
        expect(routed.outcome?.boonTokens).toBe(0);
    });

    it('outcome → rewards → done, and claim is refused early', () => {
        let s = withdrawFromGathering(rig(foraging(), { satchel: [piece('s1', 'a', 'bloom', 1)] }));
        expect(claimGatheringSpoils(s)).toBe(s);
        s = acknowledgeGatheringOutcome(s);
        expect(s.phase).toBe('rewards');
        s = claimGatheringSpoils(s);
        expect(s.phase).toBe('done');
    });
});

// ---------------------------------------------------------------------------
// Boons
// ---------------------------------------------------------------------------

describe('boons', () => {
    const base = {
        wrath: 0,
        turn: 0,
        satchel: [] as GatherPiece[],
        metrics: { ...EMPTY_GATHER_METRICS },
    };

    it('LIGHT OF FOOT judges only at the end (wrath can still fall)', () => {
        expect(gatheringBoonStatus('lightfoot', { ...base, wrath: 9 }, false)).toBe('active');
        expect(gatheringBoonStatus('lightfoot', { ...base, wrath: 3 }, true)).toBe('done');
        expect(gatheringBoonStatus('lightfoot', { ...base, wrath: 4 }, true)).toBe('failed');
    });

    it('UNBITTEN fails the moment a reprisal lands', () => {
        expect(gatheringBoonStatus('unbitten', base, false)).toBe('active');
        expect(
            gatheringBoonStatus('unbitten', { ...base, metrics: { ...base.metrics, reprisalsSuffered: 1 } }, false),
        ).toBe('failed');
        expect(gatheringBoonStatus('unbitten', base, true)).toBe('done');
    });

    it('SWIFT GLEANER fails once the taking count is overstayed', () => {
        expect(gatheringBoonStatus('swift', { ...base, turn: GATHERING_TUNING.boons.swiftTurnMax }, false)).toBe('active');
        expect(gatheringBoonStatus('swift', { ...base, turn: GATHERING_TUNING.boons.swiftTurnMax + 1 }, false)).toBe('failed');
        expect(gatheringBoonStatus('swift', { ...base, turn: 2 }, true)).toBe('done');
    });

    it('THE KEEPER completes on a family set', () => {
        const satchel = [piece('s1', 'a', 'vein', 3), piece('s2', 'b', 'vein', 3)];
        expect(gatheringBoonStatus('keeper', { ...base, satchel }, false)).toBe('done');
        expect(gatheringBoonStatus('keeper', base, true)).toBe('failed');
    });

    it('family totals mark sets at the threshold', () => {
        const totals = gatheringFamilyTotals([piece('s1', 'a', 'bone', 3), piece('s2', 'b', 'bone', 3)]);
        const bone = totals.find((t) => t.family === 'bone');
        expect(bone?.set).toBe(true);
        expect(bone?.richness).toBe(6);
    });
});

// ---------------------------------------------------------------------------
// Content sanity
// ---------------------------------------------------------------------------

describe('content sanity', () => {
    it('gift plots cost no wrath; breath plots yield nothing and relieve', () => {
        for (const p of GATHERING_PLOTS) {
            if (p.trait === 'gift') expect(p.wrath).toBe(0);
            if (p.trait === 'breath') {
                expect(p.richness).toBe(0);
                expect(p.wrath).toBeLessThan(0);
            } else {
                expect(p.wrath).toBeGreaterThanOrEqual(0);
                expect(p.richness).toBeGreaterThan(0);
            }
        }
    });

    it('catalogues have unique ids', () => {
        const ids = (xs: { id: string }[]) => new Set(xs.map((x) => x.id)).size;
        expect(ids(GATHERING_PLOTS)).toBe(GATHERING_PLOTS.length);
        expect(ids(GATHERING_OFFERINGS)).toBe(GATHERING_OFFERINGS.length);
        expect(ids([...GATHERING_TOOLS])).toBe(GATHERING_TOOLS.length);
        expect(ids(GATHERING_BOONS)).toBe(GATHERING_BOONS.length);
        expect(ids(GATHERING_SITES)).toBe(GATHERING_SITES.length);
    });
});
