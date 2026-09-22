#!/usr/bin/env node
// scripts/check-devlog-public-live.mjs — the post-deploy proof.
//
//   node scripts/check-devlog-public-live.mjs https://<project>.pages.dev
//   DEVLOG_PUBLIC_URL=https://… node scripts/check-devlog-public-live.mjs
//
// In the spirit of `scripts/deploy-check.mjs`: after a deploy, prove the thing
// that was supposed to happen actually happened. Three assertions, each chosen
// because it fails differently:
//
//   1. the LANDING page serves, and names the game          (the site is up)
//   2. the NEWEST POST serves, and carries its own title    (the build is current)
//   3. the CATALOG serves, and carries a card plate         (the catalog shipped)
//   4. the FEED serves as XML                               (the machine half works)
//   5. when devlog/builds.json offers a build: the landing links THAT build's
//      APK, and the APK still downloads    (an Expo artifact can expire; a dead
//      download button is the worst thing a stranger can find on the page)
//
// A stale deploy passes (1) and fails (2) — which is the failure this check
// exists for, because a Pages project that silently stops rebuilding looks
// perfectly healthy from the front page.
//
// Exit codes: 0 all good; 1 a check failed; 3 config/usage.

import { readEntries } from './build-devlog-public.mjs'
import { latestAndroid, readBuilds } from './devlog-builds.mjs'

const BASE = (process.argv[2] || process.env.DEVLOG_PUBLIC_URL || '').replace(/\/$/, '')
const TIMEOUT_MS = Number(process.env.DEVLOG_PUBLIC_TIMEOUT_MS ?? 20000)

if (!BASE) {
    console.error('usage: check-devlog-public-live.mjs <url>   (or set DEVLOG_PUBLIC_URL)')
    console.error('The URL is recorded in docs/devlog-public-deploy.md once the project exists.')
    process.exit(3)
}

/** Fetch one path, with a timeout, and return { ok, status, body }. */
async function get(path) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
        const response = await fetch(`${BASE}${path}`, { signal: controller.signal })
        return { ok: response.ok, status: response.status, body: await response.text() }
    } catch (error) {
        return { ok: false, status: 0, body: '', error: error.message }
    } finally {
        clearTimeout(timer)
    }
}

const failures = []
const check = (name, condition, detail = '') => {
    if (condition) console.log(`  ok    ${name}`)
    else {
        console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
        failures.push(name)
    }
}

const newest = readEntries()[0]
if (!newest) {
    console.error('check-devlog-public-live: no entries in this tree to check against')
    process.exit(3)
}

console.log(`check-devlog-public-live: ${BASE}`)

const landing = await get('/')
check('the landing page serves', landing.ok, landing.error || `HTTP ${landing.status}`)
check('the landing page names the game', /Miserere Mei, Deus/.test(landing.body))

const post = await get(`/log/${newest.date}/`)
check(`the newest post (${newest.date}) serves`, post.ok, post.error || `HTTP ${post.status}`)
// The title proves the deploy is CURRENT, not merely alive.
check('the newest post carries its own title', post.body.includes(newest.title.replace(/…$/, '')))
check('the newest post carries its why', /Why it changed/.test(post.body))

const catalog = await get('/catalog/')
check('the catalog serves', catalog.ok, catalog.error || `HTTP ${catalog.status}`)
check('the catalog carries card plates', /class="plate /.test(catalog.body))

const feed = await get('/feed.xml')
check('the feed serves', feed.ok, feed.error || `HTTP ${feed.status}`)
check('the feed is an Atom document', /<feed[^>]*xmlns="http:\/\/www\.w3\.org\/2005\/Atom"/.test(feed.body))

// 5. The playable build — only when the tree offers one (devlog/builds.json).
const offered = latestAndroid(readBuilds())
if (offered) {
    check(`the landing offers the latest build (${offered.date})`, landing.body.includes(offered.apkUrl))
    /** HEAD the APK itself: a 200 with a body length proves the download works without a login. */
    const apk = await fetch(offered.apkUrl, { method: 'HEAD', redirect: 'follow' }).catch((e) => ({ ok: false, status: e.message }))
    check('the offered APK still downloads', apk.ok, `HTTP ${apk.status}`)
}

if (failures.length) {
    console.error(`\ncheck-devlog-public-live: ${failures.length} check(s) failed.`)
    process.exit(1)
}
console.log('\ncheck-devlog-public-live: the public DevLog is live and current.')
