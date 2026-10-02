/* map.library.ts is a the enumeration of the entire World */

/**
 * CoastalContinentMapNames are all the maps in the Coastal Continent
 * - 'breakwater': Act 1, map 1 — the storm coast, where a new game starts
 *   (map revamp M3a, D27). Defined in `./Continents/Coastal-Village/breakwater.ts`.
 * - 'charcoal-wood': Act 1, map 2 — the forest past the Breakwater's bridge
 *   (map revamp M3b). Defined in `./Continents/Coastal-Village/charcoal-wood.ts`.
 */
export type CoastalContinentMapNames =
    'breakwater' |
    'charcoal-wood';

/**
 * ContinentName represents the names of all continents in the game world
 * - 'coastal-continent': Starting Continent
 * - 'northern-continent': Act 1's mountains and underworld
 * - 'labyrinth-continent': THE APORIA — the MAZE-style puzzle labyrinth
 *   gating the last continent (specs/world/W-01). Dev-menu + CLI access
 *   only until the last continent exists.
 * @todo: Add more continents
 * @todo: Come up with better names
 */
export type ContinentName =
    'coastal-continent' |
    'northern-continent' |
    'labyrinth-continent';

/**
 * LabyrinthContinentMapNames are the three acts of The Aporia (W-01):
 * - 'aporia-colonnade': Act I — The Colonnade
 * - 'aporia-archive':   Act II — The Archive
 * - 'aporia-proof':     Act III — The Proof
 */
export type LabyrinthContinentMapNames =
    'aporia-colonnade' |
    'aporia-archive' |
    'aporia-proof';

/**
 * MapName is the union of all map names in the game
 * @todo: There is no type enforcement to ensure a specific map name is part
 *        of a specific continent.
 */
export type MapName =
    CoastalContinentMapNames |
    NorthernContinentMapNames |
    LabyrinthContinentMapNames;

/**
 * NorthernContinentMaps are all the maps in the Northern Continent
 * - 'beacon-crags': Act 1, map 3 — the mountains past the Charcoal Wood's stair cave
 *   (map revamp M3c). Defined in `./Continents/Northern-Continent/beacon-crags.ts`.
 * - 'lantern-deep': Act 1, map 4 — the underworld below the Beacon Crags' glacier shrine
 *   (map revamp M3d). Defined in `./Continents/Northern-Continent/lantern-deep.ts`.
 * @todo: Add more maps
 * @todo: Come up with better names
 */
export type NorthernContinentMapNames =
    'beacon-crags' |
    'lantern-deep';
