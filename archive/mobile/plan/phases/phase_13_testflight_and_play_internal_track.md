# Phase 13 — TestFlight + Play Internal Track first cut

## Outcome

Ship production-ready EAS builds to TestFlight (iOS) and Play Internal Track (Android) for internal testing. Create store listing drafts with screenshots, metadata, and initial internal tester group setup.

## Why

**Unblocks:** internal testing feedback loop, final pre-launch validation. **Depends on:** all prior phases complete, app icon/splash finalized (phase 12), EAS Build deploy gate working (phase 11). **Critical path:** this phase completes the substrate build — `/iterate` takes over after for ongoing polish.

## EAS Build configurations (locked)

### Production profiles
- **iOS production:** `eas.json` profile targeting TestFlight distribution
- **Android production:** `eas.json` profile targeting Google Play Internal Track
- **Version management:** automated versioning via EAS Build
- **Code signing:** production certificates and provisioning profiles

### Build requirements
```json
{
  "build": {
    "production": {
      "ios": {
        "distribution": "store",
        "autoIncrement": "buildNumber"
      },
      "android": {
        "distribution": "store",
        "autoIncrement": "versionCode"
      }
    }
  }
}
```

## Store listing preparations

### iOS App Store Connect
- **App metadata:** title, subtitle, description, keywords
- **Screenshots:** required sizes for iPhone and iPad
- **App Store categories:** Games > Role Playing
- **Age rating:** appropriate content rating for TTRPG themes
- **Privacy policy:** local-only gameplay, no data collection
- **App Store Review guidelines compliance:** dark themes, simulated combat

### Google Play Console
- **App details:** title, short/full description, screenshots
- **Store categories:** Games > Role Playing
- **Content rating:** ESRB/PEGI equivalent for fantasy combat
- **Privacy policy:** same as iOS, local storage only
- **Release tracks:** Internal testing track setup

## Screenshot requirements

