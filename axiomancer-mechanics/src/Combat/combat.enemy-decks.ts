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
 *
 * ROUND-KEYED DECK TIERS (owner ruling, 2026-09-02 — reverses decision D15):
 * "enemy decks increase in tier as the rounds increase." A deck may now be
 * authored as ORDERED TIERS whose entry is keyed to the ROUND rather than to
 * position alone (`TieredEnemyDeck`): tier 1 plays from round 1, tier 2 is
 * unreachable before `tier2AtRound` (default 3), tier 3 before `tier3AtRound`
 * (default 6). The mechanism is the pre-existing per-phase `unlockAfterRound`
 * lock, stamped onto every card of a tier at compile time — so the resolver,
 * the telegraph and `processBetweenPhases` need no new vocabulary, and a
 * gated phase simply HOLDS the pointer at the last reachable phase (the fight
 * can never stall: the opener is never gated, see `compileEnemyDeck`).
 *
 * The flat `string[]` form still works and stays the majority shape: its
 * tiers are DERIVED from the cards' own `grade` (common → 1, escalation → 2,
 * signature → 3), running-max'd so a tier never reverts. Two authoring rules
 * make the derivation safe on decks nobody hand-tiered:
 *   - the deck's OPENING PAIR is always tier 1 (`TIER1_MIN_CARDS`) — rounds 1
 *     and 2 are the fight's opening exchange by definition, so a derived tier
 *     boundary can never land before index 2. This is what keeps the 3-card
 *     majority byte-identical to its pre-tier behaviour.
 *   - a gate can only DELAY a card, never summon it early, and the compiled
 *     gates are non-decreasing down the deck.
 * An authored `TieredEnemyDeck` overrides the derivation completely.
 */

import type { AuthoredThreatStep, AuthoredThreatPhase } from './combat.threat';
import {
    ENEMY_CARD_LIBRARY, type EnemyCard, type EnemyCardFace, type EnemyCardGrade,
} from './combat.enemy-cards';
import { ENEMY_REGISTRY } from '../Enemy/enemy.library';

/** Which tier of a deck a card sits in. 1 opens; 3 is the late-fight spike. */
export type DeckTier = 1 | 2 | 3;

/**
 * A deck authored as ROUND-KEYED TIERS (Aeon's End's nemesis deck: tier 1 on
 * top, tier 3 on the bottom). The compiled order is `tier1 ++ tier2 ++ tier3`,
 * so an authored tiering that partitions an existing flat deck in place
 * compiles to the same steps it always did — only the round gates are new.
 */
export interface TieredEnemyDeck {
    /** Openers. Plays from round 1; never gated. */
    readonly tier1: readonly string[];
    /** The pattern. Unreachable before `tier2AtRound`. */
    readonly tier2?: readonly string[];
    /** Spikes, signatures, the finale. Unreachable before `tier3AtRound`. */
    readonly tier3?: readonly string[];
    /** Round tier 2 becomes reachable (default `TIER2_DEFAULT_ROUND`). */
    readonly tier2AtRound?: number;
    /** Round tier 3 becomes reachable (default `TIER3_DEFAULT_ROUND`). */
    readonly tier3AtRound?: number;
}

/** Either deck form. The flat array is the legacy/majority shape. */
export type EnemyDeckSpec = readonly string[] | TieredEnemyDeck;

/** Default round gates. A tier never reverts, so these are clamped monotonic. */
export const TIER2_DEFAULT_ROUND = 3;
export const TIER3_DEFAULT_ROUND = 6;
/** The opening exchange is always tier 1 — see the header note. */
export const TIER1_MIN_CARDS = 2;

/** Narrows a deck spec to the authored tiered form. */
export function isTieredDeck(spec: EnemyDeckSpec): spec is TieredEnemyDeck {
    return !Array.isArray(spec);
}

/** The deck's card ids in compiled (play) order, whichever form it was authored in. */
export function deckCardIds(spec: EnemyDeckSpec): readonly string[] {
    if (!isTieredDeck(spec)) return spec;
    return [...spec.tier1, ...(spec.tier2 ?? []), ...(spec.tier3 ?? [])];
}

