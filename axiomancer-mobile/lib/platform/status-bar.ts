/**
 * The Expo-decouple swap for the status bar (phase 47d). React
 * Native ships `StatusBar` in core — no separate package, no native
 * autolinking, always present. `expo-status-bar`'s own web
 * implementation (`StatusBar.web.ts`) was already a pure no-op
 * (`function StatusBar() { return null; }`, every imperative setter a
 * no-op) matching react-native-web's own `StatusBar` stub byte for
 * byte, so this swap is a zero-behavior-change no-op on web, the only
 * end-to-end-testable platform here. The one call site
 * (`app/_layout.tsx`) moved its `style="light"` prop to the core
 * component's `barStyle="light-content"` equivalent — see phase 47d
 * brief "Decisions".
 */
export { StatusBar } from 'react-native';
