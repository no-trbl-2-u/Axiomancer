import { NPC, DialogueTree } from '../../../NPCs/types';

// ─── The Shrine Keeper (Transcendent-leaning mystic) ─────────────────────────

const shrineKeeperTree: DialogueTree = {
    id: 'shrine-keeper',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "The Shrine Keeper turns from tending ancient carved stones, eyes bright with otherworldly knowing. \"Seeker, the patterns speak of your approach. The veil grows thin here—do you feel it?\"",
            choices: [
                {
                    text: "What patterns do you see?",
                    nextNodeId: 'patterns',
                },
                {
                    text: "I sense something... different about this place.",
                    nextNodeId: 'veil_thin',
                    requires: { requiresAlignment: { axis: 'epistemology', op: 'gte', value: 20 } },
                    effect: { alignmentDelta: { epistemology: 2, scope: 1 } },
                },
                {
                    text: "Just looking around. No mystical nonsense.",
                    nextNodeId: 'skeptic_response',
                    requires: { requiresAlignment: { axis: 'epistemology', op: 'lte', value: -20 } },
                    effect: { alignmentDelta: { epistemology: -1, outlook: -1 } },
                },
                {
                    text: "Leave quietly.",
                    nextNodeId: undefined,
                },
                {
                    text: "(The keeper studies you with renewed interest—something has shifted in your essence.)",
                    nextNodeId: 'observer_transformation',
                    requires: { playerAlignmentCellChangedSince: true },
                    effect: { alignmentDelta: { scope: 2 } },
                },
            ],
        },
        patterns: {
            id: 'patterns',
            text: "\"The stones remember all who pass. Your spirit-trail weaves through probability and purpose—a seeker's path, but toward what?\"",
            choices: [
                {
                    text: "I seek understanding of the deeper truths.",
                    nextNodeId: 'truth_seeker',
                    effect: { 
                        alignmentDelta: { epistemology: 3, scope: 2 },
                        setFlag: 'shrine_keeper_recognizes_seeker' 
                    },
                },
                {
                    text: "I'm searching for practical knowledge.",
                    nextNodeId: 'practical_seeker',
                    effect: { alignmentDelta: { epistemology: -1, outlook: 1 } },
                },
                {
                    text: "That sounds like fortune-telling nonsense.",
                    nextNodeId: 'dismiss_mysticism',
                    effect: { alignmentDelta: { epistemology: -2, scope: -1 } },
                },
            ],
        },
        veil_thin: {
            id: 'veil_thin',
            text: "\"Yes! The boundary weakens where ancient powers once walked. Here, seeker, take this—a lens to see beyond the mere physical.\" The keeper offers a crystalline fragment that hums with inner light.",
            choices: [
                {
                    text: "Accept the crystal gratefully.",
                    nextNodeId: undefined,
                    effect: { 
                        setFlag: 'shrine_keeper_crystal_gift',
                        alignmentDelta: { epistemology: 2, scope: 1 },
                        moralDelta: 1 
                    },
                },
                {
                    text: "I cannot accept such a precious gift.",
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
            text: "The keeper's expression grows sad but understanding. \"The material world weighs heavy on some shoulders. When you're ready to see beyond stone and sinew, the shrine will remain.\"",
        },
        truth_seeker: {
            id: 'truth_seeker',
            text: "\"Ah, a kindred spirit! The ancients left wisdom carved in symbol and stone. Study the northern glyphs—they speak of cycles within cycles, of balance made manifest.\"",
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
            text: "\"Even practical paths may lead to transcendence, seeker. The ancient builders understood both stone and spirit—perhaps their techniques might serve you.\"",
        },
        dismiss_mysticism: {
            id: 'dismiss_mysticism',
            text: "\"Even skeptics serve the pattern, though they know it not. The stones care little for belief—they simply are.\"",
        },
        observer_transformation: {
            id: 'observer_transformation',
            text: "\"The constellation of your spirit has shifted since our last meeting. Change is the only constant—but this change carries purpose. The shrine blesses your new becoming.\"",
        },
    },
};

const shrineKeeper: NPC = {
    name: 'Shrine Keeper',
    description: 'A mystical guardian of ancient shrine stones, keeper of transcendent wisdom and otherworldly perception.',
    dialogueTree: shrineKeeperTree,
};

// ─── The Chronicler (Scholarly NPC with Chronicle integration) ───────────────

