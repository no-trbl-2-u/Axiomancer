import { NPC, DialogueTree } from '../../../NPCs/types';

// ─── Captain Blackwater (Pragmatic merchant with trade ethics) ──────────────

const captainBlackwaterTree: DialogueTree = {
    id: 'captain-blackwater',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "Captain Blackwater looks up from a stack of manifests, hands steady despite the wind. \"Another one at the docks. Coin for good goods, and we'll deal. Nothing for you here otherwise.\"",
            choices: [
                {
                    text: "What do you carry?",
                    nextNodeId: 'trading_goods',
                },
                {
                    text: "Tell me how you deal fair.",
                    nextNodeId: 'fair_trade',
                    requires: { requiresAlignment: { axis: 'scope', op: 'gte', value: 20 } },
                    effect: { alignmentDelta: { scope: 1, outlook: 1 } },
                },
                {
                    text: "What's the quickest coin to be made here?",
                    nextNodeId: 'quick_profit',
                    requires: { requiresAlignment: { axis: 'scope', op: 'lte', value: -10 } },
                    effect: { alignmentDelta: { scope: -1, outlook: -1 } },
                },
                {
                    text: "Just looking.",
                    nextNodeId: 'browsing',
                },
                {
                    text: "(The captain's eyes narrow. He sees how you deal differently now.)",
                    nextNodeId: 'merchant_recognition',
                    requires: { playerAlignmentCellChangedSince: true },
                    effect: { alignmentDelta: { outlook: 1 } },
                },
                // Phase 53e (S-02 "the read-back web") — reads `marrow_pressed`
                // (set at fv-2, column 1, strictly ahead of this node's column
                // 6). The brief's table also names `starting-quest` completed
                // as something Blackwater reads, but `marrow_pressed` can only
                // be set once that quest is already complete (the "thanks"
                // node it lives on requires `questCompleted: 'starting-quest'`
                // to even offer the choice) — so a second, independently
                // `questCompleted`-gated branch would surface ALONGSIDE this
                // one whenever `marrow_pressed` is set, which is two
                // acknowledgements for one event, not one. `DialogueChoice.requires`
                // has no "flag NOT set" predicate to exclude that overlap, so
                // this narrows to the single sharper read: the businessman
                // noticing another businessman's hard bargain. No `moralDelta`
                // — recognition, not judgment. Placed LAST.
                {
                    text: "(Blackwater's eyes flick to you a beat too long.)",
                    nextNodeId: 'marrow_pressed_recognition',
                    requires: { flag: 'marrow_pressed' },
                },
            ],
        },
        marrow_pressed_recognition: {
            id: 'marrow_pressed_recognition',
            // Phase 53e — terminal node for the read-back on `marrow_pressed`.
            text: "\"Word reached the wharf. You pressed the old dockmaster for the full sum, after the crab near took your legs.\" \"I note it. I do not say whether it was right.\"",
        },
        trading_goods: {
            id: 'trading_goods',
            text: "\"Northern timber. Coastal salt. Tools from the inland towns. I deal in what holds — nothing that breaks in a fortnight. A name outlasts quick silver.\"",
            choices: [
                {
                    text: "That is a rare way to deal.",
                    nextNodeId: 'admire_philosophy',
                    effect: {
                        alignmentDelta: { outlook: 1, scope: 1 },
                        moralDelta: 1
                    },
                },
                {
                    text: "Surely quick coin tempts any merchant.",
                    nextNodeId: 'temptation_question',
                    effect: { alignmentDelta: { outlook: -1 } },
                },
                {
                    text: "Show me your wares.",
                    nextNodeId: 'show_wares',
                },
            ],
        },
        fair_trade: {
            id: 'fair_trade',
            text: "\"Someone who understands, then. Fair dealing builds what lasts. I pay the artisans what they're owed, price honest, and treat the dockhands like men. Costs more up front. Pays more in trust.\"",
            choices: [
                {
                    text: "How do you hold to that, with every merchant undercutting you?",
                    nextNodeId: 'competitive_ethics',
                    effect: {
                        alignmentDelta: { scope: 2, epistemology: 1 },
                        setFlag: 'captain_respects_ethics'
                    },
                },
                {
                    text: "Would you stand behind a guild built on the same terms?",
                    nextNodeId: 'guild_proposal',
                    effect: {
                        alignmentDelta: { scope: 2 },
                        setFlag: 'guild_support_secured'
                    },
                },
            ],
        },
        quick_profit: {
            id: 'quick_profit',
            text: "\"Quick coin. Cut corners, sell cheap, work desperate men past bearing — aye, the silver comes fast. So does the ruin behind you. I've watched those merchants. None of them last.\"",
            choices: [
                {
                    text: "Sometimes survival demands harsh choices.",
                    nextNodeId: 'harsh_necessity',
                    effect: {
                        alignmentDelta: { outlook: -1, scope: -1 },
                        moralDelta: -1
                    },
                },
                {
                    text: "Perhaps you're right, in the long view.",
                    nextNodeId: 'long_term_wisdom',
                    effect: {
                        alignmentDelta: { outlook: 2, scope: 1 },
                        moralDelta: 2
                    },
                },
            ],
        },
        browsing: {
            id: 'browsing',
            text: "\"Fair enough. The docks teach their own lessons, to those who watch. A port is made or broken by the men who trade in it.\"",
        },
        admire_philosophy: {
            id: 'admire_philosophy',
            text: "\"Aye, learned it from my father and his father before him. 'Build reputation like a seawall,' he'd say. 'Storm by storm, stone by stone. When the tempest comes, you'll need every block placed true.'\"",
        },
        temptation_question: {
            id: 'temptation_question',
            text: "\"Of course they do. Every merchant faces it — quick silver, or trust that lasts. The sea taught me patience. A tide that seems distant still comes back. So does a debt owed.\"",
        },
        show_wares: {
            id: 'show_wares',
            text: "\"Now we're dealing. Fine northern pine. Sea salt from the southern reaches. These tools — see the make on them? Built to outlast the hand that forged them.\"",
            choices: [
                {
                    text: "Your goods speak for you.",
                    nextNodeId: undefined,
                    effect: {
                        alignmentDelta: { scope: 1 },
                        moralDelta: 1,
                        grantCurrency: 5
                    },
                },
            ],
        },
        competitive_ethics: {
            id: 'competitive_ethics',
            text: "\"Simple. I hold to quality, not the lowest price. A buyer pays for what he can trust. An artisan works for respect he's owed. Everyone gains when the footing is solid.\"",
        },
        guild_proposal: {
            id: 'guild_proposal',
            text: "\"A guild of honest merchants. It would need teeth — standards, enforcement, a price for breaking faith. But aye. I'd stand behind it.\"",
        },
        harsh_necessity: {
            id: 'harsh_necessity',
            text: "\"Harsh choices, aye. But working a man past bearing isn't survival — it's choosing which soul you keep. I'd rather be poor and whole than rich and ashamed.\"",
        },
        long_term_wisdom: {
            id: 'long_term_wisdom',
            text: "\"Good, to hear wisdom recognized. Short thinking sinks more ships than storms do. The merchant who looks past the next tide weathers any tempest.\"",
        },
        merchant_recognition: {
            id: 'merchant_recognition',
            text: "\"Your manner of dealing has shifted, since we last spoke. Experience changes what a man weighs — coin, or conscience. The wise merchant bends without breaking.\"",
        },
    },
};

