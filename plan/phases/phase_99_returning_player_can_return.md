# Phase 99 — A returning player can actually return

> From `axiomancer-mobile/docs/reports/PLAYTEST_BUGS_2026-09-18.md`, BUG-02
> (critical) and BUG-03 (high). That report was committed 2026-09-18 (`1d48483`)
> and is referenced **nowhere** in `plan/` — no CRITIQUE row, no AUDIT row, no
> candidate, no build-plan row — so no loop verb would ever have picked it up.
> Found by this session's independent player-visibility sweep.

## Outcome

Reopening the game after playing it shows you the game, not a blank white
screen. And the progress you made is still there.

## Why these two together

They are the same story from the player's side: *you played, you came back, it
was gone.* BUG-02 made the app unreachable for anyone with a save; BUG-03 meant
that even when you got in, the walk and the opening quest had not been written
down. Shipping one without the other still leaves "I came back and lost it".

## BUG-02 — the dropped redirect (critical)

**Symptom.** Any player with a save gets a permanently blank screen on launch.
`document.body.innerText.length === 0`, zero buttons, no console error, nothing
at `warn`/`error` in the log tail. It never recovers. Clearing the save makes the
title screen render again; restoring it makes the screen blank again.

**Root cause.** A returning player has `onboarding.showTitleScreen` false, so
`app/index.tsx` renders `<Redirect href="/exploration" />` on its **first**
paint — there is no title screen to click through first. `Redirect`'s effect is
keyed only on `[href]`, and `dispatchTo` opened with a bare
`if (!navigationRef.isReady()) return;`. If the NavigationContainer had not
attached at that moment the redirect was dropped, and because `href` never
changes the effect could never re-run. The index route just kept rendering
`null`. Both of `dispatchTo`'s failure exits were `__DEV__`-gated, which is
exactly why this reached a player with nothing in the log.

**Not web-only.** `app/index.tsx` and the router seam are shared, so the same
race exists on native, where it presents as a blank launch screen.

**Fix.** Queue instead of drop. `dispatchTo` records the request when the
container is not ready; `<NavigationContainer onReady>` calls the new
`flushPendingNavigation()` to replay it. Last-write-wins, and the queue is
cleared before dispatch so a duplicate `onReady` cannot double-navigate. The two
silent exits now log through the app logger (`nav` domain, `warn`) so the next
occurrence lands in the crash tail instead of vanishing.

Covering every `dispatchTo` caller — not just `Redirect` — is deliberate:
`useRouter().push/replace` can race the container the same way from any screen.

## BUG-03 — nothing saved on the way out (high)

**Symptom.** Travel `fv-1 → fv-2`, accept the opening quest, reload: the save
still reads `currentNode: "fv-1"`, `quests.active: []`. Both are gone.

**Root cause, two halves.**

1. Node movement was not a checkpoint. Mobile's `moveToAction` writes the new
   world with `store.setState({ world })` **directly**, bypassing the engine
   reducer — so the engine's `DURABLE_ACTIONS` autosave gate never sees the
   move, even though `MOVE_TO_NODE` is on that allowlist.
2. There was no save-on-exit **at all**. `flush()` has existed on the
   persistence adapter since it was written with **zero** callers outside its own
   tests, and there was no `AppState`, `pagehide` or `visibilitychange` handler
   anywhere in `app/`, `state/`, `lib/` or `components/`. With the adapter's
   500ms write debounce, even a legitimate checkpoint could be lost if the player
   closed inside that window.

**Fix.** `moveToAction` takes a save, and a new `<SaveOnExit>` component takes a
final save and flushes it on the way out (native `AppState`
background/inactive; web `pagehide` + `visibilitychange → hidden`).

## The invariant this phase deliberately changed

`state/e2e/exploration.engine.test.ts` carried
`it('a move does not implicitly call adapter.save (Spec 09 hook)')`. **That label
was wrong**, and the assertion encoded the mobile implementation gap as if it
were the design:

- Spec 09 Q4 ("Save granularity") is **resolved**, at Phase 51 (`4972f9a`), in
  favour of Path B — autosave restricted to a curated `DURABLE_ACTIONS`
  allowlist. `MOVE_TO_NODE` is **on** that allowlist.
- So persisting on node movement is the engine's ratified behaviour. Mobile
  simply never inherited it, because it bypasses the reducer.

