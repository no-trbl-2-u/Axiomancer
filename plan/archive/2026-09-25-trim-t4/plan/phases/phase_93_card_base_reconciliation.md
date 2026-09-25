# Phase 93 — Card-base reconciliation

> Promoted 2026-09-17 via `/oversight` from `plan/PHASE_CANDIDATES.md`
> (unscored row filed 2026-08-08 by Phase 52a). Brief generated 2026-09-18 by
> `/ship-a-phase` §9 (audit / wiring phase — the page-family brief sections
> don't apply; adapted per Phase 81/86/87's precedent).

## Outcome

The promoted scope named two defects, paired in `plan/AUDIT.md`:

1. `buildCombatDeck` de-dupes the card base, so the Threadbare recipe's
   18-entry (3x-copy) preset deals as an 8-card deck in the shipped app.
2. `GameState.flags` never reaches `initializeCombatEncounter`, so Phase
   169's curated-loadout system (`combat.loadout.ts`) is dead in the shipped
   runtime.

A pre-work audit of the live source found **finding (1) already fixed** —
commit `3fb4963b` ("stop de-duping the card base", 2026-09-05) shipped
*before* this phase's 2026-09-17 promotion, with its own regression test
(`hazard-pattern-combat-helpers.engine.test.ts` "KEEPS duplicate known
cards…") and an app-level integration check
(`starter-bundles.test.ts` pinning `threadbare: 18`). The candidate/audit
prose promoting Phase 93 was written from the original 2026-08-08 filing and
didn't pick up the intervening fix — same staleness shape as Phase 87.

Finding (2) is real and still live: `initializeCombatEncounter`'s signature
had no `flags` parameter at all, so no caller — mobile or CLI — could ever
thread `GameState.flags` through to `buildCombatDeck`. This phase closes
that reachability gap: `initializeCombatEncounter` now takes an optional
trailing `flags` param and forwards it, and the one shipped-runtime call
site (`CombatEncounterPanel.tsx`) reads the store's `flags` and passes them
through.

## Why

Deck size is what Phase 52a's `MIN_COMBAT_DECK_SIZE` floor (12) and 52f's
card-removal pricing are calibrated against, and what "does the curated
loadout do anything" was an open question against. Finding (1) already
answered "does the card base honour duplicates" — yes, since 2026-09-05.
Finding (2) needed a real decision: does the flags-based loadout plumbing
get wired end-to-end, or retired as dead weight now that mobile's own
in-file doctrine (`combat/store-actions.ts`'s header) documents the deck as
simply `knownCards + combatRewardCards`, no curation step?

## Audit findings (verified against current source, 2026-09-18)

**(1) — already true, pre-dating promotion.** `combat.deck.ts`'s own header
comment already states "COPIES ARE REAL, IN BOTH LISTS (playthrough report
2026-09-05)" and documents the repeal. `git log` confirms `3fb4963b` landed
2026-09-05, twelve days before the `/oversight` promotion that created this
phase row. Nothing left to fix.

**(2) — real, and total.** Grepped every production (non-test) call site of
`initializeCombatEncounter`: mobile's `CombatEncounterPanel.tsx` (the only
shipped-runtime path — `EncounterModalOverlay.tsx`'s live-map combat calls
it with no `deck` and, before this phase, no way to pass `flags`), the CLI
(`combat.cli.ts`, which has its own unrelated `--deck` card-list flag, never
`GameState.flags`), and the sim/autoplay helpers (which pass an explicit
`deck` array, bypassing the question). Grepped every production consumer of
`combat.loadout.ts`'s `addToLoadout`/`removeFromLoadout` across
`axiomancer-mobile/`: zero. No mobile screen offers loadout curation —
`combat/store-actions.ts`'s own doc comment states the shipped design
plainly ("deck the engine deals from is `buildCombatDeck(player)` =
`player.knownCards` + `player.combatRewardCards`"). So today, closing the
reachability gap is a no-op for player-visible behavior (mobile's `flags`
array never carries a `combat-loadout-card:` entry) — but it is the
literal, narrow fix the finding asked for, it is what
`game.reducer.ts`/`card.removal.ts`'s existing (tested, mechanics-side)
loadout-reconciliation logic was built to feed, and it is cheap and
backward-compatible (new trailing optional param; omitted/empty `flags`
falls back to `knownCards`, unchanged).

## Decisions made upfront — DO NOT ASK

- **Ship finding (1) as a no-op confirmation, not a re-fix.** Already fixed
  and already covered by both a unit regression test and an app-level
  integration test. Re-deriving a fix would be wasted churn. Documented here
  per the autonomy contract instead of bounced to `/oversight`.
- **Ship finding (2) as narrow plumbing, not a new loadout-curation UI.**
  Building a mobile deck-curation screen is a real feature with no spec and
  no promoted scope — inventing one here would be scope creep beyond what
  was asked ("wire flags through `initializeCombatEncounter`"). The fix is:
  add the parameter, forward it, and read it at the one shipped call site.
  A future loadout-curation phase (if ever promoted) now has a live pipe to
  write into instead of a dead one.
- **Do not touch `game.reducer.ts` / `card.removal.ts`.** Both already
  correctly consume/produce loadout flags on the mechanics-side `GameState`
  (used by CLI/sim/tests); they were never the broken link.
- **`playerDeck` (explicit deck override) still wins over `flags`.** Matches
  existing precedence — an explicit deck was always meant to short-circuit
  derivation from the player's card pools.

## Surface

| File | Change |
|---|---|
| `axiomancer-mechanics/src/Combat/combat.engine.ts` | `initializeCombatEncounter` gains an optional trailing `flags?: readonly string[]` param, forwarded to `buildCombatDeck(clonedPlayer, flags)` in the no-explicit-`playerDeck` branch. Doc comment updated. |
| `axiomancer-mechanics/src/Combat/e2e/combat-loadout.engine.test.ts` | New `describe` block: curated loadout reaches `state.deck` through `initializeCombatEncounter`; omitted `flags` falls back to `knownCards` (behavior-preserving); an explicit `playerDeck` still wins over `flags`. |
| `axiomancer-mobile/components/combat/encounter/CombatEncounterPanel.tsx` | The mount-once `initial` bootstrap reads `store.getState().flags` and passes it as `initializeCombatEncounter`'s 5th arg. |
| `plan/steps/01_build_plan.md` | Phase 93 row ticked `[x]` with commit hash. |

## Verify gate

`npm run verify` — mechanics workspace (new + existing loadout/dedup tests)
and mobile workspace (typecheck + existing `CombatEncounterPanel` test
suite, unaffected since the new param is optional and mobile's `flags` is
never loadout-shaped today).

## DoD

- [ ] `initializeCombatEncounter` accepts and forwards `flags`.
- [ ] New engine-level regression tests green, existing loadout/dedup tests
      unaffected.
- [ ] `CombatEncounterPanel.tsx` reads store `flags` into the bootstrap call.
- [ ] Mobile typecheck + existing `CombatEncounterPanel` test suite green.
- [ ] `npm run verify` green.
- [ ] Build-plan row ticked.

## Follow-ups (out of scope)

- A mobile loadout-curation screen (the actual UI to write
  `combat-loadout-card:` flags) has no spec and no promoted phase. If ever
  wanted, file it fresh via `/expand` — the pipe this phase wires now makes
  it a UI-only follow-up, not another engine reachability fix.
- Whether the mechanics-side `combat.loadout.ts` / `card.removal.ts`
  dual-path (loadout vs. `knownCards`) machinery is worth keeping if mobile
  never adopts curated loadouts is a retirement question for `/adjust-cards`
  or a future audit pass, not this phase's call.
