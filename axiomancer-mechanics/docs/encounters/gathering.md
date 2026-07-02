# Gathering Encounter ("The Gleaning") — Mechanics Source of Truth

> Derived from `src/World/Gathering/` as of 2026-06-15.
> Phase 142 — Live.

---

## What it is

A push-your-luck harvesting minigame triggered by Gathering map nodes. The player
harvests plots from a living site; taking plots raises the site's Wrath; threshold
events fire reprisals; the site may erupt and claw back the satchel. The player
decides when greed becomes catastrophe.

---

## Core loop

1. Gathering node triggers. Site intro is revealed.
2. Player chooses **Glean** (tender approach) or **Strip** (greedy approach).
3. Site presents a 5-plot spread face-up, drawn from the site's plot pool.
4. Player harvests one plot from the spread; remaining plots redraw.
5. Wrath rises by the harvested plot's cost. Threshold events fire exactly once
   each when their threshold is crossed (place remembers the crossing).
6. Player may descend to the next depth tier (Verge → Hollow → Root; one-way).
7. Dusk falls if the harvest count exceeds the site's dusk limit; each
   subsequent taking adds +1 wrath cost.
8. Player withdraws when satisfied (or is forced out by eruption).
9. Claim phase: tools are applied, boons are scored, final satchel is weighed.

---

## Approach choice

| Approach | Effect |
|---|---|
| **Glean** (tender) | Lower starting Wrath; respects the site. Small richness cap on each plot. |
| **Strip** (greedy) | Bonus richness on every plot; higher starting Wrath. The site is already angrier. |

---

## Plot traits

| Trait | Rule |
|---|---|
| **gift** | Offered freely — this plot costs 0 Wrath to take. |
| **lure** | Rich and angry — above-band richness, above-band Wrath cost. |
| **breath** | Tend instead of take — yields nothing; Wrath decreases. |
| **tangle** | Taking it tramples the rest — other plots on the current spread are discarded and fresh ones are drawn. |

---

## Plot families

Four families determine what is harvested and what boons apply:

| Family | Flavour |
|---|---|
| **Bloom** | Flowers and mosses |
| **Resin** | Saps and resins from bark and root |
| **Vein** | Stone-held minerals |
| **Bone** | Animal parts, shed or found |

Family **sets** (enough richness from one family) refine into a named treasure at
the weighing.

---

## Wrath system

- **Wrath meter:** fills as plots are harvested.
- **Thresholds:** fire a reprisal exactly once each. The place remembers after
  re-crossing (thresholds do not re-fire on descent or backslide).
- **Eruption:** when the Wrath meter is full the site erupts — claws back part or
  all of the satchel, forces the player out.
- **Dusk:** after the dusk harvest count, each subsequent harvest adds +1 Wrath to
  every plot on the spread (stacks with the plot's own cost).

---

## Depth tiers

| Tier | Name | Character |
|---|---|---|
| 0 | Verge | Entry level; lowest richness, lowest Wrath |
| 1 | Hollow | Mid-tier; richer, angrier |
| 2 | Root | Deepest; highest richness, highest Wrath; rarest plots |

Descending is one-way; a player who goes deeper cannot surface to a shallower tier
in the same session.

---

## Plot spread

- 5 plots are always face-up for the player's consideration.
- Taking one causes the others to redraw from the site's tier-appropriate pool.
- Tangle plots redraw **all** remaining plots when taken.

---

## Offerings

Demand costs (shillings / VITAE / material) paid at claim time. Each offering
can be met once per site visit. Meeting an offering reduces Wrath and increases
Grace.

---

## Field tools

One-use tools available at each site (one use per session). Examples from the
content catalogue: sickle, veil, twig, bell, jar, spade. Tools apply at the
claim phase (specific mechanical effects per tool, defined in `gathering.content.ts`).

---

## Boons

Rolled per-site; family sets grant bonuses at the weighing. Boon effects are
defined in the boon catalogue (`GATHERING_BOONS`).

---

## Outcomes

A claim phase weighing determines the outcome tier based on Wrath level and satchel
contents at withdrawal. The outcome feeds back into the world state (shillings,
materials, keepsakes).

---

## Keywords (tap-to-read glossary)

| Keyword | Meaning |
|---|---|
| **WRATH** | The site's anger; every taking raises it; thresholds fire reprisals |
| **GRACE** | The site's favour; earned by offerings |
| **GIFT** | Plot costs 0 Wrath to take |
| **LURE** | Rich and baiting; above-band richness + Wrath |
| **BREATH** | Tend instead of take; Wrath decreases; no yield |
| **TANGLE** | Taking tramples the rest — others discard and redraw |
| **SET** | Enough richness of one family refines into a named treasure |
| **OFFERING** | Pay what the place demands; Wrath eases, Grace grows |
| **DUSK** | Linger limit; each harvest after it adds +1 Wrath |
| **DEPTH** | Three strata; descending is one-way |

---

## Session state shape

Key fields on `GatheringSessionState` (see `gathering.types.ts` for the full type):

```
siteId           string
phase            GatheringPhase  — approach-select | board-play | reprisal | outcome | done
approach         'glean' | 'strip' | null
depth            0 | 1 | 2
spread           GatherPlotDef[]          — the 5 face-up plots
satchel          GatheringStack[]         — harvested family richness
wrath            number
wrathMax         number
thresholdsFired  Set<number>
duskFallen       boolean
harvestCount     number
toolsUsed        Set<string>
offeringsPaid    Set<string>
boomsRolled      GatherBoonState[]
```

---

## Engine API

Exported from `src/World/Gathering/index.ts`. Key transitions:

```typescript
createGatheringSession(siteId, seed)
selectGatheringApproach(state, approach)     // 'glean' | 'strip'
harvestGatheringPlot(state, uid)             // take a plot from the spread
descendGathering(state)                      // go deeper (one-way)
payGatheringOffering(state, offeringId)
useGatheringTool(state, toolId)
withdrawFromGathering(state)                 // exit the site
continueGatheringAfterReprisal(state)        // resume after a reprisal fires
claimGatheringSpoils(state)                  // → 'done'
```
