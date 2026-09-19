#!/usr/bin/env node
// scripts/exploration-combat-roundtrip-e2e.mjs
//
// Exploration <-> combat-prelude ROUND TRIP — browser-driven guard for
// the "FIGHT-modal-unmount class" (Phase 10).
//
// Commit a18ee12b fixed two linked bugs from one root cause: the
// encounter modal's mount condition and the tab bar's visibility/lock
// each read state that looked equivalent but wasn't, so a combat-prelude
// event could arm the modal without hiding the tab bar (or vice versa).
// `state/e2e/cross-screen-integration.engine.test.tsx` pins the fix at
// the Jest layer (real props handed to a mocked `<Tabs>`); this script
// proves the same contract holds as real rendered layout in a browser —
// the `display: 'none'` the Jest test asserts on has to actually hide
// the tab bar on screen, not just satisfy a prop assertion.
//
// Deterministic: uses the `debug-trigger-encounter-encounter` dev
// button (components/DebugTriggerEncounter.tsx), which arms the
// combat-prelude in-place on the WILDS tab immediately — no map walk,
// no RNG. The modal auto-engages (2026-08-10: the ENGAGE/FLEE prelude
// popup is retired), so the armed state to assert on is the combat
// REVEAL. WITHDRAW — retreat's new home, on the reveal beside ENTER
// COMBAT — closes the round trip: `fleeEncounter` is an unconditional
// morale shift, no dice roll, so the return path is as deterministic as
// the open. `scripts/combat-encounter-e2e.mjs` already covers playing a
// live hazard combat to resolution — duplicating that here would be
// redundant, not new coverage.
//
// Usage:
//   node scripts/exploration-combat-roundtrip-e2e.mjs
//   ROUNDTRIP_E2E_REUSE_EXPORT=1 node scripts/...
//   ROUNDTRIP_E2E_CHROME=/path/to/chrome node scripts/...
//
// Exit codes: 0 = round trip clean · 1 = assertion failed ·
// 3 = boot failure (export / server / browser).

import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const EXPORT_DIR = resolve(REPO_ROOT, '.smoke-dist')
const VIEWPORT = { width: 390, height: 844 }

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.json': 'application/json; charset=utf-8',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
}

function log(msg) {
    console.log(`exploration-combat-roundtrip-e2e: ${msg}`)
}

function fail(msg) {
    console.error(`exploration-combat-roundtrip-e2e: FAIL — ${msg}`)
    process.exitCode = 1
    throw new Error(msg)
}

// ---------------------------------------------------------------------------
// Export + static server (mirrors scripts/encounter-routing-e2e.mjs)
// ---------------------------------------------------------------------------

function runExpoExport() {
    if (existsSync(EXPORT_DIR) && process.env.ROUNDTRIP_E2E_REUSE_EXPORT === '1') {
        log('reusing existing .smoke-dist (ROUNDTRIP_E2E_REUSE_EXPORT=1)')
        return
    }
    log('running `expo export --platform web` → .smoke-dist ...')
    const result = spawnSync(
        'npx',
        ['expo', 'export', '--platform', 'web', '--output-dir', EXPORT_DIR],
        {
            cwd: REPO_ROOT,
            stdio: 'inherit',
            // Dev tools (SELF → `self-dev-tools-link` → `/dev` →
            // Debug* buttons) only mount when `isDevToolsEnabled()` is
            // true; `app.config.ts` bakes that in for non-production
            // BUILD_PROFILE.
            env: { ...process.env, BUILD_PROFILE: 'preview' },
        },
    )
    if (result.status !== 0) {
        console.error('exploration-combat-roundtrip-e2e: expo export failed')
        process.exit(3)
    }
}

async function fileCandidate(requestedPath) {
    try {
        const info = await stat(requestedPath)
        return { requestedPath, exists: true, isDirectory: info.isDirectory() }
    } catch {
        return { requestedPath, exists: false, isDirectory: false }
    }
}

