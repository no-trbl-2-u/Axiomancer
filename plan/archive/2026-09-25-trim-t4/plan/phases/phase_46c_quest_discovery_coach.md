# Phase 46c — Quest discovery coach beat

> Agent-facing brief. REDIRECTED per 46a's ruling (D6,
> `plan/phases/phase_46a_early_game_rethink.md`): Phase 61 retires the
> Quest Board minigame this row originally targeted, so a Quest Board
> tutorial is moot. This brief instead closes the verification Phase 46c
> was repointed to: does Phase 53c's shipped quest-giver placement
> actually get a new player to notice they hold a quest? It does not —
> two small, additive UI fixes close the gap. Mobile only, no engine
> changes beyond one new notification field. Deps: 46a, 53c.

## Why this exists

Phase 53c (shipped `44fab3ae`) put Old Marrow on `fv-2`, the fishing
village's third 100%-coverage node — every legal route now reaches him,
so the placement half of "can a player ever find the quest" is solved
and this brief does not touch it. Phase 61 (not yet shipped, but its
ruling is locked in `01_build_plan.md`) is explicit about what that
placement now has to carry alone: *"with no quest node on any map, its
quest-giver becomes the only way a player ever learns a quest exists."*

Reachability is not the same as noticing. Walking the actual accept
path:

