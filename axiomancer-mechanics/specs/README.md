# Specs

> A focused planning surface so you (the developer) and an AI assistant can
> have a structured conversation about what to build next, in what order, and
> how. Each spec is scoped to one body of work, surfaces the open design
> decisions, and ends with a concrete acceptance checklist.

## Why this folder exists

`GAME-ROADMAP.md` lists *what* is left to do. `Knowledge-Gaps.md` lists *what
isn't decided*. Neither tells you *what to do next* or *how to start*. The
specs in this folder bridge that gap: each one is small enough to start work
from, structured around the decisions that block implementation, and tagged
with dependencies so you can pick the right one to pull next.

## Quick links

- **First time here?** Read [`00-how-to-use-specs.md`](./00-how-to-use-specs.md).
- **Back for another session?** Skip to the **Recommended order** table below.

## How to use a spec (the conversation loop)

Every spec follows the same shape:

1. **Goal & one-line summary** — what success looks like.
2. **Why now / dependencies** — what this unblocks; what blocks it.
3. **Current state** — what already exists in the code.
4. **Open questions to answer** — numbered, with `> Your answer:` placeholders.
   Answer in-place. The AI will read your answers as authoritative when it
   implements.
5. **Proposed approach** — the AI's recommended default if you don't
   override, broken into discrete commits.
6. **Acceptance checklist** — what "done" means.
7. **Out of scope** — explicitly deferred items.

### The conversation loop

```
1. Pick a spec from the recommended order below.
2. Read it end-to-end; skim sections (1)-(3).
3. Answer the questions in section (4) inline. Short answers are fine
   ("yes / no / option B"); add a note when you have a strong opinion.
4. Tell the AI: "Spec NN is ready, please implement."
5. The AI will:
   a. Re-read the spec.
   b. Confirm it has every answer it needs (asks if any are still TBD).
   c. Open a branch and work through the commits in section (5).
   d. Update section (6) as it goes; tick the boxes as commits land.
6. When the checklist is fully ticked, mark the spec [DONE] in this file
   and update the roadmap.
```

If a spec turns out to be too big once you start, say so — the AI will split
it into a follow-up spec rather than ploughing on.

## Recommended order

The order below is the AI's default suggestion. Items at the top unblock the
most other work. Feel free to override.

