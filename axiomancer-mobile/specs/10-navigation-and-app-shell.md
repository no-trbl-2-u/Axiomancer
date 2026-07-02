# Spec 10 — Navigation and App Shell

## Goal

Polish the Expo Router shell: deep links, back-button behaviour, tab
badges, route guards (e.g. you cannot open the combat tab when no
combat is active), and a shared header / status bar treatment.

**Success state:** The five tabs (`exploration`, `combat`, `character`,
`inventory`, `event`) behave like a real shipped app — disabled / hidden
when irrelevant, badged when there's something new, and recoverable
on cold start to the right screen.

## Why now / dependencies

- **Unblocks:** the app feels finished.
- **Depends on:** Specs 04–08 (every screen wired through a presenter).

## Current state

- `app/_layout.tsx` is the root Stack, mounting `(tabs)` and
  `index.tsx` (which redirects to exploration).
- `app/(tabs)/_layout.tsx` is the Tabs layout with five screens, each
  using inline SVG icons (placeholders per `SVG_ASSET_SPEC.md`
  section 10).
- No deep-link configuration. No tab badges. No route guards.
- `app/index.tsx` redirects unconditionally to `/exploration`.

## Open questions

1. **Tab availability.** Should "Combat" / "Event" tabs disappear
   when not in combat / no active event?
   - (A) **(default)** Hidden when inactive — the tab bar adapts.
   - (B) Always visible; show a "no combat in progress" empty state.
   - (C) Always visible but disabled (greyed, untappable).
   > Your answer: A

2. **Cold-start route.** On launch:
   - (A) **(default)** Route to whatever screen matches the engine's
     current state (combat → combat tab, event → event tab, else
     exploration).
   - (B) Always exploration; the user navigates from there.
   > Your answer: A

3. **Tab badges.** Mock has none. Add:
   - (A) **(default)** New event → badge on Event tab. Level-up
     ready → badge on Character tab.
   - (B) None.
   > Your answer:A

4. **Deep links.** Should
   `axiomancer://event/<eventId>` deep link straight to a chosen
   event (useful for QA + bug reports)?
   - (A) **(default)** Yes — read-only deep links for events and
     character sheet.
   - (B) No — deep links are out of scope.
   > Your answer: A

5. **Back-button behaviour.** Android hardware back during combat:
   - (A) **(default)** Disabled — combat is modal.
   - (B) Pops to exploration but combat state retained.
   - (C) Confirm-via-modal "abandon combat?".
   > Your answer: A

6. **Status bar.** Today `<StatusBar style="light" />` is set once
   in the root. Should it adapt per screen (event scenes go
   translucent over a full-bleed illustration, e.g.)?
   > Your answer: I don't know

## Proposed approach

1. **Extend the store provider** (Spec 02) to expose
   `selectActiveTab` (driven by `state.combat`, any future engine-pinned
   pending-narrative / event slice Spec 08 wires to, etc.).
2. **Tab guard component** — wraps `Tabs.Screen`s; hides / disables
   per Q1.
3. **Cold-start router** — `app/index.tsx` reads engine state and
   redirects per Q2.
4. **Deep link handler** per Q4.
5. **Hermetic e2e** at `state/e2e/navigation.engine.test.ts`:
   - Active combat → `selectActiveTab` returns `'combat'`.
   - Active event → returns `'event'`.
   - Otherwise → `'exploration'`.

## Acceptance checklist

- [ ] All 6 questions answered.
- [ ] Cold-start routing matches engine state.
- [ ] Tab badges / hide / disable per Q1, Q3.
- [ ] Deep links round-trip (if Q4 = A).
- [ ] Hermetic e2e green; `npx tsc --noEmit` clean.

## Out of scope

- Push-notification routing — future spec.
- Modal sheets vs. full-screen routing decisions per screen — covered
  by each screen's own spec.