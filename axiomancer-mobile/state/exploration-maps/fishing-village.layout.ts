import type { MapLayout } from './types';

export const fishingVillageLayout: MapLayout = {
    mapId: 'fishing-village',
    continent: 'CONTINENT · COASTAL',
    region: 'the Drowned Parish',
    // Ordinal only — no node/path count. The live count belongs to the map
    // legend (CRITIQUE pass 19: a static count here disagreed with the
    // legend's "N nodes · M sealed" on screen).
    //
    // Phase 100: that legend counter no longer reads MapDefinition's lock list
    // either. It is now derived from the same classified node array the PIPS
    // are drawn from, because those two sources disagreed as well — the strip
    // said "25 nodes · 20 sealed" over 21 sealed pips (PLAYTEST_BUGS_2026-09-18
    // BUG-01). One source of truth, pinned by tests in
    // `state/e2e/exploration.engine.test.ts`.
    regionProgress: 'Map i of ii',
    nodes: [
        // Spine nodes (fv-1..fv-10) — visual positions only; the node graph
        // (ids + edges) is the engine's MapDefinition. See ./types.ts.
        {
            id: 'fv-1',
            x: 180,
            y: 360,
            label: 'Hovel',
            description: 'Your salt-scoured hovel. The hearth still gutters.',
        },
        {
            id: 'fv-2',
            x: 180,
            y: 332,
            label: 'Crossing',
            description: 'The plank crossing. Gulls scream over the rocks.',
        },
        {
            id: 'fv-3',
            x: 180,
            y: 276,
            label: 'Hanged Wood',
            description: 'A copse where the fishers hang their drowned dead.',
        },
        {
            id: 'fv-4',
            x: 180,
            y: 220,
            label: 'Drowned Shrine',
            description: 'A half-sunk shrine. Old coin gleams beneath the silt.',
        },
        {
            id: 'fv-5',
            x: 180,
            y: 164,
            label: 'Black Cairn',
            description: 'A cairn of black river-stones. Something watches.',
        },
        {
            id: 'fv-6',
            x: 180,
            y: 136,
            label: 'Ash Mire',
            // One-quest-per-map (2026-06-14): the boat quest at Sea Cave
            // (fv-15) is the village's single story beat. This node, once
            // a second quest stub, is now a standard encounter.
            description: 'Something heavy shifts in the ash-choked mire.',
        },
        {
            id: 'fv-7',
            x: 180,
            y: 108,
            label: 'Old Pier',
            description: 'A pier half-eaten by tides. Crabs in the pilings.',
        },
        {
            id: 'fv-8',
            x: 180,
            y: 80,
            label: 'Bone Reach',
            description: 'A reach of bleached driftwood and bleached bones.',
        },
        {
            id: 'fv-9',
            x: 180,
            y: 52,
            label: 'Tavern',
            description: 'A tavern. Stale ale and stale prayer.',
        },
        {
            id: 'fv-10',
            x: 180,
            y: 24,
            label: 'Gate',
            description: 'A door you do not yet have the right to open.',
        },

        // Harbor district (fv-11..fv-15) - positioned east of spine
        {
            id: 'fv-11',
            x: 270,
            y: 276,
            label: 'Dock',
            description: 'Fishing boats bob against the rotting pier.',
        },
        {
            id: 'fv-12',
            x: 90,
            y: 248,
            label: 'Market',
            description: 'Salt-fish and rusty tools spread on weathered planks.',
        },
        {
            id: 'fv-13',
            x: 270,
            y: 248,
            label: 'Harbor Gate',
            description: 'Iron gates green with sea-rust. Something gleams within.',
        },
        {
            id: 'fv-14',
            x: 270,
            y: 220,
            label: 'Tide Pool',
            description: 'The tide turns without warning here. Linger and the water climbs past your knees.',
        },
        {
            id: 'fv-15',
            x: 90,
            y: 164,
            label: 'Sea Cave',
            description: 'A cave that breathes with the tide. Old songs echo within.',
        },

        // Inland district (fv-16..fv-20) - positioned west of spine
        {
            id: 'fv-16',
            x: 90,
            y: 276,
            label: 'Chapel',
            description: 'A chapel of bleached coral. Prayer-bones hang from hooks.',
        },
        {
            id: 'fv-17',
            x: 90,
            y: 220,
            label: 'Crossroads',
            description: 'Four paths meet. Signposts point to forgotten places.',
        },
        {
            id: 'fv-18',
            x: 90,
            y: 108,
            label: 'Stone Circle',
            description: 'Standing stones worn smooth by salt winds.',
        },
        {
            id: 'fv-19',
            x: 270,
            y: 108,
            label: 'Ancient Well',
            description: 'A well that goes deeper than memory. Coins shine below.',
        },
        {
            id: 'fv-20',
            x: 270,
            y: 164,
            label: 'Hermit Hut',
            // One-quest-per-map (2026-06-14): re-typed from a second quest
            // stub to a treasure cache — the hermit's abandoned hoard.
            description: 'A hermit dwelt here once. Their hoard outlasted them.',
        },

        // Cliff district (fv-21..fv-25) - positioned east, upper
        {
            id: 'fv-21',
            x: 90,
            y: 80,
            label: 'Cliff Path',
            description: 'A narrow path carved into the cliff face.',
        },
        {
            id: 'fv-22',
            x: 90,
            y: 52,
            label: 'Eagles Nest',
            description: 'An abandoned eyrie. Bones litter the rocky ledge.',
        },
        {
            id: 'fv-23',
            x: 270,
            y: 52,
            label: 'Wind Shrine',
            description: 'A shrine to the four winds. Prayer flags snap in the gale.',
        },
        {
            id: 'fv-24',
            x: 90,
            y: 24,
            label: 'Peak View',
            description: 'The highest point. All the village spreads below.',
        },
        {
            id: 'fv-25',
            x: 270,
            y: 80,
            label: 'Lighthouse',
            description: 'A lighthouse dark for decades. Something stirs within.',
        },
        // THE THREE GATES (2026-09-21) — visual seats for the engine's fv-26 /
        // fv-27 / fv-28 chokes; the rows were re-spaced (28pt) to fit them.
        {
            id: 'fv-26',
            x: 180,
            y: 304,
            label: 'Tide-Line',
            description: 'Where the wet sand gives underfoot. Something pale turns over in it.',
        },
        {
            id: 'fv-27',
            x: 180,
            y: 248,
            label: 'Salt Flats',
            description: 'Flat white salt to the horizon. A lidless thing drifts at head height.',
        },
        {
            id: 'fv-28',
            x: 180,
            y: 192,
            label: 'Breakwater Steps',
            description: 'Slick stone steps down to the breakwater. A skull talks to the tide.',
        },
    ],
};
