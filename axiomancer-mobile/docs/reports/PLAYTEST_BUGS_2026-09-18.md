# Playtest bug hunt — 2026-09-18

> Method: hands-on play of the exported web build (`expo export --platform web`,
> served statically at 414x896 mobile viewport) via Playwright. Each bug is
> found in play, confirmed against the source, then the run restarts to hunt a
> different surface.
>
> Sentry note: `axiomancer-mobile/lib/monitoring.ts:59` returns early on
> `Platform.OS === 'web'`, so **none of these web-found bugs can ever reach
> Sentry**. Sentry only receives native (EAS build) crashes. Planning is
> therefore done from this report, per the owner's direction.

---

## BUG-01 — Map legend's "N sealed" counter disagrees with the map it labels

- **Severity:** low (cosmetic/trust, always visible)
- **Area:** exploration map HUD
- **Status:** confirmed in play + root-caused

**Repro (100%, from a brand-new game):**
1. EMBARK → tap through the opening cutscene → land on the WILDS map.
2. Tap node `fv-2` (Crossing) → TRAVEL HERE → talk to Old Marrow → leave.
3. Read the legend strip at the bottom right of the map.

**Observed:** the strip reads `25 nodes · 20 sealed`, but **21** nodes actually
render in the sealed state (1 `here` + 3 `open` + 21 `sealed` = 25).

**Expected:** the count matches the pips it is labelling.

**Root cause (two different sources of truth):**
- The **pips** are classified by `classifyNode()`
  (`state/presenters/exploration.engine.ts:228-238`): anything that is not
  current, not in `completed`, and not in `reachable` renders `locked` → "sealed".
- The **counter** is built from the engine's own lock list
  (`state/presenters/exploration.engine.ts:411` → `:482`):
  `` `${def.nodes.length} nodes · ${locked.length} sealed` `` where
  `locked = world.currentMap.lockedNodes`.

The starting node `fv-1` (Hovel) was never in `lockedNodes` (the map starts you
on it) but, once you walk away, it is no longer `reachable` and was never marked
`completed` — so the renderer calls it sealed while the counter does not.

**Second-order symptom worth deciding on:** a node the player has personally
stood on displays with the ✕ SEALED mark, never the ● TRODDEN mark the legend
advertises — `TRODDEN` is only ever used for `completed` nodes. So the legend
promises a state the start node never reaches.

**Suggested fix:** derive the counter from the same `classifyNode` pass that
draws the pips (count `kind === 'locked'` in the already-built `nodes` array)
rather than from `world.currentMap.lockedNodes`. Optionally also decide whether
"visited but not completed" should classify as `completed`/TRODDEN.

**Note:** `state/exploration-maps/fishing-village.layout.ts:9` already carries a
comment about a previous disagreement with this same legend counter, so this
surface has bitten before.

---

## BUG-02 — Returning players get a BLANK SCREEN on launch (game unreachable)

- **Severity:** critical — the game is unplayable for anyone who has a save
- **Area:** `app/index.tsx` → `lib/platform/router.ts` (`Redirect` / `dispatchTo`)
- **Status:** confirmed in play, reproduced repeatedly, root-caused by elimination

**Repro (100%):**
1. Play far enough to hit any checkpoint that writes a save (e.g. travel to the
   Dock `fv-11`, resolve the cache, press MOVE ON).
2. Reload the app at `/` (a returning player launching the game).
3. **Observed:** a fully blank white screen. `document.body.innerText.length === 0`;
   `#root` contains only empty wrapper `<div>`s; 0 buttons, 0 images; no console
   errors and nothing at `warn`/`error` in `__AXM_LOG__`. It never recovers.

**Control (proves it is save-dependent):** `localStorage.removeItem('@axiomancer/save:v1')`
then reload `/` → the title screen renders normally (EMBARK present). Put a save
back → blank again.

**Root cause:** for a returning player `onboarding.showTitleScreen` is false, so
`app/index.tsx:51` falls through to `<Redirect href={'/' + activeTab} />`
(`activeTab` is `'exploration'`). `Redirect` (`lib/platform/router.ts:201-206`)
calls `dispatchTo` **once** from a `useEffect` keyed only on `[href]`, and
`dispatchTo` begins:

```ts
function dispatchTo(href, mode) {
  if (!navigationRef.isReady()) return;   // router.ts:141 — silent early-out
  ...
  if (!entry) { if (__DEV__) console.warn(...); return; }  // :143-146 — silent in production
```

