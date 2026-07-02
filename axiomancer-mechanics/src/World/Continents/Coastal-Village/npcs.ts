import { NPC, DialogueTree } from '../../../NPCs/types';

// ─── Captain Blackwater (Pragmatic merchant with trade ethics) ──────────────

const captainBlackwaterTree: DialogueTree = {
    id: 'captain-blackwater',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "Captain Blackwater looks up from tallying cargo manifests, weather-beaten hands steady despite the coastal wind. \"Another traveler at the docks? If you've coin for quality goods, we'll do business. If you're here to waste time, move along.\"",
            choices: [
                {
                    text: "What goods are you trading?",
                    nextNodeId: 'trading_goods',
                },
                {
                    text: "I'm interested in fair trade practices.",
                    nextNodeId: 'fair_trade',
                    requires: { requiresAlignment: { axis: 'scope', op: 'gte', value: 20 } },
                    effect: { alignmentDelta: { scope: 1, outlook: 1 } },
                },
                {
                    text: "What's the quickest profit to be made here?",
                    nextNodeId: 'quick_profit',
                    requires: { requiresAlignment: { axis: 'scope', op: 'lte', value: -10 } },
                    effect: { alignmentDelta: { scope: -1, outlook: -1 } },
                },
                {
                    text: "Just looking around the docks.",
                    nextNodeId: 'browsing',
                },
                {
                    text: "(The captain's eyes narrow with recognition—your approach to commerce has shifted.)",
                    nextNodeId: 'merchant_recognition',
                    requires: { playerAlignmentCellChangedSince: true },
                    effect: { alignmentDelta: { outlook: 1 } },
                },
            ],
        },
        trading_goods: {
            id: 'trading_goods',
            text: "\"Northern timber, coastal salt, artisan tools from the inland settlements. I deal in quality—no shoddy goods that fall apart after a fortnight. Reputation matters more than quick silver.\"",
            choices: [
                {
                    text: "That's an admirable business philosophy.",
                    nextNodeId: 'admire_philosophy',
                    effect: { 
                        alignmentDelta: { outlook: 1, scope: 1 },
                        moralDelta: 1 
                    },
                },
                {
                    text: "But surely quick profits tempt any merchant?",
                    nextNodeId: 'temptation_question',
                    effect: { alignmentDelta: { outlook: -1 } },
                },
                {
                    text: "Show me what you have for sale.",
                    nextNodeId: 'show_wares',
                },
            ],
        },
        fair_trade: {
            id: 'fair_trade',
            text: "\"Finally, someone who understands! Fair dealing builds lasting partnerships. I pay artisans properly, price goods honestly, treat dock workers with respect. Costs more upfront, pays more in trust.\"",
            choices: [
                {
                    text: "How do you maintain that in a competitive market?",
                    nextNodeId: 'competitive_ethics',
                    effect: { 
                        alignmentDelta: { scope: 2, epistemology: 1 },
                        setFlag: 'captain_respects_ethics'
                    },
                },
                {
                    text: "Would you support a traders' guild based on these principles?",
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
            text: "\"Quick profit? Ha! Cut corners, sell cheap goods, exploit desperate workers—sure, you'll make silver fast. You'll also burn every bridge you cross. I've seen those merchants. They don't last.\"",
            choices: [
                {
                    text: "Sometimes survival requires harsh choices.",
                    nextNodeId: 'harsh_necessity',
                    effect: { 
                        alignmentDelta: { outlook: -1, scope: -1 },
                        moralDelta: -1 
                    },
                },
                {
                    text: "Perhaps you're right about the long-term view.",
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
            text: "\"Fair enough. The docks teach their own lessons to those who watch and listen. Maritime commerce shapes communities—for better or worse, depending on the merchants.\"",
        },
        admire_philosophy: {
            id: 'admire_philosophy',
            text: "\"Aye, learned it from my father and his father before him. 'Build reputation like a seawall,' he'd say. 'Storm by storm, stone by stone. When the tempest comes, you'll need every block placed true.'\"",
        },
        temptation_question: {
            id: 'temptation_question',
            text: "\"Of course they do! Every merchant faces the choice—quick silver or lasting trust. The sea's taught me patience. Tides that seem distant always return. So do consequences.\"",
        },
        show_wares: {
            id: 'show_wares',
            text: "\"Now we're talking business! I've fine northern pine, sea salt from the southern reaches, and these tools—see the craftsmanship? Made to outlast their maker.\"",
            choices: [
                {
                    text: "Your goods reflect your values.",
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
            text: "\"Simple—I compete on quality and service, not price-cutting. Customers pay for reliability. Artisans work for respect. Everyone profits when the foundation's solid.\"",
        },
        guild_proposal: {
            id: 'guild_proposal',
            text: "\"A guild of ethical merchants? Interesting. It would need teeth—standards, enforcement, consequences for those who break faith. But yes, I'd support such an effort.\"",
        },
        harsh_necessity: {
            id: 'harsh_necessity',
            text: "\"Harsh choices, aye—but exploiting others isn't survival, it's choosing which soul you want to keep. I'd rather be poor with honor than rich with shame.\"",
        },
        long_term_wisdom: {
            id: 'long_term_wisdom',
            text: "\"Good to hear wisdom recognized! Short-term thinking sinks more ships than storms. The merchant who thinks beyond the next tide will weather any tempest.\"",
        },
        merchant_recognition: {
            id: 'merchant_recognition',
            text: "\"Interesting—your manner of doing business has shifted since we last talked. Experience changes how we value profit versus principles, doesn't it? The wise merchant adapts without abandoning core values.\"",
        },
    },
};

const captainBlackwater: NPC = {
    name: 'Captain Blackwater',
    description: 'A pragmatic merchant captain who built his reputation on ethical trading practices and long-term thinking.',
    dialogueTree: captainBlackwaterTree,
};

// ─── Fisherman's Daughter (Young idealist with mentorship themes) ───────────

const fishermansDaughterTree: DialogueTree = {
    id: 'fishermans-daughter',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "A young woman tends fishing nets near the harbor, her movements quick and determined. She looks up with bright, curious eyes. \"You're not from the village—I know everyone here. Are you a traveler? Do you have stories from beyond the coast?\"",
            choices: [
                {
                    text: "What stories would you like to hear?",
                    nextNodeId: 'story_interest',
                },
                {
                    text: "I've seen much of the world. What do you wish to know?",
                    nextNodeId: 'worldly_wisdom',
                    effect: { alignmentDelta: { scope: 1, epistemology: 1 } },
                },
                {
                    text: "You seem too bright for just mending nets.",
                    nextNodeId: 'bright_observation',
                    requires: { requiresAlignment: { axis: 'scope', op: 'gte', value: 10 } },
                    effect: { 
                        alignmentDelta: { scope: 1, outlook: 1 },
                        moralDelta: 1 
                    },
                },
                {
                    text: "Focus on your work, child.",
                    nextNodeId: 'dismissive_response',
                    requires: { requiresAlignment: { axis: 'outlook', op: 'lte', value: -15 } },
                    effect: { 
                        alignmentDelta: { outlook: -1, scope: -1 },
                        moralDelta: -2 
                    },
                },
                {
                    text: "(She studies you with new recognition, sensing the changes in your character.)",
                    nextNodeId: 'growth_recognition',
                    requires: { playerAlignmentCellChangedSince: true },
                    effect: { alignmentDelta: { epistemology: 1 } },
                },
            ],
        },
        story_interest: {
            id: 'story_interest',
            text: "\"Stories of distant places, different ways of living! Father says the world beyond our harbor is dangerous, but I think it must be wondrous too. How do people live in the great cities? The mountain villages?\"",
            choices: [
                {
                    text: "The world is full of both wonder and danger.",
                    nextNodeId: 'balanced_view',
                    effect: { 
                        alignmentDelta: { epistemology: 1, outlook: 1 },
                        setFlag: 'daughter_appreciates_honesty'
                    },
                },
                {
                    text: "Your father is wise—the world can be cruel.",
                    nextNodeId: 'protective_warning',
                    effect: { alignmentDelta: { outlook: -1, scope: -1 } },
                },
                {
                    text: "Dream big! The world awaits those brave enough to explore.",
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
            text: "\"Really? Oh, tell me—what's the most important lesson the world taught you? Something I should know before... well, before I decide what kind of life I want to live.\"",
            choices: [
                {
                    text: "Every person has wisdom worth learning.",
                    nextNodeId: 'wisdom_everywhere',
                    effect: { 
                        alignmentDelta: { scope: 2, epistemology: 1 },
                        setFlag: 'mentored_fishermans_daughter_wisdom'
                    },
                },
                {
                    text: "Stay true to your values, no matter the pressure.",
                    nextNodeId: 'stay_true',
                    effect: { 
                        alignmentDelta: { epistemology: 1, outlook: 1 },
                        moralDelta: 2 
                    },
                },
                {
                    text: "Learn to adapt—the rigid tree breaks in the storm.",
                    nextNodeId: 'adaptability_lesson',
                    effect: { alignmentDelta: { epistemology: -1, outlook: 1 } },
                },
                {
                    text: "Trust yourself, but verify what others tell you.",
                    nextNodeId: 'critical_thinking',
                    effect: { alignmentDelta: { epistemology: 2 } },
                },
            ],
        },
        bright_observation: {
            id: 'bright_observation',
            text: "\"You notice things! Yes, I love learning—about people, about how things work, about the patterns in tides and weather. Father thinks I should be content with fishing, but I feel called to... more.\"",
            choices: [
                {
                    text: "What kind of 'more' calls to you?",
                    nextNodeId: 'calling_exploration',
                    effect: { alignmentDelta: { scope: 1, epistemology: 1 } },
                },
                {
                    text: "Knowledge and growth are worthy pursuits.",
                    nextNodeId: 'knowledge_validation',
                    effect: { 
                        alignmentDelta: { epistemology: 2, scope: 1 },
                        moralDelta: 2,
                        setFlag: 'encouraged_daughters_learning'
                    },
                },
                {
                    text: "Perhaps you could study while still helping your father.",
                    nextNodeId: 'balanced_path',
                    effect: { alignmentDelta: { scope: 1 } },
                },
            ],
        },
        dismissive_response: {
            id: 'dismissive_response',
            text: "Her bright expression dims, and she returns to the nets with quiet resignation. \"Of course. Sorry to bother you.\"",
        },
        balanced_view: {
            id: 'balanced_view',
            text: "\"That's honest—I appreciate that more than pretty lies. If I'm going to make choices about my future, I need to understand what I'm choosing between, don't I?\"",
        },
        protective_warning: {
            id: 'protective_warning',
            text: "\"I know he means well, but sometimes protection becomes a cage. How do you know if you're being wise or just afraid?\"",
        },
        encourage_dreams: {
            id: 'encourage_dreams',
            text: "\"You really believe that? Sometimes I look at the horizon and feel like I could sail right off the edge of the map—not recklessly, but with purpose. Maybe courage isn't the absence of fear but the choice to grow despite it.\"",
        },
        wisdom_everywhere: {
            id: 'wisdom_everywhere',
            text: "\"Even from the youngest villager or the oldest salt? That's beautiful—it means no conversation is wasted, no person is without value. I'll remember that.\"",
        },
        stay_true: {
            id: 'stay_true',
            text: "\"Yes! Father raised me with strong values, but I want to test them—not to abandon them, but to make them truly mine through choice rather than inheritance.\"",
        },
        adaptability_lesson: {
            id: 'adaptability_lesson',
            text: "\"Like the fisherman who reads the weather and adjusts the sail? I understand—strength through flexibility, not stubborn resistance.\"",
        },
        critical_thinking: {
            id: 'critical_thinking',
            text: "\"Trust but verify—I like that. It means staying open without being naive. Learning to question without becoming cynical.\"",
        },
        calling_exploration: {
            id: 'calling_exploration',
            text: "\"Maybe becoming a scholar, or a trader who builds connections between distant communities. Something that lets me learn about the world while contributing to it.\"",
        },
        knowledge_validation: {
            id: 'knowledge_validation',
            text: "\"Thank you for saying that! Sometimes I wonder if wanting to learn makes me selfish—but you're right. Knowledge can serve others, not just satisfy curiosity.\"",
        },
        balanced_path: {
            id: 'balanced_path',
            text: "\"A path that honors both family duty and personal growth? That would be ideal—if I can find a way to make it work.\"",
        },
        growth_recognition: {
            id: 'growth_recognition',
            text: "\"Something's different about you since we last talked—the way you carry yourself, how you listen. Experience really does change people, doesn't it? I hope I'll grow with such purpose.\"",
        },
    },
};

const fishermansDaughter: NPC = {
    name: "Fisherman's Daughter",
    description: 'A bright young woman torn between family tradition and personal aspirations, seeking guidance on forging her own path.',
    dialogueTree: fishermansDaughterTree,
};

// ─── The Village Healer (Medical ethics dilemmas) ──────────────────────────

const villageHealerTree: DialogueTree = {
    id: 'village-healer',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "The Village Healer tends to a patient in their modest clinic, hands steady despite obvious fatigue. They look up with weary but kind eyes as you approach.",
            choices: [
                {
                    text: "*Talk — Learn about the healer's situation",
                    nextNodeId: 'talk_situation',
                },
                {
                    text: "I need healing services.",
                    nextNodeId: 'healing_services',
                },
                {
                    text: "Leave quietly to avoid disturbing their work.",
                    nextNodeId: undefined,
                },
            ],
        },
        talk_situation: {
            id: 'talk_situation',
            text: "\"Thank you for asking. I've been working without rest—there's a fever spreading through the poor quarter, but the wealthy district hoards the rare herbs I need. I could save more lives with proper supplies, but acquiring them would mean... difficult choices. I face this dilemma daily: how far should a healer go to obtain what their patients need?\"",
            choices: [
                {
                    text: "Trust in divine providence—God will provide what's needed.",
                    nextNodeId: 'divine_providence',
                    requires: { requiresAlignment: { axis: 'epistemology', op: 'gte', value: 15 } },
                    effect: { alignmentDelta: { epistemology: 2, scope: 1 } },
                },
                {
                    text: "I'll help you acquire those herbs, whatever it takes.",
                    nextNodeId: 'offer_help',
                    requires: { requiresAlignment: { axis: 'scope', op: 'gte', value: 10 } },
                    effect: { 
                        alignmentDelta: { scope: 2, outlook: 1 },
                        moralDelta: 2,
                        grantCurrency: -15 
                    },
                },
                {
                    text: "Those wealthy folk won't miss a few herbs—take what you need.",
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
            text: "\"Of course—healing is my calling. Though I must warn you, my supplies are limited due to the shortage I mentioned.\"",
        },
        divine_providence: {
            id: 'divine_providence',
            text: "\"You speak of faith... yes, perhaps I've been trying too hard to control outcomes. Sometimes the greatest healing comes from trusting in forces greater than ourselves.\"",
        },
        offer_help: {
            id: 'offer_help',
            text: "\"Your generosity moves me deeply. With your support, I can acquire the herbs through proper channels—it will cost more, but we'll save lives with clean consciences.\"",
        },
        take_what_needed: {
            id: 'take_what_needed',
            text: "\"I... I cannot ask you to steal, but I understand the logic. Lives hang in the balance. If you're willing to acquire those herbs by any means necessary, I won't ask questions.\"",
        },
    },
};

const villageHealer: NPC = {
    name: 'Village Healer',
    description: 'A dedicated healer facing ethical dilemmas about how far to go to obtain medical supplies for the needy.',
    dialogueTree: villageHealerTree,
};

// ─── The Dockworker's Union Leader (Labor rights and collective action) ────────

const unionLeaderTree: DialogueTree = {
    id: 'union-leader',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "The Union Leader stands among a group of dock workers, their voice carrying authority earned through years of hard labor. They turn to address you with a mixture of wariness and respect.",
            choices: [
                {
                    text: "*Talk — Ask about the workers' situation",
                    nextNodeId: 'talk_workers_situation',
                },
                {
                    text: "Looking for work at the docks.",
                    nextNodeId: 'seeking_work',
                },
                {
                    text: "Continue on without getting involved.",
                    nextNodeId: undefined,
                },
            ],
        },
        talk_workers_situation: {
            id: 'talk_workers_situation',
            text: "\"Appreciate you asking, friend. The dock owners are cutting wages again while their profits soar—third time this year. My people are struggling to feed their families. We're organizing a strike, but some workers are too scared to join. They'd rather accept scraps than risk losing everything. I understand their fear, but sometimes individual survival conflicts with collective justice. What would you do in their place?\"",
            choices: [
                {
                    text: "The divine order teaches us to accept our lot and trust in higher justice.",
                    nextNodeId: 'accept_divine_order',
                    requires: { requiresAlignment: { axis: 'epistemology', op: 'gte', value: 20 } },
                    effect: { alignmentDelta: { epistemology: 1, scope: -2 } },
                },
                {
                    text: "I'll stand with you—injustice anywhere threatens justice everywhere.",
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
                    text: "Smart workers look out for themselves—I'll pay the scared ones to cross your picket.",
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
            text: "\"Honest work's always welcome, though I'll warn you—conditions aren't fair right now. That's what we're fighting to change.\"",
        },
        accept_divine_order: {
            id: 'accept_divine_order',
            text: "\"I respect your faith, but divine justice seems mighty slow when children are going hungry. Still, perhaps there's wisdom in patience I haven't grasped.\"",
        },
        solidarity_support: {
            id: 'solidarity_support',
            text: "\"Now that's the spirit! Your support means more than coin—it shows the workers they're not alone in this fight. Together we're stronger than any dock owner's greed.\"",
        },
        undermine_strike: {
            id: 'undermine_strike',
            text: "The leader's eyes flash with anger and disappointment. \"So that's how it is. Thirty pieces of silver to betray honest workers. You'll find your strikebreakers, but you'll also find the weight of that choice in your conscience.\"",
        },
    },
};

const unionLeader: NPC = {
    name: "Dockworker's Union Leader",
    description: 'A labor organizer fighting for workers\' rights while navigating the tension between collective action and individual survival.',
    dialogueTree: unionLeaderTree,
};

// ─── The Merchant's Widow (Grief and justice themes) ───────────────────────────

const merchantWidowTree: DialogueTree = {
    id: 'merchant-widow',
    rootId: 'greet',
    nodes: {
        greet: {
            id: 'greet',
            text: "The Merchant's Widow sits alone at a tavern table, staring into an untouched cup of ale. Her black mourning dress contrasts sharply with the defiant fire still burning in her eyes.",
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
                    text: "Respectfully leave her to her solitude.",
                    nextNodeId: undefined,
                },
            ],
        },
        talk_troubles: {
            id: 'talk_troubles',
            text: "\"My husband was murdered three weeks ago—stabbed in an alley for his purse. I know who did it, a desperate man with starving children. The constables won't act because he's already fled the village. I have the means to hire bounty hunters, but... part of me wonders if justice should temper with mercy. His children will starve if he's caught, yet my husband's blood cries out for justice. What is the right path when justice and mercy seem to war with each other?\"",
            choices: [
                {
                    text: "Forgiveness is divine—let heaven judge while you heal your heart.",
                    nextNodeId: 'divine_forgiveness',
                    requires: { requiresAlignment: { axis: 'epistemology', op: 'gte', value: 20 } },
                    effect: { alignmentDelta: { epistemology: 2, outlook: 2 } },
                },
                {
                    text: "I'll help you find a path that serves both justice and mercy.",
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
                    text: "Justice demands payment—I'll help you hire the best hunters available.",
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
            text: "\"Thank you for your kindness. These days, simple human decency feels rarer than gold.\"",
        },
        divine_forgiveness: {
            id: 'divine_forgiveness',
            text: "\"You speak wisdom that my heart struggles to accept. Perhaps the greatest victory over evil is refusing to let it turn us into something we're not. My husband was a kind man—he would want mercy.\"",
        },
        justice_with_mercy: {
            id: 'justice_with_mercy',
            text: "\"Yes... perhaps there's a way to serve justice without creating more suffering. With your help, maybe we can find him and offer help to his family while still making him answer for what he's done.\"",
        },
        pursue_vengeance: {
            id: 'pursue_vengeance',
            text: "\"You understand what justice means. My husband deserves that much. Those bounty hunters will find him, and when they do, his children can learn what happens when you spill innocent blood.\"",
        },
    },
};

const merchantWidow: NPC = {
    name: "Merchant's Widow",
    description: 'A grieving woman torn between seeking justice for her murdered husband and showing mercy to his desperate killer.',
    dialogueTree: merchantWidowTree,
};

export {
    captainBlackwater,
    fishermansDaughter,
    villageHealer,
    unionLeader,
    merchantWidow,
};