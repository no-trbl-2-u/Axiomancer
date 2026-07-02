/**
 * Hazard-Pattern Combat — AUTHORED THREAT SEQUENCES (the learnable enemy patterns).
 *
 * GENERATED CONTENT. One entry per enemy: a deterministic, fully-revealed-up-front
 * sequence of phases the player learns and out-plays. Each phase declares its
 * hidden STANCE (the RPS read), a thematic `stanceHint` that implies but never
 * names that stance, RELATIVE dot/control factors (which track the enemy is weak
 * to — both win paths stay live across the roster), a telegraphed threat action
 * (`actionText` + optional debuff), and a `damageWeight`. The resolver in
 * `combat.threat.ts` computes the concrete thresholds + threat damage from level +
 * difficulty, so the whole roster retunes from a few constants.
 *
 * Authoring convention & catalog: see the `/combat-tuning` workflow. Edits here
 * are pure content (cards/mechanics scope).
 */

import type { AuthoredThreatPhase } from './combat.threat';

export const AUTHORED_THREAT_SEQUENCES: Record<string, AuthoredThreatPhase[]> = {
    // Befriendable fallen-faith — heart-dominant grief over discarded faith.
    'enemy-apostate-abbot': [
        { enemyStance: 'heart', actionText: "The Abbot recites a prayer he no longer believes and the empty words still wound", stanceHint: "He performs the old devotion with hollow eyes, grieving what he threw away." },
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_confusion', threatIntensity: 2, actionText: "The Abbot poses a doubt so heavy your own faith staggers under it", stanceHint: "He weighs each heresy precisely, having learned the robes outweigh the god." },
        { enemyStance: 'heart', damageWeight: 1.1, threatEffectId: 'debuff_vulnerability_heart', threatIntensity: 2, actionText: "The Abbot turns his abandoned devotion outward as raw, accusing sorrow", stanceHint: "All the love he can no longer give upward, he hurls at you instead." },
        { enemyStance: 'heart', damageWeight: 1.35, threatEffectId: 'debuff_fear', threatIntensity: 3, actionText: "The Abbot lets the weight of the robes settle fully and despair pours off him onto you", stanceHint: "He stops pretending — there is no god, only the crushing garment of what he was — and the horror of it is contagious." },
    ],
    // Zealous doubter — mind-resistant and dot-tough; control cracks his recited certainty.
    'enemy-apprentice-heretic': [
        { enemyStance: 'heart', damageWeight: 0.9, actionText: "The Heretic flings a scripture back in your teeth like a curse", stanceHint: "He weeps as he condemns you; the excommunication still burns in his chest." },
        { enemyStance: 'mind', threatEffectId: 'debuff_silence', actionText: "The Heretic names your sins in cold order", stanceHint: "He has rehearsed every rebuttal; he answers before you finish speaking." },
        { enemyStance: 'heart', damageWeight: 1.3, threatEffectId: 'debuff_fear', threatIntensity: 2, actionText: "The Heretic makes his final, fevered profession of faith", stanceHint: "Twice as certain because he is twice as afraid; the fervor pours out of him." },
    ],
    // A pedant who debates you to death — mind-resistant sophist, weak to slow erosion that won't argue back.
    'enemy-argumentative-crow': [
        { enemyStance: 'mind', damageWeight: 0.85, actionText: "The Crow caws a syllogism that closes like a snare around your throat", stanceHint: "It tilts its head, weighing your every word for the flaw it already knows is there." },
        { enemyStance: 'heart', threatEffectId: 'debuff_confusion', actionText: "The Crow shrieks a contradiction that splits your reasoning in two", stanceHint: "Losing the thread, it screeches with the wounded pride of one who has never been wrong." },
        { enemyStance: 'mind', damageWeight: 1.3, actionText: "The Crow delivers its final premise: that you were always going to lose", stanceHint: "Calm again, it lands its conclusion with the cold finality of a proof completed." },
    ],
    // Methodical scrutiny — befriendable, so Control-weak; resists erosion as it tallies.
    'enemy-audit-sentinel': [
        { enemyStance: 'mind', damageWeight: 0.85, actionText: "The Sentinel marks a fresh tally against your name", stanceHint: "It never raises its voice; it simply notes the discrepancy and waits." },
        { enemyStance: 'heart', threatEffectId: 'debuff_accuracy_down', actionText: "The Sentinel recites your every misstep until your hand falters", stanceHint: "There is something almost pleading in how badly it wants the columns to balance." },
        { enemyStance: 'mind', damageWeight: 1.25, threatEffectId: 'debuff_curse', threatIntensity: 2, actionText: "The Sentinel renders its final verdict on the ledger of you", stanceHint: "Every error reconciled, it closes the book with the patience of arithmetic." },
    ],
    // Befriendable unmaker of first principles (unique, mind-dom) — Control-weak (it can be given a new axiom to hold); erosion-resistant, flips DoT-soft only at the climax.
    'enemy-axiom-breaker': [
        { enemyStance: 'mind', damageWeight: 0.9, threatEffectId: 'debuff_vulnerability_mind', threatIntensity: 2, actionText: "The Axiom-Breaker quietly revokes the rule that kept you standing", stanceHint: "It does not dispute your ground; it simply notes, almost kindly, that it is gone." },
        { enemyStance: 'body', actionText: "The Axiom-Breaker lets gravity that no longer agrees to spare you take hold", stanceHint: "Having unmade the rule, it leans the raw consequence onto you with bare force." },
        { enemyStance: 'heart', damageWeight: 0.95, threatEffectId: 'debuff_confusion', threatIntensity: 2, actionText: "The Axiom-Breaker makes the thing you most believe stop being true", stanceHint: "For a moment it looks almost sorry to take the one belief you could not live without." },
        { enemyStance: 'mind', damageWeight: 1.4, threatEffectId: 'debuff_curse', threatIntensity: 3, actionText: "The Axiom-Breaker unwrites the premise that you exist at all", stanceHint: "It reaches the last axiom and, cold and exact, simply declares it false." },
    ],
    // Heart-dominant arbiter, NOT befriendable — dot-weak instead; control-resistant scales.
    'enemy-balance-judge': [
        { enemyStance: 'body', actionText: "The Judge brings the heavier scale crashing down", stanceHint: "It hears no argument; it only lets the weight fall where weight must fall." },
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_vulnerability_heart', threatIntensity: 2, actionText: "The Judge measures your conviction and finds it wanting", stanceHint: "Cold and exact, it weighs reason against unreason on a fulcrum of pure indifference." },
        { enemyStance: 'heart', damageWeight: 1.2, threatEffectId: 'debuff_petrify', threatIntensity: 2, actionText: "The Judge pronounces sentence, and the verdict settles into your bones", stanceHint: "At the last its impartiality burns like wrath — final, absolute, and personally aggrieved." },
    ],
    // A young marsh-light still learning to lure — mind-resistant, dot-weak, with an innocent flicker that resists control.
    'enemy-bog-will-stripling': [
        { enemyStance: 'mind', damageWeight: 0.85, actionText: "The Stripling bobs a false promise of dry ground just ahead", stanceHint: "It studies which way you lean, learning the shape of a trap it half-understands." },
        { enemyStance: 'heart', threatEffectId: 'debuff_slow', actionText: "The Stripling brightens, delighted, as the mud closes over your boots", stanceHint: "It glows with a child's guileless joy at a game it doesn't know is cruel." },
        { enemyStance: 'mind', damageWeight: 1.3, threatEffectId: 'debuff_lethe_fog', threatIntensity: 2, actionText: "The Stripling leads you, at last, to the deep water it was always pointing at", stanceHint: "Something colder wakes behind its light, and it begins, finally, to mean it." },
    ],
    // Befriendable forgotten guardian — Control-weak (it can be relieved of duty); body-dominant brute, dot-resistant ossified mass.
    'enemy-boneward-sentinel': [
        { enemyStance: 'body', actionText: "The Sentinel raises its ossified halberd to bar a passage it can no longer name", stanceHint: "It moves on rote — vast, certain, and asking nothing, because asking stopped centuries ago." },
        { enemyStance: 'mind', damageWeight: 0.9, threatEffectId: 'debuff_petrify', actionText: "The Sentinel measures your trespass against an oath it has half-forgotten", stanceHint: "Something old and procedural turns behind its sockets, checking you against a vanished list." },
        { enemyStance: 'heart', damageWeight: 1.25, actionText: "The Sentinel strikes with the grief of a guard who has outlived its purpose", stanceHint: "For one moment it remembers there was something it loved enough to guard, and mourns it." },
    ],
    // Vast cerebral structure — control-resistant + dot-weak (it cannot bleed); flips dot-open only when forced to answer itself; pure mind.
    'enemy-cathedral-of-doubt': [
        { enemyStance: 'mind', threatEffectId: 'debuff_confusion', threatIntensity: 2, actionText: "The Cathedral poses a question with no floor and you fall through it", stanceHint: "Every arch is an unanswered query; it reasons in vaults too high to see the top of." },
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_minotaur_maze', threatIntensity: 2, actionText: "The Cathedral leads you down a nave that only deepens the asking", stanceHint: "Its cold geometry is built to keep you wandering among its doubts forever." },
        { enemyStance: 'heart', damageWeight: 1.1, threatEffectId: 'debuff_fear', threatIntensity: 2, actionText: "The Cathedral lets its silence answer, and the vast indifference of it presses down", stanceHint: "Beneath all the questions there is a grief so wide it has gone quiet." },
        { enemyStance: 'mind', damageWeight: 1.4, threatEffectId: 'debuff_all_stats_down', threatIntensity: 3, actionText: "The Cathedral turns its ultimate question upon itself and the collapse of certainty buries you with it", stanceHint: "For one ruinous instant it must answer its own asking — and the whole structure trembles toward an answer it cannot survive." },
    ],
    // Befriendable grieving flame — Control-weak (grief reachable); burns with erosion resistance.
    'enemy-cindergeist-revenant': [
        { enemyStance: 'heart', threatEffectId: 'debuff_burn', threatIntensity: 2, actionText: "The Revenant flares, reaching for you as fuel", stanceHint: "It clings to you the way a dying fire clings to the last dry log — desperate, grieving." },
        { enemyStance: 'mind', damageWeight: 0.85, actionText: "The Revenant banks low, feeding on the air you breathe", stanceHint: "For a moment the grief cools into something calculating, hoarding its last embers." },
        { enemyStance: 'heart', damageWeight: 1.35, threatEffectId: 'debuff_tartarus_rot', threatIntensity: 2, actionText: "The Revenant pours out everything it has left in one consuming blaze", stanceHint: "It would rather burn you and itself to ash than be left cold and alone again." },
    ],
    // Befriendable fallen magistrate — Control-weak (his old reason can be reached); dot-resistant, and most cunning when cornered.
    'enemy-coastal-tyrant': [
        { enemyStance: 'mind', threatEffectId: 'debuff_root', actionText: "The Tyrant pronounces sentence and the tide answers", stanceHint: "He still speaks in the cadence of a court, weighing your crimes by old statute." },
        { enemyStance: 'heart', damageWeight: 0.85, threatEffectId: 'debuff_fear', actionText: "The Tyrant rages over a charter no one honors", stanceHint: "Beneath the crown of gull-feathers he is only a forgotten man, grieving his bay." },
        { enemyStance: 'body', damageWeight: 1.2, actionText: "The Tyrant brings down the blade older than the village", stanceHint: "Words spent, the magistrate becomes the storm, all weight and breaking surf." },
        { enemyStance: 'mind', damageWeight: 1.4, threatEffectId: 'debuff_curse', threatIntensity: 3, actionText: "The Tyrant makes one last cold, kingly verdict upon you", stanceHint: "Cornered, the old judge turns sly again, plotting the cruelest lawful ruin." },
    ],
    // Cerebral arguer — control-resistant + dot-weak early, flips to dot-vulnerable when its certainty finally cracks.
    'enemy-contrarian-revenant': [
        { enemyStance: 'mind', actionText: "The Revenant rebuts your position before you finish forming it", stanceHint: "Whatever you assert, it has already prepared the opposite, coolly, in advance." },
        { enemyStance: 'mind', damageWeight: 0.21, threatEffectId: 'debuff_silence', threatIntensity: 2, actionText: "The Revenant talks over you until your own argument dissolves", stanceHint: "It will not let a single one of your words stand uncontested." },
        { enemyStance: 'heart', damageWeight: 1.35, threatEffectId: 'debuff_hex', threatIntensity: 3, actionText: "The Revenant, finally cornered, refuses to die out of sheer spite and curses your certainty", stanceHint: "It would rather rot in place forever than grant you the last word." },
    ],
    // A wordless arguing tree — you cannot reason with timber.
    'enemy-disatree': [
        { enemyStance: 'body', actionText: "The Disatree swats you flat with a contradicting branch", stanceHint: "It does not debate so much as shove — every point it makes lands as a slab of trunk." },
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_root', actionText: "Roots erupt to pin you in place mid-sentence", stanceHint: "It chooses its angle of attack with the slow, patient geometry of a thing that has stood here for a century." },
        { enemyStance: 'body', damageWeight: 1.3, actionText: "The whole tree heaves over to bring its argument crashing down", stanceHint: "Out of patience, it stops gesturing and simply throws its entire weight at the matter." },
    ],
    // A mindless tide-carved shape — there is no one home to reason with.
    'enemy-driftwood-husk': [
        { enemyStance: 'body', actionText: "The husk lurches forward and clubs you with a barnacled limb", stanceHint: "It moves only when your gaze is on it, swinging with the dumb force of driftwood in a swell." },
        { enemyStance: 'mind', damageWeight: 0.8, threatEffectId: 'debuff_daze', actionText: "It freezes mid-motion, and the stillness rattles loose your senses", stanceHint: "It seems to wait and weigh, choosing the exact instant you blink to be somewhere new." },
        { enemyStance: 'body', damageWeight: 1.35, actionText: "The whole waterlogged frame topples onto you like a falling mast", stanceHint: "All pretense of stillness gone, it gives up everything to one final, crushing collapse." },
    ],
    // Recurring doubt-voice — Control-resistant + dot-weak (cut the loop with erosion); cold and mental, flips to heart at the end.
    'enemy-echo-of-pyrrhonia': [
        { enemyStance: 'mind', damageWeight: 0.9, threatEffectId: 'debuff_silence', actionText: "The Echo repeats your own first doubt back at you until it cannot be unheard", stanceHint: "It reasons in flawless circles, and the circle has no door because it built none." },
        { enemyStance: 'mind', damageWeight: 0.95, actionText: "The Echo asks the question beneath the question, and the floor of your certainty thins", stanceHint: "Every answer you offer it has already answered, colder and first." },
        { enemyStance: 'heart', damageWeight: 1.3, threatEffectId: 'debuff_fear', threatIntensity: 2, actionText: "The Echo finally speaks in YOUR voice, and means it", stanceHint: "At the last it stops arguing and simply despairs — the doubt was always a wound, not a proof." },
    ],
    // Unique frozen-season-will — Control-resistant + dot-weak; mind-led, eerie recurrence.
    'enemy-eternal-autumn': [
        { enemyStance: 'mind', damageWeight: 0.9, threatEffectId: 'debuff_frostbite', actionText: "Eternal Autumn lets the leaves fall upward around you, and the cold begins its slow accounting", stanceHint: "It schemes in cycles, arranging your ending the way it arranges every leaf — deliberately, again." },
        { enemyStance: 'heart', actionText: "Eternal Autumn presses the ache of every unfinished goodbye into your chest", stanceHint: "It is a season that could not bear to end — all its hunger is really longing." },
        { enemyStance: 'mind', damageWeight: 1.15, threatEffectId: 'debuff_sisyphean_weight', threatIntensity: 2, actionText: "Eternal Autumn begins the ending again, and again, and refuses to let it complete", stanceHint: "Coldly it resets the same dying moment, certain that this time it can hold the door shut." },
        { enemyStance: 'body', damageWeight: 1.35, actionText: "Eternal Autumn collapses a whole frozen season onto you at once", stanceHint: "All the patience drops away and it simply falls, heavy as a year of dead leaves." },
    ],
    // Starving brute mass — pure body.
    'enemy-famine-of-the-deep-wood': [
        { enemyStance: 'body', actionText: "The Famine drags you into bramble that will not green again", stanceHint: "It moves on nothing but appetite, all gaunt momentum and no thought at all." },
        { enemyStance: 'body', damageWeight: 0.85, threatEffectId: 'debuff_exhaustion', threatIntensity: 2, actionText: "The Famine drinks the warmth from your limbs and the wood forgets how to grow", stanceHint: "Where it leans, the very strength of things drains away into its hollow." },
        { enemyStance: 'mind', damageWeight: 1.1, actionText: "The Famine spreads thin and patient, a starving silence closing every path", stanceHint: "Hunger this old has a cold cunning to it, herding you toward the barren center." },
        { enemyStance: 'body', damageWeight: 1.4, threatEffectId: 'debuff_disease', threatIntensity: 3, actionText: "The Famine consumes everything that could grow back and the rot of barrenness sets into you", stanceHint: "It opens its whole starving weight upon you, taking the future along with the flesh." },
    ],
    // A flickering arguer that blinks out of reach — control-resistant, weak to erosion that catches it mid-fade.
    'enemy-forest-sprite': [
        { enemyStance: 'mind', damageWeight: 0.8, threatEffectId: 'debuff_blind', actionText: "The Sprite scatters into motes that needle at your eyes", stanceHint: "It debates with itself whether to be seen, and each answer changes where it stands." },
        { enemyStance: 'heart', actionText: "The Sprite flares with a spiteful little brightness", stanceHint: "Cornered, its tiny opinions curdle into a flare of pure pique." },
        { enemyStance: 'mind', damageWeight: 1.25, actionText: "The Sprite resolves its argument and lunges through the gap in your guard", stanceHint: "It has talked itself, at last, into being real enough to wound." },
    ],
    // A patient tracker who can be turned aside — Control/mercy reaches the person under the ice; body-strong, resists erosion early.
    'enemy-frostbound-hunter': [
        { enemyStance: 'body', threatEffectId: 'debuff_frostbite', actionText: "The Hunter closes the distance your warmth betrayed, blade rimed white", stanceHint: "Years of the hunt have made him pure muscle and silence, all forward pressure." },
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_slow', threatIntensity: 2, actionText: "The Hunter cuts off your retreat before you've thought to take it", stanceHint: "He reads your breath in the cold and plots its end with patient, ledger-cold care." },
        { enemyStance: 'heart', damageWeight: 1.2, actionText: "The Hunter strikes, and for a breath you see the man who would rather not", stanceHint: "Under the frost there is grief older than the cold; the patience was never really cruelty." },
        { enemyStance: 'body', damageWeight: 1.35, threatEffectId: 'debuff_frostbite', threatIntensity: 2, actionText: "The Hunter ends the chase the only way the cold has left him knowing", stanceHint: "Whatever he feels, the body remembers the hunt and finishes it without him." },
    ],
    // Cerebral oracle, NOT befriendable — control-resistant + dot-weak; the one timeline it can win.
    'enemy-glassmind-oracle': [
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_confusion', threatIntensity: 2, actionText: "The Oracle answers a move you have not yet made", stanceHint: "It looks past you to the ninety-nine deaths it already discarded, and chooses around them." },
        { enemyStance: 'heart', actionText: "The Oracle mourns your defeat before it happens", stanceHint: "A flicker of foreseen grief crosses it — it has already wept for you and moved on." },
        { enemyStance: 'mind', damageWeight: 1.3, threatEffectId: 'debuff_lethe_fog', threatIntensity: 3, actionText: "The Oracle steers you gently into the hundredth ending", stanceHint: "Every choice you think is yours, it laid down for you a hundred turns ago." },
    ],
    // Mourning custodian of dead arguments (elite, heart-dom) — DoT-weak (its grief takes erosion fast); Control-resistant.
    'enemy-graveward-keeper': [
        { enemyStance: 'heart', threatEffectId: 'debuff_fear', threatIntensity: 2, actionText: "The Keeper invites you to lie down among the unwon and rest", stanceHint: "Every word is soft with mourning for the cases that never got to finish." },
        { enemyStance: 'body', threatEffectId: 'debuff_root', threatIntensity: 2, actionText: "The Keeper heaps grave-soil over your feet to keep you in the rows", stanceHint: "It hauls the dirt with a sexton's tireless, grieving arms." },
        { enemyStance: 'heart', damageWeight: 1.3, threatEffectId: 'debuff_disease', threatIntensity: 3, actionText: "The Keeper closes your plot and pulls the quiet over you like a sheet", stanceHint: "It weeps as it finishes, because it truly would have preferred your company kept." },
    ],
    // Cerebral reaper of identity — control-resistant + dot-weak early; flips dot-vulnerable in the final cut when it overreaches.
    'enemy-harvest-of-names': [
        { enemyStance: 'mind', threatEffectId: 'debuff_confusion', threatIntensity: 2, actionText: "The Harvest takes the name you answer to and you turn, uncertain, toward nothing", stanceHint: "It collects each title with the patient precision of a clerk filing the dead." },
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_curse', threatIntensity: 2, actionText: "The Harvest reaps your titles one by one until you forget why you are fighting", stanceHint: "It weighs who you were against who you are, cold and unhurried, and finds the seam between." },
        { enemyStance: 'heart', damageWeight: 1.1, actionText: "The Harvest holds up a name you loved and lets you watch it wither", stanceHint: "For the first time it lingers, savoring the grief of a name well-stolen." },
        { enemyStance: 'mind', damageWeight: 1.4, threatEffectId: 'debuff_lethe_fog', threatIntensity: 3, actionText: "The Harvest reaches for your last name, your own, and the world dims as it almost takes too much", stanceHint: "Greedy now, it overreaches — and in grasping everything, it leaves itself open." },
    ],
    // A grieving soul who can be reached — Control/mercy is the win path; resists erosion behind their need.
    'enemy-hollow-eyed-beggar': [
        { enemyStance: 'heart', damageWeight: 0.85, actionText: "The Beggar clutches at your pack with trembling, desperate hands", stanceHint: "Their eyes are wells gone dry; they reach not to harm but because they have nothing left." },
        { enemyStance: 'body', threatEffectId: 'debuff_fear', actionText: "The Beggar surges with the sudden strength of the truly cornered", stanceHint: "Hunger lends them a brute, animal momentum they did not ask for." },
        { enemyStance: 'heart', damageWeight: 1.3, actionText: "The Beggar lashes out, mourning even as they strike you", stanceHint: "Grief and want collapse into one motion; they weep through the blow." },
    ],
    // Befriendable martyr seeking a cause — Control-weak throughout; talk it down before its final martyrdom.
    'enemy-hollow-saint': [
        { enemyStance: 'heart', damageWeight: 0.85, threatEffectId: 'debuff_charm', actionText: "The Saint offers you its wound to hold", stanceHint: "It reaches for you with open, sorrowing hands, longing to be needed." },
        { enemyStance: 'heart', actionText: "The Saint mirrors your own grief back at you", stanceHint: "Whatever pain you carry, it carries it too, and grieves louder." },
        { enemyStance: 'heart', damageWeight: 1.35, threatEffectId: 'debuff_curse', threatIntensity: 2, actionText: "The Saint embraces martyrdom and drags you toward it", stanceHint: "Finding no cause, it makes one of its own ending, and would take you along." },
    ],
    // Befriendable silence — control-weak (answer it), but cerebral and dot-resistant; mind-stance trap.
    'enemy-hush-wraith': [
        { enemyStance: 'mind', damageWeight: 0.21, threatEffectId: 'debuff_silence', actionText: "The Wraith lets the quiet press against your throat", stanceHint: "It waits with the patience of a held breath, weighing whether you will speak." },
        { enemyStance: 'mind', threatEffectId: 'debuff_confusion', threatIntensity: 2, actionText: "The Wraith returns your own unanswered question", stanceHint: "It listens past your words, cataloguing each thing you cannot prove." },
        { enemyStance: 'heart', damageWeight: 1.25, actionText: "The Wraith fills the silence with everything you feared was there", stanceHint: "Cornered, the cold listener finally lets its own old grief show through." },
    ],
    // Body-sworn zealot, NOT befriendable — dot-weak (flesh long forsaken); control-resistant oath.
    'enemy-iron-covenanter': [
        { enemyStance: 'body', actionText: "The Covenanter advances a step its dead cause demands", stanceHint: "It moves on rote and sinew alone; whatever it once felt was buried with the oath's last witness." },
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_root', threatIntensity: 2, actionText: "The Covenanter binds you to the same ground it cannot leave", stanceHint: "There is a grim arithmetic to its guard, every angle held by a creed memorized past meaning." },
        { enemyStance: 'body', damageWeight: 1.35, threatEffectId: 'debuff_sisyphean_weight', threatIntensity: 3, actionText: "The Covenanter spends the last of a body kept upright by vow alone", stanceHint: "The cause is dust and it knows it; still the muscle answers the oath, again, and again." },
    ],
    // A grief-song made flesh — wordless lull; control effects wear it out on the heart phase.
    'enemy-lullaby-moth': [
        { enemyStance: 'heart', damageWeight: 0.8, threatEffectId: 'debuff_sleep', actionText: "The moth's hum drags your eyelids toward a soft, fatal dark", stanceHint: "Its song is all longing — a lullaby for someone it lost long before you arrived." },
        { enemyStance: 'body', damageWeight: 1.25, actionText: "Wings the size of sails buffet you awake with a thunderclap", stanceHint: "When the song fails it simply beats at you, frantic and graceless as a thing twice its size." },
    ],
    // Drowning majority — dot-weak (rotting mass) yet control-resistant (no single mind to seize); body brute.
    'enemy-mire-of-consensus': [
        { enemyStance: 'body', actionText: "The Mire heaves upward, a wave of agreed-upon muck closing over your knees", stanceHint: "It does not argue; it simply leans its whole sodden weight against you." },
        { enemyStance: 'mind', damageWeight: 0.8, threatEffectId: 'debuff_slow', threatIntensity: 2, actionText: "The Mire votes you down, every voice in the slime saying the same dull yes", stanceHint: "A thousand half-thoughts pool into one sluggish, unanimous calculation." },
        { enemyStance: 'body', damageWeight: 1.3, threatEffectId: 'debuff_sisyphean_weight', threatIntensity: 2, actionText: "The Mire pulls down by sheer carried-along mass, the consensus of the drowned", stanceHint: "To sink is the only motion it knows, and it shares that motion freely." },
    ],
    // Befriendable fog — cerebral: dot-weak, control-resistant; flips to control-weak when pinned.
    'enemy-mistwalker-shade': [
        { enemyStance: 'mind', damageWeight: 0.9, threatEffectId: 'debuff_blind', actionText: "The Shade drifts where your eyes are not", stanceHint: "It is never quite where you last fixed it, sliding between your certainties." },
        { enemyStance: 'mind', threatEffectId: 'debuff_lethe_fog', threatIntensity: 2, actionText: "The Shade blurs the ground between you and itself", stanceHint: "It thinks three moves ahead through the mist, untouched and unhurried." },
        { enemyStance: 'heart', damageWeight: 1.3, actionText: "The Shade condenses into one grieving, solid shape", stanceHint: "Pinned at last, the fog remembers a face it loved and wavers." },
    ],
    // Befriendable grief made loud — the Control/mercy path reaches it ; its raw sorrow resists erosion (.
    'enemy-mournful-gull': [
        { enemyStance: 'heart', damageWeight: 0.85, threatEffectId: 'debuff_fear', actionText: "The gull shrieks its whole ledger of wrongs into your skull", stanceHint: "Every cry is the name of someone who hurt it, screamed until the air itself aches." },
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_accuracy_down', actionText: "It dives in a tight, calculated arc to rake at your eyes", stanceHint: "Between sobs it picks its moment, wheeling with the practiced timing of a creature that has done this a thousand times." },
        { enemyStance: 'heart', damageWeight: 1.3, actionText: "The gull stoops in a final, grief-mad plunge straight at you", stanceHint: "Past reason, it throws itself at you the way the bereaved throw themselves at the sea." },
    ],
    // Befriendable dream — cerebral: dot-weak, control-resistant early; wake it and it grows control-weak and afraid.
    'enemy-nightmare-stag': [
        { enemyStance: 'mind', damageWeight: 0.9, threatEffectId: 'debuff_fear', actionText: "The Stag lowers crystalline antlers and your thoughts go cold", stanceHint: "It circles just out of waking, reading the shape of what you dread." },
        { enemyStance: 'body', damageWeight: 1.1, threatEffectId: 'debuff_frostbite', threatIntensity: 2, actionText: "The Stag charges, antlers cutting waking thought from sleep", stanceHint: "It runs with the unstoppable momentum of a dream you cannot leave." },
        { enemyStance: 'heart', actionText: "The Stag falters, the dream remembering it was only ever frightened", stanceHint: "Driven toward waking, the great beast trembles like the child who first dreamed it." },
        { enemyStance: 'mind', damageWeight: 1.4, threatEffectId: 'debuff_confusion', threatIntensity: 3, actionText: "The Stag makes one last desperate flight through your sleeping mind", stanceHint: "Terrified of ending, it schemes a final maze to keep itself dreamt." },
    ],
    // Befriendable grieving construct — split weakness: Control-reachable grief, body brutality dot-weak.
    'enemy-obsidian-colossus': [
        { enemyStance: 'body', damageWeight: 1.1, actionText: "The Colossus sweeps an arm and the air itself is cut open", stanceHint: "Each motion is ponderous, unstoppable, the momentum of a mountain deciding to move." },
        { enemyStance: 'heart', damageWeight: 0.85, threatEffectId: 'debuff_fear', threatIntensity: 2, actionText: "The Colossus keens, a grief that shakes the cavern", stanceHint: "Within the volcanic glass an old sorrow stirs; for a moment it forgets to be a weapon." },
        { enemyStance: 'body', damageWeight: 1.35, threatEffectId: 'debuff_knockdown', threatIntensity: 2, actionText: "The Colossus brings its full ancient weight down upon you", stanceHint: "Grief hardens back into stone, and the stone falls with the whole of its sorrow behind it." },
    ],
    // A grief-mad predator leading dead packmates — mindless erosion-weak, resists control behind its howling ghosts.
    'enemy-packleader-wolf': [
        { enemyStance: 'body', actionText: "The Wolf drives at you with the weight of a charge that has no doubt in it", stanceHint: "It moves as muscle and instinct, all forward, never once weighing the risk." },
        { enemyStance: 'heart', damageWeight: 0.9, threatEffectId: 'debuff_fear', actionText: "The Wolf throws back its head and howls for a pack that answers only in echoes", stanceHint: "Its grief is louder than its hunger; it calls names the dead can no longer wear." },
        { enemyStance: 'body', damageWeight: 1.35, actionText: "The Wolf hurls itself into a final lunge, ghosts running at its flanks", stanceHint: "Pure momentum now, it spends its whole body in one last unthinking leap." },
    ],
    // Slow funeral-bearer of dead theories (elite, body-dom) — DoT-weak (the weight rots fast); heavily Control-resistant, never sets the box down.
    'enemy-pallbearer-of-reason': [
        { enemyStance: 'body', threatEffectId: 'debuff_slow', threatIntensity: 2, actionText: "The Pallbearer steps forward and the coffin's shadow buries your tempo", stanceHint: "It moves at one pace only, and the floor groans beneath the box it will not lower." },
        { enemyStance: 'body', damageWeight: 1.1, threatEffectId: 'debuff_sisyphean_weight', threatIntensity: 2, actionText: "The Pallbearer shifts the casket onto your shoulders to share the load", stanceHint: "Its arms are dead-locked around the dead, and nothing you say loosens that grip." },
        { enemyStance: 'mind', damageWeight: 1.35, threatEffectId: 'debuff_exhaustion', threatIntensity: 3, actionText: "The Pallbearer lays the overreaching coffin to rest, and means it for you", stanceHint: "At the graveside it measures the plot with a slow, deliberate, final care." },
    ],
    // Heart-zealot, NOT befriendable — dot-weak (it welcomes wounds); control-resistant fervor.
    'enemy-penitent-flagellant': [
        { enemyStance: 'heart', threatEffectId: 'debuff_bleed', threatIntensity: 2, actionText: "The Flagellant scourges itself and turns the lash on you", stanceHint: "Each cut it takes lights its face with terrible joy; it counts your blood as a gift shared." },
        { enemyStance: 'body', damageWeight: 0.85, actionText: "The Flagellant drags you closer to share its penance", stanceHint: "It throws its whole flagellated body forward, heedless, ecstatic with pain." },
        { enemyStance: 'heart', damageWeight: 1.35, threatEffectId: 'debuff_hex', threatIntensity: 3, actionText: "The Flagellant anoints you in its bounty of suffering", stanceHint: "In its eyes your agony is grace; it offers it to you with the fervor of a saint." },
    ],
    // A glib thief who out-talks consequence — mind-resistant, weak to control that pins him and erosion that outlasts his patter.
    'enemy-petty-cutpurse': [
        { enemyStance: 'mind', damageWeight: 0.85, actionText: "The Cutpurse feints a deal and slips a blade where your coin-hand was", stanceHint: "He's already three steps into a plan, counting your purse before he's touched it." },
        { enemyStance: 'body', threatEffectId: 'debuff_bleed', actionText: "The Cutpurse opens a quick, shallow line and dances back grinning", stanceHint: "Talk done, he lets a fast wrist do the arguing for him." },
        { enemyStance: 'mind', damageWeight: 1.3, actionText: "The Cutpurse explains, mid-stab, exactly why this was inevitable", stanceHint: "He closes the deal with cold arithmetic: your loss was only ever a matter of when." },
    ],
    // Cold litigator of unreality (elite, mind-dom) — Control-resistant + DoT-weak; ruled by evidence, undone by erosion.
    'enemy-prosecutor-of-the-real': [
        { enemyStance: 'mind', damageWeight: 0.21, threatEffectId: 'debuff_silence', threatIntensity: 2, actionText: "The Prosecutor strikes your testimony from the record mid-breath", stanceHint: "It needs no anger; the exhibits are damning enough on their own." },
        { enemyStance: 'mind', threatEffectId: 'debuff_vulnerability_mind', threatIntensity: 2, actionText: "The Prosecutor admits the proof that you were never real to begin with", stanceHint: "Each question is laid like a trap that has already sprung." },
        { enemyStance: 'body', damageWeight: 1.35, threatEffectId: 'debuff_hex', threatIntensity: 3, actionText: "The Prosecutor rests its case, and the verdict erases your defense", stanceHint: "The argument finished, it closes the folder and lets the conclusion fall like a gavel-blow." },
    ],
    // Mindless agreeing swarm — dot-weak (erode the mass), high control-resistance; one stubborn will.
    'enemy-reef-barnacle-colony': [
        { enemyStance: 'heart', damageWeight: 0.9, threatEffectId: 'debuff_root', actionText: "The Colony reaches as one to hold you in place", stanceHint: "A thousand small wills lean toward you with the slow yearning of the tide." },
        { enemyStance: 'body', threatEffectId: 'debuff_poison', threatIntensity: 2, actionText: "The Colony grinds shut around your limbs", stanceHint: "It closes by sheer accreting mass, mindless and crushing as stone." },
        { enemyStance: 'heart', damageWeight: 1.3, actionText: "The Colony agrees, finally, that you should never leave", stanceHint: "Every small mind settles on one shared longing: keep you, keep you, keep you." },
    ],
    // Befriendable starving hunter — Control-weak from need, body-driven; circles before it commits.
    'enemy-rimeclaw-prowler': [
        { enemyStance: 'mind', damageWeight: 0.8, actionText: "The Prowler circles wide, cutting off your retreat", stanceHint: "It does not lunge; it studies the angles of your stance with cold, hungry patience." },
        { enemyStance: 'body', damageWeight: 1.1, threatEffectId: 'debuff_bleed', threatIntensity: 2, actionText: "The Prowler commits, rime-sheathed claws raking deep", stanceHint: "All the waiting collapses into one explosion of starving muscle." },
        { enemyStance: 'heart', damageWeight: 1.25, threatEffectId: 'debuff_frostbite', threatIntensity: 2, actionText: "The Prowler drives in with the desperation of a long winter", stanceHint: "Cornered between hunger and you, something almost mournful enters its eyes." },
    ],
    // Mindless gnawing vermin — it cannot be talked to.
    'enemy-salt-gnaw-rat': [
        { enemyStance: 'body', threatEffectId: 'debuff_bleed', actionText: "The rat sinks brine-yellow teeth into your calf and tears", stanceHint: "It does not hesitate or aim — it simply bites whatever certainty is nearest, the way it bites everything." },
        { enemyStance: 'body', damageWeight: 1.2, actionText: "It swarms up your leg in a frenzy of gnashing", stanceHint: "Cornered, it becomes pure hunger and momentum, throwing its scrabbling body at you again and again." },
    ],
    // A confused drifting thought — it wants to speak, so the mercy/Control path reaches it ; its cunning fog resists erosion (.
    'enemy-sea-mist-wisp': [
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_confusion', actionText: "The wisp scatters your thoughts like droplets on glass", stanceHint: "It circles your reasoning, testing each premise for the seam it can slip through." },
        { enemyStance: 'mind', damageWeight: 1.1, threatEffectId: 'debuff_blind', actionText: "It thickens into a blank white veil over your eyes", stanceHint: "Denied its exit, it grows clever and cold, folding the fog into shapes meant to mislead." },
    ],
    // Unique pre-thought wildness — dot-weak (raw flesh-memory bleeds); control-resistant, wordless body-brute, no philosophy to grip.
    'enemy-shadow-of-the-first': [
        { enemyStance: 'body', actionText: "The Shadow lunges with the forest's first, unthinking hunger", stanceHint: "There is nothing to reason with — only appetite, older than the first spoken word." },
        { enemyStance: 'body', damageWeight: 1.1, threatEffectId: 'debuff_fear', threatIntensity: 2, actionText: "The Shadow shows you the wood as it was before names, and the wrongness of it stops your breath", stanceHint: "It does not threaten; it simply IS the dark, and the dark never learned to bargain." },
        { enemyStance: 'heart', damageWeight: 1.35, threatEffectId: 'debuff_bleed', threatIntensity: 2, actionText: "The Shadow falls on you with the pure, uncomplicated fury of something never tamed", stanceHint: "At the end it is all raw feeling — rage with no thought in it, and no mercy either." },
    ],
    // Befriendable argument-made-flesh — Control-weak (it WANTS to be resolved); resists erosion, opens cold and mental.
    'enemy-the-disagreement': [
        { enemyStance: 'mind', damageWeight: 0.85, actionText: "The Disagreement raises a thorned counterpoint, pinning the flaw in your reasoning", stanceHint: "It has anticipated this; every barb is placed where you were already weakest." },
        { enemyStance: 'heart', damageWeight: 0.85, threatEffectId: 'debuff_confusion', actionText: "The Disagreement contradicts itself on purpose, and the contradiction wounds you", stanceHint: "There is real hurt under the bramble — it argues the way the grieving argue, to keep from stopping." },
        { enemyStance: 'mind', damageWeight: 1.3, actionText: "The Disagreement delivers its rehearsed final clause, the one it knew would land", stanceHint: "It speaks the conclusion it prepared before you ever arrived, certain and cold." },
    ],
    // Befriendable thousand-year arboreal intellect — Control-weak (it can be spoken with); patient, mind-led, dot-resistant.
    'enemy-the-forest-mind': [
        { enemyStance: 'mind', damageWeight: 0.9, actionText: "The Forest Mind tightens a slow lattice of roots around your footing", stanceHint: "It answers in growth rings — no hurry, having thought this through across a hundred winters." },
        { enemyStance: 'body', threatEffectId: 'debuff_root', threatIntensity: 2, actionText: "The Forest Mind heaves the living wood upward to seize you", stanceHint: "For one season it forgets thought entirely and simply pushes, vast and unstoppable as a thaw." },
        { enemyStance: 'heart', damageWeight: 1.2, threatEffectId: 'debuff_sleep', threatIntensity: 2, actionText: "The Forest Mind sings the long green lullaby of every autumn it has outlived", stanceHint: "Beneath the calculus is grief — a thousand years of letting things fall, and the ache of it shows." },
    ],
    // The impossible playtest ceiling (unique, level 55) — the skill-ceiling
    // benchmark: calibrated so the BEST policy line scrapes a 1-5% win rate
    // (near-impossible, not scripted-unwinnable). Erosion-stubborn AND
    // control-shrugging: almost nothing you bring is complete enough to hold it.
    // PLAYTEST-CALIBRATION — weights 0.21 / 0.232 / 0.271 / 0.326, phase-3 self-knit (8).
    // The L55 unique threat budget is enormous, so these look tiny: at x1.7 fire
    // scale and the boss escalation clock they still land ~60-180 HP per phase.
    // Empirically (200 seeds, seed 1): greedy/blind 1.5%, every other scripted
    // policy 0%. The Incompleteness does not hit hard — it simply cannot be
    // finished (1375 HP; most losses are the round cap, which is the theme).
    'enemy-the-incompleteness': [
        { enemyStance: 'mind', damageWeight: 0.21, threatEffectId: 'debuff_silence', threatIntensity: 2, actionText: "The Incompleteness states a truth your system cannot express, and your reply dies unprovable", stanceHint: "It begins from outside every axiom you brought; you cannot see the floor it stands on." },
        { enemyStance: 'heart', damageWeight: 0.232, threatEffectId: 'debuff_fear', threatIntensity: 2, actionText: "The Incompleteness shows you the true sentence about yourself that you will never be able to prove", stanceHint: "For a moment it grieves for you, the way one grieves for a house that believes it is finished." },
        { enemyStance: 'mind', damageWeight: 0.271, threatEffectId: 'debuff_lethe_fog', threatIntensity: 3, enemyHeal: 8, actionText: "The Incompleteness incorporates your strongest argument as a new axiom and grows truer", stanceHint: "Whatever you add to it, it contains; whatever wounds it becomes another thing it survives." },
        { enemyStance: 'mind', damageWeight: 0.326, threatEffectId: 'debuff_all_stats_down', threatIntensity: 3, isFinalPhase: true, actionText: "The Incompleteness proves, within you, the statement that you cannot go on — and you cannot refute it", stanceHint: "There is no triumph in it; the proof was never finishable, it only needed you to stop." },
    ],
    // Befriendable peace-by-force (boss, even stats) — Control-weak (it can still be talked out of agreement); erosion-stubborn.
    'enemy-the-last-consensus': [
        { enemyStance: 'body', actionText: "The Consensus moves to make you agree, and reaches for your hands", stanceHint: "It does not raise its voice; it raises its whole settled weight against you." },
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_charm', threatIntensity: 2, actionText: "The Consensus shows you how much simpler it is to concede", stanceHint: "It has resolved a million quarrels and remembers the precise wording that ends each one." },
        { enemyStance: 'heart', damageWeight: 0.9, threatEffectId: 'debuff_fear', threatIntensity: 2, actionText: "The Consensus mourns, gently, the last voice that ever said no", stanceHint: "There is real sorrow in it for everyone it had to convince by force." },
        { enemyStance: 'body', damageWeight: 1.4, threatEffectId: 'debuff_petrify', threatIntensity: 3, actionText: "The Consensus settles the question of you, permanently and as one", stanceHint: "All argument spent, it bears down with the unanimous force of everything already decided." },
    ],
    // Befriendable philosopher-king — cold logic that can be talked level.
    'enemy-the-market-arbiter': [
        { enemyStance: 'mind', damageWeight: 0.85, actionText: "The Arbiter quotes you a price you cannot pay", stanceHint: "He weighs your worth against the room and finds an exact, bloodless figure." },
        { enemyStance: 'body', actionText: "The Arbiter calls in every debt at once, and the village leans on you", stanceHint: "When ledgers fail he simply leans his whole considerable weight upon the scale." },
        { enemyStance: 'heart', damageWeight: 0.85, threatEffectId: 'debuff_charm', actionText: "The Arbiter offers terms so reasonable you nearly thank him", stanceHint: "He genuinely believes a fair bargain can end any quarrel, and it wounds him when it can't." },
        { enemyStance: 'mind', damageWeight: 1.3, threatEffectId: 'debuff_sisyphean_weight', threatIntensity: 2, actionText: "The Arbiter collects on the whole quarrel in a single, ruinous sum", stanceHint: "The figures are tallied; now he is only the cold remainder doing the math." },
    ],
    // Befriendable sovereign of schism — Control-weak (reconcile it); mind-resistant and erosion-stubborn mid-fight.
    'enemy-the-schismarch': [
        { enemyStance: 'mind', damageWeight: 0.9, threatEffectId: 'debuff_confusion', threatIntensity: 2, actionText: "The Schismarch splits your conviction into two that despise each other", stanceHint: "It watches which half of you flinches, then speaks only to that one." },
        { enemyStance: 'body', actionText: "The Schismarch drives a wedge of pure division through your stance", stanceHint: "When persuasion stalls it simply shoves the two pieces apart by main strength." },
        { enemyStance: 'heart', damageWeight: 0.85, threatEffectId: 'debuff_charm', threatIntensity: 2, actionText: "The Schismarch offers to take your side, and means it, and lies", stanceHint: "It still mourns the first faith it ever broke, and breaks you the same tender way." },
        { enemyStance: 'mind', damageWeight: 1.35, threatEffectId: 'debuff_all_stats_down', threatIntensity: 3, actionText: "The Schismarch divides you from yourself and rules the remainder", stanceHint: "Cold now, it tallies the fractures it has opened and chooses the cleanest line to cut." },
    ],
    // Conversation-ending demonstration (unique, mind-dom) — Control-resistant + DoT-weak; the proof is rigid, erosion dissolves it.
    'enemy-the-terminal-proof': [
        { enemyStance: 'mind', damageWeight: 0.9, threatEffectId: 'debuff_silence', threatIntensity: 2, actionText: "The Terminal Proof states its first lemma and your reply will not form", stanceHint: "It begins without preamble, certain of every step before it is taken." },
        { enemyStance: 'mind', threatEffectId: 'debuff_petrify', threatIntensity: 2, actionText: "The Terminal Proof advances a step you cannot deny, and you stiffen around it", stanceHint: "Each line follows the last with the cold inevitability of a thing already settled." },
        { enemyStance: 'body', damageWeight: 1.1, threatEffectId: 'debuff_root', threatIntensity: 2, actionText: "The Terminal Proof drives its central inference clean through your footing", stanceHint: "The argument stops persuading and simply forces the conclusion into place." },
        { enemyStance: 'mind', damageWeight: 1.4, threatEffectId: 'debuff_tartarus_rot', threatIntensity: 3, actionText: "The Terminal Proof writes Q.E.D. and ends the things that were having the conversation", stanceHint: "It reaches the final line with no triumph at all — only the closing of a thing that cannot be reopened." },
    ],
    // Befriendable collector — body-led ledger that flips to heart.
    'enemy-the-tithewarden': [
        { enemyStance: 'body', actionText: "The Tithewarden seizes its tenth of your strength with a collector's heavy hand", stanceHint: "It takes what is owed the way a millstone takes grain — without malice, without mercy." },
        { enemyStance: 'body', damageWeight: 0.85, threatEffectId: 'debuff_wound', threatIntensity: 2, actionText: "The Tithewarden carves a tenth of your blood into its endless ledger", stanceHint: "Every wound is a line item; it weighs your bleeding against the column and finds it short." },
        { enemyStance: 'mind', damageWeight: 1.1, actionText: "The Tithewarden recalculates the debt and demands the difference at once", stanceHint: "It pauses to tally, cold and exact, certain the books can still be balanced." },
        { enemyStance: 'heart', damageWeight: 1.35, threatEffectId: 'debuff_sisyphean_weight', threatIntensity: 3, actionText: "The Tithewarden claims its tenth of your conviction and the ledger never balances", stanceHint: "At the last it weeps over the column that will not close, and lays its impossible debt on you." },
    ],
    // Cerebral deletion — control-resistant + dot-weak (no body to bleed); a void of logic that only buckles when it must delete itself.
    'enemy-the-unwriting': [
        { enemyStance: 'mind', threatEffectId: 'debuff_silence', threatIntensity: 2, actionText: "The Unwriting removes the word you were about to say", stanceHint: "It studies your sentence for the one joint that holds it, and deletes precisely that." },
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_lethe_fog', threatIntensity: 2, actionText: "The Unwriting erases the premise your stance was standing on", stanceHint: "Coldly it unmakes the reason you came, leaving only the blank where it was." },
        { enemyStance: 'heart', damageWeight: 1.1, actionText: "The Unwriting deletes the part of you that was certain you could win", stanceHint: "There is something almost like contempt in how surgically it removes your hope." },
        { enemyStance: 'mind', damageWeight: 1.4, threatEffectId: 'debuff_all_stats_down', threatIntensity: 3, actionText: "The Unwriting begins erasing the very rules that let it exist, and the unraveling spreads to you", stanceHint: "To finish you it must delete the last axiom holding itself together — and it does, without hesitation." },
    ],
    // Brute bramble-bandit — dot-weak (let it bleed), control-resistant; brawn first, sly bargain only after blood.
    'enemy-thicket-ambusher': [
        { enemyStance: 'body', damageWeight: 1.3, threatEffectId: 'debuff_bleed', threatIntensity: 2, actionText: "The Ambusher bursts from the green with a thorned cudgel", stanceHint: "It opens with raw muscle, all ambush and breaking weight, no word offered." },
        { enemyStance: 'mind', damageWeight: 0.85, actionText: "The Ambusher names a price now that you've bloodied it", stanceHint: "First blood spent, the brute turns merchant, calculating what your life is worth." },
        { enemyStance: 'body', damageWeight: 1.35, threatEffectId: 'debuff_root', threatIntensity: 2, actionText: "The Ambusher drags you down into the brambles", stanceHint: "Bargain refused, it falls back on the only honest thing it has: sheer force." },
    ],
    // A patient territorial bramble — no mind to parley with.
    'enemy-thorned-sentinel': [
        { enemyStance: 'body', threatEffectId: 'debuff_bleed', actionText: "The sentinel lashes a thorned vine across your forearm", stanceHint: "It guards its ground with the flat, immovable certainty of a wall that has stood through many sieges." },
        { enemyStance: 'mind', damageWeight: 0.8, threatEffectId: 'debuff_root', threatIntensity: 2, actionText: "Bramble erupts underfoot to cage your legs in thorns", stanceHint: "It does not rush; it waits with the cold arithmetic of a thing that measures patience in seasons." },
        { enemyStance: 'body', damageWeight: 1.35, actionText: "A wall of thorns rakes over you all at once", stanceHint: "When the trespass will not stop, it answers with every spine it has, all at once and without mercy." },
    ],
    // A shore-cursed brawler whose rage can be soothed — Control/mercy is the way in; immense body, resists erosion behind the curse.
    'enemy-tidefluke-reaver': [
        { enemyStance: 'body', actionText: "The Reaver hammers down with fists faster than the surf retreats", stanceHint: "It is all muscle and salt-weight, a wave given arms and a single intent." },
        { enemyStance: 'heart', damageWeight: 0.9, threatEffectId: 'debuff_fear', threatIntensity: 2, actionText: "The Reaver roars the name of a shore that drowned, and the sound staggers you", stanceHint: "Beneath the curse is a mourning so vast it breaks over you like tide." },
        { enemyStance: 'mind', threatEffectId: 'debuff_root', threatIntensity: 2, actionText: "The Reaver herds you against the rocks the way the sea herds the drowning", stanceHint: "The curse lends it a tidal cunning, reading the pull of the ground beneath you." },
        { enemyStance: 'body', damageWeight: 1.4, actionText: "The Reaver brings down a blow with the whole weight of a vengeful sea", stanceHint: "All grief spends itself as force now; the shore-curse closes its fist and does not let go." },
    ],
    // A territorial brute — wordless and stubborn.
    'enemy-tidepool-crab': [
        { enemyStance: 'body', actionText: "The crab clamps a claw shut on your fingers", stanceHint: "It plants its feet on its scrap of dock and answers every approach with the same blunt pinch." },
        { enemyStance: 'body', damageWeight: 1.3, threatEffectId: 'debuff_wound', actionText: "It drives a serrated claw clean through your guard", stanceHint: "Defending its claim to the last, it puts its whole armored bulk behind one crushing snap." },
    ],
    // Brutal body-bully — dot-weak (hews under bleed); control-resistant, immovable.
    'enemy-tolltaker-of-the-ford': [
        { enemyStance: 'body', actionText: "The Tolltaker plants himself midstream and demands his due with a raised cudgel", stanceHint: "He stands like the river's own stone — the current breaks on him and he does not notice." },
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_wound', actionText: "The Tolltaker eyes the coin you are NOT carrying and decides what else you'll pay", stanceHint: "He tallies your pockets with a merchant's cold arithmetic before the first blow." },
        { enemyStance: 'body', damageWeight: 1.35, actionText: "The Tolltaker collects in full, swinging to take the only thing you brought", stanceHint: "No more talk — just the brute weight of a man who has drowned the unpaying before." },
    ],
    // Befriendable shepherd — control-weak (reason with it); dot-tough green wood. Defends until it must judge you.
    'enemy-verdant-protector': [
        { enemyStance: 'body', threatEffectId: 'debuff_root', actionText: "The Protector lashes a living branch across your path", stanceHint: "It plants itself between you and the grove, immovable as old timber." },
        { enemyStance: 'heart', damageWeight: 0.9, actionText: "The Protector mourns the trampled growth at your feet", stanceHint: "It tends a broken seedling even as it fights, grieving every snapped stem." },
        { enemyStance: 'body', damageWeight: 1.3, threatEffectId: 'debuff_wound', threatIntensity: 2, actionText: "The Protector swings its green blade in final judgment", stanceHint: "Convinced now you are blight, it brings its full weight down without mercy." },
    ],
    // Befriendable absence-forged automaton — Control-weak (the lonely thing answers a voice), dot-resistant crystallized nothing; mind-dominant, body-heavy.
    'enemy-voidwrought-construct': [
        { enemyStance: 'mind', damageWeight: 0.9, threatEffectId: 'debuff_silence', threatIntensity: 2, actionText: "The Construct calculates the precise shape of what you lack and presses into the gap", stanceHint: "It reasons with the awful patience of math, weighing you against everything it is not." },
        { enemyStance: 'body', damageWeight: 1.1, actionText: "The Construct brings the full mass of its crystallized absence down upon you", stanceHint: "It moves as though dragging the weight of every thing that was taken to forge it." },
        { enemyStance: 'mind', damageWeight: 1.2, threatEffectId: 'debuff_all_stats_down', threatIntensity: 2, actionText: "The Construct subtracts you, piece by piece, from the equation it is solving", stanceHint: "In its final reckoning there is something almost like loneliness — it solves toward company it cannot name." },
    ],
    // Sophist elite — dot-weak (the patter unravels under steady erosion); control-resistant, mind-dominant, dagger is an afterthought.
    'enemy-wandering-sophist': [
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_confusion', threatIntensity: 2, actionText: "The Sophist sells you a certainty that turns to smoke as you grasp it", stanceHint: "The patter never stops; he wins the point before you notice it was a knife." },
        { enemyStance: 'mind', damageWeight: 0.95, actionText: "The Sophist reframes the entire dispute so your strength becomes your error", stanceHint: "He moves the ground beneath the argument with a cold, practiced ease." },
        { enemyStance: 'body', damageWeight: 1.3, threatEffectId: 'debuff_bleed', actionText: "Mid-sentence, the Sophist lets the incidental dagger finish the thought", stanceHint: "The words were always cover — the wrist flicks while the mouth keeps talking." },
    ],
    // Befriendable bailiff of oblivion — Control-weak (it can be served its own papers); erosion-resistant.
    'enemy-warrant-of-the-void': [
        { enemyStance: 'body', actionText: "The Warrant presses its writ against your chest until the ink burns", stanceHint: "It does not argue; it simply advances, and the floor it stood on is already yours no longer." },
        { enemyStance: 'mind', damageWeight: 0.8, threatEffectId: 'debuff_silence', threatIntensity: 2, actionText: "The Warrant reads the charge aloud and the word for your name goes missing", stanceHint: "Each clause is filed in order, cross-referenced, leaving no clean place to object." },
        { enemyStance: 'heart', damageWeight: 0.9, threatEffectId: 'debuff_fear', threatIntensity: 2, actionText: "The Warrant shows you the date of execution, and it is today", stanceHint: "Behind the seal something grieves the duty it cannot refuse." },
        { enemyStance: 'body', damageWeight: 1.35, threatEffectId: 'debuff_curse', threatIntensity: 3, actionText: "The Warrant carries out the sentence that was passed before you were born", stanceHint: "All deliberation done, it lowers the stamp with the weight of a closing door." },
    ],
    // Half-feral, half-pitiful — its trembling, beggable side opens the Control/mercy path ; its feral fury resists erosion (.
    'enemy-wet-hound': [
        { enemyStance: 'body', threatEffectId: 'debuff_bleed', actionText: "The hound lunges and clamps its jaws on your wrist", stanceHint: "Hunger wins out and it strikes on raw instinct, all snapping muscle and no thought at all." },
        { enemyStance: 'heart', damageWeight: 0.8, actionText: "It cowers, then flinches forward in a confused half-bite", stanceHint: "It trembles between bite and beg, whining at you with eyes that remember being someone's." },
        { enemyStance: 'body', damageWeight: 1.3, actionText: "Driven past fear, it leaps for your throat", stanceHint: "The beggar drowns in the beast, and it throws its whole shivering weight into one desperate maul." },
    ],
    // An ancient mind whispering forgotten secrets — control-resistant and luring, weak to patient erosion against old wood.
    'enemy-whispering-oak': [
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_confusion', actionText: "The Oak murmurs a secret meant to unmoor you from where you stand", stanceHint: "Its leaves trade whispers in a slow, deliberate calculus older than the path." },
        { enemyStance: 'heart', actionText: "The Oak's murmur turns to a sorrowing keen that bows its branches toward you", stanceHint: "Some of its secrets are griefs, and it shares one now like an open wound." },
        { enemyStance: 'mind', damageWeight: 1.3, threatEffectId: 'debuff_hex', threatIntensity: 2, actionText: "The Oak offers its last invitation, and the forest leans in to enforce it", stanceHint: "Coldly patient, it speaks the warning it always meant as a trap." },
    ],
};
