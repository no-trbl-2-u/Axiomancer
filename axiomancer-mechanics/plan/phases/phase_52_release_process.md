# Phase 52 — Release process artifacts (CHANGELOG.md + RELEASING.md)

> Promoted via `/oversight` 2026-05-19 (fourth oversight of the day,
> commit `7978a89`) from expand-pass-9 candidate `d4bcc86`. Brief
> authored 2026-05-19 at commit `b011acb`.

## Source

- `plan/PHASE_CANDIDATES.md` Promoted entry "Phase 52 — Release process artifacts".
- `a86df8c` (0.10.0 tag, today) shipped with no `CHANGELOG.md` entry.
- 7 published tags (`v0.2.0` through `v0.10.0`) with zero in-repo release artefacts.
- Mobile upgrade doc `axiomancer-mobile/docs/engine-upgrade-0.7.0-to-0.10.0.md` had to be hand-reconstructed from `git diff v0.7.0..v0.10.0 -- src/index.ts` + per-phase briefs.

## Goal — one-line outcome

Codify the bump-and-publish dance so future engine→mobile bumps don't repeat the from-scratch reconstruction. Add `CHANGELOG.md` + `RELEASING.md` at the repo root, cross-linked from `README.md`. Extend `scripts/deploy-check.mjs` with a "latest tag matches CHANGELOG top heading" assertion.

## Decisions (made upfront)

### D1 — Keep-a-Changelog format, semver headers, ISO dates

Picked over (a) loose freeform, (b) Conventional Commits per-line. Keep-a-Changelog gives consumers a stable grammar (Added / Changed / Removed / Deprecated / Fixed) that mobile's upgrade doc can map mechanically. Per-version section header is `## [0.X.Y] — YYYY-MM-DD`.

### D2 — Back-fill all 7 published tags, not just the next one

The candidate scope explicitly calls for back-fill (`0.2.0` through `0.10.0`). Each entry sourced from the matching phase briefs / commit log. Without back-fill, the first published-against-CHANGELOG bump would be a partial record; mobile and any future consumer would still need to reach into `git log` for pre-CHANGELOG history.

### D3 — RELEASING.md describes the user-triggered flow as-is, not new automation

The user has consistently picked "user-triggered post-Phase-50" over "auto-publish" (oversight Q2 on 2026-05-19). RELEASING.md documents the existing flow (manual `npm publish`) — it does NOT introduce a release workflow. The CI-verify-on-PR candidate (filed at expand-13) covers a sibling concern; that's a separate phase.

### D4 — Deploy-check assertion uses git tag, not package.json

Pick the latest annotated git tag (`git describe --tags --abbrev=0`) over `package.json` `version` because the `0.10.0` tag was cut without bumping `package.json` (confirmed: package.json still reads `"version": "0.10.0"` matching the tag, but the assertion needs to handle the case where a tag exists ahead of package.json bump or vice versa). The CHANGELOG top heading must match the git tag — that's the single source of truth for "what was published."

## Commit units

### Unit 1 — `CHANGELOG.md` (back-filled 0.2.0 → 0.10.0)

File at repo root following Keep-a-Changelog conventions. Sections per version: Added / Changed / Removed / Deprecated / Migration notes (where applicable). Sources:

- `0.2.0` (pre-loop): initial Effects + Combat engines per Specs 01-03.
- `0.5.0`: Skills engine (Spec 04) + library (Spec 04b).
- `0.6.0`: Equipment engine + library (Spec 05 / 05b / 05c / 05d).
- `0.7.0`: pre-loop major surface — last point where mobile was pinned exact.
- `0.8.0`: Phase 09-25 era surface (game loop, RNG, MapEvents).
- `0.9.0`: Phase 26-38 era surface (CLI, RN events, ActiveEffect.sourceId).
- `0.10.0` (today, `a86df8c`): Phase 38-49 surface bundle:
  - **Added.** Philosophy module (Phase 42-46 — `AlignmentGate`, `requiresAlignment` on dialogue + skill learning, `bucketAxis`, `getAlignmentCell`, `applyAlignmentDelta`, `defaultAlignment`, `philosophicalAlignmentLibrary`, `AXIS_HIGH_THRESHOLD`, `AXIS_LOW_THRESHOLD`, types `PhilosophicalAlignment` / `AxisBucket` / `AlignmentFallacy` / `PhilosophicalAlignmentCell` + `GameState.philosophicalAlignment` field). Shop reducers `buyItem` / `sellItem` (Phase 37) + types `ShopWare` / `ShopInventory`. `unlockAdjacent` world reducer (Phase 31). `selectCritDamage` Combat helper. `ActiveEffect.sourceId` (Phase 38). `Effect.sourcedFromCell` + `Skill.sourcedFromCell` (Phase 44). `Enemy.philosophicalAlignment` + outlook-driven AI bias (Phase 45). Enemy-skill caster path — `executeSkill` 4th arg `casterSide: 'player' | 'enemy'` (Phase 49). 4 Tier-3 fallacy skills + 3 fallacy effects.
  - **Changed.** `executeSkill` signature gained optional `casterSide` (default `'player'` — backwards-compatible). `ApplyEffectOptions` gained optional `sourceId` (additive).
  - **Removed.** `WorldMap` type (deprecation predecessor of `MapDefinition` + `MapState`). `getCoastalMap` from `src/index.ts` + `src/World/index.ts` + `src/World/map.registry.ts` (deprecated since Phase 23 — see iterate `b85f509`).
  - **Migration notes.** `GameState.philosophicalAlignment` is a new required field; `migrateV4toV5` defaults legacy v4 saves to `{ epistemology: 0, outlook: 0, scope: 0 }` automatically. `GAME_STATE_VERSION` bumped 4 → 5. Consumers using `getCoastalMap` must switch to `getMapDefinition('coastal-continent', mapName) + createMapState(def)` — same return shape, two-call pattern.