| # | Spec | Why this order |
|---|------|----------------|
| 1 **DONE** | [`01-effects-engine-completion.md`](./01-effects-engine-completion.md) | Many roadmap items reference unwired effect mechanics (DoT, stat mods, action restrictions). Finish them first. |
| 2 **DONE** | [`02-combat-round-resolver.md`](./02-combat-round-resolver.md) | Replaces the inline CLI loop with `resolveCombatRound`. Required before skills/items can plug in cleanly. |
| 3 **DONE** | [`03-tier2-tier3-effect-procs.md`](./03-tier2-tier3-effect-procs.md) | Phase 2b: `Stance × action` proc tables. Builds on (1) + (2). |
| 4 **DONE** | [`04-skills-engine.md`](./04-skills-engine.md) | Phase 3. Depends on (2) and (3) for combat integration. Ships types + engine only (no skill content). |
| 4b **DONE** | [`04b-skills-library-and-e2e.md`](./04b-skills-library-and-e2e.md) | Companion to (4). Ships 12 early-game skills and the hermetic e2e scripted test. Depends on (4). |
| 5 **DONE** | [`05-equipment-engine.md`](./05-equipment-engine.md) | Phase 4. Depends on (1) for stat-mod aggregation. Ships types + engine only (no library content). |
| 5b **DONE** | [`05b-equipment-library.md`](./05b-equipment-library.md) | Companion to (5). Ships 50 equipment pieces + 12 consumables with resource economy interactions. Depends on (5). |
| 6 **DONE** | [`06-character-progression.md`](./06-character-progression.md) | Phase 5. Depends on (4) for skill learning. |
| 7 **DONE** | [`07-enemy-content-and-ai.md`](./07-enemy-content-and-ai.md) | Phase 6. Depends on (3) for richer AI behaviour. |
| 8 **DONE** | [`08-world-content-and-hazards.md`](./08-world-content-and-hazards.md) | Phase 7. Depends on (1) for hazard ticks while exploring. |
| 9 **DONE** | [`09-game-loop-orchestration.md`](./09-game-loop-orchestration.md) | Phase 8. Top-level orchestration + `createGameStore` wiring for world/exploration; depends on (8) and most of the above. |
| 10 **DONE** | [`10-moral-difficulty-meter.md`](./10-moral-difficulty-meter.md) | Touches multiple systems; OK to spec early; implement after (9) (and (8) where it touches `MapEvent` / `processNode`). |
| 11 **DONE** | [`11-rng-seeding-and-test-harness.md`](./11-rng-seeding-and-test-harness.md) | Cross-cutting test infra. Doable any time; biggest payoff when (1) & (2) are landing. |
| 12 **DONE** | [`12-package-architecture-and-events.md`](./12-package-architecture-and-events.md) | Defines the engine ↔ React Native UI boundary. Pull this in before the UI consumer starts. |
| 13 **DONE** | [`23-map-events.md`](./23-map-events.md) | Phase 23. MapEvents engine + pool authoring pattern; acceptance fully ticked at Phase 41 unit 3 + Phase 43 alignmentDelta extension. |
| 14 **DONE** | [`14-philosophical-alignment.md`](./14-philosophical-alignment.md) | Phases 42–46. 3-axis alignment cube (Epistemology × Outlook × Scope) + 27-cell content registry; observable, payloadable, enemy-side, and gated. Spec authored retroactively at Phase 58 (engine shipped Phase 42 `bdfda00`; content surface filled through Phase 46). |
| 15 **DONE** | [`15-difficulty-curve.md`](./15-difficulty-curve.md) | Phase 116. Difficulty doctrine defining target bands per progression tier (fishing-village / northern-forest / endgame): rounds-to-resolve, survivability %, damage ratios, friendship reachability. References Phase 104 probe fields as measurement surface. Pure docs/spec. |
| 16 **DONE** | [`../plan/phases/phase_99_unlocked_skill_access.md`](../plan/phases/phase_99_unlocked_skill_access.md) | Phase 99 (shipped `5759932`; re-shipped as Phase 141 `aad63c5`). Removes the legacy equipped-skill/loadout gate. Learned/unlocked skills become combat-accessible; combat/CLI/playtest consumers show only currently affordable skills. |
| 25 **DONE** | [`25-hazard-pattern-combat.md`](./25-hazard-pattern-combat.md) | 2026-06-21. Hazard-Pattern Combat — the card-and-dice driver (`resolveCombatPhase`) where status effects fill two Pressure Tracks (DoT Erosion + Control Saturation) that are the only practical win conditions. Ships alongside the legacy `resolveCombatRound`. Engine + mobile + glyphs shipped; tuned by `/combat-tuning`. |
| 26 *draft* | [`26-catalyst-multiplicative-scaling.md`](./26-catalyst-multiplicative-scaling.md) | Combat depth follow-up #1. Catalyst card class — multiply stacked DoT into an explosive DoT-track spike (StS Catalyst). The build-then-detonate payoff the linear pressure model lacks. Depends on Spec 25. |
| 27 *draft* | [`27-card-salvage-sideways-play.md`](./27-card-salvage-sideways-play.md) | Combat depth follow-up #2. Spend any card sideways for a generic benefit (mint a die / chip pressure) — Mage Knight's no-dead-cards rule. Ports the Hazard salvage pattern. Depends on Spec 25. |
| 28 *draft* | [`28-curated-combat-deck-and-synergy.md`](./28-curated-combat-deck-and-synergy.md) | Combat depth follow-up #3. A curated combat loadout (8–10 cards) + surfaced synergy combos, replacing "draw from all known skills" — StS deck-building. Depends on Spec 25 + Spec 04. |
| 29 *draft* | [`29-reactive-enemies-telegraphed-intent.md`](./29-reactive-enemies-telegraphed-intent.md) | Combat depth follow-up #4. Reactive enemies that telegraph + respond (cleanse / harden / enrage / adapt-stance) — StS intents + Into the Breach counterplay. Depends on Spec 25 + Spec 07. |
| 30 *draft* | [`30-projected-lethality-readout.md`](./30-projected-lethality-readout.md) | Combat depth follow-up #5. Surface the Phase 125 lethality projection ("lethal in N" + a Finish affordance) so the kill is foreseeable — StS visible poison / Into the Breach foresight. Depends on Spec 25 + Phase 125. |

## Conventions

- A spec is a *living document*. As you answer questions, edit the spec
  in-place. Treat it as the canonical source-of-truth for that body of work.
- One spec, one branch, one PR — unless a spec explicitly chunks itself
  into commits that land separately.
- When a spec is fully implemented, append `> [DONE on YYYY-MM-DD — see PR #N]`
  at the top and link the PR.
- Don't be afraid to write `> Your answer: defer — implement default and
  revisit.` That's a valid answer too.