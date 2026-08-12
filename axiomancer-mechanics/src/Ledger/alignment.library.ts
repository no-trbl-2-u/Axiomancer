/**
 * Alignment library (Phase 42 cube; content re-authored Phase 44h).
 *
 * The 27-cell registry indexed by the `(epistemology, outlook, scope)`
 * bucket triple. Each cell carries a damned exemplar (an in-world Parish
 * figure who held this position, and what it cost them), a cautionary
 * tale (a Parish folk story carrying the same position), and three
 * besetting sins (name, example, rationale) — the dark-fantasy re-skin
 * of the original real-world-philosopher / literary-character / logical-
 * fallacy content, per spec 34 §6.2.1 (THE UNSHACKLING, 2026-08-08).
 *
 * Axis polarity (see also docs/oaths.md):
 *   - epistemology: low = Faith, mid = Agnostic, high = Logic
 *   - outlook:      low = Pessimistic, mid = Neutral, high = Optimistic
 *   - scope:        low = Individual, mid = Relational, high = Transcendent
 *
 * Cell ids are kebab-case `<epistemology>-<outlook>-<scope>`, unchanged
 * since Phase 42 (persisted-adjacent via `getAlignmentCell` lookups —
 * see spec 34 §6.2.2, ids frozen).
 */

import type { PhilosophicalAlignmentCell } from './types';

