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
    storyBeat: 'the Drowned Parish — Main Quest: the Boy must build a boat.',
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

// ---------------------------------------------------------------------------
// Boards: THE SOPHIST'S LEDGERS (The Aporia, W-01 — one per act)
//
// The house requires its paperwork before each act boss; the Sophist
// witnesses. Same board-game bones as BUILD_THE_BOAT (the four part
// families are engine-fixed; each ledger renames them), with the part
// economy and hazard numbers rising gently act over act. Voice: the
// Sophist — terse, cold, old.
// ---------------------------------------------------------------------------

export const SOPHISTS_FIRST_LEDGER_BOARD: QuestBoardDef = Object.freeze({
    id: 'sophists-first-ledger',
    title: "THE SOPHIST'S FIRST LEDGER",
    storyBeat: 'The Aporia, Act I — The Colonnade: the house requires its paperwork before the Doorwarden.',
    intro:
        'The Doorwarden does not hear the unfiled. Before his chapel opens, ' +
        'the house requires its paperwork: the First Ledger, an account of ' +
        'the Colonnade — rubbings sworn, ink true, leaves fastened. I did ' +
        'not make the rule. I keep it, which is worse for you. Set your ' +
        'mark on the table. I will witness.',
    boardHeadline: 'THE HOUSE REQUIRES ITS PAPERWORK',
    pieceName: 'YOUR MARK',
    startFish: 15,
    startVigor: 8,
    maxVigor: 8,
    partsRequired: Object.freeze({ plank: 2, pitch: 1, cloth: 1, nail: 2 }),
    partNames: Object.freeze({
        plank: 'COLUMN RUBBINGS',
        pitch: 'LAMP BLACK',
        cloth: 'FAIR VELLUM',
        nail: 'BRASS FASTENERS',
    }),
    outcomeCopy: Object.freeze({
        masterwork:
            'Every entry carved, none painted. He reads it twice, which he ' +
            'has not done in a century, and signs his third of a name without ' +
            'being asked. "Filed," he says. "The Doorwarden will hear you now. ' +
            'He will not enjoy it."',
        seaworthy:
            'An honest ledger. Two entries lean and one is smudged, but ' +
            'nothing in it lies. He signs without comment, which from him ' +
            'is a comment.',
        driftwood:
            'The ledger closes on smears and margins. "The house asked for ' +
            'an account. This is an anecdote." He signs it anyway. The house ' +
            'is not particular. He is, and he remembers.',
    }),
    spaces: Object.freeze([
        {
            id: 'clerks-table',
            kind: 'slipway' as const,
            name: "THE CLERK'S TABLE",
            flavor: 'A lectern facing the doors. The ledger lies open. It has waited longer than you have been alive.',
        },
        {
            id: 'fallen-column',
            kind: 'gather' as const,
            name: 'THE FALLEN COLUMN',
            flavor: 'One column lay down and was not corrected. Its carvings rub clean, if your paper holds.',
            gather: {
                part: 'plank' as const,
                perPress: 2,
                bustFloor: 1,
                bustBite: 1,
                maxPress: 3,
            },
        },
        {
            id: 'predecessors-satchel',
            kind: 'cache' as const,
            name: "THE PREDECESSOR'S SATCHEL",
            flavor: 'A walker left it against the wall, intending to come back. The house keeps intentions.',
            cache: {
                finds: Object.freeze([
                    { weight: 3, label: 'Dried provisions, wax-wrapped. Whoever packed them planned to finish.', fish: 2 },
                    { weight: 2, label: 'A fist of brass fasteners, still bright.', parts: { part: 'nail' as const, count: 1 } },
                    { weight: 2, label: 'Clean vellum, rolled tight against the damp.', parts: { part: 'cloth' as const, count: 1 } },
                    { weight: 1, label: 'Emptied already. A note in charcoal: SORRY. The house kept that too.', fish: 0 },
                ]),
            },
        },
        {
            id: 'unlit-gallery',
            kind: 'snag' as const,
            name: 'THE UNLIT GALLERY',
            flavor: 'No sconce burns here. Lamps are lit where someone will walk. Draw the conclusion.',
            snag: { threshold: 3, bite: 1, slipBack: 2, detourFish: 1 },
        },
        {
            id: 'latch-wight',
            kind: 'duel' as const,
            name: 'THE LATCH-WIGHT',
            flavor: 'A small cold thing that lives in lockwork and collects what fastens. Your fasteners interest it.',
            duel: {
                foe: 'THE LATCH-WIGHT',
                foeBonus: 1,
                spoils: { part: 'nail' as const, count: 2 },
                bite: 1,
                bribeFish: 2,
            },
        },
        {
            id: 'toll-niche',
            kind: 'market' as const,
            name: 'THE TOLL NICHE',
            flavor: 'A recess with a scale and no attendant. Pay correctly. The house counts.',
            market: {
                offers: Object.freeze([
                    { part: 'pitch' as const, count: 1, fishCost: 3 },
                    { part: 'cloth' as const, count: 1, fishCost: 3 },
                    { part: 'nail' as const, count: 2, fishCost: 2 },
                ]),
            },
        },
        {
            id: 'sophists-lectern',
            kind: 'parley' as const,
            name: "THE SOPHIST'S LECTERN",
            flavor: 'He is already there. He is always already there.',
            parley: {
                npc: 'THE SOPHIST',
                prompt:
                    '"Filing, are we." Not a question. He turns a fastener ' +
                    'over in his fingers like an argument. "Everything in ' +
                    'this house costs. Choose what you can carry."',
                options: Object.freeze([
                    {
                        id: 'trade',
                        label: 'TRADE PROVISIONS FOR BRASS',
                        desc: '−2 fish, +2 brass fasteners.',
                        fish: -2,
                        parts: { part: 'nail' as const, count: 2 },
                        outcome: 'He weighs the provisions once. "Adequate." The fasteners are good. He does not say good luck. He has seen where luck files.',
                    },
                    {
                        id: 'copy',
                        label: 'COPY ENTRIES AT HIS DICTATION',
                        desc: '−1 vigor, +1 fair vellum.',
                        vigor: -1,
                        parts: { part: 'cloth' as const, count: 1 },
                        outcome: 'An hour of dictation. He corrects your hand eleven times and pays in vellum. "You write like someone in a hurry to be wrong."',
                    },
                    {
                        id: 'listen',
                        label: 'ASK ABOUT THE COLONNADE',
                        desc: 'Hear him out. The next roll gains +2 wind.',
                        wind: 2,
                        outcome: '"The maze carves. It does not paint. Should you meet paint, remember whose habit that is." That is the whole lesson, and it is a good one.',
                    },
                    {
                        id: 'commission',
                        label: 'BUY THE GOOD BRASS',
                        desc: 'A full purse only. −5 fish, +3 brass fasteners.',
                        requires: { fish: 6 },
                        fish: -5,
                        parts: { part: 'nail' as const, count: 3 },
                        outcome: 'He sees the weight of the purse before he sees you, and the conversation improves. A drawer opens. The fasteners inside have never touched a lesser ledger.',
                    },
                ]),
            },
        },
        {
            id: 'first-waystone',
            kind: 'hearth' as const,
            name: 'THE FIRST WAYSTONE',
            flavor: 'True granite. Rest your hand; the house will hold your place. It holds everything else.',
            hearth: { vigor: 3 },
        },
        {
            id: 'colonnade-proper',
            kind: 'gather' as const,
            name: 'THE COLONNADE PROPER',
            flavor: 'Columns raised to hold up nothing. The most honest work in the house, and it rubs true.',
            gather: {
                part: 'plank' as const,
                perPress: 2,
                bustFloor: 1,
                bustBite: 2,
                maxPress: 5,
            },
        },
        {
            id: 'sconce-row',
            kind: 'gather' as const,
            name: 'THE SCONCE ROW',
            flavor: 'Lamp black scrapes from the sconce hoods. The house does not waste oil. Neither should you.',
            gather: {
                part: 'pitch' as const,
                perPress: 2,
                bustFloor: 2,
                bustBite: 1,
                maxPress: 3,
            },
        },
        {
            id: 'chalk-arrow',
            kind: 'omen' as const,
            name: 'THE CHALK ARROW',
            flavor: 'Someone before you marked the floor. Someone after them scrubbed it. Both are remembered.',
            omen: {
                lines: Object.freeze([
                    'The arrow points down a gallery you had not considered.',
                    'Whoever drew it walked out. The house dislikes admitting this, which is how you know it is true.',
                    'For one stretch the ledger feels less like homework and more like a map.',
                ]),
                wind: 2,
            },
        },
        {
            id: 'bricklayers-shade',
            kind: 'parley' as const,
            name: "THE BRICKLAYER'S SHADE",
            flavor: 'He laid the third gallery and never quite left. His trowel is worn to a sliver of an opinion.',
            parley: {
                npc: "THE BRICKLAYER'S SHADE",
                prompt:
                    '"Accounts, is it." He looks at your hands, not your ' +
                    'face. "I mixed the mortar here. I can tell you what it ' +
                    'cost, or charge you less than that."',
                options: Object.freeze([
                    {
                        id: 'pay',
                        label: 'PAY FOR HIS VELLUM',
                        desc: '−3 fish, +1 fair vellum.',
                        fish: -3,
                        parts: { part: 'cloth' as const, count: 1 },
                        outcome: 'He counts the provisions twice, out of habit older than the wall. The vellum is cut generous. "For the ledger, is it. Mm," he says, knowing.',
                    },
                    {
                        id: 'haul',
                        label: 'CARRY HOD FOR HIM',
                        desc: '−1 vigor, +1 fair vellum, +1 fish.',
                        vigor: -1,
                        parts: { part: 'cloth' as const, count: 1 },
                        fish: 1,
                        outcome: 'An hour of bricks that no longer need carrying. He pays in vellum anyway, and slips a ration in your bag besides. The dead keep old courtesies.',
                    },
                    {
                        id: 'bolt',
                        label: 'BUY HIS WHOLE FOLD',
                        desc: 'For a serious clerk. −4 fish, +2 fair vellum.',
                        requires: { fish: 5 },
                        fish: -4,
                        parts: { part: 'cloth' as const, count: 2 },
                        outcome: 'He studies you, then decides you mean it. The whole fold comes off his shoulder. "Write it straight," he says. "Crooked walls stand. Crooked ledgers do not."',
                    },
                    {
                        id: 'decline',
                        label: 'NOD AND WALK ON',
                        desc: 'Keep what you have. Keep walking.',
                        outcome: '"Suit yourself," he says, in the tone of a man who has watched many clerks suit themselves straight into the Oubliette.',
                    },
                ]),
            },
        },
        {
            id: 'mortared-hollow',
            kind: 'cache' as const,
            name: 'THE MORTARED HOLLOW',
            flavor: 'One brick sits proud of its course. Everyone knows. No one looks.',
            cache: {
                finds: Object.freeze([
                    { weight: 3, label: 'A walker\'s emergency store. Past hands left provisions for exactly this.', fish: 3 },
                    { weight: 2, label: 'A rubbing already taken, rolled and sound.', parts: { part: 'plank' as const, count: 1 } },
                    { weight: 2, label: 'A tin of lamp black, sealed with a candle stub.', parts: { part: 'pitch' as const, count: 1 } },
                    { weight: 1, label: 'A map of the Colonnade, drawn by someone hopeful. Inaccurate. Encouraging.', vigor: 1 },
                ]),
            },
        },
        {
            id: 'hinge-hound',
            kind: 'duel' as const,
            name: 'THE HINGE HOUND',
            flavor: 'Something of bronze and appetite beds down between you and the best carvings.',
            duel: {
                foe: 'THE HINGE HOUND',
                foeBonus: 2,
                spoils: { part: 'plank' as const, count: 2 },
                bite: 2,
                bribeFish: 3,
            },
        },
        {
            id: 'settling-stair',
            kind: 'snag' as const,
            name: 'THE SETTLING STAIR',
            flavor: 'Forty steps that have not finished deciding their height. The handrail is a rumor.',
            snag: { threshold: 4, bite: 1, slipBack: 3, detourFish: 2 },
        },
        {
            id: 'door-that-likes-you',
            kind: 'omen' as const,
            name: 'THE DOOR THAT LIKES YOU',
            flavor: 'It opens before you knock. In this house, that is either a courtesy or a bet.',
            omen: {
                lines: Object.freeze([
                    'The door swings without sound. No toll is named.',
                    'Somewhere above, a hinge-priest files the exception, and does not approve of it.',
                    'You walk lighter for a gallery and a half. The house pretends not to notice.',
                ]),
                wind: 1,
            },
        },
    ]),
});