const chroniclerTree: DialogueTree = {
    id: 'chronicler',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "The Chronicler looks up from leather-bound tomes and scattered parchments. \"A fellow seeker of knowledge? These northern lands hold secrets that predate the coastal settlements. Care to contribute to the Chronicle?\"",
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
                    text: "(The scholar glances up, noting how your bearing has changed since your last encounter.)",
                    nextNodeId: 'scholar_observation',
                    requires: { playerAlignmentCellChangedSince: true },
                    effect: { alignmentDelta: { epistemology: 1 } },
                },
            ],
        },
        chronicling_purpose: {
            id: 'chronicling_purpose',
            text: "\"I document the forgotten histories—the pre-coastal civilizations, ancient migration patterns, the old alliances between folk and forest. Each traveler adds another thread to the tapestry.\"",
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
            text: "\"Excellent! Every observation matters. What you call 'strange' might be echoes of the old ways—patterns the ancients left as guideposts for future generations.\"",
            choices: [
                {
                    text: "Tell me more about these ancient patterns.",
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
            text: "\"I understand—the present demands attention. But remember: today's actions become tomorrow's history. Perhaps our paths will cross when urgency gives way to reflection.\"",
        },
        contribution_offer: {
            id: 'contribution_offer',
            text: "\"Document what you witness in the northern reaches—unusual flora, remnant structures, local folklore. Each detail helps complete the Chronicle's tapestry.\"",
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
            text: "\"A pragmatic view—yet even pragmatists benefit from understanding historical patterns. The past informs present choices, whether we acknowledge it or not.\"",
        },
        ancient_patterns: {
            id: 'ancient_patterns',
            text: "\"The ancients understood cycles—seasonal, generational, spiritual. They built with this knowledge, aligning settlements and sacred sites to greater rhythms. The northern forest bears their mark still.\"",
        },
        documented_travels: {
            id: 'documented_travels',
            text: "\"A scholar's approach! Your records could fill gaps in the Chronicle. The systematic documentation of experience serves both personal growth and collective wisdom.\"",
        },
        scholar_observation: {
            id: 'scholar_observation',
            text: "\"Fascinating—your intellectual posture has evolved since our last discussion. Experience truly is the greatest teacher. Your journey itself becomes worthy of chronicle.\"",
        },
    },
};

const chronicler: NPC = {
    name: 'The Chronicler',
    description: 'A dedicated scholar documenting forgotten histories and ancient wisdom of the northern lands.',
    dialogueTree: chroniclerTree,
};

// ─── The Wandering Philosopher (Traveling NPC with diverse philosophical positions) ───

const wanderingPhilosopherTree: DialogueTree = {
    id: 'wandering-philosopher',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "A weathered figure in simple robes sits contemplating the forest canopy. \"Ah, a fellow traveler! I find the northern woods excellent for philosophical contemplation. What brings you to walk these thoughtful paths?\"",
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
                    text: "(The philosopher's eyes light with recognition at your transformed bearing.)",
                    nextNodeId: 'philosophical_recognition',
                    requires: { playerAlignmentCellChangedSince: true },
                    effect: { alignmentDelta: { epistemology: 1 } },
                },
            ],
        },
        seeking_place: {
            id: 'seeking_place',
            text: "\"A noble quest! Tell me—do you believe our place is determined by fate, forged by will, or discovered through relationship with others?\"",
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
                    text: "I'm not sure—that's why I'm searching.",
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
            text: "\"Ah, but are any of us truly 'just passing through'? Every step changes both traveler and terrain. Your presence here ripples outward in ways you may never know.\"",
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
            text: "\"Yes! The forest teaches patience—each tree growing in its season, each creature following ancient rhythms. In stillness, we hear what urgency drowns out.\"",
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
            text: "\"I understand—action calls louder than contemplation for some souls. Yet even the most practical pursuits rest on philosophical foundations. Safe travels, friend.\"",
        },
        fate_perspective: {
            id: 'fate_perspective',
            text: "\"A transcendent view! Yet consider—if fate writes our story, do we bear responsibility for our choices? Perhaps fate provides the stage while we perform the play.\"",
        },
        will_perspective: {
            id: 'will_perspective',
            text: "\"The voice of the self-determined! Yet pure individualism can become isolation. Even the strongest will benefits from wisdom gathered, from hands offered in aid.\"",
        },
        community_perspective: {
            id: 'community_perspective',
            text: "\"Beautifully spoken! We become ourselves through relationship—yet beware losing the self in the collective. True community honors both unity and individual authenticity.\"",
        },
        uncertain_seeker: {
            id: 'uncertain_seeker',
            text: "\"Honest uncertainty opens more doors than false certainty closes. Your willingness to seek—to question—already marks you as a philosopher at heart.\"",
        },
        impact_realization: {
            id: 'impact_realization',
            text: "\"Each conversation plants seeds in both minds. Your questions change my answers; my words reshape your journey. We co-create meaning through encounter.\"",
        },
        simple_acceptance: {
            id: 'simple_acceptance',
            text: "\"Perhaps you're right—sometimes simplicity contains its own wisdom. Not every moment requires deep analysis to hold deep value.\"",
        },
        tree_wisdom: {
            id: 'tree_wisdom',
            text: "\"Trees teach patience, interconnection through root-networks, the wisdom of seasons—knowing when to grow, when to rest, when to let go. They model existence without anxiety.\"",
        },
        philosophical_recognition: {
            id: 'philosophical_recognition',
            text: "\"Remarkable—your philosophical stance has evolved since our last discourse. Growth of mind shows in posture and presence. You embody philosophy in motion!\"",
        },
    },
};

