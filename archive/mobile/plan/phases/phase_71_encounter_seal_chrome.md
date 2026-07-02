# Phase 71 — Encounter-seal chrome refresh

> User-prompted 2026-05-22 alongside Phase 70 from the
> `design/handoff-2026-05-22/` bundle. Sibling to Phase 70 — the
> aftermath modals — but scoped to the **chrome** around the
> encounter modal seal: top and bottom `SEALED` chain bars with
> phase-aware labels, and the panel border color flip from blood
> (intro / combat) → sulfur (aftermath).
>
> Source-of-truth lines in the bundle:
> - `design/handoff-2026-05-22/project/prototype.jsx:558-617`
>   (`PtEncounterFlow` chain-bar + border + boxShadow chrome).
> - `design/handoff-2026-05-22/project/screens/encounter-modal.jsx:81-93`
>   (the original "SEALED · NO RETREAT" chain bar that shipped
>   in Phase 32).
> - `design/handoff-2026-05-22/chats/chat4.md:175-199` (the
>   encapsulation rationale that motivates the phase-aware label
>   swap).
>
> Promoted to **top of the build plan** per user instruction
> 2026-05-22 ("Top priority is getting all these new designs in
> place"). Single-tick phase — narrow scope, one file touched.

---

## 1. Why

The current encounter modal (`components/event/EncounterModalOverlay.tsx`)
renders a fixed `ChainBar` with the static label
`vm.preludeChrome.sealLabel` at top + bottom. The label doesn't
change as the modal transitions prelude → combat → aftermath, and
the panel border stays `AXM.rust` regardless of outcome.

The handoff bundle's `PtEncounterFlow` ports the chain bars across
all three phases:

| Phase     | Top + bottom label                | Border / glow      |
|-----------|-----------------------------------|--------------------|
| prelude   | `SEALED · AT ARMS`                | blood + blood glow |
| combat    | `SEALED · ROUND I` / `… II` / `… III` (roman numerals) | blood + blood glow |
| aftermath | `IT IS DONE` (top) / `CARRY ON` (bottom) | sulfur + sulfur glow |

The visual signal is that the seal "wakes" on outcome — the border
turns sulfur, the chain glyphs and labels turn sulfur, and the
glow shifts. It's a small piece of chrome but a load-bearing one:
it tells the player the seal is about to release.

## 2. Scope (one tick)

Single tick. Touches `components/event/EncounterModalOverlay.tsx`
and the existing chain-bar primitive, plus a presenter helper for
the phase-aware label.

- Extend `EncounterModalOverlay`'s internal mode state with an
  `aftermath` mode (the existing `EncounterModalMode` type already
  reserves it — see line 62 — but no code transitions into it).
  Phase 70 Tick A wires the transition; Phase 71 handles the
  chrome change.
- New helper `selectEncounterSealChrome(mode, round, outcome?)`
  in `state/presenters/encounter-seal.engine.ts` returning:
  ```ts
  {
    topLabel: string;     // 'SEALED · AT ARMS' | 'SEALED · ROUND I' | 'IT IS DONE'
    bottomLabel: string;  // 'NO RETREAT' | 'CARRY ON'
    borderColor: string;  // AXM.blood | AXM.sulfur
    glowColor: string;    // 'rgba(192,21,42,0.35)' | 'rgba(212,192,38,0.30)'
    chainGlyph: string;   // '◆' (constant) — color shifts via borderColor
  }
  ```
  Strings stay in the presenter per Hard Rule #8 — no inline
  literals at the view.
- `<ChainBar>` widens to accept the dynamic label + a color prop
  (currently the styles hardcode `AXM.blood` / `AXM.rust`).
  Refactor the inline styles to consume the new props.
- The outer `panel` style's `borderColor` + shadow consume
  `borderColor` / `glowColor` from the chrome helper instead of
  the current static `AXM.rust`.
- Round labels use lowercase-roman per the bundle's numeral rule
  (`ROUND I` → `ROUND i`). The bundle prototype actually writes
  `ROUND ${roman(round).toUpperCase()}` (uppercase roman); confirm
  with the user during the tick whether to follow the prototype
  literally or apply the lowercase-roman rule from the bundle's
  consistency checklist. **Recommendation:** match the prototype
  (uppercase roman in chain bars) — the chrome is sans/tracked so
  lowercase reads as mixed-case noise.

## 3. Dependencies

- **Phase 70 Tick A** introduces the `aftermath` mode transition.
  Phase 71 can land before Tick A — the aftermath label branch
  simply never renders until Tick A wires the transition. Order
  is a judgment call:
  - **Ship Phase 71 first** if you want the chrome polish to land
    on its own commit (small, low-risk, easy to revert).
  - **Ship Phase 70A first** if you want to avoid landing
    "feature-flagged" code that's not exercised yet.
- No engine work. No new tests beyond the presenter pin + the
  existing `EncounterModalOverlay` test extension.

## 4. Acceptance

- Top + bottom chain-bar labels change as the modal transitions
  prelude → combat (round I/II/III) → aftermath.
- Panel border + glow flip from blood to sulfur on aftermath.
- Hermetic tests pin all three states; visual verification by the
  user walking an encounter end-to-end.

## 5. Risks

- **Tracked-letter rendering** — `Bebas Neue` (the sans face the
  chain bars use) renders narrowly. Long labels like `SEALED ·
  ROUND III` may not fit at the existing horizontal padding. If
  the layout breaks at 390×844, drop the `SEALED · ` prefix on the
  round labels (the visual rivets + border carry the "sealed"
  signal already).
- **Round counter source** — the engine exposes `combat.round` but
  the modal currently doesn't read it. Plumb via `useGameState((s)
  => s.combat?.round ?? 1)` at the overlay; no presenter change
  needed.
- **Phase 70 ordering** — see §3. Decide at tick start.
