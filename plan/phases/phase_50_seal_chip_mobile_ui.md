# Phase 50 — GLYPHS follow-up 2: mobile UI (Seal chip row + tap-confirm sheet)

> Agent-facing brief. Concise, opinionated, decisive. Ship without asking;
> document judgment calls in the commit body. This phase builds the mobile UI
> for the Phase 33d GLYPHS engine surface (`state.glyphs`, `crackGlyph`,
> `GlyphInstance`, `GlyphPayload`), locked against the four constraints
> Phase 49's completeness-critic touch-UX gate produced. It does not
> re-derive UI shape — it builds exactly what Phase 49 specified.

## Shape call — a vertical UI slice, not a page-family build

No new route, no new screen — this extends the live combat board
(`CombatBoard.tsx`, `CombatCombatantPane.tsx`, `CombatEncounterPanel.tsx`)
and its presenter (`combat-encounter.engine.ts`). `skills/ship-a-phase.md`
§5's page-family template doesn't apply, same as Phase 49 and Phase 33d.

## Design sources (read in this order)

1. `plan/phases/phase_49_glyphs_touch_ux_gate.md` — the four locked
   decisions this phase builds against (merge into `statusStrip`, reuse the
   PLEA/mercy centered-modal pattern, rename UI-facing copy to "Seal",
   enforce >=44pt hit target via `hitSlop` on a 34px visual chip).
2. `plan/phases/phase_33d_glyphs_pilot.md` — the engine surface this phase
   renders: `state.glyphs?: GlyphInstance[]`, `crackGlyph(state, glyphId)`,
   `GlyphPayload` (`poison` | `barrier`), events `glyph-inscribed` /
   `glyph-charged` / `glyph-cracked` / `glyph-shattered`.
3. `plan/tuning/2026-07-10-audit-evidence/cross-new-mechanics.md` §WI-2
   acceptance criterion 4 — "glyph chip row ... tap → confirm sheet [with]
   the foretold next crack value." This phase's confirm sheet shows that
   value (`baseIntensity/baseAmount + charges`, computed the same way
   `crackGlyph` computes it — no new math, just a presenter-side mirror of
   the engine formula already proven by `glyphs.engine.test.ts`).

## Decisions made upfront — DO NOT ASK

