/**
 * ENEMY DECKS — the Profane Canon (2026-08-08 rework).
 *
 * Every roster enemy fights as an ordered deck of enemy cards
 * (`combat.enemy-cards.ts`). The deck IS the fight's script, fully revealed
 * (Hazard's full-information doctrine): card N is threat phase N, the final
 * card loops as the standing final phase. `compileEnemyDeck` projects a deck
 * into the `AuthoredThreatStep[]` shape `combat.threat.ts` has always
 * consumed — the resolution machinery is untouched; the deck is the new
 * authoring layer.
 *
 * DECK SHAPE (THE BIG NUMBERS REWRITE, 2026-09-02 — these are conventions
 * now, not laws; the tests that pinned them were repealed):
 *   - a deck is an ordered, non-reshuffling sequence, so escalation is
 *     STRUCTURAL rather than legislated: card 1 opens, the back half spikes.
 *     Aeon's End's tiered nemesis deck is the model — tier 1 on top, tier 3 on
 *     the bottom, and the fight gets worse because of how it was built.
 *   - every card id must resolve in the library (still enforced, still a bug).
 *   - THE STAKE is a free authoring tool: any deck may wager on any card via
 *     `DECK_STAKES`. The old "boss/unique stake exactly their second card"
 *     law is repealed; `wagersCovetedDie` remains only as the DEFAULT for a
 *     deck that authors no stake of its own.
 */

import type { AuthoredThreatStep, AuthoredThreatPhase } from './combat.threat';
import { ENEMY_CARD_LIBRARY, type EnemyCard, type EnemyCardFace } from './combat.enemy-cards';
import { ENEMY_REGISTRY } from '../Enemy/enemy.library';

