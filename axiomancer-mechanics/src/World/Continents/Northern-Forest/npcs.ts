import { NPC, DialogueTree } from '../../../NPCs/types';

// ─── The Shrine Keeper (skepticism vs belief in the stone's pattern) ─────────

const shrineKeeperTree: DialogueTree = {
    id: 'shrine-keeper',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "The Shrine Keeper kneels at a root-lifted stone, scraping moss from a carved groove. “Another set of boots on the path. The stone keeps its own count.”",
            choices: [
                {
                    text: "What does it count?",
                    nextNodeId: 'patterns',
                },
                {
                    text: "Something here feels different to me.",
                    nextNodeId: 'veil_thin',
                    requires: { requiresAlignment: { axis: 'epistemology', op: 'gte', value: 20 } },
                    effect: { alignmentDelta: { epistemology: 2, scope: 1 } },
                },
                {
                    text: "Stone doesn't count. That's superstition.",
                    nextNodeId: 'skeptic_response',
                    requires: { requiresAlignment: { axis: 'epistemology', op: 'lte', value: -20 } },
                    effect: { alignmentDelta: { epistemology: -1, outlook: -1 } },
                },
                {
                    text: "Leave quietly.",
                    nextNodeId: undefined,
                },
                {
                    text: "(The Keeper's eyes catch on you. Something in you has changed.)",
                    nextNodeId: 'observer_transformation',
                    requires: { playerAlignmentCellChangedSince: true },
                    effect: { alignmentDelta: { scope: 2 } },
                },
            ],
        },
        patterns: {
            id: 'patterns',
            text: "“Every hand that touches this groove wears it smoother. Yours will too. The question is what you're wearing it toward.”",
            choices: [
                {
                    text: "I want to understand what's really here.",
                    nextNodeId: 'truth_seeker',
                    effect: {
                        alignmentDelta: { epistemology: 3, scope: 2 },
                        setFlag: 'shrine_keeper_recognizes_seeker'
                    },
                },
                {
                    text: "I want knowledge I can use.",
                    nextNodeId: 'practical_seeker',
                    effect: { alignmentDelta: { epistemology: -1, outlook: 1 } },
                },
                {
                    text: "That's a boot-worn groove. Nothing more.",
                    nextNodeId: 'dismiss_mysticism',
                    effect: { alignmentDelta: { epistemology: -2, scope: -1 } },
                },
            ],
        },
        veil_thin: {
            id: 'veil_thin',
            text: "“You're not the first to feel it. Take this, and judge for yourself.” The Keeper presses a crystalline fragment into your palm. It is heavier than it looks.",
            choices: [
                {
                    text: "Accept the crystal.",
                    nextNodeId: undefined,
                    effect: {
                        setFlag: 'shrine_keeper_crystal_gift',
                        alignmentDelta: { epistemology: 2, scope: 1 },
                        moralDelta: 1
                    },
                },
                {
                    text: "I can't take something this valuable.",
                    nextNodeId: undefined,
                    effect: {
                        alignmentDelta: { scope: -1, outlook: 1 },
                        moralDelta: 2
                    },
                },
            ],
        },
        skeptic_response: {
            id: 'skeptic_response',
            text: "The Keeper's face doesn't change. “Some backs carry more weight than others. The shrine isn't going anywhere.”",
        },
        truth_seeker: {
            id: 'truth_seeker',
            text: "“Then you already carry the right kind of empty. The north glyphs are cut plain, if you know where to stand.”",
            choices: [
                {
                    text: "Will you teach me to read them?",
                    nextNodeId: undefined,
                    effect: {
                        setFlag: 'shrine_keeper_teaching_offered',
                        alignmentDelta: { epistemology: 2, scope: 1 }
                    },
                },
            ],
        },
        practical_seeker: {
            id: 'practical_seeker',
            text: "“Practical is not nothing. Whoever cut this stone kept accounts as well as prayers.”",
        },
        dismiss_mysticism: {
            id: 'dismiss_mysticism',
            text: "“Doubt doesn't erase a groove already worn. The stone doesn't care what you believe.”",
        },
        observer_transformation: {
            id: 'observer_transformation',
            text: "“You've changed since we last spoke. The stone will wear a new mark for it.”",
        },
    },
};

