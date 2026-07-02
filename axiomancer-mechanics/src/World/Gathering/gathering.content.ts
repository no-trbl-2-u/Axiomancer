/**
 * Gathering Minigame ("The Gleaning") — authored content.
 *
 * Plot numbers draw their bands from `tuning.ts` (verge / hollow / root
 * richness and wrath); per-plot deviations are deliberate temptations
 * (gifts, lures, breaths) and are guarded by
 * `__tests__/balance.sim.test.ts`.
 */

import { GATHERING_TUNING } from './gathering.tuning';
import type {
    GatherBoonDef,
    GatherFamily,
    GatherOfferingDef,
    GatherPlotDef,
    GatherReprisalId,
    GatherSiteDef,
    GatherToolDef,
} from './gathering.types';

const P = GATHERING_TUNING.plots;
const B = GATHERING_TUNING.boons;
const O = GATHERING_TUNING.offerings;

// ---------------------------------------------------------------------------
// Keyword glossary (tap-to-read detail)
// ---------------------------------------------------------------------------

export type GatherKeywordId =
    | 'wrath'
    | 'grace'
    | 'gift'
    | 'lure'
    | 'breath'
    | 'tangle'
    | 'set'
    | 'offering'
    | 'dusk'
    | 'depth';

export const GATHERING_KEYWORDS: Record<GatherKeywordId, { name: string; desc: string }> = {
    wrath: { name: 'WRATH', desc: 'The site’s anger. Every taking raises it. Cross a line and the place answers; fill the meter and it erupts.' },
    grace: { name: 'GRACE', desc: 'The site’s favour. Earned by offerings. Leave with enough grace and little wrath, and the place blesses the taking.' },
    gift: { name: 'GIFT', desc: 'Offered freely — this plot costs no wrath to take.' },
    lure: { name: 'LURE', desc: 'Rich, and meant to be. The site baits the greedy hand.' },
    breath: { name: 'BREATH', desc: 'Tend instead of take: no yield, but the site’s wrath eases.' },
    tangle: { name: 'TANGLE', desc: 'Taking this tramples the rest — the other plots on offer are lost and fresh ones grow in.' },
    set: { name: 'SET', desc: 'Gather enough richness of one family and it refines into a named treasure at the weighing.' },
    offering: { name: 'OFFERING', desc: 'Pay what the place demands: wrath eases and grace grows. Each demand can be met once.' },
    dusk: { name: 'DUSK', desc: 'Linger too long and dusk falls — every taking after it angers the site one more.' },
    depth: { name: 'DEPTH', desc: 'Three strata. Descending is one-way; the deep is richer and angrier.' },
};

// ---------------------------------------------------------------------------
// The plot catalogue. richness/wrath per the tuning bands; traits are
// the authored deviations (gift = free, lure = rich + angry, breath =
// tend, tangle = trample).
// ---------------------------------------------------------------------------

