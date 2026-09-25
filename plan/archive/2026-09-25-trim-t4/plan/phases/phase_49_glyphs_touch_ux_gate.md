# Phase 49 — GLYPHS follow-up 1: completeness-critic touch-UX pass

> Agent-facing brief. Concise, opinionated, decisive. Ship without asking;
> document judgment calls in the commit body. This brief IS the
> completeness-critic touch-UX check that `plan/tuning/2026-07-10-out-of-flow-mechanics.md`
> §3 GLYPHS flagged as the gate to clear *before* Phase 50 builds the
> mobile UI: *"a new persistent board zone is real screen estate; run the
> touch-UX check the completeness critic flagged BEFORE the spec is
> ratified."* Landing this brief closes that gate and unblocks Phase 50.

## Shape call — this is an analysis/decision phase, not a page-family build

Like Phase 33d (engine+content pilot, no mobile UI), this phase does not
follow `skills/ship-a-phase.md` §5's page-family template. There is no
new route, no new screen. The deliverable is a **verdict + locked UI
decisions** for Phase 50 to build against, produced by surveying the
*current* mobile combat screen's real estate and interaction patterns
against WI-2's proposed shape ("glyph chip row on the battlefield with
charge pips; tap → confirm sheet"). No engine or mobile code changes in
this phase — Phase 50 is where the UI actually gets built.

## Design sources (read in this order)

1. `plan/tuning/2026-07-10-audit-evidence/cross-new-mechanics.md` §WI-2
   acceptance criterion 4 — the proposed UI shape this phase evaluates:
   *"glyph chip row on the battlefield with charge pips; tap → confirm
   sheet"*.
2. `plan/tuning/2026-07-10-out-of-flow-mechanics.md` §3 GLYPHS — the
   "Watch (mobile)" caveat this phase's whole existence answers.
3. `plan/phases/phase_33d_glyphs_pilot.md` "Follow-ups" — restates the
   same gate and is the phase whose shipped engine surface (`state.glyphs`,
   `crackGlyph`, `GlyphInstance`/`GlyphPayload`) Phase 50's UI will render.
4. `plan/PHASE_CANDIDATES.md` "GLYPHS pilot (Phase 33d) post-ship
   follow-ups" (PROMOTED to Phases 49-51 via `/oversight` 2026-08-08) —
   confirms the sequencing: 49 gate, 50 mobile UI, 51 sim policy.
5. `plan/CRITIQUE.md` line 497 `[LOW] mobile — combat corner medallions
   occlude the fan-end hand cards' touch centers` — direct prior evidence
   the 375px combat screen is already cramped; this phase's survey
   confirms and extends that finding.

## The survey (current combat-screen real estate, `CombatBoard.tsx`)

Layout at 375×812, top to bottom:

- Top HUD / battlefield backdrop — `COMBAT_HUD_HEIGHT = 148`
  (`CombatCombatantPane.tsx:57`).
- Play/staging region — `flex: 1` (`CombatBoard.tsx:1249-1304`); absorbs
  whatever space the fixed-height rows below don't claim.
- Momentum chip/wheel (`CombatBoard.tsx:1306-1312`), Stance chip
  (`:1315`), Peroration/CONDEMN track (`:1318`), player status-effect
  chip row `styles.statusStrip` (`:1320-1329`, right-aligned, `gap:8`),
  Dice row (`:1343`) — all in-flow, all competing for the same
  non-flexible remainder.
- Hand/fan dock — fixed `height: 216` (`CombatBoard.tsx:1811`).
- Bottom rail (HP/phase/deck-discard counts) — `railH = 26 + bottomInset`
  (`CombatBoard.tsx:1227`).
- Floating over the dock: player medallion (bottom-left, `80×80`) and
  END-phase medallion (bottom-right, `80×80`) — the exact elements
  `plan/CRITIQUE.md:497` already documents as occluding the leftmost
  hand card's touch center.

**There is no idle band of empty screen.** The status-effect chip row
(`statusStrip`) is the closest existing analog to WI-2's proposed glyph
chip row, and its own commit history (`CombatBoard.tsx:1320-1323`
comment) records it was moved from a floated overlay *into* flow
specifically because floating chips over the fan swallowed taps meant
for cards — the exact failure mode a naively-floated glyph row would
repeat.

Interaction pattern: no bottom-sheet component exists anywhere in
`axiomancer-mobile` (`ConfirmSheet`/`BottomSheet` — zero hits). What
does exist and is cheap to reuse: a centered backdrop+modal+button
pattern (`CombatEncounterPanel.tsx` `styles.backdrop`/`modal`/`modalBtns`,
`:1204-1210`) already wired to two live confirm actions — the PLEA/yield
modal (`:763-774`, `ACCEPT`/`CONTINUE`) and the mercy modal (`:776-788`,
`SPARE`/`EXPLOIT`).

Touch-target sizing: the only codified doctrine is illustrative prose in
`axiomancer-mobile/docs/engine-integration-architecture.md:284-291`
(44pt minimum). The existing status chip this phase's row would most
resemble is already under that figure: `styles.chip` in
`CombatCombatantPane.tsx:707-710` is `34×34`.

