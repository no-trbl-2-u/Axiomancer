# Phase D6c — Blacksmith screen

> Agent-facing brief. Third sub-phase of the D6 mobile split. Render D5's pure
> blacksmith engine as a REACHABLE mobile encounter: gate + slice + interception
> + route + forge UI, plus one first-map node and a Dev-menu shortcut so it can
> be exercised. **Owner-UI doctrine** (payload-only, Dawncaster-terse, illegal
> actions prevented LOUDLY). Deps: D5 (engine + `'blacksmith'` MapEvent kind) +
> D6a (shipped).

## What's already built (D5, mechanics)
- **Pure engine** `axiomancer-mechanics/src/World/Blacksmith/` (copied from The
  Reliquary): a seeded session with phases `intro → forging → card → outcome →
  done`; actions `begin`, `hone`/`temper`/`swap`, `continueBlacksmithCard`,
  `leaveBlacksmith`, `claimBlacksmithOutcome`. NEVER reads GameState — the host
  passes `(seed, rail, budget, variants)` in and applies `outcome.rail` /
  `outcome.spent` at claim. Cap-violating OR unaffordable upgrades produce a LOUD
  refusal card (rail+budget untouched). PLACEHOLDER pricing
  `BLACKSMITH_PRICING_PLACEHOLDER` (hone 2 / temper 3 / swap 4 ◆). Exported via
  `src/World/Blacksmith/index.ts` and the package barrel; `BlacksmithPayload`
  exported too. Read the engine's exact exports before wiring.
- **MapEvent kind** `'blacksmith'` is registered mechanics-side (handler +
  `ResolvedEvent` arm). D5 left the mobile side a keep-green dead-end.
- **Witness variant gear** `HEART_RICH_PAYLOAD_VARIANT` (+3◆ payload) exists in
  `blacksmith.content.ts` for the swap offer.

## Placement (owner /oversight 2026-07-18 — this is DECIDED)
1. Author exactly **ONE blacksmith MapEvent node on the FIRST map** (the
   `'blacksmith'` kind now has a real node — find the first map's MapEvent data
   and add one node).
2. Wire the encounter into the **Dev menu** (a `dev*` route entry, mirroring the
   existing dev encounter shortcuts) so it is reachable for testing.
- **STILL OPEN — do NOT guess (owner design thread, filed to `plan/AUDIT.md`):**
  *when* the player first meets the blacksmith, and *whether the blacksmith is
  even where dice upgrades happen* vs another surface. D6c ships the reachable
  encounter; the cadence/identity call is deferred. Do NOT author extra nodes or
  invent a cadence.

## The mobile encounter pattern to mirror — LOOT-CACHE / The Reliquary
The wiring is uniform across encounters; copy the loot-cache path end-to-end:
- **Gate:** `components/CacheGate.tsx` (side-effect-only, mounted in
  `app/_layout.tsx`, reads a `selectHasActiveCache` selector, `router.push('/cache')`
  when the slice fills). Build `components/BlacksmithGate.tsx` + mount it.
- **Slice:** the loot-cache store slice (`state/…/store-actions.ts`,
  `beginLootCacheAction` + a `hasActive…` selector). Build `state/blacksmith/…`
  with `beginBlacksmithAction` + a `hasActiveBlacksmith` selector, holding the
  D5 session and driving its actions.
- **Interception:** `state/actions.ts` → `resolveCurrentMapEventAction` (~line
  1562) — add an `if (result.event.kind === 'blacksmith')` block that restores
  the pre-event player, clears the event slice, and calls `beginBlacksmithAction`
  (with the first-time tutorial flag like its siblings).
- **Route + UI:** `app/blacksmith/index.tsx` + the forge screen: render the
  session's offers — HONE / TEMPER per die (with the placeholder ◆ prices),
  cap-violating or unaffordable offers **grayed + reasoned LOUDLY** (owner-UI:
  never a silent no-op), gear swap when a variant is offered, and the outcome
  claim applying `outcome.rail`/`outcome.spent` to the player.

## Scope boundary (respect it)
Ship the reachable blacksmith encounter ONLY. Do NOT build the flag-on combat
e2e (= D6d). Do NOT decide the blacksmith cadence/identity (owner-open). Extend
the existing encounter-screen / owner-UI conventions.

## Decisions made upfront — DO NOT ASK
- One first-map node + a Dev-menu shortcut (owner-decided). No extra nodes.
- Placeholder pricing renders as-is (D7 ratifies the numbers).

## Surface as `[needs-user-call]`
- Only genuine forge-screen layout questions a human eye must rank — screenshot,
  note; don't block.

## Prove (DoD)
- Slice/selector + interception unit tests (a `'blacksmith'` event launches the
  session; HONE/TEMPER/swap drive the engine; a cap/afford refusal surfaces the
  reason; claim applies the outcome to the player). Presenter/VM tests for the
  forge offers (enabled/disabled + reason).
- `npm run verify -w axiomancer-mobile` GREEN. If the first-map MapEvent data or
  a `@mechanics` barrel is touched such that mechanics is affected, also
  `npm run verify -w axiomancer-mechanics`.
- Flip D6c `[x]` + Phase log + hash.

## Follow-ups
- D6d (flag-on combat e2e — its harness also lets the blacksmith HONE be
  exercised end-to-end + enables the deferred flag-on visual screenshots). The
  blacksmith cadence/identity design thread stays owner-open in AUDIT.
