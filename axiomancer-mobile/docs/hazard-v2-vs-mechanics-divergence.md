# Hazard Minigame: Mobile v2 Engine vs `axiomancer-mechanics` — Divergence Catalogue

Date: 2026-06-11
Status: **RESOLVED 2026-06-12.** The divergence is closed: `axiomancer-mechanics@0.17.x` carries a byte-faithful port of the mobile v2 rules (`src/World/Hazard/`, parity-guarded by `audit/e2e/parity.audit.test.ts`), and mobile deleted its local engine at the 0.17.1 bump — `state/hazard/` retains only the host glue (`store-actions.ts`); every rule import now comes from the package root. The catalogue below is kept as the historical record of what was upstreamed. The "what applies live vs. flags" sections further down still describe current claim-time behaviour.

Historical header (2026-06-11): refreshed after the card-expansion (two-tone cards, enchantments, bursts, gold vow, choose, convert→gold). Roster + mechanics spec: `docs/hazard-card-expansion-2026-06-11-spec.md`.

## Why this document existed

Mobile carried the living Hazard v2 rules locally while `axiomancer-mechanics` held an older, partial implementation. This document was the upstreaming checklist: mechanics had to either port each mobile rule below or explicitly reject it with rationale before mobile deleted its local engine and consumed package exports again. That bar was met by the 2026-06-12 port + parity audit.

Primary mobile source files:

- `state/hazard/types.ts`
- `state/hazard/tuning.ts`
- `state/hazard/engine.ts`
- `state/hazard/content.ts`
- `state/hazard/deck-flags.ts`
- `state/hazard/store-actions.ts`
- `state/hazard/sim.ts`
- `state/hazard/__tests__/engine.test.ts`
- `state/hazard/__tests__/balance.sim.test.ts`
- `state/e2e/hazard.flow.engine.test.ts`

Primary mechanics comparison files:

- `../axiomancer-mechanics/src/World/Hazard/hazard.types.ts`
- `../axiomancer-mechanics/src/World/Hazard/hazard.engine.ts`
- `../axiomancer-mechanics/src/World/Hazard/hazard.dice.ts`
- `../axiomancer-mechanics/src/World/Hazard/hazard.cards.library.ts`
- `../axiomancer-mechanics/src/World/Hazard/hazard.hazards.library.ts`
- `../axiomancer-mechanics/src/World/Hazard/e2e/hazard.engine.test.ts`

## Current mobile v2 rule surface

### Session flow

- `createHazardSession(seed, deckBag, hazardId)` opens directly in `route-select`.
- Opening hand is visible before route choice: 5 cards drawn, 0 dice cast.
- Route choice is binding for the whole hazard and casts exactly 4 dice once.
- Phase order: `route-select` → `rolling` → `playing` → `resolve-flash` → `outcome` → `rewards` → `done`.
- `rolling` is an animation/interstitial state; rules begin at `playing`.
- Current mobile authored hazards all have 3 rounds.

### Progress and routes

- Progress keys are exactly `force` and `escape`.
- Safe route uses one combined `FORCE + ESCAPE` threshold per round.
- Risk route uses dual per-round thresholds `[force, escape]`; both meters must clear in the same round.
- Marks are `O` / `X` / `pending`; final scoring is tiered, not `O - X` arithmetic.

### Dice and powering

- Card/dice colours are exactly `red`, `blue`, `purple`, `gold`.
- Hostile die face is `hex` in mobile code and displayed as `✕` in UI/docs.
- Die faces are six slots: `red`, `blue`, `purple`, `gold`, `gold`, `hex`.
- Gold is wild for powering non-gold cards: a gold die can power any card colour.
- Gold cards still require gold dice because no non-gold die can satisfy a gold card.
- TWO-TONE cards (reward pool) declare `colors: HazardColor[]`; either listed colour's die — or the wild gold die — powers them (`dieCanPowerCard`). `kind` stays the primary identity.
- Four dice are cast once at route selection.
- Dice do not automatically re-cast or refresh between rounds.
- Spent dice stay spent across rounds.
- Hex dice cannot power cards.
- Re-powering a staged, unapplied card with another legal die frees the previous die.
- Temporary dice created by effects or salvage behave like normal dice and persist until spent or the hazard ends.

### Cards, apply step, and hand economy

