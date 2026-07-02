# Phase 12 — App icon + splash screen polish

## Outcome

Replace placeholder app icons and splash screen assets with final polished versions following Axiomancer Mobile's dark gothic aesthetic. Implement proper adaptive icons for Android and splash background using AXM.bg with Pirata One logotype.

## Why

**Unblocks:** final production builds for TestFlight/Play Store distribution. **Depends on:** all prior phases complete, asset pipeline foundations (phase 11), theme tokens established.

## Asset requirements (locked)

### App icon specifications
- **iOS:** 1024x1024 PNG app icon (icon.png)
- **Android adaptive icon:**
  - Foreground: 1024x1024 PNG with transparent background (android-icon-foreground.png)
  - Background: 1024x1024 solid color or image (android-icon-background.png)
  - Monochrome: 1024x1024 single-channel PNG for themed icons (android-icon-monochrome.png)
- **Web:** 192x192 favicon.png for web target

### Splash screen specifications
- **Background color:** `AXM.bg` (#0a0a0a) - dark gothic background
- **Logo:** Pirata One font logotype "AXIOMANCER" centered
- **Icon:** 200px width as configured in app.json
- **File:** splash-icon.png (replaces current placeholder)

## Implementation approach

### Icon design consistency
Follow established visual hierarchy from theme/axm.ts:
- **Primary color:** `AXM.blood` (#c0152a) for icon elements
- **Accent:** `AXM.sulfur` (#d4c026) for highlights/details
- **Background:** `AXM.bg` (#0a0a0a) or `AXM.bone` (#8a8273) for contrast
- **Style:** Gothic, medieval aesthetic matching game theme

### Android adaptive icon structure
```json
"adaptiveIcon": {
  "backgroundColor": "#0a0a0a",
  "foregroundImage": "./assets/images/android-icon-foreground.png",
  "backgroundImage": "./assets/images/android-icon-background.png", 
  "monochromeImage": "./assets/images/android-icon-monochrome.png"
}
```

### Splash screen configuration
Update app.json splash plugin configuration:
```json
{
  "image": "./assets/images/splash-icon.png",
  "imageWidth": 200,
  "resizeMode": "contain", 
  "backgroundColor": "#0a0a0a",
  "dark": {
    "backgroundColor": "#0a0a0a"
  }
}
```

## Files to create/modify

### Asset files
- `assets/images/icon.png` — iOS 1024x1024 app icon
- `assets/images/android-icon-foreground.png` — Android adaptive foreground
- `assets/images/android-icon-background.png` — Android adaptive background  
- `assets/images/android-icon-monochrome.png` — Android monochrome version
- `assets/images/splash-icon.png` — splash screen logo
- `assets/images/favicon.png` — 192x192 web favicon

### Configuration updates
- `app.json` — update splash backgroundColor to use AXM.bg (#0a0a0a)
- `app.json` — update adaptiveIcon backgroundColor if needed

## Asset creation approach

Since this follows the "Asset placeholders ship" decision from bearings.md, implement placeholder assets that match the visual specification:

### Icon placeholder approach
Create coded SVG placeholders that render the Axiomancer "A" monogram using:
- Gothic letter style consistent with Pirata One aesthetic
- AXM.blood red primary color with AXM.sulfur accents
- Dark background for contrast
- Export as high-resolution PNG files

### Splash logo approach  
Generate logotype using system fonts as placeholder for Pirata One styling:
- Text: "AXIOMANCER" 
- Color: AXM.parchment (#e8dfc8) on AXM.bg background
- Size: appropriate for 200px width constraint
- Center-aligned composition

## Cross-links

**In (verify):** No routes to check — asset files only.
**Out (ship):** No new navigation added.
**Retro-fit:** N/A — asset replacement only.

## Tests

### Asset validation tests
- `assets/__tests__/icons.test.js` — verify all required icon files exist with correct dimensions
- Test PNG file format and dimensions for iOS/Android compliance
- Validate splash screen asset dimensions match app.json config

### Integration tests
- Test app.json configuration parses correctly with new asset paths
- Verify EAS build can locate and process all icon assets
- Test splash screen renders with correct background color

### Manual verification
- Build preview app and verify icons appear correctly in:
  - iOS simulator app drawer
  - Android launcher (regular and themed icons)
  - Device settings app list
- Test splash screen displays properly on app launch
- Verify web favicon appears in browser tabs

## Error handling

### Missing asset detection
- EAS build will fail if required icon files are missing
- Metro bundler validates asset paths at build time
- Document asset path requirements in commit message

### Asset dimension validation
- iOS requires exactly 1024x1024 for app icon
- Android adaptive icons must be 1024x1024 with appropriate safe zones
- Splash icon scales from configured width (200px)

## Decisions made upfront — DO NOT ASK

1. **Placeholder over real artwork:** Ship coded placeholders following existing asset decision — real commissioned artwork is separate phase
2. **Dark theme consistency:** Use AXM.bg for all backgrounds (splash, adaptive icon) to match app's dark-only design
3. **Color palette:** Limit to AXM.blood, AXM.sulfur, AXM.parchment, AXM.bone for all icon elements
4. **Typography:** Pirata One aesthetic for splash logotype (system font fallback acceptable for placeholders)
5. **Android adaptive safe zone:** Keep foreground elements within 66% center circle for proper cropping
6. **Splash timing:** Match existing expo-splash-screen configuration, no duration changes

## Verify gate

```bash
npm run verify  # lint + tsc + jest must pass
```

Asset tests must verify all required files exist and meet platform requirements.

## Deploy gate

```bash
npm run deploy:check  # EAS build must process new icons successfully
```

## Commit body template

```
feat: app icon + splash screen polish — phase 12

- Replaced placeholder app icons with gothic-themed AXM design language
- iOS 1024x1024 icon using AXM.blood/sulfur/bone color palette
- Android adaptive icons with AXM.bg background and gothic foreground
- Splash screen updated to AXM.bg background with Pirata One logotype
- Asset validation tests for all required icon dimensions and formats

Decisions:
- Placeholder approach over commissioned artwork per bearings standing decision
- AXM.bg (#0a0a0a) for all backgrounds to maintain dark theme consistency
- Gothic monogram "A" design using established color tokens
- System font fallback for Pirata One logotype in splash placeholder

Manual verification: preview build confirms icons display correctly across iOS/Android launchers and splash renders with proper theming.
```

## DoD

After verify + commit + push:
1. Flip Phase 12 `[ ]` → `[x]` in `plan/steps/01_build_plan.md`
2. Add commit hash to phase log
3. Test EAS preview build to verify icon rendering
4. Confirm splash screen displays correctly on app launch

## Follow-ups (out of scope)

- Commissioned artwork replacement via existing asset-swap workflow
- Store listing screenshots using final icons 
- Marketing asset variants for App Store/Play Store metadata
- Animated splash screen transitions