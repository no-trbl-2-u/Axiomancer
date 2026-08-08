# Phase 52b — Make the inn a first-class thing (retire the 1.0 heuristic)

> Agent-facing brief. Today "is this an inn?" is answered by
> `healFraction >= 1.0` — and wilderness springs are authored at 1.0.
> Before rest becomes a flat 20%, the inn/camp split needs a real marker
> or the exemption T asked for cannot be expressed. Mechanics + a small
> mobile follow-through. Second of the **rest-choice** epic (52a-52f).

## Why this exists

T ruled (attended chat, 2026-08-08) that rest heals **a flat 20%**, with
**inns exempt** — inns keep full-recovery semantics as a distinct thing.

That ruling is unimplementable against the current data. The mobile
comment says it outright
(`axiomancer-mobile/state/rest/store-actions.ts:41-50`):

> *"There is no first-class 'inn' map-event kind; the `baseHealFraction`
> carried on the session is the existing data the inn/camp split rides
> on."* — `INN_REST_HEAL_FRACTION = 1.0`

And the authored content makes that heuristic wrong:

| Pool | `healFraction` | Actually an inn? |
|---|---|---|
| `nf-4.rest` — clearing with a cold spring | 1.0 | no |
| `nf-24.rest` — hidden grove, natural spring | 1.0 | no |
| `nf-11.rest` — mossy clearing, fallen log | 0.75 | no |
| `fvRestPool(...)` — fishing-village nodes | 1.0 | **yes** |
| labyrinth corner (`labyrinth.pools.ts:110`) | 0.2 | no |

Three wilderness nodes currently qualify as inn-grade and mend
hazard-scarred max-VITAE. That is a live bug the flat-20% rule would
otherwise cement.

## Inputs

1. `src/World/MapEvents/types.ts` — `RestPayload.healFraction`.
2. `src/World/MapEvents/content.ts` — the four rest pools + `fvRestPool`.
3. `src/World/Labyrinth/labyrinth.pools.ts` — two more rest entries.
4. `axiomancer-mobile/state/rest/store-actions.ts` — `INN_REST_HEAL_FRACTION`,
   the scar-mend branch (`isInnRest`).
5. `axiomancer-mobile/state/hazard/store-actions.ts` — `bankedScarMagnitude`,
   `HAZARD_SCAR_FLAG_PREFIX`; the scar flag an inn rest clears.
6. `axiomancer-mobile/state/e2e/hazard-scar-rest-recovery.engine.test.ts` —
   the witness that currently asserts the heuristic. It must be rewritten,
   not deleted: the scar-mend BEHAVIOUR survives, only its trigger changes.

## Scope

- **`RestPayload.shelter: 'camp' | 'inn'`** (default `'camp'` when
  absent). Explicit, authored, greppable.
- **Re-author every rest pool** with the correct marker: fishing-village
  nodes → `'inn'`; the two northern-forest springs, the mossy clearing
  and both labyrinth entries → `'camp'`.
- **Re-home the hazard-scar max-VITAE mend** onto `shelter === 'inn'`,
  dropping the `>= 1.0` test. Same behaviour, honest trigger.
- **Retire `RestPayload.healFraction`** and the `healed` / `healFraction`
  fields on the resolved `rest` event. Nothing downstream should be able
  to reintroduce a per-node heal number once 52c makes it a constant.
  Keep `ResolvedEvent`'s `rest` arm — it just carries `shelter` now.
- Update `docs/world.md` + `docs/encounters/rest.md` accordingly.

## Decisions made upfront — DO NOT ASK

- Default is `'camp'`. A node that forgot to say is wilderness.
- The scar mend stays an **inn-only** privilege. It is the strongest
  argument for keeping inns distinct at all.
- This phase changes **no heal numbers**. It only relocates the
  inn/camp signal. 52c changes the arithmetic. Keeping them apart means
  a regression here is legible.

## Surface as `[needs-user-call]`

- If any map outside the fishing village should read as an inn, say so
  rather than guessing — `shelter` is authored content, and mislabelling
  hands out free max-VITAE repair.

## Prove (DoD)

- Hermetic tests: every authored rest pool resolves with the expected
  `shelter`; an inn rest mends scars; a camp rest at any former
  fraction does NOT; the three previously-misqualifying wilderness
  nodes are covered by name (that is the regression this phase fixes).
- Rewrite `hazard-scar-rest-recovery.engine.test.ts` against `shelter`.
- `npm run verify --workspace axiomancer-mechanics` **and**
  `--workspace axiomancer-mobile` (payload shape is a barrel-adjacent
  contract mobile reads).

## Follow-ups

- 52c reads `shelter` to decide the heal.
- Phase 44f may rename the inn in the retheme — the marker is a
  mechanical enum, so a rename is a face change, not a data migration.