const shrineKeeper: NPC = {
    name: 'Shrine Keeper',
    description: 'Tends a shrine of root-lifted stones and reads the wear each visitor leaves in them.',
    dialogueTree: shrineKeeperTree,
};

// ─── The Chronicler (documented fact vs unsourced claim) ─────────────────────

const chroniclerTree: DialogueTree = {
    id: 'chronicler',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "The Chronicler sets down a quill beside a stack of tally slats. “Another traveler. Tell me something true, and I'll add it to the Chronicle.”",
            choices: [
                {
                    text: "What are you chronicling here?",
                    nextNodeId: 'chronicling_purpose',
                },
                {
                    text: "I've seen strange things in my travels.",
                    nextNodeId: 'share_observations',
                    effect: {
                        alignmentDelta: { epistemology: 1, scope: 1 },
                        setFlag: 'chronicler_met'
                    },
                },
                {
                    text: "I don't have time for scholarly pursuits.",
                    nextNodeId: 'no_time',
                    effect: { alignmentDelta: { outlook: -1, scope: -1 } },
                },
                {
                    text: "Move along without disturbing their work.",
                    nextNodeId: undefined,
                },
                {
                    text: "(The Chronicler looks up. Something about you reads differently now.)",
                    nextNodeId: 'scholar_observation',
                    requires: { playerAlignmentCellChangedSince: true },
                    effect: { alignmentDelta: { epistemology: 1 } },
                },
            ],
        },
        chronicling_purpose: {
            id: 'chronicling_purpose',
            text: "“I document the forgotten histories. Pre-coastal civilizations. Old migration routes. Alliances folk struck with the forest, before the village came.”",
            choices: [
                {
                    text: "How can I contribute to this work?",
                    nextNodeId: 'contribution_offer',
                    effect: {
                        alignmentDelta: { epistemology: 2, scope: 1 },
                        setFlag: 'chronicle_contributor'
                    },
                },
                {
                    text: "Why preserve the past? Focus on the present.",
                    nextNodeId: 'present_focus',
                    requires: { requiresAlignment: { axis: 'scope', op: 'lte', value: -10 } },
                    effect: { alignmentDelta: { scope: -1, outlook: 1 } },
                },
            ],
        },
        share_observations: {
            id: 'share_observations',
            text: "“Every observation matters. What you call strange, I call a pattern I haven't dated yet.”",
            choices: [
                {
                    text: "Tell me more about these patterns.",
                    nextNodeId: 'ancient_patterns',
                    effect: {
                        alignmentDelta: { epistemology: 1, scope: 1 }
                    },
                },
                {
                    text: "I've documented my travels carefully.",
                    nextNodeId: 'documented_travels',
                    effect: {
                        alignmentDelta: { epistemology: 1, scope: 2 },
                        moralDelta: 1
                    },
                },
            ],
        },
        no_time: {
            id: 'no_time',
            text: "“Understood. Write your history first. I'll still be here when you want it recorded.”",
        },
        contribution_offer: {
            id: 'contribution_offer',
            text: "“Note what you find in the northern reaches. Unusual growth, old foundations, stories the locals repeat. Each entry earns its line.”",
            choices: [
                {
                    text: "I accept this scholarly responsibility.",
                    nextNodeId: undefined,
                    effect: {
                        setFlag: 'chronicler_scholarly_mission',
                        alignmentDelta: { epistemology: 2, scope: 2 }
                    },
                },
            ],
        },
        present_focus: {
            id: 'present_focus',
            text: "“Pragmatic. Even pragmatists trip on roots they didn't know were there.”",
        },
        ancient_patterns: {
            id: 'ancient_patterns',
            text: "“They built by the seasons — planting, felling, resting the same ground in turn. You can still read the rotation in the tree rings.”",
        },
        documented_travels: {
            id: 'documented_travels',
            text: "“Good. Dated entries are worth more than memory. Bring me the gaps you've filled.”",
        },
        scholar_observation: {
            id: 'scholar_observation',
            text: "“You've changed your position since we last spoke. I'll want the reasons, not just the result.”",
        },
    },
};