If the navigation container is not ready at that moment the redirect is
**dropped and never retried** (the effect cannot re-run — `href` never changes,
and readiness is not a dependency), so the index route just keeps rendering
`null`. Both failure exits are silent in a production build because the only
diagnostic is `__DEV__`-gated — which is exactly why this reaches a player as a
blank screen with no error anywhere.

Ruled out: `needsBundleSelection`'s `return null` branch (`app/index.tsx:47-49`)
requires `titleScreenDismissed === true`, which is component state that starts
`false` on a cold page load — and this repro is a cold load with no click. Also
ruled out: a missing route entry — `exploration` is present in `ROUTE_TABLE`
(`router.ts:71`).

**Suggested fix:** make the redirect resilient rather than fire-and-forget —
either have `Redirect` retry once navigation reports ready (subscribe to the
container's ready/state event, or gate the whole tree on an `onReady` flag in
`app/_layout.tsx`), and/or have `dispatchTo` queue the last requested href and
replay it on ready. Separately, the two silent `return`s should log at `warn`
through the app logger (not `__DEV__` console) so this class of failure is
visible in the crash tail next time.

**Note:** this is not web-only reasoning — `app/index.tsx` and the router seam
are shared, so the same dropped-redirect race exists on native, where it would
present as a blank launch screen.

---

## BUG-03 — Progress outside "checkpoints" is never saved, and nothing flushes on exit

- **Severity:** high — silent loss of real player progress
- **Area:** `state/actions.ts`, `state/persistence/asyncStorageAdapter.ts`
- **Status:** confirmed in play + root-caused

**Repro (100%, from a new game):**
1. EMBARK, skip the cutscene.
2. Travel `fv-1` → `fv-2` (Crossing).
3. Talk to Old Marrow, choose "WHAT NEEDS DOING?" then accept — the quest
   *The King of Revenge* appears under ERRANDS in THE LEDGER.
4. Wait (I sampled the save every 2s for 16s on the exploration screen).
5. Reload.

**Observed:** the save still reads `currentNode: "fv-1"`, `quests.active: []`.
After the reload the run is back at `fv-1` and the Ledger has no errand — the
travel **and the game's opening quest** are gone.

**Root cause:** saves on mobile are explicit (Spec 09), and the checkpoints are
combat outcome, rest, cache, hazard, blacksmith, labyrinth and *map crossing*
(`state/actions.ts:1597`, which fires only for `result.event.kind === 'travel'`,
i.e. crossing to another map — not ordinary node movement). Accepting a quest
and walking between nodes are not checkpoints, so nothing writes.

**Compounding:** there is **no save-on-exit at all.** `flush()` exists on the
adapter (`asyncStorageAdapter.ts:125`) but nothing in `app/`, `state/`, `lib/`
or `components/` ever calls it, and there is no `AppState`, `beforeunload` or
`pagehide` handler anywhere in the app. Combined with the writer's 500ms
debounce (`DEFAULT_DEBOUNCE_MS`, `:17`), even a legitimate checkpoint can be
lost if the player closes the app within half a second of it.

**Verified working, for contrast:** the cache checkpoint does persist — after
MOVE ON the save correctly held `currentNode: "fv-11"`, `consumedNodes:
["fv-1","fv-2","fv-11"]`, `currency: 12`. So the write path and the load path
are both fine; the bug is purely *when* saves are taken.

**Suggested fix:** treat quest state changes and node movement as checkpoints
(or reinstate a debounced autosave for them), and flush on app background /
page hide (`AppState` `change` → `background`, plus `pagehide`/`visibilitychange`
on web) so the debounce window cannot eat a checkpoint.

---

## BUG-04 — The map camera fits once and never re-frames, hiding available paths off-screen

- **Severity:** medium — the core "where do I go next" choice is partly invisible
- **Area:** `components/exploration/MapCanvas.tsx`
- **Status:** confirmed in play + root-caused

**Repro (100%, 414x896 phone viewport):**
1. New game → skip cutscene → travel `fv-1` → `fv-2` (Crossing), leave the dialogue.
2. Look at the map. You are offered three onward paths: Chapel (`fv-16`, the
   node your accepted quest points at), Hanged Wood (`fv-3`), Dock (`fv-11`).