export const GATHERING_PLOTS: GatherPlotDef[] = [
    // ── BLOOM — living green things ────────────────────────────────────────
    { id: 'mint-crown', name: 'MINT CROWN', yieldName: 'Mire-Mint Crown', family: 'bloom', richness: P.verge.richness.low, wrath: P.verge.wrath.low, trait: 'gift', flavor: 'It grows toward your hand. That should worry you.', },
    { id: 'widow-moss', name: "WIDOW'S MOSS", yieldName: "Widow's Moss", family: 'bloom', richness: P.verge.richness.high, wrath: P.verge.wrath.high, flavor: 'Soft as grief and twice as clinging.' },
    { id: 'fever-bell', name: 'FEVER-BELL', yieldName: 'Fever-Bell Head', family: 'bloom', richness: P.hollow.richness.high, wrath: P.hollow.wrath.low, flavor: 'Rings when nothing touches it.' },
    { id: 'kings-rue', name: "KING'S RUE", yieldName: "Sprig of King's Rue", family: 'bloom', richness: P.root.richness.high, wrath: P.root.wrath.high, trait: 'lure', flavor: 'Worth a crown. Priced like one.' },
    { id: 'green-breath', name: 'GREEN HUSH', yieldName: '', family: 'bloom', richness: 0, wrath: -P.breathRelief, trait: 'breath', flavor: 'Kneel. Pull the weeds from its throat. Take nothing.' },

    // ── RESIN — saps, ambers, waxes ───────────────────────────────────────
    { id: 'amber-weep', name: 'AMBER WEEP', yieldName: 'Amber Weeping', family: 'resin', richness: P.verge.richness.high, wrath: P.verge.wrath.high, flavor: 'The tree cries slow. You bottle it.' },
    { id: 'wax-shelf', name: 'WAX SHELF', yieldName: 'Saint-Wax Shelf', family: 'resin', richness: P.verge.richness.low, wrath: P.verge.wrath.low, flavor: 'Peels off like candle-skin.' },
    { id: 'pitch-heart', name: 'PITCH HEART', yieldName: 'Heart of Pitch', family: 'resin', richness: P.hollow.richness.high, wrath: P.hollow.wrath.high, flavor: 'Black, warm, and faintly beating.' },
    { id: 'gilt-scab', name: 'GILT SCAB', yieldName: 'Gilt Scab', family: 'resin', richness: P.root.richness.high, wrath: P.root.wrath.high, trait: 'lure', flavor: 'The wound healed over gold. Reopen it.' },
    { id: 'balm-knot', name: 'BALM KNOT', yieldName: 'Balm Knot', family: 'resin', richness: P.hollow.richness.low, wrath: 0, trait: 'gift', flavor: 'It wants to be useful. Let it.' },

    // ── VEIN — mineral waters, salts, ores ─────────────────────────────────
    { id: 'salt-lace', name: 'SALT LACE', yieldName: 'Salt Lace', family: 'vein', richness: P.verge.richness.low, wrath: P.verge.wrath.high, flavor: 'Crystals fine as widow’s veil.' },
    { id: 'cold-seam', name: 'COLD SEAM', yieldName: 'Cold-Seam Ore', family: 'vein', richness: P.hollow.richness.high, wrath: P.hollow.wrath.high, flavor: 'The rock parts along an old promise.' },
    { id: 'quick-water', name: 'QUICK-WATER', yieldName: 'Phial of Quick-Water', family: 'vein', richness: P.root.richness.low, wrath: P.root.wrath.low, flavor: 'It runs uphill when watched.' },
    { id: 'star-grit', name: 'STAR GRIT', yieldName: 'Star Grit', family: 'vein', richness: P.root.richness.high, wrath: P.root.wrath.high, trait: 'tangle', flavor: 'Dig it loose and the whole bed shifts.' },

    // ── BONE — remains, relics, chitin ────────────────────────────────────
    { id: 'knuckle-cache', name: 'KNUCKLE CACHE', yieldName: 'Knucklebone', family: 'bone', richness: P.verge.richness.high, wrath: P.verge.wrath.high, flavor: 'Somebody counted on these. Somebody lost.' },
    { id: 'molar-ring', name: 'MOLAR RING', yieldName: 'Ringed Molar', family: 'bone', richness: P.hollow.richness.low, wrath: P.hollow.wrath.low, flavor: 'A circle of teeth, planted crown-down.' },
    { id: 'marrow-comb', name: 'MARROW COMB', yieldName: 'Marrow Comb', family: 'bone', richness: P.hollow.richness.high, wrath: P.hollow.wrath.high, trait: 'tangle', flavor: 'Crack it open and the hollow knows.' },
    { id: 'saints-finger', name: "SAINT'S FINGER", yieldName: "Saint's Finger", family: 'bone', richness: P.root.richness.high, wrath: P.root.wrath.high, trait: 'lure', flavor: 'Still pointing. Stop asking at what.' },
    { id: 'bone-breath', name: 'QUIET RITE', yieldName: '', family: 'bone', richness: 0, wrath: -P.breathRelief, trait: 'breath', flavor: 'Set the small bones straight. Say the half-prayer.' },
];

