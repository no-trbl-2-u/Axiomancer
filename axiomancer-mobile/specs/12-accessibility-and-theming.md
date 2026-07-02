# Spec 12 — Accessibility and Theming

## Goal

Make the app navigable by screen reader, comfortable for low-vision
users, and resilient to OS-level font scaling and reduce-motion
settings. Lock in the theme tokens as a contract — colour palette,
type scale, spacing scale — so future visual work has a single source
of truth.

**Success state:** Every interactive element has an `accessibilityRole`
+ `accessibilityLabel`. The screen reader walks the combat round in
a sensible order. `prefersReduceMotion` halts every Reanimated
transition. Font scale at 200% does not break any layout. The app
passes a manual VoiceOver / TalkBack audit.

## Why now / dependencies

- **Unblocks:** wider playtester reach, app-store accessibility
  requirements.
- **Depends on:** Specs 04–08 (presenter layer must be in place — VMs
  expose a11y labels alongside data).

## Current state

- No `accessibilityLabel` / `accessibilityRole` props in the screens.
- Reanimated is installed but used only in components that auto-
  respect reduce-motion via Reanimated's defaults — not yet
  systematic.
- Theme lives in `theme/axm.ts` — palette + fonts only. No type
  scale, no spacing scale.
- The dark palette has high contrast on key elements but
  `bone (#8a8273)` on `bg (#0a0a0a)` is the bare minimum AA contrast
  — needs an audit at small font sizes.

## Open questions

1. **Type scale.** Codify a scale?
   - (A) **(default)** Yes — `type.display | h1 | h2 | body | caption | mono`
     with explicit `fontFamily | fontSize | lineHeight | letterSpacing`.
   - (B) No — current ad-hoc font sizes are fine.
   > Your answer: A

2. **Spacing scale.** Add `spacing.xs | sm | md | lg | xl`?
   > Your answer: Yes

3. **Contrast budget.** Mock uses `bone` (#8a8273) for secondary text.
   Audit:
   - (A) **(default)** Audit at 12 sp on parchment / on bg; bump
     `bone` if AA fails.
   - (B) Skip — it's stylized, not a banking app.
   > Your answer: B

4. **Reduce motion.** Use `useReducedMotion` from Reanimated and:
   - (A) **(default)** Skip every transition when on; UI is instant.
   - (B) Half-speed transitions.
   - (C) Crossfades only.
   > Your answer: A

5. **Font scaling.** RN respects `allowFontScaling` per `Text`. Set
   a global default?
   - (A) **(default)** `allowFontScaling: true` everywhere; layouts
     audited at 200%.
   - (B) `allowFontScaling: false` — preserve the typographic
     hierarchy at the cost of accessibility.
   - (C) Per-screen — display titles unscaled, body scaled.
   > Your answer: C

6. **Dark / light.** App is dark-only today.
   - (A) **(default)** Stay dark-only — flavour decision.
   - (B) Add light mode.
   > Your answer: A

7. **Haptics.** `expo-haptics` is installed but unused. When?
   - (A) **(default)** Crit / fumble in combat resolve; node-enter
     in exploration.
   - (B) None.
   > Your answer:A

## Proposed approach

1. **Extend `theme/axm.ts`** with `type.*` and `spacing.*` per Q1, Q2.
2. **Theme migration sweep** — replace literal `fontSize: 14` with
   `type.body.fontSize` etc. Mostly mechanical.
3. **A11y label sweep** — every `TouchableOpacity` /
   `Pressable` gets `accessibilityRole` + `accessibilityLabel`.
   Presenter VMs expose label strings (`stance.heart.a11y =
   'Choose Heart stance, beats Body'`).
4. **`useReducedMotion` integration** — every Reanimated transition
   wrapped per Q4.
5. **Contrast audit** — small script reads `theme/axm.ts`, computes
   contrast ratio for each (fg, bg) pair used, fails if any < 4.5:1.
6. **Manual audits** — VoiceOver (iOS), TalkBack (Android), Large
   Text Mode (iOS Dynamic Type), Bold Text Mode.
7. **Hermetic e2e** for the parts that can be — VM `.a11yLabel`
   strings tested per Spec 03 contract; component render tests
   assert each interactive element exposes `accessibilityLabel`.

## Acceptance checklist

- [ ] All 7 questions answered.
- [ ] `theme/axm.ts` exposes `type.*` and `spacing.*`.
- [ ] Every interactive element has `accessibilityRole` +
      `accessibilityLabel`.
- [ ] Manual audit: VoiceOver walks combat sensibly; TalkBack same.
- [ ] Reduce-motion respected.
- [ ] Font scale 200% does not break combat / character / inventory
      layouts (screenshots in PR).
- [ ] `npm test` and `npx tsc --noEmit` clean.

## Out of scope

- Localisation — see `BRAINDUMP.md`.
- Voice control — out of scope.
- Right-to-left layout — out of scope (no RTL locale planned).