const chronicler: NPC = {
    name: 'The Chronicler',
    description: 'Keeps the Chronicle — a ledger of forgotten histories, migration routes, and things travelers swear they saw.',
    dialogueTree: chroniclerTree,
};

// ─── The Wandering Philosopher (fate, will, or relationship) ─────────────────

const wanderingPhilosopherTree: DialogueTree = {
    id: 'wandering-philosopher',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "A weathered figure sits against a tree, whittling a peg with a worn knife. “Another traveler. This wood is good for thinking. What are you walking away from?”",
            choices: [
                {
                    text: "I'm seeking my place in the world.",
                    nextNodeId: 'seeking_place',
                    effect: { alignmentDelta: { scope: 1, epistemology: 1 } },
                },
                {
                    text: "Just passing through.",
                    nextNodeId: 'passing_through',
                },
                {
                    text: "The forest offers peace for reflection.",
                    nextNodeId: 'reflective_peace',
                    requires: { requiresAlignment: { axis: 'outlook', op: 'gte', value: 10 } },
                    effect: { alignmentDelta: { outlook: 1, scope: 1 } },
                },
                {
                    text: "I've no patience for philosophical rambling.",
                    nextNodeId: 'impatient_response',
                    requires: { requiresAlignment: { axis: 'outlook', op: 'lte', value: -10 } },
                    effect: { alignmentDelta: { outlook: -1, scope: -1 } },
                },
                {
                    text: "(The Philosopher looks up — something about you has changed.)",
                    nextNodeId: 'philosophical_recognition',
                    requires: { playerAlignmentCellChangedSince: true },
                    effect: { alignmentDelta: { epistemology: 1 } },
                },
            ],
        },
        seeking_place: {
            id: 'seeking_place',
            text: "“Fair question to walk on. Is our place fate, forged by will, or discovered through relationship with others?”",
            choices: [
                {
                    text: "Fate guides us toward our destined role.",
                    nextNodeId: 'fate_perspective',
                    requires: { requiresAlignment: { axis: 'epistemology', op: 'gte', value: 15 } },
                    effect: { alignmentDelta: { epistemology: 2, scope: -1 } },
                },
                {
                    text: "We forge our own destiny through determination.",
                    nextNodeId: 'will_perspective',
                    requires: { requiresAlignment: { axis: 'scope', op: 'lte', value: 0 } },
                    effect: { alignmentDelta: { scope: -2, outlook: 1 } },
                },
                {
                    text: "We find ourselves through community and connection.",
                    nextNodeId: 'community_perspective',
                    requires: { requiresAlignment: { axis: 'scope', op: 'gte', value: 15 } },
                    effect: { alignmentDelta: { scope: 2, outlook: 1 } },
                },
                {
                    text: "I'm not sure. That's why I'm searching.",
                    nextNodeId: 'uncertain_seeker',
                    effect: {
                        alignmentDelta: { epistemology: 1 },
                        moralDelta: 1,
                        setFlag: 'philosopher_appreciates_honesty'
                    },
                },
            ],
        },
        passing_through: {
            id: 'passing_through',
            text: "“Nobody just passes through. Every step changes the path a little, and the walker more.”",
            choices: [
                {
                    text: "I hadn't considered the impact of my journey.",
                    nextNodeId: 'impact_realization',
                    effect: { alignmentDelta: { scope: 2, epistemology: 1 } },
                },
                {
                    text: "Sometimes a walk is just a walk.",
                    nextNodeId: 'simple_acceptance',
                    effect: { alignmentDelta: { epistemology: -1, outlook: 1 } },
                },
            ],
        },
        reflective_peace: {
            id: 'reflective_peace',
            text: "“Yes. Trees keep their own season. No amount of hurry moves a coppice cut faster.”",
            choices: [
                {
                    text: "What have the trees taught you?",
                    nextNodeId: 'tree_wisdom',
                    effect: { alignmentDelta: { epistemology: 1, outlook: 2 } },
                },
            ],
        },
        impatient_response: {
            id: 'impatient_response',
            text: "“Understood. Go, then. Even a fast walker rests on someone else's thinking eventually.”",
        },
        fate_perspective: {
            id: 'fate_perspective',
            text: "“Fate writes, then. Who answers for the choices, if the ending's already set?”",
        },
        will_perspective: {
            id: 'will_perspective',
            text: "“Strong claim. Even the strongest arm still needs a second pair of hands sometimes.”",
        },
        community_perspective: {
            id: 'community_perspective',
            text: "“Well answered. Just don't let the group finish every one of your sentences.”",
        },
        uncertain_seeker: {
            id: 'uncertain_seeker',
            text: "“Good. A question honestly held opens more than a false answer ever will.”",
        },
        impact_realization: {
            id: 'impact_realization',
            text: "“Every talk changes both of us a little. Your questions shift my answers. Meaning gets made in the meeting, not before it.”",
        },
        simple_acceptance: {
            id: 'simple_acceptance',
            text: "“Fair enough. Not every step needs unpacking to be worth taking.”",
        },
        tree_wisdom: {
            id: 'tree_wisdom',
            text: "“Patience, mostly. Roots share water underground long before either tree needs it. They rest on schedule, not on fear.”",
        },
        philosophical_recognition: {
            id: 'philosophical_recognition',
            text: "“You've changed your footing since we last talked. Good. Stillness was never the point.”",
        },
    },
};

