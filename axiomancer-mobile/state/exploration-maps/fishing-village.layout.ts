import type { MapLayout } from './types';

export const fishingVillageLayout: MapLayout = {
    mapId: 'fishing-village',
    continent: 'CONTINENT · COASTAL',
    region: 'Fishing Village',
    regionProgress: 'Map i of ii · 24 paths open',
    nodes: [
        // Spine nodes (fv-1..fv-10) — visual positions only; the node graph
        // (ids + edges) is the engine's MapDefinition. See ./types.ts.
        {
            id: 'fv-1',
            x: 60,
            y: 360,
            label: 'Hovel',
            description: 'Your salt-scoured hovel. The hearth still gutters.',
        },
        {
            id: 'fv-2',
            x: 140,
            y: 320,
            label: 'Crossing',
            description: 'The plank crossing. Gulls scream over the rocks.',
        },
        {
            id: 'fv-3',
            x: 180,
            y: 280,
            label: 'Hanged Wood',
            description: 'A copse where the fishers hang their drowned dead.',
        },
        {
            id: 'fv-4',
            x: 180,
            y: 240,
            label: 'Drowned Shrine',
            description: 'A half-sunk shrine. Old coin gleams beneath the silt.',
        },
        {
            id: 'fv-5',
            x: 180,
            y: 200,
            label: 'Black Cairn',
            description: 'A cairn of black river-stones. Something watches.',
        },
        {
            id: 'fv-6',
            x: 180,
            y: 160,
            label: 'Ash Mire',
            // One-quest-per-map (2026-06-14): the boat quest at Sea Cave
            // (fv-15) is the village's single story beat. This node, once
            // a second quest stub, is now a standard encounter.
            description: 'Something heavy shifts in the ash-choked mire.',
        },
        {
            id: 'fv-7',
            x: 180,
            y: 120,
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
            y: 40,
            label: 'Tavern',
            description: 'A tavern. Stale ale and stale prayer.',
        },
        {
            id: 'fv-10',
            x: 180,
            y: 10,
            label: 'Gate',
            description: 'A door you do not yet have the right to open.',
        },

        // Harbor district (fv-11..fv-15) - positioned east of spine
        {
            id: 'fv-11',
            x: 20,
            y: 340,
            label: 'Dock',
            description: 'Fishing boats bob against the rotting pier.',
        },
        {
            id: 'fv-12',
            x: 60,
            y: 300,
            label: 'Market',
            description: 'Salt-fish and rusty tools spread on weathered planks.',
        },
        {
            id: 'fv-13',
            x: 100,
            y: 260,
            label: 'Harbor Gate',
            description: 'Iron gates green with sea-rust. Something gleams within.',
        },
        {
            id: 'fv-14',
            x: 20,
            y: 280,
            label: 'Tide Pool',
            description: 'The tide turns without warning here. Linger and the water climbs past your knees.',
        },
        {
            id: 'fv-15',
            x: 20,
            y: 240,
            label: 'Sea Cave',
            description: 'A cave that breathes with the tide. Old songs echo within.',
        },

        // Inland district (fv-16..fv-20) - positioned west of spine
        {
            id: 'fv-16',
            x: 260,
            y: 260,
            label: 'Chapel',
            description: 'A chapel of bleached coral. Prayer-bones hang from hooks.',
        },
        {
            id: 'fv-17',
            x: 280,
            y: 220,
            label: 'Crossroads',
            description: 'Four paths meet. Signposts point to forgotten places.',
        },
        {
            id: 'fv-18',
            x: 260,
            y: 180,
            label: 'Stone Circle',
            description: 'Standing stones worn smooth by salt winds.',
        },
        {
            id: 'fv-19',
            x: 320,
            y: 200,
            label: 'Ancient Well',
            description: 'A well that goes deeper than memory. Coins shine below.',
        },
        {
            id: 'fv-20',
            x: 340,
            y: 160,
            label: 'Hermit Hut',
            // One-quest-per-map (2026-06-14): re-typed from a second quest
            // stub to a treasure cache — the hermit's abandoned hoard.
            description: 'A hermit dwelt here once. Their hoard outlasted them.',
        },

        // Cliff district (fv-21..fv-25) - positioned east, upper
        {
            id: 'fv-21',
            x: 280,
            y: 100,
            label: 'Cliff Path',
            description: 'A narrow path carved into the cliff face.',
        },
        {
            id: 'fv-22',
            x: 260,
            y: 60,
            label: 'Eagles Nest',
            description: 'An abandoned eyrie. Bones litter the rocky ledge.',
        },
        {
            id: 'fv-23',
            x: 300,
            y: 40,
            label: 'Wind Shrine',
            description: 'A shrine to the four winds. Prayer flags snap in the gale.',
        },
        {
            id: 'fv-24',
            x: 320,
            y: 80,
            label: 'Peak View',
            description: 'The highest point. All the village spreads below.',
        },
        {
            id: 'fv-25',
            x: 340,
            y: 40,
            label: 'Lighthouse',
            description: 'A lighthouse dark for decades. Something stirs within.',
        },
    ],
};