/** enemy id → its ordered deck of enemy-card ids. */
export const ENEMY_DECKS: Record<string, readonly string[]> = {
    'enemy-chattering-skull': ['bc-first-recitation', 'bc-final-rubric'], // 2 cards (matches current 2-phase count). The loop made liturgical: the recitation (0.8, MARK) escalates straight to the rubric read over you (1.4 spike) — the same word, faster, until it is the last r
    'enemy-bone-wizard': ['bc-first-recitation', 'bc-interdict', 'bc-ossuary-sermon', 'bc-sig-excommunication'], // 3 cards (matches current 3). The adversarial peer review: citation (0.8), the interdict against your methodology (1.0, MARK i2), then the review concluded by the staff — Ossuary Sermon (1.35 body spik
    'enemy-cursed-paladin': ['bc-canon-of-teeth', 'bc-penitent-genuflection', 'bc-anathema-brand', 'bc-ossuary-sermon', 'bc-sig-the-charnel-tide'], // 4 cards (matches current 4). The oath walking without the believer: the doctrine-strike (0.9, BLEED), the empty kneel (0.9 heart — his signature current beat), then the CURSED paladin does what curses
    'enemy-vampire-thrall': ['bc-canon-of-teeth', 'bc-penitent-genuflection', 'bc-ossuary-sermon'], // 3 cards (matches current 3). The leash arc: artless teeth (0.9, BLEED), devotion spent on an absent master (0.9 heart — Genuflection's 'kneels at you for want of an altar' IS the thrall), then the lea
    'enemy-ashen-bone-drake': ['bc-plague-versicle', 'bc-interdict', 'bc-processional-of-relics', 'bc-ossuary-sermon', 'bc-sig-the-plague-perfected'], // 4 cards (matches current 4). The refusal, restated skeletally: the breathed versicle (0.85, POISON — its memory-of-fire exhale), the interdict as it reads where your guard was burned before (1.0), the
    'enemy-ra-amin-ka': ['bc-sig-annexation-decree', 'bc-sig-struck-from-the-record', 'bc-ossuary-sermon', 'bc-oath-in-dead-latin', 'bc-final-rubric', 'bc-sig-the-mass-of-ending'], // BOSS, 4 cards (matches current 4). Decree -> erasure -> hands -> last decree: Annexation Decree opens (0.85), Struck from the Record carries stake:true in EXACTLY the second slot (0.95, per boss law a
    'enemy-black-death': ['bc-plague-versicle', 'bc-sig-census-of-flesh', 'bc-penitent-genuflection', 'bc-sig-embrace-of-history'], // BOSS, 4 cards (matches current 4). Breath -> enrollment -> grief -> embrace: the versicle breathed across a town's worth of you (0.85, POISON), Census of Flesh with stake:true in exactly the second sl
    'enemy-the-unnameable': ['bc-first-recitation', 'bc-sig-devoured-lexicon', 'bc-processional-of-relics', 'bc-sig-the-name-collection'], // BOSS, 4 cards (matches current 4). A recitation whose words go missing as it speaks: the dead lesson (0.8), Devoured Lexicon with stake:true in exactly the second slot (0.9 — new stake; its old sequen
    'enemy-goblin-shaman': ['small-god-on-credit', 'compound-interest', 'the-toll-entire'], // 3 phases preserved. Three debts called in ascending order, exactly as authored today: the rented god (0.8, POISON opener), the overdue bargain compounding in the veins (1.15, DOOM — the growth curve I
    'enemy-mabadi': ['first-notice', 'collection-rounds', 'foreclosure-in-person'], // 3 phases preserved. The metronome duelist as a debt being counted down: the count opens on your footwork (0.85 mind), the cane collects door to door (1.0 body BLEED), and the cadence forecloses (1.35 
    'enemy-mabadi-undrowned': ['first-notice', 'collection-rounds', 'compound-interest', 'foreclosure-in-person'], // 4 phases preserved, no stake (elite). Same clerk, colder river: notice (0.85), enforcement (1.0), then the line 'he collected interest the whole way downstream' becomes mechanical — DOOM at slot 3 (1.
    'enemy-hasshaku-sama': ['condolences-itemized', 'lien-of-the-ninth-office', 'the-toll-entire'], // 3 phases preserved. The tall mother as an unrefusable claim: condolences for what she is about to repossess (0.9 heart — 'she says your name in the voice of someone who loves you'), then the archetype
    'enemy-mirac': ['adjusters-visit', 'the-weighing', 'the-toll-entire', 'do-the-second-notice', 'the-red-verdict', 'do-the-account-closed'], // Boss, 4 phases preserved, stake on exactly the SECOND card (the-weighing) — same slot as the current authored stake. The un-charmable court: adjuster denies the appeal (0.95 heart, swayCleanse 2), the
    'enemy-greater-devil': ['first-notice', 'clause-of-objections', 'foreclosure-in-person', 'execution-of-the-agreement'], // Boss, 4 phases preserved, stake on exactly the SECOND card (clause-of-objections). The office-holder's arc kept beat for beat: the tabled offer (0.85 mind), the objection clause with the wager and pre
    'enemy-death': ['first-notice', 'the-offered-hand', 'compound-interest', 'do-the-garnishment', 'the-appointment-kept', 'do-the-borrowed-god-repossessed'], // Unique, 4 phases preserved, stake on exactly the SECOND card (the-offered-hand — continuity with the current authored stake slot). Courteous, scheduled, compounding: the ledger opens and your minutes 
    'enemy-grave-larva': ['dp-undertow-grip', 'dp-breaking-sea'], // Keeps the current 2-phase count. Ramp 0.95 -> 1.4 (spike in band). Stances body/body match the existing learned pattern exactly; the existing final (1.3 + bleed) maps onto The Breaking Sea's bleed i2 
    'enemy-float-eye': ['dp-first-bell', 'dp-undertow-grip', 'dp-breaking-sea'], // Keeps the 3-phase count. Ramp 0.8 -> 0.95 -> 1.4. The First Bell's attendance-taking IS the watcher's stored patience; the finale reuses its own original hint line ('throws its entire opinion at the m
    'enemy-little-belle': ['dp-salt-rescue', 'dp-lead-bell', 'dp-grief-swell'], // Keeps the 3-phase count; stances heart/mind/heart match the existing pattern exactly. Ramp 0.8 -> 1.0 -> 1.3. Belle is the injector's true home: the grief-bell sews a bell into YOU (curse-swallowed-be
    'enemy-foot-stealer': ['dp-undertow-grip', 'dp-ninth-bell', 'dp-breaking-sea'], // Keeps the 3-phase count; stances body/mind/body match exactly. Ramp 0.95 -> 1.2 -> 1.4. The Ninth Bell's unlockAfterRound:3 in slot 2 is intentional: the collector inventories your stride and WAITS — 
    'enemy-water-holger': ['dp-salt-rescue', 'dp-drowning-drill', 'dp-grief-swell'], // Keeps the 3-phase count; stances heart/body/heart match exactly. Ramp 0.8 -> 1.15 -> 1.3. Holger authored two of these lines in his current sequence (the bad rescue, the drill) — the shared cards simp
    'enemy-cursed-head': ['dp-wet-congregation', 'dp-ninth-bell', 'dp-grief-swell'], // Keeps the 3-phase count; stances heart/mind/heart match exactly. Ramp 0.9 -> 1.2 -> 1.3. The existing final ('pronounces you part of the grievance, permanently') becomes DOOM via The Ninth Bell — inev
    'enemy-doom-egg': ['dp-salt-rescue', 'dp-drowning-drill', 'dp-breaking-sea'], // Keeps the 3-phase count; stances heart/body/body match exactly. Ramp 0.8 -> 1.15 -> 1.4. The countdown identity survives intact: DOOM seeded on phase 1 grows +1/round, so the egg still 'bills the kind
    'enemy-the-butcher': ['dp-first-bell', 'dp-undertow-grip', 'dp-drowning-drill', 'dp-breaking-sea', 'dp-the-register-closed', 'dp-brine-in-the-lungs'], // Elite, keeps the 4-phase count. Ramp 0.8 -> 0.95 -> 1.15 -> 1.4, monotone per doctrine. Stance order swaps his first two beats (appraisal now leads: The First Bell's for-the-record counting is his siz
    'enemy-brine-hag': ['dp-wet-congregation', 'dp-lead-bell', 'dp-drowning-drill', 'dp-breaking-sea', 'dp-vespers-under-water'], // Elite, keeps the 4-phase count. Ramp 0.9 -> 1.0 -> 1.15 -> 1.4. Second injector home: the sewn bell IS her bargain ('priced at exactly more than you have' becomes a curse in your deck you must PURGE).
    'enemy-weeping-head': ['dp-salt-rescue', 'dp-wet-congregation', 'dp-breaking-sea'], // Keeps the 3-phase count; stances heart/heart/body match exactly. Ramp 0.8 -> 0.9 -> 1.4. The river of grief is the archetype's purest expression: rising water (DOOM), inconsolable chorus (swayCleanse)
    'enemy-the-ferryman': ['sig-ferryman-toll', 'sig-ferryman-far-bank', 'dp-grief-swell', 'dp-the-hem-lets-go'], // BOSS. Keeps his current 3-phase count (flagged: the generic boss law says 4-5 cards — the explicit keep-current-count instruction wins here; orchestrator may insert a shared mid card if 4 is mandatory
    'enemy-king-of-revenge': ['dp-first-bell', 'sig-king-grievance', 'dp-drowning-drill', 'dp-the-salvage-claim', 'sig-king-last-ruling', 'dp-the-tide-called-in'], // BOSS. Keeps the 4-phase count; stances mind/heart/body/mind match his existing sequence exactly. Ramp 0.8 -> 0.85 -> 1.15 -> 1.4. stake:true on exactly the SECOND card (The Wrong No One Living Recalls
    'enemy-ghast': ['gc-the-lovely-request', 'gc-where-the-reach-begins', 'gc-thanks-given-sincerely'], // 3 cards = existing 3 phases, and an exact reconstruction of the canonical ghast arc (the archetype's emblem enemy plays the archetype's thesis in order): ask (mind 0.85, MARK) -> take without waiting 
    'enemy-bull-begger': ['gc-the-begging-fist', 'gc-the-howl-at-being-answered', 'gc-the-alms-you-owed'], // 3 cards = existing 3 phases; the beg -> howl -> collect arc rebuilt from its own adapted lines. Contour 0.95/0.9/1.35 keeps the original's shape (clean opener at default weight, lighter debuff-bearing
    'enemy-jeweled-tree': ['gc-the-glitter', 'gc-the-patient-inch', 'gc-thanks-given-sincerely', 'gc-the-hundredth-guest'], // 3 cards = existing 3 phases: bait the wanting (heart 0.8) -> roots close and hold (body 1.1, MARK 2 — the Patient Inch reads perfectly as timber patience) -> the transaction completes with gratitude (
    'enemy-ogre-naga': ['gc-where-the-reach-begins', 'gc-the-patient-inch', 'gc-thanks-given-sincerely', 'gc-teeth-behind-the-smile'], // 3 cards = existing 3 phases: the coils close the distance (body 0.9) -> constricts an inch per point conceded (body 1.1, MARK 2 — the Patient Inch IS the naga's own line, generalized) -> the closing s
    'enemy-pale-brood': ['gc-where-the-reach-begins', 'gc-the-howl-at-being-answered', 'gc-the-alms-you-owed'], // 3 cards = existing 3 phases: tears in as if owed and collecting (body 0.9, BLEED) -> keens at what it was promised (heart 0.9, MARK) -> throws everything it became, collecting by main strength (body 1
    'enemy-sidelle': ['gc-where-the-reach-begins', 'gc-the-patient-inch', 'gc-the-alms-you-owed'], // 3 cards = existing 3 phases, ramp 0.9/1.1/1.35 — deliberately MONO-STANCE (all body): the drag, the handhold, the taking. Flagged as an authored choice, not an accident: Sidelle refuses variety the wa
    'enemy-rawhead-rex': ['gc-where-the-reach-begins', 'rawhead-the-grin-from-the-stories', 'gc-the-patient-inch', 'gc-the-favour-called-in', 'rawhead-a-hundred-years-of-courtesy-ended', 'gc-the-table-cleared'], // 4 cards = existing 4 phases; boss law honored — stake on exactly the SECOND card (his grin, where the shipped sequence already had it). Arc: takes without waiting (up the stairs it was never supposed 
    'enemy-lady-gabriella': ['gc-the-standing-invitation', 'gabriella-the-clinical-inquiry', 'gc-thanks-given-sincerely', 'gabriella-four-centuries-at-table'], // 4 cards = existing 4 phases; boss law honored — stake on exactly the SECOND card, fused with her preserved swayCleanse 2 clinical-reset identity (the wager and the appraisal are one cold look). She is
    'enemy-beelzebub': ['gc-the-lovely-request', 'beelzebub-the-vote-of-the-air', 'gc-the-patient-inch', 'gc-the-gnawing-proper', 'beelzebub-the-final-motion', 'gc-the-bill-for-the-evening'], // 4 cards = existing 4 phases; boss law honored — stake on exactly the SECOND card (the vote). Arc: the swarm opens debate with a beautiful request (mind 0.85, MARK) -> the vote, wagered (heart 0.95, st
    'enemy-arch-demon': ['gc-where-the-reach-begins', 'arch-demon-your-file-read-aloud', 'gc-the-patient-inch', 'arch-demon-the-discretion', 'gc-the-lovely-things-taken'], // 4 cards = existing 4 phases; boss law honored — stake on exactly the SECOND card (the file review). Arc: takes without waiting for the answer — appetite promoted past restraint needs no permission (bo
    'enemy-fire-giant': ['of-bedrock-grievance', 'fg-mountains-spine-appraisal', 'of-orogeny', 'fg-the-sword-remembers', 'of-cauter-seam', 'of-glassed'], // 4 cards = current 4-phase count (sequence key 'enemy-fire-giant'). Ramp 0.85 -> 0.95 -> 1.3 -> 1.45: opener in band, final spike in the 1.3-1.5 band, stake on exactly the SECOND card (his preserved ca
    'enemy-elder-fire-giant': ['of-slow-kiln', 'efg-outlived-its-eruption', 'of-tithe-of-cinders', 'of-ash-in-the-throat', 'efg-burns-once-entirely', 'of-the-caldera-opens', 'of-the-wound-that-welds'], // 4 cards = current 4-phase count (sequence key 'enemy-elder-fire-giant'). Ramp 0.85 -> 0.9 -> 1.1 -> 1.45: soft ambient opener (white heat as a season changing, now a kiln with opinions), stake on exac
    'enemy-the-abortive': ['of-grief-of-magma', 'ab-the-unsaying', 'of-the-long-eruption', 'of-the-slow-collapse', 'ab-one-more-beginning', 'of-the-first-fire-remembered', 'of-the-mourning-heat'], // 4 cards = current 4-phase count (sequence key 'enemy-the-abortive'). Ramp 0.9 -> 0.95 -> 1.2 -> 1.45, matching its existing curve exactly; stake on exactly the SECOND card (unique treated boss-tier pe
    'enemy-wichtlein': ['first-knock', 'the-written-line', 'third-knock'], // 3 phases preserved. Knock, writ, collapse: ramp 0.8 → 1.0 → 1.35 (spike in band). The injector sits here on purpose — folklore wichtlein leave a death-token before the cave-in, so writing 'curse-alrea
    'enemy-kudan': ['the-tally-mark', 'wept-in-advance', 'oc-the-second-tally', 'the-calamity-spoken', 'oc-the-last-knock'], // 3 phases preserved. Knowing → weeping → speaking: ramp 0.85 → 0.9 → 1.3. Slots 2 and 3 are kudan's own existing lines returned to it. FLAG: kudan currently carries stake:true on phase 2 as a unique; t
    'enemy-sugata': ['wept-in-advance', 'the-downbeat', 'the-calamity-spoken'], // 3 phases preserved, heart/body/heart shape kept. Ramp 0.9 → 0.95 → 1.3. The half-erased dancer grieves in advance, defends the beat (its literal old phase 2), and the calamity spoken over it lands as 
    'enemy-frayed-one': ['the-tally-mark', 'the-downbeat', 'the-count-completes', 'oc-the-prophecy-fulfilled-early'], // 3 phases preserved. Ramp 0.85 → 0.95 → 1.35. The weaver reads as ledger-of-threads: it inventories your loose ends (tally), beats the weft across you (downbeat — a real loom verb), and closes the coun
    'enemy-bone-totem': ['first-knock', 'the-written-line', 'the-calamity-spoken'], // 3 phases preserved. Ramp 0.8 → 1.0 → 1.3. The stacked-curse totem is the second injector user and the most literal one: the sentence under construction gets a clause written into YOUR deck, then the t
    'enemy-tri-eyes': ['the-tally-mark', 'the-tally-reconciled', 'the-count-completes'], // 3 phases preserved. Ramp 0.85 → 0.9 → 1.35. Slot 2's grief card carries the old else-fork's pleading ('how badly it wants the tally to balance'). FLAG: the WS9 bearer-afflictions-gte-3 balance-the-boo
    'enemy-tri-eyes-hollowed': ['the-tally-mark', 'deemed-redundant', 'the-count-completes'], // 3 phases preserved. Ramp 0.85 → 1.05 → 1.35. Deliberately the tri-eyes deck with one swap: the hollowed traded its pleading heart card for the cold redundancy verdict — the hollowing is visible in the
    'enemy-zoma': ['the-tally-mark', 'deemed-redundant', 'the-calamity-spoken'], // 3 phases preserved, mind/mind/heart shape kept. Ramp 0.85 → 1.05 → 1.3. The premiseShed identity sits exactly where it lives today (slot 2, shed 2), and the final heart turn — both heads in terrible a
    'enemy-zoma-ascendant': ['the-tally-mark', 'the-warm-unison', 'deemed-redundant', 'oc-the-drum-with-your-pulse', 'verdict-without-seam', 'oc-the-name-read-out'], // BOSS, 4 phases preserved. Ramp 0.85 → 0.95 → 1.05 → 1.45; stake:true on exactly the SECOND card (the-warm-unison, its existing staked phase). The consensus arc: the premise stated against you, the inv
    'enemy-fate-spinner': ['first-knock', 'the-tapestry-shown', 'the-downbeat', 'the-pattern-pulled-taut', 'oc-the-hour-agreed'], // BOSS, 4 phases preserved. Ramp 0.8 → 0.9 → 0.95 → 1.45; stake:true on exactly the SECOND card (the-tapestry-shown, its existing staked phase). first-knock reads as the thread you did not know you were
    'enemy-tezcatlipoca': ['the-tally-mark', 'the-kept-reflection', 'smoke-through-the-seams', 'the-count-completes', 'oc-the-thread-cut-short'], // BOSS, 4 phases preserved, branch kept in its original third slot. Ramp 0.85 → 0.95 → 1.2 (else fork; 0.5 rider-heavy then fork) → 1.35; stake:true on exactly the SECOND card (the-kept-reflection, its 
    'enemy-the-doorwarden': ['litany-of-thresholds', 'the-door-kept-open', 'the-bronze-frame', 'ap-the-margin-note', 'what-shuts-stays-shut', 'ap-the-proof-completed', 'ap-the-question-that-eats'], // Act I labyrinth boss (L8), 4 cards matching the current phase count. Escalation: 1.0 opener -> 0.9 stake wager (SECOND card, per boss law) -> 1.2 glyphShatter punish -> 1.4 spike with MARK i3 cashing 
    'enemy-the-index': ['the-drawer-opens', 'filed-under-kindling', 'oak-and-iron', 'ap-the-corrected-you', 'the-errata-read-aloud', 'ap-the-shelf-closes'], // Act II labyrinth boss (L12), 4 cards matching the current phase count. Escalation: 1.0 curse-injecting opener -> 0.9 stake wager (SECOND card) -> 1.2 body glyphShatter -> 1.4 POISON i3 spike; the DoT 
    'enemy-the-sophist': ['your-position-improved', 'a-courteous-concession', 'signed-in-thirds', 'your-opening-perfected', 'ap-every-door-at-once'], // Act III finale (L16), 4 cards matching the current phase count. Escalation: 1.0 opener at rungs:2 (deliberately objection-vulnerable, per the Phase 33b softening) -> 0.9 heart stake wager (SECOND card
    'enemy-the-incompleteness': ['the-sentence-outside', 'the-true-thing-about-you', 'a-new-axiom', 'you-cannot-go-on', 'ap-the-axiom-you-stand-on'], // Unique L110 ceiling, 4 cards, CALIBRATION PRESERVED EXACTLY: damageWeights 0.21 / 0.232 / 0.271 / 0.326, stances mind/heart/mind/mind, debuff_mark at intensities 2/2/3/3, stake on the SECOND card, ene
    // rangda — the widow-queen (4 phases; her swayCleanse identity on the
    // staked second card, the studied grief as the spike).
    'enemy-rangda': ['the-widows-keening', 'syllabus-of-accusation', 'bc-plague-versicle', 'bc-the-thurible-swung', 'the-mask-comes-away', 'bc-sig-the-reliquary-emptied'],
    // ── Phase W3 (2026-08-28) — the northern continent's own blood. Nine
    // decks composed from the shared canon (no new cards needed): cavern
    // vermin lean drowned-parish/omen-choir, the city leans debt-office and
    // gnawing-court. Escalation law holds on each (final card is the spike);
    // only the Harbormaster wagers the coveted die (boss — stake lands on
    // his second card automatically via `wagersCovetedDie`).
    'enemy-seam-tick': ['dp-undertow-grip', 'gc-the-patient-inch', 'gc-the-alms-you-owed'], // 0.95 → 1.1 → 1.35: the grip, the tightening inch, the full withdrawal. A tick is a small collector.
    'enemy-prop-wight': ['first-knock', 'the-written-line', 'the-count-completes'], // 0.8 → 1.0 → 1.35: knock, writ, the roof's arithmetic finished. The wichtlein's cousin with a colder ending.
    'enemy-unpaid-delver': ['the-tally-mark', 'collection-rounds', 'the-downbeat', 'foreclosure-in-person'], // 0.85 → 1.0 → 0.95 → 1.35 (elite, 4 cards, no stake): the shift is tallied, collected, beaten to rhythm, and foreclosed.
    'enemy-sump-maren': ['dp-salt-rescue', 'dp-wet-congregation', 'dp-grief-swell'], // 0.8 → 0.9 → 1.3: the bad rescue, the chorus, the water that grieves you under.
    'enemy-toll-sergeant': ['first-notice', 'gc-the-begging-fist', 'the-toll-entire'], // 0.85 → 0.95 → 1.3: the fee posted nowhere, the fist that explains it, the toll entire.
    'enemy-guild-knife': ['first-notice', 'clause-of-objections', 'collection-rounds', 'execution-of-the-agreement'], // 0.85 → 0.9 → 1.0 → 1.4 (elite, 4 cards, no stake): served, objected, collected, executed. Punctually.
    'enemy-the-factor': ['small-god-on-credit', 'compound-interest', 'foreclosure-in-person'], // 0.8 → 1.15 → 1.35: he lends you the opening on credit and forecloses in person.
    'enemy-wharf-shrike': ['gc-where-the-reach-begins', 'dp-ninth-bell', 'gc-the-alms-you-owed'], // 0.9 → 1.2 → 1.35: the strike, the patient hook (the Ninth Bell's held round IS the larder wait), the collection.
    'enemy-the-harbormaster': ['adjusters-visit', 'the-weighing', 'the-toll-entire', 'execution-of-the-agreement', 'do-final-demand'], // BOSS, 4 cards: the appeal denied (0.95), THE WEIGHING staked in exactly the second slot (0.9 — the scale is his), the toll entire (1.3), the agreement executed (1.4 spike).
    // ── Phase W4 (2026-08-31) — the river crossing and the town beyond it.
    // Seven decks composed from the shared canon (no new cards needed): the
    // river leans drowned-parish/gnawing-court, the town leans debt-office
    // and gnawing-court. Escalation law holds on each (final card is the
    // spike); only the two bosses wager the coveted die, staked on their
    // second card automatically via `wagersCovetedDie`.
    'enemy-reed-ambusher': ['dp-undertow-grip', 'gc-where-the-reach-begins', 'gc-the-alms-you-owed'], // 0.95 → 0.9 → 1.35: the grip from the reeds, closing the reach, the full taking.
    'enemy-toll-skiff': ['first-notice', 'compound-interest', 'the-toll-entire'], // 0.85 → 1.15 → 1.3: the fee posted at the bow, the interest compounding mid-river, the toll entire.
    'enemy-weir-widow': ['dp-salt-rescue', 'dp-wet-congregation', 'dp-drowning-drill', 'dp-grief-swell', 'dp-your-name-on-the-bell'], // 0.8 → 0.9 → 1.15 → 1.3 (elite, 4 cards, no stake): the bad rescue, the chorus at the weir, the drill, the grief that drowns you.
    'enemy-the-waterreeve': ['first-notice', 'the-weighing', 'collection-rounds', 'execution-of-the-agreement', 'do-the-bailiff-of-hours'], // BOSS, 4 cards: notice posted at the crossing (0.85), THE WEIGHING staked in exactly the second slot (0.9 — every boat goes in his book), collection in person (1.0), the account executed (1.4 spike).
    'enemy-dowry-collector': ['first-notice', 'collection-rounds', 'the-toll-entire'], // 0.85 → 1.0 → 1.3: the appraisal posted, collected in person, the toll entire.
    'enemy-the-kept-suitor': ['gc-the-standing-invitation', 'gc-the-howl-at-being-answered', 'gc-the-patient-inch', 'gc-the-alms-you-owed'], // 0.9 → 0.9 → 1.1 → 1.35 (elite, 4 cards, no stake): the invitation nobody accepted, the howl at being answered anyway, the patient inch, the full taking.
    'enemy-the-portreeve': ['adjusters-visit', 'clause-of-objections', 'the-toll-entire', 'execution-of-the-agreement', 'do-the-interest-made-flesh'], // BOSS, 4 cards: the appeal denied (0.95), the objection clause staked in exactly the second slot (0.9 — every ruling crosses his desk first), the toll entire (1.3), the ruling executed (1.4 spike).
};