const wanderingPhilosopher: NPC = {
    name: 'The Wandering Philosopher',
    description: 'A traveler who camps light and answers most questions with a sharper one.',
    dialogueTree: wanderingPhilosopherTree,
};

// ─── The Forest Ranger (conservation vs exploitation) ────────────────────────

const forestRangerTree: DialogueTree = {
    id: 'forest-ranger',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "The Forest Ranger steps out from behind an oak, bow slack in one hand. Bark chips cling to their sleeve from measuring a fresh cut.",
            choices: [
                {
                    text: "*Talk — Ask about their duties here",
                    nextNodeId: 'talk_duties',
                },
                {
                    text: "Can you guide me through these woods?",
                    nextNodeId: 'request_guidance',
                },
                {
                    text: "Nod respectfully and continue deeper into the forest.",
                    nextNodeId: undefined,
                },
                {
                    // Phase 8 — appended last; grants get-to-cave.
                    text: "What's past the tree line?",
                    nextNodeId: 'ranger_cave_directions',
                    effect: { startQuest: 'get-to-cave' },
                },
            ],
        },
        ranger_cave_directions: {
            id: 'ranger_cave_directions',
            // Phase 8 — terminal node for the get-to-cave quest grant.
            text: "“A cave mouth cuts the cliff at the forest's far edge. Cold air spills from it even in summer. Follow the deer trail east. Do not linger past dusk. I mark the safe path, not what waits in it.”",
        },
        talk_duties: {
            id: 'talk_duties',
            text: "“I guard these groves from clear-cutting. There's a logging operation pushing north — they want the heartwood of the eldest trees. Good money, south of here. I could stop them. Their crews still need the wages. The village still needs the trade. I don't have a clean answer.”",
            choices: [
                {
                    text: "The forest endures. It always has.",
                    nextNodeId: 'nature_wisdom_endures',
                    requires: { requiresAlignment: { axis: 'epistemology', op: 'gte', value: 15 } },
                    effect: { alignmentDelta: { epistemology: 2, scope: 2 } },
                },
                {
                    text: "I'll fund sustainable forest trades for the loggers.",
                    nextNodeId: 'sustainable_alternatives',
                    requires: { requiresAlignment: { axis: 'scope', op: 'gte', value: 15 } },
                    effect: {
                        alignmentDelta: { scope: 3, outlook: 2 },
                        moralDelta: 3,
                        grantCurrency: -25,
                        setFlag: 'forest_conservation_supporter'
                    },
                },
                {
                    text: "Trees grow back. Let them cut. People eat today.",
                    nextNodeId: 'pragmatic_exploitation',
                    requires: { requiresAlignment: { axis: 'scope', op: 'lte', value: -5 } },
                    effect: {
                        alignmentDelta: { scope: -2, outlook: -1 },
                        moralDelta: -2,
                        grantCurrency: 35,
                        setFlag: 'forest_exploitation_supporter'
                    },
                },
            ],
        },
        request_guidance: {
            id: 'request_guidance',
            text: "“These woods punish the careless. I know the safe lines, for those who ask plainly.”",
        },
        nature_wisdom_endures: {
            id: 'nature_wisdom_endures',
            text: "“Maybe. These trees weathered ice ages before either of us was born. I still count the cut ones.”",
        },
        sustainable_alternatives: {
            id: 'sustainable_alternatives',
            text: "“Good. Mushroom beds, scholar tours, timber cut on a real rotation. Show the crews it pays, and they'll take it.”",
        },
        pragmatic_exploitation: {
            id: 'pragmatic_exploitation',
            text: "“I won't agree. I won't stop you either. The forest fends for itself, same as always.”",
        },
    },
};

