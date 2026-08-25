# Phase 59 — Rest is two offers: heal 25%, or cut a card

## Outcome

The rest node offers exactly two things — `rest` (free, flat 25% of
max VITAE) and `cut` (paid deck removal) — down from three. The
`anvil` offer and its `anvil-pick` phase are gone from the engine and
the `/rest` screen; the Blacksmith surface it used to hand off to
keeps its own die-gear engine and `/blacksmith` screen untouched,
ready for Phase 60 to give it a standalone map node. The node also
renders its authored `MapEvent.description` one-liner (Phase 58's
passthrough, reaching a minigame launch screen for the first time)
in place of the placeholder intro, when the node authored one.

## Problem (from `01_build_plan.md`)

**T direct, 2026-08-15:** *"Rest: Heal 25% health or remove a card.
One liner narration."* Today `RestChoiceOfferId` is
`'rest' | 'anvil' | 'cut'` — the anvil offer hands off to the real
`/blacksmith` screen for one hone-or-temper, at a flat 25-shilling
price that bypasses Blacksmith's own per-verb tiers. T's ruling drops
the anvil offer from the rest table entirely; the rest offer itself
heals a flat 25% of max VITAE regardless of shelter (today: 20% at
camp, full-to-cap at an inn).

## Scope

Mechanics + mobile. Engine: drop the `anvil` offer, the
`anvil-pick` phase, `pickRestChoiceAnvil`, and the composed
`World/Blacksmith` import from `World/RestChoice`; flatten the
`rest` heal formula to `round(maxHealth * 0.25)` for every shelter;
thread the authored one-liner (`ResolvedEvent.description`, Phase
58) onto the session. Mobile: drop the rest→blacksmith hand-off
wiring (`beginRestAnvilHandoffAction`, `continueRestAnvilHandoffCardAction`,
the `anvil-pick` screen branch, `MobileBlacksmithSlice.handoff`) —
dead code once nothing can trigger it — while leaving the
standalone `/blacksmith` screen and its own `blacksmith` MapEvent
interceptor (already built, Spec 33 §6) untouched. **Assumption
recorded, not ruled:** `cut` keeps Phase 52a's escalating removal
price — T said "remove a card", not "remove a card free". Flip it
only on an explicit call.

