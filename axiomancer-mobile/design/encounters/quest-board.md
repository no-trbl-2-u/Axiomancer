# Quest Board Encounter ("The Boy's Almanac") — Mobile UX Source of Truth

> Derived from `app/quest/index.tsx`, `state/presenters/quest.engine.ts`,
> `components/quest/`, and `state/quest/store-actions.ts` as of 2026-06-15.
>
> Mechanics rules (engine, board definitions, space catalogue) live in the mechanics repo:
> - `docs/encounters/quest-board.md` — rules source of truth
>
> Design history:
> - `design/handoff-2026-05-*/` — Figma prototype and chat logs

---

## Screen entry

**Route:** `app/quest/index.tsx`
**Gate:** `QuestGate` in the root layout watches `vm.active`
(`selectHasActiveQuestBoard`). Navigation fires when a Quest Board session is
created; the screen auto-exits when the session clears.

No swipe-back gesture (`gestureEnabled: false`).

---

## Session phases and layer map

The presenter (`selectQuestBoardVM`) maps engine phase to a screen layer.

| Engine phase | Screen state | Primary overlay |
|---|---|---|
| `intro` | QuestBoardTrack + intro card | IntroOverlay |
| `idle` | QuestBoardTrack | *(roll button active)* |
| `space-pending` | QuestBoardTrack | SpacePendingOverlay |
| `dusk` | QuestBoardTrack | DuskOverlay |
| `outcome` | — | OutcomeOverlay |
| `done` | *(auto-exit)* | — |

---

## Board display (QuestBoardTrack)

The board is rendered as a looping tile track:

1. **Space tiles** — `QuestSpaceVM[]`. Each tile shows: glyph, kind label,
   `isPiece` highlight (the moving piece).
2. **Resource bar** — fish, vigor / maxVigor, wind, day, stretch counter
   (`stretch / stretchesPerDay`).
3. **Parts ledger** — `QuestPartVM[]`: each part kind shows carried, fitted,
   required. Hull progress bar: `boatProgress` (0..1 fraction of total fitted/required).
4. **Last roll chip** — `lastRoll: { die, bonus, total }` shown after each bone
   die roll.
5. **Charms strip** — `QuestCharmVM[]`: each charm shows name, glyph, used/primed
   state. Tapping a usable charm fires `useQuestCharm(id)` (enabled only in `idle`
   phase when unused and unprimed).
6. **Vows strip** — `QuestVowVM[]`: name, desc, `status` chip.
7. **Tier preview chip** — `tierPreview` shown live as a running forecast.
8. **Roll button** — fires `rollQuestBone()`. Active only in `idle` phase.
9. **Legend sheet** — `QuestLegend` lists all 9 space kinds with glyph and blurb.

---

## Space glyphs

| Kind | Glyph |
|---|---|
| slipway | ⚓ |
| gather | ✦ |
| duel | ⚔ |
| snag | ⚠ |
| hearth | ☽ |
| market | ⌂ |
| parley | ◉ |
| cache | ◈ |
| omen | ▶ |

---

## Space pending overlay

Shown when the piece lands on a space (`space-pending` phase). Renders
`QuestPendingVM`:

- `title`, `body` — space name and scenario copy
- `options: QuestOptionVM[]` — each shows label, desc, enabled state, disabled
  reason if locked (inventory gating). CTA: `chooseQuestSpaceOption(optionId)`.
- `result: QuestResultVM | null` — after an option is chosen: title, body,
  `rolls[]`, `deltaChips[]` (compact chips: "+2 IRON NAILS", "−1 VIGOR", etc.).
  Dismiss → `continueQuestSpace()`.
- `ledger: string[]` — running part/fish/vigor ledger for the space resolution.

---

## Dusk overlay

Shown when the day count exceeds the board's lap target. Narrative copy +
Dusk consequence note. Dismiss → `acknowledgeQuestDusk()`.

---

## Intro overlay

Shown at `intro` phase. Board title, `storyBeat`, and intro copy. "Begin →"
fires `beginQuestBoardAction()` (engine: `beginQuestBoard`).

---

## Outcome overlay

Shown at `outcome` phase. Renders `QuestOutcomeVM`:

- Tier label: `MASTERWORK` / `SEAWORTHY` / `DRIFTWOOD`
- Board-defined outcome copy
- Stats: `daysTaken`, `fishLeft`, `vigorLeft`, `rolls` (total bone-die throws),
  `vowsKept`
- Vow results list: each `QuestVowVM` with status chip

CTA: `claimQuestBoardCompletion()`.

---

## Hull meter (QuestHullMeter)

A dedicated component that renders `boatProgress` as a visual hull fill. Shown
persistently in the board resource bar and highlighted in the outcome overlay.

---

## Presenter — QuestBoardVM

Entry: `selectQuestBoardVM({ quest })` in `state/presenters/quest.engine.ts`.

Key VM sub-shapes:

```typescript
QuestSpaceVM {
  index, id
  kind                        // QuestSpaceKind
  name, glyph
  isPiece                     // the moving piece is here
  isSlipway
}

QuestPartVM {
  kind                        // QuestPartKind
  label                       // board-defined part name
  fitted, required, carried
}

QuestCharmVM {
  id, name, desc, flavor
  used, primed
  usable                      // idle phase + unused + unprimed
}

QuestVowVM {
  id, name, desc
  status                      // QuestVowStatus
}

QuestOptionVM {
  id, label, desc
  enabled
  disabledReason              // null when enabled
}

QuestResultVM {
  title, body
  rolls                       // die faces shown
  deltaChips                  // compact delta strings
}

QuestPendingVM {
  kind, title, body
  options                     // QuestOptionVM[]
  result                      // QuestResultVM | null (post-choice)
  ledger                      // running string[]
}

QuestOutcomeVM {
  tier                        // 'masterwork' | 'seaworthy' | 'driftwood'
  tierLabel, copy
  daysTaken, fishLeft, vigorLeft, rolls, vowsKept
  vows                        // QuestVowVM[]
}
```

Top-level `QuestBoardVM` also exposes:
- `tierPreview` — live running forecast during play
- `boatProgress` — 0..1 fraction for the hull meter
- `collapsedToday` — whether today's lap has already collapsed (used for Dusk gating)

---

## Store actions

`state/quest/store-actions.ts`:

```
beginQuestBoardAction(boardId?)          ← start the session
rollQuestBoneAction()                    ← roll the die, advance piece
chooseQuestSpaceOptionAction(optionId)   ← resolve the landed space
continueQuestSpaceAction()               ← advance after space result
useQuestCharmAction(charmId)
acknowledgeQuestDuskAction()
claimQuestBoardCompletionAction()        ← write completion flag, clear session
```

Quest board completion is recorded to persistent `flags` by the claim action.

---

## Shipped boards

One board is live as of 2026-06-15: **Build The Boat** (`boardId: 'build-the-boat'`).

Board params: ~14 spaces, ~3-lap track, 4 part families (Plank, Pitch, Cloth, Nail),
Slipway at start/end. Target playthrough: 5–10 minutes.

Additional boards are in the design backlog; the engine supports multiple board
definitions via `questBoardDefOf(session)`.

---

## ADR references

- **ADR-0001** — engine truth boundary: mobile presenter is mapping only; never recomputes rules.
- **ADR-0003** — mobile does not invent mechanics; file issue if the engine is missing something.
