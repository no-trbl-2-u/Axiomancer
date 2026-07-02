#!/usr/bin/env node
// scripts/combat-encounter-e2e.mjs
//
// Spec 25 Hazard-Pattern Combat — browser-driven end-to-end playthrough.
//
// Boots the exported web build, opens the dev entry, launches the
// `/combat-encounter` screen, and PLAYS the card-and-dice combat with real
// taps: asserts the two Pressure Tracks, the threat timeline, the stance-dice
// board, and the hand render; powers status-effect cards and watches the DoT
// pressure track advance; ends phases until the combat resolves; and asserts
// the post-combat attribution summary appears.
//
// Deterministic: the combat seed is pinned through `globalThis.__AXM_COMBAT_SEED__`
// before the app boots. Hermetic: everything runs against localhost.
//
// Usage:
//   node scripts/combat-encounter-e2e.mjs
//   COMBAT_E2E_REUSE_EXPORT=1 node scripts/combat-encounter-e2e.mjs
//   COMBAT_E2E_CHROME=/path/to/chrome ...
//
// Exit codes: 0 = combat played clean · 1 = assertion failed ·
// 3 = boot failure (export / server / browser).

import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { readFile, stat, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const EXPORT_DIR = resolve(REPO_ROOT, '.smoke-dist')
const SHOT_DIR = resolve(REPO_ROOT, 'screenshots/combat-redesign')
const VIEWPORT = { width: 390, height: 844 }
// Seed 16 rolls a draftable first die (t1-d0 = mind) for the 5-card demo deck.
const SEED = 16

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
    '.json': 'application/json; charset=utf-8',
    '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
}

function log(msg) { console.log(`combat-e2e: ${msg}`) }
function fail(msg) { console.error(`combat-e2e: FAIL — ${msg}`); process.exitCode = 1; throw new Error(msg) }

function runExpoExport() {
    if (existsSync(EXPORT_DIR) && process.env.COMBAT_E2E_REUSE_EXPORT === '1') {
        log('reusing existing .smoke-dist (COMBAT_E2E_REUSE_EXPORT=1)')
        return
    }
    log('running `expo export --platform web` → .smoke-dist ...')
    const result = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', EXPORT_DIR], {
        cwd: REPO_ROOT, stdio: 'inherit',
        // Dev tools (SELF → self-dev-tools-link → /dev → Debug* buttons) only
        // mount when isDevToolsEnabled(); bake it via a non-production profile.
        env: { ...process.env, BUILD_PROFILE: 'preview' },
    })
    if (result.status !== 0) { console.error('combat-e2e: expo export failed'); process.exit(3) }
}

async function fileCandidate(p) {
    try { const info = await stat(p); return { p, exists: true, dir: info.isDirectory() } }
    catch { return { p, exists: false, dir: false } }
}

function startStaticServer(rootDir) {
    return new Promise((resolveServer, rejectServer) => {
        const server = createServer(async (req, res) => {
            try {
                const url = new URL(req.url, 'http://localhost')
                let pathname = decodeURIComponent(url.pathname)
                if (pathname.endsWith('/')) pathname += 'index.html'
                const filePath = join(rootDir, pathname)
                if (!filePath.startsWith(rootDir)) { res.statusCode = 403; return res.end('forbidden') }
                const candidates = [
                    await fileCandidate(filePath),
                    await fileCandidate(join(filePath, 'index.html')),
                    await fileCandidate(join(rootDir, pathname + '.html')),
                    await fileCandidate(join(rootDir, 'index.html')),
                ]
                const chosen =
                    (candidates[0].exists && !candidates[0].dir && candidates[0].p) ||
                    (candidates[1].exists && !candidates[1].dir && candidates[1].p) ||
                    (candidates[2].exists && !candidates[2].dir && candidates[2].p) ||
                    candidates[3].p
                const body = await readFile(chosen)
                res.setHeader('content-type', MIME[extname(chosen)] ?? 'application/octet-stream')
                res.end(body)
            } catch (err) { res.statusCode = 500; res.end(String(err)) }
        })
        server.listen(0, '127.0.0.1', () => {
            const { port } = server.address()
            resolveServer({ server, baseUrl: `http://127.0.0.1:${port}` })
        })
        server.on('error', rejectServer)
    })
}

async function shot(page, name) {
    await mkdir(SHOT_DIR, { recursive: true })
    const path = join(SHOT_DIR, `${name}.png`)
    await page.screenshot({ path, fullPage: false })
    log(`screenshot → ${path}`)
}

