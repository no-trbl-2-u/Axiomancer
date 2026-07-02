# Phase 73 — Level-Up modal + SELF-tab ascend strip (port from 2026-05-23 design)

> User-prompted 2026-05-23 via /oversight 33rd call. Closes the
> long-standing critique row "[MED] /self — Level Up button at
> top of SELF screen + stat-allocation modal" (filed via /jot on
> 2026-05-22, design-pending until the bundle landed).
>
> Source bundle: `design/handoff-2026-05-23/project/screens/levelup.jsx`.
> Single-tick or two-tick phase depending on scope decision below.
> Promoted to **top of the build plan** below Phase 72.

**Source-of-truth lines:**
- `design/handoff-2026-05-23/project/screens/levelup.jsx` — `LevelUpModal` + `SelfTabHeaderWithLevelUp` (the canonical artboards).
- `design/handoff-2026-05-23/chats/chat5.md` — the brief that produced the design (preserved as the deliberate-design-intent source).
- `design/levelup-modal-prompt.txt` — the original prompt (20KB) the user wrote that drove the design.

---

## 1. Why

Today the engine fires `character:levelup` and a sulfur `↑`
badge appears on the SELF tab icon, but opening the tab silently
clears the badge — the player has no way to actually *spend*
the earned point(s). The engine surfaces `pendingPoints` (or
equivalent) but the UI never picks them up.

The chat5 design brief calls the gap closure two new surfaces:

1. **`<SelfTabHeaderWithLevelUp>`** — an inline LEVEL-UP strip
   inserted *between* the level-box row and the XP chain bar on
   the SELF tab. Full-width, 64px, sulfur-banded, with a
   `<LockSeal>` glyph on the left + gothic 18pt `✠ ASCEND` +
   eyebrow `N points unspent · step into level vii`. Only mounts
   when `pendingPoints > 0`; when `pendingPoints === 0` the
   header is byte-identical to today's. Tap opens
   `<LevelUpModal>`.

2. **`<LevelUpModal>`** — full-screen non-tap-out-dismissible
   stat-allocation modal. Eyebrow `✠ THE LEDGER OPENS`, level
   transition `level vi → level vii` (lowercase Roman),
   character name with blood drop-shadow, chronicle flavor line,
   torn-edge "POINTS REMAINING N / total" strip (lights sulfur
   when all spent), three stance allotment rows (HEART / BODY /
   MIND) with framed glyph + big gothic numeral + ± controls +
   derived-preview ribbon (ATK / SKL / DEF deltas), reset link,
   `✠ COMMIT` primary + `keep deliberating` ghost. Plus the
   optional discard-confirm inset for "the ink is still wet"
   when the player cancels mid-allocation.

## 2. Scope (one tick, decomposable into two)

### Decomposed plan (recommended)

**Tick A — engine surface + SELF header strip.**
- Confirm engine exposes pending allocation points. Check
  `axiomancer-mechanics` for a `pendingAttributePoints` /
  `availablePoints` field on Character; if missing, surface it
  through the character presenter as a mobile-side counter that
  hooks `character:levelup` from the engine event ring buffer.
- New `<SelfTabHeaderWithLevelUp>` component (or extend the
  existing SELF-tab header at
  `app/(tabs)/character/index.tsx`) to render the ASCEND strip
  when `pendingPoints > 0`.
- Pulse animation on the LockSeal (concentric second ring at
  50% opacity — the design's "slow breathing" hint).
- Tapping the strip routes to a `/levelup` modal route or
  surfaces a context-managed `<LevelUpModal>`; pick the
  mobile-fit pattern (a context provider mirroring
  `combat-mode.tsx`'s session shim is the natural shape).

**Tick B — LevelUpModal + allocation flow.**
- New `components/levelup/LevelUpModal.tsx` with the design's
  ledger-opens layout. Pure presentational; reads VM from a new
  `selectLevelUpViewModel` presenter at
  `state/presenters/levelup.engine.ts`.
- Allocation state lives on a mobile-side context (or local
  state within the modal) until `onConfirm` fires. On confirm,
  dispatch the engine's existing `applyAttributePoint(stance)`
  action (or whichever is canonical) N times in sequence and
  close the modal.
- Discard-confirm inset (the "ink is still wet" sub-panel)
  fires when `onCancel` is invoked while
  `sum(spent) > 0`.
- Derived-preview ribbon: presenter projects
  `derivedAfter[stance][col]` for each cell by computing what
  the engine's derived-stats formula would produce given the
  pending allocations. If recomputing engine-side is expensive,
  approximate locally and let the engine reconcile on confirm
  (note in the commit body).

### Single-tick alternative

Combine A + B as one feature commit + one test commit. Larger
diff but the surfaces are tightly coupled — header opens the
modal, allocation commits flow back through the same store.
Pick this if engine integration is straightforward and the
preview ribbon can be approximated client-side.

## 3. Acceptance

- Walk a fresh run to a level-up moment (use the dev menu's XP
  grant button — `<DebugXpGrant>` already ships): SELF tab
  shows the ASCEND strip; tap opens the modal; allocate all
  three points; COMMIT wakes from ghost to primary; confirm
  closes the modal; SELF tab header reverts to no-strip; chat
  voice "ROSE TO vii" appears in the MEMOIR chronicle.
- `verify` green; hermetic tests for the new presenter +
  components.
- Closes critique row `[MED] /self — Level Up button at top of
  SELF screen + stat-allocation modal` in `plan/CRITIQUE.md`.

## 4. Risks

- **Engine field naming** — the design assumes a single
  `pendingPoints` int. The engine may expose this differently
  (or not at all). Tick A's first task is confirming the engine
  surface and adapting the VM.
- **Derived-preview ribbon math** — projecting `derivedAfter`
  client-side risks drift from the engine's actual derivation.
  Either expose an engine `previewAllocation({ heart, body,
  mind })` helper (cheap; engine has the formulas) or accept
  the drift and let confirm trigger the canonical recompute.
- **Animation** — the LockSeal "pulse" + the COMMIT-wakes
  underline glow are presenter-driven transitions. Use
  `react-native-reanimated` `withRepeat` + `withTiming` per
  Phase 44 port pattern. Reduce-motion fallback ships per
  Phase 10's a11y baseline.
- **Cancel-with-spent flow** — back-gesture interception is
  Android-specific; iOS pattern is the swipe gesture on the
  modal. The discard-confirm inset must fire in both. Hook via
  `HardwareBackHandler` for Android + a guard in the gesture
  responder for iOS.

## 5. Sub-tick log

| Tick | Status | Commit | Notes |
|------|--------|--------|-------|
| A    | `[ ]`  | —      | Engine pending-points surface + `<SelfTabHeaderWithLevelUp>` strip |
| B    | `[ ]`  | —      | `<LevelUpModal>` + presenter + commit-flow wiring + discard-confirm inset |
