# Gathering Encounter ("The Gleaning") — Mobile UX Source of Truth

> Derived from `app/gathering/index.tsx`, `state/presenters/gathering.engine.ts`,
> `components/gathering/`, and `state/gathering/store-actions.ts` as of 2026-06-15.
>
> Mechanics rules (engine, site/plot catalogue, Wrath system) live in the mechanics repo:
> - `docs/encounters/gathering.md` — rules source of truth
>
> Design history:
> - `design/handoff-2026-05-*/` — Figma prototype and chat logs

---

## Screen entry

**Route:** `app/gathering/index.tsx`
**Gate:** `GatheringGate` in the root layout watches `vm.active`
(`selectHasActiveGathering`). Navigation fires only when the session is ready;
the screen auto-exits when the session clears (spoils claimed or abandoned).

No swipe-back gesture (`gestureEnabled: false`).

---

## Session phases and layer map

The presenter (`selectGatheringViewModel`) maps engine phase to a screen layer.

| Engine phase | Screen state | Primary overlay |
|---|---|---|
| `approach-select` | GatheringBoard + ApproachSelect overlay | ApproachSelect |
| `foraging` | GatheringBoard (board) + 5-plot spread | *(main play surface)* |
| `reprisal` | GatheringBoard | ReprisalFlashOverlay |
| `outcome` | GatheringBoard | OutcomeOverlay |
| `rewards` | — | SpoilsOverlay |
| `done` | *(auto-exit)* | — |

---

## Tutorial

A one-time tutorial coach overlays the board on the player's first gathering visit
(flag: `GATHERING_TUTORIAL_FLAG`). The `tutorial` boolean on `MobileGatheringSlice`
drives visibility; the flag is written to persistent flags on completion.

Component: `TutorialCoach.tsx`

---

## Approach select

Shown at session start before the spread is revealed. Two options stacked
full-width:

| Option | Badge | Tone |
|---|---|---|
| **GLEAN** (tender) | GLEAN | bone |
| **STRIP** (greedy) | STRIP | sulfur |

Each option shows: name, badge, description, reward label, cost label, CTA.

VM type: `GatherApproachChoiceVM`. CTA fires `selectGatheringApproach(key)`.

---

## Main play surface (GatheringBoard)

Three tiers on the board after approach is chosen:

1. **Scene strip** — site `boardHeadline` and `boardNote` (approach-dependent copy).
2. **Wrath meter** — `GatherWrathVM`. Shows: fill ratio, threshold pips (fired state),
   Dusk banner (when `duskFallen`), Watcher/Mire/Sickle status tags.
3. **Plot spread** — 5 `GatherPlotVM` cards rendered face-up. Each shows: name,
   family glyph, richness yield, Wrath cost, trait chip (GIFT / LURE / BREATH /
   TANGLE). Breath plots are visually distinguished (yield = 0, negative Wrath cost).
4. **Satchel tray** — `SatchelTray`: shows piece count, richness total, per-family
   breakdown, set threshold indicators.
5. **Descent button** — visible when `canDescend` is true; fires `descendGathering()`.
   One-way; button disappears once at Root depth.
6. **Offerings panel** — `GatherOfferingVM[]`. Each shows demand label, paid state,
   payability. Fires `payGatheringOffering(id)`.
7. **Tools panel** — `GatherToolVM[]`. One-use per session; fires `useGatheringTool(id)`.
8. **Withdraw button** — enabled when `withdrawEnabled`; label: "WITHDRAW", sub-label
   shows piece count or "LEAVE EMPTY-HANDED". Fires `withdrawFromGathering()`.

Boons panel (`GatherBoonVM[]`) is a collapsible footer on the board showing roll
status and reward label.

---

## Plot card rendering

Each plot card from the spread displays:

- Name and family label chip
- Richness yield (or "TEND" for breaths)
- Wrath cost chip (red if > 0; green if ≤ 0)
- Trait chip: GIFT / LURE / BREATH / TANGLE (absent if no trait)
- Tap-to-read keyword glossary (always includes WRATH + trait keyword + SET)

Tapping a plot fires `harvestGatheringPlot(uid)`.

---

## Reprisal flash overlay

Fires after a Wrath threshold event. `ReprisalFlashOverlay` renders:

- Name and description of the reprisal kind
- Detail note (e.g. "−3 VITAE", "2 BLOOM pieces spoil", "the jar holds")
- Eruption flag — visually distinguished (full site eruption screen treatment)
- Dismiss → `continueGatheringAfterReprisal()`

