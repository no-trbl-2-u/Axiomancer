/**
 * Quest Board minigame — authored content.
 *
 * One board per main-story beat (`content/story/story-overview.md`,
 * "Order of Events"). First board: the Fishing Village main quest —
 * "Boy must build boat". The Girl has moved down the river and across
 * the lake; the Father has handed over a book, an axe, a tent, and a
 * cart of fish; the Boy sketches his plan in the book's endpapers as
 * a game board and plays it out.
 *
 * Voice notes: village-direct, no exclamation points, the Boy's
 * head-in-the-clouds cadence. The board is a child's drawing of a
 * real place — every space is somewhere in the Fishing Village.
 */

import type {
    QuestBoardDef,
    QuestCharmDef,
    QuestCharmId,
    QuestVowDef,
    QuestVowId,
} from './quest-board.types';

// ---------------------------------------------------------------------------
// Charms (one-use trinkets, dealt 2 per session)
// ---------------------------------------------------------------------------

export const QUEST_BOARD_CHARMS: readonly QuestCharmDef[] = Object.freeze([
    {
        id: 'gull-feather' as QuestCharmId,
        name: 'GULL FEATHER',
        desc: 'Next roll: cast the bone twice, keep the higher face.',
        flavor: 'Found on the sill the morning she left. Luck, or close enough.',
    },
    {
        id: 'mothers-locket' as QuestCharmId,
        name: "MOTHER'S LOCKET",
        desc: 'Next duel: +2 on your die.',
        flavor: "Father keeps her portrait. The Boy keeps this. Neither says so.",
    },
    {
        id: 'tar-twine' as QuestCharmId,
        name: 'TAR-SOAKED TWINE',
        desc: 'Next snag: cross clean, no roll.',
        flavor: 'Wrap anything tight enough and the sea forgives it.',
    },
    {
        id: 'lucky-hook' as QuestCharmId,
        name: 'LUCKY HOOK',
        desc: 'Next gather: double the take.',
        flavor: 'It has never once caught a fish. It catches everything else.',
    },
    {
        id: 'friends-whistle' as QuestCharmId,
        name: "THE FRIEND'S WHISTLE",
        desc: 'Next roll: +2 to the move. He knows the shortcuts.',
        flavor: 'Two notes means wait. Three means run.',
    },
] as const);

const CHARMS_BY_ID = new Map(QUEST_BOARD_CHARMS.map(c => [c.id, c]));

export function getQuestCharmDef(id: QuestCharmId): QuestCharmDef {
    const def = CHARMS_BY_ID.get(id);
    if (!def) throw new Error(`QuestBoard: unknown charm '${id}'.`);
    return def;
}

// ---------------------------------------------------------------------------
// Vows (rolled objectives, dealt 2 per session; judged at outcome)
// ---------------------------------------------------------------------------

export const QUEST_BOARD_VOWS: readonly QuestVowDef[] = Object.freeze([
    {
        id: 'swift-keel' as QuestVowId,
        name: 'THE SWIFT KEEL',
        desc: 'Finish the build by the end of day 5.',
    },
    {
        id: 'unbitten' as QuestVowId,
        name: 'UNBITTEN',
        desc: 'Never let vigor fall below 2.',
    },
    {
        id: 'fed-larder' as QuestVowId,
        name: 'THE FED LARDER',
        desc: 'End the build still holding 3 fish or more.',
    },
    {
        id: 'gulls-bane' as QuestVowId,
        name: "GULL'S BANE",
        desc: 'Win 2 duels.',
    },
    {
        id: 'tale-collector' as QuestVowId,
        name: 'TALE COLLECTOR',
        desc: 'Hear out 2 of the village voices (parleys or omens).',
    },
] as const);

const VOWS_BY_ID = new Map(QUEST_BOARD_VOWS.map(v => [v.id, v]));

export function getQuestVowDef(id: QuestVowId): QuestVowDef {
    const def = VOWS_BY_ID.get(id);
    if (!def) throw new Error(`QuestBoard: unknown vow '${id}'.`);
    return def;
}