function startStaticServer(rootDir) {
    return new Promise((resolveServer, rejectServer) => {
        const server = createServer(async (req, res) => {
            try {
                const url = new URL(req.url, 'http://localhost')
                let pathname = decodeURIComponent(url.pathname)
                if (pathname.endsWith('/')) pathname += 'index.html'
                const filePath = join(rootDir, pathname)
                if (!filePath.startsWith(rootDir)) {
                    res.statusCode = 403
                    return res.end('forbidden')
                }
                const candidates = [
                    await fileCandidate(filePath),
                    await fileCandidate(join(filePath, 'index.html')),
                    await fileCandidate(join(rootDir, pathname + '.html')),
                    await fileCandidate(join(rootDir, 'index.html')),
                ]
                const chosen =
                    (candidates[0].exists && !candidates[0].isDirectory && candidates[0].requestedPath) ||
                    (candidates[1].exists && !candidates[1].isDirectory && candidates[1].requestedPath) ||
                    (candidates[2].exists && !candidates[2].isDirectory && candidates[2].requestedPath) ||
                    candidates[3].requestedPath
                const body = await readFile(chosen)
                res.setHeader('content-type', MIME[extname(chosen)] ?? 'application/octet-stream')
                res.end(body)
            } catch (err) {
                res.statusCode = 500
                res.end(String(err))
            }
        })
        server.listen(0, '127.0.0.1', () => {
            const { port } = server.address()
            resolveServer({ server, baseUrl: `http://127.0.0.1:${port}` })
        })
        server.on('error', rejectServer)
    })
}

/** Navigate from the SELF tab into the dev controls (mirrors encounter-routing-e2e.mjs). */
async function openDevTools(page) {
    await page.getByTestId('self-dev-tools-link').waitFor({ state: 'visible', timeout: 15000 })
    await page.getByTestId('self-dev-tools-link').click()
    await page.waitForURL((url) => url.pathname.endsWith('/dev'), { timeout: 10000 })
}

// react-navigation's web tab bar can leave a hidden/duplicate node with
// the same aria-label mounted alongside the live one during a
// lock/unlock transition (confirmed via manual DOM inspection — not a
// product bug, just DOM noise); `:visible` filters to the one(s)
// actually on screen.
const CHARACTER_TAB = '[aria-label="Character tab"]:visible'

// ---------------------------------------------------------------------------
// The round trip
// ---------------------------------------------------------------------------

