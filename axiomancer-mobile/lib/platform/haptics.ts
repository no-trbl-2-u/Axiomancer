import * as Haptics from 'expo-haptics';

/**
 * The Expo-decouple seam for haptics (phase 47a). Re-exports the
 * imported namespace as a named binding (`import { Haptics } from
 * '@/lib/platform/haptics'`) rather than `export * from` / `export {}
 * from` — those re-export forms resolve `expo-haptics` via a plain
 * `require()`, bypassing the `import *` interop wrapper that Babel
 * applies (and caches by identity) whenever a module lacks
 * `__esModule` — true here in tests, where `jest.setup.ts` mocks
 * `expo-haptics` with a plain object literal. `jest.spyOn` in
 * `lib/juice/__tests__/haptics.test.ts` mutates that per-import
 * interop-wrapped copy, so any call site that reads the *raw* module
 * instead (as `export … from` does) silently misses the spy. Doing
 * the namespace import here — exactly like every pre-shim call site
 * did — reuses Babel's shared interop-wrapper cache and keeps spies
 * visible through the shim. Phase 47d owns the actual package swap.
 */
export { Haptics };
