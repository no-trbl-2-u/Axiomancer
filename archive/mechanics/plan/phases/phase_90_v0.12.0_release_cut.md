# Phase 90 — v0.12.0 release cut

## Outcome

v0.12.0 tag pushed to GitHub and package published to npm with the Phase 80-87 mechanic shift + audit sweep complete.

## Source spec

RELEASING.md established ceremony. No dedicated implementation spec — this is process execution.

## Implementation units

**Unit 1** — Pre-release checklist verification:
- Verify working tree clean (`git status`)
- Verify build plan queue (no pending `[ ]` rows that should be in v0.12.0)
- Verify AUDIT + CRITIQUE drained
- Run `npm run verify` (must be green)
- Run `npm run deploy:check` (must be green)
- Verify CHANGELOG ready (all unreleased content documented)
- No GAME_STATE_VERSION bump in this release (no ceremony needed)

**Unit 2** — Version bump and tag:
- Bump `package.json` version to 0.12.0 using `npm version minor --no-git-tag-version`
- Update `CHANGELOG.md` heading from `[unreleased]` to `[0.12.0] — 2026-05-26`
- Commit with message "release: 0.12.0"
- Create annotated tag `v0.12.0`
- Push commit and tag to origin

**Unit 3** — npm publish:
- Run `npm publish` (manual + attended)
- Verify package published successfully

**Unit 4** — Post-publish cleanup:
- Add new `[unreleased]` heading to top of CHANGELOG.md
- Update RELEASES.md with 0.12.0 summary section
- Commit and push post-publish changes

## Decisions made upfront — DO NOT ASK

- Version bump is **minor** (0.11.0 → 0.12.0) due to BREAKING changes documented in CHANGELOG
- Tag message will be "Phase 80-87 mechanic shift: skills always land, event cleanup"
- No GAME_STATE_VERSION ceremony needed (no mentions in unreleased section)
- Release date will be 2026-05-26 (today)

## Verify gate

- `npm run verify` must pass before version bump
- `npm run deploy:check` must pass before tag creation
- All pre-release checklist items must be green

## Commit body template

```
release: 0.12.0

Phase 80-87 mechanic shift + audit sweep. Two BREAKING changes:
- EffectApplicationResult.rebounded removal
- effect-resisted/effect-rebounded SkillEvent variant renames

Established ceremony per RELEASING.md.
```

## Definition of Done

- [ ] Pre-release checklist verified (working tree, build plan, audit/critique, verify gate, deploy gate, CHANGELOG)
- [ ] package.json version bumped to 0.12.0
- [ ] CHANGELOG.md heading updated to `[0.12.0] — 2026-05-26`
- [ ] Release commit created and pushed
- [ ] Annotated tag v0.12.0 created and pushed
- [ ] Package published to npm successfully
- [ ] CHANGELOG.md prepared for next version with new `[unreleased]` heading
- [ ] RELEASES.md updated with 0.12.0 summary
- [ ] Post-publish changes committed and pushed

## Follow-ups (out of scope)

- Consumer notification (axiomancer-mobile upgrade if needed)
- Future v1.0.0 graduation planning (deferred per RELEASING.md)