# Phase 10 — Spec 12: Accessibility + theming polish

## Outcome

Make the app navigable by screen reader users and comfortable for accessibility settings like font scaling and reduced motion. Lock the theme system with typography and spacing scales.

## Why 

**Unblocks:** wider playtester reach, app-store accessibility requirements. **Depends on:** presenter layer (specs 04-08) must be in place for VM-based a11y labels.

## Theme system extensions (locked)

Extend `theme/axm.ts` with type and spacing scales per spec decisions:

### Typography scale
```typescript
export const TYPE = {
  display: { fontFamily: FONTS.gothic, fontSize: 32, lineHeight: 38, letterSpacing: 0.5 },
  h1: { fontFamily: FONTS.gothic, fontSize: 24, lineHeight: 30, letterSpacing: 0.3 },
  h2: { fontFamily: FONTS.serif, fontSize: 20, lineHeight: 26, letterSpacing: 0.2 },
  body: { fontFamily: FONTS.serif, fontSize: 16, lineHeight: 22, letterSpacing: 0 },
  caption: { fontFamily: FONTS.sans, fontSize: 14, lineHeight: 18, letterSpacing: 0.1 },
  mono: { fontFamily: FONTS.mono, fontSize: 14, lineHeight: 18, letterSpacing: 0 },
};
```

### Spacing scale
```typescript
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
```

## Accessibility implementation

Every interactive element gets `accessibilityRole` + `accessibilityLabel`. View models expose a11y strings alongside data.

### Presenter VM extensions
Each screen's view-model gains a11y label fields:
```typescript
// Example for combat VM
type CombatViewModel = {
  // existing fields...
  a11y: {
    stanceHeart: 'Choose Heart stance, beats Body',
    actionAttack: 'Attack with equipped weapon',
    skillRest: 'Rest action, recover 2 HP',
    // etc
  }
}
```

### Component accessibility pattern
Every `TouchableOpacity`/`Pressable`:
```tsx
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel={vm.a11y.stanceHeart}
  onPress={onHeartStance}
>
```

### Font scaling approach
Per spec Q5 answer C: display titles unscaled, body text scaled.
- Display headers: `allowFontScaling={false}`
- Body text, labels: `allowFontScaling={true}` (default)

### Reduced motion
Use `useReducedMotion` from Reanimated to skip animations when preference enabled.

## Files to create/modify

### Core theme extensions
- `theme/axm.ts` — add TYPE and SPACING exports

### Accessibility helpers
- `state/presenters/combat.engine.ts` — add a11y labels to VM
- `state/presenters/character.engine.ts` — add a11y labels to VM  
- `state/presenters/inventory.engine.ts` — add a11y labels to VM
- `state/presenters/exploration.engine.ts` — add a11y labels to VM
- `state/presenters/event.engine.ts` — add a11y labels to VM

### Screen updates
- `app/(tabs)/combat.tsx` — add accessibilityRole/Label to all interactive elements
- `app/(tabs)/character` folder — accessibility props
- `app/(tabs)/inventory` folder — accessibility props  
- `app/(tabs)/exploration` folder — accessibility props
- `app/(tabs)/event.tsx` — accessibility props

### Component updates
- `components/StatBar.tsx` — accessibility labels for HP/MP bars
- `components/StanceGlyph.tsx` — accessibility labels for stance buttons
- `components/EffectChip.tsx` — accessibility labels for status effects
- `components/SectionLabel.tsx` — proper heading roles

### Reanimated integration
- `hooks/useReducedMotion.ts` — wrapper for Reanimated hook
- Update any animated components to respect reduced motion

### Theme migration sweep
Replace hardcoded font sizes with `TYPE.*` throughout codebase:
- `fontSize: 16` → `TYPE.body.fontSize`
- `fontSize: 24` → `TYPE.h1.fontSize` 
- etc.

Replace hardcoded spacing with `SPACING.*`:
- `marginTop: 16` → `SPACING.md`
- `padding: 8` → `SPACING.sm`
- etc.

## Cross-links

**In (verify):** All existing screens link correctly post-theme-migration.
**Out (ship):** No new navigation added.
**Retro-fit:** N/A — no new routes.

## Tests

### Hermetic e2e additions
- `state/e2e/combat.engine.test.ts` — assert VM contains expected a11y fields
- `state/e2e/character.engine.test.ts` — assert a11y labels present
- `state/e2e/inventory.engine.test.ts` — assert a11y labels present  
- `state/e2e/exploration.engine.test.ts` — assert a11y labels present
- `state/e2e/event.engine.test.ts` — assert a11y labels present

### Component tests
- `components/__tests__/StatBar.test.tsx` — assert accessibility props rendered
- `components/__tests__/StanceGlyph.test.tsx` — assert accessibility labels
- `components/__tests__/SectionLabel.test.tsx` — assert proper heading role

## Manual audit checklist

Per spec requirements:
- [ ] VoiceOver walks combat screen sensibly (iOS)
- [ ] TalkBack navigation works (Android)  
- [ ] Font scale 200% does not break layouts
- [ ] Reduce motion disables all animations
- [ ] All interactive elements have accessibility labels

## Haptics implementation

Per spec Q7: Add haptics for crit/fumble in combat, node-enter in exploration.
- `expo-haptics` integration in combat resolve
- Node transition haptics in exploration

## Decisions made upfront — DO NOT ASK

All spec questions resolved:
1. **Type scale:** Yes — display/h1/h2/body/caption/mono with explicit properties
2. **Spacing scale:** Yes — xs/sm/md/lg/xl scale  
3. **Contrast:** Skip audit — stylized app, not banking
4. **Reduce motion:** Skip all transitions when on
5. **Font scaling:** Per-screen — displays unscaled, body scaled
6. **Dark/light:** Stay dark-only
7. **Haptics:** Crit/fumble + exploration node-enter

Theme migration is mechanical — no design decisions needed.

## Mobile considerations

Typography scale accounts for mobile readability. Spacing scale provides consistent touch targets. Font scaling option preserves hierarchy while enabling accessibility.

## Verify gate

```bash
npm run verify  # lint + tsc + jest must pass
```

All e2e tests must assert a11y fields present in VMs.

## Deploy gate  

```bash
npm run deploy:check  # stub, exits 0
```

## Commit body template

```
feat: accessibility + theming polish — phase 10

- Extended theme/axm.ts with TYPE and SPACING scales
- Added accessibilityRole + accessibilityLabel to all interactive elements  
- VM a11y labels in all 5 screen presenters
- Font scaling: display unscaled, body scaled
- Reduced motion support via useReducedMotion
- Theme migration sweep: replaced hardcoded sizes/spacing with tokens
- Haptics on crit/fumble and exploration transitions

Decisions:
- Per-screen font scaling approach over global setting
- Skip contrast audit per gothic app aesthetic
- Mechanical theme migration to new token system

Manual accessibility audit completed for VoiceOver + TalkBack + font scaling + reduced motion.
```

## DoD

After verify + commit + push:
1. Flip Phase 10 `[ ]` → `[x]` in `plan/steps/01_build_plan.md`
2. Add commit hash to phase log
3. Update Spec 12 status to `[DONE on <date>]`

## Follow-ups (out of scope)

- Localisation (deferred per `BRAINDUMP.md`)
- Voice control (out of scope)
- RTL layout (no RTL locale planned)
- Light mode (staying dark-only per design decision)