# Hazard-Pattern Combat — System Reconciliation Gaps

> **Status:** Open design questions — handoff. 2026-06-21.
> **Context:** Spec 25 shipped the Hazard-Pattern Combat engine (`resolveCombatPhase`)
> as a card-and-dice driver where status effects fill two Pressure Tracks (DoT
> Erosion + Control Saturation) that are the only practical win conditions. It
> ships **alongside** the legacy turn-based `resolveCombatRound`, which still
> backs live exploration encounters. Before the new system becomes the default,
> the rest of the game must be reconciled with it.
>
> This document enumerates every reconciliation gap found, with concrete current-
> state evidence and ≥10 open questions each. Answer inline (`> A:`), then spin
> the resolved areas into implementation specs (the combat-depth follow-ups are
> Specs 26–30; these gaps will produce Specs 31+).

**Why these gaps exist (root cause):** the legacy combat expressed power through
*stats × equipment × skill-damage rolls*. The new combat expresses power through
*status-effect intensity × the dice economy × pressure thresholds*. The two value
models barely overlap, so every system that fed the old model (stats, equipment,
loot, skills) now feeds a path that **no longer decides the fight**. Each section
below is a place that decoupling shows.

---

## 1. Stats & Derived Stats

**Current state (evidence).** The two win paths are skill-authored: DoT pressure
= `damagePerRound × intensity`, Control = `intensity + min(duration, 3)` — both
read from the *effect/skill definition*, not the caster's stats
(`combat.cards.ts` `effectPressure`). `calculateSkillDamage` (`basePower +
scalingStat × 0.5`) still runs on a bottom action, but **direct HP damage
contributes 0 pressure** (§6 Rule 2), so `body`/`mind` barely touch the win path.
`heart` influences effect-landing only indirectly (the resist roll in
`resolveEffectApplication`). Net: a level-30 strategist and a level-3 one apply
the *same* poison intensity. Character progression is largely decoupled from
combat outcome.

**Questions:**
1. Should `baseStats` scale pressure contribution (e.g. DoT-track amount × a
   `mind`/`heart` factor), or stay purely skill-authored?
2. What is each stat's *role* in the new combat? Proposal: `heart` → effect
   landing / control potency, `body` → dice economy (extra die / cheaper power),
   `mind` → DoT potency. Confirm or redesign.
3. Should the stance-die bag be **stat-weighted** (a high-`body` character rolls
   more body faces), or stay uniform (`combat.dice.ts COMBAT_DIE_FACES`)?
4. Do `derivedStats` (`physicalAttack`/`mentalAttack`/`emotionalAttack`,
   `*Skill`, `*Defense`, `*Save`, `luck`) matter at all in the new combat, or are
   they dead weight there?
5. Do the player's `*Save`/`*Defense` derived stats resist the **enemy threat
   action's** effects (the only thing that hurts the player now)?
6. Is HP (`maxHealth`) the right loss-clock, and should it still scale with
   stats — or does the loss model need rethinking when status is the win path?
7. Should levelling up produce a *legible* combat power gain, or is power
   expressed through the deck (Spec 28) and effect content instead of stats?
8. Does `luck` affect die rolls / effect-landing / a crit-equivalent in the new
   combat?
9. Should we introduce (or repurpose a stat into) an explicit **status potency**
   stat so the player can build for the actual win path?
10. The moral/difficulty meter scales enemy stats; pressure thresholds derive
    from enemy **HP**. How should difficulty scaling reach the *pressure* economy
    (thresholds, die bag, reaction strength) rather than just HP/damage?
11. If stats stay mostly irrelevant, does that hollow out character progression —
    and is that acceptable (deck-as-progression) or a regression to fix?
12. Should stat checks outside combat (the same `baseStats`) stay coupled to the
    in-combat meaning, or can combat reinterpret them independently?

---

## 2. Equipment

**Current state (evidence).** `initializeCombatEncounter` seeds `combatResources`
from **only** `seededResources` (the fallacy/paradox carry). It does **NOT** call
`aggregateCombatStartTokens` / `aggregateSetStartTokens`, and does **NOT** apply
`getActiveSetPassiveEffectIds` — all of which the legacy `initializeCombat`
(`combat.reducer.ts`) does. So in the new combat: **equipment combat-start token
grants are dropped, and set-bonus passive effects do not apply.** Weapon damage
modifiers still feed `calculateSkillDamage` (0 pressure). Equipment is, today,
almost inert in the new combat.

**Questions:**
1. Should equipment `combatStartTokens` seed the new combat — and if so, what do
   `heart/body/mind` tokens *do* now that the die grants the stance cost
   just-in-time? (Only `fallacy/paradox` clearly still matter, as the Tier-3
   gate.)