const forestRanger: NPC = {
    name: 'Forest Ranger',
    description: 'Patrols the northern woods and counts the trees a logging camp wants against the wages it pays.',
    dialogueTree: forestRangerTree,
};

// ─── The Hermit Sage (isolation vs community obligation) ─────────────────────

const hermitSageTree: DialogueTree = {
    id: 'hermit-sage',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "The Hermit Sage sits beside a small stone shrine, eyes closed, hands still. At your footstep, the eyes open.",
            choices: [
                {
                    text: "*Talk — Ask why they chose solitude",
                    nextNodeId: 'talk_solitude_choice',
                },
                {
                    text: "I seek wisdom.",
                    nextNodeId: 'seek_wisdom',
                },
                {
                    text: "Withdraw quietly to respect their meditation.",
                    nextNodeId: undefined,
                },
                {
                    // Phase 8 — appended last; grants gather-wood.
                    text: "Is there anything you need, out here alone?",
                    nextNodeId: 'hermit_firewood',
                    effect: { startQuest: 'gather-wood' },
                },
            ],
        },
        hermit_firewood: {
            id: 'hermit_firewood',
            // Phase 8 — terminal node for the gather-wood quest grant.
            text: "The Sage's eyes crinkle. “The hearth runs cold faster than these old bones warm it. Three bundles of oak, if you'd spare the walk — I ask little else of the world.”",
        },
        talk_solitude_choice: {
            id: 'talk_solitude_choice',
            text: "“I came here decades ago, away from the noise. Solitude gave me clarity. Lately I wonder if wisdom earned in isolation serves anyone but me. The village below has troubles my knowledge might ease. Is enlightenment selfish, unshared? But sharing costs the isolation that made it. Do you see the trap I'm in?”",
            choices: [
                {
                    text: "Wisdom finds its own way to those who need it.",
                    nextNodeId: 'divine_wisdom_flows',
                    requires: { requiresAlignment: { axis: 'epistemology', op: 'gte', value: 20 } },
                    effect: { alignmentDelta: { epistemology: 3, scope: -1 } },
                },
                {
                    text: "I'll help you share your wisdom while preserving your solitude.",
                    nextNodeId: 'balanced_sharing',
                    requires: { requiresAlignment: { axis: 'scope', op: 'gte', value: 10 } },
                    effect: {
                        alignmentDelta: { scope: 2, epistemology: 1 },
                        moralDelta: 2,
                        grantCurrency: -10,
                        setFlag: 'hermit_wisdom_bridge'
                    },
                },
                {
                    text: "Keep your secrets. Your example teaches more than your advice would.",
                    nextNodeId: 'wisdom_through_example',
                    requires: { requiresAlignment: { axis: 'scope', op: 'lte', value: 0 } },
                    effect: {
                        alignmentDelta: { scope: -1, epistemology: 1 },
                        grantCurrency: 15,
                        setFlag: 'hermit_isolation_supporter'
                    },
                },
            ],
        },
        seek_wisdom: {
            id: 'seek_wisdom',
            text: "“Wisdom isn't given, only found. I can tell you what the silence taught me, if you'll sit still for it.”",
        },
        divine_wisdom_flows: {
            id: 'divine_wisdom_flows',
            text: "“Maybe. If what I know matters, it will reach who needs it. Not through me, maybe. Still, somehow.”",
        },
        balanced_sharing: {
            id: 'balanced_sharing',
            text: "“A fair balance. A few students, and the solitude I still need between them. I hadn't thought anyone would offer to build that.”",
        },
        wisdom_through_example: {
            id: 'wisdom_through_example',
            text: "“Maybe. Someone choosing stillness over more, in plain sight, teaches without a word said.”",
        },
    },
};