The case is re-derived (not relaxed) to assert the correct invariant, with the
citation in the test body, and a **new** case pins the half of Spec 09 that has
not changed: a UI-tier action (`dismissEvent`) still never writes through.

## Decisions made upfront — DO NOT ASK

1. **Queue the navigation rather than gate the tree on a ready flag.** Gating
   would delay first paint for every player to fix a race that affects the first
   frame only. The queue costs nothing on the happy path — a dispatch made while
   ready still goes straight through, pinned by a test.
2. **Last-write-wins on the queue.** Replaying an older request would land the
   player on a screen they had already navigated away from.
3. **Clear before dispatch.** Makes `flushPendingNavigation` idempotent, so a
   re-entrant or duplicate `onReady` cannot double-navigate, and a failing
   dispatch cannot leave a request queued forever.
4. **Unknown routes are not queued.** An unroutable href must not sit waiting to
   fail again on ready.
5. **Route the silent exits through the app logger, not `console.warn`.** The
   `__DEV__` gate is the reason this was invisible in production. `nav`/`warn` is
   already a real domain and level, and it reaches the crash tail.
6. **`SaveOnExit.flush` is optional.** The fixture-boot adapter is in-memory and
   has none — and must not: writing a test fixture to disk would clobber the
   player's real save. The compiler caught this; the prop type now says so.
7. **Feature-detect `addEventListener`, not just `window`.** Under the
   react-native jest preset a `window` exists with no listener API, and a bare
   `typeof window === 'undefined'` check passes and then throws on the next
   line — which would take out the whole provider tree at mount.
8. **`inactive` counts as an exit on native.** iOS passes through it on the way
   to `background`, and a swipe-to-kill may never deliver `background` at all.
9. **`pagehide`, not `beforeunload`, on web.** iOS Safari does not fire
   `beforeunload` for a backgrounded or discarded tab. `visibilitychange →
   hidden` additionally catches the tab switch that never unloads.
10. **Quest acceptance is covered by the exit flush, not by a new checkpoint.**
    Quest grants run through the dialogue runtime, not `actions.ts`; chasing
    every mutation site is a wider change than this phase. `SaveOnExit` covers
    them all at once. Filed as a follow-up to make it explicit.

## Pages x tests matrix

| Suite | Asserts |
|---|---|
| `lib/platform/__tests__/router.pending-navigation.test.ts` (new, 7) | a not-ready dispatch is remembered; replayed on ready; last-write-wins; flush is idempotent; no-op when empty; the ready path is not delayed; unknown routes are not queued |
| `components/__tests__/SaveOnExit.test.tsx` (new, 6) | native: saves+flushes on `background` and on `inactive`; does not on `active`; unsubscribes on unmount; survives a missing `flush`; flushes even when `save()` throws |
| `components/__tests__/SaveOnExit.web.test.tsx` (new, 4, jsdom) | web: saves+flushes on `pagehide` and on `hidden`; not on `visible`; removes listeners on unmount (proving they were live first, so the assertion cannot pass vacuously) |
| `state/e2e/exploration.engine.test.ts` (1 re-derived, 1 new) | a move IS a checkpoint, citing Spec 09 Q4 / Phase 51; a UI-tier action still is not |

## Verify gate

`npm run verify --workspace axiomancer-mobile` — 306 suites, 2903 tests, 0 lint
errors (15 pre-existing warnings, unchanged). Mechanics and card-editor
untouched: no file outside `axiomancer-mobile/` changed, so **no baseline regen**.

## DoD

- [x] navigation queue + `flushPendingNavigation`, wired to `onReady`
- [x] router faults logged through the app logger instead of `__DEV__`
- [x] node movement is a save checkpoint
- [x] `<SaveOnExit>` mounted, both platform branches
- [x] 17 new tests + 1 re-derived invariant with its citation
- [x] mobile gate green

## Follow-ups (out of scope)

- BUG-01 (legend "N sealed" counter disagrees with the pips it labels) and
  BUG-04 (map camera fits once and never re-frames, hiding 19 of 25 nodes) from
  the same report — both real, both confirmed still live. Phase 100.
- Make quest acceptance an explicit checkpoint in the dialogue runtime, rather
  than relying on the exit flush.
- **File the report itself.** `PLAYTEST_BUGS_2026-09-18.md` reached `main` with
  no `plan/` entry of any kind. That is a process gap, not a code one: a
  committed bug report that no loop verb can see is invisible work. Worth an
  `/oversight` ruling on where hand-written playtest reports get filed.