2. Should equipment instead grant **starting dice** (an extra die, a guaranteed
   Wild, a re-roll) — a lever native to the new economy?
3. Set-bonus passive effects (combat-lifetime `ActiveEffect`s) are currently
   dropped — should they apply in the new combat, re-added at
   `initializeCombatEncounter` (mirroring the reducer)?
4. Should equipment affect the **deck** (Spec 28) — a weapon that adds a combat
   card, an artifact that biases the die bag toward a colour?
5. Weapon damage modifiers feed direct damage (0 pressure). Should weapons
   instead boost **status potency** (DoT/control magnitude) so they matter to the
   win path?
6. Should defensive equipment (resistances, armor, `*Defense`) reduce the
   **enemy threat action** damage/effects in the new combat?
7. Should equipment grant **pressure-economy** modifiers (+1 `MOMENTUM_CAP`, +1
   `TOP_ACTION_PRESSURE`, a per-combat free die-refresh, a lower Befriend
   threshold)?
8. How do the rolled affixes + modifier catalogue (Spec 05c/d/e) map onto the new
   combat's levers — do affix rolls need a new "combat-relevance" axis?
9. Resource-interaction items (`resourceInteraction.combatStartTokens`,
   generation bonuses) — redesign for the dice/pressure economy or retire in the
   new combat?
10. Should there be **combat-card-granting** equipment (a relic that adds a
    Catalyst (Spec 26) or a synergy card to the deck)?
11. Is the new equipment design direction **status-themed sets** (e.g. a
    "Venomweave" set that amplifies DoT, a "Silencer's" set that boosts control)?
12. Does the equipment preview / stat-delta UI (Phase 154 `computeEquipDelta`)
    need a new view that shows an item's *combat* relevance under the new model?
13. Two combat systems coexist (legacy + new). Must equipment stay meaningful in
    BOTH during the transition, or do we accept it's tuned for one?

---

## 3. Loot & Rewards

**Current state (evidence).** Legacy combat ends through `store.endCombat()` →
`CombatEndReport { xpGained, loot, friendshipReward?, codex... }`, which applies
XP, rolls the enemy loot table, layers `FriendshipReward` (items, xpBonus,
flagSet, alignment/faction deltas, codex entry) and routes the aftermath modals.
The new combat is a **self-contained screen** that produces a `CombatSummary`
(attribution) + a `CombatOutcome` and routes **no rewards at all** — no XP, no
loot, no friendship reward, no codex, no aftermath. This is the single biggest
live-integration gap.

**Questions:**
1. How does each `CombatOutcome` (`victory`/`mercy`/`defeat`/`retreat`) map onto
   the existing `CombatEndReport` (`xpGained`, `loot`, `friendshipReward`)?
2. Does **mercy** (Control Saturation) grant the full `FriendshipReward` path
   (half-XP + loot + +1 moralMeter + `flagSet` + alignment/faction deltas + codex
   unlock) that the legacy befriend outcome did?
3. Does **victory** (DoT Erosion) grant full kill-XP + the weighted loot roll,
   like the legacy player-win?
4. **Retreat** — legacy flee semantics (no loot, reduced/no XP)?
5. **Defeat** — legacy KO semantics (`resetRun` / death / out-of-combat-death
   reconciliation)?
6. Should the post-combat attribution (`CombatSummary`) feed the **codex/journal**
   (e.g. record "enemy X folded to poison" / "befriended via saturation")?
7. Should winning offer a **combat-card reward** (Spec 28) — pick-1-of-3 like
   Hazard's reward cards / Slay the Spire — and where does that card persist?
8. `FriendshipReward` carries alignment + faction deltas — do those still apply
   on the new mercy path, and is the mercy *spare vs exploit* choice the trigger?
9. Does XP earning change shape — e.g. a bonus for a clean DoT-erosion, for using
   *both* tracks, or for a fast clear (an outcome-tier like Hazard's
   perfect/complete/failure)?
10. The enemy `loot` table is unchanged — does `rollLoot` fire from the new
    combat's victory, and at what outcome tiers?
11. Does befriending via Control Saturation set the same `befriended-<id>` world
    flags (so downstream dialogue/quest gates still unlock)?
12. Should "perfect" combats (high pressure, no Overwhelmed phases) grant bonus
    rewards — and do we want a combat **outcome-tier** system at all?
13. How do consumable items used mid-combat reconcile (legacy combat allowed
    consumables; the new card model has no item verb yet)?

---

## 4. Skills