export function getGatherPlotDef(id: string): GatherPlotDef {
    const def = GATHERING_PLOTS.find((p) => p.id === id);
    if (!def) throw new Error(`Unknown gathering plot: ${id}`);
    return def;
}

// ---------------------------------------------------------------------------
// Set refinements — what a completed family set becomes at the weighing.
// ---------------------------------------------------------------------------

export const GATHER_SET_REFINEMENTS: Record<GatherFamily, { id: string; name: string; desc: string }> = {
    bloom: { id: 'refine-bloom', name: 'Tincture of the Green Hour', desc: 'Every gathered green thing, distilled to one swallow of spring.' },
    resin: { id: 'refine-resin', name: 'Saint-Wax Seal', desc: 'Amber and pitch pressed into a seal that keeps what it closes.' },
    vein: { id: 'refine-vein', name: 'Quicksilver Phial', desc: 'Salts and cold ore settled into restless silver.' },
    bone: { id: 'refine-bone', name: 'Knucklebone Rosary', desc: 'The site’s dead, strung in order, counting for you now.' },
};

// ---------------------------------------------------------------------------
// Offerings (the demands a site may make)
// ---------------------------------------------------------------------------

export const GATHERING_OFFERINGS: GatherOfferingDef[] = [
    { id: 'coin-toll', name: 'THE COIN TOLL', demand: { kind: 'shillings', amount: O.shillings }, flavor: 'Bury the shillings at the threshold. The ground counts them.' },
    { id: 'blood-tithe', name: 'THE BLOOD TITHE', demand: { kind: 'vitae', amount: O.vitae }, flavor: 'A red thumbprint on the oldest stone.' },
    { id: 'first-green', name: 'THE FIRST GREEN', demand: { kind: 'material', family: 'bloom' }, flavor: 'Return the first living thing you took.' },
    { id: 'sweet-smoke', name: 'THE SWEET SMOKE', demand: { kind: 'material', family: 'resin' }, flavor: 'Burn something precious and let the place breathe it.' },
    { id: 'salt-due', name: 'THE SALT DUE', demand: { kind: 'material', family: 'vein' }, flavor: 'Salt poured back into the seam it came from.' },
    { id: 'last-rites', name: 'THE LAST RITES', demand: { kind: 'material', family: 'bone' }, flavor: 'One of the dead, reburied properly.' },
];

export function getGatherOfferingDef(id: string): GatherOfferingDef {
    const def = GATHERING_OFFERINGS.find((o) => o.id === id);
    if (!def) throw new Error(`Unknown gathering offering: ${id}`);
    return def;
}

// ---------------------------------------------------------------------------
// Field tools (one-use)
// ---------------------------------------------------------------------------

export const GATHERING_TOOLS: GatherToolDef[] = [
    { id: 'sickle', name: 'HORN SICKLE', desc: 'Your next taking costs no wrath.', flavor: 'Cut clean and the place feels nothing.' },
    { id: 'veil', name: 'ASHEN VEIL', desc: 'The next reprisal passes you by.', flavor: 'Ash on the brow. The site forgets your face.' },
    { id: 'twig', name: 'DOWSING TWIG', desc: 'Cast away the plots on offer; fresh ones grow in.', flavor: 'It pulls toward better. Or hungrier.' },
    { id: 'bell', name: "WARDEN'S BELL", desc: 'Ring it: the site’s wrath eases at once.', flavor: 'A small apology, cast in bronze.' },
    { id: 'jar', name: 'SEALED JAR', desc: 'Holds the satchel safe through one rot.', flavor: 'Wax-shut. Nothing gets in. Nothing leaks out.' },
    { id: 'spade', name: 'GRAVE SPADE', desc: 'Turn more ground: extra plots join the spread.', flavor: 'It has opened things best left shut.' },
];

