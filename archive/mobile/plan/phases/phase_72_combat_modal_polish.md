# Phase 72 — Combat modal polish (port from design 2026-05-22)

> User-prompted 2026-05-23 via /oversight 33rd call. The user
> reviewed the live combat modal against the Claude Design
> prototype and listed five concrete divergences. This phase
> ports the design's combat-body chrome verbatim into the mobile
> `<CombatPanel>` / `<EnemyPanel>` / `<ResolvePanel>` and
> `selectCombatViewModel` presenter.
>
> Single tick. Promoted to **top of the build plan**.

**Source-of-truth lines in the bundle:**
- `design/handoff-2026-05-22/project/prototype.jsx:692-711` —
  `PtCombatBody` composition (EnemyPanel → RoundStripLive →
  PhaseStackLive → PlayerHUDLive).
- `design/handoff-2026-05-22/project/screens-canonical.jsx:213-243` —
  `EnemyPanel` shape (60×72 woodcut portrait left, info column
  right, stance indicator far right).
- `design/handoff-2026-05-22/project/screens-canonical.jsx:457+` —
  `ResolvePane` with `LET IT FALL ━━━━━ ▸` button.
- `design/handoff-2026-05-22/project/prototype.jsx:444-449` —
  `ResolvePaneLive` confirms label variants: `'LET IT FALL · IT
  IS DONE ▸'` for terminal round; `'LET IT FALL ━━━━━ ▸'`
  otherwise.

---

## 1. Why

The combat panel inside the encounter modal (`<CombatPanel>`
mounted by `<EncounterModalOverlay>` when `mode === 'combat'`)
diverges from the design prototype in five places. User-reported
2026-05-23:

1. **Panel border** — different weight / styling vs design.
2. **Spacing** — design prototype has tighter, more deliberate
   padding/margin.
3. **Phase rows lack visible "sections"** — design renders each
   phase as a clearly-bordered card; mobile renders as a less-
   separated stack.
4. **Resolve button label** — mobile shows `✠ NEXT ROUND`;
   design's preferred phrasing is `LET IT FALL ━━━━━ ▸`
   (with `LET IT FALL · IT IS DONE ▸` on the terminal round).
   User explicitly liked the design's label.
5. **Enemy SVG placement** — mobile positions the SVG at
   `right: -10, bottom: -8` (off-bleed overlay); design places
   the portrait in a 60×72 bordered frame on the LEFT of the
   panel with the info column to its right.

**Not in scope (confirmed with user):**
- Mobile's `PlayerHud` correctly omits the MANA bar; the design
  prototype shows MANA but the engine no longer surfaces it as
  a player-visible single-number mechanic (per the comment in
  `app/(tabs)/combat.tsx:499-505`, Phase 62 dropped it). Mobile
  is the source of truth; do NOT add MANA back.

## 2. Scope (one tick)

Single tick. Touches 3 files in code + 1 in presenter; commit
subject `feat(spec72): combat modal polish — port from design`.

### Code changes

- **`state/presenters/combat.engine.ts:251`** — replace the
  `NEXT_ROUND_LABEL` constant with two labels:
  - `LET_IT_FALL = 'LET IT FALL ━━━━━ ▸'` (non-terminal rounds)
  - `LET_IT_FALL_TERMINAL = 'LET IT FALL · IT IS DONE ▸'`
    (when `phaseRaw === 'ended'`)
  - `DEPART_LABEL` stays as-is for the `'ended'` non-victory path.
  - `nextActionLabel` ternary at line 916 widens to pick between
    the three based on outcome class.

- **`app/(tabs)/combat.tsx::EnemyPanel`** — restructure layout:
  - Portrait moves to a 60×72 bordered frame on the LEFT
    (currently the SVG is `right: -10, bottom: -8` overlay).
  - Info column (name + flavor + StatBar + meta row + effects +
    last-stance) sits to the right of the portrait.
  - The Splatter stays at top-left of the panel as a sparse
    accent.
  - The stance indicator (DifficultyBadge + roundText) moves to
    the far-right of the panel header row, mirroring the design's
    "STANDS" badge placement.