**Observed:** only Hanged Wood is on screen. Measured bounding boxes at the
default camera: `fv-16` at `x = -49` (entirely off the left edge) and `fv-11` at
`x = 419` (entirely off the right edge of a 414px viewport). 19 of 25 nodes are
off-screen. Nothing on screen indicates that choices exist beyond the edges.
They are recoverable — dragging the canvas brings them in (verified: Chapel
moved `-49` → `86`) — but nothing tells a new player to drag for their *options*.

**Root cause:** `MapCanvas.tsx:151`

```ts
if (initialized.current || !viewport || nodes.length === 0) return;
const fit = computeFocusTransform(nodes, viewport);   // :155
...
initialized.current = true;                            // :162
```

`computeFocusTransform` (`:55-80`) is written to do exactly the right thing —
its own comment says the choosable nodes should "fit whole into frame (zoomed
out if a wide branch demands it)" — but the `initialized.current` guard means it
runs **once, on first mount**, and never again as the player moves and the
available set changes. (Tab switches do not re-run it either: the bottom-tab
navigator keeps the screen mounted.)

**The fit would work if it ran.** Node spacing is 234px on screen at `scale = 1`
(nodes render 44px wide), so the three focus nodes span ~468px. Fitting that plus
`FIT_PADDING * 2` (`:50`, 40px each side) into 414px needs `scale ≈ 0.71`, which
is comfortably above `MIN_SCALE = 0.6` (`:39`). So the camera is capable of
framing all three and simply never recomputes.

**Suggested fix:** re-run the fit whenever the focus set changes — e.g. key the
effect on the ids of `available` + `current` nodes instead of latching
`initialized.current` — while still preserving a deliberate manual pan/zoom
(only auto-refit when the player has not manually moved the camera since the
last node change). A "recenter" affordance and/or an edge indicator for
off-screen available nodes would also cover the manual-pan case.

---

## Ruled out during the hunt (recorded so they are not re-investigated)

- **Tapping a sealed node looked like it did nothing.** It does not — the
  `This path is sealed.` toast fires correctly
  (`app/(tabs)/exploration/index.tsx:186`, rendered `:304`) and auto-dismisses
  after 2000ms (`:58-63`). My first check simply ran after it had gone.
- **`setPointerCapture` console errors.** Artifacts of synthetic
  `PointerEvent`s dispatched by the test harness (stack frames show
  `UtilityScript.evaluate`); a real pointer carries a valid `pointerId`.
- **"⚠ previous session crashed" banner looked like a false alarm.** It is
  correct — it was faithfully reporting the `setPointerCapture` error my own
  synthetic events caused in the previous session. The crash-tail feature works.
- **`persistence/preload {"found":false}` looked like a broken load path.** It
  was the genuine first-ever boot in a clean browser profile. With a save
  present the very next boot logged `{"found":true,"schemaVersion":3}` and
  restored the RNG state, so loading works.
- **Tapping "TRAVEL HERE" on a node is not lost** — movement applies correctly
  in-session; it is only the *persistence* of it that is missing (BUG-03).
- **A dead enemy (0/46 VITAE) left the board up.** Not a hang — the SPOILS
  reward panel and then a summary panel (`combat-summary-close`, "Continue")
  render over the board; pressing Continue closes the encounter and returns to
  exploration correctly.
- **The card-detail and reward-preview overlays "blocking" the board.** Both are
  deliberate modals and both carry a dismiss (`combat-card-detail-close`,
  `combat-reward-preview-close`) plus, for the preview, a direct
  `combat-reward-preview-select`. Working as designed.
- **Dice occlusion** (a known past bug class the repo's own harness guards with
  `occluderOver`): checked all four tray dice at 414x896 — every one owns its
  own centre point, no board chrome over them.
- **Rest screen's unaffordable option.** `THE CUT` is correctly `disabled`,
  `aria-disabled="true"`, `pointer-events: none`, and states its reason
  ("the deck is at its floor of 12 cards"). Good implementation.

---

## Surfaces played and found CLEAN (negative evidence)

Worth recording so the next hunt starts somewhere new:

- **Full combat loop, end to end** — encounter → tutorial → board → stage card →
  power with a colour-matched die → APPLY → END PHASE → enemy turn → repeat to
  victory → SPOILS card reward → summary → back to exploration. Played a real
  Grave Larva fight over 4 rounds (46 → 0 VITAE, player 175 → 124). No console
  errors, nothing at `warn`/`error` in `__AXM_LOG__`, no ErrorBoundary, correct
  damage/poison/bleed maths, correct stance and telegraph behaviour, reward card
  persisted to the save.
