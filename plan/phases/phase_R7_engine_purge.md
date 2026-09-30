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
