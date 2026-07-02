# Phase 74 — Tap-tooltip primitive + per-surface wiring

> Promoted via /oversight 2026-05-23 (34th call) from
> `PHASE_CANDIDATES.md` `[score 5.0] Tap-tooltip primitive +
> per-surface wiring (user-jot)`, filed via user-jot
> `cfc524c`: "I want to add a phase where we add 'tap'
> tooltips that explain whatever it is they tapped (ie. any
> buff icons during combat, what each stat does in the
> 'SELF' tab, stat effects for afflictions and blessings,
> etc.)"
>
> Refines the brief without shipping code (`/plan-a-phase`,
> 35th oversight call). **Scope deliberately deferred to
> Tick A only** — Tick B (combat HUD wiring) overlaps with
> parallel Claude's combat-modal WIP
> (`components/event/EncounterModalOverlay.tsx`,
> `app/(tabs)/combat.tsx`, `state/presenters/combat.engine.ts`).
> Re-promote Ticks B–E as sub-phases (74b–74e) once the WIP
> commits.

## 1. Why

Multiple chrome-vs-engine drift rows surfaced across the 6-surface
mechanics-vs-UI audit cycle were "the player has no way to know
what this icon / chip / slot label actually does at first paint."
Examples: `Trinket` vs `Accessory` slot label cross-tab confusion
(audit DRIFT row); `ADV/DIS` chips silent about which effects
modify them; FLEE chrome promising morale debuff the engine never
applied (closed via re-voice). Each drift was caught by audit
rotation; a per-element tap-tooltip would have surfaced the
engine truth at first paint, closing the gap without code-side
audit work.

The cross-cutting primitive — torn-edge panel anchored to the
tapped element, lowercase chronicle voice on body, mono on engine
numbers — is the load-bearing first tick. Subsequent ticks are
per-surface wiring against `effectsLibrary` / engine slices.

## 2. Scope (Tick A only)

### Tick A — `<TapTooltip>` primitive + `selectTooltipContentFor` presenter

**Files added:**

- `components/tooltip/TapTooltip.tsx` — the visual primitive.
  Torn-edge panel (`borderStyle: 'dashed'`, hairline 1px ash on
  parchment-bg per `theme/axm`), 12px gothic title + lowercase
  chronicle body in IM Fell English + optional mono footnote for
  engine numbers. Anchored above (default) or below the tap
  target depending on viewport position; auto-flips when within
  60px of the screen edge. Max-width 280px; wraps body text.
- `components/tooltip/TooltipProvider.tsx` — root-level
  context provider mounted in `app/_layout.tsx`. Exposes
  `{ showTooltip({ kind, id, anchorRef }), hideTooltip() }`.
  Renders one absolutely-positioned `<TapTooltip>` overlay at
  the measured anchor position; handles tap-outside dismiss via
  a transparent backdrop and 6s auto-dismiss via `setTimeout`.
- `state/presenters/tooltip.engine.ts` — pure
  `selectTooltipContentFor(kind: TooltipKind, id: string, state:
  AppStoreState) → { title: string; body: string; footnote?:
  string } | null`. Lookup table per kind; returns null when no
  content authored for the requested id (caller renders no
  tooltip). Caller responsibility — the primitive never crashes
  on a null content read.
- `hooks/useTooltip.ts` — thin consumer hook:
  `const tooltip = useTooltip(); tooltip.show({ kind, id, anchorRef });`
  Wraps `useContext(TooltipContext)` for type-safety.

**Locked decisions (DO NOT ASK):**

1. **Anchoring strategy: `measure()` + portal-like overlay.**
   Each consumer passes its own `useRef` to a `<Pressable>` /
   `<View>`; on tap, `useTooltip().show({ anchorRef, ... })`
   calls `anchorRef.current.measureInWindow((x, y, w, h) => …)`
   and the provider absolutely-positions the tooltip relative
   to those coords. Pure RN — no third-party library.
2. **Dismiss triggers: tap-outside (always) + 6s timeout
   (always) + tap-on-anchor again (toggle off).** Programmatic
   `hideTooltip()` available but not exposed in the design's
   default contract.
3. **Single-tooltip-at-a-time.** A second `show` replaces the
   first; no stacking.
4. **`TooltipKind` enum: `'stat' | 'derived' | 'alignment' |
   'affliction' | 'blessing' | 'effect' | 'stance-chip' |
   'skill' | 'slot' | 'burden' | 'item-stat' |
   'chronicle-entry' | 'quest-objective'`.** Each kind has its
   own lookup branch in `selectTooltipContentFor`. New kinds
   ship in their wiring tick (B–E), not retroactively in A.
5. **Tick A authors content for `kind: 'stat'` only.**
   Content for the three base stats (HEART / BODY / MIND).
   Other kinds return `null` from the presenter until their
   wiring tick lands. Pin the null-return contract in tests.
6. **Body voice is lowercase chronicle.** Mono on engine
   numbers (e.g. `+1 morale per defend at heart stance`).
   Matches the `event.engine.ts::preludeChrome` voice
   established across the encounter-seal chrome refresh.
7. **No animation.** Fade-in deferred to a follow-up tick;
   the static mount keeps the bundle small and matches the
   project's a11y-default-static stance (per Phase 10).
8. **No reduce-motion gate yet.** Static mount means there's
   nothing to gate.