/** Projects one enemy-card face onto an authored-phase fragment. */
function faceToPhase(face: EnemyCardFace): AuthoredThreatPhase {
    return {
        enemyStance: face.stance,
        damageWeight: face.damageWeight,
        threatEffectId: face.effectId,
        threatIntensity: face.intensity,
        enemyHeal: face.enemyHeal,
        enemyCleanse: face.enemyCleanse,
        swayCleanse: face.swayCleanse,
        premiseShed: face.premiseShed,
        glyphShatter: face.glyphShatter,
        curseCardId: face.curseCardId,
        actionText: face.actionText,
        stanceHint: face.stanceHint,
    };
}

/** Projects one enemy card onto its authored threat step. The telegraph names
 *  the card being played — the enemy is visibly a deck-player. */

/**
 * AUTHORED STANCE CHECKS (spec 33 §2 / phase D9) — deck-level, like the stake.
 * A stance check names which stance the fight PUNISHES and which it YIELDS to
 * on a given phase; it is an enemy's read of YOU, not a property of the card
 * it happens to be holding, and signature cards are shared across decks — so
 * the authoring lives here, keyed by deck and phase index. Phases with no
 * entry fall through to `defaultStanceCheck` (combat.threat.ts), unchanged.
 *
 * Ported verbatim from the pre-rework `AUTHORED_THREAT_SEQUENCES` literals
 * (@ a69eab56) so the D9 content survives the Profane-Canon rework intact.
 */