1. `axiomancer-mechanics/src/World/Continents/Coastal-Village/maps.ts:77`
   — picking "Consider it done. (Accept the quest.)" fires
   `effect: { startQuest: 'starting-quest' }`. The `accepted` node's
   flavor line (`maps.ts:104`, *"Old Marrow nods slowly. 'Mind the tide.
   The reef takes the careless.'"*) never says the word "quest."
2. `axiomancer-mobile/app/dialogue/index.tsx` — the screen every
   interaction node routes to (Phase 137) — renders `ReplyRow` with only
   `choice.label` and `choice.description` (lines 30-68). The only
   in-the-moment feedback is a 500ms `✓` flash (`DIALOGUE_CONFIRM_TTL_MS`,
   lines 28, 88-115) identical to what fires for *every* dialogue pick,
   including "Leave him be."
3. `state/presenters/event.engine.ts:755-772` (`extractDialogueConsequences`)
   already computes a `{ kind: 'quest-start', label: e.startQuest }`
   consequence for exactly this choice, and `app/event/index.tsx:47-77`
   already has a renderer for it (`consequenceLabel` /
   `ConsequenceChips`) — but `/event` is the **dead fallback route**
   (its own header comment: *"In production NOTHING routes here
   anymore... interaction → /dialogue"*). The one place in the codebase
   that would say "quest: starting-quest" out loud is wired to a screen
   real players never reach for interactions.
4. Nothing points at where the quest actually lives. The Memoir tab
   (`app/(tabs)/memoir/index.tsx`) renders active quests correctly
   (name, description, ✓/○ objectives, `selectMemoirViewModel`) — it is
   not missing or buried, it is simply never announced. `ToastHost`
   only reacts to `inventory:changed`
   (`state/presenters/inventory-feedback.engine.ts`). The tab-badge
   system already has a `memoir` slot in its return type
   (`selectTabBadges`, `navigation.engine.ts:110`) that is hardcoded to
   `null` — the extension point exists, unused.

So: placement is solved, the quest log is solved, and the one missing
piece is the moment in between — accepting is silent, and there is no
cue to go look. That is a real, narrow gap, and the brief scopes exactly
two fixes to close it. **No rebuild of Quest Board content, no touching
53c's topology, no new screens.**

## Inputs

1. `axiomancer-mobile/app/dialogue/index.tsx` — `ReplyRow`, the screen
   every interaction routes to.
2. `axiomancer-mobile/app/event/index.tsx:44-77` — `consequenceLabel` +
   `ConsequenceChips`, the orphaned renderer to port/share, not
   duplicate.
3. `axiomancer-mobile/state/presenters/event.engine.ts` — `EventChoice`,
   `EventConsequence`, `extractDialogueConsequences` (already correct,
   untouched).
4. `axiomancer-mobile/state/store.ts:270-390` — `DEFAULT_NOTIFICATIONS_SLICE`,
   `MobileNotificationsSlice`, and the `emitter.on('character:levelup', ...)`
   handler (lines 377-385) — the exact pattern to mirror for quests.
5. `axiomancer-mobile/state/presenters/navigation.engine.ts` —
   `TabBadge`, `EVENT_BADGE`, `selectTabBadges` — the `memoir` slot.
6. `axiomancer-mobile/app/(tabs)/character/index.tsx:41-48` — the
   mount-time acknowledge effect, the exact pattern to mirror in Memoir.
7. `axiomancer-mechanics/src/World/dialogue.runtime.ts:63-73` —
   confirms `effects.startedQuest` exists on the engine side but is
   dropped before the event layer (`game.reducer.ts` returns only
   `.gameState`); not needed for this brief since the mobile side
   already has `choice.effect?.startQuest` statically, pre-dispatch.

## Scope

**Fix 1 — Reply-time consequence preview on `/dialogue`.** Extract
`consequenceLabel` out of `app/event/index.tsx` into a shared, pure
module: `axiomancer-mobile/state/presenters/consequence-copy.ts`,
exporting `consequenceLabel(c: EventConsequence): string` verbatim (same
switch, same copy — `"quest: <label>"` for `quest-start`, etc.). Both
`app/event/index.tsx` and `app/dialogue/index.tsx` import from there;
`event/index.tsx`'s local definition is deleted, not duplicated.

In `app/dialogue/index.tsx`'s `ReplyRow`, render a `consequences` chip
row under `choice.description` — reuse `choice.consequences` (already on
`EventChoice`, already populated by `extractDialogueConsequences`, zero
engine changes needed). Match `/event`'s `ConsequenceChips` behavior:
show up to 3, `+N more` overflow, hidden entirely when
`consequences.length === 0` (the common case — most dialogue replies
carry none, so most rows are unaffected). This means a player sees
`quest: starting-quest` printed under "Consider it done." **before**
tapping it, not just after — the same preview `/event`'s dead code
already implemented, now live on the route players actually use.

**Fix 2 — First-quest cue on the Memoir tab.** Add
`questAcknowledged: boolean` to `MobileNotificationsSlice`
(`state/store.ts`), defaulting `true` in
`DEFAULT_NOTIFICATIONS_SLICE` (mirrors `levelUpAcknowledged` exactly —
a fresh store has no pending quest to acknowledge).

Add a second `emitter.on('dialogue:applied', ...)` handler beside the
existing `character:levelup` one (`state/store.ts:377-385`). Read
`(event.payload as { action?: { payload?: { choice?: { effect?: {
startQuest?: unknown } } } } })?.action?.payload?.choice?.effect?.startQuest`
— if a string is present, flip `questAcknowledged: false`, preserving
other notification fields. (This fires once per accept; it does not
need to distinguish "already had this quest" from "newly granted" — the
badge existing when a quest-granting choice fires is the intended
signal even on a repeat visit to the same dialogue node, and the
`discoverQuest`/`startQuest` dedup already prevents duplicate quest-log
entries regardless.)

In `app/(tabs)/memoir/index.tsx`, add the mount-time acknowledge effect,
copied from `app/(tabs)/character/index.tsx:41-48`: on mount, set
`notifications.questAcknowledged: true`, preserving other fields. Needs
`useGameStore` added to the screen's imports (currently only
`useGameState`).

In `state/presenters/navigation.engine.ts`, extend `selectTabBadges`:
read `state.notifications?.questAcknowledged ?? true`; when `false`,
`memoir` returns `EVENT_BADGE` (reuse the existing `{ text: '!', kind:
'event' }` constant — no new `TabBadge` kind, no new color) instead of
`null`. Precedence: this is independent of the existing
character-tab-only `hasEvent`/`levelupReady` branch — do not fold it
into the early `if (!hasEvent && !levelupReady) return EMPTY_BADGES`
short-circuit, since a quest can be pending with no active event and no
level-up ready. Add `questPending` as its own condition in that guard
(`if (!hasEvent && !levelupReady && questAcknowledged) return
EMPTY_BADGES`) so the all-quiet fast path still short-circuits when
there is truly nothing to flag.

## Decisions made upfront — DO NOT ASK

- **Two fixes, not three.** A toast ("New quest: ...") was considered
  and dropped — the reply-time consequence preview already gives
  in-the-moment feedback, and the Memoir badge already gives a
  persistent "go look" cue. Stacking a third transient mechanism for
  one event is more chrome than the gap needs; "small" governs.
- **Badge reuses `EVENT_BADGE`'s shape (`kind: 'event'`), not a new
  `'quest'` kind.** A third badge kind means a third color mapping in
  `TabBadge`'s consumer for one narrow case; the existing blood-colored
  `!` already reads as "something needs your attention" and the two
  never collide (event badges live on `character`, this one lives on
  `memoir`).
- **`questAcknowledged` flips false on ANY `dialogue:applied` event
  whose choice carries `effect.startQuest`, not just the first-ever
  quest.** Simpler than tracking "is this actually new," matches the
  `levelUpAcknowledged` precedent (which re-arms on every level-up, not
  just the first), and the failure mode of over-firing (badge appears
  again on a repeat/edge-case dialogue path) is harmless — worst case
  the player taps Memoir and finds nothing new, same cost as the
  existing levelup badge's own re-arm behavior.
- **`consequenceLabel` moves to a shared module; `/event`'s copy is
  deleted, not forked.** Two copies of the same switch statement is
  exactly the drift `/event`'s comment already warns about (it is dead
  code kept alive only as a fallback shell) — one wrong edit away from
  the two screens disagreeing on what `quest-start` means.
