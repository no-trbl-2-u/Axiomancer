/**
 * The status bar seam. React Native ships `StatusBar` in core — no
 * separate package, no native autolinking, always present. On web it is
 * react-native-web's no-op stub. The one call site (`app/_layout.tsx`)
 * sets `barStyle="light-content"`.
 */
export { StatusBar } from 'react-native';
