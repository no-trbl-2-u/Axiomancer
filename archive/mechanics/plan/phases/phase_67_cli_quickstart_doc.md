# Phase 67 — CLI overview / quick-start doc

> User write-in at oversight-10. Pure docs phase; no engine touch.

## Outcome

A new `docs/quickstart.md` single-page entry point for a player or
contributor landing on the repo without context. Covers what's
shipped, how to drive the CLI, the walkthrough catalog, key in-game
flows, verify gates, and pointers to deeper docs. README.md gains a
top-level cross-link.

## Implementation units

Single-commit phase (pure docs assembly).

**Files:**
- `docs/quickstart.md` (new) — the entry-point page.
- `README.md` — add a cross-link near the top of the file to
  `docs/quickstart.md` ("Looking for a tour? See...").
- `CHANGELOG.md` `[unreleased]` `### Docs` — Phase 67 bullet.

## Decisions made upfront — DO NOT ASK

- **D1** — Single commit, no unit split. Pure docs assembly; the
  per-section ordering is best authored as one cohesive page.
- **D2** — Skip a "screenshots" section. The CLI is text-only; the
  doc relies on pasted CLI output snippets rather than images.
- **D3** — Walkthrough catalog summarises each of the 10 walkthroughs
  in one line + cross-links to
  `automation/scripts/walkthroughs/README.md` for the deeper table.
- **D4** — Phase numbers cited inline for marquee features (Phase
  X — feature) so a reader can trace the history; the per-phase
  briefs at `plan/phases/` are the ground truth.
- **D5** — `### Docs` bullet in CHANGELOG, not `### Added` — no
  public-API surface change.

## Verify gate

- `npm run type-check`, `npm test`, `npm run build` — all no-op
  (docs only).
- `npm run deploy:check` — no public-surface change.

## Definition of Done

- [ ] `docs/quickstart.md` exists.
- [ ] `README.md` cross-links to it.
- [ ] `CHANGELOG.md` `[unreleased]` ### Docs Phase 67 bullet.
- [ ] `npm run verify` + `npm run deploy:check` green.
- [ ] Build plan Phase 67 row flips `[ ]` → `[x]`.

## Canonical sibling

`docs/testing.md` — the closest existing "how this works in
practice" doc. `docs/quickstart.md` is its narrative-shaped sibling
for the player / first-time-contributor audience.
