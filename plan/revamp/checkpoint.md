# Revamp — the Act 1 checkpoint

> Part plan of [THE REVAMP](README.md). Phases **R9a** (save checkpoint in
> fights, loop) and **RC** (the Act 1 checkpoint release, attended). Added
> via `/oversight` 2026-09-28 at T's request.

## Why

T, 2026-09-28: "get everything to a good checkpoint with the mechanics in
place, the map working, and everything cleaned up. Then we'll cut a release
before we start work on content, cards, people, story, AI skills, anything
past Act 1, etc. This way, if I want to pump the brakes, we can reset to
this release version."

So RC sits between the reset (R1–R10, R9a, B4) and everything that grows
the game again: every owner-led B-row, R11 (loop content phases) and R12
(new combat-playtest) require it.

## R9a — Save checkpoint in fights (loop)

Promoted from `plan/PHASE_CANDIDATES.md` ("No single owner for
save/persistence policy", expand pass 19). A reload taken during a live
encounter lands the player past the fight: `beginHazardEncounter` clears
the event slice and consumes the node when the fight is entered, not when
it resolves. On a door node that skips the Doorwarden.

Decided here (the candidate asked for a ruling; this is the smaller shape
it recommended):

1. **Save ownership stays with mobile**, and is written down. The
   `wrapDeflectingAdapter` in `axiomancer-mobile/state/store.ts` and its
   hand-placed `save()` checkpoints are the one owner; the engine's
   `DURABLE_ACTIONS` allowlist is documented as the engine-only (CLI/test)
   path. Both files' header comments and `docs/` say so, and the guard test
   `axiomancer-mobile/state/e2e/exploration.engine.test.ts` ("mobile owns
   save timing") stays as the witness.
2. **A node is consumed when its encounter settles** (victory, flee,
   defeat, mercy), not when it is entered. Reuse the `arrivalPending`
   re-offer pattern that closed the prelude hole: a reload mid-fight puts
   the player back on the node with the fight offered again from the start.
   Rebuilding a half-played fight's turn state is out of scope.
3. Tests: an engine test that a save taken mid-encounter reloads onto the
   unconsumed node with its onward edges closed, for a normal fight and a
   door fight; a mobile e2e that reload mid-fight re-offers the fight.

Requires R7c (the engine's encounter state is final) and R8 (mobile flows
are final).

## RC — Act 1 checkpoint release (attended)

The loop never picks RC (attended). When every row it requires is `[x]`,
`/march` falls through to `/iterate` and `/expand` under the revamp rules
until T opens the session.

### Gate (all must hold before tagging)

1. **Rows:** R1–R10, R7a–R7c, R9a and B4 are `[x]` on main.
2. **Checks:** the root `npm test`, mechanics `verify`, mobile `verify`,
   `lint:content`, `check-lexicon`, and every `verify-*` workflow on the
   tagged commit are green.
3. **The walk:** the `playtester` agent drives the exported web build from
   a new game through the Breakwater, the Charcoal Wood, the Beacon Crags
   and the Lantern Deep. Each report must show:
   - a Doorwarden door fight in all four regions, each winnable;
   - Float-Eye on normal fights and at least one Brine Hag;
   - The Open Hand opens the mercy choice on the Brine Hag;
   - an Anvil near each region's exit;
   - healing potions obtainable and usable; shillings the only currency;
   - the vault door and the deep stair both sealed, with no crash or
     dead end past them;
   - about 3–4 level-ups across the clear (R9's target);
   - a reload mid-fight re-offers that fight (R9a);
   - no keyword, gloss or glyph on screen without a live carrier;
   - no console errors.
4. **Findings:** anything small is fixed in the session; anything larger
   is filed and blocks the tag until it ships.

### Cut

1. T tags the gated commit `v0.1.0-checkpoint` (annotated), pushes the tag
   and publishes a GitHub release. The release notes list what the core
   holds (README §2) and what is deliberately absent.
2. T builds an EAS preview APK from the tag and attaches or links it.
3. Record the tag in `plan/bearings.md` (THE REVAMP bullet) and the
   decisions log, with the reset recipe:
   `git switch -c <branch> v0.1.0-checkpoint`.
4. Tick RC. R11 is then the next attended phase.

### Not in RC

No content, cards, keywords, people, story, art or new skills. No loop
changes (R11 owns those). No version bumps beyond the tag unless the EAS
build needs `app.json` `version`.