const hermitSage: NPC = {
    name: 'Hermit Sage',
    description: 'Decades alone at a forest shrine, weighing whether what he knows is worth carrying down.',
    dialogueTree: hermitSageTree,
};

// ─── The Lost Trader (trust and deception in crisis) ─────────────────────────

const lostTraderTree: DialogueTree = {
    id: 'lost-trader',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "A trader sits against a fallen log, cart overturned, goods scattered across the path. They look up fast, already counting you.",
            choices: [
                {
                    text: "*Talk — Ask what happened here",
                    nextNodeId: 'talk_what_happened',
                },
                {
                    text: "Do you need assistance?",
                    nextNodeId: 'offer_assistance',
                },
                {
                    text: "Keep walking. Not your concern.",
                    nextNodeId: undefined,
                },
            ],
        },
        talk_what_happened: {
            id: 'talk_what_happened',
            text: "“Bandits took everything. Horses, cargo, my coin purse. Left me for dead, they thought. One item's still hidden — worth enough to feed my family a year. I can't carry it alone, and I won't last out here. Would you trust a desperate man? More to the point — should I trust you?”",
            choices: [
                {
                    text: "Providence put us on the same road. That's a bond worth honoring.",
                    nextNodeId: 'sacred_trust_bond',
                    requires: { requiresAlignment: { axis: 'epistemology', op: 'gte', value: 15 } },
                    effect: { alignmentDelta: { epistemology: 2, scope: 1 } },
                },
                {
                    text: "I'll help you carry it. Trust is built through honest action.",
                    nextNodeId: 'honest_mutual_aid',
                    requires: { requiresAlignment: { axis: 'scope', op: 'gte', value: 10 } },
                    effect: {
                        alignmentDelta: { scope: 2, outlook: 1 },
                        moralDelta: 2,
                        grantCurrency: -5,
                        setFlag: 'trader_honest_helper'
                    },
                },
                {
                    text: "Show me the item first. Then we'll talk terms.",
                    nextNodeId: 'pragmatic_verification',
                    requires: { requiresAlignment: { axis: 'outlook', op: 'lte', value: 5 } },
                    effect: {
                        alignmentDelta: { outlook: -1, scope: -1 },
                        grantCurrency: 20,
                        setFlag: 'trader_pragmatic_partner'
                    },
                },
            ],
        },
        offer_assistance: {
            id: 'offer_assistance',
            text: "“You'd help a stranger. That's rarer than the item I'm sitting on.”",
        },
        sacred_trust_bond: {
            id: 'sacred_trust_bond',
            text: "“Sacred bonds. Maybe that's the whole difference between a road and a wilderness. I'll trust you, then.”",
        },
        honest_mutual_aid: {
            id: 'honest_mutual_aid',
            text: "“Honest action. I like the sound of that. Get me to town, and you'll see a fair cut of the profit.”",
        },
        pragmatic_verification: {
            id: 'pragmatic_verification',
            text: "“Clever. Can't fault caution, given what I've survived. Here's the item. Now — terms.”",
        },
    },
};

const lostTrader: NPC = {
    name: 'Lost Trader',
    description: 'Robbed clean by bandits save for one hidden item, and no way to carry it alone.',
    dialogueTree: lostTraderTree,
};

export {
    shrineKeeper,
    chronicler,
    wanderingPhilosopher,
    forestRanger,
    hermitSage,
    lostTrader,
};
