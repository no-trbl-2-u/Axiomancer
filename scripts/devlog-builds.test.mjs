#!/usr/bin/env node
// scripts/devlog-builds.test.mjs — the playable-build ledger's contract.
//
// Pins the promises scripts/devlog-builds.mjs makes:
//   - only a FINISHED Android build with an .apk ever becomes a record
//   - recording is idempotent (same buildId twice changes nothing)
//   - the ledger is newest-first and the input is never mutated
//   - a malformed or missing ledger degrades to "no build", never a crash
//   - the landing band renders only for a valid record, links the APK
//     directly, and never links Expo's (possibly login-walled) build page

import test from 'node:test'
import assert from 'node:assert/strict'

import {
    buildPageUrl, emptyLedger, formatSize, isValidRecord, latestAndroid,
    parseBuilds, toBuildRecord, withRecord,
} from './devlog-builds.mjs'
import { playBandHtml } from './build-devlog-public.mjs'

/** A minimal `eas build:list --json` element, overridable per case. */
const easBuild = (over = {}) => ({
    id: 'b-1',
    status: 'FINISHED',
    platform: 'ANDROID',
    buildProfile: 'preview',
    completedAt: '2026-09-22T18:09:55.207Z',
    gitCommitHash: 'c6de91a0123456789',
    appVersion: '1.0.0',
    artifacts: { buildUrl: 'https://expo.dev/artifacts/eas/x.apk' },
    ...over,
})

test('toBuildRecord maps a finished Android APK build to a valid record', () => {
    const r = toBuildRecord(easBuild(), { sizeBytes: 106287034 })
    assert.equal(r.date, '2026-09-22')
    assert.equal(r.commit, 'c6de91a')
    assert.equal(r.apkUrl, 'https://expo.dev/artifacts/eas/x.apk')
    assert.equal(r.buildPageUrl, buildPageUrl('b-1'))
    assert.equal(r.sizeBytes, 106287034)
    assert.ok(isValidRecord(r))
})

test('toBuildRecord refuses anything a player could not install', () => {
    assert.equal(toBuildRecord(easBuild({ status: 'ERRORED' })), null)
    assert.equal(toBuildRecord(easBuild({ platform: 'IOS' })), null)
    assert.equal(toBuildRecord(easBuild({ artifacts: { buildUrl: 'https://expo.dev/a.aab' } })), null)
    assert.equal(toBuildRecord(easBuild({ completedAt: null })), null)
})

test('withRecord prepends, is idempotent, and does not mutate its input', () => {
    const first = toBuildRecord(easBuild({ id: 'old' }))
    const second = toBuildRecord(easBuild({ id: 'new' }))
    const start = emptyLedger()

    const a = withRecord(start, first)
    assert.equal(a.added, true)
    assert.equal(start.android.length, 0, 'input ledger must not be mutated')

    const b = withRecord(a.ledger, second)
    assert.deepEqual(b.ledger.android.map((r) => r.buildId), ['new', 'old'], 'newest first')

    const c = withRecord(b.ledger, second)
    assert.equal(c.added, false)
    assert.equal(c.ledger, b.ledger, 'a repeat record returns the same ledger')
})

test('parseBuilds and latestAndroid degrade to no build on bad input', () => {
    assert.equal(latestAndroid(parseBuilds('not json')), null)
    assert.equal(latestAndroid(parseBuilds('{"android": "nope"}')), null)
    const skipsBad = parseBuilds(JSON.stringify({
        android: [{ date: 'bad' }, toBuildRecord(easBuild({ id: 'good' }))],
    }))
    assert.equal(latestAndroid(skipsBad).buildId, 'good', 'first VALID record wins')
})

test('formatSize prints decimal megabytes, or nothing when unknown', () => {
    assert.equal(formatSize(106287034), '106 MB')
    assert.equal(formatSize(null), '')
    assert.equal(formatSize(0), '')
})

test('playBandHtml links the APK directly and never the Expo build page', () => {
    assert.equal(playBandHtml(null), '')
    const html = playBandHtml(toBuildRecord(easBuild(), { sizeBytes: 106287034 }))
    assert.match(html, /href="https:\/\/expo\.dev\/artifacts\/eas\/x\.apk"/)
    assert.match(html, /Download for Android \(106 MB\)/)
    assert.match(html, /Android only/)
    assert.doesNotMatch(html, /\/builds\//, 'the build page may need a login; the public page must not link it')
})
