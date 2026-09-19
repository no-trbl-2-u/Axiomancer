# Phase 100 — The map tells the truth

> From `axiomancer-mobile/docs/reports/PLAYTEST_BUGS_2026-09-18.md`, BUG-04
> (medium) and BUG-01 (low). The companion to Phase 99: same unfiled report,
> the other two bugs. Both re-verified live before fixing.

## Outcome

After moving, you can see every path open to you — instead of two of three
branches sitting off opposite edges of the phone. And the legend under the map
counts the nodes the map actually draws.

## BUG-04 — the camera fitted once and never re-framed

**Symptom.** At the Crossing on a 414x896 viewport the player is offered three
onward paths — Chapel (`fv-16`, the node their accepted quest points at), Hanged
Wood (`fv-3`), Dock (`fv-11`). Only Hanged Wood is on screen. Measured bounding
boxes: `fv-16` at `x = -49` (entirely off the left edge), `fv-11` at `x = 419`
(entirely off the right edge of a 414px viewport). 19 of 25 nodes off-screen,
with nothing on screen indicating that choices exist beyond the edges.

**Root cause.** `MapCanvas.tsx`'s camera effect early-returned on
`initialized.current`, so `computeFocusTransform` ran once at mount and never
re-fitted as the available set changed. The math was already correct and already
unit-tested — only *when* it ran was wrong.

## The trap this phase had to avoid

`plan/CRITIQUE.md:2140` is a **CLOSED** `[MED]` row: *"open map nodes just
off-screen no-op silently on tap; the map recenters against manual panning"* —
RESOLVED 2026-09-10, commit `6fe4e47c`, issue #294. Its resolution paragraph
says the one-time fit was deliberate, and ends:

> "a tap-to-pan affordance is separable follow-up if a future pass still finds
> nodes going out of frame after a move."

BUG-04 is exactly that anticipated follow-up. **A naive re-key would reopen that
closed row**, because the presenter hands `MapCanvas` a fresh `nodes` array on
every render — depending on it would re-fit constantly and fight every pan. The
latch existed precisely to stop that.

**The fix keys on a stable projection instead.** New exported
`focusKeyOf(nodes)` returns the camera's *subject* — the current node id plus
the sorted ids of the available nodes — as a string. The effect depends on that
key, not on `nodes`.

This satisfies both findings **structurally rather than by heuristic**: panning
changes neither where the player stands nor what is open to them, so it cannot
produce a key change and therefore cannot produce a re-fit. There is no "has the
user panned?" flag to get wrong, and no window in which the camera could snap
back mid-gesture. The camera moves only at the moments the player themselves
changed the map's subject.

`completed` and `locked` nodes are deliberately excluded from the key: they are
not the camera's subject, and folding them in would re-fit the view for changes
the player did not make to their position or options.

## BUG-01 — the legend counted a different set of nodes than it labels

**Symptom.** The strip reads `25 nodes · 20 sealed`, but **21** nodes render
sealed (1 `here` + 3 `open` + 21 `sealed` = 25).

**Root cause — two sources of truth.** The pips are classified by
`classifyNode`; the counter was built from `world.currentMap.lockedNodes`. The
start node is where they part: it was never in `lockedNodes` (the map starts you
on it), but once you walk away it is neither `reachable` nor `completed`, so the
renderer calls it sealed while the engine's lock list never did.

**Fix.** Derive the counter from the same classified `nodes` array the pips are
drawn from. The label becomes a description of the map rather than a second
opinion about it.

`fishing-village.layout.ts` already carried a comment about a *previous*
disagreement with this same counter (critique pass 19) — this surface has bitten
before, so the comment is updated rather than left telling the next reader a
stale story.

## Decisions made upfront — DO NOT ASK

1. **Key on a stable projection, not a pan flag.** The recon proposed a
   `userHasPanned` ref. The focus key subsumes it: a flag is a heuristic that
   can be set or cleared at the wrong moment, whereas a key that simply cannot
   change during a pan has no wrong moment. Fewer moving parts, same guarantee.
2. **Re-fit on every focus change, including one the player did not cause**
   (a new path opening at the same node). That is still a change to what the
   player can choose, which is what the camera exists to show.
3. **Exclude `completed` / `locked` from the key** — see above.
4. **Export `focusKeyOf` rather than inlining the `useMemo`.** The camera
   transform lives in Reanimated shared values, which are not readable in a unit
   test; the safety argument would otherwise be untestable. A named pure
   function makes the invariant assertable directly.
5. **Do not change pip appearance.** The report raises a second-order question —
   should a visited-but-not-completed node show `TRODDEN` rather than the ✕
   SEALED mark? — but that changes what the pips *mean*, is a design call, and is
   filed as a follow-up rather than smuggled in behind a counter fix.
6. **Pin label against pips, not against either source.** Asserting the counter
   equals `nodes.filter(locked).length` would just re-state the implementation.
   The tests compare the two things the player actually sees.

## Pages x tests matrix

| Suite | Asserts |
|---|---|
| `components/exploration/__tests__/MapCanvas.test.tsx` (+7) | `focusKeyOf` is EQUAL across a fresh array with identical content (the guard for issue #294) and across reordered options; CHANGES when the player moves and when a new path opens; is UNCHANGED by locked/completed nodes; is stable on an empty map; the component survives a re-render with a changed focus set |
| `state/e2e/exploration.engine.test.ts` (+3) | the legend counter agrees with the pips on a fresh map, after walking away from the start node (the exact step that used to split them), and after a second move |

## Verify gate

`npm run verify --workspace axiomancer-mobile` — 306 suites, 2913 tests, 0 lint
errors (15 pre-existing warnings, unchanged). No mechanics file touched, so **no
baseline regen**.

## DoD

- [x] `focusKeyOf` exported, documented, and the camera effect keyed on it
- [x] the `initialized.current` latch removed
- [x] legend counter derived from the classified node array
- [x] the stale hazard comment in `fishing-village.layout.ts` updated
- [x] 10 new tests; mobile gate green
- [x] `CRITIQUE.md:2140` stays closed — pinned by the fresh-array test

## Follow-ups (out of scope)

- Should a visited-but-not-completed node classify as `completed`/TRODDEN rather
  than `locked`? The legend advertises a state the start node never reaches.
  Design call.
- An on-screen affordance that paths exist beyond the viewport edges (an edge
  arrow or a count). The re-fit means they start in frame; it does not help a
  player who has panned away.
