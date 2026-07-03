# Axiomancer — product spec

> Retrospective spec, written at nexus adoption (2026-07-03) from
> the live design corpus (`axiomancer-mechanics/VISION.md`,
> per-package `AGENTS.md`/`CLAUDE.md`, `docs/adr/`, `specs/`). It
> captures the product as it actually exists so the autonomous
> loop has a stable anchor. Standing decisions and stack pins live
> in `plan/bearings.md`; this file is the "what and why".

## Product

Axiomancer is a turn-based, single-player philosophy RPG for
mobile (Expo / React Native), backed by a deterministic
TypeScript rules engine. Its thesis — stated in
`axiomancer-mechanics/VISION.md` — is that **your worldview is a
mechanical input, not flavor**: mercy, honesty, restraint, and
skill are each a mechanically consequential stance, not a
role-play veneer.

The core loop: explore a map → resolve authored node encounters
(combat, minigames, dialogue, cutscenes) → make morally charged
choices that shift a 3-axis philosophical alignment and faction
reputation → carry those consequences into future world, boss,
and region state.

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

- **Mechanics make worldview consequential.** Strange, legible,
  consequential systems over safe RPG imitation.
- **Status effects are the main fun.** (Load-bearing balance
  doctrine, set 2026-06.) The intended path to a kill is status
  play, not brute-force basic attacks. Low status-effect
  engagement is a balance *failure* even when win/loss looks
  healthy.
- **Mastery path, not brute force.** Read the enemy → generate
  and manage resources → use skills → apply and exploit status →
  resolve via victory, mercy, or consequence. Attacking or
  turtling should stay viable-but-worse.
- **Difficult, consequential mercy.** Befriend is HP-gated, costs
  heart tokens, and forks into spare-vs-exploit with lasting
  world consequences (`docs/adr/ADR-0007`).
- **Legibility without safety.** The mobile layer makes strange
  mechanics understandable without sanding off their danger.

## Scope

### Shipped (v1 surface)

The engine (`axiomancer-mechanics` v0.37.0) ships six standalone
encounter drivers, each with its own CLI subcommand, seeded
engine, content library, tuning loop, and hermetic e2e tests:

- **Hazard-Pattern Combat** — the primary combat system (Spec
  25/26). Card-and-dice; the enemy has ONE bar = HP; status is
  the efficient path to 0 HP. HP is the **sole** win condition.
- **Hazard minigame** ("v2") — environmental hazard card game.
- **Gathering** — "The Gleaning."
- **Rest** — "The Night Watch" (three watches at camp).
- **Loot-cache** — "The Reliquary" (three layers, one probe).
- **Quest Board** — "The Boy's Almanac" (authored tabletop
  board).
- The legacy turn-based combat (`resolveCombatRound`) and its
  dev-only tab were fully removed; Hazard-Pattern Combat is the
  only combat engine.

Supporting engines: character / progression / equipment (rarity,
affixes, set items), effects and interactions, enemy content +
AI, 3-axis philosophy alignment, faction reputation, NPC dialogue
trees, world maps / quests / map-events, deterministic seeded
RNG, and a Monte-Carlo balance-sim harness.

The mobile app (`axiomancer-mobile` v1.9.0) presents this engine
through an expo-router shell: a tabbed home (character,
exploration, inventory, memoir) plus per-encounter routes
(combat-encounter, hazard, gathering, rest, cache, quest,
dialogue, event, cutscene, village) and dev routes. Dark-only
theme; four period display fonts; SVG placeholder art system.

### Queued / in progress

- Combat-depth follow-up specs 26–30 (draft): Catalyst
  multiplicative scaling, card-salvage sideways play, curated
  combat deck + synergy, reactive/telegraphing enemies,
  projected-lethality readout.
- Authored content: `specs/characters`, `specs/story`,
  `specs/world` currently hold only templates — character/story/
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
  it was deliberately removed; HP is the sole win condition.
- New continents are deferred until the first continent is clean
  (`docs/adr/ADR-0005`).

## Contracts (must not break)

See `plan/bearings.md` § "URL / API / CLI contract" for the
enumerated, locked surface: the mechanics CLI subcommands, the
`@mechanics` public export barrel (`src/index.ts`), the mobile
routes, the canon combat copy (VITAE / STANCE), and the
deterministic seeded-RNG invariants.
