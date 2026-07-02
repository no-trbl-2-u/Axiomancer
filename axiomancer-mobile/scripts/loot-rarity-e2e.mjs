#!/usr/bin/env node
// scripts/loot-rarity-e2e.mjs
//
// Dev-menu LOOT RARITY buttons — browser-driven end-to-end check.
//
// Phase 154 handed every scrap of equipment-generation logic back to
// `axiomancer-mechanics` (`generateRarityDrop`); mobile is now pure glue
// that forwards the player level to the engine, instances the drop, and
// dispatches `addItem`. This harness proves that the seam still holds
// against the *published* engine by driving the real dev affordance:
// boots the exported web build, opens SELF → DEV TOOLS → the `/dev`
// Developer screen, and presses each of the four LOOT buttons (COMMON /
// UNCOMMON / RARE / UNIQUE), asserting the engine's affix contract from
// the on-screen feedback:
//
//   common   → 0 named affixes   ("looted common · <name> · 0 mods")
//   uncommon → 1 named affix      ("looted uncommon · <name> · 1 mod")
//   rare     → 2 named affixes    ("looted rare · <name> · 2 mods")   ← critical
//   unique   → 3 fixed modifiers  ("looted unique · <name> · 3 mods")
//
// Uniques gate by level, so the harness applies the L30 player-tier
// preset before pressing LOOT UNIQUE (at L1 the engine reports a graceful
// "no unique relic is available at level 1" — covered as a negative case).
//
// Hermetic: everything runs against localhost. No RNG seeding — the
// assertions key off the rarity contract (affix count), which holds for
// every roll, not off any one item id.
//
// Usage:
//   node scripts/loot-rarity-e2e.mjs                  # export + run
//   LOOT_E2E_REUSE_EXPORT=1 node scripts/loot-rarity-e2e.mjs
//   LOOT_E2E_CHROME=/path/to/chrome ...               # custom browser binary
//   LOOT_E2E_SCREENSHOTS=1 ...                        # dump step screenshots
//
// Exit codes: 0 = every rarity honoured its contract · 1 = assertion
// failed · 3 = boot failure (export / server / browser).

import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { readFile, mkdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const EXPORT_DIR = resolve(REPO_ROOT, '.smoke-dist')
const SHOT_DIR = resolve(REPO_ROOT, 'screenshots/loot-rarity-e2e')

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
    console.log(`loot-rarity-e2e: ${msg}`)
}

function fail(msg) {
    console.error(`loot-rarity-e2e: FAIL — ${msg}`)
    process.exitCode = 1
    throw new Error(msg)
}

// ---------------------------------------------------------------------------
// Export + static server (mirrors scripts/hazard-e2e.mjs)
// ---------------------------------------------------------------------------