export const SOPHISTS_SECOND_LEDGER_BOARD: QuestBoardDef = Object.freeze({
    id: 'sophists-second-ledger',
    title: "THE SOPHIST'S SECOND LEDGER",
    storyBeat: 'The Aporia, Act II — The Archive: the house requires its paperwork before the Index.',
    intro:
        'Deeper, and the house grows literate. The Index does not audit ' +
        'the unfiled; it shelves them. Before its reading room opens, the ' +
        'Second Ledger must be filled: cases boarded, wax set, cards in ' +
        'order, clasps fast. The First was practice. I said nothing then. ' +
        'I am saying it now. Set your mark.',
    boardHeadline: 'AN ACCOUNT, IN ORDER, OR SHELVED',
    pieceName: 'YOUR MARK',
    startFish: 14,
    startVigor: 8,
    maxVigor: 8,
    partsRequired: Object.freeze({ plank: 2, pitch: 1, cloth: 2, nail: 2 }),
    partNames: Object.freeze({
        plank: 'CASE BOARDS',
        pitch: 'SEALING WAX',
        cloth: 'INDEX CARDS',
        nail: 'COPPER CLASPS',
    }),
    outcomeCopy: Object.freeze({
        masterwork:
            'The ledger closes with the sound of a well-hung door. He checks ' +
            'the cross-references and finds them crossed. "The Archive will ' +
            'not know what to do with this," he says. "It has never received ' +
            'anything correctly filed." He signs his second third.',
        seaworthy:
            'Sound work. One card out of order, one seal thumbed. He reads ' +
            'it the way old men read weather, and signs. "The Index will ' +
            'find the flaw. Make it find nothing else."',
        driftwood:
            'The clasps hold, barely. The wax ran. "You have written the ' +
            'Archive another misfiled truth," he says. "It will fit right ' +
            'in." He signs it, slowly, so you can watch.',
    }),
    spaces: Object.freeze([
        {
            id: 'returns-desk',
            kind: 'slipway' as const,
            name: 'THE RETURNS DESK',
            flavor: 'Nothing has been returned here in living memory. The ledger lies open on the counter, patient.',
        },
        {
            id: 'broken-shelving',
            kind: 'gather' as const,
            name: 'THE BROKEN SHELVING',
            flavor: 'A collapsed range of good oak. The Archive keeps everything, including its own wreckage.',
            gather: {
                part: 'plank' as const,
                perPress: 2,
                bustFloor: 1,
                bustBite: 1,
                maxPress: 3,
            },
        },
        {
            id: 'overdue-crate',
            kind: 'cache' as const,
            name: 'THE OVERDUE CRATE',
            flavor: 'Marked FOR SORTING in a hand that died optimistic.',
            cache: {
                finds: Object.freeze([
                    { weight: 3, label: 'A reading-room ration tin, unopened. Librarians hoard against long shifts.', fish: 2 },
                    { weight: 2, label: 'Copper clasps in a paper twist, counted by a careful hand.', parts: { part: 'nail' as const, count: 1 } },
                    { weight: 2, label: 'A block of blank index cards, edges still sharp.', parts: { part: 'cloth' as const, count: 1 } },
                    { weight: 1, label: 'Sorted after all. A receipt, initialed in thirds.', fish: 0 },
                ]),
            },
        },
        {
            id: 'toppled-stacks',
            kind: 'snag' as const,
            name: 'THE TOPPLED STACKS',
            flavor: 'A range fell across the aisle years ago. The Archive filed the accident and kept the obstruction.',
            snag: { threshold: 4, bite: 1, slipBack: 2, detourFish: 1 },
        },
        {
            id: 'pulp-worm',
            kind: 'duel' as const,
            name: 'THE PULP WORM',
            flavor: 'It has eaten arguments better than yours. It says so, in bore-holes.',
            duel: {
                foe: 'THE PULP WORM',
                foeBonus: 2,
                spoils: { part: 'nail' as const, count: 2 },
                bite: 1,
                bribeFish: 2,
            },
        },
        {
            id: 'bindery-stall',
            kind: 'market' as const,
            name: 'THE BINDERY STALL',
            flavor: 'An abandoned bench that still trades, by house rules. Leave payment. Take stock. It counts.',
            market: {
                offers: Object.freeze([
                    { part: 'pitch' as const, count: 1, fishCost: 3 },
                    { part: 'cloth' as const, count: 1, fishCost: 3 },
                    { part: 'nail' as const, count: 2, fishCost: 2 },
                ]),
            },
        },
        {
            id: 'under-librarian',
            kind: 'parley' as const,
            name: 'THE UNDER-LIBRARIAN',
            flavor: 'Paper skin, spectacles of scratched horn. Rank: beneath everything.',
            parley: {
                npc: 'THE UNDER-LIBRARIAN',
                prompt:
                    '"A ledger. How retro." The voice is dust settling. ' +
                    '"I outrank nothing here, which means I am the only one ' +
                    'free to bargain. Choose."',
                options: Object.freeze([
                    {
                        id: 'trade',
                        label: 'TRADE PROVISIONS FOR CLASPS',
                        desc: '−2 fish, +2 copper clasps.',
                        fish: -2,
                        parts: { part: 'nail' as const, count: 2 },
                        outcome: 'The provisions vanish into a drawer marked MISCELLANY. The clasps are true copper. "Undocumented transaction," it says, fondly.',
                    },
                    {
                        id: 'sort',
                        label: 'SORT A TROLLEY BESIDE IT',
                        desc: '−1 vigor, +1 block of index cards.',
                        vigor: -1,
                        parts: { part: 'cloth' as const, count: 1 },
                        outcome: 'An hour of call numbers. It corrects your ordering eleven times, then pays in cards. "You alphabetize like someone with somewhere to be. Envy," it adds, "is filed under E."',
                    },
                    {
                        id: 'listen',
                        label: 'ASK ABOUT THE INDEX',
                        desc: 'Hear it out. The next roll gains +2 wind.',
                        wind: 2,
                        outcome: '"It cannot bear an unlabeled thing. Walk like you are already catalogued and it will look past you." The best advice in the building, shelved at the bottom.',
                    },
                    {
                        id: 'commission',
                        label: 'BUY THE ARCHIVAL CLASPS',
                        desc: 'A full purse only. −5 fish, +3 copper clasps.',
                        requires: { fish: 6 },
                        fish: -5,
                        parts: { part: 'nail' as const, count: 3 },
                        outcome: 'It weighs the purse and adjusts its opinion of you upward, one shelf. The clasps it brings out are archival grade. "These have held shut things that argued back."',
                    },
                ]),
            },
        },
        {
            id: 'reading-lamp',
            kind: 'hearth' as const,
            name: 'THE READING LAMP',
            flavor: 'One green-shaded lamp, lit. Lamps are lit where someone will walk. Sit. Breathe. Go.',
            hearth: { vigor: 3 },
        },
        {
            id: 'condemned-wing',
            kind: 'gather' as const,
            name: 'THE CONDEMNED WING',
            flavor: 'Good boards under bad ceilings. The Archive will not miss what it refuses to enter.',
            gather: {
                part: 'plank' as const,
                perPress: 2,
                bustFloor: 1,
                bustBite: 2,
                maxPress: 5,
            },
        },
        {
            id: 'wax-cellar',
            kind: 'gather' as const,
            name: 'THE WAX CELLAR',
            flavor: 'Seals by the barrel, half of them still warm. Do not ask what the Archive is sealing.',
            gather: {
                part: 'pitch' as const,
                perPress: 2,
                bustFloor: 2,
                bustBite: 1,
                maxPress: 3,
            },
        },
        {
            id: 'misshelved-map',
            kind: 'omen' as const,
            name: 'THE MISSHELVED MAP',
            flavor: 'A floor plan of the Archive, filed under fiction. It is more honest there.',
            omen: {
                lines: Object.freeze([
                    'The map shows a straight aisle where you had been walking a spiral.',
                    'Someone annotated it: TRUST THE SHELVES, NOT THE SIGNAGE.',
                    'For a while the stacks arrange themselves the way the fiction promised.',
                ]),
                wind: 2,
            },
        },
        {
            id: 'copyist',
            kind: 'parley' as const,
            name: 'THE COPYIST',
            flavor: 'She has transcribed the same argument for a century. Her needle-pen is law.',
            parley: {
                npc: 'THE COPYIST',
                prompt:
                    'She looks at your hands, not your face. "Cards want ' +
                    'paying for. Provisions, labor, or listening — and I ' +
                    'have heard everything twice."',
                options: Object.freeze([
                    {
                        id: 'pay',
                        label: 'PAY IN PROVISIONS',
                        desc: '−3 fish, +1 block of index cards.',
                        fish: -3,
                        parts: { part: 'cloth' as const, count: 1 },
                        outcome: 'She counts twice, then cuts the block generous. "For the ledger, is it." You do not answer. "Mm," she says, knowing.',
                    },
                    {
                        id: 'rule',
                        label: 'RULE LINES BESIDE HER',
                        desc: '−1 vigor, +1 block of index cards, +1 fish.',
                        vigor: -1,
                        parts: { part: 'cloth' as const, count: 1 },
                        fish: 1,
                        outcome: 'An afternoon of straight lines. She corrects your hand eleven times and pays in cards, and slips a ration in your bag besides.',
                    },
                    {
                        id: 'bolt',
                        label: 'BUY THE WHOLE REAM',
                        desc: 'For a serious clerk. −4 fish, +2 blocks of index cards.',
                        requires: { fish: 5 },
                        fish: -4,
                        parts: { part: 'cloth' as const, count: 2 },
                        outcome: 'She looks at the provisions, then at you, and decides you mean it. The whole ream comes off the shelf. "Write small," she says. "The house reads everything."',
                    },
                    {
                        id: 'decline',
                        label: 'BOW AND GO',
                        desc: 'Keep what you have. Keep walking.',
                        outcome: '"Suit yourself," she says, in the tone of someone who has copied many clerks\' last entries.',
                    },
                ]),
            },
        },
        {
            id: 'hollow-folio',
            kind: 'cache' as const,
            name: 'THE HOLLOW FOLIO',
            flavor: 'A book too heavy for its title. Everyone knows the trick. No one looks.',
            cache: {
                finds: Object.freeze([
                    { weight: 3, label: 'A reader\'s emergency store, pressed flat between chapters.', fish: 3 },
                    { weight: 2, label: 'A case board, cut to size and hidden from the bindery.', parts: { part: 'plank' as const, count: 1 } },
                    { weight: 2, label: 'A cake of sealing wax, thumbprinted by someone long shelved.', parts: { part: 'pitch' as const, count: 1 } },
                    { weight: 1, label: 'A pressed flower and a sentence of encouragement. Uncatalogued. Kept.', vigor: 1 },
                ]),
            },
        },
        {
            id: 'index-prefect',
            kind: 'duel' as const,
            name: "THE INDEX'S PREFECT",
            flavor: 'A drawer-chested underling patrolling the best boards. It intends to file you as a precedent.',
            duel: {
                foe: "THE INDEX'S PREFECT",
                foeBonus: 2,
                spoils: { part: 'plank' as const, count: 2 },
                bite: 2,
                bribeFish: 3,
            },
        },
        {
            id: 'catalogue-chasm',
            kind: 'snag' as const,
            name: 'THE CATALOGUE CHASM',
            flavor: 'The floor gives way to a stairwell of drawers descending past lamplight. The rail is a rumor.',
            snag: { threshold: 4, bite: 1, slipBack: 3, detourFish: 2 },
        },
        {
            id: 'kind-marginalia',
            kind: 'omen' as const,
            name: 'THE KIND MARGINALIA',
            flavor: 'In a ruined concordance, one margin note addressed to no one: KEEP GOING. IT ENDS.',
            omen: {
                lines: Object.freeze([
                    'The hand is old, older than the Sophist\'s thirds.',
                    'Beneath it, smaller: IT DOES NOT END. BUT KEEP GOING.',
                    'You walk lighter anyway. Contradictions carry, if they are kind.',
                ]),
                wind: 1,
            },
        },
    ]),
});

