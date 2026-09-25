# Phase 58 — Carry authored narration to the player

## Outcome

`ResolvedEvent` (the engine's map-event output) now threads the
authored `description` from every `MapEventPayload` kind but
`'cutscene'` (already delivers its prose via `lines`) and the
no-event miss case (`'none'`). Mobile's event-modal presenter
prefers that description over its generic per-kind placeholder,
so an authored NPC/village node — one that already carries prose
in the game's voice — actually shows that prose instead of a
three-word filler line.

## Problem (from `01_build_plan.md`)

Every `MapEventPayload` declared `description?: string` and
`MapEvents/content.ts` filled it in on 59 of 74 authored nodes,
in the game's voice ("A wall of thorn-brush. You bleed easing
through."). None of it ever reached a player: `ResolvedEvent`
declared no description field on any variant, and
`resolve-map-event.ts` never read one, so the text died at the
resolver. Mobile documented the gap in a comment
(`state/presenters/event.engine.ts:585`, pre-phase line numbers)
and routed around it to `DEFAULT_BODY_BY_KIND` — generic
placeholders ("Something stirs.", "A quiet place.", "The air
turns.").

## Scope

Plumbing only — no new content, no new UI surface. The authoring
layer and the prose both already existed; this phase connects
them.

## Routes / API surface

N/A (no route surface — engine + presenter data flow only).

## Content / data reads

No new reads. `MapEvents/content.ts` prose was already authored
in Phase-23-era content passes; this phase makes it reachable.

## Engine changes (`axiomancer-mechanics`)

- `src/World/MapEvents/types.ts` — `ResolvedEvent` gains an
  optional `description?: string` on every discriminant except
  `'cutscene'` (uses `lines`, already fully wired) and `'none'`
  (nothing to say).
- `src/World/MapEvents/handlers.ts` — every handler
  (`resolveEncounter`, `resolveInteraction`, `resolveGathering`,
  `resolveRest`, `resolveVillage`, `resolveHazard`,
  `resolveLootCache`, `resolveQuest`, `resolveNarration`,
  `resolveBlacksmith`) now threads `payload.description` onto
  its returned `event` object. Pure pass-through — no new logic,
  no new validation.

## Presenter changes (`axiomancer-mobile`)

- `state/presenters/event.engine.ts::bodyFromPayload` — for every
  kind but `'cutscene'` and `'none'`, prefers `event.description`
  (trimmed, non-empty) over `defaultBodyForEvent(event)`. Falls
  back to the placeholder only when the node left description
  unauthored.
- `state/presenters/event-assets.ts::DEFAULT_BODY_BY_KIND` is
  unchanged — it was already documented as the empty-string
  fallback table; that documentation is now true rather than
  aspirational.

## Player-visible impact

Of the kinds that actually reach the event modal's body text
today (`composeNarrative` in `event.engine.ts`), only
`'interaction'` and `'village'` render through `bodyFromPayload`'s
placeholder path — `'cutscene'` already used `lines`, and every
other kind (`rest`, `gathering`, `loot-cache`, `hazard`, `quest`,
`blacksmith`, `narration`, `encounter`) is intercepted earlier to
launch its own minigame/session or combat-prelude screen, per the
Phase 137 cleanup. So the immediate player-visible delta is:
authored NPC and village descriptions now show in the event modal
instead of "A figure waits." / "Roofs and smoke.".

The other kinds' `description` field is now threaded through the
type and data layer (available to any future presenter surface)
but is not newly surfaced anywhere this phase — see Follow-ups.

## Decisions made upfront — DO NOT ASK

1. **Optional field, not required.** `ResolvedEvent.description`
   is `string | undefined`, mirroring `MapEventPayload.description`'s
   optionality. A required `string` would have forced every
   `ResolvedEvent` fixture across both packages' test suites
   (dozens of files) to add an explicit `description: undefined`
   or similar — pure test churn for a field that Jest/Vitest's
   `toEqual` already treats as absent when `undefined`. Verified:
   all pre-existing `toEqual({...})` fixtures in
   `MapEvents/e2e/*.test.ts` (blacksmith, narration, quest,
   rest-shelter) still pass unchanged.
2. **`'cutscene'` stays on `lines`, gets no `description` field.**
   Its authored prose already reaches the player in full via
   `lines.join('\n\n')`; threading a second, redundant text
   channel onto the same variant would invite drift between the
   two. `CutscenePayload.description` (declared on the payload
   type for authoring-surface uniformity) stays unused, as it was
   before this phase.
3. **`'none'` gets no `description` field.** No payload resolves
   to `'none'` — it's the pool-miss / already-consumed sentinel.
   Nothing to thread.
4. **Encounter's combat-prelude subtitle is NOT touched.**
   `composeCombatPrelude` (in `event.engine.ts`) has its own,
   separate two-tier fallback for the boss subtitle
   (`enemy.description` -> `BOSS_OMEN_BY_LEVEL`) and a hardcoded
   `'something stirs'` literal for non-boss fights — neither
   routes through `bodyFromPayload` / `DEFAULT_BODY_BY_KIND`, the
   specific pipe the phase's problem statement named ("routes
   around it to `DEFAULT_BODY_BY_KIND`"). Feeding the MapEvent
   `description` into the encounter prelude too is a legitimate
   follow-up but is a second presenter surface with its own
   design question (does it replace, prepend, or coexist with the
   enemy's own `description`?) — out of scope for a plumbing-only
   phase. Filed as a follow-up below.
5. **Minigame launch screens (rest-choice, gathering, hazard,
   quest board, loot cache, blacksmith) are not touched.** Those
   kinds are intercepted before `composeNarrative` runs (Phase 137
   cleanup) and launch their own screens, which don't read
   `ResolvedEvent` at all today. Surfacing `description` there is
   new UI work per minigame, not "connect an existing pipe" —
   filed as a follow-up.

## Empty / loading / error states

Unchanged. `defaultBodyForEvent` remains the fallback for every
kind when `description` is absent or blank (`''.trim()` -> falsy
-> placeholder), matching pre-phase behavior for the 15 of 74
nodes (and the two authored village nodes) that never got a
description.

## Pages × tests matrix

| Surface | Test |
|---|---|
| `resolveMapEvent` (encounter/interaction/gathering/rest/village/hazard/loot-cache/quest) | `axiomancer-mechanics/src/World/MapEvents/e2e/description-passthrough.engine.test.ts` — description passthrough + undefined-when-unauthored, via the pool-registration harness |
| `resolveNarration` / `resolveBlacksmith` (direct handler, no pool needed) | same file, direct handler calls |
| Mobile `bodyFromPayload` — interaction | `axiomancer-mobile/state/e2e/event.engine.test.ts` — placeholder fallback + description-preferred cases |
| Mobile `bodyFromPayload` — village | same file — placeholder fallback + description-preferred cases |

Existing suites re-run clean with no fixture changes required:
`MapEvents/e2e/*` (87 tests, mechanics), `event.engine.test.ts` /
`event-assets.test.ts` / `exploration.engine.test.ts` (mobile).

## Verify gate

`npm run verify --workspace axiomancer-mechanics` and
`npm run verify --workspace axiomancer-mobile` (phase touches
both packages).

## Commit body template

```
feat(world): thread authored MapEvent descriptions to the player — phase 58

- ResolvedEvent carries description on every kind but cutscene/none
- handlers.ts passes payload.description through, unchanged otherwise
- mobile bodyFromPayload prefers description over the generic placeholder
- new description-passthrough.engine.test.ts (mechanics) + presenter
  fallback/preferred tests (mobile)

Decisions:
- description stays optional (string | undefined) to avoid forcing
  every ResolvedEvent test fixture in both packages to add the field
- cutscene keeps using lines; encounter's combat-prelude subtitle and
  the minigame launch screens are untouched (separate presenter
  surfaces, filed as follow-ups)

Closes #<phase-issue-number>
```

## DoD

- [x] `ResolvedEvent` carries `description` on every applicable kind.
- [x] Every handler threads `payload.description` through.
- [x] Mobile prefers `description` over the placeholder for kinds
      that reach the event modal (`interaction`, `village`).
- [x] New tests for passthrough (mechanics) and
      fallback/preference (mobile).
- [x] `npm run verify` green on both touched workspaces.

## Follow-ups (out of scope)

- Feed `description` into `composeCombatPrelude`'s subtitle for
  `'encounter'` events (currently a hardcoded `'something stirs'`
  literal for non-boss fights, `enemy.description` /
  `BOSS_OMEN_BY_LEVEL` for boss fights) — a second presenter
  surface with its own precedence question.
- Surface `description` in the minigame launch screens
  (rest-choice, gathering, hazard, quest board, loot cache,
  blacksmith) — those screens don't read `ResolvedEvent` today;
  this is new UI wiring, not a reconnect.
- Author descriptions on the remaining unauthored nodes (15 of
  74, plus 2 of 4 village nodes) — content work, not plumbing.
