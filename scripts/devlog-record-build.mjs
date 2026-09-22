#!/usr/bin/env node
// scripts/devlog-record-build.mjs — record the newest Android preview build in
// devlog/builds.json so the public DevLog can offer it.
//
// USAGE (after an EAS preview build finishes):
//   npm run devlog:record-build
//
// WHAT IT DOES
//   1. Asks EAS for the newest finished Android `preview` build
//      (`eas build:list --json`; needs EXPO_TOKEN or a logged-in eas-cli).
//   2. Measures the APK's download size with a HEAD request, so the site can
//      warn a player on mobile data. A failed measurement records `null`.
//   3. Prepends it to devlog/builds.json unless that build is already there.
//
// It changes nothing else. Committing the ledger is the caller's job, and a
// changed devlog/builds.json is one of the Pages project's build watch paths,
// so merging it to main redeploys the site with the new link
// (docs/devlog-public-deploy.md, step 7).

import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { BUILDS_PATH, readBuilds, toBuildRecord, withRecord } from './devlog-builds.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const MOBILE = join(ROOT, 'axiomancer-mobile')

/**
 * The newest finished Android preview builds, straight from EAS.
 * @returns {object[]} EAS build objects, newest first
 */
const listPreviewBuilds = () =>
    JSON.parse(execFileSync(
        'npx',
        ['eas-cli', 'build:list', '--platform', 'android', '--build-profile', 'preview',
            '--status', 'finished', '--limit', '5', '--json', '--non-interactive'],
        { cwd: MOBILE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
    ))

/**
 * The APK's size in bytes, from a HEAD request. Never throws: an unmeasured
 * size is recorded as null and the site simply omits it.
 * @param {string} url
 * @returns {Promise<number | null>}
 */
const measureBytes = async (url) => {
    try {
        const res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
        const n = Number(res.headers.get('content-length'))
        return res.ok && Number.isFinite(n) && n > 0 ? n : null
    } catch {
        return null
    }
}

// ── main ────────────────────────────────────────────────────────────────────
const newest = listPreviewBuilds().map((b) => toBuildRecord(b)).find(Boolean)
if (!newest) {
    console.error('devlog-record-build: EAS reports no finished Android preview build with an APK — nothing recorded.')
    process.exit(1)
}

const record = { ...newest, sizeBytes: await measureBytes(newest.apkUrl) }
const { ledger, added } = withRecord(readBuilds(), record)

if (!added) {
    console.log(`devlog-record-build: build ${record.buildId} is already recorded — ${relative(ROOT, BUILDS_PATH)} unchanged.`)
    process.exit(0)
}

writeFileSync(BUILDS_PATH, `${JSON.stringify(ledger, null, 2)}\n`)
console.log(`devlog-record-build: recorded ${record.buildId} (${record.date}, commit ${record.commit}) -> ${relative(ROOT, BUILDS_PATH)}`)
