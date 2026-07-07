/**
 * The Aporia — per-room scene art.
 *
 * Every room is dressed from a small shared kit: a wall texture
 * (rendered as the full-bleed backdrop under the POI layer) and a door
 * image (rendered inside the engine-driven door hotspots, so secret
 * doors and shifting door counts always stay aligned). Walls and doors
 * are matched by act theme and realm, and deliberately repeat — the
 * MAZE-book sameness is the point.
 *
 *  - Act I  — The Colonnade: pale carved stone, wooden and stone-arch doors.
 *  - Act II — The Archive: bookshelves and plank walls, coffered wood doors.
 *  - Act III — The Proof: bedrock, inscriptions, dark iron doors.
 *
 * Gated doors everywhere wear the sealed hieroglyph slab until the
 * riddle is answered; display numbers stay engine-drawn (plaques), so
 * no digits live in the art.
 */

const WALLS = {
    'cave-wall': require('./walls/cave-wall.webp'),
    'wall04-a1': require('./walls/wall04-a1.webp'),
    'wall04-a2': require('./walls/wall04-a2.webp'),
    'wall12-b': require('./walls/wall12-b.webp'),
    'wall19': require('./walls/wall19.webp'),
    'wall19-b': require('./walls/wall19-b.webp'),
    'wall20': require('./walls/wall20.webp'),
    'wall24': require('./walls/wall24.webp'),
    'wall26': require('./walls/wall26.webp'),
    'wall31-b': require('./walls/wall31-b.webp'),
    'wall41-e': require('./walls/wall41-e.webp'),
    'wall42-e': require('./walls/wall42-e.webp'),
    'wall44': require('./walls/wall44.webp'),
    'wall45': require('./walls/wall45.webp'),
    'wall47-d': require('./walls/wall47-d.webp'),
    'wall55': require('./walls/wall55.webp'),
    'wall57-a': require('./walls/wall57-a.webp'),
    'wall66-a': require('./walls/wall66-a.webp'),
    'wall67-a': require('./walls/wall67-a.webp'),
} as const;

const DOORS = {
    'door02-d': require('./doors/door02-d.png'),
    'door02-e': require('./doors/door02-e.png'),
    'door02-f': require('./doors/door02-f.png'),
    'door02-g': require('./doors/door02-g.png'),
    'door04-b': require('./doors/door04-b.png'),
    'door04-c': require('./doors/door04-c.png'),
    'door05-d': require('./doors/door05-d.png'),
    'door06-b': require('./doors/door06-b.png'),
    'door07': require('./doors/door07.png'),
    'door08-a': require('./doors/door08-a.png'),
    'door08-b': require('./doors/door08-b.png'),
    'door09-b': require('./doors/door09-b.png'),
    'door24': require('./doors/door24.png'),
    'door36': require('./doors/door36.png'),
    'door42': require('./doors/door42.png'),
    'egypt-door-open': require('./doors/egypt-door-open.png'),
} as const;

type WallKey = keyof typeof WALLS;
type DoorKey = keyof typeof DOORS;

