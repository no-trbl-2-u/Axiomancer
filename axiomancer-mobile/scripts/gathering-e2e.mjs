#!/usr/bin/env node
// scripts/gathering-e2e.mjs
//
// Gathering minigame ("The Gleaning") — browser-driven end-to-end
// playthrough.
//
// Boots the exported web build, opens the dev entry, and plays the
// minigame for BOTH stances:
//
//   GLEAN  — reads the site intro, inspects a plot's detail view,
//            takes plots, uses a field tool, descends a stratum, and
//            WITHDRAWS clean: outcome → spoils ledger → claim.
//   STRIP  — takes greedily until the site's WRATH meter fills:
//            asserts the reprisal flashes fire on the way up, the
//            ERUPTION interrupts, the outcome reads ROUTED, and the
//            ledger reports pieces lost to the site.
//
// Deterministic: the gathering RNG seed + site are pinned through the
// dev hooks (`globalThis.__AXM_GATHER_SEED__` / `__AXM_GATHER_SITE__`)
// before the app boots. Hermetic: everything runs against localhost.
//
// Usage:
//   node scripts/gathering-e2e.mjs               # export + run
//   GATHER_E2E_REUSE_EXPORT=1 node scripts/gathering-e2e.mjs
//   GATHER_E2E_CHROME=/path/to/chrome ...        # custom browser binary
//   GATHER_E2E_SCREENSHOTS=1 ...                 # dump step screenshots
//
// Exit codes: 0 = both stances played clean · 1 = assertion failed ·
// 3 = boot failure (export / server / browser).

import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { readFile, mkdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const EXPORT_DIR = resolve(REPO_ROOT, '.smoke-dist')
const SHOT_DIR = resolve(REPO_ROOT, 'screenshots/gathering-e2e')

const VIEWPORT = { width: 390, height: 844 }
const GLEAN_SEED = 9090
const STRIP_SEED = 7171

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
    console.log(`gathering-e2e: ${msg}`)
}

function fail(msg) {
    console.error(`gathering-e2e: FAIL — ${msg}`)
    process.exitCode = 1
    throw new Error(msg)
}

// ---------------------------------------------------------------------------
// Export + static server (mirrors scripts/hazard-e2e.mjs)
// ---------------------------------------------------------------------------

