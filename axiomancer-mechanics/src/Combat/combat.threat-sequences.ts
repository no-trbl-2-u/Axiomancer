/**
 * Hazard-Pattern Combat — AUTHORED THREAT SEQUENCES (the learnable enemy patterns).
 *
 * GENERATED CONTENT. One entry per enemy in the 2026-07-06 art-driven roster: a
 * deterministic, fully-revealed-up-front sequence of phases the player learns and
 * out-plays. Each phase declares its hidden STANCE (the RPS read), a thematic
 * `stanceHint` that implies but never names that stance, a telegraphed threat
 * action (`actionText` + optional debuff), and a `damageWeight`.
 *
 * ESCALATION DOCTRINE (the Aeon's-End pressure): every sequence RAMPS — later
 * phases carry heavier `damageWeight` and harder debuffs, and the final phase is
 * a spike. On top of this per-phase ramp the engine's escalation clock
 * (`THREAT_ESCALATION_PER_ROUND`, bosses ×`THREAT_ESCALATION_BOSS_MULT`)
 * multiplies threat damage every round past the grace window, so a fight that
 * drags compounds BOTH curves. Solve it fast (DoT) or deny turns (control).
 *
 * The resolver in `combat.threat.ts` computes the concrete threat damage from
 * level + difficulty, so the whole roster retunes from a few constants.
 */

import type { AuthoredThreatPhase } from './combat.threat';