- **Where Seals live in state:** `state.glyphs` is a single top-level array
  (not split player/enemy) but every glyph is player-inscribed and
  player-cracked (33d's whole design). Seals are folded into
  `CombatPlayerPaneVM` (beside `effects`/`guard`), the same pane
  `state.persistentZone`/`state.tempZone` already feed via `standingChips`.
- **Icon + colour: a dedicated Seal identity, not reused from
  `EFFECT_GLYPHS`.** Phase 49's rename constraint (#3) forbids calling the
  chip row "glyph" in UI copy; it's silent on the icon/colour, so this phase
  locks it: `◈` (poison-payload Seal), `❖` (barrier-payload Seal), both a
  single gold accent `#d9b44a` (matches `STANCE_COLORS.wild` — the existing
  "charged token" identity, already used for the wild die/momentum-charged
  state — semantically consistent with "an inscribed thing that charges and
  pays off later", and visually distinct from every `GLYPH_COLORS` category
  colour so a Seal never reads as a live status effect). Defined as plain
  hex constants in the presenter (mirrors `STANCE_COLORS`/`GUARD_COLOR`'s
  existing pattern in `combat-encounter.engine.ts` — no theme-hook access
  from a pure function).
- **Badge: charges/cap fraction, not the effect chip's intensity+duration
  pair.** Seals have no duration (they persist until cracked or shattered)
  and "intensity" doesn't apply pre-crack — `charges/cap` (e.g. "2/3") is
  the only meaningful at-a-glance number. Reuses `styles.chipBadge` (no new
  style needed beyond the text content).
- **Always tappable, no locked/ready state.** `crackGlyph` has no minimum
  charge gate in the engine (dieless, legal any time in `phase-play`) — the
  "ripening dilemma" is entirely the player's call, so every Seal chip opens
  the confirm sheet on tap, at any charge count including 0.
- **Confirm sheet copy: CRACK / WAIT**, mirroring the PLEA modal's
  ACCEPT/CONTINUE shape exactly (`styles.backdrop`/`modal`/`modalBtns`,
  plain `View` backdrop — NOT `Pressable` — so a stray tap can't dismiss the
  decision, matching PLEA/mercy's existing "the player, not the threshold,
  authors the outcome" doctrine). Title: `Crack the <Poison/Barrier> Seal?`.
  Body: the preview line (`Poison 4, 2 rounds` / `Barrier 5`) plus the
  charges/cap readout.
- **No new bottom-sheet component, no new modal styles.** Reuses
  `CombatEncounterPanel`'s existing `styles.backdrop`/`modal`/`modalTitle`/
  `modalSub`/`modalBtns`/`modalBtn`/`modalBtnText` wholesale.
- **No FX/animation wiring for the crack itself.** `onSignature` (the
  closest dieless-action precedent) doesn't dispatch into the `fx` stream
  either — `crackGlyph`'s poison branch already emits `effect-landed`, which
  the existing enemy-pane FX pipeline picks up generically; the barrier
  branch has no bespoke animation today and doesn't get one in this phase.
  Follow-up, not cut for time — the source doc doesn't ask for it.
- **No occlusion-probe re-run in this phase's own scope beyond what the new
  chip's `hitSlop` change requires.** Phase 49 flagged the
  `elementFromPoint` probe as "Phase 50's job" — this phase's `hitSlop={6}`
  on a 34px chip (34+12=46, clears the 44pt doctrine) is the concrete fix;
  a full occlusion re-probe against the corner medallions is a manual/visual
  QA follow-up, not a blocking automated gate (no such probe exists as a
  runnable script in this repo today — `plan/CRITIQUE.md:497`'s fix was a
  code change, not a standing tool).

## Outputs

```
axiomancer-mobile/state/presenters/combat-encounter.engine.ts
  + import type GlyphInstance, GlyphPayload from '@mechanics'
  + const SEAL_COLOR = '#d9b44a'
  + const SEAL_GLYPHS: Record<GlyphPayload['kind'], string> = { poison: '◈', barrier: '❖' }
  + const SEAL_LABELS: Record<GlyphPayload['kind'], string> = { poison: 'Poison Seal', barrier: 'Barrier Seal' }
  + export interface CombatSealVM { id, kind, glyph, color, label, charges, cap, crackValue, previewText }
  + function sealVM(g: GlyphInstance): CombatSealVM — computes crackValue/previewText
    from the payload + charges (same formula crackGlyph uses: baseIntensity/baseAmount + charges)
  + function sealsVM(glyphs?: GlyphInstance[]): CombatSealVM[]
  ~ CombatPlayerPaneVM: + seals: CombatSealVM[]
  ~ playerPane(state): seals: sealsVM(state.glyphs)

axiomancer-mobile/components/combat/encounter/CombatCombatantPane.tsx
  + export function SealChips({ seals, onSeal }) — same chip shell as
    EffectChips (styles.chip/chipGlyph/chipBadge), charges/cap badge instead
    of intensity/duration, hitSlop={6} (34px visual + 6 hitSlop each side =
    46pt effective hit target, clears the 44pt doctrine)

axiomancer-mobile/components/combat/encounter/CombatBoard.tsx
  ~ CombatBoardProps: + onSeal?: (s: CombatSealVM) => void (beside onChip)
  ~ statusStrip render gate: + vm.player.seals.length > 0 to the
    show-the-row condition
  ~ statusStrip body: <SealChips seals={vm.player.seals} onSeal={onSeal} />
    rendered after <EffectChips .../> — same row, no new in-flow row (locked
    decision #1)

axiomancer-mobile/components/combat/encounter/CombatEncounterPanel.tsx
  + import crackGlyph from '@mechanics'; import type CombatSealVM
  + const [sealConfirm, setSealConfirm] = useState<CombatSealVM | null>(null)
  + const onSeal = useCallback((s) => setSealConfirm(s), [])
  + const onCrackSeal = useCallback(() => { apply(s => crackGlyph(s, sealConfirm.id).state); setSealConfirm(null); }, [apply, sealConfirm])
  ~ <CombatBoard ... onSeal={onSeal} />
  + Seal confirm modal (new JSX block, mirrors the PLEA modal exactly):
    testID="combat-seal-confirm", title "Crack the <label>?", sub
    "<previewText> · <charges>/<cap> charges", buttons CRACK
    (testID="combat-seal-crack") / WAIT (testID="combat-seal-wait")
```

## Tests

- `axiomancer-mobile/state/presenters/__tests__/seal-chip-vm.engine.test.ts`
  (new): pure presenter mapping —
  - no glyphs → `seals: []`.
  - a poison glyph at N charges → `crackValue = baseIntensity + N`,
    `previewText` includes the duration.
  - a barrier glyph at N charges → `crackValue = baseAmount + N`.
  - charges/cap round-trips exactly (no clamping in the presenter — the
    engine already caps `charges` at `cap` on tick).
- `axiomancer-mobile/components/combat/encounter/__tests__/CombatBoard.seal.test.tsx`
  (new, mirrors `CombatBoard.reprisal.test.tsx`'s real-engine harness): build
  a `CombatEncounterState` via `initializeCombatEncounter`, hand-set
  `state.glyphs` to one poison + one barrier instance, `buildCombatViewModel`,
  render `<CombatBoard vm={vm} ... onSeal={cb} />`:
  - both `combat-seal-<id>` chips render with the correct glyph/badge text.
  - tapping a chip calls `onSeal` with that seal's VM, exactly once.
  - accessibility label includes the charges/cap and the preview text.

## Cross-link retrofit

None — the statusStrip row is already wired into the live combat screen;
Seals appear automatically once any glyph exists in `state.glyphs` (no new
entry point needed, mirrors how the standing-enchant chips just started
appearing when `persistentZone` gained entries).

## Verify gate

```bash
npm run verify --workspace axiomancer-mobile
```

## Commit body template

```
feat(mobile): Seal chip row + tap-confirm sheet — phase 50

- CombatPlayerPaneVM gains `seals: CombatSealVM[]`, mapped from the Phase
  33d engine's `state.glyphs` (poison/barrier payloads, charges/cap)
- Seal chips render inside the existing statusStrip row (no new in-flow
  row), 34px visual size with hitSlop to a 46pt effective hit target
- tapping a Seal opens a CRACK/WAIT confirm sheet (reuses the PLEA/mercy
  centered-modal pattern) showing the foretold crack value — WI-2
  acceptance criterion 4
- UI-facing copy says "Seal", never "glyph" — Phase 49 decision 3

Decisions:
- Seal icon/colour (◈/❖, #d9b44a gold) is a new identity distinct from
  every EFFECT_GLYPHS category colour, so a Seal never reads as a live
  status effect — Phase 49 didn't lock this, only the rename
- no FX/animation wiring for the crack itself (mirrors onSignature's own
  restraint); no occlusion-probe automation (none exists as a runnable
  tool today, manual QA follow-up)

Closes #<phase-issue-number>
```

## DoD

Flip Phase 50 `[ ]` -> `[x]` in `plan/steps/01_build_plan.md`, append the
commit hash, separate commit (`plan: phase 50 shipped — Seal chip mobile
UI`).

## Confirm deploy

```bash
npm run deploy:check
```

## Follow-ups (out of scope this phase)

- Phase 51 — sim `crackAt` policy heuristic + the A/B promotion court, now
  that a playtester can observe real cracking behavior via this UI.
- FX/animation for the crack moment (barrier especially — poison rides the
  existing `effect-landed` pulse for free).
- A manual/visual occlusion-probe pass against the corner medallions with a
  live Seal chip present (no automated tool exists for this today).