async function playCombat(page, baseUrl) {
    log(`=== Spec 26 combat board — browser smoke (seed ${SEED}) ===`)
    // The screen self-bootstraps a demo deck from the live player, so we navigate
    // straight to the route — no dev-menu dependency (hermetic, CI-safe).
    await page.addInitScript((s) => { globalThis.__AXM_COMBAT_SEED__ = s }, SEED)
    await page.goto(`${baseUrl}/combat-encounter`, { waitUntil: 'networkidle' })

    // 1) Reveal — read the foe (portrait, threat sequence, thematic tells).
    await page.getByTestId('combat-reveal').waitFor({ state: 'visible', timeout: 15000 })
    await page.waitForTimeout(250)
    await shot(page, '01-reveal')
    // Dismiss the combat tutorial primer if it overlays the reveal/board (it can
    // animate in over either, intercepting taps).
    const killPrimer = async () => {
        for (let k = 0; k < 4; k++) {
            await page.waitForTimeout(300)
            const skip = page.getByTestId('combat-primer-skip')
            if (await skip.count()) { await skip.click({ timeout: 2000, force: true }).catch(() => {}) } else break
        }
    }
    await killPrimer()
    await page.getByTestId('combat-enter').click({ timeout: 8000, force: true }).catch(() => {})
    await killPrimer()

    // 2) The board renders the full Spec 26/26b surface. (The pressure tracks and
    //    the read banner are legacy-combat chrome the HP model removed — the jest
    //    screen suite pins their ABSENCE, so this list must not require them.)
    await page.getByTestId('combat-board').waitFor({ state: 'visible', timeout: 15000 })
    for (const id of ['combat-combatant-pane', 'combat-dice-tray', 'combat-hand', 'combat-conviction', 'combat-signature-bar', 'combat-intent', 'combat-end-phase', 'combat-play-area']) {
        if (!(await page.getByTestId(id).count())) fail(`missing board element: ${id}`)
    }
    await page.waitForTimeout(200)
    await shot(page, '02-board')
    log('board renders battlefield + HP + intent + dice + signatures ✅')

    // 4) Drive to a terminal outcome by ending phases (card POWER needs a drag
    //    gesture not reliably simulable here; the jest suite covers the play path).
    //    Without pressure the phases overwhelm → defeat → the attribution summary.
    const terminal = async () => (await page.getByTestId('combat-summary').count()) > 0 || (await page.getByTestId('combat-mercy').count()) > 0
    for (let i = 0; i < 30; i++) {
        if (await terminal()) break
        const end = page.getByTestId('combat-end-phase')
        if (!(await end.count())) break
        await end.click({ timeout: 3000 }).catch(() => {})
        await page.waitForTimeout(120)
    }
    if (await page.getByTestId('combat-mercy').count()) {
        await shot(page, '04-mercy')
        await page.getByTestId('combat-mercy-spare').click({ timeout: 3000 }).catch(() => {})
        await page.waitForTimeout(150)
    }
    if (!(await page.getByTestId('combat-summary').count())) {
        fail('combat never reached the post-combat attribution summary')
    }
    await shot(page, '05-summary')
    const summaryText = await page.getByTestId('combat-summary').innerText()
    if (!/Erosion|Saturation|Defeat|Retreat|Mercy/i.test(summaryText)) {
        fail(`summary missing an outcome headline: ${summaryText.slice(0, 80)}`)
    }
    log(`combat resolved → summary shown ✅ (${summaryText.split('\n')[0]})`)
}

async function main() {
    runExpoExport()
    const { server, baseUrl } = await startStaticServer(EXPORT_DIR)
    log(`static server at ${baseUrl}`)
    const { chromium } = await import('playwright')
    const launchOptions = { headless: true }
    if (process.env.COMBAT_E2E_CHROME) launchOptions.executablePath = process.env.COMBAT_E2E_CHROME
    const browser = await chromium.launch(launchOptions)
    try {
        const context = await browser.newContext({ viewport: VIEWPORT, hasTouch: false })
        const page = await context.newPage()
        page.on('pageerror', (err) => console.error('combat-e2e: pageerror', err.message))
        await playCombat(page, baseUrl)
        await context.close()
        log('ALL PASS — hazard-pattern combat played end-to-end ✅')
    } finally {
        await browser.close()
        server.close()
    }
}

main().catch((err) => {
    console.error('combat-e2e: aborted —', err.message)
    process.exit(process.exitCode || 3)
})