export const SOPHISTS_THIRD_LEDGER_BOARD: QuestBoardDef = Object.freeze({
    id: 'sophists-third-ledger',
    title: "THE SOPHIST'S THIRD LEDGER",
    storyBeat: 'The Aporia, Act III — The Proof: the house requires its paperwork before the Sophist himself.',
    intro:
        'Last act. The house stops decorating this deep; so will I. Before ' +
        'the Proof admits you, the Third Ledger must be filled: premises ' +
        'quarried, ink true, fair copies made, rivets set. I have signed ' +
        'two thirds of a name into your margins already. In my study a ' +
        'fourth ledger waits, blank, for whoever finishes what I could ' +
        'not. Set your mark. I am watching closely now.',
    boardHeadline: 'THE LAST ACCOUNT BEFORE THE FLOOR',
    pieceName: 'YOUR MARK',
    startFish: 12,
    startVigor: 8,
    maxVigor: 8,
    partsRequired: Object.freeze({ plank: 3, pitch: 1, cloth: 2, nail: 2 }),
    partNames: Object.freeze({
        plank: 'SOUND PREMISES',
        pitch: 'INK OF RECORD',
        cloth: 'FAIR COPIES',
        nail: 'IRON RIVETS',
    }),
    outcomeCopy: Object.freeze({
        masterwork:
            'He reads it once, because once is enough, and lays his pen ' +
            'down across the final signature: the last third of a name. ' +
            '"Complete," he says, and the word costs him. "The fourth ' +
            'ledger is still blank. It was always going to be filled by ' +
            'someone else\'s hand. Go down and earn it."',
        seaworthy:
            'An honest account, riveted plain. He signs the last third ' +
            'of his name and does not look up. "It will hold. Most true ' +
            'things are ugly. The Proof will not mark you down for that."',
        driftwood:
            'The rivets hold what the premises will not. He signs anyway, ' +
            'the whole third at once, like a man paying a debt. "The house ' +
            'asked for a proof and got a plea. Go down regardless. The ' +
            'fourth ledger does not care what the third one looked like."',
    }),
    spaces: Object.freeze([
        {
            id: 'foundation-ledge',
            kind: 'slipway' as const,
            name: 'THE FOUNDATION LEDGE',
            flavor: 'Bare stone above the last descent. The ledger lies open on it, weighted with a waystone chip.',
        },
        {
            id: 'quarry-of-premises',
            kind: 'gather' as const,
            name: 'THE QUARRY OF PREMISES',
            flavor: 'Stone that agrees to bear weight, if cut honestly. Cut honestly.',
            gather: {
                part: 'plank' as const,
                perPress: 2,
                bustFloor: 1,
                bustBite: 1,
                maxPress: 3,
            },
        },
        {
            id: 'last-walkers-cache',
            kind: 'cache' as const,
            name: "THE LAST WALKER'S CACHE",
            flavor: 'Whoever came furthest before you left their kit here. The house holds it in escrow.',
            cache: {
                finds: Object.freeze([
                    { weight: 3, label: 'Iron rations, wrapped in an oath of return.', fish: 2 },
                    { weight: 2, label: 'Rivets, forge-true, counted into a leather palm.', parts: { part: 'nail' as const, count: 1 } },
                    { weight: 2, label: 'A fair copy of an argument you had not thought to make.', parts: { part: 'cloth' as const, count: 1 } },
                    { weight: 1, label: 'Claimed by the house. A lien notice, signed in thirds.', fish: 0 },
                ]),
            },
        },
        {
            id: 'unfounded-step',
            kind: 'snag' as const,
            name: 'THE UNFOUNDED STEP',
            flavor: 'Mind the first step. There is no first step.',
            snag: { threshold: 4, bite: 1, slipBack: 2, detourFish: 1 },
        },
        {
            id: 'circular-warder',
            kind: 'duel' as const,
            name: 'THE CIRCULAR WARDER',
            flavor: 'It guards the rivets because the rivets are guarded. It sees no problem with this.',
            duel: {
                foe: 'THE CIRCULAR WARDER',
                foeBonus: 2,
                spoils: { part: 'nail' as const, count: 2 },
                bite: 1,
                bribeFish: 2,
            },
        },
        {
            id: 'debt-niche',
            kind: 'market' as const,
            name: 'THE DEBT NICHE',
            flavor: 'The house extends credit to no one, this deep. Cash terms. The scale is honest, which is worse.',
            market: {
                offers: Object.freeze([
                    { part: 'pitch' as const, count: 1, fishCost: 3 },
                    { part: 'cloth' as const, count: 1, fishCost: 3 },
                    { part: 'nail' as const, count: 2, fishCost: 2 },
                ]),
            },
        },
        {
            id: 'sophist-closer',
            kind: 'parley' as const,
            name: 'THE SOPHIST, CLOSER THAN BEFORE',
            flavor: 'He no longer bothers to arrive. He is simply present, the way a debt is.',
            parley: {
                npc: 'THE SOPHIST',
                prompt:
                    '"The last ledger." He does not touch it. "I filled two ' +
                    'of these myself, once. The third defeated me. Take ' +
                    'what you need. The prices are old, like everything ' +
                    'of mine you have been using."',
                options: Object.freeze([
                    {
                        id: 'trade',
                        label: 'TRADE PROVISIONS FOR IRON',
                        desc: '−2 fish, +2 iron rivets.',
                        fish: -2,
                        parts: { part: 'nail' as const, count: 2 },
                        outcome: 'He takes the provisions without weighing them. "I know what things cost here." The rivets are old iron, and true.',
                    },
                    {
                        id: 'draft',
                        label: 'DRAFT UNDER HIS EYE',
                        desc: '−1 vigor, +1 fair copy.',
                        vigor: -1,
                        parts: { part: 'cloth' as const, count: 1 },
                        outcome: 'He corrects nothing. That is the unnerving part. At the end he hands back a fair copy in your own improved hand. "You see. Borrowing goes both ways."',
                    },
                    {
                        id: 'listen',
                        label: 'ASK WHAT DEFEATED HIM',
                        desc: 'Hear him out. The next roll gains +2 wind.',
                        wind: 2,
                        outcome: '"I carried my premises down like furniture and would not set one down to open the door." A silence. "Travel lighter than I did." It is not advice. It is a will.',
                    },
                    {
                        id: 'commission',
                        label: 'BUY THE FOUNDRY RIVETS',
                        desc: 'A full purse only. −5 fish, +3 iron rivets.',
                        requires: { fish: 6 },
                        fish: -5,
                        parts: { part: 'nail' as const, count: 3 },
                        outcome: 'The purse changes hands. From under his coat: rivets struck before the house had a narrator. "These held the first ledger shut. Yours may as well outlast me too."',
                    },
                ]),
            },
        },
        {
            id: 'third-waystone',
            kind: 'hearth' as const,
            name: 'THE THIRD WAYSTONE',
            flavor: 'The last true granite before the floor. The house holds your place. It has held his for centuries.',
            hearth: { vigor: 3 },
        },
        {
            id: 'load-bearing-row',
            kind: 'gather' as const,
            name: 'THE LOAD-BEARING ROW',
            flavor: 'Premises already proven by standing. Take rubbings of what refuses to fall.',
            gather: {
                part: 'plank' as const,
                perPress: 2,
                bustFloor: 1,
                bustBite: 2,
                maxPress: 5,
            },
        },
        {
            id: 'inkwell-sump',
            kind: 'gather' as const,
            name: 'THE INKWELL SUMP',
            flavor: 'Ink of record pools under the scriptorium ruin. Black under black water. It keeps what it grabs.',
            gather: {
                part: 'pitch' as const,
                perPress: 2,
                bustFloor: 2,
                bustBite: 2,
                maxPress: 3,
            },
        },
        {
            id: 'scrubbed-proof',
            kind: 'omen' as const,
            name: 'THE SCRUBBED PROOF',
            flavor: 'A wall where someone worked a proof to the last line, then scrubbed it. The ghost of it still argues.',
            omen: {
                lines: Object.freeze([
                    'The erasure spared one lemma. It is sound. You pocket it with your eyes.',
                    'Whoever scrubbed it pressed hard. Shame presses hard.',
                    'For a stretch of corridor, the way down feels derivable.',
                ]),
                wind: 2,
            },
        },
        {
            id: 'first-question',
            kind: 'parley' as const,
            name: 'THE FIRST QUESTION',
            flavor: 'It stands in the corridor the way weather stands in a doorway. It was here before the Sophist.',
            parley: {
                npc: 'THE FIRST QUESTION',
                prompt:
                    'It does not speak so much as require. What it requires, ' +
                    'gently, endlessly, is an answer. Any answer. Priced ' +
                    'accordingly.',
                options: Object.freeze([
                    {
                        id: 'pay',
                        label: 'ANSWER WITH PROVISIONS',
                        desc: '−3 fish, +1 fair copy.',
                        fish: -3,
                        parts: { part: 'cloth' as const, count: 1 },
                        outcome: 'It accepts the offering the way questions accept anything: partially. What remains behind is a fair copy of your best attempt, better than you made it.',
                    },
                    {
                        id: 'stand',
                        label: 'STAND AND BE ASKED',
                        desc: '−1 vigor, +1 fair copy, +1 fish.',
                        vigor: -1,
                        parts: { part: 'cloth' as const, count: 1 },
                        fish: 1,
                        outcome: 'It asks. You do not flinch, entirely. The asking leaves a transcript in your satchel and, oddly, a ration. Even questions keep old courtesies.',
                    },
                    {
                        id: 'bolt',
                        label: 'ANSWER IN FULL',
                        desc: 'For the well-provisioned only. −4 fish, +2 fair copies.',
                        requires: { fish: 5 },
                        fish: -4,
                        parts: { part: 'cloth' as const, count: 2 },
                        outcome: 'You give it everything you carry that is true. It considers, and returns two fair copies and the sense of having been, briefly, read all the way through.',
                    },
                    {
                        id: 'decline',
                        label: 'DECLINE TO ANSWER',
                        desc: 'Keep what you have. Keep walking.',
                        outcome: 'It lets you pass. Declining is an answer. Everything is, which is the trouble with it.',
                    },
                ]),
            },
        },
        {
            id: 'oubliette-grate',
            kind: 'cache' as const,
            name: 'THE OUBLIETTE GRATE',
            flavor: 'Things dropped by the ejected collect on the grate. The house calls this an amnesty.',
            cache: {
                finds: Object.freeze([
                    { weight: 3, label: 'A confiscated provision bag, returned by the letter of some rule.', fish: 3 },
                    { weight: 2, label: 'A sound premise, dropped mid-fall and none the worse.', parts: { part: 'plank' as const, count: 1 } },
                    { weight: 2, label: 'A vial of record ink, stoppered against despair.', parts: { part: 'pitch' as const, count: 1 } },
                    { weight: 1, label: 'A chair leg. The chair fit. Remember that it fit.', vigor: 1 },
                ]),
            },
        },
        {
            id: 'penult',
            kind: 'duel' as const,
            name: 'THE PENULT',
            flavor: 'The second-to-last thing the house will put in your way. It takes the job seriously.',
            duel: {
                foe: 'THE PENULT',
                foeBonus: 3,
                spoils: { part: 'plank' as const, count: 2 },
                bite: 2,
                bribeFish: 3,
            },
        },
        {
            id: 'narrowing',
            kind: 'snag' as const,
            name: 'THE NARROWING',
            flavor: 'The corridor closes to the width of one honest argument. Exhale. Commit.',
            snag: { threshold: 5, bite: 1, slipBack: 3, detourFish: 2 },
        },
        {
            id: 'fourth-ledger',
            kind: 'omen' as const,
            name: 'THE FOURTH LEDGER',
            flavor: 'Through a study door ajar: a desk, a lamp, and a ledger with nothing in it. Waiting.',
            omen: {
                lines: Object.freeze([
                    'Three ledgers bear a name in thirds. The fourth bears nothing at all.',
                    'The pen beside it is full. It has been full for centuries. That is the confession.',
                    'You were going to finish this anyway. Now you know on whose behalf.',
                ]),
                wind: 1,
            },
        },
    ]),
});

export const QUEST_BOARDS: readonly QuestBoardDef[] = Object.freeze([
    BUILD_THE_BOAT_BOARD,
    SOPHISTS_FIRST_LEDGER_BOARD,
    SOPHISTS_SECOND_LEDGER_BOARD,
    SOPHISTS_THIRD_LEDGER_BOARD,
]);

const BOARDS_BY_ID = new Map(QUEST_BOARDS.map(b => [b.id, b]));

export function getQuestBoardDef(id: string): QuestBoardDef {
    const def = BOARDS_BY_ID.get(id);
    if (!def) throw new Error(`QuestBoard: unknown board '${id}'.`);
    return def;
}
