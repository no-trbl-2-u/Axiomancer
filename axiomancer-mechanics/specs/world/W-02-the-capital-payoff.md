# World Spec W-02 — The Capital, and the Road With No Ribbon

> Phase 84. Attended `/world-spec` session, 2026-09-17, T present.
> Canon: `content/story/story-bible.md` (THE TALLY), authored in this
> same session. Supersedes nothing in the shipped map graph.

## Goal

The capital (map 5, northern continent, shipped Phase W5) currently
ends terminal at `cap-9` because the next continent was not authored.
This spec says what that terminus *means* and what it opens, so that
map 6 can be built without guessing. The answer: the capital is the
place where the player's six-hour ambition is spent on someone else,
by his own hand, and the road onward is not a reward — it is what is
left of him afterward.

Without this, the capital is a dead end with a boss on it. With it,
the capital is the hinge the whole first act was bending toward.

## Dependencies

- **Unblocks:** map 6 (the road from the capital); the Labyrinth
  access condition (see §Region state); any `/forge` continent work
  north or inward of the capital.
- **Depends on:** `content/story/story-bible.md` §2, §3, §6. Nothing
  in code. No shipped node, NPC or line changes.

## Atmosphere

The wall is tall enough to lose the sky behind and the line at the
gate does not move for anyone. Inside, the court hall swallows the
line whole — a dais, a bell, a ledger heavier than every ribbon-road
that fed it. After the bell it empties fast. The ones who are marked
go one way and the ones who are not go back out through the same gate
they queued at, and the street outside is ordinary, and that is the
part that does the damage: the city does not change expression.

Voice lock (the bar, not shipped prose):

> The bell rang once and it was done and the hall began to empty and
> outside the wall the market was still going on. Someone was selling
> fish. He stood in it a while.

> He had no ribbon. He had not had one the whole way. He had thought
> that meant he was free to go anywhere.

## Region state

| state key | meaning | how it changes |
|---|---|---|
| `sweetheart-was-nominated` | She carries a color. Set upstream at `tar-4`. | **Already shipped.** Read, not written, here. |
| `capital-selection-witnessed` | The bell rang and he was in the hall. | **Already shipped** at `cap-8`. |
| `the-tally-understood` | He has assembled what the rite is from what the minor characters already said. Never stated by narration. | Set at `cap-9` only if the player has BOTH `capital-selection-witnessed` AND at least two of: `boy-witnessed-the-river-ritual`, `boy-marked-the-crowning`, `boy-chased-the-rumor`. |
| `no-ribbon` | He leaves the capital unclaimed, untagged, nobody's nominee. | Set on leaving `cap-9` after the court. Unconditional — there is no path where he is chosen. |
| `fog-of-war.the-road-onward` | Map 6 is reachable. | Set by `no-ribbon`. |
| `fog-of-war.labyrinth` | **The Labyrinth access condition.** | See below. |

### The Labyrinth condition (answers W-01 §Access)

W-01 gates THE APORIA dev-menu/CLI-only until "the last continent"
exists (T ruling 2026-07-07). **T reopened that ruling in this
session and asked this spec to propose the unlock.** Proposed:

> The Labyrinth does not open to a candidate. Candidates are what it
> eats. It opens to what the gate already spent.

Condition: `no-ribbon` AND `the-tally-understood` AND the player has
nothing left staked — no active nomination, no patron, no debt held
by The Factor. Mechanically that is a leftover check, not an
achievement check: the player qualifies by having *lost*, not by
having *earned*.

This deliberately inverts the usual unlock grammar, and it means the
Labyrinth cannot be reached by a strong run — only by a completed
one. **It does not ship in this phase.** It is the proposal W-01
§Access was waiting for, and it needs its own ratification pass
before any door is wired.

## Mechanical hazards

None. The capital is not a hostile-architecture map and should not
become one. Its pressure is social and it is already authored — the
line that does not move, the ledger that reads color instead of name,
the Herald's mercy. Adding a DoT here would cheapen it.

The one mechanical note: **no combat gate on the way out.** The
player leaves the capital by walking out. Making him fight for the
exit would let him earn something, and the point is that there is
nothing to earn.

## Map / node sketch

No change to the shipped graph. The exit is new:

```
cap-1 ─ cap-2 ─┬─ cap-3 ─┬─ cap-6 ─┐
               ├─ cap-4 ─┤         ├─ cap-8 ─ cap-9 ─ ▸ (map 6)
               └─ cap-5 ─┴─ cap-7 ─┘   court    Factor    no-ribbon
```

`cap-9` gains one outbound edge. Nothing else moves.

## Cross-references

- `content/story/story-bible.md` — §3 (the damage), §6 (after).
- `specs/world/W-01-aporia-labyrinth-continent.md` §Access — this
  spec proposes its unlock; W-01 must be updated to point back if the
  proposal is ratified.
- `src/World/Continents/Northern-Continent/maps.ts` — the capital
  block, The Herald, The Ribbon-Picker. **Read-only for this phase.**
- `src/World/MapEvents/content.ts` — `capCourtConvenes`,
  `capTheFactorBoss`.

## Open questions

1. **Labyrinth unlock ratification.** The condition above overrides a
   binding 2026-07-07 ruling. T reopened it deliberately in this
   session, but the shape itself is unratified.
   > Your answer:

2. **`the-tally-understood` threshold.** Two-of-three upstream flags
   is a guess. It could be one, or all three, or a different set.
   > Your answer:

3. **Does map 6 exist yet as a place, or only as a direction?** This
   spec says the road onward is the deliverable; it does not say what
   is on it.
   > Your answer:

## Proposed approach

1. Add the `cap-9` outbound edge in
   `src/World/Continents/Northern-Continent/maps.ts`.
2. Wire `no-ribbon` and `the-tally-understood` in the world reducer;
   both are set, never cleared.
3. Gate `fog-of-war.the-road-onward` on `no-ribbon`.
4. Author map 6's first node only. The road, not the destination.
5. Leave `fog-of-war.labyrinth` unwired pending question 1.

## Acceptance checklist

- [ ] All open questions answered.
- [ ] Atmosphere prose written and consistent with the voice lock.
- [ ] `no-ribbon` / `the-tally-understood` wired to the world reducer.
- [ ] No shipped capital line, NPC or node was rewritten.
- [ ] W-01 §Access updated if question 1 ratifies the condition.
- [ ] `npm run verify --workspace axiomancer-mechanics` clean.

## Out of scope

- Wiring the Labyrinth door (proposal only, see question 1).
- Any change to the capital's existing nine nodes or their prose.
- New enemies, cards, keywords or art.
- Map 6 beyond its first node.
