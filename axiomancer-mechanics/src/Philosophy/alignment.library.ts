/**
 * Philosophical alignment library (Phase 42).
 *
 * The 27-cell registry indexed by the `(epistemology, outlook, scope)`
 * bucket triple. Authored verbatim from `content/philosophy/PhilosAxiosDoc.pdf`:
 * each cell carries its representative philosopher, literary character
 * (with the source work), and three signature logical fallacies (name,
 * example sentence, and alignment rationale).
 *
 * Axis polarity (see also docs/philosophy.md):
 *   - epistemology: low = Faith, mid = Agnostic, high = Logic
 *   - outlook:      low = Pessimistic, mid = Neutral, high = Optimistic
 *   - scope:        low = Individual, mid = Relational, high = Transcendent
 *
 * Cell ids are kebab-case `<epistemology>-<outlook>-<scope>`. Cell numbers
 * in the leading comments match the PDF (1-27) so future authoring can be
 * cross-checked against the source artwork.
 */

import type { PhilosophicalAlignmentCell } from './types';

export const philosophicalAlignmentLibrary: readonly PhilosophicalAlignmentCell[] = Object.freeze([
    // PDF cell 1 — Logic / Optimistic / Individual.
    {
        id: 'logic-optimistic-individual',
        epistemology: 'high',
        outlook: 'high',
        scope: 'low',
        label: 'Logic-Optimistic-Individual',
        philosopher: 'Friedrich Nietzsche (late period)',
        literaryCharacter: { name: 'Prometheus', work: "Shelley's \"Prometheus Unbound\"" },
        fallacies: [
            {
                name: 'Appeal to Consequences',
                example: '"This belief makes me stronger, therefore it\'s true".',
                rationale: 'Nietzsche valued beliefs based on life-affirming power rather than objective truth.',
            },
            {
                name: 'Genetic Fallacy',
                example: '"Your morality comes from slave resentment, therefore it\'s invalid".',
                rationale: 'Genealogical critique dismisses ideas based on their psychological origins.',
            },
            {
                name: 'No True Scotsman',
                example: '"No true Übermensch would accept herd morality".',
                rationale: 'Constantly redefining the ideal individual to exclude weakness.',
            },
        ],
    },

    // PDF cell 2 — Logic / Optimistic / Relational.
    {
        id: 'logic-optimistic-relational',
        epistemology: 'high',
        outlook: 'high',
        scope: 'mid',
        label: 'Logic-Optimistic-Relational',
        philosopher: 'Peter Singer',
        literaryCharacter: { name: 'Dr. Rieux', work: "Camus' \"The Plague\"" },
        fallacies: [
            {
                name: 'Slippery Slope (Positive)',
                example: '"If we help one person, we can help everyone".',
                rationale: 'Optimistic chain reasoning about expanding moral circles.',
            },
            {
                name: 'False Equivalence',
                example: '"A child drowning nearby equals a child starving far away".',
                rationale: "Singer's famous argument treats geographically distant suffering as morally equivalent.",
            },
            {
                name: 'Appeal to Emotion',
                example: '"Imagine the suffering we could prevent".',
                rationale: 'Uses emotional scenarios to motivate logical utilitarian action.',
            },
        ],
    },

    // PDF cell 3 — Logic / Optimistic / Transcendent.
    {
        id: 'logic-optimistic-transcendent',
        epistemology: 'high',
        outlook: 'high',
        scope: 'high',
        label: 'Logic-Optimistic-Transcendent',
        philosopher: 'Teilhard de Chardin',
        literaryCharacter: { name: 'Elwin Ransom', work: "C.S. Lewis' \"Perelandra\"" },
        fallacies: [
            {
                name: 'Teleological Argument',
                example: '"Complexity proves cosmic design and purpose".',
                rationale: 'Sees evidence of divine direction in evolution itself.',
            },
            {
                name: 'Post Hoc Ergo Propter Hoc',
                example: '"Evolution leads to consciousness, therefore consciousness was the goal".',
                rationale: 'Interprets temporal sequence as divine intentionality.',
            },
            {
                name: 'Begging the Question',
                example: '"The universe evolves toward God because God is the Omega Point".',
                rationale: 'Assumes transcendent telos to prove transcendent telos.',
            },
        ],
    },

    // PDF cell 4 — Logic / Neutral / Individual.
    {
        id: 'logic-mid-individual',
        epistemology: 'high',
        outlook: 'mid',
        scope: 'low',
        label: 'Logic-Neutral-Individual',
        philosopher: 'Albert Camus',
        literaryCharacter: { name: 'Meursault', work: "Camus' \"The Stranger\"" },
        fallacies: [
            {
                name: 'Non Sequitur',
                example: '"The universe is absurd, therefore I am free".',
                rationale: "Lack of cosmic meaning doesn't logically guarantee freedom, but Camus asserts it.",
            },
            {
                name: 'Appeal to Consequences',
                example: '"Accepting the absurd allows me to live fully, therefore it\'s the right approach".',
                rationale: 'Pragmatic justification for philosophical stance.',
            },
            {
                name: 'False Dilemma',
                example: '"Either suicide, hope in God, or accept the absurd".',
                rationale: 'Camus frames these as the only three responses to absurdity.',
            },
        ],
    },

    // PDF cell 5 — Logic / Neutral / Relational.
    {
        id: 'logic-mid-relational',
        epistemology: 'high',
        outlook: 'mid',
        scope: 'mid',
        label: 'Logic-Neutral-Relational',
        philosopher: 'Simone de Beauvoir',
        literaryCharacter: { name: 'Jane Eyre', work: "Brontë's \"Jane Eyre\"" },
        fallacies: [
            {
                name: 'Special Pleading',
                example: '"Our relationship transcends general ethical rules".',
                rationale: 'Particular relationships create particular ethical obligations beyond universals.',
            },
            {
                name: 'Appeal to Complexity',
                example: '"You can\'t judge oppression simply; it\'s ambiguous".',
                rationale: "De Beauvoir's ethics of ambiguity resists clear-cut answers.",
            },
            {
                name: 'Tu Quoque',
                example: '"You also participate in oppressive systems".',
                rationale: 'Everyone is complicit; mutual recognition of shared condition.',
            },
        ],
    },

    // PDF cell 6 — Logic / Neutral / Transcendent.
    {
        id: 'logic-mid-transcendent',
        epistemology: 'high',
        outlook: 'mid',
        scope: 'high',
        label: 'Logic-Neutral-Transcendent',
        philosopher: 'Baruch Spinoza',
        literaryCharacter: { name: 'The Narrator', work: "Borges' \"The Library of Babel\"" },
        fallacies: [
            {
                name: 'Equivocation',
                example: '"God and Nature are the same thing".',
                rationale: 'Uses same term (substance) to mean transcendent and physical reality.',
            },
            {
                name: 'Modal Fallacy',
                example: '"What is necessary is the same as what is actual".',
                rationale: "Everything that happens must happen in Spinoza's deterministic system.",
            },
            {
                name: 'Composition Fallacy',
                example: '"Each part of nature follows laws, therefore all of nature is rational/divine".',
                rationale: 'Extends property of parts to infinite whole (God).',
            },
        ],
    },

    // PDF cell 7 — Logic / Pessimistic / Individual.
    {
        id: 'logic-pessimistic-individual',
        epistemology: 'high',
        outlook: 'low',
        scope: 'low',
        label: 'Logic-Pessimistic-Individual',
        philosopher: 'Arthur Schopenhauer',
        literaryCharacter: { name: 'Underground Man', work: "Dostoevsky's \"Notes from Underground\"" },
        fallacies: [
            {
                name: 'Hasty Generalization',
                example: '"I suffer, all conscious beings suffer, therefore existence is suffering".',
                rationale: "Universalizes personal experience of Will's torment.",
            },
            {
                name: 'Nirvana Fallacy',
                example: '"Life has suffering, therefore life is not worth living".',
                rationale: 'Compares reality to ideal of non-existence and finds it wanting.',
            },
            {
                name: 'Appeal to Nature',
                example: '"Will-to-live is fundamental to nature, proving life is blind striving".',
                rationale: 'Uses natural world as evidence for metaphysical pessimism.',
            },
        ],
    },

    // PDF cell 8 — Logic / Pessimistic / Relational.
    {
        id: 'logic-pessimistic-relational',
        epistemology: 'high',
        outlook: 'low',
        scope: 'mid',
        label: 'Logic-Pessimistic-Relational',
        philosopher: 'Thomas Ligotti',
        literaryCharacter: { name: 'Rust Cohle', work: "HBO's \"True Detective\" Season 1" },
        fallacies: [
            {
                name: 'Hasty Generalization',
                example: '"Consciousness causes suffering, therefore consciousness shouldn\'t exist".',
                rationale: "Ligotti's \"conspiracy against the human race\" universalizes horror.",
            },
            {
                name: 'Genetic Fallacy',
                example: '"Your choices come from biology, therefore they\'re not real".',
                rationale: 'Dismisses human meaning based on evolutionary origins.',
            },
            {
                name: 'Composition Fallacy',
                example: '"Each individual suffers, therefore humanity is a collective tragedy".',
                rationale: 'Extends individual horror to species-level catastrophe.',
            },
        ],
    },

    // PDF cell 9 — Logic / Pessimistic / Transcendent.
    {
        id: 'logic-pessimistic-transcendent',
        epistemology: 'high',
        outlook: 'low',
        scope: 'high',
        label: 'Logic-Pessimistic-Transcendent',
        philosopher: 'Gnostics (philosophical interpretation) / Hans Jonas',
        literaryCharacter: { name: 'Severian', work: "Gene Wolfe's \"Book of the New Sun\"" },
        fallacies: [
            {
                name: 'False Dilemma',
                example: '"Either this world is evil or God is evil; God can\'t be evil, therefore world is".',
                rationale: 'Gnostic solution to problem of evil splits creator from true God.',
            },
            {
                name: 'No True Scotsman',
                example: '"The real God wouldn\'t create suffering, therefore the creator isn\'t the real God".',
                rationale: "Preserves transcendent God's goodness by denying God created matter.",
            },
            {
                name: 'Conspiracy Theory Reasoning',
                example: '"Archons deliberately trap souls in matter".',
                rationale: 'Sees malicious intent in cosmic structure.',
            },
        ],
    },

    // PDF cell 10 — Agnostic / Optimistic / Individual.
    {
        id: 'mid-optimistic-individual',
        epistemology: 'mid',
        outlook: 'high',
        scope: 'low',
        label: 'Agnostic-Optimistic-Individual',
        philosopher: 'Richard Rorty',
        literaryCharacter: { name: 'Huckleberry Finn', work: "Twain's \"Adventures of Huckleberry Finn\"" },
        fallacies: [
            {
                name: 'Moving the Goalposts',
                example: '"Truth is what works; and what works keeps changing".',
                rationale: "Rorty's pragmatism redefines truth based on utility.",
            },
            {
                name: 'Appeal to Novelty',
                example: '"New vocabularies are better because they\'re more useful now".',
                rationale: 'Values innovation and self-creation over tradition.',
            },
            {
                name: 'Relativist Fallacy',
                example: '"All truths are relative to communities, but my irony is valid".',
                rationale: 'Holds relativism while asserting individual self-creation.',
            },
        ],
    },

    // PDF cell 11 — Agnostic / Optimistic / Relational.
    {
        id: 'mid-optimistic-relational',
        epistemology: 'mid',
        outlook: 'high',
        scope: 'mid',
        label: 'Agnostic-Optimistic-Relational',
        philosopher: 'John Dewey',
        literaryCharacter: { name: 'Atticus Finch', work: "Lee's \"To Kill a Mockingbird\"" },
        fallacies: [
            {
                name: 'Appeal to Consequences',
                example: '"Democracy produces better outcomes, therefore it\'s the right system".',
                rationale: 'Pragmatic justification based on results rather than metaphysical truth.',
            },
            {
                name: 'Bandwagon (constructive)',
                example: '"Collective inquiry produces better results than individual reasoning".',
                rationale: 'Values consensus and community over individual certainty.',
            },
            {
                name: 'Middle Ground',
                example: '"Truth emerges through dialogue between opposing views".',
                rationale: "Dewey's experimentalism values synthesis and compromise.",
            },
        ],
    },

    // PDF cell 12 — Agnostic / Optimistic / Transcendent.
    {
        id: 'mid-optimistic-transcendent',
        epistemology: 'mid',
        outlook: 'high',
        scope: 'high',
        label: 'Agnostic-Optimistic-Transcendent',
        philosopher: 'William James',
        literaryCharacter: { name: 'Pi Patel', work: "Martel's \"Life of Pi\"" },
        fallacies: [
            {
                name: "Pascal's Wager (variant)",
                example: '"Believing in transcendent helps me live better, so I should believe".',
                rationale: "James's \"will to believe\" justifies faith pragmatically.",
            },
            {
                name: 'Appeal to Emotion',
                example: '"Religious experience feels real, therefore something transcendent exists".',
                rationale: 'Values subjective experience as evidence for transcendent.',
            },
            {
                name: 'False Dilemma',
                example: '"Either believe or despair".',
                rationale: 'James argues some truths only accessible through belief.',
            },
        ],
    },

    // PDF cell 13 — Agnostic / Neutral / Individual.
    {
        id: 'mid-mid-individual',
        epistemology: 'mid',
        outlook: 'mid',
        scope: 'low',
        label: 'Agnostic-Neutral-Individual',
        philosopher: 'Michel de Montaigne',
        literaryCharacter: { name: 'Ishmael', work: "Melville's \"Moby-Dick\"" },
        fallacies: [
            {
                name: 'Argument from Ignorance',
                example: '"I don\'t know anything for certain, therefore suspend all judgment".',
                rationale: "Montaigne's skeptical method doubts all claims.",
            },
            {
                name: 'Anecdotal Evidence',
                example: '"This happened to me, so let me explore what it means".',
                rationale: 'Essays use personal experience as philosophical starting point.',
            },
            {
                name: 'Tu Quoque',
                example: '"You\'re also uncertain, why do you claim certainty?".',
                rationale: 'Levels all dogmatic claims by pointing to universal uncertainty.',
            },
        ],
    },

    // PDF cell 14 — Agnostic / Neutral / Relational.
    {
        id: 'mid-mid-relational',
        epistemology: 'mid',
        outlook: 'mid',
        scope: 'mid',
        label: 'Agnostic-Neutral-Relational',
        philosopher: 'Martin Buber',
        literaryCharacter: { name: 'Nick Carraway', work: "Fitzgerald's \"The Great Gatsby\"" },
        fallacies: [
            {
                name: 'Special Pleading',
                example: '"This I-Thou relationship transcends general ethical categories".',
                rationale: 'Authentic encounter creates unique obligation beyond rules.',
            },
            {
                name: 'False Equivalence',
                example: '"All people are equally capable of I-Thou encounter".',
                rationale: 'Treats all relationships as potentially having same sacred quality.',
            },
            {
                name: 'Appeal to Mystery',
                example: '"The Between cannot be explained, only experienced".',
                rationale: 'Buber resists systematizing the relational encounter.',
            },
        ],
    },

    // PDF cell 15 — Agnostic / Neutral / Transcendent.
    {
        id: 'mid-mid-transcendent',
        epistemology: 'mid',
        outlook: 'mid',
        scope: 'high',
        label: 'Agnostic-Neutral-Transcendent',
        philosopher: 'Lao Tzu / Zhuangzi (Taoism)',
        literaryCharacter: { name: 'Siddhartha', work: "Hesse's \"Siddhartha\"" },
        fallacies: [
            {
                name: 'Equivocation',
                example: '"The Tao is both nothing and everything".',
                rationale: 'Uses contradictory language to point beyond language.',
            },
            {
                name: 'Appeal to Mystery',
                example: '"The Tao that can be told is not the eternal Tao".',
                rationale: 'Deliberately embraces paradox and ineffability.',
            },
            {
                name: 'Denying the Antecedent',
                example: '"If you strive, you fail; you don\'t strive, therefore you succeed".',
                rationale: 'Wu-wei logic inverts normal causal reasoning.',
            },
        ],
    },

    // PDF cell 16 — Agnostic / Pessimistic / Individual.
    {
        id: 'mid-pessimistic-individual',
        epistemology: 'mid',
        outlook: 'low',
        scope: 'low',
        label: 'Agnostic-Pessimistic-Individual',
        philosopher: 'Emil Cioran',
        literaryCharacter: { name: 'Hamlet', work: "Shakespeare's \"Hamlet\"" },
        fallacies: [
            {
                name: 'Nirvana Fallacy',
                example: '"Existence has suffering, therefore non-existence is preferable".',
                rationale: "Cioran's antinatalism compares life to impossible ideal of non-being.",
            },
            {
                name: 'Hasty Generalization',
                example: '"I am miserable, therefore existence itself is miserable".',
                rationale: 'Universalizes personal despair to cosmic condition.',
            },
            {
                name: 'Appeal to Futility',
                example: '"All efforts fail eventually, so why try?".',
                rationale: "Cioran's aphorisms often conclude meaninglessness.",
            },
        ],
    },

    // PDF cell 17 — Agnostic / Pessimistic / Relational.
    {
        id: 'mid-pessimistic-relational',
        epistemology: 'mid',
        outlook: 'low',
        scope: 'mid',
        label: 'Agnostic-Pessimistic-Relational',
        philosopher: 'Peter Wessel Zapffe',
        literaryCharacter: { name: 'Captain Ahab', work: "Melville's \"Moby-Dick\"" },
        fallacies: [
            {
                name: 'Genetic Fallacy',
                example: '"Consciousness is evolutionary accident, therefore it\'s meaningless".',
                rationale: 'Zapffe dismisses consciousness based on origins as mistake.',
            },
            {
                name: 'False Dilemma',
                example: '"Either face cosmic horror or use repression mechanisms".',
                rationale: "Zapffe's four mechanisms (isolation, anchoring, distraction, sublimation) or madness.",
            },
            {
                name: 'Composition Fallacy',
                example: '"Each person suffers from consciousness, therefore humanity is collective tragedy".',
                rationale: 'Extends individual burden to species-level horror.',
            },
        ],
    },

    // PDF cell 18 — Agnostic / Pessimistic / Transcendent.
    {
        id: 'mid-pessimistic-transcendent',
        epistemology: 'mid',
        outlook: 'low',
        scope: 'high',
        label: 'Agnostic-Pessimistic-Transcendent',
        philosopher: "H.P. Lovecraft's cosmicism (as philosophy)",
        literaryCharacter: { name: 'Burroughs', work: "Steven Peck's \"A Short Stay in Hell\"" },
        fallacies: [
            {
                name: 'Argument from Ignorance',
                example: '"We can\'t comprehend the cosmos, therefore it\'s hostile/indifferent".',
                rationale: 'Lovecraftian assumption that unknowable = horrifying.',
            },
            {
                name: 'Appeal to Fear',
                example: '"The truth will drive you mad, therefore don\'t seek it".',
                rationale: 'Knowledge of transcendent destroys human sanity.',
            },
            {
                name: 'Category Error',
                example: '"Applying human logic to cosmic entities".',
                rationale: 'Transcendent operates beyond human reason, rendering all logic futile.',
            },
        ],
    },

    // PDF cell 19 — Faith / Optimistic / Individual.
    {
        id: 'faith-optimistic-individual',
        epistemology: 'low',
        outlook: 'high',
        scope: 'low',
        label: 'Faith-Optimistic-Individual',
        philosopher: 'Søren Kierkegaard',
        literaryCharacter: { name: 'Alyosha Karamazov', work: "Dostoevsky's \"The Brothers Karamazov\"" },
        fallacies: [
            {
                name: 'Appeal to Faith',
                example: '"Logic can\'t reach religious truth; only faith can".',
                rationale: "Kierkegaard's leap requires abandoning rational proofs.",
            },
            {
                name: 'False Dilemma',
                example: '"Either/or: aesthetic life, ethical life, or religious life".',
                rationale: "Kierkegaard's stages require choosing one authentic path.",
            },
            {
                name: 'Special Pleading',
                example: '"Abraham\'s willingness to sacrifice Isaac transcends ethics".',
                rationale: '"Teleological suspension of the ethical" for individual faith.',
            },
        ],
    },

    // PDF cell 20 — Faith / Optimistic / Relational.
    {
        id: 'faith-optimistic-relational',
        epistemology: 'low',
        outlook: 'high',
        scope: 'mid',
        label: 'Faith-Optimistic-Relational',
        philosopher: 'Desmond Tutu / Ubuntu theology',
        literaryCharacter: { name: 'Jean Valjean', work: "Hugo's \"Les Misérables\"" },
        fallacies: [
            {
                name: 'Appeal to Consequences',
                example: '"Forgiveness heals communities, therefore it\'s God\'s will".',
                rationale: 'Ubuntu justifies reconciliation through relational outcomes.',
            },
            {
                name: 'Hasty Generalization',
                example: '"This act of mercy transformed one person, so mercy transforms all".',
                rationale: 'Optimistic faith that love converts universally.',
            },
            {
                name: 'Circular Reasoning',
                example: '"We are one because God made us one; God\'s unity proves our unity".',
                rationale: 'Faith in communal theology validates communal practice.',
            },
        ],
    },

    // PDF cell 21 — Faith / Optimistic / Transcendent.
    {
        id: 'faith-optimistic-transcendent',
        epistemology: 'low',
        outlook: 'high',
        scope: 'high',
        label: 'Faith-Optimistic-Transcendent',
        philosopher: 'St. Augustine / Thomas Aquinas',
        literaryCharacter: { name: 'Dante', work: "Dante's \"Divine Comedy\" (especially Paradiso)" },
        fallacies: [
            {
                name: 'Circular Reasoning',
                example: '"The Bible is true because God wrote it; we know God wrote it because the Bible says so".',
                rationale: 'Faith establishes premises that validate faith.',
            },
            {
                name: 'Argument from Authority',
                example: '"The Church says it, therefore it\'s true".',
                rationale: 'Divine revelation through institutional authority.',
            },
            {
                name: 'Teleological Argument',
                example: '"The world has design and purpose, therefore God exists".',
                rationale: "Aquinas's Five Ways use reason to support faith in transcendent designer.",
            },
        ],
    },

    // PDF cell 22 — Faith / Neutral / Individual.
    {
        id: 'faith-mid-individual',
        epistemology: 'low',
        outlook: 'mid',
        scope: 'low',
        label: 'Faith-Neutral-Individual',
        philosopher: 'Blaise Pascal',
        literaryCharacter: { name: 'Raskolnikov', work: "Dostoevsky's \"Crime and Punishment\"" },
        fallacies: [
            {
                name: "Pascal's Wager",
                example: '"If God exists and you don\'t believe, you lose everything; if you believe and God doesn\'t exist, you lose little".',
                rationale: 'Cost-benefit analysis applied to faith despite uncertainty.',
            },
            {
                name: 'Appeal to Fear',
                example: '"The eternal silence of infinite spaces frightens me".',
                rationale: 'Pascal uses existential dread to motivate faith choice.',
            },
            {
                name: 'False Dilemma',
                example: '"Either believe in Christian God or face meaninglessness".',
                rationale: 'Wager assumes only two options.',
            },
        ],
    },

    // PDF cell 23 — Faith / Neutral / Relational.
    {
        id: 'faith-mid-relational',
        epistemology: 'low',
        outlook: 'mid',
        scope: 'mid',
        label: 'Faith-Neutral-Relational',
        philosopher: 'Dorothy Day / Catholic Worker Movement',
        literaryCharacter: { name: 'Father Damien', work: 'historical figure / various literary depictions' },
        fallacies: [
            {
                name: 'Appeal to Tradition',
                example: '"The Church has always taught service to the poor".',
                rationale: 'Faith tradition validates relational praxis.',
            },
            {
                name: 'Appeal to Emotion',
                example: '"Christ suffered with us, so we must suffer with others".',
                rationale: "Emotional connection to Christ's passion motivates service.",
            },
            {
                name: 'No True Scotsman',
                example: '"True faith requires action for the poor".',
                rationale: 'Defines authentic Christianity through social justice.',
            },
        ],
    },

    // PDF cell 24 — Faith / Neutral / Transcendent.
    {
        id: 'faith-mid-transcendent',
        epistemology: 'low',
        outlook: 'mid',
        scope: 'high',
        label: 'Faith-Neutral-Transcendent',
        philosopher: 'St. John of the Cross / Mystical Theology',
        literaryCharacter: { name: 'Father Rodrigues', work: "Endo's \"Silence\"" },
        fallacies: [
            {
                name: 'Appeal to Mystery',
                example: '"God\'s ways are not our ways".',
                rationale: 'Mysticism embraces divine incomprehensibility.',
            },
            {
                name: 'Moving the Goalposts',
                example: '"God\'s presence in absence is different from absence".',
                rationale: 'Dark night redefines what divine presence means.',
            },
            {
                name: 'Paradox Acceptance',
                example: '"God is both present and absent, known and unknowable".',
                rationale: 'Mystical theology embraces contradictions.',
            },
        ],
    },

    // PDF cell 25 — Faith / Pessimistic / Individual.
    {
        id: 'faith-pessimistic-individual',
        epistemology: 'low',
        outlook: 'low',
        scope: 'low',
        label: 'Faith-Pessimistic-Individual',
        philosopher: 'Tertullian (early church father)',
        literaryCharacter: { name: 'Ivan Karamazov', work: "Dostoevsky's \"The Brothers Karamazov\"" },
        fallacies: [
            {
                name: 'Appeal to Absurdity',
                example: '"It\'s absurd, therefore I believe it".',
                rationale: 'Faith despite or because of irrationality.',
            },
            {
                name: 'Loaded Question',
                example: '"If God exists, why do innocent children suffer?".',
                rationale: "Ivan's challenge assumes God's existence to indict God.",
            },
            {
                name: 'False Dilemma',
                example: '"Either God is unjust or God doesn\'t exist".',
                rationale: "Ivan's rebellion rejects both options while remaining in framework.",
            },
        ],
    },

    // PDF cell 26 — Faith / Pessimistic / Relational.
    {
        id: 'faith-pessimistic-relational',
        epistemology: 'low',
        outlook: 'low',
        scope: 'mid',
        label: 'Faith-Pessimistic-Relational',
        philosopher: 'Philipp Mainländer',
        literaryCharacter: { name: 'Father Ferreira', work: "Endo's \"Silence\"" },
        fallacies: [
            {
                name: 'Genetic Fallacy',
                example: '"God died to create universe, therefore universe is death process".',
                rationale: 'Origin story (divine suicide) determines cosmic meaning.',
            },
            {
                name: 'Appeal to Pity',
                example: '"Compassion for suffering converts justifies abandoning faith".',
                rationale: 'Emotional weight of community suffering overrides theology.',
            },
            {
                name: 'False Dilemma',
                example: '"Either maintain faith and watch them suffer, or apostatize and save them".',
                rationale: 'Tragic choice between competing loves.',
            },
        ],
    },

    // PDF cell 27 — Faith / Pessimistic / Transcendent.
    {
        id: 'faith-pessimistic-transcendent',
        epistemology: 'low',
        outlook: 'low',
        scope: 'high',
        label: 'Faith-Pessimistic-Transcendent',
        philosopher: 'Marcion / Gnostic Christianity',
        literaryCharacter: { name: 'The Grand Inquisitor', work: "Dostoevsky's \"The Brothers Karamazov\"" },
        fallacies: [
            {
                name: 'No True Scotsman',
                example: '"The real God wouldn\'t create evil world, therefore creator isn\'t real God".',
                rationale: "Preserves transcendent God's goodness by splitting from creator.",
            },
            {
                name: 'False Dilemma',
                example: '"Either God is good and didn\'t create matter, or God created matter and isn\'t good".',
                rationale: 'Gnostic solution to problem of evil.',
            },
            {
                name: 'Appeal to Consequences',
                example: '"If Christ wanted humans free, humanity would suffer; therefore Christ was wrong/cruel".',
                rationale: 'Grand Inquisitor judges divine plan by human capacity.',
            },
        ],
    },
]);