export const philosophicalAlignmentLibrary: readonly PhilosophicalAlignmentCell[] = Object.freeze([
    // Cell 1 — Logic / Optimistic / Individual.
    {
        id: 'logic-optimistic-individual',
        epistemology: 'high',
        outlook: 'high',
        scope: 'low',
        label: 'Logic-Optimistic-Individual',
        damnedExemplar: "the Bellringer of Thumbprick Hill, who swore the will could out-shout any wound, and rang matins on a shattered arm each dawn until the rot took it and the bell fell silent.",
        cautionaryTale: { name: 'the Boy Who Would Not Kneel', toldIn: 'told to novices the night before their first tithe, to warn them what pride costs' },
        besettingSins: [
            { name: 'Comfort Taken as Proof', example: '"The belief holds me upright, so I call it gospel".', rationale: 'He judged every creed by whether it kept him standing, not by whether the parish agreed it was so.' },
            { name: 'Tainted Well Reasoning', example: '"Your mercy was born of weakness, so it is no mercy at all".', rationale: 'He struck down any doctrine he could trace to the frightened or the frail, as though its birth were its verdict.' },
            { name: 'Shifting Rubric', example: '"No bellringer worth the name would ever falter, so the ones who falter were never true to the office".', rationale: 'Each time the unbroken failed him, he redrew the office smaller rather than admit the will could break.' },
        ],
    },

    // Cell 2 — Logic / Optimistic / Relational.
    {
        id: 'logic-optimistic-relational',
        epistemology: 'high',
        outlook: 'high',
        scope: 'mid',
        label: 'Logic-Optimistic-Relational',
        damnedExemplar: "the Relief-Warden of Long Assize, who swore one parish's hunger was every parish's hunger, and emptied the winter stores past the wall until her own kin starved before thaw.",
        cautionaryTale: { name: 'the Widow Who Fed Two Parishes', toldIn: 'recited at the almshouse door each Distraint-tide, to shame the miserly' },
        besettingSins: [
            { name: 'Ever-Widening Ledger', example: '"Feed one mouth and in time the whole parish feeds itself".', rationale: 'She believed mercy multiplied without limit, each gift begetting the next entry in the same column.' },
            { name: 'Flattened Distance', example: '"A stranger\'s hunger past the wall weighs the same as my own child\'s".', rationale: 'She entered every hunger in the same column, near or far, kin or stranger, as though distance carried no weight of its own.' },
            { name: 'Conjured Grief', example: '"Picture the child\'s ribs, and tell me the ledger is wrong".', rationale: 'She proved her sums not with arithmetic but with pictures of suffering, letting pity stand in for reckoning.' },
        ],
    },

    // Cell 3 — Logic / Optimistic / Transcendent.
    {
        id: 'logic-optimistic-transcendent',
        epistemology: 'high',
        outlook: 'high',
        scope: 'high',
        label: 'Logic-Optimistic-Transcendent',
        damnedExemplar: "the Precentor of the Nine Wheels, who charted every plague and famine on a single wheel and called the turning ascent, until his own name became the wheel's last spoke.",
        cautionaryTale: { name: 'the Cartographer of the Last Amen', toldIn: 'chalked fresh onto the chapel floor each year and swept away before Advent' },
        besettingSins: [
            { name: 'Design Read in Ruin', example: '"The plague took the wicked first, so the plague must be a mercy wearing a harder face".', rationale: 'He saw a design in every scar, as though suffering arranged itself toward an end only he could chart.' },
            { name: 'Aim Read Backward', example: '"The parish endured to become what it is now, so enduring must have been the aim all along".', rationale: "He read the outcome back into the beginning, as though the final sum had always been the entry's purpose." },
            { name: 'Self-Proving Circle', example: '"The world climbs toward communion, because communion is where all climbing ends".', rationale: 'His proof and his conclusion were the same sentence, spoken twice and mistaken for two.' },
        ],
    },

    // Cell 4 — Logic / Neutral / Individual.
    {
        id: 'logic-mid-individual',
        epistemology: 'high',
        outlook: 'mid',
        scope: 'low',
        label: 'Logic-Neutral-Individual',
        damnedExemplar: "the Gravedigger of Hollow Assize, who wept at no burial, not even her own mother's, and called the emptiness freedom until the gallows-bell proved her wrong.",
        cautionaryTale: { name: 'the Woman Who Buried Without Grief', toldIn: 'read from the assize rolls whenever a confession runs dry' },
        besettingSins: [
            { name: 'Freedom Assumed from Silence', example: '"Nothing means anything, so nothing binds me".', rationale: "She took the parish's silence as permission, though silence proves no such thing." },
            { name: 'Ease Sworn as Truth', example: '"Believing nothing matters lets me sleep, so I hold it true".', rationale: 'She judged the creed by how well it let her rest, not by whether the parish would agree.' },
            { name: 'Counted Doors', example: '"There is the noose, the chapel, or the shrug, and nothing else".', rationale: "She narrowed every soul's reckoning to three doors, as though no fourth had ever been cut." },
        ],
    },

    // Cell 5 — Logic / Neutral / Relational.
    {
        id: 'logic-mid-relational',
        epistemology: 'high',
        outlook: 'mid',
        scope: 'mid',
        label: 'Logic-Neutral-Relational',
        damnedExemplar: "the Confessor of Two Ledgers, who kept one rule for kin and another for strangers and called it mercy, until the assize named it favoritism and stripped her cope.",
        cautionaryTale: { name: 'the Woman Who Judged by Face, Not by Writ', toldIn: "whispered by petitioners waiting outside the confessor's door" },
        besettingSins: [
            { name: 'Exempted Bond', example: '"The writ binds strangers; it does not bind us".', rationale: 'She held her own attachments outside the very law she pressed on everyone else.' },
            { name: 'Shelter of Tangle', example: '"You cannot call it cruelty; the matter is too tangled to name".', rationale: 'She let every wrongdoing hide inside its own complication until no verdict could be reached.' },
            { name: 'Shared Stain', example: '"You wear the same chains you accuse me of forging".', rationale: 'She answered every charge with a charge of her own, as though shared guilt cancelled the debt.' },
        ],
    },

    // Cell 6 — Logic / Neutral / Transcendent.
    {
        id: 'logic-mid-transcendent',
        epistemology: 'high',
        outlook: 'mid',
        scope: 'high',
        label: 'Logic-Neutral-Transcendent',
        damnedExemplar: "the Recorder of the Unread Stacks, who ruled the parish and its absent power were a single ledger read two ways, until he vanished seeking the page that proved it.",
        cautionaryTale: { name: 'the Archivist Who Sought the Final Shelf', toldIn: 'carved into the ossuary door by a hand nobody has claimed' },
        besettingSins: [
            { name: 'Doubled Word', example: '"Call it the parish, call it the world entire; the word costs nothing to change".', rationale: 'He let a single word carry two debts and paid neither one in full.' },
            { name: 'Fated Ledger', example: '"It happened, therefore it could not have happened otherwise".', rationale: 'He mistook the entry already written for the only entry that could ever be written.' },
            { name: 'Part Sworn for Whole', example: '"Each grave obeys the sexton\'s order, so the whole earth must obey some order too".', rationale: 'He took the discipline of the small and swore it governed the entire, unseen whole.' },
        ],
    },

    // Cell 7 — Logic / Pessimistic / Individual.
    {
        id: 'logic-pessimistic-individual',
        epistemology: 'high',
        outlook: 'low',
        scope: 'low',
        label: 'Logic-Pessimistic-Individual',
        damnedExemplar: "the Wound-Reader of Gallows Row, who took his own chilblains as proof the whole parish rotted alike, and gnawed his own fingers rather than be told otherwise.",
        cautionaryTale: { name: 'the Man Who Would Not Be Comforted', toldIn: 'told to children who complain of small hurts, to quiet them' },
        besettingSins: [
            { name: 'Wound Made World', example: '"My chilblains prove the whole parish is rot".', rationale: "He took his own affliction as the measure of every living thing's." },
            { name: 'Weighed Against Unbeing', example: '"Since living hurts, better never to have drawn breath at all".', rationale: 'He weighed the parish against a peace that never existed, and found the parish wanting.' },
            { name: "Beast's Verdict", example: '"Even the dog gnaws its own leash; hunger governs all, and hunger is misery".', rationale: 'He read animal appetite as confession, proof that all striving is only suffering dressed as want.' },
        ],
    },

    // Cell 8 — Logic / Pessimistic / Relational.
    {
        id: 'logic-pessimistic-relational',
        epistemology: 'high',
        outlook: 'low',
        scope: 'mid',
        label: 'Logic-Pessimistic-Relational',
        damnedExemplar: "the Confessor Who Would Absolve No One, and preached that to wake at all was the parish's first and only sin, until she stopped waking anyone, herself included.",
        cautionaryTale: { name: 'the Child Who Would Not Wake', toldIn: 'sung low over cradles in the leanest winters, to ward off the dread of waking' },
        besettingSins: [
            { name: 'Every Waking Cursed Alike', example: '"To feel at all is to suffer, so feeling itself should cease".', rationale: 'She took her own dread at waking and swore it was every creature\'s sentence.' },
            { name: "Blood Named the Liar", example: '"Your grief is only the body\'s weather, so it proves nothing".', rationale: 'She dismissed every mourner\'s meaning by tracing it back to meat and marrow.' },
            { name: 'Single Sorrow Ruling All', example: '"One man\'s ruin is proof the whole parish is ruined alike".', rationale: 'She let a single sorrow stand for the entire congregation\'s fate.' },
        ],
    },

    // Cell 9 — Logic / Pessimistic / Transcendent.
    {
        id: 'logic-pessimistic-transcendent',
        epistemology: 'high',
        outlook: 'low',
        scope: 'high',
        label: 'Logic-Pessimistic-Transcendent',
        damnedExemplar: "the Sexton Who Renounced the Bell, and preached that the parish's saints were jailers in borrowed vestments, guarding a throne long since vacated, until the assize walled him beneath the chancel.",
        cautionaryTale: { name: 'the Prisoner Who Named His Own Warden', toldIn: 'scratched into the ossuary wall where the assize could not scrub it out' },
        besettingSins: [
            { name: 'Choice Narrowed to Two', example: '"Either the parish is cursed or the saints are cruel, and no true saint is cruel, so the parish is cursed".', rationale: 'He allowed only two verdicts and barred the one that would have implicated the altar.' },
            { name: 'Disowned Maker', example: '"No true saint would author this rot, so whoever authored it was never a saint at all".', rationale: 'He kept his saints blameless by inventing a lesser warden to hold the guilt in their place.' },
            { name: 'Malice Read in Machinery', example: '"The bells ring on schedule because something wants us penned, not saved".', rationale: "He read deliberate cruelty into the parish's ordinary machinery of debt and bell." },
        ],
    },

    // Cell 10 — Agnostic / Optimistic / Individual.
    {
        id: 'mid-optimistic-individual',
        epistemology: 'mid',
        outlook: 'high',
        scope: 'low',
        label: 'Agnostic-Optimistic-Individual',
        damnedExemplar: 'the Tallyman of Rushlight, who held that a debt was true only so long as it served the debtor, and was struck from the rolls when his own accounts changed too often to trust.',
        cautionaryTale: { name: "the Ragpicker's Boy", toldIn: 'told a different way at every hearth, and the almoners let it be, since the moral bends with the teller' },
        besettingSins: [
            { name: 'The Shifting Ledger', example: '"The debt was owed yesterday. Today the accounting reads different, and so it is."', rationale: 'Like the Tallyman, he calls a thing true only until keeping it true grows costly.' },
            { name: 'Hunger for the Untried', example: '"The old rite failed twice. Try the new one; it has not failed yet."', rationale: 'The Tallyman prized what was freshly tried over what had merely lasted.' },
            { name: 'The Excepted Self', example: '"Every parish keeps its own truth. Mine, I keep exact."', rationale: 'He preached that all ledgers bend, then swore his own never had.' },
        ],
    },

    // Cell 11 — Agnostic / Optimistic / Relational.
    {
        id: 'mid-optimistic-relational',
        epistemology: 'mid',
        outlook: 'high',
        scope: 'mid',
        label: 'Agnostic-Optimistic-Relational',
        damnedExemplar: 'the Reeve of Millbrook, who judged every rite by whether the granary was fuller after, and was quietly retired the year a good harvest proved him no wiser than the weather.',
        cautionaryTale: { name: "the Reeve's Daughter", toldIn: 'read out at every parish moot before the vote is called, so no one mistakes a full larder for proof of anything' },
        besettingSins: [
            { name: 'Proof by Full Belly', example: '"The moot decided well. Look how the granary held through winter."', rationale: 'The Reeve counted a decision right whenever the harvest happened to agree with it.' },
            { name: 'Safety in the Crowd', example: '"The parish agreed together, so the parish could not be wrong."', rationale: "He trusted the moot's consensus the way others trust a written writ." },
            { name: 'Splitting the Difference', example: '"Both sides brought a claim. Halve it, and call the matter settled."', rationale: 'The Reeve mistook compromise itself for the fair outcome, whatever the claims weighed.' },
        ],
    },

    // Cell 12 — Agnostic / Optimistic / Transcendent.
    {
        id: 'mid-optimistic-transcendent',
        epistemology: 'mid',
        outlook: 'high',
        scope: 'high',
        label: 'Agnostic-Optimistic-Transcendent',
        damnedExemplar: 'the Confessor of Sable Reach, who chose each night to believe the ledger balanced somewhere unseen, and was found kneeling to an empty altar the morning the third bell stopped answering.',
        cautionaryTale: { name: 'the Widow Who Chose to Believe', toldIn: 'sung at every Threadbare wake, though no two mourners agree whether it ends in mercy or in madness' },
        besettingSins: [
            { name: 'Faith for the Warmth', example: '"Believing costs me nothing and keeps me standing. So I believe."', rationale: 'The Confessor chose faith not for its truth but for what it let her carry.' },
            { name: 'The Feeling as Witness', example: '"I felt the third bell answer. That is proof enough for me."', rationale: 'She let the shape of the feeling stand in for the thing itself.' },
            { name: 'Only Two Doors Offered', example: '"Believe, or lie down in the ashpit. Choose."', rationale: 'The Confessor allowed no doorway between conviction and despair.' },
        ],
    },

    // Cell 13 — Agnostic / Neutral / Individual.
    {
        id: 'mid-mid-individual',
        epistemology: 'mid',
        outlook: 'mid',
        scope: 'low',
        label: 'Agnostic-Neutral-Individual',
        damnedExemplar: 'the Gravedigger of Hollow Wick, who answered every question with another question until the assizes stopped calling him to testify at all.',
        cautionaryTale: { name: 'the Doubting Sexton', toldIn: 'scratched into the sea-wall at low tide, where the water erases half the lesson before anyone reads it twice' },
        besettingSins: [
            { name: 'The Comfort of Unknowing', example: '"I cannot be certain of anything, so I will judge nothing."', rationale: "The Gravedigger's doubt of every claim became, in the end, a refuge from all of them." },
            { name: 'Wound Read as Gospel', example: '"This happened to me once. Let that stand for what is true."', rationale: 'He built his reasoning from what he alone had buried and seen.' },
            { name: 'The Mirrored Accusation', example: '"You claim certainty. Are you not as blind as I am?"', rationale: "He answered every confident claim by pointing out the asker's own doubt." },
        ],
    },

    // Cell 14 — Agnostic / Neutral / Relational.
    {
        id: 'mid-mid-relational',
        epistemology: 'mid',
        outlook: 'mid',
        scope: 'mid',
        label: 'Agnostic-Neutral-Relational',
        damnedExemplar: 'the Almoner of Fenmark, who claimed one true meeting with a dying stranger absolved him of every other rite in the book, and was never again trusted with the ledger.',
        cautionaryTale: { name: 'the Watcher at the Threshold', toldIn: 'the version the sextons tell, not the one the choir sings, of a stranger who looked at a dying man and called it communion enough' },
        besettingSins: [
            { name: 'An Exception for Love', example: '"That meeting stood outside the rite. It answers to nothing but itself."', rationale: 'The Almoner set his one true encounter above every rule that governed the rest.' },
            { name: 'The Equal Weighing', example: '"Any stranger might be met as deeply as any other. All are equally near."', rationale: 'He treated all encounters as carrying the same weight, whatever the parting cost.' },
            { name: 'The Unaccountable Between', example: '"What passed between us cannot be entered in the ledger. Only felt."', rationale: 'He refused to let the meeting be questioned, calling it beyond the reach of the rolls.' },
        ],
    },

    // Cell 15 — Agnostic / Neutral / Transcendent.
    {
        id: 'mid-mid-transcendent',
        epistemology: 'mid',
        outlook: 'mid',
        scope: 'high',
        label: 'Agnostic-Neutral-Transcendent',
        damnedExemplar: 'the Hermit of the Long Marsh, who taught that the truest answer unmade itself in the speaking, and left no writ behind to prove he had ever taught at all.',
        cautionaryTale: { name: 'the Beggar Who Stopped Asking', toldIn: "passed hand to hand among the almonry's beggars, each one swearing it means the opposite of what the last one meant" },
        besettingSins: [
            { name: 'Both Halves at Once', example: '"It is nothing, and it is everything. Both, in the same breath."', rationale: 'The Hermit let a single word carry two meanings and called the contradiction wisdom.' },
            { name: 'The Unspoken Guarded', example: '"What can be told is not the true thing. So I tell you nothing."', rationale: 'He shielded his teaching from question by claiming it could not survive the telling.' },
            { name: 'Winning by Not Reaching', example: '"Strive, and you fail. I have not strived. Therefore I have not failed."', rationale: 'The Hermit inverted plain cause into its opposite and called it a wisdom teaching.' },
        ],
    },

    // Cell 16 — Agnostic / Pessimistic / Individual.
    {
        id: 'mid-pessimistic-individual',
        epistemology: 'mid',
        outlook: 'low',
        scope: 'low',
        label: 'Agnostic-Pessimistic-Individual',
        damnedExemplar: 'the Almoner of Ashpool, who wrote into the parish register that being unborn was the only mercy on offer, and one winter was found to have taken the mercy for himself.',
        cautionaryTale: { name: 'the Boy Who Wished Himself Unmade', toldIn: 'whispered to children who ask why the bell tolls for the newborn the same as for the dead' },
        besettingSins: [
            { name: 'Measured Against the Unmade', example: '"To have never been born beats any life on offer. Weighed so, living always loses."', rationale: 'The Almoner set every life against a mercy no one could actually claim.' },
            { name: "The World's Single Wound", example: '"My days are ash. Therefore all days are ash."', rationale: 'He took his own grief and wrote it across every ledger in the parish.' },
            { name: 'The Ledger Closed Early', example: '"Every account ends in arrears eventually. Why keep entering figures at all?"', rationale: 'The Almoner treated the certainty of an ending as reason to stop the work entirely.' },
        ],
    },

    // Cell 17 — Agnostic / Pessimistic / Relational.
    {
        id: 'mid-pessimistic-relational',
        epistemology: 'mid',
        outlook: 'low',
        scope: 'mid',
        label: 'Agnostic-Pessimistic-Relational',
        damnedExemplar: "the Whaler-Priest of Drownmere, who preached that thought itself was the parish's oldest curse, an accident the bones never asked for, and chased that grievance until the sea took the argument from him.",
        cautionaryTale: { name: 'the Harpooner Who Argued With the Deep', toldIn: 'the long version the fishwives tell in the dead of winter, never the short one the children hear' },
        besettingSins: [
            { name: 'The Accident of Thought', example: '"Thought was never chosen, only suffered into being. So it is worth nothing."', rationale: 'The Whaler-Priest dismissed the mind by pointing only at its accidental birth.' },
            { name: 'Madness or Small Mercies', example: '"Face the deep bare, or busy your hands until you forget it is there. No third way."', rationale: 'He allowed only ruin or distraction, and no room between them.' },
            { name: 'The Shared Grief', example: '"Each soul carries this weight alone. Therefore the whole parish drowns together."', rationale: 'He stacked private sorrow into a claim about the fate of everyone at once.' },
        ],
    },

    // Cell 18 — Agnostic / Pessimistic / Transcendent.
    {
        id: 'mid-pessimistic-transcendent',
        epistemology: 'mid',
        outlook: 'low',
        scope: 'high',
        label: 'Agnostic-Pessimistic-Transcendent',
        damnedExemplar: 'the Confessor of the Drowned Chapter, who read three pages of the forbidden rota and afterward would answer only in numbers, until the parish walled up the room and struck his name from the rolls.',
        cautionaryTale: { name: 'the Clerk Who Read Too Far', toldIn: 'never told whole, since the ending is the part that costs the teller something' },
        besettingSins: [
            { name: 'Silence Read as Threat', example: '"We cannot make sense of it, so it must mean us harm."', rationale: 'The Confessor mistook his own incomprehension for evidence of malice.' },
            { name: 'Warning Instead of Answer', example: '"Do not read the third page. It is enough that it broke me."', rationale: 'He offered his ruin as reason enough to stop asking, never an actual answer.' },
            { name: 'Counting the Uncountable', example: '"I set the parish reckoning against it, as though its ledger could be read the same way."', rationale: 'The Confessor applied ordinary tallying to a thing that owed the parish nothing at all.' },
        ],
    },

    // Cell 19 — Faith / Optimistic / Individual.
    {
        id: 'faith-optimistic-individual',
        epistemology: 'low',
        outlook: 'high',
        scope: 'low',
        label: 'Faith-Optimistic-Individual',
        damnedExemplar: "the Novice of Thumbprick Chapel, who called proof a coward's crutch and walked bare-footed onto the millpond ice to show faith needed none, and did not walk back.",
        cautionaryTale: { name: 'The Barefoot Communicant', toldIn: "read at the closing of every novice's vigil, though the sextons never finish it" },
        besettingSins: [
            { name: 'The Blind Vow', example: '"I did not wait for the ledger to confirm it. I felt the summons, and I went".', rationale: "The Novice's leap onto the ice took no evidence, only the certainty of the calling." },
            { name: 'The Single Gate', example: '"There is one door in this parish, and you will choose it or you will choose the frost".', rationale: 'The Barefoot Communicant\'s tale allows only one road to grace, as though no third path were ever dug.' },
            { name: 'The Exempted Hand', example: '"What is forbidden to the parish was permitted to me, for the bell rang for me alone".', rationale: "The Novice claimed her private calling excused her from the parish's ordinary law, the same claim the Barefoot Communicant made before the ice took her." },
        ],
    },

    // Cell 20 — Faith / Optimistic / Relational.
    {
        id: 'faith-optimistic-relational',
        epistemology: 'low',
        outlook: 'high',
        scope: 'mid',
        label: 'Faith-Optimistic-Relational',
        damnedExemplar: "the Almoner of Gallow's Fen, who forgave every debtor's arrears from her own purse until the parish came to collect from her grave instead.",
        cautionaryTale: { name: 'The Forgiven Poacher', toldIn: "told over the offertory plate whenever a debtor is let go without paying" },
        besettingSins: [
            { name: 'The Merciful Ledger', example: '"Forgiving him mended the village, so mercy must be the parish\'s own law".', rationale: "The Almoner judged her forgiveness true because it healed the fen, not because any rite proved it right." },
            { name: 'The One Kindness', example: '"He gave up thieving after I pardoned him, so pardon cures every thief".', rationale: "The Forgiven Poacher's single reform is retold as though it works on every debtor in the parish." },
            { name: 'The Closed Circle', example: '"We are bound as one flock because the dead saints made us one, and the dead saints\' unity proves the flock is bound".', rationale: "The Almoner's communion doctrine proves itself by restating itself, the same as a tale that proves the flock's oneness by the flock's oneness." },
        ],
    },

    // Cell 21 — Faith / Optimistic / Transcendent.
    {
        id: 'faith-optimistic-transcendent',
        epistemology: 'low',
        outlook: 'high',
        scope: 'high',
        label: 'Faith-Optimistic-Transcendent',
        damnedExemplar: 'the Confessor-General of the high assize, who ruled the gospel true because the gospel said so, and was believed until the parish asked him to prove it and he had nothing but the book.',
        cautionaryTale: { name: 'The Pilgrim of Nine Terraces', toldIn: 'the version the sextons tell, not the one carved into the ossuary wall' },
        besettingSins: [
            { name: 'The Book Proves Itself', example: '"The gospel is true because it is the gospel\'s own word, and the gospel\'s word is true because it is gospel".', rationale: "The Confessor-General's doctrine confirms itself by citing itself, as the Pilgrim's climb is proven holy only by the tale of the climb." },
            { name: 'The Word From Above', example: '"The high assize has spoken, and what the assize speaks needs no further proof".', rationale: "Belief rests on office rather than evidence, the same weight the Pilgrim's tale gives the terraces simply because a saint once walked them." },
            { name: 'The Shape of a Maker', example: '"The frost forms in patterns too fine for chance; some hand must have pressed them".', rationale: 'The Confessor-General read design into the cold itself and called the design proof of a maker above the parish.' },
        ],
    },

    // Cell 22 — Faith / Neutral / Individual.
    {
        id: 'faith-mid-individual',
        epistemology: 'low',
        outlook: 'mid',
        scope: 'low',
        label: 'Faith-Neutral-Individual',
        damnedExemplar: "the Assizer's Clerk of Cold Fen, who reckoned belief as a wager against the ledger of the dead and staked his last coin on faith, though he never once felt it.",
        cautionaryTale: { name: 'The Wagering Widow', toldIn: 'chalked above the almonry door, sum and all, for anyone who can still do the sum' },
        besettingSins: [
            { name: 'The Ledger Wager', example: '"If the dead ask and I have believed, I lose an evening\'s doubt; if I have not believed, I lose everything owed".', rationale: "The Clerk staked belief on which outcome cost less, not on which was true, exactly as the Widow reckoned her own soul." },
            { name: 'The Cold Dread', example: '"The silence past the palisade has no bottom, and it frightens me into the pew".', rationale: 'Terror of the vast cold, not conviction, drove the Clerk to kneel.' },
            { name: 'The Two Roads', example: '"Either kneel at the rail or walk into the frost with nothing".', rationale: "The wager admits no third road, though the parish is full of them, same as the Widow's tale allows only ruin or belief." },
        ],
    },

    // Cell 23 — Faith / Neutral / Relational.
    {
        id: 'faith-mid-relational',
        epistemology: 'low',
        outlook: 'mid',
        scope: 'mid',
        label: 'Faith-Neutral-Relational',
        damnedExemplar: 'the Almoner of the Leper Yard, who fed the dying because the parish had always fed the dying, and caught their rot for her trouble.',
        cautionaryTale: { name: 'The Almoner Who Stayed', toldIn: 'recited at every almonry shift-change, first line only — the rest is understood' },
        besettingSins: [
            { name: 'The Old Custom', example: '"The parish has always fed the dying at the yard gate, so it must be fed there still".', rationale: 'The Almoner justified her service by what was always done, not by what was owed.' },
            { name: 'The Shared Wound', example: '"The dying suffer, and suffering beside them is the only true communion".', rationale: 'Feeling their pain stood in for any rite that would have named the duty.' },
            { name: 'The Only Faithful', example: '"No true almoner turns from the leper yard".', rationale: 'The tale narrows true service until only the Almoner Who Stayed still fits inside it.' },
        ],
    },

    // Cell 24 — Faith / Neutral / Transcendent.
    {
        id: 'faith-mid-transcendent',
        epistemology: 'low',
        outlook: 'mid',
        scope: 'high',
        label: 'Faith-Neutral-Transcendent',
        damnedExemplar: 'the Confessor of the Drowned Choir, who prayed into the dark for forty years and called the silence an answer, since no other came.',
        cautionaryTale: { name: 'The Listening Confessor', toldIn: 'murmured by novices who keep vigil past matins, never finished before the dawn bell' },
        besettingSins: [
            { name: 'The Unasked Question', example: '"The bell does not explain why it tolls, and I have stopped asking".', rationale: 'The Confessor answered every silence with the claim that answers were not owed to him.' },
            { name: 'The Shifting Sign', example: '"His absence is itself a kind of nearness, if you listen differently".', rationale: "When no sign came, the Confessor redefined what counted as a sign, as the Listening Confessor's tale keeps redefining what silence means." },
            { name: 'The Held Contradiction', example: '"He is with me and he has abandoned me, and both are true in the same breath".', rationale: 'The Confessor kept two opposite claims in one mouth and called it faith rather than error.' },
        ],
    },

    // Cell 25 — Faith / Pessimistic / Individual.
    {
        id: 'faith-pessimistic-individual',
        epistemology: 'low',
        outlook: 'low',
        scope: 'low',
        label: 'Faith-Pessimistic-Individual',
        damnedExemplar: 'the Hermit of the Gallows Road, who held that the more monstrous the doctrine, the truer it must be, and starved rather than let reason soften it.',
        cautionaryTale: { name: 'The Boy Who Counted the Dead Children', toldIn: 'not sung, only muttered, and never past the second verse' },
        besettingSins: [
            { name: 'The Monstrous Proof', example: '"It cannot be believed, and so I believe it utterly".', rationale: "The Hermit took the doctrine's horror as its credential rather than its indictment." },
            { name: 'The Poisoned Question', example: '"If the dead saints are just, why do the children still starve at the gate?".', rationale: "The Boy's question already grants the saints' justice in order to condemn it, the same trap the Hermit set for the parish." },
            { name: 'The Two Verdicts', example: '"Either the ledger is cruel, or there is no ledger at all".', rationale: 'The tale refuses any account where the ledger is merely indifferent, forcing cruelty or nothing.' },
        ],
    },

    // Cell 26 — Faith / Pessimistic / Relational.
    {
        id: 'faith-pessimistic-relational',
        epistemology: 'low',
        outlook: 'low',
        scope: 'mid',
        label: 'Faith-Pessimistic-Relational',
        damnedExemplar: 'the Sexton of the Drowned Parish, who taught that the last saint died to make the world at all, and that the world has been dying of that birth ever since.',
        cautionaryTale: { name: 'The Confessor Who Signed the Book', toldIn: 'kept out of the psalter entirely, passed mouth to mouth among the almoners' },
        besettingSins: [
            { name: 'The Dead Root', example: '"The saint died to birth this world, so the world is nothing but a dying thing".', rationale: "The Sexton judged the whole world's nature by the manner of its making, not by what it has since become." },
            { name: 'The Weight of Their Tears', example: '"I signed the book because I could not bear their screaming any longer".', rationale: 'The Confessor let the sight of suffering, not any rite of conscience, decide the matter.' },
            { name: 'The Two Loves', example: '"Either keep faith and watch them boil, or break faith and let them live".', rationale: 'The tale allows no third mercy between apostasy and the pyre, the same narrow choice the Sexton preached.' },
        ],
    },

    // Cell 27 — Faith / Pessimistic / Transcendent.
    {
        id: 'faith-pessimistic-transcendent',
        epistemology: 'low',
        outlook: 'low',
        scope: 'high',
        label: 'Faith-Pessimistic-Transcendent',
        damnedExemplar: 'the Anchorite of the Salt Crypt, who preached that the thing which made this cold world could not be the same thing owed the tithe, and was bricked into the crypt for the heresy of it.',
        cautionaryTale: { name: 'The Assessor Who Judged the Almoner', toldIn: 'read once a year at the winter assize, and struck from the record after' },
        besettingSins: [
            { name: 'The Truer Maker', example: '"The one owed the tithe would not have made a world this cruel, so some lesser hand must have made it instead".', rationale: 'The Anchorite preserved a good power behind the tithe by inventing a crueler one to blame for the making.' },
            { name: 'The Split Verdict', example: '"Either the maker is good and made no cold, or the maker made the cold and is no good at all".', rationale: 'The tale admits no maker who is merely careless, only saint or monster.' },
            { name: 'The Cost of Freedom', example: '"Left free, they starved and froze, so freedom itself was the wrong gift".', rationale: "The Assessor judged the almoner's mercy by its bitter harvest, not by whether mercy was owed." },
        ],
    },
]);