9. **Tooltip mounts above the tap target by default.** Flips
   to below when `anchor.y < 100`; flips back when
   `anchor.y + h + tooltipHeight > windowHeight - 60`. Anchor
   centerline aligns to tooltip horizontal-center; clamped to
   `[16, windowWidth - tooltipWidth - 16]` so the panel never
   bleeds off the edge.
10. **TooltipContext starts with no-op fallbacks.** Calling
    `showTooltip` outside the provider is a no-op (per the
    pattern in `combat-mode.tsx`'s session shim) — keeps tests
    that don't mount the provider hermetic.

**Content authored in Tick A (kind: 'stat'):**

- `HEART` — title `HEART`; body `the will to stay with what's
  difficult. governs morale, willpower, and the heart-stance
  damage curve.`; footnote `+1 morale per defend at heart stance`.
- `BODY` — title `BODY`; body `the weight you carry in the
  world. governs HP, physical attack, defense, and body-stance
  damage curves.`; footnote `+1 HP per body point`.
- `MIND` — title `MIND`; body `the discipline of attention.
  governs mana, skill cost recovery, and mind-stance damage
  curves.`; footnote `+1 mana per mind point`.

(Engine-formula footnotes are illustrative; the brief calls
out the actual engine constants under tests so the values
stay in sync if the engine tweaks them.)

## 3. Acceptance

- `verify` green; new hermetic tests for the presenter +
  primitive + provider.
- The `<TooltipProvider>` mounts at root and exposes the
  context to children.
- A hermetic test renders a stub child that calls
  `useTooltip().show({ kind: 'stat', id: 'HEART', anchorRef })`
  and asserts the `<TapTooltip>` body text matches the locked
  HEART content.
- A second hermetic test asserts `selectTooltipContentFor('effect',
  'unknown-effect-id', state)` returns `null` (no tooltip mount).
- Tap-outside dismiss verified via a hermetic press on the
  backdrop testID.
- 6s timeout verified via `jest.useFakeTimers()` + `jest.advanceTimersByTime`.
- No production-code changes outside the new files + a single
  `app/_layout.tsx` provider insertion. No combat-modal
  surface touched.

## 4. Risks

- **Parallel Claude collision.** Tick A's only shipped-tree
  edit is `app/_layout.tsx` (provider mount). The other
  instance is on combat-modal files; no overlap.
- **`measureInWindow` reliability.** RN's `measureInWindow` can
  return zeros on the first render frame if the anchor hasn't
  laid out yet. Guard the provider: if any returned coord is
  zero, defer one frame via `requestAnimationFrame` and retry.
  Pin the deferral path in tests via a stub
  `measureInWindow` that calls back with zeros once then real
  coords.
- **Tooltip backdrop swallowing taps to lower surfaces.** The
  backdrop is `pointerEvents: 'box-only'` so it captures the
  dismiss tap without forwarding scroll / press events to
  layers underneath. Document this in the JSDoc.
- **iOS safe-area.** Tooltip absolute positioning is in
  window coords; on iOS notches, anchoring near the top can
  push the tooltip into the safe-area inset region. Inset
  margins handled by the auto-flip rule (Decision 9 above)
  plus a `useSafeAreaInsets()` read in the provider.

## 5. Sub-tick log

| Tick | Status | Commit | Notes |
|------|--------|--------|-------|
| A    | `[ ]`  | —      | `<TapTooltip>` primitive + `TooltipProvider` + `selectTooltipContentFor` (kind: 'stat' only) + 1 `app/_layout.tsx` provider mount |

## 6. Follow-ups (out of scope; promote post-WIP)

- **Tick B — combat HUD wiring.** Buff/debuff icons in HUD
  strips; stance ADV/DIS chips; skill picker rows. Content
  sourced from engine `effectsLibrary.lookupEffect(id).description`.
  **Gated on parallel Claude's combat-modal WIP commit.**
- **Tick C — SELF wiring.** Each of the 3 base stats (Tick A
  content already authored — wiring only), 9 derived cells,
  alignment cube, each affliction / blessing row.
- **Tick D — Inventory wiring.** Equipment slot labels;
  item-card stat lines; burden bar.
- **Tick E (optional) — Memoir wiring.** Chronicle entry
  types; quest objective rows.
- **Fade-in / scale-in animation.** `react-native-reanimated`
  `withTiming` from `opacity: 0` to `1` over 120ms; defer per
  Decision 7 above; reduce-motion gate per Phase 10 a11y
  baseline.
- **Long-press alternative on Android.** iOS pattern is tap;
  Android idiom is often long-press. Investigate whether the
  primitive should expose both triggers via a `trigger:
  'tap' | 'long-press'` prop.

## 7. Why scope is Tick A only

The 34th oversight call's coordination question concluded
"bias to Phase 74 tooltip; defer modal-adjacent work until
parallel Claude commits". Tick A is the only sub-tick with
zero combat-modal-surface overlap (provider mount in
`app/_layout.tsx` only; no `(tabs)/combat.tsx` or
`EncounterModalOverlay.tsx` touch). Ticks B–E all wire into
surfaces parallel Claude is editing or has just edited.

Once the WIP commits, `/oversight` re-promotes Ticks B–E as
sub-phases (74b–74e) in fresh briefs — each one a small
wiring sweep keyed off a stable post-WIP file shape.
