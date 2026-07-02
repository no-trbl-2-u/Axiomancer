# Phase 70 — Aftermath modals (Victory · Friendship · Defeat · Error)

> User-prompted 2026-05-22 from a fresh Claude Design handoff bundle
> stashed at `design/handoff-2026-05-22/`. The bundle ships
> `screens/aftermath-modal.jsx` (889 lines) — four non-dismissible
> outcome screens (Victory, Friendship, Defeat, Error) plus the
> in-modal aftermath panel that replaces the existing
> `<AftermathBanner>` toast on victory / parley.
>
> Per chat4 (the user's own design conversation): an encounter is
> **encapsulated** in the seal that opens it; combat does not leave
> the seal until resolved, and aftermath now lives **inside** the
> same modal panel as the prelude + combat phases. Only the final
> `✠ CARRY ON` (victory), `❦ PART AS FRIENDS` (parley),
> `✠ BEGIN AGAIN` (defeat), or `✠ TRY AGAIN` (error) button
> releases it.
>
> Promoted to **top of the build plan** per user instruction
> 2026-05-22 ("Top priority is getting all these new designs in
> place"). Decomposed into four ticks so each modal can ship on its
> own commit and harness pass.

**Source bundle:** `design/handoff-2026-05-22/project/screens/aftermath-modal.jsx`
(canonical) + `design/handoff-2026-05-22/project/prototype.jsx`
`PtAftermathInModal` (lines 714-780) for the in-encounter-modal
embed pattern + `design/aftermath-modals-prompt.txt` for the
original design brief that produced it.

---

## 1. Why

The current victory / parley path mounts a thin
`<AftermathBanner>` toast on the exploration screen
(`components/AftermathBanner.tsx`, ~135 lines) that auto-dismisses
after 2.5s. Defeat and flee paths surface **nothing** —
`selectAftermathCopy` returns `null` for both
(`state/combat-mode.tsx:57-59`), so the player gets no closure
on death. The error path falls back to
`components/ErrorBoundary.tsx`, which is functional but breaks the
gothic register.

The handoff bundle's new design ships:

1. **`CombatVictoryModal`** — final-blow flavor phrase, torn-edge
   panel with sparing splatter, three-column reward strip
   (XP · vitae/sigils · loot count), a loot list with rarity
   hairlines, single `✠ CARRY ON` button.
2. **`CombatFriendshipModal`** — pixel-art emblem (the **only**
   pixel art in the app — a diegetic carve-out per chat4 rationale),
   pact phrase, optional journal-entry card, single
   `❦ PART AS FRIENDS` button.
3. **`CombatDefeatModal`** — spent-wick hairline above the title,
   blood seep clipped to a torn edge at the bottom, run-summary
   ledger (rounds endured · encounters survived · deepest node),
   primary `✠ BEGIN AGAIN` + ghost `let the page close`.
4. **`ErrorScreen`** — in-world replacement for
   `<ErrorBoundary>`'s fallback. Heavy diagonal hatch,
   `THE BINDING TORE` gothic title, torn-edge inset panel with
   the technical stack + ✎ COPY button, primary `✠ TRY AGAIN` +
   ghost `return to the hearth`.

All four are **non-dismissible by tap-outside** and each owns its
own explicit dismiss control.

## 2. Scope (four ticks)

Each tick lands as its own commit. Tests follow the project's
hermetic-test contract (presenter + smoke render + interaction
pin).

### Tick A — `CombatVictoryModal` + in-modal mount

- New `components/event/aftermath/CombatVictoryPanel.tsx`
  rendering the design's #1 layout (eyebrow → title/epithet →
  final-blow torn-edge panel → reward strip → loot list →
  `CARRY ON`). Re-uses primitives (`TornPanel`, `Splatter`,
  `tornEdge`, `SectionLabel`, `ActionIcon`) — no new SVG asset
  work in this tick.
- New presenter `state/presenters/aftermath.engine.ts` exporting
  `selectAftermathViewModel(state, outcome)` returning a
  discriminated-union VM with `kind: 'victory' | 'friendship'
  | 'defeat' | 'flee'` and the per-kind data shape (enemy name /
  final-blow / rewards / etc.). Tick A populates only the
  `'victory'` branch; later ticks fill the others.
- Wire `<EncounterModalOverlay>` to render the panel **inside**
  the existing seal when `mode === 'aftermath'`, swapping
  `<CombatPanel>` out. The mode transition is driven by a new
  `combat-mode` action (`transitionToAftermath(outcome)`) called
  from the combat exit flow; the existing `lastOutcome` shim
  stays for legacy callers but the modal reads from the new
  selector.
- Retire the inline `<AftermathBanner>` mount on
  `app/(tabs)/exploration/index.tsx:408-419` for the victory
  path. (Banner code stays in place until Tick B drains the
  parley branch — then it can be deleted wholesale, plus its
  test file.)
- Hermetic tests:
  - `state/presenters/__tests__/aftermath.engine.test.ts` —
    victory VM shape pin (enemy name / final-blow / rewards
    populated from combat slice + last resolution).
  - `components/event/aftermath/__tests__/CombatVictoryPanel.test.tsx` —
    smoke render + the loot-empty branch ("no spoils. only quiet."
    flavor line) + `CARRY ON` press handler.
  - Extend
    `components/event/__tests__/EncounterModalOverlay.test.tsx` —
    `mode === 'aftermath'` swaps panel content, seal chrome stays
    mounted (Phase 71 will refresh that chrome).

### Tick B — `CombatFriendshipModal`

- New `components/event/aftermath/CombatFriendshipPanel.tsx`
  rendering the design's #2 layout. The pixel emblem is a
  16×16 SVG `<Rect>` grid (per the design's `PIXEL_HEART`
  constant) — implemented in
  `components/event/aftermath/PixelEmblem.tsx`. The emblem is
  the **only** pixel art in the app; the rationale paragraph
  in the chat4 transcript should land verbatim as the
  component-level doc-block so future contributors don't
  "tidy up" the carve-out.
- Extend `selectAftermathViewModel` with the `'friendship'`
  branch — pact phrase + optional `journalEntry` (book name,
  entry title, preview) populated from engine state. If the
  parley fight doesn't unlock a journal entry, the field is
  null and the panel collapses the section (design's `null
  journalEntry` branch).
- Retire `<AftermathBanner>` for the parley path. Delete the
  banner + its test file once both branches (victory + parley)
  are on the new panels. `selectAftermathCopy` can be deleted
  in the same commit; the legacy `lastOutcome` shim is still
  used by combat exit, but the *display* selector goes away.
- Hermetic tests:
  - Presenter pin for the friendship VM (with + without
    `journalEntry`).
  - Panel smoke render covering the emblem rect-count,
    journal-entry collapse, and `PART AS FRIENDS` press
    handler.
  - `<PixelEmblem>` standalone render test (it's the lone
    pixel-art primitive; pin its rect layout against
    regressions).

### Tick C — `CombatDefeatModal`

- New `components/event/aftermath/CombatDefeatPanel.tsx` for
  the design's #3 layout. Spent-wick hairline + ember at the
  top, gothic title block, italic fell-to line, mono damage
  ledger, chronicle paragraph with `axm-dropcap`, run-summary
  ledger (rounds endured / encounters survived / deepest
  node), bottom blood seep clipped to a torn edge, primary
  `✠ BEGIN AGAIN` + ghost `let the page close`.
- Extend `selectAftermathViewModel` with the `'defeat'`
  branch:
  - `killer` data (name, epithet, final skill, damage) lifted
    from the engine's last-resolution slice.
  - `runSummary` data — `rounds`, `encountersSurvived`,
    `deepestNode`. Two of those (encounters survived, deepest
    node) aren't surfaced by the engine yet; this tick adds a
    presenter-side counter on the mobile side
    (`state/run-stats.ts`) and snapshots it on death. Engine
    PR for promoting it lives in `PHASE_CANDIDATES.md` as a
    follow-up.
  - Generated `causePhrase` — pick one of 3 placeholder
    chronicle variants per outcome class (brutal / quiet /
    ironic), keyed off the killer's archetype. Voice register
    matches the bundle.
- Wire `BEGIN AGAIN` to the existing run-reset action
  (currently surfaced only through the dev menu); wire
  `let the page close` to a quiet "return to home" exit
  (clears combat state without restarting). Both are
  potentially destructive — Tick C's brief includes
  confirmation copy and an opt-in flag if the user wants a
  follow-up "are you sure?" pass.
- Hermetic tests:
  - Presenter pin for the defeat VM (with realistic killer +
    run-summary data).
  - Panel smoke render covering both action handlers + the
    chronicle-paragraph dropcap.
  - Integration test: combat outcome `'defeat'` mounts the
    panel inside the encounter modal (the existing
    EncounterModalOverlay path).

### Tick D — `ErrorScreen` in-world replacement

- New `components/aftermath/ErrorScreenPanel.tsx` for the
  design's #4 layout. Heavy diagonal hatch background,
  `THE BINDING TORE` gothic title, torn-edge inset panel with
  the technical stack + ✎ COPY button (flashes sulfur on
  press per the design's `copyPressed` state), primary
  `✠ TRY AGAIN` + ghost `return to the hearth`, bottom
  consolation eyebrow line.
- Refactor `components/ErrorBoundary.tsx` to render the new
  panel as its fallback. The error code, technical string,
  and hint are sourced from the boundary's `componentDidCatch`
  payload + a small lookup mapping error class → in-world
  code (`E_BOUND_LOOSE`, `E_PAGE_TORN`, etc., 3-4 codes max).
- `onCopy` writes the technical string to the clipboard via
  `expo-clipboard`; `onRetry` resets the boundary;
  `onReturnHome` routes to `(tabs)/exploration`.
- Hermetic tests:
  - Panel smoke render with all three handlers wired + the
    `copyPressed` state pin.
  - Extend `components/__tests__/ErrorBoundary.test.tsx` — the
    fallback render path now hits the new panel rather than
    the legacy fallback markup.

## 3. Ordering / dependencies

- **Tick A → Tick B → Tick C** form a single thread: each tick
  extends the same VM selector + replaces one outcome path.
  Ship in order — splitting them risks half-converted state
  where the banner + panel both render.
- **Tick D is independent** — error path doesn't touch the
  encounter modal. Can ship in parallel with A/B/C if a second
  contributor wants the smallest tick.
- **Phase 71 (encounter-seal chrome refresh) is a sibling**;
  it touches the same files (`EncounterModalOverlay`) but is
  scoped to the chain-bar chrome. Ordering with Phase 70 is
  loose — either can land first. The user's design pass
  intentionally renders the chrome refresh as a separate phase
  so the aftermath ticks can ship without blocking on chrome.

## 4. Acceptance

- All four panels mount in their respective paths.
- `<AftermathBanner>` + `selectAftermathCopy` are deleted (Tick
  B close-out).
- Engine-driven outcome data populates the VM — no placeholder
  literals at the view layer (Hard Rule #8).
- `verify` green; hermetic-test coverage matches the contract
  per `docs/testing.md`.
- The user verifies the four panels by walking a fight to each
  outcome class (victory / parley / defeat / error) using the
  dev-menu seed buttons (`<DebugCombatButton>` +
  `<DebugSeedButton>`).

## 5. Risks

- **Friendship-pixel-art-carve-out** — the only pixel art in
  the app. If a future contributor "normalizes" it the design
  intent is lost; the doc-block + `<PixelEmblem>` standalone
  test should pin it but a comment on the SVG itself helps.
- **Defeat-modal data sourcing** — `encountersSurvived` and
  `deepestNode` aren't engine fields yet. Tick C adds a
  mobile-side counter; promote to engine in a follow-up phase
  if the field's authoritative source needs to be the engine
  (per the project's "engine owns rules, mobile owns
  presentation" boundary).
- **ErrorBoundary integration** — replacing the fallback is
  low-risk (existing tests cover it), but the in-world tone
  shift means the screenshot in `docs/testing.md` (if any)
  needs refreshing.

## 6. Sub-tick log

| Tick | Status | Commit | Notes |
|------|--------|--------|-------|
| A    | `[x]`  | `05d85e7` | Victory panel + presenter + in-modal mount. 38 new tests across 3 suites (presenter / panel / combat-mode); modal overlay test extended for combat→aftermath swap. 1098/1098 verify green. AftermathBanner still mounts for parley until Tick B retires it. |
| B    | `[x]`  | `8baf37a` | Friendship panel + PixelEmblem (the lone carve-out, with invariant-fence tests) + parley presenter branch. AftermathBanner + selectAftermathCopy retired (both display paths now live in the modal). 36 new tests; 4 retired with the banner. 1112/1112 verify green. Journal-entry field exposed in type but null in current snapshots; engine integration deferred to a follow-up. |
| C    | `[x]`  | `a6b1665` | Defeat panel + mobile-side `encountersFaced` / `deepestNodeId` counters on combat-mode + BEGIN AGAIN (full-heal + reset run-stats + dismiss) / `let the page close` (dismiss only). 28 new tests; 1140/1140 verify green. Engine-side respawn-with-fresh-seed deferred; engine doesn't have run-loop semantics yet. |
| D    | `[x]`  | `bd37594` | In-world `<ErrorBoundary>` fallback — gothic `THE BINDING TORE` title with blood drop-shadow, in-world error code (`deriveErrorCode` maps to 4 codes), torn-edge inset panel + UI-only `✎ COPY` pressed-state toggle, scribe-note hint, ✠ TRY AGAIN + return-to-hearth ghost, consolation line. Diagnostics (STATE SNAPSHOT + BUILD CONTEXT) preserved below. Independent of the encounter modal. 9 new tests on the boundary suite; 1147/1147 verify green. Clipboard write deferred (`expo-clipboard` dep not added per design "no need to wire" note). |

**Phase 70 closed:** all four ticks shipped 2026-05-22. The aftermath modal series is complete — Victory (Tick A), Friendship (Tick B), Defeat (Tick C), Error (Tick D). 111 new tests added across the four ticks (38 + 36 + 28 + 9); legacy `<AftermathBanner>` and `selectAftermathCopy` retired in Tick B; previously-silent defeat path now has a real game-over screen (Tick C); ErrorBoundary fallback now in-world (Tick D). Verify gate stayed green at every tick.
