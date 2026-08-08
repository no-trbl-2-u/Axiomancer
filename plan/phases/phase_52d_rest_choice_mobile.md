# Phase 52d — The rest-choice screen (and the anvil finally reaches players)

> Agent-facing brief. Build the surface for 52c's engine and make the
> die-gear blacksmith **player-reachable for the first time**. Mobile.
> Fourth of the **rest-choice** epic (52a-52f).

## Why this exists

D5's HONE/TEMPER economy has been shipped, tested and unreachable since
2026-07: `app/blacksmith/index.tsx` is wired only to the dev menu, and T
ruled the dev screen the wrong surface on 2026-07-18. This phase is the
one that ends that — the anvil is one of three doors on every rest node.

## Inputs

1. Phase 52c's `World/RestChoice` engine + its outcome ledger.
2. `axiomancer-mobile/app/rest/index.tsx` — the route being repurposed.
   Keep the route path; replace the content.
3. `axiomancer-mobile/components/RestGate.tsx` — the side-effect gate
   that pushes `/rest` when a session opens. Mirrors `<HazardGate>`.
4. `axiomancer-mobile/state/rest/store-actions.ts` — the claim glue to
   rewrite (`claimRestOutcomeAction` applies vitae, keepsakes, effects).
5. `axiomancer-mobile/app/blacksmith/index.tsx` +
   `state/blacksmith/store-actions.ts` — the existing anvil screen and
   slice. `<BlacksmithGate>` already routes to `/blacksmith`.
6. `axiomancer-mobile/state/e2e/rest.flow.engine.test.ts`,
   `scripts/encounter-routing-e2e.mjs` — the flow witnesses to update.
7. `plan/bearings.md` § "Content location" — no hardcoded copy in
   components, no hex literals (AXM tokens only).

## Scope

- **The choice screen** at `/rest`: three cards, one tap each. Every
  card shows its price in **SHILLINGS** and the player's current purse,
  and an unaffordable card is **visibly disabled with its reason shown**
  — not hidden, not silently inert. `plan/bearings.md`'s owner-UI
  doctrine: illegal actions are prevented **loudly**.
- **No back-out.** No header back button, no swipe-dismiss, no Android
  hardware-back escape. The node is already consumed; the three cards
  are the only exits. Verify the hardware-back case explicitly — it is
  the one that gets missed.
- **Anvil hand-off**: picking the anvil hands the 52c session's rail +
  the paid budget to the existing blacksmith slice and routes to
  `/blacksmith`, which returns its result to the rest-choice claim. The
  blacksmith screen stops being dev-menu-only; keep the dev entry for
  testing but it is no longer the only door.
- **Card-removal picker**: a sheet listing the current combat deck (from
  `buildCombatDeck`, so duplicates and reward cards show honestly),
  one selection, one confirm. Show what the NEXT removal will cost after
  this one — the escalation is the mechanic and it must be visible
  before the player commits, not after.
- **Claim glue**: rewrite `claimRestOutcomeAction` against the new
  ledger — heal, shillings spent, `cardRemovals` incremented, rail
  written to `Character.dieGear`, inn scar-mend preserved.
- **Copy** lives in a `*.copy.ts` presenter file, neutral register, so
  Phase 44f can retheme it without touching components.

## Decisions made upfront — DO NOT ASK

- Route path stays `/rest`. Renaming a route churns the locked route
  contract in `plan/bearings.md` for no player-visible gain.
- The blacksmith screen is **reused, not rebuilt**. It works; it has
  tests; it has only ever lacked a door.
- Reduced-motion and the Phase 38 juice layer: use the shared module,
  do not hand-roll animation.

## Surface as `[needs-user-call]`

- Any visual design call beyond "three cards, price, disabled reason"
  — the owner cares about UI specifics (see the owner-UI doctrine).
  Ship something defensible and show a screenshot rather than inventing
  an elaborate layout.

## Prove (DoD)

- Jest: gate opens the screen; each of the three commits produces the
  right state change; an unaffordable option renders disabled **with**
  its reason; hardware-back does not escape; the removal sheet lists
  duplicates and previews the next price.
- Playwright e2e (`scripts/`): a full rest-node visit per option,
  seeded. Update `encounter-routing-e2e.mjs` for the new flow.
- One screenshot per option in the phase commit body.
- `npm run verify --workspace axiomancer-mobile`.

## Follow-ups

- 52e retires the Night Watch this screen replaced.
- Phase 46a/46c may want a tutorial for this node — 52e deletes the
  Night Watch tutorial and leaves the new node unguided; that gap is
  filed there, deliberately, not patched here.