const captainBlackwater: NPC = {
    name: 'Captain Blackwater',
    description: 'A merchant captain who built his name on fair dealing and the long view.',
    dialogueTree: captainBlackwaterTree,
};

// ─── Fisherman's Daughter (Young idealist with mentorship themes) ───────────

const fishermansDaughterTree: DialogueTree = {
    id: 'fishermans-daughter',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "A young woman mends nets near the harbor, her hands quick. She looks up. \"You're no one from the village. I know every face here. A traveler, then. Have you stories from beyond the coast?\"",
            choices: [
                {
                    text: "What would you hear?",
                    nextNodeId: 'story_interest',
                },
                {
                    text: "I've seen much of the world. Ask.",
                    nextNodeId: 'worldly_wisdom',
                    effect: { alignmentDelta: { scope: 1, epistemology: 1 } },
                },
                {
                    text: "You've too sharp an eye for net-mending.",
                    nextNodeId: 'bright_observation',
                    requires: { requiresAlignment: { axis: 'scope', op: 'gte', value: 10 } },
                    effect: {
                        alignmentDelta: { scope: 1, outlook: 1 },
                        moralDelta: 1
                    },
                },
                {
                    text: "Mind your nets, child.",
                    nextNodeId: 'dismissive_response',
                    requires: { requiresAlignment: { axis: 'outlook', op: 'lte', value: -15 } },
                    effect: {
                        alignmentDelta: { outlook: -1, scope: -1 },
                        moralDelta: -2
                    },
                },
                {
                    text: "(She studies you a moment longer than she should. Something in you has changed.)",
                    nextNodeId: 'growth_recognition',
                    requires: { playerAlignmentCellChangedSince: true },
                    effect: { alignmentDelta: { epistemology: 1 } },
                },
                // Phase 53e (S-02 "the read-back web") — the peer who is
                // further along the same reckoning. Two mutually exclusive
                // flag groups, each set strictly ahead of this node (column
                // 6): fv-14's three father flags (column 3) and fv-4's three
                // Stranger's Net flags (column 3). Within each group only one
                // flag is ever set in a playthrough, so each group reads as
                // ONE acknowledgement despite being three `DialogueChoice`
                // entries, per the spec's "one branch, three leaf texts"
                // rule. **No `moralDelta` on any of these six** — S-01's
                // father dilemma pointedly refuses to score itself, and an
                // NPC who scored it retroactively would overrule that
                // refusal (the one binding rule the brief singles out for
                // this NPC). She notices. She does not grade. All placed
                // LAST.
                {
                    text: "(She studies you, then guesses at something between you and your father.)",
                    nextNodeId: 'daughter_reads_told_truth',
                    requires: { flag: 'boy-told-father-truth' },
                },
                {
                    text: "(She studies you, then guesses at something between you and your father.)",
                    nextNodeId: 'daughter_reads_spared_worry',
                    requires: { flag: 'boy-spared-father-worry' },
                },
                {
                    text: "(She studies you, then guesses at something between you and your father.)",
                    nextNodeId: 'daughter_reads_deflected',
                    requires: { flag: 'boy-deflected-father' },
                },
                {
                    text: "(She glances at your hands, then past you toward the quay.)",
                    nextNodeId: 'daughter_reads_returned_net',
                    requires: { flag: 'boy-returned-the-net' },
                },
                {
                    text: "(She glances at your hands, then past you toward the quay.)",
                    nextNodeId: 'daughter_reads_skimmed_net',
                    requires: { flag: 'boy-skimmed-the-net' },
                },
                {
                    text: "(She glances at your hands, then past you toward the quay.)",
                    nextNodeId: 'daughter_reads_took_net',
                    requires: { flag: 'boy-took-the-net' },
                },
            ],
        },
        daughter_reads_told_truth: {
            id: 'daughter_reads_told_truth',
            // Phase 53e — terminal node for the read-back on
            // `boy-told-father-truth`.
            text: "\"You told him the whole sum, they say.\" \"I have never once managed that. Not when the truth costs him something to hear.\"",
        },
        daughter_reads_spared_worry: {
            id: 'daughter_reads_spared_worry',
            // Phase 53e — terminal node for the read-back on
            // `boy-spared-father-worry`. Voice-lock line from
            // `S-02-fishing-village-voices.md`, shipped verbatim.
            text: "\"My father asks what a thing will cost. I tell him less than it does.\" \"We are both good at it. That is the part I mind.\"",
        },
        daughter_reads_deflected: {
            id: 'daughter_reads_deflected',
            // Phase 53e — terminal node for the read-back on
            // `boy-deflected-father`.
            text: "\"You made it a joke instead of an answer, they say.\" \"Jokes are lighter to carry. I have carried a few myself, further than they were built to go.\"",
        },
        daughter_reads_returned_net: {
            id: 'daughter_reads_returned_net',
            // Phase 53e — terminal node for the read-back on
            // `boy-returned-the-net`.
            text: "\"You carried a stranger's net back to her, whole.\" \"Most would have called that wasted effort. I would not have.\"",
        },
        daughter_reads_skimmed_net: {
            id: 'daughter_reads_skimmed_net',
            // Phase 53e — terminal node for the read-back on
            // `boy-skimmed-the-net`.
            text: "\"You took a little from a net that was never yours.\" \"A little is still a taking. I have told myself that story too.\"",
        },
        daughter_reads_took_net: {
            id: 'daughter_reads_took_net',
            // Phase 53e — terminal node for the read-back on
            // `boy-took-the-net`.
            text: "\"You took the whole catch and left an empty net for whoever it belonged to.\" \"I am not asking why. I am only saying I noticed.\"",
        },
        story_interest: {
            id: 'story_interest',
            text: "\"Stories of far places. Other ways to live. Father says the world past this harbor is dangerous. I think it must be wondrous too. How do they live, in the great cities? In the mountain towns?\"",
            choices: [
                {
                    text: "The world holds both — wonder, and danger.",
                    nextNodeId: 'balanced_view',
                    effect: {
                        alignmentDelta: { epistemology: 1, outlook: 1 },
                        setFlag: 'daughter_appreciates_honesty'
                    },
                },
                {
                    text: "Your father is wise. The world is cruel enough.",
                    nextNodeId: 'protective_warning',
                    effect: { alignmentDelta: { outlook: -1, scope: -1 } },
                },
                {
                    text: "Dream past this harbor. The world waits for those who leave it.",
                    nextNodeId: 'encourage_dreams',
                    requires: { requiresAlignment: { axis: 'outlook', op: 'gte', value: 15 } },
                    effect: {
                        alignmentDelta: { outlook: 2, scope: 1 },
                        moralDelta: 2
                    },
                },
            ],
        },
        worldly_wisdom: {
            id: 'worldly_wisdom',
            text: "\"Then tell me. What is the one lesson the world taught you? Say it before I choose what life to live.\"",
            choices: [
                {
                    text: "Every soul carries wisdom worth the hearing.",
                    nextNodeId: 'wisdom_everywhere',
                    effect: {
                        alignmentDelta: { scope: 2, epistemology: 1 },
                        setFlag: 'mentored_fishermans_daughter_wisdom'
                    },
                },
                {
                    text: "Hold to what you are, whatever leans against you.",
                    nextNodeId: 'stay_true',
                    effect: {
                        alignmentDelta: { epistemology: 1, outlook: 1 },
                        moralDelta: 2
                    },
                },
                {
                    text: "Learn to bend. The rigid tree breaks in the storm.",
                    nextNodeId: 'adaptability_lesson',
                    effect: { alignmentDelta: { epistemology: -1, outlook: 1 } },
                },
                {
                    text: "Trust yourself. Test what others tell you.",
                    nextNodeId: 'critical_thinking',
                    effect: { alignmentDelta: { epistemology: 2 } },
                },
            ],
        },
        bright_observation: {
            id: 'bright_observation',
            text: "\"You notice things. Aye — I want to learn. People. How things work. The patterns in the tide and the weather. Father thinks I should be content with the nets. I feel called past them.\"",
            choices: [
                {
                    text: "What calls you past them?",
                    nextNodeId: 'calling_exploration',
                    effect: { alignmentDelta: { scope: 1, epistemology: 1 } },
                },
                {
                    text: "Knowledge is worth the reaching.",
                    nextNodeId: 'knowledge_validation',
                    effect: {
                        alignmentDelta: { epistemology: 2, scope: 1 },
                        moralDelta: 2,
                        setFlag: 'encouraged_daughters_learning'
                    },
                },
                {
                    text: "Study, then, and still keep your father's nets.",
                    nextNodeId: 'balanced_path',
                    effect: { alignmentDelta: { scope: 1 } },
                },
            ],
        },
        dismissive_response: {
            id: 'dismissive_response',
            text: "Her expression dims. She returns to the nets. \"Of course. Forgive the bother.\"",
        },
        balanced_view: {
            id: 'balanced_view',
            text: "\"Honest. I'll take that over a pretty lie. If I'm to choose my own life, I ought to know what I'm choosing between.\"",
        },
        protective_warning: {
            id: 'protective_warning',
            text: "\"I know he means well. But protection becomes a cage, given time. How does a body tell wisdom from fear?\"",
        },
        encourage_dreams: {
            id: 'encourage_dreams',
            text: "\"You believe that. Sometimes I look at the horizon and think I could sail past the map's edge. Not for recklessness. For purpose. Maybe courage is not the absence of fear. Maybe it is growing past it anyway.\"",
        },
        wisdom_everywhere: {
            id: 'wisdom_everywhere',
            text: "\"Even the youngest villager. Even the oldest salt. Then no conversation is wasted, and no one is without worth. I'll keep that.\"",
        },
        stay_true: {
            id: 'stay_true',
            text: "\"Aye. Father raised me on strong values. I want to test them. Not to cast them off. To make them mine by choice, not by inheritance.\"",
        },
        adaptability_lesson: {
            id: 'adaptability_lesson',
            text: "\"Like the fisherman who reads the weather and turns the sail. I understand. Strength in bending, not in standing stubborn.\"",
        },
        critical_thinking: {
            id: 'critical_thinking',
            text: "\"Trust, but test. I like that. Staying open without being a fool. Questioning without turning bitter.\"",
        },
        calling_exploration: {
            id: 'calling_exploration',
            text: "\"Maybe a scholar. Maybe a trader who ties distant places together. Something that lets me learn the world while giving something back to it.\"",
        },
        knowledge_validation: {
            id: 'knowledge_validation',
            text: "\"My thanks, for saying that. Sometimes I wonder if wanting to learn makes me selfish. You're right, though. Knowledge can serve more than my own curiosity.\"",
        },
        balanced_path: {
            id: 'balanced_path',
            text: "\"A path that honors both duty and my own growth. That would be the whole of it — if I can find the way.\"",
        },
        growth_recognition: {
            id: 'growth_recognition',
            text: "\"Something's different in you, since we last spoke. How you carry yourself. How you listen. Experience does change a person. I hope I grow with such purpose, when my time comes.\"",
        },
    },
};

