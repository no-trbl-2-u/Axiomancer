# Phase D6 — Upgradeable-Dice mobile UI

> Agent-facing brief. Render the spec-33 model in the mobile app:
> dice tray, die-gear rail, momentum/stance chips, stance-check
> telegraphs, blacksmith screen. Presenter-first (owner UI doctrine:
> payload-only panels, Dawncaster-terse glosses, illegal actions
> prevented LOUDLY). Deps: D2 (engine) + D5 (gear surface).

## Inputs

1. Spec 33 §1–§6 — every rendered rule.
2. Owner UI doctrine (spec 32 §12 / memory): payload-only keyword panels,
   terse glosses, illegal actions prevented loudly.
3. `axiomancer-mobile/state/presenters/combat-encounter.engine.ts` —
   `STANCE_COLORS` (body=red, mind=blue, heart=purple, wild=gold) — the
   shipped convention spec 33's mapping matches; extend, don't fork.
4. The card side-rail design (memory: #5 SIDE RAIL — FREE glyph, PAID
   sentence, vertical STANCE·TYPE label) — the die-color contract lives
   on the existing rail; do not redesign it.

## Scope

- **Dice tray rework**: 4 fixed colored dice, every round; face states
  legible at a glance (mana / special / miss — miss visually dead);
  drag-die-to-card powering under the color law with off-color drops
  refused loudly; gold's wildness visible; Reserve/KINDLE/surge/gold+lead
  objects visually distinct; ceiling refusals surface the +1◆
  compensation as an event toast.
- **Press Fate**: 1◆ reroll affordance, once/round state, disabled at 0◆
  with the reason shown; cracked (OVERHEAT) dice visibly excluded.
- **Stance + momentum chips**: current stance chip (or "no stance") +
  momentum chain progress {color, length}; a break-to-null must be
  LOUD (the owner chose strict rules — the UI must teach them); surge
  grant animated/evented.
- **Stance-check telegraph**: each phase's `punishes X` / `yields X`
  rendered openly in the threat readout (spec 30 conventions), with
  end-of-phase resolution feedback (×1.5 / ×0.5 / +1◆).
- **Die-gear rail + inspection**: the 4-slot gear rail; tapping a die or
  its gear opens a payload-only inspection panel — face table (n special
  / n mana / n miss), payload text, upgrade state. Dawncaster-terse.
- **Blacksmith screen**: D5's encounter — HONE/TEMPER offers with prices,
  cap-refusals shown loudly (grayed + reason), gear swap when variants
  exist.
- **Keyword glosses**: SPECIAL / HONE / TEMPER rows in the mobile keyword
  panel (`state/combat/keywords.ts` already registered in D4 — render).
- Flag-aware: flag-off renders the current (old) combat untouched.

## Decisions made upfront — DO NOT ASK

- Spec 33 rules render as-is; the PROVISIONAL special-on-use rule renders
  its current engine state (no UI fork for the alternative).
- No new visual language for stance colors — `STANCE_COLORS` is law.

## Surface as `[needs-user-call]`

- Layout conflicts only a human eye can rank (e.g. tray + rail + chips
  crowding small screens) — screenshot options, ask.

## Prove (DoD)

- Playwright e2e (seeded, flag-on): roll → power a card → momentum chip
  advances → break resets to null loudly → Press Fate reroll → stance
  check resolves with feedback → blacksmith HONE applied → tray reflects
  the new face table. Off-color drop refused loudly.
- Presenter unit tests for every new VM; `npm run verify -w
  axiomancer-mobile`.
- Flip D6 `[x]` + Phase log + hash.

## Follow-ups

- D7 runs playtester agents against this UI; `/critique` fresh-eyes pass
  post-D7.