VM type: `GatherReprisalFlashVM`.

---

## Outcome overlay

Shows the final result after `withdrawFromGathering()` or forced eruption:

- Tier word: `COMMUNION` / `LADEN` / `DESPOILED` / `ROUTED`
- Sub-copy and outcome line
- CTA → advances to rewards phase (`acknowledgeGatheringOutcome()`)

---

## Spoils overlay (SpoilsOverlay)

Presented in the `rewards` phase. Shows the full accounting:

- Tier label
- Kept stacks: plotId → name, family, quantity (richness total per plot type)
- Lost count (spoiled by eruption)
- Per-family totals with set threshold and set indicator
- Set refinements: completed family sets refine into named treasures
- Coin notes (e.g. "+8 shillings — SAINT-WAX SEAL refined")
- VITAE notes (blessings, bites, offering blood tithes)
- Scar note (if `scarred`: "☠ THE DESPOILER'S SCAR")
- Boon results with reward labels
- Confirm CTA: "BIND THE SATCHEL ›" or "WALK ON ›" → `claimGatheringSpoils()`

VM type: `GatherSpoilsVM`.

---

## Depth system

Three depth tiers; descent is one-way per session.

| Index | Name | Character |
|---|---|---|
| 0 | Verge | Entry level; lowest richness, lowest Wrath |
| 1 | Hollow | Mid-tier; richer, angrier |
| 2 | Root | Deepest; highest richness, highest Wrath; rarest plots |

`depthName` and `depthNames` from the VM drive the depth indicator in the board
header. `canDescend` gates the descent button.

---

## Presenter — GatheringViewModel

Entry: `selectGatheringViewModel({ gathering, player? })` in
`state/presenters/gathering.engine.ts`.

Key VM sub-shapes:

```typescript
GatherPlotVM {
  uid, plotId, name
  family, familyLabel
  trait, traitLabel           // null if no trait
  yieldRichness               // 0 for breaths
  wrathCost                   // ≤ 0 for breaths (relief)
  isBreath
  flavor
  keywords                    // { id, name, desc }[] — glossary entries
  accessibilityLabel
}

GatherSatchelFamilyVM {
  family, label
  pieces, richness
  setThreshold
  set                         // true when threshold met
}

GatherWrathVM {
  value, max
  thresholds                  // { at, fired }[]
  ratio                       // 0..1
  duskFallen, watcherWoken, mired, sickled
}

GatherOfferingVM {
  id, name, demandLabel
  paid, payable
  flavor
}

GatherToolVM {
  id, name, desc, used
}

GatherBoonVM {
  id, name, desc
  status                      // GatherBoonStatus
  rewardLabel                 // e.g. "+8 shillings"
}

GatherApproachChoiceVM {
  key                         // 'glean' | 'strip'
  name, badge, badgeTone
  description, rewardLabel, costLabel, ctaLabel
}

GatherReprisalFlashVM {
  kind                        // reprisal event kind
  name, desc, detail
  eruption, veiled
}

GatherOutcomeVM {
  tier                        // 'communion' | 'laden' | 'despoiled' | 'routed'
  word, sub, line, ctaLabel
}

GatherSpoilsVM {
  tier
  keptStacks                  // { plotId, name, family, quantity }[]
  lostCount
  familyTotals                // GatherSatchelFamilyVM[]
  refinements                 // { family, name, desc }[]
  roundHarvest
  coinNotes, vitaeNotes
  scarNote
  boons                       // GatherBoonVM[]
  boonNote
  confirmLabel
}
```

---

## Store actions

`state/gathering/store-actions.ts`:

```
selectGatheringApproach(key)       ← 'glean' | 'strip'
harvestGatheringPlot(uid)          ← take a plot from the spread
descendGathering()                 ← go deeper (one-way)
payGatheringOffering(offeringId)
useGatheringTool(toolId)
withdrawFromGathering()            ← exit the site
continueGatheringAfterReprisal()   ← resume after reprisal overlay
acknowledgeGatheringOutcome()      ← proceed to spoils
claimGatheringSpoils()             ← apply world-state delta, clear session
```

Tutorial flag: `GATHERING_TUTORIAL_FLAG` — persisted to world flags on first
completion. The `tutorial` slice boolean controls the coach overlay.

---

## ADR references

- **ADR-0001** — engine truth boundary: mobile presenter is mapping only; never recomputes rules.
- **ADR-0003** — mobile does not invent mechanics; file issue if the engine is missing something.