export const DECK_STANCE_CHECKS: Record<string, Record<number, { punishes?: 'heart' | 'body' | 'mind'; yields?: 'heart' | 'body' | 'mind' }>> = {
    'enemy-grave-larva': { 0: { yields: 'mind' }, 1: { punishes: 'body' } },
    'enemy-little-belle': { 0: { yields: 'heart' } },
    'enemy-foot-stealer': { 0: { yields: 'mind' } },
    'enemy-the-butcher': { 1: { yields: 'mind' } },
    'enemy-king-of-revenge': { 0: { punishes: 'heart' }, 2: { yields: 'mind' } },
    'enemy-sugata': { 1: { yields: 'body' } },
    'enemy-tri-eyes': { 0: { yields: 'heart' }, 2: { punishes: 'mind' } },
    'enemy-mirac': { 1: { punishes: 'heart' } },
    'enemy-hasshaku-sama': { 0: { yields: 'heart' } },
    'enemy-rawhead-rex': { 0: { punishes: 'body' }, 1: { yields: 'heart' } },
    'enemy-fire-giant': { 0: { punishes: 'body' }, 1: { yields: 'mind' } },
    'enemy-rangda': { 1: { punishes: 'mind' }, 2: { yields: 'heart' } },
    'enemy-tezcatlipoca': { 0: { punishes: 'mind' }, 1: { yields: 'heart' } },
    'enemy-death': { 0: { yields: 'mind' }, 1: { punishes: 'heart' } },
};

