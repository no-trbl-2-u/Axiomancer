# Phase 69 — Card-editor round-trip fidelity

> Queued 2026-08-22 from `docs/reports/content-pipelines-audit-2026-08-22.md`.
> Brief generated 2026-08-27 by `/ship-a-phase` §9.

## Outcome

An editor upsert of an existing card preserves every `Card` field and the
`// pts:` pricing arithmetic, proved by a round-trip test over the whole
live library: literal → `toDraft` → `serialize` → parse → deep-equal.

## Why

`CardDraft` documents itself as carrying "EVERY editable field of the real
`Card` (full fidelity)". It carries 19 of 24. Saving an existing card
through the editor silently deletes `theme`, `persistentEffect`,
`paidSummary`, `intentionallyAsymmetric`, and `glyph`, and the codegen
drops the `// pts:` comment the pricing doctrine and its lint depend on.
Every one of those is load-bearing: `theme` drives draft weights and the
theme-parity lints, `paidSummary` is what the card face prints,
`persistentEffect` is the whole payload of an oath/hex, and the pricing
comment is the arithmetic a reviewer checks a card's rank against.

## Surface

| File | Change |
|---|---|
| `axiomancer-card-editor/src/types.ts` | five fields into `CardDraft`, `blankCard`, `toDraft`, `fromDraft` |
| `axiomancer-card-editor/src/server/cardCodegen.ts` | emit the five in canonical order; preserve the pricing comment across a replace |
| `axiomancer-card-editor/src/server/__tests__/round-trip.test.ts` | new — every live card, both directions |
| `axiomancer-card-editor/package.json` | vitest (already hoisted at the root from mechanics) + `test` in `verify` |

## Decisions made upfront — DO NOT ASK

- **"Equal" means semantically equal, not byte-identical.** `serialize`
  emits a fixed canonical field order; the hand-authored library does
  not follow one. Byte-identity would either freeze the library's
  formatting or force the codegen to reproduce each card's arbitrary
  ordering. The test therefore evaluates the emitted literal back to an
  object and deep-equals it against the original `Card`. That is the
  property that matters: **no field is lost or altered**.
- **The pricing comment is preserved verbatim on replace, and that is
  correct even when the edit makes it stale.** Dropping it destroys a
  reviewer's only record of how the card was priced; keeping a stale
  one leaves a visible, lintable discrepancy. The pricing lint
  (`cards.pricing.ts` + `pricing.engine.test.ts`) is what catches
  staleness — that is its job, and it cannot do it against a comment
  the editor deleted.
- **The comment is codegen trivia, not a draft field.** It is extracted
  from the block being replaced and re-emitted; it never enters
  `CardDraft`, because it is a property of the source text rather than
  of the card.
- **Canonical position for the re-emitted comment: immediately before
  `free:`, else before `addedIn:`, else last.** That reproduces where
  the library already puts it in 57 of 58 cases.
- **vitest, not a new runner.** The editor has no test runner at all,
  which is why this test never existed. vitest 3.2.4 is already
  installed at the root (mechanics depends on it) and is the native
  choice for a Vite project, so this costs a devDependency line and a
  config, not a new toolchain.
- **`fromDraft`'s pruning stays.** Blank optionals and empty arrays are
  still pruned so the emitted literal matches the hand-authored style;
  the round-trip test asserts that pruning is lossless (a pruned field
  was absent on the original too).

## Tests

| Case | Assert |
|---|---|
| every live card | `toDraft` → `fromDraft` deep-equals the original |
| every live card | `toDraft` → `serialize` → parse deep-equals the original |
| the five restored fields | present on the cards that carry them, with a named case each |
| pricing comment | `upsertCard` on the real library text keeps the card's `// pts:` lines |
| a no-op upsert | rewriting an unedited card changes no other card's block |
| parser health | the test walked the whole library, not an empty list |

## Verify gate

`npm run verify` at the repo root (the editor's verify now includes its
tests), plus `node --test scripts/content-drift.test.mjs`.

## DoD

- [ ] All 24 `Card` fields round-trip through draft + codegen.
- [ ] `// pts:` survives a replace.
- [ ] Round-trip test covers the whole live library.
- [ ] `npm run verify` green; build-plan row ticked.

## Follow-ups (out of scope)

- Form controls for the restored fields. This phase guarantees they
  SURVIVE an edit; giving them editing UI is a separate design call
  (`glyph` in particular has no obvious form shape).
- Regenerating the pricing comment from `cards.pricing.ts` when the
  edit changes the arithmetic — that needs the pricing model to expose
  its working, not just its total.