**Current state (evidence).** Skills *become* the combat cards
(`combat.cards.ts` adapts each `Skill` → a `CombatCard`). The resource economy
shifted: the stance die grants the `heart/body/mind` portion of `resourceCost`
just-in-time, while `fallacy/paradox` must be pre-banked (the Tier-3 gate).
`executeSkill` still spends the full `resourceCost` and generates +1
fallacy/paradox per use. The skill library was authored for the *legacy* token
economy (heart/body/mind generated by basic attacks, which no longer exist).
Tier, synergy, specialMechanics, and `r_` specialization upgrades carry, but
their *meaning* in the card model is unsettled.

**Questions:**
1. With the die granting the stance cost, does the authored `resourceCost`
   (heart/body/mind) still mean anything, or is it now purely the
   `fallacy/paradox` Tier-3 gate?
2. Should skill `tier` map cleanly onto the card model (Tier 1 ≈ strong top
   action, Tier 3 ≈ needs a banked token + big pressure), and is that wired?
3. `r_` upgraded skills (specialization) — Spec 25 §4.3 says they *replace* the
   base card. Is that implemented, and how does the deck reflect an upgrade?
4. Skill **learning requirements** (level/stat/prerequisite/alignment) are
   unchanged — but does the new combat change the *motive* to learn a skill
   (deck-building, Spec 28) versus raw power?
5. The five-resource pool (`CombatResources`) — heart/body/mind were basic-attack
   generated; now dice grant them momentarily. Is the token pool still meaningful
   *between* plays, or only an implementation detail of one play?
6. `executeSkill` banks +1 fallacy/paradox per use — is that the intended Tier-3
   progression curve, and does it pace correctly over a 3–8 phase fight?
7. Self-targeted skills (heals/buffs) are 0-pressure utility — are pure-heal
   skills worth a card when HP is "only" the loss clock? Re-tune or re-theme?
8. Synergy skills (`SkillSynergy`/`SynergyPredicate`) — Spec 28 surfaces combos;
   do the predicates need re-tuning for the card cadence (which effects are on the
   enemy, and when)?
9. `specialMechanics` (`strip_random_buff`, `convert_enemy_buff_to_self`,
   `secondary_heal_self`, `bypass_defense`) — `befriend_attempt` is wired; are the
   others meaningful as cards, and do they need verb classes?
10. Should **new** skill content be authored natively as combat cards (declared
    verb class, pressure preview, die identity), or keep adapting the legacy
    library indefinitely?
11. Direct-damage skills are 0-pressure — should the damage-heavy skills be
    **re-authored to apply DoT** so they advance the win path, or kept as the
    deliberate "weak" line?
12. Enemy skills (`Enemy.skills`) — Spec 25 removed per-round enemy skill use
    (§12 Q5). Are enemy skill definitions now dead in the new combat, or folded
    into threat/reaction (Spec 29) payloads?
13. Does the skill economy need to differ between the legacy and new combat (two
    cost models), or one unified model the legacy combat also adopts?

---

## 5. The Hazard Encounter — too similar?

**Current state (evidence).** The new combat is **structurally identical** to the
Hazard minigame — Spec 25 deliberately mirrored it: draw 5 cards, roll 4 stance
dice (vs Hazard's mana dice), play cards to fill **two tracks** (DoT/Control vs
FORCE/ESCAPE), across a sequence of **phases/rounds** marked O/X, with momentum
carry, reshuffle-on-empty, and an "assemble a solution under full information"
feel. They share the card-and-dice grammar almost exactly. A player who just did
a Hazard crossing then enters combat plays *the same kind of minigame*.

**Will it need to change so it's not too similar? Open questions:**
1. Is the structural similarity a **problem** (two minigames blur together) or a
   **feature** (one learnable verb across the game)? What's the product intent?
2. DoT/Control pressure vs Hazard's FORCE/ESCAPE — are these distinct enough, or
   do both just read as "fill two bars to win"?
3. Hazard is a **route-choice crossing** (safe/risk, binding for the run); combat
   has no pre-choice. Should combat add a strategic pre-commit (a stance, an
   approach, a "press the attack vs play safe") to differentiate the opening?
4. The die languages overlap (Hazard red/blue/purple/gold/hex; combat
   heart/body/mind/wild/x). Should the visual + colour + glyph language diverge
   *more* so the two never blur on a phone?
5. Hazard cards are abstract progress (FORCE/ESCAPE numbers); combat cards are
   **named skills with status identities**. Is the skill-as-card identity strong
   enough on its own to make combat feel different?
6. The combat threat sequence vs the Hazard round ledger are both O/X phase
   markers — differentiate the framing (a living enemy vs a crossing)?
