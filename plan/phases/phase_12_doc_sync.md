# Phase 12 — Doc-sync pass: reconcile spec.md / docs/combat.md with the shipped engine

## Outcome / Why

Spec 32 v3 ("THE STRIKE IS DEAD", shipped 2026-07-08 — the same day as this
tick) deleted `basePower` / `chipHp` from the `Card` schema, deleted
`GOLD_CARD_IDS` / `isGoldCard`, deleted the `DIRECT_DAMAGE_WEIGHT` constant,
and replaced the PR #190 five-preset deck lineup with ten spec-32-v3 themed
presets (`COMBAT_DECK_PRESETS`). None of that landed in
`axiomancer-mechanics/docs/combat.md`, which still documents the deleted API
surface as if it were live — a consumer reading that doc today would import
symbols that no longer exist. `axiomancer-mechanics/spec.md` is worse: it's
an orphaned pre-monorepo-merge duplicate of the root `spec.md` (nothing in
the repo links to it — verified via grep) that still describes the legacy
Heart/Body/Mind combat system as "V1 scope" with no mention of
Hazard-Pattern Combat at all.

This phase makes the docs honest again without creating a second product
spec to keep in sync forever.

## Scope (files touched)

1. `axiomancer-mechanics/spec.md` — collapse to a short pointer stub (the
   `CLAUDE.md` → `AGENTS.md`/`VISION.md` pattern already used elsewhere in
   this repo). Root `spec.md` is the canonical product spec per
   `plan/bearings.md`; keeping a second full spec here has been silently
   diverging since the monorepo merge and nothing reads it.
2. `axiomancer-mechanics/docs/combat.md` — fix the confirmed-dead API
   references (basePower, DIRECT_DAMAGE_WEIGHT, GOLD_CARD_IDS/isGoldCard,
   stale five-preset description) and add the missing spec 32 v3
   card-type/rank/rarity surface (currently undocumented entirely).
3. Root `spec.md` — one wording fix ("efficient path" → "only path", since
   raw strike damage no longer exists at all) plus a Queued-section note
   for spec 31/32.

## Decisions made upfront — DO NOT ASK

- **`axiomancer-mechanics/spec.md` becomes a pointer, not a rewrite.**
  Verified via `grep -rn "mechanics/spec.md"` across the repo (including its
  own `AGENTS.md`/`CLAUDE.md`) that nothing references this file. A second
  full product spec is exactly the kind of doc that caused this phase to
  exist in the first place. Pointer stub wins over a parallel rewrite.
- **`docs/combat.md`'s stale API rows are corrected in place**, not deleted
  wholesale — the surrounding sections (Skills/Token system, Wild-die
  growth, stance draft/Conviction/Signature Skills) were verified still
  accurate against `src/Combat/combat.engine.ts` / `src/Skills/` and are
  left untouched.
- **No new prose duplicating `specs/32-no-strike-card-library.md`.** The doc
  gets a pointer + the corrected API table rows, mirroring the existing
  pattern for Spec 26b ("in-flight scaffolding... has no spec file of its
  own yet").
- **`specs/README.md`'s recommended-order table (specs 26-32 status) is
  explicitly OUT OF SCOPE** for this phase — it's a different reconciliation
  problem (spec status tracking, not API docs) and the phase row only names
  `spec.md` / `docs/combat.md`. Filed under Follow-ups.
- **No code changes.** This is a docs-only phase; the verify gate is run as
  a sanity check (nothing should be affected) rather than because tests
  exist to write.

## Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
```

Docs-only diff — expected to pass unchanged. No new tests (nothing
executable changed).

## Commit body template

```
docs(mechanics): reconcile spec.md / docs/combat.md with spec 32 v3 — phase 12

- <bullets>

Decisions:
- axiomancer-mechanics/spec.md collapsed to a pointer at root spec.md
  (orphaned, unreferenced, was silently diverging)
- <other calls>

Closes #<phase-issue-number>
```

## DoD

- `axiomancer-mechanics/docs/combat.md` contains no references to deleted
  symbols (`basePower`, `chipHp`, `DIRECT_DAMAGE_WEIGHT`, `GOLD_CARD_IDS`,
  `isGoldCard`) presented as live API.
- `axiomancer-mechanics/spec.md` points to root `spec.md` instead of
  duplicating it.
- Root `spec.md` no longer claims status is merely the "efficient" path to
  0 HP.
- `npm run verify --workspace axiomancer-mechanics` green.

## Follow-ups (out of scope)

- `axiomancer-mechanics/specs/README.md`'s spec 26-32 status table is stale
  (specs 31/32 aren't listed at all; 26/29/30 may have partially shipped
  under different phase numbers) — separate reconciliation pass.
- `axiomancer-mechanics/docs/combat-audit-2026-07-05.md` intentionally left
  untouched — it's a dated point-in-time audit report, not living docs.
