# Phase R7 — Engine purge

## Sources

- Part plan: [`plan/revamp/engine.md`](../revamp/engine.md) § R7 (the block
  table and its three-way split).
- Reset rules: [`plan/revamp/README.md`](../revamp/README.md) §5.
- Decisions: **D50** (delete carrier-less engine mechanics; git history is
  the archive), **D51** (card types Attack / Skill / Spell, R7b), **D45**
  (carrier rule), **D47** / **D63** (befriend → mercy is the only non-lethal
  ending; RELENT and CONDEMN cut, R7c), **D8** (card upgrades parked, the
  module stays), **D20** (die growth and `bankedSouls` stay), **D58** (nothing
  is authored), **D37** (the card hold), **D64** (part plan ratified).
- T, 2026-09-28 (quoted in the part plan): delete the card mechanic kinds
  with no carrier — "git history is the archive."
- Siblings: phase R2b (`872de5a7`) for an engine-system deletion with a
  carrier sweep; phase R6b (`f0a230f5`) for a type-union shrink guided by the
  compiler.

## Outcome

The combat engine resolves only what a live card prints. A card's special
mechanics are `deal` and `guard`; its FREE line deals, guards or applies a
status; nothing on a `Card` names a die rider, a fate line or a fallen line.
The encounter state carries no ledger that only a deleted mechanic fed, and
no test registers a retired-verb fixture card to keep a dead verb alive.

## Split (from the part plan, 2026-09-28)

- **R7a — kinds, handlers, dead fields, state, fixtures.** Scope 1–7 below.
- **R7b — pricing, synergy, themes, deck draft and presets, reward
  steering, card types → Attack / Skill / Spell** (with the oath / hex zones
  and `persistentEffect`, which exist only for the two retired types).
- **R7c — alt-win systems (sway / PLEA, premises / CHARGE, capitulation,
  peroration, friendship increments), carrier-less effects, dead
  `executeCard` branches, test-only modules, the closing carrier sweep.**

Each row is one tick, main green between them. The R7b and R7c scopes are
refined by the tick that ships them against the tree R7a leaves.

## Scope — R7a

The live carriers, verified 2026-09-30: the grey office (`deal` 5, `guard` 5,
`debuff_vulnerable` via `combatEffects`; FREE `damage` 2, `guard` 2,
`applyEffect` vulnerable) and the relic signatures (their own
`SignatureSkill` kinds `guard` / `mercy`, not `CardSpecialMechanic`). Enemy
cards and hazard cards do not use `CardSpecialMechanic`.

1. **The union** (`Cards/types.ts`): `CardSpecialMechanic` becomes
   `{ kind: 'deal'; amount } | { kind: 'guard'; amount }`.
   `CARD_SPECIAL_MECHANIC_KINDS` becomes `['deal', 'guard']` (its
   exhaustiveness guards stay). `deal`'s `hits` and `pierce` go with the
   kinds: no live card prints either, and `pierce`'s only reader (HIDE) went
   in R2b. The 47 other kinds go: `strip_random_buff`, `befriend_attempt`,
   `rupture`, `siphon`, `barrier`, `riposte`, `reroll_spent`, `refresh_die`,
   `convert_die_color`, `create_temporary_die`, `grant_pip`, `overheat`,
   `bank_spent_die`, `forge_floating_die`, `float_x_die`, `stagger`,
   `lock_stance`, `foretell`, `omen`, `premise`, `peroration`,
   `spend_premises`, `spend_all_pips`, `recoil`, `recoil_x`, `extend_dots`,
   `convert_dots`, `boost_all_dots`, `soul_gain`, `consume_affliction`,
   `reap`, `reap_all`, `turnabout`, `sway`, `echo`, `echo_next_spell`,
   `reprise`, `replay_last`, `conjure_card`, `immolate`, `purge_self`,
   `rider`, `wrath`, `flay`, `twin`, `chain`, `execute`, `overkill`.