// ---------------------------------------------------------------------------
// Board: BUILD THE BOAT (Fishing Village — story beat 1)
// ---------------------------------------------------------------------------

export const BUILD_THE_BOAT_BOARD: QuestBoardDef = Object.freeze({
    id: 'build-the-boat',
    title: "THE BOATWRIGHT'S GAMBIT",
    storyBeat: 'Fishing Village — Main Quest: the Boy must build a boat.',
    intro:
        'She is down the river and across the lake, and rivers do not ' +
        'carry boys who cannot float. Father gave what he had — a book, ' +
        'an axe, a tent, a cart of fish — and said nothing of boats. ' +
        'So the Boy draws his plan in the back of the book the way he ' +
        'and his friend draw all their plans: as a board, as a game, ' +
        'as a thing that can be won.',
    boardHeadline: 'A BOAT, OR NOTHING',
    pieceName: 'THE BOY',
    startFish: 15,
    startVigor: 8,
    maxVigor: 8,
    // Tuned 2026-06-14: 6 part-units (2+1+1+2) targets 5-7 day masterwork completion
    // with bot policies that engage status effects. Reduced from 11 parts
    // to fix balance test failures.
    partsRequired: Object.freeze({ plank: 2, pitch: 1, cloth: 1, nail: 2 }),
    partNames: Object.freeze({
        plank: 'HULL PLANKS',
        pitch: 'BLACK PITCH',
        cloth: 'SAILCLOTH',
        nail: 'IRON NAILS',
    }),
    outcomeCopy: Object.freeze({
        masterwork:
            'The hull rings like a bell when knocked. Old men come down ' +
            'to the slipway to nod at it, which is the most they have ' +
            'ever given anything. She would laugh at how proud he looks.',
        seaworthy:
            'An honest build. The seams hold, the sail draws, and if it ' +
            'lists a little to port — well. So does everyone he loves.',
        driftwood:
            'It floats. Lashed, patched, tarred twice over, the sail a ' +
            'flour sack with opinions — but it floats, and the river only ' +
            'asks that much.',
    }),
    spaces: Object.freeze([
        {
            id: 'slipway',
            kind: 'slipway' as const,
            name: 'THE SLIPWAY',
            flavor: 'Where every village boat was born. Now his.',
        },
        {
            id: 'driftwood-cove',
            kind: 'gather' as const,
            name: 'DRIFTWOOD COVE',
            flavor: 'The sea gives back what it takes. Eventually. In pieces.',
            gather: {
                part: 'plank' as const,
                perPress: 2,
                bustFloor: 1,
                bustBite: 1,
                maxPress: 3,
            },
        },
        {
            id: 'tide-cache',
            kind: 'cache' as const,
            name: 'THE TIDE CACHE',
            flavor: 'A hollow under the third pier piling. Everyone knows. No one looks.',
            cache: {
                finds: Object.freeze([
                    { weight: 3, label: 'A bundle of dried fish, wax-wrapped.', fish: 2 },
                    { weight: 2, label: 'A fist of bent but honest nails.', parts: { part: 'nail' as const, count: 1 } },
                    { weight: 2, label: 'A torn jib, half-buried. Good cloth in it yet.', parts: { part: 'cloth' as const, count: 1 } },
                    { weight: 1, label: 'Someone got here first. An apology, in charcoal.', fish: 0 },
                ]),
            },
        },
        {
            id: 'slick-rocks',
            kind: 'snag' as const,
            name: 'THE SLICK ROCKS',
            flavor: 'Green weed on black stone. The shore tax, paid in skin.',
            snag: { threshold: 3, bite: 1, slipBack: 2, detourFish: 1 },
        },
        {
            id: 'gull-king',
            kind: 'duel' as const,
            name: 'THE GULL KING',
            flavor: 'Fat as a chapel bell and twice as loud. He hoards what shines.',
            duel: {
                foe: 'THE GULL KING',
                foeBonus: 1,
                spoils: { part: 'nail' as const, count: 2 },
                bite: 1,
                bribeFish: 2,
            },
        },
        {
            id: 'market-row',
            kind: 'market' as const,
            name: 'MARKET ROW',
            flavor: 'Three stalls, two grudges, one price for boys with fish.',
            market: {
                offers: Object.freeze([
                    { part: 'pitch' as const, count: 1, fishCost: 3 },
                    { part: 'cloth' as const, count: 1, fishCost: 3 },
                    { part: 'nail' as const, count: 2, fishCost: 2 },
                ]),
            },
        },
        {
            id: 'marrows-dock',
            kind: 'parley' as const,
            name: "OLD MARROW'S DOCK",
            flavor: 'The dockmaster has watched a hundred keels laid. He bets on none.',
            parley: {
                npc: 'OLD MARROW',
                prompt:
                    '"Building, are you." Not a question. He turns a nail ' +
                    'over in his fingers like a coin. "Everything on this ' +
                    'dock costs. Pick what you can carry."',
                options: Object.freeze([
                    {
                        id: 'trade',
                        label: 'TRADE FISH FOR IRON',
                        desc: '−2 fish, +2 iron nails.',
                        fish: -2,
                        parts: { part: 'nail' as const, count: 2 },
                        outcome: 'He weighs the fish in one hand and is almost impressed. The nails are good. He does not say good luck.',
                    },
                    {
                        id: 'haul',
                        label: 'HAUL CRATES FOR CLOTH',
                        desc: '−1 vigor, +1 sailcloth.',
                        vigor: -1,
                        parts: { part: 'cloth' as const, count: 1 },
                        outcome: 'An hour of crates. His arms learn what his plan costs. The bolt of cloth smells of someone else\'s voyage.',
                    },
                    {
                        id: 'listen',
                        label: 'ASK ABOUT THE RIVER',
                        desc: 'Hear the dockmaster out. The next roll gains +2 wind.',
                        wind: 2,
                        outcome: '"Current runs east of the sandbar this month. Everyone fights it. Don\'t." That is the whole lesson, and it is a good one.',
                    },
                    {
                        id: 'commission',
                        label: 'COMMISSION THE GOOD IRON',
                        desc: 'A full purse only. −5 fish, +3 iron nails.',
                        requires: { fish: 6 },
                        fish: -5,
                        parts: { part: 'nail' as const, count: 3 },
                        outcome: 'He sees the weight of the purse before he sees the boy, and that changes the conversation. The chest at the back opens. The nails inside have never touched salt.',
                    },
                ]),
            },
        },
        {
            id: 'hearth',
            kind: 'hearth' as const,
            name: 'THE HEARTH',
            flavor: "His own roof, his father's stew, the fire talking to itself.",
            hearth: { vigor: 3 },
        },
        {
            id: 'pine-stand',
            kind: 'gather' as const,
            name: 'THE PINE STAND',
            flavor: "Father's axe knows this grove. Straight grain, sap like amber.",
            gather: {
                part: 'plank' as const,
                perPress: 2,
                bustFloor: 1,
                bustBite: 2,
                maxPress: 5,
            },
        },
        {
            id: 'bog-pits',
            kind: 'gather' as const,
            name: 'THE BOG PITS',
            flavor: 'Black pitch under black water. The bog keeps what it grabs.',
            gather: {
                part: 'pitch' as const,
                perPress: 2,
                bustFloor: 2,
                bustBite: 1,
                maxPress: 3,
            },
        },
        {
            id: 'friends-fence',
            kind: 'omen' as const,
            name: "THE FRIEND'S FENCE",
            flavor: 'Three whistled notes. He is already climbing over.',
            omen: {
                lines: Object.freeze([
                    'His friend does not ask why a boat. That was settled when they were six.',
                    '"You\'ll want the back lane past the tannery. Gate\'s broke. Has been all year."',
                    'For one stretch of road there are two adventurers again, and the cart is half as heavy.',
                ]),
                wind: 2,
            },
        },
        {
            id: 'netmenders-porch',
            kind: 'parley' as const,
            name: "THE NETMENDER'S PORCH",
            flavor: 'She has sewn sails since before sails. Her needle is law.',
            parley: {
                npc: 'THE NETMENDER',
                prompt:
                    'She looks at his hands, not his face. "Canvas wants ' +
                    'paying for. Coin, fish, or fingers — and I\'ve coin ' +
                    'enough."',
                options: Object.freeze([
                    {
                        id: 'pay',
                        label: 'PAY IN FISH',
                        desc: '−3 fish, +1 sailcloth.',
                        fish: -3,
                        parts: { part: 'cloth' as const, count: 1 },
                        outcome: 'She counts the fish twice, then cuts the bolt generous. "For the girl, is it." He does not answer. "Mm," she says, knowing.',
                    },
                    {
                        id: 'mend',
                        label: 'MEND NETS BESIDE HER',
                        desc: '−1 vigor, +1 sailcloth, +1 fish.',
                        vigor: -1,
                        parts: { part: 'cloth' as const, count: 1 },
                        fish: 1,
                        outcome: 'An afternoon of knots. She corrects his hands eleven times and pays in cloth, and slips a fish in his bag besides.',
                    },
                    {
                        id: 'bolt',
                        label: 'BUY THE WHOLE BOLT',
                        desc: 'For a serious buyer. −4 fish, +2 sailcloth.',
                        requires: { fish: 5 },
                        fish: -4,
                        parts: { part: 'cloth' as const, count: 2 },
                        outcome: 'She looks at the fish, then at him, and decides he means it. The whole bolt comes off the shelf. "Don\'t let it luff," she says. "She\'ll have crossed worse than wind."',
                    },
                    {
                        id: 'decline',
                        label: 'TIP HIS CAP AND GO',
                        desc: 'Keep what he has. Keep walking.',
                        outcome: '"Suit yourself," she says, in the tone of someone who has watched many boys suit themselves straight into the lake.',
                    },
                ]),
            },
        },
        {
            id: 'burrow',
            kind: 'cache' as const,
            name: 'THE BURROW',
            flavor: 'The hideout. Half their childhood is buried in this hollow.',
            cache: {
                finds: Object.freeze([
                    { weight: 3, label: 'The emergency jar. Past-him left fish money for exactly this.', fish: 3 },
                    { weight: 2, label: 'A coil of waxed cord and a plank from the old raft.', parts: { part: 'plank' as const, count: 1 } },
                    { weight: 2, label: 'A tin of pitch, sealed with a candle stub.', parts: { part: 'pitch' as const, count: 1 } },
                    { weight: 1, label: 'A map of the lake, drawn at age nine. Inaccurate. Encouraging.', vigor: 1 },
                ]),
            },
        },
        {
            id: 'boar-thicket',
            kind: 'duel' as const,
            name: 'THE BOAR THICKET',
            flavor: 'Something big beds down between him and the best timber.',
            duel: {
                foe: 'THE THICKET BOAR',
                foeBonus: 2,
                spoils: { part: 'plank' as const, count: 2 },
                bite: 2,
                bribeFish: 3,
            },
        },
        {
            id: 'widows-steps',
            kind: 'snag' as const,
            name: "THE WIDOW'S STEPS",
            flavor: 'Forty stairs cut in the cliff. The handrail is a rumor.',
            snag: { threshold: 4, bite: 1, slipBack: 3, detourFish: 2 },
        },
        {
            id: 'fathers-porch',
            kind: 'omen' as const,
            name: "FATHER'S PORCH",
            flavor: 'He is mending a net that is not torn. He has been watching the road.',
            omen: {
                lines: Object.freeze([
                    'His father does not ask how the boat is coming. He pours two bowls.',
                    '"Your mother crossed that lake once. Rowed it herself, against the ferryman\'s advice."',
                    'It is the most he has said about her in a year. The Boy walks lighter for it.',
                ]),
                wind: 1,
            },
        },
    ]),
});

export const QUEST_BOARDS: readonly QuestBoardDef[] = Object.freeze([BUILD_THE_BOAT_BOARD]);

const BOARDS_BY_ID = new Map(QUEST_BOARDS.map(b => [b.id, b]));

export function getQuestBoardDef(id: string): QuestBoardDef {
    const def = BOARDS_BY_ID.get(id);
    if (!def) throw new Error(`QuestBoard: unknown board '${id}'.`);
    return def;
}