const fishermansDaughter: NPC = {
    name: "Fisherman's Daughter",
    description: "A sharp-eyed young woman caught between her father's nets and a life she hasn't named yet.",
    dialogueTree: fishermansDaughterTree,
};

// ─── The Village Healer (Medical ethics dilemmas) ──────────────────────────

const villageHealerTree: DialogueTree = {
    id: 'village-healer',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "The Village Healer tends a patient in the narrow clinic, hands steady despite the fatigue in them. They look up, weary-eyed, as you approach.",
            choices: [
                {
                    text: "*Talk — Ask what troubles the healer",
                    nextNodeId: 'talk_situation',
                },
                {
                    text: "I need healing.",
                    nextNodeId: 'healing_services',
                },
                {
                    text: "Leave quietly. Don't disturb the work.",
                    nextNodeId: undefined,
                },
            ],
        },
        talk_situation: {
            id: 'talk_situation',
            text: "\"My thanks, for asking. I have not rested. Fever spreads through the poor quarter. The herbs I need sit hoarded in the wealthy district. I could save more, with the right supplies. Getting them would mean choices I do not like. I ask myself daily how far a healer should go.\"",
            choices: [
                {
                    text: "Trust to providence. It provides what's needed.",
                    nextNodeId: 'divine_providence',
                    requires: { requiresAlignment: { axis: 'epistemology', op: 'gte', value: 15 } },
                    effect: { alignmentDelta: { epistemology: 2, scope: 1 } },
                },
                {
                    text: "I'll help you get those herbs. Whatever it takes.",
                    nextNodeId: 'offer_help',
                    requires: { requiresAlignment: { axis: 'scope', op: 'gte', value: 10 } },
                    effect: {
                        alignmentDelta: { scope: 2, outlook: 1 },
                        moralDelta: 2,
                        grantCurrency: -15
                    },
                },
                {
                    text: "The wealthy won't miss a few herbs. Take what you need.",
                    nextNodeId: 'take_what_needed',
                    requires: { requiresAlignment: { axis: 'outlook', op: 'lte', value: -5 } },
                    effect: {
                        alignmentDelta: { outlook: -2, scope: 1 },
                        moralDelta: -1,
                        grantCurrency: 10,
                        setFlag: 'aided_healer_questionable_means'
                    },
                },
            ],
        },
        healing_services: {
            id: 'healing_services',
            text: "\"Healing is my calling. Though I warn you — my supplies run thin, for the reasons I gave.\"",
        },
        divine_providence: {
            id: 'divine_providence',
            text: "\"You speak of faith. Perhaps I've tried too hard to hold the outcome in my own two hands. Sometimes the greatest healing comes from trusting what's greater than us.\"",
        },
        offer_help: {
            id: 'offer_help',
            text: "\"Your generosity moves me. With your help, I can get the herbs the honest way. It costs more. It leaves the conscience clean.\"",
        },
        take_what_needed: {
            id: 'take_what_needed',
            text: "\"I cannot ask you to steal. But I understand the reasoning. Lives hang in it. If you'll get those herbs by whatever means, I'll not ask questions.\"",
        },
    },
};