export function getGatherToolDef(id: string): GatherToolDef {
    const def = GATHERING_TOOLS.find((t) => t.id === id);
    if (!def) throw new Error(`Unknown gathering tool: ${id}`);
    return def;
}

// ---------------------------------------------------------------------------
// Reprisals (display copy; magnitudes in tuning)
// ---------------------------------------------------------------------------

export const GATHERING_REPRISAL_ORDER: readonly GatherReprisalId[] = ['thorns', 'rot', 'mire', 'watcher'];

export const GATHERING_REPRISALS: Record<GatherReprisalId | 'eruption' | 'veiled', { name: string; desc: string }> = {
    thorns: { name: "THE BRIAR'S TOLL", desc: 'The undergrowth closes on your arms and takes its red due.' },
    rot: { name: 'THE SOFT DECAY', desc: 'Your fullest pocket blooms grey. Part of the harvest spoils.' },
    mire: { name: 'THE CLINGING MIRE', desc: 'The ground sucks at your boots — the next taking costs dear.' },
    watcher: { name: 'THE WARDEN WAKES', desc: 'Something old opens one eye. Every taking angers it more now.' },
    eruption: { name: 'THE SITE ERUPTS', desc: 'The place rises against you and claws back what it can.' },
    veiled: { name: 'THE VEIL HOLDS', desc: 'The site’s anger passes over you like weather.' },
};

// ---------------------------------------------------------------------------
// Boons (rolled objectives)
// ---------------------------------------------------------------------------

export const GATHERING_BOONS: GatherBoonDef[] = [
    { id: 'lightfoot', name: 'LIGHT OF FOOT', desc: `Leave with wrath at ${B.lightfootWrathMax} or less.`, reward: { kind: 'shillings', amount: B.shillings } },
    { id: 'devout', name: 'THE DEVOUT', desc: `Pay ${B.devoutCount} offerings.`, reward: { kind: 'vitae', amount: B.vitae } },
    { id: 'keeper', name: 'THE KEEPER', desc: 'Complete a family set.', reward: { kind: 'token', amount: B.token } },
    { id: 'unbitten', name: 'UNBITTEN', desc: 'Suffer no reprisal.', reward: { kind: 'shillings', amount: B.shillings } },
    { id: 'root-delver', name: 'ROOT-DELVER', desc: `Take ${B.rootDelverCount}+ harvests at root depth.`, reward: { kind: 'token', amount: B.token } },
    { id: 'swift', name: 'SWIFT GLEANER', desc: `Leave within ${B.swiftTurnMax} takings.`, reward: { kind: 'shillings', amount: B.shillingsSmall } },
];

export function getGatherBoonDef(id: string): GatherBoonDef {
    const def = GATHERING_BOONS.find((b) => b.id === id);
    if (!def) throw new Error(`Unknown gathering boon: ${id}`);
    return def;
}

// ---------------------------------------------------------------------------
// Approach copy (rules live in tuning.approaches)
// ---------------------------------------------------------------------------

export const GATHER_APPROACH_COPY = {
    glean: {
        name: 'THE TENDER HAND',
        badge: 'RESTRAINT',
        desc: 'Take lightly and the place may not notice. Nothing you pull comes up whole — but you start in its favour, and if it turns on you, it takes less back.',
        ctaLabel: 'GLEAN LIGHTLY ›',
        rewardLabel: 'Begin with grace · gentler eruption',
        costLabel: 'Yields capped at 2 per taking',
    },
    strip: {
        name: 'THE STRIPPING HAND',
        badge: 'GREED',
        desc: 'Tear it out by the roots. Every taking comes up richer and every kept piece weighs out as coin — but the place feels each one, and when it erupts, it erupts on a thief.',
        ctaLabel: 'STRIP THE SITE ›',
        rewardLabel: '+1 richness per taking · plunder coin',
        costLabel: '+1 wrath per taking · harsher eruption',
    },
} as const;

