# Phase 46a — Early-game rethink: design session

> Build-plan row: `Phase 46a — Early-game rethink: design session. Decide
> whether the opening is canned preset-deck tutorials with deckbuilding
> deferred to a labyrinth choice, and re-derive the Quest Board tutorial
> that was dropped.`

> **This is a design-only phase.** No code ships here. The deliverable is
> this brief: a locked ruling that Phase 46b (implementation) and Phase 46c
> (Quest Board tutorial re-derivation) execute without further ambiguity.

## 0. Why this ruling looks different from the original critique row

The critique row this phase drains (`plan/CRITIQUE.md`, filed 2026-07-08,
commit `63cfb3ba`) proposed: remove deckbuilding from the early game, make
every pre-labyrinth battle a canned tutorial for a *different* preset deck,
defer "which deck to commit to" until the labyrinth door, and let the
player trade into a new mid-game deck after clearing it.

Two things changed underneath that idea since it was filed, and both
gut its literal premise:

1. **The 10-theme preset library it assumed is gone.** The 2026-08-08
   Profane Canon rework (`84ef85bd`, PR #182) replaced the 10 independent
   themed starter decks with **THE CAMPAIGN PRESETS**: three snapshots
   (`threadbare` 18 cards / `pilgrim` 30 / `apostate` 45) of **ONE deck
   evolving** through the campaign via reward drafts (additions) and
   rest-node removals (Phase 52a-52f's anvil/cut-a-card choice). There is
   no longer a roster of distinct themed decks to rotate through
   battle-by-battle, and no second deck to "trade into" post-labyrinth —
   `axiomancer-mechanics/src/Combat/combat.starter-deck-presets.ts`'s own
   header is explicit: *"they are NOT independent decks: they are
   SNAPSHOTS OF ONE DECK EVOLVING."*
2. **The labyrinth is dev-menu-only in v1, not player-reachable.**
   `axiomancer-mechanics/specs/world/W-01-aporia-labyrinth-continent.md`
   §"Access (per T, binding for v1)": *"UI: dev menu in the character tab
   ONLY... No exploration-tab or story wiring until the last continent
   exists."* Gating the starting-deck commitment on labyrinth entry would
   mean no real player ever makes that choice — the surface it would hang
   on doesn't exist for them yet.
3. **A meaningful slice of the intended fix already shipped**, independently
   of this design session, as part of other work: `app/index.tsx` already
   runs title screen -> `BundleSelectScreen` (a "choose your path" starter
   picker, `axiomancer-mobile/components/BundleSelectScreen.tsx`) for
   brand-new players before their first battle, and
   `CombatTutorialPrimer.tsx` + `CombatTutorialCoach.tsx` already deliver a
   controlled-vacuum first-fight teaching pass (3-panel swipe primer:
   VITAE/pressure-not-health, status-does-the-work, dice-draft-then-power;
   then a live first-fight coach with a 1/N step banner). Hazard, Reliquary,
   Rest, Gathering, and Cache each already have their own guided first-run
   coach (Phases 11/15/16 + Cache's own pass) mirroring the same doctrine.

So the honest job here is not "invent the early game from scratch" — it is
**decide what of the original idea still applies given what the engine and
mobile app actually are today, and name the one real gap the critique
correctly spotted that nothing has fixed yet.**

## 1. Decisions made upfront — DO NOT ASK

**D1. Reject "canned battle per preset deck."** There is one canonical
evolving deck line now (Threadbare -> Pilgrim -> Apostate), not ten themed
decks to rotate through. A sequence of N battles each introducing a
*different* deck no longer maps onto anything the engine models. The
already-shipped primer+coach (teaching mechanics in a controlled vacuum
against whatever deck the player is actually holding) is the correct
shape for "teach mechanics before free play," and it stays a **single**
guided first fight, not N.

**D2. Reject "defer deckbuilding to a labyrinth choice."** The labyrinth
is dev-menu-only per spec W-01 and stays that way until the last
continent exists (out of this phase's scope to change). Hanging deck
commitment on it is a dead end for real players. The already-shipped
EMBARK-time `BundleSelectScreen` (right after the title screen, before the
first map node) is the correct, reachable moment for "commit to your
starting shape" and **stays where it is**.

**D3. Reject "trade for a new mid-game deck post-labyrinth."** No second
independent deck exists to trade into under the Profane Canon model. The
existing mechanism — reward-draft additions (Phase 26b) + rest-node
removals (Phase 52a-52f) — already delivers continuous mid-game deck
transformation; it just does it gradually instead of as a single gated
swap. Nothing new ships for this. This piece of the original idea is
retired-by-supersession, not silently dropped — recorded here so a future
pass doesn't reopen it thinking it's still live scope.

**D4. THE ONE REAL GAP — fix in 46b: `BundleSelectScreen` currently
offers all three campaign-stage snapshots (Threadbare/Pilgrim/Apostate) as
peer starter picks to a player who has never played a single turn.**
This is the actual bug the 2026-07-08 critique was reacting to in spirit,
even though it named a different mechanism: a brand-new player can pick
the 45-card, late-game **Apostate's Canon** (oath/hex cards, enemy curse
injection, DOOM/IMMOLATE/REQUIEM) as their very first deck, which is the
opposite of a controlled vacuum, defeats the pedagogical intent of the
primer+coach that follows it, and contradicts
`combat.starter-deck-presets.ts`'s own docstring that these are snapshots,
not choices. **Ruling: for a brand-new player (no `BUNDLE_CHOSEN_FLAG`,
no seeded cards), the picker offers `threadbare` ONLY.** `pilgrim` and
`apostate` stop being reachable through the new-player picker; they
remain live as internal balance/lineage data
(`COMBAT_DECK_PRESETS`/`listDeckPresets()`/`PRESET_LINEAGE` and their
existing tests are untouched — this is a mobile-presentation-layer
filter, not an engine change).
- Implementation shape for 46b: filter `STARTER_BUNDLES` (or the
  `BundleSelectScreen` prop feeding it) down to the single `threadbare`
  entry for the new-player path in `app/index.tsx`. Two viable UI shapes,
  46b's call to finalize against actual screenshots: (a) keep
  `BundleSelectScreen` as a single-tile "confirm your path" beat (cheapest
  diff, keeps the ceremony), or (b) skip the screen entirely and
  auto-call `seedStarterBundleAction(store, 'threadbare')` at the same
  point `needsBundleSelection` currently triggers (removes a tap that no
  longer represents a real choice). 46b should prefer (b) unless a design
  reason favors keeping the ceremony — a picker with exactly one option is
  friction with no payoff.
- `chosenStarterBundle`/`runArchetype`/the reward-draft skew machinery are
  unaffected either way (`threadbare`'s `archetype: null` already means no
  skew, matching current behavior for players who pick it today).
- No `GAME_STATE_VERSION` bump needed — this changes which choices are
  *offered*, not the save shape; a save that already carries a
  `bundle:pilgrim`/`bundle:apostate` flag (from a save made before this
  ships, or from a returning dev/test save) continues to resolve normally
  through `chosenStarterBundle` — 46b must not break existing saves that
  already chose one of the other two.

**D5. The already-shipped combat primer + coach is the "controlled
vacuum" mechanism — audit, don't rebuild.** 46b's remaining combat-tutorial
scope is verification, not new content: confirm `CombatTutorialPrimer`'s
three panels (VITAE/pressure, status-does-the-work, dice-draft-then-power)
and `CombatTutorialCoach`'s step script still match the current Threadbare
Office card set and current UI (the coach predates the Profane Canon
rework in places — re-check its copy against what a Threadbare-only new
player's first hand actually looks like post-D4). If it already holds up,
46b's job here is confirmation + a regression test pinning it, not a
rewrite.

**D6. Quest Board tutorial clause — dropped, redirected.** Build-plan
Phase 61 (`[ ]`, ruling already locked, not yet shipped) retires the Quest
Board minigame wholesale — *"the quest event is 'a little bit harder for
now, let's just remove it entirely'"* (T direct, 2026-08-15). Re-deriving
a tutorial for a minigame slated for deletion is moot. What survives per
Phase 61's own text: `World/quest.engine.ts`/`quest.library.ts` (the
QuestLog objective tracker) and its quest-giver interaction, which becomes
"the only way a player ever learns a quest exists" once the minigame node
is gone. **Phase 53c already shipped** (`plan/steps/01_build_plan.md`,
`[x]`) placing that quest-giver on the map spine with a coverage floor —
so the actual onboarding surface for the surviving quest mechanic is
already live. 46c's scope is corrected accordingly (§4 below and the
matching `01_build_plan.md` row edit made in this same commit): verify
53c's quest-giver interaction reads clearly to a new player as "this is
how you learn about a quest," and add a lightweight coach/explainer only
if that verification finds a real gap — not build a new tutorial for the
minigame that Phase 61 deletes.

**D7. Tutorial copy stays subject to Phase 42's Dark Fantasy voice law.**
Nothing in this brief authors new player-facing copy — 46b/46c do, when
they touch `BundleSelectScreen`/primer/coach text. That copy must match
spec 34's voice section (terse, archaic-flavored, no thee/thou/thy/thine/ye)
and canon combat copy (VITAE/STANCE), same as every other mobile surface.

## 2. What actually ships where

- **46a (this phase):** brief only + one doc-scope correction to 46c's
  build-plan row (§4). No code.
- **46b — Early-game: canned preset-deck tutorial content.** Implements
  D4 (new-player picker collapses to `threadbare`) and D5 (audit/repair
  the existing primer+coach against the current Threadbare card set;
  add/extend a regression test pinning the new-player-only picker
  behavior, mirroring `starter-bundles.test.ts`'s existing coverage
  shape). Mechanics + mobile, small diff — most of the "tutorial
  infrastructure" already exists; this phase fixes the one gap and proves
  it, it does not build a new multi-battle sequence.
- **46c — Early-game: Quest Board tutorial re-derivation (RETITLED IN
  SCOPE, see §4).** Verifies Phase 53c's shipped quest-giver placement
  functions as the QuestLog's onboarding moment for a new player; ships a
  small explainer/coach beat only if that verification finds the
  quest-giver interaction insufficient on its own. Likely a small phase —
  do not scope-inflate it into rebuilding Quest Board content that Phase
  61 is deleting.

## 3. Non-goals (explicitly out of scope for 46a/46b/46c)

- Re-platforming or exposing the labyrinth to normal navigation (that's
  a real future project, unscoped, blocked on "the last continent exists"
  per spec W-01 — not this phase's problem to solve).
- Reintroducing multiple independent starter-deck themes (the Profane
  Canon consolidation is a locked, recent, deliberate ruling — not
  something this phase reopens).
- Any change to `COMBAT_DECK_PRESETS`/`PRESET_LINEAGE`/the removal-price
  curve (Phase 52a-52f's territory) or reward-draft weighting (Phase 26b's
  territory).
- New Quest Board content of any kind (Phase 61 deletes the surface this
  would live in).

## 4. Build-plan row correction (made in this phase's commit)

`01_build_plan.md`'s Phase 46c row previously read (scope now stale per
D6 above): *"Early-game: Quest Board tutorial re-derivation. The dropped
first-crossing tutorial, rebuilt to match 46a."* This is corrected in the
same commit as this brief to read: *"Early-game: Quest Board tutorial
re-derivation — REDIRECTED per 46a's ruling (D6): Phase 61 retires the
Quest Board minigame this row originally targeted; verify Phase 53c's
shipped quest-giver placement already covers new-player quest discovery,
and ship a small explainer only if that verification finds a gap."* No
renumbering; only this row's own text changes.

## 5. Verify gate

None — this phase touches only `plan/phases/phase_46a_early_game_rethink.md`
and one row of `plan/steps/01_build_plan.md`. Docs-only; `npm run verify`
not required (matches `skills/plan-a-phase.md` §9's docs-only precedent).
The shipping agent should still run `git status --short` before commit to
confirm no stray working-tree changes ride along.

## 6. Commit body template

```
phases: brief for phase 46a — early-game rethink (design session)

- Ruling: reject canned-battle-per-deck and labyrinth-gated commitment
  (both premised on a preset model the 2026-08-08 Profane Canon rework
  replaced, and a labyrinth surface that's still dev-menu-only).
- Real gap identified + scoped to 46b: BundleSelectScreen offers
  Pilgrim/Apostate (mid/late campaign snapshots) to brand-new players;
  new-player picker collapses to Threadbare only.
- Already-shipped CombatTutorialPrimer/Coach is the controlled-vacuum
  teaching mechanism; 46b audits/repairs it, does not rebuild it.
- Quest Board tutorial clause redirected: Phase 61 deletes the minigame
  this row targeted; Phase 53c already ships the surviving quest-giver
  placement. 46c's build-plan row text corrected accordingly.
- No code shipped this phase; verify gate not required (docs-only).
```

## 7. DoD

- [x] `plan/phases/phase_46a_early_game_rethink.md` written with every
      decision resolved (no Open Qs).
- [x] `01_build_plan.md`'s Phase 46c row corrected to reflect Phase 61 +
      Phase 53c (§4).
- [ ] Committed + pushed; `01_build_plan.md`'s Phase 46a row ticked `[x]`
      with the commit hash in a separate commit, per `ship-a-phase.md`
      Step 11.

## 8. Follow-ups (out of scope, not numbered phases yet)

- If 46b's audit of the primer/coach finds copy drift against the current
  Threadbare card set, that's 46b's own fix, not a new phase.
- A future "expose the labyrinth to real navigation" project would be the
  right place to revisit whether a labyrinth-gated commitment moment ever
  makes sense — not before spec W-01's v1 access constraint changes.