7. Hazard has rich sub-systems (enchantments, sub-quests, salvage, deck-scarring,
   reward-card drafts). Should combat **avoid** importing those (e.g. is Spec 27's
   salvage a mistake because it makes combat *more* Hazard-like?), or embrace a
   shared toolkit?
8. Back-to-back card-and-dice in one session (Hazard then combat) — does it cause
   fatigue/sameness? Should the game **space** them or visually contrast them?
9. Should the two share a unified card-and-dice **engine + UI kit** (consistency,
   less code, one mental model) or deliberately diverge (variety, distinct feel)?
10. The enemy-as-threat-sequence makes combat feel like a *passive obstacle*
    (very Hazard-like). Is **Spec 29 (reactive enemies)** the primary
    differentiator — combat is a *dialogue with a character*, Hazard is a
    *crossing of terrain*?
11. Stakes differ (Hazard: VITAE/supply attrition + map benefits; combat:
    HP/death + loot + **befriending** + mercy choice). Are the distinct stakes
    enough to justify the shared structure?
12. Should combat lean hard into what Hazard *cannot* have — a reactive opponent,
    the befriend/mercy path, status-effect identity, the Catalyst payoff — to
    carve a clearly separate niche?
13. Long-term product question: do Hazard and combat **converge** into one
    "tactical card encounter" pillar, or stay two deliberately separate pillars?
    The answer drives everything above.
14. If they must diverge, what is the *one* mechanic that should exist in combat
    and never in Hazard (and vice-versa), so each owns an identity?

---

## 6. Integration, Lifecycle & Persistence (the live-flow gap)

**Current state (evidence).** The new combat is a **mobile-side, `useState`,
self-contained** screen (`app/combat-encounter/`), launched only from the dev
menu. It is not wired into exploration → combat → aftermath, is not an
engine/store slice, and does not persist. The legacy combat (store `combat`
slice, encounter modal, `endCombat` aftermath) still owns live play.

**Questions:**
1. How does **exploration** trigger the new combat (replacing the legacy
   `startCombat`/`enterCombat`/encounter-modal path)?
2. Should the encounter state become **engine truth** — a `CombatEncounterState`
   slice on `GameState` (like Hazard's session) — for persistence + parity, vs.
   staying mobile `useState`?
3. **Mid-combat save/resume** — Hazard persists its session; should combat? (A
   long card fight interrupted by app-close.)
4. Legacy combat renders in an **encounter modal**; the new one is a **fullscreen
   route**. Which is the target UX, and does that change the navigation model?
5. How does `CombatOutcome` bridge to `store.endCombat()` + the **aftermath
   modals** (victory/defeat/parley) the game already has?
6. Does the new combat **replace** the legacy combat tab outright, or coexist —
   and if coexisting, what decides which engine a given encounter uses?
7. The Hazard→combat **adapters** (hex / banked-paradox bridges noted in prior
   work) — do they feed the new combat's resources/dice?
8. **Out-of-combat death** and **hazard scar recovery** — how do they reconcile
   with the new combat's defeat outcome?
9. **CLI parity** — the legacy combat has a CLI driver (used by the tuning
   harness). Does the new combat need a `npm run combat-sim`-style CLI for
   `/combat-tuning` and CI?
10. **Save migration** — does adding the new combat as engine state bump
    `GAME_STATE_VERSION` and need a `migrate` step?
11. **Multi-enemy encounters** — legacy combat handled `encounter.enemies[]`; the
    new combat is 1v1. How do group encounters reconcile (sequential fights? a
    multi-threat board?)?
12. The **encounter generator + difficulty meter** seeded legacy encounters —
    does the new combat consume the same generator, and does difficulty reach the
    pressure economy (cf. §1 Q10)?
13. Does the new combat need to honour the **moral meter / alignment** effects
    that the legacy combat applied (enemy stat scaling, friendship reachability)?

---

## Cross-cutting summary — the one decision that unblocks the rest

Almost every gap above reduces to one product decision: **is the new combat a
full replacement for the legacy turn-based combat, or a parallel mode?**

- **If replacement:** stats, equipment, loot, and skills must be *redesigned*
  around the status/dice/pressure model (not bridged), and §6 integration is the
  critical path. The legacy `resolveCombatRound` + `/legacy-combat-tuning` become
  removable once exploration is migrated.
- **If parallel mode:** every system must stay meaningful in *both* value models
  simultaneously, which roughly doubles the balance surface and makes the §5
  Hazard-similarity question sharper (three card-ish encounter types).

Recommend answering that first (it's the root of §1–§4 and §6), then the §5
identity question, then spin each resolved area into a Spec (31+). Specs 26–30
(the depth follow-ups) are independent of this decision and can proceed in
parallel.