/** enemy id → its ordered deck of enemy-card ids (flat), or its authored tiers. */
export const ENEMY_DECKS: Record<string, EnemyDeckSpec> = {
    'enemy-chattering-skull': ['bc-first-recitation', 'bc-final-rubric'], // 2 cards (matches current 2-phase count). The loop made liturgical: the recitation (0.8, MARK) escalates straight to the rubric read over you (1.4 spike) — the same word, faster, until it is the last r
    'enemy-bone-wizard': ['bc-first-recitation', 'bc-interdict', 'bc-ossuary-sermon', 'bc-sig-excommunication'], // 3 cards (matches current 3). The adversarial peer review: citation (0.8), the interdict against your methodology (1.0, MARK i2), then the review concluded by the staff — Ossuary Sermon (1.35 body spik
    'enemy-cursed-paladin': ['bc-canon-of-teeth', 'bc-penitent-genuflection', 'bc-anathema-brand', 'bc-ossuary-sermon', 'bc-sig-the-charnel-tide'], // 4 cards (matches current 4). The oath walking without the believer: the doctrine-strike (0.9, BLEED), the empty kneel (0.9 heart — his signature current beat), then the CURSED paladin does what curses
    'enemy-vampire-thrall': ['bc-canon-of-teeth', 'bc-penitent-genuflection', 'bc-ossuary-sermon'], // 3 cards (matches current 3). The leash arc: artless teeth (0.9, BLEED), devotion spent on an absent master (0.9 heart — Genuflection's 'kneels at you for want of an altar' IS the thrall), then the lea
    'enemy-ashen-bone-drake': ['bc-plague-versicle', 'bc-interdict', 'bc-processional-of-relics', 'bc-ossuary-sermon', 'bc-sig-the-plague-perfected'], // 4 cards (matches current 4). The refusal, restated skeletally: the breathed versicle (0.85, POISON — its memory-of-fire exhale), the interdict as it reads where your guard was burned before (1.0), the
    // BOSS — TIERED (2026-09-02 owner ruling). The decree, then the office
    // that enforces it, then the Mass. Same six cards in the same order the
    // flat deck shipped; the tiers only pin WHEN each act can begin.
    'enemy-ra-amin-ka': {
        tier1: ['bc-sig-annexation-decree', 'bc-sig-struck-from-the-record'],
        tier2: ['bc-ossuary-sermon', 'bc-oath-in-dead-latin', 'bc-final-rubric'],
        tier3: ['bc-sig-the-mass-of-ending'],
    }, // 1.30/1.35 → 1.30/1.20/1.30 → 1.60. Old comment: BOSS, 4 cards (matches current 4). Decree -> erasure -> hands -> last decree: Annexation Decree opens (0.85), Struck from the Record carries stake:true in EXACTLY the second slot (0.95, per boss law a
    'enemy-black-death': ['bc-plague-versicle', 'bc-sig-census-of-flesh', 'bc-penitent-genuflection', 'bc-sig-embrace-of-history'], // ELITE (derived tiers). BOSS, 4 cards (matches current 4). Breath -> enrollment -> grief -> embrace: the versicle breathed across a town's worth of you (0.85, POISON), Census of Flesh with stake:true in exactly the second sl
    'enemy-the-unnameable': ['bc-first-recitation', 'bc-sig-devoured-lexicon', 'bc-processional-of-relics', 'bc-sig-the-name-collection'], // ELITE (derived tiers). BOSS, 4 cards (matches current 4). A recitation whose words go missing as it speaks: the dead lesson (0.8), Devoured Lexicon with stake:true in exactly the second slot (0.9 — new stake; its old sequen
    'enemy-goblin-shaman': ['small-god-on-credit', 'compound-interest', 'the-toll-entire'], // 3 phases preserved. Three debts called in ascending order, exactly as authored today: the rented god (0.8, POISON opener), the overdue bargain compounding in the veins (1.15, DOOM — the growth curve I
    'enemy-mabadi': ['first-notice', 'collection-rounds', 'foreclosure-in-person'], // 3 phases preserved. The metronome duelist as a debt being counted down: the count opens on your footwork (0.85 mind), the cane collects door to door (1.0 body BLEED), and the cadence forecloses (1.35 
    'enemy-mabadi-undrowned': ['first-notice', 'collection-rounds', 'compound-interest', 'foreclosure-in-person'], // 4 phases preserved, no stake (elite). Same clerk, colder river: notice (0.85), enforcement (1.0), then the line 'he collected interest the whole way downstream' becomes mechanical — DOOM at slot 3 (1.
    'enemy-hasshaku-sama': ['condolences-itemized', 'lien-of-the-ninth-office', 'the-toll-entire'], // 3 phases preserved. The tall mother as an unrefusable claim: condolences for what she is about to repossess (0.9 heart — 'she says your name in the voice of someone who loves you'), then the archetype
    // BOSS — TIERED. The appeal, the collection, the verdict. 1.00/1.30 →
    // 1.25/1.15 → 1.55/1.60: the court only reaches its own sentence late.
    'enemy-mirac': {
        tier1: ['adjusters-visit', 'the-weighing'],
        tier2: ['the-toll-entire', 'do-the-second-notice'],
        tier3: ['the-red-verdict', 'do-the-account-closed'],
    }, // Boss, 4 phases preserved, stake on exactly the SECOND card (the-weighing) — same slot as the current authored stake. The un-charmable court: adjuster denies the appeal (0.95 heart, swayCleanse 2), the
    'enemy-greater-devil': ['first-notice', 'clause-of-objections', 'foreclosure-in-person', 'execution-of-the-agreement'], // ELITE (derived tiers). Boss, 4 phases preserved, stake on exactly the SECOND card (clause-of-objections). The office-holder's arc kept beat for beat: the tabled offer (0.85 mind), the objection clause with the wager and pre
    // UNIQUE — TIERED. Courteous, scheduled, compounding: the ledger opens
    // (0.85/1.35), the interest is collected in person (1.15/1.25), and the
    // appointment is kept (1.60/1.45). Death does not hurry; it arrives.
    'enemy-death': {
        tier1: ['first-notice', 'the-offered-hand'],
        tier2: ['compound-interest', 'do-the-garnishment'],
        tier3: ['the-appointment-kept', 'do-the-borrowed-god-repossessed'],
    }, // Unique, 4 phases preserved, stake on exactly the SECOND card (the-offered-hand — continuity with the current authored stake slot). Courteous, scheduled, compounding: the ledger opens and your minutes 
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
    'enemy-the-ferryman': ['sig-ferryman-toll', 'sig-ferryman-far-bank', 'dp-grief-swell', 'dp-the-hem-lets-go'], // ELITE (derived tiers). BOSS. Keeps his current 3-phase count (flagged: the generic boss law says 4-5 cards — the explicit keep-current-count instruction wins here; orchestrator may insert a shared mid card if 4 is mandatory
    // BOSS — TIERED. The grievance is stated (0.80/1.35), drilled into you
    // (1.15/1.20), then ruled on with the whole tide behind it (1.60/1.55).
    'enemy-king-of-revenge': {
        tier1: ['dp-first-bell', 'sig-king-grievance'],
        tier2: ['dp-drowning-drill', 'dp-the-salvage-claim'],
        tier3: ['sig-king-last-ruling', 'dp-the-tide-called-in'],
    }, // BOSS. Keeps the 4-phase count; stances mind/heart/body/mind match his existing sequence exactly. Ramp 0.8 -> 0.85 -> 1.15 -> 1.4. stake:true on exactly the SECOND card (The Wrong No One Living Recalls
    'enemy-ghast': ['gc-the-lovely-request', 'gc-where-the-reach-begins', 'gc-thanks-given-sincerely'], // 3 cards = existing 3 phases, and an exact reconstruction of the canonical ghast arc (the archetype's emblem enemy plays the archetype's thesis in order): ask (mind 0.85, MARK) -> take without waiting 
    'enemy-bull-begger': ['gc-the-begging-fist', 'gc-the-howl-at-being-answered', 'gc-the-alms-you-owed'], // 3 cards = existing 3 phases; the beg -> howl -> collect arc rebuilt from its own adapted lines. Contour 0.95/0.9/1.35 keeps the original's shape (clean opener at default weight, lighter debuff-bearing
    'enemy-jeweled-tree': ['gc-the-glitter', 'gc-the-patient-inch', 'gc-thanks-given-sincerely', 'gc-the-hundredth-guest'], // 3 cards = existing 3 phases: bait the wanting (heart 0.8) -> roots close and hold (body 1.1, MARK 2 — the Patient Inch reads perfectly as timber patience) -> the transaction completes with gratitude (
    'enemy-ogre-naga': ['gc-where-the-reach-begins', 'gc-the-patient-inch', 'gc-thanks-given-sincerely', 'gc-teeth-behind-the-smile'], // 3 cards = existing 3 phases: the coils close the distance (body 0.9) -> constricts an inch per point conceded (body 1.1, MARK 2 — the Patient Inch IS the naga's own line, generalized) -> the closing s
    'enemy-pale-brood': ['gc-where-the-reach-begins', 'gc-the-howl-at-being-answered', 'gc-the-alms-you-owed'], // 3 cards = existing 3 phases: tears in as if owed and collecting (body 0.9, BLEED) -> keens at what it was promised (heart 0.9, MARK) -> throws everything it became, collecting by main strength (body 1
    'enemy-sidelle': ['gc-where-the-reach-begins', 'gc-the-patient-inch', 'gc-the-alms-you-owed'], // 3 cards = existing 3 phases, ramp 0.9/1.1/1.35 — deliberately MONO-STANCE (all body): the drag, the handhold, the taking. Flagged as an authored choice, not an accident: Sidelle refuses variety the wa
    // BOSS — TIERED. A hundred years of courtesy, spent in three acts:
    // the reach and the grin (0.90/1.30), the inch and the favour called in
    // (1.00/1.25), then the courtesy ended and the table cleared (1.55/1.55).
    'enemy-rawhead-rex': {
        tier1: ['gc-where-the-reach-begins', 'rawhead-the-grin-from-the-stories'],
        tier2: ['gc-the-patient-inch', 'gc-the-favour-called-in'],
        tier3: ['rawhead-a-hundred-years-of-courtesy-ended', 'gc-the-table-cleared'],
    }, // 4 cards = existing 4 phases; boss law honored — stake on exactly the SECOND card (his grin, where the shipped sequence already had it). Arc: takes without waiting (up the stairs it was never supposed 
    'enemy-lady-gabriella': ['gc-the-standing-invitation', 'gabriella-the-clinical-inquiry', 'gc-thanks-given-sincerely', 'gabriella-four-centuries-at-table'], // ELITE (derived tiers). 4 cards = existing 4 phases; boss law honored — stake on exactly the SECOND card, fused with her preserved swayCleanse 2 clinical-reset identity (the wager and the appraisal are one cold look). She is
    // BOSS — TIERED. The swarm's parliament: debate opened and the vote taken
    // (0.85/1.35), the motion gnawed through committee (1.00/1.30), the final
    // motion carried and the bill presented (1.60/1.40).
    'enemy-beelzebub': {
        tier1: ['gc-the-lovely-request', 'beelzebub-the-vote-of-the-air'],
        tier2: ['gc-the-patient-inch', 'gc-the-gnawing-proper'],
        tier3: ['beelzebub-the-final-motion', 'gc-the-bill-for-the-evening'],
    }, // 4 cards = existing 4 phases; boss law honored — stake on exactly the SECOND card (the vote). Arc: the swarm opens debate with a beautiful request (mind 0.85, MARK) -> the vote, wagered (heart 0.95, st
    // BOSS — TIERED (5 cards, so tier 3 opens at round 5 rather than the
    // default 6: a shorter deck reaches its own bottom sooner). The file read
    // aloud (0.90/1.30), the patient inch (1.00), then DISCRETION exercised
    // and the lovely things taken (1.60/1.35).
    'enemy-arch-demon': {
        tier1: ['gc-where-the-reach-begins', 'arch-demon-your-file-read-aloud'],
        tier2: ['gc-the-patient-inch'],
        tier3: ['arch-demon-the-discretion', 'gc-the-lovely-things-taken'],
        tier3AtRound: 5,
    }, // 4 cards = existing 4 phases; boss law honored — stake on exactly the SECOND card (the file review). Arc: takes without waiting for the answer — appetite promoted past restraint needs no permission (bo
    'enemy-fire-giant': ['of-bedrock-grievance', 'fg-mountains-spine-appraisal', 'of-orogeny', 'fg-the-sword-remembers', 'of-cauter-seam', 'of-glassed'], // ELITE (derived tiers). 4 cards = current 4-phase count (sequence key 'enemy-fire-giant'). Ramp 0.85 -> 0.95 -> 1.3 -> 1.45: opener in band, final spike in the 1.3-1.5 band, stake on exactly the SECOND card (his preserved ca
    // BOSS — TIERED (7 cards; the longest deck on the roster and the clearest
    // three-act read). The kiln warms (0.85/1.35), the tithe is taken
    // (1.10/1.20), then it burns once, entirely (1.60/1.60/1.35).
    'enemy-elder-fire-giant': {
        tier1: ['of-slow-kiln', 'efg-outlived-its-eruption'],
        tier2: ['of-tithe-of-cinders', 'of-ash-in-the-throat'],
        tier3: ['efg-burns-once-entirely', 'of-the-caldera-opens', 'of-the-wound-that-welds'],
    }, // 4 cards = current 4-phase count (sequence key 'enemy-elder-fire-giant'). Ramp 0.85 -> 0.9 -> 1.1 -> 1.45: soft ambient opener (white heat as a season changing, now a kiln with opinions), stake on exac
    // UNIQUE — TIERED (7 cards). Grief, then the long eruption, then the
    // beginning it cannot stop having: 0.95/1.35 → 1.20/1.30 → 1.60/1.50/1.45.
    'enemy-the-abortive': {
        tier1: ['of-grief-of-magma', 'ab-the-unsaying'],
        tier2: ['of-the-long-eruption', 'of-the-slow-collapse'],
        tier3: ['ab-one-more-beginning', 'of-the-first-fire-remembered', 'of-the-mourning-heat'],
    }, // 4 cards = current 4-phase count (sequence key 'enemy-the-abortive'). Ramp 0.9 -> 0.95 -> 1.2 -> 1.45, matching its existing curve exactly; stake on exactly the SECOND card (unique treated boss-tier pe
    'enemy-wichtlein': ['first-knock', 'the-written-line', 'third-knock'], // 3 phases preserved. Knock, writ, collapse: ramp 0.8 → 1.0 → 1.35 (spike in band). The injector sits here on purpose — folklore wichtlein leave a death-token before the cave-in, so writing 'curse-alrea
    // UNIQUE — TIERED. The calf that speaks once and dies: it knows
    // (0.85/0.90), it counts (1.20/1.25), it says the thing (1.60). The
    // prophecy is the tier-3 card, so a fight that runs long HEARS it.
    'enemy-kudan': {
        tier1: ['the-tally-mark', 'wept-in-advance'],
        tier2: ['oc-the-second-tally', 'the-calamity-spoken'],
        tier3: ['oc-the-last-knock'],
    }, // 3 phases preserved. Knowing → weeping → speaking: ramp 0.85 → 0.9 → 1.3. Slots 2 and 3 are kudan's own existing lines returned to it. FLAG: kudan currently carries stake:true on phase 2 as a unique; t
    'enemy-sugata': ['wept-in-advance', 'the-downbeat', 'the-calamity-spoken'], // 3 phases preserved, heart/body/heart shape kept. Ramp 0.9 → 0.95 → 1.3. The half-erased dancer grieves in advance, defends the beat (its literal old phase 2), and the calamity spoken over it lands as 
    'enemy-frayed-one': ['the-tally-mark', 'the-downbeat', 'the-count-completes', 'oc-the-prophecy-fulfilled-early'], // 3 phases preserved. Ramp 0.85 → 0.95 → 1.35. The weaver reads as ledger-of-threads: it inventories your loose ends (tally), beats the weft across you (downbeat — a real loom verb), and closes the coun
    'enemy-bone-totem': ['first-knock', 'the-written-line', 'the-calamity-spoken'], // 3 phases preserved. Ramp 0.8 → 1.0 → 1.3. The stacked-curse totem is the second injector user and the most literal one: the sentence under construction gets a clause written into YOUR deck, then the t
    'enemy-tri-eyes': ['the-tally-mark', 'the-tally-reconciled', 'the-count-completes'], // 3 phases preserved. Ramp 0.85 → 0.9 → 1.35. Slot 2's grief card carries the old else-fork's pleading ('how badly it wants the tally to balance'). FLAG: the WS9 bearer-afflictions-gte-3 balance-the-boo
    'enemy-tri-eyes-hollowed': ['the-tally-mark', 'deemed-redundant', 'the-count-completes'], // 3 phases preserved. Ramp 0.85 → 1.05 → 1.35. Deliberately the tri-eyes deck with one swap: the hollowed traded its pleading heart card for the cold redundancy verdict — the hollowing is visible in the
    'enemy-zoma': ['the-tally-mark', 'deemed-redundant', 'the-calamity-spoken'], // 3 phases preserved, mind/mind/heart shape kept. Ramp 0.85 → 1.05 → 1.3. The premiseShed identity sits exactly where it lives today (slot 2, shed 2), and the final heart turn — both heads in terrible a
    // BOSS — TIERED. The consensus arc, now on a clock: premise and unison
    // (0.85/1.35), you are deemed redundant and drummed (1.10/1.25), the
    // verdict without seam and your name read out (1.60/1.45).
    'enemy-zoma-ascendant': {
        tier1: ['the-tally-mark', 'the-warm-unison'],
        tier2: ['deemed-redundant', 'oc-the-drum-with-your-pulse'],
        tier3: ['verdict-without-seam', 'oc-the-name-read-out'],
    }, // BOSS, 4 phases preserved. Ramp 0.85 → 0.95 → 1.05 → 1.45; stake:true on exactly the SECOND card (the-warm-unison, its existing staked phase). The consensus arc: the premise stated against you, the inv
    // BOSS — TIERED (5 cards → tier 3 at round 5). The thread you did not know
    // you were on (0.85/1.30), the downbeat (0.95), then the pattern pulled
    // taut and the hour agreed (1.60/1.35). Time IS her mechanic.
    'enemy-fate-spinner': {
        tier1: ['first-knock', 'the-tapestry-shown'],
        tier2: ['the-downbeat'],
        tier3: ['the-pattern-pulled-taut', 'oc-the-hour-agreed'],
        tier3AtRound: 5,
    }, // BOSS, 4 phases preserved. Ramp 0.8 → 0.9 → 0.95 → 1.45; stake:true on exactly the SECOND card (the-tapestry-shown, its existing staked phase). first-knock reads as the thread you did not know you were
    // BOSS — TIERED, with a THREE-card tier 1 (the exception on the roster).
    // The smoking mirror READS you before it escalates, and that read is the
    // branch card `smoke-through-the-seams` in its original third slot: it
    // belongs to his opening, not to his escalation, so tier 1 runs
    // 0.85/1.35/1.40(branch) and the gates start after it (1.30 → 1.55).
    // Keeping the branch ungated also keeps its fork committing at the phase
    // boundary from round 3 on, exactly as it shipped.
    'enemy-tezcatlipoca': {
        tier1: ['the-tally-mark', 'the-kept-reflection', 'smoke-through-the-seams'],
        tier2: ['the-count-completes'],
        tier3: ['oc-the-thread-cut-short'],
    }, // BOSS, 4 phases preserved, branch kept in its original third slot. Ramp 0.85 → 0.95 → 1.2 (else fork; 0.5 rider-heavy then fork) → 1.35; stake:true on exactly the SECOND card (the-kept-reflection, its 
    // BOSS — TIERED (7 cards). The door is kept open (1.30/1.35), the frame
    // and the margin note (1.45/1.15), then WHAT SHUTS STAYS SHUT, the proof
    // completed, the question that eats (1.60/1.60/1.40). Act I
    'enemy-the-doorwarden': {
        tier1: ['litany-of-thresholds', 'the-door-kept-open'],
        tier2: ['the-bronze-frame', 'ap-the-margin-note'],
        tier3: ['what-shuts-stays-shut', 'ap-the-proof-completed', 'ap-the-question-that-eats'],
    }, // Act I labyrinth boss (L8), 4 cards matching the current phase count. Escalation: 1.0 opener -> 0.9 stake wager (SECOND card, per boss law) -> 1.2 MARK punish -> 1.4 spike with MARK i3 cashing 
    // BOSS — TIERED. The drawer opens (1.30/1.35), you are corrected in oak
    // and iron (1.45/1.30), the errata is read aloud and the shelf closes
    // (1.60/1.50). Act II
    'enemy-the-index': {
        tier1: ['the-drawer-opens', 'filed-under-kindling'],
        tier2: ['oak-and-iron', 'ap-the-corrected-you'],
        tier3: ['the-errata-read-aloud', 'ap-the-shelf-closes'],
    }, // Act II labyrinth boss (L12), 4 cards matching the current phase count. Escalation: 1.0 curse-injecting opener -> 0.9 stake wager (SECOND card) -> 1.2 body BLEED spike -> 1.4 POISON i3 spike; the DoT 
    // BOSS — TIERED (5 cards → tier 3 at round 5). Your position improved and
    // a courteous concession (1.30/1.35), signed in thirds (1.45), then your
    // OPENING perfected against you and every door at once (1.60/1.55). Act III
    'enemy-the-sophist': {
        tier1: ['your-position-improved', 'a-courteous-concession'],
        tier2: ['signed-in-thirds'],
        tier3: ['your-opening-perfected', 'ap-every-door-at-once'],
        tier3AtRound: 5,
    }, // Act III finale (L16), 4 cards matching the current phase count. Escalation: 1.0 opener at rungs:2 (deliberately objection-vulnerable, per the Phase 33b softening) -> 0.9 heart stake wager (SECOND card
    // UNIQUE — TIERED (5 cards → tier 3 at round 5). Card ORDER and every
    // authored number are preserved exactly (the L110 calibration); only the
    // round gates are added. 1.30/1.35 → 1.45 → 1.60/1.45.
    'enemy-the-incompleteness': {
        tier1: ['the-sentence-outside', 'the-true-thing-about-you'],
        tier2: ['a-new-axiom'],
        tier3: ['you-cannot-go-on', 'ap-the-axiom-you-stand-on'],
        tier3AtRound: 5,
    }, // Unique L110 ceiling, 4 cards, CALIBRATION PRESERVED EXACTLY: damageWeights 0.21 / 0.232 / 0.271 / 0.326, stances mind/heart/mind/mind, debuff_mark at intensities 2/2/3/3, stake on the SECOND card, ene
    // rangda — the widow-queen (4 phases; her swayCleanse identity on the
    // staked second card, the studied grief as the spike).
    // BOSS — TIERED. The keening and the accusation (1.30/1.35), the versicle
    // and the thurible (0.90/1.25 — the widow works the room), then THE MASK
    // COMES AWAY and the reliquary is emptied (1.60/1.45). The reliquary card
    // carries its own `unlockAfterRound: 3`; the tier-3 gate supersedes it.
    'enemy-rangda': {
        tier1: ['the-widows-keening', 'syllabus-of-accusation'],
        tier2: ['bc-plague-versicle', 'bc-the-thurible-swung'],
        tier3: ['the-mask-comes-away', 'bc-sig-the-reliquary-emptied'],
    },
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
    // adjust-enemies pass 1 (2026-09-05) — caverns backfill, composed from
    // the shared canon (no new cards needed).
    'enemy-ninth-rung-spider': ['first-knock', 'the-downbeat', 'the-count-completes'], // 0.85 → 0.95 → 1.35: the warning vibration, the counted bite, the count completing in venom.
    'enemy-spore-warden': ['small-god-on-credit', 'collection-rounds', 'compound-interest', 'the-calamity-spoken'], // 0.85 → 0.95 → 1.15 → 1.3 (elite, 4 cards, no stake): the first spore on credit, the collection in person, the cloud compounding round over round, the calamity finally spoken as rot.
    'enemy-toll-sergeant': ['first-notice', 'gc-the-begging-fist', 'the-toll-entire'], // 0.85 → 0.95 → 1.3: the fee posted nowhere, the fist that explains it, the toll entire.
    'enemy-guild-knife': ['first-notice', 'clause-of-objections', 'collection-rounds', 'execution-of-the-agreement'], // 0.85 → 0.9 → 1.0 → 1.4 (elite, 4 cards, no stake): served, objected, collected, executed. Punctually.
    'enemy-the-factor': ['small-god-on-credit', 'compound-interest', 'foreclosure-in-person'], // 0.8 → 1.15 → 1.35: he lends you the opening on credit and forecloses in person.
    'enemy-wharf-shrike': ['gc-where-the-reach-begins', 'dp-ninth-bell', 'gc-the-alms-you-owed'], // 0.9 → 1.2 → 1.35: the strike, the patient hook (the Ninth Bell's held round IS the larder wait), the collection.
    // BOSS — TIERED (5 cards → tier 3 at round 5). Appeal denied and weighed
    // (1.00/1.30), the toll entire (1.25), then execution and the final
    // demand (1.55/1.50). Every boat goes in his book, eventually.
    'enemy-the-harbormaster': {
        tier1: ['adjusters-visit', 'the-weighing'],
        tier2: ['the-toll-entire'],
        tier3: ['execution-of-the-agreement', 'do-final-demand'],
        tier3AtRound: 5,
    }, // BOSS, 4 cards: the appeal denied (0.95), THE WEIGHING staked in exactly the second slot (0.9 — the scale is his), the toll entire (1.3), the agreement executed (1.4 spike).
    // ── Phase W4 (2026-08-31) — the river crossing and the town beyond it.
    // Seven decks composed from the shared canon (no new cards needed): the
    // river leans drowned-parish/gnawing-court, the town leans debt-office
    // and gnawing-court. Escalation law holds on each (final card is the
    // spike); only the two bosses wager the coveted die, staked on their
    // second card automatically via `wagersCovetedDie`.
    'enemy-reed-ambusher': ['dp-undertow-grip', 'gc-where-the-reach-begins', 'gc-the-alms-you-owed'], // 0.95 → 0.9 → 1.35: the grip from the reeds, closing the reach, the full taking.
    'enemy-toll-skiff': ['first-notice', 'compound-interest', 'the-toll-entire'], // 0.85 → 1.15 → 1.3: the fee posted at the bow, the interest compounding mid-river, the toll entire.
    'enemy-weir-widow': ['dp-salt-rescue', 'dp-wet-congregation', 'dp-drowning-drill', 'dp-grief-swell', 'dp-your-name-on-the-bell'], // 0.8 → 0.9 → 1.15 → 1.3 (elite, 4 cards, no stake): the bad rescue, the chorus at the weir, the drill, the grief that drowns you.
    // adjust-enemies pass 2 (2026-09-07) — connecting-river thinness backfill,
    // composed from the shared drowned-parish canon (no new cards needed).
    'enemy-drift-anchor': ['dp-wet-congregation', 'dp-undertow-grip', 'dp-drowning-drill'], // 0.9 → 0.95 → 1.15: the cold hail, the grip taking hold, the drill that finishes it.
    // BOSS — TIERED (5 cards → tier 3 at round 5). Notice posted and weighed
    // (0.85/1.30), collection in person (0.95), then the agreement executed
    // and the bailiff of hours (1.55/1.55).
    'enemy-the-waterreeve': {
        tier1: ['first-notice', 'the-weighing'],
        tier2: ['collection-rounds'],
        tier3: ['execution-of-the-agreement', 'do-the-bailiff-of-hours'],
        tier3AtRound: 5,
    }, // BOSS, 4 cards: notice posted at the crossing (0.85), THE WEIGHING staked in exactly the second slot (0.9 — every boat goes in his book), collection in person (1.0), the account executed (1.4 spike).
    'enemy-dowry-collector': ['first-notice', 'collection-rounds', 'the-toll-entire'], // 0.85 → 1.0 → 1.3: the appraisal posted, collected in person, the toll entire.
    'enemy-the-kept-suitor': ['gc-the-standing-invitation', 'gc-the-howl-at-being-answered', 'gc-the-patient-inch', 'gc-the-alms-you-owed'], // 0.9 → 0.9 → 1.1 → 1.35 (elite, 4 cards, no stake): the invitation nobody accepted, the howl at being answered anyway, the patient inch, the full taking.
    // adjust-enemies pass 2 (2026-09-07) — town-across-river thinness backfill,
    // composed from the shared debt-office canon (no new cards needed).
    'enemy-the-adjuster': ['small-god-on-credit', 'adjusters-visit', 'foreclosure-in-person'], // 0.85 → 1.0 → 1.3: the claim opened on credit, the visit that prices it, the foreclosure in person.
    // adjust-enemies pass 6 (2026-09-11) — the-capital thinness/overlap
    // backfill, composed from the shared debt-office canon (no new cards
    // needed — the capital is that archetype's own home city).
    'enemy-the-stamper': ['first-notice', 'collection-rounds', 'do-the-second-notice'], // 0.85 → 0.95 → 1.15: the docket opened, the queue processed by hand, the second and harsher notice stamped shut.
    'enemy-the-underclerk': ['condolences-itemized', 'compound-interest', 'do-the-garnishment'], // 0.9 → 1.15 → 1.25: the itemized condolences, the interest compounding on the file, the appeal garnished at source.
    // BOSS — TIERED (5 cards → tier 3 at round 5). Appeal denied and the
    // objection clause wagered (1.00/1.30), the toll entire (1.25), then the
    // ruling executed and the interest made flesh (1.55/1.60).
    'enemy-the-portreeve': {
        tier1: ['adjusters-visit', 'clause-of-objections'],
        tier2: ['the-toll-entire'],
        tier3: ['execution-of-the-agreement', 'do-the-interest-made-flesh'],
        tier3AtRound: 5,
    }, // BOSS, 4 cards: the appeal denied (0.95), the objection clause staked in exactly the second slot (0.9 — every ruling crosses his desk first), the toll entire (1.3), the ruling executed (1.4 spike).
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
    unlockAfterRound: number | undefined,
): AuthoredThreatStep {
    if (card.branch) {
        // A branch step has no phase-level fields of its own — `resolveAuthored`
        // reads the gate off the ELSE (pending) fork, so both forks carry it.
        return {
            branch: {
                condition: card.branch.condition,
                then: { ...faceToPhase(card.branch.then), isFinalPhase: isFinal, unlockAfterRound },
                else: { ...faceToPhase(card.branch.else), isFinalPhase: isFinal, unlockAfterRound },
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
        curseCardId: card.curseCardId,
        rungs: card.rungs,
        stake: stake || undefined,
        stanceCheck,
        unlockAfterRound,
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

/** The card grade → tier reading the derivation uses when a deck authors none. */
const GRADE_TIER: Readonly<Record<EnemyCardGrade, DeckTier>> = Object.freeze({
    common: 1, escalation: 2, signature: 3,
});

/** A deck resolved to its play order plus the round each of its tiers opens. */
export interface DeckTierPlan {
    /** Card ids in compiled (play) order. */
    readonly cardIds: readonly string[];
    /** `tiers[i]` is the tier of `cardIds[i]`. Non-decreasing by construction. */
    readonly tiers: readonly DeckTier[];
    /** Round each tier becomes reachable. Non-decreasing; tier 1 is always 1. */
    readonly tierRounds: Readonly<Record<DeckTier, number>>;
    /** True when the deck hand-authored its tiers (a `TieredEnemyDeck`). */
    readonly authored: boolean;
}

/**
 * Resolves a deck to its ROUND-KEYED TIER PLAN — the one place that decides
 * which card sits in which tier and when that tier opens.
 *
 * An authored `TieredEnemyDeck` is taken as written (its gates clamped
 * monotonic so tier 3 can never open before tier 2). A flat deck is DERIVED
 * from the cards' `grade`, running-max'd down the deck so a tier never
 * reverts, with the opening pair pinned to tier 1 (`TIER1_MIN_CARDS`).
 *
 * Returns null for an unknown enemy id.
 */
export function planDeckTiers(enemyId: string): DeckTierPlan | null {
    const spec = ENEMY_DECKS[enemyId];
    if (!spec) return null;

    if (isTieredDeck(spec)) {
        const t2 = spec.tier2 ?? [];
        const t3 = spec.tier3 ?? [];
        const round2 = Math.max(1, spec.tier2AtRound ?? TIER2_DEFAULT_ROUND);
        const round3 = Math.max(round2, spec.tier3AtRound ?? TIER3_DEFAULT_ROUND);
        return {
            cardIds: [...spec.tier1, ...t2, ...t3],
            tiers: [
                ...spec.tier1.map((): DeckTier => 1),
                ...t2.map((): DeckTier => 2),
                ...t3.map((): DeckTier => 3),
            ],
            tierRounds: { 1: 1, 2: round2, 3: round3 },
            authored: true,
        };
    }

    const cardIds = spec;
    let running: DeckTier = 1;
    const tiers = cardIds.map((cardId, i): DeckTier => {
        // The opening exchange is tier 1 whatever it is holding: rounds 1-2
        // ARE the deck's top, and gating them would gate the fight's first act.
        if (i < TIER1_MIN_CARDS) return 1;
        const card = ENEMY_CARD_LIBRARY[cardId];
        if (!card) throw new Error(`Enemy deck '${enemyId}' names unknown card '${cardId}'.`);
        const tier = GRADE_TIER[card.grade];
        if (tier > running) running = tier;
        return running;
    });

    const tierRounds: Record<DeckTier, number> = { 1: 1, 2: 1, 3: 1 };
    let previous = 1;
    for (const tier of [2, 3] as const) {
        // A tier the deck never reaches inherits the previous tier's round, so
        // the map stays monotonic and reads sanely for callers.
        const round = tiers.includes(tier)
            ? Math.max(previous, tier === 2 ? TIER2_DEFAULT_ROUND : TIER3_DEFAULT_ROUND)
            : previous;
        tierRounds[tier] = round;
        previous = round;
    }
    return { cardIds, tiers, tierRounds, authored: false };
}

export function compileEnemyDeck(enemyId: string): AuthoredThreatStep[] {
    const plan = planDeckTiers(enemyId);
    if (!plan) return [];
    const { cardIds, tiers, tierRounds } = plan;
    // An authored stake list wins; otherwise fall back to the default
    // (a boss/unique wagers on its second card).
    const authoredStakes = DECK_STAKES[enemyId];
    // The compiled gate is a RUNNING MAX: a card's own authored
    // `unlockAfterRound` and its tier's round both push it later, never
    // earlier, and no phase can ever open before the one in front of it.
    let gate = 0;
    return cardIds.map((cardId, i) => {
        const card = ENEMY_CARD_LIBRARY[cardId];
        if (!card) throw new Error(`Enemy deck '${enemyId}' names unknown card '${cardId}'.`);
        const stake = authoredStakes
            ? authoredStakes.includes(i)
            : i === 1 && wagersCovetedDie(enemyId);
        // ANTI-STALL: the opener is never round-gated. It is the phase the
        // encounter starts on, so a gate there could lock the fight out of a
        // legal action; every later phase can only hold the pointer at the
        // last reachable one, which always has an action.
        let unlockAfterRound: number | undefined;
        if (i === 0) {
            unlockAfterRound = undefined;
        } else {
            gate = Math.max(gate, card.unlockAfterRound ?? 0, tiers[i] > 1 ? tierRounds[tiers[i]] : 0);
            unlockAfterRound = gate > 1 ? gate : undefined;
        }
        return cardToStep(
            cardId, card, i === cardIds.length - 1, stake,
            DECK_STANCE_CHECKS[enemyId]?.[i], unlockAfterRound,
        );
    });
}

/** Every enemy id that fights by deck (the full roster). */
export const ENEMY_DECK_IDS: readonly string[] = Object.freeze(Object.keys(ENEMY_DECKS));