2. **Handlers**: every branch that reads a deleted kind, in
   `Combat/combat.engine.ts` (the `playBottomAction` mechanic switch, the
   omen and peroration hooks in `processBetweenPhases` / `gainPremises`, the
   `projectRupture*` / `projectSiphonHeal` / `recoilXRange` / `projectReapAll`
   projections and their `projectCombatOutcome` reads, `needsReprisalChoice`,
   the `chosenX` / `reprisalCardId` / `omenClaim` play arguments),
   `Combat/combat.cards.ts`, `Combat/combat.card-text.ts`,
   `Combat/stat-scaling.ts`, `Combat/combat.sim-policies.ts`,
   `Combat/combat.card-complexity.ts`, `Cards/card-keywords.ts`,
   `Cards/cards.pricing.ts` (only the compile follow-through; R7b deletes the
   module) and `Cards/card-upgrades.ts` (the patchable-field lists shrink to
   the surviving fields; the module stays, D8).
3. **Dead card fields** (`Card`): `threshold`, `dieBonus`, `fate`, `fallen`,
   `intentionallyAsymmetric`, and the engine paths that fire them (the
   resonance-threshold, die-bonus, fate and fallen rider collection).
   **`CardRider`** keeps `damage`, `guard` and `applyEffect` (the three FREE
   verbs a grey card prints); its other 26 fields and their
   `applyRiderToState` / `riderText` / scaling / upgrade branches go.