### iOS Screenshots
- **iPhone Pro Max (6.7"):** 1290x2796 main gameplay screens
- **iPhone (6.1"):** 1179x2556 same content scaled
- **iPad Pro (12.9"):** 2048x2732 if tablet layout exists
- **Required screens:** Combat, Character, Inventory, Exploration tabs

### Android Screenshots
- **Phone:** 1080x1920 minimum, prefer 1440x2560
- **Tablet:** 1920x1200 if tablet layout exists
- **Same content as iOS:** consistent cross-platform screenshots

## Internal testing setup

### TestFlight setup
- **Internal testers:** development team + key stakeholders
- **Testing groups:** "Internal" group with automatic build distribution
- **Beta app information:** testing focus areas, known limitations
- **Feedback collection:** TestFlight's built-in feedback system

### Play Internal Track
- **Internal testers:** same team as TestFlight for consistency
- **Release management:** staged rollout to internal track
- **Testing notes:** version highlights, focus areas for testing
- **Feedback channels:** internal testing group coordination

## Implementation approach

### EAS Build production setup
1. **Certificate validation:** ensure production certificates are current
2. **Build profiles:** verify production profiles in eas.json
3. **Environment variables:** production-appropriate settings
4. **Build triggers:** manual builds for this initial release

### Store listing creation
1. **Content gathering:** app description, feature highlights
2. **Screenshot capture:** iOS Simulator and Android emulator screenshots
3. **Metadata optimization:** keywords, categories, age ratings
4. **Privacy policy:** simple local-only gameplay statement

### Tester invitation workflow
1. **Team roster:** compile internal testing team list
2. **Access provisioning:** TestFlight and Play Console access
3. **Communication:** testing guidelines and feedback expectations
4. **Version management:** coordinate testing across both platforms

## Files to create/modify

### Store assets
- `store-assets/ios/screenshots/` — iPhone/iPad screenshots in required sizes
- `store-assets/android/screenshots/` — Android phone/tablet screenshots
- `store-assets/metadata/app-description.md` — unified app description
- `store-assets/metadata/keywords.md` — App Store keywords
- `store-assets/metadata/privacy-policy.md` — local-only privacy policy

### Documentation
- `docs/testing-guide.md` — internal testing instructions and feedback workflows
- `docs/store-submission-checklist.md` — pre-launch validation checklist
- `setup/03_store_setup.md` — App Store Connect and Play Console configuration

### Configuration updates
- `eas.json` — verify production build profiles are correct
- `app.json` — ensure version, name, and metadata are production-ready

## Asset creation approach

### Screenshot generation
Use iOS Simulator and Android emulator to capture authentic gameplay:
- **Populated game state:** progress through tutorial to show realistic gameplay
- **Clean UI:** ensure no debug overlays or development artifacts
- **Consistent branding:** AXM theme tokens visible throughout
- **Feature highlights:** showcase key gameplay mechanics in screenshots

### Metadata writing
- **App description:** highlight TTRPG mechanics, dark gothic theme, offline play
- **Keywords:** role playing, RPG, tabletop, character building, turn-based combat
- **Privacy emphasis:** local gameplay, no accounts, no data collection

## Cross-links

**In (verify):** No routes to verify — binary distribution only.
**Out (ship):** No new navigation — external store distribution.
**Retro-fit:** N/A — store submission process only.

## Tests

### Pre-submission validation
- `__tests__/store-submission.test.js` — validate required store assets exist
- Test app.json production configuration completeness
- Verify EAS Build production profiles generate valid binaries
- Screenshot dimension and format validation

### Build verification
- Production EAS builds complete successfully for both platforms
- Binary size within platform limits (iOS <4GB, Android <150MB)
- App icons and splash screens render correctly in production builds
- All required permissions and entitlements are properly configured

### Store readiness
- App Store Connect draft listing saves without validation errors
- Google Play Console draft listing passes automated checks
- Privacy policy accessible and compliant with platform requirements
- Age ratings appropriate for TTRPG content with simulated combat

## Error handling

### Build failures
- EAS Build errors: validate certificates, provisioning, and build configuration
- Binary validation: address platform-specific compliance issues
- Distribution failures: check store developer account status and agreements

### Store listing issues
- Metadata rejection: ensure compliance with platform content policies
- Screenshot requirements: verify all required sizes and formats provided
- Privacy policy: address platform-specific privacy requirement compliance

## Decisions made upfront — DO NOT ASK

1. **Internal testing first:** Start with internal teams before external beta testing
2. **Simultaneous platform launch:** Deploy iOS and Android builds in parallel
3. **Store listing drafts:** Create complete but unpublished listings ready for review
4. **Manual build triggers:** Initial production builds are manually triggered, not automated
5. **Local screenshot capture:** Use simulators/emulators rather than device screenshots
6. **Minimal privacy policy:** Simple statement reflecting local-only, no-account gameplay
7. **Standard categories:** Games > Role Playing for both platforms
8. **Version 1.0.0:** Launch version follows semantic versioning from current development

## Verify gate

```bash
npm run verify  # lint + tsc + jest must pass
```

Store asset validation tests must verify all required screenshots and metadata files exist.

## Deploy gate

```bash
npm run deploy:check  # EAS Build must complete successfully
```

Production builds for both platforms must generate without errors.

## Commit body template

```
feat: TestFlight + Play Internal Track first cut — phase 13

- Production EAS builds for iOS TestFlight and Android Play Internal Track
- Store listing drafts with screenshots, metadata, and privacy policies
- Internal testing setup with team access and feedback workflows
- Store asset validation and pre-submission testing infrastructure
- Documentation for testing guidelines and store submission process

Decisions:
- Internal testing phase before external beta per cautious launch approach
- Simultaneous iOS/Android distribution for platform parity testing
- Simulator/emulator screenshots over device captures for consistency
- Manual production builds initially over automated triggering
- Minimal privacy policy reflecting local-only gameplay architecture

Manual verification: production builds install and launch correctly on TestFlight and Play Internal Track with proper store metadata display.
```

## DoD

After verify + commit + push:
1. Flip Phase 13 `[ ]` → `[x]` in `plan/steps/01_build_plan.md`
2. Add commit hash to phase log
3. Submit production EAS builds to both platforms
4. Verify TestFlight and Play Internal Track distribution works
5. Confirm internal testers can access and install builds
6. Validate store listings display correctly in platform dashboards

## Follow-ups (out of scope)

- External beta testing with broader audience
- Public App Store and Google Play release
- Marketing asset creation for store optimization
- Customer support documentation and feedback channels
- Analytics implementation for production usage tracking
- Automated build and release pipeline setup