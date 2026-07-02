# Phase 78 — Codex / journal-entry consumer (friendship panel)

> Promoted via /oversight 2026-05-23 (36th call) from
> `PHASE_CANDIDATES.md` `[score 4.0]` row. Engine 0.11.0
> Phase 73 [ENGINE LANDED] surfaced
> `CombatEndReport.friendshipReward.codexEntryUnlocked`
> (id + title) when a friendship outcome unlocks a new codex
> entry. This phase wires the long-dormant "A NEW ENTRY"
> card on `<CombatFriendshipPanel>` to consume it.

## 1. Why

`<CombatFriendshipPanel>` renders a journal-entry card under
the reward strip when `vm.journalEntry !== null`. The
presenter has surfaced this field since Phase 70 Tick B, but
the parley snapshot in `app/(tabs)/combat.tsx` has always
passed `journalEntry: null` — the engine didn't yet surface
per-foe codex unlocks. Engine 0.11.0 added the
`codexEntryUnlocked: { id, title }` field on the
`CombatEndReport.friendshipReward` payload, fired when an
`Enemy.journalEntry` exists AND the player hasn't yet
unlocked it in `state.codex.unlockedEntries`.

The card design (Phase 70 Tick B port) already handles the
`bookName / entryTitle / preview` layout. All that's missing
is wiring the snapshot.

## 2. Scope (single tick)

### A. `actions.endCombat` returns the engine report

`state/actions.ts`:

- Widen `AppActions.endCombat: () => void` →
  `() => CombatEndReport | null`. Return value comes from
  `store.getState().endCombat()` (engine signature is
  `() => CombatEndReport`; we keep the null union for the
  defensive "called outside combat" case that the engine
  itself handles by returning a `'flee'` stub).
- Forward the return value verbatim. The existing mana
  clear stays after the engine call.

### B. Parley snapshot wires the journal entry

`app/(tabs)/combat.tsx` parley branch (~line 295):

- Capture the engine report from `actions.endCombat()`
  BEFORE building the snapshot.
- If `report.friendshipReward?.codexEntryUnlocked` is set
  AND `combat.enemy.journalEntry` is populated, build a
  `journalEntry: { bookName, entryTitle, preview }` and
  attach to the snapshot.
- `bookName` = literal `'CODEX'` (the panel renders it as
  a section eyebrow; the engine `CodexEntry` shape has no
  book/category field today).
- `entryTitle` = `report.friendshipReward.codexEntryUnlocked.title`
  (uppercased).
- `preview` = first sentence of `combat.enemy.journalEntry.body`,
  truncated to ≤120 chars at a word boundary, no trailing
  ellipsis (the panel adds it).
- A small `derivePreview(body)` helper local to combat.tsx
  encapsulates the truncation logic.

### C. Tests

`state/e2e/combat.engine.test.ts` or a focused new file:

- `actions.endCombat()` returns the engine report (smoke
  pin).
- Parley exit with an enemy that has `journalEntry`
  populated → the report carries `codexEntryUnlocked`
  on first friendship; the snapshot embeds the
  journalEntry block.
- Repeat parley with the same enemy (entry already in
  `state.codex.unlockedEntries`) → no
  `codexEntryUnlocked` in the report, no journalEntry on
  the snapshot.

Add `derivePreview` unit tests:
- Single-sentence body returns the sentence (no period).
- Long multi-sentence body returns the first sentence only.
- Body without sentence terminator truncates at word
  boundary ≤120 chars.

## 3. Decisions made upfront — DO NOT ASK

1. **`bookName` is the literal `'CODEX'`.** Engine
   `CodexEntry` has no book/category field. The eyebrow on
   the panel is the universal label.
2. **`entryTitle` is uppercased.** Mirrors the
   gothic-caps convention used for enemy names and panel
   titles throughout the aftermath surfaces.
3. **`preview` is first-sentence + word-boundary truncate
   at 120 chars.** No trailing ellipsis — the panel
   appends `'…'` itself (see `CombatFriendshipPanel.tsx:111`).
