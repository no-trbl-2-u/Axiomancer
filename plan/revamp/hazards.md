# Revamp — hazards

> Part plan of [THE REVAMP](README.md). Phases **R6** (reset, loop) and
> **B3** (mechanics redesign, owner). Decision D52. Status: PROPOSED.

## Where things stand

The hazard minigame (`World/Hazard/`, ~3.7k LOC; mobile
`components/hazard/`, `state/hazard/store-actions.ts`) has its own card
library (~150-card "codex" roster), keyword glossary (SURGE, FORCE, ESCAPE,
CONVERT, …), routes, sub-quests, consequences and rewards.

Four rewards say one thing and do another
(`hazard.content.ts:463-476`, mobile `store-actions.ts:516-551`):

| Reward | Promises | Does |
|---|---|---|
| Paradox Token | a boon "for your next combat" | sets a flag nothing reads |
| Hexed | "begin your next combat with a hostile Curse die" | sets a flag nothing reads |
| Bonus Relic | a relic | pays shillings |
| Shrine Cache "of relics" | relics | pays shillings |

T, 2026-09-28: "Reset hazards too. I plan on changing some of the
fundamental mechanics of hazard."

## R6 — Hazard reset (loop)

Goal: the smallest hazard deck that still plays end-to-end, so B3 starts
from a clean floor. Defaults (T may amend at ratification):

1. Keep the engine loop (roll, place dice, meters, routes) and the mobile
   board untouched in shape.
2. Cut the hazard card library to a minimal core: a few cards per route
   meter, no codex expansion roster, no sub-quests.
3. Rewards: only ones that do what they say — shillings, a heal, a scar
   (mended at inns). Delete Paradox Token, Hexed and their flags
   (`hazard.deck-flags.ts`); delete Bonus Relic and Shrine Cache (B1 may give
   relics a real source).
4. Keywords: the hazard glossary keeps only words the minimal cards print
   (D45 applies to the hazard glossary too; the 14 hazard keyword chips'
   tooltip mount from Phase 82 shrinks with it).
5. Tuning constants and sims (`hazard.tuning.ts`, `hazard.sim.ts`,
   `docs/hazard-balance-recommendations.md`) shrink to the core or archive.
6. Save migration for hazard-deck state that references deleted cards.

Independent of the combat resets; requires only R0.

## B3 — Hazard mechanics redesign (owner)

T's session. The reset hands it a minimal deck, honest rewards and a
glossary with only live words.
