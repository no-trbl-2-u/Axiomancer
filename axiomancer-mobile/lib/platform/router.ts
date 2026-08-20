/**
 * The Expo-decouple seam for navigation (phase 47a). Every
 * application-source call site imports router hooks/components from
 * here instead of `expo-router` directly, so phase 47b's router swap
 * touches this one file instead of every screen.
 */
export { useRouter, useLocalSearchParams, usePathname, Redirect, Stack, Tabs } from 'expo-router';