4. **`actions.endCombat` returns `CombatEndReport | null`,
   not `CombatEndReport | undefined`.** Null union matches
   the existing `AppActions` style (e.g.
   `resolveCurrentMapEvent` already uses null).
5. **The engine's "already unlocked" guard is the only
   gate.** If the engine omits `codexEntryUnlocked` from
   the report (because the entry is already in
   `codex.unlockedEntries`), the snapshot stays
   `journalEntry: null` and the panel collapses the
   section. No mobile-side dedupe.
6. **Order of operations: snapshot enemy lookup BEFORE
   endCombat.** `combat.enemy.journalEntry` must be read
   from the live combat slice; after `endCombat()` clears
   `state.combat`, the journal entry is no longer
   reachable via the slice. The parley branch already
   reads `combat` from a hook before mutating, so the
   capture is implicit — but we explicitly read
   `combat.enemy.journalEntry` into a local before calling
   `actions.endCombat()` to make the dependency obvious.
7. **No engine bump.** `codexEntryUnlocked` already shipped
   in 0.11.0 on the lockfile.
8. **No `<CombatFriendshipPanel>` changes.** The card
   already renders correctly when `vm.journalEntry !==
   null`; this phase only fills the field.
9. **No combat-modal layout touch.** Honours the 36th
   /oversight call's combat-modal-audit bias.
10. **MEMOIR tab list of unlocked entries is out of scope.**
    The optional Tick B from the build-plan row promotes
    to a separate phase when needed — likely Phase 78b. The
    in-aftermath "A NEW ENTRY" card is sufficient
    surfacing for now.

## 4. Acceptance (DoD)

- `pnpm verify` green.
- `actions.endCombat()` returns the engine report.
- On a first friendship with an enemy that has
  `journalEntry`, the panel's "A NEW ENTRY" card mounts
  with the engine's title + first-sentence preview of
  the entry body.
- On repeat friendships with the same enemy (codex entry
  already unlocked), the card stays hidden — no
  "duplicate unlock" rendering.
- No changes to `<CombatFriendshipPanel>` render code.
- No changes to existing victory / defeat snapshots
  (additive return value only).

## 5. Commit body template

```
feat: codex / journal-entry consumer — phase 78

- actions.endCombat now returns the engine CombatEndReport
  (was void). Wrapper forwards the report verbatim from the
  engine GameStore call; mana-clear side-effect stays.
- Parley snapshot in app/(tabs)/combat.tsx reads
  report.friendshipReward.codexEntryUnlocked + the live
  combat.enemy.journalEntry body to populate the
  AftermathData parley snapshot's journalEntry field.
  <CombatFriendshipPanel> renders the "A NEW ENTRY" card
  unchanged when populated.
- New derivePreview helper truncates the engine body to a
  first-sentence ≤120-char fragment at a word boundary;
  the panel appends the trailing ellipsis itself.
- Engine "already unlocked" guard means the card only
  surfaces on first friendship per enemy; repeat parleys
  with the same foe collapse the section silently.

Decisions:
- bookName is the literal 'CODEX' (engine CodexEntry has
  no book/category field).
- entryTitle is uppercased to match the gothic-caps
  convention across aftermath surfaces.
- No mobile-side dedupe — the engine's
  state.codex.unlockedEntries check is the gate.

Closes #<phase-issue-number>
```

## 6. Follow-ups (out of scope)

- **Tick B — MEMOIR tab list of unlocked entries.** Walk
  `state.codex.unlockedEntries`, look each id up against
  the world's enemies (or a future engine `codexLibrary`),
  render as a memoir section. Wait for the engine to
  expose a `getCodexEntryById` selector before promoting.
- **Engine `bookName` field.** When the writers want
  multiple codices (CODEX, BESTIARY, TRAVELOGUE, etc.),
  promote `bookName` to the engine `CodexEntry` shape and
  drop the mobile literal.
- **Codex-entry unlock toast.** A brief in-encounter
  banner ("A new entry has been recorded in your codex.")
  would surface the unlock without waiting for the
  aftermath panel. Separate phase, separate brief.