4. **Encounter state** (`Combat/combat.encounter.types.ts`) — fields whose
   only writer was a deleted mechanic or rider: `echoNextSpell`, `wrath`,
   `chain`, `chainFedThisTurn`, `flay`, `twinArmed`, `lastSpellCardId`,
   `lastSpellRound`, `recoilPaidThisTurn`, `akrasiaDebt`, `rungsDeniedTotal`,
   `stanceLockedNext`, `pendingOmens`, `conjuredUids`, `omenHits`, and
   their events (`twin-fired`, `echoed`, `threshold-fired`, `die-bonus-fired`,
   …) and scaler params (`scalePlayerHit`'s wrath / chain / flay / execute).
5. **Fixtures**: `test-utils/retired-verb-cards.ts` is deleted. Each suite
   that loads it is deleted with its subject or rewritten onto the grey
   office. Suites pinned to a deleted kind are deleted or cut to the
   surviving cases (never weakened to keep a deleted verb alive).
6. **Mobile follow-through** (type-check requires it, per the part plan):
   `state/presenters/combat-encounter.engine.ts` and the combat components
   lose the readouts of deleted state (WRATH, FLAY, TWIN, the rupture /
   recoil-X / reprisal projections, the reprisal picker);
   `state/combat/keywords.ts` and its test follow the shrunk
   `CARD_SPECIAL_MECHANIC_KINDS`.
7. **Carrier sweep (D45), last**: any glossary / atlas row, glyph or gloss
   left printing only a deleted kind or rider goes (both workspaces).

### As shipped (R7a, 2026-09-30)

Scope 1–7 landed, with these calls made against the tree:

- **`staggerRungs` stays** with the rung ladder (`computeRungDenial`, boss
  rung growth, BACKFIRE's drip, the mobile rungs readout and the RUNGS
  system term). STAGGER was its only feeder, so the whole ladder is now
  carrier-less; R7c deletes it with the other carrier-less effects.
- **Pricing went whole** (`Cards/cards.pricing.ts` and its suite), pulled
  forward from R7b: it had no live importer and 131 compile errors to patch
  otherwise.
- **The PAID-line rider collector went whole**, synergy's firing included
  (it fed the same collector; no live card carries a synergy). R7b deletes
  the `synergy` type, `synergy-predicates.ts` and the printed synergy line.
- **Handler-only helpers went with their handlers**: the RUPTURE cap and
  per-stack fuel, REAP erosion, the DEBT tiers, `consumeAfflictions` /
  `consumeOneAffliction` / `consumeMarks`, OVERHEAT (`overheatReserve`), the
  REROLL bag (`rerollSpentDice`, `rollCombatDieColor`), `gainPremises`,
  `gainSway`, `applyForetell`, the chain settle and the omen boundary.
- **Mobile**: the X-cost stepper, the REPRISE picker, the WRATH / CHAIN /
  TWIN / FLAY readouts and the BARRIER / RIPOSTE / SIPHON / RUPTURE / REAP /
  FORGE face kinds are gone; the GUARD and PIP glosses lost their clauses
  for deleted verbs (the PIP numbers now match the engine's
  `PIP_INTENSITY_BONUS` 2 / `PIP_GUARD_BONUS` 5).

## Scope — R7b (refined against the tree R7a left, 2026-09-30)

1. **Synergy**: the `CardSynergy` / `SynergyPredicate` /
   `SynergyStatePredicate` types, `Card.synergy`, `CardUpgrade.synergy`,
   `synergy-predicates.ts`, `statePredicateText`, `isCombatSynergySatisfied`
   and the printed synergy line (`CombatCard.dieLines`, whose only producer it
   was).
2. **Themes**: `card-themes.ts`, `Card.theme`, `THEME_KEYWORDS` and the
   theme reads in upgrades, stage profiles, `executeCard`'s curse ownership
   leg and the catalog export.
3. **Card types → Attack / Skill / Spell (D51)**: `CardType` becomes
   `'attack' | 'skill' | 'spell'`; Blow is an Attack, Ward a Skill, Word a
   Spell. The oath / hex zones go whole: `persistentZone`, `enemyAttachments`,
   the timed `tempZone` / `enemyTempAttachments`, `enemyEnchantments`,
   `playerAttachments`, `playFreeEnchant`, the PAID zone routing, the timed
   tick, their events, `FREE_ENCHANT_ROUNDS`, `Card.persistentEffect` and the
   `oath` / `hex` verb classes.
4. **Deck draft and presets**: `combat.deck-draft.ts`,
   `combat.starter-deck-presets.ts` (the grey deck is `STARTING_CARD_IDS`),
   the sims' `preferredFocus`, the CLI `draft:` / `preset:` / `+swap:` /
   `policy-pick` grammar and `--sandbox`, and `cards.sandbox-sets.ts`.
5. **Reward steering**: the theme pull, the dominant-theme keyword guarantee,
   the rarity weights, the random-picks gate, `extraPool`,
   `combat.reward-draft.sim.ts`, `card-keywords.ts` and `keywordsOf`. The
   reward itself stays (D44): a uniform draw over the library.
6. **Empty registry**: `cards.allies.ts` (no ally, no grant path).
7. **Mobile follow-through** (type-check requires it) and the carrier sweep:
   OATH and HEX leave the mobile keyword glosses and both glyph tables.

### As shipped (R7b, 2026-09-30)

- **`card-keywords.ts` went, not fixed.** The part plan asked for a fix
  (it mapped neither DEAL nor VULNERABLE); its only consumer was the reward
  keyword pull, so with the pull gone it had no reader. Mobile keeps its own
  presentation mapping (`state/combat/keywords.ts`), and B4 records the
  keyword surface.
- **The playtest matrix keeps its shape on two deck kinds**: `grey` (the
  default) and `cards:`. Per-preset rollups became per-deck rollups
  (`deckSummaries`, `deckComplexity`); `PRESET_DOCTRINE_WIN_BANDS` is
  `DOCTRINE_WIN_BANDS`. The dice-economy sim runs the grey deck per stage.
- **`cards.sandbox.ts` stays**: dozens of suites register test cards
  through it. Only the named-set layer and the CLI `--sandbox` flag went.
- **The die-economy canary flipped back to a guard.** The matrix now runs the
  full 10-card grey deck instead of 6-card drafts, and its longer fights bank
  and ripen Reserve dice (2 verbs); the objective suite asserts `> 0` again.
- **Mobile**: the starter bundle is one literal (the save's `bundle:grey`
  flag names it); the deck screen groups ATTACKS / SKILLS / SPELLS; the oath
  / hex face kinds, standing chips, duration footers, die lines and group
  blurbs are gone.
- **`cards.haunts.ts` waits for R7c** with the `executeCard` haunt branch.

## Scope — R7c (refined against the tree R7b left, 2026-09-30)

R7a already deleted every WRITER of the alt-win currencies (`gainSway`,
`gainPremises`, the PLEA / CHARGE / SENTENCE kinds), so what is left is
state, a decay, an offer and readouts. The tick that took R7c found the
row too big for one tick (the alt-wins across both workspaces, plus the
effects, the rung ladder, `executeCard` and the test-only modules) and split
it, like R2 and R3:

- **R7c — the alt-win systems.**
  1. **Engine state and events**: `sway`, `premises`, `premiseMilestoneTotal`,
     `peroration`, `swayMilestone*Fired`, `capitulationChoiceActive`,
     `capitulationDeclined`; the `premise-*`, `peroration-fired`, `sway-*`
     and `capitulation-*` events; the PLEA decay and `SWAY_DECAY_PER_TURN`.
  2. **The outcomes**: `CombatOutcome` loses `capitulate` and `concede`;
     `selectCapitulationChoice` and the capitulation offer go. Befriend →
     mercy (`selectMercyChoice`) is the only non-lethal ending (D47, D63).
  3. **Constants**: `capitulateThreshold`, `concedeFloorFor`, the
     `CONCEDE_PREMISES_*` ladder, the sway milestones and the premise
     milestones (`Combat/effects.ts`); `outgoingSwayGainMulPct`.
  4. **Sims and CLI**: the per-policy `capitulationChoice`, the
     capitulate/concede win-path columns, the CLI yield prompt.
  5. **Region consequences**: `GameState.regionConsequences` (never written)
     and its only reader, the spared-region boss buff `buff_absolved`, go;
     save hop v32 → v33 drops the slice.
  6. **Mobile**: the PLEA / CHARGE meters, the Sentence track, the
     capitulation modal, the PLEA-decay log line, the capitulate / concede
     summary hues, the CONDEMN face difficulty plumbing, and the PLEA /
     CHARGE glyph and family entries.
- **R7c2 — the rest of the row**: friendship increments (`incrementsFriendship`
  and the `executeCard` friendship branch), the carrier-less effects and
  `fixture-effects.ts`, the STAGGER rung ladder (`staggerRungs`,
  `computeRungDenial`, boss rung growth, BACKFIRE), the dead `executeCard`
  branches (haunt / curse / enemy-caster, `cards.haunts.ts`), the test-only
  modules (`World/quest-reward.ts`, `initializeCombat`) and the closing
  carrier sweep (D45).

### As shipped (R7c, 2026-09-30)

- **The Labyrinth's Borrowed Premise stays.** It is a Labyrinth debt ledger
  (`labyrinth.engine.ts`), not the combat CHARGE tally, and never fed it.
- **`buffs.library.json` is empty, not deleted.** The loader and the
  buff/debuff split stay; tests that needed a buff use a fixture
  (`fixture_armor` in mechanics, a test-local buff in mobile).
- **The DoT foresight meter keeps its component**, renamed `HudMeter` with
  the alt-win `outcome` label gone; the FE-022 suite that pinned the PLEA /
  CHARGE labels went with its subject.
- **The CLI and sims keep the befriend path**: `mercies` now counts the
  `mercy` cell only.

### As shipped (R7c2, 2026-09-30)

The tick that took R7c2 split it once more, like R2, R3 and R7c:

- **Shipped in R7c2**: the STAGGER rung ladder (`computeRungDenial`,
  `staggerRungs`, `bossRungGrowth`, the rung constants, authored `rungs` on
  threat phases and enemy cards, the `rung-regrown` event, the coveted die's
  `stagger` method) and BACKFIRE (`backfirePerRung`, its drip and event,
  `fixture_backfire`); friendship increments and the counter's whole
  predicate (`incrementsFriendship`, `friendshipCounter`,
  `isBefriendAttemptEligible`, `FRIENDSHIP_COUNTER_MAX`, `roundsThreshold`,
  `defaultFallback`), leaving `hpGate` as The Open Hand's one gate; the dead
  `executeCard` branches (haunt ownership, enemy caster, `cards.haunts.ts`);
  the test-only modules `World/quest-reward.ts` and `combat.reducer.ts`.
  Mobile lost the intent rung pips, the RUNGS system term, the BACKFIRE face
  kind and float, and the tutorial copy teaching rungs; the atlas lost RUNGS.
- **Learn Card stays.** `getAvailableCards` / `learnCard` feed the mobile
  level-up modal; the part plan's "always empty" note predates it.
- **Suites rewritten, not weakened**: the deny and weaken cases that leaned
  on STAGGER now use live library effects (Petrify's skip-turn, Quarter's
  outgoing damage).

## Scope — R7c3 (the rest of R7c2)

1. **Payload keys with no library carrier** (`Effects/types.ts`), with their
   readers, aggregators and helpers in `Combat/effects.ts`,
   `effect-modifiers.ts`, `combat.engine.ts`, `stat-scaling.ts` and the
   mobile presenter's honest kinds: e.g. `regeneration`, `rollModifier`,
   `rollModifierPerIntensity`, `defenseModifier`, `reflectDamage`,
   `decayOnHeal`, `outgoingThreatDamageMulPct`, `suppressesThreatRiders`,
   `powerMulPct`, `healingReceivedMulPct`, `consumedOnUse`,
   `nextDotTierUpgrade`, `restrictsSurgeAccess`, `forcesWeakTierNextPlay`,
   `blocksAdvantage`, `reducesControlAccuracy`, `deniesAllyBuffTargeting`,
   `soloFightFallback`, `forceWildOnNextDie`, `colorChoice`, `cleanse`.
   Re-verify each against `debuffs.library.json` first: a key a library
   effect prints stays. The part plan's named helpers
   (`getStudyMarkIntensity`, `extendRandomBuffDuration`, `applyDrain`,
   `applyDispel`, `consumeDotEffects`) go if still unread.
2. **Stance-keyed keys stay for R7d**: `actionRestriction.forcedStance` /
   `blockedStances`, `advantageModifier`, `revealsStance`,
   `damageTakenMultForStance`, `blursStanceHints`, `lockedStance`.
3. **`test-utils/fixture-effects.ts`** goes with the channels only it
   exercises; suites that used a fixture for a surviving channel move to a
   library effect.
4. **The closing carrier sweep (D45)**: every glossary / atlas row, glyph,
   family entry and gloss left without a carrier, both workspaces.

### As shipped (R7c3, 2026-09-30)

- **Payload keys gone**: `regeneration`, `rollModifier`,
  `rollModifierPerIntensity`, `defenseModifier`, `reflectDamage`,
  `dotModifiers.decayOnHeal`, `outgoingThreatDamageMulPct`,
  `suppressesThreatRiders`, `powerMulPct`, `healingReceivedMulPct`,
  `consumedOnUse`, `nextDotTierUpgrade`, `restrictsSurgeAccess`,
  `forcesWeakTierNextPlay`, `blocksAdvantage`, `reducesControlAccuracy`,
  `deniesAllyBuffTargeting`, `soloFightFallback`, `forceWildOnNextDie`,
  `colorChoice`, `cleanse`. With them: the roll-penalty weaken/deny
  (`THREAT_WEAKEN_*`, `THREAT_DENY_AT`, `getActiveRollModifier`), the armor
  soak, THORNS (`getThornsReflect`, the `thorns-reflected` event), regen and
  drain, the heal multiplier, the threat-damage multiplier, DOUBT /
  OVEREXTENDED / BLIND riders and `consumeEffect`, the consumable cleanse
  branch, and the unread helpers (`getStudyMarkIntensity`, `removeRandomBuff`,
  `extendRandomBuffDuration`, `applyDispel`, `consumeDotEffects`).
- **The round clock is round start only.** No library DoT printed `tickPhase`
  or a `round-start` / `round-end` trigger; Creeping Doom (no trigger) is the
  round-clock carrier. `tickPhase`, the two round triggers, `dotEnd` and the
  round-end DoT tick went; `processRoundEndEffects` only counts down.
- **`fixture-effects.ts` is deleted.** Suites moved to library effects
  (Creeping Doom, Mark, Petrify, the live debuff tiers); stance-keyed shapes
  stay as test-local fixtures until R7d.
- **DISRUPT stays for R7d.** Its surfaces are now action and stance, so
  `DISRUPT_DENY_AT` (3) is out of reach; R7d removes the stance surface and
  the meter with it. The unreachable deny test went; the below-threshold one
  stays.
- **Carrier sweep**: mobile's honest kinds regen / thorns / exposure / doubt /
  sensoryNull / isolated / overextended / clarity, the regen / drain / thorns
  glyph kinds, the dead tooltip and shop-ware payload lines, and the
  `KEYWORD_FAMILY` rows no engine carrier prints. `docs/effects.md` keeps its
  Superseded banner for R10c.

## Scope — R7d (stance removal; refined against the tree R7c3 left, 2026-10-01)

Part plan `plan/revamp/engine.md` § R7d; D65 (T: "I only want the RPS gone,
card-colour/dice-colour stay"). The tree R7c3 left still carries the whole
open-stance layer. No library effect prints a stance-keyed payload key
(`debuffs.library.json` holds Poison, Bleed, Mark, Vulnerable, Quarter,
Creeping Doom, Petrify; Petrify is `skipTurn`), so every stance-keyed key is
carrier-less.

**Split, like R2, R3 and R7c** (one tick has a 75-minute ceiling and main
stays green between rows):

- **R7d — the RPS layer, engine and mobile together** (the compiler couples
  them through `@mechanics`):
  1. Player stance: `playerStance`, the `stance-shifted` event, the stance
     half of `applyStanceAndMomentumV2`.
  2. The phase-end check: `resolveStanceCheck`, `stanceCheck` on threat
     phases, forks and enemy decks, `defaultStanceCheck` and its backfill,
     `DECK_STANCE_CHECKS`, the `stance-check-resolved` event, the yield's
     +1 Conviction and the Coveted Die's `'yield'` claim (block stays),
     `READ_DAMAGE_MULT` and `CombatReadResult`.
  3. Enemy stances: `enemyStance` and `stanceHint` on threat phases, forks,
     enemy cards and enemies; `dominantStance` / `rotateStance` /
     `DEFAULT_STANCE_HINTS`; `currentPhaseStance`.
  4. Reveals and their fogs: `revealedStances`, `isPhaseStanceRevealed`,
     `revealedCurrentStance`, `isStanceReadoutBlurred`, the `stance-revealed`
     and `stance-locked` events, the ROOT lock in `processBetweenPhases`.
  5. Stance-keyed payload keys and readers: `actionRestriction.forcedStance`
     / `blockedStances` (charm, silence), `advantageModifier`,
     `revealsStance`, `damageTakenMultForStance` and `getStanceVulnMult`,
     `blursStanceHints`, `lockedStance`, the `lock_stance` mapping;
     `canAct` loses its requested-stance parameter (skipTurn only).
  6. DISRUPT: with the stance surface gone its meter tops out at one pip
     (`DISRUPT_DENY_AT` is 3), so `getDistinctControlCount`,
     `DISRUPT_DENY_AT` and the disrupt-deny branch go.
  7. Mobile: `stanceCheckVM`, the IntentIcon punish/yield telegraph, the
     `stance-check-resolved` log line, `playerStanceVM` / `StanceChip`, the
     enemy stance readout and reveal-screen tells, the ▲/▼ read previews on
     `READ_DAMAGE_MULT`, the `stance-chip` tooltip and the advantage lines
     in tooltip / village payload text.
  8. Tests deleted with their subjects or rewritten to the survivors.
- **R7d2 — residue and the carrier sweep**: the legacy `CombatState` types
  (`Advantage`, `choosing_stance`, `CombatAction.stance`) and the Enemy AI
  stance doc, the word "stance" out of player-facing copy (level-up, deck,
  character screens), "CHOOSE A STANCE" canon copy (`spec.md`,
  `axiomancer-mobile/AGENTS.md`), and the D45 sweep: STAGGER, ROOT,
  CONFUSION, charm, DISRUPT and every stance word with no carrier out of
  the atlas, glossary and glyph registries.

### Decisions made upfront (R7d) — DO NOT ASK

- **The momentum chain stays, on card colour.** It reads `card.stance`,
  which is the card's colour (heart/body/mind; grey and wild never move
  it), not an RPS stance. It feeds exactly one thing: a completed
  heart→body→mind chain surges a temporary wild die (or +1 Conviction on a
  full table). It never read the enemy's stance. D65 keeps colour and calls
  dice colour "the main fun mechanic"; keeping the chain deletes nothing T
  might want, and deleting it later is one small diff. T can rule otherwise
  at R7d2 or in their session.
- **Identifiers that mean colour or stat family keep their names in R7d**:
  `Stance` (stat family: `resistedBy`, `damageType`), `card.stance`,
  `cardStanceColor`, `WheelStance`, `StanceGlyph`, `presenters/stances.ts`.
  Their doc comments lose the RPS wording. A rename is churn across both
  workspaces with no behaviour change; R10c's comments pass owns names.
- **The Coveted Die keeps its block claim.** Only the yield path goes.
- **Charm and silence go whole** (`forcedStance` / `blockedStances`): no
  library effect prints them and there is no enemy stance left to force.
- **No save migration.** `playerStance`, `revealedStances` and the threat
  phases live on the encounter, which the game save does not hold (R9a
  exists for that reason).

## Out of scope for R7a (named so it is not mistaken for a miss)

- `synergy` and `synergy-predicates.ts`, themes, draft, presets,
  reward steering, card types, the oath / hex zones and `persistentEffect`
  → R7b.
- `sway`, `premises`, `peroration`, capitulation state and helpers,
  `incrementsFriendship`, `buff_absolved`, carrier-less effects (and
  `test-utils/fixture-effects.ts`, which exercises them), dead `executeCard`
  branches → R7c.
- `souls` stays: its feeder is DoT expiry, not a card kind, and it banks into
  `bankedSouls` (D20). `stance` state and reveals stay for R7d.
- `upgrade` and `card-upgrades.ts` stay (D8).

## Save / schema contracts

Every removed field is encounter-transient (the encounter is not in the game
save — R9a exists because a reload lands past the fight). Cards are data
modules, not saved. No migration.

## Decisions made upfront — DO NOT ASK

- **`deal` loses `hits` and `pierce`.** Neither has a carrier; keeping a
  multi-hit loop for a card that does not exist is exactly what D50 deletes.
- **`CardRider` keeps only the grey FREE verbs.** It is also the FREE-line
  type, so it cannot go whole; its other fields have no carrier.
- **R7a edits `cards.pricing.ts` and `card-upgrades.ts` only to compile.**
  Pricing is deleted whole in R7b; upgrades stay parked (D8) with their field
  lists narrowed to fields that exist.
- **`fixture-effects.ts` waits for R7c**, with the effects it exercises.
- **No migration**: nothing removed is persisted.

## Tests matrix

- `CARD_SPECIAL_MECHANIC_KINDS` equals `['deal', 'guard']` (mechanics and
  the mobile KW-2 test).
- The grey office still plays end-to-end: DEAL 5 scaled by body, GUARD 5 by
  mind, VULNERABLE by heart; FREE lines land; colour match applies.
- Suites whose subject is deleted are deleted; the rest are rewritten to the
  grey office.

## Verify gate

`npm run verify` (both workspaces: mechanics' public surface changes), root
`npm test`, `npm run lint:content`, `node scripts/check-lexicon.mjs`.
