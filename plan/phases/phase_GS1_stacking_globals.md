# Phase GS1 — Globals stack (experimental)

> Agent-facing brief, plotted by T (`/plot`, 2026-10-14). T set the rule
> in the PR #516 review session. The rule is **experimental**: T may
> revert it after play. No card text, keyword or art changes (D37, D88).

## Sources

- T, attended 2026-10-14: a second copy of a Global already in play
  should not be dead. "Stack effects, but make sure it's noted that this
  is also experimental." Stack model chosen: **independent instances**.
  Each copy has its own trigger and its own expiry.
- The rule it replaces: `plan/revamp/cards.md` type table, Global row:
  "No cap, but each Global in play must be unique (T: an experiment,
  may change)" (D69-D71).
- Engine: `programIllegalReason` in
  `axiomancer-mechanics/src/Combat/combat.card-program.ts` (the
  `'that Global is already in play'` branch), `GlobalInPlay`, the
  Global expiry loop, `programDrawFallback`.
- PR #516 refuses a staged card when both of its lines are blocked; a
  second Global copy is one of its named cases.
- Decisions: **D37**, **D88**, **D84**.

## Outcome

A Global can be played while another copy of it is in play. Each copy
is its own instance in play, fires its own trigger and leaves on its
own expiry. Every place that states the rule marks it experimental.

## Acceptance

- A1. `programIllegalReason` no longer returns
  `'that Global is already in play'`; the branch and the string are
  gone. An engine test plays two copies of P-10c and finds two
  `GlobalInPlay` entries.
- A2. Independent triggers: with two P-10c copies in play, one
  SACRIFICE fires the trigger twice (GUARD n twice on FREE). An engine
  test pins the doubled result. The same applies to a `turn` Global
  (E-03d: two copies apply their SACRIFICE 2 + LEECH 1 twice per turn).
- A3. Independent expiry: a FREE copy played on turn t and a PAID copy
  played later. The FREE copy leaves after `GLOBAL_FREE_TURNS` turns and
  the PAID copy stays. An engine test pins it.
- A4. `programDrawFallback` removes one deck copy per Global instance in
  play (the existing per-entry `indexOf` behaviour), pinned by a test
  with two copies in play.
- A5. Mobile: the in-play Globals row keys each chip by instance (not
  `cardId`), so two copies render as two chips with no React key
  warning. A jest case renders two copies.
- A6. The rule text is marked experimental in
  `plan/revamp/cards.md` (type table, Global row: "Copies stack as
  independent instances; each fires and expires on its own (T,
  2026-10-14: experimental, may change)"), and `docs/card-spec.md`
  carries the same rule with the same tag if it has a Global section.
- A7. The witness's Global value (`expectedGlobalFires` and the Global
  value path) still runs with copies in play. No sim crash. The
  existing sim tests pass.

Measure: `npm run verify`; the A1-A5 tests pass.

## Scope

- `axiomancer-mechanics`: `combat.card-program.ts` (legality; any
  lookup that assumes one entry per `cardId`, such as a removal by card
  effect, now targets one instance: the oldest).
- `axiomancer-mobile`: the Globals row in `CombatBoard.tsx`
  (`key={g.cardId}`), `globalsVM` in `combat-encounter.engine.ts`
  (instance id), and PR #516's stage refusal, which no longer fires for
  a second Global copy (the engine stops blocking it).
- Docs: `plan/revamp/cards.md`, `docs/card-spec.md`.

## Consumers to update

- `globalsVM` / `CombatGlobalVM` (instance key).
- Catalog / devlog exporters: none expected.

## Save / schema contracts

- `GlobalInPlay` may gain an instance id (a per-combat counter like
  `curseUid`). It lives only in the combat ledger. If the combat state
  is saved mid-fight (R9a), an old save with no id gets ids assigned on
  load in `Game/game.migrate.ts`.

## Decisions made upfront — DO NOT ASK

- Stack model is independent instances (T, 2026-10-14), not a merged
  counter.
- Removing "a Global" by card effect removes the oldest instance of that
  card.
- No cap on copies (the type table already says "No cap").
- The rule is experimental. Every doc line that states it says so (A6),
  so a revert is a single phase.

## Tests matrix

- mechanics: `blood-price.engine.test.ts` (or a new
  `globals-stack.engine.test.ts`): A1-A4, A7.
- mobile: a CombatBoard jest case for A5.

## Verify gate

`npm run verify`.

## Commit body template

```
GS1: Globals stack as independent instances (experimental)

A second copy of a Global in play is no longer refused; each copy fires
and expires on its own. Marked experimental (T, 2026-10-14).
Acceptance A1-A7.
```

## DoD

A1-A7 ticked.

## Follow-ups (out of scope)

- T's play verdict on keeping, capping or reverting the rule.