- `0.10.1` placeholder section (top of file, marked `(unreleased)`): names Phase 50 (skillLibrary + getSkillById top-level re-export, types.d.ts emission fix), Phase 51 (autosave throttling), plus the iterate additions (`getActiveEffectModifiers` / `getEffectiveStats` / `canAct` / `resolveEffectiveAdvantage` re-exports + `defaultSellPrice` helper). User will fill the publish date when they run `npm publish`.

Files: `CHANGELOG.md` at repo root.

Verify: `npm run verify`.

Commit: `docs(release): Phase 52 unit 1 — CHANGELOG.md back-filled through 0.10.0 + 0.10.1 unreleased`.

### Unit 2 — `RELEASING.md` + deploy-check assertion + README cross-links

File at repo root. Sections:

1. **Pre-release checklist** — verify gate green, deploy:check passes, build-plan Status block has no `[ ]` rows blocking, all relevant AUDIT/CRITIQUE rows drained or rejected.
2. **Cut the tag** — bump `package.json` `version`, `git tag -a v<N>.<N>.<N> -m "<topline>"`, push tag.
3. **Publish to npm** — `npm publish` (interactive 2FA per the current npm account convention; not codified as automation per D3).
4. **Post-publish** — flip the `(unreleased)` CHANGELOG heading to `[X.Y.Z] — <ISO date>`, commit, push. Document the bump in any consuming-project upgrade docs (e.g. `axiomancer-mobile/docs/engine-upgrade-*.md`).
5. **Rollback** — `npm unpublish` window is 72 hours; if a critical bug ships, bump patch + republish over the broken version rather than unpublishing.

Cross-link from `README.md` top section: "See [CHANGELOG.md](./CHANGELOG.md) for version history and [RELEASING.md](./RELEASING.md) for the publish flow."

Extend `scripts/deploy-check.mjs` with a new assertion after the existing types.d.ts count guard: read the latest git tag via `git describe --tags --abbrev=0`, read the top `## [N.N.N]` heading in `CHANGELOG.md`, fail the gate if they don't match. The `(unreleased)` placeholder is allowed and treated as "the next bump" — the assertion only fires on tag-matched headings.

Files: `RELEASING.md` at repo root, `scripts/deploy-check.mjs`, `README.md`.

Verify: `npm run verify` + `npm run deploy:check` (the new assertion must pass with the current `v0.10.0` tag matching the CHANGELOG `## [0.10.0]` heading from Unit 1).

Commit: `docs(release): Phase 52 unit 2 — RELEASING.md + deploy-check tag/CHANGELOG assertion`.

## Verify gate

`npm run verify` + `npm run deploy:check` — both green.

## DoD

- Phase 52 row in `plan/steps/01_build_plan.md` flips `[ ]` → `[x]` with ship commit hashes.
- `CHANGELOG.md` exists at repo root with entries for `0.2.0` through `0.10.0` + an `(unreleased)` 0.10.1 placeholder.
- `RELEASING.md` exists at repo root describing the manual publish flow.
- `README.md` carries the cross-links.
- `scripts/deploy-check.mjs` enforces tag/CHANGELOG agreement; current `v0.10.0` passes.

## Out of scope

- CI-verify-on-PR workflow — separate candidate (filed at expand pass 13).
- Automated `npm publish` — explicitly deferred per D3.
- Mobile-side CHANGELOG consumption — mobile's `engine-upgrade-*.md` doc is its own concern; this phase just unblocks the canonical "what changed" surface for it to read.