- **END PHASE specifically** — the action behind the owner's reported native
  crash ("the app closes when I end my turn") is clean on web across every
  round. Consistent with `lib/monitoring.ts`'s note that the crash is a NATIVE
  process death; web cannot reproduce it and Sentry does not watch web.
- Cutscene playback and SKIP, dialogue trees and choice application, quest
  acceptance into THE LEDGER, cache/treasure resolution with loot, rest
  resolution, tab navigation, and the crash-tail reporter all behaved correctly.

---

# FIX PLAN

Ordered by player impact per unit of risk. Each item names the file, the change,
and how to prove it.

### P0 — BUG-02, returning players see a blank screen

The only bug here that makes the game unplayable, and it hits *every* returning
player on web and (by shared code) native.

1. **Make the redirect survive a not-ready router.** In
   `lib/platform/router.ts`, give `dispatchTo` a pending-href slot: when
   `navigationRef.isReady()` is false, remember the request and replay it from
   the container's `onReady`/state listener instead of dropping it. `Redirect`
   (`:201`) then needs no change.
   *Alternative, if a smaller blast radius is preferred:* have `Redirect`
   subscribe to readiness and re-dispatch, leaving `dispatchTo` untouched.
2. **Stop failing silently.** Both early-outs in `dispatchTo` (`:141` not-ready,
   `:143-146` unknown route) should log through the app logger at `warn` — the
   current `__DEV__`-only `console.warn` is why this reached a player with no
   diagnostic anywhere. This is what would have made it a one-minute diagnosis.
3. **Regression test.** A cold boot at `/` with a pre-seeded save must land on
   `/exploration`. This is cheap to add to the existing harness family
   (`scripts/fixture-e2e.mjs` already does cold boots with fixtures) — assert
   non-empty body text and the exploration map after boot.

*Workaround for anyone blocked today:* deep-linking straight to `/exploration`
loads and resumes the save correctly.

### P1 — BUG-03, progress loss outside checkpoints

1. **Add the two missing checkpoints.** Save after a quest state change and
   after node movement — the same reasoning the code already applies to map
   crossing at `state/actions.ts:1597` ("a crossing lost to an app close would
   strand the run") applies at least as strongly to the game's opening quest.
2. **Flush on the way out.** Nothing calls `adapter.flush()`
   (`state/persistence/asyncStorageAdapter.ts:125`) and there is no `AppState` /
   `pagehide` / `visibilitychange` handler anywhere. Add one that flushes, so
   the writer's 500ms debounce (`:17`) cannot eat a checkpoint the player just
   earned.
3. **Test.** Extend the persistence tests: mutate → background → assert the slot
   holds the mutation.

### P2 — BUG-04, the map never re-frames

Re-run `computeFocusTransform` when the focus set changes rather than latching
`initialized.current` (`components/exploration/MapCanvas.tsx:151`), while not
stomping a deliberate manual pan/zoom. The maths already works — a 0.71 scale
would frame all three choices and the floor is 0.6. Consider also an edge
indicator for off-screen available nodes, which fixes the manual-pan case too.

### P3 — BUG-01, the legend counter

Count `kind === 'locked'` from the same `nodes` array the pips are drawn from
(`state/presenters/exploration.engine.ts:482`) instead of
`world.currentMap.lockedNodes`. Decide separately whether a visited-but-not-
completed node (the start node) should read TRODDEN rather than SEALED.

### Cross-cutting recommendation — the Sentry blind spot

Every bug above was found on web, and **none of them could ever appear in
Sentry**: `lib/monitoring.ts:59` returns early for `Platform.OS === 'web'`, so
the deployed web build reports nothing. That is a deliberate quota decision, but
it means the web build — the one with a public URL — has no crash telemetry at
all, and BUG-02 is exactly the kind of silent, no-error failure that telemetry
would never have caught anyway (nothing throws; a render just returns `null`).

Two cheap improvements, independent of that decision:
1. Route the two silent router failures (P0 item 2) into the existing
   `__AXM_LOG__` crash tail, which the app already surfaces to the player as
   "previous session crashed — view / copy report". That reporter works well.
2. If web telemetry is ever wanted, enable Sentry for web behind the existing
   build-profile gate so only real deploys report, not CI/harness runs — which
   was the original reason web was excluded.