/** Room → (wall, door) pairing, matched to the authored scene text. */
const ROOM_ART: Readonly<Record<string, readonly [WallKey, DoorKey]>> = {
    // ── Act I — The Colonnade ──
    'ap1-1': ['wall04-a1', 'door42'], // The Narthex: pale porch, carved stone entry arch
    'ap1-2': ['wall66-a', 'door42'], // The Colonnade Proper: carved frieze columns
    'ap1-3': ['wall66-a', 'door04-b'], // The Hall of Plinths
    'ap1-4': ['wall42-e', 'door24'], // The Undercroft: flagstone, rough stone arches
    'ap1-5': ['wall26', 'door04-c'], // The Lamplit Stair: warm-lit plaster
    'ap1-6': ['wall45', 'door42'], // The Gate of Assent: a face in the wall
    'ap1-7': ['wall04-a2', 'door04-c'], // The Shoemaker's
    'ap1-8': ['wall45', 'door36'], // The Doorwarden's Quarters
    'ap1-15': ['wall55', 'door36'], // The Hinge Shrine: ornate coffered shrine
    'ap1-9': ['wall24', 'door04-b'], // The Peristyle: open court, ivy over stone
    'ap1-10': ['wall04-a1', 'door04-b'], // The Mirror Walk
    'ap1-11': ['wall66-a', 'door04-c'], // The Long Gallery
    'ap1-12': ['wall42-e', 'door24'], // The Cistern Walk
    'ap1-13': ['wall67-a', 'door07'], // The Oubliette Vestibule: dark cell stone
    'ap1-14': ['wall67-a', 'door07'], // The Chamber of Rest

    // ── Act II — The Archive ──
    'ap2-1': ['wall31-b', 'door08-a'], // The Deposit Desk: plank panelling
    'ap2-2': ['wall44', 'door08-a'], // Stacks West: shelves to the ceiling
    'ap2-3': ['wall44', 'door08-b'], // The Catalogue
    'ap2-4': ['wall44', 'door08-b'], // The Misfiled Wing
    'ap2-5': ['wall55', 'door04-b'], // The Map Room: coffered ornament
    'ap2-6': ['wall31-b', 'door05-d'], // The Restorer's: the one painted door in the house
    'ap2-7': ['wall45', 'door36'], // The Gate of Assent: the face again
    'ap2-8': ['wall44', 'door08-a'], // The Index's Stand
    'ap2-9': ['wall44', 'door08-b'], // The Spine
    'ap2-10': ['wall44', 'door04-c'], // The Periodicals Rotunda
    'ap2-11': ['wall20', 'egypt-door-open'], // The Scriptorium: walls of writing
    'ap2-12': ['wall12-b', 'door04-c'], // The Stair of Returns: high windows
    'ap2-13': ['wall31-b', 'door08-a'], // The Bindery
    'ap2-14': ['wall44', 'door08-b'], // The Unshelved Corridor
    'ap2-15': ['wall44', 'door09-b'], // The Weight of Volumes: rusted hatch out
    'ap2-16': ['wall67-a', 'door09-b'], // The Return Slot

    // ── Act III — The Proof ──
    'ap3-1': ['cave-wall', 'door02-d'], // The First Waystone: raw bedrock
    'ap3-2': ['wall19', 'door02-e'], // The Stair of Unsaying: rock strata
    'ap3-3': ['wall45', 'door02-f'], // The Hall of Withdrawn Statues: one face remains
    'ap3-4': ['cave-wall', 'door02-d'], // The Second Waystone
    'ap3-5': ['wall20', 'egypt-door-open'], // The Gallery of Premises: inscribed premises
    'ap3-6': ['cave-wall', 'door02-d'], // The Third Waystone
    'ap3-7': ['wall41-e', 'door06-b'], // The Foundation: bare brick, studded iron
    'ap3-8': ['wall57-a', 'door02-g'], // The Sophist's Chamber: the wall is not stone
    'ap3-9': ['wall19-b', 'door24'], // The Threshold of the Unfounded
    'ap3-10': ['wall26', 'door06-b'], // The Anteroom of Almost
    'ap3-11': ['wall20', 'egypt-door-open'], // The Corridor of Therefore
    'ap3-12': ['wall55', 'door36'], // The Chamber of the Settled: comfortable ornament
    'ap3-13': ['wall04-a2', 'door02-f'], // The Doubtless Hall: suspiciously clean
    'ap3-14': ['wall47-d', 'door07'], // The False Waystone: cracked, arrow-riddled
    'ap3-15': ['wall57-a', 'door07'], // The Still Room
    'ap3-16': ['wall67-a', 'door09-b'], // The Oubliette of the Settled Mind
};

function mapRoomArt(pick: (pair: readonly [WallKey, DoorKey]) => number): Readonly<Record<string, number>> {
    return Object.freeze(
        Object.fromEntries(Object.entries(ROOM_ART).map(([nodeId, pair]) => [nodeId, pick(pair)])),
    );
}

/** Full-bleed wall backdrop per room node. */
export const LABYRINTH_SCENE_BACKDROPS: Readonly<Record<string, number>> = mapRoomArt(
    ([wall]) => WALLS[wall],
);

/** Door image per room node (all doors in a room match — by design). */
export const LABYRINTH_DOOR_IMAGES: Readonly<Record<string, number>> = mapRoomArt(
    ([, door]) => DOORS[door],
);

/** Riddle-gated doors wear the sealed slab until the house assents. */
export const LABYRINTH_SEALED_DOOR: number = require('./doors/egypt-door-sealed.png');
