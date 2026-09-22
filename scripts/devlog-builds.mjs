// scripts/devlog-builds.mjs — the playable-build ledger the public DevLog links.
//
// WHAT THIS IS
//   `devlog/builds.json` records every Android preview build that has been
//   offered to players: when it finished, which commit it was built from, and
//   where to download it. The public site (scripts/build-devlog-public.mjs)
//   reads the NEWEST record and renders a "Play the latest build" band on the
//   landing page. `scripts/devlog-record-build.mjs` is the only writer.
//
// WHY A COMMITTED FILE, NOT A LIVE LOOKUP
//   The site is built by Cloudflare Pages, which holds no Expo credentials
//   (docs/devlog-public-deploy.md). It can only publish what the tree already
//   says. Recording the build in the tree also keeps a history of every build
//   ever offered, and makes the record reviewable in a PR.
//
// WHY A LINK, NOT THE FILE
//   The APK is ~100 MiB; Cloudflare Pages refuses any single file over
//   25 MiB (https://developers.cloudflare.com/pages/platform/limits/). The
//   site links Expo's artifact URL, which serves the APK without a login.
//
// SHAPE (newest first; the file is append-at-the-front, never rewritten):
//   {
//     "$comment": "...",
//     "android": [
//       { "date", "finishedAt", "buildId", "profile", "commit",
//         "appVersion", "apkUrl", "buildPageUrl", "sizeBytes" }
//     ]
//   }
//
// Everything here is pure (no I/O) except `readBuilds`, which only reads.

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Repository root, resolved from this file's own location. */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Where the ledger lives. Inside devlog/ so the site's own tree owns it. */
export const BUILDS_PATH = join(ROOT, 'devlog', 'builds.json')

/** The Expo account and project the builds belong to (axiomancer-mobile/app.json). */
export const EXPO_OWNER = 'no.trbl.2.u'
export const EXPO_SLUG = 'axiomancer-mobile'

/** The explanatory header every written ledger carries, so a reader of the raw file knows its rules. */
export const LEDGER_COMMENT =
    'Playable-build ledger for the public DevLog. Written only by scripts/devlog-record-build.mjs; ' +
    'newest first; never edit or delete a past record. See scripts/devlog-builds.mjs.'

/** An empty ledger — the starting point when the file does not exist yet. */
export const emptyLedger = () => ({ $comment: LEDGER_COMMENT, android: [] })

/**
 * A record is publishable only if every field a reader will see is present
 * and both links are https. A malformed record is skipped, never half-rendered.
 *
 * @param {unknown} record - one element of `android`
 * @returns {boolean} true when the record can be shown to a player
 */
export const isValidRecord = (record) =>
    Boolean(record) &&
    typeof record === 'object' &&
    /^\d{4}-\d{2}-\d{2}$/.test(record.date ?? '') &&
    typeof record.buildId === 'string' && record.buildId.length > 0 &&
    typeof record.apkUrl === 'string' && record.apkUrl.startsWith('https://') &&
    typeof record.buildPageUrl === 'string' && record.buildPageUrl.startsWith('https://')

/**
 * Parse the ledger's text. Anything unreadable degrades to an empty ledger —
 * the site then simply shows no play band, rather than failing the build.
 *
 * @param {string} text - raw JSON
 * @returns {{ $comment: string, android: object[] }}
 */
export const parseBuilds = (text) => {
    try {
        const doc = JSON.parse(text)
        return { ...emptyLedger(), ...doc, android: Array.isArray(doc?.android) ? doc.android : [] }
    } catch {
        return emptyLedger()
    }
}

/**
 * Read the ledger from disk (the module's only I/O).
 *
 * @param {string} [path] - defaults to devlog/builds.json
 * @returns {{ $comment: string, android: object[] }} an empty ledger when the file is absent
 */
export const readBuilds = (path = BUILDS_PATH) =>
    existsSync(path) ? parseBuilds(readFileSync(path, 'utf8')) : emptyLedger()

/**
 * The build the site offers: the first VALID record (the ledger is newest-first).
 *
 * @param {{ android: object[] }} ledger
 * @returns {object | null} null when nothing is publishable
 */
export const latestAndroid = (ledger) => ledger.android.find(isValidRecord) ?? null

/**
 * Expo's build page for a build — the page with the QR code and install button.
 *
 * @param {string} buildId - the EAS build id
 * @returns {string} an https URL
 */
export const buildPageUrl = (buildId) =>
    `https://expo.dev/accounts/${EXPO_OWNER}/projects/${EXPO_SLUG}/builds/${buildId}`

/**
 * Turn one entry of `eas build:list --json` into a ledger record.
 * Returns null for anything that is not a finished Android build with an APK,
 * so the recorder can never write a build a player cannot install.
 *
 * @param {object} easBuild - one element of the EAS CLI's JSON output
 * @param {{ sizeBytes?: number | null }} [extra] - measured download size, when known
 * @returns {object | null}
 */
export const toBuildRecord = (easBuild, { sizeBytes = null } = {}) => {
    const apkUrl = easBuild?.artifacts?.buildUrl ?? easBuild?.artifacts?.applicationArchiveUrl ?? ''
    const finishedAt = easBuild?.completedAt ?? ''
    if (easBuild?.status !== 'FINISHED' || easBuild?.platform !== 'ANDROID' || !apkUrl.endsWith('.apk') || !finishedAt) {
        return null
    }
    return {
        date: finishedAt.slice(0, 10),
        finishedAt,
        buildId: easBuild.id,
        profile: easBuild.buildProfile ?? 'preview',
        commit: (easBuild.gitCommitHash ?? '').slice(0, 7),
        appVersion: easBuild.appVersion ?? '',
        apkUrl,
        buildPageUrl: buildPageUrl(easBuild.id),
        sizeBytes: Number.isFinite(sizeBytes) ? sizeBytes : null,
    }
}

/**
 * Add a record to the front of the ledger. Idempotent: a build already
 * recorded (same buildId) leaves the ledger unchanged, so re-running the
 * recorder after the same build is safe.
 *
 * @param {{ android: object[] }} ledger
 * @param {object} record - from toBuildRecord
 * @returns {{ ledger: object, added: boolean }} a NEW ledger object; the input is not mutated
 */
export const withRecord = (ledger, record) =>
    ledger.android.some((r) => r?.buildId === record.buildId)
        ? { ledger, added: false }
        : { ledger: { ...ledger, $comment: LEDGER_COMMENT, android: [record, ...ledger.android] }, added: true }

/**
 * "101 MB" — the download size a player on mobile data should see before
 * tapping. Decimal megabytes, because that is what phones show.
 *
 * @param {number | null} bytes
 * @returns {string} empty when unknown
 */
export const formatSize = (bytes) => (Number.isFinite(bytes) && bytes > 0 ? `${Math.round(bytes / 1e6)} MB` : '')