function runExpoExport() {
    if (existsSync(EXPORT_DIR) && process.env.GATHER_E2E_REUSE_EXPORT === '1') {
        log('reusing existing .smoke-dist (GATHER_E2E_REUSE_EXPORT=1)')
        return
    }
    log('running `expo export --platform web` → .smoke-dist ...')
    const result = spawnSync(
        'npx',
        ['expo', 'export', '--platform', 'web', '--output-dir', EXPORT_DIR],
        {
            cwd: REPO_ROOT,
            stdio: 'inherit',
            // The harness drives the dev tools (SELF → `self-dev-tools-link`
            // → the `/dev` Developer screen → the Debug* entry buttons), which
            // only mount when `isDevToolsEnabled()` is true. In an export build
            // `__DEV__` is false, so we must bake `extra.devToolsEnabled=true`
            // into the bundle — `app.config.ts` does that for any
            // non-`production` BUILD_PROFILE. Without this the dev affordance
            // never renders and the playthrough times out waiting for
            // `self-dev-tools-link`.
            env: { ...process.env, BUILD_PROFILE: 'preview' },
        },
    )
    if (result.status !== 0) {
        console.error('gathering-e2e: expo export failed')
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
                let filePath = join(rootDir, pathname)
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

let shotIndex = 0
async function shot(page, name) {
    if (process.env.GATHER_E2E_SCREENSHOTS !== '1') return
    await mkdir(SHOT_DIR, { recursive: true })
    shotIndex += 1
    await page.screenshot({ path: join(SHOT_DIR, `${String(shotIndex).padStart(2, '0')}-${name}.png`) })
}

// ---------------------------------------------------------------------------
// Board readers
// ---------------------------------------------------------------------------

async function satchelPieces(page) {
    const text = await page.getByTestId('gathering-satchel').innerText()
    const match = text.match(/(\d+)\s+pieces/)
    return match ? Number(match[1]) : 0
}

async function wrathValue(page) {
    const label = await page
        .locator('[aria-label^="Wrath "]')
        .first()
        .getAttribute('aria-label')
        .catch(() => null)
    const match = label?.match(/Wrath (\d+) of/)
    return match ? Number(match[1]) : null
}

/**
 * Poll a container's innerText until every needle appears (reanimated
 * `entering` delays mount copy over the first ~second of a phase).
 */
async function waitForCopy(page, testId, needles, timeoutMs = 6000) {
    const deadline = Date.now() + timeoutMs
    let text = ''
    while (Date.now() < deadline) {
        text = await page.getByTestId(testId).innerText().catch(() => '')
        if (needles.every((n) => text.includes(n))) return text
        await page.waitForTimeout(200)
    }
    fail(`${testId} never showed: ${needles.filter((n) => !text.includes(n)).join(' / ')}`)
}

/** Dismiss any reprisal flash; returns the flash's headline text or null. */
async function dismissReprisal(page) {
    const flash = page.getByTestId('gathering-reprisal')
    if (!(await flash.isVisible().catch(() => false))) return null
    const text = await flash.innerText()
    await shot(page, 'reprisal')
    await flash.click()
    await flash.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
    return text
}

// ---------------------------------------------------------------------------
// Shared entry: dev tools → intro → approach select
// ---------------------------------------------------------------------------

/**
 * Navigate from the SELF tab into the dev controls.
 *
 * Phase 132 extracted the inline `DevMenu` dropdown (the old
 * `dev-menu-header` affordance) into a dedicated `/dev` route reached
 * by the `self-dev-tools-link` row on the SELF sheet. The Debug* entry
 * buttons now live on that Developer screen, so the harness taps the
 * link and waits for the route before looking for them.
 */
async function openDevTools(page) {
    await page.getByTestId('self-dev-tools-link').waitFor({ state: 'visible', timeout: 15000 })
    await page.getByTestId('self-dev-tools-link').click()
    await page.waitForURL((url) => url.pathname.endsWith('/dev'), { timeout: 10000 })
}

async function enterGathering(page, baseUrl, { seed, site }) {
    await page.addInitScript(
        ({ s, id }) => {
            globalThis.__AXM_GATHER_SEED__ = s
            globalThis.__AXM_GATHER_SITE__ = id
        },
        { s: seed, id: site },
    )
    await page.goto(`${baseUrl}/character`, { waitUntil: 'networkidle' })

    await openDevTools(page)
    await page.getByTestId('debug-gathering-button').waitFor({ state: 'visible', timeout: 15000 })
    await page.getByTestId('debug-gathering-button').click()

    // Phase: site reveal — the hushed intro owns the screen. Its copy
    // mounts behind reanimated entering delays, so poll for it.
    await page.getByTestId('gathering-intro').waitFor({ state: 'visible', timeout: 15000 })
    await waitForCopy(page, 'gathering-intro', ['A PLACE THAT GIVES'])
    await shot(page, 'site-intro')
    await page.getByTestId('gathering-intro-continue').click()
    await page.getByTestId('gathering-intro').waitFor({ state: 'hidden', timeout: 5000 })

    // Phase: approach select — the verge spread is already face-up.
    await page.getByTestId('gathering-approach-select').waitFor({ state: 'visible', timeout: 15000 })
    await page.getByTestId('gathering-opening-spread').waitFor({ state: 'visible' })
    await waitForCopy(page, 'gathering-approach-select', ['THE TENDER HAND', 'THE STRIPPING HAND'])
    await shot(page, 'approach-select')
}

/** TAKE buttons only (skips TEND/breath plots so wrath actually climbs). */
function takeButtons(page) {
    return page.locator('[data-testid^="gathering-take-"]', { hasText: 'TAKE' })
}

// ---------------------------------------------------------------------------
// GLEAN — restraint: inspect, take, tool, descend, withdraw clean.
// ---------------------------------------------------------------------------

async function playGlean(page, baseUrl) {
    log('=== GLEAN stance (the tender hand) ===')
    await enterGathering(page, baseUrl, { seed: GLEAN_SEED, site: 'mire-mint' })
    await page.getByTestId('gathering-approach-glean').click()
    await page.getByTestId('gathering-board').waitFor({ state: 'visible', timeout: 10000 })

    const boardText = await page.getByTestId('gathering-board').innerText()
    if (!boardText.includes('WRATH')) fail('the wrath meter is missing from the board')
    if (!boardText.includes('THE SATCHEL')) fail('the satchel tray is missing from the board')
    if (!boardText.includes('THE VERGE')) fail('the stratum ribbon is missing THE VERGE')
    await shot(page, 'glean-board')

    // Inspect a plot: card face → detail overlay with keywords → close.
    await page.locator('[data-testid^="gathering-plot-"]').first().click()
    await page.getByTestId('gathering-plot-detail').waitFor({ state: 'visible', timeout: 5000 })
    const detailText = await page.getByTestId('gathering-plot-detail').innerText()
    if (!detailText.includes('WRATH')) fail('plot detail is missing its keyword call-outs')
    await shot(page, 'glean-plot-detail')
    // Tap the backdrop (top strip area) to close without taking.
    await page.getByTestId('gathering-plot-detail').click({ position: { x: 12, y: 12 } })
    await page.getByTestId('gathering-plot-detail').waitFor({ state: 'hidden', timeout: 5000 })

    // Take two plots; the satchel must grow by exactly the takings.
    for (let i = 1; i <= 2; i++) {
        const before = await satchelPieces(page)
        await takeButtons(page).first().click()
        await dismissReprisal(page)
        const after = await satchelPieces(page)
        if (after !== before + 1) fail(`taking ${i} did not land in the satchel (${before}→${after})`)
        log(`took plot ${i} (satchel ${after} pieces)`)
    }

    // Spend a field tool; the chip must read spent.
    const tool = page.locator('[data-testid^="gathering-tool-"]').first()
    const toolId = await tool.getAttribute('data-testid')
    await tool.click()
    await page.waitForTimeout(150)
    const toolText = await page.getByTestId(toolId).innerText()
    if (!toolText.includes('spent')) fail(`field tool did not spend (${toolId})`)
    log(`spent a field tool (${toolId})`)

    // Descend one stratum — one-way, fresh spread.
    await page.getByTestId('gathering-descend').click()
    await page.waitForTimeout(250)
    const descended = await page.getByTestId('gathering-board').innerText()
    if (!descended.includes('THE WET HOLLOW')) fail('descend did not reach THE WET HOLLOW')
    log('descended to THE WET HOLLOW')
    await shot(page, 'glean-descended')

    // Take once at depth, then WITHDRAW with the satchel.
    await takeButtons(page).first().click()
    await dismissReprisal(page)
    const kept = await satchelPieces(page)
    await page.getByTestId('gathering-withdraw').click()

    // Phase: outcome — a clean exit can never read ROUTED.
    await page.getByTestId('gathering-outcome').waitFor({ state: 'visible', timeout: 5000 })
    let tier = null
    for (let attempt = 0; attempt < 25 && !tier; attempt++) {
        const text = await page.getByTestId('gathering-outcome').innerText()
        if (text.includes('COMMUNION')) tier = 'communion'
        else if (text.includes('LADEN')) tier = 'laden'
        else if (text.includes('DESPOILED')) tier = 'despoiled'
        else if (text.includes('ROUTED')) tier = 'routed'
        if (!tier) await page.waitForTimeout(200)
    }
    if (!tier) fail('outcome verdict word never appeared')
    if (tier === 'routed') fail('a voluntary withdrawal must never read ROUTED')
    log(`outcome: ${tier} (kept ${kept} pieces)`)
    await shot(page, 'glean-outcome')
    await page.getByTestId('gathering-outcome-continue').click()

    // Phase: the weighing — ledger lists the carried stacks; claim closes.
    await page.getByTestId('gathering-spoils').waitFor({ state: 'visible', timeout: 5000 })
    await waitForCopy(page, 'gathering-spoils', ['CARRIED OUT'])
    await shot(page, 'glean-spoils')
    await page.getByTestId('gathering-spoils-confirm').click()
    await page.getByTestId('gathering-spoils').waitFor({ state: 'hidden', timeout: 5000 })
    log('GLEAN: withdrew, weighed, and claimed clean ✅')
}

// ---------------------------------------------------------------------------
// STRIP — greed: take until the site erupts; assert the rout.
// ---------------------------------------------------------------------------

async function playStrip(page, baseUrl) {
    log('=== STRIP stance (the stripping hand) ===')
    await enterGathering(page, baseUrl, { seed: STRIP_SEED, site: 'bone-orchard' })
    await page.getByTestId('gathering-approach-strip').click()
    await page.getByTestId('gathering-board').waitFor({ state: 'visible', timeout: 10000 })

    let sawEruption = false
    let reprisals = 0
    let lastWrath = (await wrathValue(page)) ?? 0
    let guard = 0
    while (guard++ < 40) {
        // Outcome appearing means the eruption flowed through.
        if (await page.getByTestId('gathering-outcome').isVisible().catch(() => false)) break
        const flashText = await dismissReprisal(page)
        if (flashText) {
            reprisals += 1
            if (flashText.includes('THE SITE ERUPTS')) {
                sawEruption = true
                log(`the site erupted after ${guard} steps (${reprisals} reprisal flashes)`)
                // An eruption always ends the gleaning — the outcome is next.
                break
            }
            continue
        }
        const takes = takeButtons(page)
        if ((await takes.count()) > 0) {
            await takes.first().click()
            await page.waitForTimeout(120)
            const wrath = await wrathValue(page)
            if (wrath !== null) lastWrath = wrath
            continue
        }
        // Spread dry of takings — dig deeper; at the root, walk out.
        const descend = page.getByTestId('gathering-descend')
        const canDescend = await descend.isEnabled().catch(() => false)
        if (canDescend) {
            await descend.click()
            await page.waitForTimeout(200)
            continue
        }
        await page.getByTestId('gathering-withdraw').click()
        break
    }

    if (!sawEruption) fail(`greed never erupted the site (wrath peaked at ${lastWrath})`)
    if (reprisals < 2) fail(`expected the threshold reprisals before the eruption (saw ${reprisals})`)

    await page.getByTestId('gathering-outcome').waitFor({ state: 'visible', timeout: 5000 })
    let routed = false
    for (let attempt = 0; attempt < 25 && !routed; attempt++) {
        const text = await page.getByTestId('gathering-outcome').innerText()
        if (text.includes('ROUTED')) routed = true
        if (!routed) await page.waitForTimeout(200)
    }
    if (!routed) fail('an eruption must read ROUTED')
    await shot(page, 'strip-routed')
    await page.getByTestId('gathering-outcome-continue').click()

    await page.getByTestId('gathering-spoils').waitFor({ state: 'visible', timeout: 5000 })
    await waitForCopy(page, 'gathering-spoils', ['LOST TO THE SITE'])
    await shot(page, 'strip-spoils')
    await page.getByTestId('gathering-spoils-confirm').click()
    await page.getByTestId('gathering-spoils').waitFor({ state: 'hidden', timeout: 5000 })
    log('STRIP: erupted, routed, and settled the cost ✅')
}

// ---------------------------------------------------------------------------
// TUTORIAL — the guided first gleaning: coach rides the board, SKIP works.
// ---------------------------------------------------------------------------

async function playTutorial(page, baseUrl) {
    log('=== TUTORIAL (the guided first gleaning) ===')
    await page.goto(`${baseUrl}/character`, { waitUntil: 'networkidle' })
    await openDevTools(page)
    await page.getByTestId('debug-gathering-tutorial-button').waitFor({ state: 'visible', timeout: 15000 })
    await page.getByTestId('debug-gathering-tutorial-button').click()

    await page.getByTestId('gathering-intro').waitFor({ state: 'visible', timeout: 15000 })
    await waitForCopy(page, 'gathering-intro', ['A PLACE THAT GIVES'])
    await page.getByTestId('gathering-intro-continue').click()

    // The coach owns step 1 over the approach screen.
    await page.getByTestId('gathering-tutorial').waitFor({ state: 'visible', timeout: 10000 })
    await waitForCopy(page, 'gathering-tutorial', ['THE PLACE IS WATCHING'])
    await shot(page, 'tutorial-step1')

    // Follow it one step: choose the tender hand → the TAKE step appears.
    await page.getByTestId('gathering-approach-glean').click()
    await waitForCopy(page, 'gathering-tutorial', ['TAKE SOMETHING'])
    await shot(page, 'tutorial-step2')

    // SKIP dismisses the coach for good; the session keeps running.
    await page.getByTestId('gathering-tutorial-skip').click()
    await page.getByTestId('gathering-tutorial').waitFor({ state: 'hidden', timeout: 5000 })
    if (!(await page.getByTestId('gathering-board').isVisible())) {
        fail('skipping the tutorial must leave the session running')
    }
    log('TUTORIAL: coached, advanced, and skipped clean ✅')
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
    if (process.env.GATHER_E2E_CHROME) {
        launchOptions.executablePath = process.env.GATHER_E2E_CHROME
    }
    const browser = await chromium.launch(launchOptions)
    try {
        for (const play of [playGlean, playStrip, playTutorial]) {
            const context = await browser.newContext({ viewport: VIEWPORT, hasTouch: false })
            const page = await context.newPage()
            page.on('pageerror', (err) => console.error('gathering-e2e: pageerror', err.message))
            await play(page, baseUrl)
            await context.close()
        }
        log('ALL PASS — both stances played end-to-end ✅')
    } finally {
        await browser.close()
        server.close()
    }
}

main().catch((err) => {
    console.error('gathering-e2e: aborted —', err.message)
    process.exit(process.exitCode || 3)
})
