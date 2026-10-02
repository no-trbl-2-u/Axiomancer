# Revamp — the Act 1 checkpoint

<!-- lexicon-ok: stance-check — the RC walk checks that the removed stance surface stays absent -->

> Part plan of [THE REVAMP](README.md). Phases **R9a** (save checkpoint in
> fights, loop) and **RC** (the Act 1 checkpoint release, attended). Added
> via `/oversight` 2026-09-28 at T's request.

## Why

T, 2026-09-28: "get everything to a good checkpoint with the mechanics in
place, the map working, and everything cleaned up. Then we'll cut a release
before we start work on content, cards, people, story, AI skills, anything
past Act 1, etc. This way, if I want to pump the brakes, we can reset to
this release version."

So RC sits between the reset (R1–R10c, R7d, R9a, B4) and everything that grows
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

1. **Rows:** R1–R10, R7a–R7e (with R7c2), R9a, R10b, R10c and B4 are `[x]` on main.
2. **Checks:** the root `npm test`, mechanics `verify`, mobile `verify`,
   `lint:content`, `check-lexicon`, and every `verify-*` workflow on the
   tagged commit are green.
3. **The walk:** the `playtester` agent drives the exported web build from
   a new game through the Breakwater, the Charcoal Wood, the Beacon Crags
   and the Lantern Deep. **RC proves Act 1 works, not that it is winnable
   (T, 2026-10-02, D75):** three grey cards cannot carry a real clear.
   Where the grey deck cannot win a fight, the walk settles it with the
   dev menu (D19) and moves on, and the report says which fights it
   settled that way. Each report must show:
   - a Doorwarden door fight in all four regions, each one starting,
     playing and settling without a crash or dead end;
   - Float-Eye on normal fights and at least one Brine Hag;
   - The Open Hand opens the mercy choice on the Brine Hag;
   - an Anvil near each region's exit;
   - healing potions obtainable and usable; shillings the only currency;
   - the Suppliant's Ring is the only relic in play, and no parked-world
     NPC, quest or shop is reachable (R7e, D72);
   - the vault door and the deep stair both sealed, with no crash or
     dead end past them;
   - level-ups fire as XP crosses R9's curve (the 3–4 across a clear
     is checked again once the trial set makes a real clear possible);
   - a reload mid-fight re-offers that fight (R9a);
   - no keyword, gloss or glyph on screen without a live carrier;
   - no stance chip, punish/yield line or stance readout anywhere (R7d);
     dice still power only their own colour of card;
   - no console errors.
4. **Findings:** anything small is fixed in the session; anything larger
   is filed and blocks the tag until it ships.
5. **Accepted for RC (T, 2026-10-02):** the combat "NO MOMENTUM" chip has
   no live carrier while the deck is grey (every grey card is colour ANY).
   Momentum is a locked mechanic; the chip stays and comes alive with the
   trial set's coloured cards (BT). The walk does not fail item "no glyph
   without a live carrier" on it.

### The walk, 2026-10-02 (attended)

Four `playtester` legs on the dev build, one per region, each continuing
the save from the last (slot Chronicle I). **Every checklist item passed**
once the in-session fixes below landed; the Momentum chip is accepted (5).

| Region | Doorwarden | Settled with dev skip | Brine Hag spared by The Open Hand | Level at exit |
|---|---|---|---|---|
| Breakwater | bw-17, 176 VITAE | Float-Eye, Brine Hag, Doorwarden | not reached (never under 30%) | 2 |
| Charcoal Wood | cw-17, 214 | Doorwarden | yes (honest play) | 3 |
| Beacon Crags | bc-15, 254 | Doorwarden | yes | 4 |
| Lantern Deep | ld-16, 290 | Doorwarden | yes | 5 |

Also seen: a reload mid-fight re-offers the fight from its reveal; both
sealed cutscenes (ld-15, ld-18) return to a usable map; the save reloads
cleanly at the end; no new console errors in a production path.

**Fixed in the session:** the Windows path bug in the DevLog test
(a493eaf7); the Ascend screens one level ahead and the intent pill printing
face damage (dbbecab6); drinking one of two potions removing both
(cb0a6d9f); every region's exit reachable past its Doorwarden, now gated
and pinned by a test (157864d4); pre-purge card ids crashing combat on load
(b09e1de0, B4 F2); the Chronicle calling a mercy FLED (b09e1de0); and,
at T's request, the map's ink blots, NODE GRAPH label and compass rose
removed (4f88a720).

**Filed, not blocking:** thirteen copy/label/console rows in
`plan/CRITIQUE.md` ("RC walk 2026-10-02"). **Two calls for T at the cut**
(`plan/PHASE_CANDIDATES.md`): the Chronicle empties on reload, and the
victory/mercy panels do not show XP or loot. Both are recommended to be
accepted for the tag and shipped after it.

### Cut

1. T tags the gated commit `v0.1.0-checkpoint` (annotated), pushes the tag
   and publishes a GitHub release. The release notes list what the core
   holds (README §2) and what is deliberately absent.
2. T builds an EAS preview APK from the tag and attaches or links it.
3. Record the tag in `plan/bearings.md` (THE REVAMP bullet) and the
   decisions log, with the reset recipe:
   `git switch -c <branch> v0.1.0-checkpoint`.
4. Tick RC. Next is the Blood Price trial set (D75, `cards.md` → "The
   trial set"); R11 stays the next attended loop phase.

### Not in RC

No content, cards, keywords, people, story, art or new skills. No loop
changes (R11 owns those). No version bumps beyond the tag unless the EAS
build needs `app.json` `version`.
