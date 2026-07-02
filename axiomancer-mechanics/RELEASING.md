# Releasing `axiomancer-mechanics`

> **Tag pushing** can be performed by Claude when the user explicitly
> authorises it ("go ahead and push the missing tags" or similar).
> Claude creates annotated tags at the correct release commits and
> pushes them to origin.
>
> **`npm publish`** remains a deliberate, attended, user-triggered
> step — Claude never runs it autonomously.

## Pre-release checklist

Run all of these locally before cutting a tag. Each must be green.

1. **Working tree clean.** `git status` shows no uncommitted changes.
   The loop should already be at HEAD; if not, `/oversight` first.
2. **Build plan queue.** Open `plan/steps/01_build_plan.md` Status
   block. Confirm no `[ ]` rows reference shapes that should land in
   the imminent release. A `[skipped]` row is fine; an `[ ]` row that
   the bump claims to ship is not.
3. **AUDIT + CRITIQUE drained or rejected.** `plan/AUDIT.md` Pending
   should have zero `[needs-user-call]` rows. `plan/CRITIQUE.md`
   Pending should have no rows whose `area` matches the bump's
   scope (e.g. don't ship `0.X.Y` while a HIGH critique row for the
   same module sits Pending).
4. **Verify gate green.** `npm run verify` (type-check + tests +
   build).
5. **Deploy gate green.** `npm run deploy:check` (npm pack dry-run +
   the count/snapshot guards at `scripts/deploy-check.mjs`).
6. **CHANGELOG ready.** The `[<next-version>] — unreleased` heading
   at the top of `CHANGELOG.md` describes everything the bump ships.
   No `(unreleased)` markers on entries that aren't actually
   shipping.
7. **`GAME_STATE_VERSION` ceremony.** If `[unreleased]` mentions a
   `GAME_STATE_VERSION` bump (additive-required field on `GameState`),
   verify (a) `src/Game/game.reducer.ts` exports the bumped constant,
   (b) `src/Game/game.migrate.ts` ships the matching
   `migrateV<N>toV<N+1>` step + wires it into the `migrate()` funnel
   + extends `assertGameState` with the new required field, (c) the
   bump is mirrored in `docs/gameloop.md` § "Save versioning +
   migration" and `docs/quickstart.md` save/load paragraph. The 0.10.x
   cycle bumped twice — `5 → 6` at Phase 72 (`runId`) and `6 → 7` at
   Phase 73 (`codex`). Future bumps follow the same pattern.

## Cut the tag

```bash
# 1. Bump package.json version (manual edit or `npm version <patch|minor|major> --no-git-tag-version`).
npm version <patch|minor|major> --no-git-tag-version

# 2. Flip the CHANGELOG heading from `[X.Y.Z] — unreleased` to `[X.Y.Z] — <ISO date>`.
#    (The `scripts/deploy-check.mjs` tag/CHANGELOG assertion will refuse to pass without this.)

# 3. Commit the bump.
git add package.json package-lock.json CHANGELOG.md
git commit -m "release: <version>"

# 4. Tag (annotated, signed if you've set up `commit.gpgsign`).
#    Claude can do steps 4–5 when explicitly authorised by the user.
git tag -a v<version> -m "<short topline of what shipped>"

# 5. Push the commit + tag.
git push origin main
git push origin v<version>
```

## Publish to npm

```bash
# Manual + attended. The 2FA prompt fires here.
npm publish
```

`package.json` `files` is `["dist", "package.json", "README.md", "LICENSE", "CHANGELOG.md", "RELEASING.md"]` (or however that field is configured today — verify with `npm pack --dry-run` from the pre-release checklist).

No automation in this repo runs `npm publish`. The
`.github/workflows/march.yml` autonomous-loop runner has no publish
step by design — `oversight` Q2 on 2026-05-19 explicitly picked
"user-triggered post-Phase-50" over auto-publish.

## Post-publish

1. **CHANGELOG.md prep next version.** Flip the previous
   `[unreleased]` heading to `[<version>] — <ISO date>` (this is
   what the deploy-gate's git-tag/CHANGELOG-disagreement check
   guards). Then add a fresh `[unreleased]` heading at the top of
   `CHANGELOG.md` for the next round of work. Commit + push.
2. **RELEASES.md prep next version.** Add a new
   `## <version> — <ISO date>` short-form section at the top of
   `RELEASES.md` summarising the bump in 5-10 bullet lines (per-phase
   ticks + the public-surface delta + the fixture count flip + any
   `GAME_STATE_VERSION` bump). `RELEASES.md` is the at-a-glance
   complement to `CHANGELOG.md`'s full per-phase detail.
3. **Notify consumers.** If a downstream consumer (e.g.
   `axiomancer-mobile`) needs the bump, update its upgrade-doc /
   pinned-version PR. For mobile specifically, the canonical
   handshake is `axiomancer-mobile/docs/engine-upgrade-<from>-to-<to>.md`.
4. **No-op for the loop.** The autonomous-beast loop keeps shipping
   phases into `main` against the published tag's HEAD. The next
   bump simply repeats this flow when the user calls for it.

## Rollback

- **npm unpublish window** is 72 hours. If a critical bug ships, the
  cleanest action is bump-patch + republish over the broken version
  (`0.10.1` → `0.10.2`), not `npm unpublish`. Unpublish breaks
  consumers who already installed the broken version.
- For pre-1.0.0 (currently 0.10.x), the deprecation lifecycle
  permits breaking changes in any minor bump (see below), so a bad
  bump's blast radius is bounded by how many consumers cached it.

## Deprecation lifecycle

> Pre-1.0.0 disclaimer: this lifecycle is the *preferred* path. Pre-1
> still allows breaking changes in any minor bump per `plan/bearings.md`
> — but consumers benefit when the lifecycle is followed.

1. **Mark as `@deprecated`.** Add a JSDoc `@deprecated` tag to the
   declaration, naming the replacement. Land in a minor bump.
2. **CHANGELOG.** The minor bump's CHANGELOG entry carries a
   `### Deprecated` section listing the symbol + replacement.
3. **Wait at least one minor bump.** Consumers have at least one
   published version to migrate against.
4. **Remove.** Removal lands in a separate minor bump with a
   `### Removed` CHANGELOG section naming the deprecation version.

Past examples of the lifecycle: `WorldMap` (deprecated since Spec 08
Q6 era, removed at commit `a707316` shipped in 0.10.0);
`getCoastalMap` (deprecated since Phase 23 era, removed at iterate
`b85f509` and will ship in 0.10.1).

## v1.0.0 graduation (deferred)

Pre-1 → 1.0 is a deliberate stop, not a routine bump. The criteria —
public-surface freeze, mobile-side consumer ready, content coverage
target — are not yet codified. File a candidate via `/expand` when
the v1 question becomes load-bearing.