Naming: `axiomancer-mobile/components/combat/statusGlyphs.ts` and
`glyphShapes.ts` already own "glyph" as the term for the existing
per-effect icon system (`EFFECT_GLYPHS` map, `statusGlyphs.ts:2-17`).
WI-2's "glyph chip row" would collide with this shipped vocabulary in
UI-facing copy and in any new component/file names.

## Verdict: GO WITH CONSTRAINTS

The mechanic is touch-feasible on the 375px combat screen, but only if
Phase 50 follows these four locked decisions rather than building WI-2's
literal wording:

1. **No new persistent row.** Extend the existing `statusStrip` row
   (`CombatBoard.tsx:1320-1329`) with glyph chips rather than adding a
   fourth in-flow row above/below it. The screen has zero idle vertical
   space (see survey); a new row either steals from the `flex:1` play
   region (shrinking the staging area) or repeats the pre-2026-07-18
   float-over-the-fan mistake `statusStrip`'s own history already
   corrected.
2. **"Confirm sheet" means the existing centered modal, not a new
   bottom-sheet component.** Reuse `CombatEncounterPanel.tsx`'s
   `backdrop`/`modal`/`modalBtns` pattern (the PLEA/mercy shape) for the
   tap → confirm interaction. Building a true bottom-sheet component is
   unscoped net-new work WI-2 didn't cost in; the existing pattern
   delivers the same "tap chip, see the crack payoff, confirm or
   cancel" flow.
3. **Rename the UI-facing term.** Player-visible copy and any new
   component/file Phase 50 adds must NOT call the chip row "glyph" —
   that name is already taken by `EFFECT_GLYPHS`/`statusGlyphs.ts`'s
   per-status icon system and reusing it invites exactly the kind of
   copy/vocabulary collision `plan/bearings.md`'s lexicon doctrine
   exists to prevent. Use **"Seal"** (the design doc's own prose already
   calls glyphs "battlefield seals" — `cross-new-mechanics.md:116`):
   "Seal chip", "Seal Ready" confirm copy. The already-shipped *engine*
   symbols from Phase 33d (`GlyphInstance`, `GlyphPayload`, `crackGlyph`,
   `state.glyphs`) keep their existing internal names — renaming shipped
   engine surface is unscoped churn; only the mobile UI-facing label
   changes.
4. **Enforce a real 44pt tap target via `hitSlop`, not visual chip
   size.** Model the new chip's *visual* size on the existing 34×34
   `statusStrip` chip (consistency, screen space), but give it `hitSlop`
   padding out to an effective ≥44×44 hit area — matching the doctrine
   `engine-integration-architecture.md:284-291` states but the existing
   chip doesn't meet. Phase 50 must also re-run (or extend) the
   `elementFromPoint` occlusion probe `plan/CRITIQUE.md:497`'s fix
   used, so a new hitSlop'd chip doesn't newly overlap the status strip's
   existing neighbors or the corner medallions.

## Outputs (this phase)

- This brief, which is itself the completeness-critic verdict — no
  separate report file. Phase 50's brief (when generated via
  `/plan-a-phase phase 50`) must read and lock against the four
  decisions above rather than re-deriving UI shape from WI-2's original
  wording.
- No engine, mobile, or card-editor code changes. No new tests (nothing
  shipped to test).

## Verify gate

```bash
npm run verify --workspace axiomancer-mobile   # unchanged, confirms no regression from touching nothing
```

No code changed, so this is a smoke confirmation, not a functional gate.

## Commit body template

```
phases: brief for phase 49 — GLYPHS touch-UX gate

- completeness-critic touch-UX pass for WI-2's "glyph chip row + tap
  confirm sheet" mobile UI, run against the current CombatBoard.tsx
  screen inventory (no idle vertical space; existing statusStrip is the
  nearest analog; no bottom-sheet component exists; 34px existing chip
  is under the 44pt doctrine; "glyph" already means the per-status icon
  set)
- verdict: GO WITH CONSTRAINTS — merge into statusStrip (no new row),
  reuse the existing PLEA/mercy centered-modal pattern instead of a new
  bottom sheet, rename UI-facing copy to "Seal" (engine symbols
  unchanged), enforce >=44pt hit target via hitSlop on a 34px visual chip
- unblocks Phase 50; closes the pre-mobile-UI gate
  plan/tuning/2026-07-10-out-of-flow-mechanics.md §3 GLYPHS flagged

Closes #<phase-issue-number>
```

## DoD

Flip Phase 49 `[ ]` -> `[x]` in `plan/steps/01_build_plan.md`, append the
commit hash, separate commit (`plan: phase 49 shipped — GLYPHS touch-UX
gate`).

## Confirm deploy

```bash
npm run deploy:check
```

## Follow-ups (out of scope this phase)

- Phase 50 — mobile UI (glyph/"Seal" chip row + confirm modal), built
  against the four locked decisions above.
- Phase 51 — sim `crackAt` policy heuristic + the A/B promotion court,
  once Phase 50 lets a playtester observe real cracking behavior.
- Re-running the `elementFromPoint` occlusion probe against the new Seal
  chip once it exists (Phase 50's job, not this phase's — nothing to
  probe yet).