const villageHealer: NPC = {
    name: 'Village Healer',
    description: "A healer worn thin by a fever she can't outrun and herbs she can't get honestly enough.",
    dialogueTree: villageHealerTree,
};

// ─── The Dockworker's Union Leader (labor and survival) ────────────────────

const unionLeaderTree: DialogueTree = {
    id: 'union-leader',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "The Union Leader stands among the dockhands, voice carrying the weight of years at hard labor. They turn to you, wary and respectful in equal measure.",
            choices: [
                {
                    text: "*Talk — Ask what troubles the dockhands",
                    nextNodeId: 'talk_workers_situation',
                },
                {
                    text: "Looking for work on the docks.",
                    nextNodeId: 'seeking_work',
                },
                {
                    text: "Walk on. This isn't your fight.",
                    nextNodeId: undefined,
                },
            ],
        },
        talk_workers_situation: {
            id: 'talk_workers_situation',
            text: "\"Appreciate you asking. The owners cut wages again, third time this year, while their coin piles higher. My people can't feed their own. We're calling a strike. Some are too frightened to join — they'd rather take scraps than risk losing all of it. I don't blame the fear. But a man's own survival sits against what's owed to all of them. What would you do, in their place?\"",
            choices: [
                {
                    text: "The divine order teaches us to accept our lot, and trust to a higher justice.",
                    nextNodeId: 'accept_divine_order',
                    requires: { requiresAlignment: { axis: 'epistemology', op: 'gte', value: 20 } },
                    effect: { alignmentDelta: { epistemology: 1, scope: -2 } },
                },
                {
                    text: "I'll stand with you. An injustice anywhere is a threat everywhere.",
                    nextNodeId: 'solidarity_support',
                    requires: { requiresAlignment: { axis: 'scope', op: 'gte', value: 15 } },
                    effect: {
                        alignmentDelta: { scope: 3, outlook: 1 },
                        moralDelta: 3,
                        grantCurrency: -20,
                        setFlag: 'union_supporter'
                    },
                },
                {
                    text: "A wise man looks after himself. I'll pay the frightened ones to cross your line.",
                    nextNodeId: 'undermine_strike',
                    requires: { requiresAlignment: { axis: 'scope', op: 'lte', value: -10 } },
                    effect: {
                        alignmentDelta: { scope: -3, outlook: -1 },
                        moralDelta: -3,
                        grantCurrency: 25,
                        setFlag: 'strike_breaker'
                    },
                },
            ],
        },
        seeking_work: {
            id: 'seeking_work',
            text: "\"Honest work's always welcome. Though I warn you — the terms aren't fair right now. That's what we're fighting to change.\"",
        },
        accept_divine_order: {
            id: 'accept_divine_order',
            text: "\"I respect your faith. Divine justice moves slow, though, with children going hungry. Perhaps there's a patience in it I haven't grasped.\"",
        },
        solidarity_support: {
            id: 'solidarity_support',
            text: "\"That's the spirit of it. Your support means more than coin — it tells the workers they aren't alone. Together, we outlast any owner's greed.\"",
        },
        undermine_strike: {
            id: 'undermine_strike',
            text: "The leader's eyes go hard. \"So that's how it is. Thirty pieces of silver, to break honest men. You'll find your strikebreakers. You'll find the weight of it too, later, in your own conscience.\"",
        },
    },
};

