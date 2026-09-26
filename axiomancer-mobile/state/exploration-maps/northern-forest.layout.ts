import { MAP_PLATES } from '@/assets/images/maps';
import { legacySheet } from './sheet';
import type { MapLayout } from './types';

export const northernForestLayout: MapLayout = {
    mapId: 'northern-forest',
    continent: 'CONTINENT · COASTAL',
    region: 'Northern Forest',
    // Ordinal only — no node/path count. The live count belongs to the map
    // legend, computed from MapDefinition (CRITIQUE pass 19).
    regionProgress: 'Map ii of ii',
    sheet: legacySheet(MAP_PLATES.forestDark),
    nodes: [
        {
            id: 'nf-1',
            x: 180,
            y: 360,
            label: 'Forest Edge',
            description: 'Where the pines first taste the salt wind.',
        },
        {
            id: 'nf-2',
            x: 180,
            y: 318,
            label: 'Foxglove Hollow',
            description: 'A hollow thick with foxglove and adder-tongue.',
        },
        {
            id: 'nf-3',
            x: 90,
            y: 318,
            label: 'Hangman’s Oak',
            description: 'An old oak. Old rope still bites into its bark.',
        },
        {
            id: 'nf-4',
            x: 180,
            y: 276,
            label: 'Iron Spring',
            description: 'A spring that runs red with iron. Or with worse.',
        },
        {
            id: 'nf-5',
            x: 90,
            y: 276,
            label: 'Wolf’s Den',
            description: 'A reek of wet fur. Bone splinters at the threshold.',
        },
        {
            id: 'nf-6',
            x: 180,
            y: 234,
            label: 'Pilgrim’s Cairn',
            description: 'A cairn raised by some earlier pilgrim. Names worn flat.',
        },
        {
            id: 'nf-7',
            x: 180,
            y: 192,
            label: 'Brokenstag',
            description: 'Antlered shape in the gloom. It does not move.',
        },
        {
            id: 'nf-8',
            x: 180,
            y: 150,
            label: 'Cold Hearth',
            description: 'A cold hearth in a roofless house. Sleep light.',
        },
        {
            id: 'nf-9',
            x: 180,
            y: 108,
            label: 'Black Hollow',
            description: 'A hollow the locals will not name in daylight.',
        },
        {
            id: 'nf-10',
            x: 180,
            y: 24,
            label: 'The Causeway',
            description: 'A causeway leading north. The way out, if there is one.',
        },
        // ── Districts (nf-11..nf-25) — positions placed off the engine's
        // location grid; kind + edges come from the engine. Labels/blurbs
        // authored in the game's voice. ──
        { id: 'nf-11', x: 270, y: 192, label: 'Ranger’s Rest', description: 'An old ranger’s lean-to, still dry beneath the boughs.' },
        { id: 'nf-12', x: 270, y: 318, label: 'Thornbrake', description: 'A snarl of black thorn that grabs at the careless.' },
        { id: 'nf-13', x: 270, y: 276, label: 'The Mossbeds', description: 'Soft green hummocks, thick with useful growth.' },
        { id: 'nf-14', x: 270, y: 234, label: 'Hermit’s Hollow', description: 'A reed hut tucked where the pines lean close.' },
        { id: 'nf-15', x: 90, y: 234, label: 'Bramble Snare', description: 'The undergrowth here keeps teeth of its own.' },
        { id: 'nf-16', x: 90, y: 192, label: 'Hunter’s Cache', description: 'A waxed bundle wedged in a hollow trunk.' },
        { id: 'nf-17', x: 90, y: 150, label: 'The Standing Stones', description: 'Grey monoliths older than the forest. They watch.' },
        { id: 'nf-18', x: 270, y: 66, label: 'Glen Market', description: 'A handful of stalls where two trails cross.' },
        { id: 'nf-19', x: 270, y: 108, label: 'Shadewood', description: 'The canopy closes; something stirs against the dark.' },
        { id: 'nf-20', x: 270, y: 150, label: 'Sunken Reliquary', description: 'A stone box half-swallowed by the loam.' },
        { id: 'nf-21', x: 90, y: 108, label: 'Echo Stone', description: 'Speak here and the forest answers — late, and wrong.' },
        { id: 'nf-22', x: 90, y: 66, label: 'Moonbell Glade', description: 'Pale flowers that open only after dusk.' },
        { id: 'nf-23', x: 180, y: 66, label: 'Wanderer’s Fire', description: 'A philosopher tends a small fire, glad of company.' },
        { id: 'nf-24', x: 90, y: 24, label: 'Keeper’s Cairn', description: 'A watch-cairn where the old rangers slept in turns.' },
        { id: 'nf-25', x: 270, y: 24, label: 'Mist Pools', description: 'Cold pools that breathe a fog to turn you around.' },
    ],
};