**Deps note.** `01_build_plan.md` flags Phase 59 as depending on
Phase 60 landing first ("or the surface is briefly unreachable").
Read literally that would ship 60 before 59, but the build plan
lists 59 first and 60's own row explains why it comes second: 60
needs Phase 59's anvil-offer removal to exist before it can place
the newly-freed `blacksmith` MapEventKind ("Phase 59 takes the anvil
off the rest screen, and rest was its ONLY route"). Shipping 59
first, accepting a one-tick gap where the Anvil is temporarily
unreachable in authored map content until 60 lands, is the reading
the two rows were written against — not a scheduling error. `/march`
picks 60 next; nothing is lost, since `beginBlacksmithAction`,
the die-gear engine, and the `/blacksmith` screen all still work
identically, they're just not reachable from any node yet.

## Routes / API surface

`/rest` (unchanged path, changed offer set). `/blacksmith` unchanged
(still Spec 33 §6's own screen, now reachable only via its own
`blacksmith` MapEvent kind, which Phase 60 places in map content).

## Engine changes (`axiomancer-mechanics`)

- `World/RestChoice/restchoice.types.ts` — `RestChoiceOfferId` drops
  `'anvil'`; `RestChoicePhase` drops `'anvil-pick'`;
  `RestChoiceAnvilVerb` deleted; `RestChoiceOutcome` /
  `RestChoiceSession` drop the now-always-passthrough `rail` field
  (nothing writes it once anvil is gone) and the anvil-only
  `pendingRefusal` field; `RestChoiceSession` gains
  `description: string | null` (Phase 59 one-liner).
- `World/RestChoice/restchoice.engine.ts` — `buildOffers` drops the
  `anvil` entry; `chooseRestChoiceOffer`'s `rest` branch drops the
  shelter conditional (`campHealFraction` vs. `healCap`), always
  `round(maxHealth * restHealFraction)`; `pickRestChoiceAnvil`
  deleted along with its `World/Blacksmith` composition imports;
  `createRestChoiceSession` accepts + trims `description`, drops the
  `rail` input.
- `World/RestChoice/restchoice.content.ts` — `anvilPrice` deleted;
  `campHealFraction` (0.2) renamed `restHealFraction` (0.25),
  applied uniformly.
- `World/RestChoice/index.ts` — barrel drops `RestChoiceAnvilVerb` /
  `pickRestChoiceAnvil` exports.
- `World/MapEvents/types.ts` — `BlacksmithPayload`'s doc comment
  updated: the anvil is no longer reached through rest; it's staged
  for Phase 60's standalone node.
- `World/Blacksmith/blacksmith.engine.ts` — module header's mention
  of the rest-choice bypass price updated to describe the Phase 60
  hand-off instead.

## Presenter / store changes (`axiomancer-mobile`)

- `state/rest/store-actions.ts` — `beginRestAction` drops the
  `playerRail` computation (dead once `rail` leaves the session),
  accepts + forwards `description`; `claimRestChoiceOutcomeAction`
  drops the `dieGear: outcome.rail` write and the `isInnRest`
  special-case heal formula (now one flat clamp for every shelter,
  scar-mend recompute unchanged).
- `state/blacksmith/store-actions.ts` — `beginRestAnvilHandoffAction`
  / `continueRestAnvilHandoffCardAction` deleted;
  `BeginBlacksmithOptions.handoff` deleted.
- `state/store.ts` — `MobileBlacksmithSlice.handoff` field deleted;
  `EMPTY_BLACKSMITH_SLICE` updated to match.
- `state/actions.ts` — `beginRestAnvilHandoff` /
  `continueRestAnvilHandoffCard` removed from `AppActions` +
  wiring; the `rest` MapEvent interceptor now threads
  `result.event.description` into `beginRestAction` (Phase 58
  pattern, first minigame launch screen to consume it).
- `state/presenters/rest.engine.ts` — `RestChoiceVM` gains
  `description: string | null`, mapped from `session.description`.
- `state/presenters/rest.copy.ts` — `REST_CHOICE_OFFER_LABEL` /
  `_DESC` drop the `anvil` entry; title copy updated for two doors.
- `app/rest/index.tsx` — the `anvil-pick` handoff `useEffect` +
  render branch deleted; the offer-phase intro renders
  `vm.description ?? REST_CHOICE_INTRO`.
- `app/blacksmith/index.tsx` — `isRestHandoff` branching removed
  throughout (purse row, leave button, card cost chip, continue
  handler, abandon button) — the screen always behaves like a
  normal standalone visit now.
- `components/HardwareBackHandler.tsx` — drops the
  `blacksmith?.handoff === 'rest-choice'` lock condition (nothing
  sets it any more).

## Player-visible impact

- The rest screen shows two doors instead of three; REST always
  heals 25% of max VITAE (previously 20% at camp, full at an inn).
- Rest nodes with authored `description` prose show it instead of
  the placeholder "The node is spent the moment you stopped here...".
- The Anvil is temporarily unreachable in live play until Phase 60
  places `blacksmith` nodes in map content (see Deps note above) —
  the screen and engine both still work; nothing deletes them.

## Decisions made upfront — DO NOT ASK

1. **Flat 25% applies to every shelter, not just camp.** T's ruling
   text names one number with no shelter carve-out; "today it
   computes against a cap" in the build-plan row describes the INN
   branch specifically (`healCap` = heal-to-full), so "pin it at a
   flat 25%" reads as dropping that special case, not preserving it
   under a new number. The inn's *scar-mend* (Phase 52b, unrelated
   mechanic — undoes hazard damage to max VITAE) is untouched.
2. **`cut`'s escalating price stays.** T said "remove a card", which
   reads as keeping the existing mechanic's shape, not authorizing a
   new one (free removal). Flip only on an explicit ruling.