export const AUTHORED_THREAT_SEQUENCES: Record<string, AuthoredThreatPhase[]> = {
    // ══ FISHING VILLAGE — early (L1-8) ══════════════════════════════════════════

    // Mindless burial-grub — pure forward appetite; the ramp is it committing.
    'enemy-grave-larva': [
        { enemyStance: 'body', actionText: "The larva lunges and gums a mouthful of your shin", stanceHint: "It does not aim — it simply chews toward the nearest warm certainty." },
        { enemyStance: 'body', damageWeight: 1.3, threatEffectId: 'debuff_bleed', actionText: "It clamps on with its whole becoming and tears", stanceHint: "Whatever it is deciding to be, it has decided to be it at you, all at once." },
    ],
    // The watcher — patient, then suddenly all leverage; watching IS the wind-up.
    'enemy-float-eye': [
        { enemyStance: 'body', actionText: "The orb barrels into you like a thrown boulder", stanceHint: "All that watching stores momentum; it arrives with the weight of a held breath." },
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_mark', actionText: "Its gaze pins your feet to the ground mid-step", stanceHint: "It studies your stride and files an objection precisely where you planted it." },
        { enemyStance: 'body', damageWeight: 1.3, actionText: "The whole eye rolls over you, iris first", stanceHint: "Out of patience, it stops watching and simply throws its entire opinion at the matter." },
    ],
    // A skull on a loop — its last argument, escalating in volume.
    'enemy-chattering-skull': [
        { enemyStance: 'mind', damageWeight: 0.8, actionText: "The skull recites its last word at you until your ears ring", stanceHint: "It repeats the argument it died holding, colder each time." },
        { enemyStance: 'mind', damageWeight: 1.25, threatEffectId: 'debuff_mark', actionText: "The chattering doubles and redoubles until it is inside your own thinking", stanceHint: "Cornered, the loop tightens — the same word, faster, until it is the only word." },
    ],
    // Befriendable grief-bell — Control/mercy reaches it; raw sorrow resists erosion.
    'enemy-little-belle': [
        { enemyStance: 'heart', damageWeight: 0.85, threatEffectId: 'debuff_mark', actionText: "The bell tolls your name into the empty chapel of the air", stanceHint: "Every peal is a mourning for someone who never came; it grieves at you, openly." },
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_mark', actionText: "It rings a measured, patient interval that drags your hands behind the beat", stanceHint: "Between tolls it counts the congregation, wheeling through a liturgy it knows by rote." },
        { enemyStance: 'heart', damageWeight: 1.3, actionText: "Belle swings the bell itself in one final, grief-mad peal straight through you", stanceHint: "Past liturgy now, it throws its whole small orange body into the toll." },
    ],
    // A collector of footing — trips first, then presses the advantage it made.
    'enemy-foot-stealer': [
        { enemyStance: 'body', threatEffectId: 'debuff_mark', actionText: "A hand you did not count grabs your ankle and pulls", stanceHint: "It works low and honest: every limb is for leverage, nothing is for show." },
        { enemyStance: 'mind', damageWeight: 0.9, threatEffectId: 'debuff_mark', actionText: "It rearranges the ground under your next three steps", stanceHint: "It has inventoried your stride and is deciding which piece to repossess." },
        { enemyStance: 'body', damageWeight: 1.35, actionText: "It takes the footing entire, and you with it", stanceHint: "The collection closes on its favorite item with every scuttling hand at once." },
    ],
    // Befriendable drowned deckhand — mercy reaches the man; the wreck resists erosion.
    'enemy-water-holger': [
        { enemyStance: 'heart', damageWeight: 0.85, actionText: "Holger reaches for you with hands that remember hauling shipmates from the water", stanceHint: "It is not attacking so much as rescuing you, badly, toward the deep." },
        { enemyStance: 'body', threatEffectId: 'debuff_mark', actionText: "It surges with the sudden strength of the drowning", stanceHint: "The wreck lends it a brute, saltwater momentum it never asked for." },
        { enemyStance: 'heart', damageWeight: 1.3, actionText: "It embraces you like a shipmate going down, and means to finish the drill", stanceHint: "Grief and duty collapse into one motion; it weeps brine through the hold." },
    ],
    // A grudge on a spike — it remembers everything except being wrong.
    'enemy-cursed-head': [
        { enemyStance: 'heart', damageWeight: 0.85, threatEffectId: 'debuff_mark', actionText: "The head recites the wrong done to it until the air curdles", stanceHint: "The grudge does the talking; the talking does the wounding." },
        { enemyStance: 'mind', damageWeight: 0.9, actionText: "It corrects your version of events, tooth by tooth", stanceHint: "It has rehearsed the account for years; yours is an editing problem." },
        { enemyStance: 'heart', damageWeight: 1.3, threatEffectId: 'debuff_poison', actionText: "The curse pronounces you part of the grievance, permanently", stanceHint: "At the last it stops recounting and simply files you under the wrong." },
    ],
    // Hunger with manners — the courtesy escalates into the taking.
    'enemy-ghast': [
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_mark', actionText: "The ghast asks, beautifully, for something you will miss", stanceHint: "The request is a trap already sprung; it is merely observing the forms." },
        { enemyStance: 'body', damageWeight: 0.9, threatEffectId: 'debuff_bleed', actionText: "It takes without waiting for the answer", stanceHint: "The manners end where the reach begins." },
        { enemyStance: 'mind', damageWeight: 1.3, actionText: "It thanks you, sincerely, while taking the rest", stanceHint: "Cold and gracious to the end — the etiquette was always the appetite." },
    ],
    // The countdown fight — the egg does little, then very much; kill it before it hatches.
    'enemy-doom-egg': [
        { enemyStance: 'heart', damageWeight: 0.5, threatEffectId: 'debuff_poison', actionText: "The egg weeps a thin caustic promise down its own shell", stanceHint: "Nothing in it hurries. Everything in it counts." },
        { enemyStance: 'body', damageWeight: 0.8, threatEffectId: 'debuff_mark', enemyHeal: 4, actionText: "Feelers lash out to hold you exactly where the hatching wants you", stanceHint: "The shell flexes with something rehearsing its limbs." },
        { enemyStance: 'body', damageWeight: 1.5, threatEffectId: 'debuff_poison', threatIntensity: 2, actionText: "The shell splits and the countdown presents its total", stanceHint: "Every round it waited is in the blow; the kindness is billed in full." },
    ],
    // Elite dock brute — the cleaver is the argument, restated louder.
    'enemy-the-butcher': [
        { enemyStance: 'body', threatEffectId: 'debuff_bleed', actionText: "The Butcher opens the debate along your forearm", stanceHint: "He answers everything with the cleaver; the block is wherever you happen to stand." },
        { enemyStance: 'mind', damageWeight: 0.85, actionText: "He sizes you up by the joints, unhurried", stanceHint: "A tradesman's cold appraisal — which cuts are worth keeping." },
        { enemyStance: 'body', damageWeight: 1.15, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "The flat of the cleaver arrives like a dropped door", stanceHint: "The appraisal is done; the work begins in earnest." },
        { enemyStance: 'body', damageWeight: 1.4, threatEffectId: 'debuff_bleed', threatIntensity: 2, actionText: "He dresses the argument properly, by the joints", stanceHint: "No anger in it at all — just the trade, practiced past thought, brought to bear entire." },
    ],
    // Befriendable face-broker — Control/mercy reaches her; the bargains resist erosion.
    'enemy-brine-hag': [
        { enemyStance: 'body', actionText: "The Hag rakes brine-cracked nails toward your face", stanceHint: "She reaches for the surface of you first — the rest, she reckons, follows the face." },
        { enemyStance: 'heart', damageWeight: 0.9, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "She shows you your own reflection wearing an expression you have never allowed", stanceHint: "Beneath the bargaining is a mourning for a face she cannot wear." },
        { enemyStance: 'mind', threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "She prices your escape at exactly more than you have", stanceHint: "The tide taught her arithmetic; every sum comes out in her favor." },
        { enemyStance: 'body', damageWeight: 1.4, actionText: "She closes the bargain with both hands", stanceHint: "All the courtesy of the market drops away and the exchange completes by force." },
    ],
    // Befriendable psychopomp — answer the toll (control) or be ferried; cerebral, dot-resistant.
    'enemy-the-ferryman': [
        { enemyStance: 'mind', damageWeight: 0.21, threatEffectId: 'debuff_mark', actionText: "The Ferryman names the toll, and your objection is not legal tender", stanceHint: "He waits with the patience of a schedule that has never once been missed." },
        { enemyStance: 'mind', threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "He describes the far bank until you cannot remember the near one", stanceHint: "He listens past your words, appraising what you could not afford to lose." },
        { enemyStance: 'heart', damageWeight: 1.25, actionText: "The pole swings with the grief of ten thousand one-way crossings", stanceHint: "Cornered, the boatman finally lets the cost of the job show through." },
    ],
    // Befriendable fallen sovereign — Control-weak (the grievance can be heard);
    // dot-resistant, and most kingly when cornered. (The village climax boss.)
    'enemy-king-of-revenge': [
        { enemyStance: 'mind', threatEffectId: 'debuff_mark', actionText: "The King pronounces sentence and the shore itself holds you for it", stanceHint: "He still speaks in the cadence of a court, weighing your crimes by a statute only he remembers." },
        { enemyStance: 'heart', damageWeight: 0.85, threatEffectId: 'debuff_mark', actionText: "The King rages over the wrong no one living recalls", stanceHint: "Beneath the crown there is no head — only the grievance, holding the shape of one." },
        { enemyStance: 'body', damageWeight: 1.2, actionText: "The King brings down the whole weight of his century of court", stanceHint: "Words spent, the grievance becomes the storm, all verdict and breaking surf." },
        { enemyStance: 'mind', damageWeight: 1.4, threatEffectId: 'debuff_poison', threatIntensity: 3, actionText: "The King makes one last cold, kingly ruling upon you", stanceHint: "Cornered, the old grievance turns sly again, plotting the cruelest lawful ruin." },
    ],

    // ══ NORTHERN FOREST — early-mid (L9-18) ═════════════════════════════════════

    // Omen-miner — it knocks, it warns, and the third knock lands.
    'enemy-wichtlein': [
        { enemyStance: 'mind', damageWeight: 0.8, actionText: "The Wichtlein knocks once on the thin place under your feet", stanceHint: "It measures the ground the way a clerk measures a coffin — for someone specific." },
        { enemyStance: 'mind', damageWeight: 0.95, threatEffectId: 'debuff_mark', actionText: "The second knock, and the world under you sounds suddenly hollow", stanceHint: "It portends with the cold satisfaction of arithmetic coming out even." },
        { enemyStance: 'body', damageWeight: 1.35, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "The third knock — and what it was knocking on gives way", stanceHint: "The omen stops predicting the collapse and becomes it." },
    ],
    // Unique prophecy-calf — cerebral and grieving; the calamity is the final phase.
    'enemy-kudan': [
        { enemyStance: 'mind', damageWeight: 0.9, threatEffectId: 'debuff_mark', actionText: "The Kudan opens its human mouth, and your reply refuses to form", stanceHint: "It knows one true thing, and the knowing crowds every other sentence out of the room." },
        { enemyStance: 'heart', damageWeight: 0.95, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "It weeps for you, specifically, with terrible accuracy", stanceHint: "The grief is not for itself — it has read the ending, and the ending has your gait." },
        { enemyStance: 'mind', damageWeight: 1.3, threatEffectId: 'debuff_poison', threatIntensity: 2, actionText: "The Kudan begins to speak the calamity, and the first word is your name", stanceHint: "Cold and exact now — the prophecy was always going to be delivered; it only needed a listener." },
    ],
    // Lane bogey — the begging and the taking are one escalating motion.
    'enemy-bull-begger': [
        { enemyStance: 'body', actionText: "The Bull-Begger begs with a raised fist, and the fist lands first", stanceHint: "The asking is a formality; the arm was always going to follow." },
        { enemyStance: 'heart', damageWeight: 0.9, threatEffectId: 'debuff_mark', actionText: "It howls at the insult of being answered at all", stanceHint: "Refusal and charity anger it equally; what it loves is the asking." },
        { enemyStance: 'body', damageWeight: 1.35, actionText: "It takes the alms it decided you owed", stanceHint: "All pretense of petition gone — the collection is by main strength." },
    ],
    // A river of grief — pity is the current; it pulls.
    'enemy-weeping-head': [
        { enemyStance: 'heart', threatEffectId: 'debuff_mark', actionText: "The weeping rises past your knees and drags at every step", stanceHint: "It cries continuously, and at you; the river is the argument." },
        { enemyStance: 'heart', damageWeight: 0.9, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "The sobbing finds the frequency of your own worst night", stanceHint: "Its grief reaches for yours the way water finds water." },
        { enemyStance: 'body', damageWeight: 1.3, actionText: "The current takes you off your feet all at once", stanceHint: "The mourning stops asking for company and simply pulls." },
    ],
    // Borrowed-gods shaman — three debts, called in ascending order.
    'enemy-goblin-shaman': [
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_mark', actionText: "The Shaman rattles the first god awake and points it at your reasoning", stanceHint: "It consults before it strikes; the consultation is billed to you." },
        { enemyStance: 'mind', damageWeight: 1.0, threatEffectId: 'debuff_poison', actionText: "The second god is older, and arrives through your blood", stanceHint: "Its bargains are all overdue; the interest compounds in your veins." },
        { enemyStance: 'heart', damageWeight: 1.35, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "The third god it does not point — it merely lets go of the leash", stanceHint: "For one moment even the shaman looks apologetic about what it borrowed." },
    ],
    // The half-erased dancer — do not make it stop; it fights to keep moving.
    'enemy-sugata': [
        { enemyStance: 'heart', damageWeight: 0.85, actionText: "Sugata whirls through you mid-figure, desperate not to lose the step", stanceHint: "It moves on pure feeling; stopping, it fears, would finish the erasing." },
        { enemyStance: 'body', damageWeight: 0.95, threatEffectId: 'debuff_mark', actionText: "The tambourine cracks across you on the downbeat", stanceHint: "The dance has a violence to it now — every beat defended like territory." },
        { enemyStance: 'heart', damageWeight: 1.3, threatEffectId: 'debuff_poison', actionText: "It pulls you into the figure, and the erasure is a partner dance", stanceHint: "If it must fade mid-step, it has decided the step will be a duet." },
    ],
    // The wrong-hatched brood — remembers wings; the fury is all forward.
    'enemy-pale-brood': [
        { enemyStance: 'body', threatEffectId: 'debuff_bleed', actionText: "The brood drives its half-formed bulk into you, tearing", stanceHint: "It fights the way the wrongly-born do: as if owed, and collecting." },
        { enemyStance: 'heart', damageWeight: 0.9, threatEffectId: 'debuff_mark', actionText: "It keens at the sky it was promised, and the sound scrapes something loose in you", stanceHint: "Dimly, furiously, it remembers being meant for wings." },
        { enemyStance: 'body', damageWeight: 1.35, actionText: "It throws everything it became at you, all at once", stanceHint: "No flight, so it makes the leap the hard way — through you." },
    ],
    // Befriendable triple watcher — methodical scrutiny; Control-weak, erosion-resistant tallying.
    'enemy-tri-eyes': [
        { enemyStance: 'mind', damageWeight: 0.85, actionText: "Tri-Eyes marks a fresh error against your name", stanceHint: "It never raises its voice; it simply notes the discrepancy and waits." },
        { enemyStance: 'heart', threatEffectId: 'debuff_mark', actionText: "It recounts your every misstep until your hand falters", stanceHint: "There is something almost pleading in how badly it wants the tally to balance." },
        { enemyStance: 'mind', damageWeight: 1.25, threatEffectId: 'debuff_poison', threatIntensity: 2, actionText: "The third eye renders its final count on the ledger of you", stanceHint: "Every error reconciled, it closes the book with the patience of arithmetic." },
    ],
    // Patient green duelist — the cane keeps time you have not learned yet.
    'enemy-mabadi': [
        { enemyStance: 'mind', damageWeight: 0.8, actionText: "Mabadi taps the cane twice and you flinch on the wrong beat", stanceHint: "He is counting something in your footwork, and the count is not flattering." },
        { enemyStance: 'body', damageWeight: 1.1, threatEffectId: 'debuff_mark', actionText: "The cane arrives between your third and fourth thoughts", stanceHint: "All that patience converts, in one metronome tick, to reach." },
        { enemyStance: 'body', damageWeight: 1.35, threatEffectId: 'debuff_bleed', threatIntensity: 2, actionText: "He plays the phrase through to its cadence, on you", stanceHint: "The duel was scored long before you arrived; this is merely the performance." },
    ],
    // The unravelling thief — it replaces every lost thread with one of yours.
    'enemy-frayed-one': [
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_poison', actionText: "The Frayed One pulls a thread from the edge of your resolve", stanceHint: "It thinks in loose ends, and it has inventoried yours." },
        { enemyStance: 'heart', damageWeight: 0.95, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "It shows you the gap where the thread used to be", stanceHint: "Under the fury is panic — every hem it loses, it feels." },
        { enemyStance: 'mind', damageWeight: 1.35, threatEffectId: 'debuff_poison', threatIntensity: 2, actionText: "It reweaves itself from you, seam by seam", stanceHint: "Cold now, and tidy: your unraveling is its mending." },
    ],
    // Stacked-curse totem — immovable; the sentence assembles a word per phase.
    'enemy-bone-totem': [
        { enemyStance: 'mind', damageWeight: 0.8, threatEffectId: 'debuff_mark', actionText: "The lowest skull speaks its one word, and yours goes missing", stanceHint: "It stands its ground because it IS its ground; the curse is a sentence under construction." },
        { enemyStance: 'mind', damageWeight: 1.0, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "The middle skulls speak in order, and the air goes wrong between clauses", stanceHint: "Each mouth holds one word; the grammar is older than mercy." },
        { enemyStance: 'heart', damageWeight: 1.35, threatEffectId: 'debuff_poison', threatIntensity: 2, actionText: "The topmost skull completes the sentence, with you in it", stanceHint: "The assembly finishes; the curse, at last, is grammatical." },
    ],
    // Post-flesh scholar — the peer review is adversarial.
    'enemy-bone-wizard': [
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_mark', actionText: "The Bone Wizard cites a source your reasoning cannot survive", stanceHint: "Pure study moves it; the flesh was a distraction it graded and discarded." },
        { enemyStance: 'mind', threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "It identifies the flaw in your methodology, out loud", stanceHint: "Each question is laid like a trap that has already sprung." },
        { enemyStance: 'body', damageWeight: 1.35, actionText: "It concludes the review with the staff, per tradition", stanceHint: "The findings are final; the defense, it notes, was inadequate." },
    ],
    // Heart-dominant verdict, NOT befriendable — dot-weak; control-resistant scales.
    'enemy-mirac': [
        { enemyStance: 'body', actionText: "The court brings the red orb crashing down", stanceHint: "It hears no argument; it only lets the weight fall where weight must fall." },
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "Mirac measures your conviction and finds it wanting", stanceHint: "Cold and exact, it weighs feeling against feeling on a fulcrum of pure indifference." },
        { enemyStance: 'heart', damageWeight: 1.2, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "Mirac pronounces sentence, and the verdict settles into your bones", stanceHint: "At the last its impartiality burns like wrath — final, absolute, and personally aggrieved." },
        { enemyStance: 'heart', damageWeight: 1.4, threatEffectId: 'debuff_mark', threatIntensity: 3, actionText: "The hooded court rises as one, and the red verdict is executed", stanceHint: "Sentence first, crime later — and the sentence has waited long enough." },
    ],

    // ══ NORTHERN FOREST — mid (L19-31) ══════════════════════════════════════════

    // Oath without faith — rote muscle; the conviction arrives late and hits hardest.
    'enemy-cursed-paladin': [
        { enemyStance: 'body', actionText: "The Paladin advances a step the oath demands", stanceHint: "The armor swings on muscle memory; whatever believed is long gone from the visor." },
        { enemyStance: 'heart', damageWeight: 0.9, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "It kneels mid-fight, and the prayer that answers is not from anywhere good", stanceHint: "For one broken moment the emptiness inside the armor is the loudest thing in the wood." },
        { enemyStance: 'body', damageWeight: 1.2, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "The blessed blade remembers its work without being asked", stanceHint: "The oath does the aiming; the man was optional all along." },
        { enemyStance: 'body', damageWeight: 1.4, threatEffectId: 'debuff_bleed', threatIntensity: 2, actionText: "The Paladin spends the last of what the curse keeps upright", stanceHint: "The faith is dust and it knows it; still the armor answers the vow, again, and again." },
    ],
    // Leashed devotion — it throws itself; the will holding the leash is elsewhere.
    'enemy-vampire-thrall': [
        { enemyStance: 'body', threatEffectId: 'debuff_bleed', actionText: "The thrall throws itself at your throat, artlessly", stanceHint: "It moves like a tool being swung from far away — all force, no author." },
        { enemyStance: 'heart', damageWeight: 0.9, actionText: "It clutches at you, begging you to hold still for its master's sake", stanceHint: "Under the frenzy is devotion, spent on someone who is not here and never will be." },
        { enemyStance: 'body', damageWeight: 1.3, threatEffectId: 'debuff_bleed', threatIntensity: 2, actionText: "The leash jerks taut and the thrall spends itself entirely", stanceHint: "The final installment of its will comes due, and it pays with your blood." },
    ],
    // Befriendable tall mother — Control/mercy reaches her; the choosing resists erosion.
    'enemy-hasshaku-sama': [
        { enemyStance: 'heart', damageWeight: 0.85, threatEffectId: 'debuff_mark', actionText: "She says your name in the voice of someone who loves you", stanceHint: "She reaches for you with open, sorrowing hands, longing to be chosen back." },
        { enemyStance: 'heart', actionText: "She stoops through the canopy to look at you more closely", stanceHint: "Everything she does is affection, scaled wrong." },
        { enemyStance: 'heart', damageWeight: 1.35, threatEffectId: 'debuff_poison', threatIntensity: 2, actionText: "She gathers you up the way mothers gather what is theirs", stanceHint: "The choosing completes; her choosing has never once been refused." },
    ],
    // Temptation with a trunk — it feeds on wanting; the mouth is for afterward.
    'enemy-jeweled-tree': [
        { enemyStance: 'heart', damageWeight: 0.8, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "A gemstone eye catches the light exactly the way you hoped it would", stanceHint: "It feeds on wanting; the whole fight is an appeal to your appetite." },
        { enemyStance: 'body', threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "Roots close over your boots while you are still admiring", stanceHint: "Beneath the glitter it is timber and patience, and it holds what lingers." },
        { enemyStance: 'heart', damageWeight: 1.35, actionText: "The mouth in the bark opens, and the transaction completes", stanceHint: "The wanting was the meal; what follows is only digestion." },
    ],
    // Crowned coils — it has never lost a debate it could reach.
    'enemy-ogre-naga': [
        { enemyStance: 'body', actionText: "The naga's coils close the distance your argument was standing on", stanceHint: "Coils first, questions never; the reach is the rebuttal." },
        { enemyStance: 'body', damageWeight: 1.1, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "It constricts, patiently, an inch per point conceded", stanceHint: "It does not need you wrong — only within reach, which you now are." },
        { enemyStance: 'mind', damageWeight: 1.35, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "The crown of teeth descends to deliver the closing statement", stanceHint: "Having swallowed the counterargument, it proceeds to the conclusion." },
    ],
    // The spiteful crawler — it could fly; the refusal is the weapon.
    'enemy-sidelle': [
        { enemyStance: 'body', threatEffectId: 'debuff_bleed', actionText: "Sidelle drags itself over you, talon by talon, when it could simply have flown", stanceHint: "Everything it does is a pointed refusal; the crawling is a message." },
        { enemyStance: 'mind', damageWeight: 0.9, actionText: "It folds its wings with theatrical precision and picks its next handhold on you", stanceHint: "The spite is structural — every choice made the harder way, at you." },
        { enemyStance: 'body', damageWeight: 1.35, threatEffectId: 'debuff_bleed', threatIntensity: 2, actionText: "It finally uses the wings — one beat, downward, through you", stanceHint: "It saved the flight for the one moment it would insult you most." },
    ],
    // Cellar boss — the courtesy is over; pure escalating muscle.
    'enemy-rawhead-rex': [
        { enemyStance: 'body', threatEffectId: 'debuff_bleed', actionText: "Rawhead comes up the stairs it was never supposed to leave", stanceHint: "A cellar-thing of pure muscle; the dark it lived in comes along politely." },
        { enemyStance: 'heart', damageWeight: 0.9, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "It grins the grin from every story you were told too young", stanceHint: "It knows exactly which bedtime warning you are remembering, because it is the warning." },
        { enemyStance: 'body', damageWeight: 1.2, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "The bloody bones swing with the weight of every child's held breath", stanceHint: "The stories underdescribed it. Stories have editors; cellars do not." },
        { enemyStance: 'body', damageWeight: 1.4, threatEffectId: 'debuff_bleed', threatIntensity: 3, actionText: "Rawhead ends the courtesy it extended for a hundred years", stanceHint: "The stairs are behind it now; nothing about it is under anything anymore." },
    ],
    // Befriendable weaver — Control-weak (hand it a thread it didn't spin); erosion-resistant web.
    'enemy-fate-spinner': [
        { enemyStance: 'mind', damageWeight: 0.85, actionText: "The Spinner tightens a thread you did not know you were standing on", stanceHint: "Every move a reasoned counter; the web was drafted before you arrived." },
        { enemyStance: 'heart', damageWeight: 0.85, threatEffectId: 'debuff_mark', actionText: "He shows you the tapestry with your next three mistakes already woven", stanceHint: "There is an old sorrow in the showing — he has never once been surprised." },
        { enemyStance: 'mind', damageWeight: 1.2, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "He spins your hesitation into the loom mid-thought", stanceHint: "Cold and certain: your pauses are his raw material." },
        { enemyStance: 'mind', damageWeight: 1.4, threatEffectId: 'debuff_poison', threatIntensity: 3, actionText: "The Spinner pulls the pattern taut, and your part in it concludes", stanceHint: "The final motif was always going to be a struggle, rendered beautifully." },
    ],
    // Burned-down drake — what survived the fire is the part that says no.
    'enemy-ashen-bone-drake': [
        { enemyStance: 'body', threatEffectId: 'debuff_poison', actionText: "The drake exhales the memory of fire, which burns regardless", stanceHint: "What remains of it is refusal, distilled; the heat is rhetorical and real." },
        { enemyStance: 'mind', damageWeight: 0.9, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "It circles once, reading where your guard was burned before", stanceHint: "Ash remembers shapes; it is comparing you to previous refusals." },
        { enemyStance: 'body', damageWeight: 1.2, actionText: "The bone frame slams down with the weight the fire never took", stanceHint: "The argument of itself, restated skeletally, lands entire." },
        { enemyStance: 'body', damageWeight: 1.4, threatEffectId: 'debuff_poison', threatIntensity: 2, actionText: "The drake spends its last ember on principle", stanceHint: "It refuses, one final time, everything — including the ending." },
    ],
    // Administrative mummy-king — decrees, countersigned, escalating.
    'enemy-ra-amin-ka': [
        { enemyStance: 'mind', threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "Ra-Amin-Ka issues a decree, and your tempo is annexed", stanceHint: "Cold administration; every strike is a signature, witnessed." },
        { enemyStance: 'mind', damageWeight: 0.9, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "He strikes your objection from the record of the living", stanceHint: "The court of dust has procedures older than your language." },
        { enemyStance: 'body', damageWeight: 1.2, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "The bandaged hand closes, and the kingdom presumes your loyalty", stanceHint: "When paper fails, the king remembers that hands predate paper." },
        { enemyStance: 'mind', damageWeight: 1.4, threatEffectId: 'debuff_poison', threatIntensity: 3, actionText: "The final decree is read, and it concerns your continued existence", stanceHint: "The bandages are signed; the last signature required is yours, posthumously." },
    ],
    // Befriendable courteous appetite — mercy reaches the hostess; the hunger resists erosion.
    'enemy-lady-gabriella': [
        { enemyStance: 'heart', damageWeight: 0.85, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "The Lady offers you a seat you did not see her place", stanceHint: "Courtesy is the weapon; the feelings are real, which is the trap." },
        { enemyStance: 'mind', damageWeight: 0.9, actionText: "She inquires after your health with clinical accuracy", stanceHint: "Between courses she appraises, cold as cellar stone, what is worth keeping." },
        { enemyStance: 'heart', damageWeight: 1.2, threatEffectId: 'debuff_bleed', threatIntensity: 2, actionText: "Dinner is served the moment you stop being a guest", stanceHint: "The mouth she uses for meaning it has other uses." },
        { enemyStance: 'heart', damageWeight: 1.4, actionText: "Four centuries of appetite arrive at the table at once", stanceHint: "The last human habit gives way, with sincere regret, to the older ones." },
    ],
    // Twin-voiced arguer — the disagreement is the mercy; beware the agreement.
    'enemy-zoma': [
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_mark', actionText: "The left head rebuts a thing you had not said yet", stanceHint: "Two minds, one patient argument — you are the current topic." },
        { enemyStance: 'mind', damageWeight: 0.95, threatEffectId: 'debuff_mark', actionText: "The right head answers the left, and your part of the conversation is deemed redundant", stanceHint: "They disagree only about which of them loves you less." },
        { enemyStance: 'heart', damageWeight: 1.3, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "Both heads turn to you at once, in perfect, terrible accord", stanceHint: "The arguing was the safety mechanism. It has been switched off." },
    ],
    // The undrowned duelist — the river taught him new beats.
    'enemy-mabadi-undrowned': [
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_mark', actionText: "Undrowned Mabadi counts a rhythm with river-water patience", stanceHint: "The same metronome, colder; the beats have silt in them now." },
        { enemyStance: 'body', damageWeight: 1.1, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "The cane arrives with current behind it", stanceHint: "He collected interest the whole way downstream." },
        { enemyStance: 'body', damageWeight: 1.35, threatEffectId: 'debuff_bleed', threatIntensity: 2, actionText: "He plays the drowned cadence through to its end, on you", stanceHint: "The river gave him back for exactly this performance." },
        { enemyStance: 'mind', damageWeight: 1.4, actionText: "He closes with the principal — the beat you never hear", stanceHint: "Cold and final: the collection completes, to the note." },
    ],

    // ══ NORTHERN FOREST — late (L34-50) ═════════════════════════════════════════

    // The hollowed tally — arithmetic that no longer wants anything, which makes it faster.
    'enemy-tri-eyes-hollowed': [
        { enemyStance: 'mind', damageWeight: 0.9, actionText: "The hollowed watcher marks an error you have not made yet", stanceHint: "The tally continues without a reason; cold arithmetic, self-sustaining." },
        { enemyStance: 'mind', threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "It reconciles your account against nothing, and the nothing carries", stanceHint: "There is no wanting left to slow the count." },
        { enemyStance: 'mind', damageWeight: 1.35, threatEffectId: 'debuff_poison', threatIntensity: 3, actionText: "The count completes, and you are the remainder", stanceHint: "The ledger closes with the satisfaction of zero." },
    ],
    // The walking plague — septic mass; it spreads by main force now.
    'enemy-black-death': [
        { enemyStance: 'body', threatEffectId: 'debuff_poison', threatIntensity: 2, actionText: "The Black Death lays a hand on you like a census", stanceHint: "A plague with posture; every touch is enrollment." },
        { enemyStance: 'body', damageWeight: 1.1, threatEffectId: 'debuff_poison', threatIntensity: 2, actionText: "It breathes a town's worth of endings across you", stanceHint: "It remembers every parish by taste, and is tasting." },
        { enemyStance: 'heart', damageWeight: 0.95, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "It shows you the arithmetic of what it has already survived being", stanceHint: "Under the spine it is still a multitude, and multitudes grieve strangely." },
        { enemyStance: 'body', damageWeight: 1.4, threatEffectId: 'debuff_poison', threatIntensity: 3, actionText: "The pestilence embraces you with the patience of history", stanceHint: "Walking, it decided, beats waiting — and it has walked straight to you." },
    ],
    // The eaten names — it thinks in shapes language avoids.
    'enemy-the-unnameable': [
        { enemyStance: 'mind', damageWeight: 0.9, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "It eats the word you were about to use for it", stanceHint: "It thinks in shapes language was built to avoid." },
        { enemyStance: 'mind', threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "It rearranges the part of you that files things under names", stanceHint: "Every taxonomy sent against it has been digested, namer included." },
        { enemyStance: 'heart', damageWeight: 1.1, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "You perceive, briefly, what it is instead of what it is called", stanceHint: "Beneath the eating is a loneliness no noun has survived long enough to describe." },
        { enemyStance: 'mind', damageWeight: 1.4, threatEffectId: 'debuff_poison', threatIntensity: 3, actionText: "It reaches for your name, having finished all of its own", stanceHint: "The collection is nearly complete; yours would round out the set." },
    ],
    // Furnace with a genealogy — hammer blows, escalating to the mountain's spine.
    'enemy-fire-giant': [
        { enemyStance: 'body', threatEffectId: 'debuff_poison', actionText: "The giant's blade sweeps a horizon of heat across you", stanceHint: "A furnace with a genealogy; everything he does is a hammer blow." },
        { enemyStance: 'body', damageWeight: 1.1, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "He plants a foot and the ground concedes the point", stanceHint: "His footwork is geological; you are fighting terrain that moves." },
        { enemyStance: 'mind', damageWeight: 0.95, actionText: "He appraises you down the length of the mountain's spine", stanceHint: "Old fire thinks slowly and exactly, like cooling stone." },
        { enemyStance: 'body', damageWeight: 1.45, threatEffectId: 'debuff_poison', threatIntensity: 3, actionText: "The sword remembers being a mountain, and falls like one", stanceHint: "The genealogy arrives all at once, ancestor by burning ancestor." },
    ],
    // The office-holder — the contract is the cage; the flaw is you.
    'enemy-greater-devil': [
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "The Devil tables an offer with your signature already drying on it", stanceHint: "It administers rather than rages; the contract is the cage." },
        { enemyStance: 'mind', threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "It invokes the clause that governs objections", stanceHint: "The paperwork is flawless. It has had a very long time to proofread." },
        { enemyStance: 'body', damageWeight: 1.2, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "Enforcement arrives, as specified, in person", stanceHint: "When the ink fails, the office remembers it has claws on retainer." },
        { enemyStance: 'mind', damageWeight: 1.4, threatEffectId: 'debuff_poison', threatIntensity: 3, actionText: "The Devil executes the agreement, and the agreement executes you", stanceHint: "The flaw in the paperwork was always going to be the counterparty." },
    ],
    // Befriendable widow-queen — mercy reaches the mourner; the sorcery resists erosion.
    'enemy-rangda': [
        { enemyStance: 'heart', threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "Rangda keens, and the curse arrives still weeping", stanceHint: "Grief that learned sorcery; every hex is a lesson she passed alone." },
        { enemyStance: 'mind', damageWeight: 0.9, threatEffectId: 'debuff_poison', threatIntensity: 2, actionText: "She recites the syllabus of four hundred years of accusation", stanceHint: "Each charge they invented, she studied; the coursework is in your blood now." },
        { enemyStance: 'heart', damageWeight: 1.2, threatEffectId: 'debuff_poison', threatIntensity: 2, actionText: "She shows you the widow under the mask, and the showing burns", stanceHint: "The monster was assigned; the mourning was hers." },
        { enemyStance: 'heart', damageWeight: 1.4, threatEffectId: 'debuff_mark', threatIntensity: 3, actionText: "Rangda lets the whole studied grief off its leash at once", stanceHint: "Love with nowhere to go, four centuries compounded, finds somewhere." },
    ],
    // The agreed twins — consensus was the threat the arguing held back.
    'enemy-zoma-ascendant': [
        { enemyStance: 'mind', damageWeight: 0.9, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "Both voices state the same premise, and it doubles in the air", stanceHint: "The two voices agree now; the argument was the safety mechanism." },
        { enemyStance: 'heart', damageWeight: 0.95, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "They invite you, warmly, in unison, to concur", stanceHint: "Agreement at this register is gravitational; dissent takes effort they no longer spend." },
        { enemyStance: 'mind', damageWeight: 1.2, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "The consensus rules your objection out of order, permanently", stanceHint: "There is no gap between the voices left to argue through." },
        { enemyStance: 'mind', damageWeight: 1.45, threatEffectId: 'debuff_poison', threatIntensity: 3, actionText: "The twin verdict lands as one sentence with no seam in it", stanceHint: "What the arguing held back, the agreement delivers entire." },
    ],
    // The white fire — it burns the way glaciers move: entirely.
    'enemy-elder-fire-giant': [
        { enemyStance: 'body', threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "The white heat settles over you like a season changing", stanceHint: "A fire gone pale with age; it burns the way glaciers move." },
        { enemyStance: 'mind', damageWeight: 0.9, actionText: "The elder considers you with the patience of a thing that outlived its own eruption", stanceHint: "Old flame plans in centuries; you are a brief agenda item." },
        { enemyStance: 'body', damageWeight: 1.2, threatEffectId: 'debuff_poison', threatIntensity: 2, actionText: "The pale blade falls with the weight of everything it has already burned", stanceHint: "The cloak of ash is a ledger; it adds you neatly." },
        { enemyStance: 'body', damageWeight: 1.45, threatEffectId: 'debuff_poison', threatIntensity: 3, actionText: "The oldest fire in the world burns, once, entirely", stanceHint: "Whiteness is what flame becomes when it stops needing to prove anything." },
    ],
    // The smoking mirror — it shows you the you that already lost.
    'enemy-tezcatlipoca': [
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "The mirror shows you mid-mistake, slightly before you make it", stanceHint: "It calculates in reflections; the smoke is where the discarded versions go." },
        { enemyStance: 'heart', damageWeight: 0.95, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "It shows you the version of you that already lost, at leisure", stanceHint: "There is grief in the glass — every reflection it keeps was somebody's best attempt." },
        { enemyStance: 'mind', damageWeight: 1.2, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "The mirror angles, and your certainty falls out of frame", stanceHint: "It edits with the courtesy of a god who has already seen the final cut." },
        { enemyStance: 'mind', damageWeight: 1.45, threatEffectId: 'debuff_poison', threatIntensity: 3, actionText: "The smoking mirror waits, courteously, for you to agree with it", stanceHint: "The reflection reaches the glass from the inside. The glass does not object." },
    ],
    // The promoted appetite — administrative violence at scale.
    'enemy-arch-demon': [
        { enemyStance: 'body', threatEffectId: 'debuff_poison', threatIntensity: 2, actionText: "The Arch-Demon backhands a portion of the battlefield out of the ledger", stanceHint: "Appetite promoted past restraint; the violence is administrative." },
        { enemyStance: 'mind', damageWeight: 0.9, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "It reviews your file, aloud, with commentary", stanceHint: "Somewhere below, lesser devils are already processing the outcome." },
        { enemyStance: 'body', damageWeight: 1.2, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "It signs the intent to consume, in triplicate, on your guard", stanceHint: "Each blow is countersigned; the bureaucracy is load-bearing." },
        { enemyStance: 'body', damageWeight: 1.45, threatEffectId: 'debuff_poison', threatIntensity: 3, actionText: "The appetite executes its mandate in full", stanceHint: "The promotion came with discretionary powers, and this is the discretion." },
    ],
    // Lord of swarms — each fly a small opinion; together, policy.
    'enemy-beelzebub': [
        { enemyStance: 'mind', damageWeight: 0.85, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "The swarm opens debate on the subject of your surfaces", stanceHint: "Each fly is a small opinion; the buzzing is deliberation." },
        { enemyStance: 'heart', damageWeight: 0.95, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "The swarm votes, and the air itself abstains from you", stanceHint: "Beneath the lord's stillness, ten million constituents reach alignment." },
        { enemyStance: 'body', damageWeight: 1.2, threatEffectId: 'debuff_poison', threatIntensity: 2, actionText: "Policy is enacted across every inch of you at once", stanceHint: "The swarm does nothing singly; enforcement is unanimous." },
        { enemyStance: 'mind', damageWeight: 1.45, threatEffectId: 'debuff_poison', threatIntensity: 3, actionText: "Beelzebub ratifies the final motion, and the swarm descends as one", stanceHint: "The lord of everything that swarms calls the question, and the question is you." },
    ],
    // Unique: the punctual end — courteous, scheduled, and compounding.
    'enemy-death': [
        { enemyStance: 'mind', damageWeight: 0.9, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "Death consults the ledger, and your minutes begin reporting to it", stanceHint: "It is not cruel. It is punctual, and it has already read your schedule." },
        { enemyStance: 'heart', damageWeight: 0.95, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "It offers its hand, the way one does to the late", stanceHint: "The courtesy is so old it reads as coldness; the appointment is genuine." },
        { enemyStance: 'mind', damageWeight: 1.2, threatEffectId: 'debuff_poison', threatIntensity: 2, actionText: "It amortizes you, gently, against the remaining term", stanceHint: "The arithmetic of endings is its whole vocation, and it does not round in your favor." },
        { enemyStance: 'mind', damageWeight: 1.45, threatEffectId: 'debuff_poison', threatIntensity: 3, actionText: "Death keeps the appointment", stanceHint: "It has never once been early. That was the whole of its mercy, and it is spent." },
    ],
    // Unique: the never-begun god — patience predating existence; the world it was owed.
    'enemy-the-abortive': [
        { enemyStance: 'heart', damageWeight: 0.9, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "The Abortive shows you the world it was meant to begin", stanceHint: "It feels everything it never got to be; the grief predates the griever." },
        { enemyStance: 'mind', damageWeight: 0.95, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "It unsays the part of the world that took its place", stanceHint: "Displacement is the only theology it was taught, and it studied." },
        { enemyStance: 'heart', damageWeight: 1.2, threatEffectId: 'debuff_poison', threatIntensity: 2, actionText: "It reaches for you with a strength never spent on living", stanceHint: "Everything it would have poured into a cosmos, it pours into the reaching." },
        { enemyStance: 'heart', damageWeight: 1.45, threatEffectId: 'debuff_poison', threatIntensity: 3, actionText: "The unbegun god tries, one more time, to begin — through you", stanceHint: "Its patience predates its existence, and both predate your defenses." },
    ],

    // ══ THE APORIA — labyrinth act bosses (W-01; L8 / L12 / L16) ═══════════════

    // Act I boss: the hinge-priest — control and stance-denial; the doors do the fighting.
    'enemy-the-doorwarden': [
        { enemyStance: 'body', threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "A threshold assembles itself under your feet and declines to be crossed", stanceHint: "He worships thresholds; where you would step, a doctrine has already been installed." },
        { enemyStance: 'mind', damageWeight: 0.9, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "He closes a door you were keeping open in your head", stanceHint: "Every door that ever shut is remembered in him, and he consults the memory alphabetically." },
        { enemyStance: 'body', damageWeight: 1.2, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "The bronze frame swings through you like a door through a draught", stanceHint: "Sermon concluded, the hinge-priest recalls that he is mostly hinge." },
        { enemyStance: 'body', damageWeight: 1.4, threatEffectId: 'debuff_mark', threatIntensity: 3, actionText: "Every door he remembers shuts at once, and you are the room", stanceHint: "The liturgy reaches its one commandment: what shuts, stays shut." },
    ],
    // Act II boss: the librarian-golem — misfiled truths as DoT; the paper does the cutting.
    'enemy-the-index': [
        { enemyStance: 'mind', threatEffectId: 'debuff_bleed', threatIntensity: 2, actionText: "A drawer opens at your name and issues the first thousand paper cuts", stanceHint: "It files before it strikes; the cuts arrive pre-catalogued." },
        { enemyStance: 'mind', damageWeight: 0.9, threatEffectId: 'debuff_poison', threatIntensity: 2, actionText: "It misfiles you under KINDLING and shelves you beside the lamp oil", stanceHint: "The Archive's errata smoulder; a truth in the wrong place is an accelerant." },
        { enemyStance: 'body', damageWeight: 1.2, threatEffectId: 'debuff_bleed', threatIntensity: 3, actionText: "The card-drawer ribs slam open and closed on whatever of you is nearest", stanceHint: "Out of patience with citation, the golem remembers its shelving is oak and iron." },
        { enemyStance: 'mind', damageWeight: 1.4, threatEffectId: 'debuff_poison', threatIntensity: 3, actionText: "It reads out every wrong entry ever filed about you, and the reading scalds", stanceHint: "The whole errata at once: a bonfire of corrections, and you are the margin they burn in." },
    ],
    // Act III finale: the narrator manifest — borrowed premises, returned with interest.
    'enemy-the-sophist': [
        { enemyStance: 'mind', threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "The Sophist restates your position, improved, and aims it back at you", stanceHint: "He fights with borrowed premises — yours, mostly, held at a more flattering angle." },
        { enemyStance: 'heart', damageWeight: 0.9, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "He concedes a point you had not made yet, courteously, like a trap", stanceHint: "The etiquette is the blade; the house eats the courteous last." },
        { enemyStance: 'mind', damageWeight: 1.2, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "He strikes your best premise from the record and signs the deletion in thirds", stanceHint: "Centuries of clerkship: what he cannot win he redacts." },
        { enemyStance: 'mind', damageWeight: 1.45, threatEffectId: 'debuff_poison', threatIntensity: 3, actionText: "The Sophist closes the argument with your own opening move, perfected", stanceHint: "The narration stops being about you and starts happening to you." },
    ],

    // ══ THE INCOMPLETENESS — the impossible playtest ceiling ═══════════════════
    // (unique, level 110) — the skill-ceiling benchmark: calibrated so the BEST
    // policy line scrapes a 1-5% win rate (near-impossible, not scripted-unwinnable).
    // Erosion-stubborn AND control-shrugging: almost nothing you bring is complete
    // enough to hold it.
    // PLAYTEST-CALIBRATION — weights 0.21 / 0.232 / 0.271 / 0.326, phase-3 self-knit (8).
    // The L110 unique threat budget is enormous, so these look tiny: at x1.45 fire
    // scale and the boss escalation clock they still land ~60-180 HP per phase.
    // The Incompleteness does not hit hard — it simply cannot be finished
    // (most losses are the round cap, which is the theme).
    'enemy-the-incompleteness': [
        { enemyStance: 'mind', damageWeight: 0.21, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "The Incompleteness states a truth your system cannot express, and your reply dies unprovable", stanceHint: "It begins from outside every axiom you brought; you cannot see the floor it stands on." },
        { enemyStance: 'heart', damageWeight: 0.232, threatEffectId: 'debuff_mark', threatIntensity: 2, actionText: "The Incompleteness shows you the true sentence about yourself that you will never be able to prove", stanceHint: "For a moment it grieves for you, the way one grieves for a house that believes it is finished." },
        { enemyStance: 'mind', damageWeight: 0.271, threatEffectId: 'debuff_mark', threatIntensity: 3, enemyHeal: 8, actionText: "The Incompleteness incorporates your strongest argument as a new axiom and grows truer", stanceHint: "Whatever you add to it, it contains; whatever wounds it becomes another thing it survives." },
        { enemyStance: 'mind', damageWeight: 0.326, threatEffectId: 'debuff_mark', threatIntensity: 3, isFinalPhase: true, actionText: "The Incompleteness proves, within you, the statement that you cannot go on — and you cannot refute it", stanceHint: "There is no triumph in it; the proof was never finishable, it only needed you to stop." },
    ],
};
