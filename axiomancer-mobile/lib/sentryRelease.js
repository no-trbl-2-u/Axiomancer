/**
 * The Sentry release name for one build — shared by `app.config.ts` (which
 * bakes it into `extra.sentryRelease`, read by `lib/monitoring.ts`) and
 * `scripts/sentry-release.mjs` (the EAS on-success hook that creates the
 * same release in Sentry with its commit attached).
 *
 * WHY. Every APK used to report as `com.axiomancer.mobile@1.0.0+1`: the app
 * version and the Android versionCode never change between preview builds,
 * so Sentry could not tell one build from the next — no regression on a new
 * build, no "first seen in", no suspect commit. The git commit EAS builds
 * from is the identity that does change, so it rides on the build number.
 *
 * Plain CommonJS so both a TS config and a Node ESM script can load it.
 */

const BUNDLE_ID = 'com.axiomancer.mobile';

/**
 * `com.axiomancer.mobile@<version>+<sha7>`, or null when no commit is known
 * (a local `expo start`, a fork's build), in which case the SDK keeps its
 * own default.
 * @param {string | undefined | null} version
 * @param {string | undefined | null} commit
 * @returns {string | null}
 */
function sentryReleaseFor(version, commit) {
    if (!version || !commit) return null;
    const sha = String(commit).trim().toLowerCase();
    if (!/^[0-9a-f]{7,40}$/.test(sha)) return null;
    return `${BUNDLE_ID}@${version}+${sha.slice(0, 7)}`;
}

/**
 * The commit this build is made from: EAS on the builder, GitHub in CI.
 * @param {Record<string, string | undefined>} [env]
 * @returns {string | null}
 */
function buildCommit(env = process.env) {
    return env.EAS_BUILD_GIT_COMMIT_HASH || env.GITHUB_SHA || null;
}

module.exports = { sentryReleaseFor, buildCommit, BUNDLE_ID };
