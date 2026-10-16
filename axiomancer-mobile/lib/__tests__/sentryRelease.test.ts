/**
 * lib/sentryRelease — one Sentry release per build commit.
 */

import { describe, expect, it } from '@jest/globals';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { sentryReleaseFor, buildCommit } = require('@/lib/sentryRelease.js') as typeof import('@/lib/sentryRelease.js');

describe('sentryReleaseFor', () => {
    it('names the release after the version and the short commit', () => {
        expect(sentryReleaseFor('1.0.0', '5085B096BDFD4895E83C3A81122B1183FA39C678')).toBe('com.axiomancer.mobile@1.0.0+5085b09');
    });

    it('is null without a version or a commit', () => {
        expect(sentryReleaseFor('1.0.0', null)).toBeNull();
        expect(sentryReleaseFor(undefined, '5085b096b')).toBeNull();
    });

    it('rejects anything that is not a git sha', () => {
        expect(sentryReleaseFor('1.0.0', 'main')).toBeNull();
        expect(sentryReleaseFor('1.0.0', '50 85b09')).toBeNull();
    });
});

describe('buildCommit', () => {
    it('prefers the EAS builder commit, then GitHub, then nothing', () => {
        expect(buildCommit({ EAS_BUILD_GIT_COMMIT_HASH: 'aaa1111', GITHUB_SHA: 'bbb2222' })).toBe('aaa1111');
        expect(buildCommit({ GITHUB_SHA: 'bbb2222' })).toBe('bbb2222');
        expect(buildCommit({})).toBeNull();
    });
});
