/* map.library.ts is a the enumeration of the entire World */
import { CoastalContinentMapNames } from "./Continents/Coastal-Village/maps";

/**
 * ContinentName represents the names of all continents in the game world
 * - 'coastal-continent': Starting Continent
 * - 'northern-continent': Contains Caverns, first major city, and connecting river
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
 * - 'caverns': Caverns. Gather Iron ore
 * - 'northern-city': Northern City. Give artisans materials to build boat.
 *                    First hear rumors of the death of the advisor and     King seeking a new one.
 * - 'connecting-river': Connecting River. Use boat to sail down river. Meet islanders.
 *                       See ritual of selection of child to be nominated as the island's representitive for potential new advisor.
 * - 'town-across-river': Town across the river. Home of sweetheart. See sweetheart be nominatedas her village's
 *                       representitive for potential new advisor.
 * - 'the-capital': The Capital (map 5, 2026-09-10). Where every nominee's ribbon-road
 *                  ends — the river court's boy, the sweetheart, and whoever else the
 *                  provinces sent this cycle. The Factor holds court over who is chosen.
 * @todo: Add more maps
 * @todo: Come up with better names
 */
export type NorthernContinentMapNames =
    'beacon-crags' |
    'caverns' |
    'northern-city' |
    'connecting-river' |
    'town-across-river' |
    'the-capital';
