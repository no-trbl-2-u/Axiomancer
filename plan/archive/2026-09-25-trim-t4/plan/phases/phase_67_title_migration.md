# Phase 67 — Title migration: "Axiomancer" → "Miserere Mei, Deus"

> Queued 2026-08-20 via `/oversight` from the product-name ruling
> (`plan/naming-session-2026-08-12.md` §6). Brief generated 2026-08-27
> by `/ship-a-phase` §9.

## Outcome

Every **player-facing and doc-facing product title string** in the live
tree reads "Miserere Mei, Deus". Internal identifiers (npm workspace
names, the repo folder, the `axiomancer` URL scheme, the Android package
id, `GH_REPO`) are untouched — those are a separate structural call
nobody has ruled on.

## Why

T ruled the rename 2026-08-20, alongside setting *Mörk Borg* as the
tonal North Star. `plan/bearings.md` already carries the ruling and
explicitly tells readers not to treat the remaining occurrences as
drift *until this phase lands*. Shipping it closes that carve-out.

## Surface — what changes

| File | Strings |
|---|---|
| `axiomancer-mobile/app.json` | `web.title`, `web.description`, `web.keywords`, `openGraph.title/description/siteName`, `twitter.title/description`, `structuredData.name/description` |
| `axiomancer-mechanics/src/CLI/game.cli.ts` | the `Axiomancer — game loop demo.` banner |
| `axiomancer-mechanics/src/CLI/hazard.cli.ts` | the `Axiomancer — hazard mini-game (v2).` banner |
| `scripts/build-devlog.mjs`, `scripts/build-catalog.mjs`, `scripts/devlog-shell.mjs` | published DevLog / Catalog / Tuning-Lab page titles, hub `<h1>`, breadcrumb home labels, footer |
| `plan/bearings.md`, `spec.md`, `AGENTS.md`, `axiomancer-mechanics/AGENTS.md`, `axiomancer-mechanics/VISION.md`, `README.md` | prose product-title mentions |
| `package.json` | monorepo `description` |
| `axiomancer-mechanics/src/index.ts`, `src/Utils/index.ts`, `axiomancer-mobile/theme/palette.ts`, `components/icons/icon-registry.ts` | code comments that name the product |
| `skills/ship-a-phase.md` hard rule 9 | "Axiomancer name capitalized" → the new title |

## Explicitly OUT of scope (locked by the build-plan row)

npm package / workspace names (`axiomancer`, `axiomancer-mobile`,
`axiomancer-mechanics`), the repo and folder name, `GH_REPO`, the
`axiomancer` URL scheme, `com.axiomancer.mobile`, and any git-level
rename. Dated records (`devlog/`, `plan/` except `bearings.md`,
`docs/reports/`, `specs/`, `braindump/`, `scratch/`) keep their period
language — that is the lexicon zoning contract, and rewriting history
is not a migration.

## Decisions made upfront — DO NOT ASK

- **The published DevLog / Catalog site chrome is IN**, though the
  build-plan row does not name it. It is the most public-facing title
  surface in the repo; leaving it reading "Axiomancer" would defeat the
  migration on the one surface strangers actually see.
- **The title-screen wordmark cannot ship here.** It is painted into
  `assets/images/title-embark.jpg` — there is no text node to rename
  (`components/TitleScreen.tsx` says so in its own comment). This phase
  changes the browser-tab/store title while the in-app art still reads
  "AxiomanceR". That gap is filed as an AUDIT row for the art pipeline
  (Phases 71/73), not silently absorbed.
- **Store-facing subtitle.** `web.title` becomes
  `Miserere Mei, Deus — a dark fantasy deckbuilder`, dropping the
  "Mobile - Gothic TTRPG" suffix: the product is one game, not a mobile
  client for a tabletop product that does not exist. Descriptions are
  rewritten to match rather than find-and-replaced, because their
  current text ("the official mobile client for the Axiomancer tabletop
  RPG") is false about the product regardless of its name.
- **No `lexicon.json` row for the old title.** A `\bAxiomancer\b`
  pattern would fire on every legitimate internal identifier and every
  dated record. The title is not a retired *term* in the registry's
  sense; the zoning would have to be inverted to make it one.
- **`plan/bearings.md`'s "Status-effect combat is the core fun"**
  (line 22) is the SAME retired status-primacy doctrine Phase 66
  retired, in a phrasing that row's pattern missed — on a live surface.
  Fixed here (the file is already open for the rename) and the phrasing
  is added to `status-primacy-doctrine`'s pattern so it cannot return.

## Collision check (required by the build-plan row and naming-session §6)

`Miserere` is live in-fiction as a rank-5 choir spell
(`cards.library.ts`, "Have mercy is a request with a price"). Verified:
no UI surface renders the product title beside card text. The product
title appears only in browser-tab / OG / store metadata and CLI
banners; the card appears in the combat board and card registry. On
web the tab title sits above a deck that may hold the card — which
reads as the game being named for the psalm the card quotes, not as a
duplicate. No change needed on either side.

## Tests

| Case | Assert |
|---|---|
| `app.json` metadata | existing mobile verify (`data:validate` / build) stays green |
| CLI banners | mechanics CLI e2e snapshots updated where they pin the banner |
| `TitleEmblem` fixture | the `title="Axiomancer"` prop fixture is renamed with its assertion |
| site builders | `npm run site:build` produces pages titled with the new name |
| lexicon | `node scripts/check-lexicon.mjs` clean with bearings' new phrasing armed |

## Verify gate

`npm run verify` at the repo root, plus `npm run site:build` and
`node scripts/check-lexicon.mjs`.

## DoD

- [ ] Every in-scope title string reads "Miserere Mei, Deus".
- [ ] `bearings.md`'s "until that phase lands" carve-out removed.
- [ ] Collision check recorded (above).
- [ ] Title-art gap filed as an AUDIT row.
- [ ] `npm run verify` green; build-plan row ticked.

## Follow-ups (out of scope)

- New title art carrying the new wordmark (art pipeline, Phases 71/73).
- The internal-identifier rename (workspaces, repo, scheme, package id)
  — a structural call that needs its own ruling.
