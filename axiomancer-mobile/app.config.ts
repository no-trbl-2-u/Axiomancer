import type { ExpoConfig } from 'expo/config';

import appJson from './app.json';

// EAS sets `EAS_BUILD_PROFILE` to the active profile name during
// build. `BUILD_PROFILE` is an explicit override for web deploys
// (Netlify / Vercel / etc.) where EAS isn't involved.
//
// DEV menu / Debug* affordances render whenever the profile is
// anything other than 'production'. When no profile is set
// (e.g. a plain `expo start` local session), we leave
// `devToolsEnabled` undefined so `isDevToolsEnabled()` falls
// through to `__DEV__` — true in Metro dev server, false in
// production bundles. This prevents a production APK built
// without EAS_BUILD_PROFILE from accidentally receiving
// devToolsEnabled=true and running DevAutoSeed.
const buildProfile = process.env.EAS_BUILD_PROFILE ?? process.env.BUILD_PROFILE;
const devToolsEnabled = buildProfile != null ? buildProfile !== 'production' : undefined;

const expo = appJson.expo as ExpoConfig;

export default (): ExpoConfig => ({
  ...expo,
  extra: {
    ...(expo.extra ?? {}),
    // Only include when set — Expo's config merge converts a literal
    // null/undefined into `{}` which would defeat the `?? null`
    // fallback in `getBuildProfile()` and the `=== true/false` guards
    // in `isDevToolsEnabled()`.
    ...(devToolsEnabled !== undefined ? { devToolsEnabled } : {}),
    ...(buildProfile ? { buildProfile } : {}),
  },
});
