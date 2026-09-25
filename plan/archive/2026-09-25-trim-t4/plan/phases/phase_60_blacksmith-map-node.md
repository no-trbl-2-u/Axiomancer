# Phase 60 — Re-home the Anvil to its own map node

## Outcome

The `blacksmith` MapEventKind — built, tested, and registered since D5/D6c
but unplaced since Phase 59 dropped its only route (rest's `anvil` offer)
— is now a real, reachable node: fishing-village `fv-21`. Tapping it opens
`/blacksmith` exactly as the (already-working) interceptor always did; no
interceptor code changes. The Anvil is reachable in live play again, and
Spec 33's "player-facing home" open question is closed.

## Problem (from `01_build_plan.md`)

Phase 59 removed the anvil offer from the rest screen — rest was its
*only* route. `blacksmith` remained a fully-built, fully-tested MapEvent
kind (`MapEvents/types.ts`) with nowhere authored to fire it, orphaning
the whole Blacksmith surface (D5 + D6a–D6f, a seven-phase series: engine,
screen, tray rework, gear-inspection panel). T's provenance instruction
("queue all of these up," against a table listing this row as the
re-home option) selects re-home over retire.

## Scope

Mechanics only — the interceptor chain (`state/actions.ts`'s
`resolveCurrentMapEventAction` → `beginBlacksmithAction` →
`BlacksmithGate.tsx` → `/blacksmith`) is generic and kind-agnostic; it
already routes any `blacksmith`-kind event correctly and needs no
changes. The exploration map's node icon/tag mapping
(`state/presenters/exploration.engine.ts`) already has `blacksmith`
entries (`anvil` icon, "FORGE · DIE GEAR" tag) from when D6c briefly
placed one. This phase is purely a content-authoring change: place one
`blacksmith` node in `MapEvents/content.ts` and update the tests/spec
text that describe the map's kind census.

## Placement decision — one node, fv-21

**A single fixed placement, not a cadence.** Precedent: D6c (2026-07-18)
placed exactly one blacksmith node (fv-16) with an explicit code comment
ruling out a ratio/cadence rule; that node was later reverted for an
*identity* reason (owner called blacksmith "the WRONG dice-upgrade
surface" pre-Unshackling), never a cadence reason. No other MapEventKind
in this codebase uses a proportional/ratio placement rule — every kind's
node assignment is a hand-picked node id (`content.ts`'s per-node
`Record` tables). The economy evidence agrees: the shilling calibration
report (`docs/reports/shilling-economy-calibration-2026-08-16.md`) reads
"a die upgrade (anvil) is a **major** purchase — roughly a full act's
disposable income," which describes a once-per-act visit, not a
repeating one.

**fv-21, not the old fv-16 slot.** fv-16 now carries "The Borrowed Hook"
— real, Phase-53d-authored narrative content (part of the fv-14/fv-16/fv-4
S-01 dilemma arc) — so reclaiming it would delete story content for no
reason tied to this phase's scope. fv-21 was a generic filler encounter
(`foot-stealer`, no named NPC, no flag dependency, no economy role —
loot-caches carry the map's guaranteed shilling income and are
untouched). Positionally (`Continents/Coastal-Village/maps.ts`'s column
graph) fv-21 sits at column 7 of 9 (`location: [7, 1]`) — **after** the
fv-6 boss (column 5) and every loot-cache/quest-reward node (columns
2–4), so the visit is actually funded by the time the player reaches it,
and **before** the map's terminal column (fv-24's encounter and two more
columns of texture remain), so the upgrade gets used rather than landing
on the run's last node.

## Engine changes (`axiomancer-mechanics`)

- `World/MapEvents/content.ts`:
  - New `FV_BLACKSMITH_NODES` record (`{ 'fv-21': <description> }`) and
    `fvBlacksmithPool()` helper (mirrors `fvHazardPool`/`fvLootCachePool`
    shape), wired into the per-node builder's if/else chain.
  - `fv-21` dropped from `FV_ENCOUNTER_FOES` (the `foot-stealer` foe is
    displaced, same pattern Phase 53c/53d used for prior node
    reassignments — no flag or pricing dependency on it).
  - Header comment's kind census updated (encounter 4→3, +1 blacksmith)
    and the stale "all-kinds invariant" comment (which claimed
    fishing-village + northern-forest cover every kind, no longer true
    once `blacksmith` existed unplaced) corrected.
  - Payload uses `BLACKSMITH_WITNESS_VARIANTS` (the same single witness
    variant D6c offered) with a placeholder `budget: 12` — the mobile
    interceptor re-derives the real spend cap from the player's wallet
    (`state/blacksmith/store-actions.ts`), so the authored number is
    inert beyond satisfying `resolveBlacksmith`'s budget validation.
- `World/MapEvents/types.ts` — `BlacksmithPayload`'s doc comment updated
  from "staged... by that phase" to record the shipped placement.
- `specs/33-upgradeable-dice.md` — the "blacksmith rejected as home"
  language (stale since T's 2026-08-08 ruling) replaced with the settled
  decision; the residual-open "player-facing upgrade home and cadence —
  unresolved" line marked RESOLVED.

## Player-visible impact

- A new map node on the first map: tapping fv-21 (a forge, "coals still
  breathing") opens the Anvil screen instead of a foot-stealer fight.
  Everything past that point (hone/temper/swap, pricing, claim) is
  unchanged D5/D6 behavior.
- The node's icon (anvil glyph, "FORGE · DIE GEAR" tag) renders via
  already-shipped exploration presenter code — no new UI work.

## Decisions made upfront — DO NOT ASK

1. **One node total, not one per map.** Northern-forest is currently
   unreachable via inter-map travel (no travel surface ships it yet), so
   placing a second blacksmith node there now would be as unreachable as
   its unstaged NPCs — dead authoring. Revisit when inter-map travel
   ships (noted in the spec's residual opens).
2. **fv-21 over the historical fv-16 slot.** fv-16 now holds real S-01
   narrative content; sacrificing authored dialogue to match a coincidence
   of node numbering is worse than picking a fresh, narratively-empty
   node that also lands in a better position on the map's column graph
   (post-boss, pre-terminal, past all income sources).
3. **A fixed single placement, not a ratio/cadence rule.** No precedent
   for a repeating-placement rule anywhere in this codebase's map content;
   the D6c code comment explicitly rejected that framing for this exact
   kind, and the economy doctrine ("a full act's income") reads as a
   once-per-act beat, not a recurring one.
4. **Interceptor path needs no changes.** It was built kind-agnostic from
   the start (Spec 33 §6's "same launch contract the hazard/quest
   minigames use") and was never coupled to *how* a `blacksmith` event
   gets triggered — only to the fact that one fires. Confirmed by reading
   `state/actions.ts:1783-1797`, `BlacksmithGate.tsx`, and
   `blacksmith.engine.ts`'s presenter.
5. **Budget payload stays a placeholder (`12`), matching D6c.** The
   mobile store slice already re-derives the real budget from the
   player's wallet (documented in `state/actions.ts`'s existing comment);
   changing this number has no gameplay effect, so it isn't worth a
   fresh design call.

## Empty / loading / error states

None new — the blacksmith screen's existing empty/error handling
(insufficient funds, cap refusals) is untouched; this phase only changes
which map tap reaches it.

## Pages × tests matrix

| Surface | Test |
|---|---|
| `fv-21` resolves to `blacksmith`, offers the witness variant | `axiomancer-mechanics/src/World/MapEvents/e2e/content.engine.test.ts` (new case + updated kind-census assertions) |
| Content-parity spot-check | `axiomancer-mechanics/src/World/MapEvents/e2e/content-parity.engine.test.ts` |
| Map interception (tap → `/blacksmith`, not a paced `/event`) | `axiomancer-mobile/state/e2e/blacksmith.flow.engine.test.ts` (resurrected `describe('blacksmith map interception', ...)`, deleted in `09048b8e` when the D6c node was pulled) |
| Fishing-village kind-mix census | `axiomancer-mobile/state/e2e/map-encounter-minigames.engine.test.ts` |

## Verify gate

`npm run verify --workspace axiomancer-mechanics` and
`npm run verify --workspace axiomancer-mobile` (phase touches both —
mobile only via test fixtures, no production code).

## Commit body template

```
feat(world): re-home the anvil to its own map node — phase 60

- placed the blacksmith MapEventKind on fishing-village fv-21 (a single
  fixed placement, not a cadence — mirrors the D6c precedent)
- fv-21 was a generic filler encounter (foot-stealer, no flag/economy
  dependency); position is post-boss and past every loot-cache/quest
  reward, so the visit is funded, and pre-terminal, so the upgrade
  gets used
- interceptor path (map tap -> /blacksmith) needed no changes; it was
  already kind-agnostic
- resurrected the map-interception test deleted when D6c's node was
  pulled; updated kind-census assertions across mechanics + mobile
- closed spec 33's stale "blacksmith rejected as home" language

Decisions:
- one node total (northern-forest is unreachable via inter-map travel
  today; revisit once that surface ships)
- fv-21 over the historical fv-16 slot, since fv-16 now carries real
  Phase 53d narrative content
- budget payload stays a placeholder (12), matching D6c; mobile
  re-derives the real spend cap from the wallet

Closes #<phase-issue-number>
```

## DoD

- [ ] `fv-21` resolves to the `blacksmith` kind with the witness variant.
- [ ] Fishing-village's kind census (encounter/interaction/rest counts,
      required-kinds coverage) is updated across all three test files
      that assert it.
- [ ] The map-interception e2e (tap → `/blacksmith`, not a paced event)
      passes.
- [ ] Spec 33's stale "rejected as home" language is corrected.
- [ ] `npm run verify` green on both touched workspaces.

## Follow-ups (out of scope)

- A second blacksmith node on northern-forest once inter-map travel
  ships (currently unreachable content).
- Authoring additional blacksmith variant offers beyond the single D5
  witness (`HEART_RICH_PAYLOAD_VARIANT`) — content-authoring scope, not
  wiring.
