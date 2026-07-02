import '@testing-library/jest-native/extend-expect';

jest.mock('expo-font', () => ({
    useFonts: () => [true, null],
    isLoaded: () => true,
}));

jest.mock('expo-splash-screen', () => ({
    preventAutoHideAsync: () => Promise.resolve(),
    hideAsync: () => Promise.resolve(),
    setOptions: () => undefined,
}));

jest.mock('expo-haptics', () => ({
    impactAsync: () => Promise.resolve(),
    notificationAsync: () => Promise.resolve(),
    selectionAsync: () => Promise.resolve(),
    ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
    NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

require('react-native-reanimated/mock');

// AsyncStorage's native module isn't available in a Jest-Node
// environment; route every consumer through the package's official
// in-memory mock. Persistence-specific suites still scope cleanup
// via `AsyncStorage.clear()` in their own afterEach.
jest.mock('@react-native-async-storage/async-storage', () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// `@/lib/buildProfile` reads `Constants.expoConfig.extra.devToolsEnabled`
// (set by `app.config.ts` from `EAS_BUILD_PROFILE`). Under Jest that
// signal isn't present and we want the existing `__DEV__`-toggling
// suite contracts (DevMenu, Debug*, AestheticDevToggle, DevAutoSeed)
// to keep working, so route the helper directly to the same global
// flag those suites already swap.
jest.mock('@/lib/buildProfile', () => ({
    isDevToolsEnabled: () => (globalThis as { __DEV__?: boolean }).__DEV__ !== false,
    getBuildProfile: () => null,
}));
