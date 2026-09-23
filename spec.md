# Miserere Mei, Deus — product spec

> Retrospective spec, written at nexus adoption (2026-07-03) from
> the live design corpus (`axiomancer-mechanics/VISION.md`,
> per-package `AGENTS.md`/`CLAUDE.md`, `docs/adr/`, `specs/`). It
> captures the product as it actually exists so the autonomous
> loop has a stable anchor. Standing decisions and stack pins live
> in `plan/bearings.md`; this file is the "what and why".

## Product

Miserere Mei, Deus is a turn-based, single-player dark fantasy
deckbuilding RPG campaign for mobile (Expo / React Native),
backed by a deterministic TypeScript rules engine. Its thesis —
stated in `axiomancer-mechanics/VISION.md` — is that **what you
owe, and to whom, is a mechanical input, not flavor**: mercy,
honesty, restraint, and skill are each a mechanically
consequential stance, not a role-play veneer.

The core loop: explore a map → resolve authored node encounters
(combat, minigames, dialogue, cutscenes) → make morally charged
choices that shift THE OATHS (a 3-axis alignment: CREED, AUGURY,
TROTH), GRACE (a moral-difficulty meter), and faction reputation
→ carry those consequences into future world, boss, and region
state.

## Audience

The design corpus is authored for and around **T** (the
designer/owner). The implied player enjoys deep, legible,
tactical status-effect combat and morally weighty RPGs — the
prior-art canon the design skills cite: Disco Elysium,
Pathologic 2, Planescape: Torment, Undertale, Hades, Tyranny,
and Mass Effect for narrative; Slay the Spire, Mörk Borg,
Sekiro, Into the Breach, Mage Knight, and MTG for the tactical
systems.

## Pillars

- **Mechanics make what you owe consequential.** Strange, legible,
  consequential systems over safe RPG imitation.
- **Bigger numbers.** (THE BIG NUMBERS REWRITE, 2026-09-02 —
  `plan/2026-09-02-big-numbers-overhaul.prompt.md`.) A starter hit
  is 6–9, a Saint-rank finisher 45–70 flat or past 100 when fed;
  bosses carry hundreds of VITAE. Payoffs are uncapped. Every
  play should visibly move something.
- **Richer verbs, competing lines.** Direct damage, damage-over-
  time, walls-and-reprisal, control, harvest and mercy are all
  first-class and compete on merit. No line is the doctrinal path
  and none is protected; no objective function grades combat from
  above.
- **Mastery path, not brute force.** Read the enemy → generate
  and manage resources → use skills → commit to a line and make it
  land big → resolve via victory, mercy, or consequence. A fight
  should reward the read, not reward bunkering.
- **Enemies that escalate and telegraph big.** Enemies carry
  keywords, their own VITAE pool, tiered decks that never
  reshuffle backwards, and — for bosses — stages that change the
  fight mid-fight. A telegraph prints a digit, not an adjective.
- **Difficult, consequential mercy.** Befriend is HP-gated, costs
  heart tokens, and forks into spare-vs-exploit with lasting
  world consequences (`docs/adr/ADR-0007`).
- **Legibility without safety.** The mobile layer makes strange
  mechanics understandable without sanding off their danger.

## Scope

### Shipped (v1 surface)

The engine (`axiomancer-mechanics` v0.37.0) ships three standalone
encounter drivers (`combat` / `hazard` / `labyrinth`), each with its
own CLI subcommand, seeded engine, content library, and hermetic e2e
tests, plus pure-choice nodes with no standalone driver:

- **Hazard-Pattern Combat** — the primary combat system (Spec
  25/26). Card-and-dice; the enemy has ONE bar = VITAE. THE BIG
  NUMBERS REWRITE (2026-09-02) reset the scale, made DEAL a
  first-class card verb again, gave enemies keywords and stages,
  and repealed the laws that had accumulated around the old
  library (spec 32, spec 34 §3/§8 and spec 35 are historical).
  Dropping VITAE to 0 is the main win condition, with Befriend,
  RELENT and CONDEMN as authored alternatives.
- **Hazard minigame** ("v2") — environmental hazard card game.
- **Labyrinth** — the three-act labyrinth driver
  (`src/World/Labyrinth/`).
- **Gathering** — "The Gleaning" minigame was retired in Phase 76;
  `gathering` nodes now grant their items inline.
- **Rest** — the rest-choice node (Phase 52c-d): one irreversible
  choice of heal / anvil / cut. Retired the former rest minigame
  (Phase 52e).
- **Loot-cache** — "The Reliquary": since Phase 63 a three-way
  choice node (card / item / sacrifice), no standalone driver.
- **Quest Board** — "The Boy's Almanac" minigame was retired in
  Phase 61; the QuestLog objective tracker stays.
- The legacy turn-based combat (`resolveCombatRound`) and its
  dev-only tab were fully removed; Hazard-Pattern Combat is the
  only combat engine.

Supporting engines: character / progression / equipment (rarity,
affixes, set items), effects and interactions, enemy content +
AI, THE OATHS (a 3-axis CREED/AUGURY/TROTH alignment cube),
faction reputation, NPC dialogue trees, world maps / quests /
map-events, deterministic seeded RNG, and a Monte-Carlo
balance-sim harness.

The mobile app (`axiomancer-mobile` v1.9.0) presents this engine
through an expo-router shell: a tabbed home (character,
exploration, inventory, memoir, deck) plus per-encounter routes
(combat-encounter, hazard, hazard-deck, item-reward, rest, cache,
blacksmith, labyrinth, dialogue, event, cutscene, village), menu
routes (index, saves, settings) and dev routes. Dark-only
theme; four period display fonts; SVG placeholder art system.

### Queued / in progress

- Combat-depth follow-up specs 26–30 (draft): Catalyst
  multiplicative scaling, card-salvage sideways play, curated
  combat deck + synergy, reactive/telegraphing enemies,
  projected-lethality readout. (Specs 31/32 shipped since this
  section was last reviewed — Spec 31 fate-engine card/effect
  revamp and Spec 32 v3 no-strike card library, see above.)
- Authored content: `specs/characters` and `specs/story` currently
  hold only templates (`specs/world` has `W-01`) — character/story/
  world authoring is the open content pipeline (driven by the
  `character-spec` / `story-spec` / `world-spec` design skills).
- Northern-forest region content extension (apply the
  fishing-village expansion pattern to the mid-game gate).

### Non-goals

- **No databases / servers / containers** in mechanics — it is a
  pure, deterministic library + CLI.
- **No npm-publish loop** — mechanics is consumed as local source
  via the `@mechanics` alias, not a published package.
- **No auto-deploy from `main`** — the mobile app ships via
  manual EAS builds; `main` is not push-to-production.
- **Do not reintroduce the two-Pressure-Track combat win model** —
  it was deliberately removed. VITAE is the main bar; the authored
  alt-wins (Befriend, RELENT, CONDEMN) resolve fights beside it and
  are ordinary design tools, not exceptions to a law.
- **Do not reintroduce a governing objective function** — the
  win-rate curve, the Combat Quality Index and the rank bands were
  repealed 2026-09-02. Balance keeps bug detectors and a wide
  sanity envelope; it does not grade the game against a shape.
- New continents are deferred until the first continent is clean
  (`docs/adr/ADR-0005`).

## Contracts (must not break)

See `plan/bearings.md` § "URL / API / CLI contract" for the
enumerated, locked surface: the mechanics CLI subcommands, the
`@mechanics` public export barrel (`src/index.ts`), the mobile
routes, the canon combat copy (VITAE / STANCE), and the
deterministic seeded-RNG invariants.
