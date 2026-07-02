# Quest Board Encounter ("The Boy's Almanac") — Mechanics Source of Truth

> Derived from `src/World/QuestBoard/` as of 2026-06-15.
> Phase 137 — Live.

---

## What it is

A tabletop-metaphor board game triggered by a main-quest map node. The Boy
sketches a game board in the endpapers of the Father's book and plays it out:
a self-contained mini-story quest. The board is Axiomancer-lite — nine distinct
space kinds each play a compressed version of another encounter.

First (and currently only) board: **Build The Boat** — the Boy must collect four
boat-part families (Plank, Pitch, Cloth, Nail) and fit them onto a hull at the
Slipway before Dusk falls.

---

## Core loop

1. Quest Board node triggers. Session begins with 2 Charms dealt and 2 Vows rolled.
2. Player rolls the **bone die** (6-sided) to advance their piece.
3. Piece lands on a space; that space's mini-decision plays out.
4. The round repeats until all four part-families are fitted onto the hull
   (victory), or Dusk falls too early (failure).
5. Outcome is judged by parts fitted, Vigor remaining, days taken, and Vows kept.

---

## Resources

| Resource | Description |
|---|---|
| **Vigor** | Stamina pool. Spent by Duel losses and Snag failures. Recovered at Hearth spaces. If Vigor reaches 0, the board ends (failure). |
| **Parts** (4 kinds) | Plank, Pitch, Cloth, Nail. Collected from appropriate spaces or market; fitted at the Slipway. |
| **Fish** | Currency token for this board. Spent at the Market. |
| **Days** | Round counter. When days exceed the board's lap target, Dusk falls. |

---

## Space kinds

Nine space kinds, each with a distinct decision shape.

| Kind | Decision | Mechanic |
|---|---|---|
| **Slipway** | Start / goal. Fit carried parts onto the hull. | Fit all four part families to win. |
| **Gather** | Push-your-luck — roll the bone die; wet haul vs bust. | Collect parts from the sea; stop before the dice go cold. |
| **Duel** | Allocate Vigor pre-roll against a critter. | Commit an amount, then reveal the critter's roll. Win = reward; lose = Vigor bite. |
| **Snag** | Insure the crossing (bare / brace / detour). | Bare: cross free, risk slip-back. Brace: spend 1 Fish for safety. Detour: lose a day, guaranteed pass. |
| **Market** | Escalating shop (repeating buys cost more). | Buy parts or tools with Fish. Price rises with each purchase of the same item. |
| **Parley** | NPC branch — menu reacts to inventory. | Dialogue options change based on what the player carries. |
| **Hearth** | Vigor restore. | Recover lost Vigor; may offer a small keepsake. |
| **Cache** | Rolled find. | Roll the bone die for a small random reward. |
| **Omen** | Flavor + small luck turn. | Narrative beat; minor mechanical effect (luck shift). |

---

## Charms

Two Charms are dealt at session start. One-use trinkets that give a single-roll
advantage. Current catalogue:

| ID | Name | Effect |
|---|---|---|
| `gull-feather` | Gull Feather | Next roll: cast the bone twice, keep the higher face. |
| `mothers-locket` | Mother's Locket | Next duel: +2 on your die. |
| `tar-twine` | Tar-Soaked Twine | Next snag: cross clean, no roll. |
| `lucky-hook` | Lucky Hook | Next gather: double the take. |
| `friends-whistle` | The Friend's Whistle | Next roll: +2 to the move. |

---

## Vows

Two Vows are rolled at session start — optional per-session objectives judged at
outcome. Current catalogue:

| ID | Name |
|---|---|
| `swift-keel` | The Swift Keel — finish the build by end of day 5 |
| `unbitten` | Unbitten — do not lose Vigor to any Duel or Snag |

(Additional Vows may exist in `quest-board.content.ts`; see source for the full list.)

---

## Build The Boat board

The only shipped board as of 2026-06-15.

- **Layout:** ~14 spaces, looping track with the Slipway at start/end.
- **Target:** ~3 laps; 5–10 minute playthrough.
- **Story context:** Boy must build a boat to follow the Girl who left down the
  river. Father has given him a book, an axe, a tent, and a cart of fish. The
  board is the Boy's game plan, sketched in the book's endpapers.
- **Fitting:** Parts must be fitted (at the Slipway) individually — carrying too
  many slows navigation; fitting at each lap clears the inventory.

---

## Outcome tiers

Judged at session end (Slipway complete or forced Dusk):

| Tier | Condition |
|---|---|
| **Masterwork** (`masterwork`) | Swift completion with mostly kept vows; the village whistles. |
| **Seaworthy** (`seaworthy`) | An honest build; it will hold. |
| **Driftwood** (`driftwood`) | Late, bruised, lashed with twine; it floats, probably. |

The presenter (`selectQuestBoardVM`) surfaces these engine tiers directly.

---

## Session state shape

Key fields on `QuestBoardSession` (see `quest-board.types.ts` for the full type):

```
boardId          string
phase            QuestBoardPhase   — intro | board-play | space-pending | dusk | outcome | done
day              number
pieces           position on board
vigor            number
fish             number
parts            { kind, fitted, carried }[]
charms           QuestCharmState[]
vows             QuestVowState[]
pendingSpace     QuestPendingState | null  — active space decision
marks            QuestMark[]               — per-round O/X
```

---

## Engine API

Exported from `src/World/QuestBoard/index.ts`. Key transitions:

```typescript
createQuestBoardSession(boardId, seed)
beginQuestBoard(state)                          // → board-play
rollQuestBone(state)                            // roll the die, advance piece
chooseQuestSpaceOption(state, optionId)         // resolve the landed space
continueQuestSpace(state)                       // advance after resolution
useQuestCharm(state, charmId)
acknowledgeQuestDusk(state)
claimQuestBoardCompletion(state)                // → done
abandonQuestBoard(state)
```