/**
 * THE STAKE is a DECK property, not a card property: signature cards are
 * shared across decks (the same Devoured Lexicon serves an elite and a boss),
 * so which seat wagers is decided here — at the one place that knows which
 * enemy is playing — rather than trusted to every card literal.
 *
 * THE BIG NUMBERS REWRITE (2026-09-02): this is now only the DEFAULT, used
 * when a deck authors no `DECK_STAKES` entry of its own. Any deck may stake
 * any seat; the boss/unique-second-card law is repealed.
 */
function wagersCovetedDie(enemyId: string): boolean {
    const registry = ENEMY_REGISTRY as Record<string, { difficulty?: string } | undefined>;
    const difficulty = registry[enemyId.replace(/^enemy-/, '')]?.difficulty;
    return difficulty === 'boss' || difficulty === 'unique';
}

function cardToStep(
    cardId: string, card: EnemyCard, isFinal: boolean, stake: boolean,
    stanceCheck: { punishes?: 'heart' | 'body' | 'mind'; yields?: 'heart' | 'body' | 'mind' } | undefined,
): AuthoredThreatStep {
    if (card.branch) {
        return {
            branch: {
                condition: card.branch.condition,
                then: { ...faceToPhase(card.branch.then), isFinalPhase: isFinal },
                else: { ...faceToPhase(card.branch.else), isFinalPhase: isFinal },
            },
        };
    }
    return {
        enemyStance: card.stance,
        damageWeight: card.damageWeight,
        threatEffectId: card.effectId,
        threatIntensity: card.intensity,
        enemyHeal: card.enemyHeal,
        enemyCleanse: card.enemyCleanse,
        swayCleanse: card.swayCleanse,
        premiseShed: card.premiseShed,
        glyphShatter: card.glyphShatter,
        curseCardId: card.curseCardId,
        rungs: card.rungs,
        stake: stake || undefined,
        stanceCheck,
        unlockAfterRound: card.unlockAfterRound,
        actionText: `${card.name} — ${card.actionText}`,
        stanceHint: card.stanceHint,
        isFinalPhase: isFinal,
    };
}