- **`app/(tabs)/combat.tsx::PhaseBottom` / `PhaseStack`** — phase
  rows render as clearly-bordered "section" cards:
  - Each `<PhaseRow>` gets a 1px parchment-or-ash border, panelBg
    fill, ~12px padding. Past/current/future states modulate
    border color (parchment for current, ash for past/future).
  - Sulfur 1px stripe along the top of the current row (mirrors
    the design's `StanceCard picked` highlight).
  - Header strip with the label + bullet + delta carries a hairline
    bottom border separating it from the picker body.

- **`app/(tabs)/combat.tsx::ResolvePanel`** — the next-action
  TouchableOpacity reads from the new `nextActionLabel` (no panel
  changes; the presenter is the source).

- **Modal panel border** — `components/event/EncounterModalOverlay.tsx`
  `panel` style uses `borderColor: sealChrome.accentColor` from
  Phase 71. Check whether width (currently `borderWidth: 1`)
  matches design (which uses `2px`-equivalent insets); if not,
  bump to 2px.

- **Spacing** — audit padding / margin values across the
  `styles` block in `app/(tabs)/combat.tsx` (lines 1087+) and
  align to the design's prototype.jsx PtCombatBody +
  PhaseStackLive numbers. Document the changes in commit body
  so the diff is reviewable.

### Tests

- Extend `state/e2e/combat.engine.test.ts` to pin `nextActionLabel`:
  - In a mid-fight resolving phase (round 1 of 3): `nextActionLabel`
    matches `/LET IT FALL/` and does NOT contain `NEXT ROUND`.
  - In a terminal-round resolving phase (round 3 of 3 victory):
    matches `IT IS DONE`.
- Extend `app/(tabs)/combat.tsx` smoke tests (or
  `components/__tests__/CombatPanel*.test.tsx` if any) for the
  new layout — verify EnemyPanel's portrait View mounts on the
  left, info on the right.
- Visual changes (border weight, spacing, section dividers)
  don't pin in tests — the smoke-render test catches mount,
  the user verifies visuals.

## 3. Ordering / dependencies

- No engine release needed. Pure mobile-side polish.
- No blocking dependencies on the deferred Phase 70 engine asks
  (per-foe narrative prose, run-loop, codex entries).
- Phase 71's seal chrome stays as-is; this phase doesn't touch
  `EncounterModalOverlay` except for the optional border-weight
  bump.

## 4. Acceptance

- The five user-reported divergences resolve.
- `verify` green; no new flake.
- **Playwright walkthrough** (user-requested 2026-05-23 via the
  same /oversight call) — drive the live web build through an
  encounter end-to-end (prelude → combat → aftermath) and
  capture screenshots at each phase. Compare visually against
  `design/handoff-2026-05-23/project/prototype.html`'s
  PtEncounterFlow chrome. The `/playtest` skill at
  `skills/playtest.md` already exists for Playwright-driven
  smoke runs; bias this tick's verification to it. Document the
  comparison in the commit body (screenshot URLs or
  paste-buffer notes).
- User verifies the live combat modal matches the design
  prototype (border / spacing / sections / LET IT FALL button /
  enemy SVG placement).
- Closes the [needs-user-call] AUDIT row filed via /oversight
  33rd call.

## 5. Risks

- **Spacing alignment is hard to pin in code** — the design's
  prototype.jsx uses `padding: '8px 14px 12px'` etc. as inline
  styles; mobile's StyleSheet block has different shape.
  Manual visual review by the user is the only meaningful
  verification.
- **Phase row "section card" look** could collide with the
  existing Phase 38 collapse behavior (past phases collapse to
  one-line summaries). The bordered-card visual + collapse-to-
  one-line should coexist; if they don't, drop the border on
  past rows and keep it on current/future.
- **`LET IT FALL ━━━━━ ▸` label width** — the heavy-line
  decoration is wide; check it doesn't wrap on narrow phones
  (375px viewport). Truncate to `LET IT FALL ▸` if it does.
