/* map.library.ts is a the enumeration of the entire World */
import { CoastalContinentMapNames } from "./Continents/Coastal-Village/maps";

/**
 * ContinentName represents the names of all continents in the game world
 * - 'coastal-continent': Starting Continent
 * - 'northern-continent': Contains Caverns, first major city, and connecting river
 * @todo: Add more continents
 * @todo: Come up with better names
 */
export type ContinentName =
    'coastal-continent' |
    'northern-continent';

/**
 * MapName is the union of all map names in the game
 * @todo: There is no type enforcement to ensure a specific map name is part
 *        of a specific continent.  
 */
export type MapName =
    CoastalContinentMapNames |
    NorthernContinentMapNames;

/**
 * NorthernContinentMaps are all the maps in the Northern Continent
 * - 'caverns': Caverns. Gather Iron ore
 * - 'northern-city': Northern City. Give artisans materials to build boat. 
 *                    First hear rumors of the death of the advisor and     King seeking a new one.
 * - 'connecting-river': Connecting River. Use boat to sail down river. Meet islanders.
 *                       See ritual of selection of child to be nominated as the island's representitive for potential new advisor.
 * - 'town-across-river': Town across the river. Home of sweetheart. See sweetheart be nominatedas her village's
 *                       representitive for potential new advisor.
 * @todo: Add more maps
 * @todo: Come up with better names
 */
export type NorthernContinentMapNames =
    'caverns' |
    'northern-city' |
    'connecting-river' |
    'town-across-river';