const unionLeader: NPC = {
    name: "Dockworker's Union Leader",
    description: "A dockhand organizer weighing what's owed to the many against what each man needs to survive.",
    dialogueTree: unionLeaderTree,
};

// ─── The Merchant's Widow (Grief and justice themes) ───────────────────────────

const merchantWidowTree: DialogueTree = {
    id: 'merchant-widow',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "The Merchant's Widow sits alone at a tavern table, an untouched cup before her. Black mourning cloth, and a fire in her eyes that hasn't gone out yet.",
            choices: [
                {
                    text: "*Talk — Ask what troubles her",
                    nextNodeId: 'talk_troubles',
                },
                {
                    text: "My condolences for your loss.",
                    nextNodeId: 'condolences',
                },
                {
                    text: "Leave her to her solitude.",
                    nextNodeId: undefined,
                },
            ],
        },
        talk_troubles: {
            id: 'talk_troubles',
            text: "\"My husband was murdered three weeks past. Stabbed in an alley for his purse. I know who did it. A desperate man, with starving children of his own. The constables will not act. He has fled the village already. I have the coin to hire bounty hunters. Part of me wonders if justice wants tempering with mercy. His children starve, if he is caught. My husband's blood asks for justice regardless. Which is the right path, when the two make war?\"",
            choices: [
                {
                    text: "Forgiveness is divine. Let heaven judge, and heal your own heart.",
                    nextNodeId: 'divine_forgiveness',
                    requires: { requiresAlignment: { axis: 'epistemology', op: 'gte', value: 20 } },
                    effect: { alignmentDelta: { epistemology: 2, outlook: 2 } },
                },
                {
                    text: "I'll help you find a road that serves both justice and mercy.",
                    nextNodeId: 'justice_with_mercy',
                    requires: { requiresAlignment: { axis: 'scope', op: 'gte', value: 10 } },
                    effect: {
                        alignmentDelta: { scope: 2, outlook: 1 },
                        moralDelta: 3,
                        grantCurrency: -30,
                        setFlag: 'widow_mediator'
                    },
                },
                {
                    text: "Justice demands payment. I'll help you hire the best hunters there are.",
                    nextNodeId: 'pursue_vengeance',
                    requires: { requiresAlignment: { axis: 'outlook', op: 'lte', value: 0 } },
                    effect: {
                        alignmentDelta: { outlook: -2, scope: -1 },
                        moralDelta: -1,
                        grantCurrency: 40,
                        setFlag: 'widow_vengeance_supporter'
                    },
                },
            ],
        },
        condolences: {
            id: 'condolences',
            text: "\"My thanks, for the kindness. These days, plain decency is rarer than gold.\"",
        },
        divine_forgiveness: {
            id: 'divine_forgiveness',
            text: "\"You speak a wisdom my heart struggles to hold. Perhaps the truest victory over evil is refusing to let it remake you. My husband was a kind man. He'd have wanted mercy.\"",
        },
        justice_with_mercy: {
            id: 'justice_with_mercy',
            text: "\"Perhaps there is a way to serve justice without breeding more suffering. With your help we might find him. See his family cared for. Make him answer for what he did.\"",
        },
        pursue_vengeance: {
            id: 'pursue_vengeance',
            text: "\"You understand what justice means. My husband is owed that much. The hunters will find him. And his children can learn what comes of spilling innocent blood.\"",
        },
    },
};

const merchantWidow: NPC = {
    name: "Merchant's Widow",
    description: 'A widow weighing her husband\'s murder against the desperate man who killed him.',
    dialogueTree: merchantWidowTree,
};

export {
    captainBlackwater,
    fishermansDaughter,
    villageHealer,
    unionLeader,
    merchantWidow,
};