- **No change to `dialogue.runtime.ts` or the event payload shape.**
  `effects.startedQuest` is real but redundant for this brief's needs —
  the mobile side already has the same information statically on
  `choice.effect?.startQuest`, pre-dispatch, via the existing
  `EventChoice.consequences` pipeline. Wiring the engine's `effects`
  object through to the event payload is a larger, separate change with
  its own call sites (`completedQuest`, `progressedObjective`, etc.) and
  is out of scope here.
- **Not gating this on 53c's node placement being re-verified.** 53c's
  coverage-floor test (`fv-1`/`fv-2`/`fv-6` at 100%) already proves
  reachability; this brief takes that as settled and only touches the
  accept-and-notice layer above it.

## Prove (DoD)

- `consequence-copy.engine.test.ts` (new, colocated under
  `state/presenters/__tests__/`): `consequenceLabel` covers every
  `ConsequenceKind`, including the `quest-start` case producing
  `"quest: starting-quest"`.
- A store-level e2e test (new, under `state/e2e/`, sibling to
  `navigation.engine.test.ts`): dispatching `APPLY_DIALOGUE` with a
  choice whose `effect.startQuest` is set flips
  `notifications.questAcknowledged` to `false`; `selectTabBadges` then
  returns the memoir badge; a second dispatch that mirrors the
  character-screen mount effect (a direct `setState` on
  `questAcknowledged: true`) clears it again.
- `selectTabBadges` unit coverage (extend
  `navigation.engine`'s existing test file or add a case): the
  all-quiet short-circuit (`EMPTY_BADGES`) still returns when
  `questAcknowledged` is `true` and no event/levelup is pending — the
  fast path is not weakened by the new condition.
- Manual trace (documented in commit body, not a new automated
  end-to-end harness — mobile's verify gate is lint + typecheck + jest,
  no Playwright surface for this app): fresh state → move to `fv-2` →
  accept Old Marrow's quest → `/dialogue`'s reply row showed `quest:
  starting-quest` before the tap → Memoir tab shows the `!` badge →
  opening Memoir clears it and the quest is listed under Errands.
- `npm run verify --workspace axiomancer-mobile` green (lint,
  typecheck, jest). No mechanics-workspace changes, so no mechanics
  verify run needed — confirm with `git diff --stat` before commit that
  nothing under `axiomancer-mechanics/` changed.

## Follow-ups

- Quest display names are currently their raw ids (`starting-quest`) —
  Memoir already renders it this way (`memoir.engine.ts:547`,
  `q.name`), and this brief's new chip copy inherits the same raw id
  for consistency rather than inventing a title field this phase would
  have to author content for. A `title` field on `Quest` (distinct from
  the id-shaped `name`) is a content/schema phase of its own, not this
  one.
- If a future phase adds more quest-granting dialogue nodes beyond
  `starting-quest`, the badge/preview mechanism here already generalizes
  — no further wiring needed per quest.
