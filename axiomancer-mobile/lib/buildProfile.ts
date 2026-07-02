import Constants from 'expo-constants';

type Extra = { devToolsEnabled?: boolean; buildProfile?: string | null };

// `extra.devToolsEnabled` is set by `app.config.ts` from
// `EAS_BUILD_PROFILE` (or `BUILD_PROFILE` for non-EAS web deploys):
// `false` only when the profile is `'production'`. Local dev
// without either env set falls through to `__DEV__`.
export function isDevToolsEnabled(): boolean {
  // e2e/screenshot escape hatch: a static `expo export` for web does NOT make
  // `Constants.expoConfig.extra` available at runtime (it's resolved from a
  // manifest the static server doesn't serve), so the BUILD_PROFILE=preview
  // bake never reaches `extra` and this falls through to `__DEV__` (false in an
  // export) — the dev-tools-link never mounts. A browser harness can opt back
  // in by setting `globalThis.__AXM_FORCE_DEV_TOOLS__ = true` via an init
  // script before boot. Inert in real builds: nothing sets the global there,
  // and `production` still hard-disables below via the `=== false` check.
  if ((globalThis as { __AXM_FORCE_DEV_TOOLS__?: boolean }).__AXM_FORCE_DEV_TOOLS__ === true) {
    const extra = Constants.expoConfig?.extra as Extra | undefined;
    if (extra?.devToolsEnabled === false) return false;
    return true;
  }
  const extra = Constants.expoConfig?.extra as Extra | undefined;
  if (extra?.devToolsEnabled === false) return false;
  if (extra?.devToolsEnabled === true) return true;
  return __DEV__;
}

export function getBuildProfile(): string | null {
  const extra = Constants.expoConfig?.extra as Extra | undefined;
  return extra?.buildProfile ?? null;
}