const wanderingPhilosopher: NPC = {
    name: 'The Wandering Philosopher',
    description: 'A contemplative traveler who explores diverse philosophical perspectives through Socratic dialogue.',
    dialogueTree: wanderingPhilosopherTree,
};

// ─── The Forest Ranger (Conservation vs exploitation themes) ───────────────────

const forestRangerTree: DialogueTree = {
    id: 'forest-ranger',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "The Forest Ranger emerges from behind an ancient oak, bow in hand and eyes alert. Their weathered face shows both the serenity of forest life and the weight of constant vigilance.",
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
            ],
        },
        talk_duties: {
            id: 'talk_duties',
            text: "\"I guard these ancient groves from those who would strip them bare for profit. There's a logging operation pushing north—they want the heartwood of the eldest trees, worth a fortune in the southern markets. I could stop them, but their families depend on the wages, and the village needs the trade income. How do we balance the forest's future against people's immediate needs? Sometimes I wonder if one person can make a difference against such forces.\"",
            choices: [
                {
                    text: "Trust that nature's wisdom will prevail—the forest will endure as it always has.",
                    nextNodeId: 'nature_wisdom_endures',
                    requires: { requiresAlignment: { axis: 'epistemology', op: 'gte', value: 15 } },
                    effect: { alignmentDelta: { epistemology: 2, scope: 2 } },
                },
                {
                    text: "I'll help you find alternative livelihoods for the loggers—sustainable forest trades.",
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
                    text: "Trees grow back—people need to eat today. Let them take what they need.",
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
            text: "\"These woods can be treacherous for the unwary. I know the safe paths—it would be my honor to guide a respectful traveler.\"",
        },
        nature_wisdom_endures: {
            id: 'nature_wisdom_endures',
            text: "\"You speak truth that goes deeper than immediate concerns. These trees have weathered ice ages and droughts. Perhaps my role is to trust in larger cycles while doing what I can in this moment.\"",
        },
        sustainable_alternatives: {
            id: 'sustainable_alternatives',
            text: "\"Yes! There are other ways—mushroom cultivation, guided tours for scholars, carefully managed timber harvests. With your support, we can show the loggers a path that feeds families without destroying the forest's heart.\"",
        },
        pragmatic_exploitation: {
            id: 'pragmatic_exploitation',
            text: "\"I... I cannot agree with that, but I understand your reasoning. Perhaps you're right that immediate human needs must outweigh distant environmental concerns. The forest will have to fend for itself.\"",
        },
    },
};

const forestRanger: NPC = {
    name: 'Forest Ranger',
    description: 'A dedicated guardian of the northern woods torn between conservation duties and human economic needs.',
    dialogueTree: forestRangerTree,
};

// ─── The Hermit Sage (Isolation vs community obligation) ───────────────────────

