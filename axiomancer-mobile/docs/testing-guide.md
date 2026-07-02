# Internal Testing Guide

> **Manual QA checklist for TestFlight and Play Internal Track builds.**
> For automated testing standards, see [`docs/testing.md`](./testing.md).

## Testing Focus Areas

### Core Functionality
- [ ] App launches without crashes on first install
- [ ] All tabs (Combat, Character, Inventory, Exploration, Event, Memoir) are accessible
- [ ] Navigation between screens works smoothly
- [ ] Game state persists correctly between app sessions
- [ ] Combat mechanics function as expected
- [ ] Character stats and progression display correctly
- [ ] Inventory management and item interactions work
- [ ] Exploration and map navigation function properly

### Performance Testing
- [ ] App startup time is acceptable (< 3 seconds on average device)
- [ ] Smooth scrolling and animations
- [ ] No memory leaks during extended play sessions
- [ ] Battery usage within expected range for gaming apps
- [ ] App responds quickly to user input

### Platform-Specific Testing

#### iOS (TestFlight)
- [ ] App icon displays correctly in iOS home screen
- [ ] Splash screen renders properly on launch
- [ ] Dark theme respects system settings
- [ ] Hardware back button behavior (if applicable)
- [ ] Multitasking and background app behavior
- [ ] Screenshot prevention (if implemented)

#### Android (Play Internal Track)  
- [ ] Adaptive icon displays correctly in launcher
- [ ] Splash screen renders properly on launch
- [ ] Edge-to-edge display and gesture navigation work correctly
- [ ] Hardware back button behavior matches design
- [ ] App handles system theme changes gracefully
- [ ] Proper behavior with Android's predictive back gesture

### User Experience Testing
- [ ] Tutorial/onboarding flow is clear and helpful
- [ ] UI elements are appropriately sized for touch interaction
- [ ] Text is readable and properly scaled
- [ ] Error states are handled gracefully
- [ ] Accessibility features work as expected

## Feedback Collection

### What to Report
1. **Crashes**: Include device model, OS version, and steps to reproduce
2. **Performance Issues**: Note specific scenarios where lag or slowdown occurs
3. **UI/UX Problems**: Screenshot + description of unexpected behavior
4. **Gameplay Issues**: Any mechanics that don't work as expected
5. **Suggestions**: Ideas for improvements or missing features

### Feedback Channels
- **TestFlight**: Use built-in TestFlight feedback system for iOS
- **Internal Slack**: #mobile-testing channel for quick issues
- **Email**: Report bugs through GitHub Issues for tracking and visibility
- **Github Issues**: For reproducible bugs that need tracking

### Bug Report Template
```
**Device**: iPhone 15 Pro / Pixel 8 Pro / etc.
**OS Version**: iOS 17.4 / Android 14 / etc.
**App Version**: [from TestFlight/Play Console]
**Issue**: Brief description
**Steps to Reproduce**:
1. Step one
2. Step two
3. Result

**Expected**: What should happen
**Actual**: What actually happened
**Screenshots**: If applicable
```

## Testing Schedule
- **Phase 1** (Week 1): Initial builds distributed, core functionality testing
- **Phase 2** (Week 2): Bug fixes, performance optimization testing  
- **Phase 3** (Week 3): Final validation, store submission preparation
- **Ongoing**: Regular updates based on feedback and findings

## Known Limitations (Current Build)
- Font loading may cause initial startup delay (~3 seconds on some devices)
- Some debug UI elements may be visible in development builds
- Performance optimizations for production builds are ongoing

## Testing Devices/Simulators
### iOS
- iPhone 15 Pro Max (latest iOS)
- iPhone 13 (iOS 16.x)
- iPad Pro 12.9" (if tablet layout exists)

### Android  
- Pixel 8 Pro (Android 14)
- Samsung Galaxy S23 (Android 13/14)
- OnePlus device (for OEM-specific testing)

## Contact Information
- **Technical Issues**: Create GitHub Issues for bug reports and feature requests
- **Process Questions**: Use #mobile-testing Slack channel for testing process clarification
- **Urgent Issues**: Tag critical issues with 'urgent' label in GitHub or escalate through Slack