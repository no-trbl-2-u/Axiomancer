# Spec 28 — Curated Combat Deck + Synergy

> **Status:** Draft — handoff. Answer §4, then `Spec 28 is ready, please implement.`
> **Depends on:** Spec 25 (Hazard-Pattern Combat) · Spec 04/04b (skills) · the Hazard reward/deck-flags pattern.
> **Theme inspiration:** Slay the Spire — power comes from a *small, curated, synergistic* deck (card removal + targeted adds), not a big undifferentiated pile.

## Goal

Replace "the combat deck is every skill you've ever learned" with a **curated
loadout**: a focused, player-shaped deck (Spec 25 §12 Q3's intended 8–10 cards
growing to 15–20) plus explicit **synergy payoffs** so building the deck is its
own meta-game. A tight DoT engine should feel different from a control engine.

## Why now / dependencies

- **Unblocks:** the deck-building depth both reference games are built on. Spec
  25 currently does `buildCombatDeck(player) = knownSkills + Retreat` and draws
  5/phase — so the deck only *dilutes* as you learn more skills (the opposite of
  building an engine), and there's no way to focus it.
- **Depends on:** Spec 25's deck (`combat.deck.ts`), the skill library, and the
  Hazard deck-flags codec (`hazard.deck-flags.ts`) as the persistence pattern.

## Current state

- `combat.deck.ts` `buildCombatDeck(player)` = de-duped `player.knownSkills` +
  the synthetic Retreat. No selection, removal, weighting, or per-encounter
  loadout. Draw is `drawCombatCards(... 5 ...)`, reshuffle-on-empty.
- The skill library **already has synergy skills** (`SkillSynergy` /
  `SynergyPredicate`, e.g. `resonance-burst`: bonus damage scaled by the target's
  existing debuff) — but the combat board never surfaces them as combos.
- The Hazard engine persists an acquired-card set in `GameState.flags`
  (`HAZARD_CARD_FLAG_PREFIX`, `decodeAcquiredCards`) — a ready blueprint for a
  persisted combat loadout.

## Open questions

1. **What defines the deck?** Option A: a player-curated **loadout** of N skills
   selected from `knownSkills` (a deck-builder screen). Option B: the full
   `knownSkills` but with **weights** (favourites drawn more often). Option C:
   knownSkills minus a **removed/banished** set. Recommended: A (explicit
   loadout) — it's the clearest engine-building lever and matches StS.
   > Your answer:

2. **Deck size + growth.** Start at 8–10, cap at 15–20 (Spec 25 §12 Q3)? Is the
   cap fixed, or does character level / an equipment stat raise it (a Mage
   Knight-style hand/deck-limit progression)?
   > Your answer:

3. **Where is the loadout edited + persisted?** A dedicated screen (mirror the
   Hazard deck screen) writing to `GameState` (engine-owned, via a deck-flags
   codec)? Or chosen at combat start? Persistence must be engine truth
   (ADR-0001/0003), mobile renders it.
   > Your answer:

4. **Synergy surfacing.** Should the board *highlight* a playable combo (a card
   whose `SkillSynergy.predicate` is currently satisfied by an effect on the
   enemy) — e.g. a glow + a "+combo" preview? Should synergy cards be a tagged
   verb class so they read as payoffs?
   > Your answer:

5. **Card removal / banish — is it earned or free?** Free editing anytime, or is
   removal a reward (loot/level) so thinning is a meaningful choice (StS removes
   are scarce)? Does a removed card stay removed permanently?
   > Your answer:

6. **Starter deck for a new character.** New-game player has the apprentice
   preset — what's their starting curated loadout (and does it span DoT/control/
   damage so the system is teachable from turn one)?
   > Your answer:

## Proposed approach

1. Engine: a `CombatLoadout` (ordered skill-id list + Retreat) persisted on
   `GameState` via a deck-flags codec (mirror `hazard.deck-flags.ts`). Add
   `getCombatLoadout(state)` / reducer edits (`addToLoadout` / `removeFromLoadout`
   with the size cap). `initializeCombatEncounter` takes the loadout as its
   `playerDeck` (it already accepts one).
2. Tag synergy skills (`verbClass: 'synergy'` or a `combosWith` hint on the card
   view in `combat.cards.ts`); expose "combo currently live" to the presenter by
   evaluating `SkillSynergy.predicate` against the enemy's effects.
3. Mobile: a combat deck-builder screen (mirror `app/hazard-deck/`) + a combo
   highlight on the board hand. Engine owns the loadout; mobile renders + edits
   via reducers.
4. New-game + preset wiring: seed the starter loadout from the apprentice preset.
5. `/combat-tuning`: deck-size cap + draw weighting become tunable; add a
   sim policy that respects a curated loadout (the current greedy bot uses all
   skills).

## Acceptance checklist

- [ ] All §4 questions answered.
- [ ] A combat encounter draws from the player's curated loadout, not all
      `knownSkills`; the loadout persists as engine truth across sessions.
- [ ] The size cap is enforced; removal (per §4 Q5) is honoured.
- [ ] A live synergy/combo is surfaced to the player on the board.
- [ ] Hermetic e2e: edit a loadout → enter combat → only loadout cards appear;
      a satisfied synergy predicate reads as a combo.
- [ ] `npm run verify` clean; mobile `verify` + deck-screen + board tests clean.

## Out of scope

- Inventing new synergy skills (use the existing `SkillSynergy` content;
  authoring more is a content pass).
- Cross-run roguelike deck progression (this is the persistent-character model,
  not a per-run draft).
- The salvage sideways-play economy (Spec 27).