// ---------------------------------------------------------------------------
// Sites
// ---------------------------------------------------------------------------

export const GATHERING_SITES: GatherSiteDef[] = [
    {
        id: 'mire-mint',
        title: 'A STAND OF MIRE-MINT',
        scenario: 'The marsh opens on a stand of mint nobody planted, green past reason, breathing cold sweetness over black water.',
        intro: 'Nothing this green grows here by accident. The mint watches you wade closer, and the water under it is very, very still. Take what you need. Decide what you need very carefully.',
        boardHeadline: 'THE MINT BREATHES. THE WATER WAITS.',
        depthNames: ['THE VERGE', 'THE WET HOLLOW', 'THE ROOT-CELLAR'],
        gleanBoardNote: 'pinch leaves, leave the crowns',
        stripBoardNote: 'rip the beds out whole',
        gleanDesc: 'Pinch what the stand can spare.',
        stripDesc: 'Tear the beds up, roots and all.',
        depths: [
            [
                { plotId: 'mint-crown', weight: 3 },
                { plotId: 'widow-moss', weight: 3 },
                { plotId: 'wax-shelf', weight: 2 },
                { plotId: 'salt-lace', weight: 2 },
                { plotId: 'green-breath', weight: 2 },
                { plotId: 'knuckle-cache', weight: 1 },
            ],
            [
                { plotId: 'fever-bell', weight: 3 },
                { plotId: 'balm-knot', weight: 2 },
                { plotId: 'cold-seam', weight: 2 },
                { plotId: 'molar-ring', weight: 2 },
                { plotId: 'green-breath', weight: 1 },
                { plotId: 'marrow-comb', weight: 1 },
            ],
            [
                { plotId: 'kings-rue', weight: 3 },
                { plotId: 'quick-water', weight: 2 },
                { plotId: 'star-grit', weight: 2 },
                { plotId: 'gilt-scab', weight: 1 },
                { plotId: 'saints-finger', weight: 1 },
                { plotId: 'bone-breath', weight: 1 },
            ],
        ],
    },
    {
        id: 'bone-orchard',
        title: 'THE BONE ORCHARD',
        scenario: 'Fruit trees grown through an old battlefield, roots laced white. The apples are sweet. The ground remembers.',
        intro: 'The trees here ate a war and grew fat on it. Every root threads a ribcage; every windfall lands on someone. The orchard does not mind sharing. It minds being robbed.',
        boardHeadline: 'THE TREES ATE A WAR. THEY REMEMBER MANNERS.',
        depthNames: ['THE WINDFALL ROW', 'AMONG THE TRUNKS', 'UNDER THE ROOTS'],
        gleanBoardNote: 'take the windfalls only',
        stripBoardNote: 'shake the trees, dig the roots',
        gleanDesc: 'Gather what the orchard drops.',
        stripDesc: 'Shake the boughs and dig beneath.',
        depths: [
            [
                { plotId: 'knuckle-cache', weight: 3 },
                { plotId: 'widow-moss', weight: 2 },
                { plotId: 'amber-weep', weight: 2 },
                { plotId: 'wax-shelf', weight: 2 },
                { plotId: 'bone-breath', weight: 2 },
                { plotId: 'mint-crown', weight: 1 },
            ],
            [
                { plotId: 'molar-ring', weight: 3 },
                { plotId: 'marrow-comb', weight: 2 },
                { plotId: 'pitch-heart', weight: 2 },
                { plotId: 'fever-bell', weight: 2 },
                { plotId: 'bone-breath', weight: 1 },
                { plotId: 'cold-seam', weight: 1 },
            ],
            [
                { plotId: 'saints-finger', weight: 3 },
                { plotId: 'gilt-scab', weight: 2 },
                { plotId: 'star-grit', weight: 2 },
                { plotId: 'kings-rue', weight: 1 },
                { plotId: 'quick-water', weight: 1 },
                { plotId: 'green-breath', weight: 1 },
            ],
        ],
    },
    {
        id: 'weeping-pines',
        title: 'THE WEEPING PINES',
        scenario: 'A grove of pines bled for generations, trunks scarred with old tap-cuts, amber hanging like lanterns in the dark.',
        intro: 'Whoever tapped these trees first did it politely, and the grove let them. Whoever did it last did not, and the grove kept their tools. The amber glows like it is lit from inside. It is.',
        boardHeadline: 'EVERY SCAR HERE WAS PAID FOR. MOSTLY.',
        depthNames: ['THE OUTER RING', 'THE SCARRED HEART', 'THE OLD TAPS'],
        gleanBoardNote: 'catch what already weeps',
        stripBoardNote: 'cut new wounds for the sap',
        gleanDesc: 'Bottle the weep that already runs.',
        stripDesc: 'Open new cuts and bleed the grove.',
        depths: [
            [
                { plotId: 'wax-shelf', weight: 3 },
                { plotId: 'amber-weep', weight: 3 },
                { plotId: 'mint-crown', weight: 2 },
                { plotId: 'salt-lace', weight: 2 },
                { plotId: 'green-breath', weight: 2 },
            ],
            [
                { plotId: 'balm-knot', weight: 3 },
                { plotId: 'pitch-heart', weight: 3 },
                { plotId: 'fever-bell', weight: 2 },
                { plotId: 'molar-ring', weight: 1 },
                { plotId: 'green-breath', weight: 1 },
                { plotId: 'cold-seam', weight: 1 },
            ],
            [
                { plotId: 'gilt-scab', weight: 3 },
                { plotId: 'star-grit', weight: 2 },
                { plotId: 'quick-water', weight: 2 },
                { plotId: 'saints-finger', weight: 1 },
                { plotId: 'kings-rue', weight: 1 },
                { plotId: 'bone-breath', weight: 1 },
            ],
        ],
    },
    {
        id: 'drowned-garden',
        title: 'THE DROWNED GARDEN',
        scenario: 'Terraced beds swallowed by the tide and given back twice a day, still in rows, still tended — by something.',
        intro: 'The rows are weeded. The beds are turned. The garden drowned a hundred years ago and something kept gardening. It is generous with strangers who behave like guests.',
        boardHeadline: 'STILL TENDED. NOT BY YOU.',
        depthNames: ['THE TIDE BEDS', 'THE SUNK TERRACE', 'THE DEEP ROWS'],
        gleanBoardNote: 'harvest as a guest would',
        stripBoardNote: 'loot the beds before the tide',
        gleanDesc: 'Take as a guest, row by row.',
        stripDesc: 'Empty the beds before the water turns.',
        depths: [
            [
                { plotId: 'salt-lace', weight: 3 },
                { plotId: 'widow-moss', weight: 2 },
                { plotId: 'mint-crown', weight: 2 },
                { plotId: 'wax-shelf', weight: 1 },
                { plotId: 'green-breath', weight: 2 },
                { plotId: 'molar-ring', weight: 1 },
            ],
            [
                { plotId: 'cold-seam', weight: 3 },
                { plotId: 'fever-bell', weight: 2 },
                { plotId: 'balm-knot', weight: 2 },
                { plotId: 'marrow-comb', weight: 1 },
                { plotId: 'bone-breath', weight: 1 },
                { plotId: 'pitch-heart', weight: 1 },
            ],
            [
                { plotId: 'quick-water', weight: 3 },
                { plotId: 'star-grit', weight: 2 },
                { plotId: 'kings-rue', weight: 2 },
                { plotId: 'saints-finger', weight: 1 },
                { plotId: 'gilt-scab', weight: 1 },
                { plotId: 'green-breath', weight: 1 },
            ],
        ],
    },
];

export function getGatherSiteDef(id: string): GatherSiteDef {
    const def = GATHERING_SITES.find((s) => s.id === id);
    if (!def) throw new Error(`Unknown gathering site: ${id}`);
    return def;
}