3. **The rest→blacksmith hand-off plumbing is deleted, not kept
   dormant.** Once the `anvil` offer is gone, nothing can ever set
   `RestChoiceSession.phase` to `'anvil-pick'`, so
   `beginRestAnvilHandoffAction` / `continueRestAnvilHandoffCardAction`
   / `MobileBlacksmithSlice.handoff` become permanently unreachable.
   Phase 60's own scope note confirms the standalone `blacksmith`
   MapEventKind interceptor (`state/actions.ts` — already built,
   independent of rest) is the route forward, so deleting the
   hand-off doesn't orphan anything Phase 60 needs.
4. **Ship 59 before 60, accepting the anvil's one-tick reachability
   gap.** See the Deps note above — the alternative (60 before 59)
   contradicts 60's own stated scope ("Phase 59 takes the anvil off
   the rest screen... without this phase, Phase 59 silently orphans
   the whole Blacksmith surface" — i.e., 60 assumes 59 already
   shipped).
5. **`RestChoiceOutcome.rail` / `RestChoiceSession.rail` deleted,
   not left as dead passthrough.** With `anvil` gone, every session
   ends with an unmodified rail; carrying a field nobody reads or
   writes is worse than removing it. Same reasoning for the
   anvil-only `pendingRefusal` field.

## Empty / loading / error states

Unchanged. A rest node with no authored `description` falls back to
`REST_CHOICE_INTRO`, matching Phase 58's fallback pattern for every
other kind.

## Pages × tests matrix

| Surface | Test |
|---|---|
| `RestChoice` engine (offers, `rest` flat-25% heal, `cut`, description passthrough) | `axiomancer-mechanics/src/World/RestChoice/e2e/restchoice.engine.test.ts` |
| Mobile `/rest` screen (two offers, disabled-reason copy, description render) | `axiomancer-mobile/state/e2e/quest.screen.test.tsx` (rest screen describe block) |
| Inn scar-mend regression (unaffected by the heal-formula flattening) | `axiomancer-mobile/state/e2e/hazard-scar-rest-recovery.engine.test.ts` |
| `HardwareBackHandler` rest-node lock (anvil hand-off case removed) | `axiomancer-mobile/components/__tests__/HardwareBackHandler.test.tsx` |
| `RestGate` routing (fixture shape updated) | `axiomancer-mobile/components/__tests__/RestGate.test.tsx` |

## Verify gate

`npm run verify --workspace axiomancer-mechanics` and
`npm run verify --workspace axiomancer-mobile` (phase touches both
packages).

## Commit body template

```
feat(world): rest is two offers — flat 25% heal or cut a card — phase 59

- RestChoice engine drops the anvil offer + anvil-pick phase
- rest heal is a flat 25% of max VITAE for every shelter (was 20%
  camp / full-to-cap inn)
- rest node threads its authored MapEvent one-liner (Phase 58)
- mobile drops the dead rest-choice -> blacksmith hand-off wiring;
  /blacksmith screen + engine untouched, now standalone-only
- rail/pendingRefusal fields removed from RestChoiceSession/Outcome
  (dead passthrough once anvil is gone)

Decisions:
- flat 25% applies to every shelter, dropping the old inn
  heal-to-cap special case (scar-mend is a separate, untouched
  mechanic)
- cut keeps its escalating price (T said "remove a card", not free)
- shipped before Phase 60 on purpose; the Anvil is briefly
  unreachable in map content until that phase places blacksmith
  nodes (60's own scope note assumes 59 already landed)

Closes #<phase-issue-number>
```

## DoD

- [ ] `RestChoiceOfferId` / `RestChoicePhase` drop `anvil` /
      `anvil-pick`; `pickRestChoiceAnvil` deleted.
- [ ] `rest` heals a flat 25% of max VITAE for every shelter.
- [ ] `RestChoiceSession` carries the authored `description`; the
      `/rest` screen renders it over the placeholder when present.
- [ ] Mobile's rest→blacksmith hand-off wiring is deleted;
      `/blacksmith` renders identically without it.
- [ ] `npm run verify` green on both touched workspaces.

## Follow-ups (out of scope)

- Phase 60 — place `blacksmith` MapEvent nodes in authored map
  content so the Anvil is reachable again.
- Surface `description` on the other minigame launch screens
  (gathering, hazard, quest board, loot cache, blacksmith) — Phase
  58's follow-up list, still open beyond this phase's rest-only
  slice.