/**
 * Compiles an enemy's deck into the authored threat-step sequence the
 * resolver consumes. Unknown card ids are dropped LOUDLY (a deck referencing
 * a missing card is an authoring bug, not a runtime condition).
 */
export const DECK_STAKES: Readonly<Record<string, readonly number[]>> = Object.freeze({
    // THE BIG NUMBERS REWRITE — per-deck stake seats (0-based card index).
    // Empty by design: every deck currently takes the default. Author an entry
    // here to make a foe wager somewhere else, or to make an elite wager at
    // all. An empty array means "this deck never stakes".
});

export function compileEnemyDeck(enemyId: string): AuthoredThreatStep[] {
    const deck = ENEMY_DECKS[enemyId];
    if (!deck) return [];
    return deck.map((cardId, i) => {
        const card = ENEMY_CARD_LIBRARY[cardId];
        if (!card) throw new Error(`Enemy deck '${enemyId}' names unknown card '${cardId}'.`);
        // An authored stake list wins; otherwise fall back to the default
        // (a boss/unique wagers on its second card).
        const authoredStakes = DECK_STAKES[enemyId];
        const stake = authoredStakes
            ? authoredStakes.includes(i)
            : i === 1 && wagersCovetedDie(enemyId);
        return cardToStep(cardId, card, i === deck.length - 1, stake, DECK_STANCE_CHECKS[enemyId]?.[i]);
    });
}

/** Every enemy id that fights by deck (the full roster). */
export const ENEMY_DECK_IDS: readonly string[] = Object.freeze(Object.keys(ENEMY_DECKS));