function runExpoExport() {
    if (existsSync(EXPORT_DIR) && process.env.LOOT_E2E_REUSE_EXPORT === '1') {
        log('reusing existing .smoke-dist (LOOT_E2E_REUSE_EXPORT=1)')
        return
    }
    log('running `expo export --platform web` → .smoke-dist ...')
    const result = spawnSync(
        'npx',
        ['expo', 'export', '--platform', 'web', '--output-dir', EXPORT_DIR],
        {
            cwd: REPO_ROOT,
            stdio: 'inherit',
            // The dev affordance (SELF → `self-dev-tools-link` → `/dev` →
            // the Debug* buttons) only mounts when `isDevToolsEnabled()` is
            // true. In an export build `__DEV__` is false, so we bake
            // `extra.devToolsEnabled=true` into the bundle —
            // `app.config.ts` does that for any non-`production`
            // BUILD_PROFILE. Without this the buttons never render.
            env: { ...process.env, BUILD_PROFILE: 'preview' },
        },
    )
    if (result.status !== 0) {
        console.error('loot-rarity-e2e: expo export failed')
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
    if (process.env.LOOT_E2E_SCREENSHOTS !== '1') return
    await mkdir(SHOT_DIR, { recursive: true })
    shotIndex += 1
    await page.screenshot({ path: join(SHOT_DIR, `${String(shotIndex).padStart(2, '0')}-${name}.png`) })
}

// ---------------------------------------------------------------------------
// The playthrough
// ---------------------------------------------------------------------------

/**
 * Open the dev controls (SELF → DEV TOOLS → the `/dev` Developer screen),
 * matching the route hand-off the other minigame harnesses use.
 */
async function openDevTools(page) {
    await page.getByTestId('self-dev-tools-link').waitFor({ state: 'visible', timeout: 15000 })
    await page.getByTestId('self-dev-tools-link').click()
    await page.waitForURL((url) => url.pathname.endsWith('/dev'), { timeout: 10000 })
    await page.getByTestId('debug-loot-rare-button').waitFor({ state: 'visible', timeout: 15000 })
}

/** Press one LOOT button and return its trimmed feedback line. */
async function pressLoot(page, rarity) {
    const button = page.getByTestId(`debug-loot-${rarity}-button`)
    await button.scrollIntoViewIfNeeded()
    await button.click()
    // The feedback Text re-renders synchronously on press; give the DOM a
    // beat to flush before reading.
    await page.waitForTimeout(120)
    const text = (await page.getByTestId('debug-loot-rarity-feedback').innerText()).trim()
    await shot(page, `loot-${rarity}`)
    return text
}

/** Assert the feedback honours the engine's affix contract for `rarity`. */
function assertContract(rarity, expectedMods, text) {
    if (!text.includes(`looted ${rarity}`)) {
        fail(`${rarity}: feedback did not confirm a drop — got "${text}"`)
    }
    const match = text.match(/·\s*(\d+)\s*mods?\s*$/)
    if (!match) fail(`${rarity}: feedback is missing a mod count — got "${text}"`)
    const mods = Number(match[1])
    if (mods !== expectedMods) {
        fail(`${rarity}: expected ${expectedMods} mods, engine rolled ${mods} — "${text}"`)
    }
    log(`${rarity}: ${text}  ✅`)
}

async function main() {
    runExpoExport()
    const { server, baseUrl } = await startStaticServer(EXPORT_DIR)
    log(`static server at ${baseUrl}`)

    const { chromium } = await import('playwright')
    const launchOptions = { headless: true }
    if (process.env.LOOT_E2E_CHROME) {
        launchOptions.executablePath = process.env.LOOT_E2E_CHROME
    }
    const browser = await chromium.launch(launchOptions)
    try {
        const context = await browser.newContext({ viewport: VIEWPORT, hasTouch: false })
        const page = await context.newPage()
        page.on('pageerror', (err) => fail(`page error during loot: ${err.message}`))

        await page.goto(`${baseUrl}/character`, { waitUntil: 'networkidle' })
        await openDevTools(page)
        log('opened /dev — LOOT RARITY controls visible')

        // Common / uncommon / rare all generate eligible drops at the
        // starting level. Assert each rarity's affix contract.
        assertContract('common', 0, await pressLoot(page, 'common'))
        assertContract('uncommon', 1, await pressLoot(page, 'uncommon'))
        assertContract('rare', 2, await pressLoot(page, 'rare'))

        // Negative case: uniques gate by level, so at L1 the engine
        // refuses gracefully (no throw, visible reason).
        const lowUnique = await pressLoot(page, 'unique')
        if (lowUnique.includes('looted unique')) {
            log(`unique available at the starting level: ${lowUnique}`)
            assertContract('unique', 3, lowUnique)
        } else {
            if (!/no unique relic is available at level/i.test(lowUnique)) {
                fail(`unique@L1: expected a graceful level gate, got "${lowUnique}"`)
            }
            log(`unique@L1: graceful gate — "${lowUnique}"  ✅`)
            // Level the player up via the L30 tier preset, then the unique
            // success path should open.
            await page.getByTestId('debug-player-tier-kid-l30').scrollIntoViewIfNeeded()
            await page.getByTestId('debug-player-tier-kid-l30').click()
            await page.waitForTimeout(150)
            assertContract('unique', 3, await pressLoot(page, 'unique'))
        }

        log('ALL PASS — every rarity honoured the engine affix contract ✅')
    } finally {
        await browser.close()
        server.close()
    }
}

main().catch((err) => {
    console.error('loot-rarity-e2e: aborted —', err.message)
    process.exit(process.exitCode || 3)
})