async function runRoundTrip(page, baseUrl) {
    // A static web export can't surface `extra.devToolsEnabled` at runtime, so
    // the SELF → /dev affordance this harness drives from needs the documented
    // opt-in (lib/buildProfile.ts) — the same one upgradeable-dice-e2e sets.
    // Inert in real builds: nothing sets the global there.
    await page.addInitScript(() => { globalThis.__AXM_FORCE_DEV_TOOLS__ = true })
    await page.goto(`${baseUrl}/character`, { waitUntil: 'networkidle' })
    await openDevTools(page)

    log('arming the combat-prelude via the COMBAT dev trigger ...')
    const trigger = page.getByTestId('debug-trigger-encounter-encounter')
    await trigger.waitFor({ state: 'visible', timeout: 15000 })
    await trigger.click()

    // The dev trigger jumps to the WILDS tab first, then arms the
    // event — land on /exploration with the modal up.
    await page
        .waitForURL((url) => url.pathname.endsWith('/exploration'), { timeout: 10000 })
        .catch(() => fail('COMBAT trigger did not land on /exploration'))

    await page
        .getByTestId('combat-reveal')
        .waitFor({ state: 'visible', timeout: 10000 })
        .catch(() => fail('combat-prelude armed but the combat reveal never rendered'))

    // The decisive cross-screen assertion: the tab bar must be hidden
    // the instant the modal arms, not just the modal itself present.
    const tabVisibleWhileArmed = await page.locator(CHARACTER_TAB).first().isVisible().catch(() => false)
    if (tabVisibleWhileArmed) {
        fail('tab bar (Character tab) still visible while the encounter modal is armed')
    }
    log('modal armed; tab bar correctly hidden')

    // The first-fight tutorial primer animates in OVER the reveal and swallows
    // pointer events (a fresh store has never seen a fight). Dismiss it before
    // driving the reveal's own buttons — same treatment as combat-encounter-e2e.
    for (let k = 0; k < 5; k++) {
        const skip = page.getByTestId('combat-primer-skip')
        if (!(await skip.count())) break
        await skip.click({ timeout: 2000, force: true }).catch(() => {})
        await page.waitForTimeout(300)
    }

    log('pressing WITHDRAW ...')
    const flee = page.getByTestId('combat-withdraw')
    await flee.waitFor({ state: 'visible', timeout: 10000 })
    await flee.click()

    await page
        .getByTestId('combat-reveal')
        .waitFor({ state: 'hidden', timeout: 10000 })
        .catch(() => fail('modal still present after WITHDRAW'))
    if (await page.getByTestId('encounter-modal-overlay').count()) {
        fail('encounter modal still mounted after WITHDRAW')
    }

    // With the encounter out of the way the screen is idle again, which lets
    // the exploration screen's ARRIVAL event for the map's start node resolve
    // (2026-08-08) — on fishing-village that is an omen cutscene, a full-screen
    // ROUTE with no tab bar of its own. It is not the tab LOCK, so dismiss it
    // before reading the bar, or this harness measures the wrong thing.
    //
    // RACE FIXED 2026-09-19. This used to sample `cutscene-advance` ONCE, the
    // instant after the modal hid. The arrival event resolves a beat later, so
    // when the runner was slow the sample read zero, the dismissal was skipped,
    // and the cutscene then mounted OVER the tab bar — and the harness spent its
    // whole 10s budget waiting for a bar that a full-screen route was covering.
    // It failed exactly that way in CI (run 35457152197) while passing locally
    // on the same commit, which is the signature of a sampled race rather than
    // a product bug: the passing log carries the "took the screen" line and the
    // failing one does not.
    //
    // The fix is to wait for the SETTLED outcome instead of sampling: race the
    // cutscene against the tab bar and act on whichever actually arrives. Either
    // is a legitimate post-WITHDRAW state, so neither is a failure here — the
    // real assertion is the tab-bar one below, which is left untouched.
    await Promise.race([
        page.getByTestId('cutscene-advance').waitFor({ state: 'visible', timeout: 8000 }),
        page.locator(CHARACTER_TAB).first().waitFor({ state: 'visible', timeout: 8000 }),
    ]).catch(() => {})

    if (await page.getByTestId('cutscene-advance').count()) {
        log('start-node arrival cutscene took the screen — playing it out')
        // SKIP only reveals the remaining lines; the scene ends on a tap of the
        // body once every line is up (`cutscene-advance` → `dismissEvent`).
        await page.getByTestId('cutscene-skip').click({ timeout: 5000, force: true }).catch(() => {})
        for (let k = 0; k < 12; k++) {
            if (!(await page.getByTestId('cutscene-advance').count())) break
            await page.getByTestId('cutscene-advance').click({ timeout: 3000, force: true }).catch(() => {})
            await page.waitForTimeout(250)
        }
    }

    await page
        .locator(CHARACTER_TAB)
        .first()
        .waitFor({ state: 'visible', timeout: 10000 })
        .catch(() => fail('tab bar (Character tab) still hidden after WITHDRAW closed the modal'))

    // The map itself — not just the chrome — survived the round trip.
    await page
        .getByTestId('map-canvas-wrapper')
        .waitFor({ state: 'visible', timeout: 10000 })
        .catch(() => fail('map-canvas-wrapper not visible after the round trip'))

    log('round trip clean — modal + tab bar unlocked together, map intact')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    runExpoExport()
    const { server, baseUrl } = await startStaticServer(EXPORT_DIR)
    log(`static server at ${baseUrl}`)

    const { chromium } = await import('playwright')
    const launchOptions = { headless: true }
    if (process.env.ROUNDTRIP_E2E_CHROME) {
        launchOptions.executablePath = process.env.ROUNDTRIP_E2E_CHROME
    }
    const browser = await chromium.launch(launchOptions)
    try {
        const context = await browser.newContext({ viewport: VIEWPORT, hasTouch: false })
        const page = await context.newPage()
        page.on('pageerror', (err) => console.error('exploration-combat-roundtrip-e2e: pageerror', err.message))
        await runRoundTrip(page, baseUrl)
        await context.close()
        log('ALL PASS — exploration/combat-prelude round trip holds')
    } finally {
        await browser.close()
        server.close()
    }
}

main().catch((err) => {
    console.error('exploration-combat-roundtrip-e2e: aborted —', err.message)
    process.exit(process.exitCode || 3)
})
