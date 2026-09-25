# Phase 68 — Keyword-drift hardening

> Queued 2026-08-22 per THE PIPELINE LIBERATION, from
> `docs/reports/content-pipelines-audit-2026-08-22.md` §2 recommendation
> 10. Brief generated 2026-08-27 by `/ship-a-phase` §9.

## Outcome

The four surfaces the content-pipelines audit found drifting **silently**
each gain a gate that fails loudly instead:

1. Mobile KW-2 derives its mechanic-kind list from
   `CardSpecialMechanic['kind']` rather than a hardcoded array.
2. The three hand-synced glyph tables are asserted equal by a test.
3. The card-editor's independent `wx.ts` KEYWORDS vocabulary is asserted
   against the live keyword registry, and its dead words are removed.
4. `axio_keywords` stops publishing hardcoded denominators, and an
   atlas-vs-registry parity check replaces "keep it in sync by hand".

## Why

THE PIPELINE LIBERATION opened the keyword registry to loop growth. The
audit's finding is that the *registry* is now open while the *wiring*
around it is not gated: a new keyword or mechanic kind type-checks
clean, prints nothing, and drifts four surfaces apart with no failing
test. Every one of these is a place where the loop can ship something
that looks done and is not.

## Surface

| Workstream | Files |
|---|---|
| A — kind union | `axiomancer-mechanics/src/Cards/types.ts` (runtime list + compile-time exhaustiveness), `src/Cards/index.ts` export, `axiomancer-mobile/state/combat/__tests__/keywords.test.ts` (KW-2 rewritten) |
| B — glyph parity | `scripts/content-drift.test.mjs` (new), reading `axiomancer-mobile/components/combat/glyphShapes.ts`, `axiomancer-card-editor/src/components/CardFace.tsx`, `scripts/build-catalog.mjs` |
| C — editor vocabulary | `scripts/content-drift.test.mjs`, `axiomancer-card-editor/src/theme/wx.ts` (dead words removed) |
| D — MCP keywords | `scripts/axio-mcp-server.mjs` (denominators dropped, stale library-size claim fixed), `scripts/content-drift.test.mjs` (atlas↔registry parity) |
| CI | new `.github/workflows/verify-drift.yml`, root `package.json` `test` script |

## Decisions made upfront — DO NOT ASK

- **Workstream A uses a runtime array bound to the type union in BOTH
  directions.** `CARD_SPECIAL_MECHANIC_KINDS` is a `readonly` const;
  two `Exclude<>`-based type assertions make a missing entry AND a
  bogus entry compile errors. A runtime-only list would drift exactly
  the way the hardcoded 17 did; a type-only union is invisible at
  runtime. Both, bound together, is the only shape that closes it.
- **KW-2's assertion changes shape, deliberately.** Today it asserts
  "these 17 kinds resolve". It will assert "EVERY kind either resolves
  to a glossed keyword or is listed in `KINDS_WITHOUT_KEYWORD` with a
  reason" — so a new kind fails until it is classified. It also asserts
  the reverse: no `MECHANIC_KEYWORD` key that is not a real kind.
- **The glyph tables stay triplicated.** Deduplicating them across
  three runtimes (React Native SVG, React DOM, a Node HTML generator)
  is a refactor this phase does not own. The audit asked for a drift
  *test*, and a test is what makes the duplication safe.
- **The drift tests live at the repo ROOT**, in `scripts/`, not in any
  one workspace. They compare files across all three packages; a
  workspace-hosted test would only run on its own package's path
  triggers, so an editor-only or catalog-only change could drift
  unseen. A new `verify-drift.yml` triggers on every path they read.
- **Every parser in the drift test self-checks.** If an extractor
  returns zero entries, the test fails rather than passing vacuously —
  otherwise a future refactor of the parsed file silently neuters the
  gate, which is the exact failure class this phase exists to close.
- **Workstream D takes the parity-check branch**, which the build-plan
  row offers as the alternative to regenerating from data. There is no
  keyword *data* file to generate from: the atlas is a hand-written
  scoreboard with prior-art receipts, and the mobile `KEYWORD_GLOSS` is
  the gloss registry. Parity between them is the honest gate; inventing
  a third generated source would add a fourth thing to drift.
- **Names are normalized before comparison** (`DRAW N` → `DRAW`,
  Title-Case → upper). Atlas rows carry value placeholders the registry
  does not.
- **Known non-parity is recorded as data, not silenced.** Where the
  atlas and the registry legitimately differ (card-local words that get
  no atlas row per the atlas's own row policy; die-gear rows), the
  difference lives in an explicit, commented allowlist the test prints
  — so it is reviewable rather than invisible.

## Tests

| Case | Assert |
|---|---|
| kind union | a kind added to `CardSpecialMechanic` without a list entry fails typecheck |
| KW-2 | every kind resolves to a glossed keyword or is explicitly classified |
| KW-2 reverse | no `MECHANIC_KEYWORD` key that is not a real mechanic kind |
| glyph parity | the three tables carry identical keyword sets and path data |
| editor vocab | every `wx.ts` KEYWORDS label is a live registry keyword or explicitly editor-local |
| atlas parity | atlas rows and registry keywords agree modulo the recorded allowlist |
| parser health | every extractor returns a non-zero count |

## Verify gate

`npm run verify` at the repo root, plus `node --test
scripts/content-drift.test.mjs` and `node scripts/check-lexicon.mjs`.

## DoD

- [ ] KW-2 derives from the union; a new kind fails until classified.
- [ ] Glyph triplication has a passing drift test.
- [ ] `wx.ts` dead words removed; vocabulary gated.
- [ ] `axio_keywords` denominators dropped; parity check green.
- [ ] `verify-drift.yml` triggers on every path the test reads.
- [ ] `npm run verify` green; build-plan row ticked.

## Follow-ups (out of scope)

- `assertNever` on the two `default:`-armed switches
  (`combat.engine.ts` mech switch, `combat.cards.ts` mechanicText) —
  the audit's separate finding, and a behavioural change.
- card-expert's 8-step keyword checklist gaps (audit §2 "Checklist
  gaps") — a prompt edit, not a test.
