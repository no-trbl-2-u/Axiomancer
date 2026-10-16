#!/usr/bin/env node
// scripts/sentry-release.mjs
//
// EAS `eas-build-on-success` hook (package.json). Creates this build's Sentry
// release — the same name `app.config.ts` bakes into the app, so crash
// events land on it — and attaches the commit it was built from, so Sentry
// can show "first seen in this build" and suspect commits. The GitHub repo
// is already linked to the `sombersoft` org.
//
// Never fails a build: every problem is logged and the script exits 0. A
// build without SENTRY_AUTH_TOKEN (a fork, a local build) skips quietly.

import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { sentryReleaseFor, buildCommit } = require('../lib/sentryRelease.js');

const ORG = 'sombersoft';
const PROJECT = 'axiomancer-mobile';
const REPO = 'no-trbl-2-u/Miserere-mei-deus';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function main() {
    if (!process.env.SENTRY_AUTH_TOKEN) {
        console.log('[sentry-release] no SENTRY_AUTH_TOKEN; skipping');
        return;
    }
    const version = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8')).expo.version;
    const commit = buildCommit();
    const release = sentryReleaseFor(version, commit);
    if (!release) {
        console.log('[sentry-release] no build commit; skipping');
        return;
    }
    let cli;
    try {
        cli = require.resolve('@sentry/cli/bin/sentry-cli');
    } catch {
        console.log('[sentry-release] @sentry/cli not installed; skipping');
        return;
    }
    const run = (...args) => {
        const r = spawnSync(process.execPath, [cli, ...args], { stdio: 'inherit' });
        return r.status === 0;
    };
    const scope = ['--org', ORG, '--project', PROJECT];
    console.log(`[sentry-release] ${release} from ${commit}`);
    if (!run('releases', ...scope, 'new', release)) return;
    // A failed commit link still leaves a usable release, so carry on.
    run('releases', '--org', ORG, 'set-commits', release, '--commit', `${REPO}@${commit}`);
    run('releases', ...scope, 'finalize', release);
}

try {
    main();
} catch (e) {
    console.log(`[sentry-release] skipped: ${e instanceof Error ? e.message : e}`);
}
process.exit(0);