- Starter deck has 11 authored cards with weights; starter draw bag total is 25 card ids at `starterWeightScale = 1`.
- Reward pool has 30 cards (8 original + 22 in the 2026-06-11 expansion). The expansion is reward-pool ONLY — the starter bag and its balance sim are unchanged.
- CRACK is a dead card added by consequence.
- `HAZARD_HAND_SIZE = 5`.
- There is no current play-area cap; the whole hand can be staged.
- Staged number cards contribute projected progress immediately.
- Utility effects do **not** fire on stage or on power. They fire when `applyHazardCard` runs, or automatically during `resolveHazardRound` for any staged unapplied cards.
- Applying a card is a one-way commit: applied cards cannot be unstaged, re-powered, or discarded.
- Played/staged cards discard at round advance.
- Unplayed hand persists across rounds.
- At round advance, draw back up to 5; if draw effects inflate the hand above 5, keep everything and draw nothing.
- Draw pile refills by shuffling the current deck bag when low.
- Deck bag = implicit starter bag + acquired reward cards + acquired CRACK cards decoded from `GameState.flags`.

### Card rows and utilities

- Non-dead cards have free values `f/e` and optional powered values `fp/ep`.
- Utility cards can also carry progress numbers; they are not automatically zero-progress.
- Purple utility cards generally have minor effects that upgrade when powered.
- Gold cards use `majorEffect`: the utility fires at major tier even without a die; a gold die buys their numbers.
- Current utility effects are:
  - `draw`: draw `drawBase` cards, or `drawPowered`/major amount at major tier.
  - `recast`: re-roll only currently available dice; major tier also adds one temporary non-hex mana die.
  - `convert`: mint WILD GOLD dice (never the card colour — otherwise re-cast is strictly better). Minor (unpowered) turns exactly ONE available `hex` die to gold; major (powered, or gold `majorEffect`) turns them ALL, and conjures one floating gold die when ≤1 was converted so major always beats minor.
  - `aura` (ENCHANT, expansion): adds persistent session `modifiers` for the rest of the hazard — `auraForce`/`auraEscape` (+X to EVERY played card contributing that meter) and `surgeForce`/`surgeEscape` (+X to every POWERED card's contribution). Red/blue auras upgrade their NUMBER on power, aura flat; purple auras keep the number flat and upgrade the AURA; gold auras fire major for free and the die buys numbers. The aura boosts a card only in the round it is PLAYED: it lifts the round's clear check (`hazardProjectedProgress`), but momentum carry is computed from the RAW, un-enchanted total (`hazardProjectedProgressRaw`), so the aura is never banked into the surplus and re-counted in later rounds' totals (2026-06-12 fix).
  - `burst` (expansion): adds progress to the CURRENT round only (rides `progressBase`). `burstPerUnspentDieForce` adds force per unspent non-hex die (WAR-CRY); `vitaeCost` accrues a VITAE cost settled at claim (BLOODPRICE).
  - `goldvow` (expansion): primes a one-shot `session.goldVow` consumed by the next gold die spent powering a card; the bonus rides that card as `vowBonus`.
- CHOOSE cards (`choose: true`, e.g. TWIN PATHS) feed their single powered value into ONE meter the player picks (`entry.chosenKey`, default `force`), set via `chooseHazardCardKey`.
- The `momentumBonus` rider raises the per-session momentum cap (`momentumCap`, default 3) on apply (SAINT'S PATIENCE).
- Utility effects fire once per card because application locks the card.
- CRACK is dead: contributes nothing, cannot be powered, and only clogs the hand unless discarded.

### Trash bin / salvage

- Only hand cards can currently be discarded through `discardHazardCard`.
- To abandon a staged card, return it to hand first; applied cards can never be binned.
- Cards with `salvage: { type: 'progress', key, amount }` add progress to `progressBase` for the current round only.
- Cards with `salvage: { type: 'mana' }` conjure a temporary die of the card colour.
- Cards without salvage, including CRACK, discard for nothing; thinning is the benefit.
- Round advance overwrites `progressBase` with momentum carry, so progress salvage does not persist.

### Momentum and reserves

- Cleared-round surplus carries half into the next round, capped at 3 per carried meter.
- Carry is computed from the RAW (un-enchanted) round total, so persistent auras never compound across rounds via momentum — they only ever boost the round their cards are played in.
- Safe route carry is based on combined surplus and is stored on `carryForce`, with `carryEscape = 0`.
- Risk route carry is computed separately per meter.
- No carry occurs on failed rounds or after the final round.
- On Complete or Perfect, each unspent non-hex die grants +1 VITAE reserve bonus.
- Failure grants no reserve bonus.

### Sub-quests (optional objectives, 2026-06-12)

- Each hazard rolls `HAZARD_TUNING.subquests.pickCount` (3) objectives from `HAZARD_SUBQUESTS` (10 total), off an INDEPENDENT seeded stream so selection never perturbs the card/dice RNG.
- Rolling metrics (`session.questMetrics`) accrue at the resolve / discard / apply seams; objective pass/fail logic lives in `hazardSubquestStatus`. Invariant breaks (hand emptied, card cap exceeded, a round lost) fail immediately; "reach N by the end" objectives stay `active` until the final resolve.
- Completing an objective on a SURVIVED crossing pays its bonus (`questShillings`/`questVitae`/`questTokens`) on top of the spoils; a total failure forfeits all objective bonuses. Bonuses are applied at claim alongside the main rewards.

### Outcomes, rewards, and consequences

- Outcome tiers:
  - `perfect`: all rounds clear.
  - `complete`: at least one round clears.
  - `failure`: zero rounds clear.
- Perfect safe rewards: `cache`, `vitae`, `token`.
- Perfect risk rewards: `cache`, `relic`, `token`.
- Complete safe rewards: `vitae`.
- Complete risk rewards: `cache` if one win, `cache` + `relic` if two wins.
- Failure grants no rewards and no card offer.
- Non-failure outcomes roll a pick-1-of-3 reward card offer.
- Perfect offers guarantee a rare as the first card and may be skipped.
- Single-win Complete offers have 0% rare chance.
- Non-perfect offers cannot be skipped.
- Consequence ladder by losses:
  - 0 losses: none.
  - 1 loss: `tokens`.
  - 2 losses: `maxhp`, `deadcard`.
  - 3 losses: `minhp`, `maxhp`, `deadcard`, `curse`.
- Route penalty is `penaltyVitae × losses`.
- Claim applies rewards, reserve bonus, consequences, route penalty, and picked card.
- VITAE floors at 1; hazards maim, never kill.

### Current mobile authored content

Starter cards:

- Red starter: `steps`, `haul`, `grip`.
- Blue starter: `scram`, `runner`, `leap`.
- Purple starter: `footing`, `windread`, `pole`.
- Gold starter: `oath`, `blessing`.

Reward/consequence cards:

- Reward cards (original): `r_grip`, `r_wind`, `r_even`, `r_conv`, `r_seer`, `r_gale`, `r_oath`, `r_crown`.
- Reward cards (2026-06-11 expansion): two-tone pivots `r_pivot`, `r_drop`, `r_last`; lopsided duals `r_heave`, `r_skitter`; number+utility hybrids `r_path`, `r_windcall`, `r_stone`, `r_tide`; enchantments `r_aggr`, `r_swift`, `r_zeal`, `r_martyr`, `r_relic`; gold vow `r_vow`; bursts `r_serk`, `r_bolt`, `r_warcry`, `r_blood`, `r_pwrath`; choose `r_twin`; tempo `r_saint`.
- Consequence card: `crack`.

Hazards:

- `cracked-cliff`
  - Safe thresholds: `[19, 21, 23]`, penalty VITAE 2.
  - Risk thresholds: `[[9, 9], [10, 10], [11, 11]]`, penalty VITAE 4.
- `flooded-undercroft`
  - Safe thresholds: `[18, 21, 24]`, penalty VITAE 2.
  - Risk thresholds: `[[8, 10], [9, 11], [10, 12]]`, penalty VITAE 4.
- `ashfall-crossing`
  - Safe thresholds: `[21, 21, 23]`, penalty VITAE 2. (Raised from `[20, 20, 22]` on 2026-06-11: the convert→gold buff lifted safe perfect rate to ~0.80, over the 0.78 band.)
  - Risk thresholds: `[[10, 8], [10, 10], [12, 10]]`, penalty VITAE 4.
- `famine-march`
  - Safe thresholds: `[19, 21, 23]`, penalty VITAE 2.
  - Risk thresholds: `[[9, 9], [10, 10], [11, 11]]`, penalty VITAE 4.
- `bandit-hunt`
  - Safe thresholds: `[18, 21, 24]`, penalty VITAE 2.
  - Risk thresholds: `[[8, 10], [9, 11], [10, 12]]`, penalty VITAE 4.
- `fever-rot`
  - Safe thresholds: `[21, 21, 23]`, penalty VITAE 2. (Raised from `[20, 20, 22]` on 2026-06-11, same reason as `ashfall-crossing`.)
  - Risk thresholds: `[[10, 8], [10, 10], [12, 10]]`, penalty VITAE 4.

Reward/consequence constants:

- `vitae` reward: +6 VITAE.
- `cache` reward: +12 shillings.
- `relic` reward: +20 shillings.
- `minhp` consequence: −8 VITAE.
- `maxhp` consequence: −5 max VITAE, with max VITAE floor 5.

### Mobile-side mappings that need first-class mechanics support

These are live in mobile as best-effort adapters and should become mechanics-owned systems where possible:

- Persistent hazard deck flags: `hazard-card:<cardId>:<n>`.
- Banked token flags: `hazard-token-banked:*`.
- Hexed/curse flag: `hazard-hexed`; combat does not yet consume it.
- Max-VITAE scar recovery: **wired 2026-06-16 (Phase 128).** The
  `maxhp` consequence still bakes the scar into `player.maxHealth` at
  claim, and additionally records the *actually applied* magnitude as a
  durable `hazard-scar:<n>` flag (the floor-5 clamp may soften the
  nominal `HAZARD_MAXHP_SCAR`). An **inn-grade** rest — one whose
  authored `healFraction >= 1.0`, i.e. a full-recovery shelter rather
  than a wilderness field camp (`healFraction: 0.5`) — sums those
  flags back into `maxHealth` and clears them
  (`claimRestOutcomeAction`, gated on `RestSession.baseHealFraction`).
  Field-camp watches restore current VITAE only and leave the scar
  flags + `maxHealth` untouched. There is no first-class "inn"
  map-event kind; the inn/camp split rides on the existing
  `baseHealFraction` rather than new event plumbing. Engine owns no
  scar-recovery truth (`RestOutcome` has no max-VITAE field), so this
  stays a documented mobile adapter — same family as the scar-apply
  adapter and `hazard-token-banked:` / `night-keepsake:` flags.
- Cache/relic rewards: currently shillings; a real loot/relic table would be better.
- Out-of-combat death (Phase 130): a Hazard crossing whose net VITAE
  swing would drop the player to `health <= 0` (engine `isDefeated`
  threshold — the SAME predicate combat death uses) is **fatal**. The
  claim routes through the engine `resetRun({ keepCharacter: true })`
  primitive (mirroring combat's BEGIN AGAIN), stamps a durable
  `hazard-death:<ts>` tombstone flag, forfeits the crossing's spoils,
  and returns `died: true`. A swing that lands on `>= 1` VITAE is still
  a maiming (floored at 1), not a death. The engine owns no
  out-of-combat run-loop death *event* — death is composed mobile-side
  from the engine `isDefeated` threshold + `resetRun` transition, not a
  locally-simulated death rule. `hazardDeathCount(flags)` reads the
  tombstones for a future deaths-this-save surface.
- Immediate save on claim: mobile calls `save()` after applying spoils/scars.
- **Remove-card / deck-thinning (Phase 126 blocked integration point):**
  `axiomancer-mechanics` exposes `appendAcquiredCard(flags, cardId)`
  for *adding* a reward/CRACK card to the durable deck, but there is
  **no counterpart remove-card action** — no `removeAcquiredCard`, no
  deck-mutation transition, no remove-card reward option. The Phase 126
  deck screen (`app/hazard-deck/index.tsx`) + remove-card grid
  (`components/hazard/HazardRemoveGrid.tsx`) are therefore shipped
  **inspect-only**: the grid lets the player select an acquired card
  and confirm, but the confirm surfaces a graceful blocked banner
  (`selectHazardDeckViewModel().removeBlockedReason`) and leaves
  `GameState.flags` untouched, because the brief (Phase 126 §3) forbids
  implementing the deck-mutation rule locally. **When mechanics opens a
  remove-card action**, wire it through the no-op `onConfirmRemove`
  callback in `app/hazard-deck/index.tsx` and flip
  `removeBlocked`/`removeBlockedReason` off in
  `state/presenters/hazard-deck.engine.ts` (the removable set —
  acquired cards only, since the starter bag is immutable in the flag
  model — is already computed and surfaced).

## Current `axiomancer-mechanics` state

Mechanics is no longer pure old v0. It has a partial v2 Hazard surface under `src/World/Hazard/`:

- progress keys are `force` / `escape`;
- routes use safe combined thresholds and risk dual thresholds;
- dice are cast once and do not refresh between rounds;
- outcome is Perfect / Complete / Failure;
- there is a seeded session field and hermetic e2e coverage;
- Phase 135 world-persistence hooks exist for some mechanics hazards.

But it remains incompatible with mobile in important ways:

- Mechanics phase order is `reveal` → `hand` → `route-select` → `cast` → `play` → `resolve` → `outcome` → `rewards`, not mobile's route-select-first session with opening hand already drawn.
- Mechanics card identity/content is `A01`...`A14`, `R01`...`R06`, `CRACK`; mobile uses named ids like `steps`, `footing`, `r_crown`, `crack`.
- Mechanics hazard identity/content is `H01`, `H02`, `H03`, `H08`, `H12`, `H15`; mobile uses six named hazards listed above.
- Mechanics dice distribution is still `red`, `blue`, `purple`, `gold`, `x`, `x`; mobile is `red`, `blue`, `purple`, `gold`, `gold`, `hex`.
- Mechanics uses exact colour costs only; mobile treats gold dice as wild for non-gold cards AND supports two-tone cards powered by either of two colours.
- Mechanics convert (where present) targets the card colour; mobile convert mints wild gold dice (minor one / major all + floating). Mobile also adds enchantment (`aura`), `burst`, `goldvow`, and `choose` card behaviours mechanics has no equivalent for.
- Mechanics has a coarser play model: card ids move directly from hand to discard. Mobile has staged card instances, die attachment, explicit apply/lock, unstage, re-power, discard/salvage, and auto-apply at resolve.
- Mechanics utility effects are mostly card-id special cases on powered play; mobile utilities fire on apply and support major/free gold effects, temporary dice, and full salvage behavior.
- Mechanics has no mobile-equivalent persistent deck flag helpers or claim adapter contract matching mobile's GameState flags.
- Mechanics still exports compatibility names such as `computeFinalScore`; mobile should not depend on numeric scoring.

## Upstreaming requirements

Mechanics should port the mobile rules as the new source of truth, not preserve compatibility lies. Required public package surface for mobile issue no-trbl-2-u/axiomancer-mobile#333:

- Session creation with explicit seed, deck bag/current run state, and hazard id.
- Route selection, rolling finish, card staging/unstaging, powering, applying, discard/salvage, round resolve, continue, outcome acknowledge, reward claim.
- Pure deterministic engine transitions suitable for mobile store use and hermetic tests.
- Content exports for hazards, cards, keywords, rewards, consequences, tuning constants, and deck-flag helpers.
- Claim/application helper or explicit adapter contract for GameState rewards/consequences.
- Seeded RNG embedded in session state; no naked `Math.random()` inside pure engine.
- Mobile-compatible id/content migration plan, or a deliberate data migration from old mechanics ids to mobile ids.

## Verification to port or mirror

Mirror the mobile coverage, not just current mechanics expectations:

- `state/hazard/__tests__/engine.test.ts`
  - route-select opens with hand before dice.
  - deterministic seeded sessions.
  - exactly 4 dice on route selection.
  - gold wild powering and gold-card-only-gold powering.
  - utility effects fire on apply, not stage/power.
  - apply locks cards; resolve auto-applies unapplied cards.
  - no automatic re-cast between rounds.
  - persistent unplayed hand and draw-up-to-5.
  - trash-bin discard and salvage.
  - Safe combined meter.
  - Risk BOTH-required meters.
  - momentum carry.
  - Perfect/Complete/Failure outcomes.
  - reward offers, skip rules, reserve bonus, deck flags.
- `state/hazard/__tests__/balance.sim.test.ts`
  - greedy-bot balance bands over every authored mobile hazard and both routes.
- `state/e2e/hazard.flow.engine.test.ts`
  - store action flow and GameState application at claim.
- `state/e2e/hazard.screen.test.tsx` and `state/presenters/__tests__/hazard.engine.test.ts`
  - UI/presenter contract where relevant to package exports.

## Balance guard bands currently enforced in mobile

The mobile greedy-bot sim uses 300 seeded runs per hazard/route cell.

Safe route:

- at least-one-win rate ≥ 0.90.
- perfect rate between 0.35 and 0.78.
- failure rate ≤ 0.08.

Risk route:

- at least-one-win rate between 0.75 and 0.98.
- perfect rate between 0.08 and 0.35.
- failure rate between 0.03 and 0.25.
- average wins must be lower than Safe for the same hazard.

## Historical notes

- The v2 design descends from the 2026-06-10 Claude Design handoff, especially the four-colour redesign.
- The no-between-round-recast doctrine is user-confirmed and supersedes both the prototype's every-round re-cast and any safe/risk split recast idea.
- Enchantments (persistent auras) ARE part of mobile v2 as of the 2026-06-11 expansion (the `aura` effect + session `modifiers`); see `docs/hazard-card-expansion-2026-06-11-spec.md`. This supersedes the earlier "enchantments are not part of mobile v2" note.
- Old CDR-0006 docs should be treated as historical until rewritten.