const hermitSageTree: DialogueTree = {
    id: 'hermit-sage',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "The Hermit Sage sits in meditation beside a small forest shrine, eyes closed in deep contemplation. They sense your approach and slowly open ancient, knowing eyes.",
            choices: [
                {
                    text: "*Talk — Ask why they chose solitude",
                    nextNodeId: 'talk_solitude_choice',
                },
                {
                    text: "I seek wisdom, master.",
                    nextNodeId: 'seek_wisdom',
                },
                {
                    text: "Withdraw quietly to respect their meditation.",
                    nextNodeId: undefined,
                },
            ],
        },
        talk_solitude_choice: {
            id: 'talk_solitude_choice',
            text: "\"I retreated here decades ago to pursue understanding beyond the noise of daily concerns. In solitude, I've found clarity about existence, suffering, and transcendence. But lately, I question whether wisdom earned in isolation serves anyone but myself. The villages below struggle with moral crises that my knowledge might help resolve. Is enlightenment selfish if it's not shared? Yet sharing it means abandoning the very isolation that made it possible. Can you see the paradox that troubles my final years?\"",
            choices: [
                {
                    text: "Wisdom flows from the divine source—trust that it reaches those who need it.",
                    nextNodeId: 'divine_wisdom_flows',
                    requires: { requiresAlignment: { axis: 'epistemology', op: 'gte', value: 20 } },
                    effect: { alignmentDelta: { epistemology: 3, scope: -1 } },
                },
                {
                    text: "I'll help you share your wisdom while preserving your contemplative practice.",
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
                    text: "Keep your secrets—the world profits more from your example than your advice.",
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
            text: "\"Wisdom cannot be given, only discovered. But I can share what the silence has taught me, if you have ears to hear.\"",
        },
        divine_wisdom_flows: {
            id: 'divine_wisdom_flows',
            text: "\"Perhaps you're right. True wisdom transcends the vessel that contains it. If my understanding matters, it will find its way to those who need it through means I cannot foresee.\"",
        },
        balanced_sharing: {
            id: 'balanced_sharing',
            text: "\"A thoughtful solution. Perhaps I can mentor a few seekers while preserving the solitude necessary for continued insight. Your offer of assistance in creating that balance touches my heart deeply.\"",
        },
        wisdom_through_example: {
            id: 'wisdom_through_example',
            text: "\"An interesting perspective. Perhaps the sight of someone choosing contemplation over accumulation teaches more than any words could. There is wisdom in your counsel to trust the power of witness.\"",
        },
    },
};

const hermitSage: NPC = {
    name: 'Hermit Sage',
    description: 'An enlightened recluse questioning whether wisdom gained in isolation should be shared with struggling communities.',
    dialogueTree: hermitSageTree,
};

// ─── The Lost Trader (Trust and deception in crisis) ───────────────────────────

const lostTraderTree: DialogueTree = {
    id: 'lost-trader',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "A trader sits slumped against a fallen log, their cart overturned and goods scattered. They look up with desperate, calculating eyes as you approach through the forest gloom.",
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
                    text: "Keep walking—their problems aren't your concern.",
                    nextNodeId: undefined,
                },
            ],
        },
        talk_what_happened: {
            id: 'talk_what_happened',
            text: "\"Bandits took everything—my horses, most of my cargo, even my coin purse. Left me here to die, they did. But here's the thing... I have one valuable item hidden that they missed. Worth enough to rebuild my trade, feed my family for a year. Problem is, I need someone to help me carry it to the next village, but... well, trusting a stranger with something that valuable after being robbed? Yet I can't move it alone, and staying here means slow death. Would you trust a desperate man in my position? And more importantly, should I trust you?\"",
            choices: [
                {
                    text: "Providence brought us together—trust is a sacred bond between strangers.",
                    nextNodeId: 'sacred_trust_bond',
                    requires: { requiresAlignment: { axis: 'epistemology', op: 'gte', value: 15 } },
                    effect: { alignmentDelta: { epistemology: 2, scope: 1 } },
                },
                {
                    text: "I'll help you transport it safely—we can build trust through honest action.",
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
                    text: "Show me this valuable item first—then we'll discuss terms that benefit us both.",
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
            text: "\"You'd help a stranger? That's... that's kind. Though I warn you, kindness in these woods can be dangerous for both giver and receiver.\"",
        },
        sacred_trust_bond: {
            id: 'sacred_trust_bond',
            text: "\"You speak of sacred bonds... yes, perhaps that's what separates civilization from wilderness. I choose to trust you, stranger, and hope you'll honor that faith.\"",
        },
        honest_mutual_aid: {
            id: 'honest_mutual_aid',
            text: "\"Honest action builds trust—I like that. You help me reach town, I'll share fair portion of the profits. We both benefit, we both take risks, we both prove ourselves worthy of trust.\"",
        },
        pragmatic_verification: {
            id: 'pragmatic_verification',
            text: "\"Clever—verify before you commit. Can't fault a person for being practical after what I've been through. Here's the item... now, shall we discuss our mutually beneficial arrangement?\"",
        },
    },
};

const lostTrader: NPC = {
    name: 'Lost Trader',
    description: 'A desperate merchant robbed by bandits, facing difficult choices about trust and deception in a crisis situation.',
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